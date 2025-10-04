import { fetchBSEFinancialResults } from "./bseFilings.js";
import { searchFinology } from "./finologySearch.js";
import { stockDetailsFromScrener } from './stockDetailsFromScreener.js';
import { recommend } from '../utility/recommend.js'
import { buyOrSell } from '../dbtransaction/buyorsell.js'
import { sendResultMessage } from '../comn/sendCompanyNames.js'
import { sendCompanyResults } from '../comn/sendCompanyResults.js'
import { addDPSScore } from "../utility/dpsScore.js";
/**
 * Normalize company name for comparison
 * Removes common suffixes like Ltd, Limited, Pvt, etc., and trailing dots
 */
function normalizeCompanyName(name) {
    return name
        .replace(/\b(Ltd|LTD|Limited)\b\.?/gi, '') // remove suffixes
        .replace(/\.+$/g, '') // remove trailing dots
        .replace(/\s+/g, ' ')  // normalize spaces
        .trim()
        .toLowerCase();
}


/**
 * Fetches BSE results and enriches them with FINCODE and stock details
 */
export async function bseDriver() {
    try {
        console.log('<=====================================================>');
        console.log(`[${new Date().toLocaleString()}] Starting BSE scraper`);
        // Uncomment below line to fetch live results from BSE
        const bseResults = await fetchBSEFinancialResults();

        // Hardcoded results for testing to avoid calling BSE too frequently
        // const bseResults = [
        //     { "company": "Esaar India Ltd" },
        //     // { "company": "Another Company Pvt Ltd" }
        // ];
        console.log(`BSE Fresh Filings Found: ${bseResults.length}`);
        await sendResultMessage(bseResults)
        if (!bseResults || bseResults.length === 0) return [];

        const enrichedResults = [];

        for (const item of bseResults) {
            const companyName = item.company.trim();
            const words = companyName.split(/\s+/);
            const searchQuery = words[0].length >= 3 ? words[0] : words.slice(0, 2).join(' ');

            try {
                // Search in Finology
                const searchResults = await searchFinology(searchQuery);
                if (!searchResults || searchResults.length === 0) {
                    console.log(`No search results for company: ${companyName}`);
                    continue;
                }

                // Normalize names for exact comparison
                const normalizedTarget = normalizeCompanyName(companyName);
                let matched = searchResults.find(r => normalizeCompanyName(r.compname) === normalizedTarget);

                if (!matched) {
                    matched = searchResults[0]; // fallback to first result
                }

                const fincode = matched.FINCODE;
                const ticker = `SCRIP-${fincode}`;

                // Fetch stock details
                const stockDetails = await stockDetailsFromScrener(ticker);

                enrichedResults.push({
                    stockName: companyName,
                    ...stockDetails
                });
            } catch (err) {
                console.error(`Error processing company ${companyName}:`, err.message || err);
            }
        }

        // return enrichedResults;

        let stockRecommendation = []
        for (const result of enrichedResults) {
            try {
                // get the recommendation for the stock to buy or sell
                const recomendation = recommend(
                    result.yearlyEps,
                    result.quarterlyEps,
                    result.yearlySales,
                    result.quarterlySales,
                    result.yearlyOpProfit,
                    result.quarterlyOpProfit,
                    result.yearlyPat,
                    result.quarterlyPat,
                    result.peRatio
                )
                result["recomendation"] = recomendation;
                stockRecommendation.push(result);
            } catch (err) {
                console.log("Error finding recommendation", err);
            }
        }

        // send telegram message
        await sendCompanyResults(stockRecommendation)
        // method to buy or sell
        // add dps score
        addDPSScore(stockRecommendation)
        await buyOrSell(stockRecommendation)
        console.log(`[${new Date().toLocaleString()}] Closing BSE scraper`);
    } catch (err) {
        console.log('Error in bse driver', err);
    }

}

// bseDriver()