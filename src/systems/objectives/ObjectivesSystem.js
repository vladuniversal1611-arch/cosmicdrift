/**
 * ObjectivesSystem.js — the Dynamic Objectives System.
 * -----------------------------------------------------------------------------
 * Replaces endless score play: every level gets 1–3 objectives that must all be
 * completed to clear the level. Objectives are event-driven counters built from
 * the modular Objectives catalogue, so variety comes from data, not code.
 *
 * Responsibilities:
 *   • build a fresh, level-appropriate objective set each level (scaling count +
 *     goals with depth, teaching newly-unlocked mechanics first, keeping goals
 *     clear and achievable)
 *   • seed + replenish the tiles an objective needs so it can never soft-lock
 *   • track progress by listening to the single event each objective names
 *   • fire per-objective completion + reward, and 'objectives:allComplete' when
 *     the whole set is done (which the LevelSystem turns into level completion)
 *   • advance the completion/reward animations the HUD renders
 *
 * Events:
 *   listens 'level:changed' + every event named by the active objectives
 *   emits   'objectives:set' ({ objectives })
 *           'objective:progress' ({ objective })
 *           'objective:completed' ({ objective })
 *           'objectives:allComplete' ({})
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Random } from '../../utils/Random.js';
import { Objectives, ObjectiveById, objectiveGoal, objectiveAvailable } from '../../config/Objectives.js';
import { Objective } from './Objective.js';

export class ObjectivesSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'objectives';
    /** @type {Objective[]} the current level's objectives. */
    this.objectives = [];
    this._boundEvents = new Map();  // event name -> unsubscribe (per level)
    this._allDone = false;
  }

  onInit() {
    this.listen('level:changed', (d) => this._build(d));
    // Turn-driven replenish so tile objectives can never soft-lock.
    this.listen('game:piecePlaced', () => this._replenish());
  }

  // --- Building the level's objective set ------------------------------------

  _build({ level, levelInWorld, newMechanic, unlocked, endless, authored }) {
    this._teardownEventBindings();
    this.objectives = [];
    this._allDone = false;

    // Endless mode has no goals — it's pure survival for score.
    if (endless) { this.events.emit('objectives:set', { objectives: this.objectives }); return; }

    // Hand-authored opening: build exactly the specified goals.
    if (authored && authored.length) {
      for (const a of authored) {
        const def = ObjectiveById[a.id];
        if (!def) continue;
        this.objectives.push(new Objective(def, Math.max(1, a.goal)));
        this._bindEvent(def.event);
      }
      for (const obj of this.objectives) this._ensureTilesFor(obj.def, obj.goal);
      this.events.emit('objectives:set', { objectives: this.objectives });
      return;
    }

    const unlockedSet = new Set(unlocked || []);
    const rng = new Random(level * 0x2545f491);

    // How many objectives: grows gently, capped at 3 so it never overwhelms.
    const count = Math.max(1, Math.min(3, 1 + Math.floor((level - 1) / 4)));

    // Candidates available at this depth, de-duplicated by the event they count
    // (so two objectives never advance off the same action).
    const pool = Objectives.filter((d) => objectiveAvailable(d, level, unlockedSet));
    const chosen = [];
    const usedEvents = new Set();

    // Teach a freshly-unlocked mechanic first by forcing its objective in.
    if (newMechanic) {
      const teach = pool.find((d) => d.require === newMechanic.id && !usedEvents.has(d.event));
      if (teach) { chosen.push(teach); usedEvents.add(teach.event); }
    }

    // Fill the rest by weighted random over distinct events.
    const bag = [];
    for (const d of pool) for (let i = 0; i < d.weight; i++) bag.push(d);
    let guard = 0;
    while (chosen.length < count && guard++ < 60 && bag.length) {
      const d = rng.pick(bag);
      if (usedEvents.has(d.event) || chosen.includes(d)) continue;
      chosen.push(d); usedEvents.add(d.event);
    }
    // Guarantee at least one objective (the always-available energy collect).
    if (chosen.length === 0) chosen.push(Objectives[0]);

    for (const def of chosen) {
      const obj = new Objective(def, objectiveGoal(def, level));
      this.objectives.push(obj);
      this._bindEvent(def.event);
    }

    // Seed the tiles these objectives need so they're achievable.
    for (const obj of this.objectives) this._ensureTilesFor(obj.def, obj.goal);

    this.events.emit('objectives:set', { objectives: this.objectives });
  }

  /** Subscribe once per distinct event; the handler fans out to matching objectives. */
  _bindEvent(eventName) {
    if (this._boundEvents.has(eventName)) return;
    const off = this.events.on(eventName, (payload) => this._onEvent(eventName, payload));
    this._boundEvents.set(eventName, off);
  }

  _teardownEventBindings() {
    for (const off of this._boundEvents.values()) off();
    this._boundEvents.clear();
  }

  _onEvent(eventName, payload) {
    if (this._allDone) return;
    let anyChanged = false;
    for (const obj of this.objectives) {
      if (obj.complete || obj.def.event !== eventName) continue;
      if (obj.def.match && !obj.def.match(payload)) continue;
      const amount = obj.def.amount ? obj.def.amount(payload) : (payload?.amount ?? 1);
      const done = obj.advance(amount);
      anyChanged = true;
      this.events.emit('objective:progress', { objective: obj });
      if (done) this._onObjectiveComplete(obj);
    }
    if (anyChanged && !this._allDone && this.objectives.every((o) => o.complete)) {
      this._allDone = true;
      this.game.getSystem('audio')?.play('levelup');
      this.events.emit('objectives:allComplete', {});
    }
  }

  _onObjectiveComplete(obj) {
    this.game.getSystem('audio')?.play('objectiveComplete');
    // Bonus reward for the objective.
    const economy = this.game.getSystem('economy');
    if (obj.def.reward) {
      for (const [k, v] of Object.entries(obj.def.reward)) economy?.credit(k, v);
    }
    this.events.emit('objective:completed', { objective: obj });
  }

  // --- Keeping objectives achievable -----------------------------------------

  /** Seed enough of an objective's required tile that it can be completed. */
  _ensureTilesFor(def, goal) {
    if (!def.require) return;
    const tiles = this.game.getSystem('tiles');
    if (!tiles) return;
    if (def.require === 'portal') { tiles.ensurePortalPair?.(); return; }
    // A small standing pool; consumable/spreading tiles regenerate over play.
    tiles.ensureType?.(def.require, Math.min(3, goal));
  }

  /**
   * If an incomplete tile-objective has no source tiles left on the board,
   * quietly replenish one so progress is always possible (no soft-locks).
   */
  _replenish() {
    const tiles = this.game.getSystem('tiles');
    if (!tiles) return;
    for (const obj of this.objectives) {
      const req = obj.def.require;
      if (obj.complete || !req) continue;
      if (req === 'portal') { if ((tiles.countType?.('portal') ?? 0) < 2) tiles.ensurePortalPair?.(); continue; }
      if ((tiles.countType?.(req) ?? 0) === 0) tiles.ensureType?.(req, 1);
    }
  }

  /** Advance the completion / reward / progress animations the HUD renders. */
  update(dt) {
    for (const o of this.objectives) {
      o.displayProgress += (o.ratio - o.displayProgress) * Math.min(1, dt * 10);
      if (o.justProgressed > 0) o.justProgressed = Math.max(0, o.justProgressed - dt * 3);
      if (o.completeT >= 0) { o.completeT += dt; if (o.completeT > 0.7) o.completeT = 0.7; }
      if (o.rewardT >= 0) { o.rewardT += dt; if (o.rewardT > 1.4) o.rewardT = -1; }
    }
  }

  onDestroy() { this._teardownEventBindings(); }
}
