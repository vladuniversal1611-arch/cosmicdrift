/* ============================================================
 * Mystic Relics — boosters.js
 * Активація бустерів під час гри. Кількість зберігається
 * у Storage.data.boosters; купівля — у магазині.
 * ============================================================ */
'use strict';

const Boosters = {

  /** Спроба використати бустер. Повертає true, якщо спрацював. */
  use(id) {
    if (Game.state !== 'playing') return false;
    const d = Storage.data;
    if ((d.boosters[id] || 0) <= 0) {
      UI.toast('Бустер закінчився — придбайте у магазині 🛒');
      UI.openShop('boosters');
      return false;
    }

    let ok = false;
    switch (id) {
      case 'shuffle': Board.reshuffle(); ok = true; break;
      case 'hint':    ok = Board.showHint(); if (!ok) UI.toast('Немає доступної трійки — спробуйте перемішати'); break;
      case 'magnet':  ok = Board.magnet(); if (!ok) UI.toast('Магніту нічого притягнути'); break;
      case 'hammer':
        Board.hammerMode = true;
        UI.setHammerCursor(true);
        UI.toast('🔨 Торкніться плитки, щоб знищити її трійку');
        ok = true;
        break;
      case 'freeze':  Game.freezeLeft = 30; Audio2.play('freeze'); UI.toast('🧊 Час зупинено на 30 с'); ok = true; break;
      case 'double':  Game.doubleLeft = 30; Audio2.play('booster'); UI.toast('✨ Подвійні очки на 30 с'); ok = true; break;
      case 'wand':    ok = Board.wand(); if (!ok) UI.toast('Паличці нічого зібрати'); break;
      case 'bomb':    ok = Board.bomb(); if (!ok) UI.toast('Бомбі нічого підривати'); break;
      case 'rainbow': ok = Board.addRainbow(); if (!ok) UI.toast('Панель переповнена'); break;
      case 'undo':    ok = Board.undo(); if (!ok) UI.toast('Немає ходу для відміни'); break;
    }

    if (ok) {
      d.boosters[id]--;
      d.stats.boostersUsed++;
      Game.boostersUsedThisLevel++;
      Missions.progress('boosters', 1);
      if (id !== 'freeze' && id !== 'hammer') Audio2.play('booster');
      Storage.save();
      UI.updateBoosterBar();
      Achievements.check();
    }
    return ok;
  },

  /** Купівля бустера за монети. */
  buy(id) {
    const b = CFG.BOOSTERS[id];
    const d = Storage.data;
    if (d.coins < b.cost) { UI.toast('Не вистачає монет 🪙'); return false; }
    Storage.addCoins(-b.cost);
    d.boosters[id] = (d.boosters[id] || 0) + 1;
    Storage.save();
    Audio2.play('coin');
    UI.toast(`${b.g} ${b.name} +1`);
    return true;
  }
};
