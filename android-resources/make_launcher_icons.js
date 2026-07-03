/* Generate Android launcher icons (legacy + round + adaptive foreground) at
   every density from android-resources/icon-1024.png using headless Chromium.
   Avoids the sharp/native-binary dependency of @capacitor/assets. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'icon-1024.png');
const RES = path.join(ROOT, 'android/app/src/main/res');

// legacy/round launcher px per density, and adaptive foreground px (108dp base).
const DENS = [
  { dir: 'mipmap-mdpi',    legacy: 48,  fg: 108 },
  { dir: 'mipmap-hdpi',    legacy: 72,  fg: 162 },
  { dir: 'mipmap-xhdpi',   legacy: 96,  fg: 216 },
  { dir: 'mipmap-xxhdpi',  legacy: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', legacy: 192, fg: 432 },
];

(async () => {
  const b64 = fs.readFileSync(SRC).toString('base64');
  const dataUri = 'data:image/png;base64,' + b64;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  await page.evaluate((uri) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { window.__img = img; res(); };
    img.src = uri;
  }), dataUri);

  async function render(size, mode) {
    // mode: 'square' | 'round' | 'foreground'
    return await page.evaluate(({ size, mode }) => {
      const c = document.getElementById('c');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingQuality = 'high';
      const img = window.__img;
      if (mode === 'round') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();
      } else if (mode === 'foreground') {
        // Draw the icon within the adaptive safe zone (centre ~72/108) so the
        // system mask never clips the subject. Margin = transparent.
        const inner = Math.round(size * (72 / 108));
        const off = Math.round((size - inner) / 2);
        ctx.drawImage(img, off, off, inner, inner);
      } else {
        ctx.drawImage(img, 0, 0, size, size);
      }
      return c.toDataURL('image/png');
    }, { size, mode });
  }

  async function save(uri, file) {
    const data = uri.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
  }

  for (const d of DENS) {
    const dir = path.join(RES, d.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await save(await render(d.legacy, 'square'), path.join(dir, 'ic_launcher.png'));
    await save(await render(d.legacy, 'round'),  path.join(dir, 'ic_launcher_round.png'));
    await save(await render(d.fg, 'foreground'), path.join(dir, 'ic_launcher_foreground.png'));
    console.log('wrote', d.dir, `legacy=${d.legacy} fg=${d.fg}`);
  }

  // Play Store 512 icon
  await save(await render(512, 'square'), path.join(__dirname, 'playstore-icon-512.png'));
  console.log('wrote playstore-icon-512.png');

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
