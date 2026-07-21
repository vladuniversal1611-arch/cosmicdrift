/**
 * StructureSystem.js — "Structure Patterns".
 * -----------------------------------------------------------------------------
 * The second goal layer. As the player drags-and-places relics, groups of
 * placed crystals that form a known shape (2x2, L, T, long line, cross) are
 * recognised and RISE into magical structures. Completing one:
 *   • plays a cinematic rise (Structure.js),
 *   • grants a permanent per-level score multiplier,
 *   • charges Dragon Energy,
 *   • evolves the board's look (structures stay visible),
 *   • gives a satisfying burst + shake + sound.
 * Structures stay on the board until a line clear passes through them, at which
 * point they activate and dissolve. To keep it learnable, the board is
 * constantly annotated with hints showing the one cell that would complete a
 * nearby shape — so the mechanic teaches itself in the first few levels.
 *
 * Detection runs the moment a piece is placed (before the line-clear check), so
 * building a structure and clearing a line can both pay off in one move.
 *
 * Modular by design: the shape roster lives entirely in StructurePatterns.js.
 *
 * Events:
 *   listens 'board:ready', 'game:started', 'level:changed',
 *           'game:piecePlaced', 'board:clearComplete'
 *   emits   'structure:completed' ({ id, name, mult }), 'structure:activated'
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { StructurePatterns } from './StructurePatterns.js';
import { Structure } from './Structure.js';

export class StructureSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'structures';
    this.grid = null;
    /** @type {Structure[]} live structures. */
    this._structures = [];
    /** Cells that would complete a shape: [{ col, row, id }]. */
    this._hints = [];
    this._time = 0;

    this._bonusMult = 0;      // summed permanent score-multiplier bonus
    this._completions = 0;    // structures built this level (board evolution)
  }

  onInit() {
    this.listen('board:ready', ({ grid }) => { this.grid = grid; });
    this.listen('game:started', () => this.reset());
    this.listen('level:changed', () => this.reset());
    this.listen('game:piecePlaced', () => { this._detect(); this._computeHints(); });
    this.listen('board:clearComplete', () => this._computeHints());
  }

  /** Permanent per-level score multiplier (read by GameplaySystem). */
  get scoreMultiplier() { return 1 + this._bonusMult; }
  /** 0..1 board-evolution amount (read by BoardSystem for ambience). */
  get evolution() { return Math.min(1, this._completions / 6); }

  reset() {
    for (const s of this._structures) {
      for (const c of s.cells) if (c.structure === s) c.structure = null;
    }
    this._structures.length = 0;
    this._hints.length = 0;
    this._bonusMult = 0;
    this._completions = 0;
  }

  // --- Detection -------------------------------------------------------------

  /**
   * Greedily match patterns (largest first) over the board's filled crystals,
   * forming a structure from each match. Cells already claimed this pass — or
   * already part of a structure — are never reused.
   */
  _detect() {
    if (!this.grid) return;
    const g = this.grid;
    const claimed = new Set();
    const usable = (cell) => cell && cell.filled && !cell.isClearing
      && !cell.structure && !claimed.has(cell);

    for (const pattern of StructurePatterns) {
      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.columns; c++) {
          for (const rot of pattern.rotations) {
            const cells = [];
            let ok = true;
            for (const [ox, oy] of rot) {
              const cell = g.get(c + ox, r + oy);
              if (!usable(cell)) { ok = false; break; }
              cells.push(cell);
            }
            if (ok) {
              this._form(pattern, cells);
              cells.forEach((cell) => claimed.add(cell));
              break; // this origin is consumed; move on
            }
          }
        }
      }
    }
  }

  _form(pattern, cells) {
    const structure = new Structure(pattern, cells);
    for (const cell of cells) cell.structure = structure;
    this._structures.push(structure);

    // Permanent bonuses + juice.
    this._bonusMult += pattern.mult;
    this._completions += 1;
    this._energy(pattern.energy);
    this._shake(6);
    const { x, y } = this._centroid(cells);
    this.events.emit('fx:burst', { x, y, color: Palette.structures[pattern.id].glow, count: 22 });
    this.game.getSystem('audio')?.play('structure');
    this.events.emit('structure:completed', { id: pattern.id, name: pattern.name, mult: pattern.mult });
  }

  // --- Lifecycle -------------------------------------------------------------

  update(dt) {
    this._time += dt;
    for (let i = this._structures.length - 1; i >= 0; i--) {
      const s = this._structures[i];
      s.update(dt);
      // A structure activates + dissolves the moment any of its cells starts
      // clearing (or has emptied) — e.g. a line clear sweeping through it.
      if (!s.rising && s.cells.some((c) => c.isClearing || !c.filled)) {
        this._activate(s);
        this._structures.splice(i, 1);
      }
    }
  }

  _activate(structure) {
    const { x, y } = this._centroid(structure.cells);
    this.events.emit('fx:burst', { x, y, color: Palette.structures[structure.pattern.id].glow, count: 14 });
    this._energy(6);
    this.game.getSystem('audio')?.play('structureActivate');
    for (const c of structure.cells) if (c.structure === structure) c.structure = null;
    this.events.emit('structure:activated', { id: structure.pattern.id });
    this._computeHints();
  }

  // --- Guidance hints --------------------------------------------------------

  /**
   * Find, for each pattern, placements missing exactly ONE cell where the rest
   * are already filled crystals and that one cell is empty + placeable. That
   * cell is highlighted so the player can see the shape they're one move from.
   */
  _computeHints() {
    this._hints = [];
    if (!this.grid) return;
    const g = this.grid;
    const byCell = new Map();      // dedupe: largest pattern wins per cell

    const filledUsable = (cell) => cell && cell.filled && !cell.isClearing && !cell.structure;
    const openPlaceable = (cell) => cell && !cell.filled && !cell.isClearing
      && !cell.structure && !(cell.tile && cell.tile.blocksPlacement);

    for (const pattern of StructurePatterns) {
      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.columns; c++) {
          for (const rot of pattern.rotations) {
            let missing = null;
            let ok = true;
            for (const [ox, oy] of rot) {
              const cell = g.get(c + ox, r + oy);
              if (filledUsable(cell)) continue;
              if (!missing && openPlaceable(cell)) { missing = cell; continue; }
              ok = false; break;   // more than one gap, or blocked
            }
            if (ok && missing && !byCell.has(missing)) {
              byCell.set(missing, { col: missing.col, row: missing.row, id: pattern.id });
            }
          }
        }
      }
    }
    // Cap so the board never looks noisy.
    this._hints = [...byCell.values()].slice(0, 6);
  }

  // --- Rendering -------------------------------------------------------------

  render(renderer) {
    if (!this.grid) return;
    const size = this.grid.cellSize;

    // Guidance hints (drawn beneath the risen structures).
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 4);
    for (const h of this._hints) {
      const { x, y } = this.grid.cellToPixel(h.col, h.row);
      const col = Palette.structures[h.id];
      renderer.setAlpha(0.25 + pulse * 0.35);
      renderer.strokeRoundRect(x + 3, y + 3, size - 6, size - 6, Config.board.cellRadius, col.glow, 2);
      renderer.setAlpha(0.5 + pulse * 0.4);
      renderer.fillCircle(x + size / 2, y + size / 2, size * 0.1, col.glow);
      renderer.setAlpha(1);
    }

    for (const s of this._structures) s.render(renderer, this.grid, this._time);
  }

  // --- Helpers ---------------------------------------------------------------
  _centroid(cells) {
    let x = 0, y = 0;
    for (const cell of cells) { const c = this.grid.cellCenter(cell.col, cell.row); x += c.x; y += c.y; }
    return { x: x / cells.length, y: y / cells.length };
  }
  _energy(a) { this.events.emit('gameplay:addEnergy', { amount: a }); }
  _shake(m) { this.events.emit('fx:shake', { mag: m }); }
}
