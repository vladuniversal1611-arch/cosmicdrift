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
 * Robustness (production):
 *   - Every write updates a PRIMARY slot and a BACKUP slot, so a crash mid-write
 *     can never brick a save — load falls back to the backup if the primary is
 *     missing or corrupt.
 *   - The document is validated on load; anything unparseable/invalid falls
 *     back gracefully to backup, then to a fresh document.
 *   - Cloud-ready: an optional async CloudProvider is pushed to on flush and can
 *     be pulled from on boot. None ships; the seam is here.
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

const BACKUP_KEY = `${Config.save.storageKey}.bak`;

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
    /** Optional async cloud backend: { pull(): Promise<obj|null>, push(obj) }. */
    this._cloud = null;
  }

  /** True when writes survive a reload (localStorage available). */
  get isPersistent() { return this._storage.isPersistent; }

  /** Inject a cloud sync backend (architecture only; none ships). */
  setCloudProvider(provider) { this._cloud = provider; }

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

  /**
   * Force an immediate write (e.g. on pause / app background). Writes the backup
   * slot first, then the primary, so an interrupted write always leaves at
   * least one valid document. Pushes to the cloud provider if one is attached.
   */
  flush() {
    if (!this._dirty) return;
    this._data.savedAt = Date.now();
    this._storage.write(BACKUP_KEY, this._data);
    this._storage.write(Config.save.storageKey, this._data);
    this._dirty = false;
    this._flushTimer = 0;
    // Fire-and-forget cloud push; failures never affect local play.
    this._cloud?.push?.(this._data)?.catch?.((e) => Logger.warn('SaveSystem', 'cloud push failed', e));
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
    this._storage.remove(BACKUP_KEY);
    this._data = this._freshDocument();
    for (const [name, factory] of this._sliceDefaults) {
      this._data[name] = factory();
    }
    this.markDirty();
    this.events.emit('save:loaded', { data: this._data });
  }

  // --- Internal --------------------------------------------------------------
  _valid(doc) {
    return doc && typeof doc === 'object' && typeof doc.schemaVersion === 'number';
  }

  /** Load primary; on missing/corrupt data, recover from the backup slot. */
  _load() {
    const primary = this._storage.read(Config.save.storageKey, null);
    if (this._valid(primary)) return this._migrate(primary);
    const backup = this._storage.read(BACKUP_KEY, null);
    if (this._valid(backup)) {
      Logger.warn('SaveSystem', 'primary save missing/corrupt — recovered from backup');
      return this._migrate(backup);
    }
    return this._freshDocument();
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
      switch (v) {
        case 1:
          // v1 -> v2: collapse the 5-currency wallet to Gold + Gems so no
          // balance is lost when the economy was consolidated.
          if (data.wallet && typeof data.wallet === 'object') {
            const w = data.wallet;
            let gold = w.gold || 0;
            for (const k of ['coins', 'essence', 'materials', 'stardust']) gold += w[k] || 0;
            const crystal = (w.crystal || 0) + (w.gems || 0);
            data.wallet = { gold, crystal };
          }
          break;
        default: break;
      }
      v++;
    }
    data.schemaVersion = Config.save.schemaVersion;
    return data;
  }

  onDestroy() {
    this.flush();
  }
}
