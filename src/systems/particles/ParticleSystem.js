/**
 * ParticleSystem.js
 * -----------------------------------------------------------------------------
 * Pooled particle simulator + batch renderer. Provides a small "emit" API that
 * other systems call to add juice (line clears, piece placement, rewards) via
 * events, keeping this system fully decoupled from gameplay.
 *
 * Performance notes:
 *   - Particles are pooled; steady-state allocation is zero.
 *   - A hard cap bounds worst-case cost so fill-rate stays within the 60 FPS
 *     budget even under a burst of effects.
 *   - Skips itself entirely when the reduced-motion setting is on.
 *
 * Events:
 *   listens 'fx:burst' ({ x, y, color, count })  — generic burst request
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { ObjectPool } from '../../utils/ObjectPool.js';
import { Particle } from './Particle.js';
import { Quality } from '../../config/Quality.js';

export class ParticleSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'particles';
    this._active = [];
    this._pool = new ObjectPool(() => new Particle(), (p) => p.reset(), 128);
    this._reducedMotion = false;
    /** Expanding ripple rings (impact/combo shockwaves), capped + cheap. */
    this._rings = [];
  }

  onInit() {
    const settings = this.game.getSystem('settings');
    this._reducedMotion = settings ? settings.get('reducedMotion') : false;
    this.listen('settings:changed', ({ key, value }) => {
      if (key === 'reducedMotion') this._reducedMotion = value;
    });
    this.listen('fx:burst', this._onBurst);
    this.listen('fx:ripple', ({ x, y, color = '#7c5cff', radius = 90 }) => this.ripple(x, y, color, radius));
  }

  _onBurst({ x, y, color = '#fff', count = 12 }) {
    this.burst(x, y, color, count);
  }

  /** Emit an expanding, fading shockwave ring (placement/impact/combo juice). */
  ripple(x, y, color = '#7c5cff', maxRadius = 90) {
    if (Quality.animationScale <= 0 || this._rings.length >= 16) return;
    this._rings.push({ x, y, color, t: 0, dur: 0.5, maxRadius });
  }

  /**
   * Emit `count` particles radiating from (x, y). Public so gameplay systems
   * can call it directly as well as via the event.
   */
  burst(x, y, color, count = 12) {
    if (Quality.animationScale <= 0) return;          // reduced motion
    count = Math.max(1, Math.round(count * Quality.animationScale));
    for (let i = 0; i < count; i++) {
      if (this._active.length >= Quality.maxParticles) break;
      const p = this._pool.acquire();
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 60 + Math.random() * 140;
      p.dead = false;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.ay = 220;                       // gentle gravity
      p.drag = 1.5;
      p.maxLife = p.life = 0.5 + Math.random() * 0.5;
      p.size = 3 + Math.random() * 4;
      p.color = color;
      this._active.push(p);
    }
  }

  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      if (p.step(dt)) {
        this._active.splice(i, 1);
        this._pool.release(p);
      }
    }
    for (let i = this._rings.length - 1; i >= 0; i--) {
      this._rings[i].t += dt;
      if (this._rings[i].t >= this._rings[i].dur) this._rings.splice(i, 1);
    }
  }

  render(renderer) {
    const ctx = renderer.ctx;

    // Shockwave rings (eased expansion, fading stroke).
    for (const ring of this._rings) {
      const k = ring.t / ring.dur;           // 0 -> 1
      const eased = 1 - (1 - k) * (1 - k);   // quadratic ease-out
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.maxRadius * eased, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of this._active) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  onDestroy() {
    this._active.length = 0;
    this._rings.length = 0;
  }
}
