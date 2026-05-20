const { chromium } = require('playwright');

async function test() {
    console.log("Launching headless browser...");
    const browser = await chromium.launch({ headless: true });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh'
    });
    
    const page = await context.newPage();
    
    // Stealth: hide webdriver
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    try {
        const mst = "0314446814";
        const url = `https://masothue.com/Search/?q=${mst}`;
        console.log(`Navigating to Search URL: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        console.log("Final URL after Search Redirect:", page.url());
        
        // H1 Title
        const h1 = await page.locator('h1').first().innerText().catch(() => "Not found");
        console.log("H1 Title:", h1 ? h1.trim() : "Not found");
        
        // Table info rows
        const rows = await page.locator('table.table-taxinfo tr').all().catch(() => []);
        console.log(`Found ${rows.length} rows inside table.table-taxinfo`);
        
        if (rows.length > 0) {
            console.log("Success! Reached company details page.");
        } else {
            console.log("Failed. Stayed on homepage or loaded an incorrect page.");
        }

    } catch (e) {
        console.error("Error occurred:", e.message);
    } finally {
        await browser.close();
    }
}

test();
