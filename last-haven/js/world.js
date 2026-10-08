/* World: isometric grid, location generation, collisions, ground cache. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;
  const A = 32, B = 16;

  function iso(x, y) { return { x: (x - y) * A, y: (x + y) * B }; }
  function toGrid(wx, wy) { return { x: (wx / A + wy / B) / 2, y: (wy / B - wx / A) / 2 }; }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cellRand(x, y, seed, k) {
    let h = Math.imul(x + 101, 374761393) ^ Math.imul(y + 211, 668265263) ^ Math.imul(seed + (k || 0), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const GROUNDS = {
    grass: { a: '#5e8c44', b: '#59863f', patch: '#7d6a47', deco: 'grass' },
    forest: { a: '#3f6c35', b: '#3a6531', patch: '#5a4a32', deco: 'needles' },
    dirt: { a: '#8a7356', b: '#836d51', patch: '#6e5c45', deco: 'gravel' },
    asphalt: { a: '#4b4e56', b: '#474a52', patch: '#5e8c44', deco: 'cracks', road: true },
    suburb: { a: '#5a8040', b: '#557a3c', patch: '#4b4e56', deco: 'grass', road: true },
    concrete: { a: '#7a7c83', b: '#75777e', patch: '#5f6b4a', deco: 'stains', road: true },
  };

  // ---------------- generation ----------------
  function newMap(loc, seed) {
    const S = loc.size;
    return { id: loc.id, loc, size: S, seed, objs: [], cell: new Int32Array(S * S).fill(-1), road: new Uint8Array(S * S), zombies: [], drops: [], spawn: { x: S / 2, y: S / 2 }, exit: null };
  }
  function put(map, o) {
    const S = map.size;
    if (o.gx < 0 || o.gy < 0 || o.gx >= S || o.gy >= S) return null;
    const i = o.gy * S + o.gx;
    if (map.cell[i] >= 0) return null;
    map.objs.push(o);
    map.cell[i] = map.objs.length - 1;
    return o;
  }
  function reindex(map) {
    map.cell.fill(-1);
    map.objs.forEach((o, i) => { map.cell[o.gy * map.size + o.gx] = i; });
  }
  function freeCells(map, r, avoid, minDist) {
    const S = map.size, out = [];
    for (let y = 1; y < S - 1; y++) {
      for (let x = 1; x < S - 1; x++) {
        if (map.cell[y * S + x] >= 0) continue;
        if (avoid && Math.hypot(x + 0.5 - avoid.x, y + 0.5 - avoid.y) < minDist) continue;
        out.push([x, y]);
      }
    }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }

  function generate(loc, seed) {
    const map = newMap(loc, seed);
    const r = rng(seed);
    const S = loc.size;
    if (loc.id === 'base') {
      map.spawn = { x: S / 2 + 0.5, y: S / 2 + 0.5 };
      put(map, { k: 'well', type: 'well', gx: Math.floor(S / 2) + 2, gy: Math.floor(S / 2) - 2 });
    } else {
      map.spawn = { x: 2.5, y: S / 2 + 0.5 };
      map.exit = { x: 1.5, y: S / 2 + 0.5 };
      put(map, { k: 'exit', type: 'exit', gx: 1, gy: Math.floor(S / 2) });
    }
    // roads
    if (GROUNDS[loc.ground].road) {
      const ry = Math.floor(S / 2) - 1;
      for (let x = 0; x < S; x++) { map.road[ry * S + x] = 1; map.road[(ry + 1) * S + x] = 1; }
      if (loc.id !== 'gas') {
        const rx = Math.floor(S * 0.6);
        for (let y = 0; y < S; y++) { map.road[y * S + rx] = 1; map.road[y * S + rx + 1] = 1; }
      }
    }
    // ruins / structures
    const ruinType = loc.ground === 'concrete' ? 'sandbag' : loc.ground === 'forest' ? 'log_pile' : 'ruin_wall';
    if (loc.id === 'suburbs') {
      // little houses: wall rectangles with a doorway, loot inside
      for (let h = 0; h < 6; h++) {
        const w = 4, d = 4;
        const x0 = 3 + Math.floor(r() * (S - 9)), y0 = 3 + Math.floor(r() * (S - 9));
        if (Math.abs(y0 + 2 - S / 2) < 4) continue;
        const door = Math.floor(r() * 2) + 1;
        for (let x = x0; x < x0 + w; x++) {
          for (let y = y0; y < y0 + d; y++) {
            const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + d - 1;
            if (!edge) continue;
            if (y === y0 + d - 1 && x === x0 + door) continue;
            put(map, { k: 'obst', type: 'house_wall', gx: x, gy: y, v: r() });
          }
        }
        put(map, { k: 'cont', type: r() < 0.5 ? 'fridge' : 'cabinet', gx: x0 + 1, gy: y0 + 1, looted: false });
      }
    }
    for (let n = 0; n < (loc.ruins || 0); n++) {
      const len = 2 + Math.floor(r() * 4);
      const horiz = r() < 0.5;
      const x0 = 3 + Math.floor(r() * (S - 6)), y0 = 2 + Math.floor(r() * (S - 4));
      if (Math.abs(y0 - S / 2) < 2 && x0 < 6) continue;
      for (let k = 0; k < len; k++) {
        const x = horiz ? x0 + k : x0, y = horiz ? y0 : y0 + k;
        if (map.road[y * S + x] && loc.id !== 'military') continue;
        if (r() < 0.15) continue;
        put(map, { k: 'obst', type: r() < 0.2 ? 'barrel' : ruinType, gx: x, gy: y, v: r() });
      }
    }
    const avoid = map.spawn;
    // containers
    Object.keys(loc.containers).forEach((type) => {
      const cells = freeCells(map, r, avoid, 5);
      for (let n = 0; n < loc.containers[type] && cells.length; n++) {
        let c = cells.pop();
        if (type === 'car') {
          // cars prefer the road
          const onRoad = cells.find((cc) => map.road[cc[1] * S + cc[0]]);
          if (onRoad) { c = onRoad; cells.splice(cells.indexOf(onRoad), 1); }
        }
        put(map, { k: 'cont', type, gx: c[0], gy: c[1], looted: false, v: r() });
      }
    });
    // resource nodes
    Object.keys(loc.nodes).forEach((type) => {
      const cells = freeCells(map, r, avoid, loc.id === 'base' ? 2.5 : 2);
      let placed = 0;
      for (let i = 0; i < cells.length && placed < loc.nodes[type]; i++) {
        const c = cells[i];
        if (map.road[c[1] * S + c[0]] && (type === 'tree' || type === 'rock')) continue;
        put(map, { k: 'node', type, gx: c[0], gy: c[1], hits: BI.Data.NODES[type].hits, respawnAt: 0, v: r() });
        placed++;
      }
    });
    // zombies
    Object.keys(loc.zombies).forEach((type) => {
      const cells = freeCells(map, r, avoid, 9);
      for (let n = 0; n < loc.zombies[type] && cells.length; n++) {
        const c = cells.pop();
        map.zombies.push(BI.Entities.makeZombie(type, c[0] + 0.5, c[1] + 0.5));
      }
    });
    return map;
  }

  // ---------------- collisions ----------------
  function objAt(map, x, y) {
    const S = map.size;
    if (x < 0 || y < 0 || x >= S || y >= S) return null;
    const i = map.cell[y * S + x];
    return i >= 0 ? map.objs[i] : null;
  }
  /** Is the cell solid? who: 'player' | 'zombie' */
  function solid(map, cx, cy, who) {
    const S = map.size;
    if (cx < 0 || cy < 0 || cx >= S || cy >= S) return true;
    const o = objAt(map, cx, cy);
    if (!o) return false;
    if (o.k === 'node') return BI.Data.NODES[o.type].block && o.respawnAt === 0;
    if (o.k === 'exit') return false;
    if (o.k === 'build') {
      const def = BI.Data.BUILD[o.type];
      if (def.door) return who !== 'player';
      if (o.type === 'garden') return false;
      return true;
    }
    return true;
  }
  function blocked(map, x, y, rad, who) {
    const xs = [x - rad, x + rad], ys = [y - rad, y + rad];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (solid(map, Math.floor(xs[i]), Math.floor(ys[j]), who)) return true;
    return false;
  }

  // ---------------- ground cache ----------------
  function buildGround(map, q) {
    const S = map.size, G = GROUNDS[map.loc.ground];
    const pad = 40;
    const w = S * 64 + pad * 2, h = S * 32 + pad * 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * q);
    cv.height = Math.ceil(h * q);
    const g = cv.getContext('2d');
    g.scale(q, q);
    g.translate(S * A + pad, pad);
    const seed = map.seed;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const p0 = iso(x, y), p1 = iso(x + 1, y), p2 = iso(x + 1, y + 1), p3 = iso(x, y + 1);
        const pts = [[p0.x, p0.y], [p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y]];
        const road = map.road[y * S + x];
        const hv = cellRand(x, y, seed);
        let col = (x + y) & 1 ? G.a : G.b;
        if (road) col = map.loc.ground === 'concrete' ? '#5d6068' : (x + y) & 1 ? '#45474e' : '#424449';
        else if (hv < 0.12) col = G.patch;
        D.poly(g, pts, col);
        if (hv > 0.85) D.poly(g, pts, 'rgba(0,0,0,0.05)');
        else if (hv < 0.3) D.poly(g, pts, 'rgba(255,255,255,0.03)');
      }
    }
    // road markings
    if (G.road) {
      g.strokeStyle = 'rgba(255,220,120,0.55)';
      g.lineWidth = 2;
      g.setLineDash([14, 14]);
      for (let x = 0; x < S; x++) {
        const ry = Math.floor(S / 2);
        if (!map.road[ry * S + x]) continue;
        const a = iso(x, ry), b = iso(x + 1, ry);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      g.setLineDash([]);
    }
    // decorations
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const hv = cellRand(x, y, seed, 7);
        if (hv > 0.3) continue;
        const c = iso(x + 0.5, y + 0.5);
        const ox = (cellRand(x, y, seed, 3) - 0.5) * 22, oy = (cellRand(x, y, seed, 5) - 0.5) * 10;
        const px = c.x + ox, py = c.y + oy;
        const road = map.road[y * S + x];
        if (road || G.deco === 'cracks') {
          g.strokeStyle = 'rgba(0,0,0,0.25)';
          g.lineWidth = 1;
          g.beginPath(); g.moveTo(px - 8, py); g.lineTo(px - 2, py + 2); g.lineTo(px + 3, py - 2); g.lineTo(px + 9, py + 1); g.stroke();
        } else if (G.deco === 'grass' || G.deco === 'needles') {
          g.strokeStyle = G.deco === 'needles' ? '#6b5a3a' : '#3f6a2c';
          g.lineWidth = 1.3;
          g.beginPath();
          g.moveTo(px - 3, py); g.lineTo(px - 4, py - 5);
          g.moveTo(px, py); g.lineTo(px, py - 6);
          g.moveTo(px + 3, py); g.lineTo(px + 4, py - 5);
          g.stroke();
          if (hv < 0.04) D.circle(g, px + 6, py - 3, 1.6, '#e8d84a');
        } else if (G.deco === 'gravel') {
          D.ellipse(g, px, py, 2.5, 1.5, 'rgba(60,50,40,0.5)');
          D.ellipse(g, px + 5, py + 2, 1.6, 1, 'rgba(230,220,200,0.35)');
        } else if (G.deco === 'stains') {
          D.ellipse(g, px, py, 9, 4, 'rgba(40,40,40,0.12)');
        }
      }
    }
    // darken map border
    g.save();
    D.path(g, [[0, 0], [S * A, S * B], [0, S * 32], [-S * A, S * B]]);
    g.clip();
    g.lineWidth = 28;
    g.strokeStyle = 'rgba(10,14,20,0.35)';
    D.path(g, [[0, 0], [S * A, S * B], [0, S * 32], [-S * A, S * B]]);
    g.stroke();
    g.restore();
    return { canvas: cv, ox: S * A + pad, oy: pad, w, h };
  }

  BI.World = { A, B, GROUNDS, iso, toGrid, hashStr, rng, cellRand, generate, put, reindex, objAt, solid, blocked, buildGround, freeCells };
})();
