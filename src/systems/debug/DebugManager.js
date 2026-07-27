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
      showBounds: false,
      logLevel: Config.debug.logLevel,
    };
    this._active = Config.meta.channel !== 'prod';
    this._themes = ['classic'];
    this._themeIdx = 0;
    this._onKey = (e) => this._handleKey(e);
  }

  onInit() {
    if (!this._active) { this.enabled = false; return; }
    this.listen('debug:toggle', ({ flag }) => this.toggle(flag));
    // Developer-mode actions (also reachable from the keyboard, below).
    this.listen('debug:action', ({ action, arg }) => this.action(action, arg));
    if (typeof window !== 'undefined') window.addEventListener('keydown', this._onKey);
    this.events.emit('debug:state', { ...this.flags });
  }

  onReset() { /* flags persist across a game reset by design */ }

  onDestroy() { if (typeof window !== 'undefined') window.removeEventListener('keydown', this._onKey); }

  /**
   * Keyboard developer console (dev/beta only). Keys map to the capabilities the
   * spec requires so a developer can exercise the UI without a build.
   */
  _handleKey(e) {
    switch (e.key.toLowerCase()) {
      case 'f': this.toggle('showFps'); break;
      case 'b': this.toggle('showBounds'); break;
      case 'n': this.action('simulateNotification'); break;
      case 'r': this.action('addResources'); break;
      case 'p': this.action('openPopup', 'news'); break;
      case 't': this.action('switchTheme'); break;
      case 'u': this.action('unlockAll'); break;
      default: return;
    }
  }

  /** Run a developer capability. All are safe no-ops in production. */
  action(action, arg) {
    switch (action) {
      case 'simulateNotification':
        this.events.emit('notify:push', { text: 'Debug notification', priority: 9, color: '#7ed957' });
        break;
      case 'addResources': {
        const eco = this.game.getSystem('economy');
        if (eco) { eco.credit('gold', 1000); eco.credit('crystal', 100); eco.credit('stardust', 50); }
        this.events.emit('notify:push', { text: '+1000 coins · +100 gems', priority: 8 });
        break;
      }
      case 'openPopup': this.events.emit('popup:open', { id: arg || 'news', priority: 9 }); break;
      case 'switchTheme': {
        this._themeIdx = (this._themeIdx + 1) % this._themes.length;
        this.events.emit('theme:set', { name: this._themes[this._themeIdx] });
        break;
      }
      case 'unlockAll': this.events.emit('debug:unlockAll'); this.events.emit('notify:push', { text: 'All content unlocked', priority: 8 }); break;
      default: Logger.debug('DebugManager', `unknown action "${action}"`);
    }
  }

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
