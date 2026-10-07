// Builds hill_rush_test.html from hill_rush.html: everything unlocked, lots of
// coins, a separate save slot (never touches the real "hillrush3" progress)
// and a TEST badge. Usage: node tools/make_test_build.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let src = fs.readFileSync(path.join(root, 'hill_rush.html'), 'utf8');

const rep = (from, to) => {
  if (!src.includes(from)) throw new Error('pattern not found: ' + from);
  src = src.replace(from, to);
};
rep('<title>Hill Rush</title>', '<title>Hill Rush TEST</title>');
rep("const SK='hillrush3',SK_BAK='hillrush3_bak'", "const SK='hillrush_test',SK_BAK='hillrush_test_bak'");
rep('let sv=loadSave();', `let sv=loadSave();
// TEST BUILD: all vehicles and maps open, coins topped up on every launch
VEHICLES.forEach(v=>sv.vs[v.id].locked=false);ENVS.forEach(e=>sv.envs[e.id]=true);
sv.coins=Math.max(sv.coins,9999999);`);
rep('<body>', `<body>
<div style="position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:9999;pointer-events:none;background:#d32f2f;color:#fff;font:bold 10px sans-serif;padding:2px 8px;border-radius:6px;opacity:.85">TEST BUILD</div>`);
// no service worker: the test file must never be cached over the release build
rep("if('serviceWorker'in navigator)", 'if(false)');

fs.writeFileSync(path.join(root, 'hill_rush_test.html'), src);
console.log('wrote hill_rush_test.html');
