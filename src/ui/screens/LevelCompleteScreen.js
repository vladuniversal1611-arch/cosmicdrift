/**
 * LevelCompleteScreen.js
 * -----------------------------------------------------------------------------
 * The dopamine payload: a massive level-complete celebration. Confetti and
 * fireworks, three stars that fly in and pop, a reward chest that bursts open
 * raining coins, a dragon that soars across, an animated reward summary with
 * rolling numbers, and a softly-glowing Continue button. Timeline-driven; all
 * eased. Continue pops back to the (already-advanced) level.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { Easing } from '../../utils/Easing.js';
import { Random } from '../../utils/Random.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';

export class LevelCompleteScreen extends Screen {
  constructor(game, reward = {}) {
    super(game);
    this.name = 'levelcomplete';
    this._t = 0;
    this._reward = { gold: reward.gold ?? 120, essence: reward.essence ?? 10, materials: reward.materials ?? 8 };
    this._roll = { gold: new Rolling(0), essence: new Rolling(0), materials: new Rolling(0) };
    this._confetti = [];
    this._coins = [];
    this._fireworks = [];
    this._dragonX = -0.2;
    this._rng = new Random(Date.now() >>> 0);

    const w = this.bounds.w, h = this.bounds.h;
    this._continue = this.add(new PremiumButton(w / 2 - w * 0.3, h * 0.8, w * 0.6, 92,
      () => this.events.emit('ui:back'),
      { label: 'CONTINUE', colors: UI.btn.play, radius: 30, font: '900 34px system-ui, sans-serif' }));
    this._continue.visible = false;
    this._continue.enabled = false;
  }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this.game.getSystem('audio')?.play('restore');
    for (let i = 0; i < 60; i++) this._spawnConfetti();
  }
  onExit() { this.events.emit('ui:modalClose'); }

  _spawnConfetti() {
    const colors = ['#ff5c94', '#ffcf5e', '#3fa93f', '#2f8fe0', '#8a4fe0', '#28e0d0'];
    this._confetti.push({
      x: Math.random() * this.bounds.w, y: -20 - Math.random() * this.bounds.h * 0.5,
      vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 140,
      s: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
      color: colors[(Math.random() * colors.length) | 0],
    });
  }

  update(dt) {
    this._t += dt;
    // Rewards roll in once the chest opens.
    if (this._t > 1.0) {
      this._roll.gold.set(this._reward.gold); this._roll.essence.set(this._reward.essence); this._roll.materials.set(this._reward.materials);
    }
    this._roll.gold.update(dt); this._roll.essence.update(dt); this._roll.materials.update(dt);

    // Confetti (kept topped up for a while).
    if (this._t < 2.5 && this._confetti.length < 90 && Math.random() < 0.5) this._spawnConfetti();
    for (let i = this._confetti.length - 1; i >= 0; i--) {
      const c = this._confetti[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
      if (c.y > this.bounds.h + 20) this._confetti.splice(i, 1);
    }
    // Coin rain from the chest.
    if (this._t > 0.9 && this._t < 1.8 && Math.random() < 0.6) {
      this._coins.push({ x: this.bounds.centerX + (Math.random() - 0.5) * 120, y: this.bounds.h * 0.42, vx: (Math.random() - 0.5) * 160, vy: -220 - Math.random() * 160, t: 0, life: 1.4, s: 9 });
    }
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i]; c.t += dt; c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.t > c.life) this._coins.splice(i, 1);
    }
    // Fireworks bursts.
    if (this._t < 3 && Math.random() < 0.03) this._fireworks.push({ x: Math.random() * this.bounds.w, y: this.bounds.h * (0.2 + Math.random() * 0.3), t: 0, color: ['#ffcf5e', '#ff5c94', '#28e0d0'][(Math.random() * 3) | 0] });
    for (let i = this._fireworks.length - 1; i >= 0; i--) { this._fireworks[i].t += dt; if (this._fireworks[i].t > 0.8) this._fireworks.splice(i, 1); }

    this._dragonX += dt * 0.35; if (this._dragonX > 1.3) this._dragonX = -0.3;

    if (this._t > 1.2) { this._continue.visible = true; this._continue.enabled = true; }
  }

  render(r) {
    const b = this.bounds;
    // Dim + radiant god-rays behind the celebration.
    r.setAlpha(0.68); r.fillRect(0, 0, b.w, b.h, '#0a1030'); r.setAlpha(1);
    r.setAlpha(0.5);
    const rays = r.radialGradient(b.centerX, b.h * 0.38, b.w * 0.8, [[0, 'rgba(255,240,190,0.6)'], [1, 'rgba(255,240,190,0)']]);
    r.fillRect(0, 0, b.w, b.h, rays); r.setAlpha(1);

    this._drawFireworks(r);
    this._drawDragon(r);

    // Banner drops in with a bounce.
    const drop = Easing.backOut(Math.min(1, this._t / 0.5));
    const by = -60 + drop * (b.h * 0.2 + 60);
    UITheme.heading(r, 'LEVEL', b.centerX, by, 40, '#fff');
    r.withGlow('#ffcf5e', 24, () => UITheme.heading(r, 'COMPLETE!', b.centerX, by + 46, 52, '#ffe08a'));

    this._drawStars(r, b.centerX, b.h * 0.34);
    this._drawChest(r, b.centerX, b.h * 0.42);
    this._drawRewards(r, b.centerX, b.h * 0.6);

    // Coins + confetti on top.
    for (const c of this._coins) { r.setAlpha(Math.max(0, 1 - c.t / c.life)); drawObjectiveIcon(r, 'coins', c.x, c.y, c.s, '#ffcf5e'); r.setAlpha(1); }
    this._drawConfetti(r);

    for (const child of this.children) child.render(r);
  }

  _drawStars(r, cx, cy) {
    for (let i = 0; i < 3; i++) {
      const start = 0.3 + i * 0.18;
      const k = Easing.backOut(Math.max(0, Math.min(1, (this._t - start) / 0.4)));
      if (k <= 0) continue;
      const x = cx + (i - 1) * 62;
      const y = cy - Math.abs(i - 1) * 14;
      r.setAlpha(k);
      r.withGlow('#ffd25e', 16, () => r.sparkle(x, y, 26 * k, '#ffe08a'));
      r.setAlpha(1);
    }
  }

  _drawChest(r, cx, cy) {
    const open = this._t > 0.9;
    const appear = Easing.backOut(Math.max(0, Math.min(1, (this._t - 0.55) / 0.4)));
    if (appear <= 0) return;
    const s = 46 * appear;
    r.save(); r.translate(cx, cy); r.scale(1, 1);
    UITheme.shadow(r, -s, -s * 0.1, s * 2, s * 1.1, 8, 6, 0.3);
    r.fillRoundRect(-s, -s * 0.1, s * 2, s * 1.15, 8, '#b8860b');
    r.fillRoundRect(-s, -s * 0.1, s * 2, s * 0.4, 8, '#ffcf5e');
    r.ctx.save(); r.ctx.translate(0, -s * 0.1); r.ctx.rotate(open ? -0.85 : -0.06);
    r.fillRoundRect(-s, -s * 0.55, s * 2, s * 0.55, 8, '#d69a2a');
    UITheme.goldFrame(r, -s, -s * 0.55, s * 2, s * 0.55, 8, 3);
    r.ctx.restore();
    if (open) r.withGlow('#fff', 20, () => r.fillCircle(0, 0, s * 0.5, '#fff6c8'));
    UITheme.goldFrame(r, -s, -s * 0.1, s * 2, s * 1.15, 8, 3);
    r.restore();
  }

  _drawRewards(r, cx, cy) {
    if (this._t < 1.0) return;
    const a = Math.min(1, (this._t - 1.0) / 0.4);
    r.setAlpha(a);
    const items = [
      { icon: 'coins', cap: '#ffcf5e', val: this._roll.gold.text },
      { icon: 'crystal', cap: '#b07cff', val: this._roll.essence.text },
      { icon: 'statue', cap: '#c8b48a', val: this._roll.materials.text },
    ];
    const cw = 120, gap = 12, total = items.length * cw + (items.length - 1) * gap;
    let x = cx - total / 2;
    for (const it of items) {
      UITheme.chip(r, x, cy, cw, 46, it.cap);
      drawObjectiveIcon(r, it.icon, x + 23, cy + 23, 13, '#fff');
      r.text(`+${it.val}`, x + 46, cy + 23, { font: '900 18px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
      x += cw + gap;
    }
    r.setAlpha(1);
  }

  _drawConfetti(r) {
    const ctx = r.ctx;
    for (const c of this._confetti) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.s / 2, -c.s / 3, c.s, c.s * 0.6);
      ctx.restore();
    }
  }

  _drawFireworks(r) {
    for (const f of this._fireworks) {
      const k = f.t / 0.8;
      r.setAlpha((1 - k) * 0.9);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rad = k * 70;
        r.fillCircle(f.x + Math.cos(a) * rad, f.y + Math.sin(a) * rad, 3 * (1 - k) + 1, f.color);
      }
      r.setAlpha(1);
    }
  }

  _drawDragon(r) {
    const x = this._dragonX * this.bounds.w;
    const y = this.bounds.h * 0.22 + Math.sin(this._t * 2) * 14;
    const s = 26;
    const flap = Math.sin(this._t * 10) * 0.5;
    r.withGlow('#7c5cff', 14, () => {
      r.fillCircle(x, y, s * 0.6, '#8a6cff');
      const ctx = r.ctx; ctx.fillStyle = '#8a6cff';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 1.7, y - s * (0.9 + flap)); ctx.lineTo(x - s * 0.5, y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s, y - s * (0.7 - flap)); ctx.lineTo(x + s * 0.2, y + s * 0.3); ctx.closePath(); ctx.fill();
      r.fillCircle(x + s * 0.7, y - s * 0.1, s * 0.35, '#8a6cff');
    });
  }
}
