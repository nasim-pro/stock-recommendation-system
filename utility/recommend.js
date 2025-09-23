
/**
 * Calculates the average YoY growth rate from a series of values.
 *
 * @param {number[]} values - Array of yearly values (oldest → latest).
 * @returns {number} Average growth rate in %.
 */
function calculateAverageGrowth(values) {
    if (!Array.isArray(values) || values.length < 2) return NaN;

    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1];
        const curr = values[i];
        if (prev !== 0) {
            growthRates.push(((curr - prev) / Math.abs(prev)) * 100);
        }
    }

    if (growthRates.length === 0) return NaN;

    const avg = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    return parseFloat(avg.toFixed(2));
}



/**
 * Flexible CAGR calculation that handles negative → positive transitions
 * @param {number} begin - Starting value
 * @param {number} final - Ending value
 * @param {number} years - Number of years
 * @returns {number} CAGR as decimal (%) (e.g. 25 = 25%)
 */
function CAGR_flexible(begin, final, years) {
    try {
        if (years <= 0) return NaN;
        let cagr = 0;
        if (begin > 0 && final > 0) {
            cagr = Math.pow(final / begin, 1 / years) - 1;
        } else if (begin < 0 && final < 0) {
            cagr = Math.pow(Math.abs(final) / Math.abs(begin), 1 / years) - 1;
            cagr *= -1; // stays negative because both are losses
        } else if (begin < 0 && final > 0) {
            cagr = Math.pow((final + 2 * Math.abs(begin)) / Math.abs(begin), 1 / years) - 1;
        } else if (begin > 0 && final < 0) {
            cagr = -1 * (Math.pow((Math.abs(final) + 2 * begin) / begin, 1 / years) - 1);
        }
        return cagr * 100;
    } catch (err) {
        console.log("Error calculating cagr", err);
    }
}

/**
 * Calculate growth change after adding the latest year (using CAGR_flexible)
 * @param {number[]} yearlyDataArr - EPS values (oldest → latest)
 * @returns {object}
 */
function growthAndJumpCalculator(yearlyDataArr) {
    try {
        if (yearlyDataArr.length < 2) {
            throw new Error("Need at least 2 values (oldest → latest).");
        }

        const oldStart = yearlyDataArr[0];
        const oldEnd = yearlyDataArr[yearlyDataArr.length - 2];
        const oldYears = yearlyDataArr.length - 2;
        const oldGrowthRate = CAGR_flexible(oldStart, oldEnd, oldYears);

        const newStart = yearlyDataArr[0];
        const newEnd = yearlyDataArr[yearlyDataArr.length - 1];
        const newYears = yearlyDataArr.length - 1;
        const newGrowthRate = CAGR_flexible(newStart, newEnd, newYears);

        const change = parseFloat((newGrowthRate - oldGrowthRate).toFixed(2));
        const jumpPercent = oldGrowthRate !== 0
            ? ((newGrowthRate - oldGrowthRate) / Math.abs(oldGrowthRate)) * 100
            : NaN;

        return {
            oldGrowthRate: parseFloat(oldGrowthRate.toFixed(2)),
            newGrowthRate: parseFloat(newGrowthRate.toFixed(2)),
            jumpPercent: isNaN(jumpPercent) ? null : parseFloat(jumpPercent.toFixed(2)),
            change: change,
            impliedValue: yearlyDataArr[yearlyDataArr.length - 1]
        };
    } catch (err) {
        console.log("Error in growth jump calculator", err);
    }
}

/**
 * Calculate implied yearly value from quarterly data
 * Bias added depending on how many quarters are available
 * (lenient for Q1, strict for Q3/Q4)
 * @param {number[]} quarterlyArr - values (EPS or Sales, oldest → latest)
 * @returns {number} implied yearly value (adjusted with bias)
 */
