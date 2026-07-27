/**
 * ResourceChip.js  (Home Screen · section 4 · one independent resource)
 * -----------------------------------------------------------------------------
 * A single resource capsule: icon disc + a rolling animated value, an optional
 * "+" add button, and a tap-to-show tooltip. It knows nothing about siblings —
 * the ResourceBar lays several of these out and any future resource is just one
 * more chip with a data descriptor, so the bar expands automatically.
 *
 * Reads its balance from the EconomySystem by currency id; the "+" emits
 * `ui:openShop` (never mutates the economy itself). Value changes animate via a
 * shared Rolling counter and a brief highlight pop.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI, Rolling } from '../../theme/UITheme.js';
import { Rect } from '../../../utils/Rect.js';
import { Icons } from '../Icons.js';
import { Motion } from '../Motion.js';

export class ResourceChip {
  /** @param {object} def { id, currency, icon, colors, plus, tip } */
  constructor(game, def, onTap) {
    this.game = game;
    this.def = def;
    this._tap = onTap;
    this.rect = new Rect(0, 0, 10, 10);
    this._val = new Rolling(0);
    this._t = 0;
    this._pop = 0;        // value-change highlight 0..1
    this._tip = 0;        // tooltip timer (s)
    this._last = 0;
    this._plusRect = new Rect(0, 0, 0, 0);
  }

  setRect(x, y, w, h) {
    this.rect.x = x; this.rect.y = y; this.rect.w = w; this.rect.h = h;
    const ps = h * 0.62;
    this._plusRect = new Rect(this.rect.right - ps - 8, y + (h - ps) / 2, ps, ps);
  }

  _balance() { return this.game.getSystem('economy')?.balance(this.def.currency) ?? 0; }

  update(dt) {
    this._t += dt;
    const bal = this._balance();
    if (bal !== this._last) { this._last = bal; this._pop = 1; }
    this._val.set(bal); this._val.update(dt);
    if (this._pop > 0) this._pop = Math.max(0, this._pop - dt * 2);
    if (this._tip > 0) this._tip -= dt;
  }

  render(r) {
    const b = this.rect;
    const rad = b.h / 2;
    UITheme.button(r, b.x, b.y, b.w, b.h, rad, this.def.colors, { shadow: true });
    // Icon disc.
    const ir = b.h * 0.32;
    r.fillCircle(b.x + b.h * 0.5, b.centerY, ir + 5, 'rgba(255,255,255,0.25)');
    this.def.icon(r, b.x + b.h * 0.5, b.centerY, ir);
    // Value (pops on change).
    const pop = 1 + Motion.pulse(this._t, 0.2) * 0 + this._pop * 0.12;
    const left = b.x + b.h * 0.95;
    const right = this.def.plus ? this._plusRect.x - 6 : b.right - b.h * 0.3;
    const font = `900 ${Math.round(34 * pop)}px system-ui, sans-serif`;
    r.text(this._val.text, (left + right) / 2, b.centerY, {
      font, color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4,
    });
    // "+" add button.
    if (this.def.plus) {
      const p = this._plusRect;
      r.withGlow(UI.gold.mid, 6, () => r.fillCircle(p.centerX, p.centerY, p.w / 2, UI.gold.mid));
      Icons.plus(r, p.centerX, p.centerY, p.w * 0.28);
    }
    // Tooltip bubble above the chip.
    if (this._tip > 0) {
      const a = Math.min(1, this._tip * 3);
      r.setAlpha(a);
      const tw = Math.max(160, this.def.tip.length * 11 + 28), th = 46;
      const tx = b.centerX - tw / 2, ty = b.y - th - 12;
      UITheme.glassPanel(r, tx, ty, tw, th, 16);
      r.text(this.def.tip, b.centerX, ty + th / 2, { font: '800 18px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle' });
      r.setAlpha(1);
    }
  }

  onTap(px, py) {
    if (this.def.plus && this._plusRect.contains(px, py)) { this._tap?.(); this.game.events.emit('ui:openShop', { resource: this.def.id }); return true; }
    if (this.rect.contains(px, py)) { this._tap?.(); this._tip = 2.2; return true; }
    return false;
  }
}
