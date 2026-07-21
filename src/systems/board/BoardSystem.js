/**
 * BoardSystem.js
 * -----------------------------------------------------------------------------
 * The ancient magical artifact the game is played on. Owns the Grid and every
 * bit of board presentation and animation:
 *   - a carved stone frame with beveled lighting and rune engravings
 *   - engraved cell "sockets" that feel alive (drifting motes + pulsing runes)
 *   - placed crystals with landing squash/pop
 *   - the placement ghost (green = valid, red = invalid)
 *   - the line-clear "travelling energy" sequence: cells ignite one after
 *     another along the line, explode into particles, then leave sparks and
 *     empty out.
 *
 * Placement rules and scoring live elsewhere (Grid + PieceSystem + gameplay);
 * this system turns state changes into something that feels magical.
 *
 * Events:
 *   listens 'game:started'      — wipe the board
 *   listens 'board:checkClears' — detect + animate completed lines
 *   listens 'board:hover'       — show the placement ghost
 *   listens 'board:hoverEnd'    — hide the placement ghost
 *   listens 'save:loaded'       — restore occupancy
 *   emits   'board:ready'         ({ grid })
 *           'game:linesCleared'   ({ count })    when a clear begins
 *           'game:noClears'       ()             when a placement clears nothing
 *           'board:clearComplete' ()             when the last cell empties
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { Easing } from '../../utils/Easing.js';
import { Grid } from './Grid.js';
import { drawRune } from './Runes.js';
import { drawCrystal } from '../../render/Crystal.js';

export class BoardSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'board';
    this.grid = new Grid(Config.board.columns, Config.board.rows);
    this._area = new Rect();
    this._time = 0;
    /** Placement preview: { piece, col, row, valid } | null. */
    this._hover = null;
    /** True while a clear sequence is animating. */
    this._clearing = false;
  }

  onInit() {
    this._computeLayout();
    window.addEventListener('resize', () => this._computeLayout());

    this.listen('save:loaded', ({ data }) => { if (data.board) this.grid.deserialize(data.board); });
    this.listen('game:started', () => this.grid.clearAll());
    this.listen('board:hover', (h) => { this._hover = h; });
    this.listen('board:hoverEnd', () => { this._hover = null; });
    this.listen('board:checkClears', () => this._resolveClears());

    // Defer so systems registered after the board (pieces) are subscribed.
    Promise.resolve().then(() => this.events.emit('board:ready', { grid: this.grid }));
  }

  get area() { return this._area; }
  get isClearing() { return this._clearing; }

  _computeLayout() {
    const w = this.game.canvas.width;
    const h = this.game.canvas.height;
    const margin = w * 0.07;
    const top = h * 0.14;
    const size = w - margin * 2;
    this._area.set(margin, top, size, size);
    this.grid.layout(this._area, Config.board.gutter);
  }

  // --- Clearing --------------------------------------------------------------

  /** Detect full lines and, if any, kick off the travelling-energy clear. */
  _resolveClears() {
    const { lines, cells } = this.grid.findFullLines();
    if (lines.length === 0) {
      this.events.emit('game:noClears');
      return;
    }

    // Each cell ignites when the energy wave reaches it. A cell shared by
    // several lines uses the earliest arrival for a satisfying crossfire.
    const stagger = Config.fx.clearStagger;
    const dur = Config.fx.clearCellTime;
    const delayOf = new Map();
    for (const line of lines) {
      line.forEach((cell, i) => {
        const d = i * stagger;
        if (!delayOf.has(cell) || d < delayOf.get(cell)) delayOf.set(cell, d);
      });
    }
    for (const cell of cells) cell.beginClear(delayOf.get(cell) ?? 0, dur);

    this._clearing = true;
    // `amount` mirrors `count` so the generic MissionSystem can accrue progress.
    this.events.emit('game:linesCleared', { count: lines.length, amount: lines.length });
    // Living Board: hand the resolved lines/cells to the TileSystem so tiles
    // (moss, crystal, frozen, dragon rune, treasure, tree, fog, corruption)
    // can react in sync with the clear.
    this.events.emit('board:linesResolved', { lines, cells: [...cells], grid: this.grid });
    this.game.getSystem('audio')?.play('clear');
  }

  update(dt) {
    this._time += dt;
    let stillClearing = 0;

    this.grid.forEach((cell) => {
      // Landing animation timer.
      if (cell.placeDur > 0) {
        cell.placeT += dt;
        if (cell.placeT >= cell.placeDur) cell.placeDur = 0;
      }

      // Clear timeline: wait for the wave, then ignite → burst → sparks → empty.
      if (cell.isClearing) {
        stillClearing++;
        if (cell.clearDelay > 0) {
          cell.clearDelay -= dt;
          if (cell.clearDelay <= 0 && !cell.igniteFired) {
            cell.igniteFired = true;
            this._explode(cell);           // energy explodes into particles
          }
        } else {
          if (!cell.igniteFired) { cell.igniteFired = true; this._explode(cell); }
          cell.clearT += dt;
          if (!cell.sparkFired && cell.clearT >= cell.clearDur * 0.5) {
            cell.sparkFired = true;
            this._sparks(cell);            // lingering magical sparks
          }
          if (cell.clearT >= cell.clearDur) cell.clear();
        }
      }
    });

    if (this._clearing && stillClearing === 0) {
      this._clearing = false;
      this.events.emit('board:clearComplete');
    }
  }

  _explode(cell) {
    const { x, y } = this.grid.cellCenter(cell.col, cell.row);
    const mat = Palette.materials[cell.clearMaterial] ?? Palette.materials.amethyst;
    this.events.emit('fx:burst', { x, y, color: mat.spark, count: 16 });
    this.events.emit('fx:burst', { x, y, color: mat.glow, count: 8 });
  }

  _sparks(cell) {
    const { x, y } = this.grid.cellCenter(cell.col, cell.row);
    const mat = Palette.materials[cell.clearMaterial] ?? Palette.materials.amethyst;
    this.events.emit('fx:burst', { x, y, color: mat.spark, count: 5 });
  }

  // --- Rendering -------------------------------------------------------------

  render(renderer) {
    this._drawFrame(renderer);
    const size = this.grid.cellSize;

    const t = this._time;
    this.grid.forEach((cell) => {
      const { x, y } = this.grid.cellToPixel(cell.col, cell.row);
      this._drawSocket(renderer, x, y, size, cell);

      // Living Board terrain draws beneath the crystal (moss, ice, portal,
      // crystal-core, corruption, dragon rune, treasure, tree base).
      if (cell.tile) cell.tile.renderBelow(renderer, x, y, size, t);

      if (cell.isClearing) this._drawClearingCell(renderer, x, y, size, cell);
      // Structured cells are drawn by the StructureSystem (as the risen
      // structure), so skip the plain-crystal draw for them here.
      else if (cell.filled && !cell.structure) this._drawPlacedCell(renderer, x, y, size, cell);
      else if (!cell.filled && !cell.tile) this._drawAlive(renderer, x, y, size, cell);

      // Overlays that must sit above the crystal (fog, ice sheen, energy beams).
      if (cell.tile) cell.tile.renderAbove(renderer, x, y, size, t);
    });

    if (this._hover) this._drawGhost(renderer);
  }

  /** Carved stone frame with beveled lighting and corner runes. */
  _drawFrame(renderer) {
    const gb = this.grid.bounds;
    const pad = this.grid.cellSize * 0.34;
    const outer = gb.inflate(pad);
    const R = 26;

    // Grounding shadow.
    renderer.withGlow('rgba(0,0,0,0.6)', 40, () => {
      renderer.fillRoundRect(outer.x, outer.y + 6, outer.w, outer.h, R, Palette.stone.frameBottom);
    });

    // Beveled slab: light rim, stone face, carved recess.
    renderer.fillRoundRect(outer.x, outer.y, outer.w, outer.h, R, Palette.stone.bevelLight);
    const face = renderer.linearGradient(outer.x, outer.y, outer.x, outer.bottom, [
      [0, Palette.stone.frameTop],
      [1, Palette.stone.frameBottom],
    ]);
    renderer.fillRoundRect(outer.x + 3, outer.y + 3, outer.w - 6, outer.h - 6, R - 3, face);

    // Inner carved recess the cells sit in.
    const recess = gb.inflate(pad * 0.45);
    const inner = renderer.linearGradient(recess.x, recess.y, recess.x, recess.bottom, [
      [0, Palette.stone.bevelDark],
      [1, Palette.stone.inlay],
    ]);
    renderer.fillRoundRect(recess.x, recess.y, recess.w, recess.h, R - 8, inner);

    // Rune engravings around the frame. As Structure Patterns are completed
    // the board "evolves": its runes glow progressively brighter.
    const ctx = renderer.ctx;
    const glyphSize = pad * 0.9;
    const evolution = this.game.getSystem('structures')?.evolution ?? 0;
    const lit = 0.12 + 0.08 * Math.sin(this._time * 0.9) + evolution * 0.4;
    ctx.globalAlpha = lit;
    ctx.strokeStyle = Palette.rune.lit;
    ctx.lineWidth = 2;
    const my = outer.y + pad * 0.5;
    const by = outer.bottom - pad * 0.5;
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const x = outer.x + outer.w * t;
      drawRune(ctx, i, x, my, glyphSize);
      drawRune(ctx, i + 2, x, by, glyphSize);
    }
    ctx.globalAlpha = 1;
  }

  /** Engraved socket (depth) drawn under every cell, filled or not. */
  _drawSocket(renderer, x, y, size, cell) {
    const r = Config.board.cellRadius;
    renderer.fillRoundRect(x - 1, y - 1, size + 2, size + 2, r + 1, Palette.socket.rim);
    const face = renderer.linearGradient(x, y, x, y + size, [
      [0, Palette.socket.faceTop],
      [1, Palette.socket.faceBottom],
    ]);
    renderer.fillRoundRect(x, y, size, size, r, face);
  }

  /** Empty-but-alive cell: pulsing rune + a drifting glowing mote. */
  _drawAlive(renderer, x, y, size, cell) {
    const ctx = renderer.ctx;
    const cx = x + size * 0.5;
    const cy = y + size * 0.5;

    // Pulsing engraved rune.
    const litPulse = 0.5 + 0.5 * Math.sin(this._time * 0.8 + cell.phase);
    ctx.globalAlpha = 0.10 + litPulse * 0.16;
    ctx.strokeStyle = Palette.rune.lit;
    ctx.lineWidth = Math.max(1, size * 0.03);
    drawRune(ctx, cell.runeId, cx, cy, size * 0.72);
    ctx.globalAlpha = 1;

    // Drifting mote rising through the socket.
    const m = (((this._time * 0.22 + cell.phase * 0.15) % 1) + 1) % 1;
    const mx = cx + Math.sin((this._time + cell.phase) * 1.4) * size * 0.14;
    const myy = y + size * (0.86 - 0.72 * m);
    ctx.globalAlpha = Math.sin(m * Math.PI) * 0.5;
    renderer.fillCircle(mx, myy, size * 0.05, '#c9b8ff');
    ctx.globalAlpha = 1;
  }

  /** Placed crystal with landing squash/pop. */
  _drawPlacedCell(renderer, x, y, size, cell) {
    const mat = Palette.materials[cell.materialKey];
    let scale = 1;
    let glow = 0.5 + 0.12 * Math.sin(this._time * 2 + cell.phase);
    if (cell.placeDur > 0) {
      const p = clamp(cell.placeT / cell.placeDur, 0, 1);
      scale = Easing.backOut(p);           // 0 → overshoot → settle at 1
      glow += (1 - p) * 0.6;               // bright flash on arrival
    }
    drawCrystal(renderer, x, y, size, mat, { scale, glow });
  }

  /** A cell mid-clear: ignites bright, swells, then dissolves away. */
  _drawClearingCell(renderer, x, y, size, cell) {
    const mat = Palette.materials[cell.clearMaterial] ?? Palette.materials.amethyst;
    if (cell.clearDelay > 0) {
      // Waiting for the wave — brighten slightly in anticipation.
      drawCrystal(renderer, x, y, size, mat, { scale: 1, glow: 0.7 });
      return;
    }
    const t = clamp(cell.clearT / cell.clearDur, 0, 1);
    const bump = Math.sin(t * Math.PI);    // 0 → 1 → 0
    renderer.setAlpha(1 - t * 0.15);
    drawCrystal(renderer, x, y, size, mat, {
      scale: 1 + 0.42 * bump,
      glow: 0.9 + bump,
      ignite: bump,
    });
    renderer.setAlpha(1);
  }

  /** Placement preview outline: green when valid, red when not. */
  _drawGhost(renderer) {
    const { piece, col, row, valid } = this._hover;
    const size = this.grid.cellSize;
    const r = Config.board.cellRadius;
    const color = valid ? Palette.success : Palette.danger;
    for (const [bc, br] of piece.blocks) {
      const c = col + bc;
      const rr = row + br;
      if (!this.grid.inRange(c, rr)) continue;
      const { x, y } = this.grid.cellToPixel(c, rr);
      renderer.setAlpha(0.18);
      renderer.fillRoundRect(x, y, size, size, r, color);
      renderer.setAlpha(0.9);
      renderer.withGlow(color, 12, () => {
        renderer.strokeRoundRect(x + 1, y + 1, size - 2, size - 2, r, color, 2.5);
      });
      renderer.setAlpha(1);
    }
  }
}
