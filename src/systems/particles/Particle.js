/**
 * Particle.js
 * -----------------------------------------------------------------------------
 * A single lightweight particle. Plain data + a step/reset pair so instances
 * can live in an ObjectPool. No rendering logic here — the ParticleSystem draws
 * particles in a tight batch for performance.
 * -----------------------------------------------------------------------------
 */
export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.ax = 0; this.ay = 0;   // acceleration (e.g. gravity)
    this.life = 0;              // remaining seconds
    this.maxLife = 1;
    this.size = 4;
    this.color = '#ffffff';
    this.alpha = 1;
    this.drag = 0;              // per-second velocity damping (0 = none)
    this.dead = true;
    return this;
  }

  /** Advance the particle. Returns true when it should be recycled. */
  step(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return true; }

    // Integrate velocity/acceleration with simple drag.
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    if (this.drag) {
      const d = Math.max(0, 1 - this.drag * dt);
      this.vx *= d; this.vy *= d;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Fade out over the back half of the particle's life.
    this.alpha = Math.min(1, (this.life / this.maxLife) * 2);
    return false;
  }
}
