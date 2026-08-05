/**
 * LevelSystem.js
 * -----------------------------------------------------------------------------
 * Drives progression across hundreds of levels grouped into themed worlds.
 * Each world introduces one new Living Board mechanic, so the player keeps
 * discovering fresh gameplay instead of repeating one puzzle forever. Early
 * levels are deliberately sparse; density and variety grow with depth.
 *
 * Responsibilities:
 *   - track the current level / world / goal (persisted so runs continue)
 *   - generate each level's tile layout (which mechanics, how many, where) and
 *     hand it to the TileSystem, biasing brand-new worlds toward teaching their
 *     new tile before mixing older ones back in
 *   - count cleared lines toward the level goal and advance when it's met
 *     (after the clear animation finishes, so it never cuts a clear short)
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
import { Random } from '../../utils/Random.js';
import { clamp } from '../../utils/MathUtils.js';
import { TileRegistry } from '../tiles/TileRegistry.js';
import { AuthoredLevels } from '../../config/AuthoredLevels.js';

/**
 * The world table. `mech` is the tile mechanic introduced by that world (null
 * for the tutorial world of pure placement). Order defines the unlock schedule.
 */
const WORLDS = [
  { name: 'Stoneplain', mech: null },
  { name: 'Mosswood', mech: 'moss' },
  { name: 'Crystal Caverns', mech: 'crystal' },
  { name: 'Frostreach', mech: 'frozen' },
  { name: 'The Blight', mech: 'corrupted' },
  { name: 'Portal Rifts', mech: 'portal' },
  { name: 'Dragon Spire', mech: 'dragonrune' },
  { name: 'Treasure Vaults', mech: 'treasure' },
  { name: 'Elderwood', mech: 'ancienttree' },
  { name: 'Mistlands', mech: 'fog' },
];

