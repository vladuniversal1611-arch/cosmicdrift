/* ==========================================================================
   04_levels.js — level design system (pure).

   Levels.get(id) returns a complete level description:
     { id, area, local, d, hard, boss, colors, cells[], objective, mechanics,
       ammo, hint, intro, moves }

   Content sources, in priority order:
   1. HAND[id] — hand-authored levels (tutorial + any level a designer wants
      to author exactly). Fields override the generator.
   2. The generator — deterministic per id. Picks a shape template, palette,
      cluster size, obstacles and objective from the difficulty curve and the
      mechanic/objective introduction schedule in DATA.
   3. MOVES[id] — move budgets measured by tools/balance.js (a bot that
      plays every level). Falls back to a formula when absent.

   HAND layout legend (even rows = 11 chars, odd rows = 10):
     .  empty          a-f  palette colour 0..5     ?  random (clustered)
     S  stone          I    ice                      C  chain
     B  bomb           W    rainbow                  R  spinner
     L  locked         K    key                      D  shadow
     M  creature       F    butterfly   T  star      X  crystal
   ========================================================================== */
'use strict';

const Levels = (() => {
  const G = Core;

  // ---------------------------------------------------------------- hand-authored (tutorial)
  const HAND = {
    1: { colors: [0, 1, 2], objective: { type: 'clear' }, moves: 12, hint: 'aim', ammo: [0, 1, 2],
      layout: ['aaaabbbcccc', 'aaabbbbccc', 'aaaabbbcccc', '.aabbbbcc.'] },
    2: { colors: [0, 1, 3], objective: { type: 'rescue', target: 1 }, moves: 12, hint: 'rescue', ammo: [0], critters: ['milo'],
      layout: ['aabbccaabbc', 'abbccaabbc', '...aaa.....', '...aM.....'] },
    3: { colors: [2, 3, 4], objective: { type: 'clear' }, hint: 'bank', ammo: [0, 1],
      layout: ['aabcca.bcca', 'abbcaabbcc', 'bb.......cc', 'aa......bb', 'c.........b'] },
    4: { colors: [1, 3, 5, 2], objective: { type: 'clear' }, hint: 'hammer',
      layout: ['aabbccddaab', 'abbccddaab', 'aabbccddaab', 'abbccddaab'] },
    5: { colors: [0, 1, 3, 2], objective: { type: 'stars', target: 3 }, hint: 'stars',
      layout: ['???????????', '??????????', '??T????T???', '??????????', '?????T?????'] },
    6: { colors: [0, 1, 2, 4], objective: { type: 'top' }, hint: 'top', template: 'pyramid', rows: 9 },
    7: { colors: [1, 3, 4, 5], objective: { type: 'rescue', target: 2 },
      layout: ['???????????', '??????????', '???????????', '??????????', '??M????M???'] },
    8: { colors: [0, 1, 2, 3], objective: { type: 'color', color: 0, target: 16 }, template: 'split', rows: 9 },
    9: { colors: [0, 2, 3, 4], objective: { type: 'clear' }, template: 'heart', rows: 10 },
    10: { colors: [0, 1, 3, 5], objective: { type: 'rescue', target: 2 }, critters: ['bruno', null],
      layout: ['???????????', '??????????', '???????????', '??????????', '????M?????M', '??????????'] },
  };

  // Move budgets measured by tools/balance.js (bot playtests). Generated.
  const MOVES = {};

  // ---------------------------------------------------------------- difficulty curve
  // 1–5 tutorial · 6–15 mastery · 16–30 first challenge · 31–50 combined
  // mechanics · 51–75 complex layouts · 76–100+ advanced.
  function difficulty(id) {
    const pts = [[1, 0.04], [5, 0.1], [15, 0.28], [30, 0.42], [50, 0.55], [75, 0.66], [100, 0.76], [160, 0.88]];
    let d = pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (id >= pts[i][0] && id <= pts[i + 1][0]) { d = U.lerp(pts[i][1], pts[i + 1][1], (id - pts[i][0]) / (pts[i + 1][0] - pts[i][0])); break; }
    }
    const local = ((id - 1) % DATA.LEVELS_PER_AREA) + 1;
    if (local % 5 === 0 && local !== 20) d += 0.1;       // "hard level" spike
    else if (local % 5 === 1 && id > 1) d -= 0.06;       // breather after a spike
    return U.clamp(d, 0, 1);
  }
  function isHard(id) { const l = ((id - 1) % DATA.LEVELS_PER_AREA) + 1; return l % 5 === 0 && l !== 20; }
  function colorCount(id, d) {
    if (id <= 5) return 3;
    if (id <= 15) return 4;
    if (id <= 45) return d > 0.5 ? 5 : 4;
    if (id <= 90) return 5;
    return d > 0.8 ? 6 : 5;
  }

  // Objective rotation for local levels 1..19 (20 = boss).
  const OBJ_PATTERN = ['clear', 'rescue', 'stars', 'top', 'clear', 'rescue', 'color', 'butterflies', 'crystals', 'clear',
    'rescue', 'chains', 'stars', 'top', 'rescue', 'crystals', 'butterflies', 'color', 'clear'];

  // ---------------------------------------------------------------- shape templates
  // x in [0,1] across the board, y in [0,1] = row/(rows-1).
  const TEMPLATES = {
    wall: () => true,
    pyramid: (x, y) => Math.abs(x - 0.5) < 0.52 - y * 0.34,
    split: (x, y) => y < 0.28 || Math.abs(x - 0.5) > 0.07 + y * 0.12,
    diamond: (x, y) => Math.abs(x - 0.5) * 1.1 + Math.abs(y - 0.45) * 0.85 < 0.58 || y < 0.12,
    heart: (x, y) => { const X = (x - 0.5) * 2.3, Y = (0.35 - y) * 2.1; return Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0.05 || y < 0.1; },
    arches: (x, y) => y < 0.3 || Math.sin(x * Math.PI * 4 + 0.4) > -0.15,
    zigzag: (x, y, r) => y < 0.2 || ((r + Math.floor(x * 5.5)) % 4) !== 3,
    hourglass: (x, y) => Math.abs(x - 0.5) < 0.52 - Math.sin(y * Math.PI) * 0.26,
    vase: (x, y) => y < 0.15 || Math.abs(x - 0.5) < 0.22 + y * 0.3,
    curtains: (x, y) => y < 0.3 || x < 0.34 || x > 0.66,
    checker: (x, y, r, c) => r < 2 || (r + c) % 4 !== 0,
    fan: (x, y) => y < 0.2 || Math.abs(Math.atan2(x - 0.5, y + 0.3)) < 0.62,
  };
  const TEMPLATE_KEYS = Object.keys(TEMPLATES);

  // ---------------------------------------------------------------- helpers
  function pruneToAnchored(cellMap) {
    const set = new Set(), q = [];
    for (let c = 0; c < G.COLS; c++) { const k = G.key(0, c); if (cellMap.has(k)) { set.add(k); q.push(k); } }
    for (const [k, s] of cellMap) if (s.t === 'ch' && !set.has(k)) { set.add(k); q.push(k); }
    for (let i = 0; i < q.length; i++) for (const n of G.NB[q[i]]) if (cellMap.has(n) && !set.has(n)) { set.add(n); q.push(n); }
    for (const k of [...cellMap.keys()]) if (!set.has(k)) cellMap.delete(k);
  }
  // Colour keys in clusters of roughly `size` bubbles.
  function clusterFill(keys, palette, size, rng) {
    const color = new Map();
    const keySet = new Set(keys);
    for (const start of rng.shuffle(keys.slice())) {
      if (color.has(start)) continue;
      const col = palette[rng.int(palette.length)];
      const target = Math.max(1, Math.round(size * (0.6 + rng() * 0.8)));
      const q = [start]; color.set(start, col);
      let n = 1;
      for (let i = 0; i < q.length && n < target; i++) {
        for (const m of rng.shuffle(G.NB[q[i]].slice())) {
          if (n >= target) break;
          if (!keySet.has(m) || color.has(m)) continue;
          color.set(m, col); q.push(m); n++;
        }
      }
    }
    return color;
  }
  function pickKeys(pool, n, rng, filter) { return rng.shuffle(pool.filter(filter || (() => true))).slice(0, Math.max(0, n)); }

  // ---------------------------------------------------------------- build
  function build(id) {
    const areaIdx = Math.min(DATA.AREAS.length - 1, Math.floor((id - 1) / DATA.LEVELS_PER_AREA));
    const local = ((id - 1) % DATA.LEVELS_PER_AREA) + 1;
    const rng = U.rng(id * 7919 + 1013);
    const hand = HAND[id] || {};
    const d = difficulty(id);
    const isBoss = local === DATA.LEVELS_PER_AREA;

    // palette
    let colors = hand.colors;
    if (!colors) colors = rng.shuffle([0, 1, 2, 3, 4, 5]).slice(0, colorCount(id, d)).sort((a, b) => a - b);

    // mechanics (obstacles)
    const available = Object.keys(DATA.MECHANIC_INTRO).filter((m) => DATA.MECHANIC_INTRO[m] <= id);
    const intro = Object.keys(DATA.MECHANIC_INTRO).find((m) => DATA.MECHANIC_INTRO[m] === id);
    let mechanics = [];
    if (hand.mechanics) mechanics = hand.mechanics;
    else if (intro) mechanics = [intro];
    else if (available.length && !HAND[id]) {
      const newest = available.slice().sort((a, b) => DATA.MECHANIC_INTRO[b] - DATA.MECHANIC_INTRO[a]);
      const count = d < 0.35 ? 1 : d < 0.7 ? rng.range(1, 2) : rng.range(2, 3);
      if (id - DATA.MECHANIC_INTRO[newest[0]] < 10) mechanics.push(newest[0]); // reinforce the newest mechanic
      const rest = rng.shuffle(newest.filter((m) => !mechanics.includes(m)));
      while (mechanics.length < count && rest.length) mechanics.push(rest.shift());
      if (rng() < 0.12 && !isHard(id)) mechanics = []; // occasional pure level
    }
    if (isBoss) mechanics = mechanics.filter((m) => m !== 'rotator' && m !== 'locked');

    // objective
    let objective;
    if (hand.objective) objective = Object.assign({}, hand.objective);
    else if (isBoss) objective = { type: 'boss' };
    else {
      let type = OBJ_PATTERN[(local - 1 + areaIdx * 3) % OBJ_PATTERN.length];
      if (intro === 'chain') type = 'chains';
      else if (intro) type = intro === 'dark' ? 'rescue' : 'clear';
      if (type === 'chains' && !available.includes('chain')) type = 'rescue';
      if ((DATA.OBJECTIVE_INTRO[type] || 1) > id) type = id >= 2 ? 'rescue' : 'clear';
      objective = { type };
    }
    if (objective.type === 'chains' && !mechanics.includes('chain')) mechanics.push('chain');
    // Shadow bubbles keep spreading — on 'clear everything' boards that turns into a slog.
    if (objective.type === 'clear') mechanics = mechanics.filter((m) => m !== 'dark');

    // shape
    const cellMap = new Map();
    if (hand.layout) {
      hand.layout.forEach((row, r) => {
        for (let c = 0; c < row.length && c < G.rowLen(r); c++) if (row[c] !== '.') cellMap.set(G.key(r, c), { r, c, ch: row[c] });
      });
    } else {
      const tpl = hand.template || (isBoss ? rng.pick(['wall', 'split', 'arches']) : TEMPLATE_KEYS[rng.int(TEMPLATE_KEYS.length)]);
      let rows = hand.rows || Math.min(20, 8 + Math.round(d * 10) + (rng() < 0.3 ? 1 : 0));
      rows = Math.min(rows, 12);
      if (isBoss) rows = Math.min(rows, 9);
      const f = TEMPLATES[tpl] || TEMPLATES.wall;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < G.rowLen(r); c++) {
          const x = G.cx(r, c) / G.W, y = rows > 1 ? r / (rows - 1) : 0;
          if (r === 0 || f(x, y, r, c)) cellMap.set(G.key(r, c), { r, c, ch: '?' });
        }
      }
    }
    pruneToAnchored(cellMap);

    // colours (clustered — big clusters early, small ones later)
    const size = hand.clusterSize || U.lerp(3.8, 1.7, d);
    const coloring = clusterFill([...cellMap.keys()], colors, size, rng);
    const cells = new Map();
    const critterIds = hand.critters ? hand.critters.slice() : [];
    let critterIdx = 0;
    for (const [k, s] of cellMap) {
      const col = coloring.get(k), ch = s.ch;
      let cell;
      if (ch >= 'a' && ch <= 'f') cell = { t: 'n', c: colors[ch.charCodeAt(0) - 97] };
      else switch (ch) {
        case 'S': cell = { t: 's', hp: 2 }; break;
        case 'I': cell = { t: 'i', c: col }; break;
        case 'C': cell = { t: 'ch', c: col, hp: 2 }; break;
        case 'B': cell = { t: 'b' }; break;
        case 'W': cell = { t: 'w' }; break;
        case 'R': cell = { t: 'rot', hp: 3 }; break;
        case 'L': cell = { t: 'l', c: col }; break;
        case 'K': cell = { t: 'k' }; break;
        case 'D': cell = { t: 'd', hp: 1 }; break;
        case 'M': cell = { t: 'm', cr: critterIds[critterIdx++] || null }; break;
        case 'F': cell = { t: 'f' }; break;
        case 'T': cell = { t: 'st' }; break;
        case 'X': cell = { t: 'x', hp: 1 }; break;
        default: cell = { t: 'n', c: col };
      }
      cells.set(k, cell);
    }

    // generated obstacles
    const plainKeys = () => [...cells.keys()].filter((k) => cells.get(k).t === 'n');
    const lowerFirst = (k) => G.kr(k) >= 1;
    const maxRow = Math.max(0, ...[...cells.keys()].map(G.kr));
    if (!hand.layout) {
      for (const m of mechanics) {
        switch (m) {
          case 'stone': for (const k of pickKeys(plainKeys(), 2 + Math.round(d * 4), rng, lowerFirst)) cells.set(k, { t: 's', hp: 2 }); break;
          case 'ice': for (const k of pickKeys(plainKeys(), 3 + Math.round(d * 5), rng)) cells.get(k).t = 'i'; break;
          case 'chain': for (const k of pickKeys(plainKeys(), 2 + Math.round(d * 3), rng, (k) => G.kr(k) >= Math.floor(maxRow / 2))) { const c = cells.get(k); c.t = 'ch'; c.hp = 2; } break;
          case 'bomb': for (const k of pickKeys(plainKeys(), 1 + Math.round(d * 2), rng, lowerFirst)) cells.set(k, { t: 'b' }); break;
          case 'rainbow': for (const k of pickKeys(plainKeys(), 1 + Math.round(d * 2), rng, lowerFirst)) cells.set(k, { t: 'w' }); break;
          case 'rotator': {
            const n = d > 0.7 ? 2 : 1, placed = [];
            for (const k of pickKeys(plainKeys(), 20, rng, (k) => G.kr(k) >= 2 && G.kr(k) < maxRow && G.NB[k].length === 6)) {
              if (placed.length >= n) break;
              if (placed.some((p) => G.NB[p].includes(k))) continue;
              cells.set(k, { t: 'rot', hp: 3 }); placed.push(k);
            }
            break;
          }
          case 'locked': {
            for (const k of pickKeys(plainKeys(), 3 + Math.round(d * 4), rng)) cells.get(k).t = 'l';
            const kk = pickKeys(plainKeys(), 1, rng, (k) => G.kr(k) >= Math.max(1, maxRow - 2));
            if (kk.length) cells.set(kk[0], { t: 'k' });
            break;
          }
          case 'dark': for (const k of pickKeys(plainKeys(), 1 + Math.round(d * 2), rng, (k) => G.kr(k) >= 1)) cells.set(k, { t: 'd', hp: 1 }); break;
        }
      }
    }

    // objective items
    const obj = objective;
    const mid = (k) => G.kr(k) >= Math.max(2, Math.floor(maxRow * 0.25)) && G.kr(k) <= Math.max(3, Math.floor(maxRow * 0.6));
    const itemType = { stars: 'st', butterflies: 'f', crystals: 'x' };
    switch (obj.type) {
      case 'rescue': {
        if (hand.layout) { obj.target = [...cells.values()].filter((c) => c.t === 'm').length; break; }
        const n = U.clamp(2 + Math.round(d * 2), 2, 4);
        const pool = DATA.CREATURES.filter((c) => c.area === areaIdx).map((c) => c.id);
        const ks = pickKeys(plainKeys(), n, rng, mid);
        ks.forEach((k, i) => cells.set(k, { t: 'm', cr: pool[(id + i) % pool.length] }));
        obj.target = ks.length;
        break;
      }
      case 'stars': case 'butterflies': case 'crystals': {
        const tt = itemType[obj.type];
        if (hand.layout) { obj.target = [...cells.values()].filter((c) => c.t === tt).length; break; }
        const n = obj.type === 'crystals' ? 5 + Math.round(d * 4) : 4 + Math.round(d * 4);
        const ks = pickKeys(plainKeys(), n, rng, lowerFirst);
        for (const k of ks) cells.set(k, tt === 'x' ? { t: tt, hp: 1 } : { t: tt });
        obj.target = ks.length;
        break;
      }
      case 'chains': {
        let n = [...cells.values()].filter((c) => c.t === 'ch').length;
        if (n < 3) for (const k of pickKeys(plainKeys(), 3 - n, rng, lowerFirst)) { const c = cells.get(k); c.t = 'ch'; c.hp = 2; }
        obj.target = [...cells.values()].filter((c) => c.t === 'ch').length;
        break;
      }
      case 'color': {
        if (obj.color == null) {
          const cnt = {};
          for (const c of cells.values()) if (Core.COLORED[c.t]) cnt[c.c] = (cnt[c.c] || 0) + 1;
          obj.color = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
        }
        if (obj.target == null) {
          const n = [...cells.values()].filter((c) => Core.COLORED[c.t] && c.c === obj.color).length;
          obj.target = Math.max(8, Math.floor(n * 0.88));
        }
        break;
      }
      case 'top':
        // The top row must be clearable by matches: no blockers up there.
        for (let c = 0; c < G.COLS; c++) { const k = G.key(0, c), cell = cells.get(k); if (cell && cell.t !== 'n') cells.set(k, { t: 'n', c: colors[rng.int(colors.length)] }); }
        break;
      case 'boss':
        for (const k of pickKeys(plainKeys(), 3 + Math.min(3, areaIdx), rng, lowerFirst)) cells.set(k, { t: 'x', hp: 1 });
        break;
    }

    let boss = null;
    if (obj.type === 'boss') { const b = DATA.AREAS[areaIdx].boss; boss = { hp: b.hp, name: b.name, hue: b.hue, final: !!b.final }; }

    const cellList = [];
    for (const [k, cell] of cells) cellList.push(Object.assign({}, cell, { r: G.kr(k), col: G.kc(k) }));
    cellList.sort((a, b) => a.r - b.r || a.col - b.col);
    const areaPool = DATA.CREATURES.filter((c) => c.area === areaIdx).map((c) => c.id);
    cellList.filter((c) => c.t === 'm').forEach((c, i) => { if (!c.cr) c.cr = areaPool[(id + i) % areaPool.length]; });

    const level = {
      id, area: areaIdx, local, d, hard: isHard(id), boss, colors, cells: cellList, objective: obj, mechanics,
      ammo: hand.ammo || null, hint: hand.hint || null, intro: intro || null,
    };
    level.moves = hand.moves || MOVES[id] || estimateMoves(level, size);
    return level;
  }

  // Fallback move budget when a level has no measured value.
  function estimateMoves(level, size) {
    const perShot = 2.1 + size * 0.55;
    let need = level.cells.length / perShot;
    const tp = level.objective.type;
    if (tp === 'top') need *= 0.8;
    else if (tp !== 'clear' && tp !== 'boss') need *= 0.7;
    if (tp === 'boss') need = level.boss.hp / (perShot * 1.2);
    const blockers = level.cells.filter((c) => Core.BLOCKER[c.t]).length;
    return Math.max(12, Math.round(need * (1.55 - level.d * 0.35) + blockers * 0.35));
  }

  const cache = new Map();
  function get(id) {
    id = U.clamp(id | 0, 1, DATA.MAX_LEVEL);
    if (!cache.has(id)) cache.set(id, build(id));
    return JSON.parse(JSON.stringify(cache.get(id))); // a Board never mutates the cached definition
  }
  function areaOf(id) { return Math.min(DATA.AREAS.length - 1, Math.floor((id - 1) / DATA.LEVELS_PER_AREA)); }
  function isBossLevel(id) { return ((id - 1) % DATA.LEVELS_PER_AREA) + 1 === DATA.LEVELS_PER_AREA; }
  // 3 stars when finished within 70% of the move budget, 2 within 88%.
  function starMarks(level) { return [Math.ceil(level.moves * 0.7), Math.ceil(level.moves * 0.88)]; }
  function starsFor(level, movesUsed) { const m = starMarks(level); return movesUsed <= m[0] ? 3 : movesUsed <= m[1] ? 2 : 1; }

  return { get, build, HAND, MOVES, TEMPLATES, difficulty, isHard, areaOf, isBossLevel, starsFor, starMarks, estimateMoves };
})();

if (typeof module !== 'undefined') module.exports = { Levels };
