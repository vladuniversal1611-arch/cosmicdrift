/**
 * HudScreen.js
 * -----------------------------------------------------------------------------
 * The in-game overlay: score (with a pop on every gain), the Dragon Energy
 * meter, a punchy combo callout, and the game-over panel.
 *
 * It is a pure view: it holds no game state, only mirrors of it received via
 * 'gameplay:*' events, so it can never desync from or corrupt the simulation.
 * Tapping while game-over restarts the run.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Label } from '../widgets/Label.js';
import { ProgressBar } from '../widgets/ProgressBar.js';
import { Palette } from '../../config/Palette.js';
import { clamp } from '../../utils/MathUtils.js';

export class HudScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'hud';

    this._state = 'playing';
    this._score = 0;
    this._best = 0;
    this._final = 0;
    this._scorePop = 0;       // decays 1 → 0 for the score bump
    this._comboText = '';
    this._comboT = 0;         // seconds remaining on the combo callout
    this._overlayT = 0;       // game-over fade-in
    this._subs = [];          // event unsubscribers, cleaned up on exit

    const w = this.bounds.w;

    // Dragon Energy meter, just under the score.
    this._energyLabel = this.add(new Label('DRAGON ENERGY', 0, this.bounds.h * 0.105, {
      w, align: 'center', font: '700 13px system-ui, sans-serif', color: Palette.textMuted,
    }));
    const bw = w * 0.6;
    this._energy = this.add(new ProgressBar(w * 0.5 - bw / 2, this.bounds.h * 0.105 + 22, bw, 12, {
      value: 0, fill: Palette.energy[0], track: 'rgba(255,255,255,0.08)',
    }));

    this._bind();
  }

  _bind() {
    this._subs.push(this.events.on('gameplay:score', ({ score, add }) => {
      this._score = score;
      if (add > 0) this._scorePop = 1;
    }));
    this._subs.push(this.events.on('gameplay:energy', ({ energy, max }) => {
      this._energy.setValue(max ? energy / max : 0);
    }));
    this._subs.push(this.events.on('gameplay:combo', ({ combo }) => {
      if (combo >= 2) { this._comboText = `COMBO ×${combo}`; this._comboT = 1.3; }
    }));
    this._subs.push(this.events.on('gameplay:stateChanged', ({ state, score, best }) => {
      this._state = state;
      this._best = best ?? this._best;
      if (state === 'over') { this._final = score ?? this._score; this._overlayT = 0; }
    }));
  }

  /** Detach listeners when the HUD is torn down (e.g. on restart/replace). */
  onExit() {
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  update(dt) {
    this._energy.update(dt);
    if (this._scorePop > 0) this._scorePop = Math.max(0, this._scorePop - dt * 3.5);
    if (this._comboT > 0) this._comboT = Math.max(0, this._comboT - dt);
    if (this._state === 'over') this._overlayT = Math.min(1, this._overlayT + dt * 3);
  }

  render(renderer) {
    this._drawScore(renderer);
    for (const child of this.children) child.render(renderer);
    this._drawCombo(renderer);
    if (this._state === 'over') this._drawGameOver(renderer);
  }

  _drawScore(renderer) {
    const cx = this.bounds.centerX;
    const y = this.bounds.h * 0.055;
    const scale = 1 + this._scorePop * 0.28;
    renderer.save();
    renderer.translate(cx, y);
    renderer.scale(scale, scale);
    renderer.withGlow(Palette.accent, 14 * (0.4 + this._scorePop), () => {
      renderer.text(String(this._score), 0, 0, {
        font: '800 46px system-ui, sans-serif', color: Palette.textPrimary,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.restore();
  }

  _drawCombo(renderer) {
    if (this._comboT <= 0) return;
    const t = this._comboT / 1.3;                 // 1 → 0
    const alpha = clamp(t * 1.6, 0, 1);
    const scale = 1.3 - t * 0.3;                   // small settle
    const board = this.game.getSystem('board').area;
    renderer.save();
    renderer.setAlpha(alpha);
    renderer.translate(board.centerX, board.top - 26);
    renderer.scale(scale, scale);
    renderer.withGlow(Palette.warning, 18, () => {
      renderer.text(this._comboText, 0, 0, {
        font: '900 34px system-ui, sans-serif', color: Palette.warning,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.setAlpha(1);
    renderer.restore();
  }

  _drawGameOver(renderer) {
    const b = this.bounds;
    renderer.setAlpha(0.72 * this._overlayT);
    renderer.fillRect(0, 0, b.w, b.h, '#03010a');
    renderer.setAlpha(1);

    const cy = b.centerY;
    const rise = (1 - this._overlayT) * 30;
    renderer.setAlpha(this._overlayT);
    renderer.withGlow(Palette.accent, 22, () => {
      renderer.text('GAME OVER', b.centerX, cy - 90 - rise, {
        font: '900 44px system-ui, sans-serif', color: Palette.textPrimary,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.text('SCORE', b.centerX, cy - 26 - rise, {
      font: '700 15px system-ui, sans-serif', color: Palette.textMuted,
      align: 'center', baseline: 'middle',
    });
    renderer.text(String(this._final), b.centerX, cy + 8 - rise, {
      font: '800 40px system-ui, sans-serif', color: Palette.accentAlt,
      align: 'center', baseline: 'middle',
    });
    renderer.text(`BEST  ${this._best}`, b.centerX, cy + 48 - rise, {
      font: '700 16px system-ui, sans-serif', color: Palette.textMuted,
      align: 'center', baseline: 'middle',
    });
    // Pulsing call to action.
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    renderer.setAlpha(this._overlayT * pulse);
    renderer.text('TAP TO PLAY AGAIN', b.centerX, cy + 110, {
      font: '700 18px system-ui, sans-serif', color: Palette.textPrimary,
      align: 'center', baseline: 'middle',
    });
    renderer.setAlpha(1);
  }

  onTap() {
    if (this._state === 'over' && this._overlayT > 0.6) {
      this.events.emit('ui:restart');
      return true;
    }
    return false;
  }
}
