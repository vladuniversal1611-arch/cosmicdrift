/* Headless smoke test for the match-3 engine + save system.
   Shims a minimal browser environment, then plays levels with
   random valid moves to surface runtime crashes. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- minimal browser shims ---
const store = {};
const sandbox = {
  Math: Math, Date: Date, JSON: JSON, console: console,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  AudioContext: undefined, webkitAudioContext: undefined,
  devicePixelRatio: 1,
  document: { addEventListener() {}, getElementById() { return null; }, createElement() { return { classList: { add(){}, remove(){} }, appendChild(){}, querySelector(){return null;}, style:{}, addEventListener(){} }; }, querySelectorAll(){return [];} },
  addEventListener() {},
};
sandbox.window = sandbox;
sandbox.global = sandbox;
vm.createContext(sandbox);

function loadFile(rel) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'www', 'js', rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}
['data.js', 'i18n.js', 'save.js', 'audio.js', 'engine.js'].forEach(loadFile);

sandbox.Save.load();

// stub Audio2 (no AudioContext in node)
sandbox.Audio2 = { resume(){}, play(){}, startMusic(){}, stopMusic(){}, setMusicEnabled(){} };

const D = sandbox.GameData;
let totalCrashes = 0, wins = 0, losses = 0, totalMoves = 0;

function pump(engine, maxFrames) {
  // advance animation/resolve state machine until idle/done
  let frames = 0;
  while ((engine.state === 'busy') && frames < maxFrames) {
    engine.update(0.05);
    frames++;
  }
  // flush a few more to settle particles/afterFn
  for (let i = 0; i < 5; i++) engine.update(0.05);
  return frames;
}

function findAValidMove(engine) {
  for (let r = 0; r < engine.rows; r++) for (let c = 0; c < engine.cols; c++) {
    if (engine.grid[r][c].ice) continue;
    const tries = [[r, c, r, c + 1], [r, c, r + 1, c]];
    for (const [r1, c1, r2, c2] of tries) {
      if (r2 >= engine.rows || c2 >= engine.cols) continue;
      if (engine.grid[r2][c2].ice) continue;
      engine.swapRaw(r1, c1, r2, c2);
      const ok = engine.findMatches().length > 0;
      engine.swapRaw(r1, c1, r2, c2);
      if (ok) return { a: { r: r1, c: c1 }, b: { r: r2, c: c2 } };
    }
  }
  return null;
}

function playLevel(n) {
  const lv = D.LEVELS[n - 1];
  const eng = new sandbox.Engine();
  // equip a couple of dragons to exercise abilities
  sandbox.Save.get().ownedDragons = ['flare', 'frost', 'storm', 'verdant', 'aether'];
  sandbox.Save.get().dragonLevels = { flare: 3, frost: 3, storm: 3, verdant: 3, aether: 3 };
  let result = null;
  eng.init(lv, ['flare', 'storm', 'frost'], {
    onWin: r => { result = { win: true, r }; },
    onLose: r => { result = { win: false, r }; }
  });
  eng.setViewport(0, 0, 400);

  let safety = 0;
  while (!eng.finished && safety < 300) {
    safety++;
    const mv = findAValidMove(eng);
    if (!mv) { eng.shuffleBoard(); pump(eng, 500); continue; }
    eng.trySwap(mv.a, mv.b);
    totalMoves++;
    pump(eng, 2000);
  }
  // Flush the victory ("sugar crush") finale, which defers onWin ~1.4s.
  for (let i = 0; i < 60 && !result; i++) eng.update(0.05);
  if (result) { if (result.win) wins++; else losses++; }
  return { finished: eng.finished, result };
}

// Play a spread of levels across all islands.
const sample = [1, 2, 3, 4, 5, 13, 25, 26, 50, 51, 75, 100, 110, 125];
for (const n of sample) {
  try {
    const out = playLevel(n);
    const lv = D.LEVELS[n - 1];
    console.log(`Level ${n} [${lv.objective}] -> ${out.finished ? (out.result && out.result.win ? 'WIN' : 'LOSE') : 'STUCK'}`);
  } catch (e) {
    totalCrashes++;
    console.error(`Level ${n} CRASHED:`, e.message, '\n', e.stack.split('\n').slice(1, 4).join('\n'));
  }
}

console.log(`\n=== Summary ===`);
console.log(`Levels played: ${sample.length}, wins: ${wins}, losses: ${losses}, crashes: ${totalCrashes}, total moves: ${totalMoves}`);
console.log(`Total levels defined: ${D.LEVELS.length}, dragons: ${D.DRAGONS.length}, islands: ${D.ISLANDS.length}`);
process.exit(totalCrashes > 0 ? 1 : 0);
