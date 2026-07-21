/**
 * WorldSystem.js
 * -----------------------------------------------------------------------------
 * The animated backdrop the puzzle plays over: a parallax starfield and drifting
 * ambient particles themed to the current BIOME. As the player progresses and
 * the WorldProgressionSystem opens new biomes, this reskins itself — background
 * gradient, star colour and drift speed all shift — so the world visibly evolves.
 *
 * It renders FIRST (registered before the board) so everything draws on top.
 * The starfield is generated deterministically and pooled (zero per-frame
 * allocation) to protect the frame budget.
 *
 * Events:
 *   listens 'biome:changed' ({ biome }) — reskin the backdrop to a new biome
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Biomes } from '../../config/Biomes.js';
import { Random } from '../../utils/Random.js';

const STAR_COUNT = 110;

export class WorldSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'world';
    this._rng = new Random(1337); // fixed seed => stable starfield
    this._stars = [];
    this._biome = Biomes[0];
  }

  onInit() {
    this._buildStarfield();
    // The WorldProgressionSystem announces the biome for the current level.
    this.listen('biome:changed', ({ biome }) => this._setBiome(biome));
  }

  _setBiome(biome) {
    if (!biome || biome.id === this._biome.id) return;
    this._biome = biome;
    this._buildStarfield();
    this.events.emit('world:reskinned', { biome });
  }

  _buildStarfield() {
    const { width, height } = this.game.canvas;
    this._rng.seed(1337);
    this._stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      this._stars.push({
        x: this._rng.range(0, width),
        y: this._rng.range(0, height),
        r: this._rng.range(0.4, 1.8),
        depth: this._rng.range(0.2, 1),   // drives parallax speed + brightness
        twinkle: this._rng.range(0, Math.PI * 2),
      });
    }
  }

  update(dt) {
    const { height } = this.game.canvas;
    const speed = this._biome.drift;
    for (const s of this._stars) {
      s.y += speed * s.depth * dt;
      s.twinkle += dt * 2;
      if (s.y > height + 2) s.y = -2; // wrap to the top
    }
  }

  render(renderer) {
    // Biome background gradient, overscanned so screen-shake never reveals
    // bare edges as the whole scene is nudged around.
    const { width, height } = this.game.canvas;
    const bg = this._biome.background;
    const m = 48;
    const g = renderer.linearGradient(0, -m, 0, height + m,
      bg.map((c, i) => [i / (bg.length - 1), c]));
    renderer.fillRect(-m, -m, width + m * 2, height + m * 2, g);

    // Biome-tinted stars / motes.
    const ctx = renderer.ctx;
    ctx.fillStyle = this._biome.star;
    for (const s of this._stars) {
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.25 * s.depth + 0.25;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
