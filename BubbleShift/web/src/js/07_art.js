/* ==========================================================================
   07_art.js — procedural art. Everything visible in the game is drawn here
   with canvas paths and gradients (no image files), then cached as sprites.
   Every draw function takes a centre point and a size and restores state.
   ========================================================================== */
'use strict';

const Art = (() => {
  const TAU = Math.PI * 2;
  const cache = new Map();
  let dpr = 1;
  function setDpr(v) { if (v !== dpr) { dpr = v; cache.clear(); } }

  // ---------------------------------------------------------------- colour utils
  function hex(h) {
    if (h[0] !== '#') { const m = h.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]]; }
    const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = (a, al) => (al == null ? `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})` : `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`);
  function mix(h1, h2, k) { const a = hex(h1), b = hex(h2); return rgb([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]); }
  const shade = (h, amt) => (amt >= 0 ? mix(h, '#ffffff', amt) : mix(h, '#000000', -amt));
  const alpha = (h, a) => rgb(hex(h), a);
  const hsl = (h, s, l, a) => (a == null ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`);

  function sprite(key, w, h, draw) {
    let c = cache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    draw(g, w, h);
    c.w = w; c.h = h;
    cache.set(key, c);
    if (cache.size > 900) cache.delete(cache.keys().next().value);
    return c;
  }
  function blit(ctx, spr, x, y, scale) { const s = scale == null ? 1 : scale; ctx.drawImage(spr, x - (spr.w * s) / 2, y - (spr.h * s) / 2, spr.w * s, spr.h * s); }
  function rr(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function star(g, x, y, R, r, n) {
    g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, rad = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    g.closePath();
  }
  function heart(g, x, y, s) {
    g.beginPath(); g.moveTo(x, y + s * 0.35);
    g.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
    g.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    g.closePath();
  }
  function alphaAny(c, a) { if (c[0] === '#') return alpha(c, a); const m = c.match(/[\d.]+/g); return `rgba(${m[0]},${m[1]},${m[2]},${a})`; }

  // ---------------------------------------------------------------- glossy sphere
  // The core "premium" look: body gradient, rim shade, bounced light,
  // soft specular + sharp glint.
  function sphere(g, x, y, r, base, light, dark, opt) {
    opt = opt || {};
    g.save();
    if (opt.shadow !== false) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x, y + r * 0.9, r * 0.78, r * 0.2, 0, 0, TAU); g.fill(); }
    const body = g.createRadialGradient(x - r * 0.32, y - r * 0.38, r * 0.05, x, y, r * 1.02);
    body.addColorStop(0, light); body.addColorStop(0.42, base); body.addColorStop(1, dark);
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    const rim = g.createRadialGradient(x, y, r * 0.72, x, y, r);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,20,0.28)');
    g.fillStyle = rim; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    const bl = g.createRadialGradient(x + r * 0.15, y + r * 0.72, 0, x + r * 0.15, y + r * 0.72, r * 0.62);
    bl.addColorStop(0, alphaAny(light, 0.55)); bl.addColorStop(1, alphaAny(light, 0));
    g.fillStyle = bl; g.beginPath(); g.arc(x, y, r * 0.98, 0, TAU); g.fill();
    const sp = g.createRadialGradient(x - r * 0.34, y - r * 0.42, 0, x - r * 0.34, y - r * 0.42, r * 0.55);
    sp.addColorStop(0, 'rgba(255,255,255,0.85)'); sp.addColorStop(0.45, 'rgba(255,255,255,0.28)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.38, r * 0.5, r * 0.36, -0.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.48, r * 0.16, r * 0.1, -0.7, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(x + r * 0.42, y + r * 0.38, r * 0.06, 0, TAU); g.fill();
    g.restore();
  }
  // Colour-blind glyphs.
  function glyph(g, x, y, s, sym) {
    g.save(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = s * 0.08;
    switch (sym) {
      case 'heart': heart(g, x, y + s * 0.15, s * 0.62); break;
      case 'drop': g.beginPath(); g.moveTo(x, y - s * 0.6); g.bezierCurveTo(x + s * 0.55, y, x + s * 0.45, y + s * 0.55, x, y + s * 0.55); g.bezierCurveTo(x - s * 0.45, y + s * 0.55, x - s * 0.55, y, x, y - s * 0.6); break;
      case 'leaf': g.beginPath(); g.moveTo(x, y - s * 0.6); g.quadraticCurveTo(x + s * 0.65, y, x, y + s * 0.6); g.quadraticCurveTo(x - s * 0.65, y, x, y - s * 0.6); break;
      case 'star': star(g, x, y + s * 0.04, s * 0.62, s * 0.27, 5); break;
      case 'moon': g.beginPath(); g.arc(x, y, s * 0.55, 0.9, TAU - 0.9 + 0.001); g.arc(x + s * 0.3, y - s * 0.05, s * 0.42, TAU - 1.3, 1.3, true); g.closePath(); break;
      case 'diamond': g.beginPath(); g.moveTo(x, y - s * 0.6); g.lineTo(x + s * 0.5, y); g.lineTo(x, y + s * 0.6); g.lineTo(x - s * 0.5, y); g.closePath(); break;
    }
    g.fill(); g.stroke(); g.restore();
  }
  function bubbleSprite(r, ci, sym) {
    const C = DATA.COLORS[ci] || DATA.COLORS[0];
    return sprite('b' + ci + '_' + r.toFixed(1) + (sym ? 's' : ''), r * 2.3, r * 2.3, (g, w, h) => {
      sphere(g, w / 2, h / 2, r, C.base, C.light, C.dark);
      if (sym) glyph(g, w / 2, h / 2 + r * 0.05, r * 0.72, C.sym);
    });
  }

  // ---------------------------------------------------------------- cells
  function drawCell(ctx, x, y, r, cell, tt, sym) {
    switch (cell.t) {
      case 'n': blit(ctx, bubbleSprite(r, cell.c, sym), x, y); break;
      case 'w': blit(ctx, rainbowSprite(r), x, y); break;
      case 's': blit(ctx, stoneSprite(r, cell.hp), x, y); break;
      case 'i': blit(ctx, bubbleSprite(r, cell.c, sym), x, y); blit(ctx, iceSprite(r), x, y); break;
      case 'ch': blit(ctx, bubbleSprite(r, cell.c, sym), x, y); blit(ctx, chainSprite(r, cell.hp), x, y); break;
      case 'l': blit(ctx, bubbleSprite(r, cell.c, sym), x, y); blit(ctx, lockSprite(r), x, y); break;
      case 'b': blit(ctx, bombSprite(r), x, y); drawSpark(ctx, x + r * 0.55, y - r * 0.78, r * 0.25, tt); break;
      case 'k': blit(ctx, keySprite(r), x, y + Math.sin(tt * 3) * r * 0.05); break;
      case 'rot': drawRotator(ctx, x, y, r, tt, cell.hp); break;
      case 'd': drawDark(ctx, x, y, r, tt); break;
      case 'm': drawCritterBubble(ctx, x, y, r, cell.cr, tt); break;
      case 'f': drawButterflyBubble(ctx, x, y, r, tt); break;
      case 'st': blit(ctx, glassSprite(r), x, y); blit(ctx, starSprite(r * 0.62), x, y + Math.sin(tt * 2.2 + x) * r * 0.06); break;
      case 'x': blit(ctx, crystalSprite(r), x, y); drawTwinkle(ctx, x + r * 0.3, y - r * 0.35, r * 0.28, tt + x); break;
    }
  }
  function rainbowSprite(r) {
    return sprite('rb' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
      for (let i = 0; i < 12; i++) { g.fillStyle = DATA.COLORS[i % 6].base; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, (i / 12) * TAU - 0.5, ((i + 1) / 12) * TAU - 0.48); g.fill(); }
      const wh = g.createRadialGradient(x, y, 0, x, y, r); wh.addColorStop(0, 'rgba(255,255,255,0.95)'); wh.addColorStop(0.35, 'rgba(255,255,255,0.25)'); wh.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = wh; g.fillRect(0, 0, w, h);
      g.restore();
      sphere(g, x, y, r, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(40,0,80,0.25)', { shadow: false });
      star(g, x, y, r * 0.42, r * 0.18, 5); g.fillStyle = '#fff'; g.fill();
    });
  }
  function stoneSprite(r, hp) {
    return sprite('st' + r.toFixed(1) + '_' + hp, r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      sphere(g, x, y, r, '#8d97a8', '#d9dfe8', '#4a5262');
      g.save(); g.beginPath(); g.arc(x, y, r * 0.98, 0, TAU); g.clip();
      g.fillStyle = 'rgba(60,66,80,0.35)';
      for (const [dx, dy, s] of [[-0.35, 0.25, 0.22], [0.3, -0.1, 0.17], [0.1, 0.45, 0.14], [-0.1, -0.5, 0.1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, s * r, 0, TAU); g.fill(); }
      if (hp <= 1) {
        g.strokeStyle = '#2e3440'; g.lineWidth = r * 0.09; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(x - r * 0.1, y - r); g.lineTo(x + r * 0.05, y - r * 0.35); g.lineTo(x - r * 0.25, y + r * 0.05); g.lineTo(x + r * 0.15, y + r * 0.5); g.lineTo(x, y + r);
        g.moveTo(x + r * 0.05, y - r * 0.35); g.lineTo(x + r * 0.6, y - r * 0.2); g.stroke();
      }
      g.restore();
    });
  }
  function iceSprite(r) {
    return sprite('ice' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2, s = r * 1.02;
      g.beginPath();
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * TAU) / 6; g.lineTo(x + Math.cos(a) * s * 1.08, y + Math.sin(a) * s * 1.08); }
      g.closePath();
      const ig = g.createLinearGradient(x - s, y - s, x + s, y + s);
      ig.addColorStop(0, 'rgba(235,250,255,0.78)'); ig.addColorStop(0.5, 'rgba(150,215,255,0.45)'); ig.addColorStop(1, 'rgba(190,235,255,0.72)');
      g.fillStyle = ig; g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = r * 0.1; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = r * 0.07;
      g.beginPath(); g.moveTo(x - s * 0.55, y - s * 0.2); g.lineTo(x - s * 0.15, y - s * 0.6); g.moveTo(x - s * 0.45, y + s * 0.15); g.lineTo(x + s * 0.2, y - s * 0.5); g.stroke();
    });
  }
  function chainSprite(r, hp) {
    return sprite('ch' + r.toFixed(1) + '_' + hp, r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      const link = (cx0, cy0, ang) => {
        g.save(); g.translate(cx0, cy0); g.rotate(ang);
        g.strokeStyle = '#4b4f5c'; g.lineWidth = r * 0.24; rr(g, -r * 0.24, -r * 0.14, r * 0.48, r * 0.28, r * 0.14); g.stroke();
        g.strokeStyle = '#c9ced9'; g.lineWidth = r * 0.12; rr(g, -r * 0.24, -r * 0.14, r * 0.48, r * 0.28, r * 0.14); g.stroke();
        g.restore();
      };
      for (let i = -2; i <= 2; i++) link(x + i * r * 0.4, y + i * r * 0.4, Math.PI / 4 + (i % 2 ? Math.PI / 2 : 0));
      if (hp >= 2) for (let i = -2; i <= 2; i++) { if (i) link(x + i * r * 0.4, y - i * r * 0.4, -Math.PI / 4 + (i % 2 ? Math.PI / 2 : 0)); }
      g.fillStyle = '#ffcc33'; g.strokeStyle = '#8a5a00'; g.lineWidth = r * 0.06;
      rr(g, x - r * 0.26, y - r * 0.12, r * 0.52, r * 0.42, r * 0.08); g.fill(); g.stroke();
      g.lineWidth = r * 0.09; g.beginPath(); g.arc(x, y - r * 0.12, r * 0.16, Math.PI, 0); g.stroke();
    });
  }
  function lockSprite(r) {
    return sprite('lk' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      g.fillStyle = 'rgba(40,30,80,0.45)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = '#6b4a00'; g.lineWidth = r * 0.16; g.beginPath(); g.arc(x, y - r * 0.1, r * 0.3, Math.PI, 0); g.stroke();
      const lg = g.createLinearGradient(x, y - r * 0.2, x, y + r * 0.6); lg.addColorStop(0, '#ffe27a'); lg.addColorStop(1, '#e09a10');
      g.fillStyle = lg; g.strokeStyle = '#7a4d00'; g.lineWidth = r * 0.06;
      rr(g, x - r * 0.42, y - r * 0.12, r * 0.84, r * 0.66, r * 0.12); g.fill(); g.stroke();
      g.fillStyle = '#7a4d00'; g.beginPath(); g.arc(x, y + r * 0.14, r * 0.1, 0, TAU); g.fill(); g.fillRect(x - r * 0.04, y + r * 0.14, r * 0.08, r * 0.2);
    });
  }
  function keySprite(r) {
    return sprite('key' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      glassBubble(g, x, y, r, '#fff3b0');
      g.save(); g.translate(x, y); g.rotate(-0.6);
      const kg = g.createLinearGradient(0, -r * 0.5, 0, r * 0.5); kg.addColorStop(0, '#fff09a'); kg.addColorStop(1, '#e8a412');
      g.fillStyle = kg; g.strokeStyle = '#7a4d00'; g.lineWidth = r * 0.06;
      g.beginPath(); g.arc(-r * 0.3, 0, r * 0.28, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#7a4d00'; g.beginPath(); g.arc(-r * 0.3, 0, r * 0.1, 0, TAU); g.fill();
      g.fillStyle = kg; rr(g, -r * 0.05, -r * 0.08, r * 0.65, r * 0.16, r * 0.05); g.fill(); g.stroke();
      g.fillRect(r * 0.35, 0, r * 0.1, r * 0.2); g.fillRect(r * 0.5, 0, r * 0.1, r * 0.15);
      g.restore();
    });
  }
  function bombSprite(r) {
    return sprite('bm' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => {
      const x = w / 2, y = h / 2;
      sphere(g, x, y + r * 0.05, r * 0.92, '#2c2f45', '#6b7299', '#0d0f1c');
      g.fillStyle = '#b08a4a'; g.strokeStyle = '#5a3f14'; g.lineWidth = r * 0.05;
      rr(g, x + r * 0.18, y - r * 0.95, r * 0.4, r * 0.28, r * 0.06); g.fill(); g.stroke();
      g.strokeStyle = '#d9b77a'; g.lineWidth = r * 0.1; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + r * 0.38, y - r * 0.95); g.quadraticCurveTo(x + r * 0.5, y - r * 1.15, x + r * 0.55, y - r * 0.8); g.stroke();
      g.fillStyle = '#ff4d5e'; star(g, x - r * 0.05, y + r * 0.12, r * 0.3, r * 0.14, 5); g.fill();
    });
  }
  function glassBubble(g, x, y, r, tint) {
    g.save();
    const gg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    gg.addColorStop(0, 'rgba(255,255,255,0.55)'); gg.addColorStop(0.7, alpha(tint || '#bfe8ff', 0.28)); gg.addColorStop(1, alpha(tint || '#7fc8ff', 0.55));
    g.fillStyle = gg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = r * 0.07; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.45, r * 0.18, r * 0.1, -0.7, 0, TAU); g.fill();
    g.restore();
  }
  function glassSprite(r) { return sprite('gl' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => glassBubble(g, w / 2, h / 2, r, '#fff3b0')); }
  function starSprite(r) { return sprite('star' + r.toFixed(1), r * 2.6, r * 2.6, (g, w, h) => drawStarShape(g, w / 2, h / 2, r)); }
  function drawStarShape(g, x, y, r) {
    g.save();
    g.shadowColor = 'rgba(255,190,0,0.8)'; g.shadowBlur = r * 0.5;
    star(g, x, y + r * 0.05, r, r * 0.5, 5);
    const sg = g.createLinearGradient(x, y - r, x, y + r); sg.addColorStop(0, '#fff6a8'); sg.addColorStop(0.5, '#ffcf1f'); sg.addColorStop(1, '#f08a00');
    g.fillStyle = sg; g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#b35f00'; g.lineWidth = r * 0.1; g.lineJoin = 'round'; g.stroke();
    star(g, x - r * 0.08, y - r * 0.08, r * 0.45, r * 0.22, 5); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
    g.restore();
  }
  function crystalSprite(r) {
    return sprite('cr' + r.toFixed(1), r * 2.4, r * 2.4, (g, w, h) => {
      const x = w / 2, y = h / 2;
      const shard = (dx, s, c1, c2, lean) => {
        g.save(); g.translate(x + dx * r, y + r * 0.7); g.rotate(lean);
        g.beginPath(); g.moveTo(0, -s * r * 1.5); g.lineTo(s * r * 0.4, -s * r * 0.9); g.lineTo(s * r * 0.35, 0); g.lineTo(-s * r * 0.35, 0); g.lineTo(-s * r * 0.4, -s * r * 0.9); g.closePath();
        const cg = g.createLinearGradient(-s * r * 0.4, 0, s * r * 0.4, 0); cg.addColorStop(0, c1); cg.addColorStop(0.5, '#ffffff'); cg.addColorStop(0.55, c1); cg.addColorStop(1, c2);
        g.fillStyle = cg; g.fill(); g.strokeStyle = 'rgba(40,20,90,0.5)'; g.lineWidth = r * 0.05; g.stroke();
        g.restore();
      };
      g.save(); g.shadowColor = '#c38bff'; g.shadowBlur = r * 0.6;
      shard(-0.42, 0.7, '#b77dff', '#6a2ed1', -0.3); shard(0.45, 0.65, '#ff8fe3', '#b3207f', 0.32); shard(0, 1, '#9fd2ff', '#3a63d9', 0);
      g.restore();
    });
  }
  function drawSpark(ctx, x, y, s, tt) {
    const f = 0.7 + Math.sin(tt * 20) * 0.3;
    ctx.save(); ctx.fillStyle = '#ffd24a'; ctx.globalAlpha = 0.9; star(ctx, x, y, s * f, s * 0.35 * f, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s * 0.25, 0, TAU); ctx.fill(); ctx.restore();
  }
  function drawTwinkle(ctx, x, y, s, tt) {
    const f = Math.max(0, Math.sin(tt * 2.5)); if (f < 0.05) return;
    ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = '#fff'; star(ctx, x, y, s * f, s * 0.2 * f, 4); ctx.fill(); ctx.restore();
  }
  function drawRotator(ctx, x, y, r, tt, hp) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 0.8);
    ctx.beginPath();
    for (let i = 0; i < 20; i++) { const a = (i * Math.PI) / 10, rad = i % 2 ? r * 0.78 : r * 0.98; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    ctx.closePath();
    const gg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    gg.addColorStop(0, '#fff2a8'); gg.addColorStop(0.5, '#f0b429'); gg.addColorStop(1, '#a8660a');
    ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = '#6e3f00'; ctx.lineWidth = r * 0.06; ctx.stroke();
    ctx.fillStyle = '#3b2a7a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.26, -2.4, 1.0); ctx.stroke();
    const ax = x + Math.cos(1.0) * r * 0.26, ay = y + Math.sin(1.0) * r * 0.26;
    ctx.fillStyle = '#9ad8ff'; ctx.beginPath(); ctx.moveTo(ax + r * 0.14, ay - r * 0.02); ctx.lineTo(ax - r * 0.12, ay + r * 0.12); ctx.lineTo(ax - r * 0.02, ay - r * 0.16); ctx.fill();
    for (let i = 0; i < (hp || 0); i++) { ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(x - r * 0.3 + i * r * 0.3, y + r * 0.62, r * 0.09, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function drawDark(ctx, x, y, r, tt) {
    blit(ctx, sprite('dk' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => sphere(g, w / 2, h / 2, r, '#3d2266', '#8b5cc7', '#12061f')), x, y);
    ctx.save();
    ctx.globalAlpha = 0.55; ctx.strokeStyle = '#b98bff'; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = tt * 1.5 + i * 0.5, rad = r * (0.15 + i * 0.03); ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } ctx.stroke();
    ctx.globalAlpha = 1;
    const blink = Math.sin(tt * 1.3 + x) > 0.97 ? 0.15 : 1;
    ctx.fillStyle = '#ffe36a';
    ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.05, r * 0.14, r * 0.1 * blink, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.3, y - r * 0.05, r * 0.14, r * 0.1 * blink, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function critterLook(id) {
    const c = DATA.CREATURES.find((z) => z.id === id);
    if (c) return c.look;
    return { milo: ['#ff8a3d', '#fff1dc', 'cat', 'none', 'scarf'], bruno: ['#a0643a', '#f3d7b5', 'round', 'none', 'hat'] }[id] || ['#ffb347', '#fff1d6', 'cat', 'none', 'none'];
  }
  function drawCritterBubble(ctx, x, y, r, crId, tt) {
    const bob = Math.sin(tt * 2.4 + x * 0.1) * r * 0.05;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.clip();
    critter(ctx, x, y + r * 0.12 + bob, r * 1.35, critterLook(crId), { blink: Math.sin(tt * 1.7 + x) > 0.96 });
    ctx.restore();
    blit(ctx, sprite('cbg' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => glassBubble(g, w / 2, h / 2, r, '#bfe8ff')), x, y);
  }
  function drawButterflyBubble(ctx, x, y, r, tt) {
    blit(ctx, sprite('bfb' + r.toFixed(1), r * 2.3, r * 2.3, (g, w, h) => glassBubble(g, w / 2, h / 2, r, '#ffd1f2')), x, y);
    butterfly(ctx, x, y + Math.sin(tt * 2 + x) * r * 0.06, r * 0.75, tt, '#ff7ad9', '#7f5cff');
  }
  function butterfly(ctx, x, y, s, tt, c1, c2) {
    const flap = 0.55 + Math.abs(Math.sin(tt * 9)) * 0.45;
    ctx.save(); ctx.translate(x, y);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * flap, 1);
      const wg = ctx.createLinearGradient(0, -s, s, s); wg.addColorStop(0, c1); wg.addColorStop(1, c2);
      ctx.fillStyle = wg; ctx.strokeStyle = 'rgba(60,20,80,0.6)'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.ellipse(s * 0.42, -s * 0.28, s * 0.42, s * 0.34, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 0.32, s * 0.3, s * 0.3, s * 0.24, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(s * 0.45, -s * 0.3, s * 0.1, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#3a2350'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.08, s * 0.4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- faces
  function eye(g, x, y, r, opt) {
    opt = opt || {};
    if (opt.blink) { g.strokeStyle = '#2a1b3d'; g.lineWidth = r * 0.3; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * 0.7, 0.2, Math.PI - 0.2); g.stroke(); return; }
    if (opt.happy) { g.strokeStyle = '#2a1b3d'; g.lineWidth = r * 0.32; g.lineCap = 'round'; g.beginPath(); g.arc(x, y + r * 0.35, r * 0.75, Math.PI + 0.3, TAU - 0.3); g.stroke(); return; }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, r * 0.92, r, 0, 0, TAU); g.fill();
    const lx = (opt.lx || 0) * r * 0.2, ly = (opt.ly || 0) * r * 0.2;
    const ig = g.createRadialGradient(x + lx, y + ly + r * 0.1, 0, x + lx, y + ly, r * 0.75);
    ig.addColorStop(0, opt.iris || '#5a3a8a'); ig.addColorStop(1, '#1d1030');
    g.fillStyle = ig; g.beginPath(); g.ellipse(x + lx, y + ly + r * 0.08, r * 0.7, r * 0.8, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx - r * 0.25, y + ly - r * 0.25, r * 0.28, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + lx + r * 0.22, y + ly + r * 0.25, r * 0.12, 0, TAU); g.fill();
  }
  function face(g, x, y, s, opt) {
    opt = opt || {};
    const er = s * 0.16, ex = s * 0.3;
    if (opt.angry) {
      g.strokeStyle = '#2a1b3d'; g.lineWidth = s * 0.06; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - ex - er, y - er * 1.5); g.lineTo(x - ex + er, y - er * 0.9); g.moveTo(x + ex + er, y - er * 1.5); g.lineTo(x + ex - er, y - er * 0.9); g.stroke();
    }
    if (opt.sad) {
      g.strokeStyle = '#2a1b3d'; g.lineWidth = s * 0.05; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - ex - er, y - er * 1.0); g.lineTo(x - ex + er, y - er * 1.5); g.moveTo(x + ex + er, y - er * 1.0); g.lineTo(x + ex - er, y - er * 1.5); g.stroke();
    }
    eye(g, x - ex, y, er, opt); eye(g, x + ex, y, er, opt);
    g.fillStyle = 'rgba(255,110,140,0.45)';
    g.beginPath(); g.ellipse(x - ex * 1.35, y + er * 1.4, er * 0.8, er * 0.45, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + ex * 1.35, y + er * 1.4, er * 0.8, er * 0.45, 0, 0, TAU); g.fill();
    g.strokeStyle = '#2a1b3d'; g.lineWidth = s * 0.045; g.lineCap = 'round';
    if (opt.sad) { g.beginPath(); g.arc(x, y + er * 2.3, er * 0.6, Math.PI + 0.4, TAU - 0.4); g.stroke(); }
    else if (opt.open) { g.fillStyle = '#7a2440'; g.beginPath(); g.ellipse(x, y + er * 1.5, er * 0.55, er * 0.5, 0, 0, TAU); g.fill(); g.fillStyle = '#ff7a95'; g.beginPath(); g.ellipse(x, y + er * 1.75, er * 0.35, er * 0.22, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.arc(x, y + er * 1.1, er * 0.55, 0.35, Math.PI - 0.35); g.stroke(); }
  }

  // ---------------------------------------------------------------- creatures
  function critter(g, x, y, s, look, opt) {
    opt = opt || {};
    const [body, belly, ear, pattern, acc] = look;
    g.save(); g.translate(x, y);
    const w = s * 0.5, h = s * 0.44;
    g.fillStyle = shade(body, -0.12); g.strokeStyle = shade(body, -0.45); g.lineWidth = s * 0.025;
    if (ear === 'cat') { for (const d of [-1, 1]) { g.fillStyle = shade(body, -0.12); g.beginPath(); g.moveTo(d * w * 0.3, -h * 0.75); g.lineTo(d * w * 0.8, -h * 1.25); g.lineTo(d * w * 0.9, -h * 0.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffb3c7'; g.beginPath(); g.moveTo(d * w * 0.45, -h * 0.7); g.lineTo(d * w * 0.76, -h * 1.05); g.lineTo(d * w * 0.8, -h * 0.55); g.fill(); } }
    if (ear === 'bunny') for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * w * 0.4, -h * 1.15, w * 0.18, h * 0.55, d * 0.2, 0, TAU); g.fill(); g.stroke(); }
    if (ear === 'round') for (const d of [-1, 1]) { g.beginPath(); g.arc(d * w * 0.7, -h * 0.75, w * 0.25, 0, TAU); g.fill(); g.stroke(); }
    if (ear === 'antenna') { g.lineWidth = s * 0.03; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * w * 0.25, -h * 0.8); g.quadraticCurveTo(d * w * 0.4, -h * 1.3, d * w * 0.6, -h * 1.3); g.stroke(); g.fillStyle = '#ffe36a'; g.beginPath(); g.arc(d * w * 0.62, -h * 1.3, s * 0.05, 0, TAU); g.fill(); } }
    if (ear === 'fin') for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * w * 1.0, h * 0.05, w * 0.25, h * 0.35, d * 0.6, 0, TAU); g.fill(); g.stroke(); }
    const bg = g.createRadialGradient(-w * 0.35, -h * 0.45, s * 0.05, 0, 0, s * 0.6);
    bg.addColorStop(0, shade(body, 0.35)); bg.addColorStop(0.6, body); bg.addColorStop(1, shade(body, -0.3));
    g.fillStyle = bg; g.strokeStyle = shade(body, -0.5); g.lineWidth = s * 0.03;
    g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = belly; g.beginPath(); g.ellipse(0, h * 0.38, w * 0.55, h * 0.45, 0, 0, TAU); g.fill();
    if (pattern === 'spots') { g.fillStyle = shade(body, -0.2); for (const [a, b, c] of [[-0.6, -0.3, 0.12], [0.55, -0.45, 0.1], [0.72, 0.1, 0.08]]) { g.beginPath(); g.arc(a * w, b * h, c * s, 0, TAU); g.fill(); } }
    if (pattern === 'stripes') { g.strokeStyle = shade(body, -0.25); g.lineWidth = s * 0.05; for (const a of [-0.3, 0, 0.3]) { g.beginPath(); g.moveTo(a * w, -h * 0.98); g.lineTo(a * w * 1.1, -h * 0.65); g.stroke(); } }
    if (ear === 'leaf') { g.fillStyle = '#4fcf6a'; g.strokeStyle = '#1f7a36'; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(0, -h * 0.9); g.quadraticCurveTo(w * 0.6, -h * 1.5, w * 0.1, -h * 1.5); g.quadraticCurveTo(-w * 0.1, -h * 1.2, 0, -h * 0.9); g.fill(); g.stroke(); }
    face(g, 0, -h * 0.05, s * 0.62, { blink: opt.blink, happy: opt.happy, open: opt.open, sad: opt.sad });
    if (acc === 'leaf') { g.fillStyle = '#5ad06f'; g.beginPath(); g.ellipse(w * 0.25, -h * 0.95, w * 0.22, h * 0.12, -0.6, 0, TAU); g.fill(); }
    if (acc === 'flower') { for (let i = 0; i < 5; i++) { const a = (i * TAU) / 5; g.fillStyle = '#ff8fc8'; g.beginPath(); g.arc(-w * 0.55 + Math.cos(a) * s * 0.06, -h * 0.8 + Math.sin(a) * s * 0.06, s * 0.05, 0, TAU); g.fill(); } g.fillStyle = '#ffe36a'; g.beginPath(); g.arc(-w * 0.55, -h * 0.8, s * 0.04, 0, TAU); g.fill(); }
    if (acc === 'bow') { g.fillStyle = '#ff4f8a'; g.beginPath(); g.moveTo(w * 0.45, -h * 0.8); g.lineTo(w * 0.2, -h * 1.0); g.lineTo(w * 0.2, -h * 0.6); g.closePath(); g.moveTo(w * 0.45, -h * 0.8); g.lineTo(w * 0.7, -h * 1.0); g.lineTo(w * 0.7, -h * 0.6); g.closePath(); g.fill(); }
    if (acc === 'hat') { g.fillStyle = '#5a3fb0'; g.strokeStyle = '#2a1860'; g.lineWidth = s * 0.02; g.beginPath(); g.ellipse(0, -h * 0.85, w * 0.55, h * 0.12, 0, 0, TAU); g.fill(); g.stroke(); rr(g, -w * 0.32, -h * 1.3, w * 0.64, h * 0.48, s * 0.04); g.fill(); g.stroke(); g.fillStyle = '#ffd23f'; g.fillRect(-w * 0.32, -h * 0.98, w * 0.64, h * 0.1); }
    if (acc === 'scarf') { g.fillStyle = '#3f8ae8'; g.strokeStyle = '#1f4f9a'; g.lineWidth = s * 0.02; g.beginPath(); g.ellipse(0, h * 0.78, w * 0.62, h * 0.13, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(w * 0.22, h * 0.78); g.lineTo(w * 0.48, h * 1.12); g.lineTo(w * 0.26, h * 1.12); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }

  // ---------------------------------------------------------------- characters
  function character(g, x, y, s, id, opt) {
    opt = opt || {};
    g.save(); g.translate(x, y);
    const tt = opt.t || 0, blink = opt.blink, mood = opt.mood || 'happy';
    const fopt = { blink, open: mood === 'talk' || mood === 'wow', sad: mood === 'sad', angry: mood === 'angry' };
    switch (id) {
      case 'lumi': {
        const gl = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.8); gl.addColorStop(0, 'rgba(255,245,150,0.6)'); gl.addColorStop(1, 'rgba(255,245,150,0)');
        g.fillStyle = gl; g.beginPath(); g.arc(0, 0, s * 0.8, 0, TAU); g.fill();
        const fl = 0.8 + Math.sin(tt * 14) * 0.2;
        for (const d of [-1, 1]) {
          g.save(); g.scale(d * fl, 1);
          const wg = g.createLinearGradient(0, -s * 0.4, s * 0.5, 0); wg.addColorStop(0, 'rgba(200,245,255,0.9)'); wg.addColorStop(1, 'rgba(150,200,255,0.4)');
          g.fillStyle = wg; g.strokeStyle = 'rgba(120,170,255,0.8)'; g.lineWidth = s * 0.015;
          g.beginPath(); g.ellipse(s * 0.34, -s * 0.18, s * 0.3, s * 0.17, -0.5, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.ellipse(s * 0.28, s * 0.05, s * 0.2, s * 0.11, 0.4, 0, TAU); g.fill(); g.stroke();
          g.restore();
        }
        const tg = g.createRadialGradient(0, s * 0.3, 0, 0, s * 0.3, s * 0.22); tg.addColorStop(0, '#fffbd0'); tg.addColorStop(0.5, '#e8ff5a'); tg.addColorStop(1, 'rgba(180,255,60,0)');
        g.fillStyle = tg; g.beginPath(); g.arc(0, s * 0.3, s * 0.24, 0, TAU); g.fill();
        const hg = g.createRadialGradient(-s * 0.1, -s * 0.12, s * 0.02, 0, 0, s * 0.3); hg.addColorStop(0, '#fff6d8'); hg.addColorStop(1, '#ffc97a');
        g.fillStyle = hg; g.strokeStyle = '#c47a2a'; g.lineWidth = s * 0.015; g.beginPath(); g.arc(0, 0, s * 0.27, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = '#7ad0ff'; g.beginPath(); g.ellipse(0, -s * 0.22, s * 0.22, s * 0.1, 0, Math.PI, TAU); g.fill();
        g.strokeStyle = '#3a4a8a'; g.lineWidth = s * 0.02; g.lineCap = 'round';
        for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * s * 0.08, -s * 0.26); g.quadraticCurveTo(d * s * 0.15, -s * 0.45, d * s * 0.24, -s * 0.46); g.stroke(); g.fillStyle = '#fff36a'; g.beginPath(); g.arc(d * s * 0.25, -s * 0.46, s * 0.045, 0, TAU); g.fill(); }
        face(g, 0, s * 0.02, s * 0.36, fopt);
        break;
      }
      case 'milo': critter(g, 0, s * 0.05, s * 0.9, ['#ff8a3d', '#fff1dc', 'cat', 'none', 'scarf'], { blink, open: fopt.open, sad: fopt.sad }); break;
      case 'nia': {
        g.fillStyle = '#7a4a2a';
        for (let i = 0; i < 11; i++) { const a = Math.PI + 0.1 + (i / 10) * (Math.PI - 0.2); g.beginPath(); g.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.28); g.lineTo(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.44); g.lineTo(Math.cos(a + 0.15) * s * 0.3, Math.sin(a + 0.15) * s * 0.28); g.fill(); }
        critter(g, 0, s * 0.06, s * 0.82, ['#c89a6a', '#fff0dc', 'round', 'none', 'none'], { blink, open: fopt.open, sad: fopt.sad });
        g.fillStyle = '#ffcc1a'; g.strokeStyle = '#a06b00'; g.lineWidth = s * 0.015;
        g.beginPath(); g.ellipse(0, -s * 0.2, s * 0.26, s * 0.14, 0, Math.PI, TAU); g.fill(); g.stroke();
        g.fillRect(-s * 0.3, -s * 0.21, s * 0.6, s * 0.04);
        break;
      }
      case 'bruno': {
        critter(g, 0, s * 0.05, s * 0.95, ['#a0643a', '#f3d7b5', 'round', 'none', 'none'], { blink, open: fopt.open, sad: fopt.sad });
        g.fillStyle = '#4a7ad8'; g.strokeStyle = '#1f3f8a'; g.lineWidth = s * 0.015;
        g.beginPath(); g.ellipse(0, -s * 0.2, s * 0.3, s * 0.16, 0, Math.PI, TAU); g.fill(); g.stroke();
        g.fillStyle = '#ff5a6e'; g.beginPath(); g.ellipse(0, -s * 0.38, s * 0.04, s * 0.08, 0, 0, TAU); g.fill();
        break;
      }
      case 'eli': {
        const bg = g.createRadialGradient(-s * 0.1, -s * 0.15, s * 0.05, 0, 0, s * 0.45); bg.addColorStop(0, '#b7a6ff'); bg.addColorStop(1, '#5a47b8');
        g.fillStyle = bg; g.strokeStyle = '#2d2170'; g.lineWidth = s * 0.015;
        g.beginPath(); g.ellipse(0, s * 0.05, s * 0.36, s * 0.4, 0, 0, TAU); g.fill(); g.stroke();
        for (const d of [-1, 1]) { g.fillStyle = '#5a47b8'; g.beginPath(); g.moveTo(d * s * 0.18, -s * 0.28); g.lineTo(d * s * 0.34, -s * 0.46); g.lineTo(d * s * 0.33, -s * 0.2); g.fill(); }
        g.fillStyle = '#efe8ff'; g.beginPath(); g.ellipse(0, s * 0.2, s * 0.22, s * 0.2, 0, 0, TAU); g.fill();
        for (const d of [-1, 1]) { g.fillStyle = '#fff4d6'; g.beginPath(); g.arc(d * s * 0.14, -s * 0.05, s * 0.13, 0, TAU); g.fill(); g.strokeStyle = '#c28a2a'; g.lineWidth = s * 0.02; g.stroke(); eye(g, d * s * 0.14, -s * 0.05, s * 0.08, { blink, iris: '#3a7ad8' }); }
        g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(-s * 0.04, s * 0.04); g.lineTo(s * 0.04, s * 0.04); g.lineTo(0, s * 0.12); g.fill();
        g.fillStyle = '#c9975a'; g.strokeStyle = '#6b4a20';
        g.beginPath(); g.ellipse(0, -s * 0.3, s * 0.34, s * 0.07, 0, 0, TAU); g.fill(); g.stroke();
        g.beginPath(); g.ellipse(0, -s * 0.34, s * 0.17, s * 0.1, 0, Math.PI, TAU); g.fill(); g.stroke();
        g.fillStyle = '#7a4a2a'; g.fillRect(-s * 0.17, -s * 0.35, s * 0.34, s * 0.03);
        break;
      }
      case 'murk': {
        const col = opt.redeemed ? ['#dff2ff', '#a9d7ff'] : ['#8e86b0', '#4a3f70'];
        for (const [dx, dy, r0] of [[-0.25, 0.05, 0.25], [0.25, 0.05, 0.25], [0, -0.1, 0.32], [-0.1, 0.15, 0.25], [0.12, 0.16, 0.25]]) {
          const cg = g.createRadialGradient(dx * s - r0 * s * 0.3, dy * s - r0 * s * 0.4, 0, dx * s, dy * s, r0 * s);
          cg.addColorStop(0, col[0]); cg.addColorStop(1, col[1]);
          g.fillStyle = cg; g.beginPath(); g.arc(dx * s, dy * s, r0 * s, 0, TAU); g.fill();
        }
        face(g, 0, 0, s * 0.45, { blink, angry: !opt.redeemed && mood !== 'sad', sad: mood === 'sad', open: fopt.open });
        if (!opt.redeemed) { g.strokeStyle = '#ffe36a'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(-s * 0.1, s * 0.35); g.lineTo(-s * 0.02, s * 0.46); g.lineTo(-s * 0.08, s * 0.5); g.lineTo(0, s * 0.62); g.stroke(); }
        break;
      }
    }
    g.restore();
  }

  // ---------------------------------------------------------------- boss
  function boss(g, x, y, s, hue, opt) {
    opt = opt || {};
    const tt = opt.t || 0;
    g.save(); g.translate(x, y);
    const sq = 1 + Math.sin(tt * 3) * 0.03 + (opt.hit || 0) * 0.08;
    g.scale(1 / sq, sq);
    if (opt.hit) g.rotate(Math.sin(tt * 60) * 0.04 * opt.hit);
    const light = hsl(hue, 80, 72), base = hsl(hue, 65, 52), dark = hsl(hue, 70, 24);
    for (let i = 0; i < 5; i++) { const a = Math.PI * 0.15 + (i / 4) * Math.PI * 0.7; g.fillStyle = dark; g.beginPath(); g.arc(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.3 + Math.sin(tt * 2.5 + i) * s * 0.03 + s * 0.05, s * 0.13, 0, TAU); g.fill(); }
    const bg = g.createRadialGradient(-s * 0.18, -s * 0.2, s * 0.05, 0, 0, s * 0.55);
    bg.addColorStop(0, light); bg.addColorStop(0.55, base); bg.addColorStop(1, dark);
    g.fillStyle = bg; g.strokeStyle = hsl(hue, 70, 16); g.lineWidth = s * 0.02;
    g.beginPath(); g.ellipse(0, 0, s * 0.52, s * 0.4, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = hsl(hue, 60, 40, 0.6);
    for (const [a, b, c] of [[-0.3, -0.18, 0.06], [0.33, -0.22, 0.05], [0.4, 0.05, 0.04]]) { g.beginPath(); g.arc(a * s, b * s, c * s, 0, TAU); g.fill(); }
    if (opt.final) {
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#a06b00'; g.lineWidth = s * 0.015;
      g.beginPath(); g.moveTo(-s * 0.2, -s * 0.33); g.lineTo(-s * 0.2, -s * 0.5); g.lineTo(-s * 0.1, -s * 0.4); g.lineTo(0, -s * 0.55); g.lineTo(s * 0.1, -s * 0.4); g.lineTo(s * 0.2, -s * 0.5); g.lineTo(s * 0.2, -s * 0.33); g.closePath(); g.fill(); g.stroke();
    } else for (const d of [-1, 1]) { g.fillStyle = '#fff3d6'; g.strokeStyle = '#8a6a3a'; g.lineWidth = s * 0.012; g.beginPath(); g.moveTo(d * s * 0.22, -s * 0.3); g.quadraticCurveTo(d * s * 0.38, -s * 0.5, d * s * 0.3, -s * 0.58); g.lineTo(d * s * 0.3, -s * 0.36); g.closePath(); g.fill(); g.stroke(); }
    for (const d of [-1, 1]) eye(g, d * s * 0.17, -s * 0.08, s * 0.09, { blink: opt.blink || opt.hit > 0.5, iris: '#c21f3a', ly: 0.3 });
    g.strokeStyle = hsl(hue, 70, 14); g.lineWidth = s * 0.03; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-s * 0.3, -s * 0.22); g.lineTo(-s * 0.08, -s * 0.15); g.moveTo(s * 0.3, -s * 0.22); g.lineTo(s * 0.08, -s * 0.15); g.stroke();
    const open = opt.attack ? 1 : 0.35 + Math.sin(tt * 2) * 0.1;
    g.fillStyle = '#4a0f24'; g.beginPath(); g.ellipse(0, s * 0.14, s * 0.22, s * 0.1 * open + s * 0.02, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * 0.07 - s * 0.03, s * 0.14 - s * 0.1 * open); g.lineTo(i * s * 0.07 + s * 0.03, s * 0.14 - s * 0.1 * open); g.lineTo(i * s * 0.07, s * 0.14 - s * 0.1 * open + s * 0.06); g.fill(); }
    g.restore();
  }

  // ---------------------------------------------------------------- scenery primitives
  function tree(g, x, y, s, col, kind) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(x, y, s * 0.35, s * 0.08, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a4a2a'; rr(g, x - s * 0.06, y - s * 0.5, s * 0.12, s * 0.5, s * 0.03); g.fill();
    if (kind === 'pine') {
      for (let i = 0; i < 3; i++) { const w = s * (0.42 - i * 0.1), yy = y - s * (0.35 + i * 0.28); g.fillStyle = shade(col, -0.15 + i * 0.08); g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - s * 0.45); g.lineTo(x + w, yy); g.closePath(); g.fill(); }
    } else {
      for (const [dx, dy, r0, sh] of [[-0.2, -0.62, 0.26, -0.1], [0.2, -0.62, 0.26, -0.05], [0, -0.85, 0.3, 0.05], [0, -0.6, 0.28, 0]]) {
        const gg = g.createRadialGradient(x + dx * s - r0 * s * 0.3, y + dy * s - r0 * s * 0.4, 0, x + dx * s, y + dy * s, r0 * s);
        gg.addColorStop(0, shade(col, 0.25 + sh)); gg.addColorStop(1, shade(col, -0.2 + sh));
        g.fillStyle = gg; g.beginPath(); g.arc(x + dx * s, y + dy * s, r0 * s, 0, TAU); g.fill();
      }
      if (kind === 'fruit') for (const [dx, dy] of [[-0.15, -0.7], [0.18, -0.8], [0.05, -0.55]]) { g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.04, 0, TAU); g.fill(); }
    }
    g.restore();
  }
  function flower(g, x, y, s, col) {
    g.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = (i * TAU) / 5; g.beginPath(); g.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.45, 0, TAU); g.fill(); }
    g.fillStyle = '#ffe36a'; g.beginPath(); g.arc(x, y, s * 0.35, 0, TAU); g.fill();
  }
  function cloudShape(g, x, y, s, col) {
    g.fillStyle = col;
    for (const [dx, dy, r0] of [[-0.35, 0.05, 0.25], [0, -0.1, 0.33], [0.35, 0.05, 0.25], [0.15, 0.1, 0.25], [-0.15, 0.12, 0.25]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r0 * s, 0, TAU); g.fill(); }
  }
  function castle(g, x, y, s, wall, roof) {
    g.save();
    const tower = (tx, tw, th) => {
      g.fillStyle = wall; g.fillRect(tx - tw / 2, y - th, tw, th);
      g.fillStyle = roof; g.beginPath(); g.moveTo(tx - tw * 0.65, y - th); g.lineTo(tx, y - th - tw * 1.3); g.lineTo(tx + tw * 0.65, y - th); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,40,80,0.35)'; rr(g, tx - tw * 0.15, y - th * 0.7, tw * 0.3, th * 0.18, tw * 0.15); g.fill();
    };
    g.fillStyle = wall; g.fillRect(x - s * 0.45, y - s * 0.4, s * 0.9, s * 0.4);
    for (let i = 0; i < 7; i++) g.fillRect(x - s * 0.45 + i * s * 0.14, y - s * 0.46, s * 0.07, s * 0.07);
    tower(x - s * 0.45, s * 0.16, s * 0.65); tower(x + s * 0.45, s * 0.16, s * 0.65); tower(x, s * 0.22, s * 0.9);
    tower(x - s * 0.2, s * 0.12, s * 0.55); tower(x + s * 0.22, s * 0.12, s * 0.6);
    g.fillStyle = 'rgba(40,30,60,0.4)'; g.beginPath(); g.arc(x, y - s * 0.05, s * 0.08, Math.PI, 0); g.fillRect(x - s * 0.08, y - s * 0.05, s * 0.16, s * 0.05); g.fill();
    g.restore();
  }
  function hills(g, W, y, amp, col1, col2, seed, H) {
    const rnd = U.rng(seed);
    const pts = [];
    let px = -20;
    while (px < W + 40) { pts.push([px, y - rnd() * amp]); px += W * (0.18 + rnd() * 0.18); }
    const gg = g.createLinearGradient(0, y - amp, 0, H);
    gg.addColorStop(0, col1); gg.addColorStop(1, col2);
    g.fillStyle = gg; g.beginPath(); g.moveTo(-20, H); g.lineTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    g.lineTo(W + 40, pts[pts.length - 1][1]); g.lineTo(W + 40, H); g.closePath(); g.fill();
    return pts;
  }
  function windmill(g, x, y, s, col, a) {
    g.save(); g.fillStyle = col; g.beginPath(); g.moveTo(x - s * 0.15, y); g.lineTo(x - s * 0.08, y - s * 0.6); g.lineTo(x + s * 0.08, y - s * 0.6); g.lineTo(x + s * 0.15, y); g.fill();
    g.translate(x, y - s * 0.6); g.rotate(a); g.fillStyle = shade(col, 0.2);
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-s * 0.03, 0, s * 0.06, s * 0.45); }
    g.restore();
  }
  function island(g, x, y, s) {
    g.save();
    g.fillStyle = '#8f6ad8'; g.beginPath(); g.moveTo(x - s * 0.5, y); g.quadraticCurveTo(x, y + s * 0.8, x + s * 0.5, y); g.fill();
    g.fillStyle = '#9be38a'; g.beginPath(); g.ellipse(x, y, s * 0.52, s * 0.12, 0, 0, TAU); g.fill();
    tree(g, x, y, s * 0.5, '#6fd06a', 'round');
    g.restore();
  }
  function mushroom(g, x, y, s) {
    g.save();
    g.fillStyle = '#fff3e0'; rr(g, x - s * 0.18, y - s * 0.6, s * 0.36, s * 0.6, s * 0.1); g.fill();
    const mg = g.createRadialGradient(x - s * 0.2, y - s * 0.8, 0, x, y - s * 0.6, s * 0.6); mg.addColorStop(0, '#ff9a9a'); mg.addColorStop(1, '#d6284a');
    g.fillStyle = mg; g.beginPath(); g.ellipse(x, y - s * 0.6, s * 0.55, s * 0.4, 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#fff'; for (const [dx, dy] of [[-0.25, -0.75], [0.2, -0.8], [0, -0.9]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.07, 0, TAU); g.fill(); }
    g.restore();
  }
  function crystalCluster(g, x, y, s) {
    const cols = [['#9fd2ff', '#3a63d9'], ['#e1b3ff', '#7a3ad9'], ['#aff6ff', '#2aa3c9']];
    for (let i = 0; i < 3; i++) {
      const [a, b] = cols[i];
      g.save(); g.translate(x + (i - 1) * s * 0.35, y); g.rotate((i - 1) * 0.3);
      const cg = g.createLinearGradient(-s * 0.2, 0, s * 0.2, 0); cg.addColorStop(0, a); cg.addColorStop(1, b);
      g.fillStyle = cg; g.beginPath(); g.moveTo(-s * 0.18, 0); g.lineTo(-s * 0.2, -s * 0.6); g.lineTo(0, -s * (0.9 + i * 0.1)); g.lineTo(s * 0.2, -s * 0.6); g.lineTo(s * 0.18, 0); g.closePath(); g.fill();
      g.restore();
    }
  }
  function lantern(g, x, y, s) {
    const lg = g.createRadialGradient(x, y - s, 0, x, y - s, s * 2.2); lg.addColorStop(0, 'rgba(255,220,120,0.6)'); lg.addColorStop(1, 'rgba(255,200,100,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(x, y - s, s * 2.2, 0, TAU); g.fill();
    g.fillStyle = '#3a2a5a'; g.fillRect(x - s * 0.05, y - s * 0.6, s * 0.1, s * 0.6);
    g.fillStyle = '#ffd36a'; rr(g, x - s * 0.3, y - s * 1.3, s * 0.6, s * 0.7, s * 0.15); g.fill();
  }

  // ---------------------------------------------------------------- scenes
  // Paint an area's environment. opt.horizon 0..1, opt.dim darken amount.
  function scene(g, W, H, areaIdx, opt) {
    opt = opt || {};
    const A = DATA.AREAS[areaIdx];
    const rnd = U.rng(areaIdx * 101 + 7 + (opt.seed || 0));
    const hz = H * (opt.horizon || 0.42);
    const sky = g.createLinearGradient(0, 0, 0, hz * 1.3);
    sky.addColorStop(0, A.sky[0]); sky.addColorStop(0.6, A.sky[1]); sky.addColorStop(1, A.sky[2]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const night = A.props === 'shadow';
    const sx = W * (0.25 + rnd() * 0.5), sy = hz * 0.35;
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, W * 0.45);
    sg.addColorStop(0, night ? 'rgba(230,220,255,0.55)' : 'rgba(255,250,210,0.85)'); sg.addColorStop(0.2, night ? 'rgba(200,180,255,0.2)' : 'rgba(255,240,180,0.35)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, H);
    g.fillStyle = night ? '#f4efff' : '#fffbe0'; g.beginPath(); g.arc(sx, sy, W * 0.06, 0, TAU); g.fill();
    if (night) {
      g.fillStyle = A.sky[0]; g.beginPath(); g.arc(sx + W * 0.025, sy - W * 0.015, W * 0.052, 0, TAU); g.fill();
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * W, rnd() * hz, 0.6 + rnd() * 1.4, 0, TAU); g.fill(); }
    }
    for (let i = 0; i < 5; i++) cloudShape(g, rnd() * W, hz * (0.12 + rnd() * 0.5), W * (0.14 + rnd() * 0.12), night ? 'rgba(160,140,220,0.25)' : 'rgba(255,255,255,0.75)');
    hills(g, W, hz, H * 0.12, mix(A.sky[2], A.hills[2], 0.35), mix(A.sky[2], A.hills[1], 0.5), areaIdx * 3 + 1, H);
    const lm = A.props;
    if (lm === 'meadow' || lm === 'castle') castle(g, W * (lm === 'castle' ? 0.5 : 0.72), hz - H * 0.02, W * (lm === 'castle' ? 0.5 : 0.24), mix(A.sky[2], '#b7c3e8', 0.4), mix(A.sky[0], '#6a7ad8', 0.3));
    if (lm === 'castle') for (let i = 0; i < 6; i++) { g.strokeStyle = alpha(DATA.COLORS[i].base, 0.35); g.lineWidth = W * 0.015; g.beginPath(); g.arc(W * 0.5, hz + H * 0.1, W * (0.55 - i * 0.015), Math.PI, TAU); g.stroke(); }
    if (lm === 'village') for (let i = 0; i < 3; i++) windmill(g, W * (0.2 + i * 0.3), hz - H * 0.02 + rnd() * 8, W * 0.12, mix(A.sky[2], '#c9b08a', 0.5), 0.3 + i);
    if (lm === 'ruins') for (let i = 0; i < 5; i++) { const cx0 = W * (0.1 + i * 0.2), hh = H * (0.05 + rnd() * 0.08); g.fillStyle = mix(A.sky[2], '#b8955a', 0.5); g.fillRect(cx0, hz - hh, W * 0.035, hh); g.fillRect(cx0 - W * 0.01, hz - hh - 4, W * 0.055, 5); }
    if (lm === 'clouds') for (let i = 0; i < 4; i++) island(g, W * (0.15 + i * 0.25 + rnd() * 0.05), hz - H * (0.05 + rnd() * 0.1), W * 0.14);
    if (lm === 'shadow') for (let i = 0; i < 6; i++) { const cx0 = rnd() * W, hh = H * (0.06 + rnd() * 0.1); g.fillStyle = mix(A.sky[1], '#1a1040', 0.5); g.beginPath(); g.moveTo(cx0 - W * 0.05, hz + 5); g.lineTo(cx0, hz - hh); g.lineTo(cx0 + W * 0.04, hz + 5); g.fill(); }
    const midPts = hills(g, W, hz + H * 0.06, H * 0.07, A.hills[0], A.hills[1], areaIdx * 3 + 2, H);
    if (lm === 'lake' || lm === 'meadow') {
      const wy = hz + H * (lm === 'lake' ? 0.09 : 0.14);
      const wg = g.createLinearGradient(0, wy, 0, wy + H * 0.12); wg.addColorStop(0, '#9fe6ff'); wg.addColorStop(1, '#3fa6e0');
      g.fillStyle = wg;
      g.beginPath(); g.moveTo(0, wy); g.bezierCurveTo(W * 0.3, wy - 10, W * 0.6, wy + 20, W, wy + 5); g.lineTo(W, wy + H * (lm === 'lake' ? 0.14 : 0.05)); g.bezierCurveTo(W * 0.6, wy + H * 0.1, W * 0.3, wy + H * 0.04, 0, wy + H * 0.06); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const lx = rnd() * W, ly = wy + 6 + rnd() * H * 0.05; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 14 + rnd() * 16, ly); g.stroke(); }
    }
    const kind = lm === 'forest' || lm === 'shadow' ? 'pine' : lm === 'village' ? 'fruit' : 'round';
    if (lm !== 'clouds') for (let i = 0; i < 9; i++) {
      const p = midPts[Math.floor(rnd() * midPts.length)] || [rnd() * W, hz];
      tree(g, U.clamp(p[0] + (rnd() - 0.5) * 60, 0, W), p[1] + 8 + rnd() * 20, W * (0.07 + rnd() * 0.05), shade(A.hills[1], -0.05), kind);
    }
    hills(g, W, hz + H * 0.2, H * 0.05, A.hills[1], A.hills[2], areaIdx * 3 + 3, H);
    if (lm === 'forest') for (let i = 0; i < 7; i++) mushroom(g, rnd() * W, hz + H * (0.24 + rnd() * 0.5), W * (0.03 + rnd() * 0.03));
    if (lm === 'lake' || lm === 'ruins') for (let i = 0; i < 5; i++) crystalCluster(g, rnd() * W, hz + H * (0.3 + rnd() * 0.5), W * (0.03 + rnd() * 0.02));
    if (lm === 'shadow') for (let i = 0; i < 6; i++) lantern(g, rnd() * W, hz + H * (0.25 + rnd() * 0.5), W * 0.03);
    if (lm !== 'clouds') {
      tree(g, -W * 0.02, H * 0.98, W * 0.34, shade(A.hills[2], -0.1), kind === 'fruit' ? 'round' : kind);
      tree(g, W * 1.02, H * 1.0, W * 0.3, shade(A.hills[2], -0.1), kind === 'fruit' ? 'round' : kind);
    } else for (let i = 0; i < 6; i++) cloudShape(g, rnd() * W, hz + H * (0.3 + rnd() * 0.6), W * (0.2 + rnd() * 0.2), 'rgba(255,255,255,0.85)');
    const fcols = ['#ff7ab6', '#ffe36a', '#ffffff', '#b98bff', '#ff8a5a'];
    g.globalAlpha = 0.9;
    for (let i = 0; i < 40; i++) flower(g, rnd() * W, hz + H * (0.22 + rnd() * 0.75), 2 + rnd() * 2.5, fcols[i % fcols.length]);
    g.globalAlpha = 1;
    if (!night) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.08;
      for (let i = 0; i < 4; i++) { g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(sx - 10 + i * 20, sy); g.lineTo(sx - W * 0.4 + i * W * 0.3, H); g.lineTo(sx - W * 0.3 + i * W * 0.3, H); g.closePath(); g.fill(); }
      g.restore();
    }
    if (opt.dim) { g.fillStyle = `rgba(10,20,50,${opt.dim})`; g.fillRect(0, 0, W, H); }
  }

  // ---------------------------------------------------------------- restoration objects
  // stage 0 broken (grey, held by storm bubbles), 1 rebuilt (raw materials),
  // 2 painted, 3 decorated (flowers, lights, sparkle).
  function object(g, x, y, s, type, stage, tt) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.12, 0, 0, TAU); g.fill();
    const raw = stage <= 1, broken = stage === 0;
    const P = {
      wall: broken ? '#9a9aa6' : raw ? '#d8c3a0' : '#fff2da', wood: broken ? '#76727e' : '#a8703f',
      roof: broken ? '#6d6a78' : raw ? '#9a6a44' : '#e8454f', trim: broken ? '#5c5a66' : raw ? '#7a5030' : '#3f7ad8',
      stone: broken ? '#8a8a96' : '#c9c1b5', accent: broken ? '#8a8a96' : '#ffd23f',
    };
    const flowers = (n, x0, w0, yy) => { for (let i = 0; i < n; i++) flower(g, x0 + (i * w0) / Math.max(1, n - 1), yy, s * 0.035, ['#ff6fa8', '#ffd23f', '#ff8a5a', '#b98bff', '#ffffff'][i % 5]); };
    switch (type) {
      case 'house': case 'workshop': {
        const w = s * 0.8, h = s * 0.5;
        g.fillStyle = P.wall; g.strokeStyle = 'rgba(60,40,30,0.55)'; g.lineWidth = s * 0.02;
        rr(g, x - w / 2, y - h, w, h, s * 0.04); g.fill(); g.stroke();
        if (broken) { g.fillStyle = 'rgba(60,60,70,0.35)'; g.beginPath(); g.moveTo(x + w * 0.1, y - h); g.lineTo(x + w * 0.5, y - h); g.lineTo(x + w * 0.5, y - h * 0.4); g.closePath(); g.fill(); }
        g.fillStyle = P.roof; g.beginPath(); g.moveTo(x - w * 0.62, y - h + 2); g.lineTo(x - (broken ? w * 0.05 : 0), y - h - s * 0.42); g.lineTo(x + w * (broken ? 0.3 : 0.62), y - h + 2); g.closePath(); g.fill(); g.stroke();
        if (!broken) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(x - w * 0.55, y - h); g.lineTo(x, y - h - s * 0.38); g.lineTo(x - w * 0.1, y - h); g.closePath(); g.fill(); }
        g.fillStyle = P.trim; rr(g, x - w * 0.1, y - h * 0.62, w * 0.2, h * 0.62, s * 0.05); g.fill();
        g.fillStyle = stage >= 3 ? '#fff4b0' : broken ? '#5a5a66' : '#bfe8ff';
        for (const d of [-1, 1]) { rr(g, x + d * w * 0.3 - w * 0.09, y - h * 0.75, w * 0.18, h * 0.3, s * 0.02); g.fill(); g.strokeStyle = P.trim; g.stroke(); }
        if (type === 'workshop') { g.fillStyle = broken ? '#76727e' : '#8a5a2a'; g.fillRect(x + w * 0.25, y - h - s * 0.35, s * 0.1, s * 0.25); if (stage >= 3) smoke(g, x + w * 0.3, y - h - s * 0.4, s, tt); g.fillStyle = P.accent; rr(g, x - w * 0.3, y - h - s * 0.02, w * 0.6, s * 0.1, s * 0.02); g.fill(); }
        if (stage >= 3) flowers(5, x - w * 0.45, w * 0.9, y - s * 0.02);
        break;
      }
      case 'bridge': {
        g.fillStyle = broken ? '#6f7f96' : '#5fb6e8'; g.beginPath(); g.ellipse(x, y + s * 0.02, s * 0.7, s * 0.1, 0, 0, TAU); g.fill();
        g.strokeStyle = P.wood; g.lineWidth = s * 0.1; g.lineCap = 'round';
        g.beginPath(); g.arc(x, y + s * 0.35, s * 0.62, Math.PI * 1.18, Math.PI * (broken ? 1.5 : 1.82)); g.stroke();
        if (broken) { g.beginPath(); g.arc(x, y + s * 0.35, s * 0.62, Math.PI * 1.62, Math.PI * 1.82); g.stroke(); }
        g.strokeStyle = stage >= 2 ? '#e8454f' : P.wood; g.lineWidth = s * 0.03;
        g.beginPath(); g.arc(x, y + s * 0.2, s * 0.62, Math.PI * 1.2, Math.PI * (broken ? 1.45 : 1.8)); g.stroke();
        for (let i = 0; i < 7; i++) { if (broken && i > 2 && i < 5) continue; const a = Math.PI * (1.22 + i * 0.1); g.beginPath(); g.moveTo(x + Math.cos(a) * s * 0.62, y + s * 0.35 + Math.sin(a) * s * 0.62); g.lineTo(x + Math.cos(a) * s * 0.62, y + s * 0.2 + Math.sin(a) * s * 0.62); g.stroke(); }
        if (stage >= 3) for (const d of [-0.35, 0, 0.35]) { const lx = x + d * s, ly = y - s * 0.32 + Math.abs(d) * s * 0.35; g.fillStyle = 'rgba(255,220,120,0.5)'; g.beginPath(); g.arc(lx, ly, s * 0.07, 0, TAU); g.fill(); g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(lx, ly, s * 0.035, 0, TAU); g.fill(); }
        break;
      }
      case 'fountain': {
        g.fillStyle = P.stone; g.strokeStyle = 'rgba(60,60,70,0.5)'; g.lineWidth = s * 0.02;
        g.beginPath(); g.ellipse(x, y - s * 0.08, s * 0.5, s * 0.15, 0, 0, TAU); g.fill(); g.stroke();
        g.fillRect(x - s * 0.5, y - s * 0.08, s, s * 0.08);
        g.fillStyle = stage >= 2 ? '#7fd8ff' : '#6a6a78'; g.beginPath(); g.ellipse(x, y - s * 0.1, s * 0.42, s * 0.1, 0, 0, TAU); g.fill();
        g.fillStyle = P.stone; rr(g, x - s * 0.06, y - s * 0.45, s * 0.12, s * 0.35, s * 0.03); g.fill(); g.stroke();
        g.beginPath(); g.ellipse(x, y - s * 0.45, s * 0.2, s * 0.06, 0, 0, TAU); g.fill(); g.stroke();
        if (stage >= 2) { g.strokeStyle = 'rgba(160,230,255,0.9)'; g.lineWidth = s * 0.025; for (const d of [-1, 1]) { const ph = Math.sin(tt * 6) * 0.02; g.beginPath(); g.moveTo(x, y - s * 0.55); g.quadraticCurveTo(x + d * s * (0.2 + ph), y - s * 0.75, x + d * s * 0.3, y - s * 0.15); g.stroke(); } }
        if (stage >= 3) flowers(6, x - s * 0.5, s, y + s * 0.02);
        break;
      }
      case 'windmill': {
        g.fillStyle = P.wall; g.strokeStyle = 'rgba(60,40,30,0.5)'; g.lineWidth = s * 0.02;
        g.beginPath(); g.moveTo(x - s * 0.25, y); g.lineTo(x - s * 0.15, y - s * 0.7); g.lineTo(x + s * 0.15, y - s * 0.7); g.lineTo(x + s * 0.25, y); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = P.roof; g.beginPath(); g.moveTo(x - s * 0.2, y - s * 0.68); g.lineTo(x, y - s * 0.88); g.lineTo(x + s * 0.2, y - s * 0.68); g.fill(); g.stroke();
        g.fillStyle = P.trim; rr(g, x - s * 0.06, y - s * 0.22, s * 0.12, s * 0.22, s * 0.04); g.fill();
        g.save(); g.translate(x, y - s * 0.66); g.rotate(broken ? 0.4 : tt * (stage >= 2 ? 1.2 : 0.3));
        for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); if (broken && i === 1) continue; g.fillStyle = P.wood; g.fillRect(-s * 0.02, 0, s * 0.04, s * 0.45); g.fillStyle = stage >= 2 ? '#fff' : broken ? '#8a8a96' : '#e8d8b8'; g.fillRect(s * 0.02, s * 0.1, s * 0.1, s * 0.33); }
        g.fillStyle = P.accent; g.beginPath(); g.arc(0, 0, s * 0.05, 0, TAU); g.fill();
        g.restore();
        if (stage >= 3) flowers(4, x - s * 0.3, s * 0.6, y + s * 0.01);
        break;
      }
      case 'garden': {
        g.fillStyle = broken ? '#7a746a' : '#8a5a2a'; g.beginPath(); g.ellipse(x, y - s * 0.03, s * 0.55, s * 0.14, 0, 0, TAU); g.fill();
        g.fillStyle = broken ? '#8a8474' : '#5fb84a'; g.beginPath(); g.ellipse(x, y - s * 0.06, s * 0.5, s * 0.11, 0, 0, TAU); g.fill();
        if (stage >= 1) for (let i = 0; i < 7; i++) { const fx = x - s * 0.4 + i * s * 0.13; g.strokeStyle = '#2f8a36'; g.lineWidth = s * 0.015; g.beginPath(); g.moveTo(fx, y - s * 0.05); g.lineTo(fx, y - s * (0.15 + (i % 2) * 0.05)); g.stroke(); if (stage >= 2) flower(g, fx, y - s * (0.16 + (i % 2) * 0.05), s * 0.04, ['#ff6fa8', '#ffd23f', '#b98bff', '#ff8a5a'][i % 4]); }
        if (stage >= 3) { tree(g, x, y - s * 0.08, s * 0.7, '#6fd06a', 'fruit'); for (let i = 0; i < 5; i++) { const a = tt * 1.5 + i * 1.3; g.fillStyle = 'rgba(255,250,180,0.9)'; g.beginPath(); g.arc(x + Math.cos(a) * s * 0.35, y - s * 0.5 + Math.sin(a * 1.3) * s * 0.15, s * 0.015, 0, TAU); g.fill(); } }
        else if (broken) { g.strokeStyle = '#6a6458'; g.lineWidth = s * 0.02; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - s * 0.3 + i * s * 0.2, y - s * 0.06); g.lineTo(x - s * 0.33 + i * s * 0.2, y - s * 0.18); g.stroke(); } }
        break;
      }
      case 'lighthouse': case 'tower': {
        const hh = type === 'lighthouse' ? s * 0.9 : s * 0.8;
        g.fillStyle = type === 'tower' ? P.stone : P.wall; g.strokeStyle = 'rgba(60,40,30,0.5)'; g.lineWidth = s * 0.02;
        g.beginPath(); g.moveTo(x - s * 0.2, y); g.lineTo(x - s * 0.13, y - hh); g.lineTo(x + s * 0.13, y - hh); g.lineTo(x + s * 0.2, y); g.closePath(); g.fill(); g.stroke();
        if (type === 'lighthouse' && stage >= 2) { g.fillStyle = '#e8454f'; for (let i = 0; i < 3; i++) g.fillRect(x - s * (0.19 - i * 0.02), y - hh * (0.2 + i * 0.28), s * (0.38 - i * 0.04), hh * 0.1); }
        if (broken) { g.fillStyle = 'rgba(60,60,70,0.4)'; g.beginPath(); g.moveTo(x - s * 0.13, y - hh); g.lineTo(x + s * 0.05, y - hh); g.lineTo(x - s * 0.1, y - hh * 0.75); g.fill(); }
        else {
          g.fillStyle = P.roof; g.beginPath(); g.moveTo(x - s * 0.17, y - hh - s * 0.12); g.lineTo(x, y - hh - s * 0.3); g.lineTo(x + s * 0.17, y - hh - s * 0.12); g.fill(); g.stroke();
          g.fillStyle = stage >= 3 ? '#fff6a0' : '#bfe8ff'; g.fillRect(x - s * 0.1, y - hh - s * 0.12, s * 0.2, s * 0.12);
          if (stage >= 3) { const bm = g.createRadialGradient(x, y - hh - s * 0.06, 0, x, y - hh - s * 0.06, s * 0.9); bm.addColorStop(0, 'rgba(255,245,170,0.7)'); bm.addColorStop(1, 'rgba(255,245,170,0)'); g.fillStyle = bm; g.beginPath(); g.moveTo(x, y - hh - s * 0.06); g.arc(x, y - hh - s * 0.06, s * 0.9, -0.25 + Math.sin(tt) * 0.5, 0.25 + Math.sin(tt) * 0.5); g.closePath(); g.fill(); }
          if (type === 'tower' && stage >= 2) crystalCluster(g, x, y - hh - s * 0.1, s * 0.12);
        }
        g.fillStyle = P.trim; rr(g, x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.2, s * 0.05); g.fill();
        break;
      }
    }
    if (broken) for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.3, rad = s * (0.3 + (i % 3) * 0.12);
      sphere(g, x + Math.cos(a) * rad * 0.9, y - s * 0.35 + Math.sin(a) * rad * 0.55 + Math.sin(tt * 1.5 + i) * s * 0.015, s * (0.09 + (i % 3) * 0.025), '#6a5a9a', '#b9a8e8', '#2a1a4a', { shadow: false });
    }
    if (stage >= 3) for (let i = 0; i < 3; i++) drawTwinkle(g, x + (i - 1) * s * 0.35, y - s * (0.5 + (i % 2) * 0.25), s * 0.07, tt * 1.3 + i * 2);
    g.restore();
  }
  function smoke(g, x, y, s, tt) {
    for (let i = 0; i < 3; i++) { const k = (tt * 0.5 + i / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; g.beginPath(); g.arc(x + Math.sin(k * 4) * s * 0.04, y - k * s * 0.4, s * (0.04 + k * 0.06), 0, TAU); g.fill(); }
  }

  // ---------------------------------------------------------------- chests
  const CHEST_COLS = { wooden: ['#b87a3e', '#7a4a1f', '#d9d2c5'], silver: ['#9fb3c8', '#566b82', '#eef4fb'], gold: ['#ffcf3f', '#b87400', '#fff4c0'], magic: ['#b57cff', '#5a22b0', '#ffe27a'], legendary: ['#ff6f91', '#9c1f4a', '#ffe27a'] };
  function chest(g, x, y, s, tier, open, tt) {
    const [body, dark, band] = CHEST_COLS[tier] || CHEST_COLS.wooden;
    g.save(); g.translate(x, y);
    if (open) { const gl = g.createRadialGradient(0, -s * 0.2, 0, 0, -s * 0.2, s * 0.9); gl.addColorStop(0, 'rgba(255,245,180,0.9)'); gl.addColorStop(1, 'rgba(255,245,180,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -s * 0.2, s * 0.9, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, s * 0.35, s * 0.5, s * 0.08, 0, 0, TAU); g.fill();
    const bg = g.createLinearGradient(0, -s * 0.1, 0, s * 0.35); bg.addColorStop(0, shade(body, 0.2)); bg.addColorStop(1, dark);
    g.fillStyle = bg; g.strokeStyle = shade(dark, -0.4); g.lineWidth = s * 0.03;
    rr(g, -s * 0.45, -s * 0.05, s * 0.9, s * 0.4, s * 0.06); g.fill(); g.stroke();
    g.save();
    if (open) { g.translate(0, -s * 0.05); g.rotate(-0.9); g.translate(0, s * 0.05); }
    const lg = g.createLinearGradient(0, -s * 0.35, 0, -s * 0.05); lg.addColorStop(0, shade(body, 0.35)); lg.addColorStop(1, body);
    g.fillStyle = lg; g.beginPath(); g.moveTo(-s * 0.47, -s * 0.05); g.lineTo(-s * 0.47, -s * 0.2); g.quadraticCurveTo(0, -s * 0.45, s * 0.47, -s * 0.2); g.lineTo(s * 0.47, -s * 0.05); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = band; for (const d of [-0.3, 0.3]) g.fillRect(d * s - s * 0.05, -s * 0.33 + Math.abs(d) * s * 0.1, s * 0.1, s * 0.28);
    g.restore();
    g.fillStyle = band; for (const d of [-0.3, 0.3]) g.fillRect(d * s - s * 0.05, -s * 0.05, s * 0.1, s * 0.4);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#8a5a00'; rr(g, -s * 0.08, -s * 0.1, s * 0.16, s * 0.18, s * 0.03); g.fill(); g.stroke();
    if (tier === 'magic' || tier === 'legendary') drawTwinkle(g, s * 0.35, -s * 0.3, s * 0.12, (tt || 0.5) * 2);
    g.restore();
  }

  // ---------------------------------------------------------------- cannon
  function cannon(g, x, y, s, skinId, ang, recoil) {
    const sk = DATA.SKINS[skinId] || DATA.SKINS.classic;
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y + s * 0.62, s * 0.75, s * 0.14, 0, 0, TAU); g.fill();
    const pg = g.createLinearGradient(x - s * 0.6, 0, x + s * 0.6, 0); pg.addColorStop(0, '#8a5a2e'); pg.addColorStop(0.5, '#c28a4e'); pg.addColorStop(1, '#6e421c');
    g.fillStyle = pg; g.strokeStyle = '#4a2a10'; g.lineWidth = s * 0.03;
    rr(g, x - s * 0.62, y + s * 0.18, s * 1.24, s * 0.45, s * 0.12); g.fill(); g.stroke();
    g.fillStyle = '#d9a86a'; g.beginPath(); g.ellipse(x, y + s * 0.2, s * 0.62, s * 0.12, 0, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(90,50,20,0.5)'; g.lineWidth = s * 0.015; g.beginPath(); g.ellipse(x, y + s * 0.2, s * 0.35, s * 0.06, 0, 0, TAU); g.stroke();
    g.fillStyle = '#5fc24a'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * s * 0.55, y + s * 0.15, s * 0.14, s * 0.07, d * 0.5, 0, TAU); g.fill(); }
    g.translate(x, y); g.rotate(ang + Math.PI / 2); g.translate(0, (recoil || 0) * s * 0.25);
    const bg = g.createLinearGradient(-s * 0.35, 0, s * 0.35, 0); bg.addColorStop(0, shade(sk.body, -0.3)); bg.addColorStop(0.45, shade(sk.body, 0.25)); bg.addColorStop(1, shade(sk.body, -0.35));
    g.fillStyle = bg; g.strokeStyle = shade(sk.body, -0.55); g.lineWidth = s * 0.03;
    g.beginPath(); g.moveTo(-s * 0.36, s * 0.05); g.lineTo(-s * 0.28, -s * 0.72); g.lineTo(s * 0.28, -s * 0.72); g.lineTo(s * 0.36, s * 0.05); g.closePath(); g.fill(); g.stroke();
    const tg = g.createLinearGradient(-s * 0.35, 0, s * 0.35, 0); tg.addColorStop(0, shade(sk.trim, -0.35)); tg.addColorStop(0.5, sk.trim); tg.addColorStop(1, shade(sk.trim, -0.4));
    g.fillStyle = tg; rr(g, -s * 0.34, -s * 0.8, s * 0.68, s * 0.16, s * 0.05); g.fill(); g.stroke();
    rr(g, -s * 0.37, -s * 0.22, s * 0.74, s * 0.12, s * 0.04); g.fill(); g.stroke();
    g.fillStyle = sk.gem; g.beginPath(); g.moveTo(0, -s * 0.5); g.lineTo(s * 0.09, -s * 0.4); g.lineTo(0, -s * 0.3); g.lineTo(-s * 0.09, -s * 0.4); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.moveTo(0, -s * 0.5); g.lineTo(s * 0.05, -s * 0.42); g.lineTo(0, -s * 0.4); g.fill();
    g.restore();
  }

  // ---------------------------------------------------------------- icons (DOM images)
  const iconCache = {};
  function icon(name, size) {
    size = size || 48;
    const k = name + '_' + size;
    if (iconCache[k]) return iconCache[k];
    const c = document.createElement('canvas');
    c.width = size * 2; c.height = size * 2;
    const g = c.getContext('2d'); g.scale(2, 2);
    const s = size, x = s / 2, y = s / 2;
    const draw = (spr, sc) => g.drawImage(spr, x - (spr.w * (sc || 1)) / 2, y - (spr.h * (sc || 1)) / 2, spr.w * (sc || 1), spr.h * (sc || 1));
    switch (name) {
      case 'coin': {
        g.fillStyle = '#b86e00'; g.beginPath(); g.arc(x, y + s * 0.04, s * 0.42, 0, TAU); g.fill();
        const cg = g.createRadialGradient(x - s * 0.12, y - s * 0.15, 0, x, y, s * 0.42); cg.addColorStop(0, '#fff6b0'); cg.addColorStop(0.5, '#ffd23f'); cg.addColorStop(1, '#e89a00');
        g.fillStyle = cg; g.beginPath(); g.arc(x, y, s * 0.4, 0, TAU); g.fill();
        g.strokeStyle = '#c47a00'; g.lineWidth = s * 0.05; g.beginPath(); g.arc(x, y, s * 0.29, 0, TAU); g.stroke();
        star(g, x, y + s * 0.02, s * 0.17, s * 0.08, 5); g.fillStyle = '#e08a00'; g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x - s * 0.15, y - s * 0.2, s * 0.1, s * 0.05, -0.6, 0, TAU); g.fill();
        break;
      }
      case 'star': drawStarShape(g, x, y, s * 0.42); break;
      case 'starGrey': star(g, x, y + s * 0.02, s * 0.42, s * 0.21, 5); g.fillStyle = 'rgba(40,50,90,0.45)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = s * 0.04; g.stroke(); break;
      case 'heart': case 'heartGrey': {
        const grey = name === 'heartGrey';
        heart(g, x, y + s * 0.12, s * 0.46);
        const hg = g.createLinearGradient(0, y - s * 0.4, 0, y + s * 0.4); hg.addColorStop(0, grey ? '#c9cfdb' : '#ff8fa8'); hg.addColorStop(1, grey ? '#8a94a8' : '#e8174a');
        g.fillStyle = hg; g.fill(); g.strokeStyle = grey ? '#5a6478' : '#9c0f33'; g.lineWidth = s * 0.04; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x - s * 0.17, y - s * 0.12, s * 0.09, s * 0.06, -0.6, 0, TAU); g.fill();
        break;
      }
      case 'wood': {
        g.save(); g.translate(x, y); g.rotate(-0.3);
        for (const dy of [0.12, -0.12]) { const lg = g.createLinearGradient(0, dy * s - s * 0.12, 0, dy * s + s * 0.12); lg.addColorStop(0, '#c98a4e'); lg.addColorStop(1, '#7a4a1f'); g.fillStyle = lg; rr(g, -s * 0.38, dy * s - s * 0.12, s * 0.76, s * 0.24, s * 0.1); g.fill(); g.fillStyle = '#e8c08a'; g.beginPath(); g.ellipse(s * 0.34, dy * s, s * 0.08, s * 0.11, 0, 0, TAU); g.fill(); }
        g.restore(); break;
      }
      case 'stone': sphere(g, x, y + s * 0.03, s * 0.36, '#9aa3b2', '#e2e7ee', '#4a5262'); break;
      case 'crystal': crystalCluster(g, x, y + s * 0.4, s * 0.45); break;
      case 'flower': for (let i = 0; i < 3; i++) { g.fillStyle = '#3fae4a'; g.fillRect(x - s * 0.22 + i * s * 0.22 - 1, y, 2, s * 0.38); flower(g, x - s * 0.22 + i * s * 0.22, y - s * 0.05 + (i % 2) * s * 0.08, s * 0.1, ['#ff6fa8', '#ffd23f', '#b98bff'][i]); } break;
      case 'hammer': {
        g.save(); g.translate(x, y); g.rotate(-0.6);
        g.fillStyle = '#a0662e'; g.strokeStyle = '#5a3210'; g.lineWidth = s * 0.03; rr(g, -s * 0.05, -s * 0.1, s * 0.1, s * 0.52, s * 0.04); g.fill(); g.stroke();
        const hg = g.createLinearGradient(0, -s * 0.36, 0, -s * 0.08); hg.addColorStop(0, '#eef2f8'); hg.addColorStop(1, '#8a96aa');
        g.fillStyle = hg; g.strokeStyle = '#3e4658'; rr(g, -s * 0.3, -s * 0.36, s * 0.6, s * 0.26, s * 0.06); g.fill(); g.stroke();
        g.restore(); break;
      }
      case 'bomb': draw(bombSprite(s * 0.36)); break;
      case 'shuffle': {
        g.lineCap = 'round'; g.lineJoin = 'round';
        const arrow = (col, flip) => {
          g.save(); g.translate(x, y); if (flip) g.scale(1, -1);
          g.strokeStyle = shade(col, -0.4); g.lineWidth = s * 0.16; g.beginPath(); g.moveTo(-s * 0.32, s * 0.15); g.bezierCurveTo(-s * 0.05, s * 0.15, 0, -s * 0.15, s * 0.22, -s * 0.15); g.stroke();
          g.strokeStyle = col; g.lineWidth = s * 0.1; g.stroke();
          g.fillStyle = col; g.beginPath(); g.moveTo(s * 0.18, -s * 0.3); g.lineTo(s * 0.4, -s * 0.15); g.lineTo(s * 0.18, 0); g.closePath(); g.fill();
          g.restore();
        };
        arrow('#ffd23f', false); arrow('#9a6bff', true); break;
      }
      case 'color': {
        for (let i = 0; i < 6; i++) { g.fillStyle = DATA.COLORS[i].base; g.beginPath(); g.moveTo(x, y); g.arc(x, y, s * 0.4, (i / 6) * TAU, ((i + 1) / 6) * TAU + 0.01); g.fill(); }
        sphere(g, x, y, s * 0.4, 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(0,0,40,0.3)', { shadow: false });
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, s * 0.1, 0, TAU); g.fill(); break;
      }
      case 'rainbow': draw(rainbowSprite(s * 0.38)); break;
      case 'fireball': {
        const fg = g.createRadialGradient(x - s * 0.05, y + s * 0.05, 0, x, y, s * 0.42); fg.addColorStop(0, '#fff6b0'); fg.addColorStop(0.4, '#ffb030'); fg.addColorStop(1, '#e8322a');
        g.fillStyle = fg; g.beginPath(); g.moveTo(x - s * 0.3, y + s * 0.1); g.quadraticCurveTo(x - s * 0.35, y - s * 0.3, x + s * 0.1, y - s * 0.45); g.quadraticCurveTo(x, y - s * 0.2, x + s * 0.3, y - s * 0.25); g.quadraticCurveTo(x + s * 0.4, y + s * 0.35, x, y + s * 0.36); g.quadraticCurveTo(x - s * 0.25, y + s * 0.34, x - s * 0.3, y + s * 0.1); g.fill();
        break;
      }
      case 'moves3': { g.fillStyle = '#39c24a'; g.strokeStyle = '#1b6e26'; g.lineWidth = s * 0.05; g.beginPath(); g.arc(x, y, s * 0.4, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = `900 ${s * 0.42}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+3', x, y + s * 0.02); break; }
      case 'gear': { g.save(); g.translate(x, y); g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r0 = i % 2 ? s * 0.3 : s * 0.4; g.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } g.closePath(); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#3a6fd8'; g.beginPath(); g.arc(0, 0, s * 0.13, 0, TAU); g.fill(); g.restore(); break; }
      case 'wp': { g.fillStyle = '#ff5aa8'; g.beginPath(); g.moveTo(x - s * 0.25, y - s * 0.35); g.lineTo(x + s * 0.35, y - s * 0.2); g.lineTo(x - s * 0.25, y - s * 0.02); g.closePath(); g.fill(); g.fillStyle = '#7a4a1f'; rr(g, x - s * 0.32, y - s * 0.42, s * 0.08, s * 0.84, s * 0.03); g.fill(); break; }
      case 'lock': draw(lockSprite(s * 0.4)); break;
      case 'map': { g.fillStyle = '#f5e2b8'; g.strokeStyle = '#8a5a2a'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(x - s * 0.38, y - s * 0.3); g.lineTo(x - s * 0.12, y - s * 0.38); g.lineTo(x + s * 0.12, y - s * 0.3); g.lineTo(x + s * 0.38, y - s * 0.38); g.lineTo(x + s * 0.38, y + s * 0.3); g.lineTo(x + s * 0.12, y + s * 0.38); g.lineTo(x - s * 0.12, y + s * 0.3); g.lineTo(x - s * 0.38, y + s * 0.38); g.closePath(); g.fill(); g.stroke(); g.setLineDash([s * 0.05, s * 0.05]); g.strokeStyle = '#d6284a'; g.beginPath(); g.moveTo(x - s * 0.25, y + s * 0.2); g.quadraticCurveTo(x, y - s * 0.3, x + s * 0.2, y); g.stroke(); g.setLineDash([]); g.fillStyle = '#d6284a'; g.beginPath(); g.arc(x + s * 0.2, y, s * 0.06, 0, TAU); g.fill(); break; }
      case 'collection': critter(g, x, y + s * 0.08, s * 0.85, ['#ffb347', '#fff1d6', 'cat', 'none', 'leaf'], {}); break;
      case 'shop': { g.fillStyle = '#e8454f'; g.beginPath(); g.moveTo(x - s * 0.4, y - s * 0.1); g.lineTo(x - s * 0.3, y - s * 0.35); g.lineTo(x + s * 0.3, y - s * 0.35); g.lineTo(x + s * 0.4, y - s * 0.1); g.closePath(); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(x - s * 0.3 + i * s * 0.16, y - s * 0.35, s * 0.08, s * 0.25); g.fillStyle = '#ffe6b8'; rr(g, x - s * 0.34, y - s * 0.1, s * 0.68, s * 0.42, s * 0.04); g.fill(); g.fillStyle = '#7a4a1f'; rr(g, x - s * 0.08, y + s * 0.05, s * 0.16, s * 0.27, s * 0.03); g.fill(); break; }
      case 'daily': { g.fillStyle = '#3fae4a'; rr(g, x - s * 0.34, y - s * 0.12, s * 0.68, s * 0.46, s * 0.05); g.fill(); g.fillStyle = '#5fd06a'; rr(g, x - s * 0.38, y - s * 0.24, s * 0.76, s * 0.14, s * 0.04); g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(x - s * 0.06, y - s * 0.24, s * 0.12, s * 0.58); g.beginPath(); g.ellipse(x - s * 0.12, y - s * 0.3, s * 0.12, s * 0.07, 0.5, 0, TAU); g.ellipse(x + s * 0.12, y - s * 0.3, s * 0.12, s * 0.07, -0.5, 0, TAU); g.fill(); break; }
      case 'quests': { g.fillStyle = '#fff4dc'; g.strokeStyle = '#8a5a2a'; g.lineWidth = s * 0.04; rr(g, x - s * 0.3, y - s * 0.38, s * 0.6, s * 0.76, s * 0.06); g.fill(); g.stroke(); g.strokeStyle = '#39a84a'; g.lineWidth = s * 0.06; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - s * 0.2, y - s * 0.18 + i * s * 0.2); g.lineTo(x - s * 0.14, y - s * 0.12 + i * s * 0.2); g.lineTo(x - s * 0.05, y - s * 0.24 + i * s * 0.2); g.stroke(); } g.strokeStyle = '#b89a6a'; g.lineWidth = s * 0.04; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + s * 0.02, y - s * 0.18 + i * s * 0.2); g.lineTo(x + s * 0.2, y - s * 0.18 + i * s * 0.2); g.stroke(); } break; }
      case 'weekly': chest(g, x, y + s * 0.08, s * 0.9, 'gold', false, 0); break;
      case 'event': { g.fillStyle = '#ff7ab6'; star(g, x, y, s * 0.4, s * 0.2, 8); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, s * 0.14, 0, TAU); g.fill(); break; }
      case 'play': { g.fillStyle = '#45b82a'; g.beginPath(); g.arc(x, y, s * 0.4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - s * 0.12, y - s * 0.2); g.lineTo(x + s * 0.22, y); g.lineTo(x - s * 0.12, y + s * 0.2); g.closePath(); g.fill(); break; }
      default: {
        if (name.startsWith('chest_')) chest(g, x, y + s * 0.08, s * 0.9, name.slice(6), false, 0.5);
        else if (name.startsWith('char_')) character(g, x, y + s * 0.02, s * 0.95, name.slice(5), { mood: 'happy' });
        else if (name.startsWith('cr_')) { const c = DATA.CREATURES.find((z) => z.id === name.slice(3)); critter(g, x, y + s * 0.1, s * 0.85, c ? c.look : critterLook(name.slice(3)), {}); }
        else if (name.startsWith('crx_')) { const c = DATA.CREATURES.find((z) => z.id === name.slice(4)); if (c) { critter(g, x, y + s * 0.1, s * 0.85, ['#5a4f78', '#6a5f88', c.look[2], 'none', c.look[4]], { blink: true }); } }
        else if (name.startsWith('boss_')) { const a = +name.slice(5); boss(g, x, y + s * 0.05, s * 0.9, DATA.AREAS[a].boss.hue, { final: !!DATA.AREAS[a].boss.final }); }
        else if (name.startsWith('obj_')) { const p = name.split('_'); object(g, x, y + s * 0.35, s * 0.8, p[1], +p[2], 0); }
        else if (name.startsWith('bub_')) draw(bubbleSprite(s * 0.4, +name.slice(4), false));
        else if (name.startsWith('cell_')) drawCell(g, x, y, s * 0.4, { t: name.slice(5), c: 1, hp: 2, cr: 'pip' }, 0.4, false);
        else if (name.startsWith('skin_')) cannon(g, x, y - s * 0.02, s * 0.62, name.slice(5), -Math.PI / 2, 0);
      }
    }
    iconCache[k] = c.toDataURL();
    return iconCache[k];
  }

  return {
    setDpr, sprite, blit, rr, star, heart, sphere, bubbleSprite, drawCell, critter, critterLook, character, boss,
    scene, object, chest, cannon, icon, butterfly, drawStarShape, tree, flower, cloudShape, face, glassBubble,
    mix, shade, alpha, hsl, crystalCluster, mushroom, lantern, castle, windmill, island, hills,
  };
})();
