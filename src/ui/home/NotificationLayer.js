/**
 * NotificationLayer.js  (Home Screen · section: NOTIFICATION LAYER)
 * -----------------------------------------------------------------------------
 * A pooled, priority-ordered toast stack that never overlaps. Any system can
 * push a notification via the `notify:push` event; higher priority shows first,
 * up to a small visible cap, and toasts slide/fade in and out (animation math
 * from the shared Motion helper). Toast objects are recycled from a fixed pool
 * so no per-notification allocation happens at runtime.
 *
 * Events: listens `notify:push` ({ text, priority, ms, color }).
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI } from '../theme/UITheme.js';

const MAX_VISIBLE = 3;
const POOL_SIZE = 12;

export class NotificationLayer {
  constructor(game, safe) {
    this.game = game;
    this.safe = safe;
    this._t = 0;
    // Fixed pool — recycled, never re-allocated.
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) this._pool.push({ active: false });
    this._queue = [];      // pending descriptors (priority-sorted)
    this._live = [];       // currently showing pool entries
    this._off = null;
  }

  attach() {
    this._off?.();   // idempotent: drop any prior handler first
    this._off = this.game.events.on('notify:push', (d) => this.push(d));
    return this;
  }
  detach() { this._off?.(); this._off = null; }

  /** Enqueue a notification. Higher `priority` shows sooner. */
  push({ text = '', priority = 0, ms = 2600, color = null } = {}) {
    this._queue.push({ text, priority, ms, color });
    this._queue.sort((a, b) => b.priority - a.priority);
  }

  _acquire() { return this._pool.find((p) => !p.active) ?? null; }

  update(dt) {
    this._t += dt;
    // Promote queued notifications into free visible slots.
    while (this._live.length < MAX_VISIBLE && this._queue.length) {
      const slot = this._acquire();
      if (!slot) break;
      const d = this._queue.shift();
      Object.assign(slot, { active: true, text: d.text, color: d.color, life: d.ms / 1000, age: 0, in: 0 });
      this._live.push(slot);
    }
    // Advance + retire.
    for (let i = this._live.length - 1; i >= 0; i--) {
      const s = this._live[i];
      s.age += dt;
      s.in = Math.min(1, s.in + dt * 4);
      if (s.age >= s.life) { s.active = false; this._live.splice(i, 1); }
    }
  }

  render(r) {
    const cx = this.safe.centerX;
    const w = Math.min(660, this.safe.contentWidth);
    const h = 84, gap = 14;
    // Stack downward from just under the resource bar; never overlap.
    const top = this.safe.header.y + this.safe.header.h + 116;
    this._live.forEach((s, i) => {
      const appear = 1 - Math.pow(1 - s.in, 3);           // easeOutCubic
      const fadeOut = s.age > s.life - 0.4 ? Math.max(0, (s.life - s.age) / 0.4) : 1;
      const a = appear * fadeOut;
      const y = top + i * (h + gap) - (1 - appear) * 20;
      r.setAlpha(a);
      UITheme.glassPanel(r, cx - w / 2, y, w, h, 24);
      if (s.color) { r.setAlpha(a * 0.9); r.fillCircle(cx - w / 2 + h * 0.5, y + h / 2, h * 0.22, s.color); r.setAlpha(a); }
      r.text(s.text, cx + (s.color ? h * 0.2 : 0), y + h / 2, {
        font: '800 26px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
      });
      r.setAlpha(1);
    });
  }
}
