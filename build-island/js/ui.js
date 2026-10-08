/* UI: DOM screens, HUD, menus, popups, toasts and fly-to-HUD reward effects. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const $ = (id) => document.getElementById(id);

  const ICONS = {
    coins: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12.6" r="10" fill="#d98a00"/><circle cx="12" cy="11.4" r="10" fill="#ffcb2f"/><circle cx="12" cy="11.4" r="7.2" fill="#ffe27a"/><path d="M12 6.6l1.5 3.1 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.5-2.3 3.4-.4z" fill="#e59a00"/></svg>',
    crystal: '<svg viewBox="0 0 24 24"><path d="M12 1.5l7.5 7L12 22.5 4.5 8.5z" fill="#1aa7e0"/><path d="M12 1.5l7.5 7H12z" fill="#7fe9ff"/><path d="M12 1.5L4.5 8.5H12z" fill="#c4f6ff"/><path d="M4.5 8.5h7.5v14z" fill="#3fd0ff"/><path d="M19.5 8.5H12v14z" fill="#0b7fc0"/></svg>',
    wood: '<svg viewBox="0 0 24 24"><rect x="1.5" y="7" width="18" height="10.5" rx="4" fill="#a8622b"/><rect x="1.5" y="7" width="18" height="4" rx="2" fill="#c47a3c"/><ellipse cx="19" cy="12.25" rx="3.6" ry="5.25" fill="#f0c38e"/><ellipse cx="19" cy="12.25" rx="2" ry="3" fill="#d39a5c"/><ellipse cx="19" cy="12.25" rx=".8" ry="1.2" fill="#a8622b"/></svg>',
    stone: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#7c859a"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#d3d9e4"/><path d="M13.4 11.1l5.6-3.4 2.5 8.2-5 4.6z" fill="#5f6779"/><path d="M5.3 8.5l8.1 2.6-2.1 9.9H7.6l-5.1-4.5z" fill="#a3abbd"/></svg>',
    xp: '<svg viewBox="0 0 24 24"><path d="M12 1.8l3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.9 9.1l7-.9z" fill="#ffcb2f" stroke="#e08a00" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    house: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8z" fill="#ef5a4a"/><rect x="5" y="11" width="14" height="10" rx="1.5" fill="#e8b479"/><rect x="10" y="14" width="4" height="7" fill="#7a4520"/></svg>',
    build: '<svg viewBox="0 0 24 24"><rect x="10" y="9" width="3.4" height="13" rx="1.4" transform="rotate(-40 12 15)" fill="#a8622b"/><path d="M5 5.5l7-3.5 6 3-1.8 3.6-4.2-1.6-4.8 2.4z" fill="#a3abbd"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M12 2l10 5.5v9L12 22 2 16.5v-9z" fill="#4cd964"/><path d="M12 2l10 5.5L12 13 2 7.5z" fill="#8af07a"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  };
  const RES_NAMES = { coins: 'Coins', crystal: 'Crystals', wood: 'Wood', stone: 'Stone' };
  const ico = (name) => '<i class="ico">' + (ICONS[name] || '') + '</i>';
  const fmt = (n) => (n >= 100000 ? Math.floor(n / 1000) + 'k' : n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n)));

  function costHtml(cost, check) {
    const s = BI.state;
    return ['wood', 'stone', 'crystal', 'coins'].filter((k) => cost[k]).map((k) => {
      const short = check && s.res[k] < cost[k];
      return '<span class="cost' + (short ? ' short' : '') + '">' + ico(k) + cost[k] + '</span>';
    }).join('');
  }

  const popupQueue = [];
  let popupOpen = null;
  let buildCat = 'all', bpCat = 'house';
  let collectShown = null;
  const thumbs = {};

  const UI = {
    ICONS, ico, fmt,

    init() {
      document.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = ICONS[el.dataset.ico] || ''; });
      $('ui').addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el || el.closest('.confirm')) return;
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
        case 'expand': G.askExpand(); break;
        case 'island-progress': this.renderProgress(); G.push('ISLAND_PROGRESS'); break;
        case 'island-go': G.travelTo(el.dataset.id); break;
        case 'island-locked': {
          const def = BI.Progression.BY_ID[el.dataset.id];
          this.toast('🔒 ' + def.unlock.text + ' to unlock', 'bad');
          BI.Audio.playError();
          break;
        }
        case 'quests-toggle': $('quest-panel').classList.toggle('collapsed'); break;
        case 'watch-ad': G.watchAd(el.dataset.reward, el); break;
        case 'trade': G.trade(el.dataset.id, el); break;
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

    updateRes() {
      const r = BI.state.res;
      document.querySelectorAll('[data-res]').forEach((el) => {
        const v = fmt(r[el.dataset.res]);
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

    /** Animate resource icons from a screen point to the HUD counter. */
    fly(res, sx, sy, count) {
      const target = $('pill-' + res);
      if (!target || ['GAMEPLAY', 'BUILD_MODE'].indexOf(BI.Game.state) < 0) return;
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
        const delay = i * 55;
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
        }, delay);
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
        text = p.island.name + ' is now unlocked.<br>Visit it from the Island screen.';
        btn = 'OK';
        BI.Audio.playReward();
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
      let out = '<div class="card' + (unlocked ? '' : ' locked') + '" style="animation-delay:' + (opts.i * 0.03) + 's">';
      if (def.produce) out += '<span class="card-badge">+' + def.produce.amount + ' ' + RES_NAMES[def.produce.res].toLowerCase() + '</span>';
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
        let sub, pct, barCls = 'green';
        if (!unlocked) {
          const up = PR.unlockProgress(def);
          sub = '🔒 ' + def.unlock.text;
          pct = up.cur / up.target;
          barCls = 'gold';
        } else {
          pct = PR.islandProgress(def.id).pct;
          sub = current ? '✓ You are here' : isl && isl.completed ? '★ Completed' : isl ? 'Tap to travel' : 'New! Tap to explore';
        }
        return '<button class="icard' + (unlocked ? '' : ' locked') + (current ? ' current' : '') + '" style="animation-delay:' + i * 0.05 + 's;background:linear-gradient(135deg,' + theme.bg[0] + ',' + theme.bg[1] + ')" data-action="' + (unlocked ? 'island-go' : 'island-locked') + '" data-id="' + def.id + '">' +
          '<span class="icard-art"><img src="' + this.islandThumb(def.id) + '" alt=""></span>' +
          '<span class="icard-body"><span class="icard-name">' + def.emoji + ' ' + def.name + '</span>' +
          '<span class="icard-sub">' + sub + '</span>' +
          '<span class="bar"><span class="bar-fill ' + barCls + '" style="width:' + Math.round(pct * 100) + '%"></span></span></span>' +
          '<span class="icard-status">' + (!unlocked ? '🔒' : current ? '✓' : isl && isl.completed ? '★' : '▶') + '</span></button>';
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
      html += '<div class="panel exp-box"><div class="exp-row"><span>Island size</span><b>' + G.island.size + ' × ' + G.island.size + '</b></div>' +
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
      html += '<div class="shop-sec">MARKET</div>';
      html += Object.keys(trades).map((id) => {
        const t = trades[id];
        return '<div class="panel shop-card"><div class="sc-ico">' + ico(t.give) + '</div><div class="sc-info"><div class="sc-title">' + t.amount + ' ' + RES_NAMES[t.give] + '</div><div class="sc-sub">Trade coins for materials</div></div>' +
          '<button class="btn btn-sm' + (BI.state.res.coins >= t.price ? '' : ' disabled') + '" data-action="trade" data-id="' + id + '">' + ico('coins') + t.price + '</button></div>';
      }).join('');
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
