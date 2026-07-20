/**
 * ShopSystem.js
 * -----------------------------------------------------------------------------
 * Catalogue + purchase flow. It validates affordability via the EconomySystem,
 * charges the player, records ownership, then delegates the actual granting of
 * the item to a registered fulfilment handler keyed by grant type. This keeps
 * the shop ignorant of what a "dragon skin" or "power-up pack" actually does —
 * those systems register their own handlers.
 *
 * Foundation scope: catalogue model, availability filtering (live-event gating
 * + once-only ownership), the purchase transaction and the fulfilment registry.
 * Real-money IAP hooks come later behind the same `purchase()` seam.
 *
 * Events:
 *   listens 'save:loaded'
 *   emits   'shop:purchased' ({ item })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { ShopItem } from './ShopItem.js';
import { Logger } from '../../utils/Logger.js';

/** Example catalogue. Real catalogues will be data/remote-driven. */
const DEFAULT_CATALOGUE = [
  { id: 'skin_ember', name: 'Ember Dragon Skin',
    cost: { currencyId: 'crystal', amount: 5 }, grant: { type: 'dragonSkin', skin: 'ember' }, once: true },
  { id: 'stardust_small', name: 'Pouch of Stardust',
    cost: { currencyId: 'crystal', amount: 1 }, grant: { type: 'currency', currencyId: 'stardust', amount: 500 } },
];

export class ShopSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'shop';
    /** @type {ShopItem[]} */
    this.catalogue = [];
    /** grant.type -> (grant, item) => void */
    this._fulfillers = new Map();
    /** Set of item ids already owned (for once-only items). */
    this._owned = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._owned = new Set(save.registerSlice('shopOwned', () => []).slice());

    this.load(DEFAULT_CATALOGUE);

    // Built-in fulfiller: currency packs pay straight into the wallet.
    this.registerFulfiller('currency', (grant) => {
      this.game.getSystem('economy')?.credit(grant.currencyId, grant.amount);
    });
  }

  /** Replace the catalogue. */
  load(defs) {
    this.catalogue = defs.map((d) => new ShopItem(d));
  }

  /**
   * Register a handler that applies a purchased grant of a given type. Systems
   * (Dragon, power-ups, ...) call this in their onInit to own their fulfilment.
   */
  registerFulfiller(grantType, handler) {
    this._fulfillers.set(grantType, handler);
  }

  /** Items currently visible: not sold-out and any required event is active. */
  availableItems() {
    const eventsSys = this.game.getSystem('events');
    return this.catalogue.filter((item) => {
      if (item.once && this._owned.has(item.id)) return false;
      if (item.requiresEvent && !eventsSys?.isActive(item.requiresEvent)) return false;
      return true;
    });
  }

  /**
   * Attempt to buy an item. Returns true on success. The transaction is
   * all-or-nothing: we only charge after confirming availability, and only
   * fulfil after a successful charge.
   */
  purchase(itemId) {
    const item = this.catalogue.find((i) => i.id === itemId);
    if (!item) return false;
    if (item.once && this._owned.has(item.id)) return false;

    const economy = this.game.getSystem('economy');
    if (!economy?.spend(item.cost.currencyId, item.cost.amount)) {
      Logger.debug('ShopSystem', `purchase failed (insufficient funds): ${itemId}`);
      return false;
    }

    // Apply the grant via its registered fulfiller, if any.
    if (item.grant) {
      const fulfiller = this._fulfillers.get(item.grant.type);
      if (fulfiller) fulfiller(item.grant, item);
      else Logger.warn('ShopSystem', `no fulfiller for grant type "${item.grant.type}"`);
    }

    if (item.once) {
      this._owned.add(item.id);
      this._persistOwned();
    }
    this.events.emit('shop:purchased', { item });
    return true;
  }

  _persistOwned() {
    const save = this.game.getSystem('save');
    const slice = save.getSlice('shopOwned');
    slice.length = 0;
    slice.push(...this._owned);
    save.markDirty();
  }
}
