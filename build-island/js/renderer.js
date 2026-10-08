/* Renderer: one canvas, camera, background, island, entities, particles, floating text. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;

  // ---------------- particles & floating text (pooled) ----------------
  const MAXP = 260;
  const parts = [];
  for (let i = 0; i < MAXP; i++) parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, size: 2, color: '#fff', smoke: false });
  let pIdx = 0;
  const texts = [];
  for (let i = 0; i < 24; i++) texts.push({ on: false, x: 0, y: 0, str: '', color: '#fff', life: 0, max: 1.2, big: false });
  let tIdx = 0;
  const rings = [];
  for (let i = 0; i < 8; i++) rings.push({ on: false, x: 0, y: 0, life: 0, max: 0.6, color: '#fff' });
  let rIdx = 0;

  const FX = {
    burst(x, y, o) {
      o = o || {};
      const n = o.n || 12, colors = o.colors || ['#ffffff'];
      for (let i = 0; i < n; i++) {
        const p = parts[pIdx];
        pIdx = (pIdx + 1) % MAXP;
        const a = Math.random() * Math.PI * 2;
        const sp = (o.speed || 80) * (0.4 + Math.random() * 0.8);
        p.on = true;
        p.x = x + (Math.random() - 0.5) * (o.spread || 6);
        p.y = y + (Math.random() - 0.5) * (o.spread || 6) * 0.5;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp * 0.6 - (o.up == null ? 60 : o.up);
        p.g = o.grav == null ? 260 : o.grav;
        p.max = p.life = (o.life || 0.7) * (0.7 + Math.random() * 0.5);
        p.size = (o.size || 3) * (0.6 + Math.random() * 0.8);
        p.color = colors[(Math.random() * colors.length) | 0];
        p.smoke = !!o.smoke;
      }
    },
    smoke(x, y) {
      const p = parts[pIdx];
      pIdx = (pIdx + 1) % MAXP;
      p.on = true;
      p.x = x; p.y = y;
      p.vx = 6 + Math.random() * 6; p.vy = -18 - Math.random() * 8; p.g = -4;
      p.max = p.life = 2.2;
      p.size = 3;
      p.color = 'rgba(235,235,245,1)';
      p.smoke = true;
    },
    text(x, y, str, color, big) {
      const t = texts[tIdx];
      tIdx = (tIdx + 1) % texts.length;
      t.on = true; t.x = x; t.y = y; t.str = str; t.color = color || '#fff'; t.max = t.life = big ? 1.6 : 1.2; t.big = !!big;
    },
    ring(x, y, color) {
      const r = rings[rIdx];
      rIdx = (rIdx + 1) % rings.length;
      r.on = true; r.x = x; r.y = y; r.max = r.life = 0.55; r.color = color || '#ffffff';
    },
    update(dt) {
      for (let i = 0; i < MAXP; i++) {
        const p = parts[i];
        if (!p.on) continue;
        p.life -= dt;
        if (p.life <= 0) { p.on = false; continue; }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.smoke) p.size += dt * 5;
      }
      for (let i = 0; i < texts.length; i++) {
        const t = texts[i];
        if (!t.on) continue;
        t.life -= dt;
        if (t.life <= 0) t.on = false;
      }
      for (let i = 0; i < rings.length; i++) {
        const r = rings[i];
        if (!r.on) continue;
        r.life -= dt;
        if (r.life <= 0) r.on = false;
      }
    },
    clear() {
      parts.forEach((p) => { p.on = false; });
      texts.forEach((t) => { t.on = false; });
      rings.forEach((r) => { r.on = false; });
    },
  };

  // ---------------- background patterns ----------------
  function makeTile(style, theme) {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const r = BI.Island.rng(BI.Island.hashStr(style + theme.bg[0]));
    if (style === 'ocean') {
      g.strokeStyle = 'rgba(255,255,255,0.28)';
      g.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = r() * S, y = r() * S, w = 8 + r() * 18;
        g.lineWidth = 1.5 + r() * 1.5;
        g.beginPath();
        g.moveTo(x - w, y);
        g.quadraticCurveTo(x - w / 2, y - 4, x, y);
        g.quadraticCurveTo(x + w / 2, y + 4, x + w, y);
        g.stroke();
      }
      for (let i = 0; i < 18; i++) D.circle(g, r() * S, r() * S, 1 + r() * 1.2, 'rgba(255,255,255,0.35)');
    } else if (style === 'lava') {
      for (let i = 0; i < 16; i++) {
        const x = r() * S, y = r() * S, rad = 10 + r() * 26;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,220,90,0.55)');
        gr.addColorStop(1, 'rgba(255,120,20,0)');
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.strokeStyle = 'rgba(40,0,0,0.35)';
      g.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        let x = r() * S, y = r() * S;
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); }
        g.stroke();
      }
    } else if (style === 'stars' || style === 'grid') {
      for (let i = 0; i < 70; i++) D.circle(g, r() * S, r() * S, r() < 0.9 ? 0.6 + r() * 0.8 : 1.6, 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')');
      if (style === 'stars') {
        for (let i = 0; i < 2; i++) {
          const x = r() * S, y = r() * S;
          const gr = g.createRadialGradient(x, y, 0, x, y, 40);
          gr.addColorStop(0, 'rgba(150,110,255,0.25)');
          gr.addColorStop(1, 'rgba(150,110,255,0)');
          g.fillStyle = gr;
          g.fillRect(x - 40, y - 40, 80, 80);
        }
      } else {
        g.strokeStyle = 'rgba(255,79,216,0.22)';
        g.lineWidth = 1;
        for (let k = 0; k <= S; k += 32) {
          g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.stroke();
          g.beginPath(); g.moveTo(0, k); g.lineTo(S, k); g.stroke();
        }
      }
    } else if (style === 'sky') {
      for (let i = 0; i < 9; i++) {
        const x = r() * S, y = r() * S;
        for (let k = 0; k < 4; k++) D.circle(g, x + k * 9 - 14, y + (k % 2) * -5, 10 + r() * 6, 'rgba(255,255,255,0.35)');
      }
    }
    return cv;
  }

  function makeCloud() {
    return D.sprite('cloud', 240, 140, 120, 72, (g) => {
      const puffs = [[-60, 10, 30], [-25, -8, 40], [20, -14, 44], [62, 6, 30], [0, 16, 36], [-40, 22, 26], [45, 22, 28]];
      puffs.forEach((p) => {
        const gr = g.createRadialGradient(p[0] - p[2] * 0.3, p[1] - p[2] * 0.4, p[2] * 0.1, p[0], p[1], p[2]);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(0.7, '#f4f9ff');
        gr.addColorStop(1, '#d6e6f7');
        D.circle(g, p[0], p[1], p[2], gr);
      });
    });
  }

  const R = {
    canvas: null, ctx: null, w: 1, h: 1, dpr: 1,
    cam: { x: 0, y: 0, zoom: 1 },
    target: { x: 0, y: 0, zoom: 1 },
    bob: 0, t: 0,
    tiles: {}, clouds: [], cloudSprite: null,
    ents: [],

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cloudSprite = makeCloud();
      for (let i = 0; i < 9; i++) {
        this.clouds.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 0.9, sp: 0.004 + Math.random() * 0.008, above: i < 3 });
      }
      for (let i = 0; i < 64; i++) this.ents.push({ d: 0, k: 0, o: null });
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
      if (BI.Game && BI.Game.ready) BI.Game.onResize();
    },

    gameplayZoom() { return D.clamp(Math.min(this.w / 400, this.h / 720), 0.85, 1.9); },
    fitZoom(size, frac) {
      const isl = size * 64;
      return D.clamp(Math.min((this.w * frac) / isl, (this.h * 0.5) / (size * 32 + 120)), 0.3, this.gameplayZoom());
    },

    w2s(wx, wy) {
      const z = this.cam.zoom;
      return { x: (wx - this.cam.x) * z + this.w / 2, y: (wy + this.bob - this.cam.y) * z + this.h / 2 };
    },
    s2w(sx, sy) {
      const z = this.cam.zoom;
      return { x: (sx - this.w / 2) / z + this.cam.x, y: (sy - this.h / 2) / z + this.cam.y - this.bob };
    },
    snap() {
      this.cam.x = this.target.x;
      this.cam.y = this.target.y;
      this.cam.zoom = this.target.zoom;
    },

    update(dt) {
      this.t += dt;
      this.bob = Math.sin(this.t * 0.9) * 3;
      const k = 1 - Math.exp(-dt * 7);
      this.cam.x += (this.target.x - this.cam.x) * k;
      this.cam.y += (this.target.y - this.cam.y) * k;
      this.cam.zoom += (this.target.zoom - this.cam.zoom) * (1 - Math.exp(-dt * 5));
      this.clouds.forEach((c) => { c.x += c.sp * dt; if (c.x > 1.3) c.x -= 1.6; });
      FX.update(dt);
    },

    tileFor(theme) {
      const key = theme.bgStyle + theme.bg[0];
      if (!this.tiles[key]) this.tiles[key] = this.ctx.createPattern(makeTile(theme.bgStyle, theme), 'repeat');
      return this.tiles[key];
    },

    drawBackground(theme) {
      const ctx = this.ctx, w = this.w, h = this.h, t = this.t;
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, theme.bg[1]);
      bg.addColorStop(1, theme.bg[0]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      const pat = this.tileFor(theme);
      const z = this.cam.zoom;
      const layers = theme.bgStyle === 'ocean' ? [[0.22, 10, 0.9], [0.32, -7, 0.55]] : theme.bgStyle === 'lava' ? [[0.22, 4, 1], [0.3, -3, 0.6]] : [[0.12, 1.5, 1], [0.2, 3, 0.7]];
      layers.forEach((L, i) => {
        const ox = ((-this.cam.x * z * L[0] + t * L[1]) % 256 + 256) % 256;
        const oy = ((-this.cam.y * z * L[0] + t * L[1] * 0.4 * (i ? -1 : 1)) % 256 + 256) % 256;
        ctx.save();
        ctx.globalAlpha = theme.bgStyle === 'stars' && i ? 0.5 + 0.3 * Math.sin(t * 1.5) : L[2];
        ctx.translate(ox, oy);
        ctx.fillStyle = pat;
        ctx.fillRect(-ox, -oy, w, h);
        ctx.restore();
      });
      // sun glare
      const gl = ctx.createRadialGradient(w * 0.15, -h * 0.05, 10, w * 0.15, -h * 0.05, Math.max(w, h) * 0.8);
      gl.addColorStop(0, 'rgba(255,255,240,0.32)');
      gl.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, w, h);
    },

    drawClouds(above, theme) {
      const ctx = this.ctx, w = this.w, h = this.h, z = this.cam.zoom;
      const span = w + 500;
      this.clouds.forEach((c) => {
        if (c.above !== above) return;
        const par = above ? 0.9 : 0.35;
        let x = (c.x * span - this.cam.x * z * par) % span;
        if (x < 0) x += span;
        x -= 250;
        let y = (c.y * (h + 300) - this.cam.y * z * par) % (h + 300);
        if (y < 0) y += h + 300;
        y -= 150;
        const s = c.s * (above ? 1.3 : 1) * Math.min(1.6, Math.max(0.7, z));
        ctx.globalAlpha = above ? 0.28 : theme.bgStyle === 'stars' || theme.bgStyle === 'grid' ? 0.12 : theme.bgStyle === 'lava' ? 0.25 : 0.75;
        ctx.drawImage(this.cloudSprite.cv, x - 120 * s, y - 72 * s, 240 * s, 140 * s);
      });
      ctx.globalAlpha = 1;
    },

    worldTransform() {
      const z = this.cam.zoom, d = this.dpr;
      this.ctx.setTransform(d * z, 0, 0, d * z, d * (this.w / 2 - this.cam.x * z), d * (this.h / 2 + (this.bob - this.cam.y) * z));
    },
    screenTransform() { this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); },

    render(game) {
      const ctx = this.ctx;
      const theme = game.theme;
      const isl = game.island;
      const S = isl.size;
      const t = this.t;
      const I = BI.Island;
      this.screenTransform();
      this.drawBackground(theme);
      this.drawClouds(false, theme);

      this.worldTransform();
      // island shadow on the sea
      const c = I.iso(S / 2, S / 2);
      ctx.save();
      ctx.translate(c.x + 40, c.y + S * 34 - this.bob);
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, S * 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,25,70,0.16)';
      ctx.fill();
      ctx.restore();

      // terrain (with expansion bounce)
      const cache = game.cache;
      ctx.save();
      if (game.expandT < 1) {
        const s = 0.9 + 0.1 * D.easeOutBack(game.expandT);
        ctx.translate(c.x, c.y);
        ctx.scale(s, s);
        ctx.translate(-c.x, -c.y);
      }
      ctx.drawImage(cache.canvas, -cache.ox, -cache.oy, cache.w, cache.h);
      this.drawWaterfalls(S, theme, t);
      ctx.restore();

      const building = game.state === 'BUILD_MODE' && game.build;
      if (building) this.drawGrid(game);

      // highlight nearest resource
      if (game.nearNode && game.state === 'GAMEPLAY') {
        const n = game.nearNode;
        const p = I.iso(n.gx + 0.5, n.gy + 0.5);
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 20 + pulse * 3, 10 + pulse * 1.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + pulse * 0.4) + ')';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      // tap rings
      rings.forEach((r) => {
        if (!r.on) return;
        const k = 1 - r.life / r.max;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 6 + k * 18, (6 + k * 18) * 0.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = D.rgba(r.color, 1 - k);
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      this.drawEntities(game, t);

      if (building) this.drawGhost(game, t);

      // particles
      for (let i = 0; i < MAXP; i++) {
        const p = parts[i];
        if (!p.on) continue;
        const a = p.life / p.max;
        if (p.smoke) {
          ctx.globalAlpha = a * 0.55;
          D.circle(ctx, p.x, p.y, p.size, p.color);
        } else {
          ctx.globalAlpha = Math.min(1, a * 1.6);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;

      this.screenTransform();
      this.drawClouds(true, theme);
      this.drawTexts();
    },

    drawWaterfalls(S, theme, t) {
      const ctx = this.ctx;
      const len = 130 + S * 9;
      BI.Island.waterfalls(S).forEach((wf, i) => {
        const x = wf.pt[0], y = wf.pt[1] + 2, w = wf.w;
        const g = ctx.createLinearGradient(0, y, 0, y + len);
        g.addColorStop(0, D.rgba(theme.water, 0.95));
        g.addColorStop(0.6, D.rgba(theme.water, 0.55));
        g.addColorStop(1, D.rgba(theme.water, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w / 2 + 4, y + len);
        ctx.lineTo(x - w / 2 - 4, y + len);
        ctx.closePath();
        ctx.fill();
        for (let k = 0; k < 7; k++) {
          const yy = (t * 95 + k * 41 + i * 13) % len;
          ctx.fillStyle = 'rgba(255,255,255,' + 0.55 * (1 - yy / len) + ')';
          ctx.fillRect(x - w / 2 + ((k * 7 + i * 3) % (w - 2)), y + yy, 2.2, 16);
        }
        D.ellipse(ctx, x, y + 1, w / 2 + 3, 3, 'rgba(255,255,255,0.85)');
        for (let k = 0; k < 3; k++) {
          const a = (t * 3 + k * 2.1) % 1;
          D.circle(ctx, x + (k - 1) * 5, y + 2 - a * 6, 1.6 * (1 - a), 'rgba(255,255,255,0.8)');
        }
      });
    },

    drawGrid(game) {
      const ctx = this.ctx, I = BI.Island, S = game.island.size;
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        let a = I.iso(i, 0), b = I.iso(i, S);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        a = I.iso(0, i); b = I.iso(S, i);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (game.occB[y * S + x] < 0) continue;
          const a = I.iso(x, y), b = I.iso(x + 1, y), c = I.iso(x + 1, y + 1), d = I.iso(x, y + 1);
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
        }
      }
      ctx.fillStyle = 'rgba(255,90,90,0.22)';
      ctx.fill();
    },

    drawGhost(game, t) {
      const ctx = this.ctx, I = BI.Island, b = game.build;
      const def = BI.Buildings.DEFS[b.type];
      const fp = BI.Buildings.footprint(def, b.rot);
      const ok = !b.error;
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.beginPath();
      for (let y = b.gy; y < b.gy + fp[1]; y++) {
        for (let x = b.gx; x < b.gx + fp[0]; x++) {
          const a = I.iso(x, y), bb = I.iso(x + 1, y), c = I.iso(x + 1, y + 1), d = I.iso(x, y + 1);
          ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
        }
      }
      ctx.fillStyle = ok ? 'rgba(80,255,150,' + (0.3 + pulse * 0.15) + ')' : 'rgba(255,70,80,' + (0.35 + pulse * 0.15) + ')';
      ctx.fill();
      const a = I.iso(b.gx, b.gy), bb = I.iso(b.gx + fp[0], b.gy), c = I.iso(b.gx + fp[0], b.gy + fp[1]), d = I.iso(b.gx, b.gy + fp[1]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
      ctx.strokeStyle = ok ? '#5dffa0' : '#ff5a64';
      ctx.lineWidth = 3;
      ctx.stroke();
      const cen = I.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.translate(cen.x, cen.y - 4 - pulse * 3);
      BI.Buildings.draw(ctx, b.type, b.rot, t);
      ctx.restore();
      // bouncing arrow
      const ay = cen.y - def.h - 18 - pulse * 5;
      ctx.beginPath();
      ctx.moveTo(cen.x - 8, ay - 8); ctx.lineTo(cen.x + 8, ay - 8); ctx.lineTo(cen.x, ay + 2); ctx.closePath();
      ctx.fillStyle = ok ? '#5dffa0' : '#ff5a64';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },

    drawEntities(game, t) {
      const ctx = this.ctx, I = BI.Island, isl = game.island, now = game.now;
      const ents = this.ents;
      let n = 0;
      const push = (d, k, o) => {
        if (n >= ents.length) ents.push({ d: 0, k: 0, o: null });
        const e = ents[n++];
        e.d = d; e.k = k; e.o = o;
      };
      isl.nodes.forEach((nd) => push(nd.gx + nd.gy + 1, 0, nd));
      isl.buildings.forEach((b) => {
        const fp = BI.Buildings.footprint(BI.Buildings.DEFS[b.type], b.rot);
        push(b.gx + fp[0] / 2 + b.gy + fp[1] / 2, 1, b);
      });
      push(game.player.x + game.player.y, 2, game.player);
      const list = ents.slice(0, n).sort((a, b) => a.d - b.d);
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (e.k === 0) {
          const nd = e.o;
          const p = I.iso(nd.gx + 0.5, nd.gy + 0.5);
          const st = game.popAnims.get(nd);
          let pop = 1;
          if (st != null) {
            pop = (t - st) / 0.45;
            if (pop >= 1) { game.popAnims.delete(nd); pop = 1; }
          }
          BI.Resources.draw(ctx, nd, p.x, p.y, isl.themeId || game.def.theme, game.theme, t, nd.respawnAt === 0, pop);
        } else if (e.k === 1) {
          this.drawBuilding(game, e.o, t, now);
        } else {
          const p = I.iso(game.player.x, game.player.y);
          BI.Player.draw(ctx, game.player, p.x, p.y, t);
        }
      }
      // arrow over nearest resource (on top of everything)
      if (game.nearNode && game.state === 'GAMEPLAY') {
        const nd = game.nearNode;
        const p = I.iso(nd.gx + 0.5, nd.gy + 0.5);
        const ay = p.y - BI.Resources.TYPES[nd.type].h - 10 - Math.abs(Math.sin(t * 5)) * 6;
        ctx.beginPath();
        ctx.moveTo(p.x - 7, ay - 9); ctx.lineTo(p.x + 7, ay - 9); ctx.lineTo(p.x, ay); ctx.closePath();
        ctx.fillStyle = '#ffcf2e';
        ctx.fill();
        ctx.strokeStyle = '#a86a00';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },

    drawBuilding(game, b, t, now) {
      const ctx = this.ctx, I = BI.Island;
      const def = BI.Buildings.DEFS[b.type];
      const fp = BI.Buildings.footprint(def, b.rot);
      const c = I.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
      const st = game.buildAnims.get(b);
      ctx.save();
      ctx.translate(c.x, c.y);
      if (st != null) {
        const k = Math.min(1, (t - st) / 0.55);
        const s = 0.8 + 0.2 * D.easeOutBack(k);
        ctx.scale(s, s * (0.9 + 0.1 * k));
        ctx.globalAlpha = Math.min(1, 0.4 + k);
        if (k >= 1) game.buildAnims.delete(b);
      }
      BI.Buildings.draw(ctx, b.type, b.rot, t);
      ctx.restore();
      if (def.produce && now - b.last >= def.produce.every * 1000 && game.state !== 'BUILD_MODE') {
        const y = c.y - def.h - 12 + Math.sin(t * 3 + b.gx) * 3;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        D.circle(ctx, c.x, y, 12, '#ffffff');
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(c.x - 5, y + 9); ctx.lineTo(c.x + 5, y + 9); ctx.lineTo(c.x, y + 16); ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        D.resIcon(ctx, def.produce.res, c.x, y, 7);
      }
    },

    drawTexts() {
      const ctx = this.ctx;
      const z = D.clamp(this.cam.zoom, 0.8, 1.4);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (let i = 0; i < texts.length; i++) {
        const tx = texts[i];
        if (!tx.on) continue;
        const k = 1 - tx.life / tx.max;
        const s = this.w2s(tx.x, tx.y);
        const pop = k < 0.15 ? D.easeOutBack(k / 0.15) : 1;
        const size = (tx.big ? 26 : 18) * z * pop;
        ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        ctx.font = '900 ' + size.toFixed(1) + 'px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
        const y = s.y - k * 46 * z;
        ctx.lineWidth = size * 0.28;
        ctx.strokeStyle = 'rgba(10,25,60,0.85)';
        ctx.strokeText(tx.str, s.x, y);
        ctx.fillStyle = tx.color;
        ctx.fillText(tx.str, s.x, y);
      }
      ctx.globalAlpha = 1;
    },
  };

  BI.Renderer = R;
  BI.FX = FX;
})();