/** Safety caps so a level never becomes unfair or unplayable. */
const CAPS = { ancienttree: 2, corrupted: 3, frozen: 4, fog: 5, portal: 4, crystal: 4, dragonrune: 4, treasure: 2, moss: 10 };

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
    this._progress = save.registerSlice('progress', () => ({ level: 1, highest: 1 }));
    this.level = this._progress.level ?? 1;

    this.listen('game:started', ({ mode } = {}) => {
      this._endless = mode === 'endless';
      if (this._endless) this.beginEndless();
      else this.beginLevel(this.level);
    });
    // A level is now cleared when its OBJECTIVES are all met (not a score goal).
    this.listen('objectives:allComplete', () => { if (!this._endless) this._completeLevel(); });
    this.listen('board:clearComplete', () => this._maybeAdvance());
    // Endless difficulty ramp: the longer you survive, the harder the hands get.
    this.listen('game:linesCleared', ({ count = 1 }) => { if (this._endless) this._rampEndless(count); });
  }

  /** Furthest level the player has reached (drives the World Map unlock line). */
  get highest() { return Math.max(this.level, this._progress?.highest ?? 1); }

  // --- World / goal maths ----------------------------------------------------
  get worldIndex() { return Math.floor((this.level - 1) / Config.progression.levelsPerWorld); }
  get levelInWorld() { return (this.level - 1) % Config.progression.levelsPerWorld; }
  /** Capped index used for naming + goal once past the last defined world. */
  get namedWorld() { return Math.min(this.worldIndex, WORLDS.length - 1); }

  /** Set of mechanic ids unlocked at the current depth. */
  unlockedMechanics() {
    const set = new Set();
    for (let i = 0; i <= Math.min(this.worldIndex, WORLDS.length - 1); i++) {
      if (WORLDS[i].mech) set.add(WORLDS[i].mech);
    }
    return set;
  }

  // --- Level lifecycle -------------------------------------------------------

  beginLevel(level) {
    this.level = level;
    this._pending = 0;
    const world = this.namedWorld;

    const unlocked = this.unlockedMechanics();
    // The hand-authored opening overrides layout/objectives/drift for its range.
    const authored = AuthoredLevels[level] ?? null;
    const placements = authored?.tiles ?? this._generateLayout(unlocked);
    this.game.getSystem('tiles').buildLevel(placements, unlocked, level * 2654435761);

    // A discovery callout only on the first level of a world that adds a mechanic.
    const mech = WORLDS[world].mech;
    const isNew = this.levelInWorld === 0 && mech;
    const newMechanic = isNew
      ? { id: mech, label: TileRegistry[mech].label, blurb: TileRegistry[mech].blurb }
      : null;

    // The ObjectivesSystem builds this level's goals from `unlocked` + level,
    // unless the authored opening supplies an explicit objective set.
    this.events.emit('level:changed', {
      level: this.level,
      world: world + 1,
      worldName: WORLDS[world].name,
      levelInWorld: this.levelInWorld,
      newMechanic,
      unlocked: [...unlocked],
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
    this._endlessLevel = 8;     // starting piece-difficulty target
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
    const LINES_PER_TIER = 6, STEP = 4, CAP = 60;
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
    this.events.emit('level:complete', { level: this.level });
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
    this._progress.level = next;
    this._progress.highest = Math.max(this._progress.highest ?? 1, next);
    this.game.getSystem('save')?.markDirty();
    this.beginLevel(next);
  }

  // --- Layout generation -----------------------------------------------------

  /**
   * Produce a list of { type, col, row } tile placements for the current level.
   * The tutorial world places nothing; later worlds scale count with depth and
   * teach their newest mechanic first before reintroducing older ones.
   */
  _generateLayout(unlocked) {
    if (unlocked.size === 0) return [];       // World 1: pure placement.

    const grid = this.game.getSystem('board').grid;
    const rng = new Random(this.level * 0x9e3779b1);
    const world = this.namedWorld;
    const newMech = WORLDS[world].mech;
    const teaching = this.levelInWorld <= 1;  // bias the first two levels of a world

    // How many special tiles this level wants — grows slowly, hard-capped.
    const target = clamp(2 + this.levelInWorld + Math.floor(this.worldIndex * 0.75),
      1, Config.progression.maxSpecialTiles);

    // Weighted mechanic pool.
    const pool = [];
    for (const m of unlocked) {
      let w = 1;
      if (teaching && m === newMech) w = 6;   // teach the new mechanic first
      else if (m === newMech) w = 2;
      for (let i = 0; i < w; i++) pool.push(m);
    }

    // Collect distinct free cells to place onto.
    const free = [];
    grid.forEach((cell) => { if (!cell.tile && !cell.filled) free.push(cell); });
    for (let i = free.length - 1; i > 0; i--) {        // shuffle
      const j = rng.int(0, i);[free[i], free[j]] = [free[j], free[i]];
    }

    const counts = {};
    const placements = [];
    let fi = 0;
    const take = (type) => {
      if (fi >= free.length) return false;
      if ((counts[type] ?? 0) >= (CAPS[type] ?? 99)) return false;
      const cell = free[fi++];
      counts[type] = (counts[type] ?? 0) + 1;
      placements.push({ type, col: cell.col, row: cell.row });
      return true;
    };

    let placed = 0;
    let guard = 0;
    while (placed < target && guard++ < target * 6) {
      const type = rng.pick(pool);
      if (type === 'portal') {
        // Portals only make sense in pairs.
        if ((counts.portal ?? 0) + 2 > (CAPS.portal ?? 99)) continue;
        if (take('portal') && take('portal')) placed += 2;
      } else if (take(type)) {
        placed += 1;
      }
    }

    // Guarantee the new mechanic actually appears while it's being taught.
    if (teaching && newMech && !(counts[newMech] > 0)) {
      if (newMech === 'portal') { take('portal'); take('portal'); }
      else take(newMech);
    }
    return placements;
  }
}
