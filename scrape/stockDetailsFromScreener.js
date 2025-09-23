/**
 * scrape-nse.js
 *
 * Scrapes NSE corporate filings (financial results) and returns only
 * quarterly filings posted TODAY (company name + reported release date/time).
 *
 * Uses axios + cheerio. Includes polite anti-detection measures:
 * - cookie jar
 * - rotating User-Agent strings
 * - browser-like headers
 * - randomized small delays & retries with exponential backoff
 * - optional proxy support via environment variable
 *
 * Note: This is a practical scraper for monitoring; obey NSE's robots/ToS.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
// import stockMapping from "../symbol-code-mapping/stock_mapping.json" assert { type: "json" };
import { searchFinology } from './finologySearch.js'
/**
 * Returns the BSE scrip code for a given symbol.
 * @param {string} symbol - Stock symbol (e.g., "RELIANCE")
 * @returns {string|null} - Scrip code if found, otherwise null
 */
export function getScripCode(symbol) {
    const mapping = stockMapping.find(m => m.symbol.toUpperCase() === symbol.toUpperCase());
    return mapping?.scripCode || null;
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
];

// Browser-like headers
const defaultHeaders = {
    'User-Agent': USER_AGENTS[0],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document'
};

// cookie jar + axios wrapper for session cookies
const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 20000,
    httpsAgent: undefined
}));
// console.log(await jar.getCookies("https://www.nseindia.com"));

// polite pre-flight: fetch the base domain to get cookies (helps avoid 403)
async function preflight() {
    try {
        await client.get('https://ticker.finology.in', {
            headers: defaultHeaders,
            maxRedirects: 5
        });
        console.log('Preflight successful, cookies set.');
        // small random delay to mimic human navigation
        await sleep(randomInt(300, 900));
    } catch (err) {
        console.log('Preflight request failed:', err.message || err.code);
    }
}


function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function removePreviousYearsQuarters(quarters) {
    const now = new Date();
    let fyStartYear;

    // Determine FY start year
    if (now.getMonth() >= 3) {
        fyStartYear = now.getFullYear();
    } else {
        fyStartYear = now.getFullYear() - 1;
    }

    const fyStart = new Date(fyStartYear, 3, 1); // April 1
    const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31 next year

    const monthMap = {
        Jan: 0, Feb: 1, Mar: 2,
        Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8,
        Oct: 9, Nov: 10, Dec: 11,
    };

    return quarters.filter(q => {
        const [monthStr, yearStr] = q.split(" ");
        const year = parseInt(yearStr);
        const month = monthMap[monthStr];

        if (month === undefined) return false;

        const date = new Date(year, month, 1);
        return date >= fyStart && date <= fyEnd;
    });
}



/**
 * Core function:
 * - fetches screener company page
 * - parses data
 * - filters rows which are quarterly filings and have release date/timestamp equal to today
 */
