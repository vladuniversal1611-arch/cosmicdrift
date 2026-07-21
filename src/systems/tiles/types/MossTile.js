/**
 * MossTile — Type 2: Moss.
 * Barren cracked stone that, after a line clears nearby, blooms into lush
 * green nature (permanent) and grants a little Dragon Energy. Blooming plays a
 * pop + particle burst; idle sway keeps the foliage alive.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';
import { Palette } from '../../../config/Palette.js';

const R = Config.board.cellRadius;

export class MossTile extends Tile {
  constructor() {
    super();
    this.type = 'moss';
    this.bloomed = false;
    this.activateDur = 0.6;
  }

  reactToClear(ctx) {
    if (!this.bloomed && ctx.adjacentCleared(this.cell)) this._bloom();
  }

  _bloom() {
    this.bloomed = true;
    this.activate();
    this._burst(Palette.tiles.moss.glow, 16);
    this._energy(5);
    this._sound('moss');
    this.sys.events.emit('moss:bloomed', { cell: this.cell });
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.moss;
    const cx = x + size / 2;
    const sway = Math.sin(time * 1.3 + this.idlePhase);

    if (!this.bloomed) {
      // Dormant: a few dark moss flecks clinging to the stone.
      renderer.setAlpha(0.5);
      for (let i = 0; i < 4; i++) {
        const px = x + size * (0.25 + (i % 2) * 0.4);
        const py = y + size * (0.3 + Math.floor(i / 2) * 0.4);
        renderer.fillCircle(px, py, size * 0.06, c.base);
      }
      renderer.setAlpha(1);
      return;
    }

    // Bloomed: verdant fill with a bloom-pop and glowing leaves.
    const pop = this.isActivating ? 1 + Math.sin(this.activation * Math.PI) * 0.12 : 1;
    const s = size * pop;
    const ox = x + (size - s) / 2;
    const oy = y + (size - s) / 2;
    const grad = renderer.linearGradient(ox, oy, ox, oy + s, [[0, c.leaf], [1, c.base]]);
    renderer.withGlow(c.glow, 8, () => renderer.fillRoundRect(ox, oy, s, s, R, grad));

    renderer.setAlpha(0.85);
    for (let i = 0; i < 3; i++) {
      const lx = cx + (i - 1) * size * 0.22 + sway * size * 0.04;
      const ly = y + size * (0.4 + (i % 2) * 0.18);
      renderer.fillCircle(lx, ly, size * 0.09, c.leaf);
      renderer.fillCircle(lx, ly - size * 0.02, size * 0.05, c.glow);
    }
    renderer.setAlpha(1);
  }
}
