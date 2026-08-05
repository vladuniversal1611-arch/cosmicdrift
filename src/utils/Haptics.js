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
// Semantic patterns, tuned to feel distinct on the wrist without ever being
// buzzy. Arrays are [wait, vibrate, wait, vibrate, …] ms; a bare number is a
// single pulse. Multi-pulse verbs "shape" the feedback (a rising success, a
// firm two-tap warning, a rolling victory) so the hand can tell events apart.
const PATTERNS = {
  select: 7,                     // crisp UI tick (button / chip)
  light: 11,                     // a piece settling
  medium: [0, 16, 26, 12],       // a line clearing (two soft taps)
  heavy: [0, 22, 34, 26],        // a combo / big clear
  warn: [0, 26, 40, 26],         // an invalid or blocked action
  success: [0, 14, 42, 18, 30, 30], // a reward lands (rising three-tap)
  victory: [0, 30, 40, 22, 40, 40], // level / world complete (rolling)
};

// Pure widgets (buttons, chips) fire haptics without holding a game reference,
// so fall back to the running instance published on the global. This keeps the
// player's haptics setting authoritative even for context-free callers.
function resolveGame(game) {
  if (game) return game;
  return (typeof globalThis !== 'undefined' && globalThis.CosmicDrift) || null;
}

function enabled(game) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  const s = resolveGame(game)?.getSystem?.('settings');
  return s ? s.get('haptics') !== false : true;   // default on when unspecified
}

function fire(game, pattern) {
  if (!enabled(game)) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

export const Haptics = {
  select: (game) => fire(game, PATTERNS.select),
  light: (game) => fire(game, PATTERNS.light),
  medium: (game) => fire(game, PATTERNS.medium),
  heavy: (game) => fire(game, PATTERNS.heavy),
  warn: (game) => fire(game, PATTERNS.warn),
  success: (game) => fire(game, PATTERNS.success),
  victory: (game) => fire(game, PATTERNS.victory),
};
