/**
 * MissionSystem.js
 * -----------------------------------------------------------------------------
 * Tracks daily/quest objectives. It subscribes to the events named in each
 * mission definition and advances progress generically, so gameplay systems
 * only need to emit descriptive events (e.g. 'game:linesCleared') — they never
 * know missions exist. Completed rewards are paid via the EconomySystem.
 *
 * Foundation scope: the tracking engine, persistence and a couple of example
 * definitions. The daily-rotation scheduler is a later concern; the seam is the
 * `load(definitions)` method.
 *
 * Events:
 *   listens 'save:loaded' and each mission's own trigger event
 *   emits   'mission:completed' ({ mission })
 *            'mission:claimed'   ({ mission })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Mission } from './Mission.js';

/** Example definitions. Real content will be data/remote-driven later. */
const DEFAULT_DEFINITIONS = [
  { id: 'place_pieces', title: 'Place 20 pieces', event: 'game:piecePlaced', goal: 20,
    reward: { currencyId: 'stardust', amount: 50 } },
  { id: 'clear_lines', title: 'Clear 10 lines', event: 'game:linesCleared', goal: 10,
    reward: { currencyId: 'stardust', amount: 80 } },
  { id: 'feed_dragon', title: 'Level the dragon once', event: 'dragon:levelUp', goal: 1,
    reward: { currencyId: 'crystal', amount: 1 } },
];

export class MissionSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'missions';
    /** @type {Mission[]} */
    this.missions = [];
    /** Active event->missions index so dispatch is O(matching missions). */
    this._byEvent = new Map();
  }

  onInit() {
    this.listen('save:loaded', ({ data }) => this._loadFrom(data));
    this.load(DEFAULT_DEFINITIONS);
  }

  /** Build mission instances from definitions and wire their triggers. */
  load(definitions) {
    // Detach previous trigger subscriptions before rebuilding.
    this._byEvent.clear();
    this.missions = definitions.map((def) => new Mission(def));

    const saved = this.game.getSystem('save').getSlice('missions');
    this.missions.forEach((m) => {
      m.restore(saved?.[m.id]);
      if (!this._byEvent.has(m.event)) {
        this._byEvent.set(m.event, []);
        // One listener per distinct trigger event.
        this.listen(m.event, (payload) => this._onTrigger(m.event, payload));
      }
      this._byEvent.get(m.event).push(m);
    });
  }

  _onTrigger(eventName, payload) {
    const amount = payload?.amount ?? 1;
    let changed = false;
    for (const mission of this._byEvent.get(eventName) ?? []) {
      if (mission.advance(payload, amount)) {
        this.events.emit('mission:completed', { mission });
      }
      changed = true;
    }
    if (changed) this._persist();
  }

  /** Claim a completed mission's reward. Returns true on success. */
  claim(missionId) {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return false;
    this.game.getSystem('economy')
      ?.credit(mission.reward.currencyId, mission.reward.amount);
    mission.claimed = true;
    this._persist();
    this.events.emit('mission:claimed', { mission });
    return true;
  }

  _loadFrom() {
    // Missions restore lazily inside load(); this hook exists for symmetry and
    // future save-driven mission rotation.
  }

  _persist() {
    const save = this.game.getSystem('save');
    const slice = save.registerSlice('missions', () => ({}));
    for (const m of this.missions) slice[m.id] = m.serialize();
    save.markDirty();
  }
}
