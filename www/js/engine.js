/* ============================================================
   Match-3 Engine — board logic, animations, particles, specials
   and automatic dragon abilities. Canvas rendered.
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.GameData;
  const SP = D.SPECIAL;
  const rnd = function (n) { return Math.floor(Math.random() * n); };
  const ease = function (t) { return 1 - Math.pow(1 - t, 3); }; // easeOutCubic
  const easeBack = function (t) { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }; // overshoot pop

  function Engine() {
    this.cb = {};
    this.particles = [];
    this.floaters = [];
    this.viewport = { x: 0, y: 0, size: 100 };
    this.state = 'idle';
    this.nextStep = null;
    this.activeAnims = 0;
    this.combo = 0;
    this.shake = 0;
    this.dragonFx = []; // visual dragon flyovers
  }

  Engine.prototype.init = function (level, equipped, callbacks) {
    this.level = level;
    this.cb = callbacks || {};
    this.cols = level.cols;
    this.rows = level.rows;
    this.colors = level.colors;
    this.score = 0;
    this.movesLeft = level.moves;
    this.collected = 0;
    this.iceLeft = 0;
    this.combo = 0;
    this.particles = [];
    this.floaters = [];
    this.dragonFx = [];
    this.grid = [];
    this.selected = null;
    this.state = 'idle';
    this.nextStep = null;
    this.activeAnims = 0;
    this.finished = false;
    this.pendingDragons = [];
    this.dragonsActivatedThisMove = {};

    // Boss setup
    this.isBoss = level.objective === D.OBJ.BOSS;
    this.bossMax = this.isBoss ? level.target : 0;
    this.bossHP = this.bossMax;
    this.movesSinceBossAttack = 0;
    this.bossHitFlash = 0;

    // Game mode ('adventure' | 'blitz' | 'endless' | 'daily')
    this.mode = level.mode || 'adventure';
    this.timeLeft = level.timeLimit || 0;
    this.danger = 0;
    this.elapsed = 0;
    this.castingResolve = false; // true while a dragon ability is resolving (no self-recharge)
    // Roguelite relic modifiers (Dragon Trials mode)
    const mods = level.mods || {};
    this.scoreMult = mods.scoreMult || 1;
    this.powerBonus = mods.powerBonus || 0;
    this.chargeMult = ((this.mode === 'blitz') ? 2 : 1) * (D.activeEvent().mult === 'dragon' ? 1.5 : 1) * (mods.chargeMult || 1);

    // Equipped dragons → charge bars.
    this.dragons = (equipped || []).filter(Boolean).map(function (id) {
      const def = D.dragonById(id);
      const lvl = (global.Save.get().dragonLevels[id]) || 1;
      const tier = (global.Save.get().dragonTiers && global.Save.get().dragonTiers[id]) || 1;
      return { id: id, def: def, charge: 0, need: Math.max(12, def.chargeNeed - lvl - (tier - 1) * 2), level: lvl, tier: tier, flashing: 0 };
    });

    this.buildBoard();
    // relic: start the board with a few special crystals
    const ss = mods.startSpecials || 0;
    for (let k = 0; k < ss; k++) {
      const r = rnd(this.rows), c = rnd(this.cols), t = this.grid[r][c];
      if (t && !t.ice && t.special === SP.NONE) t.special = (rnd(2) ? SP.BOMB : SP.LINE_H);
    }
    this.emitObjective();
  };

  Engine.prototype.buildBoard = function () {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.makeTile(r, c, true));
      }
      this.grid.push(row);
    }
    // Remove any starting matches.
    let guard = 0;
    while (this.findMatches().length && guard++ < 60) {
      const m = this.findMatches()[0];
      const cell = m[0];
      this.grid[cell.r][cell.c].type = (this.grid[cell.r][cell.c].type + 1) % this.colors;
    }
    const lv = this.level;
    // Ice blockers (ICE objective).
    this.iceLeft = 0;
    if (lv.objective === D.OBJ.ICE) {
      let placed = 0, guard2 = 0;
      while (placed < lv.iceCount && guard2++ < 400) {
        const r = rnd(this.rows), c = rnd(this.cols);
        if (!this.grid[r][c].ice) { this.grid[r][c].ice = true; this.grid[r][c].blockHp = 1; placed++; }
      }
      this.iceLeft = placed;
    }
    // Crates (2-hit blockers) — count toward the ice objective.
    let crates = lv.crates || 0, cg = 0;
    while (crates > 0 && cg++ < 400) {
      const r = rnd(this.rows), c = rnd(this.cols);
      if (!this.grid[r][c].ice) { this.grid[r][c].ice = true; this.grid[r][c].crate = true; this.grid[r][c].blockHp = 2; crates--; if (lv.objective === D.OBJ.ICE) this.iceLeft++; }
    }
    // Chains (locked crystals).
    let chains = lv.chains || 0, hg = 0;
    while (chains > 0 && hg++ < 400) {
      const r = rnd(this.rows), c = rnd(this.cols);
      if (!this.grid[r][c].ice && !this.grid[r][c].chain) { this.grid[r][c].chain = true; chains--; }
    }
    // Jelly layers (JELLY objective) — tracked per cell, independent of crystals.
    this.jellyGrid = [];
    this.jellyLeft = 0;
    for (let r = 0; r < this.rows; r++) { this.jellyGrid.push(new Array(this.cols).fill(0)); }
    if (lv.objective === D.OBJ.JELLY) {
      let placed = 0, jg = 0;
      while (placed < lv.jellyCount && jg++ < 600) {
        const r = rnd(this.rows), c = rnd(this.cols);
        const layers = (rnd(3) === 0) ? 2 : 1;
        if (this.jellyGrid[r][c] === 0 && !this.grid[r][c].ice) { this.jellyGrid[r][c] = layers; placed += layers; }
      }
      this.jellyLeft = placed;
    }
  };

  Engine.prototype.makeTile = function (r, c, instant) {
    return {
      type: rnd(this.colors),
      special: SP.NONE,
      ice: false,       // solid blocker present (ice or crate)
      blockHp: 0,       // hits remaining for the blocker (1 = ice, 2 = crate)
      crate: false,     // render blocker as a wooden crate
      chain: false,     // crystal locked by a chain (can't be swapped)
      r: r, c: c,
      scale: instant ? 1 : 0,
      offY: 0,
      anim: null,
      dying: false
    };
  };

  // ---- Viewport / coordinate helpers --------------------------------------
  Engine.prototype.setViewport = function (x, y, size) {
    this.viewport = { x: x, y: y, size: size };
    this.tile = size / this.cols;
  };
  Engine.prototype.cellX = function (c) { return this.viewport.x + c * this.tile; };
  Engine.prototype.cellY = function (r) { return this.viewport.y + r * this.tile; };
  Engine.prototype.pickCell = function (px, py) {
    const c = Math.floor((px - this.viewport.x) / this.tile);
    const r = Math.floor((py - this.viewport.y) / this.tile);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return { r: r, c: c };
  };

  // ---- Input --------------------------------------------------------------
  Engine.prototype.onDown = function (px, py) {
    if (this.state !== 'idle' || this.finished) return;
    this.idleTime = 0; this.hint = null;
    // Aiming a ready dragon's ability at a cell/row.
    if (this.castAim) {
      const cell = this.pickCell(px, py);
      const d = this.castAim; this.castAim = null;
      if (cell) { this.castReady(d, cell); if (this.cb.onDragons) this.cb.onDragons(this.dragons); }
      return;
    }
    if (this.hammerArmed) {
      const used = this.hammerAt(px, py);
      if (used && this.cb.onHammerUsed) this.cb.onHammerUsed();
      return;
    }
    this.selected = this.pickCell(px, py);
    this.downPx = { x: px, y: py };
  };
  Engine.prototype.onMove = function (px, py) {
    if (!this.selected || this.state !== 'idle') return;
    const dx = px - this.downPx.x, dy = py - this.downPx.y;
    if (Math.abs(dx) < this.tile * 0.4 && Math.abs(dy) < this.tile * 0.4) return;
    let tr = this.selected.r, tc = this.selected.c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    if (tr < 0 || tr >= this.rows || tc < 0 || tc >= this.cols) { this.selected = null; return; }
    this.trySwap(this.selected, { r: tr, c: tc });
    this.selected = null;
  };
  Engine.prototype.onUp = function () { this.selected = null; };

  // ---- Swap ---------------------------------------------------------------
  Engine.prototype.trySwap = function (a, b) {
    if (this.state !== 'idle' || this.finished) return;
    this.idleTime = 0; this.hint = null;
    const ta = this.grid[a.r][a.c], tb = this.grid[b.r][b.c];
    if (ta.ice || tb.ice || ta.chain || tb.chain) { global.Audio2.play('invalid'); return; }
    this.state = 'busy';
    global.Audio2.play('swap');
    const bothSpecial = ta.special !== SP.NONE && tb.special !== SP.NONE;
    this.swapTiles(a, b);
    const self = this;
    this.animateSwap(a, b, function () {
      // Two specials swapped together → powerful combo.
      if (bothSpecial) {
        self.movesLeft--; self.movesSinceBossAttack++;
        self.cb.onMoves && self.cb.onMoves(self.movesLeft);
        self.combo = 0;
        self.dragonsActivatedThisMove = {};
        self.comboSpecials(a, b, self.grid[b.r][b.c], self.grid[a.r][a.c]);
        return;
      }
      const matches = self.findMatches();
      const isSpecialMove = ta.special !== SP.NONE || tb.special !== SP.NONE;
      if (matches.length || isSpecialMove) {
        self.movesLeft--; self.movesSinceBossAttack++;
        self.cb.onMoves && self.cb.onMoves(self.movesLeft);
        self.combo = 0;
        self.dragonsActivatedThisMove = {}; // each dragon may fire once per move
        // Activate a special directly involved in the swap.
        if (isSpecialMove && !matches.length) {
          const set = {};
          self.addSpecialEffect(set, a.r, a.c);
          self.addSpecialEffect(set, b.r, b.c);
          self.clearSet(set);
        } else {
          self.resolveStep();
        }
      } else {
        // Swap back — invalid move.
        global.Audio2.play('invalid');
        self.swapTiles(a, b);
        self.animateSwap(a, b, function () { self.state = 'idle'; });
      }
    });
  };

  Engine.prototype.swapTiles = function (a, b) {
    const t = this.grid[a.r][a.c];
    this.grid[a.r][a.c] = this.grid[b.r][b.c];
    this.grid[b.r][b.c] = t;
    this.grid[a.r][a.c].r = a.r; this.grid[a.r][a.c].c = a.c;
    this.grid[b.r][b.c].r = b.r; this.grid[b.r][b.c].c = b.c;
  };

  Engine.prototype.animateSwap = function (a, b, done) {
    // Tiles are already swapped in the grid: the tile now at cell A came
    // from cell B (and vice-versa), so animate from its OLD cell to its new one.
    const ta = this.grid[a.r][a.c], tb = this.grid[b.r][b.c];
    this.startAnim(ta, 'swap', b.r, b.c, a.r, a.c, 0.14);
    this.startAnim(tb, 'swap', a.r, a.c, b.r, b.c, 0.14);
    this.afterAnims(done);
  };

  // ---- Tween bookkeeping ---------------------------------------------------
  Engine.prototype.startAnim = function (tile, type, fr, fc, tr, tc, dur) {
    tile.anim = {
      type: type, t: 0, dur: dur || 0.2,
      fromX: this.cellX(fc), fromY: this.cellY(fr),
      toX: this.cellX(tc), toY: this.cellY(tr)
    };
    this.activeAnims++;
  };
  Engine.prototype.afterAnims = function (fn) { this._afterFn = fn; };

  Engine.prototype.update = function (dt) {
    // ---- game-mode clocks ----
    if (!this.finished && this.tile) {
      this.elapsed += dt;
      if (this.mode === 'blitz') {
        this.timeLeft -= dt;
        this.cb.onTime && this.cb.onTime(Math.max(0, this.timeLeft));
        if (this.timeLeft <= 0) this.modeEnd();
      } else if (this.mode === 'endless') {
        const rate = 3.5 + this.elapsed * 0.05; // threat grows over time
        this.danger = Math.min(100, this.danger + dt * rate);
        this.cb.onDanger && this.cb.onDanger(this.danger);
        if (this.danger >= 100) this.modeEnd();
      }
    }
    // advance tile animations
    let stillActive = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const tile = this.grid[r] && this.grid[r][c];
      if (!tile) continue;
      if (tile.scale < 1 && !tile.dying) tile.scale = Math.min(1, tile.scale + dt * 6);
      if (tile.anim) {
        tile.anim.t += dt;
        if (tile.anim.t >= tile.anim.dur) { tile.anim = null; }
        else stillActive++;
      }
    }
    // dying tiles handled separately
    for (let i = this.dyingTiles ? this.dyingTiles.length - 1 : -1; i >= 0; i--) {
      const d = this.dyingTiles[i];
      d.t += dt;
      d.tile.scale = Math.max(0, 1 - d.t / 0.18);
      if (d.t >= 0.18) this.dyingTiles.splice(i, 1);
      else stillActive++;
    }
    this.activeAnims = stillActive;

    if (this.activeAnims === 0 && this._afterFn) {
      const fn = this._afterFn; this._afterFn = null; fn();
    }

    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt;
      if (p.shard) { p.rot += p.spin * dt; p.vx *= 0.96; }
      if (p.t >= p.life) this.particles.splice(i, 1);
    }
    // floating score text
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt; f.y -= 40 * dt;
      if (f.t >= f.life) this.floaters.splice(i, 1);
    }
    // dragon flyover fx
    for (let i = this.dragonFx.length - 1; i >= 0; i--) {
      const fx = this.dragonFx[i];
      fx.t += dt; fx.x += fx.vx * dt;
      if (fx.t >= fx.life) this.dragonFx.splice(i, 1);
    }
    // dragon charge flash decay
    this.dragons.forEach(function (d) { if (d.flashing > 0) d.flashing -= dt; });
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    if (this.bossHitFlash > 0) this.bossHitFlash = Math.max(0, this.bossHitFlash - dt * 2);

    // shockwave rings
    this.rings = this.rings || [];
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.t += dt;
      if (ring.t >= ring.life) this.rings.splice(i, 1);
    }

    // victory fireworks finale
    if (this.victory) {
      this.victory.t += dt;
      if (Math.random() < 0.7) {
        const x = this.viewport.x + Math.random() * this.viewport.size;
        const y = this.viewport.y + Math.random() * this.viewport.size;
        const cols = ['#ff5d6c', '#5db4ff', '#56e29a', '#ffd24d', '#c58bff', '#fff'];
        const col = cols[(Math.random() * cols.length) | 0];
        this.spawnBurst(x, y, col, 14);
        this.spawnRing(x, y, this.tile * 2.2, col);
      }
      if (this.victory.t >= this.victory.dur && !this.victory.fired) {
        this.victory.fired = true;
        const v = this.victory; this.victory = null;
        this.cb.onWin && this.cb.onWin({ score: this.score, stars: v.stars });
      }
    }

    // idle hint: pulse a valid move when the player hesitates
    if (this.state === 'idle' && !this.finished) {
      this.idleTime = (this.idleTime || 0) + dt;
      if (this.idleTime > 4 && !this.hint) this.hint = this.findHintMove();
    } else {
      this.idleTime = 0; this.hint = null;
    }
    this.hintPulse = (this.hintPulse || 0) + dt;
  };

  // ---- Match detection ----------------------------------------------------
  Engine.prototype.findMatches = function () {
    const g = this.grid, groups = [];
    // horizontal
    for (let r = 0; r < this.rows; r++) {
      let run = 1;
      for (let c = 1; c <= this.cols; c++) {
        const same = c < this.cols && g[r][c] && g[r][c - 1] &&
          !g[r][c].ice && !g[r][c - 1].ice && !g[r][c].chain && !g[r][c - 1].chain &&
          g[r][c].type === g[r][c - 1].type;
        if (same) run++;
        else {
          if (run >= 3) { const grp = []; for (let k = c - run; k < c; k++) grp.push({ r: r, c: k }); groups.push(grp); }
          run = 1;
        }
      }
    }
    // vertical
    for (let c = 0; c < this.cols; c++) {
      let run = 1;
      for (let r = 1; r <= this.rows; r++) {
        const same = r < this.rows && g[r][c] && g[r - 1][c] &&
          !g[r][c].ice && !g[r - 1][c].ice && !g[r][c].chain && !g[r - 1][c].chain &&
          g[r][c].type === g[r - 1][c].type;
        if (same) run++;
        else {
          if (run >= 3) { const grp = []; for (let k = r - run; k < r; k++) grp.push({ r: k, c: c }); groups.push(grp); }
          run = 1;
        }
      }
    }
    return groups;
  };

  // ---- Resolve loop -------------------------------------------------------
  Engine.prototype.resolveStep = function () {
    const groups = this.findMatches();
    if (!groups.length) { this.endResolve(); return; }
    this.combo++;
    if (this.combo > 1) global.Audio2.play('match', this.combo);
    else global.Audio2.play('match', 1);
    global.Save.addStat('maxCombo', this.combo, true);
    if (this.cb.onCombo && this.combo > 1) this.cb.onCombo(this.combo);

    const clearSet = {};
    const self = this;
    let specialToMake = [];

    groups.forEach(function (grp) {
      grp.forEach(function (cell) { clearSet[cell.r + ',' + cell.c] = cell; });
      // Big matches create special crystals.
      if (grp.length === 4) {
        const c0 = grp[0], c1 = grp[1];
        const horiz = c0.r === c1.r;
        specialToMake.push({ r: grp[Math.floor(grp.length / 2)].r, c: grp[Math.floor(grp.length / 2)].c,
          special: horiz ? SP.LINE_V : SP.LINE_H, type: self.grid[c0.r][c0.c].type });
      } else if (grp.length >= 5) {
        const mid = grp[Math.floor(grp.length / 2)];
        specialToMake.push({ r: mid.r, c: mid.c, special: SP.RAINBOW, type: self.grid[mid.r][mid.c].type });
      }
    });

    // Expand clear set via any specials caught in the matches.
    Object.keys(clearSet).slice().forEach(function (k) {
      const cell = clearSet[k];
      const t = self.grid[cell.r][cell.c];
      if (t && t.special !== SP.NONE) self.addSpecialEffect(clearSet, cell.r, cell.c);
    });

    this.specialToMake = specialToMake;
    this.clearSet(clearSet, specialToMake);
  };

  Engine.prototype.addSpecialEffect = function (set, r, c) {
    const t = this.grid[r][c];
    if (!t) return;
    const sp = t.special;
    set[r + ',' + c] = { r: r, c: c };
    if (sp !== SP.NONE) this.spawnRing(this.cellX(c) + this.tile / 2, this.cellY(r) + this.tile / 2, this.tile * (sp === SP.RAINBOW ? 4 : 2.2), '#ffffff');
    const self = this;
    const recurse = function (rr, cc) {
      const key = rr + ',' + cc;
      if (set[key]) return;
      set[key] = { r: rr, c: cc };
      const nt = self.grid[rr] && self.grid[rr][cc];
      if (nt && nt.special !== SP.NONE) self.addSpecialEffect(set, rr, cc);
    };
    if (sp === SP.LINE_H) { for (let cc = 0; cc < this.cols; cc++) recurse(r, cc); this.shake = 0.5; }
    else if (sp === SP.LINE_V) { for (let rr = 0; rr < this.rows; rr++) recurse(rr, c); this.shake = 0.5; }
    else if (sp === SP.BOMB) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < this.rows && cc >= 0 && cc < this.cols) recurse(rr, cc);
      }
      this.shake = 0.6;
    } else if (sp === SP.RAINBOW) {
      const col = t.type;
      for (let rr = 0; rr < this.rows; rr++) for (let cc = 0; cc < this.cols; cc++) {
        if (this.grid[rr][cc] && this.grid[rr][cc].type === col && !this.grid[rr][cc].ice) recurse(rr, cc);
      }
      this.shake = 0.7;
    }
  };

  Engine.prototype.clearSet = function (set, specialToMake) {
    const keys = Object.keys(set);
    if (!keys.length) { this.endResolve(); return; }
    const self = this;
    this.dyingTiles = this.dyingTiles || [];
    let cleared = 0, energyGain = 0;
    const makeSet = {};
    (specialToMake || []).forEach(function (s) { makeSet[s.r + ',' + s.c] = s; });

    keys.forEach(function (k) {
      const cell = set[k];
      const t = self.grid[cell.r][cell.c];
      if (!t) return;
      // Crystals next to ice crack the ice instead of clearing the gem.
      // (Direct: if tile itself is ice it cannot be in a match anyway.)
      if (makeSet[k]) {
        // Transform into a special crystal instead of dying.
        t.special = makeSet[k].special;
        t.type = makeSet[k].type;
        t.scale = 0.3;
        global.Audio2.play('special');
        global.Save.addStat('specialsMade', 1);
        self.spawnBurst(self.cellX(cell.c) + self.tile / 2, self.cellY(cell.r) + self.tile / 2, '#ffffff', 10);
        return;
      }
      cleared++;
      energyGain += 2;
      // crack adjacent blockers (ice / crates / chains)
      self.crackAdjacentIce(cell.r, cell.c);
      // reduce jelly under the cleared crystal
      if (self.jellyGrid && self.jellyGrid[cell.r][cell.c] > 0) {
        self.jellyGrid[cell.r][cell.c]--;
        self.jellyLeft = Math.max(0, self.jellyLeft - 1);
        self.spawnBurst(self.cellX(cell.c) + self.tile / 2, self.cellY(cell.r) + self.tile / 2, '#ff7ad0', 8);
      }
      // collect objective colour
      if (self.level.objective === D.OBJ.COLLECT && t.type === self.level.color) {
        self.collected++;
      }
      const cx = self.cellX(cell.c) + self.tile / 2, cy = self.cellY(cell.r) + self.tile / 2;
      self.spawnBurst(cx, cy, D.CRYSTALS[t.type].c1, 7);
      t.dying = true;
      self.dyingTiles.push({ tile: t, t: 0 });
      // mark cell for removal after death
      self.grid[cell.r][cell.c] = self.grid[cell.r][cell.c];
      t._remove = true;
    });

    // scoring
    const gained = Math.round(cleared * 30 * Math.max(1, this.combo) * (this.scoreMult || 1));
    this.score += gained;
    if (gained > 0) {
      this.addFloater(this.viewport.x + this.viewport.size / 2,
        this.viewport.y + this.viewport.size / 2 - 20, '+' + gained, '#fff2a0');
    }
    global.Save.addStat('crystalsCrushed', cleared);
    global.Save.addStat('energyEarned', energyGain);
    if (this.mode === 'endless' && cleared > 0) this.danger = Math.max(0, this.danger - cleared * 2.2);
    this.chargeDragons(energyGain);
    this.cb.onScore && this.cb.onScore(this.score);
    // Boss takes damage equal to crystals cleared (combo amplified).
    if (this.isBoss && cleared > 0 && this.bossHP > 0) {
      const dmg = cleared + Math.max(0, this.combo - 1) * 2;
      this.bossHP = Math.max(0, this.bossHP - dmg);
      this.bossHitFlash = 0.5;
      this.addFloater(this.viewport.x + this.viewport.size / 2, this.viewport.y - 6, '-' + dmg, '#ff7a6a');
    }
    this.emitObjective();

    // After death animation completes → collapse.
    this.afterAnims(function () {
      // actually remove tiles
      for (let r = 0; r < self.rows; r++) for (let c = 0; c < self.cols; c++) {
        const t = self.grid[r][c];
        if (t && t._remove) self.grid[r][c] = null;
      }
      self.collapse();
    });
  };

  Engine.prototype.crackAdjacentIce = function (r, c) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let i = 0; i < dirs.length; i++) {
      const rr = r + dirs[i][0], cc = c + dirs[i][1];
      if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) continue;
      const t = this.grid[rr][cc];
      if (!t) continue;
      if (t.ice) {
        t.blockHp = Math.max(0, (t.blockHp || 1) - 1);
        const col = t.crate ? '#c79a5c' : '#bff0ff';
        this.spawnBurst(this.cellX(cc) + this.tile / 2, this.cellY(rr) + this.tile / 2, col, 8);
        if (t.blockHp <= 0) {
          t.ice = false; t.crate = false;
          this.iceLeft = Math.max(0, this.iceLeft - 1);
        }
      } else if (t.chain) {
        t.chain = false; // adjacent match frees the locked crystal
        this.spawnBurst(this.cellX(cc) + this.tile / 2, this.cellY(rr) + this.tile / 2, '#ffd24d', 8);
      }
    }
  };

  // ---- Collapse + refill --------------------------------------------------
  Engine.prototype.collapse = function () {
    const self = this;
    for (let c = 0; c < this.cols; c++) {
      let write = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const t = this.grid[r][c];
        if (t && t.ice) {
          // ice blocks stay in place; reset write pointer above it
          if (write !== r) {
            // move floating gems above the ice down to just above it (handled per segment)
          }
        }
        if (t && !t._remove && !t.dying) {
          if (write !== r) {
            this.grid[write][c] = t;
            this.grid[r][c] = null;
            t.r = write; t.c = c;
            this.startAnim(t, 'fall', r, c, write, c, 0.22);
          }
          write--;
        }
      }
      // spawn new tiles to fill the gaps from the top
      for (let r = write; r >= 0; r--) {
        const t = this.makeTile(r, c, false);
        t.scale = 1;
        this.grid[r][c] = t;
        this.startAnim(t, 'fall', r - (write + 1), c, r, c, 0.26);
      }
    }
    this.dyingTiles = [];
    this.afterAnims(function () { self.resolveStep(); });
  };

  Engine.prototype.endResolve = function () {
    this.combo = 0;
    // Drain queued dragon activations one at a time (no recursion into chargeDragons).
    if (this.pendingDragons && this.pendingDragons.length && !this.finished) {
      const d = this.pendingDragons.shift();
      this.activateDragon(d);
      return;
    }
    if (this.checkWin()) return; // boss may have just died
    // Boss strikes back every 5 moves.
    if (this.isBoss && !this.finished && this.bossHP > 0 && this.movesSinceBossAttack >= 5) {
      this.movesSinceBossAttack = 0;
      this.bossAttack();
      return;
    }
    this.castingResolve = false; // resolution finished — dragons can recharge again
    this.state = 'idle';
    if (this.movesLeft <= 0) { this.fail(); return; }
    if (!this.hasPossibleMove()) this.shuffleBoard();
  };

  Engine.prototype.bossAttack = function () {
    this.shake = 0.7;
    this.bossHitFlash = 0;
    global.Audio2.play('dragon');
    const n = 2 + (this.level.island || 0);
    let placed = 0, guard = 0;
    while (placed < n && guard++ < 300) {
      const r = rnd(this.rows), c = rnd(this.cols);
      const t = this.grid[r][c];
      if (t && !t.ice && !t.chain && t.special === SP.NONE) {
        t.ice = true; t.blockHp = 1; placed++;
        this.spawnBurst(this.cellX(c) + this.tile / 2, this.cellY(r) + this.tile / 2, '#5fd0ff', 12);
      }
    }
    this.spawnRing(this.viewport.x + this.viewport.size / 2, this.viewport.y + this.viewport.size / 2, this.viewport.size * 0.7, (this.level.bossDef && this.level.bossDef.color) || '#ff6a3d');
    this.cb.onBossAttack && this.cb.onBossAttack(placed);
    this.endResolve();
  };

  // ---- Dragons ------------------------------------------------------------
  Engine.prototype.chargeDragons = function (amount) {
    // Dragons do NOT recharge from their own ability clears — only from the
    // player's matches — otherwise abilities could be chained for free.
    if (this.castingResolve) return;
    amount = amount * (this.chargeMult || 1);
    const self = this;
    this.dragons.forEach(function (d) {
      if (self.finished) return;
      d.charge += amount;
      if (d.charge >= d.need) {
        const auto = global.Save.get().settings.autoDragons === true;
        if (!auto) {
          // Active mode: ready only if it hasn't already fired this move.
          d.charge = d.need; d.ready = !self.dragonsActivatedThisMove[d.id];
        } else if (self.dragonsActivatedThisMove[d.id]) {
          d.charge = d.need; // already fired this move — hold full until next move
        } else {
          d.charge = 0;
          d.flashing = 0.8;
          self.dragonsActivatedThisMove[d.id] = true;
          // Queue activation; processed between resolve passes (never recursively).
          if (self.pendingDragons.indexOf(d) === -1) self.pendingDragons.push(d);
        }
      }
    });
    this.cb.onDragons && this.cb.onDragons(this.dragons);
  };

  // Whether an ability benefits from manual aiming.
  Engine.prototype.abilityNeedsAim = function (d) { return d.def.ability === 'row' || d.def.ability === 'bonus'; };

  // Player taps a ready dragon (active mode). target = {r,c} when aimed.
  Engine.prototype.castReady = function (d, target) {
    if (this.state !== 'idle' || this.finished || !d.ready) return false;
    d.ready = false; d.charge = 0; d.flashing = 0.8;
    this.dragonsActivatedThisMove = this.dragonsActivatedThisMove || {};
    this.dragonsActivatedThisMove[d.id] = true; // one cast per move
    this.state = 'busy';
    this.activateDragon(d, target);
    this.cb.onDragons && this.cb.onDragons(this.dragons);
    return true;
  };

  Engine.prototype.readyDragons = function () { return this.dragons.filter(function (d) { return d.ready; }); };

  // Dragon Synergy: combine 2+ ready dragons into one spectacular ultimate.
  Engine.prototype.castSynergy = function () {
    const ready = this.readyDragons();
    if (this.state !== 'idle' || this.finished || ready.length < 2) return false;
    const self = this;
    const used = ready.slice(0, 3);
    this.state = 'busy';
    this.castingResolve = true;
    this.dragonsActivatedThisMove = this.dragonsActivatedThisMove || {};
    let power = 0;
    used.forEach(function (d) { d.ready = false; d.charge = 0; d.flashing = 1.2; self.dragonsActivatedThisMove[d.id] = true; power += d.level + (((d.tier || 1) - 1) * 2); });

    const set = {};
    const add = function (r, c) { if (r >= 0 && r < self.rows && c >= 0 && c < self.cols && !self.grid[r][c].ice) set[r + ',' + c] = { r: r, c: c }; };
    used.forEach(function (d) {
      const ab = d.def.ability;
      if (ab === 'row') { const r = rnd(self.rows); for (let c = 0; c < self.cols; c++) add(r, c); const r2 = rnd(self.rows); for (let c = 0; c < self.cols; c++) add(r2, c); }
      else if (ab === 'random') { for (let k = 0; k < 6 + power; k++) add(rnd(self.rows), rnd(self.cols)); }
      else if (ab === 'freeze') { for (let r = 0; r < self.rows; r++) for (let c = 0; c < self.cols; c++) { const t = self.grid[r][c]; if (t.ice) { t.ice = false; t.crate = false; t.blockHp = 0; self.iceLeft = Math.max(0, self.iceLeft - 1); } if (t.chain) t.chain = false; } }
      else if (ab === 'bonus') { for (let k = 0; k < 2 + (power / 3 | 0); k++) { const r = rnd(self.rows), c = rnd(self.cols), t = self.grid[r][c]; if (t && !t.ice && t.special === SP.NONE) t.special = (rnd(2) ? SP.BOMB : SP.LINE_H); } }
      else if (ab === 'shuffle') { self.movesLeft += 2; }
    });
    // central mega-blast scaled by combined power
    const cr = this.rows >> 1, cc = this.cols >> 1, rad = 1 + Math.min(3, power / 3 | 0);
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) add(cr + dr, cc + dc);
    // bonus: synergy grants a couple of moves
    this.movesLeft += 2; this.cb.onMoves && this.cb.onMoves(this.movesLeft);

    // spectacle
    this.shake = 1;
    used.forEach(function (d, i) {
      const sc = D.SKIN_COLORS[(global.Save.get().activeSkins[d.id])] || d.def;
      self.dragonFx.push({ x: self.viewport.x - 60, y: self.viewport.y + self.viewport.size * (0.3 + i * 0.2), vx: (self.viewport.size + 160) / 0.8, t: 0, life: 0.8, emoji: d.def.emoji, id: d.id, color: sc.color || d.def.color });
      self.spawnRing(self.viewport.x + self.viewport.size / 2, self.viewport.y + self.viewport.size / 2, self.viewport.size * (0.6 + i * 0.15), sc.color || d.def.color);
    });
    global.Audio2.play('dragon');
    this.cb.onDragons && this.cb.onDragons(this.dragons);
    this.cb.onSynergy && this.cb.onSynergy(used);
    this.combo = Math.max(this.combo, 2);
    if (Object.keys(set).length) this.clearSet(set);
    else this.endResolve();
    return true;
  };

  Engine.prototype.activateDragon = function (d, target) {
    this.castingResolve = true; // suppress self-recharge for the whole resolution
    global.Audio2.play('dragon');
    global.Save.addStat('dragonProcs', 1);
    this.cb.onDragonProc && this.cb.onDragonProc(d);
    const power = d.level + (((d.tier || 1) - 1) * 2) + (this.powerBonus || 0); // evolution + relics
    const sc = D.SKIN_COLORS[(global.Save.get().activeSkins[d.id])] || null;
    const color = sc ? sc.color : d.def.color;
    // visual flyover
    this.dragonFx.push({
      x: this.viewport.x - 60, y: this.viewport.y + rnd(this.viewport.size),
      vx: (this.viewport.size + 120) / 0.7, t: 0, life: 0.7, emoji: d.def.emoji, id: d.id, color: color
    });
    this.shake = 0.5;
    this.spawnRing(this.viewport.x + this.viewport.size / 2, this.viewport.y + this.viewport.size / 2, this.viewport.size * 0.6, color);

    const set = {};
    const self = this;
    if (d.def.ability === 'row') {
      const rows = [];
      if (target) {
        rows.push(target.r);
        if (power >= 4 && target.r + 1 < this.rows) rows.push(target.r + 1); // upgraded burns extra row
      } else {
        const count = Math.min(this.rows, 1 + Math.floor(power / 2));
        for (let k = 0; k < count; k++) rows.push(rnd(this.rows));
      }
      rows.forEach(function (r) { for (let c = 0; c < self.cols; c++) if (!self.grid[r][c].ice) set[r + ',' + c] = { r: r, c: c }; });
    } else if (d.def.ability === 'random') {
      const count = d.def.basePower + power * 2;
      for (let k = 0; k < count; k++) {
        const r = rnd(this.rows), c = rnd(this.cols);
        if (!this.grid[r][c].ice) set[r + ',' + c] = { r: r, c: c };
      }
    } else if (d.def.ability === 'freeze') {
      // shatter all blockers and free all chains on the board
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t.ice) {
          t.ice = false; t.crate = false; t.blockHp = 0;
          this.iceLeft = Math.max(0, this.iceLeft - 1);
          this.spawnBurst(this.cellX(c) + this.tile / 2, this.cellY(r) + this.tile / 2, '#bff0ff', 10);
        }
        if (t.chain) { t.chain = false; this.spawnBurst(this.cellX(c) + this.tile / 2, this.cellY(r) + this.tile / 2, '#ffd24d', 8); }
      }
      this.emitObjective();
    } else if (d.def.ability === 'bonus') {
      // turn crystals into special bonus crystals (aimed cell or random)
      const cells = [];
      if (target) { cells.push(target); }
      const count = 1 + power;
      for (let k = cells.length; k < count; k++) cells.push({ r: rnd(this.rows), c: rnd(this.cols) });
      cells.forEach(function (cell) {
        const t = self.grid[cell.r][cell.c];
        if (t && !t.ice && t.special === SP.NONE) {
          t.special = (rnd(2) === 0) ? SP.LINE_H : SP.BOMB;
          self.spawnBurst(self.cellX(cell.c) + self.tile / 2, self.cellY(cell.r) + self.tile / 2, '#5fe39a', 12);
        }
      });
    } else if (d.def.ability === 'shuffle') {
      this.movesLeft += 2 + power;
      this.cb.onMoves && this.cb.onMoves(this.movesLeft);
      this.state = 'busy';
      this.shuffleBoard(true); // sets afterAnims → resolveStep → endResolve
      return;
    }

    if (Object.keys(set).length) {
      this.state = 'busy';
      this.combo = Math.max(this.combo, 1);
      this.clearSet(set); // → collapse → resolveStep → endResolve (drains next)
    } else {
      // Instantaneous ability (freeze/bonus): continue draining the queue.
      this.endResolve();
    }
  };

  // ---- Objective / win / lose ---------------------------------------------
  Engine.prototype.emitObjective = function () {
    if (this.isBoss) {
      this.cb.onBoss && this.cb.onBoss(this.bossHP, this.bossMax, this.level.bossDef);
      this.cb.onObjective && this.cb.onObjective(this.bossMax - this.bossHP, this.bossMax, '❤ Бос');
      return;
    }
    let cur, goal, label;
    if (this.level.objective === D.OBJ.SCORE) { cur = this.score; goal = this.level.target; label = T('obj_score'); }
    else if (this.level.objective === D.OBJ.COLLECT) { cur = this.collected; goal = this.level.target; label = D.CRYSTALS[this.level.color].glyph; }
    else if (this.level.objective === D.OBJ.JELLY) { cur = this.level.jellyCount - this.jellyLeft; goal = this.level.jellyCount; label = T('obj_jelly'); }
    else { cur = this.level.iceCount - this.iceLeft; goal = this.level.iceCount; label = T('obj_ice'); }
    this.cb.onObjective && this.cb.onObjective(Math.min(cur, goal), goal, label);
  };

  Engine.prototype.checkWin = function () {
    let done = false;
    if (this.isBoss) done = this.bossHP <= 0;
    else if (this.level.objective === D.OBJ.SCORE) done = this.score >= this.level.target;
    else if (this.level.objective === D.OBJ.COLLECT) done = this.collected >= this.level.target;
    else if (this.level.objective === D.OBJ.JELLY) done = this.jellyLeft <= 0;
    else done = this.iceLeft <= 0;
    if (done && !this.finished) { this.win(); return true; }
    return false;
  };

  Engine.prototype.computeStars = function () {
    // Stars reward efficiency: the more moves left when the goal is met,
    // the higher the rating (works for every objective type).
    const total = this.level.moves || 1;
    const ratio = Math.max(0, this.movesLeft) / total;
    if (ratio >= 0.4) return 3;   // finished with ≥40% of moves to spare
    if (ratio >= 0.15) return 2;  // ≥15% to spare
    return 1;
  };

  Engine.prototype.win = function () {
    this.finished = true;
    this.state = 'done';
    const stars = this.computeStars();
    global.Audio2.play('win');
    // "Sugar crush" finale: leftover moves explode into a bonus + fireworks.
    const bonus = (!this.isBoss && this.movesLeft > 0) ? this.movesLeft * 50 : 0;
    if (bonus > 0) {
      this.score += bonus;
      this.cb.onScore && this.cb.onScore(this.score);
      this.addFloater(this.viewport.x + this.viewport.size / 2, this.viewport.y + this.viewport.size / 2 - 30, T('sugar_bonus', { n: bonus }), '#ffd24d');
      this.victory = { t: 0, dur: 1.4, stars: stars, fired: false };
    } else {
      this.cb.onWin && this.cb.onWin({ score: this.score, stars: stars });
    }
  };
  Engine.prototype.fail = function () {
    if (this.finished) return;
    this.finished = true;
    this.state = 'done';
    global.Audio2.play('lose');
    this.cb.onLose && this.cb.onLose({ score: this.score });
  };
  // Endless/Blitz finish: no win/lose, just a final score.
  Engine.prototype.modeEnd = function () {
    if (this.finished) return;
    this.finished = true;
    this.state = 'done';
    global.Audio2.play('win');
    this.cb.onModeEnd && this.cb.onModeEnd({ score: this.score });
  };

  // ---- Helpers: possible moves / shuffle ----------------------------------
  Engine.prototype.movable = function (r, c) { const t = this.grid[r][c]; return t && !t.ice && !t.chain; };
  Engine.prototype.hasPossibleMove = function () {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.movable(r, c)) continue;
      if (c + 1 < this.cols && this.movable(r, c + 1)) { this.swapRaw(r, c, r, c + 1); const m = this.findMatches().length; this.swapRaw(r, c, r, c + 1); if (m) return true; }
      if (r + 1 < this.rows && this.movable(r + 1, c)) { this.swapRaw(r, c, r + 1, c); const m = this.findMatches().length; this.swapRaw(r, c, r + 1, c); if (m) return true; }
    }
    return false;
  };
  Engine.prototype.swapRaw = function (r1, c1, r2, c2) {
    const t = this.grid[r1][c1]; this.grid[r1][c1] = this.grid[r2][c2]; this.grid[r2][c2] = t;
  };
  Engine.prototype.shuffleBoard = function (silent) {
    const types = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if (!this.grid[r][c].ice) types.push(this.grid[r][c].type);
    let guard = 0;
    do {
      for (let i = types.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = types[i]; types[i] = types[j]; types[j] = t; }
      let idx = 0;
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
        if (!this.grid[r][c].ice) { this.grid[r][c].type = types[idx++]; this.grid[r][c].special = SP.NONE; }
    } while ((this.findMatches().length || !this.hasPossibleMove()) && guard++ < 40);
    if (!silent) this.cb.onShuffle && this.cb.onShuffle();
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) this.grid[r][c].scale = 0.4;
    const self = this;
    if (silent) { this.afterAnims(function () { self.resolveStep(); }); }
  };

  Engine.prototype.findHintMove = function () {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.movable(r, c)) continue;
      const tries = [[r, c, r, c + 1], [r, c, r + 1, c]];
      for (let k = 0; k < tries.length; k++) {
        const r2 = tries[k][2], c2 = tries[k][3];
        if (r2 >= this.rows || c2 >= this.cols || !this.movable(r2, c2)) continue;
        this.swapRaw(r, c, r2, c2);
        const ok = this.findMatches().length > 0;
        this.swapRaw(r, c, r2, c2);
        if (ok) return { a: { r: r, c: c }, b: { r: r2, c: c2 } };
      }
    }
    return null;
  };

  // ---- Booster actions (called from the HUD) ------------------------------
  Engine.prototype.boosterShuffle = function () {
    if (this.state !== 'idle' || this.finished) return false;
    this.state = 'busy';
    this.shuffleBoard(true);
    if (this.cb.onShuffle) this.cb.onShuffle();
    return true;
  };
  Engine.prototype.boosterAddMoves = function (n) {
    if (this.finished) return false;
    this.movesLeft += (n || 5);
    this.cb.onMoves && this.cb.onMoves(this.movesLeft);
    return true;
  };
  Engine.prototype.armHammer = function (on) {
    if (this.state !== 'idle' || this.finished) { this.hammerArmed = false; return false; }
    this.hammerArmed = on;
    return on;
  };
  Engine.prototype.hammerAt = function (px, py) {
    const cell = this.pickCell(px, py);
    if (!cell || this.state !== 'idle' || this.finished) return false;
    this.hammerArmed = false;
    this.state = 'busy';
    this.dragonsActivatedThisMove = {};
    const set = {};
    const t = this.grid[cell.r][cell.c];
    if (t && t.ice) { t.ice = false; t.crate = false; t.blockHp = 0; this.iceLeft = Math.max(0, this.iceLeft - 1); }
    if (t && t.chain) { t.chain = false; }
    set[cell.r + ',' + cell.c] = { r: cell.r, c: cell.c };
    this.spawnRing(this.cellX(cell.c) + this.tile / 2, this.cellY(cell.r) + this.tile / 2, this.tile * 1.6, '#ffd24d');
    this.shake = 0.5;
    global.Audio2.play('special');
    this.clearSet(set);
    return true;
  };

  // ---- Special-crystal combos (special swapped onto special) ---------------
  Engine.prototype.comboSpecials = function (a, b, ta, tb) {
    const set = {};
    const self = this;
    const add = function (r, c) { if (r >= 0 && r < self.rows && c >= 0 && c < self.cols && !self.grid[r][c].ice) set[r + ',' + c] = { r: r, c: c }; };
    const hasR = ta.special === SP.RAINBOW || tb.special === SP.RAINBOW;
    const bombs = (ta.special === SP.BOMB ? 1 : 0) + (tb.special === SP.BOMB ? 1 : 0);
    const lines = (ta.special === SP.LINE_H || ta.special === SP.LINE_V ? 1 : 0) + (tb.special === SP.LINE_H || tb.special === SP.LINE_V ? 1 : 0);
    if (ta.special === SP.RAINBOW && tb.special === SP.RAINBOW) {
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) add(r, c); // clear board
    } else if (hasR && bombs) {
      const col = (ta.special === SP.RAINBOW ? tb.type : ta.type);
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c].type === col) { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc); }
    } else if (hasR && lines) {
      const col = (ta.special === SP.RAINBOW ? tb.type : ta.type);
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c].type === col) { for (let cc = 0; cc < this.cols; cc++) add(r, cc); for (let rr = 0; rr < this.rows; rr++) add(rr, c); }
    } else if (bombs === 2) {
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) add(b.r + dr, b.c + dc); // 5x5
    } else if (bombs && lines) {
      for (let d = -1; d <= 1; d++) { for (let cc = 0; cc < this.cols; cc++) add(b.r + d, cc); for (let rr = 0; rr < this.rows; rr++) add(rr, b.c + d); } // thick cross
    } else {
      for (let cc = 0; cc < this.cols; cc++) add(b.r, cc); for (let rr = 0; rr < this.rows; rr++) add(rr, b.c); // cross
    }
    this.spawnRing(this.cellX(b.c) + this.tile / 2, this.cellY(b.r) + this.tile / 2, this.tile * 4, '#ffffff');
    this.shake = 0.8;
    global.Audio2.play('special');
    this.clearSet(set);
  };

  // ---- Particles / floaters -----------------------------------------------
  Engine.prototype.spawnRing = function (x, y, maxR, color) {
    this.rings = this.rings || [];
    this.rings.push({ x: x, y: y, maxR: maxR, color: color || '#fff', t: 0, life: 0.5 });
  };
  Engine.prototype.spawnBurst = function (x, y, color, n) {
    n = n || 6;
    const perf = global.Save.get().settings.perf;
    if (perf) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 200;
      const shard = !perf && i % 2 === 0;
      this.particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        t: 0, life: 0.45 + Math.random() * 0.45, color: color,
        size: shard ? (this.tile * (0.1 + Math.random() * 0.12)) : (2 + Math.random() * 4),
        shard: shard, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 18
      });
    }
  };
  Engine.prototype.addFloater = function (x, y, text, color) {
    this.floaters.push({ x: x, y: y, text: text, color: color, t: 0, life: 0.9 });
  };

  // ---- Rendering ----------------------------------------------------------
  Engine.prototype.draw = function (g) {
    const v = this.viewport, tile = this.tile;
    g.save();
    if (this.shake > 0) {
      g.translate((Math.random() - 0.5) * this.shake * 10, (Math.random() - 0.5) * this.shake * 10);
    }
    // board backing
    this.roundRect(g, v.x - 8, v.y - 8, v.size + 16, v.size + 16, 22);
    g.fillStyle = 'rgba(8,6,30,0.55)'; g.fill();
    // grid cells checker
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      g.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.02)';
      g.fillRect(this.cellX(c), this.cellY(r), tile, tile);
    }
    // jelly layer (cell-based, drawn under crystals)
    if (this.jellyGrid) for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const j = this.jellyGrid[r][c];
      if (!j) continue;
      const x = this.cellX(c), y = this.cellY(r);
      this.roundRect(g, x + 2, y + 2, tile - 4, tile - 4, 10);
      g.fillStyle = j >= 2 ? 'rgba(255,90,200,0.42)' : 'rgba(255,120,210,0.24)';
      g.fill();
      g.strokeStyle = 'rgba(255,150,220,0.5)'; g.lineWidth = 2; g.stroke();
    }
    // tiles
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const t = this.grid[r][c];
      if (!t) continue;
      let x = this.cellX(c), y = this.cellY(r);
      if (t.anim) {
        const p = ease(Math.min(1, t.anim.t / t.anim.dur));
        x = t.anim.fromX + (t.anim.toX - t.anim.fromX) * p;
        y = t.anim.fromY + (t.anim.toY - t.anim.fromY) * p;
      }
      this.drawTile(g, t, x, y, tile);
    }
    // selection highlight
    if (this.selected) {
      g.strokeStyle = '#ffffff'; g.lineWidth = 3;
      this.roundRect(g, this.cellX(this.selected.c) + 3, this.cellY(this.selected.r) + 3, tile - 6, tile - 6, 10);
      g.stroke();
    }
    // idle hint pulse
    if (this.hint) {
      const pulse = 0.5 + 0.5 * Math.sin((this.hintPulse || 0) * 6);
      g.strokeStyle = 'rgba(255,255,255,' + (0.35 + pulse * 0.55) + ')';
      g.lineWidth = 2 + pulse * 3;
      [this.hint.a, this.hint.b].forEach((cell) => {
        this.roundRect(g, this.cellX(cell.c) + 4, this.cellY(cell.r) + 4, tile - 8, tile - 8, 10);
        g.stroke();
      });
    }
    // shockwave rings
    if (this.rings) for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      const p = ring.t / ring.life;
      g.globalAlpha = Math.max(0, 1 - p);
      g.strokeStyle = ring.color; g.lineWidth = 4 * (1 - p) + 1;
      g.beginPath(); g.arc(ring.x, ring.y, ring.maxR * ease(p), 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
    // particles (glowing dots + spinning shards)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      g.globalAlpha = Math.max(0, 1 - p.t / p.life);
      g.fillStyle = p.color;
      if (p.shard) {
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot);
        const s = p.size;
        g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.6); g.lineTo(-s * 0.7, s * 0.6); g.closePath();
        g.shadowColor = p.color; g.shadowBlur = 8; g.fill();
        g.restore();
      } else {
        g.shadowColor = p.color; g.shadowBlur = 8;
        g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill();
      }
    }
    g.shadowBlur = 0; g.globalAlpha = 1;
    // dragon flyover
    for (let i = 0; i < this.dragonFx.length; i++) {
      const fx = this.dragonFx[i];
      g.globalAlpha = Math.min(1, fx.t * 4) * Math.max(0, 1 - fx.t / fx.life);
      g.shadowColor = fx.color; g.shadowBlur = 30;
      const sp = global.DragonSprites && fx.id && global.DragonSprites.ready(fx.id) ? global.DragonSprites.img(fx.id) : null;
      if (sp) {
        const sz = tile * 2.4;
        g.drawImage(sp, fx.x - sz / 2, fx.y - sz / 2, sz, sz);
      } else {
        g.font = (tile * 1.6) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(fx.emoji, fx.x, fx.y);
      }
      g.shadowBlur = 0;
    }
    g.globalAlpha = 1;
    // floaters
    for (let i = 0; i < this.floaters.length; i++) {
      const f = this.floaters[i];
      g.globalAlpha = Math.max(0, 1 - f.t / f.life);
      g.fillStyle = f.color; g.font = 'bold 22px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(f.text, f.x, f.y);
    }
    g.globalAlpha = 1;
    g.restore();
  };

  Engine.prototype.drawTile = function (g, t, x, y, tile) {
    const pad = tile * 0.1;
    // Springy overshoot when a tile pops in; plain scale when dying.
    const vis = (t.dying || t.scale >= 1) ? t.scale : Math.max(0, easeBack(t.scale));
    const cx = x + tile / 2, cy = y + tile / 2;
    g.save();
    g.translate(cx, cy);
    g.scale(vis, vis);
    g.translate(-cx, -cy);

    if (t.ice) {
      this.roundRect(g, x + pad, y + pad, tile - pad * 2, tile - pad * 2, 8);
      const ig = g.createLinearGradient(x, y, x, y + tile);
      if (t.crate) { ig.addColorStop(0, '#d8a866'); ig.addColorStop(1, '#a06a32'); }
      else { ig.addColorStop(0, '#dff6ff'); ig.addColorStop(1, '#9cc8e8'); }
      g.fillStyle = ig; g.fill();
      g.strokeStyle = t.crate ? 'rgba(90,50,20,0.7)' : 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.stroke();
      if (t.crate) {
        // plank lines + hit count
        g.beginPath(); g.moveTo(x + pad, cy); g.lineTo(x + tile - pad, cy); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = 'bold ' + (tile * 0.3) + 'px system-ui';
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.blockHp, cx, cy);
      }
      g.restore();
      return;
    }

    const cr = D.CRYSTALS[t.type];
    const RADII = [0.22, 0.5, 0.1, 0.36, 0.26];
    const island = (this.level && this.level.island) || 0;
    const rad = tile * (RADII[island] != null ? RADII[island] : 0.22);
    const bx = x + pad, by = y + pad, bw = tile - pad * 2, bh = tile - pad * 2;

    // soft drop shadow
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.38)'; g.shadowBlur = tile * 0.12; g.shadowOffsetY = tile * 0.05;
    this.roundRect(g, bx, by, bw, bh, rad);
    const grd = g.createLinearGradient(x, y, x, y + tile);
    grd.addColorStop(0, cr.c1); grd.addColorStop(1, cr.c2);
    g.fillStyle = grd; g.fill();
    g.restore();

    // clip to the gem for interior shading
    g.save();
    this.roundRect(g, bx, by, bw, bh, rad); g.clip();
    // radial sheen from top-left
    const rg = g.createRadialGradient(cx - tile * 0.14, cy - tile * 0.18, tile * 0.04, cx, cy, tile * 0.62);
    rg.addColorStop(0, 'rgba(255,255,255,0.6)'); rg.addColorStop(0.45, 'rgba(255,255,255,0.12)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(bx, by, bw, bh);
    // faceted cut lines
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = Math.max(1, tile * 0.02);
    g.beginPath(); g.moveTo(cx, by); g.lineTo(bx + bw, cy); g.lineTo(cx, by + bh); g.lineTo(bx, cy); g.closePath(); g.stroke();
    // bottom inner shadow for depth
    const sg = g.createLinearGradient(x, cy, x, y + tile);
    sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = sg; g.fillRect(bx, cy, bw, bh / 2);
    g.restore();

    // beveled rim (light top → dark bottom)
    const rim = g.createLinearGradient(x, y, x, y + tile);
    rim.addColorStop(0, 'rgba(255,255,255,0.65)'); rim.addColorStop(0.5, 'rgba(255,255,255,0.08)'); rim.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.strokeStyle = rim; g.lineWidth = Math.max(1.2, tile * 0.05);
    this.roundRect(g, bx, by, bw, bh, rad); g.stroke();

    // specular highlight
    g.beginPath();
    g.ellipse(cx - tile * 0.13, cy - tile * 0.16, tile * 0.16, tile * 0.09, -0.5, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill();
    g.beginPath(); g.arc(cx + tile * 0.12, cy + tile * 0.12, tile * 0.025, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
    // core sparkle / glyph
    if (t.special !== SP.NONE) {
      g.shadowColor = '#fff'; g.shadowBlur = 14;
      g.fillStyle = '#fff'; g.font = 'bold ' + (tile * 0.42) + 'px system-ui';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const sym = t.special === SP.RAINBOW ? '✦' : (t.special === SP.BOMB ? '✸' : '↔');
      g.fillText(sym, cx, cy);
      g.shadowBlur = 0;
    } else if (global.Save.get().settings.colorblind) {
      // colorblind aid: a unique symbol per crystal type
      const SYM = ['●', '▲', '■', '◆', '★', '✚'];
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.font = 'bold ' + (tile * 0.34) + 'px system-ui';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(SYM[t.type % SYM.length], cx, cy);
    } else {
      g.beginPath(); g.arc(cx, cy, tile * 0.07, 0, Math.PI * 2);
      g.fillStyle = cr.core; g.fill();
    }
    // chain overlay (locked crystal)
    if (t.chain) {
      g.strokeStyle = 'rgba(40,30,20,0.85)'; g.lineWidth = tile * 0.09;
      g.beginPath(); g.moveTo(x + pad, cy); g.lineTo(x + tile - pad, cy); g.stroke();
      g.beginPath(); g.moveTo(cx, y + pad); g.lineTo(cx, y + tile - pad); g.stroke();
      g.strokeStyle = 'rgba(220,200,140,0.9)'; g.lineWidth = tile * 0.04;
      g.beginPath(); g.moveTo(x + pad, cy); g.lineTo(x + tile - pad, cy); g.stroke();
      g.beginPath(); g.moveTo(cx, y + pad); g.lineTo(cx, y + tile - pad); g.stroke();
    }
    g.restore();
  };

  Engine.prototype.roundRect = function (g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  global.Engine = Engine;
})(window);
