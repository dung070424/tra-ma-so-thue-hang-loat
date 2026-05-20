const axios = require('axios');
const { JSDOM } = require('jsdom');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
};

async function test() {
    try {
        const response = await axios.get("https://masothue.com/", { headers, timeout: 10000 });
        const dom = new JSDOM(response.data);
        const doc = dom.window.document;
        
        // Find form
        const forms = doc.querySelectorAll('form');
        console.log(`Found ${forms.length} forms:`);
        forms.forEach((form, i) => {
            console.log(`Form ${i}:`);
            console.log("  action:", form.getAttribute('action'));
            console.log("  method:", form.getAttribute('method'));
            console.log("  id:", form.getAttribute('id'));
            console.log("  class:", form.getAttribute('class'));
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                console.log(`    Input - name: "${input.getAttribute('name')}", id: "${input.getAttribute('id')}", type: "${input.getAttribute('type')}"`);
            });
        });
        
        // Find scripts
        console.log("\nSearching for scripts related to search...");
        const scripts = doc.querySelectorAll('script');
        scripts.forEach((script, i) => {
            const src = script.getAttribute('src');
            const text = script.textContent;
            if (src) {
                console.log(`Script ${i} src: ${src}`);
            } else if (text.includes("search") || text.includes("Search") || text.includes("submit") || text.includes("q")) {
                console.log(`Script ${i} inline (snippet):`);
                console.log(text.substring(0, 1000));
            }
        });
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
