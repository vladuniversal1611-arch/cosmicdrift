/**
 * WorldMapParallax.js
 * -----------------------------------------------------------------------------
 * The screen-space atmosphere behind the islands: a sky gradient that crossfades
 * to the current island's tint, sun rays, far + near cloud banks, a slow flying
 * dragon, a drifting balloon, birds and a soft fog band. Everything moves at its
 * own speed for depth. All pooled/fixed arrays — no per-frame allocation.
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../home/Motion.js';

export class WorldMapParallax {
  constructor(w, h) {
    this.w = w; this.h = h; this._t = 0;
    this._sky = ['#63c0ff', '#a6e0ff', '#e8f7ff'];
    this._skyTarget = this._sky.slice();
    this._farClouds = this._make(6, 11);
    this._nearClouds = this._make(4, 21);
    this._birds = [];
    for (let i = 0; i < 4; i++) this._birds.push({ x: this._r(i, 31) * w, y: h * (0.12 + this._r(i, 32) * 0.3), v: 30 + this._r(i, 33) * 40, ph: this._r(i, 34) * 6.28 });
    this._dragon = { x: -160, y: h * 0.2, v: 40, ph: 0 };
    this._balloon = { x: w * 0.72, y: h * 0.6, v: 10, ph: this._r(9, 40) * 6.28 };
  }

  _r(i, s = 0) { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }
  _make(n, salt) {
    const a = [];
    for (let i = 0; i < n; i++) a.push({ x: this._r(i, salt) * this.w, y: this.h * (0.08 + this._r(i, salt + 1) * 0.5), s: 0.6 + this._r(i, salt + 2) * 1.0, v: 5 + this._r(i, salt + 3) * 14 });
    return a;
  }

  /** Crossfade the sky toward a new island tint. */
  setSky(stops) { if (stops) this._skyTarget = stops.slice(); }

  update(dt) {
    this._t += dt;
    // Ease the sky toward the target tint.
    for (let i = 0; i < 3; i++) this._sky[i] = this._mix(this._sky[i], this._skyTarget[i] || this._sky[i], Math.min(1, dt * 1.5));
    for (const c of this._farClouds) { c.x += c.v * 0.5 * dt; if (c.x - 160 > this.w) c.x = -160; }
    for (const c of this._nearClouds) { c.x += c.v * dt; if (c.x - 200 > this.w) c.x = -200; }
    for (const b of this._birds) { b.x += b.v * dt; if (b.x - 40 > this.w) b.x = -40; }
    this._dragon.x += this._dragon.v * dt; if (this._dragon.x - 200 > this.w) this._dragon.x = -200;
    this._balloon.y -= this._balloon.v * dt; if (this._balloon.y < -140) this._balloon.y = this.h + 140;
  }

  _mix(c1, c2, t) {
    const h = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const a = h(c1), b = h(c2);
    const to = (v) => Math.round(v).toString(16).padStart(2, '0');
    return `#${to(a[0] + (b[0] - a[0]) * t)}${to(a[1] + (b[1] - a[1]) * t)}${to(a[2] + (b[2] - a[2]) * t)}`;
  }

  render(r) {
    r.fillBackgroundGradient(this._sky);
    // Sun bloom + rays.
    const sun = r.radialGradient(this.w * 0.5, this.h * 0.12, this.h * 0.4, [[0, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
    r.fillRect(0, 0, this.w, this.h, sun);
    r.setAlpha(0.05); const ctx = r.ctx;
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(this.w * 0.5, this.h * 0.1); ctx.rotate(-0.5 + i * 0.24); ctx.fillStyle = '#fff'; ctx.fillRect(-44, 0, 88, this.h); ctx.restore(); }
    r.setAlpha(1);
    this._cloudBank(r, this._farClouds, 0.5);
    this._dragonFly(r);
    this._balloonDraw(r);
    this._cloudBank(r, this._nearClouds, 0.85);
    this._birdsDraw(r);
    // Fog band low on screen.
    r.setAlpha(0.35);
    const fog = r.linearGradient(0, this.h * 0.72, 0, this.h, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0.6)']]);
    r.fillRect(0, this.h * 0.72, this.w, this.h * 0.28, fog);
    r.setAlpha(1);
  }

  _cloudBank(r, arr, alpha) {
    for (const c of arr) {
      r.setAlpha(alpha * (c.s < 1.1 ? 0.7 : 1));
      const rr = 30 * c.s;
      r.fillCircle(c.x, c.y, rr, '#fff');
      r.fillCircle(c.x + rr * 0.95, c.y + rr * 0.15, rr * 0.8, '#fff');
      r.fillCircle(c.x - rr * 0.95, c.y + rr * 0.2, rr * 0.72, '#fff');
      r.fillCircle(c.x + rr * 0.2, c.y - rr * 0.42, rr * 0.72, '#fff');
    }
    r.setAlpha(1);
  }

  _birdsDraw(r) {
    const ctx = r.ctx; ctx.strokeStyle = 'rgba(60,80,110,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const b of this._birds) {
      const f = Math.sin(this._t * 9 + b.ph) * 6;
      ctx.beginPath(); ctx.moveTo(b.x - 12, b.y + f); ctx.lineTo(b.x, b.y - 2); ctx.lineTo(b.x + 12, b.y + f); ctx.stroke();
    }
  }

  _dragonFly(r) {
    const d = this._dragon, ctx = r.ctx;
    const wing = Math.sin(this._t * 6) * 10;
    r.setAlpha(0.85);
    r.withGlow('#7fd0ff', 12, () => {
      ctx.fillStyle = '#6aa0e0';
      r.fillCircle(d.x, d.y, 12, '#6aa0e0');
      ctx.beginPath(); ctx.moveTo(d.x - 10, d.y); ctx.lineTo(d.x - 34, d.y - 12 - wing); ctx.lineTo(d.x - 24, d.y + 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(d.x + 10, d.y); ctx.lineTo(d.x + 34, d.y - 12 - wing); ctx.lineTo(d.x + 24, d.y + 6); ctx.closePath(); ctx.fill();
    });
    r.setAlpha(1);
  }

  _balloonDraw(r) {
    const bl = this._balloon, ctx = r.ctx;
    const x = bl.x + Math.sin(this._t * 0.6 + bl.ph) * 18, y = bl.y, R = 30;
    ctx.strokeStyle = 'rgba(90,60,30,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 8, y + R); ctx.lineTo(x - 5, y + R + 16); ctx.moveTo(x + 8, y + R); ctx.lineTo(x + 5, y + R + 16); ctx.stroke();
    r.fillRoundRect(x - 8, y + R + 14, 16, 12, 3, '#8a5a2c');
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.moveTo(x - R * 0.5, y + R * 0.7); ctx.lineTo(x, y + R + 5); ctx.lineTo(x + R * 0.5, y + R * 0.7); ctx.clip();
    const stripes = ['#ff6b8a', '#ffd24a', '#5fb9f0', '#7ed957']; const sw = 2 * R / stripes.length;
    for (let i = 0; i < stripes.length; i++) { ctx.fillStyle = stripes[i]; ctx.fillRect(x - R + sw * i, y - R, sw + 1, 2 * R + 8); }
    ctx.restore();
  }
}
