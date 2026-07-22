/**
 * DailyHubScreen.js
 * -----------------------------------------------------------------------------
 * The "welcome back" hub — the first thing worth opening each session. It lays
 * out the whole DAILY LOOP in one glance: an escalating 7-day login calendar
 * with the streak, a rotating daily quest, a free chest, a mystery gift, plus
 * the WEEKLY challenge and a collection nudge. Every item here is FREE; claiming
 * one hands off to the celebratory RewardScreen.
 *
 * The screen is a pure view over the RetentionSystem: it reads live state each
 * frame, so it always reflects what has already been claimed without holding
 * any state of its own.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { DailyCalendar } from '../../config/Retention.js';
import { t } from '../../i18n/Localization.js';

// How each reward currency shows up on the little calendar pills.
const KEY_ICON = { coins: 'coins', gems: 'gem', materials: 'statue', essence: 'crystal' };
const KEY_COLOR = { coins: '#ffcf5e', gems: '#7cc9ff', materials: '#c8b48a', essence: '#b98cff' };

export class DailyHubScreen extends PanelScreen {
  constructor(game) {
    super(game, t('daily.title'), { showTopBar: true });
    this.name = 'daily';
    this._hit = {};   // named tap rects, rebuilt each frame in drawContent
  }

  _ret() { return this.game.getSystem('retention'); }

  drawContent(r, p) {
    const ret = this._ret();
    if (!ret) return;
    this._hit = {};
    const pad = 20;
    const x = p.x + pad, w = p.w - pad * 2;
    let y = p.y + 48;

    // --- Streak header (below the title ribbon) ---
    r.text(t('daily.streak', { n: ret.streak }), p.centerX, y, {
      font: '900 20px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
    });
    y += 34;

    // --- 7-day login calendar ---
    const cols = DailyCalendar.length;
    const gap = 6, cw = (w - gap * (cols - 1)) / cols, ch = 74;
    const today = ret.dayOfWeek;
    for (let i = 0; i < cols; i++) {
      const cx = x + i * (cw + gap);
      const def = DailyCalendar[i];
      const isToday = i === today;
      const claimed = i < today || (isToday && ret.dailyClaimed);
      const col = def.big ? UI.btn.pink : (isToday ? UI.btn.teal : UI.btn.blue);
      if (isToday && !ret.dailyClaimed) r.withGlow('#ffe08a', 14, () => UITheme.button(r, cx, y, cw, ch, 12, col));
      else UITheme.button(r, cx, y, cw, ch, 12, col);
      r.text(t('daily.day', { n: i + 1 }), cx + cw / 2, y + 14, {
        font: '800 10px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle',
      });
      const key = Object.keys(def).find((k) => k !== 'big');
      drawObjectiveIcon(r, KEY_ICON[key] || 'coins', cx + cw / 2, y + 40, 12, KEY_COLOR[key] || '#ffcf5e');
      r.text(String(def[key]), cx + cw / 2, y + ch - 12, {
        font: '900 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
      });
      if (claimed) { r.setAlpha(0.55); r.fillRoundRect(cx, y, cw, ch, 12, 'rgba(60,96,150,0.5)'); r.setAlpha(1);
        r.text('✓', cx + cw / 2, y + ch / 2, { font: '900 26px system-ui, sans-serif', color: UI.white, align: 'center', baseline: 'middle' }); }
    }
    y += ch + 22;

    // --- Claim daily button ---
    const canDaily = !ret.dailyClaimed;
    this._hit.daily = this._actionBar(r, x, y, w, 58, canDaily ? t('daily.claimReward') : t('daily.claimed'), canDaily, UI.btn.play);
    y += 58 + 22;

    // --- Daily quest ---
    const q = ret.quest();
    if (q) { this._hit.quest = this._questCard(r, x, y, w, t('daily.quest'), q); y += 82 + 20; }

    // --- Weekly challenge ---
    const wk = ret.weekly();
    if (wk) { this._hit.weekly = this._questCard(r, x, y, w, t('daily.weekly'), wk, UI.btn.purple); y += 82 + 20; }

    // --- Free chest + mystery gift (side by side) ---
    const half = (w - 12) / 2;
    this._hit.chest = this._giftCard(r, x, y, half, t('daily.chest'), 'chest', '#ffb020', !ret.chestClaimed);
    this._hit.mystery = this._giftCard(r, x + half + 12, y, half, t('daily.mystery'), 'gem', '#28e0d0', !ret.mysteryClaimed);
    y += 104 + 10;

    // --- Collection nudge ---
    const c = ret.collection();
    r.text(t('daily.collection', { a: c.owned, b: c.total }), p.centerX, p.y + p.h - 20, {
      font: '800 14px system-ui, sans-serif', color: 'rgba(255,255,255,0.85)', align: 'center', baseline: 'middle',
    });
  }

  /** A single full-width action button; returns its rect (null when disabled). */
  _actionBar(r, x, y, w, h, label, enabled, colors) {
    UITheme.button(r, x, y, w, h, h / 2, enabled ? colors : UI.btn.blue, { shadow: enabled });
    if (!enabled) { r.setAlpha(0.45); r.fillRoundRect(x, y, w, h, h / 2, 'rgba(60,96,150,0.42)'); r.setAlpha(1); }
    r.text(label, x + w / 2, y + h / 2, {
      font: '900 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
    return enabled ? new Rect(x, y, w, h) : null;
  }

  /** A quest/weekly progress card with an inline Claim pill when complete. */
  _questCard(r, x, y, w, heading, q, color = UI.btn.orange) {
    const h = 82;
    UITheme.glassPanel(r, x, y, w, h, 16);
    r.text(heading, x + 16, y + 20, { font: '900 13px system-ui, sans-serif', color: UI.gold.deep, baseline: 'middle' });
    r.text(q.text, x + 16, y + 42, { font: '800 15px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
    // Progress bar.
    const barX = x + 16, barW = w - 32, barY = y + h - 20;
    r.fillRoundRect(barX, barY, barW, 8, 4, 'rgba(35,58,114,0.18)');
    r.fillRoundRect(barX, barY, barW * Math.min(1, q.progress / q.goal), 8, 4, color[1]);
    r.text(`${q.progress}/${q.goal}`, x + w - 16, y + 20, {
      font: '800 12px system-ui, sans-serif', color: UI.inkSoft, align: 'right', baseline: 'middle',
    });
    // Claim pill (only when complete & unclaimed).
    if (q.complete && !q.claimed) {
      const bw = 88, bh = 34, bx = x + w - bw - 12, by = y + 38;
      r.withGlow('#ffe08a', 10, () => UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.play));
      r.text(t('common.claim'), bx + bw / 2, by + bh / 2, { font: '900 14px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      return new Rect(bx, by, bw, bh);
    }
    if (q.claimed) r.text('✓', x + w - 20, y + 48, { font: '900 20px system-ui, sans-serif', color: UI.btn.play[1], align: 'right', baseline: 'middle' });
    return null;
  }

  /** A small free-gift card (chest / mystery). */
  _giftCard(r, x, y, w, label, icon, color, enabled) {
    const h = 104;
    UITheme.button(r, x, y, w, h, 16, enabled ? UI.btn.teal : UI.btn.blue, { shadow: enabled });
    if (!enabled) { r.setAlpha(0.5); r.fillRoundRect(x, y, w, h, 16, 'rgba(60,96,150,0.46)'); r.setAlpha(1); }
    drawObjectiveIcon(r, icon, x + w / 2, y + 36, 20, enabled ? color : 'rgba(255,255,255,0.6)');
    r.text(label, x + w / 2, y + 68, { font: '800 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    r.text(enabled ? t('common.free') : '✓', x + w / 2, y + 88, {
      font: '900 14px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
    return enabled ? new Rect(x, y, w, h) : null;
  }

  onContentTap(px, py) {
    const ret = this._ret(); if (!ret) return false;
    const hit = (name) => this._hit[name]?.contains(px, py);
    let reward = null, reveal = null;
    if (hit('daily')) { reward = ret.claimDaily(); reveal = { title: t('daily.rewardTitle'), subtitle: t('daily.streak', { n: ret.streak }), icon: 'chest', color: '#37c8ff', reward, big: ret.dailyReward().big }; }
    else if (hit('quest')) { reward = ret.claimQuest(); reveal = { title: t('daily.questDone'), icon: 'rune', color: '#8a4fe0', reward }; }
    else if (hit('weekly')) { reward = ret.claimWeekly(); reveal = { title: t('daily.weeklyDone'), icon: 'gem', color: '#8a4fe0', reward, big: true }; }
    else if (hit('chest')) { reward = ret.claimChest(); reveal = { title: t('daily.chest'), icon: 'chest', color: '#ffb020', reward }; }
    else if (hit('mystery')) { reward = ret.claimMystery(); reveal = { title: t('daily.mystery'), icon: 'gem', color: '#28e0d0', reward }; }
    else return false;

    if (reward) this.events.emit('ui:showReward', reveal);
    return true;
  }
}
