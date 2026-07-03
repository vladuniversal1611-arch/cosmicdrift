/*
 * Cut new dragon sprites off a black background and save them as transparent
 * PNGs in www/assets/dragons/. Uses a flood-fill from the borders (not a plain
 * luminance threshold) so DARK subjects on black (e.g. the shadow dragon) keep
 * their body — only background-connected black is removed. Glow auras are kept.
 *
 *   node android-resources/process_dragon.js in1.png:magma in2.png:tide ...
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www', 'assets', 'dragons');
const pairs = process.argv.slice(2).map(a => { const i = a.lastIndexOf(':'); return { file: a.slice(0, i), name: a.slice(i + 1) }; });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<canvas></canvas>');
  for (const p of pairs) {
    const url = 'data:image/png;base64,' + fs.readFileSync(p.file).toString('base64');
    const out = await page.evaluate(async ([src, targetH]) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = src; });
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, W, H); const px = d.data;
      const N = W * H;
      const lum = new Uint8Array(N);
      for (let i = 0; i < N; i++) lum[i] = Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
      // flood fill background (dark, border-connected)
      const TH = 44;
      const bg = new Uint8Array(N);
      const stack = [];
      for (let x = 0; x < W; x++) { stack.push(x); stack.push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { stack.push(y * W); stack.push(y * W + W - 1); }
      while (stack.length) {
        const i = stack.pop();
        if (bg[i] || lum[i] >= TH) continue;
        bg[i] = 1;
        const x = i % W, y = (i / W) | 0;
        if (x > 0) stack.push(i - 1);
        if (x < W - 1) stack.push(i + 1);
        if (y > 0) stack.push(i - W);
        if (y < H - 1) stack.push(i + W);
      }
      // alpha: 0 for background; feather near the boundary by luminance
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let i = 0; i < N; i++) {
        let a;
        if (bg[i]) a = 0;
        else { a = lum[i] < 60 ? Math.round(lum[i] / 60 * 255) : 255; } // soften only very dark rim
        px[i * 4 + 3] = a;
        if (a > 10) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      ctx.putImageData(d, 0, 0);
      const pad = 8;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1, scale = targetH / ch;
      const o = document.createElement('canvas'); o.width = Math.round(cw * scale); o.height = Math.round(targetH);
      const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
      oc.drawImage(cv, x0, y0, cw, ch, 0, 0, o.width, o.height);
      return { url: o.toDataURL('image/png'), w: o.width, h: o.height };
    }, [url, 256]);
    const buf = Buffer.from(out.url.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, p.name + '.png'), buf);
    console.log(p.name + '.png', out.w + 'x' + out.h, (buf.length / 1024).toFixed(0) + 'KB');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
