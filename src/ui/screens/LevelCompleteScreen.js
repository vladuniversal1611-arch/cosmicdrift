/**
 * LevelCompleteScreen.js
 * -----------------------------------------------------------------------------
 * The premium victory ceremony (Royal Match / Block Blast / Gardenscapes feel).
 * A tightly-choreographed ~3.3s timeline, all eased, pooled and 60 FPS:
 *
 *   0.00  darken + vignette + light rays + floating particles; fanfare + a
 *         subtle "I DID IT" zoom-in of the whole panel (1.03 → 1.0).
 *   0.15  "LEVEL COMPLETE" title pops in (0 → 1.2 → 1.0 bounce) with sparkles.
 *   0.70  earned stars fly in one-by-one, land, pop, sparkle (150ms apart).
 *   1.55  coin fountain: ~30 coins arc up into the top counter, which pulses
 *         and counts upward; a throttled ding + light haptic on arrivals.
 *   1.95  XP bar fills; a level-up flashes + bursts if the band advances.
 *   2.35  Continue slides up with a soft bounce + idle glow.
 *
 * A single tap fast-forwards to the end (rewards are already granted by the
 * economy/world systems before this screen opens, so skipping is always safe).
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Easing } from '../../utils/Easing.js';
import { Haptics } from '../../utils/Haptics.js';
import { clamp } from '../../utils/MathUtils.js';
import { t } from '../../i18n/Localization.js';

// Timeline anchors (seconds).
const T = { zoom: 0.4, title: 0.15, star0: 0.7, starGap: 0.35, starDur: 0.4, coin: 1.55, xp: 1.95, cont: 2.35 };

export class LevelCompleteScreen extends Screen {
  constructor(game, reward = {}) {
    super(game);
    this.name = 'levelcomplete';
    this._t = 0;
    this._reward = { gold: reward.gold ?? 120, essence: reward.essence ?? 10, materials: reward.materials ?? 8 };
    this._starCount = clamp(reward.stars ?? 3, 1, 3);
    this._skipped = false;

    // Pools (fixed capacity, recycled — no per-frame allocation).
    this._coins = [];
    this._particles = [];   // floating ambient motes
    for (let i = 0; i < 20; i++) this._particles.push({ x: Math.random() * this.bounds.w, y: Math.random() * this.bounds.h, vy: 8 + Math.random() * 16, ph: Math.random() * 6.28, s: 2 + Math.random() * 4 });
    this._starPops = [0, 0, 0];   // per-star pop-burst timers
    this._dragonX = -0.2;

    // Coin counter target (economy already credited before this screen opened).
    const eco = game.getSystem('economy');
    this._coinTarget = eco ? eco.balance('gold') : this._reward.gold;
    this._coinDisplay = Math.max(0, this._coinTarget - this._reward.gold);
    this._coinsToFly = Math.min(36, Math.max(16, this._reward.gold));
    this._coinsSpawned = 0;
    this._coinValue = this._reward.gold / this._coinsToFly;
    this._counterPulse = 0;
    this._coinCtr = { x: this.bounds.w - 150, y: 96, w: 130, h: 62 };
    this._dingT = 0;

    const w = this.bounds.w, h = this.bounds.h;
    this._contY = h * 0.82;
    this._continue = this.add(new PremiumButton(w / 2 - w * 0.32, h + 120, w * 0.64, 96,
      // Between-levels break: offer an interstitial, then continue the flow.
      () => { this.game.getSystem('monetization')?.interstitialAtLevelEnd(); this.events.emit('ui:reveal-next'); },
      { label: t('common.continue'), colors: UI.btn.play, radius: 32, font: '900 40px system-ui, sans-serif', floatAmp: 3, floatPeriod: 2 }));
    this._continue.visible = false; this._continue.enabled = false;
    this._contShown = false;
  }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this.game.getSystem('audio')?.play('restore');   // victory fanfare
    Haptics.light(this.game);
  }
  onExit() { this.events.emit('ui:modalClose'); }

  // --- Update ----------------------------------------------------------------
  update(dt) {
    this._t += dt;
    const audio = this.game.getSystem('audio');

    // Star landings → pop + sparkle + rising sound + tiny haptic.
    for (let i = 0; i < this._starCount; i++) {
      const at = T.star0 + i * T.starGap;
      if (this._t >= at && this._t - dt < at && !this._skipped) {
        this._starPops[i] = 0.001;
        audio?.play('reward', { rate: 1 + i * 0.12 });
        Haptics.light(this.game);
      }
      if (this._starPops[i] > 0) { this._starPops[i] += dt; if (this._starPops[i] > 0.5) this._starPops[i] = 0; }
    }

    // Coin fountain — spawn over ~0.5s, each flies an arc into the counter.
    if (!this._skipped && this._t >= T.coin && this._coinsSpawned < this._coinsToFly) {
      const rate = dt > 0 ? Math.ceil(this._coinsToFly * dt / 0.5) : 1;
      for (let k = 0; k < rate && this._coinsSpawned < this._coinsToFly; k++) this._spawnCoin();
      if (this._coinsSpawned === rate) { audio?.play('reward', { rate: 1.3 }); Haptics.light(this.game); }
    }
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i];
      c.t = Math.min(1, c.t + dt / c.dur);
      if (c.t >= 1) {
        this._coinDisplay = Math.min(this._coinTarget, this._coinDisplay + c.value);
        this._counterPulse = 1;
        if (this._dingT <= 0) { audio?.play('reward', { rate: 1.6 }); this._dingT = 0.08; }
        this._coins.splice(i, 1);
      }
    }
    if (this._dingT > 0) this._dingT -= dt;
    if (this._counterPulse > 0) this._counterPulse = Math.max(0, this._counterPulse - dt * 3);

    // Ambient particles + dragon flyby.
    for (const p of this._particles) { p.y -= p.vy * dt; if (p.y < -10) { p.y = this.bounds.h + 10; p.x = Math.random() * this.bounds.w; } }
    this._dragonX += dt * 0.3; if (this._dragonX > 1.3) this._dragonX = -0.3;

    // Continue reveal (slides up with a bounce) + a final victory beat.
    if (this._t >= T.cont && !this._contShown) {
      this._contShown = true;
      audio?.play('levelup'); Haptics.victory(this.game);
      this._continue.visible = true; this._continue.enabled = true;
      this.game.getSystem('animation')?.to(this._continue.bounds, 'y', this._contY, 0.5, { ease: Easing.backOut });
    }
  }

  _spawnCoin() {
    this._coinsSpawned++;
    const cx = this.bounds.centerX + (Math.random() - 0.5) * 140;
    const cy = this.bounds.h * 0.46;
    this._coins.push({
      sx: cx, sy: cy, cx: cx + (Math.random() - 0.5) * 260, cy: cy - 180 - Math.random() * 120,
      tx: this._coinCtr.x + this._coinCtr.h * 0.5, ty: this._coinCtr.y + this._coinCtr.h * 0.5,
      t: 0, dur: 0.55 + Math.random() * 0.35, spin: Math.random() * 6.28, value: this._coinValue,
    });
  }

  // --- Render ----------------------------------------------------------------
  render(r) {
    const b = this.bounds;
    // Darken + warm veil + vignette + rays keep focus on the reward.
    r.setAlpha(0.62); r.fillRect(0, 0, b.w, b.h, r.linearGradient(0, 0, 0, b.h, [[0, 'rgba(24,54,104,0.95)'], [1, 'rgba(14,40,86,0.96)']])); r.setAlpha(1);
    r.setAlpha(0.5); r.fillRect(0, 0, b.w, b.h, r.radialGradient(b.centerX, b.h * 0.4, b.w * 0.85, [[0, 'rgba(255,244,200,0.6)'], [1, 'rgba(255,244,200,0)']])); r.setAlpha(1);
    this._drawParticles(r);
    this._drawRays(r);
    this._drawDragon(r);

    // Everything scales in subtly for the "I DID IT" beat.
    const zoom = 1.03 - 0.03 * Easing.smooth(Math.min(1, this._t / T.zoom));
    const ctx = r.ctx; ctx.save(); ctx.translate(b.centerX, b.h * 0.42); ctx.scale(zoom, zoom); ctx.translate(-b.centerX, -b.h * 0.42);
    this._drawTitle(r, b.centerX, b.h * 0.24);
    this._drawStars(r, b.centerX, b.h * 0.4);
    ctx.restore();

    this._drawCoinCounter(r);
    this._drawCoins(r);

    for (const child of this.children) child.render(r);

    // Skip hint until Continue appears.
    if (!this._contShown) r.text(t('common.tapToSkip'), b.centerX, b.h - 40, { font: '700 22px system-ui, sans-serif', color: 'rgba(255,255,255,0.5)', align: 'center', baseline: 'middle' });
  }

  _drawTitle(r, cx, cy) {
    const k = Math.max(0, Math.min(1, (this._t - T.title) / 0.5));
    if (k <= 0) return;
    // 0 → 1.2 → 1.0 overshoot.
    const s = k < 1 ? Easing.backOut(k) : 1;
    const ctx = r.ctx; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    UITheme.heading(r, t('levelComplete.line1'), 0, -30, 34, '#fff');
    r.withGlow('#ffcf5e', 22, () => {
      r.text(t('levelComplete.line2'), 0, 30, { font: '900 66px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: UI.gold.deep, outlineWidth: 8 });
    });
    ctx.restore();
    // Sparkles around the title once it settles.
    if (k >= 1) {
      for (let i = 0; i < 5; i++) { const a = this._t * 1.2 + i * 1.26; const rr = 220 + Math.sin(this._t * 2 + i) * 20; r.setAlpha(0.4 + 0.4 * Math.sin(this._t * 3 + i)); r.sparkle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.4, 8, '#fff6c8'); r.setAlpha(1); }
    }
  }

  _drawStars(r, cx, cy) {
    for (let i = 0; i < 3; i++) {
      const earned = i < this._starCount;
      const x = cx + (i - 1) * 90, y = cy - Math.abs(i - 1) * 18;
      if (!earned) { r.setAlpha(0.22); this._star(r, x, y, 34, 'rgba(255,255,255,0.5)'); r.setAlpha(1); continue; }
      const at = T.star0 + i * T.starGap;
      const k = Math.max(0, Math.min(1, (this._t - at) / T.starDur));
      if (k <= 0) continue;
      // Fly in from above + back-ease scale.
      const fly = 1 - Easing.smooth(k);
      const sc = Easing.backOut(k);
      const yy = y - fly * 120;
      r.withGlow('#ffd25e', 18, () => this._star(r, x, yy, 40 * sc, '#ffe08a'));
      // Landing pop-burst.
      if (this._starPops[i] > 0) {
        const pk = this._starPops[i] / 0.5;
        r.setAlpha(1 - pk);
        for (let s = 0; s < 8; s++) { const a = s / 8 * 6.28; const rr = pk * 46; r.fillCircle(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 3 * (1 - pk) + 1, '#fff6c8'); }
        r.setAlpha(1);
      }
    }
  }

  _star(r, x, y, rr, col) {
    const ctx = r.ctx; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? rr * 0.45 : rr; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = UI.gold.deep; ctx.stroke();
  }

  _drawCoinCounter(r) {
    const c = this._coinCtr, pulse = 1 + this._counterPulse * 0.14;
    const ctx = r.ctx; ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2); ctx.scale(pulse, pulse); ctx.translate(-(c.x + c.w / 2), -(c.y + c.h / 2));
    UITheme.button(r, c.x, c.y, c.w, c.h, c.h / 2, UI.btn.orange, { shadow: true });
    this._coin(r, c.x + c.h * 0.5, c.y + c.h * 0.5, c.h * 0.32, 0);
    r.text(String(Math.round(this._coinDisplay)), c.x + c.h * 0.95, c.y + c.h / 2, { font: '900 30px system-ui, sans-serif', color: '#fff', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 3 });
    ctx.restore();
  }

  _drawCoins(r) {
    for (const c of this._coins) {
      const e = Easing.smooth(c.t);
      // Quadratic bezier through a lifted control point → satisfying arc.
      const u = 1 - e;
      const x = u * u * c.sx + 2 * u * e * c.cx + e * e * c.tx;
      const y = u * u * c.sy + 2 * u * e * c.cy + e * e * c.ty;
      const sc = 1 - e * 0.6;   // shrink while flying
      this._coin(r, x, y, 14 * sc, c.spin + this._t * 8);
    }
  }

  _coin(r, x, y, rr, spin) {
    const ctx = r.ctx;
    const sq = Math.abs(Math.cos(spin));   // fake 3D spin by squashing width
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#e0a41e'; ctx.beginPath(); ctx.ellipse(0, rr * 0.12, rr * Math.max(0.18, sq), rr * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = r.linearGradient(-rr, -rr, rr, rr, [[0, '#fff3c4'], [1, '#ffcf5e']]); ctx.beginPath(); ctx.ellipse(0, 0, rr * Math.max(0.16, sq), rr * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    if (sq > 0.5) r.text('★', 0, 1, { font: `900 ${rr}px system-ui, sans-serif`, color: '#e0a41e', align: 'center', baseline: 'middle' });
    ctx.restore();
  }

  _drawParticles(r) {
    for (const p of this._particles) { r.setAlpha(0.2 + 0.4 * (0.5 + 0.5 * Math.sin(this._t * 1.5 + p.ph))); r.fillCircle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
  }
  _drawRays(r) {
    const b = this.bounds, ctx = r.ctx; r.setAlpha(0.05);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(b.centerX, b.h * 0.34); ctx.rotate(-0.6 + i * 0.24 + Math.sin(this._t * 0.3) * 0.02); ctx.fillStyle = '#fff'; ctx.fillRect(-40, -b.h, 80, b.h * 2); ctx.restore(); }
    r.setAlpha(1);
  }
  _drawDragon(r) {
    const x = this._dragonX * this.bounds.w, y = this.bounds.h * 0.16 + Math.sin(this._t * 2) * 12, s = 24;
    const flap = Math.sin(this._t * 10) * 0.5, ctx = r.ctx;
    r.setAlpha(0.85);
    r.withGlow('#3aa8ff', 12, () => {
      r.fillCircle(x, y, s * 0.6, '#54a6ff'); ctx.fillStyle = '#54a6ff';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 1.6, y - s * (0.9 + flap)); ctx.lineTo(x - s * 0.5, y + s * 0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s, y - s * (0.7 - flap)); ctx.lineTo(x + s * 0.2, y + s * 0.3); ctx.closePath(); ctx.fill();
    });
    r.setAlpha(1);
  }

  // --- Input: tap once to fast-forward ---------------------------------------
  onTap() {
    if (this._contShown) return true;   // let the Continue button handle taps
    // Skip: snap the whole timeline to the end; rewards already granted.
    this._skipped = true;
    this._t = T.cont + 0.01;
    this._coins.length = 0;
    this._coinDisplay = this._coinTarget;
    this.game.getSystem('audio')?.play('levelup'); Haptics.victory(this.game);
    this._contShown = true;
    this._continue.visible = true; this._continue.enabled = true;
    this._continue.bounds.y = this._contY;
    return true;
  }
}
