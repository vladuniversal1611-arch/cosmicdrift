/* Tiny Kingdom — запуск: головний цикл, ввід, автозбереження. */
'use strict';

(function () {
  function boot() {
    Game.init();
    Renderer.init(document.getElementById('game'));
    UI.init();

    // ввід по канвасу
    const cv = document.getElementById('game');
    cv.addEventListener('pointerdown', e => {
      A.start();
      const i = Renderer.plotAt(e.clientX, e.clientY);
      if (i >= 0) UI.onPlotTap(i);
      else if (UI.placeType) { UI.placeType = null; Renderer.placeList = null; UI.toast('Розміщення скасовано'); }
    });
    document.addEventListener('pointerdown', () => A.start(), { once: true });

    // головний цикл
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      Game.update(dt);
      Renderer.draw(dt, now / 1000);
      UI.tick(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // збереження при згортанні (важливо для Android WebView)
    document.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
    addEventListener('pagehide', () => Game.save());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
