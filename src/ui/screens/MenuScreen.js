/**
 * MenuScreen.js
 * -----------------------------------------------------------------------------
 * The premium Main Menu, built to the approved Design System + wireframe on the
 * 1080×2400 reference. Structure (top → bottom):
 *   • Background   — living animated sky (MenuBackground): clouds, distant
 *                    islands, waterfalls, birds, flying dragons, light rays.
 *   • Logo         — top-center, floating, soft glow.
 *   • Player profile (top-left) + Settings (top-right).
 *   • Resource bar — Coins · Gems · Dragon Energy capsules with rolling counters.
 *   • PLAY         — absolute-centre hero button (idle pulse + 5 s sparkle burst).
 *   • Secondary    — 2×3 grid: Island, Dragons, Collection, Events, Shop, Settings.
 *   • Bottom cards — horizontal-scroll carousel: Daily, Season Pass, Event, Chest.
 *
 * Pure view: reads balances/state from systems, emits `ui:*` intents on tap.
 * Every control runs the DS interaction contract (press → bounce → spark →
 * sound → haptic) via PremiumButton + `_tap()`.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { Rect } from '../../utils/Rect.js';
import { t } from '../../i18n/Localization.js';

// --- Layout constants (virtual px, 1080×2400) --------------------------------
const CX = 540;
const LOGO = { y: 120, w: 560, h: 190, floatAmp: 6, floatPeriod: 3.5 };
const PROFILE = { x: 36, y: 40, s: 120 };
const SETTINGS = { s: 64, x: 1080 - 32 - 64, y: 44 };
const RES = { y: 320, h: 110, capW: 300, gap: 20, radius: 54, x0: 70 };
const PLAY = { w: 540, h: 170, x: (1080 - 540) / 2, y: 1200 - 85, radius: 85 };
const GRID = { size: 210, gapH: 32, gapV: 28, x0: 193, row1: 1504, row2: 1742 };
const CARD = { w: 320, h: 190, radius: 42, top: 2170, x0: 32, gap: 24 };

// --- Procedural nav icons (white, drawn into a tile) -------------------------
const Icons = {
  island(r, cx, cy, s) {
    r.ctx.fillStyle = '#fff';
    r.ctx.beginPath(); r.ctx.ellipse(cx, cy + s * 0.34, s, s * 0.42, 0, 0, Math.PI * 2); r.ctx.fill();
    r.fillCircle(cx, cy - s * 0.2, s * 0.52, '#fff');
  },
  dragons(r, cx, cy, s) { drawObjectiveIcon(r, 'dragon', cx, cy, s, '#fff'); },
  collection(r, cx, cy, s) {
    const q = s * 0.62;
    for (let i = 0; i < 4; i++) {
      const dx = (i % 2 ? 1 : -1) * q * 0.6, dy = (i < 2 ? -1 : 1) * q * 0.6;
      r.fillRoundRect(cx + dx - q * 0.5, cy + dy - q * 0.5, q, q, q * 0.28, '#fff');
    }
  },
  events(r, cx, cy, s) {
    r.fillRoundRect(cx - s, cy - s * 0.8, s * 2, s * 1.7, s * 0.24, '#fff');
    r.ctx.strokeStyle = '#2f8fe0'; r.ctx.lineWidth = s * 0.14;
    r.ctx.beginPath(); r.ctx.moveTo(cx - s * 0.7, cy - s * 0.2); r.ctx.lineTo(cx + s * 0.7, cy - s * 0.2); r.ctx.stroke();
    r.fillCircle(cx, cy + s * 0.4, s * 0.26, '#ff9422');
  },
  shop(r, cx, cy, s) {
    r.fillRoundRect(cx - s * 0.85, cy - s * 0.25, s * 1.7, s * 1.25, s * 0.22, '#fff');
    r.ctx.strokeStyle = '#fff'; r.ctx.lineWidth = s * 0.2;
    r.ctx.beginPath(); r.ctx.arc(cx, cy - s * 0.2, s * 0.5, Math.PI, 0); r.ctx.stroke();
  },
  settings(r, cx, cy, s) {
    const ctx = r.ctx; ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s, cy + Math.sin(a) * s, s * 0.3, 0, Math.PI * 2); ctx.fill(); }
    r.fillCircle(cx, cy, s * 0.82, '#fff'); r.fillCircle(cx, cy, s * 0.42, '#2f8fe0');
  },
};

// Resource icon: a lightning bolt for Dragon Energy.
function boltIcon(r, cx, cy, s) {
  const ctx = r.ctx; ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.2, cy - s); ctx.lineTo(cx - s * 0.5, cy + s * 0.15);
  ctx.lineTo(cx, cy + s * 0.15); ctx.lineTo(cx - s * 0.2, cy + s);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.15); ctx.lineTo(cx, cy - s * 0.15);
  ctx.closePath(); ctx.fill();
}

const CARDS = [
  { id: 'daily', label: 'DAILY REWARD', icon: 'chest', color: UI.btn.teal, event: 'ui:openDaily' },
  { id: 'season', label: 'SEASON PASS', icon: 'rune', color: UI.btn.purple, toast: 'Season Pass — coming soon!' },
  { id: 'event', label: 'EVENT', icon: 'gem', color: UI.btn.orange, event: 'ui:openEvents' },
  { id: 'lucky', label: 'LUCKY CHEST', icon: 'chest', color: UI.btn.pink, toast: 'Lucky Chest — coming soon!' },
];

export class MenuScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'menu';
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._t = 0;
    this._coins = new Rolling(0);
    this._gems = new Rolling(0);
    this._energy = new Rolling(0);
    this._sparkT = 0;              // 5 s PLAY sparkle timer
    this._sparks = [];            // PLAY sparkle particles
    this._scroll = 0;             // card carousel offset
    this._drag = null;
    this._toast = null;
    this._subs = [];

    // Hit rects that aren't PremiumButtons.
    this._profileRect = new Rect(PROFILE.x, PROFILE.y, PROFILE.s, PROFILE.s);
    this._resRects = [];          // {rect,kind}
    for (let i = 0; i < 3; i++) {
      this._resRects.push(new Rect(RES.x0 + i * (RES.capW + RES.gap), RES.y, RES.capW, RES.h));
    }

    // PLAY (hero).
    this._play = this.add(new PremiumButton(PLAY.x, PLAY.y, PLAY.w, PLAY.h,
      this._press(() => this.events.emit('ui:playPressed')),
      { label: t('common.play'), colors: UI.btn.play, radius: PLAY.radius, font: '900 72px system-ui, sans-serif' }));

    // Secondary 2×3 grid.
    const nav = [
      { key: 'island', label: t('menu.island'), colors: UI.btn.teal, event: 'ui:openWorldMap' },
      { key: 'dragons', label: t('menu.dragons'), colors: UI.btn.pink, event: 'ui:openCollection' },
      { key: 'collection', label: t('titles.collection'), colors: UI.btn.purple, event: 'ui:openCollection' },
      { key: 'events', label: t('menu.events'), colors: UI.btn.orange, event: 'ui:openEvents' },
      { key: 'shop', label: t('menu.shop'), colors: UI.btn.blue, event: 'ui:openShop' },
      { key: 'settings', label: t('menu.settings'), colors: UI.btn.blue, event: 'ui:openSettings' },
    ];
    this._nav = [];
    nav.forEach((item, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = GRID.x0 + col * (GRID.size + GRID.gapH);
      const y = (row === 0 ? GRID.row1 : GRID.row2);
      const base = Icons[item.key];
      const scale = item.key === 'settings' ? 0.68 : 0.82;   // keep icons clear of the label
      const icon = (r, cx, cy, s) => base(r, cx, cy - s * 0.08, s * scale);
      const btn = this.add(new PremiumButton(x, y, GRID.size, GRID.size,
        this._press(() => this.events.emit(item.event)),
        { colors: item.colors, radius: 46, icon, label: item.label,
          font: '800 26px system-ui, sans-serif', floatAmp: 4, floatPeriod: 2.4 + i * 0.15 }));
      this._nav.push({ btn, key: item.key });
    });

    // Settings (top-right) — twists on press.
    this._settings = this.add(new PremiumButton(SETTINGS.x, SETTINGS.y, SETTINGS.s, SETTINGS.s,
      this._press(() => this.events.emit('ui:openSettings')),
      { colors: UI.btn.blue, round: true, rotateOnPress: 0.105,
        icon: (r, cx, cy, s) => Icons.settings(r, cx, cy, s * 0.9) }));
  }

  // --- Lifecycle: carousel drag lives on the input bus -----------------------
  onEnter() {
    this._subs.push(this.events.on('input:down', ({ x, y }) => {
      if (y >= CARD.top && y <= CARD.top + CARD.h) this._drag = { x, s: this._scroll };
    }));
    this._subs.push(this.events.on('input:drag', ({ x }) => {
      if (this._drag) this._scroll = this._clampScroll(this._drag.s + (x - this._drag.x));
    }));
    this._subs.push(this.events.on('input:up', () => { this._drag = null; }));
  }
  onExit() { this._subs.forEach((off) => off()); this._subs.length = 0; this._drag = null; }

  _clampScroll(v) {
    const contentW = CARDS.length * CARD.w + (CARDS.length - 1) * CARD.gap;
    const min = Math.min(0, (1080 - 32) - (CARD.x0 + contentW));
    return Math.max(min, Math.min(0, v));
  }

  _retention() { return this.game.getSystem('retention'); }

  /** Wrap a button action with the shared tap feedback (sound + haptic). */
  _press(fn) {
    return () => { this._tap(); fn(); };
  }
  _tap() {
    this.game.getSystem('audio')?.play('button');
    const s = this.game.getSystem('settings');
    if (s?.get?.('haptics') && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }

  update(dt) {
    this._t += dt;
    this._bg.update(dt);

    const eco = this.game.getSystem('economy');
    if (eco) { this._coins.set(eco.balance('gold')); this._gems.set(eco.balance('crystal')); this._energy.set(eco.balance('essence')); }
    this._coins.update(dt); this._gems.update(dt); this._energy.update(dt);

    // PLAY sparkle burst every 5 s.
    this._sparkT += dt;
    if (this._sparkT >= 5) { this._sparkT = 0; this._spawnPlaySparks(); }
    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const p = this._sparks[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      if (p.t > p.life) this._sparks.splice(i, 1);
    }
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
  }

  _spawnPlaySparks() {
    const cx = PLAY.x + PLAY.w / 2, cy = PLAY.y + PLAY.h / 2;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 220;
      this._sparks.push({ x: cx + (Math.random() - 0.5) * PLAY.w * 0.8, y: cy, vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp - 80, t: 0, life: 0.9 + Math.random() * 0.5, s: 4 + Math.random() * 5 });
    }
  }

  // --- Render ----------------------------------------------------------------
  render(r) {
    this._bg.render(r);
    this._drawLogo(r);
    this._drawProfile(r);
    this._settings.render(r);
    this._drawResourceBar(r);
    this._drawPlayGlow(r);
    this._play.render(r);
    for (const p of this._sparks) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.sparkle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
    for (const n of this._nav) n.btn.render(r);
    this._drawBadges(r);
    this._drawCards(r);
    if (this._toast) this._drawToast(r);
  }

  _drawLogo(r) {
    const bob = Math.sin(this._t * (2 * Math.PI / LOGO.floatPeriod)) * LOGO.floatAmp;
    const y = LOGO.y + bob;
    r.withGlow('#ffdf7a', 20, () => UITheme.heading(r, 'COSMIC', CX, y + 68, 80, '#fff'));
    r.withGlow('#ffb020', 20, () => UITheme.heading(r, 'DRIFT', CX, y + 150, 80, '#ffe08a'));
  }

  _drawProfile(r) {
    const { x, y, s } = PROFILE;
    const cx = x + s / 2, cy = y + s / 2;
    UITheme.shadow(r, x, y, s, s, s / 2, 6, 0.3);
    const g = r.radialGradient(cx, cy, s / 2, [[0, '#9ad7ff'], [1, '#2f6fe0']]);
    r.fillCircle(cx, cy, s / 2, g);
    // Friendly dragon face.
    r.fillCircle(cx - s * 0.15, cy - s * 0.06, s * 0.1, '#fff');
    r.fillCircle(cx + s * 0.15, cy - s * 0.06, s * 0.1, '#fff');
    r.fillCircle(cx - s * 0.14, cy - s * 0.05, s * 0.05, '#233a72');
    r.fillCircle(cx + s * 0.14, cy - s * 0.05, s * 0.05, '#233a72');
    UITheme.goldFrame(r, x, y, s, s, s / 2, 5);
    // Online indicator (top-right green dot).
    r.withGlow('#3fc86a', 6, () => r.fillCircle(x + s * 0.92, y + s * 0.12, s * 0.1, '#3fc86a'));
    r.strokeRoundRect(x + s * 0.82, y + s * 0.02, s * 0.2, s * 0.2, s * 0.1, '#fff', 3);
    // Level badge (bottom-centre).
    const lvl = this.game.getSystem('save')?.getSlice('world')?.maxLevel ?? 1;
    const bw = 78, bh = 40, bx = cx - bw / 2, by = y + s - bh * 0.5;
    UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.orange, { shadow: true });
    r.text(`LV ${lvl}`, cx, by + bh / 2, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
  }

  _drawResourceBar(r) {
    const caps = [
      { rect: this._resRects[0], colors: UI.btn.orange, icon: (rr, cx, cy, s) => drawObjectiveIcon(rr, 'coins', cx, cy, s, '#fff'), val: this._coins.text, plus: true },
      { rect: this._resRects[1], colors: UI.btn.blue, icon: (rr, cx, cy, s) => drawObjectiveIcon(rr, 'gem', cx, cy, s, '#fff'), val: this._gems.text, plus: true },
      { rect: this._resRects[2], colors: UI.btn.teal, icon: boltIcon, val: this._energy.text, plus: false },
    ];
    for (const c of caps) {
      const b = c.rect;
      UITheme.button(r, b.x, b.y, b.w, b.h, RES.radius, c.colors, { shadow: true });
      // Icon disc on the left.
      const ir = b.h * 0.34;
      r.fillCircle(b.x + b.h * 0.5, b.centerY, ir + 6, 'rgba(255,255,255,0.25)');
      c.icon(r, b.x + b.h * 0.5, b.centerY, ir);
      // Value, centred in the space between the icon and the "+"/right edge so
      // the capsule never shows a dead gap regardless of digit count.
      const left = b.x + b.h * 0.95;
      const right = c.plus ? b.right - b.h * 0.95 : b.right - b.h * 0.35;
      r.text(c.val, (left + right) / 2, b.centerY, {
        font: '900 40px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
        outline: 'rgba(20,44,92,0.4)', outlineWidth: 4,
      });
      // "+" affordance.
      if (c.plus) {
        const pc = b.right - b.h * 0.5;
        r.withGlow(UI.gold.mid, 6, () => r.fillCircle(pc, b.centerY, b.h * 0.3, UI.gold.mid));
        r.text('+', pc, b.centerY + 2, { font: '900 34px system-ui, sans-serif', color: '#7a4a00', align: 'center', baseline: 'middle' });
      }
    }
  }

  /** Soft pulsing glow behind PLAY — the primary focus. */
  _drawPlayGlow(r) {
    const pulse = 0.5 + 0.5 * Math.sin(this._t * 2.2);
    r.setAlpha(0.25 + pulse * 0.3);
    const cx = PLAY.x + PLAY.w / 2, cy = PLAY.y + PLAY.h / 2;
    const g = r.radialGradient(cx, cy, PLAY.w * 0.72, [[0, 'rgba(120,240,140,0.9)'], [1, 'rgba(120,240,140,0)']]);
    r.fillRect(cx - PLAY.w, cy - PLAY.h, PLAY.w * 2, PLAY.h * 2, g);
    r.setAlpha(1);
  }

  /** Small notification badges on nav tiles (Events / Collection). */
  _drawBadges(r) {
    const ret = this._retention();
    for (const n of this._nav) {
      let show = false, txt = '';
      if (n.key === 'events' && ret?.hasUnclaimedDaily?.()) { show = true; txt = '!'; }
      if (!show) continue;
      const b = n.btn.bounds;
      const bx = b.right - 18, by = b.y + 18;
      const pulse = 0.8 + 0.2 * Math.sin(this._t * 5);
      r.withGlow('#ff4d5e', 8, () => r.fillCircle(bx, by, 20 * pulse, '#ff4d5e'));
      r.strokeRoundRect(bx - 20, by - 20, 40, 40, 20, '#fff', 3);
      r.text(txt, bx, by + 1, { font: '900 24px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    }
  }

  _drawCards(r) {
    const ret = this._retention();
    CARDS.forEach((c, i) => {
      const x = CARD.x0 + i * (CARD.w + CARD.gap) + this._scroll;
      if (x > 1080 || x + CARD.w < 0) return;   // cull off-screen
      const y = CARD.top;
      UITheme.button(r, x, y, CARD.w, CARD.h, CARD.radius, c.color, { shadow: true });
      // Gloss + gold trim provided by UITheme.button. Icon + label.
      drawObjectiveIcon(r, c.icon, x + 58, y + CARD.h * 0.42, 32, '#fff');
      r.text(c.label, x + 104, y + CARD.h * 0.36, { font: '900 22px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
      // Status line.
      let status = 'OPEN';
      if (c.id === 'daily') status = ret?.hasUnclaimedDaily?.() ? 'READY!' : 'CLAIMED';
      r.text(status, x + 104, y + CARD.h * 0.66, { font: '800 18px system-ui, sans-serif', color: 'rgba(255,255,255,0.92)', baseline: 'middle' });
      // Ready badge on the daily card.
      if (c.id === 'daily' && ret?.hasUnclaimedDaily?.()) {
        const pulse = 0.8 + 0.2 * Math.sin(this._t * 5);
        r.withGlow('#ff4d5e', 8, () => r.fillCircle(x + CARD.w - 24, y + 24, 18 * pulse, '#ff4d5e'));
      }
    });
    // Scroll dots.
    const dotY = CARD.top - 26;
    const total = CARDS.length, dw = 18;
    const startX = CX - (total * dw) / 2 + dw / 2;
    const active = Math.round(-this._scroll / (CARD.w + CARD.gap));
    for (let i = 0; i < total; i++) {
      r.fillCircle(startX + i * dw, dotY, i === active ? 6 : 4, i === active ? '#fff' : 'rgba(255,255,255,0.5)');
    }
  }

  _drawToast(r) {
    const a = Math.min(1, this._toast.t * 2);
    r.setAlpha(a);
    const w = 560, h = 84, x = CX - w / 2, y = 1200 - h / 2;
    UITheme.glassPanel(r, x, y, w, h, 24);
    r.text(this._toast.text, CX, y + h / 2, { font: '800 28px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle' });
    r.setAlpha(1);
  }

  // --- Input (non-button hit areas) ------------------------------------------
  onTap(px, py) {
    // Profile → (future) profile screen.
    if (this._profileRect.contains(px, py)) { this._tap(); this.events.emit('ui:openProfile'); return true; }
    // Resource capsules → Shop (coins/gems) ; energy = no-op info.
    for (let i = 0; i < this._resRects.length; i++) {
      if (this._resRects[i].contains(px, py)) { this._tap(); if (i < 2) this.events.emit('ui:openShop'); return true; }
    }
    // Bottom cards.
    if (py >= CARD.top && py <= CARD.top + CARD.h) {
      for (let i = 0; i < CARDS.length; i++) {
        const x = CARD.x0 + i * (CARD.w + CARD.gap) + this._scroll;
        if (px >= x && px <= x + CARD.w) {
          this._tap();
          const c = CARDS[i];
          if (c.event) this.events.emit(c.event);
          else if (c.toast) this._toast = { text: c.toast, t: 2.0 };
          return true;
        }
      }
    }
    return false;
  }
}
