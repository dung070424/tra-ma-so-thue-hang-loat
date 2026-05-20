const axios = require('axios');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
};

async function test() {
    try {
        const mst = "0314446814";
        const url = `https://masothue.com/Search/?q=${mst}`;
        console.log(`Fetching url: ${url}`);
        const response = await axios.get(url, { headers, timeout: 10000 });
        console.log("Status:", response.status);
        console.log("Length of body:", response.data.length);
        console.log("Snippet of HTML:");
        console.log(response.data.substring(0, 1000));
        if (response.data.includes("Cloudflare") || response.data.includes("ddos") || response.data.includes("checking your browser")) {
            console.log("Detected Cloudflare / DDoS protection block!");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
