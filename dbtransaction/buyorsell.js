//buyorsell.js
import { buyStock } from "./buy-stock.js";
import { sellStock } from "./sell-stock.js";
import { sendTeleGramMessage } from '../comn/sendTelegramMessage.js'
import mongoose from "mongoose";
// this method will decide the action to buy or sell the stocks
export async function buyOrSell(stocksArr) {
    try {
        if (stocksArr?.length < 1) throw Error("Stock array is empty")
        for (const stock of stocksArr) {
            try {
                if (stock.recomendation.decision == "BUY") {
                    await sendTeleGramMessage(`This stock: ${stock?.ticker || stock.stockName} has jumped to ${stock.recomendation.EPS.jumpPercent}%, please check if it is a good buy`)
                    // await sendTeleGramMessage("```json\n" + JSON.stringify(stock, null, 2) + "\n```");
                    await buyStock(stock)
                } else if (stock.recomendation.decision == "SELL") {
                    await sellStock(stock)
                }
                else {
                    console.log("Holding this stock", stock);
                }
            } catch (err) {
                console.error(err.stack)
            }
        }
    } catch (err) {
        console.log("Error in buy or sell", err);
    } finally {
        // ✅ Always close connection
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected, exiting");
        // process.exit(0);
    }
}


