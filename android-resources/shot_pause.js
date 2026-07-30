const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => { if (!/Baloo|font|net::ERR/.test(String(e))) errs.push(String(e)); });
  await page.goto('http://localhost:8090/DragonMergeBlast.html');
  await page.waitForTimeout(1200);
  // start a level then open pause
  await page.evaluate(() => { try { window.Game.startLevel(1); } catch(e){} });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { try { window.Game.pause(); } catch(e){} });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'pause.png') });
  console.log('errs:', JSON.stringify(errs));
  await browser.close();
})();
