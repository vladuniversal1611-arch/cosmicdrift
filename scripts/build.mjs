/**
 * build.mjs
 * -----------------------------------------------------------------------------
 * Bundles the ES-module source graph into a single minified IIFE and inlines it
 * into index.html, producing the self-contained CosmicDrift.html that runs from
 * file:// inside an Android WebView (no cross-origin module loads).
 *
 *   node scripts/build.mjs
 * -----------------------------------------------------------------------------
 */
import esbuild from '/opt/node22/lib/node_modules/esbuild/lib/main.js';
const { build } = esbuild;
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const result = await build({
  entryPoints: [resolve(root, 'src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  write: false,
  legalComments: 'none',
});
const js = result.outputFiles[0].text;

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
// Replace the module <script src> with the inlined bundle, preserving the rest
// of the document (viewport meta, immersive-fullscreen bootstrap, styles).
const out = html.replace(
  /<script type="module" src="\.\/src\/main\.js"><\/script>/,
  `<script>${js}</script>`,
);
if (out === html) throw new Error('build: could not find module script tag to inline');

writeFileSync(resolve(root, 'CosmicDrift.html'), out);
console.log(`built CosmicDrift.html (${(out.length / 1024).toFixed(0)}kb)`);
