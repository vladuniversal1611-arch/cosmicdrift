/**
 * WorldMapNode.js
 * -----------------------------------------------------------------------------
 * Renders a level node in any of its states. State (progress) and kind (role)
 * are orthogonal: kind = normal | boss | treasure | special | daily colours the
 * body; state = locked | unlocked | current | completed | perfect controls the
 * ring, stars, lock/chains, glow and particles.
 *
 *   completed  → gold ring + 3 stars + sparkle    perfect → brighter, all gold
 *   current    → floating + breathing + soft glow + tiny orbiting particles
 *   locked     → grey + chains + fog
 *   boss       → large, dragon-statue icon, red glow
 *   treasure   → gold chest + sparkles
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../home/Motion.js';
import { UI } from '../theme/UITheme.js';
import { MAP } from '../../config/Worlds.js';

export class WorldMapNode {
  constructor() { this._t = 0; }
  update(dt) { this._t += dt; }

  _ellipse(r, x, y, rx, ry, c) { const ctx = r.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }

  _body(kind, state) {
    if (state === 'locked') return { a: '#c2ccd6', b: '#8b98a6', ring: 'rgba(255,255,255,0.4)' };
    if (kind === 'boss') return { a: '#ff9a8a', b: '#e0433f', ring: UI.gold.mid };
    if (kind === 'treasure') return { a: '#ffe89a', b: '#e0a41e', ring: UI.gold.light };
    if (kind === 'special') return { a: '#d9b4ff', b: '#8a4fe0', ring: UI.gold.mid };
    if (kind === 'daily') return { a: '#a8f0d0', b: '#22b07a', ring: UI.gold.mid };
    if (state === 'perfect') return { a: '#fff3c4', b: '#f0b52e', ring: UI.gold.light };
    if (state === 'completed') return { a: '#ffe89a', b: '#f0a92e', ring: UI.gold.light };
    if (state === 'current') return { a: '#a8f09a', b: '#37a83f', ring: UI.gold.light };
    return { a: '#a9dcff', b: '#2f8fe0', ring: UI.gold.mid };  // unlocked
  }

  /** Draw at screen (x,y). */
  draw(r, node, x, y, state) {
    const ctx = r.ctx;
    const col = this._body(node.kind, state);
    const boss = node.kind === 'boss';
    let R = state === 'current' ? MAP.currentRadius : MAP.nodeRadius;
    if (boss) R *= 1.28;
    let cy = y;

    // Current: float + pulsing halo + orbiting particles.
    if (state === 'current') {
      const p = Motion.pulse(this._t, 2.2);
      cy = y + Motion.float(this._t, 5, 2.4);
      r.setAlpha(0.22 + p * 0.22);
      r.withGlow(col.b, 30, () => r.fillCircle(x, cy, R * (1.4 + 0.12 * p), col.a));
      r.setAlpha(1);
      for (let i = 0; i < 4; i++) {
        const a = this._t * 1.6 + i * Math.PI / 2, rr = R * 1.5;
        r.setAlpha(0.5 + 0.5 * Math.sin(this._t * 4 + i));
        r.sparkle(x + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, 6, '#fff7cf'); r.setAlpha(1);
      }
    }
    // Boss red glow.
    if (boss && state !== 'locked') { r.setAlpha(0.3); r.withGlow('#ff3a3a', 26, () => r.fillCircle(x, cy, R * 1.3, '#ff5a4a')); r.setAlpha(1); }

    // Shadow + body + gloss + ring.
    r.setAlpha(state === 'locked' ? 0.16 : 0.28); r.fillCircle(x, cy + 8, R, '#0a1230'); r.setAlpha(1);
    r.fillCircle(x, cy, R, r.radialGradient(x, cy - R * 0.4, R * 1.3, [[0, col.a], [1, col.b]]));
    r.setAlpha(state === 'locked' ? 0.28 : 0.55); this._ellipse(r, x, cy - R * 0.42, R * 0.6, R * 0.32, 'rgba(255,255,255,0.95)'); r.setAlpha(1);
    ctx.beginPath(); ctx.arc(x, cy, R, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = col.ring; ctx.stroke();

    // Contents.
    if (state === 'locked') { this._lock(r, x, cy, R); return; }
    if (node.kind === 'boss') this._bossIcon(r, x, cy, R);
    else if (node.kind === 'treasure') this._chest(r, x, cy, R * 0.5);
    else if (node.kind === 'daily') this._dailyIcon(r, x, cy, R * 0.5);
    else if (node.kind === 'special') r.sparkle(x, cy - R * 0.05, R * 0.4, '#fff');
    else if (state === 'completed' || state === 'perfect') this._check(r, x, cy, R * 0.44);
    else r.text(String(node.n), x, cy + 2, { font: `900 ${Math.round(R * 0.72)}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(20,40,80,0.45)', outlineWidth: 4 });

    // Stars beneath completed/perfect.
    if (state === 'completed' || state === 'perfect') this._stars(r, x, cy + R + 14, state === 'perfect' ? 3 : node.stars);
  }

  _lock(r, x, y, R) {
    // Chains across + padlock + fog.
    const ctx = r.ctx; ctx.strokeStyle = 'rgba(90,100,120,0.9)'; ctx.lineWidth = R * 0.12;
    ctx.beginPath(); ctx.moveTo(x - R, y - R * 0.5); ctx.lineTo(x + R, y + R * 0.5); ctx.moveTo(x - R, y + R * 0.5); ctx.lineTo(x + R, y - R * 0.5); ctx.stroke();
    const s = R * 0.5, bw = s * 1.1, bh = s * 0.82, bx = x - bw / 2, by = y - bh * 0.15;
    ctx.beginPath(); ctx.lineWidth = s * 0.22; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.arc(x, by, bw * 0.32, Math.PI, 0); ctx.stroke();
    r.fillRoundRect(bx, by, bw, bh, s * 0.18, 'rgba(255,255,255,0.9)');
    r.setAlpha(0.2); r.fillCircle(x, y, R * 1.2, '#fff'); r.setAlpha(1);
  }
  _check(r, x, y, s) {
    const ctx = r.ctx; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, s * 0.36); ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - s * 0.55, y + s * 0.05); ctx.lineTo(x - s * 0.12, y + s * 0.5); ctx.lineTo(x + s * 0.62, y - s * 0.5); ctx.stroke(); ctx.restore();
  }
  _bossIcon(r, x, y, R) {
    // Dragon-statue silhouette.
    const s = R * 0.5, ctx = r.ctx; ctx.fillStyle = '#fff';
    r.fillCircle(x, y - s * 0.2, s * 0.5, '#fff');
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.2); ctx.lineTo(x - s, y - s * 0.9); ctx.lineTo(x - s * 0.7, y + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.5, y - s * 0.2); ctx.lineTo(x + s, y - s * 0.9); ctx.lineTo(x + s * 0.7, y + s * 0.1); ctx.closePath(); ctx.fill();
    r.fillCircle(x - s * 0.18, y - s * 0.28, s * 0.1, '#e0433f'); r.fillCircle(x + s * 0.18, y - s * 0.28, s * 0.1, '#e0433f');
    r.fillRoundRect(x - s * 0.4, y + s * 0.3, s * 0.8, s * 0.5, s * 0.1, '#fff');
  }
  _chest(r, x, y, s) {
    r.fillRoundRect(x - s, y - s * 0.1, s * 2, s * 1.0, s * 0.18, '#e0a41e');
    r.fillRoundRect(x - s * 1.05, y - s * 0.7, s * 2.1, s * 0.7, s * 0.2, '#ffcf5e');
    r.fillRoundRect(x - s * 0.16, y - s * 0.2, s * 0.32, s * 0.7, s * 0.06, '#7a4a00');
    r.sparkle(x + s * 0.7, y - s * 0.7, s * 0.4, '#fff'); r.sparkle(x - s * 0.7, y - s * 0.4, s * 0.3, '#fff6c8');
  }
  _dailyIcon(r, x, y, s) {
    r.fillRoundRect(x - s, y - s * 0.8, s * 2, s * 1.6, s * 0.2, '#fff');
    const ctx = r.ctx; ctx.strokeStyle = '#22b07a'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(x - s * 0.6, y - s * 0.2); ctx.lineTo(x + s * 0.6, y - s * 0.2); ctx.stroke();
    r.text('!', x, y + s * 0.35, { font: `900 ${s}px system-ui, sans-serif`, color: '#22b07a', align: 'center', baseline: 'middle' });
  }
  _stars(r, x, y, filled) {
    for (let i = 0; i < 3; i++) {
      const sx = x + (i - 1) * 22, on = i < filled, sy = on ? y - 3 : y, rr = on ? 10 : 8;
      const ctx = r.ctx; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? rr * 0.45 : rr; const px = sx + Math.cos(ang) * rad, py = sy + Math.sin(ang) * rad; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fillStyle = on ? UI.gold.mid : 'rgba(255,255,255,0.28)'; ctx.fill();
      if (on) { ctx.lineWidth = 1.5; ctx.strokeStyle = UI.gold.line; ctx.stroke(); }
    }
  }
}
