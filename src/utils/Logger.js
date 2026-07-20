/**
 * Logger.js
 * -----------------------------------------------------------------------------
 * Thin logging wrapper with level filtering, driven by Config.debug.logLevel.
 * Centralising logging means we can silence output in production builds and
 * later route logs to an on-screen console for on-device debugging without
 * touching call sites.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

class LoggerImpl {
  constructor() {
    this._threshold = LEVELS[Config.debug.logLevel] ?? LEVELS.info;
  }

  /** Change the active log level at runtime (e.g. from a debug menu). */
  setLevel(level) {
    this._threshold = LEVELS[level] ?? this._threshold;
  }

  _log(level, tag, args) {
    if (LEVELS[level] < this._threshold) return;
    const prefix = `%c[${tag}]`;
    const style = 'color:#7c5cff;font-weight:bold';
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, style, ...args);
  }

  debug(tag, ...args) { this._log('debug', tag, args); }
  info(tag, ...args) { this._log('info', tag, args); }
  warn(tag, ...args) { this._log('warn', tag, args); }
  error(tag, ...args) { this._log('error', tag, args); }
}

/** Shared singleton logger. */
export const Logger = new LoggerImpl();
