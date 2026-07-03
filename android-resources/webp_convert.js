/*
 * Convert the sprite assets to WebP (much smaller than PNG, visually identical
 * at q90) to shrink the app. Converts every PNG in the sprite folders + the
 * water JPG, writes the .webp next to it, and removes the original. Launcher
 * icons and Play-store art are left as PNG.
 *
 *   node android-resources/webp_convert.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const A = path.resolve(__dirname, '..', 'www', 'assets');
const FOLDERS = ['dragons', 'gems', 'specials', 'blockers', 'jelly', 'ui', 'panels', 'map'];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');
  async function toWebp(file, q) {
    const mime = file.endsWith('.jpg') ? 'jpeg' : 'png';
    const url = 'data:image/' + mime + ';base64,' + fs.readFileSync(file).toString('base64');
    const out = await page.evaluate(async ([src, q]) => {
      const img = new Image(); await new Promise(r => { img.onload = r; img.src = src; });
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q);
    }, [url, q]);
    return Buffer.from(out.split(',')[1], 'base64');
  }
  let before = 0, after = 0;
  for (const dir of FOLDERS) {
    const d = path.join(A, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      let q = null, out = null;
      if (f.endsWith('.png')) q = 0.9;
      else if (f === 'water_tile.jpg') q = 0.82;
      else continue;
      const buf = await toWebp(full, q);
      out = full.replace(/\.(png|jpg)$/, '.webp');
      before += fs.statSync(full).size; after += buf.length;
      fs.writeFileSync(out, buf);
      fs.unlinkSync(full);
    }
    console.log('converted', dir);
  }
  console.log('total PNG/JPG', (before / 1024 / 1024).toFixed(2) + 'MB', '-> WebP', (after / 1024 / 1024).toFixed(2) + 'MB');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
