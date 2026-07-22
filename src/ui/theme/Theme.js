/**
 * Theme.js
 * -----------------------------------------------------------------------------
 * The central, swappable STYLE-VARIABLE store for the UI. Nothing visual is
 * hard-coded in components — they read structural style values from here, colour
 * tokens from `Palette` / `UITheme.UI`, and art from the `AssetManager`. Swap
 * the theme (`Theme.apply({...})`) or register final art and the whole UI
 * re-skins with no component/gameplay changes.
 *
 * What lives here:
 *   - `frames`  – maps a component style name → the nine-slice asset key + inset
 *                 used for its background. When that art isn't registered, the
 *                 component draws its procedural placeholder instead.
 *   - `radii`, `spacing`, `fonts` – structural tokens (mirror DESIGN_SYSTEM).
 *   - `shadow`, `glow` – elevation levels (see DESIGN_BIBLE §4).
 *
 * Colours intentionally stay in `Palette.js` (already the single colour source
 * and swappable in one place); `Theme.color` re-exposes the common ones so
 * components can pull everything through one facade if they prefer.
 * -----------------------------------------------------------------------------
 */
import { Palette } from '../../config/Palette.js';

const base = {
  /** Component background art: styleName → { key (AssetManager), inset (px) }. */
  frames: {
    button: { key: 'frame:button', inset: 24 },
    'panel.glass': { key: 'frame:panel.glass', inset: 40 },
    chip: { key: 'frame:chip', inset: 20 },
    badge: { key: 'frame:badge', inset: 12 },
    card: { key: 'frame:card', inset: 32 },
  },

  /** Corner radii (px). */
  radii: { xs: 8, s: 16, m: 24, l: 32, xl: 40, pill: 999 },

  /** Spacing scale (px) — mirrors DESIGN_SYSTEM. */
  spacing: { xs: 8, s: 16, m: 24, l: 32, xl: 48, xxl: 64 },

  /** Font stack + role sizes/weights. */
  fonts: {
    family: 'system-ui, sans-serif',
    h1: '900 96px system-ui, sans-serif',
    h2: '900 64px system-ui, sans-serif',
    h3: '800 44px system-ui, sans-serif',
    body: '600 32px system-ui, sans-serif',
    caption: '600 24px system-ui, sans-serif',
    button: '900 44px system-ui, sans-serif',
  },

  /** Elevation levels. */
  shadow: {
    1: { dx: 0, dy: 4, blur: 8, alpha: 0.22 },
    2: { dx: 0, dy: 8, blur: 16, alpha: 0.3 },
    3: { dx: 0, dy: 14, blur: 28, alpha: 0.38 },
    color: Palette.shadow ?? 'rgba(40,74,130,0.35)',
  },
  glow: { 1: { blur: 8, alpha: 0.25 }, 2: { blur: 16, alpha: 0.4 }, 3: { blur: 28, alpha: 0.6 } },

  /** Common colour aliases (colours themselves live in Palette). */
  color: {
    gold: Palette.gold ?? '#ffcf5e',
    accent: Palette.accent,
    ink: Palette.textInverse,
    text: Palette.textPrimary,
    outline: Palette.textOutline,
  },
};

export const Theme = {
  ...base,
  /** Look up a component frame descriptor by style name. */
  frame(name) { return this.frames[name] ?? this.frames.button; },
  /**
   * Re-skin: deep-ish merge overrides over the active theme. Pass a full or
   * partial theme (e.g. new frame keys, radii, fonts) to swap the look.
   */
  apply(overrides = {}) {
    for (const group of Object.keys(overrides)) {
      if (typeof overrides[group] === 'object' && this[group] && typeof this[group] === 'object') {
        Object.assign(this[group], overrides[group]);
      } else {
        this[group] = overrides[group];
      }
    }
    return this;
  },
};
