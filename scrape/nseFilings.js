// scrape/nseFilings.js
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// Rotate between browsers
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
];

// Pick ONE UA for this run
const CHOSEN_UA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        'User-Agent': CHOSEN_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.nseindia.com',
        'Referer': 'https://www.nseindia.com/companies-listing/corporate-integrated-filing?integratedType=integratedfilingfinancials',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
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
        // Step 1: visit homepage
        await client.get('https://www.nseindia.com', {
            headers: getHeaders()
        });
        await sleep(randomInt(600, 1500));

        // Step 2: visit filings page to set nseappid cookies
        await client.get('https://www.nseindia.com/companies-listing/corporate-integrated-filing?integratedType=integratedfilingfinancials', {
            headers: getHeaders()
        });

        console.log('Preflight successful, cookies set.');
        await sleep(randomInt(600, 1500));
    } catch (err) {
        console.log('Preflight request failed:', err.message || err.code);
    }
}

export async function fetchNSEFinancialFilings(page = 1, size = 40) {
    const url = `https://www.nseindia.com/api/integrated-filing-results?&type=Integrated%20Filing-%20Financials&page=${page}&size=${size}`;
    try {
        jar.removeAllCookiesSync();
        await sleep(randomInt(600, 1500));
        await preflight();
        const response = await client.get(url, {
            headers: getHeaders()
        });
        // console.log(" response?.data?.data;", response?.data?.data);
        const filings = removeDuplicatesBySymbol(response?.data?.data)
        return filings;
    } catch (err) {
        try {
            await sleep(randomInt(600, 1500));
            jar.removeAllCookiesSync();
            await sleep(randomInt(600, 1500));
            await preflight();
            const response = await client.get(url, {
                headers: getHeaders()
            });
            // console.log(" response?.data?.data;", response?.data?.data);
            const filings = removeDuplicatesBySymbol(response?.data?.data)
            return filings;
        } catch (err) {
            console.error('Error fetching NSE filings:', err.response?.status, err.message);
            return null
        }
    }
}

function removeDuplicatesBySymbol(arr) {
    const seen = new Set();
    return arr.filter(item => {
        if (seen.has(item?.symbol)) {
            return false; // duplicate
        }
        seen.add(item?.symbol);
        return true; // keep first occurrence
    });
}

// // Example usage
// (async () => {
//     const data = await fetchNSEFinancialFilings();
//     console.log(JSON.stringify(data, null, 2));
// })();

