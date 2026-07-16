/* ============================================================
   NOTIFY — шар локальних пуш-нагадувань (заглушки)
   У Google Play підключіть Capacitor LocalNotifications
   (або аналог) і замініть реалізації schedule.../cancelAll.
   Ігровий код викликає ТІЛЬКИ цей інтерфейс.
   ============================================================ */
const Notify = (() => {
  // Ідентифікатори нагадувань (щоб перезаписувати, а не дублювати)
  const IDS = { energy: 1, daily: 2, tournament: 3 };

  /** Запит дозволу — викликається після першої перемоги (не на старті!) */
  function requestPermission() {
    // ЗАГЛУШКА: у Capacitor — LocalNotifications.requestPermissions()
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) { /* ігноруємо */ }
    }
  }

  /**
   * "Енергія відновилась ⚡" — коли енергія дійде до максимуму.
   * msUntilFull — мілісекунди до повного відновлення.
   */
  function scheduleEnergyFull(msUntilFull) {
    if (!msUntilFull || msUntilFull <= 0) return;
    // ЗАГЛУШКА для нативного планувальника:
    // LocalNotifications.schedule({ notifications: [{
    //   id: IDS.energy,
    //   title: 'Block Kingdom',
    //   body: I18N.t('notif_energy'),
    //   schedule: { at: new Date(Date.now() + msUntilFull) },
    // }]});
  }

  /** "Нові квести чекають!" — наступного дня о 10:00 локального часу */
  function scheduleDailyReminder() {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    // ЗАГЛУШКА: LocalNotifications.schedule({ id: IDS.daily, at: next, body: I18N.t('notif_daily') })
  }

  /** "Турнір закінчується через 3 години!" */
  function scheduleTournamentEnding() {
    const msLeft = Meta.tournamentTimeLeft() - 3 * 3600 * 1000;
    if (msLeft <= 0) return;
    // ЗАГЛУШКА: LocalNotifications.schedule({ id: IDS.tournament, at: new Date(Date.now() + msLeft) })
  }

  function cancelAll() {
    // ЗАГЛУШКА: LocalNotifications.cancel({ notifications: [{id:1},{id:2},{id:3}] })
  }

  /**
   * Гачок згортання застосунку: плануємо нагадування, які
   * повернуть гравця. Викликається з main.js на visibilitychange.
   */
  function onAppHide() {
    const s = Storage.s;
    if (s.energy < s.energyMax) {
      scheduleEnergyFull(Meta.energyTimeLeft() + (s.energyMax - s.energy - 1) * 20 * 60 * 1000);
    }
    scheduleDailyReminder();
    scheduleTournamentEnding();
  }

  /** Гачок відкриття: скасовуємо заплановане — гравець уже тут */
  function onAppShow() {
    cancelAll();
  }

  return { requestPermission, scheduleEnergyFull, scheduleDailyReminder, scheduleTournamentEnding, cancelAll, onAppHide, onAppShow };
})();
