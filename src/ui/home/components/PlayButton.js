/**
 * PlayButton.js  (Home Screen · section: PLAY)
 * -----------------------------------------------------------------------------
 * The primary call to action and the largest interactive object on the screen.
 * Composed in explicit sub-layers so any layer can be reskinned with art later:
 *   shadow → glow → body(frame+fill) → animated highlight sweep → label/icon.
 *
 * States: 'ready' (default, pulsing + sparkle), 'pressed' (elastic squash via a
 * tween on _scale), 'disabled' (dimmed, no glow), 'locked' (padlock + hint).
 * Press animation runs through the AnimationManager (no bespoke tween code).
 * Touch target is always ≥96px. Emits `ui:playPressed` when tapped while ready.
 * -----------------------------------------------------------------------------
 */
import { UITheme, UI } from '../../theme/UITheme.js';
import { t } from '../../../i18n/Localization.js';
import { Rect } from '../../../utils/Rect.js';
import { Icons } from '../Icons.js';
import { Motion } from '../Motion.js';
import { Easing } from '../../../utils/Easing.js';

export class PlayButton {
  /** @param {{x,y,w,h}} region play-area rectangle to centre within. */
  constructor(game, region, onTap) {
    this.game = game;
    this._tap = onTap;
    this._t = 0;
    this.state = 'ready';        // 'ready' | 'disabled' | 'locked'
    this._scale = 1;             // animated by the AnimationManager on press
    this._sparkT = 0;
    this._sparks = [];

    const w = Math.min(560, region.w * 0.74);
    const h = Math.max(150, w * 0.30);      // ≥96px touch, hero proportions
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h * 0.42;
    this.rect = new Rect(cx - w / 2, cy - h / 2, w, h);
    this.radius = h / 2;
  }

  setState(s) { this.state = s; return this; }

  update(dt) {
    this._t += dt;
    if (this.state === 'ready') {
      this._sparkT += dt;
      if (this._sparkT >= 5) { this._sparkT = 0; this._spawnSparks(); }
    }
    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const p = this._sparks[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      if (p.t > p.life) this._sparks.splice(i, 1);
    }
  }

  render(r) {
    const b = this.rect;
    const ready = this.state === 'ready';
    const cx = b.centerX, cy = b.centerY;
    const breathe = ready ? Motion.scale(this._t, 0.02, 2.2) : 1;
    const scale = this._scale * breathe;

    // Glow (behind everything) — only when interactive. A soft, slightly warm
    // mint bloom that breathes; kept low-alpha and wide so it reads as light
    // pooling around the button, not a hard green band on the sky.
    if (ready) {
      const g = 0.16 + Motion.pulse(this._t, 2.2) * 0.2;
      r.setAlpha(g);
      const grad = r.radialGradient(cx, cy, b.w * 0.9, [[0, 'rgba(158,246,186,0.62)'], [0.6, 'rgba(150,240,180,0.22)'], [1, 'rgba(150,240,180,0)']]);
      r.fillRect(cx - b.w, cy - b.h, b.w * 2, b.h * 2, grad);
      r.setAlpha(1);
    }

    const ctx = r.ctx;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);

    const colors = ready ? UI.btn.play : (this.state === 'locked' ? UI.btn.blue : ['#b9c6d6', '#8496ab']);
    // Shadow + body + gold frame (UITheme owns the shared look).
    UITheme.button(r, b.x, b.y, b.w, b.h, this.radius, colors);
    if (!ready) { r.setAlpha(0.35); r.fillRoundRect(b.x, b.y, b.w, b.h, this.radius, '#1a2b4a'); r.setAlpha(1); }

    // Animated highlight sweep + a tiny sparkle riding across the button.
    if (ready) {
      const sweep = (this._t * 0.35) % 1.6;
      const sx = b.x - b.w * 0.3 + sweep * (b.w * 1.2);
      ctx.save(); r.roundRectPath(b.x, b.y, b.w, b.h, this.radius); ctx.clip();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = r.linearGradient(sx - 70, 0, sx + 70, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
      ctx.fillRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = 1; ctx.restore();
      if (sweep < 1.2) { r.withGlow('#fff', 8, () => r.sparkle(sx, b.y + b.h * 0.28, 8, '#fff6c8')); }
    }

    // Label / icon.
    if (this.state === 'locked') {
      Icons.lock(r, cx - b.w * 0.28, cy, b.h * 0.24);
      r.text('LOCKED', cx + b.w * 0.06, cy, { font: '900 44px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 5 });
    } else {
      Icons.play(r, cx - b.w * 0.30, cy, b.h * 0.26, ready ? '#fff' : 'rgba(255,255,255,0.6)');
      r.text(t('common.play'), cx + b.w * 0.06, cy, { font: '900 66px system-ui, sans-serif', color: ready ? '#fff' : 'rgba(255,255,255,0.6)', align: 'center', baseline: 'middle', outline: 'rgba(20,80,30,0.5)', outlineWidth: 5 });
    }
    ctx.restore();

    for (const p of this._sparks) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.sparkle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
  }

  _spawnSparks() {
    const b = this.rect, cx = b.centerX, cy = b.centerY;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 220;
      this._sparks.push({ x: cx + (Math.random() - 0.5) * b.w * 0.8, y: cy, vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp - 80, t: 0, life: 0.9 + Math.random() * 0.5, s: 4 + Math.random() * 5 });
    }
  }

  onTap(px, py) {
    if (!this.rect.contains(px, py)) return false;
    if (this.state !== 'ready') { this._tap?.('blocked'); return true; }
    // Elastic press via the AnimationManager: squash then spring back.
    const anim = this.game.getSystem('animation');
    this._scale = 0.9;
    anim?.to(this, '_scale', 1, 0.6, { ease: Easing.elasticOut });
    this._tap?.('play');
    this.game.events.emit('ui:playPressed');
    return true;
  }

  bounds() { return [new Rect(this.rect.x, this.rect.y, this.rect.w, this.rect.h)]; }
}
