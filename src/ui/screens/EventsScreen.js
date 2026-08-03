/**
 * EventsScreen.js
 * -----------------------------------------------------------------------------
 * The live-ops hub, anchored by the real WEEKLY EVENT. It is a pure view over
 * the RetentionSystem: the featured card shows the actual rotating weekly
 * challenge — themed name, a milestone progress track, the reward, a live "ends
 * in" countdown and a working CLAIM. A secondary tile mirrors today's daily
 * quest and routes to the Daily Rewards hub for the rest of the loop.
 *
 * Nothing here changes gameplay; it surfaces state the systems already own.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { clamp } from '../../utils/MathUtils.js';
import { t } from '../../i18n/Localization.js';

/** Reward key → icon + accent for the little reward chips. */
const REWARD_ICON = { gems: ['gem', '#7cc9ff'], coins: ['coins', '#ffcf5e'], materials: ['statue', '#c8b48a'], essence: ['rune', '#28e0d0'] };

export class EventsScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.events'), { showTopBar: true });
    this.name = 'events';
    this._frac = 0;          // animated progress fraction
    this._pulse = 0;
    this._claimBtn = null;    // Rect when the weekly is claimable
    this._dailyBtn = null;    // Rect for the daily-quest tile
  }

  _ret() { return this.game.getSystem('retention'); }

  // Featured banner (30 + 250) + CLAIM button (60, +20 gap) + daily tile (~130).
  contentHeight() { return 30 + 250 + 20 + 60 + 26 + 130 + 24; }

  onUpdate(dt) {
    this._pulse += dt;
    const w = this._ret()?.weekly();
    const target = w ? clamp(w.progress / w.goal, 0, 1) : 0;
    this._frac += (target - this._frac) * Math.min(1, dt * 6);
  }

  /** "2d 14h" / "6h 12m" countdown to the week's end. */
  _fmtCountdown(ms) {
    const h = Math.floor(ms / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  drawContent(r, p) {
    const ret = this._ret();
    const w = ret?.weekly();
    if (!w) return;
    const pad = 24;
    const colors = this._eventColors(w.color);

    // --- Featured weekly event banner ---------------------------------------
    const f = new Rect(p.x + pad, p.y + 30, p.w - pad * 2, 250);
    r.withGlow(colors[1], 14, () => UITheme.button(r, f.x, f.y, f.w, f.h, 24, colors));
    r.setAlpha(0.45); r.fillRoundRect(f.x + 10, f.y + 10, f.w - 20, f.h * 0.24, 16, 'rgba(255,255,255,0.5)'); r.setAlpha(1);

    // "WEEKLY EVENT" kicker + live countdown pill (top corners).
    r.text('WEEKLY EVENT', f.x + 22, f.y + 26, { font: '900 14px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', baseline: 'middle' });
    const cd = this._fmtCountdown(ret.weekEndsInMs);
    const tw = 132, th = 30, tx = f.right - tw - 16, tyy = f.y + 12;
    UITheme.chip(r, tx, tyy, tw, th, '#ffcf5e');
    r.text(`⏳ ${cd}`, tx + tw / 2, tyy + th / 2, { font: '800 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Icon + title + blurb.
    r.withGlow('#fff', 14, () => drawObjectiveIcon(r, w.icon, f.x + 74, f.y + f.h * 0.44, 40, '#fff'));
    r.text(w.name, f.x + 140, f.y + f.h * 0.36, { font: '900 30px system-ui, sans-serif', color: '#fff', baseline: 'middle', outline: 'rgba(20,44,92,0.35)', outlineWidth: 4 });
    r.text(w.blurb, f.x + 140, f.y + f.h * 0.36 + 32, { font: '700 15px system-ui, sans-serif', color: 'rgba(255,255,255,0.92)', baseline: 'middle' });

    // --- Milestone progress track -------------------------------------------
    const tkx = f.x + 30, tkw = f.w - 60, tky = f.y + f.h * 0.66, tkh = 16;
    r.fillRoundRect(tkx, tky, tkw, tkh, tkh / 2, 'rgba(20,44,92,0.28)');
    r.fillRoundRect(tkx, tky, tkw * this._frac, tkh, tkh / 2, '#fff');
    // Milestone chests along the track.
    for (const m of w.milestones) {
      const mx = tkx + tkw * m, lit = this._frac >= m - 0.001;
      const isFinal = m >= 0.999;
      const sz = isFinal ? 20 : 15;
      if (lit) r.withGlow('#ffe08a', 12, () => drawObjectiveIcon(r, 'chest', mx, tky + tkh / 2, sz, '#ffcf5e'));
      else { r.setAlpha(0.55); drawObjectiveIcon(r, 'chest', mx, tky + tkh / 2, sz, 'rgba(255,255,255,0.85)'); r.setAlpha(1); }
    }
    // Progress text.
    r.text(`${w.progress} / ${w.goal}`, tkx, tky + 34, { font: '800 15px system-ui, sans-serif', color: '#fff', baseline: 'middle' });

    // Reward chips (right of the progress text).
    let chipX = f.right - 30;
    for (const [k, v] of Object.entries(w.reward)) {
      const [icon, col] = REWARD_ICON[k] ?? ['gem', '#fff'];
      const label = `+${v}`;
      const cw2 = 34 + label.length * 11;
      chipX -= cw2 + 8;
      UITheme.chip(r, chipX, tky + 22, cw2, 26, col);
      drawObjectiveIcon(r, icon, chipX + 15, tky + 35, 9, '#fff');
      r.text(label, chipX + 27, tky + 35, { font: '800 13px system-ui, sans-serif', color: '#fff', baseline: 'middle' });
    }

    // --- CLAIM button --------------------------------------------------------
    const bw = f.w * 0.6, bh = 60, bx = f.centerX - bw / 2, by = f.bottom + 20;
    if (w.claimed) {
      UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.blue);
      r.text('CLAIMED  ✓', f.centerX, by + bh / 2, { font: '900 22px system-ui, sans-serif', color: '#eafff0', align: 'center', baseline: 'middle' });
      this._claimBtn = null;
    } else if (w.complete) {
      const pop = 1 + 0.03 * Math.sin(this._pulse * 5);
      r.save();
      r.translate(f.centerX, by + bh / 2); r.scale(pop, pop); r.translate(-f.centerX, -(by + bh / 2));
      r.withGlow('#ffe08a', 16, () => UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.play));
      r.text(t('common.claim'), f.centerX, by + bh / 2, { font: '900 24px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4 });
      r.restore();
      this._claimBtn = new Rect(bx, by, bw, bh);
    } else {
      r.setAlpha(0.85);
      UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.blue);
      r.text('KEEP PLAYING', f.centerX, by + bh / 2, { font: '900 20px system-ui, sans-serif', color: 'rgba(255,255,255,0.92)', align: 'center', baseline: 'middle' });
      r.setAlpha(1);
      this._claimBtn = null;
    }

    // --- Daily quest tile (routes to the Daily Rewards hub) ------------------
    const q = ret.quest();
    const dY = by + bh + 26, dH = p.y + p.h - dY - 20;
    if (q && dH > 90) {
      const dx = p.x + pad, dw = p.w - pad * 2, dh = Math.min(dH, 130), dy = dY;
      UITheme.glassPanel(r, dx, dy, dw, dh, 22);
      r.withGlow(UI.btn.orange[1], 8, () => { r.fillCircle(dx + 48, dy + 48, 30, UI.btn.orange[1]); drawObjectiveIcon(r, 'rune', dx + 48, dy + 48, 17, '#fff'); });
      r.text(t('daily.quest'), dx + 92, dy + 34, { font: '900 18px system-ui, sans-serif', color: UI.gold.deep, baseline: 'middle' });
      r.text(q.text, dx + 92, dy + 62, { font: '800 17px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
      const qbx = dx + 92, qbw = dw - 92 - 150, qby = dy + dh - 34;
      r.fillRoundRect(qbx, qby, qbw, 12, 6, 'rgba(35,58,114,0.18)');
      r.fillRoundRect(qbx, qby, qbw * clamp(q.progress / q.goal, 0, 1), 12, 6, UI.btn.orange[1]);
      r.text(`${q.progress}/${q.goal}`, qbx + qbw + 10, qby + 6, { font: '800 14px system-ui, sans-serif', color: UI.inkSoft, baseline: 'middle' });
      // "MORE ▸" affordance.
      const mw = 96, mh = 40, mx = dx + dw - mw - 16, my = dy + dh / 2 - mh / 2;
      UITheme.button(r, mx, my, mw, mh, mh / 2, UI.btn.teal);
      r.text('MORE ▸', mx + mw / 2, my + mh / 2, { font: '900 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      this._dailyBtn = new Rect(dx, dy, dw, dh);
    } else {
      this._dailyBtn = null;
    }
  }

  /** Build a [dark, mid] gradient pair for a themed event color. */
  _eventColors(hex) {
    return [this._shade(hex, -0.18), hex];
  }

  _shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 1 + amt : amt, base = amt < 0 ? 0 : 255;
    r = Math.round((base - r) * (amt < 0 ? 1 - f : f) + r);
    g = Math.round((base - g) * (amt < 0 ? 1 - f : f) + g);
    b = Math.round((base - b) * (amt < 0 ? 1 - f : f) + b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  onContentTap(px, py) {
    const ret = this._ret();
    if (ret && this._claimBtn?.contains(px, py)) {
      const snap = ret.weekly();
      const reward = ret.claimWeekly();
      if (reward) {
        this.game.getSystem('audio')?.play('reward');
        this.events.emit('ui:showReward', { title: `${snap.name} Complete!`, subtitle: 'Weekly event reward', icon: snap.icon, color: snap.color, reward, big: true });
      }
      return true;
    }
    if (this._dailyBtn?.contains(px, py)) { this.events.emit('ui:openDaily'); return true; }
    return false;
  }
}
