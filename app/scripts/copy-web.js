// Copies the single-file game into www/index.html (Capacitor's web folder) and
// adds capacitor.js, which the game needs to reach native plugins (AdMob).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(root, '..', 'frog-endless-runner.html'), 'utf8');
const cap = path.join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js');
if (fs.existsSync(cap)) {
  fs.copyFileSync(cap, path.join(out, 'capacitor.js'));
  html = html.replace('<head>', '<head>\n<script src="capacitor.js"></script>');
} else {
  console.warn('! node_modules missing: run "npm install" first, or ads will not work in the app');
}
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, '..', 'icons', 'icon-1024.png'), path.join(root, 'assets', 'icon.png'));
console.log('www/index.html updated');
