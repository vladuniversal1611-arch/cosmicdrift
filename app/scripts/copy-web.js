// Copies the single-file game into www/index.html (Capacitor's web folder).
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', '..', 'frog-endless-runner.html');
const out = path.join(__dirname, '..', 'www');
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(src, path.join(out, 'index.html'));
fs.mkdirSync(path.join(__dirname, '..', 'assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', '..', 'icons', 'icon-1024.png'), path.join(__dirname, '..', 'assets', 'icon.png'));
console.log('www/index.html updated');
