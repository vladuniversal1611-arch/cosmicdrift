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
import { Rect } from '../../utils/Rect.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';

export class HudScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'hud';

    this._state = 'playing';
    this._score = 0;
    this._displayScore = 0;   // eased "rolling" number toward _score
    this._best = 0;
    this._final = 0;
    this._scorePop = 0;       // decays 1 → 0 for the score bump
    this._comboText = '';
    this._comboT = 0;         // seconds remaining on the combo callout
    this._overlayT = 0;       // game-over fade-in
    this._subs = [];          // event unsubscribers, cleaned up on exit

    // Progression state (mirrored from LevelSystem / ObjectivesSystem).
    this._level = 1;
    this._worldName = '';
    this._objectives = [];    // live Objective instances for the current level
    this._banner = null;      // { title, sub, t } discovery/world callout
    this._structToast = null; // { name, t } structure-built callout
    this._toast = null;       // { text, color, t } reward / biome toast
    this._worldBtn = new Rect(this.bounds.w - 134, 22, 118, 32);

    const w = this.bounds.w;

    // Dragon Energy meter (thin, above the objectives checklist).
    const bw = w * 0.6;
    this._energy = this.add(new ProgressBar(w * 0.5 - bw / 2, this.bounds.h * 0.075, bw, 8, {
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
    this._subs.push(this.events.on('objectives:set', ({ objectives }) => {
      this._objectives = objectives;
    }));
    this._subs.push(this.events.on('structure:completed', ({ name }) => {
      this._structToast = { name, t: 1.8 };
    }));
    // World Progression feedback.
    this._subs.push(this.events.on('reward:granted', ({ essence, gold, materials }) => {
      this._toast = { text: `+${essence} ✧   +${gold} ⬤   +${materials} ▲`, color: Palette.warning, t: 2.4 };
    }));
    this._subs.push(this.events.on('biome:changed', ({ biome }) => {
      this._toast = { text: `ENTERING ${biome.name.toUpperCase()}`, color: Palette.accentAlt, t: 2.6 };
    }));
    this._subs.push(this.events.on('world:taskUnlocked', ({ task }) => {
      this._banner = { title: 'NEW RESTORATION', sub: `${task.name} — open the World Map ◈`, t: 3.6 };
    }));
    this._subs.push(this.events.on('world:restored', ({ task }) => {
      this._banner = { title: `${task.name.toUpperCase()} RESTORED`, sub: 'A new part of the world awakens', t: 3.4 };
    }));
  }

  /** Detach listeners when the HUD is torn down (e.g. on restart/replace). */
  onExit() {
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  update(dt) {
    this._energy.update(dt);
    // Rolling score: ease the displayed number toward the real one.
    this._displayScore += (this._score - this._displayScore) * Math.min(1, dt * 8);
    if (Math.abs(this._score - this._displayScore) < 0.5) this._displayScore = this._score;
    if (this._scorePop > 0) this._scorePop = Math.max(0, this._scorePop - dt * 3.5);
    if (this._comboT > 0) this._comboT = Math.max(0, this._comboT - dt);
    if (this._banner && (this._banner.t -= dt) <= 0) this._banner = null;
    if (this._structToast && (this._structToast.t -= dt) <= 0) this._structToast = null;
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
    if (this._state === 'over') this._overlayT = Math.min(1, this._overlayT + dt * 3);
  }

  render(renderer) {
    this._drawScore(renderer);
    this._drawLevel(renderer);
    this._drawMultiplier(renderer);
    this._drawWorldButton(renderer);
    for (const child of this.children) child.render(renderer);
    this._drawObjectives(renderer);
    this._drawCombo(renderer);
    if (this._toast) this._drawToast(renderer);
    if (this._structToast) this._drawStructToast(renderer);
    if (this._banner) this._drawBanner(renderer);
    if (this._state === 'over') this._drawGameOver(renderer);
  }

  /** Button that opens the floating-world restoration map. */
  _drawWorldButton(renderer) {
    const r = this._worldBtn;
    renderer.fillRoundRect(r.x, r.y, r.w, r.h, 12, Palette.surfaceRaised);
    renderer.strokeRoundRect(r.x, r.y, r.w, r.h, 12, Palette.accent, 1.5);
    renderer.text('◈ WORLD MAP', r.centerX, r.centerY, {
      font: '700 13px system-ui, sans-serif', color: Palette.textPrimary,
      align: 'center', baseline: 'middle',
    });
  }

  /** Brief reward / biome toast just above the board. */
  _drawToast(renderer) {
    const t = clamp(Math.min(this._toast.t * 2, 1), 0, 1);
    renderer.setAlpha(t);
    renderer.withGlow(this._toast.color, 12, () => {
      renderer.text(this._toast.text, this.bounds.centerX, this.bounds.h * 0.185, {
        font: '800 18px system-ui, sans-serif', color: this._toast.color,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.setAlpha(1);
  }

  /** Permanent structure score multiplier, shown beneath the score. */
  _drawMultiplier(renderer) {
    const mult = this.game.getSystem('structures')?.scoreMultiplier ?? 1;
    if (mult <= 1.0001) return;
    renderer.text(`×${mult.toFixed(2)}`, this.bounds.centerX, this.bounds.h * 0.055 + 30, {
      font: '800 16px system-ui, sans-serif', color: Palette.warning,
      align: 'center', baseline: 'middle',
    });
  }

  /** "<NAME> BUILT" callout when a structure rises. */
  _drawStructToast(renderer) {
    const t = this._structToast.t / 1.8;                 // 1 → 0
    const alpha = clamp(Math.min(t * 3, (1 - t) * 3 + 0.2, 1), 0, 1);
    const board = this.game.getSystem('board').area;
    renderer.setAlpha(alpha);
    renderer.withGlow(Palette.accentAlt, 18, () => {
      renderer.text(`${this._structToast.name.toUpperCase()} BUILT`, board.centerX, board.top - 26, {
        font: '900 26px system-ui, sans-serif', color: Palette.accentAlt,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.setAlpha(1);
  }

  /** Level number + world name (top-left). */
  _drawLevel(renderer) {
    const y = this.bounds.h * 0.05;
    renderer.text(`LEVEL ${this._level}`, 18, y, {
      font: '800 18px system-ui, sans-serif', color: Palette.textPrimary, baseline: 'middle',
    });
    renderer.text(this._worldName.toUpperCase(), 18, y + 20, {
      font: '700 11px system-ui, sans-serif', color: Palette.textMuted, baseline: 'middle',
    });
  }

  /**
   * The objectives checklist — the player's live goals for this level. Each row
   * shows an icon, label, progress bar and count, with a green completion pop.
   */
  _drawObjectives(renderer) {
    const rows = this._objectives;
    if (!rows.length) return;
    const w = this.bounds.w;
    const rowW = w * 0.9;
    const x0 = (w - rowW) / 2;
    const rowH = 40;
    const baseY = this.bounds.h * 0.088;

    rows.forEach((o, i) => {
      const y = baseY + i * rowH;
      const cyc = y + (rowH - 6) / 2;
      const done = o.complete;
      const accent = done ? Palette.success : o.color;
      const pop = o.completeT >= 0 ? Math.sin(Math.min(o.completeT / 0.3, 1) * Math.PI) * 0.05 : 0;

      renderer.save();
      renderer.translate(x0 + rowW / 2, cyc);
      renderer.scale(1 + pop, 1 + pop);
      renderer.translate(-(x0 + rowW / 2), -cyc);

      // Row background.
      renderer.fillRoundRect(x0, y, rowW, rowH - 6, 10,
        done ? 'rgba(56,224,138,0.14)' : 'rgba(20,18,42,0.72)');
      renderer.strokeRoundRect(x0, y, rowW, rowH - 6, 10, accent, done ? 1.5 : 1);

      // Icon.
      drawObjectiveIcon(renderer, o.icon, x0 + 22, cyc, 11, accent);

      // Label.
      renderer.text(o.label, x0 + 42, cyc - 7, {
        font: '700 14px system-ui, sans-serif', color: Palette.textPrimary, baseline: 'middle',
      });

      // Progress bar.
      const barX = x0 + 42;
      const barW = rowW - 42 - 62;
      const barY = cyc + 9;
      renderer.fillRoundRect(barX, barY, barW, 5, 2.5, 'rgba(255,255,255,0.08)');
      renderer.fillRoundRect(barX, barY, barW * o.displayProgress, 5, 2.5, accent);

      // Count / check.
      const rx = x0 + rowW - 14;
      if (done) {
        renderer.text('✓', rx, cyc, {
          font: '800 18px system-ui, sans-serif', color: Palette.success, align: 'right', baseline: 'middle',
        });
      } else {
        renderer.text(`${o.progress}/${o.goal}`, rx, cyc, {
          font: '800 13px system-ui, sans-serif', color: Palette.textMuted, align: 'right', baseline: 'middle',
        });
      }
      renderer.restore();
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
      renderer.text(String(Math.round(this._displayScore)), 0, 0, {
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

  onTap(px, py) {
    if (this._state === 'over' && this._overlayT > 0.6) {
      this.events.emit('ui:restart');
      return true;
    }
    if (this._worldBtn.contains(px, py)) {
      this.events.emit('ui:openWorldMap');
      return true;
    }
    return false;
  }
}
