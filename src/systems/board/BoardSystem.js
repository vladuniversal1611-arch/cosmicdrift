/**
 * BoardSystem.js
 * -----------------------------------------------------------------------------
 * Owns the playfield Grid: its layout, rendering of the frame and empty cells,
 * and the pixel↔cell coordinate helpers other systems rely on.
 *
 * Foundation scope: draws an empty, correctly-laid-out board and exposes query
 * helpers. It deliberately contains NO placement, matching or scoring rules —
 * those arrive in gameplay updates and will live in dedicated rule modules that
 * operate on this grid.
 *
 * Events:
 *   listens 'save:loaded'  — restore any persisted board occupancy
 *   emits   'board:ready'  ({ grid }) once laid out
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { Rect } from '../../utils/Rect.js';
import { Grid } from './Grid.js';

export class BoardSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'board';
    this.grid = new Grid(Config.board.columns, Config.board.rows);
    /** The screen region reserved for the board, computed each layout. */
    this._area = new Rect();
  }

  onInit() {
    this._computeLayout();
    // Re-layout whenever the canvas resizes so the board stays centred.
    window.addEventListener('resize', () => this._computeLayout());

    this.listen('save:loaded', ({ data }) => {
      if (data.board) this.grid.deserialize(data.board);
    });

    // Defer to a microtask so systems registered AFTER the board (e.g. pieces)
    // have finished subscribing before this fires. Mirrors SaveSystem's
    // 'save:loaded' broadcast and keeps init order from becoming a hidden
    // coupling between systems.
    Promise.resolve().then(() => this.events.emit('board:ready', { grid: this.grid }));
  }

  /**
   * Reserve a centred square-ish region of the canvas for the board and lay the
   * grid out inside it. The tray/HUD occupy the space above and below.
   */
  _computeLayout() {
    const w = this.game.canvas.width;
    const h = this.game.canvas.height;
    // Board occupies the middle band; margins leave room for HUD + piece tray.
    const margin = w * 0.06;
    const top = h * 0.16;
    const size = w - margin * 2;
    this._area.set(margin, top, size, size);
    this.grid.layout(this._area, Config.board.gutter);
  }

  /** Expose the grid geometry so PieceSystem can align dragged pieces. */
  get area() { return this._area; }

  render(renderer) {
    // Board backing panel.
    renderer.fillRoundRect(
      this._area.x - 10, this._area.y - 10,
      this._area.w + 20, this._area.h + 20,
      18, Palette.surface,
    );

    // Empty cells.
    const size = this.grid.cellSize;
    this.grid.forEach((cell) => {
      const { x, y } = this.grid.cellToPixel(cell.col, cell.row);
      if (cell.filled) {
        const c = Palette.pieces[cell.colorKey] ?? Palette.pieces.nebula;
        renderer.fillRoundRect(x, y, size, size, Config.board.cellRadius, c.fill);
      } else {
        renderer.fillRoundRect(x, y, size, size, Config.board.cellRadius, Palette.cellEmpty);
      }
    });
  }
}
