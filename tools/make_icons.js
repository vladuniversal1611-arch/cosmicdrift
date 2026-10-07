// Dev-only: renders PLACEHOLDER icons from the game's own vehicle drawing code.
// Final store artwork is an EXTERNAL ASSET TASK (see RELEASE.md) and should
// replace these files. Usage: node tools/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage();
  await p.goto('file://' + path.join(ROOT, 'hill_rush.html'));
  // kind: 'full' (square, background baked in), 'round-safe' (maskable: art inside 80%),
  // 'fg' (adaptive foreground: transparent, art inside the 66/108 safe zone), 'feature' (1024x500)
  const render = (w, h, kind) => p.evaluate(([w, h, kind]) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
    const s = Math.min(w, h) / 512;
    if (kind !== 'fg') {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#56CCF2'); g.addColorStop(1, '#bfe9ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(76,175,80,.55)'; c.beginPath(); c.moveTo(0, h * .62); c.quadraticCurveTo(w * .35, h * .42, w * .7, h * .6); c.quadraticCurveTo(w * .88, h * .68, w, h * .58); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#8b6914'; c.beginPath(); c.moveTo(0, h * .8); c.quadraticCurveTo(w * .5, h * .66, w, h * .78); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.strokeStyle = '#4caf50'; c.lineWidth = 22 * s; c.beginPath(); c.moveTo(0, h * .8); c.quadraticCurveTo(w * .5, h * .66, w, h * .78); c.stroke();
    }
    const art = kind === 'fg' ? .62 : kind === 'round-safe' ? .72 : kind === 'feature' ? .9 : .86;
    const vd = VEHICLES[0], cx = kind === 'feature' ? w * .3 : w / 2, cy = kind === 'feature' ? h * .52 : h * (kind === 'fg' ? .5 : .5);
    const k = Math.min(w, h) * art / 190;
    c.save(); c.translate(cx, cy - 8 * k); c.rotate(-.12); c.scale(k, k);
    const sy = vd.wr + 10;
    drawSusp(c, 0, 0, 0, vd.axF, vd.axF, sy); drawSusp(c, 0, 0, 0, vd.axR, vd.axR, sy);
    drawBody(c, vd, 0, 0, 0, { ox: 0, oy: 0, lean: -.1, mood: 'happy', blink: 0 });
    drawWheel(c, vd.axR, sy, vd.wr, 0, vd); drawWheel(c, vd.axF, sy, vd.wr, .6, vd);
    c.restore();
    if (kind === 'feature') {
      c.fillStyle = '#fff'; c.font = `900 ${h * .15}px Arial`; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.lineWidth = h * .025; c.strokeStyle = '#1a6614'; c.strokeText('HILL RUSH', w * .52, h * .42); c.fillText('HILL RUSH', w * .52, h * .42);
      c.font = `700 ${h * .06}px Arial`; c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText('PLACEHOLDER ART', w * .53, h * .6);
    }
    return cv.toDataURL('image/png').split(',')[1];
  }, [w, h, kind]);
  const out = [];
  const save = async (rel, w, h, kind) => {
    const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(await render(w, h, kind), 'base64')); out.push(rel);
  };
  // PWA / web
  await save('icons/icon-192.png', 192, 192, 'full');
  await save('icons/icon-512.png', 512, 512, 'full');
  await save('icons/icon-maskable-512.png', 512, 512, 'round-safe');
  // Play Console listing (placeholders)
  await save('store/placeholder/play-icon-512.png', 512, 512, 'full');
  await save('store/placeholder/feature-graphic-1024x500.png', 1024, 500, 'feature');
  // Android launcher: legacy square icons + adaptive foreground per density
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const d in dens) {
    const k = dens[d];
    await save(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, 48 * k, 48 * k, 'full');
    await save(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, 48 * k, 48 * k, 'full');
    await save(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, 108 * k, 108 * k, 'fg');
  }
  await b.close();
  console.log(out.join('\n'));
})();
