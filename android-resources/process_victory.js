/* Cut the victory-screen art off pure black -> transparent WebP.
   - frame:   luminance key, tight crop  -> victory_frame.webp
   - star:    luminance key, tight crop   -> star_big.webp
   - buttons: luminance key, split top(green)/bottom(purple) -> btn_green/btn_purple.webp
   Usage: node process_victory.js <frame.png> <star.png> <buttons.png>            */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../www/assets/ui2');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const [frameSrc, starSrc, btnSrc] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const load = f => page.evaluate(u => new Promise(r => { const i = new Image(); i.onload = () => { window.__img = i; r(); }; i.src = u; }),
    'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
  const save = (uri, f) => fs.writeFileSync(f, Buffer.from(uri.replace(/^data:image\/\w+;base64,/, ''), 'base64'));

  // key: luminance alpha (bright kept, pure black dropped) + optional crop band [y0,y1]
  async function key(name, band) {
    const uri = await page.evaluate(({ band }) => {
      const img = window.__img, W = img.width, H = img.height;
      const c = document.getElementById('c'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const id = g.getImageData(0, 0, W, H), d = id.data;
      const lo = 14, hi = 46;
      for (let p = 0; p < d.length; p += 4) {
        const v = Math.max(d[p], d[p + 1], d[p + 2]);
        let a = (v - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a;
        d[p + 3] = Math.round(a * 255);
      }
      g.putImageData(id, 0, 0);
      // crop to opaque bbox, optionally limited to a vertical band (for splitting)
      const y0 = band ? Math.round(H * band[0]) : 0, y1 = band ? Math.round(H * band[1]) : H;
      let minx = W, miny = H, maxx = 0, maxy = 0;
      for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20) {
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
      const cw = maxx - minx + 1, ch = maxy - miny + 1;
      const o = document.createElement('canvas'); o.width = cw; o.height = ch;
      o.getContext('2d').drawImage(c, minx, miny, cw, ch, 0, 0, cw, ch);
      return o.toDataURL('image/webp', 0.92);
    }, { band });
    save(uri, path.join(OUT, name + '.webp'));
    console.log(name, '->', (fs.statSync(path.join(OUT, name + '.webp')).size / 1024 | 0) + 'KB');
  }

  if (frameSrc) { await load(frameSrc); await key('victory_frame'); }
  if (starSrc)  { await load(starSrc);  await key('star_big'); }
  if (btnSrc)   { await load(btnSrc); await key('btn_green', [0, 0.5]); await key('btn_purple', [0.5, 1]); }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
