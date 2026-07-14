/* ============================================================
 * Mystic Relics — game.js
 * Життєвий цикл рівня: таймер, очки, комбо, перемога/поразка,
 * нагороди, головний цикл requestAnimationFrame (60 FPS).
 * ============================================================ */
'use strict';

const Game = {
  state: 'menu',          // menu | playing | paused | won | lost
  levelNum: 1,
  levelCfg: null,
  score: 0,
  combo: 1,
  comboTimer: 0,
  timeLeft: 0,
  freezeLeft: 0,
  doubleLeft: 0,
  boostersUsedThisLevel: 0,
  _last: 0,
  _rafStarted: false,

  startLevel(n) {
    this.levelNum = n;
    this.levelCfg = Generator.generate(n);
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.timeLeft = this.levelCfg.timeLimit;
    this.freezeLeft = 0;
    this.doubleLeft = 0;
    this.boostersUsedThisLevel = 0;
    Board.setup(this.levelCfg);
    this.state = 'playing';
    UI.showScreen('game');
    UI.updateHUD();
    this.startLoop();
  },

  startLoop() {
    if (this._rafStarted) return;
    this._rafStarted = true;
    this._last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this.update(dt);
      if (document.getElementById('gameScreen').classList.contains('active')) Board.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },

  update(dt) {
    if (this.state !== 'playing') { Particles.update(dt); return; }

    // Таймер (заморозка зупиняє)
    if (this.freezeLeft > 0) this.freezeLeft -= dt;
    else {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.onLose('time'); }
    }
    if (this.doubleLeft > 0) this.doubleLeft -= dt;

    // Комбо згасає
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) this.combo = 1;
    }

    Board.update(dt);
    UI.updateHUD();
  },

  addScore(n) {
    this.score = Math.max(0, this.score + n);
    UI.updateHUD();
  },

  /** Викликається з Board після кожної зібраної трійки. */
  onMatch(type, silent) {
    // Комбо-множник
    if (this.comboTimer > 0) this.combo = Math.min(this.combo + 1, 8);
    this.comboTimer = CFG.COMBO_WINDOW;

    let pts = 100 * this.combo;
    if (this.doubleLeft > 0) pts *= 2;
    this.addScore(pts);

    if (!silent) Audio2.play('match', this.combo);
    if (this.combo >= 3) {
      UI.comboPopup(this.combo);
      Storage.data.stats.combos++;
      Missions.progress('combo', 1);
    }
    // Колекція: відкриваємо іконку
    if (type >= 0 && !Storage.data.collection.includes(type)) {
      Storage.data.collection.push(type);
      UI.toast(`🎴 Нова плитка в колекції: ${CFG.TILES[type].g} ${CFG.TILES[type].name}`);
    }
    Storage.data.stats.matches++;
    Missions.progress('matches', 1);
    Storage.save();
  },

  onWin() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    Audio2.play('win');
    Utils.vibrate([40, 60, 40, 60, 80]);

    // Зірки за залишок часу
    const ratio = this.timeLeft / this.levelCfg.timeLimit;
    const stars = ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
    const timeBonus = Math.round(this.timeLeft * 5);
    this.addScore(timeBonus);

    const d = Storage.data;
    const firstClear = !(d.stars[this.levelNum] > 0);
    const prevStars = d.stars[this.levelNum] || 0;
    d.stars[this.levelNum] = Math.max(prevStars, stars);

    // Нагороди
    const coins = 50 + this.levelCfg.tier * 10 + stars * 25;
    const gems = stars === 3 && firstClear ? 1 : 0;
    const xp = 40 + this.levelCfg.tier * 8;
    Storage.addCoins(coins);
    if (gems) Storage.addGems(gems);
    Storage.addXP(xp);

    if (firstClear) {
      d.stats.levelsCompleted++;
      if (stars === 3) d.stats.perfectLevels++;
      // Скрині за прогрес
      if (this.levelNum % 100 === 0) d.chests.legendary++;
      else if (this.levelNum % 25 === 0) d.chests.gold++;
      else if (this.levelNum % 10 === 0) d.chests.silver++;
      else if (this.levelNum % 3 === 0) d.chests.wood++;
    }
    d.stats.totalStars = Object.values(d.stars).reduce((a, b) => a + b, 0);
    if (this.levelNum >= d.level && this.levelNum < CFG.TOTAL_LEVELS) d.level = this.levelNum + 1;

    Missions.progress('levels', 1);
    Missions.progress('stars', stars);
    Achievements.check();
    Storage.save();

    Ads.maybeInterstitial();
    setTimeout(() => UI.showWin(stars, this.score, coins, gems, xp), 700);
  },

  /** Панель переповнена. */
  onTrayFull() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    UI.showRevive();
  },

  /** Порятунок: за кристали прибираємо 3 плитки з панелі назад на поле. */
  revive() {
    if (Storage.data.gems < 5) { UI.toast('Не вистачає кристалів 💜'); return false; }
    Storage.addGems(-5);
    Board.reviveClear(3);
    this.state = 'playing';
    return true;
  },

  /** Порятунок за рекламу (rewarded video). */
  reviveByAd() {
    Ads.showRewarded(() => {
      Board.reviveClear(3);
      this.state = 'playing';
      UI.closeModal();
    });
  },

  onLose(reason) {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this.state = 'lost';
    this._loseReason = reason;
    Audio2.play('lose');
    Utils.vibrate(150);
    setTimeout(() => UI.showLose(reason), 500);
  },

  /** Другий шанс після поразки: повертає плитки/час і перемішує поле. */
  secondChance() {
    if (this.state !== 'lost') return;
    if (this._loseReason === 'time') this.timeLeft = 45;
    else Board.reviveClear(3);
    Board.reshuffle();
    this.state = 'playing';
    this._last = performance.now();
    UI.toast('✨ Другий шанс — вперед!');
  },

  pause() { if (this.state === 'playing') { this.state = 'paused'; UI.showPause(); } },
  resume() { if (this.state === 'paused') { this.state = 'playing'; this._last = performance.now(); } },

  quitToMenu() {
    this.state = 'menu';
    UI.showScreen('main');
  }
};
