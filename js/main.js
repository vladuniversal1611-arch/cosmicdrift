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
  UI.initCompanion();
  Ads.refreshBanner();

  // PWA: офлайн-кеш (працює лише на http/https, у WebView не заважає)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* не критично */ });
  }

  Analytics.log('session_start', { level: Storage.s.currentLevel, lang: I18N.getLang() });

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

  // 6. Пауза при згортанні + збереження партії + пуш-нагадування
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (Game.state === 'playing') { Game.saveGameState(); UI.showPauseModal(); }
      Notify.onAppHide();
    } else {
      Notify.onAppShow();
    }
  });

  // 7. Блокування контекстного меню/зуму (мобільний застосунок)
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
})();
