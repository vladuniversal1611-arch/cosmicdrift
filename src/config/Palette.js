/**
 * Palette.js
 * -----------------------------------------------------------------------------
 * Centralised colour + theme tokens for Cosmic Drift.
 *
 * ART DIRECTION: bright, warm, premium-casual — the sunny, magical, friendly
 * world of a top-tier mobile game. Sky blues, warm-white clouds, fresh green,
 * golden decorations, turquoise magic and crystal blue; warm-orange highlights;
 * red reserved strictly for warnings. NEVER dark purple, dark grey, black UI or
 * muddy browns. Everything reads as sunlit and touchable.
 *
 * Keeping colours here (rather than inline in draw calls) means the entire
 * game can be re-skinned by swapping a single object. The board, crystals,
 * particles and UI all read from these tokens.
 * -----------------------------------------------------------------------------
 */

export const Palette = Object.freeze({
  /** Bright sky gradient, top -> bottom (used as a safe fallback backdrop). */
  background: Object.freeze(['#5bb4ff', '#9ad7ff', '#e6f6ff']),

  /** Neutral surfaces (panels, cards) — glossy warm white glass. */
  surface: 'rgba(255,255,255,0.92)',
  surfaceRaised: 'rgba(255,255,255,0.96)',
  surfaceStroke: 'rgba(255,255,255,0.9)',

  /**
   * Text ramp. Primary is white (pair with `outline` for the soft dark edge the
   * art direction calls for); ink tones read on the bright glass panels.
   */
  textPrimary: '#ffffff',
  textMuted: '#2f5487',
  textInverse: '#173a72',
  /** Soft dark outline colour for white text sitting over bright scenes. */
  textOutline: 'rgba(20,44,92,0.55)',

  /** Brand accents used for highlights, glows and CTAs. */
  accent: '#22b7ff',       // crystal blue magic
  accentAlt: '#18d0c0',    // turquoise magic
  warning: '#ff9d2e',      // warm orange highlight
  danger: '#ff4d5e',       // red — warnings only
  success: '#3fc86a',      // fresh green
  gold: '#ffcf5e',         // golden decorations

  /**
   * The magical stone board — BRIGHT sunlit stone decorated with gold. Each
   * token is a stop in a lighting model (top-lit bevel over a soft carved slab).
   */
  stone: Object.freeze({
    frameTop: '#fbfdff',
    frameBottom: '#c6ddf6',
    bevelLight: '#ffffff',
    bevelDark: '#aecbea',
    inlay: '#dcecfb',
  }),

  /** Engraved empty cell "sockets" — soft light insets with a gentle blue glow. */
  socket: Object.freeze({
    rim: '#b6cfec',
    faceTop: '#e4f0fd',
    faceBottom: '#b8d3f0',
    innerGlow: 'rgba(34,183,255,0.14)',
  }),

  /** Rune engravings etched into stone and cells — warm glowing gold. */
  rune: Object.freeze({
    dim: 'rgba(255,196,90,0.22)',
    lit: 'rgba(255,205,94,0.80)',
  }),

  /** Dragon Energy meter gradient — crystal blue into turquoise. */
  energy: Object.freeze(['#22b7ff', '#18d0c0']),

  /**
   * Crystal relic MATERIALS. Shapes are carved gems, not coloured cubes. Each
   * material is a lighting ramp used to fake a faceted, translucent crystal:
   *   light  — top-left facet highlight
   *   core   — the gem's saturated body
   *   deep   — bottom-right shadowed facet
   *   glow   — outer aura / energy colour
   *   spark  — bright particle + specular colour
   * Kept vivid and high-contrast so they pop against the bright board.
   */
  materials: Object.freeze({
    emerald: Object.freeze({ light: '#c4ffe4', core: '#25d986', deep: '#0f8a52', glow: '#3bf29a', spark: '#e2fff0', symbol: 'circle' }),
    ruby: Object.freeze({ light: '#ffc0d0', core: '#ff3d6f', deep: '#c11844', glow: '#ff5c86', spark: '#ffe0e8', symbol: 'triangle' }),
    sapphire: Object.freeze({ light: '#bfe0ff', core: '#2f8bff', deep: '#1257c4', glow: '#54a6ff', spark: '#e2f0ff', symbol: 'square' }),
    amber: Object.freeze({ light: '#ffe6ad', core: '#ffb020', deep: '#d98307', glow: '#ffc84d', spark: '#fff3d6', symbol: 'diamond' }),
    // Kept under the legacy `amethyst` key (saves + fallbacks reference it) but
    // recoloured to a bright, sunny turquoise so nothing reads as dark violet.
    amethyst: Object.freeze({ light: '#c2fff4', core: '#1fd6c4', deep: '#0f9488', glow: '#3ff0dd', spark: '#e2fffb', symbol: 'cross' }),
  }),

  /**
   * Living Board tile palettes. Each interactive tile type reads its colours
   * from here so the whole board can be re-themed per world in one place.
   */
  tiles: Object.freeze({
    moss: Object.freeze({ base: '#5aa85f', leaf: '#6fd07f', glow: '#a8f0b0' }),
    ice: Object.freeze({ fill: '#dcf2ff', edge: '#9fd0ff', glow: '#c6ecff', crack: '#7aa8dd' }),
    corruption: Object.freeze({ core: '#8a3fd0', ooze: '#b96dff', glow: '#dca6ff' }),
    portalA: Object.freeze({ ring: '#18d0c0', glow: '#3ff0dd' }),
    portalB: Object.freeze({ ring: '#ff6aa8', glow: '#ff9ac6' }),
    dragon: Object.freeze({ rune: '#ff9d2e', glow: '#ffc84d' }),
    treasure: Object.freeze({ gold: '#ffd23d', deep: '#e0a41e', glow: '#fff0b0' }),
    tree: Object.freeze({ trunk: '#9a6b3f', leaf: '#3fc06a', glow: '#a8f0b0' }),
    fog: Object.freeze({ a: 'rgba(236,244,255,0.94)', b: 'rgba(198,224,255,0.78)' }),
    crystalCore: Object.freeze({ core: '#3aa8ff', glow: '#bfe4ff' }),
  }),

  /**
   * Structure Patterns. When placed crystals form a known shape they rise into
   * one of these magical structures; each type reads its colours here.
   */
  structures: Object.freeze({
    magicCrystal: Object.freeze({ core: '#3aa8ff', glow: '#bfe4ff' }),
    towerFoundation: Object.freeze({ core: '#ffb020', glow: '#ffe6ad' }),
    dragonShrine: Object.freeze({ core: '#ff7a4d', glow: '#ffc0a0' }),
    bridge: Object.freeze({ core: '#18d0c0', glow: '#a8f5ee' }),
    energyCore: Object.freeze({ core: '#3fc86a', glow: '#b0f2cc' }),
  }),
});

/** Ordered list of material keys, for random selection. */
export const MaterialKeys = Object.freeze(Object.keys(Palette.materials));
