/* ==========================================================================
   11_main.js — boot, main loop, input routing, lifecycle.
   ========================================================================== */
'use strict';

(function main() {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    Art.setDpr(dpr);
    Game.layout();
    Screens.invalidate();
  }

  // Pointer routing: canvas-level input goes to the active canvas screen.
  function route(type, e) {
    if (Screens.current === 'game') Game.pointer(type, e.clientX, e.clientY);
    else if (Screens.current === 'home') Screens.homePointer(type, e.clientX, e.clientY);
  }
  canvas.addEventListener('pointerdown', (e) => { Audio.init(); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); route('down', e); });
  canvas.addEventListener('pointermove', (e) => route('move', e));
  canvas.addEventListener('pointerup', (e) => route('up', e));
  canvas.addEventListener('pointercancel', (e) => route('cancel', e));
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  let last = performance.now(), hudTimer = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (Screens.current === 'game') { Game.update(dt); Game.draw(ctx); }
    else if (Screens.current === 'home') Screens.drawHome(ctx, dt);
    hudTimer += dt;
    if (hudTimer > 1) { hudTimer = 0; if (Screens.current === 'home') Screens.syncHome(); }
    requestAnimationFrame(frame);
  }

  // Leaving the app mid-level pauses it (the life is already committed).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { State.persist(true); if (Screens.current === 'game' && Game.active && !Game.over && !Game.paused) UI.pause(); }
    else { State.tickLives(); State.ensureQuests(); State.ensureWeek(); Screens.syncHome(); }
  });
  window.addEventListener('pagehide', () => State.persist(true));
  window.addEventListener('resize', resize);

  async function boot() {
    State.load();
    document.documentElement.lang = I18N.lang;
    resize();
    UI.buildGameHud();
    Screens.buildHomeHud();
    requestAnimationFrame(frame);
    // Kick off icon decoding so the first frames are crisp.
    for (const n of ['hammer', 'lock', 'star', 'cell_ch']) UI.iconImg(n);
    if (document.fonts && document.fonts.load) { try { await Promise.race([document.fonts.load('900 20px Nunito'), new Promise((r) => setTimeout(r, 800))]); } catch (e) { /* fallback font */ } }
    await Screens.splash();
    Audio.init();
    if (!State.s.introSeen) {
      await Screens.intro();
      Screens.show('home');
      UI.openLevel(1);
      return;
    }
    Screens.show('home');
    if (State.dailyAvailable()) await UI.daily();
    Screens.pointAtRestore();
  }
  boot();
})();
