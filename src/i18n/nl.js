/**
 * nl.js — Dutch language pack (Nederlands).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Nederlands' },
  common: {
    play: 'SPELEN', continue: 'DOORGAAN', resume: 'HERVATTEN', back: 'TERUG',
    claim: 'OPHALEN', free: 'GRATIS', best: 'BESTE', locked: 'VERGRENDELD', restore: 'HERSTELLEN',
    nova: 'NOVA', perfect: 'PERFECT!', newBest: 'NIEUW RECORD!', gotIt: 'BEGREPEN!',
    watch: 'BEKIJK', watchAd: 'Bekijk een korte advertentie', skipTutorial: 'TUTORIAL OVERSLAAN', tapToSkip: 'tik om over te slaan',
  },
  combo: { double: 'DUBBEL!', triple: 'TRIPLE!', quad: 'QUAD!', penta: 'PENTA!', mega: 'MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'BLOKPUZZEL IN DE LUCHT',
    events: 'EVENEMENTEN', dragons: 'DRAKEN', island: 'EILAND', shop: 'WINKEL', settings: 'INSTELLINGEN',
    daily: 'DAGELIJKS', endless: 'EINDELOOS', levels: 'LEVELS', home: 'HOME', collection: 'Collectie {a}/{b}',
  },
  daily: {
    title: 'DAGELIJKSE BELONINGEN',
    streak: 'REEKS VAN {n} DAGEN',
    day: 'DAG {n}',
    claimReward: 'VANDAAG OPHALEN',
    claimed: 'KOM MORGEN TERUG',
    rewardTitle: 'DAGELIJKSE BELONING!',
    quest: 'DAGELIJKSE OPDRACHT',
    weekly: 'WEKELIJKSE UITDAGING',
    chest: 'GRATIS KIST',
    mystery: 'MYSTERIEUS CADEAU',
    collection: 'Collectie {a}/{b} — bijna klaar!',
    questDone: 'OPDRACHT VOLTOOID!',
    weeklyDone: 'WEEK VOLTOOID!',
  },
  titles: {
    shop: 'WINKEL', settings: 'INSTELLINGEN', collection: 'COLLECTIE', events: 'EVENEMENTEN',
    paused: 'GEPAUZEERD', mainMenu: 'HOOFDMENU', floatingWorld: 'ZWEVENDE WERELD',
  },
  hud: { level: 'LEVEL {n}', worldMap: 'WERELDKAART', dragonEnergy: 'NOVA-ENERGIE', tapToStrike: 'TIK OP EEN BLOK', todaysBest: 'BESTE VAN VANDAAG' },
  levelComplete: { line1: 'LEVEL', line2: 'VOLTOOID!', earned: 'MUNTEN VERDIEND', next: 'VOLGEND LEVEL' },
  gameOver: { title: 'GAME OVER', subtitle: 'PROBEER OPNIEUW', score: 'SCORE', best: 'BESTE', retry: 'TIK OM OPNIEUW TE SPELEN', playAgain: 'OPNIEUW SPELEN', consolation: 'GOEDE POGING!' },
  settings: {
    audio: 'Muziek & geluid', haptics: 'Trillingen', reducedMotion: 'Minder animaties',
    colorBlind: 'Kleurenblindmodus', lowPerformance: 'Energiebesparing', largeUI: 'Grote interface',
    reset: 'VOORTGANG RESETTEN', language: 'Taal',
  },
  shop: {
    dailyGift: 'DAGELIJKS CADEAU', dailySub: 'Kom elke dag terug!', boosterStore: 'BOOSTERWINKEL',
    freeBooster: 'GRATIS BOOSTER', freeCoins: 'GRATIS MUNTEN', watching: 'BEZIG…', loadingAd: 'Advertentie laden…', noAd: 'Geen advertentie',
    notEnough: 'NIET GENOEG MUNTEN',
  },
  collection: { tabs: { dragons: 'DRAKEN', buildings: 'GEBOUWEN', artifacts: 'ARTEFACTEN', awards: 'PRIJZEN' } },
};
