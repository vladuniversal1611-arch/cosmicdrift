/* FALLSHIFT — bootstrap: layout, main loop, audio unlock, ads placeholder, lifecycle. */
(function () {
  'use strict';
  const FS = window.FS;

  // Rewarded-ad integration point. Replace showRewarded() with a real SDK call
  // (AdMob / AppLovin / etc.). onReward must be invoked only after a completed view.
  FS.Ads = {
    showRewarded(onReward, onFail) {
      try {
        FS.UI.showAd(3, onReward);
      } catch (e) {
        if (onFail) onFail(e);
      }
    },
  };

  const save = FS.Storage.load();
  const app = document.getElementById('app');
  const canvas = document.getElementById('game');
  const game = new FS.Game(canvas);
  const input = new FS.Input(canvas);
  game.input = input;
  FS.game = game;

  FS.Audio.init(save.sound, save.music);
  game.fx.shakeOn = save.settings.shake;
  game.fx.quality = save.settings.hq ? 1 : 0.55;

  let dprCap = save.settings.hq ? 2 : 1.25;

  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // portrait game column: fills phones, letterboxed 9:16 on wide screens
    let w = vw, h = vh;
    if (w / h > 0.62) w = Math.round(h * 0.5625);
    w = Math.max(280, w);
    app.style.width = w + 'px';
    app.style.height = h + 'px';
    document.documentElement.style.fontSize = (w / 39).toFixed(3) + 'px'; // 1rem = 10 logical units
    app.classList.toggle('short', h / w < 1.85);
    app.classList.toggle('xshort', h / w < 1.6);
    app.classList.toggle('landscape', vw > vh * 1.1 && vw < 1000);
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    game.resize(w, h, dpr);
  }
  game.onQuality = () => {
    dprCap = FS.Storage.data.settings.hq ? 2 : 1.25;
    layout();
  };
  game.onPerfDowngrade = () => {
    dprCap = Math.min(dprCap, 1.5);
    layout();
  };

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  layout();

  // audio must be unlocked by a gesture
  const unlock = () => {
    FS.Audio.unlock();
  };
  input.onFirstGesture = unlock;
  document.addEventListener('pointerdown', unlock, { capture: true });

  // input → abilities / pause
  input.on('dash', () => game.abilities.use('dash'));
  input.on('gravity', () => game.abilities.use('gravity'));
  input.on('break', () => game.abilities.use('break'));
  input.on('pause', () => {
    if (game.state === 'playing') game.pause();
    else if (game.state === 'paused') game.resume();
  });
  input.on('confirm', () => {
    if (game.state === 'menu' && FS.UI.current === 'menu') game.startRun();
    else if (game.state === 'dead') game.startRun();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (game.state === 'playing') game.pause();
      FS.Audio.suspend();
    } else if (game.state !== 'paused') {
      FS.Audio.resume();
    }
  });

  FS.UI.init(game);
  game.setupDemo();
  FS.UI.showMenu();
  FS.Audio.setMode('menu');

  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    try {
      game.frame(dt);
    } catch (e) {
      console.error(e);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
