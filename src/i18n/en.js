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
  },
  menu: {
    tagline: 'A MAGICAL PUZZLE SAGA',
    events: 'EVENTS', dragons: 'DRAGONS', island: 'ISLAND', shop: 'SHOP', settings: 'SETTINGS',
  },
  titles: {
    shop: 'SHOP', settings: 'SETTINGS', collection: 'COLLECTION', events: 'EVENTS',
    paused: 'PAUSED', mainMenu: 'MAIN MENU', floatingWorld: 'FLOATING WORLD',
  },
  hud: { level: 'LEVEL {n}', worldMap: 'WORLD MAP', dragonEnergy: 'DRAGON ENERGY' },
  levelComplete: { line1: 'LEVEL', line2: 'COMPLETE!' },
  gameOver: { title: 'GAME OVER', score: 'SCORE', best: 'BEST', retry: 'TAP TO PLAY AGAIN' },
  settings: {
    audio: 'Music & Sound', haptics: 'Haptics', reducedMotion: 'Reduced Motion',
    colorBlind: 'Color-Blind Mode', lowPerformance: 'Low Performance Mode', largeUI: 'Large UI',
    reset: 'RESET PROGRESS',
  },
  shop: { dailyGift: 'DAILY GIFT', dailySub: 'Come back every day!' },
  collection: { tabs: { dragons: 'DRAGONS', buildings: 'BUILDINGS', artifacts: 'ARTIFACTS', awards: 'AWARDS' } },
};
