/* ============================================================
   Audio — fully synthesized SFX + procedural background music
   using the WebAudio API (no asset files required, tiny size).
   ============================================================ */
(function (global) {
  'use strict';

  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicOn = false;

  function ensure() {
    if (ctx) return;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.18; musicGain.connect(master);
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
    win:     function () { [523,659,784,1046].forEach(function(f,i){setTimeout(function(){tone(f,0.3,'triangle',0.3);},i*120);}); },
    lose:    function () { [392,330,262].forEach(function(f,i){setTimeout(function(){tone(f,0.35,'sawtooth',0.25);},i*150);}); },
    click:   function () { tone(600, 0.05, 'square', 0.18); },
    coin:    function () { tone(880, 0.07, 'square', 0.2, null, 1320); setTimeout(function(){tone(1320,0.08,'square',0.18);},60); },
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

  // ---- Procedural background music ----------------------------------------
  // A gentle, looping arpeggio in a pentatonic scale — pleasant, royalty free.
  const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
  let step = 0;
  function musicTick() {
    if (!musicOn || !ctx) return;
    const root = SCALE[step % SCALE.length];
    tone(root, 0.5, 'sine', 0.22, musicGain, root * 1.001);
    if (step % 2 === 0) tone(root / 2, 0.9, 'triangle', 0.12, musicGain);
    if (step % 4 === 0) tone(SCALE[(step / 4) % SCALE.length] * 2, 0.4, 'sine', 0.1, musicGain);
    step++;
  }

  function startMusic() {
    ensure();
    if (!ctx) return;
    if (global.Save && global.Save.get().settings.music === false) return;
    if (musicOn) return;
    musicOn = true;
    musicTimer = setInterval(musicTick, 340);
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function setMusicEnabled(on) { if (on) startMusic(); else stopMusic(); }
  function setSoundEnabled() { /* checked at play time */ }

  global.Audio2 = { resume, play, startMusic, stopMusic, setMusicEnabled, setSoundEnabled };
})(window);
