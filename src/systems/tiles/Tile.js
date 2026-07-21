/**
 * Tile.js
 * -----------------------------------------------------------------------------
 * Base class for every Living Board tile. A tile is the *terrain* of a board
 * slot (distinct from the crystal that may be placed on top of it) and gives
 * that slot behaviour and life.
 *
 * Every concrete tile is fully modular: it plugs into the same lifecycle and
 * only overrides what it needs. The framework provides, for free:
 *   - appear / activation / destroy animation timers (0..1 progress getters)
 *   - a stable idle phase so tiles don't animate in lockstep
 *   - particle + sound + shake + energy + reward helpers routed via the bus
 *   - render hooks split into renderBelow (under the crystal) and renderAbove
 *     (over the crystal) for correct layering
 *
 * Subclasses override the hooks: onUpdate, onActivate, onDestroy, reactToClear,
 * onTurn, redirectPlacement, blocksPlacement, renderBelow, renderAbove.
 * -----------------------------------------------------------------------------
 */
export class Tile {
  constructor() {
    /** @type {import('../board/Cell.js').Cell|null} set by TileSystem.add. */
    this.cell = null;
    /** @type {import('./TileSystem.js').TileSystem|null} set by TileSystem. */
    this.sys = null;
    /** Type key (matches TileRegistry). Subclasses set this. */
    this.type = 'tile';

    this.idlePhase = Math.random() * Math.PI * 2;

    // Animation timers. -1 means inactive; otherwise seconds elapsed.
    this.appearT = 0;
    this.appearDur = 0.4;
    this.activateT = -1;
    this.activateDur = 0.5;
    this.destroyT = -1;
    this.destroyDur = 0.5;

    /** Set true once the destroy animation finishes; TileSystem reaps it. */
    this.dead = false;
  }

  // --- Overridable metadata --------------------------------------------------
  /** Prevents crystals from being placed on this slot. */
  get blocksPlacement() { return false; }

  // --- Lifecycle driven by TileSystem ---------------------------------------
  update(dt) {
    if (this.appearT < this.appearDur) this.appearT += dt;
    if (this.activateT >= 0) {
      this.activateT += dt;
      if (this.activateT >= this.activateDur) this.activateT = -1;
    }
    if (this.destroyT >= 0) {
      this.destroyT += dt;
      if (this.destroyT >= this.destroyDur) this.dead = true;
    }
    this.onUpdate(dt);
  }

  /** Play the activation animation (idempotent while already running). */
  activate() {
    if (this.destroyT >= 0) return;
    this.activateT = 0;
    this.onActivate();
  }

  /** Begin the destroy animation; the tile is removed when it completes. */
  destroy() {
    if (this.destroyT >= 0) return;
    this.destroyT = 0;
    this.onDestroy();
  }

  // --- Animation progress helpers (0..1) ------------------------------------
  get appear() { return Math.min(1, this.appearT / this.appearDur); }
  get activation() { return this.activateT < 0 ? 0 : Math.min(1, this.activateT / this.activateDur); }
  get dying() { return this.destroyT < 0 ? 0 : Math.min(1, this.destroyT / this.destroyDur); }
  get isActivating() { return this.activateT >= 0; }
  get isDying() { return this.destroyT >= 0; }

  // --- Convenience emitters (kept here so tiles stay decoupled) -------------
  _center() { return this.sys.grid.cellCenter(this.cell.col, this.cell.row); }
  _burst(color, count = 12) {
    const { x, y } = this._center();
    this.sys.events.emit('fx:burst', { x, y, color, count });
  }
  _sound(name, opts) { this.sys.game.getSystem('audio')?.play(name, opts); }
  _shake(mag) { this.sys.events.emit('fx:shake', { mag }); }
  _energy(amount) { this.sys.events.emit('gameplay:addEnergy', { amount }); }
  _reward(currencyId, amount) { this.sys.game.getSystem('economy')?.credit(currencyId, amount); }

  // --- Overridable hooks (no-ops by default) --------------------------------
  /** Called once after the tile is attached to a cell. */
  onAdded() {}
  /** Per-frame logic. */
  onUpdate(/* dt */) {}
  /** One-shot when activate() is first called. */
  onActivate() {}
  /** One-shot when destroy() is first called. */
  onDestroy() {}
  /**
   * React to a line clear. ctx = { cleared:Set<Cell>, lines:Cell[][], grid }.
   * Adjacency helpers are provided by the TileSystem on ctx.
   */
  reactToClear(/* ctx */) {}
  /** React to a turn (each piece placement). ctx = { grid, turn }. */
  onTurn(/* ctx */) {}
  /** Optionally redirect a placed block to another cell. Return a Cell or null. */
  redirectPlacement(/* cell, grid */) { return null; }
  /** Draw beneath the crystal. */
  renderBelow(/* renderer, x, y, size, time */) {}
  /** Draw above the crystal. */
  renderAbove(/* renderer, x, y, size, time */) {}
}
