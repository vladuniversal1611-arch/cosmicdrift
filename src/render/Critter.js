/**
 * Critter.js
 * -----------------------------------------------------------------------------
 * The "cute friends" block skin: instead of a faceted gem, each colour renders
 * as its own little kawaii character (frog / cat / whale / chick / dino), in the
 * spirit of the Block Blast–style critter blocks. Pure drawing, no state.
 *
 * Every critter is a cell-filling rounded "head" (so completed lines still read
 * as a solid bar) tinted by the material's light/core/deep colours, plus a
 * distinguishing topper (ears, spout, beak, spikes) and a simple glossy face.
 * One place, so a colour looks identical in the tray, while dragging, and once
 * placed on the board.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';

// Which character each material colour becomes. Distinct silhouettes so the five
// colours stay instantly tellable apart even for colour-blind players.
export const CritterType = Object.freeze({
  emerald: 'frog',
  ruby: 'cat',
  sapphire: 'whale',
  amber: 'chick',
  amethyst: 'dino',
});

/**
 * @param {import('../core/Renderer.js').Renderer} renderer
 * @param {number} x Cell top-left (logical px).
 * @param {number} y
 * @param {number} size Cell size (logical px).
 * @param {object} material A Palette.materials entry (light/core/deep/spark).
 * @param {string} type One of CritterType's values.
 * @param {object} [opts] { scale=1, ignite=0, radius }
 */
export function drawCritter(renderer, x, y, size, material, type, opts = {}) {
  const { scale = 1, ignite = 0, radius = Config.board.cellRadius } = opts;
  const ctx = renderer.ctx;

  const s = size * scale;
  const px = x + (size - s) * 0.5;
  const py = y + (size - s) * 0.5;
  const r = Math.max(2, radius * scale);
  const cx = px + s * 0.5;

  // Toppers that sit BEHIND the head (ears, spikes) draw first so the head hides
  // their base.
  if (type === 'cat') _catEars(renderer, px, py, s, material);
  else if (type === 'dino') _dinoSpikes(renderer, px, py, s, material);

  _head(renderer, px, py, s, r, material);

  // Face + per-type features.
  switch (type) {
    case 'frog': _frog(renderer, px, py, s, cx, material); break;
    case 'cat': _cat(renderer, px, py, s, cx, material); break;
    case 'whale': _whale(renderer, px, py, s, cx, material); break;
    case 'chick': _chick(renderer, px, py, s, cx, material); break;
    default: _dino(renderer, px, py, s, cx, material); break;
  }

  // Ignite overlay (clear dissolve) — flash the whole cell white.
  if (ignite > 0) {
    ctx.globalAlpha = Math.min(1, ignite);
    renderer.fillRoundRect(px, py, s, s, r, '#ffffff');
    ctx.globalAlpha = 1;
  }
}

// --- Shared parts ------------------------------------------------------------

