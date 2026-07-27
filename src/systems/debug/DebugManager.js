/**
 * DebugManager.js
 * -----------------------------------------------------------------------------
 * Single owner of developer-facing debug switches. It does NOT scatter `if
 * (Config.debug.*)` checks across the codebase — instead it holds the live
 * debug flags, flips them in response to `debug:toggle` events, and re-publishes
 * the current state on `debug:state` so any interested system (or the Game's FPS
 * readout) can react. Disabled entirely outside the 'dev'/'beta' channels.
 *
 * Responsibility: debug flag ownership + toggling. It never renders gameplay and
 * never mutates another manager.
 *
 * Events:
 *   listens 'debug:toggle' ({ flag })     flip a single flag by name
 *   emits   'debug:state'  ({ ...flags }) whenever a flag changes
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Logger } from '../../utils/Logger.js';

export class DebugManager extends System {
  constructor(game) {
    super(game);
    this.name = 'debug';
    // Live copy of the authoring defaults (Config is frozen).
    this.flags = {
      showFps: Config.debug.showFps,
      drawGridOutlines: Config.debug.drawGridOutlines,
      logLevel: Config.debug.logLevel,
    };
    this._active = Config.meta.channel !== 'prod';
  }

  onInit() {
    if (!this._active) { this.enabled = false; return; }
    this.listen('debug:toggle', ({ flag }) => this.toggle(flag));
    this.events.emit('debug:state', { ...this.flags });
  }

  onReset() { /* flags persist across a game reset by design */ }

  /** Flip a boolean flag by name and re-broadcast the full state. */
  toggle(flag) {
    if (!(flag in this.flags)) return;
    if (typeof this.flags[flag] === 'boolean') this.flags[flag] = !this.flags[flag];
    Logger.debug('DebugManager', `${flag} = ${this.flags[flag]}`);
    this.events.emit('debug:state', { ...this.flags });
  }

  /** Read a flag (used by the Game FPS readout / grid overlay). */
  get(flag) { return this.flags[flag]; }
}
