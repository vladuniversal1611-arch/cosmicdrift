/**
 * MonetizationSystem.js
 * -----------------------------------------------------------------------------
 * Architecture for a respectful, player-first store. It owns durable
 * entitlements (Remove Ads, VIP, Premium Pass) persisted in the save, a
 * purchase flow that grants currency/entitlements (stubbed — no real IAP), and
 * an ad layer over a pluggable AdProvider (rewarded ads are always opt-in;
 * interstitials are frequency-capped and suppressed for Remove-Ads/VIP owners).
 *
 * No provider ships, so nothing is ever shown; this is the seam a storefront +
 * ad SDK plug into later. Every transaction emits an event the AnalyticsSystem
 * records.
 *
 * Events:
 *   emits 'monetization:purchased' ({ id, entitlements, currency })
 *         'ads:rewarded' ({ placement }) / 'ads:interstitial' ({ placement })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Products } from './Products.js';
import { SimulatedAdProvider, AdMobProvider } from './AdProvider.js';
import { Config } from '../../config/Config.js';
import { Logger } from '../../utils/Logger.js';

export class MonetizationSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'monetization';
    this._ent = null;
    this._ads = new SimulatedAdProvider();
    this._lastInterstitial = -Infinity;
    this._lastRewarded = -Infinity;
    this._gameOvers = 0;
  }

  onInit() {
    this._ent = this.game.getSystem('save')?.registerSlice('entitlements',
      () => ({ removeAds: false, vip: false, premiumPass: false, ownedOnce: {} }))
      ?? { removeAds: false, vip: false, premiumPass: false, ownedOnce: {} };

    // Use real AdMob when the native bridge is present (i.e. inside the Android
    // wrapper); otherwise keep the simulator so the flows work in a browser.
    if (Config.ads.enabled && AdMobProvider.available()) {
      const p = new AdMobProvider(Config.ads);
      p.init();
      this._ads = p;
      Logger.info('Monetization', 'AdMob bridge detected — real ads enabled');
    }

    // Interstitials fire at natural breaks only: count ended runs, and offer one
    // when the player chooses to play again.
    this.listen('game:over', () => { this._gameOvers++; });
    this.listen('ui:restart', () => this.maybeInterstitial('retry'));
  }

  // --- Entitlements ----------------------------------------------------------
  has(entitlement) { return !!this._ent[entitlement]; }
  get adsRemoved() { return this._ent.removeAds || this._ent.vip; }

  // --- Purchases (stub: grants immediately; real IAP validates first) --------
  /** @returns {boolean} whether the purchase completed. */
  purchase(productId) {
    const p = Products[productId];
    if (!p) return false;
    if (p.once && this._ent.ownedOnce[productId]) return false;

    for (const e of (p.entitlements ?? [])) this._ent[e] = true;
    if (p.currency) {
      const eco = this.game.getSystem('economy');
      for (const [k, v] of Object.entries(p.currency)) eco?.credit(k, v);
    }
    if (p.once) this._ent.ownedOnce[productId] = true;
    this.game.getSystem('save')?.markDirty();
    this.game.getSystem('audio')?.play('reward');
    this.events.emit('monetization:purchased', { id: productId, entitlements: p.entitlements, currency: p.currency });
    return true;
  }

  // --- Ads -------------------------------------------------------------------
  setAdProvider(provider) { if (provider) this._ads = provider; }

  /** Rewarded ads are always opt-in. Resolves true if the reward was earned. */
  async offerRewarded(placement, onReward) {
    const earned = await this._ads.showRewarded(placement).catch(() => false);
    if (earned) {
      this._lastRewarded = performance.now() / 1000;
      this.events.emit('ads:rewarded', { placement });
      onReward?.();
    }
    return earned;
  }

  /**
   * Try an interstitial at a natural break. Suppressed for paying players, for
   * the first few runs, right after a rewarded ad, and while inside the cooldown
   * — so it never feels aggressive or violates Play's ad-placement policy (never
   * during play, never stacked). Returns whether one showed.
   */
  async maybeInterstitial(placement) {
    if (this.adsRemoved || !Config.ads.enabled) return false;
    const cfg = Config.ads.interstitial;
    const now = performance.now() / 1000;
    if (this._gameOvers < cfg.minGames) return false;
    if (now - this._lastRewarded < cfg.afterRewardedSec) return false;
    if (now - this._lastInterstitial < cfg.cooldownSec) return false;
    const shown = await this._ads.showInterstitial(placement).catch(() => false);
    if (shown) { this._lastInterstitial = now; this.events.emit('ads:interstitial', { placement }); }
    return shown;
  }

  onDestroy() { Logger.debug('Monetization', 'teardown'); }
}
