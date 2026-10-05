// Move-budget calibration. A "novice" bot (no swap, no planning, ±3° aim
// error) plays each level RUNS times without a move limit. The budget is the
// smallest move count at which the novice reaches the target win rate:
//   L1-10: 90%   L11-30: 70%   L31-60: 55%   L61+: 45%   (hard levels −10%)
// Real players also swap bubbles and plan, so they do better than the bot.
//   node tools/calibrate.js [from] [to] [runs]   → prints MOVES={...}
const { U, Core, Levels, DATA } = require('./load')();
const CAP = 140;
function play(L, seed) {
  const b = new Core.Board(L, seed), rng = U.rng(seed);
  const forced = (L.ammo || []).slice();
  let cur = forced.length ? forced.shift() : b.nextColor();
  for (let m = 1; m <= CAP; m++) {
    const sy = Math.max(0, Core.cy(Math.max(b.lowestRow(), 0)) + 1 - 26) + 32;
    let best = null;
    for (let a = 10; a <= 170; a += 3) {
      const r = a * Math.PI / 180, tr = b.trace(11, sy, Math.cos(r), -Math.sin(r));
      if (tr.land < 0) continue;
      const c = b.clone(), p0 = c.progress().cur, res = c.shoot({ t: 'color', c: cur }, tr);
      const s = (c.progress().done ? 1e4 : 0) + (c.progress().cur - p0) * 3 + res.removed + rng() * 0.5;
      if (!best || s > best.s) best = { s, a };
    }
    if (!best) return Infinity;
    const na = best.a + (rng() - 0.5) * 6;
    const tr = b.trace(11, sy, Math.cos(na * Math.PI / 180), -Math.sin(na * Math.PI / 180));
    if (tr.land >= 0) b.shoot({ t: 'color', c: cur }, tr);
    if (b.progress().done) return m;
    cur = forced.length ? forced.shift() : b.nextColor();
  }
  return Infinity;
}
function target(id) {
  let t = id <= 10 ? 0.9 : id <= 30 ? 0.7 : id <= 60 ? 0.55 : 0.45;
  if (Levels.isHard(id)) t -= 0.1;
  return t;
}
const from = +process.argv[2] || 1, to = +process.argv[3] || DATA.MAX_LEVEL, RUNS = +process.argv[4] || 20;
const out = {};
for (let id = from; id <= to; id++) {
  const L = Levels.get(id);
  if (Levels.HAND[id] && Levels.HAND[id].moves) continue;
  const used = [];
  for (let r = 0; r < RUNS; r++) used.push(play(Levels.get(id), 900 + r * 37 + id));
  used.sort((a, b) => a - b);
  const q = used[Math.min(used.length - 1, Math.ceil(target(id) * used.length) - 1)];
  out[id] = Math.max(10, Math.min(Number.isFinite(q) ? q + 1 : CAP, 90));
  console.log(`L${id} ${L.objective.type.padEnd(11)} target ${Math.round(target(id) * 100)}% -> ${out[id]}  (novice median ${used[used.length >> 1]})`);
}
console.log('\nMOVES=' + JSON.stringify(out));
