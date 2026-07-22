/**
 * manifest.js
 * -----------------------------------------------------------------------------
 * The single declaration of visual ART for the UI. Keys follow the AssetManager
 * namespacing (`icon:`, `frame:`, `bg:`, `fx:`). This is intentionally EMPTY
 * today: with no art registered every draw primitive falls back to its
 * procedural placeholder, so the game looks exactly as it does now.
 *
 * To ship final art later, drop the files under `assets/` and add lines here —
 * no UI or gameplay code changes. Examples (commented until art exists):
 *
 *   'icon:coins':        'assets/icons/coins.png',
 *   'icon:gem':          'assets/icons/gem.png',
 *   'icon:chest':        'assets/icons/chest.png',
 *   'frame:button':      'assets/frames/button.9.png',   // nine-slice
 *   'frame:panel.glass': 'assets/frames/panel_glass.9.png',
 *   'bg:sky':            'assets/bg/sky.png',
 * -----------------------------------------------------------------------------
 */
export const AssetManifest = Object.freeze({
  // (empty — procedural placeholders in use; add art keys here to re-skin)
});
