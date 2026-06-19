'use strict';
// ═══════════════════════════════════════════════════════
//   HOLE EVOLUTION  v1.0.0
// ═══════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────
const CFG = {
  BASE_HOLE_SIZE: 30,
  LEVEL_TIME: 60,
  MAX_OFFLINE_HOURS: 12,
  OFFLINE_COINS_PER_SEC: 2,
  OBJECTS_PER_LEVEL: 40,
  BOSS_EVERY_N_LEVELS: 10,

  evolutions: [
    { id:0, name:'Сингулярність', color:'#9b59b6', glow:'#6c3483', bonus:'base', desc:'Базова чорна діра', icon:'⚫', pc:'#9b59b6' },
    { id:1, name:'Вогняна діра',  color:'#e74c3c', glow:'#c0392b', bonus:'speed',    bonusVal:0.20, desc:'+20% швидкість', icon:'🔴', pc:'#ff6b35', cost:{coins:5000,  stars:10} },
    { id:2, name:'Крижана діра',  color:'#3498db', glow:'#2980b9', bonus:'startSize',bonusVal:0.15, desc:'+15% початковий розмір', icon:'🔵', pc:'#74b9ff', cost:{coins:10000, stars:25} },
    { id:3, name:'Електрична',    color:'#f1c40f', glow:'#f39c12', bonus:'coins',    bonusVal:0.30, desc:'+30% монет', icon:'🟡', pc:'#fdcb6e', cost:{coins:25000, stars:50} },
    { id:4, name:'Космічна діра', color:'#2ecc71', glow:'#27ae60', bonus:'offline',  bonusVal:0.50, desc:'+50% офлайн', icon:'🟢', pc:'#00b894', cost:{coins:50000, stars:100} },
    { id:5, name:'Золота діра',   color:'#f39c12', glow:'#d68910', bonus:'all',      bonusVal:0.10, desc:'+10% до всього', icon:'🟠', pc:'#e17055', cost:{coins:100000,stars:200,gems:50} },
  ],

  worlds: [
    { id:0, name:'Місто',        icon:'🏙️', bg1:'#1a1a2e', bg2:'#16213e', cost:null,                desc:'Стартова карта' },
    { id:1, name:'Пляж',         icon:'🏖️', bg1:'#0d3b6e', bg2:'#1565c0', cost:{coins:10000,stars:20},  desc:'Пальми, човни, будівлі' },
    { id:2, name:'Ферма',        icon:'🌾', bg1:'#1a3a1a', bg2:'#2d5016', cost:{coins:30000,stars:50},  desc:'Трактори, сараї, поля' },
    { id:3, name:'Космос',       icon:'🌌', bg1:'#000011', bg2:'#0a0025', cost:{coins:75000,stars:100}, desc:'Астероїди та станції' },
    { id:4, name:'Вулканічний',  icon:'🌋', bg1:'#1a0a00', bg2:'#2d1500', cost:{coins:150000,stars:200},desc:'Лава та величезні скелі' },
    { id:5, name:'Майбутнє',     icon:'🚀', bg1:'#0a001a', bg2:'#1a0a3a', cost:{coins:300000,stars:500},desc:'Футуристичне місто' },
  ],

  worldObjects: {
    0:[
      {e:'🪙',n:'Монета',   s:14,t:1,c:1, w:30},{e:'🪨',n:'Камінь',  s:16,t:1,c:1, w:25},
      {e:'🍎',n:'Яблуко',   s:18,t:1,c:2, w:20},{e:'🌿',n:'Кущ',     s:22,t:1,c:2, w:15},
      {e:'🏮',n:'Ліхтар',   s:28,t:2,c:5, w:12},{e:'🚲',n:'Велосипед',s:34,t:2,c:8, w:10},
      {e:'🚗',n:'Авто',     s:50,t:3,c:15,w:8 },{e:'🚌',n:'Автобус', s:62,t:3,c:22,w:5 },
      {e:'🏠',n:'Будинок',  s:82,t:4,c:45,w:4 },{e:'🏢',n:'Офіс',    s:105,t:4,c:65,w:3},
      {e:'🏗️',n:'Хмарочос', s:145,t:5,c:110,w:2},{e:'🌉',n:'Острів', s:210,t:6,c:320,w:1},
    ],
    1:[
      {e:'🪙',n:'Монета',s:14,t:1,c:1,w:25},{e:'🐚',n:'Мушля',s:16,t:1,c:2,w:20},
      {e:'🦀',n:'Краб',  s:20,t:1,c:3,w:18},{e:'🌴',n:'Пальма',s:36,t:2,c:8,w:12},
      {e:'⛵',n:'Човен', s:55,t:3,c:22,w:8},{e:'🚢',n:'Корабель',s:90,t:4,c:65,w:5},
      {e:'🏨',n:'Готель',s:115,t:5,c:100,w:3},{e:'🏝️',n:'Острів',s:210,t:6,c:360,w:1},
    ],
    2:[
      {e:'🌾',n:'Пшениця',s:16,t:1,c:1,w:25},{e:'🐔',n:'Курка',s:20,t:1,c:2,w:22},
      {e:'🐄',n:'Корова', s:28,t:2,c:6,w:15},{e:'🌽',n:'Кукурудза',s:22,t:1,c:2,w:20},
      {e:'🚜',n:'Трактор',s:56,t:3,c:22,w:8},{e:'🏚️',n:'Сарай',s:82,t:4,c:55,w:5},
      {e:'🌳',n:'Сад',   s:115,t:5,c:95,w:3},{e:'🏘️',n:'Ферма',s:195,t:6,c:320,w:1},
    ],
    3:[
      {e:'⭐',n:'Зірка',    s:16,t:1,c:2,w:25},{e:'🌙',n:'Метеорит',s:22,t:1,c:3,w:20},
      {e:'🪨',n:'Астероїд', s:32,t:2,c:9,w:15},{e:'🛸',n:'НЛО',     s:60,t:3,c:28,w:8},
      {e:'🛰️',n:'Супутник', s:82,t:4,c:65,w:5},{e:'🚀',n:'Ракета',  s:115,t:5,c:110,w:3},
      {e:'🌍',n:'Планета',  s:215,t:6,c:410,w:1},
    ],
    4:[
      {e:'🔥',n:'Вогонь',s:16,t:1,c:2,w:28},{e:'🪨',n:'Скеля',s:24,t:1,c:3,w:22},
      {e:'💎',n:'Кристал',s:30,t:2,c:12,w:15},{e:'🐉',n:'Дракон',s:58,t:3,c:30,w:8},
      {e:'🌋',n:'Вулкан', s:92,t:4,c:75,w:5},{e:'🏔️',n:'Гора',s:135,t:5,c:125,w:3},
      {e:'🌍',n:'Лавовий острів',s:215,t:6,c:460,w:1},
    ],
    5:[
      {e:'🤖',n:'Нано-бот',s:16,t:1,c:3,w:25},{e:'💡',n:'Дрон',s:24,t:2,c:7,w:20},
      {e:'🔬',n:'Лабораторія',s:32,t:2,c:10,w:15},{e:'🚗',n:'Авто майбутнього',s:52,t:3,c:28,w:8},
      {e:'🏙️',n:'Нео-вежа',s:105,t:4,c:85,w:5},{e:'🚀',n:'Зорельот',s:155,t:5,c:155,w:3},
      {e:'🌐',n:'Місто майбутнього',s:230,t:6,c:520,w:1},
    ],
  },

  bosses:[
    {id:0,n:'Гігантський Робот',  e:'🤖',reqSize:160,reward:{coins:2000, stars:5, gems:1}, world:0,levelReq:10},
    {id:1,n:'Вулканічний Монстр', e:'🌋',reqSize:180,reward:{coins:4000, stars:10,gems:2}, world:4,levelReq:5},
    {id:2,n:'Космічний Корабель', e:'🛸',reqSize:200,reward:{coins:6000, stars:15,gems:3}, world:3,levelReq:5},
    {id:3,n:'Механічне Місто',    e:'🏙️',reqSize:220,reward:{coins:10000,stars:25,gems:5}, world:5,levelReq:5},
  ],

  upgrades:[
    {id:'speed',     name:'Швидкість',         icon:'💨',desc:'Швидкість руху діри',     max:20,base:100, mult:1.5,eff:0.05,type:'mul'},
    {id:'startSize', name:'Початковий розмір', icon:'⭕',desc:'Більший початковий розмір',max:15,base:200, mult:1.6,eff:2,   type:'add'},
    {id:'absorption',name:'Поглинання',        icon:'🌀',desc:'Швидше поглинання',        max:20,base:150, mult:1.5,eff:0.05,type:'mul'},
    {id:'coinBonus', name:'Монетний бонус',    icon:'🪙',desc:'Більше монет',              max:25,base:100, mult:1.4,eff:0.04,type:'mul'},
    {id:'timeBonus', name:'Час рівня',         icon:'⏱️',desc:'+10% часу за рівень',       max:10,base:500, mult:2.0,eff:0.10,type:'mul'},
    {id:'critChance',name:'Критичне поглинання',icon:'💥',desc:'Шанс x2 ресурсів',        max:15,base:300, mult:1.6,eff:0.02,type:'add'},
    {id:'magnetRange',name:'Магніт',           icon:'🧲',desc:'Притягує монети',           max:10,base:400, mult:1.7,eff:10,  type:'add'},
    {id:'offlineTime',name:'Офлайн час',       icon:'🌙',desc:'Макс офлайн +1 год',       max:12,base:1000,mult:1.8,eff:1,   type:'add'},
  ],

  cards:[
    {id:'speedCard',  n:'Прискорення',     r:'common',   e:'⚡',eff:'speed',    v:0.05,max:10},
    {id:'sizeCard',   n:'Велика діра',     r:'common',   e:'⭕',eff:'startSize',v:0.1, max:10},
    {id:'coinsCard',  n:'Золотий дощ',     r:'rare',     e:'💰',eff:'coins',    v:0.15,max:8},
    {id:'offlineCard',n:'Вічний прибуток', r:'rare',     e:'🌙',eff:'offline',  v:0.2, max:8},
    {id:'critCard',   n:'Критична сила',   r:'epic',     e:'💥',eff:'crit',     v:0.05,max:5},
    {id:'timeCard',   n:'Уповільнення часу',r:'epic',    e:'⏱️',eff:'time',     v:0.1, max:5},
    {id:'bossCard',   n:'Полювач босів',   r:'legendary',e:'👑',eff:'boss',     v:0.3, max:3},
    {id:'allCard',    n:'Всемогутність',   r:'legendary',e:'🌟',eff:'all',      v:0.05,max:3},
    {id:'magnetCard', n:'Магніт',          r:'common',   e:'🧲',eff:'magnet',   v:0.1, max:10},
    {id:'starCard',   n:'Зіркова злива',   r:'rare',     e:'⭐',eff:'stars',    v:0.15,max:8},
    {id:'gemCard',    n:'Діамантова удача',r:'epic',     e:'💎',eff:'gems',     v:0.1, max:5},
    {id:'worldCard',  n:'Дослідник',       r:'rare',     e:'🌍',eff:'worldBonus',v:0.2,max:8},
  ],

  rarityColor:{common:'#95a5a6',rare:'#3498db',epic:'#9b59b6',legendary:'#f39c12'},
  rarityName: {common:'Звичайна',rare:'Рідкісна',epic:'Епічна',legendary:'Легендарна'},
  rarityWeight:{common:55,rare:30,epic:12,legendary:3},

  dailyEvents:[
    {id:'doubleCoin',  n:'Подвійні монети',   desc:'x2 монет',              icon:'💰',dur:1800000},
    {id:'treasureHunt',n:'Полювання скарбів', desc:'Рідкісні скрині на карті',icon:'💎',dur:3600000},
    {id:'goldenObjects',n:'Золоті об\'єкти',  desc:'Золоті об\'єкти x5 монет',icon:'✨',dur:1800000},
    {id:'rareBoss',    n:'Рідкісний бос',     desc:'Особливий бос',          icon:'👑',dur:7200000},
    {id:'starRain',    n:'Зоряний дощ',       desc:'x3 зірки',               icon:'⭐',dur:3600000},
  ],

  achievements:(()=>{
    const A=(id,n,d,icon,r)=>({id,n,d,icon,r});
    return[
      A('a1','Перший ковток',     'Поглинути перший об\'єкт','⚫',{coins:50}),
      A('a2','Ненажера',          'Поглинути 100 об\'єктів','⚫',{coins:200}),
      A('a3','Завжди голодний',   'Поглинути 1 000 об\'єктів','⚫',{coins:500,stars:2}),
      A('a4','Жадібний монстр',   'Поглинути 10 000 об\'єктів','⚫',{coins:2000,stars:5}),
      A('a5','Космічна бездна',   'Поглинути 100 000 об\'єктів','⚫',{coins:10000,stars:20,gems:2}),
      A('a6','Маленька діра',     'Досягти розміру 50','📏',{coins:100}),
      A('a7','Середня діра',      'Досягти розміру 100','📏',{coins:300}),
      A('a8','Велика діра',       'Досягти розміру 200','📏',{coins:1000}),
      A('a9','Гігантська діра',   'Досягти розміру 500','📏',{coins:5000,stars:5}),
      A('a10','Нескінченна бездна','Досягти розміру 1000','📏',{coins:20000,stars:15,gems:3}),
      A('a11','Перші гроші',      'Заробити 100 монет','🪙',{stars:1}),
      A('a12','Багач',            'Заробити 10 000 монет','🪙',{stars:3}),
      A('a13','Мільйонер',        'Заробити 1 000 000 монет','🪙',{stars:10,gems:1}),
      A('a14','Мільярдер',        'Заробити 1 000 000 000 монет','🪙',{stars:50,gems:10}),
      A('a15','Перший крок',      'Пройти перший рівень','🌍',{coins:100}),
      A('a16','Дослідник міста',  'Пройти 10 рівнів Міста','🏙️',{coins:500,stars:2}),
      A('a17','Пляжний бос',      'Відкрити світ Пляж','🏖️',{coins:1000,stars:5}),
      A('a18','Фермер',           'Відкрити світ Ферма','🌾',{coins:2000,stars:8}),
      A('a19','Астронавт',        'Відкрити світ Космос','🌌',{coins:5000,stars:15}),
      A('a20','Вулканолог',       'Відкрити Вулканічний','🌋',{coins:10000,stars:25,gems:2}),
      A('a21','Гравець майбутнього','Відкрити Майбутнє','🚀',{coins:25000,stars:50,gems:5}),
      A('a22','Підкорювач всесвіту','Пройти всі світи','🌟',{coins:100000,stars:100,gems:20}),
      A('a23','Еволюція',         'Відкрити першу еволюцію','🌀',{coins:1000,stars:5}),
      A('a24','Вогненна сила',    'Відкрити Вогняну діру','🔴',{coins:2000,stars:8}),
      A('a25','Крижаний воїн',    'Відкрити Крижану діру','🔵',{coins:3000,stars:12}),
      A('a26','Електрична буря',  'Відкрити Електричну діру','🟡',{coins:5000,stars:20}),
      A('a27','Зоряний мандрівник','Відкрити Космічну діру','🟢',{coins:10000,stars:35}),
      A('a28','Золота легенда',   'Відкрити Золоту діру','🟠',{coins:25000,stars:75,gems:10}),
      A('a29','Колекціонер еволюцій','Відкрити всі еволюції','🌟',{coins:50000,stars:150,gems:25}),
      A('a30','Перший бос',       'Перемогти першого боса','👑',{coins:2000,stars:5}),
      A('a31','Боса мисливець',   'Перемогти 5 босів','👑',{coins:5000,stars:15}),
      A('a32','Руйнівник',        'Перемогти 20 босів','👑',{coins:15000,stars:40,gems:5}),
      A('a33','Легенда',          'Перемогти всіх унікальних босів','👑',{coins:50000,stars:100,gems:15}),
      A('a34','Перша картка',     'Отримати першу картку','🃏',{coins:100}),
      A('a35','Колекціонер',      'Отримати 10 карток','🃏',{coins:500,stars:2}),
      A('a36','Майстер карток',   'Отримати всі картки','🃏',{coins:5000,stars:25,gems:5}),
      A('a37','Максимум картки',  'Прокачати картку до макс','🃏',{coins:1000,stars:5}),
      A('a38','Перше покращення', 'Купити перше покращення','⬆️',{coins:100}),
      A('a39','Інвестор',         'Купити 20 покращень','⬆️',{coins:500,stars:3}),
      A('a40','Максималіст',      'Досягти макс рівня покращення','⬆️',{coins:2000,stars:10}),
      A('a41','День перший',      'Перший день гри','📅',{coins:100}),
      A('a42','Тижневий гравець', 'Грати 7 днів поспіль','📅',{coins:1000,stars:5}),
      A('a43','Місячний гравець', 'Грати 30 днів поспіль','📅',{coins:10000,stars:25,gems:5}),
      A('a44','Постійний гравець','Грати 100 днів поспіль','📅',{coins:50000,stars:100,gems:20}),
      A('a45','Пожирач монет',    'Поглинути 1 000 монет','🪙',{coins:200}),
      A('a46','Авто-пожирач',     'Поглинути 100 автомобілів','🚗',{coins:500,stars:2}),
      A('a47','Руйнівник будівель','Поглинути 50 будинків','🏠',{coins:1000,stars:5}),
      A('a48','Нищитель хмарочосів','Поглинути 25 хмарочосів','🏗️',{coins:2000,stars:10}),
      A('a49','Їдець островів',   'Поглинути 10 островів','🌉',{coins:5000,stars:20}),
      A('a50','Блискавка',        'Пройти рівень за 45 с','⚡',{coins:300,stars:2}),
      A('a51','Швидкісний пожирач','Поглинути 20 об\'єктів за 10 с','⚡',{coins:500,stars:3}),
      A('a52','Нічний жнець',     'Отримати офлайн нагороду','🌙',{coins:200}),
      A('a53','Спокійний сон',    'Отримати 12 год офлайн','🌙',{coins:1000,stars:5}),
      A('a54','Комбо x5',         'Поглинути 5 об\'єктів підряд','🔥',{coins:100}),
      A('a55','Комбо x10',        'Поглинути 10 об\'єктів підряд','🔥',{coins:300}),
      A('a56','Комбо x20',        'Поглинути 20 об\'єктів підряд','🔥',{coins:1000,stars:3}),
      A('a57','Комбо x50',        'Поглинути 50 об\'єктів підряд','🔥',{coins:5000,stars:10}),
      A('a58','Новачок',          'Пройти рівень 5','🏆',{coins:200}),
      A('a59','Досвідчений',      'Пройти рівень 10','🏆',{coins:500,stars:3}),
      A('a60','Ветеран',          'Пройти рівень 25','🏆',{coins:2000,stars:10}),
      A('a61','Майстер',          'Пройти рівень 50','🏆',{coins:10000,stars:25,gems:3}),
      A('a62','Гросмейстер',      'Пройти рівень 100','🏆',{coins:50000,stars:75,gems:10}),
      A('a63','Зіркочет',         'Зібрати 10 зірок','⭐',{coins:500}),
      A('a64','Зіркова колекція', 'Зібрати 100 зірок','⭐',{coins:2000,gems:1}),
      A('a65','Зоряний бог',      'Зібрати 1 000 зірок','⭐',{coins:20000,gems:5}),
      A('a66','Перший кристал',   'Отримати перший самоцвіт','💎',{coins:500,stars:5}),
      A('a67','Коштовний',        'Зібрати 25 самоцвітів','💎',{coins:5000,stars:20}),
      A('a68','Діамантовий',      'Зібрати 100 самоцвітів','💎',{coins:25000,stars:75}),
      A('a69','Пляжний відпочинок','Пройти 5 рівнів на Пляжі','🏖️',{coins:1000,stars:5}),
      A('a70','Фермер-гравець',   'Пройти 5 рівнів на Фермі','🌾',{coins:1500,stars:7}),
      A('a71','Космонавт',        'Пройти 5 рівнів у Космосі','🌌',{coins:3000,stars:12}),
      A('a72','Вулканічний герой','Пройти 5 рівнів у Вулканічному','🌋',{coins:5000,stars:20}),
      A('a73','Мандрівник майбутнього','Пройти 5 рівнів у Майбутньому','🚀',{coins:10000,stars:35}),
      A('a74','Ідеальний рівень', 'Пройти рівень з 3 зірками','✨',{coins:500,stars:3}),
      A('a75','Перфекціоніст',    'Пройти 10 рівнів ідеально','✨',{coins:5000,stars:15}),
      A('a76','Вечірній гравець', 'Грати після 22:00','🌃',{coins:200}),
      A('a77','Ранній птах',      'Грати до 8:00','🌅',{coins:200}),
      A('a78','Перші витрати',    'Витратити 1 000 монет','💸',{stars:2}),
      A('a79','Великий витратник','Витратити 100 000 монет','💸',{stars:10,gems:2}),
      A('a80','Мільйонер-витратник','Витратити 1 000 000 монет','💸',{stars:50,gems:10}),
      A('a81','Пропускний гравець','Активувати бойовий пропуск','🎫',{coins:1000,stars:10}),
      A('a82','Пропускний майстер','Завершити бойовий пропуск','🎫',{coins:10000,stars:50,gems:10}),
      A('a83','Виконавець',       'Виконати 10 місій','📋',{coins:500,stars:3}),
      A('a84','Місіонер',         'Виконати 50 місій','📋',{coins:3000,stars:15}),
      A('a85','Майстер місій',    'Виконати 200 місій','📋',{coins:15000,stars:50,gems:5}),
      A('a86','Перша подія',      'Взяти участь у щоденній події','📅',{coins:300}),
      A('a87','Мисливець скарбів','Знайти 10 скарбів','💎',{coins:1000,stars:5}),
      A('a88','Золотий збирач',   'Зібрати 100 золотих об\'єктів','✨',{coins:2000,stars:10}),
      A('a89','Перевіряльник',    'Відкрити екран досягнень','🏆',{coins:50}),
      A('a90','Стратег',          'Відкрити покращення 10 разів','📊',{coins:200}),
      A('a91','Базовий гравець',  'Відвідати базу 10 разів','🏠',{coins:100}),
      A('a92','Магніт монет',     'Поглинути 500 монет за рівень','🪙',{coins:500,stars:3}),
      A('a93','Сила тяжіння',     'Досягти розміру 300 за рівень','⚫',{coins:1000,stars:5}),
      A('a94','Невгамовний',      'Пройти 10 рівнів підряд','🎮',{coins:500,stars:3}),
      A('a95','Всепоглинаючий',   'Поглинути об\'єкт 6 рівня','🌉',{coins:5000,stars:15}),
      A('a96','Критичний успіх',  'Отримати критичне поглинання','💥',{coins:200,stars:1}),
      A('a97','Серійний критик',  'Отримати 100 критичних поглинань','💥',{coins:2000,stars:8}),
      A('a98','Незупинний',       'Грати 1 годину без перерви','⏱️',{coins:1000,stars:5}),
      A('a99','Самородок',        'Знайти золотий об\'єкт','🌟',{coins:500,stars:2}),
      A('a100','Повелитель діри', 'Відкрити всі еволюції та світи','🌌',{coins:100000,stars:200,gems:50}),
      A('a101','Мега-комбо',      'Поглинути 100 об\'єктів підряд','💫',{coins:10000,stars:20,gems:2}),
      A('a102','Гіга-діра',       'Досягти максимального розміру','🕳️',{coins:50000,stars:100,gems:15}),
      A('a103','Фінансовий геній','Накопичити 10 000 000 монет','🏦',{stars:100,gems:20}),
      A('a104','Зоряний бос',     'Зібрати 5 000 зірок','⭐',{coins:100000,gems:25}),
      A('a105','Діамантовий бос', 'Зібрати 500 самоцвітів','💎',{coins:500000,stars:500}),
    ];
  })(),
};

