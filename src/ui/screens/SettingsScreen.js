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

  // Toggle rows (from p.y+40) + a language row + a block-style row + the reset
  // button at the foot.
  contentHeight() { return 40 + ROWS.length * 62 + (ROWS.length - 1) * 18 + 80 + 80 + 94; }

  _rows() {
    const p = this.panel;
    const x = p.x + 30, w = p.w - 60, h = 62, gap = 18;
    const y0 = p.y + 40;
    return ROWS.map((row, i) => ({ row, rect: new Rect(x, y0 + i * (h + gap), w, h) }));
  }

  onUpdate(dt) {
    const s = this.game.getSystem('settings');
    for (const row of ROWS) {
      const target = this._on(s, row) ? 1 : 0;
      this._anim[row.key] += (target - this._anim[row.key]) * Math.min(1, dt * 12);
    }
  }

  drawContent(r) {
    for (const { row, rect } of this._rows()) {
      // Row card.
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 16, 'rgba(255,255,255,0.6)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 16, 'rgba(120,140,200,0.4)', 1.5);
      r.text(t(row.labelKey), rect.x + 20, rect.centerY, { font: '800 18px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
      this._toggle(r, rect.right - 82, rect.centerY - 17, 66, 34, this._anim[row.key]);
    }

    // Language row — tap the pill to cycle available languages (updates live).
    const rows = this._rows();
    const last = rows[rows.length - 1].rect;
    const lr = new Rect(last.x, last.bottom + 18, last.w, 62);
    this._langRect = lr;
    r.fillRoundRect(lr.x, lr.y, lr.w, lr.h, 16, 'rgba(255,255,255,0.6)');
    r.strokeRoundRect(lr.x, lr.y, lr.w, lr.h, 16, 'rgba(120,140,200,0.4)', 1.5);
    r.text(t('settings.language'), lr.x + 20, lr.centerY, { font: '800 18px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
    const pw = 150, px2 = lr.right - pw - 12, ph = 40, py2 = lr.centerY - ph / 2;
    r.fillRoundRect(px2, py2, pw, ph, ph / 2, UI.btn.blue[1]);
    r.text(L.currentName(), px2 + pw / 2, lr.centerY, { font: '800 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Block-style row — tap the pill to switch between the cute "Friends"
    // characters and the classic faceted "Gems".
    const br = new Rect(lr.x, lr.bottom + 18, lr.w, 62);
    this._blockRect = br;
    r.fillRoundRect(br.x, br.y, br.w, br.h, 16, 'rgba(255,255,255,0.6)');
    r.strokeRoundRect(br.x, br.y, br.w, br.h, 16, 'rgba(120,140,200,0.4)', 1.5);
    r.text(t('settings.blockStyle'), br.x + 20, br.centerY, { font: '800 18px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
    const skin = this.game.getSystem('settings')?.get('blockSkin') || 'friends';
    const bpx = br.right - pw - 12, bpy = br.centerY - ph / 2;
    r.fillRoundRect(bpx, bpy, pw, ph, ph / 2, UI.btn.play[1]);
    r.text(t(skin === 'gems' ? 'settings.blockGems' : 'settings.blockFriends'), bpx + pw / 2, br.centerY, { font: '800 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    // Reset progress button area (drawn text; tap handled in onContentTap).
    const p = this.panel;
    const rw = 200, bx = p.centerX - rw / 2, by = p.bottom - 70;
    this._resetRect = new Rect(bx, by, rw, 46);
    r.fillRoundRect(bx, by, rw, 46, 23, 'rgba(224,67,63,0.14)');
    r.strokeRoundRect(bx, by, rw, 46, 23, UI.btn.red[1], 1.5);
    // Auto-fit the label so long translations (e.g. German) stay inside.
    const rLabel = t('settings.reset');
    let rf = 14; r.ctx.font = `800 ${rf}px system-ui, sans-serif`;
    while (rf > 9 && r.ctx.measureText(rLabel).width > rw - 22) { rf -= 1; r.ctx.font = `800 ${rf}px system-ui, sans-serif`; }
    r.text(rLabel, p.centerX, by + 23, { font: `800 ${rf}px system-ui, sans-serif`, color: UI.btn.red[1], align: 'center', baseline: 'middle' });
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
    for (const { row, rect } of this._rows()) {
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
