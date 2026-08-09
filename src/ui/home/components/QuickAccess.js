/**
 * QuickAccess.js  (Home Screen · section: QUICK ACCESS BUTTONS)
 * -----------------------------------------------------------------------------
 * A responsive grid of QuickButton shortcuts that sits in the play area between
 * the PLAY button and the bottom nav. The grid re-flows to fit the available
 * width (3 per row by default) so adding/removing shortcuts never breaks the
 * layout. Each tile is an independent component that owns its own badge/locked/
 * highlight/tutorial state; this container only positions them and forwards taps.
 * -----------------------------------------------------------------------------
 */
import { QuickButton } from './QuickButton.js';
import { Icons } from '../Icons.js';
import { UI } from '../../theme/UITheme.js';
import { Rect } from '../../../utils/Rect.js';

/** Shortcut descriptors. A focused set: jump into Endless, or open the booster
 *  Shop. The big PLAY button above handles the Levels campaign. */
export const QUICK = [
  { id: 'daily', label: 'menu.daily', colors: UI.btn.purple, event: 'ui:playDaily',
    icon: (r, x, y, s, c) => r.text('★', x, y + 1, { font: `900 ${Math.round(s * 1.4)}px system-ui, sans-serif`, color: c, align: 'center', baseline: 'middle' }) },
  { id: 'endless', label: 'menu.endless', colors: UI.btn.orange, event: 'ui:playEndless',
    icon: (r, x, y, s, c) => r.text('∞', x, y + 1, { font: `900 ${Math.round(s * 1.7)}px system-ui, sans-serif`, color: c, align: 'center', baseline: 'middle' }) },
  { id: 'shop', label: 'menu.shop', colors: UI.btn.blue, event: 'ui:openShop', icon: (r, x, y, s, c) => Icons.shop(r, x, y, s, c) },
];

export class QuickAccess {
  constructor(game, safe, onTap, region, list = QUICK) {
    this.game = game;
    this.safe = safe;
    this.tiles = list.map((d) => new QuickButton(game, d, onTap));
    this.byId = {};
    for (const t of this.tiles) this.byId[t.def.id] = t;
    this._layout(region);
  }

  _layout(region) {
    const perRow = 3;
    const gap = 28;
    const w = (region.w - gap * (perRow - 1)) / perRow;
    const h = Math.min(w, 200);
    const rows = Math.ceil(this.tiles.length / perRow);
    const totalH = rows * h + (rows - 1) * gap;
    // Anchor the grid to the bottom of the region (just above the nav).
    const startY = region.y + region.h - totalH;
    this.tiles.forEach((t, i) => {
      const col = i % perRow, row = Math.floor(i / perRow);
      t.setRect(region.x + col * (w + gap), startY + row * (h + gap), w, h);
    });
    this._region = new Rect(region.x, startY, region.w, totalH);
  }

  update(dt) { for (const t of this.tiles) t.update(dt); }
  render(r) { for (const t of this.tiles) t.render(r); }
  onTap(px, py) { for (const t of this.tiles) if (t.onTap(px, py)) return true; return false; }
  bounds() { return this.tiles.map((t) => new Rect(t.rect.x, t.rect.y, t.rect.w, t.rect.h)); }
}
