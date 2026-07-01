/* ============================================================
   Dragon sprite loader. Uses inlined data URIs when present
   (single-file build) or falls back to assets/dragons/*.png.
   ============================================================ */
(function (global) {
  'use strict';
  const IDS = ['flare', 'frost', 'storm', 'verdant', 'aether',
    'boss_ash', 'boss_titan', 'boss_storm', 'boss_beast', 'boss_phoenix', 'egg'];
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

  // ---- Crystal gem sprites (0..5 = ruby/sapphire/emerald/topaz/amethyst/pearl)
  const gInline = global.GEM_SPRITES || null;
  const gUrls = {}, gImgs = {};
  for (let i = 0; i < 6; i++) {
    const id = 'gem' + i;
    gUrls[i] = (gInline && gInline[id]) ? gInline[id] : ('assets/gems/' + id + '.png');
    if (typeof global.Image === 'function') {
      try { const im = new global.Image(); im.src = gUrls[i]; gImgs[i] = im; } catch (e) {}
    }
  }
  global.GemSprites = {
    url: function (t) { return gUrls[t] || null; },
    img: function (t) { return gImgs[t] || null; },
    ready: function (t) { const im = gImgs[t]; return !!(im && im.complete && im.naturalWidth); }
  };
})(window);
