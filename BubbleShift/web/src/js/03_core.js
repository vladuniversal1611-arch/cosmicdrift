/* ==========================================================================
   03_core.js — PURE gameplay engine (no DOM, no rendering, no timers).

   Geometry is in "bubble radius" units (r = 1); the renderer scales by the
   pixel radius. Hex layout: odd-r offset — odd rows are shifted right by r
   and one cell shorter. Row 0 is the ceiling / anchor row.

   Board.shoot() resolves a whole shot instantly and returns an ordered event
   list. The game screen turns those events into animations; the balancing
   bot (tools/balance.js) uses the same engine with no rendering at all.

   Cell types:  n plain · w rainbow · s stone · i ice · ch chained · l locked
                b bomb · k key · rot spinner · d shadow · m creature
                f butterfly · st star · x crystal
   ========================================================================== */
'use strict';

const Core = (() => {
  const COLS = 11;
  const ROWH = Math.sqrt(3);
  const MAXR = 34;
  const KW = 16;                 // key stride (cols < 16)
  const W = COLS * 2;            // board width in radius units
  const HIT = 1.7;               // collision radius (< 2 so shots can thread gaps)

  const rowLen = (r) => ((r & 1) ? COLS - 1 : COLS);
  const cx = (r, c) => ((r & 1) ? 2 + 2 * c : 1 + 2 * c);
  const cy = (r) => 1 + r * ROWH;
  const key = (r, c) => r * KW + c;
  const kr = (k) => (k / KW) | 0;
  const kc = (k) => k % KW;
  const inB = (r, c) => r >= 0 && r < MAXR && c >= 0 && c < rowLen(r);
  const kx = (k) => cx(kr(k), kc(k));
  const ky = (k) => cy(kr(k));

  const NE = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  const NO = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  // Precomputed neighbour lists + a clockwise ring (used by spinners).
  const NB = [], RING = [];
  for (let r = 0; r < MAXR; r++) {
    for (let c = 0; c < KW; c++) {
      const k = key(r, c);
      if (!inB(r, c)) { NB[k] = []; RING[k] = []; continue; }
      const list = [];
      for (const [dr, dc] of (r & 1) ? NO : NE) if (inB(r + dr, c + dc)) list.push(key(r + dr, c + dc));
      NB[k] = list;
      const x0 = cx(r, c), y0 = cy(r);
      RING[k] = list.slice().sort((a, b) => Math.atan2(ky(a) - y0, kx(a) - x0) - Math.atan2(ky(b) - y0, kx(b) - x0));
    }
  }

  const COLORED = { n: 1, i: 1, ch: 1, l: 1 };
  const BLOCKER = { s: 1, i: 1, ch: 1, b: 1, rot: 1, l: 1, d: 1, x: 1 };

  function copyCell(c) { return c ? { t: c.t, c: c.c, hp: c.hp, cr: c.cr } : null; }

  class Board {
    constructor(level, seed) {
      this.level = level;
      this.rng = U.rng(seed == null ? (level.id * 31337 + 7) : seed);
      this.cells = new Array(MAXR * KW).fill(null);
      for (const s of level.cells) this.cells[key(s.r, s.col)] = { t: s.t, c: s.c, hp: s.hp, cr: s.cr };
      this.shots = 0;
      this.stats = { popped: 0, dropped: 0, byColor: [0, 0, 0, 0, 0, 0], rescued: 0, butterflies: 0, stars: 0, crystals: 0, chains: 0, specials: 0, keys: 0 };
      this.initialCount = this.count();
      this.initialTop = this.rowCount(0);
      this.darkCap = this.countType('d') + 6;
      this.boss = level.boss ? { hp: level.boss.hp, max: level.boss.hp, turn: 0, pattern: 0 } : null;
    }

    clone() {
      const b = Object.create(Board.prototype);
      b.level = this.level;
      b.rng = U.rng((this.rng() * 4294967296) >>> 0);
      b.cells = this.cells.map(copyCell);
      b.shots = this.shots;
      b.stats = JSON.parse(JSON.stringify(this.stats));
      b.initialCount = this.initialCount; b.initialTop = this.initialTop; b.darkCap = this.darkCap;
      b.boss = this.boss ? Object.assign({}, this.boss) : null;
      return b;
    }

    // ------------------------------------------------------------ queries
    count() { let n = 0; for (const c of this.cells) if (c) n++; return n; }
    countType(t) { let n = 0; for (const c of this.cells) if (c && c.t === t) n++; return n; }
    rowCount(r) { let n = 0; for (let c = 0; c < rowLen(r); c++) if (this.cells[key(r, c)]) n++; return n; }
    lowestRow() {
      for (let r = MAXR - 1; r >= 0; r--) for (let c = 0; c < rowLen(r); c++) if (this.cells[key(r, c)]) return r;
      return -1;
    }
    isValidSlot(k) {
      if (this.cells[k]) return false;
      if (kr(k) === 0) return true;
      for (const n of NB[k]) if (this.cells[n]) return true;
      return false;
    }
    colorCounts() {
      const cnt = [0, 0, 0, 0, 0, 0];
      for (const c of this.cells) if (c && COLORED[c.t]) cnt[c.c]++;
      return cnt;
    }
    // Ammo colour, weighted towards colours still on the board.
    nextColor(avoid) {
      const cnt = this.colorCounts();
      let total = 0;
      const w = cnt.map((n, i) => (n > 0 && i !== avoid ? 1 + Math.sqrt(n) : 0));
      for (const x of w) total += x;
      if (total <= 0) {
        const present = cnt.map((n, i) => (n > 0 ? i : -1)).filter((i) => i >= 0);
        const pool = present.length ? present : this.level.colors;
        return pool[Math.floor(this.rng() * pool.length)];
      }
      let r = this.rng() * total;
      for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
      return w.findIndex((x) => x > 0);
    }
    hasColor(c) { for (const x of this.cells) if (x && COLORED[x.t] && x.c === c) return true; return false; }

    // ------------------------------------------------------------ geometry
    hitTest(x, y, rad) {
      const r0 = Math.round((y - 1) / ROWH);
      let best = -1, bd = rad * rad;
      for (let r = r0 - 1; r <= r0 + 1; r++) {
        if (r < 0 || r >= MAXR) continue;
        const c0 = Math.round((x - ((r & 1) ? 2 : 1)) / 2);
        for (let c = c0 - 1; c <= c0 + 1; c++) {
          if (!inB(r, c)) continue;
          const k = key(r, c);
          if (!this.cells[k]) continue;
          const dx = cx(r, c) - x, dy = cy(r) - y, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = k; }
        }
      }
      return best;
    }
    nearestFree(x, y) {
      for (let span = 2; span <= 5; span++) {
        const r0 = Math.round((y - 1) / ROWH);
        let best = -1, bd = 1e9;
        for (let r = Math.max(0, r0 - span); r <= Math.min(MAXR - 1, r0 + span); r++) {
          const c0 = Math.round((x - ((r & 1) ? 2 : 1)) / 2);
          for (let c = c0 - span; c <= c0 + span; c++) {
            if (!inB(r, c)) continue;
            const k = key(r, c);
            if (!this.isValidSlot(k)) continue;
            const dx = cx(r, c) - x, dy = cy(r) - y, d = dx * dx + dy * dy;
            if (d < bd) { bd = d; best = k; }
          }
        }
        if (best >= 0) return best;
      }
      return -1;
    }

    /**
     * Trace a shot from (x0,y0) along (dx,dy), reflecting off the side walls.
     * Returns the poly-line (used for BOTH the dotted preview and the real
     * flight, so they can never disagree) and the landing slot.
     * fire=true: fireball — passes through bubbles, burning up to 8.
     */
    trace(x0, y0, dx, dy, fire) {
      const pts = [{ x: x0, y: y0 }];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      let x = x0, y = y0, bounces = 0;
      const Lw = 1, Rw = W - 1, step = 0.2;
      const burned = [], seen = new Set();
      for (let i = 0; i < 5000; i++) {
        const nx = x + dx * step, ny = y + dy * step;
        if (nx < Lw && dx < 0) { const tt = (Lw - x) / dx; x += dx * tt; y += dy * tt; pts.push({ x, y }); dx = -dx; bounces++; continue; }
        if (nx > Rw && dx > 0) { const tt = (Rw - x) / dx; x += dx * tt; y += dy * tt; pts.push({ x, y }); dx = -dx; bounces++; continue; }
        if (ny <= 1) {
          const tt = dy !== 0 ? (1 - y) / dy : 0; x += dx * tt; y = 1; pts.push({ x, y });
          return { pts, land: fire ? -1 : this.nearestFree(x, y), bounces, burned, hitKey: -1 };
        }
        if (fire) {
          const r0 = Math.round((ny - 1) / ROWH);
          for (let r = r0 - 1; r <= r0 + 1; r++) {
            if (r < 0 || r >= MAXR) continue;
            const c0 = Math.round((nx - ((r & 1) ? 2 : 1)) / 2);
            for (let c = c0 - 1; c <= c0 + 1; c++) {
              if (!inB(r, c)) continue;
              const k = key(r, c);
              if (!this.cells[k] || seen.has(k)) continue;
              const ddx = cx(r, c) - nx, ddy = cy(r) - ny;
              if (ddx * ddx + ddy * ddy < 1.6 * 1.6) { seen.add(k); burned.push(k); }
            }
          }
          if (burned.length >= 8) { pts.push({ x: nx, y: ny }); return { pts, land: -1, bounces, burned: burned.slice(0, 8), hitKey: -1 }; }
        } else {
          const hk = this.hitTest(nx, ny, HIT);
          if (hk >= 0) { pts.push({ x: nx, y: ny }); return { pts, land: this.nearestFree(nx, ny), bounces, burned, hitKey: hk }; }
        }
        x = nx; y = ny;
      }
      pts.push({ x, y });
      return { pts, land: -1, bounces, burned, hitKey: -1 };
    }

    // ------------------------------------------------------------ matching
    flood(start, color) {
      const out = [start], seen = new Set([start]);
      for (let i = 0; i < out.length; i++) {
        for (const n of NB[out[i]]) {
          if (seen.has(n)) continue;
          const c = this.cells[n];
          if (!c) continue;
          if ((c.t === 'n' && c.c === color) || c.t === 'w') { seen.add(n); out.push(n); }
        }
      }
      return out;
    }
    // Cells connected to the ceiling (row 0) or to a chain (chains are anchors).
    anchored() {
      const set = new Uint8Array(MAXR * KW);
      const q = [];
      for (let c = 0; c < COLS; c++) { const k = key(0, c); if (this.cells[k]) { set[k] = 1; q.push(k); } }
      for (let k = 0; k < this.cells.length; k++) if (this.cells[k] && this.cells[k].t === 'ch' && !set[k]) { set[k] = 1; q.push(k); }
      for (let i = 0; i < q.length; i++) for (const n of NB[q[i]]) if (!set[n] && this.cells[n]) { set[n] = 1; q.push(n); }
      return set;
    }

    // ------------------------------------------------------------ resolution
    /**
     * ammo: {t:'color',c} | {t:'rainbow'} | {t:'bomb',c} | {t:'fireball'}
     * tr:   result of trace() for the same aim
     */
    shoot(ammo, tr) {
      const ev = [];
      const ctx = { ev, removed: 0, crystalsHit: 0, bombQueue: [], popGroup: 0 };
      this.shots++;
      let placedKey = -1;
      if (ammo.t === 'fireball') {
        ev.push({ k: 'fire', pts: tr.pts, keys: tr.burned.slice() });
        for (const k of tr.burned) if (this.cells[k]) this._destroy(k, ctx, 'burn');
      } else if (tr.land >= 0) {
        placedKey = tr.land;
        if (ammo.t === 'rainbow') this._placeRainbow(placedKey, ctx);
        else {
          this.cells[placedKey] = { t: 'n', c: ammo.c };
          ev.push({ k: 'place', key: placedKey, cell: copyCell(this.cells[placedKey]) });
          if (ammo.t === 'bomb') ctx.bombQueue.push(placedKey);
          else { const g = this.flood(placedKey, ammo.c); if (g.length >= 3) this._popGroup(g, ctx); }
        }
      }
      this._runBombs(ctx);
      this._drop(ctx);
      this._rotate(ctx);
      this._drop(ctx);
      this._darkSpread(ctx);
      this._bossTurn(ctx);
      return { ev, removed: ctx.removed, popGroup: ctx.popGroup, placedKey, bounces: tr.bounces || 0 };
    }

    hammer(k) {
      const ctx = { ev: [], removed: 0, crystalsHit: 0, bombQueue: [], popGroup: 0 };
      if (!this.cells[k]) return { ev: [], removed: 0 };
      ctx.ev.push({ k: 'hammer', key: k });
      this._destroy(k, ctx, 'hammer');
      this._runBombs(ctx); this._drop(ctx); this._bossDamage(ctx);
      return { ev: ctx.ev, removed: ctx.removed };
    }
    colorBlast(color) {
      const ctx = { ev: [], removed: 0, crystalsHit: 0, bombQueue: [], popGroup: 0 };
      const keys = [];
      for (let k = 0; k < this.cells.length; k++) { const c = this.cells[k]; if (c && c.t === 'n' && c.c === color) keys.push(k); }
      ctx.ev.push({ k: 'colorBlast', color, keys: keys.slice() });
      for (const k of keys) this._destroy(k, ctx, 'blast');
      this._runBombs(ctx); this._drop(ctx); this._bossDamage(ctx);
      return { ev: ctx.ev, removed: ctx.removed };
    }
    shuffle() {
      const keys = [], cols = [];
      for (let k = 0; k < this.cells.length; k++) { const c = this.cells[k]; if (c && c.t === 'n') { keys.push(k); cols.push(c.c); } }
      for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); const tmp = cols[i]; cols[i] = cols[j]; cols[j] = tmp; }
      keys.forEach((k, i) => { this.cells[k].c = cols[i]; });
      return { ev: [{ k: 'shuffle', keys }] };
    }

    _placeRainbow(k, ctx) {
      // Try every neighbouring colour; keep the one that makes the biggest group.
      this.cells[k] = { t: 'w' };
      let best = -1, bestG = null;
      const tried = {};
      for (const n of NB[k]) {
        const c = this.cells[n];
        if (!c || c.t !== 'n' || tried[c.c]) continue;
        tried[c.c] = 1;
        const g = this.flood(k, c.c);
        if (!bestG || g.length > bestG.length) { best = c.c; bestG = g; }
      }
      this.cells[k] = { t: 'n', c: best >= 0 ? best : this.level.colors[0] };
      ctx.ev.push({ k: 'place', key: k, cell: copyCell(this.cells[k]), rainbow: true });
      if (bestG && bestG.length >= 3) this._popGroup(this.flood(k, best), ctx);
    }
    _popGroup(group, ctx) {
      ctx.ev.push({ k: 'pop', list: group.map((k) => ({ key: k, cell: copyCell(this.cells[k]) })) });
      ctx.popGroup = Math.max(ctx.popGroup, group.length);
      const inGroup = new Set(group);
      for (const k of group) {
        const c = this.cells[k];
        if (c.t === 'n') { this.stats.popped++; this.stats.byColor[c.c]++; }
        this.cells[k] = null; ctx.removed++;
      }
      // Every blocker next to the group takes exactly one hit per group.
      const hit = new Set();
      for (const k of group) for (const n of NB[k]) if (!inGroup.has(n) && this.cells[n]) hit.add(n);
      for (const n of hit) this._hitAdj(n, ctx);
    }
    _hitAdj(k, ctx) {
      const c = this.cells[k];
      if (!c) return;
      switch (c.t) {
        case 's': case 'rot':
          c.hp--;
          if (c.hp <= 0) this._destroy(k, ctx, 'crack'); else ctx.ev.push({ k: 'hit', key: k, cell: copyCell(c) });
          break;
        case 'i': c.t = 'n'; this.stats.specials++; ctx.ev.push({ k: 'melt', key: k, cell: copyCell(c) }); break;
        case 'ch':
          c.hp--;
          if (c.hp <= 0) { c.t = 'n'; delete c.hp; this.stats.chains++; this.stats.specials++; ctx.ev.push({ k: 'unchain', key: k, cell: copyCell(c) }); }
          else ctx.ev.push({ k: 'hit', key: k, cell: copyCell(c) });
          break;
        case 'b': case 'k': case 'd': case 'f': case 'st': case 'x': this._destroy(k, ctx, 'adj'); break;
        default: break;
      }
    }
    // Remove a cell with full reward semantics (items collected, bombs armed).
    _destroy(k, ctx, cause) {
      const c = this.cells[k];
      if (!c) return;
      const snap = copyCell(c);
      this.cells[k] = null; ctx.removed++;
      switch (c.t) {
        case 'n': this.stats.popped++; this.stats.byColor[c.c]++; break;
        case 'm': this.stats.rescued++; break;
        case 'f': this.stats.butterflies++; break;
        case 'st': this.stats.stars++; break;
        case 'x': this.stats.crystals++; this.stats.specials++; ctx.crystalsHit++; break;
        case 'ch': this.stats.chains++; this.stats.specials++; break;
        case 'k': this.stats.keys++; break;
        case 'b': this.stats.specials++; ctx.bombQueue.push(k); break;
        default: this.stats.specials++; break;
      }
      ctx.ev.push({ k: 'destroy', key: k, cell: snap, cause });
      if (c.t === 'k') this._unlockAll(ctx);
    }
    _unlockAll(ctx) {
      const keys = [];
      for (let k = 0; k < this.cells.length; k++) { const c = this.cells[k]; if (c && c.t === 'l') { c.t = 'n'; keys.push(k); } }
      if (keys.length) ctx.ev.push({ k: 'unlock', keys });
    }
    _runBombs(ctx) {
      let guard = 0;
      while (ctx.bombQueue.length && guard++ < 50) {
        const center = ctx.bombQueue.shift();
        const x0 = kx(center), y0 = ky(center);
        const keys = [];
        for (let k = 0; k < this.cells.length; k++) {
          if (!this.cells[k] || k === center) continue;
          const dx = kx(k) - x0, dy = ky(k) - y0;
          if (dx * dx + dy * dy <= 4.1 * 4.1) keys.push(k);
        }
        ctx.ev.push({ k: 'explode', key: center, keys: keys.slice() });
        if (this.cells[center]) this._destroy(center, ctx, 'blast');
        for (const k of keys) if (this.cells[k]) this._destroy(k, ctx, 'blast');
      }
    }
    _drop(ctx) {
      const anc = this.anchored();
      const list = [];
      for (let k = 0; k < this.cells.length; k++) {
        const c = this.cells[k];
        if (!c || anc[k]) continue;
        list.push({ key: k, cell: copyCell(c) });
        switch (c.t) {
          case 'n': this.stats.dropped++; this.stats.byColor[c.c]++; break;
          case 'm': this.stats.rescued++; break;
          case 'f': this.stats.butterflies++; break;
          case 'st': this.stats.stars++; break;
          case 'x': this.stats.crystals++; this.stats.specials++; ctx.crystalsHit++; break;
          case 'k': this.stats.keys++; break;
          default: if (BLOCKER[c.t]) this.stats.specials++; break;
        }
        this.cells[k] = null; ctx.removed++;
      }
      if (list.length) {
        ctx.ev.push({ k: 'drop', list });
        if (list.some((d) => d.cell.t === 'k')) this._unlockAll(ctx);
      }
    }
    _rotate(ctx) {
      const rots = [];
      for (let k = 0; k < this.cells.length; k++) if (this.cells[k] && this.cells[k].t === 'rot') rots.push(k);
      for (const k of rots) {
        if (!this.cells[k] || this.cells[k].t !== 'rot') continue;
        const ring = RING[k];
        if (ring.length < 2) continue;
        const old = ring.map((n) => this.cells[n]);
        if (old.every((c) => !c)) continue;
        const moves = [];
        for (let i = 0; i < ring.length; i++) {
          const to = ring[(i + 1) % ring.length];
          this.cells[to] = old[i];
          if (old[i]) moves.push({ from: ring[i], to, cell: copyCell(old[i]) });
        }
        ctx.ev.push({ k: 'rotate', key: k, moves });
      }
    }
    _darkSpread(ctx) {
      if (this.shots % 3 !== 0) return;
      const darks = [];
      for (let k = 0; k < this.cells.length; k++) if (this.cells[k] && this.cells[k].t === 'd') darks.push(k);
      let total = darks.length;
      for (const k of darks) {
        if (total >= this.darkCap) break;
        const opts = NB[k].filter((n) => this.cells[n] && this.cells[n].t === 'n');
        if (!opts.length) continue;
        const to = opts[Math.floor(this.rng() * opts.length)];
        this.cells[to] = { t: 'd', hp: 1 };
        total++;
        ctx.ev.push({ k: 'spread', from: k, to });
      }
    }
    _bossDamage(ctx) {
      if (!this.boss || this.boss.hp <= 0) return 0;
      const dmg = ctx.removed + ctx.crystalsHit * 4;
      if (dmg <= 0) return 0;
      this.boss.hp = Math.max(0, this.boss.hp - dmg);
      ctx.ev.push({ k: 'bossHit', dmg, hp: this.boss.hp });
      if (this.boss.hp <= 0) ctx.ev.push({ k: 'bossDefeat' });
      return dmg;
    }
    // Every 3rd turn the boss attacks: spits new bubbles, freezes or petrifies.
    _bossTurn(ctx) {
      if (!this.boss) return;
      this._bossDamage(ctx);
      if (this.boss.hp <= 0) return;
      this.boss.turn++;
      const low = this.count() < 14;
      if (this.boss.turn % 3 !== 0 && !low) return;
      const pal = this.level.colors;
      const type = low ? 'spit' : ['spit', 'freeze', 'stone'][this.boss.pattern++ % 3];
      const keys = [];
      if (type === 'spit') {
        const want = low ? 14 : 4 + Math.min(4, this.level.area || 0);
        for (let pass = 0; pass < 3 && keys.length < want; pass++) {
          const slots = [];
          for (let r = 0; r <= 3; r++) for (let c = 0; c < rowLen(r); c++) { const k = key(r, c); if (this.isValidSlot(k)) slots.push(k); }
          U.rng((this.rng() * 1e9) >>> 0).shuffle(slots);
          for (const k of slots) {
            if (keys.length >= want) break;
            if (!this.isValidSlot(k)) continue;
            this.cells[k] = { t: 'n', c: pal[Math.floor(this.rng() * pal.length)] };
            keys.push(k);
          }
        }
      } else {
        const plain = [];
        for (let k = 0; k < this.cells.length; k++) if (this.cells[k] && this.cells[k].t === 'n') plain.push(k);
        U.rng((this.rng() * 1e9) >>> 0).shuffle(plain);
        for (const k of plain.slice(0, type === 'freeze' ? 3 : 2)) {
          if (type === 'freeze') this.cells[k].t = 'i'; else this.cells[k] = { t: 's', hp: 2 };
          keys.push(k);
        }
      }
      if (keys.length) ctx.ev.push({ k: 'bossAttack', type, keys, cells: keys.map((k) => copyCell(this.cells[k])) });
    }

    // ------------------------------------------------------------ objective
    progress() {
      const o = this.level.objective, s = this.stats;
      let cur = 0, target = o.target;
      switch (o.type) {
        case 'clear': target = this.initialCount; cur = this.initialCount - this.count(); break;
        case 'top': target = this.initialTop; cur = this.initialTop - this.rowCount(0); break;
        case 'rescue': cur = s.rescued; break;
        case 'butterflies': cur = s.butterflies; break;
        case 'stars': cur = s.stars; break;
        case 'crystals': cur = s.crystals; break;
        case 'chains': cur = s.chains; break;
        case 'color': cur = s.byColor[o.color]; break;
        case 'boss': target = this.boss.max; cur = this.boss.max - this.boss.hp; break;
      }
      cur = Math.max(0, Math.min(cur, target));
      let done = cur >= target;
      if (o.type === 'top') done = this.rowCount(0) === 0;
      if (o.type === 'clear') done = this.count() === 0;
      if (o.type !== 'boss' && this.count() === 0) done = true;
      if (o.type === 'boss') done = this.boss.hp <= 0;
      return { cur, target, done };
    }
  }

  return { COLS, ROWH, MAXR, KW, W, HIT, rowLen, cx, cy, key, kr, kc, kx, ky, inB, NB, RING, Board, copyCell, COLORED, BLOCKER };
})();

if (typeof module !== 'undefined') module.exports = { Core };
