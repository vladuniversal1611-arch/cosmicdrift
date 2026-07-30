/* Slice the pause-menu pieces out of the sprite sheet (on pure black):
   pause_frame (panel + pause badge), btn_pause_gold, btn_pause_purple.
   Each region is luminance-keyed to transparent and tight-cropped.
   Usage: node process_pause.js <sheet.png>                                    */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../www/assets/ui2');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const SRC = process.argv[2];

// crop regions as fractions [x0,y0,x1,y1] of the full sheet
const REGIONS = {
  pause_frame:      [0.012, 0.012, 0.625, 0.565],
  btn_pause_gold:   [0.655, 0.198, 0.992, 0.307],
  btn_pause_purple: [0.655, 0.315, 0.992, 0.420]
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  await page.evaluate(u => new Promise(r => { const i = new Image(); i.onload = () => { window.__img = i; r(); }; i.src = u; }),
    'data:image/png;base64,' + fs.readFileSync(SRC).toString('base64'));

  for (const [name, fr] of Object.entries(REGIONS)) {
    const uri = await page.evaluate(({ fr }) => {
      const img = window.__img, W = img.width, H = img.height;
      const rx0 = Math.round(fr[0] * W), ry0 = Math.round(fr[1] * H), rx1 = Math.round(fr[2] * W), ry1 = Math.round(fr[3] * H);
      const rw = rx1 - rx0, rh = ry1 - ry0;
      const c = document.getElementById('c'); c.width = rw; c.height = rh;
      const g = c.getContext('2d'); g.drawImage(img, rx0, ry0, rw, rh, 0, 0, rw, rh);
      const id = g.getImageData(0, 0, rw, rh), d = id.data;
      const lo = 14, hi = 46;
      for (let p = 0; p < d.length; p += 4) {
        const v = Math.max(d[p], d[p + 1], d[p + 2]);
        let a = (v - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a;
        d[p + 3] = Math.round(a * 255);
      }
      g.putImageData(id, 0, 0);
      let minx = rw, miny = rh, maxx = 0, maxy = 0;
      for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (d[(y * rw + x) * 4 + 3] > 24) {
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
      const cw = maxx - minx + 1, ch = maxy - miny + 1;
      const o = document.createElement('canvas'); o.width = cw; o.height = ch;
      o.getContext('2d').drawImage(c, minx, miny, cw, ch, 0, 0, cw, ch);
      return o.toDataURL('image/webp', 0.92);
    }, { fr });
    fs.writeFileSync(path.join(OUT, name + '.webp'), Buffer.from(uri.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
    console.log(name, '->', (fs.statSync(path.join(OUT, name + '.webp')).size / 1024 | 0) + 'KB');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
