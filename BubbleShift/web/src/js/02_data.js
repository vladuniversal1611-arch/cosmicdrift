/* ==========================================================================
   02_data.js — all designer-facing content & balance tables (pure data).
   Edit THIS file to add areas, characters, story beats, rewards and prices.
   ========================================================================== */
'use strict';

const DATA = {};

// ---------------------------------------------------------------- Bubbles
// Six colours chosen for maximum hue separation on small screens.
// `sym` is the optional colour-blind glyph (Settings > Color symbols).
DATA.COLORS = [
  { id: 'red',    base: '#f0293b', light: '#ff9aa0', dark: '#9c0f1d', glow: '#ff5a66', sym: 'heart'   },
  { id: 'blue',   base: '#1f7bff', light: '#8fc4ff', dark: '#0b3fa8', glow: '#58a2ff', sym: 'drop'    },
  { id: 'green',  base: '#27c940', light: '#9af59f', dark: '#0c7a22', glow: '#56e56a', sym: 'leaf'    },
  { id: 'yellow', base: '#ffc412', light: '#fff0a0', dark: '#c47a00', glow: '#ffd84a', sym: 'star'    },
  { id: 'purple', base: '#9a3cff', light: '#d6adff', dark: '#5410a8', glow: '#b574ff', sym: 'moon'    },
  { id: 'pink',   base: '#ff4fc0', light: '#ffb3e6', dark: '#b3137c', glow: '#ff85d4', sym: 'diamond' },
];

DATA.MATERIALS = ['wood', 'stone', 'crystal', 'flower'];

// ---------------------------------------------------------------- Mechanics
// Level at which each obstacle first appears (tutorial card shown once).
DATA.MECHANIC_INTRO = { stone: 11, ice: 21, chain: 31, bomb: 41, rainbow: 51, rotator: 61, locked: 71, dark: 81 };
// Level at which each objective type is first used.
DATA.OBJECTIVE_INTRO = { clear: 1, rescue: 2, stars: 5, top: 6, color: 8, butterflies: 16, crystals: 24, chains: 31, boss: 20 };

