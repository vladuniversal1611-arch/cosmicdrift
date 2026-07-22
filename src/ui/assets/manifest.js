/**
 * manifest.js
 * -----------------------------------------------------------------------------
 * The ACTIVE art registry: logical key → path RELATIVE to the AssetManager base
 * (default `assets/`, swappable per theme). Paths follow the standardized naming
 * convention (see docs/ASSET_PIPELINE.md). It is intentionally EMPTY today —
 * with nothing registered, every draw primitive uses its procedural placeholder,
 * so the game looks exactly as it does now.
 *
 * To ship art: add the file under assets/<folder>/ using the naming convention,
 * then uncomment / add its line here. No UI or gameplay code changes. Swapping a
 * whole theme is `AssetManager.setTheme('winter')` (a mirrored folder) — the keys
 * and paths below stay identical.
 *
 * The full planned catalog (icons, button states, panels, tiles, dragons,
 * backgrounds, fx, audio …) lives in docs/ASSET_PIPELINE.md. A representative
 * slice is listed here (commented) so wiring art is copy-paste:
 *
 *   // --- Icons (assets/ui/icons/) ---
 *   'icon:coins':   'ui/icons/icon_coin.png',
 *   'icon:gem':     'ui/icons/icon_gem.png',
 *   'icon:energy':  'ui/icons/icon_energy.png',
 *   'icon:chest':   'ui/icons/icon_chest.png',
 *   'icon:dragon':  'ui/icons/icon_dragon.png',
 *
 *   // --- Button frames, nine-slice, per state (assets/ui/buttons/) ---
 *   'frame:button':          'ui/buttons/btn_default_idle.9.png',
 *   'frame:button:pressed':  'ui/buttons/btn_default_pressed.9.png',
 *   'frame:button:disabled': 'ui/buttons/btn_default_disabled.9.png',
 *   'frame:button.play':     'ui/buttons/btn_play_idle.9.png',
 *
 *   // --- Panels / cards (assets/ui/panels|frames|cards/) ---
 *   'frame:panel.glass': 'ui/frames/panel_large_glass.9.png',
 *   'frame:card':        'ui/cards/card_default.9.png',
 *   'frame:badge':       'ui/badges/badge_notification.9.png',
 *
 *   // --- Backgrounds (assets/backgrounds/) ---
 *   'bg:main_menu':  'backgrounds/bg_main_menu.png',
 *   'bg:gameplay':   'backgrounds/bg_gameplay.png',
 *   'bg:world_map':  'backgrounds/bg_world_map.png',
 *
 *   // --- Effects / particles (assets/effects|particles/) ---
 *   'fx:sparkle.small': 'particles/fx_sparkle_small.png',
 *   'fx:sparkle.large': 'particles/fx_sparkle_large.png',
 *
 *   // --- Dragons, per state (assets/dragons/) ---
 *   'dragon:blue.idle':  'dragons/dragon_blue_idle.png',
 *   'dragon:blue.happy': 'dragons/dragon_blue_happy.png',
 *   'dragon:blue.sleep': 'dragons/dragon_blue_sleep.png',
 * -----------------------------------------------------------------------------
 */
export const AssetManifest = Object.freeze({
  // (empty — procedural placeholders in use; add standardized keys/paths here)
});
