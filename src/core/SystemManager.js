/**
 * SystemManager.js
 * -----------------------------------------------------------------------------
 * Registry and orchestrator for all game systems.
 *
 * Systems are registered in a deterministic order. Update order and render
 * order are tracked separately because they differ: e.g. Particles update late
 * but render near the top, while the Board updates early and renders low in the
 * stack. Keeping the ordering here — rather than implicit in call sites — makes
 * the frame pipeline explicit and easy to reason about.
 * -----------------------------------------------------------------------------
 */
import { Logger } from '../utils/Logger.js';

export class SystemManager {
  constructor() {
    /** @type {Map<string, import('./System.js').System>} */
    this._systems = new Map();
    /** Systems in the order they were registered (= update order). */
    this._order = [];
  }

  /**
   * Register a system instance. Registration order defines update order;
   * render order follows the same list unless a system opts out via
   * `renderLayer` conventions handled by the caller.
   */
  register(system) {
    if (this._systems.has(system.name)) {
      throw new Error(`Duplicate system name: "${system.name}"`);
    }
    this._systems.set(system.name, system);
    this._order.push(system);
    Logger.debug('SystemManager', `registered "${system.name}"`);
    return system;
  }

  /** Look up a system by name. Returns undefined if not registered. */
  get(name) { return this._systems.get(name); }

  /** Initialise every system, in registration order. */
  initAll() {
    for (const s of this._order) s.init();
  }

  /** Update every enabled system with the frame delta (seconds). */
  updateAll(dt) {
    for (const s of this._order) {
      if (s.enabled) s.update(dt);
    }
  }

  /** Render every enabled system, in registration order. */
  renderAll(renderer) {
    for (const s of this._order) {
      if (s.enabled) s.render(renderer);
    }
  }

  /** Reset every system to a clean pre-game state (keeps subscriptions). */
  resetAll() {
    for (const s of this._order) s.Reset();
  }

  /** Destroy all systems in reverse order so dependents tear down first. */
  destroyAll() {
    for (let i = this._order.length - 1; i >= 0; i--) {
      this._order[i].destroy();
    }
    this._systems.clear();
    this._order.length = 0;
  }
}
