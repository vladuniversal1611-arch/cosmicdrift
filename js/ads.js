/* ============================================================
   ADS — шар монетизації (заглушки для AdMob / Unity Ads)
   При експорті в Google Play підключіть SDK у вебв'ю-обгортці
   (Capacitor/Cordova/TWA) і замініть реалізації нижче.
   Ігровий код викликає ТІЛЬКИ цей інтерфейс.
   ============================================================ */
const Ads = (() => {
  let interstitialCounter = 0;
  const INTERSTITIAL_EVERY = 3; // показ через кожні N програшів/рівнів

  /** Чи вимкнена реклама покупкою Premium */
  function disabled() { return Storage.s.removeAds; }

  /**
   * Rewarded — реклама за нагороду.
   * У продакшені: показати AdMob rewarded, викликати onReward після перегляду.
   * Заглушка: імітує 1.2с "перегляду" з оверлеєм.
   */
  function showRewarded(onReward, onFail) {
    // ЗАГЛУШКА: тут викликається нативний SDK, напр.:
    // window.AndroidBridge?.showRewarded() -> callback
    simulateAd('REWARDED AD', 1200, () => {
      Storage.s.stats.adsWatched++;
      Storage.save();
      Analytics.log('ad_rewarded');
      onReward && onReward();
    }, onFail);
  }

  /**
   * Interstitial — міжекранна реклама (після рівнів).
   * Викликається з лічильником, щоб не дратувати гравця.
   */
  function maybeInterstitial(done) {
    if (disabled()) { done && done(); return; }
    interstitialCounter++;
    if (interstitialCounter % INTERSTITIAL_EVERY !== 0) { done && done(); return; }
    // ЗАГЛУШКА для нативного interstitial
    simulateAd('INTERSTITIAL AD', 900, done, done);
  }

  /** Banner — нижній банер (місце в DOM уже зарезервоване) */
  function refreshBanner() {
    const slot = document.getElementById('banner-slot');
    if (!slot) return;
    if (disabled()) { slot.style.display = 'none'; return; }
    slot.style.display = '';
    // ЗАГЛУШКА: тут ініціалізується нативний банер AdMob
  }

  /** Імітація реклами: короткий оверлей (лише для розробки/превʼю) */
  function simulateAd(label, ms, onDone, onFail) {
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal" style="text-align:center">
      <div style="font-size:40px">📺</div>
      <h2 style="margin-top:8px">${label}</h2>
      <div class="modal-sub">stub — replace with AdMob SDK</div>
      <div class="progress-track"><div class="progress-fill" style="width:0%"></div></div>
    </div>`;
    document.getElementById('modal-root').appendChild(ov);
    const fill = ov.querySelector('.progress-fill');
    requestAnimationFrame(() => { fill.style.transition = `width ${ms}ms linear`; fill.style.width = '100%'; });
    setTimeout(() => { ov.remove(); onDone && onDone(); }, ms + 100);
  }

  /* ---------- In-App Purchases (заглушки) ---------- */
  // У продакшені: Google Play Billing через обгортку.
  const IAP_CATALOG = [
    { id: 'coins_small',  coins: 1000,  price: '$0.99'  },
    { id: 'coins_medium', coins: 6000,  price: '$4.99'  },
    { id: 'coins_large',  coins: 15000, price: '$9.99'  },
    { id: 'gems_small',   gems: 50,     price: '$1.99'  },
    { id: 'remove_ads',   removeAds: true, price: '$2.99' },
  ];

  function purchase(productId, onSuccess) {
    const item = IAP_CATALOG.find(p => p.id === productId);
    if (!item) return;
    // ЗАГЛУШКА: імітуємо миттєву успішну покупку
    if (item.coins) { Storage.s.coins += item.coins; Storage.s.stats.coinsEarned += item.coins; }
    if (item.gems) Storage.s.gems += item.gems;
    if (item.removeAds) { Storage.s.removeAds = true; refreshBanner(); }
    Storage.save();
    Analytics.log('iap_purchase', { id: productId });
    onSuccess && onSuccess(item);
  }

  return { disabled, showRewarded, maybeInterstitial, refreshBanner, purchase, IAP_CATALOG };
})();
