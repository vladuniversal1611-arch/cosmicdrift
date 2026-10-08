/* Entities: the survivor and the zombies (movement, AI, drawing). */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const D = BI.Draw;
  const A = 32, B = 16;
  const P_RAD = 0.22, Z_RAD = 0.24;
  const SPEED_X = 145, SPEED_Y = 100; // player screen px / s

  function makePlayer(x, y) {
    return { x, y, facing: 1, back: false, walk: 0, moving: false, target: null, act: 0, actKind: null, hurtT: 0, aimX: 0, aimY: 0, flash: 0 };
  }

  /** mx,my: screen-space input. Returns true if moved. */
  function updatePlayer(p, dt, mx, my, map, speedMul) {
    let sx = mx, sy = my;
    if (Math.abs(sx) + Math.abs(sy) > 0.05) p.target = null;
    else if (p.target) {
      const dx = (p.target.x - p.target.y - (p.x - p.y)) * A, dy = (p.target.x + p.target.y - (p.x + p.y)) * B;
      const L = Math.hypot(dx, dy);
      if (L < 4) { p.target = null; sx = sy = 0; } else { sx = dx / L; sy = dy / L; }
    }
    if (p.act > 0) p.act = Math.max(0, p.act - dt);
    if (p.hurtT > 0) p.hurtT = Math.max(0, p.hurtT - dt);
    if (p.flash > 0) p.flash = Math.max(0, p.flash - dt);
    const mag = Math.min(1, Math.hypot(sx, sy));
    if (mag < 0.05) { p.moving = false; return false; }
    const vx = sx * SPEED_X * speedMul, vy = sy * SPEED_Y * speedMul;
    const gdx = ((vx / A + vy / B) / 2) * dt, gdy = ((vy / B - vx / A) / 2) * dt;
    let moved = false;
    if (!BI.World.blocked(map, p.x + gdx, p.y, P_RAD, 'player')) { p.x += gdx; moved = true; }
    if (!BI.World.blocked(map, p.x, p.y + gdy, P_RAD, 'player')) { p.y += gdy; moved = true; }
    if (!moved) p.target = null;
    if (vx > 4) p.facing = 1; else if (vx < -4) p.facing = -1;
    p.back = vy < -20 && Math.abs(vy) > Math.abs(vx) * 0.6;
    p.moving = moved;
    if (moved) p.walk += dt * mag;
    return moved;
  }

  function makeZombie(type, x, y) {
    const T = BI.Data.ZOMBIES[type];
    return { type, x, y, hp: T.hp, maxHp: T.hp, state: 'idle', wander: { x: 0, y: 0, t: Math.random() * 2 }, atkT: 0, hitT: 0, dead: false, deadT: 0, facing: 1, walk: Math.random() * 5, moving: false, stuckT: 0, alerted: false, seed: Math.random() };
  }

  /** Zombie AI tick. game provides: player, map, night, hurtPlayer(dmg, z), hitStructure(obj, dmg). */
  function updateZombie(z, dt, game) {
    const T = BI.Data.ZOMBIES[z.type];
    if (z.dead) { z.deadT += dt; return; }
    if (z.hitT > 0) z.hitT -= dt;
    if (z.atkT > 0) z.atkT -= dt;
    const p = game.player, map = game.map;
    const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy);
    const aggro = game.night ? 7 : 5;
    if (z.state === 'idle' && (d < aggro || z.alerted) && !game.playerDead) { z.state = 'chase'; if (BI.Audio) BI.Audio.playZombie(); }
    if (z.state === 'chase' && (d > 13 || game.playerDead)) { z.state = 'idle'; z.alerted = false; }
    let mx = 0, my = 0, spd = T.speed;
    if (z.state === 'chase') {
      if (d > 0.75) { mx = dx / d; my = dy / d; }
      if (d < 0.9 && z.atkT <= 0) {
        z.atkT = T.rate;
        z.lunge = 0.25;
        game.hurtPlayer(T.dmg, z);
      }
    } else {
      z.wander.t -= dt;
      if (z.wander.t <= 0) {
        z.wander.t = 1.5 + Math.random() * 3;
        if (Math.random() < 0.4) { z.wander.x = 0; z.wander.y = 0; } else {
          const a = Math.random() * Math.PI * 2;
          z.wander.x = Math.cos(a); z.wander.y = Math.sin(a);
        }
      }
      mx = z.wander.x; my = z.wander.y; spd *= 0.35;
    }
    if (z.lunge > 0) z.lunge -= dt;
    // separation from other zombies
    const zs = map.zombies;
    for (let i = 0; i < zs.length; i++) {
      const o = zs[i];
      if (o === z || o.dead) continue;
      const ox = z.x - o.x, oy = z.y - o.y, od = Math.hypot(ox, oy);
      if (od > 0 && od < 0.55) { mx += (ox / od) * 0.8; my += (oy / od) * 0.8; }
    }
    const L = Math.hypot(mx, my);
    z.moving = false;
    if (L > 0.01) {
      mx /= Math.max(1, L); my /= Math.max(1, L);
      const sx = mx * spd * dt, sy = my * spd * dt;
      let moved = false;
      if (!BI.World.blocked(map, z.x + sx, z.y, Z_RAD, 'zombie')) { z.x += sx; moved = true; }
      if (!BI.World.blocked(map, z.x, z.y + sy, Z_RAD, 'zombie')) { z.y += sy; moved = true; }
      const scr = (mx - my);
      if (scr > 0.05) z.facing = 1; else if (scr < -0.05) z.facing = -1;
      if (moved) { z.moving = true; z.walk += dt * spd; z.stuckT = 0; }
      else if (z.state === 'chase') {
        z.stuckT += dt;
        // blocked: hit whatever is in the way (player-built walls), or sidestep
        const cx = Math.floor(z.x + Math.sign(mx) * 0.6), cy = Math.floor(z.y + Math.sign(my) * 0.6);
        const ob = BI.World.objAt(map, cx, cy) || BI.World.objAt(map, Math.floor(z.x + Math.sign(mx) * 0.6), Math.floor(z.y)) || BI.World.objAt(map, Math.floor(z.x), Math.floor(z.y + Math.sign(my) * 0.6));
        if (ob && ob.k === 'build' && z.atkT <= 0) {
          z.atkT = T.rate;
          z.lunge = 0.25;
          game.hitStructure(ob, T.dmg);
        } else if (z.stuckT > 0.6) {
          const a = Math.random() * Math.PI * 2;
          z.wander.x = Math.cos(a); z.wander.y = Math.sin(a);
          const ex = z.wander.x * spd * 0.3, ey = z.wander.y * spd * 0.3;
          if (!BI.World.blocked(map, z.x + ex, z.y + ey, Z_RAD, 'zombie')) { z.x += ex; z.y += ey; }
          z.stuckT = 0.3;
        }
      }
    }
  }

  // ---------------- drawing ----------------
  function heldItem(ctx, kind, act) {
    // drawn in hand-local space: handle along +y
    ctx.lineCap = 'round';
    if (kind === 'axe' || kind === 'iron_axe') {
      ctx.fillStyle = '#8a5527'; ctx.fillRect(-1.2, -2, 2.4, 15);
      D.poly(ctx, [[0, 9], [6, 7], [7, 13], [0, 13]], kind === 'iron_axe' ? '#c9d0dd' : '#8c93a3');
    } else if (kind === 'pick' || kind === 'iron_pick') {
      ctx.fillStyle = '#8a5527'; ctx.fillRect(-1.2, -2, 2.4, 15);
      ctx.strokeStyle = kind === 'iron_pick' ? '#c9d0dd' : '#8c93a3'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-6, 15); ctx.quadraticCurveTo(0, 10, 6, 15); ctx.stroke();
    } else if (kind === 'club') {
      ctx.fillStyle = '#9a6a3a';
      ctx.beginPath(); ctx.moveTo(-1.2, -2); ctx.lineTo(1.2, -2); ctx.lineTo(2.6, 16); ctx.lineTo(-2.6, 16); ctx.closePath(); ctx.fill();
    } else if (kind === 'machete') {
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(-1.2, -2, 2.4, 5);
      D.poly(ctx, [[-1.4, 3], [1.6, 3], [2.4, 18], [-0.6, 16]], '#d6dde8');
    } else if (kind === 'pistol') {
      ctx.fillStyle = '#2b2e36'; ctx.fillRect(-1.5, 2, 3, 9); ctx.fillRect(-1.5, 0, 3.5, 4);
    } else if (kind === 'rifle') {
      ctx.fillStyle = '#2b2e36'; ctx.fillRect(-1.3, -4, 2.6, 22);
      ctx.fillStyle = '#7a4a24'; ctx.fillRect(-1.8, -6, 3.6, 6);
    } else if (kind === 'hand') {
      // nothing
    }
  }

  /** Survivor with feet at (x, y). kind: what is in hand. */
  function drawPlayer(ctx, p, x, y, t, kind) {
    const cyc = p.walk * 11;
    const bob = p.moving ? -Math.abs(Math.sin(cyc)) * 3 : Math.sin(t * 2.2) * 0.7;
    const swing = p.act > 0 ? Math.sin((1 - p.act / 0.35) * Math.PI) : 0;
    D.shadow(ctx, x, y, 12, 5, 0.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.facing, 1);
    const l1 = p.moving ? Math.sin(cyc) * 3 : 0;
    ctx.fillStyle = '#2f3a52';
    D.roundRect(ctx, -6 + l1 * 0.3, -11 + bob * 0.3, 5, 10, 2); ctx.fill();
    D.roundRect(ctx, 1 - l1 * 0.3, -11 + bob * 0.3, 5, 10, 2); ctx.fill();
    D.ellipse(ctx, -3.5 + l1 * 0.6, -1, 3.6, 2.2, '#3a2a1e');
    D.ellipse(ctx, 3.5 - l1 * 0.6, -1, 3.6, 2.2, '#3a2a1e');
    const by = bob;
    if (!p.back) {
      D.roundRect(ctx, -14, -28 + by, 10, 16, 3.5); ctx.fillStyle = '#6b4a2a'; ctx.fill();
      D.roundRect(ctx, -14, -28 + by, 10, 4, 2); ctx.fillStyle = '#4e351e'; ctx.fill();
      ctx.fillStyle = '#c9a050'; ctx.fillRect(-12, -20 + by, 6, 1.5);
    }
    const jg = ctx.createLinearGradient(-8, 0, 8, 0);
    jg.addColorStop(0, p.flash > 0 ? '#ff8a8a' : '#6b7a42');
    jg.addColorStop(1, p.flash > 0 ? '#c44' : '#46522a');
    D.roundRect(ctx, -8, -27 + by, 16, 17, 5); ctx.fillStyle = jg; ctx.fill();
    ctx.fillStyle = '#3a4222'; ctx.fillRect(-0.6, -26 + by, 1.2, 15);
    if (p.back) {
      D.roundRect(ctx, -9, -29 + by, 18, 18, 5); ctx.fillStyle = '#6b4a2a'; ctx.fill();
      D.roundRect(ctx, -9, -29 + by, 18, 5, 3); ctx.fillStyle = '#4e351e'; ctx.fill();
      ctx.fillStyle = '#c9a050'; ctx.fillRect(-5, -20 + by, 10, 1.5);
    }
    D.circle(ctx, -8, -18 + by, 3.2, '#e8b890');
    // weapon arm
    ctx.save();
    ctx.translate(8, -22 + by);
    const ranged = kind === 'pistol' || kind === 'rifle';
    let ang = -0.2;
    if (ranged) ang = -1.45 + (swing > 0 ? -0.08 : 0);
    else if (p.act > 0) ang = 0.6 - swing * 2.4;
    ctx.rotate(ang);
    D.roundRect(ctx, -2.5, 0, 5, 9, 2.5); ctx.fillStyle = '#5a6838'; ctx.fill();
    D.circle(ctx, 0, 9, 3.1, '#e8b890');
    ctx.save();
    ctx.translate(0, 9);
    heldItem(ctx, kind, p.act);
    if (ranged && p.act > 0.25) {
      const L = kind === 'rifle' ? 20 : 12;
      D.circle(ctx, 0, L, 4, '#ffd34d');
      D.circle(ctx, 0, L, 2, '#ffffff');
    }
    ctx.restore();
    ctx.restore();
    // head
    const hy = -40 + by;
    const hg = ctx.createRadialGradient(-4, hy - 5, 2, 0, hy, 14);
    hg.addColorStop(0, '#f5d0a8');
    hg.addColorStop(1, '#d9a07a');
    ctx.beginPath(); ctx.arc(0, hy, 13, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
    if (!p.back) {
      const blink = (t % 3.9) < 0.12;
      if (blink) { ctx.fillStyle = '#2b1a10'; ctx.fillRect(1, hy + 1, 4, 1.5); ctx.fillRect(8, hy + 1, 4, 1.5); }
      else { D.ellipse(ctx, 3, hy + 1, 2, 2.8, '#2b1a10'); D.ellipse(ctx, 9.5, hy + 1, 2, 2.8, '#2b1a10'); D.circle(ctx, 3.7, hy, 0.8, '#fff'); D.circle(ctx, 10.2, hy, 0.8, '#fff'); }
      ctx.strokeStyle = '#7a4a30'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(4, hy + 6.5); ctx.lineTo(9, hy + 6); ctx.stroke();
      ctx.fillStyle = 'rgba(80,50,30,0.35)'; ctx.fillRect(-2, hy + 5, 13, 4);
    } else {
      D.ellipse(ctx, 0, hy + 2, 12, 10, '#4a3020');
    }
    // cap
    ctx.beginPath(); ctx.ellipse(0, hy - 6, 13.5, 9.5, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#4a5530'; ctx.fill();
    if (!p.back) { ctx.beginPath(); ctx.ellipse(9, hy - 5, 9, 3.2, 0, 0, Math.PI * 2); ctx.fillStyle = '#3a4425'; ctx.fill(); }
    D.ellipse(ctx, -4, hy - 11, 3.5, 1.6, 'rgba(255,255,255,0.18)');
    ctx.restore();
  }

  function drawZombie(ctx, z, x, y, t) {
    const T = BI.Data.ZOMBIES[z.type];
    const s = T.scale;
    if (z.dead) {
      const k = Math.min(1, z.deadT / 0.4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (z.deadT - 1.2) / 0.8);
      ctx.translate(x, y);
      D.ellipse(ctx, 0, 0, 16 * s, 6 * s, 'rgba(90,20,20,0.5)');
      ctx.rotate(k * 1.4 * z.facing);
      ctx.scale(s, s * (1 - k * 0.3));
      D.roundRect(ctx, -7, -24, 14, 16, 4); ctx.fillStyle = T.shirt; ctx.fill();
      D.circle(ctx, 0, -32, 10, T.skin);
      ctx.restore();
      return;
    }
    const flash = z.hitT > 0;
    const cyc = z.walk * 6;
    const bob = z.moving ? -Math.abs(Math.sin(cyc)) * 2.5 : Math.sin(t * 1.5 + z.seed * 9) * 0.8;
    const lean = z.lunge > 0 ? 0.25 : 0.12;
    D.shadow(ctx, x, y, 12 * s, 5 * s, 0.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(z.facing * s, s);
    const skin = flash ? '#ffffff' : T.skin;
    const shirt = flash ? '#ffdddd' : T.shirt;
    const l1 = z.moving ? Math.sin(cyc) * 3 : 0;
    ctx.fillStyle = flash ? '#fff' : '#3d3a33';
    D.roundRect(ctx, -6 + l1 * 0.3, -11, 5, 10, 2); ctx.fill();
    D.roundRect(ctx, 1 - l1 * 0.3, -11, 5, 10, 2); ctx.fill();
    ctx.save();
    ctx.translate(0, -10);
    ctx.rotate(lean);
    // back arm
    ctx.save(); ctx.translate(-4, -12 + bob); ctx.rotate(-1.35 + Math.sin(cyc + 1) * 0.15);
    D.roundRect(ctx, -2.2, 0, 4.4, 14, 2); ctx.fillStyle = skin; ctx.fill(); ctx.restore();
    // torso (torn shirt)
    D.roundRect(ctx, -8, -17 + bob, 16, 17, 5); ctx.fillStyle = shirt; ctx.fill();
    D.poly(ctx, [[-8, -2 + bob], [-4, -5 + bob], [-1, -1 + bob], [3, -4 + bob], [8, -1 + bob], [8, 0 + bob], [-8, 0 + bob]], skin);
    D.ellipse(ctx, 3, -10 + bob, 2.5, 3, 'rgba(120,20,20,0.6)');
    // front arm reaching forward
    ctx.save(); ctx.translate(5, -12 + bob); ctx.rotate(-1.45 + Math.sin(cyc) * 0.15 - (z.lunge > 0 ? 0.3 : 0));
    D.roundRect(ctx, -2.2, 0, 4.4, 15, 2); ctx.fillStyle = skin; ctx.fill(); ctx.restore();
    // head
    const hy = -27 + bob;
    D.circle(ctx, 2, hy, 11, skin);
    D.ellipse(ctx, -2, hy - 6, 6, 3, flash ? '#fff' : D.shade(T.skin, -0.25));
    D.circle(ctx, 5, hy, 2.2, '#ff3b3b');
    D.circle(ctx, 10, hy + 0.5, 1.8, '#ff3b3b');
    ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(4, hy + 6); ctx.lineTo(7, hy + 5); ctx.lineTo(10, hy + 6.5); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // hp bar
    if (z.hp < z.maxHp) {
      const w = 26 * s, yy = y - 54 * s;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - w / 2, yy, w, 4);
      ctx.fillStyle = '#ff4d4d';
      ctx.fillRect(x - w / 2, yy, w * Math.max(0, z.hp / z.maxHp), 4);
    }
  }

  BI.Entities = { P_RAD, Z_RAD, makePlayer, updatePlayer, makeZombie, updateZombie, drawPlayer, drawZombie };
})();
