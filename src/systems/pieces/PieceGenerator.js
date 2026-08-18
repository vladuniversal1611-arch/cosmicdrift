/**
 * PieceGenerator.js
 * -----------------------------------------------------------------------------
 * The intelligent tray generator. It never just rolls random shapes; instead it
 * reads the live board and assembles a tray that is:
 *   1. SOLVABLE — proven placeable via greedy simulation across orderings, so
 *      the player never loses to an impossible hand;
 *   2. DIFFICULTY-MATCHED — shapes are weighted toward a target "hardness" set
 *      by the DifficultyDirector (easy + teachy early, awkward + risky late);
 *   3. SATISFYING — it occasionally slips in a piece that enables an immediate
 *      line clear ("last-second saves" / perfect combos), especially when the
 *      board is tight or the player is struggling, plus rare exciting big pieces
 *      late game.
 *
 * It operates on a throwaway occupancy matrix (never mutating real state) and
 * runs only on tray refills, so it's cheap. Everything is tuned via
 * Config.generator, and it's a plain class — swap it out or disable it freely.
 * -----------------------------------------------------------------------------
 */
import { Shapes, ShapeKeys } from './Shapes.js';
import { Config } from '../../config/Config.js';
import { clamp } from '../../utils/MathUtils.js';

export class PieceGenerator {
  /**
   * @param {import('../../utils/Random.js').Random} rng
   * @param {import('./PieceFactory.js').PieceFactory} factory
   */
  constructor(rng, factory) {
    this.rng = rng;
    this.factory = factory;
    // Precompute a 0..1 "hardness" for each shape (size + bounding-box holes).
    this.hardness = {};
    for (const k of ShapeKeys) this.hardness[k] = this._rate(Shapes[k].blocks);
  }

  _rate(blocks) {
    const n = blocks.length;
    const w = Math.max(...blocks.map((b) => b[0])) + 1;
    const h = Math.max(...blocks.map((b) => b[1])) + 1;
    const fillFrac = n / (w * h);       // 1 = solid rectangle, <1 = awkward
    const sizeScore = (n - 1) / 4;      // 0 (single) .. 1 (5-block)
    return clamp(sizeScore * 0.75 + (1 - fillFrac) * 0.5, 0, 1);
  }

