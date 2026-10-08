/* FALLSHIFT — the tower: floor storage, rotation, hazards state and pseudo-3D Canvas rendering. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;
  const C = FS.C;
  const TAU = U.TAU;
  const PI = Math.PI;
  const LASER_H = 72;

  // pre-derived palette shades
  function derive(p) {
    if (p.d) return p.d;
    p.d = {
      topFront: U.mix(p.top, p.edge, 0.1),
      topBack: U.mix(p.top, '#000000', 0.3),
      wall: p.wall,
      wallLight: U.mix(p.wall, p.edge, 0.12),
      cap: U.mix(p.wall, p.edge, 0.2),
      dangerTop: U.mix(p.dangerDark, '#000000', 0.25),
      spikeL: U.mix(p.danger, '#ffffff', 0.25),
      spikeR: U.mix(p.danger, p.dangerDark, 0.55),
    };
    return p.d;
  }

  const SEG_ORDER = new Array(16);
  const SEG_KEY = new Float32Array(16);

  class Tower {
    constructor() {
      this.rings = new Map();
      this.angle = 0;
      this.time = 0;
      this.seed = 1;
      this.opts = {};
      this.pxScale = 1;
      this.cache = {};
      this.onCrumble = null;
      this.cx = C.LW / 2;
    }

    reset(seed, opts) {
      this.rings.clear();
      this.angle = 0;
      this.time = 0;
      this.seed = seed;
      this.opts = opts || {};
    }

    setScale(s) {
      if (Math.abs(s - this.pxScale) > 0.001) {
        this.pxScale = s;
        this.cache = {};
      }
    }

    get(f) {
      return this.rings.get(f);
    }

    ensure(from, to) {
      for (let f = Math.max(1, from); f <= to; f++) {
        if (!this.rings.has(f)) this.rings.set(f, FS.LevelGen.generateFloor(f, this.rings.get(f - 1), this.seed, this.opts));
      }
    }

    prune(minF) {
      for (const k of this.rings.keys()) if (k < minF) this.rings.delete(k);
    }

    ringAngle(r) {
      return this.angle + r.offset + r.spin;
    }
    coreRel(r) {
      return U.wrap(C.CORE_ANGLE - this.ringAngle(r));
    }
    segIndex(r, rel) {
      return Math.min(r.n - 1, Math.floor(rel / r.w));
    }
    pulseOn(s) {
      return Math.sin(this.time * 2.2 + s.ph) > -0.25;
    }
    isSolid(s) {
      if (s.broken) return false;
      const t = s.type;
      if (t === 'gap' || t === 'portal' || t === 'combo') return false;
      if (t === 'pulse') return this.pulseOn(s);
      return true;
    }
    laserPhase(l) {
      return (this.time + l.phase) % l.period;
    }
    laserActive(l) {
      return !l.dead && this.laserPhase(l) < l.on;
    }
    laserAt(r, rel) {
      for (const l of r.lasers) {
        if (this.laserActive(l) && Math.abs(U.angDiff(rel, l.rel)) < l.half + 0.07) return l;
      }
      return null;
    }
    moverCenter(m) {
      return m.start + m.width / 2 + (m.span - m.width) * (0.5 + 0.5 * Math.sin(this.time * m.speed + m.phase));
    }
    moverCovers(r, rel) {
      const m = r.mover;
      if (!m || !m.alive) return false;
      return Math.abs(U.angDiff(rel, this.moverCenter(m))) < m.width / 2 + 0.03;
    }
    // rotate the whole tower so the core sits above segment idx of ring r
    alignTo(r, idx) {
      this.angle = C.CORE_ANGLE - r.offset - r.spin - (idx + 0.5) * r.w;
    }

    update(dt) {
      this.time += dt;
      for (const r of this.rings.values()) {
        if (r.spinSpeed) r.spin += r.spinSpeed * dt;
        for (let i = 0; i < r.n; i++) {
          const s = r.segs[i];
          if (s.flash > 0) s.flash -= dt;
          if (s.crumble > 0) {
            s.crumble -= dt;
            if (s.crumble <= 0) {
              s.crumble = -1;
              if (!s.broken) {
                s.broken = true;
                if (this.onCrumble) this.onCrumble(r, i);
              }
            }
          }
        }
      }
    }

    // ---------------------------------------------------------------- screen helpers
    segCenterScreen(r, i, camY, out) {
      const a = this.ringAngle(r) + (i + 0.5) * r.w;
      out.x = this.cx + Math.cos(a) * C.MID;
      out.y = r.y + Math.sin(a) * C.MID * C.K;
      out.front = Math.sin(a) > 0;
      return out;
    }

    // ---------------------------------------------------------------- background
    skyline(world, layer) {
      const key = 'sky' + world + '_' + layer;
      if (this.cache[key]) return this.cache[key];
      const p = FS.WORLDS[world];
      const LH = 1024, W = C.LW, s = Math.min(this.pxScale, 2);
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(W * s);
      cv.height = Math.ceil(LH * s);
      const g = cv.getContext('2d');
      g.scale(s, s);
      const rng = U.mulberry32(world * 131 + layer * 17 + 5);
      if (layer === 0) {
        const col = U.mix(p.skyline, p.haze, 0.12);
        for (let i = 0; i < 16; i++) {
          const w = 12 + rng() * 30;
          const x = rng() * (W + 40) - 20;
          g.fillStyle = U.rgba(col, 0.55 + rng() * 0.3);
          g.fillRect(x, 0, w, LH);
          g.fillStyle = U.rgba(p.windows, 0.28);
          for (let y = rng() * 30; y < LH; y += 9 + rng() * 26) {
            if (rng() < 0.5) g.fillRect(x + 2 + rng() * (w - 6), y, 2, 3);
          }
        }
        if (world === 2 || world === 4) {
          // floating rocks
          for (let i = 0; i < 14; i++) {
            const x = rng() * W, y = rng() * LH, r = 6 + rng() * 22;
            g.fillStyle = U.rgba(U.mix(p.skyline, '#000000', 0.2), 0.9);
            g.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * TAU + rng() * 0.4;
              const rr = r * (0.6 + rng() * 0.5);
              g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7);
            }
            g.closePath();
            g.fill();
            g.strokeStyle = U.rgba(p.edge, 0.25);
            g.stroke();
          }
        }
      } else {
        const sides = [[-30, 110], [W - 110, W + 30]];
        for (const [a, b] of sides) {
          for (let i = 0; i < 3; i++) {
            const w = 36 + rng() * 60;
            const x = a + rng() * (b - a - w);
            const shade = U.mix(p.skyline, '#000000', 0.15 + rng() * 0.3);
            g.fillStyle = shade;
            g.fillRect(x, 0, w, LH);
            // ledges
            for (let y = rng() * 120; y < LH; y += 80 + rng() * 140) {
              g.fillStyle = U.mix(shade, p.edge, 0.08);
              g.fillRect(x - 6, y, w + 12, 6 + rng() * 8);
            }
            // lit windows
            for (let y = rng() * 20; y < LH; y += 14 + rng() * 22) {
              for (let xx = x + 5; xx < x + w - 6; xx += 9) {
                if (rng() < 0.18) {
                  g.fillStyle = U.rgba(p.windows, 0.35 + rng() * 0.45);
                  g.fillRect(xx, y, 4, 6);
                }
              }
            }
            g.fillStyle = U.rgba(p.edge, 0.35);
            g.fillRect(x + (a < 0 ? w - 2 : 0), 0, 2, LH);
          }
        }
      }
      this.cache[key] = cv;
      return cv;
    }

    bgGradient(ctx, world, H) {
      const key = 'bg' + world + '_' + Math.round(H);
      let g = this.cache[key];
      if (!g) {
        const p = FS.WORLDS[world];
        g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, p.bgTop);
        g.addColorStop(0.55, U.mix(p.bgTop, p.bgBot, 0.6));
        g.addColorStop(1, p.bgBot);
        this.cache[key] = g;
      }
      return g;
    }

    drawWorldBg(ctx, world, camY, H, alpha) {
      const p = FS.WORLDS[world];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.bgGradient(ctx, world, H);
      ctx.fillRect(-20, -20, C.LW + 40, H + 40);
      // haze glow behind the tower
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.22;
      const hz = FS.getGlow(p.haze);
      ctx.drawImage(hz, C.LW / 2 - 330, H * 0.45 - 420, 660, 840);
      ctx.globalCompositeOperation = 'source-over';
      // parallax skyline layers
      const LH = 1024;
      const layers = [[0, 0.1, 0.8], [1, 0.25, 1]];
      for (const [layer, par, a] of layers) {
        const img = this.skyline(world, layer);
        let y0 = -((camY * par) % LH);
        if (y0 > 0) y0 -= LH;
        ctx.globalAlpha = alpha * a;
        for (let y = y0; y < H; y += LH) ctx.drawImage(img, 0, y, C.LW, LH);
      }
      ctx.globalAlpha = 1;
    }

    // ---------------------------------------------------------------- column
    colGradient(ctx, world) {
      const key = 'col' + world;
      let g = this.cache[key];
      if (!g) {
        const p = FS.WORLDS[world];
        const x0 = this.cx - C.COL_R;
        g = ctx.createLinearGradient(x0, 0, x0 + C.COL_R * 2, 0);
        g.addColorStop(0, U.mix(p.column, '#000000', 0.6));
        g.addColorStop(0.3, p.columnEdge);
        g.addColorStop(0.55, p.column);
        g.addColorStop(1, U.mix(p.column, '#000000', 0.7));
        this.cache[key] = g;
      }
      return g;
    }

    drawColumn(ctx, camY, H, world, gapTop, gapBot) {
      const p = FS.WORLDS[world];
      const cx = this.cx, R = C.COL_R;
      ctx.save();
      if (gapTop !== undefined) {
        ctx.beginPath();
        ctx.rect(cx - R - 30, -60, R * 2 + 60, gapTop + 60);
        ctx.rect(cx - R - 30, gapBot, R * 2 + 60, H - gapBot + 60);
        ctx.clip();
      }
      ctx.fillStyle = this.colGradient(ctx, world);
      ctx.fillRect(cx - R, -10, R * 2, H + 20);
      const P = 65;
      const first = Math.floor(camY / P);
      ctx.strokeStyle = U.rgba(p.columnEdge, 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = first; k * P < camY + H + P; k++) {
        const sy = k * P - camY;
        ctx.moveTo(cx - R, sy);
        ctx.lineTo(cx + R, sy);
      }
      ctx.stroke();
      // lit strips rotating with the tower
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 8; j++) {
        const th = j * (TAU / 8) + this.angle;
        const sn = Math.sin(th);
        if (sn < 0.12) continue;
        const x = cx + Math.cos(th) * R * 0.88;
        const vis = sn;
        for (let k = first; k * P < camY + H + P; k++) {
          const h = U.hash2(k, j);
          if (h < 0.42) continue;
          const sy = k * P - camY;
          const len = h > 0.8 ? P - 14 : (P - 14) * 0.5;
          ctx.globalAlpha = vis * 0.16;
          ctx.fillStyle = p.stripe;
          ctx.fillRect(x - 5 * vis, sy + 7, 10 * vis, len);
          ctx.globalAlpha = vis * (0.55 + 0.25 * Math.sin(this.time * 3 + k + j));
          ctx.fillRect(x - 1.4 * vis, sy + 7, 2.8 * vis, len);
        }
      }
      // central energy beam
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = p.stripe;
      ctx.fillRect(cx - 14, -10, 28, H + 20);
      ctx.globalAlpha = 0.25;
      ctx.fillRect(cx - 3, -10, 6, H + 20);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    // ---------------------------------------------------------------- rings
    visibleRings(camY, H, out) {
      out.length = 0;
      const f0 = Math.floor((camY - 80) / C.SPACING);
      const f1 = Math.ceil((camY + H + 80) / C.SPACING);
      for (let f = f0; f <= f1; f++) {
        const r = this.rings.get(f);
        if (r) out.push(r);
      }
      return out;
    }

    ringAlpha(r, coreY) {
      if (r.mod !== 'dark') return 1;
      const d = r.y - coreY;
      if (d < 0) return 0.75;
      return U.clamp(1 - (d - 90) / 120, 0.07, 1);
    }

    drawRingHalf(ctx, r, camY, front, coreY) {
      const pal = FS.WORLDS[r.world];
      const d = derive(pal);
      const y = r.y - camY;
      const base = this.ringAngle(r);
      const n = r.n;
      const alpha = this.ringAlpha(r, coreY);
      ctx.globalAlpha = alpha;
      let cnt = 0;
      for (let i = 0; i < n; i++) {
        const s = Math.sin(base + (i + 0.5) * r.w);
        if ((s > 0) !== front) continue;
        SEG_ORDER[cnt] = i;
        SEG_KEY[cnt] = s;
        cnt++;
      }
      // insertion sort by depth (far first)
      for (let a = 1; a < cnt; a++) {
        const ki = SEG_ORDER[a], kk = SEG_KEY[a];
        let b = a - 1;
        while (b >= 0 && SEG_KEY[b] > kk) {
          SEG_ORDER[b + 1] = SEG_ORDER[b];
          SEG_KEY[b + 1] = SEG_KEY[b];
          b--;
        }
        SEG_ORDER[b + 1] = ki;
        SEG_KEY[b + 1] = kk;
      }
      for (let k = 0; k < cnt; k++) {
        const i = SEG_ORDER[k];
        const a0 = base + i * r.w + 0.014, a1 = base + (i + 1) * r.w - 0.014;
        this.drawSegment(ctx, r, i, a0, a1, y, pal, d, front, alpha);
      }
      // gap specials (portal / combo gate)
      for (let i = 0; i < n; i++) {
        const sg = r.segs[i];
        if (sg.broken || (sg.type !== 'portal' && sg.type !== 'combo') || sg.used) continue;
        const a = base + (i + 0.5) * r.w;
        if ((Math.sin(a) > 0) !== front) continue;
        this.drawGate(ctx, sg.type, this.cx + Math.cos(a) * C.MID, y + Math.sin(a) * C.MID * C.K);
      }
      if (r.mover && r.mover.alive) this.drawMover(ctx, r, base, y, pal, d, front);
      if (r.lasers.length) this.drawLasers(ctx, r, base, y, pal, front);
      if (r.pickups.length) this.drawPickups(ctx, r, base, y, front);
      ctx.globalAlpha = 1;
    }

    pathArc(ctx, cx, y, a0, a1, rad, st, rev) {
      for (let k = 0; k <= st; k++) {
        const a = rev ? a1 - ((a1 - a0) * k) / st : a0 + ((a1 - a0) * k) / st;
        ctx.lineTo(cx + Math.cos(a) * rad, y + Math.sin(a) * rad * C.K);
      }
    }

    drawSegment(ctx, r, i, a0, a1, y, pal, d, front, alpha) {
      const sg = r.segs[i];
      if (sg.broken) return;
      let type = sg.type;
      if (type === 'gap' || type === 'portal' || type === 'combo') return;
      if (sg.used && (type === 'coin' || type === 'energy')) type = 'normal';
      const bs = sg.bstate; // boss arena state
      if (bs === 'spike') type = 'danger';
      const cx = this.cx, RO = C.R_OUT, RI = C.R_IN, K = C.K, T = C.THICK;
      const st = 6;
      let segAlpha = alpha;
      if (type === 'pulse') {
        const v = Math.sin(this.time * 2.2 + sg.ph);
        segAlpha = alpha * (v > -0.25 ? 1 : 0.16 + 0.2 * (v + 1));
      }
      if (sg.crumble > 0) segAlpha *= 0.55 + 0.45 * Math.abs(Math.sin(this.time * 30));
      ctx.globalAlpha = segAlpha;

      // colors per type
      let top = front ? d.topFront : d.topBack, wall = d.wall, edge = pal.edge, stripe = pal.wallStripe;
      if (type === 'danger') { top = d.dangerTop; edge = pal.danger; stripe = pal.danger; }
      else if (type === 'breakable') { top = U.rgba(pal.accent, front ? 0.42 : 0.28); wall = U.rgba(pal.accent, 0.22); edge = '#e6ffff'; }
      else if (type === 'coin') { top = '#3b2b08'; edge = '#ffcc33'; stripe = '#ffcc33'; }
      else if (type === 'energy') { top = '#073229'; edge = '#2bffb0'; stripe = '#2bffb0'; }
      else if (type === 'pulse') { top = U.mix(pal.top, pal.accent2, 0.25); edge = pal.accent2; stripe = pal.accent2; }
      if (bs === 'weak') { top = '#3a1606'; edge = '#ffb347'; stripe = '#ff8a1f'; }
      else if (bs === 'shock') { top = d.dangerTop; edge = pal.danger; stripe = pal.danger; }
      else if (bs === 'safe') { top = U.mix(pal.top, '#3fe6ff', 0.35); edge = '#bff8ff'; stripe = '#3fe6ff'; }

      if (front) {
        // end caps where the neighbour is open
        const prevS = r.segs[(i - 1 + r.n) % r.n], nextS = r.segs[(i + 1) % r.n];
        const openPrev = !this.isSolid(prevS) || r.boss === false && prevS.type === 'pulse';
        const openNext = !this.isSolid(nextS) || r.boss === false && nextS.type === 'pulse';
        ctx.fillStyle = type === 'breakable' ? wall : d.cap;
        if (openPrev) this.cap(ctx, cx, y, a0);
        if (openNext) this.cap(ctx, cx, y, a1);
        // outer wall
        const mid = (a0 + a1) / 2;
        const shift = U.wrap(mid) - mid;
        const lo = Math.max(a0 + shift, 0.0), hi = Math.min(a1 + shift, PI);
        if (hi > lo) {
          ctx.fillStyle = wall;
          ctx.beginPath();
          this.pathArc(ctx, cx, y, lo, hi, RO, st, false);
          this.pathArc(ctx, cx, y + T, lo, hi, RO, st, true);
          ctx.closePath();
          ctx.fill();
          // glowing stripe
          ctx.strokeStyle = stripe;
          ctx.globalAlpha = segAlpha * 0.85;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          this.pathArc(ctx, cx, y + T * 0.58, lo + 0.04, hi - 0.04, RO, st, false);
          ctx.stroke();
          ctx.globalAlpha = segAlpha;
        }
      } else {
        // inner wall visible on the far side
        ctx.fillStyle = d.wallLight;
        ctx.beginPath();
        this.pathArc(ctx, cx, y, a0, a1, RI, st, false);
        this.pathArc(ctx, cx, y + T, a0, a1, RI, st, true);
        ctx.closePath();
        ctx.fill();
      }

      // top face
      ctx.fillStyle = top;
      ctx.beginPath();
      this.pathArc(ctx, cx, y, a0, a1, RO, st, false);
      this.pathArc(ctx, cx, y, a0, a1, RI, st, true);
      ctx.closePath();
      ctx.fill();
      if (!front) {
        ctx.fillStyle = 'rgba(0,0,12,0.28)';
        ctx.fill();
      }

      // edges
      ctx.lineWidth = front ? 1.8 : 1.2;
      ctx.strokeStyle = edge;
      ctx.globalAlpha = segAlpha * (front ? 0.95 : 0.5);
      if (type === 'fake') ctx.setLineDash([6, 5]);
      ctx.beginPath();
      this.pathArc(ctx, cx, y, a0, a1, RO, st, false);
      ctx.stroke();
      ctx.globalAlpha = segAlpha * 0.35;
      ctx.beginPath();
      this.pathArc(ctx, cx, y, a0, a1, RI, st, false);
      ctx.stroke();
      if (type === 'fake') ctx.setLineDash([]);
      ctx.globalAlpha = segAlpha;

      const mid = (a0 + a1) / 2;
      const cm = Math.cos(mid), sm = Math.sin(mid);
      const mx = cx + cm * C.MID, my = y + sm * C.MID * K;

      // decorations per type
      if (type === 'normal' || type === 'fake') {
        ctx.strokeStyle = U.rgba(pal.edge, 0.13);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + cm * (RI + 6), y + sm * (RI + 6) * K);
        ctx.lineTo(cx + cm * (RO - 6), y + sm * (RO - 6) * K);
        ctx.stroke();
      } else if (type === 'danger') {
        this.drawSpikes(ctx, cx, y, a0, a1, d, front, pal);
      } else if (type === 'breakable') {
        ctx.strokeStyle = 'rgba(230,255,255,0.75)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        let h = sg.cr;
        for (let k = 0; k < 3; k++) {
          h = (h * 1103515245 + 12345) & 0x7fffffff;
          let ta = a0 + (a1 - a0) * (0.15 + ((h % 1000) / 1000) * 0.7);
          let tr = RI + 8;
          ctx.moveTo(cx + Math.cos(ta) * tr, y + Math.sin(ta) * tr * K);
          for (let z = 0; z < 4; z++) {
            h = (h * 1103515245 + 12345) & 0x7fffffff;
            ta += (((h % 1000) / 1000) - 0.5) * 0.12;
            tr += (RO - RI - 16) / 4;
            ctx.lineTo(cx + Math.cos(ta) * tr, y + Math.sin(ta) * tr * K);
          }
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = segAlpha * 0.25;
        ctx.drawImage(FS.getGlow(pal.accent), mx - 40, my - 22, 80, 44);
        ctx.globalCompositeOperation = 'source-over';
      } else if (type === 'coin') {
        this.coinIcon(ctx, mx, my - 2, 9, 1);
      } else if (type === 'energy') {
        this.boltIcon(ctx, mx, my - 2, 9, '#2bffb0');
      }
      if (bs === 'weak') {
        const pulse = 0.6 + 0.4 * Math.sin(this.time * 8);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = segAlpha * pulse;
        ctx.drawImage(FS.getGlow('#ff8a1f', true), mx - 34, my - 22, 68, 44);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = segAlpha;
        ctx.fillStyle = '#ffe2a0';
        ctx.beginPath();
        ctx.moveTo(mx, my - 12);
        ctx.lineTo(mx + 8, my - 2);
        ctx.lineTo(mx, my + 6);
        ctx.lineTo(mx - 8, my - 2);
        ctx.closePath();
        ctx.fill();
      } else if (bs === 'shock') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = pal.danger;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = segAlpha * (0.5 + Math.random() * 0.5);
        ctx.beginPath();
        let ta = a0 + 0.05, tr = RI + 10;
        ctx.moveTo(cx + Math.cos(ta) * tr, y + Math.sin(ta) * tr * K);
        for (let z = 0; z < 7; z++) {
          ta += (a1 - a0 - 0.1) / 7;
          tr = RI + 10 + Math.random() * (RO - RI - 20);
          ctx.lineTo(cx + Math.cos(ta) * tr, y + Math.sin(ta) * tr * K);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (sg.tele > 0) {
        ctx.globalAlpha = segAlpha * (0.4 + 0.6 * Math.abs(Math.sin(this.time * 14)));
        ctx.strokeStyle = sg.teleColor || '#ff3d6a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        this.pathArc(ctx, cx, y, a0, a1, RO, st, false);
        this.pathArc(ctx, cx, y, a0, a1, RI, st, true);
        ctx.closePath();
        ctx.stroke();
      }
      if (sg.flash > 0) {
        ctx.globalAlpha = Math.min(1, sg.flash * 4) * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        this.pathArc(ctx, cx, y, a0, a1, RO, st, false);
        this.pathArc(ctx, cx, y, a0, a1, RI, st, true);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = alpha;
    }

    cap(ctx, cx, y, a) {
      const c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + c * C.R_IN, y + s * C.R_IN * C.K);
      ctx.lineTo(cx + c * C.R_OUT, y + s * C.R_OUT * C.K);
      ctx.lineTo(cx + c * C.R_OUT, y + s * C.R_OUT * C.K + C.THICK);
      ctx.lineTo(cx + c * C.R_IN, y + s * C.R_IN * C.K + C.THICK);
      ctx.closePath();
      ctx.fill();
    }

    drawSpikes(ctx, cx, y, a0, a1, d, front, pal, lift) {
      lift = lift || 0;
      const rows = front ? [C.R_IN + 24, C.R_OUT - 24] : [C.R_OUT - 24, C.R_IN + 24];
      const K = C.K;
      for (const rr of rows) {
        for (let k = 0; k < 3; k++) {
          const a = a0 + (a1 - a0) * (0.2 + k * 0.3);
          const x = cx + Math.cos(a) * rr, yy = y + Math.sin(a) * rr * K - lift;
          const h = 15, w = 6;
          ctx.fillStyle = d.spikeL;
          ctx.beginPath();
          ctx.moveTo(x - w, yy);
          ctx.lineTo(x, yy - h);
          ctx.lineTo(x, yy + 2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = d.spikeR;
          ctx.beginPath();
          ctx.moveTo(x, yy + 2);
          ctx.lineTo(x, yy - h);
          ctx.lineTo(x + w, yy);
          ctx.closePath();
          ctx.fill();
        }
      }
      const mid = (a0 + a1) / 2;
      const mx = cx + Math.cos(mid) * C.MID, my = y + Math.sin(mid) * C.MID * K - lift;
      const ga = ctx.globalAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ga * (0.32 + 0.12 * Math.sin(this.time * 4 + a0));
      ctx.drawImage(FS.getGlow(pal.danger), mx - 46, my - 34, 92, 52);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = ga;
    }

    drawMover(ctx, r, base, y, pal, d, front) {
      const m = r.mover;
      const c = this.moverCenter(m);
      const ac = base + c;
      if ((Math.sin(ac) > 0) !== front) return;
      const a0 = ac - m.width / 2, a1 = ac + m.width / 2;
      const lift = 7;
      const cx = this.cx;
      const ga0 = ctx.globalAlpha;
      const yy = y - lift;
      ctx.fillStyle = d.spikeR;
      if (front) {
        ctx.beginPath();
        this.pathArc(ctx, cx, yy, a0, a1, C.R_OUT - 8, 5, false);
        this.pathArc(ctx, cx, y, a0, a1, C.R_OUT - 8, 5, true);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = d.dangerTop;
      ctx.beginPath();
      this.pathArc(ctx, cx, yy, a0, a1, C.R_OUT - 8, 5, false);
      this.pathArc(ctx, cx, yy, a0, a1, C.R_IN + 8, 5, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal.danger;
      ctx.lineWidth = 2;
      ctx.stroke();
      // hazard chevrons
      ctx.strokeStyle = '#ffcc33';
      ctx.globalAlpha *= 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const a = a0 + ((a1 - a0) * k) / 4;
        ctx.moveTo(cx + Math.cos(a) * (C.R_OUT - 12), yy + Math.sin(a) * (C.R_OUT - 12) * C.K);
        ctx.lineTo(cx + Math.cos(a) * (C.R_OUT - 2), yy + Math.sin(a) * (C.R_OUT - 2) * C.K + 6);
      }
      ctx.stroke();
      ctx.globalAlpha = ga0;
      this.drawSpikes(ctx, cx, y, a0, a1, d, front, pal, lift);
    }

    drawLasers(ctx, r, base, y, pal, front) {
      const cx = this.cx;
      const ga = ctx.globalAlpha;
      for (const l of r.lasers) {
        if (l.dead) continue;
        const a = base + l.rel;
        if ((Math.sin(a) > 0) !== front) continue;
        const c = Math.cos(a), s = Math.sin(a);
        const xi = cx + c * C.R_IN, yi = y + s * C.R_IN * C.K;
        const xo = cx + c * (C.R_OUT + 6), yo = y + s * (C.R_OUT + 6) * C.K;
        const ph = this.laserPhase(l);
        const active = ph < l.on;
        const warn = ph > l.period - 0.6;
        ctx.globalCompositeOperation = 'lighter';
        if (active) {
          const k = Math.min(1, ph / 0.08) * Math.min(1, (l.on - ph) / 0.1);
          ctx.globalAlpha = ga * 0.28 * k;
          ctx.fillStyle = pal.danger;
          ctx.beginPath();
          ctx.moveTo(xi, yi);
          ctx.lineTo(xo, yo);
          ctx.lineTo(xo, yo - LASER_H);
          ctx.lineTo(xi, yi - LASER_H);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = ga * k;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let h = 8; h < LASER_H; h += 16) {
            ctx.moveTo(xi, yi - h);
            ctx.lineTo(xo, yo - h);
          }
          ctx.stroke();
          ctx.strokeStyle = pal.danger;
          ctx.lineWidth = 5;
          ctx.globalAlpha = ga * 0.6 * k;
          ctx.stroke();
        } else if (warn) {
          ctx.globalAlpha = ga * (0.3 + 0.5 * Math.abs(Math.sin(this.time * 20)));
          ctx.strokeStyle = pal.danger;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(xi, yi - LASER_H / 2);
          ctx.lineTo(xo, yo - LASER_H / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        // emitters
        ctx.globalAlpha = ga * (active ? 1 : 0.55);
        ctx.drawImage(FS.getGlow(pal.danger, active), xo - 12, yo - LASER_H - 12, 24, 24);
        ctx.drawImage(FS.getGlow(pal.danger, active), xo - 9, yo - 9, 18, 18);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#20141e';
        ctx.globalAlpha = ga;
        ctx.fillRect(xo - 3, yo - LASER_H - 4, 6, LASER_H + 6);
      }
      ctx.globalAlpha = ga;
    }

    drawGate(ctx, type, x, y) {
      const t = this.time;
      ctx.globalCompositeOperation = 'lighter';
      const ga = ctx.globalAlpha;
      if (type === 'portal') {
        ctx.globalAlpha = ga * 0.7;
        ctx.drawImage(FS.getGlow('#b04dff', true), x - 34, y - 20, 68, 40);
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = k === 1 ? '#ff4fd8' : '#b06bff';
          ctx.globalAlpha = ga * (0.9 - k * 0.2);
          ctx.beginPath();
          const rr = 24 - k * 6 + Math.sin(t * 5 + k) * 2;
          ctx.ellipse(x, y, rr, rr * 0.42, 0, t * (2 + k) % TAU, (t * (2 + k) % TAU) + 4.6);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = ga * 0.6;
        ctx.drawImage(FS.getGlow('#ffcc33', true), x - 30, y - 18, 60, 36);
        ctx.globalAlpha = ga;
        ctx.strokeStyle = '#ffcc33';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, 25, 10, 0, 0, TAU);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff3c4';
        ctx.font = '800 13px "Segoe UI", Roboto, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x3', x, y - 18 + Math.sin(t * 4) * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = ga;
    }

    drawPickups(ctx, r, base, y, front) {
      const cx = this.cx;
      for (const p of r.pickups) {
        if (p.taken) continue;
        const a = base + p.rel;
        const s = Math.sin(a);
        if ((s > 0) !== front) continue;
        const x = cx + Math.cos(a) * C.MID;
        const yy = y + s * C.MID * C.K - p.h + Math.sin(this.time * 3 + p.rel * 5) * 3;
        const sc = 0.75 + 0.25 * (s + 1) * 0.5;
        if (p.kind === 'coin') this.coinIcon(ctx, x, yy, 7 * sc, Math.cos(this.time * 3 + p.rel * 7));
        else if (p.kind === 'energy') this.boltIcon(ctx, x, yy, 8 * sc, '#2bffb0', true);
        else this.crystalIcon(ctx, x, yy, 9 * sc);
      }
    }

    coinIcon(ctx, x, y, r, spin) {
      const ga = ctx.globalAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ga * 0.45;
      ctx.drawImage(FS.getGlow('#ffb800'), x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = ga;
      const w = Math.max(0.2, Math.abs(spin));
      ctx.fillStyle = '#ffcc33';
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + PI / 6;
        ctx.lineTo(x + Math.cos(a) * r * w, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff1a8';
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + PI / 6;
        ctx.lineTo(x + Math.cos(a) * r * 0.5 * w, y + Math.sin(a) * r * 0.5);
      }
      ctx.closePath();
      ctx.fill();
    }

    boltIcon(ctx, x, y, r, color, glow) {
      const ga = ctx.globalAlpha;
      if (glow) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = ga * 0.7;
        ctx.drawImage(FS.getGlow(color, true), x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = ga;
      }
      ctx.fillStyle = glow ? '#eafff6' : color;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.2, y - r);
      ctx.lineTo(x - r * 0.55, y + r * 0.15);
      ctx.lineTo(x - r * 0.05, y + r * 0.15);
      ctx.lineTo(x - r * 0.2, y + r);
      ctx.lineTo(x + r * 0.55, y - r * 0.15);
      ctx.lineTo(x + r * 0.05, y - r * 0.15);
      ctx.closePath();
      ctx.fill();
    }

    crystalIcon(ctx, x, y, r) {
      const ga = ctx.globalAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = ga * 0.7;
      ctx.drawImage(FS.getGlow('#b06bff', true), x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = ga;
      ctx.fillStyle = '#c99bff';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.7, y - r * 0.2);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.7, y - r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2e6ff';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.7, y - r * 0.2);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  Tower.LASER_H = LASER_H;
  FS.Tower = Tower;
})();
