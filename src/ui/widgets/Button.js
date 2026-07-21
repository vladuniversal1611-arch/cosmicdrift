/**
 * Button.js
 * -----------------------------------------------------------------------------
 * A tappable button with premium tactile feedback. It animates itself from a
 * press timestamp (no external updater needed): a springy squash-and-bounce on
 * press (elastic easing), a gentle idle "breathing" scale so it always feels
 * alive, and a short burst of sparkles radiating on tap. The action fires
 * through a callback so screens keep control of behaviour.
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { Palette } from '../../config/Palette.js';
import { Easing } from '../../utils/Easing.js';

export class Button extends Widget {
  constructor(label, x, y, w, h, onPress, opts = {}) {
    super(x, y, w, h);
    this.label = label;
    this.onPress = onPress ?? (() => {});
    this.fill = opts.fill ?? Palette.accent;
    this.textColor = opts.textColor ?? Palette.textInverse;
    this.font = opts.font ?? '700 22px system-ui, sans-serif';
    this.radius = opts.radius ?? 14;
    this._pressAt = -1;                 // performance.now() of last press
    this._phase = Math.random() * Math.PI * 2;
  }

  draw(renderer) {
    const b = this.bounds;
    const now = performance.now();
    const t = (now - this._pressAt) / 1000;

    // Idle breathing + press squash-bounce (elastic), all eased.
    const breathe = 1 + 0.012 * Math.sin(now / 600 + this._phase);
    let press = 1;
    if (this._pressAt >= 0 && t < 0.6) {
      // Dip to 0.9 then spring back past 1.0 and settle.
      press = 0.9 + 0.1 * Easing.elasticOut(Math.min(1, t / 0.6));
    }
    const scale = breathe * press;

    renderer.save();
    renderer.translate(b.centerX, b.centerY);
    renderer.scale(scale, scale);
    renderer.translate(-b.centerX, -b.centerY);
    renderer.withGlow(this.fill, this.enabled ? 16 : 0, () => {
      renderer.fillRoundRect(b.x, b.y, b.w, b.h, this.radius,
        this.enabled ? this.fill : Palette.surfaceRaised);
    });
    renderer.text(this.label, b.centerX, b.centerY, {
      font: this.font,
      color: this.enabled ? this.textColor : Palette.textMuted,
      align: 'center', baseline: 'middle',
    });
    renderer.restore();

    // Sparkles radiating out for a moment after a press.
    if (this._pressAt >= 0 && t < 0.5) {
      const k = t / 0.5;                // 0 -> 1
      renderer.setAlpha((1 - k) * 0.9);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + this._phase;
        const rad = b.w * 0.4 + k * b.w * 0.5;
        renderer.sparkle(b.centerX + Math.cos(a) * rad, b.centerY + Math.sin(a) * rad * 0.6,
          5 * (1 - k) + 1, '#ffffff');
      }
      renderer.setAlpha(1);
    }
  }

  onTap() {
    if (!this.enabled) return false;
    this._pressAt = performance.now();
    this.onPress();
    return true; // consume the tap
  }
}
