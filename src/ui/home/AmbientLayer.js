/**
 * AmbientLayer.js  (Home Screen · section: AMBIENT EFFECTS LAYER)
 * -----------------------------------------------------------------------------
 * The topmost, non-interactive sparkle layer that adds life over the whole UI:
 * drifting fireflies/light motes that glow and fade. Uses a fixed recycled pool
 * (no per-frame allocation) and honours the reduced-motion setting by thinning
 * out. Sits above content but below popups/notifications.
 * -----------------------------------------------------------------------------
 */
import { Motion } from './Motion.js';

const POOL = 22;

export class AmbientLayer {
  constructor(game, safe) {
    this.game = game;
    this.safe = safe;
    this._t = 0;
    this._motes = [];
    for (let i = 0; i < POOL; i++) this._motes.push(this._spawn(i, true));
  }

  _spawn(i, initial) {
    const r = (n) => { const x = Math.sin((i + n) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    return {
      x: r(1) * this.safe.w,
      y: (initial ? r(2) : 1.05) * this.safe.h,
      s: 2 + r(3) * 4,
      vy: 8 + r(4) * 14,
      vx: (r(5) - 0.5) * 12,
      ph: r(6) * 6.283,
    };
  }

  update(dt) {
    this._t += dt;
    for (let i = 0; i < this._motes.length; i++) {
      const m = this._motes[i];
      m.y -= m.vy * dt;
      m.x += m.vx * dt + Motion.slide(this._t, 6, 4, m.ph) * dt;
      if (m.y < -12) Object.assign(m, this._spawn(i, false), { y: this.safe.h + 12 });
    }
  }

  render(r) {
    // Thin out under reduced motion for accessibility + perf.
    const reduced = this.game.getSystem('settings')?.get?.('reducedMotion');
    const step = reduced ? 3 : 1;
    for (let i = 0; i < this._motes.length; i += step) {
      const m = this._motes[i];
      const tw = Motion.pulse(this._t, 1.5, m.ph);
      r.setAlpha(0.15 + 0.5 * tw);
      r.withGlow('#fff6c8', 6, () => r.fillCircle(m.x, m.y, m.s, '#fff8dc'));
    }
    r.setAlpha(1);
  }
}
