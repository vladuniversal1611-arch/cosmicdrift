/* Tiny Kingdom — game data definitions.
   Нові будівлі, зони, дослідження та колекції додаються саме тут —
   решта коду підхоплює їх автоматично. */
'use strict';

const RES_META = {
  gold:     { name: 'Золото',            icon: '🪙', capped: false },
  wood:     { name: 'Деревина',          icon: '🪵', capped: true  },
  stone:    { name: 'Камінь',            icon: '🪨', capped: true  },
  food:     { name: 'Їжа',               icon: '🍎', capped: true  },
  crystal:  { name: 'Кристали',          icon: '💎', capped: false },
  mcrystal: { name: 'Магічні кристали',  icon: '🔮', capped: false },
  relic:    { name: 'Давні реліквії',    icon: '🏺', capped: false },
  medal:    { name: 'Королівські медалі',icon: '🎖️', capped: false },
};
const MAIN_RES = ['gold', 'wood', 'stone', 'food', 'crystal'];
const RARE_RES = ['mcrystal', 'relic', 'medal'];

/* cost/time зростають у COST_MULT/TIME_MULT разів за кожен рівень; всі будівлі мають 10 рівнів */
const MAX_LVL = 10;
const COST_MULT = 1.8;
const TIME_MULT = 1.6;

/* Віхи виробництва: рівень 5 подвоює, рівень 10 потроює базову швидкість.
   Це вирівнює окупність високих рівнів (вартість росте експоненційно). */
function lvlProdMult(lvl) { return lvl * (lvl >= 10 ? 3 : lvl >= 5 ? 2 : 1); }

/* Престиж «Коронація»: доступна з рівня королівства PRESTIGE_MIN_KL,
   кожна корона назавжди дає +2% до всього виробництва */
const PRESTIGE_MIN_KL = 120;
const CROWN_BONUS = 0.02;

