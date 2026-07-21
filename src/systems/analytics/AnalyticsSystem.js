/**
 * AnalyticsSystem.js
 * -----------------------------------------------------------------------------
 * Vendor-agnostic analytics hooks. It listens to the game's existing event bus
 * and normalises meaningful moments into analytics events, then forwards them
 * to a pluggable provider. NO provider ships — the default just buffers events
 * (capped) and debug-logs them — so wiring GameAnalytics / Firebase / Amplitude
 * later is a one-line `analytics.setProvider(...)`, nothing else changes.
 *
 * Covered: session start/end + length, level start/complete/fail, economy,
 * reward collection, purchases, structures/restorations, biome unlocks, events.
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Logger } from '../../utils/Logger.js';

export class AnalyticsSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'analytics';
    /** provider: { track(name, params) } | null */
    this._provider = null;
    this._buffer = [];       // ring buffer of recent events (for QA / late attach)
    this._max = 200;
    this._sessionStart = 0;
    this._levelStart = 0;
  }

  /** Attach a real analytics backend (flushes buffered events to it). */
  setProvider(provider) {
    this._provider = provider;
    if (provider) for (const e of this._buffer) provider.track(e.name, e.params);
  }

  /** Record an analytics event. */
  track(name, params = {}) {
    const evt = { name, params, t: Date.now() };
    this._buffer.push(evt);
    if (this._buffer.length > this._max) this._buffer.shift();
    Logger.debug('Analytics', name, params);
    this._provider?.track(name, params);
  }

  onInit() {
    this._sessionStart = Date.now();
    this.track('session_start', {});

    this.listen('game:started', () => this.track('game_start', {}));
    this.listen('level:changed', ({ level, world, worldName }) => {
      this._levelStart = Date.now();
      this.track('level_start', { level, world, worldName });
    });
    this.listen('level:complete', ({ level }) => {
      this.track('level_complete', { level, durationMs: Date.now() - this._levelStart });
    });
    this.listen('game:over', () => this.track('level_fail', { durationMs: Date.now() - this._levelStart }));
    this.listen('objectives:allComplete', () => this.track('objectives_complete', {}));

    this.listen('reward:granted', (p) => this.track('reward_collected', p));
    this.listen('economy:changed', ({ currencyId, balance, delta }) => this.track('economy', { currencyId, balance, delta }));
    this.listen('shop:purchased', ({ item }) => this.track('purchase', { id: item?.id, source: 'shop' }));
    this.listen('monetization:purchased', (p) => this.track('purchase', { ...p, source: 'iap' }));
    this.listen('ads:rewarded', (p) => this.track('ad_rewarded', p));

    this.listen('structure:completed', ({ id }) => this.track('structure_built', { id }));
    this.listen('world:restored', ({ task }) => this.track('restoration_complete', { id: task?.id }));
    this.listen('biome:changed', ({ biome }) => this.track('biome_unlocked', { id: biome?.id }));
    this.listen('liveEvent:started', ({ event }) => this.track('event_started', { id: event?.id }));
  }

  /** Flush a session-length event (called on app background / teardown). */
  endSession() {
    this.track('session_end', { lengthMs: Date.now() - this._sessionStart });
  }

  onDestroy() { this.endSession(); }
}
