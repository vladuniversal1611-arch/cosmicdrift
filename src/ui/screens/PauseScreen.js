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
    // Size the panel to its content (a title band + 4 buttons) so it reads as a
    // tidy dialog rather than a big empty sheet, and centre it on screen.
    const bh = 74, gap = 18, topPad = 96, botPad = 44;
    const panelW = w * 0.72;
    const panelH = topPad + bh * 4 + gap * 3 + botPad;
    this.panel = { x: (w - panelW) / 2, y: (h - panelH) / 2, w: panelW, h: panelH };
    const p = this.panel;
    const bw = p.w * 0.74, bx = p.x + (p.w - bw) / 2;
    const by = p.y + topPad;
    const btn = (i, label, colors, ev) => this.add(new PremiumButton(bx, by + (bh + gap) * i, bw, bh,
      () => this.events.emit(ev), { label, colors, radius: 24, font: '900 26px system-ui, sans-serif' }));
    btn(0, t('common.resume'), UI.btn.play, 'ui:back');
    btn(1, t('hud.worldMap'), UI.btn.teal, 'ui:openWorldMap');
    btn(2, t('menu.settings'), UI.btn.blue, 'ui:openSettings');
    btn(3, t('titles.mainMenu'), UI.btn.orange, 'ui:mainMenu');
  }

  onEnter() { this.events.emit('ui:modalOpen'); }
  onExit() { this.events.emit('ui:modalClose'); }

  render(r) {
    const b = this.bounds;
    r.setAlpha(0.55); r.fillRect(0, 0, b.w, b.h, '#1e5aa0'); r.setAlpha(1);
    const p = this.panel;
    UITheme.glassPanel(r, p.x, p.y, p.w, p.h, 26);
    const rw = 200, rh = 46, rx = p.x + (p.w - rw) / 2, ry = p.y - rh * 0.5;
    UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.purple);
    r.text(t('titles.paused'), p.x + p.w / 2, ry + rh / 2, { font: '900 24px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    for (const child of this.children) child.render(r);
  }
}
