/**
 * Products.js
 * -----------------------------------------------------------------------------
 * The (data-only) commerce catalogue. Architecture for a future store — no real
 * IAP is wired. Each product declares what it grants: durable `entitlements`
 * (Remove Ads, VIP, Premium Pass) and/or consumable `currency`. Prices are
 * illustrative; a storefront layer would map `id` to a real SKU later.
 * Deliberately player-first: no pay-to-win, ads are opt-in only.
 * -----------------------------------------------------------------------------
 */
export const Products = Object.freeze({
  removeAds: { id: 'removeAds', name: 'Remove Ads', kind: 'iap', price: '$2.99', entitlements: ['removeAds'] },
  vip: { id: 'vip', name: 'VIP Membership', kind: 'subscription', price: '$4.99/mo', entitlements: ['vip', 'removeAds'] },
  premiumPass: { id: 'premiumPass', name: 'Premium Pass', kind: 'iap', price: '$9.99', entitlements: ['premiumPass'] },
  starterPack: { id: 'starterPack', name: 'Starter Pack', kind: 'iap', price: '$1.99', once: true, currency: { gold: 3000, crystal: 30, materials: 60 } },
  coinsSmall: { id: 'coinsSmall', name: 'Handful of Coins', kind: 'iap', price: '$0.99', currency: { gold: 1200 } },
  gemsSmall: { id: 'gemsSmall', name: 'Pouch of Gems', kind: 'iap', price: '$0.99', currency: { crystal: 20 } },
});

/** Ad placements the game may offer (rewarded are always opt-in). */
export const AdPlacements = Object.freeze({
  reviveOffer: 'reviveOffer',       // rewarded: continue after a loss
  doubleReward: 'doubleReward',     // rewarded: 2x level reward
  freeCoins: 'freeCoins',           // rewarded: shop free coins
  levelBreak: 'levelBreak',         // interstitial slot (gated, non-aggressive)
});
