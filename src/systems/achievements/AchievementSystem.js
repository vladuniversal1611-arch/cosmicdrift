/**
 * AchievementSystem.js
 * -----------------------------------------------------------------------------
 * Tracks real play stats and unlocks milestone Awards from them. It listens to
 * events the game already emits — it never changes gameplay — accumulates a
 * small set of counters into a persisted `achievements` slice, and celebrates
 * the moment a milestone is crossed.
 *
 * A save loaded mid-progress is reconciled SILENTLY on init (already-earned
 * awards are marked unlocked without a celebration), so only genuinely new
 * unlocks during play fire `achievement:unlocked`.
 *
 * Events:
 *   listens 'level:complete', 'game:linesCleared', 'gameplay:combo',
 *           'structure:completed', 'world:restored', 'game:started'
 *   emits   'achievement:unlocked' ({ def })   — a new award earned
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Achievements } from '../../config/Achievements.js';

export class AchievementSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'achievements';
    this._state = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._state = save.registerSlice('achievements', () => ({
      stats: { levels: 0, lines: 0, bestCombo: 0, structures: 0, restored: 0 },
      unlocked: {},
    }));
    // Back-fill any counter added after this save was first written.
    const def = { levels: 0, lines: 0, bestCombo: 0, structures: 0, restored: 0 };
    for (const k in def) if (this._state.stats[k] == null) this._state.stats[k] = def[k];

    // Silent reconcile: mark anything already earned as unlocked, no celebration.
    this._check(true);

    this.listen('level:complete', () => this._bump('levels', 1));
    this.listen('game:linesCleared', ({ count = 1, amount }) => this._bump('lines', amount ?? count));
    this.listen('gameplay:combo', ({ combo = 0 }) => this._max('bestCombo', combo));
    this.listen('structure:completed', () => this._bump('structures', 1));
    this.listen('world:restored', () => this._bump('restored', 1));
    // Dragon count is derived from level progress; re-check when a level ends.
    this.listen('level:complete', () => this._check(false));
  }

  // --- Counters --------------------------------------------------------------

  _bump(key, by) {
    this._state.stats[key] = (this._state.stats[key] ?? 0) + by;
    this._save();
    this._check(false);
  }

  _max(key, value) {
    if (value <= (this._state.stats[key] ?? 0)) return;
    this._state.stats[key] = value;
    this._save();
    this._check(false);
  }

  /** Live progress toward an achievement (dragons is derived, not a counter). */
  progressOf(def) {
    if (def.stat === 'dragons') {
      return this.game.getSystem('dragon')?.roster().filter((d) => d.unlocked).length ?? 0;
    }
    return this._state.stats[def.stat] ?? 0;
  }

  /**
   * Award any newly-satisfied achievements. When `silent`, unlocks are recorded
   * without celebration (used to reconcile a freshly loaded save).
   */
  _check(silent) {
    let changed = false;
    for (const def of Achievements) {
      if (this._state.unlocked[def.id]) continue;
      if (this.progressOf(def) >= def.goal) {
        this._state.unlocked[def.id] = true;
        changed = true;
        if (!silent) this._celebrate(def);
      }
    }
    if (changed) this._save();
  }

  _celebrate(def) {
    this.events.emit('achievement:unlocked', { def });
    this.events.emit('fx:flash', { color: '#ffe08a', strength: 0.14 });
    this.game.getSystem('audio')?.play('reward');
  }

  // --- Queries the Collection screen reads -----------------------------------

  /** Every achievement with its unlocked flag + live progress, in order. */
  list() {
    return Achievements.map((def) => ({
      ...def,
      unlocked: !!this._state.unlocked[def.id],
      progress: Math.min(this.progressOf(def), def.goal),
    }));
  }

  get unlockedCount() { return Object.values(this._state?.unlocked ?? {}).filter(Boolean).length; }

  _save() { this.game.getSystem('save')?.markDirty(); }
}
