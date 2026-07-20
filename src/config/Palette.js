/**
 * Palette.js
 * -----------------------------------------------------------------------------
 * Centralised colour + theme tokens for Cosmic Drift.
 *
 * Keeping colours here (rather than inline in draw calls) means the entire
 * game can be re-skinned — or given seasonal / event themes — by swapping a
 * single object. The UI, Particles, Board and Renderer all read from tokens.
 * -----------------------------------------------------------------------------
 */

/**
 * The default "deep space" theme. Values are plain CSS colour strings so they
 * can be handed straight to the Canvas 2D context.
 */
export const Palette = Object.freeze({
  /** Background gradient stops, top -> bottom. */
  background: Object.freeze(['#05010f', '#0a0524', '#04010c']),

  /** Neutral surfaces (panels, cards, board frame). */
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
   * Piece colour families. Each entry is a fill/stroke/glow triple so pieces
   * read clearly against the dark board and remain colour-blind distinguishable
   * by brightness as well as hue.
   */
  pieces: Object.freeze({
    nebula: Object.freeze({ fill: '#7c5cff', stroke: '#b3a0ff', glow: '#7c5cff' }),
    plasma: Object.freeze({ fill: '#ff4d6d', stroke: '#ff9db0', glow: '#ff4d6d' }),
    aurora: Object.freeze({ fill: '#28e0d0', stroke: '#9ff5ee', glow: '#28e0d0' }),
    solar: Object.freeze({ fill: '#ffb020', stroke: '#ffd98a', glow: '#ffb020' }),
    verdant: Object.freeze({ fill: '#38e08a', stroke: '#a4f2c8', glow: '#38e08a' }),
  }),

  /** Board cell states. */
  cellEmpty: 'rgba(255,255,255,0.04)',
  cellEmptyStroke: 'rgba(255,255,255,0.06)',
});
