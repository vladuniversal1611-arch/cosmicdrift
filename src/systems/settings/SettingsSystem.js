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
      langChosen: false,   // true once the player picks a language themselves
    }));

    // First run (no explicit choice yet): open in the device's language if we
    // ship a pack for it. A manual pick later sets `langChosen` and wins forever.
    if (!this._settings.langChosen) {
      const auto = SettingsSystem._detectLanguage(L.languages);
      if (auto && auto !== this._settings.language) {
        this._settings.language = auto;
        this.game.getSystem('save')?.markDirty();
      }
    }

    L.setLanguage(this._settings.language ?? 'en');
    applyQuality(this);
  }

  /**
   * Best-effort match of the browser/device language preferences to an available
   * pack (by primary subtag, e.g. "de-DE" → "de", "pt-BR" → "pt"). Returns null
   * when nothing matches (caller keeps the default).
   */
  static _detectLanguage(available) {
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null;
      const cands = nav ? (nav.languages && nav.languages.length ? nav.languages : [nav.language]) : [];
      for (const c of cands) {
        if (!c) continue;
        const primary = String(c).toLowerCase().split('-')[0];
        if (available.includes(primary)) return primary;
      }
    } catch { /* headless / no navigator → keep default */ }
    return null;
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
    // A manual language pick sticks — never auto-override it on later boots.
    if (key === 'language') { L.setLanguage(value); this._settings.langChosen = true; }
    applyQuality(this);
    this.game.getSystem('save').markDirty();
    this.events.emit('settings:changed', { key, value });
  }

  /** Convenience toggle for boolean settings. */
  toggle(key) { this.set(key, !this._settings[key]); }
}
