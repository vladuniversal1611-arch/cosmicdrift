/**
 * de.js — German language pack (Deutsch).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Deutsch' },
  common: {
    play: 'SPIELEN', continue: 'WEITER', resume: 'FORTSETZEN', back: 'ZURÜCK',
    claim: 'ABHOLEN', free: 'GRATIS', best: 'BESTE', locked: 'GESPERRT', restore: 'WIEDERHERSTELLEN',
    nova: 'NOVA', perfect: 'PERFEKT!', newBest: 'NEUE BESTZEIT!', gotIt: 'VERSTANDEN!',
    watch: 'ANSEHEN', watchAd: 'Kurze Werbung ansehen', skipTutorial: 'TUTORIAL ÜBERSPRINGEN', tapToSkip: 'zum Überspringen tippen',
  },
  combo: { double: 'DOPPELT!', triple: 'DREIFACH!', quad: 'VIERFACH!', penta: 'FÜNFFACH!', mega: 'MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'BLOCK-PUZZLE AM HIMMEL',
    events: 'EVENTS', dragons: 'DRACHEN', island: 'INSEL', shop: 'SHOP', settings: 'EINSTELLUNGEN',
    daily: 'TÄGLICH', endless: 'ENDLOS', levels: 'LEVEL', home: 'START', collection: 'Sammlung {a}/{b}',
  },
  daily: {
    title: 'TÄGLICHE BELOHNUNGEN',
    streak: '{n}-TAGE-SERIE',
    day: 'TAG {n}',
    claimReward: 'HEUTE ABHOLEN',
    claimed: 'KOMM MORGEN WIEDER',
    rewardTitle: 'TÄGLICHE BELOHNUNG!',
    quest: 'TAGESAUFGABE',
    weekly: 'WOCHEN-CHALLENGE',
    chest: 'GRATIS-TRUHE',
    mystery: 'ÜBERRASCHUNG',
    collection: 'Sammlung {a}/{b} — fast geschafft!',
    questDone: 'AUFGABE ERFÜLLT!',
    weeklyDone: 'WOCHE ABGESCHLOSSEN!',
  },
  titles: {
    shop: 'SHOP', settings: 'EINSTELLUNGEN', collection: 'SAMMLUNG', events: 'EVENTS',
    paused: 'PAUSE', mainMenu: 'HAUPTMENÜ', floatingWorld: 'SCHWEBENDE WELT',
  },
  hud: { level: 'LEVEL {n}', worldMap: 'WELTKARTE', dragonEnergy: 'NOVA-ENERGIE', tapToStrike: 'TIPPE EINEN BLOCK', todaysBest: 'HEUTE BESTE' },
  levelComplete: { line1: 'LEVEL', line2: 'GESCHAFFT!', earned: 'MÜNZEN ERHALTEN' },
  gameOver: { title: 'SPIEL VORBEI', subtitle: 'NOCHMAL VERSUCHEN', score: 'PUNKTE', best: 'BESTE', retry: 'TIPPEN FÜR NEUSTART', playAgain: 'NOCHMAL SPIELEN', consolation: 'GUTER VERSUCH!' },
  settings: {
    audio: 'Musik & Sound', haptics: 'Vibration', reducedMotion: 'Weniger Animationen',
    colorBlind: 'Farbenblind-Modus', lowPerformance: 'Energiesparmodus', largeUI: 'Große Oberfläche',
    reset: 'FORTSCHRITT ZURÜCKSETZEN', language: 'Sprache',
  },
  shop: {
    dailyGift: 'TÄGLICHES GESCHENK', dailySub: 'Komm jeden Tag wieder!', boosterStore: 'BOOSTER-SHOP',
    freeBooster: 'GRATIS-BOOSTER', freeCoins: 'GRATIS-MÜNZEN', watching: 'WIRD ANGESEHEN…', loadingAd: 'Werbung lädt…', noAd: 'Keine Werbung verfügbar',
    notEnough: 'NICHT GENUG MÜNZEN',
  },
  collection: { tabs: { dragons: 'DRACHEN', buildings: 'GEBÄUDE', artifacts: 'ARTEFAKTE', awards: 'AUSZEICHNUNGEN' } },
};
