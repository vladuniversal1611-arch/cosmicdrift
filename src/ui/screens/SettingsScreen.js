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
import { UITheme, UI } from '../theme/UITheme.js';
import { clamp } from '../../utils/MathUtils.js';
import { drawFlag } from '../theme/Flags.js';
import { t, L } from '../../i18n/Localization.js';

const ROWS = [
  { key: 'muted', labelKey: 'settings.audio', invert: true },
  { key: 'haptics', labelKey: 'settings.haptics' },
  { key: 'reducedMotion', labelKey: 'settings.reducedMotion' },
  { key: 'colorBlind', labelKey: 'settings.colorBlind' },
  { key: 'lowPerformance', labelKey: 'settings.lowPerformance' },
];

export class SettingsScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.settings'));
    this.name = 'settings';
    this._anim = {};                 // eased 0..1 per row
    this._langOpen = false;          // language-picker overlay open?
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

    // Language row — the pill shows the current flag + name and opens a picker.
    const lr = rows[ROWS.length];
    this._langRect = lr;
    this._rowCard(r, lr, t('settings.language'), labelFont);
    {
      const px = lr.right - pw - pad, py = lr.centerY - ph / 2;
      r.fillRoundRect(px, py, pw, ph, ph / 2, UI.btn.blue[1]);
      const fh = ph * 0.58, fw = fh * 1.5, fx = px + ph * 0.32;
      drawFlag(r, fx, lr.centerY - fh / 2, fw, fh, L.language);
      r.text(L.currentName(), fx + fw + 12, lr.centerY, { font: `800 ${pillFont}px system-ui, sans-serif`, color: '#fff', align: 'left', baseline: 'middle' });
    }

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

    // Language picker overlay (on top of everything).
    if (this._langOpen) this._drawLangPicker(r);
  }

  /** Layout for the language-picker grid (flag + native name per cell). */
  _langLayout() {
    const b = this.bounds, codes = L.languages, cols = 2;
    const pw = Math.min(b.w * 0.88, 760);
    const rowsN = Math.ceil(codes.length / cols);
    const titleH = 70, pad = 26, gap = 16;
    const cellH = clamp((b.h * 0.66 - titleH - pad * 2) / rowsN - gap, 72, 118);
    const ph = titleH + pad + rowsN * cellH + (rowsN - 1) * gap + pad;
    const px = (b.w - pw) / 2, py = (b.h - ph) / 2;
    const cellW = (pw - pad * 2 - gap * (cols - 1)) / cols;
    const cells = codes.map((code, i) => {
      const c = i % cols, ri = Math.floor(i / cols);
      return { code, rect: new Rect(px + pad + c * (cellW + gap), py + titleH + pad + ri * (cellH + gap), cellW, cellH) };
    });
    return { px, py, pw, ph, titleH, cells, cellH };
  }

  _drawLangPicker(r) {
    const b = this.bounds;
    r.setAlpha(0.6); r.fillRect(0, 0, b.w, b.h, '#0c2036'); r.setAlpha(1);
    const { px, py, pw, ph, titleH, cells, cellH } = this._langLayout();
    this._langCells = cells;
    UITheme.glassPanel(r, px, py, pw, ph, 28);
    // Title ribbon.
    const rw = Math.min(pw * 0.6, 300), rh = 48, rx = px + (pw - rw) / 2, ry = py - rh * 0.5;
    UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.orange);
    r.text(t('settings.language'), px + pw / 2, ry + rh / 2, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    const nameFont = clamp(Math.round(cellH * 0.28), 16, 30);
    for (const { code, rect } of cells) {
      const active = code === L.language;
      r.fillRoundRect(rect.x, rect.y, rect.w, rect.h, 18, active ? 'rgba(70,190,120,0.28)' : 'rgba(255,255,255,0.66)');
      r.strokeRoundRect(rect.x, rect.y, rect.w, rect.h, 18, active ? UI.btn.play[1] : 'rgba(120,140,200,0.42)', active ? 3 : 2);
      const fh = rect.h * 0.5, fw = fh * 1.5, fx = rect.x + rect.h * 0.28;
      drawFlag(r, fx, rect.centerY - fh / 2, fw, fh, code);
      r.text(L.nameOf(code), fx + fw + 16, rect.centerY, { font: `800 ${nameFont}px system-ui, sans-serif`, color: UI.ink, align: 'left', baseline: 'middle' });
    }
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
    // Language picker (modal within the screen) takes taps first.
    if (this._langOpen) {
      for (const { code, rect } of (this._langCells || [])) {
        if (rect.contains(px, py)) {
          if (code !== L.language) this.game.getSystem('settings')?.set('language', code);
          this.game.getSystem('audio')?.play('pickup');
          this._langOpen = false;
          return true;
        }
      }
      // Tap anywhere outside a cell dismisses the picker.
      this._langOpen = false;
      return true;
    }
    for (const { row, rect } of (this._toggleRects || [])) {
      if (rect.contains(px, py)) {
        this.game.getSystem('settings')?.toggle(row.key);
        this.game.getSystem('audio')?.play('pickup');
        return true;
      }
    }
    // Open the language picker (choose from a flagged list) instead of cycling.
    if (this._langRect?.contains(px, py)) {
      this._langOpen = true;
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
