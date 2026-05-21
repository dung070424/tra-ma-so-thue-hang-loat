const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://masothue.com/ma-so-thue/0103085460-012', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const rows = await page.$$eval('table.table-taxinfo tr', rows => rows.map(r => Array.from(r.querySelectorAll('th,td')).map(cell => cell.innerText.trim())));
    console.log(JSON.stringify(rows, null, 2));
    const h1 = await page.$eval('h1', el => el.innerText);
    console.log('H1:', h1);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await browser.close();
  }
})();
