/**
 * MenuScreen.js
 * -----------------------------------------------------------------------------
 * The premium main menu. A living floating-island sky (MenuBackground) sits
 * behind a glossy game logo, a big PLAY button and a row of gold-framed icon
 * buttons — Events, Dragons, Island, Shop, Settings — plus the meta TopBar.
 * Everything breathes and sparkles; nothing is flat. This is the game's first
 * impression: "this is a premium mobile game."
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { TopBar } from '../components/TopBar.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { t } from '../../i18n/Localization.js';

// --- Small procedural icons for the nav buttons ------------------------------
const Icons = {
  events(r, cx, cy, s) { r.sparkle(cx, cy, s, '#fff'); r.fillCircle(cx, cy, s * 0.28, '#fff'); },
  dragons(r, cx, cy, s) { drawObjectiveIcon(r, 'dragon', cx, cy, s, '#fff'); },
  island(r, cx, cy, s) {
    r.ctx.fillStyle = '#fff';
    r.ctx.beginPath(); r.ctx.ellipse(cx, cy + s * 0.3, s, s * 0.4, 0, 0, Math.PI * 2); r.ctx.fill();
    r.fillCircle(cx, cy - s * 0.2, s * 0.5, '#fff');
  },
  shop(r, cx, cy, s) {
    r.fillRoundRect(cx - s * 0.8, cy - s * 0.3, s * 1.6, s * 1.2, s * 0.2, '#fff');
    r.ctx.strokeStyle = '#fff'; r.ctx.lineWidth = s * 0.22;
    r.ctx.beginPath(); r.ctx.arc(cx, cy - s * 0.2, s * 0.5, Math.PI, 0); r.ctx.stroke();
  },
  settings(r, cx, cy, s) {
    const ctx = r.ctx; ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s, cy + Math.sin(a) * s, s * 0.28, 0, Math.PI * 2); ctx.fill(); }
    r.fillCircle(cx, cy, s * 0.8, '#fff'); r.fillCircle(cx, cy, s * 0.4, '#2f8fe0');
  },
};

export class MenuScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'menu';
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._topbar = new TopBar(game);
    this._t = 0;

    const w = this.bounds.w;
    const h = this.bounds.h;

    // Big PLAY button.
    const pw = w * 0.62;
    const ph = 112;
    this.add(new PremiumButton(w / 2 - pw / 2, h * 0.56, pw, ph,
      () => this.events.emit('ui:playPressed'),
      { label: t('common.play'), colors: UI.btn.play, radius: 34, font: '900 46px system-ui, sans-serif' }));

    // Bottom nav row of round icon buttons.
    this._nav = [
      { key: 'events', label: t('menu.events'), colors: UI.btn.orange, event: 'ui:openEvents' },
      { key: 'dragons', label: t('menu.dragons'), colors: UI.btn.pink, event: 'ui:openCollection' },
      { key: 'island', label: t('menu.island'), colors: UI.btn.teal, event: 'ui:openWorldMap' },
      { key: 'shop', label: t('menu.shop'), colors: UI.btn.purple, event: 'ui:openShop' },
      { key: 'settings', label: t('menu.settings'), colors: UI.btn.blue, event: 'ui:openSettings' },
    ];
    const n = this._nav.length;
    const bs = 88;
    const rowW = w - 40;
    const step = rowW / n;
    const navY = h * 0.82;
    this._nav.forEach((item, i) => {
      const cx = 20 + step * i + step / 2;
      item.btn = this.add(new PremiumButton(cx - bs / 2, navY, bs, bs,
        () => this.events.emit(item.event),
        { colors: item.colors, round: true, icon: Icons[item.key] }));
      item.cx = cx;
    });
  }

  update(dt) {
    this._t += dt;
    this._bg.update(dt);
    this._topbar.update(dt);
  }

  render(r) {
    this._bg.render(r);
    this._topbar.render(r, this.bounds.w);
    this._drawLogo(r);
    for (const child of this.children) child.render(r);
    this._drawNavLabels(r);
  }

  _drawLogo(r) {
    const cx = this.bounds.centerX;
    const y = this.bounds.h * 0.34;
    const bob = Math.sin(this._t * 1.2) * 4;
    r.withGlow('#ffdf7a', 22, () => UITheme.heading(r, 'COSMIC', cx, y + bob, 62, '#fff'));
    r.withGlow('#ffb020', 22, () => UITheme.heading(r, 'DRIFT', cx, y + 58 + bob, 62, '#ffe08a'));
    // Ribbon subtitle.
    const rw = 260, rh = 34, rx = cx - rw / 2, ry = y + 96 + bob;
    UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.purple, { shadow: true });
    r.text(t('menu.tagline'), cx, ry + rh / 2, { font: '800 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
  }

  _drawNavLabels(r) {
    const y = this.bounds.h * 0.82 + 88 + 16;
    for (const item of this._nav) {
      r.text(item.label, item.cx + 1, y + 1, { font: '800 11px system-ui, sans-serif', color: 'rgba(10,20,50,0.4)', align: 'center', baseline: 'middle' });
      r.text(item.label, item.cx, y, { font: '800 11px system-ui, sans-serif', color: UI.white, align: 'center', baseline: 'middle' });
    }
  }
}
