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
  if (glow > 0 && Config.render.highQuality) {
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

  // --- Facet split (clipped to the gem) -------------------------------------
  ctx.save();
  renderer.roundRectPath(px, py, s, s, r);
  ctx.clip();

  ctx.globalAlpha = 0.38;
  ctx.fillStyle = material.light;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + s, py);
  ctx.lineTo(px, py + s);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.30;
  ctx.fillStyle = material.deep;
  ctx.beginPath();
  ctx.moveTo(px + s, py);
  ctx.lineTo(px + s, py + s);
  ctx.lineTo(px, py + s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- Polished rim + specular ---------------------------------------------
  renderer.strokeRoundRect(px, py, s, s, r, material.light, Math.max(1, s * 0.045));

  ctx.globalAlpha = 0.9;
  renderer.sparkle(px + s * 0.3, py + s * 0.3, s * 0.13, material.spark);
  ctx.globalAlpha = 1;

  // --- Ignite overlay (clear dissolve) --------------------------------------
  if (ignite > 0) {
    ctx.globalAlpha = Math.min(1, ignite);
    renderer.fillRoundRect(px, py, s, s, r, '#ffffff');
    ctx.globalAlpha = 1;
  }
}