// ---------------------------------------------------------------- Areas
// 8 areas × 20 levels. The 20th level of every area is a boss.
// objects: 3 restoration projects per area, each with 3 stages.
DATA.AREAS = [
  { id: 'valley', name: { en: 'Green Valley', uk: 'Зелена Долина' }, mats: ['wood', 'stone'],
    sky: ['#58b6ff', '#9ad8ff', '#dff6ff'], hills: ['#8ad65a', '#5cb842', '#3f9a33'], props: 'meadow',
    boss: { name: { en: 'Bubble Beast', uk: 'Бульбозвір' }, hue: 280, hp: 110 },
    objects: [
      { id: 'cottage', type: 'house', unlock: 3, name: { en: "Nia's Cottage", uk: 'Хатинка Ніі' }, x: 0.27, y: 0.6 },
      { id: 'bridge', type: 'bridge', unlock: 12, name: { en: 'Old Bridge', uk: 'Старий міст' }, x: 0.72, y: 0.7 },
      { id: 'fountain', type: 'fountain', unlock: 16, name: { en: 'Wishing Fountain', uk: 'Фонтан бажань' }, x: 0.62, y: 0.47 },
    ] },
  { id: 'village', name: { en: 'Old Village', uk: 'Старе Село' }, mats: ['wood', 'flower'],
    sky: ['#ffb46b', '#ffd9a0', '#fff1d6'], hills: ['#b8d66a', '#8fbf4a', '#6fa338'], props: 'village',
    boss: { name: { en: 'Grumble Blob', uk: 'Бурчун-Клякса' }, hue: 20, hp: 95 },
    objects: [
      { id: 'windmill', type: 'windmill', unlock: 23, name: { en: 'Windmill', uk: 'Вітряк' }, x: 0.72, y: 0.5 },
      { id: 'workshop', type: 'workshop', unlock: 29, name: { en: "Nia's Workshop", uk: 'Майстерня Ніі' }, x: 0.28, y: 0.6 },
      { id: 'vgarden', type: 'garden', unlock: 35, name: { en: 'Village Garden', uk: 'Сільський сад' }, x: 0.62, y: 0.72 },
    ] },
  { id: 'forest', name: { en: 'Mystic Forest', uk: 'Чарівний Ліс' }, mats: ['flower', 'crystal'],
    sky: ['#2f9e8f', '#6fd1b6', '#c9f5e2'], hills: ['#3f9a5a', '#2e7d48', '#1f6238'], props: 'forest',
    boss: { name: { en: 'Moss Muncher', uk: 'Моховик' }, hue: 110, hp: 120 },
    objects: [
      { id: 'treehouse', type: 'house', unlock: 43, name: { en: 'Treehouse', uk: 'Будиночок на дереві' }, x: 0.3, y: 0.55 },
      { id: 'mushgarden', type: 'garden', unlock: 49, name: { en: 'Mushroom Grove', uk: 'Грибний гай' }, x: 0.7, y: 0.62 },
      { id: 'moonbridge', type: 'bridge', unlock: 55, name: { en: 'Moon Bridge', uk: 'Місячний міст' }, x: 0.45, y: 0.74 },
    ] },
  { id: 'lake', name: { en: 'Crystal Lake', uk: 'Кришталеве Озеро' }, mats: ['crystal', 'stone'],
    sky: ['#4f7dff', '#8fb6ff', '#dfe9ff'], hills: ['#7fc6d6', '#4fa3c0', '#2f7fa3'], props: 'lake',
    boss: { name: { en: 'Frost Gulper', uk: 'Льодоглот' }, hue: 195, hp: 115 },
    objects: [
      { id: 'lighthouse', type: 'lighthouse', unlock: 63, name: { en: 'Lighthouse', uk: 'Маяк' }, x: 0.74, y: 0.5 },
      { id: 'cfountain', type: 'fountain', unlock: 69, name: { en: 'Crystal Fountain', uk: 'Кришталевий фонтан' }, x: 0.3, y: 0.58 },
      { id: 'boathouse', type: 'house', unlock: 75, name: { en: 'Boathouse', uk: 'Човновий будиночок' }, x: 0.58, y: 0.73 },
    ] },
  { id: 'ruins', name: { en: 'Ancient Ruins', uk: 'Древні Руїни' }, mats: ['stone', 'crystal'],
    sky: ['#e6a45a', '#f2c98a', '#fbe8c6'], hills: ['#c9a56a', '#a88650', '#86683c'], props: 'ruins',
    boss: { name: { en: 'Stone Golem', uk: 'Кам’яний Голем' }, hue: 35, hp: 90 },
    objects: [
      { id: 'stower', type: 'tower', unlock: 83, name: { en: 'Sun Tower', uk: 'Сонячна вежа' }, x: 0.3, y: 0.5 },
      { id: 'tbridge', type: 'bridge', unlock: 89, name: { en: 'Temple Bridge', uk: 'Храмовий міст' }, x: 0.62, y: 0.72 },
      { id: 'oworkshop', type: 'workshop', unlock: 95, name: { en: 'Old Forge', uk: 'Стара кузня' }, x: 0.72, y: 0.54 },
    ] },
  { id: 'clouds', name: { en: 'Cloud Gardens', uk: 'Хмарні Сади' }, mats: ['flower', 'crystal'],
    sky: ['#b58cff', '#d7c2ff', '#fbefff'], hills: ['#ffffff', '#f1e6ff', '#e0d0ff'], props: 'clouds',
    boss: { name: { en: 'Thunder Puff', uk: 'Громовий Пух' }, hue: 250, hp: 90 },
    objects: [
      { id: 'skymill', type: 'windmill', unlock: 103, name: { en: 'Sky Mill', uk: 'Небесний млин' }, x: 0.3, y: 0.52 },
      { id: 'cgarden', type: 'garden', unlock: 109, name: { en: 'Floating Garden', uk: 'Летючий сад' }, x: 0.68, y: 0.6 },
      { id: 'skylight', type: 'lighthouse', unlock: 115, name: { en: 'Star Beacon', uk: 'Зоряний маяк' }, x: 0.5, y: 0.75 },
    ] },
  { id: 'shadow', name: { en: 'Shadow Valley', uk: 'Тіньова Долина' }, mats: ['crystal', 'wood'],
    sky: ['#3a2f7a', '#6a4fa8', '#b89ad6'], hills: ['#5a4a8a', '#46387a', '#322868'], props: 'shadow',
    boss: { name: { en: 'Gloom Maw', uk: 'Похмура Паща' }, hue: 300, hp: 110 },
    objects: [
      { id: 'shouse', type: 'house', unlock: 123, name: { en: 'Lantern House', uk: 'Дім ліхтарів' }, x: 0.28, y: 0.58 },
      { id: 'shtower', type: 'tower', unlock: 129, name: { en: 'Moon Tower', uk: 'Місячна вежа' }, x: 0.7, y: 0.5 },
      { id: 'shfountain', type: 'fountain', unlock: 135, name: { en: 'Starlight Fountain', uk: 'Фонтан зорепаду' }, x: 0.52, y: 0.74 },
    ] },
  { id: 'castle', name: { en: 'Final Castle', uk: 'Останній Замок' }, mats: ['stone', 'crystal'],
    sky: ['#ff8fb0', '#ffc3a6', '#fff0d6'], hills: ['#9a8ac8', '#7a6ab0', '#5a4a96'], props: 'castle',
    boss: { name: { en: 'Murk', uk: 'Морок' }, hue: 265, hp: 105, final: true },
    objects: [
      { id: 'gate', type: 'tower', unlock: 143, name: { en: 'Castle Gate', uk: 'Замкова брама' }, x: 0.5, y: 0.5 },
      { id: 'cbridge', type: 'bridge', unlock: 149, name: { en: 'Rainbow Bridge', uk: 'Райдужний міст' }, x: 0.3, y: 0.72 },
      { id: 'royalgarden', type: 'garden', unlock: 155, name: { en: 'Royal Garden', uk: 'Королівський сад' }, x: 0.72, y: 0.66 },
    ] },
];
DATA.LEVELS_PER_AREA = 20;
DATA.MAX_LEVEL = DATA.AREAS.length * DATA.LEVELS_PER_AREA; // 160

