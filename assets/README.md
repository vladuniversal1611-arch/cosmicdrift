# Assets

Mystic Alchemy Lab intentionally ships with **near-zero binary assets** so the
game stays tiny, loads instantly, and works fully offline.

| File | Purpose |
|------|---------|
| `icon.svg` | App / launcher / favicon icon (vector, scales to any size) |
| `manifest.webmanifest` | PWA manifest for installable web app & Android metadata |

## Where do the graphics & sounds come from?

Everything visual is **drawn procedurally on an HTML5 Canvas** at runtime
(flasks, glossy essences, particles, cores, backgrounds). Everything audible is
**synthesised procedurally with the WebAudio API** (`Audio` module in
`game.js`) — moves, fusions, cores, combos, victory, boosters, menu, ambient
music per world. No `.png`, `.mp3`, or `.ogg` files are required.

## Generating raster icons for the app stores

Google Play needs PNG icons. Generate them from `icon.svg` once at build time:

```bash
# using Inkscape
inkscape icon.svg -w 512 -h 512 -o icon-512.png
inkscape icon.svg -w 192 -h 192 -o icon-192.png

# or using rsvg-convert / ImageMagick
rsvg-convert -w 512 -h 512 icon.svg > icon-512.png
```

Capacitor's `@capacitor/assets` tool can also auto-generate every density from
a single 1024×1024 source:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#e9f7ff'
```
