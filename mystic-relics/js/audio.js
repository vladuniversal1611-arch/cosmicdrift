/* ============================================================
 * Mystic Relics — audio.js
 * Усі звуки та музика генеруються процедурно через WebAudio API.
 * Жодних аудіофайлів. Названо Audio2, щоб не конфліктувати
 * з вбудованим window.Audio.
 * ============================================================ */
'use strict';

const Audio2 = {
  ctx: null,
  master: null,
  musicGain: null,
  _musicTimer: null,
  _musicStep: 0,

  /** Ледача ініціалізація — контекст створюється після першого дотику. */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    if (Storage.data.settings.music) this.startMusic();
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  /** Простий тон з обвідною. */
  tone(freq, dur, type = 'sine', vol = 0.3, delay = 0, slide = 0) {
    if (!this.ctx || !Storage.data.settings.sound) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },

  /** Шумовий сплеск (вибухи, пил). */
  noise(dur, vol = 0.2, delay = 0, filterFreq = 1200) {
    if (!this.ctx || !Storage.data.settings.sound) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  },

  /** Іменовані звукові ефекти гри. */
  play(name, arg) {
    if (!this.ctx) return;
    this.resume();
    switch (name) {
      case 'tap':     this.tone(600, 0.08, 'triangle', 0.25); this.tone(900, 0.06, 'sine', 0.15, 0.02); break;
      case 'place':   this.tone(420, 0.1, 'sine', 0.3, 0, -80); break;
      case 'match': { // комбо: висота росте з множником
        const m = Math.min(arg || 1, 6);
        [0, 4, 7].forEach((s, i) => this.tone(523 * Math.pow(2, (s + m * 2) / 12), 0.18, 'triangle', 0.3, i * 0.06));
        this.noise(0.25, 0.15, 0, 2500);
        break;
      }
      case 'win':
        [0, 4, 7, 12, 16].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.35, 'triangle', 0.3, i * 0.12));
        this.noise(0.6, 0.1, 0.5, 4000);
        break;
      case 'lose':
        [7, 3, 0, -5].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), 0.4, 'sawtooth', 0.15, i * 0.18));
        break;
      case 'booster': this.tone(300, 0.3, 'sawtooth', 0.15, 0, 600); this.tone(900, 0.2, 'sine', 0.2, 0.1, 300); break;
      case 'chest':
        this.tone(180, 0.15, 'square', 0.15); this.tone(240, 0.15, 'square', 0.15, 0.12);
        [0, 4, 7, 12].forEach((s, i) => this.tone(660 * Math.pow(2, s / 12), 0.25, 'triangle', 0.25, 0.3 + i * 0.08));
        break;
      case 'coin':    this.tone(1200, 0.08, 'square', 0.12); this.tone(1600, 0.15, 'square', 0.1, 0.06); break;
      case 'gem':     this.tone(1500, 0.2, 'sine', 0.2, 0, 500); break;
      case 'crack':   this.noise(0.12, 0.3, 0, 900); this.tone(200, 0.08, 'square', 0.1); break;
      case 'unlock':  this.tone(500, 0.1, 'square', 0.15); this.tone(750, 0.2, 'triangle', 0.2, 0.08); break;
      case 'error':   this.tone(200, 0.15, 'sawtooth', 0.2); this.tone(150, 0.2, 'sawtooth', 0.2, 0.1); break;
      case 'wheel':   this.tone(800, 0.04, 'square', 0.1); break;
      case 'levelup': [0, 5, 9, 12].forEach((s, i) => this.tone(440 * Math.pow(2, s / 12), 0.3, 'triangle', 0.25, i * 0.1)); break;
      case 'portal':  this.tone(300, 0.5, 'sine', 0.15, 0, 900); this.tone(1200, 0.5, 'sine', 0.1, 0, -900); break;
      case 'curse':   this.tone(120, 0.4, 'sawtooth', 0.2, 0, -40); break;
      case 'freeze':  this.tone(2000, 0.4, 'sine', 0.15, 0, -1400); this.noise(0.3, 0.08, 0, 6000); break;
    }
  },

  /* ---- Процедурна фонова музика: арпеджіо у гамі поточної теми ---- */
  startMusic() {
    this.stopMusic();
    if (!this.ctx || !Storage.data.settings.music) return;
    const step = () => {
      const theme = CFG.THEMES.find(t => t.id === Storage.data.theme) || CFG.THEMES[0];
      const scale = theme.scale, base = theme.base;
      const i = this._musicStep++;
      const bar = Math.floor(i / 8) % 4;
      // Бас на початку такту
      if (i % 8 === 0) this._mtone(base / 2 * Math.pow(2, scale[bar % scale.length] / 12), 1.6, 'sine', 0.5);
      // М'яке арпеджіо
      const n = scale[(i * 3 + bar) % scale.length] + 12 * ((i >> 1) % 2);
      this._mtone(base * Math.pow(2, n / 12), 0.9, 'triangle', 0.35);
      this._musicTimer = setTimeout(step, 280);
    };
    step();
  },

  _mtone(freq, dur, type, vol) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(t0); o.stop(t0 + dur + 0.1);
  },

  stopMusic() { clearTimeout(this._musicTimer); this._musicTimer = null; },

  toggleMusic(on) { on ? this.startMusic() : this.stopMusic(); }
};
