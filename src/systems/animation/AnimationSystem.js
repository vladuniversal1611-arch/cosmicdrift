/**
 * AnimationSystem.js
 * -----------------------------------------------------------------------------
 * Central tween manager. Any system can request an animation and forget about
 * it — the AnimationSystem steps active tweens each frame and recycles them via
 * an ObjectPool to stay allocation-free.
 *
 * Respects the accessibility "reduced motion" setting: when enabled, tweens
 * snap to their end value instantly instead of animating.
 *
 * Usage:
 *   anim.to(sprite, 'y', 100, 0.3, { ease: Easing.backOut });
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { ObjectPool } from '../../utils/ObjectPool.js';
import { Tween } from './Tween.js';

export class AnimationSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'animation';
    this._active = [];
    this._pool = new ObjectPool(() => new Tween(), (t) => t.reset(), 32);
    this._reducedMotion = false;
  }

  onInit() {
    const settings = this.game.getSystem('settings');
    this._reducedMotion = settings ? settings.get('reducedMotion') : false;
    this.listen('settings:changed', ({ key, value }) => {
      if (key === 'reducedMotion') this._reducedMotion = value;
    });
  }

  /**
   * Start a tween on `target[key]` toward `to`. Returns the Tween so callers
   * can chain or cancel. See Tween.configure for options.
   */
  to(target, key, to, duration, opts = {}) {
    const tween = this._pool.acquire().configure(target, key, to, duration, opts);
    if (this._reducedMotion) {
      // Honour accessibility: jump straight to the final state.
      target[key] = to;
      if (opts.onUpdate) opts.onUpdate(to, 1);
      if (opts.onComplete) opts.onComplete();
      this._pool.release(tween);
      return tween;
    }
    this._active.push(tween);
    return tween;
  }

  /** Cancel any tweens currently animating the given target. */
  cancel(target) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      if (this._active[i].target === target) {
        this._pool.release(this._active[i]);
        this._active.splice(i, 1);
      }
    }
  }

  update(dt) {
    // Iterate backwards so completed tweens can be swap-removed safely.
    for (let i = this._active.length - 1; i >= 0; i--) {
      const tween = this._active[i];
      if (tween.step(dt)) {
        this._active.splice(i, 1);
        this._pool.release(tween);
      }
    }
  }

  /** Number of tweens currently running — handy for debugging. */
  get activeCount() { return this._active.length; }

  onDestroy() {
    this._active.length = 0;
  }
}
