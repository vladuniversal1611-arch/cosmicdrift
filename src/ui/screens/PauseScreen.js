/**
 * PauseScreen.js
 * -----------------------------------------------------------------------------
 * A compact glass pause panel over the game: Resume, Settings and Main Menu,
 * as premium gold-framed buttons. Blocks board input while open.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { t } from '../../i18n/Localization.js';

export class PauseScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'pause';
    const w = this.bounds.w, h = this.bounds.h;
    this.panel = { x: w * 0.16, y: h * 0.3, w: w * 0.68, h: h * 0.4 };
    const p = this.panel;
    const bw = p.w * 0.7, bh = 68, bx = p.x + (p.w - bw) / 2;
    this.add(new PremiumButton(bx, p.y + p.h * 0.28, bw, bh, () => this.events.emit('ui:back'),
      { label: t('common.resume'), colors: UI.btn.play, radius: 24, font: '900 26px system-ui, sans-serif' }));
    this.add(new PremiumButton(bx, p.y + p.h * 0.28 + bh + 16, bw, bh, () => this.events.emit('ui:openSettings'),
      { label: t('menu.settings'), colors: UI.btn.blue, radius: 24, font: '900 26px system-ui, sans-serif' }));
    this.add(new PremiumButton(bx, p.y + p.h * 0.28 + (bh + 16) * 2, bw, bh, () => this.events.emit('ui:mainMenu'),
      { label: t('titles.mainMenu'), colors: UI.btn.orange, radius: 24, font: '900 26px system-ui, sans-serif' }));
  }

  onEnter() { this.events.emit('ui:modalOpen'); }
  onExit() { this.events.emit('ui:modalClose'); }

  render(r) {
    const b = this.bounds;
    r.setAlpha(0.62); r.fillRect(0, 0, b.w, b.h, '#0a1030'); r.setAlpha(1);
    const p = this.panel;
    UITheme.glassPanel(r, p.x, p.y, p.w, p.h, 26);
    const rw = 200, rh = 46, rx = p.x + (p.w - rw) / 2, ry = p.y - rh * 0.5;
    UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.purple);
    r.text(t('titles.paused'), p.x + p.w / 2, ry + rh / 2, { font: '900 24px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    for (const child of this.children) child.render(r);
  }
}
