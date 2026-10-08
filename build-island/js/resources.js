/* Resource nodes: trees (wood), rocks (stone), crystals.
   Static art is rendered once per theme into sprites; animation is applied with transforms. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;

  const TYPES = {
    tree: { res: 'wood', amount: 5, respawn: 20, xp: 2, label: 'WOOD', h: 62, w: 24, color: ['#7ac943', '#b06a32', '#ffe08a'] },
    rock: { res: 'stone', amount: 3, respawn: 25, xp: 3, label: 'STONE', h: 30, w: 22, color: ['#c9d0dd', '#8d96aa', '#ffffff'] },
    crystal: { res: 'crystal', amount: 1, respawn: 45, xp: 6, label: 'CRYSTAL', h: 50, w: 20, color: ['#8ff6ff', '#2aa8ff', '#ffffff'] },
  };

  function blob(g, x, y, r, c0, c1) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, D.shade(c0, 0.35));
    gr.addColorStop(0.55, c0);
    gr.addColorStop(1, c1);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = gr;
    g.fill();
  }
  function trunk(g, x, y, w, h, c0, c1) {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, c0);
    gr.addColorStop(1, c1);
    D.roundRect(g, x - w / 2, y - h, w, h + 1, w * 0.4);
    g.fillStyle = gr;
    g.fill();
  }

  // ---------------- tree styles ----------------
  const TREES = {
    oak(g, th, vi) {
      D.shadow(g, 0, 0, 17, 7, 0.22);
      trunk(g, 0, 0, 8, 26, '#a5652f', '#6e3d1a');
      const L = th.leaf, o = (vi - 1) * 2;
      blob(g, -10 + o, -27, 12, L[0], L[1]);
      blob(g, 10, -28 - o, 12, L[0], L[1]);
      blob(g, 0, -38, 16, L[0], L[1]);
      blob(g, 2 - o, -50, 11, L[0], L[1]);
      if (vi === 2) { D.circle(g, -6, -36, 2.2, '#ff5a5f'); D.circle(g, 7, -44, 2.2, '#ff5a5f'); D.circle(g, 3, -30, 2.2, '#ff5a5f'); }
    },
    palm(g, th, vi) {
      D.shadow(g, 4, 0, 16, 6, 0.2);
      const top = [6 + vi * 2, -46];
      for (let i = 0; i < 7; i++) {
        const f = i / 7;
        const x = top[0] * f * f, y = -f * 46;
        D.ellipse(g, x, y - 3, 4.6 - f * 1.2, 4, i % 2 ? '#c48a4f' : '#a8703a');
      }
      const L = th.leaf;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.62;
        const len = 22 + (i % 2) * 4;
        const tx = top[0] + Math.cos(a) * len, ty = top[1] + Math.sin(a) * len * 0.6 + 10;
        const cx = top[0] + Math.cos(a) * len * 0.5, cy = top[1] + Math.sin(a) * len * 0.5 - 8;
        g.beginPath();
        g.moveTo(top[0], top[1]);
        g.quadraticCurveTo(cx - 4, cy - 2, tx, ty);
        g.quadraticCurveTo(cx + 4, cy + 6, top[0], top[1]);
        g.fillStyle = i % 2 ? L[0] : L[1];
        g.fill();
      }
      D.circle(g, top[0] - 3, top[1] + 4, 3, '#7a4a1f');
      D.circle(g, top[0] + 3, top[1] + 5, 3, '#8b5a2b');
    },
    pine(g, th, vi) {
      D.shadow(g, 0, 0, 15, 6, 0.2);
      trunk(g, 0, 0, 6, 12, '#8a5527', '#5c3214');
      const L = th.leaf;
      for (let i = 0; i < 3; i++) {
        const w = 30 - i * 7 + vi, by = -8 - i * 13, h = 22;
        D.poly(g, [[-w / 2, by], [0, by], [0, by - h]], L[0]);
        D.poly(g, [[0, by], [w / 2, by], [0, by - h]], L[1]);
        D.poly(g, [[-w * 0.22, by - h * 0.55], [w * 0.22, by - h * 0.55], [0, by - h]], '#ffffff');
        D.poly(g, [[-w / 2, by], [-w * 0.3, by - 3], [-w * 0.1, by], [w * 0.1, by - 3], [w * 0.3, by], [w / 2, by], [w / 2 - 2, by - 3], [-w / 2 + 2, by - 3]], 'rgba(255,255,255,0.85)');
      }
    },
    burnt(g, th, vi) {
      D.shadow(g, 0, 0, 14, 6, 0.25);
      g.lineCap = 'round';
      g.strokeStyle = '#2e211e';
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(1, -38); g.stroke();
      g.lineWidth = 3.5;
      g.beginPath();
      g.moveTo(1, -20); g.lineTo(-12, -32 - vi * 2);
      g.moveTo(1, -28); g.lineTo(12, -40);
      g.moveTo(1, -36); g.lineTo(-6, -48);
      g.moveTo(-6, -27); g.lineTo(-10, -22);
      g.stroke();
      g.shadowColor = '#ff6a1f';
      g.shadowBlur = 8;
      [[-12, -32], [12, -40], [-6, -48], [1, -38], [5, -16]].forEach((p, i) => D.circle(g, p[0], p[1], i % 2 ? 2 : 2.6, i % 2 ? '#ffb347' : '#ff6a1f'));
      g.shadowBlur = 0;
    },
    neon(g, th, vi) {
      D.shadow(g, 0, 0, 14, 6, 0.3);
      trunk(g, 0, 0, 5, 26, '#4a3a9a', '#22185a');
      const c = vi === 1 ? th.leaf[1] : th.leaf[0];
      g.shadowColor = c;
      g.shadowBlur = 14;
      g.lineWidth = 2.5;
      g.strokeStyle = c;
      g.fillStyle = 'rgba(30,10,80,0.7)';
      [[-9, -30, 10], [9, -31, 10], [0, -42, 13]].forEach((b) => {
        g.beginPath();
        g.arc(b[0], b[1], b[2], 0, Math.PI * 2);
        g.fill();
        g.stroke();
      });
      g.shadowBlur = 0;
      D.circle(g, -3, -46, 2, '#ffffff');
    },
    cotton(g, th, vi) {
      D.shadow(g, 0, 0, 16, 6, 0.15);
      trunk(g, 0, 0, 6, 26, '#ffffff', '#d8d0e8');
      g.strokeStyle = 'rgba(80,60,90,0.35)';
      g.lineWidth = 1;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-2, -6 - i * 7); g.lineTo(1, -6 - i * 7); g.stroke(); }
      const L = vi === 1 ? ['#c9b8ff', '#9c86f0'] : th.leaf;
      blob(g, -10, -28, 11, L[0], L[1]);
      blob(g, 10, -29, 11, L[0], L[1]);
      blob(g, 0, -40, 15, L[0], L[1]);
      blob(g, -4, -50, 9, L[0], L[1]);
    },
    alien(g, th, vi) {
      D.shadow(g, 0, 0, 14, 6, 0.3);
      g.lineCap = 'round';
      g.strokeStyle = '#5d4a8a';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(-8 + vi * 3, -20, 2, -36);
      g.stroke();
      g.strokeStyle = '#8a74c0';
      g.lineWidth = 2;
      g.stroke();
      const L = th.leaf;
      g.beginPath();
      g.ellipse(2, -38, 18, 10, 0, Math.PI, 0);
      g.closePath();
      const gr = g.createLinearGradient(-16, -48, 18, -30);
      gr.addColorStop(0, L[0]);
      gr.addColorStop(1, L[1]);
      g.fillStyle = gr;
      g.fill();
      D.ellipse(g, 2, -38, 18, 3.5, D.shade(L[1], -0.3));
      g.shadowColor = '#ffffff';
      g.shadowBlur = 6;
      [[-7, -42], [4, -45], [12, -40]].forEach((p) => D.circle(g, p[0], p[1], 2, '#eaffef'));
      g.shadowBlur = 0;
    },
  };

  function rockShape(g, x, y, s, c0, c1, k) {
    const pts = [[x - 12 * s, y + 2 * s], [x - 10 * s, y - 8 * s - k], [x - 3 * s, y - 14 * s], [x + 7 * s, y - 12 * s + k], [x + 12 * s, y - 3 * s], [x + 9 * s, y + 4 * s], [x - 2 * s, y + 6 * s]];
    D.poly(g, pts, c1);
    D.poly(g, [pts[1], pts[2], pts[3], [x + 3 * s, y - 4 * s], [x - 6 * s, y - 3 * s]], c0);
    D.poly(g, [pts[3], pts[4], pts[5], [x + 3 * s, y - 4 * s]], D.shade(c1, -0.12));
    D.poly(g, [[x - 6 * s, y - 10 * s], [x - 2 * s, y - 12.5 * s], [x - 3 * s, y - 8 * s]], 'rgba(255,255,255,0.45)');
  }

  function treeSprite(themeId, th, vi) {
    return D.sprite('tree|' + themeId + '|' + vi, 84, 92, 42, 80, (g) => (TREES[th.tree] || TREES.oak)(g, th, vi));
  }
  function rockSprite(themeId, th, vi) {
    return D.sprite('rock|' + themeId + '|' + vi, 60, 46, 30, 32, (g) => {
      D.shadow(g, 0, 2, 17, 7, 0.22);
      rockShape(g, 2, 0, 1.15 + vi * 0.08, th.rockCol[0], th.rockCol[1], vi * 2);
      if (vi !== 1) rockShape(g, -12, 5, 0.55, th.rockCol[0], th.rockCol[1], 0);
      if (th.decor === 'snow') D.poly(g, [[-9, -9], [-3, -16], [8, -14], [4, -10]], '#ffffff');
    });
  }
  function crystalSprite(themeId, th) {
    return D.sprite('crystal|' + themeId, 50, 60, 25, 48, (g) => {
      D.shadow(g, 0, 2, 13, 5, 0.25);
      rockShape(g, 0, 4, 0.7, th.rockCol[0], th.rockCol[1], 0);
      const c = th.crystal;
      D.shard(g, -8, -1, 8, 17, c[0], c[1]);
      D.shard(g, 8, 0, 8, 21, c[0], c[1]);
      D.shard(g, 0, 2, 11, 32, D.shade(c[0], 0.2), c[1]);
    });
  }
  function depletedSprite(type, themeId, th) {
    return D.sprite('dep|' + type + '|' + themeId, 50, 30, 25, 18, (g) => {
      if (type === 'tree') {
        D.shadow(g, 0, 1, 10, 4, 0.18);
        D.cylinder(g, 6, 0, 5, '#a5652f', '#6e3d1a', '#e2b07a');
        g.strokeStyle = 'rgba(120,70,30,0.6)';
        g.lineWidth = 0.8;
        g.beginPath();
        g.ellipse(0, -5, 3, 1.5, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (type === 'rock') {
        rockShape(g, -5, 2, 0.35, th.rockCol[0], th.rockCol[1], 0);
        rockShape(g, 6, 4, 0.3, th.rockCol[0], th.rockCol[1], 0);
      } else {
        rockShape(g, 0, 4, 0.55, th.rockCol[0], th.rockCol[1], 0);
        D.ellipse(g, 0, -1, 4, 2, 'rgba(0,0,0,0.35)');
        D.shard(g, 5, 4, 3, 5, th.crystal[0], th.crystal[1]);
      }
    });
  }

  /** Draw a node at world position (x, y) = tile centre. */
  function draw(ctx, node, x, y, themeId, th, t, avail, pop) {
    if (!avail) {
      D.drawSprite(ctx, depletedSprite(node.type, themeId, th), x, y);
      return;
    }
    const vi = Math.floor(node.v * 3) % 3;
    ctx.save();
    ctx.translate(x, y);
    if (pop < 1) {
      const s = Math.max(0.01, D.easeOutBack(pop));
      ctx.scale(s, s);
    }
    if (node.type === 'tree') {
      const sk = Math.sin(t * 1.4 + node.v * 10) * 0.035;
      ctx.transform(1, 0, sk, 1, 0, 0);
      D.drawSprite(ctx, treeSprite(themeId, th, vi), 0, 0);
    } else if (node.type === 'rock') {
      D.drawSprite(ctx, rockSprite(themeId, th, vi), 0, 0);
    } else {
      const bob = Math.sin(t * 2.2 + node.v * 10) * 2.5;
      ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 3 + node.v * 7);
      D.drawSprite(ctx, D.glow(th.crystal[1], 30), 0, -14);
      ctx.globalAlpha = 1;
      ctx.translate(0, bob - 2);
      D.drawSprite(ctx, crystalSprite(themeId, th), 0, 0);
      // sparkle
      const sp = (t * 0.7 + node.v * 5) % 3;
      if (sp < 0.4) {
        const a = Math.sin((sp / 0.4) * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
        ctx.save();
        ctx.translate(4, -28);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-0.8, -5 * a, 1.6, 10 * a);
        ctx.fillRect(-5 * a, -0.8, 10 * a, 1.6);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  BI.Resources = { TYPES, draw };
})();
