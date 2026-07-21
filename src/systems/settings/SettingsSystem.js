/**
 * SettingsSystem.js
 * -----------------------------------------------------------------------------
 * Player-facing preferences: separate audio volumes, haptics/vibration, plus
 * the full accessibility suite (reduced motion, colour-blind mode, low
 * performance mode, large UI, animation intensity) and language.
 *
 * Settings are a persistent save slice. Changing one emits a granular
 * `settings:changed` event AND re-derives the runtime Quality flags (glow,
 * particle cap, motion, UI scale, colour-blind) that the renderer/particles/
 * crystals read — so accessibility toggles take effect instantly everywhere.
 *
 * Events:
 *   emits  'settings:changed' ({ key, value })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { applyQuality } from '../../config/Quality.js';
import { L } from '../../i18n/Localization.js';

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
      // Audio (separate buses).
      musicVolume: 0.7,
      sfxVolume: 0.9,
      muted: false,
      // Haptics / vibration.
      haptics: true,
      // Accessibility.
      reducedMotion: false,
      animationIntensity: 1,
      colorBlind: false,
      lowPerformance: false,
      largeUI: false,
      // Presentation / locale.
      theme: 'deepspace',
      language: 'en',
    }));

    L.setLanguage(this._settings.language ?? 'en');
    applyQuality(this);
  }

  /** Read a single setting. */
  get(key) { return this._settings[key]; }

  /** Read the whole (read-only intent) settings object. */
  all() { return this._settings; }

  /**
   * Update a setting, persist it, refresh runtime quality, and notify. No-ops
   * if unchanged.
   */
  set(key, value) {
    if (this._settings[key] === value) return;
    this._settings[key] = value;
    if (key === 'language') L.setLanguage(value);
    applyQuality(this);
    this.game.getSystem('save').markDirty();
    this.events.emit('settings:changed', { key, value });
  }

  /** Convenience toggle for boolean settings. */
  toggle(key) { this.set(key, !this._settings[key]); }
}
