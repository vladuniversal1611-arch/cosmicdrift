/**
 * BackgroundLayers.js
 * -----------------------------------------------------------------------------
 * The Home Screen's living world, drawn as five independently-moving layers so
 * it reads with real depth and can each be swapped for premium art later:
 *
 *   Layer 1  Sky        — vertical gradient + soft sun bloom (static-ish).
 *   Layer 2  Far islands— tiny distant floating isles, slowest parallax.
 *   Layer 3  Clouds     — drifting cloud banks, mid parallax.
 *   Layer 4  Main island— the hero floating island the UI sits on.
 *   Layer 5  Particles  — pooled pollen/light motes, fastest parallax.
 *
 * Each layer takes a parallax factor and reads a shared parallax offset (a slow
 * idle drift plus optional pointer influence), so they visibly separate in
 * depth. All Canvas-drawn, all culled, allocation-free after construction.
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../Motion.js';

export class BackgroundLayers {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this._t = 0;
    this._px = 0;   // parallax x (−1..1), eased toward target
    this._py = 0;
    this._tx = 0;
    this._ty = 0;

    // Layer 2 — far islands (seeded, static field).
    this._far = [];
    for (let i = 0; i < 5; i++) {
      this._far.push({
        x: this._rand(i, 1) * w,
        y: h * (0.16 + this._rand(i, 2) * 0.28),
        s: 0.4 + this._rand(i, 3) * 0.5,
      });
    }
    // Layer 3 — clouds.
    this._clouds = [];
    for (let i = 0; i < 6; i++) {
      this._clouds.push({
        x: this._rand(i, 11) * w,
        y: h * (0.1 + this._rand(i, 12) * 0.45),
        s: 0.7 + this._rand(i, 13) * 1.1,
        v: 6 + this._rand(i, 14) * 12,
      });
    }
    // Layer 5 — pooled light motes (fixed-size pool, recycled in place).
    this._motes = [];
    for (let i = 0; i < 26; i++) {
      this._motes.push({
        x: this._rand(i, 21) * w,
        y: this._rand(i, 22) * h,
        r: 2 + this._rand(i, 23) * 4,
        ph: this._rand(i, 24) * 6.283,
        vy: 6 + this._rand(i, 25) * 10,
      });
    }
  }

  _rand(i, s = 0) { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  /** Point the parallax at a normalized pointer position (−1..1). */
  setPointer(nx, ny) { this._tx = nx; this._ty = ny; }

  update(dt) {
    this._t += dt;
    // Idle drift + eased pointer follow keep the world gently alive.
    const idleX = Motion.slide(this._t, 0.25, 18);
    const idleY = Motion.float(this._t, 0.12, 22) / 0.12 * 0.12;
    this._px += ((this._tx * 0.5 + idleX) - this._px) * Math.min(1, dt * 2);
    this._py += ((this._ty * 0.3 + idleY) - this._py) * Math.min(1, dt * 2);

    for (const c of this._clouds) { c.x += c.v * dt; if (c.x - 200 > this.w) c.x = -200; }
    for (const m of this._motes) {
      m.y -= m.vy * dt;
      if (m.y < -10) { m.y = this.h + 10; m.x = this._rand(m.ph * 1000 | 0, 7) * this.w; }
    }
  }

  render(r) {
    this._sky(r);
    this._farIslands(r);
    this._cloudLayer(r);
    this._mainIsland(r);
    this._particles(r);
  }

  // --- Layer 1: Sky ---------------------------------------------------------
  _sky(r) {
    r.fillBackgroundGradient(['#5db4ff', '#96d4ff', '#dff2ff']);
    const sun = r.radialGradient(this.w * 0.5 + this._px * 30, this.h * 0.14, this.h * 0.42,
      [[0, 'rgba(255,255,255,0.55)'], [0.5, 'rgba(255,247,214,0.25)'], [1, 'rgba(255,255,255,0)']]);
    r.fillRect(0, 0, this.w, this.h, sun);
    // Soft light rays.
    r.setAlpha(0.06);
    const ctx = r.ctx;
    for (let i = 0; i < 5; i++) {
      const a = -0.5 + i * 0.24;
      ctx.save(); ctx.translate(this.w * 0.5, this.h * 0.12); ctx.rotate(a);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-40, 0, 80, this.h);
      ctx.restore();
    }
    r.setAlpha(1);
  }

  // --- Layer 2: Far islands (slowest parallax) ------------------------------
  _farIslands(r) {
    const ox = this._px * 12, oy = this._py * 8;
    r.setAlpha(0.55);
    for (const f of this._far) {
      const x = f.x + ox, y = f.y + oy, w = 120 * f.s;
      this._ellipse(r, x, y, w * 0.5, w * 0.16, '#bfe0c4');
      this._ellipse(r, x, y - w * 0.06, w * 0.42, w * 0.12, '#d8f0d8');
    }
    r.setAlpha(1);
  }

  // --- Layer 3: Clouds (mid parallax) ---------------------------------------
  _cloudLayer(r) {
    const ox = this._px * 26, oy = this._py * 14;
    for (const c of this._clouds) {
      r.setAlpha(c.s < 1.1 ? 0.6 : 0.9);
      const x = c.x + ox, y = c.y + oy, rr = 30 * c.s;
      r.fillCircle(x, y, rr, '#ffffff');
      r.fillCircle(x + rr * 0.95, y + rr * 0.15, rr * 0.8, '#ffffff');
      r.fillCircle(x - rr * 0.95, y + rr * 0.2, rr * 0.72, '#ffffff');
      r.fillCircle(x + rr * 0.2, y - rr * 0.42, rr * 0.72, '#ffffff');
    }
    r.setAlpha(1);
  }

  // --- Layer 4: Main hero island --------------------------------------------
  _mainIsland(r) {
    const ox = this._px * 40;
    const cx = this.w * 0.5 + ox;
    const topY = this.h * 0.62 + Motion.float(this._t, 8, 5);
    const rx = this.w * 0.6, ry = 130;
    const ctx = r.ctx;
    // Shadow.
    r.setAlpha(0.12); this._ellipse(r, cx, topY + ry * 1.2, rx * 0.8, ry * 0.4, '#0a2a1a'); r.setAlpha(1);
    // Rocky underside.
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY);
    ctx.quadraticCurveTo(cx - rx * 0.3, topY + ry * 3.2, cx, topY + ry * 3.6);
    ctx.quadraticCurveTo(cx + rx * 0.3, topY + ry * 3.2, cx + rx, topY);
    ctx.closePath();
    ctx.fillStyle = r.linearGradient(cx, topY, cx, topY + ry * 3.6, [[0, '#8a6a44'], [1, '#5a4026']]);
    ctx.fill();
    // Grass cap.
    this._ellipse(r, cx, topY, rx, ry, r.linearGradient(cx, topY - ry, cx, topY + ry, [[0, '#8fe06a'], [1, '#4faa46']]));
    r.setAlpha(0.5); this._ellipse(r, cx, topY - ry * 0.2, rx * 0.82, ry * 0.5, '#c4f59a'); r.setAlpha(1);
    // Little waterfalls off the rim.
    r.setAlpha(0.5);
    for (const dx of [-0.55, 0.5]) {
      const wx = cx + rx * dx;
      r.fillRoundRect(wx - 5, topY + ry * 0.5, 10, ry * 2.0, 5, '#bfeaff');
    }
    r.setAlpha(1);
  }

  // --- Layer 5: Particles (fastest parallax) --------------------------------
  _particles(r) {
    const ox = this._px * 60, oy = this._py * 40;
    for (const m of this._motes) {
      const tw = Motion.pulse(this._t, 1.4, m.ph);
      r.setAlpha(0.2 + 0.5 * tw);
      r.fillCircle(m.x + ox, m.y + oy, m.r, '#fff8d8');
    }
    r.setAlpha(1);
  }

  _ellipse(r, x, y, rx, ry, color) {
    const ctx = r.ctx;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
}
