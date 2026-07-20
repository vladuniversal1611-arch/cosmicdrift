/**
 * UISystem.js
 * -----------------------------------------------------------------------------
 * Owns the screen stack and routes input to it. Screens are pushed/popped so
 * overlays (settings, shop, pause) compose naturally over the base screen.
 *
 * The UISystem renders last (registered last in Game) so UI always sits on top
 * of gameplay and particles. It subscribes to 'input:tap' and forwards taps to
 * the topmost screen, which walks its widget tree.
 *
 * Foundation scope: the stack, routing, update/render plumbing, and a starting
 * BootScreen. Concrete gameplay screens are added as features land.
 *
 * Events:
 *   listens 'input:tap'
 *   emits   'ui:screenChanged' ({ name })
 * -----------------------------------------------------------------------------
 */
import { System } from '../core/System.js';
import { BootScreen } from './screens/BootScreen.js';

export class UISystem extends System {
  constructor(game) {
    super(game);
    this.name = 'ui';
    /** @type {import('./Screen.js').Screen[]} */
    this._stack = [];
  }

  onInit() {
    this.listen('input:tap', ({ x, y }) => this._routeTap(x, y));
    // Start on the boot/title screen.
    this.push(new BootScreen(this.game));
  }

  /** The screen currently receiving input and drawn on top. */
  get top() { return this._stack[this._stack.length - 1] ?? null; }

  /** Push a new screen onto the stack. */
  push(screen) {
    this.top?.onExit();
    this._stack.push(screen);
    screen.onEnter();
    this.events.emit('ui:screenChanged', { name: screen.name });
  }

  /** Pop the top screen, returning to the one beneath. */
  pop() {
    const screen = this._stack.pop();
    screen?.onExit();
    this.top?.onEnter();
    this.events.emit('ui:screenChanged', { name: this.top?.name });
    return screen;
  }

  /** Replace the whole stack with a single screen. */
  replace(screen) {
    while (this._stack.length) this._stack.pop()?.onExit();
    this.push(screen);
  }

  _routeTap(x, y) {
    // Only the topmost screen handles input (modal semantics).
    this.top?.handleTap(x, y);
  }

  update(dt) {
    this.top?.update(dt);
  }

  render(renderer) {
    // Render the full stack so screens beneath an overlay remain visible.
    for (const screen of this._stack) screen.render(renderer);
  }
}
