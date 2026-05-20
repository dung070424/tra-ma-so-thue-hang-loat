const axios = require('axios');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://masothue.com/"
};

async function test() {
    try {
        const bundleUrl = "https://static.masothue.com/dist/bundle-v202605120753.min.js";
        console.log(`Fetching bundle from: ${bundleUrl}`);
        const response = await axios.get(bundleUrl, { headers, timeout: 15000 });
        const code = response.data;
        console.log("Bundle fetched successfully. Length:", code.length);
        
        // Let's search for "token" or "Search" or form submission in the JS bundle
        const searchTerms = [
            'token',
            'Search',
            'submit',
            'form'
        ];
        
        for (const term of searchTerms) {
            let index = 0;
            let count = 0;
            while ((index = code.indexOf(term, index)) !== -1) {
                count++;
                if (count <= 3) {
                    console.log(`\nMatch for '${term}' at position ${index}:`);
                    console.log(code.substring(Math.max(0, index - 100), Math.min(code.length, index + 150)));
                }
                index += term.length;
            }
            console.log(`\nTotal matches for '${term}': ${count}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
