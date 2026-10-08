/* Shared Canvas 2D drawing helpers: isometric boxes, cylinders, cones,
   colour shading and an offscreen sprite cache. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  const A = 32; // half tile width  (tile = 64 x 32)
  const B = 16; // half tile height
  const SPRITE_Q = 2; // sprites are rendered at 2x for crispness

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const shadeCache = new Map();
  /** Lighten (amt > 0) or darken (amt < 0) a #hex colour. */
  function shade(hex, amt) {
    const key = hex + '|' + amt;
    let v = shadeCache.get(key);
    if (v) return v;
    const c = hexToRgb(hex);
    const t = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    v = 'rgb(' + Math.round(c[0] + (t - c[0]) * p) + ',' + Math.round(c[1] + (t - c[1]) * p) + ',' + Math.round(c[2] + (t - c[2]) * p) + ')';
    shadeCache.set(key, v);
    return v;
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  /** Isometric offset of (dx, dy) grid units at height z (px). */
  function P(dx, dy, z) { return [(dx - dy) * A, (dx + dy) * B - (z || 0)]; }

  function path(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  function poly(ctx, pts, fill) {
    path(ctx, pts);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function line(ctx, a, b, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 1;
    ctx.stroke();
  }
  function lerpPt(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

  /** Isometric box centred on the origin, footprint w x d tiles, height h, lifted by z. */
  function box(ctx, w, d, h, z, top, left, right, edge) {
    const hw = w / 2, hd = d / 2;
    z = z || 0;
    poly(ctx, [P(-hw, hd, z), P(hw, hd, z), P(hw, hd, z + h), P(-hw, hd, z + h)], left);
    poly(ctx, [P(hw, hd, z), P(hw, -hd, z), P(hw, -hd, z + h), P(hw, hd, z + h)], right);
    const t = [P(-hw, -hd, z + h), P(hw, -hd, z + h), P(hw, hd, z + h), P(-hw, hd, z + h)];
    poly(ctx, t, top);
    if (edge !== false) {
      ctx.beginPath();
      ctx.moveTo(t[3][0], t[3][1]);
      ctx.lineTo(t[2][0], t[2][1]);
      ctx.lineTo(t[1][0], t[1][1]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(t[2][0], t[2][1]);
      ctx.lineTo(P(hw, hd, z)[0], P(hw, hd, z)[1]);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();
    }
    return t;
  }

  /** Point on the visible 'left' (+y) or 'right' (+x) face of a box. u: 0..1 along face, z: height. */
  function facePt(face, w, d, u, z) {
    const hw = w / 2, hd = d / 2;
    return face === 'left' ? P(-hw + u * w, hd, z) : P(hw, hd - u * d, z);
  }
  function faceQuad(ctx, face, w, d, u0, u1, z0, z1, fill) {
    poly(ctx, [facePt(face, w, d, u0, z0), facePt(face, w, d, u1, z0), facePt(face, w, d, u1, z1), facePt(face, w, d, u0, z1)], fill);
  }
  function faceLine(ctx, face, w, d, u0, u1, z, stroke, lw) {
    line(ctx, facePt(face, w, d, u0, z), facePt(face, w, d, u1, z), stroke, lw);
  }

  /** Vertical cylinder (screen-space radius r, base at height z). */
  function cylinder(ctx, r, z, h, cl, cr, ctop) {
    const ry = r * 0.5;
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    g.addColorStop(0, cl);
    g.addColorStop(0.35, cl);
    g.addColorStop(1, cr);
    ctx.beginPath();
    ctx.moveTo(-r, -z - h);
    ctx.lineTo(-r, -z);
    ctx.ellipse(0, -z, r, ry, 0, Math.PI, 0, true);
    ctx.lineTo(r, -z - h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    if (ctop) {
      ctx.beginPath();
      ctx.ellipse(0, -z - h, r, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = ctop;
      ctx.fill();
    }
  }
  /** Tapered cylinder (radius rb at bottom, rt at top). */
  function taper(ctx, rb, rt, z, h, cl, cr, ctop) {
    const g = ctx.createLinearGradient(-rb, 0, rb, 0);
    g.addColorStop(0, cl);
    g.addColorStop(0.35, cl);
    g.addColorStop(1, cr);
    ctx.beginPath();
    ctx.moveTo(-rt, -z - h);
    ctx.lineTo(-rb, -z);
    ctx.ellipse(0, -z, rb, rb * 0.5, 0, Math.PI, 0, true);
    ctx.lineTo(rt, -z - h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    if (ctop) {
      ctx.beginPath();
      ctx.ellipse(0, -z - h, rt, rt * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = ctop;
      ctx.fill();
    }
  }
  function cone(ctx, r, z, h, cl, cr) {
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    g.addColorStop(0, cl);
    g.addColorStop(0.4, cl);
    g.addColorStop(1, cr);
    ctx.beginPath();
    ctx.moveTo(-r, -z);
    ctx.lineTo(0, -z - h);
    ctx.lineTo(r, -z);
    ctx.ellipse(0, -z, r, r * 0.5, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function shadow(ctx, x, y, rx, ry, a) { ellipse(ctx, x, y, rx, ry, 'rgba(10,30,20,' + (a == null ? 0.22 : a) + ')'); }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** A faceted crystal shard standing on (x, y). */
  function shard(ctx, x, y, w, h, light, dark) {
    const hw = w / 2;
    const top = [x, y - h], sh = Math.min(w * 0.7, h * 0.3);
    poly(ctx, [top, [x - hw, y - h + sh], [x - hw, y - sh * 0.4], [x, y], [x, y - h + sh * 0.2]], light);
    poly(ctx, [top, [x, y - h + sh * 0.2], [x, y], [x + hw, y - sh * 0.4], [x + hw, y - h + sh]], dark);
    poly(ctx, [top, [x - hw, y - h + sh], [x - hw * 0.2, y - h + sh * 0.9]], 'rgba(255,255,255,0.55)');
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.8;
    path(ctx, [top, [x - hw, y - h + sh], [x - hw, y - sh * 0.4], [x, y], [x + hw, y - sh * 0.4], [x + hw, y - h + sh]]);
    ctx.stroke();
  }

  // ---------------- sprite cache ----------------
  const sprites = new Map();
  /** Render once into an offscreen canvas. drawFn(ctx) draws around (0,0) = anchor. */
  function sprite(key, w, h, ax, ay, drawFn) {
    let s = sprites.get(key);
    if (s) return s;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * SPRITE_Q);
    cv.height = Math.ceil(h * SPRITE_Q);
    const g = cv.getContext('2d');
    g.scale(SPRITE_Q, SPRITE_Q);
    g.translate(ax, ay);
    drawFn(g);
    s = { cv, w, h, ax, ay };
    sprites.set(key, s);
    return s;
  }
  function drawSprite(ctx, s, x, y) { ctx.drawImage(s.cv, x - s.ax, y - s.ay, s.w, s.h); }

  /** Soft radial glow sprite. */
  function glow(color, r) {
    return sprite('glow|' + color + '|' + r, r * 2, r * 2, r, r, (g) => {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, rgba(color, 0.75));
      gr.addColorStop(0.4, rgba(color, 0.3));
      gr.addColorStop(1, rgba(color, 0));
      g.fillStyle = gr;
      g.fillRect(-r, -r, r * 2, r * 2);
    });
  }

  /** Small resource icon for bubbles (canvas). */
  function resIcon(ctx, res, x, y, r) {
    if (res === 'coins') {
      circle(ctx, x, y, r, '#e59a00');
      circle(ctx, x, y - r * 0.08, r * 0.86, '#ffcf2e');
      circle(ctx, x, y - r * 0.08, r * 0.58, '#ffe98a');
      ctx.fillStyle = '#d68a00';
      ctx.font = '900 ' + Math.round(r * 1.1) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x, y);
    } else if (res === 'crystal') {
      shard(ctx, x, y + r * 0.9, r * 1.3, r * 1.9, '#9ff4ff', '#1aa7e0');
    } else if (res === 'stone') {
      poly(ctx, [[x - r, y + r * 0.5], [x - r * 0.6, y - r * 0.6], [x + r * 0.3, y - r * 0.9], [x + r, y - r * 0.1], [x + r * 0.6, y + r * 0.7]], '#8d96aa');
      poly(ctx, [[x - r * 0.6, y - r * 0.6], [x + r * 0.3, y - r * 0.9], [x + r * 0.1, y - r * 0.1], [x - r * 0.5, y]], '#c9d0dd');
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.4);
      roundRect(ctx, -r, -r * 0.45, r * 1.8, r * 0.9, r * 0.35);
      ctx.fillStyle = '#b06a32';
      ctx.fill();
      ellipse(ctx, r * 0.8, 0, r * 0.3, r * 0.45, '#e8b27a');
      ctx.restore();
    }
  }

  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  BI.Draw = {
    A, B, SPRITE_Q, hexToRgb, shade, rgba, P, path, poly, line, lerpPt, box, facePt, faceQuad, faceLine,
    cylinder, taper, cone, ellipse, circle, shadow, roundRect, shard, sprite, drawSprite, glow, resIcon,
    easeOutBack, clamp,
  };
})();
