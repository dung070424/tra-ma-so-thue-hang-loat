const axios = require('axios');

const chromeHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Cache-Control": "max-age=0",
    "Upgrade-Insecure-Requests": "1"
};

async function test() {
    try {
        console.log("Fetching homepage with Chrome headers...");
        const response = await axios.get("https://masothue.com/", { 
            headers: chromeHeaders, 
            timeout: 10000 
        });
        
        console.log("Status:", response.status);
        console.log("Set-Cookie headers:", response.headers['set-cookie']);
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