// ──────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndInt=(a,b)=>Math.floor(rnd(a,b+1));
const dist2=(ax,ay,bx,by)=>(ax-bx)**2+(ay-by)**2;

function fmt(n){
  if(n>=1e12)return(n/1e12).toFixed(1)+'T';
  if(n>=1e9) return(n/1e9).toFixed(1)+'B';
  if(n>=1e6) return(n/1e6).toFixed(1)+'M';
  if(n>=1e3) return(n/1e3).toFixed(1)+'K';
  return Math.floor(n).toString();
}
function fmtTime(ms){
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);
  if(h>0)return`${h}г ${m%60}хв`;
  if(m>0)return`${m}хв ${s%60}с`;
  return`${s}с`;
}
function weightedRandom(items,weightKey){
  const total=items.reduce((s,i)=>s+i[weightKey],0);
  let r=Math.random()*total;
  for(const it of items){r-=it[weightKey];if(r<=0)return it;}
  return items[items.length-1];
}
function pickRarity(){
  const w=CFG.rarityWeight;
  const t=w.common+w.rare+w.epic+w.legendary;
  let r=Math.random()*t;
  if((r-=w.common)<=0)return'common';
  if((r-=w.rare)<=0)return'rare';
  if((r-=w.epic)<=0)return'epic';
  return'legendary';
}

