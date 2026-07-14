/* ============================================================
 * Mystic Relics — achievements.js
 * 100 досягнень, згенерованих з шаблонів прогресії.
 * Кожне має нагороду монетами; отримання — вручну на екрані.
 * ============================================================ */
'use strict';

const Achievements = {
  list: [],

  build() {
    const L = [];
    const add = (id, g, name, stat, goal, reward) => L.push({ id, g, name, stat, goal, reward });

    [1, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500].forEach((n, i) =>
      add(`lvl_${n}`, '🗺️', `Пройти ${n} рівнів`, 'levelsCompleted', n, 50 + i * 30));

    [3, 15, 30, 60, 100, 200, 300, 500, 750, 1000, 1250, 1500].forEach((n, i) =>
      add(`star_${n}`, '⭐', `Здобути ${n} зірок`, 'totalStars', n, 40 + i * 35));

    [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000].forEach((n, i) =>
      add(`match_${n}`, '🧩', `Зібрати ${n} трійок`, 'matches', n, 30 + i * 40));

    [1, 10, 25, 50, 100, 250, 500, 1000].forEach((n, i) =>
      add(`combo_${n}`, '🔥', `Зробити ${n} комбо x3+`, 'combos', n, 50 + i * 45));

    [100, 500, 1000, 5000, 10000, 25000, 50000, 100000].forEach((n, i) =>
      add(`coin_${n}`, '🪙', `Заробити ${Utils.fmt(n)} монет`, 'coinsEarned', n, 40 + i * 50));

    [1, 10, 25, 50, 100, 250, 500].forEach((n, i) =>
      add(`boost_${n}`, '⚡', `Використати ${n} бустерів`, 'boostersUsed', n, 35 + i * 40));

    [1, 5, 10, 25, 50, 100].forEach((n, i) =>
      add(`chest_${n}`, '🎁', `Відкрити ${n} скринь`, 'chestsOpened', n, 60 + i * 50));

    [10, 20, 30, 40, 50, 60, 72].forEach((n, i) =>
      add(`coll_${n}`, '🎴', `Знайти ${n} плиток колекції`, 'collection', n, 50 + i * 45));

    [1, 3, 7, 14, 30, 60, 100].forEach((n, i) =>
      add(`login_${n}`, '📅', `${n} днів у грі`, 'loginDays', n, 40 + i * 45));

    [1, 5, 15, 30, 50].forEach((n, i) =>
      add(`spin_${n}`, '🎡', `Крутнути колесо ${n} разів`, 'spins', n, 45 + i * 40));

    [1, 5, 15, 30, 60, 100].forEach((n, i) =>
      add(`perfect_${n}`, '🌟', `${n} рівнів на 3 зірки`, 'perfectLevels', n, 70 + i * 55));

    [2, 5, 10, 15, 20, 30, 40, 50].forEach((n, i) =>
      add(`profile_${n}`, '👑', `Рівень профілю ${n}`, 'profileLevel', n, 60 + i * 60));

    this.list = L;   // рівно 100 досягнень
  },

  /** Поточне значення метрики досягнення. */
  value(a) {
    const d = Storage.data;
    if (a.stat === 'collection') return d.collection.length;
    if (a.stat === 'loginDays') return d.daily.loginDays;
    if (a.stat === 'spins') return d.stats.spins;
    if (a.stat === 'profileLevel') return d.profileLevel;
    return d.stats[a.stat] || 0;
  },

  isDone(a) { return this.value(a) >= a.goal; },
  isClaimed(a) { return Storage.data.achievementsClaimed.includes(a.id); },

  claim(a) {
    if (!this.isDone(a) || this.isClaimed(a)) return false;
    Storage.data.achievementsClaimed.push(a.id);
    Storage.addCoins(a.reward);
    Audio2.play('coin');
    UI.toast(`🏆 ${a.name}: +${a.reward} 🪙`);
    Storage.save();
    return true;
  },

  /** Кількість готових до отримання (для бейджа у меню). */
  readyCount() { return this.list.filter(a => this.isDone(a) && !this.isClaimed(a)).length; },

  /** Виклик після значущих подій — показує тост про нові досягнення. */
  check() {
    const n = this.readyCount();
    UI.setBadge('achBadge', n);
  }
};
