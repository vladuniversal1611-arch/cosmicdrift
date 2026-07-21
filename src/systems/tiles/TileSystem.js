/**
 * TileSystem.js — the "Living Board".
 * -----------------------------------------------------------------------------
 * Owns every interactive tile on the board and drives their shared behaviour:
 *   - builds a level's tile layout (from the LevelSystem) and links portal pairs
 *   - ticks each tile's animations and reaps dead ones
 *   - on every line clear, hands tiles a rich context so they can react in sync
 *     (moss blooms, crystals fire, frozen cracks, dragon runes flare, treasure
 *     is collected, trees get surrounded, fog lifts, corruption is purged)
 *   - on every turn (placement), advances turn-based tiles (corruption spread,
 *     treasure countdown) and rolls for random Treasure spawns
 *   - exposes igniteCrossFrom() so a Crystal tile can clear its row + column
 *
 * Tiles themselves stay fully modular; this system is the only place that knows
 * how they are laid out and sequenced. It renders nothing — the BoardSystem
 * asks each cell's tile to draw itself, keeping z-ordering with the crystals.
 *
 * Events:
 *   listens 'board:ready', 'board:linesResolved', 'game:piecePlaced'
 *   emits   nothing directly (tiles emit their own fx/reward events)
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Random } from '../../utils/Random.js';
import { createTile } from './TileRegistry.js';

export class TileSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'tiles';
    this.grid = null;
    /** @type {Set<import('./Tile.js').Tile>} active tiles. */
    this._tiles = new Set();
    /** Mechanics unlocked in the current level (drives Treasure spawns etc.). */
    this._unlocked = new Set();
    this._turn = 0;
    this._rng = new Random();
  }

  onInit() {
    this.listen('board:ready', ({ grid }) => { this.grid = grid; });
    this.listen('board:linesResolved', this._onLinesResolved);
    this.listen('game:piecePlaced', this._onTurn);
  }

  // --- Layout ----------------------------------------------------------------

  /**
   * Rebuild the board for a level. `placements` is [{ type, col, row }]; portal
   * placements are linked into pairs in order. `unlocked` is a Set of mechanic
   * ids available this level. Also clears all crystals so the level starts fresh.
   */
  buildLevel(placements, unlocked, seed = 1) {
    // Tear down previous tiles + crystals.
    for (const t of this._tiles) if (t.cell) t.cell.tile = null;
    this._tiles.clear();
    this.grid.forEach((cell) => cell.clear());

    this._unlocked = unlocked instanceof Set ? unlocked : new Set(unlocked);
    this._turn = 0;
    this._rng.seed(seed >>> 0);

    const portals = [];
    for (const p of placements) {
      const cell = this.grid.get(p.col, p.row);
      if (!cell || cell.tile) continue;
      const tile = this.addTile(cell, p.type);
      if (p.type === 'portal') portals.push(tile);
    }
    // Link portals in consecutive pairs (A ↔ B). Odd one out stays inert.
    for (let i = 0; i + 1 < portals.length; i += 2) {
      const a = portals[i], b = portals[i + 1];
      a.partner = b; b.partner = a;
      a.variant = 'A'; b.variant = 'B';
    }
  }

  /** Attach a freshly-created tile of `type` to `cell`. */
  addTile(cell, type) {
    const tile = createTile(type);
    tile.sys = this;
    tile.cell = cell;
    cell.tile = tile;
    this._tiles.add(tile);
    tile.onAdded();
    return tile;
  }

  /** Spawn a tile of `type` on `cell` if it's free. Returns the tile or null. */
  spawnTile(cell, type) {
    if (!cell || cell.tile || cell.filled || cell.isClearing) return null;
    return this.addTile(cell, type);
  }

  /** Count active tiles of a given type (used by the ObjectivesSystem). */
  countType(type) {
    let n = 0;
    for (const t of this._tiles) if (t.type === type && !t.dead) n++;
    return n;
  }

  /** A free cell that still has an empty orthogonal neighbour (keeps the board playable). */
  _freeCellWithSpace() {
    const free = [];
    this.grid.forEach((cell) => {
      if (cell.tile || cell.filled || cell.isClearing) return;
      const { col, row } = cell;
      const openNbr = [[col, row - 1], [col, row + 1], [col - 1, row], [col + 1, row]]
        .some(([c, r]) => { const n = this.grid.get(c, r); return n && !n.tile && !n.filled; });
      if (openNbr) free.push(cell);
    });
    return free.length ? this._rng.pick(free) : null;
  }

  /** Ensure at least `target` tiles of `type` exist, spawning the shortfall. */
  ensureType(type, target) {
    if (!this.grid) return;
    let need = target - this.countType(type);
    let guard = 0;
    while (need > 0 && guard++ < 40) {
      const cell = this._freeCellWithSpace();
      if (!cell) break;
      this.spawnTile(cell, type);
      need--;
    }
  }

  /** Spawn (and link) a fresh portal pair so portal objectives stay solvable. */
  ensurePortalPair() {
    const cellA = this._freeCellWithSpace();
    if (!cellA) return;
    const a = this.spawnTile(cellA, 'portal');
    const cellB = this._freeCellWithSpace();
    if (!a || !cellB) return;
    const b = this.spawnTile(cellB, 'portal');
    if (b) { a.partner = b; b.partner = a; a.variant = 'A'; b.variant = 'B'; }
  }

  // --- Per-frame -------------------------------------------------------------

  update(dt) {
    for (const tile of this._tiles) {
      tile.update(dt);
      if (tile.dead) {
        if (tile.cell) tile.cell.tile = null;
        this._tiles.delete(tile);
      }
    }
  }

  // --- Reactions -------------------------------------------------------------

  _onLinesResolved({ lines, cells, grid }) {
    const cleared = new Set(cells);
    const ctx = {
      cleared,
      lines,
      grid,
      /** True if any orthogonal neighbour of `cell` was cleared. */
      adjacentCleared: (cell) => {
        const { col, row } = cell;
        return cleared.has(grid.get(col, row - 1)) || cleared.has(grid.get(col, row + 1))
          || cleared.has(grid.get(col - 1, row)) || cleared.has(grid.get(col + 1, row));
      },
    };
    // Snapshot: reactions may add/remove tiles.
    for (const tile of [...this._tiles]) tile.reactToClear(ctx);
  }

  _onTurn() {
    this._turn++;
    const ctx = {
      grid: this.grid,
      turn: this._turn,
      /** Free orthogonal neighbours (no tile, empty) for spreading tiles. */
      emptyNeighbours: (cell) => {
        const { col, row } = cell;
        return [[col, row - 1], [col, row + 1], [col - 1, row], [col + 1, row]]
          .map(([c, r]) => this.grid.get(c, r))
          .filter((n) => n && !n.tile && !n.filled && !n.isClearing);
      },
    };
    for (const tile of [...this._tiles]) tile.onTurn(ctx);

    // Random Treasure spawns once the mechanic is unlocked.
    if (this._unlocked.has('treasure') && this._rng.chance(Config.progression.treasureSpawnChance)) {
      this._trySpawnTreasure();
    }
  }

  _trySpawnTreasure() {
    // Pick a random empty stone cell that isn't already occupied.
    const free = [];
    this.grid.forEach((cell) => {
      if (!cell.tile && !cell.filled && !cell.isClearing) free.push(cell);
    });
    if (free.length) this.spawnTile(this._rng.pick(free), 'treasure');
  }

  /**
   * Crystal-tile effect: clear every crystal along `origin`'s row and column,
   * staggered outward so the energy visibly races down both axes. Runs during
   * an in-progress clear so the BoardSystem animates + reaps these cells too.
   */
  igniteCrossFrom(origin) {
    const g = this.grid;
    const { col, row } = origin;
    const st = Config.fx.clearStagger;
    const dur = Config.fx.clearCellTime;
    for (let c = 0; c < g.columns; c++) {
      const cell = g.get(c, row);
      if (cell.filled && !cell.isClearing) cell.beginClear(Math.abs(c - col) * st, dur);
    }
    for (let r = 0; r < g.rows; r++) {
      const cell = g.get(col, r);
      if (cell.filled && !cell.isClearing) cell.beginClear(Math.abs(r - row) * st, dur);
    }
  }
}