// Stage names per restoration object type (3 stages each).
DATA.STAGES = {
  house:      [{ en: 'Rebuild the walls', uk: 'Відбудувати стіни' }, { en: 'Paint the house', uk: 'Пофарбувати дім' }, { en: 'Plant a garden', uk: 'Посадити садок' }],
  bridge:     [{ en: 'Lay new planks', uk: 'Покласти дошки' }, { en: 'Paint the railings', uk: 'Пофарбувати поручні' }, { en: 'Hang lanterns', uk: 'Повісити ліхтарики' }],
  fountain:   [{ en: 'Repair the basin', uk: 'Полагодити чашу' }, { en: 'Bring back the water', uk: 'Повернути воду' }, { en: 'Plant flowers', uk: 'Посадити квіти' }],
  windmill:   [{ en: 'Fix the tower', uk: 'Полагодити вежу' }, { en: 'Mend the sails', uk: 'Зашити крила' }, { en: 'Add flower boxes', uk: 'Додати квітники' }],
  workshop:   [{ en: 'Rebuild the workshop', uk: 'Відбудувати майстерню' }, { en: 'Paint the sign', uk: 'Намалювати вивіску' }, { en: 'Light the forge', uk: 'Розпалити горно' }],
  garden:     [{ en: 'Clear the ground', uk: 'Розчистити землю' }, { en: 'Plant flowers', uk: 'Посадити квіти' }, { en: 'Grow the magic tree', uk: 'Виростити чарівне дерево' }],
  lighthouse: [{ en: 'Rebuild the tower', uk: 'Відбудувати вежу' }, { en: 'Paint the stripes', uk: 'Пофарбувати смуги' }, { en: 'Light the beacon', uk: 'Засвітити маяк' }],
  tower:      [{ en: 'Stack the stones', uk: 'Скласти камені' }, { en: 'Set the crystal', uk: 'Встановити кристал' }, { en: 'Awaken the light', uk: 'Пробудити світло' }],
};

// Cost of one restoration stage. 9 stages per area cost ≤ 18 stars in total,
// and 20 levels always give ≥ 20 stars, so nobody can get hard-locked.
DATA.stageCost = function (areaIdx, objIdx, stage) {
  const area = DATA.AREAS[areaIdx];
  if (areaIdx === 0 && objIdx === 0 && stage === 0) return { stars: 1, mats: { wood: 2 } }; // tutorial build
  const base = 2 + Math.floor(areaIdx * 0.8) + stage + objIdx;
  const mats = {};
  mats[area.mats[0]] = base;
  mats[area.mats[1]] = Math.max(1, base - 1);
  return { stars: 2, mats };
};

// ---------------------------------------------------------------- Characters
DATA.CHARACTERS = {
  lumi:  { name: { en: 'Lumi', uk: 'Люмі' },  role: { en: 'Firefly guide', uk: 'Світлячка-провідниця' },
           bio: { en: 'A tiny firefly fairy whose light can see through any storm.', uk: 'Крихітна фея-світлячок, чиє світло бачить крізь будь-яку бурю.' }, join: 0 },
  milo:  { name: { en: 'Milo', uk: 'Майло' },  role: { en: 'Valley scout', uk: 'Розвідник долини' },
           bio: { en: 'Cheerful and fast, Milo knows every hidden path in the valley.', uk: 'Веселий і спритний — знає кожну стежку в долині.' }, join: 2 },
  nia:   { name: { en: 'Nia', uk: 'Ніа' },    role: { en: 'Builder', uk: 'Майстриня' },
           bio: { en: 'A hedgehog builder who can fix anything with a hammer and a smile.', uk: 'Їжачиха-майстриня, що полагодить будь-що молотком і посмішкою.' }, join: 3 },
  bruno: { name: { en: 'Bruno', uk: 'Бруно' }, role: { en: 'Brave guard', uk: 'Хоробрий вартовий' },
           bio: { en: 'A little bear with a big heart. Grumbles a lot, protects everyone.', uk: 'Маленький ведмідь із великим серцем. Бурчить, але захищає всіх.' }, join: 10 },
  eli:   { name: { en: 'Eli', uk: 'Елі' },    role: { en: 'Explorer', uk: 'Дослідниця' },
           bio: { en: 'A curious owl with a map of places nobody has seen.', uk: 'Допитлива сова з мапою місць, яких ніхто не бачив.' }, join: 21 },
  murk:  { name: { en: 'Murk', uk: 'Морок' },  role: { en: 'The Bubble Storm', uk: 'Бульбашкова Буря' },
           bio: { en: 'A cloud that lost its colors and wants everyone else to lose theirs.', uk: 'Хмара, що втратила свої барви й хоче забрати їх у всіх.' }, join: 999 },
};

