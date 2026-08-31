/* ============================================================
   Local "come back and play" reminders via @capacitor/local-notifications.
   No server needed — the device schedules them. Reminders are re-scheduled
   every time the app opens or is backgrounded, so ACTIVE players never see
   them (they get cancelled and pushed out); only lapsed players are nudged.
   ============================================================ */
(function (global) {
  'use strict';

  function LN() {
    return (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.LocalNotifications) || null;
  }

  // Hours from "now" at which to remind. A few-hour cadence early, then
  // escalating so we nudge without spamming. Re-anchored on every open/close.
  const HOURS = [4, 9, 24, 29, 48, 72, 120, 168];

  function messages() {
    const T = global.T;
    return [
      { t: T('n_dragons_t'), b: T('n_dragons_b') },
      { t: T('n_lives_t'),   b: T('n_lives_b') },
      { t: T('n_daily_t'),   b: T('n_daily_b') },
      { t: T('n_wheel_t'),   b: T('n_wheel_b') },
      { t: T('n_hatch_t'),   b: T('n_hatch_b') }
    ];
  }

  let busy = false;
  function schedule() {
    const ln = LN();
    if (!ln || busy) return;
    busy = true;
    // Cancel our previously scheduled reminders, then lay down a fresh set.
    Promise.resolve(ln.getPending()).then(function (pending) {
      const list = (pending && pending.notifications) || [];
      const mine = list.filter(function (n) { return n.id >= 4000 && n.id < 4100; }).map(function (n) { return { id: n.id }; });
      return mine.length ? ln.cancel({ notifications: mine }) : null;
    }).then(function () {
      const m = messages();
      const now = Date.now();
      const notifications = HOURS.map(function (h, i) {
        const msg = m[i % m.length];
        return {
          id: 4000 + i,
          title: msg.t,
          body: msg.b,
          schedule: { at: new Date(now + h * 3600 * 1000), allowWhileIdle: true }
        };
      });
      return ln.schedule({ notifications: notifications });
    }).catch(function () {}).then(function () { busy = false; });
  }

  function init() {
    const ln = LN();
    if (!ln) return; // browser / no plugin — silently skip
    Promise.resolve(ln.checkPermissions()).then(function (perm) {
      if (perm && perm.display === 'granted') return { display: 'granted' };
      return ln.requestPermissions();
    }).then(function (res) {
      if (res && res.display === 'granted') schedule();
    }).catch(function () {});
  }

  global.Notify = { init: init, schedule: schedule };
})(window);