export async function stockDetailsFromScrener(ticker) {
    try {
        await sleep()
        // target URL
        const baseUrl = 'https://ticker.finology.in/Company/';
        // const actualUrl = baseUrl + ticker;
        await preflight();
        await sleep(randomInt(500, 1500)); // small random delay before main request
        let resp = null;

        try {
            resp = await client.get(baseUrl + ticker, { headers: defaultHeaders });
            // console.log("resp", resp);
        } catch (err) {
            try {
                const comArr = await searchFinology(ticker)
                const code = comArr[0]?.FINCODE
                // console.log(baseUrl + `SCRIP-${code}`);
                resp = await client.get(baseUrl + `SCRIP-${code}`, { headers: defaultHeaders });
            } catch (err) {
                console.log('Error searching with fincode');
            }
        }

        const $ = cheerio.load(resp?.data);


        // ===== QUARTERLY TABLE =====
        const quarters = [];
        $("h4:contains('Quarterly Result')")
            .closest(".card")
            .find("table").find("thead th").each((i, el) => {
                if (i > 0) quarters.push($(el).text().trim());
            });

        const years = [];
        $("#profit table thead tr th").each((i, el) => {
            if (i > 0) { // skip the first column
                const year = $(el).text().trim();
                if (year) years.push(year);
            }
        });


        // Quarterly
        const quarterlyTable = $("#mainContent_quarterly table tbody");
        const quarterlyData = { quarterlySales: [], quarterlyEps: [], quarterlyPat: [], quarterlyOpProfit: [] };

        quarterlyTable.find("tr").each((i, tr) => {
            const rowName = $(tr).find("th").clone()
                .children().remove().end()
                .text()
                .replace(/\s+/g, " ")  // normalize whitespace
                .trim();

            const values = [];
            $(tr).find("td span").each((j, td) => {
                values.push(parseFloat($(td).text().trim()) || null);
            });

            if (/Net Sales|Operating Revenue/i.test(rowName)) quarterlyData.quarterlySales = values;
            else if (/EPS/i.test(rowName)) quarterlyData.quarterlyEps = values;
            else if (/Profit After Tax|Net Profit/i.test(rowName)) quarterlyData.quarterlyPat = values;
            else if (/Operating Profit|Profit Before Tax/i.test(rowName)) quarterlyData.quarterlyOpProfit = values;
        });

        // Yearly data extraction
        const yearlyTable = $("#profit table tbody");
        const yearlyData = { yearlySales: [], yearlyEps: [], yearlyOpProfit: [], yearlyPat: [] };

        yearlyTable.find("tr").each((i, tr) => {
            const rowName = $(tr).find("th").clone()
                .children().remove().end()
                .text()
                .replace(/[\u00A0\u200B]/g, " ")
                .replace(/\s+/g, " ")  // normalize whitespace
                .trim();

            const values = [];
            $(tr).find("td span").each((j, td) => {
                values.push(parseFloat($(td).text().trim()) || null);
            });

            if (/Net Sales|Operating Income/i.test(rowName)) yearlyData.yearlySales = values;
            else if (/EPS/i.test(rowName)) yearlyData.yearlyEps = values;
            else if (/Operating Profit|Net Interest Income/i.test(rowName)) yearlyData.yearlyOpProfit = values;
            else if (/Net Profit|Profit After Tax/i.test(rowName)) yearlyData.yearlyPat = values;
        });



        // ===== PE RATIO =====
        const peElement = $("small:contains('P/E')")
            .parent()
            .find("p")
            .first()
            .text()
            .trim();
        const peRatio = parseFloat(peElement) || null;

        // ===== CURRENT PRICE =====
        const currentPriceText = $("#mainContent_clsprice .currprice .Number")
            .first()
            .text()
            .trim();
        const currentPrice = parseFloat(currentPriceText) || null;

        // ===== MARKET CAP =====
        const marketCapText = $("small:contains('Market Cap')")
            .parent()
            .find("p .Number")
            .first()
            .text()
            .trim();
        const marketCap = parseFloat(marketCapText) || null;

        // ===== DEBT =====
        const debtText = $("#mainContent_ltrlDebt .Number")
            .first()
            .text()
            .trim();
        const debt = parseFloat(debtText) || null;

        // ===== PROMOTER HOLDING =====
        const promoterHoldingText = $("small:contains('Promoter Holding')")
            .parent()
            .find("p")
            .first()
            .text()
            .replace("%", "")
            .trim();
        const promoterHolding = parseFloat(promoterHoldingText) || null;

        // ===== ROE =====
        const roeText = $("small:contains('ROE')")
            .parent()
            .find(".Number")
            .first()
            .text()
            .trim();
        const roe = parseFloat(roeText) || null;

        // ===== ROCE =====
        const roceText = $("small:contains('ROCE')")
            .parent()
            .find(".Number")
            .first()
            .text()
            .trim();
        const roce = parseFloat(roceText) || null;

        const currentFinQuarters = removePreviousYearsQuarters(quarters)
        // Filter each quarterly array to match the current quarters length
        let sliceLength = quarters.length - currentFinQuarters.length;
        // console.log("quarterlyData", quarterlyData);
        // console.log("yearlyData", yearlyData);


        const { quarterlySales, quarterlyEps, quarterlyOpProfit, quarterlyPat } = quarterlyData;
        const { yearlySales, yearlyEps, yearlyOpProfit, yearlyPat } = yearlyData;

        return {
            quarters: currentFinQuarters,
            quarterlySales: quarterlySales?.slice(sliceLength)?.filter(value => value || value === 0),
            quarterlyPat: quarterlyPat?.slice(sliceLength)?.filter(value => value || value === 0),
            quarterlyEps: quarterlyEps?.slice(sliceLength)?.filter(value => value || value === 0),
            quarterlyOpProfit: quarterlyOpProfit?.slice(sliceLength)?.filter(value => value || value === 0),
            years,
            yearlySales: yearlySales?.filter(value => value || value === 0),
            yearlyEps: yearlyEps?.filter(value => value || value === 0),
            yearlyOpProfit: yearlyOpProfit?.filter(value => value || value === 0),
            yearlyPat: yearlyPat?.filter(value => value || value === 0),
            peRatio,
            currentPrice,
            marketCap,
            debt,
            promoterHolding,
            roe,
            roce,
        }
    } catch (err) {
        console.log(err.stack);
        return null
    }

}


