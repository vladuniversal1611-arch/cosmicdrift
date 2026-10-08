/* Audio: Web Audio API placeholder sounds + a tiny generative music loop.
   No audio files needed. Swap these functions for real samples later. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  let ctx = null, master = null, sfxBus = null, musicBus = null;
  const settings = { music: true, sfx: true };
  let musicTimer = null, nextNote = 0, step = 0, musicPlaying = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.13; musicBus.connect(master);
    return ctx;
  }

  function tone(freq, dur, o) {
    o = o || {};
    const isMusic = o.bus === 'music';
    if (isMusic ? !settings.music : !settings.sfx) return;
    if (!ensure()) return;
    const t0 = (o.at || ctx.currentTime) + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(isMusic ? musicBus : sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq, delay) {
    if (!settings.sfx || !ensure()) return;
    const t0 = ctx.currentTime + (delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq || 800;
    const g = ctx.createGain();
    g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t0);
  }

  // ---------------- SFX ----------------
  function playClick() { tone(660, 0.08, { type: 'triangle', vol: 0.18, slide: 880 }); }
  function playCollect(res) {
    const base = res === 'crystal' ? 880 : res === 'stone' ? 330 : 520;
    if (res === 'stone') noise(0.12, 0.25, 1200);
    if (res === 'wood') noise(0.08, 0.2, 2200);
    tone(base, 0.12, { type: 'triangle', vol: 0.22 });
    tone(base * 1.5, 0.16, { type: 'sine', vol: 0.2, delay: 0.07 });
    if (res === 'crystal') tone(base * 2, 0.3, { type: 'sine', vol: 0.15, delay: 0.14 });
  }
  function playCoin() {
    tone(988, 0.08, { type: 'square', vol: 0.08 });
    tone(1319, 0.2, { type: 'square', vol: 0.08, delay: 0.07 });
  }
  function playBuild() {
    noise(0.18, 0.35, 500);
    tone(196, 0.18, { type: 'triangle', vol: 0.3 });
    noise(0.12, 0.25, 700, 0.14);
    tone(262, 0.15, { type: 'triangle', vol: 0.25, delay: 0.14 });
    tone(523, 0.3, { type: 'sine', vol: 0.2, delay: 0.3 });
    tone(784, 0.35, { type: 'sine', vol: 0.15, delay: 0.38 });
  }
  function playReward() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.2, delay: i * 0.08 }));
  }
  function playLevelUp() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, { type: 'square', vol: 0.09, delay: i * 0.075 }));
    tone(1568, 0.6, { type: 'sine', vol: 0.15, delay: 0.5 });
  }
  function playError() { tone(220, 0.18, { type: 'sawtooth', vol: 0.12, slide: 150 }); }
  function playExpand() {
    noise(0.5, 0.2, 400);
    [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.2, delay: i * 0.1 }));
  }
  function playWhoosh() { noise(0.25, 0.15, 1500); }

  // ---------------- Music (generative pentatonic loop) ----------------
  const BASS = [130.81, 110.0, 174.61, 196.0]; // C A F G
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const PATTERN = [0, -1, 2, 3, -1, 2, 4, -1, 3, -1, 2, 1, 0, -1, 1, 2];

  function schedule() {
    if (!ctx || !musicPlaying) return;
    while (nextNote < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 16) % 4;
      const s = step % 16;
      if (s === 0 || s === 8) tone(BASS[bar], 1.9, { type: 'triangle', vol: 0.5, at: nextNote, bus: 'music', attack: 0.05 });
      if (s % 4 === 2) tone(BASS[bar] * 2, 0.4, { type: 'sine', vol: 0.18, at: nextNote, bus: 'music' });
      const p = PATTERN[(s + bar * 3) % 16];
      if (p >= 0) {
        const f = PENTA[(p + bar) % PENTA.length];
        tone(f, 0.45, { type: 'sine', vol: 0.22, at: nextNote, bus: 'music' });
      }
      nextNote += 0.24;
      step++;
    }
  }

  function startMusic() {
    if (!settings.music || musicPlaying || !ensure()) return;
    musicPlaying = true;
    nextNote = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 90);
  }
  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  function setMusic(on) {
    settings.music = !!on;
    if (settings.music) startMusic(); else stopMusic();
  }
  function setSfx(on) { settings.sfx = !!on; }
  function applySettings(s) {
    settings.music = s.music !== false;
    settings.sfx = s.sfx !== false;
    if (!settings.music) stopMusic();
  }

  // Unlock audio on first user gesture (mobile browsers require this).
  function unlock() {
    ensure();
    if (settings.music) startMusic();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  BI.Audio = {
    settings, init: ensure, applySettings, setMusic, setSfx, startMusic, stopMusic,
    playClick, playCollect, playCoin, playBuild, playReward, playLevelUp, playError, playExpand, playWhoosh,
    suspend() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
  };
})();