const BUILDINGS = {
  house:      { name: 'Будинок',       icon: '🏠', desc: '+2 населення за рівень, мешканці платять податки.',
                cost: { wood: 20, food: 10 }, time: 8,  prod: { gold: 0.06 }, pop: 2, beauty: 1, max: 12, unlock: { kl: 0 } },
  sawmill:    { name: 'Лісопилка',     icon: '🪚', desc: 'Лісоруби заготовляють деревину.',
                cost: { wood: 15 }, time: 10, prod: { wood: 0.7 }, job: 'lumberjack', beauty: 0, max: 4, unlock: { kl: 0 } },
  farm:       { name: 'Ферма',         icon: '🌾', desc: 'Фермери вирощують їжу для королівства.',
                cost: { wood: 25 }, time: 10, prod: { food: 0.6 }, job: 'farmer', beauty: 1, max: 4, unlock: { kl: 0 } },
  warehouse:  { name: 'Склад',         icon: '📦', desc: '+400 місткості складу за рівень.',
                cost: { wood: 40 }, time: 12, storage: 400, beauty: 0, max: 3, unlock: { kl: 2 } },
  quarry:     { name: 'Каменоломня',   icon: '⛏️', desc: 'Шахтарі видобувають камінь.',
                cost: { wood: 60, gold: 30 }, time: 15, prod: { stone: 0.45 }, job: 'miner', beauty: 0, max: 3, unlock: { kl: 6 } },
  market:     { name: 'Ринок',         icon: '⚖️', desc: 'Торговці продають товари й приносять золото.',
                cost: { wood: 80, stone: 40 }, time: 20, prod: { gold: 0.6 }, job: 'trader', beauty: 1, max: 2, unlock: { kl: 10 } },
  forge:      { name: 'Кузня',         icon: '🔨', desc: 'Ковалі кують знаряддя та зброю на продаж.',
                cost: { wood: 100, stone: 80, gold: 60 }, time: 25, prod: { gold: 0.9 }, job: 'smith', beauty: 1, max: 2, unlock: { kl: 14 } },
  castle:     { name: 'Замок',         icon: '🏰', desc: 'Серце королівства. +5% до всього виробництва за рівень, відкриває нові землі.',
                cost: { wood: 200, stone: 200, gold: 150 }, time: 45, allMult: 0.05, pop: 2, beauty: 5, max: 1, unlock: { kl: 18 } },
  library:    { name: 'Бібліотека',    icon: '📚', desc: '-3% до вартості досліджень за рівень. Відкриває архітекторів.',
                cost: { wood: 150, stone: 120, gold: 120 }, time: 30, beauty: 2, max: 1, unlock: { kl: 24 } },
  magictower: { name: 'Магічна вежа',  icon: '🔮', desc: 'Маги створюють кристали з повітря.',
                cost: { wood: 120, stone: 200, gold: 250 }, time: 40, prod: { crystal: 0.02 }, job: 'mage', beauty: 2, max: 1, unlock: { castle: 2 } },
  bank:       { name: 'Банк',          icon: '🏦', desc: '+4% до прибутку золота за рівень.',
                cost: { stone: 300, gold: 500 }, time: 45, goldMult: 0.04, beauty: 1, max: 1, unlock: { castle: 3 } },
  academy:    { name: 'Академія',      icon: '🎓', desc: 'Навчає жителів: кожен рівень жителя додає +5% до його роботи.',
                cost: { wood: 400, stone: 300, gold: 800 }, time: 50, beauty: 2, max: 1, unlock: { castle: 4 } },
  port:       { name: 'Порт',          icon: '⚓', desc: '-4% до часу експедицій та +4% до здобичі за рівень.',
                cost: { wood: 600, stone: 400, gold: 1200 }, time: 60, beauty: 2, max: 1, unlock: { castle: 5, zone: 'lake' } },
  arena:      { name: 'Арена',         icon: '🏟️', desc: 'Лицарі тренуються та здобувають королівські медалі.',
                cost: { stone: 800, gold: 2500 }, time: 70, prod: { medal: 0.0001 }, job: 'knight', beauty: 3, max: 1, unlock: { castle: 6 } },
  palace:     { name: 'Палац',         icon: '👑', desc: 'Вершина величі. +2% до всього виробництва за рівень.',
                cost: { stone: 2000, gold: 10000, relic: 3 }, time: 120, allMult: 0.02, beauty: 10, max: 1, unlock: { castle: 8 } },
};
const BUILD_ORDER = Object.keys(BUILDINGS);

const JOBS = {
  lumberjack: { name: 'Лісоруб',    icon: '🪓', b: 'sawmill',    color: '#8d6e42' },
  farmer:     { name: 'Фермер',     icon: '🌾', b: 'farm',       color: '#e8b93c' },
  miner:      { name: 'Шахтар',     icon: '⛏️', b: 'quarry',     color: '#8b93a5' },
  smith:      { name: 'Коваль',     icon: '🔨', b: 'forge',      color: '#c96c3c' },
  trader:     { name: 'Торговець',  icon: '⚖️', b: 'market',     color: '#9b59b6' },
  mage:       { name: 'Маг',        icon: '🧙', b: 'magictower', color: '#5d6ee8' },
  knight:     { name: 'Лицар',      icon: '🛡️', b: 'arena',      unlockB: 'castle', color: '#c0392b' },
  architect:  { name: 'Архітектор', icon: '📐', b: null,         unlockB: 'library', color: '#16a085',
                note: 'Кожен архітектор прискорює будівництво на 5%.' },
};

