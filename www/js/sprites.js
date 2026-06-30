/* ============================================================
   Dragon sprite loader. Uses inlined data URIs when present
   (single-file build) or falls back to assets/dragons/*.png.
   ============================================================ */
(function (global) {
  'use strict';
  const IDS = ['flare', 'frost', 'storm', 'verdant', 'aether'];
  const inline = global.DRAGON_SPRITES || null;
  const urls = {}, imgs = {};
  IDS.forEach(function (id) {
    urls[id] = (inline && inline[id]) ? inline[id] : ('assets/dragons/' + id + '.png');
    if (typeof global.Image === 'function') {
      try { const im = new global.Image(); im.src = urls[id]; imgs[id] = im; } catch (e) {}
    }
  });
  global.DragonSprites = {
    url: function (id) { return urls[id] || null; },
    img: function (id) { return imgs[id] || null; },
    ready: function (id) { const im = imgs[id]; return !!(im && im.complete && im.naturalWidth); }
  };
})(window);
