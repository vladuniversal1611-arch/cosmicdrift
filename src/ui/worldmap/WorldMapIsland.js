/**
 * WorldMapIsland.js
 * -----------------------------------------------------------------------------
 * Draws one handcrafted floating island: a unique irregular silhouette (from the
 * model's per-island shape), a cliff/keel underside with ambient occlusion, a
 * grass overhang lip, a rim-light highlight, hanging vines, tumbling waterfalls
 * and orbiting floating stones — then a dense, depth-sorted scatter of themed
 * decor (trees, pines, bushes, flowers, crystals, rocks, pillars/ruins, mushrooms,
 * grass tufts, ponds, fences, glowing plants, sparkles) plus the animated pieces
 * (campfire, windmill, fountain, sleeping dragon). All palettes come from the
 * island theme; nothing is a flat fill — every shape gets shading + a highlight.
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../home/Motion.js';

export class WorldMapIsland {
  constructor() { this._t = 0; }
  update(dt) { this._t += dt; }

  _ellipse(r, x, y, rx, ry, c) { const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }

  /** Trace the irregular rim into the current path (does not fill). */
  _rimPath(ctx, cx, cy, rx, ry, shape) {
    const n = shape.length;
    for (let k = 0; k <= n; k++) {
      const a = (k % n) / n * Math.PI * 2, rr = shape[k % n];
      const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  platform(r, isl, screenY) {
    const th = isl.theme, cx = isl.cx, cy = screenY, rx = isl.rx, ry = isl.ry, ctx = r.ctx, shape = isl.shape;
    const bob = Motion.float(this._t, 6, 6, isl.index);
    ctx.save(); ctx.translate(0, bob);

    // Soft ground shadow far below.
    r.setAlpha(0.12); this._ellipse(r, cx, cy + ry * 1.5, rx * 0.62, ry * 0.14, '#0a2a1a'); r.setAlpha(1);

    // Floating satellite stones (behind the island).
    for (const s of isl.stones) if (s.y > isl.cy) this._floatStone(r, s, cy - isl.cy);

    // Cliff / keel underside: reuse the lower rim, taper to a point.
    ctx.beginPath();
    const n = shape.length;
    for (let k = 0; k <= n; k++) {
      const idx = k % n, a = idx / n * Math.PI * 2, rr = shape[idx];
      const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
      if (a > 0 && a < Math.PI) continue;      // skip the top half
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.quadraticCurveTo(cx + rx * 0.2, cy + ry * 1.2, cx, cy + ry * 1.35);
    ctx.quadraticCurveTo(cx - rx * 0.2, cy + ry * 1.2, cx - rx * 0.9, cy);
    ctx.closePath();
    ctx.fillStyle = r.linearGradient(cx, cy, cx, cy + ry * 1.35, [[0, th.ground[0]], [1, th.ground[1]]]);
    ctx.fill();
    // Cliff striations for depth.
    r.setAlpha(0.18); ctx.strokeStyle = '#000';
    for (const fy of [0.35, 0.6, 0.85]) { ctx.beginPath(); ctx.moveTo(cx - rx * 0.6, cy + ry * fy); ctx.quadraticCurveTo(cx, cy + ry * (fy + 0.12), cx + rx * 0.6, cy + ry * fy); ctx.lineWidth = 3; ctx.stroke(); }
    r.setAlpha(1);
    // Hanging vines + roots from the underside rim.
    this._vines(r, cx, cy, rx, ry, isl.index);

    // Grass overhang lip (slightly larger, darker green behind the cap).
    ctx.beginPath(); this._rimPath(ctx, cx, cy + 6, rx * 1.03, ry * 1.03, shape);
    ctx.fillStyle = this._shade(th.grass[1], -0.16); ctx.fill();

    // Grass cap (irregular) with vertical gradient.
    ctx.beginPath(); this._rimPath(ctx, cx, cy, rx, ry, shape);
    ctx.fillStyle = r.linearGradient(cx, cy - ry, cx, cy + ry, [[0, th.grass[0]], [1, th.grass[1]]]);
    ctx.fill();
    // Ambient occlusion: darken toward the rim.
    ctx.save(); ctx.clip();
    const ao = r.radialGradient(cx, cy - ry * 0.1, rx * 1.05, [[0, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,40,10,0.28)']]);
    r.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4, ao);
    // Sunlit highlight patch, upper-centre.
    r.setAlpha(0.4); this._ellipse(r, cx - rx * 0.08, cy - ry * 0.28, rx * 0.62, ry * 0.42, '#ffffff'); r.setAlpha(1);
    ctx.restore();

    // Rim light: a bright thin arc along the top-left edge.
    ctx.beginPath();
    for (let k = 0; k <= n; k++) { const idx = k % n, a = idx / n * Math.PI * 2, rr = shape[idx]; if (a < Math.PI * 0.9 || a > Math.PI * 1.75) continue; const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr; k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.stroke();

    // Waterfalls off two rim points.
    r.setAlpha(0.5);
    for (const dx of [-0.5, 0.42]) r.fillRoundRect(cx + rx * dx - 5, cy + ry * 0.5, 9, ry * 0.6, 5, '#bfeaff');
    r.setAlpha(1);

    // Front floating stones.
    for (const s of isl.stones) if (s.y <= isl.cy) this._floatStone(r, s, cy - isl.cy);
    ctx.restore();
  }

  _floatStone(r, s, off) {
    const bob = Motion.float(this._t, 5, 4, s.ph);
    const x = s.x, y = s.y + off + bob, w = 26 * s.sc, ctx = r.ctx;
    r.setAlpha(0.12); this._ellipse(r, x, y + w * 0.5, w * 0.6, w * 0.18, '#0a2a1a'); r.setAlpha(1);
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, y); ctx.lineTo(x - w * 0.3, y - w * 0.5); ctx.lineTo(x + w * 0.3, y - w * 0.45); ctx.lineTo(x + w * 0.5, y);
    ctx.quadraticCurveTo(x, y + w * 0.7, x - w * 0.5, y); ctx.closePath();
    ctx.fillStyle = r.linearGradient(x, y - w * 0.5, x, y + w * 0.5, [[0, '#a99b7e'], [1, '#6a5638']]); ctx.fill();
    r.setAlpha(0.5); this._ellipse(r, x, y - w * 0.35, w * 0.4, w * 0.14, '#8fe06a'); r.setAlpha(1);
  }

  _vines(r, cx, cy, rx, ry, seed) {
    const ctx = r.ctx; ctx.strokeStyle = 'rgba(60,140,60,0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const dx = (-0.6 + i * 0.4) * rx, x = cx + dx, y0 = cy + ry * 0.35;
      const len = ry * (0.5 + ((seed + i) % 3) * 0.25);
      const sway = Motion.slide(this._t, 6, 3 + i, seed + i);
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway, y0 + len * 0.5, x + sway * 1.4, y0 + len); ctx.stroke();
      r.fillCircle(x + sway * 1.4, y0 + len, 4, '#8fd66a');
    }
  }

  _shade(hex, amt) {
    const h = (c) => parseInt(c, 16);
    let r = h(hex.slice(1, 3)), g = h(hex.slice(3, 5)), b = h(hex.slice(5, 7));
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
    const to = (v) => f(v).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
  }

  // --- Decor -----------------------------------------------------------------
  decor(r, d, screenY) {
    const x = d.x, y = screenY, sc = d.sc;
    switch (d.kind) {
      case 'tree': return this._tree(r, x, y, sc);
      case 'pine': return this._pine(r, x, y, sc);
      case 'bush': return this._bush(r, x, y, sc);
      case 'flower': return this._flower(r, x, y, sc, d.seed);
      case 'rock': return this._rock(r, x, y, sc);
      case 'snowrock': return this._rock(r, x, y, sc, true);
      case 'crystal': return this._crystal(r, x, y, sc);
      case 'pillar': return this._ruin(r, x, y, sc, d.seed);
      case 'cloudpuff': return this._cloud(r, x, y, sc);
      case 'campfire': return this._campfire(r, x, y, sc);
      case 'windmill': return this._windmill(r, x, y, sc);
      case 'fountain': return this._fountain(r, x, y, sc);
      case 'sleepingdragon': return this._dragon(r, x, y, sc);
      case 'mushroom': return this._mushroom(r, x, y, sc, d.seed);
      case 'grasspatch': return this._grass(r, x, y, sc, d.seed);
      case 'sparkle': return this._sparkleDecor(r, x, y, sc, d.seed);
      case 'glowplant': return this._glowplant(r, x, y, sc, d.seed);
      case 'pond': return this._pond(r, x, y, sc);
      case 'fence': return this._fence(r, x, y, sc);
    }
  }

  _sh(r, x, y, w, h) { r.setAlpha(0.14); this._ellipse(r, x, y + 3, w, h, '#0a2a1a'); r.setAlpha(1); }

  _tree(r, x, y, sc) {
    this._sh(r, x, y, 30 * sc, 10 * sc);
    const sway = Motion.slide(this._t, 2, 2.5, x);
    r.fillRoundRect(x - 6 * sc, y - 30 * sc, 12 * sc, 30 * sc, 4 * sc, '#7a4a24');
    const rr = 28 * sc, ccx = x + sway, ccy = y - 30 * sc;
    r.fillCircle(ccx, ccy - rr * 0.5, rr, '#2f8a3f');
    r.fillCircle(ccx - rr * 0.7, ccy, rr * 0.8, '#3fa04a');
    r.fillCircle(ccx + rr * 0.7, ccy, rr * 0.8, '#48b657');
    r.setAlpha(0.5); r.fillCircle(ccx - rr * 0.3, ccy - rr * 0.8, rr * 0.42, '#c8f2a4'); r.setAlpha(1);
  }
  _pine(r, x, y, sc) {
    this._sh(r, x, y, 24 * sc, 8 * sc);
    r.fillRoundRect(x - 5 * sc, y - 16 * sc, 10 * sc, 16 * sc, 2 * sc, '#6a4526');
    const ctx = r.ctx;
    [[46, 30], [34, 24], [22, 18]].forEach(([hh, hw], i) => {
      const by = y - 12 * sc - i * 14 * sc;
      ctx.beginPath(); ctx.moveTo(x, by - hh * sc); ctx.lineTo(x - hw * sc, by); ctx.lineTo(x + hw * sc, by); ctx.closePath();
      ctx.fillStyle = ['#2f7a4a', '#37904f', '#41a55a'][i]; ctx.fill();
    });
    r.setAlpha(0.9); r.fillCircle(x, y - 12 * sc - 2 * 14 * sc - 40 * sc, 4 * sc, '#fff'); r.setAlpha(1);
  }
  _bush(r, x, y, sc) {
    this._sh(r, x, y, 24 * sc, 8 * sc);
    const rr = 16 * sc;
    r.fillCircle(x - rr * 0.8, y, rr, '#3fa94f'); r.fillCircle(x + rr * 0.8, y, rr, '#3fa94f');
    r.fillCircle(x, y - rr * 0.4, rr * 1.15, '#4cba5b');
    r.setAlpha(0.4); r.fillCircle(x - rr * 0.2, y - rr * 0.7, rr * 0.4, '#c8f2a4'); r.setAlpha(1);
  }
  _flower(r, x, y, sc, seed) {
    const cols = ['#ff8fb0', '#ffd34e', '#a48bff', '#ff9d5c', '#fff'];
    const col = cols[(seed | 0) % cols.length];
    const sway = Motion.rotate(this._t, 0.14, 2.2, seed);
    const ctx = r.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14 * sc); ctx.stroke();
    for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; r.fillCircle(Math.cos(a) * 6 * sc, -14 * sc + Math.sin(a) * 6 * sc, 4.5 * sc, col); }
    r.fillCircle(0, -14 * sc, 4 * sc, '#ffe27a'); ctx.restore();
  }
  _rock(r, x, y, sc, snow) {
    this._sh(r, x, y, 18 * sc, 6 * sc);
    const w = 30 * sc, h = 20 * sc, ctx = r.ctx;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.3, y - h, x, y - h); ctx.quadraticCurveTo(x + w * 0.4, y - h, x + w / 2, y); ctx.closePath();
    ctx.fillStyle = r.linearGradient(x, y - h, x, y, [[0, '#c3ccd6'], [1, '#828e9b']]); ctx.fill();
    r.setAlpha(0.5); this._ellipse(r, x - w * 0.14, y - h * 0.55, w * 0.16, h * 0.16, '#eef2f6'); r.setAlpha(1);
    if (snow) { r.setAlpha(0.95); this._ellipse(r, x, y - h * 0.8, w * 0.4, h * 0.28, '#fff'); r.setAlpha(1); }
  }
  _crystal(r, x, y, sc) {
    this._sh(r, x, y, 14 * sc, 5 * sc);
    const h = 40 * sc, w = h * 0.42, ctx = r.ctx;
    const glow = Motion.pulse(this._t, 2, x);
    r.withGlow('#7fdcff', 8 + glow * 10, () => {
      ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y - h * 0.45); ctx.lineTo(x + w * 0.3, y); ctx.lineTo(x - w * 0.3, y); ctx.lineTo(x - w / 2, y - h * 0.45); ctx.closePath();
      ctx.fillStyle = r.linearGradient(x, y - h, x, y, [[0, '#eafaff'], [1, '#39b9e6']]); ctx.fill();
    });
    r.setAlpha(0.7); ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w * 0.16, y - h * 0.5); ctx.lineTo(x - w * 0.02, y - h * 0.2); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); r.setAlpha(1);
  }
  _ruin(r, x, y, sc, seed) {
    this._sh(r, x, y, 22 * sc, 7 * sc);
    const h = (54 + (seed % 3) * 18) * sc, ctx = r.ctx;
    ctx.fillStyle = r.linearGradient(x, y - h, x, y, [[0, '#e8dfc8'], [1, '#a99b7e']]);
    r.fillRoundRect(x - 11 * sc, y - h, 22 * sc, h, 3 * sc, ctx.fillStyle);
    r.fillRoundRect(x - 15 * sc, y - h - 9 * sc, 30 * sc, 11 * sc, 3 * sc, '#c3b79a');
    r.setAlpha(0.4); r.fillRoundRect(x - 11 * sc, y - h, 6 * sc, h, 3 * sc, '#fff'); r.setAlpha(1);
    r.setAlpha(0.5); this._ellipse(r, x, y - h * 0.4, 6 * sc, 3 * sc, '#3fa04a'); r.setAlpha(1); // moss
  }
  _cloud(r, x, y, sc) {
    const rr = 24 * sc; r.setAlpha(0.92);
    r.fillCircle(x, y, rr, '#fff'); r.fillCircle(x + rr * 0.8, y + rr * 0.1, rr * 0.7, '#fff'); r.fillCircle(x - rr * 0.8, y + rr * 0.15, rr * 0.6, '#fff'); r.setAlpha(1);
  }
  _campfire(r, x, y, sc) {
    this._sh(r, x, y, 18 * sc, 6 * sc);
    r.fillRoundRect(x - 16 * sc, y - 4 * sc, 32 * sc, 6 * sc, 3 * sc, '#7a4a24');
    const flick = 0.7 + Motion.pulse(this._t, 0.35, x) * 0.5, ctx = r.ctx;
    r.withGlow('#ff9d2e', 14 * flick, () => {
      ctx.beginPath(); ctx.moveTo(x, y - 34 * sc * flick); ctx.quadraticCurveTo(x - 14 * sc, y - 8 * sc, x - 8 * sc, y - 2 * sc);
      ctx.lineTo(x + 8 * sc, y - 2 * sc); ctx.quadraticCurveTo(x + 14 * sc, y - 8 * sc, x, y - 34 * sc * flick); ctx.closePath();
      ctx.fillStyle = r.linearGradient(x, y - 34 * sc, x, y, [[0, '#ffe27a'], [1, '#ff6a3d']]); ctx.fill();
    });
  }
  _windmill(r, x, y, sc) {
    this._sh(r, x, y, 16 * sc, 6 * sc);
    const h = 60 * sc, ctx = r.ctx;
    r.fillRoundRect(x - 8 * sc, y - h, 16 * sc, h, 4 * sc, '#d8cdb4');
    const cx = x, cy = y - h, rot = this._t * 1.3;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6 * sc, -34 * sc); ctx.lineTo(-6 * sc, -30 * sc); ctx.closePath(); ctx.fill(); }
    ctx.restore(); r.fillCircle(cx, cy, 5 * sc, '#b0895a');
  }
  _fountain(r, x, y, sc) {
    this._sh(r, x, y, 24 * sc, 7 * sc);
    r.fillRoundRect(x - 22 * sc, y - 8 * sc, 44 * sc, 12 * sc, 6 * sc, '#b8c8e0');
    this._ellipse(r, x, y - 6 * sc, 18 * sc, 5 * sc, '#8fd6ff');
    const j = Motion.pulse(this._t, 0.6, x); r.setAlpha(0.7);
    for (const dx of [-1, 0, 1]) r.fillCircle(x + dx * 8 * sc, y - (18 + j * 8) * sc, 3 * sc, '#eafcff'); r.setAlpha(1);
  }
  _dragon(r, x, y, sc) {
    this._sh(r, x, y, 34 * sc, 9 * sc);
    const breathe = Motion.scale(this._t, 0.04, 3, x), ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(breathe, breathe);
    this._ellipse(r, 0, 0, 34 * sc, 18 * sc, '#8a6cc0');
    r.fillCircle(-30 * sc, -6 * sc, 14 * sc, '#9a7ad0');
    r.setAlpha(0.6); r.fillCircle(-34 * sc, -10 * sc, 4 * sc, '#fff'); r.setAlpha(1);
    r.text('z', 24 * sc, -24 * sc + Motion.float(this._t, 4, 2), { font: `900 ${14 * sc}px system-ui`, color: 'rgba(255,255,255,0.8)', align: 'center', baseline: 'middle' });
    ctx.restore();
  }
  _mushroom(r, x, y, sc, seed) {
    this._sh(r, x, y, 12 * sc, 4 * sc);
    r.fillRoundRect(x - 4 * sc, y - 14 * sc, 8 * sc, 14 * sc, 3 * sc, '#f0e6d0');
    const col = (seed % 2) ? '#ff5c6a' : '#ff9d2e';
    const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y - 14 * sc, 14 * sc, 10 * sc, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    r.fillCircle(x - 5 * sc, y - 16 * sc, 2.5 * sc, '#fff'); r.fillCircle(x + 4 * sc, y - 14 * sc, 2 * sc, '#fff');
  }
  _grass(r, x, y, sc, seed) {
    const ctx = r.ctx; ctx.strokeStyle = '#4fb04a'; ctx.lineWidth = 3 * sc; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const sway = Motion.slide(this._t, 3, 2.2, seed + i);
      ctx.beginPath(); ctx.moveTo(x + i * 5 * sc, y); ctx.quadraticCurveTo(x + i * 5 * sc + sway, y - 12 * sc, x + i * 5 * sc + sway * 1.6, y - 20 * sc); ctx.stroke();
    }
  }
  _sparkleDecor(r, x, y, sc, seed) {
    const tw = Motion.pulse(this._t, 1.5, seed);
    r.setAlpha(0.4 + 0.6 * tw); r.withGlow('#fff6c8', 8, () => r.sparkle(x, y, (5 + tw * 4) * sc, '#fff8dc')); r.setAlpha(1);
  }
  _glowplant(r, x, y, sc, seed) {
    this._sh(r, x, y, 12 * sc, 4 * sc);
    const glow = Motion.pulse(this._t, 2, seed), ctx = r.ctx;
    ctx.strokeStyle = '#3fa06a'; ctx.lineWidth = 3 * sc;
    for (const dx of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * 8 * sc, y - 16 * sc, x + dx * 12 * sc, y - 26 * sc); ctx.stroke(); r.withGlow('#8fffe0', 8 + glow * 8, () => r.fillCircle(x + dx * 12 * sc, y - 26 * sc, 5 * sc, '#c9fff0')); }
  }
  _pond(r, x, y, sc) {
    const w = 54 * sc, h = 26 * sc;
    this._ellipse(r, x, y, w * 0.55, h * 0.55, '#3aa06a');
    this._ellipse(r, x, y, w * 0.48, h * 0.46, r.linearGradient(x, y - h * 0.4, x, y + h * 0.4, [[0, '#8fe0ff'], [1, '#3f9fd6']]));
    const sh = Motion.slide(this._t, w * 0.1, 3, x);
    r.setAlpha(0.6); this._ellipse(r, x - w * 0.1 + sh, y - h * 0.12, w * 0.16, h * 0.1, '#eafcff'); r.setAlpha(1);
  }
  _fence(r, x, y, sc) {
    const ctx = r.ctx; ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 4 * sc; ctx.lineCap = 'round';
    for (const dx of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(x + dx * sc, y); ctx.lineTo(x + dx * sc, y - 20 * sc); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 18 * sc, y - 14 * sc); ctx.lineTo(x + 18 * sc, y - 14 * sc); ctx.moveTo(x - 18 * sc, y - 6 * sc); ctx.lineTo(x + 18 * sc, y - 6 * sc); ctx.stroke();
  }
}
