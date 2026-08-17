/**
 * AdProvider.js
 * -----------------------------------------------------------------------------
 * The ad-network interface + a safe default. A real integration (AdMob, etc.)
 * implements the same three methods and is injected via
 * MonetizationSystem.setAdProvider(); until then the NullAdProvider reports "no
 * fill" so the game behaves correctly with ads simply absent — never blocking.
 * -----------------------------------------------------------------------------
 */

/** @interface — shape a real provider must implement. */
export class AdProvider {
  isRewardedReady() { return false; }
  /** @returns {Promise<boolean>} resolves true if the reward was earned. */
  showRewarded(/* placement */) { return Promise.resolve(false); }
  /** @returns {Promise<boolean>} resolves true if an interstitial was shown. */
  showInterstitial(/* placement */) { return Promise.resolve(false); }
  /** Show a persistent bottom banner (idempotent). */
  showBanner() { return Promise.resolve(false); }
  /** Hide/remove the bottom banner. */
  hideBanner() { return Promise.resolve(); }
}

/** No-op provider: no ads available, everything resolves gracefully. */
export class NullAdProvider extends AdProvider {}

/**
 * A placeholder rewarded-ad provider so the "watch an ad" reward flow actually
 * completes in-build without a real ad SDK: it simply resolves `true` after a
 * short beat, as if a video had played to completion. Used in a plain browser
 * and during development. Interstitials no-op (return false) so nothing pops up
 * unexpectedly in the browser.
 */
export class SimulatedAdProvider extends AdProvider {
  isRewardedReady() { return true; }
  showRewarded() { return new Promise((resolve) => setTimeout(() => resolve(true), 650)); }
}

/**
 * Real ads through a plain Android WebView JS bridge — the path when the game
 * is wrapped in a bare WebView activity (not Capacitor). The native side injects
 * an `window.AndroidAds` object via `webView.addJavascriptInterface(...)` and
 * calls back into `window.SkydokuAds.onResult(callbackId, ok)` when an ad
 * finishes (because `@JavascriptInterface` methods are synchronous and cannot
 * return a Promise).
 *
 * BRIDGE CONTRACT — the Android wrapper implements `window.AndroidAds` with:
 *   isRewardedReady(): boolean            (optional; assume true if absent)
 *   showRewarded(placement, callbackId)   → later call SkydokuAds.onResult(callbackId, earned:boolean)
 *   showInterstitial(placement, callbackId)→ later call SkydokuAds.onResult(callbackId, shown:boolean)
 *   showBanner(): void                    (fire-and-forget)
 *   hideBanner(): void                    (fire-and-forget)
 * A method may instead return a boolean synchronously and skip the callback.
 * If the native side never answers, the call resolves false after a timeout so
 * the game never hangs.
 */
export class WebViewAdProvider extends AdProvider {
  /** True when a WebView ad bridge has been injected by the host app. */
  static available() {
    return typeof window !== 'undefined' && !!window.AndroidAds
      && typeof window.AndroidAds.showRewarded === 'function';
  }

  constructor() {
    super();
    this._bridge = window.AndroidAds;
    this._pending = new Map();   // callbackId -> resolve
    this._seq = 0;
    // The single global the native side calls back into.
    window.SkydokuAds = window.SkydokuAds || {};
    window.SkydokuAds.onResult = (id, ok) => {
      const r = this._pending.get(String(id));
      if (r) { this._pending.delete(String(id)); r(!!ok); }
    };
  }

  isRewardedReady() {
    try { return this._bridge.isRewardedReady ? !!this._bridge.isRewardedReady() : true; }
    catch { return true; }
  }

  /** Invoke a bridge method that resolves via callback (or a sync boolean). */
  _call(method, placement) {
    return new Promise((resolve) => {
      const id = 'a' + (++this._seq);
      this._pending.set(id, resolve);
      let ret;
      try { ret = this._bridge[method]?.(placement, id); }
      catch { this._pending.delete(id); resolve(false); return; }
      if (typeof ret === 'boolean') { this._pending.delete(id); resolve(ret); return; }
      // Never hang the flow if the native side goes silent.
      setTimeout(() => { if (this._pending.delete(id)) resolve(false); }, 60000);
    });
  }

