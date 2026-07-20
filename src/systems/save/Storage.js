/**
 * Storage.js
 * -----------------------------------------------------------------------------
 * A defensive wrapper around localStorage.
 *
 * On Android WebView (and private-mode browsers) storage can be unavailable or
 * throw on write. This wrapper degrades gracefully to an in-memory map so the
 * game never crashes — persistence simply becomes session-only. All JSON
 * (de)serialisation is centralised here.
 * -----------------------------------------------------------------------------
 */
import { Logger } from '../../utils/Logger.js';

export class Storage {
  constructor() {
    this._memory = new Map();
    this._backend = this._probe();
  }

  /** Detect a working localStorage; fall back to memory if not. */
  _probe() {
    try {
      const k = '__cd_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (e) {
      Logger.warn('Storage', 'localStorage unavailable — using in-memory store');
      return null;
    }
  }

  /** True when writes will survive a reload. */
  get isPersistent() { return this._backend !== null; }

  /** Read and parse a JSON value; returns `fallback` if missing or corrupt. */
  read(key, fallback = null) {
    try {
      const raw = this._backend
        ? this._backend.getItem(key)
        : this._memory.get(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      Logger.warn('Storage', `failed to read "${key}"`, e);
      return fallback;
    }
  }

  /** Serialise and write a value. Returns true on success. */
  write(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (this._backend) this._backend.setItem(key, raw);
      else this._memory.set(key, raw);
      return true;
    } catch (e) {
      Logger.warn('Storage', `failed to write "${key}"`, e);
      return false;
    }
  }

  remove(key) {
    if (this._backend) this._backend.removeItem(key);
    else this._memory.delete(key);
  }
}
