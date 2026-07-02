/*
 * Splice translated language JSON files into www/js/i18n.js as complete,
 * self-contained STR blocks (all 356 keys each), and extend ORDER.
 * Idempotent: removes any prior auto-added block before re-inserting.
 *
 *   node android-resources/integrate_langs.js it pl tr ja ko zh
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = '/tmp/claude-0/-home-user-cosmicdrift/3585b5c6-9467-5acb-8a7c-4cc9c037d191/scratchpad';
const I18N = path.join(ROOT, 'www', 'js', 'i18n.js');

const codes = process.argv.slice(2);
if (!codes.length) { console.error('usage: integrate_langs.js <code>...'); process.exit(1); }

// Reference key set = English (complete)
global.window = global;
delete require.cache[require.resolve(I18N)];
require(I18N);
const enKeys = Object.keys(global.I18N.STR.en);

const START = '  // <<< AUTO-LANGS START (generated) >>>';
const END = '  // <<< AUTO-LANGS END >>>';

let blocks = [START];
const added = [];
codes.forEach(function (c) {
  const f = path.join(SCRATCH, 'lang_' + c + '.json');
  if (!fs.existsSync(f)) { console.error('MISSING', f); process.exit(1); }
  const obj = JSON.parse(fs.readFileSync(f, 'utf8'));
  // Fill any missing keys from English so the block is complete
  let filled = 0;
  enKeys.forEach(function (k) { if (obj[k] == null) { obj[k] = global.I18N.STR.en[k]; filled++; } });
  // Drop stray keys not in English
  Object.keys(obj).forEach(function (k) { if (!enKeys.includes(k)) delete obj[k]; });
  const ordered = {};
  enKeys.forEach(function (k) { ordered[k] = obj[k]; });
  blocks.push('  STR.' + c + ' = ' + JSON.stringify(ordered) + ';');
  added.push(c);
  console.log('prepared', c, 'keys=' + Object.keys(ordered).length, 'filled-from-en=' + filled);
});
blocks.push(END);

let src = fs.readFileSync(I18N, 'utf8');
// Strip previous auto block
const re = new RegExp('\\n' + START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
src = src.replace(re, '');

// Insert block right before the ORDER declaration
const orderRe = /\n(\s*const ORDER = )\[[^\]]*\];/;
if (!orderRe.test(src)) { console.error('could not find ORDER declaration'); process.exit(1); }
const fullOrder = ['uk', 'en', 'es', 'de', 'fr', 'pt'].concat(added);
src = src.replace(orderRe, '\n' + blocks.join('\n') + '\n$1' + JSON.stringify(fullOrder).replace(/","/g, "', '").replace(/\["/, "['").replace(/"\]/, "']") + ';');

fs.writeFileSync(I18N, src);
console.log('ORDER =', JSON.stringify(fullOrder));
console.log('integrated', added.length, 'languages into', path.relative(ROOT, I18N));
