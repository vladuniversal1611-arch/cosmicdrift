/* ============================================================
 * Mystic Relics — daily.js
 * Щоденні активності: 7-денний календар нагород, колесо
 * фортуни, щоденні місії (Missions).
 * ============================================================ */
'use strict';

const Daily = {

  /** Викликається при старті гри: зарахування дня входу. */
  onLogin() {
    const d = Storage.data.daily;
    const today = Utils.today();
    if (d.lastLogin !== today) {
      d.lastLogin = today;
      Storage.data.daily.loginDays++;
      Storage.save();
    }
    Missions.ensureToday();
  },

  canClaim() { return Storage.data.daily.lastClaim !== Utils.today(); },

  /** Поточний день календаря (0..6). */
  streakIndex() { return Storage.data.daily.streak % 7; },

  claim() {
    if (!this.canClaim()) return false;
    const d = Storage.data.daily;
    const idx = this.streakIndex();
    const reward = CFG.DAILY_CALENDAR[idx];
    this.giveReward(reward);
    d.lastClaim = Utils.today();
    d.streak++;
    Storage.save();
    Audio2.play('chest');
    return true;
  },

  giveReward(r) {
    if (r.coins) { Storage.addCoins(r.coins); UI.toast(`+${r.coins} 🪙`); }
    if (r.gems) { Storage.addGems(r.gems); UI.toast(`+${r.gems} 💎`); Audio2.play('gem'); }
    if (r.booster) {
      Storage.data.boosters[r.booster]++;
      UI.toast(CFG.BOOSTERS[r.booster].g + ' ' + I18N.t('plus_one', { name: I18N.booster(r.booster).name }));
    }
    if (r.chest) {
      Storage.data.chests[r.chest]++;
      UI.toast(CFG.CHESTS[r.chest].g + ' ' + I18N.t('chest_of', { name: I18N.chest(r.chest) }) + '!');
    }
    Storage.save();
  },

  /* ---- Rewarded-реклама у магазині: ліміт на день ---- */
  _adReset() {
    const d = Storage.data.daily;
    if (d.adDate !== Utils.today()) { d.adDate = Utils.today(); d.adCoins = 0; d.adGems = 0; }
  },

  /** Скільки переглядів типу kind ('coins'|'gems') лишилось сьогодні. */
  adLeft(kind) {
    this._adReset();
    const used = kind === 'coins' ? Storage.data.daily.adCoins : Storage.data.daily.adGems;
    return Math.max(0, CFG.AD_REWARDS[kind].perDay - used);
  },

  /** Зарахування нагороди за перегляд (викликати ПІСЛЯ реклами). */
  useAdReward(kind) {
    if (this.adLeft(kind) <= 0) return false;
    const d = Storage.data.daily;
    if (kind === 'coins') { d.adCoins++; Storage.addCoins(CFG.AD_REWARDS.coins.amount); UI.toast(I18N.t('coins_plus', { n: CFG.AD_REWARDS.coins.amount })); }
    else { d.adGems++; Storage.addGems(CFG.AD_REWARDS.gems.amount); UI.toast(I18N.t('gems_plus', { n: CFG.AD_REWARDS.gems.amount })); Audio2.play('gem'); }
    Storage.save();
    return true;
  },

  /* ---- Скрині за перегляд реклами (wood:1, silver:2, gold:3) ----
   * Ліміт: CFG.AD_CHEST_PER_DAY отриманих скринь на день (усього). */
  adChestNeed(kind) { return CFG.CHESTS[kind].ads || 0; },
  adChestProgress(kind) { return Storage.data.adChestProgress[kind] || 0; },

  _adChestReset() {
    const d = Storage.data.daily;
    if (d.adChestDate !== Utils.today()) { d.adChestDate = Utils.today(); d.adChestCount = 0; }
  },

  /** Скільки скринь за рекламу ще можна отримати сьогодні. */
  adChestLeft() {
    this._adChestReset();
    return Math.max(0, CFG.AD_CHEST_PER_DAY - Storage.data.daily.adChestCount);
  },

  /** Зарахувати один перегляд реклами до скрині kind (викликати ПІСЛЯ реклами).
   *  Повертає { granted, progress, need, blocked }. */
  addAdChest(kind) {
    const need = this.adChestNeed(kind);
    if (!need) return { granted: false, progress: 0, need: 0 };
    if (this.adChestLeft() <= 0) return { granted: false, progress: this.adChestProgress(kind), need, blocked: true };
    const p = Storage.data.adChestProgress;
    p[kind] = (p[kind] || 0) + 1;
    if (p[kind] >= need) {
      p[kind] = 0;
      Storage.data.chests[kind]++;
      Storage.data.daily.adChestCount++;      // скриня зараховується у денний ліміт
      Storage.save();
      return { granted: true, progress: 0, need };
    }
    Storage.save();
    return { granted: false, progress: p[kind], need };
  },

  /* ---- Колесо фортуни ---- */
  canSpin() { return Storage.data.daily.lastSpin !== Utils.today(); },

  /** Крутіння: безкоштовне раз на день, далі — за rewarded-рекламу.
   *  viaAd=true означає, що нагороду за перегляд уже підтверджено.
   *  Повертає індекс сектора або -1, якщо крутити не можна. */
  spin(viaAd) {
    if (!viaAd && !this.canSpin()) return -1;
    if (!viaAd) Storage.data.daily.lastSpin = Utils.today();
    Storage.data.stats.spins++;
    Missions.progress('spins', 1);
    Storage.save();
    return Math.floor(Math.random() * CFG.WHEEL.length);
  }
};

