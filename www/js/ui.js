/* ============================================================
   UI — DOM screens for the meta game: island hub, level map,
   collection, upgrades, shop, battle pass, daily, quests,
   achievements, settings. Plus toast & modal helpers.
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.GameData;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function click(node, fn) {
    node.addEventListener('click', function (ev) {
      global.Audio2.resume(); global.Audio2.play('click'); fn(ev);
    });
    return node;
  }

  // Sprite glyph: <img> when a sprite id is available, otherwise emoji.
  function spriteGlyph(spriteId, emoji, cls, glow) {
    if (global.DragonSprites && spriteId && global.DragonSprites.url(spriteId)) {
      return '<img class="dsprite ' + (cls || '') + '" src="' + global.DragonSprites.url(spriteId) +
        '" alt="" style="filter:drop-shadow(0 0 10px ' + (glow || '#fff') + ')">';
    }
    return '<span class="demoji ' + (cls || '') + '">' + (emoji || '') + '</span>';
  }
  // Dragon glyph convenience.
  function dragonGlyph(def, cls, glow) { return spriteGlyph(def.id, def.emoji, cls, glow || def.glow); }

  const UI = {
    screens: {},
    current: 'home',
    dragonGlyph: dragonGlyph,
    spriteGlyph: spriteGlyph,

    init: function (root) {
      this.root = root;
      // build static layers
      this.toastEl = el('div', 'toast'); root.appendChild(this.toastEl);
      this.modalLayer = el('div', 'modal-layer hidden'); root.appendChild(this.modalLayer);
    },

    show: function (id) {
      const all = this.root.querySelectorAll('.screen');
      for (let i = 0; i < all.length; i++) all[i].classList.add('hidden');
      const s = document.getElementById('screen-' + id);
      if (s) { s.classList.remove('hidden'); s.scrollTop = 0; }
      this.current = id;
    },

    // Character dialogue bubble (portrait + name + line).
    dialogue: function (glyphHtml, name, line) {
      const old = this.root.querySelector('.dialogue-pop'); if (old) old.remove();
      const b = el('div', 'dialogue-pop');
      b.innerHTML = '<div class="dlg-portrait">' + glyphHtml + '</div>' +
        '<div class="dlg-text"><b>' + name + '</b><span>' + line + '</span></div>';
      this.root.appendChild(b);
      const remove = function () { if (b.parentNode) b.remove(); };
      b.addEventListener('click', remove);
      setTimeout(function () { b.classList.add('out'); }, 4200);
      setTimeout(remove, 4800);
    },

    tipBubble: function (msg) {
      const old = this.root.querySelector('.tip-pop'); if (old) old.remove();
      const b = el('div', 'tip-pop', msg);
      this.root.appendChild(b);
      const remove = function () { if (b.parentNode) b.remove(); };
      b.addEventListener('click', remove);
      setTimeout(function () { b.classList.add('out'); }, 3600);
      setTimeout(remove, 4200);
    },

    toast: function (msg) {
      this.toastEl.textContent = msg;
      this.toastEl.classList.add('show');
      const self = this;
      clearTimeout(this._tt);
      this._tt = setTimeout(function () { self.toastEl.classList.remove('show'); }, 1800);
    },

    modal: function (titleText, bodyNode, buttons) {
      clear(this.modalLayer);
      const card = el('div', 'modal-card');
      const t = el('div', 'modal-title', titleText);
      card.appendChild(t);
      if (bodyNode) card.appendChild(bodyNode);
      const row = el('div', 'modal-btns');
      (buttons || [{ label: 'OK', primary: true }]).forEach(function (b) {
        const btn = el('button', 'btn ' + (b.primary ? 'btn-primary' : 'btn-ghost'), b.label);
        click(btn, function () {
          if (!b.keepOpen) UI.modalLayer.classList.add('hidden');
          b.onClick && b.onClick();
        });
        row.appendChild(btn);
      });
      card.appendChild(row);
      this.modalLayer.appendChild(card);
      this.modalLayer.classList.remove('hidden');
    },

    closeModal: function () { this.modalLayer.classList.add('hidden'); },

    // ---- top currency bar (shared) ----------------------------------------
    currencyBar: function () {
      const p = global.Save.get();
      const li = global.Save.livesInfo();
      const ic = function (id, emoji) { const t = global.UiIcons && global.UiIcons.tag(id, 'cur-ic'); return t || ('<span class="cur-ic">' + emoji + '</span>'); };
      const bar = el('div', 'currency-bar');
      bar.innerHTML =
        '<div class="cur cur-life" id="ui-life-pill">' + ic('heart', '❤️') + '<span id="ui-lives">' + li.count + '</span><span class="life-timer" id="ui-life-timer"></span></div>' +
        '<div class="cur">' + ic('coin', '🪙') + '<span id="ui-gold">' + p.gold + '</span></div>' +
        '<div class="cur">' + ic('gem', '💎') + '<span id="ui-gems">' + p.gems + '</span></div>' +
        '<div class="cur">' + ic('energy', '⚡') + '<span id="ui-energy">' + p.energy + '</span></div>';
      // tapping the heart pill opens the lives panel
      const pill = bar.querySelector('#ui-life-pill');
      if (pill) click(pill, function () { UI.showNoLives(); });
      // start the regen ticker
      UI.startLifeTicker();
      return bar;
    },
    refreshCurrencies: function () {
      const p = global.Save.get();
      const li = global.Save.livesInfo();
      const set = function (id, v) { const e = document.getElementById(id); if (e) e.textContent = v; };
      set('ui-gold', p.gold); set('ui-gems', p.gems); set('ui-energy', p.energy); set('ui-lives', li.count);
    },
    startLifeTicker: function () {
      if (this._lifeTick) clearInterval(this._lifeTick);
      const update = function () {
        const li = global.Save.livesInfo();
        const lc = document.getElementById('ui-lives'); if (lc) lc.textContent = li.count;
        const tm = document.getElementById('ui-life-timer');
        if (!tm) { clearInterval(UI._lifeTick); UI._lifeTick = null; return; }
        if (li.count >= li.max) { tm.textContent = 'MAX'; }
        else {
          const s = Math.ceil(li.msToNext / 1000);
          const m = Math.floor(s / 60), ss = s % 60;
          tm.textContent = m + ':' + (ss < 10 ? '0' : '') + ss;
        }
      };
      update();
      this._lifeTick = setInterval(update, 1000);
    },

    showNoLives: function (onReady) {
      const li = global.Save.livesInfo();
      const body = el('div', 'modal-body');
      const refreshBody = function () {
        const l = global.Save.livesInfo();
        let t = '';
        if (l.count < l.max) { const s = Math.ceil(l.msToNext / 1000), m = Math.floor(s / 60); t = T('next_heart', { m: m, s: s % 60 }); }
        body.innerHTML = '<div class="lives-big">' + '❤️'.repeat(l.count) + '🖤'.repeat(Math.max(0, l.max - l.count)) + '</div>' +
          '<p>' + T('lives_count', { n: l.count, max: l.max }) + '</p>' +
          '<p class="muted small">' + t + '</p>' +
          '<p class="muted small">' + T('lives_refill_hint') + '</p>';
      };
      refreshBody();
      const buttons = [
        { label: T('close') },
        { label: T('ad_plus_life'), onClick: function () {
            global.UI.watchAdGeneric(function () { global.Save.addLives(1); UI.refreshCurrencies(); UI.toast(T('life_added')); if (onReady && global.Save.livesInfo().count > 0) onReady(); }); } },
        { label: T('refill_gems'), primary: true, onClick: function () {
            const p = global.Save.get();
            if (p.gems < 50) { UI.toast(T('not_enough_gems')); return; }
            p.gems -= 50; global.Save.refillLives(); global.Save.save();
            global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast(T('lives_refilled'));
            if (onReady) onReady();
          } }
      ];
      this.modal(T('lives_title'), body, buttons);
    },

    navBar: function (active) {
      const nIc = function (icon, emoji) { const t = global.UiIcons && global.UiIcons.tag(icon, 'nav-ic'); return t || ('<span class="nav-ic">' + emoji + '</span>'); };
      const items = [
        { id: 'map', icon: 'nav_map', ic: '🗺️', label: T('nav_map') },
        { id: 'modes', icon: 'nav_modes', ic: '🎮', label: T('t_modes') },
        { id: 'collection', icon: 'nav_dragons', ic: '🐲', label: T('nav_dragons') },
        { id: 'shop', icon: 'nav_shop', ic: '🛒', label: T('nav_shop') },
        { id: 'pass', icon: 'nav_pass', ic: '🎖️', label: T('nav_pass') },
        { id: 'home', icon: 'nav_home', ic: '🏝️', label: T('nav_island') }
      ];
      const bar = el('div', 'nav-bar');
      items.forEach(function (it) {
        const b = el('button', 'nav-btn' + (it.id === active ? ' active' : ''),
          nIc(it.icon, it.ic) + '<span class="nav-lb">' + it.label + '</span>');
        click(b, function () { global.Game.go(it.id); });
        bar.appendChild(b);
      });
      return bar;
    },

    // ---- HOME / ISLAND HUB ------------------------------------------------
    renderHome: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-home');
      clear(s);
      const island = D.ISLANDS[Math.min(D.ISLANDS.length - 1, Math.floor((p.levelProgress - 1) / 25))];
      s.style.background = 'linear-gradient(160deg,' + island.bg1 + ',' + island.bg2 + ')';
      s.appendChild(this.currencyBar());

      const title = el('div', 'home-title');
      title.innerHTML = '<h1>Dragon Merge Blast</h1><p>' + island.name + '</p>';
      s.appendChild(title);

      // Live-ops event banner
      const ev = D.activeEvent();
      const evBanner = el('div', 'event-banner');
      evBanner.innerHTML = '<div class="ev-ic">' + ev.ic + '</div><div class="ev-info"><b>' + T('ev_' + ev.id) + '</b><span>' + T('ev_' + ev.id + '_desc') + '</span></div><div class="ev-live">' + T('event_live') + '</div>';
      s.appendChild(evBanner);

      // Animated island scene
      const scene = el('div', 'island-scene');
      scene.innerHTML =
        '<div class="island-sun"></div>' +
        '<div class="isle-cloud c1">☁️</div><div class="isle-cloud c2">☁️</div>' +
        '<div class="isle-fly">🐉</div>' +
        '<div class="isle-ground"></div>' +
        '<div class="isle-spark s1">✨</div><div class="isle-spark s2">✨</div><div class="isle-spark s3">✨</div>';
      // owned dragons bobbing & flapping
      p.ownedDragons.forEach(function (id, i) {
        const def = D.dragonById(id);
        const d = el('div', 'isle-dragon', dragonGlyph(def, 'isle-sprite', def.glow));
        d.style.left = (14 + (i % 4) * 21) + '%';
        d.style.top = (30 + Math.floor(i / 4) * 24) + '%';
        d.style.filter = 'drop-shadow(0 0 12px ' + def.glow + ')';
        d.style.animationDelay = (i * 0.3) + 's';
        scene.appendChild(d);
      });
      s.appendChild(scene);

      // Egg incubator row
      const eggsWrap = el('div', 'eggs-wrap');
      eggsWrap.appendChild(el('div', 'section-h', T('incubator')));
      const eggGrid = el('div', 'egg-grid');
      p.eggs.forEach(function (egg, idx) {
        const def = D.dragonById(egg.dragon);
        const pct = Math.min(100, Math.round(egg.charge / egg.need * 100));
        const ready = egg.charge >= egg.need;
        const card = el('div', 'egg-card' + (ready ? ' ready' : ''));
        card.setAttribute('data-egg', idx);
        card.innerHTML =
          '<div class="egg-emoji">' + spriteGlyph('egg', '🥚', 'egg-sprite', def.glow) + '</div>' +
          '<div class="egg-name">' + def.title + '</div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + def.color + '"></div></div>' +
          '<div class="egg-pct">' + (ready ? '✨ ' + T('egg_ready') : T('egg_remaining', { n: egg.need - egg.charge })) + '</div>';
        const btn = el('button', 'btn btn-mini ' + (ready ? 'btn-primary' : 'btn-ghost'),
          ready ? ('🐣 ' + T('hatch')) : '+10 ⚡');
        click(btn, function () { UI.handleEgg(idx); });
        card.appendChild(btn);
        eggGrid.appendChild(card);
      });
      eggsWrap.appendChild(eggGrid);
      s.appendChild(eggsWrap);

      // Island farm (idle income)
      s.appendChild(this.renderFarm());

      // Quick action buttons
      const acts = el('div', 'home-actions');
      const playBtn = click(el('button', 'btn btn-primary btn-big', T('play_level', { n: p.levelProgress })), function () { global.Game.go('map'); });
      acts.appendChild(playBtn);
      // Piggy bank widget
      const full = p.piggy.coins >= p.piggy.cap;
      const piggy = el('div', 'piggy-widget' + (full ? ' full' : ''));
      const piggyIcon = (global.UiIcons && global.UiIcons.tag('piggy', 'piggy-ic-img')) || '🐷';
      piggy.innerHTML = '<div class="piggy-ic">' + piggyIcon + '</div>' +
        '<div class="piggy-body"><div class="piggy-top"><b>' + T('piggy_title') + '</b><span>' + T('piggy_info', { n: p.piggy.coins, cap: p.piggy.cap }) + '</span></div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + Math.round(p.piggy.coins / p.piggy.cap * 100) + '%;background:#ff9ec4"></div></div></div>';
      const crackBtn = el('button', 'btn btn-mini ' + (full ? 'btn-primary' : 'btn-ghost'), full ? T('piggy_crack', { n: p.piggy.coins }) : '🔒');
      click(crackBtn, function () {
        if (p.piggy.coins < p.piggy.cap) { UI.toast(T('piggy_not_full')); return; }
        const got = p.piggy.coins; p.gold += got; p.piggy.coins = 0; global.Save.save();
        global.Audio2.play('chest'); UI.refreshCurrencies(); UI.toast(T('piggy_cracked', { n: got })); UI.renderHome();
      });
      piggy.appendChild(crackBtn);
      acts.appendChild(piggy);
      const grid2 = el('div', 'home-grid grid6');
      [
        { ic: '🎮', icon: 'tile_modes', label: T('t_modes'), go: function () { UI.showModes(); } },
        { ic: '🎁', icon: 'tile_daily', label: T('t_daily'), go: function () { UI.showDaily(); } },
        { ic: '🎡', icon: 'tile_wheel', label: T('t_wheel'), go: function () { UI.showWheel(); }, badge: UI.wheelAvailable() },
        { ic: '🎰', icon: 'tile_summon', label: T('t_summon'), go: function () { UI.showSummon(); } },
        { ic: '🌳', icon: 'tile_skills', label: T('t_skills'), go: function () { UI.showSkills(); } },
        { ic: '⚔️', icon: 'tile_pvp', label: T('t_pvp'), go: function () { UI.showPvp(); } },
        { ic: '📖', icon: 'tile_story', label: T('t_story'), go: function () { UI.showStory(); }, badge: UI.storyAvailable() },
        { ic: '📜', icon: 'tile_quests', label: T('t_quests'), go: function () { UI.showQuests(); } },
        { ic: '📊', icon: 'tile_leaderboard', label: T('t_leaderboard'), go: function () { UI.showLeaderboard(); } },
        { ic: '🏆', icon: 'tile_ach', label: T('t_ach'), go: function () { UI.showAchievements(); } },
        { ic: '⚙️', icon: 'tile_settings', label: T('t_options'), go: function () { UI.showSettings(); } }
      ].forEach(function (a) {
        const glyph = (global.UiIcons && global.UiIcons.tag(a.icon, 'tile-ic')) || ('<span>' + a.ic + '</span>');
        const b = click(el('button', 'btn btn-tile' + (a.badge ? ' has-badge' : ''), glyph + a.label), a.go);
        grid2.appendChild(b);
      });
      acts.appendChild(grid2);
      s.appendChild(acts);

      s.appendChild(this.navBar('home'));
      // daily reminder badge
      if (UI.dailyAvailable()) UI.toast(T('daily_available'));
    },

    // ---- Island farm (idle income) ---------------------------------------
    renderFarm: function () {
      const p = global.Save.get();
      global.Save.farmTick(); // accrue production (incl. offline) on view
      const wrap = el('div', 'farm-wrap');
      const head = el('div', 'farm-head');
      head.innerHTML = '<span>' + T('farm_title') + '</span>';
      const collectAll = click(el('button', 'btn btn-mini btn-primary', '🎁 ' + T('collect_all')), function () {
        const t = global.Save.farmCollectAll();
        if (t.gold + t.energy + t.gems <= 0) { UI.toast(T('farm_empty')); return; }
        global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast(UI.farmRewardStr(t)); UI.renderHome();
      });
      head.appendChild(collectAll);
      wrap.appendChild(head);
      const grid = el('div', 'farm-grid');
      D.FARM.forEach(function (b) {
        const lvl = p.farm.buildings[b.id] || 0;
        const built = lvl > 0;
        const stored = Math.floor(p.farm.stored[b.id] || 0);
        const cap = global.Save.farmCap(b.id);
        const pct = cap > 0 ? Math.min(100, Math.round(stored / cap * 100)) : 0;
        const resIc = b.res === 'gold' ? '🪙' : b.res === 'energy' ? '⚡' : '💎';
        const card = el('div', 'farm-card' + (built ? '' : ' unbuilt') + (stored > 0 ? ' ready' : ''));
        const bIcon = (global.UiIcons && global.UiIcons.tag('farm_' + b.id, 'farm-ic-img')) || b.ic;
        card.innerHTML =
          '<div class="farm-ic">' + bIcon + '</div>' +
          '<div class="farm-name">' + T('build_' + b.id) + '</div>' +
          (built
            ? '<div class="farm-lvl">' + T('dc_level', { n: lvl }) + ' · ' + (b.rate * lvl) + UI.rich(resIc) + '/' + T('hour') + '</div>' +
              '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + (b.res === 'gems' ? '#79e0ff' : b.res === 'energy' ? '#b48bff' : '#ffd24d') + '"></div></div>' +
              '<div class="farm-stored">' + stored + ' / ' + cap + ' ' + UI.rich(resIc) + '</div>'
            : '<div class="farm-lvl muted">' + T('not_built') + '</div>');
        click(card, function () { UI.showBuilding(b.id); });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      return wrap;
    },
    farmRewardStr: function (t) {
      const parts = [];
      if (t.gold) parts.push('+' + Math.floor(t.gold) + '🪙');
      if (t.energy) parts.push('+' + Math.floor(t.energy) + '⚡');
      if (t.gems) parts.push('+' + Math.floor(t.gems) + '💎');
      return parts.join('  ');
    },
    showBuilding: function (id) {
      const p = global.Save.get();
      const b = D.farmById(id);
      const lvl = p.farm.buildings[id] || 0;
      const built = lvl > 0;
      const resIc = b.res === 'gold' ? '🪙' : b.res === 'energy' ? '⚡' : '💎';
      const stored = Math.floor(p.farm.stored[id] || 0);
      const body = el('div', 'modal-body');
      const bBig = (global.UiIcons && global.UiIcons.tag('farm_' + id, 'big-icon-img')) || b.ic;
      body.innerHTML = '<div class="big-emoji">' + bBig + '</div>' +
        (built
          ? '<div class="up-stats"><div>' + T('dc_level', { n: lvl }) + '</div><div>' + T('production') + ': <b>' + (b.rate * lvl) + resIc + '/' + T('hour') + '</b></div><div>' + T('stored') + ': <b>' + stored + ' / ' + global.Save.farmCap(id) + resIc + '</b></div></div>'
          : '<p class="muted">' + T('build_desc_' + b.id) + '</p>');
      const buttons = [{ label: T('close') }];
      if (built) {
        if (stored > 0) buttons.push({ label: '🎁 ' + T('collect') + ' (' + stored + resIc + ')', onClick: function () {
          global.Save.farmCollect(id); global.Audio2.play('coin'); UI.refreshCurrencies(); UI.renderHome();
        } });
        const upCost = b.up * (lvl + 1);
        buttons.push({ label: '⬆ ' + T('upgrade_btn', { cost: upCost }) , primary: true, onClick: function () {
          if (p.gold < upCost) { UI.toast(T('not_enough_gold')); return; }
          p.gold -= upCost; p.farm.buildings[id] = lvl + 1; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.renderHome();
        } });
      } else {
        const cur = b.buildCur === 'gems' ? '💎' : '🪙';
        buttons.push({ label: '🏗 ' + T('build') + ' (' + b.build + cur + ')', primary: true, onClick: function () {
          if (b.buildCur === 'gems' ? p.gems < b.build : p.gold < b.build) { UI.toast(b.buildCur === 'gems' ? T('not_enough_gems') : T('not_enough_gold')); return; }
          if (b.buildCur === 'gems') p.gems -= b.build; else p.gold -= b.build;
          p.farm.buildings[id] = 1; p.farm.stored[id] = 0; global.Save.save();
          global.Audio2.play('hatch'); UI.refreshCurrencies(); UI.toast(T('built', { name: T('build_' + id) })); UI.renderHome();
        } });
      }
      this.modal(b.ic + ' ' + T('build_' + id), body, buttons);
    },

    handleEgg: function (idx) {
      const p = global.Save.get();
      const egg = p.eggs[idx];
      if (!egg) return;
      if (egg.charge >= egg.need) {
        // hatch
        if (p.ownedDragons.indexOf(egg.dragon) === -1) {
          p.ownedDragons.push(egg.dragon);
          p.dragonLevels[egg.dragon] = 1;
          p.dragonTiers[egg.dragon] = 1;
        }
        global.Save.addStat('dragonsHatched', 1);
        p.eggs.splice(idx, 1);
        global.Save.save();
        const def = D.dragonById(egg.dragon);
        UI.hatchAnim(def, function () {
          UI.modal(T('new_dragon'), el('div', 'modal-body',
            '<div class="big-emoji">' + dragonGlyph(def, 'big-sprite', def.glow) + '</div><b>' + def.title + '</b>' +
            '<p class="dragon-quote">“' + T('dragon_q_' + def.id) + '”</p><p>' + def.desc + '</p>'),
            [{ label: T('great'), primary: true, onClick: function () { UI.renderHome(); } }]);
        });
      } else {
        if (p.energy < 10) { UI.toast(T('need_energy')); return; }
        p.energy -= 10; egg.charge = Math.min(egg.need, egg.charge + 10);
        global.Save.save();
        global.Audio2.play('coin');
        UI.refreshCurrencies();
        UI.updateEggCard(idx); // update just this card (no full-screen flash)
      }
    },

    // Refresh a single egg card in place after a +10 charge.
    updateEggCard: function (idx) {
      const p = global.Save.get();
      const egg = p.eggs[idx];
      const card = document.querySelector('.egg-card[data-egg="' + idx + '"]');
      if (!egg || !card) { UI.renderHome(); return; }
      const pct = Math.min(100, Math.round(egg.charge / egg.need * 100));
      const ready = egg.charge >= egg.need;
      const fill = card.querySelector('.bar-fill'); if (fill) fill.style.width = pct + '%';
      const pctEl = card.querySelector('.egg-pct');
      if (pctEl) pctEl.innerHTML = ready ? '✨ ' + T('egg_ready') : T('egg_remaining', { n: egg.need - egg.charge });
      if (ready) {
        card.classList.add('ready');
        const btn = card.querySelector('button');
        if (btn) { btn.className = 'btn btn-mini btn-primary'; btn.textContent = '🐣 ' + T('hatch'); }
      }
      const sp = card.querySelector('.egg-emoji');
      if (sp) { sp.classList.remove('pop'); void sp.offsetWidth; sp.classList.add('pop'); }
    },

    // Celebratory hatch sequence: the egg shakes, cracks, then bursts into the dragon.
    hatchAnim: function (def, done) {
      const layer = el('div', 'hatch-anim');
      layer.innerHTML = '<div class="hatch-egg">' + spriteGlyph('egg', '🥚', '', def.glow) + '</div>';
      this.root.appendChild(layer);
      global.Audio2.play('hatch');
      const eggEl = layer.querySelector('.hatch-egg');
      setTimeout(function () { layer.classList.add('crack'); }, 700);
      setTimeout(function () {
        eggEl.innerHTML = dragonGlyph(def, '', def.glow);
        layer.classList.add('reveal');
        global.Audio2.play('win');
      }, 1150);
      setTimeout(function () { if (layer.parentNode) layer.remove(); done && done(); }, 2000);
    },

    // ---- LEVEL MAP --------------------------------------------------------
    renderMap: function (keepAnchor) {
      const p = global.Save.get();
      const count = D.ISLANDS.length;
      const WIN = 8; // islands rendered per page
      const cur = Math.floor((p.levelProgress - 1) / 25);
      if (!keepAnchor || this.mapAnchor == null) this.mapAnchor = Math.max(0, Math.min(count - WIN, cur - 1));
      const start = Math.max(0, Math.min(count - WIN, this.mapAnchor));
      const end = Math.min(count, start + WIN);
      const s = document.getElementById('screen-map');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', T('islands_title') + ' (' + (start + 1) + '–' + end + '/' + count + ')'));

      // pager
      const pager = el('div', 'map-pager');
      const prev = el('button', 'btn btn-ghost btn-mini' + (start <= 0 ? ' dis' : ''), '◀');
      const next = el('button', 'btn btn-ghost btn-mini' + (end >= count ? ' dis' : ''), '▶');
      if (start > 0) click(prev, function () { UI.mapAnchor = Math.max(0, start - WIN); UI.renderMap(true); });
      if (end < count) click(next, function () { UI.mapAnchor = start + WIN; UI.renderMap(true); });
      const jump = click(el('button', 'btn btn-primary btn-mini', '🎯'), function () { UI.mapAnchor = null; UI.renderMap(false); });
      pager.appendChild(prev); pager.appendChild(jump); pager.appendChild(next);
      s.appendChild(pager);

      const scroll = el('div', 'map-scroll');
      const curIslandId = Math.floor((p.levelProgress - 1) / 25);
      D.ISLANDS.slice(start, end).forEach(function (island) {
        const unlocked = p.levelProgress > island.unlockLevel || island.unlockLevel === 0;
        const isCurIsland = island.id === curIslandId;
        // stars earned across this island's 25 levels (max 75)
        let islandStars = 0;
        for (let k = 0; k < 25; k++) islandStars += (p.stars[island.id * 25 + k + 1] || 0);
        const block = el('div', 'island-block' + (isCurIsland ? ' cur-island' : ''));
        block.style.background = 'linear-gradient(135deg,' + island.bg1 + 'cc,' + island.bg2 + 'cc)';
        const head = el('div', 'island-head');
        head.innerHTML = '<b style="color:' + island.theme + '">' + island.name + '</b>' +
          (unlocked ? '<span class="isle-stars">⭐ ' + islandStars + '/75</span>'
                    : '<span class="lock">' + T('locked_at', { n: island.unlockLevel + 1 }) + '</span>');
        block.appendChild(head);
        const nodes = el('div', 'level-nodes');
        for (let i = 0; i < 25; i++) {
          const lvNum = island.id * 25 + i + 1;
          const lv = D.LEVELS[lvNum - 1];
          if (!lv) continue;
          const stars = p.stars[lvNum] || 0;
          const isUnlocked = lvNum <= p.levelProgress;
          const done = lvNum < p.levelProgress;
          const node = el('button', 'lv-node' +
            (lvNum === p.levelProgress ? ' current' : '') +
            (done ? ' done' : '') +
            (stars === 3 ? ' mastered' : '') +
            (lv.hard ? ' hard' : '') +
            (isUnlocked ? '' : ' locked') + (lv.boss ? ' boss' : ''));
          node.innerHTML = (lv.boss ? '👑' : lvNum) +
            (lv.hard && isUnlocked && !lv.boss ? '<span class="lv-hard">🔥</span>' : '') +
            (stars ? '<span class="lv-stars">' + '★'.repeat(stars) + '</span>' : '');
          if (isUnlocked) click(node, function () { UI.showLevelPreview(lvNum); });
          else node.disabled = true;
          nodes.appendChild(node);
        }
        block.appendChild(nodes);
        // Reward chests at every 5th level of the island
        const chestRow = el('div', 'chest-row');
        [5, 10, 15, 20, 25].forEach(function (m) {
          const milestone = island.id * 25 + m;
          if (milestone > D.LEVELS.length) return;
          const opened = !!p.chests[milestone];
          const ready = p.levelProgress > milestone && !opened;
          const chestIcon = (global.UiIcons && global.UiIcons.tag('chest', 'chest-ic-img')) || '🎁';
          const chest = el('button', 'chest-node' + (opened ? ' opened' : ready ? ' ready' : ' locked'),
            opened ? '✅' : chestIcon);
          if (ready) click(chest, function () { UI.openChest(milestone); });
          chestRow.appendChild(chest);
        });
        block.appendChild(chestRow);
        scroll.appendChild(block);
      });
      s.appendChild(scroll);
      s.appendChild(this.navBar('map'));
      // scroll to current
      setTimeout(function () {
        const cur = s.querySelector('.lv-node.current');
        if (cur) cur.scrollIntoView({ block: 'center' });
      }, 30);
    },

    openChest: function (milestone) {
      const p = global.Save.get();
      if (p.chests[milestone]) return;
      const gold = milestone * 8;
      const gems = 5 + Math.floor(milestone / 25) * 5;
      p.chests[milestone] = true; p.gold += gold; p.gems += gems; global.Save.save();
      global.Audio2.play('chest');
      const body = el('div', 'modal-body');
      body.innerHTML = '<div class="big-emoji">🎁</div><div class="win-rewards">' + T('chest_reward', { gold: gold, gems: gems }) + '</div>';
      this.modal(T('chest_title'), body, [{ label: T('great'), primary: true, onClick: function () { UI.refreshCurrencies(); UI.renderMap(); } }]);
    },

    showLevelPreview: function (lvNum) {
      const lv = D.LEVELS[lvNum - 1];
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      let objText = lv.objective === D.OBJ.SCORE ? T('goal_score', { n: lv.target })
        : lv.objective === D.OBJ.COLLECT ? T('goal_collect', { n: lv.target, g: D.CRYSTALS[lv.color].glyph })
        : lv.objective === D.OBJ.JELLY ? T('goal_jelly', { n: lv.jellyCount })
        : lv.objective === D.OBJ.BOSS ? T('goal_boss')
        : T('goal_ice', { n: lv.iceCount + (lv.crates || 0) });
      body.innerHTML =
        '<p class="obj">' + T('goal', { text: objText }) + '</p>' +
        '<p class="muted">' + T('moves_reward', { m: lv.moves, gold: lv.reward.gold, energy: lv.reward.energy }) + '</p>' +
        '<div class="section-h">' + T('battle_team') + '</div>';
      body.appendChild(UI.equipPicker());
      this.modal(global.Game.levelName(lv), body, [
        { label: '✖', onClick: function () {} },
        { label: T('start'), primary: true, onClick: function () { global.Game.startLevel(lvNum); } }
      ]);
    },

    equipPicker: function () {
      const p = global.Save.get();
      const wrap = el('div', 'equip-picker');
      for (let slot = 0; slot < 3; slot++) {
        const cell = el('div', 'equip-slot');
        const id = p.equipped[slot];
        if (id) {
          const def = D.dragonById(id);
          cell.innerHTML = '<div class="eq-emoji">' + dragonGlyph(def, 'eq-sprite', def.glow) + '</div><div class="eq-name">' + def.name + '</div>';
        } else {
          cell.innerHTML = '<div class="eq-emoji empty">＋</div><div class="eq-name">' + T('equip_empty') + '</div>';
        }
        (function (slot) { click(cell, function () { UI.cycleEquip(slot); }); })(slot);
        wrap.appendChild(cell);
      }
      const hint = el('div', 'muted small', T('equip_hint'));
      const container = el('div');
      container.appendChild(wrap); container.appendChild(hint);
      return container;
    },

    cycleEquip: function (slot) {
      const p = global.Save.get();
      const owned = p.ownedDragons.slice();
      const options = [null].concat(owned);
      const cur = p.equipped[slot];
      let idx = options.indexOf(cur);
      // next, skipping dragons already equipped in other slots
      let guard = 0;
      do {
        idx = (idx + 1) % options.length;
        guard++;
      } while (options[idx] && p.equipped.indexOf(options[idx]) !== -1 && p.equipped[slot] !== options[idx] && guard < 20);
      p.equipped[slot] = options[idx];
      global.Save.save();
      // re-render the picker inside the modal
      const old = this.modalLayer.querySelector('.equip-picker');
      if (old && old.parentNode) {
        const fresh = UI.equipPicker();
        old.parentNode.parentNode.replaceChild(fresh, old.parentNode);
      }
      global.Audio2.play('click');
    },

    // ---- COLLECTION -------------------------------------------------------
    renderCollection: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-collection');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', T('collection_title')));
      const grid = el('div', 'dragon-grid');
      D.DRAGONS.forEach(function (def) {
        const owned = p.ownedDragons.indexOf(def.id) !== -1;
        const lvl = p.dragonLevels[def.id] || 0;
        const tier = (p.dragonTiers && p.dragonTiers[def.id]) || 1;
        const card = el('div', 'dragon-card' + (owned ? '' : ' locked'));
        const skinColor = (D.SKIN_COLORS[p.activeSkins[def.id]] || {}).color || def.color;
        const glowMul = owned ? (10 + tier * 6) : 14;
        card.innerHTML =
          '<div class="rar rar-' + def.rarity + '">' + T('rarity_' + def.rarity) + '</div>' +
          (owned ? '<div class="dc-tier">' + '⭐'.repeat(tier) + '</div>' : '') +
          '<div class="dc-emoji">' + (owned ? dragonGlyph(def, '', (D.SKIN_COLORS[p.activeSkins[def.id]] || def).glow || def.glow) : '<span class="demoji" style="filter:drop-shadow(0 0 ' + glowMul + 'px #444)">❔</span>') + '</div>' +
          '<div class="dc-name" style="color:' + skinColor + '">' + def.name + '</div>' +
          '<div class="dc-title">' + def.title + '</div>' +
          (owned ? '<div class="dc-lvl">' + T('dc_level', { n: lvl }) + ' · ' + T('tier', { n: tier }) + '</div>' : '<div class="dc-lvl muted">' + T('not_unlocked') + '</div>') +
          '<div class="dc-desc">' + def.desc + '</div>';
        if (owned) click(card, function () { UI.showUpgrade(def.id); });
        grid.appendChild(card);
      });
      s.appendChild(grid);
      s.appendChild(this.navBar('collection'));
    },

    showUpgrade: function (id) {
      const p = global.Save.get();
      const def = D.dragonById(id);
      const lvl = p.dragonLevels[id] || 1;
      const tier = (p.dragonTiers && p.dragonTiers[id]) || 1;
      const cost = lvl * 150;
      // Evolution: tier 1→2 needs lvl≥3, 2→3 needs lvl≥6.
      const EVO = { 2: { lvl: 3, gold: 600, gems: 30 }, 3: { lvl: 6, gold: 1800, gems: 90 } };
      const nextTier = tier + 1;
      const evo = EVO[nextTier];
      const body = el('div', 'modal-body');
      body.innerHTML =
        '<div class="big-emoji">' + dragonGlyph(def, 'big-sprite', def.glow) + '</div>' +
        '<div class="dc-tier" style="position:static;margin:4px 0">' + '⭐'.repeat(tier) + '</div>' +
        '<p>' + def.desc + '</p>' +
        '<div class="up-stats">' +
        '<div>' + T('cur_level') + ': <b>' + lvl + '</b> · ' + T('tier', { n: tier }) + '</div>' +
        '<div>' + T('ability_power') + ': <b>' + (lvl + (tier - 1) * 2) + '</b> → <b>' + (lvl + 1 + (tier - 1) * 2) + '</b></div>' +
        '<div>' + T('charges_faster') + '</div>' +
        '</div>';
      const buttons = [
        { label: T('close') },
        { label: T('upgrade_btn', { cost: cost }), primary: true, onClick: function () {
          if (p.gold < cost) { UI.toast(T('not_enough_gold')); return; }
          p.gold -= cost; p.dragonLevels[id] = lvl + 1; global.Save.save();
          global.Audio2.play('coin'); UI.toast(T('now_level', { name: def.name, n: lvl + 1 }));
          UI.refreshCurrencies(); UI.renderCollection(); UI.showUpgrade(id);
        }}
      ];
      if (evo) {
        const ready = lvl >= evo.lvl;
        buttons.splice(1, 0, { label: '✨ ' + T('evolve') + ' (' + evo.gold + '🪙 ' + evo.gems + '💎)', onClick: function () {
          if (!ready) { UI.toast(T('evolve_need', { n: evo.lvl })); return; }
          if (p.gold < evo.gold || p.gems < evo.gems) { UI.toast(T('not_enough_gems')); return; }
          p.gold -= evo.gold; p.gems -= evo.gems; p.dragonTiers[id] = nextTier; global.Save.save();
          global.Audio2.play('hatch'); UI.refreshCurrencies();
          UI.modal('✨ ' + T('evolved'), el('div', 'modal-body', '<div class="big-emoji">' + dragonGlyph(def, 'big-sprite', def.glow) + '</div><div class="dc-tier" style="position:static">' + '⭐'.repeat(nextTier) + '</div><p><b>' + def.name + '</b> → ' + T('tier', { n: nextTier }) + '</p>'),
            [{ label: T('great'), primary: true, onClick: function () { UI.renderCollection(); } }]);
        }});
      }
      this.modal(T('upgrade_title', { name: def.name }), body, buttons);
    },

    // ---- SHOP -------------------------------------------------------------
    renderShop: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-shop');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', T('shop_title')));

      // Rewarded ad
      const adCard = el('div', 'shop-card highlight');
      adCard.innerHTML = '<div class="shop-ic">📺</div><div class="shop-info"><b>' + T('rewarded_ad') + '</b><span>' + T('ad_desc') + '</span></div>';
      const adBtn = click(el('button', 'btn btn-primary btn-mini', T('watch')), function () { UI.watchAd(); });
      adCard.appendChild(adBtn);
      s.appendChild(adCard);

      // Gem packs (IAP placeholders)
      s.appendChild(el('div', 'section-h', T('gems_section')));
      [
        { gems: 100, price: '$0.99' }, { gems: 550, price: '$4.99' }, { gems: 1200, price: '$9.99' }
      ].forEach(function (pack) {
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic">💎</div><div class="shop-info"><b>' + pack.gems + ' 💎</b><span>' + T('best_price') + '</span></div>';
        const b = click(el('button', 'btn btn-buy btn-mini', pack.price), function () { UI.fakePurchase(pack.gems); });
        c.appendChild(b); s.appendChild(c);
      });

      // Gold for gems
      s.appendChild(el('div', 'section-h', T('gold_section')));
      [{ gold: 500, gems: 20 }, { gold: 1500, gems: 50 }].forEach(function (pack) {
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic">🪙</div><div class="shop-info"><b>' + T('gold_pack', { gold: pack.gold }) + '</b><span>' + T('for_gems', { gems: pack.gems }) + '</span></div>';
        const b = click(el('button', 'btn btn-buy btn-mini', pack.gems + '💎'), function () {
          if (p.gems < pack.gems) { UI.toast(T('not_enough_gems')); return; }
          p.gems -= pack.gems; p.gold += pack.gold; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast(T('gold_added', { n: pack.gold }));
        });
        c.appendChild(b); s.appendChild(c);
      });

      // Boosters
      s.appendChild(el('div', 'section-h', T('boosters_section')));
      [
        { key: 'hammer', ic: '🔨', name: T('hammer_pack'), desc: T('hammer_pdesc'), amount: 3, price: 200 },
        { key: 'shuffle', ic: '🔀', name: T('mix_pack'), desc: T('mix_pdesc'), amount: 3, price: 150 },
        { key: 'moves', ic: '➕5', name: T('moves_pack'), desc: T('moves_pdesc'), amount: 3, price: 250 }
      ].forEach(function (b) {
        const c = el('div', 'shop-card');
        const bShopIc = (global.UiIcons && global.UiIcons.tag(b.key, 'shop-ic-img')) || b.ic;
        c.innerHTML = '<div class="shop-ic">' + bShopIc + '</div><div class="shop-info"><b>' + b.name + '</b><span>' + b.desc + ' · ' + T('you_have', { n: (p.boosters[b.key] || 0) }) + '</span></div>';
        const btn = click(el('button', 'btn btn-buy btn-mini', UI.rich(b.price + '🪙')), function () {
          if (p.gold < b.price) { UI.toast(T('not_enough_gold')); return; }
          p.gold -= b.price; p.boosters[b.key] = (p.boosters[b.key] || 0) + b.amount; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast(T('bought', { name: b.name })); UI.renderShop();
        });
        c.appendChild(btn); s.appendChild(c);
      });

      // Cosmetic skins
      s.appendChild(el('div', 'section-h', T('skins_section')));
      D.SKINS.forEach(function (sk) {
        const owned = p.ownedSkins.indexOf(sk.id) !== -1;
        const def = D.dragonById(sk.dragon);
        const sc = D.SKIN_COLORS[sk.skin] || def;
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic" style="filter:drop-shadow(0 0 10px ' + sc.glow + ')">' + def.emoji + '</div>' +
          '<div class="shop-info"><b style="color:' + sc.color + '">' + sk.name + '</b><span>' + T('skin_for', { name: def.name }) + '</span></div>';
        const active = p.activeSkins[sk.dragon] === sk.skin;
        const b = click(el('button', 'btn btn-mini ' + (owned ? (active ? 'btn-ghost' : 'btn-primary') : 'btn-buy'),
          owned ? (active ? T('active') : T('wear')) : (sk.price + '💎')), function () {
          if (!owned) {
            if (p.ownedDragons.indexOf(sk.dragon) === -1) { UI.toast(T('get_dragon_first', { name: def.name })); return; }
            if (p.gems < sk.price) { UI.toast(T('not_enough_gems')); return; }
            p.gems -= sk.price; p.ownedSkins.push(sk.id);
            p.activeSkins[sk.dragon] = sk.skin; global.Save.save();
            global.Audio2.play('coin'); UI.toast(T('skin_unlocked'));
          } else {
            p.activeSkins[sk.dragon] = active ? null : sk.skin; global.Save.save();
          }
          UI.refreshCurrencies(); UI.renderShop();
        });
        c.appendChild(b); s.appendChild(c);
      });

      s.appendChild(this.navBar('shop'));
    },

    // Generic simulated rewarded ad; calls onReward() on completion.
    // In the packaged app this routes to the AdMob plugin if present.
    watchAdGeneric: function (onReward) {
      if (global.AdMobBridge && global.AdMobBridge.showRewarded) {
        global.AdMobBridge.showRewarded(function () { onReward && onReward(); });
        return;
      }
      const body = el('div', 'modal-body');
      body.innerHTML = '<div class="ad-box">📺<br><span id="ad-count">5</span><br><small>' + T('rewarded_ad') + '</small></div>';
      this.modal(T('rewarded_ad'), body, [{ label: T('ad_waiting'), primary: true, keepOpen: true }]);
      let n = 5;
      const cnt = body.querySelector('#ad-count');
      const iv = setInterval(function () {
        n--; if (cnt) cnt.textContent = n;
        if (n <= 0) { clearInterval(iv); UI.closeModal(); onReward && onReward(); }
      }, 700);
    },

    watchAd: function () {
      this.watchAdGeneric(function () {
        const p = global.Save.get();
        p.gold += 100; p.energy += 20; global.Save.save();
        global.Audio2.play('coin'); UI.refreshCurrencies();
        UI.toast(T('reward_got'));
      });
    },

    fakePurchase: function (gems) {
      // Placeholder for Google Play Billing; grants gems for demo.
      const p = global.Save.get();
      p.gems += gems; global.Save.save();
      global.Audio2.play('coin'); UI.refreshCurrencies();
      UI.toast(T('purchase_ok', { n: gems }));
      UI.renderShop();
    },

    // ---- BATTLE PASS ------------------------------------------------------
    renderPass: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-pass');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', T('pass_title')));

      const tier = Math.min(50, Math.floor(p.pass.xp / 100) + 1);
      const into = p.pass.xp % 100;
      const head = el('div', 'pass-head');
      head.innerHTML = '<div>' + T('pass_level', { n: tier }) + '</div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + into + '%;background:#ffd24d"></div></div>' +
        '<div class="muted small">' + T('xp_to_next', { n: into }) + '</div>';
      if (!p.pass.premium) {
        const buy = click(el('button', 'btn btn-buy btn-mini', T('premium_buy')), function () {
          if (p.gems < 500) { UI.toast(T('not_enough_gems')); return; }
          p.gems -= 500; p.pass.premium = true; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast(T('premium_on'));
          UI.renderPass();
        });
        head.appendChild(buy);
      } else {
        head.appendChild(el('div', 'premium-badge', T('premium_badge')));
      }
      s.appendChild(head);

      const track = el('div', 'pass-track');
      D.BATTLE_PASS.forEach(function (t) {
        const row = el('div', 'pass-row' + (tier >= t.tier ? ' unlocked' : ''));
        const claimedF = p.pass.claimedFree.indexOf(t.tier) !== -1;
        const claimedP = p.pass.claimedPremium.indexOf(t.tier) !== -1;
        row.appendChild(el('div', 'pass-tier', '' + t.tier));
        const free = el('div', 'pass-reward' + (claimedF ? ' claimed' : ''), UI.rewardLabel(t.free));
        if (tier >= t.tier && !claimedF) click(free, function () { UI.claimPass(t.tier, 'free'); });
        row.appendChild(free);
        const prem = el('div', 'pass-reward premium' + (claimedP ? ' claimed' : '') + (p.pass.premium ? '' : ' locked'),
          (p.pass.premium ? '' : '🔒 ') + UI.rewardLabel(t.premium));
        if (p.pass.premium && tier >= t.tier && !claimedP) click(prem, function () { UI.claimPass(t.tier, 'premium'); });
        row.appendChild(prem);
        track.appendChild(row);
      });
      s.appendChild(track);
      s.appendChild(this.navBar('pass'));
    },

    rewardLabel: function (r) {
      if (r.type === 'gold') return r.amount + '🪙';
      if (r.type === 'gems') return r.amount + '💎';
      if (r.type === 'dragon') return '🐲 скін';
      return '?';
    },
    claimPass: function (tier, track) {
      const p = global.Save.get();
      const t = D.BATTLE_PASS[tier - 1];
      const r = track === 'free' ? t.free : t.premium;
      if (track === 'free') p.pass.claimedFree.push(tier); else p.pass.claimedPremium.push(tier);
      if (r.type === 'gold') p.gold += r.amount;
      else if (r.type === 'gems') p.gems += r.amount;
      else if (r.type === 'dragon') p.gems += 50;
      global.Save.save(); global.Audio2.play('coin'); UI.refreshCurrencies();
      UI.toast(T('got', { r: UI.rewardLabel(r) })); UI.renderPass();
    },
    addPassXp: function (xp) {
      const p = global.Save.get();
      p.pass.xp += xp; global.Save.save();
    },

    // ---- Shared reward helpers (Wheel / Summon) ---------------------------
    grantReward: function (rw) {
      const p = global.Save.get();
      if (rw.gold) p.gold += rw.gold;
      if (rw.gems) p.gems += rw.gems;
      if (rw.energy) p.energy += rw.energy;
      if (rw.booster) p.boosters[rw.booster] = (p.boosters[rw.booster] || 0) + (rw.boosterN || 1);
      if (rw.life) global.Save.addLives(rw.life);
      if (rw.eggCharge) { // pour into the first egg still incubating
        let poured = false;
        for (let i = 0; i < p.eggs.length; i++) { const e = p.eggs[i]; if (e.charge < e.need) { e.charge = Math.min(e.need, e.charge + rw.eggCharge); poured = true; break; } }
        if (!poured) p.energy += rw.eggCharge; // no egg left to charge → give the energy instead
      }
      global.Save.save();
    },
    rewardStr: function (rw) {
      const BEM = { hammer: '🔨', shuffle: '🔀', moves: '➕' };
      const parts = [];
      if (rw.gold) parts.push(rw.gold + '🪙');
      if (rw.gems) parts.push(rw.gems + '💎');
      if (rw.energy) parts.push(rw.energy + '⚡');
      if (rw.booster) parts.push((rw.boosterN || 1) + '× ' + (BEM[rw.booster] || rw.booster));
      if (rw.eggCharge) parts.push(rw.eggCharge + '⚡🥚');
      if (rw.life) parts.push(rw.life + '❤️');
      return parts.join('   ');
    },
    // Swap known emoji for small inline painted icons. ONLY for HTML that is
    // inserted via innerHTML (never for toasts, which use textContent).
    rich: function (str) {
      if (!global.UiIcons) return str;
      const MAP = { '🪙': 'coin', '💎': 'gem', '⚡': 'energy', '❤️': 'heart', '🔨': 'hammer', '🔀': 'shuffle', '🐷': 'piggy', '🎁': 'chest', '⭐': 'star', '🏆': 'tile_ach', '🔥': 'fever' };
      return String(str).replace(/🪙|💎|⚡|❤️|🔨|🔀|🐷|🎁|⭐|🏆|🔥/g, function (e) {
        const u = MAP[e] && global.UiIcons.url(MAP[e]);
        return u ? '<img class="uicon ic-inline" src="' + u + '" alt="">' : e;
      });
    },
    weightedPick: function (list) {
      let total = 0; for (let i = 0; i < list.length; i++) total += list[i].w;
      let r = Math.random() * total;
      for (let i = 0; i < list.length; i++) { r -= list[i].w; if (r <= 0) return i; }
      return list.length - 1;
    },

    // ---- WHEEL OF FORTUNE -------------------------------------------------
    wheelAvailable: function () {
      return global.Save.get().wheel.lastFree !== new Date().toISOString().slice(0, 10);
    },
    showWheel: function () {
      const p = global.Save.get();
      const today = new Date().toISOString().slice(0, 10);
      const seg = 360 / D.WHEEL.length;
      const COLS = ['#5db4ff', '#56e29a', '#ffd24d', '#ff8a3d', '#c58bff', '#ff6a9d', '#4de0d0', '#ffe14d'];
      const body = el('div', 'modal-body wheel-body');
      const stops = D.WHEEL.map(function (s, i) { return COLS[i % COLS.length] + ' ' + (i * seg) + 'deg ' + ((i + 1) * seg) + 'deg'; });
      const wheel = el('div', 'wheel');
      wheel.innerHTML = '<div class="wheel-ptr">▼</div><div class="wheel-face" style="background:conic-gradient(' + stops.join(',') + ')"></div><div class="wheel-hub">🎡</div>';
      const face = wheel.querySelector('.wheel-face');
      D.WHEEL.forEach(function (s, i) {
        const lab = el('div', 'wheel-seg', '<b>' + s.ic + '</b><i>' + s.label + '</i>');
        const ang = i * seg + seg / 2;
        lab.style.transform = 'rotate(' + ang + 'deg) translateY(-72px)';
        face.appendChild(lab);
      });
      body.appendChild(wheel);
      const info = el('div', 'wheel-info', '');
      body.appendChild(info);
      const spinBtn = el('button', 'btn btn-primary btn-big', '');
      body.appendChild(spinBtn);
      let spinning = false;
      const refresh = function () {
        const free = UI.wheelAvailable();
        info.innerHTML = free ? '<b class="wheel-free">🎁 ' + T('wheel_free') + '</b>' : T('wheel_cost', { n: D.WHEEL_SPIN_COST }) + ' · 💎 ' + p.gems;
        spinBtn.textContent = free ? T('wheel_spin_free') : T('wheel_spin_gems', { n: D.WHEEL_SPIN_COST });
        spinBtn.disabled = false; spinBtn.classList.toggle('btn-ghost', !free && p.gems < D.WHEEL_SPIN_COST);
      };
      refresh();
      click(spinBtn, function () {
        if (spinning) return;
        const free = UI.wheelAvailable();
        if (!free) {
          if (p.gems < D.WHEEL_SPIN_COST) { UI.toast(T('need_gems')); return; }
          p.gems -= D.WHEEL_SPIN_COST;
        }
        if (free) p.wheel.lastFree = today;
        global.Save.save(); UI.refreshCurrencies();
        spinning = true; spinBtn.disabled = true;
        const idx = UI.weightedPick(D.WHEEL);
        const target = 360 * 6 + (360 - (idx * seg + seg / 2));
        face.style.transition = 'transform 3.6s cubic-bezier(.12,.82,.2,1)';
        face.style.transform = 'rotate(' + target + 'deg)';
        global.Audio2.play('special');
        setTimeout(function () {
          const rest = target % 360;
          face.style.transition = 'none'; face.style.transform = 'rotate(' + rest + 'deg)';
          const prize = D.WHEEL[idx];
          UI.grantReward(prize.rw);
          global.Audio2.play(prize.id === 'j1' ? 'win' : 'coin'); UI.refreshCurrencies();
          UI.toast('🎡 ' + UI.rewardStr(prize.rw));
          spinning = false; refresh();
        }, 3700);
      });
      this.modal(T('wheel_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- DRAGON SUMMON (gacha) -------------------------------------------
    showSummon: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body summon-body');
      const orb = el('div', 'summon-orb', '<div class="orb-core">🥚</div>');
      body.appendChild(orb);
      const result = el('div', 'summon-result', '<span class="muted small">' + T('summon_hint') + '</span>');
      body.appendChild(result);
      const cost = el('div', 'summon-cost', '💎 ' + D.SUMMON_COST + '  ·  ' + T('you_have', { n: p.gems }));
      body.appendChild(cost);
      const btn = el('button', 'btn btn-primary btn-big', T('summon_do', { n: D.SUMMON_COST }));
      body.appendChild(btn);
      let busy = false;
      click(btn, function () {
        if (busy) return;
        if (p.gems < D.SUMMON_COST) { UI.toast(T('need_gems')); return; }
        p.gems -= D.SUMMON_COST; global.Save.save(); UI.refreshCurrencies();
        busy = true; btn.disabled = true;
        cost.innerHTML = '💎 ' + D.SUMMON_COST + '  ·  ' + T('you_have', { n: p.gems });
        const idx = UI.weightedPick(D.SUMMON_POOL);
        const loot = D.SUMMON_POOL[idx];
        orb.classList.remove('reveal', 'r-common', 'r-rare', 'r-epic'); void orb.offsetWidth;
        orb.classList.add('charging');
        result.innerHTML = '<span class="muted small">✨✨✨</span>';
        global.Audio2.play('dragon');
        setTimeout(function () {
          orb.classList.remove('charging'); orb.classList.add('reveal', 'r-' + loot.rarity);
          orb.querySelector('.orb-core').textContent = loot.ic;
          UI.grantReward(loot.rw);
          global.Audio2.play(loot.rarity === 'epic' ? 'win' : 'coin'); UI.refreshCurrencies();
          result.innerHTML = '<b class="rarity-' + loot.rarity + '">' + T('sr_' + loot.rarity) + '</b><div class="summon-loot">' + UI.rich(UI.rewardStr(loot.rw)) + '</div>';
          busy = false; btn.disabled = false;
        }, 900);
      });
      this.modal('🎰 ' + T('summon_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- DRAGON SKILL TREE -----------------------------------------------
    showSkills: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body scroll-body');
      const sub = el('div', 'muted small center', T('skills_sub'));
      body.appendChild(sub);
      D.SKILLS.forEach(function (sk) {
        const lvl = p.skills[sk.id] || 0;
        const maxed = lvl >= sk.max;
        const cost = maxed ? 0 : sk.cost[lvl];
        const card = el('div', 'skill-card');
        const pips = Array.from({ length: sk.max }, function (_, i) { return '<i class="pip' + (i < lvl ? ' on' : '') + '"></i>'; }).join('');
        card.innerHTML = '<div class="skill-ic">' + sk.ic + '</div>' +
          '<div class="skill-info"><b>' + T(sk.id) + '</b><span>' + T(sk.id + '_d') + '</span><div class="skill-pips">' + pips + '</div></div>';
        const btn = el('button', 'btn btn-mini ' + (maxed ? 'btn-ghost' : 'btn-primary'), maxed ? T('maxed') : ('💎 ' + cost));
        if (!maxed) click(btn, function () {
          if (p.gems < cost) { UI.toast(T('need_gems')); return; }
          p.gems -= cost; p.skills[sk.id] = lvl + 1; global.Save.save();
          global.Audio2.play('hatch'); UI.refreshCurrencies(); UI.toast('🌳 ' + T(sk.id) + ' +1'); UI.showSkills();
        });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal('🌳 ' + T('skills_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- ASYNC PvP DUELS -------------------------------------------------
    // Opponents are deterministic "ghosts" seeded from the day + player progress.
    pvpOpponents: function () {
      const p = global.Save.get();
      const day = Math.floor(Date.now() / 86400000);
      const prog = p.levelProgress;
      const list = [];
      for (let i = 0; i < 3; i++) {
        const seed = (day * 7 + prog * 13 + i * 101) % D.LB_NAMES.length;
        const tier = i; // easy / even / hard
        const base = 2600 + prog * 12;
        const score = Math.round(base * (0.75 + tier * 0.35) + ((day + i * 37) % 900));
        list.push({ name: D.LB_NAMES[seed], score: score, tier: tier,
          dragon: D.DRAGONS[(seed + i) % D.DRAGONS.length].id,
          reward: 20 + tier * 25, trophies: 8 + tier * 8 });
      }
      return list;
    },
    showPvp: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      body.appendChild(el('div', 'pvp-head', '🏆 ' + T('pvp_trophies', { n: p.pvp.trophies }) + '  ·  ' + T('pvp_record', { w: p.pvp.wins, l: p.pvp.losses })));
      body.appendChild(el('div', 'muted small center', T('pvp_sub')));
      const TIER = [T('pvp_easy'), T('pvp_even'), T('pvp_hard')];
      UI.pvpOpponents().forEach(function (op) {
        const def = D.dragonById(op.dragon);
        const card = el('div', 'pvp-card');
        card.innerHTML = '<div class="pvp-av">' + spriteGlyph(def.id, def.emoji, 'pvp-sprite', def.glow) + '</div>' +
          '<div class="pvp-info"><b>' + op.name + '</b>' +
          '<span class="pvp-tier t' + op.tier + '">' + TIER[op.tier] + '</span>' +
          '<span class="muted small">' + T('pvp_target', { n: op.score }) + '  ·  🏆' + op.trophies + '</span></div>';
        const btn = el('button', 'btn btn-mini btn-primary', T('pvp_fight'));
        click(btn, function () { UI.closeModal(); global.Game.startPvp(op); });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal('⚔️ ' + T('pvp_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- STORY CHAPTERS ---------------------------------------------------
    storyAvailable: function () {
      const p = global.Save.get();
      return D.STORY_CHAPTERS.some(function (c) { return p.levelProgress >= c.at && !p.story.read[c.id]; });
    },
    showStory: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body scroll-body');
      D.STORY_CHAPTERS.forEach(function (c, i) {
        const unlocked = p.levelProgress >= c.at;
        const card = el('div', 'story-card' + (unlocked ? '' : ' locked') + (unlocked && !p.story.read[c.id] ? ' fresh' : ''));
        card.innerHTML = '<div class="story-ic">' + (unlocked ? c.ic : '🔒') + '</div>' +
          '<div class="story-info"><b>' + T('chapter_n', { n: i + 1 }) + ' · ' + (unlocked ? T(c.id + '_t') : '???') + '</b>' +
          '<span>' + (unlocked ? T(c.id) : T('story_locked', { n: c.at })) + '</span></div>';
        if (unlocked) click(card, function () {
          if (!p.story.read[c.id]) { p.story.read[c.id] = true; global.Save.save(); card.classList.remove('fresh'); }
        });
        body.appendChild(card);
      });
      this.modal('📖 ' + T('story_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- DAILY REWARDS ----------------------------------------------------
    dailyAvailable: function () {
      const p = global.Save.get();
      return p.daily.lastClaim !== new Date().toISOString().slice(0, 10);
    },
    showDaily: function () {
      const p = global.Save.get();
      const today = new Date().toISOString().slice(0, 10);
      const rewards = [50, 80, 120, 160, 200, 300, 500];
      const body = el('div', 'modal-body');
      const grid = el('div', 'daily-grid');
      const dayIdx = p.daily.streak % 7;
      rewards.forEach(function (amt, i) {
        const cell = el('div', 'daily-cell' + (i < dayIdx ? ' done' : (i === dayIdx && UI.dailyAvailable() ? ' today' : '')));
        cell.innerHTML = '<div class="dd">' + T('day_n', { n: i + 1 }) + '</div><div class="da">' + amt + UI.rich(i === 6 ? '💎' : '🪙') + '</div>';
        grid.appendChild(cell);
      });
      body.appendChild(grid);
      this.modal(T('daily_title'), body, [
        { label: T('close') },
        UI.dailyAvailable()
          ? { label: T('claim'), primary: true, onClick: function () {
              const amt = rewards[dayIdx];
              if (dayIdx === 6) p.gems += amt; else p.gold += amt;
              p.daily.streak += 1; p.daily.lastClaim = today;
              global.Save.save(); global.Audio2.play('coin'); UI.refreshCurrencies();
              UI.toast(T('daily_got'));
            }}
          : { label: T('already_claimed'), primary: true }
      ]);
    },

    // ---- QUESTS -----------------------------------------------------------
    ensureQuests: function () {
      const p = global.Save.get();
      const today = new Date().toISOString().slice(0, 10);
      if (p.quests.date !== today || !p.quests.list || !p.quests.list.length) {
        const pool = D.QUEST_POOL.slice();
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
        const chosen = pool.slice(0, 3);
        p.quests = { date: today, list: chosen.map(function (q) { return { id: q.id, claimed: false }; }), progressBase: {} };
        chosen.forEach(function (q) { p.quests.progressBase[q.id] = p.stats[q.stat] || 0; });
        global.Save.save();
      }
    },
    showQuests: function () {
      this.ensureQuests();
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      p.quests.list.forEach(function (entry) {
        const q = D.QUEST_POOL.find(function (x) { return x.id === entry.id; });
        const base = p.quests.progressBase[q.id] || 0;
        const cur = Math.max(0, (q.stat === 'maxCombo' ? p.stats[q.stat] : (p.stats[q.stat] - base)));
        const prog = Math.min(q.goal, cur);
        const pct = Math.round(prog / q.goal * 100);
        const done = prog >= q.goal;
        const card = el('div', 'quest-card');
        const qtext = (global.I18N.STR[global.I18N.currentLang()][q.id]) ? T(q.id) : q.text;
        card.innerHTML = '<div class="quest-text">' + qtext + '</div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:#5fe39a"></div></div>' +
          '<div class="muted small">' + prog + ' / ' + q.goal + ' · ' + T('quest_reward', { n: q.reward }) + '</div>';
        const btn = el('button', 'btn btn-mini ' + (entry.claimed ? 'btn-ghost' : (done ? 'btn-primary' : 'btn-ghost')),
          entry.claimed ? '✓' : (done ? T('claim') : '...'));
        if (done && !entry.claimed) click(btn, function () {
          entry.claimed = true; p.gold += q.reward; UI.addPassXp(50); global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('+' + q.reward + '🪙'); UI.showQuests();
        });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal(T('quests_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- ACHIEVEMENTS -----------------------------------------------------
    showAchievements: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body scroll-body');
      D.ACHIEVEMENTS.forEach(function (a) {
        const cur = p.stats[a.stat] || 0;
        const done = cur >= a.goal;
        const claimed = p.achievements[a.id];
        const card = el('div', 'quest-card');
        const pct = Math.min(100, Math.round(cur / a.goal * 100));
        card.innerHTML = '<div class="quest-text">' + a.name + '<span class="muted small"> — ' + a.desc + '</span></div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:#ffd24d"></div></div>' +
          '<div class="muted small">' + Math.min(cur, a.goal) + ' / ' + a.goal + ' · ' + a.reward + '💎</div>';
        const btn = el('button', 'btn btn-mini ' + (claimed ? 'btn-ghost' : (done ? 'btn-primary' : 'btn-ghost')),
          claimed ? '✓' : (done ? T('claim') : '🔒'));
        if (done && !claimed) click(btn, function () {
          p.achievements[a.id] = true; p.gems += a.reward; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('🏆 +' + a.reward + '💎'); UI.showAchievements();
        });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal(T('ach_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- GAME MODES (screen) ---------------------------------------------
    renderModes: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-modes');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', T('modes_title')));
      const today = new Date().toISOString().slice(0, 10);
      const dailyDone = p.daily2.done && p.daily2.date === today;
      const wrap = el('div', 'modes-wrap');
      const modes = [
        { id: 'trials', ic: '🎲', name: T('mode_trials'), desc: T('mode_trials_desc'), best: p.modeBest.trials, bestLabel: T('depth', { n: p.modeBest.trials || 0 }) },
        { id: 'blitz', ic: '⏱️', name: T('mode_blitz'), desc: T('mode_blitz_desc'), best: p.modeBest.blitz },
        { id: 'endless', ic: '♾️', name: T('mode_endless'), desc: T('mode_endless_desc'), best: p.modeBest.endless },
        { id: 'daily', ic: '📅', name: T('mode_daily'), desc: T('mode_daily_desc'), daily: true },
        { id: 'adventure', ic: '🗺️', name: T('nav_map'), desc: T('play_level', { n: p.levelProgress }), adventure: true }
      ];
      modes.forEach(function (m) {
        const card = el('div', 'mode-card');
        const sub = m.daily ? (dailyDone ? T('daily_done_today') : '') : (m.best ? (T('best') + ': ' + (m.bestLabel || m.best)) : '');
        card.innerHTML = '<div class="mode-ic">' + m.ic + '</div>' +
          '<div class="mode-info"><b>' + m.name + '</b><span>' + m.desc + '</span>' + (sub ? '<span class="mode-best">' + sub + '</span>' : '') + '</div>';
        const disabled = m.daily && dailyDone;
        const btn = el('button', 'btn btn-mini ' + (disabled ? 'btn-ghost' : 'btn-primary'), disabled ? '✓' : T('play'));
        if (!disabled) click(btn, function () {
          if (m.adventure) global.Game.go('map');
          else if (m.id === 'trials') global.Game.startTrials();
          else global.Game.startMode(m.id);
        });
        card.appendChild(btn);
        wrap.appendChild(card);
      });
      s.appendChild(wrap);
      s.appendChild(this.navBar('modes'));
    },
    showModes: function () { global.Game.go('modes'); },

    // ---- LEADERBOARD (local, with simulated rivals) -----------------------
    showLeaderboard: function () {
      const p = global.Save.get();
      const mine = p.stats.totalStars || 0;
      const rows = D.LB_NAMES.map(function (name, i) {
        // deterministic spread of rival star totals
        return { name: name, stars: 18 + ((i * 53 + 31) % 340), me: false };
      });
      rows.push({ name: T('you'), stars: mine, me: true });
      rows.sort(function (a, b) { return b.stars - a.stars; });
      const myRank = rows.findIndex(function (r) { return r.me; }) + 1;
      const body = el('div', 'modal-body scroll-body');
      body.appendChild(el('div', 'lb-head', T('your_place', { rank: myRank, total: rows.length, stars: mine })));
      const list = el('div', 'lb-list');
      rows.slice(0, 20).forEach(function (r, idx) {
        const row = el('div', 'lb-row' + (r.me ? ' me' : ''));
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ('#' + (idx + 1));
        row.innerHTML = '<span class="lb-rank">' + medal + '</span>' +
          '<span class="lb-name">' + r.name + '</span>' +
          '<span class="lb-stars">⭐ ' + r.stars + '</span>';
        list.appendChild(row);
      });
      body.appendChild(list);
      this.modal(T('lb_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- SETTINGS ---------------------------------------------------------
    showSettings: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      const mkToggle = function (label, key, onChange) {
        const row = el('div', 'set-row');
        row.innerHTML = '<span>' + label + '</span>';
        const tg = el('button', 'toggle ' + (p.settings[key] ? 'on' : 'off'), p.settings[key] ? T('on') : T('off'));
        click(tg, function () {
          p.settings[key] = !p.settings[key]; global.Save.save();
          tg.className = 'toggle ' + (p.settings[key] ? 'on' : 'off');
          tg.textContent = p.settings[key] ? T('on') : T('off');
          onChange && onChange(p.settings[key]);
        });
        row.appendChild(tg);
        return row;
      };
      body.appendChild(mkToggle(T('s_sound'), 'sound'));
      body.appendChild(mkToggle(T('s_music'), 'music', function (on) { global.Audio2.setMusicEnabled(on); }));
      body.appendChild(mkToggle(T('s_vibration'), 'vibration', function (on) { if (on && global.navigator && global.navigator.vibrate) global.navigator.vibrate(20); }));
      body.appendChild(mkToggle(T('s_autodragons'), 'autoDragons'));
      body.appendChild(mkToggle(T('s_perf'), 'perf'));
      body.appendChild(mkToggle(T('s_colorblind'), 'colorblind'));
      // Language selector
      const langRow = el('div', 'set-row');
      langRow.innerHTML = '<span>' + T('s_language') + '</span>';
      const langBtn = el('button', 'toggle on', global.I18N.langName(global.I18N.currentLang()));
      click(langBtn, function () { UI.showLanguagePicker(); });
      langRow.appendChild(langBtn);
      body.appendChild(langRow);
      const reset = click(el('button', 'btn btn-ghost btn-mini', T('reset')), function () {
        UI.modal(T('reset_q'), el('div', 'modal-body', '<p>' + T('reset_warn') + '</p>'), [
          { label: T('no') },
          { label: T('yes_reset'), primary: true, onClick: function () {
            global.Save.reset(); UI.toast(T('reset_done')); global.Game.go('home');
          }}
        ]);
      });
      if (global.__installPrompt) {
        const inst = click(el('button', 'btn btn-buy btn-mini', T('s_install')), function () {
          const ev = global.__installPrompt; if (!ev) return;
          ev.prompt(); global.__installPrompt = null; UI.closeModal();
        });
        body.appendChild(inst);
      }
      const stats = click(el('button', 'btn btn-primary btn-mini', '📊 ' + T('stats_title')), function () { UI.showStats(); });
      body.appendChild(stats);
      body.appendChild(el('div', 'set-row', '<span>' + T('version') + '</span><span class="muted small">' + T('credits') + '</span>'));
      body.appendChild(reset);
      this.modal(T('settings_title'), body, [{ label: T('close'), primary: true }]);
    },

    // ---- PLAYER STATISTICS (surfaces already-tracked data) ----------------
    showStats: function () {
      const p = global.Save.get();
      const s = p.stats || {};
      let starsSum = 0; for (const k in p.stars) starsSum += (p.stars[k] || 0);
      const pvp = p.pvp || { wins: 0, losses: 0, trophies: 0 };
      const mb = p.modeBest || {};
      const rows = [
        ['🗺️', T('st_progress'), p.levelProgress + ' / ' + D.LEVELS.length],
        ['⭐', T('st_stars'), starsSum],
        ['🏆', T('st_levels_won'), s.levelsWon || 0],
        ['🔥', T('st_max_combo'), s.maxCombo || 0],
        ['💎', T('st_crushed'), s.crystalsCrushed || 0],
        ['💠', T('st_specials'), s.specialsMade || 0],
        ['🐉', T('st_dragons'), (p.ownedDragons || []).length + ' / ' + D.DRAGONS.length],
        ['✨', T('st_procs'), s.dragonProcs || 0],
        ['⚡', T('st_energy'), s.energyEarned || 0],
        ['🥇', T('st_streak'), (p.streak && p.streak.best) || 0],
        ['⏱️', T('st_blitz'), mb.blitz || 0],
        ['♾️', T('st_endless'), mb.endless || 0],
        ['🎲', T('st_trials'), mb.trials || 0],
        ['⚔️', T('st_pvp'), (pvp.wins || 0) + 'W/' + (pvp.losses || 0) + 'L · 🏆' + (pvp.trophies || 0)]
      ];
      const body = el('div', 'modal-body scroll-body');
      const grid = el('div', 'stat-grid');
      rows.forEach(function (r) {
        const c = el('div', 'stat-cell');
        c.innerHTML = '<div class="st-ic">' + r[0] + '</div><div class="st-v">' + r[2] + '</div><div class="st-l">' + r[1] + '</div>';
        grid.appendChild(c);
      });
      body.appendChild(grid);
      this.modal('📊 ' + T('stats_title'), body, [{ label: T('close'), primary: true }]);
    },

    showLanguagePicker: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      const list = el('div', 'lb-list');
      global.I18N.ORDER.forEach(function (l) {
        const active = global.I18N.currentLang() === l;
        const row = el('button', 'btn btn-mini ' + (active ? 'btn-primary' : 'btn-ghost') + ' lang-row',
          global.I18N.langName(l) + (active ? '  ✓' : ''));
        click(row, function () {
          p.settings.language = l; global.Save.save();
          UI.closeModal();
          // re-render whatever screen we're on
          if (global.Game) global.Game.go(UI.current === 'game' ? 'home' : UI.current);
          UI.showSettings();
        });
        list.appendChild(row);
      });
      body.appendChild(list);
      this.modal(T('choose_lang'), body, [{ label: T('close'), primary: true }]);
    }
  };

  global.UI = UI;
})(window);
