/* FALLSHIFT — DOM user interface: HUD, menus, power-up cards, death / pause screens. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;

  // ---------------------------------------------------------------- icons (inline SVG)
  const S = (body, fill) => '<svg viewBox="0 0 24 24" fill="' + (fill || 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  const ICONS = {
    pause: S('<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>'),
    play: S('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    flame: S('<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="currentColor" stroke="none"/>'),
    coin: S('<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill="#ffcc33" stroke="#ffe680"/><path d="M12 7l4.33 2.5v5L12 17l-4.33-2.5v-5z" fill="#fff1a8" stroke="none"/>'),
    crystal: S('<path d="M12 2l7 7-7 13-7-13z" fill="#a66bff" stroke="#e2c8ff"/><path d="M12 2l7 7h-7z" fill="#f0e2ff" stroke="none"/>'),
    bolt: S('<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>'),
    dash: S('<path d="M5 5l7 7-7 7M12 5l7 7-7 7" stroke-width="3"/>'),
    gravity: S('<ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-25 12 12)"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 2v3M12 19v3"/>'),
    burst: S('<path d="M12 1l2.2 7.2L21 5l-3.6 6.6L23 12l-5.6.4L21 19l-6.8-3.2L12 23l-2.2-7.2L3 19l3.6-6.6L1 12l5.6-.4L3 5l6.8 3.2z" fill="currentColor" stroke="none"/>'),
    phase: S('<ellipse cx="12" cy="12" rx="10" ry="6"/><ellipse cx="12" cy="12" rx="6" ry="3.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
    magnet: S('<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h3M15 7h3" stroke-width="3"/>'),
    cell: S('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M10 2h4"/><path d="M13 8l-3 5h4l-3 5" />'),
    combo: S('<path d="M5 5l14 14M19 5L5 19"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/>'),
    wave: S('<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>'),
    clover: S('<circle cx="8.5" cy="8.5" r="3.5"/><circle cx="15.5" cy="8.5" r="3.5"/><circle cx="8.5" cy="15.5" r="3.5"/><circle cx="15.5" cy="15.5" r="3.5"/>'),
    x: S('<path d="M6 6l12 12M18 6L6 18" stroke-width="3"/><path d="M20 15v6M17 18h6" stroke-width="1.6"/>'),
    shield: S('<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>'),
    up: S('<path d="M12 20V5M5 11l7-7 7 7"/><path d="M5 20h14"/>'),
    core: S('<circle cx="12" cy="12" r="4.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>'),
    target: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
    gear: S('<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="7"/>'),
    back: S('<path d="M15 4l-8 8 8 8" stroke-width="3"/>'),
    sound: S('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>'),
    mute: S('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>'),
    music: S('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/>'),
    lock: S('<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    tower: S('<path d="M9 22V8l3-6 3 6v14M6 22h12M9 12h6M9 16h6"/>'),
    skull: S('<path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8z" fill="currentColor" stroke="none"/><circle cx="9" cy="11" r="2" fill="#120818" stroke="none"/><circle cx="15" cy="11" r="2" fill="#120818" stroke="none"/>'),
    check: S('<path d="M5 12l5 5 9-10" stroke-width="3"/>'),
  };

  const $ = (id) => document.getElementById(id);
  const RING_C = 2 * Math.PI * 44;

  const UI = {
    game: null,
    cache: {},
    current: 'menu',
    toastTimer: 0,
    trackGroup: -1,
    powersVer: -1,
    shieldKey: '',

    icon(name) {
      return ICONS[name] || '';
    },

    init(game) {
      this.game = game;
      document.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = ICONS[el.dataset.icon] || ''));
      const click = (el, fn) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          FS.Audio.unlock();
          FS.Audio.play('click');
          fn(e);
        });
      };

      click($('btn-play'), () => game.startRun());
      document.querySelectorAll('[data-go]').forEach((b) => click(b, () => this.showScreen(b.dataset.go)));
      document.querySelectorAll('[data-back]').forEach((b) => click(b, () => this.showMenu()));
      click($('menu-mute'), () => {
        const d = FS.Storage.data;
        const on = !(d.sound || d.music);
        this.setSound(on);
        this.setMusic(on);
      });

      click($('btn-pause'), () => game.pause());
      click($('btn-resume'), () => game.resume());
      click($('btn-restart-p'), () => game.startRun());
      click($('btn-menu-p'), () => game.toMenu());
      click($('pause-sound'), () => this.setSound(!FS.Storage.data.sound));
      click($('pause-music'), () => this.setMusic(!FS.Storage.data.music));

      click($('btn-restart'), () => game.startRun());
      click($('btn-menu'), () => game.toMenu());
      click($('btn-revive'), () => game.requestRevive());

      // abilities fire on pointerdown for zero latency
      document.querySelectorAll('.ability').forEach((b) => {
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          FS.Audio.unlock();
          game.abilities.use(b.dataset.ab);
        });
        b.addEventListener('click', (e) => e.stopPropagation());
      });

      $('power-slots').addEventListener('pointerdown', (e) => {
        const slot = e.target.closest('.pslot');
        if (!slot || !slot.dataset.id) return;
        e.stopPropagation();
        const def = FS.Upgrades.getPower(slot.dataset.id);
        if (def) this.toast(def.name + ' — ' + def.desc, 2.6);
      });

      // settings
      document.querySelectorAll('[data-set]').forEach((b) =>
        click(b, () => {
          const k = b.dataset.set;
          const d = FS.Storage.data;
          if (k === 'sound') this.setSound(!d.sound);
          else if (k === 'music') this.setMusic(!d.music);
          else if (k === 'shake') {
            d.settings.shake = !d.settings.shake;
            game.fx.shakeOn = d.settings.shake;
          } else if (k === 'hq') {
            d.settings.hq = !d.settings.hq;
            game.applyQuality();
          }
          FS.Storage.save();
          this.refreshSettings();
        })
      );
      const sens = $('sens');
      sens.addEventListener('input', () => {
        FS.Storage.data.settings.sensitivity = parseFloat(sens.value);
        $('sens-val').textContent = parseFloat(sens.value).toFixed(1);
      });
      sens.addEventListener('change', () => FS.Storage.save());
      sens.addEventListener('pointerdown', (e) => e.stopPropagation());
      click($('btn-reset'), () => this.confirm('RESET ALL PROGRESS?', () => {
        FS.Storage.reset();
        game.onReset();
        this.showMenu();
        this.toast('Progress reset');
      }));
      click($('confirm-no'), () => this.hide('confirm'));

      // stop clicks on overlays from reaching the canvas
      document.querySelectorAll('.screen').forEach((s) => s.addEventListener('pointerdown', (e) => e.stopPropagation()));
      this.refreshSettings();
    },

    // ---------------------------------------------------------------- screens
    showScreen(name) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
      const el = $('screen-' + name);
      if (el) {
        el.classList.remove('hidden');
        el.classList.remove('anim-in');
        void el.offsetWidth;
        el.classList.add('anim-in');
      }
      this.current = name;
      if (name === 'upgrades') this.renderUpgrades();
      else if (name === 'skins') this.renderSkins();
      else if (name === 'missions') this.renderMissions();
      else if (name === 'settings') this.refreshSettings();
      this.refreshCurrency();
    },
    hide(name) {
      const el = name === 'confirm' ? $('confirm') : $('screen-' + name);
      if (el) el.classList.add('hidden');
    },
    showMenu() {
      this.showHUD(false);
      this.showScreen('menu');
      this.refreshMenu();
    },
    showHUD(on) {
      $('hud').classList.toggle('hidden', !on);
      if (on) {
        this.cache = {};
        this.trackGroup = -1;
        this.powersVer = -1;
        this.shieldKey = '';
      }
    },
    hideAll() {
      document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
      this.current = '';
    },

    confirm(text, yes) {
      $('confirm-text').textContent = text;
      const el = $('confirm');
      el.classList.remove('hidden');
      const btn = $('confirm-yes');
      const nb = btn.cloneNode(true);
      btn.parentNode.replaceChild(nb, btn);
      nb.addEventListener('click', (e) => {
        e.stopPropagation();
        el.classList.add('hidden');
        yes();
      });
    },

    setSound(on) {
      FS.Storage.data.sound = on;
      FS.Audio.setSfx(on);
      FS.Storage.save();
      this.refreshSettings();
    },
    setMusic(on) {
      FS.Storage.data.music = on;
      FS.Audio.setMusic(on);
      FS.Storage.save();
      this.refreshSettings();
    },

    refreshSettings() {
      const d = FS.Storage.data;
      const map = { sound: d.sound, music: d.music, shake: d.settings.shake, hq: d.settings.hq };
      document.querySelectorAll('[data-set]').forEach((b) => b.classList.toggle('on', !!map[b.dataset.set]));
      $('sens').value = d.settings.sensitivity;
      $('sens-val').textContent = Number(d.settings.sensitivity).toFixed(1);
      $('pause-sound').innerHTML = d.sound ? ICONS.sound : ICONS.mute;
      $('pause-sound').classList.toggle('off', !d.sound);
      $('pause-music').classList.toggle('off', !d.music);
      $('menu-mute').innerHTML = d.sound || d.music ? ICONS.sound : ICONS.mute;
    },

    refreshCurrency() {
      const d = FS.Storage.data;
      document.querySelectorAll('.v-coins').forEach((e) => (e.textContent = U.fmt(d.coins)));
      document.querySelectorAll('.v-crystals').forEach((e) => (e.textContent = U.fmt(d.crystals)));
    },

    refreshMenu() {
      const d = FS.Storage.data;
      $('menu-best').textContent = Math.floor(d.bestDepth) + 'm';
      $('menu-coins').textContent = U.fmt(d.coins);
      $('menu-crystals').textContent = U.fmt(d.crystals);
      $('menu-foot').textContent = 'WORLDS UNLOCKED ' + Math.min(5, d.unlockedWorlds) + '/5' + (d.bestScore ? '  ·  BEST SCORE ' + U.fmt(d.bestScore) : '');
      const ready = FS.Upgrades.missionsReady(d);
      const b = $('missions-badge');
      b.classList.toggle('hidden', !ready);
      b.textContent = ready;
      this.refreshSettings();
    },

    // ---------------------------------------------------------------- upgrades / skins / missions
    renderUpgrades() {
      const d = FS.Storage.data;
      const list = $('upgrades-list');
      list.innerHTML = '';
      for (const def of FS.Upgrades.PERM) {
        const lvl = d.permanentUpgrades[def.id];
        const max = lvl >= def.max;
        const cost = FS.Upgrades.permCost(def, lvl);
        const afford = !max && d.coins >= cost.coins && d.crystals >= cost.crystals;
        const card = document.createElement('div');
        card.className = 'up-card glass';
        let pips = '';
        for (let i = 0; i < def.max; i++) pips += '<i class="' + (i < lvl ? 'on' : '') + '"></i>';
        card.innerHTML =
          '<div class="up-icon">' + ICONS[def.icon] + '</div>' +
          '<div class="up-info"><div class="up-name">' + def.name + '</div><div class="up-desc">' + def.desc(lvl) + '</div><div class="pips">' + pips + '</div></div>' +
          '<button class="up-buy ' + (max ? 'max' : afford ? '' : 'cant') + '">' +
          (max ? 'MAX' : '<span class="cur-ic coin">' + ICONS.coin + '</span>' + U.fmt(cost.coins) + (cost.crystals ? '<span class="cur-ic crystal">' + ICONS.crystal + '</span>' + cost.crystals : '')) +
          '</button>';
        card.querySelector('.up-buy').addEventListener('click', (e) => {
          e.stopPropagation();
          FS.Audio.unlock();
          if (FS.Upgrades.buyPerm(d, def.id)) {
            FS.Storage.save();
            FS.Audio.play('upgrade');
            this.renderUpgrades();
            this.refreshCurrency();
          } else {
            FS.Audio.play('deny');
            if (!max) this.toast('Not enough currency');
          }
        });
        list.appendChild(card);
      }
    },

    skinPreview(s) {
      if (s.glow === 'rainbow') return 'background: radial-gradient(circle at 40% 38%, #fff 0 18%, transparent 46%), conic-gradient(#ff3f6a,#ffcc33,#2bffa0,#3fe6ff,#a35dff,#ff3f6a)';
      return 'background: radial-gradient(circle at 40% 38%, #fff 0 15%, ' + s.core + ' 30%, ' + s.glow + ' 66%, #000 100%); box-shadow: 0 0 2.4rem ' + s.glow;
    },

    renderSkins() {
      const d = FS.Storage.data;
      const list = $('skins-list');
      list.innerHTML = '';
      for (const s of FS.Upgrades.SKINS) {
        const owned = d.unlockedSkins.indexOf(s.id) >= 0;
        const eq = d.skin === s.id;
        const card = document.createElement('div');
        card.className = 'skin-card glass' + (eq ? ' equipped' : '');
        let btn;
        if (eq) btn = 'EQUIPPED';
        else if (owned) btn = 'EQUIP';
        else if (s.crystals) btn = '<span class="cur-ic crystal">' + ICONS.crystal + '</span>' + s.crystals;
        else btn = '<span class="cur-ic coin">' + ICONS.coin + '</span>' + U.fmt(s.coins);
        card.innerHTML = '<div class="skin-prev" style="' + this.skinPreview(s) + '"></div><div class="skin-name">' + s.name + '</div><button class="skin-btn ' + (eq ? 'eq' : '') + '">' + btn + '</button>';
        card.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation();
          FS.Audio.unlock();
          if (eq) return;
          if (owned) {
            d.skin = s.id;
            FS.Audio.play('click');
          } else {
            const cc = s.coins || 0, cr = s.crystals || 0;
            if (d.coins >= cc && d.crystals >= cr) {
              d.coins -= cc;
              d.crystals -= cr;
              d.unlockedSkins.push(s.id);
              d.skin = s.id;
              FS.Audio.play('upgrade');
              this.toast(s.name + ' unlocked!');
            } else {
              FS.Audio.play('deny');
              this.toast('Not enough currency');
              return;
            }
          }
          FS.Storage.save();
          this.renderSkins();
          this.refreshCurrency();
        });
        list.appendChild(card);
      }
    },

    renderMissions() {
      const d = FS.Storage.data;
      const list = $('missions-list');
      list.innerHTML = '';
      for (const m of FS.Upgrades.MISSIONS) {
        const [c, t] = m.check(d);
        const claimed = d.missionsClaimed.indexOf(m.id) >= 0;
        const done = c >= t;
        const card = document.createElement('div');
        card.className = 'mis-card glass' + (claimed ? ' claimed' : done ? ' done' : '');
        const rw = m.reward.coins ? '<span class="cur-ic coin">' + ICONS.coin + '</span>' + m.reward.coins : '<span class="cur-ic crystal">' + ICONS.crystal + '</span>' + m.reward.crystals;
        card.innerHTML =
          '<div class="mis-info"><div class="mis-text">' + m.text + '</div><div class="mis-bar"><i style="width:' + Math.round((c / t) * 100) + '%"></i></div><div class="mis-prog">' + Math.floor(c) + ' / ' + t + '</div></div>' +
          '<button class="mis-btn">' + (claimed ? ICONS.check : done ? 'CLAIM<br>' + rw : rw) + '</button>';
        if (done && !claimed) {
          card.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            FS.Audio.unlock();
            d.missionsClaimed.push(m.id);
            d.coins += m.reward.coins || 0;
            d.crystals += m.reward.crystals || 0;
            FS.Storage.save();
            FS.Audio.play('crystal');
            this.renderMissions();
            this.refreshCurrency();
          });
        }
        list.appendChild(card);
      }
    },

    // ---------------------------------------------------------------- HUD
    set(id, val) {
      if (this.cache[id] === val) return;
      this.cache[id] = val;
      $(id).textContent = val;
    },

    updateHUD(g) {
      const p = g.player;
      const c = this.cache;
      this.set('hud-floor', 'FLOOR ' + g.floor);
      this.set('combo-text', 'COMBO x' + g.combo);
      this.set('hud-coins', U.fmt(FS.Storage.data.coins + g.runCoins));
      this.set('hud-crystals', U.fmt(FS.Storage.data.crystals + g.runCrystals));
      this.set('hud-score', U.fmt(g.score));
      const dep = '-' + Math.floor(g.depth);
      if (c.depth !== dep) {
        c.depth = dep;
        $('hud-depth').innerHTML = dep + '<small>m</small>';
      }
      const fever = g.fever > 0;
      const fill = fever ? g.fever / g.feverMax : g.feverCharge;
      const fk = Math.round(fill * 200);
      if (c.fill !== fk) {
        c.fill = fk;
        $('combo-fill').style.transform = 'scaleX(' + (fk / 200).toFixed(3) + ')';
      }
      if (c.fever !== fever) {
        c.fever = fever;
        $('hud').classList.toggle('fever', fever);
      }
      const ek = Math.round((p.energy / p.maxEnergy) * 200);
      if (c.energy !== ek) {
        c.energy = ek;
        $('energy-fill').style.transform = 'scaleY(' + (ek / 200).toFixed(3) + ')';
        $('hud').classList.toggle('low-energy', ek < 40);
      }
      // abilities
      for (const id of ['dash', 'gravity', 'break']) {
        const ab = g.abilities;
        const cd = ab.cd[id], max = ab.def[id].cd;
        const why = ab.blocker(id);
        let frac, label, cls;
        if (cd > 0) {
          frac = 1 - cd / max;
          label = cd.toFixed(1) + 's';
          cls = 'cooling';
        } else if (id === 'break' && p.breakCharge < 100) {
          frac = p.breakCharge / 100;
          label = Math.floor(p.breakCharge) + '%';
          cls = 'charging';
        } else {
          frac = 1;
          label = '';
          cls = why === 'energy' ? 'noenergy' : 'ready';
        }
        const key = id + Math.round(frac * 100) + label + cls;
        if (c['ab' + id] === key) continue;
        c['ab' + id] = key;
        const el = $('ab-' + id);
        el.querySelector('.ab-ring').style.strokeDashoffset = (RING_C * (1 - frac)).toFixed(1);
        el.querySelector('.ab-cd').textContent = label;
        el.querySelector('.ab-cost').textContent = '⚡' + ab.def[id].cost;
        el.classList.remove('cooling', 'charging', 'noenergy', 'ready');
        el.classList.add(cls);
      }
      // shields
      const sk = p.shield + '/' + p.maxShield + '/' + p.phase;
      if (this.shieldKey !== sk) {
        this.shieldKey = sk;
        let h = '';
        for (let i = 0; i < p.maxShield; i++) h += '<i class="' + (i < p.shield ? 'on' : '') + '">' + ICONS.shield + '</i>';
        for (let i = 0; i < p.phase; i++) h += '<i class="on phase">' + ICONS.phase + '</i>';
        $('shield-pips').innerHTML = h;
      }
      // power slots
      if (this.powersVer !== g.powersVer) {
        this.powersVer = g.powersVer;
        this.renderPowerSlots(g);
      }
      // floor track
      const grp = Math.floor((g.floor - 1) / 10);
      if (grp !== this.trackGroup) {
        this.trackGroup = grp;
        this.renderTrack(grp);
      }
      // boss bar
      const boss = g.boss && g.boss.state !== 'dead' ? g.boss : null;
      const bk = boss ? Math.round(boss.hpFrac * 100) : -1;
      if (c.boss !== bk) {
        c.boss = bk;
        $('boss-bar').classList.toggle('hidden', !boss);
        $('hud').classList.toggle('boss-on', !!boss);
        if (boss) {
          $('boss-fill').style.transform = 'scaleX(' + boss.hpFrac.toFixed(3) + ')';
          $('boss-name').textContent = boss.name + '  ' + boss.hp + '/' + boss.maxHp;
        }
      }
      if (this.toastTimer > 0) {
        this.toastTimer -= g.lastDt;
        if (this.toastTimer <= 0) $('toast').classList.remove('show');
      }
    },

    renderPowerSlots(g) {
      const box = $('power-slots');
      const order = g.powerOrder.slice(-3).reverse();
      let h = '';
      for (let i = 0; i < 3; i++) {
        const id = order[i];
        if (!id) {
          h += '<div class="pslot empty"><div class="pslot-c">' + ICONS.lock + '</div><div class="pslot-n">POWER</div></div>';
          continue;
        }
        const def = FS.Upgrades.getPower(id);
        const lv = g.powers[id];
        const frac = lv / def.max;
        h += '<div class="pslot r-' + def.rarity + '" data-id="' + id + '"><div class="pslot-c"><svg class="pslot-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="t"/><circle cx="50" cy="50" r="44" class="f" style="stroke-dashoffset:' + (RING_C * (1 - frac)).toFixed(1) + '"/></svg>' + ICONS[def.icon] + (lv > 1 ? '<b>' + lv + '</b>' : '') + '</div><div class="pslot-n">' + def.name + '</div></div>';
      }
      const extra = g.powerOrder.length - 3;
      box.innerHTML = h + (extra > 0 ? '<div class="pslot-more">+' + extra + '</div>' : '');
    },

    renderTrack(grp) {
      const start = Math.max(0, grp - 2);
      let h = '<div class="track-line"><i style="width:' + ((grp - start) / 4) * 100 + '%"></i></div>';
      for (let k = start; k < start + 5; k++) {
        const boss = ((k + 1) * 10) % 50 === 0;
        const st = k < grp ? 'done' : k === grp ? 'cur' : 'lock';
        const ic = st === 'lock' ? (boss ? 'skull' : 'lock') : boss ? 'skull' : 'tower';
        h += '<div class="tnode ' + st + (boss ? ' boss' : '') + '"><div class="tdot">' + ICONS[ic] + '</div><div class="tlabel">' + (k * 10 + 1) + '-' + (k * 10 + 10) + '</div></div>';
      }
      $('floor-track').innerHTML = h;
    },

    denyAbility(id, why) {
      const el = $('ab-' + id);
      el.classList.remove('deny');
      void el.offsetWidth;
      el.classList.add('deny');
      const msg = { energy: 'NOT ENOUGH ENERGY', charge: 'BREAK NOT CHARGED — FALL TO CHARGE', cooldown: '' }[why];
      if (msg) this.toast(msg, 1.1);
    },
    abilityUsed(id) {
      const el = $('ab-' + id);
      el.classList.remove('fired');
      void el.offsetWidth;
      el.classList.add('fired');
    },

    banner(title, sub, color, dur) {
      const b = $('banner');
      b.querySelector('.banner-title').textContent = title;
      b.querySelector('.banner-sub').textContent = sub || '';
      b.style.setProperty('--bc', color || '#3fe6ff');
      b.style.setProperty('--bd', (dur || 1.8) + 's');
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
    },

    toast(msg, dur) {
      const t = $('toast');
      t.textContent = msg;
      t.classList.add('show');
      this.toastTimer = dur || 1.6;
      if (!this.game || this.game.state !== 'playing') {
        clearTimeout(this._tt);
        this._tt = setTimeout(() => t.classList.remove('show'), (dur || 1.6) * 1000);
      }
    },

    // ---------------------------------------------------------------- overlays
    showPause(g) {
      this.showScreen('pause');
      const mod = g.modifier ? FS.MODIFIERS[g.modifier].name : 'NONE';
      $('pause-info').innerHTML =
        '<div><span>FLOOR</span><b>' + g.floor + '</b></div><div><span>DEPTH</span><b>' + Math.floor(g.depth) + 'm</b></div>' +
        '<div><span>WORLD</span><b>' + FS.WORLDS[g.world].name + '</b></div><div><span>MODIFIER</span><b>' + mod + '</b></div>';
    },

    showPowerups(choices, powers, onPick) {
      this.showScreen('powerup');
      const box = $('pu-cards');
      box.innerHTML = '';
      let armed = false;
      setTimeout(() => (armed = true), 380);
      choices.forEach((def, i) => {
        const lv = powers[def.id] || 0;
        const card = document.createElement('button');
        card.className = 'pu-card glass r-' + def.rarity;
        card.style.animationDelay = i * 0.08 + 's';
        card.innerHTML =
          '<div class="pu-rarity">' + def.rarity.toUpperCase() + '</div>' +
          '<div class="pu-icon">' + ICONS[def.icon] + '</div>' +
          '<div class="pu-text"><div class="pu-name">' + def.name + '</div><div class="pu-lv">' + (lv ? 'LV ' + lv + ' → ' + (lv + 1) : 'NEW') + '</div><div class="pu-desc">' + def.desc + '</div></div>';
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!armed) return;
          armed = false;
          FS.Audio.play('upgrade');
          onPick(def);
        });
        box.appendChild(card);
      });
    },

    showDeath(r) {
      this.showScreen('death');
      $('d-depth').textContent = Math.floor(r.depth) + 'm';
      $('d-score').textContent = U.fmt(r.score);
      $('d-best').textContent = Math.floor(r.best) + 'm';
      $('d-coins').textContent = '+' + U.fmt(r.coins);
      $('new-best').classList.toggle('hidden', !r.newBest);
      $('d-extra').innerHTML =
        (r.crystals ? '<span><span class="cur-ic crystal">' + ICONS.crystal + '</span>+' + r.crystals + '</span>' : '') +
        '<span>FLOOR <b>' + r.floor + '</b></span><span>MAX COMBO <b>x' + r.maxCombo + '</b></span>';
      $('btn-revive').classList.toggle('hidden', !r.canRevive);
    },

    showAd(seconds, done) {
      this.showScreen('ad');
      let n = seconds;
      $('ad-count').textContent = n;
      const iv = setInterval(() => {
        n--;
        $('ad-count').textContent = Math.max(0, n);
        if (n <= 0) {
          clearInterval(iv);
          done();
        }
      }, 1000);
    },
  };

  FS.UI = UI;
})();
