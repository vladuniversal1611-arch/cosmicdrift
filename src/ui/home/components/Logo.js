/**
 * Logo.js  (Home Screen · section: LOGO)
 * -----------------------------------------------------------------------------
 * The centred wordmark. Idle motion (float + a tiny rotation wobble + a
 * travelling sparkle) all comes from the shared Motion helper, so there is no
 * bespoke animation math here. Width is capped at 45% of the screen and the
 * type scales to fit, so it reads correctly on every aspect ratio.
 * -----------------------------------------------------------------------------
 */
import { UI } from '../../theme/UITheme.js';
import { Motion } from '../Motion.js';
import { Config } from '../../../config/Config.js';

export class Logo {
  constructor(game, safe) {
    this.game = game;
    this.safe = safe;
    this._t = 0;
    this.cx = safe.centerX;
    this.maxW = safe.w * 0.45;
    // Positioned near the top of the play area.
    this.cy = safe.play.y + 96;
  }

  setCenter(cx, cy) { this.cx = cx; this.cy = cy; return this; }

  update(dt) { this._t += dt; }

  render(r) {
    const bob = Motion.float(this._t, 8, 3.6);
    const rot = Motion.rotate(this._t, 0.02, 5);
    // The wordmark is driven by the game's name — a one-word name renders on a
    // single line, a multi-word name splits first-word / rest across two lines.
    // Type auto-scales so ANY name fits the capped width (rebrand = one config).
    const name = (Config.meta.name || 'GAME').toUpperCase();
    const parts = name.split(/\s+/).filter(Boolean);
    const lines = parts.length >= 2 ? [parts[0], parts.slice(1).join(' ')] : [name];
    const longest = Math.max(1, ...lines.map((l) => l.length));
    const size = Math.min(116, this.maxW / (longest * 0.62));
    const ctx = r.ctx;
    ctx.save();
    ctx.translate(this.cx, this.cy + bob);
    ctx.rotate(rot);
    if (lines.length === 2) {
      this._word(r, lines[0], 0, -size * 0.5, size, '#ffffff');
      this._word(r, lines[1], 0, size * 0.5, size, '#dff6ff');
    } else {
      this._word(r, lines[0], 0, 0, size, '#ffffff');
    }
    ctx.restore();

    // Travelling sparkle across the wordmark.
    const cyc = (this._t % 3.4) / 0.7;
    if (cyc < 1) {
      const a = Math.sin(cyc * Math.PI);
      const sx = this.cx - this.maxW * 0.4 + cyc * this.maxW * 0.8;
      const sy = this.cy + bob - Math.sin(cyc * Math.PI) * 24;
      r.setAlpha(a); r.withGlow('#fff', 10, () => r.sparkle(sx, sy, 14, '#fff6c8')); r.setAlpha(1);
    }
  }

  _word(r, text, x, y, size, fill) {
    const font = `900 ${size}px system-ui, sans-serif`;
    r.text(text, x + 2, y + 4, { font, color: 'rgba(20,44,92,0.35)', align: 'center', baseline: 'middle' });
    r.withGlow('#7fe0ff', 18, () => {
      r.text(text, x, y, { font, color: fill, align: 'center', baseline: 'middle', outline: UI.gold.line, outlineWidth: size * 0.17 });
      r.text(text, x, y, { font, color: fill, align: 'center', baseline: 'middle', outline: UI.gold.deep, outlineWidth: size * 0.10 });
    });
  }

  bounds() { return []; }
}
