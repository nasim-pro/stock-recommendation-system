import { sell } from "./transaction.js";
/**
 * Sell an existing stock
 * @param {Object} stockData
 */
export async function sellStock(stockData) {
    try {
        const {
            stockName,
            ticker,
            peRatio,
            currentPrice,
            marketCap,
            debt,
            promoterHolding,
            roe,
            roce,
            quarters,
            quarterlySales,
            quarterlyPat,
            quarterlyEps,
            quarterlyOpProfit,
            years,
            yearlySales,
            yearlyEps,
            recomendation
        } = stockData;
        let nseBse='NSE'
        if (!ticker) nseBse = 'BSE';

        const sellObj = {
            stockName,
            ticker,
            nseBse: nseBse,
            status: "sold",

            // sell snapshot
            sellPrice: currentPrice,
            sellPeRatio: peRatio,
            sellMarketCap: marketCap,
            sellDebt: debt,
            sellRoe: roe,
            sellRoce: roce,
            sellPromoterHolding: promoterHolding,

            sellQuarters: quarters,
            sellQuarterlySales: quarterlySales,
            sellQuarterlyPat: quarterlyPat,
            sellQuarterlyEps: quarterlyEps,
            sellQuarterlyOpProfit: quarterlyOpProfit,

            sellYears: years,
            sellYearlySales: yearlySales,
            sellYearlyEps: yearlyEps,
            sellDate: new Date(),

            sellEPSGrowthRateCagr: recomendation.EPS.oldGrowthRate,
            sellImpliedEPSGrowthRateCagr: recomendation.EPS.newGrowthRate,
            sellSalesGrowthRateCagr: recomendation.Sales.oldGrowthRate,
            sellSalesImpliedGrowthRateCagr: recomendation.Sales.newGrowthRate,

            sellJumpPercent: recomendation.EPS.jumpPercent,
            sellChangeInEPSGrowthCagr: recomendation.EPS.change,

            sellPeg: recomendation.PEG,
            sellImpliedEPS: recomendation.EPS.impliedValue,
            sellImpliedSales: recomendation.Sales.impliedValue,
        };

        await sell(sellObj)
    } catch (error) {
        console.error("Error selling stock:", error.message);
        throw error;
    }
}
