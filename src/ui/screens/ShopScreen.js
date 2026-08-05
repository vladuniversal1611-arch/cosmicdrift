/**
 * ShopScreen.js
 * -----------------------------------------------------------------------------
 * The shop, in a free-to-play (no real money) model: a free Daily Gift at the
 * top, then a Booster Store where the premium currency, Gems, is spent on
 * in-run power-ups. This gives the two-currency economy a clear shape —
 *   Gold  → rebuild the world (Island restorations)
 *   Gems  → buy Boosters here
 * so both currencies have an obvious purpose and no dead-end resources.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { t } from '../../i18n/Localization.js';

/** Booster offers, priced in Gems (◆). `boosters` maps booster id → quantity. */
const OFFERS = [
  { id: 'hammer', label: 'HAMMER', qty: '×3', boosters: { hammer: 3 }, cost: 6, color: UI.btn.orange },
  { id: 'bomb', label: 'BOMB', qty: '×2', boosters: { bomb: 2 }, cost: 8, color: UI.btn.red },
  { id: 'shuffle', label: 'SHUFFLE', qty: '×3', boosters: { shuffle: 3 }, cost: 5, color: UI.btn.teal },
  { id: 'bundle', label: 'BUNDLE', qty: 'ALL', boosters: { hammer: 2, bomb: 1, shuffle: 2 }, cost: 15, color: UI.btn.purple, best: true },
];

export class ShopScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.shop'), { showTopBar: true });
    this.name = 'shop';
    this._chestT = -1;      // daily-gift chest open animation
    this._coins = [];       // local coin-burst particles
    this._toast = null;
  }

  // Daily banner (34 + 118) + 2 rows of offer cards (150 tall, 16 gap) + pad.
  contentHeight() {
    const rows = Math.ceil(OFFERS.length / 2);
    return 34 + 118 + 40 + rows * 150 + (rows - 1) * 16 + 26;
  }

  onUpdate(dt) {
    if (this._chestT >= 0) { this._chestT += dt; if (this._chestT > 1.4) this._chestT = -1; }
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i]; c.t += dt; c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.t > c.life) this._coins.splice(i, 1);
    }
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
  }

  _gems() { return this.game.getSystem('economy')?.balance('crystal') ?? 0; }

  drawContent(r, p) {
    const pad = 24;
    // --- Daily gift banner (free) ---
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

    // --- Booster store header ---
    r.text('BOOSTER STORE', p.centerX, dg.bottom + 22, { font: '900 18px system-ui, sans-serif', color: UI.gold.deep, align: 'center', baseline: 'middle' });

    // --- Offer cards (2×2), priced in Gems ---
    const cols = 2, cw = (p.w - pad * 2 - 16) / cols, ch = 150;
    const gy = dg.bottom + 40;
    const gems = this._gems();
    this._packRects = [];
    OFFERS.forEach((o, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + pad + col * (cw + 16);
      const y = gy + row * (ch + 16);
      this._packRects.push({ rect: new Rect(x, y, cw, ch), o });
      const afford = gems >= o.cost;
      UITheme.button(r, x, y, cw, ch, 18, o.color, { shadow: true });
      r.setAlpha(0.5); r.fillRoundRect(x + 8, y + 8, cw - 16, ch * 0.34, 12, 'rgba(255,255,255,0.55)'); r.setAlpha(1);
      if (o.best) { r.withGlow('#ffe08a', 8, () => UITheme.chip(r, x + cw - 66, y + 10, 56, 26, '#ff7ab0')); r.text('BEST', x + cw - 38, y + 23, { font: '900 12px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' }); }
      // Big quantity + label.
      r.text(o.qty, x + cw / 2, y + ch * 0.34, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.35)', outlineWidth: 3 });
      r.text(o.label, x + cw / 2, y + ch * 0.58, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      // Gem-price pill (dim when unaffordable).
      const bw = cw * 0.62, bh = 34, bx = x + cw / 2 - bw / 2, by = y + ch - bh - 10;
      r.setAlpha(afford ? 1 : 0.5);
      UITheme.button(r, bx, by, bw, bh, bh / 2, afford ? UI.btn.blue : ['#8a97ad', '#6b7890'], { shadow: false });
      r.text(`◆ ${o.cost}`, x + cw / 2, by + bh / 2, { font: '900 17px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      r.setAlpha(1);
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
    r.ctx.save();
    r.ctx.translate(cx, cy - s * 0.1);
    r.ctx.rotate(open ? -0.7 : -0.05);
    r.fillRoundRect(-s, -s * 0.5, s * 2, s * 0.5, 6, '#d69a2a');
    r.ctx.restore();
    if (open) r.withGlow('#fff', 14, () => r.fillCircle(cx, cy, s * 0.4, '#fff6c8'));
  }

  onContentTap(px, py) {
    const eco = this.game.getSystem('economy');
    // Free daily gift.
    if (this._claimRect?.contains(px, py) || this._dailyRect?.contains(px, py)) {
      this._chestT = 0;
      eco?.credit('gold', 300); eco?.credit('crystal', 5);
      this.game.getSystem('audio')?.play('reward');
      this._toast = { text: '+300 ⬤   +5 ◆', t: 1.6 };
      for (let i = 0; i < 20; i++) this._coins.push({ x: this._dailyRect.x + 60, y: this._dailyRect.centerY, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 320 - 60, t: 0, life: 1.1, s: 8 + Math.random() * 6 });
      return true;
    }
    // Buy a booster offer with Gems.
    for (const { rect, o } of (this._packRects || [])) {
      if (!rect.contains(px, py)) continue;
      if (!eco || !eco.canAfford('crystal', o.cost)) {
        this._toast = { text: 'NOT ENOUGH GEMS', t: 1.6 };
        this.game.getSystem('audio')?.play('invalid');
        return true;
      }
      eco.spend('crystal', o.cost);
      const booster = this.game.getSystem('booster');
      const parts = [];
      for (const [id, n] of Object.entries(o.boosters)) { booster?.grant(id, n); parts.push(`+${n} ${id[0].toUpperCase()}${id.slice(1)}`); }
      this.game.getSystem('audio')?.play('reward');
      this._toast = { text: parts.join('  '), t: 1.8 };
      return true;
    }
    return false;
  }
}
