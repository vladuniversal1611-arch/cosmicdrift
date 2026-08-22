/**
 * Flags.js
 * -----------------------------------------------------------------------------
 * Tiny procedural country flags for the language picker. Drawn as shapes (not
 * emoji) so they render identically on every device regardless of the platform
 * emoji font. Each flag is clipped to a rounded rect with a soft border.
 * -----------------------------------------------------------------------------
 */

// Striped flags: `dir` 'h' (top→bottom) or 'v' (left→right), `bands` = [colour, weight].
const FLAGS = {
  uk: { dir: 'h', bands: [['#0057b7', 1], ['#ffd700', 1]] },
  de: { dir: 'h', bands: [['#111111', 1], ['#dd0000', 1], ['#ffce00', 1]] },
  fr: { dir: 'v', bands: [['#0055a4', 1], ['#ffffff', 1], ['#ef4135', 1]] },
  es: { dir: 'h', bands: [['#aa151b', 1], ['#f1bf00', 2], ['#aa151b', 1]] },
  it: { dir: 'v', bands: [['#009246', 1], ['#ffffff', 1], ['#ce2b37', 1]] },
  pt: { dir: 'v', bands: [['#006600', 2], ['#d52b1e', 3]] },
  pl: { dir: 'h', bands: [['#ffffff', 1], ['#dc143c', 1]] },
  id: { dir: 'h', bands: [['#ff0000', 1], ['#ffffff', 1]] },
  nl: { dir: 'h', bands: [['#ae1c28', 1], ['#ffffff', 1], ['#21468b', 1]] },
  en: { special: 'gb' },
  tr: { special: 'tr' },
};

export function drawFlag(r, x, y, w, h, code) {
  const ctx = r.ctx, rad = Math.min(7, h * 0.2);
  ctx.save();
  r.roundRectPath(x, y, w, h, rad);
  ctx.clip();
  const f = FLAGS[code];
  if (!f) { ctx.fillStyle = '#8aa0c0'; ctx.fillRect(x, y, w, h); }
  else if (f.special === 'gb') _gb(ctx, x, y, w, h);
  else if (f.special === 'tr') _tr(ctx, x, y, w, h);
  else _bands(ctx, x, y, w, h, f);
  ctx.restore();
  r.strokeRoundRect(x + 0.5, y + 0.5, w - 1, h - 1, rad, 'rgba(0,0,0,0.28)', 1.5);
}

function _bands(ctx, x, y, w, h, f) {
  const total = f.bands.reduce((s, b) => s + b[1], 0);
  let off = 0;
  for (const [col, wt] of f.bands) {
    const span = (f.dir === 'h' ? h : w) * (wt / total);
    ctx.fillStyle = col;
    if (f.dir === 'h') ctx.fillRect(x, y + off, w, span + 0.5);
    else ctx.fillRect(x + off, y, span + 0.5, h);
    off += span;
  }
}

/** Simplified Union Jack. */
function _gb(ctx, x, y, w, h) {
  ctx.fillStyle = '#012169'; ctx.fillRect(x, y, w, h);
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = h * 0.26;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.strokeStyle = '#c8102e'; ctx.lineWidth = h * 0.11;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y + h / 2 - h * 0.18, w, h * 0.36);
  ctx.fillRect(x + w / 2 - h * 0.18, y, h * 0.36, h);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(x, y + h / 2 - h * 0.1, w, h * 0.2);
  ctx.fillRect(x + w / 2 - h * 0.1, y, h * 0.2, h);
}

/** Turkey — red field, white crescent + star. */
function _tr(ctx, x, y, w, h) {
  ctx.fillStyle = '#e30a17'; ctx.fillRect(x, y, w, h);
  const cx = x + w * 0.4, cy = y + h / 2, rr = h * 0.28;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e30a17'; ctx.beginPath(); ctx.arc(cx + rr * 0.38, cy, rr * 0.82, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  const sr = h * 0.15, sx = x + w * 0.6, sy = cy;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? sr * 0.42 : sr;
    const px = sx + Math.cos(a) * rad, py = sy + Math.sin(a) * rad;
    k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
