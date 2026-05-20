const { chromium } = require('playwright');

async function test() {
    console.log("Launching browser...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log("Navigating to Homepage...");
        await page.goto("https://masothue.com/", { waitUntil: 'networkidle' });
        
        const mst = "0107758943";
        console.log(`Searching for: ${mst}`);
        await page.waitForSelector('input#search');
        await page.fill('input#search', mst);
        
        console.log("Pressing Enter...");
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {})
        ]);
        
        console.log("Final URL:", page.url());
        
        // Take a screenshot
        await page.screenshot({ path: 'd:\\tramaSTT\\fail_screenshot.png' });
        console.log("Saved screenshot to fail_screenshot.png");
        
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await browser.close();
    }
}

test();
