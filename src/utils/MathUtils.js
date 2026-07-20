/**
 * MathUtils.js
 * -----------------------------------------------------------------------------
 * Stateless numeric helpers. Kept as plain functions (not a class) so they can
 * be tree-shaken and imported individually.
 * -----------------------------------------------------------------------------
 */

/** Constrain `v` to the inclusive range [min, max]. */
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/** Linear interpolation between a and b by t (0..1). */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Inverse lerp: where does v sit between a and b, as 0..1? */
export const invLerp = (a, b, v) => (b - a === 0 ? 0 : (v - a) / (b - a));

/** Remap v from range [inMin,inMax] to [outMin,outMax]. */
export const remap = (v, inMin, inMax, outMin, outMax) =>
  lerp(outMin, outMax, invLerp(inMin, inMax, v));

/** Smoothstep easing of t (0..1). */
export const smoothstep = (t) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Round to the nearest multiple of `step`. */
export const snap = (v, step) => Math.round(v / step) * step;

/** Degrees <-> radians. */
export const toRad = (deg) => (deg * Math.PI) / 180;
export const toDeg = (rad) => (rad * 180) / Math.PI;
