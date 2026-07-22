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
      // Tiny dragons far away, high in the sky, drifting slowly.
      { x: 0.3, y: 0.1, spd: 0.02, scale: 0.32, dir: 1, color: '#7fb8ff' },
      { x: 0.8, y: 0.14, spd: 0.016, scale: 0.28, dir: -1, color: '#c8a6ff' },
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
    // Floating magic pollen carried on a gentle wind (soft, glowing motes).
    this.pollen = Array.from({ length: 22 }, () => ({
      x: rng.range(0, 1) * width, y: rng.range(0, 1) * height,
      vx: rng.range(6, 18), vy: rng.range(-16, -5), r: rng.range(2, 5),
      ph: rng.range(0, 6.28), hue: rng.pick(['#ffffff', '#bfe4ff', '#ffe6ad']),
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
    for (const p of this.pollen) {
      p.x += (p.vx + Math.sin(this.t * 0.5 + p.ph) * 6) * dt;
      p.y += p.vy * dt;
      if (p.x > this.w + 8) p.x = -8;
      if (p.y < -8) { p.y = this.h + 8; p.x = Math.random() * this.w; }
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
    for (const p of this.pollen) this._pollen(r, p);
  }

  /** A soft, glowing pollen mote (halo + bright core; no per-particle shadow). */
  _pollen(r, p) {
    const a = Math.max(0, 0.3 + 0.25 * Math.sin(this.t * 2 + p.ph));
    r.setAlpha(a * 0.5);
    r.fillCircle(p.x, p.y, p.r * 2.2, p.hue);
    r.setAlpha(a);
    r.fillCircle(p.x, p.y, p.r, p.hue);
    r.setAlpha(1);
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
    // Rocky underside — a bright, warm sandy stone (never muddy brown). Short
    // and softly rounded so it reads as a gentle floating base, not a spike.
    const depth = h * 0.14;
    const rock = r.linearGradient(cx, top, cx, top + depth,
      [[0, '#f0cf9e'], [0.55, '#dcae74'], [1, '#c2925a']]);
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(cx - iw / 2, top);
    ctx.lineTo(cx + iw / 2, top);
    ctx.quadraticCurveTo(cx + iw * 0.22, top + depth * 0.8, cx, top + depth);
    ctx.quadraticCurveTo(cx - iw * 0.22, top + depth * 0.8, cx - iw / 2, top);
    ctx.closePath(); ctx.fill();
    // Grass top.
    r.withGlow('rgba(120,220,140,0.5)', 12, () => {
      const g = r.linearGradient(cx, top - 30, cx, top + 20, [[0, '#8be86a'], [1, '#3fae5a']]);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, top, iw / 2, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Waterfalls (animated streams from the underside).
    const fall = h * 0.16;
    const off = (this.t * 60) % 20;
    for (let i = -1; i <= 1; i++) {
      const x = cx + i * iw * 0.16;
      r.setAlpha(0.75);
      const wg = r.linearGradient(x, top, x, top + fall, [[0, '#cdeeff'], [1, 'rgba(180,230,255,0)']]);
      r.fillRoundRect(x - 6, top, 12, fall, 6, wg);
      r.setAlpha(0.5);
      for (let k = 0; k < 4; k++) r.fillCircle(x, top + off + k * 20, 3, '#ffffff');
      r.setAlpha(1);
    }
    // Detailed island scene on top (soft shadows first, then props).
    this._islandDecor(r, cx, top, iw);
  }

  /** A little living world on the island: trees, flowers, rocks, crystals, a
   *  wooden bridge, a dragon nest and animated grass — all gently moving. */
  _islandDecor(r, cx, top, iw) {
    const ctx = r.ctx;
    const sway = Math.sin(this.t * 1.1);
    // Soft ground shadows under the props.
    r.setAlpha(0.12);
    for (const dx of [-0.30, -0.02, 0.24, 0.40]) r.fillCircle(cx + iw * dx, top + 10, 34, '#173a72');
    r.setAlpha(1);

    // Animated grass blades along the ridge.
    ctx.strokeStyle = '#5ec46a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const gx = cx + (i / 15 - 0.5) * iw * 0.9;
      const bend = Math.sin(this.t * 1.6 + i) * 4;
      ctx.beginPath(); ctx.moveTo(gx, top + 6); ctx.quadraticCurveTo(gx + bend, top - 8, gx + bend * 1.6, top - 16); ctx.stroke();
    }

    // Rocks (light gray-blue, rounded).
    this._rock(r, cx - iw * 0.40, top - 4, 20);
    this._rock(r, cx + iw * 0.40, top - 2, 15);

    // Crystal cluster (cyan, softly pulsing glow).
    const cg = 0.6 + 0.4 * Math.sin(this.t * 2);
    r.withGlow('#7fe0ff', 8 + cg * 6, () => {
      this._crystalSpike(r, cx + iw * 0.30, top - 6, 26, '#8fd6ff');
      this._crystalSpike(r, cx + iw * 0.345, top - 2, 18, '#bfe4ff');
    });

    // Flowers (a small colourful cluster).
    const petals = ['#ff6aa8', '#ffb020', '#ffe08a'];
    for (let i = 0; i < 3; i++) this._flower(r, cx - iw * 0.14 + i * 16, top - 6 + (i % 2) * 6, 7, petals[i]);

    // Trees (rounded canopies with a gentle sway).
    this._tree(r, cx - iw * 0.30, top - 6, 26, sway);
    this._tree(r, cx + iw * 0.02, top - 8, 32, sway * -0.8);

    // Wooden bridge across a little gap.
    this._bridge(r, cx - iw * 0.06, top + 2, iw * 0.22);

    // Dragon nest with a spotted egg.
    this._nest(r, cx + iw * 0.20, top + 2, 22);
  }

  _rock(r, x, y, s) {
    const g = r.linearGradient(x, y - s, x, y + s, [[0, '#eaf3ff'], [1, '#aecbea']]);
    r.ctx.fillStyle = g; r.ctx.beginPath(); r.ctx.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2); r.ctx.fill();
  }
  _crystalSpike(r, x, y, s, c) {
    const ctx = r.ctx;
    const g = r.linearGradient(x, y - s, x, y, [[0, '#e2fbff'], [1, c]]);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x - s * 0.32, y); ctx.lineTo(x + s * 0.32, y); ctx.closePath(); ctx.fill();
  }
  _flower(r, x, y, s, c) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; r.fillCircle(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.6, c); }
    r.fillCircle(x, y, s * 0.6, '#fff3c4');
  }
  _tree(r, x, y, s, sway) {
    const ctx = r.ctx;
    r.fillRoundRect(x - s * 0.12, y - s * 0.2, s * 0.24, s * 0.9, s * 0.1, '#9a6b3f');
    ctx.save(); ctx.translate(x, y - s * 0.2); ctx.rotate(sway * 0.05);
    r.withGlow('rgba(120,220,140,0.35)', 6, () => {
      const g = r.linearGradient(0, -s, 0, s * 0.3, [[0, '#8be86a'], [1, '#3fae5a']]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.8, s * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
  _bridge(r, x, y, w) {
    const ctx = r.ctx; const h = 10;
    ctx.strokeStyle = '#b07a45'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x, y - h, x + w / 2, y); ctx.stroke();
    for (let i = 0; i <= 4; i++) { const t = i / 4; const px = x - w / 2 + w * t; const py = y - Math.sin(t * Math.PI) * h; r.fillRoundRect(px - 2, py, 4, 8, 1, '#caa06e'); }
  }
  _nest(r, x, y, s) {
    r.ctx.fillStyle = '#caa06e'; r.ctx.beginPath(); r.ctx.ellipse(x, y, s, s * 0.55, 0, 0, Math.PI * 2); r.ctx.fill();
    r.ctx.fillStyle = '#9a6b3f'; r.ctx.beginPath(); r.ctx.ellipse(x, y - 2, s * 0.7, s * 0.35, 0, 0, Math.PI * 2); r.ctx.fill();
    r.fillCircle(x, y - s * 0.35, s * 0.42, '#bfe4ff');
    r.setAlpha(0.7); r.fillCircle(x - s * 0.14, y - s * 0.45, s * 0.1, '#3aa8ff'); r.fillCircle(x + s * 0.12, y - s * 0.3, s * 0.08, '#3aa8ff'); r.setAlpha(1);
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
