// utils/freshFilings.js
import mongoose from "mongoose";
import { ProcessingState } from "../model/ProcessingState.js";

/**
 * Ensures MongoDB connection is established
 */
async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
}

/**
 * Filters only fresh filings from NSE response data and updates DB state.
 * 
 * @param {Array} filings - Array of NSE filings objects
 * @returns {Array} freshFilings - Only new filings not seen in previous runs
 */
export async function getFreshFilings(filings) {
    try {
        await connectDB();
        // console.log("filings", filings);

        const key = "nse_filings";

        // Step 1: Load previous state from DB
        const state = await ProcessingState.findOne({ key });
        let lastProcessedTime = state?.lastProcessedTime || null;

        // Step 2: Filter new filings
        const fresh = filings?.filter(filing => {
            const filingDate = new Date(filing.creation_Date);
            if (!lastProcessedTime) return true; // First run → take everything
            return filingDate > lastProcessedTime;
        }) || [];

        // Step 3: Update the saved timestamp to max creation_Date
        if (filings?.length > 0) {
            const maxTime = new Date(
                Math.max(...filings.map(f => new Date(f.creation_Date).getTime()))
            );

            await ProcessingState.findOneAndUpdate(
                { key },
                { lastProcessedTime: maxTime },
                { upsert: true, new: true }
            );
        }
        return fresh;
    } catch (err) {
        console.error("Error in getFreshFilings (DB version):", err);
        return [];
    }
}
