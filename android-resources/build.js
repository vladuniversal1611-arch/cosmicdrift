/* Build the standalone single-file game (DragonMergeBlast.html) by inlining
   all CSS and JS from www/ in the correct load order. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ORDER = ['data', 'i18n', 'save', 'audio', 'engine', 'ui', 'main'];

let html = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'www/css/style.css'), 'utf8');
const js = ORDER.map(f => fs.readFileSync(path.join(ROOT, 'www/js/' + f + '.js'), 'utf8')).join('\n//----\n');

html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, '<style>\n' + css + '\n</style>');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
html = html.replace(/<script src="js\/data.js"><\/script>[\s\S]*?<script src="js\/main.js"><\/script>/, '<script>\n' + js + '\n</script>');

const out = path.join(ROOT, 'DragonMergeBlast.html');
fs.writeFileSync(out, html);
console.log('built DragonMergeBlast.html', (fs.statSync(out).size / 1024).toFixed(1) + 'KB');
