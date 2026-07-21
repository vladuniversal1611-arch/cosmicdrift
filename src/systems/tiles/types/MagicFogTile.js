/**
 * MagicFogTile — Type 10: Magic Fog.
 * A drifting cloud that hides its slot (blocks placement) until a line clears
 * nearby, at which point it dissipates and reveals the cell. Placed in small
 * banks so a corner of the board starts shrouded and is peeled open by play.
 */
import { Tile } from '../Tile.js';
import { Palette } from '../../../config/Palette.js';

export class MagicFogTile extends Tile {
  constructor() {
    super();
    this.type = 'fog';
    this.destroyDur = 0.55;
  }

  get blocksPlacement() { return !this.isDying; }

  reactToClear(ctx) {
    if (!this.isDying && ctx.adjacentCleared(this.cell)) {
      this.destroy();
      this._sound('fog');
      this._burst(Palette.tiles.fog.a, 8);
    }
  }

  // Fog sits ABOVE everything so it truly conceals the slot.
  renderAbove(renderer, x, y, size, time) {
    const c = Palette.tiles.fog;
    const a = this.isDying ? 1 - this.dying : this.appear;
    const cx = x + size / 2, cy = y + size / 2;
    renderer.setAlpha(a);
    // Layered drifting puffs.
    for (let i = 0; i < 4; i++) {
      const ph = this.idlePhase + i * 1.7;
      const dx = Math.sin(time * 0.6 + ph) * size * 0.14;
      const dy = Math.cos(time * 0.5 + ph) * size * 0.1;
      const rr = size * (0.3 + 0.08 * Math.sin(time + ph));
      renderer.setAlpha(a * 0.5);
      renderer.fillCircle(cx + dx + (i - 1.5) * size * 0.14, cy + dy, rr, i % 2 ? c.a : c.b);
    }
    renderer.setAlpha(1);
  }
}
