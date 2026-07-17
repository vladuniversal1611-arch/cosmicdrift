/* ============================================================
 * Mystic Relics — storage.js
 * Автоматичне збереження прогресу у LocalStorage.
 * ============================================================ */
'use strict';

const Storage = {
  KEY: 'mystic_relics_save_v1',
  data: null,
  _t: null,

  /** Структура збереження за замовчуванням. */
  defaults() {
    return {
      coins: 200,
      gems: 10,
      xp: 0,
      profileLevel: 1,
      profileName: '',              // порожнє = локалізоване ім'я за замовчуванням
      avatar: '🧙',
      level: 1,                       // поточний доступний рівень
      stars: {},                      // { levelNum: 0..3 }
      boosters: { shuffle: 3, hint: 3, magnet: 2, hammer: 2, freeze: 2, double: 2, wand: 1, bomb: 1, rainbow: 1, undo: 3 },
      themes: ['forest'],             // куплені/знайдені теми
      theme: 'forest',
      collection: [],                 // індекси відкритих плиток
      collectionCount: {},            // { type: зібрано трійок } — прогрес до відкриття
      collectionClaimed: [],          // отримані віхи колекції (n)
      chests: { wood: 0, silver: 0, gold: 0, legendary: 0 },
      adChestProgress: { wood: 0, silver: 0, gold: 0 },   // перегляди реклами до отримання скрині
      premium: false,
      tutorialDone: false,
      settings: { music: true, sound: true, vibration: true, quality: 'high', lang: 'en' },
      daily: { lastClaim: '', streak: 0, lastSpin: '', missionsDate: '', missions: [], loginDays: 0, challengeDone: '', adDate: '', adCoins: 0, adGems: 0 },
      stats: {                        // статистика для досягнень
        levelsCompleted: 0, totalStars: 0, matches: 0, combos: 0,
        coinsEarned: 0, boostersUsed: 0, chestsOpened: 0, perfectLevels: 0, spins: 0
      },
      achievementsClaimed: []
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const def = this.defaults();
      this.data = raw ? Object.assign(def, JSON.parse(raw)) : def;
      // Глибоке злиття вкладених об'єктів після оновлень гри
      const d2 = this.defaults();
      for (const k of ['boosters', 'settings', 'daily', 'stats', 'chests', 'collectionCount', 'adChestProgress']) {
        this.data[k] = Object.assign(d2[k], this.data[k]);
      }
    } catch (e) {
      console.warn('Save corrupted, resetting', e);
      this.data = this.defaults();
    }
    return this.data;
  },

  /** Відкладене збереження — не більше одного запису на 300 мс. */
  save() {
    clearTimeout(this._t);
    this._t = setTimeout(() => {
      try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); }
      catch (e) { console.warn('Save failed', e); }
    }, 300);
  },

  /** Негайне збереження (перед закриттям сторінки). */
  flush() {
    clearTimeout(this._t);
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },

  /* ---- Резервна копія прогресу ---- */

  /** Експорт прогресу як компактний код (префікс MR1 + base64 JSON). */
  exportCode() {
    this.flush();
    return 'MR1.' + btoa(unescape(encodeURIComponent(JSON.stringify(this.data))));
  },

  /** Імпорт коду прогресу. Повертає true при успіху. */
  importCode(code) {
    try {
      code = (code || '').trim();
      if (!code.startsWith('MR1.')) return false;
      const obj = JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
      // Санітарна перевірка ключових полів
      if (typeof obj.coins !== 'number' || typeof obj.level !== 'number' || !obj.settings) return false;
      const def = this.defaults();
      this.data = Object.assign(def, obj);
      const d2 = this.defaults();
      for (const k of ['boosters', 'settings', 'daily', 'stats', 'chests', 'collectionCount', 'adChestProgress']) {
        this.data[k] = Object.assign(d2[k], this.data[k] || {});
      }
      this.flush();
      return true;
    } catch (e) { return false; }
  },

  addCoins(n) {
    this.data.coins += n;
    if (n > 0) { this.data.stats.coinsEarned += n; Missions.progress('coins', n); }
    this.save(); UI.updateCurrency();
  },

  addGems(n) { this.data.gems += n; this.save(); UI.updateCurrency(); },

  addXP(n) {
    const d = this.data;
    d.xp += n;
    while (d.xp >= CFG.xpForLevel(d.profileLevel)) {
      d.xp -= CFG.xpForLevel(d.profileLevel);
      d.profileLevel++;
      UI.toast(I18N.t('profile_level_up', { n: d.profileLevel }));
      Audio2.play('levelup');
    }
    this.save();
  }
};

window.addEventListener('beforeunload', () => Storage.flush());
document.addEventListener('visibilitychange', () => { if (document.hidden) Storage.flush(); });
