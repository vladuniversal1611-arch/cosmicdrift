/**
 * MenuBackground.js
 * -----------------------------------------------------------------------------
 * The living backdrop behind the menus: a bright sky with a warm sun-glow,
 * drifting parallax clouds, a big floating island with animated waterfalls and
 * grass, flying dragons that flap and arc across, and lazily falling leaves.
 * All procedural, deterministic, and cheap (fixed element counts) so it holds
 * 60 FPS. Reused by the main menu and the meta screens for a cohesive world.
 * -----------------------------------------------------------------------------
 */
import { Random } from '../../utils/Random.js';

export class MenuBackground {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.t = 0;
    const rng = new Random(0xBADA55);

    this.clouds = Array.from({ length: 7 }, () => ({
      x: rng.range(-0.1, 1.1) * width,
      y: rng.range(0.06, 0.5) * height,
      s: rng.range(0.6, 1.5),
      spd: rng.range(6, 16),
      a: rng.range(0.5, 0.9),
    }));
    this.leaves = Array.from({ length: 16 }, () => ({
      x: rng.range(0, 1) * width, y: rng.range(0, 1) * height,
      s: rng.range(3, 7), spd: rng.range(10, 26), sway: rng.range(0.5, 1.5),
      ph: rng.range(0, 6.28), hue: rng.pick(['#7fe08a', '#a8f07a', '#ffd25e']),
    }));
    this.dragons = [
      { x: -0.2, y: 0.22, spd: 0.06, scale: 1, dir: 1, color: '#3aa8ff' },
      { x: 1.2, y: 0.34, spd: 0.045, scale: 0.8, dir: -1, color: '#ff6a8a' },
    ];
    // Distant parallax islands (far, small, faint) high in the sky.
    this.farIslands = [
      { x: 0.16, y: 0.16, s: 0.055 },
      { x: 0.84, y: 0.13, s: 0.045 },
    ];
    // A little flock of birds drifting across the sky.
    this.birds = Array.from({ length: 6 }, () => ({
      x: rng.range(-0.1, 1.1), y: rng.range(0.12, 0.42),
      spd: rng.range(0.02, 0.045), scale: rng.range(0.6, 1.1), ph: rng.range(0, 6.28),
    }));
  }

  update(dt) {
    this.t += dt;
    for (const c of this.clouds) { c.x += c.spd * dt; if (c.x - 120 * c.s > this.w) c.x = -120 * c.s; }
    for (const l of this.leaves) {
      l.y += l.spd * dt; l.x += Math.sin(this.t * l.sway + l.ph) * 12 * dt;
      if (l.y > this.h + 10) { l.y = -10; l.x = Math.random() * this.w; }
    }
    for (const d of this.dragons) {
      d.x += d.spd * d.dir * dt;
      if (d.dir > 0 && d.x > 1.25) d.x = -0.25;
      if (d.dir < 0 && d.x < -0.25) d.x = 1.25;
    }
    for (const bd of this.birds) {
      bd.x += bd.spd * dt;
      if (bd.x > 1.15) bd.x = -0.15;
    }
  }

  render(r) {
    const { w, h } = this;
    // Sky.
    const sky = r.linearGradient(0, 0, 0, h, [[0, '#5bb4ff'], [0.5, '#9ad7ff'], [1, '#e6f6ff']]);
    r.fillRect(0, 0, w, h, sky);
    // Sun glow.
    r.setAlpha(0.8);
    const sun = r.radialGradient(w * 0.5, h * 0.12, w * 0.6, [[0, 'rgba(255,246,214,0.9)'], [1, 'rgba(255,246,214,0)']]);
    r.fillRect(0, 0, w, h * 0.6, sun);
    r.setAlpha(1);

    this._rays(r);
    for (const b of this.birds) this._bird(r, b);
    for (const c of this.clouds) this._cloud(r, c);
    for (const fi of this.farIslands) this._farIsland(r, fi);
    this._island(r);
    for (const d of this.dragons) this._dragon(r, d);
    for (const l of this.leaves) this._leaf(r, l);
  }

  /** Soft warm sunlight rays that slowly sweep from the top. */
  _rays(r) {
    const { w, h } = this;
    const ctx = r.ctx;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.translate(w * 0.5, -h * 0.06);
    ctx.rotate(Math.sin(this.t * 0.05) * 0.12);
    ctx.fillStyle = '#fff6d6';
    for (let i = 0; i < 9; i++) {
      ctx.rotate(Math.PI / 9);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-w * 0.03, h * 1.3);
      ctx.lineTo(w * 0.03, h * 1.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /** A tiny, faint distant floating island (parallax depth). */
  _farIsland(r, fi) {
    const { w, h } = this;
    const cx = fi.x * w + Math.sin(this.t * 0.4 + fi.x * 6) * 5;
    const cy = fi.y * h;
    const iw = w * fi.s;
    const ctx = r.ctx;
    r.setAlpha(0.45);
    // Short rounded rock underside (soft trapezoid, not a big spike).
    ctx.fillStyle = '#d8c096';
    ctx.beginPath();
    ctx.moveTo(cx - iw, cy);
    ctx.lineTo(cx + iw, cy);
    ctx.lineTo(cx + iw * 0.45, cy + iw * 0.7);
    ctx.lineTo(cx - iw * 0.45, cy + iw * 0.7);
    ctx.closePath(); ctx.fill();
    // Grass cap.
    ctx.fillStyle = '#7fd08a';
    ctx.beginPath(); ctx.ellipse(cx, cy, iw, iw * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    r.setAlpha(1);
  }

  /** A little bird (soft "M" silhouette) gliding across the sky. */
  _bird(r, bd) {
    const { w, h } = this;
    const x = bd.x * w, y = bd.y * h + Math.sin(this.t * 1.5 + bd.ph) * 6;
    const s = 14 * bd.scale;
    const flap = Math.sin(this.t * 6 + bd.ph) * 0.4 + 0.5;
    const ctx = r.ctx;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#4a6b9a';
    ctx.lineWidth = Math.max(2, s * 0.16);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * flap, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * flap, x + s, y);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _cloud(r, c) {
    r.setAlpha(c.a);
    const s = c.s * 26;
    r.fillCircle(c.x, c.y, s, '#ffffff');
    r.fillCircle(c.x + s, c.y + s * 0.2, s * 0.8, '#ffffff');
    r.fillCircle(c.x - s, c.y + s * 0.2, s * 0.8, '#f2f8ff');
    r.fillCircle(c.x + s * 0.4, c.y - s * 0.4, s * 0.7, '#ffffff');
    r.fillRoundRect(c.x - s * 1.6, c.y, s * 3.2, s * 0.9, s * 0.45, '#eef6ff');
    r.setAlpha(1);
  }

  _island(r) {
    const { w, h } = this;
    const cx = w * 0.5;
    const top = h * 0.6 + Math.sin(this.t * 0.7) * 6;   // gentle float
    const iw = w * 0.62;
    const ctx = r.ctx;
    // Rocky underside — a bright, warm sandy stone (never muddy brown).
    const rock = r.linearGradient(cx, top, cx, top + h * 0.3,
      [[0, '#f0cf9e'], [0.55, '#dcae74'], [1, '#c2925a']]);
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(cx - iw / 2, top);
    ctx.lineTo(cx + iw / 2, top);
    ctx.lineTo(cx + iw * 0.18, top + h * 0.22);
    ctx.lineTo(cx, top + h * 0.3);
    ctx.lineTo(cx - iw * 0.2, top + h * 0.2);
    ctx.closePath(); ctx.fill();
    // Grass top.
    r.withGlow('rgba(120,220,140,0.5)', 12, () => {
      const g = r.linearGradient(cx, top - 30, cx, top + 20, [[0, '#8be86a'], [1, '#3fae5a']]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, top, iw / 2, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Waterfalls (animated streams from the underside).
    const off = (this.t * 60) % 20;
    for (let i = -1; i <= 1; i++) {
      const x = cx + i * iw * 0.16;
      r.setAlpha(0.75);
      const wg = r.linearGradient(x, top, x, top + h * 0.26, [[0, '#cdeeff'], [1, 'rgba(180,230,255,0)']]);
      r.fillRoundRect(x - 6, top, 12, h * 0.26, 6, wg);
      r.setAlpha(0.5);
      for (let k = 0; k < 4; k++) r.fillCircle(x, top + off + k * 20, 3, '#ffffff');
      r.setAlpha(1);
    }
    // A couple of tiny buildings/trees on top.
    r.fillCircle(cx - iw * 0.22, top - 14, 14, '#3fc06a');
    r.fillRoundRect(cx - iw * 0.24, top - 6, 4, 12, 1, '#b07a45');
    r.fillRoundRect(cx + iw * 0.12, top - 26, 26, 22, 3, '#fbeccb');
    r.fillRoundRect(cx + iw * 0.12, top - 34, 26, 10, 2, '#ff7a4d'); // roof
  }

  _dragon(r, d) {
    const x = d.x * this.w;
    const y = d.y * this.h + Math.sin(this.t * 1.2) * 10;
    const s = 20 * d.scale;
    const flap = Math.sin(this.t * 8) * 0.5;
    const ctx = r.ctx;
    r.withGlow(d.color, 10, () => {
      ctx.fillStyle = d.color;
      // Body.
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      // Wings.
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - s * 1.6 * d.dir, y - s * (0.9 + flap));
      ctx.lineTo(x - s * 0.5 * d.dir, y + s * 0.3);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 0.9 * d.dir, y - s * (0.7 - flap));
      ctx.lineTo(x + s * 0.2 * d.dir, y + s * 0.3);
      ctx.closePath(); ctx.fill();
      // Head.
      r.fillCircle(x + s * 0.9 * d.dir, y - s * 0.1, s * 0.4, d.color);
    });
  }

  _leaf(r, l) {
    const ctx = r.ctx;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(Math.sin(this.t * l.sway + l.ph) * 0.8);
    ctx.fillStyle = l.hue;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
