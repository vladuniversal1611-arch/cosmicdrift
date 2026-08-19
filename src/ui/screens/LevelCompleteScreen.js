/**
 * LevelCompleteScreen.js
 * -----------------------------------------------------------------------------
 * The victory ceremony, styled as a clean card panel to match the game-over
 * screen: a white rounded card with a soft blue border and cloud-tinted foot,
 * the mascot peeking over the top, "LEVEL COMPLETE!", the earned stars, a
 * "+N coins earned" pill, and two big pill buttons — Next Level + Home.
 *
 * A short eased timeline (mascot/title pop → stars fly in → coins pill → buttons
 * slide up); a single tap fast-forwards to the buttons. Rewards are granted by
 * the economy/world systems before this screen opens, so skipping is safe.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Easing } from '../../utils/Easing.js';
import { Haptics } from '../../utils/Haptics.js';
import { clamp } from '../../utils/MathUtils.js';
import { Rect } from '../../utils/Rect.js';
import { t } from '../../i18n/Localization.js';
import { AssetManager } from '../assets/AssetManager.js';

/** Coerce to a finite number (guards NaN reward/balance values). */
const fin = (v, d) => (Number.isFinite(v) ? v : d);

// Timeline anchors (seconds).
const T = { title: 0.12, star0: 0.5, starGap: 0.28, starDur: 0.4, pill: 1.15, cont: 1.45 };

