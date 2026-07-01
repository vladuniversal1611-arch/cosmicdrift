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

  // ---- Special-crystal marker sprites (indexed by SPECIAL value 1..4) --------
  // 1=LINE_H, 2=LINE_V, 3=BOMB, 4=RAINBOW.
  const SP_NAMES = { 1: 'line_h', 2: 'line_v', 3: 'bomb', 4: 'rainbow' };
  const sInline = global.SPECIAL_SPRITES || null;
  const sUrls = {}, sImgs = {};
  Object.keys(SP_NAMES).forEach(function (k) {
    const nm = SP_NAMES[k];
    sUrls[k] = (sInline && sInline[nm]) ? sInline[nm] : ('assets/specials/' + nm + '.png');
    if (typeof global.Image === 'function') {
      try { const im = new global.Image(); im.src = sUrls[k]; sImgs[k] = im; } catch (e) {}
    }
  });
  global.SpecialSprites = {
    img: function (sp) { return sImgs[sp] || null; },
    ready: function (sp) { const im = sImgs[sp]; return !!(im && im.complete && im.naturalWidth); }
  };

  // ---- Blocker sprites (ice block / wooden crate / chain-lock overlay) --------
  const BK_IDS = ['ice', 'crate', 'chain'];
  const bkInline = global.BLOCKER_SPRITES || null;
  const bkUrls = {}, bkImgs = {};
  BK_IDS.forEach(function (id) {
    bkUrls[id] = (bkInline && bkInline[id]) ? bkInline[id] : ('assets/blockers/' + id + '.png');
    if (typeof global.Image === 'function') {
      try { const im = new global.Image(); im.src = bkUrls[id]; bkImgs[id] = im; } catch (e) {}
    }
  });
  global.BlockerSprites = {
    img: function (id) { return bkImgs[id] || null; },
    ready: function (id) { const im = bkImgs[id]; return !!(im && im.complete && im.naturalWidth); }
  };

  // ---- Jelly sprites (1 = single layer, 2 = double layer) --------------------
  const jInline = global.JELLY_SPRITES || null;
  const jUrls = {}, jImgs = {};
  ['jelly1', 'jelly2'].forEach(function (nm, i) {
    const k = i + 1;
    jUrls[k] = (jInline && jInline[nm]) ? jInline[nm] : ('assets/jelly/' + nm + '.png');
    if (typeof global.Image === 'function') {
      try { const im = new global.Image(); im.src = jUrls[k]; jImgs[k] = im; } catch (e) {}
    }
  });
  global.JellySprites = {
    img: function (n) { return jImgs[n >= 2 ? 2 : 1] || null; },
    ready: function (n) { const im = jImgs[n >= 2 ? 2 : 1]; return !!(im && im.complete && im.naturalWidth); }
  };

  // ---- UI icons (DOM <img>): currency, boosters, star -----------------------
  const UI_IDS = ['coin', 'gem', 'energy', 'heart', 'hammer', 'shuffle', 'moves', 'star',
    'nav_map', 'nav_modes', 'nav_dragons', 'nav_shop', 'nav_pass', 'nav_home',
    'tile_modes', 'tile_daily', 'tile_wheel', 'tile_summon', 'tile_skills', 'tile_pvp',
    'tile_story', 'tile_quests', 'tile_leaderboard', 'tile_ach', 'tile_settings'];
  const uiInline = global.UI_ICONS || null;
  const uiUrls = {};
  UI_IDS.forEach(function (id) {
    uiUrls[id] = (uiInline && uiInline[id]) ? uiInline[id] : ('assets/ui/' + id + '.png');
  });
  global.UiIcons = {
    url: function (id) { return uiUrls[id] || null; },
    // Returns an <img> tag (or empty string) for inlining into DOM innerHTML.
    tag: function (id, cls) { return uiUrls[id] ? '<img class="uicon ' + (cls || '') + '" src="' + uiUrls[id] + '" alt="">' : ''; }
  };
})(window);
