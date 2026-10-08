/* Player: a small original adventurer drawn with canvas shapes. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;
  const A = 32, B = 16;
  const RADIUS = 0.22;          // collision radius in tiles
  const SPEED_X = 150, SPEED_Y = 105; // screen px / second

  function create(x, y) {
    return { x, y, facing: 1, back: false, walk: 0, moving: false, target: null, act: 0 };
  }

  /** mx, my: screen-space input -1..1. game.playerBlocked(x, y) handles collisions. */
  function update(p, dt, mx, my, game) {
    let sx = mx, sy = my;
    if (Math.abs(sx) + Math.abs(sy) > 0.05) {
      p.target = null;
    } else if (p.target) {
      const dx = (p.target.x - p.target.y - (p.x - p.y)) * A;
      const dy = (p.target.x + p.target.y - (p.x + p.y)) * B;
      const L = Math.hypot(dx, dy);
      if (L < 3) {
        p.target = null;
        sx = sy = 0;
      } else {
        sx = dx / L;
        sy = dy / L;
      }
    }
    if (p.act > 0) p.act = Math.max(0, p.act - dt);
    const mag = Math.min(1, Math.hypot(sx, sy));
    if (mag < 0.05) {
      p.moving = false;
      return false;
    }
    const vx = sx * SPEED_X, vy = sy * SPEED_Y;
    // screen velocity -> grid velocity (inverse isometric transform)
    const gdx = ((vx / A + vy / B) / 2) * dt;
    const gdy = ((vy / B - vx / A) / 2) * dt;
    let moved = false;
    if (!game.playerBlocked(p.x + gdx, p.y)) { p.x += gdx; moved = true; }
    if (!game.playerBlocked(p.x, p.y + gdy)) { p.y += gdy; moved = true; }
    if (!moved) p.target = null;
    if (vx > 4) p.facing = 1; else if (vx < -4) p.facing = -1;
    p.back = vy < -20 && Math.abs(vy) > Math.abs(vx) * 0.6;
    p.moving = moved;
    if (moved) p.walk += dt * mag;
    return moved;
  }

  /** Draw with feet at (x, y) in world pixels. */
  function draw(ctx, p, x, y, t) {
    const cyc = p.walk * 11;
    const bob = p.moving ? -Math.abs(Math.sin(cyc)) * 3 : Math.sin(t * 2.2) * 0.7;
    const chop = p.act > 0 ? Math.sin((p.act / 0.3) * Math.PI) : 0;
    D.shadow(ctx, x, y, 12, 5, 0.25);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.facing, 1);

    // legs
    const l1 = p.moving ? Math.sin(cyc) * 3 : 0;
    ctx.fillStyle = '#2a3f7a';
    D.roundRect(ctx, -6 + l1 * 0.3, -11 + bob * 0.3, 5, 10 + Math.max(0, -l1) * 0.3, 2);
    ctx.fill();
    D.roundRect(ctx, 1 - l1 * 0.3, -11 + bob * 0.3, 5, 10 + Math.max(0, l1) * 0.3, 2);
    ctx.fill();
    D.ellipse(ctx, -3.5 + l1 * 0.6, -1 + Math.min(0, l1) * 0.3, 3.6, 2.2, '#7a4520');
    D.ellipse(ctx, 3.5 - l1 * 0.6, -1 + Math.min(0, -l1) * 0.3, 3.6, 2.2, '#7a4520');

    const by = bob;
    // backpack behind body
    if (!p.back) {
      D.roundRect(ctx, -13, -27 + by, 9, 14, 3.5);
      ctx.fillStyle = '#ff9f1c';
      ctx.fill();
      D.roundRect(ctx, -13, -27 + by, 9, 4, 2);
      ctx.fillStyle = '#e07b00';
      ctx.fill();
      D.circle(ctx, -10, -24 + by, 1.6, '#3a86ff');
    }
    // body
    const bg = ctx.createLinearGradient(-8, 0, 8, 0);
    bg.addColorStop(0, '#2ec4b6');
    bg.addColorStop(1, '#16897e');
    D.roundRect(ctx, -8, -26 + by, 16, 16, 6);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = '#ffcf2e';
    ctx.fillRect(-8, -16 + by, 16, 2.4);
    if (p.back) {
      D.roundRect(ctx, -9, -28 + by, 18, 17, 5);
      ctx.fillStyle = '#ff9f1c';
      ctx.fill();
      D.roundRect(ctx, -9, -28 + by, 18, 5, 3);
      ctx.fillStyle = '#e07b00';
      ctx.fill();
      D.roundRect(ctx, -5, -21 + by, 10, 6, 2);
      ctx.fillStyle = '#ffb547';
      ctx.fill();
    }
    // arms
    const sw = p.moving ? Math.sin(cyc) * 4 : 0;
    D.circle(ctx, -8, -18 + by + sw * 0.4, 3.2, '#ffd7b0');
    ctx.save();
    ctx.translate(8, -22 + by);
    ctx.rotate(-chop * 1.6 - sw * 0.08);
    D.roundRect(ctx, -2.5, 0, 5, 9, 2.5);
    ctx.fillStyle = '#2ec4b6';
    ctx.fill();
    D.circle(ctx, 0, 9, 3.1, '#ffd7b0');
    if (chop > 0) {
      ctx.fillStyle = '#8a5527';
      ctx.fillRect(-1, 8, 2, 10);
      ctx.fillStyle = '#c9d0dd';
      ctx.fillRect(-4, 16, 8, 4);
    }
    ctx.restore();

    // head
    const hy = -40 + by;
    const hg = ctx.createRadialGradient(-4, hy - 5, 2, 0, hy, 15);
    hg.addColorStop(0, '#ffe6cc');
    hg.addColorStop(1, '#f5b98a');
    ctx.beginPath();
    ctx.arc(0, hy, 14, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();
    if (!p.back) {
      // face
      const blink = (t % 3.7) < 0.12;
      if (blink) {
        ctx.fillStyle = '#2b1a10';
        ctx.fillRect(1, hy + 1, 4, 1.5);
        ctx.fillRect(8, hy + 1, 4, 1.5);
      } else {
        D.ellipse(ctx, 3, hy + 1, 2.2, 3, '#2b1a10');
        D.ellipse(ctx, 10, hy + 1, 2.2, 3, '#2b1a10');
        D.circle(ctx, 3.8, hy - 0.2, 0.9, '#ffffff');
        D.circle(ctx, 10.8, hy - 0.2, 0.9, '#ffffff');
      }
      D.ellipse(ctx, -1, hy + 6, 2.8, 1.6, 'rgba(255,120,120,0.45)');
      D.ellipse(ctx, 12, hy + 6, 2.2, 1.4, 'rgba(255,120,120,0.45)');
      ctx.beginPath();
      ctx.arc(7, hy + 5, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = '#7a3a20';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      D.ellipse(ctx, 0, hy + 2, 13, 11, '#7a4a2a');
    }
    // explorer hat
    ctx.beginPath();
    ctx.ellipse(0, hy - 6, 17, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d64545';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, hy - 8, 12, 10, 0, Math.PI, 0);
    ctx.closePath();
    const capG = ctx.createLinearGradient(0, hy - 18, 0, hy - 6);
    capG.addColorStop(0, '#ff6b6b');
    capG.addColorStop(1, '#d64545');
    ctx.fillStyle = capG;
    ctx.fill();
    ctx.fillStyle = '#ffcf2e';
    ctx.fillRect(-12, hy - 10, 24, 3);
    D.ellipse(ctx, -4, hy - 14, 3.5, 1.8, 'rgba(255,255,255,0.35)');
    // feather
    ctx.beginPath();
    ctx.moveTo(-9, hy - 11);
    ctx.quadraticCurveTo(-18, hy - 22, -12, hy - 26);
    ctx.quadraticCurveTo(-10, hy - 18, -7, hy - 11);
    ctx.fillStyle = '#4cd964';
    ctx.fill();
    ctx.restore();
  }

  BI.Player = { RADIUS, create, update, draw };
})();
