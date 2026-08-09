/**
 * BottomNav.js  (Home Screen · section: BOTTOM NAVIGATION)
 * -----------------------------------------------------------------------------
 * A persistent bottom tab bar of at most five tabs. It distributes tabs evenly
 * across the safe nav band, so adding or removing a tab re-flows the row without
 * breaking the layout. The active tab is raised and glows. Each tab is an icon
 * over a short label; badges are supported for attention. Purely a router — it
 * emits `ui:*` intents and never touches gameplay.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI } from '../../theme/UITheme.js';
import { t as tr } from '../../../i18n/Localization.js';
import { Rect } from '../../../utils/Rect.js';
import { Icons } from '../Icons.js';
import { Motion } from '../Motion.js';

const MAX_TABS = 5;

export const NAV_TABS = [
  { id: 'home', label: 'menu.home', colors: UI.btn.teal, event: null, icon: (r, x, y, s, c) => Icons.island(r, x, y, s, c) },
  { id: 'shop', label: 'menu.shop', colors: UI.btn.blue, event: 'ui:openShop', icon: (r, x, y, s, c) => Icons.shop(r, x, y, s, c) },
  { id: 'settings', label: 'menu.settings', colors: UI.btn.purple, event: 'ui:openSettings', icon: (r, x, y, s, c) => Icons.gear(r, x, y, s, c) },
];

export class BottomNav {
  constructor(game, safe, onTap, list = NAV_TABS) {
    this.game = game;
    this.safe = safe;
    this._tap = onTap;
    this.active = 'home';
    this._t = 0;
    const tabs = list.slice(0, MAX_TABS);
    const band = safe.nav;
    // Rounded shelf behind the tabs.
    this._shelf = new Rect(-20, band.y + 6, safe.w + 40, band.h + 40);
    const pad = 20;
    const usable = safe.w - pad * 2;
    const tw = usable / tabs.length;
    const bh = Math.min(band.h - 30, 150);
    const by = band.y + (band.h - safe.bottom - bh) / 2 + 8;
    this.tabs = tabs.map((d, i) => ({
      def: d,
      rect: new Rect(pad + i * tw + tw * 0.10, by, tw * 0.80, bh),
      badge: 0,
      pressAt: -1,
    }));
    this.byId = {};
    for (const t of this.tabs) this.byId[t.def.id] = t;
  }

  update(dt) { this._t += dt; }

  render(r) {
    UITheme.glassPanel(r, this._shelf.x, this._shelf.y, this._shelf.w, this._shelf.h, 34);
    for (const t of this.tabs) this._tab(r, t);
  }

  _tab(r, t) {
    const b = t.rect;
    const isActive = t.def.id === this.active;
    const now = performance.now();
    const pressT = t.pressAt >= 0 ? (now - t.pressAt) / 1000 : 99;
    const press = pressT < 0.3 ? 0.92 + 0.08 * (pressT / 0.3) : 1;
    const lift = isActive ? 10 + Motion.float(this._t, 3, 2.4) : 0;
    const ctx = r.ctx;

    ctx.save();
    ctx.translate(b.centerX, b.centerY - lift);
    ctx.scale(press, press);
    ctx.translate(-b.centerX, -b.centerY);

    const cx = b.centerX;
    const icyR = Math.min(b.w, b.h) * 0.30;
    if (isActive) {
      r.withGlow(t.def.colors[1], 14, () => r.fillCircle(cx, b.y + icyR + 6, icyR + 12, t.def.colors[1]));
      UITheme.goldFrame(r, cx - icyR - 12, b.y - 6, (icyR + 12) * 2, (icyR + 12) * 2, icyR + 12, 3);
    }
    t.def.icon(r, cx, b.y + icyR + 6, icyR, isActive ? '#fff' : '#3a5a86');
    r.text(tr(t.def.label), cx, b.bottom - 12, {
      font: `800 ${isActive ? 22 : 20}px system-ui, sans-serif`,
      color: isActive ? UI.ink : 'rgba(47,84,135,0.75)', align: 'center', baseline: 'middle',
    });
    ctx.restore();

    if (t.badge !== 0) {
      const hop = Motion.bounce(this._t, 4, 0.85);
      const bx = cx + icyR + 4, by = b.y - lift + 4 - hop;
      r.withGlow('#ff4d5e', 8, () => r.fillCircle(bx, by, 15, '#ff4d5e'));
      r.strokeRoundRect(bx - 15, by - 15, 30, 30, 15, '#fff', 2.5);
      if (t.badge > 0) r.text(t.badge > 9 ? '9+' : String(t.badge), bx, by + 1, { font: '900 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    }
  }

  onTap(px, py) {
    for (const t of this.tabs) {
      if (t.rect.contains(px, py)) {
        t.pressAt = performance.now();
        this._tap?.(t.def.id);
        if (t.def.event) this.game.events.emit(t.def.event);
        else this.active = t.def.id;    // 'home' just stays put
        return true;
      }
    }
    return false;
  }

  bounds() { return this.tabs.map((t) => new Rect(t.rect.x, t.rect.y, t.rect.w, t.rect.h)); }
}
