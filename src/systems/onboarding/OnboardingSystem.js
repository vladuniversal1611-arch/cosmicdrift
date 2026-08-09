/**
 * OnboardingSystem.js
 * -----------------------------------------------------------------------------
 * The First-Time User Experience (FTUE) — a short, friendly coach that teaches
 * the core loop on the very first run and then never shows again. It is purely
 * a GUIDE: a spotlight veil + an instruction card that sit on top of the live
 * HUD without capturing board input, so the player learns by actually doing.
 *
 * Steps (each advances on the real gameplay event it teaches):
 *   0 PLACE   "Drag a relic onto the board."            → game:piecePlaced
 *   1 CLEAR   "Fill a whole row or column to clear it!" → game:linesCleared
 *   2 BOOSTER "Stuck? Tap a booster for instant help."  → booster:used / GOT IT
 *
 * It captures only its own SKIP and GOT IT taps (placed clear of the tray and
 * board); every other tap passes straight through to gameplay.
 *
 * State lives in an `onboarding` save slice so it survives reloads and is shown
 * exactly once. Established players (already past level 1) are marked done on
 * init, so only genuine newcomers ever see it.
 *
 * Events:
 *   listens 'game:started', 'game:piecePlaced', 'game:linesCleared',
 *           'booster:used', 'input:tap', 'ui:screenChanged'
 *   emits   'onboarding:step' ({ step }), 'onboarding:done'
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { t } from '../../i18n/Localization.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../../ui/theme/UITheme.js';
import { Palette } from '../../config/Palette.js';

const STEPS = [
  { id: 'place', title: 'PLACE A RELIC', body: 'Drag a piece from the tray onto the board.', focus: 'tray' },
  { id: 'clear', title: 'CLEAR A LINE', body: 'Fill a whole row or column to clear it and score!', focus: 'board' },
  { id: 'booster', title: 'BOOSTERS', body: 'Stuck? Tap a booster below for instant help.', focus: 'boosters' },
];

export class OnboardingSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'onboarding';
    this._state = null;
    this._active = false;
    this._step = 0;
    this._t = 0;
    this._cardT = 0;        // per-step intro animation
    this._onHud = false;    // only draw while the HUD is the active screen
    // Buttons (positioned in neutral space so they never fight the board/tray).
    this._skipBtn = new Rect(0, 0, 0, 0);
    this._gotItBtn = new Rect(0, 0, 0, 0);
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._state = save.registerSlice('onboarding', () => ({ done: false, step: 0 }));

    // Anyone already past the first level is clearly not a newcomer — retire the
    // FTUE quietly so returning players never see it.
    if (!this._state.done && (this.game.getSystem('level')?.highest ?? 1) > 1) {
      this._state.done = true;
      save.markDirty();
    }

    this.listen('game:started', () => this._maybeBegin());
    this.listen('game:piecePlaced', () => this._advanceOn('place'));
    this.listen('game:linesCleared', () => this._advanceOn('clear'));
    this.listen('booster:used', () => this._advanceOn('booster'));
    this.listen('input:tap', ({ x, y }) => this._onTap(x, y));
    // Pause the coach while a modal (map/shop/pause) covers the HUD.
    this.listen('ui:screenChanged', ({ name }) => { this._onHud = name === 'hud'; });
  }

  get isActive() { return this._active && this._onHud; }

  /** True once the first-run tutorial has been completed (or skipped). */
  get isDone() { return !!this._state?.done; }

  _maybeBegin() {
    if (this._state.done) return;
    this._active = true;
    this._onHud = true;
    this._step = 0;
    this._cardT = 0;
    this.events.emit('onboarding:step', { step: 0, id: STEPS[0].id });
  }

  _advanceOn(id) {
    if (!this._active || STEPS[this._step].id !== id) return;
    this._next();
  }

  _next() {
    this._step++;
    this._cardT = 0;
    if (this._step >= STEPS.length) { this._finish(); return; }
    this.game.getSystem('audio')?.play('structure'); // soft "next step" chime
    this.events.emit('onboarding:step', { step: this._step, id: STEPS[this._step].id });
  }

  _finish() {
    if (!this._active) return;
    this._active = false;
    this._state.done = true;
    this.game.getSystem('save')?.markDirty();
    this.events.emit('onboarding:done');
  }

  _onTap(x, y) {
    if (!this.isActive) return;
    if (this._skipBtn.contains(x, y)) { this._finish(); return; }
    if (STEPS[this._step].id === 'booster' && this._gotItBtn.contains(x, y)) { this._finish(); }
  }

  update(dt) {
    if (!this.isActive) return;
    this._t += dt;
    this._cardT = Math.min(1, this._cardT + dt * 2.6);
  }

  // --- Rendering -------------------------------------------------------------

  /** The focus rectangle for the current step, in logical coordinates. */
  _focusRect() {
    const board = this.game.getSystem('board')?.area;
    const w = this.game.canvas.width, h = this.game.canvas.height;
    const focus = STEPS[this._step].focus;
    if (focus === 'board' && board) return board.inflate(10);
    if (focus === 'tray') {
      const band = this.game.getSystem('pieces')?.trayBand;
      if (band) return new Rect(w * 0.04, band.top - 12, w * 0.92, band.height + 24);
      if (board) return new Rect(w * 0.04, board.bottom + 20, w * 0.92, h * 0.22);
    }
    if (focus === 'boosters') {
      // Mirror the HUD booster-row placement (centred, just below the tray).
      return new Rect(w * 0.12, h * 0.845, w * 0.76, h * 0.075);
    }
    return new Rect(w * 0.1, h * 0.4, w * 0.8, h * 0.2);
  }

  render(r) {
    if (!this.isActive) return;
    const ctx = r.ctx;
    const w = this.game.canvas.width, h = this.game.canvas.height;
    const focus = this._focusRect();
    const pad = 14 + Math.sin(this._t * 3) * 4;
    const fx = focus.x - pad, fy = focus.y - pad;
    const fw = focus.w + pad * 2, fh = focus.h + pad * 2;
    const rad = 28;

    // 1) Dimming veil with a rounded "hole" over the focus area. We fill the
    //    whole screen MINUS the focus using the even-odd rule, so the veil is
    //    simply never painted over the spotlight and the live game shows through
    //    (a destination-out punch would erase the game underneath too).
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#0a1a36';
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    this._addRoundRectSubpath(ctx, fx, fy, fw, fh, rad);
    ctx.fill('evenodd');
    ctx.restore();

    // 2) Pulsing highlight ring around the focus.
    const glow = 0.5 + 0.5 * Math.sin(this._t * 3);
    r.setAlpha(0.7 + glow * 0.3);
    r.withGlow(UI.gold.mid, 14 + glow * 10, () => r.strokeRoundRect(fx, fy, fw, fh, rad, UI.gold.mid, 3));
    r.setAlpha(1);

    // 3) Instruction card — above the board for the tray/booster steps, below
    //    the score for the board step, so it never covers the focus.
    const step = STEPS[this._step];
    const board = this.game.getSystem('board')?.area;
    const above = step.focus !== 'board';
    const cardW = Math.min(760, w - 80), cardH = 190;
    const cardX = (w - cardW) / 2;
    let cardY = above ? (board ? board.top - cardH - 24 : h * 0.24) : (board ? board.bottom + 40 : h * 0.7);
    cardY = Math.max(h * 0.14, Math.min(cardY, h - cardH - 60));

    const pop = 1 - Math.pow(1 - this._cardT, 3);
    ctx.save();
    ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
    ctx.scale(0.9 + pop * 0.1, 0.9 + pop * 0.1);
    ctx.globalAlpha = pop;
    ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));
    UITheme.glassPanel(r, cardX, cardY, cardW, cardH, 30);
    // Step pips.
    for (let i = 0; i < STEPS.length; i++) {
      const on = i <= this._step;
      r.fillCircle(cardX + cardW / 2 + (i - (STEPS.length - 1) / 2) * 26, cardY + 30, on ? 7 : 5,
        on ? UI.gold.mid : 'rgba(20,44,92,0.25)');
    }
    UITheme.heading(r, step.title, cardX + cardW / 2, cardY + 74, 32, UI.ink);
    r.text(step.body, cardX + cardW / 2, cardY + 116, {
      font: '700 22px system-ui, sans-serif', color: UI.inkSoft, align: 'center', baseline: 'middle',
    });

    // On the final step, offer an explicit GOT IT! button (in case the player
    // would rather not spend a booster to finish the tour).
    if (step.id === 'booster') {
      const bw = 220, bh = 46, bx = cardX + cardW / 2 - bw / 2, by = cardY + cardH - bh - 12;
      this._gotItBtn.set(bx, by, bw, bh);
      UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.teal, { shadow: true });
      r.text(t('common.gotIt'), bx + bw / 2, by + bh / 2, {
        font: '900 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
        outline: Palette.textOutline, outlineWidth: 3,
      });
    } else {
      this._gotItBtn.set(0, 0, 0, 0);
    }
    ctx.restore();

    // 4) A bobbing hand pointing at the focus (from the card toward it).
    this._drawPointer(r, focus, above);

    // 5) SKIP button, parked at the very bottom, clear of the tray + boosters.
    const sw = 200, sh = 40, sx = (w - sw) / 2, sy = h - sh - 18;
    this._skipBtn.set(sx, sy, sw, sh);
    r.setAlpha(0.85);
    r.strokeRoundRect(sx, sy, sw, sh, sh / 2, 'rgba(255,255,255,0.7)', 2);
    r.text(t('common.skipTutorial'), sx + sw / 2, sy + sh / 2, {
      font: '800 18px system-ui, sans-serif', color: '#eaf4ff', align: 'center', baseline: 'middle',
    });
    r.setAlpha(1);
  }

  /** Append a rounded-rect subpath to the current path (does NOT beginPath). */
  _addRoundRectSubpath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /**
   * A bobbing chevron arrow that points from the card toward the focus rect:
   * down onto the tray/booster row, up toward the board.
   */
  _drawPointer(r, focus, above) {
    const ctx = r.ctx;
    const bob = Math.sin(this._t * 4) * 7;
    const cx = focus.centerX;
    const dir = above ? 1 : -1;              // 1 = pointing down, -1 = up
    const cy = above ? focus.y - 34 - bob : focus.bottom + 34 + bob;
    const s = 26;
    ctx.save();
    r.withGlow(UI.gold.mid, 12, () => {
      ctx.fillStyle = UI.gold.mid;
      ctx.beginPath();
      // Stem.
      ctx.moveTo(cx - s * 0.28, cy - dir * s);
      ctx.lineTo(cx + s * 0.28, cy - dir * s);
      ctx.lineTo(cx + s * 0.28, cy);
      ctx.lineTo(cx + s * 0.62, cy);
      ctx.lineTo(cx, cy + dir * s * 0.7);      // arrow tip
      ctx.lineTo(cx - s * 0.62, cy);
      ctx.lineTo(cx - s * 0.28, cy);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }
}
