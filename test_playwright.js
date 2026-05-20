const { chromium } = require('playwright');

async function test() {
    console.log("Launching headless browser...");
    const browser = await chromium.launch({ headless: true });
    
    // Create context with specific user agent
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
        const url = "https://masothue.com/0314446814-cong-ty-tnhh-yue-you";
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        console.log("Final Loaded URL:", page.url());
        
        // Take a screenshot to see what's happening
        await page.screenshot({ path: 'd:\\tramaSTT\\screenshot.png' });
        console.log("Screenshot saved to screenshot.png");
        
        // H1 Title
        const h1 = await page.locator('h1').first().innerText().catch(() => "Not found");
        console.log("H1 Title:", h1 ? h1.trim() : "Not found");
        
        // Table info rows
        const rows = await page.locator('table.table-taxinfo tr').all().catch(() => []);
        console.log(`Found ${rows.length} rows inside table.table-taxinfo`);
        
        const companyData = {};
        for (const row of rows) {
            const cells = await row.locator('td, th').all().catch(() => []);
            if (cells.length >= 2) {
                const label = (await cells[0].innerText().catch(() => "")).trim().replace(/\s+/g, ' ');
                const val = (await cells[1].innerText().catch(() => "")).trim().replace(/\s+/g, ' ');
                if (label) companyData[label] = val;
                console.log(`Row - [${label}]: "${val}"`);
            }
        }
        
        console.log("\nExtracted Company Data:\n", JSON.stringify(companyData, null, 2));

    } catch (e) {
        console.error("Error occurred:", e.message);
    } finally {
        await browser.close();
    }
}

test();
