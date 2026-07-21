/**
 * TopBar.js
 * -----------------------------------------------------------------------------
 * The premium meta top bar: Coins, Gems and Dragon Energy chips with smooth
 * rolling numbers and glowing icons, plus a framed player avatar. Reused across
 * the menu and meta screens. It reads balances from the EconomySystem and eases
 * every number so values never snap.
 *
 * Currency mapping: Coins = gold, Gems = crystal, Dragon Energy = essence.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';

export class TopBar {
  constructor(game) {
    this.game = game;
    this.coins = new Rolling(0);
    this.gems = new Rolling(0);
    this.energy = new Rolling(0);
    this._t = 0;
  }

  update(dt) {
    this._t += dt;
    const eco = this.game.getSystem('economy');
    if (eco) {
      this.coins.set(eco.balance('gold'));
      this.gems.set(eco.balance('crystal'));
      this.energy.set(eco.balance('essence'));
    }
    this.coins.update(dt); this.gems.update(dt); this.energy.update(dt);
  }

  render(r, width) {
    const y = 20;
    const h = 40;
    // Three chips on the left, avatar on the right.
    const chipW = 108;
    const gap = 8;
    this._chip(r, 16, y, chipW, h, '#ffcf5e', 'coins', this.coins.text);
    this._chip(r, 16 + (chipW + gap), y, chipW, h, '#7cd6ff', 'gem', this.gems.text);
    this._chip(r, 16 + (chipW + gap) * 2, y, chipW, h, '#b07cff', 'dragon', this.energy.text);
    this._avatar(r, width - 16 - 52, y - 6, 52);
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
    UITheme.shadow(r, x, y, s, s, s / 2, 4, 0.3);
    const g = r.radialGradient(cx, cy, s / 2, [[0, '#9ad7ff'], [1, '#2f6fe0']]);
    r.fillCircle(cx, cy, s / 2, g);
    // A friendly dragon face.
    r.withGlow('#fff', 4, () => {
      r.fillCircle(cx - s * 0.14, cy - s * 0.06, s * 0.09, '#fff');
      r.fillCircle(cx + s * 0.14, cy - s * 0.06, s * 0.09, '#fff');
    });
    r.fillCircle(cx - s * 0.13, cy - s * 0.05, s * 0.045, '#233a72');
    r.fillCircle(cx + s * 0.13, cy - s * 0.05, s * 0.045, '#233a72');
    UITheme.goldFrame(r, x, y, s, s, s / 2, 4);
  }
}
