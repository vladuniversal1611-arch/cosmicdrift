/**
 * Objective.js
 * -----------------------------------------------------------------------------
 * A single live objective for the current level: its definition, goal, current
 * progress, and the small animation state that drives its completion + reward
 * flourishes. Pure state; the ObjectivesSystem advances it and the HUD renders
 * it.
 * -----------------------------------------------------------------------------
 */
export class Objective {
  constructor(def, goal) {
    this.def = def;
    this.goal = goal;
    this.progress = 0;
    this.complete = false;

    // Animation channels (seconds / eased values), driven by the system.
    this.displayProgress = 0;   // eased bar fill
    this.completeT = -1;        // completion pop timeline
    this.rewardT = -1;          // reward callout timeline
    this.justProgressed = 0;    // brief pulse on each increment
  }

  get id() { return this.def.id; }
  get icon() { return this.def.icon; }
  get color() { return this.def.color; }
  get ratio() { return this.goal ? Math.min(1, this.progress / this.goal) : 1; }

  /** Human label with the goal filled in. */
  get label() { return this.def.name.replace('{n}', this.goal); }

  /**
   * Apply an event payload. Returns true if THIS call completed the objective.
   * `amount` is how much to add (already resolved by the system).
   */
  advance(amount) {
    if (this.complete || amount <= 0) return false;
    this.progress = Math.min(this.goal, this.progress + amount);
    this.justProgressed = 1;
    if (this.progress >= this.goal) {
      this.complete = true;
      this.completeT = 0;
      this.rewardT = 0;
      return true;
    }
    return false;
  }
}