// ---------------------------------------------------------------- Creatures (collection)
// look: [bodyHex, bellyHex, ear, pattern, accessory]
const CR = (id, area, r, look, en, uk, den, duk) => ({ id, area, r, look, name: { en, uk }, desc: { en: den, uk: duk } });
DATA.CREATURES = [
  CR('pip', 0, 'common', ['#ffb347', '#fff1d6', 'cat', 'none', 'leaf'], 'Pip', 'Піп', 'Loves sunny hills and dandelion fluff.', 'Обожнює сонячні пагорби й кульбабки.'),
  CR('dewdrop', 0, 'common', ['#7fd4ff', '#e8f8ff', 'round', 'spots', 'none'], 'Dewdrop', 'Росинка', 'Wakes up with the morning dew.', 'Прокидається з ранковою росою.'),
  CR('clover', 0, 'rare', ['#6fdc6f', '#effbe6', 'bunny', 'none', 'flower'], 'Clover', 'Конюшинка', 'Brings good luck to anyone it hugs.', 'Приносить удачу всім, кого обійме.'),
  CR('bumble', 0, 'rare', ['#ffd23f', '#fff6c8', 'antenna', 'stripes', 'none'], 'Bumble', 'Джміль', 'Hums a tune while pollinating flowers.', 'Наспівує, запилюючи квіти.'),
  CR('crumb', 1, 'common', ['#e8a86a', '#fff0dc', 'round', 'none', 'scarf'], 'Crumb', 'Крихта', 'Follows the smell of fresh bread.', 'Іде на запах свіжого хліба.'),
  CR('mote', 1, 'common', ['#c9b3ff', '#f4eeff', 'cat', 'spots', 'none'], 'Mote', 'Порошинка', 'Naps in sunbeams on windowsills.', 'Спить у сонячних променях на підвіконні.'),
  CR('thimble', 1, 'rare', ['#ff8fa3', '#ffeef2', 'bunny', 'none', 'bow'], 'Thimble', 'Наперсток', 'Sews patches onto torn sails.', 'Латає порвані вітрила.'),
  CR('sprocket', 1, 'epic', ['#9fb4c8', '#eef3f8', 'antenna', 'stripes', 'hat'], 'Sprocket', 'Шестерик', 'Fixes gears with its tiny paws.', 'Лагодить шестерні крихітними лапками.'),
  CR('fern', 2, 'common', ['#4fcf8a', '#e2fbef', 'leaf', 'none', 'none'], 'Fern', 'Папороть', 'Hides by pretending to be a plant.', 'Ховається, прикидаючись рослиною.'),
  CR('glimmer', 2, 'rare', ['#7ff0ff', '#effdff', 'antenna', 'spots', 'none'], 'Glimmer', 'Мерехтик', 'Glows softly when it is happy.', 'М’яко світиться, коли щасливий.'),
  CR('toadstool', 2, 'common', ['#ff6b6b', '#fff0e6', 'round', 'spots', 'hat'], 'Toadstool', 'Мухоморчик', 'Wears a mushroom cap as a hat.', 'Носить шапинку гриба як капелюх.'),
  CR('hush', 2, 'epic', ['#5a6bd6', '#e6e9ff', 'cat', 'stripes', 'scarf'], 'Hush', 'Тишко', 'Moves so quietly even owls miss it.', 'Рухається так тихо, що навіть сови не чують.'),
  CR('ripple', 3, 'common', ['#5fb6ff', '#e6f4ff', 'fin', 'none', 'none'], 'Ripple', 'Хвилька', 'Skips across the lake like a stone.', 'Стрибає по озеру, як камінчик.'),
  CR('prism', 3, 'rare', ['#b8f0ff', '#ffffff', 'antenna', 'spots', 'bow'], 'Prism', 'Призма', 'Splits sunlight into tiny rainbows.', 'Розщеплює сонце на крихітні веселки.'),
  CR('pebble', 3, 'common', ['#9aa6b8', '#eef1f6', 'round', 'none', 'none'], 'Pebble', 'Камінчик', 'Can nap underwater for hours.', 'Може годинами дрімати під водою.'),
  CR('aurora', 3, 'epic', ['#a98bff', '#f2edff', 'fin', 'stripes', 'flower'], 'Aurora', 'Аврора', 'Its tail shimmers in every color.', 'Її хвіст мерехтить усіма кольорами.'),
  CR('dusty', 4, 'common', ['#d8b27a', '#fff3dc', 'cat', 'none', 'scarf'], 'Dusty', 'Пилько', 'Digs up forgotten treasures.', 'Відкопує забуті скарби.'),
  CR('rune', 4, 'rare', ['#6fb3a8', '#e6f6f3', 'antenna', 'stripes', 'none'], 'Rune', 'Руна', 'Reads the old symbols on the walls.', 'Читає давні знаки на стінах.'),
  CR('relic', 4, 'epic', ['#ffcf6b', '#fff8e0', 'bunny', 'spots', 'hat'], 'Relic', 'Релікт', 'Older than the ruins themselves.', 'Старший за самі руїни.'),
  CR('moss', 4, 'common', ['#8fbf5a', '#f0f8e6', 'leaf', 'spots', 'none'], 'Moss', 'Мох', 'Grows a little green coat in winter.', 'Взимку обростає зеленою шубкою.'),
  CR('puff', 5, 'common', ['#ffffff', '#f4f0ff', 'round', 'none', 'bow'], 'Puff', 'Пушок', 'Floats wherever the wind goes.', 'Летить, куди подме вітер.'),
  CR('zephyr', 5, 'rare', ['#9ad8ff', '#f0faff', 'bunny', 'stripes', 'scarf'], 'Zephyr', 'Зефір', 'Races the clouds and always wins.', 'Змагається з хмарами й завжди перемагає.'),
  CR('nimbus', 5, 'common', ['#d6c8ff', '#faf7ff', 'cat', 'spots', 'none'], 'Nimbus', 'Німбус', 'Makes tiny rain for thirsty flowers.', 'Робить маленький дощик для квітів.'),
  CR('halo', 5, 'epic', ['#ffe07a', '#fffbe6', 'antenna', 'none', 'flower'], 'Halo', 'Німб', 'Carries a ring of sunlight above its head.', 'Носить над головою кільце сонця.'),
  CR('wisp', 6, 'rare', ['#8f7bff', '#ece8ff', 'antenna', 'none', 'none'], 'Wisp', 'Вогник', 'A lantern-light that guides the lost.', 'Світлячок, що веде заблукалих.'),
  CR('umbra', 6, 'common', ['#5b4a8a', '#e3def2', 'cat', 'stripes', 'scarf'], 'Umbra', 'Умбра', 'Shy, but brave when friends need help.', 'Сором’язлива, але хоробра, коли друзям скрутно.'),
  CR('nova', 6, 'epic', ['#ff9be8', '#fff0fb', 'bunny', 'spots', 'bow'], 'Nova', 'Нова', 'Twinkles brighter the darker it gets.', 'Сяє тим яскравіше, чим темніше навколо.'),
  CR('regal', 7, 'epic', ['#ffcf4a', '#fff7dc', 'cat', 'none', 'hat'], 'Regal', 'Регал', 'Wears a crown it found in the castle.', 'Носить корону, знайдену в замку.'),
  CR('sparkle', 7, 'rare', ['#7fe0ff', '#effcff', 'antenna', 'spots', 'flower'], 'Sparkle', 'Іскорка', 'Leaves glitter wherever it walks.', 'Залишає блискітки, де пройде.'),
  CR('bloom', 7, 'epic', ['#ff8fb0', '#fff0f4', 'leaf', 'stripes', 'flower'], 'Bloom', 'Цвіт', 'The last creature Murk ever caught.', 'Остання істота, яку спіймав Морок.'),
];

