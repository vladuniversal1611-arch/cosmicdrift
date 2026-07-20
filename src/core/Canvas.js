/**
 * Canvas.js
 * -----------------------------------------------------------------------------
 * Owns the HTMLCanvasElement and the mapping between the fixed logical design
 * resolution (Config.render) and the physical device pixels.
 *
 * Strategy: the canvas backing store is sized to the device (× DPR) so text
 * and shapes stay crisp, while a single context transform scales everything
 * so that all draw/input code can work purely in logical coordinates. This is
 * what makes the game resolution-independent and mobile-first.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';
import { clamp } from '../utils/MathUtils.js';
import { Logger } from '../utils/Logger.js';

export class Canvas {
  /**
   * @param {HTMLCanvasElement} element The <canvas> to manage.
   */
  constructor(element) {
    this.el = element;
    this.ctx = element.getContext('2d', { alpha: false });

    /** Logical dimensions — the coordinate space all systems author against. */
    this.width = Config.render.width;
    this.height = Config.render.height;

    /** Uniform scale from logical units to CSS pixels (letterboxed fit). */
    this.scale = 1;
    /** CSS-pixel offset of the letterboxed viewport within the element. */
    this.offsetX = 0;
    this.offsetY = 0;

    this._dpr = 1;
    this._onResize = this.resize.bind(this);
  }

  /** Attach resize listeners and perform the first layout. */
  init() {
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    this.resize();
    return this;
  }

  /**
   * Recompute the backing store size and the logical→device transform.
   * Uses "contain" scaling so the whole board is always visible with
   * letterboxing, which keeps layout deterministic across aspect ratios.
   */
  resize() {
    const parent = this.el.parentElement || document.body;
    const availW = parent.clientWidth;
    const availH = parent.clientHeight;

    this._dpr = clamp(window.devicePixelRatio || 1, 1, Config.render.maxDpr);

    // Fit the logical resolution inside the available space (contain).
    this.scale = Math.min(availW / this.width, availH / this.height);
    const cssW = this.width * this.scale;
    const cssH = this.height * this.scale;
    this.offsetX = (availW - cssW) * 0.5;
    this.offsetY = (availH - cssH) * 0.5;

    // CSS size positions the canvas; backing store is CSS × DPR for sharpness.
    this.el.style.width = `${cssW}px`;
    this.el.style.height = `${cssH}px`;
    this.el.style.marginLeft = `${this.offsetX}px`;
    this.el.style.marginTop = `${this.offsetY}px`;
    this.el.width = Math.round(cssW * this._dpr);
    this.el.height = Math.round(cssH * this._dpr);

    Logger.debug('Canvas', `resize -> ${cssW.toFixed(0)}x${cssH.toFixed(0)} @${this._dpr}dpr`);
  }

  /**
   * Prepare the context for a frame: reset the transform so that one logical
   * unit maps to (scale × dpr) device pixels. Called by the Renderer each frame.
   */
  applyTransform() {
    const s = this.scale * this._dpr;
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
  }

  /**
   * Convert a pointer position (in CSS pixels, relative to the element) into
   * logical game coordinates. Used by the InputManager.
   */
  toLogical(clientX, clientY) {
    const rect = this.el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale,
    };
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
  }
}
