/* ============================================================
   SHAPES — набір фігур для розміщення
   Матриці клітинок + вага появи + рівень розблокування
   Класичні (L, T, квадрат, паличка, хрест, Z, S, кутові)
   та авторські (корона, серце, зигзаг-стріла, діамант...)
   ============================================================ */
const Shapes = (() => {
  // Кожна фігура: cells = [[x,y]...], w = вага появи, lvl = з якого рівня доступна
  const DEFS = [
    // --- одиночні / малі ---
    { id: 'dot',    cells: [[0,0]], w: 5, lvl: 1 },
    { id: 'duo_h',  cells: [[0,0],[1,0]], w: 7, lvl: 1 },
    { id: 'duo_v',  cells: [[0,0],[0,1]], w: 7, lvl: 1 },
    { id: 'tri_h',  cells: [[0,0],[1,0],[2,0]], w: 8, lvl: 1 },
    { id: 'tri_v',  cells: [[0,0],[0,1],[0,2]], w: 8, lvl: 1 },
    // --- палички ---
    { id: 'bar4_h', cells: [[0,0],[1,0],[2,0],[3,0]], w: 6, lvl: 1 },
    { id: 'bar4_v', cells: [[0,0],[0,1],[0,2],[0,3]], w: 6, lvl: 1 },
    { id: 'bar5_h', cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], w: 3, lvl: 4 },
    { id: 'bar5_v', cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], w: 3, lvl: 4 },
    // --- квадрати ---
    { id: 'sq2',    cells: [[0,0],[1,0],[0,1],[1,1]], w: 8, lvl: 1 },
    { id: 'sq3',    cells: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], w: 2, lvl: 8 },
    { id: 'rect23', cells: [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]], w: 3, lvl: 5 },
    // --- кутові ---
    { id: 'corner2',   cells: [[0,0],[1,0],[0,1]], w: 7, lvl: 1 },
    { id: 'corner2b',  cells: [[0,0],[1,0],[1,1]], w: 7, lvl: 1 },
    { id: 'corner2c',  cells: [[0,0],[0,1],[1,1]], w: 7, lvl: 1 },
    { id: 'corner2d',  cells: [[1,0],[0,1],[1,1]], w: 7, lvl: 1 },
    { id: 'corner3',   cells: [[0,0],[0,1],[0,2],[1,2],[2,2]], w: 4, lvl: 3 },
    { id: 'corner3b',  cells: [[0,0],[1,0],[2,0],[0,1],[0,2]], w: 4, lvl: 3 },
    // --- L ---
    { id: 'L',      cells: [[0,0],[0,1],[0,2],[1,2]], w: 6, lvl: 2 },
    { id: 'L_r',    cells: [[1,0],[1,1],[1,2],[0,2]], w: 6, lvl: 2 },
    { id: 'L_up',   cells: [[0,0],[1,0],[0,1],[0,2]], w: 5, lvl: 2 },
    // --- T ---
    { id: 'T',      cells: [[0,0],[1,0],[2,0],[1,1]], w: 6, lvl: 2 },
    { id: 'T_down', cells: [[1,0],[0,1],[1,1],[2,1]], w: 6, lvl: 2 },
    { id: 'T_left', cells: [[0,0],[0,1],[0,2],[1,1]], w: 5, lvl: 2 },
    // --- S / Z ---
    { id: 'S',      cells: [[1,0],[2,0],[0,1],[1,1]], w: 5, lvl: 3 },
    { id: 'Z',      cells: [[0,0],[1,0],[1,1],[2,1]], w: 5, lvl: 3 },
    { id: 'S_v',    cells: [[0,0],[0,1],[1,1],[1,2]], w: 5, lvl: 3 },
    { id: 'Z_v',    cells: [[1,0],[0,1],[1,1],[0,2]], w: 5, lvl: 3 },
    // --- хрест ---
    { id: 'plus',   cells: [[1,0],[0,1],[1,1],[2,1],[1,2]], w: 4, lvl: 5 },
    // --- АВТОРСЬКІ ---
    // Діагональ-двійка: незвична, вимагає планування
    { id: 'diag2',  cells: [[0,0],[1,1]], w: 3, lvl: 12 },
    { id: 'diag2b', cells: [[1,0],[0,1]], w: 3, lvl: 12 },
    // Корона: символ гри
    { id: 'crown',  cells: [[0,0],[2,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1]], w: 1, lvl: 30 },
    // Підкова (U)
    { id: 'ushape', cells: [[0,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]], w: 2, lvl: 18 },
    // Блискавка
    { id: 'bolt',   cells: [[1,0],[1,1],[0,1],[0,2]], w: 3, lvl: 14 },
    // Діамант (ромб)
    { id: 'gem5',   cells: [[1,0],[0,1],[1,1],[2,1],[1,2]], w: 2, lvl: 22 },
    // Сходинки
    { id: 'stairs', cells: [[0,0],[0,1],[1,1],[1,2],[2,2]], w: 2, lvl: 26 },
  ];

  // Палітри кольорів блоків (індекси в темах)
  const COLOR_COUNT = 7;

  /** Список доступних фігур для рівня складності */
  function available(level) {
    return DEFS.filter(d => d.lvl <= Math.max(1, level));
  }

  /**
   * Вибрати випадкову фігуру зваженим випадком.
   * rng — детермінований генератор (для daily/tournament)
   */
  function pick(level, rng) {
    const pool = available(level);
    let total = 0;
    for (const d of pool) total += d.w;
    let r = rng() * total;
    for (const d of pool) {
      r -= d.w;
      if (r <= 0) return d;
    }
    return pool[pool.length - 1];
  }

  /**
   * Створити ігрову фігуру: клітинки + колір + модифікатор.
   * Спец-блоки (gold/rainbow/bomb) з'являються з шансом залежно від рівня.
   */
  function createPiece(level, rng, unlocked) {
    const def = pick(level, rng);
    const color = Math.floor(rng() * COLOR_COUNT);
    // Модифікатор для однієї клітинки фігури
    let mod = null;
    const roll = rng();
    if (unlocked.rainbow && def.cells.length === 1 && roll < 0.10) mod = 'rainbow';
    else if (unlocked.gold && roll < 0.08) mod = 'gold';
    else if (unlocked.bomb && roll >= 0.08 && roll < 0.13) mod = 'bomb';
    const modIndex = mod ? Math.floor(rng() * def.cells.length) : -1;

    // Розмір bounding box — для рендера
    let maxX = 0, maxY = 0;
    for (const [x, y] of def.cells) { if (x > maxX) maxX = x; if (y > maxY) maxY = y; }

    return {
      id: def.id,
      cells: def.cells,
      color,
      mod, modIndex,
      w: maxX + 1, h: maxY + 1,
      used: false,
    };
  }

  return { DEFS, COLOR_COUNT, available, pick, createPiece };
})();