function yearlyImpliedGrowth(quarterlyArr) {
    try {
        if (quarterlyArr.length === 0) {
            throw new Error("Need at least 1 quarterly value.");
        }
        const sum = quarterlyArr.reduce((a, b) => a + b, 0);
        const rawImplied = (sum / quarterlyArr.length) * 4;

        // Quarter bias factors
        const q = quarterlyArr.length;
        let factor = 1;
        if (q === 1) factor = 1.13;  // give extra benefit of doubt in Q1
        if (q === 2) factor = 1.06;  // slightly lenient in Q2
        if (q === 3) factor = 1.0;   // no bias in Q3
        if (q >= 4) factor = 1.0;   // no bias in Q4

        const impliedValue = rawImplied * factor;

        return parseFloat(impliedValue.toFixed(2))
    } catch (err) {
        console.log("Error in implied growth calculator", err.message);
        return null
    }
}

// /**
//  * Driver function for EPS & Sales CAGR + PEG + Jump filter
//  * @param {number[]} yearlyEPS
//  * @param {number[]} quarterlyEPS
//  * @param {number[]} yearlySales
//  * @param {number[]} quarterlySales
//  * @param {number} pe - current PE ratio of stock
//  * @returns {object}
//  */
// export function recommend(
//     yearlyEPS, 
//     quarterlyEPS, 
//     yearlySales, 
//     quarterlySales, 
//     yearlyOpProfit, 
//     quarterlyOpProfit,
//     yearlyPat,
//     quarterlyPat,
//     pe = 30,
//     currentPrice = null
// ) {
//     try {
//         // EPS analysis
//         const impliedEPS = yearlyImpliedGrowth(quarterlyEPS);
//         const yearlyEpsCombined = [...yearlyEPS, impliedEPS];
//         const epsResult = growthAndJumpCalculator(yearlyEpsCombined);

//         // Sales analysis
//         const impliedSales = yearlyImpliedGrowth(quarterlySales);
//         const yearlySalesCombined = [...yearlySales, impliedSales];
//         const salesResult = growthAndJumpCalculator(yearlySalesCombined);

//         // Check if Sales roughly track EPS (fundamental consistency)
//         const salesWithinRange = Math.abs(salesResult.newGrowthRate - epsResult.newGrowthRate) <= 70;

//         // PEG ratio (PE divided by EPS growth)
//         const peg = pe / Math.max(epsResult.newGrowthRate, 1);

//         // PE re-rating (if we have price history and EPS history)
//         let peChange = null;
//         if (currentPrice && yearlyEPS.length > 1) {
//             const oldEPS = yearlyEPS[0];
//             if (oldEPS > 0) {
//                 const oldPE = currentPrice / oldEPS;
//                 peChange = ((pe / oldPE) - 1) * 100;
//             }
//         }

//         // Final decision logic
//         let decision = "HOLD";

//         if (
//             epsResult.jumpPercent > 50 &&                  // sudden EPS jump
//             // epsResult.newGrowthRate > 20 &&                // strong EPS CAGR
//             // salesWithinRange &&                            // Sales confirm EPS growth
//             // peg < 2 &&                                   // allow a bit higher PEG
//             (peChange === null || peChange < 70)           // PE not over-expanded
//         ) {
//             decision = "BUY";
//         } else if (
//             epsResult.newGrowthRate < 15 ||                // weak fundamentals
//             peg > 3 ||                                   // clearly overvalued
//             (peChange !== null && peChange > 100)          // excessive PE expansion
//         ) {
//             decision = "SELL";
//         } else {
//             decision = "HOLD";  // in-between cases
//         }

//         return {
//             EPS: epsResult,
//             Sales: salesResult,
//             PE: pe,
//             PEG: parseFloat(peg.toFixed(2)),
//             peChange: peChange !== null ? parseFloat(peChange.toFixed(2)) : null,
//             decision: decision,
//         };
//     } catch (err) {
//         console.log("Error in recommend fucntion", err);
//     }
// }


/**
 * Driver function for EPS, Sales, OP, PAT CAGR + PEG + Jump filter
 * Determines early rerating candidates
 * @param {number[]} yearlyEPS
 * @param {number[]} quarterlyEPS
 * @param {number[]} yearlySales
 * @param {number[]} quarterlySales
 * @param {number[]} yearlyOpProfit
 * @param {number[]} quarterlyOpProfit
 * @param {number[]} yearlyPat
 * @param {number[]} quarterlyPat
 * @param {number} pe - current PE ratio of stock
 * @param {number} currentPrice - current market price of stock
 * @returns {object}
 */
