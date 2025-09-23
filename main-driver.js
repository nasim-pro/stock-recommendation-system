import { nseDriver } from "./scrape/nse-driver.js";
import { bseDriver } from "./scrape/bse-driver.js";

async function mainDriver() {
    try {
        await nseDriver()
    } catch (err) {
        console.log(`Error in nse driver ${eee}`);
    }

    try {
        await bseDriver()
    } catch (err) {
        console.log(`Error in bse driver ${err}`);
        
    }
}

mainDriver()