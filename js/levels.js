/* ============================================================
   LEVELS — процедурний генератор 1000+ рівнів
   Детермінований (seed = номер рівня): рівень завжди однаковий,
   складність і механіки зростають плавно, 8 тематичних світів
   ============================================================ */
const Levels = (() => {
  const TOTAL_LEVELS = 1000;
  const LEVELS_PER_WORLD = 125;

  // Пороги розблокування механік (рівень пригод)
  const UNLOCKS = {
    gold: 6, crystal: 10, ice: 16, chain: 24, bomb: 32,
    rainbow: 40, shield: 55, fog: 70, portal: 90,
  };

  // Світи: назва (i18n key), іконка, декор, кольори фону вузлів
  const WORLDS = [
    { key: 'world_0', icon: '🌲', deco: ['🌲','🍄','🦋','🌿'], hue: 150 },
    { key: 'world_1', icon: '❄️', deco: ['❄️','🧊','⛄','🌨️'], hue: 200 },
    { key: 'world_2', icon: '🏜️', deco: ['🌵','🐪','☀️','🏺'], hue: 40 },
    { key: 'world_3', icon: '🌋', deco: ['🌋','🔥','🐉','💥'], hue: 10 },
    { key: 'world_4', icon: '☁️', deco: ['☁️','🌈','🕊️','🎈'], hue: 190 },
    { key: 'world_5', icon: '🪐', deco: ['🪐','⭐','🚀','🌌'], hue: 260 },
    { key: 'world_6', icon: '🕸️', deco: ['🕸️','💀','🕯️','⚔️'], hue: 290 },
    { key: 'world_7', icon: '🏰', deco: ['🏰','👑','🔮','✨'], hue: 330 },
  ];

  /* ---------- Детермінований RNG (mulberry32) ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Хеш рядка -> число (для daily/weekly seed) */
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** Які механіки вже відкриті на цьому рівні */
  function unlockedAt(level) {
    const u = {};
    for (const k in UNLOCKS) u[k] = level >= UNLOCKS[k];
    return u;
  }

  /** Механіка, що відкривається САМЕ на цьому рівні (для банера "Нова механіка!") */
  function newMechanicAt(level) {
    for (const k in UNLOCKS) if (UNLOCKS[k] === level) return k;
    return null;
  }

  function worldOf(level) {
    return Math.min(WORLDS.length - 1, Math.floor((level - 1) / LEVELS_PER_WORLD));
  }

  /**
   * Згенерувати конфігурацію рівня пригод.
   * Повертає: goals, розмір поля, стартові клітинки, ліміт ходів, механіки
   */
  function generate(level) {
    const rng = mulberry32(level * 7919 + 13);
    const u = unlockedAt(level);
    const world = worldOf(level);
    const size = level >= 60 && level % 7 === 0 ? 9 : 8; // інколи 9×9 для різноманіття
    const t = Math.min(1, level / 400); // глобальний коефіцієнт складності

    /* --- Цілі рівня --- */
    const goals = [];
    // Основна ціль чергується за типом
    const goalTypes = ['lines', 'score'];
    if (u.crystal) goalTypes.push('crystals');
    if (u.ice) goalTypes.push('ice');
    if (u.chain) goalTypes.push('chains');
    if (u.gold) goalTypes.push('gold');
    const mainType = goalTypes[Math.floor(rng() * goalTypes.length)];

    if (mainType === 'lines') goals.push({ type: 'lines', target: 4 + Math.floor(level / 12) + Math.floor(rng() * 4) });
    else if (mainType === 'score') goals.push({ type: 'score', target: (8 + Math.floor(level / 5)) * 100 + Math.floor(rng() * 5) * 100 });
    else if (mainType === 'crystals') goals.push({ type: 'crystals', target: 3 + Math.floor(rng() * 4) + Math.floor(t * 5) });
    else if (mainType === 'ice') goals.push({ type: 'ice', target: 4 + Math.floor(rng() * 4) + Math.floor(t * 6) });
    else if (mainType === 'chains') goals.push({ type: 'chains', target: 3 + Math.floor(rng() * 3) + Math.floor(t * 5) });
    else if (mainType === 'gold') goals.push({ type: 'gold', target: 3 + Math.floor(rng() * 3) });

    // Друга ціль на пізніх рівнях
    if (level > 45 && rng() < 0.5) {
      const second = mainType === 'lines'
        ? { type: 'score', target: (6 + Math.floor(level / 8)) * 100 }
        : { type: 'lines', target: 3 + Math.floor(level / 20) };
      goals.push(second);
    }

    /* --- Ліміт ходів (фігур) --- */
    let moveBudget = 0;
    for (const g of goals) {
      if (g.type === 'lines') moveBudget += g.target * 3;
      else if (g.type === 'score') moveBudget += Math.ceil(g.target / 240);
      else moveBudget += g.target * 3.2;
    }
    const moves = Math.max(12, Math.ceil(moveBudget * (1.35 - t * 0.30)));

    /* --- Стартова розстановка спец-клітинок --- */
    const cells = []; // {x, y, kind, hp?, color?}
    const density = 0.06 + t * 0.14 + rng() * 0.05;
    const count = Math.floor(size * size * density);
    const taken = new Set();
    const put = (kind, extra) => {
      for (let tries = 0; tries < 30; tries++) {
        const x = Math.floor(rng() * size), y = Math.floor(rng() * size);
        const k = x + ',' + y;
        if (taken.has(k)) continue;
        taken.add(k);
        cells.push(Object.assign({ x, y, kind }, extra));
        return true;
      }
      return false;
    };

    // Гарантуємо клітинки під цілі
    for (const g of goals) {
      if (g.type === 'crystals') for (let i = 0; i < g.target; i++) put('crystal');
      if (g.type === 'ice') for (let i = 0; i < g.target; i++) put('ice', { hp: 2, color: Math.floor(rng() * Shapes.COLOR_COUNT) });
      if (g.type === 'chains') for (let i = 0; i < g.target; i++) put('chain', { color: Math.floor(rng() * Shapes.COLOR_COUNT) });
      if (g.type === 'gold') for (let i = 0; i < g.target; i++) put('goldcell', { color: Math.floor(rng() * Shapes.COLOR_COUNT) });
    }

    // Декоративні перешкоди для складності
    for (let i = cells.length; i < count; i++) {
      const opts = ['block'];
      if (u.ice) opts.push('ice');
      if (u.chain) opts.push('chain');
      if (u.shield) opts.push('shield');
      if (u.bomb && rng() < 0.25) opts.push('bombcell');
      const kind = opts[Math.floor(rng() * opts.length)];
      if (kind === 'ice') put('ice', { hp: 2, color: Math.floor(rng() * Shapes.COLOR_COUNT) });
      else if (kind === 'shield') put('shield', { hp: 2 });
      else if (kind === 'chain') put('chain', { color: Math.floor(rng() * Shapes.COLOR_COUNT) });
      else if (kind === 'bombcell') put('bombcell', { color: Math.floor(rng() * Shapes.COLOR_COUNT) });
      else put('block', { color: Math.floor(rng() * Shapes.COLOR_COUNT) });
    }

    // Туман: пляма в кутку на пізніх рівнях
    const fog = [];
    if (u.fog && rng() < 0.4) {
      const fx = rng() < 0.5 ? 0 : size - 3;
      const fy = rng() < 0.5 ? 0 : size - 3;
      for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 3; dy++) fog.push({ x: fx + dx, y: fy + dy });
    }

    // Портали: одна пара
    const portals = [];
    if (u.portal && rng() < 0.45) {
      const ax = Math.floor(rng() * size), ay = Math.floor(rng() * (size / 2));
      let bx = Math.floor(rng() * size), by = size - 1 - Math.floor(rng() * (size / 2));
      if (ax === bx && ay === by) bx = (bx + 1) % size;
      portals.push({ a: { x: ax, y: ay }, b: { x: bx, y: by } });
    }

    return {
      level, world, size, goals, moves, cells, fog, portals,
      unlocked: u,
      pieceLevel: Math.min(level, 60), // складність пулу фігур
      newMechanic: newMechanicAt(level),
    };
  }

  /** Конфіг для нескінченних режимів */
  function endlessConfig(mode) {
    const now = new Date();
    let seed = Math.floor(Math.random() * 1e9);
    let unlocked = unlockedAt(Storage.s.currentLevel);
    if (mode === 'daily') {
      seed = hashStr('daily-' + now.toISOString().slice(0, 10));
      unlocked = unlockedAt(50);
    } else if (mode === 'tournament') {
      seed = hashStr('week-' + getWeekId());
      unlocked = unlockedAt(80);
    } else if (mode === 'hardcore') {
      unlocked = unlockedAt(100);
    }
    return {
      mode, seed, size: 8,
      goals: [], moves: Infinity,
      cells: [], fog: [], portals: [],
      unlocked,
      pieceLevel: Math.min(Math.max(Storage.s.currentLevel, 10), 60),
      timeLimit: mode === 'timerush' ? 120 : 0,
      hardcore: mode === 'hardcore',
      level: 0, world: 0,
    };
  }

  /** Ідентифікатор тижня для турніру: "2026-W29" */
  function getWeekId() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + week;
  }

  /** Скільки зірок здобуто у світі */
  function worldStars(world) {
    let stars = 0;
    const from = world * LEVELS_PER_WORLD + 1;
    for (let i = from; i < from + LEVELS_PER_WORLD; i++) stars += Storage.s.levels[i] || 0;
    return stars;
  }

  function totalStars() {
    let s = 0;
    for (const k in Storage.s.levels) s += Storage.s.levels[k];
    return s;
  }

  return {
    TOTAL_LEVELS, LEVELS_PER_WORLD, WORLDS, UNLOCKS,
    mulberry32, hashStr, generate, endlessConfig, unlockedAt,
    worldOf, worldStars, totalStars, getWeekId,
  };
})();