/** The glossy, cell-filling rounded head with rim + top shine + bottom shade. */
function _head(renderer, px, py, s, r, mat) {
  const ctx = renderer.ctx;
  const body = renderer.linearGradient(px, py, px, py + s, [[0, mat.light], [0.5, mat.core], [1, mat.deep]]);
  renderer.fillRoundRect(px, py, s, s, r, body);

  ctx.save();
  renderer.roundRectPath(px, py, s, s, r);
  ctx.clip();
  // Top gloss dome.
  const gloss = renderer.linearGradient(px, py, px, py + s * 0.52, [[0, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
  renderer.fillRoundRect(px + s * 0.1, py + s * 0.06, s * 0.8, s * 0.44, r * 0.8, gloss);
  // Grounding shade at the very bottom for a puffed, 3D read.
  ctx.globalAlpha = 0.26;
  renderer.fillRoundRect(px + s * 0.12, py + s * 0.76, s * 0.76, s * 0.16, r * 0.6, mat.deep);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Bright inner bevel + thin dark outer edge.
  renderer.strokeRoundRect(px + s * 0.045, py + s * 0.045, s * 0.91, s * 0.91, r * 0.9, mat.light, Math.max(1.2, s * 0.045));
  ctx.globalAlpha = 0.4;
  renderer.strokeRoundRect(px + 0.5, py + 0.5, s - 1, s - 1, r, mat.deep, Math.max(1, s * 0.025));
  ctx.globalAlpha = 1;
}

/** A pair of shiny eyes centred on `ey`, `spread` cells apart, radius `er`. */
function _eyes(renderer, cx, ey, s, spread, er) {
  const ctx = renderer.ctx;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * spread * s;
    renderer.fillCircle(ex, ey, s * er, '#ffffff');
    renderer.fillCircle(ex, ey + s * er * 0.14, s * er * 0.6, '#2b2b3c');
    ctx.globalAlpha = 0.95;
    renderer.fillCircle(ex - s * er * 0.3, ey - s * er * 0.34, s * er * 0.26, '#ffffff');
    ctx.globalAlpha = 1;
  }
}

/** Two soft blush cheeks. */
function _cheeks(renderer, cx, cy, s, spread) {
  const ctx = renderer.ctx;
  ctx.globalAlpha = 0.5;
  for (const dir of [-1, 1]) renderer.fillCircle(cx + dir * spread * s, cy, s * 0.08, '#ff8fb0');
  ctx.globalAlpha = 1;
}

/** A small smile arc. */
function _smile(renderer, cx, cy, s, w, deep) {
  const ctx = renderer.ctx;
  ctx.strokeStyle = deep;
  ctx.lineWidth = Math.max(1.4, s * 0.035);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - s * w * 0.5, s * w, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

// --- Characters --------------------------------------------------------------

function _frog(renderer, px, py, s, cx, mat) {
  const ctx = renderer.ctx;
  // Two eye bumps straddling the top edge (the frog's signature).
  const by = py + s * 0.16, bx = s * 0.24, br = s * 0.17;
  for (const dir of [-1, 1]) {
    renderer.fillCircle(cx + dir * bx, by, br, mat.light);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = mat.deep; ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath(); ctx.arc(cx + dir * bx, by, br, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    renderer.fillCircle(cx + dir * bx, by, br * 0.62, '#ffffff');
    renderer.fillCircle(cx + dir * bx, by + br * 0.1, br * 0.34, '#2b2b3c');
    renderer.fillCircle(cx + dir * bx - br * 0.2, by - br * 0.22, br * 0.16, '#ffffff');
  }
  _cheeks(renderer, cx, py + s * 0.6, s, 0.32);
  // Wide happy mouth.
  _smile(renderer, cx, py + s * 0.62, s, 0.28, mat.deep);
}

function _catEars(renderer, px, py, s, mat) {
  const ctx = renderer.ctx;
  const cx = px + s * 0.5;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * s * 0.28;
    ctx.fillStyle = mat.core;
    ctx.beginPath();
    ctx.moveTo(ex - s * 0.14, py + s * 0.16);
    ctx.lineTo(ex + s * 0.14, py + s * 0.16);
    ctx.lineTo(ex, py - s * 0.06);
    ctx.closePath();
    ctx.fill();
  }
}

function _cat(renderer, px, py, s, cx, mat) {
  const ctx = renderer.ctx;
  // Inner ears (pink), sitting on the head over the topper triangles.
  for (const dir of [-1, 1]) {
    const ex = cx + dir * s * 0.28;
    ctx.fillStyle = '#ff9ec4';
    ctx.beginPath();
    ctx.moveTo(ex - s * 0.07, py + s * 0.13);
    ctx.lineTo(ex + s * 0.07, py + s * 0.13);
    ctx.lineTo(ex, py + s * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  _eyes(renderer, cx, py + s * 0.5, s, 0.19, 0.1);
  _cheeks(renderer, cx, py + s * 0.62, s, 0.32);
  // Tiny nose + whiskers.
  renderer.fillCircle(cx, py + s * 0.62, s * 0.035, mat.deep);
  ctx.strokeStyle = mat.deep; ctx.lineWidth = Math.max(1, s * 0.02); ctx.lineCap = 'round';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * s * 0.1, py + s * 0.62);
    ctx.lineTo(cx + dir * s * 0.26, py + s * 0.58);
    ctx.moveTo(cx + dir * s * 0.1, py + s * 0.65);
    ctx.lineTo(cx + dir * s * 0.26, py + s * 0.66);
    ctx.stroke();
  }
}

function _whale(renderer, px, py, s, cx, mat) {
  const ctx = renderer.ctx;
  // Spout: a little fountain of droplets at the top.
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 3; i++) {
    const a = (i - 1) * 0.5;
    renderer.fillCircle(cx + a * s * 0.16, py + s * 0.12 - Math.abs(a) * s * 0.02, s * 0.035, '#eaf7ff');
  }
  ctx.globalAlpha = 1;
  _eyes(renderer, cx, py + s * 0.46, s, 0.18, 0.1);
  _cheeks(renderer, cx, py + s * 0.6, s, 0.3);
  _smile(renderer, cx, py + s * 0.6, s, 0.22, mat.deep);
  // Light belly patch.
  ctx.globalAlpha = 0.5;
  renderer.fillRoundRect(px + s * 0.28, py + s * 0.66, s * 0.44, s * 0.2, s * 0.1, mat.light);
  ctx.globalAlpha = 1;
}

function _chick(renderer, px, py, s, cx, mat) {
  const ctx = renderer.ctx;
  // Tiny top tuft.
  ctx.strokeStyle = mat.deep; ctx.lineWidth = Math.max(1.4, s * 0.03); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, py + s * 0.12); ctx.lineTo(cx, py + s * 0.02); ctx.stroke();
  renderer.fillCircle(cx, py + s * 0.02, s * 0.03, mat.deep);
  _eyes(renderer, cx, py + s * 0.44, s, 0.17, 0.1);
  // Orange diamond beak.
  ctx.fillStyle = '#ff9d2e';
  ctx.beginPath();
  ctx.moveTo(cx, py + s * 0.54);
  ctx.lineTo(cx + s * 0.09, py + s * 0.6);
  ctx.lineTo(cx, py + s * 0.66);
  ctx.lineTo(cx - s * 0.09, py + s * 0.6);
  ctx.closePath(); ctx.fill();
  _cheeks(renderer, cx, py + s * 0.6, s, 0.32);
}

function _dinoSpikes(renderer, px, py, s, mat) {
  const ctx = renderer.ctx;
  ctx.fillStyle = mat.light;
  for (let i = 0; i < 3; i++) {
    const sx = px + s * (0.3 + i * 0.2);
    ctx.beginPath();
    ctx.moveTo(sx - s * 0.06, py + s * 0.12);
    ctx.lineTo(sx + s * 0.06, py + s * 0.12);
    ctx.lineTo(sx, py - s * 0.02);
    ctx.closePath();
    ctx.fill();
  }
}

function _dino(renderer, px, py, s, cx, mat) {
  const ctx = renderer.ctx;
  _eyes(renderer, cx, py + s * 0.46, s, 0.18, 0.1);
  _cheeks(renderer, cx, py + s * 0.62, s, 0.32);
  // Small round snout with two nostrils + a smile.
  ctx.globalAlpha = 0.45;
  renderer.fillRoundRect(px + s * 0.32, py + s * 0.58, s * 0.36, s * 0.2, s * 0.1, mat.light);
  ctx.globalAlpha = 1;
  for (const dir of [-1, 1]) renderer.fillCircle(cx + dir * s * 0.08, py + s * 0.64, s * 0.025, mat.deep);
  _smile(renderer, cx, py + s * 0.72, s, 0.16, mat.deep);
}
