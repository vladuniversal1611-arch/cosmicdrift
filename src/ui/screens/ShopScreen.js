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
import { clamp } from '../../utils/MathUtils.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { AssetManager } from '../assets/AssetManager.js';
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
    // Persist the day the free gift was last claimed, so it's ONCE per day
    // (was previously payable on every tap).
    this._shop = game.getSystem('save')?.registerSlice('shop', () => ({ lastGift: '' })) ?? { lastGift: '' };
  }

  /** Local calendar day key (YYYYMMDD). */
  _today() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  /** True while today's free gift is still unclaimed. */
  get _giftAvailable() { return this._shop.lastGift !== this._today(); }

  // Daily banner (34+118) + ad banner (12+70) + store (40 + 2 rows*150 +16) + pad.
  // Comfortably-big, fixed-scale layout; PanelScreen hugs + centres it so it
  // reads as a large card. (The shop has few blocks, so filling 100% would make
  // the cards oversized — big + centred looks better than stretched.)
  _S = { pad: 0, dgH: 210, adH: 140, headerH: 64, cardH: 262, gap: 26 };
  contentHeight() {
    const s = this._S;
    return 30 + s.dgH + s.gap + s.adH + s.headerH + s.cardH * 2 + s.gap + 34;
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
    // Fixed, comfortably-big sizes (see contentHeight); PanelScreen centres the card.
    const s = this._S;
    const pad = p.w * 0.045, innerW = p.w - pad * 2;
    const gap = s.gap;
    const top = p.y + 30;
    const dgH = s.dgH, adH = s.adH, headerH = s.headerH;

    // --- Daily gift banner (free coins) ---
    const dg = new Rect(p.x + pad, top, innerW, dgH);
    this._dailyRect = dg;
    UITheme.button(r, dg.x, dg.y, dg.w, dg.h, dgH * 0.18, UI.btn.teal);
    this._chest(r, dg.x + dgH * 0.55, dg.centerY, dgH * 0.36, this._chestT >= 0);
    const avail = this._giftAvailable;
    const tx = dg.x + dgH * 1.05;
    const claimW = innerW * 0.24, claimH = dgH * 0.44, cx = dg.right - claimW - dgH * 0.16, cyy = dg.centerY - claimH / 2;
    // Auto-fit the title + subtitle so they never run under the claim button.
    const textW = cx - tx - 16;
    let tf = Math.round(dgH * 0.2); r.ctx.font = `900 ${tf}px system-ui, sans-serif`;
    while (tf > 14 && r.ctx.measureText(t('shop.dailyGift')).width > textW) { tf -= 1; r.ctx.font = `900 ${tf}px system-ui, sans-serif`; }
    r.text(t('shop.dailyGift'), tx, dg.centerY - dgH * 0.13, { font: `900 ${tf}px system-ui, sans-serif`, color: '#fff', baseline: 'middle' });
    let sf = Math.round(dgH * 0.12); r.ctx.font = `700 ${sf}px system-ui, sans-serif`;
    const subT = avail ? t('shop.dailySub') : t('shop.dailyDone');
    while (sf > 11 && r.ctx.measureText(subT).width > textW) { sf -= 1; r.ctx.font = `700 ${sf}px system-ui, sans-serif`; }
    r.text(subT, tx, dg.centerY + dgH * 0.14, { font: `700 ${sf}px system-ui, sans-serif`, color: 'rgba(255,255,255,0.92)', baseline: 'middle' });
    this._claimRect = avail ? new Rect(cx, cyy, claimW, claimH) : null;
    UITheme.button(r, cx, cyy, claimW, claimH, claimH / 2, avail ? UI.btn.play : UI.btn.muted ?? ['#7f8aa0', '#5f6a80']);
    r.setAlpha(avail ? 1 : 0.85);
    r.text(avail ? t('common.claim') : '✓', cx + claimW / 2, cyy + claimH / 2, { font: `900 ${Math.round(claimH * 0.36)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });
    r.setAlpha(1);

    // --- Watch-ad → free COINS banner ---
    const ad = new Rect(p.x + pad, dg.bottom + gap, innerW, adH);
    this._adRect = ad;
    UITheme.button(r, ad.x, ad.y, ad.w, ad.h, adH * 0.24, UI.btn.play);
    this._playIcon(r, ad.x + adH * 0.6, ad.centerY, adH * 0.26);
    r.text(this._adPending ? t('shop.watching') : t('shop.freeCoins'), ad.x + adH * 1.15, ad.centerY - adH * 0.16, { font: `900 ${Math.round(adH * 0.28)}px system-ui, sans-serif`, color: '#fff', baseline: 'middle' });
    drawObjectiveIcon(r, 'coins', ad.x + adH * 1.22, ad.centerY + adH * 0.2, adH * 0.11, '#ffcf5e');
    r.text(`+${AD_COINS}`, ad.x + adH * 1.4, ad.centerY + adH * 0.18, { font: `800 ${Math.round(adH * 0.2)}px system-ui, sans-serif`, color: 'rgba(255,255,255,0.95)', baseline: 'middle' });
    const chipW = innerW * 0.2, chipH = adH * 0.48;
    UITheme.chip(r, ad.right - chipW - adH * 0.2, ad.centerY - chipH / 2, chipW, chipH, '#ff8a3d');
    r.text(t('common.watch'), ad.right - chipW / 2 - adH * 0.2, ad.centerY, { font: `900 ${Math.round(chipH * 0.42)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });

    // --- Booster store header ---
    const headerY = ad.bottom + headerH * 0.6;
    r.text(t('shop.boosterStore'), p.centerX, headerY, { font: `900 ${Math.round(headerH * 0.5)}px system-ui, sans-serif`, color: UI.gold.deep, align: 'center', baseline: 'middle' });

    // --- Offer cards (2×2), sized to FILL the remaining panel height ---
    const cols = 2, cw = (innerW - gap) / cols;
    const gy = ad.bottom + headerH;
    const ch = s.cardH;
    const coins = this._balance();
    this._packRects = [];
    OFFERS.forEach((o, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + pad + col * (cw + gap);
      const y = gy + row * (ch + gap);
      this._packRects.push({ rect: new Rect(x, y, cw, ch), o });
      const afford = coins >= o.cost;
      UITheme.button(r, x, y, cw, ch, ch * 0.12, o.color, { shadow: true });
      r.setAlpha(0.5); r.fillRoundRect(x + 8, y + 8, cw - 16, ch * 0.34, 12, 'rgba(255,255,255,0.55)'); r.setAlpha(1);
      if (o.best) { const chw = cw * 0.28, chh = ch * 0.17; r.withGlow('#ffe08a', 8, () => UITheme.chip(r, x + cw - chw - 10, y + 10, chw, chh, '#ff7ab0')); r.text('BEST', x + cw - chw / 2 - 10, y + 10 + chh / 2, { font: `900 ${Math.round(chh * 0.5)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' }); }
      const bImg = AssetManager.image(`booster_${o.id}`);
      if (bImg) {
        const box = ch * 0.42, rr = Math.min(box / bImg.width, box / bImg.height);
        const iw = bImg.width * rr, ih = bImg.height * rr;
        r.ctx.drawImage(bImg, x + cw * 0.32 - iw / 2, y + ch * 0.32 - ih / 2, iw, ih);
        r.text(o.qty, x + cw * 0.66, y + ch * 0.32, { font: `900 ${Math.round(ch * 0.22)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.35)', outlineWidth: 3 });
      } else {
        r.text(o.qty, x + cw / 2, y + ch * 0.34, { font: `900 ${Math.round(ch * 0.23)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.35)', outlineWidth: 3 });
      }
      r.text(o.label, x + cw / 2, y + ch * 0.58, { font: `800 ${Math.round(ch * 0.1)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });
      const bw = cw * 0.66, bh = ch * 0.24, bx = x + cw / 2 - bw / 2, by = y + ch - bh - ch * 0.08;
      r.setAlpha(afford ? 1 : 0.5);
      UITheme.button(r, bx, by, bw, bh, bh / 2, afford ? UI.btn.orange : ['#8a97ad', '#6b7890'], { shadow: false });
      drawObjectiveIcon(r, 'coins', bx + bh * 0.5, by + bh / 2, bh * 0.28, '#ffcf5e');
      r.text(String(o.cost), bx + bh * 0.9, by + bh / 2, { font: `900 ${Math.round(bh * 0.5)}px system-ui, sans-serif`, color: '#fff', baseline: 'middle' });
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
    const img = AssetManager.image('icon_chest');
    if (img) {
      const box = s * 2.6, rr = Math.min(box / img.width, box / img.height);
      const w = img.width * rr, h = img.height * rr;
      if (open) r.withGlow('#fff', 14, () => r.ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h));
      else r.ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      return;
    }
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
    // Free daily gift (coins) — ONCE per calendar day.
    if (this._claimRect?.contains(px, py) || this._dailyRect?.contains(px, py)) {
      if (!this._giftAvailable) { this._toast = { text: t('shop.dailyDone'), t: 1.6 }; return true; }
      this._shop.lastGift = this._today();
      this.game.getSystem('save')?.markDirty();
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
