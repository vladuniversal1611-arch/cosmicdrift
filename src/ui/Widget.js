/**
 * Widget.js
 * -----------------------------------------------------------------------------
 * Base class for all canvas-drawn UI elements. A widget owns a Rect in logical
 * coordinates, knows how to render itself and how to respond to pointer taps.
 *
 * The UI is drawn on the same canvas as the game (no DOM overlay) so it scales
 * perfectly with the letterboxed viewport and exports cleanly to WebView.
 * Widgets form a simple tree via `children` for layout composition.
 * -----------------------------------------------------------------------------
 */
import { Rect } from '../utils/Rect.js';

export class Widget {
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.bounds = new Rect(x, y, w, h);
    this.visible = true;
    this.enabled = true;
    /** @type {Widget[]} */
    this.children = [];
    this.parent = null;
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  /** Hit-test in logical coordinates. */
  contains(px, py) { return this.bounds.contains(px, py); }

  /**
   * Route a tap. Children are tested front-to-back (last added = on top).
   * Returns true if the tap was consumed, stopping further propagation.
   */
  handleTap(px, py) {
    if (!this.visible || !this.enabled) return false;
    for (let i = this.children.length - 1; i >= 0; i--) {
      if (this.children[i].handleTap(px, py)) return true;
    }
    if (this.contains(px, py)) return this.onTap(px, py);
    return false;
  }

  /** Render self then children. Subclasses override `draw`. */
  render(renderer) {
    if (!this.visible) return;
    this.draw(renderer);
    for (const child of this.children) child.render(renderer);
  }

  // --- Overridable ----------------------------------------------------------
  /** Draw this widget. */
  draw(/* renderer */) {}
  /** Handle a tap that landed on this widget. Return true to consume it. */
  onTap(/* px, py */) { return false; }
}
