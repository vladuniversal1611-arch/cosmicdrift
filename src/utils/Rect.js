/**
 * Rect.js
 * -----------------------------------------------------------------------------
 * Axis-aligned rectangle used for layout, hit-testing and culling.
 * Coordinates are in logical (design) pixels. All UI widgets and the board
 * express their bounds as a Rect so hit-testing is uniform everywhere.
 * -----------------------------------------------------------------------------
 */
export class Rect {
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get left() { return this.x; }
  get top() { return this.y; }
  get right() { return this.x + this.w; }
  get bottom() { return this.y + this.h; }
  get centerX() { return this.x + this.w * 0.5; }
  get centerY() { return this.y + this.h * 0.5; }

  set(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; return this; }
  copy(r) { return this.set(r.x, r.y, r.w, r.h); }
  clone() { return new Rect(this.x, this.y, this.w, this.h); }

  /** True if the point (px, py) lies inside the rectangle. */
  contains(px, py) {
    return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom;
  }

  /** True if this rectangle overlaps another. */
  intersects(r) {
    return !(r.left > this.right || r.right < this.left ||
             r.top > this.bottom || r.bottom < this.top);
  }

  /** Return a new Rect inset by `p` on every side (negative to grow). */
  inflate(p) {
    return new Rect(this.x - p, this.y - p, this.w + p * 2, this.h + p * 2);
  }
}
