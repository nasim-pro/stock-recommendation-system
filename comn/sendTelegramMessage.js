import axios from "axios";
import { config } from "dotenv";
config()
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const MESSAGE = "Hello Nasim 👋 from Node.js!";

export async function sendTeleGramMessage(message) {

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const res = await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
        });
        // console.log("✅ Message sent:", res.data);
    } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
    }
}

// sendMessage("Hello Nasim 👋 from Node.js!");
