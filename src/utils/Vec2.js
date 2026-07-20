/**
 * Vec2.js
 * -----------------------------------------------------------------------------
 * A small, dependency-free 2D vector. Used for positions, velocities and
 * layout maths across the engine. Methods come in two flavours:
 *   - instance methods that MUTATE and return `this` (cheap, allocation-free)
 *   - static methods that return a NEW Vec2 (safe, functional style)
 * Prefer the mutating API in hot loops (particles, animation) to avoid GC.
 * -----------------------------------------------------------------------------
 */
export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) { this.x = x; this.y = y; return this; }
  copy(v) { this.x = v.x; this.y = v.y; return this; }
  clone() { return new Vec2(this.x, this.y); }

  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }

  get length() { return Math.hypot(this.x, this.y); }
  get lengthSq() { return this.x * this.x + this.y * this.y; }

  normalize() {
    const len = this.length;
    if (len > 1e-8) { this.x /= len; this.y /= len; }
    return this;
  }

  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); }

  /** Linear interpolation toward `v` by factor `t` (0..1). Mutates. */
  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  equals(v, epsilon = 1e-6) {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  // --- Static, allocating helpers -------------------------------------------
  static add(a, b) { return new Vec2(a.x + b.x, a.y + b.y); }
  static sub(a, b) { return new Vec2(a.x - b.x, a.y - b.y); }
  static scale(a, s) { return new Vec2(a.x * s, a.y * s); }
  static distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
}
