/**
 * QuickButton.js  (one Home Screen quick-access entry)
 * -----------------------------------------------------------------------------
 * A single square shortcut tile (Island, World Map, Dragons, Collection, Events,
 * Shop, Settings…). Independent, reskin-ready, and stateful: it supports a
 * notification badge, a locked state (dimmed + padlock, no action), a highlight
 * ring (draw attention), and a bouncing tutorial arrow. Later these tiles become
 * tappable buildings on the island — the descriptor stays the same.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI } from '../../theme/UITheme.js';
import { t } from '../../../i18n/Localization.js';
import { Rect } from '../../../utils/Rect.js';
import { Motion } from '../Motion.js';

export class QuickButton {
  /** @param {object} def { id, label, icon, colors, event } */
  constructor(game, def, onTap) {
    this.game = game;
    this.def = def;
    this._tap = onTap;
    this.rect = new Rect(0, 0, 10, 10);
    this._t = Math.random() * 6;
    this._pressAt = -1;
    this.locked = false;
    this.highlight = false;
    this.tutorial = false;
    this.badge = 0;          // 0 = none; -1 = red dot; >0 = count
  }

  setRect(x, y, w, h) { this.rect.x = x; this.rect.y = y; this.rect.w = w; this.rect.h = h; return this; }

  update(dt) { this._t += dt; }

  render(r) {
    const b = this.rect;
    const now = performance.now();
    const pressT = this._pressAt >= 0 ? (now - this._pressAt) / 1000 : 99;
    const press = pressT < 0.35 ? 0.92 + 0.08 * (pressT / 0.35) : 1;
    const float = Motion.float(this._t, 4, 2.6);
    const ctx = r.ctx;

    ctx.save();
    ctx.translate(b.centerX, b.centerY + float);
    ctx.scale(press, press);
    ctx.translate(-b.centerX, -b.centerY);

    // Highlight ring pulses behind the tile.
    if (this.highlight && !this.locked) {
      const p = Motion.pulse(this._t, 1.3);
      r.setAlpha(0.4 + p * 0.4);
      r.withGlow(UI.gold.mid, 12, () => r.strokeRoundRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12, 24, UI.gold.mid, 5));
      r.setAlpha(1);
    }

    UITheme.button(r, b.x, b.y, b.w, b.h, 40, this.locked ? ['#aebccb', '#7e8ea0'] : this.def.colors);
    const icy = b.centerY - b.h * 0.10;
    this.def.icon(r, b.centerX, icy, b.h * 0.26, this.locked ? 'rgba(255,255,255,0.7)' : '#fff');
    r.text(t(this.def.label), b.centerX + 1, b.y + b.h * 0.80 + 1, { font: '800 24px system-ui, sans-serif', color: 'rgba(10,20,50,0.3)', align: 'center', baseline: 'middle' });
    r.text(t(this.def.label), b.centerX, b.y + b.h * 0.80, { font: '800 24px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    if (this.locked) {
      r.setAlpha(0.25); r.fillRoundRect(b.x, b.y, b.w, b.h, 40, '#1a2b4a'); r.setAlpha(1);
    }
    ctx.restore();

    // Badge (drawn unscaled so it always reads).
    if (this.badge !== 0 && !this.locked) this._drawBadge(r);
    // Tutorial arrow bobbing above.
    if (this.tutorial && !this.locked) this._drawArrow(r);
  }

  _drawBadge(r) {
    const b = this.rect;
    const hop = Motion.bounce(this._t, 5, 0.85);
    const bx = b.right - 14, by = b.y + 14 - hop;
    const scale = 1 + Motion.pulse(this._t, 0.85) * 0.12;
    r.withGlow('#ff4d5e', 10, () => r.fillCircle(bx, by, 18 * scale, '#ff4d5e'));
    r.strokeRoundRect(bx - 18 * scale, by - 18 * scale, 36 * scale, 36 * scale, 18 * scale, '#fff', 3);
    if (this.badge > 0) {
      const label = this.badge > 9 ? '9+' : String(this.badge);
      r.text(label, bx, by + 1, { font: `900 ${Math.round(20 * scale)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });
    }
  }

  _drawArrow(r) {
    const b = this.rect;
    const dip = Motion.bounce(this._t, 12, 0.7);
    const ax = b.centerX, ay = b.y - 26 - dip;
    const ctx = r.ctx;
    r.withGlow(UI.gold.mid, 10, () => {
      ctx.fillStyle = UI.gold.mid;
      ctx.beginPath(); ctx.moveTo(ax, ay + 22); ctx.lineTo(ax - 16, ay); ctx.lineTo(ax + 16, ay); ctx.closePath(); ctx.fill();
    });
  }

  onTap(px, py) {
    if (!this.rect.contains(px, py)) return false;
    if (this.locked) { this._tap?.('locked', this); return true; }
    this._pressAt = performance.now();
    this._tap?.('open', this);
    if (this.def.event) this.game.events.emit(this.def.event);
    return true;
  }
}
