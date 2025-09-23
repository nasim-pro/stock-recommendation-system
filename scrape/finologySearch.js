// scrape/finologySearch.js
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHeaders() {
    return {
        'User-Agent': USER_AGENTS[0],
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://ticker.finology.in/',
        'X-Requested-With': 'XMLHttpRequest',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
    };
}

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 20000,
    maxRedirects: 5,
}));

async function preflight() {
    try {
        // Step 1: hit homepage to set initial cookies
        await client.get('https://ticker.finology.in', {
            headers: getHeaders()
        });
        await sleep(randomInt(400, 1000));

        console.log('Preflight successful, cookies set.');
    } catch (err) {
        console.error('Preflight request failed:', err.message || err.code);
    }
}

/**
 * Search company on Finology Ticker
 * @param {string} query - stock symbol or part of company name
 */
export async function searchFinology(query) {
    const url = `https://ticker.finology.in/GetSearchData.ashx?q=${encodeURIComponent(query)}`;

    try {
        await preflight();
        const response = await client.get(url, {
            headers: getHeaders()
        });

        return response?.data;
    } catch (err) {
        console.error('Error searching Finology:', err.response?.status, err.message);
        return null;
    }
}

