/**
 * CorruptedTile — Type 5: Corrupted.
 * Blocks its slot and, every few turns, spreads corruption to a neighbouring
 * empty cell. Purged when a line clears adjacent to it (dissolve + burst). If
 * ignored it slowly consumes the board — a soft time pressure.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';
import { Palette } from '../../../config/Palette.js';

const R = Config.board.cellRadius;

export class CorruptedTile extends Tile {
  constructor() {
    super();
    this.type = 'corrupted';
    this.spreadIn = Config.progression.corruptionSpreadTurns;
    this.destroyDur = 0.45;
  }

  get blocksPlacement() { return !this.isDying; }

  onTurn(ctx) {
    if (this.isDying) return;
    if (--this.spreadIn > 0) return;
    this.spreadIn = Config.progression.corruptionSpreadTurns;
    // Spread to a random free orthogonal neighbour.
    const targets = ctx.emptyNeighbours(this.cell);
    if (targets.length) {
      const dest = targets[(Math.random() * targets.length) | 0];
      this.sys.spawnTile(dest, 'corrupted');
      this.activate();
      this._sound('corrupt', { rate: 0.8 });
    }
  }

  reactToClear(ctx) {
    if (!this.isDying && ctx.adjacentCleared(this.cell)) {
      this.destroy();
      this._sound('corrupt');
      this._burst(Palette.tiles.corruption.glow, 16);
      this.sys.events.emit('tile:corruptionDestroyed', { cell: this.cell });
    }
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.corruption;
    const a = this.isDying ? 1 - this.dying : this.appear;
    const writhe = 0.5 + 0.5 * Math.sin(time * 2.4 + this.idlePhase);
    const cx = x + size / 2, cy = y + size / 2;
    renderer.setAlpha(0.9 * a);
    const g = renderer.radialGradient(cx, cy, size * 0.6,
      [[0, c.ooze], [1, c.core]]);
    renderer.fillRoundRect(x, y, size, size, R, g);
    renderer.setAlpha(0.55 * a);
    renderer.withGlow(c.glow, 8, () => {
      renderer.fillCircle(cx, cy, size * (0.16 + 0.06 * writhe), c.glow);
    });
    // Twitching tendrils.
    renderer.ctx.strokeStyle = c.glow;
    renderer.ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + time * 0.8 + this.idlePhase;
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(cx, cy);
      renderer.ctx.lineTo(cx + Math.cos(ang) * size * 0.3 * writhe,
        cy + Math.sin(ang) * size * 0.3 * writhe);
      renderer.ctx.stroke();
    }
    renderer.setAlpha(1);
  }
}
