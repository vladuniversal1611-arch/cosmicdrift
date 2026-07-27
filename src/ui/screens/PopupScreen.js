/**
 * PopupScreen.js
 * -----------------------------------------------------------------------------
 * A single, reusable modal used for all lightweight popups the PopupManager
 * drives (News, Offers, Maintenance, Connection Lost, …). It is intentionally
 * generic and *pooled*: the PopupManager keeps one instance and reconfigures it
 * per popup rather than allocating a screen each time.
 *
 * It dims the backdrop, animates in (scale/fade via the AnimationManager), and
 * exposes a primary CTA plus optional dismiss. It NEVER manipulates gameplay —
 * it only emits the configured intent event and closes.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Rect } from '../../utils/Rect.js';
import { Easing } from '../../utils/Easing.js';
import { UITheme, UI } from '../theme/UITheme.js';

export class PopupScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'popup';
    this._cfg = { title: '', message: '', cta: 'OK' };
    this._scale = 1;
    this._panel = new Rect(0, 0, 10, 10);
    this._ctaRect = new Rect(0, 0, 10, 10);
    this._closeRect = new Rect(0, 0, 10, 10);
  }

  /** Reconfigure for reuse (pooled). */
  configure(cfg = {}) {
    this._cfg = { title: '', message: '', cta: 'OK', dismissable: true, action: null, accent: UI.btn.play, ...cfg };
    const w = Math.min(820, this.bounds.w - 120), h = 620;
    const x = (this.bounds.w - w) / 2, y = (this.bounds.h - h) / 2;
    this._panel = new Rect(x, y, w, h);
    this._ctaRect = new Rect(x + w * 0.18, y + h - 150, w * 0.64, 116);
    this._closeRect = new Rect(x + w - 78, y + 22, 56, 56);
    return this;
  }

  onEnter() {
    this.events.emit('ui:modalOpen');
    this._scale = 0.8;
    this.game.getSystem('animation')?.to(this, '_scale', 1, 0.4, { ease: Easing.backOut });
  }
  onExit() { this.events.emit('ui:modalClose'); this.events.emit('popup:closed', { id: this._cfg.id }); }

  render(r) {
    // Backdrop dim.
    r.setAlpha(0.55); r.fillRect(0, 0, this.bounds.w, this.bounds.h, '#0a1230'); r.setAlpha(1);
    const p = this._panel, ctx = r.ctx;
    ctx.save();
    ctx.translate(p.centerX, p.centerY); ctx.scale(this._scale, this._scale); ctx.translate(-p.centerX, -p.centerY);
    UITheme.glassPanel(r, p.x, p.y, p.w, p.h, 40);
    UITheme.heading(r, this._cfg.title, p.centerX, p.y + 90, 48, UI.ink);
    // Message (simple word-wrap).
    this._wrap(r, this._cfg.message, p.centerX, p.y + 190, p.w - 120, 40);
    // CTA.
    const c = this._ctaRect;
    UITheme.button(r, c.x, c.y, c.w, c.h, 40, this._cfg.accent);
    r.text(this._cfg.cta, c.centerX, c.centerY, { font: '900 40px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.4)', outlineWidth: 4 });
    // Close.
    if (this._cfg.dismissable) {
      const x = this._closeRect;
      UITheme.button(r, x.x, x.y, x.w, x.h, x.w / 2, UI.btn.red, { shadow: true });
      r.text('✕', x.centerX, x.centerY + 1, { font: '900 30px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    }
    ctx.restore();
  }

  _wrap(r, text, cx, y, maxW, lh) {
    const words = String(text).split(' ');
    let line = '', yy = y;
    r.ctx.font = '600 32px system-ui, sans-serif';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (r.ctx.measureText(test).width > maxW && line) {
        r.text(line, cx, yy, { font: '600 32px system-ui, sans-serif', color: UI.inkSoft, align: 'center', baseline: 'middle' });
        line = w; yy += lh;
      } else line = test;
    }
    if (line) r.text(line, cx, yy, { font: '600 32px system-ui, sans-serif', color: UI.inkSoft, align: 'center', baseline: 'middle' });
  }

  _close() { this.events.emit('ui:popScreen'); }

  onTap(px, py) {
    if (this._ctaRect.contains(px, py)) {
      this.game.getSystem('audio')?.play('button');
      if (this._cfg.action) this.events.emit(this._cfg.action);
      this._close();
      return true;
    }
    if (this._cfg.dismissable && this._closeRect.contains(px, py)) { this._close(); return true; }
    return true; // modal: swallow taps outside the panel
  }
}
