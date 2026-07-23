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
    // The board is the hero of the screen — keep it large with equal side
    // margins (it is width-bound, so this is near the maximum square).
    const margin = w * 0.04;
    // Leave headroom up top for the score, energy bar and objectives checklist.
    const top = h * 0.2;
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
    // Premium punch: a quick screen flash accompanies the energy wave.
    this.events.emit('fx:flash', { color: '#ffffff', strength: 0.14 + 0.05 * lines.length });
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
    this._drawPedestal(renderer);
    this._drawFrame(renderer);
    const size = this.grid.cellSize;

    // One cell-local socket gradient reused for all cells (via translate),
    // instead of allocating one gradient per cell every frame.
    const socketGrad = renderer.linearGradient(0, 0, 0, size,
      [[0, Palette.socket.faceTop], [1, Palette.socket.faceBottom]]);

    const t = this._time;
    this.grid.forEach((cell) => {
      const { x, y } = this.grid.cellToPixel(cell.col, cell.row);
      this._drawSocket(renderer, x, y, size, socketGrad);

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

    this._drawBoardMotes(renderer);
    if (this._hover) this._drawGhost(renderer);
  }

  /** Carved stone frame with beveled lighting and corner runes. */
  _drawFrame(renderer) {
    const gb = this.grid.bounds;
    const pad = this.grid.cellSize * 0.34;
    const outer = gb.inflate(pad);
    const R = 26;

    // Ambient "breathing" halo — the artifact softly inhales and exhales light.
    const breathe = 0.5 + 0.5 * Math.sin(this._time * 0.9);
    renderer.setAlpha(0.05 + breathe * 0.06);
    const halo = renderer.radialGradient(outer.centerX, outer.centerY, outer.w * 0.75,
      [[0, Palette.accent], [1, 'rgba(0,0,0,0)']]);
    renderer.fillRect(outer.x - pad, outer.y - pad, outer.w + pad * 2, outer.h + pad * 2, halo);
    renderer.setAlpha(1);

    // Soft grounding shadow (gentle and cool — never a hard black edge).
    renderer.withGlow('rgba(40,74,130,0.35)', 34, () => {
      renderer.fillRoundRect(outer.x, outer.y + 8, outer.w, outer.h, R, Palette.stone.frameBottom);
    });

    // Beveled slab with a THICK bright-white rim, stone face, carved recess.
    renderer.fillRoundRect(outer.x, outer.y, outer.w, outer.h, R, '#ffffff');
    const rim = 8;
    const face = renderer.linearGradient(outer.x, outer.y, outer.x, outer.bottom, [
      [0, Palette.stone.frameTop],
      [1, Palette.stone.frameBottom],
    ]);
    renderer.fillRoundRect(outer.x + rim, outer.y + rim, outer.w - rim * 2, outer.h - rim * 2, R - rim, face);

    // Inner carved recess the cells sit in.
    const recess = gb.inflate(pad * 0.45);
    const inner = renderer.linearGradient(recess.x, recess.y, recess.x, recess.bottom, [
      [0, Palette.stone.bevelDark],
      [1, Palette.stone.inlay],
    ]);
    renderer.fillRoundRect(recess.x, recess.y, recess.w, recess.h, R - 8, inner);
    // Soft inner glow pooling inside the recess (breathing).
    const ig = 0.5 + 0.5 * Math.sin(this._time * 0.9);
    renderer.setAlpha(0.10 + ig * 0.10);
    const glow = renderer.radialGradient(recess.centerX, recess.centerY, recess.w * 0.62, [[0, '#bfe4ff'], [1, 'rgba(191,228,255,0)']]);
    renderer.fillRect(recess.x, recess.y, recess.w, recess.h, glow);
    renderer.setAlpha(1);

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

    // Magic-lit cracks + tiny vines creeping along the edges.
    this._drawVinesCracks(renderer, outer);

    // Crystal corner decorations (softly pulsing) — premium frame accents.
    const cg = 0.6 + 0.4 * Math.sin(this._time * 2);
    const cs = pad * 0.55;
    for (const [cxp, cyp] of [[outer.x, outer.y], [outer.right, outer.y], [outer.x, outer.bottom], [outer.right, outer.bottom]]) {
      renderer.withGlow('#7fe0ff', 8 + cg * 6, () => {
        const g = renderer.linearGradient(cxp, cyp - cs, cxp, cyp + cs, [[0, '#e2fbff'], [1, '#8fd6ff']]);
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(cxp, cyp - cs); ctx.lineTo(cxp - cs * 0.7, cyp); ctx.lineTo(cxp, cyp + cs); ctx.lineTo(cxp + cs * 0.7, cyp); ctx.closePath(); ctx.fill();
      });
    }
  }

  /** Glowing cracks in the stone + gentle vines growing along top/bottom edges. */
  _drawVinesCracks(renderer, outer) {
    const ctx = renderer.ctx;
    // Glowing magical cracks.
    const pulse = 0.4 + 0.35 * Math.sin(this._time * 1.4);
    ctx.save();
    ctx.globalAlpha = 0.45 + pulse * 0.35;
    ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const [t, edge] of [[0.2, 0], [0.62, 0], [0.4, 1], [0.8, 1]]) {
      const bx = outer.x + outer.w * t, by = edge ? outer.bottom - 6 : outer.y + 6;
      const d = edge ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx + 9, by + 16 * d); ctx.lineTo(bx - 6, by + 30 * d); ctx.lineTo(bx + 7, by + 46 * d);
      ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // Vines with tiny leaves swaying along the top and bottom edges.
    for (const edge of [0, 1]) {
      const ey = edge ? outer.bottom - 8 : outer.y + 8;
      ctx.save(); ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const t = i / 24; const vx = outer.x + outer.w * t; const vy = ey + Math.sin(t * 11 + this._time * 0.8 + edge) * 5; i ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy); }
      ctx.stroke();
      for (let i = 2; i < 24; i += 3) { const t = i / 24; const vx = outer.x + outer.w * t; const vy = ey + Math.sin(t * 11 + this._time * 0.8 + edge) * 5; renderer.fillCircle(vx, vy - 5 * (edge ? -1 : 1), 4, '#6fd07f'); }
      ctx.globalAlpha = 1; ctx.restore();
    }
  }

  /** The board's floating-island pedestal: side crystals, roots and tiny falls. */
  _drawPedestal(renderer) {
    const a = this._area; const ctx = renderer.ctx; const t = this._time;
    // Floating crystals drifting beside the platform (in the side margins).
    const spots = [
      { x: a.x - 34, y: a.y + a.h * 0.28, s: 24 },
      { x: a.right + 34, y: a.y + a.h * 0.5, s: 28 },
      { x: a.x - 28, y: a.y + a.h * 0.72, s: 18 },
      { x: a.right + 30, y: a.y + a.h * 0.86, s: 20 },
    ];
    for (const sp of spots) {
      const bob = Math.sin(t * 1.2 + sp.x) * 6;
      const cg = 0.6 + 0.4 * Math.sin(t * 2 + sp.x);
      const cy = sp.y + bob;
      renderer.withGlow('#7fe0ff', 6 + cg * 8, () => {
        const g = renderer.linearGradient(sp.x, cy - sp.s, sp.x, cy + sp.s, [[0, '#e2fbff'], [1, '#8fd6ff']]);
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(sp.x, cy - sp.s); ctx.lineTo(sp.x - sp.s * 0.5, cy); ctx.lineTo(sp.x, cy + sp.s); ctx.lineTo(sp.x + sp.s * 0.5, cy); ctx.closePath(); ctx.fill();
      });
    }
    // Stone supports + roots curling from the bottom corners, and tiny falls.
    for (const dir of [-1, 1]) {
      const bx = dir < 0 ? a.x + a.w * 0.16 : a.right - a.w * 0.16;
      const by = a.bottom - 4;
      // support nub
      const g = renderer.linearGradient(bx, by, bx, by + 70, [[0, '#dcae74'], [1, '#b07a45']]);
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(bx - 26, by); ctx.lineTo(bx + 26, by); ctx.quadraticCurveTo(bx + 8, by + 70, bx, by + 74); ctx.quadraticCurveTo(bx - 8, by + 70, bx - 26, by); ctx.closePath(); ctx.fill();
      // root
      ctx.strokeStyle = '#9a6b3f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx + dir * 18, by + 6); ctx.quadraticCurveTo(bx + dir * 46, by + 30, bx + dir * 30, by + 64); ctx.stroke();
      // tiny waterfall
      renderer.setAlpha(0.6);
      const wg = renderer.linearGradient(bx, by, bx, by + 90, [[0, '#cdeeff'], [1, 'rgba(180,230,255,0)']]);
      renderer.fillRoundRect(bx - 5, by, 10, 90, 5, wg);
      renderer.setAlpha(1);
    }
  }

  /** A few drifting magical motes floating over the board (depth + life). */
  _drawBoardMotes(renderer) {
    const a = this._area;
    for (let i = 0; i < 9; i++) {
      const seed = i * 1.7;
      const px = a.x + ((Math.sin(seed * 3.1 + this._time * 0.3) * 0.5 + 0.5)) * a.w;
      const rise = ((this._time * 0.05 + i * 0.11) % 1);
      const py = a.bottom - rise * a.h;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(this._time * 1.5 + seed));
      renderer.setAlpha(tw * 0.35);
      renderer.fillCircle(px, py, 3 + tw * 2, '#bfe4ff');
      renderer.setAlpha(1);
    }
  }

  /**
   * Engraved socket (depth) drawn under every cell. Uses a shared cell-local
   * gradient (see render) painted through a translate, so the whole grid costs
   * one gradient allocation per frame rather than 64.
   */
  _drawSocket(renderer, x, y, size, socketGrad) {
    const r = Config.board.cellRadius;
    renderer.fillRoundRect(x - 1, y - 1, size + 2, size + 2, r + 1, Palette.socket.rim);
    const ctx = renderer.ctx;
    ctx.save();
    ctx.translate(x, y);
    renderer.roundRectPath(0, 0, size, size, r);
    ctx.fillStyle = socketGrad;
    ctx.fill();
    ctx.restore();
    // Carved depth: a soft top highlight and a bottom shade inside the tile so
    // each cell reads as an engraved stone slab, not a flat square.
    renderer.setAlpha(0.4);
    renderer.fillRoundRect(x + size * 0.1, y + size * 0.09, size * 0.8, size * 0.14, r * 0.5, 'rgba(255,255,255,0.85)');
    renderer.setAlpha(0.16);
    renderer.fillRoundRect(x + size * 0.1, y + size * 0.77, size * 0.8, size * 0.14, r * 0.5, 'rgba(30,60,110,0.7)');
    renderer.setAlpha(1);
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
    renderer.fillCircle(mx, myy, size * 0.05, '#7fd6ff');
    ctx.globalAlpha = 1;

    // Occasional moss creeping in a corner of the carved tile (deterministic).
    if ((cell.col * 5 + cell.row * 3) % 6 === 0) {
      ctx.globalAlpha = 0.6;
      const mgx = x + size * 0.22, mgy = y + size * 0.8;
      renderer.fillCircle(mgx, mgy, size * 0.1, '#6fae5a');
      renderer.fillCircle(mgx + size * 0.13, mgy - size * 0.05, size * 0.075, '#8fce6a');
      renderer.fillCircle(mgx - size * 0.06, mgy - size * 0.02, size * 0.06, '#5aa85f');
      ctx.globalAlpha = 1;
    }
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

  /**
   * Placement preview: valid cells glow blue with a smooth pulse; invalid cells
   * glow red. The pulse makes the target feel alive and reads instantly.
   */
  _drawGhost(renderer) {
    const { piece, col, row, valid } = this._hover;
    const size = this.grid.cellSize;
    const r = Config.board.cellRadius;
    const color = valid ? '#3d7bff' : Palette.danger;
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 6);   // smooth breathing
    for (const [bc, br] of piece.blocks) {
      const c = col + bc;
      const rr = row + br;
      if (!this.grid.inRange(c, rr)) continue;
      const { x, y } = this.grid.cellToPixel(c, rr);
      renderer.setAlpha(0.14 + pulse * 0.14);
      renderer.fillRoundRect(x, y, size, size, r, color);
      renderer.setAlpha(0.8 + pulse * 0.2);
      renderer.withGlow(color, 10 + pulse * 10, () => {
        renderer.strokeRoundRect(x + 1, y + 1, size - 2, size - 2, r, color, 2.5);
      });
      renderer.setAlpha(1);
    }
  }
}
