/**
 * ProgressBar.js
 * -----------------------------------------------------------------------------
 * A horizontal fill bar for mission progress, dragon XP, loading, etc. The
 * displayed value eases toward the target so updates feel smooth without the
 * caller needing to animate anything.
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { Palette } from '../../config/Palette.js';
import { clamp } from '../../utils/MathUtils.js';

export class ProgressBar extends Widget {
  constructor(x, y, w, h, opts = {}) {
    super(x, y, w, h);
    this.value = opts.value ?? 0;        // target ratio 0..1
    this._display = this.value;          // eased display ratio
    this.fill = opts.fill ?? Palette.accentAlt;
    this.track = opts.track ?? 'rgba(255,255,255,0.08)';
    this.radius = opts.radius ?? (h * 0.5);
  }

  /** Set the target ratio (0..1). The bar eases toward it. */
  setValue(v) { this.value = clamp(v, 0, 1); }

  /** Called by the owning screen/system each frame to advance the easing. */
  update(dt) {
    this._display += (this.value - this._display) * Math.min(1, dt * 10);
  }

  draw(renderer) {
    const b = this.bounds;
    renderer.fillRoundRect(b.x, b.y, b.w, b.h, this.radius, this.track);
    const fw = b.w * this._display;
    if (fw > 1) {
      // Glowing fill with a bright, pulsing leading edge — reads as "charged".
      renderer.withGlow(this.fill, 8, () => {
        renderer.fillRoundRect(b.x, b.y, fw, b.h, this.radius, this.fill);
      });
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 260);
      renderer.setAlpha(pulse);
      renderer.fillCircle(b.x + fw, b.y + b.h / 2, b.h * 0.7, '#ffffff');
      renderer.setAlpha(1);
    }
  }
}
