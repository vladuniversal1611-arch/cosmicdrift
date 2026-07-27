/**
 * WorldMapScreen.js  (premium level-select world)
 * -----------------------------------------------------------------------------
 * Composes the living world map: a parallax sky, a vertical stack of themed
 * floating islands connected by bridges, level nodes in all their states,
 * reward objects, and reactive critters — under a fixed HUD. It owns the camera
 * (drag + momentum + open-zoom + auto-focus), routes taps, persists camera and
 * opened rewards, and plays a celebration when a new island has been unlocked.
 *
 * All geometry comes from WorldMapModel (built once); renderers are pooled and
 * cull to the viewport, so it holds 60 FPS. Talks only through events/systems.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { MAP, islandTheme } from '../../config/Worlds.js';
import { Motion } from '../home/Motion.js';
import { UI, UITheme } from '../theme/UITheme.js';
import { WorldMapModel } from './WorldMapModel.js';
import { WorldMapCamera } from './WorldMapCamera.js';
import { WorldMapParallax } from './WorldMapParallax.js';
import { WorldMapIsland } from './WorldMapIsland.js';
import { WorldMapPath } from './WorldMapPath.js';
import { WorldMapNode } from './WorldMapNode.js';
import { WorldMapHud } from './WorldMapHud.js';

export class WorldMapScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'worldmap';
    this._t = 0;
    this._subs = [];
    this._msg = null;

    this.model = new WorldMapModel(this.bounds.w);
    this.camera = new WorldMapCamera(this.bounds.h);
    this.camera.setBounds(this.model.contentH);
    this.parallax = new WorldMapParallax(this.bounds.w, this.bounds.h);
    this.islandArt = new WorldMapIsland();
    this.pathArt = new WorldMapPath();
    this.nodeArt = new WorldMapNode();
    this.hud = new WorldMapHud(game, this.bounds.w, this.bounds.h);

    this._critters = this._makeCritters();
    this._confetti = [];
    this._save = null;
  }

  get _level() { return this.game.getSystem('level')?.level ?? 1; }
  get _highest() { return this.game.getSystem('level')?.highest ?? 1; }
  _islandOf(n) { return Math.floor((n - 1) / MAP.levelsPerIsland); }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this._save = this.game.getSystem('save')?.registerSlice('worldmap', () => ({ scroll: 0, opened: {}, seenIsland: 0 }));

    const cur = this.model.currentNode(this._level);
    this.camera.openZoom(1.16, 0.6);
    this.camera.focus(cur.y, true);
    // Restore saved scroll only if the player hasn't just advanced islands.
    this.game.getSystem('audio')?.play('button');

    // Celebrate a freshly-unlocked island.
    const island = this._islandOf(this._highest);
    if (this._save && island > (this._save.seenIsland ?? 0)) {
      this._save.seenIsland = island;
      this.game.getSystem('save')?.markDirty();
      this._celebrate(cur);
    }

    this._subs.push(this.events.on('input:down', ({ y }) => this.camera.down(y)));
    this._subs.push(this.events.on('input:move', ({ y }) => this.camera.move(y)));
    this._subs.push(this.events.on('input:up', () => this.camera.up()));
  }

  onExit() {
    this.events.emit('ui:modalClose');
    if (this._save) { this._save.scroll = this.camera.scroll; this.game.getSystem('save')?.markDirty(); }
    this._subs.forEach((off) => off()); this._subs.length = 0;
  }

  // --- Interactive critters (pooled) ----------------------------------------
  _makeCritters() {
    const out = [];
    for (const isl of this.model.islands) {
      // A couple of butterflies + a bird per island, in world space.
      out.push({ type: 'bird', ix: isl.index, x: isl.cx + isl.rx * 0.3, y: isl.cy - isl.ry * 0.6, ph: isl.index, flee: 0, home: { x: isl.cx + isl.rx * 0.3, y: isl.cy - isl.ry * 0.6 } });
      for (let k = 0; k < 2; k++) out.push({ type: 'butterfly', ix: isl.index, x: isl.cx - isl.rx * 0.4 + k * 40, y: isl.cy - isl.ry * 0.3, ph: isl.index + k, col: ['#ff9ec4', '#a48bff', '#ffd34e'][k % 3] });
    }
    return out;
  }

  _celebrate(node) {
    this.game.getSystem('audio')?.play('levelup');
    const x = node.x, y = this.bounds.h * 0.4;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 320;
      this._confetti.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, t: 0, life: 1.2 + Math.random() * 0.8, col: ['#ff6b8a', '#ffd24a', '#5fb9f0', '#7ed957', '#b79cff'][i % 5], s: 5 + Math.random() * 6 });
    }
    this._msg = { text: `${islandTheme(this._islandOf(this._highest)).name} unlocked!`, t: 2.6 };
  }

  update(dt) {
    this._t += dt;
    this.camera.update(dt);
    this.parallax.update(dt);
    this.islandArt.update(dt); this.pathArt.update(dt); this.nodeArt.update(dt);
    this.hud.update(dt);

    // World name + progress from the viewport centre.
    const centerY = this.camera.scroll + this.bounds.h * 0.5;
    let vi = 0; for (const isl of this.model.islands) if (centerY >= isl.top - 100) vi = isl.index;
    this.hud.worldName = islandTheme(vi).name;
    this.hud.progress = (this._highest - 1) / MAP.totalLevels * 100;
    this.hud.setBadge('events', this.game.getSystem('retention')?.hasUnclaimedDaily?.() ? -1 : 0);
    this.parallax.setSky(islandTheme(vi).sky);

    for (const c of this._critters) this._updateCritter(c, dt);
    for (let i = this._confetti.length - 1; i >= 0; i--) {
      const p = this._confetti[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt;
      if (p.t > p.life) this._confetti.splice(i, 1);
    }
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;
  }

  _updateCritter(c, dt) {
    if (c.type === 'bird') {
      if (c.flee > 0) { c.flee -= dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.flee <= 0) { c.x = c.home.x; c.y = c.home.y - 200; } }
      else { c.y += (c.home.y - c.y) * Math.min(1, dt * 2); c.x = c.home.x + Motion.slide(this._t, 20, 3, c.ph); }
    } else {
      c.x = c.home ? c.x : c.x; c.x += Motion.slide(this._t, 8, 2.4, c.ph) * dt; c.y += Motion.float(this._t, 6, 2, c.ph) * dt;
    }
  }

  // --- Render ----------------------------------------------------------------
  render(r) {
    this.parallax.render(r);

    const ctx = r.ctx;
    ctx.save();
    // Camera zoom about the screen centre.
    if (this.camera.zoom !== 1) { const cx = this.bounds.w / 2, cy = this.bounds.h / 2; ctx.translate(cx, cy); ctx.scale(this.camera.zoom, this.camera.zoom); ctx.translate(-cx, -cy); }
    const s = this.camera.scroll;

    // Islands (platform + decor), culled.
    for (const isl of this.model.islands) {
      const sy = isl.cy - s;
      if (sy < -isl.ry * 3 || sy - isl.ry > this.bounds.h + isl.ry * 3) continue;
      this.islandArt.platform(r, isl, sy);
      for (const d of isl.decor) this.islandArt.decor(r, d, d.y - s);
    }
    // Paths / bridges.
    for (const seg of this.model.segments) {
      const ay = seg.a.y - s, by = seg.b.y - s;
      if (Math.max(ay, by) < -60 || Math.min(ay, by) > this.bounds.h + 60) continue;
      this.pathArt.draw(r, seg, seg.a.x, ay, seg.b.x, by, seg.fromN < this._level);
    }
    // Reward objects.
    for (const rw of this.model.rewards) this._drawReward(r, rw, rw.y - s);
    // Critters behind nodes.
    for (const c of this._critters) if (c.type === 'butterfly') this._drawCritter(r, c, s);
    // Nodes.
    for (const nd of this.model.nodes) {
      const ny = nd.y - s;
      if (ny < -140 || ny > this.bounds.h + 140) continue;
      this.nodeArt.draw(r, nd, nd.x, ny, this._state(nd));
    }
    for (const c of this._critters) if (c.type === 'bird') this._drawCritter(r, c, s);
    ctx.restore();

    // Confetti (screen space).
    for (const p of this._confetti) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.ctx.fillStyle = p.col; r.ctx.fillRect(p.x, p.y, p.s, p.s * 1.4); }
    r.setAlpha(1);

    this.hud.render(r);
    if (this._msg) this._drawMsg(r);
  }

  _state(nd) {
    const cur = this._level, hi = this._highest;
    if (nd.n > hi) return 'locked';
    if (nd.n === cur) return 'current';
    if (nd.n < cur) return nd.stars === 3 ? 'perfect' : 'completed';
    return 'unlocked';
  }

  _drawReward(r, rw, y) {
    if (y < -80 || y > this.bounds.h + 80) return;
    const opened = this._save?.opened?.[rw.id];
    const bob = Motion.float(this._t, 6, 3, rw.island);
    const yy = y + bob;
    // Small floating pedestal.
    r.setAlpha(0.4); r.fillCircle(rw.x, yy + 34, 30, '#0a2a1a'); r.setAlpha(1);
    if (!opened) r.withGlow(UI.gold.mid, 14, () => r.fillCircle(rw.x, yy, 8, UI.gold.light));
    const s = 26, ctx = r.ctx;
    const label = { dailychest: 'DAILY', coinchest: 'COINS', gemchest: 'GEMS', dragonegg: 'EGG', luckywheel: 'WHEEL' }[rw.kind] || 'GIFT';
    // Icon.
    if (rw.kind === 'dragonegg') { ctx.fillStyle = opened ? '#c9c0b0' : '#a8e6cf'; ctx.beginPath(); ctx.ellipse(rw.x, yy, s * 0.7, s, 0, 0, Math.PI * 2); ctx.fill(); r.sparkle(rw.x + s * 0.4, yy - s * 0.6, s * 0.4, '#fff'); }
    else if (rw.kind === 'luckywheel') { r.fillCircle(rw.x, yy, s, opened ? '#c9c0b0' : '#ffcf5e'); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + this._t * 0.6; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rw.x, yy); ctx.lineTo(rw.x + Math.cos(a) * s, yy + Math.sin(a) * s); ctx.stroke(); } }
    else { r.fillRoundRect(rw.x - s, yy - s * 0.1, s * 2, s, s * 0.2, opened ? '#b0895a' : '#e0a41e'); r.fillRoundRect(rw.x - s * 1.05, yy - s * 0.7, s * 2.1, s * 0.7, s * 0.2, opened ? '#c9c0b0' : '#ffcf5e'); if (!opened) r.sparkle(rw.x + s * 0.8, yy - s * 0.7, s * 0.4, '#fff'); }
    r.text(label, rw.x, yy + s + 18, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.5)', outlineWidth: 3 });
    rw._sy = yy; // cache for hit-test
  }

  _drawCritter(r, c, s) {
    const y = c.y - s;
    if (y < -30 || y > this.bounds.h + 30) return;
    if (c.type === 'bird') {
      const f = Math.sin(this._t * 9 + c.ph) * 6, ctx = r.ctx;
      ctx.strokeStyle = '#4a6a90'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c.x - 12, y + f); ctx.lineTo(c.x, y - 2); ctx.lineTo(c.x + 12, y + f); ctx.stroke();
      r.fillCircle(c.x, y - 2, 5, '#6a8aae');
    } else {
      const flap = Math.abs(Math.sin(this._t * 12 + c.ph)), w = 6 + flap * 4;
      this._e(r, c.x - w * 0.6, y, w, w * (0.5 + flap * 0.6), c.col);
      this._e(r, c.x + w * 0.6, y, w, w * (0.5 + flap * 0.6), c.col);
    }
  }
  _e(r, x, y, rx, ry, c) { const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }

  _drawMsg(r) {
    r.setAlpha(clamp(this._msg.t, 0, 1));
    const w = 560, x = this.bounds.w / 2 - w / 2, y = this.bounds.h * 0.3;
    UITheme.glassPanel(r, x, y, w, 90, 28);
    UITheme.heading(r, this._msg.text, this.bounds.w / 2, y + 46, 30, UI.ink);
    r.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    if (this.hud.onTap(px, py)) return true;
    const s = this.camera.scroll;
    // Rewards.
    for (const rw of this.model.rewards) {
      const y = (rw._sy ?? rw.y) - s;
      if (Math.hypot(px - rw.x, py - y) < 48) { this._openReward(rw); return true; }
    }
    // Level nodes.
    for (const nd of this.model.nodes) {
      const y = nd.y - s;
      const R = (this._state(nd) === 'current' ? MAP.currentRadius : MAP.nodeRadius) + 12;
      if ((px - nd.x) ** 2 + (py - y) ** 2 <= R * R) { this._tapNode(nd); return true; }
    }
    // Critters: tap a bird → it flies away.
    for (const c of this._critters) {
      if (c.type !== 'bird' || c.flee > 0) continue;
      const y = c.y - s;
      if (Math.hypot(px - c.x, py - y) < 40) { c.flee = 1.4; const a = -Math.PI / 2 + (Math.random() - 0.5); c.vx = Math.cos(a) * 260; c.vy = Math.sin(a) * 260; this.game.getSystem('audio')?.play('tap'); return true; }
    }
    return true; // modal
  }

  _tapNode(nd) {
    const st = this._state(nd);
    this.game.getSystem('audio')?.play('tap');
    if (st === 'locked') { this._msg = { text: `Level ${nd.n} is locked`, t: 1.6 }; return; }
    if (nd.n < this._level) { this._msg = { text: `Level ${nd.n} · ${nd.stars}★`, t: 1.6 }; return; }
    this.events.emit('ui:closeWorldMap');   // current/unlocked → back to play
  }

  _openReward(rw) {
    if (this._save?.opened?.[rw.id]) { this._msg = { text: 'Already collected', t: 1.4 }; return; }
    this.game.getSystem('audio')?.play('reward');
    if (this._save) { this._save.opened[rw.id] = true; this.game.getSystem('save')?.markDirty(); }
    if (rw.kind === 'dailychest') { this.events.emit('ui:openDaily'); return; }
    this.events.emit('notify:push', { text: `${rw.kind === 'dragonegg' ? 'Dragon egg' : 'Reward'} collected!`, priority: 6, color: UI.gold.mid });
    this._msg = { text: 'Reward collected!', t: 1.8 };
  }
}
