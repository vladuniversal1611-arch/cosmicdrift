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
    if (r.gems) { Storage.addGems(r.gems); UI.toast(`+${r.gems} 💜`); Audio2.play('gem'); }
    if (r.booster) {
      Storage.data.boosters[r.booster]++;
      UI.toast(`${CFG.BOOSTERS[r.booster].g} ${CFG.BOOSTERS[r.booster].name} +1`);
    }
    if (r.chest) {
      Storage.data.chests[r.chest]++;
      UI.toast(`${CFG.CHESTS[r.chest].g} Скриня: ${CFG.CHESTS[r.chest].name}!`);
    }
    Storage.save();
  },

  /* ---- Колесо фортуни ---- */
  canSpin() { return Storage.data.daily.lastSpin !== Utils.today(); },

  /** Крутіння: повертає індекс сектора або -1, якщо не можна. */
  spin(paid) {
    if (!paid && !this.canSpin()) return -1;
    if (paid) {
      if (Storage.data.gems < 3) { UI.toast('Не вистачає кристалів 💜'); return -1; }
      Storage.addGems(-3);
    } else {
      Storage.data.daily.lastSpin = Utils.today();
    }
    Storage.data.stats.spins++;
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
    const pool = Utils.shuffle([...CFG.MISSIONS], rnd).slice(0, 3);
    d.missions = pool.map(m => ({
      id: m.id,
      goal: m.n[Utils.ri(rnd, 0, m.n.length - 1)],
      progress: 0,
      reward: m.reward,
      text: m.text,
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
        if (m.progress >= m.goal) UI.toast('📜 Місію виконано! Заберіть нагороду');
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

    const c = CFG.CHESTS[kind];
    const rewards = [];
    const coins = Utils.ri(Math.random, c.coins[0], c.coins[1]);
    rewards.push({ g: '🪙', text: `+${coins} монет` });
    Storage.addCoins(coins);

    const gems = Utils.ri(Math.random, c.gems[0], c.gems[1]);
    if (gems > 0) { rewards.push({ g: '💜', text: `+${gems} кристалів` }); Storage.addGems(gems); }

    const boosterIds = Object.keys(CFG.BOOSTERS);
    for (let i = 0; i < c.boosters; i++) {
      const id = boosterIds[Math.floor(Math.random() * boosterIds.length)];
      d.boosters[id]++;
      rewards.push({ g: CFG.BOOSTERS[id].g, text: `${CFG.BOOSTERS[id].name} +1` });
    }

    // Шанс нової теми
    if (Math.random() < c.themeChance) {
      const locked = CFG.THEMES.filter(t => !d.themes.includes(t.id));
      if (locked.length) {
        const t = locked[Math.floor(Math.random() * locked.length)];
        d.themes.push(t.id);
        rewards.push({ g: '🎨', text: `Нова тема: ${t.name}!` });
      }
    }

    Audio2.play('chest');
    Achievements.check();
    Storage.save();
    return rewards;
  }
};
