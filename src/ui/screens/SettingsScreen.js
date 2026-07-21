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

const ROWS = [
  { key: 'muted', label: 'Music & Sound', invert: true },
  { key: 'haptics', label: 'Haptics' },
  { key: 'reducedMotion', label: 'Reduced Motion' },
];

export class SettingsScreen extends PanelScreen {
  constructor(game) {
    super(game, 'SETTINGS');
    this.name = 'settings';
    this._anim = {};                 // eased 0..1 per row
    const s = game.getSystem('settings');
    for (const row of ROWS) this._anim[row.key] = this._on(s, row) ? 1 : 0;
  }

  _on(s, row) { const v = s?.get(row.key); return row.invert ? !v : !!v; }

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
      r.text(row.label, rect.x + 20, rect.centerY, { font: '800 18px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
      this._toggle(r, rect.right - 82, rect.centerY - 17, 66, 34, this._anim[row.key]);
    }
    // Reset progress button area (drawn text; tap handled in onContentTap).
    const p = this.panel;
    const bx = p.centerX - 90, by = p.bottom - 70;
    this._resetRect = new Rect(bx, by, 180, 46);
    r.fillRoundRect(bx, by, 180, 46, 23, 'rgba(224,67,63,0.14)');
    r.strokeRoundRect(bx, by, 180, 46, 23, UI.btn.red[1], 1.5);
    r.text('RESET PROGRESS', p.centerX, by + 23, { font: '800 14px system-ui, sans-serif', color: UI.btn.red[1], align: 'center', baseline: 'middle' });
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
    if (this._resetRect?.contains(px, py)) {
      this.game.getSystem('save')?.reset();
      this.game.getSystem('audio')?.play('invalid');
      return true;
    }
    return false;
  }
}
