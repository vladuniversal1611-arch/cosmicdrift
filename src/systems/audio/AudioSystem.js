/**
 * AudioSystem.js
 * -----------------------------------------------------------------------------
 * Web Audio API wrapper for music and sound effects.
 *
 * Foundation scope: routing graph, volume buses, mute handling and an unlock
 * step for mobile autoplay policies. NO concrete sounds are shipped yet —
 * `register()` and `play()` define the contract that later updates will fill.
 *
 * Architecture:
 *   masterGain
 *     ├── musicGain   (looping tracks)
 *     └── sfxGain     (one-shots)
 * Volumes are driven by SettingsSystem via the 'settings:changed' event, so
 * this system never reads settings directly on a hot path.
 *
 * Events:
 *   listens 'settings:changed'  — sync volume/mute
 *   listens 'input:down'        — first gesture unlocks the AudioContext
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { clamp } from '../../utils/MathUtils.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Procedural SFX recipes. Each is `(audio, opts) => void` and builds its sound
 * from enveloped oscillators. Tuned to feel crystalline and magical to match
 * the art direction. Add entries here to give new events a voice.
 */
const SFX = {
  pickup: (a) => a._tone({ freq: 520, type: 'triangle', dur: 0.09, sweep: 1.35, gain: 0.16 }),
  place: (a) => {
    a._tone({ freq: 392, type: 'sine', dur: 0.13, gain: 0.22 });
    a._tone({ freq: 587, type: 'sine', dur: 0.11, gain: 0.14, delay: 0.02 });
  },
  invalid: (a) => a._tone({ freq: 233, type: 'sine', dur: 0.16, sweep: 0.82, gain: 0.13 }),
  clear: (a) => {
    // Ascending shimmer.
    [523, 659, 784, 1046].forEach((f, i) =>
      a._tone({ freq: f, type: 'triangle', dur: 0.2, gain: 0.13, delay: i * 0.045 }));
  },
  combo: (a) => a._tone({ freq: 880, type: 'sine', dur: 0.16, sweep: 1.5, gain: 0.18 }),
  gameover: (a) => {
    [440, 349, 262].forEach((f, i) =>
      a._tone({ freq: f, type: 'sine', dur: 0.3, gain: 0.18, delay: i * 0.14 }));
  },
  // A structure rising: a bright ascending arpeggio that resolves upward.
  structure: (a) => {
    [523, 659, 784, 1046, 1319].forEach((f, i) =>
      a._tone({ freq: f, type: 'triangle', dur: 0.26, gain: 0.14, delay: i * 0.06 }));
  },
  structureActivate: (a) => a._tone({ freq: 660, type: 'sine', dur: 0.2, sweep: 1.6, gain: 0.16 }),
  // World Progression hooks.
  reward: (a) => { [784, 988].forEach((f, i) => a._tone({ freq: f, type: 'triangle', dur: 0.12, gain: 0.12, delay: i * 0.05 })); },
  biome: (a) => { [392, 523, 659].forEach((f, i) => a._tone({ freq: f, type: 'sine', dur: 0.5, gain: 0.1, delay: i * 0.12 })); },
  restoreStage: (a) => a._tone({ freq: 587, type: 'triangle', dur: 0.2, sweep: 1.4, gain: 0.16 }),
  objectiveComplete: (a) => { [659, 880, 1174].forEach((f, i) => a._tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.14, delay: i * 0.05 })); },
  // A guttural dragon roar for big combos: a low sawtooth that snarls downward.
  dragonRoar: (a) => {
    a._tone({ freq: 150, type: 'sawtooth', dur: 0.6, sweep: 0.55, gain: 0.22 });
    a._tone({ freq: 90, type: 'square', dur: 0.55, sweep: 0.6, gain: 0.14, delay: 0.03 });
  },
  restore: (a) => { // triumphant fanfare
    [523, 659, 784, 1046, 1319, 1568].forEach((f, i) =>
      a._tone({ freq: f, type: 'triangle', dur: 0.4, gain: 0.15, delay: i * 0.09 }));
  },
};

/**
 * Gentle piano background music — a calm, always-consonant loop so the score is
 * melodic and soothing, never harsh. A classic "Axis" progression (Am–F–C–G,
 * all diatonic to C major) is arpeggiated as soft piano notes with an occasional
 * light melody note from the C-major pentatonic (no dissonance possible).
 */
const MUSIC = {
  stepDur: 0.36,          // one eighth note (~calm tempo)
  progression: [
    { bass: 110.00, arp: [220.00, 261.63, 329.63, 440.00] }, // Am
    { bass: 87.31, arp: [174.61, 220.00, 261.63, 349.23] },  // F
    { bass: 130.81, arp: [261.63, 329.63, 392.00, 523.25] }, // C
    { bass: 98.00, arp: [196.00, 246.94, 293.66, 392.00] },  // G
  ],
  melody: [523.25, 587.33, 659.25, 783.99, 880.00],          // C-major pentatonic
};

