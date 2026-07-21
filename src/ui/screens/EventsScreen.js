/**
 * EventsScreen.js
 * -----------------------------------------------------------------------------
 * A premium live-ops hub: one big featured event card with a glowing timer plus
 * a couple of smaller event tiles. Representative content — the modular
 * EventsSystem drives real schedules; this presents them beautifully.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';

const FEATURED = { name: 'Dragon Festival', icon: 'dragon', color: UI.btn.pink, sub: 'Clear levels to earn festival tokens!', ends: '2d 14h' };
const TILES = [
  { name: 'Treasure Rush', icon: 'chest', color: UI.btn.orange, ends: '6h' },
  { name: 'Crystal Trials', icon: 'gem', color: UI.btn.blue, ends: '1d 3h' },
];

export class EventsScreen extends PanelScreen {
  constructor(game) { super(game, 'EVENTS', { showTopBar: true }); this.name = 'events'; }

  drawContent(r, p) {
    const pad = 24;
    // Featured banner.
    const f = new Rect(p.x + pad, p.y + 34, p.w - pad * 2, 190);
    UITheme.button(r, f.x, f.y, f.w, f.h, 22, FEATURED.color);
    r.setAlpha(0.5); r.fillRoundRect(f.x + 10, f.y + 10, f.w - 20, f.h * 0.3, 14, 'rgba(255,255,255,0.5)'); r.setAlpha(1);
    r.withGlow('#fff', 16, () => drawObjectiveIcon(r, FEATURED.icon, f.centerX, f.y + f.h * 0.34, 46, '#fff'));
    UITheme.heading(r, FEATURED.name, f.centerX, f.y + f.h * 0.62, 26);
    r.text(FEATURED.sub, f.centerX, f.y + f.h * 0.75, { font: '700 13px system-ui, sans-serif', color: 'rgba(255,255,255,0.92)', align: 'center', baseline: 'middle' });
    // Timer pill.
    const tw = 150, th = 30, tx = f.centerX - tw / 2, tyy = f.bottom - th - 12;
    UITheme.chip(r, tx, tyy, tw, th, '#ffcf5e');
    r.text(`ENDS IN ${FEATURED.ends}`, f.centerX + 8, tyy + th / 2, { font: '800 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Smaller event tiles.
    const cw = (p.w - pad * 2 - 16) / 2, ch = 150, gy = f.bottom + 22;
    TILES.forEach((t, i) => {
      const x = p.x + pad + i * (cw + 16);
      UITheme.button(r, x, gy, cw, ch, 18, t.color);
      drawObjectiveIcon(r, t.icon, x + cw / 2, gy + ch * 0.4, 28, '#fff');
      r.text(t.name, x + cw / 2, gy + ch * 0.68, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      r.text(`Ends in ${t.ends}`, x + cw / 2, gy + ch * 0.82, { font: '700 12px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle' });
    });
  }
}
