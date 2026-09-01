/* ============================================================
   Audio — fully synthesized SFX + procedural background music
   using the WebAudio API (no asset files required, tiny size).
   ============================================================ */
(function (global) {
  'use strict';

  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicLP = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicOn = false;

  function ensure() {
    if (ctx) return;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // Music runs through a gentle low-pass so the pads/arpeggios stay warm and
    // never harsh; a touch of high-pass removes low-end mud.
    musicGain = ctx.createGain(); musicGain.gain.value = 0.55;
    musicLP = ctx.createBiquadFilter(); musicLP.type = 'lowpass'; musicLP.frequency.value = 1500; musicLP.Q.value = 0.5;
    const musicHP = ctx.createBiquadFilter(); musicHP.type = 'highpass'; musicHP.frequency.value = 90;
    musicGain.connect(musicLP); musicLP.connect(musicHP); musicHP.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
  }

  function resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function tone(freq, dur, type, gain, dest, slideTo) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain || 0.3, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  function noise(dur, gain) {
    if (!ctx) return;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gain || 0.25;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 800;
    n.connect(f); f.connect(g); g.connect(sfxGain);
    n.start();
  }

  // ---- Public SFX ----------------------------------------------------------
  const SFX = {
    swap:    function () { tone(420, 0.08, 'triangle', 0.25, null, 520); },
    match:   function (combo) {
      const base = 440 + Math.min(8, combo || 0) * 60;
      tone(base, 0.12, 'sine', 0.3, null, base * 1.5);
      tone(base * 1.5, 0.1, 'triangle', 0.15);
    },
    invalid: function () { tone(200, 0.12, 'sawtooth', 0.2, null, 120); },
    special: function () { tone(660, 0.2, 'square', 0.25, null, 1320); noise(0.15, 0.15); },
    dragon:  function () {
      tone(140, 0.5, 'sawtooth', 0.35, null, 70);
      noise(0.4, 0.3);
      tone(330, 0.4, 'triangle', 0.2, null, 660);
    },
    hatch:   function () { tone(523, 0.15, 'sine', 0.3, null, 784); setTimeout(function(){tone(784,0.25,'sine',0.3,null,1046);},120); },
    win:     function () { // triumphant arpeggio + sparkle
      [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { tone(f, 0.32, 'triangle', 0.3); tone(f * 2, 0.18, 'sine', 0.1); }, i * 120); });
      setTimeout(function () { tone(1568, 0.5, 'sine', 0.22); }, 640);
    },
    lose:    function () { [392,330,262].forEach(function(f,i){setTimeout(function(){tone(f,0.35,'sawtooth',0.25);},i*150);}); },
    click:   function () { tone(600, 0.05, 'square', 0.18); },
    coin:    function () { tone(880, 0.07, 'square', 0.2, null, 1320); setTimeout(function(){tone(1320,0.08,'square',0.18);},60); },
    chest:   function () { [659, 784, 988, 1318].forEach(function (f, i) { setTimeout(function () { tone(f, 0.25, 'triangle', 0.28); }, i * 90); }); noise(0.2, 0.12); },
    streak:  function () { [784, 988, 1318].forEach(function (f, i) { setTimeout(function () { tone(f, 0.18, 'square', 0.22); }, i * 70); }); },
    star:    function (i) { tone(660 + (i||0)*220, 0.2, 'triangle', 0.3); }
  };

  // Haptic feedback patterns (ms) per event — respects the vibration setting.
  const BUZZ = {
    swap: 8, match: 14, invalid: [10, 30, 10], special: 28, dragon: [0, 40, 30, 60],
    hatch: [0, 30, 40, 30], win: [0, 60, 40, 60, 40, 80], lose: [0, 80, 60, 80],
    coin: 8, star: 20, click: 5
  };
  function buzz(name, combo) {
    if (!global.navigator || typeof global.navigator.vibrate !== 'function') return;
    if (!global.Save || global.Save.get().settings.vibration === false) return;
    let pat = BUZZ[name];
    if (name === 'match') pat = Math.min(40, 10 + (combo || 0) * 6); // stronger on big combos
    if (pat != null) { try { global.navigator.vibrate(pat); } catch (e) {} }
  }

  function play(name, arg) {
    buzz(name, arg);
    if (!ctx) return;
    if (!global.Save || global.Save.get().settings.sound === false) return;
    if (SFX[name]) SFX[name](arg);
  }

  // ---- Background music: gapless loop via Web Audio BufferSource -----------
  // We decode the MP3 once into an AudioBuffer then play it through an
  // AudioBufferSourceNode with loop=true.  This is sample-accurate — zero gap,
  // no browser re-seek stutter that HTMLAudioElement.loop suffers from.
  const MUSIC_URL = global.MUSIC_TRACK || 'assets/audio/theme.wav';
  let musicBuffer  = null;   // decoded AudioBuffer, filled once
  let musicLoading = false;
  let _loopItems   = [];     // {src, endAt} — active source nodes
  let _loopInterval = null;  // setInterval handle for the look-ahead scheduler
  let _loopNext    = 0;      // AudioContext timestamp when next source starts

  // Crossfade duration (seconds). Two consecutive sources overlap this long —
  // one fades out while the next fades in.  400 ms is enough to completely
  // mask the tonal difference between the end and the start of the loop file.
  var XFADE        = 0.40;
  // How far ahead (seconds) the scheduler looks for work to do.
  var SCHED_AHEAD  = 0.25;
  // Polling interval (ms) — small enough that a late timer still catches up.
  var SCHED_INTV   = 120;

  function loadMusicBuffer(cb) {
    if (musicBuffer) { if (cb) cb(musicBuffer); return; }
    if (musicLoading) return;
    musicLoading = true;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', MUSIC_URL, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        ctx.decodeAudioData(xhr.response, function (buf) {
          musicBuffer = buf;
          musicLoading = false;
          if (cb) cb(buf);
        }, function () { musicLoading = false; });
      };
      xhr.onerror = function () { musicLoading = false; };
      xhr.send();
    } catch (e) { musicLoading = false; }
  }

  // Look-ahead scheduler tick — runs every SCHED_INTV ms.
  // Pre-schedules any source nodes whose start time falls within the
  // SCHED_AHEAD window, so the audio clock never runs dry even when
  // the JS thread is busy (mobile WebView, background tab).
  function _schedTick() {
    if (!musicOn || !ctx || !musicBuffer) return;
    var now = ctx.currentTime;
    var dur = musicBuffer.duration;
    var xf  = Math.min(XFADE, dur * 0.15);

    // Discard fully-finished nodes to avoid memory leaks
    _loopItems = _loopItems.filter(function (it) { return it.endAt > now; });

    // Schedule as many iterations as needed to fill the look-ahead window
    while (_loopNext < now + SCHED_AHEAD) {
      var when = _loopNext;

      var g = ctx.createGain();
      g.connect(musicGain);
      // Fade in over XF seconds
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(1, when + xf);
      // Sustain, then fade out over XF seconds
      g.gain.setValueAtTime(1, when + dur - xf);
      g.gain.linearRampToValueAtTime(0.0001, when + dur);

      var src = ctx.createBufferSource();
      src.buffer = musicBuffer;
      src.connect(g);
      src.start(when);
      src.stop(when + dur + 0.05);

      _loopItems.push({ src: src, endAt: when + dur + 0.05 });

      // Next iteration begins XFADE before this one finishes
      _loopNext = when + dur - xf;
    }
  }

  function _playMusicBuffer() {
    if (!ctx || !musicBuffer) return;
    _stopLoop();
    _loopNext = ctx.currentTime;
    _schedTick(); // prime the first source immediately
    _loopInterval = setInterval(_schedTick, SCHED_INTV);
  }

  function _stopLoop() {
    if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
    _loopItems.forEach(function (it) { try { it.src.stop(); } catch (e) {} });
    _loopItems = [];
  }

  function setIsland() { /* single looped track — no per-island switch */ }

  function startMusic() {
    if (global.Save && global.Save.get().settings.music === false) return;
    if (musicOn) return;
    ensure();
    if (!ctx) return;
    resume();
    musicOn = true;
    if (musicBuffer) {
      _playMusicBuffer();
    } else {
      loadMusicBuffer(function () { if (musicOn) _playMusicBuffer(); });
    }
  }

  function stopMusic() {
    musicOn = false;
    _stopLoop();
  }

  function setMusicEnabled(on) { if (on) startMusic(); else stopMusic(); }
  function setSoundEnabled() { /* checked at play time */ }

  // ---- Background suspend/resume (app minimised, tab hidden) ----------------
  // Silences everything immediately (music loop + any ringing tones) instead of
  // letting audio keep playing while the game is in the background.
  let wasMusicOn = false, suspended = false;
  function suspendAll() {
    if (suspended) return;
    suspended = true;
    wasMusicOn = musicOn;
    stopMusic();
    if (ctx && ctx.state === 'running' && ctx.suspend) { try { ctx.suspend(); } catch (e) {} }
  }
  function resumeAll() {
    if (!suspended) return;
    suspended = false;
    if (ctx && ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) {} }
    if (wasMusicOn) startMusic();
  }

  global.Audio2 = { resume, play, startMusic, stopMusic, setMusicEnabled, setSoundEnabled, setIsland, suspendAll, resumeAll };
})(window);