export function recommend(
    yearlyEPS,
    quarterlyEPS,
    yearlySales,
    quarterlySales,
    yearlyOpProfit,
    quarterlyOpProfit,
    yearlyPat,
    quarterlyPat,
    pe = 30,
    currentPrice = null
) {
    try {
        // --- EPS Analysis ---
        const impliedEPS = yearlyImpliedGrowth(quarterlyEPS);
        const yearlyEpsCombined = [...yearlyEPS, impliedEPS];
        const epsResult = growthAndJumpCalculator(yearlyEpsCombined);

        // --- Sales Analysis ---
        const impliedSales = yearlyImpliedGrowth(quarterlySales);
        const yearlySalesCombined = [...yearlySales, impliedSales];
        const salesResult = growthAndJumpCalculator(yearlySalesCombined);

        // --- Operating Profit Analysis ---
        const impliedOp = yearlyImpliedGrowth(quarterlyOpProfit);
        const yearlyOpCombined = [...yearlyOpProfit, impliedOp];
        const opResult = growthAndJumpCalculator(yearlyOpCombined);

        // --- PAT Analysis ---
        const impliedPat = yearlyImpliedGrowth(quarterlyPat);
        const yearlyPatCombined = [...yearlyPat, impliedPat];
        const patResult = growthAndJumpCalculator(yearlyPatCombined);

        // --- Sales vs EPS consistency ---
        const salesWithinRange = Math.abs(salesResult.newGrowthRate - epsResult.newGrowthRate) <= 70;

        // --- PEG Ratio ---
        const peg = pe / Math.max(epsResult.newGrowthRate, 1);

        // --- PE expansion check ---
        let peChange = null;
        if (currentPrice && yearlyEPS.length > 1) {
            const oldEPS = yearlyEPS[0];
            if (oldEPS > 0) {
                const oldPE = currentPrice / oldEPS;
                peChange = ((pe / oldPE) - 1) * 100;
            }
        }

        // --- Decision Logic for Early Rerating ---
        let decision = "HOLD";
        let rerating = false;

        if (
            // Trigger if any of OP, EPS, or PAT shows a significant jump
            ((opResult?.jumpPercent ? opResult.jumpPercent >= 30 : false) ||
                (epsResult?.jumpPercent ? epsResult.jumpPercent >= 40 : false) ||
                (patResult?.jumpPercent ? patResult.jumpPercent >= 40 : false)) &&
            // (epsResult?.jumpPercent ? epsResult.jumpPercent > 50 : true) &&            // sudden EPS jump
            // (epsResult?.newGrowthRate ? epsResult.newGrowthRate > 20 : true) &&       // strong EPS CAGR
            (salesResult?.newGrowthRate ? salesResult.newGrowthRate >= 10 : true) &&   // strong Sales growth
            // (opResult?.newGrowthRate ? opResult.newGrowthRate > 5 : true) &&         // operating margin expansion
            (patResult?.newGrowthRate ? patResult.newGrowthRate >= 10 : true) &&      // clean PAT growth
            // (salesWithinRange !== undefined ? salesWithinRange : true) &&            // Sales confirm EPS
            (peg !== undefined ? peg < 5 : true)                                 // not too overvalued
            // (peChange === null || peChange < 60)                                       // PE not already blown up
        ) {
            decision = "BUY";
            rerating = true;
        }
        else if (
            epsResult.newGrowthRate < 15 ||          // weak fundamentals
            peg > 3 ||                               // clearly overvalued
            (peChange !== null && peChange > 100)    // excessive PE expansion
        ) {
            decision = "SELL";
            rerating = false;
        }

        return {
            EPS: epsResult,
            Sales: salesResult,
            OP: opResult,
            PAT: patResult,
            PE: pe,
            PEG: parseFloat(peg.toFixed(2)),
            peChange: peChange !== null ? parseFloat(peChange.toFixed(2)) : null,
            decision: decision,
            reratingCandidate: rerating
        };
    } catch (err) {
        console.log("Error in recommend function", err);
    }
}