// ---------------------------------------------------------------- Boosters
DATA.BOOSTERS = {
  hammer:   { kind: 'inlevel', unlock: 4,  price: 300, name: { en: 'Hammer', uk: 'Молот' }, desc: { en: 'Smash any one bubble or obstacle.', uk: 'Розбиває будь-яку кульку чи перешкоду.' } },
  bomb:     { kind: 'inlevel', unlock: 7,  price: 400, name: { en: 'Bomb', uk: 'Бомба' }, desc: { en: 'Your next shot explodes on impact.', uk: 'Наступний постріл вибухає при ударі.' } },
  shuffle:  { kind: 'inlevel', unlock: 9,  price: 250, name: { en: 'Shuffle', uk: 'Перемішати' }, desc: { en: 'Shuffle the colors on the board.', uk: 'Перемішує кольори на полі.' } },
  color:    { kind: 'inlevel', unlock: 14, price: 500, name: { en: 'Color Blast', uk: 'Кольоровий вибух' }, desc: { en: 'Clear every bubble of one color.', uk: 'Прибирає всі кульки одного кольору.' } },
  rainbow:  { kind: 'pre', unlock: 12, price: 350, name: { en: 'Rainbow Start', uk: 'Райдужний старт' }, desc: { en: 'Start with a rainbow bubble that matches any color.', uk: 'Старт із райдужною кулькою, що пасує до будь-якого кольору.' } },
  fireball: { kind: 'pre', unlock: 25, price: 450, name: { en: 'Fireball', uk: 'Вогняна куля' }, desc: { en: 'Start with a fireball that burns through 8 bubbles.', uk: 'Старт із вогняною кулею, що пропалює 8 кульок.' } },
  moves3:   { kind: 'pre', unlock: 35, price: 300, name: { en: '+3 Moves', uk: '+3 ходи' }, desc: { en: 'Start the level with 3 extra moves.', uk: 'Почни рівень із 3 додатковими ходами.' } },
};
DATA.INLEVEL_BOOSTERS = ['hammer', 'bomb', 'shuffle', 'color'];
DATA.PRE_BOOSTERS = ['rainbow', 'fireball', 'moves3'];

// ---------------------------------------------------------------- Lives
DATA.LIVES = { max: 5, regenMs: 20 * 60 * 1000, refillPrice: 600 };
DATA.CONTINUE_PRICES = [900, 1900, 2900];

// ---------------------------------------------------------------- Chests
DATA.CHESTS = {
  wooden:    { name: { en: 'Wooden Chest', uk: 'Дерев’яна скриня' }, coins: [40, 80],     boosters: 1, mats: 3,  lifeMin: 0,   creature: 0 },
  silver:    { name: { en: 'Silver Chest', uk: 'Срібна скриня' },         coins: [100, 160],   boosters: 2, mats: 5,  lifeMin: 15,  creature: 0 },
  gold:      { name: { en: 'Gold Chest', uk: 'Золота скриня' },           coins: [200, 300],   boosters: 3, mats: 8,  lifeMin: 30,  creature: 0.3 },
  magic:     { name: { en: 'Magic Chest', uk: 'Магічна скриня' },         coins: [400, 500],   boosters: 4, mats: 12, lifeMin: 60,  creature: 0.5 },
  legendary: { name: { en: 'Legendary Chest', uk: 'Легендарна скриня' },  coins: [1000, 1000], boosters: 6, mats: 20, lifeMin: 120, creature: 1 },
};
DATA.STAR_CHEST_STARS = 15;
DATA.starChestTier = (n) => (n % 10 === 9 ? 'magic' : n % 3 === 2 ? 'gold' : 'silver');

// ---------------------------------------------------------------- Daily reward (7-day calendar)
DATA.DAILY = [
  { coins: 100 },
  { boosters: { hammer: 1, bomb: 1 } },
  { lifeMin: 30 },
  { chest: 'silver' },
  { matsPack: 5 },
  { boosters: { shuffle: 1, color: 1, rainbow: 1 } },
  { chest: 'gold', coins: 300 },
];

