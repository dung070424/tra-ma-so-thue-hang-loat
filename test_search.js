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
        
        // Let's check if the body contains the company name, Yue You
        console.log("Contains 'Yue You'?", response.data.toLowerCase().includes("yue you"));
        console.log("Contains '0314446814'?", response.data.includes("0314446814"));
        
        // Find index of '0314446814' and print around it
        let idx = response.data.indexOf("0314446814");
        while (idx !== -1) {
            console.log(`--- Match at ${idx} ---`);
            console.log(response.data.substring(idx - 100, idx + 200));
            idx = response.data.indexOf("0314446814", idx + 1);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
