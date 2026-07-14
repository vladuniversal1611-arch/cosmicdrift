/* ============================================================
 * Mystic Relics — main.js
 * Точка входу: ініціалізація всіх модулів у правильному порядку.
 * ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  Storage.load();            // 1. Збереження
  Achievements.build();      // 2. 100 досягнень
  Daily.onLogin();           // 3. Щоденний вхід + місії
  UI.applyTheme();           // 4. Тема (кольори, фон)
  UI.bind();                 // 5. Обробники подій
  Background.init(document.getElementById('bgFx'));    // 6. Живий фон з паралаксом
  Fx.init();                 // 7. Святкові ефекти (конфеті, феєрверки)
  Board.init(document.getElementById('gameCanvas'));   // 8. Ігрове поле
  UI.showScreen('main');     // 9. Головне меню
  Game.startLoop();          // 10. Головний цикл (60 FPS)
  Ads.showBanner();          // 11. Місце під банер AdMob

  // WebAudio дозволено запускати лише після першого дотику користувача
  const unlock = () => { Audio2.init(); Audio2.resume(); };
  document.addEventListener('pointerdown', unlock, { once: true });
});
