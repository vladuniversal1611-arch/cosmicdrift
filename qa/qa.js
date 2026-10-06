// Dev-only QA harness for hill_rush.html (not shipped with the game).
// Usage: node qa/qa.js [outDir]    (needs the `playwright` package + Chromium)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GAME = 'file://' + path.resolve(__dirname, '..', 'hill_rush.html');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function newPage(browser, errors, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 412, height: 915 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  if (opts.init) await p.addInitScript(opts.init);
  await p.goto(GAME);
  await wait(500);
  return p;
}
const shot = (p, name) => p.screenshot({ path: path.join(OUT, name + '.png') });
const ev = (p, fn, arg) => p.evaluate(fn, arg);

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const errors = [];

  // ── 1. Boot + menus
  let p = await newPage(browser, errors);
  check('boot: menu visible', await ev(p, () => document.getElementById('menuOvl').classList.contains('on')));
  await shot(p, '01-menu');
  await p.click('#btnGarage'); await wait(300); await shot(p, '02-garage');
  check('garage opens', await ev(p, () => document.getElementById('garageOvl').classList.contains('on')));
  await p.click('#btnGBack'); await wait(200);
  await p.click('#btnMapSel'); await wait(300); await shot(p, '03-map');
  check('map select opens', await ev(p, () => document.getElementById('mapOvl').classList.contains('on')));
  await p.click('#btnMapBack'); await wait(200);
  if (await p.locator('#btnSettings').count()) {
    await p.click('#btnSettings'); await wait(250); await shot(p, '04-settings');
    check('settings opens', await ev(p, () => document.getElementById('setOvl').classList.contains('on')));
    await p.click('#btnSetBack'); await wait(200);
  }
  // Daily reward popup (if any) may be on top; close it
  if (await p.locator('#dailyOvl.on').count()) { await shot(p, '05-daily'); await p.click('#btnDailyClaim'); await wait(200); }

  // ── 2. Gameplay smoke test
  await p.click('#btnPlay'); await wait(1200);
  check('game started', await ev(p, () => STATE === 'game' && !!car));
  const idle = await ev(p, () => ({ ang: car.bang, vy: car.bvy }));
  check('idle car at rest', Math.abs(idle.ang) < .05 && Math.abs(idle.vy) < .05, JSON.stringify(idle));
  await shot(p, '06-game-start');
  // Touch the gas button (real touch events)
  const gb = await p.locator('#cGas').boundingBox();
  await p.touchscreen.tap(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await p.keyboard.down('ArrowRight');
  let maxAir = 0, sampled = 0;
  for (let i = 0; i < 16; i++) {
    await wait(400); sampled++;
    const s = await ev(p, () => ({ air: !car.fG && !car.rG, d: car.dist, dead: car.dead, nan: [car.bx, car.by, car.bang].some(v => !isFinite(v)) }));
    if (s.nan) { check('no NaN in physics', false); break; }
    if (s.air) maxAir++;
    if (i === 6) await shot(p, '07-game-drive');
    if (s.dead) break;
  }
  const st = await ev(p, () => ({ d: car.dist, dead: car.dead, fin: [car.bx, car.by, car.bang].every(isFinite) }));
  check('car moved forward', st.d > 40, 'dist=' + st.d.toFixed(0));
  check('physics finite', st.fin);
  await p.keyboard.up('ArrowRight');

  // Pause / resume
  if (!st.dead) {
    await p.click('#pauseBtn'); await wait(200);
    check('pause shows overlay', await ev(p, () => paused && document.getElementById('pauseOvl').classList.contains('on')));
    await shot(p, '08-pause');
    const x0 = await ev(p, () => car.bx); await wait(400);
    check('paused = frozen', Math.abs((await ev(p, () => car.bx)) - x0) < .01);
    await p.click('#btnResume'); await wait(300);
    check('resume', await ev(p, () => !paused && STATE === 'game'));
  }
  // Background → foreground (visibility change)
  await ev(p, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange')); });
  await wait(200);
  check('hidden → auto pause', await ev(p, () => paused === true || STATE !== 'game'));
  await ev(p, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange')); });
  await wait(200);
  if (await ev(p, () => paused)) { await p.click('#btnResume'); await wait(200); }

  // Low fuel → out of fuel
  await ev(p, () => { car.fuel = car.fuelMax * .12; });
  await wait(300); await shot(p, '09-low-fuel');
  await ev(p, () => { car.fuel = 0; car.noFuelT = 470; });
  for (let i = 0; i < 20 && !(await ev(p, () => STATE === 'gameover')); i++) await wait(250);
  check('out of fuel → game over', await ev(p, () => STATE === 'gameover'));
  check('game over reason = fuel', (await ev(p, () => document.getElementById('goRsn').textContent)).includes('FUEL'));
  await wait(400); await shot(p, '10-gameover');
  const coinsAfter = await ev(p, () => sv.coins);
  await wait(1500);
  check('no duplicate reward after game over', (await ev(p, () => sv.coins)) === coinsAfter);
  await p.click('#btnRetry'); await wait(800);
  check('retry starts new run', await ev(p, () => STATE === 'game' && car.dist < 5));

  // Head crash detection (force the car upside down onto the ground)
  await ev(p, () => { car.bang = Math.PI; car.by -= 30; });
  for (let i = 0; i < 20 && !(await ev(p, () => STATE === 'gameover')); i++) await wait(250);
  const rsn = await ev(p, () => document.getElementById('goRsn').textContent);
  check('upside-down → DRIVER DOWN/FLIPPED', /DRIVER|FLIP/.test(rsn), rsn);

  // ── 3. Save / load persistence
  await ev(p, () => { sv.coins = 4321; saveSv(); });
  await p.reload(); await wait(500);
  check('save persists across reload', (await ev(p, () => sv.coins)) === 4321);
  await p.close();

  // ── 4. Old (v3, pre-migration) save migrates
  const oldSave = JSON.stringify({ coins: 777, best: 420, selV: 'pickup', selE: 'mountain',
    vs: { jeep: { locked: false, engine: 2, susp: 1 }, pickup: { locked: false, engine: 1 } }, envs: { country: true, mountain: true } });
  p = await newPage(browser, errors, { init: `if(!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('hillrush3', ${JSON.stringify(oldSave)});sessionStorage.setItem('seeded','1');}` });
  const mig = await ev(p, () => ({ coins: sv.coins, best: sv.best, v: sv.selV, e: sv.selE, eng: sv.vs.jeep.engine, pick: sv.vs.pickup.locked, ver: sv.ver }));
  check('old save: coins/best kept', mig.coins === 777 && mig.best === 420, JSON.stringify(mig));
  check('old save: vehicle/map/upgrades kept', mig.v === 'pickup' && mig.e === 'mountain' && mig.eng === 2 && mig.pick === false);
  await p.reload(); await wait(400);
  check('migrated save survives reload', (await ev(p, () => sv.coins)) === 777);
  await p.close();

  // ── 5. Corrupted save does not crash and does not get wiped silently
  p = await newPage(browser, errors, { init: `if(!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('hillrush3','{not json');sessionStorage.setItem('seeded','1');}` });
  check('corrupted save: menu still loads', await ev(p, () => document.getElementById('menuOvl').classList.contains('on')));
  await p.close();

  // ── 6. Viewports
  for (const vp of [{ width: 360, height: 640 }, { width: 412, height: 915 }, { width: 800, height: 600 }]) {
    p = await newPage(browser, errors, { viewport: vp });
    const r = await ev(p, () => { const b = document.getElementById('wrap').getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: innerWidth, h: innerHeight }; });
    check(`viewport ${vp.width}x${vp.height}: game fits`, r.l >= -1 && r.t >= -1 && r.r <= r.w + 1 && r.b <= r.h + 1, JSON.stringify(r));
    await p.click('#btnPlay'); await wait(500);
    const cb = await p.locator('#controls').boundingBox();
    check(`viewport ${vp.width}x${vp.height}: controls on screen`, cb && cb.y + cb.height <= vp.height + 1 && cb.height > 40);
    await shot(p, `11-vp-${vp.width}x${vp.height}`);
    await p.close();
  }

  // ── Report
  check('no console errors / exceptions', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  let fails = 0;
  for (const r of results) { if (!r.ok) fails++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.info && !r.ok ? '  — ' + r.info : ''}`); }
  console.log(`\n${results.length - fails}/${results.length} passed. Screenshots: ${OUT}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
