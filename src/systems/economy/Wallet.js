/**
 * Wallet.js
 * -----------------------------------------------------------------------------
 * Holds balances for the game's currencies. Pure model with guarded mutation
 * (no negative balances). The EconomySystem wraps this with events and
 * persistence; keeping the maths here makes it trivially unit-testable.
 * -----------------------------------------------------------------------------
 */
export class Wallet {
  /**
   * @param {Record<string, number>} [initial] Starting balances by currency id.
   */
  constructor(initial = {}) {
    /** @type {Map<string, number>} */
    this._balances = new Map(Object.entries(initial));
  }

  /** Current balance of a currency (0 if unknown). */
  get(currencyId) { return this._balances.get(currencyId) ?? 0; }

  /** Add funds. Returns the new balance. */
  credit(currencyId, amount) {
    if (amount < 0) throw new Error('credit amount must be >= 0');
    const next = this.get(currencyId) + amount;
    this._balances.set(currencyId, next);
    return next;
  }

  /** True if the wallet can afford `amount` of a currency. */
  canAfford(currencyId, amount) { return this.get(currencyId) >= amount; }

  /**
   * Remove funds if affordable. Returns true on success, false if too poor —
   * callers must check the result rather than assuming success.
   */
  debit(currencyId, amount) {
    if (amount < 0) throw new Error('debit amount must be >= 0');
    if (!this.canAfford(currencyId, amount)) return false;
    this._balances.set(currencyId, this.get(currencyId) - amount);
    return true;
  }

  /** Plain-object snapshot for persistence. */
  serialize() { return Object.fromEntries(this._balances); }

  /** Replace all balances from a snapshot. */
  deserialize(data) {
    this._balances = new Map(Object.entries(data ?? {}));
  }
}
