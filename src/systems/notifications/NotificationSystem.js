/**
 * NotificationSystem.js
 * -----------------------------------------------------------------------------
 * Re-engagement reminders — "don't forget to play" local notifications, the
 * standard retention hook for a casual game. LOCAL (on-device, no server):
 * when the player leaves we schedule a few reminders (daily-gift ready, "we
 * miss you", new levels); when they return we cancel the pending ones so an
 * active player is never pinged.
 *
 * Delivery is native-only. Two paths are supported, picked at runtime:
 *   1. Capacitor  — the @capacitor/local-notifications plugin
 *                   (window.Capacitor.Plugins.LocalNotifications). PRIMARY.
 *   2. Plain WebView bridge — window.AndroidNotify (legacy hand-rolled wrapper).
 * On the web (neither present) it's a graceful no-op.
 *
 * Events: listens 'input:down' (permission), plus the app-lifecycle DOM events.
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { t } from '../../i18n/Localization.js';

/**
 * The reminder ladder — each fires `delayDays` after the player last left,
 * unless they return first (then all pending are cancelled and re-armed on the
 * next exit). Numeric `nid` is required by the Capacitor plugin.
 */
const REMINDERS = [
  { id: 'gift', nid: 1, delayDays: 1, titleKey: 'notif.gift.title', bodyKey: 'notif.gift.body' },
  { id: 'miss', nid: 2, delayDays: 3, titleKey: 'notif.miss.title', bodyKey: 'notif.miss.body' },
  { id: 'levels', nid: 3, delayDays: 7, titleKey: 'notif.levels.title', bodyKey: 'notif.levels.body' },
];

/**
 * A DAILY habit reminder that repeats every day at a fixed local time (default
 * 19:00). Scheduled when the app is backgrounded and cancelled when the player
 * returns — so an active player is never pinged, but on any day they haven't
 * opened the game by this time they get a nudge. This is the "every day"
 * retention ping, separate from the lapsed-player ladder above.
 */
const DAILY = { nid: 4, hour: 19, minute: 0, titleKey: 'notif.daily.title', bodyKey: 'notif.daily.body' };

export class NotificationSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'notifications';
    this._ln = null;        // Capacitor LocalNotifications plugin
    this._bridge = null;    // legacy window.AndroidNotify
    this._permAsked = false;
  }

  onInit() {
    if (typeof window !== 'undefined') {
      this._ln = window.Capacitor?.Plugins?.LocalNotifications ?? null;
      if (!this._ln && window.AndroidNotify && typeof window.AndroidNotify.schedule === 'function') {
        this._bridge = window.AndroidNotify;
      }
    }
    if (!this._ln && !this._bridge) return;   // web / no wrapper → nothing to do

    this.listen('input:down', () => this._askPermissionOnce());

    if (typeof document !== 'undefined') {
      this._onHidden = () => this._scheduleReminders();
      this._onShown = () => this._clearReminders();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this._onHidden(); else this._onShown();
      });
      window.addEventListener('pagehide', this._onHidden);
      window.addEventListener('blur', this._onHidden);
      window.addEventListener('focus', this._onShown);
    }
  }

  _askPermissionOnce() {
    if (this._permAsked) return;
    this._permAsked = true;
    try {
      if (this._ln) this._ln.requestPermissions?.();
      else this._bridge?.requestPermission?.();
    } catch { /* older wrapper */ }
  }

  /** Queue the reminder ladder (called when the app is backgrounded/closed). */
  _scheduleReminders() {
    try {
      if (this._ln) {
        const now = Date.now();
        const notifications = REMINDERS.map((r) => ({
          id: r.nid,
          title: t(r.titleKey),
          body: t(r.bodyKey),
          schedule: { at: new Date(now + r.delayDays * 86400000) },
        }));
        // Daily habit ping: repeats every day at DAILY.hour:DAILY.minute local.
        notifications.push({
          id: DAILY.nid,
          title: t(DAILY.titleKey),
          body: t(DAILY.bodyKey),
          schedule: { on: { hour: DAILY.hour, minute: DAILY.minute }, repeats: true, allowWhileIdle: true },
        });
        this._ln.cancel?.({ notifications: notifications.map((n) => ({ id: n.id })) });
        this._ln.schedule?.({ notifications });
      } else if (this._bridge) {
        this._bridge.cancelAll?.();
        for (const r of REMINDERS) {
          this._bridge.schedule(r.id, r.delayDays * 86400, t(r.titleKey), t(r.bodyKey));
        }
        // Legacy bridge has no repeat primitive — schedule the next occurrence
        // of the daily time as a one-off (best effort; Capacitor is the real path).
        this._bridge.schedule(String(DAILY.nid), this._secondsUntilDaily(), t(DAILY.titleKey), t(DAILY.bodyKey));
      }
    } catch { /* bridge/plugin went away */ }
  }

  /** Seconds from now until the next DAILY.hour:DAILY.minute (legacy path). */
  _secondsUntilDaily() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(DAILY.hour, DAILY.minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);   // already passed today → tomorrow
    return Math.max(60, Math.round((next - now) / 1000));
  }

  /** Drop pending reminders (called when the player returns). */
  _clearReminders() {
    try {
      if (this._ln) this._ln.cancel?.({ notifications: [...REMINDERS.map((r) => ({ id: r.nid })), { id: DAILY.nid }] });
      else this._bridge?.cancelAll?.();
    } catch { /* noop */ }
  }
}
