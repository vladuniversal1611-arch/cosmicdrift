/* ============================================================
 * Mystic Relics — assets.js
 * Необов'язкові PNG-спрайти: якщо файл існує у папці assets/ —
 * гра використовує його, інакше лишається emoji/процедурна
 * графіка. Заміна можлива поступово, файл за файлом.
 * Промпти для генерації — в ART_PROMPTS.md.
 * ============================================================ */
'use strict';

const Assets = {
  tiles: [],        // Image | null для кожного з 72 типів
  bg: {},           // { forest|cave|temple: Image }
  _tilesLoaded: 0,

  load() {
    // Вбудовані асети (однофайловий білд інжектить window.EMBEDDED_ASSETS)
    const emb = (typeof window !== 'undefined' && window.EMBEDDED_ASSETS) || { tiles: {}, bg: {} };
    // Плитки: assets/tiles/tile_00.png … tile_71.png
    for (let i = 0; i < CFG.TILES.length; i++) {
      const img = new Image();
      img.onload = () => {
        this.tiles[i] = img;
        this._tilesLoaded++;
        Board.spriteCache.clear();            // перерендер облич плиток
      };
      img.onerror = () => { this.tiles[i] = null; };
      img.src = (emb.tiles && emb.tiles[i]) || `assets/tiles/tile_${String(i).padStart(2, '0')}.png`;
    }
    // Фони сцен: assets/bg/forest.png | cave.png | temple.png
    for (const scene of ['forest', 'cave', 'temple']) {
      const img = new Image();
      img.onload = () => {
        this.bg[scene] = img;
        if (Background.canvas) Background.build();
      };
      img.onerror = () => {};
      img.src = (emb.bg && emb.bg[scene]) || `assets/bg/${scene}.png`;
    }
  },

  /** Чи є спрайт для плитки типу i. */
  hasTile(i) { return !!this.tiles[i]; },

  /** HTML плитки для DOM-екранів (колекція): <img> або emoji. */
  tileHtml(i, size = 27) {
    return this.hasTile(i)
      ? `<img src="${this.tiles[i].src}" style="width:${size}px;height:${size}px;object-fit:contain" alt="">`
      : CFG.TILES[i].g;
  }
};
