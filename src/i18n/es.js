/**
 * es.js — Spanish language pack (Español).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Español' },
  common: {
    play: 'JUGAR', continue: 'CONTINUAR', resume: 'REANUDAR', back: 'ATRÁS',
    claim: 'RECLAMAR', free: 'GRATIS', best: 'RÉCORD', locked: 'BLOQUEADO', restore: 'RESTAURAR',
    nova: 'NOVA', perfect: '¡PERFECTO!', newBest: '¡NUEVO RÉCORD!', gotIt: '¡ENTENDIDO!',
    watch: 'VER', watchAd: 'Ver un anuncio corto', skipTutorial: 'OMITIR TUTORIAL', tapToSkip: 'toca para omitir',
  },
  combo: { double: '¡DOBLE!', triple: '¡TRIPLE!', quad: '¡CUÁDRUPLE!', penta: '¡QUÍNTUPLE!', mega: '¡MEGA!', chain: 'COMBO ×{n}' },
  menu: {
    tagline: 'PUZLE DE BLOQUES EN EL CIELO',
    events: 'EVENTOS', dragons: 'DRAGONES', island: 'ISLA', shop: 'TIENDA', settings: 'AJUSTES',
    daily: 'DIARIO', endless: 'INFINITO', levels: 'NIVELES', home: 'INICIO', collection: 'Colección {a}/{b}',
  },
  daily: {
    title: 'RECOMPENSAS DIARIAS',
    streak: 'RACHA DE {n} DÍAS',
    day: 'DÍA {n}',
    claimReward: 'RECLAMAR HOY',
    claimed: 'VUELVE MAÑANA',
    rewardTitle: '¡RECOMPENSA DIARIA!',
    quest: 'MISIÓN DIARIA',
    weekly: 'RETO SEMANAL',
    chest: 'COFRE GRATIS',
    mystery: 'REGALO MISTERIOSO',
    collection: 'Colección {a}/{b} — ¡casi lo tienes!',
    questDone: '¡MISIÓN COMPLETADA!',
    weeklyDone: '¡SEMANA COMPLETADA!',
  },
  titles: {
    shop: 'TIENDA', settings: 'AJUSTES', collection: 'COLECCIÓN', events: 'EVENTOS',
    paused: 'PAUSA', mainMenu: 'MENÚ PRINCIPAL', floatingWorld: 'MUNDO FLOTANTE',
  },
  hud: { level: 'NIVEL {n}', worldMap: 'MAPA DEL MUNDO', dragonEnergy: 'ENERGÍA NOVA', tapToStrike: 'TOCA UN BLOQUE', todaysBest: 'MEJOR DE HOY' },
  levelComplete: { line1: 'NIVEL', line2: '¡COMPLETADO!', earned: 'MONEDAS GANADAS' },
  gameOver: { title: 'FIN DEL JUEGO', subtitle: 'INTÉNTALO DE NUEVO', score: 'PUNTOS', best: 'RÉCORD', retry: 'TOCA PARA JUGAR DE NUEVO', playAgain: 'JUGAR DE NUEVO', consolation: '¡BUEN INTENTO!' },
  settings: {
    audio: 'Música y sonido', haptics: 'Vibración', reducedMotion: 'Menos animaciones',
    colorBlind: 'Modo daltónico', lowPerformance: 'Modo de ahorro', largeUI: 'Interfaz grande',
    reset: 'REINICIAR PROGRESO', language: 'Idioma',
  },
  shop: {
    dailyGift: 'REGALO DIARIO', dailySub: '¡Vuelve cada día!', boosterStore: 'TIENDA DE MEJORAS',
    freeBooster: 'MEJORA GRATIS', freeCoins: 'MONEDAS GRATIS', watching: 'VIENDO…', loadingAd: 'Cargando anuncio…', noAd: 'No hay anuncios',
    notEnough: 'MONEDAS INSUFICIENTES',
  },
  collection: { tabs: { dragons: 'DRAGONES', buildings: 'EDIFICIOS', artifacts: 'ARTEFACTOS', awards: 'PREMIOS' } },
};