// ──────────────────────────────────────────────────────
// SAVE SYSTEM
// ──────────────────────────────────────────────────────
const SAVE_KEY='holeevo_v1';
function defaultState(){
  return{
    coins:0,stars:0,gems:0,
    totalCoinsEarned:0,totalCoinsSpent:0,
    currentEvolution:0,
    unlockedEvolutions:[0],
    unlockedWorlds:[0],
    worldLevels:{0:1,1:1,2:1,3:1,4:1,5:1},
    currentWorld:0,
    upgrades:{speed:0,startSize:0,absorption:0,coinBonus:0,timeBonus:0,critChance:0,magnetRange:0,offlineTime:0},
    cards:{},
    achievements:{},
    stats:{
      objectsAbsorbed:0,totalLevelsPlayed:0,bossesDefeated:0,
      maxSize:0,maxCombo:0,critHits:0,
      objectsByType:{},worldLevelsMap:{0:0,1:0,2:0,3:0,4:0,5:0},
      perfectLevels:0,consecutiveLevels:0,
      goldenFound:0,treasuresFound:0,
    },
    lastOnline:Date.now(),
    firstPlay:Date.now(),
    streakDays:1,lastStreakDate:'',
    settings:{sound:true,music:true,vibro:true},
    dailyEventActive:null,
    dailyEventEnd:0,
    missionsCompleted:0,
    playTimeMs:0,
    sessionStart:Date.now(),
    battlePassActive:false,
    battlePassProgress:0,
  };
}
function saveGame(state){
  try{ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }catch(e){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return defaultState();
    const s=JSON.parse(raw);
    const def=defaultState();
    // Merge missing keys
    return Object.assign({},def,s,{stats:Object.assign({},def.stats,s.stats||{}),settings:Object.assign({},def.settings,s.settings||{})});
  }catch(e){return defaultState();}
}

// ──────────────────────────────────────────────────────
// AUDIO MANAGER (Web Audio API)
// ──────────────────────────────────────────────────────
class AudioManager{
  constructor(){
    this.ctx=null;this.musicGain=null;this.sfxGain=null;
    this.enabled={sound:true,music:true};
    this.musicOsc=null;this.musicInterval=null;
  }
  init(){
    try{
      this.ctx=new(window.AudioContext||window.webkitAudioContext)();
      this.sfxGain=this.ctx.createGain();this.sfxGain.connect(this.ctx.destination);
      this.musicGain=this.ctx.createGain();this.musicGain.gain.value=0.15;this.musicGain.connect(this.ctx.destination);
    }catch(e){}
  }
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();}
  beep(freq,dur,type='sine',vol=0.3){
    if(!this.ctx||!this.enabled.sound)return;
    try{
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=type;o.frequency.value=freq;
      g.gain.setValueAtTime(vol,this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+dur);
      o.connect(g);g.connect(this.sfxGain);
      o.start();o.stop(this.ctx.currentTime+dur);
    }catch(e){}
  }
  absorb(){this.beep(300,0.08,'sine',0.2);setTimeout(()=>this.beep(500,0.06,'sine',0.15),60);}
  bigAbsorb(){this.beep(200,0.15,'sawtooth',0.3);setTimeout(()=>this.beep(400,0.1,'sine',0.2),100);}
  levelUp(){[440,550,660,880].forEach((f,i)=>setTimeout(()=>this.beep(f,0.1,'sine',0.25),i*80));}
  bossKill(){[300,250,200,150,300,500].forEach((f,i)=>setTimeout(()=>this.beep(f,0.12,'sawtooth',0.3),i*100));}
  unlock(){[440,550,660].forEach((f,i)=>setTimeout(()=>this.beep(f,0.12,'sine',0.2),i*100));}
  click(){this.beep(800,0.04,'sine',0.1);}
  startMusic(){
    if(!this.ctx||!this.enabled.music)return;
    const notes=[130.81,146.83,164.81,174.61,196,220,246.94];
    let i=0;
    this.stopMusic();
    this.musicInterval=setInterval(()=>{
      if(!this.enabled.music)return;
      try{
        const o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type='sine';o.frequency.value=notes[i%notes.length];
        g.gain.setValueAtTime(0.06,this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.5);
        o.connect(g);g.connect(this.musicGain);
        o.start();o.stop(this.ctx.currentTime+0.5);
        i++;
      }catch(e){}
    },600);
  }
  stopMusic(){if(this.musicInterval){clearInterval(this.musicInterval);this.musicInterval=null;}}
  setSound(on){this.enabled.sound=on;if(!on){}}
  setMusic(on){this.enabled.music=on;on?this.startMusic():this.stopMusic();}
}

