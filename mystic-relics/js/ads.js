/* ============================================================
 * Mystic Relics — ads.js
 * Монетизація з ДВОМА шляхами:
 *   • Веб (демо)  — заглушки: rewarded видає нагороду одразу,
 *                   покупка «успішна» через підтвердження.
 *   • Нативно (Capacitor + @capacitor-community/admob) — реальні
 *     виклики плагіна. Активується САМЕ ТОДІ, коли плагін присутній,
 *     тож той самий код працює і в браузері, і в застосунку.
 *
 * Що зробити для релізу:
 *   1) npm i @capacitor-community/admob && npx cap sync
 *   2) У AD_IDS нижче замінити ТЕСТОВІ id Google на свої (AdMob).
 *   3) App ID AdMob прописати в android/app/src/main/AndroidManifest.xml
 *      (<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" .../>)
 *      і додати дозвіл AD_ID (див. EXPORT_CHECKLIST.md).
 *   4) IAP: підключити @capacitor/purchases або RevenueCat у purchase().
 * ============================================================ */
'use strict';

const Ads = {
  _levelCounter: 0,
  _initDone: false,

  /* ⚠️ ТЕСТОВІ рекламні одиниці Google — замінити на власні перед публікацією. */
  AD_IDS: {
    banner:       'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded:     'ca-app-pub-3940256099942544/5224354917'
  },

  /** Плагін AdMob, якщо застосунок запущено нативно; інакше null (веб). */
  _plugin() {
    const C = (typeof window !== 'undefined') && window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.AdMob) return C.Plugins.AdMob;
    return null;
  },

  async _ensureInit() {
    const AdMob = this._plugin();
    if (!AdMob || this._initDone) return AdMob;
    try { await AdMob.initialize({ initializeForTesting: false }); } catch (e) { console.warn('[Ads] init', e); }
    this._initDone = true;
    return AdMob;
  },

  /** Банер знизу ігрового екрана (плейсхолдер #adBanner у вебі). */
  async showBanner() {
    const el = document.getElementById('adBanner');
    if (Storage.data.premium) { if (el) el.classList.add('hidden'); return; }
    const AdMob = await this._ensureInit();
    if (AdMob) {
      if (el) el.classList.add('hidden');   // нативний банер малює плагін, не HTML
      try {
        await AdMob.showBanner({
          adId: this.AD_IDS.banner, adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER', margin: 0
        });
        document.documentElement.style.setProperty('--banner-h', '56px');
      } catch (e) { console.warn('[Ads] banner', e); }
      return;
    }
    if (el) el.classList.remove('hidden');   // веб-демо: показуємо плейсхолдер
  },

  async hideBanner() {
    const el = document.getElementById('adBanner');
    if (el) el.classList.add('hidden');
    document.documentElement.style.setProperty('--banner-h', '0px');
    const AdMob = this._plugin();
    if (AdMob) { try { await AdMob.hideBanner(); await AdMob.removeBanner(); } catch (e) {} }
  },

  /** Міжсторінкова реклама — кожні 3 пройдені рівні. */
  async maybeInterstitial() {
    if (Storage.data.premium) return;
    this._levelCounter++;
    if (this._levelCounter % 3 !== 0) return;
    const AdMob = await this._ensureInit();
    if (!AdMob) { console.info('[Ads] Interstitial placeholder'); return; }
    try {
      await AdMob.prepareInterstitial({ adId: this.AD_IDS.interstitial });
      await AdMob.showInterstitial();
    } catch (e) { console.warn('[Ads] interstitial', e); }
  },

  /**
   * Реклама з нагородою. onReward викликається ЛИШЕ після успішного
   * перегляду (нативно) або одразу (веб-демо).
   */
  async showRewarded(onReward) {
    if (Storage.data.premium) { onReward(); return; }
    const AdMob = await this._ensureInit();
    if (!AdMob) {
      console.info('[Ads] Rewarded placeholder — нагорода видана одразу (демо)');
      onReward();
      return;
    }
    try {
      await AdMob.prepareRewardVideoAd({ adId: this.AD_IDS.rewarded });
      const reward = await AdMob.showRewardVideoAd();   // резолвиться після повного перегляду
      if (reward) onReward();
    } catch (e) { console.warn('[Ads] rewarded', e); }
  },

  /**
   * In-App Purchase. У веб-демо покупка «успішна» через підтвердження.
   * Нативно — підключити @capacitor/purchases / RevenueCat тут.
   */
  purchase(productId, onSuccess) {
    // TODO IAP: const { Purchases } = window.Capacitor.Plugins;
    //           Purchases.purchaseProduct({ productIdentifier: productId }).then(onSuccess);
    console.info('[IAP] Purchase placeholder:', productId);
    UI.confirm(I18N.t('demo_purchase'), I18N.t('demo_purchase_text'), onSuccess);
  }
};
