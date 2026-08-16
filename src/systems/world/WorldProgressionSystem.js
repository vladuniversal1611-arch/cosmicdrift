/**
 * WorldProgressionSystem.js
 * -----------------------------------------------------------------------------
 * The long-term meta layer: completing levels rewards resources that the player
 * spends to restore a magical floating world, and climbing levels opens new
 * biomes. This is the "visible progress" engine — it owns none of the map's
 * rendering (that's WorldMapScreen); it owns the STATE and the RULES:
 *
 *   • grants Magic Essence + Gold + Building Materials + Dragon Energy per level
 *   • unlocks the next restoration task every N levels (Config.progression)
 *   • advances a restoration through its visual stages when the player pays,
 *     firing stage / completion events the map turns into cinematics
 *   • tracks the active biome and announces changes so the WorldSystem reskins
 *     the world and the AudioSystem swaps music
 *
 * All content (biomes, restorations) lives in data registries, so the system
 * scales to thousands of levels without code changes. Fully persisted.
 *
 * Events:
 *   listens 'level:changed' ({ level }), 'level:complete' ({ level })
 *   emits   'reward:granted' ({ level, essence, gold, materials, energy })
 *           'world:taskUnlocked' ({ task })
 *           'world:stageAdvanced' ({ task, stage })
 *           'world:restored' ({ task })         (final stage completed)
 *           'biome:changed' ({ biome })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Biomes, biomeForLevel } from '../../config/Biomes.js';
import { Restorations, RestorationById, unlockedCountForLevel } from '../../config/Restorations.js';

export class WorldProgressionSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'worldprogress';
    this._state = null;
    this._level = 1;
    this._lastBiome = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    // stages[id] = completed stage count; complete[id] = bool; maxLevel drives unlocks.
    this._state = save.registerSlice('world', () => ({ stages: {}, complete: {}, maxLevel: 1, biome: 'forest' }));

    this.listen('level:changed', ({ level }) => this._onLevelChanged(level));
    this.listen('level:complete', ({ level }) => this._onLevelComplete(level));
  }

  // --- Reactions -------------------------------------------------------------

  _onLevelChanged(level) {
    this._level = level;
    this._state.maxLevel = Math.max(this._state.maxLevel ?? 1, level);
    this._syncBiome(level);
  }

  _onLevelComplete(level) {
    this._grantRewards(level);
    this._state.maxLevel = Math.max(this._state.maxLevel ?? 1, level);

    // Unlock the next restoration on the cadence.
    if (level % Config.progression.restorationEvery === 0) {
      const idx = (level / Config.progression.restorationEvery) - 1;
      const task = Restorations[idx];
      if (task) this.events.emit('world:taskUnlocked', { task });
    }
    this.game.getSystem('save')?.markDirty();
  }

  _grantRewards(level) {
    // One soft currency: a single Coin reward that scales with depth.
    const gold = Math.round(16 + 2 * level);

    const economy = this.game.getSystem('economy');
    economy?.credit('gold', gold);

    // Every third cleared level also hands out a free booster, rotating through
    // the set — a steady, earn-by-playing supply that never needs the shop.
    let booster = null;
    if (level % 3 === 0) {
      const kinds = ['hammer', 'bomb', 'shuffle'];
      const id = kinds[Math.floor(level / 3) % kinds.length];
      this.game.getSystem('booster')?.grant(id, 1);
      booster = { id, n: 1 };
    }

    this.game.getSystem('audio')?.play('reward');
    this.events.emit('reward:granted', { level, gold, booster });
  }

  _syncBiome(level) {
    const biome = biomeForLevel(level);
    if (biome.id === this._lastBiome) return;
    this._lastBiome = biome.id;
    this._state.biome = biome.id;
    this.game.getSystem('save')?.markDirty();
    this.game.getSystem('audio')?.play('biome');
    this.events.emit('biome:changed', { biome });
  }

  // --- Restoration queries + actions (used by the World Map) -----------------

  /** True if task index `i` is unlocked at the player's furthest level. */
  isUnlocked(taskId) {
    const idx = Restorations.findIndex((t) => t.id === taskId);
    return idx >= 0 && idx < unlockedCountForLevel(this._state.maxLevel);
  }

  /**
   * Snapshot of a task's progress for the UI. `stage` is the current 0-based
   * visual stage (0 = broken); the last stage (stages.length-1) IS the fully
   * restored state, so `maxStage` is that final index and `complete` is reached
   * when stage lands on it.
   */
  taskState(taskId) {
    const def = RestorationById[taskId];
    if (!def) return null;
    const finalStage = def.stages.length - 1;
    const stage = Math.min(this._state.stages[taskId] ?? 0, finalStage);
    const complete = !!this._state.complete[taskId] || stage >= finalStage;
    return {
      def,
      stage,
      maxStage: finalStage,
      complete,
      unlocked: this.isUnlocked(taskId),
      cost: this.stageCost(def, stage),
    };
  }

  /** All tasks (locked ones included) with their live state, in order. */
  allTasks() { return Restorations.map((t) => this.taskState(t.id)); }
  /** Only the tasks the player has unlocked so far. */
  unlockedTasks() { return this.allTasks().filter((t) => t.unlocked); }

  /** Cost to advance from `stage` to the next (scales up with each stage). */
  stageCost(def, stage) {
    const mult = 1 + stage * 0.6;
    const out = {};
    for (const [k, v] of Object.entries(def.cost)) out[k] = Math.round(v * mult);
    return out;
  }

  /** Can the player afford + is it valid to advance this task now? */
  canRestore(taskId) {
    const s = this.taskState(taskId);
    if (!s || !s.unlocked || s.complete) return false;
    const economy = this.game.getSystem('economy');
    return Object.entries(s.cost).every(([k, v]) => economy?.canAfford(k, v));
  }

  /**
   * Spend the stage cost and advance the restoration by one stage. Returns
   * true on success. Emits stage / restored events the map animates.
   */
  restore(taskId) {
    if (!this.canRestore(taskId)) return false;
    const s = this.taskState(taskId);
    const economy = this.game.getSystem('economy');
    for (const [k, v] of Object.entries(s.cost)) economy.spend(k, v);

    const stage = (this._state.stages[taskId] ?? 0) + 1;
    this._state.stages[taskId] = stage;
    const done = stage >= s.maxStage;
    if (done) this._state.complete[taskId] = true;
    this.game.getSystem('save')?.markDirty();

    if (done) {
      this.game.getSystem('audio')?.play('restore');
      this.events.emit('world:restored', { task: s.def });
    } else {
      this.game.getSystem('audio')?.play('restoreStage');
      this.events.emit('world:stageAdvanced', { task: s.def, stage });
    }
    return true;
  }

  // --- Biome accessors -------------------------------------------------------
  get biome() { return biomeForLevel(this._level); }
  /** Count of fully restored landmarks (drives extra world ambience). */
  get restoredCount() { return Object.values(this._state.complete).filter(Boolean).length; }
}
