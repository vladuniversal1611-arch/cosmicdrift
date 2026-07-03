/* Generate branded splash screens (dark background + centred icon) at every
   density/orientation, replacing the default Capacitor logo splash. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'icon-1024.png');
const RES = path.join(ROOT, 'android/app/src/main/res');
const BG = '#120a28';

const SIZES = {
  'drawable':              [480, 320],
  'drawable-port-mdpi':    [320, 480],
  'drawable-port-hdpi':    [480, 800],
  'drawable-port-xhdpi':   [720, 1280],
  'drawable-port-xxhdpi':  [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
  'drawable-land-mdpi':    [480, 320],
  'drawable-land-hdpi':    [800, 480],
  'drawable-land-xhdpi':   [1280, 720],
  'drawable-land-xxhdpi':  [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
};

(async () => {
  const dataUri = 'data:image/png;base64,' + fs.readFileSync(SRC).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  await page.evaluate((uri) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { window.__img = img; res(); };
    img.src = uri;
  }), dataUri);

  for (const [dir, [w, h]] of Object.entries(SIZES)) {
    const uri = await page.evaluate(({ w, h, bg }) => {
      const c = document.getElementById('c');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingQuality = 'high';
      const img = window.__img;
      // Icon occupies ~38% of the shorter side, centred, with a soft rounding.
      const s = Math.round(Math.min(w, h) * 0.38);
      const x = Math.round((w - s) / 2), y = Math.round((h - s) / 2);
      const r = Math.round(s * 0.22);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + s, y, x + s, y + s, r);
      ctx.arcTo(x + s, y + s, x, y + s, r);
      ctx.arcTo(x, y + s, x, y, r);
      ctx.arcTo(x, y, x + s, y, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, s, s);
      ctx.restore();
      return c.toDataURL('image/png');
    }, { w, h, bg: BG });
    const outDir = path.join(RES, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'splash.png'),
      Buffer.from(uri.replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log('wrote', dir, `${w}x${h}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
