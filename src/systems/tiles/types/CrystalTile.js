/**
 * CrystalTile — Type 3: Crystal.
 * Stores magical energy in its socket. When a line clears through it, it fires
 * energy in all four directions, clearing every crystal along its row and
 * column (via TileSystem.igniteCrossFrom). Big flash, beams, shake and burst.
 */
import { Tile } from '../Tile.js';
import { Palette } from '../../../config/Palette.js';

export class CrystalTile extends Tile {
  constructor() {
    super();
    this.type = 'crystal';
    this.activateDur = 0.5;
  }

  reactToClear(ctx) {
    if (ctx.cleared.has(this.cell)) this._fire();
  }

  _fire() {
    this.activate();
    this._sound('crystalfire');
    this._shake(9);
    this._burst(Palette.tiles.crystalCore.glow, 20);
    this.sys.igniteCrossFrom(this.cell);
    this.sys.events.emit('tile:crystal', { cell: this.cell });
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.crystalCore;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + this.idlePhase);
    const r = size * (0.26 + 0.05 * pulse);
    // Glowing stored-energy core.
    const g = renderer.radialGradient(cx, cy, r * 1.6,
      [[0, '#ffffff'], [0.4, c.glow], [1, 'rgba(124,92,255,0)']]);
    renderer.setAlpha(0.9);
    renderer.fillCircle(cx, cy, r * 1.6, g);
    renderer.setAlpha(1);
    renderer.withGlow(c.glow, 10, () => renderer.fillCircle(cx, cy, r * 0.6, c.core));
    renderer.sparkle(cx, cy, r * 0.9 * pulse, '#ffffff');
  }

  renderAbove(renderer, x, y, size, time) {
    if (!this.isActivating) return;
    // Four expanding energy beams shooting out along the axes.
    const cx = x + size / 2;
    const cy = y + size / 2;
    const a = this.activation;              // 0..1
    const reach = size * (1 + a * 8);
    const thick = size * 0.5 * (1 - a);
    renderer.setAlpha((1 - a) * 0.9);
    renderer.withGlow('#ffffff', 16, () => {
      renderer.fillRect(cx - thick / 2, cy - reach, thick, reach, Palette.tiles.crystalCore.glow);
      renderer.fillRect(cx - thick / 2, cy, thick, reach, Palette.tiles.crystalCore.glow);
      renderer.fillRect(cx - reach, cy - thick / 2, reach, thick, Palette.tiles.crystalCore.glow);
      renderer.fillRect(cx, cy - thick / 2, reach, thick, Palette.tiles.crystalCore.glow);
    });
    renderer.setAlpha(1);
  }
}
