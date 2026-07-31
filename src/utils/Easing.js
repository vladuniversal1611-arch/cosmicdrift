/**
 * Easing.js
 * -----------------------------------------------------------------------------
 * A library of easing functions used by the AnimationSystem's tweens.
 * Every function maps a normalised time t (0..1) to an eased value (0..1).
 * These are pure and stateless, so they can be shared freely.
 * -----------------------------------------------------------------------------
 */
export const Easing = Object.freeze({
  linear: (t) => t,

  quadIn: (t) => t * t,
  quadOut: (t) => t * (2 - t),
  quadInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  cubicIn: (t) => t * t * t,
  cubicOut: (t) => --t * t * t + 1,
  cubicInOut: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  /** Sharp, expensive-feeling deceleration — the King/Dream Games UI curve. */
  expoOut: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),

  /**
   * The signature UI easing, cubic-bezier(0.22, 1, 0.36, 1). Every menu/HUD
   * transition should use this so the whole game shares one motion language.
   * Solved analytically per-frame (no lookup table) so it stays allocation-free.
   */
  smooth: (t) => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    // Newton-solve the bezier x(u)=t, then evaluate y(u). p1x=0.22, p2x=0.36.
    const cx = 3 * 0.22, bx = 3 * (0.36 - 0.22) - cx, ax = 1 - cx - bx;
    const cy = 3 * 1, by = 3 * (1 - 1) - cy, ay = 1 - cy - by;
    let u = t;
    for (let i = 0; i < 5; i++) {
      const x = ((ax * u + bx) * u + cx) * u - t;
      const d = (3 * ax * u + 2 * bx) * u + cx;
      if (Math.abs(d) < 1e-6) break;
      u -= x / d;
    }
    return ((ay * u + by) * u + cy) * u;
  },

  /** Overshooting "pop" — great for pieces snapping onto the board. */
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  /** Springy settle — for reward pop-ups and celebratory UI. */
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  /** Bouncing landing. */
  bounceOut: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
});
