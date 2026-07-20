/**
 * ShopItem.js
 * -----------------------------------------------------------------------------
 * A purchasable catalogue entry. Pure data + tiny helpers. Items describe cost,
 * what they grant, and optional availability constraints (owned-once, gated by
 * a live event). Fulfilment is delegated so the shop stays decoupled from the
 * systems that actually apply a purchase.
 * -----------------------------------------------------------------------------
 */
export class ShopItem {
  /**
   * @param {object} def
   *   { id, name, cost:{currencyId,amount}, grant, once?, requiresEvent? }
   *   - grant: opaque payload handed to the fulfilment callback on purchase
   *   - once:  if true, the item can be bought only a single time
   *   - requiresEvent: live-event id that must be active to show/buy the item
   */
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.cost = def.cost;
    this.grant = def.grant ?? null;
    this.once = def.once ?? false;
    this.requiresEvent = def.requiresEvent ?? null;
  }
}
