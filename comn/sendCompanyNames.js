import { sendTeleGramMessage } from "./sendTelegramMessage.js";
export async function sendResultMessage(data) {
    try {
        const symbols = data?.map(item => item?.symbol || item?.company);
        if (symbols.length === 0) return null
        const message = `Results have been released today for: ${symbols.join(", ")}`;
        await sendTeleGramMessage(message);
    } catch (err) {
        console.log(err);
        return null
    }
}
