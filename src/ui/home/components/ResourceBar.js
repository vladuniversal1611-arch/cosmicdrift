/**
 * ResourceBar.js  (Home Screen · section 4 container)
 * -----------------------------------------------------------------------------
 * Lays out a row of independent ResourceChips and grows automatically: add a
 * descriptor to RESOURCES (or pass a custom list) and the bar re-flows, wrapping
 * to a second row when more chips than fit-per-row are present. Owns no resource
 * logic — each chip reads its own balance and the bar only positions them.
 * -----------------------------------------------------------------------------
 */
import { ResourceChip } from './ResourceChip.js';
import { Icons } from '../Icons.js';
import { UI } from '../../theme/UITheme.js';
import { Rect } from '../../../utils/Rect.js';

/** Default resources. Future resources: append a descriptor — layout adapts. */
export const RESOURCES = [
  { id: 'coins', currency: 'gold', colors: UI.btn.orange, plus: true, tip: 'Coins — earned in play', icon: (r, x, y, s) => Icons.coin(r, x, y, s) },
  { id: 'gems', currency: 'crystal', colors: UI.btn.blue, plus: true, tip: 'Gems — premium currency', icon: (r, x, y, s) => Icons.gem(r, x, y, s) },
  { id: 'energy', currency: 'essence', colors: UI.btn.teal, plus: false, tip: 'Energy — powers the dragon', icon: (r, x, y, s) => Icons.energy(r, x, y, s) },
  { id: 'dust', currency: 'stardust', colors: UI.btn.purple, plus: true, tip: 'Dragon Dust — rare crafting', icon: (r, x, y, s) => Icons.dust(r, x, y, s) },
];

export class ResourceBar {
  constructor(game, safe, onTap, list = RESOURCES) {
    this.game = game;
    this.safe = safe;
    this.chips = list.map((d) => new ResourceChip(game, d, onTap));
    this._layout();
  }

  _layout() {
    const s = this.safe;
    const top = s.header.y + s.header.h + 8;
    const h = 92;
    const gap = 16;
    const n = this.chips.length;
    // Fit up to 4 per row; wrap beyond that.
    const perRow = Math.min(n, 4);
    const rows = Math.ceil(n / perRow);
    const w = (s.contentWidth - gap * (perRow - 1)) / perRow;
    this.chips.forEach((c, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      c.setRect(s.contentLeft + col * (w + gap), top + row * (h + gap), w, h);
    });
    this._bandBottom = top + rows * (h + gap);
  }

  /** Bottom Y so the play area can start below the bar. */
  get bottom() { return this._bandBottom; }

  update(dt) { for (const c of this.chips) c.update(dt); }
  render(r) { for (const c of this.chips) c.render(r); }
  onTap(px, py) { for (const c of this.chips) if (c.onTap(px, py)) return true; return false; }
  bounds() { return this.chips.map((c) => new Rect(c.rect.x, c.rect.y, c.rect.w, c.rect.h)); }
}
