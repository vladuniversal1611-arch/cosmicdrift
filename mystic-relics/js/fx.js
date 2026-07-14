/* ============================================================
 * Mystic Relics — fx.js
 * Повноекранні святкові ефекти ПОВЕРХ модальних вікон:
 * конфеті, феєрверки, дощ із монет і кристалів.
 * Окремий canvas + власний rAF, який працює лише поки є
 * активні частинки (нуль витрат у спокої).
 * ============================================================ */
'use strict';

const Fx = {
  canvas: null, g: null,
  parts: [], pool: [],
  _running: false,

  init() {
    const c = document.createElement('canvas');
    c.id = 'fxCanvas';
    c.style.cssText = 'position:fixed;inset:0;z-index:90;pointer-events:none';
    document.body.appendChild(c);
    this.canvas = c;
    this.g = c.getContext('2d');
    window.addEventListener('resize', () => this._size());
    this._size();
  },

  _size() { this.canvas.width = innerWidth; this.canvas.height = innerHeight; },

  _get() { return this.pool.pop() || {}; },

  _add(p) {
    p.t = 0;
    this.parts.push(p);
    if (!this._running) { this._running = true; this._last = performance.now(); requestAnimationFrame(ts => this._loop(ts)); }
  },

  /* ---- Конфеті: кольорові папірці, що крутяться ---- */
  confetti(n = 120) {
    const colors = ['#ff6b6b', '#ffd166', '#4ade80', '#60a5fa', '#c084fc', '#f472b6', '#fff'];
    for (let i = 0; i < n; i++) {
      this._add(Object.assign(this._get(), {
        kind: 'confetti',
        x: Math.random() * this.canvas.width, y: -20 - Math.random() * this.canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 90, vy: 110 + Math.random() * 160,
        w: 5 + Math.random() * 6, h: 8 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 12,
        ph: Math.random() * Math.PI * 2,
        color: colors[i % colors.length], life: 3.4 + Math.random() * 1.4
      }));
    }
  },

  /* ---- Феєрверк: ракета + сферичний вибух ---- */
  firework(x, y, color) {
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const sp = 90 + Math.random() * 190;
      this._add(Object.assign(this._get(), {
        kind: 'spark',
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        color, size: 1.6 + Math.random() * 2.4, life: 0.9 + Math.random() * 0.7
      }));
    }
    Audio2.play('match', 5);
  },

  /** Серія феєрверків у випадкових точках верхньої частини екрана. */
  fireworksShow(count = 5) {
    const colors = ['#ffd166', '#4ade80', '#60a5fa', '#f472b6', '#c084fc'];
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.firework(
        this.canvas.width * (0.2 + Math.random() * 0.6),
        this.canvas.height * (0.12 + Math.random() * 0.3),
        colors[i % colors.length]
      ), 350 + i * 420);
    }
  },

  /* ---- Дощ із монет / кристалів ---- */
  coinRain(n = 22, glyph = '🪙') {
    for (let i = 0; i < n; i++) {
      setTimeout(() => this._add(Object.assign(this._get(), {
        kind: 'glyph', glyph,
        x: this.canvas.width * (0.15 + Math.random() * 0.7), y: -30,
        vx: (Math.random() - 0.5) * 60, vy: 200 + Math.random() * 220,
        rot: 0, vr: (Math.random() - 0.5) * 7,
        size: 20 + Math.random() * 12, life: 2.6
      })), i * 90);
    }
  },

  _loop(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    const g = this.g, W = this.canvas.width, H = this.canvas.height;
    g.clearRect(0, 0, W, H);

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += dt;
      if (p.t >= p.life || p.y > H + 60) {
        this.parts.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      const fade = Math.min(1, (p.life - p.t) / 0.5);
      if (p.kind === 'confetti') {
        p.ph += dt * 6;
        p.x += (p.vx + Math.sin(p.ph) * 50) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot);
        g.globalAlpha = fade;
        g.fillStyle = p.color;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, Math.abs(Math.sin(p.ph)) * p.h + 2);
        g.restore();
      } else if (p.kind === 'spark') {
        p.vy += 160 * dt;
        p.vx *= 1 - 1.2 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalAlpha = fade;
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2); g.fill();
        // Слід
        g.globalAlpha = fade * 0.3;
        g.beginPath(); g.arc(p.x - p.vx * 0.02, p.y - p.vy * 0.02, p.size * fade * 1.8, 0, Math.PI * 2); g.fill();
      } else { // glyph — монети/кристали
        p.vy += 60 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot);
        g.globalAlpha = fade;
        g.font = `${p.size}px sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(p.glyph, 0, 0);
        g.restore();
      }
    }
    g.globalAlpha = 1;

    if (this.parts.length) requestAnimationFrame(ts => this._loop(ts));
    else { this._running = false; g.clearRect(0, 0, W, H); }
  }
};
