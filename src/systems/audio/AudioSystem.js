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
  // A soft, crisp "tick" as a relic lifts off the tray.
  pickup: (a) => {
    a._noise({ dur: 0.045, gain: 0.09, type: 'highpass', freq: 3200 });
    a._tone({ freq: 640, type: 'triangle', dur: 0.07, sweep: 1.3, gain: 0.09 });
  },
  // A tactile "thock": a short filtered-noise transient (the click) over a low
  // sine body-thump with a fast decay, so a placement lands with weight instead
  // of a thin beep. play() adds a little pitch jitter so it never repeats.
  place: (a) => {
    a._noise({ dur: 0.055, gain: 0.16, type: 'lowpass', freq: 2600, sweep: 0.4 });
    a._tone({ freq: 176, type: 'sine', dur: 0.12, sweep: 0.72, gain: 0.30 });
    a._tone({ freq: 330, type: 'triangle', dur: 0.07, gain: 0.10, delay: 0.004 });
  },
  invalid: (a) => {
    a._noise({ dur: 0.06, gain: 0.08, type: 'lowpass', freq: 900, sweep: 0.6 });
    a._tone({ freq: 210, type: 'sine', dur: 0.16, sweep: 0.8, gain: 0.13 });
  },
  clear: (a) => {
    // A soft airy "whoosh" transient under a quick ascending shimmer — the
    // satisfying crunch of a line dissolving.
    a._noise({ dur: 0.22, gain: 0.10, type: 'bandpass', freq: 1400, q: 0.6, sweep: 2.4 });
    [523, 659, 784, 1046].forEach((f, i) =>
      a._tone({ freq: f, type: 'triangle', dur: 0.2, gain: 0.11, delay: i * 0.04 }));
  },
  /**
   * The ASMR escalation: each consecutive clear plays the NEXT note up a C major
   * pentatonic ladder (do-re-mi-…), bell-like, with a tiny sparkle on top. Pass
   * { combo } — the higher the chain, the higher and brighter the note.
   */
  comboStep: (a, o = {}) => {
    const ladder = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
    const f = ladder[Math.min(ladder.length - 1, Math.max(1, o.combo || 1) - 1)];
    a._tone({ freq: f, type: 'sine', dur: 0.34, gain: 0.17 });
    a._tone({ freq: f * 2, type: 'sine', dur: 0.28, gain: 0.05, delay: 0.004 });
    a._tone({ freq: f * 3, type: 'triangle', dur: 0.16, gain: 0.03, delay: 0.008 });
    a._noise({ dur: 0.05, gain: 0.045, type: 'highpass', freq: 6500 });
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

    // Silence everything the moment the app is backgrounded / exited, and
    // resume on return — an AudioContext keeps playing scheduled notes even
    // while the view is hidden, so music must be actively suspended. We cover
    // every signal a WebView/browser might send (visibility, page hide, blur).
    if (typeof document !== 'undefined') {
      this._onHidden = () => this._setActive(false);
      this._onShown = () => this._setActive(true);
      this._visHandler = () => this._setActive(document.visibilityState !== 'hidden' && !document.hidden);
      document.addEventListener('visibilitychange', this._visHandler);
      window.addEventListener('pagehide', this._onHidden);
      window.addEventListener('blur', this._onHidden);
      window.addEventListener('focus', this._onShown);
      window.addEventListener('pageshow', this._onShown);
    }
  }

  /**
   * Foreground/background gate. When the app leaves the foreground we suspend
   * the AudioContext (kills music + SFX at once) and stop the music scheduler
   * so notes don't queue up and burst on return. When it comes back we resume
   * (only if audio was already unlocked) and restart the score.
   */
  _setActive(active) {
    if (!this._ctx) return;
    if (!active) {
      if (this._backgrounded) return;
      this._backgrounded = true;
      if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
      this._musicOn = false;
      if (this._ctx.state === 'running') this._ctx.suspend().catch(() => {});
    } else {
      if (!this._backgrounded) return;
      this._backgrounded = false;
      if (!this._unlocked) return;                 // never start before first gesture
      if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
      this._startMusic();                          // idempotent; re-arms the scheduler
    }
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

  /**
   * A short filtered-noise burst — the percussive transient (tick / thock /
   * whoosh) that pure oscillators can't make. This is what gives placements and
   * clears their tactile "crunch". Cheap: a tiny one-shot noise buffer.
   */
  _noise({ dur = 0.06, gain = 0.15, type = 'bandpass', freq = 2000, q = 0.7, sweep = 1, delay = 0 }) {
    const ctx = this._ctx;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.setValueAtTime(freq, t0);
    filt.Q.value = q;
    if (sweep !== 1) filt.frequency.exponentialRampToValueAtTime(Math.max(60, freq * sweep), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(this._sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  onDestroy() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    if (typeof document !== 'undefined' && this._visHandler) {
      document.removeEventListener('visibilitychange', this._visHandler);
      window.removeEventListener('pagehide', this._onHidden);
      window.removeEventListener('blur', this._onHidden);
      window.removeEventListener('focus', this._onShown);
      window.removeEventListener('pageshow', this._onShown);
    }
    if (this._ctx) this._ctx.close();
  }
}
