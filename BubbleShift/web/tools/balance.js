// Balancing bot: plays every level with the real engine (greedy 1-ply search
// with human-like aim noise) and measures how many shots it needs.
// Prints a MOVES table to paste into src/js/04_levels.js.
//   node tools/balance.js [from] [to] [runs]
const { U, DATA, Core, Levels } = require('./load')();
const VIEW_H = 24, SHOOTER_GAP = 8;
function shooterY(b) {
  const low = b.lowestRow();
  return Math.max(0, Core.cy(Math.max(low, 0)) + 1 - (VIEW_H - 4)) + VIEW_H + SHOOTER_GAP;
}
function objScore(b) { const p = b.progress(); return p.done ? 1e6 : (p.cur / Math.max(1, p.target)) * 100; }
function play(level, seed, cap) {
  const b = new Core.Board(level, seed);
  const rng = U.rng(seed * 13 + 5);
  let cur = b.nextColor(), nxt = b.nextColor();
  for (let m = 1; m <= cap; m++) {
    const sy = shooterY(b);
    let best = null;
    for (const [ammo, swap] of [[cur, false], [nxt, true]]) {
      for (let a = 8; a <= 172; a += 2.2) {
        const rad = a * Math.PI / 180;
        const tr = b.trace(11, sy, Math.cos(rad), -Math.sin(rad));
        if (tr.land < 0) continue;
        const c = b.clone();
        const before = objScore(c);
        const res = c.shoot({ t: 'color', c: ammo }, tr);
        let s = objScore(c) - before + res.removed * 1.2;
        if (!res.removed) {
          let same = 0; for (const n of Core.NB[tr.land]) { const x = c.cells[n]; if (x && x.t === 'n' && x.c === ammo) same++; }
          s += same * 0.8 - 0.5 - Core.kr(tr.land) * 0.05;
        }
        s += rng() * 0.05;
        if (!best || s > best.s) best = { s, tr, ammo, swap, a };
      }
    }
    if (!best) return cap + 1;
    if (best.swap) { const tmp = cur; cur = nxt; nxt = tmp; }
    const na = best.a + (rng() + rng() + rng() - 1.5) * 1.5;   // human-like aim error
    const trH = b.trace(11, sy, Math.cos(na * Math.PI / 180), -Math.sin(na * Math.PI / 180));
    b.shoot({ t: 'color', c: best.ammo }, trH.land >= 0 ? trH : best.tr);
    if (b.progress().done) return m;
    cur = nxt; if (!b.hasColor(cur)) cur = b.nextColor();
    nxt = b.nextColor();
  }
  return cap + 1;
}
const from = +process.argv[2] || 1, to = +process.argv[3] || DATA.MAX_LEVEL, RUNS = +process.argv[4] || 5;
const out = {};
for (let id = from; id <= to; id++) {
  if (Levels.HAND[id] && Levels.HAND[id].moves) continue;
  const L = Levels.get(id);
  const res = [];
  for (let r = 0; r < RUNS; r++) res.push(play(Levels.get(id), 1000 + r * 77 + id, 150));
  res.sort((a, b) => a - b);
  const med = res[Math.floor(res.length / 2)], p80 = res[Math.floor(res.length * 0.8)];
  let slack = U.lerp(1.9, 1.35, L.d); if (L.hard) slack -= 0.08;   // generous early, tighter later
  out[id] = Math.max(12, Math.ceil(Math.max(med * slack, p80 * 1.12)));
  console.log(`L${id} ${L.objective.type.padEnd(11)} d=${L.d.toFixed(2)} bot=[${res.join(',')}] -> ${out[id]}`);
}
console.log('\nMOVES=' + JSON.stringify(out));
