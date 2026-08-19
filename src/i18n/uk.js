/**
 * uk.js — Ukrainian language pack (Українська).
 * -----------------------------------------------------------------------------
 * Mirrors the key structure of en.js. Anything missing here automatically
 * falls back to English (see Localization.t), so the game never renders blank.
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Українська' },
  common: {
    play: 'ГРАТИ', continue: 'ПРОДОВЖИТИ', resume: 'ПРОДОВЖИТИ', back: 'НАЗАД',
    claim: 'ЗАБРАТИ', free: 'БЕЗКОШТОВНО', best: 'РЕКОРД', locked: 'ЗАКРИТО', restore: 'ВІДНОВИТИ',
    nova: 'НОВА', perfect: 'ІДЕАЛЬНО!', newBest: 'НОВИЙ РЕКОРД!', gotIt: 'ЗРОЗУМІЛО!',
    watch: 'ДИВИТИСЬ', watchAd: 'Переглянь коротку рекламу', skipTutorial: 'ПРОПУСТИТИ НАВЧАННЯ', tapToSkip: 'торкнись, щоб пропустити',
  },
  combo: { double: 'ДВІ!', triple: 'ТРИ!', quad: 'ЧОТИРИ!', penta: "П'ЯТЬ!", mega: 'МЕГА!', chain: 'КОМБО ×{n}' },
  menu: {
    tagline: 'ГОЛОВОЛОМКА В НЕБІ',
    events: 'ПОДІЇ', dragons: 'ДРАКОНИ', island: 'ОСТРІВ', shop: 'МАГАЗИН', settings: 'НАЛАШТУВАННЯ',
    daily: 'ЩОДЕННЕ', endless: 'БЕЗКІНЕЧНИЙ', levels: 'РІВНІ', home: 'ГОЛОВНА', collection: 'Колекція {a}/{b}',
  },
  daily: {
    title: 'ЩОДЕННІ НАГОРОДИ',
    streak: 'СЕРІЯ {n} ДН.',
    day: 'ДЕНЬ {n}',
    claimReward: 'ЗАБРАТИ СЬОГОДНІ',
    claimed: 'ПОВЕРНИСЬ ЗАВТРА',
    rewardTitle: 'ЩОДЕННА НАГОРОДА!',
    quest: 'ЩОДЕННЕ ЗАВДАННЯ',
    weekly: 'ТИЖНЕВИЙ ВИКЛИК',
    chest: 'БЕЗКОШТОВНА СКРИНЯ',
    mystery: 'ТАЄМНИЙ ПОДАРУНОК',
    collection: 'Колекція {a}/{b} — майже готово!',
    questDone: 'ЗАВДАННЯ ВИКОНАНО!',
    weeklyDone: 'ТИЖДЕНЬ ЗАВЕРШЕНО!',
  },
  titles: {
    shop: 'МАГАЗИН', settings: 'НАЛАШТУВАННЯ', collection: 'КОЛЕКЦІЯ', events: 'ПОДІЇ',
    paused: 'ПАУЗА', mainMenu: 'ГОЛОВНЕ МЕНЮ', floatingWorld: 'ЛЕТЮЧИЙ СВІТ',
  },
  hud: { level: 'РІВЕНЬ {n}', worldMap: 'КАРТА СВІТУ', dragonEnergy: 'ЕНЕРГІЯ НОВИ', tapToStrike: 'ТОРКНИСЬ БЛОКУ', burnHint: 'ТОРКНИСЬ ДРАКОНА — СПАЛИТЬ РЯД!', todaysBest: 'РЕКОРД ДНЯ' },
  levelComplete: { line1: 'РІВЕНЬ', line2: 'ПРОЙДЕНО!', earned: 'МОНЕТ ОТРИМАНО', next: 'НАСТУПНИЙ РІВЕНЬ' },
  gameOver: { title: 'ГРУ ЗАВЕРШЕНО', subtitle: 'СПРОБУЙ ЩЕ РАЗ', score: 'РАХУНОК', best: 'РЕКОРД', retry: 'ТОРКНИСЬ, ЩОБ ЗІГРАТИ ЗНОВУ', playAgain: 'ГРАТИ ЗНОВУ', consolation: 'ГАРНА СПРОБА!' },
  settings: {
    audio: 'Музика та звук', haptics: 'Вібрація', reducedMotion: 'Менше анімацій',
    colorBlind: 'Режим дальтоніка', lowPerformance: 'Режим економії', largeUI: 'Великий інтерфейс',
    reset: 'СКИНУТИ ПРОГРЕС', language: 'Мова',
    blockStyle: 'Стиль блоків', blockFriends: 'Друзі', blockGems: 'Самоцвіти',
  },
  shop: {
    dailyGift: 'ЩОДЕННИЙ ПОДАРУНОК', dailySub: 'Заходь щодня!', boosterStore: 'МАГАЗИН БУСТЕРІВ',
    freeBooster: 'БЕЗКОШТОВНИЙ БУСТЕР', freeCoins: 'МОНЕТИ ЗА РЕКЛАМУ', watching: 'ПЕРЕГЛЯД…', loadingAd: 'Завантаження реклами…', noAd: 'Реклама недоступна',
    notEnough: 'НЕ ВИСТАЧАЄ МОНЕТ',
  },
  collection: { tabs: { dragons: 'ДРАКОНИ', buildings: 'БУДІВЛІ', artifacts: 'АРТЕФАКТИ', awards: 'НАГОРОДИ' } },
};
