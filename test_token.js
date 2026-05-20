const axios = require('axios');
const { JSDOM } = require('jsdom');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
};

async function test() {
    try {
        console.log("Fetching homepage...");
        const response = await axios.get("https://masothue.com/", { headers, timeout: 10000 });
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;
        
        const form = doc.querySelector('form.tax-search');
        if (!form) {
            console.log("Search form not found!");
            return;
        }
        
        const tokenInput = form.querySelector('input[name="token"]');
        const forceInput = form.querySelector('input[name="force-search"]');
        
        console.log("Token Input Value:", tokenInput ? tokenInput.value : "Not found");
        console.log("Force Search Input Value:", forceInput ? forceInput.value : "Not found");
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
