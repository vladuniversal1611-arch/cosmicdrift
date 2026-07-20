/**
 * Tween.js
 * -----------------------------------------------------------------------------
 * A single interpolation from a start value to an end value over a duration,
 * with an easing curve. Tweens are pooled and driven by the AnimationSystem.
 *
 * Kept intentionally generic: a tween animates a numeric property on any target
 * object by key, so the same class drives piece slides, UI fades, camera shakes
 * and reward pops.
 * -----------------------------------------------------------------------------
 */
import { Easing } from '../../utils/Easing.js';

export class Tween {
  constructor() {
    this.reset();
  }

  /** Clear state so the instance can be reused from the pool. */
  reset() {
    this.target = null;
    this.key = '';
    this.from = 0;
    this.to = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.ease = Easing.linear;
    this.delay = 0;
    this.onUpdate = null;
    this.onComplete = null;
    this.active = false;
    return this;
  }

  /**
   * Configure the tween.
   * @param {object}   target    Object whose property is animated.
   * @param {string}   key       Property name on the target.
   * @param {number}   to        Destination value.
   * @param {number}   duration  Seconds.
   * @param {object}   [opts]    { ease, delay, from, onUpdate, onComplete }
   */
  configure(target, key, to, duration, opts = {}) {
    this.target = target;
    this.key = key;
    this.from = opts.from ?? target[key];
    this.to = to;
    this.duration = Math.max(0.0001, duration);
    this.elapsed = 0;
    this.ease = opts.ease ?? Easing.quadOut;
    this.delay = opts.delay ?? 0;
    this.onUpdate = opts.onUpdate ?? null;
    this.onComplete = opts.onComplete ?? null;
    this.active = true;
    return this;
  }

  /** Advance by dt seconds. Returns true when finished. */
  step(dt) {
    if (!this.active) return true;
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay > 0) return false;
    }
    this.elapsed += dt;
    const t = Math.min(this.elapsed / this.duration, 1);
    const value = this.from + (this.to - this.from) * this.ease(t);
    if (this.target) this.target[this.key] = value;
    if (this.onUpdate) this.onUpdate(value, t);

    if (t >= 1) {
      this.active = false;
      if (this.onComplete) this.onComplete();
      return true;
    }
    return false;
  }
}
