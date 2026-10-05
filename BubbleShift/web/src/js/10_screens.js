/* ==========================================================================
   10_screens.js — Home (the living valley you restore), World Map, Splash
   and the story Intro. Also owns which screen is visible.
   ========================================================================== */
'use strict';

const Screens = (() => {
  const { $, $$, el, esc, ic, tap } = UI;
  const TAU = Math.PI * 2;
  let current = 'none';
  let W = 0, H = 0;

  function show(name) {
    current = name;
    $('#homeHud').classList.toggle('hidden', name !== 'home');
    $('#gameHud').classList.toggle('hidden', name !== 'game');
    $('#map').classList.toggle('hidden', name !== 'map');
    $('#mapHud').classList.toggle('hidden', name !== 'map');
    if (name === 'home') { homeBg = null; syncHome(); }
    if (name === 'map') openMap();
    if (name === 'game') UI.syncGameHud();
  }

  // ================================================================ HOME
  let homeBg = null, homeT = 0;
  let objRects = [], charRects = [], pointer = null, speech = null, buildFx = null;
  const butterflies = [];
  const IDLE = {
    milo: [{ en: 'Race you to the bridge!', uk: 'Наввипередки до мосту!' }, { en: 'I found a shortcut... I think.', uk: 'Я знайшов коротшу стежку... здається.' }],
    nia: [{ en: 'Stars and wood — that is all I need!', uk: 'Зірки й деревина — більше нічого не треба!' }, { en: 'Measure twice, pop once!', uk: 'Двічі поміряй — раз лопни!' }],
    bruno: [{ en: 'All quiet. For now.', uk: 'Усе спокійно. Поки що.' }, { en: 'Hmph. Nice shooting.', uk: 'Гм. Непогано стріляєш.' }],
    eli: [{ en: 'The map says... go north!', uk: 'Мапа каже... на північ!' }, { en: 'So many creatures to discover!', uk: 'Стільки істот ще не знайдено!' }],
    murk: [{ en: 'Colors are... nice, actually.', uk: 'Барви... насправді гарні.' }],
    lumi: [{ en: 'Every level brings the valley back to life!', uk: 'Кожен рівень оживляє долину!' }, { en: 'Tap a broken place to restore it!', uk: 'Торкнись зруйнованого місця, щоб відновити його!' }],
  };

  function buildHomeHud() {
    $('#homeHud').innerHTML = `
      <div class="topbar">
        <button class="chip" id="chipLives">${ic('heart', 64)}<span id="livesVal"></span><span class="sub" id="livesSub"></span></button>
        <button class="chip has-plus" id="chipCoins">${ic('coin', 64)}<span id="coinsVal"></span><span class="plus">+</span></button>
        <button class="chip" id="chipStars">${ic('star', 64)}<span id="starsVal"></span></button>
        <div class="spacer"></div>
        <button class="round-btn" id="btnSettings">${ic('gear', 48)}</button>
      </div>
      <div class="area-banner"><div class="ribbon" id="areaName"></div>
        <div class="area-progress"><span id="areaLv"></span><div class="bar"><i id="areaBar"></i></div><span id="areaRest"></span></div></div>
      <div class="side left" id="sideL"></div>
      <div class="side right" id="sideR"></div>
      <div class="bottombar">
        <button class="nav-btn" id="navMap"><div class="disc">${ic('map', 64)}</div><span class="lbl">${esc(t('map'))}</span></button>
        <button class="btn btn-orange play-btn" id="btnPlay"><span class="big">${esc(t('play'))}</span><span class="small" id="playLv"></span></button>
        <button class="nav-btn" id="navCol"><div class="disc">${ic('collection', 64)}</div><span class="lbl">${esc(t('collection'))}</span></button>
      </div>`;
    tap($('#chipLives'), () => UI.lives());
    tap($('#chipCoins'), () => { if (State.featureOn('shop')) UI.shop(); else UI.toast(t('needLevel', { n: DATA.FEATURES.shop + 1 }), 'shop'); });
    tap($('#chipStars'), () => UI.toast(t('starsInfo'), 'star'));
    tap($('#btnSettings'), () => UI.settings());
    tap($('#btnPlay'), () => playNext());
    tap($('#navMap'), () => show('map'));
    tap($('#navCol'), () => UI.collection());
    const side = (parent, id, iconName, label, fn) => {
      const b = el('button', 'side-btn', `<div class="disc">${ic(iconName, 64)}</div><span class="lbl">${esc(label)}</span>`);
      b.id = id; b.style.animationDelay = (Math.random() * 2) + 's';
      tap(b, fn); parent.appendChild(b); return b;
    };
    side($('#sideL'), 'sbDaily', 'daily', t('daily'), () => UI.daily());
    side($('#sideL'), 'sbQuests', 'quests', t('quests'), () => UI.quests('daily'));
    side($('#sideL'), 'sbWeekly', 'weekly', t('weekly'), () => UI.quests('weekly'));
    side($('#sideL'), 'sbEvent', 'event', t('event'), () => { const e = State.activeEvent(); if (e) UI.toast(L(e.name) + ' · ' + t('eventBonus') + ' · ' + U.fmtTime(State.eventEnds(e)), 'event'); });
    side($('#sideR'), 'sbShop', 'shop', t('shop'), () => UI.shop());
    side($('#sideR'), 'sbChests', 'chest_gold', t('open'), () => UI.chestsInventory());
    const sc = side($('#sideR'), 'sbStarChest', 'chest_silver', '★', () => UI.toast(t('starsLeft', { a: State.s.starsLifetime % DATA.STAR_CHEST_STARS, b: DATA.STAR_CHEST_STARS }), 'star'));
    sc.appendChild(el('div', 'ring-prog', '<i id="starChestProg"></i>'));
  }

  function syncHome() {
    if (!$('#coinsVal')) return;
    State.tickLives();
    const s = State.s;
    $('#livesVal').textContent = State.infinite() ? '∞' : s.lives;
    $('#livesSub').textContent = State.infinite() ? U.fmtTime(s.infUntil - Date.now()) : s.lives >= DATA.LIVES.max ? t('full') : U.fmtTime(State.nextLifeMs());
    $('#coinsVal').textContent = U.fmtNum(s.coins);
    $('#starsVal').textContent = s.starBank;
    const a = State.currentArea(), area = DATA.AREAS[a], start = State.areaStart(a);
    $('#areaName').textContent = L(area.name);
    let done = 0; for (let i = 0; i < DATA.LEVELS_PER_AREA; i++) if (s.best[start + i] > 0) done++;
    $('#areaLv').textContent = t('areaProgress', { a: done, b: DATA.LEVELS_PER_AREA });
    $('#areaBar').style.width = (done / DATA.LEVELS_PER_AREA) * 100 + '%';
    $('#areaRest').innerHTML = `${ic('hammer', 32).replace('<img', '<img style="width:18px;height:18px;vertical-align:-3px"')} ${area.objects.reduce((n, o) => n + State.stageOf(o.id), 0)}/9`;
    const gated = !State.canPlay(Math.min(s.level, DATA.MAX_LEVEL));
    $('#playLv').textContent = gated ? t('restore') + ' ✦' : t('levelN', { n: State.currentLevel() });
    const vis = (id, on) => { const e = $('#' + id); if (e) e.classList.toggle('hidden', !on); };
    vis('sbDaily', State.featureOn('daily'));
    vis('sbQuests', State.featureOn('quests'));
    vis('sbWeekly', State.featureOn('weekly'));
    vis('sbEvent', !!State.activeEvent() && State.featureOn('quests'));
    vis('sbShop', State.featureOn('shop'));
    vis('sbChests', s.chests.length > 0);
    vis('sbStarChest', State.featureOn('starChest'));
    $('#navMap').style.visibility = State.featureOn('map') ? '' : 'hidden';
    $('#navCol').style.visibility = State.featureOn('collection') ? '' : 'hidden';
    badge('sbDaily', State.dailyAvailable() ? '!' : '');
    badge('sbQuests', State.questsClaimable() || '');
    badge('sbWeekly', State.weeklyClaimable() || '');
    badge('sbChests', s.chests.length || '', true);
    badge('navCol', State.collectionClaimable() || '');
    const prog = $('#starChestProg'); if (prog) prog.style.width = ((s.starsLifetime % DATA.STAR_CHEST_STARS) / DATA.STAR_CHEST_STARS) * 100 + '%';
    const e = State.activeEvent(), eb = $('#sbEvent .lbl');
    if (e && eb) eb.textContent = L(e.name).split(' ')[0];
  }
  function badge(id, v, info) {
    const host = $('#' + id); if (!host) return;
    let b = $('.badge', host);
    if (!v) { if (b) b.remove(); return; }
    if (!b) { b = el('span', 'badge' + (info ? ' info' : '')); host.appendChild(b); }
    b.textContent = v;
  }
  function highlight(f) {
    const id = { daily: 'sbDaily', quests: 'sbQuests', weekly: 'sbWeekly', shop: 'sbShop', map: 'navMap', collection: 'navCol', starChest: 'sbStarChest' }[f];
    const e = id && $('#' + id);
    if (e) e.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 700, iterations: 3 });
  }
  function playNext() {
    const id = Math.min(State.s.level, DATA.MAX_LEVEL);
    if (State.canPlay(id)) { UI.openLevel(id); return; }
    // The next area is gated behind restoring the current one.
    UI.toast(t('restoreToUnlock', { area: L(DATA.AREAS[State.currentArea()].name) }), 'star');
    pointAtRestore(true);
  }
  function pointAtRestore(force) {
    const a = State.currentArea();
    pointer = null;
    for (let i = 0; i < DATA.AREAS[a].objects.length; i++) {
      const inf = State.objectInfo(a, i);
      if (inf.unlocked && inf.stage < 3 && (inf.affordable || force)) { pointer = { i, t: 0 }; break; }
    }
  }

  function objPos(o) { return { x: o.x * W, y: H * (0.5 + (o.y - 0.5) * 1.05), s: Math.min(W * 0.34, H * 0.2, 170) }; }
  function drawHome(ctx, dt) {
    homeT += dt;
    const a = State.currentArea();
    if (!homeBg || homeBg.a !== a || homeBg.w !== window.innerWidth || homeBg.h !== window.innerHeight) {
      W = window.innerWidth; H = window.innerHeight;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      homeBg = document.createElement('canvas'); homeBg.width = W * d; homeBg.height = H * d; homeBg.w = W; homeBg.h = H; homeBg.a = a;
      const g = homeBg.getContext('2d'); g.scale(d, d);
      Art.scene(g, W, H, a, { horizon: 0.36 });
      g.save(); g.globalAlpha = 0.55; g.strokeStyle = '#e8d3a0'; g.lineWidth = W * 0.07; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * 0.5, H * 1.05); g.bezierCurveTo(W * 0.2, H * 0.78, W * 0.85, H * 0.66, W * 0.5, H * 0.5); g.stroke(); g.restore();
    }
    ctx.drawImage(homeBg, 0, 0, W, H);
    const T = homeT, objs = DATA.AREAS[a].objects;
    ctx.save();
    if (buildFx) {
      // camera eases in on the object being built, then back out
      const p = objPos(objs[buildFx.i]);
      const k = Math.min(1, buildFx.t / 0.4) * (buildFx.t > buildFx.dur - 0.4 ? Math.max(0, (buildFx.dur - buildFx.t) / 0.4) : 1);
      const z = 1 + U.easeInOutCubic(k) * 0.35;
      ctx.translate(p.x, p.y - p.s * 0.3); ctx.scale(z, z); ctx.translate(-p.x, -(p.y - p.s * 0.3));
    }
    objRects = [];
    const order = objs.map((o, i) => ({ o, i })).sort((x, y) => x.o.y - y.o.y);
    for (const { o, i } of order) {
      const p = objPos(o);
      let stage = State.stageOf(o.id);
      if (buildFx && buildFx.i === i && buildFx.t < buildFx.dur * 0.55) stage -= 1;
      const inf = State.objectInfo(a, i);
      Art.object(ctx, p.x, p.y, p.s, o.type, stage, T);
      objRects.push({ i, x: p.x, y: p.y - p.s * 0.35, r: p.s * 0.55 });
      if (buildFx) continue;
      if (!inf.unlocked) {
        const img = UI.iconImg('lock'); if (img) ctx.drawImage(img, p.x - 16, p.y - p.s * 0.95, 32, 32);
        pill(ctx, p.x, p.y - p.s * 0.95 + 42, 'Lv ' + o.unlock, '#5a6478');
      } else if (inf.stage < 3 && inf.affordable) {
        const bob = Math.sin(T * 4) * 6;
        const img = UI.iconImg('hammer'); if (img) ctx.drawImage(img, p.x - 22, p.y - p.s * 1.05 + bob, 44, 44);
        pill(ctx, p.x, p.y - p.s * 1.05 + bob + 52, t('build') + '!', '#45b82a');
      } else if (inf.stage < 3) {
        const img = UI.iconImg('star'); if (img) ctx.drawImage(img, p.x - 14, p.y - p.s * 0.9, 28, 28);
      }
    }
    charRects = [];
    const chars = State.s.chars.filter((c) => c !== 'lumi' && c !== 'murk');
    if (State.s.best[160] > 0) chars.push('murk');
    chars.forEach((c, i) => {
      const x = W * (0.16 + ((i * 0.23) % 0.7)), y = H * (0.79 + (i % 2) * 0.04);
      const hop = Math.max(0, Math.sin(T * 2.2 + i * 1.7)) * 6;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + W * 0.07, W * 0.06, W * 0.015, 0, 0, TAU); ctx.fill();
      Art.character(ctx, x, y - hop, W * 0.17, c, { t: T, mood: 'happy', blink: Math.sin(T * 1.4 + i) > 0.97, redeemed: c === 'murk' });
      charRects.push({ c, x, y, r: W * 0.09 });
    });
    const lx = W * 0.5 + Math.sin(T * 0.6) * W * 0.32, ly = H * 0.3 + Math.sin(T * 1.3) * H * 0.03;
    Art.character(ctx, lx, ly, W * 0.14, 'lumi', { t: T, mood: 'happy', blink: Math.sin(T * 1.2) > 0.98 });
    charRects.push({ c: 'lumi', x: lx, y: ly, r: W * 0.08 });
    if (butterflies.length < 4) butterflies.push({ x: Math.random() * W, y: H * (0.45 + Math.random() * 0.3), ph: Math.random() * 6, col: ['#ff7ad9', '#ffd23f', '#7fd4ff'][butterflies.length % 3] });
    for (const b of butterflies) { b.ph += dt; b.x += Math.cos(b.ph * 0.7) * 30 * dt; b.y += Math.sin(b.ph * 1.3) * 20 * dt; if (b.x < -20) b.x = W + 20; if (b.x > W + 20) b.x = -20; Art.butterfly(ctx, b.x, b.y, 10, b.ph * 2, b.col, '#7f5cff'); }
    if (buildFx) drawBuildFx(ctx, dt, objs);
    ctx.restore();
    if (pointer && !buildFx && UI.stackSize === 0 && !$('#story')) {
      pointer.t += dt;
      const p = objPos(objs[pointer.i]);
      drawHandIcon(ctx, p.x + p.s * 0.35, p.y - p.s * 0.2 + Math.abs(Math.sin(pointer.t * 3)) * 12, 46);
    }
    if (speech) { speech.t -= dt; if (speech.t <= 0) speech = null; else bubbleText(ctx, speech.x, speech.y - W * 0.12, speech.text); }
  }
  function pill(ctx, x, y, text, col) {
    ctx.save(); ctx.font = `900 13px ${UI.FONT}`;
    const w = ctx.measureText(text).width + 16;
    Art.rr(ctx, x - w / 2, y - 11, w, 22, 11); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }
  function drawHandIcon(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2350'; ctx.lineWidth = 3;
    Art.rr(ctx, -s * 0.12, -s * 0.6, s * 0.24, s * 0.62, s * 0.12); ctx.fill(); ctx.stroke();
    Art.rr(ctx, -s * 0.32, -s * 0.06, s * 0.64, s * 0.5, s * 0.2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function bubbleText(ctx, x, y, text) {
    ctx.save(); ctx.font = `800 15px ${UI.FONT}`;
    const w = Math.min(W * 0.7, ctx.measureText(text).width + 24);
    const lines = []; let cur = '';
    for (const wd of text.split(' ')) { const tt = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tt).width > w - 24 && cur) { lines.push(cur); cur = wd; } else cur = tt; }
    lines.push(cur);
    const h = lines.length * 19 + 16, x0 = Math.max(8, Math.min(W - w - 8, x - w / 2));
    Art.rr(ctx, x0, y - h, w, h, 14); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#2b2350'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, x0 + w / 2, y - h + 8 + i * 19));
    ctx.restore();
  }
  function homePointer(type, x, y) {
    if (type !== 'down' || current !== 'home' || buildFx || UI.stackSize) return;
    for (const r of charRects) {
      if ((x - r.x) ** 2 + (y - r.y) ** 2 < r.r * r.r) {
        const lines = IDLE[r.c] || IDLE.lumi;
        speech = { x: r.x, y: r.y, text: L(lines[Math.floor(Math.random() * lines.length)]), t: 2.6 };
        Audio.play('talk'); return;
      }
    }
    for (const r of objRects) {
      if ((x - r.x) ** 2 + (y - r.y) ** 2 < r.r * r.r) {
        Audio.play('click'); pointer = null;
        UI.restorePanel(State.currentArea(), r.i);
        return;
      }
    }
  }
  function buildAnim(a, i) {
    return new Promise((res) => { buildFx = { i, t: 0, dur: 2.2, parts: [], res, hits: 0 }; Audio.play('build'); Audio.vib([30, 60, 30, 60, 30]); });
  }
  function drawBuildFx(ctx, dt, objs) {
    const b = buildFx;
    b.t += dt;
    const p = objPos(objs[b.i]);
    if (b.t < b.dur * 0.55) {
      if (Math.random() < 0.5) b.parts.push({ x: p.x + (Math.random() - 0.5) * p.s, y: p.y - Math.random() * p.s * 0.6, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40, r: 10 + Math.random() * 16, life: 1, col: 'rgba(240,230,210,' });
      const hk = Math.floor(b.t / 0.28);
      if (hk > b.hits) { b.hits = hk; b.parts.push({ hammer: true, x: p.x + (Math.random() - 0.5) * p.s * 0.8, y: p.y - p.s * (0.3 + Math.random() * 0.4), life: 0.3 }); }
    } else if (!b.burst) {
      b.burst = true; Audio.play('win');
      for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, s = 80 + Math.random() * 200; b.parts.push({ x: p.x, y: p.y - p.s * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, r: 4 + Math.random() * 4, life: 1.2, star: true, col: DATA.COLORS[i % 6].base }); }
    }
    for (const q of b.parts) {
      q.life -= dt;
      if (q.hammer) { const img = UI.iconImg('hammer'); if (img) { ctx.save(); ctx.globalAlpha = Math.min(1, q.life * 4); ctx.translate(q.x, q.y); ctx.rotate(-0.8 + (0.3 - q.life) * 5); ctx.drawImage(img, -24, -40, 48, 48); ctx.restore(); } continue; }
      q.x += q.vx * dt; q.y += q.vy * dt; if (q.star) q.vy += 300 * dt;
      ctx.globalAlpha = U.clamp(q.life, 0, 1);
      if (q.star) { ctx.fillStyle = q.col; Art.star(ctx, q.x, q.y, q.r, q.r * 0.45, 5); ctx.fill(); }
      else { ctx.fillStyle = q.col + (0.6 * q.life) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.6 - q.life * 0.6), 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    b.parts = b.parts.filter((q) => q.life > 0);
    if (b.t >= b.dur) { const r = b.res; buildFx = null; syncHome(); r(); }
  }

  // ================================================================ MAP (native scroll, lazy band canvases)
  const STEP = 100, HEAD = 300, BAND = DATA.LEVELS_PER_AREA * STEP + HEAD;
  const TOTAL = DATA.AREAS.length * BAND;
  let mapBuilt = false, bandCanvases = {}, mapScrollBound = false;
  const bandTop = (a) => TOTAL - (a + 1) * BAND;
  const nodeX = (i, a) => 0.5 + Math.sin(i * 0.72 + a * 1.3) * 0.28;
  function nodePos(id) {
    const a = Levels.areaOf(id), i = (id - 1) % DATA.LEVELS_PER_AREA;
    return { x: nodeX(i, a), y: bandTop(a) + BAND - 110 - i * STEP, a, i };
  }
  function rebuildMap() { mapBuilt = false; bandCanvases = {}; $('#mapInner').innerHTML = ''; if (current === 'map') openMap(); }
  function buildMap() {
    const inner = $('#mapInner');
    inner.innerHTML = '';
    inner.style.height = TOTAL + 'px';
    for (let a = 0; a < DATA.AREAS.length; a++) {
      const band = el('div', 'band'); band.style.top = bandTop(a) + 'px'; band.style.height = BAND + 'px'; band.dataset.a = a;
      inner.appendChild(band);
      const title = el('div', 'map-title', `<div class="ribbon">${esc(L(DATA.AREAS[a].name))}</div>`);
      title.style.top = (bandTop(a) + 36) + 'px';
      inner.appendChild(title);
    }
    for (let id = 1; id <= DATA.MAX_LEVEL; id++) {
      const p = nodePos(id), boss = Levels.isBossLevel(id);
      const n = el('button', 'node' + (boss ? ' boss' : ''), boss ? `${ic('boss_' + p.a, 80)}<span class="bn">${id}</span>` : String(id));
      n.id = 'node' + id; n.style.left = (p.x * 100) + '%'; n.style.top = p.y + 'px';
      tap(n, () => {
        if (State.canPlay(id)) UI.openLevel(id);
        else if (id <= State.s.level) UI.toast(t('restoreToUnlock', { area: L(DATA.AREAS[Math.max(0, p.a - 1)].name) }), 'lock');
        else UI.toast(t('needLevel', { n: id }), 'lock');
      });
      inner.appendChild(n);
    }
    const av = el('img', 'avatar'); av.id = 'mapAvatar'; av.src = Art.icon('char_lumi', 96); inner.appendChild(av);
    mapBuilt = true;
    if (!mapScrollBound) { $('#map').addEventListener('scroll', renderBands, { passive: true }); mapScrollBound = true; }
  }
  function syncMap() {
    const s = State.s;
    for (let id = 1; id <= DATA.MAX_LEVEL; id++) {
      const n = $('#node' + id), boss = Levels.isBossLevel(id), done = s.best[id] > 0;
      const cur = id === Math.min(s.level, DATA.MAX_LEVEL) && State.canPlay(id);
      n.className = 'node' + (boss ? ' boss' : '') + (done ? ' done' : '') + (cur ? ' cur' : '') + (!done && !cur ? ' locked' : '') + (Levels.isHard(id) ? ' hard' : '');
      let st = $('.st', n);
      if (done) { if (!st) st = n.appendChild(el('div', 'st')); st.innerHTML = [0, 1, 2].map((i) => `<img src="${Art.icon(i < s.best[id] ? 'star' : 'starGrey', 24)}">`).join(''); }
      else if (st) st.remove();
    }
    const p = nodePos(State.currentLevel()), av = $('#mapAvatar');
    av.style.left = (p.x * 100) + '%'; av.style.top = p.y + 'px';
    $$('.gate, .fog', $('#mapInner')).forEach((e) => e.remove());
    for (let a = 1; a < DATA.AREAS.length; a++) {
      if (State.areaOpen(a)) continue;
      const y = bandTop(a - 1);
      const fog = el('div', 'fog'); fog.style.top = (y - BAND) + 'px'; fog.style.height = BAND + 'px';
      $('#mapInner').appendChild(fog);
      const prevBoss = State.areaBoss(a - 1), bossDone = s.best[prevBoss] > 0;
      const rest = DATA.AREAS[a - 1].objects.reduce((n, o) => n + State.stageOf(o.id), 0);
      const gate = el('div', 'gate', `${ic('lock', 48)}<div class="h3">${esc(L(DATA.AREAS[a].name))}</div><div class="muted">${esc(bossDone ? t('restoreToUnlock', { area: L(DATA.AREAS[a - 1].name) }) + ` (${rest}/9)` : t('beatBossToUnlock', { n: prevBoss }))}</div>`);
      if (bossDone) gate.appendChild(tap(el('button', 'btn btn-sm btn-green', esc(t('restore'))), () => { show('home'); pointAtRestore(true); }));
      gate.style.top = (y - 40) + 'px';
      $('#mapInner').appendChild(gate);
      break;
    }
  }
  function openMap() {
    if (!mapBuilt) buildMap();
    syncMap();
    const hud = $('#mapHud');
    hud.innerHTML = `<div class="chip">${ic('heart', 64)}<span>${State.infinite() ? '∞' : State.s.lives}</span></div><div class="chip">${ic('coin', 64)}<span>${U.fmtNum(State.s.coins)}</span></div><div class="chip">${ic('star', 64)}<span>${State.s.starBank}</span></div>`;
    const back = el('button', 'round-btn map-back', `<span style="font-size:32px;font-weight:900;line-height:1;text-shadow:0 2px 0 rgba(0,0,0,.25)">⌂</span>`);
    back.style.cssText = 'position:fixed;width:62px;height:62px';
    hud.appendChild(tap(back, () => show('home')));
    const p = nodePos(State.currentLevel());
    requestAnimationFrame(() => { $('#map').scrollTop = Math.max(0, p.y - window.innerHeight * 0.6); renderBands(); });
  }
  function renderBands() {
    const m = $('#map'), top = m.scrollTop, vh = m.clientHeight;
    for (let a = 0; a < DATA.AREAS.length; a++) {
      const bt = bandTop(a), visible = bt < top + vh * 1.5 && bt + BAND > top - vh * 0.5;
      const band = $(`.band[data-a="${a}"]`);
      if (visible && !bandCanvases[a]) { bandCanvases[a] = drawBand(a); band.appendChild(bandCanvases[a]); }
      else if (!visible && bandCanvases[a]) { bandCanvases[a].width = 0; bandCanvases[a].remove(); delete bandCanvases[a]; }
    }
  }
  function drawBand(a) {
    const w = window.innerWidth, h = BAND, d = Math.min(window.devicePixelRatio || 1, 1.5);
    const c = document.createElement('canvas'); c.width = w * d; c.height = h * d;
    const g = c.getContext('2d'); g.scale(d, d);
    const A = DATA.AREAS[a], rnd = U.rng(a * 977 + 3);
    const gg = g.createLinearGradient(0, 0, 0, h);
    gg.addColorStop(0, A.hills[0]); gg.addColorStop(0.5, A.hills[1]); gg.addColorStop(1, A.hills[0]);
    g.fillStyle = gg; g.fillRect(0, 0, w, h);
    Art.scene(g, w, 300, a, { horizon: 0.55 });
    const fade = g.createLinearGradient(0, 200, 0, 320); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, A.hills[0]);
    g.fillStyle = fade; g.fillRect(0, 200, w, 120);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.05})`; g.beginPath(); g.ellipse(rnd() * w, 300 + rnd() * (h - 300), 30 + rnd() * 70, 12 + rnd() * 20, 0, 0, TAU); g.fill(); }
    if (A.props === 'lake' || A.props === 'meadow' || A.props === 'forest') {
      const py = 500 + rnd() * (h - 900);
      const wg = g.createLinearGradient(0, py, 0, py + 120); wg.addColorStop(0, '#9fe6ff'); wg.addColorStop(1, '#3fa6e0');
      g.fillStyle = wg; g.beginPath(); g.moveTo(-10, py); g.bezierCurveTo(w * 0.3, py - 40, w * 0.7, py + 60, w + 10, py + 10); g.lineTo(w + 10, py + 70); g.bezierCurveTo(w * 0.7, py + 120, w * 0.3, py + 40, -10, py + 80); g.fill();
    }
    // winding path through the level nodes
    const pts = [];
    for (let i = -1; i <= DATA.LEVELS_PER_AREA; i++) pts.push({ x: nodeX(i, a) * w, y: BAND - 110 - i * STEP });
    const path = () => { g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) g.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, (pts[i - 1].x + pts[i].x) / 2, (pts[i - 1].y + pts[i].y) / 2); g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    path(); g.strokeStyle = 'rgba(80,50,20,0.35)'; g.lineWidth = 34; g.stroke();
    path(); g.strokeStyle = '#f0dcae'; g.lineWidth = 28; g.stroke();
    g.setLineDash([2, 22]); path(); g.strokeStyle = 'rgba(160,120,70,0.6)'; g.lineWidth = 8; g.stroke(); g.setLineDash([]);
    const nearPath = (x, y) => pts.some((p) => Math.abs(p.y - y) < 70 && Math.abs(p.x - x) < 70);
    const kind = A.props === 'forest' || A.props === 'shadow' ? 'pine' : A.props === 'village' ? 'fruit' : 'round';
    const items = [];
    for (let i = 0; i < 60; i++) { const x = rnd() * w, y = 320 + rnd() * (h - 340); if (!nearPath(x, y)) items.push({ x, y, r: rnd() }); }
    items.sort((p, q) => p.y - q.y);
    for (const it of items) {
      if (A.props === 'clouds') { Art.cloudShape(g, it.x, it.y, 50 + it.r * 40, 'rgba(255,255,255,0.8)'); continue; }
      if (it.r < 0.45) Art.tree(g, it.x, it.y, 46 + it.r * 60, Art.shade(A.hills[2], -0.05 + it.r * 0.2), kind);
      else if (it.r < 0.6) {
        if (A.props === 'forest') Art.mushroom(g, it.x, it.y, 20);
        else if (A.props === 'lake' || A.props === 'ruins') Art.crystalCluster(g, it.x, it.y, 22);
        else if (A.props === 'shadow') Art.lantern(g, it.x, it.y, 12);
        else Art.flower(g, it.x, it.y, 6, '#ff7ab6');
      } else for (let k = 0; k < 5; k++) Art.flower(g, it.x + (k - 2) * 9, it.y + (k % 2) * 6, 3.5, ['#ff7ab6', '#ffe36a', '#ffffff', '#b98bff'][k % 4]);
    }
    return c;
  }

  // ================================================================ SPLASH + INTRO
  function overlayCanvas(host) {
    const w = window.innerWidth, h = window.innerHeight, d = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    host.appendChild(cv);
    const g = cv.getContext('2d'); g.scale(d, d);
    return { g, w, h, d };
  }
  function splash() {
    return new Promise((resolve) => {
      const s = el('div'); s.id = 'splash';
      document.body.appendChild(s);
      const { g, w, h, d } = overlayCanvas(s);
      s.appendChild(el('div', 'logo', `<div class="l1">BUBBLE</div><div class="l2">BLOOM</div><div class="tag">${esc(t('tagline'))}</div>`));
      s.appendChild(el('div', 'tap-start', esc(t('tapToContinue'))));
      const bgc = document.createElement('canvas'); bgc.width = w * d; bgc.height = h * d;
      const b2 = bgc.getContext('2d'); b2.scale(d, d); Art.scene(b2, w, h, 0, { horizon: 0.55 });
      const bubbles = Array.from({ length: 22 }, (_, i) => ({ x: Math.random() * w, y: h + Math.random() * h, r: 12 + Math.random() * 26, c: i % 6, v: 30 + Math.random() * 50, ph: Math.random() * 6 }));
      let alive = true, last = performance.now(), T = 0;
      const loop = (now) => {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
        g.drawImage(bgc, 0, 0, w, h);
        for (const b of bubbles) { b.y -= b.v * dt; b.ph += dt; if (b.y < -40) { b.y = h + 40; b.x = Math.random() * w; } Art.blit(g, Art.bubbleSprite(b.r, b.c, false), b.x + Math.sin(b.ph) * 12, b.y); }
        Art.character(g, w * 0.22, h * 0.72 + Math.sin(T * 2) * 8, w * 0.22, 'lumi', { t: T, mood: 'happy' });
        Art.critter(g, w * 0.72, h * 0.78 - Math.abs(Math.sin(T * 3)) * 10, w * 0.2, DATA.CREATURES[0].look, { happy: true });
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      s.addEventListener('click', () => { Audio.init(); Audio.play('magic'); alive = false; s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () => { s.remove(); resolve(); }; }, { once: true });
    });
  }
  function intro() {
    return new Promise((resolve) => {
      const s = el('div'); s.id = 'intro';
      document.body.appendChild(s);
      const { g, w, h, d } = overlayCanvas(s);
      const skip = s.appendChild(el('button', 'btn btn-sm btn-blue skip', esc(t('skip'))));
      const cap = s.appendChild(el('div', 'intro-cap'));
      const bgs = {};
      const bgFor = (k) => {
        if (bgs[k]) return bgs[k];
        const c = document.createElement('canvas'); c.width = w * d; c.height = h * d; const q = c.getContext('2d'); q.scale(d, d);
        Art.scene(q, w, h, 0, { horizon: 0.45 });
        if (k === 'storm' || k === 'trapped') { q.fillStyle = 'rgba(60,30,110,0.5)'; q.fillRect(0, 0, w, h); }
        if (k === 'lumi') { q.fillStyle = 'rgba(255,240,200,0.35)'; q.fillRect(0, 0, w, h); }
        return (bgs[k] = c);
      };
      let idx = 0, T = 0, alive = true, last = performance.now();
      const drops = Array.from({ length: 40 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 8 + Math.random() * 20, v: 60 + Math.random() * 120 }));
      const setCap = () => {
        const p = DATA.INTRO[idx];
        cap.innerHTML = esc(I18N.lang === 'uk' ? p.uk : p.en) + `<div class="dots">${DATA.INTRO.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')}</div>`;
        cap.style.animation = 'none'; void cap.offsetWidth; cap.style.animation = '';
        T = 0;
        Audio.play(idx === 1 ? 'bossRoar' : 'magic');
      };
      const loop = (now) => {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
        const p = DATA.INTRO[idx];
        g.drawImage(bgFor(p.scene), 0, 0, w, h);
        if (p.scene === 'sunny') {
          Art.object(g, w * 0.3, h * 0.55, w * 0.3, 'house', 3, T); Art.object(g, w * 0.75, h * 0.56, w * 0.26, 'windmill', 3, T);
          DATA.CREATURES.slice(0, 5).forEach((c, i) => Art.critter(g, w * (0.12 + i * 0.19), h * 0.68 - Math.abs(Math.sin(T * 3 + i)) * 14, w * 0.16, c.look, { happy: true }));
        } else if (p.scene === 'storm') {
          Art.character(g, w * 0.5, h * 0.24 + Math.sin(T * 2) * 8, w * 0.5, 'murk', { t: T, mood: 'angry' });
          for (const b of drops) { b.y += b.v * dt; if (b.y > h) { b.y = -20; b.x = Math.random() * w; } Art.sphere(g, b.x, b.y, b.r, '#6a5a9a', '#b9a8e8', '#2a1a4a', { shadow: false }); }
        } else if (p.scene === 'trapped') {
          Art.object(g, w * 0.3, h * 0.58, w * 0.34, 'house', 0, T); Art.object(g, w * 0.74, h * 0.6, w * 0.3, 'bridge', 0, T);
          DATA.CREATURES.slice(0, 3).forEach((c, i) => { const x = w * (0.2 + i * 0.3), y = h * 0.74 + Math.sin(T * 2 + i) * 6; g.save(); g.beginPath(); g.arc(x, y, w * 0.09, 0, TAU); g.clip(); Art.critter(g, x, y + 8, w * 0.15, c.look, { sad: true }); g.restore(); Art.glassBubble(g, x, y, w * 0.09, '#b9a8e8'); });
        } else Art.character(g, w * 0.5, h * 0.4 + Math.sin(T * 2) * 10, w * 0.62, 'lumi', { t: T, mood: 'talk', blink: Math.sin(T * 1.4) > 0.97 });
        requestAnimationFrame(loop);
      };
      setCap();
      requestAnimationFrame(loop);
      const end = () => { if (!alive) return; alive = false; State.s.introSeen = true; State.persist(true); s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () => { s.remove(); resolve(); }; };
      tap(skip, end);
      s.addEventListener('click', () => { if (!alive) return; idx++; if (idx >= DATA.INTRO.length) end(); else setCap(); });
    });
  }

  return {
    show, get current() { return current; }, buildHomeHud, syncHome, highlight, playNext, pointAtRestore, drawHome, homePointer, buildAnim,
    openMap, rebuildMap, splash, intro, invalidate() { homeBg = null; },
  };
})();
