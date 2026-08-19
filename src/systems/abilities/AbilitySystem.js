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

/** Lines to clear before a character's power is ready. */
const CHARGE_CAP = 4;

/**
 * Each colour's power, keyed by material. `kind` selects the effect:
 *   row/col   — burn the tapped block's whole row / column
 *   cross     — both diagonals through it (an X)
 *   area      — the 3×3 around it
 *   colour    — every block of that colour on the board
 *   tray      — deal a fresh tray of pieces
 * `fx` tints the burst.
 */
const POWERS = {
  ruby:     { kind: 'row',    fx: '#ff7a2e' },   // dragon — fire a row
  sapphire: { kind: 'col',    fx: '#3aa8ff' },   // whale  — flood a column
  amethyst: { kind: 'cross',  fx: '#a94fe0' },   // unicorn — clear diagonals
  emerald:  { kind: 'area',   fx: '#2fd07f' },   // frog   — splash a 3×3
  coral:    { kind: 'colour', fx: '#ff8a3d' },   // cat    — sweep its colour
  amber:    { kind: 'tray',   fx: '#ffd24a' },   // chick  — deal a fresh tray
};

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
   * A tap while a power is READY, landing on a character block, triggers THAT
   * character's power (see POWERS). Anything else (not ready, a booster armed, a
   * modal open, an empty cell, a colour with no power) is left alone.
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
    const power = POWERS[cell.materialKey];
    if (!power) return;

    const fired = power.kind === 'tray'
      ? this._fireTray()
      : board.clearCells(this._collectCells(grid, power.kind, hit, cell.materialKey), { col: hit.col, row: hit.row });
    if (!fired) return;

    // Punchy feedback tinted to the character's colour.
    const ctr = grid.cellCenter(hit.col, hit.row);
    this.events.emit('fx:flash', { color: power.fx, strength: 0.36 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: power.fx, count: 40 });
    this.events.emit('fx:shake', { mag: 11 });
    Haptics.victory(this.game);
    this.game.getSystem('audio')?.play('clear', { rate: 0.72 });

    this._charge = 0;
    this._emit();
    this.events.emit('ability:used', { kind: power.kind });
  }

  /** Deal a fresh tray (the chick's power). */
  _fireTray() {
    const pieces = this.game.getSystem('pieces');
    if (!pieces?.refill) return false;
    pieces.refill();
    return true;
  }

  /** Gather the live blocks a clearing power targets. */
  _collectCells(grid, kind, hit, key) {
    const out = [];
    const push = (c, r) => {
      const cell = grid.get(c, r);
      if (cell && cell.filled && !cell.isClearing) out.push(cell);
    };
    if (kind === 'row') for (let c = 0; c < grid.columns; c++) push(c, hit.row);
    else if (kind === 'col') for (let r = 0; r < grid.rows; r++) push(hit.col, r);
    else if (kind === 'cross') {
      for (let d = -Math.max(grid.rows, grid.columns); d <= Math.max(grid.rows, grid.columns); d++) {
        push(hit.col + d, hit.row + d);
        push(hit.col + d, hit.row - d);
      }
    } else if (kind === 'area') {
      for (let r = hit.row - 1; r <= hit.row + 1; r++) for (let c = hit.col - 1; c <= hit.col + 1; c++) push(c, r);
    } else if (kind === 'colour') {
      grid.forEach((cell) => { if (cell.filled && !cell.isClearing && cell.materialKey === key) out.push(cell); });
    }
    return out;
  }
}
