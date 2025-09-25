// scrape/bseFilings.js
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// List of user agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
];

// Pick ONE UA for this run
const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        'User-Agent': CHOSEN_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.bseindia.com',
        'Referer': 'https://www.bseindia.com/corporates/ann.aspx',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty'
    };
}

// Cookie jar + axios wrapper
const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 20000,
    maxRedirects: 5,
}));

async function preflight() {
    try {
        await client.get('https://www.bseindia.com', { headers: getHeaders() });
        await sleep(800);

        await client.get('https://www.bseindia.com/corporates/ann.html', { headers: getHeaders() });
        console.log('BSE Preflight successful, cookies set.');
        await sleep(1000);
    } catch (err) {
        console.log('BSE Preflight failed:', err.message || err.code);
    }
}

/**
 * Converts a Date object to YYYYMMDD string
 * @param {Date} date - JavaScript Date object
 * @returns {string} - formatted date in YYYYMMDD
 */
function formatDateYYYYMMDD(date) {
    const yyyy = date.getFullYear(); // 4-digit year
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

function removeBseDuplicates(arr) {
    const seen = new Set();
    return arr.filter(item => {
        const keySource = item?.scripCode ?? item?.company ?? "";
        const key = keySource.toString().trim().toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}


/**
 * Fetch BSE financial results for yesterday
 */
export async function fetchBSEFinancialResults() {
    const page = 1;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = formatDateYYYYMMDD(yesterday)
    const toDate = formatDateYYYYMMDD(yesterday)

    const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=${page}&strCat=Result&strPrevDate=${fromDate}&strScrip=&strSearch=P&strToDate=${toDate}&strType=C&subcategory=Financial+Results`;

    try {
        jar.removeAllCookiesSync();
        await sleep(700);
        await preflight();

        const response = await client.get(url, { headers: getHeaders() });

        const rawData = response?.data || {};
        const results = (rawData?.Table || []).map(item => ({
            id: item.NEWSID,
            company: item?.SLONGNAME,
            scripCode: item?.SCRIP_CD,
            date: item?.NEWS_DT || item?.NEWS_DT || item?.News_submission_dt,
            headline: item?.HEADLINE,
        }));

        const uniqueResult = removeBseDuplicates(results)
        return uniqueResult;
    } catch (err) {
        console.error('Error fetching BSE filings:', err.response?.status, err.message);
        return null;
    }
}

// // Example usage
// (async () => {
//     const data = await fetchBSEFinancialResults();
//     console.log(JSON.stringify(data, null, 2));
// })();