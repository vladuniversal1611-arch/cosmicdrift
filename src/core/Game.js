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
import { AnalyticsSystem } from '../systems/analytics/AnalyticsSystem.js';
import { MonetizationSystem } from '../systems/monetization/MonetizationSystem.js';
import { AudioSystem } from '../systems/audio/AudioSystem.js';
import { AnimationSystem } from '../systems/animation/AnimationSystem.js';
import { ParticleSystem } from '../systems/particles/ParticleSystem.js';
import { GameplaySystem } from '../systems/gameplay/GameplaySystem.js';
import { LevelSystem } from '../systems/progression/LevelSystem.js';
import { ObjectivesSystem } from '../systems/objectives/ObjectivesSystem.js';
import { WorldProgressionSystem } from '../systems/world/WorldProgressionSystem.js';
import { RetentionSystem } from '../systems/retention/RetentionSystem.js';
import { TileSystem } from '../systems/tiles/TileSystem.js';
import { StructureSystem } from '../systems/structures/StructureSystem.js';
import { BoardSystem } from '../systems/board/BoardSystem.js';
import { PieceSystem } from '../systems/pieces/PieceSystem.js';
import { WorldSystem } from '../systems/world/WorldSystem.js';
import { DragonSystem } from '../systems/dragon/DragonSystem.js';
import { EconomySystem } from '../systems/economy/EconomySystem.js';
import { EventsSystem } from '../systems/events/EventsSystem.js';
import { ShopSystem } from '../systems/shop/ShopSystem.js';
import { BoosterSystem } from '../systems/boosters/BoosterSystem.js';
import { AchievementSystem } from '../systems/achievements/AchievementSystem.js';
import { DriftSystem } from '../systems/drift/DriftSystem.js';
import { UISystem } from '../ui/UISystem.js';
import { PerformanceManager } from '../systems/performance/PerformanceManager.js';
import { DebugManager } from '../systems/debug/DebugManager.js';
import { ThemeManager } from '../systems/theme/ThemeManager.js';
import { PopupManager } from '../systems/ui/PopupManager.js';
import { OnboardingSystem } from '../systems/onboarding/OnboardingSystem.js';

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
    // Vendor-agnostic analytics hooks (listens to everything, no provider).
    this.systems.register(new AnalyticsSystem(this));
    // Cross-cutting infrastructure managers (measure/skin/debug — no gameplay).
    this.systems.register(new ThemeManager(this));
    this.systems.register(new DebugManager(this));
    this.systems.register(new PerformanceManager(this));

    // Simulation-support systems.
    if (f.audio) this.systems.register(new AudioSystem(this));
    if (f.economy) this.systems.register(new EconomySystem(this));
    if (f.events) this.systems.register(new EventsSystem(this));
    if (f.shop) this.systems.register(new ShopSystem(this));
    if (f.dragon) this.systems.register(new DragonSystem(this));
    // Long-term meta: rewards, restorations and biome unlocks.
    this.systems.register(new WorldProgressionSystem(this));
    // Retention: daily/weekly loops, surprises, unlock reveals, failure comfort.
    this.systems.register(new RetentionSystem(this));
    // Awards: tracks real play stats and unlocks milestone achievements.
    this.systems.register(new AchievementSystem(this));
    // Store / ads / entitlements architecture (player-first, nothing shown).
    this.systems.register(new MonetizationSystem(this));

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
    // In-level power-ups (additive help; never feeds score/objectives).
    if (f.boosters) this.systems.register(new BoosterSystem(this));
    // Cosmic Drift: the signature board-drift mechanic (renders its telegraph
    // above the board, so it is registered after BoardSystem).
    if (f.drift) this.systems.register(new DriftSystem(this));

    // Presentation — updated after gameplay, drawn on top.
    this.systems.register(new AnimationSystem(this));
    if (f.particles) this.systems.register(new ParticleSystem(this));
    // Popup orchestration owns the modal queue; register before the UI so it is
    // ready to serialise any popup the UI opens on boot.
    this.systems.register(new PopupManager(this));
    this.systems.register(new UISystem(this));
    // First-run coach — draws last so its spotlight sits above the HUD.
    this.systems.register(new OnboardingSystem(this));
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
    // Full-screen juice (flash / golden finale overlay) sits above everything.
    this.getSystem('gameplay')?.renderOverlay(r);
    r.end();

    // The DebugManager owns the live flag; fall back to the frozen default
    // until it has registered (e.g. earliest frames / prod channel).
    const showFps = this.getSystem('debug')?.get('showFps') ?? Config.debug.showFps;
    if (showFps) this._drawFps(r);
  }

  /** Minimal on-screen FPS readout for development. */
  _drawFps(r) {
    r.text(`${this.time.fps} FPS`, 12, 24, {
      font: '600 16px system-ui, sans-serif',
      color: 'rgba(255,255,255,0.5)',
    });
  }

  /**
   * Return every system to a clean, pre-game state without tearing down the
   * game (subscriptions and core services stay live). Broadcasts `game:reset`
   * so systems that don't override `onReset` can still react if they wish.
   */
  reset() {
    this.systems.resetAll();
    this.events.emit('game:reset');
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
