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
 * Real ads via AdMob, through the Capacitor AdMob plugin
 * (@capacitor-community/admob). It talks to the plugin's RUNTIME global
 * (window.Capacitor.Plugins.AdMob) rather than an npm import, so this single-
 * file game still bundles cleanly with no plugin present, and lights up only
 * when running inside the Android wrapper that ships the plugin.
 *
 * To go live:
 *   1. Wrap the built CosmicDrift.html in a Capacitor app and add the plugin:
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
}