  showRewarded(placement) { return this._call('showRewarded', placement); }
  showInterstitial(placement) { return this._call('showInterstitial', placement); }
  async showBanner() { try { this._bridge.showBanner?.(); return true; } catch { return false; } }
  async hideBanner() { try { this._bridge.hideBanner?.(); } catch { /* ignore */ } }
}

/**
 * Real ads via AdMob, through the Capacitor AdMob plugin
 * (@capacitor-community/admob). It talks to the plugin's RUNTIME global
 * (window.Capacitor.Plugins.AdMob) rather than an npm import, so this single-
 * file game still bundles cleanly with no plugin present, and lights up only
 * when running inside the Android wrapper that ships the plugin.
 *
 * To go live:
 *   1. Wrap the built Skydoku.html in a Capacitor app and add the plugin:
 *        npm i @capacitor-community/admob
 *   2. Put your real AdMob ids in Config.ads.admob (replace the TEST ids).
 *   3. Add the AdMob App ID to AndroidManifest.xml (per the plugin README) and
 *      run consent (UMP) — see notes below.
 *
 * NOTE: rewarded-reward delivery differs slightly by plugin version. Newer
 * versions resolve showRewardVideoAd() with the reward; some emit an
 * 'onRewardedVideoAdReward' event instead. This adapter handles the resolve
 * form and also listens for the event as a fallback. Verify on-device.
 */
export class AdMobProvider extends AdProvider {
  /** True when the native AdMob bridge is present (i.e. inside the app). */
  static available() {
    return typeof window !== 'undefined' && !!window.Capacitor?.Plugins?.AdMob;
  }

  constructor(cfg) {
    super();
    this._cfg = cfg;
    this._admob = window.Capacitor?.Plugins?.AdMob ?? null;
    this._ready = false;
  }

  /** Initialise the SDK (and request consent). Call once at boot. */
  async init() {
    if (!this._admob) return;
    try {
      await this._admob.initialize({ initializeForTesting: false });
      // Consent (GDPR/UMP): request + show the form if required, before ads.
      try {
        const info = await this._admob.requestConsentInfo?.({});
        if (info?.isConsentFormAvailable && info?.status === 'REQUIRED') {
          await this._admob.showConsentForm?.();
        }
      } catch { /* consent is best-effort; ads still serve non-personalised */ }
      this._ready = true;
    } catch { /* leave _ready false → callers fall back gracefully */ }
  }

  isRewardedReady() { return this._ready; }

  async showRewarded(/* placement */) {
    if (!this._admob) return false;
    try {
      await this._admob.prepareRewardVideoAd({ adId: this._cfg.admob.rewarded });
      let earned = false;
      const sub = await this._admob.addListener?.('onRewardedVideoAdReward', () => { earned = true; });
      const res = await this._admob.showRewardVideoAd();
      sub?.remove?.();
      // Newer plugin resolves with the reward object; older signals via event.
      return earned || !!res;
    } catch { return false; }
  }

  async showInterstitial(/* placement */) {
    if (!this._admob) return false;
    try {
      await this._admob.prepareInterstitial({ adId: this._cfg.admob.interstitial });
      await this._admob.showInterstitial();
      return true;
    } catch { return false; }
  }

  async showBanner() {
    if (!this._admob || this._bannerUp) return false;
    try {
      await this._admob.showBanner({
        adId: this._cfg.admob.banner,
        position: 'BOTTOM_CENTER',
        adSize: 'ADAPTIVE_BANNER',
        margin: 0,
      });
      this._bannerUp = true;
      return true;
    } catch { return false; }
  }

  async hideBanner() {
    if (!this._admob || !this._bannerUp) return;
    try { await (this._admob.hideBanner?.() ?? this._admob.removeBanner?.()); } catch { /* ignore */ }
    this._bannerUp = false;
  }
}
