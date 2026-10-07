// Dev-only end-to-end regression: the full player journey plus edge cases and a
// throttled performance check. Usage: node qa/flow.js [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const GAME = 'file://' + path.resolve(__dirname, '..', 'hill_rush.html');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out-flow'));
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const res = []; const check = (n, ok, info = '') => res.push({ n, ok: !!ok, info });

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(() => { window.QA_SEED = 777; });
  const ev = (f, a) => p.evaluate(f, a);
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  const toGameOver = async () => { for (let i = 0; i < 30 && !(await ev(() => STATE === 'gameover')); i++) await wait(250); await wait(300); };

  // START (first launch, empty save) → MENU
  await p.goto(GAME); await wait(500);
  check('first launch: empty save defaults', await ev(() => sv.coins === 0 && sv.best === 0 && sv.selV === 'jeep'));
  if (await ev(() => document.getElementById('dailyOvl').classList.contains('on'))) await p.click('#btnDailyClaim');
  await wait(200); await shot('01-menu');

  // PLAY → DRIVE → COINS → FUEL
  await p.click('#btnPlay'); await wait(500);
  const gb = await p.locator('#cGas').boundingBox();
  await p.touchscreen.tap(gb.x + 50, gb.y + 50);
  await p.keyboard.down('ArrowRight');
  let jumpShot = false;
  for (let i = 0; i < 40; i++) {
    await wait(200);
    const s = await ev(() => ({ air: !car.fG && !car.rG && ST.air > 15, over: car.over }));
    if (s.air && !jumpShot) { await shot('02-jump'); jumpShot = true; }
    if (s.over) break;
    // driving aid so the smoke run is deterministic: ease off when the nose is high
    await ev(() => { if (car.bang < -.55) { setG(false); } else setG(true); });
  }
  await p.keyboard.up('ArrowRight'); await ev(() => setG(false));
  const drove = await ev(() => ({ d: car.dist, coins: sessionCoins }));
  check('drive: distance and pickups', drove.d > 50 && drove.coins > 0, JSON.stringify(drove));
  // fuel pickup refills the tank
  const fuelOk = await ev(() => { if (car.over) return 'skip'; car.fuel = car.fuelMax * .2; const f0 = car.fuel;
    terrain.objs.push({ t: 'fuel', x: car.bx, y: car.by, col: false }); return f0; });
  await wait(300);
  if (fuelOk !== 'skip') check('fuel pickup refills', await ev(f0 => car.fuel > f0 + 1, fuelOk));
  await ev(() => { if (!car.over) car.fuel = car.fuelMax * .1; }); await wait(300); await shot('03-low-fuel');

  // CRASH → GAME OVER
  await ev(() => { if (!car.over) { car.bang = Math.PI; car.by -= 40; } });
  await toGameOver(); await shot('04-gameover');
  check('crash → game over', await ev(() => STATE === 'gameover'));
  const banked = await ev(() => sv.coins);
  check('run coins banked', banked > 0, 'coins=' + banked);

  // RETRY
  await p.click('#btnRetry'); await wait(500);
  check('retry → fresh run', await ev(() => STATE === 'game' && car.dist < 5 && sessionCoins === 0));
  await ev(() => { car.fuel = 0; car.noFuelT = 470; }); await toGameOver();
  check('out of fuel ends second run', await ev(() => /FUEL/.test(document.getElementById('goRsn').textContent)));

  // GARAGE → UPGRADE (zero coins first, then funded)
  await p.click('#btnGoMenu'); await wait(300);
  await ev(() => { sv.coins = 0; saveSv(); });
  await p.click('#btnGarage'); await wait(300);
  await p.locator('.ucard').first().click(); await wait(150);
  check('zero coins: upgrade refused', await ev(() => sv.vs.jeep.engine === 0 && sv.coins === 0));
  await ev(() => { sv.coins = 200000; saveSv(); refreshGarage(); });
  await p.locator('.ucard').first().click(); await wait(150);
  check('upgrade bought', await ev(() => sv.vs.jeep.engine === 1 && sv.coins === 200000 - 600));
  // max level
  for (let i = 0; i < 6; i++) { await p.locator('.ucard').first().click(); await wait(60); }
  check('max upgrade capped at 6', await ev(() => sv.vs.jeep.engine === 6));
  await shot('05-upgrade-max');
  // VEHICLE PURCHASE
  await p.locator('.vcard').nth(1).click(); await wait(150); await p.click('#btnBuyV'); await wait(200);
  check('vehicle purchase', await ev(() => !sv.vs.pickup.locked && sv.selV === 'pickup'));
  await shot('06-garage-pickup');
  await p.click('#btnGBack'); await wait(200);

  // MAP UNLOCK (locked refused when poor, bought when funded)
  await ev(() => { sv.coins = 100; saveSv(); }); await p.click('#btnMapSel'); await wait(250);
  await p.locator('.lcard').nth(1).click(); await wait(150);
  check('locked map refused without coins', await ev(() => !sv.envs.mountain));
  await ev(() => { sv.coins = 20000; saveSv(); initMapSel(); }); await p.locator('.lcard').nth(1).click(); await wait(200);
  check('map bought and selected (+Explorer achievement)', await ev(() => sv.envs.mountain && sv.selE === 'mountain' && sv.coins === 8000 + ACH.find(a => a.id === 'map').r));
  await shot('07-map');
  await p.click('#btnMapBack'); await wait(200);

  // MUTE
  await p.click('#btnSettings'); await wait(200); await p.click('#tglSound'); await wait(100);
  check('sound off persists', await ev(() => sv.settings.sound === false && (!MASTER || MASTER.gain.value === 0)));
  await shot('08-settings');
  await p.click('#btnSetBack'); await wait(150);

  // SAVE → RELOAD → CONTINUE (returning player)
  const before = await ev(() => JSON.stringify({ c: sv.coins, v: sv.selV, e: sv.selE, eng: sv.vs.jeep.engine, p: sv.vs.pickup.locked, s: sv.settings.sound }));
  await p.reload(); await wait(500);
  const after = await ev(() => JSON.stringify({ c: sv.coins, v: sv.selV, e: sv.selE, eng: sv.vs.jeep.engine, p: sv.vs.pickup.locked, s: sv.settings.sound }));
  check('returning player: everything restored', before === after, before + ' vs ' + after);
  await p.click('#btnPlay'); await wait(600);
  check('continue on new map with new car', await ev(() => STATE === 'game' && car.env.id === 'mountain' && car.vd.id === 'pickup'));
  await shot('09-mountain-pickup');
  await p.click('#pauseBtn'); await wait(150); await p.click('#btnPMenu'); await wait(200);
  await p.click('#btnMissions'); await wait(250); await shot('10-missions');
  await p.close();

  // PERFORMANCE: 4x CPU throttle ≈ low-end phone
  const pp = await ctx.newPage(); pp.on('pageerror', e => errors.push(e.message));
  await pp.goto(GAME); await wait(400);
  await pp.evaluate(() => { document.getElementById('dailyOvl').classList.remove('on'); sv.settings.sound = true; });
  const cdp = await ctx.newCDPSession(pp); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await pp.click('#btnPlay'); await wait(400); await pp.keyboard.down('ArrowRight');
  const res0 = await pp.evaluate(() => RES);
  await wait(9000);   // let the resolution governor settle
  res.push({ n: `render resolution: start ${res0}x → settled ${await pp.evaluate(() => RES)}x under throttle`, ok: true });
  const perf = await pp.evaluate(() => new Promise(r => { const ts = []; let n = 0; const f = t => { ts.push(t); if (car.bang < -.55) setG(false); else setG(true); if (++n < 300) requestAnimationFrame(f); else r(ts); }; requestAnimationFrame(f); }));
  const dts = perf.slice(1).map((t, i) => t - perf[i]).sort((a, b) => a - b);
  const fps = 1000 / (dts.reduce((a, x) => a + x, 0) / dts.length), p95 = dts[Math.floor(dts.length * .95)];
  const heap = await pp.evaluate(() => performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) : 'n/a');
  check('perf @4x CPU throttle (software raster, after governor): avg fps ≥ 30', fps >= 30, `avg ${fps.toFixed(1)} fps, p95 frame ${p95.toFixed(1)} ms, heap ${heap} MB`);
  res.push({ n: `perf detail: avg ${fps.toFixed(1)} fps, p95 frame ${p95.toFixed(1)} ms, JS heap ${heap} MB`, ok: true });

  check('no console errors / exceptions', errors.length === 0, errors.slice(0, 5).join(' | '));
  await b.close();
  let fails = 0; for (const r of res) { if (!r.ok) fails++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n}${r.info && !r.ok ? '  — ' + r.info : ''}`); }
  console.log(`\n${res.length - fails}/${res.length} passed. Screenshots: ${OUT}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
