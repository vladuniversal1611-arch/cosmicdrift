/**
 * NotificationSystem.js
 * -----------------------------------------------------------------------------
 * Re-engagement reminders — "don't forget to play" local notifications, the
 * standard retention hook for a casual game. These are LOCAL notifications
 * scheduled on the device (no server): when the player leaves, we schedule a
 * few gentle reminders (daily-gift ready, "we miss you", new levels); when they
 * come back we cancel the pending ones so an active player is never pinged.
 *
 * Delivery is native-only: a WebView game cannot post an OS notification while
 * closed, so the Android wrapper exposes a `window.AndroidNotify` bridge (see
 * android/…/AndroidNotify.kt). On the web (no bridge) this is a graceful no-op.
 *
 * BRIDGE CONTRACT — the wrapper implements `window.AndroidNotify` with:
 *   available()                         -> "1" when notifications are supported
 *   requestPermission()                 -> ask the OS (Android 13+) once
 *   schedule(id, delaySeconds, title, body)  -> fire a local notification later
 *   cancelAll()                         -> drop every pending scheduled reminder
 *
 * Events: listens 'input:down' (permission), and the app-lifecycle DOM events.
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { t } from '../../i18n/Localization.js';

/**
 * The reminder ladder. Each fires `delayDays` after the player last left, unless
 * they return first (then all pending reminders are cancelled and re-armed on
 * the next exit). Titles/bodies are localised at schedule time.
 */
const REMINDERS = [
  { id: 'gift', delayDays: 1, titleKey: 'notif.gift.title', bodyKey: 'notif.gift.body' },
  { id: 'miss', delayDays: 3, titleKey: 'notif.miss.title', bodyKey: 'notif.miss.body' },
  { id: 'levels', delayDays: 7, titleKey: 'notif.levels.title', bodyKey: 'notif.levels.body' },
];

export class NotificationSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'notifications';
    this._bridge = null;
    this._permAsked = false;
  }

  onInit() {
    if (typeof window !== 'undefined' && window.AndroidNotify && typeof window.AndroidNotify.schedule === 'function') {
      this._bridge = window.AndroidNotify;
    }
    if (!this._bridge) return;   // web / no wrapper → nothing to do

    // Ask for the OS permission once, on the first user gesture (Android 13+).
    this.listen('input:down', () => this._askPermissionOnce());

    // Re-engagement scheduling is driven by app lifecycle: schedule on the way
    // out, cancel on the way back in.
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
    try { this._bridge.requestPermission?.(); } catch { /* older wrapper */ }
  }

  /** Queue the reminder ladder (called when the app is backgrounded/closed). */
  _scheduleReminders() {
    if (!this._bridge) return;
    try {
      this._bridge.cancelAll?.();   // avoid stacking duplicates across exits
      for (const rem of REMINDERS) {
        this._bridge.schedule(rem.id, rem.delayDays * 86400, t(rem.titleKey), t(rem.bodyKey));
      }
    } catch { /* bridge went away */ }
  }

  /** Drop pending reminders (called when the player returns). */
  _clearReminders() {
    try { this._bridge?.cancelAll?.(); } catch { /* noop */ }
  }
}
