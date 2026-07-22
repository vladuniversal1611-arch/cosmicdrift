/**
 * NineSlice.js
 * -----------------------------------------------------------------------------
 * Draw a nine-slice (scalable) frame from a PNG so buttons/panels can use final
 * art at any size without distortion. Corners stay fixed, edges stretch, centre
 * fills. Purely a rendering utility — it holds no state and no colours.
 *
 * If no art is registered for the frame key, `drawFrame` runs the supplied
 * procedural fallback instead, so the UI renders identically until art ships.
 * -----------------------------------------------------------------------------
 */
import { AssetManager } from '../assets/AssetManager.js';

/**
 * @param {object} renderer
 * @param {string} frameKey  AssetManager key, e.g. 'frame:button.play'
 * @param {number} x @param {number} y @param {number} w @param {number} h
 * @param {number} inset     corner size in the source image (px)
 * @param {Function} fallback (renderer, x, y, w, h) => void  drawn when no art
 */
export function drawFrame(renderer, frameKey, x, y, w, h, inset, fallback) {
  const img = AssetManager.image(frameKey);
  if (!img) { if (fallback) fallback(renderer, x, y, w, h); return false; }
  nineSlice(renderer.ctx, img, x, y, w, h, inset);
  return true;
}

/** Blit `img` as a nine-slice into the rect. `s` = source corner inset (px). */
export function nineSlice(ctx, img, x, y, w, h, s) {
  const iw = img.width, ih = img.height;
  const d = Math.min(s, w / 2, h / 2);         // clamp so small rects don't overlap
  const cols = [[0, s, x, d], [s, iw - 2 * s, x + d, w - 2 * d], [iw - s, s, x + w - d, d]];
  const rows = [[0, s, y, d], [s, ih - 2 * s, y + d, h - 2 * d], [ih - s, s, y + h - d, d]];
  for (const [sx, sw, dx, dw] of cols) {
    for (const [sy, sh, dy, dh] of rows) {
      if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) continue;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }
}
