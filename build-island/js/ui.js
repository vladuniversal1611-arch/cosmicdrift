/* UI: DOM screens, HUD, menus, crafting panel, bag, popups, toasts and fly-to-HUD effects. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const $ = (id) => document.getElementById(id);
  const Items = BI.Items;

  const ICONS = Items.ICONS;
  const ico = (name) => '<i class="ico">' + (ICONS[name] || '') + '</i>';
  const fmt = (n) => (n >= 100000 ? Math.floor(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n)));
  const secs = (ms) => {
    const s = Math.ceil(ms / 1000);
    return s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's';
  };

  /** Cost list; coins last. check: colour what the player can't afford. */
  function costHtml(cost, check) {
    const s = BI.state;
    return Object.keys(cost).sort((a, b) => (a === 'coins') - (b === 'coins')).map((k) => {
      const short = check && s.res[k] < cost[k];
      return '<span class="cost' + (short ? ' short' : '') + '">' + ico(k) + fmt(cost[k]) + '</span>';
    }).join('');
  }

  const popupQueue = [];
  let popupOpen = null;
  let buildCat = 'all', bpCat = 'house';
  let collectShown = null;
  let hudKeys = [];
  const thumbs = {};

  const UI = {
    ICONS, ico, fmt, costHtml,

    init() {
      document.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = ICONS[el.dataset.ico] || ''; });
      $('ui').addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el || el.closest('.confirm')) return;
        // a tap on the canvas can open a panel; ignore the browser's follow-up "ghost" click on it
        if (performance.now() - (BI.Input.lastTap || 0) < 450) return;
        BI.Audio.playClick();
        this.handle(el.dataset.action, el);
      });
      $('confirm-no').addEventListener('click', () => { BI.Audio.playClick(); this.closeConfirm(); });
      $('confirm-yes').addEventListener('click', () => {
        BI.Audio.playClick();
        const fn = this._confirmYes;
        this.closeConfirm();
        if (fn) fn();
      });
      BI.AdManager.init();
    },

    handle(action, el) {
      const G = BI.Game;
      switch (action) {
        case 'play': G.startGameplay(); break;
        case 'home': G.goMenu(); break;
        case 'back': G.pop(); break;
        case 'settings': this.renderSettings(); G.push('SETTINGS'); break;
        case 'shop': this.renderShop(); G.push('SHOP'); break;
        case 'inventory': this.renderInventory(); G.push('INVENTORY'); break;
        case 'blueprints': this.renderBlueprints(bpCat); G.push('BLUEPRINTS'); break;
        case 'islands':
          if (G.state === 'ISLAND_PROGRESS') G.pop();
          this.renderIslands();
          G.push('ISLAND_SELECT');
          break;
        case 'build-menu': this.renderBuildMenu(buildCat); G.push('BUILD_MENU'); break;
        case 'build-tab': this.renderBuildMenu(el.dataset.cat); break;
        case 'bp-tab': this.renderBlueprints(el.dataset.cat); break;
        case 'build-select': G.selectBuilding(el.dataset.type); break;
        case 'build-cancel': G.cancelBuild(); break;
        case 'build-rotate': G.rotateBuild(); break;
        case 'build-confirm': G.confirmBuild(); break;
        case 'collect': G.collectNearest(); break;
        case 'craft': G.craft(+el.dataset.r, +el.dataset.n); break;
        case 'station-collect': G.collectStation(); break;
        case 'sell': G.sell(el.dataset.key, +el.dataset.n); break;
        case 'expand': G.askExpand(); break;
        case 'island-progress': this.renderProgress(); G.push('ISLAND_PROGRESS'); break;
        case 'island-go': G.travelTo(el.dataset.id); break;
        case 'island-unlock': G.unlockIsland(el.dataset.id); break;
        case 'island-locked': {
          const def = BI.Progression.BY_ID[el.dataset.id];
          this.toast('🔒 ' + BI.Progression.unlockBlocker(def), 'bad');
          BI.Audio.playError();
          break;
        }
        case 'quests-toggle': $('quest-panel').classList.toggle('collapsed'); break;
        case 'watch-ad': G.watchAd(el.dataset.reward); break;
        case 'trade': G.trade(el.dataset.id); break;
        case 'buy-pack': this.toast('💳 Purchases are disabled in this prototype'); break;
        case 'toggle-music': G.setSetting('music', !BI.state.settings.music); this.renderSettings(); break;
        case 'toggle-sfx': G.setSetting('sfx', !BI.state.settings.sfx); this.renderSettings(); break;
        case 'save-now': this.toast(BI.Save.saveGame() ? '💾 Game saved' : 'Could not save', 'good'); break;
        case 'reset':
          this.confirm('Reset progress?', 'All islands, buildings and resources will be deleted. This cannot be undone.', 'RESET', () => G.reset());
          break;
        case 'popup-ok': this.closePopup(); break;
        default: break;
      }
    },

    sync(stack) {
      document.querySelectorAll('.screen[data-state]').forEach((el) => {
        const states = el.dataset.state.split(' ');
        el.classList.toggle('active', states.some((s) => stack.indexOf(s) >= 0));
      });
      document.body.dataset.base = stack[0];
      document.body.dataset.top = stack[stack.length - 1];
      if (stack[stack.length - 1] !== 'GAMEPLAY') this.setCollect(null);
    },

    updateAll() {
      this.updateRes();
      this.updateXP();
      this.renderQuests();
      this.updateIslandBtn();
      this.updateMenu();
    },

    /** The two raw resources of the current island get their own HUD counters. */
    setHudResources(keys) {
      hudKeys = keys;
      $('hud-dyn').innerHTML = keys.map((k) => '<div class="pill" id="pill-' + k + '">' + ico(k) + '<span class="val" data-res="' + k + '">0</span></div>').join('');
      this.updateRes();
    },

    updateRes() {
      const r = BI.state.res;
      document.querySelectorAll('[data-res]').forEach((el) => {
        const v = fmt(r[el.dataset.res] || 0);
        if (el.textContent !== v) el.textContent = v;
      });
    },

    updateXP() {
      const s = BI.state;
      const need = BI.Progression.xpToNext(s.level);
      document.querySelectorAll('[data-bind="level"]').forEach((el) => { el.textContent = s.level; });
      document.querySelectorAll('[data-bind="xptext"]').forEach((el) => { el.textContent = s.xp + ' / ' + need + ' XP'; });
      $('hud-xp').style.width = Math.min(100, (s.xp / need) * 100) + '%';
      this.updateMenu();
    },

    updateMenu() {
      const s = BI.state;
      const def = BI.Progression.BY_ID[s.currentIsland];
      $('menu-sub').textContent = 'Lv. ' + s.level + ' · ' + def.emoji + ' ' + def.name;
    },

    updateIslandBtn() {
      const G = BI.Game;
      if (!G.island) return;
      const pct = Math.round(BI.Progression.islandProgress(G.island.id).pct * 100);
      $('island-ring').style.setProperty('--p', pct);
      $('island-pct').textContent = pct + '%';
      const n = G.island.expansions;
      $('expand-lbl').innerHTML = n >= BI.Island.MAX_EXPANSIONS ? 'MAX' : '🪙' + fmt(BI.Island.EXPANSION_COSTS[n]);
    },

    renderQuests() {
      const q = BI.state.quests;
      $('quest-list').innerHTML = q.active.map((x) => {
        const p = BI.Quests.progress(x);
        const done = p >= x.target;
        return '<div class="quest' + (done ? ' done' : '') + '"><div class="quest-row">' + ico(x.icon) +
          '<span class="quest-name">' + x.text + '</span><span class="quest-num">' + (done ? '✓' : p + ' / ' + x.target) + '</span></div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + (p / x.target) * 100 + '%"></div></div></div>';
      }).join('');
    },

    setCollect(node) {
      if (node === collectShown) return;
      collectShown = node;
      const btn = $('btn-collect');
      if (!node) { btn.classList.remove('show'); return; }
      const T = BI.Resources.TYPES[node.type];
      $('collect-ico').innerHTML = ico(T.res);
      $('collect-amt').textContent = '+' + T.amount;
      btn.classList.add('show');
    },

    toast(msg, kind) {
      const box = $('toasts');
      while (box.children.length > 2) box.removeChild(box.firstChild);
      const el = document.createElement('div');
      el.className = 'toast' + (kind ? ' ' + kind : '');
      el.innerHTML = msg;
      box.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    },

    /** Animate item icons from a screen point to its HUD counter (or the bag). */
    fly(res, sx, sy, count) {
      if (['GAMEPLAY', 'BUILD_MODE'].indexOf(BI.Game.state) < 0) return;
      const target = $('pill-' + res) || $('btn-bag');
      if (!target) return;
      const tr = target.getBoundingClientRect();
      if (!tr.width) return;
      const tx = tr.left + tr.height * 0.6, ty = tr.top + tr.height / 2;
      const layer = $('fly-layer');
      const n = Math.min(count || 4, 7);
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = 'fly';
        el.innerHTML = ico(res);
        const ox = sx + (Math.random() - 0.5) * 50, oy = sy + (Math.random() - 0.5) * 30;
        el.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(0.4)';
        el.style.opacity = '0';
        layer.appendChild(el);
        setTimeout(() => {
          el.style.transition = 'transform .18s ease-out, opacity .18s';
          el.style.transform = 'translate(' + ox + 'px,' + (oy - 20) + 'px) scale(1.15)';
          el.style.opacity = '1';
          setTimeout(() => {
            el.style.transition = 'transform .5s cubic-bezier(.5,-0.3,.7,.9), opacity .5s';
            el.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(0.6)';
            setTimeout(() => {
              el.remove();
              target.classList.remove('pulse');
              void target.offsetWidth;
              target.classList.add('pulse');
              if (i === n - 1 && res === 'coins') BI.Audio.playCoin();
            }, 480);
          }, 200);
        }, i * 55);
      }
    },

    // ---------------- popups ----------------
    queuePopup(p) { popupQueue.push(p); },
    hasPopup() { return !!popupOpen || popupQueue.length > 0; },

    tryShowPopup() {
      if (popupOpen || !popupQueue.length) return;
      const p = popupQueue.shift();
      popupOpen = p;
      const icon = $('popup-icon');
      icon.className = 'popup-icon';
      let title = '', text = '', btn = 'CLAIM', state = 'REWARD', rewards = {};
      if (p.kind === 'quest') {
        icon.textContent = '✓';
        title = 'QUEST COMPLETE!';
        text = p.quest.text;
        rewards = { coins: p.quest.coins, xp: p.quest.xp };
        state = 'QUEST_COMPLETE';
        BI.Audio.playReward();
      } else if (p.kind === 'level') {
        icon.className = 'popup-icon gold';
        icon.textContent = p.level;
        title = 'LEVEL UP!';
        text = 'You reached level ' + p.level + '!';
        if (p.unlocked && p.unlocked.length) text += '<br>New blueprints: <b>' + p.unlocked.map((id) => BI.Buildings.DEFS[id].name).join(', ') + '</b>';
        rewards = { coins: p.coins };
        btn = 'AWESOME!';
        BI.Audio.playLevelUp();
      } else if (p.kind === 'island_complete') {
        icon.className = 'popup-icon gold';
        icon.textContent = p.island.emoji;
        title = 'ISLAND COMPLETED!';
        text = p.island.name + ' is finished. Amazing work!';
        rewards = p.rewards;
        btn = 'CONTINUE';
        state = 'ISLAND_COMPLETE';
        BI.Audio.playLevelUp();
      } else if (p.kind === 'island_unlock') {
        icon.className = 'popup-icon gold';
        icon.textContent = p.island.emoji;
        title = 'NEW ISLAND!';
        text = p.island.name + ' is unlocked.<br>New resources there: ' + p.island.finds.map((k) => ico(k)).join(' ');
        btn = 'OK';
        BI.Audio.playLevelUp();
      } else if (p.kind === 'expand') {
        icon.innerHTML = ico('expand');
        title = 'ISLAND EXPANDED!';
        text = 'New size: ' + p.size + ' × ' + p.size + '<br>Fresh land with new resources!';
        rewards = p.rewards;
        btn = 'GREAT!';
        BI.Audio.playReward();
      }
      $('popup-title').textContent = title;
      $('popup-text').innerHTML = text;
      $('popup-rewards').innerHTML = Object.keys(rewards).filter((k) => rewards[k]).map((k, i) =>
        '<span class="reward" style="animation-delay:' + (0.25 + i * 0.1) + 's">' + ico(k) + '+' + rewards[k] + '</span>').join('');
      $('popup-btn').textContent = btn;
      p.rewards = rewards;
      BI.Game.push(state);
    },

    closePopup() {
      const p = popupOpen;
      if (!p) return;
      popupOpen = null;
      BI.Game.pop();
      const r = $('popup-btn').getBoundingClientRect();
      Object.keys(p.rewards || {}).forEach((k) => {
        if (k !== 'xp' && p.rewards[k]) this.fly(k, r.left + r.width / 2, r.top, 6);
      });
    },

    // ---------------- confirm dialog ----------------
    confirm(title, text, yes, onYes) {
      $('confirm-title').textContent = title;
      $('confirm-text').innerHTML = text;
      $('confirm-yes').textContent = yes || 'YES';
      this._confirmYes = onYes;
      $('confirm').classList.add('active');
    },
    closeConfirm() {
      this._confirmYes = null;
      $('confirm').classList.remove('active');
    },

    // ---------------- build menu & blueprints ----------------
    buildCard(id, opts) {
      const def = BI.Buildings.DEFS[id];
      const unlocked = BI.Progression.isBlueprintUnlocked(id);
      const afford = BI.Game.canAfford(def.cost);
      let badge = '';
      if (def.produce) badge = '+' + def.produce.amount + ' ' + Items.name(def.produce.res).toLowerCase();
      else if (def.station) badge = 'makes ' + Object.keys(def.recipes.reduce((o, r) => Object.assign(o, r.out), {})).map((k) => Items.name(k).toLowerCase()).join(', ');
      let out = '<div class="card' + (unlocked ? '' : ' locked') + '" style="animation-delay:' + (opts.i * 0.03) + 's">';
      if (badge) out += '<span class="card-badge">' + badge + '</span>';
      out += '<div class="card-prev"><img src="' + BI.Buildings.preview(id) + '" alt=""></div>';
      out += '<div class="card-name">' + def.emoji + ' ' + def.name + '</div>';
      if (opts.desc) out += '<div class="card-desc">' + def.desc + '</div>';
      out += '<div class="card-cost">' + costHtml(def.cost, unlocked) + '</div>';
      if (!unlocked) out += '<div class="lock-tag">🔒 LOCKED<small>Reach Lv. ' + def.level + '</small></div>';
      else out += '<button class="btn btn-green btn-sm' + (afford ? '' : ' disabled') + '" data-action="build-select" data-type="' + id + '">BUILD</button>';
      return out + '</div>';
    },

    renderBuildMenu(cat) {
      buildCat = cat;
      document.querySelectorAll('#build-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === cat));
      const ids = BI.Buildings.ORDER.filter((id) => cat === 'all' || BI.Buildings.DEFS[id].cat === cat);
      $('build-cards').innerHTML = ids.map((id, i) => this.buildCard(id, { i })).join('');
      $('build-cards').scrollTop = 0;
    },

    renderBlueprints(cat) {
      bpCat = cat;
      document.querySelectorAll('#bp-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === cat));
      const ids = BI.Buildings.ORDER.filter((id) => BI.Buildings.DEFS[id].cat === cat);
      $('bp-cards').innerHTML = ids.map((id, i) => this.buildCard(id, { i, desc: true })).join('');
      $('bp-cards').scrollTop = 0;
    },

    updateBuildBar() {
      const G = BI.Game, b = G.build;
      if (!b) return;
      const def = BI.Buildings.DEFS[b.type];
      $('bm-img').src = BI.Buildings.preview(b.type);
      $('bm-name').textContent = def.name;
      $('bm-cost').innerHTML = costHtml(def.cost, true);
      const hint = $('bm-hint');
      hint.textContent = b.error ? '⚠ ' + b.error : 'Drag the building · tap it again to build';
      hint.classList.toggle('bad', !!b.error);
      $('btn-build-ok').classList.toggle('disabled', !!b.error);
    },

    // ---------------- crafting station ----------------
    renderStation() {
      const G = BI.Game, b = G.station;
      if (!b) return;
      const def = BI.Buildings.DEFS[b.type], C = BI.Crafting, now = Date.now();
      $('st-img').src = BI.Buildings.preview(b.type);
      $('st-name').textContent = def.emoji + ' ' + def.name;
      $('st-desc').textContent = def.desc;
      let html = '';
      if (C.hasOutput(b)) {
        html += '<div class="ready-box"><div class="ready-items">READY: ' + Object.keys(b.out).filter((k) => b.out[k] > 0).map((k) => ico(k) + '×' + b.out[k]).join(' ') +
          '</div><button class="btn btn-green btn-sm" data-action="station-collect">COLLECT</button></div>';
      }
      html += '<div class="sec-title">QUEUE (' + (b.jobs || []).length + ' / ' + C.slots(b) + ')</div>';
      const q = b.jobs || [];
      for (let i = 0; i < C.slots(b); i++) {
        const j = q[i];
        if (!j) { html += '<div class="slot empty">Empty slot — pick a recipe below</div>'; continue; }
        const r = C.recipe(b, j.r);
        const outKey = Object.keys(r.out)[0];
        const running = j.start <= now;
        html += '<div class="slot' + (running ? '' : ' waiting') + '">' + ico(outKey) + '<div class="s-main"><div class="s-title">' + Items.name(outKey) + ' ×' + r.out[outKey] * j.n + '</div>' +
          '<div class="bar"><div class="bar-fill green" id="st-bar-' + i + '" style="width:0%"></div></div></div><div class="s-time" id="st-time-' + i + '">' + (running ? '' : 'waiting') + '</div></div>';
      }
      html += '<div class="sec-title">RECIPES</div>';
      const full = C.queueFull(b);
      def.recipes.forEach((r, i) => {
        const max = C.maxCraftable(b, i, 5);
        const io = (obj, check) => Object.keys(obj).map((k) => {
          const short = check && BI.state.res[k] < obj[k];
          return '<span class="rc-io' + (short ? ' short' : '') + '">' + ico(k) + obj[k] + (check ? '<small>(' + fmt(BI.state.res[k]) + ')</small>' : '') + '</span>';
        }).join('');
        html += '<div class="panel recipe"><div class="rc-row">' + io(r.in, true) + '<span class="rc-arrow">➜</span>' + io(r.out, false) + '<span class="rc-time">⏱ ' + r.time + 's</span></div>' +
          '<div class="rc-btns"><button class="btn btn-sm' + (!full && max >= 1 ? '' : ' disabled') + '" data-action="craft" data-r="' + i + '" data-n="1">CRAFT ×1</button>' +
          '<button class="btn btn-green btn-sm' + (!full && max >= 5 ? '' : ' disabled') + '" data-action="craft" data-r="' + i + '" data-n="5">CRAFT ×5</button></div></div>';
      });
      $('station-body').innerHTML = html;
      this.refreshStation();
    },

    /** Cheap per-frame update of progress bars & timers. */
    refreshStation() {
      const b = BI.Game.station;
      if (!b || !b.jobs) return;
      const now = Date.now();
      b.jobs.forEach((j, i) => {
        const bar = $('st-bar-' + i), tm = $('st-time-' + i);
        if (!bar) return;
        const p = j.start > now ? 0 : Math.min(1, (now - j.start) / (j.end - j.start));
        bar.style.width = (p * 100).toFixed(1) + '%';
        if (j.start <= now) tm.textContent = secs(j.end - now);
      });
    },

    // ---------------- bag / inventory ----------------
    renderInventory() {
      const res = BI.state.res;
      const tile = (k) => {
        const it = Items.ITEMS[k], n = res[k] || 0;
        return '<div class="panel item' + (n ? '' : ' zero') + '">' + ico(k) + '<div class="it-amt">' + fmt(n) + '</div><div class="it-name">' + it.name + '</div>' +
          '<div class="it-price">' + ico('coins') + it.sell + ' each</div>' +
          '<div class="it-sell"><button class="btn btn-sm' + (n >= 1 ? '' : ' disabled') + '" data-action="sell" data-key="' + k + '" data-n="1">SELL 1</button>' +
          '<button class="btn btn-gold btn-sm' + (n >= 10 ? '' : ' disabled') + '" data-action="sell" data-key="' + k + '" data-n="10">×10</button></div></div>';
      };
      const raw = Items.ORDER.filter((k) => Items.ITEMS[k].kind === 'raw');
      const mat = Items.ORDER.filter((k) => Items.ITEMS[k].kind === 'mat');
      $('inv-body').innerHTML = '<div class="sec-title">RAW RESOURCES</div><div class="inv-grid">' + raw.map(tile).join('') + '</div>' +
        '<div class="sec-title">CRAFTED MATERIALS</div><div class="inv-grid">' + mat.map(tile).join('') + '</div>' +
        '<p class="inv-hint">Gather raw resources on islands, refine them at stations (Sawmill, Stone Workbench, Furnace…).<br>Crafted goods sell for much more!</p>';
    },

    // ---------------- islands ----------------
    islandThumb(id) {
      if (thumbs[id]) return thumbs[id];
      const def = BI.Progression.BY_ID[id];
      const theme = BI.Island.THEMES[def.theme];
      const W = 260, H = 180;
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const g = cv.getContext('2d');
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, theme.bg[1]);
      bg.addColorStop(1, theme.bg[0]);
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      const st = BI.Island.createIslandState(id);
      const cache = BI.Island.buildCache(st, theme, 0.5);
      const k = (W * 0.9) / cache.w;
      g.save();
      g.translate(W / 2, H * 0.12);
      g.scale(k, k);
      g.drawImage(cache.canvas, -cache.ox, -cache.oy, cache.w, cache.h);
      st.nodes.slice().sort((a, b) => a.gx + a.gy - b.gx - b.gy).forEach((n) => {
        const p = BI.Island.iso(n.gx + 0.5, n.gy + 0.5);
        BI.Resources.draw(g, n, p.x, p.y, def.theme, theme, 0, true, 1);
      });
      g.restore();
      thumbs[id] = cv.toDataURL('image/jpeg', 0.85);
      return thumbs[id];
    },

    renderIslands() {
      const s = BI.state, PR = BI.Progression;
      $('island-list').innerHTML = PR.ISLANDS.map((def, i) => {
        const unlocked = PR.isUnlocked(def.id);
        const current = s.currentIsland === def.id;
        const isl = s.islands[def.id];
        const theme = BI.Island.THEMES[def.theme];
        const finds = '<span class="finds">' + def.finds.map((k) => ico(k)).join('') + '</span>';
        let body;
        if (!unlocked) {
          const block = PR.unlockBlocker(def);
          const lvlOk = s.level >= def.unlock.level;
          body = '<span class="icard-sub">' + (lvlOk ? '✓' : '🔒') + ' Level ' + def.unlock.level + ' · ' + def.unlock.text + ':</span>' +
            '<span class="icard-cost">' + costHtml(def.unlock.cost, true) + '</span>' +
            (block ? '' : '<button class="btn btn-gold btn-sm" data-action="island-unlock" data-id="' + def.id + '">🔓 UNLOCK</button>');
        } else {
          const pct = Math.round(PR.islandProgress(def.id).pct * 100);
          body = '<span class="icard-sub">' + (current ? '✓ You are here' : isl && isl.completed ? '★ Completed' : isl ? 'Tap to travel' : 'New! Tap to explore') + ' · ' + pct + '%</span>' +
            '<span class="bar"><span class="bar-fill green" style="width:' + pct + '%"></span></span>';
        }
        return '<div class="icard' + (unlocked ? '' : ' locked') + (current ? ' current' : '') + '" style="animation-delay:' + i * 0.05 + 's;background:linear-gradient(135deg,' + theme.bg[0] + ',' + theme.bg[1] + ')"' +
          (unlocked ? ' data-action="island-go" data-id="' + def.id + '"' : '') + '>' +
          '<span class="icard-art"><img src="' + this.islandThumb(def.id) + '" alt=""></span>' +
          '<span class="icard-body"><span class="icard-name">' + def.emoji + ' ' + def.name + finds + '</span>' + body + '</span>' +
          '<span class="icard-status">' + (!unlocked ? '🔒' : current ? '✓' : isl && isl.completed ? '★' : '▶') + '</span></div>';
      }).join('');
    },

    renderProgress() {
      const G = BI.Game, PR = BI.Progression;
      const def = PR.BY_ID[G.island.id];
      const pr = PR.islandProgress(def.id);
      const pct = Math.round(pr.pct * 100);
      const n = G.island.expansions;
      const maxed = n >= BI.Island.MAX_EXPANSIONS;
      $('prog-title').textContent = def.emoji + ' ' + def.name.toUpperCase();
      let html = '<div class="panel" style="padding:.8rem"><div class="prog-pct"><span>ISLAND PROGRESS</span><b>' + pct + '%</b></div>' +
        '<div class="bar big"><div class="bar-fill green" style="width:' + pct + '%"></div></div></div>';
      html += pr.tasks.map((t) => '<div class="task' + (t.done ? ' done' : '') + '"><span class="chk">' + (t.done ? '✓' : '') + '</span><span>' + t.text + '</span><span class="tnum">' + t.cur + ' / ' + t.target + '</span></div>').join('');
      if (G.island.completed) html += '<div class="task done"><span class="chk">★</span><span>Island completed!</span></div>';
      html += '<div class="panel exp-box"><div class="exp-row"><span>Resources here</span><b>' + def.finds.map((k) => ico(k)).join(' ') + '</b></div>' +
        '<div class="exp-row"><span>Island size</span><b>' + G.island.size + ' × ' + G.island.size + '</b></div>' +
        '<div class="exp-row"><span>Expansions</span><b>' + n + ' / ' + BI.Island.MAX_EXPANSIONS + '</b></div>' +
        (maxed ? '<div class="exp-row"><span>Fully expanded!</span><b>✓</b></div>'
          : '<button class="btn btn-gold btn-wide" data-action="expand">⤢ EXPAND +2 · ' + ico('coins') + fmt(BI.Island.EXPANSION_COSTS[n]) + '</button>') + '</div>';
      html += '<button class="btn btn-wide" data-action="islands">🏝️ ALL ISLANDS</button>';
      $('prog-body').innerHTML = html;
    },

    // ---------------- shop & settings ----------------
    renderShop() {
      const trades = BI.Game.TRADES;
      let html = '<div class="shop-sec">FREE REWARDS</div>' +
        '<div class="panel shop-card featured"><div class="sc-ico">' + ico('coins') + '</div><div class="sc-info"><div class="sc-title">FREE COINS</div><div class="sc-sub">Watch an ad · +100 coins</div></div>' +
        '<button class="btn btn-green btn-sm" data-action="watch-ad" data-reward="coins">▶ WATCH AD</button></div>' +
        '<div class="panel shop-card"><div class="sc-ico">' + ico('crystal') + '</div><div class="sc-info"><div class="sc-title">FREE CRYSTALS</div><div class="sc-sub">Watch an ad · +5 crystals</div></div>' +
        '<button class="btn btn-green btn-sm" data-action="watch-ad" data-reward="crystal">▶ WATCH AD</button></div>';
      html += '<div class="shop-sec">MARKET · BUY</div>';
      html += Object.keys(trades).map((id) => {
        const t = trades[id];
        return '<div class="panel shop-card"><div class="sc-ico">' + ico(t.give) + '</div><div class="sc-info"><div class="sc-title">' + t.amount + ' ' + Items.name(t.give) + '</div><div class="sc-sub">Short on materials? Buy them here</div></div>' +
          '<button class="btn btn-sm' + (BI.state.res.coins >= t.price ? '' : ' disabled') + '" data-action="trade" data-id="' + id + '">' + ico('coins') + t.price + '</button></div>';
      }).join('');
      html += '<p class="set-note">Sell your goods from the 🎒 Bag.</p>';
      html += '<div class="shop-sec">COIN PACKS</div><div class="pack-grid">' +
        [[500, '$0.99', ''], [1000, '$1.99', 'POPULAR'], [2500, '$3.99', 'BEST VALUE']].map((p) =>
          '<div class="panel pack">' + (p[2] ? '<span class="ribbon">' + p[2] + '</span>' : '<span class="ribbon" style="visibility:hidden">-</span>') +
          '<span class="pk-ico">' + (p[0] >= 2500 ? '💰' : p[0] >= 1000 ? '🪙🪙' : '🪙') + '</span><span class="pk-amt">' + p[0] + '</span>' +
          '<button class="btn btn-gold" data-action="buy-pack">' + p[1] + '</button></div>').join('') + '</div>';
      html += '<p class="set-note">Coin packs are placeholders — no real payments in this prototype.</p>';
      $('shop-body').innerHTML = html;
    },

    renderSettings() {
      const st = BI.state.settings;
      $('tg-music').classList.toggle('on', !!st.music);
      $('tg-sfx').classList.toggle('on', !!st.sfx);
    },
  };

  BI.UI = UI;
})();
