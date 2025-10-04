import { sendTeleGramMessage } from "./sendTelegramMessage.js";

// Function to format a single company's message
function formatMobileMessage(company) {
    const r = company.recomendation || {};

    // Helper function to safely get values
    const safe = (value, fallback = "-") => (value !== undefined && value !== null ? value : fallback);

    const latestQuarter = safe(company.quarters?.[company.quarters.length - 1]);

    return `
📢 *${safe(company.ticker, company.stockName)}* (${latestQuarter})

GROWTH RATE CAGR:
EPS: ${safe(r.EPS?.oldGrowthRate)}% → ${safe(r.EPS?.newGrowthRate)}%
Sales: ${safe(r.Sales?.oldGrowthRate)}% → ${safe(r.Sales?.newGrowthRate)}%
PAT: ${safe(r.PAT?.oldGrowthRate)}% → ${safe(r.PAT?.newGrowthRate)}%
OP: ${safe(r.OP?.oldGrowthRate)}% → ${safe(r.OP?.newGrowthRate)}%

YOY JUMP PERCENT:
EPS: ${safe(r.EPS?.jumpPercent)}%
Sales: ${safe(r.Sales?.jumpPercent)}%
PAT: ${safe(r.PAT?.jumpPercent)}%
OP: ${safe(r.OP?.jumpPercent)}%

PE: ${safe(r.PE)} | PEG: ${safe(r.PEG)} | ROE: ${safe(company.roe)}%
DPS: ${safe(company.DPS)}
Decision: ${safe(r.decision)}
  `.trim();
}

// Function to send messages for an array of companies
export async function sendCompanyResults(companies) {
    companies.forEach(async company => {
        const message = formatMobileMessage(company);
        await sendTeleGramMessage(message) // Replace with your existing send function
    });
}
