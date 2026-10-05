// End-to-end test in real Chromium: first launch → intro → level 1 (played
// by a bot through real pointer events) → win sequence → home → restoration →
// reload persistence → map → all screens. Saves screenshots to ./shots.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.5, hasTouch: true, isMobile: true, locale: process.env.LANG_TEST || 'en-US' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); console.log('shot', n); };
  const click = async (sel) => { await page.waitForSelector(sel, { state: 'visible', timeout: 8000 }); await page.click(sel, { force: true }); await sleep(350); };
  const tapAt = async (x, y) => { await page.mouse.click(x, y); await sleep(250); };
  const clearStory = async () => { for (let i = 0; i < 12; i++) { if (!(await page.$('#story'))) return; await page.click('#story'); await sleep(250); } };

  // Bot: picks the best angle with the real engine, then fires via pointer events.
  async function playShot() {
    const plan = await page.evaluate(() => {
      const g = Game.geom, b = Game.board, a0 = Game.level && b ? b : null;
      if (!a0) return null;
      let best = null;
      for (let a = 10; a <= 170; a += 2) {
        const rad = a * Math.PI / 180;
        const tr = b.trace(g.su.x, g.su.y, Math.cos(rad), -Math.sin(rad));
        if (tr.land < 0) continue;
        const c = b.clone();
        const before = c.progress().cur;
        const res = c.shoot({ t: 'color', c: b.nextColor() }, tr);
        const s = (c.progress().done ? 1000 : 0) + (c.progress().cur - before) * 3 + res.removed + Math.random() * 0.1;
        if (!best || s > best.s) best = { s, rad };
      }
      if (!best) return null;
      return { x: g.shooterX + Math.cos(best.rad) * 200, y: g.shooterY - Math.sin(best.rad) * 200, sx: g.shooterX, sy: g.shooterY };
    });
    if (!plan) return false;
    await page.mouse.move(plan.sx, plan.sy - 120); await page.mouse.down(); await page.mouse.move(plan.x, plan.y, { steps: 4 }); await sleep(60); await page.mouse.up();
    for (let i = 0; i < 40; i++) { await sleep(120); const st = await page.evaluate(() => ({ busy: Game.busy, over: Game.over })); if (!st.busy || st.over) break; }
    return true;
  }
  async function playLevel(maxShots) {
    for (let i = 0; i < maxShots; i++) {
      const st = await page.evaluate(() => ({ over: Game.over, active: Game.active, modals: UI.stackSize }));
      if (st.over || !st.active || st.modals) break;
      await playShot();
    }
    for (let i = 0; i < 40; i++) { if (await page.$('.modal')) break; await page.mouse.click(206, 400); await sleep(250); }
  }

  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(900);
  await shot('01_splash');
  await tapAt(206, 600);
  await sleep(600);
  await shot('02_intro');
  for (let i = 0; i < 4; i++) await tapAt(206, 400);
  await sleep(700);
  await shot('03_level1_start');
  await click('.modal .btn-green.btn-lg');
  await sleep(900);
  await shot('04_game_level1');
  await page.mouse.move(206, 400); await page.mouse.down(); await page.mouse.move(150, 300, { steps: 5 });
  await sleep(300); await shot('05_aiming'); await page.mouse.up(); await sleep(1500);
  await playLevel(14);
  await sleep(1800);
  await shot('06_win');
  await click('.modal .btn-green.btn-lg');
  await sleep(1500);
  await clearStory();
  await sleep(600);
  await shot('07_home_after_l1');
  // Levels 2-5 via the PLAY button (covers rescue, restoration unlock, hammer, stars).
  for (let lv = 2; lv <= 5; lv++) {
    await clearStory();
    while (await page.$('.modal')) { const b = await page.$('.modal .btn-green, .modal .btn-orange'); if (!b) break; await b.click(); await sleep(500); await clearStory(); }
    await click('#btnPlay');
    await sleep(400);
    if (lv === 4) await shot('08_level4_start');
    await click('.modal .btn-green.btn-lg');
    await sleep(900);
    if (lv === 2) await shot('09_game_level2_rescue');
    await playLevel(30);
    await sleep(1500);
    const won = await page.$('.stars-big');
    console.log('level', lv, won ? 'WON' : 'not won');
    if (!won) { const g = await page.$('.modal .btn-sm.btn-red'); if (g) { await g.click(); await sleep(500); } const h = await page.$('.modal .btn-blue'); if (h) { await h.click(); await sleep(500); } continue; }
    await click('.modal .btn-green.btn-lg');
    await sleep(1500);
    await clearStory();
    for (let k = 0; k < 6; k++) { const b = await page.$('.modal .btn-green, .modal .btn-orange'); if (!b) break; await b.click(); await sleep(600); await clearStory(); }
  }
  await sleep(800);
  await shot('10_home_lv5');
  // Restoration: tap the cottage.
  const cot = await page.evaluate(() => { const o = DATA.AREAS[0].objects[0]; return { x: o.x * innerWidth, y: innerHeight * (0.5 + (o.y - 0.5) * 1.05) - 50 }; });
  await tapAt(cot.x, cot.y);
  await sleep(600);
  await shot('11_restore_panel');
  const build = await page.$('.modal .btn-green.btn-lg');
  if (build) { await build.click(); await sleep(1100); await shot('12_building'); await sleep(1800); await clearStory(); }
  await sleep(600);
  await shot('13_home_restored');
  // Persistence across reload.
  const before = await page.evaluate(() => JSON.stringify({ l: State.s.level, c: State.s.coins, b: State.s.best, r: State.s.restore }));
  await page.reload(); await sleep(900); await tapAt(206, 600); await sleep(1200);
  const after = await page.evaluate(() => JSON.stringify({ l: State.s.level, c: State.s.coins, b: State.s.best, r: State.s.restore }));
  console.log('persisted:', before === after ? 'YES' : 'NO\n' + before + '\n' + after);
  for (let k = 0; k < 4; k++) { const b = await page.$('.modal .btn-green'); if (!b) break; await b.click(); await sleep(700); }
  await page.evaluate(() => { for (const id of ['#modals']) document.querySelector(id).innerHTML = ''; });
  // Map
  await page.evaluate(() => Screens.show('map')); await sleep(900); await shot('14_map');
  await page.evaluate(() => { document.getElementById('map').scrollTop = 0; }); await sleep(700); await shot('15_map_top_locked');
  await page.evaluate(() => Screens.show('home')); await sleep(500);
  // Modals
  for (const [name, fn] of [['16_daily', 'UI.daily()'], ['17_quests', 'UI.quests("daily")'], ['18_weekly', 'UI.quests("weekly")'], ['19_collection', 'UI.collection()'], ['20_shop', 'UI.shop()'], ['21_settings', 'UI.settings()'], ['22_lives', 'UI.lives()']]) {
    await page.evaluate(fn); await sleep(700); await shot(name);
    await page.evaluate(() => { document.querySelectorAll('#modals > div').forEach((d) => d.remove()); });
  }
  // A boss level and a late mechanic-heavy level, entered directly for visuals.
  await page.evaluate(() => { State.s.level = 160; for (let i = 1; i < 160; i++) State.s.best[i] = 3; for (const a of DATA.AREAS) for (const o of a.objects) State.s.restore[o.id] = 3; State.persist(true); });
  await page.evaluate(() => UI.startLevel(20, [], [])); await sleep(1200); await clearStory(); await sleep(400); await shot('23_boss20');
  await playShot(); await playShot(); await playShot(); await sleep(800); await shot('24_boss_fight');
  await page.evaluate(() => { Game.giveUp(); Screens.show('home'); });
  await page.evaluate(() => UI.startLevel(87, ['fireball'], [])); await sleep(1200); await shot('25_level87');
  await page.evaluate(() => { Game.giveUp(); State.s.settings.lang = 'uk'; I18N.lang = 'uk'; UI.rebuild(); Screens.show('home'); }); await sleep(800); await shot('26_home_uk');
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
