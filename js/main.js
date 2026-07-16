/* ============================================================
   MAIN — точка входу: завантаження збереження, ініціалізація
   модулів, екран завантаження, старт головного меню
   ============================================================ */
(function boot() {
  // 1. Прогрес гравця
  Storage.load();

  // 2. Мова: збережена або автовизначення
  I18N.setLang(Storage.s.settings.lang || I18N.detect());

  // 3. Енергія відновлюється офлайн
  Meta.syncEnergy();

  // 4. Ініціалізація підсистем
  Game.init();
  UI.applyI18n();
  UI.bindActions();
  UI.spawnBgParticles();
  Ads.refreshBanner();

  // 5. Красивий екран завантаження (короткий, з прогрес-баром)
  const fill = document.getElementById('loading-fill');
  let progress = 0;
  const int = setInterval(() => {
    progress = Math.min(100, progress + 18 + Math.random() * 22);
    fill.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(int);
      setTimeout(() => UI.show('menu'), 260);
    }
  }, 120);

  // 6. Пауза гри при згортанні застосунку
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') {
      UI.showPauseModal();
    }
  });

  // 7. Блокування контекстного меню/зуму (мобільний застосунок)
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
})();
