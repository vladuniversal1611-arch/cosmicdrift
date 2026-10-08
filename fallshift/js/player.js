/* FALLSHIFT — the energy core: state, resources and rendering. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;
  const C = FS.C;

  const TRAIL = 22;
  const coreCache = new Map();

  function coreSprite(color, coreColor) {
    const key = color + coreColor;
    let c = coreCache.get(key);
    if (c) return c;
    const s = 64;
    c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(s * 0.42, s * 0.4, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.3, coreColor);
    gr.addColorStop(0.68, color);
    gr.addColorStop(0.92, U.mix(color, '#000022', 0.45));
    gr.addColorStop(1, U.rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(s / 2, s / 2, s / 2, 0, U.TAU);
    g.fill();
    coreCache.set(key, c);
    return c;
  }

  class Player {
    constructor() {
      this.trail = new Float32Array(TRAIL);
      this.trailN = 0;
      this.trailI = 0;
      this.reset({ shields: 1, maxEnergy: 100 });
    }

    reset(stats) {
      this.y = 30;
      this.vy = 0;
      this.gDir = 1;
      this.gTimer = 0;
      this.dashTimer = 0;
      this.invuln = 0;
      this.maxShield = stats.shields;
      this.shield = stats.shields;
      this.maxEnergy = stats.maxEnergy;
      this.energy = stats.maxEnergy * 0.6;
      this.breakCharge = 0;
      this.phase = 0;
      this.alive = true;
      this.squash = 0;
      this.hurtT = 0;
      this.trailN = 0;
      this.trailI = 0;
      this.spin = 0;
    }

    addEnergy(v) {
      this.energy = U.clamp(this.energy + v, 0, this.maxEnergy);
    }

    pushTrail(py) {
      this.trail[this.trailI] = py;
      this.trailI = (this.trailI + 1) % TRAIL;
      if (this.trailN < TRAIL) this.trailN++;
    }

    // projected world y of the core (what is drawn)
    projY() {
      return this.y + C.MID * C.K;
    }

    colors(skin, time) {
      if (skin.glow === 'rainbow') {
        const h = Math.round(((time * 60) % 360) / 15) * 15;
        const c = U.hslHex(h, 100, 62);
        return { glow: c, trail: U.hslHex((h + 40) % 360, 100, 60), core: '#ffffff' };
      }
      return skin;
    }

    render(ctx, camY, skin, combo, fever, time, dt) {
      if (!this.alive) return;
      const cx = C.LW / 2;
      const py = this.projY() - camY;
      const col = this.colors(skin, time);
      const heat = Math.min(1, combo / 12);
      const glowCol = fever ? '#ffd27a' : col.glow;
      const trailCol = fever ? '#ff9a3c' : this.gDir < 0 ? '#b06bff' : col.trail;
      this.spin += dt * (3 + combo * 0.3);

      ctx.globalCompositeOperation = 'lighter';
      // trail
      const len = Math.min(this.trailN, 8 + Math.round(heat * 12) + (this.dashTimer > 0 || fever ? 6 : 0));
      for (let k = 1; k < len; k++) {
        const idx = (this.trailI - 1 - k + TRAIL * 2) % TRAIL;
        const ty = this.trail[idx] - camY;
        const f = 1 - k / len;
        const s = (C.CORE_R * 2.6 + heat * 10) * (0.35 + f * 0.75);
        ctx.globalAlpha = f * (0.35 + heat * 0.35);
        ctx.drawImage(FS.getGlow(trailCol), cx - s / 2, ty - s / 2, s, s);
      }
      // outer glow
      const blink = this.invuln > 0 && Math.sin(time * 40) > 0 ? 0.45 : 1;
      const gs = 70 + heat * 50 + (fever ? 50 : 0) + Math.sin(time * 6) * 4;
      ctx.globalAlpha = (0.55 + heat * 0.3) * blink;
      ctx.drawImage(FS.getGlow(glowCol), cx - gs / 2, py - gs / 2, gs, gs);
      if (fever) {
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 18);
        const fs = gs * 1.5;
        ctx.drawImage(FS.getGlow('#ff6a1a'), cx - fs / 2, py - fs / 2, fs, fs);
      }
      if (this.gDir < 0) {
        ctx.globalAlpha = 0.6;
        const s2 = 90;
        ctx.drawImage(FS.getGlow('#9a4dff'), cx - s2 / 2, py - s2 / 2, s2, s2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // body (squash & stretch)
      this.squash = Math.max(0, this.squash - dt * 5);
      let sx = 1 + this.squash * 0.35, sy = 1 - this.squash * 0.3;
      if (this.dashTimer > 0) {
        sx = 0.78;
        sy = 1.45;
      } else {
        const v = Math.min(1, Math.abs(this.vy) / 900);
        sx *= 1 - v * 0.1;
        sy *= 1 + v * 0.15;
      }
      const r = C.CORE_R;
      ctx.globalAlpha = blink;
      ctx.drawImage(coreSprite(glowCol, col.core), cx - r * sx * 1.25, py - r * sy * 1.25, r * 2.5 * sx, r * 2.5 * sy);

      // orbiting energy arcs
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.7 * blink;
      ctx.beginPath();
      ctx.ellipse(cx, py, r * 1.6, r * 0.55, this.spin * 0.3, this.spin, this.spin + 2.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, py, r * 1.5, r * 0.5, -this.spin * 0.25 + 1, -this.spin * 1.2, -this.spin * 1.2 + 1.8);
      ctx.stroke();

      // shield bubble
      if (this.shield > 0) {
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3);
        ctx.strokeStyle = '#9ff4ff';
        ctx.lineWidth = 1.5;
        const n = this.shield;
        const gap = 0.35;
        const seg = (U.TAU - gap * n) / n;
        for (let k = 0; k < n; k++) {
          const a0 = -time * 0.8 + k * (seg + gap);
          ctx.beginPath();
          ctx.arc(cx, py, r + 9, a0, a0 + seg);
          ctx.stroke();
        }
      }
      if (this.phase > 0) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#c08bff';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(cx, py, r + 14, time * 1.5, time * 1.5 + U.TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  FS.Player = Player;
})();
