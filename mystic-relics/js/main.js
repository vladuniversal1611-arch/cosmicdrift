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
  UI.startBgParticles();     // 6. Фонові частинки меню
  Board.init(document.getElementById('gameCanvas'));   // 7. Ігрове поле
  UI.showScreen('main');     // 8. Головне меню
  Game.startLoop();          // 9. Головний цикл (60 FPS)
  Ads.showBanner();          // 10. Місце під банер AdMob

  // WebAudio дозволено запускати лише після першого дотику користувача
  const unlock = () => { Audio2.init(); Audio2.resume(); };
  document.addEventListener('pointerdown', unlock, { once: true });
});
