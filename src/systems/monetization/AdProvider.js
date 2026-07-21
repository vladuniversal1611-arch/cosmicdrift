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
