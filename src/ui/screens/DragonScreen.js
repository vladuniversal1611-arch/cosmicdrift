/**
 * DragonScreen.js
 * -----------------------------------------------------------------------------
 * The companion selection screen. Shows the dragon roster as cards — each with
 * the dragon, its name, its passive board perk and its unlock state — and lets
 * the player equip one unlocked dragon as the active companion. The active
 * dragon's perk is applied during play by the DragonSystem (this screen only
 * reads the roster and calls setActive). Choosing a companion is a real
 * strategic decision (charge the ultimate faster, or farm a resource you need
 * for the Island).
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Rect } from '../../utils/Rect.js';
import { Motion } from '../home/Motion.js';

export class DragonScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'dragons';
    this._t = 0;
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._back = new Rect(28, 56, 150, 64);
    this._cards = [];
    this._msg = null;
    this._layout();
  }

  get _dragons() { return this.game.getSystem('dragon'); }

  _layout() {
    const b = this.bounds;
    const roster = this._dragons?.roster() ?? [];
    const cols = 2, gap = 34;
    const cw = (b.w - 56 - gap * (cols - 1)) / cols;
    const ch = 330;
    const top = 210;
    this._cards = roster.map((d, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 28 + col * (cw + gap), y = top + row * (ch + gap);
      return { d, rect: new Rect(x, y, cw, ch) };
    });
  }

  onEnter() { this.events.emit('ui:modalOpen'); this._layout(); }
  onExit() { this.events.emit('ui:modalClose'); }

  update(dt) {
    this._t += dt;
    this._bg.update(dt);
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;
  }

  render(r) {
    this._bg.render(r);
    const b = this.bounds;
    UITheme.heading(r, 'DRAGONS', b.centerX, 74, 34, UI.white);
    const active = this._dragons?.activeDragon;
    r.text(active ? `Companion: ${active.name}` : 'Choose a companion', b.centerX, 112, {
      font: '800 18px system-ui, sans-serif', color: 'rgba(255,255,255,0.92)', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3,
    });

    for (const c of this._cards) this._drawCard(r, c);
    this._drawBack(r);
    if (this._msg) this._drawMsg(r);
  }

  _drawCard(r, c) {
    const b = c.rect, d = c.d;
    const bob = d.active ? Motion.float(this._t, 5, 2.4, b.x) : 0;
    const ctx = r.ctx; ctx.save(); ctx.translate(0, bob);
    // Card body.
    UITheme.glassPanel(r, b.x, b.y, b.w, b.h, 28);
    if (d.active) { r.withGlow(UI.gold.mid, 16, () => UITheme.goldFrame(r, b.x, b.y, b.w, b.h, 28, 5)); }

    const cx = b.centerX, dy = b.y + b.h * 0.30;
    // Dragon portrait (procedural placeholder — art swaps in later).
    this._dragon(r, cx, dy, b.w * 0.24, d.color, d.unlocked);
    // Name.
    r.text(d.name.toUpperCase(), cx, b.y + b.h * 0.55, { font: '900 26px system-ui, sans-serif', color: d.unlocked ? UI.ink : UI.inkSoft, align: 'center', baseline: 'middle' });
    // Perk (word-wrapped).
    this._wrap(r, d.unlocked ? d.perk.desc : `Unlocks at level ${d.unlockLevel}`, cx, b.y + b.h * 0.66, b.w - 40, 24, d.unlocked ? UI.inkSoft : '#a06a6a');
    // Action.
    const bw = b.w * 0.7, bx = cx - bw / 2, by = b.y + b.h - 74;
    if (!d.unlocked) {
      UITheme.button(r, bx, by, bw, 56, 18, ['#aebccb', '#7e8ea0'], { shadow: true });
      r.text('LOCKED', cx, by + 28, { font: '800 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    } else if (d.active) {
      UITheme.button(r, bx, by, bw, 56, 18, UI.btn.orange, { shadow: true });
      r.text('★ ACTIVE', cx, by + 28, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(150,80,10,0.6)', outlineWidth: 3 });
    } else {
      UITheme.button(r, bx, by, bw, 56, 18, UI.btn.play, { shadow: true });
      r.text('EQUIP', cx, by + 28, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,80,30,0.5)', outlineWidth: 3 });
    }
    ctx.restore();
  }

  _dragon(r, x, y, s, col, unlocked) {
    const tint = unlocked ? col : '#9fb0c0';
    const ctx = r.ctx;
    r.withGlow(unlocked ? col : 'rgba(0,0,0,0)', unlocked ? 16 : 0, () => {
      // Body + head.
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, s, s * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = tint; ctx.fill();
      r.fillCircle(x, y - s * 0.5, s * 0.62, tint);
      // Wings.
      ctx.fillStyle = tint;
      const flap = Motion.slide(this._t, 0.2, 1.6, x);
      ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 1.5, y - s * (0.8 + flap)); ctx.lineTo(x - s * 0.6, y + s * 0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + s * 0.5, y); ctx.lineTo(x + s * 1.5, y - s * (0.8 - flap)); ctx.lineTo(x + s * 0.6, y + s * 0.4); ctx.closePath(); ctx.fill();
    });
    // Eyes + tummy highlight.
    r.fillCircle(x - s * 0.22, y - s * 0.55, s * 0.12, '#fff'); r.fillCircle(x + s * 0.22, y - s * 0.55, s * 0.12, '#fff');
    r.fillCircle(x - s * 0.2, y - s * 0.53, s * 0.06, '#233a72'); r.fillCircle(x + s * 0.24, y - s * 0.53, s * 0.06, '#233a72');
    if (!unlocked) { r.setAlpha(0.35); r.fillCircle(x, y, s * 1.1, '#1a2b4a'); r.setAlpha(1); }
  }

  _wrap(r, text, cx, y, maxW, lh, color) {
    const words = String(text).split(' '); let line = '', yy = y; const font = '700 18px system-ui, sans-serif';
    r.ctx.font = font;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (r.ctx.measureText(test).width > maxW && line) { r.text(line, cx, yy, { font, color, align: 'center', baseline: 'middle' }); line = w; yy += lh; }
      else line = test;
    }
    if (line) r.text(line, cx, yy, { font, color, align: 'center', baseline: 'middle' });
  }

  _drawBack(r) {
    const b = this._back;
    UITheme.button(r, b.x, b.y, b.w, b.h, 20, UI.btn.teal);
    r.text('◀ BACK', b.centerX, b.centerY, { font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,90,80,0.6)', outlineWidth: 4 });
  }

  _drawMsg(r) {
    r.setAlpha(Math.min(1, this._msg.t));
    UITheme.glassPanel(r, this.bounds.centerX - 200, this.bounds.h * 0.86, 400, 66, 24);
    UITheme.heading(r, this._msg.text, this.bounds.centerX, this.bounds.h * 0.86 + 34, 24, UI.ink);
    r.setAlpha(1);
  }

  onTap(px, py) {
    if (this._back.contains(px, py)) { this.game.getSystem('audio')?.play('button'); this.events.emit('ui:closeDragons'); return true; }
    for (const c of this._cards) {
      if (!c.rect.contains(px, py)) continue;
      const d = c.d;
      if (!d.unlocked) { this._msg = { text: `Unlocks at level ${d.unlockLevel}`, t: 1.6 }; this.game.getSystem('audio')?.play('invalid'); return true; }
      if (d.active) { this._msg = { text: 'Already your companion', t: 1.2 }; return true; }
      if (this._dragons.setActive(d.id)) { this.game.getSystem('audio')?.play('reward'); this._msg = { text: `${d.name} equipped!`, t: 1.6 }; }
      return true;
    }
    return true;
  }
}
