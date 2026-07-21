/**
 * PieceSystem.js
 * -----------------------------------------------------------------------------
 * The tray of relics and the drag-to-place interaction — the heart of the
 * moment-to-moment feel.
 *
 * Interaction flow:
 *   down  on a tray relic → pick it up (grows with a springy tween, glows hot)
 *   move                  → follows the finger (lifted above it), and asks the
 *                           board to show a green/red placement ghost
 *   up    on a valid cell → snaps in with a soft landing, triggers line clears,
 *                           refills the tray when empty
 *   up    invalid         → shakes, springs back to its tray slot
 *
 * The system owns interaction + tray state; placement rules live on the Grid,
 * clear animation on the BoardSystem, and scoring/combo in the GameplaySystem.
 * It also detects game-over (no tray relic fits anywhere).
 *
 * Events:
 *   listens 'board:ready', 'game:started', 'board:clearComplete',
 *           'input:down|move|up'
 *   emits   'game:piecePlaced' ({ amount, blocks, material })
 *           'board:hover' / 'board:hoverEnd' / 'board:checkClears'
 *           'pieces:refilled' ({ tray }) and 'game:over' ({ })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Easing } from '../../utils/Easing.js';
import { Random } from '../../utils/Random.js';
import { PieceFactory } from './PieceFactory.js';
import { PieceGenerator } from './PieceGenerator.js';
import { DifficultyDirector } from './DifficultyDirector.js';

export class PieceSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'pieces';
    this._rng = new Random();
    this._factory = new PieceFactory(this._rng);
    // The intelligent generator + its dynamic-difficulty brain.
    this._director = new DifficultyDirector(game);
    this._generator = new PieceGenerator(this._rng, this._factory);
    /** @type {import('./Piece.js').Piece[]} */
    this.tray = [];
    this._grid = null;
    this._level = 1;
    this._time = 0;

    // Active drag: { piece, col, row, valid } | null.
    this._drag = null;
    this._pointerId = null;
  }

  onInit() {
    this._director.init();

    this.listen('board:ready', ({ grid }) => {
      this._grid = grid;
      this.refill();
    });
    // Each level (including the first, and every advance) hands us a fresh
    // board; refill the tray to match. The LevelSystem builds tiles first.
    this.listen('level:changed', ({ level }) => { if (level) this._level = level; this.refill(); });
    // Feed the dynamic-difficulty director: losing => kinder, clearing => tougher.
    this.listen('game:over', () => this._director.recordLoss());
    this.listen('level:complete', () => this._director.recordWin());
    // After a clear resolves, freed cells (or melted tiles) may unstick a
    // game-over, so re-check.
    this.listen('board:clearComplete', () => this._checkGameOver());

    window.addEventListener('resize', () => this._layoutTray());

    this.listen('input:down', this._onDown);
    this.listen('input:move', this._onMove);
    this.listen('input:up', this._onUp);

    // A modal (e.g. the World Map) blocks board input while open.
    this.listen('ui:modalOpen', () => { this._modal = true; this._drag = null; });
    this.listen('ui:modalClose', () => { this._modal = false; });
  }

  // --- Tray management -------------------------------------------------------

  /**
   * Replace the tray with a fresh set of relics. When the board is known and
   * the smart generator is enabled, the tray is board-aware, difficulty-tuned
   * and guaranteed solvable; otherwise it falls back to weighted-random.
   */
  refill() {
    this._drag = null;
    const size = Config.gameplay.traySize;
    if (Config.generator.enabled && this._grid) {
      const target = this._director.targetHardness(this._level);
      this.tray = this._generator.generateTray(this._grid, size, target, this._director.generosity);
    } else {
      this.tray = this._factory.createBatch(size);
    }
    this._layoutTray();
    this.events.emit('pieces:refilled', { tray: this.tray });
    this._checkGameOver();
  }

  /** Lay tray relics out in even slots in the band below the board. */
  _layoutTray() {
    if (!this._grid || this.tray.length === 0) return;
    const canvas = this.game.canvas;
    const board = this.game.getSystem('board').area;
    const cellSize = this._grid.cellSize;

    const trayTop = board.bottom + this._grid.cellSize * 0.5 + 24;
    const trayHeight = canvas.height - trayTop - 26;
    const slotWidth = canvas.width / this.tray.length;

    this.tray.forEach((piece, i) => {
      if (piece === this._drag?.piece) return; // don't reposition a held relic
      const maxDim = Math.max(piece.width, piece.height);
      const target = Math.min(slotWidth * 0.62, trayHeight * 0.72);
      piece.scale = target / (maxDim * cellSize);
      const pieceW = piece.width * cellSize * piece.scale;
      const pieceH = piece.height * cellSize * piece.scale;
      piece.x = slotWidth * i + (slotWidth - pieceW) * 0.5;
      piece.y = trayTop + (trayHeight - pieceH) * 0.5;
      piece.storeHome();
    });
  }

  // --- Input / dragging ------------------------------------------------------

  /** Only draggable while a game is in progress and nothing is mid-clear. */
  get _canDrag() {
    if (this._modal) return false;
    const gameplay = this.game.getSystem('gameplay');
    if (gameplay && !gameplay.isPlaying) return false;
    if (this.game.getSystem('board')?.isClearing) return false;
    return true;
  }

  _onDown({ id, x, y }) {
    if (this._drag || !this._canDrag) return;
    const piece = this._pickTrayPieceAt(x, y);
    if (!piece) return;

    this._pointerId = id;
    this._drag = { piece, col: 0, row: 0, valid: false };
    piece.dragging = true;
    piece.shake = 0;
    piece.storeHome();

    // Springy grow to full board size.
    const anim = this.game.getSystem('animation');
    anim?.to(piece, 'scale', Config.fx.dragScale, Config.fx.pickupTime, { ease: Easing.backOut });

    this.game.getSystem('audio')?.play('pickup');
    this._positionDrag(x, y);
  }

  _onMove({ id, x, y }) {
    if (!this._drag || id !== this._pointerId) return;
    this._positionDrag(x, y);
  }

  _onUp({ id, x, y }) {
    if (!this._drag || id !== this._pointerId) return;
    const { piece, col, row, valid } = this._drag;
    piece.dragging = false;
    this.events.emit('board:hoverEnd');
    this._pointerId = null;

    if (valid && this._grid.canPlace(piece, col, row)) {
      this._commitPlacement(piece, col, row);
    } else {
      this._rejectPlacement(piece);
    }
    this._drag = null;
  }

  /** Position the held relic above the finger and compute its snap target. */
  _positionDrag(px, py) {
    const grid = this._grid;
    const cs = grid.cellSize; // snap uses full board size for stability
    const piece = this._drag.piece;
    const pieceW = piece.width * cs;
    const pieceH = piece.height * cs;

    piece.x = px - pieceW * 0.5;
    piece.y = py - Config.fx.dragLift - pieceH;

    const col = Math.round((piece.x - grid.bounds.x) / grid.stride);
    const row = Math.round((piece.y - grid.bounds.y) / grid.stride);
    const valid = grid.canPlace(piece, col, row);

    this._drag.col = col;
    this._drag.row = row;
    this._drag.valid = valid;
    this.events.emit('board:hover', { piece, col, row, valid });
  }

  _commitPlacement(piece, col, row) {
    this._grid.place(piece, col, row, Config.fx.landTime);
    // Snap the piece's own transform onto the grid before removing it, so it
    // reads as "settling in" rather than vanishing.
    const anchor = this._grid.cellToPixel(col, row);
    piece.x = anchor.x;
    piece.y = anchor.y;
    piece.scale = 1;

    const idx = this.tray.indexOf(piece);
    if (idx !== -1) this.tray.splice(idx, 1);

    this.game.getSystem('audio')?.play('place');
    this.events.emit('game:piecePlaced', {
      amount: 1, blocks: piece.blockCount, material: piece.materialKey,
    });

    // Resolve any completed lines (BoardSystem animates + reports the result).
    this.events.emit('board:checkClears');

    if (this.tray.length === 0) this.refill();
    else this._layoutTray();

    // Board handles game-over re-check after a clear; check now when nothing
    // is clearing so a fresh dead-end is caught immediately.
    if (!this.game.getSystem('board')?.isClearing) this._checkGameOver();
  }

  _rejectPlacement(piece) {
    const anim = this.game.getSystem('animation');
    const t = Config.fx.shakeTime;
    piece.shake = 9;
    anim?.to(piece, 'shake', 0, t, { ease: Easing.quadOut });
    anim?.to(piece, 'x', piece.homeX, t, { ease: Easing.backOut });
    anim?.to(piece, 'y', piece.homeY, t, { ease: Easing.backOut });
    anim?.to(piece, 'scale', piece.homeScale, t, { ease: Easing.backOut });
    this.game.getSystem('audio')?.play('invalid');
  }

  /** Hit-test the tray (generously) and return the relic under (x,y). */
  _pickTrayPieceAt(x, y) {
    const cs = this._grid.cellSize;
    for (let i = this.tray.length - 1; i >= 0; i--) {
      const p = this.tray[i];
      const w = p.width * cs * p.scale;
      const h = p.height * cs * p.scale;
      const pad = cs * p.scale * 0.4;
      if (x >= p.x - pad && x <= p.x + w + pad && y >= p.y - pad && y <= p.y + h + pad) {
        return p;
      }
    }
    return null;
  }

  // --- Game state ------------------------------------------------------------

  _checkGameOver() {
    const gameplay = this.game.getSystem('gameplay');
    if (gameplay && !gameplay.isPlaying) return;
    if (!this._grid || this.tray.length === 0) return;
    const anyFits = this.tray.some((p) => this._grid.canPlaceAnywhere(p));
    if (!anyFits) this.events.emit('game:over', {});
  }

  update(dt) {
    this._time += dt;
  }

  render(renderer) {
    if (!this._grid) return;
    const cs = this._grid.cellSize;
    // Draw resting relics first, then the held one on top.
    for (const piece of this.tray) {
      if (piece !== this._drag?.piece) piece.render(renderer, cs, this._time);
    }
    if (this._drag) this._drag.piece.render(renderer, cs, this._time);
  }
}
