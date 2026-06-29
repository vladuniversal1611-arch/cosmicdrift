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

  const UI = {
    screens: {},
    current: 'home',

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
      const bar = el('div', 'currency-bar');
      bar.innerHTML =
        '<div class="cur"><span class="cur-ic">🪙</span><span id="ui-gold">' + p.gold + '</span></div>' +
        '<div class="cur"><span class="cur-ic">💎</span><span id="ui-gems">' + p.gems + '</span></div>' +
        '<div class="cur"><span class="cur-ic">⚡</span><span id="ui-energy">' + p.energy + '</span></div>';
      return bar;
    },
    refreshCurrencies: function () {
      const p = global.Save.get();
      const set = function (id, v) { const e = document.getElementById(id); if (e) e.textContent = v; };
      set('ui-gold', p.gold); set('ui-gems', p.gems); set('ui-energy', p.energy);
    },

    navBar: function (active) {
      const items = [
        { id: 'map', ic: '🗺️', label: 'Карта' },
        { id: 'collection', ic: '🐲', label: 'Дракони' },
        { id: 'shop', ic: '🛒', label: 'Магазин' },
        { id: 'pass', ic: '🎖️', label: 'Пропуск' },
        { id: 'home', ic: '🏝️', label: 'Острів' }
      ];
      const bar = el('div', 'nav-bar');
      items.forEach(function (it) {
        const b = el('button', 'nav-btn' + (it.id === active ? ' active' : ''),
          '<span class="nav-ic">' + it.ic + '</span><span class="nav-lb">' + it.label + '</span>');
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

      // Island scene with eggs incubating
      const scene = el('div', 'island-scene');
      scene.innerHTML = '<div class="island-sun"></div>';
      // owned dragons floating
      p.ownedDragons.forEach(function (id, i) {
        const def = D.dragonById(id);
        const d = el('div', 'isle-dragon', def.emoji);
        d.style.left = (12 + (i % 4) * 22) + '%';
        d.style.top = (18 + Math.floor(i / 4) * 26) + '%';
        d.style.filter = 'drop-shadow(0 0 12px ' + def.glow + ')';
        scene.appendChild(d);
      });
      s.appendChild(scene);

      // Egg incubator row
      const eggsWrap = el('div', 'eggs-wrap');
      eggsWrap.appendChild(el('div', 'section-h', '🥚 Інкубатор драконів'));
      const eggGrid = el('div', 'egg-grid');
      p.eggs.forEach(function (egg, idx) {
        const def = D.dragonById(egg.dragon);
        const pct = Math.min(100, Math.round(egg.charge / egg.need * 100));
        const card = el('div', 'egg-card');
        card.innerHTML =
          '<div class="egg-emoji">🥚</div>' +
          '<div class="egg-name">' + def.title + '</div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + def.color + '"></div></div>' +
          '<div class="egg-pct">' + egg.charge + ' / ' + egg.need + ' ⚡</div>';
        const btn = el('button', 'btn btn-mini ' + (pct >= 100 ? 'btn-primary' : 'btn-ghost'),
          pct >= 100 ? 'Вилупити!' : 'Зарядити +10⚡');
        click(btn, function () { UI.handleEgg(idx); });
        card.appendChild(btn);
        eggGrid.appendChild(card);
      });
      eggsWrap.appendChild(eggGrid);
      s.appendChild(eggsWrap);

      // Quick action buttons
      const acts = el('div', 'home-actions');
      const playBtn = click(el('button', 'btn btn-primary btn-big', '▶ Грати рівень ' + p.levelProgress), function () { global.Game.go('map'); });
      acts.appendChild(playBtn);
      const grid2 = el('div', 'home-grid');
      [
        { ic: '🎁', label: 'Щоденна', go: function () { UI.showDaily(); } },
        { ic: '📜', label: 'Квести', go: function () { UI.showQuests(); } },
        { ic: '🏆', label: 'Досягнення', go: function () { UI.showAchievements(); } },
        { ic: '⚙️', label: 'Налаштування', go: function () { UI.showSettings(); } }
      ].forEach(function (a) {
        const b = click(el('button', 'btn btn-tile', '<span>' + a.ic + '</span>' + a.label), a.go);
        grid2.appendChild(b);
      });
      acts.appendChild(grid2);
      s.appendChild(acts);

      s.appendChild(this.navBar('home'));
      // daily reminder badge
      if (UI.dailyAvailable()) UI.toast('🎁 Доступна щоденна нагорода!');
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
        }
        global.Save.addStat('dragonsHatched', 1);
        p.eggs.splice(idx, 1);
        global.Save.save();
        global.Audio2.play('hatch');
        const def = D.dragonById(egg.dragon);
        UI.modal('🎉 Новий дракон!', el('div', 'modal-body',
          '<div class="big-emoji">' + def.emoji + '</div><b>' + def.title + '</b><p>' + def.desc + '</p>'),
          [{ label: 'Чудово!', primary: true, onClick: function () { UI.renderHome(); } }]);
      } else {
        if (p.energy < 10) { UI.toast('Недостатньо енергії ⚡ (грайте рівні)'); return; }
        p.energy -= 10; egg.charge = Math.min(egg.need, egg.charge + 10);
        global.Save.save();
        global.Audio2.play('coin');
        UI.refreshCurrencies();
        UI.renderHome();
      }
    },

    // ---- LEVEL MAP --------------------------------------------------------
    renderMap: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-map');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', '🗺️ Острови драконів'));

      const scroll = el('div', 'map-scroll');
      D.ISLANDS.forEach(function (island) {
        const unlocked = p.levelProgress > island.unlockLevel || island.unlockLevel === 0;
        const block = el('div', 'island-block');
        block.style.background = 'linear-gradient(135deg,' + island.bg1 + 'cc,' + island.bg2 + 'cc)';
        const head = el('div', 'island-head');
        head.innerHTML = '<b style="color:' + island.theme + '">' + island.name + '</b>' +
          (unlocked ? '' : '<span class="lock">🔒 рівень ' + (island.unlockLevel + 1) + '</span>');
        block.appendChild(head);
        const nodes = el('div', 'level-nodes');
        for (let i = 0; i < 25; i++) {
          const lvNum = island.id * 25 + i + 1;
          const lv = D.LEVELS[lvNum - 1];
          if (!lv) continue;
          const stars = p.stars[lvNum] || 0;
          const isUnlocked = lvNum <= p.levelProgress;
          const node = el('button', 'lv-node' +
            (lvNum === p.levelProgress ? ' current' : '') +
            (isUnlocked ? '' : ' locked') + (lv.boss ? ' boss' : ''));
          node.innerHTML = (lv.boss ? '👑' : lvNum) +
            (stars ? '<span class="lv-stars">' + '★'.repeat(stars) + '</span>' : '');
          if (isUnlocked) click(node, function () { UI.showLevelPreview(lvNum); });
          else node.disabled = true;
          nodes.appendChild(node);
        }
        block.appendChild(nodes);
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

    showLevelPreview: function (lvNum) {
      const lv = D.LEVELS[lvNum - 1];
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      let objText = lv.objective === D.OBJ.SCORE ? ('Набрати ' + lv.target + ' очок')
        : lv.objective === D.OBJ.COLLECT ? ('Зібрати ' + lv.target + ' × ' + D.CRYSTALS[lv.color].glyph)
        : ('Розбити всю кригу (' + lv.iceCount + ')');
      body.innerHTML =
        '<p class="obj">🎯 ' + objText + '</p>' +
        '<p class="muted">Ходів: ' + lv.moves + ' · Нагорода: ' + lv.reward.gold + '🪙 ' + lv.reward.energy + '⚡</p>' +
        '<div class="section-h">Бойова команда драконів</div>';
      body.appendChild(UI.equipPicker());
      this.modal((lv.boss ? '👑 ' : '') + lv.name, body, [
        { label: '✖', onClick: function () {} },
        { label: '▶ Старт', primary: true, onClick: function () { global.Game.startLevel(lvNum); } }
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
          cell.innerHTML = '<div class="eq-emoji" style="filter:drop-shadow(0 0 8px ' + def.glow + ')">' + def.emoji + '</div><div class="eq-name">' + def.name + '</div>';
        } else {
          cell.innerHTML = '<div class="eq-emoji empty">＋</div><div class="eq-name">Порожньо</div>';
        }
        (function (slot) { click(cell, function () { UI.cycleEquip(slot); }); })(slot);
        wrap.appendChild(cell);
      }
      const hint = el('div', 'muted small', 'Торкніться слота, щоб змінити дракона');
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
      s.appendChild(el('div', 'section-h center', '🐲 Колекція драконів'));
      const grid = el('div', 'dragon-grid');
      D.DRAGONS.forEach(function (def) {
        const owned = p.ownedDragons.indexOf(def.id) !== -1;
        const lvl = p.dragonLevels[def.id] || 0;
        const card = el('div', 'dragon-card' + (owned ? '' : ' locked'));
        const skinColor = (D.SKIN_COLORS[p.activeSkins[def.id]] || {}).color || def.color;
        card.innerHTML =
          '<div class="rar rar-' + def.rarity + '">' + def.rarity + '</div>' +
          '<div class="dc-emoji" style="filter:drop-shadow(0 0 14px ' + (owned ? (D.SKIN_COLORS[p.activeSkins[def.id]] || def).glow || def.glow : '#444') + ')">' + (owned ? def.emoji : '❔') + '</div>' +
          '<div class="dc-name" style="color:' + skinColor + '">' + def.name + '</div>' +
          '<div class="dc-title">' + def.title + '</div>' +
          (owned ? '<div class="dc-lvl">Рівень ' + lvl + '</div>' : '<div class="dc-lvl muted">Не відкрито</div>') +
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
      const cost = lvl * 150;
      const body = el('div', 'modal-body');
      body.innerHTML =
        '<div class="big-emoji" style="filter:drop-shadow(0 0 16px ' + def.glow + ')">' + def.emoji + '</div>' +
        '<p>' + def.desc + '</p>' +
        '<div class="up-stats">' +
        '<div>Поточний рівень: <b>' + lvl + '</b></div>' +
        '<div>Сила здатності: <b>' + lvl + '</b> → <b>' + (lvl + 1) + '</b></div>' +
        '<div>Заряджається швидше з кожним рівнем</div>' +
        '</div>';
      this.modal('⬆ Прокачка: ' + def.name, body, [
        { label: 'Закрити' },
        { label: 'Покращити (' + cost + '🪙)', primary: true, onClick: function () {
          if (p.gold < cost) { UI.toast('Недостатньо золота 🪙'); return; }
          p.gold -= cost; p.dragonLevels[id] = lvl + 1; global.Save.save();
          global.Audio2.play('coin'); UI.toast(def.name + ' тепер рівня ' + (lvl + 1) + '!');
          UI.renderCollection();
        }}
      ]);
    },

    // ---- SHOP -------------------------------------------------------------
    renderShop: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-shop');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', '🛒 Магазин'));

      // Rewarded ad
      const adCard = el('div', 'shop-card highlight');
      adCard.innerHTML = '<div class="shop-ic">📺</div><div class="shop-info"><b>Реклама за винагороду</b><span>Перегляньте рекламу → +100🪙 та +20⚡</span></div>';
      const adBtn = click(el('button', 'btn btn-primary btn-mini', 'Дивитись'), function () { UI.watchAd(); });
      adCard.appendChild(adBtn);
      s.appendChild(adCard);

      // Gem packs (IAP placeholders)
      s.appendChild(el('div', 'section-h', '💎 Кристали'));
      [
        { gems: 100, price: '$0.99' }, { gems: 550, price: '$4.99' }, { gems: 1200, price: '$9.99' }
      ].forEach(function (pack) {
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic">💎</div><div class="shop-info"><b>' + pack.gems + ' кристалів</b><span>Найкраща ціна</span></div>';
        const b = click(el('button', 'btn btn-buy btn-mini', pack.price), function () { UI.fakePurchase(pack.gems); });
        c.appendChild(b); s.appendChild(c);
      });

      // Gold for gems
      s.appendChild(el('div', 'section-h', '🪙 Золото'));
      [{ gold: 500, gems: 20 }, { gold: 1500, gems: 50 }].forEach(function (pack) {
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic">🪙</div><div class="shop-info"><b>' + pack.gold + ' золота</b><span>за ' + pack.gems + '💎</span></div>';
        const b = click(el('button', 'btn btn-buy btn-mini', pack.gems + '💎'), function () {
          if (p.gems < pack.gems) { UI.toast('Недостатньо кристалів 💎'); return; }
          p.gems -= pack.gems; p.gold += pack.gold; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('+' + pack.gold + ' золота!');
        });
        c.appendChild(b); s.appendChild(c);
      });

      // Boosters
      s.appendChild(el('div', 'section-h', '🧪 Бустери'));
      [
        { key: 'hammer', ic: '🔨', name: 'Молот ×3', desc: 'Розбити будь-який кристал', amount: 3, price: 200 },
        { key: 'shuffle', ic: '🔀', name: 'Мікс ×3', desc: 'Перемішати поле', amount: 3, price: 150 },
        { key: 'moves', ic: '➕5', name: 'Ходи ×3', desc: '+5 ходів у грі', amount: 3, price: 250 }
      ].forEach(function (b) {
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic">' + b.ic + '</div><div class="shop-info"><b>' + b.name + '</b><span>' + b.desc + ' · маєте: ' + (p.boosters[b.key] || 0) + '</span></div>';
        const btn = click(el('button', 'btn btn-buy btn-mini', b.price + '🪙'), function () {
          if (p.gold < b.price) { UI.toast('Недостатньо золота 🪙'); return; }
          p.gold -= b.price; p.boosters[b.key] = (p.boosters[b.key] || 0) + b.amount; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('Куплено: ' + b.name); UI.renderShop();
        });
        c.appendChild(btn); s.appendChild(c);
      });

      // Cosmetic skins
      s.appendChild(el('div', 'section-h', '🎨 Косметичні скіни драконів'));
      D.SKINS.forEach(function (sk) {
        const owned = p.ownedSkins.indexOf(sk.id) !== -1;
        const def = D.dragonById(sk.dragon);
        const sc = D.SKIN_COLORS[sk.skin] || def;
        const c = el('div', 'shop-card');
        c.innerHTML = '<div class="shop-ic" style="filter:drop-shadow(0 0 10px ' + sc.glow + ')">' + def.emoji + '</div>' +
          '<div class="shop-info"><b style="color:' + sc.color + '">' + sk.name + '</b><span>Скін для ' + def.name + '</span></div>';
        const active = p.activeSkins[sk.dragon] === sk.skin;
        const b = click(el('button', 'btn btn-mini ' + (owned ? (active ? 'btn-ghost' : 'btn-primary') : 'btn-buy'),
          owned ? (active ? '✓ Активний' : 'Вдягти') : (sk.price + '💎')), function () {
          if (!owned) {
            if (p.ownedDragons.indexOf(sk.dragon) === -1) { UI.toast('Спочатку отримайте дракона ' + def.name); return; }
            if (p.gems < sk.price) { UI.toast('Недостатньо кристалів 💎'); return; }
            p.gems -= sk.price; p.ownedSkins.push(sk.id);
            p.activeSkins[sk.dragon] = sk.skin; global.Save.save();
            global.Audio2.play('coin'); UI.toast('Скін розблоковано!');
          } else {
            p.activeSkins[sk.dragon] = active ? null : sk.skin; global.Save.save();
          }
          UI.refreshCurrencies(); UI.renderShop();
        });
        c.appendChild(b); s.appendChild(c);
      });

      s.appendChild(this.navBar('shop'));
    },

    watchAd: function () {
      // Simulated rewarded ad. In the packaged app this calls the AdMob plugin.
      const body = el('div', 'modal-body');
      body.innerHTML = '<div class="ad-box">📺<br><span id="ad-count">5</span><br><small>Реклама...</small></div>';
      this.modal('Реклама за винагороду', body, [{ label: 'Зачекайте...', primary: true, keepOpen: true }]);
      let n = 5;
      const cnt = body.querySelector('#ad-count');
      const iv = setInterval(function () {
        n--; if (cnt) cnt.textContent = n;
        if (n <= 0) {
          clearInterval(iv);
          const p = global.Save.get();
          p.gold += 100; p.energy += 20; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies();
          UI.closeModal(); UI.toast('Нагорода: +100🪙 +20⚡');
        }
      }, 700);
      // If a real ad plugin exists, use it instead.
      if (global.AdMobBridge && global.AdMobBridge.showRewarded) {
        clearInterval(iv); UI.closeModal();
        global.AdMobBridge.showRewarded(function () {
          const p = global.Save.get(); p.gold += 100; p.energy += 20; global.Save.save();
          UI.refreshCurrencies(); UI.toast('Нагорода: +100🪙 +20⚡');
        });
      }
    },

    fakePurchase: function (gems) {
      // Placeholder for Google Play Billing; grants gems for demo.
      const p = global.Save.get();
      p.gems += gems; global.Save.save();
      global.Audio2.play('coin'); UI.refreshCurrencies();
      UI.toast('Покупка успішна: +' + gems + '💎 (демо)');
      UI.renderShop();
    },

    // ---- BATTLE PASS ------------------------------------------------------
    renderPass: function () {
      const p = global.Save.get();
      const s = document.getElementById('screen-pass');
      clear(s);
      s.appendChild(this.currencyBar());
      s.appendChild(el('div', 'section-h center', '🎖️ Бойовий пропуск — Сезон 1'));

      const tier = Math.min(50, Math.floor(p.pass.xp / 100) + 1);
      const into = p.pass.xp % 100;
      const head = el('div', 'pass-head');
      head.innerHTML = '<div>Рівень <b>' + tier + '</b> / 50</div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + into + '%;background:#ffd24d"></div></div>' +
        '<div class="muted small">' + into + ' / 100 XP до наступного рівня</div>';
      if (!p.pass.premium) {
        const buy = click(el('button', 'btn btn-buy btn-mini', '👑 Преміум 500💎'), function () {
          if (p.gems < 500) { UI.toast('Недостатньо кристалів 💎'); return; }
          p.gems -= 500; p.pass.premium = true; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('Преміум-пропуск активовано! 👑');
          UI.renderPass();
        });
        head.appendChild(buy);
      } else {
        head.appendChild(el('div', 'premium-badge', '👑 ПРЕМІУМ АКТИВНО'));
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
      UI.toast('Отримано: ' + UI.rewardLabel(r)); UI.renderPass();
    },
    addPassXp: function (xp) {
      const p = global.Save.get();
      p.pass.xp += xp; global.Save.save();
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
        cell.innerHTML = '<div class="dd">День ' + (i + 1) + '</div><div class="da">' + amt + (i === 6 ? '💎' : '🪙') + '</div>';
        grid.appendChild(cell);
      });
      body.appendChild(grid);
      this.modal('🎁 Щоденна нагорода', body, [
        { label: 'Закрити' },
        UI.dailyAvailable()
          ? { label: 'Забрати', primary: true, onClick: function () {
              const amt = rewards[dayIdx];
              if (dayIdx === 6) p.gems += amt; else p.gold += amt;
              p.daily.streak += 1; p.daily.lastClaim = today;
              global.Save.save(); global.Audio2.play('coin'); UI.refreshCurrencies();
              UI.toast('Отримано щоденну нагороду!');
            }}
          : { label: 'Вже отримано', primary: true }
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
        card.innerHTML = '<div class="quest-text">' + q.text + '</div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:#5fe39a"></div></div>' +
          '<div class="muted small">' + prog + ' / ' + q.goal + ' · нагорода ' + q.reward + '🪙</div>';
        const btn = el('button', 'btn btn-mini ' + (entry.claimed ? 'btn-ghost' : (done ? 'btn-primary' : 'btn-ghost')),
          entry.claimed ? '✓' : (done ? 'Забрати' : '...'));
        if (done && !entry.claimed) click(btn, function () {
          entry.claimed = true; p.gold += q.reward; UI.addPassXp(50); global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('+' + q.reward + '🪙'); UI.showQuests();
        });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal('📜 Щоденні квести', body, [{ label: 'Закрити', primary: true }]);
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
          claimed ? '✓' : (done ? 'Забрати' : '🔒'));
        if (done && !claimed) click(btn, function () {
          p.achievements[a.id] = true; p.gems += a.reward; global.Save.save();
          global.Audio2.play('coin'); UI.refreshCurrencies(); UI.toast('Досягнення! +' + a.reward + '💎'); UI.showAchievements();
        });
        card.appendChild(btn);
        body.appendChild(card);
      });
      this.modal('🏆 Досягнення', body, [{ label: 'Закрити', primary: true }]);
    },

    // ---- SETTINGS ---------------------------------------------------------
    showSettings: function () {
      const p = global.Save.get();
      const body = el('div', 'modal-body');
      const mkToggle = function (label, key, onChange) {
        const row = el('div', 'set-row');
        row.innerHTML = '<span>' + label + '</span>';
        const tg = el('button', 'toggle ' + (p.settings[key] ? 'on' : 'off'), p.settings[key] ? 'УВІМК' : 'ВИМК');
        click(tg, function () {
          p.settings[key] = !p.settings[key]; global.Save.save();
          tg.className = 'toggle ' + (p.settings[key] ? 'on' : 'off');
          tg.textContent = p.settings[key] ? 'УВІМК' : 'ВИМК';
          onChange && onChange(p.settings[key]);
        });
        row.appendChild(tg);
        return row;
      };
      body.appendChild(mkToggle('🔊 Звуки', 'sound'));
      body.appendChild(mkToggle('🎵 Музика', 'music', function (on) { global.Audio2.setMusicEnabled(on); }));
      body.appendChild(mkToggle('📳 Вібрація', 'vibration', function (on) { if (on && global.navigator && global.navigator.vibrate) global.navigator.vibrate(20); }));
      const reset = click(el('button', 'btn btn-ghost btn-mini', '🗑️ Скинути прогрес'), function () {
        UI.modal('Скинути прогрес?', el('div', 'modal-body', '<p>Весь прогрес буде втрачено назавжди.</p>'), [
          { label: 'Ні' },
          { label: 'Так, скинути', primary: true, onClick: function () {
            global.Save.reset(); UI.toast('Прогрес скинуто'); global.Game.go('home');
          }}
        ]);
      });
      body.appendChild(el('div', 'set-row', '<span>Версія 1.0.0</span>'));
      body.appendChild(reset);
      this.modal('⚙️ Налаштування', body, [{ label: 'Закрити', primary: true }]);
    }
  };

  global.UI = UI;
})(window);
