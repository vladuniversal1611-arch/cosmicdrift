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

/** Currency catalogue. Extend with premium/event currencies as needed. */
export const Currencies = Object.freeze({
  stardust: { id: 'stardust', name: 'Stardust', premium: false, icon: '✦' },
  crystal: { id: 'crystal', name: 'Crystal', premium: true, icon: '◆' },
});

export class EconomySystem extends System {
  constructor(game) {
    super(game);
    this.name = 'economy';
    this._wallet = new Wallet();
  }

  onInit() {
    const save = this.game.getSystem('save');
    const slice = save.registerSlice('wallet', () => ({ stardust: 0, crystal: 0 }));
    this._wallet.deserialize(slice);
  }

  /** Read a balance. */
  balance(currencyId) { return this._wallet.get(currencyId); }

  /** True if the player can afford a cost. */
  canAfford(currencyId, amount) { return this._wallet.canAfford(currencyId, amount); }

  /** Grant currency (rewards, missions). */
  credit(currencyId, amount) {
    const balance = this._wallet.credit(currencyId, amount);
    this._persist();
    this.events.emit('economy:changed', { currencyId, balance, delta: amount });
    return balance;
  }

  /**
   * Spend currency. Returns true if the purchase succeeded. Emits a change
   * event only on success so UI never flickers on a failed spend.
   */
  spend(currencyId, amount) {
    if (!this._wallet.debit(currencyId, amount)) return false;
    const balance = this._wallet.get(currencyId);
    this._persist();
    this.events.emit('economy:changed', { currencyId, balance, delta: -amount });
    return true;
  }

  /** Mirror the wallet back into the save slice and mark it dirty. */
  _persist() {
    const save = this.game.getSystem('save');
    Object.assign(save.getSlice('wallet'), this._wallet.serialize());
    save.markDirty();
  }
}
