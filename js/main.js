/* Tiny Kingdom — запуск: головний цикл, ввід, автозбереження. */
'use strict';

(function () {
  function boot() {
    Game.init();
    Renderer.init(document.getElementById('game'));
    UI.init();

    // ввід по канвасу: тап / перетягування (панорама) / щипок (зум) / колесо
    const cv = document.getElementById('game');
    const ptrs = new Map(); // активні дотики
    let pinchD = 0, dragging = false;

    cv.addEventListener('pointerdown', e => {
      A.start();
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      dragging = false;
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinchD = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    cv.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      if (ptrs.size === 2) { // щипок
        p.x = e.clientX; p.y = e.clientY;
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchD > 0) Renderer.zoomBy(d / pinchD);
        pinchD = d;
        dragging = true;
        return;
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (dragging || Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 12) {
        dragging = true;
        Renderer.pan(dx, dy);
      }
      p.x = e.clientX; p.y = e.clientY;
    });
    const endPtr = e => {
      const p = ptrs.get(e.pointerId);
      ptrs.delete(e.pointerId);
      pinchD = 0;
      if (!p || dragging) { if (!ptrs.size) dragging = false; return; }
      // це був тап: спершу гобліни, потім ділянки
      const g = Renderer.goblinAt(e.clientX, e.clientY);
      if (g >= 0) { Game.hitGoblin(g); return; }
      const i = Renderer.plotAt(e.clientX, e.clientY);
      if (i >= 0) UI.onPlotTap(i);
      else if (UI.placeType) { UI.placeType = null; Renderer.placeList = null; UI.toast('Розміщення скасовано'); }
    };
    cv.addEventListener('pointerup', endPtr);
    cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinchD = 0; });
    cv.addEventListener('wheel', e => { e.preventDefault(); Renderer.zoomBy(e.deltaY < 0 ? 1.12 : 0.9); }, { passive: false });
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
