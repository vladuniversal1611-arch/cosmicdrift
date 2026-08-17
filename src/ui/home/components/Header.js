/**
 * Header.js  (Home Screen · section 3)
 * -----------------------------------------------------------------------------
 * The top bar: a friendly player avatar (left) and two round action buttons —
 * Daily rewards and Settings (right). Fixed 180px band from SafeArea; content
 * is centred in the band and auto-scales, and the left/right clusters never
 * overlap because each is anchored to its own edge with a guaranteed gutter.
 *
 * Self-contained: owns its buttons (PremiumButton, so the press feel is shared,
 * not re-coded). The Daily button carries an attention badge whenever a reward
 * is waiting. Emits `ui:openSettings`, `ui:openDaily`.
 * -----------------------------------------------------------------------------
 */
import { PremiumButton } from '../../widgets/PremiumButton.js';
import { UITheme, UI } from '../../theme/UITheme.js';
import { Rect } from '../../../utils/Rect.js';
import { Icons } from '../Icons.js';
import { Motion } from '../Motion.js';
import { AssetManager } from '../../assets/AssetManager.js';

export class Header {
  constructor(game, safe, onTap) {
    this.game = game;
    this.safe = safe;
    this._tap = onTap;
    this._t = 0;

    const band = safe.header;
    const cy = band.y + band.h / 2;
    const S = 96;                          // min-touch round buttons
    const gap = 18;
    const rightX = safe.contentRight;
    // Right cluster: just Daily (its attention badge is a deliberate retention
    // hook). Settings lives only in the bottom nav — no need to duplicate it here.
    const defs = [
      { id: 'daily', icon: (r, x, y, s) => Icons.bell(r, x, y, s), color: UI.btn.orange, event: 'ui:openDaily' },
    ];
    this._btns = defs.map((d, i) => {
      const x = rightX - S - i * (S + gap);
      const btn = new PremiumButton(x, cy - S / 2, S, S, () => { this._tap?.(); this.game.events.emit(d.event); },
        { colors: d.color, round: true, icon: d.icon });
      return { btn, id: d.id };
    });

    // Avatar cluster (left). Tappable rect → profile.
    const av = Math.min(128, band.h - 36);
    this._avR = av / 2;
    this._avCx = band.x + av / 2 + 6;
    this._avCy = cy;
    this._avatarRect = new Rect(this._avCx - av / 2, this._avCy - av / 2, av, av);
  }

  update(dt) { this._t += dt; }

  render(r) {
    this._drawAvatar(r);
    const dailyReady = !!this.game.getSystem('retention')?.hasUnclaimedDaily?.();
    for (const b of this._btns) {
      b.btn.render(r);
      if (b.id === 'daily' && dailyReady) this._badge(r, b.btn.bounds, 0);
    }
  }

  _drawAvatar(r) {
    const cx = this._avCx, cy = this._avCy, R = this._avR;
    // Mascot art (self-contained, drawn a touch larger than the disc so its
    // arms/feet read); procedural face disc as the fallback.
    const img = AssetManager.image('mascot');
    if (img) {
      const box = R * 2.7, rr = Math.min(box / img.width, box / img.height);
      const w = img.width * rr, h = img.height * rr;
      r.ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      return;
    }
    // A friendly avatar disc — decorative identity, no XP/level meta.
    UITheme.shadow(r, cx - R, cy - R, R * 2, R * 2, R, 6, 0.3);
    const av = R - 6;
    r.fillCircle(cx, cy, av, r.radialGradient(cx, cy - av * 0.3, av, [[0, '#9ad7ff'], [1, '#2f6fe0']]));
    r.fillCircle(cx - av * 0.3, cy - av * 0.08, av * 0.2, '#fff');
    r.fillCircle(cx + av * 0.3, cy - av * 0.08, av * 0.2, '#fff');
    r.fillCircle(cx - av * 0.28, cy - av * 0.06, av * 0.1, '#233a72');
    r.fillCircle(cx + av * 0.28, cy - av * 0.06, av * 0.1, '#233a72');
    UITheme.goldFrame(r, cx - av, cy - av, av * 2, av * 2, av, 4);
  }

  _badge(r, b, count) {
    const hop = Motion.bounce(this._t, 4, 0.9);
    const bx = b.right - 16, by = b.y + 16 - hop;
    r.withGlow('#ff4d5e', 10, () => r.fillCircle(bx, by, 18, '#ff4d5e'));
    r.strokeRoundRect(bx - 18, by - 18, 36, 36, 18, '#fff', 3);
    const label = count > 9 ? '9+' : (count > 0 ? String(count) : '!');
    r.text(label, bx, by + 1, { font: '900 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
  }

  onTap(px, py) {
    for (const b of this._btns) if (b.btn.handleTap(px, py)) return true;
    return false;
  }

  /** Debug helper: current component bounds for the UI-bounds overlay. */
  bounds() { const b = this.safe.header; return [new Rect(b.x, b.y, b.w, b.h)]; }
}
