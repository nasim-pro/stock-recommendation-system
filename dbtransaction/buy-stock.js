import { buy } from "./transaction.js";
/**
 * Buy a new stock
 * @param {Object} stockData
 *
 */
export async function buyStock(stockData) {
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
        
        let nseBse = 'NSE'
        if (!ticker) nseBse = 'BSE';

        const buyObj = {
            stockName,
            ticker,
            nseBse: nseBse,
            status: "bought",

            // buy snapshot
            buyPrice: currentPrice,
            buyPeRatio: peRatio,
            buyMarketCap: marketCap,
            buyDebt: debt,
            buyRoe: roe,
            buyRoce: roce,
            buyPromoterHolding: promoterHolding,

            buyQuarters: quarters,
            buyQuarterlySales: quarterlySales,
            buyQuarterlyPat: quarterlyPat,
            buyQuarterlyEps: quarterlyEps,
            buyQuarterlyOpProfit: quarterlyOpProfit,

            buyYears: years,
            buyYearlySales: yearlySales,
            buyYearlyEps: yearlyEps,
            buyDate: new Date(),

            buyEPSGrowthRateCagr: recomendation.EPS.oldGrowthRate,
            buyImpliedEPSGrowthRateCagr: recomendation.EPS.newGrowthRate,
            buySalesGrowthRateCagr: recomendation.Sales.oldGrowthRate,
            buySalesImpliedGrowthRateCagr: recomendation.Sales.newGrowthRate,

            buyJumpPercent: recomendation.EPS.jumpPercent,
            buyChangeInEPSGrowthCagr: recomendation.EPS.change,

            buyPeg: recomendation.PEG,
            buyImpliedEPS: recomendation.EPS.impliedValue,
            buyImpliedSales: recomendation.Sales.impliedValue,
        };
        await buy(buyObj);
    } catch (error) {
        console.error("Error buying stock:", error.message);
        throw error;
    }
}

