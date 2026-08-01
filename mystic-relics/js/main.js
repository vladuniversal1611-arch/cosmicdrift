/* ============================================================
 * Mystic Relics — main.js
 * Точка входу: ініціалізація всіх модулів у правильному порядку.
 * ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  Storage.load();            // 1. Збереження
  Assets.load();             // 1б. PNG-спрайти (необов'язкові, fallback — emoji)
  I18N.apply();              // 2. Мова інтерфейсу (за замовчуванням — англійська)
  Achievements.build();      // 3. 100 досягнень
  Daily.onLogin();           // 4. Щоденний вхід + місії
  UI.applyTheme();           // 5. Тема (кольори, фон)
  UI.bind();                 // 6. Обробники подій
  Background.init(document.getElementById('bgFx'));    // 6. Живий фон з паралаксом
  Fx.init();                 // 7. Святкові ефекти (конфеті, феєрверки)
  Board.init(document.getElementById('gameCanvas'));   // 8. Ігрове поле
  UI.showScreen('main');     // 9. Головне меню
  Game.startLoop();          // 10. Головний цикл (60 FPS)
  Ads.showBanner();          // 11. Місце під банер AdMob

  // Ховаємо системну шторку (status bar) на нативній платформі
  try {
    const C = window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.StatusBar) {
      C.Plugins.StatusBar.setOverlaysWebView({ overlay: false });
      C.Plugins.StatusBar.hide({ animation: 'FADE' });
    }
  } catch (e) {}

  // WebAudio дозволено запускати лише після першого дотику користувача
  const unlock = () => { Audio2.init(); Audio2.resume(); };
  document.addEventListener('pointerdown', unlock, { once: true });

  // Авто-пауза, коли гру згорнуто (телефон заблоковано, інший додаток)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') Game.pause();
  });

  // Блокуємо контекстне меню на довгий дотик (мобільні браузери)
  document.addEventListener('contextmenu', e => e.preventDefault());
});
