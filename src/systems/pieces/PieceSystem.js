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
import { Haptics } from '../../utils/Haptics.js';
import { clamp } from '../../utils/MathUtils.js';
import { Random } from '../../utils/Random.js';
import { PieceFactory } from './PieceFactory.js';
import { PieceGenerator } from './PieceGenerator.js';
import { DifficultyDirector } from './DifficultyDirector.js';
import { UITheme } from '../../ui/theme/UITheme.js';

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

  /** The current tray band geometry ({ top, height, slotW, n }), or null. */
  get trayBand() { return this._trayBand ?? null; }

  /** True while the player is dragging a relic (drift waits for this to end). */
  get isDragging() { return !!this._drag; }

  /**
   * Set the difficulty level used to tune generated trays, WITHOUT refilling —
   * the higher difficulty takes effect on the next natural refill (when the tray
   * empties), so it never yanks pieces out from under the player. Used by the
   * endless ramp.
   */
  setDifficultyLevel(n) { this._level = n; }

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
    // Staggered pop-in: each relic springs up a beat after the previous one.
    this.tray.forEach((p, i) => { p._appear = -i * 0.14; });
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
    // Cap the tray band so relics sit on a platform just below the board (the
    // living world shows below it) rather than spanning the whole lower half.
    const trayHeight = Math.min(canvas.height - trayTop - 26, 300);
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
      // Remember the tray band so the platform can be drawn behind the pieces.
      this._trayBand = { top: trayTop, height: trayHeight, slotW: slotWidth, n: this.tray.length };
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
    piece.tilt = 0;
    this._lastX = x;
    this._hoverKey = null;
    piece.storeHome();

    // Springy grow to full board size.
    const anim = this.game.getSystem('animation');
    anim?.to(piece, 'scale', Config.fx.dragScale, Config.fx.pickupTime, { ease: Easing.backOut });

    this.game.getSystem('audio')?.play('pickup', { rate: 0.97 + Math.random() * 0.06 });
    Haptics.light(this.game);
    // A tiny sparkle at the grab point sells "I'm holding something".
    this.events.emit('fx:burst', { x, y, color: '#fff6c8', count: 5 });
    this._positionDrag(x, y);
  }

  _onMove({ id, x, y }) {
    if (!this._drag || id !== this._pointerId) return;
    // Tilt the relic toward horizontal finger movement (eased, clamped).
    if (this._lastX != null) {
      const target = clamp((x - this._lastX) * 0.03, -0.22, 0.22);
      this._drag.piece.tilt += (target - this._drag.piece.tilt) * 0.35;
    }
    this._lastX = x;
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

    // Magical sparkles when the snap target changes to a valid spot.
    const key = `${valid ? 1 : 0}:${col},${row}`;
    if (key !== this._hoverKey) {
      this._hoverKey = key;
      if (valid && grid.inRange(col, row)) {
        const c = grid.cellCenter(col, row);
        this.events.emit('fx:burst', { x: c.x, y: c.y, color: '#5fa8ff', count: 5 });
      }
    }
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

    this.game.getSystem('audio')?.play('place', { rate: 0.96 + Math.random() * 0.08 });

    // Satisfying impact: micro screen-shake, a ripple shockwave and magical
    // dust bursting from the landing point.
    const mat = piece.material;
    const ctr = this._grid.cellCenter(col + (piece.width - 1) / 2, row + (piece.height - 1) / 2);
    // Placement is the calm, frequent action — keep its feedback light (a soft
    // ripple + a few sparks). Screen-shake is reserved for impactful events
    // (clears, drift, the dragon) so it stays meaningful.
    this.events.emit('fx:ripple', { x: ctr.x, y: ctr.y, color: mat.glow, radius: this._grid.cellSize * 1.8 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: mat.spark, count: 5 });

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
    this.game.getSystem('audio')?.play('invalid', { rate: 0.96 + Math.random() * 0.08 });
    Haptics.warn(this.game);

    // A soft red flash and a puff of grey dust sell the rejection.
    const cs = this._grid.cellSize;
    const ctr = { x: piece.x + piece.width * cs * piece.scale / 2, y: piece.y + piece.height * cs * piece.scale / 2 };
    this.events.emit('fx:flash', { color: '#ff4d6d', strength: 0.12 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: '#9a90b0', count: 6 });
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
    let placeable = 0;
    for (const p of this.tray) if (this._grid.canPlaceAnywhere(p)) placeable++;
    if (placeable === 0) { this.events.emit('game:over', {}); return; }
    this._emitDanger(placeable);
  }

  /**
   * Broadcast how close the board is to a dead end (0 = calm, 1 = critical), so
   * the board can raise a "you're nearly stuck" tension effect. Danger rises as
   * free space shrinks and, more sharply, when only one or two tray pieces can
   * be placed at all. Cheap (one grid pass on an 8×8).
   */
  _emitDanger(placeable) {
    let empty = 0;
    this._grid.forEach((c) => {
      if (!(c.filled || c.structure || (c.tile && c.tile.blocksPlacement))) empty++;
    });
    const spaceDanger = clamp((18 - empty) / 13, 0, 1);          // 0 at ≥18 free, 1 at ≤5
    const optionDanger = placeable <= 1 ? 0.78 : placeable === 2 ? 0.42 : 0;
    const level = clamp(Math.max(spaceDanger, optionDanger), 0, 1);
    this.events.emit('board:danger', { level });
  }

  update(dt) {
    this._time += dt;
    // Relax the held relic's tilt back toward upright when the finger is still.
    if (this._drag) this._drag.piece.tilt *= 0.88;
    // Advance each relic's intro appear factor (staggered pop-in).
    for (const p of this.tray) {
      if (p._appear !== undefined && p._appear < 1) p._appear = Math.min(1, p._appear + dt * 3.2);
    }
  }

  render(renderer) {
    if (!this._grid) return;
    const cs = this._grid.cellSize;
    // Magical tray platform behind the relics.
    if (this._trayBand) this._drawTray(renderer);
    // Draw resting relics first, then the held one on top.
    for (const piece of this.tray) {
      if (piece !== this._drag?.piece) piece.render(renderer, cs, this._time);
    }
    if (this._drag) this._drag.piece.render(renderer, cs, this._time);
  }

  /**
   * The bottom tray drawn as a glossy magical platform with three glowing slot
   * recesses. Pure presentation — placement logic is unchanged.
   */
  _drawTray(renderer) {
    const band = this._trayBand;
    const canvas = this.game.canvas;
    const pad = 24;
    const x = pad, w = canvas.width - pad * 2;
    // Cap the platform height so it hugs the relics instead of filling the whole
    // lower half; centre it on the tray band (world stays visible below).
    const cyBand = band.top + band.height / 2;
    const h = Math.min(band.height + 28, 360);
    const y = cyBand - h / 2;
    // --- Premium glass panel base (big rounding, inner gloss, soft shadow) ---
    UITheme.glassPanel(renderer, x, y, w, h, 40);

    // --- Three slots with a soft blue magical light ---
    const filledCount = this.tray.length;
    for (let i = 0; i < band.n; i++) {
      const sx = band.slotW * i + band.slotW * 0.5;
      const sw = band.slotW * 0.78, sh = h - 48;
      const rx = sx - sw / 2, ry = y + 24;
      // Recess with a bright inner gloss.
      renderer.fillRoundRect(rx, ry, sw, sh, 24, 'rgba(90,150,220,0.10)');
      renderer.strokeRoundRect(rx, ry, sw, sh, 24, 'rgba(255,255,255,0.7)', 2);
      renderer.setAlpha(0.35); renderer.fillRoundRect(rx + 4, ry + 4, sw - 8, sh * 0.24, 20, 'rgba(255,255,255,0.8)'); renderer.setAlpha(1);
      // Soft blue magical light pooling in a slot that still holds a relic.
      if (i < filledCount) {
        const pulse = 0.5 + 0.5 * Math.sin(this._time * 2.4 + i);
        renderer.setAlpha(0.14 + pulse * 0.18);
        const g = renderer.radialGradient(sx, ry + sh / 2, sw * 0.55, [[0, '#8fd6ff'], [1, 'rgba(143,214,255,0)']]);
        renderer.fillRect(rx, ry, sw, sh, g);
        renderer.setAlpha(1);
      }
    }
  }
}
