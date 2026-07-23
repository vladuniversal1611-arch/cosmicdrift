/**
 * GameplaySystem.js
 * -----------------------------------------------------------------------------
 * The rules brain that ties placement and clearing into a satisfying loop:
 * game state, scoring, the combo chain and the Dragon Energy meter. It also
 * owns global screen-shake, driving the Renderer's shake offset each frame.
 *
 * It stays decoupled by reacting to descriptive events emitted by the board and
 * pieces — it never reaches into their internals. Everything it computes is
 * re-broadcast (`gameplay:*`) so the HUD can render without shared state.
 *
 * Combo rule: consecutive placements that clear at least one line raise the
 * combo multiplier and charge Dragon Energy; a placement that clears nothing
 * breaks the chain. Bigger combos => bigger score, more energy, harder shake.
 *
 * Events:
 *   listens 'ui:playPressed', 'ui:restart', 'game:piecePlaced',
 *           'game:linesCleared', 'game:noClears', 'game:over', 'save:loaded'
 *   emits   'game:started', 'gameplay:score', 'gameplay:combo',
 *           'gameplay:energy', 'gameplay:stateChanged'
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { clamp } from '../../utils/MathUtils.js';
import { Easing } from '../../utils/Easing.js';

const MAX_SHAKE = 24;

export class GameplaySystem extends System {
  constructor(game) {
    super(game);
    this.name = 'gameplay';
    this.state = 'menu';      // 'menu' | 'playing' | 'over'
    this.score = 0;
    this.best = 0;
    this.combo = 0;
    this.energy = 0;
    this._shake = 0;
    this._stats = null;

    // --- Cinematic / screen juice (all eased, all real-time) ---
    this._flash = null;       // { t, dur, a, color } full-screen flash
    this._golden = 0;         // 0..dur golden-finale overlay timer
    this._goldenDur = 0;
    this._zoomPulse = null;   // { t, dur, amount } camera zoom pulse
    this._slowmo = null;      // { t, dur } slow-motion recovery
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._stats = save.registerSlice('stats', () => ({ best: 0 }));
    this.best = this._stats.best ?? 0;

    this.listen('ui:playPressed', this.startGame);
    this.listen('ui:restart', this.startGame);
    this.listen('game:piecePlaced', this._onPiecePlaced);
    this.listen('game:linesCleared', this._onLinesCleared);
    this.listen('game:noClears', this._onNoClears);
    this.listen('game:over', this._onGameOver);
    // Living Board tiles feed the meter and shake through these generic hooks.
    this.listen('gameplay:addEnergy', ({ amount }) => this.addEnergy(amount));
    this.listen('fx:shake', ({ mag }) => this.addShake(mag));
    // Any system can request a screen flash (line clears, placements).
    this.listen('fx:flash', ({ color, strength }) => this.flash(color, strength));
    // A new level keeps score/energy but resets the combo chain.
    this.listen('level:changed', () => { this.combo = 0; });
    // Returning to the main menu leaves the 'playing' state (blocks board input).
    this.listen('game:toMenu', () => { this.state = 'menu'; });
  }

  /** Add Dragon Energy directly (Dragon Rune tiles, bonuses). */
  addEnergy(amount) {
    if (!amount) return;
    this.energy = clamp(this.energy + amount, 0, Config.gameplay.energyMax);
    this.events.emit('gameplay:energy', { energy: this.energy, max: Config.gameplay.energyMax });
  }

  get isPlaying() { return this.state === 'playing'; }

  // --- State transitions -----------------------------------------------------

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.combo = 0;
    this.energy = 0;
    this.events.emit('game:started');
    this._broadcast();
    this.events.emit('gameplay:stateChanged', { state: this.state, score: 0, best: this.best });
  }

  _onGameOver() {
    if (this.state !== 'playing') return;
    this.state = 'over';
    if (this.score > this.best) {
      this.best = this.score;
      this._stats.best = this.best;
      this.game.getSystem('save')?.markDirty();
    }
    this.game.getSystem('audio')?.play('gameover');
    this.events.emit('gameplay:stateChanged', { state: 'over', score: this.score, best: this.best });
  }

  // --- Scoring / combo / energy ---------------------------------------------

  _onPiecePlaced({ blocks }) {
    this.score += blocks * Config.gameplay.scorePerBlock;
    this.events.emit('gameplay:score', { score: this.score, add: blocks * Config.gameplay.scorePerBlock });
  }

  _onLinesCleared({ count }) {
    this.combo += 1;
    const g = Config.gameplay;

    // Base line payout grows with simultaneous lines; combo multiplies it, and
    // the permanent Structure Patterns multiplier stacks on top — rewarding the
    // player for pursuing both goals (clears AND structures) at once.
    const lineScore = g.lineClearBase * count * (1 + (count - 1) * g.multiLineBonus);
    const combo = 1 + (this.combo - 1) * g.comboStep;
    const structure = this.game.getSystem('structures')?.scoreMultiplier ?? 1;
    const gained = Math.round(lineScore * combo * structure);
    this.score += gained;

    // Dragon Energy charges faster on bigger combos.
    this.energy = clamp(this.energy + g.energyPerLine * count * combo, 0, g.energyMax);

    // Shake scales with combo depth and simultaneous lines.
    const shake = Config.fx.shakeBase
      + Config.fx.shakePerCombo * (this.combo - 1)
      + (count - 1) * Config.fx.shakePerCombo;
    this.addShake(shake);

    // A light camera "breath" on every clear (bigger clears push in a touch
    // more); the combo finale layers its own stronger zoom on top.
    this.zoomPulse(0.018 + 0.01 * (count - 1), 0.4);

    this._comboFx(this.combo);

    this.events.emit('gameplay:score', { score: this.score, add: gained });
    this.events.emit('gameplay:combo', { combo: this.combo, lines: count });
    this.events.emit('gameplay:energy', { energy: this.energy, max: g.energyMax });
  }

  /**
   * Escalating combo feedback — each tier layers on more spectacle:
   *   x2 small energy wave · x3 bigger explosion · x5 dragon roar ·
   *   x8 cinematic slow-motion + zoom + golden lighting + massive particles.
   */
  _comboFx(combo) {
    const audio = this.game.getSystem('audio');
    const board = this.game.getSystem('board')?.area;
    const cx = board ? board.centerX : 360;
    const cy = board ? board.centerY : 640;

    if (combo >= 2) {
      audio?.play('combo', { rate: 1 + combo * 0.05 });
      this.events.emit('fx:ripple', { x: cx, y: cy, color: '#22b7ff' });
      this.flash('#22b7ff', 0.1);
    }
    if (combo >= 3) {
      this.events.emit('fx:burst', { x: cx, y: cy, color: '#28e0d0', count: 24 });
      this.flash('#ffffff', 0.18);
    }
    if (combo >= 5) {
      audio?.play('dragonRoar');
      this.zoomPulse(0.05, 0.5);
      this.events.emit('fx:burst', { x: cx, y: cy, color: '#ffb020', count: 36 });
    }
    if (combo >= 8) {
      // Cinematic finale.
      this.slowmo(1.2);
      this.zoomPulse(0.09, 1.2);
      this.golden(1.3);
      this.flash('#ffe08a', 0.35);
      this.events.emit('fx:ripple', { x: cx, y: cy, color: '#ffd23d' });
      this.events.emit('fx:burst', { x: cx, y: cy, color: '#ffd23d', count: 60 });
    }
  }

  _onNoClears() {
    if (this.combo !== 0) {
      this.combo = 0;
      this.events.emit('gameplay:combo', { combo: 0, lines: 0 });
    }
  }

  // --- Screen shake ----------------------------------------------------------

  /** Accessibility: skip flashes / zoom / slow-mo when reduced motion is on. */
  get _reducedMotion() { return this.game.getSystem('settings')?.get('reducedMotion'); }

  /** Request a shake of at least `mag` px (strongest request wins). */
  addShake(mag) { if (!this._reducedMotion) this._shake = Math.min(MAX_SHAKE, Math.max(this._shake, mag)); }
  /** Full-screen colour flash that eases out. */
  flash(color = '#ffffff', strength = 0.25) { if (!this._reducedMotion) this._flash = { t: 0, dur: 0.32, a: strength, color }; }
  /** Camera zoom pulse (eased in/out about the screen centre). */
  zoomPulse(amount = 0.06, dur = 0.5) { if (!this._reducedMotion) this._zoomPulse = { t: 0, dur, amount }; }
  /** Golden-lighting overlay for the combo finale. */
  golden(dur = 1.3) { if (!this._reducedMotion) { this._golden = dur; this._goldenDur = dur; } }
  /** Drop into slow-motion, then ease time back to normal over `dur`. */
  slowmo(dur = 1.2) { if (!this._reducedMotion) { this._slowmo = { t: 0, dur }; this.game.time.scale = 0.35; } }

  update(dt) {
    // Cinematic timers run in REAL time even during slow-mo: the loop feeds us
    // `dt` already multiplied by time.scale, so divide it back out.
    const scale = this.game.time.scale || 1;
    const real = dt / scale;
    const r = this.game.renderer;

    // Screen shake.
    if (this._shake > 0.15) {
      this._shake = Math.max(0, this._shake - Config.fx.shakeDecay * real);
      r.shakeX = (Math.random() * 2 - 1) * this._shake;
      r.shakeY = (Math.random() * 2 - 1) * this._shake;
    } else if (r.shakeX || r.shakeY) {
      this._shake = 0; r.shakeX = 0; r.shakeY = 0;
    }

    // Flash decay.
    if (this._flash) { this._flash.t += real; if (this._flash.t >= this._flash.dur) this._flash = null; }

    // Zoom pulse (sine there-and-back), else settle at 1.
    if (this._zoomPulse) {
      this._zoomPulse.t += real;
      const k = Math.min(1, this._zoomPulse.t / this._zoomPulse.dur);
      r.zoom = 1 + this._zoomPulse.amount * Math.sin(k * Math.PI);
      if (k >= 1) { this._zoomPulse = null; r.zoom = 1; }
    }

    // Golden overlay timer.
    if (this._golden > 0) this._golden = Math.max(0, this._golden - real);

    // Slow-motion recovery (ease time.scale 0.35 -> 1).
    if (this._slowmo) {
      this._slowmo.t += real;
      const k = Math.min(1, this._slowmo.t / this._slowmo.dur);
      this.game.time.scale = 0.35 + 0.65 * Easing.cubicOut(k);
      if (k >= 1) { this.game.time.scale = 1; this._slowmo = null; }
    }
  }

  /** Draw full-screen flash + golden finale overlay, above everything. */
  renderOverlay(renderer) {
    const w = this.game.canvas.width;
    const h = this.game.canvas.height;
    const m = 80; // overscan past shake/zoom edges

    if (this._golden > 0 && this._goldenDur > 0) {
      const k = this._golden / this._goldenDur;            // 1 -> 0
      renderer.setAlpha(0.28 * k);
      const g = renderer.radialGradient(w / 2, h / 2, Math.max(w, h) * 0.75,
        [[0, 'rgba(255,224,138,0.9)'], [0.6, 'rgba(255,176,32,0.4)'], [1, 'rgba(255,140,0,0)']]);
      renderer.fillRect(-m, -m, w + m * 2, h + m * 2, g);
      renderer.setAlpha(1);
    }

    if (this._flash) {
      const k = 1 - this._flash.t / this._flash.dur;       // 1 -> 0
      renderer.setAlpha(this._flash.a * k * k);            // eased (quadratic) fade
      renderer.fillRect(-m, -m, w + m * 2, h + m * 2, this._flash.color);
      renderer.setAlpha(1);
    }
  }

  _broadcast() {
    this.events.emit('gameplay:score', { score: this.score, add: 0 });
    this.events.emit('gameplay:combo', { combo: this.combo, lines: 0 });
    this.events.emit('gameplay:energy', { energy: this.energy, max: Config.gameplay.energyMax });
  }
}
