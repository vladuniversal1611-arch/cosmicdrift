/**
 * WorldSystem.js
 * -----------------------------------------------------------------------------
 * The living, sunlit backdrop the puzzle plays over: a bright sky with a warm
 * floating island, drifting parallax clouds, animated waterfalls, flying
 * dragons, lazily falling leaves, soft god-rays and gently drifting light motes.
 * Themed to the current BIOME — as the player climbs and new biomes open, a warm
 * colour wash and mote tint shift so the world visibly evolves, but it is ALWAYS
 * bright and warm, never dark.
 *
 * It renders FIRST (registered before the board) so everything draws on top.
 * The island/clouds/dragons come from the shared MenuBackground so the whole
 * game feels like one cohesive world; motes are pooled for a stable frame budget.
 *
 * Events:
 *   listens 'biome:changed' ({ biome }) — reskin the backdrop to a new biome
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Biomes } from '../../config/Biomes.js';
import { Random } from '../../utils/Random.js';
import { MenuBackground } from '../../ui/theme/MenuBackground.js';

const MOTE_COUNT = 60;

export class WorldSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'world';
    this._rng = new Random(1337); // fixed seed => stable motes
    this._motes = [];
    this._biome = Biomes[0];
    this._sky = null;
    this._t = 0;
  }

  onInit() {
    this._rebuild();
    window.addEventListener('resize', () => this._rebuild());
    // The WorldProgressionSystem announces the biome for the current level.
    this.listen('biome:changed', ({ biome }) => this._setBiome(biome));
  }

  _setBiome(biome) {
    if (!biome || biome.id === this._biome.id) return;
    this._biome = biome;
    this._rebuild();
    this.events.emit('world:reskinned', { biome });
  }

  _rebuild() {
    const { width, height } = this.game.canvas;
    this._sky = new MenuBackground(width, height);
    this._rng.seed(1337);
    this._motes.length = 0;
    for (let i = 0; i < MOTE_COUNT; i++) {
      this._motes.push({
        x: this._rng.range(0, width),
        y: this._rng.range(0, height),
        r: this._rng.range(1, 3.4),
        depth: this._rng.range(0.2, 1),   // drives parallax speed + brightness
        twinkle: this._rng.range(0, Math.PI * 2),
      });
    }
  }

  update(dt) {
    this._t += dt;
    this._sky?.update(dt);
    const { height } = this.game.canvas;
    const speed = this._biome.drift;
    for (const m of this._motes) {
      m.y -= speed * m.depth * dt * 3;       // motes rise like fireflies/pollen
      m.x += Math.sin(this._t * 0.6 + m.twinkle) * 4 * dt;
      m.twinkle += dt * 2;
      if (m.y < -4) m.y = height + 4;        // wrap to the bottom
    }
  }

  render(renderer) {
    const { width, height } = this.game.canvas;

    // 1) The living bright-sky world (sky, sun-glow, clouds, floating island,
    //    waterfalls, dragons, leaves) — shared with the menus for cohesion.
    this._sky.render(renderer);

    // 2) A warm biome colour wash so each world feels distinct without ever
    //    going dark. Kept very light so the sky reads through it.
    const bg = this._biome.background;
    renderer.setAlpha(0.22);
    const wash = renderer.linearGradient(0, 0, 0, height,
      [[0, bg[0]], [0.55, bg[1]], [1, bg[2]]]);
    renderer.fillRect(0, 0, width, height, wash);
    renderer.setAlpha(1);

    // 3) Soft god-rays fanning from the sun.
    this._drawRays(renderer, width, height);

    // 4) Biome-tinted drifting light motes.
    const ctx = renderer.ctx;
    ctx.fillStyle = this._biome.star;
    for (const m of this._motes) {
      const alpha = 0.25 + Math.max(0, Math.sin(m.twinkle)) * 0.4 * m.depth;
      ctx.globalAlpha = Math.max(0, Math.min(0.7, alpha));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Soft warm sunlight rays sweeping from the top of the sky. */
  _drawRays(renderer, width, height) {
    const ctx = renderer.ctx;
    const cx = width * 0.5, cy = -height * 0.12;
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(this._t * 0.05) * 0.15);
    ctx.fillStyle = '#fff6d6';
    for (let i = 0; i < 9; i++) {
      ctx.rotate((Math.PI) / 9);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-30, height * 1.4);
      ctx.lineTo(30, height * 1.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
