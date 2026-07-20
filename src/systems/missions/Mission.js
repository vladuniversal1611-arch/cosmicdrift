/**
 * Mission.js
 * -----------------------------------------------------------------------------
 * A single objective with progress toward a goal and a reward. Missions are
 * data-driven: a definition describes what to track, and this instance holds
 * live progress. Progress is advanced by generic game events, so new mission
 * types need only a new definition — not new code paths.
 * -----------------------------------------------------------------------------
 */
export class Mission {
  /**
   * @param {object} def Definition:
   *   { id, title, event, goal, reward:{currencyId,amount}, [match] }
   *   - event: the EventBus event that advances this mission
   *   - goal:  target count to complete
   *   - match: optional predicate(payload) to filter which events count
   */
  constructor(def) {
    this.id = def.id;
    this.title = def.title;
    this.event = def.event;
    this.goal = def.goal;
    this.reward = def.reward;
    this._match = def.match ?? (() => true);

    this.progress = 0;
    this.completed = false;
    this.claimed = false;
  }

  /**
   * Apply an event payload. Returns true if this call completed the mission.
   * `amount` lets an event contribute more than 1 (e.g. clearing 3 lines).
   */
  advance(payload, amount = 1) {
    if (this.completed || !this._match(payload)) return false;
    this.progress = Math.min(this.goal, this.progress + amount);
    if (this.progress >= this.goal) {
      this.completed = true;
      return true;
    }
    return false;
  }

  /** 0..1 completion ratio, for progress bars. */
  get ratio() { return this.goal === 0 ? 1 : this.progress / this.goal; }

  serialize() {
    return { id: this.id, progress: this.progress, completed: this.completed, claimed: this.claimed };
  }

  restore(state) {
    if (!state) return;
    this.progress = state.progress ?? 0;
    this.completed = state.completed ?? false;
    this.claimed = state.claimed ?? false;
  }
}
