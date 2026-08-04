/**
 * WorldMapHud.js
 * -----------------------------------------------------------------------------
 * The fixed overlay: a top bar (Back, current-world name + progress %, and
 * Coins/Gems/Energy chips with a Settings button) and a bottom nav (Home,
 * Events, Collection, Shop, Dragons). Pure view + hit-testing; it emits `ui:*`
 * intents and reads balances from the EconomySystem via rolling counters.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { Rect } from '../../utils/Rect.js';
import { Icons } from '../home/Icons.js';
import { Motion } from '../home/Motion.js';

export class WorldMapHud {
  constructor(game, w, h) {
    this.game = game; this.w = w; this.h = h; this._t = 0;
    this.worldName = ''; this.progress = 0;
    this._coins = new Rolling(0); this._gems = new Rolling(0);

    this._back = new Rect(28, 44, 132, 76);
    this._settings = new Rect(w - 28 - 76, 44, 76, 76);
    // Currency chips row (under the top row) — just the two currencies.
    const cw = 220, gap = 18, y = 132;
    this._chips = [
      { id: 'coins', currency: 'gold', colors: UI.btn.orange, icon: (r, x, yy, s) => Icons.coin(r, x, yy, s), roll: this._coins, rect: new Rect(28, y, cw, 60) },
      { id: 'gems', currency: 'crystal', colors: UI.btn.blue, icon: (r, x, yy, s) => Icons.gem(r, x, yy, s), roll: this._gems, rect: new Rect(28 + cw + gap, y, cw, 60) },
    ];
    // Bottom nav.
    const tabs = [
      { id: 'home', label: 'HOME', colors: UI.btn.teal, event: 'ui:closeWorldMap', icon: (r, x, yy, s, c) => Icons.island(r, x, yy, s, c) },
      { id: 'events', label: 'EVENTS', colors: UI.btn.orange, event: 'ui:openEvents', icon: (r, x, yy, s, c) => Icons.events(r, x, yy, s, c) },
      { id: 'collection', label: 'HEROES', colors: UI.btn.pink, event: 'ui:openCollection', icon: (r, x, yy, s, c) => Icons.dragon(r, x, yy, s, c) },
      { id: 'shop', label: 'SHOP', colors: UI.btn.blue, event: 'ui:openShop', icon: (r, x, yy, s, c) => Icons.shop(r, x, yy, s, c) },
      { id: 'settings', label: 'SETTINGS', colors: UI.btn.purple, event: 'ui:openSettings', icon: (r, x, yy, s, c) => Icons.gear(r, x, yy, s, c) },
    ];
    const navH = 190, by = h - navH;
    this._navShelf = new Rect(-20, by + 6, w + 40, navH + 40);
    const pad = 20, tw = (w - pad * 2) / tabs.length, bh = 130;
    this._tabs = tabs.map((d, i) => ({ def: d, rect: new Rect(pad + i * tw + tw * 0.12, by + 26, tw * 0.76, bh), pressAt: -1, badge: 0, ph: i * 0.6 }));
  }

  /** Set a bottom-nav badge (0 none, -1 red dot, >0 count). */
  setBadge(id, n) { const t = this._tabs.find((x) => x.def.id === id); if (t) t.badge = n; }

  update(dt) {
    this._t += dt;
    const eco = this.game.getSystem('economy');
    if (eco) { this._coins.set(eco.balance('gold')); this._gems.set(eco.balance('crystal')); }
    this._coins.update(dt); this._gems.update(dt);
  }

  render(r) {
    // Top: back + title + settings + chips.
    UITheme.button(r, this._back.x, this._back.y, this._back.w, this._back.h, 20, UI.btn.teal);
    r.text('◀', this._back.centerX, this._back.centerY, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    UITheme.button(r, this._settings.x, this._settings.y, this._settings.w, this._settings.h, this._settings.w / 2, UI.btn.blue, { shadow: true });
    Icons.gear(r, this._settings.centerX, this._settings.centerY, this._settings.w * 0.3);

    UITheme.heading(r, this.worldName, this.w / 2, 74, 34, UI.white);
    r.text(`${Math.round(this.progress)}% EXPLORED`, this.w / 2, 108, { font: '800 18px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });

    for (const c of this._chips) {
      const b = c.rect; UITheme.button(r, b.x, b.y, b.w, b.h, b.h / 2, c.colors, { shadow: true });
      const ir = b.h * 0.32; r.fillCircle(b.x + b.h * 0.5, b.centerY, ir + 4, 'rgba(255,255,255,0.25)'); c.icon(r, b.x + b.h * 0.5, b.centerY, ir);
      r.text(c.roll.text, (b.x + b.h * 0.95 + b.right) / 2, b.centerY, { font: '900 30px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
    }

    // Bottom nav — glass panel with animated, glowing icons + badges.
    UITheme.glassPanel(r, this._navShelf.x, this._navShelf.y, this._navShelf.w, this._navShelf.h, 30);
    const now = performance.now();
    for (const t of this._tabs) {
      const b = t.rect, cx = b.centerX, icyR = Math.min(b.w, b.h) * 0.30;
      const pressT = t.pressAt >= 0 ? (now - t.pressAt) / 1000 : 99;
      const press = pressT < 0.3 ? 0.9 + 0.1 * (pressT / 0.3) : 1;
      const float = Motion.float(this._t, 3, 2.6, t.ph);
      const ctx = r.ctx; ctx.save(); ctx.translate(cx, b.centerY + float); ctx.scale(press, press); ctx.translate(-cx, -b.centerY);
      const icy = b.y + icyR + 6;
      r.withGlow(t.def.colors[1], 8, () => r.fillCircle(cx, icy, icyR + 8, 'rgba(255,255,255,0.5)'));
      t.def.icon(r, cx, icy, icyR, t.def.colors[1]);
      r.text(t.def.label, cx, b.bottom - 10, { font: '800 18px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle' });
      ctx.restore();
      if (t.badge !== 0) {
        const bx = cx + icyR + 6, byy = icy - icyR + float, hop = Motion.bounce(this._t, 3, 0.85, t.ph);
        r.withGlow('#ff4d5e', 8, () => r.fillCircle(bx, byy - hop, 14, '#ff4d5e'));
        r.strokeRoundRect(bx - 14, byy - hop - 14, 28, 28, 14, '#fff', 2.5);
        if (t.badge > 0) r.text(String(t.badge), bx, byy - hop + 1, { font: '900 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      }
    }
  }

  onTap(px, py) {
    if (this._back.contains(px, py)) { this.game.events.emit('ui:closeWorldMap'); return true; }
    if (this._settings.contains(px, py)) { this.game.events.emit('ui:openSettings'); return true; }
    for (const c of this._chips) if (c.rect.contains(px, py)) { this.game.events.emit('ui:openShop', { resource: c.id }); return true; }
    for (const t of this._tabs) if (t.rect.contains(px, py)) { t.pressAt = performance.now(); this.game.getSystem('audio')?.play('button'); this.game.events.emit(t.def.event); return true; }
    return false;
  }
}
