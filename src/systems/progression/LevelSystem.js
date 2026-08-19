/**
 * LevelSystem.js
 * -----------------------------------------------------------------------------
 * Drives progression across hundreds of levels grouped into themed worlds.
 * The game is pure classic Block Blast: boards are clean 8×8 grids with no
 * special or blocking tiles — worlds are cosmetic name groupings that flavour
 * the campaign as it deepens. Variety comes from the objective set and the
 * board-aware piece generator, not from board hazards.
 *
 * Responsibilities:
 *   - track the current level / world / goal (persisted so runs continue)
 *   - hand each level a tile-free board to the TileSystem, and give deeper
 *     levels a distinct opening "shape" of pre-placed gems (ordinary clearable
 *     cells, never blockers) so boards don't all start identically empty
 *   - advance when the level's objectives are all met (after the clear
 *     animation finishes, so it never cuts a clear short)
 *
 * Events:
 *   listens 'game:started', 'game:linesCleared', 'board:clearComplete', 'save:loaded'
 *   emits   'level:changed' ({ level, world, worldName, goal, newMechanic, ... })
 *           'level:progress' ({ cleared, goal })
 *           'level:complete' ({ level })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { AuthoredLevels } from '../../config/AuthoredLevels.js';
import { Random } from '../../utils/Random.js';
import { clamp } from '../../utils/MathUtils.js';
import { MaterialKeys } from '../../config/Palette.js';

/**
 * The world table — themed names that flavour the campaign as it deepens. (The
 * game is pure classic Block Blast: worlds are cosmetic groupings only, with no
 * special-tile mechanics.)
 */
const WORLDS = [
  { name: 'Stoneplain' },
  { name: 'Mosswood' },
  { name: 'Crystal Caverns' },
  { name: 'Frostreach' },
  { name: 'The Blight' },
  { name: 'Portal Rifts' },
  { name: 'Dragon Spire' },
  { name: 'Treasure Vaults' },
  { name: 'Elderwood' },
  { name: 'Mistlands' },
];

