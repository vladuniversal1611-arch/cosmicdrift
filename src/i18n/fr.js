/**
 * fr.js — French language pack (Français).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Français' },
  common: {
    play: 'JOUER', continue: 'CONTINUER', resume: 'REPRENDRE', back: 'RETOUR',
    claim: 'RÉCLAMER', free: 'GRATUIT', best: 'MEILLEUR', locked: 'VERROUILLÉ', restore: 'RESTAURER',
    nova: 'NOVA', perfect: 'PARFAIT !', newBest: 'NOUVEAU RECORD !', gotIt: 'COMPRIS !',
    watch: 'REGARDER', watchAd: 'Regarder une courte pub', skipTutorial: 'PASSER LE TUTO', tapToSkip: 'toucher pour passer',
  },
  combo: { double: 'DOUBLE !', triple: 'TRIPLE !', quad: 'QUADRUPLE !', penta: 'QUINTUPLE !', mega: 'MÉGA !', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'PUZZLE DE BLOCS DANS LE CIEL',
    events: 'ÉVÉNEMENTS', dragons: 'DRAGONS', island: 'ÎLE', shop: 'BOUTIQUE', settings: 'RÉGLAGES',
    daily: 'QUOTIDIEN', endless: 'INFINI', levels: 'NIVEAUX', home: 'ACCUEIL', collection: 'Collection {a}/{b}',
  },
  daily: {
    title: 'RÉCOMPENSES QUOTIDIENNES',
    streak: 'SÉRIE DE {n} JOURS',
    day: 'JOUR {n}',
    claimReward: "RÉCLAMER AUJOURD'HUI",
    claimed: 'REVIENS DEMAIN',
    rewardTitle: 'RÉCOMPENSE QUOTIDIENNE !',
    quest: 'QUÊTE DU JOUR',
    weekly: 'DÉFI HEBDO',
    chest: 'COFFRE GRATUIT',
    mystery: 'CADEAU MYSTÈRE',
    collection: 'Collection {a}/{b} — presque fini !',
    questDone: 'QUÊTE TERMINÉE !',
    weeklyDone: 'SEMAINE TERMINÉE !',
  },
  titles: {
    shop: 'BOUTIQUE', settings: 'RÉGLAGES', collection: 'COLLECTION', events: 'ÉVÉNEMENTS',
    paused: 'PAUSE', mainMenu: 'MENU PRINCIPAL', floatingWorld: 'MONDE FLOTTANT',
  },
  hud: { level: 'NIVEAU {n}', worldMap: 'CARTE DU MONDE', dragonEnergy: 'ÉNERGIE NOVA', tapToStrike: 'TOUCHE UN BLOC', todaysBest: 'MEILLEUR DU JOUR' },
  levelComplete: { line1: 'NIVEAU', line2: 'TERMINÉ !', earned: 'PIÈCES GAGNÉES' },
  gameOver: { title: 'PARTIE TERMINÉE', score: 'SCORE', best: 'MEILLEUR', retry: 'TOUCHER POUR REJOUER', consolation: 'BIEN ESSAYÉ !' },
  settings: {
    audio: 'Musique et son', haptics: 'Vibrations', reducedMotion: 'Moins d’animations',
    colorBlind: 'Mode daltonien', lowPerformance: 'Mode économie', largeUI: 'Grande interface',
    reset: 'RÉINITIALISER', language: 'Langue',
  },
  shop: {
    dailyGift: 'CADEAU QUOTIDIEN', dailySub: 'Reviens chaque jour !', boosterStore: 'BOUTIQUE DE BOOSTERS',
    freeBooster: 'BOOSTER GRATUIT', freeCoins: 'PIÈCES GRATUITES', watching: 'LECTURE…', loadingAd: 'Chargement de la pub…', noAd: 'Aucune pub disponible',
    notEnough: 'PAS ASSEZ DE PIÈCES',
  },
  collection: { tabs: { dragons: 'DRAGONS', buildings: 'BÂTIMENTS', artifacts: 'ARTEFACTS', awards: 'RÉCOMPENSES' } },
};
