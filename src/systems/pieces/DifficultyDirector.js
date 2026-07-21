/**
 * DifficultyDirector.js
 * -----------------------------------------------------------------------------
 * The invisible hand behind the piece generator's dynamic difficulty. It tracks
 * how the player is doing and produces two numbers the generator consumes:
 *   - a level-based difficulty curve, and
 *   - a `generosity` offset that rises when the player struggles (so pieces get
 *     kinder) and falls when they cruise (so the challenge creeps up).
 *
 * The goal is the feeling "I almost had it", never "the game cheated": we only
 * ever nudge, within clamped bounds, and it's fully persisted so the game
 * remembers a player across sessions. Nothing here is surfaced to the UI.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../../config/Config.js';
import { clamp } from '../../utils/MathUtils.js';

export class DifficultyDirector {
  constructor(game) {
    this.game = game;
    this._state = null;
  }

  init() {
    const save = this.game.getSystem('save');
    // generosity: +easier / -harder. streak: + winning / - losing.
    this._state = save?.registerSlice('dda', () => ({ generosity: 0, streak: 0, losses: 0, wins: 0 }))
      ?? { generosity: 0, streak: 0, losses: 0, wins: 0 };
  }

  get generosity() { return this._state.generosity; }

  /** Raw difficulty for a level, before player adjustment. */
  difficultyFor(level) {
    const d = Config.generator.difficulty;
    return clamp(d.base + d.perLevel * level, d.base, d.max);
  }

  /**
   * The target shape "hardness" (0..1) the generator should aim for: the level
   * curve, eased down when the player has earned some generosity and nudged up
   * when they've been winning comfortably.
   */
  targetHardness(level) {
    const g = this._state.generosity;
    const ease = g > 0 ? g * 0.35 : g * 0.15; // struggling relief > cruising bump
    return clamp(this.difficultyFor(level) - ease, 0.02, 0.95);
  }

  /** A player lost — become more generous (faster on a losing streak). */
  recordLoss() {
    const d = Config.generator.dda;
    this._state.losses++;
    this._state.streak = Math.min(0, this._state.streak) - 1;
    const ramp = 1 + Math.min(3, -this._state.streak - 1) * 0.3;
    this._state.generosity = clamp(this._state.generosity + d.lossGenerosity * ramp, d.min, d.max);
    this._persist();
  }

  /** A level was cleared — drift slightly toward more challenge. */
  recordWin() {
    const d = Config.generator.dda;
    this._state.wins++;
    this._state.streak = Math.max(0, this._state.streak) + 1;
    const ramp = 1 + Math.min(4, this._state.streak - 1) * 0.2;
    this._state.generosity = clamp(this._state.generosity + d.winGenerosity * ramp, d.min, d.max);
    this._persist();
  }

  _persist() { this.game.getSystem('save')?.markDirty(); }
}
