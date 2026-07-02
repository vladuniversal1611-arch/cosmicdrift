/*
 * Process the GPT-generated map art into game-ready sprites:
 *   - nodes sheet (5 platforms on black) -> assets/map/p_done|current|locked|upcoming|boss.png
 *   - path sheet  (3 pebbles on black)   -> assets/map/bead_done|todo|moss.png
 *   - water bg (full-bleed)              -> assets/map/water_tile.png (seamless vertical tile)
 *
 * Chroma-keys the black background in a Chromium canvas, splits the row into
 * clusters by column, tight-crops each, downscales, and writes PNGs.
 *
 *   node android-resources/process_map_art.js <nodes.png> <path.png> <water.png>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www', 'assets', 'map');
fs.mkdirSync(OUT, { recursive: true });

const [nodesIn, pathIn, waterIn] = process.argv.slice(2);
const NODE_NAMES = ['p_done', 'p_current', 'p_locked', 'p_upcoming', 'p_boss'];
const BEAD_NAMES = ['bead_done', 'bead_todo', 'bead_moss'];

function b64(p) { return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64'); }

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  // --- chroma-key + column split, returns array of cropped dataURLs ---
  async function splitSheet(dataURL, expected, targetH) {
    return await page.evaluate(async ([src, expected, targetH]) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = src; });
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, H); const px = d.data;
      // chroma-key black: alpha ramps with luminance = max(r,g,b)
      const LO = 16, HI = 46;
      for (let i = 0; i < px.length; i += 4) {
        const L = Math.max(px[i], px[i + 1], px[i + 2]);
        let a = (L - LO) / (HI - LO);
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        px[i + 3] = Math.round(a * 255);
      }
      ctx.putImageData(d, 0, 0);
      // column solidity (alpha>60) to find clusters; faint>8 for crop bbox
      const solid = new Array(W).fill(false), faint = new Array(W).fill(false);
      for (let x = 0; x < W; x++) {
        let ms = 0, mf = 0;
        for (let y = 0; y < H; y++) { const a = px[(y * W + x) * 4 + 3]; if (a > ms) ms = a; }
        solid[x] = ms > 60; faint[x] = ms > 8;
      }
      // maximal runs of solid columns, merging tiny internal gaps (<=10px)
      const runs = []; let s = -1, gap = 0;
      for (let x = 0; x < W; x++) {
        if (solid[x]) { if (s < 0) s = x; gap = 0; }
        else if (s >= 0) { gap++; if (gap > 10) { runs.push([s, x - gap]); s = -1; gap = 0; } }
      }
      if (s >= 0) runs.push([s, W - 1]);
      // crop each run: expand x to faint edges, find y bbox, scale to targetH
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
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
        const scale = targetH / ch;
        const o = document.createElement('canvas'); o.width = Math.round(cw * scale); o.height = Math.round(targetH);
        const octx = o.getContext('2d'); octx.imageSmoothingQuality = 'high';
        octx.drawImage(cv, x0, y0, cw, ch, 0, 0, o.width, o.height);
        out.push({ url: o.toDataURL('image/png'), w: o.width, h: o.height });
      }
      return out;
    }, [dataURL, expected, targetH]);
  }

  function save(name, dataURL) {
    const buf = Buffer.from(dataURL.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, name + '.png'), buf);
    return buf.length;
  }

  if (nodesIn) {
    const parts = await splitSheet(b64(nodesIn), 5, 240);
    console.log('nodes clusters:', parts.length);
    parts.forEach((p, i) => { if (NODE_NAMES[i]) console.log(' ', NODE_NAMES[i], p.w + 'x' + p.h, (save(NODE_NAMES[i], p.url) / 1024).toFixed(0) + 'KB'); });
  }
  if (pathIn) {
    const parts = await splitSheet(b64(pathIn), 3, 96);
    console.log('path clusters:', parts.length);
    parts.forEach((p, i) => { if (BEAD_NAMES[i]) console.log(' ', BEAD_NAMES[i], p.w + 'x' + p.h, (save(BEAD_NAMES[i], p.url) / 1024).toFixed(0) + 'KB'); });
  }
  if (waterIn) {
    // downscale + stack a vertical mirror so it tiles seamlessly with repeat-y
    const url = await page.evaluate(async ([src]) => {
      const img = new Image(); await new Promise(r => { img.onload = r; img.src = src; });
      const TW = 480; const scale = TW / img.naturalWidth; const TH = Math.round(img.naturalHeight * scale);
      const o = document.createElement('canvas'); o.width = TW; o.height = TH * 2;
      const c = o.getContext('2d'); c.imageSmoothingQuality = 'high';
      c.drawImage(img, 0, 0, TW, TH);
      c.save(); c.translate(0, TH * 2); c.scale(1, -1); c.drawImage(img, 0, 0, TW, TH); c.restore();
      return o.toDataURL('image/jpeg', 0.72);
    }, [b64(waterIn)]);
    const wbuf = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, 'water_tile.jpg'), wbuf);
    console.log('water_tile.jpg', (wbuf.length / 1024).toFixed(0) + 'KB');
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
