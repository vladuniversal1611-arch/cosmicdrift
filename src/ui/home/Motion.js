/**
 * Motion.js
 * -----------------------------------------------------------------------------
 * The single source of truth for the Home Screen's *continuous* animation math
 * (idle loops that run every frame from a clock). Discrete, one-shot transitions
 * (entrance, press, dismiss) go through the AnimationManager tween system —
 * these helpers cover the always-running idle motion so no component reinvents
 * the same sine curves. One definition per motion verb: fade, scale, bounce,
 * slide, rotate, pulse, float, shake.
 *
 * Every function is pure: (time, params) → number in a documented range. They
 * allocate nothing, so calling them per-frame per-component is free.
 * -----------------------------------------------------------------------------
 */
export const Motion = {
  /** 0..1 triangle/ease loop for cross-fades. */
  fade(t, period = 2, phase = 0) {
    return 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2 + phase);
  },
  /** Breathing scale around 1 (e.g. 1±amp). */
  scale(t, amp = 0.03, period = 2.4, phase = 0) {
    return 1 + amp * Math.sin((t / period) * Math.PI * 2 + phase);
  },
  /** Positive-only springy hop height in [0,amp] (for badges / arrows). */
  bounce(t, amp = 8, period = 0.9, phase = 0) {
    return Math.abs(Math.sin((t / period) * Math.PI + phase)) * amp;
  },
  /** Signed horizontal drift in [-amp,amp] for slow parallax / slide loops. */
  slide(t, amp = 10, period = 6, phase = 0) {
    return Math.sin((t / period) * Math.PI * 2 + phase) * amp;
  },
  /** Signed rotation (radians) wobble in [-amp,amp]. */
  rotate(t, amp = 0.04, period = 4, phase = 0) {
    return Math.sin((t / period) * Math.PI * 2 + phase) * amp;
  },
  /** 0..1 attention pulse (glow strength). */
  pulse(t, period = 1.6, phase = 0) {
    return 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2 + phase);
  },
  /** Signed vertical float in [-amp,amp]. */
  float(t, amp = 6, period = 3.4, phase = 0) {
    return Math.sin((t / period) * Math.PI * 2 + phase) * amp;
  },
  /** Decaying horizontal shake offset; `energy` 0..1 scales amplitude. */
  shake(t, energy = 0, amp = 6, freq = 42) {
    return energy > 0 ? Math.sin(t * freq) * amp * energy : 0;
  },
};