const RESEARCH = {
  carpentry:    { name: 'Столярна справа',        icon: '🪵', desc: '+10% деревини за рівень',            max: 5, base: 80,   mult: 'wood' },
  agriculture:  { name: 'Агрономія',              icon: '🌱', desc: '+10% їжі за рівень',                 max: 5, base: 80,   mult: 'food' },
  masonry:      { name: 'Мулярство',              icon: '🧱', desc: '+10% каменю за рівень',              max: 5, base: 150,  mult: 'stone' },
  economics:    { name: 'Економіка',              icon: '💰', desc: '+10% золота за рівень',              max: 5, base: 200,  mult: 'gold' },
  fastbuild:    { name: 'Швидке будівництво',     icon: '🏗️', desc: '-8% часу будівництва за рівень',     max: 5, base: 250,  effect: 'buildTime' },
  logistics:    { name: 'Логістика',              icon: '🛻', desc: '+20% місткості складу за рівень',    max: 5, base: 200,  effect: 'storage' },
  education:    { name: 'Освіта',                 icon: '🎓', desc: '+5% ефективності робітників за рівень', max: 5, base: 350, effect: 'workers' },
  trade:        { name: 'Дипломатична торгівля',  icon: '🤝', desc: '+15% до пропозицій караванів за рівень', max: 3, base: 400, effect: 'trade' },
  gear:         { name: 'Спорядження експедицій', icon: '🎒', desc: '+10% здобичі експедицій за рівень',  max: 5, base: 500,  crystal: 1, effect: 'loot' },
  magicstudy:   { name: 'Таємні знання',          icon: '🔮', desc: '+10% кристалів за рівень',           max: 5, base: 600,  crystal: 2, mult: 'crystal' },
  architecture: { name: 'Архітектура',            icon: '🏛️', desc: '-3% до вартості будівель за рівень', max: 5, base: 800,  crystal: 2, effect: 'buildCost' },
  automation:   { name: 'Автоматизація',          icon: '⚙️', desc: '+5% до всього виробництва за рівень', max: 5, base: 1000, crystal: 3, mult: 'all' },
};

/* req — потрібний рівень Замку */
const ZONES = {
  forest:      { name: 'Ліс',                icon: '🌲', desc: '+5% деревини. Домівка королівства.', cost: null, req: 0, bonus: { wood: 0.05 }, tier: 1 },
  lake:        { name: 'Озеро',              icon: '🏞️', desc: '+10% їжі. Відкриває шлях до Порту.', cost: { gold: 300, wood: 200 }, req: 1, bonus: { food: 0.10 }, tier: 2 },
  mountains:   { name: 'Гори',               icon: '⛰️', desc: '+10% каменю.', cost: { gold: 800, wood: 300 }, req: 2, bonus: { stone: 0.10 }, tier: 3 },
  desert:      { name: 'Пустеля',            icon: '🏜️', desc: '+10% золота. Реліквії в експедиціях.', cost: { gold: 2000, stone: 300 }, req: 3, bonus: { gold: 0.10 }, tier: 4 },
  snow:        { name: 'Засніжені землі',    icon: '🏔️', desc: '+10% кристалів.', cost: { gold: 5000, crystal: 20 }, req: 4, bonus: { crystal: 0.10 }, tier: 5 },
  volcano:     { name: 'Вулканічні острови', icon: '🌋', desc: '+15% золота. Рідкісні скарби.', cost: { gold: 15000, crystal: 60 }, req: 6, bonus: { gold: 0.15 }, tier: 6 },
  magicforest: { name: 'Магічний ліс',       icon: '🌳', desc: '+10% до всього. Найкраща здобич.', cost: { gold: 40000, mcrystal: 5 }, req: 8, bonus: { all: 0.10 }, tier: 7 },
};

/* Тривалості експедицій: [сек, множник здобичі] */
const EXP_DURATIONS = [
  { name: 'Коротка', sec: 300,  mult: 1 },
  { name: 'Середня', sec: 1200, mult: 4.5 },
  { name: 'Довга',   sec: 3600, mult: 16 },
];

