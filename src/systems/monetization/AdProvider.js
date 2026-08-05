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
 * short beat, as if a video had played to completion. A production build swaps
 * this for an AdMob/UnityAds provider via MonetizationSystem.setAdProvider() —
 * same interface, no game changes. Interstitials stay off (return false).
 */
export class SimulatedAdProvider extends AdProvider {
  isRewardedReady() { return true; }
  showRewarded() { return new Promise((resolve) => setTimeout(() => resolve(true), 650)); }
}
