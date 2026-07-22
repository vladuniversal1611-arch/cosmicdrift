/**
 * WorldMapScreen.js
 * -----------------------------------------------------------------------------
 * The floating-world restoration view — where long-term progress becomes
 * visible. It shows the player's unlocked landmarks as floating islands at their
 * current restoration stage, the resources they've earned, and lets them spend
 * to advance a landmark's stage. Completing a stage plays a cinematic: the view
 * zooms to the landmark, particles erupt, NPCs celebrate and a biome dragon
 * flies past.
 *
 * It reads all state from the WorldProgressionSystem (nothing lives here), and
 * pauses piece input while open. The landmark visuals are fully data-driven via
 * LandmarkArt, so new landmarks need no changes here.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Palette } from '../../config/Palette.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { BiomeById } from '../../config/Biomes.js';
import { Currencies } from '../../systems/economy/EconomySystem.js';
import { drawLandmark } from './LandmarkArt.js';

const SLOT_H = 268;
const TOP = 150;

export class WorldMapScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'worldmap';
    this._time = 0;
    this._scroll = 0;
    this._maxScroll = 0;
    this._slots = [];
    this._cine = null;       // { t, dur, idx, done }
    this._particles = [];
    this._dragon = null;     // { x, y, vx } flyby sprite
    this._npcs = [];         // celebrating hoppers
    this._msg = null;        // { text, t }
    this._subs = [];
    this._backRect = new Rect(16, 44, 96, 40);
  }

  get _wp() { return this.game.getSystem('worldprogress'); }
  get _economy() { return this.game.getSystem('economy'); }

  onEnter() {
    // Pause board input while the modal map is open.
    this.events.emit('ui:modalOpen');
    this._scroll = 0;
    this._cine = null;
    // Drag-to-scroll (taps still register as taps and hit landmarks).
    this._subs.push(this.events.on('input:down', ({ y }) => { this._dy = y; this._ds = this._scroll; }));
    this._subs.push(this.events.on('input:move', ({ y }) => {
      if (this._dy == null) return;
      this._scroll = clamp(this._ds - (y - this._dy), 0, this._maxScroll);
    }));
    this._subs.push(this.events.on('input:up', () => { this._dy = null; }));
  }

  onExit() {
    this.events.emit('ui:modalClose');
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  // --- Layout ----------------------------------------------------------------
  _layout() {
    const tasks = this._wp.allTasks();
    // Show every unlocked landmark plus one locked "coming soon" preview.
    const shown = [];
    for (let i = 0; i < tasks.length; i++) {
      shown.push(tasks[i]);
      if (!tasks[i].unlocked) break;
    }
    this._slots = shown.map((st, i) => ({
      st,
      idx: i,
      cx: this.bounds.centerX,
      cy: TOP + i * SLOT_H + SLOT_H / 2,   // world Y (pre-scroll)
      w: Math.min(this.bounds.w * 0.48, SLOT_H * 0.62),
    }));
    const contentH = shown.length * SLOT_H;
    const viewH = this.bounds.h - TOP - 70;
    this._maxScroll = Math.max(0, contentH - viewH);
  }

  // --- Update ----------------------------------------------------------------
  update(dt) {
    this._time += dt;
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;

    if (this._cine) {
      this._cine.t += dt;
      if (this._cine.t >= this._cine.dur) this._cine = null;
    }
    // Particles.
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      p.vy += 240 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0) this._particles.splice(i, 1);
    }
    // Dragon flyby + NPC hops.
    if (this._dragon) {
      this._dragon.x += this._dragon.vx * dt;
      if (this._dragon.x < -80 || this._dragon.x > this.bounds.w + 80) this._dragon = null;
    }
    for (const n of this._npcs) n.t += dt;
    if (!this._cine) this._npcs.length = 0;
  }

  // --- Restore action --------------------------------------------------------
  _tryRestore(slot) {
    const wp = this._wp;
    const id = slot.st.def.id;
    if (slot.st.complete) { this._flash('Already restored'); return; }
    if (!slot.st.unlocked) { this._flash(`Unlocks at level ${(slot.idx + 1) * 5}`); return; }
    if (!wp.canRestore(id)) { this._flash('Not enough resources'); return; }

    const wasFinal = slot.st.stage + 1 >= slot.st.maxStage;
    if (!wp.restore(id)) return;
    this._startCinematic(slot, wasFinal);
    this._layout();
  }

  _startCinematic(slot, grand) {
    const screenCy = slot.cy - this._scroll;
    this._cine = { t: 0, dur: grand ? 2.2 : 1.2, idx: slot.idx };
    const color = BiomeById[slot.st.def.biome].accent;
    const n = grand ? 46 : 24;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      this._particles.push({
        x: slot.cx, y: screenCy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
        life: 0.6 + Math.random() * 0.7, color: Math.random() < 0.5 ? color : '#ffffff',
        size: 2 + Math.random() * 4,
      });
    }
    if (grand) {
      // A biome dragon swoops across, and villagers cheer beneath the landmark.
      this._dragon = { x: -80, y: screenCy - slot.w * 0.6, vx: (this.bounds.w + 160) / 1.8, color: BiomeById[slot.st.def.biome].accentAlt };
      this._npcs = [-1, 0, 1].map((k) => ({ x: slot.cx + k * slot.w * 0.3, y: screenCy + slot.w * 0.4, t: Math.random() }));
    }
  }

  _flash(text) { this._msg = { text, t: 1.6 }; this.game.getSystem('audio')?.play('invalid'); }

  // --- Render ----------------------------------------------------------------
  render(renderer) {
    this._layout();
    const b = this.bounds;

    // Opaque bright biome sky so gameplay is hidden behind the map.
    const biome = this._wp.biome;
    renderer.fillBackgroundGradient(biome.background);
    renderer.setAlpha(0.14);
    renderer.fillRect(0, 0, b.w, b.h, '#1e5aa0');
    renderer.setAlpha(1);

    // World layer (islands/landmarks), with a cinematic zoom toward the focus.
    renderer.save();
    if (this._cine) {
      const z = 1 + 0.22 * Math.sin((this._cine.t / this._cine.dur) * Math.PI);
      const fx = b.centerX;
      const fy = this._slots[this._cine.idx] ? this._slots[this._cine.idx].cy - this._scroll : b.centerY;
      renderer.translate(fx, fy); renderer.scale(z, z); renderer.translate(-fx, -fy);
    }
    this._drawWorld(renderer);
    this._drawCinematicFx(renderer);
    renderer.restore();

    // Fixed foreground UI.
    this._drawHeader(renderer);
    this._drawBack(renderer);
    if (this._msg) this._drawMsg(renderer);
  }

  _drawWorld(renderer) {
    const b = this.bounds;
    // Connecting path between islands.
    renderer.ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    renderer.ctx.lineWidth = 3;
    renderer.ctx.setLineDash([6, 10]);
    renderer.ctx.beginPath();
    for (let i = 0; i < this._slots.length; i++) {
      const s = this._slots[i];
      const y = s.cy - this._scroll;
      if (i === 0) renderer.ctx.moveTo(s.cx, y); else renderer.ctx.lineTo(s.cx, y);
    }
    renderer.ctx.stroke();
    renderer.ctx.setLineDash([]);

    for (const slot of this._slots) {
      const y = slot.cy - this._scroll;
      if (y < TOP - SLOT_H || y > b.h + SLOT_H) continue; // cull
      const st = slot.st;
      const def = st.def;
      const color = BiomeById[def.biome].accent;

      if (!st.unlocked) { this._drawLocked(renderer, slot, y); continue; }

      drawLandmark(renderer, slot.cx, y, slot.w, def, st, color, this._time, slot.idx * 1.3);

      // Name + stage label.
      renderer.text(def.name, slot.cx, y - slot.w * 0.55, {
        font: '800 20px system-ui, sans-serif', color: Palette.textPrimary, align: 'center', baseline: 'middle',
      });
      const stageLabel = st.complete ? 'RESTORED' : def.stages[st.stage];
      renderer.text(stageLabel.toUpperCase(), slot.cx, y - slot.w * 0.55 + 22, {
        font: '700 12px system-ui, sans-serif',
        color: st.complete ? Palette.success : Palette.textMuted, align: 'center', baseline: 'middle',
      });

      // Cost / action row beneath the island.
      this._drawAction(renderer, slot, y);
    }
  }

  _drawAction(renderer, slot, y) {
    const st = slot.st;
    const by = y + slot.w * 0.6;
    if (st.complete) return;
    const afford = this._wp.canRestore(st.def.id);
    const parts = Object.entries(st.cost)
      .map(([k, v]) => `${Currencies[k]?.icon ?? ''}${v}`).join('   ');
    // Pill background.
    const w = slot.w * 0.9;
    renderer.fillRoundRect(slot.cx - w / 2, by, w, 34, 17, afford ? 'rgba(56,224,138,0.16)' : 'rgba(255,255,255,0.06)');
    renderer.strokeRoundRect(slot.cx - w / 2, by, w, 34, 17, afford ? Palette.success : Palette.surfaceStroke, 1.5);
    renderer.text(`RESTORE   ${parts}`, slot.cx, by + 17, {
      font: '700 14px system-ui, sans-serif',
      color: afford ? Palette.textPrimary : Palette.textMuted, align: 'center', baseline: 'middle',
    });
  }

  _drawLocked(renderer, slot, y) {
    renderer.setAlpha(0.4);
    renderer.fillCircle(slot.cx, y, slot.w * 0.34, Palette.surfaceRaised);
    renderer.setAlpha(1);
    renderer.text('???', slot.cx, y, {
      font: '800 26px system-ui, sans-serif', color: Palette.textMuted, align: 'center', baseline: 'middle',
    });
    renderer.text(`UNLOCKS AT LEVEL ${(slot.idx + 1) * 5}`, slot.cx, y + slot.w * 0.42, {
      font: '700 12px system-ui, sans-serif', color: Palette.textMuted, align: 'center', baseline: 'middle',
    });
  }

  _drawCinematicFx(renderer) {
    for (const p of this._particles) {
      renderer.setAlpha(clamp(p.life, 0, 1));
      renderer.fillCircle(p.x, p.y, p.size, p.color);
    }
    renderer.setAlpha(1);
    // Celebrating NPCs (little hopping figures).
    for (const n of this._npcs) {
      const hop = Math.abs(Math.sin(n.t * 6)) * 10;
      renderer.fillCircle(n.x, n.y - hop, 6, Palette.textPrimary);
      renderer.fillRoundRect(n.x - 4, n.y - hop + 4, 8, 10, 3, Palette.accentAlt);
    }
    // Biome dragon flyby.
    if (this._dragon) {
      const d = this._dragon;
      const wing = Math.sin(this._time * 12) * 8;
      renderer.withGlow(d.color, 16, () => {
        renderer.fillCircle(d.x, d.y, 9, d.color);
        renderer.ctx.fillStyle = d.color;
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(d.x - 8, d.y);
        renderer.ctx.lineTo(d.x - 26, d.y - 10 - wing);
        renderer.ctx.lineTo(d.x - 20, d.y + 4);
        renderer.ctx.closePath();
        renderer.ctx.fill();
      });
    }
  }

  _drawHeader(renderer) {
    const b = this.bounds;
    const biome = this._wp.biome;
    renderer.text('FLOATING WORLD', b.centerX, 52, {
      font: '900 26px system-ui, sans-serif', color: Palette.textPrimary, align: 'center', baseline: 'middle',
    });
    renderer.text(`${biome.name.toUpperCase()}  ·  ${biome.dragon}`, b.centerX, 76, {
      font: '700 12px system-ui, sans-serif', color: Palette.textMuted, align: 'center', baseline: 'middle',
    });
    // Resource chips.
    const chips = ['essence', 'gold', 'materials'];
    const cw = b.w / chips.length;
    chips.forEach((id, i) => {
      const x = cw * i + cw / 2;
      renderer.text(`${Currencies[id].icon} ${this._economy?.balance(id) ?? 0}`, x, 108, {
        font: '800 16px system-ui, sans-serif', color: Palette.warning, align: 'center', baseline: 'middle',
      });
      renderer.text(Currencies[id].name.toUpperCase(), x, 126, {
        font: '600 9px system-ui, sans-serif', color: Palette.textMuted, align: 'center', baseline: 'middle',
      });
    });
  }

  _drawBack(renderer) {
    const r = this._backRect;
    renderer.fillRoundRect(r.x, r.y, r.w, r.h, 12, Palette.surfaceRaised);
    renderer.strokeRoundRect(r.x, r.y, r.w, r.h, 12, Palette.surfaceStroke, 1);
    renderer.text('◀ BACK', r.centerX, r.centerY, {
      font: '700 15px system-ui, sans-serif', color: Palette.textPrimary, align: 'center', baseline: 'middle',
    });
  }

  _drawMsg(renderer) {
    renderer.setAlpha(clamp(this._msg.t, 0, 1));
    renderer.text(this._msg.text, this.bounds.centerX, this.bounds.h - 40, {
      font: '800 16px system-ui, sans-serif', color: Palette.danger, align: 'center', baseline: 'middle',
    });
    renderer.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    if (this._cine) return true;             // ignore taps mid-cinematic
    if (this._backRect.contains(px, py)) { this.events.emit('ui:closeWorldMap'); return true; }
    for (const slot of this._slots) {
      const y = slot.cy - this._scroll;
      if (Math.abs(px - slot.cx) < slot.w * 0.6 && Math.abs(py - y) < SLOT_H * 0.5) {
        this._tryRestore(slot);
        return true;
      }
    }
    return true; // modal: always consume
  }
}
