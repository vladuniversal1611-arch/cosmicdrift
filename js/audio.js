/* Tiny Kingdom — звук: процедурні SFX та затишна фонова музика на WebAudio
   (без зовнішніх файлів — усе генерується на льоту). */
'use strict';

const A = {
  ctx: null, musicOn: false, musicTimer: null, step: 0,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },

  _scale: 1, // гучність поточного каналу (звуки/музика), 0..1

  tone(freq, dur, type, vol, when, slide) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    const t0 = c.currentTime + (when || 0);
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime((vol || 0.15) * this._scale, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },

  sfx(name) {
    if (!Game.S || !Game.S.settings.sfx) return;
    if (!this.ensure()) return;
    this._scale = +Game.S.settings.sfx || 0;
    switch (name) {
      case 'click':   this.tone(600, 0.06, 'square', 0.05); break;
      case 'build':   this.tone(180, 0.15, 'triangle', 0.18); this.tone(120, 0.2, 'sine', 0.15, 0.08); break;
      case 'done':    this.tone(520, 0.1, 'triangle', 0.12); this.tone(660, 0.12, 'triangle', 0.12, 0.1); break;
      case 'collect': this.tone(880, 0.08, 'sine', 0.1); this.tone(1174, 0.1, 'sine', 0.1, 0.07); break;
      case 'ach':     [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.1, i * 0.09)); break;
      case 'event':   this.tone(440, 0.25, 'sine', 0.12, 0, 660); this.tone(440, 0.25, 'sine', 0.1, 0.25, 550); break;
    }
  },

  /* лагідний ембіент: повільні арпеджіо в пентатоніці */
  music(on) {
    this.musicOn = on;
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    if (!on) return;
    if (!this.ensure()) return;
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.2, 587.3, 659.2];
    const pattern = [0, 2, 4, 7, 4, 2, 5, 3];
    this.musicTimer = setInterval(() => {
      if (!Game.S || !Game.S.settings.music) return;
      this._scale = +Game.S.settings.music || 0;
      const n = pattern[this.step % pattern.length] + (Math.floor(this.step / 8) % 2 ? 1 : 0);
      this.tone(scale[n % scale.length], 1.4, 'sine', 0.035);
      if (this.step % 4 === 0) this.tone(scale[n % scale.length] / 2, 2.2, 'triangle', 0.03);
      this.step++;
      this._scale = 1;
    }, 700);
  },

  start() { // перший дотик користувача
    if (!this.ensure()) return;
    if (Game.S.settings.music && !this.musicTimer) this.music(true);
  },
};
