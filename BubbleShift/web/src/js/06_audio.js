/* ==========================================================================
   06_audio.js — procedural sound design (WebAudio) + haptics.
   No audio files: every sound is synthesised (layered body + click +
   shimmer, proper envelopes) through a shared compressor so stacked pops
   never clip. Music is a calm generative pentatonic loop.
   ========================================================================== */
'use strict';

const Audio = (() => {
  let ac = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let musicTimer = 0, musicStep = 0, musicOn = false;
  const PENTA = [0, 2, 4, 7, 9];

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
    const master = ac.createGain(); master.gain.value = 0.9;
    sfxBus = ac.createGain(); musicBus = ac.createGain();
    sfxBus.connect(comp); musicBus.connect(comp); comp.connect(master); master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applySettings();
    document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
  }
  function applySettings() {
    if (!ac) return;
    const st = State.s.settings;
    sfxBus.gain.value = st.sound ? 0.8 : 0;
    musicBus.gain.value = st.music ? 0.22 : 0;
    if (st.music && !musicOn) startMusic();
    if (!st.music && musicOn) stopMusic();
  }

  function tone(freq, dur, opt) {
    if (!ac || !State.s.settings.sound) return;
    opt = opt || {};
    const t0 = ac.currentTime + (opt.delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opt.slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opt.vol == null ? 0.2 : opt.vol, t0 + (opt.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (opt.filter) { const f = ac.createBiquadFilter(); f.type = opt.filter; f.frequency.value = opt.fq || 2000; o.connect(f); node = f; }
    node.connect(g); g.connect(opt.bus || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, opt) {
    if (!ac || !State.s.settings.sound) return;
    opt = opt || {};
    const t0 = ac.currentTime + (opt.delay || 0);
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = opt.type || 'bandpass'; f.frequency.value = opt.fq || 1500; f.Q.value = opt.q || 1;
    if (opt.sweep) f.frequency.exponentialRampToValueAtTime(opt.sweep, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(opt.vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  const note = (semi) => 523.25 * Math.pow(2, semi / 12);

  const S = {
    click() { tone(880, 0.06, { type: 'triangle', vol: 0.12 }); tone(1320, 0.04, { vol: 0.06, delay: 0.01 }); },
    open() { tone(520, 0.12, { type: 'triangle', vol: 0.12, slide: 1.5 }); noise(0.1, { fq: 3000, vol: 0.05 }); },
    close() { tone(700, 0.1, { type: 'triangle', vol: 0.1, slide: 0.6 }); },
    shoot() { noise(0.12, { fq: 900, sweep: 3000, vol: 0.14, q: 0.8 }); tone(300, 0.1, { vol: 0.12, slide: 1.8 }); },
    bounce() { tone(1100, 0.05, { type: 'triangle', vol: 0.08 }); },
    land() { tone(210, 0.09, { vol: 0.18, slide: 0.7 }); noise(0.05, { fq: 700, vol: 0.06 }); },
    // Pops climb the pentatonic scale during a combo, so long chains "sing".
    pop(i, combo) {
      const f = note(Math.min(PENTA[i % 5] + 12 * Math.floor(i / 5) + ((combo || 1) - 1) * 2, 30));
      tone(f, 0.12, { vol: 0.16, slide: 1.25 }); tone(f * 2, 0.06, { type: 'triangle', vol: 0.05 }); noise(0.04, { fq: 4000, vol: 0.05, q: 2 });
    },
    drop(i) { tone(note(7 - (i % 6)) / 2, 0.14, { type: 'triangle', vol: 0.07, slide: 0.8, delay: 0.02 }); },
    crack() { noise(0.12, { fq: 1800, vol: 0.18, q: 3 }); tone(160, 0.1, { type: 'square', vol: 0.05, slide: 0.5, filter: 'lowpass', fq: 800 }); },
    shatter() { noise(0.25, { fq: 5000, vol: 0.14, type: 'highpass' }); for (let i = 0; i < 4; i++) tone(2000 + Math.random() * 2000, 0.08, { vol: 0.04, delay: i * 0.03 }); },
    melt() { noise(0.25, { fq: 3000, sweep: 800, vol: 0.08 }); tone(900, 0.2, { vol: 0.06, slide: 0.5 }); },
    chain() { tone(1400, 0.05, { type: 'square', vol: 0.05, filter: 'bandpass', fq: 2000 }); tone(1800, 0.05, { type: 'square', vol: 0.05, delay: 0.05, filter: 'bandpass', fq: 2400 }); },
    boom() { noise(0.5, { type: 'lowpass', fq: 1200, sweep: 80, vol: 0.4 }); tone(90, 0.4, { vol: 0.35, slide: 0.4 }); },
    rescue() { [0, 4, 7, 12].forEach((s, i) => tone(note(s + 12), 0.18, { type: 'triangle', vol: 0.1, delay: i * 0.06 })); },
    collect() { tone(note(19), 0.1, { type: 'triangle', vol: 0.1 }); tone(note(24), 0.14, { vol: 0.08, delay: 0.05 }); },
    swap() { tone(600, 0.06, { type: 'triangle', vol: 0.1, slide: 1.4 }); tone(840, 0.06, { type: 'triangle', vol: 0.08, slide: 0.7, delay: 0.05 }); },
    rotate() { noise(0.2, { fq: 600, sweep: 1400, vol: 0.06 }); tone(330, 0.16, { type: 'triangle', vol: 0.06, slide: 1.3 }); },
    spread() { tone(140, 0.3, { type: 'sawtooth', vol: 0.05, filter: 'lowpass', fq: 500, slide: 0.8 }); },
    combo(n) { const b = Math.min(n, 8) * 2; [0, 4, 7].forEach((s, i) => tone(note(s + b), 0.16, { type: 'triangle', vol: 0.1, delay: i * 0.04 })); },
    praise() { [0, 7, 12, 16].forEach((s, i) => tone(note(s + 7), 0.2, { vol: 0.09, delay: i * 0.05 })); },
    almost() { tone(note(4), 0.15, { type: 'triangle', vol: 0.08 }); tone(note(2), 0.2, { type: 'triangle', vol: 0.08, delay: 0.1 }); },
    hammer() { noise(0.08, { fq: 400, vol: 0.3, type: 'lowpass' }); tone(80, 0.2, { vol: 0.3, slide: 0.5 }); },
    magic() { for (let i = 0; i < 6; i++) tone(note(12 + PENTA[i % 5] + (i > 4 ? 12 : 0)), 0.2, { vol: 0.06, delay: i * 0.04 }); },
    coin(i) { tone(note(24 + ((i || 0) % 3) * 2), 0.08, { type: 'square', vol: 0.04, filter: 'lowpass', fq: 3000 }); },
    star(i) { tone(note(12 + i * 4), 0.3, { type: 'triangle', vol: 0.14 }); tone(note(24 + i * 4), 0.3, { vol: 0.08, delay: 0.03 }); noise(0.2, { fq: 6000, vol: 0.05, type: 'highpass' }); },
    win() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(note(s), 0.35, { type: 'triangle', vol: 0.11, delay: i * 0.07 })); },
    lose() { [7, 4, 0, -5].forEach((s, i) => tone(note(s), 0.35, { vol: 0.1, delay: i * 0.14 })); },
    bossHit() { tone(180, 0.15, { type: 'square', vol: 0.08, filter: 'lowpass', fq: 900, slide: 0.6 }); noise(0.1, { fq: 900, vol: 0.1 }); },
    bossRoar() { tone(110, 0.6, { type: 'sawtooth', vol: 0.1, filter: 'lowpass', fq: 600, slide: 0.7 }); tone(165, 0.6, { type: 'sawtooth', vol: 0.06, filter: 'lowpass', fq: 600, slide: 0.7 }); },
    build() { for (let i = 0; i < 3; i++) { noise(0.06, { fq: 600, vol: 0.2, type: 'lowpass', delay: i * 0.14 }); tone(160, 0.08, { vol: 0.18, delay: i * 0.14 }); } setTimeout(() => S.magic(), 480); },
    chestOpen() { noise(0.3, { fq: 400, sweep: 3000, vol: 0.1 }); setTimeout(() => S.magic(), 200); },
    unlock() { [0, 7, 12].forEach((s, i) => tone(note(s + 5), 0.25, { type: 'triangle', vol: 0.1, delay: i * 0.08 })); },
    talk() { tone(note(PENTA[Math.floor(Math.random() * 5)] + 12), 0.05, { type: 'triangle', vol: 0.05 }); },
  };

  // Calm 8-bar progression; melody walks the pentatonic scale.
  const CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
  function startMusic() {
    if (!ac || musicOn) return;
    musicOn = true; musicStep = 0;
    const beat = 0.42;
    let mel = 2;
    const tick = () => {
      if (!musicOn) return;
      const ch = CHORDS[Math.floor(musicStep / 8) % CHORDS.length], pos = musicStep % 8;
      if (pos === 0) ch.forEach((s) => tone(note(s - 12), beat * 7.5, { vol: 0.05, attack: 0.3, bus: musicBus }));
      if (pos % 2 === 0) tone(note(ch[0] - 24), beat * 1.8, { type: 'triangle', vol: 0.06, attack: 0.02, bus: musicBus });
      if (pos !== 3 && pos !== 7 && Math.random() < 0.8) {
        mel = U.clamp(mel + [-1, 1, 1, -1, 2, -2, 0][Math.floor(Math.random() * 7)], 0, 9);
        const semi = PENTA[mel % 5] + 12 * Math.floor(mel / 5);
        tone(note(semi), beat * 1.4, { vol: 0.07, attack: 0.01, bus: musicBus });
        tone(note(semi + 12), beat * 0.6, { type: 'triangle', vol: 0.015, bus: musicBus });
      }
      musicStep++;
      musicTimer = setTimeout(tick, beat * 1000);
    };
    tick();
  }
  function stopMusic() { musicOn = false; clearTimeout(musicTimer); }
  function vib(p) { if (!State.s.settings.vib) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } }
  function play(name, a, b) { if (S[name]) S[name](a, b); }
  return { init, applySettings, play, vib };
})();