export class AudioSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'audio';
    /** @type {AudioContext|null} */
    this._ctx = null;
    this._master = null;
    this._musicBus = null;
    this._sfxBus = null;
    this._unlocked = false;
    /** name -> decoded AudioBuffer. Populated by future asset loading. */
    this._buffers = new Map();
  }

  onInit() {
    this._buildGraph();
    this._applySettings();

    // Mobile browsers require a user gesture before audio can play.
    this.listen('input:down', this._unlock);
    this.listen('settings:changed', this._onSettingChanged);
  }

  _buildGraph() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      Logger.warn('AudioSystem', 'Web Audio not supported — audio disabled');
      this.enabled = false;
      return;
    }
    this._ctx = new Ctx();
    this._master = this._ctx.createGain();
    this._musicBus = this._ctx.createGain();
    this._sfxBus = this._ctx.createGain();
    this._musicBus.connect(this._master);
    this._sfxBus.connect(this._master);
    this._master.connect(this._ctx.destination);
  }

  /** Resume the context on the first user gesture (autoplay unlock). */
  _unlock() {
    if (this._unlocked || !this._ctx) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    this._unlocked = true;
    this._startMusic();
    this.events.emit('audio:unlocked');
  }

  // --- Melodic piano background music ----------------------------------------

  /** A soft, piano-like note: sine partials, quick attack, long decay. */
  _piano(freq, dur, gain, t0) {
    const ctx = this._ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);   // percussive attack
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);   // long, mellow decay
    out.connect(this._musicBus);
    for (const [mult, amp] of [[1, 1], [2, 0.3], [3, 0.1]]) {   // fundamental + octave + 12th
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g).connect(out);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
  }

  /** Begin the looping piano score (idempotent; starts after audio unlock). */
  _startMusic() {
    if (this._musicOn || !this._ctx) return;
    this._musicOn = true;
    this._bar = 0;
    this._step = 0;
    this._nextTime = this._ctx.currentTime + 0.15;
    this._musicTimer = setInterval(() => this._scheduleMusic(), 30);
  }

  /** Lookahead scheduler: queue any notes due within the next ~0.2s. */
  _scheduleMusic() {
    if (!this._ctx) return;
    while (this._nextTime < this._ctx.currentTime + 0.2) {
      const chord = MUSIC.progression[this._bar % MUSIC.progression.length];
      const step = this._step, t = this._nextTime;
      if (step === 0) this._piano(chord.bass, 1.9, 0.13, t);                 // soft bass root
      if (step % 2 === 0) this._piano(chord.arp[(step / 2) % chord.arp.length], 0.95, 0.08, t); // arpeggio
      else if (Math.random() < 0.38) {                                        // light melody sparkle
        this._piano(MUSIC.melody[(Math.random() * MUSIC.melody.length) | 0], 0.7, 0.05, t);
      }
      this._nextTime += MUSIC.stepDur;
      if (++this._step >= 8) { this._step = 0; this._bar++; }
    }
  }

  _onSettingChanged({ key }) {
    if (['musicVolume', 'sfxVolume', 'muted'].includes(key)) {
      this._applySettings();
    }
  }

  /** Push the current settings into the gain nodes. */
  _applySettings() {
    if (!this._ctx) return;
    const s = this.game.getSystem('settings');
    const muted = s.get('muted');
    this._master.gain.value = muted ? 0 : 1;
    this._musicBus.gain.value = clamp(s.get('musicVolume'), 0, 1);
    this._sfxBus.gain.value = clamp(s.get('sfxVolume'), 0, 1);
  }

  /**
   * Register a decoded buffer under a name. Asset loading (fetch + decode)
   * will be added when audio assets ship; the contract lives here now so call
   * sites are stable.
   */
  register(name, audioBuffer) {
    this._buffers.set(name, audioBuffer);
  }

  /**
   * Play a one-shot sound effect. If a decoded buffer is registered it is used;
   * otherwise we fall back to a small procedural synth so the game ships with
   * satisfying feedback and no audio assets. Safe no-op before unlock.
   */
  play(name, opts = {}) {
    if (!this._ctx || !this._unlocked) return;
    const buffer = this._buffers.get(name);
    if (buffer) {
      const src = this._ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = opts.rate ?? 1;
      const gain = this._ctx.createGain();
      gain.gain.value = opts.volume ?? 1;
      src.connect(gain).connect(this._sfxBus);
      src.start();
      return;
    }
    const recipe = SFX[name];
    if (recipe) { this._playRate = opts.rate ?? 1; recipe(this, opts); this._playRate = 1; }
  }

  /**
   * Synthesise one enveloped oscillator note into the SFX bus. Building sounds
   * from primitives keeps the game self-contained; swapping in sampled buffers
   * later needs no call-site changes (see `play`).
   */
  _tone({ freq, type = 'sine', dur = 0.15, gain = 0.25, sweep = 1, delay = 0 }) {
    const ctx = this._ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    // A per-play pitch multiplier lets any procedural SFX vary slightly so the
    // same sound never repeats identically (set by play()).
    const rate = this._playRate ?? 1;
    const f = freq * rate;
    osc.frequency.setValueAtTime(f, t0);
    if (sweep !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * sweep), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this._sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  onDestroy() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    if (this._ctx) this._ctx.close();
  }
}
