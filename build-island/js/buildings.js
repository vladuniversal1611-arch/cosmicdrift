/* Buildings: definitions, footprints and procedural isometric art.
   Each building = cached static sprite (per rotation) + optional live animation layer. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;
  const P = D.P;

  // cat: house (homes & income) | prod (stations & gatherers) | decor
  // station: crafting building with recipes (see crafting.js) · produce: passive output
  const DEFS = {
    wooden_house: { name: 'Wooden House', emoji: '🏠', cat: 'house', size: [1, 1], cost: { plank: 8, stone: 6 }, level: 1, xp: 25, house: true, produce: { res: 'coins', amount: 6, every: 25 }, h: 52, desc: 'Villagers pay rent in coins.' },
    farm: { name: 'Farm', emoji: '🌾', cat: 'house', size: [2, 1], cost: { plank: 6, wood: 6 }, level: 1, xp: 20, produce: { res: 'coins', amount: 8, every: 25 }, h: 22, desc: 'Grows crops to sell.' },
    sawmill: { name: 'Sawmill', emoji: '🪚', cat: 'prod', size: [1, 1], cost: { wood: 15, stone: 8 }, level: 1, xp: 20, station: true, slots: 2, h: 46, desc: 'Cuts logs into planks.',
      recipes: [{ in: { wood: 3 }, out: { plank: 2 }, time: 6 }] },
    stonecutter: { name: 'Stone Workbench', emoji: '🧱', cat: 'prod', size: [1, 1], cost: { wood: 12, stone: 15 }, level: 1, xp: 20, station: true, slots: 2, h: 44, desc: 'Shapes stone into bricks.',
      recipes: [{ in: { stone: 3 }, out: { brick: 2 }, time: 8 }] },
    flower_bed: { name: 'Flower Bed', emoji: '🌷', cat: 'decor', size: [1, 1], cost: { plank: 2, wood: 4 }, level: 1, xp: 6, h: 20, desc: 'Colourful flowers.' },
    lumber_camp: { name: 'Lumber Camp', emoji: '🪓', cat: 'prod', size: [1, 1], cost: { plank: 10, brick: 4 }, level: 2, xp: 30, produce: { res: 'wood', amount: 5, every: 30 }, h: 40, desc: 'Woodcutters gather logs for you.' },
    quarry: { name: 'Quarry', emoji: '⛏️', cat: 'prod', size: [1, 1], cost: { plank: 10, brick: 8 }, level: 2, xp: 30, produce: { res: 'stone', amount: 4, every: 30 }, h: 56, desc: 'Digs stone automatically.' },
    lamp: { name: 'Lamp Post', emoji: '🏮', cat: 'decor', size: [1, 1], cost: { plank: 2, brick: 2 }, level: 2, xp: 6, h: 64, desc: 'Lights up the night.' },
    bridge: { name: 'Bridge', emoji: '🌉', cat: 'decor', size: [2, 1], cost: { plank: 12, brick: 4 }, level: 2, xp: 20, h: 30, desc: 'A charming arched bridge.' },
    windmill: { name: 'Windmill', emoji: '🌬️', cat: 'house', size: [1, 1], cost: { plank: 15, brick: 10 }, level: 3, xp: 40, produce: { res: 'coins', amount: 14, every: 30 }, h: 92, desc: 'Grinds flour for coins.' },
    furnace: { name: 'Furnace', emoji: '🔥', cat: 'prod', size: [1, 1], cost: { brick: 12, stone: 10 }, level: 3, xp: 40, station: true, slots: 2, h: 60, desc: 'Melts sand into glass, ore into iron.', smoke: [-0.18, -0.2, 60],
      recipes: [
        { in: { sand: 3 }, out: { glass: 2 }, time: 10 },
        { in: { iron: 2, coal: 1 }, out: { ingot: 2 }, time: 12 },
        { in: { iron: 3, wood: 4 }, out: { ingot: 1 }, time: 15 },
      ] },
    stone_house: { name: 'Stone House', emoji: '🏡', cat: 'house', size: [1, 1], cost: { plank: 12, brick: 15, glass: 4 }, level: 4, xp: 55, house: true, produce: { res: 'coins', amount: 18, every: 35 }, h: 62, desc: 'Sturdy home. Big rent.', smoke: [0.2, -0.2, 70] },
    fountain: { name: 'Fountain', emoji: '⛲', cat: 'decor', size: [1, 1], cost: { brick: 10, glass: 4, crystal: 2 }, level: 4, xp: 35, h: 44, desc: 'Splashy centrepiece.' },
    workshop: { name: 'Workshop', emoji: '🛠️', cat: 'prod', size: [1, 1], cost: { plank: 15, brick: 10, ingot: 4 }, level: 5, xp: 60, station: true, slots: 2, h: 64, desc: 'Forges tools from planks & iron.', smoke: [0.24, -0.18, 66],
      recipes: [{ in: { plank: 2, ingot: 1 }, out: { tools: 1 }, time: 15 }] },
    mine: { name: 'Mine', emoji: '🚇', cat: 'prod', size: [1, 1], cost: { plank: 15, brick: 12, tools: 2 }, level: 6, xp: 70, produce: { res: 'iron', amount: 3, every: 40 }, h: 50, desc: 'Digs iron ore automatically.' },
    tower: { name: 'Tower', emoji: '🗼', cat: 'house', size: [1, 1], cost: { brick: 25, glass: 8, ingot: 6 }, level: 7, xp: 90, produce: { res: 'coins', amount: 35, every: 45 }, h: 140, desc: 'Lookout tower. Tourists pay!' },
    crystal_lab: { name: 'Crystal Lab', emoji: '🔬', cat: 'prod', size: [1, 1], cost: { brick: 15, glass: 10, ingot: 4 }, level: 7, xp: 90, station: true, slots: 2, h: 56, desc: 'Fuses crystals into energy cores.',
      recipes: [{ in: { crystal: 3, glass: 1 }, out: { core: 1 }, time: 20 }] },
    crystal_gen: { name: 'Crystal Generator', emoji: '💎', cat: 'prod', size: [1, 1], cost: { brick: 20, ingot: 6, core: 2 }, level: 8, xp: 120, produce: { res: 'crystal', amount: 2, every: 40 }, h: 80, desc: 'Grows crystals over time.' },
  };
  const ORDER = ['sawmill', 'stonecutter', 'wooden_house', 'farm', 'flower_bed', 'lumber_camp', 'quarry', 'lamp', 'bridge', 'windmill', 'furnace',
    'stone_house', 'fountain', 'workshop', 'mine', 'tower', 'crystal_lab', 'crystal_gen'];

  function footprint(def, rot) {
    return rot % 2 ? [def.size[1], def.size[0]] : [def.size[0], def.size[1]];
  }

  // ---------------- helpers ----------------
  function gableRoof(g, w, d, z, rh, col, wall, alongX) {
    const o = 0.1, hw = w / 2 + o, hd = d / 2 + o;
    const light = D.shade(col, 0.14), dark = D.shade(col, -0.3), mid = D.shade(col, -0.12);
    if (alongX) {
      D.poly(g, [P(w / 2, d / 2, z), P(w / 2, -d / 2, z), P(w / 2, 0, z + rh - 2)], wall.right);
      const R1 = P(-hw, 0, z + rh), R2 = P(hw, 0, z + rh);
      D.poly(g, [P(-hw, -hd, z), P(hw, -hd, z), R2, R1], light);
      D.poly(g, [P(-hw, hd, z - 3), P(hw, hd, z - 3), P(hw, hd, z), P(-hw, hd, z)], dark);
      D.poly(g, [P(-hw, hd, z), P(hw, hd, z), R2, R1], col);
      [0.33, 0.66].forEach((f) => D.line(g, D.lerpPt(P(-hw, hd, z), R1, f), D.lerpPt(P(hw, hd, z), R2, f), 'rgba(0,0,0,0.13)', 1));
      D.line(g, R1, R2, 'rgba(255,255,255,0.5)', 2);
    } else {
      D.poly(g, [P(-w / 2, d / 2, z), P(w / 2, d / 2, z), P(0, d / 2, z + rh - 2)], wall.left);
      const R1 = P(0, -hd, z + rh), R2 = P(0, hd, z + rh);
      D.poly(g, [P(-hw, -hd, z), P(-hw, hd, z), R2, R1], light);
      D.poly(g, [P(hw, -hd, z - 3), P(hw, hd, z - 3), P(hw, hd, z), P(hw, -hd, z)], dark);
      D.poly(g, [P(hw, -hd, z), P(hw, hd, z), R2, R1], mid);
      [0.33, 0.66].forEach((f) => D.line(g, D.lerpPt(P(hw, -hd, z), R1, f), D.lerpPt(P(hw, hd, z), R2, f), 'rgba(0,0,0,0.13)', 1));
      D.line(g, R1, R2, 'rgba(255,255,255,0.5)', 2);
    }
  }
  function windowOn(g, face, w, d, u0, u1, z0, z1, glass) {
    D.faceQuad(g, face, w, d, u0 - 0.04, u1 + 0.04, z0 - 1.5, z1 + 1.5, '#ffffff');
    D.faceQuad(g, face, w, d, u0, u1, z0, z1, glass || '#8fdcff');
    D.faceQuad(g, face, w, d, u0, (u0 + u1) / 2, (z0 + z1) / 2, z1, 'rgba(255,255,255,0.45)');
    D.line(g, D.facePt(face, w, d, (u0 + u1) / 2, z0), D.facePt(face, w, d, (u0 + u1) / 2, z1), 'rgba(255,255,255,0.9)', 1.2);
  }
  function plankLines(g, face, w, d, h, step, col) {
    for (let z = step; z < h; z += step) D.faceLine(g, face, w, d, 0, 1, z, col, 1);
  }
  function cylBands(g, r, zs, col) {
    g.strokeStyle = col;
    g.lineWidth = 1.2;
    zs.forEach((z) => {
      g.beginPath();
      g.ellipse(0, -z, r, r * 0.5, 0, 0, Math.PI);
      g.stroke();
    });
  }

  // ---------------- static art ----------------
  const STATIC = {
    wooden_house(g, rot) {
      const w = 0.74, d = 0.74, h = 26;
      D.shadow(g, 0, 3, 34, 15, 0.2);
      const wall = { top: '#e8b479', left: '#d4934f', right: '#a96c36' };
      D.box(g, w, d, h, 0, wall.top, wall.left, wall.right);
      plankLines(g, 'left', w, d, h, 5, 'rgba(90,50,20,0.2)');
      plankLines(g, 'right', w, d, h, 5, 'rgba(60,30,10,0.2)');
      const df = rot ? 'right' : 'left', wf = rot ? 'left' : 'right';
      D.faceQuad(g, df, w, d, 0.34, 0.66, 0, 17, '#8a5227');
      D.faceQuad(g, df, w, d, 0.38, 0.62, 0, 15, '#5c3214');
      const k = D.facePt(df, w, d, 0.57, 7);
      D.circle(g, k[0], k[1], 1.2, '#ffd34d');
      windowOn(g, wf, w, d, 0.3, 0.7, 10, 20);
      gableRoof(g, w, d, h, 20, '#ef5a4a', wall, rot === 0);
    },
    stone_house(g, rot) {
      const w = 0.8, d = 0.8, h = 30;
      D.shadow(g, 0, 3, 36, 16, 0.2);
      const wall = { top: '#dfe2ea', left: '#bfc3d0', right: '#9095a8' };
      D.box(g, w, d, h, 0, wall.top, wall.left, wall.right);
      ['left', 'right'].forEach((f) => {
        for (let z = 6, row = 0; z < h; z += 6, row++) {
          D.faceLine(g, f, w, d, 0, 1, z, 'rgba(60,60,80,0.22)', 1);
          for (let u = (row % 2) * 0.12 + 0.1; u < 1; u += 0.25) D.line(g, D.facePt(f, w, d, u, z - 6), D.facePt(f, w, d, u, z), 'rgba(60,60,80,0.2)', 1);
        }
      });
      const df = rot ? 'right' : 'left', wf = rot ? 'left' : 'right';
      D.faceQuad(g, df, w, d, 0.36, 0.64, 0, 18, '#7a4a26');
      D.faceQuad(g, df, w, d, 0.4, 0.6, 0, 16, '#4e2b12');
      windowOn(g, wf, w, d, 0.14, 0.4, 13, 23, '#ffe9a3');
      windowOn(g, wf, w, d, 0.6, 0.86, 13, 23, '#ffe9a3');
      gableRoof(g, w, d, h, 22, '#4a7cf0', wall, rot === 0);
      g.save();
      const c = P(0.2, -0.2, 0);
      g.translate(c[0], c[1]);
      D.box(g, 0.14, 0.14, 14, h + 12, '#c2c6d3', '#a3a8b8', '#7c8195');
      D.box(g, 0.18, 0.18, 3, h + 26, '#8a8fa3', '#74798c', '#5d6275');
      g.restore();
    },
    farm(g, rot) {
      const fp = footprint(DEFS.farm, rot);
      const w = fp[0] * 0.94, d = fp[1] * 0.94;
      D.shadow(g, 0, 2, (fp[0] + fp[1]) * 16, (fp[0] + fp[1]) * 7, 0.15);
      D.box(g, w, d, 5, 0, '#8a5a2e', '#7a4c24', '#5e3a1b', false);
      const along = fp[0] >= fp[1];
      const lenHalf = (along ? w : d) / 2 - 0.1, widHalf = (along ? d : w) / 2 - 0.08;
      const plants = [];
      const rows = 4;
      for (let r = 0; r < rows; r++) {
        const v = -widHalf + (r + 0.5) * (2 * widHalf / rows);
        for (let u = -lenHalf; u <= lenHalf + 0.001; u += 0.2) plants.push(along ? [u, v, r] : [v, u, r]);
      }
      // furrows
      for (let r = 0; r < rows; r++) {
        const v = -widHalf + (r + 0.5) * (2 * widHalf / rows);
        const a = along ? P(-lenHalf, v, 5) : P(v, -lenHalf, 5), b = along ? P(lenHalf, v, 5) : P(v, lenHalf, 5);
        D.line(g, a, b, 'rgba(60,30,10,0.45)', 3);
      }
      plants.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
      plants.forEach((p) => {
        const b = P(p[0], p[1], 5);
        if (p[2] % 2 === 0) {
          D.line(g, b, [b[0], b[1] - 9], '#5a9e2f', 1.4);
          D.ellipse(g, b[0], b[1] - 11, 2.2, 4, '#ffcf3d');
          D.ellipse(g, b[0] - 0.6, b[1] - 12, 0.9, 2, '#fff1a0');
        } else {
          D.ellipse(g, b[0], b[1] - 3, 4.5, 3.4, '#4fb83a');
          D.ellipse(g, b[0] - 1, b[1] - 4, 2.5, 1.8, '#8ee06a');
        }
      });
      // fence posts on front edges
      const hw = w / 2, hd = d / 2;
      const posts = [];
      const nx = Math.round(fp[0] * 4), ny = Math.round(fp[1] * 4);
      for (let i = 0; i <= nx; i++) posts.push([-hw + (i / nx) * w, hd]);
      for (let i = 0; i < ny; i++) posts.push([hw, -hd + (i / ny) * d]);
      D.line(g, P(-hw, hd, 9), P(hw, hd, 9), '#c08a52', 2);
      D.line(g, P(hw, hd, 9), P(hw, -hd, 9), '#a8743f', 2);
      posts.forEach((p) => {
        const a = P(p[0], p[1], 0);
        g.fillStyle = '#d9a46a';
        g.fillRect(a[0] - 1.3, a[1] - 12, 2.6, 12);
      });
    },
    windmill(g) {
      D.shadow(g, 0, 3, 30, 13, 0.2);
      D.box(g, 0.62, 0.62, 8, 0, '#c7c9d4', '#a9acba', '#83879a');
      D.taper(g, 15, 10, 8, 52, '#fff6e6', '#d6bf98', '#fff8ea');
      g.strokeStyle = 'rgba(150,110,60,0.35)';
      g.lineWidth = 1.2;
      [24, 42].forEach((z) => {
        const r = 15 - (z - 8) / 52 * 5;
        g.beginPath();
        g.ellipse(0, -z, r, r * 0.5, 0, 0, Math.PI);
        g.stroke();
      });
      D.roundRect(g, -4, -16, 8, 12, 3.5);
      g.fillStyle = '#7a4520';
      g.fill();
      D.circle(g, -5, -34, 3, '#ffffff');
      D.circle(g, -5, -34, 2.2, '#8fdcff');
      D.cone(g, 13, 58, 20, '#ff6b5b', '#b8352a');
    },
    bridge(g, rot) {
      const fp = footprint(DEFS.bridge, rot);
      const along = fp[0] >= fp[1];
      const L = (u, v, z) => (along ? P(u, v, z) : P(v, u, z));
      const lh = 0.98, wh = 0.3, N = 12;
      D.shadow(g, 0, 2, 44, 18, 0.15);
      const pier = (u) => {
        g.save();
        const c = L(u, 0, 0);
        g.translate(c[0], c[1]);
        D.box(g, along ? 0.22 : 0.7, along ? 0.7 : 0.22, 7, 0, '#cfd3de', '#aeb3c2', '#868b9e');
        g.restore();
      };
      pier(-lh + 0.12);
      pier(lh - 0.12);
      const zAt = (i) => 6 + 10 * Math.sin(Math.PI * (i + 0.5) / N);
      const rail = (v) => {
        for (let i = 0; i < N; i += 2) {
          const u = -lh + (i + 0.5) * (2 * lh / N);
          const z = zAt(i);
          D.line(g, L(u, v, z), L(u, v, z + 10), '#8a5527', 2);
        }
        g.beginPath();
        for (let i = 0; i < N; i++) {
          const u = -lh + (i + 0.5) * (2 * lh / N);
          const p = L(u, v, zAt(i) + 10);
          if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
        }
        g.strokeStyle = '#a86b35';
        g.lineWidth = 2.4;
        g.stroke();
      };
      rail(-wh);
      for (let i = 0; i < N; i++) {
        const u = -lh + (i + 0.5) * (2 * lh / N);
        g.save();
        const c = L(u, 0, 0);
        g.translate(c[0], c[1]);
        const pl = (2 * lh / N) * 0.92;
        const col = i % 2 ? '#c98a4b' : '#b97a3e';
        D.box(g, along ? pl : 0.66, along ? 0.66 : pl, 3, zAt(i), D.shade(col, 0.15), col, D.shade(col, -0.25), false);
        g.restore();
      }
      rail(wh);
    },
    tower(g) {
      D.shadow(g, 0, 3, 32, 14, 0.22);
      D.box(g, 0.7, 0.7, 10, 0, '#c9ccd8', '#a9acba', '#7f8498');
      D.cylinder(g, 17, 10, 72, '#d2d5df', '#7f8498', null);
      cylBands(g, 17, [20, 30, 40, 50, 60, 70], 'rgba(40,40,60,0.12)');
      D.roundRect(g, -6, -46, 4, 11, 2); g.fillStyle = '#2a2e45'; g.fill();
      D.roundRect(g, 3, -68, 4, 11, 2); g.fillStyle = '#2a2e45'; g.fill();
      D.roundRect(g, -5, -22, 9, 12, 4); g.fillStyle = '#6b3e1e'; g.fill();
      D.cylinder(g, 20, 82, 6, '#e0e3ec', '#8e93a6', '#f0f2f7');
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (0.1 + k * 0.2);
        const x = Math.cos(a) * 18, y = -88 + Math.sin(a) * 9;
        g.fillStyle = k < 2 ? '#e8eaf1' : '#a3a8b8';
        g.fillRect(x - 3, y - 6, 6, 6);
      }
      D.cone(g, 18, 90, 30, '#b48cff', '#5b34c9');
      D.line(g, [0, -120], [0, -138], '#5a3a1f', 1.6);
    },
    workshop(g, rot) {
      const w = 0.86, d = 0.8, h = 24;
      D.shadow(g, 0, 3, 36, 15, 0.2);
      const wall = { top: '#eab878', left: '#d79a55', right: '#a96c36' };
      D.box(g, w, d, h, 0, wall.top, wall.left, wall.right);
      plankLines(g, 'left', w, d, h, 6, 'rgba(90,50,20,0.2)');
      plankLines(g, 'right', w, d, h, 6, 'rgba(60,30,10,0.2)');
      const df = rot ? 'right' : 'left', wf = rot ? 'left' : 'right';
      D.faceQuad(g, df, w, d, 0.18, 0.66, 0, 18, '#5c3a22');
      for (let u = 0.26; u < 0.66; u += 0.08) D.line(g, D.facePt(df, w, d, u, 0), D.facePt(df, w, d, u, 18), 'rgba(0,0,0,0.25)', 1);
      D.faceLine(g, df, w, d, 0.18, 0.66, 9, 'rgba(255,220,150,0.5)', 1.4);
      windowOn(g, wf, w, d, 0.3, 0.7, 10, 19);
      // shed roof sloping down toward the viewer
      const hw = w / 2 + 0.08, hd = d / 2 + 0.08;
      D.poly(g, [P(w / 2, d / 2, h), P(w / 2, -d / 2, h), P(w / 2, -d / 2, h + 12)], wall.right);
      D.poly(g, [P(-w / 2, -d / 2, h), P(w / 2, -d / 2, h), P(w / 2, -d / 2, h + 12), P(-w / 2, -d / 2, h + 12)], wall.left);
      D.poly(g, [P(-hw, hd, h - 2), P(hw, hd, h - 2), P(hw, hd, h + 1), P(-hw, hd, h + 1)], '#3e4a5a');
      D.poly(g, [P(-hw, -hd, h + 13), P(hw, -hd, h + 13), P(hw, hd, h + 1), P(-hw, hd, h + 1)], '#64788f');
      for (let f = 0.2; f < 1; f += 0.2) D.line(g, D.lerpPt(P(-hw, -hd, h + 13), P(-hw, hd, h + 1), f), D.lerpPt(P(hw, -hd, h + 13), P(hw, hd, h + 1), f), 'rgba(255,255,255,0.12)', 1);
      // chimney pipe
      g.save();
      const c = P(0.24, -0.18, 0);
      g.translate(c[0], c[1]);
      D.cylinder(g, 3.5, h + 10, 20, '#7d8796', '#4a5260', '#2a2f38');
      g.restore();
      // gear sign
      const gp = D.facePt(wf, w, d, 0.5, 4);
      g.save();
      g.translate(gp[0], gp[1] - 1);
      g.scale(1, 0.8);
      g.fillStyle = '#ffcf2e';
      for (let i = 0; i < 8; i++) {
        g.save();
        g.rotate((i / 8) * Math.PI * 2);
        g.fillRect(-1.3, -6.2, 2.6, 3);
        g.restore();
      }
      D.circle(g, 0, 0, 4.4, '#ffcf2e');
      D.circle(g, 0, 0, 1.8, '#8a5527');
      g.restore();
    },
    crystal_gen(g) {
      D.shadow(g, 0, 3, 32, 14, 0.25);
      D.box(g, 0.78, 0.78, 10, 0, '#8a91b8', '#666d92', '#474d70');
      D.box(g, 0.52, 0.52, 8, 10, '#a3abd6', '#7c84ad', '#5a6188');
      D.faceLine(g, 'left', 0.78, 0.78, 0.15, 0.85, 5, '#3ff2ff', 1.6);
      D.faceLine(g, 'right', 0.78, 0.78, 0.15, 0.85, 5, '#3ff2ff', 1.6);
      g.strokeStyle = 'rgba(63,242,255,0.9)';
      g.lineWidth = 1.6;
      g.beginPath();
      g.ellipse(0, -18 + 8, 12, 6, 0, 0, Math.PI * 2);
      g.stroke();
      // two pylons
      [[-0.22, 0.22], [0.22, -0.22]].forEach((p) => {
        g.save();
        const c = P(p[0], p[1], 0);
        g.translate(c[0], c[1]);
        D.box(g, 0.08, 0.08, 26, 18, '#c9d0f0', '#9aa3c9', '#6d759c', false);
        D.circle(g, 0, -46, 2.4, '#7ff6ff');
        g.restore();
      });
    },
    flower_bed(g) {
      D.shadow(g, 0, 2, 26, 11, 0.15);
      D.box(g, 0.84, 0.84, 6, 0, '#7a4c24', '#c98a4b', '#a06a35');
      D.poly(g, [P(-0.36, -0.36, 6), P(0.36, -0.36, 6), P(0.36, 0.36, 6), P(-0.36, 0.36, 6)], '#6b3f1c');
      const cols = ['#ff6b8a', '#ffd93d', '#ffffff', '#b28dff', '#ff9e5e', '#5fd0ff'];
      const pts = [];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) pts.push([-0.27 + i * 0.18, -0.27 + j * 0.18, (i * 4 + j) % cols.length]);
      pts.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
      pts.forEach((p) => {
        const b = P(p[0], p[1], 6);
        D.line(g, b, [b[0], b[1] - 7], '#3f9e3a', 1.3);
        D.ellipse(g, b[0] - 2, b[1] - 3, 2, 1, '#5fcf4a');
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          D.circle(g, b[0] + Math.cos(a) * 2.2, b[1] - 9 + Math.sin(a) * 1.7, 1.7, cols[p[2]]);
        }
        D.circle(g, b[0], b[1] - 9, 1.1, '#fff2a8');
      });
    },
    lamp(g) {
      D.shadow(g, 0, 2, 12, 5, 0.2);
      D.box(g, 0.22, 0.22, 5, 0, '#5a6680', '#465068', '#323a50');
      const gr = g.createLinearGradient(-2, 0, 2, 0);
      gr.addColorStop(0, '#5a6680');
      gr.addColorStop(1, '#232a3c');
      g.fillStyle = gr;
      g.fillRect(-1.8, -46, 3.6, 42);
      D.line(g, [-0.6, -46], [-0.6, -6], 'rgba(255,255,255,0.25)', 0.8);
      D.box(g, 0.2, 0.2, 11, 45, '#fff6c4', '#ffe680', '#f5c542', false);
      D.poly(g, [P(-0.14, -0.14, 56), P(0.14, -0.14, 56), P(0.14, 0.14, 56), P(-0.14, 0.14, 56)], '#2f3b55');
      D.poly(g, [P(-0.14, 0.14, 56), P(0.14, 0.14, 56), P(0.14, -0.14, 56), [0, -63]], '#3c4a63');
      D.poly(g, [P(-0.14, 0.14, 56), [0, -63], P(-0.14, -0.14, 56)], '#55627d');
    },
    fountain(g) {
      D.shadow(g, 0, 3, 30, 13, 0.2);
      D.cylinder(g, 27, 0, 10, '#e2e5ee', '#9ca2b6', '#f2f4f8');
      const wg = g.createLinearGradient(0, -20, 0, -4);
      wg.addColorStop(0, '#9ae6ff');
      wg.addColorStop(1, '#3fb0f0');
      g.beginPath();
      g.ellipse(0, -10, 22, 11, 0, 0, Math.PI * 2);
      g.fillStyle = wg;
      g.fill();
      D.cylinder(g, 4, 10, 14, '#e2e5ee', '#9ca2b6', null);
      D.ellipse(g, 0, -25, 10, 5, '#d5d9e4');
      D.ellipse(g, 0, -25.5, 7.5, 3.6, '#7fd6ff');
    },
    sawmill(g) {
      D.shadow(g, 0, 3, 34, 15, 0.2);
      D.box(g, 0.88, 0.88, 3, 0, '#d9a46a', '#c08a52', '#9a6a38', false);
      const post = (dx, dy) => {
        g.save();
        const c = P(dx, dy, 0);
        g.translate(c[0], c[1]);
        D.box(g, 0.07, 0.07, 36, 3, '#a8703a', '#8a5527', '#6b3e1e', false);
        g.restore();
      };
      post(-0.36, -0.36);
      post(0.36, -0.36);
      post(-0.36, 0.36);
      // log pile at the back
      [[-0.18, -0.22, 3], [0.06, -0.22, 3], [-0.06, -0.22, 9]].forEach((l) => {
        const c = P(l[0], l[1], l[2]);
        D.roundRect(g, c[0] - 11, c[1] - 6, 22, 7, 3.5);
        g.fillStyle = '#9a5b2c';
        g.fill();
        D.ellipse(g, c[0] + 10, c[1] - 2.5, 2.6, 3.4, '#e2b07a');
      });
      // saw table
      g.save();
      const t = P(0.05, 0.1, 0);
      g.translate(t[0], t[1]);
      D.box(g, 0.56, 0.3, 13, 3, '#c79a62', '#a8763f', '#7f5428');
      D.box(g, 0.4, 0.12, 4, 16, '#b06a32', '#9a5b2c', '#7a4520', false);
      g.restore();
      // plank stack in front
      g.save();
      const k = P(0.26, 0.3, 0);
      g.translate(k[0], k[1]);
      ['#e2a862', '#cc8a44', '#e2a862'].forEach((c, i) => D.box(g, 0.32, 0.13, 2.5, 3 + i * 2.5, D.shade(c, 0.12), c, D.shade(c, -0.22), false));
      g.restore();
      post(0.36, 0.36);
      // shed roof
      const hw = 0.48, hd = 0.48;
      D.poly(g, [P(-hw, hd, 36), P(hw, hd, 36), P(hw, hd, 39), P(-hw, hd, 39)], '#7a3326');
      D.poly(g, [P(-hw, -hd, 46), P(hw, -hd, 46), P(hw, hd, 39), P(-hw, hd, 39)], '#c0583f');
      for (let f = 0.25; f < 1; f += 0.25) D.line(g, D.lerpPt(P(-hw, -hd, 46), P(-hw, hd, 39), f), D.lerpPt(P(hw, -hd, 46), P(hw, hd, 39), f), 'rgba(0,0,0,0.15)', 1);
    },
    stonecutter(g) {
      D.shadow(g, 0, 3, 32, 14, 0.2);
      D.box(g, 0.86, 0.86, 4, 0, '#c9ccd8', '#a9acba', '#83879a', false);
      // brick stack (back right)
      g.save();
      const bs = P(0.22, -0.24, 0);
      g.translate(bs[0], bs[1]);
      for (let i = 0; i < 3; i++) D.box(g, 0.26, 0.16, 4, 4 + i * 4, '#ec8060', '#c4553a', '#9a3a22', false);
      g.restore();
      // workbench legs + top
      g.save();
      const t = P(-0.04, 0.06, 0);
      g.translate(t[0], t[1]);
      [[-0.26, -0.14], [0.26, -0.14], [-0.26, 0.14], [0.26, 0.14]].forEach((l) => {
        g.save();
        const c = P(l[0], l[1], 0);
        g.translate(c[0], c[1]);
        D.box(g, 0.05, 0.05, 12, 4, '#8a5527', '#7a4520', '#5c3214', false);
        g.restore();
      });
      D.box(g, 0.64, 0.38, 3, 16, '#d9a46a', '#b47334', '#8a5527');
      D.box(g, 0.2, 0.18, 9, 19, '#d3d9e4', '#a3abbd', '#7c859a');
      g.restore();
      // sign post
      D.line(g, P(-0.38, 0.3, 4), P(-0.38, 0.3, 40), '#7a4520', 2.4);
      const sp = P(-0.38, 0.3, 40);
      D.roundRect(g, sp[0] - 9, sp[1] - 2, 18, 11, 3);
      g.fillStyle = '#e8b479';
      g.fill();
      g.save();
      g.translate(sp[0], sp[1] + 3.5);
      D.poly(g, [[-5, 0], [0, -2.5], [5, 0], [5, 3], [0, 5.5], [-5, 3]], '#c4553a');
      D.poly(g, [[-5, 0], [0, -2.5], [5, 0], [0, 2.5]], '#ec8060');
      g.restore();
    },
    furnace(g) {
      D.shadow(g, 0, 3, 34, 15, 0.24);
      D.box(g, 0.86, 0.86, 6, 0, '#8e93a6', '#6f7487', '#53586a');
      g.save();
      const ch = P(-0.18, -0.2, 0);
      g.translate(ch[0], ch[1]);
      D.cylinder(g, 5, 20, 36, '#c4553a', '#7a2a18', '#3a1a12');
      g.restore();
      D.cylinder(g, 22, 6, 14, '#d86a4a', '#8e3520', null);
      g.beginPath();
      g.ellipse(0, -20, 22, 20, 0, Math.PI, 0);
      g.ellipse(0, -20, 22, 11, 0, 0, Math.PI);
      const dg = g.createLinearGradient(-22, 0, 22, 0);
      dg.addColorStop(0, '#ec8060');
      dg.addColorStop(0.4, '#d86a4a');
      dg.addColorStop(1, '#8e3520');
      g.fillStyle = dg;
      g.fill();
      g.strokeStyle = 'rgba(80,20,10,0.35)';
      g.lineWidth = 1;
      [12, 18, 26, 33].forEach((z) => {
        g.beginPath();
        const rr = z > 20 ? Math.sqrt(Math.max(0, 1 - Math.pow((z - 20) / 20, 2))) * 22 : 22;
        g.ellipse(0, -z, rr, rr * 0.5, 0, 0, Math.PI);
        g.stroke();
      });
      // mouth
      g.beginPath();
      g.moveTo(-8, -6);
      g.lineTo(-8, -14);
      g.arc(0, -14, 8, Math.PI, 0);
      g.lineTo(8, -6);
      g.closePath();
      g.fillStyle = '#2a1410';
      g.fill();
      g.strokeStyle = '#5a5f72';
      g.lineWidth = 2;
      g.stroke();
    },
    lumber_camp(g) {
      D.shadow(g, 0, 3, 32, 14, 0.2);
      // canvas hut
      g.save();
      const h = P(-0.12, -0.12, 0);
      g.translate(h[0], h[1]);
      D.box(g, 0.56, 0.56, 6, 0, '#a8703a', '#8a5527', '#6b3e1e');
      gableRoof(g, 0.56, 0.56, 6, 24, '#5fae4a', { left: '#4d8a3c', right: '#3f7432' }, false);
      D.faceQuad(g, 'left', 0.56, 0.56, 0.38, 0.62, 0, 12, '#2a3a20');
      g.restore();
      // log pile front-right
      const lp = P(0.24, 0.22, 0);
      [[-9, 0], [3, 0], [-3, -7]].forEach((o) => {
        D.roundRect(g, lp[0] + o[0] - 8, lp[1] + o[1] - 7, 18, 7, 3.5);
        g.fillStyle = '#9a5b2c';
        g.fill();
        D.ellipse(g, lp[0] + o[0] + 9, lp[1] + o[1] - 3.5, 2.6, 3.5, '#e2b07a');
        D.ellipse(g, lp[0] + o[0] + 9, lp[1] + o[1] - 3.5, 1, 1.4, '#b07a42');
      });
      // stump with axe
      const st = P(-0.3, 0.3, 0);
      g.save();
      g.translate(st[0], st[1]);
      D.cylinder(g, 6, 0, 6, '#a5652f', '#6e3d1a', '#e2b07a');
      D.line(g, [0, -6], [6, -20], '#8a5527', 2);
      D.poly(g, [[3, -18], [9, -24], [11, -19], [7, -16]], '#c9d0dd');
      g.restore();
    },
    quarry(g) {
      D.shadow(g, 0, 3, 32, 14, 0.18);
      D.poly(g, [P(-0.4, -0.4, 0), P(0.4, -0.4, 0), P(0.4, 0.4, 0), P(-0.4, 0.4, 0)], '#8d93a6');
      D.poly(g, [P(-0.3, -0.3, -2), P(0.3, -0.3, -2), P(0.3, 0.3, -2), P(-0.3, 0.3, -2)], '#5e6375');
      D.poly(g, [P(-0.3, -0.3, -2), P(0.3, -0.3, -2), P(0.2, -0.2, -8), P(-0.2, -0.2, -8)], '#6f7487');
      D.poly(g, [P(-0.3, -0.3, -2), P(-0.2, -0.2, -8), P(-0.2, 0.2, -8), P(-0.3, 0.3, -2)], '#7c8195');
      D.poly(g, [P(-0.2, -0.2, -8), P(0.2, -0.2, -8), P(0.2, 0.2, -8), P(-0.2, 0.2, -8)], '#474b5a');
      // stacked blocks
      [[0.26, 0.28, 0], [0.26, 0.28, 8], [0.1, 0.3, 0]].forEach((b) => {
        g.save();
        const c = P(b[0], b[1], 0);
        g.translate(c[0], c[1]);
        D.box(g, 0.18, 0.18, 8, b[2], '#dfe2ea', '#b6bac8', '#8e93a6');
        g.restore();
      });
      // crane
      const base = P(-0.32, 0.3, 0), top = P(-0.32, 0.3, 50), tip = P(0.12, -0.12, 50);
      D.line(g, base, top, '#8a5527', 3);
      D.line(g, P(-0.32, 0.3, 30), P(-0.1, 0.1, 50), '#a8703a', 1.6);
      D.line(g, top, tip, '#a8703a', 2.6);
      D.line(g, tip, [tip[0], tip[1] + 26], 'rgba(60,40,20,0.8)', 1);
      D.roundRect(g, tip[0] - 5, tip[1] + 25, 10, 8, 2);
      g.fillStyle = '#c9ccd8';
      g.fill();
    },
    mine(g) {
      D.shadow(g, 0, 3, 34, 15, 0.22);
      g.beginPath();
      g.moveTo(-32, 6);
      g.quadraticCurveTo(-30, -24, -10, -38);
      g.quadraticCurveTo(4, -46, 16, -34);
      g.quadraticCurveTo(32, -18, 32, 6);
      g.quadraticCurveTo(0, 18, -32, 6);
      const mg = g.createLinearGradient(-30, -40, 30, 10);
      mg.addColorStop(0, '#b1a39a');
      mg.addColorStop(0.5, '#857770');
      mg.addColorStop(1, '#5a4e48');
      g.fillStyle = mg;
      g.fill();
      [[-14, -26, 2.4], [12, -22, 2], [18, -8, 1.8], [-22, -6, 1.6]].forEach((p) => D.circle(g, p[0], p[1], p[2], '#e8783a'));
      D.ellipse(g, -2, -40, 10, 4, '#7ac943');
      // entrance
      g.beginPath();
      g.moveTo(-14, 6);
      g.lineTo(-14, -10);
      g.quadraticCurveTo(-4, -22, 6, -10);
      g.lineTo(6, 8);
      g.closePath();
      g.fillStyle = '#17110e';
      g.fill();
      g.strokeStyle = '#8a5527';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-14, 7); g.lineTo(-14, -12); g.lineTo(6, -12); g.lineTo(6, 8);
      g.stroke();
      // rails + cart
      D.line(g, [-10, 8], [-22, 16], '#6b6f80', 1.4);
      D.line(g, [2, 9], [-10, 18], '#6b6f80', 1.4);
      D.poly(g, [[-20, 6], [-6, 6], [-8, 13], [-18, 13]], '#5a6680');
      D.circle(g, -16, 14, 2, '#2a2e3a');
      D.circle(g, -10, 14, 2, '#2a2e3a');
      [[-16, 5], [-12, 4], [-9, 5.5]].forEach((p) => D.circle(g, p[0], p[1], 2.2, '#e8783a'));
    },
    crystal_lab(g) {
      D.shadow(g, 0, 3, 32, 14, 0.22);
      D.box(g, 0.8, 0.8, 9, 0, '#eef1f8', '#c9cfdf', '#9aa3bd');
      D.faceLine(g, 'left', 0.8, 0.8, 0.1, 0.9, 5, '#3ff2ff', 1.6);
      D.faceLine(g, 'right', 0.8, 0.8, 0.1, 0.9, 5, '#3ff2ff', 1.6);
      D.ellipse(g, 0, -9, 21, 10.5, '#8a91b8');
      D.line(g, [16, -26], [16, -52], '#9aa3bd', 2);
      D.circle(g, 16, -53, 2.6, '#ff5a8a');
    },
  };

  // ---------------- live animation layer ----------------
  const ANIM = {
    windmill(ctx, t) {
      ctx.save();
      ctx.translate(1, -52);
      const a = t * 1.6;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(a + (i * Math.PI) / 2);
        ctx.fillStyle = '#7a4a1f';
        ctx.fillRect(-1.3, -32, 2.6, 32);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(1.3, -31, 7.5, 22);
        ctx.strokeStyle = 'rgba(150,100,60,0.55)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(1.3, -31, 7.5, 22);
        ctx.beginPath();
        ctx.moveTo(1.3, -20); ctx.lineTo(8.8, -20);
        ctx.stroke();
        ctx.restore();
      }
      D.circle(ctx, 0, 0, 3.6, '#5a3a1f');
      D.circle(ctx, -0.8, -0.8, 1.3, '#a8703a');
      ctx.restore();
    },
    tower(ctx, t) {
      ctx.beginPath();
      ctx.moveTo(0, -138);
      for (let x = 0; x <= 16; x += 2) ctx.lineTo(x, -138 + Math.sin(t * 6 - x * 0.4) * 1.5 * (x / 16));
      for (let x = 16; x >= 0; x -= 2) ctx.lineTo(x, -130 + Math.sin(t * 6 - x * 0.4) * 1.5 * (x / 16));
      ctx.closePath();
      ctx.fillStyle = '#ffcf2e';
      ctx.fill();
    },
    crystal_gen(ctx, t) {
      const bob = Math.sin(t * 2) * 3;
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3);
      D.drawSprite(ctx, D.glow('#3ff2ff', 34), 0, -52 + bob);
      ctx.globalAlpha = 1;
      // orbiting sparks (back half first)
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + (i * Math.PI * 2) / 3;
        if (Math.sin(a) < 0) D.circle(ctx, Math.cos(a) * 15, -46 + bob + Math.sin(a) * 6, 1.8, '#c9fbff');
      }
      ctx.save();
      ctx.translate(0, -36 + bob);
      ctx.scale(Math.cos(t * 1.5) * 0.25 + 0.85, 1);
      D.shard(ctx, 0, 0, 14, 30, '#b6fbff', '#3a8cff');
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const a = t * 2 + (i * Math.PI * 2) / 3;
        if (Math.sin(a) >= 0) D.circle(ctx, Math.cos(a) * 15, -46 + bob + Math.sin(a) * 6, 2, '#ffffff');
      }
    },
    lamp(ctx, t) {
      ctx.globalAlpha = 0.45 + 0.12 * Math.sin(t * 2.5);
      D.drawSprite(ctx, D.glow('#ffd34d', 28), 0, -50);
      ctx.globalAlpha = 1;
    },
    fountain(ctx, t) {
      ctx.strokeStyle = 'rgba(200,240,255,0.85)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const ex = Math.cos(a) * 15, ey = -10 + Math.sin(a) * 7.5;
        ctx.beginPath();
        ctx.moveTo(0, -27);
        ctx.quadraticCurveTo(Math.cos(a) * 8, -40, ex, ey);
        ctx.stroke();
        const p = (t * 1.3 + i / 6) % 1;
        const it = 1 - p;
        const x = it * it * 0 + 2 * it * p * Math.cos(a) * 8 + p * p * ex;
        const y = it * it * -27 + 2 * it * p * -40 + p * p * ey;
        D.circle(ctx, x, y, 1.4, '#ffffff');
      }
      D.circle(ctx, 0, -29 - Math.abs(Math.sin(t * 5)) * 3, 2.2, 'rgba(220,248,255,0.95)');
      const rp = (t * 0.8) % 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - rp)) + ')';
      ctx.beginPath();
      ctx.ellipse(0, -10, 6 + rp * 14, (6 + rp * 14) * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
    sawmill(ctx, t) {
      const c = P(0.05, 0.1, 22);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.scale(0.55, 1);
      ctx.rotate(t * 8);
      D.circle(ctx, 0, 0, 8, '#dfe5ee');
      ctx.fillStyle = '#9aa3b5';
      for (let i = 0; i < 10; i++) {
        ctx.rotate(Math.PI / 5);
        ctx.fillRect(-1.3, -10, 2.6, 3);
      }
      D.circle(ctx, 0, 0, 2.2, '#5a6680');
      ctx.restore();
    },
    stonecutter(ctx, t) {
      const c = P(-0.04, 0.06, 28);
      const sw = Math.max(0, Math.sin(t * 6));
      ctx.save();
      ctx.translate(c[0] + 8, c[1] - 10);
      ctx.rotate(-0.4 - sw * 0.9);
      ctx.fillStyle = '#8a5527';
      ctx.fillRect(-1.2, 0, 2.4, 13);
      ctx.fillStyle = '#7c859a';
      ctx.fillRect(-4, -2, 8, 4.5);
      ctx.restore();
      if (sw < 0.15) {
        for (let i = 0; i < 3; i++) D.circle(ctx, c[0] + (i - 1) * 4, c[1] - 2 - i * 2, 1.2, '#ffe08a');
      }
    },
    furnace(ctx, t) {
      const f = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3);
      ctx.globalAlpha = 0.55 * f;
      D.drawSprite(ctx, D.glow('#ff8a1f', 22), 0, -12);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.quadraticCurveTo(-5, -12 - f * 4, 0, -16 - f * 3);
      ctx.quadraticCurveTo(5, -12 - f * 4, 6, -6);
      ctx.closePath();
      ctx.fillStyle = '#ff8a1f';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3, -6);
      ctx.quadraticCurveTo(0, -10 - f * 3, 3, -6);
      ctx.closePath();
      ctx.fillStyle = '#ffe08a';
      ctx.fill();
    },
    crystal_lab(ctx, t) {
      const bob = Math.sin(t * 2) * 2;
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3);
      D.drawSprite(ctx, D.glow('#7ff6ff', 26), 0, -26);
      ctx.globalAlpha = 1;
      D.shard(ctx, 0, -12 + bob, 10, 22, '#c9fbff', '#3a8cff');
      // glass dome
      ctx.beginPath();
      ctx.ellipse(0, -9, 21, 30, 0, Math.PI, 0);
      ctx.ellipse(0, -9, 21, 10.5, 0, 0, Math.PI);
      ctx.fillStyle = 'rgba(170,235,255,0.28)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, -9, 21, 30, 0, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-8, -26, 4, 9, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.6 + i / 3) % 1;
        D.circle(ctx, (i - 1) * 7, -10 - k * 22, 1.3 * (1 - k) + 0.3, 'rgba(220,255,255,0.9)');
      }
    },
  };

  function spriteFor(type, rot) {
    const def = DEFS[type];
    const fp = footprint(def, rot);
    const span = fp[0] + fp[1];
    const w = span * D.A + 48;
    const ay = def.h + 26;
    const h = ay + (span / 2) * D.B + 14;
    return D.sprite('bld|' + type + '|' + (rot % 2), w, h, w / 2, ay, (g) => STATIC[type](g, rot % 2));
  }

  /** Draw a building with its footprint centre at the current origin. */
  function draw(ctx, type, rot, t) {
    D.drawSprite(ctx, spriteFor(type, rot), 0, 0);
    if (ANIM[type]) ANIM[type](ctx, t);
  }

  const previews = {};
  /** PNG data URL preview for menus. */
  function preview(type) {
    if (previews[type]) return previews[type];
    const def = DEFS[type];
    const cv = document.createElement('canvas');
    const S = 180;
    cv.width = S;
    cv.height = S;
    const g = cv.getContext('2d');
    const fp = footprint(def, 0);
    const span = fp[0] + fp[1];
    const totalH = def.h + span * D.B + 10;
    const sc = Math.min(2.4, (S * 0.8) / totalH, (S * 0.86) / (span * D.A + 10));
    g.translate(S / 2, S / 2 + (totalH * sc) / 2 - (span / 2) * D.B * sc - 4);
    g.scale(sc, sc);
    draw(g, type, 0, 0.6);
    previews[type] = cv.toDataURL();
    return previews[type];
  }

  BI.Buildings = { DEFS, ORDER, footprint, draw, preview };
})();
