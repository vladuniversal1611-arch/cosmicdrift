/**
 * EventsSystem.js
 * -----------------------------------------------------------------------------
 * Manages time-limited "live events" (seasonal themes, weekend challenges,
 * limited shop offers). It resolves which events are currently active based on
 * a schedule and broadcasts activation/deactivation so other systems (World,
 * Shop, Missions) can respond — e.g. the World swaps to a festive zone.
 *
 * Foundation scope: the schedule model, an active-window check driven by the
 * game clock, and activation events. Remote/config-driven schedules and reward
 * tracks come later; the seam is `load(schedule)`.
 *
 * Naming note: this is the live-ops "Events" feature and is distinct from the
 * low-level EventBus used for in-process messaging.
 *
 * Events:
 *   emits 'liveEvent:started' ({ event })
 *         'liveEvent:ended'   ({ event })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Logger } from '../../utils/Logger.js';

/** Example schedule. Real schedules will be data/remote-driven. */
const DEFAULT_SCHEDULE = [
  // { id, name, zoneId, startsAt (ms epoch), endsAt (ms epoch) }
];

export class EventsSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'events'; // live-ops events (see class note)
    this._schedule = [];
    this._active = new Set();
    this._checkTimer = 0;
  }

  onInit() {
    this.load(DEFAULT_SCHEDULE);
  }

  /** Install a schedule and immediately evaluate the current window. */
  load(schedule) {
    this._schedule = Array.isArray(schedule) ? schedule.slice() : [];
    this._active.clear();
    this._evaluate(Date.now());
  }

  /** True if a given live event id is currently running. */
  isActive(eventId) { return this._active.has(eventId); }

  update(dt) {
    // Re-evaluate the schedule roughly once a minute — events change on the
    // scale of hours, so this keeps per-frame cost effectively nil.
    this._checkTimer -= dt;
    if (this._checkTimer <= 0) {
      this._checkTimer = 60;
      this._evaluate(Date.now());
    }
  }

  /** Diff the schedule against `now` and fire start/end transitions. */
  _evaluate(now) {
    for (const ev of this._schedule) {
      const live = now >= ev.startsAt && now < ev.endsAt;
      const wasLive = this._active.has(ev.id);
      if (live && !wasLive) {
        this._active.add(ev.id);
        Logger.info('EventsSystem', `live event started: ${ev.id}`);
        this.events.emit('liveEvent:started', { event: ev });
      } else if (!live && wasLive) {
        this._active.delete(ev.id);
        Logger.info('EventsSystem', `live event ended: ${ev.id}`);
        this.events.emit('liveEvent:ended', { event: ev });
      }
    }
  }
}
