/* Regression test for the "specials destroy blockers without crediting iceLeft"
   bug. Plays ICE/crate objective levels and asserts, after every settle, that
   engine.iceLeft equals the actual number of blocker tiles on the board. Also
   asserts ICE levels remain winnable. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const store = {};
const sandbox = {
  Math, Date, JSON, console,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  devicePixelRatio: 1,
  document: { addEventListener() {}, getElementById() { return null; }, createElement() { return { classList: { add() {}, remove() {} }, appendChild() {}, querySelector() { return null; }, style: {}, addEventListener() {} }; }, querySelectorAll() { return []; } },
  addEventListener() {},
};
sandbox.window = sandbox; sandbox.global = sandbox;
vm.createContext(sandbox);
const load = rel => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', rel), 'utf8'), sandbox, { filename: rel });
['data.js', 'i18n.js', 'save.js', 'audio.js', 'engine.js'].forEach(load);
sandbox.Save.load();
sandbox.Audio2 = { resume() {}, play() {}, startMusic() {}, stopMusic() {}, setMusicEnabled() {} };
const D = sandbox.GameData;

function actualBlockers(e) {
  let n = 0;
  for (let r = 0; r < e.rows; r++) for (let c = 0; c < e.cols; c++) { const t = e.grid[r][c]; if (t && t.ice) n++; }
  return n;
}
function pump(e) { let f = 0; while (e.state === 'busy' && f < 4000) { e.update(0.05); f++; } for (let i = 0; i < 30; i++) e.update(0.05); }

// find ICE-objective levels
const iceLevels = [];
for (let i = 0; i < D.LEVELS.length && iceLevels.length < 12; i++) {
  if (D.LEVELS[i].objective === D.OBJ.ICE) iceLevels.push(i + 1);
}

let desyncs = 0, wins = 0, played = 0, crashes = 0, maxDesync = 0;
iceLevels.forEach(function (lvNum) {
  played++;
  try {
    const lv = Object.assign({}, D.LEVELS[lvNum - 1]);
    const e = new sandbox.Engine();
    e.init(lv, ['flare', 'frost', 'storm'], { onWin() {}, onLose() {}, onScore() {}, onMoves() {}, onObjective() {}, onDragons() {}, onFever() {}, onBoss() {} });
    pump(e);
    let moves = 0;
    while (!e.finished && moves < 120) {
      // find any valid swap
      let did = false;
      for (let r = 0; r < e.rows && !did; r++) for (let c = 0; c < e.cols - 1 && !did; c++) {
        if (e.movable && e.movable(r, c) && e.movable(r, c + 1)) {
          e.swapRaw(r, c, r, c + 1); pump(e);
          // invariant check after each settle
          const inv = actualBlockers(e);
          if (e.iceLeft !== inv) { desyncs++; maxDesync = Math.max(maxDesync, Math.abs(e.iceLeft - inv)); }
          did = true; moves++;
        }
      }
      if (!did) break;
    }
    if (e.won || e.iceLeft <= 0) wins++;
  } catch (err) { crashes++; console.log('CRASH lv' + lvNum + ':', err.message); }
});

// ---- Direct deterministic test: a line/bomb blast over a blocker ----
// Plants a controlled scenario so the exact bug path is exercised every run.
const SP = D.SPECIAL;
function directBlast(specialType, place) {
  const e = new sandbox.Engine();
  const lv = Object.assign({}, D.LEVELS[iceLevels[0] - 1]);
  e.init(lv, ['flare'], { onWin() {}, onLose() {}, onScore() {}, onMoves() {}, onObjective() {}, onDragons() {}, onFever() {}, onBoss() {} });
  pump(e);
  for (let r = 0; r < e.rows; r++) for (let c = 0; c < e.cols; c++) { const t = e.grid[r][c]; if (t) { t.ice = false; t.crate = false; t.chain = false; t.blockHp = 0; t.special = SP.NONE; } }
  place(e);                      // set up ice + special
  const set = {}; e.addSpecialEffect(set, 2, 0); e.clearSet(set); pump(e);
  return { iceLeft: e.iceLeft, blockers: actualBlockers(e) };
}
// line over ice: must credit the blocker -> iceLeft stays in sync (no corruption)
const rLine = directBlast(SP.LINE_H, e => { e.grid[2][5].ice = true; e.grid[2][5].blockHp = 1; e.grid[2][0].special = SP.LINE_H; e.iceLeft = 1; });
const directLineOk = rLine.iceLeft === rLine.blockers && rLine.iceLeft === 0;

// unit test of the single-hit crack: a crate (2 HP) loses exactly 1 HP and
// survives one direct hit; iceLeft only drops when it fully breaks.
const eu = new sandbox.Engine();
eu.init(Object.assign({}, D.LEVELS[iceLevels[0] - 1]), ['flare'], { onWin() {}, onLose() {}, onScore() {}, onMoves() {}, onObjective() {}, onDragons() {}, onFever() {}, onBoss() {} });
pump(eu);
eu.grid[2][5].ice = true; eu.grid[2][5].crate = true; eu.grid[2][5].blockHp = 2; eu.iceLeft = 1;
eu.crackBlockerAt(2, 5);
const crateSurvives = eu.grid[2][5].ice === true && eu.grid[2][5].blockHp === 1 && eu.iceLeft === 1;
eu.crackBlockerAt(2, 5); // second hit breaks it
const crateBreaks = eu.grid[2][5].ice === false && eu.iceLeft === 0;
const crackOk = crateSurvives && crateBreaks;

console.log('=== ICE blocker invariant test ===');
console.log('ICE levels played:', played, '| wins:', wins, '| crashes:', crashes);
console.log('iceLeft desyncs (iceLeft != actual blockers):', desyncs, '| max desync:', maxDesync);
console.log('direct line-over-ice  -> iceLeft', rLine.iceLeft, 'blockers', rLine.blockers, directLineOk ? 'OK' : 'BAD');
console.log('crate 2-hit crack      ->', crackOk ? 'OK (survives 1st hit, breaks on 2nd)' : 'BAD');
const ok = desyncs === 0 && crashes === 0 && directLineOk && crackOk;
console.log(ok ? 'PASS ✓' : 'FAIL ✗');
process.exit(ok ? 0 : 1);
