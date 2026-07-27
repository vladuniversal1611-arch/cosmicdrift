/**
 * WorldMapPath.js
 * -----------------------------------------------------------------------------
 * Draws the connections between nodes. Inside an island it is a cobbled stone
 * path; between islands it is a themed bridge (wood, stone, cloud, crystal or
 * light). A completed segment (its "from" level is cleared) lights up and a
 * bright spark travels along it — the visible reward for progress.
 * -----------------------------------------------------------------------------
 */
import { Motion } from '../home/Motion.js';
import { BRIDGE } from '../../config/Worlds.js';

export class WorldMapPath {
  constructor() { this._t = 0; }
  update(dt) { this._t += dt; }

  /**
   * @param seg   model segment { a, b, type, bridge, fromN }
   * @param ax,ay screen endpoints
   * @param lit   whether the segment is completed (animated light)
   */
  draw(r, seg, ax, ay, bx, by, lit) {
    if (seg.type === 'bridge') this._bridge(r, seg.bridge, ax, ay, bx, by);
    else this._stone(r, ax, ay, bx, by);
    if (lit) this._travelLight(r, ax, ay, bx, by, seg.fromN);
  }

  _stone(r, ax, ay, bx, by) {
    const ctx = r.ctx; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
    ctx.strokeStyle = 'rgba(40,110,50,0.3)'; ctx.lineWidth = 46; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.strokeStyle = '#cabfa8'; ctx.lineWidth = 30; ctx.stroke();
    // Cobbles.
    const n = Math.max(1, Math.hypot(bx - ax, by - ay) / 26);
    for (let i = 0; i <= n; i++) { const t = i / n; r.fillCircle(ax + (bx - ax) * t, ay + (by - ay) * t, 7, i % 2 ? '#e7ddc6' : '#d8ccb0'); }
  }

  _bridge(r, kind, ax, ay, bx, by) {
    const ctx = r.ctx; const ang = Math.atan2(by - ay, bx - ax); const len = Math.hypot(bx - ax, by - ay);
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
    const hw = 26;
    if (kind === BRIDGE.WOOD) {
      ctx.fillStyle = '#a9702f'; ctx.fillRect(0, -hw, len, hw * 2);
      ctx.fillStyle = '#7a4a24'; for (let x = 6; x < len; x += 18) ctx.fillRect(x, -hw, 6, hw * 2);
    } else if (kind === BRIDGE.STONE) {
      ctx.fillStyle = '#b7ad98'; ctx.fillRect(0, -hw, len, hw * 2);
      ctx.fillStyle = '#8f8570'; for (let x = 4; x < len; x += 22) ctx.fillRect(x, -hw, 3, hw * 2);
    } else if (kind === BRIDGE.CLOUD) {
      ctx.globalAlpha = 0.9; for (let x = 0; x <= len; x += 26) { r.fillCircle(x, 0, hw, '#fff'); } ctx.globalAlpha = 1;
    } else if (kind === BRIDGE.CRYSTAL) {
      const g = r.linearGradient(0, -hw, 0, hw, [[0, '#dff7ff'], [1, '#6fc8e6']]); ctx.fillStyle = g; ctx.fillRect(0, -hw, len, hw * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; for (let x = 10; x < len; x += 24) { ctx.beginPath(); ctx.moveTo(x, -hw); ctx.lineTo(x + 8, hw); ctx.stroke(); }
    } else { // LIGHT
      const glow = 0.6 + Motion.pulse(this._t, 1.6) * 0.4;
      ctx.globalAlpha = glow;
      const g = r.linearGradient(0, -hw, 0, hw, [[0, 'rgba(255,247,200,0)'], [0.5, 'rgba(255,240,150,0.9)'], [1, 'rgba(255,247,200,0)']]);
      ctx.fillStyle = g; ctx.fillRect(0, -hw, len, hw * 2); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  _travelLight(r, ax, ay, bx, by, seed) {
    const t = (this._t * 0.4 + (seed % 5) * 0.2) % 1;
    const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    r.setAlpha(0.5 + 0.5 * Math.sin(this._t * 6));
    r.withGlow('#ffe89a', 12, () => r.fillCircle(x, y, 7, '#fff3c4'));
    r.setAlpha(1);
  }
}
