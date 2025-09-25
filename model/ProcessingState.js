// models/ProcessingState.js
import mongoose from "mongoose";

const processingStateSchema = new mongoose.Schema({
    key: { type: String, unique: true }, // e.g., "nse_filings"
    lastProcessedTime: { type: Date }
});

export const ProcessingState = mongoose.model("ProcessingState", processingStateSchema);
