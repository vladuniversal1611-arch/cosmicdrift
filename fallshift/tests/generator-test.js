/* Procedural generator self-test.  Run:  node tests/generator-test.js
   Generates 200 seeds x 400 floors and asserts every floor has a guaranteed safe passage,
   at least two safe platforms, and that moving hazards never cover a passage. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, console, Math, JSON };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['storage.js', 'levelGenerator.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const FS = ctx.FS;
const LG = FS.LevelGen;

let floors = 0, bad = 0, bosses = 0;
const types = {};
const mods = {};
for (let s = 0; s < 200; s++) {
  const seed = (s * 7919 + 13) | 0;
  let prev = null;
  for (let f = 1; f <= 400; f++) {
    const r = LG.generateFloor(f, prev, seed, { lucky: s % 3 });
    floors++;
    if (r.boss) bosses++;
    if (r.mod) mods[r.mod] = (mods[r.mod] || 0) + 1;
    for (const sg of r.segs) types[sg.type] = (types[sg.type] || 0) + 1;
    if (!LG.isPassable(r)) {
      bad++;
      if (bad < 5) console.log('IMPOSSIBLE floor', f, 'seed', seed, r.segs.map((x) => x.type).join(','));
    }
    if (r.n < 8 || r.n > 12) {
      bad++;
      console.log('bad segment count', r.n);
    }
    prev = r;
  }
}
console.log('floors checked:', floors, ' boss floors:', bosses);
console.log('segment types:', JSON.stringify(types));
console.log('modifiers:', JSON.stringify(mods));
if (bad) {
  console.log('FAIL:', bad, 'invalid floors');
  process.exit(1);
}
console.log('PASS: every floor has a guaranteed passage');
