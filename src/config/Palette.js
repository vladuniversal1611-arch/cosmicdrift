/**
 * Palette.js
 * -----------------------------------------------------------------------------
 * Centralised colour + theme tokens for Cosmic Drift.
 *
 * Keeping colours here (rather than inline in draw calls) means the entire
 * game can be re-skinned — or given seasonal / event themes — by swapping a
 * single object. The board, crystals, particles and UI all read from tokens.
 * -----------------------------------------------------------------------------
 */

export const Palette = Object.freeze({
  /** Background gradient stops, top -> bottom. */
  background: Object.freeze(['#05010f', '#0a0524', '#04010c']),

  /** Neutral surfaces (panels, cards). */
  surface: '#0e0a24',
  surfaceRaised: '#171235',
  surfaceStroke: 'rgba(120,110,220,0.25)',

  /** Text ramp. */
  textPrimary: '#eaf0ff',
  textMuted: '#8b8bc0',
  textInverse: '#0a0518',

  /** Brand accents used for highlights, glows and CTAs. */
  accent: '#7c5cff',
  accentAlt: '#28e0d0',
  warning: '#ffb020',
  danger: '#ff4d6d',
  success: '#38e08a',

  /**
   * The stone board — an ancient magical artifact. Each token is a stop in a
   * lighting model (top-lit bevel over a dark carved slab).
   */
  stone: Object.freeze({
    frameTop: '#332b47',
    frameBottom: '#100d1a',
    bevelLight: '#4a4066',
    bevelDark: '#080610',
    inlay: '#1a1526',
  }),

  /**
   * Engraved empty cell "sockets" — carved holes in the stone that feel alive.
   */
  socket: Object.freeze({
    rim: '#2a2440',
    faceTop: '#151122',
    faceBottom: '#0c0a15',
    innerGlow: 'rgba(124,92,255,0.10)',
  }),

  /** Rune engravings etched into stone and cells. */
  rune: Object.freeze({
    dim: 'rgba(140,120,210,0.16)',
    lit: 'rgba(160,140,255,0.55)',
  }),

  /** Dragon Energy meter gradient. */
  energy: Object.freeze(['#7c5cff', '#28e0d0']),

  /**
   * Crystal relic MATERIALS. Shapes are carved gems, not coloured cubes. Each
   * material is a lighting ramp used to fake a faceted, translucent crystal:
   *   light  — top-left facet highlight
   *   core   — the gem's saturated body
   *   deep   — bottom-right shadowed facet
   *   glow   — outer aura / energy colour
   *   spark  — bright particle + specular colour
   */
  materials: Object.freeze({
    emerald: Object.freeze({ light: '#b8ffdf', core: '#1fd67e', deep: '#06603c', glow: '#25e88a', spark: '#d6ffe9' }),
    ruby: Object.freeze({ light: '#ffb3c6', core: '#ff2d6b', deep: '#7c0a2c', glow: '#ff3d75', spark: '#ffd6e2' }),
    sapphire: Object.freeze({ light: '#aecbff', core: '#2f6bff', deep: '#0a2a80', glow: '#3d7bff', spark: '#d6e4ff' }),
    amber: Object.freeze({ light: '#ffe1a3', core: '#ffb020', deep: '#805206', glow: '#ffc23d', spark: '#fff0d6' }),
    amethyst: Object.freeze({ light: '#e0c3ff', core: '#a24dff', deep: '#421680', glow: '#b76dff', spark: '#f0e2ff' }),
  }),
});

/** Ordered list of material keys, for random selection. */
export const MaterialKeys = Object.freeze(Object.keys(Palette.materials));
