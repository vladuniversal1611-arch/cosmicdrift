/**
 * Button.js
 * -----------------------------------------------------------------------------
 * A tappable button with a label and a press animation hook. It emits its
 * action through a callback so screens stay in control of behaviour. A brief
 * scale "press" gives tactile feedback; the actual tween is driven by whatever
 * screen owns it (kept out here to avoid coupling the widget to a system).
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { Palette } from '../../config/Palette.js';

export class Button extends Widget {
  /**
   * @param {string} label
   * @param {Rect-like} bounds via (x,y,w,h)
   * @param {() => void} onPress
   * @param {object} [opts] { fill, textColor, font, radius }
   */
  constructor(label, x, y, w, h, onPress, opts = {}) {
    super(x, y, w, h);
    this.label = label;
    this.onPress = onPress ?? (() => {});
    this.fill = opts.fill ?? Palette.accent;
    this.textColor = opts.textColor ?? Palette.textInverse;
    this.font = opts.font ?? '700 22px system-ui, sans-serif';
    this.radius = opts.radius ?? 14;
    /** Visual scale, animatable by a screen for press feedback. */
    this.scale = 1;
  }

  draw(renderer) {
    const b = this.bounds;
    renderer.save();
    // Scale around the button centre for the press effect.
    renderer.translate(b.centerX, b.centerY);
    renderer.scale(this.scale, this.scale);
    renderer.translate(-b.centerX, -b.centerY);

    renderer.withGlow(this.fill, this.enabled ? 16 : 0, () => {
      renderer.fillRoundRect(b.x, b.y, b.w, b.h, this.radius,
        this.enabled ? this.fill : Palette.surfaceRaised);
    });
    renderer.text(this.label, b.centerX, b.centerY, {
      font: this.font,
      color: this.enabled ? this.textColor : Palette.textMuted,
      align: 'center',
      baseline: 'middle',
    });
    renderer.restore();
  }

  onTap() {
    if (!this.enabled) return false;
    this.onPress();
    return true; // consume the tap
  }
}
