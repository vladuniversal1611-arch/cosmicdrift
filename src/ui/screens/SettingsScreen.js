/**
 * SettingsScreen.js
 * -----------------------------------------------------------------------------
 * Simple, elegant settings with animated glass toggle switches (a knob that
 * slides with easing and a colour that fades between on/off). Reads and writes
 * through the SettingsSystem, plus a "reset progress" action.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UI } from '../theme/UITheme.js';
import { clamp } from '../../utils/MathUtils.js';
import { t, L } from '../../i18n/Localization.js';

const ROWS = [
  { key: 'muted', labelKey: 'settings.audio', invert: true },
  { key: 'haptics', labelKey: 'settings.haptics' },
  { key: 'reducedMotion', labelKey: 'settings.reducedMotion' },
  { key: 'colorBlind', labelKey: 'settings.colorBlind' },
  { key: 'lowPerformance', labelKey: 'settings.lowPerformance' },
  { key: 'largeUI', labelKey: 'settings.largeUI' },
];

export class SettingsScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.settings'));
    this.name = 'settings';
    this._anim = {};                 // eased 0..1 per row
    const s = game.getSystem('settings');
    for (const row of ROWS) this._anim[row.key] = this._on(s, row) ? 1 : 0;
  }

  _on(s, row) { const v = s?.get(row.key); return row.invert ? !v : !!v; }

  // Use the FULL panel (~80% of the screen) — content is scaled up and spread to
  // fill it comfortably, not shrunk into a small card.
  contentHeight() { return null; }

  /** Row rects (6 toggles + language + block) spread to FILL the panel, with the
   *  reset button pinned near the foot. Row height + gaps derive from the panel
   *  height, so elements + fonts scale up on tall screens. Shared by draw + tap. */
  _layout() {
    const p = this.panel;
    const x = p.x + p.w * 0.05, w = p.w * 0.9;
    const top = p.y + p.h * 0.06;
    const resetH = clamp(p.h * 0.07, 48, 78);
    const bottom = p.bottom - resetH - p.h * 0.05;   // rows live above the reset
    const N = ROWS.length + 2;                        // + language + block-style
    const region = bottom - top;
    // Comfortable row height, then distribute any leftover space as even gaps so
    // the rows fill the region without becoming oversized.
    const rowH = clamp(region / (N * 1.35), 84, 150);
    const gap = Math.max(10, (region - rowH * N) / (N - 1));
    const rows = [];
    for (let i = 0; i < N; i++) rows.push(new Rect(x, top + i * (rowH + gap), w, rowH));
    const reset = new Rect(p.centerX - w * 0.28, p.bottom - resetH - p.h * 0.035, w * 0.56, resetH);
    return { rows, rowH, reset };
  }

  onUpdate(dt) {
    const s = this.game.getSystem('settings');
    for (const row of ROWS) {
      const target = this._on(s, row) ? 1 : 0;
      this._anim[row.key] += (target - this._anim[row.key]) * Math.min(1, dt * 12);
    }
  }

  _rowCard(r, rect, label, fontPx) {
    const rad = Math.min(28, rect.h * 0.28);
    r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, rad, 'rgba(255,255,255,0.66)');
    r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, rad, 'rgba(120,140,200,0.42)', 2);
    r.text(label, rect.x + rect.h * 0.42, rect.centerY, { font: `800 ${fontPx}px system-ui, sans-serif`, color: UI.ink, baseline: 'middle' });
  }

  drawContent(r) {
    const { rows, rowH, reset } = this._layout();
    // Everything scales with the (panel-derived) row height so the card reads big
    // and comfortable on tall screens instead of tiny.
    const labelFont = clamp(Math.round(rowH * 0.3), 20, 40);
    const pillFont = clamp(Math.round(rowH * 0.26), 18, 34);
    const tw = clamp(rowH * 1.55, 78, 150), thh = clamp(rowH * 0.62, 40, 78);
    const pw = clamp(rows[0].w * 0.34, 170, 340), ph = clamp(rowH * 0.66, 46, 90);
    const pad = rowH * 0.42;

    this._toggleRects = [];
    ROWS.forEach((row, i) => {
      const rect = rows[i];
      this._toggleRects.push({ row, rect });
      this._rowCard(r, rect, t(row.labelKey), labelFont);
      this._toggle(r, rect.right - tw - pad, rect.centerY - thh / 2, tw, thh, this._anim[row.key]);
    });

    const pill = (rect, colors, text) => {
      const px = rect.right - pw - pad, py = rect.centerY - ph / 2;
      r.fillRoundRect(px, py, pw, ph, ph / 2, colors);
      r.text(text, px + pw / 2, rect.centerY, { font: `800 ${pillFont}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle' });
    };

    // Language row.
    const lr = rows[ROWS.length];
    this._langRect = lr;
    this._rowCard(r, lr, t('settings.language'), labelFont);
    pill(lr, UI.btn.blue[1], L.currentName());

    // Block-style row.
    const br = rows[ROWS.length + 1];
    this._blockRect = br;
    this._rowCard(r, br, t('settings.blockStyle'), labelFont);
    const skin = this.game.getSystem('settings')?.get('blockSkin') || 'friends';
    pill(br, UI.btn.play[1], t(skin === 'gems' ? 'settings.blockGems' : 'settings.blockFriends'));

    // Reset progress button (pinned at the foot).
    this._resetRect = reset;
    r.fillRoundRect(reset.x, reset.y, reset.w, reset.h, reset.h / 2, 'rgba(224,67,63,0.16)');
    r.strokeRoundRect(reset.x, reset.y, reset.w, reset.h, reset.h / 2, UI.btn.red[1], 2.5);
    const rLabel = t('settings.reset');
    let rf = clamp(Math.round(reset.h * 0.34), 16, 30); r.ctx.font = `800 ${rf}px system-ui, sans-serif`;
    while (rf > 12 && r.ctx.measureText(rLabel).width > reset.w - 30) { rf -= 1; r.ctx.font = `800 ${rf}px system-ui, sans-serif`; }
    r.text(rLabel, reset.centerX, reset.centerY, { font: `800 ${rf}px system-ui, sans-serif`, color: UI.btn.red[1], align: 'center', baseline: 'middle' });
  }

  _toggle(r, x, y, w, h, t) {
    const off = 'rgba(150,160,190,0.6)';
    const on = UI.btn.play[1];
    const col = t > 0.5 ? on : off;
    r.fillRoundRect(x, y, w, h, h / 2, col);
    r.withGlow(t > 0.5 ? on : 'rgba(0,0,0,0)', 8, () => {
      const kx = x + h / 2 + (w - h) * clamp(t, 0, 1);
      r.fillCircle(kx, y + h / 2, h * 0.42, '#fff');
    });
  }

  onContentTap(px, py) {
    for (const { row, rect } of (this._toggleRects || [])) {
      if (rect.contains(px, py)) {
        this.game.getSystem('settings')?.toggle(row.key);
        this.game.getSystem('audio')?.play('pickup');
        return true;
      }
    }
    // Cycle language (EN ↔ UK …). Takes effect on the next frame everywhere.
    if (this._langRect?.contains(px, py)) {
      const langs = L.languages;
      const next = langs[(langs.indexOf(L.language) + 1) % langs.length];
      this.game.getSystem('settings')?.set('language', next);
      this.game.getSystem('audio')?.play('pickup');
      return true;
    }
    // Switch block style (Friends ↔ Gems); takes effect live everywhere.
    if (this._blockRect?.contains(px, py)) {
      const s = this.game.getSystem('settings');
      s?.set('blockSkin', (s.get('blockSkin') || 'friends') === 'friends' ? 'gems' : 'friends');
      this.game.getSystem('audio')?.play('pickup');
      return true;
    }
    if (this._resetRect?.contains(px, py)) {
      this.game.getSystem('save')?.reset();
      this.game.getSystem('audio')?.play('invalid');
      return true;
    }
    return false;
  }
}
