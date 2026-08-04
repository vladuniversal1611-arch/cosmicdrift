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
   *
   * PORTRAIT LOCK: the game is authored portrait. If the device is in landscape
   * we rotate the canvas element 90° (CSS only — drawing is untouched) and fit
   * the portrait design into the swapped box, so the game is ALWAYS presented
   * upright in portrait no matter how the phone is held. Pointer input is
   * inverse-rotated in `toLogical`.
   */
  resize() {
    const availW = window.innerWidth;
    const availH = window.innerHeight;
    this._rotated = availW > availH;              // landscape device → rotate
    // Counter-rotate against the OS so BOTH landscape orientations come out
    // upright (fallback for browsers where an orientation lock isn't honoured).
    if (this._rotated) {
      const oa = (window.screen?.orientation && typeof window.screen.orientation.angle === 'number')
        ? window.screen.orientation.angle : 90;
      this._rotDeg = oa === 90 ? -90 : 90;
    } else {
      this._rotDeg = 0;
    }

    // The box the portrait canvas must fit into (swapped when rotated).
    const boxW = this._rotated ? availH : availW;
    const boxH = this._rotated ? availW : availH;

    this._dpr = clamp(window.devicePixelRatio || 1, 1, Config.render.maxDpr);

    // Fit the logical (portrait) resolution inside the box (contain).
    this.scale = Math.min(boxW / this.width, boxH / this.height);
    const cssW = this.width * this.scale;
    const cssH = this.height * this.scale;
    this._cssW = cssW;
    this._cssH = cssH;
    this.offsetX = 0;
    this.offsetY = 0;

    // Centre on the viewport via transform, rotating 90° when landscape.
    this.el.style.position = 'fixed';
    this.el.style.left = '50%';
    this.el.style.top = '50%';
    this.el.style.margin = '0';
    this.el.style.transformOrigin = 'center center';
    this.el.style.transform = `translate(-50%, -50%) rotate(${this._rotDeg}deg)`;
    this.el.style.width = `${cssW}px`;
    this.el.style.height = `${cssH}px`;
    this.el.width = Math.round(cssW * this._dpr);
    this.el.height = Math.round(cssH * this._dpr);

    Logger.debug('Canvas', `resize -> ${cssW.toFixed(0)}x${cssH.toFixed(0)} @${this._dpr}dpr rot=${this._rotated}`);
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
    // The canvas is centred on the viewport; work from the viewport centre so
    // the mapping is correct with or without the portrait-lock rotation.
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    // Undo the CSS rotation to recover canvas-local coordinates.
    if (this._rotDeg === 90) { const t = dx; dx = dy; dy = -t; }        // undo +90° (CW)
    else if (this._rotDeg === -90) { const t = dx; dx = -dy; dy = t; }  // undo -90° (CCW)
    return {
      x: (dx + this._cssW / 2) / this.scale,
      y: (dy + this._cssH / 2) / this.scale,
    };
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
  }
}
