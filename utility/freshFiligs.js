// utils/freshFilings.js
import fs from "fs";
import path from "path";

const stateFile = path.resolve("lastProcessed.json");

/**
 * Filters only fresh filings from NSE response data.
 * 
 * @param {Array} filings - Array of NSE filings objects
 * @returns {Array} freshFilings - Only new filings not seen in previous runs
 */
export function getFreshFilings(filings) {
    try {
        let lastProcessedTime = null;
        // Step 1: Load previous state
        if (fs.existsSync(stateFile)) {
            try {
                const saved = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
                lastProcessedTime = new Date(saved.lastProcessedTime);
            } catch (err) {
                console.error("Error reading lastProcessed.json:", err.message);
            }
        }

        // Step 2: Filter new filings
        const fresh = filings?.filter(filing => {
            const filingDate = new Date(filing.creation_Date);
            if (!lastProcessedTime) return true; // First run, take everything
            return filingDate > lastProcessedTime;
        });

        // Step 3: Update the saved timestamp to max creation_Date
        if (filings?.length > 0) {
            const maxTime = new Date(
                Math.max(...filings.map(f => new Date(f.creation_Date).getTime()))
            );
            fs.writeFileSync(
                stateFile,
                JSON.stringify({ lastProcessedTime: maxTime.toISOString() }, null, 2)
            );
        }

        return fresh;
    } catch (err) {
        console.log("Error in freeshfiling finder", err);
    }
}
