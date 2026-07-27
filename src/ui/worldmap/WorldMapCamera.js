/**
 * WorldMapCamera.js
 * -----------------------------------------------------------------------------
 * The map camera: vertical scroll with drag + momentum, eased auto-focus on a
 * world position, and a one-shot zoom-in when the map opens. Pure state — it
 * exposes `scroll` (world→screen offset) and `zoom`; the view applies them. No
 * drawing, no events.
 * -----------------------------------------------------------------------------
 */
import { clamp } from '../../utils/MathUtils.js';

export class WorldMapCamera {
  constructor(viewH) {
    this.viewH = viewH;
    this.scroll = 0;
    this.maxScroll = 0;
    this.zoom = 1;
    this._target = 0;
    this._auto = false;
    this._vel = 0;
    this._dragging = false;
    this._lastY = null;
    this._zoomT = -1;       // >=0 while the intro zoom plays
  }

  setBounds(contentH) { this.maxScroll = Math.max(0, contentH - this.viewH); }

  /** Kick off the opening zoom (zoom from `from`→1 over `dur`). */
  openZoom(from = 1.18, dur = 0.6) { this._zoom0 = from; this._zoomDur = dur; this._zoomT = 0; this.zoom = from; }

  focus(worldY, snap = false) {
    this._target = clamp(worldY - this.viewH * 0.5, 0, this.maxScroll);
    this._auto = !snap;
    this._vel = 0;
    if (snap) { this.scroll = this._target; this._auto = false; }
  }

  down(y) { this._dragging = true; this._lastY = y; this._vel = 0; this._auto = false; }
  move(y) {
    if (this._lastY == null) return;
    const d = this._lastY - y;
    this.scroll = clamp(this.scroll + d, 0, this.maxScroll);
    this._vel = d;
    this._lastY = y;
  }
  up() { this._dragging = false; this._lastY = null; }

  update(dt) {
    if (this._zoomT >= 0) {
      this._zoomT += dt;
      const k = Math.min(1, this._zoomT / this._zoomDur);
      this.zoom = this._zoom0 + (1 - this._zoom0) * (1 - Math.pow(1 - k, 3));
      if (k >= 1) { this.zoom = 1; this._zoomT = -1; }
    }
    if (this._dragging) return;
    const k = Math.min(1, dt * 60);
    if (this._auto) {
      this.scroll += (this._target - this.scroll) * Math.min(1, dt * 6);
      if (Math.abs(this._target - this.scroll) < 0.5) { this.scroll = this._target; this._auto = false; }
    } else if (Math.abs(this._vel) > 0.4) {
      this.scroll = clamp(this.scroll + this._vel * k, 0, this.maxScroll);
      this._vel *= Math.pow(0.93, dt * 60);
      if (this.scroll <= 0 || this.scroll >= this.maxScroll) this._vel = 0;
    }
  }
}
