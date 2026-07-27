/**
 * WorldMapIsland.js
 * -----------------------------------------------------------------------------
 * Draws one themed floating island: its grass cap + rocky underside + rim
 * waterfalls, then its scattered decor. Decor kinds cover the spec's living
 * world — trees, pines, bushes, flowers, crystals, rocks, pillars, snow rocks,
 * cloud puffs — plus animated pieces (campfire flicker, windmill spin, fountain
 * shimmer, a sleeping dragon that breathes). Everything reads its palette from
 * the island theme so no colours are hard-coded per island.
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../home/Motion.js';

export class WorldMapIsland {
  constructor() { this._t = 0; }
  update(dt) { this._t += dt; }

  _ellipse(r, x, y, rx, ry, c) { const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }

  /** Draw the island platform in screen space (world y already offset). */
  platform(r, isl, screenY) {
    const th = isl.theme, cx = isl.cx, cy = screenY, rx = isl.rx, ry = isl.ry, ctx = r.ctx;
    const bob = Motion.float(this._t, 6, 6, isl.index);
    ctx.save(); ctx.translate(0, bob);
    // Shadow.
    r.setAlpha(0.12); this._ellipse(r, cx, cy + ry * 1.3, rx * 0.7, ry * 0.16, '#0a2a1a'); r.setAlpha(1);
    // Rocky underside — a compact tapering keel so islands read as discrete
    // floating chunks with sky between them (not one long column).
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.94, cy);
    ctx.quadraticCurveTo(cx - rx * 0.28, cy + ry * 1.15, cx, cy + ry * 1.25);
    ctx.quadraticCurveTo(cx + rx * 0.28, cy + ry * 1.15, cx + rx * 0.94, cy);
    ctx.closePath();
    ctx.fillStyle = r.linearGradient(cx, cy, cx, cy + ry * 1.25, [[0, th.ground[0]], [1, th.ground[1]]]);
    ctx.fill();
    // Grass/surface cap.
    this._ellipse(r, cx, cy, rx, ry, r.linearGradient(cx, cy - ry, cx, cy + ry, [[0, th.grass[0]], [1, th.grass[1]]]));
    r.setAlpha(0.45); this._ellipse(r, cx, cy - ry * 0.25, rx * 0.82, ry * 0.5, '#ffffff'); r.setAlpha(1);
    // Rim waterfalls tumbling off the keel.
    r.setAlpha(0.5);
    for (const dx of [-0.55, 0.5]) r.fillRoundRect(cx + rx * dx - 5, cy + ry * 0.35, 9, ry * 0.7, 5, '#bfeaff');
    r.setAlpha(1);
    ctx.restore();
  }

  /** Draw one decor item (screen space). */
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
      case 'pillar': return this._pillar(r, x, y, sc);
      case 'cloudpuff': return this._cloud(r, x, y, sc);
      case 'campfire': return this._campfire(r, x, y, sc);
      case 'windmill': return this._windmill(r, x, y, sc);
      case 'fountain': return this._fountain(r, x, y, sc);
      case 'sleepingdragon': return this._dragon(r, x, y, sc);
    }
  }

  _tree(r, x, y, sc) {
    const sway = Motion.slide(this._t, 2, 2.5, x);
    r.fillRoundRect(x - 6 * sc, y - 30 * sc, 12 * sc, 30 * sc, 4 * sc, '#7a4a24');
    const rr = 28 * sc, cx = x + sway, cy = y - 30 * sc;
    r.fillCircle(cx, cy - rr * 0.5, rr, '#3aa04a');
    r.fillCircle(cx - rr * 0.7, cy, rr * 0.8, '#48b657');
    r.fillCircle(cx + rr * 0.7, cy, rr * 0.8, '#48b657');
    r.setAlpha(0.5); r.fillCircle(cx - rr * 0.3, cy - rr * 0.8, rr * 0.4, '#c8f2a4'); r.setAlpha(1);
  }
  _pine(r, x, y, sc) {
    r.fillRoundRect(x - 5 * sc, y - 16 * sc, 10 * sc, 16 * sc, 2 * sc, '#6a4526');
    const ctx = r.ctx;
    [[46, 30], [34, 24], [22, 18]].forEach(([hh, hw], i) => {
      const by = y - 12 * sc - i * 14 * sc;
      ctx.beginPath(); ctx.moveTo(x, by - hh * sc); ctx.lineTo(x - hw * sc, by); ctx.lineTo(x + hw * sc, by); ctx.closePath();
      ctx.fillStyle = ['#2f7a4a', '#37904f', '#41a55a'][i]; ctx.fill();
    });
    r.setAlpha(0.85); r.fillCircle(x, y - 12 * sc - 2 * 14 * sc - 40 * sc, 4 * sc, '#fff'); r.setAlpha(1);
  }
  _bush(r, x, y, sc) {
    const rr = 16 * sc;
    r.fillCircle(x - rr * 0.8, y, rr, '#3fa94f'); r.fillCircle(x + rr * 0.8, y, rr, '#3fa94f');
    r.fillCircle(x, y - rr * 0.4, rr * 1.15, '#4cba5b');
  }
  _flower(r, x, y, sc, seed) {
    const cols = ['#ff8fb0', '#ffd34e', '#a48bff', '#ff9d5c', '#fff'];
    const col = cols[(seed | 0) % cols.length];
    const sway = Motion.rotate(this._t, 0.12, 2.2, seed);
    const ctx = r.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14 * sc); ctx.stroke();
    for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; r.fillCircle(Math.cos(a) * 6 * sc, -14 * sc + Math.sin(a) * 6 * sc, 4.5 * sc, col); }
    r.fillCircle(0, -14 * sc, 4 * sc, '#ffe27a'); ctx.restore();
  }
  _rock(r, x, y, sc, snow) {
    const w = 30 * sc, h = 20 * sc, ctx = r.ctx;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.3, y - h, x, y - h); ctx.quadraticCurveTo(x + w * 0.4, y - h, x + w / 2, y); ctx.closePath();
    ctx.fillStyle = r.linearGradient(x, y - h, x, y, [[0, '#c3ccd6'], [1, '#828e9b']]); ctx.fill();
    if (snow) { r.setAlpha(0.95); this._ellipse(r, x, y - h * 0.8, w * 0.4, h * 0.28, '#fff'); r.setAlpha(1); }
  }
  _crystal(r, x, y, sc) {
    const h = 40 * sc, w = h * 0.42, ctx = r.ctx;
    const glow = Motion.pulse(this._t, 2, x);
    r.withGlow('#7fdcff', 8 + glow * 8, () => {
      ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y - h * 0.45); ctx.lineTo(x + w * 0.3, y); ctx.lineTo(x - w * 0.3, y); ctx.lineTo(x - w / 2, y - h * 0.45); ctx.closePath();
      ctx.fillStyle = r.linearGradient(x, y - h, x, y, [[0, '#eafaff'], [1, '#39b9e6']]); ctx.fill();
    });
  }
  _pillar(r, x, y, sc) {
    const h = 60 * sc;
    r.fillRoundRect(x - 10 * sc, y - h, 20 * sc, h, 3 * sc, r.linearGradient(x, y - h, x, y, [[0, '#e8dfc8'], [1, '#b0a487']]));
    r.fillRoundRect(x - 14 * sc, y - h - 8 * sc, 28 * sc, 10 * sc, 3 * sc, '#c3b79a');
    r.setAlpha(0.4); r.fillRoundRect(x - 10 * sc, y - h, 6 * sc, h, 3 * sc, '#fff'); r.setAlpha(1);
  }
  _cloud(r, x, y, sc) {
    const rr = 24 * sc; r.setAlpha(0.9);
    r.fillCircle(x, y, rr, '#fff'); r.fillCircle(x + rr * 0.8, y + rr * 0.1, rr * 0.7, '#fff'); r.fillCircle(x - rr * 0.8, y + rr * 0.15, rr * 0.6, '#fff'); r.setAlpha(1);
  }
  _campfire(r, x, y, sc) {
    r.fillRoundRect(x - 16 * sc, y - 4 * sc, 32 * sc, 6 * sc, 3 * sc, '#7a4a24');
    const flick = 0.7 + Motion.pulse(this._t, 0.35, x) * 0.5;
    const ctx = r.ctx;
    r.withGlow('#ff9d2e', 14 * flick, () => {
      ctx.beginPath(); ctx.moveTo(x, y - 34 * sc * flick); ctx.quadraticCurveTo(x - 14 * sc, y - 8 * sc, x - 8 * sc, y - 2 * sc);
      ctx.lineTo(x + 8 * sc, y - 2 * sc); ctx.quadraticCurveTo(x + 14 * sc, y - 8 * sc, x, y - 34 * sc * flick); ctx.closePath();
      ctx.fillStyle = r.linearGradient(x, y - 34 * sc, x, y, [[0, '#ffe27a'], [1, '#ff6a3d']]); ctx.fill();
    });
  }
  _windmill(r, x, y, sc) {
    const h = 60 * sc, ctx = r.ctx;
    r.fillRoundRect(x - 8 * sc, y - h, 16 * sc, h, 4 * sc, '#d8cdb4');
    const cx = x, cy = y - h, rot = this._t * 1.3;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6 * sc, -34 * sc); ctx.lineTo(-6 * sc, -30 * sc); ctx.closePath(); ctx.fill(); }
    ctx.restore(); r.fillCircle(cx, cy, 5 * sc, '#b0895a');
  }
  _fountain(r, x, y, sc) {
    r.fillRoundRect(x - 22 * sc, y - 8 * sc, 44 * sc, 12 * sc, 6 * sc, '#b8c8e0');
    this._ellipse(r, x, y - 6 * sc, 18 * sc, 5 * sc, '#8fd6ff');
    const j = Motion.pulse(this._t, 0.6, x);
    r.setAlpha(0.7);
    for (const dx of [-1, 0, 1]) r.fillCircle(x + dx * 8 * sc, y - (18 + j * 8) * sc, 3 * sc, '#eafcff');
    r.setAlpha(1);
  }
  _dragon(r, x, y, sc) {
    const breathe = Motion.scale(this._t, 0.04, 3, x);
    const ctx = r.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(breathe, breathe);
    this._ellipse(r, 0, 0, 34 * sc, 18 * sc, '#8a6cc0');
    r.fillCircle(-30 * sc, -6 * sc, 14 * sc, '#9a7ad0');
    r.setAlpha(0.6); r.fillCircle(-34 * sc, -10 * sc, 4 * sc, '#fff'); r.setAlpha(1);
    // "Zzz".
    r.text('z', 24 * sc, -24 * sc + Motion.float(this._t, 4, 2), { font: `900 ${14 * sc}px system-ui`, color: 'rgba(255,255,255,0.8)', align: 'center', baseline: 'middle' });
    ctx.restore();
  }
}
