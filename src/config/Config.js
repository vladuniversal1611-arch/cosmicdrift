/**
 * Config.js
 * -----------------------------------------------------------------------------
 * Global, immutable configuration for Cosmic Drift.
 *
 * This is the single source of truth for tunable constants. Systems read from
 * here instead of hard-coding magic numbers so that balancing, resolution
 * changes and feature toggles all live in one predictable place.
 *
 * NOTE: This file intentionally contains NO gameplay logic — only data.
 * Extend it by adding new namespaced sections; never scatter constants across
 * the codebase.
 * -----------------------------------------------------------------------------
 */

export const Config = Object.freeze({
  /** Human-readable metadata. */
  meta: Object.freeze({
    name: 'Cosmic Drift',
    /** Bump on every release; used by the SaveSystem migration layer. */
    version: '1.0.0',
    /** Internal build channel: 'dev' | 'beta' | 'prod'. Ship on 'prod' so the
     *  developer console, cheat keys and debug overlays are all disabled. */
    channel: 'prod',
  }),

  /**
   * Logical render resolution. The game is authored against this fixed
   * portrait canvas and then scaled to fit the device by the Canvas core
   * class. All gameplay coordinates are expressed in these logical units,
   * which keeps layout identical across every screen size.
   */
  render: Object.freeze({
    width: 1080,
    height: 2400,
    /** Target frame rate. The loop uses a fixed timestep derived from this. */
    targetFps: 60,
    /** Cap device pixel ratio to protect fill-rate on high-density panels. */
    maxDpr: 3,
    /** Master toggle for expensive glow / shadow passes on weak hardware. */
    highQuality: true,
  }),

  /**
   * Board defaults. Concrete gameplay (spawning, matching, scoring) is NOT
   * implemented in the foundation — these values only describe the grid so
   * that the BoardSystem can allocate its structures.
   */
  board: Object.freeze({
    columns: 8,
    rows: 8,
    /** Gap between cells, in logical pixels. */
    gutter: 6,
    /** Corner radius applied to cells when rendered. */
    cellRadius: 10,
  }),

  /**
   * Core gameplay tuning. Scoring, combo pacing and the Dragon Energy meter.
   * These are balance knobs — never hard-code these numbers elsewhere.
   */
  gameplay: Object.freeze({
    traySize: 3,
    /** Points awarded per block placed. */
    scorePerBlock: 5,
    /** Base points for clearing one line (row or column). */
    lineClearBase: 60,
    /** Each simultaneous line beyond the first multiplies the line payout. */
    multiLineBonus: 0.75,
    /** Combo multiplier growth per consecutive clearing placement. */
    comboStep: 0.5,
    /** Dragon Energy gained per line cleared (before combo scaling). */
    energyPerLine: 9,
    /** Full Dragon Energy bar value. */
    energyMax: 100,
  }),

  /**
   * Game-feel tuning: animation timings (seconds) and effect intensities.
   * This is where the "juice" is dialled in.
   */
  fx: Object.freeze({
    /** Idle crystal glow pulse period, seconds. */
    idleGlowPeriod: 2.4,
    /** Scale a piece grows to while held. */
    dragScale: 1.08,
    /** Lift (logical px) so the held piece sits above the finger. */
    dragLift: 90,
    /** Duration of the pick-up grow / drop-return tween. */
    pickupTime: 0.14,
    /** Landing squash-and-settle duration per placed block. */
    landTime: 0.34,
    /** Invalid-drop shake duration. */
    shakeTime: 0.3,
    /** Clear wave: seconds between each cell igniting along the line. */
    clearStagger: 0.045,
    /** How long a single cell's ignite→burst→empty takes. */
    clearCellTime: 0.42,
    /** Screen-shake base magnitude (px) for a single-line clear. */
    shakeBase: 5,
    /** Extra shake px added per combo level. */
    shakePerCombo: 3,
    /** Shake magnitude decay per second. */
    shakeDecay: 26,
  }),

  /**
   * Progression + Living Board tuning. Controls how fast worlds/levels roll
   * out new tile mechanics and how dense special tiles get. Early levels are
   * deliberately sparse so mechanics are discovered gradually, never dumped.
   */
  progression: Object.freeze({
    /** Levels per world; a new tile mechanic unlocks each world. */
    levelsPerWorld: 6,
    /** Lines to clear to complete a level: base + world * perWorld. */
    goalBase: 4,
    goalPerWorld: 2,
    /** Special tiles scale slowly with level, capped so the board stays fair. */
    maxSpecialTiles: 12,
    /** Turns (placements) a Treasure tile survives before vanishing. */
    treasureLifetimeTurns: 6,
    /** How often (in turns) Corruption spreads to a neighbour. */
    corruptionSpreadTurns: 3,
    /** Nearby clears needed to melt a Frozen tile. */
    frozenClears: 2,
    /** Chance per turn a Treasure tile spawns once the mechanic is unlocked. */
    treasureSpawnChance: 0.18,

    /** A restoration task unlocks every N completed levels. */
    restorationEvery: 5,

    /**
     * Per-level completion rewards, scaled by level: amount = base + perLevel*L.
     * These feed the World Progression economy (essence/gold/materials) plus a
     * flat Dragon Energy top-up.
     */
    rewards: Object.freeze({
      essence: { base: 4, perLevel: 1 },
      gold: { base: 10, perLevel: 2 },
      materials: { base: 3, perLevel: 0.5 },
      energy: 10,
    }),
  }),

  /**
   * Intelligent piece generator. Instead of pure random, the generator scores
   * shapes against the live board, tunes difficulty to the level + player, and
   * guarantees the tray is solvable so losses feel earned, never unlucky. All
   * knobs live here so the feel is fully configurable; set `enabled:false` to
   * fall back to plain weighted-random generation.
   */
  generator: Object.freeze({
    enabled: true,
    /** Attempts to assemble a difficulty-matched, provably-solvable tray. */
    solveAttempts: 14,
    /** Base chance to slip in a piece that enables an immediate line clear. */
    giftBaseChance: 0.12,
    /** Extra gift chance scaled by how much the player is struggling (DDA). */
    giftStruggleBonus: 0.5,
    /** Chance to offer a big, exciting, still-solvable piece once past the
     *  tutorial difficulty band (five-bars, rectangles, the 3×3 square). */
    excitingChance: 0.16,
    /** Difficulty curve: target shape "hardness" 0..1 = base + perLevel*level. */
    difficulty: Object.freeze({ base: 0.12, perLevel: 0.012, max: 0.9 }),
    /** Dynamic difficulty adjustment (generosity: + = easier, - = harder). */
    dda: Object.freeze({
      lossGenerosity: 0.15,   // per loss (ramps with a losing streak)
      winGenerosity: -0.04,   // per cleared level (ramps with a winning streak)
      min: -0.25,
      max: 1.0,
    }),
  }),

  /** Input tuning shared by the InputManager. */
  input: Object.freeze({
    /** Movement (in logical px) before a press is treated as a drag. */
    dragThreshold: 8,
    /** Max ms between press and release to still count as a tap. */
    tapMaxDuration: 250,
  }),

  /** Persistence configuration for the SaveSystem. */
  save: Object.freeze({
    storageKey: 'cosmicdrift.save.v1',
    /** Schema version, independent of build version, drives migrations.
     *  v2: collapsed the 5-currency wallet to Gold + Gems. */
    schemaVersion: 2,
    /** Debounce writes so rapid state changes don't thrash localStorage. */
    autosaveDebounceMs: 400,
  }),

  /**
   * Feature flags. Flip these to gate work-in-progress systems without
   * ripping code out. Every system checks its own flag during registration.
   */
  features: Object.freeze({
    audio: true,
    particles: true,
    economy: true,
    shop: true,
    boosters: true,
    // Pared down to a focused, Block-Blast-style game: two modes (Levels +
    // Endless) plus boosters. The heavier meta layers below are switched off —
    // their systems simply never register, and every caller already reaches
    // for them optionally, so the game runs clean without them.
    dragon: false,      // no dragon collection / perks
    events: false,      // no live/weekly events
    drift: false,       // no board-drift mechanic (pure classic placement)
    structures: false,  // no "structure pattern" board-evolution meta
  }),

  /** Board-drift tuning (feature disabled; kept for the seam). */
  drift: Object.freeze({
    everyPlacements: 5,
    steerCost: 35,
  }),

  /**
   * Advertising. The game only ever shows OPT-IN rewarded ads (free booster,
   * revive, hint) plus occasional interstitials at natural breaks — never
   * during play. Real ads arrive through a native AdMob bridge when the game
   * runs inside its Android wrapper; in a plain browser a simulated provider
   * stands in so the flows still work.
   *
   * ⚠️ The unit IDs below are Google's official PUBLIC TEST ids — safe to build
   * and click during development, but you MUST replace them with your own real
   * AdMob ids before publishing (and never click your own live ads).
   */
  ads: Object.freeze({
    enabled: true,
    admob: Object.freeze({
      appId: 'ca-app-pub-3940256099942544~3347511713',       // TEST app id
      rewarded: 'ca-app-pub-3940256099942544/5224354917',     // TEST rewarded
      interstitial: 'ca-app-pub-3940256099942544/1033173712', // TEST interstitial
    }),
    interstitial: Object.freeze({
      minGames: 2,         // no interstitials until 2 runs have ended
      cooldownSec: 90,     // minimum gap between interstitials
      afterRewardedSec: 8, // never stack right after a rewarded ad
    }),
  }),

  /** Developer aids — release values (no on-screen FPS, quiet logs). */
  debug: Object.freeze({
    showFps: false,
    logLevel: 'warn', // 'debug' | 'info' | 'warn' | 'error' | 'silent'
    drawGridOutlines: false,
  }),
});
