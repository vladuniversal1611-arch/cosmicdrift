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

    // Base line payout grows with simultaneous lines; combo multiplies it.
    const lineScore = g.lineClearBase * count * (1 + (count - 1) * g.multiLineBonus);
    const multiplier = 1 + (this.combo - 1) * g.comboStep;
    const gained = Math.round(lineScore * multiplier);
    this.score += gained;

    // Dragon Energy charges faster on bigger combos.
    this.energy = clamp(this.energy + g.energyPerLine * count * multiplier, 0, g.energyMax);

    // Shake scales with combo depth and simultaneous lines.
    const shake = Config.fx.shakeBase
      + Config.fx.shakePerCombo * (this.combo - 1)
      + (count - 1) * Config.fx.shakePerCombo;
    this.addShake(shake);

    if (this.combo >= 2) this.game.getSystem('audio')?.play('combo', { rate: 1 + this.combo * 0.05 });

    this.events.emit('gameplay:score', { score: this.score, add: gained });
    this.events.emit('gameplay:combo', { combo: this.combo, lines: count });
    this.events.emit('gameplay:energy', { energy: this.energy, max: g.energyMax });
  }

  _onNoClears() {
    if (this.combo !== 0) {
      this.combo = 0;
      this.events.emit('gameplay:combo', { combo: 0, lines: 0 });
    }
  }

  // --- Screen shake ----------------------------------------------------------

  /** Request a shake of at least `mag` px (strongest request wins). */
  addShake(mag) { this._shake = Math.min(MAX_SHAKE, Math.max(this._shake, mag)); }

  update(dt) {
    const r = this.game.renderer;
    if (this._shake > 0.15) {
      this._shake = Math.max(0, this._shake - Config.fx.shakeDecay * dt);
      r.shakeX = (Math.random() * 2 - 1) * this._shake;
      r.shakeY = (Math.random() * 2 - 1) * this._shake;
    } else if (r.shakeX || r.shakeY) {
      this._shake = 0;
      r.shakeX = 0;
      r.shakeY = 0;
    }
  }

  _broadcast() {
    this.events.emit('gameplay:score', { score: this.score, add: 0 });
    this.events.emit('gameplay:combo', { combo: this.combo, lines: 0 });
    this.events.emit('gameplay:energy', { energy: this.energy, max: Config.gameplay.energyMax });
  }
}
