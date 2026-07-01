/* Build the standalone single-file game (DragonMergeBlast.html) by inlining
   all CSS, JS and dragon sprites from www/ in the correct load order. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ORDER = ['data', 'i18n', 'sprites', 'save', 'audio', 'engine', 'ui', 'main'];
const DRAGONS = ['flare', 'frost', 'storm', 'verdant', 'aether',
  'boss_ash', 'boss_titan', 'boss_storm', 'boss_beast', 'boss_phoenix', 'egg'];

let html = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'www/css/style.css'), 'utf8');
const js = ORDER.map(f => fs.readFileSync(path.join(ROOT, 'www/js/' + f + '.js'), 'utf8')).join('\n//----\n');

// Inline dragon sprites as data URIs so the single file works offline.
const sprites = {};
DRAGONS.forEach(function (id) {
  const p = path.join(ROOT, 'www/assets/dragons/' + id + '.png');
  if (fs.existsSync(p)) sprites[id] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
});
// Inline crystal gem sprites (gem0..gem5) the same way.
const gems = {};
for (let i = 0; i < 6; i++) {
  const p = path.join(ROOT, 'www/assets/gems/gem' + i + '.png');
  if (fs.existsSync(p)) gems['gem' + i] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}
// Inline special-crystal marker sprites (line_h/line_v/bomb/rainbow).
const specials = {};
['line_h', 'line_v', 'bomb', 'rainbow'].forEach(function (nm) {
  const p = path.join(ROOT, 'www/assets/specials/' + nm + '.png');
  if (fs.existsSync(p)) specials[nm] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
});
// Inline blocker sprites (ice / crate / chain).
const blockers = {};
['ice', 'crate', 'chain'].forEach(function (nm) {
  const p = path.join(ROOT, 'www/assets/blockers/' + nm + '.png');
  if (fs.existsSync(p)) blockers[nm] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
});
// Inline jelly sprites.
const jelly = {};
['jelly1', 'jelly2'].forEach(function (nm) {
  const p = path.join(ROOT, 'www/assets/jelly/' + nm + '.png');
  if (fs.existsSync(p)) jelly[nm] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
});
const spriteScript = '<script>window.DRAGON_SPRITES=' + JSON.stringify(sprites) + ';window.GEM_SPRITES=' + JSON.stringify(gems) + ';window.SPECIAL_SPRITES=' + JSON.stringify(specials) + ';window.BLOCKER_SPRITES=' + JSON.stringify(blockers) + ';window.JELLY_SPRITES=' + JSON.stringify(jelly) + ';</script>\n';

html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, '<style>\n' + css + '\n</style>');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
html = html.replace(/<script src="js\/data.js"><\/script>[\s\S]*?<script src="js\/main.js"><\/script>/, spriteScript + '<script>\n' + js + '\n</script>');

const out = path.join(ROOT, 'DragonMergeBlast.html');
fs.writeFileSync(out, html);
console.log('built DragonMergeBlast.html', (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
