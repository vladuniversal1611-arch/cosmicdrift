/**
 * Time.js
 * -----------------------------------------------------------------------------
 * Owns the game's notion of time: delta seconds, total elapsed time and a
 * smoothed FPS readout. A single source of truth prevents systems from each
 * calling performance.now() and drifting out of sync.
 *
 * `scale` lets us slow down or freeze the simulation (pause, slow-mo effects)
 * without touching individual systems.
 * -----------------------------------------------------------------------------
 */
export class Time {
  constructor() {
    /** Unscaled seconds since the last frame. */
    this.rawDelta = 0;
    /** Delta after applying `scale` — what gameplay should use. */
    this.delta = 0;
    /** Total scaled time elapsed, in seconds. */
    this.elapsed = 0;
    /** Global time multiplier (1 = normal, 0 = frozen). */
    this.scale = 1;
    /** Smoothed frames-per-second, for the debug HUD. */
    this.fps = 0;

    this._lastTs = 0;
    this._fpsAccum = 0;
    this._fpsFrames = 0;
  }

  /** Called once before the loop starts to anchor the clock. */
  start(nowMs) {
    this._lastTs = nowMs;
  }

  /**
   * Advance the clock. `maxDelta` clamps huge gaps (e.g. tab was backgrounded)
   * so the simulation never takes a giant, unstable step.
   */
  tick(nowMs, maxDelta = 0.1) {
    this.rawDelta = Math.min((nowMs - this._lastTs) / 1000, maxDelta);
    this._lastTs = nowMs;
    this.delta = this.rawDelta * this.scale;
    this.elapsed += this.delta;

    // Update the smoothed FPS roughly twice a second.
    this._fpsAccum += this.rawDelta;
    this._fpsFrames++;
    if (this._fpsAccum >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsAccum = 0;
      this._fpsFrames = 0;
    }
  }
}
