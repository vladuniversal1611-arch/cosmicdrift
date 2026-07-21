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
      { x: -0.2, y: 0.22, spd: 0.06, scale: 1, dir: 1, color: '#7c5cff' },
      { x: 1.2, y: 0.34, spd: 0.045, scale: 0.8, dir: -1, color: '#ff6a8a' },
    ];
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

    for (const c of this.clouds) this._cloud(r, c);
    this._island(r);
    for (const d of this.dragons) this._dragon(r, d);
    for (const l of this.leaves) this._leaf(r, l);
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
    // Rocky underside.
    ctx.fillStyle = '#6b4a3a';
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
    r.fillCircle(cx - iw * 0.22, top - 14, 14, '#2f9e4f');
    r.fillRoundRect(cx - iw * 0.24, top - 6, 4, 12, 1, '#6b4a2b');
    r.fillRoundRect(cx + iw * 0.12, top - 26, 26, 22, 3, '#e9d6b0');
    r.fillRoundRect(cx + iw * 0.12, top - 34, 26, 10, 2, '#e0433f'); // roof
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
