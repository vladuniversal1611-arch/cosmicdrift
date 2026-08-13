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
import { AssetManager } from '../../assets/AssetManager.js';

const CLOUD_KEYS = ['cloud_big1', 'cloud_big2', 'cloud_small1', 'cloud_small2'];

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
        key: CLOUD_KEYS[i % CLOUD_KEYS.length],   // sprite variant (if art loaded)
        flip: this._rand(i, 15) > 0.5,
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
    // Ambient life (all pooled, recycled in place).
    this._birds = [];
    for (let i = 0; i < 3; i++) this._birds.push({ x: this._rand(i, 31) * w, y: h * (0.12 + this._rand(i, 32) * 0.28), v: 24 + this._rand(i, 33) * 34, ph: this._rand(i, 34) * 6.283 });
    this._flutter = [];
    for (let i = 0; i < 4; i++) this._flutter.push({ hx: w * (0.2 + this._rand(i, 41) * 0.6), hy: h * (0.5 + this._rand(i, 42) * 0.16), ph: this._rand(i, 43) * 6.283, col: ['#ff9ec4', '#a48bff', '#ffd34e', '#8fe0ff'][i % 4], x: 0, y: 0 });
    this._leaves = [];
    for (let i = 0; i < 6; i++) this._leaves.push({ x: this._rand(i, 51) * w, y: this._rand(i, 52) * h, vy: 14 + this._rand(i, 53) * 18, ph: this._rand(i, 54) * 6.283, col: ['#8fd66a', '#5cb04b', '#c8e06a'][i % 3], s: 5 + this._rand(i, 55) * 4 });
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
    for (const b of this._birds) { b.x += b.v * dt; if (b.x - 30 > this.w) b.x = -30; }
    for (const f of this._flutter) { f.x = f.hx + Motion.slide(this._t, 44, 3, f.ph); f.y = f.hy + Motion.float(this._t, 28, 2.2, f.ph); }
    for (const l of this._leaves) { l.y += l.vy * dt; l.x += Math.sin(this._t * 1.3 + l.ph) * 22 * dt; if (l.y - 10 > this.h) { l.y = -10; l.x = Math.random() * this.w; } }
  }

  render(r) {
    this._sky(r);
    this._farIslands(r);
    this._birdsDraw(r);
    this._cloudLayer(r);
    this._mainIsland(r);
    this._flutterDraw(r);
    this._particles(r);
    this._leavesDraw(r);
  }

  _birdsDraw(r) {
    const ctx = r.ctx; ctx.strokeStyle = 'rgba(70,90,120,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const b of this._birds) { const f = Math.sin(this._t * 9 + b.ph) * 6; ctx.beginPath(); ctx.moveTo(b.x - 11, b.y + f); ctx.lineTo(b.x, b.y - 2); ctx.lineTo(b.x + 11, b.y + f); ctx.stroke(); }
  }
  _flutterDraw(r) {
    for (const f of this._flutter) {
      const flap = Math.abs(Math.sin(this._t * 12 + f.ph)), w = 5 + flap * 4;
      r.setAlpha(0.9);
      this._ellipse(r, f.x - w * 0.6, f.y, w, w * (0.5 + flap * 0.6), f.col);
      this._ellipse(r, f.x + w * 0.6, f.y, w, w * (0.5 + flap * 0.6), f.col);
      r.setAlpha(1);
    }
  }
  _leavesDraw(r) {
    const ctx = r.ctx;
    for (const l of this._leaves) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(this._t * 1.4 + l.ph);
      r.setAlpha(0.75); ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = l.col; ctx.fill(); r.setAlpha(1);
      ctx.restore();
    }
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
    const ctx = r.ctx;
    for (const c of this._clouds) {
      const x = c.x + ox, y = c.y + oy;
      const img = AssetManager.image(c.key);
      if (img) {
        // Sprite cloud: scale by depth, mirror some for variety.
        const w = c.s * 200, h = w * img.height / img.width;
        r.setAlpha(c.s < 1.1 ? 0.82 : 1);
        if (c.flip) {
          ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
          ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
        } else {
          ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        }
        r.setAlpha(1);
        continue;
      }
      // Procedural fallback (puffed circles).
      r.setAlpha(c.s < 1.1 ? 0.6 : 0.9);
      const rr = 30 * c.s;
      r.fillCircle(x, y, rr, '#ffffff');
      r.fillCircle(x + rr * 0.95, y + rr * 0.15, rr * 0.8, '#ffffff');
      r.fillCircle(x - rr * 0.95, y + rr * 0.2, rr * 0.72, '#ffffff');
      r.fillCircle(x + rr * 0.2, y - rr * 0.42, rr * 0.72, '#ffffff');
      r.setAlpha(1);
    }
    r.setAlpha(1);
  }

  // --- Layer 4: Main hero island --------------------------------------------
  _mainIsland(r) {
    const ox = this._px * 40;
    const cx = this.w * 0.5 + ox;
    const ctx = r.ctx;

    // Sprite island (with the same gentle bob + a soft grounding shadow).
    const img = AssetManager.image('island');
    if (img) {
      const iw = this.w * 0.8, ih = iw * img.height / img.width;
      const iy = this.h * 0.64 + Motion.float(this._t, 8, 6);   // vertical centre + bob
      r.setAlpha(0.14);
      this._ellipse(r, cx, iy + ih * 0.42, iw * 0.4, ih * 0.12, '#0a2a1a');
      r.setAlpha(1);
      ctx.drawImage(img, cx - iw / 2, iy - ih / 2, iw, ih);
      return;
    }

    const topY = this.h * 0.62 + Motion.float(this._t, 8, 5);
    const rx = this.w * 0.6, ry = 130;
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
