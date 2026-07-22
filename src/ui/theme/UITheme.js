/**
 * UITheme.js
 * -----------------------------------------------------------------------------
 * The handcrafted premium look shared by every menu/overlay. Instead of flat
 * rectangles, these helpers draw glossy gradient buttons with beveled GOLD
 * frames, translucent GLASS panels with top highlights and soft drop-shadows,
 * currency chips, and rolling-number helpers — the Royal Match / Dream Games
 * vocabulary. Bright, saturated, high-contrast; never dark or flat.
 *
 * Everything is a pure draw call over the Renderer, so screens stay simple and
 * the style is consistent and tweakable in one place.
 * -----------------------------------------------------------------------------
 */

import { Theme } from './Theme.js';
import { drawFrame } from '../render/NineSlice.js';

/** Bright, premium palette (deliberately NOT the dark in-game board colours). */
export const UI = Object.freeze({
  sky: ['#7fc9ff', '#a9e0ff', '#dff4ff'],
  gold: Object.freeze({ light: '#fff3c4', mid: '#ffcf5e', deep: '#e0891e', line: '#a75c0c' }),
  ink: '#233a72',
  inkSoft: '#5f6fa8',
  white: '#ffffff',
  shadow: 'rgba(12,22,60,0.38)',
  panel: ['rgba(255,255,255,0.96)', 'rgba(222,236,255,0.92)'],
  /** Button colour ramps (top gloss → saturated base). */
  btn: Object.freeze({
    play: ['#9cf07a', '#37a83f'],
    blue: ['#8fd2ff', '#2f8fe0'],
    purple: ['#d7a6ff', '#8a4fe0'],
    pink: ['#ffb2d3', '#ff5c94'],
    orange: ['#ffd58c', '#ff9422'],
    teal: ['#93f1e2', '#1fb6a6'],
    red: ['#ff9a9a', '#e0433f'],
  }),
});

export const UITheme = {
  /** Soft blurred drop-shadow beneath a rounded shape. */
  shadow(r, x, y, w, h, rad, offset = 8, alpha = 0.38) {
    r.setAlpha(alpha);
    r.withGlow('rgba(0,0,0,0.5)', 18, () => r.fillRoundRect(x, y + offset, w, h, rad, '#0a1230'));
    r.setAlpha(1);
  },

  /** Layered bevelled gold frame around a rounded rect. */
  goldFrame(r, x, y, w, h, rad, wd = 4) {
    r.strokeRoundRect(x, y, w, h, rad, UI.gold.line, wd + 2);
    r.strokeRoundRect(x, y, w, h, rad, UI.gold.mid, wd);
    r.strokeRoundRect(x + wd * 0.5, y + wd * 0.5, w - wd, h - wd, Math.max(2, rad - 1), UI.gold.light, Math.max(1, wd * 0.4));
  },

  /**
   * A glossy, golden-framed button body (no text). `colors` is a [top,base]
   * ramp from UI.btn. Draws shadow → gradient body → glass gloss → gold frame.
   */
  button(r, x, y, w, h, rad, colors, { shadow = true, frame = true, style = 'button' } = {}) {
    // Asset seam: use final nine-slice art when registered, else draw the
    // procedural placeholder below. Label/icon are drawn by the caller on top.
    const fr = Theme.frame(style);
    if (drawFrame(r, fr.key, x, y, w, h, fr.inset, () => this._buttonProcedural(r, x, y, w, h, rad, colors, shadow, frame))) return;
  },

  _buttonProcedural(r, x, y, w, h, rad, colors, shadow, frame) {
    if (shadow) this.shadow(r, x, y, w, h, rad, h * 0.09);
    const body = r.linearGradient(x, y, x, y + h, [[0, colors[0]], [0.5, colors[1]], [1, colors[1]]]);
    r.fillRoundRect(x, y, w, h, rad, body);
    // Glass gloss over the top portion, clipped to the button.
    const ctx = r.ctx;
    ctx.save();
    r.roundRectPath(x, y, w, h, rad); ctx.clip();
    const gloss = r.linearGradient(x, y, x, y + h * 0.6, [[0, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
    r.fillRoundRect(x + 3, y + 2, w - 6, h * 0.52, rad, gloss);
    ctx.restore();
    if (frame) this.goldFrame(r, x, y, w, h, rad, Math.max(3, h * 0.055));
  },

  /** Translucent glass panel with a bright top highlight + gold trim. */
  glassPanel(r, x, y, w, h, rad = 22, { gold = true } = {}) {
    const fr = Theme.frame('panel.glass');
    if (drawFrame(r, fr.key, x, y, w, h, fr.inset, () => this._glassPanelProcedural(r, x, y, w, h, rad, gold))) return;
  },

  _glassPanelProcedural(r, x, y, w, h, rad, gold) {
    this.shadow(r, x, y, w, h, rad, 10, 0.42);
    const g = r.linearGradient(x, y, x, y + h, [[0, UI.panel[0]], [1, UI.panel[1]]]);
    r.fillRoundRect(x, y, w, h, rad, g);
    const ctx = r.ctx;
    ctx.save();
    r.roundRectPath(x, y, w, h, rad); ctx.clip();
    r.setAlpha(0.55);
    r.fillRoundRect(x, y, w, h * 0.38, rad, 'rgba(255,255,255,0.9)');
    r.setAlpha(1);
    ctx.restore();
    r.strokeRoundRect(x, y, w, h, rad, 'rgba(255,255,255,0.95)', 2);
    if (gold) this.goldFrame(r, x, y, w, h, rad, 4);
  },

  /** A pill "chip" (currency / stat) with a gold frame and a coloured cap. */
  chip(r, x, y, w, h, capColor) {
    this.shadow(r, x, y, w, h, h / 2, 5, 0.3);
    const g = r.linearGradient(x, y, x, y + h, [[0, 'rgba(30,44,92,0.92)'], [1, 'rgba(16,24,58,0.92)']]);
    r.fillRoundRect(x, y, w, h, h / 2, g);
    this.goldFrame(r, x, y, w, h, h / 2, 3);
    // Round coloured cap on the left where an icon sits.
    r.withGlow(capColor, 8, () => r.fillCircle(x + h / 2, y + h / 2, h * 0.42, capColor));
  },

  /** Heading text with a soft dark shadow for contrast on bright backgrounds. */
  heading(r, text, x, y, size, color = UI.white) {
    r.text(text, x + 2, y + 3, { font: `900 ${size}px system-ui, sans-serif`, color: 'rgba(10,20,50,0.35)', align: 'center', baseline: 'middle' });
    r.text(text, x, y, { font: `900 ${size}px system-ui, sans-serif`, color, align: 'center', baseline: 'middle' });
  },
};

/** Small helper: ease a displayed number toward a target (rolling counters). */
export class Rolling {
  constructor(v = 0) { this.value = v; this.display = v; }
  set(v) { this.value = v; }
  update(dt) {
    this.display += (this.value - this.display) * Math.min(1, dt * 7);
    if (Math.abs(this.value - this.display) < 0.5) this.display = this.value;
    return this;
  }
  get text() { return String(Math.round(this.display)); }
}
