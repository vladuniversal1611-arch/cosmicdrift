/**
 * IslandScreen.js
 * -----------------------------------------------------------------------------
 * The meta "reason to keep playing": your own floating island that you rebuild
 * with the resources earned in levels. It surfaces the existing (previously
 * screen-less) WorldProgressionSystem — a set of landmarks that advance through
 * visual stages (broken → half → restored) as you spend Magic Essence, Gold and
 * Building Materials. Tap a landmark to restore its next stage; it visibly
 * transforms and celebrates. Locked landmarks show when they unlock.
 *
 * Pure view over WorldProgressionSystem + EconomySystem — no new economy or
 * progression rules; it only reads state and calls the existing `restore(id)`.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { drawLandmark } from './LandmarkArt.js';
import { BiomeById } from '../../config/Biomes.js';
import { Currencies } from '../../systems/economy/EconomySystem.js';

const SLOT_W = 320, GAP = 40, LANDMARK_W = 150;

export class IslandScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'island';
    this._t = 0;
    this._scroll = 0;
    this._maxScroll = 0;
    this._drag = null;
    this._subs = [];
    this._particles = [];
    this._msg = null;
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._res = { gold: new Rolling(0), crystal: new Rolling(0) };
    this._back = new Rect(28, 56, 150, 64);
    this._islandY = this.bounds.h * 0.5;
  }

  get _wprog() { return this.game.getSystem('worldprogress'); }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this._layout();
    this._subs.push(this.events.on('input:down', ({ x, y }) => {
      if (Math.abs(y - this._islandY) < this.bounds.h * 0.32) this._drag = { x, s: this._scroll };
    }));
    this._subs.push(this.events.on('input:drag', ({ x }) => { if (this._drag) this._scroll = this._clamp(this._drag.s + (x - this._drag.x)); }));
    this._subs.push(this.events.on('input:up', () => { this._drag = null; }));
    // Celebrate a restoration performed while this screen is open.
    this._subs.push(this.events.on('world:stageAdvanced', ({ task }) => this._celebrate(task.id)));
    this._subs.push(this.events.on('world:restored', ({ task }) => this._celebrate(task.id, true)));
  }
  onExit() { this.events.emit('ui:modalClose'); this._subs.forEach((o) => o()); this._subs.length = 0; this._drag = null; }

  _slots() {
    const wp = this._wprog;
    if (!wp) return [];
    // Every unlocked task + the next locked one as a teaser.
    const all = wp.allTasks();
    const out = [];
    for (let i = 0; i < all.length; i++) { out.push({ ...all[i], idx: i }); if (!all[i].unlocked) break; }
    return out;
  }

  _layout() {
    const n = Math.max(1, this._slots().length);
    const contentW = n * SLOT_W + (n - 1) * GAP;
    this._maxScroll = Math.max(0, contentW - (this.bounds.w - 80));
    this._scroll = this._clamp(this._scroll);
  }
  _clamp(v) { return clamp(v, -this._maxScroll, 0); }

  _slotX(i) { return 40 + SLOT_W / 2 + i * (SLOT_W + GAP) + this._scroll; }

  _celebrate(id, grand = false) {
    const slots = this._slots();
    const i = slots.findIndex((s) => s.def.id === id);
    if (i < 0) return;
    const x = this._slotX(i), y = this._islandY - LANDMARK_W * 0.4;
    const color = BiomeById[slots[i].def.biome]?.accent ?? UI.gold.mid;
    const n = grand ? 46 : 26;
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 240; this._particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, t: 0, life: 0.7 + Math.random() * 0.7, s: 3 + Math.random() * 4, color: Math.random() < 0.5 ? color : '#fff' }); }
    this._msg = { text: grand ? 'Fully restored!' : 'Restored a stage!', t: 1.8 };
  }

  update(dt) {
    this._t += dt;
    this._bg.update(dt);
    const eco = this.game.getSystem('economy');
    if (eco) { this._res.gold.set(eco.balance('gold')); this._res.crystal.set(eco.balance('crystal')); }
    for (const k of Object.keys(this._res)) this._res[k].update(dt);
    for (let i = this._particles.length - 1; i >= 0; i--) { const p = this._particles[i]; p.t += dt; p.vy += 240 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > p.life) this._particles.splice(i, 1); }
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;
  }

  render(r) {
    this._bg.render(r);
    const b = this.bounds;
    const slots = this._slots();
    this._layout();

    // A long grassy island platform spanning the landmarks.
    if (slots.length) {
      const x0 = this._slotX(0), x1 = this._slotX(slots.length - 1);
      const iy = this._islandY + LANDMARK_W * 0.55;
      const left = x0 - SLOT_W * 0.5, right = x1 + SLOT_W * 0.5, w = right - left;
      r.setAlpha(0.14); this._ellipse(r, (left + right) / 2, iy + 70, w * 0.48, 40, '#0a2a1a'); r.setAlpha(1);
      const ctx = r.ctx;
      ctx.beginPath(); ctx.moveTo(left, iy); ctx.quadraticCurveTo((left + right) / 2, iy + 220, right, iy); ctx.closePath();
      ctx.fillStyle = r.linearGradient(0, iy, 0, iy + 180, [[0, '#8a6a44'], [1, '#5a4026']]); ctx.fill();
      this._ellipse(r, (left + right) / 2, iy, w * 0.5, 60, r.linearGradient(0, iy - 60, 0, iy + 60, [[0, '#8fe06a'], [1, '#4faa46']]));
      r.setAlpha(0.4); this._ellipse(r, (left + right) / 2, iy - 16, w * 0.44, 26, '#c4f59a'); r.setAlpha(1);
    }

    // Landmarks.
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i], x = this._slotX(i);
      if (x < -SLOT_W || x > b.w + SLOT_W) continue;
      if (!s.unlocked) { this._drawLocked(r, s, x); continue; }
      const color = BiomeById[s.def.biome]?.accent ?? UI.gold.mid;
      drawLandmark(r, x, this._islandY, LANDMARK_W, s.def, s, color, this._t, i * 1.3);
      r.text(s.def.name, x, this._islandY - LANDMARK_W * 0.75, { font: '800 26px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.5)', outlineWidth: 4 });
      const label = s.complete ? 'RESTORED' : s.def.stages[s.stage].toUpperCase();
      r.text(label, x, this._islandY - LANDMARK_W * 0.75 + 30, { font: '700 16px system-ui, sans-serif', color: s.complete ? '#8fe0a0' : 'rgba(255,255,255,0.85)', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
      this._drawAction(r, s, x);
    }

    // Particles.
    for (const p of this._particles) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.fillCircle(p.x, p.y, p.s, p.color); } r.setAlpha(1);

    this._drawHeader(r);
    this._drawBack(r);
    if (this._msg) this._drawMsg(r);
  }

  _ellipse(r, x, y, rx, ry, c) { const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }

  _drawAction(r, s, x) {
    if (s.complete) return;
    const by = this._islandY + LANDMARK_W * 0.8;
    const afford = this._wprog?.canRestore(s.def.id);
    const parts = Object.entries(s.cost).map(([k, v]) => `${Currencies[k]?.icon ?? ''}${v}`).join('  ');
    const w = 260, bx = x - w / 2;
    UITheme.button(r, bx, by, w, 64, 20, afford ? UI.btn.play : ['#9fb0c0', '#6f8090'], { shadow: true });
    r.text(`RESTORE  ${parts}`, x, by + 32, { font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
  }

  _drawLocked(r, s, x) {
    r.setAlpha(0.5); r.fillCircle(x, this._islandY, LANDMARK_W * 0.4, UI.inkSoft); r.setAlpha(1);
    r.text('?', x, this._islandY, { font: '900 60px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    const lvl = (s.idx + 1) * 5;
    r.text(`UNLOCKS AT LEVEL ${lvl}`, x, this._islandY + LANDMARK_W * 0.6, { font: '700 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
  }

  _drawHeader(r) {
    const b = this.bounds, wp = this._wprog;
    const biome = wp?.biome;
    const restored = wp ? wp.restoredCount : 0;
    const total = this._slots().filter((s) => s.unlocked).length;
    // Centred title + subtitle, then a centred resource row below (no overlap
    // with the Back button or each other).
    UITheme.heading(r, biome?.name ?? 'Your Island', b.centerX, 74, 34, UI.white);
    // Until the first restoration unlocks (early levels), invite the player in
    // rather than showing an awkward "0/0".
    const sub = total > 0 ? `${restored}/${total} RESTORED` : 'RESTORE THE WORLD';
    r.text(sub, b.centerX, 108, { font: '800 18px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
    const chips = [
      { id: 'gold', roll: this._res.gold, cap: '#ffcf5e' },
      { id: 'crystal', roll: this._res.crystal, cap: '#7cd6ff' },
    ];
    const cw = 190, gap = 18, cy = 138;
    let cx = b.centerX - (chips.length * cw + (chips.length - 1) * gap) / 2;
    for (const c of chips) {
      UITheme.chip(r, cx, cy, cw, 52, c.cap);
      r.text(Currencies[c.id].icon, cx + 26, cy + 26, { font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      r.text(c.roll.text, cx + 52, cy + 26, { font: '900 24px system-ui, sans-serif', color: '#fff', align: 'left', baseline: 'middle' });
      cx += cw + gap;
    }
  }

  _drawBack(r) {
    const b = this._back;
    UITheme.button(r, b.x, b.y, b.w, b.h, 20, UI.btn.teal);
    r.text('◀ BACK', b.centerX, b.centerY, { font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,90,80,0.6)', outlineWidth: 4 });
  }

  _drawMsg(r) {
    r.setAlpha(clamp(this._msg.t, 0, 1));
    UITheme.glassPanel(r, this.bounds.centerX - 200, this.bounds.h * 0.78, 400, 70, 24);
    UITheme.heading(r, this._msg.text, this.bounds.centerX, this.bounds.h * 0.78 + 36, 26, UI.ink);
    r.setAlpha(1);
  }

  onTap(px, py) {
    if (this._back.contains(px, py)) { this.game.getSystem('audio')?.play('button'); this.events.emit('ui:closeIsland'); return true; }
    const slots = this._slots();
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i], x = this._slotX(i);
      if (Math.abs(px - x) > SLOT_W / 2) continue;
      if (py < this._islandY - LANDMARK_W || py > this._islandY + LANDMARK_W * 1.3) continue;
      this._onSlotTap(s);
      return true;
    }
    return true;
  }

  _onSlotTap(s) {
    this.game.getSystem('audio')?.play('button');
    if (!s.unlocked) { this._msg = { text: `Unlocks at level ${(s.idx + 1) * 5}`, t: 1.6 }; return; }
    if (s.complete) { this._msg = { text: 'Already fully restored', t: 1.4 }; return; }
    if (!this._wprog?.canRestore(s.def.id)) { this._msg = { text: 'Not enough resources', t: 1.6 }; this.game.getSystem('audio')?.play('invalid'); return; }
    this._wprog.restore(s.def.id);   // system fires stage/restored events → _celebrate
  }
}
