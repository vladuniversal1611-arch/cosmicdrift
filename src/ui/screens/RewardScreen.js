/**
 * RewardScreen.js
 * -----------------------------------------------------------------------------
 * A reusable, celebratory reward reveal. Nothing here is ever instant: the icon
 * bursts in with a spring, golden rays sweep, particles rain, the reward chips
 * roll up their numbers, and a Continue button appears once the moment has
 * landed. It is PURE PRESENTATION — the currency was already granted and
 * persisted by the RetentionSystem, so skipping the celebration costs nothing.
 *
 * It celebrates any `data` descriptor:
 *   { title, subtitle, icon, color, reward: { coins, gems, materials, ... }, big }
 *
 * `opts.done` names the event fired when the player taps Continue. Level-flow
 * reveals chain via 'ui:reveal-next'; standalone claims fall back to 'ui:back'.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { Quality } from '../../config/Quality.js';
import { t } from '../../i18n/Localization.js';

// Friendly labels + icons for each reward currency key.
const REWARD_META = Object.freeze({
  coins: { label: 'COINS', icon: 'coins', color: '#ffcf5e' },
  gems: { label: 'GEMS', icon: 'gem', color: '#7cc9ff' },
  materials: { label: 'MATERIALS', icon: 'statue', color: '#c8b48a' },
  essence: { label: 'ESSENCE', icon: 'crystal', color: '#b98cff' },
  stardust: { label: 'STARDUST', icon: 'gem', color: '#ffffff' },
});

export class RewardScreen extends Screen {
  constructor(game, data, { done = 'ui:back' } = {}) {
    super(game);
    this.name = 'reward';
    this._data = data || {};
    this._done = done;
    this._t = 0;
    this._ray = 0;
    this._parts = [];
    this._ready = false;

    // One rolling number per reward line, so each counts up on reveal.
    this._rolls = Object.entries(this._data.reward || {}).map(([k, v]) => ({
      key: k, target: v, roll: new Rolling(0),
    }));

    const w = this.bounds.w, h = this.bounds.h;
    const bw = w * 0.56, bh = 92;
    this._btn = this.add(new PremiumButton(w / 2 - bw / 2, h * 0.78, bw, bh,
      () => this.events.emit(this._done),
      { label: t('common.continue'), colors: UI.btn.play, radius: 28, font: '900 34px system-ui, sans-serif' }));
    this._btn.visible = false;
  }

  onEnter() {
    this.game.getSystem('audio')?.play('reward');
    // Seed a celebratory burst (respecting the particle budget).
    const n = Math.min(Quality.maxParticles, this._data.big ? 60 : 34);
    const cx = this.bounds.centerX, cy = this.bounds.h * 0.34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 340;
      this._parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
        t: 0, life: 1 + Math.random() * 1.2, s: 4 + Math.random() * 6,
        c: Math.random() < 0.5 ? (this._data.color || '#ffcf5e') : '#fff' });
    }
  }

  update(dt) {
    this._t += dt;
    this._ray += dt * 0.6;
    // Reveal the numbers after the icon spring settles, then the button.
    if (this._t > 0.35) this._rolls.forEach((r) => r.roll.set(r.target));
    this._rolls.forEach((r) => r.roll.update(dt));
    if (this._t > 0.7 && !this._btn.visible) { this._btn.visible = true; this._ready = true; }
    for (let i = this._parts.length - 1; i >= 0; i--) {
      const p = this._parts[i];
      p.t += dt; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) this._parts.splice(i, 1);
    }
  }

  render(r) {
    const b = this.bounds;
    // Warm sky veil (never a black-out) so the celebration stays bright.
    r.setAlpha(0.8);
    const veil = r.linearGradient(0, 0, 0, b.h, [[0, 'rgba(38,120,195,0.94)'], [1, 'rgba(22,74,140,0.96)']]);
    r.fillRect(0, 0, b.w, b.h, veil); r.setAlpha(1);

    const cx = b.centerX, cy = b.h * 0.34;
    const color = this._data.color || '#ffcf5e';

    // Sweeping golden rays behind the prize.
    if (Quality.highQuality) this._drawRays(r, cx, cy, color);

    // Icon with a spring pop-in.
    const pop = Math.min(1, this._t / 0.35);
    const spring = 1 + Math.sin(Math.min(this._t, 0.35) / 0.35 * Math.PI) * 0.35;
    const scale = (0.2 + pop * 0.8) * spring;
    r.save();
    r.translate(cx, cy);
    r.scale(scale, scale);
    r.withGlow(color, 30, () => {
      r.fillCircle(0, 0, 62, 'rgba(255,255,255,0.10)');
      drawObjectiveIcon(r, this._data.icon || 'chest', 0, 0, 46, color);
    });
    r.restore();

    // Title + subtitle.
    r.setAlpha(Math.min(1, this._t * 3));
    // Announce WHAT was unlocked: prefer an explicit title, else the unlock's
    // name (e.g. "New Board Theme"), with its kind as a subtitle.
    const title = this._data.title || this._data.name || 'REWARD!';
    const subtitle = this._data.subtitle || this._data.kind || null;
    r.withGlow(color, 18, () => UITheme.heading(r, title, cx, b.h * 0.52, this._data.big ? 40 : 34, '#fff'));
    if (subtitle) {
      r.text(subtitle, cx, b.h * 0.52 + 34, {
        font: '800 16px system-ui, sans-serif', color: color, align: 'center', baseline: 'middle',
      });
    }
    r.setAlpha(1);

    // Reward chips with rolling numbers.
    this._drawRewards(r, cx, b.h * 0.6);

    // Particles + button.
    for (const p of this._parts) {
      r.setAlpha(Math.max(0, 1 - p.t / p.life));
      r.fillCircle(p.x, p.y, p.s, p.c);
    }
    r.setAlpha(1);
    for (const child of this.children) child.render(r);
  }

  _drawRays(r, cx, cy, color) {
    r.save();
    r.setAlpha(0.14);
    r.translate(cx, cy);
    r.rotate(this._ray);
    for (let i = 0; i < 12; i++) {
      r.rotate((Math.PI * 2) / 12);
      r.ctx.fillStyle = color;
      r.ctx.beginPath();
      r.ctx.moveTo(0, 0);
      r.ctx.lineTo(-40, -520);
      r.ctx.lineTo(40, -520);
      r.ctx.closePath();
      r.ctx.fill();
    }
    r.restore();
    r.setAlpha(1);
  }

  _drawRewards(r, cx, y) {
    if (!this._rolls.length) return;
    const chipH = 52, gap = 12;
    const chipW = 250;
    const total = this._rolls.length;
    const startY = y - ((chipH + gap) * total - gap) / 2 + chipH / 2;
    this._rolls.forEach((rw, i) => {
      const meta = REWARD_META[rw.key] || { label: rw.key.toUpperCase(), icon: 'gem', color: '#fff' };
      const cyy = startY + i * (chipH + gap);
      const x = cx - chipW / 2;
      UITheme.button(r, x, cyy - chipH / 2, chipW, chipH, chipH / 2, UI.btn.purple, { shadow: true });
      drawObjectiveIcon(r, meta.icon, x + 32, cyy, 15, meta.color);
      r.text(`+${rw.roll.text}`, x + 60, cyy, {
        font: '900 26px system-ui, sans-serif', color: '#fff', baseline: 'middle',
      });
      r.text(meta.label, x + chipW - 20, cyy, {
        font: '800 13px system-ui, sans-serif', color: 'rgba(255,255,255,0.85)', align: 'right', baseline: 'middle',
      });
    });
  }

  onTap() {
    // handleTap already gave the Continue button first refusal; a tap anywhere
    // else (once the moment has landed) also advances, so it feels responsive.
    if (this._ready) { this.events.emit(this._done); return true; }
    return false;
  }
}
