/* FALLSHIFT — boss floors: REACTOR CORE.
   A sealed arena ring spins around a giant reactor. The reactor fires lasers, drops debris,
   spikes segments and electrifies the floor (leaving temporary safe zones).
   Damage it by landing on glowing WEAK POINTS (DASH = double damage) or with BREAK. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;
  const C = FS.C;
  const LASER_H = 150;

  class Boss {
    constructor(game, ring, level) {
      this.game = game;
      this.ring = ring;
      this.level = level;
      this.name = 'REACTOR CORE';
      this.maxHp = 8 + level * 4;
      this.hp = this.maxHp;
      this.t = 0;
      this.state = 'intro';
      this.stateT = 2.2;
      this.nextAttack = 1.2;
      this.lasers = [];
      this.debris = [];
      this.weakTimer = 0.3;
      this.hitFlash = 0;
      this.overload = null;
      this.spinDir = 1;
      ring.spinSpeed = 0.3;
      for (const s of ring.segs) {
        s.bstate = null;
        s.tele = 0;
        s.bt = 0;
      }
      this.lastAttack = '';
    }

    get hpFrac() {
      return this.hp / this.maxHp;
    }

    coreRel() {
      return this.game.tower.coreRel(this.ring);
    }

    coreHeight() {
      return this.ring.y - (this.game.player.y + C.CORE_R);
    }

    update(dt) {
      this.t += dt;
      const r = this.ring;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.state === 'intro') {
        this.stateT -= dt;
        if (this.stateT <= 0) this.state = 'fight';
      } else if (this.state === 'dying') {
        this.stateT -= dt;
        const g = this.game;
        if (Math.random() < dt * 14) {
          const x = C.LW / 2 + (Math.random() - 0.5) * 120;
          const y = r.y - 78 + (Math.random() - 0.5) * 100;
          g.fx.burst(x, y, 14, 260, '#ffb347', { size: 14, life: 0.6, colors: ['#ffb347', '#ffffff', '#ff5a1a'] });
          g.fx.shake(6);
        }
        if (this.stateT <= 0) {
          this.state = 'dead';
          g.onBossDefeated(this);
        }
        return;
      } else if (this.state === 'dead') {
        return;
      }

      // spin faster as HP drops; occasionally reverse
      const rage = 1 - this.hpFrac;
      r.spinSpeed = this.spinDir * (0.3 + rage * 0.7 + this.level * 0.08);

      // segment timers
      for (const s of r.segs) {
        if (s.tele > 0) {
          s.tele -= dt;
          if (s.tele <= 0 && s.pending) {
            s.bstate = s.pending;
            s.pending = null;
          }
        }
        if (s.bt > 0) {
          s.bt -= dt;
          if (s.bt <= 0 && (s.bstate === 'spike' || s.bstate === 'shock' || s.bstate === 'safe')) s.bstate = null;
        }
      }

      if (this.state !== 'fight') return;

      // weak points
      let weak = 0;
      for (const s of r.segs) if (s.bstate === 'weak' || s.pending === 'weak') weak++;
      if (weak < 2) {
        this.weakTimer -= dt;
        if (this.weakTimer <= 0) {
          this.weakTimer = 1.1;
          const under = this.game.tower.segIndex(r, this.coreRel());
          const free = [];
          for (let i = 0; i < r.n; i++) if (!r.segs[i].bstate && !r.segs[i].pending && i !== under) free.push(i);
          if (free.length) {
            const i = free[(Math.random() * free.length) | 0];
            r.segs[i].bstate = 'weak';
            r.segs[i].flash = 0.3;
          }
        }
      }

      // attacks
      if (!this.overload) {
        this.nextAttack -= dt;
        if (this.nextAttack <= 0) {
          this.startAttack();
          this.nextAttack = Math.max(1.3, 3 - this.level * 0.2 - rage * 1.1);
        }
      } else {
        const o = this.overload;
        o.t -= dt;
        if (o.phase === 'tele' && o.t <= 0) {
          o.phase = 'on';
          o.t = 2.4;
          for (let i = 0; i < r.n; i++) {
            const s = r.segs[i];
            if (s.bstate === 'weak') continue;
            s.bstate = o.safe.indexOf(i) >= 0 ? 'safe' : 'shock';
            s.bt = 2.4;
          }
          FS.Audio.play('laser');
          this.game.fx.flash(FS.WORLDS[r.world].danger, 0.15);
        } else if (o.phase === 'on' && o.t <= 0) {
          this.overload = null;
          for (const s of r.segs) if (s.bstate === 'shock' || s.bstate === 'safe') s.bstate = null;
        }
      }

      // lasers
      const p = this.game.player;
      const crel = this.coreRel();
      for (let k = this.lasers.length - 1; k >= 0; k--) {
        const l = this.lasers[k];
        l.t += dt;
        l.rel += l.sweep * dt;
        if (l.t > l.tele + l.on) {
          this.lasers.splice(k, 1);
          continue;
        }
        if (l.t > l.tele && !l.fired) {
          l.fired = true;
          FS.Audio.play('laser');
        }
        if (l.t > l.tele && p.alive && Math.abs(U.angDiff(crel, l.rel)) < 0.17 && this.coreHeight() < LASER_H - 10 && this.coreHeight() > -40) {
          this.game.hurt('laser');
        }
      }

      // debris
      for (let k = this.debris.length - 1; k >= 0; k--) {
        const d = this.debris[k];
        d.t -= dt;
        if (d.t <= 0) {
          this.debris.splice(k, 1);
          const g = this.game;
          const out = { x: 0, y: 0 };
          const a = g.tower.ringAngle(r) + d.rel;
          out.x = C.LW / 2 + Math.cos(a) * C.MID;
          out.y = r.y + Math.sin(a) * C.MID * C.K;
          g.fx.burst(out.x, out.y, 16, 240, '#8a7a8a', { kind: 1, size: 7, life: 0.8, grav: 900, up: -200, colors: ['#5a4a5a', '#ffb347', '#8a7a8a'] });
          g.fx.wave(out.x, out.y, '#ffb347', 50, 0.35);
          g.fx.shake(4);
          FS.Audio.play('crumble');
          if (p.alive && Math.abs(U.angDiff(this.coreRel(), d.rel)) < 0.3 && this.coreHeight() < 85) g.hurt('debris');
        }
      }
    }

    startAttack() {
      const r = this.ring;
      const opts = ['spikes', 'laser', 'debris', 'overload'].filter((a) => a !== this.lastAttack);
      const a = opts[(Math.random() * opts.length) | 0];
      this.lastAttack = a;
      const crel = this.coreRel();
      const danger = FS.WORLDS[r.world].danger;
      if (a === 'spikes') {
        const cnt = 3 + Math.min(2, this.level - 1) + (this.hpFrac < 0.5 ? 1 : 0);
        const free = [];
        for (let i = 0; i < r.n; i++) if (!r.segs[i].bstate && !r.segs[i].pending) free.push(i);
        U.shuffle(Math.random, free);
        for (let k = 0; k < Math.min(cnt, free.length); k++) {
          const s = r.segs[free[k]];
          s.pending = 'spike';
          s.tele = 0.9;
          s.teleColor = danger;
          s.bt = 0.9 + 3.8;
        }
        FS.Audio.play('warn');
      } else if (a === 'laser') {
        const cnt = this.hpFrac < 0.5 ? 3 : 2;
        for (let k = 0; k < cnt; k++) {
          const off = k === 0 ? (Math.random() - 0.5) * 0.3 : (k % 2 ? 1 : -1) * (0.9 + Math.random() * 0.8);
          this.lasers.push({ rel: crel + off, t: 0, tele: 1.0, on: 1.1, sweep: (Math.random() - 0.5) * 0.8, fired: false });
        }
        FS.Audio.play('warn');
      } else if (a === 'debris') {
        const cnt = 3 + (this.hpFrac < 0.5 ? 2 : 0);
        for (let k = 0; k < cnt; k++) {
          const rel = k === 0 ? crel : Math.random() * U.TAU;
          this.debris.push({ rel, t: 1.1 + k * 0.28, max: 1.1 + k * 0.28 });
        }
      } else {
        // overload: whole floor electrified except two safe zones
        const safeA = (Math.random() * r.n) | 0;
        const safe = [safeA, (safeA + 1) % r.n];
        if (this.hpFrac > 0.5) safe.push((safeA + 5) % r.n);
        this.overload = { phase: 'tele', t: 1.3, safe };
        for (let i = 0; i < r.n; i++) {
          const s = r.segs[i];
          if (s.bstate === 'weak') continue;
          s.pending = null;
          s.bstate = null;
          s.tele = 1.3;
          s.teleColor = safe.indexOf(i) >= 0 ? '#bff8ff' : danger;
        }
        FS.Audio.play('warn');
        this.game.ui.banner('OVERLOAD', 'FIND A SAFE ZONE', '#ff3d6a', 1.1);
      }
      if (Math.random() < 0.25) this.spinDir *= -1;
    }

    // core landed on the arena ring; returns 'hurt' | 'hit' | 'land'
    onLand(idx, dashing) {
      const s = this.ring.segs[idx];
      if (this.state === 'dying' || this.state === 'dead') return 'land';
      if (s.bstate === 'weak') {
        s.bstate = null;
        s.flash = 0.4;
        this.damage(dashing ? 2 : 1, idx);
        return 'hit';
      }
      if (s.bstate === 'spike' || s.bstate === 'shock') return 'hurt';
      return 'land';
    }

    damage(n, idx) {
      if (this.state !== 'fight' && this.state !== 'intro') return;
      const g = this.game;
      this.hp = Math.max(0, this.hp - n);
      this.hitFlash = 0.25;
      g.fx.shake(9);
      g.fx.flash('#ffb347', 0.25);
      const rx = C.LW / 2, ry = this.ring.y - 78;
      g.fx.burst(rx, ry, 26, 320, '#ffb347', { size: 12, life: 0.6, colors: ['#ffffff', '#ffb347', '#ff5a1a'] });
      g.fx.text(rx, ry - 50, '-' + n, '#ffcf6a', 28, 1);
      g.addScore(150 * n, false);
      FS.Audio.play('bosshit');
      if (this.hp <= 0) {
        this.state = 'dying';
        this.stateT = 1.8;
        this.lasers.length = 0;
        this.debris.length = 0;
        this.overload = null;
        for (const s of this.ring.segs) {
          s.bstate = null;
          s.pending = null;
          s.tele = 0;
        }
        FS.Audio.play('bossdie');
      }
    }

    onBreak() {
      // BREAK overloads the reactor: heavy damage + clears every active hazard
      for (const s of this.ring.segs) {
        if (s.bstate !== 'weak') {
          s.bstate = null;
          s.pending = null;
          s.tele = 0;
        }
      }
      this.overload = null;
      this.lasers.length = 0;
      this.debris.length = 0;
      this.nextAttack = Math.max(this.nextAttack, 1.6);
      this.damage(2);
    }

    // ---------------------------------------------------------------- rendering
    renderReactor(ctx, camY, time) {
      const r = this.ring;
      const x = C.LW / 2;
      const y = r.y - camY - 78;
      const dying = this.state === 'dying';
      const pulse = 1 + Math.sin(time * (dying ? 30 : 4)) * 0.04;
      const R = 44 * pulse * (dying ? 1 + (1.8 - this.stateT) * 0.15 : 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(FS.getGlow('#ff7a1a'), x - 170, y - 150, 340, 300);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(FS.getGlow('#ffb347', true), x - R * 2.2, y - R * 2.2, R * 4.4, R * 4.4);
      // energy tendrils to weak points
      ctx.lineWidth = 2;
      for (let i = 0; i < r.n; i++) {
        const s = r.segs[i];
        if (s.bstate !== 'weak') continue;
        const a = this.game.tower.ringAngle(r) + (i + 0.5) * r.w;
        const tx = x + Math.cos(a) * C.MID, ty = r.y - camY + Math.sin(a) * C.MID * C.K;
        ctx.strokeStyle = '#ffb347';
        ctx.globalAlpha = 0.35 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 1; k <= 6; k++) {
          const f = k / 6;
          ctx.lineTo(U.lerp(x, tx, f) + (k < 6 ? (Math.random() - 0.5) * 14 : 0), U.lerp(y, ty, f) + (k < 6 ? (Math.random() - 0.5) * 10 : 0));
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      // sphere
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
      const hit = this.hitFlash > 0;
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, hit ? '#ffffff' : '#ffe0a0');
      g.addColorStop(0.7, hit ? '#ffd0a0' : '#ff8a1f');
      g.addColorStop(1, '#5a1a06');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, U.TAU);
      ctx.fill();
      // armor plates
      ctx.strokeStyle = 'rgba(40,12,4,0.85)';
      ctx.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(x, y, R, R * (0.25 + k * 0.3), 0, 0, U.TAU);
        ctx.stroke();
      }
      // orbit rings
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = k === 1 ? '#ffffff' : '#ffb347';
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = k === 1 ? 1.2 : 2;
        ctx.beginPath();
        const rot = time * (0.8 + k * 0.5) * (k % 2 ? -1 : 1);
        ctx.ellipse(x, y, R * (1.45 + k * 0.22), R * (0.35 + k * 0.08), (k - 1) * 0.35, rot, rot + 4.2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    renderOver(ctx, camY, time) {
      const r = this.ring;
      const base = this.game.tower.ringAngle(r);
      const cx = C.LW / 2;
      const y = r.y - camY;
      const danger = FS.WORLDS[r.world].danger;
      ctx.globalCompositeOperation = 'lighter';
      for (const l of this.lasers) {
        const a = base + l.rel;
        const c = Math.cos(a), s = Math.sin(a);
        const xi = cx + c * C.R_IN, yi = y + s * C.R_IN * C.K;
        const xo = cx + c * (C.R_OUT + 8), yo = y + s * (C.R_OUT + 8) * C.K;
        if (l.t < l.tele) {
          ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(time * 18));
          ctx.strokeStyle = danger;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(xi, yi);
          ctx.lineTo(xo, yo);
          ctx.moveTo(xo, yo);
          ctx.lineTo(xo, yo - LASER_H);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const k = Math.min(1, (l.t - l.tele) / 0.08);
          ctx.globalAlpha = 0.3 * k;
          ctx.fillStyle = danger;
          ctx.beginPath();
          ctx.moveTo(xi, yi);
          ctx.lineTo(xo, yo);
          ctx.lineTo(xo, yo - LASER_H);
          ctx.lineTo(xi, yi - LASER_H);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = k;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let h = 10; h < LASER_H; h += 20) {
            ctx.moveTo(xi, yi - h);
            ctx.lineTo(xo, yo - h);
          }
          ctx.stroke();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(FS.getGlow(danger, true), xo - 16, yo - LASER_H - 16, 32, 32);
        }
      }
      for (const d of this.debris) {
        const a = base + d.rel;
        const x = cx + Math.cos(a) * C.MID;
        const gy = y + Math.sin(a) * C.MID * C.K;
        const k = 1 - d.t / d.max;
        // shadow
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.25 + k * 0.5;
        ctx.fillStyle = '#ff3d3d';
        ctx.beginPath();
        ctx.ellipse(x, gy, 10 + k * 18, (10 + k * 18) * 0.4, 0, 0, U.TAU);
        ctx.fill();
        // falling chunk
        const fy = gy - d.t * 520;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2a2026';
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(x, fy);
        ctx.rotate(time * 4 + d.rel);
        ctx.beginPath();
        ctx.moveTo(-12, -6);
        ctx.lineTo(-2, -13);
        ctx.lineTo(12, -4);
        ctx.lineTo(8, 10);
        ctx.lineTo(-9, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  FS.Boss = Boss;
})();
