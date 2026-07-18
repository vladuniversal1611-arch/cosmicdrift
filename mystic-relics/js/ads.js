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
  _iapReady: false,

  /* Рекламні одиниці AdMob (Mystic Relics tile-matching, Android). */
  AD_IDS: {
    banner:       'ca-app-pub-5816871059908402/7709152948',
    interstitial: 'ca-app-pub-5816871059908402/2456826267',
    rewarded:     'ca-app-pub-5816871059908402/1143744597'
  },

  /* ⚠️ Ключ RevenueCat для Google (починається з 'goog_') — вставити свій.
   * RevenueCat сам валідує чеки й «споживає» витратні товари. */
  IAP_KEY: 'goog_XXXXXXXXXXXXXXXXXXXXXXXXX',

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

  /** Плагін RevenueCat (@revenuecat/purchases-capacitor), якщо застосунок нативний. */
  _iapPlugin() {
    const C = (typeof window !== 'undefined') && window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Purchases) return C.Plugins.Purchases;
    return null;
  },

  async _iapEnsure() {
    const P = this._iapPlugin();
    if (!P || this._iapReady) return P;
    try { await P.configure({ apiKey: this.IAP_KEY }); this._iapReady = true; } catch (e) { console.warn('[IAP] configure', e); }
    return P;
  },

  /**
   * Реальна покупка. productId — з CFG.SHOP (coins_s/m/l, gems_s/m/l, premium_noads).
   * Веб-демо: «успішно» через підтвердження. Нативно: Google Play Billing (RevenueCat).
   * onSuccess() викликається ЛИШЕ після успішної, підтвердженої покупки.
   */
  async purchase(productId, onSuccess) {
    const P = await this._iapEnsure();
    if (!P) {   // веб-демо
      console.info('[IAP] Purchase placeholder:', productId);
      UI.confirm(I18N.t('demo_purchase'), I18N.t('demo_purchase_text'), onSuccess);
      return;
    }
    try {
      const { products } = await P.getProducts({ productIdentifiers: [productId] });
      if (!products || !products.length) { UI.toast('Product unavailable'); return; }
      // RevenueCat сам підтверджує/споживає транзакцію після успіху
      await P.purchaseStoreProduct({ product: products[0] });
      onSuccess();
    } catch (e) {
      if (!(e && e.userCancelled)) { console.warn('[IAP] purchase', e); UI.toast('Purchase failed'); }
    }
  },

  /** Відновлення покупок (напр. Premium) — виклич із налаштувань за потреби. */
  async restore() {
    const P = await this._iapEnsure();
    if (!P) return;
    try {
      const { customerInfo } = await P.restorePurchases();
      const ent = customerInfo && customerInfo.entitlements && customerInfo.entitlements.active;
      if (ent && ent.premium) { Storage.data.premium = true; Storage.save(); this.hideBanner(); UI.toast('✓ Premium restored'); }
    } catch (e) { console.warn('[IAP] restore', e); }
  }
};
