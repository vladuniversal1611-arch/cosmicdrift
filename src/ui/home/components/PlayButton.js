/**
 * PlayButton.js  (Home Screen · section: PLAY)
 * -----------------------------------------------------------------------------
 * The primary call to action: the two ways to play, side by side —
 *   • LEVELS   (green, ▶)  → the objective campaign        → emits ui:playPressed
 *   • ENDLESS  (orange, ∞) → the survival high-score mode   → emits ui:playEndless
 * Both are full hero buttons so neither feels secondary. Composed in explicit
 * sub-layers (shadow → glow → body → highlight sweep → icon/label) so any layer
 * can be reskinned with art later.
 *
 * The LEVELS button carries the campaign state ('ready' | 'disabled' | 'locked');
 * ENDLESS is always available. Press animation runs through the AnimationManager.
 * Touch targets are always ≥96px.
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
    this.state = 'ready';        // LEVELS state: 'ready' | 'disabled' | 'locked'
    this._scaleL = 1;            // per-button press scales (AnimationManager)
    this._scaleR = 1;
    this._sparkT = 0;
    this._sparks = [];

    // Two hero buttons split across the play region.
    const gap = 26;
    const totalW = Math.min(720, region.w * 0.98);
    const bw = (totalW - gap) / 2;
    const h = Math.max(150, bw * 0.62);       // ≥96px touch, chunky hero tiles
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h * 0.42;
    const x0 = cx - totalW / 2;
    this.levelsRect = new Rect(x0, cy - h / 2, bw, h);
    this.endlessRect = new Rect(x0 + bw + gap, cy - h / 2, bw, h);
    this.radius = 34;
    // Union rect kept for the debug-bounds overlay.
    this.rect = new Rect(x0, cy - h / 2, totalW, h);
  }

  setState(s) { this.state = s; return this; }

  update(dt) {
    this._t += dt;
    this._sparkT += dt;
    if (this._sparkT >= 5) { this._sparkT = 0; this._spawnSparks(); }
    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const p = this._sparks[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      if (p.t > p.life) this._sparks.splice(i, 1);
    }
  }

  render(r) {
    const levelsReady = this.state === 'ready';
    // LEVELS (left).
    const lColors = levelsReady ? UI.btn.play : (this.state === 'locked' ? UI.btn.blue : ['#b9c6d6', '#8496ab']);
    this._drawButton(r, this.levelsRect, this._scaleL, lColors, levelsReady, [158, 246, 186],
      (b, cx, cy) => this._levelsLabel(r, b, cx, cy, levelsReady));
    // ENDLESS (right) — always available.
    this._drawButton(r, this.endlessRect, this._scaleR, UI.btn.orange, true, [255, 206, 130],
      (b, cx, cy) => this._endlessLabel(r, b, cx, cy));

    for (const p of this._sparks) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.sparkle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
  }

  /** Shared button chrome: glow → body → highlight sweep → (icon/label via cb). */
  _drawButton(r, b, scaleBase, colors, ready, glowRGB, labelCb) {
    const cx = b.centerX, cy = b.centerY;
    const breathe = ready ? Motion.scale(this._t, 0.02, 2.2) : 1;
    const scale = scaleBase * breathe;

    if (ready) {
      const g = 0.16 + Motion.pulse(this._t, 2.2) * 0.2;
      const [gr, gg, gb] = glowRGB;
      r.setAlpha(g);
      const grad = r.radialGradient(cx, cy, b.w * 0.9, [
        [0, `rgba(${gr},${gg},${gb},0.6)`], [0.6, `rgba(${gr},${gg},${gb},0.2)`], [1, `rgba(${gr},${gg},${gb},0)`],
      ]);
      r.fillRect(cx - b.w, cy - b.h, b.w * 2, b.h * 2, grad);
      r.setAlpha(1);
    }

    const ctx = r.ctx;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);

    UITheme.button(r, b.x, b.y, b.w, b.h, this.radius, colors);
    if (!ready) { r.setAlpha(0.35); r.fillRoundRect(b.x, b.y, b.w, b.h, this.radius, '#1a2b4a'); r.setAlpha(1); }

    if (ready) {
      const sweep = (this._t * 0.35) % 1.9;
      const sx = b.x - b.w * 0.3 + sweep * (b.w * 1.2);
      ctx.save(); r.roundRectPath(b.x, b.y, b.w, b.h, this.radius); ctx.clip();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = r.linearGradient(sx - 60, 0, sx + 60, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]);
      ctx.fillRect(b.x, b.y, b.w, b.h); ctx.globalAlpha = 1; ctx.restore();
    }

    labelCb(b, cx, cy);
    ctx.restore();
  }

  _levelsLabel(r, b, cx, cy, ready) {
    const col = ready ? '#fff' : 'rgba(255,255,255,0.6)';
    if (this.state === 'locked') {
      Icons.lock(r, cx, cy - b.h * 0.14, b.h * 0.24);
      r.text(t('menu.levels'), cx, cy + b.h * 0.26, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4 });
      return;
    }
    Icons.play(r, cx, cy - b.h * 0.16, b.h * 0.26, col);
    r.text(t('menu.levels'), cx, cy + b.h * 0.28, {
      font: '900 40px system-ui, sans-serif', color: col,
      align: 'center', baseline: 'middle', outline: 'rgba(20,80,30,0.5)', outlineWidth: 4,
    });
  }

  _endlessLabel(r, b, cx, cy) {
    r.text('∞', cx, cy - b.h * 0.15, {
      font: `900 ${Math.round(b.h * 0.42)}px system-ui, sans-serif`, color: '#fff',
      align: 'center', baseline: 'middle', outline: 'rgba(120,60,0,0.4)', outlineWidth: 4,
    });
    // Endless label can be a long word (uk: "БЕЗКІНЕЧНИЙ") — size to fit.
    const label = t('menu.endless');
    const fs = label.length > 8 ? 26 : 34;
    r.text(label, cx, cy + b.h * 0.29, {
      font: `900 ${fs}px system-ui, sans-serif`, color: '#fff',
      align: 'center', baseline: 'middle', outline: 'rgba(120,60,0,0.45)', outlineWidth: 4,
    });
  }

  _spawnSparks() {
    const b = this.levelsRect, cx = b.centerX, cy = b.centerY;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 200;
      this._sparks.push({ x: cx + (Math.random() - 0.5) * b.w * 0.7, y: cy, vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp - 80, t: 0, life: 0.9 + Math.random() * 0.5, s: 4 + Math.random() * 5 });
    }
  }

  onTap(px, py) {
    // ENDLESS — always available.
    if (this.endlessRect.contains(px, py)) {
      this._press('_scaleR');
      this._tap?.('play');
      this.game.events.emit('ui:playEndless');
      return true;
    }
    // LEVELS — gated by state.
    if (this.levelsRect.contains(px, py)) {
      if (this.state !== 'ready') { this._tap?.('blocked'); return true; }
      this._press('_scaleL');
      this._tap?.('play');
      this.game.events.emit('ui:playPressed');
      return true;
    }
    return false;
  }

  _press(prop) {
    const anim = this.game.getSystem('animation');
    this[prop] = 0.9;
    anim?.to(this, prop, 1, 0.6, { ease: Easing.elasticOut });
  }

  bounds() { return [new Rect(this.levelsRect.x, this.levelsRect.y, this.levelsRect.w, this.levelsRect.h),
    new Rect(this.endlessRect.x, this.endlessRect.y, this.endlessRect.w, this.endlessRect.h)]; }
}
