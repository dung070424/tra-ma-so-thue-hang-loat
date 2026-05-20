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
        console.log("Navigating to Homepage: https://masothue.com/");
        await page.goto("https://masothue.com/", { waitUntil: 'networkidle', timeout: 30000 });
        
        const mst = "0314446814";
        console.log(`Typing tax code: ${mst}`);
        
        // Wait for search input to be ready
        await page.waitForSelector('input#search');
        await page.fill('input#search', mst);
        
        console.log("Pressing Enter to search...");
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
        ]);
        
        console.log("Final URL after UI Search:", page.url());
        
        // Extract company details
        const h1 = await page.locator('h1').first().innerText().catch(() => "Not found");
        console.log("H1 Title:", h1 ? h1.trim() : "Not found");
        
        const rows = await page.locator('table.table-taxinfo tr').all().catch(() => []);
        console.log(`Found ${rows.length} rows inside table.table-taxinfo`);
        
        const companyData = {};
        for (const row of rows) {
            const cells = await row.locator('td, th').all().catch(() => []);
            if (cells.length >= 2) {
                const label = (await cells[0].innerText().catch(() => "")).trim().replace(/\s+/g, ' ');
                const val = (await cells[1].innerText().catch(() => "")).trim().replace(/\s+/g, ' ');
                if (label) companyData[label] = val;
            }
        }
        
        console.log("\nExtracted Data:\n", JSON.stringify(companyData, null, 2));

    } catch (e) {
        console.error("Error occurred:", e.message);
    } finally {
        await browser.close();
    }
}

test();
