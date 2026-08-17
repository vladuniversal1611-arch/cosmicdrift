/**
 * tr.js — Turkish language pack (Türkçe).
 * -----------------------------------------------------------------------------
 * Mirrors en.js. Missing keys fall back to English (see Localization.t).
 * -----------------------------------------------------------------------------
 */
export default {
  meta: { language: 'Türkçe' },
  common: {
    play: 'OYNA', continue: 'DEVAM', resume: 'DEVAM ET', back: 'GERİ',
    claim: 'AL', free: 'ÜCRETSİZ', best: 'REKOR', locked: 'KİLİTLİ', restore: 'GERİ YÜKLE',
    nova: 'NOVA', perfect: 'MÜKEMMEL!', newBest: 'YENİ REKOR!', gotIt: 'ANLADIM!',
    watch: 'İZLE', watchAd: 'Kısa bir reklam izle', skipTutorial: 'EĞİTİMİ GEÇ', tapToSkip: 'geçmek için dokun',
  },
  combo: { double: 'İKİLİ!', triple: 'ÜÇLÜ!', quad: 'DÖRTLÜ!', penta: 'BEŞLİ!', mega: 'MEGA!', chain: 'KOMBO ×{n}' },
  menu: {
    tagline: 'GÖKYÜZÜNDE BLOK BULMACA',
    events: 'ETKİNLİKLER', dragons: 'EJDERHALAR', island: 'ADA', shop: 'MAĞAZA', settings: 'AYARLAR',
    daily: 'GÜNLÜK', endless: 'SONSUZ', levels: 'BÖLÜMLER', home: 'ANA SAYFA', collection: 'Koleksiyon {a}/{b}',
  },
  daily: {
    title: 'GÜNLÜK ÖDÜLLER',
    streak: '{n} GÜNLÜK SERİ',
    day: 'GÜN {n}',
    claimReward: 'BUGÜN AL',
    claimed: 'YARIN GEL',
    rewardTitle: 'GÜNLÜK ÖDÜL!',
    quest: 'GÜNLÜK GÖREV',
    weekly: 'HAFTALIK MEYDAN OKUMA',
    chest: 'ÜCRETSİZ SANDIK',
    mystery: 'GİZEMLİ HEDİYE',
    collection: 'Koleksiyon {a}/{b} — az kaldı!',
    questDone: 'GÖREV TAMAMLANDI!',
    weeklyDone: 'HAFTA TAMAMLANDI!',
  },
  titles: {
    shop: 'MAĞAZA', settings: 'AYARLAR', collection: 'KOLEKSİYON', events: 'ETKİNLİKLER',
    paused: 'DURAKLATILDI', mainMenu: 'ANA MENÜ', floatingWorld: 'YÜZEN DÜNYA',
  },
  hud: { level: 'BÖLÜM {n}', worldMap: 'DÜNYA HARİTASI', dragonEnergy: 'NOVA ENERJİSİ', tapToStrike: 'BİR BLOĞA DOKUN', todaysBest: 'BUGÜNÜN REKORU' },
  levelComplete: { line1: 'BÖLÜM', line2: 'TAMAMLANDI!', earned: 'KAZANILAN ALTIN' },
  gameOver: { title: 'OYUN BİTTİ', score: 'PUAN', best: 'REKOR', retry: 'TEKRAR OYNAMAK İÇİN DOKUN', consolation: 'İYİ DENEME!' },
  settings: {
    audio: 'Müzik ve Ses', haptics: 'Titreşim', reducedMotion: 'Daha Az Animasyon',
    colorBlind: 'Renk Körü Modu', lowPerformance: 'Düşük Performans Modu', largeUI: 'Büyük Arayüz',
    reset: 'İLERLEMEYİ SIFIRLA', language: 'Dil',
  },
  shop: {
    dailyGift: 'GÜNLÜK HEDİYE', dailySub: 'Her gün gel!', boosterStore: 'GÜÇLENDİRME MAĞAZASI',
    freeBooster: 'ÜCRETSİZ GÜÇLENDİRME', freeCoins: 'ÜCRETSİZ ALTIN', watching: 'İZLENİYOR…', loadingAd: 'Reklam yükleniyor…', noAd: 'Reklam yok',
    notEnough: 'YETERLİ ALTIN YOK',
  },
  collection: { tabs: { dragons: 'EJDERHALAR', buildings: 'BİNALAR', artifacts: 'ESERLER', awards: 'ÖDÜLLER' } },
};
