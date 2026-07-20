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
    this.events.emit('audio:unlocked');
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
   * Play a one-shot sound effect. Safe no-op if the buffer isn't loaded yet,
   * so gameplay code can call `play()` without guarding.
   */
  play(name, { volume = 1, rate = 1 } = {}) {
    if (!this._ctx || !this._unlocked) return;
    const buffer = this._buffers.get(name);
    if (!buffer) return;
    const src = this._ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = this._ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this._sfxBus);
    src.start();
  }

  onDestroy() {
    if (this._ctx) this._ctx.close();
  }
}
