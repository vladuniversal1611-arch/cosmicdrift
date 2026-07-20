/**
 * InputManager.js
 * -----------------------------------------------------------------------------
 * Normalises pointer/touch/mouse input into a single, logical-coordinate event
 * stream and publishes it on the EventBus. Uses Pointer Events so one code path
 * covers touch, pen and mouse — ideal for a mobile-first game that must also be
 * testable on desktop.
 *
 * Emitted events (payload: { x, y, id, ...}):
 *   input:down  — a pointer went down
 *   input:move  — a pointer moved
 *   input:up    — a pointer was released
 *   input:tap   — a quick press+release under the tap threshold
 *   input:drag  — movement exceeded the drag threshold since press
 *
 * This class detects gestures but stays gameplay-agnostic: it does NOT know
 * about pieces or the board. Those systems subscribe and interpret intent.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';

export class InputManager {
  /**
   * @param {import('./Canvas.js').Canvas} canvas
   * @param {import('./EventBus.js').EventBus} events
   */
  constructor(canvas, events) {
    this.canvas = canvas;
    this.events = events;

    /** Active pointers, keyed by pointerId. */
    this._pointers = new Map();

    // Pre-bound handlers so we can cleanly remove them on destroy.
    this._onDown = this._handleDown.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onUp = this._handleUp.bind(this);
  }

  init() {
    const el = this.canvas.el;
    el.addEventListener('pointerdown', this._onDown, { passive: false });
    el.addEventListener('pointermove', this._onMove, { passive: false });
    // Listen on window for up/cancel so we still catch releases off-canvas.
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
    return this;
  }

  _handleDown(e) {
    e.preventDefault();
    const p = this.canvas.toLogical(e.clientX, e.clientY);
    this._pointers.set(e.pointerId, {
      startX: p.x, startY: p.y,
      x: p.x, y: p.y,
      startTime: performance.now(),
      isDragging: false,
    });
    this.events.emit('input:down', { id: e.pointerId, x: p.x, y: p.y });
  }

  _handleMove(e) {
    const pointer = this._pointers.get(e.pointerId);
    if (!pointer) return; // Ignore hover moves with no active press.
    e.preventDefault();
    const p = this.canvas.toLogical(e.clientX, e.clientY);
    pointer.x = p.x;
    pointer.y = p.y;

    if (!pointer.isDragging) {
      const dist = Math.hypot(p.x - pointer.startX, p.y - pointer.startY);
      if (dist >= Config.input.dragThreshold) {
        pointer.isDragging = true;
        this.events.emit('input:drag', { id: e.pointerId, x: p.x, y: p.y });
      }
    }
    this.events.emit('input:move', {
      id: e.pointerId, x: p.x, y: p.y, dragging: pointer.isDragging,
    });
  }

  _handleUp(e) {
    const pointer = this._pointers.get(e.pointerId);
    if (!pointer) return;
    this._pointers.delete(e.pointerId);

    const p = this.canvas.toLogical(e.clientX, e.clientY);
    const duration = performance.now() - pointer.startTime;
    this.events.emit('input:up', { id: e.pointerId, x: p.x, y: p.y });

    // A short, low-movement press is a tap.
    if (!pointer.isDragging && duration <= Config.input.tapMaxDuration) {
      this.events.emit('input:tap', { id: e.pointerId, x: p.x, y: p.y });
    }
  }

  destroy() {
    const el = this.canvas.el;
    el.removeEventListener('pointerdown', this._onDown);
    el.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    this._pointers.clear();
  }
}
