/**
 * DailyHubScreen.js
 * -----------------------------------------------------------------------------
 * The Daily Rewards screen — redesigned as a premium, living reward moment.
 * A short "magical floating board" hovers over the animated world (sky, clouds,
 * islands, dragons, pollen) so the world is always visible behind it. Today's
 * reward is the HERO: a large, slowly-floating 3D-styled prize with light rays
 * and orbiting sparkles, sitting above a big glowing CLAIM button. A 7-day strip
 * shows the streak (claimed ✓ / today highlighted / future dimmed); Daily and
 * Weekly quests and four reward cards (Free Chest, Lucky Chest, Mystery Gift,
 * Wheel Spin) live on the world below the board.
 *
 * Pure view over RetentionSystem — same functionality as before (claimDaily /
 * claimQuest / claimWeekly / claimChest / claimMystery → `ui:showReward`).
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI, Rolling } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { Rect } from '../../utils/Rect.js';
import { DailyCalendar } from '../../config/Retention.js';
import { t } from '../../i18n/Localization.js';

const BOARD = { x: 48, y: 150, w: 984, h: 1120 };
const CLAIM = { w: 520, h: 176, x: (1080 - 520) / 2, y: 1046 };
const QUEST_Y = 1330, QUEST_H = 176;
const CARDS_Y = 1546, CARDS_H = 372;

// Map a reward key to its icon + accent for the hero + strip.
function rewardVisual(reward) {
  if (reward.big) return { icon: 'chest', color: '#ffcf5e', key: 'chest', amount: reward.coins };
  if (reward.gems) return { icon: 'gem', color: '#7cc9ff', key: 'gems', amount: reward.gems };
  if (reward.coins) return { icon: 'coins', color: '#ffcf5e', key: 'coins', amount: reward.coins };
  return { icon: 'statue', color: '#c8b48a', key: 'materials', amount: reward.materials };
}

const BOTTOM_CARDS = [
  { id: 'free', label: 'FREE CHEST', icon: 'chest', color: UI.btn.teal, action: 'chest' },
  { id: 'lucky', label: 'LUCKY CHEST', icon: 'chest', color: UI.btn.pink, toast: 'Lucky Chest — coming soon!' },
  { id: 'mystery', label: 'MYSTERY GIFT', icon: 'gem', color: UI.btn.purple, action: 'mystery' },
  { id: 'wheel', label: 'WHEEL SPIN', icon: 'rune', color: UI.btn.orange, toast: 'Wheel Spin — coming soon!' },
];

export class DailyHubScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'daily';
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._t = 0;
    this._heroSparkT = 0;
    this._sparks = [];
    this._toast = null;
    this._qRoll = new Rolling(0);
    this._wRoll = new Rolling(0);

    // Back button (top-left).
    this._back = this.add(new PremiumButton(36, 44, 88, 88,
      this._press(() => this.events.emit('ui:back')),
      { colors: UI.btn.red, round: true, rotateOnPress: 0.12, icon: (r, cx, cy, s) => {
        r.ctx.strokeStyle = '#fff'; r.ctx.lineWidth = s * 0.34; r.ctx.lineCap = 'round';
        r.ctx.beginPath(); r.ctx.moveTo(cx + s * 0.32, cy - s * 0.5); r.ctx.lineTo(cx - s * 0.42, cy); r.ctx.lineTo(cx + s * 0.32, cy + s * 0.5); r.ctx.stroke();
      } }));

    // CLAIM button (created disabled/enabled per state each frame).
    this._claim = this.add(new PremiumButton(CLAIM.x, CLAIM.y, CLAIM.w, CLAIM.h,
      this._press(() => this._onClaimDaily()),
      { label: t('daily.claimReward'), colors: UI.btn.play, radius: CLAIM.h / 2, font: '900 46px system-ui, sans-serif' }));
  }

  _ret() { return this.game.getSystem('retention'); }
  onEnter() { this.events.emit('ui:modalOpen'); }
  onExit() { this.events.emit('ui:modalClose'); }

  _press(fn) { return () => { this._tap(); fn(); }; }
  _tap() {
    this.game.getSystem('audio')?.play('button');
    const s = this.game.getSystem('settings');
    if (s?.get?.('haptics') && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }

  _onClaimDaily() {
    const ret = this._ret(); if (!ret || ret.dailyClaimed) return;
    const v = rewardVisual(ret.dailyReward());
    const reward = ret.claimDaily();
    if (reward) this.events.emit('ui:showReward', { title: t('daily.rewardTitle'), subtitle: t('daily.streak', { n: ret.streak }), icon: v.icon, color: '#37c8ff', reward, big: ret.dailyReward().big });
  }

  update(dt) {
    this._t += dt;
    this._bg.update(dt);
    const ret = this._ret();

    // CLAIM enable/label follows state.
    const canClaim = ret && !ret.dailyClaimed;
    this._claim.enabled = !!canClaim;
    this._claim.label = canClaim ? t('daily.claimReward') : t('daily.claimed');
    this._claim.colors = canClaim ? UI.btn.play : UI.btn.blue;

    // Hero sparkle burst every 4 s while claimable.
    this._heroSparkT += dt;
    if (canClaim && this._heroSparkT >= 4) { this._heroSparkT = 0; this._spawnHeroSparks(); }
    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const p = this._sparks[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
      if (p.t > p.life) this._sparks.splice(i, 1);
    }

    // Animated quest progress bars.
    const q = ret?.quest(); const w = ret?.weekly();
    if (q) this._qRoll.set(Math.min(1, q.progress / q.goal));
    if (w) this._wRoll.set(Math.min(1, w.progress / w.goal));
    this._qRoll.update(dt); this._wRoll.update(dt);

    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
  }

  _spawnHeroSparks() {
    const cx = 540, cy = BOARD.y + 470;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 240;
      this._sparks.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: 0, life: 0.9 + Math.random() * 0.5, s: 5 + Math.random() * 5 });
    }
  }

  // --- Render ----------------------------------------------------------------
  render(r) {
    this._bg.render(r);
    // Gentle cool wash so the board reads (world still visible).
    r.setAlpha(0.12); r.fillRect(0, 0, this.bounds.w, this.bounds.h, '#1e5aa0'); r.setAlpha(1);

    this._drawBoard(r);
    const ret = this._ret();
    if (ret) {
      this._drawStreak(r, ret);
      this._drawDayStrip(r, ret);
      this._drawHero(r, ret);
    }
    this._claim.render(r);
    for (const p of this._sparks) { r.setAlpha(Math.max(0, 1 - p.t / p.life)); r.sparkle(p.x, p.y, p.s, '#fff6c8'); }
    r.setAlpha(1);
    this._back.render(r);

    if (ret) { this._drawQuests(r, ret); this._drawBottomCards(r, ret); }
    if (this._toast) this._drawToast(r);
  }

  /** The floating magical board: glass body, gold frame, crystal corners. */
  _drawBoard(r) {
    const b = BOARD;
    const bob = Math.sin(this._t * 0.8) * 4;
    const y = b.y + bob;
    UITheme.glassPanel(r, b.x, y, b.w, b.h, 46);
    // Crystal corner decorations.
    const insets = [[b.x + 34, y + 34], [b.x + b.w - 34, y + 34], [b.x + 34, y + b.h - 34], [b.x + b.w - 34, y + b.h - 34]];
    for (const [dx, dy] of insets) r.withGlow('#7fe0ff', 8, () => drawObjectiveIcon(r, 'crystal', dx, dy, 18, '#8fd6ff'));
    // Title ribbon straddling the top edge.
    const rw = 460, rh = 78, rx = 540 - rw / 2, ry = y - rh * 0.42;
    r.withGlow('#ffdf7a', 12, () => UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.orange));
    r.text(t('daily.title'), 540, ry + rh / 2, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4 });
    this._boardBob = bob;
  }

  _drawStreak(r, ret) {
    const y = BOARD.y + this._boardBob + 96;
    r.text(t('daily.streak', { n: ret.streak }), 540, y, { font: '900 26px system-ui, sans-serif', color: UI.gold.deep, align: 'center', baseline: 'middle' });
  }

  /** 7-day streak strip: claimed ✓, today highlighted, future dimmed. */
  _drawDayStrip(r, ret) {
    const bob = this._boardBob;
    const innerX = BOARD.x + 34, innerW = BOARD.w - 68;
    const gap = 8, n = DailyCalendar.length;
    const cw = (innerW - gap * (n - 1)) / n, ch = 128;
    const y = BOARD.y + bob + 130;
    const today = ret.dayOfWeek;
    for (let i = 0; i < n; i++) {
      const def = DailyCalendar[i];
      const x = innerX + i * (cw + gap);
      const isToday = i === today;
      const claimed = i < today || (isToday && ret.dailyClaimed);
      const future = i > today;
      const v = rewardVisual(def);
      const col = def.big ? UI.btn.pink : (isToday ? UI.btn.teal : UI.btn.blue);
      const pop = isToday ? 1.06 + Math.sin(this._t * 3) * 0.02 : 1;
      r.save();
      r.translate(x + cw / 2, y + ch / 2); r.scale(pop, pop); r.translate(-(x + cw / 2), -(y + ch / 2));
      if (isToday && !ret.dailyClaimed) r.withGlow('#ffe08a', 14, () => UITheme.button(r, x, y, cw, ch, 16, col));
      else UITheme.button(r, x, y, cw, ch, 16, col, { shadow: !future });
      r.text(t('daily.day', { n: i + 1 }), x + cw / 2, y + 20, { font: '800 15px system-ui, sans-serif', color: 'rgba(255,255,255,0.95)', align: 'center', baseline: 'middle' });
      drawObjectiveIcon(r, v.icon, x + cw / 2, y + 62, 20, '#fff');
      r.text(String(v.amount), x + cw / 2, y + ch - 20, { font: '900 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      if (claimed) { r.setAlpha(0.6); r.fillRoundRect(x, y, cw, ch, 16, 'rgba(20,60,120,0.55)'); r.setAlpha(1);
        r.withGlow('#3fc86a', 8, () => r.text('✓', x + cw / 2, y + ch / 2, { font: '900 44px system-ui, sans-serif', color: '#eafff0', align: 'center', baseline: 'middle' })); }
      else if (future) { r.setAlpha(0.4); r.fillRoundRect(x, y, cw, ch, 16, 'rgba(20,60,120,0.4)'); r.setAlpha(1); }
      r.restore();
    }
  }

  /** HERO — today's reward: floating prize with rays + orbiting sparkles. */
  _drawHero(r, ret) {
    const v = rewardVisual(ret.dailyReward());
    const cx = 540, cy = BOARD.y + this._boardBob + 470 + Math.sin(this._t * 1.4) * 10;
    const ctx = r.ctx;
    // Rotating light rays.
    ctx.save(); ctx.globalAlpha = 0.22; ctx.translate(cx, cy); ctx.rotate(this._t * 0.3); ctx.fillStyle = v.color;
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, -230); ctx.lineTo(26, -230); ctx.closePath(); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1;
    // Coloured spotlight + white glow disc, then the rich prize.
    r.setAlpha(0.35);
    const spot = r.radialGradient(cx, cy, 190, [[0, v.color], [1, 'rgba(255,255,255,0)']]);
    r.fillRect(cx - 190, cy - 190, 380, 380, spot);
    r.setAlpha(0.5); r.fillCircle(cx, cy, 150, 'rgba(255,255,255,0.22)'); r.setAlpha(1);
    r.withGlow(v.color, 26, () => this._heroPrize(r, cx, cy, v.key));
    // Orbiting sparkles.
    for (let i = 0; i < 6; i++) {
      const a = this._t * 1.2 + (i / 6) * Math.PI * 2;
      const rad = 150 + Math.sin(this._t * 2 + i) * 10;
      r.sparkle(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.8, 8, '#fff6c8');
    }
    // Amount.
    r.withGlow(v.color, 12, () => r.text(`+${v.amount}`, cx, cy + 200, { font: '900 64px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.45)', outlineWidth: 6 }));
    // Claimed check overlay.
    if (ret.dailyClaimed) { r.withGlow('#3fc86a', 14, () => r.text('✓', cx, cy, { font: '900 150px system-ui, sans-serif', color: 'rgba(63,200,106,0.92)', align: 'center', baseline: 'middle' })); }
  }

  // --- Bespoke illustrations -------------------------------------------------

  /** Large hero prize by kind: coin pile / gem / treasure chest / crate. */
  _heroPrize(r, cx, cy, kind) {
    if (kind === 'gems') return this._gem(r, cx, cy, 110, '#3aa8ff', '#e2f4ff');
    if (kind === 'chest') return this._chest(r, cx, cy, 150);
    if (kind === 'materials') return this._gem(r, cx, cy, 110, '#c8b48a', '#f2ecdd');
    // coin pile
    this._coin(r, cx - 66, cy + 40, 62); this._coin(r, cx + 66, cy + 40, 62);
    this._coin(r, cx, cy + 52, 66);
    this._coin(r, cx - 34, cy - 6, 60); this._coin(r, cx + 34, cy - 6, 60);
    this._coin(r, cx, cy - 46, 64);
  }

  _coin(r, cx, cy, d) {
    const ctx = r.ctx; const rw = d, rh = d * 0.8;
    ctx.save();
    ctx.fillStyle = '#e0a41e';
    ctx.beginPath(); ctx.ellipse(cx, cy + rh * 0.18, rw / 2, rh / 2, 0, 0, Math.PI * 2); ctx.fill();
    const g = r.linearGradient(cx, cy - rh / 2, cx, cy + rh / 2, [[0, '#fff3c4'], [1, '#ffcf5e']]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, rw / 2, rh / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e0891e'; ctx.lineWidth = d * 0.06; ctx.stroke();
    r.text('★', cx, cy + 1, { font: `900 ${d * 0.5}px system-ui, sans-serif`, color: '#e0a41e', align: 'center', baseline: 'middle' });
    r.setAlpha(0.5); r.fillCircle(cx - rw * 0.16, cy - rh * 0.18, d * 0.08, '#fff'); r.setAlpha(1);
    ctx.restore();
  }

  _gem(r, cx, cy, s, core, light) {
    const ctx = r.ctx; ctx.save();
    const top = cy - s * 0.7, bot = cy + s;
    const pts = [[cx, top], [cx - s * 0.7, cy - s * 0.2], [cx - s * 0.42, cy - s * 0.55], [cx + s * 0.42, cy - s * 0.55], [cx + s * 0.7, cy - s * 0.2], [cx, bot]];
    const g = r.linearGradient(cx, top, cx, bot, [[0, light], [0.5, core], [1, core]]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, top);
    ctx.lineTo(cx - s * 0.7, cy - s * 0.2); ctx.lineTo(cx, bot); ctx.lineTo(cx + s * 0.7, cy - s * 0.2); ctx.closePath(); ctx.fill();
    // Facet lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy - s * 0.2); ctx.lineTo(cx + s * 0.7, cy - s * 0.2);
    ctx.moveTo(cx, top); ctx.lineTo(cx, bot); ctx.moveTo(cx - s * 0.7, cy - s * 0.2); ctx.lineTo(cx, cy - s * 0.2);
    ctx.stroke();
    r.sparkle(cx - s * 0.22, cy - s * 0.34, s * 0.16, '#ffffff');
    ctx.restore();
  }

  _chest(r, cx, cy, s) {
    const ctx = r.ctx; ctx.save();
    const w = s, h = s * 0.72, x = cx - w / 2, y = cy - h * 0.2;
    // Base.
    r.fillRoundRect(x, y, w, h, 12, '#e0a41e');
    r.fillRoundRect(x, y, w, h * 0.4, 12, '#ffcf5e');
    // Gold bands.
    r.fillRoundRect(cx - w * 0.06, y, w * 0.12, h, 4, '#e0891e');
    // Lid.
    const ly = y - h * 0.42;
    r.fillRoundRect(x - 4, ly, w + 8, h * 0.5, 12, '#ffcf5e');
    UITheme.goldFrame(r, x - 4, ly, w + 8, h * 0.5, 12, 3);
    // Lock.
    r.fillCircle(cx, y + h * 0.05, w * 0.09, '#fff3c4');
    UITheme.goldFrame(r, x - 4, ly, w + 8, h + h * 0.42, 12, 3);
    // Sparkle spill.
    r.withGlow('#fff', 10, () => { r.sparkle(cx - w * 0.2, ly - 6, s * 0.1, '#fff6c8'); r.sparkle(cx + w * 0.22, ly + 4, s * 0.08, '#fff6c8'); });
    ctx.restore();
  }

  /** Bottom-card mini illustrations (white line/fill style). */
  _miniChest(r, cx, cy, s, star) {
    r.fillRoundRect(cx - s, cy - s * 0.2, s * 2, s * 1.2, s * 0.2, '#fff');
    r.fillRoundRect(cx - s * 1.05, cy - s * 0.7, s * 2.1, s * 0.6, s * 0.2, '#fff');
    r.ctx.fillStyle = '#fff'; r.fillCircle(cx, cy + s * 0.1, s * 0.16, 'rgba(0,0,0,0)');
    r.strokeRoundRect(cx - s * 0.12, cy - s * 0.7, s * 0.24, s * 1.5, s * 0.1, 'rgba(255,255,255,0.5)', s * 0.12);
    if (star) r.withGlow('#fff', 8, () => r.sparkle(cx + s * 1.0, cy - s * 0.8, s * 0.5, '#fff'));
  }
  _miniGift(r, cx, cy, s) {
    r.fillRoundRect(cx - s, cy - s * 0.1, s * 2, s * 1.1, s * 0.16, '#fff');
    r.fillRoundRect(cx - s * 1.05, cy - s * 0.55, s * 2.1, s * 0.5, s * 0.16, '#fff');
    r.ctx.strokeStyle = 'rgba(0,0,0,0)'; // ribbon via cutout look
    r.fillRoundRect(cx - s * 0.14, cy - s * 0.55, s * 0.28, s * 1.55, s * 0.1, 'rgba(120,190,255,0.9)');
    r.fillCircle(cx - s * 0.3, cy - s * 0.7, s * 0.28, '#fff');
    r.fillCircle(cx + s * 0.3, cy - s * 0.7, s * 0.28, '#fff');
  }
  _miniWheel(r, cx, cy, s) {
    const ctx = r.ctx; ctx.save();
    r.fillCircle(cx, cy, s, '#fff');
    ctx.strokeStyle = 'rgba(120,190,255,0.9)'; ctx.lineWidth = s * 0.12;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * s * 0.85, cy + Math.sin(a) * s * 0.85); ctx.stroke(); }
    r.fillCircle(cx, cy, s * 0.22, '#3aa8ff');
    // Pointer.
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy - s * 1.28); ctx.lineTo(cx - s * 0.22, cy - s * 0.9); ctx.lineTo(cx + s * 0.22, cy - s * 0.9); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _drawQuests(r, ret) {
    const q = ret.quest(), w = ret.weekly();
    const gap = 12, cw = (this.bounds.w - 64 - gap) / 2, x0 = 32;
    if (q) this._questCard(r, x0, QUEST_Y, cw, QUEST_H, t('daily.quest'), q, this._qRoll.display, 'rune', UI.btn.orange);
    if (w) this._questCard(r, x0 + cw + gap, QUEST_Y, cw, QUEST_H, t('daily.weekly'), w, this._wRoll.display, 'dragon', UI.btn.purple);
  }

  _questCard(r, x, y, w, h, heading, snap, frac, icon, color) {
    UITheme.glassPanel(r, x, y, w, h, 28);
    r.withGlow(color[1], 8, () => { r.fillCircle(x + 54, y + 58, 34, color[1]); drawObjectiveIcon(r, icon, x + 54, y + 58, 20, '#fff'); });
    r.text(heading, x + 100, y + 40, { font: '900 20px system-ui, sans-serif', color: UI.gold.deep, baseline: 'middle' });
    r.text(snap.text, x + 100, y + 74, { font: '800 20px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
    // Progress bar.
    const bx = x + 28, bw = w - 56, by = y + h - 46;
    r.fillRoundRect(bx, by, bw, 20, 10, 'rgba(35,58,114,0.18)');
    r.fillRoundRect(bx, by, bw * frac, 20, 10, color[1]);
    r.text(`${snap.progress}/${snap.goal}`, bx + bw - 8, by + 10, { font: '800 16px system-ui, sans-serif', color: UI.inkSoft, align: 'right', baseline: 'middle' });
    // Claim pill when complete.
    if (snap.complete && !snap.claimed) {
      const pw = 120, ph = 44, px = x + w - pw - 20, py = y + 22;
      r.withGlow('#ffe08a', 10, () => UITheme.button(r, px, py, pw, ph, ph / 2, UI.btn.play));
      r.text(t('common.claim'), px + pw / 2, py + ph / 2, { font: '900 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      this[`_${heading}Claim`] = new Rect(px, py, pw, ph);
    } else this[`_${heading}Claim`] = null;
    if (heading === t('daily.quest')) this._questRect = new Rect(x, y, w, h);
    else this._weeklyRect = new Rect(x, y, w, h);
  }

  _drawBottomCards(r, ret) {
    const gap = 20, n = BOTTOM_CARDS.length, cw = (this.bounds.w - 64 - gap * (n - 1)) / n, x0 = 32;
    this._cardRects = [];
    BOTTOM_CARDS.forEach((c, i) => {
      const x = x0 + i * (cw + gap), y = CARDS_Y + Math.sin(this._t * 1.5 + i) * 6;
      const enabled = c.id === 'free' ? !ret.chestClaimed : c.id === 'mystery' ? !ret.mysteryClaimed : true;
      r.withGlow(c.color[1], enabled ? 10 : 0, () => UITheme.button(r, x, y, cw, CARDS_H, 30, enabled ? c.color : UI.btn.blue, { shadow: enabled }));
      if (!enabled) { r.setAlpha(0.5); r.fillRoundRect(x, y, cw, CARDS_H, 30, 'rgba(20,60,120,0.5)'); r.setAlpha(1); }
      const iy = y + CARDS_H * 0.36, isz = 30;
      r.setAlpha(enabled ? 1 : 0.7);
      if (c.id === 'free') this._miniChest(r, x + cw / 2, iy, isz, false);
      else if (c.id === 'lucky') this._miniChest(r, x + cw / 2, iy, isz, true);
      else if (c.id === 'mystery') this._miniGift(r, x + cw / 2, iy, isz);
      else this._miniWheel(r, x + cw / 2, iy, isz);
      r.setAlpha(1);
      r.text(c.label, x + cw / 2, y + CARDS_H * 0.68, { font: '800 17px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      const status = (c.id === 'free' || c.id === 'mystery') ? (enabled ? t('common.free') : '✓') : 'OPEN';
      r.text(status, x + cw / 2, y + CARDS_H * 0.84, { font: '900 18px system-ui, sans-serif', color: enabled ? UI.gold.mid : '#eafff0', align: 'center', baseline: 'middle' });
      this._cardRects.push({ rect: new Rect(x, CARDS_Y, cw, CARDS_H), c });
    });
  }

  _drawToast(r) {
    const a = Math.min(1, this._toast.t * 2);
    r.setAlpha(a);
    const w = 620, h = 90, x = 540 - w / 2, y = 1200 - h / 2;
    UITheme.glassPanel(r, x, y, w, h, 26);
    r.text(this._toast.text, 540, y + h / 2, { font: '800 28px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle' });
    r.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    const ret = this._ret(); if (!ret) return false;
    const show = (reward, reveal) => { if (reward) this.events.emit('ui:showReward', reveal); };
    // Quest claim pills.
    const qc = this[`_${t('daily.quest')}Claim`];
    if (qc?.contains(px, py)) { this._tap(); show(ret.claimQuest(), { title: t('daily.questDone'), icon: 'rune', color: '#8a4fe0', reward: ret.quest()?.reward }); return true; }
    const wc = this[`_${t('daily.weekly')}Claim`];
    if (wc?.contains(px, py)) { this._tap(); show(ret.claimWeekly(), { title: t('daily.weeklyDone'), icon: 'gem', color: '#8a4fe0', reward: ret.weekly()?.reward, big: true }); return true; }
    // Bottom cards.
    for (const { rect, c } of (this._cardRects || [])) {
      if (rect.contains(px, py)) {
        this._tap();
        if (c.action === 'chest') { const rw = ret.claimChest(); show(rw, { title: t('daily.chest'), icon: 'chest', color: '#ffb020', reward: rw }); }
        else if (c.action === 'mystery') { const rw = ret.claimMystery(); show(rw, { title: t('daily.mystery'), icon: 'gem', color: '#28e0d0', reward: rw }); }
        else this._toast = { text: c.toast, t: 2.0 };
        return true;
      }
    }
    return false;
  }
}
