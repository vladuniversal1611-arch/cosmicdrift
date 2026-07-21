/**
 * PortalTile — Type 6: Portal.
 * Portals come in linked pairs. When a placed block lands on a portal, that
 * block is teleported to the partner portal's cell (if free), both portals
 * flashing. This bends shapes across the board without changing the controls.
 */
import { Tile } from '../Tile.js';
import { Palette } from '../../../config/Palette.js';

export class PortalTile extends Tile {
  constructor(variant = 'A') {
    super();
    this.type = 'portal';
    this.variant = variant;                 // 'A' | 'B' — colours the ring
    /** @type {PortalTile|null} linked by TileSystem when the pair is built. */
    this.partner = null;
    this.activateDur = 0.45;
  }

  get _palette() {
    return this.variant === 'A' ? Palette.tiles.portalA : Palette.tiles.portalB;
  }

  /** Redirect a block landing here to the partner portal, if it's free. */
  redirectPlacement(cell, grid) {
    const p = this.partner;
    if (!p || !p.cell) return null;
    const dest = p.cell;
    if (dest.filled || (dest.tile && dest.tile.blocksPlacement && dest.tile !== p)) return null;
    // Teleport! Flash both ends.
    this.activate();
    p.activate();
    this._sound('portal');
    this._burst(this._palette.glow, 10);
    const { x, y } = grid.cellCenter(dest.col, dest.row);
    this.sys.events.emit('fx:burst', { x, y, color: p._palette.glow, count: 10 });
    return dest;
  }

  renderBelow(renderer, x, y, size, time) {
    const c = this._palette;
    const cx = x + size / 2, cy = y + size / 2;
    const spin = time * 1.6 + this.idlePhase;
    const flash = this.isActivating ? 1 - this.activation : 0;
    const rr = size * (0.34 + flash * 0.1);

    renderer.setAlpha(0.9);
    const g = renderer.radialGradient(cx, cy, rr,
      [[0, 'rgba(0,0,0,0.5)'], [0.7, c.ring], [1, 'rgba(0,0,0,0)']]);
    renderer.fillCircle(cx, cy, rr, g);
    renderer.setAlpha(1);

    // Two swirling arcs give the vortex read.
    const ctx = renderer.ctx;
    ctx.strokeStyle = c.glow;
    ctx.lineWidth = 2 + flash * 3;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, rr * 0.7, spin + i * Math.PI, spin + i * Math.PI + Math.PI * 1.2);
      ctx.stroke();
    }
    renderer.withGlow(c.glow, 8, () => renderer.fillCircle(cx, cy, size * 0.06, '#ffffff'));
  }
}
