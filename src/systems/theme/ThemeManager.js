/**
 * ThemeManager.js
 * -----------------------------------------------------------------------------
 * Single owner of the *active visual theme*. The `Theme` module holds the style
 * tokens and knows how to merge overrides; this manager decides WHICH theme is
 * active, applies it through that module, coordinates the matching asset base
 * path on the AssetManager, and announces changes so screens can refresh. It
 * keeps zero art and zero component knowledge — it only flips a named theme.
 *
 * Responsibility: theme selection + application. Components keep reading tokens
 * from `Theme`; art keeps resolving through `AssetManager`. No duplication.
 *
 * Events:
 *   listens 'theme:set' ({ name })      switch the active theme by name
 *   emits   'theme:changed' ({ name })  after a successful switch
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Theme } from '../../ui/theme/Theme.js';
import { AssetManager } from '../../ui/assets/AssetManager.js';

/**
 * Registered themes: name → { assets (base path), overrides (Theme tokens) }.
 * The default 'classic' theme keeps the authored tokens and the default asset
 * folder. New themes register here (or via `register`) and swap with one event.
 */
const THEMES = {
  classic: { assets: 'assets/', overrides: null },
};

export class ThemeManager extends System {
  constructor(game) {
    super(game);
    this.name = 'theme';
    this._themes = { ...THEMES };
    this._active = 'classic';
    this._defaults = null;   // snapshot of the token groups we may override
  }

  onInit() {
    // Snapshot the mergeable token groups once so we can restore on re-apply.
    this._defaults = JSON.parse(JSON.stringify({
      frames: Theme.frames, radii: Theme.radii, spacing: Theme.spacing,
      fonts: Theme.fonts, shadow: Theme.shadow, glow: Theme.glow, color: Theme.color,
    }));
    this.listen('theme:set', ({ name }) => this.set(name));
  }

  onReset() { this.set('classic'); }

  /** Register a theme definition for later activation. */
  register(name, def) { this._themes[name] = def; return this; }

  get active() { return this._active; }

  /** Activate a registered theme: restore defaults, apply overrides, swap art. */
  set(name) {
    const def = this._themes[name];
    if (!def || name === this._active) return;
    // Restore authored defaults first so themes don't stack.
    Theme.apply(this._defaults);
    if (def.overrides) Theme.apply(def.overrides);
    if (def.assets) AssetManager.setBasePath(def.assets);
    this._active = name;
    this.events.emit('theme:changed', { name });
  }
}
