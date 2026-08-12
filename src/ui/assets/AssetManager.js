/**
 * AssetManager.js
 * -----------------------------------------------------------------------------
 * The single owner of visual ASSETS (images) and the seam that lets the entire
 * UI be re-skinned by dropping art in, with NO logic changes.
 *
 * How it works:
 *   - Art is declared in a manifest (key → url) and registered here.
 *   - `image(key)` returns the loaded HTMLImageElement, or `null` if that key
 *     has no art yet.
 *   - Every draw primitive (icons, button/panel frames, backgrounds) asks the
 *     AssetManager first; when it returns `null` the caller draws the current
 *     PROCEDURAL placeholder. So the game looks identical today, and swapping in
 *     final PNGs later is a data change (edit the manifest, add files) — the UI
 *     and gameplay code never change.
 *
 * Namespacing convention for keys:
 *   `icon:<name>`    – icon art (coins, gem, chest, …)
 *   `frame:<name>`   – nine-slice frames (button.play, panel.glass, badge, …)
 *   `bg:<name>`      – background layers (sky, parallax.far, decoration, …)
 *   `fx:<name>`      – particle / effect sprites
 *
 * Environment-safe: guards `Image`/DOM so headless tools import it cleanly.
 * -----------------------------------------------------------------------------
 */
import { Logger } from '../../utils/Logger.js';

class AssetManagerImpl {
  constructor() {
    /** key → HTMLImageElement (only present once loaded). */
    this._images = new Map();
    /** key → path (relative to the base), declared but not necessarily loaded. */
    this._manifest = new Map();
    /**
     * Base path prepended to every manifest path. THE theme seam: swapping a
     * whole visual theme is just pointing this at another folder that mirrors
     * the same layout (or replacing files in place) — no code/key changes.
     */
    this._base = 'assets/';
    this._loading = 0;
  }

  /** Set the asset base folder (theme root). e.g. 'assets/themes/winter/'. */
  setBasePath(base) { this._base = base.endsWith('/') ? base : base + '/'; return this; }
  /** Convenience: switch to a named theme folder under assets/themes/. */
  setTheme(name) { return this.setBasePath(`assets/themes/${name}/`); }
  /** Full resolved URL for a key (base + declared relative path). */
  url(key) { const p = this._manifest.get(key); return p == null ? null : this._base + p; }

  /** Declare art for a key (path RELATIVE to the base). Call `load()` after. */
  register(key, path) { this._manifest.set(key, path); return this; }
  /** Declare many at once: { key: relativePath, ... } */
  registerAll(manifest) { for (const k in manifest) this._manifest.set(k, manifest[k]); return this; }

  /**
   * Load all (or the given) registered assets. Resolves when done. Missing DOM
   * (headless) or failed loads are non-fatal: the key simply stays unresolved
   * and callers keep using their procedural fallback.
   */
  async load(keys = null) {
    if (typeof Image === 'undefined') return; // headless — stay on placeholders
    const list = keys ?? [...this._manifest.keys()];
    await Promise.all(list.map((k) => this._loadOne(k)));
  }

  _loadOne(key) {
    const path = this._manifest.get(key);
    if (!path || this._images.has(key)) return Promise.resolve();
    // Inlined data URIs (and absolute/rooted URLs) are used verbatim; only
    // relative theme paths get the base folder prepended. This lets the packer
    // register base64 sprites that work in the self-contained single-file build.
    const url = /^(data:|https?:|\/)/.test(path) ? path : this._base + path;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this._images.set(key, img); resolve(); };
      img.onerror = () => { Logger.warn('AssetManager', `missing asset ${key} (${url}) — using placeholder`); resolve(); };
      img.src = url;
    });
  }

  /** The loaded image for a key, or null if there is no art (yet). */
  image(key) { return this._images.get(key) ?? null; }
  /** True when a key has art ready to draw. */
  has(key) { return this._images.has(key); }

  /**
   * Draw an icon by name. Uses registered art when present; otherwise runs the
   * supplied procedural fallback so nothing ever renders blank.
   * @param {Function} fallback (renderer, cx, cy, size, color) => void
   */
  drawIcon(renderer, name, cx, cy, size, color, fallback) {
    const img = this.image(`icon:${name}`);
    if (img) {
      const s = size * 2;
      renderer.ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
      return true;
    }
    if (fallback) fallback(renderer, cx, cy, size, color);
    return false;
  }
}

/** Project-wide singleton. */
export const AssetManager = new AssetManagerImpl();
