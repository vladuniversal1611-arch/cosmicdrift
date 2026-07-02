/*
 * Generates Dragon Blast store art from the painted game sprites:
 *   - playstore-icon-512.png  (Google Play "app icon", 512x512, full-bleed)
 *   - www/assets/icon-512.png, icon-192.png, icon-1024.png  (in-app / master)
 *   - feature-graphic-1024x500.png  (Google Play "feature graphic")
 *
 * Uses Playwright to render an HTML/CSS composition and screenshot it at the
 * exact target pixel sizes, so the output inherits the AAA painted look of the
 * dragon/gem sprites instead of being drawn procedurally.
 *
 * Run:  node android-resources/make_store_art.js
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'www', 'assets');
const OUT_RES = __dirname;

function b64(p) {
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

const dragon = b64(path.join(A, 'dragons', 'flare.png'));
const dragonFrost = b64(path.join(A, 'dragons', 'frost.png'));
const dragonVerdant = b64(path.join(A, 'dragons', 'verdant.png'));
const gems = [0, 1, 2, 3, 4, 5].map(i => b64(path.join(A, 'gems', 'gem' + i + '.png')));

// Shared world background (deep-violet game theme #120a28 with a warm dragon glow)
const BG = `
  position:absolute; inset:0;
  background:
    radial-gradient(120% 90% at 50% 108%, rgba(255,150,45,.55), rgba(255,150,45,0) 42%),
    radial-gradient(90% 70% at 50% 30%, #4a2a86 0%, #2a1657 45%, #160b32 78%, #0c0722 100%);
`;

function sparkles(list) {
  return list.map(s => `<div class="spark" style="left:${s.x}%;top:${s.y}%;width:${s.s}px;height:${s.s}px;opacity:${s.o||0.9}"></div>`).join('');
}

const rays = `
  position:absolute; inset:-20%;
  background: repeating-conic-gradient(from 0deg at 50% 46%,
     rgba(255,224,150,.10) 0deg, rgba(255,224,150,0) 9deg 18deg);
  mix-blend-mode:screen; opacity:.6;
  -webkit-mask: radial-gradient(closest-side, #000 20%, transparent 72%);
          mask: radial-gradient(closest-side, #000 20%, transparent 72%);
`;

// ---------- ICON (square, full-bleed) ----------
function iconHTML(size) {
  const px = v => (v * size / 512) + 'px';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${size}px;height:${size}px;overflow:hidden;background:#0c0722}
    .stage{position:relative;width:${size}px;height:${size}px;overflow:hidden}
    .bg{${BG}}
    .rays{${rays}}
    .vig{position:absolute;inset:0;background:radial-gradient(75% 75% at 50% 46%, transparent 55%, rgba(6,3,18,.65) 100%)}
    .glow{position:absolute;left:50%;top:60%;width:${px(360)};height:${px(360)};transform:translate(-50%,-50%);
      background:radial-gradient(circle, rgba(255,170,60,.55), rgba(255,120,40,0) 65%);filter:blur(${px(6)})}
    .dragon{position:absolute;left:50%;bottom:${px(28)};transform:translateX(-50%);
      height:${px(376)};filter:drop-shadow(0 ${px(12)} ${px(18)} rgba(0,0,0,.55))}
    .gem{position:absolute;filter:drop-shadow(0 ${px(6)} ${px(8)} rgba(0,0,0,.5))}
    .g1{left:${px(28)};bottom:${px(30)};width:${px(150)};transform:rotate(-12deg)}
    .g2{right:${px(24)};bottom:${px(46)};width:${px(126)};transform:rotate(14deg)}
    .g3{right:${px(30)};top:${px(30)};width:${px(96)};transform:rotate(-8deg);opacity:.96}
    .spark{position:absolute;background:radial-gradient(circle,#fff, #ffe9b0 30%, transparent 70%);border-radius:50%;
      box-shadow:0 0 ${px(10)} ${px(3)} rgba(255,235,170,.7)}
    .ring{position:absolute;left:50%;top:50%;width:${px(470)};height:${px(470)};transform:translate(-50%,-50%);
      border-radius:50%;border:${px(2)} solid rgba(255,224,150,.12)}
  </style></head><body>
    <div class="stage">
      <div class="bg"></div>
      <div class="rays"></div>
      <div class="ring"></div>
      <div class="glow"></div>
      <img class="gem g3" src="${gems[3]}">
      <img class="dragon" src="${dragon}">
      <img class="gem g1" src="${gems[0]}">
      <img class="gem g2" src="${gems[2]}">
      ${sparkles([{x:22,y:22,s:size*0.03},{x:78,y:20,s:size*0.022},{x:15,y:55,s:size*0.018},{x:86,y:60,s:size*0.026},{x:50,y:12,s:size*0.02,o:.8}])}
      <div class="vig"></div>
    </div>
  </body></html>`;
}

// ---------- FEATURE GRAPHIC (1024 x 500) ----------
function featureHTML(title, sub) {
  const W = 1024, H = 500;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0c0722;
      font-family:'Arial Black','Arial',sans-serif}
    .stage{position:relative;width:${W}px;height:${H}px;overflow:hidden}
    .bg{${BG}}
    .rays{${rays}}
    .vig{position:absolute;inset:0;background:radial-gradient(80% 120% at 72% 55%, transparent 45%, rgba(6,3,18,.72) 100%)}
    .island{position:absolute;right:-40px;bottom:-70px;width:720px;height:360px;
      background:radial-gradient(60% 80% at 50% 25%, rgba(120,70,200,.35), transparent 70%)}
    .hero{position:absolute;right:70px;bottom:-24px;height:452px;
      filter:drop-shadow(0 16px 22px rgba(0,0,0,.55))}
    .heroGlow{position:absolute;right:120px;bottom:20px;width:440px;height:440px;
      background:radial-gradient(circle, rgba(255,170,60,.5), transparent 62%);filter:blur(8px)}
    .mini{position:absolute;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
    .m1{right:452px;top:188px;height:112px;transform:rotate(-8deg);opacity:.95}
    .m2{right:520px;bottom:20px;height:146px;transform:rotate(9deg);opacity:.95}
    .gem{position:absolute;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5))}
    .gA{left:70px;bottom:40px;width:104px;transform:rotate(-12deg)}
    .gB{left:250px;bottom:120px;width:78px;transform:rotate(10deg);opacity:.9}
    .gC{right:372px;top:22px;width:82px;transform:rotate(16deg);opacity:.92}
    .wrap{position:absolute;left:60px;top:0;height:100%;width:560px;display:flex;
      flex-direction:column;justify-content:center}
    .kick{font-size:24px;font-weight:700;letter-spacing:6px;color:#ffd77a;
      text-transform:uppercase;margin-bottom:14px;text-shadow:0 2px 6px rgba(0,0,0,.6)}
    .title{font-size:104px;line-height:.92;font-weight:900;letter-spacing:-1px;
      color:#ffd24d;
      background:linear-gradient(#fff2c0 4%, #ffcf3f 42%, #ff8a1e 78%, #ff6a12 100%);
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
      -webkit-text-stroke:3px #5a2a06;
      filter:drop-shadow(0 6px 0 rgba(90,30,6,.55)) drop-shadow(0 10px 16px rgba(0,0,0,.5));
      text-transform:uppercase}
    .sub{margin-top:20px;font-size:40px;font-weight:900;letter-spacing:1px;color:#fff;
      -webkit-text-stroke:2px #3a1a5a;
      text-shadow:0 3px 0 rgba(58,26,90,.7), 0 8px 14px rgba(0,0,0,.5);text-transform:uppercase}
    .tag{margin-top:26px;font-size:23px;font-weight:700;color:#e9dcff;letter-spacing:.5px;
      text-shadow:0 2px 6px rgba(0,0,0,.6)}
    .spark{position:absolute;background:radial-gradient(circle,#fff,#ffe9b0 30%,transparent 70%);border-radius:50%;
      box-shadow:0 0 12px 4px rgba(255,235,170,.7)}
  </style></head><body>
    <div class="stage">
      <div class="bg"></div>
      <div class="rays"></div>
      <div class="island"></div>
      <div class="heroGlow"></div>
      <img class="mini m1" src="${dragonFrost}">
      <img class="mini m2" src="${dragonVerdant}">
      <img class="hero" src="${dragon}">
      <img class="gem gA" src="${gems[0]}">
      <img class="gem gB" src="${gems[4]}">
      <img class="gem gC" src="${gems[2]}">
      <div class="wrap">
        <div class="kick">Match 3 · Merge · Hatch</div>
        <div class="title">${title}</div>
        <div class="sub">${sub}</div>
        <div class="tag">Blast crystals • Hatch dragons • Rule the isles</div>
      </div>
      ${sparkles([{x:12,y:20,s:16},{x:40,y:14,s:11},{x:62,y:26,s:14},{x:82,y:16,s:12},{x:55,y:70,s:13,o:.8}])}
      <div class="vig"></div>
    </div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  async function shot(html, w, h, file) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(120);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
    fs.writeFileSync(file, buf);
    await page.close();
    console.log('wrote', path.relative(ROOT, file), w + 'x' + h, (buf.length / 1024).toFixed(0) + 'KB');
  }

  // Master + downscaled icons (render each at native size for crispness)
  await shot(iconHTML(1024), 1024, 1024, path.join(OUT_RES, 'icon-1024.png'));
  await shot(iconHTML(512), 512, 512, path.join(OUT_RES, 'playstore-icon-512.png'));
  await shot(iconHTML(512), 512, 512, path.join(A, 'icon-512.png'));
  await shot(iconHTML(192), 192, 192, path.join(A, 'icon-192.png'));

  const TITLE = process.env.ART_TITLE || 'Dragon<br>Blast';
  const SUB = process.env.ART_SUB || 'Merge Isles';
  await shot(featureHTML(TITLE, SUB), 1024, 500, path.join(OUT_RES, 'feature-graphic-1024x500.png'));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
