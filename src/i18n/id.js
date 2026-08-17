/**
 * id.js — Indonesian language pack (Bahasa Indonesia).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Bahasa Indonesia' },
  common: {
    play: 'MAIN', continue: 'LANJUT', resume: 'LANJUTKAN', back: 'KEMBALI',
    claim: 'AMBIL', free: 'GRATIS', best: 'TERBAIK', locked: 'TERKUNCI', restore: 'PULIHKAN',
    nova: 'NOVA', perfect: 'SEMPURNA!', newBest: 'REKOR BARU!', gotIt: 'MENGERTI!',
    watch: 'TONTON', watchAd: 'Tonton iklan singkat', skipTutorial: 'LEWATI TUTORIAL', tapToSkip: 'ketuk untuk melewati',
  },
  combo: { double: 'GANDA!', triple: 'TRIPEL!', quad: 'QUAD!', penta: 'PENTA!', mega: 'MEGA!', chain: 'KOMBO ×{n}' },
  menu: {
    tagline: 'TEKA-TEKI BALOK DI LANGIT',
    events: 'ACARA', dragons: 'NAGA', island: 'PULAU', shop: 'TOKO', settings: 'PENGATURAN',
    daily: 'HARIAN', endless: 'TANPA BATAS', levels: 'LEVEL', home: 'BERANDA', collection: 'Koleksi {a}/{b}',
  },
  daily: {
    title: 'HADIAH HARIAN',
    streak: 'RENTETAN {n} HARI',
    day: 'HARI {n}',
    claimReward: 'AMBIL HARI INI',
    claimed: 'KEMBALI BESOK',
    rewardTitle: 'HADIAH HARIAN!',
    quest: 'MISI HARIAN',
    weekly: 'TANTANGAN MINGGUAN',
    chest: 'PETI GRATIS',
    mystery: 'HADIAH MISTERI',
    collection: 'Koleksi {a}/{b} — hampir selesai!',
    questDone: 'MISI SELESAI!',
    weeklyDone: 'MINGGU SELESAI!',
  },
  titles: {
    shop: 'TOKO', settings: 'PENGATURAN', collection: 'KOLEKSI', events: 'ACARA',
    paused: 'JEDA', mainMenu: 'MENU UTAMA', floatingWorld: 'DUNIA MELAYANG',
  },
  hud: { level: 'LEVEL {n}', worldMap: 'PETA DUNIA', dragonEnergy: 'ENERGI NOVA', tapToStrike: 'KETUK SEBUAH BALOK', todaysBest: 'TERBAIK HARI INI' },
  levelComplete: { line1: 'LEVEL', line2: 'SELESAI!', earned: 'KOIN DIPEROLEH' },
  gameOver: { title: 'GAME OVER', score: 'SKOR', best: 'TERBAIK', retry: 'KETUK UNTUK MAIN LAGI', consolation: 'USAHA BAGUS!' },
  settings: {
    audio: 'Musik & Suara', haptics: 'Getaran', reducedMotion: 'Kurangi Animasi',
    colorBlind: 'Mode Buta Warna', lowPerformance: 'Mode Hemat Daya', largeUI: 'Antarmuka Besar',
    reset: 'ATUR ULANG PROGRES', language: 'Bahasa',
  },
  shop: {
    dailyGift: 'HADIAH HARIAN', dailySub: 'Kembali setiap hari!', boosterStore: 'TOKO BOOSTER',
    freeBooster: 'BOOSTER GRATIS', freeCoins: 'KOIN GRATIS', watching: 'MENONTON…', loadingAd: 'Memuat iklan…', noAd: 'Tidak ada iklan',
    notEnough: 'KOIN TIDAK CUKUP',
  },
  collection: { tabs: { dragons: 'NAGA', buildings: 'BANGUNAN', artifacts: 'ARTEFAK', awards: 'PENGHARGAAN' } },
};
