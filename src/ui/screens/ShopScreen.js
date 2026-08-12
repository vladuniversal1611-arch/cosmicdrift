/**
 * ShopScreen.js
 * -----------------------------------------------------------------------------
 * The booster shop, built on a single soft currency (Coins) with no real money:
 *   - a free Daily Gift at the top,
 *   - a "watch an ad → free coins" banner (opt-in, rewarded),
 *   - a Booster Store where Coins buy in-run power-ups.
 * Coins are earned by clearing levels, so the whole loop is: play → earn coins →
 * buy boosters (or grab a free one from an ad) → play harder levels.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { Haptics } from '../../utils/Haptics.js';
import { t } from '../../i18n/Localization.js';

/** Booster offers, priced in Coins (⬤). `boosters` maps booster id → quantity. */
const OFFERS = [
  { id: 'hammer', label: 'HAMMER', qty: '×3', boosters: { hammer: 3 }, cost: 180, color: UI.btn.orange },
  { id: 'bomb', label: 'BOMB', qty: '×2', boosters: { bomb: 2 }, cost: 240, color: UI.btn.red },
  { id: 'shuffle', label: 'SHUFFLE', qty: '×3', boosters: { shuffle: 3 }, cost: 150, color: UI.btn.teal },
  { id: 'bundle', label: 'BUNDLE', qty: 'ALL', boosters: { hammer: 2, bomb: 1, shuffle: 2 }, cost: 450, color: UI.btn.purple, best: true },
];

/** Coins handed out for watching a rewarded ad (opt-in). Tuned to the cheapest
 *  booster (Shuffle = 150) so one ad = one booster's worth — a clearly worthwhile
 *  reward, yet below the once-a-day gift (300). */
const AD_COINS = 150;

