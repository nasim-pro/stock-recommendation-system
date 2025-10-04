/**
 * Safe DPS (Doubling Potential Score) calculator
 * @param {Object} company - company JSON object
 * @returns {number} DPS score (0–100)
 */
function calculateDPS(company) {
    try {
        const r = company.recomendation || {};
        let score = 0;
        let totalWeight = 0;

        const weights = {
            EPS: 0.25,
            Sales: 0.25,
            PAT: 0.2,
            OP: 0.15,
            PE: 0.05,
            PEG: 0.05,
            ROE: 0.05,
        };

        if (r.EPS?.newGrowthRate !== undefined) {
            score += Math.min(r.EPS.newGrowthRate, 50) * weights.EPS;
            totalWeight += weights.EPS;
        }

        if (r.Sales?.newGrowthRate !== undefined) {
            score += Math.min(r.Sales.newGrowthRate, 50) * weights.Sales;
            totalWeight += weights.Sales;
        }

        if (r.PAT?.newGrowthRate !== undefined) {
            score += Math.min(r.PAT.newGrowthRate, 50) * weights.PAT;
            totalWeight += weights.PAT;
        }

        if (r.OP?.newGrowthRate !== undefined) {
            score += Math.min(r.OP.newGrowthRate, 50) * weights.OP;
            totalWeight += weights.OP;
        }

        if (r.PE !== undefined) {
            let peScore = 30 - Math.min(r.PE, 30);
            score += (peScore / 30) * 100 * weights.PE;
            totalWeight += weights.PE;
        }

        if (r.PEG !== undefined) {
            let pegScore = Math.max(0, 50 - Math.abs(1 - r.PEG) * 50);
            score += (pegScore / 50) * 100 * weights.PEG;
            totalWeight += weights.PEG;
        }

        if (company.roe !== undefined) {
            let roeScore = Math.min(company.roe, 40);
            score += (roeScore / 40) * 100 * weights.ROE;
            totalWeight += weights.ROE;
        }

        return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
    } catch (err) {
        return 0; // fallback on any error
    }
}

/**
 * Mutates the companies array and adds DPS score
 * @param {Array} companies - array of company JSON objects
 */
export function addDPSScore(companies) {
    companies.forEach((company) => {
        try {
            company.DPS = calculateDPS(company);
        } catch (err) {
            company.DPS = 0; // fallback if calculation fails
        }
    });
}
