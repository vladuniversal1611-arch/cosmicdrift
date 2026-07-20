/**
 * EventBus.js
 * -----------------------------------------------------------------------------
 * A lightweight publish/subscribe hub.
 *
 * This is the backbone of the "every system is independent" rule: systems talk
 * to each other by emitting and listening for named events rather than holding
 * direct references. The BoardSystem can announce `board:lineCleared` without
 * knowing that the Economy, Missions, Audio and Particle systems are all
 * reacting to it.
 *
 * Event names use a `namespace:action` convention (e.g. 'save:loaded').
 * -----------------------------------------------------------------------------
 */
import { Logger } from '../utils/Logger.js';

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @returns {() => void} An unsubscribe function for easy teardown.
   */
  on(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(handler);
    return () => this.off(type, handler);
  }

  /** Subscribe to an event exactly once. */
  once(type, handler) {
    const wrapper = (payload) => {
      this.off(type, wrapper);
      handler(payload);
    };
    return this.on(type, wrapper);
  }

  /** Remove a specific handler. */
  off(type, handler) {
    this._listeners.get(type)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers. Handlers are wrapped so that one
   * throwing listener cannot break the emit chain for the others.
   */
  emit(type, payload) {
    const handlers = this._listeners.get(type);
    if (!handlers || handlers.size === 0) return;
    // Iterate a copy so handlers may safely unsubscribe during dispatch.
    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (err) {
        Logger.error('EventBus', `handler for "${type}" threw`, err);
      }
    }
  }

  /** Remove every listener. Called during full teardown. */
  clear() {
    this._listeners.clear();
  }
}