const COLLECTIONS = {
  flags:     { name: 'Прапори',   icon: '🚩', stat: 'all',    per: 0.005, setBonus: 0.04,
               items: ['Прапор Світанку','Прапор Лева','Прапор Дуба','Прапор Хвилі','Прапор Зорі','Прапор Грифона','Прапор Полум\'я','Королівський штандарт'] },
  statues:   { name: 'Статуї',    icon: '🗿', stat: 'beauty', per: 8, setBonus: 40,
               items: ['Статуя Засновника','Кам\'яний Лицар','Мармуровий Олень','Фонтан Русалки','Обеліск Сонця','Статуя Мудреця','Золотий Грифон','Колос Королів'] },
  pets:      { name: 'Тварини',   icon: '🐾', stat: 'food',   per: 0.01, setBonus: 0.08,
               items: ['Руде кошеня','Вірний пес','Сова-поштарка','Крихітний дракончик','Пухнастий кролик','Лисеня','Черепаха-довгожитель','Білий єдиноріг'] },
  treasures: { name: 'Скарби',    icon: '💰', stat: 'gold',   per: 0.01, setBonus: 0.08,
               items: ['Мішечок дукатів','Перлове намисто','Келих короля','Скринька з рубінами','Корона піратів','Золоте яблуко','Діамант пустелі','Скарб дракона'] },
  ancient:   { name: 'Реліквії',  icon: '🏺', stat: 'crystal', per: 0.015, setBonus: 0.10,
               items: ['Стародавня амфора','Рунічний камінь','Свиток заклять','Амулет часу','Маска пращурів','Кинджал героя','Книга легенд','Серце гори'] },
  decor:     { name: 'Декорації', icon: '🎀', stat: 'beauty', per: 5, setBonus: 30,
               items: ['Квіткова клумба','Святкові ліхтарики','Різьблена лавка','Арка з троянд','Вітряні дзвіночки','Садовий гном','Ажурна альтанка','Королівський сад'] },
};

const EVENTS = {
  caravan:    { name: 'Караван купців',      icon: '🐪', banner: 'Караван купців прибув!', w: 22 },
  harvest:    { name: 'Свято врожаю',        icon: '🎉', banner: 'Свято врожаю: 2× їжі!', w: 18, dur: 120 },
  goblins:    { name: 'Напад гоблінів',      icon: '👺', banner: 'Гобліни атакують!', w: 16 },
  treasure:   { name: 'Скарб у лісі',        icon: '🎁', banner: 'У лісі знайдено скарб!', w: 18 },
  portal:     { name: 'Магічний портал',     icon: '🌀', banner: 'Відкрився магічний портал!', w: 14 },
  tournament: { name: 'Королівський турнір', icon: '⚔️', banner: 'Королівський турнір!', w: 12 },
};

const QUEST_TEMPLATES = [
  { id: 'build',    text: n => `Побудуй або покращ ${n} буд.`,        stat: 'built',     goals: [1, 2, 3],        reward: { gold: 120, crystal: 2 } },
  { id: 'wood',     text: n => `Зібери ${fmt(n)} деревини`,           stat: 'got_wood',  goals: [150, 400, 1000], reward: { gold: 100, crystal: 1 } },
  { id: 'food',     text: n => `Зібери ${fmt(n)} їжі`,                stat: 'got_food',  goals: [150, 400, 1000], reward: { gold: 100, crystal: 1 } },
  { id: 'gold',     text: n => `Заробили ${fmt(n)} золота`,           stat: 'got_gold',  goals: [200, 600, 1500], reward: { crystal: 3 } },
  { id: 'exp',      text: n => `Заверши ${n} експедиц.`,              stat: 'exps',      goals: [1, 2],           reward: { gold: 200, crystal: 3 } },
  { id: 'train',    text: n => `Навчи жителів ${n} раз.`,             stat: 'trained',   goals: [1, 2, 3],        reward: { gold: 150, crystal: 2 } },
  { id: 'taps',     text: n => `Збери бонус із будівель ${n} раз.`,   stat: 'taps',      goals: [3, 5, 8],        reward: { gold: 80, crystal: 1 } },
  { id: 'research', text: n => `Заверши ${n} дослідження`,            stat: 'research',  goals: [1],              reward: { crystal: 4 } },
  { id: 'event',    text: n => `Візьми участь у ${n} події`,          stat: 'events',    goals: [1, 2],           reward: { gold: 150, crystal: 2 } },
];

/* ---------- Сюжет: історія згаслого Серця Королівства ---------- */
const CHARS = {
  tadei:   { n: 'Радник Тадей',      icon: '📜' },
  solomia: { n: 'Чарівниця Соломія', icon: '🧙‍♀️' },
  orest:   { n: 'Капітан Орест',     icon: '🛡️' },
  murko:   { n: 'Кіт Мурко',         icon: '🐈' },
  grukk:   { n: 'Ґрукк, король гоблінів', icon: '👺' },
};
/* cond отримує {g: Game, st: stats} — як і досягнення. Умови мають бути
   монотонними: раз виконались — лишаються виконаними. */
