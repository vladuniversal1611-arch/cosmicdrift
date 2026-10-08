/* Game: state machine + all gameplay (survival meters, combat, gathering, looting, building, crafting, travel). */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const DAY_LENGTH = 420;          // seconds for a full day/night cycle
  const FOOD_RATE = 1 / 9;         // food points lost per second
  const WATER_RATE = 1 / 6;
  const REACH = 1.45;              // interaction distance (tiles)
  const BASE_SEED = 1337;
  const TEXT = { dmg: '#ff6b6b', heal: '#7cff8a', item: '#ffe9a8', xp: '#ffd34d' };

  const Game = {
    ready: false,
    stack: ['MAIN_MENU'],
    t: 0, now: Date.now(),
    map: null, ground: null, player: null,
    target: null, searching: null, build: null, chestOpen: null, lootOpen: null,
    darkness: 0, night: false, lowHp: false, playerDead: false,
    lights: [], actT: 0, zoomMul: 1, hudT: 0, smokeT: 0, raid: null, waterT: 0,

    get state() { return this.stack[this.stack.length - 1]; },
    get base() { return this.stack[0]; },
    get S() { return BI.state; },
    get atBase() { return this.map && this.map.id === 'base'; },

    // ---------------- lifecycle ----------------
    init() {
      this.canvas = document.getElementById('gameCanvas');
      BI.state = BI.Save.loadGame() || BI.Save.defaultState();
      BI.Audio.applySettings(BI.state.settings);
      BI.Renderer.init(this.canvas);
      BI.UI.init();
      BI.Input.init(this.canvas);
      this.enterLocation('base', true);
      BI.Quests.ensureActive();
      this.ready = true;
      this.setBase('MAIN_MENU');
      this.updateCamera();
      BI.Renderer.snap();
      BI.UI.updateAll();
      setInterval(() => { if (this.ready && !this.playerDead) BI.Save.saveGame(); }, 15000);
      window.addEventListener('pagehide', () => BI.Save.saveGame());
      document.addEventListener('visibilitychange', () => { if (document.hidden) BI.Save.saveGame(); });
    },

    reset() {
      BI.Save.resetGame();
      BI.Audio.applySettings(BI.state.settings);
      this.playerDead = false;
      this.enterLocation('base', true);
      BI.Quests.ensureActive();
      this.setBase('MAIN_MENU');
      this.updateCamera();
      BI.Renderer.snap();
      BI.UI.updateAll();
      BI.Save.saveGame();
      BI.UI.toast('Progress reset', 'good');
    },

    setBase(name) { this.stack = [name]; BI.UI.sync(this.stack); },
    push(name) { if (this.state !== name) { this.stack.push(name); BI.UI.sync(this.stack); } },
    pop() {
      if (this.stack.length > 1) this.stack.pop();
      if (this.state !== 'INVENTORY') this.chestOpen = null;
      this.lootOpen = this.state === 'LOOT' ? this.lootOpen : null;
      BI.UI.sync(this.stack);
    },
    startGameplay() { this.build = null; this.setBase('GAMEPLAY'); BI.UI.updateAll(); },
    goMenu() { this.build = null; this.setBase('MAIN_MENU'); BI.Save.saveGame(); },

    // ---------------- locations ----------------
    snapshotBase() {
      if (!this.atBase) return;
      this.S.base = { objs: this.map.objs.map((o) => { const c = Object.assign({}, o); delete c.shakeT; delete c.buildT; return c; }) };
    },

    enterLocation(id, silent) {
      const loc = BI.Data.LOC_BY_ID[id];
      if (this.map && this.atBase) this.snapshotBase();
      let map;
      if (id === 'base') {
        map = BI.World.generate(loc, BASE_SEED);
        if (this.S.base && this.S.base.objs) {
          map.objs = this.S.base.objs.map((o) => Object.assign({}, o));
          BI.World.reindex(map);
        }
      } else {
        map = BI.World.generate(loc, (Math.random() * 1e9) | 0);
        this.S.stats.visits[id] = (this.S.stats.visits[id] || 0) + 1;
      }
      this.map = map;
      const R = BI.Renderer;
      const w = map.size * 64 + 80;
      this.ground = BI.World.buildGround(map, Math.min(1.5, Math.max(1, R.dpr), 2600 / w));
      this.player = BI.Entities.makePlayer(map.spawn.x, map.spawn.y);
      this.target = null;
      this.searching = null;
      this.raid = null;
      BI.FX.clear();
      BI.UI.setLocation(loc);
      if (!silent) {
        BI.UI.toast(loc.emoji + ' ' + loc.name + (id === 'base' ? '' : ' — find the 🚐 to get back'), id === 'base' ? 'good' : '');
        BI.Quests.check();
        BI.Save.saveGame();
      }
      this.updateCamera();
      R.snap();
    },

    travel(id) {
      const loc = BI.Data.LOC_BY_ID[id];
      if (this.S.level < loc.level) { BI.UI.toast('🔒 Reach level ' + loc.level, 'bad'); return; }
      BI.AdManager.showInterstitial(() => {
        this.enterLocation(id);
        this.setBase('GAMEPLAY');
        BI.Audio.playLoot();
      });
    },

    // ---------------- main loop ----------------
    update(dt) {
      this.t += dt;
      this.now = Date.now();
      const S = this.S, st = this.state, p = this.player, map = this.map;
      const active = (st === 'GAMEPLAY' || st === 'BUILD_MODE') && !this.playerDead;

      // day/night
      if (active) S.dayTime = (S.dayTime + dt / DAY_LENGTH) % 1;
      const sun = Math.sin((S.dayTime - 0.25) * Math.PI * 2);
      this.darkness = BI.Draw.clamp(-sun * 1.3 + 0.05, 0, 0.8);
      this.night = sun < -0.2;

      if (active) {
        this.updateSurvival(dt);
        if (st === 'GAMEPLAY') {
          const mv = BI.Input.getMove();
          BI.Entities.updatePlayer(p, dt, mv.x, mv.y, map, 1);
          this.target = this.findTarget();
          BI.UI.setAction(this.target);
          if (this.actT > 0) this.actT -= dt;
          if (BI.Input.actionHeld && this.actT <= 0) this.doAction();
          this.updateSearch(dt);
          this.updateDrops();
        }
        for (let i = 0; i < map.zombies.length; i++) BI.Entities.updateZombie(map.zombies[i], dt, this);
        map.zombies = map.zombies.filter((z) => !z.dead || z.deadT < 2);
        this.updateRaid(dt);
      }
      // world objects
      for (let i = 0; i < map.objs.length; i++) {
        const o = map.objs[i];
        if (o.shakeT > 0) o.shakeT -= dt;
        if (o.k === 'node' && o.respawnAt > 0 && this.now >= o.respawnAt) {
          if (Math.abs(p.x - o.gx - 0.5) < 0.8 && Math.abs(p.y - o.gy - 0.5) < 0.8) o.respawnAt = this.now + 2000;
          else { o.respawnAt = 0; o.hits = BI.Data.NODES[o.type].hits; }
        }
      }
      // lights & smoke
      this.lights.length = 0;
      this.smokeT -= dt;
      const smoke = this.smokeT <= 0;
      if (smoke) this.smokeT = 0.5;
      map.objs.forEach((o) => {
        if (o.k === 'build' && (o.type === 'campfire' || o.type === 'furnace')) {
          const c = BI.World.iso(o.gx + 0.5, o.gy + 0.5);
          this.lights.push({ x: c.x, y: c.y - 10, r: o.type === 'campfire' ? 230 : 150 });
          if (smoke) BI.FX.smoke(c.x + (o.type === 'furnace' ? 12 : 0), c.y - (o.type === 'furnace' ? 52 : 20));
        }
      });
      if (map.exit) { const c = BI.World.iso(map.exit.x, map.exit.y); this.lights.push({ x: c.x, y: c.y, r: 160 }); }

      this.updateCamera();
      BI.Renderer.update(dt);
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.15; BI.UI.updateBars(); }
      if (st === 'GAMEPLAY') BI.UI.tryShowPopup();
    },

    updateSurvival(dt) {
      const P = this.S.player;
      P.food = Math.max(0, P.food - FOOD_RATE * dt);
      P.water = Math.max(0, P.water - WATER_RATE * dt);
      if (P.food <= 0 || P.water <= 0) P.hp -= 0.7 * dt;
      else if (P.food > 50 && P.water > 50 && this.player.hurtT <= 0 && P.hp < 100) P.hp = Math.min(100, P.hp + dt / 3);
      this.lowHp = P.hp < 25;
      if (P.hp <= 0) this.die(P.food <= 0 ? 'starvation' : P.water <= 0 ? 'thirst' : 'wounds');
    },

    updateCamera() {
      const R = BI.Renderer, T = R.target, W = BI.World, S = this.map.size;
      if (this.base === 'MAIN_MENU') {
        const c = W.iso(S / 2, S / 2);
        T.zoom = BI.Draw.clamp(Math.min(R.w / (S * 64) * 1.25, R.h / (S * 32) * 0.9), 0.35, 1.2);
        T.x = c.x; T.y = c.y;
      } else if (this.base === 'GAMEPLAY') {
        const p = W.iso(this.player.x, this.player.y);
        T.zoom = R.gameplayZoom() * this.zoomMul;
        T.x = p.x; T.y = p.y - 24;
      } else if (this.base === 'BUILD_MODE') {
        T.zoom = R.gameplayZoom() * 0.85 * this.zoomMul;
      }
    },
    onResize() { this.updateCamera(); if (this.base === 'MAIN_MENU') BI.Renderer.snap(); },
    onWheel(dy) { this.zoomMul = BI.Draw.clamp(this.zoomMul * (dy > 0 ? 0.9 : 1.1), 0.6, 1.6); },
    screenToGrid(sx, sy) { const w = BI.Renderer.s2w(sx, sy); return BI.World.toGrid(w.x, w.y); },
    panCamera(dx, dy) {
      const R = BI.Renderer, z = R.cam.zoom, S = this.map.size;
      R.target.x = BI.Draw.clamp(R.target.x - dx / z, -S * 32, S * 32);
      R.target.y = BI.Draw.clamp(R.target.y - dy / z, 0, S * 32);
      R.cam.x = R.target.x; R.cam.y = R.target.y;
    },

    // ---------------- items ----------------
    bag() { return this.S.bag; },
    weapon() {
      const w = this.S.equip.weapon;
      return w ? BI.Data.ITEMS[w.id] : BI.Data.FISTS;
    },
    handKind() {
      const p = this.player;
      if (p.act > 0 && p.actKind) return p.actKind;
      const w = this.S.equip.weapon;
      return w ? w.id : 'hand';
    },

    /** Add to backpack; leftovers drop on the ground. Shows floating text. */
    giveItem(id, n, wx, wy, quiet) {
      const left = BI.Inv.add(this.bag(), id, n);
      const got = n - left;
      const pp = BI.World.iso(this.player.x, this.player.y);
      if (got > 0 && !quiet) BI.FX.text(wx != null ? wx : pp.x, (wy != null ? wy : pp.y - 50), '+' + got + ' ' + BI.Data.ITEMS[id].name, TEXT.item);
      if (left > 0) {
        const slots = BI.Inv.make(4);
        BI.Inv.add(slots, id, left);
        this.map.drops.push({ x: this.player.x + 0.3, y: this.player.y + 0.3, items: slots, t: this.t + 1.5 });
        BI.UI.toast('🎒 Backpack full! Items dropped on the ground', 'bad');
      }
      return got;
    },

    updateDrops() {
      const p = this.player, d = this.map.drops;
      for (let i = d.length - 1; i >= 0; i--) {
        const dr = d[i];
        if (dr.t && this.t < dr.t) continue;
        if (Math.hypot(dr.x - p.x, dr.y - p.y) < 0.7) {
          const before = dr.items.filter(Boolean).map((x) => ({ id: x.id, n: x.n }));
          BI.Inv.moveAll(dr.items, this.bag());
          const names = before.map((x) => '+' + x.n + ' ' + BI.Data.ITEMS[x.id].name);
          if (BI.Inv.isEmpty(dr.items)) d.splice(i, 1); else { dr.t = this.t + 3; BI.UI.toast('🎒 Backpack full', 'bad'); }
          const pp = BI.World.iso(p.x, p.y);
          names.slice(0, 3).forEach((s, k) => BI.FX.text(pp.x, pp.y - 50 - k * 18, s, TEXT.item));
          BI.Audio.playPickup();
          BI.Save.scheduleSave();
        }
      }
    },

    // ---------------- targeting & actions ----------------
    findTarget() {
      const p = this.player, map = this.map, W = this.weapon();
      const ranged = W.ammo && BI.Inv.count(this.bag(), W.ammo) > 0;
      const reach = ranged ? W.range : (W.range || 1.25) + 0.15;
      let best = null, bd = 1e9;
      map.zombies.forEach((z) => {
        if (z.dead) return;
        const d = Math.hypot(z.x - p.x, z.y - p.y);
        if (d <= reach && d < bd) { bd = d; best = { kind: 'zombie', o: z, d }; }
      });
      if (best) return best;
      bd = 1e9;
      map.objs.forEach((o) => {
        const d = Math.hypot(o.gx + 0.5 - p.x, o.gy + 0.5 - p.y);
        if (d > REACH) return;
        let t = null;
        if (o.k === 'node' && o.respawnAt === 0) {
          const def = BI.Data.NODES[o.type];
          const ok = !def.tool || !!BI.Inv.bestTool(this.bag(), def.tool);
          t = { kind: 'node', o, ok };
        } else if (o.k === 'cont' && (!o.looted || (o.items && !BI.Inv.isEmpty(o.items)))) t = { kind: 'cont', o, ok: true };
        else if (o.k === 'well') t = { kind: 'well', o, ok: true };
        else if (o.k === 'exit') t = { kind: 'exit', o, ok: true };
        else if (o.k === 'build') {
          const def = BI.Data.BUILD[o.type];
          if (def.station || def.storage || def.produce) t = { kind: 'build', o, ok: true };
        }
        if (t) {
          // prefer things you can actually use right now; blocked targets only when nothing else is near
          const score = d + (t.ok ? 0 : 1.2);
          if (score < bd) { bd = score; best = t; }
        }
      });
      return best;
    },

    onActionPress() {
      if (this.state === 'GAMEPLAY' && this.actT <= 0) this.doAction();
    },

    doAction() {
      const tg = this.target || this.findTarget();
      if (!tg) {
        // swing at nothing
        this.player.act = 0.35;
        this.player.actKind = null;
        this.actT = 0.4;
        BI.Audio.playSwing();
        return;
      }
      if (tg.kind === 'zombie') return this.attack(tg.o);
      if (tg.kind === 'node') return this.gather(tg.o);
      if (tg.kind === 'cont') return this.startSearch(tg.o);
      if (tg.kind === 'well') return this.fillWater(tg.o);
      if (tg.kind === 'exit') { this.actT = 1; this.enterLocation('base'); return; }
      if (tg.kind === 'build') return this.useStructure(tg.o);
    },

    faceToward(x, y) {
      const p = this.player;
      const sx = (x - y) - (p.x - p.y);
      if (sx > 0.05) p.facing = 1; else if (sx < -0.05) p.facing = -1;
      p.back = (x + y) - (p.x + p.y) < -0.4 && Math.abs(sx) < 0.6;
    },

    attack(z) {
      const W = this.weapon(), slot = this.S.equip.weapon, p = this.player;
      const hasAmmo = W.ammo && BI.Inv.count(this.bag(), W.ammo) > 0;
      const d = Math.hypot(z.x - p.x, z.y - p.y);
      this.faceToward(z.x, z.y);
      p.act = 0.35;
      p.actKind = null;
      this.actT = W.rate || 0.55;
      let dmg = W.dmg;
      const zp = BI.World.iso(z.x, z.y);
      if (hasAmmo) {
        BI.Inv.remove(this.bag(), W.ammo, 1);
        const pp = BI.World.iso(p.x, p.y);
        BI.FX.tracer(pp.x + p.facing * 14, pp.y - 26, zp.x, zp.y - 22);
        BI.Audio.playShot();
        BI.Renderer.shake = 0.25;
        // gunshots attract zombies
        this.map.zombies.forEach((o) => { if (!o.dead && Math.hypot(o.x - p.x, o.y - p.y) < 9) o.alerted = true; });
      } else {
        if (W.ammo) dmg = 5; // out of ammo: pistol-whip
        if (d > (W.range || 1.25) + 0.25) { BI.Audio.playSwing(); return; }
        BI.Audio.playHit();
      }
      if (slot && BI.Inv.wear([slot], slot, 1)) {
        BI.UI.toast('💥 ' + BI.Data.ITEMS[slot.id].name + ' broke!', 'bad');
        this.S.equip.weapon = null;
      }
      z.hp -= dmg;
      z.hitT = 0.15;
      z.state = 'chase';
      z.alerted = true;
      const kx = z.x - p.x, ky = z.y - p.y, kl = Math.hypot(kx, ky) || 1;
      const nx = z.x + (kx / kl) * 0.18, ny = z.y + (ky / kl) * 0.18;
      if (!BI.World.blocked(this.map, nx, ny, BI.Entities.Z_RAD, 'zombie')) { z.x = nx; z.y = ny; }
      BI.FX.burst(zp.x, zp.y - 24, { n: 8, colors: ['#8a1a1a', '#b02a2a', '#5a8a3a'], speed: 70, size: 3 });
      BI.FX.text(zp.x, zp.y - 50, '-' + dmg, TEXT.dmg);
      if (z.hp <= 0) this.killZombie(z);
    },

    killZombie(z) {
      const T = BI.Data.ZOMBIES[z.type];
      z.dead = true;
      z.deadT = 0;
      this.S.stats.kills++;
      BI.Quests.addXP(T.xp);
      const items = this.rollLoot(T.loot, 4);
      if (!BI.Inv.isEmpty(items)) this.map.drops.push({ x: z.x, y: z.y, items, t: this.t + 0.6 });
      if (this.raid) this.raid.left = this.map.zombies.filter((o) => !o.dead && o.raid).length;
      BI.Quests.check();
      BI.Save.scheduleSave();
    },

    hurtPlayer(dmg, z) {
      if (this.playerDead) return;
      const eq = this.S.equip;
      if (eq.armor) {
        dmg = Math.round(dmg * (1 - BI.Data.ITEMS[eq.armor.id].armor));
        if (BI.Inv.wear([eq.armor], eq.armor, 1)) { BI.UI.toast('💥 Armor broke!', 'bad'); eq.armor = null; }
      }
      this.S.player.hp -= dmg;
      this.player.hurtT = 4;
      this.player.flash = 0.2;
      BI.Renderer.hurt = 1;
      BI.Renderer.shake = 0.35;
      BI.Audio.playHurt();
      const pp = BI.World.iso(this.player.x, this.player.y);
      BI.FX.text(pp.x, pp.y - 56, '-' + dmg, TEXT.dmg, true);
      BI.FX.burst(pp.x, pp.y - 24, { n: 6, colors: ['#b02a2a', '#ff5a5a'], speed: 60, size: 3 });
      if (this.S.player.hp <= 0) this.die('zombies');
    },

    die(cause) {
      if (this.playerDead) return;
      this.playerDead = true;
      this.S.player.hp = 0;
      this.S.stats.deaths++;
      const lost = this.bag().filter(Boolean).length;
      this.S.bag = BI.Inv.make(BI.Inv.BAG_SIZE);
      BI.Audio.playDeath();
      BI.Input.actionHeld = false;
      BI.UI.showDeath(cause, lost);
      this.push('DEAD');
      BI.Save.saveGame();
    },

    respawn() {
      const P = this.S.player;
      P.hp = 60;
      P.food = Math.max(P.food, 50);
      P.water = Math.max(P.water, 50);
      this.playerDead = false;
      this.enterLocation('base');
      this.setBase('GAMEPLAY');
    },

    gather(o) {
      const def = BI.Data.NODES[o.type], p = this.player;
      const tool = def.tool ? BI.Inv.bestTool(this.bag(), def.tool) : null;
      this.faceToward(o.gx + 0.5, o.gy + 0.5);
      if (def.tool && !tool) {
        this.actT = 0.6;
        BI.UI.toast(def.tool === 'axe' ? '🪓 You need an axe — craft one (CRAFT → Hands)' : '⛏️ You need a pickaxe — craft one (CRAFT → Hands)', 'bad');
        BI.Audio.playError();
        return;
      }
      const power = tool ? BI.Data.ITEMS[tool.id].power : 1;
      p.act = 0.35;
      p.actKind = null;
      if (tool) p.actKind = tool.id === 'iron_axe' ? 'iron_axe' : tool.id === 'iron_pick' ? 'iron_pick' : def.tool;
      this.actT = def.tool ? 0.55 : 0.35;
      o.hits -= power;
      o.shakeT = 0.25;
      const c = BI.World.iso(o.gx + 0.5, o.gy + 0.5);
      let i = 0;
      Object.keys(def.drops).forEach((k) => {
        const n = def.drops[k] + (tool && power > 1 && k !== 'berries' ? 1 : 0);
        this.giveItem(k, n, c.x, c.y - def.h - 6 - i * 18);
        this.S.stats.gather[k] = (this.S.stats.gather[k] || 0) + n;
        i++;
      });
      const chip = o.type === 'tree' ? ['#c9955c', '#7a4a24'] : o.type === 'bush' ? ['#4f8a3a', '#e8334a'] : o.type === 'iron_rock' ? ['#d8682e', '#9a8a82'] : ['#a3a9b6', '#646a78'];
      BI.FX.burst(c.x, c.y - def.h * 0.5, { n: 8, colors: chip, speed: 80, size: 3.5 });
      if (o.type === 'tree') BI.Audio.playChop(); else if (def.tool === 'pick') BI.Audio.playMine(); else BI.Audio.playGather();
      if (tool && BI.Inv.wear(this.bag(), tool, 1)) BI.UI.toast('💥 ' + BI.Data.ITEMS[tool.id].name + ' broke!', 'bad');
      if (o.hits <= 0) o.respawnAt = this.now + def.respawn * 1000;
      BI.Quests.addXP(def.xp);
      BI.Quests.check();
      BI.UI.updateBars();
      BI.Save.scheduleSave();
    },

    fillWater() {
      this.actT = 0.8;
      this.player.act = 0.3;
      this.player.actKind = null;
      const c = BI.World.iso(this.player.x, this.player.y);
      this.giveItem('water_dirty', 1, c.x, c.y - 60);
      this.S.stats.gather.water_dirty = (this.S.stats.gather.water_dirty || 0) + 1;
      BI.Audio.playDrink();
      BI.Quests.check();
    },

    rollLoot(table, size) {
      const slots = BI.Inv.make(size || 8);
      const rows = BI.Data.LOOT[table] || [];
      rows.forEach((r) => {
        if (Math.random() < r[3]) BI.Inv.add(slots, r[0], r[1] + Math.floor(Math.random() * (r[2] - r[1] + 1)));
      });
      return slots;
    },

    startSearch(o) {
      if (o.looted) { this.openLoot(o); return; }
      if (this.searching && this.searching.o === o) return;
      this.searching = { o, p: 0 };
      this.actT = 0.3;
      BI.Audio.playLoot();
    },
    updateSearch(dt) {
      const s = this.searching;
      if (!s) return;
      const p = this.player, o = s.o;
      if (Math.hypot(o.gx + 0.5 - p.x, o.gy + 0.5 - p.y) > REACH + 0.2) { this.searching = null; return; }
      s.p += dt / 1.2;
      if (s.p >= 1) {
        this.searching = null;
        o.looted = true;
        o.items = this.rollLoot(BI.Data.CONTAINERS[o.type].loot, 8);
        this.S.stats.looted++;
        BI.Quests.addXP(6);
        BI.Quests.check();
        if (BI.Inv.isEmpty(o.items)) { BI.UI.toast('Nothing useful here…'); return; }
        this.openLoot(o);
      }
    },
    openLoot(o) {
      this.lootOpen = o;
      BI.UI.renderLoot(o);
      this.push('LOOT');
    },
    takeLoot(i) {
      const o = this.lootOpen;
      if (!o) return;
      const ok = i == null ? BI.Inv.moveAll(o.items, this.bag()) > 0 : BI.Inv.moveSlot(o.items, i, this.bag());
      if (!ok && !BI.Inv.isEmpty(o.items)) { BI.UI.toast('🎒 Backpack full', 'bad'); BI.Audio.playError(); }
      else BI.Audio.playPickup();
      if (BI.Inv.isEmpty(o.items)) { this.pop(); this.lootOpen = null; } else BI.UI.renderLoot(o);
      BI.Save.scheduleSave();
    },

    useStructure(o) {
      const def = BI.Data.BUILD[o.type];
      this.actT = 0.5;
      if (def.produce) {
        if (this.isReady(o)) {
          const c = BI.World.iso(o.gx + 0.5, o.gy + 0.5);
          this.giveItem(def.produce.item, def.produce.n, c.x, c.y - def.h - 10);
          o.last = this.now;
          BI.Audio.playPickup();
          BI.Save.scheduleSave();
        } else {
          const left = Math.ceil((def.produce.every * 1000 - (this.now - (o.last || 0))) / 1000);
          BI.UI.toast(def.name + ': ready in ' + left + 's');
        }
        return;
      }
      if (def.storage) { this.openChest(o); return; }
      if (def.station) { BI.UI.openCraft(def.station); }
    },
    isReady(o) {
      const def = BI.Data.BUILD[o.type];
      return !!def.produce && this.now - (o.last || 0) >= def.produce.every * 1000;
    },
    openChest(o) {
      if (!o.items) o.items = BI.Inv.make(BI.Data.BUILD.chest.storage);
      this.chestOpen = o;
      BI.UI.renderInventory();
      this.push('INVENTORY');
    },

    // ---------------- inventory actions ----------------
    useItem(slotIdx) {
      const bag = this.bag(), x = bag[slotIdx];
      if (!x) return;
      const it = BI.Data.ITEMS[x.id], P = this.S.player;
      if (it.type === 'food' || it.type === 'med') {
        if (it.food) P.food = Math.min(100, P.food + it.food);
        if (it.water) P.water = Math.min(100, P.water + it.water);
        if (it.hp) P.hp = BI.Draw.clamp(P.hp + it.hp, 1, 100);
        BI.Inv.remove(bag, x.id, 1);
        this.S.stats.used[x.id] = (this.S.stats.used[x.id] || 0) + 1;
        if (it.type === 'med') BI.Audio.playPickup(); else if (it.water && !it.food) BI.Audio.playDrink(); else BI.Audio.playEat();
        const pp = BI.World.iso(this.player.x, this.player.y);
        const parts = [];
        if (it.hp) parts.push((it.hp > 0 ? '+' : '') + it.hp + ' HP');
        if (it.food) parts.push('+' + it.food + ' 🍖');
        if (it.water) parts.push('+' + it.water + ' 💧');
        BI.FX.text(pp.x, pp.y - 56, parts.join('  '), it.hp < 0 ? TEXT.dmg : TEXT.heal);
        BI.Quests.check();
      } else if (it.type === 'weapon' || it.type === 'armor') {
        const key = it.type;
        const cur = this.S.equip[key];
        this.S.equip[key] = x;
        bag[slotIdx] = cur;
        BI.Audio.playPickup();
      }
      BI.UI.updateBars();
      BI.Save.scheduleSave();
    },
    unequip(key) {
      const cur = this.S.equip[key];
      if (!cur) return;
      const j = this.bag().indexOf(null);
      if (j < 0) { BI.UI.toast('🎒 Backpack full', 'bad'); return; }
      this.bag()[j] = cur;
      this.S.equip[key] = null;
    },
    dropItem(slotIdx) {
      const bag = this.bag(), x = bag[slotIdx];
      if (!x) return;
      const slots = BI.Inv.make(1);
      slots[0] = x;
      bag[slotIdx] = null;
      this.map.drops.push({ x: this.player.x + 0.4, y: this.player.y + 0.4, items: slots, t: this.t + 3 });
    },
    /** Quick-use from the HUD bars: kind = hp | food | water */
    quickUse(kind) {
      const bag = this.bag(), I = BI.Data.ITEMS;
      let best = -1, score = -1;
      bag.forEach((x, i) => {
        if (!x) return;
        const it = I[x.id];
        let s = -1;
        if (kind === 'hp' && it.type === 'med') s = it.hp;
        if (kind === 'food' && it.type === 'food' && it.food) s = it.food + (it.hp || 0);
        if (kind === 'water' && it.type === 'food' && it.water) s = it.water + (it.hp || 0) * 2;
        if (s > score) { score = s; best = i; }
      });
      if (best < 0) {
        BI.UI.toast(kind === 'hp' ? '🩹 No bandages or medkits' : kind === 'food' ? '🥫 No food in your bag' : '💧 No water — fill a bottle at the well', 'bad');
        BI.Audio.playError();
        return;
      }
      this.useItem(best);
    },
    chestMove(fromChest, i) {
      const o = this.chestOpen;
      if (!o) return;
      const ok = fromChest ? BI.Inv.moveSlot(o.items, i, this.bag()) : BI.Inv.moveSlot(this.bag(), i, o.items);
      if (!ok) { BI.UI.toast('No space', 'bad'); BI.Audio.playError(); } else BI.Audio.playClick();
      BI.Save.scheduleSave();
    },
    storeAll() {
      const o = this.chestOpen;
      if (!o) return;
      const bag = this.bag();
      bag.forEach((x, i) => { if (x && BI.Data.ITEMS[x.id].type === 'res') BI.Inv.moveSlot(bag, i, o.items); });
      BI.Audio.playPickup();
      BI.Save.scheduleSave();
    },

    // ---------------- crafting ----------------
    stationAvailable(st) {
      if (st === 'hands') return true;
      return this.atBase && this.map.objs.some((o) => o.k === 'build' && BI.Data.BUILD[o.type].station === st);
    },
    craft(id) {
      const rc = BI.Data.RECIPES.find((r) => r.id === id);
      if (!rc) return;
      if (this.S.level < rc.level) { BI.UI.toast('🔒 Unlocks at level ' + rc.level, 'bad'); return; }
      if (!this.stationAvailable(rc.station)) { BI.UI.toast('Build a ' + BI.Data.STATIONS[rc.station].name + ' at your shelter first', 'bad'); BI.Audio.playError(); return; }
      if (!BI.Inv.take(this.bag(), rc.in)) { BI.UI.toast('Not enough materials', 'bad'); BI.Audio.playError(); return; }
      Object.keys(rc.out).forEach((k) => {
        this.giveItem(k, rc.out[k], null, null, true);
        this.S.stats.craft[k] = (this.S.stats.craft[k] || 0) + rc.out[k];
      });
      const name = BI.Data.ITEMS[Object.keys(rc.out)[0]].name;
      BI.UI.toast('✅ Crafted ' + name, 'good');
      BI.Audio.playCraft();
      BI.Quests.addXP(4 + Object.values(rc.in).reduce((a, b) => a + b, 0) / 2);
      BI.Quests.check();
      BI.Save.scheduleSave();
    },

    // ---------------- building ----------------
    selectBuild(type) {
      const def = BI.Data.BUILD[type];
      if (!this.atBase) { BI.UI.toast('You can only build at your shelter', 'bad'); return; }
      if (this.S.level < def.level) { BI.UI.toast('🔒 Unlocks at level ' + def.level, 'bad'); return; }
      if (!BI.Inv.has(this.bag(), def.cost)) { BI.UI.toast('Not enough materials', 'bad'); BI.Audio.playError(); return; }
      const p = this.player;
      const gx = Math.floor(p.x + p.facing * 1.2), gy = Math.floor(p.y + 1);
      this.build = { type, gx: BI.Draw.clamp(gx, 0, this.map.size - 1), gy: BI.Draw.clamp(gy, 0, this.map.size - 1), rot: 0, error: null, demolish: false };
      this.validateBuild();
      this.setBase('BUILD_MODE');
      const c = BI.World.iso(this.build.gx + 0.5, this.build.gy + 0.5);
      BI.Renderer.target.x = c.x; BI.Renderer.target.y = c.y - 20;
      BI.UI.updateBuildBar();
    },
    startDemolish() {
      const p = this.player;
      this.build = { type: 'wood_wall', gx: Math.floor(p.x), gy: Math.floor(p.y) + 1, rot: 0, error: null, demolish: true };
      this.validateBuild();
      this.setBase('BUILD_MODE');
      BI.UI.updateBuildBar();
    },
    checkPlacement(b) {
      const S = this.map.size;
      if (b.gx < 0 || b.gy < 0 || b.gx >= S || b.gy >= S) return 'Outside the shelter';
      const o = BI.World.objAt(this.map, b.gx, b.gy);
      if (b.demolish) return o && o.k === 'build' ? null : 'Pick one of your structures';
      if (o) return 'Space is occupied';
      const p = this.player, r = BI.Entities.P_RAD;
      if (p.x + r > b.gx && p.x - r < b.gx + 1 && p.y + r > b.gy && p.y - r < b.gy + 1) return 'You are standing here';
      if (this.map.zombies.some((z) => !z.dead && Math.floor(z.x) === b.gx && Math.floor(z.y) === b.gy)) return 'A zombie is in the way';
      if (!BI.Inv.has(this.bag(), BI.Data.BUILD[b.type].cost)) return 'Not enough materials';
      return null;
    },
    validateBuild() { if (this.build) this.build.error = this.checkPlacement(this.build); },
    moveGhostTo(x, y) {
      const b = this.build;
      if (!b) return;
      const S = this.map.size;
      x = BI.Draw.clamp(x, 0, S - 1); y = BI.Draw.clamp(y, 0, S - 1);
      if (x === b.gx && y === b.gy) return;
      b.gx = x; b.gy = y;
      this.validateBuild();
      BI.UI.updateBuildBar();
    },
    rotateBuild() { if (this.build) { this.build.rot = (this.build.rot + 1) % 2; } },
    cancelBuild() { this.build = null; this.setBase('GAMEPLAY'); },
    confirmBuild() {
      const b = this.build;
      if (!b) return;
      this.validateBuild();
      BI.UI.updateBuildBar();
      if (b.error) { BI.UI.toast(b.error, 'bad'); BI.Audio.playError(); return; }
      const c = BI.World.iso(b.gx + 0.5, b.gy + 0.5);
      if (b.demolish) {
        const o = BI.World.objAt(this.map, b.gx, b.gy);
        const def = BI.Data.BUILD[o.type];
        if (o.items && !BI.Inv.isEmpty(o.items)) { BI.UI.toast('Empty the chest first', 'bad'); return; }
        this.removeObj(o);
        Object.keys(def.cost).forEach((k) => { const n = Math.floor(def.cost[k] / 2); if (n) this.giveItem(k, n, c.x, c.y - 40); });
        BI.FX.burst(c.x, c.y - 15, { n: 16, colors: ['#9a6a36', '#a3a9b6', '#fff'], speed: 90, size: 4 });
        BI.Audio.playBreak();
        this.validateBuild();
        BI.UI.updateBuildBar();
        BI.Save.scheduleSave();
        return;
      }
      const def = BI.Data.BUILD[b.type];
      BI.Inv.take(this.bag(), def.cost);
      const o = { k: 'build', type: b.type, gx: b.gx, gy: b.gy, rot: b.rot, hp: def.hp || 100, buildT: BI.Renderer.t };
      if (def.storage) o.items = BI.Inv.make(def.storage);
      if (def.produce) o.last = this.now;
      BI.World.put(this.map, o);
      const st = this.S.stats;
      st.build[b.type] = (st.build[b.type] || 0) + 1;
      if (def.wall || def.door) st.walls++;
      BI.FX.burst(c.x, c.y, { n: 14, colors: ['#e8dcc0', '#fff', '#c9b28a'], speed: 70, size: 4, up: 40, grav: 120 });
      BI.Audio.playBuild();
      BI.Quests.addXP(def.wall || def.door ? 4 : 15);
      BI.Quests.check();
      BI.Save.scheduleSave();
      // walls: keep building; everything else: back to the game
      if ((def.wall || def.door) && BI.Inv.has(this.bag(), def.cost)) { this.validateBuild(); BI.UI.updateBuildBar(); }
      else this.cancelBuild();
    },
    removeObj(o) {
      const i = this.map.objs.indexOf(o);
      if (i >= 0) this.map.objs.splice(i, 1);
      BI.World.reindex(this.map);
    },
    hitStructure(o, dmg) {
      o.hp -= dmg;
      o.shakeT = 0.25;
      const c = BI.World.iso(o.gx + 0.5, o.gy + 0.5);
      BI.FX.burst(c.x, c.y - 20, { n: 5, colors: ['#9a6a36', '#a3a9b6'], speed: 60, size: 3 });
      BI.Audio.playHit();
      if (o.hp <= 0) {
        this.removeObj(o);
        BI.FX.burst(c.x, c.y - 15, { n: 18, colors: ['#9a6a36', '#a3a9b6', '#555'], speed: 100, size: 4 });
        BI.Audio.playBreak();
        BI.UI.toast('⚠️ ' + BI.Data.BUILD[o.type].name + ' was destroyed!', 'bad');
      }
    },

    // ---------------- hordes at the shelter ----------------
    updateRaid(dt) {
      const S = this.S;
      if (!this.atBase) return;
      if (this.raid) {
        const left = this.map.zombies.filter((z) => !z.dead && z.raid).length;
        this.raid.left = left;
        if (left === 0) {
          this.raid = null;
          S.stats.raids++;
          BI.UI.toast('🛡️ Horde defeated!', 'good');
          BI.Quests.addXP(60);
          BI.Quests.check();
        }
        BI.UI.setRaid(this.raid);
        return;
      }
      if (S.level < 3) return;
      S.raidT -= dt;
      if (S.raidT <= 12 && S.raidT + dt > 12) { BI.UI.toast('⚠️ A horde is approaching your shelter!', 'bad'); BI.Audio.playAlarm(); }
      if (S.raidT <= 0) {
        S.raidT = 300 + Math.random() * 180;
        const n = 3 + Math.floor(S.level / 2);
        const sz = this.map.size;
        for (let i = 0; i < n; i++) {
          const side = Math.floor(Math.random() * 4), k = 1 + Math.random() * (sz - 2);
          const pos = side === 0 ? [0.6, k] : side === 1 ? [sz - 0.6, k] : side === 2 ? [k, 0.6] : [k, sz - 0.6];
          if (BI.World.blocked(this.map, pos[0], pos[1], 0.24, 'zombie')) continue;
          const type = S.level >= 7 && i === 0 ? 'brute' : Math.random() < 0.3 ? 'runner' : 'walker';
          const z = BI.Entities.makeZombie(type, pos[0], pos[1]);
          z.raid = true; z.alerted = true; z.state = 'chase';
          this.map.zombies.push(z);
        }
        this.raid = { left: n };
        BI.UI.setRaid(this.raid);
        BI.Audio.playAlarm();
      }
    },

    // ---------------- taps & keys ----------------
    onTap(sx, sy) {
      if (this.state === 'BUILD_MODE') {
        const g = this.screenToGrid(sx, sy), b = this.build;
        const gx = Math.floor(g.x), gy = Math.floor(g.y);
        if (b && gx === b.gx && gy === b.gy) this.confirmBuild(); else this.moveGhostTo(gx, gy);
        return;
      }
      if (this.state !== 'GAMEPLAY') return;
      const g = this.screenToGrid(sx, sy);
      const S = this.map.size;
      if (g.x > 0 && g.y > 0 && g.x < S && g.y < S) this.player.target = { x: g.x, y: g.y };
    },

    onKey(code) {
      const st = this.state;
      if (document.getElementById('confirm').classList.contains('active')) return;
      if (st === 'QUEST_COMPLETE' || st === 'REWARD') { if (code === 'Enter' || code === 'Escape') BI.UI.closePopup(); return; }
      if (st === 'MAIN_MENU') { if (code === 'Enter') this.startGameplay(); return; }
      if (st === 'GAMEPLAY') {
        if (code === 'KeyI' || code === 'Tab') BI.UI.handle('inventory');
        else if (code === 'KeyC') BI.UI.handle('craft');
        else if (code === 'KeyB' && this.atBase) BI.UI.handle('build-menu');
        else if (code === 'KeyM' && this.atBase) BI.UI.handle('map');
        else if (code === 'Digit1') this.quickUse('hp');
        else if (code === 'Digit2') this.quickUse('food');
        else if (code === 'Digit3') this.quickUse('water');
        else if (code === 'Escape') this.goMenu();
        return;
      }
      if (st === 'BUILD_MODE') {
        const b = this.build;
        if (code === 'Escape') this.cancelBuild();
        else if (code === 'KeyR') this.rotateBuild();
        else if (code === 'Enter') this.confirmBuild();
        else if (code === 'KeyA' || code === 'ArrowLeft') this.moveGhostTo(b.gx - 1, b.gy);
        else if (code === 'KeyD' || code === 'ArrowRight') this.moveGhostTo(b.gx + 1, b.gy);
        else if (code === 'KeyW' || code === 'ArrowUp') this.moveGhostTo(b.gx, b.gy - 1);
        else if (code === 'KeyS' || code === 'ArrowDown') this.moveGhostTo(b.gx, b.gy + 1);
        return;
      }
      if (code === 'Escape' && st !== 'DEAD') this.pop();
    },

    watchAd() {
      BI.AdManager.showRewardedAd((ok) => {
        if (!ok) { BI.UI.toast('Ad skipped — no reward'); return; }
        const items = this.rollLoot('supply', 6);
        const got = [];
        items.forEach((x) => { if (x) { this.giveItem(x.id, x.n, null, null, true); got.push(x.n + ' ' + BI.Data.ITEMS[x.id].name); } });
        BI.UI.toast('📦 Supply drop: ' + (got.join(', ') || 'empty'), 'good');
        BI.Audio.playReward();
        BI.Save.saveGame();
      });
    },
    setSetting(k, v) {
      this.S.settings[k] = v;
      if (k === 'music') BI.Audio.setMusic(v);
      if (k === 'sfx') BI.Audio.setSfx(v);
      BI.Save.saveGame();
    },
  };

  BI.Game = Game;
})();
