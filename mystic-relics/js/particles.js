/* ============================================================
 * Mystic Relics — particles.js
 * Система частинок з Object Pooling — без збирання сміття
 * у гарячому циклі, стабільні 60 FPS.
 * ============================================================ */
'use strict';

const Particles = {
  pool: [],
  active: [],
  MAX: 600,

  _get() {
    return this.pool.pop() || { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '#fff', grav: 0, glyph: null, spin: 0, rot: 0 };
  },

  spawn(opts) {
    if (this.active.length >= this.MAX) return;
    if (Storage.data.settings.quality === 'low' && Math.random() < 0.6) return;
    const p = this._get();
    Object.assign(p, {
      x: opts.x, y: opts.y,
      vx: opts.vx || 0, vy: opts.vy || 0,
      life: opts.life || 0.8, maxLife: opts.life || 0.8,
      size: opts.size || 4, color: opts.color || '#ffd700',
      grav: opts.grav || 0, glyph: opts.glyph || null,
      spin: opts.spin || 0, rot: 0
    });
    this.active.push(p);
  },

  /** Вибух трійки плиток. */
  burst(x, y, color, n = 22) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 260;
      this.spawn({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0.5 + Math.random() * 0.6, size: 2 + Math.random() * 5,
        color, grav: 350
      });
    }
    // Іскри-зірочки
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawn({
        x, y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120 - 100,
        life: 0.9, size: 14, glyph: '✦', color: '#fff8d0', grav: 200, spin: 4
      });
    }
  },

  /** Пил при появі/падінні плитки. */
  dust(x, y, color = 'rgba(255,255,255,0.5)') {
    for (let i = 0; i < 8; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 30, y,
        vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40,
        life: 0.4 + Math.random() * 0.3, size: 3 + Math.random() * 3, color
      });
    }
  },

  /** Сяйво навколо підказки/бонусу. */
  sparkle(x, y, color = '#ffe066') {
    this.spawn({
      x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
      vx: 0, vy: -30, life: 0.7, size: 10, glyph: '✨', color, spin: 2
    });
  },

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.active.splice(i, 1);
        if (this.pool.length < this.MAX) this.pool.push(p);
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  },

  draw(ctx) {
    for (const p of this.active) {
      const a = Math.min(1, p.life / p.maxLife * 2);
      ctx.globalAlpha = a;
      if (p.glyph) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  clear() {
    this.pool.push(...this.active);
    this.active.length = 0;
  }
};