const STORY = [
  { id: 'start', who: 'tadei', title: 'Спадок',
    text: 'Ваша Величносте, нарешті ти тут! Колись це королівство сяяло на весь світ — доки не згасло Серце Королівства, реліквія засновників. Народ розійшовся, лишився тільки я… та кіт. Почнімо з малого: даху над головою і теплої каші.',
    goal: 'Розпочати відбудову', cond: () => true, reward: { wood: 30 } },
  { id: 'farm', who: 'tadei', title: 'Хліб насущний',
    text: 'Люди повертаються, щойно бачать дим із коминів! Але порожній шлунок пісень не співає. Ферма прогодує нових підданих.',
    goal: 'Побудуй 🌾 Ферму', cond: s => s.g.buildingCount('farm') >= 1, reward: { food: 40 } },
  { id: 'warehouse', who: 'tadei', title: 'Запасливий господар',
    text: 'Добро не має гнити під дощем. Склад збереже кожну колоду й кожне яблуко — а бережливість, кажуть, друга мати багатства.',
    goal: 'Побудуй 📦 Склад', cond: s => s.g.buildingCount('warehouse') >= 1, reward: { gold: 60 } },
  { id: 'pop5', who: 'murko', title: 'Мурррр',
    text: 'Мяв! (Кіт Мурко оглянув нових мешканців, схвально муркнув і зайняв найтепліший підвіконник у королівстві. Здається, він тут головний.)',
    goal: 'Досягни 5 жителів', cond: s => s.g.pop() >= 5, reward: { food: 50 } },
  { id: 'quarry', who: 'orest', title: 'Дивні звуки в горах',
    text: 'Ваша Величносте, я Орест, служив ще твоєму дідові. У каменоломні чути шкряботіння з-під землі… Гобліни нишпорять у тунелях, ніби щось шукають. Тримай варту напоготові!',
    goal: 'Побудуй ⛏️ Каменоломню', cond: s => s.g.buildingCount('quarry') >= 1, reward: { stone: 40 } },
  { id: 'market', who: 'tadei', title: 'Чутки з каравану',
    text: 'Купці знову їдуть до нас! Один шепнув мені: Серце Королівства не згасло само — його викрав Ґрукк, король гоблінів, і розколов на три уламки, сховавши їх у далеких землях. Ось чому наша земля змарніла!',
    goal: 'Побудуй ⚖️ Ринок', cond: s => s.g.buildingCount('market') >= 1, reward: { gold: 150 } },
  { id: 'goblin1', who: 'grukk', title: 'Непрохані гості',
    text: 'Ґр-р-р! Це королівство належить Ґруккові! Серце у мене, і скоро тут буде саме болото та мухи! (Гобліни тікають, потираючи ґулі. Схоже, ти на правильному шляху.)',
    goal: 'Переможи гобліна власноруч (тапни його у бою)', cond: s => (s.st.goblins || 0) >= 1, reward: { crystal: 3 } },
  { id: 'castle', who: 'tadei', title: 'Трон предків',
    text: 'Замок! Справжній замок, як у давні часи! Тепер сусідні землі знову рахуватимуться з нами. Кажуть, у бібліотечних сувоях є мапа схованок Ґрукка…',
    goal: 'Побудуй 🏰 Замок', cond: s => s.g.buildingCount('castle') >= 1, reward: { gold: 200 } },
  { id: 'library', who: 'tadei', title: 'Легенда про три уламки',
    text: 'Я знайшов той сувій! «Перший уламок — під пісками, другий — у кризі, третій — у вогні». Отже: пустеля, сніги та вулкани. Споряджай експедиції, Ваша Величносте!',
    goal: 'Побудуй 📚 Бібліотеку', cond: s => s.g.buildingCount('library') >= 1, reward: { crystal: 5 } },
  { id: 'mage', who: 'solomia', title: 'Чарівниця прибуває',
    text: 'Вітаю, монарше. Я Соломія — почула, що тут знову жевріє магія. Моя вежа плестиме кристали з місячного світла, а вони знадобляться: без магії Серце не зібрати докупи.',
    goal: 'Побудуй 🔮 Магічну вежу', cond: s => s.g.buildingCount('magictower') >= 1, reward: { crystal: 5 } },
  { id: 'lake', who: 'tadei', title: 'За обрій',
    text: 'Озеро відкрите! Риба, очерет і водяні лілії… а ще — старий торговий шлях. Королівство росте, і світ це помічає.',
    goal: 'Відкрий зону 🏞️ Озеро', cond: s => s.g.zoneUnlocked('lake'), reward: { food: 100 } },
  { id: 'exp5', who: 'orest', title: 'Розвідники доповідають',
    text: 'Мої люди обнишпорили всі стежки. Сліди гоблінів ведуть далі — у гори й за них. Кожна експедиція наближає нас до уламків Серця!',
    goal: 'Заверши 5 експедицій', cond: s => (s.st.exps || 0) >= 5, reward: { gold: 300 } },
  { id: 'mountains', who: 'orest', title: 'Тунелі під горами',
    text: 'У горах ми знайшли покинуті тунелі Ґрукка — порожні, але стіни подряпані картами. Він поспішав. Пустеля, Ваша Величносте. Далі — пустеля.',
    goal: 'Відкрий зону ⛰️ Гори', cond: s => s.g.zoneUnlocked('mountains'), reward: { stone: 150 } },
  { id: 'castle5', who: 'tadei', title: 'Слава повертається',
    text: 'Барди вже складають пісні про відроджене королівство! П\'ятий поверх замку видно з-за обрію. Твої предки пишалися б, Ваша Величносте.',
    goal: 'Прокачай 🏰 Замок до рівня 5', cond: s => s.g.castleLvl() >= 5, reward: { crystal: 8 } },
  { id: 'relic1', who: 'solomia', title: 'Перший уламок!',
    text: 'Відчуваєш, як потеплішало повітря? Експедиція принесла з пісків перший уламок Серця! Він досі б\'ється — тихо, як пташеня в долонях. Лишилося два.',
    goal: 'Здобудь першу 🏺 реліквію (експедиції в Пустелю)', cond: s => (s.st.got_relic || 0) >= 1, reward: { crystal: 10 } },
  { id: 'academy', who: 'tadei', title: 'Мудрість — теж зброя',
    text: 'Академія! Тепер лісоруби рубають з розумом, фермери сіють за наукою, а я нарешті маю з ким зіграти в шахи. Навчений народ — міцне королівство.',
    goal: 'Побудуй 🎓 Академію', cond: s => s.g.buildingCount('academy') >= 1, reward: { gold: 500 } },
  { id: 'arena', who: 'orest', title: 'Гартування криці',
    text: 'На арені я викую з добровольців справжніх лицарів. Коли знайдемо лігво Ґрукка — а ми його знайдемо — вони будуть готові.',
    goal: 'Побудуй 🏟️ Арену', cond: s => s.g.buildingCount('arena') >= 1, reward: { medal: 1 } },
  { id: 'snow', who: 'solomia', title: 'Уламок у кризі',
    text: 'Другий уламок спав у льодовику, наспівуючи заметілі колискову. Тепер він у нас! Серце майже зібране — я чую, як земля під ногами прокидається.',
    goal: 'Відкрий зону 🏔️ Засніжені землі та знайди 2 🏺', cond: s => s.g.zoneUnlocked('snow') && (s.st.got_relic || 0) >= 2, reward: { crystal: 12 } },
  { id: 'volcano', who: 'grukk', title: 'Лігво короля гоблінів',
    text: 'Ґр-р! Як ви знайшли мій вулкан?! Забирайте свій камінець — він пече, від нього самі клопоти! Але Ґрукк ще повернеться… колись… може… (Втік. Третій уламок ваш!)',
    goal: 'Відкрий зону 🌋 Вулканічні острови та знайди 3 🏺', cond: s => s.g.zoneUnlocked('volcano') && (s.st.got_relic || 0) >= 3, reward: { gold: 2000 } },
  { id: 'palace', who: 'tadei', title: 'Серце Королівства',
    text: 'Три уламки з\'єдналися у палаці — і Серце Королівства забилося знову! Дивись: сади цвітуть серед зими, річка сміється, а люди... люди повернулися додому. Ти зробив це, Ваша Величносте.',
    goal: 'Побудуй 👑 Палац', cond: s => s.g.buildingCount('palace') >= 1, reward: { crystal: 25 } },
  { id: 'magicforest', who: 'solomia', title: 'Магія повертається',
    text: 'Магічний ліс визнав тебе. Дерева тут пам\'ятають засновників — і тепер шепочуть твоє ім\'я. Це найвища честь, яку знає моє ремесло.',
    goal: 'Відкрий зону 🌳 Магічний ліс', cond: s => s.g.zoneUnlocked('magicforest'), reward: { mcrystal: 1 } },
  { id: 'prestige1', who: 'tadei', title: 'Династія',
    text: 'Корона передана нащадку, і літописці відкрили нову сторінку. Кожне покоління будуватиме швидше й вище — адже тепер у нього є твій приклад. Хай живе династія!',
    goal: 'Проведи першу 👑 Коронацію', cond: s => (s.st.prestiges || 0) >= 1, reward: { crystal: 20 } },
];

