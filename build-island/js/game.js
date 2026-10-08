/* Game: state manager + all gameplay actions (collect, build, expand, travel, shop). */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  const COLLECT_RANGE = 1.5;
  const color = (k) => (k === 'coins' ? '#ffd34d' : (BI.Items.ITEMS[k] && BI.Items.ITEMS[k].color) || '#ffffff');
  const TRADES = {
    wood: { give: 'wood', amount: 20, price: 40 },
    stone: { give: 'stone', amount: 15, price: 40 },
    sand: { give: 'sand', amount: 15, price: 60 },
    crystal: { give: 'crystal', amount: 3, price: 90 },
  };
  // Base states replace the stack; overlay states are pushed on top.
  const STATES = ['MAIN_MENU', 'GAMEPLAY', 'BUILD_MODE', 'BUILD_MENU', 'BLUEPRINTS', 'ISLAND_SELECT', 'ISLAND_PROGRESS', 'STATION', 'INVENTORY', 'SHOP', 'SETTINGS', 'QUEST_COMPLETE', 'ISLAND_COMPLETE', 'REWARD'];

  const Game = {
    STATES, TRADES,
    ready: false,
    stack: ['MAIN_MENU'],
    t: 0,
    now: Date.now(),
    island: null, def: null, theme: null, cache: null,
    occB: null, occN: null,
    player: null,
    build: null,
    nearNode: null,
    pendingNode: null,
    expandT: 1,
    zoomMul: 1,
    station: null,
    uiT: 0,
    smokeT: 0,
    buildAnims: new Map(),
    popAnims: new Map(),

    get state() { return this.stack[this.stack.length - 1]; },
    get base() { return this.stack[0]; },

    // ---------------- lifecycle ----------------
    init() {
      this.canvas = document.getElementById('gameCanvas');
      BI.state = BI.Save.loadGame() || BI.Save.defaultState();
      BI.Audio.applySettings(BI.state.settings);
      BI.Progression.syncBlueprints();
      BI.Renderer.init(this.canvas);
      BI.UI.init();
      BI.Input.init(this.canvas);
      this.loadIsland(BI.state.currentIsland);
      BI.Quests.ensureActive();
      this.ready = true;
      this.setBase('MAIN_MENU');
      this.updateCameraTarget();
      BI.Renderer.snap();
      BI.UI.updateAll();
      setInterval(() => { if (this.ready) BI.Save.saveGame(); }, 15000);
      window.addEventListener('pagehide', () => BI.Save.saveGame());
      document.addEventListener('visibilitychange', () => { if (document.hidden) BI.Save.saveGame(); });
    },

    reset() {
      BI.Save.resetGame();
      BI.Progression.syncBlueprints();
      BI.Audio.applySettings(BI.state.settings);
      this.loadIsland('green');
      BI.Quests.ensureActive();
      this.setBase('MAIN_MENU');
      this.updateCameraTarget();
      BI.Renderer.snap();
      BI.UI.updateAll();
      BI.UI.renderSettings();
      BI.Save.saveGame();
      BI.UI.toast('Progress reset — a fresh island awaits!', 'good');
    },

    // ---------------- state manager ----------------
    setBase(name) {
      this.stack = [name];
      BI.UI.sync(this.stack);
    },
    push(name) {
      if (this.state === name) return;
      this.stack.push(name);
      BI.UI.sync(this.stack);
    },
    pop() {
      if (this.stack.length > 1) this.stack.pop();
      BI.UI.sync(this.stack);
    },
    startGameplay() {
      if (this.base === 'BUILD_MODE') this.build = null;
      this.setBase('GAMEPLAY');
      BI.UI.updateAll();
    },
    goMenu() {
      this.build = null;
      this.setBase('MAIN_MENU');
      BI.UI.updateMenu();
      BI.Save.saveGame();
    },

    // ---------------- island ----------------
    loadIsland(id) {
      const s = BI.state;
      if (!BI.Progression.BY_ID[id]) id = 'green';
      if (!s.islands[id]) s.islands[id] = BI.Island.createIslandState(id);
      this.island = s.islands[id];
      this.def = BI.Progression.BY_ID[id];
      this.theme = BI.Island.THEMES[this.def.theme];
      s.currentIsland = id;
      const S = this.island.size;
      this.island.buildings = this.island.buildings.filter((b) => {
        const d = BI.Buildings.DEFS[b.type];
        if (!d) return false;
        const fp = BI.Buildings.footprint(d, b.rot || 0);
        if (b.last == null) b.last = Date.now();
        return b.gx >= 0 && b.gy >= 0 && b.gx + fp[0] <= S && b.gy + fp[1] <= S;
      });
      this.buildAnims.clear();
      this.popAnims.clear();
      BI.FX.clear();
      this.build = null;
      this.nearNode = null;
      this.pendingNode = null;
      this.expandT = 1;
      this.rebuildOcc();
      this.rebuildCache();
      const p = this.island.player;
      let x, y;
      if (p && !this.playerBlocked(p.x, p.y)) { x = p.x; y = p.y; } else {
        const f = this.findFreeCell(Math.floor(S / 2), Math.floor(S / 2));
        x = f.x + 0.5;
        y = f.y + 0.5;
      }
      this.player = BI.Player.create(x, y);
      this.station = null;
      if (BI.UI.setHudResources) BI.UI.setHudResources(this.def.finds.filter((k) => k !== 'crystal').slice(0, 2));
    },

    rebuildOcc() {
      const isl = this.island, S = isl.size;
      this.occB = new Int16Array(S * S).fill(-1);
      this.occN = new Int16Array(S * S).fill(-1);
      isl.buildings.forEach((b, i) => {
        const fp = BI.Buildings.footprint(BI.Buildings.DEFS[b.type], b.rot);
        for (let y = b.gy; y < b.gy + fp[1]; y++) for (let x = b.gx; x < b.gx + fp[0]; x++) this.occB[y * S + x] = i;
      });
      isl.nodes.forEach((n, i) => {
        if (n.gx >= 0 && n.gy >= 0 && n.gx < S && n.gy < S) this.occN[n.gy * S + n.gx] = i;
      });
    },

    rebuildCache() {
      const R = BI.Renderer;
      const w = this.island.size * 64 + 52;
      const q = Math.min(2, Math.max(1, R.dpr * R.gameplayZoom()), 2600 / w);
      this.cache = BI.Island.buildCache(this.island, this.theme, q);
    },

    inside(x, y) { const S = this.island.size; return x >= 0 && y >= 0 && x < S && y < S; },

    findFreeCell(cx, cy) {
      const S = this.island.size;
      for (let r = 0; r < S; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = cx + dx, y = cy + dy;
            if (this.inside(x, y) && this.occB[y * S + x] < 0 && this.occN[y * S + x] < 0) return { x, y };
          }
        }
      }
      return { x: cx, y: cy };
    },

    playerBlocked(x, y) {
      const r = BI.Player.RADIUS, S = this.island.size;
      if (x - r < 0 || y - r < 0 || x + r > S || y + r > S) return true;
      const xs = [x - r, x + r], ys = [y - r, y + r];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const k = Math.floor(ys[j]) * S + Math.floor(xs[i]);
          if (this.occB[k] >= 0) return true;
          const ni = this.occN[k];
          if (ni >= 0 && this.island.nodes[ni].respawnAt === 0) return true;
        }
      }
      return false;
    },

    // ---------------- main update ----------------
    update(dt) {
      this.t += dt;
      this.now = Date.now();
      const st = this.state, p = this.player, isl = this.island, I = BI.Island;

      // respawn resources (never on top of the player)
      for (let i = 0; i < isl.nodes.length; i++) {
        const n = isl.nodes[i];
        if (n.respawnAt > 0 && this.now >= n.respawnAt) {
          if (Math.abs(p.x - (n.gx + 0.5)) < 0.8 && Math.abs(p.y - (n.gy + 0.5)) < 0.8) {
            n.respawnAt = this.now + 1500;
          } else {
            n.respawnAt = 0;
            this.popAnims.set(n, this.t);
          }
        }
      }

      if (this.playerBlocked(p.x, p.y)) {
        const f = this.findFreeCell(Math.floor(p.x), Math.floor(p.y));
        p.x = f.x + 0.5;
        p.y = f.y + 0.5;
      }

      if (st === 'GAMEPLAY') {
        const mv = BI.Input.getMove();
        if (mv.x || mv.y) this.pendingNode = null;
        BI.Player.update(p, dt, mv.x, mv.y, this);
        this.nearNode = this.findNearNode();
        BI.UI.setCollect(this.nearNode);
        if (this.pendingNode) {
          const n = this.pendingNode;
          if (n.respawnAt !== 0) this.pendingNode = null;
          else if (this.distToNode(n) <= COLLECT_RANGE) {
            this.pendingNode = null;
            p.target = null;
            this.collectNode(n);
          } else if (!p.target) this.pendingNode = null;
        }
        // walk past a building to pick up what it produced
        for (let i = 0; i < isl.buildings.length; i++) {
          const b = isl.buildings[i];
          if (!this.isReady(b)) continue;
          const fp = BI.Buildings.footprint(BI.Buildings.DEFS[b.type], b.rot);
          const cx = b.gx + fp[0] / 2, cy = b.gy + fp[1] / 2;
          if (Math.hypot(p.x - cx, p.y - cy) < 1.15 + Math.max(fp[0], fp[1]) / 2) this.collectProduction(b);
        }
      } else {
        p.moving = false;
        if (st !== 'BUILD_MODE') this.nearNode = null;
      }

      // crafting stations run in real time
      for (let i = 0; i < isl.buildings.length; i++) {
        const b = isl.buildings[i];
        if (!b.jobs || !b.jobs.length) continue;
        const done = BI.Crafting.update(b, this.now);
        if (done) this.onCrafted(b, done);
      }
      if (st === 'STATION') {
        this.uiT -= dt;
        if (this.uiT <= 0) { this.uiT = 0.2; BI.UI.refreshStation(); }
      }

      // chimney smoke
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.45;
        isl.buildings.forEach((b) => {
          const def = BI.Buildings.DEFS[b.type];
          if (!def.smoke || (def.station && !BI.Crafting.active(b, this.now))) return;
          const c = I.iso(b.gx + 0.5, b.gy + 0.5);
          const o = BI.Draw.P(def.smoke[0], def.smoke[1], def.smoke[2]);
          BI.FX.smoke(c.x + o[0], c.y + o[1]);
        });
      }

      if (this.expandT < 1) this.expandT = Math.min(1, this.expandT + dt / 0.8);
      this.updateCameraTarget();
      BI.Renderer.update(dt);
      if (st === 'GAMEPLAY') BI.UI.tryShowPopup();
    },

    updateCameraTarget() {
      const R = BI.Renderer, T = R.target, I = BI.Island, S = this.island.size;
      if (this.base === 'MAIN_MENU') {
        const c = I.iso(S / 2, S / 2);
        T.zoom = R.fitZoom(S, 0.94);
        T.x = c.x;
        T.y = c.y + S * 9 - (R.h * 0.07) / T.zoom;
      } else if (this.base === 'GAMEPLAY') {
        const p = I.iso(this.player.x, this.player.y);
        T.zoom = R.gameplayZoom() * this.zoomMul;
        T.x = p.x;
        T.y = p.y - 24;
      } else if (this.base === 'BUILD_MODE') {
        T.zoom = R.gameplayZoom() * 0.82 * this.zoomMul;
      }
    },

    onResize() {
      this.updateCameraTarget();
      if (this.base === 'MAIN_MENU') BI.Renderer.snap();
    },

    onWheel(dy) {
      this.zoomMul = BI.Draw.clamp(this.zoomMul * (dy > 0 ? 0.9 : 1.1), 0.6, 1.6);
    },

    screenToGrid(sx, sy) {
      const w = BI.Renderer.s2w(sx, sy);
      return BI.Island.toGrid(w.x, w.y);
    },

    panCamera(dx, dy) {
      const R = BI.Renderer, z = R.cam.zoom, S = this.island.size;
      const T = R.target;
      T.x = BI.Draw.clamp(T.x - dx / z, -S * 32, S * 32);
      T.y = BI.Draw.clamp(T.y - dy / z, 0, S * 32);
      R.cam.x = T.x;
      R.cam.y = T.y;
    },

    // ---------------- resources ----------------
    distToNode(n) { return Math.hypot(this.player.x - (n.gx + 0.5), this.player.y - (n.gy + 0.5)); },

    findNearNode() {
      let best = null, bd = COLLECT_RANGE;
      const nodes = this.island.nodes;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.respawnAt !== 0) continue;
        const d = this.distToNode(n);
        if (d <= bd) { bd = d; best = n; }
      }
      return best;
    },

    collectNearest() {
      if (this.state !== 'GAMEPLAY') return;
      const n = this.findNearNode();
      if (n) this.collectNode(n);
      else BI.UI.toast('Walk up to a tree, rock or crystal');
    },

    collectNode(n) {
      if (!n || n.respawnAt !== 0) return;
      const T = BI.Resources.TYPES[n.type];
      const s = BI.state, I = BI.Island;
      s.res[T.res] += T.amount;
      s.stats[T.res] += T.amount;
      this.island.stats[T.res] += T.amount;
      n.respawnAt = this.now + T.respawn * 1000;
      const c = I.iso(n.gx + 0.5, n.gy + 0.5);
      BI.FX.burst(c.x, c.y - T.h * 0.45, { n: 16, colors: T.color, speed: 95, size: 4.5, up: 80 });
      BI.FX.burst(c.x, c.y, { n: 6, colors: ['#ffffff'], speed: 40, size: 2.5, up: 30 });
      BI.FX.text(c.x, c.y - T.h - 6, '+' + T.amount + ' ' + BI.Items.name(T.res).toUpperCase(), color(T.res));
      const sp = BI.Renderer.w2s(c.x, c.y - T.h * 0.5);
      BI.UI.fly(T.res, sp.x, sp.y, 3);
      const pp = I.iso(this.player.x, this.player.y);
      this.player.facing = c.x >= pp.x ? 1 : -1;
      this.player.act = 0.3;
      this.nearNode = null;
      BI.Audio.playCollect(T.res);
      BI.Progression.addXP(T.xp);
      this.afterProgress();
      BI.Save.scheduleSave();
    },

    isReady(b) {
      const def = BI.Buildings.DEFS[b.type];
      if (def.station) return BI.Crafting.hasOutput(b);
      return !!def.produce && this.now - b.last >= def.produce.every * 1000;
    },

    /** Icon for a building's "ready" bubble. */
    readyIcon(b) {
      const def = BI.Buildings.DEFS[b.type];
      if (def.station) return Object.keys(b.out).find((k) => b.out[k] > 0);
      return def.produce.res;
    },

    /** Add items to the bag with stats, floating text and fly-to-HUD. */
    gain(items, wx, wy) {
      const s = BI.state;
      let i = 0;
      Object.keys(items).forEach((k) => {
        const n = items[k];
        if (!n) return;
        s.res[k] = (s.res[k] || 0) + n;
        BI.FX.text(wx, wy - i * 18, '+' + n + ' ' + (k === 'coins' ? 'COINS' : BI.Items.name(k).toUpperCase()), color(k));
        const sp = BI.Renderer.w2s(wx, wy);
        BI.UI.fly(k, sp.x, sp.y, Math.min(5, 2 + (n >> 2)));
        i++;
      });
    },

    collectProduction(b) {
      const def = BI.Buildings.DEFS[b.type];
      if (!this.isReady(b)) return;
      const s = BI.state;
      const fp = BI.Buildings.footprint(def, b.rot);
      const c = BI.Island.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
      let items;
      if (def.station) {
        items = BI.Crafting.takeOutput(b);
      } else {
        const pr = def.produce;
        items = { [pr.res]: pr.amount };
        if (pr.res !== 'coins') {
          s.stats[pr.res] = (s.stats[pr.res] || 0) + pr.amount;
          this.island.stats[pr.res] = (this.island.stats[pr.res] || 0) + pr.amount;
        }
        b.last = this.now;
      }
      const k0 = Object.keys(items)[0];
      BI.FX.burst(c.x, c.y - def.h - 12, { n: 12, colors: [color(k0), '#ffffff'], speed: 80, size: 3.5 });
      this.gain(items, c.x, c.y - def.h - 20);
      BI.Audio.playCoin();
      BI.Progression.addXP(1);
      this.afterProgress();
      if (this.station === b && this.state === 'STATION') BI.UI.renderStation();
      BI.Save.scheduleSave();
    },

    /** Stats + effects when a station finishes jobs. */
    onCrafted(b, done) {
      const s = BI.state, isl = this.island;
      let xp = 0;
      done.forEach((d) => {
        Object.keys(d.recipe.out).forEach((k) => {
          const n = d.recipe.out[k] * d.n;
          s.stats.crafted[k] = (s.stats.crafted[k] || 0) + n;
          isl.stats.crafted = isl.stats.crafted || {};
          isl.stats.crafted[k] = (isl.stats.crafted[k] || 0) + n;
        });
        xp += Math.max(1, Math.round((d.recipe.time * d.n) / 4));
      });
      const def = BI.Buildings.DEFS[b.type];
      const fp = BI.Buildings.footprint(def, b.rot);
      const c = BI.Island.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
      BI.FX.burst(c.x, c.y - def.h * 0.6, { n: 10, colors: ['#ffffff', '#ffd34d'], speed: 70, size: 3 });
      BI.Progression.addXP(xp);
      this.afterProgress();
      if (this.station === b && this.state === 'STATION') BI.UI.renderStation();
      BI.Save.scheduleSave();
    },

    // ---------------- stations ----------------
    openStation(b) {
      this.station = b;
      if (BI.Crafting.hasOutput(b)) this.collectProduction(b);
      BI.UI.renderStation();
      this.push('STATION');
    },

    craft(r, n) {
      const b = this.station;
      if (!b) return;
      const err = BI.Crafting.start(b, r, n, Date.now());
      if (err) {
        BI.UI.toast(err === 'Queue is full' ? 'Queue is full — wait for a job to finish' : 'Not enough resources for ×' + n, 'bad');
        BI.Audio.playError();
        return;
      }
      BI.Audio.playBuild();
      BI.UI.updateRes();
      BI.UI.renderStation();
      BI.Save.scheduleSave();
    },

    collectStation() {
      if (this.station) this.collectProduction(this.station);
    },

    sell(key, n) {
      const s = BI.state, it = BI.Items.ITEMS[key];
      if (!it || !it.sell) return;
      n = Math.min(n, s.res[key] || 0);
      if (n <= 0) { BI.Audio.playError(); return; }
      s.res[key] -= n;
      s.res.coins += it.sell * n;
      s.stats.sold += n;
      BI.Audio.playCoin();
      BI.UI.toast('Sold ' + n + ' ' + BI.UI.ico(key) + ' for ' + BI.UI.ico('coins') + (it.sell * n), 'good');
      BI.UI.updateRes();
      BI.UI.renderInventory();
      BI.Quests.check();
      BI.Save.scheduleSave();
    },

    unlockIsland(id) {
      const def = BI.Progression.BY_ID[id];
      const block = BI.Progression.unlockBlocker(def);
      if (block) {
        BI.UI.toast('🔒 ' + block, 'bad');
        BI.Audio.playError();
        return;
      }
      BI.UI.confirm('Unlock ' + def.name + '?', def.unlock.text + ' for ' + BI.UI.costHtml(def.unlock.cost), 'UNLOCK', () => {
        if (BI.Progression.unlockIsland(id)) {
          BI.UI.updateRes();
          BI.UI.renderIslands();
          this.setBase('GAMEPLAY');
        }
      });
    },

    /** Re-evaluate quests, island completion, unlocks and the HUD after any gain. */
    afterProgress() {
      BI.Quests.check();
      BI.Progression.checkIslandCompletion();
      BI.Progression.checkUnlocks();
      BI.UI.updateRes();
      BI.UI.updateIslandBtn();
    },

    // ---------------- taps ----------------
    hitTest(wx, wy) {
      const I = BI.Island, isl = this.island;
      let best = null, bd = -1e9;
      isl.nodes.forEach((n) => {
        const c = I.iso(n.gx + 0.5, n.gy + 0.5);
        const T = BI.Resources.TYPES[n.type];
        const h = n.respawnAt === 0 ? T.h : 12;
        if (Math.abs(wx - c.x) < T.w && wy > c.y - h && wy < c.y + 10) {
          const d = n.gx + n.gy + 1;
          if (d > bd) { bd = d; best = { kind: 'node', o: n }; }
        }
      });
      isl.buildings.forEach((b) => {
        const def = BI.Buildings.DEFS[b.type];
        const fp = BI.Buildings.footprint(def, b.rot);
        const c = I.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
        const ready = this.isReady(b);
        const bubble = ready && Math.hypot(wx - c.x, wy - (c.y - def.h - 12)) < 20;
        const body = Math.abs(wx - c.x) < (fp[0] + fp[1]) * 16 + 2 && wy > c.y - def.h - 4 && wy < c.y + (fp[0] + fp[1]) * 8;
        if (bubble || body) {
          const d = b.gx + fp[0] / 2 + b.gy + fp[1] / 2 + (bubble ? 100 : 0);
          if (d > bd) { bd = d; best = { kind: 'building', o: b }; }
        }
      });
      return best;
    },

    onTap(sx, sy) {
      const st = this.state;
      if (st === 'BUILD_MODE') {
        const g = this.screenToGrid(sx, sy);
        const b = this.build, fp = this.buildFootprint();
        if (b && g.x >= b.gx && g.x < b.gx + fp[0] && g.y >= b.gy && g.y < b.gy + fp[1]) this.confirmBuild();
        else this.moveGhostCentered(g.x, g.y);
        return;
      }
      if (st !== 'GAMEPLAY') return;
      const w = BI.Renderer.s2w(sx, sy);
      const hit = this.hitTest(w.x, w.y);
      if (hit && hit.kind === 'building') {
        const b = hit.o, def = BI.Buildings.DEFS[b.type];
        if (def.station) this.openStation(b);
        else if (this.isReady(b)) this.collectProduction(b);
        else if (def.produce) {
          const left = Math.ceil((def.produce.every * 1000 - (this.now - b.last)) / 1000);
          BI.UI.toast(def.emoji + ' ' + def.name + ' · next ' + BI.UI.ico(def.produce.res) + ' in ' + left + 's');
        } else BI.UI.toast(def.emoji + ' ' + def.name);
        return;
      }
      if (hit && hit.kind === 'node') {
        const n = hit.o;
        if (n.respawnAt !== 0) {
          BI.UI.toast('Regrows in ' + Math.ceil((n.respawnAt - this.now) / 1000) + 's');
        } else if (this.distToNode(n) <= COLLECT_RANGE) {
          this.collectNode(n);
        } else {
          this.pendingNode = n;
          this.player.target = { x: n.gx + 0.5, y: n.gy + 0.5 };
          const c = BI.Island.iso(n.gx + 0.5, n.gy + 0.5);
          BI.FX.ring(c.x, c.y, '#ffcf2e');
        }
        return;
      }
      const g = BI.Island.toGrid(w.x, w.y);
      const S = this.island.size;
      if (g.x > 0 && g.y > 0 && g.x < S && g.y < S) {
        this.pendingNode = null;
        this.player.target = { x: g.x, y: g.y };
        BI.FX.ring(w.x, w.y, '#ffffff');
      }
    },

    onKey(code) {
      const st = this.state;
      if (document.getElementById('confirm').classList.contains('active')) return;
      if (st === 'QUEST_COMPLETE' || st === 'ISLAND_COMPLETE' || st === 'REWARD') {
        if (code === 'Enter' || code === 'Space' || code === 'Escape') BI.UI.closePopup();
        return;
      }
      if (st === 'MAIN_MENU') {
        if (code === 'Enter' || code === 'Space') this.startGameplay();
        return;
      }
      if (st === 'GAMEPLAY') {
        if (code === 'KeyE' || code === 'Space') this.collectNearest();
        else if (code === 'KeyB') BI.UI.handle('build-menu');
        else if (code === 'Escape') this.goMenu();
        return;
      }
      if (st === 'BUILD_MODE') {
        const b = this.build;
        if (code === 'Escape') this.cancelBuild();
        else if (code === 'KeyR') this.rotateBuild();
        else if (code === 'Enter' || code === 'Space') this.confirmBuild();
        else if (code === 'KeyA' || code === 'ArrowLeft') this.moveGhostTo(b.gx - 1, b.gy);
        else if (code === 'KeyD' || code === 'ArrowRight') this.moveGhostTo(b.gx + 1, b.gy);
        else if (code === 'KeyW' || code === 'ArrowUp') this.moveGhostTo(b.gx, b.gy - 1);
        else if (code === 'KeyS' || code === 'ArrowDown') this.moveGhostTo(b.gx, b.gy + 1);
        return;
      }
      if (code === 'Escape') this.pop();
    },

    // ---------------- building ----------------
    canAfford(cost) {
      const r = BI.state.res;
      return Object.keys(cost).every((k) => r[k] >= cost[k]);
    },
    pay(cost) {
      const r = BI.state.res;
      Object.keys(cost).forEach((k) => { r[k] -= cost[k]; });
    },

    selectBuilding(type) {
      const def = BI.Buildings.DEFS[type];
      if (!BI.Progression.isBlueprintUnlocked(type)) {
        BI.UI.toast('🔒 ' + def.name + ' unlocks at level ' + def.level, 'bad');
        BI.Audio.playError();
        return;
      }
      if (!this.canAfford(def.cost)) {
        const miss = Object.keys(def.cost).filter((k) => BI.state.res[k] < def.cost[k]).map((k) => BI.UI.ico(k) + (def.cost[k] - BI.state.res[k])).join(' ');
        BI.UI.toast('Not enough resources · need ' + miss, 'bad');
        BI.Audio.playError();
        return;
      }
      this.enterBuildMode(type);
    },

    buildFootprint() {
      const b = this.build;
      return b ? BI.Buildings.footprint(BI.Buildings.DEFS[b.type], b.rot) : [1, 1];
    },

    enterBuildMode(type) {
      const def = BI.Buildings.DEFS[type];
      const fp = BI.Buildings.footprint(def, 0);
      const S = this.island.size;
      const px = Math.floor(this.player.x), py = Math.floor(this.player.y);
      let spot = null;
      for (let r = 1; r < S && !spot; r++) {
        for (let dy = -r; dy <= r && !spot; dy++) {
          for (let dx = -r; dx <= r && !spot; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const cand = { type, gx: px + dx, gy: py + dy, rot: 0 };
            if (!this.checkPlacement(cand, true)) spot = cand;
          }
        }
      }
      if (!spot) spot = { type, gx: BI.Draw.clamp(px, 0, S - fp[0]), gy: BI.Draw.clamp(py, 0, S - fp[1]), rot: 0 };
      this.build = { type, gx: spot.gx, gy: spot.gy, rot: 0, error: null };
      this.validateBuild();
      this.setBase('BUILD_MODE');
      const c = BI.Island.iso(this.build.gx + fp[0] / 2, this.build.gy + fp[1] / 2);
      BI.Renderer.target.x = c.x;
      BI.Renderer.target.y = c.y - 30;
      this.updateCameraTarget();
      BI.UI.updateBuildBar();
      BI.Audio.playWhoosh();
    },

    /** Returns an error string, or null when the spot is valid. */
    checkPlacement(b, ignoreCost) {
      const def = BI.Buildings.DEFS[b.type];
      const fp = BI.Buildings.footprint(def, b.rot);
      const S = this.island.size;
      if (b.gx < 0 || b.gy < 0 || b.gx + fp[0] > S || b.gy + fp[1] > S) return 'Must be on the island';
      for (let y = b.gy; y < b.gy + fp[1]; y++) {
        for (let x = b.gx; x < b.gx + fp[0]; x++) {
          if (this.occB[y * S + x] >= 0) return 'Space is occupied';
          if (this.occN[y * S + x] >= 0) return 'A resource is in the way';
        }
      }
      const p = this.player, r = BI.Player.RADIUS;
      if (p.x + r > b.gx && p.x - r < b.gx + fp[0] && p.y + r > b.gy && p.y - r < b.gy + fp[1]) return 'You are standing here';
      if (!ignoreCost && !this.canAfford(def.cost)) return 'Not enough resources';
      return null;
    },

    validateBuild() {
      if (this.build) this.build.error = this.checkPlacement(this.build);
    },

    moveGhostTo(x, y) {
      const b = this.build;
      if (!b) return;
      const fp = this.buildFootprint(), S = this.island.size;
      x = BI.Draw.clamp(x, 0, S - fp[0]);
      y = BI.Draw.clamp(y, 0, S - fp[1]);
      if (x === b.gx && y === b.gy) return;
      b.gx = x;
      b.gy = y;
      this.validateBuild();
      BI.UI.updateBuildBar();
    },
    moveGhostCentered(gx, gy) {
      const fp = this.buildFootprint();
      this.moveGhostTo(Math.round(gx - fp[0] / 2), Math.round(gy - fp[1] / 2));
    },

    rotateBuild() {
      const b = this.build;
      if (!b) return;
      b.rot = (b.rot + 1) % 2;
      const fp = this.buildFootprint(), S = this.island.size;
      b.gx = BI.Draw.clamp(b.gx, 0, S - fp[0]);
      b.gy = BI.Draw.clamp(b.gy, 0, S - fp[1]);
      this.validateBuild();
      BI.UI.updateBuildBar();
    },

    cancelBuild() {
      this.build = null;
      this.setBase('GAMEPLAY');
    },

    confirmBuild() {
      const b = this.build;
      if (!b) return;
      this.validateBuild();
      BI.UI.updateBuildBar();
      if (b.error) {
        BI.UI.toast(b.error, 'bad');
        BI.Audio.playError();
        return;
      }
      const def = BI.Buildings.DEFS[b.type];
      const s = BI.state, isl = this.island;
      this.pay(def.cost);
      const nb = { type: b.type, gx: b.gx, gy: b.gy, rot: b.rot, last: this.now };
      isl.buildings.push(nb);
      this.buildAnims.set(nb, this.t);
      [s.stats, isl.stats].forEach((st) => {
        st.built += 1;
        st.byType[b.type] = (st.byType[b.type] || 0) + 1;
        if (def.house) st.houses += 1;
      });
      this.rebuildOcc();
      const fp = BI.Buildings.footprint(def, b.rot);
      const I = BI.Island;
      const c = I.iso(b.gx + fp[0] / 2, b.gy + fp[1] / 2);
      for (let y = b.gy; y < b.gy + fp[1]; y++) {
        for (let x = b.gx; x < b.gx + fp[0]; x++) {
          const p = I.iso(x + 0.5, y + 0.5);
          BI.FX.burst(p.x, p.y, { n: 12, colors: ['#f2e6c9', '#ffffff', '#d9c49a'], speed: 70, size: 5, up: 40, grav: 120, life: 0.9 });
        }
      }
      BI.FX.burst(c.x, c.y - def.h * 0.6, { n: 18, colors: ['#ffd34d', '#ffffff', '#8ff6ff'], speed: 130, size: 3.5, up: 90 });
      BI.FX.text(c.x, c.y - def.h - 8, '+' + def.xp + ' XP', '#ffd34d', true);
      BI.Audio.playBuild();
      this.build = null;
      this.setBase('GAMEPLAY');
      BI.Progression.addXP(def.xp);
      this.afterProgress();
      BI.UI.updateAll();
      BI.Save.saveGame();
    },

    // ---------------- expansion ----------------
    askExpand() {
      const isl = this.island, n = isl.expansions, I = BI.Island;
      if (n >= I.MAX_EXPANSIONS) {
        BI.UI.toast('🏝️ This island is fully expanded!');
        return;
      }
      const cost = I.EXPANSION_COSTS[n];
      if (BI.state.res.coins < cost) {
        BI.UI.toast('Need ' + BI.UI.ico('coins') + cost + ' to expand · get coins from quests & buildings', 'bad');
        BI.Audio.playError();
        return;
      }
      BI.UI.confirm('Expand island?', 'Grow from ' + isl.size + '×' + isl.size + ' to ' + (isl.size + 2) + '×' + (isl.size + 2) + ' for ' + BI.UI.ico('coins') + ' <b>' + cost + '</b>', 'EXPAND', () => this.expandIsland());
    },

    expandIsland() {
      const isl = this.island, n = isl.expansions, I = BI.Island, s = BI.state;
      if (n >= I.MAX_EXPANSIONS) return;
      const cost = I.EXPANSION_COSTS[n];
      if (s.res.coins < cost) return;
      s.res.coins -= cost;
      I.expand(isl);
      this.player.x += 1;
      this.player.y += 1;
      if (this.player.target) { this.player.target.x += 1; this.player.target.y += 1; }
      BI.Renderer.cam.y += 32;
      BI.Renderer.target.y += 32;
      s.stats.expansions += 1;
      this.rebuildOcc();
      this.rebuildCache();
      this.expandT = 0;
      const S = isl.size;
      for (let k = 0; k <= S; k += 2) {
        [I.iso(k, 0), I.iso(0, k), I.iso(S, k), I.iso(k, S)].forEach((p) => {
          BI.FX.burst(p.x, p.y, { n: 4, colors: ['#8af07a', '#ffffff', '#ffd34d'], speed: 90, size: 4, up: 100 });
        });
      }
      const xp = 60 * (n + 1);
      const bonus = { wood: 20, stone: 10 };
      s.res.wood += bonus.wood;
      s.res.stone += bonus.stone;
      BI.UI.queuePopup({ kind: 'expand', size: S, rewards: { xp, wood: bonus.wood, stone: bonus.stone } });
      BI.Audio.playExpand();
      this.setBase('GAMEPLAY');
      BI.Progression.addXP(xp);
      this.afterProgress();
      BI.UI.updateAll();
      BI.Save.saveGame();
    },

    // ---------------- islands ----------------
    travelTo(id) {
      if (!BI.Progression.isUnlocked(id)) return;
      if (id === this.island.id) {
        this.startGameplay();
        return;
      }
      this.island.player = { x: this.player.x, y: this.player.y };
      const go = () => {
        this.loadIsland(id);
        this.setBase('GAMEPLAY');
        this.updateCameraTarget();
        BI.Renderer.snap();
        BI.UI.updateAll();
        BI.UI.toast('Welcome to ' + this.def.emoji + ' ' + this.def.name + '!', 'good');
        BI.Audio.playWhoosh();
        BI.Save.saveGame();
      };
      BI.AdManager.showInterstitial(go);
    },

    // ---------------- shop & settings ----------------
    watchAd(reward) {
      if (!BI.AdManager.isRewardedReady()) return;
      BI.AdManager.showRewardedAd((ok) => {
        if (!ok) {
          BI.UI.toast('Ad skipped — no reward');
          return;
        }
        const amt = reward === 'crystal' ? 5 : 100;
        BI.state.res[reward] += amt;
        BI.state.stats.ads += 1;
        BI.UI.updateRes();
        BI.UI.toast('🎉 +' + amt + ' ' + BI.UI.ico(reward) + ' reward received!', 'good');
        BI.Audio.playReward();
        BI.UI.renderShop();
        BI.Save.saveGame();
      });
    },

    trade(id) {
      const t = TRADES[id], s = BI.state;
      if (!t) return;
      if (s.res.coins < t.price) {
        BI.UI.toast('Not enough coins', 'bad');
        BI.Audio.playError();
        return;
      }
      s.res.coins -= t.price;
      s.res[t.give] += t.amount;
      BI.UI.updateRes();
      BI.UI.renderShop();
      BI.UI.toast('+' + t.amount + ' ' + BI.UI.ico(t.give) + ' purchased', 'good');
      BI.Audio.playCoin();
      BI.Save.scheduleSave();
    },

    setSetting(key, val) {
      BI.state.settings[key] = val;
      if (key === 'music') BI.Audio.setMusic(val);
      if (key === 'sfx') BI.Audio.setSfx(val);
      BI.Save.saveGame();
    },
  };

  BI.Game = Game;
})();
