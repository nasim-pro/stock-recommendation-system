import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
    {
        // basic stock info
        stockName: { type: String, required: true, index: true }, // example: "TCS"
        ticker: { type: String, required: false }, // example: "NSE:TCS"
        nseBse: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
        status: { type: String, enum: ["bought", "sold"], default: "bought" },
        
        // ==========buy snapshot==========
        buyDate: { type: Date, default: Date.now },
        buyPrice: { type: Number },
        buyPeRatio: { type: Number },
        buyMarketCap: { type: Number }, 
        buyDebt: { type: Number }, 
        buyRoe: { type: Number }, 
        buyRoce: { type: Number },
        buyPromoterHolding: { type: Number },
        buyQuarters: [{ type: String }],
        buyQuarterlySales: [{ type: Number }],
        buyQuarterlyPat: [{ type: Number }],
        buyQuarterlyEps: [{ type: Number }],
        buyQuarterlyOpProfit: [{ type: Number }],
        
        buyYears: [{ type: String }],
        buyYearlySales: [{ type: Number }],
        buyYearlyEps: [{ type: Number }],

        
        buyEPSGrowthRateCagr: { type: Number },
        buyImpliedEPSGrowthRateCagr: { type: Number },
        buySalesGrowthRateCagr: { type: Number },
        buySalesImpliedGrowthRateCagr: { type: Number },
        buyJumpPercent: { type: Number },
        buyChangeInEPSGrowthCagr: { type: Number },
        buyPeg: { type: Number },
        buyImpliedEPS: { type: Number },
        buyImpliedSales: { type: Number },
        
        // ===========sell snapshot============
        sellPrice: { type: Number },
        sellPeRatio: { type: Number },
        sellMarketCap: { type: Number },
        sellDebt: { type: Number },
        sellRoe: { type: Number },
        sellRoce: { type: Number },
        sellPromoterHolding: { type: Number },

        sellQuarters: [{ type: String }],
        sellQuarterlySales: [{ type: Number }],
        sellQuarterlyPat: [{ type: Number }],
        sellQuarterlyEps: [{ type: Number }],
        sellQuarterlyOpProfit: [{ type: Number }],

        sellYears: [{ type: String }],
        sellYearlySales: [{ type: Number }],
        sellYearlyEps: [{ type: Number }],
        

        sellEPSGrowthRateCagr: { type: Number },
        sellImpliedEPSGrowthRateCagr: { type: Number },
        sellSalesGrowthRateCagr: { type: Number },
        sellSalesImpliedGrowthRateCagr: { type: Number },
        sellJumpPercent: { type: Number },
        sellChangeInEPSGrowthCagr: { type: Number },
        sellPeg: { type: Number },
        sellImpliedEPS: { type: Number },
        sellImpliedSales: { type: Number },

        // performance snapshot
        profitOrLoss: { type: Number },   // (sellPrice - buyPrice)
        profitOrLossPercent: { type: Number }, // % return
        holdingPeriodDays: { type: Number },   // (sellDate - buyDate)

        sellDate: { type: Date, default: Date.now },
        
    },
    { timestamps: true }
);

export const Stock = mongoose.model("Stock", StockSchema);
