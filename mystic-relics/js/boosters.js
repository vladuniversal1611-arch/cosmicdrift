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
      UI.toast(I18N.t('b_out'));
      UI.openShop('boosters');
      return false;
    }

    let ok = false;
    switch (id) {
      case 'shuffle': Board.reshuffle(); ok = true; break;
      case 'hint':    ok = Board.showHint(); if (!ok) UI.toast(I18N.t('b_no_triple')); break;
      case 'magnet':  ok = Board.magnet(); if (!ok) UI.toast(I18N.t('b_no_magnet')); break;
      case 'hammer':
        Board.hammerMode = true;
        UI.setHammerCursor(true);
        UI.toast(I18N.t('b_hammer_hint'));
        ok = true;
        break;
      case 'freeze':  Game.freezeLeft = 30; Audio2.play('freeze'); UI.toast(I18N.t('b_freeze')); ok = true; break;
      case 'double':  Game.doubleLeft = 30; Audio2.play('booster'); UI.toast(I18N.t('b_double')); ok = true; break;
      case 'wand':    ok = Board.wand(); if (!ok) UI.toast(I18N.t('b_no_wand')); break;
      case 'bomb':    ok = Board.bomb(); if (!ok) UI.toast(I18N.t('b_no_bomb')); break;
      case 'rainbow': ok = Board.addRainbow(); if (!ok) UI.toast(I18N.t('b_tray_full')); break;
      case 'undo':    ok = Board.undo(); if (!ok) UI.toast(I18N.t('b_no_undo')); break;
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
    if (d.coins < b.cost) { UI.toast(I18N.t('not_enough_coins')); return false; }
    Storage.addCoins(-b.cost);
    d.boosters[id] = (d.boosters[id] || 0) + 1;
    Storage.save();
    Audio2.play('coin');
    UI.toast(b.g + ' ' + I18N.t('plus_one', { name: I18N.booster(id).name }));
    return true;
  }
};
