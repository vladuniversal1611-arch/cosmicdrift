/**
 * main.js
 * -----------------------------------------------------------------------------
 * Application entry point. Grabs the canvas, constructs the Game and starts it.
 * Also wires WebView/browser lifecycle events to the game so state is flushed
 * when the app is backgrounded — important on Android where the process can be
 * killed without warning.
 *
 * This is the ONLY file that touches the DOM outside of the core Canvas/Input
 * classes, keeping the rest of the engine environment-agnostic.
 * -----------------------------------------------------------------------------
 */
import { Game } from './core/Game.js';
import { AssetManager } from './ui/assets/AssetManager.js';
import { AssetManifest } from './ui/assets/manifest.js';
import { ASSETS } from './generated/assets.js';

function boot() {
  const canvas = document.getElementById('game');
  if (!canvas) throw new Error('#game canvas not found');

  // Declare UI art and start loading it (non-blocking): the game runs on
  // procedural placeholders and hot-swaps to art keys as they resolve. With an
  // empty manifest this is a no-op and nothing changes.
  AssetManager.registerAll(AssetManifest);
  AssetManager.registerAll(ASSETS);   // packed sprite atlas (base64 data URIs)
  // Alias packed icon sprites onto the `icon:<name>` keys drawObjectiveIcon uses,
  // so coins/star/chest/gem art swaps in wherever those icons are drawn.
  const iconAlias = { 'icon:coins': 'icon_coin', 'icon:star': 'icon_star', 'icon:chest': 'icon_chest', 'icon:gem': 'icon_gem' };
  for (const [key, src] of Object.entries(iconAlias)) if (ASSETS[src]) AssetManager.register(key, ASSETS[src]);
  AssetManager.load();

  const game = new Game(canvas);
  game.start();

  // Flush the save when the app is hidden/backgrounded (tab switch, home btn).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      game.getSystem('save')?.flush();
    }
  });

  // Expose for debugging in dev consoles / WebView bridges.
  if (typeof window !== 'undefined') window.Skydoku = game;
}

// Start once the DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
