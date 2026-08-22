/**
 * Localization.js
 * -----------------------------------------------------------------------------
 * A tiny, dependency-free i18n layer. Strings are never hard-coded in screens;
 * they call `t('area.key', params)` which resolves against the active language
 * pack (falling back to English, then to the raw key so nothing ever renders
 * blank). Language packs are registered at runtime, so shipping a new language
 * is a single data file + `L.register('fr', pack)` — no code changes.
 * -----------------------------------------------------------------------------
 */
import en from './en.js';
import uk from './uk.js';
import de from './de.js';
import fr from './fr.js';
import es from './es.js';
import pt from './pt.js';
import it from './it.js';
import tr from './tr.js';
import pl from './pl.js';
import id from './id.js';
import nl from './nl.js';

class Localization {
  constructor() {
    // Order here is the order the Settings language picker cycles through.
    this._packs = { en, uk, de, fr, es, pt, it, tr, pl, id, nl };
    this._lang = 'en';
    this._pack = en;
  }

  /** Register (or replace) a language pack. */
  register(lang, pack) { this._packs[lang] = pack; return this; }

  /** List available language codes. */
  get languages() { return Object.keys(this._packs); }
  get language() { return this._lang; }
  /** The active language's own display name (e.g. "Українська"). */
  currentName() { return this._pack?.meta?.language ?? this._lang; }
  /** A language's own display name by code (for the picker list). */
  nameOf(code) { return this._packs[code]?.meta?.language ?? code; }

  /** Switch language if the pack exists. */
  setLanguage(lang) {
    if (this._packs[lang]) { this._lang = lang; this._pack = this._packs[lang]; }
    return this;
  }

  _lookup(pack, key) {
    return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), pack);
  }

  /**
   * Translate a dotted key with optional `{placeholder}` params. Falls back to
   * English then to the key itself, so a missing translation is visible but
   * never crashes.
   */
  t(key, params) {
    let v = this._lookup(this._pack, key);
    if (v == null && this._pack !== en) v = this._lookup(en, key);
    if (v == null) return key;
    if (params) v = v.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
    return v;
  }
}

export const L = new Localization();
/** Shorthand used everywhere in the UI. */
export const t = (key, params) => L.t(key, params);
