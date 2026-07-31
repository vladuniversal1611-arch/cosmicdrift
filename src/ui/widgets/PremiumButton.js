/**
 * PremiumButton.js
 * -----------------------------------------------------------------------------
 * The glossy, gold-framed button used across all menus. Self-animating from a
 * press timestamp: an elastic squash-and-bounce on press, a gentle idle
 * breathing so it always feels alive, and a burst of sparkles on tap. Supports
 * an optional emoji-free procedural icon and a label, drawn via UITheme.
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Easing } from '../../utils/Easing.js';

export class PremiumButton extends Widget {
  constructor(x, y, w, h, onPress, opts = {}) {
    super(x, y, w, h);
    this.onPress = onPress ?? (() => {});
    this.label = opts.label ?? '';
    this.colors = opts.colors ?? UI.btn.blue;
    this.radius = opts.radius ?? Math.min(w, h) * 0.32;
    this.font = opts.font ?? `900 ${Math.round(h * 0.34)}px system-ui, sans-serif`;
    this.icon = opts.icon ?? null;          // (renderer, cx, cy, r) => void
    this.round = opts.round ?? false;        // circular icon button
    /** Radians the button twists to on press (settles back). */
    this.rotateOnPress = opts.rotateOnPress ?? 0;
    /** Idle vertical float (px) + period (s) so buttons feel alive. */
    this.floatAmp = opts.floatAmp ?? 0;
    this.floatPeriod = opts.floatPeriod ?? 3;
    this._pressAt = -1;
    this._phase = Math.random() * Math.PI * 2;
  }

  draw(r) {
    const b = this.bounds;
    const now = performance.now();
    const t = (now - this._pressAt) / 1000;
    const breathe = 1 + 0.015 * Math.sin(now / 620 + this._phase);
    let press = 1;
    if (this._pressAt >= 0 && t < 0.6) press = 0.9 + 0.1 * Easing.elasticOut(Math.min(1, t / 0.6));
    const scale = breathe * press;
    const rad = this.round ? b.h / 2 : this.radius;
    // Press twist + idle float (both honour Reduced Motion via small amplitudes).
    const rot = (this.rotateOnPress && this._pressAt >= 0 && t < 0.6)
      ? this.rotateOnPress * Math.sin(Math.min(1, t / 0.6) * Math.PI) : 0;
    const bob = this.floatAmp
      ? Math.sin(now / 1000 * (2 * Math.PI / this.floatPeriod) + this._phase) * this.floatAmp : 0;

    r.save();
    r.translate(b.centerX, b.centerY + bob);
    r.scale(scale, scale);
    if (rot) r.rotate(rot);
    r.translate(-b.centerX, -b.centerY);
    UITheme.button(r, b.x, b.y, b.w, b.h, rad, this.colors);
    if (this.icon) this.icon(r, b.centerX, b.centerY - (this.label ? b.h * 0.12 : 0), b.h * 0.3);
    if (this.label) {
      const ly = this.icon ? b.centerY + b.h * 0.28 : b.centerY;
      r.text(this.label, b.centerX + 1, ly + 2, { font: this.font, color: 'rgba(10,20,50,0.35)', align: 'center', baseline: 'middle' });
      r.text(this.label, b.centerX, ly, { font: this.font, color: UI.white, align: 'center', baseline: 'middle' });
    }
    // Idle shimmer sweep every ~12 s (staggered per button) so the whole UI
    // stays subtly alive without being distracting.
    const cyc = (now / 1000 + this._phase * 1.9) % 12;
    if (cyc < 0.6) {
      const k = cyc / 0.6;
      const ctx = r.ctx; ctx.save(); r.roundRectPath(b.x, b.y, b.w, b.h, rad); ctx.clip();
      const sx = b.x - b.w * 0.4 + k * b.w * 1.4;
      ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI);
      ctx.fillStyle = r.linearGradient(sx - 60, 0, sx + 60, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.85)'], [1, 'rgba(255,255,255,0)']]);
      ctx.fillRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = 1; ctx.restore();
    }
    r.restore();

    if (this._pressAt >= 0 && t < 0.5) {
      const k = t / 0.5;
      r.setAlpha((1 - k) * 0.9);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + this._phase;
        const rr = b.w * 0.4 + k * b.w * 0.4;
        r.sparkle(b.centerX + Math.cos(a) * rr, b.centerY + Math.sin(a) * rr * 0.7, 5 * (1 - k) + 1, '#fff');
      }
      r.setAlpha(1);
    }
  }

  onTap() {
    if (!this.enabled) return false;
    this._pressAt = performance.now();
    this.onPress();
    return true;
  }
}
