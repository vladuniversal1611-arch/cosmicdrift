/**
 * HomeScreen.js  (the composed Home / Main Menu)
 * -----------------------------------------------------------------------------
 * Assembles the nine independent sections — it owns NO drawing of its own beyond
 * orchestration, an entrance animation and an optional debug overlay. Layout is
 * driven entirely by the SafeArea model, so it adapts to 16:9 → 20:9, tablets
 * and (via the same insets) foldables, and never lets content touch the edges.
 *
 * Render order (back → front): background layers, header, resource bar, logo,
 * play button, quick access, bottom nav, notifications, ambient, debug overlay.
 * Input is routed to the interactive sections front-to-back. Every cross-section
 * concern travels on the EventBus; sections never reference each other.
 *
 * Keeps `name: 'menu'` so all existing navigation wiring continues to work.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Rect } from '../../utils/Rect.js';
import { Easing } from '../../utils/Easing.js';
import { SafeArea } from './SafeArea.js';
import { BackgroundLayers } from './layers/BackgroundLayers.js';
import { Header } from './components/Header.js';
import { ResourceBar } from './components/ResourceBar.js';
import { Logo } from './components/Logo.js';
import { PlayButton } from './components/PlayButton.js';
import { QuickAccess } from './components/QuickAccess.js';
import { BottomNav } from './components/BottomNav.js';
import { NotificationLayer } from './NotificationLayer.js';
import { AmbientLayer } from './AmbientLayer.js';

export class HomeScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'menu';
    this._t = 0;
    this._intro = 0;             // entrance progress 0..1 (AnimationManager)
    this._subs = [];
    this._debug = {};

    const safe = new SafeArea(this.bounds.w, this.bounds.h);
    this.safe = safe;

    const tap = () => this._tapFeedback();

    this.bg = new BackgroundLayers(this.bounds.w, this.bounds.h);
    this.header = new Header(game, safe, tap);
    this.resources = new ResourceBar(game, safe, tap);

    // Play area sits below the resource bar and above the nav.
    const navY = safe.nav.y;
    const region = new Rect(safe.contentLeft, this.resources.bottom + 8,
      safe.contentWidth, navY - (this.resources.bottom + 8));
    this._region = region;

    this.logo = new Logo(game, safe).setCenter(safe.centerX, region.y + 270);
    this.play = new PlayButton(game, region, (kind) => this._onPlay(kind));

    // Quick-access grid anchored to the lower half of the play area.
    const quickRegion = new Rect(region.x, region.y + region.h * 0.44, region.w, region.h * 0.56);
    this.quick = new QuickAccess(game, safe, (act, tile) => this._onQuick(act, tile), quickRegion);

    this.nav = new BottomNav(game, safe, () => tap());
    this.notifications = new NotificationLayer(game, safe);
    this.ambient = new AmbientLayer(game, safe);

    // Ordered list for uniform update; input routed separately (front-to-back).
    this._sections = [this.header, this.resources, this.logo, this.play, this.quick, this.nav];
  }

  onEnter() {
    // onEnter can fire again when a modal above us pops — keep it idempotent.
    this._subs.forEach((off) => off());
    this._subs.length = 0;

    // Entrance: fade + rise, driven by the AnimationManager (no bespoke tween).
    this._intro = 0;
    this.game.getSystem('animation')?.to(this, '_intro', 1, 0.5, { ease: Easing.cubicOut });
    this.notifications.attach();   // idempotent (detaches any prior handler)

    this._subs.push(this.events.on('input:down', ({ x, y }) => this._pointer(x, y)));
    this._subs.push(this.events.on('input:move', ({ x, y }) => this._pointer(x, y)));
    this._subs.push(this.events.on('debug:state', (f) => { this._debug = f; }));
    this._subs.push(this.events.on('home:playState', ({ state }) => this.play.setState(state)));

    // Waiting daily reward → bell badge + events badge (once).
    const daily = this.game.getSystem('retention')?.hasUnclaimedDaily?.();
    this.header.notifications = daily ? 1 : 0;
    const ev = this.quick.byId.events; if (ev) ev.badge = daily ? -1 : 0;
    if (daily && !this._welcomed) {
      this._welcomed = true;
      this.events.emit('notify:push', { text: 'Daily reward is ready!', priority: 5, color: '#ff9d2e' });
    }
  }

  onExit() {
    this._subs.forEach((off) => off());
    this._subs.length = 0;
    this.notifications.detach();
  }

  _pointer(x, y) {
    const nx = (x / this.bounds.w) * 2 - 1;
    const ny = (y / this.bounds.h) * 2 - 1;
    this.bg.setPointer(nx, ny);
  }

  _tapFeedback() {
    this.game.getSystem('audio')?.play('button');
    const s = this.game.getSystem('settings');
    if (s?.get?.('haptics') && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }

  _onPlay(kind) {
    if (kind === 'blocked') this.events.emit('notify:push', { text: 'Not available yet', priority: 3 });
    else this._tapFeedback();
  }

  _onQuick(act, tile) {
    this._tapFeedback();
    if (act === 'locked') this.events.emit('notify:push', { text: `${tile.def.label} unlocks soon`, priority: 2 });
  }

  update(dt) {
    this._t += dt;
    this.bg.update(dt);
    for (const s of this._sections) s.update(dt);
    this.notifications.update(dt);
    this.ambient.update(dt);
  }

  render(r) {
    const ctx = r.ctx;
    // Gentle "camera breathing": the whole scene scales almost imperceptibly.
    const breath = 1 + 0.006 * Math.sin(this._t * 0.7);
    const cx = this.bounds.w / 2, cy = this.bounds.h / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(breath, breath); ctx.translate(-cx, -cy);

    this.bg.render(r);

    // Content group with a subtle entrance rise + fade.
    const a = this._intro;
    const dy = (1 - Easing.cubicOut(a)) * 26;
    ctx.save();
    if (a < 1) { ctx.globalAlpha = a; ctx.translate(0, dy); }
    for (const s of this._sections) s.render(r);
    ctx.restore();

    this.notifications.render(r);
    this.ambient.render(r);
    ctx.restore();
    if (this._debug.drawGridOutlines || this._debug.showBounds) this._drawBounds(r);
  }

  _drawBounds(r) {
    const ctx = r.ctx;
    ctx.save(); ctx.strokeStyle = 'rgba(255,0,120,0.8)'; ctx.lineWidth = 2;
    const all = [
      new Rect(this.safe.header.x, this.safe.header.y, this.safe.header.w, this.safe.header.h),
      ...this.resources.bounds(), ...this.quick.bounds(), ...this.nav.bounds(),
      new Rect(this.play.rect.x, this.play.rect.y, this.play.rect.w, this.play.rect.h),
    ];
    for (const b of all) ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.restore();
  }

  // Front-to-back tap routing (interactive sections only).
  onTap(px, py) {
    if (this.nav.onTap(px, py)) return true;
    if (this.header.onTap(px, py)) return true;
    if (this.resources.onTap(px, py)) return true;
    if (this.play.onTap(px, py)) return true;
    if (this.quick.onTap(px, py)) return true;
    return true; // consume taps on the home screen
  }
}
