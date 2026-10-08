/* Art: procedural sprites for world objects (resources, loot containers, ruins, player structures). */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;
  const P = D.P;

  function blob(g, x, y, r, c0, c1) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, D.shade(c0, 0.25));
    gr.addColorStop(0.55, c0);
    gr.addColorStop(1, c1);
    D.circle(g, x, y, r, gr);
  }
  function trunk(g, w, h, c0, c1) {
    const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    gr.addColorStop(0, c0);
    gr.addColorStop(1, c1);
    D.roundRect(g, -w / 2, -h, w, h + 1, w * 0.4);
    g.fillStyle = gr;
    g.fill();
  }
  function rockShape(g, x, y, s, c0, c1, k) {
    const pts = [[x - 12 * s, y + 2 * s], [x - 10 * s, y - 8 * s - k], [x - 3 * s, y - 14 * s], [x + 7 * s, y - 12 * s + k], [x + 12 * s, y - 3 * s], [x + 9 * s, y + 4 * s], [x - 2 * s, y + 6 * s]];
    D.poly(g, pts, c1);
    D.poly(g, [pts[1], pts[2], pts[3], [x + 3 * s, y - 4 * s], [x - 6 * s, y - 3 * s]], c0);
    D.poly(g, [pts[3], pts[4], pts[5], [x + 3 * s, y - 4 * s]], D.shade(c1, -0.15));
    D.poly(g, [[x - 6 * s, y - 10 * s], [x - 2 * s, y - 12.5 * s], [x - 3 * s, y - 8 * s]], 'rgba(255,255,255,0.35)');
  }

  const TREE_STYLE = { base: 'oak', forest: 'pine', quarry: 'pine', gas: 'dead', suburbs: 'oak', military: 'dead' };

  const NODE_ART = {
    tree(g, vi, style) {
      D.shadow(g, 0, 0, 18, 7, 0.28);
      if (style === 'pine') {
        trunk(g, 6, 14, '#6b4424', '#432a14');
        for (let i = 0; i < 4; i++) {
          const w = 34 - i * 7 + vi * 2, by = -10 - i * 12, h = 22;
          D.poly(g, [[-w / 2, by], [0, by], [0, by - h]], i % 2 ? '#2f6a3a' : '#2a6034');
          D.poly(g, [[0, by], [w / 2, by], [0, by - h]], '#1e4a28');
        }
      } else if (style === 'dead') {
        g.lineCap = 'round';
        g.strokeStyle = '#4a3a2e';
        g.lineWidth = 6;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(1, -44); g.stroke();
        g.lineWidth = 3.2;
        g.beginPath();
        g.moveTo(1, -22); g.lineTo(-14, -34 - vi * 2);
        g.moveTo(1, -30); g.lineTo(13, -42);
        g.moveTo(1, -40); g.lineTo(-7, -54);
        g.moveTo(-8, -29); g.lineTo(-12, -24);
        g.stroke();
      } else {
        trunk(g, 8, 26, '#7a4a24', '#4a2c14');
        const L = vi === 2 ? ['#7a8a3a', '#4a5a22'] : ['#4f8a3a', '#2a5a24'];
        blob(g, -10, -27, 12, L[0], L[1]);
        blob(g, 10, -29, 12, L[0], L[1]);
        blob(g, 0, -39, 16, L[0], L[1]);
        blob(g, 2, -51, 10, L[0], L[1]);
      }
    },
    rock(g, vi) {
      D.shadow(g, 0, 2, 17, 7, 0.25);
      rockShape(g, 2, 0, 1.15 + vi * 0.08, '#a3a9b6', '#646a78', vi * 2);
      if (vi !== 1) rockShape(g, -12, 5, 0.55, '#a3a9b6', '#646a78', 0);
    },
    iron_rock(g, vi) {
      D.shadow(g, 0, 2, 17, 7, 0.25);
      rockShape(g, 2, 0, 1.2 + vi * 0.06, '#9a8a82', '#54483f', vi * 2);
      [[-4, -6, 2.6], [5, -3, 2.1], [0, -12, 1.8], [8, -10, 1.6]].forEach((p) => {
        D.circle(g, p[0], p[1], p[2], '#d8682e');
        D.circle(g, p[0] - 0.6, p[1] - 0.6, p[2] * 0.45, '#ffb07a');
      });
    },
    bush(g, vi) {
      D.shadow(g, 0, 1, 16, 6, 0.22);
      blob(g, -8, -8, 9, '#4f8a3a', '#2a5a24');
      blob(g, 8, -8, 9, '#4f8a3a', '#2a5a24');
      blob(g, 0, -14, 11, '#5a9a42', '#2e6228');
      [[-6, -12], [5, -16], [9, -7], [-2, -6], [1, -20]].forEach((p) => D.circle(g, p[0], p[1], 2.1, vi === 1 ? '#5a6aff' : '#e8334a'));
    },
    branch(g, vi) {
      g.lineCap = 'round';
      g.strokeStyle = '#6b4424';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(-12, 2); g.lineTo(10, -4); g.stroke();
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -1); g.lineTo(4, -8); g.moveTo(-6, 1); g.lineTo(-9, -5); g.stroke();
      if (vi) { g.lineWidth = 2.6; g.beginPath(); g.moveTo(-8, 5); g.lineTo(9, 3); g.stroke(); }
    },
    pebble(g) {
      rockShape(g, -5, 2, 0.32, '#a3a9b6', '#646a78', 0);
      rockShape(g, 5, 4, 0.28, '#a3a9b6', '#646a78', 0);
      rockShape(g, 1, -2, 0.24, '#a3a9b6', '#646a78', 0);
    },
  };
  const DEPLETED = {
    tree(g) { D.shadow(g, 0, 1, 10, 4, 0.2); D.cylinder(g, 6, 0, 5, '#7a4a24', '#4a2c14', '#c9955c'); },
    rock(g) { rockShape(g, -5, 2, 0.35, '#a3a9b6', '#646a78', 0); rockShape(g, 6, 4, 0.3, '#a3a9b6', '#646a78', 0); },
    iron_rock(g) { rockShape(g, -5, 2, 0.35, '#9a8a82', '#54483f', 0); rockShape(g, 6, 4, 0.3, '#9a8a82', '#54483f', 0); },
    bush(g) { g.strokeStyle = '#5a4a32'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-8, -8); g.moveTo(0, 0); g.lineTo(0, -10); g.moveTo(6, 0); g.lineTo(8, -7); g.stroke(); },
  };

  function nodeSprite(o, locId) {
    const vi = Math.floor((o.v || 0) * 3) % 3;
    const style = TREE_STYLE[locId] || 'oak';
    const dep = o.respawnAt !== 0;
    if (dep) {
      if (!DEPLETED[o.type]) return null;
      return D.sprite('dep|' + o.type, 50, 30, 25, 18, DEPLETED[o.type]);
    }
    return D.sprite('node|' + o.type + '|' + vi + '|' + (o.type === 'tree' ? style : ''), 90, 100, 45, 84, (g) => NODE_ART[o.type](g, vi, style));
  }

  // ---------------- containers ----------------
  const CONT_ART = {
    crate(g, looted) {
      D.shadow(g, 0, 3, 22, 9, 0.25);
      D.box(g, 0.56, 0.56, 18, 0, '#c7965a', '#a8743a', '#7f5428');
      ['left', 'right'].forEach((f) => { D.faceLine(g, f, 0.56, 0.56, 0, 1, 9, 'rgba(60,30,10,0.4)', 1.2); });
      D.faceQuad(g, 'left', 0.56, 0.56, 0.05, 0.12, 0, 18, '#7f5428');
      D.faceQuad(g, 'left', 0.56, 0.56, 0.88, 0.95, 0, 18, '#7f5428');
      if (looted) D.poly(g, [P(-0.25, -0.25, 18), P(0.25, -0.25, 18), P(0.25, 0.25, 18), P(-0.25, 0.25, 18)], '#3a2a1a');
    },
    mil_crate(g, looted) {
      D.shadow(g, 0, 3, 24, 10, 0.25);
      D.box(g, 0.66, 0.5, 18, 0, '#7a8a52', '#5e6c3c', '#46522c');
      D.faceQuad(g, 'left', 0.66, 0.5, 0.3, 0.7, 6, 12, '#d9d0a0');
      D.faceLine(g, 'right', 0.66, 0.5, 0, 1, 15, 'rgba(0,0,0,0.3)', 1);
      if (looted) D.poly(g, [P(-0.28, -0.2, 18), P(0.28, -0.2, 18), P(0.28, 0.2, 18), P(-0.28, 0.2, 18)], '#22281a');
    },
    fridge(g, looted) {
      D.shadow(g, 0, 3, 20, 8, 0.25);
      D.box(g, 0.48, 0.48, 40, 0, '#f2f4f8', '#d6dae4', '#aeb4c2');
      D.faceLine(g, 'left', 0.48, 0.48, 0, 1, 26, 'rgba(0,0,0,0.25)', 1);
      D.faceQuad(g, 'left', 0.48, 0.48, 0.78, 0.86, 28, 36, '#8a8f9a');
      D.faceQuad(g, 'left', 0.48, 0.48, 0.78, 0.86, 12, 22, '#8a8f9a');
      if (looted) D.faceQuad(g, 'left', 0.48, 0.48, 0.05, 0.95, 1, 25, '#3a3d44');
    },
    cabinet(g, looted) {
      D.shadow(g, 0, 3, 20, 8, 0.25);
      D.box(g, 0.5, 0.4, 34, 0, '#eef1f6', '#d0d5e0', '#a7aebf');
      const c = D.facePt('left', 0.5, 0.4, 0.5, 22);
      g.fillStyle = '#e8434a';
      g.fillRect(c[0] - 1.6, c[1] - 6, 3.2, 12);
      g.fillRect(c[0] - 6, c[1] - 1.6, 12, 3.2);
      if (looted) D.faceQuad(g, 'right', 0.5, 0.4, 0.1, 0.9, 2, 14, '#3a3d44');
    },
    car(g, looted, v) {
      D.shadow(g, 0, 3, 40, 16, 0.3);
      const col = ['#8a3a32', '#3a5a8a', '#5a6a4a'][Math.floor((v || 0) * 3) % 3];
      D.box(g, 0.92, 0.5, 12, 3, D.shade(col, 0.1), col, D.shade(col, -0.3));
      g.save();
      const c = P(-0.05, 0, 0);
      g.translate(c[0], c[1]);
      D.box(g, 0.5, 0.42, 10, 15, '#9ab0c4', '#6a8096', '#4a5a6a');
      g.restore();
      [[-0.32, 0.25], [0.32, 0.25]].forEach((w) => { const p = P(w[0], w[1], 3); D.ellipse(g, p[0], p[1], 4.5, 5, '#1d1d22'); });
      D.faceQuad(g, 'left', 0.92, 0.5, 0.05, 0.25, 9, 13, 'rgba(255,200,120,0.6)');
      // rust spots
      [[0.2, 8], [0.6, 6]].forEach((rp) => { const p = D.facePt('left', 0.92, 0.5, rp[0], rp[1]); D.ellipse(g, p[0], p[1], 4, 2, 'rgba(120,60,20,0.5)'); });
      if (looted) { const p = P(0.3, -0.05, 15); D.ellipse(g, p[0], p[1], 7, 3, '#222'); }
    },
  };
  function containerSprite(o) {
    const key = 'cont|' + o.type + '|' + (o.looted ? 1 : 0) + '|' + Math.floor((o.v || 0) * 3);
    return D.sprite(key, 110, 90, 55, 66, (g) => CONT_ART[o.type](g, o.looted, o.v));
  }

  // ---------------- obstacles ----------------
  const OBST_ART = {
    ruin_wall(g, v) {
      D.shadow(g, 0, 3, 26, 11, 0.25);
      const h = 22 + v * 14;
      D.box(g, 0.9, 0.9, h, 0, '#a56a52', '#8a5240', '#6a3c2e');
      ['left', 'right'].forEach((f) => { for (let z = 6; z < h; z += 6) D.faceLine(g, f, 0.9, 0.9, 0, 1, z, 'rgba(40,20,10,0.25)', 1); });
      D.poly(g, [P(-0.45, -0.45, h), P(0.1, -0.45, h + 5), P(0.45, 0.1, h - 4), P(0.45, 0.45, h), P(-0.45, 0.45, h)], '#b9806a');
    },
    house_wall(g, v) {
      D.shadow(g, 0, 3, 26, 11, 0.25);
      const h = 34;
      D.box(g, 1, 1, h, 0, '#d8cdb8', '#c2b59c', '#998c74');
      D.faceLine(g, 'left', 1, 1, 0, 1, 4, 'rgba(0,0,0,0.2)', 2);
      if (v < 0.4) D.faceQuad(g, 'left', 1, 1, 0.3, 0.7, 14, 26, '#3a4a5a');
    },
    sandbag(g) {
      D.shadow(g, 0, 3, 24, 10, 0.25);
      for (let row = 0; row < 3; row++) {
        for (let k = -1; k <= 1; k++) {
          const p = P(k * 0.28 + (row % 2) * 0.1, 0, row * 7);
          D.ellipse(g, p[0], p[1] - 3, 12, 6, row % 2 ? '#a89a72' : '#9a8c66');
          D.ellipse(g, p[0] - 2, p[1] - 5, 6, 2.5, 'rgba(255,255,255,0.12)');
        }
      }
    },
    log_pile(g) {
      D.shadow(g, 0, 3, 24, 10, 0.25);
      [[-9, 0], [3, 0], [-3, -8]].forEach((o) => {
        D.roundRect(g, o[0] - 9, o[1] - 7, 20, 8, 4); g.fillStyle = '#6b4424'; g.fill();
        D.ellipse(g, o[0] + 10, o[1] - 3, 3, 4, '#c9955c');
      });
    },
    barrel(g) {
      D.shadow(g, 0, 3, 13, 5, 0.25);
      D.cylinder(g, 10, 0, 24, '#b8452e', '#6a2414', '#3a2a24');
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.5;
      [7, 17].forEach((z) => { g.beginPath(); g.ellipse(0, -z, 10, 5, 0, 0, Math.PI); g.stroke(); });
      D.ellipse(g, -2, -24, 6, 2.5, '#5a4a40');
    },
  };
  function obstacleSprite(o) {
    const vi = Math.floor((o.v || 0) * 3);
    return D.sprite('obst|' + o.type + '|' + vi, 90, 90, 45, 66, (g) => OBST_ART[o.type](g, (vi + 0.5) / 3));
  }

  // ---------------- player structures ----------------
  const BUILD_ART = {
    wood_wall(g) {
      D.box(g, 1, 1, 34, 0, '#b88a52', '#9a6a36', '#714a22');
      ['left', 'right'].forEach((f) => { for (let u = 0.2; u < 1; u += 0.2) D.line(g, D.facePt(f, 1, 1, u, 0), D.facePt(f, 1, 1, u, 34), 'rgba(50,25,8,0.35)', 1.2); });
      D.faceLine(g, 'left', 1, 1, 0, 1, 26, '#5a3a1a', 2.2);
      D.faceLine(g, 'right', 1, 1, 0, 1, 26, '#4a2e14', 2.2);
    },
    wood_door(g, rot) {
      D.box(g, 1, 1, 34, 0, '#b88a52', '#9a6a36', '#714a22');
      const f = rot ? 'right' : 'left';
      D.faceQuad(g, f, 1, 1, 0.25, 0.75, 0, 28, '#5a3a1a');
      D.faceQuad(g, f, 1, 1, 0.3, 0.7, 0, 26, '#7a5028');
      const k = D.facePt(f, 1, 1, 0.62, 13);
      D.circle(g, k[0], k[1], 1.6, '#ffd34d');
    },
    stone_wall(g) {
      D.box(g, 1, 1, 36, 0, '#b8bcc8', '#9a9eac', '#737786');
      ['left', 'right'].forEach((f) => {
        for (let z = 7, row = 0; z < 36; z += 7, row++) {
          D.faceLine(g, f, 1, 1, 0, 1, z, 'rgba(40,40,50,0.3)', 1);
          for (let u = (row % 2) * 0.12 + 0.12; u < 1; u += 0.25) D.line(g, D.facePt(f, 1, 1, u, z - 7), D.facePt(f, 1, 1, u, z), 'rgba(40,40,50,0.25)', 1);
        }
      });
    },
    metal_wall(g) {
      D.box(g, 1, 1, 38, 0, '#9aa3b5', '#7a8394', '#555d6c');
      ['left', 'right'].forEach((f) => {
        for (let u = 0.33; u < 1; u += 0.33) D.line(g, D.facePt(f, 1, 1, u, 0), D.facePt(f, 1, 1, u, 38), 'rgba(0,0,0,0.3)', 1.4);
        [[0.15, 6], [0.5, 6], [0.85, 6], [0.15, 32], [0.5, 32], [0.85, 32]].forEach((r) => { const p = D.facePt(f, 1, 1, r[0], r[1]); D.circle(g, p[0], p[1], 1.2, '#cfd5e0'); });
      });
      D.faceQuad(g, 'left', 1, 1, 0.55, 0.75, 10, 18, 'rgba(160,80,30,0.45)');
    },
    workbench(g) {
      D.shadow(g, 0, 3, 30, 12, 0.25);
      [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]].forEach((l) => {
        g.save(); const c = P(l[0], l[1], 0); g.translate(c[0], c[1]);
        D.box(g, 0.06, 0.06, 16, 0, '#7a4a24', '#6a3e1c', '#4e2c12', false); g.restore();
      });
      D.box(g, 0.76, 0.46, 4, 16, '#c99a62', '#a8763f', '#7f5428');
      const s = P(-0.15, 0, 20);
      g.save(); g.translate(s[0], s[1]); g.rotate(0.3);
      g.fillStyle = '#8a5527'; g.fillRect(-1, -12, 2, 12); g.fillStyle = '#9aa3b5'; g.fillRect(-4, -14, 8, 4); g.restore();
      const v = P(0.2, 0.05, 20);
      g.save(); g.translate(v[0], v[1]); D.box(g, 0.14, 0.14, 7, 0, '#7c8599', '#5c6477', '#454b5a', false); g.restore();
    },
    campfire(g) {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        D.ellipse(g, Math.cos(a) * 14, Math.sin(a) * 7, 4.5, 3, i % 2 ? '#7c8294' : '#9aa0b0');
      }
      g.strokeStyle = '#5a3a1a'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-9, 2); g.lineTo(7, -5); g.moveTo(-7, -5); g.lineTo(9, 2); g.stroke();
    },
    furnace(g) {
      D.shadow(g, 0, 3, 30, 12, 0.3);
      D.box(g, 0.76, 0.76, 30, 0, '#9a9eac', '#7f8494', '#5d6272');
      ['left', 'right'].forEach((f) => { for (let z = 8; z < 30; z += 8) D.faceLine(g, f, 0.76, 0.76, 0, 1, z, 'rgba(0,0,0,0.2)', 1); });
      D.faceQuad(g, 'left', 0.76, 0.76, 0.3, 0.7, 3, 15, '#1a1210');
      g.save(); const c = P(0.15, -0.15, 0); g.translate(c[0], c[1]);
      D.cylinder(g, 5, 30, 20, '#7f8494', '#4a4f5c', '#222');
      g.restore();
    },
    chest(g) {
      D.shadow(g, 0, 3, 24, 10, 0.25);
      D.box(g, 0.66, 0.44, 14, 0, '#c08a4a', '#9a6a30', '#714a1c');
      D.box(g, 0.68, 0.46, 5, 14, '#d9a05a', '#b07a3a', '#80541e');
      D.faceQuad(g, 'left', 0.66, 0.44, 0.44, 0.56, 9, 16, '#e0c050');
    },
    garden(g) {
      D.box(g, 0.92, 0.92, 6, 0, '#5a3a20', '#8a5a30', '#6a4220');
      D.poly(g, [P(-0.4, -0.4, 6), P(0.4, -0.4, 6), P(0.4, 0.4, 6), P(-0.4, 0.4, 6)], '#4a2e18');
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const p = P(i * 0.25, j * 0.25, 6);
        g.strokeStyle = '#4fae3a'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] - 3, p[1] - 7); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 3, p[1] - 7); g.stroke();
      }
    },
    collector(g) {
      D.shadow(g, 0, 3, 20, 8, 0.25);
      D.cylinder(g, 12, 0, 22, '#4a6a9a', '#2a3a5a', '#1a2a40');
      D.line(g, [-14, -22], [-16, -40], '#7a4a24', 2);
      D.line(g, [14, -22], [16, -40], '#7a4a24', 2);
      D.poly(g, [[-20, -40], [20, -40], [6, -26], [-6, -26]], 'rgba(160,200,230,0.8)');
    },
  };
  function buildSprite(type, rot) {
    return D.sprite('bld|' + type + '|' + (rot || 0), 90, 100, 45, 76, (g) => BUILD_ART[type](g, rot || 0));
  }

  function wellSprite() {
    return D.sprite('well', 90, 100, 45, 76, (g) => {
      D.shadow(g, 0, 3, 24, 10, 0.25);
      D.cylinder(g, 18, 0, 14, '#a3a9b6', '#5e6474', '#3a4a5a');
      D.ellipse(g, 0, -14, 13, 6.5, '#2a4a6a');
      D.line(g, [-16, -14], [-16, -46], '#6b4424', 3);
      D.line(g, [16, -14], [16, -46], '#6b4424', 3);
      D.poly(g, [[-22, -44], [0, -58], [22, -44], [0, -36]], '#8a3a2a');
      D.line(g, [0, -44], [0, -24], '#c9a060', 1);
      D.roundRect(g, -3, -26, 6, 6, 1); g.fillStyle = '#7a5028'; g.fill();
    });
  }
  function exitSprite() {
    return D.sprite('exit', 120, 100, 60, 70, (g) => {
      D.shadow(g, 0, 4, 44, 16, 0.3);
      D.box(g, 1.05, 0.55, 22, 2, '#f0c040', '#d8a020', '#a87a10');
      g.save(); const c = P(-0.05, 0, 0); g.translate(c[0], c[1]);
      D.faceQuad(g, 'left', 1.05, 0.55, 0.08, 0.92, 12, 20, '#4a6a8a');
      g.restore();
      [[-0.35, 0.28], [0.35, 0.28]].forEach((w) => { const p = P(w[0], w[1], 2); D.ellipse(g, p[0], p[1], 5, 5.5, '#1d1d22'); });
    });
  }

  BI.Art = { nodeSprite, containerSprite, obstacleSprite, buildSprite, wellSprite, exitSprite, BUILD_ART };
})();