// ──────────────────────────────────────────────────────
// PARTICLE SYSTEM
// ──────────────────────────────────────────────────────
class Particle{
  constructor(x,y,vx,vy,color,size,life){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;
    this.color=color;this.size=size;this.life=life;this.maxLife=life;
    this.alpha=1;
  }
  update(dt){
    this.x+=this.vx*dt;this.y+=this.vy*dt;
    this.vy+=200*dt;
    this.life-=dt;
    this.alpha=this.life/this.maxLife;
    this.size*=0.98;
    return this.life>0;
  }
  draw(ctx){
    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.beginPath();ctx.arc(this.x,this.y,Math.max(0,this.size),0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
class TextParticle{
  constructor(x,y,text,color){
    this.x=x;this.y=y;this.text=text;this.color=color;
    this.vy=-80;this.life=1.2;this.maxLife=1.2;this.alpha=1;
    this.scale=1.5;
  }
  update(dt){
    this.y+=this.vy*dt;this.vy*=0.94;
    this.life-=dt;this.alpha=this.life/this.maxLife;
    this.scale=lerp(1,this.scale,0.9);
    return this.life>0;
  }
  draw(ctx){
    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.font=`bold ${Math.round(20*this.scale)}px Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=this.color;ctx.shadowBlur=8;
    ctx.fillText(this.text,this.x,this.y);
    ctx.restore();
  }
}
class ParticleSystem{
  constructor(){this.particles=[];this.texts=[];}
  emit(x,y,color,count=8,speed=100){
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2;
      const v=rnd(20,speed);
      this.particles.push(new Particle(x,y,Math.cos(angle)*v,Math.sin(angle)*v-50,color,rnd(3,8),rnd(0.4,0.9)));
    }
  }
  emitText(x,y,text,color='#f1c40f'){this.texts.push(new TextParticle(x,y,text,color));}
  update(dt){
    this.particles=this.particles.filter(p=>p.update(dt));
    this.texts=this.texts.filter(t=>t.update(dt));
  }
  draw(ctx){
    this.particles.forEach(p=>p.draw(ctx));
    this.texts.forEach(t=>t.draw(ctx));
  }
  clear(){this.particles=[];this.texts=[];}
}

// ──────────────────────────────────────────────────────
// STAR FIELD (background)
// ──────────────────────────────────────────────────────
class StarField{
  constructor(w,h){
    this.stars=[];
    for(let i=0;i<80;i++){
      this.stars.push({x:Math.random()*w,y:Math.random()*h,r:rnd(0.5,2.5),a:rnd(0.2,0.9),v:rnd(10,40)});
    }
  }
  update(dt){
    this.stars.forEach(s=>{s.y+=s.v*dt;if(s.y>700)s.y=-5;});
  }
  draw(ctx,w,h){
    this.stars.forEach(s=>{
      ctx.save();ctx.globalAlpha=s.a;ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();ctx.restore();
    });
  }
}

// ──────────────────────────────────────────────────────
// WORLD OBJECT
// ──────────────────────────────────────────────────────
class WorldObject{
  constructor(cfg,x,y,scaleMult=1,isGolden=false){
    this.cfg=cfg;
    this.x=x;this.y=y;
    this.baseSize=cfg.s*scaleMult;
    this.size=this.baseSize;
    this.isGolden=isGolden;
    this.absorbing=false;
    this.absorbProgress=0;
    this.wobble=Math.random()*Math.PI*2;
    this.wobbleSpeed=rnd(1,2.5);
    this.alive=true;
    this.vx=rnd(-15,15);
    this.vy=rnd(-15,15);
  }
  update(dt){
    this.wobble+=this.wobbleSpeed*dt;
    if(this.absorbing){
      this.absorbProgress+=dt*2.5;
      this.size=this.baseSize*(1-this.absorbProgress*0.5);
      if(this.absorbProgress>=1)this.alive=false;
    }
  }
  draw(ctx){
    if(!this.alive)return;
    ctx.save();
    const wobbleY=Math.sin(this.wobble)*2;
    ctx.translate(this.x,this.y+wobbleY);
    if(this.isGolden){
      ctx.shadowColor='#f1c40f';ctx.shadowBlur=16;
      // Gold outline
      ctx.globalAlpha=0.4+0.2*Math.sin(this.wobble*2);
      ctx.fillStyle='#f1c40f';
      ctx.beginPath();ctx.arc(0,0,this.size/1.6,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
    if(this.absorbing){
      ctx.globalAlpha=1-this.absorbProgress*0.5;
      const scale=1-this.absorbProgress*0.3;
      ctx.scale(scale,scale);
    }
    ctx.font=`${Math.max(8,this.size)}px Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(this.cfg.e,0,0);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────
// BOSS
// ──────────────────────────────────────────────────────
class Boss{
  constructor(cfg,x,y){
    this.cfg=cfg;
    this.x=x;this.y=y;
    this.size=cfg.reqSize*0.8;
    this.maxHp=cfg.reqSize;
    this.hp=this.maxHp;
    this.alive=true;
    this.wobble=0;
    this.vx=rnd(-30,30);
    this.vy=rnd(-30,30);
    this.speed=40;
    this.bouncing=false;
  }
  update(dt,W,H){
    this.wobble+=dt*1.5;
    this.x+=this.vx*dt;
    this.y+=this.vy*dt;
    if(this.x<this.size){this.x=this.size;this.vx=Math.abs(this.vx);}
    if(this.x>W-this.size){this.x=W-this.size;this.vx=-Math.abs(this.vx);}
    if(this.y<this.size){this.y=this.size;this.vy=Math.abs(this.vy);}
    if(this.y>H-this.size){this.y=H-this.size;this.vy=-Math.abs(this.vy);}
  }
  draw(ctx){
    ctx.save();
    ctx.translate(this.x,this.y);
    // Boss glow
    const pulse=0.85+0.15*Math.sin(this.wobble*3);
    ctx.shadowColor='#e74c3c';ctx.shadowBlur=30*pulse;
    // HP bar behind boss
    const bw=this.size*2;
    ctx.fillStyle='#33333388';
    ctx.fillRect(-bw/2,this.size+4,bw,8);
    ctx.fillStyle='#e74c3c';
    ctx.fillRect(-bw/2,this.size+4,bw*(this.hp/this.maxHp),8);
    // Boss emoji
    ctx.font=`${this.size*1.4}px Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(this.cfg.e,0,0);
    // Boss name
    ctx.shadowBlur=0;ctx.fillStyle='#fff';
    ctx.font=`bold 14px Arial`;
    ctx.fillText(this.cfg.n,0,-this.size-10);
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────
// HOLE (player)
// ──────────────────────────────────────────────────────
class Hole{
  constructor(x,y,startRadius,evo){
    this.x=x;this.y=y;
    this.radius=startRadius;
    this.targetX=x;this.targetY=y;
    this.evo=evo;
    this.angle=0;
    this.growAnim=0;
    this.speed=200;
  }
  setTarget(x,y){this.targetX=x;this.targetY=y;}
  update(dt,speed){
    const dx=this.targetX-this.x,dy=this.targetY-this.y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d>2){
      const s=Math.min(speed,d/dt)*dt;
      this.x+=dx/d*s;this.y+=dy/d*s;
    }
    this.angle+=dt*1.5;
    if(this.growAnim>0)this.growAnim-=dt*3;
  }
  grow(amount){this.radius+=amount;this.growAnim=1;}
  draw(ctx){
    const evo=CFG.evolutions[this.evo];
    const pulse=1+0.04*Math.sin(Date.now()*0.003);
    const R=this.radius*(1+this.growAnim*0.15)*pulse;

    // Outer glow ring
    const outerGlow=ctx.createRadialGradient(this.x,this.y,R*0.6,this.x,this.y,R*2);
    outerGlow.addColorStop(0,evo.color+'60');
    outerGlow.addColorStop(1,'transparent');
    ctx.fillStyle=outerGlow;
    ctx.beginPath();ctx.arc(this.x,this.y,R*2,0,Math.PI*2);ctx.fill();

    // Black hole body
    const holeGrad=ctx.createRadialGradient(this.x-R*0.25,this.y-R*0.25,0,this.x,this.y,R);
    holeGrad.addColorStop(0,'#2c0a3a');
    holeGrad.addColorStop(0.6,'#0a0015');
    holeGrad.addColorStop(1,'#000');
    ctx.fillStyle=holeGrad;
    ctx.beginPath();ctx.arc(this.x,this.y,R,0,Math.PI*2);ctx.fill();

    // Inner shimmer
    ctx.save();
    ctx.beginPath();ctx.arc(this.x,this.y,R,0,Math.PI*2);ctx.clip();
    const shimmer=ctx.createRadialGradient(this.x-R*0.3,this.y-R*0.3,0,this.x,this.y,R);
    shimmer.addColorStop(0,evo.color+'30');shimmer.addColorStop(1,'transparent');
    ctx.fillStyle=shimmer;ctx.fillRect(this.x-R,this.y-R,R*2,R*2);
    ctx.restore();

    // Rotating accretion ring
    ctx.save();
    ctx.translate(this.x,this.y);ctx.rotate(this.angle);
    ctx.strokeStyle=evo.color;ctx.lineWidth=2.5;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.ellipse(0,0,R*1.3,R*0.35,0,0,Math.PI*2);ctx.stroke();
    ctx.rotate(Math.PI*0.4);ctx.globalAlpha=0.4;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,R*1.5,R*0.25,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
}

// ──────────────────────────────────────────────────────
// GAME SCREEN (canvas gameplay)
// ──────────────────────────────────────────────────────
class GameScreen{
  constructor(game){
    this.game=game;
    this.canvas=document.getElementById('gameCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.W=0;this.H=0;
    this.hole=null;
    this.objects=[];
    this.boss=null;
    this.particles=new ParticleSystem();
    this.starField=null;
    this.timeLeft=60;
    this.score=0;
    this.combo=0;
    this.comboTimer=0;
    this.running=false;
    this.paused=false;
    this.isBossLevel=false;
    this.coinMagnets=[];
    this.spawnTimer=0;
    this.spawnInterval=1.5;
    this.perfectLevel=true;
    this.levelCoinsCollected=0;
    this.levelCrits=0;
    this.sessionObjects=0;
    this._touch={active:false,x:0,y:0};
    this._lastTime=0;
    this._raf=null;
    this._boundLoop=this._loop.bind(this);
    this._setupInput();
  }

  resize(){
    this.W=this.canvas.width=window.innerWidth;
    this.H=this.canvas.height=window.innerHeight;
    if(this.starField)this.starField=new StarField(this.W,this.H);
  }

  _setupInput(){
    const c=this.canvas;
    c.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];this._touch={active:true,x:t.clientX,y:t.clientY};this.game.audio.resume();},{passive:false});
    c.addEventListener('touchmove', e=>{e.preventDefault();const t=e.touches[0];this._touch={active:true,x:t.clientX,y:t.clientY};},{passive:false});
    c.addEventListener('touchend',  e=>{e.preventDefault();this._touch.active=false;},{passive:false});
    c.addEventListener('mousedown', e=>{this._touch={active:true,x:e.clientX,y:e.clientY};});
    c.addEventListener('mousemove', e=>{if(this._touch.active)this._touch={active:true,x:e.clientX,y:e.clientY};});
    c.addEventListener('mouseup',   ()=>{this._touch.active=false;});
  }

  start(worldId,level,isBoss){
    this.running=true;this.paused=false;
    this.score=0;this.combo=0;this.comboTimer=0;
    this.objects=[];this.boss=null;
    this.particles.clear();
    this.spawnTimer=0;this.spawnInterval=1.2;
    this.isBossLevel=isBoss;
    this.perfectLevel=true;
    this.levelCoinsCollected=0;this.levelCrits=0;this.sessionObjects=0;
    this.worldId=worldId;this.level=level;

    const st=this.game.state;
    const upgSpeed=this.game.getUpgradeValue('speed');
    const upgSize=this.game.getUpgradeValue('startSize');
    const evoBonus=this.game.getEvoBonus();
    let startRadius=CFG.BASE_HOLE_SIZE+upgSize;
    if(evoBonus.startSize)startRadius*=(1+evoBonus.startSize);
    this.resize();
    this.starField=new StarField(this.W,this.H);
    this.hole=new Hole(this.W/2,this.H/2,startRadius,st.currentEvolution);
    this.hole.speed=(200+200*upgSpeed)*(evoBonus.speed?1+evoBonus.speed:1);

    let basetime=CFG.LEVEL_TIME*(1+this.game.getUpgradeValue('timeBonus'));
    if(evoBonus.all)basetime*=(1+evoBonus.all);
    this.timeLeft=basetime;

    if(isBoss){
      const bossWorld=CFG.bosses.find(b=>b.world===worldId)||CFG.bosses[0];
      this.boss=new Boss(bossWorld,this.W/2,this.H*0.3);
      this._spawnInitialObjects(6);
    } else {
      this._spawnInitialObjects(15);
    }

    this._lastTime=performance.now();
    if(this._raf)cancelAnimationFrame(this._raf);
    this._raf=requestAnimationFrame(this._boundLoop);
  }

  stop(){
    this.running=false;
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
  }

  _spawnInitialObjects(count){
    for(let i=0;i<count;i++){
      const x=rnd(60,this.W-60),y=rnd(80,this.H-80);
      this._spawnObject(x,y);
    }
  }

  _spawnObject(x,y){
    const cfgList=CFG.worldObjects[this.worldId]||CFG.worldObjects[0];
    const holeR=this.hole?this.hole.radius:30;
    // Only spawn objects up to 3x current hole size
    const eligible=cfgList.filter(o=>o.s<=holeR*3.5);
    if(eligible.length===0)return;
    const cfg=weightedRandom(eligible,i=>i.w);
    const golden=this.game.state.dailyEventActive==='goldenObjects'&&Math.random()<0.15;
    const scaleMult=1+this.level*0.03;
    this.objects.push(new WorldObject(cfg,x,y,scaleMult,golden));
  }

  _loop(ts){
    if(!this.running)return;
    const dt=Math.min((ts-this._lastTime)/1000,0.05);
    this._lastTime=ts;
    if(!this.paused){
      this._update(dt);
      this._draw();
    }
    this._raf=requestAnimationFrame(this._boundLoop);
  }

  _update(dt){
    // Move hole
    if(this._touch.active&&this.hole){
      this.hole.setTarget(this._touch.x,this._touch.y);
    }
    this.hole.update(dt,this.hole.speed);

    // Timer
    this.timeLeft-=dt;
    if(this.timeLeft<=0){this.timeLeft=0;this._endLevel(false);return;}

    // Combo timer
    if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0){this.combo=0;document.getElementById('hud-combo').style.display='none';}}

    // Spawn
    this.spawnTimer+=dt;
    if(this.spawnTimer>=this.spawnInterval&&this.objects.length<CFG.OBJECTS_PER_LEVEL){
      this.spawnTimer=0;
      const side=rndInt(0,3);
      let x,y;
      if(side===0){x=rnd(0,this.W);y=-40;}
      else if(side===1){x=this.W+40;y=rnd(0,this.H);}
      else if(side===2){x=rnd(0,this.W);y=this.H+40;}
      else{x=-40;y=rnd(0,this.H);}
      this._spawnObject(x,y);
    }

    // Update objects
    this.objects.forEach(o=>o.update(dt));
    this.objects=this.objects.filter(o=>o.alive);

    // Collision: hole vs objects
    for(const obj of this.objects){
      if(obj.absorbing)continue;
      if(obj.size<=this.hole.radius*1.0){
        const d2=dist2(this.hole.x,this.hole.y,obj.x,obj.y);
        const absorb_dist=this.hole.radius*0.9;
        if(d2<absorb_dist*absorb_dist){
          this._absorb(obj);
        }
      }
    }

    // Boss collision
    if(this.boss&&this.boss.alive){
      this.boss.update(dt,this.W,this.H);
      if(this.hole.radius>=this.boss.cfg.reqSize){
        const d2=dist2(this.hole.x,this.hole.y,this.boss.x,this.boss.y);
        const threshold=this.hole.radius+this.boss.size*0.5;
        if(d2<threshold*threshold){
          this.boss.hp-=this.hole.radius*dt*2;
          this.particles.emit(this.boss.x+rnd(-30,30),this.boss.y+rnd(-30,30),'#e74c3c',3,80);
          if(this.boss.hp<=0){
            this.boss.alive=false;
            this._killBoss();
            return;
          }
        }
      }
    }

    // Stars / bg particles
    this.starField.update(dt);
    this.particles.update(dt);

    // Update HUD
    this._updateHUD();
  }

  _absorb(obj){
    obj.absorbing=true;
    this.sessionObjects++;
    this.game.state.stats.objectsAbsorbed++;

    // Coins
    let coins=obj.cfg.c;
    const coinMult=1+this.game.getUpgradeValue('coinBonus');
    const evoBonus=this.game.getEvoBonus();
    if(evoBonus.coins)coins*=(1+evoBonus.coins);
    if(evoBonus.all)coins*=(1+evoBonus.all);
    if(obj.isGolden)coins*=5;
    coins*=coinMult;

    // Crit
    const critChance=this.game.getUpgradeValue('critChance');
    let isCrit=false;
    if(Math.random()<critChance){coins*=2;isCrit=true;this.game.state.stats.critHits++;this.levelCrits++;}

    coins=Math.ceil(coins);

    // Event multiplier
    if(this.game.state.dailyEventActive==='doubleCoin')coins*=2;
    if(this.game.state.dailyEventActive==='starRain'){}

    this.score+=coins;
    this.game.state.coins+=coins;
    this.game.state.totalCoinsEarned+=coins;
    this.levelCoinsCollected+=coins;

    // Grow
    const growAmt=(obj.size/60)*0.5*(1+this.game.getUpgradeValue('absorption')*0.5);
    this.hole.grow(growAmt);
    if(this.hole.radius>this.game.state.stats.maxSize)this.game.state.stats.maxSize=this.hole.radius;

    // Combo
    this.combo++;this.comboTimer=2.5;
    if(this.combo>this.game.state.stats.maxCombo)this.game.state.stats.maxCombo=this.combo;

    // Track object type
    const stats=this.game.state.stats;
    stats.objectsByType[obj.cfg.n]=(stats.objectsByType[obj.cfg.n]||0)+1;
    if(obj.isGolden)stats.goldenFound++;

    // Particles
    const evo=CFG.evolutions[this.game.state.currentEvolution];
    this.particles.emit(obj.x,obj.y,evo.pc,obj.size>50?12:6,obj.size>50?120:70);
    if(isCrit){this.particles.emitText(obj.x,obj.y,'КРИТ! x2','#e74c3c');}
    else if(obj.isGolden){this.particles.emitText(obj.x,obj.y,'⭐ x5','#f1c40f');}
    else if(coins>50){this.particles.emitText(obj.x,obj.y,`+${fmt(coins)}`,'#f1c40f');}

    if(obj.cfg.t>=4){this.game.audio.bigAbsorb();}
    else{this.game.audio.absorb();}

    // Vibrate
    if(this.game.state.settings.vibro&&window.AndroidBridge){
      try{window.AndroidBridge.vibrate(obj.cfg.t>=4?50:20);}catch(e){}
    }

    // Achievements
    this.game.achSys.check(this.game.state,this.game);
  }

  _killBoss(){
    const reward=this.boss.cfg.reward;
    this.game.state.coins+=reward.coins;this.game.state.totalCoinsEarned+=reward.coins;
    this.game.state.stars+=reward.stars||0;
    this.game.state.gems+=reward.gems||0;
    this.game.state.stats.bossesDefeated++;
    this.game.audio.bossKill();
    this.particles.emit(this.boss.x,this.boss.y,'#f1c40f',30,150);
    this.particles.emit(this.boss.x,this.boss.y,'#e74c3c',20,120);
    setTimeout(()=>this._showBossResult(reward),800);
  }

  _showBossResult(reward){
    this.stop();
    document.getElementById('boss-result-name').textContent=this.boss.cfg.n;
    const rEl=document.getElementById('boss-result-rewards');
    rEl.innerHTML=`
      <div class="reward-row">🪙 <b>${fmt(reward.coins)} монет</b></div>
      <div class="reward-row">⭐ <b>${reward.stars} зірок</b></div>
      ${reward.gems?`<div class="reward-row">💎 <b>${reward.gems} самоцвітів</b></div>`:''}
    `;
    this.game.achSys.check(this.game.state,this.game);
    this.game.saveState();
    this.game.showScreen('screen-boss-result');
  }

  _endLevel(timeout){
    this.running=false;
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}

    const st=this.game.state;
    st.stats.totalLevelsPlayed++;
    st.stats.consecutiveLevels++;

    // Stars rating
    const pct=this.hole.radius/(CFG.BASE_HOLE_SIZE*8);
    let stars=1;if(pct>0.4)stars=2;if(pct>0.7)stars=3;
    if(stars===3)st.stats.perfectLevels++;

    // Stars reward
    let starsEarned=stars;
    if(st.dailyEventActive==='starRain')starsEarned*=3;
    st.stars+=starsEarned;

    // Card drop (20% chance)
    let cardDrop=null;
    if(Math.random()<0.2){
      const rarity=pickRarity();
      const pool=CFG.cards.filter(c=>c.r===rarity);
      if(pool.length>0){
        const card=pool[rndInt(0,pool.length-1)];
        if(!st.cards[card.id])st.cards[card.id]={level:1,count:1};
        else st.cards[card.id].count++;
        cardDrop=card;
        this.game.achSys.check(st,this.game);
      }
    }

    this.game.achSys.check(st,this.game);
    this.game.saveState();

    // Show result screen
    document.getElementById('result-title').textContent=stars===3?'ІДЕАЛЬНО! ⭐⭐⭐':(stars===2?'ДОБРЕ! ⭐⭐':'РІВЕНЬ ПРОЙДЕНО! ⭐');
    document.getElementById('result-stars').textContent='⭐'.repeat(stars);
    document.getElementById('result-rewards').innerHTML=`
      <div class="reward-row">🪙 <b>${fmt(this.score)} монет</b></div>
      <div class="reward-row">⭐ <b>${starsEarned} зір${starsEarned===1?'ка':starsEarned<5?'ки':'ок'}</b></div>
      <div class="reward-row">📏 Розмір: <b>${Math.round(this.hole.radius)}</b></div>
      <div class="reward-row">🌀 Поглинуто: <b>${this.sessionObjects} об'єктів</b></div>
    `;
    const cardEl=document.getElementById('result-card');
    if(cardDrop){
      cardEl.style.display='block';
      document.getElementById('result-card-info').innerHTML=`${cardDrop.e} <span style="color:${CFG.rarityColor[cardDrop.r]}">${cardDrop.n}</span>`;
    }else{cardEl.style.display='none';}
    this.game.showScreen('screen-result');
  }

  _draw(){
    const ctx=this.ctx;const W=this.W;const H=this.H;
    ctx.clearRect(0,0,W,H);

    // World background
    const world=CFG.worlds[this.worldId||0];
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,world.bg1);bg.addColorStop(1,world.bg2);
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    // Stars
    this.starField.draw(ctx,W,H);

    // Ground strip
    ctx.fillStyle='#ffffff08';
    ctx.fillRect(0,H*0.88,W,H*0.12);

    // Objects
    this.objects.forEach(o=>o.draw(ctx));

    // Boss
    if(this.boss&&this.boss.alive)this.boss.draw(ctx);

    // Hole
    if(this.hole)this.hole.draw(ctx);

    // Particles on top
    this.particles.draw(ctx);
  }

  _updateHUD(){
    const t=Math.ceil(this.timeLeft);
    document.getElementById('hud-timer').textContent=t;
    const arc=188.5*(this.timeLeft/CFG.LEVEL_TIME);
    document.getElementById('timerArc').setAttribute('stroke-dashoffset',188.5-arc);
    if(t<=10)document.getElementById('timerArc').setAttribute('stroke','#e74c3c');

    document.getElementById('hud-score').textContent=fmt(this.score);

    const maxR=CFG.BASE_HOLE_SIZE*8;
    const pct=clamp(this.hole.radius/maxR,0,1)*100;
    document.getElementById('hud-size-bar').style.width=pct+'%';
    document.getElementById('hud-size-val').textContent=Math.round(this.hole.radius);

    if(this.combo>=2){
      document.getElementById('hud-combo').style.display='block';
      document.getElementById('hud-combo-num').textContent='x'+this.combo;
    }
  }
}

// ──────────────────────────────────────────────────────
// ACHIEVEMENT SYSTEM
// ──────────────────────────────────────────────────────
class AchievementSystem{
  constructor(){this._queue=[];}
  check(state,game){
    const st=state;const s=st.stats;
    const unlock=(id)=>{
      if(!st.achievements[id]){
        st.achievements[id]=true;
        const def=CFG.achievements.find(a=>a.id===id);
        if(def){
          if(def.r){
            if(def.r.coins){st.coins+=def.r.coins;st.totalCoinsEarned+=def.r.coins;}
            if(def.r.stars)st.stars+=def.r.stars;
            if(def.r.gems)st.gems+=def.r.gems;
          }
          this._queue.push(def);
          this._showNext(game);
          game.audio.unlock();
        }
      }
    };
    // Absorption
    if(s.objectsAbsorbed>=1)unlock('a1');
    if(s.objectsAbsorbed>=100)unlock('a2');
    if(s.objectsAbsorbed>=1000)unlock('a3');
    if(s.objectsAbsorbed>=10000)unlock('a4');
    if(s.objectsAbsorbed>=100000)unlock('a5');
    // Size
    if(s.maxSize>=50)unlock('a6');
    if(s.maxSize>=100)unlock('a7');
    if(s.maxSize>=200)unlock('a8');
    if(s.maxSize>=500)unlock('a9');
    if(s.maxSize>=1000)unlock('a10');
    // Coins
    if(st.totalCoinsEarned>=100)unlock('a11');
    if(st.totalCoinsEarned>=10000)unlock('a12');
    if(st.totalCoinsEarned>=1000000)unlock('a13');
    if(st.totalCoinsEarned>=1000000000)unlock('a14');
    // Levels
    if(s.totalLevelsPlayed>=1)unlock('a15');
    if((s.worldLevelsMap&&s.worldLevelsMap[0]||0)>=10)unlock('a16');
    if(st.unlockedWorlds.includes(1))unlock('a17');
    if(st.unlockedWorlds.includes(2))unlock('a18');
    if(st.unlockedWorlds.includes(3))unlock('a19');
    if(st.unlockedWorlds.includes(4))unlock('a20');
    if(st.unlockedWorlds.includes(5))unlock('a21');
    if(st.unlockedWorlds.length>=6)unlock('a22');
    // Evolutions
    if(st.unlockedEvolutions.length>=2)unlock('a23');
    if(st.unlockedEvolutions.includes(1))unlock('a24');
    if(st.unlockedEvolutions.includes(2))unlock('a25');
    if(st.unlockedEvolutions.includes(3))unlock('a26');
    if(st.unlockedEvolutions.includes(4))unlock('a27');
    if(st.unlockedEvolutions.includes(5))unlock('a28');
    if(st.unlockedEvolutions.length>=6)unlock('a29');
    // Bosses
    if(s.bossesDefeated>=1)unlock('a30');
    if(s.bossesDefeated>=5)unlock('a31');
    if(s.bossesDefeated>=20)unlock('a32');
    // Cards
    const cardCount=Object.keys(st.cards).length;
    if(cardCount>=1)unlock('a34');
    if(cardCount>=10)unlock('a35');
    if(cardCount>=CFG.cards.length)unlock('a36');
    const maxCard=Object.values(st.cards).find(c=>c.level>=10);
    if(maxCard)unlock('a37');
    // Upgrades
    const upgCount=Object.values(st.upgrades).reduce((s,v)=>s+v,0);
    if(upgCount>=1)unlock('a38');
    if(upgCount>=20)unlock('a39');
    const maxUpg=CFG.upgrades.find(u=>st.upgrades[u.id]>=u.max);
    if(maxUpg)unlock('a40');
    // Combo
    if(s.maxCombo>=5)unlock('a54');
    if(s.maxCombo>=10)unlock('a55');
    if(s.maxCombo>=20)unlock('a56');
    if(s.maxCombo>=50)unlock('a57');
    if(s.maxCombo>=100)unlock('a101');
    // Level count
    if(s.totalLevelsPlayed>=5)unlock('a58');
    if(s.totalLevelsPlayed>=10)unlock('a59');
    if(s.totalLevelsPlayed>=25)unlock('a60');
    if(s.totalLevelsPlayed>=50)unlock('a61');
    if(s.totalLevelsPlayed>=100)unlock('a62');
    // Stars
    if(st.stars>=10)unlock('a63');
    if(st.stars>=100)unlock('a64');
    if(st.stars>=1000)unlock('a65');
    if(st.stars>=5000)unlock('a104');
    // Gems
    if(st.gems>=1)unlock('a66');
    if(st.gems>=25)unlock('a67');
    if(st.gems>=100)unlock('a68');
    if(st.gems>=500)unlock('a105');
    // Objects by type
    if((s.objectsByType&&s.objectsByType['Монета']||0)>=1000)unlock('a45');
    if((s.objectsByType&&s.objectsByType['Авто']||0)>=100)unlock('a46');
    if((s.objectsByType&&s.objectsByType['Будинок']||0)>=50)unlock('a47');
    if((s.objectsByType&&s.objectsByType['Хмарочос']||0)>=25)unlock('a48');
    if((s.objectsByType&&s.objectsByType['Острів']||0)>=10)unlock('a49');
    // Perfect
    if(s.perfectLevels>=1)unlock('a74');
    if(s.perfectLevels>=10)unlock('a75');
    // Crits
    if(s.critHits>=1)unlock('a96');
    if(s.critHits>=100)unlock('a97');
    // Golden
    if(s.goldenFound>=1)unlock('a99');
    if(s.goldenFound>=100)unlock('a88');
    // Max size
    if(s.maxSize>=800)unlock('a102');
    // Coins total
    if(st.coins>=10000000)unlock('a103');
    // All worlds/evos
    if(st.unlockedEvolutions.length>=6&&st.unlockedWorlds.length>=6)unlock('a100');
    // Spending
    if(st.totalCoinsSpent>=1000)unlock('a78');
    if(st.totalCoinsSpent>=100000)unlock('a79');
    if(st.totalCoinsSpent>=1000000)unlock('a80');
    // Consecutive
    if(s.consecutiveLevels>=10)unlock('a94');
    // World levels
    if((s.worldLevelsMap&&s.worldLevelsMap[1]||0)>=5)unlock('a69');
    if((s.worldLevelsMap&&s.worldLevelsMap[2]||0)>=5)unlock('a70');
    if((s.worldLevelsMap&&s.worldLevelsMap[3]||0)>=5)unlock('a71');
    if((s.worldLevelsMap&&s.worldLevelsMap[4]||0)>=5)unlock('a72');
    if((s.worldLevelsMap&&s.worldLevelsMap[5]||0)>=5)unlock('a73');
    // Achievements screen
    if(st.achievements['a89_visited'])unlock('a89');
    if(st.achievements['a90_visited']>=10){}
    // Tier 6
    const tier6=Object.entries(s.objectsByType||{}).filter(([k,v])=>{
      const cfg=[...Object.values(CFG.worldObjects)].flat().find(o=>o.n===k);
      return cfg&&cfg.t===6&&v>=1;
    });
    if(tier6.length>0)unlock('a95');
  }
  _showNext(game){
    if(this._showing)return;
    if(this._queue.length===0)return;
    this._showing=true;
    const def=this._queue.shift();
    const el=document.getElementById('ach-popup');
    document.getElementById('ach-popup-icon').textContent=def.icon;
    document.getElementById('ach-popup-name').textContent=def.n;
    el.style.display='flex';
    const badge=document.getElementById('ach-badge');
    if(badge)badge.style.display='flex';
    setTimeout(()=>{
      el.style.display='none';
      this._showing=false;
      if(this._queue.length>0)this._showNext(game);
    },3000);
  }
}

// ──────────────────────────────────────────────────────
// BASE SCREEN (hub canvas animation)
// ──────────────────────────────────────────────────────
class BaseCanvas{
  constructor(){
    this.canvas=document.getElementById('holeCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.angle=0;this.pulse=0;this._raf=null;this._bound=this._draw.bind(this);
  }
  start(evoId){this.evoId=evoId;if(!this._raf)this._raf=requestAnimationFrame(this._bound);}
  stop(){if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}}
  _draw(){
    const ctx=this.ctx;const W=220;const H=220;
    ctx.clearRect(0,0,W,H);
    this.angle+=0.02;this.pulse=(Date.now()*0.002);
    const evo=CFG.evolutions[this.evoId||0];
    const cx=W/2;const cy=H/2;const R=70;
    const pulse=1+0.06*Math.sin(this.pulse);

    // Glow
    const g=ctx.createRadialGradient(cx,cy,R*0.3,cx,cy,R*2.5);
    g.addColorStop(0,evo.color+'50');g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*2.5,0,Math.PI*2);ctx.fill();

    // Body
    const h=ctx.createRadialGradient(cx-R*0.25,cy-R*0.25,0,cx,cy,R*pulse);
    h.addColorStop(0,'#2c0a3a');h.addColorStop(0.7,'#0a0015');h.addColorStop(1,'#000');
    ctx.fillStyle=h;ctx.beginPath();ctx.arc(cx,cy,R*pulse,0,Math.PI*2);ctx.fill();

    // Inner shimmer
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,R*pulse,0,Math.PI*2);ctx.clip();
    const sh=ctx.createRadialGradient(cx-R*0.3,cy-R*0.3,0,cx,cy,R);
    sh.addColorStop(0,evo.color+'35');sh.addColorStop(1,'transparent');
    ctx.fillStyle=sh;ctx.fillRect(cx-R,cy-R,R*2,R*2);ctx.restore();

    // Ring
    ctx.save();ctx.translate(cx,cy);ctx.rotate(this.angle);
    ctx.strokeStyle=evo.color;ctx.lineWidth=3;ctx.globalAlpha=0.75;
    ctx.beginPath();ctx.ellipse(0,0,R*1.35,R*0.35,0,0,Math.PI*2);ctx.stroke();
    ctx.rotate(Math.PI*0.5);ctx.globalAlpha=0.4;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,R*1.55,R*0.25,0,0,Math.PI*2);ctx.stroke();
    ctx.restore();

    // Particle dots
    for(let i=0;i<6;i++){
      const a=this.angle*1.5+i*(Math.PI*2/6);
      const pr=R*1.6+10*Math.sin(this.pulse+i);
      const px=cx+Math.cos(a)*pr;const py=cy+Math.sin(a)*pr*0.35;
      ctx.beginPath();ctx.arc(px,py,2.5,0,Math.PI*2);
      ctx.fillStyle=evo.color;ctx.globalAlpha=0.5+0.5*Math.sin(this.pulse+i*1.2);
      ctx.fill();ctx.globalAlpha=1;
    }

    this._raf=requestAnimationFrame(this._bound);
  }
}

// ──────────────────────────────────────────────────────
// MAIN GAME CONTROLLER
// ──────────────────────────────────────────────────────
class Game{
  constructor(){
    this.state=loadGame();
    this.audio=new AudioManager();
    this.gameScreen=new GameScreen(this);
    this.achSys=new AchievementSystem();
    this.baseCanvas=new BaseCanvas();
    this._currentScreen='';
    this._autoSaveTimer=0;
    this._playTimer=0;
    this._init();
  }

  _init(){
    // Resize canvas
    window.addEventListener('resize',()=>this.gameScreen.resize());

    // Loading animation
    let p=0;
    const bar=document.getElementById('loadingBar');
    const txt=document.getElementById('loadingText');
    const msgs=['Завантаження ресурсів...','Генерація світів...','Ініціалізація діри...','Готово!'];
    const interval=setInterval(()=>{
      p+=rnd(5,20);if(p>100)p=100;
      bar.style.width=p+'%';
      txt.textContent=msgs[Math.floor(p/33)];
      if(p>=100){clearInterval(interval);setTimeout(()=>this._startGame(),600);}
    },150);
  }

  _startGame(){
    this.audio.init();
    this.state.sessionStart=Date.now();
    this._checkStreak();
    this._checkOffline();
    this._checkDailyEvent();

    // Auto-save loop
    setInterval(()=>{this.saveState();},30000);

    // Achievement: first day
    this.achSys.check(this.state,this);

    // Achievement: a41 always
    this.state.achievements['a41']=true;

    this.showBase();
    this.audio.startMusic();
  }

  _checkStreak(){
    const today=new Date().toDateString();
    if(this.state.lastStreakDate!==today){
      const yesterday=new Date(Date.now()-86400000).toDateString();
      if(this.state.lastStreakDate===yesterday)this.state.streakDays++;
      else if(this.state.lastStreakDate!=='')this.state.streakDays=1;
      this.state.lastStreakDate=today;
      if(this.state.streakDays>=7)this.achSys.check(this.state,this);
    }
    // Time of day achievements
    const h=new Date().getHours();
    if(h>=22)this.state.achievements['a76']=true;
    if(h<8) this.state.achievements['a77']=true;
    this.achSys.check(this.state,this);
  }

  _checkOffline(){
    const now=Date.now();
    const elapsed=(now-this.state.lastOnline)/1000;
    this.state.lastOnline=now;
    if(elapsed<60)return;

    const maxHours=CFG.MAX_OFFLINE_HOURS+this.getUpgradeValue('offlineTime');
    const maxSec=maxHours*3600;
    const earned=Math.min(elapsed,maxSec);

    let cps=CFG.OFFLINE_COINS_PER_SEC*(1+this.getUpgradeValue('coinBonus'));
    const evoBonus=this.getEvoBonus();
    if(evoBonus.offline)cps*=(1+evoBonus.offline);
    if(evoBonus.all)cps*=(1+evoBonus.all);
    const coins=Math.floor(earned*cps);
    if(coins>0){
      this._pendingOfflineCoins=coins;
      this._pendingOfflineTime=earned;
      this.showScreen('screen-offline');
      const maxReached=elapsed>=maxSec;
      document.getElementById('offline-time').textContent=fmtTime(earned*1000)+(maxReached?' (макс!)':'');
      document.getElementById('offline-rewards').innerHTML=`🪙 <b>${fmt(coins)} монет</b>`;
      this.state.achievements['a52']=true;
      if(earned>=maxSec)this.state.achievements['a53']=true;
    }
  }

  collectOffline(){
    if(this._pendingOfflineCoins){
      this.state.coins+=this._pendingOfflineCoins;
      this.state.totalCoinsEarned+=this._pendingOfflineCoins;
      this._pendingOfflineCoins=0;
    }
    this.showBase();
    this.saveState();
  }
  collectOfflineX2(){
    // Simulated reward ad
    if(this._pendingOfflineCoins){
      this.state.coins+=this._pendingOfflineCoins*2;
      this.state.totalCoinsEarned+=this._pendingOfflineCoins*2;
      this._pendingOfflineCoins=0;
      this.toast('📺 Нагорода x2!');
    }
    this.showBase();
    this.saveState();
  }

  _checkDailyEvent(){
    const now=Date.now();
    if(this.state.dailyEventActive&&now>this.state.dailyEventEnd){
      this.state.dailyEventActive=null;
    }
    // Random daily event each day
    const todayKey=new Date().toDateString();
    if(!this.state._dailyEventShownDate||this.state._dailyEventShownDate!==todayKey){
      this.state._dailyEventShownDate=todayKey;
      const ev=CFG.dailyEvents[rndInt(0,CFG.dailyEvents.length-1)];
      this.state._pendingDailyEvent=ev.id;
      const banner=document.getElementById('daily-banner');
      banner.style.display='flex';
      document.getElementById('daily-icon').textContent=ev.icon;
      document.getElementById('daily-text').textContent=ev.n;
    } else if(this.state.dailyEventActive){
      const banner=document.getElementById('daily-banner');
      banner.style.display='flex';
    }
  }

  showDailyEvent(){
    const evId=this.state._pendingDailyEvent||this.state.dailyEventActive;
    if(!evId)return;
    const ev=CFG.dailyEvents.find(e=>e.id===evId);
    if(!ev)return;
    document.getElementById('daily-popup-title').textContent=`${ev.icon} ${ev.n}`;
    document.getElementById('daily-popup-desc').textContent=ev.desc;
    const timeLeft=this.state.dailyEventActive?fmtTime(Math.max(0,this.state.dailyEventEnd-Date.now())):'';
    document.getElementById('daily-popup-timer').textContent=timeLeft?`⏱️ Залишилось: ${timeLeft}`:'';
    this.showScreen('screen-daily');
  }

  activateDailyEvent(){
    const evId=this.state._pendingDailyEvent||this.state.dailyEventActive;
    if(!evId)return;
    const ev=CFG.dailyEvents.find(e=>e.id===evId);
    if(!ev)return;
    this.state.dailyEventActive=evId;
    this.state.dailyEventEnd=Date.now()+ev.dur;
    this.state._pendingDailyEvent=null;
    this.state.achievements['a86']=true;
    this.achSys.check(this.state,this);
    this.toast(`${ev.icon} ${ev.n} активовано!`);
    this.saveState();
    this.showBase();
  }

  closePopup(){this.showBase();}

  // ── NAVIGATION ──
  showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const el=document.getElementById(id);
    if(el)el.classList.add('active');
    this._currentScreen=id;
  }

  showBase(){
    this.state.lastOnline=Date.now();
    this.baseCanvas.start(this.state.currentEvolution);
    const evo=CFG.evolutions[this.state.currentEvolution];
    document.getElementById('evo-name').textContent=evo.name;
    document.getElementById('evo-bonus').textContent=evo.desc;
    this._updateResBar();
    this._updatePlayBtn();
    this.showScreen('screen-base');
    this.achSys.check(this.state,this);
  }

  showWorldSelect(){
    this.audio.click();
    this.baseCanvas.stop();
    this._buildWorldGrid();
    this.showScreen('screen-world');
  }

  showUpgrades(){
    this.audio.click();
    this.state.achievements['a90_visited']=(this.state.achievements['a90_visited']||0)+1;
    this.baseCanvas.stop();
    this._buildUpgrades();
    document.getElementById('upg-coins').textContent=fmt(this.state.coins);
    this.showScreen('screen-upgrades');
  }

  showEvolutions(){
    this.audio.click();
    this.baseCanvas.stop();
    this._buildEvolutions();
    this.showScreen('screen-evolutions');
  }

  showCollection(){
    this.audio.click();
    this.baseCanvas.stop();
    this._buildCards();
    document.getElementById('col-coins').textContent=fmt(this.state.coins);
    this.showScreen('screen-collection');
  }

  showAchievements(){
    this.audio.click();
    this.state.achievements['a89_visited']=true;
    this.achSys.check(this.state,this);
    this.baseCanvas.stop();
    this._buildAchievements();
    const done=Object.keys(this.state.achievements).filter(k=>!k.includes('_visited')).length;
    document.getElementById('ach-progress-text').textContent=`${done}/105`;
    document.getElementById('ach-badge').style.display='none';
    this.showScreen('screen-achievements');
  }

  showSettings(){
    this.audio.click();
    this.baseCanvas.stop();
    const s=this.state.settings;
    this._setToggle('toggle-sound',s.sound);
    this._setToggle('toggle-music',s.music);
    this._setToggle('toggle-vibro',s.vibro);
    this.showScreen('screen-settings');
  }

  pauseGame(){this.gameScreen.paused=true;this.showScreen('screen-pause');}
  resumeGame(){
    this.gameScreen.paused=false;
    this.showScreen('screen-game-hud');
    this.gameScreen._lastTime=performance.now();
  }

  nextLevel(){
    const st=this.state;
    const wl=st.worldLevels[st.currentWorld]||1;
    if(st.stats.worldLevelsMap)st.stats.worldLevelsMap[st.currentWorld]=(st.stats.worldLevelsMap[st.currentWorld]||0)+1;
    st.worldLevels[st.currentWorld]=wl+1;
    this.saveState();
    this._startLevel(st.currentWorld);
  }

  quitToBase(){
    this.gameScreen.stop();
    this.state.stats.consecutiveLevels=0;
    this.saveState();
    this.showBase();
  }

  // ── LEVEL START ──
  _startLevel(worldId){
    const st=this.state;
    st.currentWorld=worldId;
    const level=st.worldLevels[worldId]||1;
    const isBoss=level%CFG.BOSS_EVERY_N_LEVELS===0;

    document.getElementById('hud-world-name').textContent=CFG.worlds[worldId].name;
    document.getElementById('hud-level').textContent=`Рівень ${level}`;
    document.getElementById('timerArc').setAttribute('stroke','#f1c40f');

    this.showScreen('screen-game-hud');
    this.gameScreen.start(worldId,level,isBoss);
    this.audio.resume();
  }

  // ── BUILDERS ──
  _buildWorldGrid(){
    const el=document.getElementById('worldGrid');
    el.innerHTML='';
    CFG.worlds.forEach(w=>{
      const unlocked=this.state.unlockedWorlds.includes(w.id);
      const level=this.state.worldLevels[w.id]||1;
      const selected=this.state.currentWorld===w.id;
      const div=document.createElement('div');
      div.className='world-card'+(unlocked?selected?' selected':'':' locked');
      let costHtml='';
      if(!unlocked&&w.cost){
        costHtml=`<div class="world-card-cost">🪙${fmt(w.cost.coins)} ⭐${w.cost.stars}</div>`;
      }
      div.innerHTML=`
        <div class="world-card-icon">${w.icon}</div>
        <div class="world-card-name">${w.name}</div>
        <div class="world-card-desc">${w.desc}</div>
        ${unlocked?`<div class="world-card-level">Рівень ${level}</div>`:''}
        ${!unlocked?`<div class="world-card-lock">🔒</div>${costHtml}`:''}
      `;
      div.onclick=()=>this._onWorldClick(w.id,unlocked,w.cost);
      el.appendChild(div);
    });
  }

  _onWorldClick(worldId,unlocked,cost){
    this.audio.click();
    if(!unlocked){
      if(cost&&this.state.coins>=cost.coins&&this.state.stars>=(cost.stars||0)){
        this.state.coins-=cost.coins;
        this.state.totalCoinsSpent+=cost.coins;
        if(cost.stars){this.state.stars-=cost.stars;}
        this.state.unlockedWorlds.push(worldId);
        this.audio.unlock();
        this.toast(`🌍 ${CFG.worlds[worldId].name} відкрито!`);
        this.achSys.check(this.state,this);
        this.saveState();
        this._buildWorldGrid();
      } else {
        this.toast('Недостатньо ресурсів!');
      }
      return;
    }
    this.state.currentWorld=worldId;
    this._updatePlayBtn();
    this._startLevel(worldId);
  }

  _buildUpgrades(){
    const el=document.getElementById('upgradesList');
    el.innerHTML='';
    CFG.upgrades.forEach(u=>{
      const lv=this.state.upgrades[u.id]||0;
      const maxed=lv>=u.max;
      const cost=maxed?0:Math.ceil(u.base*Math.pow(u.mult,lv));
      const div=document.createElement('div');div.className='upg-item';
      const effectVal=lv*(u.type==='mul'?u.eff*100:u.eff);
      const effectStr=u.type==='mul'?`+${(effectVal).toFixed(0)}%`:`+${effectVal.toFixed(u.eff<1?1:0)}`;
      div.innerHTML=`
        <div class="upg-icon">${u.icon}</div>
        <div class="upg-info">
          <div class="upg-name">${u.name}</div>
          <div class="upg-desc">${u.desc}</div>
          <div class="upg-level">Рівень ${lv}/${u.max} ${lv>0?'('+effectStr+')':''}</div>
        </div>
        <button class="upg-btn${maxed?' maxed':''}" ${maxed?'disabled':''}>
          ${maxed?'МАКС':`🪙${fmt(cost)}`}
        </button>
      `;
      div.querySelector('button').onclick=()=>{
        if(maxed)return;
        if(this.state.coins>=cost){
          this.state.coins-=cost;
          this.state.totalCoinsSpent+=cost;
          this.state.upgrades[u.id]=(this.state.upgrades[u.id]||0)+1;
          this.audio.click();
          this.achSys.check(this.state,this);
          this.saveState();
          document.getElementById('upg-coins').textContent=fmt(this.state.coins);
          this._buildUpgrades();
        } else {this.toast('Недостатньо монет!');}
      };
      el.appendChild(div);
    });
  }

  _buildEvolutions(){
    const el=document.getElementById('evoList');
    el.innerHTML='';
    CFG.evolutions.forEach(e=>{
      const unlocked=this.state.unlockedEvolutions.includes(e.id);
      const active=this.state.currentEvolution===e.id;
      const div=document.createElement('div');
      div.className='evo-item'+(active?' active':'')+(unlocked?'':' locked');
      let badge='';
      if(active)badge='<span class="evo-item-badge badge-active">АКТИВНА</span>';
      else if(unlocked)badge='<span class="evo-item-badge badge-unlocked">Відкрита</span>';
      else badge='<span class="evo-item-badge badge-locked">🔒</span>';
      let costHtml='';
      if(!unlocked&&e.cost){
        const parts=[];
        if(e.cost.coins)parts.push(`🪙${fmt(e.cost.coins)}`);
        if(e.cost.stars)parts.push(`⭐${e.cost.stars}`);
        if(e.cost.gems)parts.push(`💎${e.cost.gems}`);
        costHtml=`<div class="evo-item-cost">${parts.join('  ')}</div>`;
      }
      div.innerHTML=`
        <div class="evo-item-icon">${e.icon}</div>
        <div class="evo-item-info">
          <div class="evo-item-name" style="color:${e.color}">${e.name}</div>
          <div class="evo-item-desc">${e.desc}</div>
          ${costHtml}
        </div>
        ${badge}
      `;
      div.onclick=()=>this._onEvoClick(e,unlocked,active);
      el.appendChild(div);
    });
  }

  _onEvoClick(evo,unlocked,active){
    this.audio.click();
    if(active){this.toast('Вже активна!');return;}
    if(unlocked){
      this.state.currentEvolution=evo.id;
      this.audio.unlock();
      this.toast(`${evo.icon} ${evo.name} активовано!`);
      this.achSys.check(this.state,this);
      this.saveState();
      this._buildEvolutions();
      return;
    }
    if(!evo.cost){return;}
    const c=evo.cost;
    if(this.state.coins>=(c.coins||0)&&this.state.stars>=(c.stars||0)&&this.state.gems>=(c.gems||0)){
      if(c.coins){this.state.coins-=c.coins;this.state.totalCoinsSpent+=c.coins;}
      if(c.stars)this.state.stars-=c.stars;
      if(c.gems)this.state.gems-=c.gems;
      this.state.unlockedEvolutions.push(evo.id);
      this.state.currentEvolution=evo.id;
      this.audio.unlock();this.audio.levelUp();
      this.toast(`🌀 ${evo.name} відкрито!`);
      this.achSys.check(this.state,this);
      this.saveState();
      this._buildEvolutions();
    } else {this.toast('Недостатньо ресурсів!');}
  }

  _buildCards(){
    const el=document.getElementById('cardGrid');
    el.innerHTML='';
    CFG.cards.forEach(card=>{
      const owned=this.state.cards[card.id];
      const lv=owned?owned.level:0;
      const maxed=lv>=card.max;
      const div=document.createElement('div');
      div.className=`card-item rarity-${card.r}`+(owned?'':' card-locked');
      const pct=maxed?100:(lv/card.max)*100;
      const upgCost=owned&&!maxed?this._cardUpgradeCost(card,lv):0;
      div.innerHTML=`
        <div class="card-icon">${card.e}</div>
        <div class="card-name">${card.n}</div>
        <div class="card-rarity" style="color:${CFG.rarityColor[card.r]}">${CFG.rarityName[card.r]}</div>
        <div class="card-level">Рівень ${lv}/${card.max}</div>
        <div class="card-lvl-bar-wrap"><div class="card-lvl-bar" style="width:${pct}%"></div></div>
        ${owned&&!maxed?`<button class="card-upgrade-btn">⬆️ 🪙${fmt(upgCost)}</button>`:''}
        ${maxed?`<button class="card-upgrade-btn maxed" disabled>МАКС</button>`:''}
        ${!owned?`<div class="card-lock-overlay">🔒</div>`:''}
      `;
      if(owned&&!maxed){
        div.querySelector('button').onclick=()=>{
          if(this.state.coins>=upgCost){
            this.state.coins-=upgCost;this.state.totalCoinsSpent+=upgCost;
            this.state.cards[card.id].level++;
            this.audio.click();
            this.achSys.check(this.state,this);
            this.saveState();
            document.getElementById('col-coins').textContent=fmt(this.state.coins);
            this._buildCards();
          } else {this.toast('Недостатньо монет!');}
        };
      }
      el.appendChild(div);
    });
  }

  _cardUpgradeCost(card,lv){
    const bases={common:50,rare:200,epic:1000,legendary:10000};
    return Math.ceil(bases[card.r]*Math.pow(2,lv));
  }

  _buildAchievements(){
    const el=document.getElementById('achList');
    el.innerHTML='';
    CFG.achievements.forEach(a=>{
      const done=!!this.state.achievements[a.id];
      const div=document.createElement('div');
      div.className='ach-item'+(done?' unlocked':'');
      const rewardParts=[];
      if(a.r){
        if(a.r.coins)rewardParts.push(`🪙${fmt(a.r.coins)}`);
        if(a.r.stars)rewardParts.push(`⭐${a.r.stars}`);
        if(a.r.gems)rewardParts.push(`💎${a.r.gems}`);
      }
      div.innerHTML=`
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${a.n}</div>
          <div class="ach-desc">${a.d}</div>
          ${rewardParts.length?`<div class="ach-reward">${rewardParts.join(' ')}</div>`:''}
        </div>
        <div class="ach-check">${done?'✅':'⬜'}</div>
      `;
      el.appendChild(div);
    });
  }

  // ── SETTINGS ──
  toggleSound(){
    this.state.settings.sound=!this.state.settings.sound;
    this.audio.setSound(this.state.settings.sound);
    this._setToggle('toggle-sound',this.state.settings.sound);
    this.saveState();
  }
  toggleMusic(){
    this.state.settings.music=!this.state.settings.music;
    this.audio.setMusic(this.state.settings.music);
    this._setToggle('toggle-music',this.state.settings.music);
    this.saveState();
  }
  toggleVibro(){
    this.state.settings.vibro=!this.state.settings.vibro;
    this._setToggle('toggle-vibro',this.state.settings.vibro);
    this.saveState();
  }
  _setToggle(id,on){
    const el=document.getElementById(id);
    if(!el)return;
    el.textContent=on?'ВКЛ':'ВИКЛ';
    el.className='toggle-btn'+(on?'':' off');
  }
  confirmReset(){
    if(confirm('Скинути весь прогрес? Цю дію не можна відмінити!')){
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  }

  // ── HELPERS ──
  getUpgradeValue(id){
    const u=CFG.upgrades.find(x=>x.id===id);
    if(!u)return 0;
    const lv=this.state.upgrades[id]||0;
    return lv*u.eff;
  }

  getEvoBonus(){
    const evo=CFG.evolutions[this.state.currentEvolution];
    if(!evo||evo.bonus==='base')return{};
    return{[evo.bonus]:evo.bonusVal};
  }

  getCardBonus(eff){
    let total=0;
    CFG.cards.forEach(card=>{
      if(card.eff===eff&&this.state.cards[card.id]){
        total+=card.v*this.state.cards[card.id].level;
      }
    });
    return total;
  }

  _updateResBar(){
    document.getElementById('hud-coins').textContent=fmt(this.state.coins);
    document.getElementById('hud-stars').textContent=fmt(this.state.stars);
    document.getElementById('hud-gems').textContent=fmt(this.state.gems);
  }

  _updatePlayBtn(){
    const wl=this.state.worldLevels[this.state.currentWorld]||1;
    const world=CFG.worlds[this.state.currentWorld];
    document.getElementById('play-level-info').textContent=`${world?world.name:''} • Рівень ${wl}`;
  }

  toast(msg,dur=2600){
    const el=document.createElement('div');
    el.className='toast';el.textContent=msg;
    const c=document.getElementById('toast-container');
    c.appendChild(el);
    setTimeout(()=>el.remove(),dur);
  }

  saveState(){
    this.state.lastOnline=Date.now();
    this._updateResBar();
    saveGame(this.state);
  }

  onBackPressed(){
    if(this._currentScreen==='screen-game-hud'){this.pauseGame();}
    else if(this._currentScreen!=='screen-base'){this.showBase();}
  }
  onPause(){this.saveState();if(this.gameScreen.running)this.gameScreen.paused=true;}
  onResume(){if(this.gameScreen.running){this.gameScreen.paused=false;this.gameScreen._lastTime=performance.now();}}
}

// ──────────────────────────────────────────────────────
// BOOT
// ──────────────────────────────────────────────────────
window.addEventListener('load',()=>{window.game=new Game();});
