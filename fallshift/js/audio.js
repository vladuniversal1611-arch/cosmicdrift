/* FALLSHIFT — procedural Web Audio: sound effects + a lightweight step-sequenced soundtrack. */
(function () {
  'use strict';
  const FS = window.FS;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
  };

  // world themes: root note, scale, tempo, timbres, chord progression (scale degrees)
  const THEMES = [
    { root: 45, scale: 'minor', bpm: 118, arp: 'triangle', bass: 'sawtooth', prog: [0, 5, 3, 4], cutoff: 900 },   // NEON TOWER
    { root: 38, scale: 'harmonic', bpm: 124, arp: 'square', bass: 'sawtooth', prog: [0, 0, 5, 4], cutoff: 700 },  // REACTOR
    { root: 42, scale: 'phrygian', bpm: 100, arp: 'sine', bass: 'triangle', prog: [0, 1, 0, 6], cutoff: 600 },    // VOID
    { root: 49, scale: 'dorian', bpm: 128, arp: 'square', bass: 'sawtooth', prog: [0, 3, 4, 2], cutoff: 1200 },   // CYBER CORE
    { root: 40, scale: 'minor', bpm: 112, arp: 'sawtooth', bass: 'square', prog: [0, 5, 6, 4], cutoff: 650 },    // COLLAPSE
  ];
  const BOSS_THEME = { root: 40, scale: 'harmonic', bpm: 138, arp: 'sawtooth', bass: 'sawtooth', prog: [0, 0, 1, 0], cutoff: 1400 };
  const MENU_THEME = { root: 45, scale: 'minor', bpm: 96, arp: 'sine', bass: 'triangle', prog: [0, 5, 3, 6], cutoff: 700 };

  const A = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noise: null,
    sfxOn: true,
    musicOn: true,
    mode: 'menu', // menu | game | boss | off
    world: 0,
    fever: false,
    step: 0,
    nextTime: 0,
    timer: null,
    lastRotate: 0,

    init(sfxOn, musicOn) {
      this.sfxOn = sfxOn;
      this.musicOn = musicOn;
    },

    // must be called from a user gesture
    unlock() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
        return;
      }
      const c = this.ctx;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(comp);
      comp.connect(c.destination);
      this.sfxBus = c.createGain();
      this.sfxBus.gain.value = this.sfxOn ? 0.75 : 0;
      this.sfxBus.connect(this.master);
      this.musicBus = c.createGain();
      this.musicBus.gain.value = this.musicOn ? 0.32 : 0;
      this.musicBus.connect(this.master);
      // shared white noise buffer
      const len = c.sampleRate;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.nextTime = c.currentTime + 0.1;
      this.timer = setInterval(() => this.schedule(), 30);
    },

    suspend() {
      if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    },
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    setSfx(on) {
      this.sfxOn = on;
      if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? 0.75 : 0, this.ctx.currentTime, 0.02);
    },
    setMusic(on) {
      this.musicOn = on;
      if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.1);
    },
    setMode(mode) {
      if (this.mode !== mode) {
        this.mode = mode;
        this.step = 0;
      }
    },
    setWorld(w) {
      this.world = w % THEMES.length;
    },
    setFever(f) {
      this.fever = f;
    },

    // ------------------------------------------------------------ primitives
    tone(freq, dur, type, vol, opt) {
      if (!this.ctx || !this.sfxOn) return;
      opt = opt || {};
      const c = this.ctx;
      const t = (opt.at || c.currentTime) + (opt.delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slide), t + dur);
      if (opt.detune) o.detune.value = opt.detune;
      const atk = opt.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = o;
      if (opt.filter) {
        const f = c.createBiquadFilter();
        f.type = opt.filterType || 'lowpass';
        f.frequency.setValueAtTime(opt.filter, t);
        if (opt.filterTo) f.frequency.exponentialRampToValueAtTime(opt.filterTo, t + dur);
        f.Q.value = opt.q || 1;
        o.connect(f);
        node = f;
      }
      node.connect(g);
      g.connect(opt.bus || this.sfxBus);
      o.start(t);
      o.stop(t + dur + 0.05);
    },

    noiseHit(dur, vol, freq, opt) {
      if (!this.ctx || !this.sfxOn) return;
      opt = opt || {};
      const c = this.ctx;
      const t = (opt.at || c.currentTime) + (opt.delay || 0);
      const s = c.createBufferSource();
      s.buffer = this.noise;
      const f = c.createBiquadFilter();
      f.type = opt.type || 'bandpass';
      f.frequency.setValueAtTime(freq, t);
      if (opt.to) f.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
      f.Q.value = opt.q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (opt.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f);
      f.connect(g);
      g.connect(opt.bus || this.sfxBus);
      s.start(t, Math.random() * 0.5);
      s.stop(t + dur + 0.05);
    },

    // ------------------------------------------------------------ sound effects
    play(name, p) {
      if (!this.ctx || !this.sfxOn) return;
      p = p || 0;
      switch (name) {
        case 'rotate': {
          const now = this.ctx.currentTime;
          if (now - this.lastRotate < 0.07) return;
          this.lastRotate = now;
          this.tone(1800 + Math.random() * 300, 0.03, 'sine', 0.025);
          break;
        }
        case 'land':
          this.tone(150, 0.16, 'sine', 0.35, { slide: 55 });
          this.noiseHit(0.06, 0.12, 900, { type: 'lowpass' });
          break;
        case 'heavy':
          this.tone(120, 0.35, 'sine', 0.55, { slide: 35 });
          this.noiseHit(0.25, 0.3, 500, { type: 'lowpass', to: 120 });
          break;
        case 'pass': {
          const f = 520 * Math.pow(2, Math.min(p, 24) / 24);
          this.tone(f, 0.09, 'triangle', 0.09);
          this.tone(f * 1.5, 0.07, 'sine', 0.05, { delay: 0.03 });
          break;
        }
        case 'perfect':
          [0, 4, 7, 12].forEach((s, i) => this.tone(mtof(76 + s), 0.18, 'triangle', 0.12, { delay: i * 0.05 }));
          this.noiseHit(0.3, 0.06, 6000, { type: 'highpass' });
          break;
        case 'coin':
          this.tone(1320, 0.06, 'square', 0.05, { filter: 4000 });
          this.tone(1980, 0.12, 'square', 0.05, { delay: 0.05, filter: 5000 });
          break;
        case 'crystal':
          [0, 7, 12, 19].forEach((s, i) => this.tone(mtof(84 + s), 0.25, 'sine', 0.08, { delay: i * 0.04 }));
          break;
        case 'energy':
          this.tone(380, 0.22, 'sine', 0.14, { slide: 980 });
          this.tone(760, 0.18, 'triangle', 0.05, { slide: 1500, delay: 0.03 });
          break;
        case 'dash':
          this.noiseHit(0.32, 0.35, 3000, { to: 300, q: 2 });
          this.tone(320, 0.25, 'sawtooth', 0.12, { slide: 70, filter: 2000, filterTo: 200 });
          break;
        case 'gravity':
          this.tone(160, 0.5, 'sine', 0.25, { slide: 720 });
          this.tone(240, 0.5, 'triangle', 0.08, { slide: 1100, detune: 12 });
          this.noiseHit(0.4, 0.08, 400, { to: 2500, q: 3 });
          break;
        case 'break':
          this.tone(90, 0.6, 'sine', 0.6, { slide: 30 });
          this.noiseHit(0.55, 0.45, 1500, { type: 'lowpass', to: 150 });
          [0, 5, 9, 14].forEach((s, i) => this.tone(mtof(88 + s), 0.3, 'sine', 0.05, { delay: 0.05 + i * 0.03 }));
          break;
        case 'shatter':
          this.noiseHit(0.18, 0.2, 4000, { type: 'highpass' });
          this.tone(2400 + Math.random() * 800, 0.12, 'sine', 0.05);
          break;
        case 'crumble':
          this.noiseHit(0.22, 0.18, 700, { type: 'lowpass', to: 200 });
          break;
        case 'damage':
          this.tone(260, 0.35, 'sawtooth', 0.25, { slide: 60, filter: 1800 });
          this.noiseHit(0.25, 0.3, 1200, { q: 0.7 });
          break;
        case 'phase':
          this.tone(900, 0.3, 'sine', 0.12, { slide: 300 });
          this.tone(1350, 0.3, 'sine', 0.06, { slide: 450 });
          break;
        case 'portal':
          this.tone(200, 0.5, 'sine', 0.2, { slide: 1600 });
          this.noiseHit(0.5, 0.1, 800, { to: 5000, q: 5 });
          break;
        case 'combo':
          this.tone(mtof(72 + p), 0.12, 'square', 0.06, { filter: 3000 });
          this.tone(mtof(79 + p), 0.18, 'square', 0.05, { delay: 0.06, filter: 3000 });
          break;
        case 'fever':
          for (let i = 0; i < 8; i++) this.tone(mtof(64 + i * 3), 0.12, 'sawtooth', 0.07, { delay: i * 0.035, filter: 3500 });
          this.noiseHit(0.6, 0.15, 500, { to: 6000, q: 2 });
          break;
        case 'boss':
          for (let i = 0; i < 3; i++) {
            this.tone(330, 0.22, 'square', 0.12, { delay: i * 0.5, filter: 1500 });
            this.tone(247, 0.22, 'square', 0.12, { delay: i * 0.5 + 0.25, filter: 1500 });
          }
          this.tone(55, 1.6, 'sawtooth', 0.25, { filter: 300 });
          break;
        case 'bosshit':
          this.tone(200, 0.3, 'square', 0.18, { slide: 80, filter: 1200 });
          this.noiseHit(0.3, 0.25, 2500, { q: 1.5 });
          break;
        case 'bossdie':
          this.tone(60, 1.8, 'sawtooth', 0.4, { slide: 25, filter: 800, filterTo: 80 });
          this.noiseHit(1.6, 0.5, 2000, { type: 'lowpass', to: 80 });
          [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(mtof(72 + s), 0.4, 'triangle', 0.09, { delay: 0.6 + i * 0.07 }));
          break;
        case 'laser':
          this.tone(1100, 0.25, 'sawtooth', 0.04, { slide: 900, filter: 2500 });
          break;
        case 'warn':
          this.tone(880, 0.08, 'square', 0.05, { filter: 2500 });
          break;
        case 'death':
          this.tone(440, 0.9, 'sawtooth', 0.25, { slide: 40, filter: 2000, filterTo: 100 });
          this.noiseHit(0.8, 0.35, 900, { type: 'lowpass', to: 60 });
          break;
        case 'upgrade':
          [0, 4, 7, 11, 14].forEach((s, i) => this.tone(mtof(67 + s), 0.5, 'triangle', 0.08, { delay: i * 0.06 }));
          this.tone(mtof(91), 0.8, 'sine', 0.05, { delay: 0.3 });
          break;
        case 'click':
          this.tone(1500, 0.04, 'triangle', 0.06);
          break;
        case 'deny':
          this.tone(180, 0.12, 'square', 0.06, { filter: 900 });
          break;
        case 'revive':
          [0, 7, 12, 19, 24].forEach((s, i) => this.tone(mtof(60 + s), 0.4, 'sine', 0.12, { delay: i * 0.08 }));
          break;
      }
    },

    // ------------------------------------------------------------ music
    schedule() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const c = this.ctx;
      if (this.nextTime < c.currentTime - 0.2) this.nextTime = c.currentTime + 0.05;
      const theme = this.mode === 'boss' ? BOSS_THEME : this.mode === 'menu' ? MENU_THEME : THEMES[this.world];
      const stepDur = 60 / (theme.bpm * (this.fever && this.mode === 'game' ? 1.06 : 1)) / 4;
      while (this.nextTime < c.currentTime + 0.14) {
        if (this.musicOn && this.mode !== 'off') this.playStep(theme, this.step, this.nextTime, stepDur);
        this.nextTime += stepDur;
        this.step = (this.step + 1) % 64;
      }
    },

    playStep(th, step, t, sd) {
      const bus = this.musicBus;
      const s16 = step % 16;
      const bar = (step / 16) | 0;
      const sc = SCALES[th.scale];
      const deg = th.prog[bar % th.prog.length];
      const note = (d, oct) => th.root + 12 * oct + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
      const menu = this.mode === 'menu';
      const boss = this.mode === 'boss';
      const fever = this.fever && !menu;

      // pad chord at bar start
      if (s16 === 0) {
        [0, 2, 4].forEach((o) => this.mTone(mtof(note(deg + o, 1)), sd * 15, 'triangle', menu ? 0.05 : 0.03, t, { attack: 0.3, filter: 1200 }));
      }
      if (!menu) {
        // kick
        const kick = boss ? [0, 3, 6, 8, 11, 14] : [0, 4, 8, 12];
        if (kick.indexOf(s16) >= 0) {
          this.mTone(150, 0.18, 'sine', 0.5, t, { slide: 42 });
        }
        // snare/clap
        if (s16 === 4 || s16 === 12) this.mNoise(0.12, 0.12, 1800, t);
        // hats
        if (s16 % 4 === 2 || (fever && s16 % 2 === 1) || (boss && s16 % 2 === 0)) this.mNoise(0.035, fever ? 0.06 : 0.04, 8000, t, 'highpass');
        // bass
        if ([0, 3, 6, 8, 11, 14].indexOf(s16) >= 0) {
          this.mTone(mtof(note(deg, -1)), sd * 1.8, th.bass, 0.13, t, { filter: th.cutoff * (fever ? 1.8 : 1), q: 4 });
        }
      } else if (s16 === 0 || s16 === 8) {
        this.mTone(mtof(note(deg, -1)), sd * 7, 'sine', 0.12, t, { attack: 0.05 });
      }
      // arpeggio
      const arpPat = [0, 2, 4, 7, 4, 2, 4, 6];
      const every = menu ? 4 : fever || boss ? 1 : 2;
      if (s16 % every === 0) {
        const i = (s16 / every) | 0;
        const d = deg + arpPat[i % arpPat.length];
        this.mTone(mtof(note(d, fever ? 2 : 1)), sd * (menu ? 3 : 0.9), th.arp, menu ? 0.04 : 0.035, t, { filter: 2600, attack: 0.004 });
      }
    },

    mTone(freq, dur, type, vol, t, opt) {
      const c = this.ctx;
      opt = opt || {};
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (opt.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n = o;
      if (opt.filter) {
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = opt.filter;
        f.Q.value = opt.q || 0.8;
        o.connect(f);
        n = f;
      }
      n.connect(g);
      g.connect(this.musicBus);
      o.start(t);
      o.stop(t + dur + 0.05);
    },

    mNoise(dur, vol, freq, t, type) {
      const c = this.ctx;
      const s = c.createBufferSource();
      s.buffer = this.noise;
      const f = c.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f);
      f.connect(g);
      g.connect(this.musicBus);
      s.start(t, Math.random() * 0.5);
      s.stop(t + dur + 0.02);
    },
  };

  FS.Audio = A;
})();
