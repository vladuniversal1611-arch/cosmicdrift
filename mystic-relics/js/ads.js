/* ============================================================
 * Mystic Relics — ads.js
 * Заглушки монетизації. Готові точки інтеграції AdMob
 * (через Capacitor-плагін @capacitor-community/admob) та
 * In-App Purchases (@capacitor/purchases або RevenueCat).
 *
 * Як підключити AdMob:
 *   npm i @capacitor-community/admob
 *   Замінити тіла методів нижче на виклики плагіна —
 *   сигнатури вже відповідають типовим сценаріям.
 * ============================================================ */
'use strict';

const Ads = {
  _levelCounter: 0,

  /** Банер знизу ігрового екрана (плейсхолдер #adBanner). */
  showBanner() {
    const el = document.getElementById('adBanner');
    if (Storage.data.premium) { if (el) el.classList.add('hidden'); return; }
    if (el) el.classList.remove('hidden');
    // TODO AdMob: AdMob.showBanner({ adId: 'ca-app-pub-XXX/banner', position: 'BOTTOM_CENTER' });
  },

  hideBanner() {
    const el = document.getElementById('adBanner');
    if (el) el.classList.add('hidden');
    // TODO AdMob: AdMob.hideBanner();
  },

  /** Міжсторінкова реклама — кожні 3 пройдені рівні. */
  maybeInterstitial() {
    if (Storage.data.premium) return;
    this._levelCounter++;
    if (this._levelCounter % 3 === 0) {
      // TODO AdMob: AdMob.prepareInterstitial({...}); AdMob.showInterstitial();
      console.info('[Ads] Interstitial placeholder');
    }
  },

  /**
   * Реклама з нагородою. onReward викликається ЛИШЕ після
   * успішного перегляду. У веб-версії — миттєва нагорода (демо).
   */
  showRewarded(onReward) {
    if (Storage.data.premium) { onReward(); return; }
    // TODO AdMob: AdMob.prepareRewardVideoAd({...});
    //             AdMob.addListener('onRewardedVideoAdReward', onReward);
    console.info('[Ads] Rewarded placeholder — нагорода видана одразу (демо)');
    onReward();
  },

  /**
   * In-App Purchase заглушка. productId — з CFG.SHOP.
   * У веб-демо покупка «успішна» одразу.
   */
  purchase(productId, onSuccess) {
    // TODO IAP: Purchases.purchaseProduct({ productIdentifier: productId })
    console.info('[IAP] Purchase placeholder:', productId);
    UI.confirm('Демо-покупка', 'У веб-версії покупки безкоштовні для тестування. Продовжити?', onSuccess);
  }
};
