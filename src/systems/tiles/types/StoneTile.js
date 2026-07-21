/**
 * StoneTile — Type 1: Ancient Stone.
 * The plain, normal tile. Most slots are implicit stone (cell.tile === null);
 * this explicit class exists for completeness and for layouts that want a
 * carved-stone accent with a faint idle glimmer. No behaviour.
 */
import { Tile } from '../Tile.js';
import { Config } from '../../../config/Config.js';

export class StoneTile extends Tile {
  constructor() { super(); this.type = 'stone'; }

  renderBelow(renderer, x, y, size, time) {
    // A subtle carved seam that catches the light — pure ambience.
    const a = 0.05 + 0.03 * Math.sin(time * 0.7 + this.idlePhase);
    renderer.setAlpha(a);
    renderer.strokeRoundRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6,
      Config.board.cellRadius * 0.5, '#ffffff', 1);
    renderer.setAlpha(1);
  }
}
