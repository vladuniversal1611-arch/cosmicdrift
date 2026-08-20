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

  // Big, generously-spaced rows; PanelScreen hugs + vertically centres the panel
  // so it reads as a substantial card, not a tiny one floating up top.
  contentHeight() { return 34 + (ROWS.length + 2) * 76 + (ROWS.length + 1) * 16 + 28 + 54 + 26; }

  /** Row rects (6 toggles + language + block) followed by the reset button. */
  _layout() {
    const p = this.panel;
    const x = p.x + 30, w = p.w - 60, gap = 16, rowH = 76;
    const top = p.y + 34;
    const N = ROWS.length + 2;   // + language + block-style
    const rows = [];
    for (let i = 0; i < N; i++) rows.push(new Rect(x, top + i * (rowH + gap), w, rowH));
    const reset = new Rect(p.centerX - 120, rows[N - 1].bottom + 28, 240, 54);
    return { rows, rowH, reset };
  }

  onUpdate(dt) {
    const s = this.game.getSystem('settings');
    for (const row of ROWS) {
      const target = this._on(s, row) ? 1 : 0;
      this._anim[row.key] += (target - this._anim[row.key]) * Math.min(1, dt * 12);
    }
  }

  _rowCard(r, rect, label) {
    r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 18, 'rgba(255,255,255,0.62)');
    r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 18, 'rgba(120,140,200,0.4)', 1.5);
    r.text(label, rect.x + 24, rect.centerY, { font: '800 21px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
  }

  drawContent(r) {
    const { rows, reset } = this._layout();
    this._toggleRects = [];
    // 6 toggle rows.
    ROWS.forEach((row, i) => {
      const rect = rows[i];
      this._toggleRects.push({ row, rect });
      this._rowCard(r, rect, t(row.labelKey));
      const tw = 78, thh = 42;
      this._toggle(r, rect.right - tw - 18, rect.centerY - thh / 2, tw, thh, this._anim[row.key]);
    });

    // Pill dimensions for the two selector rows.
    const pw = 176, ph = 48;
    // Language row.
    const lr = rows[ROWS.length];
    this._langRect = lr;
    this._rowCard(r, lr, t('settings.language'));
    let px2 = lr.right - pw - 16, py2 = lr.centerY - ph / 2;
    r.fillRoundRect(px2, py2, pw, ph, ph / 2, UI.btn.blue[1]);
    r.text(L.currentName(), px2 + pw / 2, lr.centerY, { font: '800 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Block-style row.
    const br = rows[ROWS.length + 1];
    this._blockRect = br;
    this._rowCard(r, br, t('settings.blockStyle'));
    const skin = this.game.getSystem('settings')?.get('blockSkin') || 'friends';
    let bpx = br.right - pw - 16, bpy = br.centerY - ph / 2;
    r.fillRoundRect(bpx, bpy, pw, ph, ph / 2, UI.btn.play[1]);
    r.text(t(skin === 'gems' ? 'settings.blockGems' : 'settings.blockFriends'), bpx + pw / 2, br.centerY, { font: '800 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Reset progress button (pinned at the foot).
    this._resetRect = reset;
    r.fillRoundRect(reset.x, reset.y, reset.w, reset.h, reset.h / 2, 'rgba(224,67,63,0.14)');
    r.strokeRoundRect(reset.x, reset.y, reset.w, reset.h, reset.h / 2, UI.btn.red[1], 2);
    const rLabel = t('settings.reset');
    let rf = 16; r.ctx.font = `800 ${rf}px system-ui, sans-serif`;
    while (rf > 10 && r.ctx.measureText(rLabel).width > reset.w - 28) { rf -= 1; r.ctx.font = `800 ${rf}px system-ui, sans-serif`; }
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
