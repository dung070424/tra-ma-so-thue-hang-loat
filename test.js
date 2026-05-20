const axios = require('axios');
const { JSDOM } = require('jsdom');

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
        
        console.log(`Status: ${response.status}`);
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;
        
        // Let's print some info to understand the DOM
        const titleEl = doc.querySelector('h1.h1');
        console.log("Title H1:", titleEl ? titleEl.textContent.trim() : "Not found");
        
        const nameEl = doc.querySelector('th[itemprop="name"]');
        console.log("Company Name (name itemprop):", nameEl ? nameEl.textContent.trim() : "Not found");

        const statusEl = doc.querySelector('td#tax-status-html');
        console.log("Status Element:", statusEl ? statusEl.textContent.trim() : "Not found");

        // Let's print all rows in table-taxinfo
        const rows = doc.querySelectorAll('.table-taxinfo tbody tr, .table-taxinfo tr');
        console.log(`Found ${rows.length} rows in table-taxinfo`);
        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('td, th');
            const cellTexts = Array.from(cells).map(c => c.textContent.trim().replace(/\s+/g, ' '));
            console.log(`Row ${i}:`, cellTexts);
        });

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data headers:", error.response.headers);
        }
    }
}

test();
