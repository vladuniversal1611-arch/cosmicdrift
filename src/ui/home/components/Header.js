/**
 * Header.js  (Home Screen · section 3)
 * -----------------------------------------------------------------------------
 * The top bar: player avatar with an XP ring + level badge (left) and three
 * round action buttons — Notifications, Mail, Settings (right). Fixed 180px
 * band from SafeArea; content is centred in the band and auto-scales, and the
 * left cluster and right cluster never overlap because each is anchored to its
 * own edge with a guaranteed gutter.
 *
 * Self-contained: owns its buttons (PremiumButton, so the press feel is shared,
 * not re-coded), reads level/XP from the save + progression, and exposes
 * `mail` / `notifications` counts that the NotificationLayer/debug can set.
 * Emits `ui:openSettings`, `ui:openMail`, `ui:openNotifications`, `ui:openProfile`.
 * -----------------------------------------------------------------------------
 */
import { PremiumButton } from '../../widgets/PremiumButton.js';
import { UITheme, UI } from '../../theme/UITheme.js';
import { Rect } from '../../../utils/Rect.js';
import { Icons } from '../Icons.js';
import { Motion } from '../Motion.js';

export class Header {
  constructor(game, safe, onTap) {
    this.game = game;
    this.safe = safe;
    this._tap = onTap;
    this._t = 0;
    this.mail = 0;
    this.notifications = 0;

    const band = safe.header;
    const cy = band.y + band.h / 2;
    const S = 96;                          // min-touch round buttons
    const gap = 18;
    const rightX = safe.contentRight;
    // Right cluster: Notifications, Mail, Settings (right-to-left).
    const defs = [
      { id: 'settings', icon: (r, x, y, s) => Icons.gear(r, x, y, s), color: UI.btn.blue, event: 'ui:openSettings' },
      { id: 'mail', icon: (r, x, y, s) => Icons.mail(r, x, y, s), color: UI.btn.teal, event: 'ui:openMail' },
      { id: 'notifications', icon: (r, x, y, s) => Icons.bell(r, x, y, s), color: UI.btn.orange, event: 'ui:openNotifications' },
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
    for (const b of this._btns) {
      b.btn.render(r);
      const count = this[b.id] ?? 0;
      if (count > 0 || b.id === 'notifications' && this.notifications > 0) this._badge(r, b.btn.bounds, count);
    }
  }

  _drawAvatar(r) {
    const cx = this._avCx, cy = this._avCy, R = this._avR;
    const ctx = r.ctx;
    const lvl = this.game.getSystem('level')?.highest ?? (this.game.getSystem('save')?.getSlice?.('world')?.maxLevel ?? 1);
    const xp = ((lvl - 1) % 10) / 10 || (lvl > 1 ? 1 : 0);

    UITheme.shadow(r, cx - R, cy - R, R * 2, R * 2, R, 6, 0.3);
    // XP ring.
    ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, Math.PI * 2); ctx.stroke();
    r.withGlow(UI.gold.mid, 8, () => {
      ctx.strokeStyle = UI.gold.mid;
      ctx.beginPath(); ctx.arc(cx, cy, R - 2, -Math.PI / 2, -Math.PI / 2 + xp * Math.PI * 2); ctx.stroke();
    });
    // Avatar disc + friendly dragon face.
    const av = R - 10;
    r.fillCircle(cx, cy, av, r.radialGradient(cx, cy - av * 0.3, av, [[0, '#9ad7ff'], [1, '#2f6fe0']]));
    r.fillCircle(cx - av * 0.3, cy - av * 0.08, av * 0.2, '#fff');
    r.fillCircle(cx + av * 0.3, cy - av * 0.08, av * 0.2, '#fff');
    r.fillCircle(cx - av * 0.28, cy - av * 0.06, av * 0.1, '#233a72');
    r.fillCircle(cx + av * 0.28, cy - av * 0.06, av * 0.1, '#233a72');
    UITheme.goldFrame(r, cx - av, cy - av, av * 2, av * 2, av, 4);
    // Level badge under the avatar.
    const bw = 84, bh = 40, bx = cx - bw / 2, by = cy + R - bh * 0.4;
    UITheme.button(r, bx, by, bw, bh, bh / 2, UI.btn.orange, { shadow: true });
    r.text(`LV ${lvl}`, cx, by + bh / 2, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
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
    if (this._avatarRect.contains(px, py)) { this._tap?.(); this.game.events.emit('ui:openProfile'); return true; }
    return false;
  }

  /** Debug helper: current component bounds for the UI-bounds overlay. */
  bounds() { const b = this.safe.header; return [new Rect(b.x, b.y, b.w, b.h)]; }
}
