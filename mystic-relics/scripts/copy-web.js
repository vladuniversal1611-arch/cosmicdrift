/* Копіює лише веб-застосунок у www/ (webDir для Capacitor),
   без node_modules/android/докам — щоб не роздувати APK. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const INCLUDE = ['index.html', 'css', 'js'];
// У застосунок кладемо ЗМЕНШЕНІ асети (assets-min), щоб APK був легким.
// Якщо assets-min нема — fallback на повнорозмірні assets.
const ASSETS_SRC = fs.existsSync(path.join(ROOT, 'assets-min')) ? 'assets-min' : 'assets';

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f));
  } else fs.copyFileSync(src, dst);
}
rmrf(WWW); fs.mkdirSync(WWW, { recursive: true });
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) copy(src, path.join(WWW, item));
}
copy(path.join(ROOT, ASSETS_SRC), path.join(WWW, 'assets'));   // → www/assets
console.log('www/ ready:', INCLUDE.join(', '), '+', ASSETS_SRC, '→ assets');
