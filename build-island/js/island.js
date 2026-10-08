/* Island: isometric grid math, themes, island generation, expansion and
   the pre-rendered terrain cache (one offscreen canvas per island size). */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;

  const TW = 64, TH = 32, A = 32, B = 16;
  const START_SIZE = 12;
  const EXPANSION_COSTS = [100, 250, 500, 1000];
  const MAX_EXPANSIONS = EXPANSION_COSTS.length;
  const SIDE_H = 20;

  function iso(x, y) { return { x: (x - y) * A, y: (x + y) * B }; }
  function toGrid(wx, wy) { return { x: (wx / A + wy / B) / 2, y: (wy / B - wx / A) / 2 }; }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
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
  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------------- themes ----------------
  const THEMES = {
    green: {
      nodes: { tree: 12, rock: 8, crystal: 3 },
      top: ['#86dc5c', '#78d050'], lip: '#4fae37', dirt: ['#b9783f', '#8f5a2c'], rock: ['#7d7f95', '#3f4058'],
      bg: ['#1667c9', '#4cc4f0'], bgStyle: 'ocean', water: '#7fdcff', tree: 'oak', leaf: ['#5fcf4a', '#2f9e3a'],
      rockCol: ['#b8c0cf', '#7b8499'], crystal: ['#8ff6ff', '#2aa8ff'], flowers: ['#ff6b8a', '#ffd93d', '#ffffff', '#b28dff'], decor: 'grass',
    },
    desert: {
      nodes: { tree: 5, sand: 10, rock: 5, crystal: 2 },
      top: ['#f6d98f', '#eecb79'], lip: '#d9ad5a', dirt: ['#dda061', '#b87a3f'], rock: ['#b88457', '#6f4a30'],
      bg: ['#0790b3', '#5fe0e0'], bgStyle: 'ocean', water: '#7ff0ff', tree: 'palm', leaf: ['#6fd04f', '#3c9d33'],
      rockCol: ['#e8bb83', '#b07c48'], crystal: ['#ffe08a', '#ff8a3d'], flowers: ['#ff9e5e', '#e85d75'], decor: 'sand',
    },
    ice: {
      nodes: { tree: 6, iron: 9, rock: 5, crystal: 3 },
      top: ['#f3faff', '#e2f1fc'], lip: '#bfe1f7', dirt: ['#a8d2ef', '#79abd2'], rock: ['#6f93bd', '#3d6290'],
      bg: ['#0b47a0', '#47b9e6'], bgStyle: 'ocean', water: '#c8f4ff', tree: 'pine', leaf: ['#3f9e7a', '#24705a'],
      rockCol: ['#d8ecfa', '#8db6d8'], crystal: ['#d6f9ff', '#62c9ff'], flowers: ['#ffffff', '#bfe9ff'], decor: 'snow',
    },
    volcano: {
      nodes: { coal: 10, iron: 5, rock: 5, crystal: 3 },
      top: ['#5d4d50', '#504245'], lip: '#3a2e31', dirt: ['#4a3434', '#2f2122'], rock: ['#2b1e1f', '#120a0b'],
      bg: ['#4a1006', '#e0531c'], bgStyle: 'lava', water: '#ff8a1f', tree: 'burnt', leaf: ['#4a3a3a', '#2a1f1f'],
      rockCol: ['#5a4e52', '#2a2326'], crystal: ['#ffb07a', '#ff3b1f'], flowers: ['#ff6a1f', '#ffc23d'], decor: 'lava',
    },
    neon: {
      nodes: { crystal: 10, tree: 5, coal: 3, rock: 3 },
      top: ['#2e2367', '#271d59'], lip: '#3fe6ff', dirt: ['#1f1554', '#140c3a'], rock: ['#0f0a2e', '#05021a'],
      bg: ['#07011f', '#3a1584'], bgStyle: 'grid', water: '#ff4fd8', tree: 'neon', leaf: ['#3ff2ff', '#ff4fd8'],
      rockCol: ['#5a4ab0', '#2a2070'], crystal: ['#ff8cf2', '#7a5cff'], flowers: ['#3ff2ff', '#ff4fd8', '#c6ff3f'], decor: 'neon',
    },
    sky: {
      nodes: { tree: 8, sand: 5, crystal: 6, rock: 3 },
      top: ['#cdf7c8', '#bdeeb8'], lip: '#93d98e', dirt: ['#f7fbff', '#dbe6f6'], rock: ['#eef3fb', '#b9c6de'],
      bg: ['#6fb9ff', '#e6f4ff'], bgStyle: 'sky', water: '#ffffff', tree: 'cotton', leaf: ['#ffc4e1', '#ff8fc4'],
      rockCol: ['#ffffff', '#cdd7ea'], crystal: ['#fff6b0', '#ffc53d'], flowers: ['#ff9ecb', '#b4a7ff', '#fff27a'], decor: 'grass',
    },
    space: {
      nodes: { iron: 7, crystal: 8, coal: 5, rock: 3 },
      top: ['#a09cb8', '#918ca9'], lip: '#6f6b8d', dirt: ['#5b5778', '#3d3a57'], rock: ['#2e2b45', '#13111f'],
      bg: ['#03020c', '#1b1245'], bgStyle: 'stars', water: '#b39bff', tree: 'alien', leaf: ['#7dffb3', '#28c97f'],
      rockCol: ['#c4c0da', '#6d6990'], crystal: ['#c9b6ff', '#6a3dff'], flowers: ['#7dffb3', '#b9a3ff'], decor: 'crater',
    },
  };

  // ---------------- island state ----------------
  function blankStats() { return { wood: 0, stone: 0, crystal: 0, sand: 0, iron: 0, coal: 0, built: 0, houses: 0, byType: {}, crafted: {} }; }

  function createIslandState(id) {
    const seed = hashStr(id);
    const st = { id, seed, size: START_SIZE, expansions: 0, buildings: [], nodes: [], stats: blankStats(), completed: false, player: null };
    const r = rng(seed);
    const cells = [];
    for (let y = 0; y < START_SIZE; y++) {
      for (let x = 0; x < START_SIZE; x++) {
        if (x >= 4 && x <= 7 && y >= 4 && y <= 7) continue; // keep the spawn area clear
        cells.push([x, y]);
      }
    }
    shuffle(cells, r);
    placeNodes(st, cells, (THEMES[id] || THEMES.green).nodes, r);
    return st;
  }

  function placeNodes(st, cells, counts, r) {
    let i = 0;
    Object.keys(counts).forEach((type) => {
      for (let n = 0; n < counts[type] && i < cells.length; n++, i++) {
        st.nodes.push({ type, gx: cells[i][0], gy: cells[i][1], respawnAt: 0, v: Math.round(r() * 1000) / 1000 });
      }
    });
  }

  /** Grow the island by one ring (+2 rows/cols) — everything shifts by (+1, +1). */
  function expand(st) {
    st.size += 2;
    st.expansions += 1;
    st.buildings.forEach((b) => { b.gx += 1; b.gy += 1; });
    st.nodes.forEach((n) => { n.gx += 1; n.gy += 1; });
    const S = st.size;
    const r = rng(st.seed + S * 977);
    const ring = [];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (x === 0 || y === 0 || x === S - 1 || y === S - 1) ring.push([x, y]);
      }
    }
    shuffle(ring, r);
    const base = (THEMES[st.id] || THEMES.green).nodes, counts = {};
    Object.keys(base).forEach((k) => { counts[k] = Math.max(1, Math.round(base[k] * (0.35 + st.expansions * 0.05))); });
    placeNodes(st, ring, counts, r);
  }

  // ---------------- terrain cache ----------------
  function islandCorners(S) {
    return { N: [0, 0], E: [S * A, S * B], S: [0, S * TH], W: [-S * A, S * B] };
  }

  function buildCache(st, theme, q) {
    const S = st.size;
    const pad = 26;
    const depth = Math.round(S * B * 1.5 + 50);
    const w = S * TW + pad * 2;
    const h = S * TH + SIDE_H + depth + pad * 2;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * q);
    cv.height = Math.ceil(h * q);
    const g = cv.getContext('2d');
    g.scale(q, q);
    g.translate(S * A + pad, pad);
    const r = rng(st.seed ^ (S * 131));
    const C = islandCorners(S);
    const Wp = C.W, Sp = C.S, Ep = C.E;
    const edgeY = (x) => S * TH - Math.abs(x) * B / A;

    // --- underside rock cone ---
    const N = 18, pts = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const x = -S * A + f * 2 * S * A;
      const k = 1 - Math.abs(x) / (S * A);
      const j = i === 0 || i === N ? 0 : 0.7 + 0.3 * r();
      pts.push([x, edgeY(x) + SIDE_H + depth * Math.pow(k, 1.3) * j]);
    }
    g.beginPath();
    g.moveTo(Wp[0], Wp[1] + SIDE_H);
    g.lineTo(Sp[0], Sp[1] + SIDE_H);
    g.lineTo(Ep[0], Ep[1] + SIDE_H);
    for (let i = N; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    const rg = g.createLinearGradient(0, S * B, 0, S * TH + SIDE_H + depth);
    rg.addColorStop(0, theme.rock[0]);
    rg.addColorStop(1, theme.rock[1]);
    g.fillStyle = rg;
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, 0, S * A + pad, h);
    // strata
    g.lineWidth = 2;
    for (let k = 1; k <= 5; k++) {
      g.beginPath();
      for (let x = -S * A; x <= S * A; x += 22) {
        const y = edgeY(x) + SIDE_H + k * (depth * 0.13) + (r() - 0.5) * 6;
        if (x === -S * A) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = k % 2 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.07)';
      g.stroke();
    }
    // rock chunks
    for (let i = 0; i < S * 3; i++) {
      const x = (r() * 2 - 1) * S * A * 0.85;
      const y = edgeY(x) + SIDE_H + 8 + r() * depth * 0.6 * (1 - Math.abs(x) / (S * A));
      const s = 4 + r() * 8;
      D.poly(g, [[x - s, y], [x - s * 0.3, y - s * 0.7], [x + s, y - s * 0.4], [x + s * 0.6, y + s * 0.5]], r() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)');
    }
    g.restore();

    // --- dirt band (front faces) ---
    D.poly(g, [Wp, Sp, [Sp[0], Sp[1] + SIDE_H], [Wp[0], Wp[1] + SIDE_H]], theme.dirt[0]);
    D.poly(g, [Sp, Ep, [Ep[0], Ep[1] + SIDE_H], [Sp[0], Sp[1] + SIDE_H]], theme.dirt[1]);
    for (let i = 0; i < S * 10; i++) {
      const left = r() < 0.5;
      const f = r();
      const a = left ? D.lerpPt(Wp, Sp, f) : D.lerpPt(Sp, Ep, f);
      D.ellipse(g, a[0], a[1] + 6 + r() * (SIDE_H - 8), 1.5 + r() * 2, 1 + r(), 'rgba(0,0,0,0.13)');
    }
    // grass lip with drips
    D.poly(g, [Wp, Sp, Ep, [Ep[0], Ep[1] + 5], [Sp[0], Sp[1] + 5], [Wp[0], Wp[1] + 5]], theme.lip);
    for (let i = 0; i < S * 5; i++) {
      const left = r() < 0.5;
      const a = left ? D.lerpPt(Wp, Sp, r()) : D.lerpPt(Sp, Ep, r());
      const rr = 2 + r() * 3;
      D.ellipse(g, a[0], a[1] + 5, rr, rr * (1 + r()), theme.lip);
    }
    // hanging vines on green-ish islands
    if (theme.decor === 'grass') {
      g.lineCap = 'round';
      for (let i = 0; i < S * 1.5; i++) {
        const left = r() < 0.5;
        const a = left ? D.lerpPt(Wp, Sp, r()) : D.lerpPt(Sp, Ep, r());
        const len = 10 + r() * 28;
        g.beginPath();
        g.moveTo(a[0], a[1] + 4);
        g.quadraticCurveTo(a[0] + (r() - 0.5) * 8, a[1] + len * 0.6, a[0] + (r() - 0.5) * 4, a[1] + len);
        g.strokeStyle = theme.lip;
        g.lineWidth = 2;
        g.stroke();
        D.circle(g, a[0], a[1] + len, 2, theme.leaf[0]);
      }
    }

    // --- top tiles ---
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const c0 = iso(x, y), c1 = iso(x + 1, y), c2 = iso(x + 1, y + 1), c3 = iso(x, y + 1);
        const pts4 = [[c0.x, c0.y], [c1.x, c1.y], [c2.x, c2.y], [c3.x, c3.y]];
        D.poly(g, pts4, (x + y) & 1 ? theme.top[0] : theme.top[1]);
        const hv = cellRand(x, y, st.seed);
        if (hv < 0.35) D.poly(g, pts4, 'rgba(255,255,255,0.05)');
        else if (hv > 0.8) D.poly(g, pts4, 'rgba(0,0,0,0.035)');
      }
    }
    // soft light gradient across the top (sun from the top-left)
    g.save();
    D.path(g, [C.N, Ep, Sp, Wp]);
    g.clip();
    const lg = g.createLinearGradient(-S * A * 0.5, 0, S * A * 0.6, S * TH);
    lg.addColorStop(0, 'rgba(255,255,230,0.16)');
    lg.addColorStop(1, 'rgba(0,20,40,0.08)');
    g.fillStyle = lg;
    g.fillRect(-S * A, 0, S * TW, S * TH);
    g.restore();

    // decorations
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const c = iso(x + 0.5, y + 0.5);
        const hv = cellRand(x, y, st.seed, 7);
        const ox = (cellRand(x, y, st.seed, 3) - 0.5) * 22;
        const oy = (cellRand(x, y, st.seed, 5) - 0.5) * 10;
        decorTile(g, theme, c.x + ox, c.y + oy, hv, x, y, st.seed);
      }
    }

    // rim highlight on the back edges
    g.beginPath();
    g.moveTo(Wp[0], Wp[1]);
    g.lineTo(0, 0);
    g.lineTo(Ep[0], Ep[1]);
    g.strokeStyle = 'rgba(255,255,255,0.4)';
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.moveTo(Wp[0], Wp[1]);
    g.lineTo(Sp[0], Sp[1]);
    g.lineTo(Ep[0], Ep[1]);
    g.strokeStyle = 'rgba(0,0,0,0.15)';
    g.lineWidth = 1.5;
    g.stroke();

    return { canvas: cv, ox: S * A + pad, oy: pad, w, h, q, size: S };
  }

  function decorTile(g, theme, x, y, hv, cx, cy, seed) {
    const deco = theme.decor;
    if (deco === 'neon') {
      // glowing grid lines on every tile
      const c0 = iso(cx, cy), c1 = iso(cx + 1, cy), c3 = iso(cx, cy + 1);
      g.beginPath();
      g.moveTo(c3.x, c3.y);
      g.lineTo(c0.x, c0.y);
      g.lineTo(c1.x, c1.y);
      g.strokeStyle = 'rgba(63,230,255,0.28)';
      g.lineWidth = 1.2;
      g.stroke();
      if (hv < 0.12) D.circle(g, x, y, 2, theme.flowers[(hv * 100 | 0) % theme.flowers.length]);
      return;
    }
    if (deco === 'lava') {
      if (hv < 0.22) {
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x - 10, y - 2);
        g.lineTo(x - 2, y + 2);
        g.lineTo(x + 4, y - 3);
        g.lineTo(x + 11, y + 1);
        g.strokeStyle = 'rgba(255,90,20,0.35)';
        g.lineWidth = 4;
        g.stroke();
        g.strokeStyle = '#ffb347';
        g.lineWidth = 1.4;
        g.stroke();
      } else if (hv < 0.3) {
        D.ellipse(g, x, y, 4, 2, '#3a2e31');
      }
      return;
    }
    if (deco === 'crater') {
      if (hv < 0.18) {
        const r = 4 + hv * 30;
        D.ellipse(g, x, y, r, r * 0.5, 'rgba(0,0,0,0.16)');
        D.ellipse(g, x + 1, y + 1, r * 0.7, r * 0.33, 'rgba(255,255,255,0.08)');
      }
      return;
    }
    if (deco === 'snow') {
      if (hv < 0.2) {
        D.ellipse(g, x, y, 7, 3, '#ffffff');
        D.ellipse(g, x - 2, y - 1, 3, 1.4, 'rgba(160,210,240,0.4)');
      } else if (hv < 0.3) {
        D.circle(g, x, y, 1.2, '#ffffff');
        D.circle(g, x + 6, y + 2, 0.9, '#ffffff');
      }
      return;
    }
    if (deco === 'sand') {
      if (hv < 0.2) {
        g.beginPath();
        g.arc(x, y + 6, 9, Math.PI * 1.15, Math.PI * 1.85);
        g.strokeStyle = 'rgba(180,130,60,0.3)';
        g.lineWidth = 1.2;
        g.stroke();
      } else if (hv < 0.26) {
        D.ellipse(g, x, y, 2.5, 1.6, '#fff3dc');
      } else if (hv < 0.3) {
        // tiny cactus
        D.ellipse(g, x, y + 1, 4, 1.6, 'rgba(0,0,0,0.12)');
        D.roundRect(g, x - 2, y - 9, 4, 10, 2);
        g.fillStyle = '#4fae5a';
        g.fill();
      }
      return;
    }
    // grass
    if (hv < 0.22) {
      g.lineCap = 'round';
      g.strokeStyle = D.shade(theme.top[0], -0.25);
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x - 3, y); g.lineTo(x - 4, y - 5);
      g.moveTo(x, y); g.lineTo(x, y - 6);
      g.moveTo(x + 3, y); g.lineTo(x + 4, y - 5);
      g.stroke();
    } else if (hv < 0.31) {
      const col = theme.flowers[Math.floor(cellRand(cx, cy, seed, 9) * theme.flowers.length)];
      g.strokeStyle = D.shade(theme.top[0], -0.3);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y - 5);
      g.stroke();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        D.circle(g, x + Math.cos(a) * 2.2, y - 6 + Math.sin(a) * 1.6, 1.6, col);
      }
      D.circle(g, x, y - 6, 1.2, '#fff2a8');
    } else if (hv < 0.34) {
      D.ellipse(g, x, y, 3, 1.8, 'rgba(120,120,130,0.7)');
      D.ellipse(g, x - 0.6, y - 0.6, 1.6, 0.9, 'rgba(255,255,255,0.5)');
    }
  }

  /** Waterfall anchor points (world px, relative to grid origin). */
  function waterfalls(S) {
    const C = islandCorners(S);
    return [
      { pt: D.lerpPt(C.W, C.S, 0.3), w: 16 },
      { pt: D.lerpPt(C.S, C.E, 0.72), w: 12 },
    ];
  }

  BI.Island = {
    TW, TH, A, B, START_SIZE, EXPANSION_COSTS, MAX_EXPANSIONS, SIDE_H, THEMES,
    iso, toGrid, hashStr, rng, cellRand, shuffle,
    createIslandState, expand, buildCache, waterfalls, islandCorners, blankStats,
  };
})();
