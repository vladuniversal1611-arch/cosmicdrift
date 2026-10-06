// Dev-only economy model. Step 1 measures real runs (bot drivers on the
// game's own physics, terrain, pickups and stunt scoring). Step 2 simulates
// a player's progression over the first hours from those measurements.
// Usage: node qa/economy_sim.js
const { chromium } = require('playwright');
const path = require('path');
const GAME = 'file://' + path.resolve(__dirname, '..', 'hill_rush.html');
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(GAME);
  await new Promise(r => setTimeout(r, 300));
  // ── Step 1: measure
  const data = await p.evaluate(() => {
    const out = {};
    const runOnce = (vd, L, env, seed, skill) => {
      const upg = { engine: L, susp: L, fuel: L, tires: L, fwd: L, turbo: L };
      terrain = new Terrain(env, seed);
      car = new Car(vd, upg, env, 180, terrain.getY(180) - vd.wr * 2 - 40);
      runBonus = []; sessionCoins = 0; stuntReset();
      const r = mbrng(seed * 7 + 1);
      let f = 0, mistake = 0;
      for (; f < 60 * 600 && !car.crashed; f++) {
        const air = !car.fG && !car.rG, a = car.bang;
        let g = true, br = false;
        // careful driving with occasional mistakes (holding gas too long)
        if (mistake > 0) mistake--; else if (r() < skill.err) mistake = skill.len;
        if (!mistake) {
          if (a < -skill.nose) { g = false; if (air || a < -0.9) br = true; }
          if (air && a > 0.35) { g = true; br = false; }
          // skilled players lean into jumps for flips
          const hgt = terrain.getY(car.bx) - car.by;
          if (air && skill.flip && ST.air > 8 && hgt > 150 && Math.abs(ST.rot) < Math.PI * 1.7) { g = true; br = false; }
          if (air && skill.flip && Math.abs(ST.rot) >= Math.PI * 1.7) { g = false; br = a < -.3; }
        }
        car.step(terrain, g && car.fuel > 0, br); terrain.ensure(car.bx + 1500);
        stuntTick();
        // pickups (same radii as the game)
        const pts = [{ x: car.fx, y: car.fy }, { x: car.rx, y: car.ry }, { x: car.vx(), y: car.vy() }];
        for (const o of terrain.objs) {
          if (o.col || Math.abs(o.x - car.bx) > 120) continue;
          for (const q of pts) {
            const rad = o.t === 'coin' ? 10 + car.wr * .4 : 12 + car.wr * .55;
            if ((q.x - o.x) ** 2 + (q.y - o.y) ** 2 < rad * rad) {
              o.col = true;
              if (o.t === 'coin') sessionCoins += o.v || 1; else { car.fuel = Math.min(car.fuelMax, car.fuel + car.fuelMax * .5); car.noFuel = false; }
              break;
            }
          }
        }
        if (car.noFuel) { car.noFuelT = (car.noFuelT || 0) + 1; car.stallT = Math.hypot(car.bvx, car.bvy) < .5 ? (car.stallT || 0) + 1 : 0; if (car.stallT > 70 || car.noFuelT > 480) { car.crashed = true; car.rsn = 'OUT OF FUEL!'; } }
        if (f % 120 === 0) terrain.prune(car.bx - 900);
      }
      return { d: car.dist, t: f / 60, c: sessionCoins, s: runBonus.reduce((a, x) => a + x.coins, 0), why: car.rsn };
    };
    // novice: reacts late and slips up every ~12 s; average: reacts earlier, rarer slips, tries flips on big jumps
    const SK = { novice: { nose: .72, err: .0014, len: 30, flip: false }, average: { nose: .58, err: .0006, len: 22, flip: true } };
    for (const vd of VEHICLES) for (const L of [0, 2, 4, 6]) for (const sk in SK) {
      const rs = []; for (let s = 1; s <= 8; s++) rs.push(runOnce(vd, L, ENVS[0], s * 3571 + L, SK[sk]));
      const avg = k => rs.reduce((a, x) => a + x[k], 0) / rs.length;
      const why = {}; rs.forEach(x => why[x.why] = (why[x.why] || 0) + 1);
      out[`${vd.id}|${L}|${sk}`] = { d: avg('d'), t: avg('t'), c: avg('c'), s: avg('s'), why };
    }
    return { out, UP: UPGRADES, VE: VEHICLES.map(v => ({ id: v.id, price: v.price })), ENV: ENVS.map(e => ({ id: e.id, m: e.unlockM })), DAILY: DAILY_RW, MISS: Object.values(MPOOL).map(m => m.rw) };
  });
  await b.close();
  if (errs.length) console.log('ERRORS', errs);

  console.log('── Measured runs (Countryside, 8 seeds each) ──');
  console.log('vehicle  lvl skill      dist(m)  time(s)  pickups  stunts  coins/min  end reasons');
  for (const k in data.out) {
    const [v, L, sk] = k.split('|'), r = data.out[k];
    console.log(`${v.padEnd(8)} ${L.padEnd(3)} ${sk.padEnd(9)} ${r.d.toFixed(0).padStart(7)} ${r.t.toFixed(0).padStart(8)} ${r.c.toFixed(0).padStart(8)} ${r.s.toFixed(0).padStart(7)} ${((r.c + r.s) / r.t * 60).toFixed(0).padStart(10)}  ${JSON.stringify(r.why)}`);
  }

  // ── Step 2: progression
  const cost = (u, l) => Math.round(u.base * Math.pow(u.mult, l));
  const look = (v, lvl, sk) => {
    const lo = Math.floor(lvl / 2) * 2, hi = Math.min(6, lo + 2), t = (lvl - lo) / 2;
    const A = data.out[`${v}|${lo}|${sk}`], B = data.out[`${v}|${hi}|${sk}`];
    const m = k => A[k] + (B[k] - A[k]) * t;
    return { d: m('d'), t: m('t'), c: m('c') + m('s') };
  };
  const avgMission = data.MISS.flat().reduce((a, x) => a + x, 0) / data.MISS.flat().length;
  for (const sk of ['novice', 'average']) {
    const st = { coins: 0, best: 0, own: { jeep: 1 }, lv: {}, sel: 'jeep' };
    data.VE.forEach(v => st.lv[v.id] = Object.fromEntries(data.UP.map(u => [u.id, 0])));
    let time = 0, runs = 0, day = -1; const ev = []; const mark = (what) => ev.push([time / 60, what]);
    const snap = {};
    const order = ['pickup', 'bike', 'monster'];
    while (time < 5 * 3600) {
      // one in-game "day" per 40 minutes of play: login reward + ~2.5 missions
      const d = Math.floor(time / 2400);
      if (d !== day) { day = d; st.coins += data.DAILY[Math.min(6, d)] + avgMission * 2.5; }
      const lvAvg = Object.values(st.lv[st.sel]).reduce((a, x) => a + x, 0) / data.UP.length;
      const r = look(st.sel, lvAvg, sk);
      st.coins += r.c; time += r.t + 12; runs++;
      if (r.d > st.best) { st.best = r.d; for (const e of data.ENV) if (e.m > 0 && st.best >= e.m && !st['env_' + e.id]) { st['env_' + e.id] = 1; mark('map ' + e.id); } }
      // spend: next vehicle once the current one is decently upgraded, else cheapest useful upgrade
      let spent = true;
      while (spent) {
        spent = false;
        const nextV = order.find(v => !st.own[v]), nv = nextV && data.VE.find(v => v.id === nextV);
        const cur = st.lv[st.sel];
        if (nv && (lvAvg >= 2.5 || st.coins >= nv.price * 1.0) && st.coins >= nv.price) {
          st.coins -= nv.price; st.own[nextV] = 1; mark('buy ' + nextV);
          if (nextV !== 'bike') st.sel = nextV; spent = true; continue;
        }
        const opts = data.UP.filter(u => cur[u.id] < u.max).map(u => ({ u, c: cost(u, cur[u.id]) })).sort((a, b) => a.c - b.c);
        const saving = nv && lvAvg >= 2.5;
        if (opts.length && st.coins >= opts[0].c && !(saving && st.coins - opts[0].c < nv.price * .6 && opts[0].c > 400)) {
          cur[opts[0].u.id]++; st.coins -= opts[0].c; spent = true;
          if (runs <= 30 && !ev.some(e => e[1] === 'first upgrade')) mark('first upgrade');
          if (Object.values(cur).every((x, i) => x >= data.UP[i].max)) mark('maxed ' + st.sel);
        }
      }
      for (const T of [1800, 7200, 18000]) if (!snap[T] && time >= T) snap[T] = `best ${st.best.toFixed(0)}m, ${runs} runs, owned ${Object.keys(st.own).join('/')}, ${st.sel} avg lvl ${(Object.values(st.lv[st.sel]).reduce((a, x) => a + x, 0) / 6).toFixed(1)}, bank ${st.coins.toFixed(0)}`;
    }
    console.log(`\n── Progression: ${sk} player ──`);
    for (const [t, w] of ev) console.log(`  ${t.toFixed(1).padStart(6)} min  ${w}`);
    for (const T in snap) console.log(`  @${T / 3600}h: ${snap[T]}`);
  }
})();
