/**
 * EconomySystem.js
 * -----------------------------------------------------------------------------
 * The single authority over player currencies. Every credit/debit in the game
 * flows through here so balances stay consistent, persisted and observable.
 *
 * Currencies are declared as data, making it easy to add premium/event
 * currencies later. The wallet is a persistent save slice. Other systems never
 * touch the wallet directly — they call `credit`/`spend` or listen for
 * 'economy:changed', preserving independence.
 *
 * Events:
 *   listens 'save:loaded'
 *   emits   'economy:changed' ({ currencyId, balance, delta })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Wallet } from './Wallet.js';

/**
 * One currency — coins. The whole game runs on a single, legible soft currency:
 * you earn coins by clearing levels and spend them on boosters. Everything the
 * game ever credits folds into `gold` (the internal id for coins) via ALIAS
 * below, so no screen ever has to reason about a second wallet.
 */
export const Currencies = Object.freeze({
  gold: { id: 'gold', name: 'Coins', premium: false, icon: '⬤' },
});

/** Every legacy / friendly currency id folds into the single coin pool. */
const ALIAS = Object.freeze({
  coins: 'gold', essence: 'gold', materials: 'gold', stardust: 'gold',
  gems: 'gold', crystal: 'gold',
});
const resolve = (id) => ALIAS[id] ?? id;

export class EconomySystem extends System {
  constructor(game) {
    super(game);
    this.name = 'economy';
    this._wallet = new Wallet();
  }

  onInit() {
    const save = this.game.getSystem('save');
    const slice = save.registerSlice('wallet', () => ({ gold: 0 }));
    // Fold any legacy multi-currency save down into the single coin pool.
    let goldAdd = 0;
    for (const k of ['coins', 'essence', 'materials', 'stardust', 'gems', 'crystal']) {
      if (k in slice) { goldAdd += slice[k] || 0; delete slice[k]; }
    }
    if (goldAdd) slice.gold = (slice.gold ?? 0) + goldAdd;
    save.markDirty();
    this._wallet.deserialize({ gold: slice.gold ?? 0 });
    this._persist();
  }

  /** Read a balance (folds legacy ids to the two real currencies). */
  balance(currencyId) { return this._wallet.get(resolve(currencyId)); }

  /** True if the player can afford a cost. */
  canAfford(currencyId, amount) { return this._wallet.canAfford(resolve(currencyId), amount); }

  /** Grant currency (rewards). Legacy ids fold to gold/crystal. */
  credit(currencyId, amount) {
    const id = resolve(currencyId);
    const balance = this._wallet.credit(id, amount);
    this._persist();
    this.events.emit('economy:changed', { currencyId: id, balance, delta: amount });
    return balance;
  }

  /**
   * Spend currency. Returns true if the purchase succeeded. Emits a change
   * event only on success so UI never flickers on a failed spend.
   */
  spend(currencyId, amount) {
    const id = resolve(currencyId);
    if (!this._wallet.debit(id, amount)) return false;
    const balance = this._wallet.get(id);
    this._persist();
    this.events.emit('economy:changed', { currencyId: id, balance, delta: -amount });
    return true;
  }

  /** Mirror the wallet back into the save slice and mark it dirty. */
  _persist() {
    const save = this.game.getSystem('save');
    Object.assign(save.getSlice('wallet'), this._wallet.serialize());
    save.markDirty();
  }
}
