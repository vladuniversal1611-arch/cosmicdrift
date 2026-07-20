/**
 * Panel.js
 * -----------------------------------------------------------------------------
 * A rounded background container used to group other widgets (dialogs, HUD
 * groups, shop cards). Draws a filled, optionally stroked rounded rect; its
 * children render on top via the base Widget tree.
 * -----------------------------------------------------------------------------
 */
import { Widget } from '../Widget.js';
import { Palette } from '../../config/Palette.js';

export class Panel extends Widget {
  constructor(x, y, w, h, opts = {}) {
    super(x, y, w, h);
    this.radius = opts.radius ?? 16;
    this.fill = opts.fill ?? Palette.surfaceRaised;
    this.stroke = opts.stroke ?? Palette.surfaceStroke;
    this.strokeWidth = opts.strokeWidth ?? 1;
  }

  draw(renderer) {
    const b = this.bounds;
    renderer.fillRoundRect(b.x, b.y, b.w, b.h, this.radius, this.fill);
    if (this.stroke && this.strokeWidth > 0) {
      renderer.strokeRoundRect(b.x, b.y, b.w, b.h, this.radius, this.stroke, this.strokeWidth);
    }
  }
}
