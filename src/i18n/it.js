/**
 * it.js — Italian language pack (Italiano).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Italiano' },
  common: {
    play: 'GIOCA', continue: 'CONTINUA', resume: 'RIPRENDI', back: 'INDIETRO',
    claim: 'RISCUOTI', free: 'GRATIS', best: 'RECORD', locked: 'BLOCCATO', restore: 'RIPRISTINA',
    nova: 'NOVA', perfect: 'PERFETTO!', newBest: 'NUOVO RECORD!', gotIt: 'CAPITO!',
    watch: 'GUARDA', watchAd: 'Guarda un breve annuncio', skipTutorial: 'SALTA TUTORIAL', tapToSkip: 'tocca per saltare',
  },
  combo: { double: 'DOPPIO!', triple: 'TRIPLO!', quad: 'QUADRUPLO!', penta: 'QUINTUPLO!', mega: 'MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'PUZZLE DI BLOCCHI NEL CIELO',
    events: 'EVENTI', dragons: 'DRAGHI', island: 'ISOLA', shop: 'NEGOZIO', settings: 'IMPOSTAZIONI',
    daily: 'GIORNALIERO', endless: 'INFINITO', levels: 'LIVELLI', home: 'HOME', collection: 'Collezione {a}/{b}',
  },
  daily: {
    title: 'RICOMPENSE GIORNALIERE',
    streak: 'SERIE DI {n} GIORNI',
    day: 'GIORNO {n}',
    claimReward: 'RISCUOTI OGGI',
    claimed: 'TORNA DOMANI',
    rewardTitle: 'RICOMPENSA GIORNALIERA!',
    quest: 'MISSIONE DEL GIORNO',
    weekly: 'SFIDA SETTIMANALE',
    chest: 'FORZIERE GRATIS',
    mystery: 'REGALO MISTERIOSO',
    collection: 'Collezione {a}/{b} — ci sei quasi!',
    questDone: 'MISSIONE COMPLETATA!',
    weeklyDone: 'SETTIMANA COMPLETATA!',
  },
  titles: {
    shop: 'NEGOZIO', settings: 'IMPOSTAZIONI', collection: 'COLLEZIONE', events: 'EVENTI',
    paused: 'IN PAUSA', mainMenu: 'MENU PRINCIPALE', floatingWorld: 'MONDO FLUTTUANTE',
  },
  hud: { level: 'LIVELLO {n}', worldMap: 'MAPPA DEL MONDO', dragonEnergy: 'ENERGIA NOVA', tapToStrike: 'TOCCA UN BLOCCO', todaysBest: 'MIGLIORE DI OGGI' },
  levelComplete: { line1: 'LIVELLO', line2: 'COMPLETATO!', earned: 'MONETE GUADAGNATE', next: 'LIVELLO SUCCESSIVO' },
  gameOver: { title: 'GAME OVER', subtitle: 'RIPROVA', score: 'PUNTEGGIO', best: 'RECORD', retry: 'TOCCA PER RIGIOCARE', playAgain: 'GIOCA ANCORA', consolation: 'BEL TENTATIVO!' },
  settings: {
    audio: 'Musica e suoni', haptics: 'Vibrazione', reducedMotion: 'Meno animazioni',
    colorBlind: 'Modalità daltonici', lowPerformance: 'Modalità risparmio', largeUI: 'Interfaccia grande',
    reset: 'AZZERA PROGRESSI', language: 'Lingua',
  },
  shop: {
    dailyGift: 'REGALO GIORNALIERO', dailySub: 'Torna ogni giorno!', boosterStore: 'NEGOZIO BOOSTER',
    freeBooster: 'BOOSTER GRATIS', freeCoins: 'MONETE GRATIS', watching: 'IN RIPRODUZIONE…', loadingAd: 'Caricamento annuncio…', noAd: 'Nessun annuncio disponibile',
    notEnough: 'MONETE INSUFFICIENTI',
  },
  collection: { tabs: { dragons: 'DRAGHI', buildings: 'EDIFICI', artifacts: 'ARTEFATTI', awards: 'PREMI' } },
};