  // --- Occupancy helpers (pure, on a boolean matrix) -------------------------
  _occupancy(grid) {
    const occ = [];
    for (let r = 0; r < grid.rows; r++) {
      const row = [];
      for (let c = 0; c < grid.columns; c++) {
        const cell = grid.get(c, r);
        row.push(cell.filled || cell.isClearing || (cell.tile && cell.tile.blocksPlacement));
      }
      occ.push(row);
    }
    return occ;
  }
  _clone(occ) { return occ.map((r) => r.slice()); }
  _canPlace(occ, blocks, col, row, rows, cols) {
    for (const [bc, br] of blocks) {
      const c = col + bc; const r = row + br;
      if (c < 0 || c >= cols || r < 0 || r >= rows || occ[r][c]) return false;
    }
    return true;
  }
  _place(occ, blocks, col, row) { for (const [bc, br] of blocks) occ[row + br][col + bc] = true; }
  _positions(occ, blocks, rows, cols) {
    let n = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (this._canPlace(occ, blocks, c, r, rows, cols)) n++;
    return n;
  }
  _firstPos(occ, blocks, rows, cols) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (this._canPlace(occ, blocks, c, r, rows, cols)) return { c, r };
    return null;
  }
  /** Would placing `blocks` at (col,row) complete a full row or column? */
  _wouldClear(occ, blocks, col, row, rows, cols) {
    const o = this._clone(occ); this._place(o, blocks, col, row);
    for (let r = 0; r < rows; r++) { let full = true; for (let c = 0; c < cols; c++) if (!o[r][c]) { full = false; break; } if (full) return true; }
    for (let c = 0; c < cols; c++) { let full = true; for (let r = 0; r < rows; r++) if (!o[r][c]) { full = false; break; } if (full) return true; }
    return false;
  }

  /** Permutations of a small array (tray size is tiny). */
  _perms(arr) {
    if (arr.length <= 1) return [arr];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of this._perms(rest)) out.push([arr[i], ...p]);
    }
    return out;
  }

  /**
   * Can this exact set of shapes all be placed (in SOME order)? Greedy first-fit
   * per ordering; a success is a genuine proof of solvability. Line clears are
   * ignored here, which only makes the check safely conservative.
   */
  _solvable(occ, blocksList, rows, cols) {
    for (const order of this._perms(blocksList)) {
      const o = this._clone(occ);
      let ok = true;
      for (const blocks of order) {
        const p = this._firstPos(o, blocks, rows, cols);
        if (!p) { ok = false; break; }
        this._place(o, blocks, p.c, p.r);
      }
      if (ok) return true;
    }
    return false;
  }

  // --- Tray assembly ---------------------------------------------------------

  /**
   * Produce `count` Piece instances tuned to `target` hardness (0..1) and the
   * player's `generosity`. Guaranteed solvable whenever the board has room.
   */
  generateTray(grid, count, target, generosity, { endless = false } = {}) {
    const rows = grid.rows; const cols = grid.columns;
    const occ = this._occupancy(grid);
    const emptyCount = occ.reduce((s, r) => s + r.filter((v) => !v).length, 0);
    const filled = rows * cols - emptyCount;
    const fill = filled / (rows * cols);   // 0 = empty board, 1 = full

    // Only offer shapes that fit somewhere right now (fall back to all if none).
    const placeable = ShapeKeys.filter((k) => this._positions(occ, Shapes[k].blocks, rows, cols) > 0);
    const pool = placeable.length ? placeable : ShapeKeys.slice();

    // Shape weighting. Endless is BOARD-AWARE: big space-hogs (five-bars, 3×3,
    // rectangles) drop freely on an open board, but fade out as it fills so the
    // player is fed handy, clearable pieces instead of clogging up — this is what
    // keeps a board actually emptiable (and makes PERFECT reachable). Campaign
    // keeps the level-tuned hardness Gaussian.
    const sigma = 0.28;
    const weightOf = (k) => {
      if (endless) {
        const n = Shapes[k].blocks.length;
        const bigness = Math.max(0, n - 2) / 3;          // 0 tiny .. 1 five-block
        // CLOSE-OUT: only a few cells left → feed tiny (1–2 block) pieces so the
        // player can surgically finish the last cells for a full clear (PERFECT).
        if (filled > 0 && filled <= rows * 1.5) return n <= 2 ? 1.5 : Math.max(0.02, 0.3 - bigness * 0.28);
        // FINISH MODE: a nearly-empty board favours small pieces so it keeps
        // trending toward empty instead of being refilled by big space-hogs.
        if (filled > 0 && filled <= rows * 3) return Math.max(0.05, 1.4 - bigness * 1.25);
        const fillPenalty = 1 - bigness * fill * 0.9;    // big pieces fade as the board fills
        return Math.max(0.06, (1 + 0.12 * (n - 1)) * fillPenalty);
      }
      const g = Math.exp(-((this.hardness[k] - target) ** 2) / (2 * sigma * sigma));
      return (Shapes[k].weight ?? 1) * g + 0.001;
    };
    const pick = () => {
      let tot = 0; for (const k of pool) tot += weightOf(k);
      let x = this.rng.next() * tot;
      for (const k of pool) { x -= weightOf(k); if (x <= 0) return k; }
      return pool[pool.length - 1];
    };

    // Assemble a difficulty-matched tray that is provably solvable.
    let tray = null;
    for (let attempt = 0; attempt < Config.generator.solveAttempts; attempt++) {
      const keys = Array.from({ length: count }, pick);
      if (this._solvable(occ, keys.map((k) => Shapes[k].blocks), rows, cols)) { tray = keys; break; }
    }
    if (!tray) tray = this._greedySolvable(occ, count, rows, cols); // guaranteed fit

    // Satisfying gifts: a line-clear enabler. Likelier the fuller the board gets
    // (keeps runs from clogging), and a strong nudge when the board is nearly
    // empty so the player can finish the LAST cells and trigger a full-clear
    // (PERFECT + theme change) — the moment that was too hard to reach before.
    const struggle = Math.max(0, generosity);
    const tightness = fill > 0.5 ? (fill - 0.5) * 0.9 : 0;
    const finishHelp = (endless && filled > 0 && filled <= rows * 3) ? 0.6 : 0;
    // Find the best clear-enabling shape (prefers a multi-line clear). When a
    // clear is genuinely available, strongly favour handing the player the
    // finishing piece — that "I cleared it!" moment is the core dopamine.
    const gift = this._findClearingShape(occ, rows, cols);
    const primedBoost = gift ? 0.5 : 0;
    const giftChance = Config.generator.giftBaseChance + struggle * Config.generator.giftStruggleBonus + tightness + finishHelp + primedBoost;
    if (gift && this.rng.next() < giftChance) this._trySwap(tray, gift, occ, rows, cols);

    // Exciting big piece — a deliberate spike, but only when there's ROOM for it
    // (in endless, gated on a fairly open board) so it never clogs a tight one.
    if (target > 0.38 && (!endless || fill < 0.35) && this.rng.next() < Config.generator.excitingChance) {
      const big = ['cross', 'bigL', 'bigJ', 'quint', 'quintV', 'rect23', 'rect32', 'bigSquare'].filter((k) => ShapeKeys.includes(k));
      if (big.length) this._trySwap(tray, this.rng.pick(big), occ, rows, cols);
    }

    return tray.map((k) => this.factory.create(k));
  }

  /** Replace a random tray slot with `key` iff the tray stays solvable. */
  _trySwap(tray, key, occ, rows, cols) {
    const idx = this.rng.int(0, tray.length - 1);
    const trial = tray.slice(); trial[idx] = key;
    if (this._solvable(occ, trial.map((k) => Shapes[k].blocks), rows, cols)) {
      tray[idx] = key;
      return true;
    }
    return false;
  }

  /** Fallback: pick placeable-in-sequence shapes, smallest first. Always fits. */
  _greedySolvable(occ, count, rows, cols) {
    const o = this._clone(occ);
    const bySize = ShapeKeys.slice().sort((a, b) => Shapes[a].blocks.length - Shapes[b].blocks.length);
    const tray = [];
    for (let i = 0; i < count; i++) {
      const key = bySize.find((k) => this._firstPos(o, Shapes[k].blocks, rows, cols)) ?? this.rng.pick(ShapeKeys);
      tray.push(key);
      const p = this._firstPos(o, Shapes[key].blocks, rows, cols);
      if (p) this._place(o, Shapes[key].blocks, p.c, p.r);
    }
    return tray;
  }

  /** How many rows+columns a placement of `blocks` at (col,row) completes. */
  _countClears(occ, blocks, col, row, rows, cols) {
    const o = this._clone(occ); this._place(o, blocks, col, row);
    let n = 0;
    for (let r = 0; r < rows; r++) { let full = true; for (let c = 0; c < cols; c++) if (!o[r][c]) { full = false; break; } if (full) n++; }
    for (let c = 0; c < cols; c++) { let full = true; for (let r = 0; r < rows; r++) if (!o[r][c]) { full = false; break; } if (full) n++; }
    return n;
  }

  /**
   * Find a shape that enables a line clear, PREFERRING one that clears several
   * lines at once — those big multi-clears are the satisfying "dopamine" moment.
   * Returns the best shape key, or null if nothing clears anything.
   */
  _findClearingShape(occ, rows, cols) {
    let best = null, bestN = 0;
    for (const k of ShapeKeys) {
      const blocks = Shapes[k].blocks;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!this._canPlace(occ, blocks, c, r, rows, cols)) continue;
          const n = this._countClears(occ, blocks, c, r, rows, cols);
          if (n > bestN) { bestN = n; best = k; if (n >= 2) return best; }  // a double is plenty
        }
      }
    }
    return best;
  }
}
