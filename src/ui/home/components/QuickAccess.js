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

/** Shortcut descriptors. Island/Dragons lead; overflow wraps to more rows. */
export const QUICK = [
  { id: 'island', label: 'ISLAND', colors: UI.btn.teal, event: 'ui:openIsland', icon: (r, x, y, s, c) => Icons.island(r, x, y, s, c) },
  { id: 'worldmap', label: 'WORLD MAP', colors: UI.btn.blue, event: 'ui:openWorldMap', icon: (r, x, y, s, c) => Icons.map(r, x, y, s, c) },
  { id: 'dragons', label: 'DRAGONS', colors: UI.btn.pink, event: 'ui:openCollection', icon: (r, x, y, s, c) => Icons.dragon(r, x, y, s, c) },
  { id: 'collection', label: 'COLLECTION', colors: UI.btn.purple, event: 'ui:openCollection', icon: (r, x, y, s, c) => Icons.collection(r, x, y, s, c) },
  { id: 'events', label: 'EVENTS', colors: UI.btn.orange, event: 'ui:openEvents', icon: (r, x, y, s, c) => Icons.events(r, x, y, s, c) },
  { id: 'shop', label: 'SHOP', colors: UI.btn.blue, event: 'ui:openShop', icon: (r, x, y, s, c) => Icons.shop(r, x, y, s, c) },
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
