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
    version: '0.1.0',
    /** Internal build channel: 'dev' | 'beta' | 'prod'. */
    channel: 'dev',
  }),

  /**
   * Logical render resolution. The game is authored against this fixed
   * portrait canvas and then scaled to fit the device by the Canvas core
   * class. All gameplay coordinates are expressed in these logical units,
   * which keeps layout identical across every screen size.
   */
  render: Object.freeze({
    width: 720,
    height: 1280,
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
    /** Schema version, independent of build version, drives migrations. */
    schemaVersion: 1,
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
    dragon: true,
    economy: true,
    missions: true,
    events: true,
    shop: true,
  }),

  /** Developer aids. Disabled automatically outside the 'dev' channel. */
  debug: Object.freeze({
    showFps: true,
    logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error' | 'silent'
    drawGridOutlines: false,
  }),
});
