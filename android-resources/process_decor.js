/*
 * Process the GPT-generated map DECOR sheets (black background) into sprites:
 *   clouds sheet   -> cloud1, cloud2, cloud3
 *   islet sheet    -> islet, gulls, signpost
 *   nautical sheet -> boat, lighthouse, buoy
 * Chroma-keys black, splits each row into clusters, tight-crops, downscales.
 *
 *   node android-resources/process_decor.js <clouds> <islet> <nautical>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www', 'assets', 'map');
fs.mkdirSync(OUT, { recursive: true });

const [cloudsIn, isletIn, nautIn] = process.argv.slice(2);
const b64 = p => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');

  async function splitSheet(dataURL, targetH) {
    return await page.evaluate(async ([src, targetH]) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = src; });
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, H); const px = d.data;
      const LO = 14, HI = 44;
      for (let i = 0; i < px.length; i += 4) {
        const L = Math.max(px[i], px[i + 1], px[i + 2]);
        let a = (L - LO) / (HI - LO); a = a < 0 ? 0 : a > 1 ? 1 : a;
        px[i + 3] = Math.round(a * 255);
      }
      ctx.putImageData(d, 0, 0);
      const solid = new Array(W).fill(false), faint = new Array(W).fill(false);
      for (let x = 0; x < W; x++) {
        let ms = 0; for (let y = 0; y < H; y++) { const a = px[(y * W + x) * 4 + 3]; if (a > ms) ms = a; }
        solid[x] = ms > 55; faint[x] = ms > 8;
      }
      const runs = []; let s = -1, gap = 0;
      for (let x = 0; x < W; x++) {
        if (solid[x]) { if (s < 0) s = x; gap = 0; }
        else if (s >= 0) { gap++; if (gap > 14) { runs.push([s, x - gap]); s = -1; gap = 0; } }
      }
      if (s >= 0) runs.push([s, W - 1]);
      const out = [];
      for (const [rx0, rx1] of runs) {
        let x0 = rx0, x1 = rx1;
        while (x0 > 0 && faint[x0 - 1]) x0--;
        while (x1 < W - 1 && faint[x1 + 1]) x1++;
        let y0 = H, y1 = 0;
        for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) {
          if (px[(y * W + x) * 4 + 3] > 8) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; }
        }
        const pad = 6;
        x0 = Math.max(0, x0 - pad); x1 = Math.min(W - 1, x1 + pad);
        y0 = Math.max(0, y0 - pad); y1 = Math.min(H - 1, y1 + pad);
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1, scale = targetH / ch;
        const o = document.createElement('canvas'); o.width = Math.round(cw * scale); o.height = Math.round(targetH);
        o.getContext('2d').drawImage(cv, x0, y0, cw, ch, 0, 0, o.width, o.height);
        out.push(o.toDataURL('image/png'));
      }
      return out;
    }, [dataURL, targetH]);
  }
  function save(name, url) {
    const buf = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, name + '.png'), buf);
    return (buf.length / 1024).toFixed(0) + 'KB';
  }
  async function run(input, names, targetH) {
    if (!input) return;
    const parts = await splitSheet(b64(input), targetH);
    console.log(path.basename(input), '->', parts.length, 'clusters');
    parts.forEach((u, i) => { if (names[i]) console.log('  ', names[i], save(names[i], u)); });
  }

  await run(cloudsIn, ['cloud1', 'cloud2', 'cloud3'], 200);
  await run(isletIn, ['islet', 'gulls', 'signpost'], 240);
  await run(nautIn, ['boat', 'lighthouse', 'buoy'], 260);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
