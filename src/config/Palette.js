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
  background: Object.freeze(['#0f1624', '#13203a', '#1b2942']),

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
   * The board's raised GOLD frame — the reference's signature: a polished gold
   * bezel with a bright top edge falling to a deeper amber base. Each token is a
   * stop in a lighting model (top-lit bevel over a warm metallic slab).
   */
  stone: Object.freeze({
    frameTop: '#ffe9a6',
    frameBottom: '#e0a544',
    bevelLight: '#fff6d8',
    bevelEdge: '#b87d28',
    bevelDark: '#101d33',
    inlay: '#1a2b47',
  }),

  /** Engraved empty cell "sockets" — soft light insets with a gentle blue glow. */
  socket: Object.freeze({
    rim: '#8fb4e6',
    faceTop: '#cfe4ff',
    faceBottom: '#93bdee',
    innerGlow: 'rgba(34,120,220,0.18)',
  }),

  /**
   * Board themes cycled through on every full-board ("PERFECT") clear. Index 0
   * matches `socket` above, so the board looks identical until the first full
   * clear, then transforms colour with a shockwave. Each is a socket tint plus
   * an accent used for the transformation wave + celebration.
   */
  // Each theme is a full sky "mood": it tints the board cells (rim/face) AND the
  // whole background gradient (`sky`, top→bottom), so a full-board clear morphs
  // the entire screen — not just the tiles.
  boardThemes: Object.freeze([
    // Dark-navy board: tiles are a fixed premium navy (see _drawSocket); a theme
    // only shifts the deep background MOOD + accent, so a full-clear still morphs
    // the whole screen without lightening the board.
    Object.freeze({ name: 'Sky',     rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#3aa8ff', sky: ['#0f1624', '#152340', '#20365c'] }),
    Object.freeze({ name: 'Sunset',  rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#ff8a2e', sky: ['#1a1018', '#2c1a22', '#432634'] }),
    Object.freeze({ name: 'Orchid',  rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#b06aff', sky: ['#140f22', '#221a3a', '#352a58'] }),
    Object.freeze({ name: 'Rose',    rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#ff5a98', sky: ['#190f18', '#2c1a28', '#43263a'] }),
    Object.freeze({ name: 'Meadow',  rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#3fd07a', sky: ['#0d1a14', '#152a1f', '#1f3d2c'] }),
    Object.freeze({ name: 'Dusk',    rim: '#375c91', faceTop: '#243a63', faceBottom: '#1b2942', accent: '#6a7aff', sky: ['#0d1020', '#161c38', '#242c58'] }),
  ]),

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
    // Purple (the unicorn friend). Kept under the legacy `amethyst` key that
    // saves + fallbacks reference.
    amethyst: Object.freeze({ light: '#e8ccff', core: '#a24fe0', deep: '#6f2caf', glow: '#c891ff', spark: '#f1e3ff', symbol: 'cross' }),
    // Warm orange (the cat friend) — a sixth colour for more board variety.
    coral: Object.freeze({ light: '#ffd9b0', core: '#ff8a3d', deep: '#d15f12', glow: '#ffb066', spark: '#fff0dd', symbol: 'diamond' }),
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
