/* ============================================================
   Billing — real Google Play in-app purchases via cordova-plugin-purchase
   (CdvPurchase, v13). Consumable gem packs.

   >>> Play Console setup (REQUIRED before real purchases work):
       Create three MANAGED / consumable in-app products with these exact IDs:
         gems_500   ($0.99)   -> 500 gems
         gems_2750  ($4.99)   -> 2750 gems
         gems_7200  ($9.99)   -> 7200 gems
       Prices are set in the Play Console (the $-labels in the shop are cosmetic).

   In the browser (or if the plugin/billing is unavailable) there is NO billing;
   the shop falls back to a simulated grant (see UI.buyPack) so it stays testable
   without ever touching real money.
   ============================================================ */
(function (global) {
  'use strict';

  // Product catalogue — `id` MUST match the Play Console product IDs above.
  const PRODUCTS = [
    { id: 'gems_500',  gems: 500 },
    { id: 'gems_2750', gems: 2750 },
    { id: 'gems_7200', gems: 7200 }
  ];
  const gemsFor = function (id) { const p = PRODUCTS.filter(function (x) { return x.id === id; })[0]; return p ? p.gems : 0; };

  let inited = false, onGrant = null;
  function cdv() { return global.CdvPurchase; }
  function available() { return !!(cdv() && cdv().store); }

  // Initialise the store once, wire the purchase lifecycle, and register the
  // grant callback that credits gems only after Google confirms payment.
  function init(grantCb) {
    onGrant = grantCb || onGrant;
    if (inited || !available()) return;
    const CdvPurchase = cdv();
    const store = CdvPurchase.store;
    const GOOGLE = CdvPurchase.Platform.GOOGLE_PLAY;
    try {
      store.register(PRODUCTS.map(function (p) {
        return { id: p.id, type: CdvPurchase.ProductType.CONSUMABLE, platform: GOOGLE };
      }));
      store.when()
        .approved(function (transaction) { return transaction.verify(); })
        .verified(function (receipt) { return receipt.finish(); })
        .finished(function (transaction) {
          // Credit every consumable in the confirmed transaction, then it's done.
          (transaction.products || []).forEach(function (pp) {
            const g = gemsFor(pp.id);
            if (g && onGrant) onGrant(g, pp.id);
          });
        });
      if (store.error) store.error(function () { /* surfaced per-order below */ });
      store.initialize([{ platform: GOOGLE }]);
      inited = true;
    } catch (e) { inited = false; }
  }

  // Launch the native purchase dialog for a product id. `done(true)` means the
  // order flow started OK (the actual grant arrives later via the finished
  // handler); `done(false, msg)` means it could not start.
  function buy(productId, done) {
    if (!available()) { if (done) done(false, 'no-billing'); return; }
    const CdvPurchase = cdv();
    try {
      const product = CdvPurchase.store.get(productId, CdvPurchase.Platform.GOOGLE_PLAY);
      const offer = product && product.getOffer && product.getOffer();
      if (!offer) { if (done) done(false, 'no-offer'); return; }
      Promise.resolve(offer.order()).then(function (err) {
        if (err) { if (done) done(false, (err && err.message) || 'order-error'); }
        else if (done) done(true);
      }).catch(function (e) { if (done) done(false, (e && e.message) || 'order-error'); });
    } catch (e) { if (done) done(false, (e && e.message) || 'error'); }
  }

  global.Billing = { init: init, buy: buy, available: available, PRODUCTS: PRODUCTS };
})(window);
