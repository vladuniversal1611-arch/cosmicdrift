/* Audio: Web Audio placeholder SFX + a moody generative ambient loop. No audio files. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  const settings = { music: true, sfx: true };
  let musicTimer = null, nextNote = 0, step = 0, musicOn = false;
  let lastZ = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.12; musicBus.connect(master);
    return ctx;
  }
  function tone(freq, dur, o) {
    o = o || {};
    const music = o.bus === 'music';
    if (music ? !settings.music : !settings.sfx) return;
    if (!ensure()) return;
    const t0 = (o.at || ctx.currentTime) + (o.delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur);
    const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(music ? musicBus : sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol, freq, delay, type) {
    if (!settings.sfx || !ensure()) return;
    const t0 = ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 800;
    const g = ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t0);
  }

  const Audio = {
    settings,
    init: ensure,
    playClick() { tone(520, 0.07, { type: 'triangle', vol: 0.15, slide: 700 }); },
    playChop() { noise(0.09, 0.4, 1800); tone(180, 0.08, { type: 'triangle', vol: 0.25 }); },
    playMine() { noise(0.07, 0.35, 4000, 0, 'highpass'); tone(900, 0.06, { type: 'square', vol: 0.06 }); },
    playGather() { noise(0.12, 0.2, 2500); },
    playPickup() { tone(660, 0.08, { type: 'triangle', vol: 0.18 }); tone(990, 0.12, { type: 'triangle', vol: 0.15, delay: 0.06 }); },
    playSwing() { noise(0.12, 0.25, 1200, 0, 'bandpass'); },
    playHit() { noise(0.08, 0.45, 600); tone(110, 0.1, { type: 'square', vol: 0.12 }); },
    playShot() { noise(0.18, 0.7, 2200); tone(90, 0.15, { type: 'square', vol: 0.2, slide: 40 }); },
    playEmpty() { tone(1400, 0.03, { type: 'square', vol: 0.08 }); },
    playZombie() {
      const now = Date.now();
      if (now - lastZ < 1500) return;
      lastZ = now;
      tone(120 + Math.random() * 40, 0.6, { type: 'sawtooth', vol: 0.08, slide: 70, attack: 0.1 });
      noise(0.5, 0.08, 400);
    },
    playHurt() { tone(220, 0.15, { type: 'sawtooth', vol: 0.15, slide: 120 }); noise(0.1, 0.2, 800); },
    playEat() { noise(0.06, 0.25, 1500); noise(0.06, 0.25, 1500, 0.12); noise(0.06, 0.25, 1500, 0.24); },
    playDrink() { [0, 0.1, 0.2].forEach((d) => tone(300 + Math.random() * 80, 0.08, { type: 'sine', vol: 0.15, delay: d, slide: 500 })); },
    playCraft() { noise(0.1, 0.3, 900); tone(330, 0.1, { type: 'triangle', vol: 0.2, delay: 0.08 }); tone(494, 0.18, { type: 'triangle', vol: 0.18, delay: 0.16 }); },
    playBuild() { noise(0.2, 0.4, 500); tone(160, 0.2, { type: 'triangle', vol: 0.3 }); tone(240, 0.2, { type: 'triangle', vol: 0.2, delay: 0.12 }); },
    playBreak() { noise(0.35, 0.5, 700); tone(80, 0.3, { type: 'square', vol: 0.15, slide: 40 }); },
    playLoot() { noise(0.15, 0.2, 3000); tone(520, 0.1, { type: 'triangle', vol: 0.15, delay: 0.1 }); },
    playReward() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.18, delay: i * 0.08 })); },
    playLevelUp() { [330, 440, 523, 659, 880].forEach((f, i) => tone(f, 0.3, { type: 'square', vol: 0.08, delay: i * 0.08 })); },
    playError() { tone(200, 0.16, { type: 'sawtooth', vol: 0.1, slide: 140 }); },
    playAlarm() { [0, 0.35, 0.7].forEach((d) => tone(440, 0.25, { type: 'square', vol: 0.12, delay: d, slide: 330 })); },
    playDeath() { tone(300, 1.2, { type: 'sawtooth', vol: 0.15, slide: 60, attack: 0.05 }); },

    startMusic() {
      if (!settings.music || musicOn || !ensure()) return;
      musicOn = true;
      nextNote = ctx.currentTime + 0.1;
      musicTimer = setInterval(() => {
        if (!musicOn) return;
        // slow minor-key ambient: A minor drones + sparse plucks
        const roots = [110, 87.31, 98, 82.41];
        const notes = [220, 261.63, 329.63, 392, 440, 523.25];
        while (nextNote < ctx.currentTime + 0.4) {
          const bar = Math.floor(step / 16) % 4, s = step % 16;
          if (s === 0) tone(roots[bar], 3.8, { type: 'triangle', vol: 0.45, at: nextNote, bus: 'music', attack: 0.6 });
          if (s % 5 === 2 && Math.random() < 0.7) tone(notes[(s + bar * 2) % notes.length], 1.4, { type: 'sine', vol: 0.18, at: nextNote, bus: 'music', attack: 0.02 });
          nextNote += 0.25;
          step++;
        }
      }, 120);
    },
    stopMusic() { musicOn = false; if (musicTimer) clearInterval(musicTimer); musicTimer = null; },
    setMusic(on) { settings.music = !!on; if (on) this.startMusic(); else this.stopMusic(); },
    setSfx(on) { settings.sfx = !!on; },
    applySettings(s) { settings.music = s.music !== false; settings.sfx = s.sfx !== false; if (!settings.music) this.stopMusic(); },
    suspend() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
  };

  function unlock() {
    ensure();
    if (settings.music) Audio.startMusic();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });

  BI.Audio = Audio;
})();
