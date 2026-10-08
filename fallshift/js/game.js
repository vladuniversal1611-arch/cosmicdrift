/* FALLSHIFT — game orchestration: run lifecycle, physics & collisions, combo/fever, power-ups,
   worlds & modifiers, boss flow and the frame render order. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;
  const C = FS.C;
  const LG = () => FS.LevelGen;

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.W = C.LW;
      this.H = 844;
      this.u = 1;
      this.scale = 1;
      this.tower = new FS.Tower();
      this.player = new FS.Player();
      this.fx = new FS.FX();
      this.abilities = new FS.Abilities(this);
      this.ui = FS.UI;
      this.input = null;
      this.state = 'menu';
      this.camY = 0;
      this.time = 0;
      this.lastDt = 0.016;
      this.timeScale = 1;
      this.world = 0;
      this.bgPrev = 0;
      this.bgBlend = 1;
      this.visRings = [];
      this.tmp = { x: 0, y: 0, front: false };
      this.powers = {};
      this.powerOrder = [];
      this.powersVer = 0;
      this.stats = FS.Upgrades.baseStats(FS.Storage.data);
      this.debris = [];
      this.cacheGrad = {};
      this.perf = { acc: 0, n: 0, downgraded: false };
      this.tower.onCrumble = (r, i) => this.onCrumble(r, i);
      this.resetRunVars();
    }

    resetRunVars() {
      this.score = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.deepest = 0;
      this.floor = 1;
      this.depth = 0;
      this.fever = 0;
      this.feverMax = 6;
      this.feverCharge = 0;
      this.fallStreak = 0;
      this.lastPassT = 0;
      this.decayAcc = 0;
      this.runCoins = 0;
      this.runCrystals = 0;
      this.bankedCoins = 0;
      this.bankedCrystals = 0;
      this.revived = false;
      this.boss = null;
      this.bossDone = {};
      this.modifier = null;
      this.pendingPower = 0;
      this.debris.length = 0;
      this.debrisT = 4;
      this.endlessShown = false;
      this.tutStep = 0;
    }

    // ---------------------------------------------------------------- sizing / quality
    resize(cssW, cssH, dpr) {
      this.u = cssW / C.LW;
      this.scale = dpr * this.u;
      this.H = cssH / this.u;
      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.tower.setScale(this.scale);
      this.fx.W = C.LW;
      this.fx.H = this.H;
      this.cacheGrad = {};
    }

    applyQuality() {
      const hq = FS.Storage.data.settings.hq;
      this.fx.quality = hq ? 1 : 0.55;
      this.fx.setAmbient(FS.WORLDS[this.world].ambient, FS.WORLDS[this.world].ambColors);
      if (this.onQuality) this.onQuality();
    }

    skinGlow() {
      const s = FS.Upgrades.getSkin(FS.Storage.data.skin);
      return s.glow === 'rainbow' ? '#ffffff' : s.glow;
    }

    // ---------------------------------------------------------------- menu demo
    setupDemo() {
      this.resetRunVars();
      this.tower.reset(1000 + ((Math.random() * 9000) | 0), {});
      this.player.reset(this.stats);
      this.player.y = 40;
      this.world = 0;
      this.bgPrev = 0;
      this.bgBlend = 1;
      this.camY = this.player.projY() - this.H * 0.5;
      this.tower.ensure(1, 10);
      this.fx.clear();
      this.fx.setAmbient(FS.WORLDS[0].ambient, FS.WORLDS[0].ambColors);
    }

    updateDemo(dt) {
      const p = this.player;
      const t = this.tower;
      t.update(dt);
      p.y += 150 * dt;
      p.vy = 150;
      const f = Math.ceil((p.y + C.CORE_R) / C.SPACING);
      t.ensure(f - 2, f + 8);
      t.prune(f - 4);
      // auto-pilot: steer the next ring's opening under the core
      const r = t.get(f);
      if (r) {
        const rel = t.coreRel(r);
        let best = null, bd = 9;
        for (let i = 0; i < r.n; i++) {
          if (t.isSolid(r.segs[i])) continue;
          const d = U.angDiff((i + 0.5) * r.w, rel);
          if (Math.abs(d) < Math.abs(bd)) {
            bd = d;
            best = i;
          }
        }
        if (best !== null) t.angle -= bd * Math.min(1, dt * 3.5);
      }
      this.updateWorld(f, true);
      p.pushTrail(p.projY());
      const prev = this.camY;
      this.camY = p.projY() - this.H * 0.5;
      this.fx.updateAmbient(dt, this.camY - prev);
      if (Math.random() < dt * 20) this.fx.spawn(C.LW / 2 + (Math.random() - 0.5) * 10, p.projY(), (Math.random() - 0.5) * 40, -60 - Math.random() * 60, 0.6, 6, this.skinGlow(), 0, 0, 1);
      this.fx.update(dt);
    }

    // ---------------------------------------------------------------- run lifecycle
    startRun() {
      const save = FS.Storage.data;
      if (this.state === 'paused' || this.state === 'powerup') this.bankRun();
      this.stats = FS.Upgrades.baseStats(save);
      this.resetRunVars();
      this.feverMax = this.stats.feverDur;
      this.seed = (Math.random() * 1e9) | 0;
      this.tower.reset(this.seed, { lucky: 0 });
      this.player.reset(this.stats);
      this.abilities.reset(this.stats);
      this.powers = {};
      this.powerOrder = [];
      this.powersVer++;
      this.nextPower = U.randInt(Math.random, 6, 8);
      this.world = 0;
      this.bgPrev = 0;
      this.bgBlend = 1;
      this.camY = this.player.projY() - this.H * C.CORE_SCREEN;
      this.tower.ensure(1, 12);
      this.fx.clear();
      this.fx.shakeOn = save.settings.shake;
      this.fx.setAmbient(FS.WORLDS[0].ambient, FS.WORLDS[0].ambColors);
      this.timeScale = 1;
      this.state = 'playing';
      this.ui.hideAll();
      this.ui.showHUD(true);
      FS.Audio.resume();
      FS.Audio.setMode('game');
      FS.Audio.setWorld(0);
      FS.Audio.setFever(false);
      save.stats.runs++;
      FS.Storage.save();
      if (!save.tutorialDone) this.ui.banner('SWIPE ← →', 'ROTATE THE TOWER · FIND THE GAPS', '#3fe6ff', 2.6);
      else this.ui.banner('WORLD 1', 'NEON TOWER', FS.WORLDS[0].accent, 1.8);
    }

    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this.ui.showPause(this);
      FS.Audio.suspend();
    }

    resume() {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      this.ui.hideAll();
      FS.Audio.resume();
    }

    toMenu() {
      if (this.state === 'paused' || this.state === 'powerup' || this.state === 'playing') this.bankRun();
      this.state = 'menu';
      FS.Audio.resume();
      FS.Audio.setMode('menu');
      FS.Audio.setFever(false);
      this.stats = FS.Upgrades.baseStats(FS.Storage.data);
      this.setupDemo();
      this.ui.showMenu();
    }

    onReset() {
      this.stats = FS.Upgrades.baseStats(FS.Storage.data);
      FS.Audio.setSfx(FS.Storage.data.sound);
      FS.Audio.setMusic(FS.Storage.data.music);
      this.fx.shakeOn = true;
      this.applyQuality();
    }

    // commit run results to the save; returns the summary
    bankRun() {
      const save = FS.Storage.data;
      const st = save.stats;
      const coins = this.runCoins - this.bankedCoins;
      const crystals = this.runCrystals - this.bankedCrystals;
      this.bankedCoins = this.runCoins;
      this.bankedCrystals = this.runCrystals;
      save.coins += coins;
      save.crystals += crystals;
      st.totalCoins += coins;
      st.bestRunCoins = Math.max(st.bestRunCoins, this.runCoins);
      st.bestCombo = Math.max(st.bestCombo, this.maxCombo);
      const newBest = this.depth > save.bestDepth + 0.5;
      save.bestDepth = Math.max(save.bestDepth, Math.floor(this.depth));
      save.bestScore = Math.max(save.bestScore, this.score);
      save.bestFloor = Math.max(save.bestFloor, this.deepest);
      save.unlockedWorlds = Math.max(save.unlockedWorlds, Math.min(5, LG().worldOf(this.floor) + 1 + (this.deepest >= 100 ? 5 : 0)));
      if (this.deepest >= 12) save.tutorialDone = true;
      FS.Storage.save();
      return { newBest };
    }

    die() {
      const p = this.player;
      p.alive = false;
      this.state = 'dying';
      this.deathT = 1.15;
      this.timeScale = 0.35;
      const x = C.LW / 2, y = p.projY();
      const col = this.skinGlow();
      this.fx.burst(x, y, 60, 520, col, { size: 14, life: 1.1, colors: [col, '#ffffff', '#ff3d6a'] });
      this.fx.burst(x, y, 24, 380, col, { kind: 1, size: 7, life: 1.2, grav: 700, colors: ['#ffffff', col] });
      this.fx.wave(x, y, '#ffffff', 220, 0.8, 1, 6);
      this.fx.wave(x, y, col, 160, 0.6, 0.34, 4);
      this.fx.flash('#ffffff', 0.7);
      this.fx.shake(18);
      FS.Audio.play('death');
      FS.Audio.setFever(false);
      this.fever = 0;
    }

    finishRun() {
      const res = this.bankRun();
      const save = FS.Storage.data;
      this.state = 'dead';
      this.timeScale = 1;
      FS.Audio.setMode('menu');
      this.ui.showDeath({
        depth: this.depth,
        score: this.score,
        best: save.bestDepth,
        coins: this.runCoins,
        crystals: this.runCrystals,
        newBest: res.newBest,
        floor: this.floor,
        maxCombo: this.maxCombo,
        canRevive: !this.revived,
      });
    }

    requestRevive() {
      if (this.revived || this.state !== 'dead') return;
      FS.Ads.showRewarded(
        () => this.revive(),
        () => this.ui.toast('Ad not available')
      );
    }

    revive() {
      const p = this.player;
      this.revived = true;
      p.alive = true;
      p.shield = Math.max(1, p.shield);
      p.invuln = 2.6;
      p.energy = Math.max(p.energy, p.maxEnergy * 0.5);
      p.gDir = 1;
      p.gTimer = 0;
      p.dashTimer = 0;
      p.vy = -C.BOUNCE;
      // clear hazards around the core
      for (let f = this.floor - 1; f <= this.floor + 3; f++) {
        const r = this.tower.get(f);
        if (!r || r.boss) continue;
        for (const s of r.segs) if (s.type === 'danger' || s.type === 'pulse') s.type = 'normal';
        if (r.mover) r.mover.alive = false;
        for (const l of r.lasers) l.dead = true;
      }
      if (this.boss) this.boss.onBreak();
      this.debris.length = 0;
      this.state = 'playing';
      this.timeScale = 1;
      this.ui.hideAll();
      this.ui.banner('REVIVED', 'SECOND CHANCE', '#2bffa0', 1.4);
      const x = C.LW / 2, y = p.projY();
      this.fx.wave(x, y, '#2bffa0', 160, 0.7, 1, 5);
      this.fx.burst(x, y, 40, 300, '#2bffa0', { size: 10, life: 0.8 });
      FS.Audio.play('revive');
      FS.Audio.setMode(this.boss ? 'boss' : 'game');
    }

    // ---------------------------------------------------------------- frame
    frame(dt) {
      this.lastDt = dt;
      this.time += dt;
      this.perfCheck(dt);
      if (this.state === 'playing' || this.state === 'dying') this.updatePlay(dt);
      else if (this.state === 'menu') this.updateDemo(dt);
      else {
        // frozen gameplay behind overlays — keep ambient alive
        this.fx.updateAmbient(dt, 0);
        if (this.input) this.input.consumeDX();
      }
      this.render();
    }

    perfCheck(dt) {
      const pf = this.perf;
      if (pf.downgraded || this.state !== 'playing') return;
      pf.acc += dt;
      pf.n++;
      if (pf.acc > 4) {
        const avg = pf.acc / pf.n;
        if (avg > 1 / 40) {
          pf.downgraded = true;
          this.fx.quality = 0.5;
          if (this.onPerfDowngrade) this.onPerfDowngrade();
        }
        pf.acc = 0;
        pf.n = 0;
      }
    }

    physMods() {
      const m = this.modifier;
      let g = 1, fall = 1, bounce = 1;
      if (m === 'lowgrav') { g = 0.62; bounce = 0.8; fall = 0.85; }
      else if (m === 'highspeed') { g = 1.3; fall = 1.45; }
      fall *= 1 + U.clamp((this.floor - 25) * 0.006, 0, 0.3) + (this.floor > 100 ? 0.12 : 0);
      fall *= 1 + (this.powers.overdrive || 0) * 0.25;
      if (this.fever > 0) fall *= 1.25;
      return { g, fall, bounce };
    }

    updatePlay(rawDt) {
      const p = this.player;
      const t = this.tower;
      if (this.state === 'dying') {
        const dt = rawDt * this.timeScale;
        this.deathT -= rawDt;
        t.update(dt);
        this.fx.update(dt);
        this.fx.updateAmbient(dt, 0);
        if (this.deathT <= 0) this.finishRun();
        return;
      }
      const dt = rawDt * this.timeScale;
      const save = FS.Storage.data;

      // ---- rotation input
      const rotMul = save.settings.sensitivity * (1 + (this.powers.overdrive || 0) * 0.25);
      let dA = 0;
      if (this.input) {
        const dx = this.input.consumeDX() / this.u;
        dA -= (dx / C.R_OUT) * rotMul;
        dA -= this.input.keyDir() * 3.4 * rotMul * rawDt;
      }
      if (dA) {
        t.angle += dA;
        if (Math.abs(dA) > 0.02) FS.Audio.play('rotate');
      }

      t.update(dt);
      this.abilities.update(dt);

      // ---- timers
      if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
      if (p.gTimer > 0) {
        p.gTimer -= dt;
        if (p.gTimer <= 0) {
          p.gDir = 1;
          p.gTimer = 0;
        }
      }
      if (p.dashTimer > 0) p.dashTimer -= dt;
      if (this.fever > 0) {
        this.fever -= dt;
        if (this.fever <= 0) {
          this.fever = 0;
          FS.Audio.setFever(false);
        }
      }
      p.addEnergy(0.8 * dt);

      // ---- physics
      const m = this.physMods();
      if (p.dashTimer > 0) {
        p.vy = C.DASH_SPEED;
      } else {
        p.vy += C.GRAVITY * m.g * p.gDir * dt;
        const maxF = C.MAX_FALL * m.fall;
        if (p.vy > maxF) p.vy = Math.max(maxF, p.vy - 4000 * dt);
        if (p.vy < -560) p.vy = -560;
      }
      this.bounceMul = m.bounce;
      this.move(dt);
      if (p.y < -160) {
        p.y = -160;
        p.vy = Math.max(0, p.vy);
      }
      p.pushTrail(p.projY());

      if (this.state !== 'playing') return; // portal/death may change state
      this.checkLasers();
      this.updateDebris(dt);
      if (this.boss) this.boss.update(dt);

      // ---- combo decay when idle
      const delay = (2.6 / this.stats.comboDecay) * (this.powers.combomaster ? 1.5 : 1);
      if (this.combo > 1 && this.time - this.lastPassT > delay) {
        this.decayAcc += dt;
        if (this.decayAcc > 0.7) {
          this.decayAcc = 0;
          this.combo--;
        }
      }

      this.updateProgress();
      const f = Math.ceil((p.y + C.CORE_R) / C.SPACING);
      t.ensure(f - 3, f + 10);
      t.prune(f - 5);

      // ---- pending power-up offer
      if (this.pendingPower > 0) {
        this.pendingPower -= rawDt;
        if (this.pendingPower <= 0) this.offerPowerups();
      }

      // ---- camera
      const look = p.dashTimer > 0 || this.fever > 0 ? 30 : 0;
      const target = p.projY() - this.H * C.CORE_SCREEN + look;
      const prev = this.camY;
      this.camY += (target - this.camY) * Math.min(1, rawDt * 9);
      this.fx.updateAmbient(rawDt, this.camY - prev);

      // ---- core particles
      const x = C.LW / 2, y = p.projY();
      const q = this.fx.quality;
      if (this.fever > 0 && Math.random() < q) {
        for (let k = 0; k < 2; k++) this.fx.spawn(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 60, -120 - Math.random() * 120, 0.45, 10, Math.random() < 0.5 ? '#ff9a3c' : '#ffd27a', 0, 0, 1);
      } else if (this.combo >= 4 && Math.random() < Math.min(0.9, this.combo * 0.06) * q) {
        this.fx.spawn(x + (Math.random() - 0.5) * 12, y, (Math.random() - 0.5) * 50, -40 - Math.random() * 60, 0.5, 6, this.skinGlow(), 0, 0, 1);
      }
      if (p.dashTimer > 0 && Math.random() < q) this.fx.spawn(x + (Math.random() - 0.5) * 18, y - 10, 0, -500, 0.25, 4, '#ffffff', 2, 0, 0);

      this.fx.update(rawDt);
      this.ui.updateHUD(this);
    }

    // ---------------------------------------------------------------- movement & collisions
    move(dt) {
      const p = this.player, S = C.SPACING, R = C.CORE_R, T = C.THICK;
      const y0 = p.y, y1 = p.y + p.vy * dt;
      if (p.vy >= 0) {
        for (let f = Math.max(1, Math.ceil((y0 + R - 0.01) / S)); f * S <= y1 + R; f++) {
          const ring = this.tower.get(f);
          if (!ring) continue;
          const res = this.crossDown(ring);
          if (res === 'land') {
            p.y = ring.y - R;
            return;
          }
          if (res === 'warp') return;
        }
        p.y = y1;
      } else {
        for (let f = Math.floor((y0 - R - T + 0.01) / S); f >= 1 && f * S + T > y1 - R; f--) {
          const ring = this.tower.get(f);
          if (!ring) continue;
          if (this.crossUp(ring)) {
            p.y = f * S + T + R;
            return;
          }
        }
        p.y = y1;
      }
    }

    crossUp(ring) {
      const t = this.tower, p = this.player;
      const rel = t.coreRel(ring);
      const seg = ring.segs[t.segIndex(ring, rel)];
      const bossLive = ring.boss && this.boss && this.boss.ring === ring && this.boss.state !== 'dead';
      if (!bossLive && !t.isSolid(seg) && !t.moverCovers(ring, rel)) return false;
      p.vy = p.gDir < 0 ? 240 : Math.abs(p.vy) * 0.15;
      const x = C.LW / 2, y = ring.y + C.THICK + C.MID * C.K;
      this.fx.burst(x, y, 6, 120, '#b06bff', { size: 6, life: 0.3, up: 80 });
      return true;
    }

    crossDown(ring) {
      const t = this.tower, p = this.player;
      const rel = t.coreRel(ring);
      const idx = t.segIndex(ring, rel);
      const seg = ring.segs[idx];
      this.collectPickups(ring, rel);

      if (ring.boss && this.boss && this.boss.ring === ring && this.boss.state !== 'dead') {
        const r = this.boss.onLand(idx, p.dashTimer > 0);
        this.land(ring, seg, r === 'hit' ? 'bosshit' : r === 'hurt' ? 'danger' : 'normal');
        if (r === 'hurt') this.hurt('spike');
        return 'land';
      }

      const solid = t.isSolid(seg);
      if (!solid) {
        if (seg.type === 'portal' && !seg.used && !seg.broken && this.portal(ring, seg)) return 'warp';
        if (seg.type === 'combo' && !seg.used && !seg.broken) this.comboGate(ring, seg);
        this.passFloor(ring);
        return 'pass';
      }
      const onMover = t.moverCovers(ring, rel);
      let type = seg.type;
      if (onMover) type = 'danger';
      const fever = this.fever > 0, dash = p.dashTimer > 0;

      if (type === 'fake') {
        seg.broken = true;
        this.shatter(ring, idx, true);
        this.fx.text(C.LW / 2, p.projY() - 30, 'FAKE!', '#9ab', 14, 0.6);
        FS.Audio.play('crumble');
        this.passFloor(ring);
        return 'pass';
      }
      if (fever) {
        this.shatter(ring, idx);
        if (onMover) this.killMover(ring);
        this.passFloor(ring);
        return 'pass';
      }
      if (dash) {
        if (type === 'breakable' || (type === 'danger' && this.powers.voiddash)) {
          this.shatter(ring, idx);
          if (onMover) this.killMover(ring);
          this.fx.shake(4);
          this.passFloor(ring);
          return 'pass';
        }
      }
      if (type === 'danger') {
        this.land(ring, seg, 'danger');
        this.hurt('spike');
        return 'land';
      }
      this.land(ring, seg, type);
      return 'land';
    }

    land(ring, seg, kind) {
      const p = this.player;
      const heavy = p.dashTimer > 0;
      const x = C.LW / 2, y = ring.y + C.MID * C.K;
      const pal = FS.WORLDS[ring.world];
      p.vy = -C.BOUNCE * (this.bounceMul || 1) * (kind === 'bosshit' ? 1.1 : 1);
      p.dashTimer = 0;
      p.squash = 1;
      seg.flash = 0.12;
      const col = kind === 'danger' ? pal.danger : kind === 'bosshit' ? '#ffb347' : pal.edge;
      if (heavy) {
        this.fx.wave(x, y, col, 130, 0.5, 0.34, 6);
        this.fx.burst(x, y, 26, 320, col, { size: 9, life: 0.5, flat: 0.4, up: -80 });
        this.fx.shake(8);
        FS.Audio.play('heavy');
      } else {
        this.fx.wave(x, y, col, 60, 0.35, 0.34, 3);
        this.fx.burst(x, y, 8, 160, col, { size: 6, life: 0.35, flat: 0.4, up: -60 });
        FS.Audio.play('land');
      }
      if (this.fallStreak >= 3 && kind !== 'danger') {
        const bonus = 25 * this.fallStreak;
        this.addScore(bonus, false);
        p.addEnergy(8);
        this.fx.text(x, y - 60, 'PERFECT!', '#fff3a0', 22, 1);
        this.fx.wave(x, y, '#ffe27a', 170, 0.6, 0.34, 5);
        this.fx.burst(x, y, 20, 280, '#ffe27a', { size: 8, life: 0.6, kind: 2 });
        FS.Audio.play('perfect');
      }
      if (kind === 'coin' && !seg.used) {
        seg.used = true;
        this.addCoins(5, x, y - 30);
      } else if (kind === 'energy' && !seg.used) {
        seg.used = true;
        p.addEnergy(25);
        this.fx.text(x, y - 34, '+25 ENERGY', '#2bffb0', 15, 0.9);
        this.fx.burst(x, y, 16, 200, '#2bffb0', { size: 9, life: 0.6, up: -100 });
        FS.Audio.play('energy');
      }
      if (ring.mod === 'collapse' && !ring.boss && seg.crumble < 0 && kind !== 'danger') seg.crumble = 0.5;
      if (kind !== 'bosshit') {
        const keep = this.powers.combomaster ? 0.75 : 0.5;
        this.combo = Math.max(1, Math.floor(this.combo * keep));
        this.feverCharge = Math.max(0, this.feverCharge - 0.22);
      }
      this.fallStreak = 0;
    }

    passFloor(ring) {
      if (!ring || ring.floor <= this.deepest) return;
      const p = this.player;
      this.deepest = ring.floor;
      ring.passed = true;
      this.fallStreak++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.lastPassT = this.time;
      this.decayAcc = 0;
      const fever = this.fever > 0;
      const mult = (1 + (this.powers.multiplier || 0)) * (fever ? 2 : 1);
      const pts = 10 * this.combo * mult;
      this.addScore(pts, this.combo >= 3);
      p.addEnergy(3 + (this.powers.overdrive || 0) * 2);
      const br = this.stats.breakRate * (1 + (this.powers.breaker || 0) * 0.4);
      p.breakCharge = Math.min(100, p.breakCharge + 9 * br);
      if (!fever) {
        this.feverCharge += 0.085 * (this.powers.combomaster ? 1.35 : 1);
        if (this.feverCharge >= 1) this.startFever();
      }
      FS.Audio.play('pass', this.combo);
      if (this.combo % 5 === 0) {
        p.addEnergy(5);
        this.fx.text(C.LW / 2, p.projY() - 46, 'COMBO x' + this.combo, '#ff6ad5', 22, 1);
        this.fx.wave(C.LW / 2, p.projY(), '#ff6ad5', 90, 0.45, 1, 3);
        FS.Audio.play('combo', Math.min(12, this.combo / 5));
      }
      if (this.powers.phase && ring.floor % 10 === 0 && p.phase < this.powers.phase) {
        p.phase = this.powers.phase;
        this.fx.text(C.LW / 2, p.projY() - 40, 'PHASE READY', '#c08bff', 14, 0.8);
      }
      if (ring.floor >= this.nextPower && !this.boss) {
        this.pendingPower = 0.35;
        this.nextPower = ring.floor + U.randInt(Math.random, 6, 9);
      }
      this.tutorial(ring.floor);
    }

    tutorial(f) {
      if (FS.Storage.data.tutorialDone) return;
      const steps = [
        [3, 'DASH', 'PLUNGE · SMASH GLASS BLOCKS', '#3fe6ff'],
        [6, 'GRAVITY', 'FLIP UP · RIDE THE CEILING', '#b06bff'],
        [9, 'BREAK', 'FALL TO CHARGE · SHATTER A SHAFT', '#ff6ad5'],
        [11, 'AVOID SPIKES', 'LAND ON SAFE PLATFORMS', '#ff3d6a'],
      ];
      const s = steps[this.tutStep];
      if (s && f >= s[0]) {
        this.tutStep++;
        this.ui.banner(s[1], s[2], s[3], 2.2);
      }
    }

    startFever() {
      this.fever = this.feverMax + (this.powers.combomaster ? 2 : 0);
      this.feverCharge = 0;
      this.ui.banner('FEVER!', 'SMASH THROUGH EVERYTHING', '#ff9a3c', 1.3);
      this.fx.flash('#ff9a3c', 0.3);
      this.fx.wave(C.LW / 2, this.player.projY(), '#ff9a3c', 200, 0.6, 1, 6);
      FS.Audio.play('fever');
      FS.Audio.setFever(true);
      FS.Storage.data.stats.fevers++;
    }

    hurt(src) {
      const p = this.player;
      if (!p.alive || p.invuln > 0 || this.state !== 'playing') return false;
      if (this.fever > 0) return false;
      const x = C.LW / 2, y = p.projY();
      if (p.phase > 0) {
        p.phase--;
        p.invuln = 0.9;
        this.fx.text(x, y - 40, 'PHASED', '#c08bff', 18, 0.9);
        this.fx.wave(x, y, '#c08bff', 90, 0.45, 1, 3);
        FS.Audio.play('phase');
        return false;
      }
      this.combo = 1;
      this.feverCharge = 0;
      this.fallStreak = 0;
      if (this.powers.shockwave) this.shockwaveBlast();
      if (p.shield > 0) {
        p.shield--;
        p.invuln = 1.4;
        this.fx.shake(11);
        this.fx.flash('#ff2a4a', 0.35);
        this.fx.burst(x, y, 24, 300, '#ff3d6a', { size: 9, life: 0.5 });
        this.fx.text(x, y - 40, 'SHIELD -1', '#ff6a8a', 16, 0.9);
        FS.Audio.play('damage');
        return true;
      }
      this.die();
      return true;
    }

    // ---------------------------------------------------------------- hazards
    checkLasers() {
      const p = this.player;
      const f = Math.ceil((p.y + C.CORE_R) / C.SPACING);
      const r = this.tower.get(f);
      if (!r || !r.lasers.length) return;
      const h = r.y - (p.y + C.CORE_R);
      if (h > FS.Tower.LASER_H || h < -2) return;
      if (this.tower.laserAt(r, this.tower.coreRel(r))) this.hurt('laser');
    }

    updateDebris(dt) {
      const p = this.player;
      const active = (this.world === 4 || this.floor > 100) && !this.boss;
      if (active) {
        this.debrisT -= dt;
        if (this.debrisT <= 0) {
          this.debrisT = 3.5 + Math.random() * 2.5;
          const r = this.tower.get(this.floor);
          if (r && !r.boss) this.debris.push({ f: r.floor, rel: this.tower.coreRel(r) + (Math.random() - 0.5) * 0.4, t: 1.2, max: 1.2 });
        }
      }
      for (let k = this.debris.length - 1; k >= 0; k--) {
        const d = this.debris[k];
        d.t -= dt;
        if (d.t > 0) continue;
        this.debris.splice(k, 1);
        const r = this.tower.get(d.f);
        if (!r) continue;
        const a = this.tower.ringAngle(r) + d.rel;
        const x = C.LW / 2 + Math.cos(a) * C.MID, y = r.y + Math.sin(a) * C.MID * C.K;
        this.fx.burst(x, y, 14, 220, '#8a7a8a', { kind: 1, size: 7, life: 0.8, grav: 900, up: -180, colors: ['#5a4a5a', '#ff7a4a', '#8a7a8a'] });
        this.fx.shake(3);
        FS.Audio.play('crumble');
        const h = r.y - (p.y + C.CORE_R);
        if (h < 85 && h > -5 && Math.abs(U.angDiff(this.tower.coreRel(r), d.rel)) < 0.3) this.hurt('debris');
      }
    }

    onCrumble(r, i) {
      const o = this.tower.segCenterScreen(r, i, this.camY, this.tmp);
      const pal = FS.WORLDS[r.world];
      this.fx.burst(o.x, o.y, 10, 160, pal.top, { kind: 1, size: 7, life: 0.9, grav: 800, colors: [pal.top, pal.edge] });
      FS.Audio.play('crumble');
    }

    killMover(r) {
      if (!r.mover || !r.mover.alive) return;
      r.mover.alive = false;
      const a = this.tower.ringAngle(r) + this.tower.moverCenter(r.mover);
      const x = C.LW / 2 + Math.cos(a) * C.MID, y = r.y + Math.sin(a) * C.MID * C.K;
      this.fx.burst(x, y, 14, 240, FS.WORLDS[r.world].danger, { kind: 1, size: 7, life: 0.8, grav: 700 });
    }

    shatter(r, i, quiet) {
      const s = r.segs[i];
      if (s.broken && !quiet) return;
      const wasType = s.used ? 'normal' : s.type;
      s.broken = true;
      const o = this.tower.segCenterScreen(r, i, this.camY, this.tmp);
      const pal = FS.WORLDS[r.world];
      const col = wasType === 'danger' ? pal.danger : wasType === 'breakable' ? pal.accent : wasType === 'coin' ? '#ffcc33' : wasType === 'energy' ? '#2bffb0' : pal.edge;
      const n = quiet ? 8 : 14;
      this.fx.burst(o.x, o.y, n, 260, col, { kind: 1, size: 8, life: 1, grav: 900, up: -160, colors: [col, pal.top, '#ffffff'] });
      if (!quiet) {
        this.fx.burst(o.x, o.y, 8, 200, col, { size: 10, life: 0.4 });
        FS.Audio.play('shatter');
        FS.Storage.data.stats.blocks++;
      }
      if (wasType === 'breakable') this.addCoins(1, o.x, o.y - 20);
      else if (wasType === 'coin') this.addCoins(5, o.x, o.y - 20);
      else if (wasType === 'energy') this.player.addEnergy(25);
      return true;
    }

    shockwaveBlast() {
      const p = this.player;
      for (let f = this.floor; f <= this.floor + 2; f++) {
        const r = this.tower.get(f);
        if (!r || r.boss) continue;
        for (let i = 0; i < r.n; i++) if (r.segs[i].type === 'danger' && !r.segs[i].broken) this.shatter(r, i);
        this.killMover(r);
        for (const l of r.lasers) l.dead = true;
      }
      if (this.boss) {
        for (const s of this.boss.ring.segs) if (s.bstate === 'spike' || s.bstate === 'shock') s.bstate = null;
      }
      this.fx.wave(C.LW / 2, p.projY(), '#3fe6ff', 260, 0.7, 0.6, 6);
      this.fx.text(C.LW / 2, p.projY() - 60, 'SHOCKWAVE', '#3fe6ff', 18, 0.9);
    }

    doBreak() {
      const p = this.player;
      const floors = 3 + (this.powers.breaker || 0) * 3;
      const f0 = Math.max(1, Math.ceil((p.y + C.CORE_R - 6) / C.SPACING));
      let broken = 0;
      for (let f = f0; f < f0 + floors; f++) {
        const r = this.tower.get(f);
        if (!r) continue;
        if (r.boss) {
          if (this.boss && this.boss.ring === r) this.boss.onBreak();
          break;
        }
        const idx = this.tower.segIndex(r, this.tower.coreRel(r));
        for (let i = 0; i < r.n; i++) {
          const s = r.segs[i];
          if (s.broken) continue;
          const open = s.type === 'gap' || s.type === 'portal' || s.type === 'combo';
          if (!open && (i === idx || s.type === 'breakable' || (i === (idx + 1) % r.n && f === f0))) {
            this.shatter(r, i);
            broken++;
          }
        }
        this.killMover(r);
        for (const l of r.lasers) l.dead = true;
      }
      const x = C.LW / 2, y = p.projY();
      this.fx.flash('#ffffff', 0.55);
      this.fx.shake(15);
      this.fx.wave(x, y, '#ffffff', 240, 0.7, 0.34, 8);
      this.fx.wave(x, y, '#ff6ad5', 180, 0.6, 1, 5);
      this.fx.burst(x, y, 40, 420, '#ff6ad5', { size: 12, life: 0.7, colors: ['#ff6ad5', '#ffffff', '#3fe6ff'] });
      this.fx.text(x, y - 56, 'BREAK!', '#ff9ae6', 26, 1);
      FS.Audio.play('break');
      if (p.gDir > 0) p.vy = Math.max(p.vy, 260);
      if (broken >= 4) this.addScore(broken * 20, false);
    }

    portal(ring, seg) {
      const p = this.player, t = this.tower;
      const target = ring.floor + 3;
      t.ensure(ring.floor, target + 2);
      const tr = t.get(target);
      if (!tr || tr.boss) return false;
      seg.used = true;
      const x = C.LW / 2;
      const oldProj = p.projY();
      this.fx.burst(x, oldProj, 30, 300, '#b06bff', { size: 10, life: 0.6, colors: ['#b06bff', '#ff4fd8', '#ffffff'] });
      for (let f = ring.floor; f < target; f++) this.passFloor(t.get(f));
      const open = [];
      for (let i = 0; i < tr.n; i++) if (!t.isSolid(tr.segs[i]) && tr.segs[i].type !== 'portal') open.push(i);
      if (open.length) t.alignTo(tr, open[(Math.random() * open.length) | 0]);
      p.y = tr.y - C.SPACING * 0.55;
      p.vy = 220;
      p.invuln = Math.max(p.invuln, 0.7);
      this.camY += p.projY() - oldProj;
      this.fx.burst(x, p.projY(), 30, 300, '#b06bff', { size: 10, life: 0.6, colors: ['#b06bff', '#ff4fd8', '#ffffff'] });
      this.fx.wave(x, p.projY(), '#ff4fd8', 140, 0.5, 1, 4);
      this.fx.flash('#7a3cff', 0.35);
      this.fx.text(x, p.projY() - 50, 'WARP +3', '#ff9ae6', 20, 1);
      FS.Audio.play('portal');
      return true;
    }

    comboGate(ring, seg) {
      seg.used = true;
      this.combo += 3;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.player.addEnergy(5);
      const x = C.LW / 2, y = this.player.projY();
      this.fx.text(x, y - 50, 'COMBO +3', '#ffcc33', 22, 1);
      this.fx.wave(x, y, '#ffcc33', 120, 0.5, 1, 4);
      this.fx.flash('#ffcc33', 0.15);
      FS.Audio.play('combo', 7);
    }

    collectPickups(ring, rel) {
      const reach = (0.2 + (this.powers.magnet || 0) * 0.5) * this.stats.magnet;
      const p = this.player;
      for (const pk of ring.pickups) {
        if (pk.taken || Math.abs(U.angDiff(rel, pk.rel)) > reach) continue;
        pk.taken = true;
        const x = C.LW / 2, y = p.projY() - 24;
        if (pk.kind === 'coin') {
          this.addCoins((this.fever > 0 ? 2 : 1) + (this.powers.lucky && Math.random() < 0.3 ? 1 : 0), x, y);
          p.addEnergy(1);
        } else if (pk.kind === 'energy') {
          p.addEnergy(12);
          this.fx.text(x + 24, y, '+12', '#2bffb0', 14, 0.7);
          this.fx.burst(x, y + 20, 10, 160, '#2bffb0', { size: 8, life: 0.4 });
          FS.Audio.play('energy');
        } else {
          this.runCrystals++;
          this.fx.text(x, y - 10, '+1 CRYSTAL', '#c99bff', 16, 1);
          this.fx.burst(x, y + 20, 18, 220, '#b06bff', { size: 9, life: 0.6 });
          FS.Audio.play('crystal');
        }
      }
    }

    addCoins(n, x, y) {
      this.runCoins += n;
      this.addScore(5 * n, false);
      this.fx.text(x - 22, y, '+' + n, '#ffd75a', 13, 0.6);
      this.fx.burst(x, y + 20, 6, 120, '#ffcc33', { size: 6, life: 0.35 });
      FS.Audio.play('coin');
    }

    addScore(n, show) {
      this.score += n;
      if (show) this.fx.text(C.LW / 2 + 40, this.player.projY() - 10, '+' + n, '#bff8ff', 13, 0.6);
    }

    // ---------------------------------------------------------------- progress / worlds / boss / power-ups
    updateWorld(floor, demo) {
      const w = LG().worldOf(floor);
      if (w !== this.world) {
        this.bgPrev = this.world;
        this.bgBlend = 0;
        this.world = w;
        const pal = FS.WORLDS[w];
        this.fx.setAmbient(pal.ambient, pal.ambColors);
        if (!demo) {
          FS.Audio.setWorld(w);
          this.ui.banner(pal.sub, pal.name, pal.accent, 2);
          FS.Storage.data.unlockedWorlds = Math.max(FS.Storage.data.unlockedWorlds, Math.min(5, w + 1));
        }
      }
      if (this.bgBlend < 1) this.bgBlend = Math.min(1, this.bgBlend + this.lastDt / 1.6);
    }

    updateProgress() {
      const p = this.player;
      this.floor = this.deepest + 1;
      this.depth = Math.max(this.depth, (p.y / C.SPACING) * 10);
      this.updateWorld(this.floor, false);
      const mod = LG().modifierOf(this.floor, this.seed);
      if (mod !== this.modifier) {
        this.modifier = mod;
        if (mod) this.ui.banner(FS.MODIFIERS[mod].name, FS.MODIFIERS[mod].desc, '#ff4fd8', 1.8);
      }
      if (this.floor > 100 && !this.endlessShown) {
        this.endlessShown = true;
        this.ui.banner('ENDLESS MODE', 'HOW DEEP CAN YOU GO?', '#ffcc33', 2.4);
      }
      if (!this.boss && LG().isBoss(this.floor) && !this.bossDone[this.floor]) {
        this.tower.ensure(this.floor, this.floor + 2);
        const r = this.tower.get(this.floor);
        if (r && r.boss) this.startBoss(r);
      }
    }

    startBoss(ring) {
      const level = Math.max(1, Math.round(ring.floor / C.BOSS_EVERY));
      this.boss = new FS.Boss(this, ring, level);
      const p = this.player;
      p.shield = Math.min(p.shield + 1, p.maxShield + 1);
      this.ui.banner('WARNING', 'REACTOR CORE · SHIELD +1', '#ff3d6a', 2.4);
      this.fx.flash('#ff3d6a', 0.3);
      FS.Audio.play('boss');
      FS.Audio.setMode('boss');
    }

    onBossDefeated(boss) {
      const r = boss.ring;
      for (let i = 0; i < r.n; i++) this.shatter(r, i, i % 2 === 1);
      r.spinSpeed = 0;
      const coins = 120 * boss.level;
      const crystals = 3 + boss.level * 2;
      this.runCoins += coins;
      this.runCrystals += crystals;
      this.addScore(2000 * boss.level, false);
      FS.Storage.data.stats.bossKills++;
      this.bossDone[r.floor] = true;
      this.boss = null;
      const p = this.player;
      p.shield = Math.max(p.shield, p.maxShield);
      const x = C.LW / 2, y = r.y - 78;
      this.fx.flash('#ffffff', 0.8);
      this.fx.shake(20);
      this.fx.wave(x, y, '#ffb347', 300, 1, 0.6, 10);
      this.fx.wave(x, y, '#ffffff', 220, 0.8, 1, 6);
      this.fx.burst(x, y, 90, 600, '#ffb347', { size: 16, life: 1.3, colors: ['#ffb347', '#ffffff', '#ffcc33', '#ff5a1a'] });
      this.fx.burst(x, y, 30, 500, '#ffcc33', { kind: 1, size: 9, life: 1.5, grav: 600, colors: ['#ffcc33', '#fff1a8'] });
      this.ui.banner('BOSS DEFEATED', '+' + coins + ' COINS  ·  +' + crystals + ' CRYSTALS', '#ffcc33', 3);
      FS.Audio.setMode('game');
      this.pendingPower = 1.6;
      FS.Storage.save();
    }

    offerPowerups() {
      if (this.state !== 'playing' || !this.player.alive) return;
      const choices = FS.Upgrades.rollPowerups(this.powers, Math.random, 3);
      if (!choices.length) return;
      this.state = 'powerup';
      this.ui.showPowerups(choices, this.powers, (def) => {
        this.applyPower(def);
        this.ui.hideAll();
        this.state = 'playing';
        this.player.invuln = Math.max(this.player.invuln, 0.5);
      });
    }

    applyPower(def) {
      const p = this.player;
      const id = def.id;
      this.powers[id] = (this.powers[id] || 0) + 1;
      const k = this.powerOrder.indexOf(id);
      if (k >= 0) this.powerOrder.splice(k, 1);
      this.powerOrder.push(id);
      this.powersVer++;
      if (id === 'energycore') {
        p.maxEnergy = Math.round(p.maxEnergy * 1.3);
        p.energy = p.maxEnergy;
      } else if (id === 'phase') {
        p.phase = this.powers.phase;
      } else if (id === 'aegis') {
        p.maxShield++;
        p.shield++;
      } else if (id === 'lucky') {
        this.tower.opts.lucky = this.powers.lucky;
      }
      const col = { common: '#3fe6ff', rare: '#b06bff', epic: '#ffcc33' }[def.rarity];
      this.ui.banner(def.name, 'POWER ACQUIRED', col, 1.3);
      this.fx.wave(C.LW / 2, p.projY(), col, 150, 0.6, 1, 5);
    }

    // ---------------------------------------------------------------- render
    render() {
      const ctx = this.ctx, H = this.H, s = this.scale;
      const t = this.tower, p = this.player, fx = this.fx;
      const camY = this.camY;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // background
      if (this.bgBlend < 1) {
        t.drawWorldBg(ctx, this.bgPrev, camY, H, 1);
        t.drawWorldBg(ctx, this.world, camY, H, this.bgBlend);
      } else t.drawWorldBg(ctx, this.world, camY, H, 1);
      fx.renderAmbient(ctx);

      // world (with shake)
      const ox = fx.shakeX, oy = fx.shakeY;
      ctx.setTransform(s, 0, 0, s, ox * s, oy * s);
      fx.scale = s;
      fx.ox = ox;
      fx.oy = oy;
      const rings = t.visibleRings(camY, H, this.visRings);
      const coreY = p.y;
      for (let i = 0; i < rings.length; i++) t.drawRingHalf(ctx, rings[i], camY, false, coreY);

      const boss = this.boss && this.boss.state !== 'dead' ? this.boss : null;
      if (boss) {
        const above = t.get(boss.ring.floor - 1);
        const top = (above ? above.y + C.THICK + 30 : boss.ring.y - 100) - camY;
        t.drawColumn(ctx, camY, H, this.world, top, boss.ring.y - camY);
        boss.renderReactor(ctx, camY, this.time);
      } else t.drawColumn(ctx, camY, H, this.world);

      for (let i = rings.length - 1; i >= 0; i--) if (rings[i].y > coreY) t.drawRingHalf(ctx, rings[i], camY, true, coreY);
      if (boss) boss.renderOver(ctx, camY, this.time);
      this.renderDebris(ctx, camY);
      if (this.state !== 'menu' || true) {
        const skin = FS.Upgrades.getSkin(FS.Storage.data.skin);
        p.render(ctx, camY, skin, this.state === 'menu' ? 6 : this.combo, this.fever > 0, this.time, this.lastDt);
      }
      for (let i = rings.length - 1; i >= 0; i--) if (rings[i].y <= coreY) t.drawRingHalf(ctx, rings[i], camY, true, coreY);

      fx.render(ctx, camY);
      fx.renderTexts(ctx, camY);

      // screen-space overlays
      ctx.setTransform(s, 0, 0, s, 0, 0);
      this.renderOverlays(ctx);
    }

    renderDebris(ctx, camY) {
      if (!this.debris.length) return;
      for (const d of this.debris) {
        const r = this.tower.get(d.f);
        if (!r) continue;
        const a = this.tower.ringAngle(r) + d.rel;
        const x = C.LW / 2 + Math.cos(a) * C.MID;
        const gy = r.y + Math.sin(a) * C.MID * C.K - camY;
        const k = 1 - d.t / d.max;
        ctx.globalAlpha = 0.2 + k * 0.5;
        ctx.fillStyle = '#ff3d3d';
        ctx.beginPath();
        ctx.ellipse(x, gy, 10 + k * 16, (10 + k * 16) * 0.4, 0, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(x, gy - d.t * 480);
        ctx.rotate(this.time * 4 + d.rel);
        ctx.fillStyle = '#2a2026';
        ctx.strokeStyle = '#ff7a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-11, -6);
        ctx.lineTo(-2, -12);
        ctx.lineTo(11, -4);
        ctx.lineTo(7, 9);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    grad(key, make) {
      let g = this.cacheGrad[key];
      if (!g) g = this.cacheGrad[key] = make();
      return g;
    }

    renderOverlays(ctx) {
      const W = C.LW, H = this.H, p = this.player;
      const playing = this.state !== 'menu';
      // speed lines
      const speed = Math.abs(p.vy);
      const sl = playing ? U.clamp((speed - 650) / 600, 0, 1) + (this.fever > 0 ? 0.35 : 0) : 0;
      if (sl > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = this.fever > 0 ? '#ffb347' : FS.WORLDS[this.world].accent;
        ctx.lineWidth = 1.5;
        const n = Math.round(14 * this.fx.quality) + 4;
        for (let i = 0; i < n; i++) {
          const hx = U.hash2(i, 7), hy = U.hash2(i, 13);
          let x = hx * W;
          if (Math.abs(x - W / 2) < 60) x += x < W / 2 ? -70 : 70;
          const len = 50 + U.hash2(i, 3) * 110;
          const y = H + 100 - ((hy * (H + 200) + this.time * (1300 + hy * 900)) % (H + 200));
          ctx.globalAlpha = sl * (0.15 + hx * 0.25);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + len);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      const cy = H * C.CORE_SCREEN;
      if (playing && this.modifier === 'dark') {
        ctx.fillStyle = this.grad('dark' + H, () => {
          const g = this.ctx.createRadialGradient(W / 2, cy + 40, 80, W / 2, cy + 40, H * 0.75);
          g.addColorStop(0, 'rgba(0,0,6,0)');
          g.addColorStop(0.45, 'rgba(0,0,6,0.55)');
          g.addColorStop(1, 'rgba(0,0,6,0.94)');
          return g;
        });
        ctx.fillRect(0, 0, W, H);
      }
      // edge vignette (always) + danger / fever tints
      ctx.fillStyle = this.grad('vig' + H, () => {
        const g = this.ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.72);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,10,0.55)');
        return g;
      });
      ctx.fillRect(0, 0, W, H);
      const lowHp = playing && p.alive && p.shield === 0 && this.state === 'playing';
      if (lowHp || this.fever > 0) {
        const key = lowHp ? 'red' : 'fever';
        ctx.globalAlpha = lowHp ? 0.35 + 0.2 * Math.sin(this.time * 5) : 0.5 + 0.2 * Math.sin(this.time * 9);
        ctx.fillStyle = this.grad(key + H, () => {
          const g = this.ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.7);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, lowHp ? 'rgba(255,30,60,0.55)' : 'rgba(255,120,30,0.5)');
          return g;
        });
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      if (this.player.gDir < 0 && playing) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#5a1fc8';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      if (this.fx.flashA > 0) {
        ctx.globalAlpha = Math.min(1, this.fx.flashA);
        ctx.fillStyle = this.fx.flashColor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }
  }

  FS.Game = Game;
})();
