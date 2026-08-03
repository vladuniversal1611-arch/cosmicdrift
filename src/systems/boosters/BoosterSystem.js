/**
 * BoosterSystem.js
 * -----------------------------------------------------------------------------
 * In-level power-ups — the "clutch" layer. Each booster is a limited-count help
 * the player triggers to dig out of a tight board: a Hammer smashes one block, a
 * Bomb blasts a 3×3 area, a Shuffle deals a fresh tray. They are purely
 * ADDITIVE — never required, and deliberately routed so they can NOT inflate a
 * score: booster clears go through `BoardSystem.clearCells`, which does NOT emit
 * `game:linesCleared`, so a strike never feeds score, combo or the Dragon energy
 * meter and never counts as a "line". The Living Board tiles still react to the
 * freed cells (exactly as they do for the Dragon ultimate), so a booster can
 * help toward tile goals — its purpose is to dig the player out of a jam.
 *
 * Inventory is a persisted save slice. `target: 'cell'` boosters ARM first: the
 * player taps a board cell to apply. `target: 'none'` boosters fire instantly.
 * Only a successful use consumes a charge.
 *
 * Events:
 *   listens 'input:tap'  — apply the armed booster to a tapped board cell
 *   listens 'game:started', 'game:over', 'level:complete' — disarm safety
 *   emits   'booster:changed'  ({ id, count })    inventory changed
 *           'booster:armed'     ({ id })
 *           'booster:disarmed'  ()
 *           'booster:used'      ({ id })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Boosters, BoosterById } from '../../config/Boosters.js';
import { Haptics } from '../../utils/Haptics.js';

export class BoosterSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'booster';
    this._inv = null;
    /** Currently armed cell-target booster id, or null. */
    this._armed = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._inv = save.registerSlice('boosters', () => {
      const inv = {};
      for (const b of Boosters) inv[b.id] = b.start;
      return inv;
    });
    // Back-fill any booster added after this save was first written.
    for (const b of Boosters) if (this._inv[b.id] == null) this._inv[b.id] = b.start;

    this.listen('input:tap', ({ x, y }) => this._onTap(x, y));
    // Never leave a booster armed across a run boundary.
    this.listen('game:started', () => this.disarm());
    this.listen('game:over', () => this.disarm());
    this.listen('level:complete', () => this.disarm());
  }

  // --- Inventory -------------------------------------------------------------

  count(id) { return this._inv?.[id] ?? 0; }
  get armed() { return this._armed; }
  isArmed(id) { return this._armed === id; }

  /** Add charges to a booster (e.g. a shop purchase or a reward). */
  grant(id, n = 1) {
    if (!BoosterById[id] || n <= 0) return;
    this._inv[id] = this.count(id) + n;
    this.game.getSystem('save')?.markDirty();
    this.events.emit('booster:changed', { id, count: this._inv[id] });
  }

  // --- Arming / using --------------------------------------------------------

  /**
   * HUD entry point. Cell-target boosters toggle armed state; a re-tap of the
   * armed booster cancels it. Instant boosters (shuffle) fire immediately.
   * Returns true if the tap was handled (armed / fired / toggled).
   */
  arm(id) {
    const def = BoosterById[id];
    if (!def) return false;
    if (this.count(id) <= 0) {
      this.game.getSystem('audio')?.play('invalid');
      return false;
    }
    if (def.target === 'none') return this._useInstant(def);
    // Toggle a cell-target booster.
    if (this._armed === id) { this.disarm(); return true; }
    this._armed = id;
    this.game.getSystem('audio')?.play('pickup', { rate: 1.15 });
    Haptics.light(this.game);
    this.events.emit('booster:armed', { id });
    return true;
  }

  disarm() {
    if (!this._armed) return;
    this._armed = null;
    this.events.emit('booster:disarmed');
  }

  /** Only usable while a run is actually in progress. */
  get _canUse() {
    const gp = this.game.getSystem('gameplay');
    if (gp && !gp.isPlaying) return false;
    if (this.game.getSystem('board')?.isClearing) return false;
    return true;
  }

  _useInstant(def) {
    if (!this._canUse) return false;
    if (def.id === 'shuffle') {
      this.game.getSystem('pieces')?.refill();
      this.events.emit('fx:flash', { color: '#8fd6ff', strength: 0.12 });
      this.game.getSystem('audio')?.play('structure');
      Haptics.medium(this.game);
      this._consume(def.id);
      return true;
    }
    return false;
  }

  /**
   * A tap while a cell-target booster is armed. We only act on taps that land
   * inside the board grid; taps elsewhere are left for the rest of the UI (so
   * the arming tap on the HUD button never self-targets, and tapping away is
   * harmless). A miss (empty cell / no blocks in range) keeps the booster armed
   * so the player can simply tap again.
   */
  _onTap(x, y) {
    if (!this._armed || !this._canUse) return;
    const board = this.game.getSystem('board');
    const grid = board?.grid;
    if (!grid) return;
    const hit = grid.pixelToCell(x, y);
    if (!hit) return; // tap outside the board — ignore, stay armed

    const def = BoosterById[this._armed];
    const cells = def.id === 'bomb' ? this._area3x3(grid, hit.col, hit.row)
      : [grid.get(hit.col, hit.row)];
    const struck = board.clearCells(cells, hit);
    if (!struck) return; // nothing to smash there — keep armed, let them retry

    Haptics.heavy(this.game);
    this._consume(def.id);
    this.disarm();
  }

  _area3x3(grid, col, row) {
    const cells = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        const cell = grid.get(c, r);
        if (cell) cells.push(cell);
      }
    }
    return cells;
  }

  _consume(id) {
    this._inv[id] = Math.max(0, this.count(id) - 1);
    this.game.getSystem('save')?.markDirty();
    this.events.emit('booster:used', { id });
    this.events.emit('booster:changed', { id, count: this._inv[id] });
  }
}
