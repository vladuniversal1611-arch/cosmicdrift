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
import { Easing } from '../utils/Easing.js';
import { HomeScreen } from './home/HomeScreen.js';
import { HudScreen } from './screens/HudScreen.js';
import { WorldMapScreen } from './worldmap/WorldMapScreen.js';
import { IslandScreen } from './screens/IslandScreen.js';
import { DragonScreen } from './screens/DragonScreen.js';
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
    // Cinematic transitions: the screen sliding/fading in, and (for pops) the
    // screen fading out over the one it revealed. Every navigation animates so
    // the game never hard-cuts between screens.
    this._incoming = null; // { screen, t }
    this._outgoing = null; // { screen, t }
  }

  onInit() {
    this.listen('input:tap', ({ x, y }) => this._routeTap(x, y));
    this.listen('game:started', () => this.replace(new HudScreen(this.game)));

    // Modal navigation (only push if not already the top screen).
    const open = (name, factory) => { if (this.top?.name !== name) this.push(factory()); };
    this.listen('ui:openWorldMap', () => open('worldmap', () => new WorldMapScreen(this.game)));
    this.listen('ui:openIsland', () => open('island', () => new IslandScreen(this.game)));
    this.listen('ui:closeIsland', () => { if (this.top?.name === 'island') this.pop(); });
    this.listen('ui:openDragons', () => open('dragons', () => new DragonScreen(this.game)));
    this.listen('ui:closeDragons', () => { if (this.top?.name === 'dragons') this.pop(); });
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
    // The app always opens on the Home screen — never auto-popping the Daily
    // Rewards panel. Daily rewards stay one tap away (Home shows an attention
    // badge when something is unclaimed), so entering the game is calm and the
    // player is in control.
    this.listen('retention:dailyAvailable', () => { /* badge only; no auto-open */ });

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
    this._incoming = { screen, t: 0 };
    this.events.emit('ui:screenChanged', { name: screen.name });
  }

  pop() {
    const screen = this._stack.pop();
    screen?.onExit();
    this.top?.onEnter();
    // Animate the removed screen out on top of the one it revealed.
    if (screen) this._outgoing = { screen, t: 0 };
    if (this._incoming?.screen === screen) this._incoming = null;
    this.events.emit('ui:screenChanged', { name: this.top?.name });
    return screen;
  }

  replace(screen) {
    // Cross-fade: keep the old base fading out beneath the new one fading in.
    const old = this.top;
    while (this._stack.length) this._stack.pop()?.onExit();
    if (old) this._outgoing = { screen: old, t: 0 };
    this._stack.push(screen);
    screen.onEnter();
    this._incoming = { screen, t: 0 };
    this.events.emit('ui:screenChanged', { name: screen.name });
  }

  /** Taps are swallowed while a screen is still settling, so a stray press
   *  never lands on a control that is mid-slide. */
  _routeTap(x, y) {
    if (this._incoming && this._incoming.t < UISystem.TRANSITION * 0.6) return;
    this.top?.handleTap(x, y);
  }

  update(dt) {
    this.top?.update(dt);
    const D = UISystem.TRANSITION;
    if (this._incoming && (this._incoming.t += dt) >= D) this._incoming = null;
    if (this._outgoing) {
      this._outgoing.screen.update(dt);      // keep its ambient motion alive
      if ((this._outgoing.t += dt) >= D) this._outgoing = null;
    }
  }

  render(renderer) {
    const inc = this._incoming;
    for (const screen of this._stack) {
      if (inc && screen === inc.screen) this._composite(renderer, screen, inc.t / UISystem.TRANSITION, 'in');
      else screen.render(renderer);
    }
    if (this._outgoing) this._composite(renderer, this._outgoing.screen, this._outgoing.t / UISystem.TRANSITION, 'out');
  }

  /**
   * Render `screen` with a premium fade+scale transform. Incoming screens ease
   * up from 96% with a gentle rise; outgoing screens settle back and fade. The
   * eased curve (never linear) is the same motion language the HUD/menus use.
   */
  _composite(renderer, screen, p, dir) {
    const e = Easing.smooth(Math.min(1, Math.max(0, p)));
    const inbound = dir === 'in';
    const alpha = inbound ? e : 1 - e;
    const scale = inbound ? 0.965 + 0.035 * e : 1 - 0.03 * e;
    const ty = inbound ? (1 - e) * 34 : -8 * e;
    const cx = this.game.canvas.width / 2;
    const cy = this.game.canvas.height / 2;
    renderer.save();
    renderer.pushAlpha(alpha);
    renderer.translate(cx, cy);
    renderer.scale(scale, scale);
    renderer.translate(-cx, -cy + ty);
    screen.render(renderer);
    renderer.popAlpha();
    renderer.restore();
  }
}

/** Screen-transition duration, seconds — one shared timing for all navigation. */
UISystem.TRANSITION = 0.3;
