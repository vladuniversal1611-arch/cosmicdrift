/**
 * Haptics.js
 * -----------------------------------------------------------------------------
 * One place for tactile feedback. Maps semantic intensities to short vibration
 * patterns via the Web Vibration API, respecting the device's capability and
 * the player's "haptics" setting. Safe no-op on desktop / unsupported devices.
 *
 * Usage: Haptics.light(game) on a tap/placement, medium(game) on a line clear,
 * heavy(game) on a combo or victory. Kept dependency-free (takes the game only
 * to read the settings flag) so any system can call it.
 * -----------------------------------------------------------------------------
 */
const PATTERNS = { light: 10, medium: [0, 18], heavy: [0, 24, 30, 24] };

function enabled(game) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  const s = game?.getSystem?.('settings');
  return s ? s.get('haptics') !== false : true;   // default on when unspecified
}

function fire(game, pattern) {
  if (!enabled(game)) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

export const Haptics = {
  light: (game) => fire(game, PATTERNS.light),
  medium: (game) => fire(game, PATTERNS.medium),
  heavy: (game) => fire(game, PATTERNS.heavy),
};
