/**
 * pl.js — Polish language pack (Polski).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Polski' },
  common: {
    play: 'GRAJ', continue: 'DALEJ', resume: 'WZNÓW', back: 'WSTECZ',
    claim: 'ODBIERZ', free: 'ZA DARMO', best: 'REKORD', locked: 'ZABLOKOWANE', restore: 'PRZYWRÓĆ',
    nova: 'NOVA', perfect: 'IDEALNIE!', newBest: 'NOWY REKORD!', gotIt: 'ROZUMIEM!',
    watch: 'OGLĄDAJ', watchAd: 'Obejrzyj krótką reklamę', skipTutorial: 'POMIŃ SAMOUCZEK', tapToSkip: 'dotknij, aby pominąć',
  },
  combo: { double: 'PODWÓJNE!', triple: 'POTRÓJNE!', quad: 'POCZWÓRNE!', penta: 'PIĘCIOKROTNE!', mega: 'MEGA!', chain: 'KOMBO ×{n}' },
  menu: {
    tagline: 'UKŁADANKA Z BLOKÓW W CHMURACH',
    events: 'WYDARZENIA', dragons: 'SMOKI', island: 'WYSPA', shop: 'SKLEP', settings: 'USTAWIENIA',
    daily: 'CODZIENNE', endless: 'BEZ KOŃCA', levels: 'POZIOMY', home: 'MENU', collection: 'Kolekcja {a}/{b}',
  },
  daily: {
    title: 'CODZIENNE NAGRODY',
    streak: 'SERIA {n} DNI',
    day: 'DZIEŃ {n}',
    claimReward: 'ODBIERZ DZIŚ',
    claimed: 'WRÓĆ JUTRO',
    rewardTitle: 'CODZIENNA NAGRODA!',
    quest: 'CODZIENNE ZADANIE',
    weekly: 'WYZWANIE TYGODNIA',
    chest: 'DARMOWA SKRZYNIA',
    mystery: 'TAJEMNICZY PREZENT',
    collection: 'Kolekcja {a}/{b} — już blisko!',
    questDone: 'ZADANIE UKOŃCZONE!',
    weeklyDone: 'TYDZIEŃ UKOŃCZONY!',
  },
  titles: {
    shop: 'SKLEP', settings: 'USTAWIENIA', collection: 'KOLEKCJA', events: 'WYDARZENIA',
    paused: 'PAUZA', mainMenu: 'MENU GŁÓWNE', floatingWorld: 'UNOSZĄCY SIĘ ŚWIAT',
  },
  hud: { level: 'POZIOM {n}', worldMap: 'MAPA ŚWIATA', dragonEnergy: 'ENERGIA NOVA', tapToStrike: 'DOTKNIJ BLOKU', todaysBest: 'DZISIEJSZY REKORD' },
  levelComplete: { line1: 'POZIOM', line2: 'UKOŃCZONY!', earned: 'ZDOBYTE MONETY' },
  gameOver: { title: 'KONIEC GRY', score: 'WYNIK', best: 'REKORD', retry: 'DOTKNIJ, ABY ZAGRAĆ PONOWNIE', consolation: 'DOBRA PRÓBA!' },
  settings: {
    audio: 'Muzyka i dźwięk', haptics: 'Wibracje', reducedMotion: 'Mniej animacji',
    colorBlind: 'Tryb dla daltonistów', lowPerformance: 'Tryb oszczędzania', largeUI: 'Duży interfejs',
    reset: 'ZRESETUJ POSTĘP', language: 'Język',
  },
  shop: {
    dailyGift: 'CODZIENNY PREZENT', dailySub: 'Wracaj codziennie!', boosterStore: 'SKLEP Z DOPALACZAMI',
    freeBooster: 'DARMOWY DOPALACZ', freeCoins: 'DARMOWE MONETY', watching: 'OGLĄDANIE…', loadingAd: 'Ładowanie reklamy…', noAd: 'Brak reklamy',
    notEnough: 'ZA MAŁO MONET',
  },
  collection: { tabs: { dragons: 'SMOKI', buildings: 'BUDYNKI', artifacts: 'ARTEFAKTY', awards: 'NAGRODY' } },
};
