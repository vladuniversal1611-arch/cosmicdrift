/**
 * SaveSystem.js
 * -----------------------------------------------------------------------------
 * Owns the single, versioned save document and its persistence.
 *
 * Design:
 *   - There is ONE canonical save object. Other systems own "slices" of it
 *     (economy wallet, settings, missions progress, ...) and register their
 *     slice defaults here. This keeps persistence centralised while systems
 *     stay independent.
 *   - Writes are debounced: systems call `markDirty()` freely and the actual
 *     localStorage write is coalesced, protecting frame time.
 *   - A migration hook upgrades old schema versions on load.
 *
 * Events:
 *   emits  'save:loaded'  ({ data })     after the document is ready
 *   emits  'save:written' ({ data })     after a successful flush
 *   listens (none — systems push via getSlice/markDirty)
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Logger } from '../../utils/Logger.js';
import { Storage } from './Storage.js';

export class SaveSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'save';
    this._storage = new Storage();
    /** The live save document. */
    this._data = null;
    this._dirty = false;
    this._flushTimer = 0;
    /** Registered slice default factories, keyed by slice name. */
    this._sliceDefaults = new Map();
  }

  onInit() {
    this._data = this._load();
    // Defer the 'loaded' broadcast to the end of init so every system has
    // registered its slice defaults before consuming them.
    Promise.resolve().then(() => this.events.emit('save:loaded', { data: this._data }));
  }

  /**
   * Systems call this during their own onInit to declare a persistent slice
   * and its default value. Returns the current (possibly loaded) slice.
   * @param {string} name
   * @param {() => object} defaultsFactory
   */
  registerSlice(name, defaultsFactory) {
    this._sliceDefaults.set(name, defaultsFactory);
    if (!(name in this._data)) {
      this._data[name] = defaultsFactory();
      this.markDirty();
    }
    return this._data[name];
  }

  /** Read a registered slice. */
  getSlice(name) { return this._data?.[name]; }

  /** Mark the document as needing a write; the flush is debounced. */
  markDirty() {
    this._dirty = true;
    this._flushTimer = Config.save.autosaveDebounceMs / 1000;
  }

  /** Force an immediate synchronous write (e.g. on pause / app background). */
  flush() {
    if (!this._dirty) return;
    this._storage.write(Config.save.storageKey, this._data);
    this._dirty = false;
    this._flushTimer = 0;
    this.events.emit('save:written', { data: this._data });
  }

  update(dt) {
    if (!this._dirty) return;
    this._flushTimer -= dt;
    if (this._flushTimer <= 0) this.flush();
  }

  /** Wipe all progress. Used by the settings "reset" action. */
  reset() {
    this._storage.remove(Config.save.storageKey);
    this._data = this._freshDocument();
    for (const [name, factory] of this._sliceDefaults) {
      this._data[name] = factory();
    }
    this.markDirty();
    this.events.emit('save:loaded', { data: this._data });
  }

  // --- Internal --------------------------------------------------------------
  _load() {
    const stored = this._storage.read(Config.save.storageKey, null);
    if (!stored) return this._freshDocument();
    return this._migrate(stored);
  }

  _freshDocument() {
    return {
      schemaVersion: Config.save.schemaVersion,
      createdAt: Date.now(),
    };
  }

  /**
   * Upgrade an older document to the current schema. Add cases as the schema
   * evolves; each step mutates `data` forward by exactly one version.
   */
  _migrate(data) {
    let v = data.schemaVersion ?? 0;
    while (v < Config.save.schemaVersion) {
      Logger.info('SaveSystem', `migrating save v${v} -> v${v + 1}`);
      // switch (v) { case 0: /* ...transform... */ break; }
      v++;
    }
    data.schemaVersion = Config.save.schemaVersion;
    return data;
  }

  onDestroy() {
    this.flush();
  }
}