export class LevelCompleteScreen extends Screen {
  constructor(game, reward = {}) {
    super(game);
    this.name = 'levelcomplete';
    this._t = 0;
    this._reward = { gold: fin(reward.gold, 120) };
    this._starCount = clamp(reward.stars ?? 3, 1, 3);
    this._starPops = [0, 0, 0];
    this._contShown = false;

    // Ambient motes drifting up behind the card.
    this._particles = [];
    for (let i = 0; i < 18; i++) {
      this._particles.push({ x: Math.random() * this.bounds.w, y: Math.random() * this.bounds.h, vy: 8 + Math.random() * 16, ph: Math.random() * 6.28, s: 2 + Math.random() * 4 });
    }
  }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this.game.getSystem('audio')?.play('restore');   // victory fanfare
    Haptics.light(this.game);
  }
  onExit() { this.events.emit('ui:modalClose'); }

  // --- Update ----------------------------------------------------------------
  update(dt) {
    this._t += dt;
    const audio = this.game.getSystem('audio');
    for (let i = 0; i < this._starCount; i++) {
      const at = T.star0 + i * T.starGap;
      if (this._t >= at && this._t - dt < at) { this._starPops[i] = 0.001; audio?.play('reward', { rate: 1 + i * 0.12 }); Haptics.light(this.game); }
      if (this._starPops[i] > 0) { this._starPops[i] += dt; if (this._starPops[i] > 0.5) this._starPops[i] = 0; }
    }
    for (const p of this._particles) { p.y -= p.vy * dt; if (p.y < -10) { p.y = this.bounds.h + 10; p.x = Math.random() * this.bounds.w; } }
    if (this._t >= T.cont && !this._contShown) {
      this._contShown = true;
      audio?.play('levelup'); Haptics.victory(this.game);
    }
  }

  // --- Render ----------------------------------------------------------------
  render(r) {
    const b = this.bounds, ctx = r.ctx, cx = b.centerX;
    // Strong sky veil so the card is the clear focus (the HUD reads as dimmed).
    r.setAlpha(0.72);
    r.fillRect(0, 0, b.w, b.h, r.linearGradient(0, 0, 0, b.h, [[0, 'rgba(34,110,180,0.92)'], [1, 'rgba(20,60,120,0.95)']]));
    r.setAlpha(1);
    this._drawParticles(r);
    this._drawRays(r);

    // Card.
    const cw = Math.min(b.w * 0.9, 860);
    const cardH = 620;
    const cardX = cx - cw / 2;
    const cardY = Math.round(b.centerY - cardH / 2 + 20);
    UITheme.shadow(r, cardX, cardY, cw, cardH, 40, 12, 0.32);
    const cg = r.linearGradient(cardX, cardY, cardX, cardY + cardH, [[0, '#ffffff'], [0.68, '#ffffff'], [1, '#e8f3ff']]);
    r.fillRoundRect(cardX, cardY, cw, cardH, 40, cg);
    r.strokeRoundRect(cardX, cardY, cw, cardH, 40, 'rgba(150,200,255,0.95)', 4);

    // Mascot peeking over the top.
    const mimg = AssetManager.image('mascot');
    if (mimg) {
      const box = cw * 0.42, rr = Math.min(box / mimg.width, box / mimg.height);
      const k = Math.max(0, Math.min(1, (this._t - T.title) / 0.5)), pop = Easing.backOut(k);
      if (k > 0) {
        const mw = mimg.width * rr * pop, mh = mimg.height * rr * pop;
        const myTop = cardY - mh * 0.9 + Math.sin(this._t * 2) * 5;
        ctx.save(); ctx.translate(cx, 0); ctx.rotate(Math.sin(this._t * 3) * 0.04); ctx.translate(-cx, 0);
        ctx.drawImage(mimg, cx - mw / 2, myTop, mw, mh); ctx.restore();
      }
    }

    // Title (two lines, pop-in).
    const tk = Math.max(0, Math.min(1, (this._t - T.title) / 0.5)), ts = tk < 1 ? Easing.backOut(tk) : 1;
    if (tk > 0) {
      ctx.save(); ctx.translate(cx, cardY + 104); ctx.scale(ts, ts);
      UITheme.heading(r, t('levelComplete.line1'), 0, -42, 26, 'rgba(20,44,92,0.55)');
      r.withGlow('#ffcf5e', 16, () => r.text(t('levelComplete.line2'), 0, 24, {
        font: '900 56px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
      }));
      ctx.restore();
    }

    // Stars (fly in one by one).
    this._drawStars(r, cx, cardY + 236);

    // Coins-earned pill.
    this._drawReward(r, cx, cardY + 330);

    // Buttons (Next Level + Home), sliding up once the ceremony settles.
    this._drawButtons(r);

    if (!this._contShown) r.text(t('common.tapToSkip'), cx, b.h - 40, { font: '700 22px system-ui, sans-serif', color: 'rgba(255,255,255,0.55)', align: 'center', baseline: 'middle' });
  }

  _drawStars(r, cx, cy) {
    for (let i = 0; i < 3; i++) {
      const earned = i < this._starCount;
      const x = cx + (i - 1) * 92, y = cy - Math.abs(i - 1) * 16;
      if (!earned) { r.setAlpha(0.25); this._star(r, x, y, 34, 'rgba(120,150,200,0.5)'); r.setAlpha(1); continue; }
      const at = T.star0 + i * T.starGap, k = Math.max(0, Math.min(1, (this._t - at) / T.starDur));
      if (k <= 0) continue;
      const fly = 1 - Easing.smooth(k), sc = Easing.backOut(k), yy = y - fly * 90;
      r.withGlow('#ffd25e', 18, () => this._star(r, x, yy, 42 * sc, '#ffe08a'));
      if (this._starPops[i] > 0) {
        const pk = this._starPops[i] / 0.5; r.setAlpha(1 - pk);
        for (let s = 0; s < 8; s++) { const a = s / 8 * 6.28, rr = pk * 46; r.fillCircle(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 3 * (1 - pk) + 1, '#fff6c8'); }
        r.setAlpha(1);
      }
    }
  }

  _star(r, x, y, rr, col) {
    const ctx = r.ctx; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? rr * 0.45 : rr; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = UI.gold.deep; ctx.stroke();
  }

  _drawReward(r, cx, cy) {
    const k = Math.max(0, Math.min(1, (this._t - T.pill) / 0.4));
    if (k <= 0) return;
    const pop = k < 1 ? Easing.backOut(k) : 1;
    const y = cy + Math.sin(this._t * 2.2) * 3, ctx = r.ctx;
    const label = `+${Math.round(this._reward.gold)}`;
    ctx.font = '900 40px system-ui, sans-serif';
    const tw = ctx.measureText(label).width, padL = 58, padR = 34, h = 68, w = padL + tw + padR, x = cx - w / 2;
    ctx.save(); ctx.translate(cx, y); ctx.scale(pop, pop); ctx.translate(-cx, -y);
    UITheme.button(r, x, y - h / 2, w, h, h / 2, UI.btn.orange, { shadow: true });
    this._coin(r, x + h * 0.5, y, h * 0.34);
    r.text(label, x + padL, y, { font: '900 40px system-ui, sans-serif', color: '#fff', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4 });
    ctx.restore();
    if (k >= 1) r.text(t('levelComplete.earned'), cx, y + h / 2 + 20, { font: '800 20px system-ui, sans-serif', color: 'rgba(20,44,92,0.55)', align: 'center', baseline: 'middle' });
  }

  _coin(r, x, y, rr) {
    const img = AssetManager.image('icon_coin');
    if (img) { r.ctx.drawImage(img, x - rr, y - rr, rr * 2, rr * 2); return; }
    r.fillCircle(x, y, rr, r.linearGradient(x - rr, y - rr, x + rr, y + rr, [[0, '#fff3c4'], [1, '#ffcf5e']]));
    r.text('★', x, y + 1, { font: `900 ${rr}px system-ui, sans-serif`, color: '#e0a41e', align: 'center', baseline: 'middle' });
  }

  /** Deterministic Next / Home button rects — so taps hit-test even mid-ceremony
   *  (before the buttons have been drawn). Kept in sync with render geometry. */
  _buttonRects() {
    const b = this.bounds, cx = b.centerX;
    const cw = Math.min(b.w * 0.9, 860), cardH = 620;
    const cardY = Math.round(b.centerY - cardH / 2 + 20);
    const bw = cw - 88, bx = cx - bw / 2, gap = 14, bottomPad = 30, bh = 74;
    return {
      next: new Rect(bx, cardY + cardH - bottomPad - bh * 2 - gap, bw, bh),
      home: new Rect(bx, cardY + cardH - bottomPad - bh, bw, bh),
    };
  }

  _drawButtons(r) {
    const slide = this._contShown ? 1 : Easing.smooth(clamp((this._t - (T.cont - 0.3)) / 0.3, 0, 1));
    if (slide <= 0) return;
    const off = (1 - slide) * 40;
    const { next, home } = this._buttonRects();
    r.setAlpha(slide);
    this._pill(r, new Rect(next.x, next.y + off, next.w, next.h), UI.btn.play, t('levelComplete.next'), 'next');
    this._pill(r, new Rect(home.x, home.y + off, home.w, home.h), UI.btn.blue, t('menu.home'), 'home');
    r.setAlpha(1);
  }

  _pill(r, rect, colors, label, iconKey) {
    const ctx = r.ctx, rad = rect.h / 2, isz = 17, gap = 16;
    r.withGlow(colors[1], 16, () => r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, rad, colors[1]));
    r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, rad, r.linearGradient(rect.x, rect.y, rect.x, rect.y + rect.h, [[0, colors[0]], [1, colors[1]]]));
    ctx.save(); r.roundRectPath(rect.x, rect.y, rect.w, rect.h, rad); ctx.clip();
    r.fillRoundRect(rect.x + 3, rect.y + 2, rect.w - 6, rect.h * 0.48, rad, 'rgba(255,255,255,0.26)');
    ctx.restore();
    // Fit the label so long translations stay inside the button.
    let size = 26; ctx.font = `900 ${size}px system-ui, sans-serif`;
    while (size > 15 && ctx.measureText(label).width + isz * 2 + gap > rect.w - 40) { size -= 1; ctx.font = `900 ${size}px system-ui, sans-serif`; }
    const lw = ctx.measureText(label).width, gx = rect.centerX - (isz * 2 + gap + lw) / 2;
    this._icon(r, iconKey, gx + isz, rect.centerY, isz, '#fff');
    r.text(label, gx + isz * 2 + gap, rect.centerY, { font: `900 ${size}px system-ui, sans-serif`, color: '#fff', align: 'left', baseline: 'middle', outline: 'rgba(0,0,0,0.12)', outlineWidth: 3 });
  }

  _icon(r, key, cx, cy, s, col) {
    const ctx = r.ctx; ctx.fillStyle = col;
    if (key === 'home') {
      ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy - s * 0.02); ctx.lineTo(cx - s, cy - s * 0.02); ctx.closePath(); ctx.fill();
      r.fillRoundRect(cx - s * 0.66, cy - s * 0.12, s * 1.32, s * 0.95, 3, col);
      return;
    }
    // 'next' — a right-pointing chevron/arrow.
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.34; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx - s * 0.35, cy - s * 0.6); ctx.lineTo(cx + s * 0.4, cy); ctx.lineTo(cx - s * 0.35, cy + s * 0.6); ctx.stroke();
  }

  _drawParticles(r) {
    for (const p of this._particles) { r.setAlpha(0.15 + 0.3 * (0.5 + 0.5 * Math.sin(this._t * 1.5 + p.ph))); r.fillCircle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
  }
  _drawRays(r) {
    const b = this.bounds, ctx = r.ctx; r.setAlpha(0.05);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(b.centerX, b.h * 0.32); ctx.rotate(-0.6 + i * 0.24 + Math.sin(this._t * 0.3) * 0.02); ctx.fillStyle = '#fff'; ctx.fillRect(-40, -b.h, 80, b.h * 2); ctx.restore(); }
    r.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    // If the ceremony is still playing, reveal the buttons — but let the SAME
    // tap also act on a button, so Next Level never feels unresponsive.
    if (!this._contShown) {
      this._contShown = true;
      this._t = Math.max(this._t, T.cont + 0.01);
      this.game.getSystem('audio')?.play('levelup'); Haptics.victory(this.game);
    }
    const { next, home } = this._buttonRects();
    if (next.contains(px, py)) {
      this.game.getSystem('monetization')?.interstitialAtLevelEnd();
      this.events.emit('ui:reveal-next');
      return true;
    }
    if (home.contains(px, py)) { this.events.emit('ui:mainMenu'); return true; }
    return true;
  }
}
