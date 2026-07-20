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

const MAX_PARTICLES = 400;

export class ParticleSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'particles';
    this._active = [];
    this._pool = new ObjectPool(() => new Particle(), (p) => p.reset(), 128);
    this._reducedMotion = false;
  }

  onInit() {
    const settings = this.game.getSystem('settings');
    this._reducedMotion = settings ? settings.get('reducedMotion') : false;
    this.listen('settings:changed', ({ key, value }) => {
      if (key === 'reducedMotion') this._reducedMotion = value;
    });
    this.listen('fx:burst', this._onBurst);
  }

  _onBurst({ x, y, color = '#fff', count = 12 }) {
    this.burst(x, y, color, count);
  }

  /**
   * Emit `count` particles radiating from (x, y). Public so gameplay systems
   * can call it directly as well as via the event.
   */
  burst(x, y, color, count = 12) {
    if (this._reducedMotion) return;
    for (let i = 0; i < count; i++) {
      if (this._active.length >= MAX_PARTICLES) break;
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
  }

  render(renderer) {
    if (this._active.length === 0) return;
    const ctx = renderer.ctx;
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
  }
}
