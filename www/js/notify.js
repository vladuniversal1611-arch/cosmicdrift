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

  // Hours from "now" at which to remind. Multiple per day for the first
  // three days, then daily, then spaced out to catch churned players.
  // Re-anchored on every app open/close so ACTIVE players never see them.
  //
  //  Day 1: 3h, 7h, 11h, 22h              → 4 nudges (morning/noon/eve)
  //  Day 2: 27h, 32h, 47h                 → 3 more
  //  Day 3: 51h, 58h, 70h                 → 3 more
  //  Day 4-7: once per day                → 4 more
  //  Day 10, 14, 21: recovery nudges      → 3 more
  //  Total: 17 pending reminders per re-schedule.
  const HOURS = [3, 7, 11, 22, 27, 32, 47, 51, 58, 70, 94, 118, 142, 166, 238, 334, 502];

  // Do not fire between 22:00 and 09:00 local time — sleep hours.
  // If a slot would land there, push it forward to 09:00 the same/next day.
  function respectQuietHours(d) {
    var h = d.getHours();
    if (h >= 22) { d.setDate(d.getDate() + 1); d.setHours(9, Math.floor(Math.random()*30), 0, 0); }
    else if (h < 9) { d.setHours(9, Math.floor(Math.random()*30), 0, 0); }
    return d;
  }

  function messages() {
    const T = global.T;
    // Rotate through several templates so each reminder feels fresh, not spammy.
    return [
      { t: T('n_dragons_t'), b: T('n_dragons_b') },
      { t: T('n_lives_t'),   b: T('n_lives_b') },
      { t: T('n_daily_t'),   b: T('n_daily_b') },
      { t: T('n_wheel_t'),   b: T('n_wheel_b') },
      { t: T('n_hatch_t'),   b: T('n_hatch_b') },
      { t: T('n_event_t'),   b: T('n_event_b') },
      { t: T('n_chest_t'),   b: T('n_chest_b') },
      { t: T('n_streak_t'),  b: T('n_streak_b') }
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
      // Shuffle message order per re-schedule so the SAME hour slot doesn't
      // always show the SAME message → feels varied on repeat opens.
      const order = m.slice(); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); const tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
      const notifications = HOURS.map(function (h, i) {
        const msg = order[i % order.length];
        const when = respectQuietHours(new Date(now + h * 3600 * 1000));
        return {
          id: 4000 + i,
          title: msg.t,
          body: msg.b,
          schedule: { at: when, allowWhileIdle: true }
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