// ---------------------------------------------------------------- Daily quests
DATA.QUESTS = [
  { id: 'win',     stat: 'levelsWon',    n: [2, 3, 5],      text: { en: 'Complete {n} levels', uk: 'Пройди рівні: {n}' },              reward: { coins: 100, wp: 40 } },
  { id: 'pop',     stat: 'popped',       n: [80, 150, 250], text: { en: 'Pop {n} bubbles', uk: 'Лопни кульки: {n}' },                  reward: { coins: 80, wp: 30 } },
  { id: 'drop',    stat: 'dropped',      n: [25, 50, 80],   text: { en: 'Drop {n} bubbles', uk: 'Скинь кульки: {n}' },                 reward: { coins: 80, wp: 30 } },
  { id: 'booster', stat: 'boostersUsed', n: [1, 2, 3],      text: { en: 'Use {n} boosters', uk: 'Використай бустери: {n}' },           reward: { boosters: { hammer: 1 }, wp: 30 }, minLevel: 5 },
  { id: 'stars',   stat: 'starsEarned',  n: [4, 6, 9],      text: { en: 'Earn {n} stars', uk: 'Здобудь зірки: {n}' },                  reward: { coins: 120, wp: 40 } },
  { id: 'special', stat: 'specials',     n: [8, 15, 25],    text: { en: 'Destroy {n} special bubbles', uk: 'Знищ особливі кульки: {n}' }, reward: { coins: 100, wp: 40 }, minLevel: 11 },
  { id: 'combo',   stat: 'combos3',      n: [2, 3, 5],      text: { en: 'Reach COMBO x3 {n} times', uk: 'КОМБО x3 стільки разів: {n}' }, reward: { coins: 100, wp: 40 }, minLevel: 3 },
  { id: 'rescue',  stat: 'rescued',      n: [2, 3, 5],      text: { en: 'Rescue {n} creatures', uk: 'Врятуй істот: {n}' },             reward: { coins: 120, wp: 40 }, minLevel: 7 },
];
DATA.QUEST_BONUS_CHEST = 'silver';

// ---------------------------------------------------------------- Weekly adventure
DATA.WEEKLY = [
  { at: 100,  reward: { coins: 150, boosters: { hammer: 1 } } },
  { at: 250,  reward: { chest: 'wooden' } },
  { at: 500,  reward: { chest: 'gold' } },
  { at: 1000, reward: { chest: 'magic' } },
];

// ---------------------------------------------------------------- Cannon skins (coin purchases)
DATA.SKINS = {
  classic: { price: 0,    name: { en: 'Classic', uk: 'Класика' },    body: '#2f6fe0', trim: '#ffd35a', gem: '#7fd3ff' },
  golden:  { price: 2500, name: { en: 'Golden', uk: 'Золота' },      body: '#d99a1e', trim: '#fff0a0', gem: '#ff5a66' },
  leafy:   { price: 3000, name: { en: 'Leafy', uk: 'Листяна' },      body: '#2fa84a', trim: '#b6f06a', gem: '#fff27a' },
  crystal: { price: 4000, name: { en: 'Crystal', uk: 'Кришталева' }, body: '#7a5cff', trim: '#c9f4ff', gem: '#ff9be8' },
};

// ---------------------------------------------------------------- Live events (date-driven)
// Add an entry to schedule an event; bonuses are applied by State.grant().
DATA.EVENTS = [
  { id: 'spring',    from: '03-20', to: '04-30', name: { en: 'Spring Festival', uk: 'Весняне свято' },        bonus: { mat: 'flower', mult: 1.5 } },
  { id: 'crystal',   from: '08-01', to: '08-31', name: { en: 'Crystal Festival', uk: 'Кришталеве свято' },   bonus: { mat: 'crystal', mult: 1.5 } },
  { id: 'halloween', from: '10-20', to: '11-03', name: { en: 'Halloween Valley', uk: 'Геловінська долина' }, bonus: { coins: 1.25 } },
  { id: 'winter',    from: '12-15', to: '01-07', name: { en: 'Winter Magic', uk: 'Зимова магія' },         bonus: { allMats: 1.25 } },
];

// ---------------------------------------------------------------- Progressive feature unlocks
// A feature appears once the player has WON the given level.
DATA.FEATURES = { restore: 3, daily: 4, map: 5, starChest: 5, shop: 6, quests: 7, collection: 7, weekly: 10 };

