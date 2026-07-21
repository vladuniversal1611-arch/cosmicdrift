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

    // Progression state (mirrored from LevelSystem).
    this._level = 1;
    this._worldName = '';
    this._goal = 0;
    this._lines = 0;
    this._banner = null;      // { title, sub, t } discovery/world callout

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
    this._subs.push(this.events.on('level:changed', (d) => {
      this._level = d.level;
      this._worldName = d.worldName;
      this._goal = d.goal;
      this._lines = 0;
      if (d.newMechanic) {
        this._banner = {
          title: `WORLD ${d.world} · ${d.worldName}`,
          sub: `NEW — ${d.newMechanic.label}: ${d.newMechanic.blurb}`,
          t: 3.6,
        };
      } else if (d.levelInWorld === 0) {
        this._banner = { title: `WORLD ${d.world} · ${d.worldName}`, sub: '', t: 2.2 };
      }
    }));
    this._subs.push(this.events.on('level:progress', ({ cleared, goal }) => {
      this._lines = cleared; this._goal = goal;
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
    if (this._banner && (this._banner.t -= dt) <= 0) this._banner = null;
    if (this._state === 'over') this._overlayT = Math.min(1, this._overlayT + dt * 3);
  }

  render(renderer) {
    this._drawScore(renderer);
    this._drawLevel(renderer);
    for (const child of this.children) child.render(renderer);
    this._drawCombo(renderer);
    if (this._banner) this._drawBanner(renderer);
    if (this._state === 'over') this._drawGameOver(renderer);
  }

  /** Level number + world name (left) and line-goal progress (right). */
  _drawLevel(renderer) {
    const y = this.bounds.h * 0.05;
    renderer.text(`LEVEL ${this._level}`, 18, y, {
      font: '800 18px system-ui, sans-serif', color: Palette.textPrimary, baseline: 'middle',
    });
    renderer.text(this._worldName.toUpperCase(), 18, y + 20, {
      font: '700 11px system-ui, sans-serif', color: Palette.textMuted, baseline: 'middle',
    });
    const gx = this.bounds.w - 18;
    renderer.text('LINES', gx, y - 6, {
      font: '700 11px system-ui, sans-serif', color: Palette.textMuted, align: 'right', baseline: 'middle',
    });
    renderer.text(`${this._lines} / ${this._goal}`, gx, y + 14, {
      font: '800 20px system-ui, sans-serif', color: Palette.accentAlt, align: 'right', baseline: 'middle',
    });
  }

  /** Transient world / new-mechanic discovery callout. */
  _drawBanner(renderer) {
    const b = this._banner;
    const life = b.sub ? 3.6 : 2.2;
    const t = b.t / life;                          // 1 → 0
    const alpha = clamp(Math.min(t * 4, (1 - t) * 4 + 0.2, 1), 0, 1);
    const cx = this.bounds.centerX;
    const y = this.bounds.h * 0.3;
    renderer.setAlpha(alpha);
    renderer.withGlow(Palette.accent, 20, () => {
      renderer.text(b.title, cx, y, {
        font: '900 30px system-ui, sans-serif', color: Palette.textPrimary,
        align: 'center', baseline: 'middle',
      });
    });
    if (b.sub) {
      renderer.text(b.sub, cx, y + 34, {
        font: '700 14px system-ui, sans-serif', color: Palette.accentAlt,
        align: 'center', baseline: 'middle',
      });
    }
    renderer.setAlpha(1);
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
