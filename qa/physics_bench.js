// Dev-only physics scenario bench. Runs the game's Car class on synthetic
// tracks without rendering and prints measurable feel metrics.
// Usage: node qa/physics_bench.js [vehicleId]
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
  const vids = process.argv[2] ? [process.argv[2]] : ['jeep', 'pickup', 'monster', 'bike'];
  for (const vid of vids) {
    const out = await p.evaluate((vid) => {
      const vd = VEHICLES.find(v => v.id === vid), env = ENVS[0];
      const upg = { engine: 0, susp: 0, fuel: 0, tires: 0, fwd: 0, turbo: 0 };
      const B = 400; // ground baseline
      // Synthetic terrain with the same interface the Car uses
      const track = f => ({ getY: x => f(x), getNorm(x) { const m = (f(x + 3) - f(x - 3)) / 6, l = Math.hypot(1, m); return { nx: m / l, ny: -1 / l }; } });
      const spawn = (t, x = 100) => { const c = new Car(vd, upg, env, x, t.getY(x) - vd.wr * 2 - 12); for (let k = 0; k < 40; k++) c.step(t, false, false); c.fuel = 1e9; c.fuelMax = 1e9; return c; };
      const run = (c, t, frames, ctl) => { for (let i = 0; i < frames && !c.crashed; i++) { const k = ctl ? ctl(c, i) : { g: true, b: false }; c.step(t, k.g, k.b); } return c; };
      const deg = r => (r * 180 / Math.PI).toFixed(0);
      const R = {};

      // 1. Settle at rest
      let t = track(() => B), c = spawn(t);
      run(c, t, 120, () => ({ g: false, b: false }));
      R.settle = `ang=${c.bang.toFixed(3)} vy=${c.bvy.toFixed(3)}`;

      // 2. Acceleration on flat
      c = spawn(t); let t5 = -1, i = 0;
      for (; i < 600; i++) { c.step(t, true, false); if (t5 < 0 && c.bvx >= 5) t5 = i; }
      R.flat = `0→5px/f in ${(t5 / 60).toFixed(2)}s, top=${c.bvx.toFixed(1)}px/f, maxWheelie=${deg(0)}`;
      // wheelie tendency on flat start
      c = spawn(t); let minA = 0; for (i = 0; i < 180; i++) { c.step(t, true, false); minA = Math.min(minA, c.bang); }
      R.flat += ` startPitch=${deg(minA)}°`;

      // 3. Climbs: flat 300px then constant slope
      R.climb = [];
      for (const a of [15, 25, 32, 40]) {
        const m = Math.tan(a * Math.PI / 180);
        t = track(x => x < 400 ? B : B - (x - 400) * m);
        c = spawn(t); let minA2 = 0;
        for (i = 0; i < 900 && !c.crashed; i++) { c.step(t, true, false); minA2 = Math.min(minA2, c.bang); }
        const ok = !c.crashed && c.bx > 1400;
        R.climb.push(`${a}°:${ok ? 'OK' : c.crashed ? 'CRASH(' + c.rsn + ')' : 'STALL@' + (c.bx | 0)} pitch=${deg(minA2)}`);
      }
      R.climb = R.climb.join('  ');

      // 4. Ramp jump: flat, 22° kicker, then 160px drop to flat landing
      // Long run-up, 22° kicker, then a lower flat landing zone
      const kick = x => x < 1000 ? B : x < 1180 ? B - (x - 1000) * .4 : B + 40;
      t = track(kick);
      const jump = (ctl) => {
        c = spawn(t, 150); let air = 0, maxAir = 0, rot = 0, prevA = c.bang, landed = false, landW = 0, bounces = 0, wasAir = false;
        for (i = 0; i < 600 && !c.crashed; i++) {
          c.step(t, ...(ctl(c, i)));
          const inAir = !c.fG && !c.rG;
          rot += c.bang - prevA; prevA = c.bang;
          if (inAir) { air++; maxAir = Math.max(maxAir, air); } else { if (wasAir && air > 20) { landed = true; landW = c.bw; } if (wasAir && air > 3 && air <= 20 && landed) bounces++; air = 0; }
          wasAir = inAir;
        }
        return `air=${(maxAir / 60).toFixed(2)}s rot=${deg(rot)}° land=${landed ? 'yes' : 'no'} landSpin=${landW.toFixed(3)} rebounds=${bounces} ${c.crashed ? 'CRASH:' + c.rsn : 'alive'}`;
      };
      R.jumpNoInput = jump((c) => [c.bx < 1180, false]);
      R.jumpGasInAir = jump(() => [true, false]);
      R.jumpBrakeInAir = jump((c) => [c.bx < 1180, c.bx >= 1180]);

      // 5. Drop test: fall 300px onto flat, check for explosion
      t = track(() => B); c = new Car(vd, upg, env, 100, B - 320); c.fuel = 1e9;
      let maxV = 0, minY = 1e9, after = false;
      for (i = 0; i < 300; i++) { c.step(t, false, false); if (c.fG || c.rG) after = true; if (after) { maxV = Math.max(maxV, -c.bvy); minY = Math.min(minY, c.by); } }
      R.drop300 = `reboundUp=${maxV.toFixed(2)}px/f settled ang=${c.bang.toFixed(3)} finite=${[c.bx, c.by, c.bang].every(isFinite)} ${c.crashed ? 'CRASH:' + c.rsn : ''}`;

      // 6. Reverse
      t = track(() => B); c = spawn(t, 600); c.sx = -1e9;
      run(c, t, 240, () => ({ g: false, b: true }));
      R.reverse = `v=${c.bvx.toFixed(2)}px/f`;

      // 7. Bot driver on 10 random country tracks, 90 s each.
      // Policy: gas unless nose is too high; brake to tip nose down in the air.
      let deaths = 0, dist = 0, reasons = {};
      for (let s = 1; s <= 10; s++) {
        const tr = new Terrain(env, s * 7919); const sx = 180;
        c = new Car(vd, upg, env, sx, tr.getY(sx) - vd.wr - 12); c.fuel = 1e9; c.fuelMax = 1e9;
        for (i = 0; i < 90 * 60 && !c.crashed; i++) {
          const air = !c.fG && !c.rG, a = c.bang;
          let g = true, br = false;
          // controls: right (gas) turns clockwise in the air, left (brake) counter-clockwise
          if (air) { const sl = Math.atan2(tr.getY(c.bx + 60) - tr.getY(c.bx), 60), rel = a - sl;
            g = rel < -0.25; br = rel > 0.3; }
          else if (a < -0.55) { g = false; if (a < -0.9) br = true; }
          c.step(tr, g, br); tr.ensure(c.bx + 1200);
        }
        if (c.crashed) { deaths++; reasons[c.rsn] = (reasons[c.rsn] || 0) + 1; }
        dist += c.dist;
      }
      R.bot = `deaths=${deaths}/10 avgDist=${(dist / 10 | 0)}m ${JSON.stringify(reasons)}`;
      // 8. Air statistics on real terrain + a "stunt bot" that holds gas (backflip)
      //    or brake (frontflip) whenever it is airborne and lands when level.
      for (const mode of ['gas', 'brake']) {
        let air = 0, longest = 0, over05 = 0, over1 = 0, rot = 0, maxRot = 0, flips = 0, crashes = 0, frames = 0;
        for (let s = 1; s <= 10; s++) {
          const tr = new Terrain(env, s * 104729); c = new Car(vd, upg, env, 180, tr.getY(180) - vd.wr - 40); c.fuel = 1e9; c.fuelMax = 1e9;
          let prevA = c.bang;
          for (i = 0; i < 60 * 60 && !c.crashed; i++, frames++) {
            const inAir = !c.fG && !c.rG;
            let g = true, br = false;
            if (inAir && air > 6) {
              // keep rotating, but stop input when we're close to level again after >180°
              const done = Math.abs(rot) > Math.PI * 1.6 && Math.abs(Math.atan2(Math.sin(c.bang), Math.cos(c.bang))) < .5;
              if (mode === 'gas') { g = !done; br = false; } else { g = false; br = !done; }
            } else if (c.bang < -0.6) { g = false; }
            c.step(tr, g, br); tr.ensure(c.bx + 1200);
            const nowAir = !c.fG && !c.rG;
            if (nowAir) { air++; rot += c.bang - prevA; }
            else {
              if (air > 30) over05++; if (air > 60) over1++; longest = Math.max(longest, air);
              maxRot = Math.max(maxRot, Math.abs(rot)); if (Math.abs(rot) > Math.PI * 1.75 && !c.crashed) flips++;
              air = 0; rot = 0;
            }
            prevA = c.bang;
          }
          if (c.crashed) crashes++;
        }
        R['air_' + mode] = `per min: >0.5s=${(over05 / (frames / 3600)).toFixed(1)} >1s=${(over1 / (frames / 3600)).toFixed(1)} longest=${(longest / 60).toFixed(2)}s maxRot=${deg(maxRot)}° flips=${flips} crashes=${crashes}/10`;
      }
      return R;
    }, vid);
    console.log(`\n=== ${vid} ===`);
    for (const k in out) console.log(k.padEnd(15), out[k]);
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
