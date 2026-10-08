/* FALLSHIFT — pooled particles, floating text, shockwaves, screen shake/flash and ambient world FX. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;

  // ---------------------------------------------------------------- glow sprites
  const glowCache = new Map();
  function makeGlow(color, hot) {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    if (hot) {
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.18, U.rgba(color, 0.95));
      gr.addColorStop(0.45, U.rgba(color, 0.35));
      gr.addColorStop(1, U.rgba(color, 0));
    } else {
      gr.addColorStop(0, U.rgba(color, 1));
      gr.addColorStop(0.3, U.rgba(color, 0.5));
      gr.addColorStop(0.65, U.rgba(color, 0.12));
      gr.addColorStop(1, U.rgba(color, 0));
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return c;
  }
  FS.getGlow = function (color, hot) {
    const key = color + (hot ? 'h' : '');
    let c = glowCache.get(key);
    if (!c) {
      c = makeGlow(color, hot);
      glowCache.set(key, c);
    }
    return c;
  };

  // ---------------------------------------------------------------- FX system
  class FX {
    constructor() {
      this.max = 700;
      this.p = new Array(this.max);
      for (let i = 0; i < this.max; i++) {
        this.p[i] = { a: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, color: '#fff', kind: 0, grav: 0, drag: 0, rot: 0, vr: 0 };
      }
      this.idx = 0;
      this.texts = [];
      for (let i = 0; i < 28; i++) this.texts.push({ a: false, x: 0, y: 0, vy: 0, life: 0, max: 1, str: '', color: '#fff', size: 16 });
      this.tIdx = 0;
      this.waves = [];
      for (let i = 0; i < 16; i++) this.waves.push({ a: false, x: 0, y: 0, r: 0, maxR: 1, life: 0, max: 1, color: '#fff', k: 0.34, w: 4 });
      this.wIdx = 0;
      this.shakeAmt = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeOn = true;
      this.flashA = 0;
      this.flashColor = '#ffffff';
      this.quality = 1;
      this.amb = [];
      for (let i = 0; i < 70; i++) this.amb.push({ x: 0, y: 0, vx: 0, vy: 0, size: 1, ph: 0, rot: 0, vr: 0, c: 0, depth: 1 });
      this.ambKind = '';
      this.ambCount = 0;
      this.W = 390;
      this.H = 844;
    }

    clear() {
      for (const p of this.p) p.a = false;
      for (const t of this.texts) t.a = false;
      for (const w of this.waves) w.a = false;
      this.shakeAmt = 0;
      this.flashA = 0;
    }

    spawn(x, y, vx, vy, life, size, color, kind, grav, drag) {
      const p = this.p[this.idx];
      this.idx = (this.idx + 1) % this.max;
      p.a = true;
      p.x = x; p.y = y; p.vx = vx; p.vy = vy;
      p.life = p.max = life;
      p.size = size;
      p.color = color;
      p.kind = kind || 0;
      p.grav = grav || 0;
      p.drag = drag || 0;
      p.rot = Math.random() * U.TAU;
      p.vr = (Math.random() - 0.5) * 14;
      return p;
    }

    // radial burst
    burst(x, y, n, speed, color, o) {
      o = o || {};
      n = Math.max(1, Math.round(n * this.quality));
      const life = o.life || 0.6;
      const size = o.size || 8;
      for (let i = 0; i < n; i++) {
        const a = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * U.TAU;
        const s = speed * (0.35 + Math.random() * 0.65);
        this.spawn(
          x + (Math.random() - 0.5) * (o.jitter || 0),
          y + (Math.random() - 0.5) * (o.jitter || 0),
          Math.cos(a) * s,
          Math.sin(a) * s * (o.flat || 1) + (o.up || 0),
          life * (0.6 + Math.random() * 0.6),
          size * (0.5 + Math.random() * 0.8),
          o.colors ? o.colors[(Math.random() * o.colors.length) | 0] : color,
          o.kind || 0,
          o.grav || 0,
          o.drag !== undefined ? o.drag : 2
        );
      }
    }

    text(x, y, str, color, size, life) {
      const t = this.texts[this.tIdx];
      this.tIdx = (this.tIdx + 1) % this.texts.length;
      t.a = true;
      t.x = x; t.y = y; t.vy = -70;
      t.str = str;
      t.color = color || '#fff';
      t.size = size || 16;
      t.life = t.max = life || 0.9;
    }

    wave(x, y, color, maxR, life, k, w) {
      const s = this.waves[this.wIdx];
      this.wIdx = (this.wIdx + 1) % this.waves.length;
      s.a = true;
      s.x = x; s.y = y; s.r = 4;
      s.maxR = maxR || 120;
      s.life = s.max = life || 0.5;
      s.color = color || '#fff';
      s.k = k === undefined ? 0.34 : k;
      s.w = w || 4;
    }

    shake(a) {
      if (!this.shakeOn) return;
      this.shakeAmt = Math.min(22, Math.max(this.shakeAmt, a));
    }

    flash(color, a) {
      this.flashColor = color;
      this.flashA = Math.max(this.flashA, a);
    }

    update(dt) {
      for (let i = 0; i < this.max; i++) {
        const p = this.p[i];
        if (!p.a) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.a = false;
          continue;
        }
        const d = 1 - Math.min(1, p.drag * dt);
        p.vx *= d;
        p.vy = p.vy * d + p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
      for (const t of this.texts) {
        if (!t.a) continue;
        t.life -= dt;
        if (t.life <= 0) t.a = false;
        t.y += t.vy * dt;
        t.vy *= 1 - Math.min(1, 3 * dt);
      }
      for (const w of this.waves) {
        if (!w.a) continue;
        w.life -= dt;
        if (w.life <= 0) w.a = false;
        const k = 1 - w.life / w.max;
        w.r = 4 + (w.maxR - 4) * (1 - Math.pow(1 - k, 3));
      }
      if (this.shakeAmt > 0) {
        this.shakeAmt = Math.max(0, this.shakeAmt - dt * 40);
        this.shakeX = (Math.random() - 0.5) * 2 * this.shakeAmt;
        this.shakeY = (Math.random() - 0.5) * 2 * this.shakeAmt;
      } else {
        this.shakeX = this.shakeY = 0;
      }
      if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 2.6);
    }

    render(ctx, camY) {
      const H = this.H;
      // shards (normal blending)
      for (let i = 0; i < this.max; i++) {
        const p = this.p[i];
        if (!p.a || p.kind !== 1) continue;
        const y = p.y - camY;
        if (y < -40 || y > H + 40) continue;
        const k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillStyle = p.color;
        const s = p.size;
        const c = Math.cos(p.rot), sn = Math.sin(p.rot);
        ctx.setTransform(c * this.scale, sn * this.scale, -sn * this.scale, c * this.scale, (p.x + this.ox) * this.scale, (y + this.oy) * this.scale);
        ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);
      }
      ctx.setTransform(this.scale, 0, 0, this.scale, this.ox * this.scale, this.oy * this.scale);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.max; i++) {
        const p = this.p[i];
        if (!p.a || p.kind === 1) continue;
        const y = p.y - camY;
        if (y < -40 || y > H + 40) continue;
        const k = p.life / p.max;
        if (p.kind === 2) {
          // spark streak
          ctx.globalAlpha = k;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, y);
          ctx.lineTo(p.x - p.vx * 0.05, y - p.vy * 0.05);
          ctx.stroke();
        } else {
          ctx.globalAlpha = k;
          const s = p.size * (0.5 + k * 0.7) * 2;
          ctx.drawImage(FS.getGlow(p.color), p.x - s / 2, y - s / 2, s, s);
        }
      }
      // shockwaves
      for (const w of this.waves) {
        if (!w.a) continue;
        const k = w.life / w.max;
        ctx.globalAlpha = k;
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.w * (0.4 + k);
        ctx.beginPath();
        ctx.ellipse(w.x, w.y - camY, w.r, Math.max(1, w.r * w.k), 0, 0, U.TAU);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    renderTexts(ctx, camY) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const t of this.texts) {
        if (!t.a) continue;
        const k = t.life / t.max;
        const age = 1 - k;
        const pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.55 : 1.15 - Math.min(0.15, (age - 0.12) * 0.6);
        ctx.globalAlpha = Math.min(1, k * 3);
        ctx.font = '800 ' + Math.round(t.size * pop) + 'px "Segoe UI", Roboto, Arial, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(2,4,18,0.85)';
        ctx.strokeText(t.str, t.x, t.y - camY);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y - camY);
      }
      ctx.globalAlpha = 1;
    }

    // ------------------------------------------------------------ ambient
    setAmbient(kind, colors) {
      this.ambKind = kind;
      this.ambColors = colors;
      this.ambCount = Math.round(this.amb.length * (this.quality < 1 ? 0.5 : 1));
      for (let i = 0; i < this.amb.length; i++) this.resetAmb(this.amb[i], true);
    }

    resetAmb(a, anywhere) {
      const W = this.W, H = this.H;
      a.x = Math.random() * W;
      a.depth = 0.3 + Math.random() * 0.7;
      a.ph = Math.random() * U.TAU;
      a.c = (Math.random() * (this.ambColors ? this.ambColors.length : 1)) | 0;
      a.rot = Math.random() * U.TAU;
      a.vr = (Math.random() - 0.5) * 2;
      switch (this.ambKind) {
        case 'embers':
          a.vy = -30 - Math.random() * 60; a.vx = (Math.random() - 0.5) * 20; a.size = 2 + Math.random() * 3; break;
        case 'stars':
          a.vy = -4; a.vx = 0; a.size = 1 + Math.random() * 2.2; break;
        case 'rain':
          a.vy = -120 - Math.random() * 220; a.vx = 0; a.size = 10 + Math.random() * 40; break;
        case 'debris':
          a.vy = -20 - Math.random() * 40; a.vx = (Math.random() - 0.5) * 10; a.size = 4 + Math.random() * 14; break;
        default:
          a.vy = -10 - Math.random() * 25; a.vx = (Math.random() - 0.5) * 8; a.size = 1.5 + Math.random() * 3;
      }
      a.y = anywhere ? Math.random() * H : H + 20 + Math.random() * 60;
    }

    updateAmbient(dt, dCam) {
      const H = this.H, W = this.W;
      for (let i = 0; i < this.ambCount; i++) {
        const a = this.amb[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt - dCam * a.depth * 0.45;
        a.rot += a.vr * dt;
        a.ph += dt * 2;
        if (a.y < -60) this.resetAmb(a, false);
        else if (a.y > H + 80) {
          this.resetAmb(a, false);
          a.y = -40;
        }
        if (a.x < -20) a.x = W + 10;
        else if (a.x > W + 20) a.x = -10;
      }
    }

    renderAmbient(ctx) {
      const cols = this.ambColors || ['#ffffff'];
      if (this.ambKind === 'debris') {
        for (let i = 0; i < this.ambCount; i++) {
          const a = this.amb[i];
          ctx.globalAlpha = 0.35 + a.depth * 0.4;
          ctx.fillStyle = '#16121a';
          ctx.strokeStyle = cols[a.c];
          ctx.lineWidth = 1;
          const s = a.size * a.depth;
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.rotate(a.rot);
          ctx.beginPath();
          ctx.moveTo(-s, -s * 0.4);
          ctx.lineTo(-s * 0.2, -s * 0.8);
          ctx.lineTo(s, -s * 0.2);
          ctx.lineTo(s * 0.5, s * 0.7);
          ctx.lineTo(-s * 0.6, s * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha *= 0.6;
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.globalCompositeOperation = 'lighter';
      if (this.ambKind === 'rain') {
        ctx.lineWidth = 1.2;
        for (let i = 0; i < this.ambCount; i++) {
          const a = this.amb[i];
          ctx.globalAlpha = 0.12 + a.depth * 0.25;
          ctx.strokeStyle = cols[a.c];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(a.x, a.y + a.size);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < this.ambCount; i++) {
          const a = this.amb[i];
          const tw = this.ambKind === 'stars' ? 0.4 + 0.6 * Math.abs(Math.sin(a.ph)) : 0.6 + 0.4 * Math.sin(a.ph);
          ctx.globalAlpha = (0.25 + a.depth * 0.5) * tw;
          const s = a.size * 4 * a.depth;
          const x = a.x + (this.ambKind === 'embers' ? Math.sin(a.ph * 1.7) * 6 : 0);
          ctx.drawImage(FS.getGlow(cols[a.c]), x - s / 2, a.y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  FS.FX = FX;
})();
