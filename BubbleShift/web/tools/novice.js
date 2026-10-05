// "Novice" check: a weaker bot (no swap, no build-up planning, ±3° aim error)
// plays early levels with the real budgets. Early levels should be ~90%+ wins.
const { U, DATA, Core, Levels } = require('./load')();
function play(L, seed) {
  const b = new Core.Board(L, seed), rng = U.rng(seed);
  const forced = (L.ammo || []).slice();
  let cur = forced.length ? forced.shift() : b.nextColor();
  for (let m = 1; m <= L.moves; m++) {
    const low = b.lowestRow(); const sy = Math.max(0, Core.cy(Math.max(low, 0)) + 1 - 26) + 32;
    let best = null;
    for (let a = 10; a <= 170; a += 3) {
      const r = a * Math.PI / 180, tr = b.trace(11, sy, Math.cos(r), -Math.sin(r));
      if (tr.land < 0) continue;
      const c = b.clone(), p0 = c.progress().cur, res = c.shoot({ t: 'color', c: cur }, tr);
      const s = (c.progress().done ? 1e4 : 0) + (c.progress().cur - p0) * 3 + res.removed + rng() * 0.5;
      if (!best || s > best.s) best = { s, a };
    }
    const na = best.a + (rng() - 0.5) * 6;
    const tr = b.trace(11, sy, Math.cos(na * Math.PI / 180), -Math.sin(na * Math.PI / 180));
    if (tr.land >= 0) b.shoot({ t: 'color', c: cur }, tr);
    if (b.progress().done) return m;
    cur = forced.length ? forced.shift() : b.nextColor();
  }
  return 0;
}
const from = +process.argv[2] || 1, to = +process.argv[3] || 20;
for (let id = from; id <= to; id++) {
  const L = Levels.get(id); let wins = 0; const used = [];
  for (let r = 0; r < 20; r++) { const m = play(Levels.get(id), 500 + r * 31); if (m) { wins++; used.push(m); } }
  console.log(`L${id} ${L.objective.type.padEnd(11)} moves=${L.moves} novice win ${wins * 5}%  used≈${used.length ? Math.round(used.reduce((a, b) => a + b, 0) / used.length) : '-'}`);
}
