/**
 * PanelScreen.js
 * -----------------------------------------------------------------------------
 * Base for the premium meta screens (Shop, Collection, Settings, Events). Draws
 * the living island background, an optional TopBar, a big glass panel with a
 * gold-framed title header and a round Back button. Subclasses just implement
 * `drawContent()` (and optionally `onContentTap`) plus add any widgets.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Rect } from '../../utils/Rect.js';
import { PremiumButton } from '../widgets/PremiumButton.js';
import { TopBar } from '../components/TopBar.js';
import { MenuBackground } from '../theme/MenuBackground.js';
import { UITheme, UI } from '../theme/UITheme.js';

export class PanelScreen extends Screen {
  constructor(game, title, { showTopBar = false } = {}) {
    super(game);
    this.title = title;
    this._bg = new MenuBackground(this.bounds.w, this.bounds.h);
    this._topbar = showTopBar ? new TopBar(game) : null;
    this._t = 0;

    const w = this.bounds.w, h = this.bounds.h;
    this.panel = new Rect(w * 0.06, h * (showTopBar ? 0.14 : 0.11), w * 0.88, h * (showTopBar ? 0.78 : 0.8));
    // Remember the full extent so `contentHeight()` can shrink the panel to hug
    // its content (top-anchored) without exceeding the available region.
    this._panelMaxH = this.panel.h;

    // Back button (top-left, above the panel).
    this.add(new PremiumButton(18, 20, 58, 58, () => this.events.emit('ui:back'),
      { colors: UI.btn.red, round: true, icon: (r, cx, cy, s) => {
        r.ctx.strokeStyle = '#fff'; r.ctx.lineWidth = s * 0.3; r.ctx.lineCap = 'round';
        r.ctx.beginPath(); r.ctx.moveTo(cx + s * 0.3, cy - s * 0.5); r.ctx.lineTo(cx - s * 0.4, cy); r.ctx.lineTo(cx + s * 0.3, cy + s * 0.5); r.ctx.stroke();
      } }));
  }

  onEnter() { this.events.emit('ui:modalOpen'); }
  onExit() { this.events.emit('ui:modalClose'); }

  update(dt) { this._t += dt; this._bg.update(dt); this._topbar?.update(dt); this.onUpdate(dt); }

  render(r) {
    this._bg.render(r);
    // A soft cool wash so the bright panel pops (never a dark overlay).
    r.setAlpha(0.12); r.fillRect(0, 0, this.bounds.w, this.bounds.h, '#1e5aa0'); r.setAlpha(1);
    if (this._topbar) this._topbar.render(r, this.bounds.w);

    // Fit the panel to its content (top-anchored) so screens read as tidy cards
    // over the living background rather than sparse full-height sheets.
    const ch = this.contentHeight();
    if (ch != null) this.panel.h = Math.max(160, Math.min(this._panelMaxH, ch));

    const p = this.panel;
    UITheme.glassPanel(r, p.x, p.y, p.w, p.h, 26);
    // Title header ribbon.
    const rw = Math.min(p.w * 0.7, 320), rh = 46, rx = p.centerX - rw / 2, ry = p.y - rh * 0.5;
    UITheme.button(r, rx, ry, rw, rh, rh / 2, UI.btn.orange);
    r.text(this.title, p.centerX, ry + rh / 2, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });

    this.drawContent(r, p);
    for (const child of this.children) child.render(r);
  }

  // Overridables.
  onUpdate() {}
  drawContent() {}
  onContentTap() { return false; }
  /**
   * Optional: return the pixel height the content needs (measured from the
   * panel's top). PanelScreen shrinks the panel to this (top-anchored, clamped
   * to the available region). Return null to keep the full-height panel.
   */
  contentHeight() { return null; }

  onTap(px, py) { return this.onContentTap(px, py); }
}
