/* ============================================================
   META — прогресія та економіка:
   монети/кристали, енергія, магазин, 100+ досягнень,
   щоденні квести, щоденна нагорода (колесо), турнір тижня
   ============================================================ */
const Meta = (() => {
  /* ================= ЕНЕРГІЯ ================= */
  const ENERGY_REGEN_MS = 20 * 60 * 1000; // 1 енергія за 20 хв

  /** Перерахувати енергію з часу останнього оновлення */
  function syncEnergy() {
    const s = Storage.s;
    if (s.energy >= s.energyMax) { s.lastEnergyTs = Date.now(); return; }
    const elapsed = Date.now() - s.lastEnergyTs;
    const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
    if (gained > 0) {
      s.energy = Math.min(s.energyMax, s.energy + gained);
      s.lastEnergyTs += gained * ENERGY_REGEN_MS;
      Storage.save();
    }
  }

  function energyTimeLeft() {
    const s = Storage.s;
    if (s.energy >= s.energyMax) return 0;
    return Math.max(0, ENERGY_REGEN_MS - (Date.now() - s.lastEnergyTs));
  }

  function spendEnergy() {
    syncEnergy();
    const s = Storage.s;
    if (s.energy <= 0) return false;
    if (s.energy === s.energyMax) s.lastEnergyTs = Date.now();
    s.energy--;
    Storage.save();
    return true;
  }

  function addEnergy(n) {
    const s = Storage.s;
    s.energy = Math.min(s.energyMax, s.energy + n);
    Storage.save();
  }

  /* ================= ВАЛЮТА ================= */
  function addCoins(n) {
    Storage.s.coins += n;
    Storage.s.stats.coinsEarned += n;
    Storage.save();
  }
  function addGems(n) {
    Storage.s.gems += n;
    Storage.save();
  }
  function spendCoins(n) {
    if (Storage.s.coins < n) return false;
    Storage.s.coins -= n;
    Storage.save();
    return true;
  }

  /* ================= ТРЕКІНГ ПОДІЙ ================= */
  /**
   * Єдина точка обліку ігрових подій:
   * оновлює статистику, прогрес квестів і перевіряє досягнення
   */
  function track(metric, n) {
    if (!n) return;
    const st = Storage.s.stats;
    if (st[metric] !== undefined) st[metric] += n;
    // Квести дня
    const dq = Storage.s.dailyQuests;
    if (dq && dq.date === todayKey()) {
      for (const q of dq.quests) {
        if (q.metric === metric && !q.claimed && q.progress < q.target) {
          q.progress = Math.min(q.target, q.progress + n);
        }
      }
    }
    Storage.save();
  }

  /** Для метрик-максимумів (найбільше комбо) */
  function trackMax(metric, value) {
    const st = Storage.s.stats;
    if ((st[metric] || 0) < value) {
      st[metric] = value;
      Storage.save();
    }
  }

  /* ================= ЗАВЕРШЕННЯ ГРИ ================= */

  /** Перемога в рівні (adventure) або щоденному виклику */
  function finishLevel(config, mode, res) {
    const s = Storage.s;
    s.stats.levelsWon++;
    s.stats.totalScore += res.score;
    let coins = 0, gems = 0;

    if (mode === 'adventure') {
      const lvl = config.level;
      const prev = s.levels[lvl] || 0;
      s.levels[lvl] = Math.max(prev, res.stars);
      if (lvl === s.currentLevel && lvl < Levels.TOTAL_LEVELS) s.currentLevel = lvl + 1;
      coins = 40 + res.stars * 20 + res.coinsEarned;
      if (res.stars === 3) {
        s.stats.perfectLevels++;
        gems = 1;
      }
    } else if (mode === 'daily') {
      s.dailyChallengeDone = todayKey();
      coins = 150 + res.coinsEarned;
      gems = 3;
    } else {
      coins = res.coinsEarned;
    }

    addCoins(coins);
    if (gems) addGems(gems);
    Storage.saveNow();
    return { coins, gems };
  }

  /** Кінець нескінченного режиму: рекорди + монети за очки */
  function finishEndless(config, mode, res) {
    const s = Storage.s;
    s.stats.totalScore += res.score;
    const coins = Math.floor(res.score / 40) + res.coinsEarned;
    addCoins(coins);

    let isRecord = false;
    if (mode === 'tournament') {
      const week = Levels.getWeekId();
      if (s.tournamentWeek !== week) { s.tournamentWeek = week; s.bests.tournament = 0; }
      if (res.score > s.bests.tournament) { s.bests.tournament = res.score; isRecord = true; }
    } else if (s.bests[mode] !== undefined && res.score > s.bests[mode]) {
      s.bests[mode] = res.score;
      isRecord = true;
    }
    Storage.saveNow();
    return { coins, isRecord, best: s.bests[mode] || 0 };
  }

  /* ================= МАГАЗИН ================= */
  const SHOP = {
    themes: [
      { id: 'neon',   price: 0 },
      { id: 'sunset', price: 800 },
      { id: 'ocean',  price: 1200 },
      { id: 'candy',  price: 1500 },
      { id: 'dark',   price: 2000 },
      { id: 'royal',  price: 2500 },
    ],
    blocks: [
      { id: 'glossy',  price: 0 },
      { id: 'soft',    price: 800 },
      { id: 'crystal', price: 1000 },
      { id: 'pixel',   price: 1200 },
    ],
    fx: [
      { id: 'classic',  price: 0 },
      { id: 'hearts',   price: 500 },
      { id: 'fire',     price: 600 },
      { id: 'electric', price: 800 },
    ],
    boosters: [
      { id: 'hammer',  price: 150, icon: '🔨' },
      { id: 'bomb',    price: 250, icon: '💣' },
      { id: 'shuffle', price: 100, icon: '🔀' },
      { id: 'magnet',  price: 200, icon: '🧲' },
      { id: 'undo',    price: 120, icon: '↩️' },
      { id: 'freeze',  price: 180, icon: '🧊' },
    ],
  };

  function buyCosmetic(cat, id) {
    const item = SHOP[cat].find(i => i.id === id);
    if (!item) return false;
    const s = Storage.s;
    if (s.owned[cat].includes(id)) { // вже є — просто вдягнути
      s.equipped[cat === 'themes' ? 'theme' : cat] = id;
      Storage.save();
      return true;
    }
    if (!spendCoins(item.price)) return false;
    s.owned[cat].push(id);
    s.equipped[cat === 'themes' ? 'theme' : cat] = id;
    Storage.save();
    return true;
  }

  function buyBooster(id) {
    const item = SHOP.boosters.find(b => b.id === id);
    if (!item || !spendCoins(item.price)) return false;
    Storage.s.boosters[id] = (Storage.s.boosters[id] || 0) + 1;
    Storage.save();
    return true;
  }

  /* ================= ДОСЯГНЕННЯ (100+) ================= */
  // Метрика -> назва/іконка, 5 порогів, нагороди зростають
  const ACH_DEFS = [
    { metric: 'linesCleared',      icon: '💥', ua: 'Руйнівник ліній', en: 'Line Breaker',   tiers: [10, 50, 250, 1000, 5000] },
    { metric: 'blocksPlaced',      icon: '🧱', ua: 'Будівельник',     en: 'Builder',        tiers: [50, 250, 1000, 5000, 20000] },
    { metric: 'combosMade',        icon: '🔥', ua: 'Комбо-майстер',   en: 'Combo Master',   tiers: [5, 20, 100, 400, 1500] },
    { metric: 'maxCombo',          icon: '⚡', ua: 'Ланцюгова реакція', en: 'Chain Reaction', tiers: [2, 4, 6, 8, 12] },
    { metric: 'crystalsCollected', icon: '💎', ua: 'Збирач кристалів', en: 'Crystal Hunter', tiers: [5, 25, 100, 400, 1500] },
    { metric: 'iceBroken',         icon: '❄️', ua: 'Криголам',        en: 'Ice Breaker',    tiers: [5, 25, 100, 400, 1500] },
    { metric: 'chainsBroken',      icon: '⛓️', ua: 'Визволитель',     en: 'Liberator',      tiers: [5, 25, 100, 400, 1500] },
    { metric: 'goldCollected',     icon: '🪙', ua: 'Золотошукач',     en: 'Gold Digger',    tiers: [3, 15, 60, 250, 1000] },
    { metric: 'bombsExploded',     icon: '💣', ua: 'Підривник',       en: 'Demolitionist',  tiers: [3, 15, 60, 250, 1000] },
    { metric: 'shieldsBroken',     icon: '🛡️', ua: 'Ломар щитів',     en: 'Shield Crusher', tiers: [3, 15, 60, 250, 1000] },
    { metric: 'portalsUsed',       icon: '🌀', ua: 'Мандрівник',      en: 'Traveler',       tiers: [3, 15, 60, 250, 1000] },
    { metric: 'fogCleared',        icon: '☁️', ua: 'Розвіювач туману', en: 'Fog Clearer',   tiers: [3, 15, 60, 250, 1000] },
    { metric: 'boostersUsed',      icon: '🧪', ua: 'Алхімік',         en: 'Alchemist',      tiers: [3, 15, 60, 250, 1000] },
    { metric: 'levelsWon',         icon: '🏆', ua: 'Підкорювач',      en: 'Conqueror',      tiers: [1, 10, 50, 150, 500] },
    { metric: 'perfectLevels',     icon: '🌟', ua: 'Перфекціоніст',   en: 'Perfectionist',  tiers: [1, 5, 25, 100, 300] },
    { metric: 'coinsEarned',       icon: '💰', ua: 'Скарбник',        en: 'Treasurer',      tiers: [500, 2500, 10000, 50000, 200000] },
    { metric: 'gamesPlayed',       icon: '🎮', ua: 'Ветеран',         en: 'Veteran',        tiers: [5, 25, 100, 400, 1500] },
    { metric: 'totalScore',        icon: '📈', ua: 'Рекордсмен',      en: 'High Scorer',    tiers: [5000, 25000, 100000, 500000, 2000000] },
    { metric: 'adsWatched',        icon: '📺', ua: 'Глядач',          en: 'Viewer',         tiers: [1, 5, 20, 50, 150] },
    { metric: 'maxCombo',          icon: '👑', ua: 'Король комбо',    en: 'Combo King',     tiers: [3, 5, 7, 10, 15], suffix: 'k' },
  ];

  /** Розгорнутий список досягнень: 20 груп × 5 ярусів = 100 */
  function allAchievements() {
    const out = [];
    ACH_DEFS.forEach((d, di) => {
      d.tiers.forEach((threshold, ti) => {
        out.push({
          id: `${d.metric}${d.suffix || ''}_${ti}`,
          icon: d.icon,
          name: (I18N.getLang() === 'ua' ? d.ua : d.en) + ' ' + ['I', 'II', 'III', 'IV', 'V'][ti],
          metric: d.metric,
          target: threshold,
          reward: 50 * (ti + 1) * (ti + 1), // 50/200/450/800/1250
        });
      });
    });
    return out;
  }

  function achievementProgress(a) {
    return Math.min(a.target, Storage.s.stats[a.metric] || 0);
  }
  function achievementDone(a) {
    return (Storage.s.stats[a.metric] || 0) >= a.target;
  }
  function claimAchievement(a) {
    const s = Storage.s;
    if (!achievementDone(a) || s.claimedAchievements.includes(a.id)) return false;
    s.claimedAchievements.push(a.id);
    addCoins(a.reward);
    return true;
  }
  function unclaimedCount() {
    return allAchievements().filter(a => achievementDone(a) && !Storage.s.claimedAchievements.includes(a.id)).length;
  }

  /* ================= ЩОДЕННІ КВЕСТИ ================= */
  const QUEST_TEMPLATES = [
    { metric: 'linesCleared',      icon: '💥', target: [10, 20, 30], reward: [80, 140, 200] },
    { metric: 'blocksPlaced',      icon: '🧱', target: [40, 80, 120], reward: [70, 120, 180] },
    { metric: 'combosMade',        icon: '🔥', target: [3, 8, 15], reward: [100, 160, 240] },
    { metric: 'crystalsCollected', icon: '💎', target: [3, 8, 15], reward: [100, 170, 250] },
    { metric: 'iceBroken',         icon: '❄️', target: [4, 10, 18], reward: [90, 150, 220] },
    { metric: 'goldCollected',     icon: '🪙', target: [2, 5, 10], reward: [110, 180, 260] },
    { metric: 'bombsExploded',     icon: '💣', target: [2, 5, 9], reward: [110, 180, 260] },
    { metric: 'boostersUsed',      icon: '🧪', target: [1, 3, 5], reward: [80, 140, 200] },
    { metric: 'gamesPlayed',       icon: '🎮', target: [2, 4, 6], reward: [70, 120, 170] },
    { metric: 'levelsWon',         icon: '🏆', target: [1, 3, 5], reward: [120, 200, 300] },
  ];

  function questNames(metric, target) {
    const ua = {
      linesCleared: `Очисти ${target} ліній`, blocksPlaced: `Розмісти ${target} блоків`,
      combosMade: `Зроби ${target} комбо`, crystalsCollected: `Збери ${target} кристалів`,
      iceBroken: `Розбий ${target} льоду`, goldCollected: `Збери ${target} золота`,
      bombsExploded: `Підірви ${target} бомб`, boostersUsed: `Використай ${target} бустерів`,
      gamesPlayed: `Зіграй ${target} ігор`, levelsWon: `Пройди ${target} рівнів`,
    };
    const en = {
      linesCleared: `Clear ${target} lines`, blocksPlaced: `Place ${target} blocks`,
      combosMade: `Make ${target} combos`, crystalsCollected: `Collect ${target} crystals`,
      iceBroken: `Break ${target} ice`, goldCollected: `Collect ${target} gold`,
      bombsExploded: `Explode ${target} bombs`, boostersUsed: `Use ${target} boosters`,
      gamesPlayed: `Play ${target} games`, levelsWon: `Win ${target} levels`,
    };
    return (I18N.getLang() === 'ua' ? ua : en)[metric];
  }

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  /** Квести дня: 3 випадкові, детерміновані датою */
  function getDailyQuests() {
    const s = Storage.s;
    const today = todayKey();
    if (!s.dailyQuests || s.dailyQuests.date !== today) {
      const rng = Levels.mulberry32(Levels.hashStr('quests-' + today));
      const pool = [...QUEST_TEMPLATES];
      const quests = [];
      for (let i = 0; i < 3; i++) {
        const tIdx = Math.floor(rng() * pool.length);
        const tpl = pool.splice(tIdx, 1)[0];
        const diff = Math.floor(rng() * 3);
        quests.push({
          id: tpl.metric + '_' + i,
          metric: tpl.metric, icon: tpl.icon,
          target: tpl.target[diff], reward: tpl.reward[diff],
          progress: 0, claimed: false,
        });
      }
      s.dailyQuests = { date: today, quests };
      Storage.save();
    }
    return s.dailyQuests.quests;
  }

  function claimQuest(q) {
    if (q.claimed || q.progress < q.target) return false;
    q.claimed = true;
    addCoins(q.reward);
    return true;
  }

  function questsClaimable() {
    return getDailyQuests().some(q => !q.claimed && q.progress >= q.target);
  }

  /* ================= ЩОДЕННА НАГОРОДА (КОЛЕСО) ================= */
  const WHEEL_PRIZES = [
    { icon: '🪙', coins: 50 },
    { icon: '🪙', coins: 100 },
    { icon: '💎', gems: 2 },
    { icon: '🔨', booster: 'hammer' },
    { icon: '🪙', coins: 200 },
    { icon: '💣', booster: 'bomb' },
    { icon: '💎', gems: 5 },
    { icon: '🪙', coins: 400 },
  ];

  function dailyAvailable() {
    return Storage.s.lastDailyClaim !== todayKey();
  }

  /** Крутнути колесо: повертає {index, prize} */
  function spinWheel() {
    if (!dailyAvailable()) return null;
    const s = Storage.s;
    // Серія: скидається, якщо пропустив день
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.dailyStreak = s.lastDailyClaim === yesterday ? Math.min(7, s.dailyStreak + 1) : 1;
    s.lastDailyClaim = todayKey();

    const index = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = { ...WHEEL_PRIZES[index] };
    // Бонус серії: +25% монет за кожен день серії
    if (prize.coins) prize.coins = Math.round(prize.coins * (1 + (s.dailyStreak - 1) * 0.25));
    applyPrize(prize);
    Analytics.log('daily_spin', { streak: s.dailyStreak });
    Storage.saveNow();
    return { index, prize };
  }

  function applyPrize(prize) {
    if (prize.coins) addCoins(prize.coins);
    if (prize.gems) addGems(prize.gems);
    if (prize.booster) {
      Storage.s.boosters[prize.booster] = (Storage.s.boosters[prize.booster] || 0) + 1;
      Storage.save();
    }
  }

  /* ================= ТУРНІР ТИЖНЯ (локальна таблиця) ================= */
  /**
   * Боти-суперники: детерміновані сідом тижня, "грають" протягом тижня.
   * Двоє ботів — живі суперники: тримаються біля результату гравця
   * і потроху наздоганяють його щогодини. Обганяти когось —
   * сильніша мотивація, ніж абстрактний рекорд.
   */
  function tournamentBoard() {
    const week = Levels.getWeekId();
    const rng = Levels.mulberry32(Levels.hashStr('tb-' + week));
    const names = ['Nova', 'Zorro', 'Luna', 'Maks', 'Kira', 'Orion', 'Alex', 'Mila', 'Dex', 'Rita'];
    // Прогрес тижня: 0..1 (боти набирають очки поступово)
    const start = weekStartTs();
    const progress = Math.min(1, (Date.now() - start) / (7 * 86400000));
    const bots = names.map(n => ({
      name: n,
      score: Math.round((2000 + rng() * 9000) * (0.25 + progress * 0.75)),
    }));

    const s = Storage.s;
    const mine = s.tournamentWeek === week ? s.bests.tournament : 0;

    // Живі суперники: оновлюються раз на годину (детерміновано)
    if (mine > 0) {
      const hourTick = Math.floor(Date.now() / 3600000);
      const rvRng = Levels.mulberry32(Levels.hashStr('rv-' + week + '-' + hourTick));
      // "Тінь попереду": на 4–14% вище — є кого наздоганяти
      bots[0].score = Math.round(mine * (1.04 + rvRng() * 0.10));
      // "Дихає в спину": на 3–10% нижче, з кожною годиною ближче
      bots[1].score = Math.round(mine * (0.90 + rvRng() * 0.07));
    }

    const all = [...bots, { name: 'You', score: mine, me: true }];
    all.sort((a, b) => b.score - a.score);
    return all;
  }

  function weekStartTs() {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // понеділок = 0
    d.setHours(0, 0, 0, 0);
    return d.getTime() - day * 86400000;
  }

  function tournamentTimeLeft() {
    return Math.max(0, weekStartTs() + 7 * 86400000 - Date.now());
  }

  return {
    syncEnergy, energyTimeLeft, spendEnergy, addEnergy,
    addCoins, addGems, spendCoins,
    track, trackMax, finishLevel, finishEndless,
    SHOP, buyCosmetic, buyBooster,
    allAchievements, achievementProgress, achievementDone, claimAchievement, unclaimedCount,
    getDailyQuests, claimQuest, questsClaimable, questNames,
    WHEEL_PRIZES, dailyAvailable, spinWheel,
    tournamentBoard, tournamentTimeLeft, todayKey,
  };
})();
