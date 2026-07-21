/**
 * TreasureTile — Type 8: Treasure.
 * Spawns randomly and survives only a few turns (a shrinking countdown ring).
 * Place a crystal on it and clear its line before it vanishes to collect
 * Stardust + Dragon Energy in a golden burst. Miss it and it fades away.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';
import { Palette } from '../../../config/Palette.js';

export class TreasureTile extends Tile {
  constructor() {
    super();
    this.type = 'treasure';
    this.life = Config.progression.treasureLifetimeTurns;
    this.maxLife = this.life;
    this.appearDur = 0.5;
    this.destroyDur = 0.5;
  }

  onTurn() {
    if (this.isDying) return;
    if (--this.life <= 0) {
      // Timed out — fade away with no reward.
      this._sound('treasuremiss');
      this._burst(Palette.tiles.treasure.deep, 6);
      this.destroy();
      this.sys.events.emit('treasure:missed', { cell: this.cell });
    }
  }

  reactToClear(ctx) {
    if (this.isDying || !ctx.cleared.has(this.cell)) return;
    // Collected!
    this._reward('stardust', 120);
    this._energy(20);
    this._burst(Palette.tiles.treasure.glow, 22);
    this._shake(6);
    this._sound('treasure');
    this.destroy();
    this.sys.events.emit('treasure:collected', { cell: this.cell });
  }

  renderBelow(renderer, x, y, size, time) {
    const c = Palette.tiles.treasure;
    const cx = x + size / 2, cy = y + size / 2;
    const a = this.isDying ? 1 - this.dying : this.appear;
    const bob = Math.sin(time * 3 + this.idlePhase) * size * 0.03;
    const s = size * 0.4;

    renderer.setAlpha(a);
    renderer.withGlow(c.glow, 12, () => {
      const g = renderer.linearGradient(cx - s, cy - s + bob, cx + s, cy + s + bob,
        [[0, c.glow], [0.5, c.gold], [1, c.deep]]);
      renderer.fillRoundRect(cx - s, cy - s + bob, s * 2, s * 2, size * 0.14, g);
    });
    renderer.sparkle(cx - s * 0.4, cy - s * 0.4 + bob, s * 0.4, '#ffffff');

    // Countdown ring — shrinks as the treasure's time runs out.
    const frac = Math.max(0, this.life / this.maxLife);
    const ctx = renderer.ctx;
    ctx.strokeStyle = frac > 0.34 ? c.gold : Palette.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    renderer.setAlpha(1);
  }
}
