/**
 * AncientTreeTile — Type 9: Ancient Tree.
 * Indestructible directly (blocks its slot). It can only be freed by clearing
 * lines on all four sides — each cleared neighbour lights up a side. Once fully
 * surrounded it bursts into bloom and grants a Crystal + big energy reward.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';
import { Palette } from '../../../config/Palette.js';

const R = Config.board.cellRadius;

export class AncientTreeTile extends Tile {
  constructor() {
    super();
    this.type = 'ancienttree';
    this.sides = { up: false, down: false, left: false, right: false };
    this.destroyDur = 0.7;
    this.activateDur = 0.5;
  }

  get blocksPlacement() { return !this.isDying; }

  reactToClear(ctx) {
    if (this.isDying) return;
    const { col, row } = this.cell;
    let changed = false;
    const mark = (dir, c, r) => {
      if (!this.sides[dir] && ctx.cleared.has(ctx.grid.get(c, r))) {
        this.sides[dir] = true; changed = true;
      }
    };
    mark('up', col, row - 1);
    mark('down', col, row + 1);
    mark('left', col - 1, row);
    mark('right', col + 1, row);

    if (changed) { this.activate(); this._burst(Palette.tiles.tree.glow, 8); }
    if (this.sides.up && this.sides.down && this.sides.left && this.sides.right) this._free();
  }

  _free() {
    this._reward('crystal', 1);
    this._energy(30);
    this._burst(Palette.tiles.tree.glow, 28);
    this._shake(10);
    this._sound('tree');
    this.destroy();
    this.sys.events.emit('tree:freed', { cell: this.cell });
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.tree;
    const cx = x + size / 2;
    const a = this.isDying ? 1 - this.dying : this.appear;
    const sway = Math.sin(time * 1.1 + this.idlePhase) * size * 0.03;

    renderer.setAlpha(a);
    // Trunk.
    renderer.fillRoundRect(cx - size * 0.09, y + size * 0.45, size * 0.18, size * 0.4, 3, c.trunk);
    // Canopy — three glowing clumps.
    renderer.withGlow(c.glow, 8, () => {
      renderer.fillCircle(cx + sway, y + size * 0.36, size * 0.26, c.leaf);
      renderer.fillCircle(cx - size * 0.18 + sway, y + size * 0.46, size * 0.18, c.leaf);
      renderer.fillCircle(cx + size * 0.18 + sway, y + size * 0.46, size * 0.18, c.leaf);
    });

    // Side markers showing surround progress.
    const dot = (on, dx, dy) => {
      renderer.setAlpha(on ? 0.95 : 0.2);
      renderer.fillCircle(cx + dx, y + size / 2 + dy, size * 0.05, on ? c.glow : '#ffffff');
    };
    dot(this.sides.up, 0, -size * 0.42);
    dot(this.sides.down, 0, size * 0.42);
    dot(this.sides.left, -size * 0.42, 0);
    dot(this.sides.right, size * 0.42, 0);
    renderer.setAlpha(1);
  }
}
