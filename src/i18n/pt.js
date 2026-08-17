/**
 * pt.js — Portuguese language pack (Português).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Português' },
  common: {
    play: 'JOGAR', continue: 'CONTINUAR', resume: 'RETOMAR', back: 'VOLTAR',
    claim: 'RESGATAR', free: 'GRÁTIS', best: 'RECORDE', locked: 'BLOQUEADO', restore: 'RESTAURAR',
    nova: 'NOVA', perfect: 'PERFEITO!', newBest: 'NOVO RECORDE!', gotIt: 'ENTENDI!',
    watch: 'ASSISTIR', watchAd: 'Assista a um anúncio curto', skipTutorial: 'PULAR TUTORIAL', tapToSkip: 'toque para pular',
  },
  combo: { double: 'DUPLO!', triple: 'TRIPLO!', quad: 'QUÁDRUPLO!', penta: 'QUÍNTUPLO!', mega: 'MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'QUEBRA-CABEÇA DE BLOCOS NO CÉU',
    events: 'EVENTOS', dragons: 'DRAGÕES', island: 'ILHA', shop: 'LOJA', settings: 'AJUSTES',
    daily: 'DIÁRIO', endless: 'INFINITO', levels: 'NÍVEIS', home: 'INÍCIO', collection: 'Coleção {a}/{b}',
  },
  daily: {
    title: 'RECOMPENSAS DIÁRIAS',
    streak: 'SEQUÊNCIA DE {n} DIAS',
    day: 'DIA {n}',
    claimReward: 'RESGATAR HOJE',
    claimed: 'VOLTE AMANHÃ',
    rewardTitle: 'RECOMPENSA DIÁRIA!',
    quest: 'MISSÃO DIÁRIA',
    weekly: 'DESAFIO SEMANAL',
    chest: 'BAÚ GRÁTIS',
    mystery: 'PRESENTE MISTERIOSO',
    collection: 'Coleção {a}/{b} — quase lá!',
    questDone: 'MISSÃO CONCLUÍDA!',
    weeklyDone: 'SEMANA CONCLUÍDA!',
  },
  titles: {
    shop: 'LOJA', settings: 'AJUSTES', collection: 'COLEÇÃO', events: 'EVENTOS',
    paused: 'PAUSADO', mainMenu: 'MENU PRINCIPAL', floatingWorld: 'MUNDO FLUTUANTE',
  },
  hud: { level: 'NÍVEL {n}', worldMap: 'MAPA DO MUNDO', dragonEnergy: 'ENERGIA NOVA', tapToStrike: 'TOQUE EM UM BLOCO', todaysBest: 'MELHOR DE HOJE' },
  levelComplete: { line1: 'NÍVEL', line2: 'CONCLUÍDO!', earned: 'MOEDAS GANHAS' },
  gameOver: { title: 'FIM DE JOGO', subtitle: 'TENTE DE NOVO', score: 'PONTOS', best: 'RECORDE', retry: 'TOQUE PARA JOGAR DE NOVO', playAgain: 'JOGAR DE NOVO', consolation: 'BOA TENTATIVA!' },
  settings: {
    audio: 'Música e som', haptics: 'Vibração', reducedMotion: 'Menos animações',
    colorBlind: 'Modo daltônico', lowPerformance: 'Modo economia', largeUI: 'Interface grande',
    reset: 'REINICIAR PROGRESSO', language: 'Idioma',
  },
  shop: {
    dailyGift: 'PRESENTE DIÁRIO', dailySub: 'Volte todo dia!', boosterStore: 'LOJA DE BOOSTERS',
    freeBooster: 'BOOSTER GRÁTIS', freeCoins: 'MOEDAS GRÁTIS', watching: 'ASSISTINDO…', loadingAd: 'Carregando anúncio…', noAd: 'Nenhum anúncio disponível',
    notEnough: 'MOEDAS INSUFICIENTES',
  },
  collection: { tabs: { dragons: 'DRAGÕES', buildings: 'EDIFÍCIOS', artifacts: 'ARTEFATOS', awards: 'PRÊMIOS' } },
};