const NAMES = ['Остап','Марічка','Тарас','Соломія','Богдан','Оксана','Назар','Галина','Івась','Одарка',
  'Левко','Ярина','Микола','Христя','Петро','Наталка','Данило','Уляна','Северин','Мотря',
  'Гнат','Зоряна','Юрко','Квітка','Максим','Роксолана','Стефан','Калина','Орест','Мирослава'];

const SKINS = [
  { id: 0, name: 'Класичний замок',  icon: '🏰', cost: null, roof: '#c0392b' },
  { id: 1, name: 'Смарагдовий замок', icon: '💚', cost: { crystal: 40 },  roof: '#27ae60' },
  { id: 2, name: 'Сапфіровий замок',  icon: '💙', cost: { crystal: 80 },  roof: '#2980d9' },
  { id: 3, name: 'Золотий замок',     icon: '⭐', cost: { medal: 15 },    roof: '#f1c40f' },
];

/* ---------- Досягнення: генеруються з шаблонів (усього 150+) ---------- */
function buildAchievements() {
  const A = [];
  const add = (id, name, desc, getter, v, reward) => A.push({ id, name, desc, getter, v, reward: reward || 2 });
  const tiersRes = { gold: [100,1e3,1e4,1e5,1e6,1e7,1e8], wood: [100,1e3,5e3,2e4,1e5,5e5,2e6],
    stone: [100,1e3,5e3,2e4,1e5,5e5,2e6], food: [100,1e3,5e3,2e4,1e5,5e5,2e6], crystal: [10,50,200,1e3,5e3,2e4,1e5] };

  for (const t of BUILD_ORDER) {
    const b = BUILDINGS[t];
    add('b1_' + t, `${b.icon} Перший: ${b.name}`, `Побудуй ${b.name}`, s => s.g.buildingCount(t), 1);
    add('b5_' + t, `${b.icon} Розвиток: ${b.name}`, `Сумарний рівень «${b.name}» ≥ 5`, s => s.g.typeLevel(t), 5, 3);
    add('b10_' + t, `${b.icon} Майстер: ${b.name}`, `Досягни 10 рівня «${b.name}»`, s => s.g.typeMaxLevel(t), 10, 5);
  }
  for (const r of Object.keys(tiersRes)) tiersRes[r].forEach((v, i) =>
    add(`res_${r}_${i}`, `${RES_META[r].icon} ${RES_META[r].name} ${i + 1}`,
      `Зібери ${fmt(v)} — ${RES_META[r].name}`, s => s.st['got_' + r] || 0, v, 1 + i));
  [3,5,8,12,16,20,26].forEach((v, i) => add('pop' + i, `👥 Населення ${v}`, `Досягни ${v} жителів`, s => s.g.pop(), v, 2 + i));
  [1,5,15,40,100,250,600].forEach((v, i) => add('exp' + i, `🧭 Мандрівники ${i + 1}`, `Заверши ${v} експедицій`, s => s.st.exps || 0, v, 2 + i));
  [1,5,15,30,52].forEach((v, i) => add('rsc' + i, `🔬 Наука ${i + 1}`, `Заверши ${v} досліджень`, s => s.st.research || 0, v, 2 + i));
  Object.keys(ZONES).forEach((z, i) => add('zone_' + z, `${ZONES[z].icon} Землі: ${ZONES[z].name}`, `Відкрий зону «${ZONES[z].name}»`, s => s.g.zoneUnlocked(z) ? 1 : 0, 1, 4 + i));
  [1,5,12,20,30,40,48].forEach((v, i) => add('col' + i, `🏆 Колекціонер ${i + 1}`, `Здобудь ${v} предметів колекцій`, s => s.g.colCount(), v, 2 + i));
  add('colset', '🏆 Повний набір', 'Заверши будь-яку колекцію повністю', s => s.g.colSetsDone(), 1, 10);
  [1,5,15,40,100,250].forEach((v, i) => add('evt' + i, `🎪 Події ${i + 1}`, `Візьми участь у ${v} подіях`, s => s.st.events || 0, v, 2 + i));
  [1,5,15,40,100].forEach((v, i) => add('trn' + i, `🎓 Наставник ${i + 1}`, `Навчи жителів ${v} разів`, s => s.st.trained || 0, v, 2 + i));
  [1,5,15,40,100,250].forEach((v, i) => add('qst' + i, `📜 Кур'єр ${i + 1}`, `Виконай ${v} щоденних квестів`, s => s.st.quests || 0, v, 2 + i));
  [5,15,30,60,100,140,180,220].forEach((v, i) => add('kl' + i, `👑 Королівство ${v}`, `Рівень королівства ≥ ${v}`, s => s.g.kl(), v, 2 + i));
  [10,30,60,120,200,300].forEach((v, i) => add('beauty' + i, `✨ Краса ${i + 1}`, `Краса королівства ≥ ${v}`, s => s.g.beauty(), v, 2 + i));
  [10,50,200,1000].forEach((v, i) => add('tap' + i, `👆 Дбайливий ${i + 1}`, `Збери бонуси з будівель ${v} разів`, s => s.st.taps || 0, v, 1 + i));
  [1,3,10].forEach((v, i) => add('relic' + i, `🏺 Археолог ${i + 1}`, `Знайди ${v} давніх реліквій`, s => s.st.got_relic || 0, v, 3 + i * 2));
  [1,5,20].forEach((v, i) => add('medal' + i, `🎖️ Чемпіон ${i + 1}`, `Здобудь ${v} королівських медалей`, s => s.st.got_medal || 0, v, 3 + i * 2));
  [1,3,10].forEach((v, i) => add('prst' + i, `👑 Династія ${i + 1}`, `Проведи ${v} Коронацій`, s => s.st.prestiges || 0, v, 5 + i * 3));
  [5,20,50].forEach((v, i) => add('crown' + i, `👑 Корони ${i + 1}`, `Накопич ${v} корон`, s => s.g.S.crowns || 0, v, 4 + i * 3));
  [5,25,100].forEach((v, i) => add('gob' + i, `👺 Гроза гоблінів ${i + 1}`, `Переможи ${v} гоблінів власноруч`, s => s.st.goblins || 0, v, 2 + i * 2));
  return A;
}

/* Форматування чисел: 12.3K / 4.5M */
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  const u = [['B', 1e9], ['M', 1e6], ['K', 1e3]];
  for (const [s, v] of u) if (n >= v) return (n / v).toFixed(n >= v * 100 ? 0 : 1).replace(/\.0$/, '') + s;
  return '' + n;
}
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return s + 'с';
  if (s < 3600) return Math.floor(s / 60) + 'хв ' + (s % 60 ? s % 60 + 'с' : '');
  return Math.floor(s / 3600) + 'г ' + Math.floor((s % 3600) / 60) + 'хв';
}
function costStr(cost) {
  return Object.entries(cost).map(([r, v]) => `${RES_META[r].icon}${fmt(v)}`).join(' ');
}
