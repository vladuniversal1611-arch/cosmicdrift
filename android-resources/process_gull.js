/*
 * Build a seagull FLAP sprite strip from the 4-frame sheet (black background).
 * Each frame is aligned by the bird's BODY/beak (the stable right portion) so
 * the wings flap while the body stays put. Output: assets/map/gull_strip.png
 * (4 equal cells in a row) — logs the cell aspect for the CSS.
 *
 *   node android-resources/process_gull.js <sheet.jpg>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www', 'assets', 'map');
const input = process.argv[2];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');
  const res = await page.evaluate(async (src) => {
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
    const alphaAt = (x, y) => px[(y * W + x) * 4 + 3];
    // column split
    const solid = []; for (let x = 0; x < W; x++) { let m = 0; for (let y = 0; y < H; y++) { const a = alphaAt(x, y); if (a > m) m = a; } solid[x] = m > 55; }
    const runs = []; let s = -1, gap = 0;
    for (let x = 0; x < W; x++) { if (solid[x]) { if (s < 0) s = x; gap = 0; } else if (s >= 0) { gap++; if (gap > 14) { runs.push([s, x - gap]); s = -1; gap = 0; } } }
    if (s >= 0) runs.push([s, W - 1]);

    // per-frame bbox + body anchor (beak x = right edge; body y = weighted centre of right 35%)
    const frames = runs.map(function (r) {
      let x0 = r[0], x1 = r[1];
      while (x0 > 0 && solidFaint(x0 - 1)) x0--;
      while (x1 < W - 1 && solidFaint(x1 + 1)) x1++;
      function solidFaint(x) { for (let y = 0; y < H; y++) if (alphaAt(x, y) > 8) return true; return false; }
      let y0 = H, y1 = 0;
      for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) { if (alphaAt(x, y) > 8) { if (y < y0) y0 = y; if (y > y1) y1 = y; break; } }
      const bw = x1 - x0 + 1;
      const bodyX0 = Math.floor(x1 - 0.35 * bw);
      let sy = 0, sw = 0;
      for (let x = bodyX0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const a = alphaAt(x, y); if (a > 40) { sy += y * a; sw += a; } }
      const bodyY = sw ? sy / sw : (y0 + y1) / 2;
      return { x0, x1, y0, y1, bodyY };
    });

    const pad = 10;
    let maxLeft = 0, maxTop = 0, maxBot = 0;
    frames.forEach(function (f) {
      maxLeft = Math.max(maxLeft, f.x1 - f.x0);
      maxTop = Math.max(maxTop, f.bodyY - f.y0);
      maxBot = Math.max(maxBot, f.y1 - f.bodyY);
    });
    const cellW = Math.round(maxLeft + 2 * pad);
    const cellH = Math.round(2 * Math.max(maxTop, maxBot) + 2 * pad);
    const anchorX = cellW - pad;          // beak near right edge
    const anchorY = Math.round(cellH / 2); // body vertically centred

    const strip = document.createElement('canvas');
    strip.width = cellW * frames.length; strip.height = cellH;
    const sc = strip.getContext('2d');
    frames.forEach(function (f, idx) {
      const cw = f.x1 - f.x0 + 1, ch = f.y1 - f.y0 + 1;
      const dx = idx * cellW + (anchorX - (f.x1 - f.x0));
      const dy = anchorY - (f.bodyY - f.y0);
      sc.save();
      sc.beginPath(); sc.rect(idx * cellW, 0, cellW, cellH); sc.clip();
      sc.drawImage(cv, f.x0, f.y0, cw, ch, dx, dy, cw, ch);
      sc.restore();
    });
    // downscale the whole strip so the inlined asset stays light
    const targetH = 200, k = targetH / cellH;
    const out = document.createElement('canvas');
    out.width = Math.round(strip.width * k); out.height = Math.round(targetH);
    const oc = out.getContext('2d'); oc.imageSmoothingQuality = 'high';
    oc.drawImage(strip, 0, 0, out.width, out.height);
    return { url: out.toDataURL('image/png'), cellW: Math.round(cellW * k), cellH: Math.round(cellH * k), frames: frames.length };
  }, 'data:image/png;base64,' + fs.readFileSync(input).toString('base64'));

  const buf = Buffer.from(res.url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(OUT, 'gull_strip.png'), buf);
  console.log('gull_strip.png', res.frames, 'frames', res.cellW + 'x' + res.cellH,
    'ratio', (res.cellH / res.cellW).toFixed(3), (buf.length / 1024).toFixed(0) + 'KB');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
