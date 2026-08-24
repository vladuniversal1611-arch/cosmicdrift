/**
 * PerformanceManager.js
 * -----------------------------------------------------------------------------
 * Single owner of runtime performance policy. It samples frame time, derives a
 * smoothed FPS, and — when the device is clearly struggling — lowers the global
 * quality flag so expensive glow/shadow passes switch off. When headroom
 * returns it restores quality. It never draws anything and never touches other
 * managers directly: it only reads its own samples and broadcasts events.
 *
 * Responsibility: performance measurement + adaptive quality policy. Nothing
 * else. Scene/particle/render systems react to `perf:quality` on their own.
 *
 * Events:
 *   emits 'perf:sample'  ({ fps, ms })            once per sample window
 *   emits 'perf:quality' ({ high })               when the quality tier flips
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Quality } from '../../config/Quality.js';

const SAMPLE_WINDOW = 0.5;   // seconds between published samples
const LOW_FPS = 45;          // sustained below this → drop quality
const OK_FPS = 56;           // sustained above this → restore quality
const HYSTERESIS = 2.0;      // seconds a condition must hold before flipping

export class PerformanceManager extends System {
  constructor(game) {
    super(game);
    this.name = 'performance';
    this.fps = 60;
    this._acc = 0;
    this._frames = 0;
    this._lowFor = 0;
    this._okFor = 0;
    this._high = Config.render.highQuality;
  }

  onInit() {
    this._high = Config.render.highQuality;
    Quality.highQuality = this._high;
  }

  onReset() {
    this._acc = 0; this._frames = 0; this._lowFor = 0; this._okFor = 0;
  }

  update(dt) {
    if (dt <= 0) return;
    this._acc += dt;
    this._frames += 1;

    // Track how long we've been below/above the comfort band (real-ish time).
    const instFps = 1 / dt;
    this._lowFor = instFps < LOW_FPS ? this._lowFor + dt : 0;
    this._okFor = instFps > OK_FPS ? this._okFor + dt : 0;

    if (this._acc >= SAMPLE_WINDOW) {
      this.fps = Math.round(this._frames / this._acc);
      this._acc = 0; this._frames = 0;
      this.events.emit('perf:sample', { fps: this.fps, ms: +(1000 / Math.max(1, this.fps)).toFixed(1) });
    }

    // Adaptive quality with hysteresis so it never thrashes frame-to-frame.
    if (this._high && this._lowFor >= HYSTERESIS) this._setQuality(false);
    else if (!this._high && this._okFor >= HYSTERESIS) this._setQuality(true);
  }

  /** Player's explicit "Low Performance Mode" is a hard ceiling we never override. */
  get _playerForcedLow() { return !!this.game.getSystem('settings')?.get('lowPerformance'); }

  _setQuality(high) {
    if (high && this._playerForcedLow) return;   // respect the player's choice
    if (this._high === high) return;
    this._high = high;
    Quality.highQuality = high;
    // When we drop tiers, also shed physical pixels and particle load — the two
    // biggest fill-rate costs on weak phones — and restore them when headroom
    // returns. dprScale change requires a canvas re-layout to take effect.
    Quality.dprScale = high ? 1 : 0.7;
    Quality.maxParticles = high ? 400 : 160;
    this.game.canvas?.resize();
    this._lowFor = 0; this._okFor = 0;
    this.events.emit('perf:quality', { high });
  }
}
