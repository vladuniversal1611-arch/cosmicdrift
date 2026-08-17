/**
 * TopBar.js
 * -----------------------------------------------------------------------------
 * The premium meta top bar: a single Coins chip with a smooth rolling number
 * and glowing icon, plus a framed player avatar. Reused across the menu and
 * meta screens. It reads the balance from the EconomySystem and eases the
 * number so values never snap.
 *
 * Currency mapping: Coins = gold (the single soft currency).
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { AssetManager } from '../assets/AssetManager.js';

export class TopBar {
  constructor(game) {
    this.game = game;
    this.coins = new Rolling(0);
    this._t = 0;
  }

  update(dt) {
    this._t += dt;
    const eco = this.game.getSystem('economy');
    if (eco) this.coins.set(eco.balance('gold'));
    this.coins.update(dt);
  }

  render(r, width) {
    const y = 20;
    const h = 40;
    // Both live on the RIGHT: avatar at the edge, coins chip just left of it.
    // (The top-LEFT corner belongs to the PanelScreen Back button, so the coins
    // chip must not sit there or the two overlap.)
    const s = 52;
    const avatarX = width - 16 - s;
    const chipW = 118;
    this._chip(r, avatarX - 12 - chipW, y, chipW, h, '#ffcf5e', 'coins', this.coins.text);
    this._avatar(r, avatarX, y - 6, s);
  }

  _chip(r, x, y, w, h, cap, icon, text) {
    UITheme.chip(r, x, y, w, h, cap);
    drawObjectiveIcon(r, icon, x + h / 2, y + h / 2, h * 0.26, '#fff');
    r.text(text, x + h * 0.92, y + h / 2, { font: '900 18px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
    // Little "+" plate at the right end (buy more) — cosmetic here.
    r.fillCircle(x + w - h * 0.36, y + h / 2, h * 0.24, UI.gold.mid);
    r.text('+', x + w - h * 0.36, y + h / 2 + 1, { font: '900 18px system-ui, sans-serif', color: '#7a4a00', align: 'center', baseline: 'middle' });
  }

  _avatar(r, x, y, s) {
    const cx = x + s / 2, cy = y + s / 2;
    // The mascot sprite keeps the avatar consistent with the home screen.
    const img = AssetManager.image('mascot');
    if (img) {
      const box = s * 1.35, rr = Math.min(box / img.width, box / img.height);
      const w = img.width * rr, h = img.height * rr;
      r.ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      return;
    }
    // Procedural fallback: a friendly face disc.
    UITheme.shadow(r, x, y, s, s, s / 2, 4, 0.3);
    const g = r.radialGradient(cx, cy, s / 2, [[0, '#9ad7ff'], [1, '#2f6fe0']]);
    r.fillCircle(cx, cy, s / 2, g);
    r.withGlow('#fff', 4, () => {
      r.fillCircle(cx - s * 0.14, cy - s * 0.06, s * 0.09, '#fff');
      r.fillCircle(cx + s * 0.14, cy - s * 0.06, s * 0.09, '#fff');
    });
    r.fillCircle(cx - s * 0.13, cy - s * 0.05, s * 0.045, '#233a72');
    r.fillCircle(cx + s * 0.13, cy - s * 0.05, s * 0.045, '#233a72');
    UITheme.goldFrame(r, x, y, s, s, s / 2, 4);
  }
}
