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

// Just the two essentials, taught by doing. Deliberately light: no dark veil,
// no board-covering card — a newcomer complained the old coach got in the way.
const STEPS = [
  { id: 'place', title: 'PLACE A PIECE', body: 'Drag a piece from the tray onto the board.', focus: 'tray' },
  { id: 'clear', title: 'CLEAR A LINE', body: 'Fill a whole row or column to clear it and score!', focus: 'board' },
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
    if (this._skipBtn.contains(x, y)) { this._finish(); }
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
    return new Rect(w * 0.1, h * 0.4, w * 0.8, h * 0.2);
  }

  render(r) {
    if (!this.isActive) return;
    const w = this.game.canvas.width, h = this.game.canvas.height;
    const focus = this._focusRect();
    const pad = 12 + Math.sin(this._t * 3) * 3;
    const fx = focus.x - pad, fy = focus.y - pad;
    const fw = focus.w + pad * 2, fh = focus.h + pad * 2;
    const rad = 28;
    this._gotItBtn.set(0, 0, 0, 0);

    // NO dimming veil and NO board-covering card: the coach must never get in
    // the way of actually playing. We only (1) softly ring the thing to touch,
    // (2) point at it, and (3) show a slim caption in the free band BELOW the
    // tray, plus a SKIP. The player sees the whole board the entire time.

    // 1) Soft pulsing highlight ring around the focus (no heavy glow).
    const glow = 0.5 + 0.5 * Math.sin(this._t * 3);
    r.setAlpha(0.55 + glow * 0.35);
    r.strokeRoundRect(fx, fy, fw, fh, rad, UI.gold.mid, 3);
    r.setAlpha(1);

    // 2) Bobbing pointer from just outside the focus toward it.
    const step = STEPS[this._step];
    this._drawPointer(r, focus, step.focus !== 'board');

    // 3) Slim caption in the empty band below the tray (never over the board).
    const band = this.game.getSystem('pieces')?.trayBand;
    const board = this.game.getSystem('board')?.area;
    const trayBottom = band ? band.top + band.height : (board ? board.bottom + h * 0.16 : h * 0.86);
    const cardW = Math.min(680, w - 80), cardH = 96;
    const cardX = (w - cardW) / 2;
    let cardY = trayBottom + 20;
    cardY = Math.min(cardY, h - cardH - 64);        // keep clear of the SKIP row
    const pop = 1 - Math.pow(1 - this._cardT, 3);
    const ctx = r.ctx;
    ctx.save();
    ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
    ctx.scale(0.94 + pop * 0.06, 0.94 + pop * 0.06);
    ctx.globalAlpha = pop;
    ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));
    UITheme.glassPanel(r, cardX, cardY, cardW, cardH, 24);
    UITheme.heading(r, step.title, cardX + cardW / 2, cardY + 34, 26, UI.ink);
    r.text(step.body, cardX + cardW / 2, cardY + 68, {
      font: '700 19px system-ui, sans-serif', color: UI.inkSoft, align: 'center', baseline: 'middle',
    });
    ctx.restore();

    // 4) SKIP, parked at the very bottom.
    const sw = 190, sh = 38, sx = (w - sw) / 2, sy = h - sh - 20;
    this._skipBtn.set(sx, sy, sw, sh);
    r.setAlpha(0.8);
    r.strokeRoundRect(sx, sy, sw, sh, sh / 2, 'rgba(255,255,255,0.7)', 2);
    r.text(t('common.skipTutorial'), sx + sw / 2, sy + sh / 2, {
      font: '800 17px system-ui, sans-serif', color: '#eaf4ff', align: 'center', baseline: 'middle',
    });
    r.setAlpha(1);
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
