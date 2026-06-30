/* ============================================================
   Dragon Merge Blast — Game Data
   Dragons, crystals, islands, levels, quests, achievements,
   battle pass, shop & daily rewards definitions.
   ============================================================ */
(function (global) {
  'use strict';

  // ---- Crystal (gem) types -------------------------------------------------
  // Each crystal has an id, a display glyph and a vivid gradient palette.
  const CRYSTALS = [
    { id: 0, name: 'Ruby',     glyph: '🔥', c1: '#ff5d6c', c2: '#b3002d', core: '#ffd5da' },
    { id: 1, name: 'Sapphire', glyph: '💧', c1: '#5db4ff', c2: '#0046b3', core: '#d5ecff' },
    { id: 2, name: 'Emerald',  glyph: '🍃', c1: '#56e29a', c2: '#0a8a4a', core: '#d8ffe9' },
    { id: 3, name: 'Topaz',    glyph: '⚡', c1: '#ffd24d', c2: '#c98800', core: '#fff4cf' },
    { id: 4, name: 'Amethyst', glyph: '🔮', c1: '#c58bff', c2: '#6a1fb3', core: '#efddff' },
    { id: 5, name: 'Pearl',    glyph: '🌙', c1: '#f3f0ff', c2: '#b9c0e0', core: '#ffffff' }
  ];

  // Special crystals created by big matches.
  const SPECIAL = {
    NONE: 0,
    LINE_H: 1,   // clears its row
    LINE_V: 2,   // clears its column
    BOMB: 3,     // clears 3x3 area
    RAINBOW: 4   // clears all of one colour
  };

  // ---- Dragons -------------------------------------------------------------
  // ability: triggered automatically when the dragon's charge bar fills.
  const DRAGONS = [
    {
      id: 'flare', name: 'Flare', title: 'Вогняний дракон', emoji: '🐉',
      color: '#ff6a3d', glow: '#ff9d5c',
      ability: 'row', // destroys full row(s)
      desc: 'Спалює цілі ряди кристалів, перетворюючи їх на енергію.',
      chargeNeed: 24, basePower: 1, rarity: 'common', skins: ['classic', 'lava', 'gold']
    },
    {
      id: 'frost', name: 'Frost', title: 'Крижаний дракон', emoji: '🐲',
      color: '#5fd0ff', glow: '#bff0ff',
      ability: 'freeze', // removes ice/obstacles & freezes board damage
      desc: 'Заморожує перешкоди та розбиває кригу на полі.',
      chargeNeed: 26, basePower: 1, rarity: 'common', skins: ['classic', 'glacier', 'aurora']
    },
    {
      id: 'storm', name: 'Storm', title: 'Грозовий дракон', emoji: '🦅',
      color: '#b48bff', glow: '#e3d2ff',
      ability: 'random', // destroys random crystals
      desc: 'Б’є блискавками по випадкових кристалах поля.',
      chargeNeed: 22, basePower: 4, rarity: 'rare', skins: ['classic', 'voltage', 'nebula']
    },
    {
      id: 'verdant', name: 'Verdant', title: 'Лісовий дракон', emoji: '🦎',
      color: '#5fe39a', glow: '#c7ffe0',
      ability: 'bonus', // spawns bonus/special crystals
      desc: 'Вирощує бонусні кристали-підсилювачі на полі.',
      chargeNeed: 28, basePower: 1, rarity: 'rare', skins: ['classic', 'bloom', 'crystal']
    },
    {
      id: 'aether', name: 'Aether', title: 'Ефірний дракон', emoji: '✨',
      color: '#ffd24d', glow: '#fff2c2',
      ability: 'shuffle', // reshuffles board & adds moves
      desc: 'Перемішує поле та дарує додаткові ходи.',
      chargeNeed: 30, basePower: 1, rarity: 'epic', skins: ['classic', 'prism']
    }
  ];

  // ---- Islands -------------------------------------------------------------
  const ISLANDS = [
    { id: 0, name: 'Острів Світанку',   theme: '#ff8a5c', bg1: '#2a1330', bg2: '#5a1f3a', unlockLevel: 0  },
    { id: 1, name: 'Крижані Вершини',   theme: '#5fd0ff', bg1: '#0e2340', bg2: '#163a63', unlockLevel: 25 },
    { id: 2, name: 'Грозове Плато',     theme: '#b48bff', bg1: '#1c1340', bg2: '#3a2470', unlockLevel: 50 },
    { id: 3, name: 'Смарагдові Хащі',   theme: '#5fe39a', bg1: '#0f2e1f', bg2: '#1a5236', unlockLevel: 75 },
    { id: 4, name: 'Небесна Цитадель',  theme: '#ffd24d', bg1: '#301f10', bg2: '#5a3a18', unlockLevel: 100 }
  ];

  // ---- Level generator -----------------------------------------------------
  // Objective types: 'score', 'collect' (gather N of a colour), 'ice' (clear ice).
  const OBJ = { SCORE: 'score', COLLECT: 'collect', ICE: 'ice', JELLY: 'jelly', BOSS: 'boss' };

  // Boss roster — one guardian per island, defeated by dealing damage (matches).
  const BOSSES = [
    { emoji: '👹', name: 'Лорд Попелу',   color: '#ff6a3d', sprite: 'boss_ash' },
    { emoji: '🧊', name: 'Крижаний Тітан', color: '#5fd0ff', sprite: 'boss_titan' },
    { emoji: '🌩️', name: 'Володар Бурі',  color: '#b48bff', sprite: 'boss_storm' },
    { emoji: '🐗', name: 'Хащний Звір',    color: '#5fe39a', sprite: 'boss_beast' },
    { emoji: '🐦‍🔥', name: 'Небесний Фенікс', color: '#ffd24d', sprite: 'boss_phoenix' }
  ];

  function buildLevels() {
    const levels = [];
    const total = 125; // > 100 levels
    for (let i = 0; i < total; i++) {
      const n = i + 1;
      const island = Math.min(ISLANDS.length - 1, Math.floor(i / 25));
      const inIsland = i % 25;
      const cols = 8;
      const rows = 8;
      const colors = Math.min(6, 4 + Math.floor(i / 30)); // 4 → 6 colours
      const moves = 30 - Math.min(12, Math.floor(i / 12)); // 30 → 18 moves
      let objective, target, color = 0, iceCount = 0, jellyCount = 0, crates = 0, chains = 0;
      const cycle = inIsland % 5;
      if (cycle === 2) {
        objective = OBJ.COLLECT;
        color = (i % colors);
        target = 28 + Math.floor(i * 0.9);
        chains = Math.min(8, 2 + Math.floor(i / 14)); // locked crystals as a twist
      } else if (cycle === 3) {
        objective = OBJ.JELLY;
        jellyCount = 10 + Math.floor(i / 5) + island * 2;
        target = jellyCount;
      } else if (cycle === 4) {
        objective = OBJ.ICE;
        iceCount = 8 + Math.floor(i / 6) + (island * 3);
        crates = Math.min(6, 1 + Math.floor(i / 18)); // some blockers are 2-hit crates
        target = iceCount;
      } else {
        objective = OBJ.SCORE;
        target = 1200 + i * 240 + (island * 600);
        if (cycle === 1) chains = Math.min(6, 1 + Math.floor(i / 20));
      }
      const isBoss = inIsland === 24;
      if (isBoss) {
        objective = OBJ.BOSS;
        target = 80 + island * 45; // boss HP (kept beatable within the move budget)
        iceCount = 0; jellyCount = 0; chains = Math.min(3, island); crates = Math.max(0, island - 1);
      }
      levels.push({
        n, island, cols, rows, colors, moves: isBoss ? moves + 10 : moves,
        objective, target, color, iceCount, jellyCount, crates, chains,
        star2: Math.round(target * 1.4),
        star3: Math.round(target * 1.9),
        reward: { gold: isBoss ? 300 + i * 8 : 50 + i * 6, energy: isBoss ? 40 : 14 + Math.floor(i / 3) },
        boss: isBoss,
        bossDef: isBoss ? BOSSES[island] : null,
        name: isBoss ? (BOSSES[island].name) : ('Рівень ' + n)
      });
    }
    return levels;
  }

  const LEVELS = buildLevels();

  // ---- Achievements --------------------------------------------------------
  const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'Перший вибух',     desc: 'Завершіть рівень 1',            goal: 1,    stat: 'levelsWon',   reward: 100 },
    { id: 'combo_master', name: 'Майстер комбо',   desc: 'Зробіть комбо x5',              goal: 5,    stat: 'maxCombo',    reward: 200 },
    { id: 'hatch5',       name: 'Дракононяня',     desc: 'Виведіть 5 драконів',           goal: 5,    stat: 'dragonsHatched', reward: 300 },
    { id: 'crush1000',    name: 'Подрібнювач',     desc: 'Знищіть 1000 кристалів',        goal: 1000, stat: 'crystalsCrushed', reward: 250 },
    { id: 'isle2',        name: 'Мандрівник',      desc: 'Відкрийте другий острів',       goal: 25,   stat: 'levelsWon',   reward: 400 },
    { id: 'level50',      name: 'Півшляху',        desc: 'Пройдіть 50 рівнів',            goal: 50,   stat: 'levelsWon',   reward: 600 },
    { id: 'stars100',     name: 'Зорепад',         desc: 'Зберіть 100 зірок',             goal: 100,  stat: 'totalStars',  reward: 800 },
    { id: 'level100',     name: 'Легенда',         desc: 'Пройдіть 100 рівнів',           goal: 100,  stat: 'levelsWon',   reward: 1500 }
  ];

  // ---- Daily quests pool ---------------------------------------------------
  const QUEST_POOL = [
    { id: 'q_win3',    text: 'Виграйте 3 рівні',          goal: 3,   stat: 'levelsWon',      reward: 120 },
    { id: 'q_crush200',text: 'Знищіть 200 кристалів',     goal: 200, stat: 'crystalsCrushed',reward: 150 },
    { id: 'q_combo4',  text: 'Зробіть комбо x4',          goal: 4,   stat: 'maxCombo',       reward: 180 },
    { id: 'q_dragon',  text: 'Активуйте драконів 8 разів',goal: 8,   stat: 'dragonProcs',    reward: 160 },
    { id: 'q_energy',  text: 'Зберіть 200 енергії',       goal: 200, stat: 'energyEarned',   reward: 140 },
    { id: 'q_special', text: 'Створіть 6 особливих кристалів', goal: 6, stat: 'specialsMade',reward: 170 }
  ];

  // ---- Battle pass tiers (50 tiers) ---------------------------------------
  function buildPass() {
    const tiers = [];
    for (let i = 1; i <= 50; i++) {
      const free = i % 5 === 0
        ? { type: 'gems', amount: 20 }
        : { type: 'gold', amount: 80 + i * 10 };
      const premium = i % 10 === 0
        ? { type: 'dragon', amount: 1 }
        : (i % 5 === 0 ? { type: 'gems', amount: 60 } : { type: 'gold', amount: 200 + i * 15 });
      tiers.push({ tier: i, xp: i * 100, free, premium });
    }
    return tiers;
  }
  const BATTLE_PASS = buildPass();

  // ---- Cosmetic skin shop --------------------------------------------------
  const SKINS = [
    { id: 'flare_lava',   dragon: 'flare',  skin: 'lava',    name: 'Лавовий Flare',   price: 250, cur: 'gems' },
    { id: 'flare_gold',   dragon: 'flare',  skin: 'gold',    name: 'Золотий Flare',   price: 400, cur: 'gems' },
    { id: 'frost_glacier',dragon: 'frost',  skin: 'glacier', name: 'Льодовик Frost',  price: 250, cur: 'gems' },
    { id: 'frost_aurora', dragon: 'frost',  skin: 'aurora',  name: 'Аврора Frost',    price: 400, cur: 'gems' },
    { id: 'storm_voltage',dragon: 'storm',  skin: 'voltage', name: 'Вольтаж Storm',   price: 300, cur: 'gems' },
    { id: 'storm_nebula', dragon: 'storm',  skin: 'nebula',  name: 'Небула Storm',    price: 450, cur: 'gems' },
    { id: 'verdant_bloom',dragon: 'verdant',skin: 'bloom',   name: 'Цвіт Verdant',    price: 300, cur: 'gems' },
    { id: 'aether_prism', dragon: 'aether', skin: 'prism',   name: 'Призма Aether',   price: 600, cur: 'gems' }
  ];

  // Skin colour overrides for rendering.
  const SKIN_COLORS = {
    lava:    { color: '#ff3b1f', glow: '#ffae5c' },
    gold:    { color: '#ffd24d', glow: '#fff4c2' },
    glacier: { color: '#9fe8ff', glow: '#ffffff' },
    aurora:  { color: '#7affd0', glow: '#c2b9ff' },
    voltage: { color: '#d6a3ff', glow: '#fff0a0' },
    nebula:  { color: '#7a5cff', glow: '#ff7ad0' },
    bloom:   { color: '#5fe39a', glow: '#ffd0e8' },
    crystal: { color: '#a0ffd6', glow: '#ffffff' },
    prism:   { color: '#ffd24d', glow: '#9fd0ff' }
  };

  // Fake competitor names for the local leaderboard.
  const LB_NAMES = ['DragonKing', 'Aurora', 'BlazeFury', 'IcyQueen', 'StormRider', 'PixelMage',
    'NovaStar', 'EmberWolf', 'FrostByte', 'ThunderX', 'JadeViper', 'CrimsonAce', 'LunaCat',
    'ShadowFox', 'GoldenEye', 'MysticOwl', 'RubyHeart', 'ZenMaster'];

  // ---- Live-ops events (rotate daily, deterministic by date) --------------
  const EVENTS = [
    { id: 'gold',   ic: '🪙', mult: 'gold' },
    { id: 'energy', ic: '⚡', mult: 'energy' },
    { id: 'dragon', ic: '🐉', mult: 'dragon' }
  ];
  function activeEvent() {
    const d = new Date();
    const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return EVENTS[((day % EVENTS.length) + EVENTS.length) % EVENTS.length];
  }

  global.GameData = {
    CRYSTALS, SPECIAL, DRAGONS, ISLANDS, LEVELS, OBJ, BOSSES, LB_NAMES, EVENTS, activeEvent,
    ACHIEVEMENTS, QUEST_POOL, BATTLE_PASS, SKINS, SKIN_COLORS,
    dragonById: function (id) { return DRAGONS.find(function (d) { return d.id === id; }); }
  };
})(window);
