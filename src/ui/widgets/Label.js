/**
 * Label.js
 * -----------------------------------------------------------------------------
 * A simple text widget. Text, font and colour are configurable; alignment is
 * expressed relative to the widget bounds so labels compose predictably.
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { Palette } from '../../config/Palette.js';

export class Label extends Widget {
  constructor(text, x, y, opts = {}) {
    super(x, y, opts.w ?? 0, opts.h ?? 0);
    this.text = text;
    this.font = opts.font ?? '600 20px system-ui, sans-serif';
    this.color = opts.color ?? Palette.textPrimary;
    this.align = opts.align ?? 'left';   // 'left' | 'center' | 'right'
    this.baseline = opts.baseline ?? 'top';
  }

  setText(text) { this.text = text; return this; }

  draw(renderer) {
    let x = this.bounds.x;
    if (this.align === 'center') x = this.bounds.centerX;
    else if (this.align === 'right') x = this.bounds.right;
    renderer.text(this.text, x, this.bounds.y, {
      font: this.font,
      color: this.color,
      align: this.align,
      baseline: this.baseline,
    });
  }
}
