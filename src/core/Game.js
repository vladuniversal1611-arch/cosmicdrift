/**
 * Game.js
 * -----------------------------------------------------------------------------
 * The application root. Owns the core services (canvas, renderer, input,
 * events, time, loop) and the SystemManager, and drives the per-frame
 * update/render pipeline.
 *
 * Game is deliberately thin: it wires things together and delegates. It does
 * NOT contain gameplay logic — that lives in the individual systems, each of
 * which is registered here. To add a new system in a future update you only
 * touch `_registerSystems()`.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { Time } from './Time.js';
import { Canvas } from './Canvas.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { SystemManager } from './SystemManager.js';
import { GameLoop } from './GameLoop.js';

// Systems. Each is self-contained; the imports here are the ONLY place that
// knows the full roster. Feature flags in Config gate optional systems.
import { SaveSystem } from '../systems/save/SaveSystem.js';
import { SettingsSystem } from '../systems/settings/SettingsSystem.js';
import { AudioSystem } from '../systems/audio/AudioSystem.js';
import { AnimationSystem } from '../systems/animation/AnimationSystem.js';
import { ParticleSystem } from '../systems/particles/ParticleSystem.js';
import { GameplaySystem } from '../systems/gameplay/GameplaySystem.js';
import { LevelSystem } from '../systems/progression/LevelSystem.js';
import { ObjectivesSystem } from '../systems/objectives/ObjectivesSystem.js';
import { WorldProgressionSystem } from '../systems/world/WorldProgressionSystem.js';
import { TileSystem } from '../systems/tiles/TileSystem.js';
import { StructureSystem } from '../systems/structures/StructureSystem.js';
import { BoardSystem } from '../systems/board/BoardSystem.js';
import { PieceSystem } from '../systems/pieces/PieceSystem.js';
import { WorldSystem } from '../systems/world/WorldSystem.js';
import { DragonSystem } from '../systems/dragon/DragonSystem.js';
import { EconomySystem } from '../systems/economy/EconomySystem.js';
import { MissionSystem } from '../systems/missions/MissionSystem.js';
import { EventsSystem } from '../systems/events/EventsSystem.js';
import { ShopSystem } from '../systems/shop/ShopSystem.js';
import { UISystem } from '../ui/UISystem.js';

export class Game {
  /**
   * @param {HTMLCanvasElement} canvasEl The canvas to render into.
   */
  constructor(canvasEl) {
    // --- Core services ------------------------------------------------------
    this.events = new EventBus();
    this.time = new Time();
    this.canvas = new Canvas(canvasEl);
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager(this.canvas, this.events);
    this.systems = new SystemManager();
    this.loop = new GameLoop(
      (dt) => this._update(dt),
      (alpha) => this._render(alpha),
    );

    this._started = false;
  }

  /** Convenience passthrough so systems can query siblings when unavoidable. */
  getSystem(name) { return this.systems.get(name); }

  /**
   * Boot the game: init core services, register + init systems, start the loop.
   * Safe to call once.
   */
  start() {
    if (this._started) return;
    this._started = true;

    Logger.info('Game', `${Config.meta.name} v${Config.meta.version} starting`);

    this.canvas.init();
    this.input.init();

    this._registerSystems();
    this.systems.initAll();

    // Announce readiness so systems can perform any post-init cross-talk.
    this.events.emit('game:ready');

    this.time.start(performance.now());
    this.loop.start();
    Logger.info('Game', 'running');
  }

  /**
   * The single place that declares which systems exist and their order.
   * Order matters: state/config systems first, presentation systems last.
   */
  _registerSystems() {
    const f = Config.features;

    // Foundational state — no dependencies on visuals.
    this.systems.register(new SaveSystem(this));
    this.systems.register(new SettingsSystem(this));

    // Simulation-support systems.
    if (f.audio) this.systems.register(new AudioSystem(this));
    if (f.economy) this.systems.register(new EconomySystem(this));
    if (f.missions) this.systems.register(new MissionSystem(this));
    if (f.events) this.systems.register(new EventsSystem(this));
    if (f.shop) this.systems.register(new ShopSystem(this));
    if (f.dragon) this.systems.register(new DragonSystem(this));
    // Long-term meta: rewards, restorations and biome unlocks.
    this.systems.register(new WorldProgressionSystem(this));

    // Core gameplay: the rules brain updates before the board/pieces so its
    // screen-shake offset is set before anything renders this frame. The
    // LevelSystem drives progression; the TileSystem is the Living Board.
    this.systems.register(new GameplaySystem(this));
    this.systems.register(new LevelSystem(this));
    // Objectives drive level completion; built from each level's unlocks.
    this.systems.register(new ObjectivesSystem(this));
    this.systems.register(new WorldSystem(this));
    this.systems.register(new BoardSystem(this));
    this.systems.register(new TileSystem(this));
    // Structures render above the board crystals but below the held piece.
    this.systems.register(new StructureSystem(this));
    this.systems.register(new PieceSystem(this));

    // Presentation — updated after gameplay, drawn on top.
    this.systems.register(new AnimationSystem(this));
    if (f.particles) this.systems.register(new ParticleSystem(this));
    this.systems.register(new UISystem(this));
  }

  _update(dt) {
    this.time.tick(performance.now());
    // Feed the loop's fixed dt to systems (not time.delta) for determinism;
    // time.delta/scale remain available for effects that want wall-clock feel.
    this.systems.updateAll(dt * this.time.scale);
  }

  _render() {
    const r = this.renderer;
    r.begin();
    this.systems.renderAll(r);
    r.end();

    if (Config.debug.showFps) this._drawFps(r);
  }

  /** Minimal on-screen FPS readout for development. */
  _drawFps(r) {
    r.text(`${this.time.fps} FPS`, 12, 24, {
      font: '600 16px system-ui, sans-serif',
      color: 'rgba(255,255,255,0.5)',
    });
  }

  /** Full teardown — useful for hot-reload and WebView lifecycle events. */
  destroy() {
    this.loop.stop();
    this.systems.destroyAll();
    this.input.destroy();
    this.canvas.destroy();
    this.events.clear();
    this._started = false;
  }
}
