/**
 * WorldSystem.js
 * -----------------------------------------------------------------------------
 * The animated "cosmic" backdrop the puzzle plays over: a parallax starfield
 * and slow nebula drift that gives Cosmic Drift its identity. It also owns the
 * concept of "worlds/zones" the player progresses through (which reskin the
 * background), though progression logic itself is a later gameplay concern.
 *
 * It renders FIRST (registered before the board) so everything draws on top.
 * The starfield is generated deterministically and pooled — zero per-frame
 * allocation — to protect the frame budget.
 *
 * Events:
 *   listens 'world:setZone' ({ zoneId }) — swap the active zone theme
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Palette } from '../../config/Palette.js';
import { Random } from '../../utils/Random.js';

/** Zone definitions reskin the backdrop; extend freely for new worlds. */
const ZONES = Object.freeze({
  origin: { tint: Palette.accent, starCount: 90, driftSpeed: 6 },
  emberfield: { tint: Palette.warning, starCount: 110, driftSpeed: 9 },
  tidewalk: { tint: Palette.accentAlt, starCount: 130, driftSpeed: 5 },
});

export class WorldSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'world';
    this._rng = new Random(1337); // fixed seed => stable starfield
    this._stars = [];
    this._zoneId = 'origin';
    this._zone = ZONES.origin;
  }

  onInit() {
    this._buildStarfield();
    this.listen('world:setZone', ({ zoneId }) => this.setZone(zoneId));
  }

  /** Switch the active zone theme (background only in the foundation). */
  setZone(zoneId) {
    if (!ZONES[zoneId]) return;
    this._zoneId = zoneId;
    this._zone = ZONES[zoneId];
    this._buildStarfield();
    this.events.emit('world:zoneChanged', { zoneId });
  }

  _buildStarfield() {
    const { width, height } = this.game.canvas;
    this._rng.seed(1337);
    this._stars.length = 0;
    for (let i = 0; i < this._zone.starCount; i++) {
      this._stars.push({
        x: this._rng.range(0, width),
        y: this._rng.range(0, height),
        r: this._rng.range(0.4, 1.8),
        // Depth drives parallax speed and brightness.
        depth: this._rng.range(0.2, 1),
        twinkle: this._rng.range(0, Math.PI * 2),
      });
    }
  }

  update(dt) {
    const { height } = this.game.canvas;
    const speed = this._zone.driftSpeed;
    for (const s of this._stars) {
      s.y += speed * s.depth * dt;
      s.twinkle += dt * 2;
      if (s.y > height + 2) s.y = -2; // wrap to the top
    }
  }

  render(renderer) {
    // Base gradient.
    renderer.fillBackgroundGradient(Palette.background);

    // Stars.
    const ctx = renderer.ctx;
    for (const s of this._stars) {
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.25 * s.depth + 0.25;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
