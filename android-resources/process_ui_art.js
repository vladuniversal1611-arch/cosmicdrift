/* Process GPT-made UI art via headless Chromium canvas:
   - background: cover-crop to portrait, downscale, export WebP
   - frames: flood-fill the flat/glow background from the borders -> transparent,
     tight-crop, export PNG (alpha) + WebP.
   Usage: node process_ui_art.js <bg.png> <panel.png> <progress.png>            */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTDIR = path.resolve(__dirname, '../www/assets/ui2');
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const [bgSrc, panelSrc, progSrc] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  async function load(file) {
    const uri = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
    return page.evaluate((u) => new Promise((res) => {
      const img = new Image();
      img.onload = () => { window.__img = img; res({ w: img.width, h: img.height }); };
      img.src = u;
    }), uri);
  }
  const save = (uri, file) => fs.writeFileSync(file, Buffer.from(uri.replace(/^data:image\/\w+;base64,/, ''), 'base64'));

  // ---------- Background: cover to 800x1424, WebP ----------
  if (bgSrc) {
    await load(bgSrc);
    const uri = await page.evaluate(() => {
      const TW = 800, TH = 1424;
      const c = document.getElementById('c'); c.width = TW; c.height = TH;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
      const img = window.__img;
      const s = Math.max(TW / img.width, TH / img.height);
      const dw = img.width * s, dh = img.height * s;
      g.drawImage(img, (TW - dw) / 2, (TH - dh) / 2, dw, dh);
      return c.toDataURL('image/webp', 0.86);
    });
    save(uri, path.join(OUTDIR, 'game_bg.webp'));
    console.log('bg ->', path.join(OUTDIR, 'game_bg.webp'), (fs.statSync(path.join(OUTDIR, 'game_bg.webp')).size / 1024 | 0) + 'KB');
  }

  // ---------- Frame extractor: flood-fill background from borders ----------
  async function frame(file, name, tol) {
    await load(file);
    const uri = await page.evaluate(({ tol }) => {
      const img = window.__img;
      const W = img.width, H = img.height;
      const c = document.getElementById('c'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const id = g.getImageData(0, 0, W, H); const d = id.data;
      const seen = new Uint8Array(W * H);
      // seed from all border pixels; BFS removing pixels close to the local
      // background (flat gray + soft glow). Stops at the crisp gold/gem edges.
      const stack = [];
      const push = (x, y, r0, g0, b0) => { const i = y * W + x; if (!seen[i]) { seen[i] = 1; stack.push(i, r0, g0, b0); } };
      for (let x = 0; x < W; x++) { push(x, 0, d[(x) * 4], d[(x) * 4 + 1], d[(x) * 4 + 2]); push(x, H - 1, d[((H - 1) * W + x) * 4], d[((H - 1) * W + x) * 4 + 1], d[((H - 1) * W + x) * 4 + 2]); }
      for (let y = 0; y < H; y++) { push(0, y, d[(y * W) * 4], d[(y * W) * 4 + 1], d[(y * W) * 4 + 2]); push(W - 1, y, d[(y * W + W - 1) * 4], d[(y * W + W - 1) * 4 + 1], d[(y * W + W - 1) * 4 + 2]); }
      while (stack.length) {
        const b0 = stack.pop(), g0 = stack.pop(), r0 = stack.pop(), i = stack.pop();
        const x = i % W, y = (i / W) | 0, p = i * 4;
        const dr = d[p] - r0, dg = d[p + 1] - g0, db = d[p + 2] - b0;
        if (dr * dr + dg * dg + db * db > tol * tol) continue; // hit an edge
        d[p + 3] = 0; // transparent
        const nr = d[p], ng = d[p + 1], nb = d[p + 2];
        if (x > 0) push(x - 1, y, nr, ng, nb);
        if (x < W - 1) push(x + 1, y, nr, ng, nb);
        if (y > 0) push(x, y - 1, nr, ng, nb);
        if (y < H - 1) push(x, y + 1, nr, ng, nb);
      }
      // feather: soften 1px alpha at the boundary
      g.putImageData(id, 0, 0);
      // tight crop to non-transparent bbox
      let minx = W, miny = H, maxx = 0, maxy = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (d[(y * W + x) * 4 + 3] > 12) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }
      const cw = maxx - minx + 1, ch = maxy - miny + 1;
      const o = document.createElement('canvas'); o.width = cw; o.height = ch;
      o.getContext('2d').drawImage(c, minx, miny, cw, ch, 0, 0, cw, ch);
      return o.toDataURL('image/png');
    }, { tol });
    save(uri, path.join(OUTDIR, name + '.png'));
    console.log(name, '->', (fs.statSync(path.join(OUTDIR, name + '.png')).size / 1024 | 0) + 'KB');
  }

  if (panelSrc) await frame(panelSrc, 'panel_frame', 78);
  if (progSrc) await frame(progSrc, 'progress_frame', 78);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
