/**
 * SettingsSystem.js
 * -----------------------------------------------------------------------------
 * Player-facing preferences (audio volumes, haptics, reduced motion, theme).
 *
 * Settings are a persistent save slice. When a value changes the system emits a
 * granular `settings:changed` event so interested systems (Audio, Animation)
 * react without polling. Reduced-motion is surfaced because premium games must
 * respect accessibility preferences.
 *
 * Events:
 *   emits  'settings:changed' ({ key, value })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';

export class SettingsSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'settings';
    this._settings = null;
  }

  onInit() {
    const save = this.game.getSystem('save');
    // Declare defaults; SaveSystem returns persisted values if they exist.
    this._settings = save.registerSlice('settings', () => ({
      musicVolume: 0.7,
      sfxVolume: 0.9,
      muted: false,
      haptics: true,
      reducedMotion: false,
      theme: 'deepspace',
    }));
  }

  /** Read a single setting. */
  get(key) { return this._settings[key]; }

  /** Read the whole (read-only intent) settings object. */
  all() { return this._settings; }

  /**
   * Update a setting, persist it, and notify listeners. No-ops if unchanged.
   */
  set(key, value) {
    if (this._settings[key] === value) return;
    this._settings[key] = value;
    this.game.getSystem('save').markDirty();
    this.events.emit('settings:changed', { key, value });
  }

  /** Convenience toggle for boolean settings. */
  toggle(key) { this.set(key, !this._settings[key]); }
}
