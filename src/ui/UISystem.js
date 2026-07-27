/**
 * UISystem.js
 * -----------------------------------------------------------------------------
 * Owns the screen stack and routes input to it. Screens push/pop so overlays
 * (shop, settings, pause, level-complete) compose over the base screen. Renders
 * last (registered last) so UI sits above gameplay.
 *
 * Navigation is entirely event-driven: screens emit `ui:*` intents and this
 * system maps them to push/pop/replace. The app opens on the premium HomeScreen
 * and swaps to the HUD when a run begins.
 *
 * Events (in): input:tap, game:started, ui:playPressed(→handled by gameplay),
 *   ui:openWorldMap|Shop|Settings|Collection|Events|Pause, ui:back,
 *   ui:closeWorldMap, ui:mainMenu, reward:granted, level:complete
 * Events (out): ui:screenChanged, game:toMenu
 * -----------------------------------------------------------------------------
 */
import { System } from '../core/System.js';
import { HomeScreen } from './home/HomeScreen.js';
import { HudScreen } from './screens/HudScreen.js';
import { WorldMapScreen } from './screens/WorldMapScreen.js';
import { ShopScreen } from './screens/ShopScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { CollectionScreen } from './screens/CollectionScreen.js';
import { EventsScreen } from './screens/EventsScreen.js';
import { PauseScreen } from './screens/PauseScreen.js';
import { LevelCompleteScreen } from './screens/LevelCompleteScreen.js';
import { DailyHubScreen } from './screens/DailyHubScreen.js';
import { RewardScreen } from './screens/RewardScreen.js';

export class UISystem extends System {
  constructor(game) {
    super(game);
    this.name = 'ui';
    /** @type {import('./Screen.js').Screen[]} */
    this._stack = [];
    this._lastReward = {};
  }

  onInit() {
    this.listen('input:tap', ({ x, y }) => this._routeTap(x, y));
    this.listen('game:started', () => this.replace(new HudScreen(this.game)));

    // Modal navigation (only push if not already the top screen).
    const open = (name, factory) => { if (this.top?.name !== name) this.push(factory()); };
    this.listen('ui:openWorldMap', () => open('worldmap', () => new WorldMapScreen(this.game)));
    this.listen('ui:openShop', () => open('shop', () => new ShopScreen(this.game)));
    this.listen('ui:openSettings', () => open('settings', () => new SettingsScreen(this.game)));
    this.listen('ui:openCollection', () => open('collection', () => new CollectionScreen(this.game)));
    this.listen('ui:openEvents', () => open('events', () => new EventsScreen(this.game)));
    this.listen('ui:openPause', () => open('pause', () => new PauseScreen(this.game)));
    this.listen('ui:openDaily', () => open('daily', () => new DailyHubScreen(this.game)));

    this.listen('ui:back', () => this.pop());
    this.listen('ui:closeWorldMap', () => { if (this.top?.name === 'worldmap') this.pop(); });
    this.listen('ui:mainMenu', () => { this.events.emit('game:toMenu'); this.replace(new HomeScreen(this.game)); });

    // Generic push/pop so the PopupManager can drive its pooled PopupScreen
    // without UISystem knowing about each popup type.
    this.listen('ui:pushScreen', ({ screen }) => { if (screen && this.top !== screen) this.push(screen); });
    this.listen('ui:popScreen', () => this.pop());

    // Retention: celebrate a claimed reward, and auto-open the daily hub once
    // per boot when free rewards are waiting (a welcome, never a nag).
    this.listen('ui:showReward', (rw) => this.push(new RewardScreen(this.game, rw, { done: 'ui:back' })));
    this.listen('ui:reveal-next', () => this._advanceReveal());
    this.listen('retention:dailyAvailable', () => { if (this.top?.name === 'menu') this.events.emit('ui:openDaily'); });

    // Level-complete celebration: capture the granted reward, then present it.
    this.listen('reward:granted', (rw) => { this._lastReward = rw; });
    this.listen('level:complete', () => this.push(new LevelCompleteScreen(this.game, this._lastReward)));

    // Boot into the premium home screen.
    this.push(new HomeScreen(this.game));
  }

  get top() { return this._stack[this._stack.length - 1] ?? null; }

  /**
   * Drive the post-level celebration chain: close the current celebration and,
   * if the RetentionSystem has another reveal queued (a rare surprise or a
   * 10-level unlock), present it too. When the queue empties we simply land back
   * on the HUD.
   */
  _advanceReveal() {
    this.pop();
    const reveal = this.game.getSystem('retention')?.consumeReveal();
    if (reveal) this.push(new RewardScreen(this.game, reveal, { done: 'ui:reveal-next' }));
  }

  push(screen) {
    this.top?.onExit();
    this._stack.push(screen);
    screen.onEnter();
    this.events.emit('ui:screenChanged', { name: screen.name });
  }

  pop() {
    const screen = this._stack.pop();
    screen?.onExit();
    this.top?.onEnter();
    this.events.emit('ui:screenChanged', { name: this.top?.name });
    return screen;
  }

  replace(screen) {
    while (this._stack.length) this._stack.pop()?.onExit();
    this.push(screen);
  }

  _routeTap(x, y) { this.top?.handleTap(x, y); }

  update(dt) { this.top?.update(dt); }

  render(renderer) {
    for (const screen of this._stack) screen.render(renderer);
  }
}
