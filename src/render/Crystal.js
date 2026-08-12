/**
 * Crystal.js
 * -----------------------------------------------------------------------------
 * Shared routine that draws a single faceted crystal block. Used by both the
 * pieces (tray + dragging) and the board (placed cells), so a relic looks
 * identical wherever it appears. Pure drawing — no state.
 *
 * The look is faked with a light model rather than sprites:
 *   - diagonal light/dark facet split for a cut-gem read
 *   - a translucent core gradient for depth
 *   - a specular sparkle for the "polished" highlight
 *   - an optional outer glow (the relic's magical aura)
 *   - an `ignite` white overlay used while a cell dissolves during a clear
 * Living in one place keeps the material language consistent across the game.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';
import { Quality } from '../config/Quality.js';

/**
 * @param {import('../core/Renderer.js').Renderer} renderer
 * @param {number} x Cell top-left (logical px).
 * @param {number} y
 * @param {number} size Cell size (logical px).
 * @param {object} material A Palette.materials entry.
 * @param {object} [opts] { scale=1, glow=0.6, ignite=0, radius }
 */
export function drawCrystal(renderer, x, y, size, material, opts = {}) {
  const {
    scale = 1,
    glow = 0.6,
    ignite = 0,
    radius = Config.board.cellRadius,
  } = opts;
  const ctx = renderer.ctx;

  // Scale about the cell centre so pops/landings don't drift.
  const s = size * scale;
  const px = x + (size - s) * 0.5;
  const py = y + (size - s) * 0.5;
  const r = Math.max(2, radius * scale);

  // --- Outer magical aura ---------------------------------------------------
  if (glow > 0 && Quality.highQuality) {
    ctx.save();
    ctx.shadowColor = material.glow;
    ctx.shadowBlur = 16 * glow;
    renderer.fillRoundRect(px, py, s, s, r, material.core);
    ctx.restore();
  }

  // --- Translucent body -----------------------------------------------------
  const body = renderer.linearGradient(px, py, px + s, py + s, [
    [0, material.light],
    [0.45, material.core],
    [1, material.deep],
  ]);
  renderer.fillRoundRect(px, py, s, s, r, body);

  // --- Facets + glossy dome (clipped to the gem) ----------------------------
  ctx.save();
  renderer.roundRectPath(px, py, s, s, r);
  ctx.clip();

  // Soft diagonal facets (subtle — the gloss dome below carries the shine).
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = material.light;
  ctx.beginPath();
  ctx.moveTo(px, py); ctx.lineTo(px + s, py); ctx.lineTo(px, py + s); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = material.deep;
  ctx.beginPath();
  ctx.moveTo(px + s, py); ctx.lineTo(px + s, py + s); ctx.lineTo(px, py + s); ctx.closePath(); ctx.fill();

  // Glossy top dome — the signature "candy gem" sheen over the upper half.
  ctx.globalAlpha = 1;
  const gloss = renderer.linearGradient(px, py, px, py + s * 0.62, [[0, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
  renderer.fillRoundRect(px + s * 0.12, py + s * 0.08, s * 0.76, s * 0.46, r * 0.8, gloss);
  // A grounding shade along the very bottom so the block reads as puffed/3D.
  ctx.globalAlpha = 0.28;
  renderer.fillRoundRect(px + s * 0.14, py + s * 0.74, s * 0.72, s * 0.16, r * 0.6, material.deep);
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- Beveled rim + central star specular ----------------------------------
  // Bright inner rim reads as a raised, beveled edge.
  renderer.strokeRoundRect(px + s * 0.045, py + s * 0.045, s * 0.91, s * 0.91, r * 0.9, material.light, Math.max(1.5, s * 0.06));
  // Thin darker outer edge for definition against the socket.
  ctx.globalAlpha = 0.5;
  renderer.strokeRoundRect(px + 0.5, py + 0.5, s - 1, s - 1, r, material.deep, Math.max(1, s * 0.03));
  ctx.globalAlpha = 1;
  // Central 4-point star (the reference gems' hallmark) + a tiny corner glint.
  renderer.withGlow(material.spark, 6, () => renderer.sparkle(px + s * 0.5, py + s * 0.46, s * 0.17, material.spark));
  ctx.globalAlpha = 0.85;
  renderer.fillCircle(px + s * 0.30, py + s * 0.27, s * 0.05, '#ffffff');
  ctx.globalAlpha = 1;

  // --- Colour-blind aid: a distinct centre symbol per material --------------
  if (Quality.colorBlind && material.symbol) {
    drawSymbol(ctx, material.symbol, px + s / 2, py + s / 2, s * 0.24);
  }

  // --- Ignite overlay (clear dissolve) --------------------------------------
  if (ignite > 0) {
    ctx.globalAlpha = Math.min(1, ignite);
    renderer.fillRoundRect(px, py, s, s, r, '#ffffff');
    ctx.globalAlpha = 1;
  }
}

/** Small high-contrast glyphs so materials stay distinguishable without colour. */
function drawSymbol(ctx, sym, cx, cy, s) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (sym === 'circle') { ctx.arc(cx, cy, s, 0, Math.PI * 2); }
  else if (sym === 'square') { ctx.rect(cx - s, cy - s, s * 2, s * 2); }
  else if (sym === 'triangle') { ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx - s, cy + s); ctx.closePath(); }
  else if (sym === 'diamond') { ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy); ctx.closePath(); }
  else { ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); } // plus/cross
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
