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
 *   - hand each level a tile-free board to the TileSystem
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
    this._progress = save.registerSlice('progress', () => ({ level: 1, highest: 1 }));
    this.level = this._progress.level ?? 1;

    this.listen('game:started', ({ mode } = {}) => {
      // Daily Challenge runs on the same score-chasing rails as Endless.
      this._endless = mode === 'endless' || mode === 'daily';
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

  // --- Level lifecycle -------------------------------------------------------

  beginLevel(level) {
    this.level = level;
    this._pending = 0;
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
}
