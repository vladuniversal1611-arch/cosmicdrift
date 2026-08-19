/**
 * AbilitySystem.js
 * -----------------------------------------------------------------------------
 * The first "character power" — a prototype of the mechanic that lifts the game
 * from "Block Puzzle with faces" to a game with its own cast: the Dragon.
 *
 * The Dragon's fire charges as the player clears lines (any colour). Once the
 * meter is full the power is READY — tapping a DRAGON block on the board makes it
 * breathe fire and clear that block's whole row, then the meter empties. It is a
 * deliberate, timed decision ("save the dragon for when a row is nearly full"),
 * not an automatic bonus.
 *
 * Kept safe + additive, exactly like a booster: the burn goes through
 * `BoardSystem.clearCells`, which does NOT emit `game:linesCleared`, so it never
 * inflates score/combo and can't recharge itself. Charge is per-run (reset each
 * game), never persisted.
 *
 * Events:
 *   listens 'game:started', 'game:linesCleared', 'input:tap',
 *           'ui:modalOpen', 'ui:modalClose'
 *   emits   'ability:charge' ({ ratio, ready })
 *           'ability:used'   ({ kind })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Haptics } from '../../utils/Haptics.js';

/** Material key that IS the dragon (see Palette.materials). */
const DRAGON_KEY = 'ruby';
/** Lines to clear before the Dragon's fire is ready. */
const CHARGE_CAP = 4;

export class AbilitySystem extends System {
  constructor(game) {
    super(game);
    this.name = 'ability';
    this._charge = 0;
    this._modal = false;
  }

  onInit() {
    this.listen('game:started', () => { this._charge = 0; this._emit(); });
    this.listen('game:linesCleared', ({ count = 1 }) => {
      if (this._charge >= CHARGE_CAP) return;      // already primed
      this._charge = Math.min(CHARGE_CAP, this._charge + count);
      this._emit();
    });
    this.listen('input:tap', ({ x, y }) => this._tryStrike(x, y));
    this.listen('ui:modalOpen', () => { this._modal = true; });
    this.listen('ui:modalClose', () => { this._modal = false; });
  }

  /** 0..1 fill of the Dragon fire meter (for the HUD). */
  get chargeRatio() { return this._charge / CHARGE_CAP; }
  /** True when the power can be used. */
  get ready() { return this._charge >= CHARGE_CAP; }

  _emit() { this.events.emit('ability:charge', { ratio: this.chargeRatio, ready: this.ready }); }

  /**
   * A tap while the power is READY, landing on a dragon block, breathes fire and
   * clears that block's whole row. Anything else (not ready, a booster armed, a
   * modal open, an empty cell, a non-dragon block) is left alone.
   */
  _tryStrike(x, y) {
    if (!this.ready || this._modal) return;
    if (this.game.getSystem('booster')?.armed) return;   // booster owns the tap
    const board = this.game.getSystem('board');
    const grid = board?.grid;
    if (!grid) return;
    const hit = grid.pixelToCell(x, y);
    if (!hit) return;
    const cell = grid.get(hit.col, hit.row);
    if (!cell || !cell.filled || cell.isClearing) return;
    if (cell.materialKey !== DRAGON_KEY) return;         // only dragons burn

    // Collect the whole row's live blocks and torch them.
    const rowCells = [];
    for (let c = 0; c < grid.columns; c++) {
      const rc = grid.get(c, hit.row);
      if (rc && rc.filled && !rc.isClearing) rowCells.push(rc);
    }
    if (!board.clearCells(rowCells, { col: hit.col, row: hit.row })) return;

    // Fiery punch: an orange flash, a burst at the dragon, a firm shake.
    const ctr = grid.cellCenter(hit.col, hit.row);
    this.events.emit('fx:flash', { color: '#ff8a3d', strength: 0.4 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: '#ff7a2e', count: 40 });
    this.events.emit('fx:shake', { mag: 12 });
    Haptics.victory(this.game);
    this.game.getSystem('audio')?.play('clear', { rate: 0.7 });

    this._charge = 0;
    this._emit();
    this.events.emit('ability:used', { kind: 'dragonfire' });
  }
}
