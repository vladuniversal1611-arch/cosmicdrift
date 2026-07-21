/**
 * FrozenTile — Type 4: Frozen.
 * Encased in ice: blocks placement until it has been cracked by clears nearby
 * (Config.progression.frozenClears times). Each nearby clear cracks it with a
 * shard burst; the final crack shatters the ice and frees the slot.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';
import { Palette } from '../../../config/Palette.js';

const R = Config.board.cellRadius;

export class FrozenTile extends Tile {
  constructor() {
    super();
    this.type = 'frozen';
    this.cracks = 0;
    this.need = Config.progression.frozenClears;
    this.destroyDur = 0.4;
  }

  get blocksPlacement() { return this.cracks < this.need && !this.isDying; }

  reactToClear(ctx) {
    if (this.isDying || !ctx.adjacentCleared(this.cell)) return;
    this.cracks++;
    this.activate();
    this._sound('ice');
    this._burst(Palette.tiles.ice.glow, 8);
    if (this.cracks >= this.need) {                 // shatter → slot freed
      this.destroy();
      this.sys.events.emit('tile:frozenFreed', { cell: this.cell });
    }
  }

  onDestroy() { this._burst(Palette.tiles.ice.fill, 14); }

  renderBelow(renderer, x, y, size) {
    const c = Palette.tiles.ice;
    const a = this.isDying ? 1 - this.dying : this.appear;
    renderer.setAlpha(0.85 * a);
    const g = renderer.linearGradient(x, y, x + size, y + size, [[0, c.fill], [1, c.edge]]);
    renderer.fillRoundRect(x, y, size, size, R, g);
    renderer.setAlpha(1);
  }

  renderAbove(renderer, x, y, size, time) {
    const c = Palette.tiles.ice;
    const a = this.isDying ? 1 - this.dying : 1;
    // Frost sheen sweeping across the ice.
    renderer.setAlpha(0.35 * a + 0.15 * Math.sin(time * 2 + this.idlePhase));
    renderer.fillRoundRect(x + 2, y + 2, size - 4, size * 0.4, R, '#ffffff');
    renderer.setAlpha(1);
    // Crack lines accumulate as it takes hits.
    renderer.setAlpha(0.7 * a);
    renderer.ctx.strokeStyle = c.crack;
    renderer.ctx.lineWidth = 1.5;
    const cx = x + size / 2, cy = y + size / 2;
    for (let i = 0; i < this.cracks; i++) {
      renderer.ctx.beginPath();
      const ang = (i / this.need) * Math.PI * 2 + this.idlePhase;
      renderer.ctx.moveTo(cx, cy);
      renderer.ctx.lineTo(cx + Math.cos(ang) * size * 0.4, cy + Math.sin(ang) * size * 0.4);
      renderer.ctx.stroke();
    }
    renderer.setAlpha(1);
  }
}
