/* UI: HUD, backpack/chest, crafting, building, map, loot, popups, toasts. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const $ = (id) => document.getElementById(id);
  const D = () => BI.Data;
  const icon = (id) => BI.Data.iconHtml(id);

  const popupQueue = [];
  let popupOpen = null;
  let selIdx = -1, selEquip = null;
  let craftTab = 'hands', buildCat = 'walls';
  let lastAction = '';
  const previews = {};

  function costHtml(cost) {
    const bag = BI.state.bag;
    return Object.keys(cost).map((k) => {
      const have = BI.Inv.count(bag, k);
      return '<span class="cost' + (have < cost[k] ? ' short' : '') + '">' + icon(k) + '<b>' + have + '/' + cost[k] + '</b></span>';
    }).join('');
  }
  function itemDesc(id) {
    const it = D().ITEMS[id];
    const p = [];
    if (it.food) p.push('+' + it.food + ' 🍖');
    if (it.water) p.push('+' + it.water + ' 💧');
    if (it.hp) p.push((it.hp > 0 ? '+' : '') + it.hp + ' ❤️');
    if (it.type === 'tool') p.push((it.tool === 'axe' ? 'Chops trees' : 'Mines rock & ore') + ' · power ' + it.power);
    if (it.type === 'weapon') p.push('Damage ' + it.dmg + ' · ' + (it.ammo ? 'ranged (uses ammo)' : 'melee'));
    if (it.type === 'armor') p.push('Blocks ' + Math.round(it.armor * 100) + '% damage');
    if (it.type === 'res') p.push('Crafting material');
    if (it.type === 'ammo') p.push('For pistol & rifle');
    return p.join(' · ');
  }
  function slotHtml(x, action, i, selected) {
    if (!x) return '<button class="slot empty" data-action="' + action + '" data-i="' + i + '"></button>';
    const it = D().ITEMS[x.id];
    let extra = '';
    if (x.n > 1) extra += '<span class="cnt">' + x.n + '</span>';
    if (x.dur != null) extra += '<span class="dur"><i style="width:' + Math.max(4, (x.dur / it.dur) * 100) + '%;background:' + (x.dur / it.dur > 0.3 ? '#7cd957' : '#ff5a4a') + '"></i></span>';
    return '<button class="slot' + (selected ? ' sel' : '') + '" data-action="' + action + '" data-i="' + i + '">' + icon(x.id) + extra + '</button>';
  }

  const UI = {
    init() {
      $('ui').addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if (!el || el.closest('.confirm') || el.id === 'btn-action') return;
        if (performance.now() - (BI.Input.lastTap || 0) < 450) return; // ghost click after a canvas tap
        BI.Audio.playClick();
        this.handle(el.dataset.action, el);
      });
      $('confirm-no').addEventListener('click', () => this.closeConfirm());
      $('confirm-yes').addEventListener('click', () => { const f = this._yes; this.closeConfirm(); if (f) f(); });
      BI.AdManager.init();
    },

    handle(a, el) {
      const G = BI.Game;
      switch (a) {
        case 'play': G.startGameplay(); break;
        case 'home': G.goMenu(); break;
        case 'back': G.pop(); break;
        case 'settings': this.renderSettings(); G.push('SETTINGS'); break;
        case 'shop': G.push('SHOP'); break;
        case 'inventory': G.chestOpen = null; selIdx = -1; selEquip = null; this.renderInventory(); G.push('INVENTORY'); break;
        case 'craft': this.openCraft(null); break;
        case 'craft-tab': craftTab = el.dataset.tab; this.renderCraft(); break;
        case 'do-craft': G.craft(el.dataset.id); this.renderCraft(); break;
        case 'build-menu': if (!G.atBase) { this.toast('Build only at your shelter'); break; } this.renderBuildMenu(buildCat); G.push('BUILD_MENU'); break;
        case 'build-tab': this.renderBuildMenu(el.dataset.cat); break;
        case 'build-select': G.selectBuild(el.dataset.type); break;
        case 'demolish': G.startDemolish(); break;
        case 'build-cancel': G.cancelBuild(); break;
        case 'build-rotate': G.rotateBuild(); break;
        case 'build-confirm': G.confirmBuild(); break;
        case 'map': if (!G.atBase) { this.toast('Find the 🚐 exit to get back to your shelter'); break; } this.renderMap(); G.push('MAP'); break;
        case 'travel': G.travel(el.dataset.id); break;
        case 'take': G.takeLoot(+el.dataset.i); break;
        case 'take-all': G.takeLoot(null); break;
        case 'slot':
          if (G.chestOpen) { G.chestMove(false, +el.dataset.i); this.renderInventory(); break; }
          selIdx = selIdx === +el.dataset.i ? -1 : +el.dataset.i; selEquip = null; this.renderInventory(); break;
        case 'chest-slot': G.chestMove(true, +el.dataset.i); this.renderInventory(); break;
        case 'store-all': G.storeAll(); this.renderInventory(); break;
        case 'equip-slot': selEquip = el.dataset.key; selIdx = -1; this.renderInventory(); break;
        case 'use': G.useItem(selIdx); if (!BI.state.bag[selIdx]) selIdx = -1; this.renderInventory(); break;
        case 'drop': G.dropItem(selIdx); selIdx = -1; this.renderInventory(); break;
        case 'unequip': G.unequip(selEquip); selEquip = null; this.renderInventory(); break;
        case 'quick': G.quickUse(el.dataset.kind); break;
        case 'quests-toggle': $('quest-panel').classList.toggle('collapsed'); break;
        case 'watch-ad': G.watchAd(); break;
        case 'buy-pack': this.toast('💳 Purchases are disabled in this prototype'); break;
        case 'toggle-music': G.setSetting('music', !BI.state.settings.music); this.renderSettings(); break;
        case 'toggle-sfx': G.setSetting('sfx', !BI.state.settings.sfx); this.renderSettings(); break;
        case 'save-now': this.toast(BI.Save.saveGame() ? '💾 Saved' : 'Could not save', 'good'); break;
        case 'reset': this.confirm('Reset progress?', 'Your shelter, items and level will be deleted.', 'RESET', () => G.reset()); break;
        case 'respawn': G.respawn(); break;
        case 'popup-ok': this.closePopup(); break;
        default: break;
      }
    },

    sync(stack) {
      document.querySelectorAll('.screen[data-state]').forEach((el) => {
        el.classList.toggle('active', el.dataset.state.split(' ').some((s) => stack.indexOf(s) >= 0));
      });
      document.body.dataset.base = stack[0];
      document.body.dataset.top = stack[stack.length - 1];
    },

    setLocation(loc) {
      $('loc-chip').textContent = loc.emoji + ' ' + loc.name;
      document.body.dataset.loc = loc.id === 'base' ? 'base' : 'away';
    },

    updateAll() {
      this.updateBars();
      this.updateXP();
      this.renderQuests();
    },

    updateBars() {
      const P = BI.state.player;
      [['hp', P.hp], ['food', P.food], ['water', P.water]].forEach((b) => {
        $('bar-' + b[0]).style.width = Math.max(0, b[1]) + '%';
        $('val-' + b[0]).textContent = Math.max(0, Math.ceil(b[1]));
        $('bar-' + b[0]).parentNode.parentNode.classList.toggle('low', b[1] < 25);
      });
      const dt = BI.state.dayTime;
      const hours = Math.floor(dt * 24), mins = Math.floor((dt * 24 - hours) * 60 / 10) * 10;
      $('clock').textContent = (BI.Game.night ? '🌙 ' : '☀️ ') + String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
      const w = BI.state.equip.weapon;
      let wc = w ? icon(w.id) : '<i class="ico emo">✊</i>';
      if (w && D().ITEMS[w.id].ammo) wc += '<b>' + BI.Inv.count(BI.state.bag, 'ammo') + '</b>';
      else if (w) wc += '<span class="dur"><i style="width:' + (w.dur / D().ITEMS[w.id].dur) * 100 + '%"></i></span>';
      if ($('weapon-chip').innerHTML !== wc) $('weapon-chip').innerHTML = wc;
      $('menu-level').textContent = 'Lv. ' + BI.state.level;
    },

    updateXP() {
      const s = BI.state;
      document.querySelectorAll('[data-bind="level"]').forEach((el) => { el.textContent = s.level; });
      $('hud-xp').style.width = Math.min(100, (s.xp / BI.Quests.xpToNext(s.level)) * 100) + '%';
    },

    renderQuests() {
      $('quest-list').innerHTML = BI.state.quests.active.map((x, qi) => {
        const p = BI.Quests.progress(x);
        return '<div class="quest" title="' + (x.hint || '') + '"><div class="quest-row"><span class="quest-name">' + x.text + '</span><span class="quest-num">' + p + '/' + x.target + '</span></div>' +
          '<div class="bar"><div class="bar-fill" style="width:' + (p / x.target) * 100 + '%"></div></div>' + (x.hint && qi === 0 && p < x.target ? '<div class="quest-hint">' + x.hint + '</div>' : '') + '</div>';
      }).join('');
    },

    setAction(tg) {
      let ico = '✊', lbl = 'ATTACK', cls = '';
      const W = BI.Game.weapon();
      if (W.ammo) { ico = '🎯'; lbl = 'SHOOT'; } else if (W !== D().FISTS) { ico = '⚔️'; }
      if (tg) {
        if (tg.kind === 'zombie') { cls = 'danger'; }
        else if (tg.kind === 'node') {
          const t = D().NODES[tg.o.type];
          if (t.tool === 'axe') { ico = '🪓'; lbl = 'CHOP'; } else if (t.tool === 'pick') { ico = '⛏️'; lbl = 'MINE'; } else if (t.pickup) { ico = '✋'; lbl = 'PICK UP'; } else { ico = '🌿'; lbl = 'GATHER'; }
          if (!tg.ok) cls = 'blocked';
        } else if (tg.kind === 'cont') { ico = '🔍'; lbl = tg.o.looted ? 'OPEN' : 'SEARCH'; }
        else if (tg.kind === 'well') { ico = '🪣'; lbl = 'WATER'; }
        else if (tg.kind === 'exit') { ico = '🏕️'; lbl = 'GO HOME'; cls = 'go'; }
        else if (tg.kind === 'build') {
          const def = D().BUILD[tg.o.type];
          if (def.storage) { ico = '🗄️'; lbl = 'STORAGE'; } else if (def.produce) { ico = '🧺'; lbl = 'COLLECT'; } else { ico = '🛠️'; lbl = 'CRAFT'; }
        }
      }
      const key = ico + lbl + cls;
      if (key === lastAction) return;
      lastAction = key;
      $('act-ico').textContent = ico;
      $('act-lbl').textContent = lbl;
      $('btn-action').className = 'action-btn pe ' + cls;
    },

    setRaid(raid) {
      $('raid-banner').classList.toggle('show', !!raid);
      if (raid) $('raid-left').textContent = raid.left;
    },

    toast(msg, kind) {
      const box = $('toasts');
      while (box.children.length > 2) box.removeChild(box.firstChild);
      const el = document.createElement('div');
      el.className = 'toast' + (kind ? ' ' + kind : '');
      el.innerHTML = msg;
      box.appendChild(el);
      setTimeout(() => el.remove(), 2800);
    },

    // ---------------- popups ----------------
    queuePopup(p) { popupQueue.push(p); },
    tryShowPopup() {
      if (popupOpen || !popupQueue.length) return;
      const p = popupOpen = popupQueue.shift();
      const ic = $('popup-icon');
      let title, text, rewards = '', state = 'REWARD';
      if (p.kind === 'quest') {
        ic.className = 'popup-icon'; ic.textContent = '✓';
        title = 'TASK COMPLETE'; text = p.quest.text; state = 'QUEST_COMPLETE';
        rewards = '<span class="reward">⭐ +' + p.quest.xp + ' XP</span>' + Object.keys(p.quest.reward).map((k) => '<span class="reward">' + icon(k) + '+' + p.quest.reward[k] + '</span>').join('');
        BI.Audio.playReward();
      } else {
        ic.className = 'popup-icon gold'; ic.textContent = p.level;
        title = 'LEVEL UP!';
        text = 'You reached level ' + p.level + '. Health restored +30.' + (p.unlocked.length ? '<br><br><b>Unlocked:</b> ' + p.unlocked.join(', ') : '');
        BI.Audio.playLevelUp();
      }
      $('popup-title').textContent = title;
      $('popup-text').innerHTML = text;
      $('popup-rewards').innerHTML = rewards;
      BI.Game.push(state);
    },
    closePopup() { if (popupOpen) { popupOpen = null; BI.Game.pop(); } },
    showDeath(cause, lost) {
      const why = { zombies: 'You were overwhelmed by the undead.', starvation: 'You starved to death.', thirst: 'You died of thirst.', wounds: 'Your wounds were too severe.' }[cause] || '';
      $('death-text').innerHTML = why + '<br>Your backpack was lost (' + lost + ' stacks).<br>Equipped weapon & armor are kept.';
    },

    confirm(title, text, yes, fn) {
      $('confirm-title').textContent = title;
      $('confirm-text').innerHTML = text;
      $('confirm-yes').textContent = yes;
      this._yes = fn;
      $('confirm').classList.add('active');
    },
    closeConfirm() { this._yes = null; $('confirm').classList.remove('active'); },

    // ---------------- backpack / chest ----------------
    renderInventory() {
      const G = BI.Game, s = BI.state, bag = s.bag;
      let html = '';
      if (G.chestOpen) {
        $('inv-title').textContent = 'STORAGE';
        html += '<div class="sec-title">CHEST · tap to take</div><div class="slot-grid">' + G.chestOpen.items.map((x, i) => slotHtml(x, 'chest-slot', i)).join('') + '</div>';
        html += '<div class="sec-title row">BACKPACK · tap to store <button class="btn btn-sm btn-dark" data-action="store-all">STORE MATERIALS</button></div>';
        html += '<div class="slot-grid">' + bag.map((x, i) => slotHtml(x, 'slot', i)).join('') + '</div>';
        $('inv-body').innerHTML = html;
        return;
      }
      $('inv-title').textContent = 'BACKPACK';
      const eq = s.equip;
      const eqSlot = (key, label) => {
        const x = eq[key];
        return '<div class="eq"><div class="eq-lbl">' + label + '</div>' + (x ? slotHtml(x, 'equip-slot', 0, selEquip === key).replace('data-i="0"', 'data-key="' + key + '"') : '<button class="slot empty" data-action="equip-slot" data-key="' + key + '"><span class="ghost">' + (key === 'weapon' ? '⚔️' : '🦺') + '</span></button>') + '</div>';
      };
      const P = s.player;
      html += '<div class="eq-row">' + eqSlot('weapon', 'WEAPON') + eqSlot('armor', 'ARMOR') +
        '<div class="eq-stats"><div>❤️ ' + Math.ceil(P.hp) + '</div><div>🍖 ' + Math.ceil(P.food) + '</div><div>💧 ' + Math.ceil(P.water) + '</div></div></div>';
      // detail panel
      let det = '<div class="detail panel empty-det">Tap an item to see what it does.</div>';
      const x = selIdx >= 0 ? bag[selIdx] : selEquip ? eq[selEquip] : null;
      if (x) {
        const it = D().ITEMS[x.id];
        let btns = '';
        if (selEquip) btns = '<button class="btn btn-sm" data-action="unequip">UNEQUIP</button>';
        else {
          if (it.type === 'food') btns += '<button class="btn btn-green btn-sm" data-action="use">' + (it.water && !it.food ? 'DRINK' : 'EAT') + '</button>';
          if (it.type === 'med') btns += '<button class="btn btn-green btn-sm" data-action="use">HEAL</button>';
          if (it.type === 'weapon' || it.type === 'armor') btns += '<button class="btn btn-green btn-sm" data-action="use">EQUIP</button>';
          btns += '<button class="btn btn-dark btn-sm" data-action="drop">DROP</button>';
        }
        det = '<div class="detail panel">' + icon(x.id) + '<div class="det-info"><div class="det-name">' + it.name + (x.n > 1 ? ' ×' + x.n : '') + '</div><div class="det-desc">' + itemDesc(x.id) +
          (x.dur != null ? ' · durability ' + x.dur + '/' + it.dur : '') + '</div></div><div class="det-btns">' + btns + '</div></div>';
      }
      html += det;
      const used = bag.filter(Boolean).length;
      html += '<div class="sec-title">BACKPACK · ' + used + '/' + bag.length + '</div><div class="slot-grid">' + bag.map((x2, i) => slotHtml(x2, 'slot', i, i === selIdx)).join('') + '</div>';
      $('inv-body').innerHTML = html;
    },

    // ---------------- crafting ----------------
    openCraft(station) {
      if (station) craftTab = station;
      this.renderCraft();
      BI.Game.push('CRAFT');
    },
    renderCraft() {
      const G = BI.Game, s = BI.state;
      $('craft-tabs').innerHTML = Object.keys(D().STATIONS).map((k) => {
        const st = D().STATIONS[k];
        const avail = G.stationAvailable(k);
        return '<button class="tab' + (k === craftTab ? ' active' : '') + (avail ? '' : ' off') + '" data-action="craft-tab" data-tab="' + k + '">' + st.emoji + ' ' + st.name.toUpperCase() + '</button>';
      }).join('');
      const avail = G.stationAvailable(craftTab);
      let html = '';
      if (!avail) html += '<div class="note-bad">' + (G.atBase ? 'Build a ' + D().STATIONS[craftTab].name + ' at your shelter to use these recipes.' : 'Stations are at your shelter. Only hand crafting works out here.') + '</div>';
      html += D().RECIPES.filter((r) => r.station === craftTab).map((r) => {
        const outId = Object.keys(r.out)[0];
        const it = D().ITEMS[outId];
        const locked = s.level < r.level;
        const can = !locked && avail && BI.Inv.has(s.bag, r.in);
        return '<div class="panel recipe' + (locked ? ' locked' : '') + '"><div class="rc-out">' + icon(outId) + (r.out[outId] > 1 ? '<span class="cnt">' + r.out[outId] + '</span>' : '') + '</div>' +
          '<div class="rc-info"><div class="rc-name">' + it.name + '</div><div class="rc-desc">' + itemDesc(outId) + '</div><div class="rc-cost">' + (locked ? '🔒 Level ' + r.level : costHtml(r.in)) + '</div></div>' +
          '<button class="btn btn-green btn-sm' + (can ? '' : ' disabled') + '" data-action="do-craft" data-id="' + r.id + '">CRAFT</button></div>';
      }).join('');
      $('craft-list').innerHTML = html;
    },

    // ---------------- building ----------------
    buildPreview(type) {
      if (previews[type]) return previews[type];
      const cv = document.createElement('canvas');
      cv.width = cv.height = 120;
      const g = cv.getContext('2d');
      g.translate(60, 86);
      g.scale(1.2, 1.2);
      BI.Art.BUILD_ART[type](g, 0);
      previews[type] = cv.toDataURL();
      return previews[type];
    },
    renderBuildMenu(cat) {
      buildCat = cat;
      document.querySelectorAll('#build-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === cat));
      const s = BI.state;
      $('build-cards').innerHTML = D().BUILD_ORDER.filter((k) => D().BUILD[k].cat === cat).map((k) => {
        const def = D().BUILD[k];
        const locked = s.level < def.level;
        const can = !locked && BI.Inv.has(s.bag, def.cost);
        let info = def.hp ? '🛡️ ' + def.hp + ' HP' : def.station ? 'Crafting station' : def.storage ? def.storage + ' slots' : def.produce ? 'Makes ' + D().ITEMS[def.produce.item].name.toLowerCase() : '';
        return '<div class="card' + (locked ? ' locked' : '') + '"><div class="card-prev"><img src="' + this.buildPreview(k) + '" alt=""></div><div class="card-name">' + def.name + '</div><div class="card-desc">' + info + '</div>' +
          '<div class="card-cost">' + (locked ? '🔒 Level ' + def.level : costHtml(def.cost)) + '</div>' +
          (locked ? '' : '<button class="btn btn-green btn-sm' + (can ? '' : ' disabled') + '" data-action="build-select" data-type="' + k + '">BUILD</button>') + '</div>';
      }).join('');
    },
    updateBuildBar() {
      const b = BI.Game.build;
      if (!b) return;
      if (b.demolish) {
        $('bm-img').src = '';
        $('bm-name').textContent = '🔨 Demolish';
        $('bm-cost').innerHTML = '<span class="cost">Refunds 50% of materials</span>';
      } else {
        const def = D().BUILD[b.type];
        $('bm-img').src = this.buildPreview(b.type);
        $('bm-name').textContent = def.name;
        $('bm-cost').innerHTML = costHtml(def.cost);
      }
      $('bm-hint').textContent = b.error ? '⚠ ' + b.error : b.demolish ? 'Tap a structure, then tap it again to remove' : 'Drag · tap the ghost again to place';
      $('bm-hint').classList.toggle('bad', !!b.error);
      $('btn-build-ok').classList.toggle('disabled', !!b.error);
    },

    // ---------------- map & loot ----------------
    renderMap() {
      const s = BI.state;
      $('map-list').innerHTML = D().LOCATIONS.filter((l) => l.id !== 'base').map((l) => {
        const locked = s.level < l.level;
        const danger = '💀'.repeat(l.danger) + '<span class="dim">' + '💀'.repeat(5 - l.danger) + '</span>';
        const finds = {};
        Object.keys(l.nodes).forEach((k) => Object.keys(D().NODES[k].drops).forEach((d) => { finds[d] = 1; }));
        Object.keys(l.containers).forEach((k) => D().LOOT[D().CONTAINERS[k].loot].slice(0, 3).forEach((r) => { finds[r[0]] = 1; }));
        return '<div class="panel loc' + (locked ? ' locked' : '') + '"><div class="loc-ico">' + l.emoji + '</div><div class="loc-info"><div class="loc-name">' + l.name + '</div>' +
          '<div class="loc-danger">' + danger + '</div><div class="loc-desc">' + l.desc + '</div><div class="loc-finds">' + Object.keys(finds).slice(0, 8).map(icon).join('') + '</div></div>' +
          (locked ? '<div class="loc-lock">🔒<br>Lv ' + l.level + '</div>' : '<button class="btn btn-green btn-sm" data-action="travel" data-id="' + l.id + '">GO</button>') + '</div>';
      }).join('') + '<p class="set-note">Each trip generates a fresh area. Reach the 🚐 to return home.</p>';
    },
    renderLoot(o) {
      const c = D().CONTAINERS[o.type];
      $('loot-title').textContent = c.name;
      $('loot-grid').innerHTML = o.items.map((x, i) => slotHtml(x, 'take', i)).join('');
    },

    renderSettings() {
      $('tg-music').classList.toggle('on', !!BI.state.settings.music);
      $('tg-sfx').classList.toggle('on', !!BI.state.settings.sfx);
    },
  };

  BI.UI = UI;
})();
