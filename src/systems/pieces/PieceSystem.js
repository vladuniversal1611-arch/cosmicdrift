/**
 * PieceSystem.js
 * -----------------------------------------------------------------------------
 * Manages the "tray" of pieces the player can place, and their layout beneath
 * the board. It owns a PieceFactory (seeded for determinism) and renders the
 * current tray.
 *
 * Foundation scope: builds and lays out a tray of pieces and draws them. Drag,
 * placement validation, line clears and scoring are gameplay — NOT implemented
 * here yet. The clear extension points (`refill`, `trayLayout`, and the input
 * listeners left as TODO) are where that logic will attach.
 *
 * Events:
 *   listens 'board:ready'  — cache board geometry for tray sizing
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Random } from '../../utils/Random.js';
import { PieceFactory } from './PieceFactory.js';

const TRAY_SIZE = 3; // classic "place 3, then refill" cadence

export class PieceSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'pieces';
    this._rng = new Random();
    this._factory = new PieceFactory(this._rng);
    /** @type {import('./Piece.js').Piece[]} */
    this.tray = [];
    /** Cached reference to the board grid, set on 'board:ready'. */
    this._grid = null;
  }

  onInit() {
    this.listen('board:ready', ({ grid }) => {
      this._grid = grid;
      this.refill();
      this._layoutTray();
    });
    window.addEventListener('resize', () => this._layoutTray());

    // GAMEPLAY HOOK (future update): subscribe to input:down/move/up here to
    // implement drag-and-drop placement. Kept out of the foundation on purpose.
  }

  /** Fill empty tray slots with fresh random pieces. */
  refill() {
    this.tray = this._factory.createBatch(TRAY_SIZE);
    this._layoutTray();
    this.events.emit('pieces:refilled', { tray: this.tray });
  }

  /**
   * Position tray pieces evenly in the band below the board, scaled down so a
   * piece preview fits its slot regardless of shape size.
   */
  _layoutTray() {
    if (!this._grid || this.tray.length === 0) return;
    const canvas = this.game.canvas;
    const board = this.game.getSystem('board').area;
    const cellSize = this._grid.cellSize;

    const trayTop = board.bottom + 40;
    const trayHeight = canvas.height - trayTop - 30;
    const slotWidth = canvas.width / this.tray.length;

    this.tray.forEach((piece, i) => {
      // Scale so the largest dimension of the piece fits comfortably in a slot.
      const maxDim = Math.max(piece.width, piece.height);
      const target = Math.min(slotWidth * 0.6, trayHeight * 0.7);
      piece.scale = target / (maxDim * cellSize);

      const pieceW = piece.width * cellSize * piece.scale;
      const pieceH = piece.height * cellSize * piece.scale;
      piece.x = slotWidth * i + (slotWidth - pieceW) * 0.5;
      piece.y = trayTop + (trayHeight - pieceH) * 0.5;
    });
  }

  render(renderer) {
    if (!this._grid) return;
    const cellSize = this._grid.cellSize;
    for (const piece of this.tray) piece.render(renderer, cellSize);
  }
}
