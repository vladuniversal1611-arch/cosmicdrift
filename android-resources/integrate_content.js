/*
 * Inject localized content-name strings (dragon titles/descs, island names,
 * boss names) into www/js/i18n.js as a merge block that runs after all base
 * languages are defined. Idempotent (removes prior CONTENT block first).
 *
 *   node android-resources/integrate_content.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const I18N = path.join(ROOT, 'www', 'js', 'i18n.js');
const byKey = JSON.parse(fs.readFileSync(path.join(__dirname, 'content_i18n.json'), 'utf8'));

// Reference languages from ORDER
global.window = global;
delete require.cache[require.resolve(I18N)];
require(I18N);
const langs = global.I18N.ORDER;

// Transpose to by-language, validating full coverage
const byLang = {};
langs.forEach(function (l) { byLang[l] = {}; });
Object.keys(byKey).forEach(function (k) {
  langs.forEach(function (l) {
    const v = byKey[k][l];
    if (v == null) { console.error('MISSING', k, l); process.exit(1); }
    byLang[l][k] = v;
  });
});

const START = '  // <<< CONTENT-LANGS START (generated) >>>';
const END = '  // <<< CONTENT-LANGS END >>>';
const lines = [START, '  const CT = ' + JSON.stringify(byLang) + ';',
  '  Object.keys(CT).forEach(function (l) { if (STR[l]) Object.assign(STR[l], CT[l]); });', END];

let src = fs.readFileSync(I18N, 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
src = src.replace(new RegExp('\\n' + esc(START) + '[\\s\\S]*?' + esc(END), 'g'), '');

// Insert right before ORDER declaration (after AUTO-LANGS block)
const orderRe = /\n(\s*const ORDER = )/;
if (!orderRe.test(src)) { console.error('ORDER not found'); process.exit(1); }
src = src.replace(orderRe, '\n' + lines.join('\n') + '\n$1');
fs.writeFileSync(I18N, src);
console.log('injected content block for', Object.keys(byKey).length, 'keys x', langs.length, 'languages');
