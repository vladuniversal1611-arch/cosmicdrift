/**
 * ShopScreen.js
 * -----------------------------------------------------------------------------
 * A luxury shop: a free Daily Gift chest at the top and gold-framed "crystal
 * shelf" offer cards below (coin/gem packs + a special bundle), all glossy and
 * animated. Claiming the daily gift plays a chest-burst of coins. Deliberately
 * non-aggressive — offers are cosmetic/soft-currency, no real-money pressure.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { t } from '../../i18n/Localization.js';

const PACKS = [
  { id: 'pouch', icon: 'coins', color: UI.btn.orange, label: 'Coin Pouch', amount: '500', reward: { gold: 500 }, tag: 'FREE' },
  { id: 'chest', icon: 'coins', color: UI.btn.orange, label: 'Coin Chest', amount: '2,000', reward: { gold: 2000 }, tag: 'FREE' },
  { id: 'gems', icon: 'gem', color: UI.btn.blue, label: 'Gem Cluster', amount: '25', reward: { crystal: 25 }, tag: 'FREE' },
  { id: 'bundle', icon: 'chest', color: UI.btn.purple, label: 'Starter Bundle', amount: '★★★', reward: { gold: 1500, crystal: 15, materials: 40 }, tag: 'BEST' },
];

export class ShopScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.shop'), { showTopBar: true });
    this.name = 'shop';
    this._chestT = -1;      // daily-gift chest open animation
    this._coins = [];       // local coin-burst particles
    this._toast = null;
  }

  onUpdate(dt) {
    if (this._chestT >= 0) { this._chestT += dt; if (this._chestT > 1.4) this._chestT = -1; }
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i]; c.t += dt; c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.t > c.life) this._coins.splice(i, 1);
    }
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
  }

  drawContent(r, p) {
    const pad = 24;
    // --- Daily gift banner ---
    const dg = new Rect(p.x + pad, p.y + 34, p.w - pad * 2, 118);
    this._dailyRect = dg;
    UITheme.button(r, dg.x, dg.y, dg.w, dg.h, 20, UI.btn.teal);
    this._chest(r, dg.x + 60, dg.centerY, 40, this._chestT >= 0);
    r.text('DAILY GIFT', dg.x + 118, dg.centerY - 14, { font: '900 22px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
    r.text('Come back every day!', dg.x + 118, dg.centerY + 12, { font: '700 13px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', baseline: 'middle' });
    const claimW = 96, claimH = 44, cx = dg.right - claimW - 16, cyy = dg.centerY - claimH / 2;
    this._claimRect = new Rect(cx, cyy, claimW, claimH);
    UITheme.button(r, cx, cyy, claimW, claimH, claimH / 2, UI.btn.play);
    r.text('CLAIM', cx + claimW / 2, cyy + claimH / 2, { font: '900 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // --- Offer cards (2x2 crystal shelf) ---
    const cols = 2, cw = (p.w - pad * 2 - 16) / cols, ch = 150;
    const gy = dg.bottom + 22;
    this._packRects = [];
    PACKS.forEach((pk, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + pad + col * (cw + 16);
      const y = gy + row * (ch + 16);
      const rect = new Rect(x, y, cw, ch);
      this._packRects.push({ rect, pk });
      // Card.
      UITheme.button(r, x, y, cw, ch, 18, pk.color, { shadow: true });
      // Glass shelf highlight.
      r.setAlpha(0.5); r.fillRoundRect(x + 8, y + 8, cw - 16, ch * 0.34, 12, 'rgba(255,255,255,0.55)'); r.setAlpha(1);
      drawObjectiveIcon(r, pk.icon, x + cw / 2, y + ch * 0.36, 26, '#fff');
      r.text(pk.label, x + cw / 2, y + ch * 0.66, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      r.text(pk.amount, x + cw / 2, y + ch * 0.8, { font: '900 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      // Price/claim pill.
      const bw = cw * 0.6, bh = 30, bx = x + cw / 2 - bw / 2, by = y + ch - bh - 8;
      UITheme.button(r, bx, by, bw, bh, bh / 2, pk.tag === 'BEST' ? UI.btn.pink : UI.btn.play, { shadow: false });
      r.text(pk.tag, x + cw / 2, by + bh / 2, { font: '900 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    });

    // Coin burst + toast.
    for (const c of this._coins) { r.setAlpha(Math.max(0, 1 - c.t / c.life)); drawObjectiveIcon(r, 'coins', c.x, c.y, c.s, '#ffcf5e'); r.setAlpha(1); }
    if (this._toast) {
      r.setAlpha(Math.min(1, this._toast.t * 2));
      UITheme.heading(r, this._toast.text, p.centerX, p.y + p.h * 0.5, 22, '#fff');
      r.setAlpha(1);
    }
  }

  _chest(r, cx, cy, s, open) {
    r.fillRoundRect(cx - s, cy - s * 0.1, s * 2, s * 1.1, 6, '#b8860b');
    r.fillRoundRect(cx - s, cy - s * 0.1, s * 2, s * 0.35, 6, '#ffcf5e');
    // Lid.
    r.ctx.save();
    r.ctx.translate(cx, cy - s * 0.1);
    r.ctx.rotate(open ? -0.7 : -0.05);
    r.fillRoundRect(-s, -s * 0.5, s * 2, s * 0.5, 6, '#d69a2a');
    r.ctx.restore();
    if (open) r.withGlow('#fff', 14, () => r.fillCircle(cx, cy, s * 0.4, '#fff6c8'));
  }

  _grant(reward) {
    const eco = this.game.getSystem('economy');
    for (const [k, v] of Object.entries(reward)) eco?.credit(k, v);
    this.game.getSystem('audio')?.play('reward');
  }

  onContentTap(px, py) {
    if (this._claimRect?.contains(px, py) || this._dailyRect?.contains(px, py)) {
      this._chestT = 0;
      this._grant({ gold: 300, crystal: 5 });
      this._toast = { text: '+300 COINS  +5 GEMS', t: 1.6 };
      for (let i = 0; i < 20; i++) this._coins.push({ x: this._dailyRect.x + 60, y: this._dailyRect.centerY, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 320 - 60, t: 0, life: 1.1, s: 8 + Math.random() * 6 });
      return true;
    }
    for (const { rect, pk } of (this._packRects || [])) {
      if (rect.contains(px, py)) {
        this._grant(pk.reward);
        this._toast = { text: `${pk.label.toUpperCase()} CLAIMED!`, t: 1.6 };
        return true;
      }
    }
    return false;
  }
}
