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

  // Premium chime: sine tone with slow attack, long release, and a soft
  // lowpass filter — no harsh harmonics, warm & bell-like.
  function chime(freq, opts) {
    if (!ctx) return;
    opts = opts || {};
    const dur   = opts.dur   || 0.4;
    const atk   = opts.atk   || 0.015;
    const gain  = opts.gain  || 0.22;
    const type  = opts.type  || 'sine';
    const slide = opts.slideTo;
    const lp    = opts.lp    || 4000;
    const delay = opts.delay || 0;
    const t0    = ctx.currentTime + delay;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    f.type = 'lowpass'; f.frequency.value = lp; f.Q.value = 0.5;
    // Fast smooth attack, exponential natural decay
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(f); f.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  // Soft filtered noise — for magical whoosh instead of harsh white noise.
  function whoosh(dur, gain, lpFreq) {
    if (!ctx) return;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    n.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(lpFreq || 2000, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime((lpFreq || 2000) * 0.4, ctx.currentTime + dur);
    f.Q.value = 1.5;
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
    // Magical spark — a bright rising chime with warm harmonics instead of
    // the old harsh square+noise burst.
    special: function () {
      chime(880,  { dur: 0.28, gain: 0.22, type: 'sine',     slideTo: 1760, lp: 5000 });
      chime(1320, { dur: 0.32, gain: 0.14, type: 'triangle', lp: 4000, delay: 0.02 });
      chime(2640, { dur: 0.20, gain: 0.06, type: 'sine',     lp: 6000, delay: 0.05 });
      whoosh(0.18, 0.06, 3500);
    },
    // Epic dragon roar — deep sub-bass sweep + magical bell chord + airy tail.
    // No sawtooth/square anywhere; all sines/triangles through a lowpass so it
    // feels rich and cinematic, not like a cheap 8-bit blaster.
    dragon:  function () {
      // Sub-bass thump: sine sweep 90→50 Hz
      chime(90,  { dur: 0.55, gain: 0.35, type: 'sine',     slideTo: 50,  lp: 500  });
      // Warm mid body — perfect-fifth interval (C3 + G3) for musical richness
      chime(131, { dur: 0.45, gain: 0.18, type: 'triangle', lp: 1200, delay: 0.02 });
      chime(196, { dur: 0.42, gain: 0.12, type: 'triangle', lp: 1400, delay: 0.02 });
      // Magical bell chord that swells in on top — C major (C5-E5-G5)
      chime(523, { dur: 0.50, gain: 0.12, type: 'sine', lp: 3500, atk: 0.05, delay: 0.08 });
      chime(659, { dur: 0.48, gain: 0.09, type: 'sine', lp: 3500, atk: 0.05, delay: 0.08 });
      chime(784, { dur: 0.52, gain: 0.09, type: 'sine', lp: 3500, atk: 0.05, delay: 0.08 });
      // High sparkle tail
      chime(1568, { dur: 0.30, gain: 0.05, type: 'sine', lp: 5000, delay: 0.22 });
      // Soft filtered whoosh — cinematic body without white-noise harshness
      whoosh(0.35, 0.08, 1500);
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
  let musicSrc     = null;   // current playing AudioBufferSourceNode

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

  // The WAV loop file has a 150 ms equal-power crossfade baked into its last
  // 150 ms: the tail smoothly morphs INTO what would be the head of the loop.
  // Playback layout inside the buffer:
  //   [0 .. 150 ms)         = original "head" (played once at the very start)
  //   [150 ms .. duration)  = middle body + crossfaded tail
  // Setting loopStart=150 ms makes AudioBufferSourceNode.loop=true skip the
  // duplicate "head" on every iteration; the crossfaded tail lands EXACTLY on
  // sample 150 ms of the source, so end→loopStart is continuous at sample
  // level AND at musical content level.  No JS scheduler needed.
  var LOOP_HEAD_S = 0.150;

  function _playMusicBuffer() {
    if (!ctx || !musicBuffer) return;
    _stopLoop();
    var src = ctx.createBufferSource();
    src.buffer = musicBuffer;
    src.loop = true;
    src.loopStart = LOOP_HEAD_S;
    src.loopEnd   = musicBuffer.duration;
    src.connect(musicGain);
    src.start(0);   // first pass plays the head; every loop after skips it
    musicSrc = src;
  }

  function _stopLoop() {
    if (musicSrc) { try { musicSrc.stop(); } catch (e) {} musicSrc = null; }
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
