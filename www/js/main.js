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
      global.addEventListener('resize', this.resize.bind(this));

      // Resume audio on first interaction.
      const kick = function () { global.Audio2.resume(); global.Audio2.startMusic(); document.removeEventListener('pointerdown', kick); };
      document.addEventListener('pointerdown', kick);

      // Welcome
      const p = global.Save.get();
      this.go('home');
      if (p.firstRun) {
        p.firstRun = false; global.Save.save();
        global.UI.modal(T('welcome_title'), this.welcomeBody(), [
          { label: T('start_adventure'), primary: true }
        ]);
      }
      requestAnimationFrame(this.loop.bind(this));
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
      if (id === 'home') global.UI.renderHome();
      else if (id === 'map') global.UI.renderMap();
      else if (id === 'collection') global.UI.renderCollection();
      else if (id === 'shop') global.UI.renderShop();
      else if (id === 'pass') global.UI.renderPass();
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
      const lv = D.LEVELS[lvNum - 1];
      this.currentLevel = lvNum;
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
      global.Audio2.startMusic();
      this.tutorialActive = false; this._tutScored = false;
      if (lvNum === 1 && !p.tutorialDone) this.startTutorial();
      else this.showLevelIntro(lv);
    },

    levelName: function (lv) { return lv.boss ? ('👑 ' + lv.name) : T('level_n', { n: lv.n }); },
    objectiveText: function (lv) {
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
        '<div class="li-goal">' + T('level_intro_goal', { text: this.objectiveText(lv) }) + '</div></div>';
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
      const oldTut = s.querySelector('.tutorial-layer'); if (oldTut) oldTut.remove();
      const oldBoss = s.querySelector('.boss-panel'); if (oldBoss) oldBoss.remove();
      const oldIntro = s.querySelector('.level-intro'); if (oldIntro) oldIntro.remove();

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
          '<div class="hud-pill"><div class="hp-l">' + T('b_moves') + '</div><div class="hp-v" id="hud-moves">' + lv.moves + '</div></div>' +
        '</div>' +
        '<div class="hud-obj">' +
          '<div class="obj-top"><span id="hud-obj-label">—</span><span id="hud-obj-val">0 / 0</span></div>' +
          '<div class="bar"><div class="bar-fill" id="hud-obj-bar" style="background:#ffd24d"></div></div>' +
        '</div>';
      s.appendChild(hud);

      const drBars = document.createElement('div');
      drBars.className = 'dragon-bars';
      s.appendChild(drBars);

      const boBar = document.createElement('div');
      boBar.className = 'booster-bar';
      s.appendChild(boBar);

      this.hud = {
        score: hud.querySelector('#hud-score'),
        moves: hud.querySelector('#hud-moves'),
        objLabel: hud.querySelector('#hud-obj-label'),
        objVal: hud.querySelector('#hud-obj-val'),
        objBar: hud.querySelector('#hud-obj-bar'),
        dragonBars: drBars,
        boosterBar: boBar
      };
      // booster-use callbacks from the engine
      this.engine.cb.onShuffle = function () { global.UI.toast(T('shuffled')); };
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
      const defs = [
        { key: 'hammer', ic: '🔨', name: T('b_hammer') },
        { key: 'shuffle', ic: '🔀', name: T('b_mix') },
        { key: 'moves', ic: '➕5', name: T('b_moves') }
      ];
      wrap.innerHTML = '';
      defs.forEach(function (b) {
        const n = p.boosters[b.key] || 0;
        const armed = self.engine && self.engine.hammerArmed && b.key === 'hammer';
        const cell = document.createElement('button');
        cell.className = 'booster' + (armed ? ' armed' : '') + (n <= 0 ? ' empty' : '');
        cell.innerHTML = '<span class="bo-ic">' + b.ic + '</span><span class="bo-n">' + n + '</span>';
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
      panel.querySelector('.boss-emoji').textContent = (def && def.emoji) || '👹';
      panel.querySelector('.boss-name').textContent = (def && def.name) || 'Бос';
      const fill = panel.querySelector('.boss-hp-fill');
      fill.style.width = pct + '%';
      fill.style.background = (def && def.color) || '#ff5d6c';
      if (this.engine && this.engine.bossHitFlash > 0.2) { panel.classList.remove('hit'); void panel.offsetWidth; panel.classList.add('hit'); }
    },

    renderDragonBars: function (dragons) {
      if (!this.hud) return;
      const wrap = this.hud.dragonBars;
      wrap.innerHTML = '';
      const p = global.Save.get();
      dragons.forEach(function (d) {
        const pct = Math.min(100, Math.round(d.charge / d.need * 100));
        const sc = D.SKIN_COLORS[p.activeSkins[d.id]] || d.def;
        const cell = document.createElement('div');
        cell.className = 'dragon-bar' + (d.flashing > 0 ? ' flash' : '');
        cell.innerHTML =
          '<div class="db-emoji" style="filter:drop-shadow(0 0 8px ' + (sc.glow || d.def.glow) + ')">' + d.def.emoji + '</div>' +
          '<div class="db-track"><div class="db-fill" style="width:' + pct + '%;background:' + (sc.color || d.def.color) + '"></div></div>';
        wrap.appendChild(cell);
      });
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
      // rewards (full reward first time, half on replay)
      const firstTime = lvNum >= p.levelProgress;
      const gold = firstTime ? lv.reward.gold : Math.floor(lv.reward.gold / 2);
      const energy = firstTime ? lv.reward.energy : Math.floor(lv.reward.energy / 2);
      p.gold += gold; p.energy += energy;
      global.Save.addStat('levelsWon', firstTime ? 1 : 0);
      if (lvNum >= p.levelProgress) p.levelProgress = Math.min(D.LEVELS.length, lvNum + 1);
      // charge a random egg with energy
      if (p.eggs.length) {
        const egg = p.eggs[0];
        egg.charge = Math.min(egg.need, egg.charge + energy + 10);
      }
      global.UI.addPassXp(50 + res.stars * 20);
      global.Save.save();
      this.checkUnlocks();

      const body = document.createElement('div');
      body.className = 'modal-body win-body';
      body.innerHTML =
        '<div class="stars-row">' +
          ['s1','s2','s3'].map(function (id, i) {
            return '<span class="big-star ' + (i < res.stars ? 'on' : '') + '" style="animation-delay:' + (i * 0.15) + 's">★</span>';
          }).join('') +
        '</div>' +
        '<div class="win-score">' + T('score', { n: res.score }) + '</div>' +
        '<div class="win-rewards">' + T('win_rewards', { gold: gold, energy: energy }) + '</div>';
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

    onLose: function (res) {
      const self = this;
      const lvNum = this.currentLevel;
      global.Save.spendLife(); // a failed attempt costs one heart
      global.UI.refreshCurrencies();
      const li = global.Save.livesInfo();
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerHTML = '<div class="big-emoji">😢</div><p>' + T('goal_not_met') + '</p><div class="win-score">' + T('score', { n: res.score }) + '</div>' +
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
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      const w = rect.width, h = rect.height;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = w; this.viewH = h;
      if (this.engine) {
        const margin = w * 0.04;
        const size = w - margin * 2;
        const top = h * 0.30; // leave room for HUD
        this.engine.setViewport(margin, top, size);
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
      g.clearRect(0, 0, this.viewW, this.viewH);
      if (this.inLevel && this.engine) {
        // animated gradient backdrop for the board area
        const lv = D.LEVELS[this.currentLevel - 1];
        const isl = D.ISLANDS[lv.island];
        const grd = g.createLinearGradient(0, 0, 0, this.viewH);
        grd.addColorStop(0, isl.bg1); grd.addColorStop(1, isl.bg2);
        g.fillStyle = grd; g.fillRect(0, 0, this.viewW, this.viewH);
        this.engine.update(dt);
        this.engine.draw(g);
      }
      requestAnimationFrame(this.loop.bind(this));
    }
  };

  global.Game = Game;
  document.addEventListener('DOMContentLoaded', function () { Game.boot(); });
})(window);
