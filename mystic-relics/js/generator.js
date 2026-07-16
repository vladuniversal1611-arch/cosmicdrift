/* ============================================================
 * Mystic Relics — generator.js
 * Процедурний генератор рівнів.
 *
 * Принцип гарантованої прохідності («зворотне розв'язання»):
 *   1. Будуємо форму рівня — набір позицій {x, y, z}.
 *   2. Симулюємо ПРОХОДЖЕННЯ: на кожному кроці серед плиток,
 *      що залишилися, обираємо 3 «відкриті» позиції та
 *      призначаємо їм ОДИН тип, після чого прибираємо їх.
 *   3. Отриманий порядок вилучення — це готовий розв'язок,
 *      отже рівень гарантовано прохідний без тупиків.
 *
 * Координати: плитка займає 2×2 клітинки; сусідні плитки можуть
 * стояти з півкроковим зсувом (як у класичних tile-matching ігор).
 * Плитка «відкрита», якщо зверху її ніхто не перекриває І вільна
 * хоча б одна бічна сторона (ліва або права).
 * ============================================================ */
'use strict';

const Generator = {

  /** Головна точка входу: конфіг рівня № n.
   *  salt — необов'язкове зерно варіації: та сама складність,
   *  але інша розкладка (дзен-режим, щоденний виклик). */
  generate(n, salt = 0) {
    const tier = Math.floor((n - 1) / 10);           // кожні 10 рівнів складніше
    const rnd = Utils.rng((n * 2654435761 + salt * 97003) % 2147483647 + 7);

    // Параметри складності
    const tileCount = Math.min(27 + tier * 6 + (n % 10) * 3, 150);
    const typeCount = Math.min(6 + Math.floor(tier / 2), 26);
    // Багатошарова «гірка» з першого рівня — як у референсних tile-matching ігор
    const maxLayers = Math.min(3 + Math.floor(tier / 3), 6);
    const timeLimit = Utils.clamp(Math.round(tileCount * 3.2 - tier * 6), 75, 420);

    // 1. Форма рівня
    let positions = this._buildLayout(rnd, tileCount, maxLayers);

    this._salt = salt;
    // 2. Призначення типів зворотним розв'язанням (з повторами при невдачі)
    let types = null;
    for (let attempt = 0; attempt < 30 && !types; attempt++) {
      types = this._assignTypes(positions, typeCount, rnd, n);
      if (!types) positions = this._trimTop(positions, 3); // спрощуємо форму
    }
    // Аварійний випадок (практично недосяжний): плоский рівень
    if (!types) {
      positions = this._flatLayout(rnd, 36);
      types = this._assignTypes(positions, 6, rnd, n);
    }

    // 3. Перепони згідно з тіром
    const tiles = positions.map((p, i) => ({ x: p.x, y: p.y, z: p.z, type: types.map[i] }));
    this._placeObstacles(tiles, tier, rnd, types.solveOrder);

    return { level: n, tier, tiles, typeCount, timeLimit, solveOrder: types.solveOrder };
  },

  /* ------------------------------------------------------------
   * ФОРМИ РІВНІВ — бібліотека впізнаваних силуетів (піксель-арт
   * бітмапи 8×7 плиток): серце, коло, ведмедик, зірка, метелик,
   * квітка, ромб, хрест, корона, ялинка, будиночок, місяць,
   * рибка, перстень, блискавка, грибок. Кожен рівень сідовано
   * отримує форму, що пасує його розміру; форми чергуються.
   * ---------------------------------------------------------- */
  SHAPES: {
    heart:     ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...'],
    circle:    ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..'],
    bear:      ['XX....XX', 'XXX..XXX', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..'],
    star:      ['...XX...', '.XXXXXX.', 'XXXXXXXX', '..XXXX..', '.XX..XX.', 'XX....XX'],
    butterfly: ['XX....XX', 'XXX..XXX', 'XXXXXXXX', '.XXXXXX.', 'XXXXXXXX', 'XX....XX'],
    flower:    ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '...XX...'],
    diamond:   ['...XX...', '..XXXX..', '.XXXXXX.', '.XXXXXX.', '..XXXX..', '...XX...'],
    cross:     ['..XXXX..', '..XXXX..', 'XXXXXXXX', 'XXXXXXXX', '..XXXX..', '..XXXX..'],
    crown:     ['X..XX..X', 'XX.XX.XX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'],
    tree:      ['...XX...', '..XXXX..', '.XXXXXX.', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', '...XX...'],
    house:     ['...XX...', '..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XX.XX.XX'],
    moon:      ['..XXXX..', '.XXX....', '.XXX....', '.XXX....', '.XXXX...', '..XXXXX.'],
    fish:      ['.XXXX..X', 'XXXXXX.X', 'XXXXXXXX', 'XXXXXX.X', '.XXXX..X'],
    ring:      ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    bolt:      ['....XXX.', '...XXX..', '..XXXXX.', '.XXXX...', '..XXX...', '.XXX....'],
    mushroom:  ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', '...XX...', '...XX...', '..XXXX..']
  },

  _buildLayout(rnd, count, maxLayers) {
    const W = 16, H = 14;                       // поле у клітинках (плитка = 2×2)

    // Місткість стеку над основою (та сама формула, що у стекінгу)
    let capacity = 1, cur = 1;
    for (let z = 1; z < maxLayers; z++) { cur *= Math.max(0.3, 0.72 - z * 0.07); capacity += cur; }

    // Розміри форм (кешуємо один раз)
    if (!this._shapeSizes) {
      this._shapeSizes = {};
      for (const k in this.SHAPES) {
        this._shapeSizes[k] = this.SHAPES[k].join('').split('').filter(c => c === 'X').length;
      }
    }
    // Кандидати: основа вміщується у count, а стек здатен добрати до count
    const names = Object.keys(this.SHAPES);
    let eligible = names.filter(k => this._shapeSizes[k] <= count && this._shapeSizes[k] * capacity >= count * 0.8);
    if (!eligible.length) eligible = names.filter(k => this._shapeSizes[k] <= count);
    if (!eligible.length) eligible = ['bolt'];
    const shapeName = eligible[Utils.ri(rnd, 0, eligible.length - 1)];
    const bmp = this.SHAPES[shapeName];
    const mirror = rnd() < 0.4;                 // дзеркальний варіант для різноманіття

    // Базовий шар — точний силует бітмапи, відцентрований на полі
    const bw = Math.max(...bmp.map(r => r.length)) * 2;
    const bh = bmp.length * 2;
    const offX = Math.floor((W - bw) / 4) * 2;
    const offY = Math.floor((H - bh) / 4) * 2;
    const layers = [];
    const base = [];
    for (let row = 0; row < bmp.length; row++) {
      for (let col = 0; col < bmp[row].length; col++) {
        if (bmp[row][col] !== 'X') continue;
        const c = mirror ? bmp[row].length - 1 - col : col;
        base.push({ x: offX + c * 2, y: offY + row * 2, z: 0 });
      }
    }
    Utils.shuffle(base, rnd);
    layers.push(base);

    // Верхні шари — щільна «черепиця»: кандидати з півкроковими зсувами
    // (±1 клітинка) над нижнім шаром, беруться лише позиції з достатньою
    // опорою, пріоритет — ближче до центру ваги (пірамідальний силует).
    for (let z = 1; z < maxLayers; z++) {
      const below = layers[layers.length - 1];
      if (!below || below.length < 2 || below[0].z !== z - 1) break;

      // Центр ваги нижнього шару
      const cx = below.reduce((a, b) => a + b.x, 0) / below.length;
      const cy = below.reduce((a, b) => a + b.y, 0) / below.length;

      // Усі можливі позиції над нижнім шаром (включно з зсувом на пів плитки)
      const seen = new Set();
      const cand = [];
      for (const b of below) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = b.x + dx, y = b.y + dy;
            if (x < 0 || y < 0 || x > W - 2 || y > H - 2) continue;
            const key = x * 100 + y;
            if (seen.has(key)) continue;
            seen.add(key);
            // Площа опори: сума перекриттів 2×2-слідів з нижніми плитками
            // (повна опора = 4, половина = 2, кут = 1)
            let sup = 0;
            for (const o of below) {
              const ox = Math.abs(o.x - x), oy = Math.abs(o.y - y);
              if (ox < 2 && oy < 2) sup += (2 - ox) * (2 - oy);
            }
            if (sup >= 2) cand.push({ x, y, score: Math.abs(x - cx) + Math.abs(y - cy) + rnd() * 4 });
          }
        }
      }
      // Ближчі до центру — першими; легка випадковість для різноманіття
      cand.sort((a, b) => a.score - b.score);

      const target = Math.max(2, Math.round(below.length * (0.72 - z * 0.07)));
      const next = [];
      for (const c of cand) {
        if (next.length >= target) break;
        if (next.some(q => Math.abs(q.x - c.x) < 2 && Math.abs(q.y - c.y) < 2)) continue;
        next.push({ x: c.x, y: c.y, z });
      }
      if (!next.length) break;
      layers.push(next);
    }

    // Збираємо потрібну кількість: шари знизу вгору, кратно 3
    let all = [];
    for (const l of layers) all = all.concat(l);
    if (all.length > count) {
      // Прибираємо зайві з країв верхніх шарів
      all.sort((a, b) => a.z - b.z || (Math.abs(a.x - 7) + Math.abs(a.y - 6)) - (Math.abs(b.x - 7) + Math.abs(b.y - 6)));
      all = all.slice(0, count);
    }
    while (all.length % 3 !== 0) all.pop();
    // Верхній шар без підтримки після обрізання — опускаємо
    this._fixSupport(all);
    return all;
  },

  /** Простий плоский резервний рівень. */
  _flatLayout(rnd, count) {
    const out = [];
    for (let y = 0; y < 12 && out.length < count; y += 2)
      for (let x = 0; x < 12 && out.length < count; x += 2)
        out.push({ x, y, z: 0 });
    return out;
  },

  /** Опускає плитки верхніх шарів, що втратили підтримку. */
  _fixSupport(all) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of all) {
        while (t.z > 0 && !all.some(o => o !== t && o.z === t.z - 1 && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2)) {
          // Немає підтримки і клітинка нижче вільна — опускаємо
          if (all.some(o => o !== t && o.z === t.z - 1 && o.x === t.x && o.y === t.y)) break;
          t.z--; changed = true;
        }
      }
    }
  },

  _trimTop(positions, n) {
    const sorted = positions.slice().sort((a, b) => b.z - a.z);
    const out = positions.filter(p => !sorted.slice(0, n).includes(p));
    while (out.length % 3 !== 0) out.pop();
    return out;
  },

  /* ------------------------------------------------------------
   * Перевірка «відкритості» позиції серед множини remaining.
   * ---------------------------------------------------------- */
  isOpen(pos, remaining) {
    for (const o of remaining) {
      if (o === pos) continue;
      // Хтось зверху перекриває
      if (o.z === pos.z + 1 && Math.abs(o.x - pos.x) < 2 && Math.abs(o.y - pos.y) < 2) return false;
    }
    // Хоча б одна бічна сторона вільна
    const leftBlocked = remaining.some(o => o !== pos && o.z === pos.z && o.x === pos.x - 2 && Math.abs(o.y - pos.y) < 2);
    const rightBlocked = remaining.some(o => o !== pos && o.z === pos.z && o.x === pos.x + 2 && Math.abs(o.y - pos.y) < 2);
    return !(leftBlocked && rightBlocked);
  },

  /* ------------------------------------------------------------
   * Зворотне розв'язання: повертає { map: type[], solveOrder }
   * або null, якщо форма зайшла у глухий кут.
   * ---------------------------------------------------------- */
  _assignTypes(positions, typeCount, rnd, levelNum) {
    // Сідовано обираємо підмножину типів плиток для цього рівня
    const pool = Utils.shuffle([...Array(CFG.TILES.length).keys()], Utils.rng(levelNum * 7919 + 13 + (this._salt || 0))).slice(0, typeCount);

    const remaining = new Set(positions);
    const map = new Map();          // position -> type
    const solveOrder = [];          // порядок вилучення (розв'язок)
    let lastType = -1;

    while (remaining.size > 0) {
      const rem = [...remaining];
      const open = rem.filter(p => this.isOpen(p, rem));
      if (open.length < 3) return null;          // глухий кут — форма перебудовується
      Utils.shuffle(open, rnd);
      const triple = open.slice(0, 3);
      // Тип: уникаємо повтору поспіль, щоб рівень був різноманітним
      let type = pool[Utils.ri(rnd, 0, pool.length - 1)];
      if (type === lastType && pool.length > 1) type = pool[(pool.indexOf(type) + 1) % pool.length];
      lastType = type;
      for (const p of triple) { map.set(p, type); remaining.delete(p); }
      solveOrder.push(triple.map(p => positions.indexOf(p)));
    }
    return { map: positions.map(p => map.get(p)), solveOrder };
  },

  /* ------------------------------------------------------------
   * Перепони. Розставляються так, щоб НЕ ламати знайдений
   * розв'язок: «замки» вішаються лише на трійки, які у розв'язку
   * йдуть ПІСЛЯ трійки-ключа; решта перепон лише сповільнюють.
   * ---------------------------------------------------------- */
  _placeObstacles(tiles, tier, rnd, solveOrder) {
    const kinds = Object.entries(CFG.OBSTACLES).filter(([, o]) => o.tier <= tier && o.tier > 0).map(([k]) => k);
    if (!kinds.length) return;

    const budget = Math.min(2 + Math.floor(tier / 2), 12);   // скільки плиток з перепонами
    let placed = 0;

    // Замки + ключ: перша трійка розв'язку стає ключем 🗝️
    if (kinds.includes('lock') && rnd() < 0.5 && solveOrder.length > 4) {
      const keyTriple = solveOrder[0];
      for (const idx of keyTriple) tiles[idx].isKey = true;
      // Замикаємо 1-2 трійки з другої половини розв'язку
      const lockCount = Utils.ri(rnd, 1, 2);
      for (let i = 0; i < lockCount; i++) {
        const trip = solveOrder[Utils.ri(rnd, Math.floor(solveOrder.length / 2), solveOrder.length - 1)];
        for (const idx of trip) if (!tiles[idx].obst && !tiles[idx].isKey) { tiles[idx].obst = { kind: 'lock' }; placed++; }
      }
    }

    // Решта перепон — на випадкові плитки (сповільнюють, але не блокують розв'язок)
    const simple = kinds.filter(k => k !== 'lock' && k !== 'portal');
    const order = Utils.shuffle([...tiles.keys()], rnd);
    for (const idx of order) {
      if (placed >= budget) break;
      const t = tiles[idx];
      if (t.obst || t.isKey || !simple.length) continue;
      if (rnd() > 0.4) continue;
      const kind = simple[Utils.ri(rnd, 0, simple.length - 1)];
      t.obst =
        kind === 'ice'   ? { kind, hp: 2 } :
        kind === 'chain' ? { kind, counter: 1 } :
        kind === 'stone' ? { kind, counter: 2 } :
        kind === 'fog'   ? { kind } :
        kind === 'curse' ? { kind } : null;
      if (t.obst) placed++;
    }

    // Портали: пара плиток, що періодично міняються типами
    if (kinds.includes('portal') && rnd() < 0.6) {
      const free = tiles.filter(t => !t.obst && !t.isKey);
      if (free.length >= 2) {
        Utils.shuffle(free, rnd);
        free[0].portal = true;
        free[1].portal = true;
      }
    }
  }
};