export class LevelSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'level';
    this.level = 1;
    this.goal = 0;
    this.cleared = 0;
    this._pending = 0;         // next level queued until the clear finishes
    this._progress = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._progress = save.registerSlice('progress', () => ({ level: 1, highest: 1, stars: {} }));
    if (!this._progress.stars) this._progress.stars = {};   // migrate older saves
    this.level = this._progress.level ?? 1;

    this.listen('game:started', ({ mode, level } = {}) => {
      // Daily Challenge runs on the same score-chasing rails as Endless.
      this._endless = mode === 'endless' || mode === 'daily';
      if (this._endless) this.beginEndless();
      // `level` lets the Level Select start (or replay) a chosen level; a plain
      // "continue" (no level) resumes the frontier.
      else this.beginLevel(level ?? this._progress.level ?? this.level);
    });
    // A level is now cleared when its OBJECTIVES are all met (not a score goal).
    this.listen('objectives:allComplete', () => { if (!this._endless) this._completeLevel(); });
    this.listen('board:clearComplete', () => this._maybeAdvance());
    // Tapping "Next Level" on the victory screen must reveal the ADVANCED level
    // even if the triggering clear is still animating — force the queued advance
    // now (no-op if it already happened).
    this.listen('ui:reveal-next', () => this._maybeAdvance());
    // Endless difficulty ramp: the longer you survive, the harder the hands get.
    this.listen('game:linesCleared', ({ count = 1 }) => { if (this._endless) this._rampEndless(count); });

    // Per-level performance signals feed the star rating (skill, no crutches).
    this.listen('booster:used', () => { this._usedBooster = true; });
    this.listen('game:linesCleared', ({ count = 1 }) => { if (count >= 2) this._skillClear = true; });
    this.listen('gameplay:combo', ({ combo = 0 }) => { if (combo >= 2) this._skillClear = true; });
  }

  /** Furthest level the player has reached (drives the World Map unlock line). */
  get highest() { return Math.max(this.level, this._progress?.highest ?? 1); }
  /** The next level to play (levels below it are beaten + replayable). */
  get frontierLevel() { return this._progress?.level ?? 1; }
  /** Best star rating (0–3) earned on a level, 0 if never completed. */
  starsFor(level) { return this._progress?.stars?.[level] ?? 0; }

  /**
   * Star rating for THIS run: 3 for a clean, skilful clear (no booster used +
   * at least one combo / multi-line clear), 2 for one of those, 1 for a scrappy
   * win. Legible and skill-rewarding without punishing the player.
   */
  _computeStars() {
    let s = 3;
    if (this._usedBooster) s -= 1;
    if (!this._skillClear) s -= 1;
    return clamp(s, 1, 3);
  }

  // --- World / goal maths ----------------------------------------------------
  get worldIndex() { return Math.floor((this.level - 1) / Config.progression.levelsPerWorld); }
  get levelInWorld() { return (this.level - 1) % Config.progression.levelsPerWorld; }
  /** Capped index used for naming + goal once past the last defined world. */
  get namedWorld() { return Math.min(this.worldIndex, WORLDS.length - 1); }

  // --- Level lifecycle -------------------------------------------------------

  beginLevel(level) {
    this.level = level;
    this._pending = 0;
    this._usedBooster = false;   // reset per-level star signals
    this._skillClear = false;
    const world = this.namedWorld;

    // Pure classic (Block Blast style): the campaign is tile-free. No Living
    // Board mechanics unlock, so no special or blocking tiles ever seed the
    // board — the faint, un-placeable obstacle tiles that confused players are
    // gone entirely. Objectives are drawn only from the tile-agnostic set
    // (place blocks / clear lines / combos); authored openings still supply
    // their explicit goals.
    const unlocked = new Set();
    const authored = AuthoredLevels[level] ?? null;
    this.game.getSystem('tiles').buildLevel([], unlocked, level * 2654435761);

    // Give deeper levels a distinct opening "shape" — a small pattern of already
    // placed gems the player works around and clears. These are ordinary filled
    // cells (clearly visible, fully clearable), NOT blockers, so each level looks
    // different without any confusing un-placeable tiles. Runs BEFORE the
    // level:changed emit so the board-aware generator sees the pre-fill and keeps
    // the opening tray solvable.
    if (!authored && level >= 8) this._prefillBoard(level);

    // The ObjectivesSystem builds this level's goals from `unlocked` + level,
    // unless the authored opening supplies an explicit objective set.
    this.events.emit('level:changed', {
      level: this.level,
      world: world + 1,
      worldName: WORLDS[world].name,
      levelInWorld: this.levelInWorld,
      newMechanic: null,
      unlocked: [],
      authored: authored?.objectives ?? null,
      drift: authored ? authored.drift !== false : true,
    });
  }

  /**
   * Endless survival: one continuous plain board (no objective tiles, no level
   * gate). The player places pieces for score until the board fills. Difficulty
   * sits at a fair, varied middle so hands stay interesting without ramping into
   * the objective-teaching layout.
   */
  beginEndless() {
    this._pending = 0;
    this._endlessLevel = 12;    // starting piece-difficulty target
    this._endlessLines = 0;
    this._endlessTier = 0;
    this.game.getSystem('tiles').buildLevel([], new Set(), 1);
    this.events.emit('level:changed', {
      level: this._endlessLevel,
      world: 0,
      worldName: 'Endless',
      levelInWorld: 0,
      newMechanic: null,
      unlocked: [],
      endless: true,
    });
  }

  /** Current endless difficulty tier (0-based), for the HUD "DEPTH" readout. */
  get endlessTier() { return this._endlessTier ?? 0; }

  /**
   * Escalate endless difficulty with survival: every few cleared lines, nudge
   * the piece-difficulty target up a step (capped). Applied without refilling —
   * it takes effect on the next natural tray refill.
   */
  _rampEndless(count) {
    const LINES_PER_TIER = 4, STEP = 5, CAP = 60;
    this._endlessLines += count;
    let ramped = false;
    while (this._endlessLines >= (this._endlessTier + 1) * LINES_PER_TIER && this._endlessLevel < CAP) {
      this._endlessTier++;
      this._endlessLevel = Math.min(CAP, this._endlessLevel + STEP);
      ramped = true;
    }
    if (ramped) {
      this.game.getSystem('pieces')?.setDifficultyLevel(this._endlessLevel);
      this.events.emit('endless:ramp', { tier: this._endlessTier, level: this._endlessLevel });
    }
  }

  /** Objectives all met → queue the next level (advances after the clear settles). */
  _completeLevel() {
    if (this._pending) return;
    this._pending = this.level + 1;
    this.game.getSystem('audio')?.play('levelup');

    // Rate this run and persist the player's best rating for the level.
    const stars = this._computeStars();
    const best = this._progress.stars[this.level] ?? 0;
    if (stars > best) { this._progress.stars[this.level] = stars; this.game.getSystem('save')?.markDirty(); }

    this.events.emit('level:complete', { level: this.level, stars });
    // If nothing is mid-clear, advance on the next tick; otherwise wait for
    // 'board:clearComplete' so a triggering clear finishes its animation first.
    if (!this.game.getSystem('board')?.isClearing) {
      Promise.resolve().then(() => this._maybeAdvance());
    }
  }

  /** Advance to the queued level once the triggering clear has finished. */
  _maybeAdvance() {
    if (!this._pending) return;
    const next = this._pending;
    this._pending = 0;
    // Only push the frontier forward — replaying an old level must never regress
    // the player's furthest progress.
    this._progress.level = Math.max(this._progress.level ?? 1, next);
    this._progress.highest = Math.max(this._progress.highest ?? 1, next);
    this.game.getSystem('save')?.markDirty();
    this.beginLevel(next);
  }

  // --- Opening board patterns ------------------------------------------------

  /**
   * Paint a small, deterministic pattern of pre-placed gems for a campaign level
   * so each board has its own opening shape. Purely visual variety + a light
   * puzzle setup: they are normal filled cells (clearable, obviously occupied),
   * capped well below a clog, and never pre-complete a line (which would auto-
   * clear on the first placement the player didn't earn).
   */
  _prefillBoard(level) {
    const grid = this.game.getSystem('board')?.grid;
    if (!grid) return;
    const rows = grid.rows, cols = grid.columns;
    const rng = new Random((level * 0x85ebca6b) >>> 0);

    // Gentle ramp, hard-capped so the board always reads as mostly empty.
    const maxCells = Math.floor(rows * cols * 0.22);   // ~14 on an 8x8 board
    const count = clamp(3 + Math.floor((level - 8) / 4), 3, maxCells);

    const set = new Set();
    const add = (c, r) => { if (c >= 0 && c < cols && r >= 0 && r < rows) set.add(c + ',' + r); };
    const patterns = ['scatter', 'corners', 'frame', 'diagonal', 'cluster', 'checker'];
    switch (rng.pick(patterns)) {
      case 'corners': {
        const corners = [[0, 0], [cols - 2, 0], [0, rows - 2], [cols - 2, rows - 2]];
        for (let i = corners.length - 1; i > 0; i--) { const j = rng.int(0, i); [corners[i], corners[j]] = [corners[j], corners[i]]; }
        for (const [cc, cr] of corners.slice(0, rng.int(2, 3))) { add(cc, cr); add(cc + 1, cr); add(cc, cr + 1); add(cc + 1, cr + 1); }
        break;
      }
      case 'frame':
        for (let c = 0; c < cols; c += 2) { add(c, 0); add(c, rows - 1); }
        for (let r = 2; r < rows - 1; r += 2) { add(0, r); add(cols - 1, r); }
        break;
      case 'diagonal': {
        const flip = rng.int(0, 1) === 1;
        for (let i = 0; i < Math.min(rows, cols); i++) add(flip ? cols - 1 - i : i, i);
        break;
      }
      case 'cluster': {
        const w = rng.int(2, 3), h = rng.int(2, 3);
        const c0 = rng.int(1, Math.max(1, cols - w - 1)), r0 = rng.int(1, Math.max(1, rows - h - 1));
        for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) add(c0 + c, r0 + r);
        break;
      }
      case 'checker': {
        const w = 4, h = 4, c0 = rng.int(0, cols - w), r0 = rng.int(0, rows - h);
        for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if ((c + r) % 2 === 0) add(c0 + c, r0 + r);
        break;
      }
      default: // scatter
        for (let i = 0, n = Math.ceil(count * 1.5); i < n; i++) add(rng.int(0, cols - 1), rng.int(0, rows - 1));
    }

    // Trim to `count` (patterns may overproduce) via a shuffled subset.
    let cells = [...set];
    for (let i = cells.length - 1; i > 0; i--) { const j = rng.int(0, i); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    cells = cells.slice(0, count);

    // Never leave a fully-filled row or column.
    const rc = {}, cc = {};
    for (const k of cells) { const [c, r] = k.split(',').map(Number); rc[r] = (rc[r] ?? 0) + 1; cc[c] = (cc[c] ?? 0) + 1; }
    cells = cells.filter((k) => { const [c, r] = k.split(',').map(Number); return rc[r] < cols && cc[c] < rows; });

    // Paint with random gem materials so it reads as a normal colourful board.
    for (const k of cells) {
      const [c, r] = k.split(',').map(Number);
      const cell = grid.get(c, r);
      if (cell && !cell.filled && !cell.tile) cell.fill(rng.pick(MaterialKeys), 0);
    }
  }
}