export class ShopScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.shop'), { showTopBar: true });
    this.name = 'shop';
    this._chestT = -1;      // daily-gift chest open animation
    this._coins = [];       // local coin-burst particles
    this._toast = null;
    this._adPending = false;
  }

  // Daily banner (34+118) + ad banner (12+70) + store (40 + 2 rows*150 +16) + pad.
  contentHeight() {
    const rows = Math.ceil(OFFERS.length / 2);
    return 34 + 118 + 12 + 70 + 40 + rows * 150 + (rows - 1) * 16 + 26;
  }

  onUpdate(dt) {
    if (this._chestT >= 0) { this._chestT += dt; if (this._chestT > 1.4) this._chestT = -1; }
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i]; c.t += dt; c.vy += 500 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.t > c.life) this._coins.splice(i, 1);
    }
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
  }

  _balance() { return this.game.getSystem('economy')?.balance('gold') ?? 0; }

  drawContent(r, p) {
    const pad = 24;
    // --- Daily gift banner (free coins) ---
    const dg = new Rect(p.x + pad, p.y + 34, p.w - pad * 2, 118);
    this._dailyRect = dg;
    UITheme.button(r, dg.x, dg.y, dg.w, dg.h, 20, UI.btn.teal);
    this._chest(r, dg.x + 60, dg.centerY, 40, this._chestT >= 0);
    r.text(t('shop.dailyGift'), dg.x + 118, dg.centerY - 14, { font: '900 22px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
    r.text(t('shop.dailySub'), dg.x + 118, dg.centerY + 12, { font: '700 13px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', baseline: 'middle' });
    const claimW = 96, claimH = 44, cx = dg.right - claimW - 16, cyy = dg.centerY - claimH / 2;
    this._claimRect = new Rect(cx, cyy, claimW, claimH);
    UITheme.button(r, cx, cyy, claimW, claimH, claimH / 2, UI.btn.play);
    r.text(t('common.claim'), cx + claimW / 2, cyy + claimH / 2, { font: '900 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // --- Watch-ad → free COINS banner ---
    const ad = new Rect(p.x + pad, dg.bottom + 12, p.w - pad * 2, 70);
    this._adRect = ad;
    UITheme.button(r, ad.x, ad.y, ad.w, ad.h, 18, UI.btn.play);
    this._playIcon(r, ad.x + 44, ad.centerY, 18);
    r.text(this._adPending ? t('shop.watching') : t('shop.freeCoins'), ad.x + 84, ad.centerY - 12, { font: '900 20px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
    // Subtitle: "+100" with a coin so it's clear the reward is coins, not a booster.
    drawObjectiveIcon(r, 'coins', ad.x + 90, ad.centerY + 13, 8, '#ffcf5e');
    r.text(`+${AD_COINS}`, ad.x + 104, ad.centerY + 12, { font: '800 14px system-ui, sans-serif', color: 'rgba(255,255,255,0.95)', baseline: 'middle' });
    UITheme.chip(r, ad.right - 96, ad.centerY - 17, 80, 34, '#ff8a3d');
    r.text(t('common.watch'), ad.right - 56, ad.centerY, { font: '900 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // --- Booster store header ---
    r.text(t('shop.boosterStore'), p.centerX, ad.bottom + 22, { font: '900 18px system-ui, sans-serif', color: UI.gold.deep, align: 'center', baseline: 'middle' });

    // --- Offer cards (2×2), priced in Coins ---
    const cols = 2, cw = (p.w - pad * 2 - 16) / cols, ch = 150;
    const gy = ad.bottom + 40;
    const coins = this._balance();
    this._packRects = [];
    OFFERS.forEach((o, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + pad + col * (cw + 16);
      const y = gy + row * (ch + 16);
      this._packRects.push({ rect: new Rect(x, y, cw, ch), o });
      const afford = coins >= o.cost;
      UITheme.button(r, x, y, cw, ch, 18, o.color, { shadow: true });
      r.setAlpha(0.5); r.fillRoundRect(x + 8, y + 8, cw - 16, ch * 0.34, 12, 'rgba(255,255,255,0.55)'); r.setAlpha(1);
      if (o.best) { r.withGlow('#ffe08a', 8, () => UITheme.chip(r, x + cw - 66, y + 10, 56, 26, '#ff7ab0')); r.text('BEST', x + cw - 38, y + 23, { font: '900 12px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' }); }
      // Big quantity + label.
      r.text(o.qty, x + cw / 2, y + ch * 0.34, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.35)', outlineWidth: 3 });
      r.text(o.label, x + cw / 2, y + ch * 0.58, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      // Coin-price pill (dim when unaffordable).
      const bw = cw * 0.66, bh = 34, bx = x + cw / 2 - bw / 2, by = y + ch - bh - 10;
      r.setAlpha(afford ? 1 : 0.5);
      UITheme.button(r, bx, by, bw, bh, bh / 2, afford ? UI.btn.orange : ['#8a97ad', '#6b7890'], { shadow: false });
      drawObjectiveIcon(r, 'coins', bx + bh * 0.5, by + bh / 2, bh * 0.28, '#ffcf5e');
      r.text(String(o.cost), bx + bh * 0.9, by + bh / 2, { font: '900 17px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
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

  _playIcon(r, cx, cy, s) {
    const ctx = r.ctx; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy - s * 0.6); ctx.lineTo(cx + s * 0.6, cy); ctx.lineTo(cx - s * 0.4, cy + s * 0.6); ctx.closePath(); ctx.fill();
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

  _grantBoosters(map) {
    const booster = this.game.getSystem('booster');
    const parts = [];
    for (const [id, n] of Object.entries(map)) { booster?.grant(id, n); parts.push(`+${n} ${id[0].toUpperCase()}${id.slice(1)}`); }
    return parts.join('  ');
  }

  onContentTap(px, py) {
    const eco = this.game.getSystem('economy');
    // Free daily gift (coins).
    if (this._claimRect?.contains(px, py) || this._dailyRect?.contains(px, py)) {
      this._chestT = 0;
      eco?.credit('gold', 300);
      this.game.getSystem('audio')?.play('reward'); Haptics.success(this.game);
      this._toast = { text: '+300 Coins', t: 1.6 };
      for (let i = 0; i < 20; i++) this._coins.push({ x: this._dailyRect.x + 60, y: this._dailyRect.centerY, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 320 - 60, t: 0, life: 1.1, s: 8 + Math.random() * 6 });
      return true;
    }
    // Watch a rewarded ad → free COINS (opt-in).
    if (this._adRect?.contains(px, py)) {
      if (this._adPending) return true;
      this._adPending = true;
      this._toast = { text: t('shop.loadingAd'), t: 2 };
      this.game.getSystem('monetization')?.offerRewarded('shop_free_coins', () => {
        eco?.credit('gold', AD_COINS);
        this.game.getSystem('audio')?.play('reward'); Haptics.success(this.game);
        this._toast = { text: `+${AD_COINS} Coins`, t: 1.8 };
        for (let i = 0; i < 18; i++) this._coins.push({ x: this._adRect.x + 44, y: this._adRect.centerY, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 320 - 60, t: 0, life: 1.1, s: 8 + Math.random() * 6 });
      }).then((earned) => {
        this._adPending = false;
        if (!earned) this._toast = { text: t('shop.noAd'), t: 1.4 };
      });
      return true;
    }
    // Buy a booster offer with Coins.
    for (const { rect, o } of (this._packRects || [])) {
      if (!rect.contains(px, py)) continue;
      if (!eco || !eco.canAfford('gold', o.cost)) {
        this._toast = { text: t('shop.notEnough'), t: 1.6 };
        this.game.getSystem('audio')?.play('invalid'); Haptics.warn(this.game);
        return true;
      }
      eco.spend('gold', o.cost);
      const text = this._grantBoosters(o.boosters);
      this.game.getSystem('audio')?.play('reward'); Haptics.success(this.game);
      this._toast = { text, t: 1.8 };
      return true;
    }
    return false;
  }
}