/* ============================================================
 * Щоденні місії: 3 випадкові місії на день з шаблонів CFG.MISSIONS.
 * ============================================================ */
const Missions = {

  ensureToday() {
    const d = Storage.data.daily;
    const today = Utils.today();
    if (d.missionsDate === today && d.missions.length) return;
    d.missionsDate = today;
    const rnd = Utils.rng(parseInt(today.replace(/-/g, '')) || 1);
    const pool = Utils.shuffle([...CFG.MISSIONS], rnd).slice(0, CFG.MISSIONS_PER_DAY);
    d.missions = pool.map(m => ({
      id: m.id,
      goal: m.n[Utils.ri(rnd, 0, m.n.length - 1)],
      progress: 0,
      reward: m.reward,
      claimed: false
    }));
    Storage.save();
  },

  /** Просування прогресу місій типу id на n. */
  progress(id, n) {
    const d = Storage.data.daily;
    if (!d.missions) return;
    let changed = false;
    for (const m of d.missions) {
      if (m.id === id && !m.claimed && m.progress < m.goal) {
        m.progress = Math.min(m.goal, m.progress + n);
        changed = true;
        if (m.progress >= m.goal) UI.toast(I18N.t('mission_done'));
      }
    }
    if (changed) Storage.save();
  },

  claim(i) {
    const m = Storage.data.daily.missions[i];
    if (!m || m.claimed || m.progress < m.goal) return false;
    m.claimed = true;
    Storage.addCoins(m.reward);
    Audio2.play('coin');
    Storage.save();
    return true;
  }
};

/* ============================================================
 * Скрині: відкриття та випадкові нагороди.
 * ============================================================ */
const Chests = {

  open(kind) {
    const d = Storage.data;
    if ((d.chests[kind] || 0) <= 0) return null;
    d.chests[kind]--;
    d.stats.chestsOpened++;
    Missions.progress('chests', 1);

    const c = CFG.CHESTS[kind];
    const rewards = [];
    const coins = Utils.ri(Math.random, c.coins[0], c.coins[1]);
    rewards.push({ g: '🪙', text: I18N.t('coins_plus', { n: coins }) });
    Storage.addCoins(coins);

    const gems = Utils.ri(Math.random, c.gems[0], c.gems[1]);
    if (gems > 0) { rewards.push({ g: '💎', text: I18N.t('gems_plus', { n: gems }) }); Storage.addGems(gems); }

    const boosterIds = CFG.GAME_BOOSTERS;
    for (let i = 0; i < c.boosters; i++) {
      const id = boosterIds[Math.floor(Math.random() * boosterIds.length)];
      d.boosters[id]++;
      rewards.push({ g: CFG.BOOSTERS[id].g, text: I18N.t('plus_one', { name: I18N.booster(id).name }) });
    }

    // Шанс нової теми
    if (Math.random() < c.themeChance) {
      const locked = CFG.THEMES.filter(t => !d.themes.includes(t.id));
      if (locked.length) {
        const t = locked[Math.floor(Math.random() * locked.length)];
        d.themes.push(t.id);
        rewards.push({ g: '🎨', text: I18N.t('new_theme', { name: I18N.theme(t.id) }) });
      }
    }

    Audio2.play('chest');
    Achievements.check();
    Storage.save();
    return rewards;
  }
};
