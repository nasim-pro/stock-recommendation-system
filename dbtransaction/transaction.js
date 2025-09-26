import mongoose, { connect } from "mongoose";
import { Stock } from "../model/Stock.schema.js";
import { config } from "dotenv";
config({ path: __dirname + "/.env" });

// MongoDB connection
async function connectToMongoDb() {
    if (mongoose.connection.readyState === 0) {
        try {
            await connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("✅ Connected to MongoDB");
        } catch (err) {
            console.error("❌ MongoDB connection error:", err.message);
            throw err;
        }
    }
}

// Buy a stock
export async function buy(stock) {
    try {
        await connectToMongoDb();
        // check if already bought
        const existing = await Stock.findOne({
            stockName: stock.stockName,
            status: "bought",
        });

        if (existing) {
            console.log(`⚠️ Stock ${stock.ticker || stock.stockName} already bought`);
            return existing;
        }

        // create new buy snapshot
        const newStock = new Stock(stock);
        await newStock.save();

        console.log(`✅ Stock ${stock.ticker || stock.stockName } bought and saved`);
        return newStock;
    } catch (err) {
        throw err
    }
}

// Sell a stock
export async function sell(sellObj) {
    try {
        await connectToMongoDb();
        const ticker = sellObj?.ticker || sellObj?.stockName;
        // check if stock exists with status "bought"
        const stock = await Stock.findOne({ stockName: sellObj.stockName, status: "bought" });
        if (!stock) {
            console.log(`⚠️ Stock ${ticker} not found or already sold`);
            return null;
        }
        // await connectToMongoDb();

        // check if already bought
        // update with sell details
        stock.status = "sold";
        Object.assign(stock, sellObj);

        await stock.save();

        console.log(`✅ Stock ${ticker} sold and updated`);
        return stock;
    } catch (err) {
        throw err
    }
}
