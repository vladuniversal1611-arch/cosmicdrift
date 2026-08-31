/* ============================================================
 * Mystic Relics — notifications.js
 * Локальні сповіщення: нагадують гравцю повернутися до гри.
 * Працює лише на нативній платформі (Capacitor).
 * ============================================================ */
'use strict';

const Notify = {
  /** ID сповіщень (фіксовані, щоб перезаписувати при кожному вході). */
  IDS: { remind2h: 1001, remind6h: 1002, remind24h: 1003, dailyReward: 1004 },

  /** Чи є нативна платформа. */
  _native: false,
  _plugin: null,

  /** Ініціалізація: запитує дозвіл і планує сповіщення. */
  async init() {
    try {
      const C = window.Capacitor;
      if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
      if (!C.Plugins || !C.Plugins.LocalNotifications) return;
      this._plugin = C.Plugins.LocalNotifications;
      this._native = true;

      // Запит дозволу
      const perm = await this._plugin.requestPermissions();
      if (perm.display !== 'granted') return;

      // Планувати при кожному вході — старі скасовуються автоматично
      this.schedule();
    } catch (e) { /* браузер або плагін не встановлено */ }
  },

  /** Планує нагадувальні сповіщення. */
  async schedule() {
    if (!this._native || !this._plugin) return;
    const ln = this._plugin;
    const lang = (Storage.data && Storage.data.settings && Storage.data.settings.lang) || 'en';
    const t = this._texts(lang);

    // Скасовуємо попередні (щоб не дублювати)
    try {
      await ln.cancel({ notifications: Object.values(this.IDS).map(id => ({ id })) });
    } catch (e) {}

    const now = Date.now();
    const notifications = [
      // Через 2 години: «Реліквії чекають!»
      {
        id: this.IDS.remind2h,
        title: t.title2h,
        body: t.body2h,
        schedule: { at: new Date(now + 2 * 60 * 60 * 1000) },
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        sound: null,
        channelId: 'reminders'
      },
      // Через 6 годин: «Щоденні місії очікують»
      {
        id: this.IDS.remind6h,
        title: t.title6h,
        body: t.body6h,
        schedule: { at: new Date(now + 6 * 60 * 60 * 1000) },
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        sound: null,
        channelId: 'reminders'
      },
      // Через 24 години: «Ти давно не заходив!»
      {
        id: this.IDS.remind24h,
        title: t.title24h,
        body: t.body24h,
        schedule: { at: new Date(now + 24 * 60 * 60 * 1000) },
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        sound: null,
        channelId: 'reminders'
      },
      // Щоденна нагорода — завтра о 10:00
      {
        id: this.IDS.dailyReward,
        title: t.titleDaily,
        body: t.bodyDaily,
        schedule: { at: this._nextMorning(10) },
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
        sound: null,
        channelId: 'reminders'
      }
    ];

    // Створюємо канал (Android 8+)
    try {
      await ln.createChannel({
        id: 'reminders',
        name: 'Game reminders',
        description: 'Reminders to come back and play',
        importance: 3,   // DEFAULT
        visibility: 1,   // PUBLIC
        vibration: true
      });
    } catch (e) {}

    try {
      await ln.schedule({ notifications });
    } catch (e) {}
  },

  /** Скасувати всі сповіщення (напр. коли гравець вимкнув у налаштуваннях). */
  async cancelAll() {
    if (!this._native || !this._plugin) return;
    try {
      await this._plugin.cancel({
        notifications: Object.values(this.IDS).map(id => ({ id }))
      });
    } catch (e) {}
  },

  /** Наступний ранок (або завтра якщо вже пізно). */
  _nextMorning(hour) {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d;
  },

  /** Локалізовані тексти сповіщень. */
  _texts(lang) {
    const all = {
      en: {
        title2h:    '🔮 Mystic Relics',
        body2h:     'Your relics are waiting! Come collect triples and earn rewards ✨',
        title6h:    '📜 Daily missions are waiting!',
        body6h:     'You have uncompleted missions — claim your rewards before midnight!',
        title24h:   '💎 We miss you!',
        body24h:    'Your daily reward is ready! Log in and keep your streak going 🔥',
        titleDaily: '🎁 Daily reward is ready!',
        bodyDaily:  'A new day, a new reward! Open the game and claim it 🪙'
      },
      uk: {
        title2h:    '🔮 Mystic Relics',
        body2h:     'Реліквії чекають! Збирай трійки і здобувай нагороди ✨',
        title6h:    '📜 Щоденні місії чекають!',
        body6h:     'У тебе є невиконані місії — встигни отримати нагороду до півночі!',
        title24h:   '💎 Ми сумуємо за тобою!',
        body24h:    'Щоденна нагорода готова! Заходь і не втрать серію 🔥',
        titleDaily: '🎁 Щоденна нагорода готова!',
        bodyDaily:  'Новий день — нова нагорода! Відкрий гру і забери її 🪙'
      },
      de: {
        title2h:    '🔮 Mystic Relics',
        body2h:     'Deine Relikte warten! Sammle Dreier und verdiene Belohnungen ✨',
        title6h:    '📜 Tägliche Missionen warten!',
        body6h:     'Du hast unerledigte Missionen — hol dir deine Belohnungen vor Mitternacht!',
        title24h:   '💎 Wir vermissen dich!',
        body24h:    'Deine tägliche Belohnung ist bereit! Komm zurück und halte deine Serie 🔥',
        titleDaily: '🎁 Tägliche Belohnung bereit!',
        bodyDaily:  'Ein neuer Tag, eine neue Belohnung! Öffne das Spiel und hol sie dir 🪙'
      },
      es: {
        title2h:    '🔮 Mystic Relics',
        body2h:     '¡Tus reliquias te esperan! Colecciona triples y gana recompensas ✨',
        title6h:    '📜 ¡Misiones diarias pendientes!',
        body6h:     'Tienes misiones sin completar — ¡reclama tus recompensas antes de medianoche!',
        title24h:   '💎 ¡Te echamos de menos!',
        body24h:    'Tu recompensa diaria está lista. ¡Entra y mantén tu racha 🔥',
        titleDaily: '🎁 ¡Recompensa diaria lista!',
        bodyDaily:  'Un nuevo día, una nueva recompensa. ¡Abre el juego y reclámala 🪙'
      },
      pl: {
        title2h:    '🔮 Mystic Relics',
        body2h:     'Twoje relikty czekają! Zbieraj trójki i zdobywaj nagrody ✨',
        title6h:    '📜 Codzienne misje czekają!',
        body6h:     'Masz nieukończone misje — odbierz nagrody przed północą!',
        title24h:   '💎 Tęsknimy za tobą!',
        body24h:    'Twoja codzienna nagroda jest gotowa! Zaloguj się i kontynuuj serię 🔥',
        titleDaily: '🎁 Codzienna nagroda gotowa!',
        bodyDaily:  'Nowy dzień, nowa nagroda! Otwórz grę i odbierz ją 🪙'
      }
    };
    return all[lang] || all.en;
  }
};
