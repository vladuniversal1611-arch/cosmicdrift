/* ============================================================
   AUDIO — синтез звуків через Web Audio API (без файлів)
   Кожна дія має власний звук + фонова ембіент-музика
   ============================================================ */
const AudioFX = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Базовий тон: осцилятор + обвідна гучності */
  function tone({ freq = 440, type = 'sine', dur = 0.15, vol = 0.5, delay = 0, slide = 0, out = master }) {
    if (!ensureCtx() || !Storage.s.settings.sound && out === master) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(out);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  /** Шумовий сплеск (вибухи, розбиття) */
  function noise({ dur = 0.3, vol = 0.4, delay = 0, freq = 800 }) {
    if (!ensureCtx() || !Storage.s.settings.sound) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, t0);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.4, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t0);
  }

  // ---------- Набір ігрових звуків ----------
  const sfx = {
    click()   { tone({ freq: 660, type: 'triangle', dur: 0.07, vol: 0.3 }); },
    pickup()  { tone({ freq: 520, type: 'sine', dur: 0.09, vol: 0.35, slide: 140 }); },
    place()   { tone({ freq: 240, type: 'triangle', dur: 0.1, vol: 0.5 }); tone({ freq: 480, type: 'sine', dur: 0.08, vol: 0.25, delay: 0.02 }); },
    badPlace(){ tone({ freq: 160, type: 'sawtooth', dur: 0.14, vol: 0.25, slide: -60 }); },
    /** Очищення ліній: чим більше ліній — тим соковитіший акорд */
    clear(n = 1) {
      const base = 392;
      for (let i = 0; i < Math.min(n + 1, 5); i++) {
        tone({ freq: base * Math.pow(1.26, i), type: 'triangle', dur: 0.32, vol: 0.4, delay: i * 0.045 });
      }
      noise({ dur: 0.22, vol: 0.16, freq: 900 });
    },
    combo(n) {
      const notes = [523, 659, 784, 1046, 1318];
      for (let i = 0; i <= Math.min(n, 4); i++) {
        tone({ freq: notes[i], type: 'square', dur: 0.14, vol: 0.16, delay: i * 0.06 });
        tone({ freq: notes[i] * 2, type: 'sine', dur: 0.2, vol: 0.12, delay: i * 0.06 });
      }
    },
    coin()    { tone({ freq: 988, type: 'square', dur: 0.07, vol: 0.16 }); tone({ freq: 1319, type: 'square', dur: 0.16, vol: 0.16, delay: 0.07 }); },
    gem()     { tone({ freq: 1568, type: 'sine', dur: 0.25, vol: 0.3, slide: 300 }); },
    crystal() { tone({ freq: 1174, type: 'sine', dur: 0.3, vol: 0.35 }); tone({ freq: 1760, type: 'sine', dur: 0.4, vol: 0.25, delay: 0.08 }); },
    ice()     { noise({ dur: 0.18, vol: 0.3, freq: 2400 }); tone({ freq: 1900, type: 'sine', dur: 0.1, vol: 0.15 }); },
    chain()   { tone({ freq: 300, type: 'square', dur: 0.06, vol: 0.25 }); tone({ freq: 210, type: 'square', dur: 0.1, vol: 0.25, delay: 0.06 }); },
    bomb()    { noise({ dur: 0.55, vol: 0.6, freq: 300 }); tone({ freq: 90, type: 'sine', dur: 0.5, vol: 0.6, slide: -50 }); },
    shield()  { tone({ freq: 220, type: 'sawtooth', dur: 0.12, vol: 0.3 }); noise({ dur: 0.1, vol: 0.15, freq: 1500 }); },
    portal()  { tone({ freq: 300, type: 'sine', dur: 0.35, vol: 0.3, slide: 700 }); },
    fog()     { noise({ dur: 0.4, vol: 0.2, freq: 500 }); },
    win() {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.28, vol: 0.35, delay: i * 0.13 }));
    },
    lose() {
      [392, 349, 311, 262].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.4, vol: 0.3, delay: i * 0.22 }));
    },
    star(i)   { tone({ freq: 880 * Math.pow(1.25, i), type: 'sine', dur: 0.35, vol: 0.4 }); },
    wheel()   { tone({ freq: 700, type: 'square', dur: 0.03, vol: 0.12 }); },
    reward()  { [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.22, vol: 0.3, delay: i * 0.08 })); },
    unlock()  { tone({ freq: 440, type: 'triangle', dur: 0.2, vol: 0.35 }); tone({ freq: 880, type: 'triangle', dur: 0.35, vol: 0.35, delay: 0.12 }); },
    error()   { tone({ freq: 180, type: 'sawtooth', dur: 0.2, vol: 0.3 }); },
    tick()    { tone({ freq: 1000, type: 'sine', dur: 0.04, vol: 0.15 }); },
  };

  // ---------- Фонова музика: спокійний ембіент-арпеджіо ----------
  // Пентатоніка ля-мінор, м'які синуси — не набридає
  const SCALE = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
  function musicLoop() {
    if (!Storage.s.settings.music || !ctx) return;
    const pattern = [0, 2, 4, 6, 5, 3, 4, 1];
    const note = SCALE[pattern[musicStep % pattern.length]] * (musicStep % 16 < 8 ? 1 : 0.75);
    tone({ freq: note, type: 'sine', dur: 1.6, vol: 0.5, out: musicGain });
    if (musicStep % 4 === 0) tone({ freq: note / 2, type: 'triangle', dur: 2.2, vol: 0.3, out: musicGain });
    musicStep++;
  }

  function startMusic() {
    if (musicTimer || !Storage.s.settings.music) return;
    if (!ensureCtx()) return;
    musicTimer = setInterval(musicLoop, 900);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  /** Вібрація (де підтримується) */
  function vibrate(pattern) {
    if (Storage.s.settings.vibration && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* ігноруємо */ }
    }
  }

  // Розблокування аудіо першим дотиком (політика браузерів)
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
    window.addEventListener(ev, () => { ensureCtx(); startMusic(); }, { once: true, passive: true }));

  return { sfx, vibrate, startMusic, stopMusic };
})();
