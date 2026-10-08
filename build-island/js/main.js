/* Boot + main loop: update(dt) then render(), driven by requestAnimationFrame. */
(function () {
  'use strict';
  const BI = window.BI;
  let last = 0;
  let errors = 0;

  function gameLoop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // avoid huge jumps after tab switches
    if (dt < 0) dt = 0;
    try {
      BI.Game.update(dt);
      BI.Renderer.render(BI.Game);
    } catch (e) {
      if (errors++ < 5) console.error(e);
    }
    requestAnimationFrame(gameLoop);
  }

  function boot() {
    BI.Game.init();
    last = performance.now();
    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
