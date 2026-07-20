/**
 * System.js
 * -----------------------------------------------------------------------------
 * Base class every game system extends (Audio, Board, Economy, Dragon, ...).
 *
 * The uniform lifecycle (init → update/render → destroy) lets the SystemManager
 * treat all systems identically, and the `game` reference gives each system
 * access to shared core services (events, time, renderer) WITHOUT coupling it
 * to sibling systems. Cross-system communication should go through the
 * EventBus; only reach for `game.getSystem()` when a direct query is genuinely
 * required, and never store the reference long-term.
 * -----------------------------------------------------------------------------
 */
export class System {
  /**
   * @param {import('./Game.js').Game} game The root game context.
   */
  constructor(game) {
    if (new.target === System) {
      throw new Error('System is abstract and cannot be instantiated directly.');
    }
    this.game = game;
    /** Unique key used for registration/lookup. Subclasses MUST override. */
    this.name = 'system';
    /** When false the system is skipped by update/render. */
    this.enabled = true;
    /** Guards against double init. */
    this.initialized = false;
    /** Unsubscribe callbacks collected via `listen()`, cleared on destroy. */
    this._subscriptions = [];
  }

  /** Convenience accessors for shared services. */
  get events() { return this.game.events; }
  get time() { return this.game.time; }

  /**
   * One-time setup. Subclasses override `onInit`. Called by the SystemManager
   * after every system is constructed, so it is safe to reference siblings here.
   */
  init() {
    if (this.initialized) return;
    this.onInit();
    this.initialized = true;
  }

  /**
   * Subscribe to an event and auto-track the unsubscribe so `destroy()` can
   * clean it up. Prevents listener leaks when systems are torn down.
   */
  listen(type, handler) {
    this._subscriptions.push(this.events.on(type, handler.bind(this)));
  }

  /** Tear down: unsubscribe everything and release resources. */
  destroy() {
    this._subscriptions.forEach((off) => off());
    this._subscriptions.length = 0;
    this.onDestroy();
    this.initialized = false;
  }

  // --- Overridable lifecycle hooks (no-ops by default) ----------------------
  /** Register listeners, allocate state. */
  onInit() {}
  /** Advance simulation by `dt` seconds. */
  update(/* dt */) {}
  /** Draw using the supplied Renderer. */
  render(/* renderer */) {}
  /** Release resources / detach listeners. */
  onDestroy() {}
}
