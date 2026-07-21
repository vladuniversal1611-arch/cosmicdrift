/**
 * DragonRuneTile — Type 7: Dragon Rune.
 * A glowing rune that charges Dragon Energy faster: whenever a line clears on
 * or beside it, it flares and pours a bonus into the meter. Purely beneficial
 * — a target the player wants to route clears through.
 */
import { Tile } from '../Tile.js';
import { Palette } from '../../../config/Palette.js';
import { drawRune } from '../../board/Runes.js';

const ENERGY_BONUS = 16;

export class DragonRuneTile extends Tile {
  constructor() {
    super();
    this.type = 'dragonrune';
    this.runeId = 4;                        // the trident glyph reads as dragon-y
    this.activateDur = 0.6;
  }

  reactToClear(ctx) {
    if (ctx.cleared.has(this.cell) || ctx.adjacentCleared(this.cell)) {
      this.activate();
      this._energy(ENERGY_BONUS);
      this._burst(Palette.tiles.dragon.glow, 12);
      this._sound('dragonrune');
    }
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.dragon;
    const cx = x + size / 2, cy = y + size / 2;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + this.idlePhase);
    const flare = this.isActivating ? Math.sin(this.activation * Math.PI) : 0;

    renderer.setAlpha(0.25 + 0.3 * pulse + flare * 0.4);
    const g = renderer.radialGradient(cx, cy, size * 0.5,
      [[0, c.glow], [1, 'rgba(255,176,32,0)']]);
    renderer.fillCircle(cx, cy, size * 0.5, g);
    renderer.setAlpha(1);

    const ctx = renderer.ctx;
    ctx.strokeStyle = c.rune;
    ctx.lineWidth = size * 0.05 * (1 + flare);
    renderer.withGlow(c.glow, 8 + flare * 14, () => {
      drawRune(ctx, this.runeId, cx, cy, size * (0.62 + flare * 0.12));
    });
  }
}