// ---------------------------------------------------------------- Story
// Trigger keys: 'win:N' first win of level N, 'boss:N' before boss level N,
// 'restore:<objId>:<stage>' after building, 'area:<idx>' area restored.
const SL = (who, en, uk) => ({ who, en, uk });
DATA.STORY = {
  'win:1': [SL('lumi', 'You did it! Every bubble you pop sets a piece of the valley free.', 'Вийшло! Кожна лопнута кулька звільняє частинку долини.')],
  'win:2': [SL('milo', "Wheee! I'm free! I'm Milo — thank you, friend!", 'Ура! Я вільний! Я Майло — дякую, друже!'),
            SL('lumi', 'Milo knows every path in Green Valley. He will help us.', 'Майло знає кожну стежку в долині. Він нам допоможе.')],
  'win:3': [SL('nia', "Hi! I'm Nia, a builder. The storm crushed my cottage...", 'Привіт! Я Ніа, майстриня. Буря зруйнувала мою хатинку...'),
            SL('nia', "Bring me stars and wood — let's rebuild it together! Tap my cottage.", 'Принось зірки й деревину — відбудуємо разом! Торкнись хатинки.')],
  'restore:cottage:1': [SL('nia', 'Look! The walls are standing again!', 'Дивись! Стіни знову стоять!'), SL('milo', "It's starting to feel like home!", 'Знову схоже на дім!')],
  'restore:cottage:3': [SL('nia', 'My cottage is more beautiful than ever. Thank you!', 'Моя хатинка ще гарніша, ніж була. Дякую!')],
  'win:5': [SL('lumi', 'The Bubble Storm came from the north — from the Final Castle.', 'Бульбашкова Буря прийшла з півночі — від Останнього Замку.'),
            SL('lumi', "Let's follow the map. Clear Green Valley to open the road!", 'Ходімо за мапою. Очисти Зелену Долину, щоб відкрити шлях!')],
  'win:10': [SL('bruno', 'Hmph! Bruno, guard of the Old Bridge. Those bubbles caught me napping.', 'Гм! Бруно, вартовий Старого мосту. Кульки впіймали мене сонним.'),
             SL('bruno', "From now on, I'll guard you. No arguing.", 'Відтепер я тебе охоронятиму. Без суперечок.')],
  'win:15': [SL('milo', 'If we fix the Old Bridge, we can reach the Old Village!', 'Якщо полагодимо Старий міст — дійдемо до Старого Села!')],
  'boss:20': [SL('murk', 'Who dares pop MY bubbles? Bubble Beast — get them!', 'Хто посмів лопати МОЇ кульки? Бульбозвіре — лови їх!')],
  'win:20': [SL('lumi', 'The Bubble Beast is gone! So Murk is behind the storm...', 'Бульбозвіра переможено! Отже, за бурею стоїть Морок...'),
             SL('nia', 'Restore the whole valley and the road north will open.', 'Віднови всю долину — і шлях на північ відкриється.')],
  'area:0': [SL('nia', 'Green Valley is blooming again!', 'Зелена Долина знову квітне!'), SL('lumi', 'Onward — the Old Village needs us!', 'Вперед — Старе Село чекає!')],
  'win:21': [SL('eli', "An explorer never gets lost... except in a Bubble Storm. I'm Eli!", 'Дослідниця ніколи не губиться... окрім як у бульбашковій бурі. Я Елі!'),
             SL('eli', "I've mapped Murk's path. He's heading north.", 'Я нанесла шлях Морока на мапу. Він прямує на північ.')],
  'win:30': [SL('milo', 'The villagers are waving at us!', 'Селяни нам махають!')],
  'boss:40': [SL('murk', 'Colors only bring trouble. Grumble Blob, show them!', 'Від барв самі проблеми. Бурчуне, покажи їм!')],
  'win:40': [SL('bruno', 'Ha! That blob grumbled louder than me.', 'Ха! Ця клякса бурчала голосніше за мене.')],
  'area:1': [SL('lumi', 'The Old Village is alive again. The forest is next!', 'Старе Село ожило. Далі — ліс!')],
  'win:41': [SL('eli', 'The Mystic Forest... its trees remember everything.', 'Чарівний Ліс... його дерева пам’ятають усе.')],
  'win:50': [SL('bruno', 'Stay close. This forest has eyes.', 'Тримайся ближче. Цей ліс має очі.')],
  'boss:60': [SL('murk', 'Enough! Moss Muncher, swallow their colors!', 'Досить! Моховику, проковтни їхні барви!')],
  'win:60': [SL('eli', "I found old notes... Murk wasn't always a storm. He was a cloud who lost his colors.", 'Я знайшла записи... Морок не завжди був бурею. Він був хмаринкою, що втратила барви.')],
  'area:2': [SL('lumi', 'The forest glows again. Crystal Lake awaits!', 'Ліс знову сяє. На нас чекає Кришталеве Озеро!')],
  'win:61': [SL('lumi', 'Crystal Lake! Its light once reached the whole valley.', 'Кришталеве Озеро! Колись його світло сягало всієї долини.')],
  'boss:80': [SL('murk', 'Freeze them, Frost Gulper! Freeze everything!', 'Заморозь їх, Льодоглоте! Заморозь усе!')],
  'win:80': [SL('eli', 'Murk steals colors because he feels alone. Maybe he can be saved.', 'Морок краде барви, бо почувається самотнім. Може, його можна врятувати.')],
  'area:3': [SL('nia', 'The lighthouse shines again! Next stop — the Ancient Ruins.', 'Маяк знову світить! Далі — Древні Руїни.')],
  'win:81': [SL('bruno', 'The Ancient Ruins. The first bubble magic was born here.', 'Древні Руїни. Тут народилася перша бульбашкова магія.')],
  'boss:100': [SL('murk', 'You are stubborn. The Golem is not.', 'Ти вперта душа. А от Голем — ні.')],
  'win:100': [SL('lumi', 'Halfway there! The whole valley believes in you!', 'Половину шляху пройдено! Уся долина вірить у тебе!')],
  'area:4': [SL('eli', 'The path climbs into the clouds...', 'Стежка здіймається в хмари...')],
  'win:101': [SL('milo', "Cloud Gardens! Don't look down!", 'Хмарні Сади! Тільки не дивись униз!')],
  'boss:120': [SL('murk', 'Thunder Puff! Blow them off my clouds!', 'Громовий Пуху! Здмухни їх з моїх хмар!')],
  'win:120': [SL('lumi', 'Murk is close. I can feel his storm.', 'Морок близько. Я відчуваю його бурю.')],
  'area:5': [SL('bruno', 'Shadow Valley ahead. Stay behind me.', 'Попереду Тіньова Долина. Тримайся за мною.')],
  'win:121': [SL('eli', 'Shadow Valley. The storm is strongest here.', 'Тіньова Долина. Тут буря найсильніша.')],
  'boss:140': [SL('murk', 'Gloom Maw, swallow the last of their light!', 'Похмура Пащо, поглинь рештки їхнього світла!')],
  'win:140': [SL('lumi', 'The Final Castle... Murk is waiting for us.', 'Останній Замок... Морок чекає на нас.')],
  'area:6': [SL('nia', 'Even the shadows are glowing now!', 'Навіть тіні тепер сяють!')],
  'boss:160': [SL('murk', 'Without colors, nothing can ever break again. Why do you fight me?', 'Без барв ніщо більше не зламається. Навіщо ти борешся зі мною?')],
  'win:160': [SL('murk', 'My colors... I remember them now.', 'Мої барви... Я пригадую їх.'),
              SL('lumi', "Stay with us, Murk. There's room for everyone in the valley.", 'Залишайся з нами, Мороку. У долині є місце для всіх.')],
  'area:7': [SL('lumi', 'You restored the whole valley. Thank you, hero!', 'Ти відновив усю долину. Дякуємо, герою!')],
};

