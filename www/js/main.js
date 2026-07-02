/* ============================================================
   Main — boot, canvas game loop, in-level HUD, navigation glue.
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.GameData;

  const Game = {
    engine: null,
    inLevel: false,
    last: 0,

    boot: function () {
      global.Save.load();
      const root = document.getElementById('app');
      this.root = root;
      global.UI.init(root);

      this.canvas = document.getElementById('board');
      this.ctx = this.canvas.getContext('2d');
      this.gameScreen = document.getElementById('screen-game');

      this.bindInput();
      this.resize();
      const onResize = this.resize.bind(this);
      global.addEventListener('resize', onResize);
      global.addEventListener('orientationchange', function () { setTimeout(onResize, 120); });

      // Resume audio on first interaction.
      const kick = function () { global.Audio2.resume(); global.Audio2.startMusic(); document.removeEventListener('pointerdown', kick); };
      document.addEventListener('pointerdown', kick);

      // Silence audio when the app is backgrounded / the tab is hidden; restore
      // on return. Fixes music continuing to play in the background. (The render
      // loop is paused automatically by the browser for hidden tabs.)
      const self0 = this;
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { global.Audio2.suspendAll(); }
        else { global.Audio2.resumeAll(); self0.last = 0; if (!self0._rafOn) { self0._rafOn = true; requestAnimationFrame(self0._loop); } }
      });
      global.addEventListener('pagehide', function () { global.Audio2.suspendAll(); });

      // Welcome
      const p = global.Save.get();
      const offline = global.Save.farmTick(); // accrue idle income (incl. offline)
      this.go('home');
      if (!p.firstRun && (offline.gold + offline.energy + offline.gems) >= 1) {
        const self = this;
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = '<div class="big-emoji">🏝️</div><p>' + T('welcome_back') + '</p><div class="win-rewards">' + global.UI.rich(global.UI.farmRewardStr(offline)) + '</div>';
        setTimeout(function () {
          global.UI.modal(T('welcome_back_title'), body, [{ label: '🎁 ' + T('collect_all'), primary: true, onClick: function () {
            const t = global.Save.farmCollectAll(); global.Audio2.play('coin'); global.UI.refreshCurrencies(); global.UI.toast(global.UI.farmRewardStr(t)); self.go('home');
          } }]);
        }, 600);
      }
      if (p.firstRun) {
        p.firstRun = false; global.Save.save();
        this.showStoryIntro();
      }
      this._loop = this.loop.bind(this); // bound once — no per-frame closure allocation
      this._rafOn = true;
      this._ftSum = 0; this._ftCount = 0; this._perfLocked = false;
      requestAnimationFrame(this._loop);
    },

    // ---- Story / narrative ------------------------------------------------
    showStoryIntro: function () {
      const self = this;
      const body = document.createElement('div');
      body.className = 'modal-body story-body';
      body.innerHTML = '<div class="big-emoji">' + global.UI.dragonGlyph(D.dragonById('flare'), 'big-sprite', '#ff9d5c') + '</div>' + T('story_intro');
      global.UI.modal('📖 ' + T('story_title'), body, [
        { label: T('start_adventure'), primary: true, onClick: function () {
          global.UI.modal(T('welcome_title'), self.welcomeBody(), [{ label: T('start_adventure'), primary: true }]);
        } }
      ]);
    },
    // One-time character/boss dialogue bubble.
    bossDialogue: function (lv) {
      if (!lv.boss || !lv.bossDef) return;
      const p = global.Save.get();
      const key = lv.bossDef.sprite;
      if (!p.story) p.story = { bossSeen: {} };
      if (!p.story.bossSeen) p.story.bossSeen = {};
      if (p.story.bossSeen[key]) return;
      p.story.bossSeen[key] = true; global.Save.save();
      const self = this;
      setTimeout(function () { global.UI.dialogue(global.UI.spriteGlyph(lv.bossDef.sprite, lv.bossDef.emoji, '', lv.bossDef.color), lv.bossDef.name, T('boss_l_' + key)); }, 900);
    },

    welcomeBody: function () {
      const b = document.createElement('div');
      b.className = 'modal-body';
      b.innerHTML = '<div class="big-emoji">🐉</div>' + T('welcome_body');
      return b;
    },

    go: function (id) {
      this.inLevel = false;
      this.gameScreen.classList.add('hidden');
      global.UI.closeModal();
      // Clear any lingering in-game dialogue / tip bubbles when leaving a level.
      const dp = this.root.querySelector('.dialogue-pop'); if (dp) dp.remove();
      const tp = this.root.querySelector('.tip-pop'); if (tp) tp.remove();
      const prog = global.Save.get().levelProgress;
      global.Audio2.setIsland(Math.floor((prog - 1) / 25)); // hub music matches current island
      if (id === 'home') global.UI.renderHome();
      else if (id === 'map') global.UI.renderMap();
      else if (id === 'collection') global.UI.renderCollection();
      else if (id === 'shop') global.UI.renderShop();
      else if (id === 'pass') global.UI.renderPass();
      else if (id === 'modes') global.UI.renderModes();
      global.UI.show(id);
    },

    // ---- Level lifecycle --------------------------------------------------
    startLevel: function (lvNum) {
      const p = global.Save.get();
      if (global.Save.livesInfo().count <= 0) {
        global.UI.showNoLives(function () { Game.startLevel(lvNum); });
        return;
      }
      global.UI.closeModal();
      // Shallow copy so per-run skill mods never mutate the shared level object.
      const lv = Object.assign({}, D.LEVELS[lvNum - 1]);
      lv.mods = D.skillMods(p.skills);
      this.currentLevel = lvNum;
      this.currentLevelObj = lv;
      this.engine = new global.Engine();
      const self = this;
      // Callbacks guard against a not-yet-built HUD (init() fires emitObjective);
      // buildHud() re-emits the objective once the HUD elements exist.
      this.engine.init(lv, p.equipped, {
        onScore: function (s) {
          if (self.tutorialActive && !self._tutScored && s > 0) { self._tutScored = true; self.tutorialAdvance(); }
          if (!self.hud) return; self.hud.score.textContent = s;
        },
        onMoves: function (m) { if (!self.hud) return; self.hud.moves.textContent = m; if (m <= 5) self.hud.moves.classList.add('low'); else self.hud.moves.classList.remove('low'); },
        onObjective: function (cur, goal, label) {
          if (!self.hud) return;
          self.hud.objLabel.textContent = label;
          self.hud.objVal.textContent = cur + ' / ' + goal;
          self.hud.objBar.style.width = Math.min(100, cur / goal * 100) + '%';
        },
        onDragons: function (dragons) { self.renderDragonBars(dragons); },
        onDragonProc: function (d) { global.UI.toast(T('dragon_active', { e: d.def.emoji, name: d.def.name })); },
        onCombo: function (n) { self.showCombo(n); },
        onShuffle: function () { global.UI.toast(T('shuffled')); },
        onSynergy: function (used) { global.UI.toast('⚡ ' + T('synergy') + '! ' + used.map(function (d) { return d.def.emoji; }).join('')); },
        onFever: function (active, ratio) { self.renderFever(active, ratio); },
        onBoss: function (hp, max, def) { self.renderBossBar(hp, max, def); },
        onBossAttack: function (n) { global.UI.toast(T('boss_attack', { n: n })); },
        onWin: function (res) { self.onWin(res); },
        onLose: function (res) { self.onLose(res); }
      });
      this.buildHud(lv);
      this.inLevel = true;
      global.UI.show('game');
      this.gameScreen.classList.remove('hidden');
      this.resize();
      global.Audio2.setIsland(lv.island);
      global.Audio2.startMusic();
      this.tutorialActive = false; this._tutScored = false;
      if (lvNum === 1 && !p.tutorialDone) this.startTutorial();
      else { this.showLevelIntro(lv); this.levelTips(lv); this.bossDialogue(lv); }
    },

    // ---- Game modes (Blitz / Endless / Daily) ----------------------------
    startMode: function (mode) {
      const p = global.Save.get();
      global.UI.closeModal();
      const self = this;
      const island = mode === 'endless' ? 2 : mode === 'blitz' ? 0 : (new Date().getDate() % 5);
      let lv;
      if (mode === 'blitz') {
        lv = { mode: 'blitz', cols: 8, rows: 8, colors: 6, objective: D.OBJ.SCORE, target: 1e9, moves: 99999, timeLimit: 60, island: island, name: T('mode_blitz'), n: 0 };
      } else if (mode === 'endless') {
        lv = { mode: 'endless', cols: 8, rows: 8, colors: 6, objective: D.OBJ.SCORE, target: 1e9, moves: 99999, island: island, name: T('mode_endless'), n: 0 };
      } else { // daily
        const d = new Date();
        const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
        lv = { mode: 'daily', cols: 8, rows: 8, colors: 6, objective: D.OBJ.SCORE, target: 4000 + (seed % 9) * 800, moves: 22 + (seed % 7), island: island, name: T('mode_daily'), n: 0,
          reward: { gold: 300, energy: 40 }, star2: 1, star3: 1 };
      }
      lv.mods = D.skillMods(p.skills);
      this.currentMode = mode;
      this.currentLevel = null;
      this.currentLevelObj = lv;
      this.engine = new global.Engine();
      this.engine.init(lv, p.equipped, {
        onScore: function (s) { if (self.hud) self.hud.score.textContent = s; },
        onMoves: function (m) { if (self.hud && lv.mode === 'daily') self.hud.moves.textContent = m; },
        onObjective: function (cur, goal, label) {
          if (!self.hud || lv.mode !== 'daily') return;
          self.hud.objLabel.textContent = label; self.hud.objVal.textContent = cur + ' / ' + goal;
          self.hud.objBar.style.width = Math.min(100, cur / goal * 100) + '%';
        },
        onTime: function (t) { if (self.hud) { self.hud.moves.textContent = Math.ceil(t) + 's'; if (t <= 10) self.hud.moves.classList.add('low'); } },
        onDanger: function (dg) {
          if (!self.hud) return;
          self.hud.objVal.textContent = Math.floor(dg) + '%';
          self.hud.objBar.style.width = dg + '%';
          self.hud.objBar.style.background = dg > 70 ? '#ff5d6c' : dg > 40 ? '#ffd24d' : '#5fe39a';
        },
        onDragons: function (dragons) { self.renderDragonBars(dragons); },
        onDragonProc: function (d) { global.UI.toast(T('dragon_active', { e: d.def.emoji, name: d.def.name })); },
        onCombo: function (n) { self.showCombo(n); },
        onShuffle: function () { global.UI.toast(T('shuffled')); },
        onSynergy: function (used) { global.UI.toast('⚡ ' + T('synergy') + '! ' + used.map(function (d) { return d.def.emoji; }).join('')); },
        onFever: function (active, ratio) { self.renderFever(active, ratio); },
        onModeEnd: function (res) { self.onModeEnd(res); },
        onWin: function (res) { self.onDailyEnd(true, res); },
        onLose: function (res) { self.onDailyEnd(false, res); }
      });
      this.buildHud(lv);
      // adapt HUD for timed/survival modes
      if (mode === 'blitz') { this.hud.movesLabel.textContent = '⏱'; this.hud.moves.textContent = lv.timeLimit + 's'; this.hud.objLabel.textContent = T('obj_score'); this.hud.objVal.textContent = '0'; }
      else if (mode === 'endless') { this.hud.movesLabel.textContent = '∞'; this.hud.moves.textContent = '∞'; this.hud.objLabel.textContent = '⚠ ' + T('mode_endless_danger'); this.hud.objVal.textContent = '0%'; }
      this.inLevel = true;
      global.UI.show('game');
      this.gameScreen.classList.remove('hidden');
      this.resize();
      global.Audio2.setIsland(lv.island);
      global.Audio2.startMusic();
      this.tutorialActive = false; this._tutScored = false;
      this.showLevelIntro(lv);
    },

    onDailyEnd: function (win, res) {
      const p = global.Save.get();
      const today = new Date().toISOString().slice(0, 10);
      p.daily2.date = today; p.daily2.done = true;
      let reward = 0, gems = 0;
      if (win) { reward = 300; gems = 15; p.gold += reward; p.gems += gems; }
      global.Save.save(); global.UI.refreshCurrencies();
      const self = this;
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">' + (win ? '📅' : '😢') + '</div>' +
        '<div class="win-score">' + T('score', { n: res.score }) + '</div>' +
        (win ? '<div class="win-rewards">+' + reward + '🪙 +' + gems + '💎</div>' : '<p class="muted small">' + T('daily_done_today') + '</p>');
      global.UI.modal(win ? T('victory') : T('defeat'), body, [
        { label: T('btn_island'), primary: true, onClick: function () { self.go('home'); } }
      ]);
    },

    // ---- Roguelite: Dragon Trials ----------------------------------------
    computeMods: function (relics) {
      // Start from the permanent dragon skill-tree bonuses, then layer relics on top.
      const sk = D.skillMods(global.Save.get().skills);
      const m = { moves: sk.extraMoves, chargeMult: sk.chargeMult, scoreMult: sk.scoreMult, startSpecials: sk.startSpecials, powerBonus: sk.powerBonus, goldMult: sk.goldMult };
      relics.forEach(function (id) {
        if (id === 'moves') m.moves += 3;
        else if (id === 'charge') m.chargeMult += 0.2;
        else if (id === 'score') m.scoreMult += 0.15;
        else if (id === 'specials') m.startSpecials += 1;
        else if (id === 'power') m.powerBonus += 1;
      });
      return m;
    },
    buildTrialsLevel: function (depth, mods) {
      const island = (depth - 1) % 5;
      const isBoss = depth % 5 === 0;
      const cyc = depth % 4;
      let objective = D.OBJ.SCORE, target = 1500 + depth * 500, color = 0, iceCount = 0, jellyCount = 0, crates = 0, chains = 0;
      if (isBoss) { objective = D.OBJ.BOSS; target = 70 + depth * 9; }
      else if (cyc === 1) { objective = D.OBJ.COLLECT; color = depth % 6; target = 18 + depth * 3; }
      else if (cyc === 2) { objective = D.OBJ.ICE; iceCount = 8 + depth; crates = 1 + (depth / 6 | 0); target = iceCount; }
      else if (cyc === 3) { objective = D.OBJ.JELLY; jellyCount = 8 + depth; target = jellyCount; }
      else { chains = (depth / 5 | 0); }
      const moves = Math.max(12, 22 - (depth / 3 | 0)) + (mods.moves || 0);
      return {
        mode: 'trials', cols: 8, rows: 8, colors: Math.min(6, 5 + (depth / 8 | 0)),
        objective: objective, target: target, color: color, iceCount: iceCount, jellyCount: jellyCount,
        crates: crates, chains: chains, moves: moves, island: island, n: 0, mods: mods,
        name: T('mode_trials') + ' · ' + T('depth', { n: depth }),
        boss: isBoss, bossDef: isBoss ? D.BOSSES[island] : null, reward: { gold: 0, energy: 0 }, star2: 1, star3: 1
      };
    },
    startTrials: function () {
      this.run = { depth: 1, relics: [], score: 0, revive: false };
      this.startTrialLevel();
    },
    startTrialLevel: function () {
      const p = global.Save.get();
      const self = this;
      const mods = this.computeMods(this.run.relics);
      const lv = this.buildTrialsLevel(this.run.depth, mods);
      this.currentMode = 'trials'; this.currentLevel = null; this.currentLevelObj = lv;
      this.engine = new global.Engine();
      this.engine.init(lv, p.equipped, {
        onScore: function (s) { if (self.hud) self.hud.score.textContent = s; },
        onMoves: function (m) { if (self.hud) { self.hud.moves.textContent = m; if (m <= 5) self.hud.moves.classList.add('low'); else self.hud.moves.classList.remove('low'); } },
        onObjective: function (cur, goal, label) { if (!self.hud) return; self.hud.objLabel.textContent = label; self.hud.objVal.textContent = cur + ' / ' + goal; self.hud.objBar.style.width = Math.min(100, cur / goal * 100) + '%'; },
        onDragons: function (d) { self.renderDragonBars(d); },
        onDragonProc: function (d) { global.UI.toast(T('dragon_active', { e: d.def.emoji, name: d.def.name })); },
        onCombo: function (n) { self.showCombo(n); },
        onShuffle: function () { global.UI.toast(T('shuffled')); },
        onSynergy: function (used) { global.UI.toast('⚡ ' + T('synergy') + '! ' + used.map(function (d) { return d.def.emoji; }).join('')); },
        onFever: function (active, ratio) { self.renderFever(active, ratio); },
        onBoss: function (hp, max, def) { self.renderBossBar(hp, max, def); },
        onBossAttack: function (n) { global.UI.toast(T('boss_attack', { n: n })); },
        onWin: function (res) { self.trialWin(res); },
        onLose: function (res) { self.trialLose(res); }
      });
      this.buildHud(lv);
      this.inLevel = true;
      global.UI.show('game');
      this.gameScreen.classList.remove('hidden');
      this.resize();
      global.Audio2.setIsland(lv.island);
      global.Audio2.startMusic();
      this.tutorialActive = false; this._tutScored = false;
      this.showLevelIntro(lv);
      this.levelTips(lv);
    },
    trialWin: function (res) {
      this.run.depth += 1; this.run.score += res.score;
      const p = global.Save.get(); p.gold += 40; global.Save.save(); global.UI.refreshCurrencies();
      this.showRelicPick();
    },
    trialLose: function (res) {
      if (this.run.revive) { // shield relic saves the run once
        this.run.revive = false;
        this.engine.movesLeft += 5; this.engine.finished = false; this.engine.state = 'idle';
        if (this.hud) this.hud.moves.textContent = this.engine.movesLeft;
        global.UI.toast('🛡️ ' + T('revived'));
        return;
      }
      this.trialsRunOver(res);
    },
    showRelicPick: function () {
      const self = this;
      // pick 3 distinct random relics
      const pool = D.RELICS.slice();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      const choices = pool.slice(0, 3);
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<p class="muted">' + T('depth', { n: this.run.depth }) + ' · ' + T('score', { n: this.run.score }) + '</p>';
      choices.forEach(function (rel) {
        const card = document.createElement('div');
        card.className = 'relic-card';
        const RELIC_ICON = { moves: 'moves', charge: 'energy', score: 'relic_score', specials: 'relic_specials', power: 'fever', shield: 'relic_shield' };
        const rIcon = (global.UiIcons && global.UiIcons.tag(RELIC_ICON[rel.id], 'relic-ic-img')) || rel.ic;
        card.innerHTML = '<div class="relic-ic">' + rIcon + '</div><div class="relic-info"><b>' + T('relic_' + rel.id) + '</b><span>' + T('relic_' + rel.id + '_d') + '</span></div>';
        card.addEventListener('click', function () {
          global.Audio2.play('coin');
          if (rel.id === 'shield') self.run.revive = true; else self.run.relics.push(rel.id);
          global.UI.closeModal();
          self.startTrialLevel();
        });
        body.appendChild(card);
      });
      global.UI.modal('🎁 ' + T('choose_relic'), body, []); // no buttons; must pick
    },
    trialsRunOver: function (res) {
      const p = global.Save.get();
      const depth = this.run.depth;
      const reward = depth * 50;
      p.gold += reward;
      const best = p.modeBest.trials || 0;
      const isBest = depth > best;
      if (isBest) p.modeBest.trials = depth;
      global.Save.save(); global.UI.refreshCurrencies();
      const self = this;
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">🐉</div>' +
        '<div class="win-score">' + T('depth', { n: depth }) + '</div>' +
        (isBest ? '<div class="streak-line">🏆 ' + T('new_best') + '</div>' : '<div class="muted small">' + T('best') + ': ' + best + '</div>') +
        '<div class="win-rewards">+' + reward + '🪙</div>';
      global.UI.modal(T('run_over'), body, [
        { label: T('btn_island'), onClick: function () { self.go('home'); } },
        { label: T('btn_retry'), primary: true, onClick: function () { self.startTrials(); } }
      ]);
    },

    onModeEnd: function (res) {
      const p = global.Save.get();
      const mode = this.currentMode;
      const reward = Math.floor(res.score / 20);
      p.gold += reward;
      const best = p.modeBest[mode] || 0;
      const isBest = res.score > best;
      if (isBest) p.modeBest[mode] = res.score;
      global.Save.addStat('energyEarned', 0);
      global.Save.save();
      global.UI.refreshCurrencies();
      const self = this;
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">' + (mode === 'blitz' ? '⏱️' : '♾️') + '</div>' +
        '<div class="win-score">' + T('score', { n: res.score }) + '</div>' +
        (isBest ? '<div class="streak-line">🏆 ' + T('new_best') + '</div>' : '<div class="muted small">' + T('best') + ': ' + best + '</div>') +
        '<div class="win-rewards">+' + reward + '🪙</div>';
      global.UI.modal(mode === 'blitz' ? T('time_up') : T('mode_over'), body, [
        { label: T('btn_island'), onClick: function () { self.go('home'); } },
        { label: T('btn_retry'), primary: true, onClick: function () { self.startMode(mode); } }
      ]);
    },

    // ---- Async PvP duel: a 45s score sprint against an opponent's ghost ---
    startPvp: function (opp) {
      const p = global.Save.get();
      global.UI.closeModal();
      const self = this;
      const island = p.levelProgress % 5;
      const lv = { mode: 'blitz', cols: 8, rows: 8, colors: 6, objective: D.OBJ.SCORE, target: 1e9,
        moves: 99999, timeLimit: 45, island: island, name: '⚔️ ' + T('pvp_title'), n: 0 };
      lv.mods = D.skillMods(p.skills);
      this.pvpOpp = opp;
      this.currentMode = 'pvp';
      this.currentLevel = null;
      this.currentLevelObj = lv;
      this.engine = new global.Engine();
      this.engine.init(lv, p.equipped, {
        onScore: function (s) { if (self.hud) self.hud.score.textContent = s; if (self.hud) self.hud.objVal.textContent = s + ' / ' + opp.score; },
        onTime: function (t) { if (self.hud) { self.hud.moves.textContent = Math.ceil(t) + 's'; if (t <= 10) self.hud.moves.classList.add('low'); } },
        onDragons: function (dragons) { self.renderDragonBars(dragons); },
        onDragonProc: function (d) { global.UI.toast(T('dragon_active', { e: d.def.emoji, name: d.def.name })); },
        onCombo: function (n) { self.showCombo(n); },
        onShuffle: function () { global.UI.toast(T('shuffled')); },
        onSynergy: function (used) { global.UI.toast('⚡ ' + T('synergy') + '! ' + used.map(function (d) { return d.def.emoji; }).join('')); },
        onFever: function (active, ratio) { self.renderFever(active, ratio); },
        onModeEnd: function (res) { self.resolvePvp(res); }
      });
      this.buildHud(lv);
      this.hud.movesLabel.textContent = '⏱';
      this.hud.moves.textContent = lv.timeLimit + 's';
      this.hud.objLabel.textContent = '⚔️ ' + opp.name;
      this.hud.objVal.textContent = '0 / ' + opp.score;
      this.inLevel = true;
      global.UI.show('game');
      this.gameScreen.classList.remove('hidden');
      this.resize();
      global.Audio2.setIsland(lv.island);
      global.Audio2.startMusic();
      this.tutorialActive = false; this._tutScored = false;
      this.showLevelIntro(lv);
    },
    resolvePvp: function (res) {
      const p = global.Save.get();
      const opp = this.pvpOpp || { name: '?', score: 0, trophies: 8, reward: 20 };
      const today = new Date().toISOString().slice(0, 10);
      const win = res.score >= opp.score;
      if (win) { p.pvp.wins = (p.pvp.wins || 0) + 1; p.pvp.trophies += opp.trophies; p.gold += opp.reward * 10; }
      else { p.pvp.losses = (p.pvp.losses || 0) + 1; p.pvp.trophies = Math.max(0, p.pvp.trophies - Math.floor(opp.trophies / 2)); }
      p.pvp.lastDate = today; p.pvp.played = (p.pvp.played || 0) + 1;
      global.Save.save(); global.UI.refreshCurrencies();
      const self = this;
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">' + (win ? '🏆' : '💔') + '</div>' +
        '<div class="pvp-vs"><span>' + T('score', { n: res.score }) + '</span><b>VS</b><span>' + opp.name + ': ' + opp.score + '</span></div>' +
        (win ? '<div class="win-rewards">🏆 +' + opp.trophies + '   +' + (opp.reward * 10) + '🪙</div>'
             : '<div class="muted small">🏆 -' + Math.floor(opp.trophies / 2) + '</div>');
      global.UI.modal(win ? '⚔️ ' + T('pvp_win') : T('pvp_lose'), body, [
        { label: T('btn_island'), onClick: function () { self.go('home'); } },
        { label: T('pvp_again'), primary: true, onClick: function () { global.UI.showPvp(); } }
      ]);
    },

    // One-time contextual tip (shown once ever per id).
    tip: function (id, delay) {
      const p = global.Save.get();
      if (p.tips[id]) return;
      p.tips[id] = true; global.Save.save();
      const self = this;
      setTimeout(function () { global.UI.tipBubble(T('tip_' + id)); }, delay || 700);
    },
    levelTips: function (lv) {
      if (lv.boss) this.tip('boss');
      else if (lv.objective === D.OBJ.JELLY) this.tip('jelly');
      else if (lv.crates > 0) this.tip('crate');
      else if (lv.chains > 0) this.tip('chain');
    },

    levelName: function (lv) {
      if (lv.boss) return '👑 ' + lv.name;
      if (lv.mode && lv.mode !== 'adventure') return lv.name;
      return T('level_n', { n: lv.n });
    },
    objectiveText: function (lv) {
      if (lv.mode === 'blitz') return T('mode_blitz_desc');
      if (lv.mode === 'endless') return T('mode_endless_desc');
      return lv.objective === D.OBJ.SCORE ? T('goal_score', { n: lv.target })
        : lv.objective === D.OBJ.COLLECT ? T('goal_collect', { n: lv.target, g: D.CRYSTALS[lv.color].glyph })
        : lv.objective === D.OBJ.JELLY ? T('goal_jelly', { n: lv.jellyCount })
        : lv.objective === D.OBJ.BOSS ? T('goal_boss')
        : T('goal_ice', { n: lv.iceCount + (lv.crates || 0) });
    },
    showLevelIntro: function (lv) {
      const s = this.gameScreen;
      const old = s.querySelector('.level-intro'); if (old) old.remove();
      const intro = document.createElement('div');
      intro.className = 'level-intro';
      intro.innerHTML = '<div class="li-card"><div class="li-name">' + this.levelName(lv) + '</div>' +
        '<div class="li-goal">' + T('level_intro_goal', { text: this.objectiveText(lv) }) + '</div>' +
        (lv.hard ? '<div class="li-hard">🔥 ' + T('hard_level') + '</div>' : '') + '</div>';
      s.appendChild(intro);
      setTimeout(function () { intro.classList.add('out'); }, 1300);
      setTimeout(function () { if (intro.parentNode) intro.remove(); }, 1900);
    },

    // ---- Interactive tutorial --------------------------------------------
    startTutorial: function () {
      this.tutorialActive = true;
      const layer = document.createElement('div');
      layer.className = 'tutorial-layer';
      layer.innerHTML = '<div class="tut-bubble" id="tut-bubble"></div>';
      this.gameScreen.appendChild(layer);
      this.tutLayer = layer;
      this.setTutorialText(T('tut1'));
      // surface a hint move on the board
      if (this.engine) { this.engine.idleTime = 5; this.engine.hint = this.engine.findHintMove(); }
    },
    setTutorialText: function (html) {
      const b = this.tutLayer && this.tutLayer.querySelector('#tut-bubble');
      if (b) { b.innerHTML = html; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    },
    tutorialAdvance: function () {
      const self = this;
      this.setTutorialText(T('tut2'));
      setTimeout(function () {
        self.setTutorialText(T('tut3'));
        setTimeout(function () {
          if (self.tutLayer) { self.tutLayer.remove(); self.tutLayer = null; }
          self.tutorialActive = false;
          const p = global.Save.get(); p.tutorialDone = true; global.Save.save();
        }, 2800);
      }, 2800);
    },

    buildHud: function (lv) {
      const s = this.gameScreen;
      // remove old overlay
      const old = s.querySelector('.hud');
      if (old) old.remove();
      const oldDr = s.querySelector('.dragon-bars'); if (oldDr) oldDr.remove();
      const oldTop = s.querySelector('.game-top'); if (oldTop) oldTop.remove();
      const oldBo = s.querySelector('.booster-bar'); if (oldBo) oldBo.remove();
      const oldSyn = s.querySelector('.synergy-btn'); if (oldSyn) oldSyn.remove();
      const oldTut = s.querySelector('.tutorial-layer'); if (oldTut) oldTut.remove();
      const oldBoss = s.querySelector('.boss-panel'); if (oldBoss) oldBoss.remove();
      const oldIntro = s.querySelector('.level-intro'); if (oldIntro) oldIntro.remove();
      s.classList.remove('fever-mode'); // clear any ember tint left from a prior level's fever

      const top = document.createElement('div');
      top.className = 'game-top';
      top.innerHTML =
        '<button class="btn-back">‹</button>' +
        '<div class="lvl-name">' + this.levelName(lv) + '</div>' +
        '<button class="btn-pause">⏸</button>';
      s.appendChild(top);
      const self = this;
      top.querySelector('.btn-back').addEventListener('click', function () { global.Audio2.play('click'); self.confirmQuit(); });
      top.querySelector('.btn-pause').addEventListener('click', function () { global.Audio2.play('click'); self.pause(); });

      const hud = document.createElement('div');
      hud.className = 'hud';
      hud.innerHTML =
        '<div class="hud-stats">' +
          '<div class="hud-pill"><div class="hp-l">' + T('obj_score') + '</div><div class="hp-v" id="hud-score">0</div></div>' +
          '<div class="hud-pill"><div class="hp-l" id="hud-moves-label">' + T('b_moves') + '</div><div class="hp-v" id="hud-moves">' + lv.moves + '</div></div>' +
        '</div>' +
        '<div class="hud-obj">' +
          '<div class="obj-top"><span id="hud-obj-label">—</span><span id="hud-obj-val">0 / 0</span></div>' +
          '<div class="bar"><div class="bar-fill" id="hud-obj-bar" style="background:#ffd24d"></div></div>' +
        '</div>' +
        '<div class="fever-meter" id="hud-fever">' +
          '<div class="fv-label">' + ((global.UiIcons && global.UiIcons.tag('fever', 'fv-ic-img')) || '🔥') + ' <span>' + T('fever') + '</span> ×3</div>' +
          '<div class="fv-track"><div class="fv-fill" id="hud-fever-fill"></div></div>' +
        '</div>';
      s.appendChild(hud);

      const drBars = document.createElement('div');
      drBars.className = 'dragon-bars';
      s.appendChild(drBars);

      const boBar = document.createElement('div');
      boBar.className = 'booster-bar';
      s.appendChild(boBar);

      const synBtn = document.createElement('button');
      synBtn.className = 'synergy-btn hidden';
      synBtn.innerHTML = '<span class="syn-lbl">⚡ ' + T('synergy') + '</span><span class="syn-bar"><span class="syn-fill"></span></span>';
      const selfG = this;
      synBtn.addEventListener('click', function (ev) { ev.stopPropagation(); selfG.useSynergy(); });
      s.appendChild(synBtn);
      this.synBtn = synBtn;

      this.hud = {
        score: hud.querySelector('#hud-score'),
        moves: hud.querySelector('#hud-moves'),
        movesLabel: hud.querySelector('#hud-moves-label'),
        objLabel: hud.querySelector('#hud-obj-label'),
        objVal: hud.querySelector('#hud-obj-val'),
        objBar: hud.querySelector('#hud-obj-bar'),
        fever: hud.querySelector('#hud-fever'),
        feverFill: hud.querySelector('#hud-fever-fill'),
        dragonBars: drBars,
        boosterBar: boBar
      };
      // booster-use callbacks from the engine
      this.engine.cb.onShuffle = function () { global.UI.toast(T('shuffled')); };
      this.engine.cb.onMerge = function () { global.UI.toast('🔮 ' + T('merge_toast')); self.tip('merge', 200); };
      this.engine.cb.onHammerUsed = function () {
        const pr = global.Save.get();
        pr.boosters.hammer = Math.max(0, (pr.boosters.hammer || 0) - 1);
        global.Save.save(); self.renderBoosters();
      };
      this.renderDragonBars(this.engine.dragons);
      this.renderBoosters();
      this.engine.emitObjective();
    },

    renderBoosters: function () {
      if (!this.hud) return;
      const wrap = this.hud.boosterBar;
      const p = global.Save.get();
      const self = this;
      const bIc = function (id, emoji) { const t = global.UiIcons && global.UiIcons.tag(id, 'bo-ic'); return t || ('<span class="bo-ic">' + emoji + '</span>'); };
      const defs = [
        { key: 'hammer', ic: bIc('hammer', '🔨'), name: T('b_hammer') },
        { key: 'shuffle', ic: bIc('shuffle', '🔀'), name: T('b_mix') },
        { key: 'moves', ic: bIc('moves', '➕5'), name: T('b_moves') }
      ];
      wrap.innerHTML = '';
      defs.forEach(function (b) {
        const n = p.boosters[b.key] || 0;
        const armed = self.engine && self.engine.hammerArmed && b.key === 'hammer';
        const cell = document.createElement('button');
        cell.className = 'booster' + (armed ? ' armed' : '') + (n <= 0 ? ' empty' : '');
        cell.innerHTML = b.ic + '<span class="bo-n">' + n + '</span>';
        cell.addEventListener('click', function (ev) { ev.stopPropagation(); global.Audio2.play('click'); self.useBooster(b.key); });
        wrap.appendChild(cell);
      });
    },

    useBooster: function (key) {
      const p = global.Save.get();
      const eng = this.engine;
      if (!eng || eng.finished) return;
      if ((p.boosters[key] || 0) <= 0) {
        global.UI.toast(T('no_booster'));
        return;
      }
      if (key === 'hammer') {
        const armed = !eng.hammerArmed;
        eng.armHammer(armed);
        global.UI.toast(armed ? T('hammer_hint') : T('hammer_cancel'));
        this.renderBoosters();
        return; // count consumed when actually used (onHammerUsed)
      }
      if (eng.state !== 'idle') { global.UI.toast(T('wait')); return; }
      let ok = false;
      if (key === 'shuffle') ok = eng.boosterShuffle();
      else if (key === 'moves') { ok = eng.boosterAddMoves(5); if (ok) global.UI.toast(T('plus5')); }
      if (ok) { p.boosters[key] = (p.boosters[key] || 0) - 1; global.Save.save(); global.Audio2.play('coin'); this.renderBoosters(); }
    },

    renderBossBar: function (hp, max, def) {
      let panel = this.gameScreen.querySelector('.boss-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'boss-panel';
        panel.innerHTML =
          '<div class="boss-emoji"></div>' +
          '<div class="boss-info"><div class="boss-name"></div>' +
          '<div class="bar boss-hp"><div class="bar-fill boss-hp-fill"></div></div></div>';
        // place just under the top bar
        const top = this.gameScreen.querySelector('.game-top');
        if (top && top.nextSibling) this.gameScreen.insertBefore(panel, top.nextSibling);
        else this.gameScreen.appendChild(panel);
      }
      const pct = Math.max(0, Math.round(hp / max * 100));
      panel.querySelector('.boss-emoji').innerHTML = global.UI.spriteGlyph(def && def.sprite, (def && def.emoji) || '👹', 'boss-sprite', def && def.color);
      panel.querySelector('.boss-name').textContent = (def && def.name) || 'Бос';
      const fill = panel.querySelector('.boss-hp-fill');
      fill.style.width = pct + '%';
      fill.style.background = (def && def.color) || '#ff5d6c';
      if (this.engine && this.engine.bossHitFlash > 0.2) { panel.classList.remove('hit'); void panel.offsetWidth; panel.classList.add('hit'); }
    },

    renderFever: function (active, ratio) {
      if (!this.hud || !this.hud.fever) return;
      const fv = this.hud.fever, fill = this.hud.feverFill;
      if (active) {
        fv.classList.add('active');
        if (fill) fill.style.width = Math.max(0, Math.round((ratio || 0) * 100)) + '%';
        if (!fv._on) {
          fv._on = true;
          if (this.gameScreen) this.gameScreen.classList.add('fever-mode');
          global.UI.toast('🔥 ' + T('fever_on'));
          global.Audio2.play('win');
          try { navigator.vibrate && navigator.vibrate([15, 30, 15, 30, 40]); } catch (e) {}
        }
      } else {
        if (fv._on) { fv._on = false; if (this.gameScreen) this.gameScreen.classList.remove('fever-mode'); }
        fv.classList.remove('active');
        if (fill) fill.style.width = Math.round((ratio || 0) * 100) + '%';
      }
    },

    renderDragonBars: function (dragons) {
      if (!this.hud) return;
      const wrap = this.hud.dragonBars;
      wrap.innerHTML = '';
      const p = global.Save.get();
      const self = this;
      dragons.forEach(function (d) {
        const pct = Math.min(100, Math.round(d.charge / d.need * 100));
        const sc = D.SKIN_COLORS[p.activeSkins[d.id]] || d.def;
        const cell = document.createElement('div');
        cell.className = 'dragon-bar' + (d.flashing > 0 ? ' flash' : '') + (d.ready ? ' ready' : '');
        cell.innerHTML =
          '<div class="db-emoji">' + global.UI.dragonGlyph(d.def, 'db-sprite', sc.glow || d.def.glow) + '</div>' +
          (d.ready
            ? '<div class="db-ready">' + T('dragon_ready') + '</div>'
            : '<div class="db-track"><div class="db-fill" style="width:' + pct + '%;background:' + (sc.color || d.def.color) + '"></div></div>');
        if (d.ready) cell.addEventListener('click', function (ev) { ev.stopPropagation(); self.castDragon(d); });
        wrap.appendChild(cell);
      });
      if (dragons.some(function (d) { return d.ready; })) this.tip('dragon', 200);
      // synergy button: appears when 2+ dragons ready; charges via the synergy meter
      if (this.synBtn) {
        const eng = this.engine;
        const ready = dragons.filter(function (d) { return d.ready; }).length;
        if (ready >= 2 && eng) {
          this.synBtn.classList.remove('hidden');
          const pct = Math.min(100, Math.round(eng.synergyCharge / eng.synergyNeed * 100));
          const fill = this.synBtn.querySelector('.syn-fill'); if (fill) fill.style.width = pct + '%';
          const full = eng.synergyReady();
          this.synBtn.classList.toggle('full', full);
          if (full) this.tip('synergy', 200);
        } else this.synBtn.classList.add('hidden');
      }
    },

    useSynergy: function () {
      const eng = this.engine;
      if (!eng || eng.finished) return;
      if (!eng.synergyReady()) { global.UI.toast(T('synergy_charging')); return; }
      if (eng.castSynergy()) { this.synBtn.classList.add('hidden'); this.renderDragonBars(eng.dragons); }
    },

    castDragon: function (d) {
      const eng = this.engine;
      if (!eng || !d.ready || eng.state !== 'idle') return;
      global.Audio2.play('click');
      if (eng.abilityNeedsAim(d)) {
        eng.castAim = d;
        global.UI.toast(d.def.ability === 'row' ? T('aim_row') : T('aim_cell'));
      } else {
        eng.castReady(d, null);
        this.renderDragonBars(eng.dragons);
      }
    },

    showCombo: function (n) {
      let c = this.gameScreen.querySelector('.combo-pop');
      if (!c) { c = document.createElement('div'); c.className = 'combo-pop'; this.gameScreen.appendChild(c); }
      c.textContent = T('combo', { n: n });
      c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
    },

    confirmQuit: function () {
      const self = this;
      global.UI.modal(T('quit_q'), null, [
        { label: T('resume') },
        { label: T('quit'), primary: true, onClick: function () { self.go('map'); } }
      ]);
    },
    pause: function () {
      const self = this;
      global.UI.modal(T('pause'), null, [
        { label: T('to_map'), onClick: function () { self.go('map'); } },
        { label: T('resume'), primary: true }
      ]);
    },

    onWin: function (res) {
      const p = global.Save.get();
      const lvNum = this.currentLevel;
      const lv = D.LEVELS[lvNum - 1];
      const prevStars = p.stars[lvNum] || 0;
      const newStars = Math.max(prevStars, res.stars);
      if (newStars > prevStars) {
        global.Save.addStat('totalStars', newStars - prevStars);
      }
      p.stars[lvNum] = newStars;
      // rewards (full reward the first time the level is cleared, half on replay).
      // Keyed on "never earned a star here" so replaying the capped final level
      // can't farm full first-clear rewards indefinitely.
      const firstTime = prevStars === 0;
      const ev = D.activeEvent();
      let gold = firstTime ? lv.reward.gold : Math.floor(lv.reward.gold / 2);
      let energy = firstTime ? lv.reward.energy : Math.floor(lv.reward.energy / 2);
      if (ev.mult === 'gold') gold *= 2;
      if (ev.mult === 'energy') energy *= 2;
      // skill-tree gold bonus
      if (this.engine && this.engine.goldMult) gold = Math.round(gold * this.engine.goldMult);
      p.gold += gold; p.energy += energy;
      global.Save.addStat('levelsWon', firstTime ? 1 : 0);
      if (lvNum >= p.levelProgress) p.levelProgress = Math.min(D.LEVELS.length, lvNum + 1);
      // charge a random egg with energy
      if (p.eggs.length) {
        const egg = p.eggs[0];
        egg.charge = Math.min(egg.need, egg.charge + energy + 10);
      }
      global.UI.addPassXp(50 + res.stars * 20);
      // Win streak: every 3 in a row grants a bonus.
      p.streak.wins = (p.streak.wins || 0) + 1;
      p.streak.best = Math.max(p.streak.best || 0, p.streak.wins);
      let streakHtml = '';
      if (p.streak.wins % 3 === 0) {
        const sb = 50 + p.streak.wins * 20;
        p.gold += sb;
        global.Audio2.play('streak');
        streakHtml = '<div class="streak-line">' + T('streak_bonus', { n: p.streak.wins, r: sb + '🪙' }) + '</div>';
      }
      // Piggy bank: stash half of the gold earned, up to the cap.
      const before = p.piggy.coins;
      p.piggy.coins = Math.min(p.piggy.cap, p.piggy.coins + Math.round(gold * 0.5));
      const piggyHtml = (p.piggy.coins > before) ? '<div class="muted small">🐷 ' + T('piggy_info', { n: p.piggy.coins, cap: p.piggy.cap }) + '</div>' : '';
      global.Save.save();
      this.checkUnlocks();

      const body = document.createElement('div');
      body.className = 'modal-body win-body';
      const badge = res.stars === 3 ? '<div class="win-badge perfect">🌟 ' + T('perfect') + '</div>'
        : (firstTime ? '<div class="win-badge">✨ ' + T('first_clear') + '</div>' : '');
      body.innerHTML =
        badge +
        '<div class="stars-row">' +
          ['s1','s2','s3'].map(function (id, i) {
            return '<span class="big-star ' + (i < res.stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.15) + 's">★</span>';
          }).join('') +
        '</div>' +
        '<div class="win-score">' + T('score', { n: res.score }) + '</div>' +
        '<div class="win-rewards">' + global.UI.rich(T('win_rewards', { gold: gold, energy: energy })) + '</div>' +
        global.UI.rich(streakHtml) + global.UI.rich(piggyHtml);
      const self = this;
      const btns = [
        { label: T('btn_map'), onClick: function () { self.go('map'); } },
        { label: T('btn_retry'), onClick: function () { self.startLevel(lvNum); } }
      ];
      if (lvNum < D.LEVELS.length) btns.push({ label: T('btn_next'), primary: true, onClick: function () { self.startLevel(lvNum + 1); } });
      else btns.push({ label: T('btn_island'), primary: true, onClick: function () { self.go('home'); } });
      // staggered star sounds
      for (let i = 0; i < res.stars; i++) (function (i) { setTimeout(function () { global.Audio2.play('star', i); }, 300 + i * 200); })(i);
      global.UI.modal(T('victory'), body, btns);
    },

    // Current objective progress {cur, goal, label} from live engine state.
    objectiveProgress: function () {
      const eng = this.engine, lv = this.currentLevelObj || {};
      if (!eng) return { cur: 0, goal: 1, label: '' };
      if (eng.isBoss) return { cur: eng.bossMax - eng.bossHP, goal: eng.bossMax, label: '❤ ' + T('boss') };
      if (lv.objective === D.OBJ.COLLECT) return { cur: eng.collected, goal: lv.target, label: D.CRYSTALS[lv.color].glyph };
      if (lv.objective === D.OBJ.JELLY) return { cur: lv.jellyCount - eng.jellyLeft, goal: lv.jellyCount, label: T('obj_jelly') };
      if (lv.objective === D.OBJ.ICE) return { cur: lv.iceCount - eng.iceLeft, goal: lv.iceCount, label: T('obj_ice') };
      return { cur: eng.score, goal: lv.target, label: T('obj_score') };
    },

    onLose: function (res) {
      const self = this;
      const lvNum = this.currentLevel;
      global.Save.spendLife(); // a failed attempt costs one heart
      global.Save.get().streak.wins = 0; global.Save.save(); // streak broken
      global.UI.refreshCurrencies();
      const li = global.Save.livesInfo();
      // How close were they? Show progress toward the objective — a near miss
      // encourages a retry far more than a bare "goal not met".
      const prog = this.objectiveProgress();
      const pct = prog.goal > 0 ? Math.min(100, Math.round(prog.cur / prog.goal * 100)) : 0;
      const short = Math.max(0, prog.goal - prog.cur);
      const soClose = pct >= 80;
      const barCol = soClose ? '#5fe39a' : (pct >= 50 ? '#ffd24d' : '#ff7a6a');
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">' + (soClose ? '😮' : '😢') + '</div>' +
        (soClose ? '<p class="so-close">' + T('so_close') + '</p>' : '<p>' + T('goal_not_met') + '</p>') +
        '<div class="lose-goal"><div class="lose-goal-top"><span>' + prog.label + '</span><span>' + prog.cur + ' / ' + prog.goal + '</span></div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + barCol + '"></div></div>' +
          (short > 0 ? '<div class="lose-short">' + T('short_by', { n: short }) + '</div>' : '') + '</div>' +
        '<p class="muted small">' + T('lives_left', { hearts: '❤'.repeat(li.count) }) + (li.count === 0 ? T('empty_suffix') : '') + '</p>' +
        '<p class="muted small">' + T('ad_hint_moves') + '</p>';
      global.UI.modal(T('defeat'), body, [
        { label: T('btn_map'), onClick: function () { self.go('map'); } },
        { label: T('ad_plus_moves'), onClick: function () {
            global.UI.watchAd();
            // grant extra moves and resume
            self.engine.movesLeft += 5; self.engine.finished = false; self.engine.state = 'idle';
            self.hud.moves.textContent = self.engine.movesLeft;
            setTimeout(function () { global.UI.closeModal(); }, 50);
          }},
        { label: T('btn_retry'), primary: true, onClick: function () { self.startLevel(lvNum); } }
      ]);
    },

    checkUnlocks: function () {
      const p = global.Save.get();
      // auto-claim nothing; just notify island unlocks
      D.ISLANDS.forEach(function (isl) {
        if (isl.unlockLevel > 0 && p.levelProgress === isl.unlockLevel + 1 && !p['_isleNotified_' + isl.id]) {
          p['_isleNotified_' + isl.id] = true; global.Save.save();
          setTimeout(function () { global.UI.toast(T('isle_unlocked', { name: isl.name })); }, 1500);
        }
      });
    },

    // ---- Canvas / input ---------------------------------------------------
    resize: function () {
      const rect = this.root.getBoundingClientRect();
      // Cap the backing-store DPR (2 normally, 1.5 in perf mode) so high-density
      // screens don't render 3x the pixels and tank the framerate.
      const dpr = Math.min(this.perfOn() ? 1.5 : 2, global.devicePixelRatio || 1);
      const w = rect.width, h = rect.height;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = w; this.viewH = h;
      this._bgCache = null; this._vigCache = null; // gradients are size-dependent
      if (this.engine) {
        // Fit the square board into the free zone between the HUD (top) and the
        // dragon/booster bars (bottom), then centre it. Works for every aspect
        // ratio — tall phones are width-limited, short/wide ones height-limited.
        const margin = Math.max(10, w * 0.04);
        const bossExtra = this.engine.isBoss ? 44 : 0;
        // Fold in device safe-area insets (notch / home indicator) so the board
        // clears the chrome on every phone.
        let sat = 0, sab = 0;
        try { const cs = getComputedStyle(document.documentElement); sat = parseFloat(cs.getPropertyValue('--sat')) || 0; sab = parseFloat(cs.getPropertyValue('--sab')) || 0; } catch (e) {}
        const topReserve = Math.max(176 + bossExtra + sat, h * 0.24);
        const bottomReserve = 150 + sab;                 // dragon bars + boosters
        const zoneH = Math.max(120, h - topReserve - bottomReserve);
        const size = Math.max(120, Math.min(w - margin * 2, zoneH));
        const left = Math.round((w - size) / 2);
        const top = Math.round(topReserve + Math.max(0, (zoneH - size) / 2));
        this.engine.setViewport(left, top, size);
      }
    },

    bindInput: function () {
      const self = this;
      const getPos = function (ev) {
        const rect = self.canvas.getBoundingClientRect();
        const t = ev.touches ? ev.touches[0] : ev;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      };
      this.canvas.addEventListener('pointerdown', function (ev) {
        if (!self.inLevel || !self.engine) return;
        const p = getPos(ev); self.engine.onDown(p.x, p.y);
      });
      this.canvas.addEventListener('pointermove', function (ev) {
        if (!self.inLevel || !self.engine) return;
        const p = getPos(ev); self.engine.onMove(p.x, p.y);
      });
      this.canvas.addEventListener('pointerup', function () {
        if (self.engine) self.engine.onUp();
      });
    },

    // ---- Loop -------------------------------------------------------------
    loop: function (ts) {
      const dt = Math.min(0.05, (ts - this.last) / 1000) || 0;
      this.last = ts;
      const g = this.ctx;
      if (this.inLevel && this.engine) {
        g.clearRect(0, 0, this.viewW, this.viewH);
        const lv = this.currentLevelObj || D.LEVELS[0];
        const isl = D.ISLANDS[lv.island] || D.ISLANDS[0];
        this.drawBackground(g, isl, dt);
        this.engine.update(dt);
        this.engine.draw(g);
        this.drawVignette(g);
        // Adaptive quality: if we run slow for a sustained window on a real
        // device, permanently drop to the lightweight render path this session.
        if (!this._perfLocked && dt > 0) {
          this._ftSum += dt; this._ftCount++;
          if (this._ftCount >= 120) {
            const avg = this._ftSum / this._ftCount; // seconds/frame
            if (avg > 0.026 && !global.__perf) { global.__perf = true; this.resize(); } // < ~38fps → simplify
            this._perfLocked = global.__perf; // lock once downgraded (avoid oscillation)
            this._ftSum = 0; this._ftCount = 0;
          }
        }
      } else {
        // On menus the canvas is idle — clear once, then let DOM/CSS drive visuals.
        if (!this._cleared) { g.clearRect(0, 0, this.viewW, this.viewH); this._cleared = true; }
      }
      if (this.inLevel) this._cleared = false;
      requestAnimationFrame(this._loop);
    },

    perfOn: function () { return global.Save.get().settings.perf || global.__perf; },

    drawBackground: function (g, isl, dt) {
      const W = this.viewW, H = this.viewH;
      // Cache the gradients — they only change when the size or island changes,
      // so we avoid rebuilding two gradient objects every single frame.
      const key = W + 'x' + H + '|' + isl.bg1 + isl.bg2 + isl.theme;
      if (!this._bgCache || this._bgCache.key !== key) {
        const grd = g.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, isl.bg1); grd.addColorStop(1, isl.bg2);
        const glow = g.createRadialGradient(W / 2, H * 0.12, 10, W / 2, H * 0.12, H * 0.6);
        glow.addColorStop(0, this.hexA(isl.theme, 0.22)); glow.addColorStop(1, this.hexA(isl.theme, 0));
        this._bgCache = { key: key, grd: grd, glow: glow };
      }
      g.fillStyle = this._bgCache.grd; g.fillRect(0, 0, W, H);
      if (this.perfOn()) return; // skip heavy effects on low-end devices
      // god-ray glow at the top (cached)
      g.fillStyle = this._bgCache.glow; g.fillRect(0, 0, W, H);
      // drifting bokeh
      if (!this.bokeh) {
        this.bokeh = [];
        for (let i = 0; i < 18; i++) this.bokeh.push({ x: Math.random() * W, y: Math.random() * H, r: 6 + Math.random() * 22, sp: 8 + Math.random() * 22, a: 0.04 + Math.random() * 0.08 });
      }
      for (let i = 0; i < this.bokeh.length; i++) {
        const b = this.bokeh[i];
        b.y -= b.sp * dt; if (b.y < -30) { b.y = H + 30; b.x = Math.random() * W; }
        g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.fillStyle = this.hexA(isl.theme, b.a); g.fill();
      }
    },

    drawVignette: function (g) {
      if (this.perfOn()) return;
      const W = this.viewW, H = this.viewH;
      const key = W + 'x' + H;
      if (!this._vigCache || this._vigCache.key !== key) {
        const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
        this._vigCache = { key: key, grad: v };
      }
      g.fillStyle = this._vigCache.grad; g.fillRect(0, 0, W, H);
    },

    hexA: function (hex, a) {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16), gg = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
      return 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')';
    }
  };

  global.Game = Game;
  document.addEventListener('DOMContentLoaded', function () { Game.boot(); });
})(window);
