const axios = require('axios');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://masothue.com/"
};

async function test() {
    try {
        console.log("Step 1: Visiting homepage...");
        const homeRes = await axios.get("https://masothue.com/", { headers, timeout: 10000 });
        console.log("Homepage Status:", homeRes.status);
        
        // Capture cookies
        const cookies = homeRes.headers['set-cookie'];
        console.log("Cookies received:", cookies);
        
        const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
        console.log("Cookie string:", cookieString);
        
        const searchHeaders = {
            ...headers,
            "Cookie": cookieString
        };
        
        console.log("\nStep 2: Searching with cookies...");
        const mst = "0314446814";
        const url = `https://masothue.com/Search/?q=${mst}`;
        
        const searchRes = await axios.get(url, {
            headers: searchHeaders,
            timeout: 10000,
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        console.log("Search Status:", searchRes.status);
        console.log("Search Headers:", searchRes.headers);
        
        if (searchRes.status === 302) {
            console.log("Redirect Location:", searchRes.headers.location);
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
