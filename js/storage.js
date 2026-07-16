/* ============================================================
   STORAGE — збереження прогресу в localStorage
   Автоматичне, з відкладеним записом (щоб не смикати диск)
   ============================================================ */
const Storage = (() => {
  const KEY = 'block_kingdom_save_v1';
  let saveTimer = null;

  /** Стан гравця за замовчуванням (новий профіль) */
  function defaults() {
    return {
      version: 1,
      coins: 200,
      gems: 10,
      energy: 5,
      energyMax: 5,
      lastEnergyTs: Date.now(),
      // Пригоди: пройдені рівні -> зірки (1..3)
      levels: {},
      currentLevel: 1,
      // Бустери
      boosters: { hammer: 3, bomb: 2, shuffle: 3, magnet: 1, undo: 3, freeze: 1 },
      // Магазин / косметика
      owned: { themes: ['neon'], blocks: ['glossy'], fx: ['classic'] },
      equipped: { theme: 'neon', blocks: 'glossy', fx: 'classic' },
      removeAds: false,
      // Статистика (для досягнень і квестів)
      stats: {
        linesCleared: 0, blocksPlaced: 0, combosMade: 0, maxCombo: 0,
        crystalsCollected: 0, iceBroken: 0, chainsBroken: 0, goldCollected: 0,
        bombsExploded: 0, boostersUsed: 0, gamesPlayed: 0, levelsWon: 0,
        coinsEarned: 0, perfectLevels: 0, totalScore: 0, adsWatched: 0,
        portalsUsed: 0, fogCleared: 0, shieldsBroken: 0,
      },
      bests: { classic: 0, infinity: 0, timerush: 0, hardcore: 0, tournament: 0 },
      tournamentWeek: '',
      claimedAchievements: [],
      // Квести дня: { date, quests: [{id, goal, progress, claimed}] }
      dailyQuests: null,
      // Щоденні нагороди
      dailyStreak: 0,
      lastDailyClaim: '',
      dailyChallengeDone: '',
      settings: { sound: true, music: true, vibration: true, lang: null },
      tutorialSeen: false,
      seenMechanics: [],
    };
  }

  let state = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // М'яке злиття зі схемою за замовчуванням (для оновлень гри)
        state = deepMerge(defaults(), parsed);
      }
    } catch (e) { /* пошкоджений сейв — стартуємо з нуля */ }
    return state;
  }

  function deepMerge(base, patch) {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch !== undefined ? patch : base;
    const out = Array.isArray(base) ? [] : { ...base };
    for (const k of Object.keys(patch)) {
      out[k] = (base && typeof base[k] === 'object' && !Array.isArray(base[k]) && base[k] !== null)
        ? deepMerge(base[k], patch[k]) : patch[k];
    }
    return out;
  }

  /** Відкладений запис — максимум раз на 300мс */
  function save() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
    }, 300);
  }

  function saveNow() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }

  function reset() {
    state = defaults();
    saveNow();
  }

  // Зберігаємо при закритті вкладки/згортанні застосунку
  window.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  window.addEventListener('pagehide', saveNow);

  return {
    load, save, saveNow, reset,
    get s() { return state; },
  };
})();