// Intro cinematic panels.
DATA.INTRO = [
  { scene: 'sunny', en: 'Green Valley was the happiest place in the world...', uk: 'Зелена Долина була найщасливішим місцем у світі...' },
  { scene: 'storm', en: 'Until the Bubble Storm rolled in.', uk: 'Аж доки не налетіла Бульбашкова Буря.' },
  { scene: 'trapped', en: 'Magic bubbles swallowed homes, bridges and friends.', uk: 'Чарівні кульки поглинули будинки, мости й друзів.' },
  { scene: 'lumi', en: '"You can pop them! Please — help me save the valley!"', uk: '«Ти можеш їх лопати! Будь ласка — допоможи врятувати долину!»' },
];

// Mechanic/objective tutorial cards (shown once, on first appearance).
DATA.INTRO_CARDS = {
  stone:   { en: 'Stone Bubbles! Pop bubbles next to them twice to break them.', uk: 'Кам’яні кульки! Двічі лопни кульки поруч, щоб їх розбити.' },
  ice:     { en: 'Frozen Bubbles! Pop a bubble next to one to melt the ice.', uk: 'Заморожені кульки! Лопни кульку поруч, щоб розтопити лід.' },
  chain:   { en: 'Chained Bubbles hold everything up. Pop bubbles next to them to break the chains.', uk: 'Кульки в ланцюгах тримають усе. Лопай поруч, щоб розірвати ланцюги.' },
  bomb:    { en: 'Bomb Bubbles explode when a bubble next to them pops!', uk: 'Кульки-бомби вибухають, коли поруч лопається кулька!' },
  rainbow: { en: 'Rainbow Bubbles match with any color.', uk: 'Райдужні кульки пасують до будь-якого кольору.' },
  rotator: { en: 'Spinners turn the bubbles around them after every shot. Plan ahead!', uk: 'Крутилки повертають кульки навколо себе після кожного пострілу. Плануй наперед!' },
  locked:  { en: 'Locked Bubbles open when you collect the Key.', uk: 'Замкнені кульки відкриються, коли збереш Ключ.' },
  dark:    { en: 'Shadow Bubbles spread every 3 shots. Stop them fast!', uk: 'Тіньові кульки розповзаються кожні 3 постріли. Зупини їх швидше!' },
  rescue:  { en: 'Drop the creatures by popping the bubbles that hold them.', uk: 'Скинь істот, лопнувши кульки, що їх тримають.' },
  stars:   { en: 'Pop bubbles next to the stars, or drop them, to collect them.', uk: 'Лопай кульки поруч із зірками або скидай їх, щоб зібрати.' },
  top:     { en: 'Clear every bubble in the top row.', uk: 'Очисти всі кульки у верхньому ряду.' },
  color:   { en: 'Pop or drop bubbles of the shown color.', uk: 'Лопай або скидай кульки вказаного кольору.' },
  butterflies: { en: 'Pop bubbles next to the butterflies to set them free.', uk: 'Лопай кульки поруч із метеликами, щоб звільнити їх.' },
  crystals: { en: 'Pop bubbles next to the magic crystals to break them.', uk: 'Лопай кульки поруч із чарівними кристалами, щоб розбити їх.' },
  chains:  { en: 'Break all the chains!', uk: 'Розірви всі ланцюги!' },
  boss:    { en: 'Every bubble you pop or drop hurts the boss. Hit the glowing crystals for big damage!', uk: 'Кожна лопнута чи скинута кулька ранить боса. Влучай у сяйливі кристали — це велика шкода!' },
};

if (typeof module !== 'undefined') module.exports = { DATA };
