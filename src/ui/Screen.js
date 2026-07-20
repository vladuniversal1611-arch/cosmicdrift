/**
 * Screen.js
 * -----------------------------------------------------------------------------
 * Base class for a full-screen UI state (menu, gameplay HUD, shop, settings).
 * A Screen is a root Widget with lifecycle hooks and access to the game so it
 * can build its widget tree from live systems. The UISystem maintains a stack
 * of screens, enabling overlays (e.g. a settings sheet over the HUD).
 * -----------------------------------------------------------------------------
 */
import { Widget } from './Widget.js';

export class Screen extends Widget {
  /**
   * @param {import('../core/Game.js').Game} game
   */
  constructor(game) {
    // A screen fills the whole logical canvas.
    super(0, 0, game.canvas.width, game.canvas.height);
    this.game = game;
    this.name = 'screen';
  }

  get events() { return this.game.events; }

  /** Called when the screen becomes the active/top screen. */
  onEnter() {}
  /** Called when the screen is removed or covered. */
  onExit() {}
  /** Per-frame update for animated widgets (e.g. progress bars). */
  update(/* dt */) {}
}
