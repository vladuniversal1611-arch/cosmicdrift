/* Renderer: camera, ground, depth-sorted world, particles, floating text, tracers, night lighting. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;

  // ---------------- pooled effects ----------------
  const MAXP = 260;
  const parts = [];
  for (let i = 0; i < MAXP; i++) parts.push({ on: false });
  let pIdx = 0;
  const texts = [];
  for (let i = 0; i < 28; i++) texts.push({ on: false });
  let tIdx = 0;
  const tracers = [];
  for (let i = 0; i < 10; i++) tracers.push({ on: false });
  let trIdx = 0;

  const FX = {
    burst(x, y, o) {
      o = o || {};
      const n = o.n || 10, colors = o.colors || ['#fff'];
      for (let i = 0; i < n; i++) {
        const p = parts[pIdx];
        pIdx = (pIdx + 1) % MAXP;
        const a = Math.random() * Math.PI * 2, sp = (o.speed || 80) * (0.4 + Math.random() * 0.8);
        p.on = true;
        p.x = x + (Math.random() - 0.5) * 6;
        p.y = y + (Math.random() - 0.5) * 3;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp * 0.6 - (o.up == null ? 60 : o.up);
        p.g = o.grav == null ? 260 : o.grav;
        p.max = p.life = (o.life || 0.6) * (0.7 + Math.random() * 0.5);
        p.size = (o.size || 3) * (0.6 + Math.random() * 0.8);
        p.color = colors[(Math.random() * colors.length) | 0];
        p.smoke = !!o.smoke;
      }
    },
    smoke(x, y) {
      const p = parts[pIdx];
      pIdx = (pIdx + 1) % MAXP;
      Object.assign(p, { on: true, x, y, vx: 4 + Math.random() * 6, vy: -16 - Math.random() * 8, g: -3, max: 2, life: 2, size: 3, color: 'rgba(200,200,210,1)', smoke: true });
    },
    text(x, y, str, color, big) {
      const t = texts[tIdx];
      tIdx = (tIdx + 1) % texts.length;
      Object.assign(t, { on: true, x, y, str, color: color || '#fff', max: big ? 1.4 : 1, life: big ? 1.4 : 1, big: !!big, dx: (Math.random() - 0.5) * 16 });
    },
    tracer(x0, y0, x1, y1) {
      const t = tracers[trIdx];
      trIdx = (trIdx + 1) % tracers.length;
      Object.assign(t, { on: true, x0, y0, x1, y1, life: 0.12, max: 0.12 });
    },
    update(dt) {
      for (let i = 0; i < MAXP; i++) {
        const p = parts[i];
        if (!p.on) continue;
        p.life -= dt;
        if (p.life <= 0) { p.on = false; continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.smoke) p.size += dt * 5;
      }
      texts.forEach((t) => { if (t.on) { t.life -= dt; if (t.life <= 0) t.on = false; } });
      tracers.forEach((t) => { if (t.on) { t.life -= dt; if (t.life <= 0) t.on = false; } });
    },
    clear() { parts.forEach((p) => { p.on = false; }); texts.forEach((t) => { t.on = false; }); tracers.forEach((t) => { t.on = false; }); },
  };

  const R = {
    canvas: null, ctx: null, w: 1, h: 1, dpr: 1,
    cam: { x: 0, y: 0, zoom: 1 }, target: { x: 0, y: 0, zoom: 1 },
    t: 0, shake: 0, hurt: 0,
    ents: [],
    lightCv: null,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.lightCv = document.createElement('canvas');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    },
    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, window.innerWidth);
      this.h = Math.max(1, window.innerHeight);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.lightCv.width = Math.ceil(this.w / 2);
      this.lightCv.height = Math.ceil(this.h / 2);
      if (BI.Game && BI.Game.ready) BI.Game.onResize();
    },
    gameplayZoom() { return D.clamp(Math.min(this.w / 420, this.h / 760), 0.85, 1.8); },
    w2s(wx, wy) {
      const z = this.cam.zoom;
      return { x: (wx - this.cam.x) * z + this.w / 2, y: (wy - this.cam.y) * z + this.h / 2 };
    },
    s2w(sx, sy) {
      const z = this.cam.zoom;
      return { x: (sx - this.w / 2) / z + this.cam.x, y: (sy - this.h / 2) / z + this.cam.y };
    },
    snap() { Object.assign(this.cam, this.target); },

    update(dt) {
      this.t += dt;
      const k = 1 - Math.exp(-dt * 8);
      this.cam.x += (this.target.x - this.cam.x) * k;
      this.cam.y += (this.target.y - this.cam.y) * k;
      this.cam.zoom += (this.target.zoom - this.cam.zoom) * (1 - Math.exp(-dt * 5));
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
      if (this.hurt > 0) this.hurt = Math.max(0, this.hurt - dt * 1.8);
      FX.update(dt);
    },

    worldTransform() {
      const z = this.cam.zoom, d = this.dpr;
      const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 10 : 0;
      const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 10 : 0;
      this.ctx.setTransform(d * z, 0, 0, d * z, d * (this.w / 2 - this.cam.x * z + sx), d * (this.h / 2 - this.cam.y * z + sy));
    },
    screenTransform() { this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); },

    render(game) {
      const ctx = this.ctx, map = game.map, t = this.t, W = BI.World;
      this.screenTransform();
      const bg = ctx.createRadialGradient(this.w / 2, this.h / 2, 50, this.w / 2, this.h / 2, Math.max(this.w, this.h));
      bg.addColorStop(0, '#1d262d');
      bg.addColorStop(1, '#0c1014');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, this.w, this.h);

      this.worldTransform();
      const g = game.ground;
      ctx.drawImage(g.canvas, -g.ox, -g.oy, g.w, g.h);

      if (game.state === 'BUILD_MODE') this.drawGrid(game);
      // exit zone pulse
      if (map.exit) {
        const p = W.iso(map.exit.x, map.exit.y);
        const k = 0.5 + 0.5 * Math.sin(t * 4);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 40 + k * 6, 20 + k * 3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(90,255,140,' + (0.5 + k * 0.4) + ')';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // target highlight
      const tg = game.target;
      if (tg && game.state === 'GAMEPLAY' && tg.kind !== 'zombie') {
        const p = W.iso(tg.o.gx + 0.5, tg.o.gy + 0.5);
        const k = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 22 + k * 3, 11 + k * 1.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = tg.ok === false ? 'rgba(255,90,90,0.8)' : 'rgba(255,255,255,' + (0.5 + k * 0.4) + ')';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      this.drawWorld(game, t);
      if (game.state === 'BUILD_MODE') this.drawGhost(game, t);

      // tracers
      tracers.forEach((tr) => {
        if (!tr.on) return;
        ctx.strokeStyle = 'rgba(255,230,140,' + (tr.life / tr.max) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tr.x0, tr.y0); ctx.lineTo(tr.x1, tr.y1); ctx.stroke();
      });
      // particles
      for (let i = 0; i < MAXP; i++) {
        const p = parts[i];
        if (!p.on) continue;
        const a = p.life / p.max;
        if (p.smoke) { ctx.globalAlpha = a * 0.45; D.circle(ctx, p.x, p.y, p.size, p.color); }
        else { ctx.globalAlpha = Math.min(1, a * 1.6); ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
      }
      ctx.globalAlpha = 1;

      this.screenTransform();
      this.drawNight(game);
      this.drawTexts();
      // damage vignette
      if (this.hurt > 0 || game.lowHp) {
        const a = Math.max(this.hurt * 0.6, game.lowHp ? 0.25 + 0.15 * Math.sin(t * 5) : 0);
        const v = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.3, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
        v.addColorStop(0, 'rgba(180,0,0,0)');
        v.addColorStop(1, 'rgba(180,0,0,' + a + ')');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, this.w, this.h);
      }
    },

    /** Darkness that follows the day clock; light around the player and campfires. */
    drawNight(game) {
      const dark = game.darkness;
      if (dark <= 0.02) return;
      const lc = this.lightCv, g = lc.getContext('2d');
      const sw = lc.width, sh = lc.height;
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, sw, sh);
      g.fillStyle = 'rgba(8,12,30,' + dark + ')';
      g.fillRect(0, 0, sw, sh);
      g.globalCompositeOperation = 'destination-out';
      const light = (wx, wy, r, a) => {
        const s = this.w2s(wx, wy);
        const x = s.x / 2, y = s.y / 2, rr = (r * this.cam.zoom) / 2;
        const gr = g.createRadialGradient(x, y, 0, x, y, rr);
        gr.addColorStop(0, 'rgba(0,0,0,' + a + ')');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      };
      const pp = BI.World.iso(game.player.x, game.player.y);
      light(pp.x, pp.y - 20, 190, 0.95);
      game.lights.forEach((l) => light(l.x, l.y, l.r, 0.9));
      this.ctx.drawImage(lc, 0, 0, this.w, this.h);
      // warm glow on top of fires
      this.ctx.globalCompositeOperation = 'lighter';
      game.lights.forEach((l) => {
        const s = this.w2s(l.x, l.y), rr = l.r * 0.5 * this.cam.zoom;
        const gr = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
        gr.addColorStop(0, 'rgba(255,150,60,' + 0.25 * dark + ')');
        gr.addColorStop(1, 'rgba(255,120,40,0)');
        this.ctx.fillStyle = gr;
        this.ctx.fillRect(s.x - rr, s.y - rr, rr * 2, rr * 2);
      });
      this.ctx.globalCompositeOperation = 'source-over';
    },

    drawGrid(game) {
      const ctx = this.ctx, W = BI.World, S = game.map.size;
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        let a = W.iso(i, 0), b = W.iso(i, S);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        a = W.iso(0, i); b = W.iso(S, i);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
    },

    drawGhost(game, t) {
      const ctx = this.ctx, W = BI.World, b = game.build;
      if (!b) return;
      const ok = !b.error;
      const a = W.iso(b.gx, b.gy), bb = W.iso(b.gx + 1, b.gy), c = W.iso(b.gx + 1, b.gy + 1), d = W.iso(b.gx, b.gy + 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
      ctx.fillStyle = b.demolish ? 'rgba(255,170,40,0.35)' : ok ? 'rgba(80,255,150,0.35)' : 'rgba(255,70,80,0.4)';
      ctx.fill();
      ctx.strokeStyle = b.demolish ? '#ffb030' : ok ? '#5dffa0' : '#ff5a64';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (!b.demolish) {
        const cen = W.iso(b.gx + 0.5, b.gy + 0.5);
        ctx.globalAlpha = 0.7;
        D.drawSprite(ctx, BI.Art.buildSprite(b.type, b.rot), cen.x, cen.y - 3);
        ctx.globalAlpha = 1;
      }
    },

    drawWorld(game, t) {
      const ctx = this.ctx, W = BI.World, map = game.map, now = game.now;
      const ents = this.ents;
      let n = 0;
      const push = (d, k, o) => {
        if (n >= ents.length) ents.push({});
        const e = ents[n++];
        e.d = d; e.k = k; e.o = o;
      };
      map.objs.forEach((o) => push(o.gx + o.gy + 1, 0, o));
      map.zombies.forEach((z) => push(z.x + z.y + (z.dead ? -0.5 : 0), 1, z));
      map.drops.forEach((dr) => push(dr.x + dr.y - 0.3, 3, dr));
      if (!game.playerDead) push(game.player.x + game.player.y, 2, game.player);
      const list = ents.slice(0, n).sort((a, b) => a.d - b.d);
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (e.k === 0) this.drawObj(game, e.o, t, now);
        else if (e.k === 1) { const p = W.iso(e.o.x, e.o.y); BI.Entities.drawZombie(ctx, e.o, p.x, p.y, t); }
        else if (e.k === 3) {
          const p = W.iso(e.o.x, e.o.y);
          const bob = Math.sin(t * 3 + e.o.x) * 2;
          D.shadow(ctx, p.x, p.y, 9, 4, 0.3);
          D.roundRect(ctx, p.x - 9, p.y - 18 + bob, 18, 14, 4);
          ctx.fillStyle = '#6b4a2a';
          ctx.fill();
          ctx.fillStyle = '#c9a050';
          ctx.fillRect(p.x - 7, p.y - 12 + bob, 14, 2);
        } else {
          const p = W.iso(e.o.x, e.o.y);
          BI.Entities.drawPlayer(ctx, e.o, p.x, p.y, t, game.handKind());
        }
      }
    },

    drawObj(game, o, t, now) {
      const ctx = this.ctx, W = BI.World;
      const c = W.iso(o.gx + 0.5, o.gy + 0.5);
      let spr = null;
      if (o.k === 'node') {
        spr = BI.Art.nodeSprite(o, game.map.id);
        if (spr) {
          ctx.save();
          ctx.translate(c.x, c.y);
          if (o.shakeT > 0) { ctx.translate(Math.sin(t * 60) * 2.5 * o.shakeT * 4, 0); }
          if (o.type === 'tree' && o.respawnAt === 0) ctx.transform(1, 0, Math.sin(t * 1.3 + o.v * 9) * 0.025, 1, 0, 0);
          D.drawSprite(ctx, spr, 0, 0);
          ctx.restore();
        }
        return;
      }
      if (o.k === 'cont') spr = BI.Art.containerSprite(o);
      else if (o.k === 'obst') spr = BI.Art.obstacleSprite(o);
      else if (o.k === 'well') spr = BI.Art.wellSprite();
      else if (o.k === 'exit') spr = BI.Art.exitSprite();
      else if (o.k === 'build') spr = BI.Art.buildSprite(o.type, o.rot);
      if (spr) {
        ctx.save();
        ctx.translate(c.x, c.y);
        if (o.shakeT > 0) ctx.translate(Math.sin(t * 60) * 2 * o.shakeT * 4, 0);
        if (o.k === 'build' && o.buildT != null) {
          const k = Math.min(1, (t - o.buildT) / 0.45);
          const s = 0.8 + 0.2 * D.easeOutBack(k);
          ctx.scale(s, s);
          if (k >= 1) o.buildT = null;
        }
        D.drawSprite(ctx, spr, 0, 0);
        ctx.restore();
      }
      if (o.k === 'build') {
        const def = BI.Data.BUILD[o.type];
        if (o.type === 'campfire') {
          const f = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
          ctx.globalAlpha = 0.6;
          D.drawSprite(ctx, D.glow('#ff8a1f', 26), c.x, c.y - 8);
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(c.x - 7, c.y - 2);
          ctx.quadraticCurveTo(c.x - 6, c.y - 12 - f * 6, c.x, c.y - 20 - f * 4);
          ctx.quadraticCurveTo(c.x + 6, c.y - 12 - f * 6, c.x + 7, c.y - 2);
          ctx.closePath();
          ctx.fillStyle = '#ff8a1f';
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(c.x - 3, c.y - 2);
          ctx.quadraticCurveTo(c.x, c.y - 11 - f * 3, c.x + 3, c.y - 2);
          ctx.fillStyle = '#ffe08a';
          ctx.fill();
        } else if (o.type === 'furnace') {
          const p = D.facePt('left', 0.76, 0.76, 0.5, 9);
          ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 7);
          D.drawSprite(ctx, D.glow('#ff6a1f', 14), c.x + p[0], c.y + p[1]);
          ctx.globalAlpha = 1;
        }
        // hp bar for damaged walls
        if (def.hp && o.hp < def.hp) {
          const w = 34, y = c.y - def.h - 14;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(c.x - w / 2, y, w, 4);
          ctx.fillStyle = o.hp / def.hp > 0.4 ? '#7cd957' : '#ff5a4a';
          ctx.fillRect(c.x - w / 2, y, w * (o.hp / def.hp), 4);
        }
        // produce bubble
        if (def.produce && game.isReady(o)) {
          const y = c.y - def.h - 14 + Math.sin(t * 3 + o.gx) * 3;
          D.circle(ctx, c.x, y, 12, 'rgba(255,255,255,0.95)');
          const im = BI.Data.iconImg(def.produce.item);
          if (im.complete) ctx.drawImage(im, c.x - 9, y - 9, 18, 18);
        }
      }
      // search progress ring
      if (game.searching && game.searching.o === o) {
        const k = game.searching.p;
        const y = c.y - 46;
        D.circle(ctx, c.x, y, 12, 'rgba(10,20,30,0.75)');
        ctx.beginPath();
        ctx.arc(c.x, y, 10, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },

    drawTexts() {
      const ctx = this.ctx;
      const z = D.clamp(this.cam.zoom, 0.8, 1.4);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      texts.forEach((tx) => {
        if (!tx.on) return;
        const k = 1 - tx.life / tx.max;
        const s = this.w2s(tx.x, tx.y);
        const pop = k < 0.15 ? D.easeOutBack(k / 0.15) : 1;
        const size = (tx.big ? 22 : 16) * z * pop;
        ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        ctx.font = '900 ' + size.toFixed(1) + 'px "Trebuchet MS", system-ui, sans-serif';
        const y = s.y - k * 40 * z;
        ctx.lineWidth = size * 0.28;
        ctx.strokeStyle = 'rgba(10,10,15,0.85)';
        ctx.strokeText(tx.str, s.x + tx.dx * k, y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.str, s.x + tx.dx * k, y);
      });
      ctx.globalAlpha = 1;
    },
  };

  BI.Renderer = R;
  BI.FX = FX;
})();
