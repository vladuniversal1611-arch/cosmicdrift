/* ==========================================================================
   08_game.js — the gameplay screen.

   The engine (Core.Board) resolves a shot instantly and returns an ordered
   event list. This module is presentation only: it animates the projectile,
   then plays the events back one by one on a display copy of the board
   (disp), so what the player sees always ends exactly in the engine state.

   All sequencing uses the game clock (wait(ms)) so pausing freezes every
   animation consistently.
   ========================================================================== */
'use strict';

const Game = (() => {
  const G = Core;
  const TAU = Math.PI * 2;

  let level = null, board = null, disp = [];
  let moves = 0, movesUsed = 0, score = 0, combo = 0, continues = 0;
  let ammo = [], forcedAmmo = [], bombArmed = false;
  let mode = 'aim';                 // aim | hammer | color
  let busy = false, over = false, paused = false, active = false, skipFast = false;
  let projectile = null;
  let aiming = false, aimDir = null, aimTrace = null, aimAlpha = 0;
  let scroll = 0, clock = 0, timers = [];
  let particles = [], texts = [], fallers = [], flyers = [], movers = [], rings = [], rockets = [];
  let land = {}, wob = {};
  let shake = 0, flash = 0, recoil = 0, swapAnim = 0;
  let bossFx = { hit: 0, attack: 0, dead: 0, dmg: [] }, bossShownHp = 0;
  const lumi = { mood: 'happy', moodT: 0, x: 0, y: 0 };
  let hint = null, suggest = null, idleT = 0, almostCd = 0;
  let shownGoal = 0, stats0 = null, bg = null;
  let W = 0, H = 0, R = 18, bx = 0, top = 0, shooterX = 0, shooterY = 0, viewU = 30;

  function wait(ms) { return new Promise((res) => timers.push({ t: clock + (skipFast ? ms * 0.15 : ms), res })); }
  const px = (xu) => bx + xu * R;
  const py = (yu) => top + (yu - scroll) * R;
  const kx = (k) => px(G.kx(k));
  const ky = (k) => py(G.ky(k));
  const shooterU = () => ({ x: 11, y: scroll + (shooterY - top) / R });

  // ---------------------------------------------------------------- layout
  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    const sf = UI.safe();
    const hudH = sf.t + 92, barH = sf.b + 98;
    R = Math.min((W - 10) / G.W, (H - hudH - barH - 130) / 30);
    bx = (W - G.W * R) / 2;
    top = hudH + 8 + (level && level.boss ? R * 5.2 : 0);
    shooterY = H - barH - R * 2.4;
    shooterX = bx + 11 * R;
    viewU = (shooterY - top) / R - 5.2;
    lumi.x = shooterX - R * 5.6; lumi.y = shooterY + R * 0.4;
    Art.setDpr(Math.min(window.devicePixelRatio || 1, 2.5));
    bg = null;
  }
  function buildBg() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    bg = document.createElement('canvas'); bg.width = Math.ceil(W * d); bg.height = Math.ceil(H * d);
    const g = bg.getContext('2d'); g.scale(d, d);
    Art.scene(g, W, H, level.area, { horizon: 0.3, dim: 0.12 });
    const x0 = bx - R * 0.5, y0 = top - R * 0.6 - (level.boss ? R * 5 : 0), w0 = G.W * R + R, h0 = shooterY - R * 3.1 - y0;
    g.save();
    g.shadowColor = 'rgba(0,0,30,0.45)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    Art.rr(g, x0, y0, w0, h0, R * 1.1);
    const pg = g.createLinearGradient(0, y0, 0, y0 + h0);
    pg.addColorStop(0, 'rgba(18,34,86,0.78)'); pg.addColorStop(1, 'rgba(26,52,120,0.55)');
    g.fillStyle = pg; g.fill();
    g.restore();
    // wooden frame with a gold inner line and leafy corners
    g.save();
    Art.rr(g, x0, y0, w0, h0, R * 1.1);
    g.lineWidth = R * 0.55; g.strokeStyle = '#8a5a2e'; g.stroke();
    g.lineWidth = R * 0.3; g.strokeStyle = '#c98a4e'; g.stroke();
    Art.rr(g, x0 + R * 0.3, y0 + R * 0.3, w0 - R * 0.6, h0 - R * 0.6, R * 0.85);
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,215,120,0.65)'; g.stroke();
    for (const [cx, cy, dd] of [[x0 + R * 0.5, y0 + R * 0.3, 1], [x0 + w0 - R * 0.5, y0 + R * 0.3, -1]]) {
      for (let i = 0; i < 5; i++) {
        g.save(); g.translate(cx, cy); g.rotate((dd > 0 ? 0 : Math.PI) + (i - 2) * 0.45 * dd);
        const lg = g.createLinearGradient(0, 0, R * 1.6, 0); lg.addColorStop(0, '#3f9a33'); lg.addColorStop(1, '#8ad65a');
        g.fillStyle = lg; g.beginPath(); g.ellipse(R * 0.8, 0, R * 0.85, R * 0.32, 0, 0, TAU); g.fill();
        g.restore();
      }
    }
    // stone platform under the cannon
    const pgy = shooterY + R * 1.6;
    const sg = g.createRadialGradient(shooterX, pgy, 0, shooterX, pgy, R * 6);
    sg.addColorStop(0, 'rgba(255,245,200,0.35)'); sg.addColorStop(1, 'rgba(255,245,200,0)');
    g.fillStyle = sg; g.beginPath(); g.ellipse(shooterX, pgy, R * 6, R * 1.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#b8a88a'; g.beginPath(); g.ellipse(shooterX, pgy + R * 0.3, R * 4.2, R, 0, 0, TAU); g.fill();
    g.fillStyle = '#d9cbb0'; g.beginPath(); g.ellipse(shooterX, pgy, R * 4.2, R * 0.95, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,100,70,0.5)'; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.beginPath(); g.moveTo(shooterX + Math.cos(a) * R * 1.6, pgy + Math.sin(a) * R * 0.36); g.lineTo(shooterX + Math.cos(a) * R * 4.1, pgy + Math.sin(a) * R * 0.92); g.stroke(); }
    g.restore();
  }

  // ---------------------------------------------------------------- start
  function start(id, pre) {
    level = Levels.get(id);
    board = new G.Board(level, (Date.now() & 0xffffff) ^ (id * 2654435761));
    disp = board.cells.map(G.copyCell);
    moves = level.moves + (pre.includes('moves3') ? 3 : 0);
    movesUsed = 0; score = 0; combo = 0; continues = 0;
    forcedAmmo = level.ammo ? level.ammo.map((c) => ({ t: 'color', c })) : [];
    ammo = [];
    if (pre.includes('rainbow')) ammo.push({ t: 'rainbow' });
    if (pre.includes('fireball')) ammo.push({ t: 'fireball' });
    while (ammo.length < 2) ammo.push(nextAmmo());
    bombArmed = false; mode = 'aim'; busy = false; over = false; paused = false; active = true; skipFast = false;
    projectile = null; aiming = false; aimTrace = null;
    particles = []; texts = []; fallers = []; flyers = []; movers = []; rings = []; rockets = [];
    land = {}; wob = {}; shake = 0; flash = 0; recoil = 0; timers = []; clock = 0;
    bossFx = { hit: 0, attack: 0, dead: 0, dmg: [] }; bossShownHp = board.boss ? board.boss.hp : 0;
    hint = null; suggest = null; idleT = 0; almostCd = 0;
    stats0 = JSON.parse(JSON.stringify(board.stats));
    shownGoal = board.progress().cur;
    layout();
    scroll = computeScroll();
    lumi.mood = 'happy';
    if (level.hint) setHint(level.hint);
    if (level.id === 1) suggest = findSuggestion();
    UI.syncGameHud();
  }
  function nextAmmo() { return forcedAmmo.length ? forcedAmmo.shift() : { t: 'color', c: board.nextColor() }; }
  function lowestDisp() {
    for (let r = G.MAXR - 1; r >= 0; r--) for (let c = 0; c < G.rowLen(r); c++) if (disp[G.key(r, c)]) return r;
    return -1;
  }
  function computeScroll() { const low = lowestDisp(); return low < 0 ? 0 : Math.max(0, G.cy(low) + 1 - viewU); }

  // ---------------------------------------------------------------- hints
  function setHint(key) { hint = { key, text: t('hint.' + key) }; }
  function clearHint(key) { if (hint && (!key || hint.key === key)) hint = null; }
  // 1-ply search for a good shot (used for the tutorial hand and idle help).
  function findSuggestion() {
    const su = shooterU(), a0 = ammo[0];
    if (!a0 || a0.t !== 'color') return null;
    let best = null;
    for (let a = 12; a <= 168; a += 1.5) {
      const rad = (a * Math.PI) / 180;
      const tr = board.trace(su.x, su.y, Math.cos(rad), -Math.sin(rad));
      if (tr.land < 0) continue;
      const c = board.clone();
      c.cells[tr.land] = { t: 'n', c: a0.c };
      const g = c.flood(tr.land, a0.c).length - (tr.bounces ? 0.5 : 0);
      if (!best || g > best.g) best = { g, tr };
    }
    return best && best.g >= 3 ? best : null;
  }

  // ---------------------------------------------------------------- input
  function pointer(type, x, y) {
    if (!active || paused) return;
    if (over) { if (type === 'down') skipFast = true; return; }
    idleT = 0;
    if (type === 'down') {
      const dx = x - shooterX, dy = y - shooterY;
      const nx = x - (shooterX + R * 2.9), ny = y - (shooterY + R * 0.8);
      if (!busy && mode === 'aim' && (dx * dx + dy * dy < (R * 1.6) ** 2 || nx * nx + ny * ny < (R * 1.3) ** 2)) { swap(); return; }
      if (mode === 'hammer') { if (!busy) hammerAt(x, y); return; }
      if (mode !== 'aim' || busy || y > shooterY + R * 0.5) return;
      aiming = true; updateAim(x, y);
    } else if (type === 'move') {
      if (aiming) updateAim(x, y);
    } else if (type === 'up') {
      if (!aiming) return;
      aiming = false;
      if (aimDir && aimTrace && !busy && mode === 'aim' && y < shooterY + R * 0.5) fire();
      aimTrace = null; aimDir = null;
    } else { aiming = false; aimTrace = null; }
  }
  function updateAim(x, y) {
    const su = shooterU();
    const dx = (x - bx) / R - su.x, dy = (y - top) / R + scroll - su.y;
    let ang = Math.atan2(-dy, dx);
    if (ang < 0) ang = dx >= 0 ? 0 : Math.PI;
    const minA = (7 * Math.PI) / 180;
    ang = U.clamp(ang, minA, Math.PI - minA);
    aimDir = { x: Math.cos(ang), y: -Math.sin(ang), a: ang };
    aimTrace = board.trace(su.x, su.y, aimDir.x, aimDir.y, ammo[0] && ammo[0].t === 'fireball');
  }
  function swap() {
    if (ammo.length < 2 || bombArmed) return;
    const tmp = ammo[0]; ammo[0] = ammo[1]; ammo[1] = tmp;
    swapAnim = 1; Audio.play('swap'); clearHint('swap');
  }

  // ---------------------------------------------------------------- firing
  function fire() {
    const tr = aimTrace, cur = ammo[0];
    if (!cur || (cur.t !== 'fireball' && tr.land < 0)) return;
    let shotAmmo = cur;
    if (bombArmed) {
      if (cur.t === 'color' && State.useBooster('bomb')) shotAmmo = { t: 'bomb', c: cur.c };
      bombArmed = false; UI.boosterMode(null); UI.syncBoosters();
    }
    busy = true;
    moves--; movesUsed++;
    ammo.shift();
    suggest = null; clearHint('aim'); clearHint('bank');
    projectile = { pts: tr.pts, seg: 0, x: tr.pts[0].x, y: tr.pts[0].y, ammo: shotAmmo, tr, trail: [] };
    recoil = 1;
    Audio.play('shoot'); Audio.vib(8);
    UI.syncGameHud();
  }
  function stepProjectile(dt) {
    const p = projectile;
    let dist = (p.ammo.t === 'fireball' ? 52 : 64) * dt;
    while (dist > 0 && p.seg < p.pts.length - 1) {
      const a = p.pts[p.seg + 1];
      const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy);
      if (d <= dist) { p.x = a.x; p.y = a.y; dist -= d; p.seg++; if (p.seg < p.pts.length - 1) { Audio.play('bounce'); addRing(px(p.x), py(p.y), R * 0.8, '#ffffff', 0.25); } }
      else { p.x += (dx / d) * dist; p.y += (dy / d) * dist; dist = 0; }
    }
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 14) p.trail.shift();
    if (p.ammo.t === 'fireball') spawn(px(p.x), py(p.y), { vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.45, size: R * 0.35, col: Math.random() < 0.5 ? '#ffb030' : '#ff5a2a', grow: -1 });
    if (p.seg >= p.pts.length - 1) { projectile = null; resolve(p); }
  }

  async function resolve(p) {
    const res = board.shoot(p.ammo, p.tr);
    const popped = res.popGroup >= 3 || p.ammo.t === 'fireball' || p.ammo.t === 'bomb';
    if (popped && res.removed > 0) combo++; else combo = 0;
    if (combo === 3) State.track('combos3', 1);
    Audio.play('land');
    await playEvents(res.ev, Math.max(1, combo));
    if (combo >= 2) { addText(W / 2, top + viewU * R * 0.45, t('combo', { n: combo }), '#ffd84a', 1.4 + Math.min(combo, 6) * 0.08); Audio.play('combo', combo); lumiMood('wow', 1.2); }
    if (combo === 5) { ammo[1] = { t: 'rainbow' }; addText(shooterX, shooterY - R * 3.5, t('lumiGift'), '#ffffff', 1); Audio.play('magic'); }
    if (res.removed >= 12) praise(t('amazing'), '#ff7ad9');
    else if (res.removed >= 8) praise(t('great'), '#7fe6ff');
    else if (res.bounces > 0 && res.popGroup >= 3) praise(t('niceBank'), '#9dff7a');
    else if (res.popGroup === 0 && res.placedKey >= 0 && p.ammo.t === 'color' && almostCd <= 0 && board.flood(res.placedKey, p.ammo.c).length === 2) {
      addText(kx(res.placedKey), ky(res.placedKey) - R * 1.2, t('almost'), '#ffe8a8', 0.8); Audio.play('almost'); almostCd = 5;
    }
    almostCd--;
    if (level.id === 1) { if (res.removed > 0) clearHint('match'); else if (movesUsed === 1) setHint('match'); }
    if (ammo.length === 0) ammo.push(nextAmmo());
    if (ammo[0].t === 'color' && !board.hasColor(ammo[0].c) && board.colorCounts().some((n) => n > 0)) ammo[0] = { t: 'color', c: board.nextColor() };
    while (ammo.length < 2) ammo.push(nextAmmo());
    if (level.id === 3 && movesUsed === 2) setHint('swap');
    await afterTurn();
  }
  async function afterTurn() {
    syncDisp(); UI.syncGameHud();
    const pr = board.progress();
    if (pr.done) { await winSequence(); return; }
    if (moves <= 0) { over = true; await wait(350); lumiMood('sad', 99); UI.outOfMoves(pr, continues); return; }
    busy = false;
  }
  function syncDisp() {
    for (let k = 0; k < board.cells.length; k++) {
      const a = board.cells[k], b = disp[k];
      if (!a) disp[k] = null;
      else if (!b || b.t !== a.t || b.c !== a.c || b.hp !== a.hp) disp[k] = G.copyCell(a);
    }
    shownGoal = board.progress().cur;
  }

  // ---------------------------------------------------------------- event playback
  async function playEvents(ev, cmb) {
    let popIdx = 0;
    const objColor = level.objective.type === 'color' ? level.objective.color : -1;
    for (const e of ev) {
      switch (e.k) {
        case 'place':
          disp[e.key] = e.cell; land[e.key] = 1; ripple(e.key);
          if (e.rainbow) { sparkBurst(kx(e.key), ky(e.key), 14); Audio.play('magic'); }
          break;
        case 'pop':
          for (const it of e.list) {
            disp[it.key] = null;
            popFx(it.key, it.cell, popIdx++, cmb);
            score += 10 * cmb;
            if (popIdx % 2) addScore(kx(it.key), ky(it.key), 10 * cmb);
            if (it.cell.c === objColor) flyToGoal(kx(it.key), ky(it.key), { bubble: it.cell.c });
            await wait(26);
          }
          Audio.vib(12);
          break;
        case 'hit': disp[e.key] = e.cell; hitFx(e.key, e.cell); await wait(40); break;
        case 'melt': disp[e.key] = e.cell; addRing(kx(e.key), ky(e.key), R, '#bfeeff', 0.5); spawnShards(kx(e.key), ky(e.key), '#dff6ff', 8); Audio.play('melt'); await wait(40); break;
        case 'unchain':
          disp[e.key] = e.cell; spawnShards(kx(e.key), ky(e.key), '#c9ced9', 10); Audio.play('chain'); score += 50;
          if (level.objective.type === 'chains') flyToGoal(kx(e.key), ky(e.key), { icon: 'chain' });
          await wait(50); break;
        case 'unlock':
          for (const k of e.keys) { if (disp[k]) disp[k] = Object.assign({}, disp[k], { t: 'n' }); sparkBurst(kx(k), ky(k), 6, '#ffe27a'); }
          Audio.play('unlock'); await wait(120); break;
        case 'destroy': disp[e.key] = null; destroyFx(e.key, e.cell, e.cause); await wait(24); break;
        case 'explode':
          explodeFx(e.key); Audio.play('boom'); Audio.vib([20, 30, 40]); shake = Math.max(shake, R * 0.9); flash = 0.35;
          await wait(90); break;
        case 'drop': {
          e.list.forEach((it, i) => { disp[it.key] = null; spawnFaller(it.key, it.cell, i); score += 20 * cmb; });
          if (e.list.length >= 3) addScore(kx(e.list[0].key), ky(e.list[0].key), 20 * cmb * e.list.length, true);
          if (e.list.length >= 6) shake = Math.max(shake, R * 0.4);
          await wait(120);
          break;
        }
        case 'rotate': await rotateAnim(e); break;
        case 'spread': {
          disp[e.to] = { t: 'd', hp: 1 };
          for (let i = 0; i < 10; i++) spawn(U.lerp(kx(e.from), kx(e.to), i / 10), U.lerp(ky(e.from), ky(e.to), i / 10), { vy: -10, life: 0.6, size: R * 0.3, col: '#8b5cc7', grow: -1 });
          Audio.play('spread'); await wait(160); break;
        }
        case 'bossHit':
          bossFx.hit = 1; bossShownHp = e.hp; Audio.play('bossHit');
          bossFx.dmg.push({ n: e.dmg, life: 1, x: (Math.random() - 0.5) * R * 3 });
          await wait(60); break;
        case 'bossAttack': await bossAttackAnim(e); break;
        case 'bossDefeat':
          bossFx.dead = 0.001; Audio.play('boom'); setTimeout(() => Audio.play('win'), 300);
          shake = R * 1.2; flash = 0.6;
          for (let i = 0; i < 60; i++) spawn(W / 2, bossY(), { vx: (Math.random() - 0.5) * 700, vy: (Math.random() - 0.8) * 600, life: 1.2, size: R * (0.2 + Math.random() * 0.4), col: DATA.COLORS[i % 6].base, grav: 900 });
          await wait(900); break;
        case 'fire': Audio.play('boom'); shake = Math.max(shake, R * 0.5); break;
        case 'hammer': await hammerAnim(e.key); break;
        case 'colorBlast':
          Audio.play('magic'); flash = 0.3;
          for (const k of e.keys) sparkBurst(kx(k), ky(k), 3, DATA.COLORS[e.color].light);
          await wait(200); break;
      }
    }
  }
  function praise(txt, col) { addText(W / 2, top + viewU * R * 0.32, txt, col, 1.6); Audio.play('praise'); lumiMood('wow', 1.4); Audio.vib([10, 30, 10]); }
  function lumiMood(m, s) { lumi.mood = m; lumi.moodT = s; }

  // ---------------------------------------------------------------- fx (pooled arrays, hard caps)
  function spawn(x, y, o) {
    if (particles.length > 420) particles.shift();
    particles.push(Object.assign({ x, y, vx: 0, vy: 0, size: 4, col: '#fff', kind: 'dot', grav: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, grow: 0 }, o, { life: o.life || 1, max: o.life || 1 }));
  }
  function spawnShards(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 120 + Math.random() * 260; spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.55 + Math.random() * 0.3, size: R * (0.18 + Math.random() * 0.2), col, kind: 'shard', grav: 900 }); } }
  function sparkBurst(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = 60 + Math.random() * 200; spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, size: R * (0.2 + Math.random() * 0.25), col: col || '#fff6b0', kind: 'spark' }); } }
  function addRing(x, y, r, col, life) { if (rings.length < 40) rings.push({ x, y, r, col, life: life || 0.4, max: life || 0.4 }); }
  function addText(x, y, txt, col, scale) { texts.push({ x, y, txt, col, scale: scale || 1, life: 1.3, max: 1.3, big: true }); }
  function addScore(x, y, n, big) { if (texts.length < 30) texts.push({ x, y, txt: '+' + n, col: '#ffffff', scale: big ? 0.85 : 0.55, life: 0.8, max: 0.8 }); }
  function ripple(key) {
    const x0 = G.kx(key), y0 = G.ky(key);
    for (let k = 0; k < disp.length; k++) {
      if (!disp[k] || k === key) continue;
      const dx = G.kx(k) - x0, dy = G.ky(k) - y0, d = Math.hypot(dx, dy);
      if (d < 7) wob[k] = { dx: dx / d, dy: dy / d, t: 0, delay: d * 0.025, amp: 0.28 / (1 + d * 0.6) };
    }
  }
  function popFx(key, cell, i, cmb) {
    const x = kx(key), y = ky(key);
    const col = DATA.COLORS[cell.c] || DATA.COLORS[i % 6];
    addRing(x, y, R * 1.3, col.light, 0.3);
    for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU + Math.random() * 0.5, s = 150 + Math.random() * 180; spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45, size: R * (0.22 + Math.random() * 0.18), col: j % 2 ? col.light : col.base, grav: 300, grow: -1 }); }
    spawn(x, y, { life: 0.22, size: R * 1.05, col: col.light, kind: 'pop' });
    Audio.play('pop', i, cmb);
  }
  function hitFx(key, cell) {
    const x = kx(key), y = ky(key);
    if (cell.t === 's') { spawnShards(x, y, '#9aa3b2', 7); Audio.play('crack'); }
    else if (cell.t === 'rot') { sparkBurst(x, y, 6, '#ffe27a'); Audio.play('crack'); }
    else { spawnShards(x, y, '#c9ced9', 5); Audio.play('chain'); }
    wob[key] = { dx: 0, dy: 1, t: 0, delay: 0, amp: 0.25 };
  }
  function destroyFx(key, cell, cause) {
    const x = kx(key), y = ky(key);
    switch (cell.t) {
      case 's': spawnShards(x, y, '#8d97a8', 14); Audio.play('crack'); score += 50; break;
      case 'rot': spawnShards(x, y, '#f0b429', 12); Audio.play('crack'); score += 60; break;
      case 'x': spawnShards(x, y, '#c38bff', 14); sparkBurst(x, y, 10, '#e6c6ff'); Audio.play('shatter'); score += 80; flyToGoal(x, y, { icon: 'x' }); break;
      case 'st': sparkBurst(x, y, 12, '#ffe27a'); Audio.play('collect'); score += 80; flyToGoal(x, y, { icon: 'st' }); break;
      case 'f': freeButterfly(x, y); Audio.play('rescue'); score += 80; break;
      case 'k': sparkBurst(x, y, 16, '#ffe27a'); Audio.play('unlock'); score += 60; break;
      case 'b': score += 40; break;
      case 'd': spawnShards(x, y, '#5a3a8a', 10); Audio.play('crack'); score += 40; break;
      case 'm': freeCritter(x, y, cell.cr); break;
      case 'ch': spawnShards(x, y, '#c9ced9', 8); if (level.objective.type === 'chains') flyToGoal(x, y, { icon: 'chain' }); break;
      default: {
        const col = DATA.COLORS[cell.c] || DATA.COLORS[0];
        spawnShards(x, y, col.base, 6); spawn(x, y, { life: 0.22, size: R, col: col.light, kind: 'pop' });
        if (cause === 'burn') for (let i = 0; i < 6; i++) spawn(x, y, { vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, life: 0.5, size: R * 0.35, col: i % 2 ? '#ffb030' : '#ff5a2a', grow: -1 });
        if (level.objective.type === 'color' && cell.c === level.objective.color) flyToGoal(x, y, { bubble: cell.c });
        score += 10;
      }
    }
  }
  function explodeFx(key) {
    const x = kx(key), y = ky(key);
    addRing(x, y, R * 4.5, '#ffb347', 0.45); addRing(x, y, R * 3, '#fff6b0', 0.35);
    for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, s = 200 + Math.random() * 380; spawn(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, size: R * (0.3 + Math.random() * 0.4), col: ['#ffb030', '#ff5a2a', '#fff6b0'][i % 3], grow: -1 }); }
    for (let i = 0; i < 8; i++) spawn(x, y, { vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 1.1, size: R * 0.9, col: 'rgba(120,110,140,0.5)', kind: 'smoke' });
  }
  function spawnFaller(key, cell, i) { fallers.push({ x: kx(key), y: ky(key), vx: (Math.random() - 0.5) * 120, vy: -120 - Math.random() * 120, cell, rot: 0, vr: (Math.random() - 0.5) * 6, delay: i * 0.018, bounced: false, life: 1 }); }
  function freeCritter(x, y, cr) { flyers.push({ kind: 'critter', cr, x0: x, y0: y, t: 0, dur: 1.25, target: UI.goalPoint() }); Audio.play('rescue'); sparkBurst(x, y, 16); lumiMood('wow', 1.2); score += 150; }
  function freeButterfly(x, y) { flyers.push({ kind: 'butterfly', x0: x, y0: y, t: 0, dur: 1.1, target: UI.goalPoint() }); sparkBurst(x, y, 10, '#ffc6f0'); }
  function flyToGoal(x, y, what) { if (flyers.length < 40) flyers.push(Object.assign({ kind: 'item', x0: x, y0: y, t: 0, dur: 0.75 + Math.random() * 0.2, target: UI.goalPoint() }, what)); }
  const bossY = () => top - R * 2.8;

  async function rotateAnim(e) {
    for (const m of e.moves) disp[m.from] = null;
    const list = e.moves.map((m) => ({ from: m.from, to: m.to, cell: m.cell, t: 0 }));
    movers.push(...list);
    Audio.play('rotate');
    await wait(280);
    for (const m of list) { disp[m.to] = m.cell; movers.splice(movers.indexOf(m), 1); }
  }
  async function bossAttackAnim(e) {
    bossFx.attack = 1; Audio.play('bossRoar'); lumiMood('sad', 1);
    await wait(380);
    e.keys.forEach((k, i) => flyers.push({ kind: 'orb', x0: W / 2, y0: bossY() + R * 1.2, t: -i * 0.06, dur: 0.45, tx: kx(k), ty: ky(k), cell: e.cells[i], attack: e.type }));
    await wait(700 + e.keys.length * 60);
    e.keys.forEach((k, i) => { disp[k] = e.cells[i]; });
    bossFx.attack = 0;
  }
  async function hammerAnim(key) {
    const x = kx(key), y = ky(key);
    flyers.push({ kind: 'hammer', x0: x, y0: y, t: 0, dur: 0.45 });
    await wait(300);
    Audio.play('hammer'); Audio.vib(40); shake = R * 0.6;
    addRing(x, y, R * 2.2, '#ffffff', 0.35);
    await wait(120);
  }

  // ---------------------------------------------------------------- boosters
  function useBooster(id) {
    if (!active || busy || over || paused || (State.s.boosters[id] || 0) <= 0) return false;
    if (id === 'hammer') { bombArmed = false; mode = mode === 'hammer' ? 'aim' : 'hammer'; UI.boosterMode(mode === 'hammer' ? 'hammer' : null); return true; }
    if (id === 'bomb') { mode = 'aim'; bombArmed = !bombArmed; UI.boosterMode(bombArmed ? 'bomb' : null); return true; }
    if (id === 'color') { bombArmed = false; mode = mode === 'color' ? 'aim' : 'color'; UI.boosterMode(mode === 'color' ? 'color' : null, presentColors()); return true; }
    if (id === 'shuffle') { doShuffle(); return true; }
    return false;
  }
  function cancelMode() { mode = 'aim'; bombArmed = false; UI.boosterMode(null); }
  function presentColors() { const out = []; board.colorCounts().forEach((n, i) => { if (n > 0) out.push(i); }); return out; }
  async function hammerAt(x, y) {
    const k = board.hitTest((x - bx) / R, (y - top) / R + scroll, 1.15);
    if (k < 0 || !State.useBooster('hammer')) return;
    mode = 'aim'; UI.boosterMode(null); UI.syncBoosters();
    busy = true; clearHint('hammer');
    await playEvents(board.hammer(k).ev, 1);
    await afterBooster();
  }
  async function colorBlast(c) {
    if (busy || !State.useBooster('color')) return;
    mode = 'aim'; UI.boosterMode(null); UI.syncBoosters();
    busy = true;
    await playEvents(board.colorBlast(c).ev, 1);
    await afterBooster();
  }
  async function doShuffle() {
    if (!State.useBooster('shuffle')) return;
    UI.syncBoosters();
    busy = true;
    const res = board.shuffle();
    Audio.play('magic'); flash = 0.25;
    for (const k of res.ev[0].keys) { wob[k] = { dx: 0, dy: -1, t: 0, delay: Math.random() * 0.2, amp: 0.4 }; sparkBurst(kx(k), ky(k), 1); }
    await wait(250);
    syncDisp();
    if (ammo[0].t === 'color' && !board.hasColor(ammo[0].c)) ammo[0] = nextAmmo();
    busy = false;
  }
  async function afterBooster() {
    syncDisp(); UI.syncGameHud();
    if (ammo[0] && ammo[0].t === 'color' && !board.hasColor(ammo[0].c) && board.colorCounts().some((n) => n > 0)) ammo[0] = { t: 'color', c: board.nextColor() };
    if (board.progress().done) { await winSequence(); return; }
    busy = false;
  }

  // ---------------------------------------------------------------- end of level
  async function winSequence() {
    over = true; busy = true;
    lumiMood('wow', 99);
    await wait(250);
    addText(W / 2, top + viewU * R * 0.4, t('levelComplete'), '#ffe27a', 1.7);
    Audio.play('win');
    await wait(900);
    // Bonus Blast: leftover moves become fireworks that add score. Tap = fast-forward.
    const n = Math.min(moves, 15);
    if (n > 0) {
      addText(W / 2, top + viewU * R * 0.55, t('bonusBlast'), '#9dff7a', 1.2);
      for (let i = 0; i < n; i++) {
        rockets.push({ x0: shooterX, y0: shooterY, tx: bx + (2 + Math.random() * 18) * R, ty: top + (2 + Math.random() * Math.min(viewU, 20)) * R, t: 0, dur: 0.45 });
        moves--; score += 150; UI.syncGameHud();
        Audio.play('shoot');
        await wait(150);
      }
      await wait(600);
    }
    finish(true);
  }
  function finish(won) {
    const s = board.stats, s0 = stats0;
    for (const k of ['popped', 'dropped', 'specials', 'rescued']) State.track(k, s[k] - s0[k]);
    stats0 = JSON.parse(JSON.stringify(s));
    skipFast = false;
    if (won) UI.levelWon({ level, stars: Levels.starsFor(level, movesUsed), score });
  }
  function continueWith(extra) { moves += extra; continues++; over = false; busy = false; lumiMood('happy', 1); UI.syncGameHud(); Audio.play('magic'); }
  function giveUp() { finish(false); active = false; }

  // ---------------------------------------------------------------- update
  function update(dt) {
    if (!active || paused) return;
    clock += dt * 1000;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= clock) { const tm = timers.splice(i, 1)[0]; tm.res(); }
    if (projectile) stepProjectile(dt);
    scroll += (computeScroll() - scroll) * Math.min(1, dt * 4);
    for (const p of particles) { p.life -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    particles = particles.filter((p) => p.life > 0);
    for (const r of rings) r.life -= dt;
    rings = rings.filter((r) => r.life > 0);
    for (const tx of texts) { tx.life -= dt; tx.y -= (tx.big ? 18 : 55) * dt; }
    texts = texts.filter((x) => x.life > 0);
    for (const f of fallers) {
      if (f.delay > 0) { f.delay -= dt; continue; }
      f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (!f.bounced && f.y > shooterY - R) {
        f.bounced = true; f.vy *= -0.35; f.vx *= 1.4;
        Audio.play('drop', Math.floor(Math.random() * 5));
        const c = f.cell;
        if (c.t === 'm') { freeCritter(f.x, f.y, c.cr); f.life = 0; }
        else if (c.t === 'st') { flyToGoal(f.x, f.y, { icon: 'st' }); Audio.play('collect'); f.life = 0; }
        else if (c.t === 'f') { freeButterfly(f.x, f.y); f.life = 0; }
        else if (c.t === 'x') { flyToGoal(f.x, f.y, { icon: 'x' }); f.life = 0; }
        else if (c.t === 'k') f.life = 0;
        else if (level.objective.type === 'color' && c.c === level.objective.color) flyToGoal(f.x, f.y, { bubble: c.c });
      }
      if (f.bounced) f.life -= dt * 1.6;
    }
    fallers = fallers.filter((f) => f.life > 0 && f.y < H + R * 3);
    for (const f of flyers) { f.t += dt; if (f.t >= f.dur && !f.done) { f.done = true; onFlyerArrive(f); } }
    flyers = flyers.filter((f) => !f.done);
    for (const m of movers) m.t = Math.min(1, m.t + dt / 0.28);
    for (const k in land) { land[k] -= dt * 4; if (land[k] <= 0) delete land[k]; }
    for (const k in wob) { const w = wob[k]; w.t += dt; if (w.t - w.delay > 0.5) delete wob[k]; }
    for (const r of rockets) {
      r.t += dt;
      if (r.t >= r.dur && !r.done) {
        r.done = true;
        const col = DATA.COLORS[Math.floor(Math.random() * 6)];
        for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, s = 150 + Math.random() * 150; spawn(r.tx, r.ty, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.7, size: R * 0.25, col: i % 2 ? col.light : col.base, kind: 'spark', grav: 200 }); }
        addScore(r.tx, r.ty, 150, true); Audio.play('pop', Math.floor(Math.random() * 8), 2);
      }
    }
    rockets = rockets.filter((r) => !r.done);
    shake = Math.max(0, shake - dt * R * 3);
    flash = Math.max(0, flash - dt * 1.5);
    recoil = Math.max(0, recoil - dt * 6);
    swapAnim = Math.max(0, swapAnim - dt * 5);
    bossFx.hit = Math.max(0, bossFx.hit - dt * 3);
    if (bossFx.dead > 0) bossFx.dead = Math.min(1, bossFx.dead + dt * 1.2);
    for (const d of bossFx.dmg) d.life -= dt;
    bossFx.dmg = bossFx.dmg.filter((d) => d.life > 0);
    if (lumi.moodT > 0) { lumi.moodT -= dt; if (lumi.moodT <= 0) lumi.mood = 'happy'; }
    if (!busy && !over && level.id <= 8 && !aiming) { idleT += dt; if (idleT > 7 && !suggest) suggest = findSuggestion(); }
    UI.animateGoal(shownGoal);
  }
  function onFlyerArrive(f) {
    if (f.kind === 'item' || f.kind === 'critter' || f.kind === 'butterfly') {
      shownGoal = Math.min(board.progress().cur, shownGoal + 1);
      UI.bumpGoal(); Audio.play('collect');
    } else if (f.kind === 'orb') {
      addRing(f.tx, f.ty, R * 1.2, f.attack === 'freeze' ? '#bfeeff' : '#c9a6ff', 0.3);
      spawnShards(f.tx, f.ty, f.attack === 'stone' ? '#9aa3b2' : '#b98bff', 5);
      Audio.play('land');
    }
  }

  // ---------------------------------------------------------------- draw
  function draw(ctx) {
    if (!level) return;
    if (!bg) buildBg();
    const T = clock / 1000;
    const sym = State.s.settings.symbols;
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.drawImage(bg, 0, 0, W, H);
    if (level.boss) drawBoss(ctx, T);
    ctx.save();
    ctx.beginPath(); ctx.rect(bx - R, top - R * 0.4, G.W * R + R * 2, shooterY - R * 3.2 - top + R * 0.4); ctx.clip();
    drawCells(ctx, T, sym);
    for (const m of movers) { const e = U.easeInOutCubic(m.t); Art.drawCell(ctx, U.lerp(kx(m.from), kx(m.to), e), U.lerp(ky(m.from), ky(m.to), e), R * 0.98, m.cell, T, sym); }
    ctx.restore();
    drawAim(ctx, T);
    drawSuggestion(ctx, T);
    if (projectile) {
      const p = projectile;
      const col = p.ammo.t === 'fireball' ? '#ffb030' : p.ammo.c != null ? DATA.COLORS[p.ammo.c].light : '#ffffff';
      p.trail.forEach((tr, i) => { const a = i / p.trail.length; ctx.globalAlpha = a * 0.35; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px(tr.x), py(tr.y), R * (0.3 + a * 0.55), 0, TAU); ctx.fill(); });
      ctx.globalAlpha = 1;
      drawAmmo(ctx, px(p.x), py(p.y), R, p.ammo, T);
    }
    for (const f of fallers) { ctx.save(); ctx.globalAlpha = U.clamp(f.life, 0, 1); ctx.translate(f.x, f.y); ctx.rotate(f.rot * 0.2); Art.drawCell(ctx, 0, 0, R * 0.98, f.cell, T, false); ctx.restore(); }
    drawParticles(ctx);
    drawFlyers(ctx, T);
    for (const r of rockets) {
      const k = U.easeOutCubic(Math.min(1, r.t / r.dur));
      const x = U.lerp(r.x0, r.tx, k), y = U.lerp(r.y0, r.ty, k) - Math.sin(k * Math.PI) * R * 3;
      ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x, y, R * 0.3, 0, TAU); ctx.fill();
      spawn(x, y, { vy: 30, life: 0.3, size: R * 0.2, col: '#ffcf5a', grow: -1 });
    }
    drawShooter(ctx, T);
    drawLumi(ctx, T);
    drawTexts(ctx);
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    if (mode === 'hammer') { ctx.fillStyle = 'rgba(10,20,50,0.18)'; ctx.fillRect(0, 0, W, H); }
  }
  function drawCells(ctx, T, sym) {
    const yMin = top - R * 1.5, yMax = shooterY;
    for (let k = 0; k < disp.length; k++) {
      const c = disp[k];
      if (!c) continue;
      let x = kx(k), y = ky(k);
      if (y < yMin || y > yMax) continue;
      const w = wob[k];
      if (w && w.t > w.delay) { const tt = w.t - w.delay, off = Math.sin(tt * 22) * Math.exp(-tt * 7) * w.amp * R; x += w.dx * off; y += w.dy * off; }
      if (land[k]) { const s = 1 + Math.sin(land[k] * Math.PI) * 0.18; ctx.save(); ctx.translate(x, y); ctx.scale(s, 2 - s); Art.drawCell(ctx, 0, 0, R * 0.98, c, T, sym); ctx.restore(); }
      else Art.drawCell(ctx, x, y, R * 0.98, c, T, sym);
    }
  }
  function drawAmmo(ctx, x, y, r, a, T) {
    if (!a) return;
    if (a.t === 'color') Art.blit(ctx, Art.bubbleSprite(r * 0.98, a.c, State.s.settings.symbols), x, y);
    else if (a.t === 'bomb') { Art.drawCell(ctx, x, y, r, { t: 'n', c: a.c }, T, false); Art.drawCell(ctx, x, y, r * 0.8, { t: 'b' }, T, false); }
    else if (a.t === 'rainbow') { ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2); Art.drawCell(ctx, 0, 0, r * 0.98, { t: 'w' }, T); ctx.restore(); }
    else if (a.t === 'fireball') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffcf3a'); g.addColorStop(0.7, '#ff6a2a'); g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.3 + Math.sin(T * 30) * r * 0.05, 0, TAU); ctx.fill();
    }
  }
  function drawAim(ctx, T) {
    if (!aiming || !aimTrace || busy) { aimAlpha = Math.max(0, aimAlpha - 0.2); return; }
    aimAlpha = Math.min(1, aimAlpha + 0.25);
    const pts = aimTrace.pts, a0 = ammo[0];
    const col = a0 && a0.t === 'color' ? DATA.COLORS[a0.c].light : a0 && a0.t === 'fireball' ? '#ffcf3a' : '#ffffff';
    // The preview fades shortly after the first bounce: skill still matters.
    let budget = 60; const spacing = 1.25; let off = (T * 3) % spacing;
    ctx.save(); ctx.globalAlpha = aimAlpha;
    for (let i = 0; i < pts.length - 1 && budget > 0; i++) {
      const a = pts[i], b = pts[i + 1], d = Math.hypot(b.x - a.x, b.y - a.y);
      for (let s = off; s < d && budget > 0; s += spacing) {
        const x = px(a.x + ((b.x - a.x) * s) / d), y = py(a.y + ((b.y - a.y) * s) / d), k = Math.max(0.25, budget / 60);
        ctx.fillStyle = 'rgba(0,0,40,0.35)'; ctx.beginPath(); ctx.arc(x, y + 1.5, R * 0.2 * k + 1, 0, TAU); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, R * 0.2 * k + 1, 0, TAU); ctx.fill();
        budget -= spacing;
      }
      off = (off - (d % spacing) + spacing) % spacing;
      if (i >= 1) budget = Math.min(budget, 14);
    }
    if (aimTrace.land >= 0 && a0 && a0.t !== 'fireball') {
      const x = kx(aimTrace.land), y = ky(aimTrace.land);
      ctx.globalAlpha = aimAlpha * (0.45 + Math.sin(T * 8) * 0.15);
      if (a0.t === 'color') Art.blit(ctx, Art.bubbleSprite(R * 0.98, a0.c, false), x, y); else Art.drawCell(ctx, x, y, R * 0.98, { t: 'w' }, T);
      ctx.globalAlpha = aimAlpha; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
  function drawSuggestion(ctx, T) {
    if (!suggest || aiming || busy || over) return;
    const tr = suggest.tr, k = (T * 0.8) % 1;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < tr.pts.length - 1; i++) {
      const a = tr.pts[i], b = tr.pts[i + 1], d = Math.hypot(b.x - a.x, b.y - a.y);
      for (let s = 0; s < d; s += 1.6) { ctx.beginPath(); ctx.arc(px(a.x + ((b.x - a.x) * s) / d), py(a.y + ((b.y - a.y) * s) / d), R * 0.13, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    const e = tr.pts[1] || tr.pts[0];
    drawHand(ctx, U.lerp(shooterX, px(e.x), 0.25 + k * 0.2), U.lerp(shooterY, py(e.y), 0.25 + k * 0.2) + R * 0.5, R * 1.3);
    if (tr.land >= 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6 + Math.sin(T * 6) * 0.3; ctx.beginPath(); ctx.arc(kx(tr.land), ky(tr.land), R * (1 + k * 0.3), 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  function drawHand(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3a2a5a'; ctx.lineWidth = s * 0.06;
    Art.rr(ctx, -s * 0.12, -s * 0.55, s * 0.24, s * 0.6, s * 0.12); ctx.fill(); ctx.stroke();
    Art.rr(ctx, -s * 0.3, -s * 0.05, s * 0.6, s * 0.45, s * 0.18); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function drawShooter(ctx, T) {
    const a0 = ammo[0];
    const ang = aiming && aimDir ? -aimDir.a : -Math.PI / 2;
    Art.cannon(ctx, shooterX, shooterY + R * 0.3, R * 1.9, State.s.skin, ang, recoil);
    if (!projectile && a0 && !over) {
      const mx = shooterX + Math.cos(ang) * R * 1.05, my = shooterY + R * 0.3 + Math.sin(ang) * R * 1.05;
      const sw = swapAnim > 0 ? U.lerp(1, 0.4, swapAnim) : 1;
      ctx.save(); ctx.translate(mx, my); ctx.scale(sw, sw);
      drawAmmo(ctx, 0, 0, R, bombArmed && a0.t === 'color' ? { t: 'bomb', c: a0.c } : a0, T);
      ctx.restore();
    }
    const nx = shooterX + R * 2.9, ny = shooterY + R * 0.8;
    ctx.save();
    ctx.fillStyle = 'rgba(20,40,90,0.55)'; ctx.strokeStyle = 'rgba(255,220,130,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(nx, ny, R * 0.92, 0, TAU); ctx.fill(); ctx.stroke();
    drawAmmo(ctx, nx, ny, R * 0.7, ammo[1], T);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(shooterX + R * 1.45, shooterY + R * 0.35, R * 0.75, -2.2, -0.9); ctx.stroke();
    ctx.restore();
  }
  function drawLumi(ctx, T) {
    const x = lumi.x + Math.sin(T * 0.9) * R * 0.3, y = lumi.y + Math.sin(T * 2.2) * R * 0.25 - R * 1.2;
    Art.character(ctx, x, y, R * 3.2, 'lumi', { t: T, mood: lumi.mood, blink: Math.sin(T * 1.3) > 0.985 });
    if (hint) drawSpeech(ctx, x, y - R * 1.6, hint.text, T);
  }
  function drawSpeech(ctx, x, y, text, T) {
    ctx.save();
    const fs = Math.max(13, R * 0.72);
    ctx.font = `800 ${fs}px ${UI.FONT}`;
    const maxW = Math.min(W * 0.62, 260);
    const lines = []; let cur = '';
    for (const w of text.split(' ')) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur);
    const lw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + fs * 1.4, lh = lines.length * fs * 1.2 + fs * 0.9;
    const bx0 = Math.max(8, Math.min(W - lw - 8, x - lw * 0.25)), by0 = y - lh - R * 0.8 + Math.sin(T * 3) * 2;
    ctx.shadowColor = 'rgba(0,0,40,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    Art.rr(ctx, bx0, by0, lw, lh, fs * 0.7); ctx.fillStyle = '#fffdf5'; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.beginPath(); ctx.moveTo(x - R * 0.4, by0 + lh - 1); ctx.lineTo(x, by0 + lh + R * 0.7); ctx.lineTo(x + R * 0.4, by0 + lh - 1); ctx.fill();
    ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 2.5; Art.rr(ctx, bx0, by0, lw, lh, fs * 0.7); ctx.stroke();
    ctx.fillStyle = '#2b2350'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx0 + fs * 0.7, by0 + fs * 0.45 + i * fs * 1.2));
    ctx.restore();
  }
  function drawParticles(ctx) {
    for (const r of rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = r.col; ctx.lineWidth = Math.max(1, R * 0.25 * (1 - k));
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.3 + k * 0.9), 0, TAU); ctx.stroke();
    }
    for (const p of particles) {
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      const sz = p.grow < 0 ? p.size * k : p.size;
      if (p.kind === 'dot') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, sz), 0, TAU); ctx.fill(); }
      else if (p.kind === 'shard') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.8, sz * 0.6); ctx.lineTo(-sz * 0.8, sz * 0.6); ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (p.kind === 'spark') { ctx.fillStyle = p.col; Art.star(ctx, p.x, p.y, sz, sz * 0.35, 4); ctx.fill(); }
      else if (p.kind === 'pop') { ctx.globalAlpha = k * 0.7; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - k * 0.4), 0, TAU); ctx.fill(); }
      else if (p.kind === 'smoke') { ctx.globalAlpha = k * 0.5; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k), 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function drawFlyers(ctx, T) {
    for (const f of flyers) {
      if (f.t < 0) continue;
      const k = Math.min(1, f.t / f.dur);
      if (f.kind === 'hammer') {
        const img = UI.iconImg('hammer');
        if (img) { ctx.save(); ctx.translate(f.x0 + R * 1.2, f.y0 + R * 0.2); ctx.rotate(-1.4 + U.easeOutBack(Math.min(1, k * 1.4)) * 1.6); ctx.drawImage(img, -R * 2.8, -R * 2.8, R * 3.2, R * 3.2); ctx.restore(); }
        continue;
      }
      if (f.kind === 'orb') {
        const e = U.easeInOutCubic(k), x = U.lerp(f.x0, f.tx, e), y = U.lerp(f.y0, f.ty, e) - Math.sin(e * Math.PI) * R * 2;
        const col = f.attack === 'freeze' ? '#bfeeff' : f.attack === 'stone' ? '#9aa3b2' : '#c9a6ff';
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, y, R * 0.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        continue;
      }
      // arc to the goal card: rise first, then swoop
      const tg = f.target || { x: W / 2, y: 60 }, e = U.easeInOutCubic(k);
      const cx0 = f.x0 + (tg.x - f.x0) * 0.2, cy0 = Math.min(f.y0, tg.y) - R * 4;
      const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * cx0 + e * e * tg.x;
      const y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * cy0 + e * e * tg.y;
      const sc = f.kind === 'item' ? 1 - e * 0.35 : 1.2 - e * 0.5;
      if (f.kind === 'critter') Art.critter(ctx, x, y, R * 2.2 * sc, Art.critterLook(f.cr), { happy: true });
      else if (f.kind === 'butterfly') Art.butterfly(ctx, x, y, R * 0.9 * sc, T, '#ff7ad9', '#7f5cff');
      else if (f.bubble != null) Art.blit(ctx, Art.bubbleSprite(R * 0.6, f.bubble, false), x, y);
      else if (f.icon === 'st') { ctx.save(); ctx.translate(x, y); ctx.rotate(e * 6); Art.drawStarShape(ctx, 0, 0, R * 0.7 * sc); ctx.restore(); }
      else if (f.icon === 'x') Art.crystalCluster(ctx, x, y + R * 0.4, R * 0.8 * sc);
      else if (f.icon === 'chain') { const img = UI.iconImg('cell_ch'); if (img) ctx.drawImage(img, x - R * 0.8, y - R * 0.8, R * 1.6, R * 1.6); }
      if (Math.random() < 0.5) spawn(x, y, { life: 0.35, size: R * 0.18, col: '#fff6b0', kind: 'spark' });
    }
  }
  function drawTexts(ctx) {
    for (const tx of texts) {
      const k = tx.life / tx.max;
      const fs = Math.max(14, R * 1.35 * tx.scale) * (tx.big ? U.easeOutBack(Math.min(1, (1 - k) * 5)) : 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2.5);
      ctx.font = `900 ${fs}px ${UI.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = fs * (tx.big ? 0.28 : 0.22); ctx.strokeStyle = tx.big ? '#3a1f6e' : 'rgba(30,20,70,0.8)'; ctx.strokeText(tx.txt, tx.x, tx.y);
      if (tx.big) { const g = ctx.createLinearGradient(0, tx.y - fs / 2, 0, tx.y + fs / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, tx.col); ctx.fillStyle = g; } else ctx.fillStyle = tx.col;
      ctx.fillText(tx.txt, tx.x, tx.y);
      ctx.restore();
    }
  }
  function drawBoss(ctx, T) {
    const bs = board.boss, x = W / 2, y = bossY(), s = R * 7.5;
    if (bossFx.dead >= 1) return;
    ctx.save();
    if (bossFx.dead > 0) { ctx.globalAlpha = 1 - bossFx.dead; ctx.translate(x, y); ctx.scale(1 + bossFx.dead, 1 - bossFx.dead * 0.8); ctx.translate(-x, -y); }
    Art.boss(ctx, x, y, s, level.boss.hue, { t: T, hit: bossFx.hit, attack: bossFx.attack > 0, final: level.boss.final, blink: Math.sin(T * 1.1) > 0.98 });
    ctx.restore();
    const bw = R * 9, bh = R * 0.75, bx0 = x - bw / 2, by0 = y + s * 0.42;
    ctx.save();
    Art.rr(ctx, bx0 - 3, by0 - 3, bw + 6, bh + 6, bh); ctx.fillStyle = 'rgba(30,15,60,0.85)'; ctx.fill();
    const frac = Math.max(0, bossShownHp / bs.max);
    if (frac > 0) {
      Art.rr(ctx, bx0, by0, bw * frac, bh, bh / 2);
      const g = ctx.createLinearGradient(0, by0, 0, by0 + bh); g.addColorStop(0, '#ff8fa8'); g.addColorStop(1, '#e8174a');
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.font = `900 ${R * 0.62}px ${UI.FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(bossShownHp) + ' / ' + bs.max, x, by0 + bh / 2 + 1);
    for (const d of bossFx.dmg) {
      const yy = y - s * 0.3 - (1 - d.life) * R * 3;
      ctx.globalAlpha = Math.min(1, d.life * 2); ctx.font = `900 ${R * 1.1}px ${UI.FONT}`;
      ctx.lineWidth = 4; ctx.strokeStyle = '#4a0f24'; ctx.strokeText('-' + d.n, x + d.x, yy);
      ctx.fillStyle = '#ffd84a'; ctx.fillText('-' + d.n, x + d.x, yy);
    }
    ctx.restore();
  }

  return {
    start, update, draw, pointer, layout: () => { if (level) layout(); }, useBooster, cancelMode, colorBlast, continueWith, giveUp,
    get level() { return level; }, get board() { return board; }, get moves() { return moves; }, get movesUsed() { return movesUsed; },
    get score() { return score; }, get shownGoal() { return shownGoal; }, get busy() { return busy; }, get over() { return over; },
    get active() { return active; }, set active(v) { active = v; }, get paused() { return paused; }, set paused(v) { paused = v; },
    get mode() { return mode; },
  };
})();
