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
import { t } from '../../i18n/Localization.js';
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { Easing } from '../../utils/Easing.js';
import { Haptics } from '../../utils/Haptics.js';
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
    /** True while a drift slide is settling; resolves clears when it lands. */
    this._driftPending = false;
    /** Throttle timer for the idle "no full line lingers" safety sweep. */
    this._sweepT = 0;
    // Board theme (cycled on every full-board clear) + the transformation FX.
    this._themeIndex = 0;
    this._theme = Palette.boardThemes[0];
    this._prevTheme = null;
    this._fullClearFx = null;   // { t, dur } while the wave + PERFECT banner play
    this._hint = null;          // { blocks, col, row, t } rewarded-hint highlight
  }

  onInit() {
    this._computeLayout();
    window.addEventListener('resize', () => this._computeLayout());

    // Persist the current board theme so it carries across sessions.
    const save = this.game.getSystem('save');
    this._themeSlice = save?.registerSlice('boardtheme', () => ({ index: 0 }));
    this._themeIndex = (this._themeSlice?.index ?? 0) % Palette.boardThemes.length;
    this._theme = Palette.boardThemes[this._themeIndex];

    this.listen('save:loaded', ({ data }) => { if (data.board) this.grid.deserialize(data.board); });
    this.listen('game:started', () => { this.grid.clearAll(); this._hint = null; });
    // Rewarded hint: highlight the suggested placement for a few seconds.
    this.listen('board:showHint', ({ blocks, col, row }) => { this._hint = { blocks, col, row, t: 4 }; });
    this.listen('game:piecePlaced', () => { this._hint = null; });
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
    // Lines completed by a Cosmic Drift also fire a distinct event so the
    // drift-specific objective can teach the mechanic.
    if (this._driftResolve) this.events.emit('drift:linesCleared', { count: lines.length, amount: lines.length });
    // Living Board: hand the resolved lines/cells to the TileSystem so tiles
    // (moss, crystal, frozen, dragon rune, treasure, tree, fog, corruption)
    // can react in sync with the clear.
    this.events.emit('board:linesResolved', { lines, cells: [...cells], grid: this.grid });
    // Premium punch: a quick screen flash accompanies the energy wave.
    this.events.emit('fx:flash', { color: '#ffffff', strength: 0.14 + 0.05 * lines.length });
    this.game.getSystem('audio')?.play('clear', { rate: 0.95 + Math.random() * 0.1 });
  }

  /**
   * Revive: instantly clear the bottom half of the board (and emit a bright
   * burst) so a dead-ended run has guaranteed room to continue. Instant rather
   * than animated so the very next tray refill sees the freed space.
   */
  reviveClear() {
    const g = this.grid;
    const from = Math.floor(g.rows / 2);
    let n = 0;
    for (let r = from; r < g.rows; r++) {
      for (let c = 0; c < g.columns; c++) {
        const cell = g.get(c, r);
        if (cell && cell.filled) { cell.clear(); n++; }
      }
    }
    const a = this._area;
    this.events.emit('fx:flash', { color: '#7fe0ff', strength: 0.3 });
    this.events.emit('fx:burst', { x: a.centerX, y: a.centerY + a.h * 0.25, color: '#7fe0ff', count: 44 });
    this.events.emit('fx:shake', { mag: 9 });
    this.game.getSystem('audio')?.play('clear');
    return n;
  }

  /** The rewarded-hint highlight: a pulsing green outline on the suggested
   *  placement cells, fading out over its last second. */
  _drawHint(renderer) {
    const h = this._hint, size = this.grid.cellSize, r = Config.board.cellRadius;
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 6);
    const fade = Math.min(1, h.t);
    for (const [bc, br] of h.blocks) {
      const c = h.col + bc, rr = h.row + br;
      if (!this.grid.inRange(c, rr)) continue;
      const { x, y } = this.grid.cellToPixel(c, rr);
      renderer.setAlpha((0.18 + pulse * 0.26) * fade);
      renderer.fillRoundRect(x, y, size, size, r, '#5bff96');
      renderer.setAlpha((0.7 + pulse * 0.3) * fade);
      renderer.withGlow('#5bff96', 8 + pulse * 12, () => renderer.strokeRoundRect(x + 1.5, y + 1.5, size - 3, size - 3, r, '#a6ffc4', 3));
      renderer.setAlpha(1);
    }
  }

  /** True when no placed crystal or risen structure remains on the board. */
  _isBoardEmpty() {
    let empty = true;
    this.grid.forEach((c) => { if (c.filled || c.structure) empty = false; });
    return empty;
  }

  /**
   * A full-board clear ("PERFECT"): advance the board theme (persisted), kick
   * off the transformation wave + banner, and pay out a celebratory bonus that
   * also nearly charges the Dragon Fire ultimate.
   */
  _onFullClear() {
    this._prevTheme = this._theme;
    this._themeIndex = (this._themeIndex + 1) % Palette.boardThemes.length;
    this._theme = Palette.boardThemes[this._themeIndex];
    if (this._themeSlice) { this._themeSlice.index = this._themeIndex; this.game.getSystem('save')?.markDirty(); }

    this._fullClearFx = { t: 0, dur: 1.15 };

    const bonus = 50;
    this.game.getSystem('economy')?.credit('gold', bonus);
    this.events.emit('gameplay:addEnergy', { amount: 30 });
    this.events.emit('board:fullClear', { bonus, theme: this._theme.name });

    const a = this._area;
    this.events.emit('fx:flash', { color: this._theme.accent, strength: 0.42 });
    this.events.emit('fx:burst', { x: a.centerX, y: a.centerY, color: this._theme.accent, count: 60 });
    this.events.emit('fx:shake', { mag: 14 });
    Haptics.victory(this.game);
    this.game.getSystem('audio')?.play('levelup');
  }

  /**
   * Dragon Fire ultimate: force-clear the fullest row AND fullest column
   * (regardless of whether they are complete) as one dramatic cross-strike.
   * Reuses the normal clear pipeline so scoring, tiles and combo all flow.
   * Fire radiates out from the strike intersection. Returns true if it cleared
   * anything. Called by the GameplaySystem when the energy meter is unleashed.
   */
  dragonSweep() {
    const g = this.grid;
    const countRow = (r) => { let n = 0; for (let c = 0; c < g.columns; c++) { const cell = g.get(c, r); if (cell && cell.filled && !cell.isClearing) n++; } return n; };
    const countCol = (c) => { let n = 0; for (let r = 0; r < g.rows; r++) { const cell = g.get(c, r); if (cell && cell.filled && !cell.isClearing) n++; } return n; };
    let bestRow = 0, bestRowN = -1, bestCol = 0, bestColN = -1;
    for (let r = 0; r < g.rows; r++) { const n = countRow(r); if (n > bestRowN) { bestRowN = n; bestRow = r; } }
    for (let c = 0; c < g.columns; c++) { const n = countCol(c); if (n > bestColN) { bestColN = n; bestCol = c; } }
    if (bestRowN <= 0 && bestColN <= 0) return false;

    const dur = Config.fx.clearCellTime;
    const stagger = Config.fx.clearStagger * 1.4;
    const delays = new Map();
    const add = (cell, dist) => {
      if (!cell || !cell.filled || cell.isClearing) return;
      const d = dist * stagger;
      if (!delays.has(cell) || d < delays.get(cell)) delays.set(cell, d);
    };
    for (let c = 0; c < g.columns; c++) add(g.get(c, bestRow), Math.abs(c - bestCol));
    for (let r = 0; r < g.rows; r++) add(g.get(bestCol, r), Math.abs(r - bestRow));
    if (delays.size === 0) return false;

    for (const [cell, d] of delays) cell.beginClear(d, dur);
    this._clearing = true;
    const cells = [...delays.keys()];
    // Count as a 2-line clear so scoring/combo/energy flow through as normal.
    this.events.emit('game:linesCleared', { count: 2, amount: 2 });
    this.events.emit('board:linesResolved', { lines: [cells], cells, grid: g });
    const ctr = g.cellCenter(bestCol, bestRow);
    this.events.emit('fx:flash', { color: '#ff8a3d', strength: 0.32 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: '#ff6a2a', count: 44 });
    this.events.emit('fx:shake', { mag: 12 });
    this.game.getSystem('audio')?.play('dragonRoar');
    return true;
  }

  /**
   * Booster strike: force-clear an explicit list of cells (a hammer's single
   * block, a bomb's 3×3). Reuses the normal clear timeline — cells ignite in a
   * ring radiating out from `focal` (grid coords) — but does NOT emit
   * `game:linesCleared`, so it never feeds scoring, combo or objectives: a
   * booster is a free assist, not a scored line. Returns true if it cleared
   * anything. Called by the BoosterSystem.
   */
  clearCells(cells, focal = null) {
    const targets = cells.filter((cell) => cell && cell.filled && !cell.isClearing);
    if (targets.length === 0) return false;

    const dur = Config.fx.clearCellTime;
    const stagger = Config.fx.clearStagger * 1.2;
    const fc = focal ?? { col: targets[0].col, row: targets[0].row };
    for (const cell of targets) {
      const dist = Math.abs(cell.col - fc.col) + Math.abs(cell.row - fc.row);
      cell.beginClear(dist * stagger, dur);
    }

    this._clearing = true;
    // Let the Living Board tiles react (moss/frozen/etc.) as with any clear,
    // but as a standalone strike — not part of a scored line.
    this.events.emit('board:linesResolved', { lines: [targets], cells: targets, grid: this.grid });
    const ctr = this.grid.cellCenter(fc.col, fc.row);
    this.events.emit('fx:flash', { color: '#ffd36a', strength: 0.18 });
    this.events.emit('fx:burst', { x: ctr.x, y: ctr.y, color: '#ffbf47', count: 12 + targets.length * 3 });
    this.events.emit('fx:shake', { mag: targets.length > 1 ? 9 : 5 });
    this.game.getSystem('audio')?.play('clear', { rate: 1.1 + Math.random() * 0.1 });
    return true;
  }

  // --- Cosmic Drift ----------------------------------------------------------

  /** A cell that blocks a drifting crystal (immovable): a structure or a
   *  placement-blocking tile, or the grid edge (null). */
  _isDriftWall(cell) {
    return !cell || !!cell.structure || !!(cell.tile && cell.tile.blocksPlacement);
  }

  /**
   * The signature "Cosmic Drift": slide every loose crystal one pull toward
   * `dir` ({dx,dy}), compacting each open run against the drift side (2048-style,
   * deterministic). Structures and blocking tiles act as walls that split a line
   * into independently-compacting segments; terrain tiles stay put (only the
   * crystal on top slides). After the slide settles, completed lines resolve
   * through the normal clear pipeline. Returns the number of crystals moved.
   */
  applyDrift(dir) {
    const g = this.grid;
    const vertical = dir.dy !== 0;
    const positive = (dir.dx + dir.dy) > 0;      // down / right → toward higher index
    const lines = vertical ? g.columns : g.rows;
    const span = vertical ? g.rows : g.columns;
    const at = (line, k) => (vertical ? g.get(line, k) : g.get(k, line));
    const dur = 0.2;
    let moved = 0;

    for (let line = 0; line < lines; line++) {
      let seg = [];
      const flush = () => { if (seg.length) { moved += this._compactSegment(seg, positive, vertical, dur); seg = []; } };
      for (let k = 0; k < span; k++) {
        const cell = at(line, k);
        if (this._isDriftWall(cell)) flush();
        else seg.push(cell);
      }
      flush();
    }

    if (moved > 0) {
      this._driftPending = true;
      const a = this._area;
      this.events.emit('fx:shake', { mag: 7 });
      this.events.emit('fx:flash', { color: '#bfe4ff', strength: 0.08 });
      this.events.emit('fx:burst', { x: a.centerX + dir.dx * a.w * 0.3, y: a.centerY + dir.dy * a.h * 0.3, color: '#8fd6ff', count: 14 });
      this.game.getSystem('audio')?.play('place', { rate: 0.7 });
    }
    return moved;
  }

  /**
   * Compact the movable crystals in one open segment (a run of non-wall cells)
   * toward the drift side, preserving their order, and start each moved
   * crystal's slide animation. Terrain tiles are untouched.
   */
  _compactSegment(cells, positive, vertical, dur) {
    const items = [];
    cells.forEach((c, i) => { if (c.filled) items.push({ mat: c.materialKey, fromIdx: i }); });
    // An empty run has nothing to move; a completely full run cannot shift.
    if (items.length === 0 || items.length === cells.length) return 0;
    // Empty every crystal in the run (tiles/structures stay).
    for (const c of cells) if (c.filled) { c.filled = false; c.materialKey = null; c.placeDur = 0; c.placeT = 0; }
    const L = cells.length, n = items.length;
    let moved = 0;
    for (let j = 0; j < n; j++) {
      const it = positive ? items[n - 1 - j] : items[j];
      const destIdx = positive ? (L - 1 - j) : j;
      const dest = cells[destIdx];
      dest.fill(it.mat, 0);
      const delta = it.fromIdx - destIdx;         // where it slid FROM, in cells
      if (delta !== 0) {
        moved++;
        if (vertical) dest.beginDrift(0, delta, dur);
        else dest.beginDrift(delta, 0, dur);
      }
    }
    return moved;
  }

  update(dt) {
    this._time += dt;
    let stillClearing = 0;
    let stillDrifting = 0;

    this.grid.forEach((cell) => {
      // Landing animation timer.
      if (cell.placeDur > 0) {
        cell.placeT += dt;
        if (cell.placeT >= cell.placeDur) cell.placeDur = 0;
      }

      // Cosmic Drift slide timer.
      if (cell.driftDur > 0) {
        stillDrifting++;
        cell.driftT += dt;
        if (cell.driftT >= cell.driftDur) cell.driftDur = 0;
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
      // A clear that empties the whole board is a "PERFECT" — celebrate + swap
      // the board theme with a transformation wave.
      if (this._isBoardEmpty()) this._onFullClear();
    }

    // Advance the full-clear transformation wave.
    if (this._fullClearFx) {
      this._fullClearFx.t += dt;
      if (this._fullClearFx.t >= this._fullClearFx.dur) { this._fullClearFx = null; this._prevTheme = null; }
    }

    // Fade out the rewarded hint.
    if (this._hint && (this._hint.t -= dt) <= 0) this._hint = null;

    // Once the drift slide settles, resolve any lines it completed. Tag this
    // resolve so lines completed BY the drift emit a distinct event that the
    // "clear N lines by Drift" objective can count.
    if (this._driftPending && stillDrifting === 0) {
      this._driftPending = false;
      this._driftResolve = true;
      this.events.emit('board:checkClears');
      this._driftResolve = false;
    }

    // Safety net: a fully-filled row or column must NEVER linger un-cleared. If
    // the board is idle (nothing clearing or drifting) and a full line somehow
    // exists — a missed edge case, a tile that filled a gap, a state race — the
    // next idle tick resolves it, so "a completed line that didn't disappear"
    // can't persist. Throttled; cheap on an 8×8 grid.
    if (!this._clearing && !this._driftPending) {
      this._sweepT += dt;
      if (this._sweepT >= 0.25) {
        this._sweepT = 0;
        if (this.grid.findFullLines().lines.length > 0) this._resolveClears();
      }
    }
  }

  _explode(cell) {
    const { x, y } = this.grid.cellCenter(cell.col, cell.row);
    const mat = Palette.materials[cell.clearMaterial] ?? Palette.materials.amethyst;
    // One tidy burst per cell (a full 8-cell line is ~80 particles, not ~190) —
    // still lively, no longer a screen-filling smear.
    this.events.emit('fx:burst', { x, y, color: mat.spark, count: 9 });
  }

  _sparks(cell) {
    const { x, y } = this.grid.cellCenter(cell.col, cell.row);
    const mat = Palette.materials[cell.clearMaterial] ?? Palette.materials.amethyst;
    this.events.emit('fx:burst', { x, y, color: mat.spark, count: 3 });
  }

  // --- Rendering -------------------------------------------------------------

  render(renderer) {
    this._drawPedestal(renderer);
    this._drawFrame(renderer);
    const size = this.grid.cellSize;

    // Themed socket gradient (one per theme, reused across cells via translate).
    const th = this._theme;
    const gradNew = renderer.linearGradient(0, 0, 0, size, [[0, th.faceTop], [1, th.faceBottom]]);
    // During a full-clear transformation, a wave sweeps outward from the centre:
    // cells behind the front already show the NEW theme, cells ahead still show
    // the old one, and cells right on the front flash with the accent.
    const fx = this._fullClearFx;
    let gradOld = gradNew, prevTh = th, waveFront = 0, ccx = 0, ccy = 0;
    if (fx) {
      prevTh = this._prevTheme ?? th;
      gradOld = renderer.linearGradient(0, 0, 0, size, [[0, prevTh.faceTop], [1, prevTh.faceBottom]]);
      const p = Easing.smooth(clamp(fx.t / fx.dur, 0, 1));
      ccx = (this.grid.columns - 1) / 2; ccy = (this.grid.rows - 1) / 2;
      const maxDist = Math.hypot(ccx, ccy) + 1.4;
      waveFront = p * maxDist;
    }

    const t = this._time;
    this.grid.forEach((cell) => {
      const { x, y } = this.grid.cellToPixel(cell.col, cell.row);
      // Pick the themed socket for this cell (wave reveal during a full clear).
      let grad = gradNew, rim = th.rim, flash = 0;
      if (fx) {
        const dist = Math.hypot(cell.col - ccx, cell.row - ccy);
        if (dist > waveFront) { grad = gradOld; rim = prevTh.rim; }
        const df = Math.abs(dist - waveFront);
        if (df < 0.9) flash = 1 - df / 0.9;
      }
      this._drawSocket(renderer, x, y, size, grad, rim, flash, th.accent);

      // Living Board terrain draws beneath the crystal (moss, ice, portal,
      // crystal-core, corruption, dragon rune, treasure, tree base).
      if (cell.tile) cell.tile.renderBelow(renderer, x, y, size, t);

      if (cell.isClearing) this._drawClearingCell(renderer, x, y, size, cell);
      // Structured cells are drawn by the StructureSystem (as the risen
      // structure), so skip the plain-crystal draw for them here.
      else if (cell.filled && !cell.structure) {
        // Cosmic Drift: slide the crystal in from where it drifted.
        let px = x, py = y;
        if (cell.driftDur > 0) {
          const k = 1 - Easing.smooth(clamp(cell.driftT / cell.driftDur, 0, 1)); // 1 → 0
          px += cell.driftDX * this.grid.stride * k;
          py += cell.driftDY * this.grid.stride * k;
        }
        this._drawPlacedCell(renderer, px, py, size, cell);
      }
      else if (!cell.filled && !cell.tile) this._drawAlive(renderer, x, y, size, cell);

      // Overlays that must sit above the crystal (fog, ice sheen, energy beams).
      if (cell.tile) cell.tile.renderAbove(renderer, x, y, size, t);
    });

    this._drawBoardMotes(renderer);
    if (this._fullClearFx) this._drawFullClearFx(renderer);
    if (this._hint && !this._hover) this._drawHint(renderer);
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

    // Beveled GOLD slab: a defining dark-amber outer line, a bright top-lit
    // highlight ring, then the metallic gold face, then the carved recess.
    renderer.fillRoundRect(outer.x, outer.y, outer.w, outer.h, R, Palette.stone.bevelEdge);
    renderer.fillRoundRect(outer.x + 2, outer.y + 2, outer.w - 4, outer.h - 4, R - 2, Palette.stone.bevelLight);
    const rim = 8;
    const face = renderer.linearGradient(outer.x, outer.y, outer.x, outer.bottom, [
      [0, Palette.stone.frameTop],
      [1, Palette.stone.frameBottom],
    ]);
    renderer.fillRoundRect(outer.x + rim, outer.y + rim, outer.w - rim * 2, outer.h - rim * 2, R - rim, face);
    // A bright sheen streak across the frame's upper edge — polished metal.
    renderer.setAlpha(0.5);
    renderer.fillRoundRect(outer.x + rim, outer.y + rim, outer.w - rim * 2, (outer.h - rim * 2) * 0.32, R - rim, Palette.stone.bevelLight);
    renderer.setAlpha(1);

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

    // Gem corner decorations (softly pulsing) — premium gold-frame accents.
    const cg = 0.6 + 0.4 * Math.sin(this._time * 2);
    const cs = pad * 0.55;
    for (const [cxp, cyp] of [[outer.x, outer.y], [outer.right, outer.y], [outer.x, outer.bottom], [outer.right, outer.bottom]]) {
      renderer.withGlow('#ffdf8a', 8 + cg * 6, () => {
        const g = renderer.linearGradient(cxp, cyp - cs, cxp, cyp + cs, [[0, '#fff6d8'], [1, '#f0b64e']]);
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
    // Delicate vines creeping only across the corners of the top and bottom
    // rims — a soft, desaturated sage so they read as a handcrafted detail on
    // the stone, never a bright green band cutting across the board.
    for (const edge of [0, 1]) {
      const ey = edge ? outer.bottom - 7 : outer.y + 7;
      const d = edge ? -1 : 1;
      ctx.save(); ctx.globalAlpha = 0.3; ctx.lineCap = 'round';
      for (const side of [0, 1]) {
        // A short tendril anchored at each corner, reaching ~28% inward.
        const x0 = side ? outer.right : outer.x;
        const dir = side ? -1 : 1;
        const span = outer.w * 0.28;
        ctx.strokeStyle = '#7cc48a'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) {
          const k = i / 14;
          const vx = x0 + dir * span * k;
          const vy = ey + Math.sin(k * 6 + this._time * 0.7 + edge) * 2.4 * (1 - k * 0.4);
          i ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy);
        }
        ctx.stroke();
        // A couple of tiny leaves near the anchor.
        for (let i = 3; i < 12; i += 4) {
          const k = i / 14;
          const vx = x0 + dir * span * k;
          const vy = ey + Math.sin(k * 6 + this._time * 0.7 + edge) * 2.4 * (1 - k * 0.4);
          renderer.fillCircle(vx, vy - 2.6 * d, 2.4, '#8fd39a');
        }
      }
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
   * one gradient allocation per frame rather than 64. `rim` and `socketGrad`
   * carry the active board theme; `flash` (0..1) accents the cell as the
   * full-clear transformation wave passes over it.
   */
  _drawSocket(renderer, x, y, size, socketGrad, rim = Palette.socket.rim, flash = 0, accent = '#22b7ff') {
    const r = Config.board.cellRadius;
    renderer.fillRoundRect(x - 1, y - 1, size + 2, size + 2, r + 1, rim);
    const ctx = renderer.ctx;
    ctx.save();
    ctx.translate(x, y);
    renderer.roundRectPath(0, 0, size, size, r);
    ctx.fillStyle = socketGrad;
    ctx.fill();
    ctx.restore();
    // Carved depth. A soft inner-top shadow sells the recess (light comes from
    // above, so the top lip casts down), a crisp rim-light rides that shadow,
    // and a deeper bottom shade grounds the socket — so each empty cell reads
    // as a real engraved slot and placed crystals pop out of it.
    renderer.setAlpha(0.22);
    renderer.fillRoundRect(x + size * 0.08, y + size * 0.04, size * 0.84, size * 0.12, r * 0.5, 'rgba(40,74,130,0.55)');
    renderer.setAlpha(0.5);
    renderer.fillRoundRect(x + size * 0.12, y + size * 0.15, size * 0.76, size * 0.1, r * 0.5, 'rgba(255,255,255,0.9)');
    renderer.setAlpha(0.22);
    renderer.fillRoundRect(x + size * 0.1, y + size * 0.78, size * 0.8, size * 0.13, r * 0.5, 'rgba(30,60,110,0.7)');
    renderer.setAlpha(1);
    // Transformation-wave accent: a bright bloom on the cell as the front passes.
    if (flash > 0) {
      renderer.setAlpha(flash * 0.7);
      renderer.withGlow(accent, 12, () => renderer.fillRoundRect(x, y, size, size, r, accent));
      renderer.setAlpha(1);
    }
  }

  /**
   * The full-board-clear celebration overlay: an expanding shockwave ring that
   * rides the transformation wave, and a "PERFECT!" banner that pops then fades.
   */
  _drawFullClearFx(renderer) {
    const fx = this._fullClearFx, a = this._area, ctx = renderer.ctx;
    const p = clamp(fx.t / fx.dur, 0, 1);
    const e = Easing.smooth(p);
    // Shockwave ring expanding from the board centre.
    const maxR = Math.hypot(a.w, a.h) * 0.5;
    const rad = e * maxR;
    renderer.setAlpha((1 - p) * 0.6);
    renderer.withGlow(this._theme.accent, 18, () => {
      ctx.strokeStyle = this._theme.accent;
      ctx.lineWidth = 6 + 10 * (1 - p);
      ctx.beginPath(); ctx.arc(a.centerX, a.centerY, rad, 0, Math.PI * 2); ctx.stroke();
    });
    renderer.setAlpha(1);
    // "PERFECT!" banner — backOut pop in, hold, fade out.
    const pop = Easing.backOut(clamp(p / 0.25, 0, 1));
    const fade = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
    const size = 64 * pop;
    renderer.setAlpha(fade);
    ctx.save();
    ctx.translate(a.centerX, a.centerY - a.h * 0.06);
    renderer.withGlow(this._theme.accent, 24, () => {
      renderer.text(t('common.perfect'), 2, 4, { font: `900 ${size}px system-ui, sans-serif`, color: 'rgba(20,44,92,0.35)', align: 'center', baseline: 'middle' });
      renderer.text(t('common.perfect'), 0, 0, { font: `900 ${size}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle', outline: this._theme.accent, outlineWidth: size * 0.12 });
    });
    ctx.restore();
    renderer.setAlpha(1);
  }

  /** Empty-but-alive cell: a single drifting glowing mote. */
  _drawAlive(renderer, x, y, size, cell) {
    const ctx = renderer.ctx;
    const cx = x + size * 0.5;

    // A single, very faint drifting mote — just enough life without scatter.
    // (The per-cell engraved rune was removed: at readable contrast it dotted
    // the empty board with glyphs that read as noise; the carved frame runes
    // carry the "living stone" motif on their own.)
    const m = (((this._time * 0.22 + cell.phase * 0.15) % 1) + 1) % 1;
    const mx = cx + Math.sin((this._time + cell.phase) * 1.4) * size * 0.14;
    const myy = y + size * (0.86 - 0.72 * m);
    ctx.globalAlpha = Math.sin(m * Math.PI) * 0.2;
    renderer.fillCircle(mx, myy, size * 0.04, '#7fd6ff');
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
