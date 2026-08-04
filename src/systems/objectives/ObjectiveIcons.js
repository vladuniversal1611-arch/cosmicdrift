/**
 * ObjectiveIcons.js
 * -----------------------------------------------------------------------------
 * Tiny procedural glyphs so every objective type has its own recognisable icon
 * without shipping image assets. Each routine draws centred at (cx, cy) within
 * radius r using `color`. Unknown keys fall back to a dot. Adding an icon for a
 * new objective is one entry in ICONS.
 * -----------------------------------------------------------------------------
 */
import { drawRune } from '../board/Runes.js';
import { AssetManager } from '../../ui/assets/AssetManager.js';

const ICONS = {
  crystal(r, cx, cy, s, color) { // diamond gem
    const ctx = r.ctx; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.7, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.7, cy);
    ctx.closePath(); ctx.fill();
  },
  crystaltile(r, cx, cy, s, color) {
    r.fillRoundRect(cx - s * 0.8, cy - s * 0.8, s * 1.6, s * 1.6, s * 0.3, color);
    r.ctx.globalAlpha = 0.5; r.sparkle(cx - s * 0.2, cy - s * 0.2, s * 0.5, '#fff'); r.ctx.globalAlpha = 1;
  },
  drift(r, cx, cy, s, color) { // drifting wind chevrons (>>)
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.32; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const dx = (i - 0.5) * s * 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + dx - s * 0.35, cy - s * 0.6);
      ctx.lineTo(cx + dx + s * 0.35, cy);
      ctx.lineTo(cx + dx - s * 0.35, cy + s * 0.6);
      ctx.stroke();
    }
  },
  egg(r, cx, cy, s, color) {
    const ctx = r.ctx; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.1, s * 0.7, s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.4; r.fillCircle(cx - s * 0.25, cy - s * 0.2, s * 0.25, '#fff'); ctx.globalAlpha = 1;
  },
  dragon(r, cx, cy, s, color) { // head + wing
    r.fillCircle(cx + s * 0.2, cy, s * 0.5, color);
    const ctx = r.ctx; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - s, cy - s * 0.8); ctx.lineTo(cx - s * 0.5, cy + s * 0.4);
    ctx.closePath(); ctx.fill();
  },
  bridge(r, cx, cy, s, color) {
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.4, s * 0.9, Math.PI, 0); ctx.stroke();
  },
  statue(r, cx, cy, s, color) {
    r.fillCircle(cx, cy - s * 0.5, s * 0.35, color);
    r.fillRoundRect(cx - s * 0.35, cy - s * 0.2, s * 0.7, s * 1.1, 2, color);
  },
  flower(r, cx, cy, s, color) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      r.fillCircle(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55, s * 0.38, color);
    }
    r.fillCircle(cx, cy, s * 0.35, '#fff');
  },
  tree(r, cx, cy, s, color) {
    r.fillRoundRect(cx - s * 0.15, cy, s * 0.3, s * 0.9, 2, '#6b4a2b');
    r.fillCircle(cx, cy - s * 0.2, s * 0.7, color);
  },
  corruption(r, cx, cy, s, color) { // spiky blob
    const ctx = r.ctx; ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2; const rad = i % 2 ? s * 0.5 : s;
      const x = cx + Math.cos(a) * rad; const y = cy + Math.sin(a) * rad;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  },
  rune(r, cx, cy, s, color) {
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.2;
    drawRune(ctx, 4, cx, cy, s * 2);
  },
  chest(r, cx, cy, s, color) {
    r.fillRoundRect(cx - s * 0.8, cy - s * 0.2, s * 1.6, s * 0.9, 2, color);
    r.fillRoundRect(cx - s * 0.85, cy - s * 0.7, s * 1.7, s * 0.55, 3, '#8a5a1a');
    r.fillCircle(cx, cy - s * 0.15, s * 0.14, '#fff');
  },
  frozen(r, cx, cy, s, color) { // snowflake
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * s, cy - Math.sin(a) * s);
      ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
      ctx.stroke();
    }
  },
  portal(r, cx, cy, s, color) {
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.28;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2); ctx.stroke();
    r.fillCircle(cx, cy, s * 0.28, color);
  },
  towericon(r, cx, cy, s, color) {
    r.fillRoundRect(cx - s * 0.5, cy - s, s, s * 1.9, 2, color);
    for (let i = -1; i <= 1; i++) r.fillRoundRect(cx + i * s * 0.4 - s * 0.12, cy - s * 1.2, s * 0.24, s * 0.3, 1, color);
  },
  boss(r, cx, cy, s, color) { // menacing eye
    r.fillCircle(cx, cy, s, color);
    r.fillCircle(cx, cy, s * 0.5, '#1a0510');
    r.fillCircle(cx, cy, s * 0.2, color);
  },
  coins(r, cx, cy, s, color) {
    r.fillCircle(cx, cy, s, color);
    r.ctx.globalAlpha = 0.5; r.fillCircle(cx, cy, s * 0.7, '#fff'); r.ctx.globalAlpha = 1;
    r.fillCircle(cx, cy, s * 0.6, color);
    r.sparkle(cx - s * 0.2, cy - s * 0.2, s * 0.35, '#fff');
  },
  gem(r, cx, cy, s, color) {
    const ctx = r.ctx; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.9, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.55, cy + s); ctx.lineTo(cx - s * 0.55, cy + s);
    ctx.lineTo(cx - s * 0.9, cy - s * 0.2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.9, cy - s * 0.2); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  },
  default(r, cx, cy, s, color) { r.fillCircle(cx, cy, s * 0.7, color); },
};

/**
 * Draw an icon by key. Uses registered art (`icon:<key>`) via the AssetManager
 * when present; otherwise falls back to the procedural glyph. This single seam
 * makes every icon in the game swappable for final PNG art with no caller
 * changes.
 */
export function drawObjectiveIcon(renderer, key, cx, cy, r, color) {
  AssetManager.drawIcon(renderer, key, cx, cy, r, color,
    (rr, x, y, s, c) => (ICONS[key] ?? ICONS.default)(rr, x, y, s, c));
}
