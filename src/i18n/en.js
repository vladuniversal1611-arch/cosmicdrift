/**
 * en.js — English language pack.
 * -----------------------------------------------------------------------------
 * The reference string table. Every user-facing string lives in a pack like
 * this; screens look them up by key via `t('menu.play')`. New languages are a
 * drop-in file registered with the Localization singleton — no code changes.
 * Keys are grouped by area; `{name}` placeholders are filled at lookup time.
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'English' },
  common: {
    play: 'PLAY', continue: 'CONTINUE', resume: 'RESUME', back: 'BACK',
    claim: 'CLAIM', free: 'FREE', best: 'BEST', locked: 'LOCKED', restore: 'RESTORE',
    nova: 'NOVA', perfect: 'PERFECT!', newBest: 'NEW BEST!', gotIt: 'GOT IT!',
    watch: 'WATCH', watchAd: 'Watch a short ad', skipTutorial: 'SKIP TUTORIAL', tapToSkip: 'tap to skip',
  },
  combo: { double: 'DOUBLE!', triple: 'TRIPLE!', quad: 'QUAD!', penta: 'PENTA!', mega: 'MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'BLOCK PUZZLE IN THE SKY',
    events: 'EVENTS', dragons: 'DRAGONS', island: 'ISLAND', shop: 'SHOP', settings: 'SETTINGS',
    daily: 'DAILY', endless: 'ENDLESS', levels: 'LEVELS', home: 'HOME', collection: 'Collection {a}/{b}',
  },
  daily: {
    title: 'DAILY REWARDS',
    streak: '{n}-DAY STREAK',
    day: 'DAY {n}',
    claimReward: 'CLAIM TODAY',
    claimed: 'COME BACK TOMORROW',
    rewardTitle: 'DAILY REWARD!',
    quest: 'DAILY QUEST',
    weekly: 'WEEKLY CHALLENGE',
    chest: 'FREE CHEST',
    mystery: 'MYSTERY GIFT',
    collection: 'Collection {a}/{b} — almost there!',
    questDone: 'QUEST COMPLETE!',
    weeklyDone: 'WEEKLY COMPLETE!',
  },
  titles: {
    shop: 'SHOP', settings: 'SETTINGS', collection: 'COLLECTION', events: 'EVENTS',
    paused: 'PAUSED', mainMenu: 'MAIN MENU', floatingWorld: 'FLOATING WORLD',
  },
  hud: { level: 'LEVEL {n}', worldMap: 'WORLD MAP', dragonEnergy: 'NOVA ENERGY', tapToStrike: 'TAP A BLOCK TO STRIKE', todaysBest: "TODAY'S BEST" },
  levelComplete: { line1: 'LEVEL', line2: 'COMPLETE!', earned: 'COINS EARNED', next: 'NEXT LEVEL' },
  gameOver: { title: 'GAME OVER', subtitle: 'TRY AGAIN', score: 'SCORE', best: 'BEST', retry: 'TAP TO PLAY AGAIN', playAgain: 'PLAY AGAIN', consolation: 'NICE TRY!' },
  settings: {
    audio: 'Music & Sound', haptics: 'Haptics', reducedMotion: 'Reduced Motion',
    colorBlind: 'Color-Blind Mode', lowPerformance: 'Low Performance Mode', largeUI: 'Large UI',
    reset: 'RESET PROGRESS', language: 'Language',
  },
  shop: {
    dailyGift: 'DAILY GIFT', dailySub: 'Come back every day!', boosterStore: 'BOOSTER STORE',
    freeBooster: 'FREE BOOSTER', freeCoins: 'FREE COINS', watching: 'WATCHING…', loadingAd: 'Loading ad…', noAd: 'No ad available',
    notEnough: 'NOT ENOUGH COINS',
  },
  collection: { tabs: { dragons: 'DRAGONS', buildings: 'BUILDINGS', artifacts: 'ARTIFACTS', awards: 'AWARDS' } },
};
