/**
 * ManagerRegistry.js
 * -----------------------------------------------------------------------------
 * The single source of truth for the game's MANAGER VOCABULARY.
 *
 * Cosmic Drift's architecture is a flat set of single-responsibility managers
 * that talk only through the EventBus and share one lifecycle
 * (`Initialize / Update / Reset / Dispose`, see core/System.js). This file maps
 * every canonical manager name to the module that implements it, so tooling,
 * docs and newcomers have one authoritative index — without duplicating any
 * logic into wrapper classes.
 *
 * `owner` is the SystemManager key you pass to `game.getSystem(...)` (or a core
 * service on `game`). `status`:
 *   'core'      – a core service on the Game object (not in SystemManager).
 *   'manager'   – a registered System with this exact single responsibility.
 *   'module'    – a stateless/pure module reused by a manager (no lifecycle).
 *   'embedded'  – responsibility currently lives inside the `owner` manager;
 *                 earmarked for extraction into its own file (see ARCHITECTURE).
 *
 * This module is DATA ONLY: it imports nothing and mutates nothing.
 * -----------------------------------------------------------------------------
 */

/** @typedef {'core'|'manager'|'module'|'embedded'} ManagerStatus */

/** Canonical manager name → where its single responsibility lives. */
export const MANAGERS = Object.freeze({
  GameManager: { status: 'core', owner: 'game', file: 'core/Game.js', role: 'Application root: owns core services + the manager registry and drives the frame loop.' },
  SceneManager: { status: 'manager', owner: 'ui', file: 'ui/UISystem.js', role: 'Screen/scene stack: push/pop/replace menu, gameplay HUD, world map, overlays.' },
  BoardManager: { status: 'manager', owner: 'board', file: 'systems/board/BoardSystem.js', role: 'Owns the grid model + board rendering; resolves placements into the grid.' },
  PieceManager: { status: 'manager', owner: 'pieces', file: 'systems/pieces/PieceSystem.js', role: 'Owns the tray, drag/drop lifecycle and committing a piece to the board.' },
  PieceGenerator: { status: 'module', owner: 'pieces', file: 'systems/pieces/PieceGenerator.js', role: 'Board-aware, difficulty-tuned, provably-solvable tray generation.' },
  PlacementValidator: { status: 'module', owner: 'board', file: 'systems/board/PlacementValidator.js', role: 'Pure placement rules: can a piece sit at (col,row); enumerate valid cells.' },
  LineClearSystem: { status: 'embedded', owner: 'board', file: 'systems/board/BoardSystem.js', role: 'Detects full rows/columns and drives the clear animation timeline.' },
  ComboSystem: { status: 'embedded', owner: 'gameplay', file: 'systems/gameplay/GameplaySystem.js', role: 'Combo chain: consecutive clearing placements raise/break the multiplier.' },
  ScoreManager: { status: 'embedded', owner: 'gameplay', file: 'systems/gameplay/GameplaySystem.js', role: 'Score + best: placement points, line payout, combo & structure multipliers.' },
  MissionManager: { status: 'manager', owner: 'missions', file: 'systems/missions/MissionSystem.js', role: 'Generic mission/quest progress tracking against gameplay events.' },
  ProgressManager: { status: 'manager', owner: 'level', file: 'systems/progression/LevelSystem.js', role: 'Current level/world, per-level layout generation, advance-on-complete.' },
  SaveManager: { status: 'manager', owner: 'save', file: 'systems/save/SaveSystem.js', role: 'Versioned, sliced persistence with debounce + backup recovery.' },
  SettingsManager: { status: 'manager', owner: 'settings', file: 'systems/settings/SettingsSystem.js', role: 'Player settings + accessibility; writes the live Quality flags.' },
  InputManager: { status: 'core', owner: 'input', file: 'core/InputManager.js', role: 'Normalises pointer/touch into tap / down / move / up events.' },
  AudioManager: { status: 'manager', owner: 'audio', file: 'systems/audio/AudioSystem.js', role: 'Sound effects + music playback in response to game events.' },
  AnimationManager: { status: 'manager', owner: 'animation', file: 'systems/animation/AnimationSystem.js', role: 'Tween registry: eased property animations advanced each frame.' },
  ParticleManager: { status: 'manager', owner: 'particles', file: 'systems/particles/ParticleSystem.js', role: 'Pooled particle bursts/ripples driven by fx:* events.' },
  AssetManager: { status: 'module', owner: 'assets', file: 'ui/assets/AssetManager.js', role: 'Logical-key → file registry + loader with procedural fallbacks (singleton).' },
  ThemeManager: { status: 'manager', owner: 'theme', file: 'systems/theme/ThemeManager.js', role: 'Selects/applies the active visual theme (tokens + asset base path).' },
  LocalizationManager: { status: 'module', owner: 'i18n', file: 'i18n/Localization.js', role: 'Key → localized string lookup with the active locale table.' },
  UIManager: { status: 'manager', owner: 'ui', file: 'ui/UISystem.js', role: 'Routes input to the active screen and drives UI update/render.' },
  PopupManager: { status: 'embedded', owner: 'ui', file: 'ui/UISystem.js', role: 'Modal/popup open-close semantics layered on the scene stack.' },
  TutorialManager: { status: 'embedded', owner: 'retention', file: 'systems/retention/RetentionSystem.js', role: 'First-run guidance / onboarding step progression (state owner).' },
  RewardManager: { status: 'embedded', owner: 'worldprogress', file: 'systems/world/WorldProgressionSystem.js', role: 'Grants and queues rewards for presentation (ui:showReward).' },
  AnalyticsManager: { status: 'manager', owner: 'analytics', file: 'systems/analytics/AnalyticsSystem.js', role: 'Vendor-agnostic funnel/event telemetry taps (no provider bundled).' },
  PerformanceManager: { status: 'manager', owner: 'performance', file: 'systems/performance/PerformanceManager.js', role: 'Samples FPS and adapts the global quality tier under load.' },
  DebugManager: { status: 'manager', owner: 'debug', file: 'systems/debug/DebugManager.js', role: 'Owns live debug flags; toggles FPS/grid overlays via events.' },
});

/** All canonical manager names, in declaration order. */
export const MANAGER_NAMES = Object.freeze(Object.keys(MANAGERS));

/**
 * Resolve a canonical manager name to its live instance, when it is a
 * registered System or a core service. Returns undefined for pure modules
 * (import those directly) and for `embedded` responsibilities (use the owner).
 * @param {import('../core/Game.js').Game} game
 * @param {string} name canonical manager name (e.g. 'AudioManager')
 */
export function resolveManager(game, name) {
  const entry = MANAGERS[name];
  if (!entry) return undefined;
  if (entry.status === 'core') return game[entry.owner];
  return game.getSystem(entry.owner);
}
