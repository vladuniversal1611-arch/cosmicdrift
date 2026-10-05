/* ==========================================================================
   09_ui.js — DOM UI: HUDs, modals and every player-facing flow.
   Screens (home canvas, map, splash, intro) live in 10_screens.js.
   ========================================================================== */
'use strict';

const UI = (() => {
  const FONT = "Nunito, 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const ic = (name, size) => `<img src="${Art.icon(name, size || 48)}" alt="">`;
  const imgCache = {};
  function iconImg(name) {
    const im = imgCache[name];
    if (im) return im.complete ? im : null;
    imgCache[name] = new Image(); imgCache[name].src = Art.icon(name, 64);
    return null;
  }
  let safeCache = null;
  function safe() {
    if (!safeCache) { const r = $('#safeProbe').getBoundingClientRect(); safeCache = { t: r.top || 0, b: Math.max(0, window.innerHeight - r.bottom) || 0 }; }
    return safeCache;
  }
  window.addEventListener('resize', () => { safeCache = null; });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function tap(elm, fn, sound) {
    elm.addEventListener('click', (e) => { e.stopPropagation(); Audio.init(); if (sound !== false) Audio.play('click'); fn(e); });
    return elm;
  }

  // ---------------------------------------------------------------- toast & flying icons
  function toast(text, iconName) {
    const t0 = el('div', 'toast', (iconName ? ic(iconName, 40) : '') + '<span>' + esc(text) + '</span>');
    $('#toast').appendChild(t0);
    setTimeout(() => t0.remove(), 2500);
  }
  function fly(iconName, from, to, count) {
    if (!from || !to || !from.isConnected) return Promise.resolve();
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const n = Math.min(count || 5, 10), src = Art.icon(iconName, 48), jobs = [];
    for (let i = 0; i < n; i++) {
      const im = el('img'); im.src = src;
      const x0 = a.left + a.width / 2 - 18 + (Math.random() - 0.5) * 40, y0 = a.top + a.height / 2 - 18 + (Math.random() - 0.5) * 30;
      const x1 = b.left + b.width / 2 - 18, y1 = b.top + b.height / 2 - 18;
      im.style.left = x0 + 'px'; im.style.top = y0 + 'px';
      $('#fly').appendChild(im);
      const anim = im.animate([
        { transform: 'translate(0,0) scale(0.4)', opacity: 0 },
        { transform: `translate(${(Math.random() - 0.5) * 60}px, ${-30 - Math.random() * 30}px) scale(1.15)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(0.7)`, opacity: 1 },
      ], { duration: 700 + i * 60, easing: 'cubic-bezier(.55,.05,.7,.95)', delay: i * 55, fill: 'forwards' });
      jobs.push(new Promise((res) => { anim.onfinish = () => { im.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); Audio.play(iconName === 'coin' ? 'coin' : 'collect', i); res(); }; }));
    }
    return Promise.all(jobs);
  }

  // ---------------------------------------------------------------- modal system
  const stack = [];
  function modal(opt) {
    const root = el('div'); root.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    const bd = el('div', 'backdrop'); root.appendChild(bd);
    const wrap = el('div', 'modal-wrap'); root.appendChild(wrap);
    const m = el('div', 'modal ' + (opt.cls || '')); wrap.appendChild(m);
    const panel = el('div', 'panel'); m.appendChild(panel);
    if (opt.title) { const hd = el('div', 'panel-head'); hd.appendChild(el('div', 'ribbon', esc(opt.title))); panel.appendChild(hd); }
    else panel.style.paddingTop = '22px';
    let resolveFn;
    const done = new Promise((r) => { resolveFn = r; });
    const api = {
      root, panel, done,
      close(v) {
        if (api.closed) return; api.closed = true;
        Audio.play('close');
        stack.splice(stack.indexOf(api), 1);
        m.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.85)', opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
        bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
        setTimeout(() => root.remove(), 170);
        if (opt.onClose) opt.onClose(v);
        resolveFn(v);
      },
    };
    if (opt.close !== false) {
      tap(panel.appendChild(el('button', 'close-x', '×')), () => api.close(null), false);
      if (opt.tapOutside !== false) bd.addEventListener('click', () => api.close(null));
    }
    if (opt.body) opt.body(panel, api);
    $('#modals').appendChild(root);
    stack.push(api);
    Audio.play('open');
    return api;
  }
  function confirm(text, yes, no, yesCls) {
    return modal({ close: false, body: (p, api) => {
      p.appendChild(el('div', 'inner center h3', esc(text)));
      const row = el('div', 'btn-row');
      row.appendChild(tap(el('button', 'btn btn-grey', esc(no || t('no'))), () => api.close(false)));
      row.appendChild(tap(el('button', 'btn ' + (yesCls || 'btn-green'), esc(yes || t('yes'))), () => api.close(true)));
      p.appendChild(row);
    } }).done;
  }

  // ---------------------------------------------------------------- reward tiles
  function itemIcon(it) {
    return { coins: 'coin', mat: it.id, booster: it.id, life: 'heart', chest: 'chest_' + it.id, wp: 'wp', creature: 'cr_' + it.id, stars: 'star' }[it.type] || 'star';
  }
  function itemLabel(it) {
    switch (it.type) {
      case 'coins': case 'mat': case 'wp': case 'stars': return '+' + it.n;
      case 'booster': return '×' + it.n;
      case 'life': return '∞ ' + t('minutes', { n: it.n });
      case 'chest': return L(DATA.CHESTS[it.id].name).split(' ')[0];
      case 'creature': { const c = DATA.CREATURES.find((z) => z.id === it.id); return c ? L(c.name) : ''; }
    }
    return '';
  }
  function rewardRow(items, big) {
    const row = el('div', 'rewards'), merged = [];
    for (const it of items) {
      const m = it.type !== 'chest' && it.type !== 'creature' && merged.find((x) => x.type === it.type && x.id === it.id);
      if (m) m.n += it.n; else merged.push(Object.assign({}, it));
    }
    merged.forEach((it, i) => {
      const tile = el('div', 'rw' + (big ? ' big' : ''), ic(itemIcon(it), 64) + `<span>${esc(itemLabel(it))}</span>`);
      tile.style.animationDelay = (0.2 + i * 0.08) + 's';
      tile.dataset.type = it.type; tile.dataset.id = it.id || '';
      row.appendChild(tile);
    });
    return row;
  }
  // After a reward panel closes, its tiles fly into the top-bar counters.
  function flyRewards(row) {
    if (!row || Screens.current !== 'home') { Screens.syncHome(); return Promise.resolve(); }
    const jobs = [];
    for (const tile of $$('.rw', row)) {
      const type = tile.dataset.type;
      const target = type === 'coins' ? $('#chipCoins') : (type === 'mat' || type === 'stars') ? $('#chipStars') : type === 'life' ? $('#chipLives') : null;
      if (target) jobs.push(fly(itemIcon({ type, id: tile.dataset.id }), tile, target, type === 'coins' ? 6 : 3));
    }
    return Promise.all(jobs).then(() => Screens.syncHome());
  }

  // ---------------------------------------------------------------- small canvas art in panels
  function artCanvas(w, h, draw) {
    const c = el('canvas'), d = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = w * d; c.height = h * d; c.style.width = w + 'px'; c.style.height = h + 'px';
    const g = c.getContext('2d'); g.scale(d, d); draw(g, w, h);
    return c;
  }
  function animCanvas(w, h, draw) {
    const c = artCanvas(w, h, () => {}), g = c.getContext('2d'), t0 = performance.now();
    const loop = (now) => { if (!c.isConnected && now - t0 > 500) return; g.clearRect(0, 0, w, h); draw(g, w, h, (now - t0) / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return c;
  }
  function sunburst(g, w, h, tt) {
    g.save(); g.translate(w / 2, h / 2); g.rotate(tt * 0.4);
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = i % 2 ? 'rgba(255,240,160,0.55)' : 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-w * 0.08, -w); g.lineTo(w * 0.08, -w); g.closePath(); g.fill(); }
    g.restore();
  }

  // ---------------------------------------------------------------- objectives
  function objIcon(level) {
    const o = level.objective;
    switch (o.type) {
      case 'clear': return 'bub_1'; case 'top': return 'bub_3';
      case 'rescue': return 'cr_' + ((level.cells.find((c) => c.t === 'm') || {}).cr || 'pip');
      case 'stars': return 'star'; case 'butterflies': return 'cell_f'; case 'crystals': return 'crystal'; case 'chains': return 'cell_ch';
      case 'color': return 'bub_' + o.color; case 'boss': return 'boss_' + level.area;
    }
    return 'star';
  }
  function objText(level) {
    const o = level.objective;
    if (o.type === 'boss') return t('obj.boss', { name: L(level.boss.name) });
    if (o.type === 'color') return t('obj.color', { n: o.target, color: t('col.' + o.color) });
    return t('obj.' + o.type, { n: o.target });
  }

  // ================================================================ GAME HUD
  let goalShown = '';
  function buildGameHud() {
    $('#gameHud').innerHTML = `
      <div class="g-top">
        <button class="card g-pause" id="gPause"><span class="pause-glyph"><i></i><i></i></span></button>
        <div class="card g-level"><div class="lv" id="gLevel"></div><div class="area" id="gArea"></div></div>
        <div class="card g-goal"><div class="cap">${esc(t('goal'))}</div><div class="goal-row"><span id="gGoalIco"></span><div class="num" id="gGoal"></div></div></div>
        <div class="card g-moves"><div class="cap">${esc(t('moves'))}</div><div class="num" id="gMoves"></div><div class="mini-stars" id="gStars"></div></div>
      </div>
      <div class="g-bottom"><div class="boost-bar" id="gBoosts"></div></div>
      <div class="mode-bar hidden" id="gMode"></div>`;
    tap($('#gPause'), () => pause());
    for (const id of DATA.INLEVEL_BOOSTERS) {
      const b = el('button', 'boost', ic(id, 64) + '<span class="cnt"></span>'); b.id = 'boost_' + id;
      tap(b, () => onBoosterTap(id));
      $('#gBoosts').appendChild(b);
    }
  }
  function syncGameHud() {
    const lv = Game.level; if (!lv) return;
    $('#gLevel').textContent = t('levelN', { n: lv.id });
    $('#gArea').textContent = L(DATA.AREAS[lv.area].name);
    const mv = $('#gMoves'); mv.textContent = Math.max(0, Game.moves); mv.classList.toggle('low', Game.moves <= 3 && !Game.over);
    const marks = Levels.starMarks(lv), used = Game.movesUsed;
    const st = used <= marks[0] ? 3 : used <= marks[1] ? 2 : 1;
    $('#gStars').innerHTML = [0, 1, 2].map((i) => ic(i < st ? 'star' : 'starGrey', 24)).join('');
    const icoEl = $('#gGoalIco'), k = objIcon(lv);
    if (icoEl.dataset.k !== k) { icoEl.innerHTML = ic(k, 64); icoEl.dataset.k = k; }
    goalShown = ''; animateGoal(Game.shownGoal);
    syncBoosters();
  }
  function animateGoal(cur) {
    if (!Game.level || !Game.board) return;
    const pr = Game.board.progress();
    const shown = Math.min(cur, pr.target);
    const key = shown + '/' + pr.target + (pr.done ? 'd' : '');
    if (key === goalShown) return;
    goalShown = key;
    const remain = Math.max(0, Math.ceil(pr.target - shown));
    $('#gGoal').innerHTML = remain === 0 && pr.done ? '<span class="done">✓</span>' : String(remain);
  }
  function goalPoint() { const r = $('#gGoalIco').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function bumpGoal() { const e = $('#gGoalIco'); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
  function syncBoosters() {
    const lv = Game.level;
    for (const id of DATA.INLEVEL_BOOSTERS) {
      const b = $('#boost_' + id); if (!b) continue;
      const d = DATA.BOOSTERS[id], n = State.s.boosters[id] || 0;
      const locked = lv && lv.id < d.unlock && n <= 0;
      b.classList.toggle('locked', !!locked);
      const cnt = $('.cnt', b);
      cnt.className = 'cnt' + (!locked && n === 0 ? ' buy' : '');
      cnt.textContent = locked ? 'Lv ' + d.unlock : n > 0 ? n : '+';
    }
  }
  async function onBoosterTap(id) {
    const lv = Game.level, d = DATA.BOOSTERS[id];
    if (lv.id < d.unlock && !(State.s.boosters[id] > 0)) { toast(t('needLevel', { n: d.unlock }), id); return; }
    if (Game.busy || Game.over) return;
    if ((State.s.boosters[id] || 0) <= 0) { Game.cancelMode(); if (!(await buyConfirm(id))) return; }
    Game.useBooster(id);
    syncBoosters();
  }
  function buyConfirm(id) {
    const d = DATA.BOOSTERS[id];
    return modal({ title: L(d.name), body: (p, api) => {
      p.appendChild(el('div', 'inner col center', `<div style="width:90px;height:90px">${ic(id, 90)}</div><div class="h3">${esc(L(d.desc))}</div>`));
      p.appendChild(tap(el('button', 'btn btn-green', `${esc(t('buy'))} <span class="price">${ic('coin', 32)}${d.price}</span>`), () => {
        if (!State.buyBooster(id)) { toast(t('notEnough'), 'coin'); api.close(false); return; }
        Audio.play('coin', 0); api.close(true);
      }));
      p.appendChild(el('div', 'muted center', `${ic('coin', 20)} ${U.fmtNum(State.s.coins)}`));
    } }).done;
  }
  function boosterMode(mode, colors) {
    const bar = $('#gMode');
    for (const id of DATA.INLEVEL_BOOSTERS) $('#boost_' + id).classList.toggle('active', id === mode);
    if (!mode) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    bar.innerHTML = `<span>${esc(mode === 'color' ? t('pickColor') : mode === 'hammer' ? t('tapBubble') : t('bombArmed'))}</span>`;
    if (mode === 'color') for (const c of colors) bar.appendChild(tap(el('button', 'pick', ic('bub_' + c, 48)), () => Game.colorBlast(c)));
    bar.appendChild(tap(el('button', 'btn btn-sm btn-grey', esc(t('cancel'))), () => Game.cancelMode()));
  }

  // ================================================================ LEVEL START
  function openLevel(id) {
    if (!State.canPlay(id)) return null;
    if (!State.canStart()) { lives(); return null; }
    const lv = Levels.get(id);
    const grants = State.pendingGrants(id);
    const pre = new Set();
    // One "NEW" card at most: a new obstacle wins over a new objective.
    let card = null;
    if (lv.intro && !State.s.cards[lv.intro]) card = lv.intro;
    else if (lv.objective.type !== 'clear' && !State.s.cards['o_' + lv.objective.type]) card = 'o_' + lv.objective.type;
    const m = modal({ title: t('levelN', { n: id }), body: (p, api) => {
      const area = DATA.AREAS[lv.area];
      p.appendChild(el('div', 'row center', `<span class="pill blue">${esc(L(area.name))}</span>` + (lv.hard ? `<span class="pill red">${esc(t('hardLevel'))}</span>` : '') + (lv.boss ? `<span class="pill red">${esc(t('boss'))}</span>` : '')));
      const inner = el('div', 'inner col');
      if (lv.boss) { const art = el('div', 'hero-art'); art.appendChild(animCanvas(160, 120, (g, w, h, tt) => Art.boss(g, w / 2, h / 2 + 4, 110, lv.boss.hue, { t: tt, final: lv.boss.final, blink: Math.sin(tt * 1.3) > 0.98 }))); inner.appendChild(art); }
      inner.appendChild(el('div', 'goal-big', `<div class="ico">${ic(objIcon(lv), 64)}</div><div class="col" style="gap:3px"><div class="h2">${esc(objText(lv))}</div><div class="muted">${esc(t('moves'))}: ${lv.moves} · ${esc(t('threeStars', { n: Levels.starMarks(lv)[0] }))}</div></div>`));
      if (card) {
        const k = card.startsWith('o_') ? card.slice(2) : card;
        const txt = DATA.INTRO_CARDS[k];
        if (txt) {
          const iconName = { stone: 'cell_s', ice: 'cell_i', chain: 'cell_ch', bomb: 'cell_b', rainbow: 'rainbow', rotator: 'cell_rot', locked: 'cell_l', dark: 'cell_d' }[k] || objIcon(lv);
          inner.appendChild(el('div', 'new-card', `${ic(iconName, 64)}<div class="col" style="gap:2px"><span class="pill red" style="align-self:flex-start">${esc(t('newTag'))}</span><div class="h3">${esc(L(txt))}</div></div>`));
          State.s.cards[card] = 1; State.persist();
        }
      }
      p.appendChild(inner);
      if (id >= DATA.BOOSTERS.rainbow.unlock) {
        p.appendChild(el('div', 'section-title center', esc(t('boostersTitle'))));
        const pb = el('div', 'pre-boosts');
        for (const b of DATA.PRE_BOOSTERS) {
          const d = DATA.BOOSTERS[b], locked = id < d.unlock;
          const btn = el('button', 'pre' + (locked ? ' locked' : ''), ic(b, 64) + '<span class="cnt"></span>' + (grants.some((g0) => g0.id === b) ? `<span class="new-dot">${esc(t('newTag'))}</span>` : ''));
          const sync = () => { const n = State.s.boosters[b] || 0, c = $('.cnt', btn); c.className = 'cnt' + (!locked && n === 0 ? ' buy' : ''); c.textContent = locked ? 'Lv ' + d.unlock : n > 0 ? n : '+'; btn.classList.toggle('on', pre.has(b)); };
          sync();
          tap(btn, async () => {
            if (locked) { toast(t('needLevel', { n: d.unlock }), b); return; }
            if (pre.has(b)) { pre.delete(b); sync(); return; }
            if ((State.s.boosters[b] || 0) <= 0 && !(await buyConfirm(b))) return;
            pre.add(b); sync();
          });
          pb.appendChild(btn);
        }
        p.appendChild(pb);
      }
      p.appendChild(tap(el('button', 'btn btn-green btn-lg', esc(t('play'))), async () => {
        for (const b of [...pre]) if (!State.useBooster(b)) pre.delete(b);
        api.close('play');
        await startLevel(id, [...pre], grants);
      }));
    } });
    for (const g0 of grants) if (DATA.BOOSTERS[g0.id].kind === 'inlevel') toast(`${L(DATA.BOOSTERS[g0.id].name)} ×${g0.n}`, g0.id);
    return m.done;
  }
  async function startLevel(id, pre, grants) {
    if (!State.canStart()) { lives(); return; }
    State.startLevelLife();
    Screens.show('game');
    Game.start(id, pre);
    const lv = Game.level;
    if (lv.boss) { Game.paused = true; await story('boss:' + id); Game.paused = false; }
    if (grants && grants.some((g0) => g0.id === 'hammer')) { const b = $('#boost_hammer'); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 4 }); }
  }

  // ================================================================ WIN / LOSE
  async function levelWon(r) {
    const lv = r.level;
    State.refundLevelLife();
    const res = State.recordWin(lv, r.stars, r.score);
    Monetization.maybeInterstitial(lv.id, true);
    let rowRef = null;
    const m = modal({ title: lv.boss ? '★ ' + L(lv.boss.name) + ' ★' : t('levelComplete'), close: false, body: (p, api) => {
      const art = el('div', 'hero-art');
      const friend = State.s.chars.includes('milo') ? 'milo' : null;
      art.appendChild(animCanvas(200, 120, (g, w, h, tt) => {
        Art.character(g, w / 2 - (friend ? 44 : 0), h / 2 + 8 - Math.abs(Math.sin(tt * 5)) * 10, 86, 'lumi', { t: tt, mood: 'wow' });
        if (friend) Art.character(g, w / 2 + 48, h / 2 + 18 - Math.abs(Math.sin(tt * 5 + 1)) * 8, 76, friend, { mood: 'happy', t: tt });
      }));
      p.appendChild(art);
      const stars = el('div', 'stars-big', [0, 1, 2].map((i) => `<img src="${Art.icon(i < r.stars ? 'star' : 'starGrey', 96)}">`).join(''));
      p.appendChild(stars);
      const inner = el('div', 'inner col center');
      inner.appendChild(el('div', 'score-line', `${esc(t('score'))}<b id="winScore">0</b>`));
      rowRef = rewardRow(res.items.concat(res.creature ? [{ type: 'creature', id: res.creature }] : []));
      inner.appendChild(rowRef);
      p.appendChild(inner);
      const row = el('div', 'btn-row');
      if (Monetization.adsAvailable() && res.first) {
        const coins = res.items.filter((x) => x.type === 'coins').reduce((a, b) => a + b.n, 0);
        const dbl = tap(el('button', 'btn btn-purple', '▶ ×2'), async () => { if (await Monetization.rewarded('double')) { State.grant({ coins }); toast('+' + coins, 'coin'); dbl.remove(); } });
        row.appendChild(dbl);
      }
      row.appendChild(tap(el('button', 'btn btn-green btn-lg', esc(t('continue'))), () => api.close('home')));
      p.appendChild(row);
      (async () => {
        await wait(300);
        const imgs = $$('img', stars);
        for (let i = 0; i < 3; i++) { imgs[i].classList.add('in'); if (i < r.stars) { Audio.play('star', i); Audio.vib(20); } await wait(260); }
        const sc = $('#winScore'), t0 = performance.now();
        const tick = (now) => { const k = Math.min(1, (now - t0) / 700); if (sc) sc.textContent = U.fmtNum(r.score * k); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      })();
    } });
    await m.done;
    Game.active = false;
    Screens.show('home');
    await wait(250);
    await flyRewards(rowRef);
    await afterWinQueue(lv, res);
  }
  // The single reward sequence continues on the home screen:
  // story → new friend → creature → chests → feature unlocks → area celebration.
  async function afterWinQueue(lv, res) {
    await story('win:' + lv.id);
    for (const ch of res.newChars) await friendCard(ch);
    if (res.creature) await creatureCard(res.creature);
    const tiers = res.items.filter((x) => x.type === 'chest').map((x) => x.id).concat(res.chests);
    for (let i = 0; i < tiers.length; i++) await openChest(tiers[i], i >= tiers.length - res.chests.length ? t('starChest') : null);
    for (const f of res.features) { toast(t('feat.' + f) + ' — ' + t('newFeature'), featureIcon(f)); Screens.highlight(f); await wait(400); }
    if (res.areaDone) await areaCelebration(lv.area);
    Screens.syncHome();
    const left = State.areaBoss(lv.area) - lv.id;
    if (left > 0 && left <= 3 && lv.area + 1 < DATA.AREAS.length) toast(t('nextAreaIn', { n: left, area: L(DATA.AREAS[lv.area + 1].name) }), 'map');
    Screens.pointAtRestore();
  }
  function featureIcon(f) { return { restore: 'star', daily: 'daily', shop: 'shop', map: 'map', quests: 'quests', collection: 'collection', weekly: 'weekly', starChest: 'chest_silver' }[f] || 'star'; }

  function outOfMoves(pr, continues) {
    const lv = Game.level;
    const price = DATA.CONTINUE_PRICES[Math.min(continues, DATA.CONTINUE_PRICES.length - 1)];
    return modal({ title: t('outOfMoves'), close: false, body: (p, api) => {
      const remain = Math.max(0, Math.ceil(pr.target - pr.cur));
      p.appendChild(el('div', 'inner col center', `<div class="goal-big"><div class="ico">${ic(objIcon(lv), 64)}</div><div class="h2">${remain}</div></div><div class="h3">${esc(t('keepPlaying'))}</div><div class="muted">${ic('coin', 20)} ${U.fmtNum(State.s.coins)}</div>`));
      const b = tap(el('button', 'btn btn-green btn-lg', `${esc(t('plus5'))} <span class="price">${ic('coin', 32)}${price}</span>`), () => {
        if (!State.spend(price)) { toast(t('notEnough'), 'coin'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; }
        api.close('continue'); Game.continueWith(5);
      });
      p.appendChild(b);
      if (Monetization.adsAvailable()) p.appendChild(tap(el('button', 'btn btn-purple', `▶ ${esc(t('plus5'))}`), async () => { if (await Monetization.rewarded('continue')) { api.close('continue'); Game.continueWith(5); } }));
      p.appendChild(el('div', 'muted center', esc(t('loseLifeWarn'))));
      p.appendChild(tap(el('button', 'btn btn-sm btn-red', esc(t('giveUp'))), () => { api.close('giveup'); failPanel(pr); }));
    } });
  }
  function failPanel(pr) {
    const lv = Game.level;
    Game.giveUp();
    State.settleLevelLife();
    Audio.play('lose');
    const remain = Math.max(0, Math.ceil(pr.target - pr.cur));
    const close = pr.target && pr.cur / pr.target >= 0.75;
    modal({ title: t('levelFailed'), close: false, body: (p, api) => {
      const art = el('div', 'hero-art');
      art.appendChild(animCanvas(160, 110, (g, w, h, tt) => Art.character(g, w / 2, h / 2 + 4, 96, 'lumi', { t: tt, mood: 'sad' })));
      p.appendChild(art);
      const inner = el('div', 'inner col center');
      inner.innerHTML = (close ? `<div class="h2">${esc(t('soClose', { n: remain }))}</div>` : '') +
        `<div class="row center">${ic('heart', 40)}<span class="h2">${State.infinite() ? '∞' : State.s.lives}</span></div>` +
        (!State.infinite() && State.s.lives < DATA.LIVES.max ? `<div class="muted">${esc(t('nextLife', { t: U.fmtTime(State.nextLifeMs()) }))}</div>` : '');
      p.appendChild(inner);
      const row = el('div', 'btn-row');
      row.appendChild(tap(el('button', 'btn btn-blue', esc(t('home'))), () => { api.close(); Screens.show('home'); }));
      row.appendChild(tap(el('button', 'btn btn-green', esc(t('retry'))), () => { api.close(); Screens.show('home'); openLevel(lv.id); }));
      p.appendChild(row);
    } });
  }
  function pause() {
    if (!Game.active || Game.over) return;
    Game.paused = true;
    modal({ title: t('paused'), onClose: () => { Game.paused = false; }, body: (p, api) => {
      const inner = el('div', 'inner col');
      inner.appendChild(settingRow(t('sound'), 'sound'));
      inner.appendChild(settingRow(t('music'), 'music'));
      inner.appendChild(settingRow(t('colorSymbols'), 'symbols'));
      p.appendChild(inner);
      p.appendChild(tap(el('button', 'btn btn-green btn-lg', esc(t('resume'))), () => api.close()));
      p.appendChild(tap(el('button', 'btn btn-sm btn-red', esc(t('quitLevel'))), async () => {
        if (!(await confirm(t('quitWarn'), t('quitLevel'), t('cancel'), 'btn-red'))) return;
        api.close(); Game.giveUp(); State.settleLevelLife(); Screens.show('home');
      }));
    } });
  }
  function settingRow(label, key) {
    const r = el('div', 'set-row', `<span>${esc(label)}</span>`);
    const sw = el('button', 'switch' + (State.s.settings[key] ? ' on' : ''));
    tap(sw, () => { State.s.settings[key] = State.s.settings[key] ? 0 : 1; sw.classList.toggle('on', !!State.s.settings[key]); State.persist(); Audio.applySettings(); });
    r.appendChild(sw);
    return r;
  }

  // ================================================================ STORY DIALOGS
  const storyQ = [];
  let storyBusy = false;
  function story(key) {
    const lines = DATA.STORY[key];
    if (!lines || State.s.seen[key]) return Promise.resolve();
    State.s.seen[key] = 1; State.persist();
    return new Promise((resolve) => { storyQ.push({ lines, resolve }); if (!storyBusy) runStory(); });
  }
  async function runStory() {
    storyBusy = true;
    while (storyQ.length) {
      const { lines, resolve } = storyQ.shift();
      const shade = el('div'); shade.id = 'storyShade'; document.body.appendChild(shade);
      const box = el('div'); box.id = 'story'; document.body.appendChild(box);
      for (const line of lines) {
        const ch = DATA.CHARACTERS[line.who];
        box.innerHTML = '';
        const dlg = el('div', 'dlg');
        const who = animCanvas(108, 120, (g, w, h, tt) => Art.character(g, w / 2, h / 2 + 10, 96, line.who, { t: tt, mood: 'talk', blink: Math.sin(tt * 1.5) > 0.97, redeemed: line.who === 'murk' && State.s.best[160] > 0 }));
        who.className = 'who';
        dlg.appendChild(who);
        dlg.appendChild(el('div', 'name', esc(L(ch.name))));
        const txt = dlg.appendChild(el('div', 'txt', ''));
        dlg.appendChild(el('div', 'tap', esc(t('tapToContinue'))));
        box.appendChild(dlg);
        const full = I18N.lang === 'uk' ? line.uk : line.en;
        await new Promise((res) => {
          let i = 0, finished = false;
          const typer = setInterval(() => {
            i += 2; txt.textContent = full.slice(0, i);
            if (i % 6 === 0) Audio.play('talk');
            if (i >= full.length) { clearInterval(typer); finished = true; }
          }, 22);
          const onTap = (e) => {
            e.stopPropagation();
            if (!finished) { clearInterval(typer); txt.textContent = full; finished = true; return; }
            box.removeEventListener('click', onTap); shade.removeEventListener('click', onTap); res();
          };
          box.addEventListener('click', onTap); shade.addEventListener('click', onTap);
        });
        Audio.play('click');
      }
      box.remove(); shade.remove();
      resolve();
    }
    storyBusy = false;
  }

  // ================================================================ CARDS & CELEBRATIONS
  function friendCard(id) {
    const ch = DATA.CHARACTERS[id];
    Audio.play('rescue');
    return modal({ title: t('newFriend'), body: (p, api) => {
      const art = el('div', 'hero-art'); art.appendChild(animCanvas(180, 150, (g, w, h, tt) => { sunburst(g, w, h, tt); Art.character(g, w / 2, h / 2 + 8, 120, id, { t: tt, mood: 'happy', blink: Math.sin(tt * 1.4) > 0.97 }); }));
      p.appendChild(art);
      p.appendChild(el('div', 'inner col center', `<div class="h2">${esc(L(ch.name))}</div><div class="pill blue">${esc(L(ch.role))}</div><div class="h3" style="font-weight:800">${esc(L(ch.bio))}</div>`));
      p.appendChild(tap(el('button', 'btn btn-green', esc(t('ok'))), () => api.close()));
    } }).done;
  }
  function creatureCard(id) {
    const c = DATA.CREATURES.find((z) => z.id === id);
    Audio.play('rescue');
    return modal({ title: t('creature') + ' #' + (DATA.CREATURES.indexOf(c) + 1), body: (p, api) => {
      const art = el('div', 'hero-art'); art.appendChild(animCanvas(180, 150, (g, w, h, tt) => { sunburst(g, w, h, tt); Art.critter(g, w / 2, h / 2 + 12 - Math.abs(Math.sin(tt * 3)) * 6, 110, c.look, { happy: Math.sin(tt * 2) > 0.3 }); }));
      p.appendChild(art);
      p.appendChild(el('div', 'inner col center', `<div class="h2">${esc(L(c.name))}</div><span class="rr ${c.r}">${esc(t('rarity_' + c.r))}</span><div class="h3" style="font-weight:800">${esc(L(c.desc))}</div><div class="muted">${State.creaturesFound()}/${DATA.CREATURES.length}</div>`));
      p.appendChild(tap(el('button', 'btn btn-green', esc(t('ok'))), () => api.close()));
    } }).done;
  }
  async function areaCelebration(a) {
    Audio.play('win');
    const next = DATA.AREAS[a + 1];
    await modal({ title: t('areaRestored', { area: L(DATA.AREAS[a].name) }), body: (p, api) => {
      const art = el('div', 'hero-art');
      art.appendChild(animCanvas(260, 160, (g, w, h, tt) => {
        sunburst(g, w, h, tt);
        DATA.AREAS[a].objects.forEach((o, i) => Art.object(g, w * (0.2 + i * 0.3), h * 0.85, 70, o.type, 3, tt));
        Art.character(g, w * 0.5, h * 0.3 + Math.sin(tt * 3) * 5, 60, 'lumi', { t: tt, mood: 'wow' });
      }));
      p.appendChild(art);
      p.appendChild(el('div', 'inner col center', next ? `<div class="h2">${esc(t('newArea'))}</div><div class="ribbon" style="font-size:18px">${esc(L(next.name))}</div>` : `<div class="h2">${esc(t('theEnd'))}</div><div class="h3">${esc(t('theEndText'))}</div>`));
      p.appendChild(tap(el('button', 'btn btn-green btn-lg', esc(t('continue'))), () => api.close()));
    } }).done;
    await story('area:' + a);
    if (State.s.chests.includes('legendary')) await openChest('legendary');
  }

  // ================================================================ CHESTS
  function openChest(tier, subtitle) {
    let rowRef = null;
    const m = modal({ title: subtitle || L(DATA.CHESTS[tier].name), close: false, body: (p, api) => {
      let opened = false;
      const art = el('div', 'hero-art');
      art.appendChild(animCanvas(220, 170, (g, w, h, tt) => {
        if (opened) sunburst(g, w, h, tt);
        g.save(); g.translate(w / 2, h * 0.62); g.rotate(opened ? 0 : Math.sin(tt * 18) * (Math.sin(tt * 2) > 0.3 ? 0.06 : 0)); Art.chest(g, 0, 0, 150, tier, opened, tt); g.restore();
      }));
      p.appendChild(art);
      const inner = p.appendChild(el('div', 'inner col center', `<div class="h2">${esc(t('tapOpen'))}</div>`));
      const btn = el('button', 'btn btn-orange btn-lg', esc(t('open')));
      const doOpen = () => {
        if (opened) { api.close(); return; }
        opened = true; Audio.play('chestOpen'); Audio.vib([20, 40, 60]);
        const items = State.openChest(tier);
        inner.innerHTML = `<div class="h3">${esc(t('youGot'))}</div>`;
        rowRef = rewardRow(items, true); inner.appendChild(rowRef);
        btn.textContent = t('claim'); btn.className = 'btn btn-green btn-lg';
      };
      tap(btn, doOpen); tap(art, doOpen, false);
      p.appendChild(btn);
    } });
    return m.done.then(async () => {
      await flyRewards(rowRef);
      const cr = rowRef && $$('.rw', rowRef).find((x) => x.dataset.type === 'creature');
      if (cr) await creatureCard(cr.dataset.id);
    });
  }
  async function chestsInventory() { while (State.s.chests.length) await openChest(State.s.chests[0]); }

  // ================================================================ RESTORE
  function restorePanel(a, i) {
    const info = State.objectInfo(a, i), o = info.o;
    if (!info.unlocked) { toast(t('needLevel', { n: o.unlock }), 'lock'); return; }
    if (info.stage >= 3) {
      modal({ title: L(o.name), body: (p, api) => {
        const art = el('div', 'hero-art'); art.appendChild(animCanvas(200, 150, (g, w, h, tt) => { sunburst(g, w, h, tt); Art.object(g, w / 2, h * 0.9, 120, o.type, 3, tt); }));
        p.appendChild(art); p.appendChild(el('div', 'inner center h2', esc(t('restored')) + ' ✦'));
        p.appendChild(tap(el('button', 'btn btn-green', esc(t('ok'))), () => api.close()));
      } });
      return;
    }
    modal({ title: L(o.name), body: (p, api) => {
      p.appendChild(el('div', 'stage-dots', [0, 1, 2].map((k) => `<i class="${k < info.stage ? 'on' : ''}"></i>`).join('')));
      const prev = el('div', 'preview');
      prev.appendChild(artCanvas(130, 120, (g, w, h) => Art.object(g, w / 2, h * 0.88, 88, o.type, info.stage, 0)));
      prev.appendChild(el('div', 'arrow', '➜'));
      prev.appendChild(animCanvas(130, 120, (g, w, h, tt) => Art.object(g, w / 2, h * 0.88, 88, o.type, info.stage + 1, tt)));
      p.appendChild(prev);
      const inner = el('div', 'inner col center');
      inner.appendChild(el('div', 'h2', esc(L(DATA.STAGES[o.type][info.stage]))));
      inner.appendChild(el('div', 'muted', esc(t('stageOf', { a: info.stage + 1, b: 3 }))));
      const costs = el('div', 'costs');
      costs.appendChild(el('div', 'cost' + (State.s.starBank < info.cost.stars ? ' miss' : ''), `${ic('star', 40)}${Math.min(State.s.starBank, info.cost.stars)}/${info.cost.stars}`));
      for (const mId in info.cost.mats) { const have = State.s.mats[mId], need = info.cost.mats[mId]; costs.appendChild(el('div', 'cost' + (have < need ? ' miss' : ''), `${ic(mId, 40)}${Math.min(have, need)}/${need}`)); }
      inner.appendChild(costs);
      if (!info.affordable) inner.appendChild(el('div', 'muted', esc(t('missingMats'))));
      p.appendChild(inner);
      const doBuild = async (payMissing) => {
        const r = State.build(a, i, payMissing);
        if (!r) return;
        api.close('built');
        await Screens.buildAnim(a, i);
        await story(r.story);
        if (r.areaDone) await areaCelebration(a);
        Screens.syncHome(); Screens.pointAtRestore();
      };
      if (info.affordable) p.appendChild(tap(el('button', 'btn btn-green btn-lg', `${ic('hammer', 36)} ${esc(t('build'))}`), () => doBuild(false)));
      else if (info.starsOk && info.missingCoins > 0) {
        p.appendChild(tap(el('button', 'btn btn-orange', `${esc(t('buyMissing'))} <span class="price">${ic('coin', 30)}${info.missingCoins}</span>`), () => { if (State.s.coins < info.missingCoins) { toast(t('notEnough'), 'coin'); return; } doBuild(true); }));
        p.appendChild(tap(el('button', 'btn btn-sm btn-blue', esc(t('play'))), () => { api.close(); Screens.playNext(); }));
      } else p.appendChild(tap(el('button', 'btn btn-green btn-lg', esc(t('play'))), () => { api.close(); Screens.playNext(); }));
    } });
  }

  // ================================================================ DAILY REWARD
  function dailyInfo(i) {
    const d = DATA.DAILY[i];
    if (d.chest) return { icon: 'chest_' + d.chest, label: (d.coins ? '+' + d.coins + ' ' : '') + L(DATA.CHESTS[d.chest].name).split(' ')[0] };
    if (d.coins) return { icon: 'coin', label: '+' + d.coins };
    if (d.lifeMin) return { icon: 'heart', label: '∞ ' + t('minutes', { n: d.lifeMin }) };
    if (d.matsPack) return { icon: DATA.AREAS[State.currentArea()].mats[0], label: '+' + d.matsPack + ' ×2' };
    const k = Object.keys(d.boosters); return { icon: k[0], label: k.length + ' ' + t('boostersTitle').toLowerCase() };
  }
  function daily() {
    const avail = State.dailyAvailable();
    const idx = State.s.daily.claims % 7;
    let rowRef = null, gotChest = null;
    const m = modal({ title: t('dailyReward'), body: (p, api) => {
      const inner = el('div', 'inner col');
      const grid = el('div', 'days');
      for (let i = 0; i < 7; i++) {
        const info = dailyInfo(i);
        // In the current 7-day cycle, earlier days are done; after today's claim, today is done too.
        const got = avail ? i < idx : i < (idx === 0 ? 7 : idx);
        grid.appendChild(el('div', 'day' + (i === 6 ? ' big' : '') + (avail && i === idx ? ' today' : '') + (got ? ' got' : ''), `<span class="d">${esc(t('dayN', { n: i + 1 }))}</span>${ic(info.icon, 56)}<span class="v">${esc(info.label)}</span>`));
      }
      inner.appendChild(grid);
      p.appendChild(inner);
      if (avail) {
        const b = el('button', 'btn btn-green btn-lg', esc(t('claim')));
        tap(b, () => {
          if (rowRef) { api.close(); return; }
          const r = State.claimDaily(); if (!r) return;
          Audio.play('win');
          const tiles = $$('.day', grid); tiles[r.idx].classList.remove('today'); tiles[r.idx].classList.add('got');
          rowRef = rewardRow(r.items, true); inner.appendChild(rowRef);
          gotChest = (r.items.find((x) => x.type === 'chest') || {}).id || null;
          if (r.streakKept) inner.appendChild(el('div', 'muted center', esc(t('streakKept'))));
          b.textContent = t('ok');
          Screens.syncHome();
        });
        p.appendChild(b);
      } else p.appendChild(el('div', 'inner center h3', esc(t('comeBack')) + '<br><span class="muted">' + esc(t('resetsIn', { t: U.fmtTime(U.msToNextDay()) })) + '</span>'));
    } });
    return m.done.then(async () => { await flyRewards(rowRef); if (gotChest) await openChest(gotChest); });
  }

  // ================================================================ QUESTS + WEEKLY
  function questIcon(stat) { return { levelsWon: 'play', popped: 'bub_0', dropped: 'bub_2', boostersUsed: 'hammer', starsEarned: 'star', specials: 'cell_s', combos3: 'bub_4', rescued: 'cr_pip' }[stat] || 'star'; }
  function quests(tab) {
    State.ensureQuests(); State.ensureWeek();
    tab = tab || 'daily';
    modal({ title: t('quests'), cls: 'wide', body: (p, api) => {
      const tabs = p.appendChild(el('div', 'tabs'));
      const tb1 = tabs.appendChild(el('button', 'tab')), tb2 = tabs.appendChild(el('button', 'tab'));
      const inner = p.appendChild(el('div', 'inner scroll col'));
      const render = () => {
        tb1.className = 'tab' + (tab === 'daily' ? ' on' : ''); tb2.className = 'tab' + (tab === 'weekly' ? ' on' : '');
        tb1.innerHTML = esc(t('daily')) + (State.questsClaimable() ? `<span class="badge">${State.questsClaimable()}</span>` : '');
        tb2.innerHTML = esc(t('weekly')) + (State.weeklyClaimable() ? `<span class="badge">${State.weeklyClaimable()}</span>` : '');
        inner.innerHTML = '';
        if (tab === 'daily') {
          inner.appendChild(el('div', 'row', `<div class="h2" style="flex:1">${esc(t('dailyQuests'))}</div><span class="muted">${esc(t('resetsIn', { t: U.fmtTime(U.msToNextDay()) }))}</span>`));
          const list = inner.appendChild(el('div', 'list'));
          State.s.quests.list.forEach((q, i) => {
            const def = DATA.QUESTS.find((d) => d.id === q.id), r = def.reward;
            const rIcon = r.coins ? 'coin' : Object.keys(r.boosters)[0], rVal = r.coins ? '+' + r.coins : '×1';
            const it = el('div', 'item' + (q.done ? ' done' : ''), `<div class="ico">${ic(questIcon(def.stat), 48)}</div><div class="grow"><div class="name">${esc(L(def.text).replace('{n}', q.n))}</div><div class="bar"><i style="width:${Math.round((q.p / q.n) * 100)}%"></i><span>${q.p}/${q.n}</span></div></div>`);
            if (q.done) it.appendChild(el('div', 'pill gold', '✓'));
            else if (q.p >= q.n) it.appendChild(tap(el('button', 'btn btn-sm btn-green', `${ic(rIcon, 24)}${rVal}`), () => { if (State.claimQuest(i)) { toast(t('claimed') + ' ' + rVal, rIcon); Audio.play('coin', 1); } render(); Screens.syncHome(); }));
            else it.appendChild(el('div', 'pill gold', `${ic(rIcon, 16)}${rVal}`));
            list.appendChild(it);
          });
          const doneN = State.s.quests.list.filter((q) => q.done).length;
          const bonus = inner.appendChild(el('div', 'item', `<div class="ico">${ic('chest_' + DATA.QUEST_BONUS_CHEST, 48)}</div><div class="grow"><div class="name">${esc(t('bonusChest'))}</div><div class="bar gold"><i style="width:${(doneN / 3) * 100}%"></i><span>${doneN}/3</span></div></div>`));
          if (State.questBonusReady()) bonus.appendChild(tap(el('button', 'btn btn-sm btn-orange', esc(t('claim'))), async () => { State.claimQuestBonus(); api.close(); await openChest(DATA.QUEST_BONUS_CHEST); Screens.syncHome(); }));
          else if (State.s.quests.bonus) bonus.appendChild(el('div', 'pill gold', '✓'));
        } else {
          const w = State.s.weekly, max = DATA.WEEKLY[DATA.WEEKLY.length - 1].at;
          inner.appendChild(el('div', 'row', `<div class="h2" style="flex:1">${esc(t('weeklyAdv'))}</div><span class="muted">${esc(t('weeklyEnd', { t: U.fmtTime(U.msToNextWeek()) }))}</span>`));
          inner.appendChild(el('div', 'muted', `${ic('wp', 18)} ${esc(t('weeklyPts'))}: <b>${w.pts}</b>`));
          const track = inner.appendChild(el('div', 'track', `<div class="bar pink"><i style="width:${Math.min(100, (w.pts / max) * 100)}%"></i></div>`));
          const ms = track.appendChild(el('div', 'milestones'));
          DATA.WEEKLY.forEach((m0, i) => {
            const got = w.claimed[i];
            const node = el('div', 'ms' + (got ? ' got' : ''), `${ic(m0.reward.chest ? 'chest_' + m0.reward.chest : 'coin', 56)}<span class="at">${m0.at}</span>`);
            node.style.left = Math.min(90, Math.max(10, (m0.at / max) * 100)) + '%';
            if (!got && w.pts >= m0.at) {
              const b = tap(el('button', 'btn btn-sm btn-green', esc(t('claim'))), async () => { State.claimWeekly(i); if (m0.reward.chest) { api.close(); await openChest(m0.reward.chest); } else { toast(t('claimed'), 'coin'); render(); } Screens.syncHome(); });
              b.style.minHeight = '30px'; b.style.fontSize = '13px'; node.appendChild(b);
            } else if (got) node.appendChild(el('span', 'pill gold', '✓'));
            ms.appendChild(node);
          });
          inner.appendChild(el('div', 'muted center', esc(t('weeklyHow'))));
        }
      };
      tap(tb1, () => { tab = 'daily'; render(); }); tap(tb2, () => { tab = 'weekly'; render(); });
      render();
    } });
  }

  // ================================================================ COLLECTION
  function collection(tab) {
    tab = tab || 'creatures';
    modal({ title: t('collection'), cls: 'full', body: (p) => {
      const tabs = p.appendChild(el('div', 'tabs'));
      const tb1 = tabs.appendChild(el('button', 'tab')), tb2 = tabs.appendChild(el('button', 'tab'));
      const inner = p.appendChild(el('div', 'inner scroll col')); inner.style.flex = '1';
      const render = () => {
        tb1.className = 'tab' + (tab === 'creatures' ? ' on' : ''); tb2.className = 'tab' + (tab === 'friends' ? ' on' : '');
        tb1.innerHTML = esc(t('creatures')) + (State.collectionClaimable() ? `<span class="badge">${State.collectionClaimable()}</span>` : '');
        tb2.textContent = t('friends');
        inner.innerHTML = '';
        if (tab === 'creatures') {
          const n = State.creaturesFound();
          inner.appendChild(el('div', 'h2', `${n}/${DATA.CREATURES.length}`));
          const ms = inner.appendChild(el('div', 'row')); ms.style.justifyContent = 'space-around';
          State.COL_MILESTONES.forEach((m0, i) => {
            const got = State.s.colClaimed[i];
            const b = ms.appendChild(el('div', 'col center', `${ic('chest_' + m0.chest, 48)}<span class="muted">${m0.at}</span>`)); b.style.gap = '0';
            if (!got && n >= m0.at) { const bb = tap(el('button', 'btn btn-sm btn-green', esc(t('claim'))), async () => { State.claimCollection(i); await openChest(m0.chest); render(); }); bb.style.minHeight = '28px'; bb.style.fontSize = '12px'; b.appendChild(bb); }
            else if (got) b.style.opacity = '.45';
          });
          const bar = inner.appendChild(el('div', 'bar gold', `<i style="width:${(n / DATA.CREATURES.length) * 100}%"></i>`)); bar.style.width = '100%';
          const grid = inner.appendChild(el('div', 'grid'));
          for (const c of DATA.CREATURES) {
            const found = !!State.s.creatures[c.id];
            grid.appendChild(tap(el('button', 'cc' + (found ? '' : ' unknown'), `${ic((found ? 'cr_' : 'crx_') + c.id, 80)}<span class="nm">${esc(found ? L(c.name) : '???')}</span><span class="rr ${c.r}">${esc(t('rarity_' + c.r))}</span>`),
              () => { if (found) creatureCard(c.id); else toast(t('foundIn', { area: L(DATA.AREAS[c.area].name) }), 'map'); }));
          }
        } else {
          for (const id of Object.keys(DATA.CHARACTERS)) {
            const ch = DATA.CHARACTERS[id];
            const known = State.s.chars.includes(id) || (id === 'murk' && State.s.seen['boss:20']);
            const card = inner.appendChild(el('div', 'char-card', `${ic('char_' + id, 80)}<div class="col" style="gap:3px"><div class="h2">${esc(known ? L(ch.name) : '???')}</div><span class="pill blue" style="align-self:flex-start">${esc(known ? L(ch.role) : t('notFound'))}</span><div class="muted">${esc(known ? L(ch.bio) : '')}</div></div>`));
            if (!known) card.querySelector('img').style.filter = 'brightness(0.15)';
          }
        }
      };
      tap(tb1, () => { tab = 'creatures'; render(); }); tap(tb2, () => { tab = 'friends'; render(); });
      render();
    } });
  }

  // ================================================================ SHOP
  function shop() {
    modal({ title: t('shop'), cls: 'full', body: (p) => {
      const coinsRow = p.appendChild(el('div', 'row center'));
      const inner = p.appendChild(el('div', 'inner scroll col')); inner.style.flex = '1';
      const render = () => {
        coinsRow.innerHTML = `<div class="chip" style="margin-left:14px">${ic('coin', 48)}<span>${U.fmtNum(State.s.coins)}</span></div>`;
        Screens.syncHome();
        inner.innerHTML = '';
        if (Monetization.iapAvailable()) {
          inner.appendChild(el('div', 'section-title', esc(t('coins'))));
          const list = inner.appendChild(el('div', 'list'));
          for (const prod of Monetization.provider().products) {
            const it = list.appendChild(el('div', 'item', `<div class="ico">${ic(prod.reward.coins ? 'coin' : 'daily', 48)}</div><div class="grow"><div class="name">${esc(prod.title || prod.sku)}</div></div>`));
            it.appendChild(tap(el('button', 'btn btn-sm btn-green', esc(prod.price)), async () => { if (await Monetization.purchase(prod.sku)) render(); }));
          }
        }
        inner.appendChild(el('div', 'section-title', esc(t('lives'))));
        const li = inner.appendChild(el('div', 'item', `<div class="ico">${ic('heart', 48)}</div><div class="grow"><div class="name">${esc(t('lifeRefill'))}</div><div class="desc">${State.infinite() ? '∞' : State.s.lives}/${DATA.LIVES.max}</div></div>`));
        li.appendChild(tap(el('button', 'btn btn-sm btn-green', `<span class="price">${ic('coin', 22)}${DATA.LIVES.refillPrice}</span>`), () => {
          if (State.s.lives >= DATA.LIVES.max) { toast(t('livesFullAlready'), 'heart'); return; }
          if (!State.refillLives()) { toast(t('notEnough'), 'coin'); return; }
          Audio.play('magic'); render();
        }));
        inner.appendChild(el('div', 'section-title', esc(t('boostersTitle'))));
        const list = inner.appendChild(el('div', 'list'));
        for (const b of Object.keys(DATA.BOOSTERS)) {
          const d = DATA.BOOSTERS[b], locked = State.s.level < d.unlock;
          const it = list.appendChild(el('div', 'item' + (locked ? ' done' : ''), `<div class="ico">${ic(b, 48)}</div><div class="grow"><div class="name">${esc(L(d.name))} <span class="muted">×${State.s.boosters[b] || 0}</span></div><div class="desc">${esc(locked ? t('needLevel', { n: d.unlock }) : L(d.desc))}</div></div>`));
          if (!locked) it.appendChild(tap(el('button', 'btn btn-sm btn-green', `<span class="price">${ic('coin', 22)}${d.price}</span>`), () => { if (!State.buyBooster(b)) { toast(t('notEnough'), 'coin'); return; } Audio.play('coin', 0); render(); }));
        }
        inner.appendChild(el('div', 'section-title', esc(t('cannons'))));
        const sk = inner.appendChild(el('div', 'grid'));
        for (const id of Object.keys(DATA.SKINS)) {
          const s0 = DATA.SKINS[id], own = !!State.s.skins[id], on = State.s.skin === id;
          const card = sk.appendChild(el('div', 'cc', `${ic('skin_' + id, 80)}<span class="nm">${esc(L(s0.name))}</span>`));
          const bb = tap(el('button', 'btn btn-sm ' + (on ? 'btn-grey' : own ? 'btn-blue' : 'btn-green'), on ? esc(t('equipped')) : own ? esc(t('equip')) : `<span class="price">${ic('coin', 20)}${s0.price}</span>`), () => {
            if (on) return;
            if (!State.buySkin(id)) { toast(t('notEnough'), 'coin'); return; }
            Audio.play('magic'); render();
          });
          bb.style.cssText = 'min-height:32px;font-size:13px;margin-top:4px;padding:0 10px';
          card.appendChild(bb);
        }
      };
      render();
    } });
  }

  // ================================================================ LIVES
  function lives() {
    modal({ title: t('lives'), body: (p, api) => {
      const inner = p.appendChild(el('div', 'inner col center'));
      const upd = () => {
        State.tickLives();
        const inf = State.infinite(), s = State.s;
        inner.innerHTML = `<div class="row center" style="gap:4px">${Array.from({ length: DATA.LIVES.max }, (_, i) => `<img src="${Art.icon(inf || i < s.lives ? 'heart' : 'heartGrey', 48)}" style="width:44px;height:44px">`).join('')}</div>
          <div class="h2">${inf ? '∞ ' + esc(t('infinite')) + ' · ' + U.fmtTime(s.infUntil - Date.now()) : s.lives >= DATA.LIVES.max ? esc(t('full')) : esc(t('nextLife', { t: U.fmtTime(State.nextLifeMs()) }))}</div>
          ${!inf && s.lives === 0 ? `<div class="muted">${esc(t('noLivesText'))}</div>` : ''}`;
      };
      upd();
      const iv = setInterval(() => { if (!inner.isConnected) { clearInterval(iv); return; } upd(); }, 1000);
      if (!State.infinite() && State.s.lives < DATA.LIVES.max) {
        p.appendChild(tap(el('button', 'btn btn-green', `${esc(t('refill'))} <span class="price">${ic('coin', 30)}${DATA.LIVES.refillPrice}</span>`), () => {
          if (!State.refillLives()) { toast(t('notEnough'), 'coin'); return; }
          Audio.play('magic'); Screens.syncHome(); api.close();
        }));
        if (Monetization.adsAvailable()) p.appendChild(tap(el('button', 'btn btn-purple', '▶ +1'), async () => { if (await Monetization.rewarded('lives')) { State.s.lives = Math.min(DATA.LIVES.max, State.s.lives + 1); State.persist(); upd(); Screens.syncHome(); } }));
      } else p.appendChild(tap(el('button', 'btn btn-green', esc(t('ok'))), () => api.close()));
    } });
  }

  // ================================================================ SETTINGS
  function settings() {
    modal({ title: t('settings'), body: (p, api) => {
      const inner = p.appendChild(el('div', 'inner col'));
      inner.appendChild(settingRow(t('sound'), 'sound'));
      inner.appendChild(settingRow(t('music'), 'music'));
      inner.appendChild(settingRow(t('vibration'), 'vib'));
      inner.appendChild(settingRow(t('colorSymbols'), 'symbols'));
      const lang = inner.appendChild(el('div', 'set-row', `<span>${esc(t('language'))}</span>`));
      const seg = lang.appendChild(el('div', 'seg'));
      for (const l0 of I18N.langs) seg.appendChild(tap(el('button', l0 === I18N.lang ? 'on' : '', l0 === 'en' ? 'English' : 'Українська'), () => { State.s.settings.lang = l0; I18N.lang = l0; State.persist(); api.close(); rebuild(); settings(); }));
      p.appendChild(tap(el('button', 'btn btn-blue', esc(t('replayIntro'))), () => { api.close(); Screens.intro(); }));
      p.appendChild(tap(el('button', 'btn btn-sm btn-red', esc(t('resetProgress'))), async () => {
        if (!(await confirm(t('resetConfirm'), t('resetProgress'), t('cancel'), 'btn-red'))) return;
        State.reset(); location.reload();
      }));
      p.appendChild(el('div', 'muted center', 'Bubble Bloom v1.0 · Nunito font (SIL OFL)'));
    } });
  }
  function rebuild() { buildGameHud(); Screens.buildHomeHud(); Screens.syncHome(); Screens.rebuildMap(); }

  return {
    FONT, $, $$, el, esc, ic, tap, iconImg, safe, toast, fly, modal, confirm, rewardRow, flyRewards, artCanvas, animCanvas,
    objIcon, objText, buildGameHud, syncGameHud, animateGoal, goalPoint, bumpGoal, syncBoosters, boosterMode,
    openLevel, startLevel, levelWon, outOfMoves, failPanel, pause, story, friendCard, creatureCard, areaCelebration,
    openChest, chestsInventory, restorePanel, daily, quests, collection, shop, lives, settings, rebuild,
    get stackSize() { return stack.length; },
  };
})();
