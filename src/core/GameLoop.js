/**
 * GameLoop.js
 * -----------------------------------------------------------------------------
 * A fixed-timestep game loop driven by requestAnimationFrame.
 *
 * Why fixed timestep? Deterministic, stable simulation regardless of the
 * display's refresh rate (60/90/120 Hz) or momentary frame drops. We accumulate
 * real elapsed time and step the simulation in constant slices, then render
 * once per animation frame. This gives smooth motion and reproducible physics
 * — a must for a puzzle game with animation and juice.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';

export class GameLoop {
  /**
   * @param {(dt: number) => void} update  Called with a fixed dt each step.
   * @param {(alpha: number) => void} render Called once per frame; `alpha` is
   *        the 0..1 interpolation factor between the last two sim steps.
   */
  constructor(update, render) {
    this._update = update;
    this._render = render;

    /** Fixed simulation step, in seconds. */
    this._step = 1 / Config.render.targetFps;
    this._accumulator = 0;
    this._lastTs = 0;
    this._running = false;
    this._rafId = 0;

    this._frame = this._frame.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTs = performance.now();
    this._rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._rafId);
  }

  _frame(ts) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._frame);

    // Clamp to avoid a "spiral of death" after a long pause / backgrounding.
    let frameTime = (ts - this._lastTs) / 1000;
    if (frameTime > 0.25) frameTime = 0.25;
    this._lastTs = ts;

    this._accumulator += frameTime;
    // Drain accumulated time in fixed steps.
    while (this._accumulator >= this._step) {
      this._update(this._step);
      this._accumulator -= this._step;
    }

    // Fractional remainder lets renderers interpolate for extra smoothness.
    const alpha = this._accumulator / this._step;
    this._render(alpha);
  }
}
