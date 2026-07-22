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
    this._drawResourceBar(r);
    this._drawPlayPlatform(r);
    this._drawPlayGlow(r);
    this._play.render(r);
    this._drawPlayReflection(r);
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
    this._crystalWord(r, 'COSMIC', CX, y + 68, 80, '#ffffff');
    this._crystalWord(r, 'DRIFT', CX, y + 150, 80, '#dff6ff');
    // Occasional travelling sparkle across the wordmark.
    const cyc = (this._t % 3.4) / 0.7;
    if (cyc < 1) {
      const a = Math.sin(cyc * Math.PI);
      const sx = CX - 150 + cyc * 300, sy = y + 60 - Math.sin(cyc * Math.PI) * 30;
      r.setAlpha(a); r.withGlow('#fff', 10, () => r.sparkle(sx, sy, 14, '#fff6c8')); r.setAlpha(1);
    }
  }

  /** A crystal letterform: soft depth shadow, bevelled gold outline, crystal
   *  fill and a cyan magic glow — the premium logo treatment. */
  _crystalWord(r, text, cx, cy, size, fill) {
    const font = `900 ${size}px system-ui, sans-serif`;
    r.text(text, cx + 2, cy + 4, { font, color: 'rgba(20,44,92,0.35)', align: 'center', baseline: 'middle' });
    r.withGlow('#7fe0ff', 18, () => {
      // Outer then inner gold rim (bevelled outline), crystal fill on top.
      r.text(text, cx, cy, { font, color: fill, align: 'center', baseline: 'middle', outline: UI.gold.line, outlineWidth: size * 0.17 });
      r.text(text, cx, cy, { font, color: fill, align: 'center', baseline: 'middle', outline: UI.gold.deep, outlineWidth: size * 0.10 });
    });
  }

  _drawProfile(r) {
    const { x, y, s } = PROFILE;
    const cx = x + s / 2, cy = y + s / 2;
    const avatarR = s / 2 - 10;
    const ctx = r.ctx;
    UITheme.shadow(r, x, y, s, s, s / 2, 6, 0.3);

    // XP ring — progress toward the next 10-level unlock (derived from level).
    const lvl = this.game.getSystem('save')?.getSlice('world')?.maxLevel ?? 1;
    const frac = (lvl % 10 === 0) ? 1 : (lvl % 10) / 10;
    const ringR = s / 2 - 5;
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();
    r.withGlow(UI.gold.mid, 8, () => {
      ctx.strokeStyle = UI.gold.mid;
      ctx.beginPath(); ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    });

    // Avatar disc + friendly dragon face.
    const g = r.radialGradient(cx, cy, avatarR, [[0, '#9ad7ff'], [1, '#2f6fe0']]);
    r.fillCircle(cx, cy, avatarR, g);
    r.fillCircle(cx - avatarR * 0.3, cy - avatarR * 0.12, avatarR * 0.2, '#fff');
    r.fillCircle(cx + avatarR * 0.3, cy - avatarR * 0.12, avatarR * 0.2, '#fff');
    r.fillCircle(cx - avatarR * 0.28, cy - avatarR * 0.1, avatarR * 0.1, '#233a72');
    r.fillCircle(cx + avatarR * 0.28, cy - avatarR * 0.1, avatarR * 0.1, '#233a72');
    UITheme.goldFrame(r, cx - avatarR, cy - avatarR, avatarR * 2, avatarR * 2, avatarR, 4);

    // Level badge (bottom-centre).
    const bw = 78, bh = 40, bx = cx - bw / 2, by = y + s - bh * 0.5;
    UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.orange, { shadow: true });
    r.text(`LV ${lvl}`, cx, by + bh / 2, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Notification indicator — a pulsing dot when something is waiting.
    if (this._retention()?.hasUnclaimedDaily?.()) {
      const nx = x + s * 0.92, ny = y + s * 0.08;
      const pulse = 0.8 + 0.2 * Math.sin(this._t * 5);
      r.withGlow('#ff4d5e', 8, () => r.fillCircle(nx, ny, 15 * pulse, '#ff4d5e'));
      r.strokeRoundRect(nx - 15, ny - 15, 30, 30, 15, '#fff', 3);
      r.text('!', nx, ny + 1, { font: '900 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    }
  }

  _drawResourceBar(r) {
    const caps = [
      { rect: this._resRects[0], colors: UI.btn.orange, icon: (rr, cx, cy, s) => this._coinIcon(rr, cx, cy, s), val: this._coins.text, plus: true },
      { rect: this._resRects[1], colors: UI.btn.blue, icon: (rr, cx, cy, s) => this._gemIcon(rr, cx, cy, s), val: this._gems.text, plus: true },
      { rect: this._resRects[2], colors: UI.btn.teal, icon: (rr, cx, cy, s) => this._boltCrystal(rr, cx, cy, s), val: this._energy.text, plus: false },
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

  /** A magical floating stone platform the PLAY button rests on. */
  _drawPlayPlatform(r) {
    const ctx = r.ctx;
    const cx = PLAY.x + PLAY.w / 2;
    const topY = PLAY.y + PLAY.h - 30;       // platform top tucks under the button
    const rx = PLAY.w * 0.52, ry = 44;
    const bob = Math.sin(this._t * 0.9) * 4;
    ctx.save(); ctx.translate(0, bob);
    // Tapering rock underside.
    const rock = r.linearGradient(cx, topY, cx, topY + 150, [[0, '#dcae74'], [1, '#b07a45']]);
    ctx.fillStyle = rock; ctx.beginPath();
    ctx.moveTo(cx - rx * 0.92, topY); ctx.lineTo(cx + rx * 0.92, topY);
    ctx.quadraticCurveTo(cx + rx * 0.3, topY + 150, cx, topY + 160);
    ctx.quadraticCurveTo(cx - rx * 0.3, topY + 150, cx - rx * 0.92, topY); ctx.closePath(); ctx.fill();
    // Stone top surface.
    const stone = r.linearGradient(cx, topY - ry, cx, topY + ry, [[0, '#fbfdff'], [1, '#c6ddf6']]);
    ctx.fillStyle = stone; ctx.beginPath(); ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    // Grass rim.
    ctx.fillStyle = '#5ec46a'; ctx.beginPath(); ctx.ellipse(cx, topY - 6, rx * 0.98, ry * 0.8, 0, Math.PI, Math.PI * 2); ctx.fill();
    // Little crystals + glow on the rim.
    const cg = 0.6 + 0.4 * Math.sin(this._t * 2);
    r.withGlow('#7fe0ff', 6 + cg * 6, () => {
      for (const dx of [-0.7, 0.62]) {
        const px = cx + rx * dx, py = topY + 6;
        ctx.fillStyle = '#8fd6ff'; ctx.beginPath();
        ctx.moveTo(px, py - 24); ctx.lineTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.closePath(); ctx.fill();
      }
    });
    ctx.restore();
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
      // Bounce: a springy vertical hop + scale pop.
      const hop = Math.abs(Math.sin(this._t * 3)) ;
      const bx = b.right - 18, by = b.y + 18 - hop * 6;
      const scale = 1 + hop * 0.18;
      r.withGlow('#ff4d5e', 10, () => r.fillCircle(bx, by, 20 * scale, '#ff4d5e'));
      r.strokeRoundRect(bx - 20 * scale, by - 20 * scale, 40 * scale, 40 * scale, 20 * scale, '#fff', 3);
      r.text(txt, bx, by + 1, { font: `900 ${Math.round(24 * scale)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });
    }
  }

  _drawCards(r) {
    const ret = this._retention();
    CARDS.forEach((c, i) => {
      const x = CARD.x0 + i * (CARD.w + CARD.gap) + this._scroll;
      if (x > 1080 || x + CARD.w < 0) return;   // cull off-screen
      const y = CARD.top + Math.sin(this._t * 1.4 + i * 0.8) * 4;   // soft idle bob
      // Soft coloured glow behind each card.
      r.withGlow(c.color[1], 12, () => UITheme.button(r, x, y, CARD.w, CARD.h, CARD.radius, c.color, { shadow: true }));
      // Unique animated illustration (gentle bob offset from the card).
      const iy = y + CARD.h * 0.42 + Math.sin(this._t * 2 + i) * 3;
      this._cardArt(r, c.id, x + 60, iy, 22);
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

  // --- Bespoke premium illustrations ----------------------------------------
  _coinIcon(r, cx, cy, s) {
    const ctx = r.ctx;
    ctx.fillStyle = '#e0a41e'; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.12, s, s * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    const g = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#fff3c4'], [1, '#ffcf5e']]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.92, s * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    r.text('★', cx, cy + 1, { font: `900 ${s}px system-ui, sans-serif`, color: '#e0a41e', align: 'center', baseline: 'middle' });
    r.setAlpha(0.6); r.fillCircle(cx - s * 0.32, cy - s * 0.3, s * 0.18, '#fff'); r.setAlpha(1);
  }
  _gemIcon(r, cx, cy, s) {
    const ctx = r.ctx;
    const g = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#e2f4ff'], [1, '#2f8bff']]);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(cx, cy - s); ctx.lineTo(cx - s * 0.9, cy - s * 0.1); ctx.lineTo(cx, cy + s); ctx.lineTo(cx + s * 0.9, cy - s * 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.9, cy - s * 0.1); ctx.lineTo(cx + s * 0.9, cy - s * 0.1); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
    r.sparkle(cx - s * 0.28, cy - s * 0.28, s * 0.2, '#fff');
  }
  _boltCrystal(r, cx, cy, s) {
    const ctx = r.ctx;
    const g = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#c2fff4'], [1, '#18d0c0']]);
    ctx.fillStyle = g; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(cx + s * 0.12, cy - s * 0.62); ctx.lineTo(cx - s * 0.34, cy + s * 0.06); ctx.lineTo(cx, cy + s * 0.06);
    ctx.lineTo(cx - s * 0.12, cy + s * 0.62); ctx.lineTo(cx + s * 0.4, cy - s * 0.12); ctx.lineTo(cx + s * 0.02, cy - s * 0.12); ctx.closePath(); ctx.fill();
  }
  _cardArt(r, id, cx, cy, s) {
    const ctx = r.ctx; ctx.fillStyle = '#fff';
    if (id === 'daily') { // gift present: box + lid + ribbon + bow
      r.fillRoundRect(cx - s, cy - s * 0.15, s * 2, s * 1.05, s * 0.2, '#fff');
      r.fillRoundRect(cx - s * 1.05, cy - s * 0.6, s * 2.1, s * 0.55, s * 0.2, '#fff');
      r.fillRoundRect(cx - s * 0.14, cy - s * 0.6, s * 0.28, s * 1.5, s * 0.1, 'rgba(120,190,255,0.9)');
      r.fillCircle(cx - s * 0.32, cy - s * 0.78, s * 0.3, '#fff');
      r.fillCircle(cx + s * 0.32, cy - s * 0.78, s * 0.3, '#fff');
    } else if (id === 'season') {
      ctx.fillStyle = 'rgba(120,190,255,0.85)'; ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy + s * 0.2); ctx.lineTo(cx - s * 0.2, cy + s * 1.2); ctx.lineTo(cx, cy + s * 0.7); ctx.lineTo(cx + s * 0.2, cy + s * 1.2); ctx.lineTo(cx + s * 0.5, cy + s * 0.2); ctx.closePath(); ctx.fill();
      r.fillCircle(cx, cy - s * 0.1, s * 0.85, '#fff');
      r.text('★', cx, cy - s * 0.05, { font: `900 ${s}px system-ui, sans-serif`, color: '#ffb020', align: 'center', baseline: 'middle' });
    } else if (id === 'event') {
      r.fillRoundRect(cx - s, cy - s * 0.7, s * 2, s * 1.6, s * 0.18, '#fff');
      r.fillRoundRect(cx - s, cy - s * 0.7, s * 2, s * 0.5, s * 0.18, 'rgba(255,150,60,0.9)');
      r.fillCircle(cx, cy + s * 0.35, s * 0.3, 'rgba(255,150,60,0.9)');
    } else { // lucky — clover
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; r.fillCircle(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5, s * 0.42, '#fff'); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 0.4, cy + s * 1.1); ctx.stroke();
    }
  }
  /** A soft light reflection sweeping across the PLAY button. */
  _drawPlayReflection(r) {
    const ctx = r.ctx;
    ctx.save(); r.roundRectPath(PLAY.x, PLAY.y, PLAY.w, PLAY.h, PLAY.radius); ctx.clip();
    const sweep = (this._t * 0.35) % 1.6;   // travels, then pauses off-screen
    const bx = PLAY.x - PLAY.w * 0.3 + sweep * (PLAY.w * 1.2);
    ctx.globalAlpha = 0.35;
    const g = r.linearGradient(bx - 70, 0, bx + 70, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillStyle = g; ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
    ctx.globalAlpha = 1; ctx.restore();
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
