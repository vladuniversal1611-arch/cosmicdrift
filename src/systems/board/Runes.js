/**
 * Runes.js
 * -----------------------------------------------------------------------------
 * A small library of procedurally-drawn magical rune glyphs, etched into the
 * stone board and its cells. Drawing them with primitives (no image assets)
 * keeps the game self-contained and crisp at any resolution.
 *
 * Each glyph draws centred on (cx, cy) within a box of `size`, using the
 * current ctx.strokeStyle / lineWidth set by the caller. Glyphs are simple and
 * cheap so all 64 cells can carry one without hurting the frame budget.
 * -----------------------------------------------------------------------------
 */

/** The glyph drawing functions. Add more for visual variety. */
const GLYPHS = [
  // Triangle-in-circle
  (ctx, s) => {
    ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.24);
    ctx.lineTo(s * 0.2, s * 0.16);
    ctx.lineTo(-s * 0.2, s * 0.16);
    ctx.closePath(); ctx.stroke();
  },
  // Vertical bar with crossing arcs
  (ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.32); ctx.lineTo(0, s * 0.32);
    ctx.moveTo(-s * 0.22, -s * 0.1); ctx.lineTo(s * 0.22, -s * 0.1);
    ctx.moveTo(-s * 0.16, s * 0.14); ctx.lineTo(s * 0.16, s * 0.14);
    ctx.stroke();
  },
  // Diamond with dot
  (ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3); ctx.lineTo(s * 0.3, 0);
    ctx.lineTo(0, s * 0.3); ctx.lineTo(-s * 0.3, 0);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.06, 0, Math.PI * 2); ctx.stroke();
  },
  // Crescent
  (ctx, s) => {
    ctx.beginPath(); ctx.arc(0, 0, s * 0.3, Math.PI * 0.35, Math.PI * 1.65); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.12, 0, s * 0.26, Math.PI * 0.5, Math.PI * 1.5, true); ctx.stroke();
  },
  // Trident
  (ctx, s) => {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3); ctx.lineTo(0, -s * 0.2);
    ctx.moveTo(-s * 0.2, -s * 0.28); ctx.lineTo(-s * 0.2, -s * 0.02);
    ctx.moveTo(s * 0.2, -s * 0.28); ctx.lineTo(s * 0.2, -s * 0.02);
    ctx.moveTo(-s * 0.2, -s * 0.05); ctx.lineTo(s * 0.2, -s * 0.05);
    ctx.stroke();
  },
  // Spiral-ish rings
  (ctx, s) => {
    ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 1.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.16, Math.PI, Math.PI * 2.6); ctx.stroke();
  },
];

export const RUNE_COUNT = GLYPHS.length;

/**
 * Draw rune `index` centred at (cx, cy). Caller sets strokeStyle, lineWidth
 * and any glow beforehand.
 */
export function drawRune(ctx, index, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  GLYPHS[index % RUNE_COUNT](ctx, size);
  ctx.restore();
}
