/* Tiny Kingdom — інтерфейс: панелі, модальні вікна, тости, банер подій. */
'use strict';

const UI = {
  panel: null, subView: null, placeType: null, refreshT: 0, needRefresh: false,
  el(id) { return document.getElementById(id); },
  modalBusy() { return this.el('modal').classList.contains('open'); },

  init() {
    this.el('nav').innerHTML = [
      ['build', '🏗️', 'Будувати'], ['citizens', '👥', 'Жителі'], ['research', '🔬', 'Наука'],
      ['map', '🗺️', 'Карта'], ['more', '📦', 'Більше'],
    ].map(([id, ic, nm]) => `<button class="navBtn" data-p="${id}"><span>${ic}</span>${nm}</button>`).join('');
    this.el('nav').addEventListener('click', e => {
      const b = e.target.closest('.navBtn'); if (!b) return;
      A.sfx('click');
      this.openPanel(b.dataset.p === this.panel ? null : b.dataset.p);
    });
    this.el('panelClose').addEventListener('click', () => { A.sfx('click'); this.openPanel(null); });
    this.el('settingsBtn').addEventListener('click', () => { A.sfx('click'); this.settings(); });
    this.el('eventBanner').addEventListener('click', () => this.openEvent());
    this.refreshTop();
    if (Game.offlineReport) this.offlineModal();
    else if (!Game.S.tutorial) this.tutorial();
  },

  /* ---------- верхня панель ---------- */
  refreshTop() {
    const S = Game.S, prod = Game.prodPerSec();
    prod.food -= Game.foodUpkeep();
    const cap = Game.storageCap();
    this.el('topRes').innerHTML = MAIN_RES.map(r => {
      const v = S.res[r];
      const full = RES_META[r].capped && v >= cap - 0.5;
      return `<div class="chip ${full ? 'full' : ''}" title="${RES_META[r].name}">
        <span>${RES_META[r].icon}</span><b>${fmt(v)}</b>
        <i>${prod[r] > 0.001 || prod[r] < -0.001 ? (prod[r] > 0 ? '+' : '') + prod[r].toFixed(1) + '/с' : ''}</i></div>`;
    }).join('');
    this.el('topStats').innerHTML =
      `<span title="Населення">👥 ${Game.pop()}/${Game.popCap()}</span>
       <span title="Рівень королівства">👑 ${Game.kl()}</span>
       <span title="Краса">✨ ${Game.beauty()}</span>
       <span title="Рідкісні ресурси" id="rareBtn">🔮 ${fmt(S.res.mcrystal)} 🏺 ${fmt(S.res.relic)} 🎖️ ${fmt(S.res.medal)}</span>`;
  },
  refreshSoon() { this.needRefresh = true; },
  tick(dt) {
    this.refreshT += dt;
    if (this.refreshT > 1 || this.needRefresh) {
      this.refreshT = 0; this.needRefresh = false;
      this.refreshTop();
      if (this.panel) this.renderPanel(); // тримаємо панель актуальною
      this.updateEventBanner();
      this.updateNavBadges();
    }
  },
  updateNavBadges() {
    // «Більше»: готові експедиції + квести + доступна Коронація
    const n = Game.S.exps.filter(e => Date.now() >= e.end).length
      + Game.S.quests.list.filter(x => !x.claimed && Game.questProg(x) >= x.goal).length
      + (Game.crownsGain() ? 1 : 0);
    const btn = document.querySelector('.navBtn[data-p="more"]');
    if (!btn) return;
    let dot = btn.querySelector('.dot');
    if (n) {
      if (!dot) { dot = document.createElement('i'); dot.className = 'dot'; btn.appendChild(dot); }
      dot.textContent = n;
    } else if (dot) dot.remove();
  },

  toast(text) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    this.el('toasts').appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  },

  modal(html, buttons, onAction) {
    const m = this.el('modal');
    delete m.dataset.ad; // нове вікно скасовує таймер демо-реклами
    m.innerHTML = `<div class="modalBox">${html}
      <div class="modalBtns">${(buttons || [['ok', 'Гаразд']]).map(([a, l, cls]) =>
        `<button class="btn ${cls || ''}" data-a="${a}">${l}</button>`).join('')}</div></div>`;
    m.classList.add('open');
    this._modalAt = Date.now();
    m.onclick = e => {
      // тап, що відкрив вікно, породжує фантомний click по ньому ж —
      // міг закрити панель чи навіть натиснути кнопку (напр. «Знести»)
      if (Date.now() - this._modalAt < 300) return;
      const b = e.target.closest('button[data-a]');
      if (!b && e.target !== m) return;
      A.sfx('click');
      const act = b ? b.dataset.a : 'close';
      if (onAction && onAction(act) === false) return; // не закривати
      m.classList.remove('open'); m.innerHTML = '';
    };
  },

  /* ---------- панелі ---------- */
  openPanel(id) {
    this.panel = id;
    this.subView = null;
    this.placeType = null; Renderer.placeList = null;
    document.querySelectorAll('.navBtn').forEach(b => b.classList.toggle('active', b.dataset.p === id));
    const sheet = this.el('sheet');
    if (!id) { sheet.classList.remove('open'); return; }
    sheet.classList.add('open');
    this.renderPanel();
  },
  renderPanel() {
    const titles = { build: '🏗️ Будівництво', citizens: '👥 Жителі', research: '🔬 Дослідження', map: '🗺️ Карта світу', more: '📦 Королівство' };
    this.el('panelTitle').textContent = titles[this.panel] || '';
    const body = this.el('panelBody');
    const scroll = body.scrollTop;
    if (this.panel === 'more' && this.subView) body.innerHTML = this.subHtml(this.subView);
    else if (this.panel === 'build') body.innerHTML = this.buildHtml();
    else if (this.panel === 'citizens') body.innerHTML = this.citizensHtml();
    else if (this.panel === 'research') body.innerHTML = this.researchHtml();
    else if (this.panel === 'map') body.innerHTML = this.mapHtml();
    else if (this.panel === 'more') body.innerHTML = this.moreHtml();
    body.scrollTop = scroll;
  },

  buildHtml() {
    const S = Game.S;
    let h = `<div class="hint">Обери будівлю, потім торкнись вільної ділянки. Будівельників: ${S.builders - Game.buildersBusy()}/${S.builders}</div>`;
    for (const t of BUILD_ORDER) {
      const B = BUILDINGS[t];
      const count = Game.buildingCount(t) + S.plots.filter(p => p.b === t && p.lvl === 0).length;
      const unlocked = Game.buildingUnlocked(t);
      const maxed = count >= B.max;
      const cost = Game.costOf(t, 1);
      let lockTxt = '';
      if (!unlocked) {
        const u = B.unlock;
        lockTxt = u.castle ? `Потрібен 🏰 Замок р.${u.castle}` : u.zone ? `Потрібна зона ${ZONES[u.zone].icon}` : `Рівень королівства ${u.kl}`;
        if (u.zone && !Game.zoneUnlocked(u.zone)) lockTxt = `Потрібна зона ${ZONES[u.zone].icon} ${ZONES[u.zone].name}` + (u.castle ? ` та 🏰 р.${u.castle}` : '');
      }
      h += `<div class="card ${!unlocked || maxed ? 'dim' : ''}">
        <div class="cardIcon">${B.icon}</div>
        <div class="cardMain"><b>${B.name}</b> <small>${count}/${B.max}</small><p>${B.desc}</p>
          <div class="cost">${unlocked ? (maxed ? 'Максимум побудовано' : costStr(cost) + ` · ⏱${fmtTime(Game.timeOf(t, 1))}`) : '🔒 ' + lockTxt}</div></div>
        ${unlocked && !maxed ? `<button class="btn small ${Game.canAfford(cost) ? '' : 'no'}" onclick="UI.startPlace('${t}')">Будувати</button>` : ''}
      </div>`;
    }
    return h;
  },
  startPlace(t) {
    A.sfx('click');
    if (Game.buildersBusy() >= Game.S.builders) { this.toast('👷 Всі будівельники зайняті'); return; }
    if (!Game.canAfford(Game.costOf(t, 1))) { this.toast('Недостатньо ресурсів'); return; }
    this.placeType = t;
    Renderer.placeList = Game.S.plots.map((p, i) => (!p.b && !p.until) ? i : -1).filter(i => i >= 0);
    this.openPanelKeep();
    this.toast(`${BUILDINGS[t].icon} Обери місце для будівлі`);
  },
  openPanelKeep() { // згорнути панель, лишити режим розміщення
    this.panel = null;
    document.querySelectorAll('.navBtn').forEach(b => b.classList.remove('active'));
    this.el('sheet').classList.remove('open');
  },

  citizensHtml() {
    const S = Game.S;
    const busy = Game.busyCitizens();
    let h = `<div class="hint">Населення: ${Game.pop()}/${Game.popCap()}. ${busy ? `В експедиціях: ${busy}. ` : ''}Торкнись професії, щоб змінити.</div>`;
    const unlockedJobs = Object.keys(JOBS).filter(j => Game.jobUnlocked(j));
    S.citizens.forEach((c, i) => {
      const J = JOBS[c.job];
      const canTrain = Game.buildingCount('academy') > 0 && c.lvl < 10;
      h += `<div class="card">
        <div class="cardIcon">${J ? J.icon : '💤'}</div>
        <div class="cardMain"><b>${c.n}</b> <small>рівень ${c.lvl}</small>
          <div class="jobRow">${unlockedJobs.map(j =>
            `<button class="jobBtn ${c.job === j ? 'sel' : ''}" onclick="Game.setJob(${i},'${j}');UI.renderPanel()" title="${JOBS[j].name}">${JOBS[j].icon}</button>`).join('')}
            <button class="jobBtn ${c.job === 'idle' ? 'sel' : ''}" onclick="Game.setJob(${i},'idle');UI.renderPanel()" title="Відпочиває">💤</button></div>
          <p>${J ? J.name : 'Відпочиває'}${J && J.note ? ' — ' + J.note : ''}</p></div>
        ${canTrain ? `<button class="btn small ${Game.canAfford(Game.trainCost(c)) ? '' : 'no'}"
          onclick="UI.err(Game.train(${i}));UI.renderPanel()">🎓<br><small>${costStr(Game.trainCost(c))}</small></button>` : ''}
      </div>`;
    });
    return h;
  },
  err(e) { if (e) this.toast(e); },

  researchHtml() {
    const done = Object.values(Game.S.research).reduce((a, b) => a + b, 0);
    let h = `<div class="hint">Завершено досліджень: ${done}. ${Game.buildingCount('library') ? '' : 'Після 6 досліджень знадобиться 📚 Бібліотека.'}</div>`;
    for (const [id, R] of Object.entries(RESEARCH)) {
      const lvl = Game.S.research[id] || 0;
      const cost = Game.researchCost(id);
      const maxed = lvl >= R.max;
      h += `<div class="card ${maxed ? 'dim' : ''}">
        <div class="cardIcon">${R.icon}</div>
        <div class="cardMain"><b>${R.name}</b> <small>${lvl}/${R.max}</small><p>${R.desc}</p>
          <div class="cost">${maxed ? 'Досліджено повністю' : costStr(cost)}</div></div>
        ${!maxed ? `<button class="btn small ${Game.canAfford(cost) ? '' : 'no'}" onclick="UI.err(Game.doResearch('${id}'));UI.renderPanel()">Вивчити</button>` : ''}
      </div>`;
    }
    return h;
  },

  mapHtml() {
    // мальована мапа: стежка знизу (Ліс) угору (Магічний ліс)
    let h = `<div class="hint">Нові землі дають бонуси та маршрути експедицій. Рівень 🏰 Замку: ${Game.castleLvl()}</div><div class="wmap">`;
    const ids = Object.keys(ZONES).reverse();
    ids.forEach((id, k) => {
      const Z = ZONES[id];
      const open = Game.zoneUnlocked(id);
      const can = Game.castleLvl() >= Z.req;
      const side = k % 2 ? 'right' : 'left';
      h += `<div class="wnode ${side} ${open ? 'open' : can ? 'ready' : 'locked'}" onclick="UI.zoneTap('${id}')">
        <div class="wicon">${open ? Z.icon : can ? Z.icon : '🔒'}</div>
        <div class="winfo"><b>${Z.name}</b>
          <small>${open ? '✅ відкрито' : can ? (Z.cost ? costStr(Z.cost) : 'безкоштовно') : `🔒 Замок р.${Z.req}`}</small></div>
      </div>`;
    });
    return h + '</div>';
  },
  zoneTap(id) {
    A.sfx('click');
    const Z = ZONES[id];
    if (Game.zoneUnlocked(id)) {
      this.modal(`<h3>${Z.icon} ${Z.name}</h3><p>${Z.desc}</p><p>Сюди можна відправляти експедиції (📦 Більше → 🧭).</p>`);
      return;
    }
    const can = Game.castleLvl() >= Z.req;
    this.modal(`<h3>${Z.icon} ${Z.name}</h3><p>${Z.desc}</p>
      <p>${Z.cost ? 'Вартість: ' + costStr(Z.cost) : ''}${can ? '' : `<br>🔒 Потрібен Замок рівня ${Z.req}`}</p>`,
      can ? [['unlock', 'Відкрити землі'], ['no', 'Пізніше']] : [['no', 'Зрозуміло']],
      act => {
        if (act === 'unlock') {
          const e = Game.unlockZone(id);
          if (e) { this.toast(e); return false; }
          this.toast(`${Z.icon} ${Z.name} — нові землі відкрито!`);
          this.renderPanel();
        }
      });
  },

  moreHtml() {
    const q = Game.S.quests.list.filter(x => !x.claimed && Game.questProg(x) >= x.goal).length;
    const expReady = Game.S.exps.filter(e => Date.now() >= e.end).length;
    const crowns = Game.crownsGain();
    const rows = [
      ['story', '📖', 'Сюжет', Game.S.story < STORY.length ? `${Game.S.story}/${STORY.length}` : '✅'],
      ['exped', '🧭', 'Експедиції', expReady ? `${expReady} заверш.` : (Game.S.exps.length ? 'в дорозі…' : '')],
      ['quests', '📜', 'Щоденні квести', q ? `${q} готово!` : ''],
      ['prestige', '👑', 'Коронація', crowns ? `+${crowns} 👑!` : (Game.S.crowns ? `${Game.S.crowns} 👑` : '')],
      ['ach', '🏅', 'Досягнення', `${Game.achDone()}/${ACH_LIST.length}`],
      ['coll', '🏆', 'Колекції', `${Game.colCount()}/48`],
      ['shop', '🛍️', 'Крамниця', ''],
      ['stats', '📊', 'Статистика', ''],
    ];
    return rows.map(([id, ic, nm, badge]) => `<div class="card tap" onclick="UI.sub('${id}')">
      <div class="cardIcon">${ic}</div><div class="cardMain"><b>${nm}</b></div>
      ${badge ? `<span class="badge">${badge}</span>` : '<span class="chev">›</span>'}</div>`).join('');
  },

  sub(id) {
    A.sfx('click');
    this.subView = id; // тримається при автооновленні панелі
    this.el('panelBody').innerHTML = this.subHtml(id);
    this.el('panelBody').scrollTop = 0;
  },
  subHtml(id) {
    const back = `<button class="btn ghost" onclick="UI.subView=null;UI.renderPanel()">‹ Назад</button>`;
    if (id === 'exped') return back + this.expedHtml();
    if (id === 'quests') return back + this.questsHtml();
    if (id === 'story') return back + this.storyHtml();
    if (id === 'prestige') return back + this.prestigeHtml();
    if (id === 'ach') return back + this.achHtml();
    if (id === 'coll') return back + this.collHtml();
    if (id === 'shop') return back + this.shopHtml();
    if (id === 'stats') return back + this.statsHtml();
    return back;
  },

  expedHtml() {
    const S = Game.S;
    let h = `<div class="hint">Вільних жителів: ${Game.freeCitizens()}. Порт прискорює експедиції.</div>`;
    S.exps.forEach((e, i) => {
      const left = (e.end - Date.now()) / 1000;
      const Z = ZONES[e.zone];
      h += `<div class="card"><div class="cardIcon">${Z.icon}</div>
        <div class="cardMain"><b>${Z.name}</b> <small>${e.party} жит.</small>
        <p>${left > 0 ? '⏱ ' + fmtTime(left) : '✅ Завершено!'}</p></div>
        ${left <= 0 ? `<button class="btn small" onclick="UI.claimExp(${i})">Забрати</button>` : ''}</div>`;
    });
    for (const [zid, Z] of Object.entries(ZONES)) {
      if (!Game.zoneUnlocked(zid)) continue;
      h += `<div class="card"><div class="cardIcon">${Z.icon}</div>
        <div class="cardMain"><b>${Z.name}</b><p>Здобич рівня ${Z.tier}</p>
        <div class="jobRow">${EXP_DURATIONS.map((d, di) =>
          `<button class="btn small" onclick="UI.sendExp('${zid}',${di})">${d.name}<br><small>${fmtTime(d.sec * Game.expTimeMult())}</small></button>`).join('')}
        </div></div></div>`;
    }
    return h;
  },
  sendExp(z, di) {
    const party = Math.min(3, Math.max(1, Game.freeCitizens()));
    const e = Game.startExpedition(z, di, party);
    if (e) this.toast(e); else this.toast(`🧭 ${party} жител. вирушили — ${ZONES[z].name}`);
    this.sub('exped');
  },
  claimExp(i) {
    const r = Game.claimExpedition(i);
    if (!r) return;
    let h = `<h3>🧭 Експедиція повернулась!</h3><p class="big">${Object.entries(r.loot).map(([k, v]) => `${RES_META[k].icon}${fmt(v)}`).join(' ')}</p>`;
    for (const ex of r.extras) h += `<p>🎁 ${ex.text}</p>`;
    this.modal(h);
    this.sub('exped');
  },

  storyHtml() {
    const S = Game.S;
    let h = '';
    const next = STORY[S.story];
    if (next) {
      h += `<div class="colBlock storyNext"><b>📖 Поточний розділ</b>
        <p class="hint" style="margin:6px 0 4px">«${next.title}»</p>
        <div class="cost">🎯 ${next.goal}</div>
        ${next.reward ? `<small style="color:#8a7561">Нагорода: ${costStr(next.reward)}</small>` : ''}</div>`;
    } else {
      h += `<div class="colBlock storyNext"><b>🏆 Історію завершено!</b>
        <p class="hint" style="margin-top:6px">Серце Королівства знову б'ється. Далі — вічна слава: колекції, досягнення та нові династії.</p></div>`;
    }
    if (S.story > 0) h += `<div class="hint">Прочитані розділи:</div>`;
    for (let i = S.story - 1; i >= 0; i--) {
      const st = STORY[i], ch = CHARS[st.who];
      h += `<div class="card tap" onclick="UI.storyModal(STORY[${i}], true)">
        <div class="cardIcon">${ch.icon}</div>
        <div class="cardMain"><b>${i + 1}. ${st.title}</b><p>${ch.n}</p></div><span class="chev">›</span></div>`;
    }
    return h;
  },
  /* діалогове вікно сюжету; replay=true — перечитування без нагороди */
  storyModal(step, replay) {
    const ch = CHARS[step.who];
    this.modal(`<div class="storyDlg">
        <div class="portrait">${ch.icon}</div>
        <div class="charName">${ch.n}</div>
        <h3>${step.title}</h3>
        <p class="storyText">${step.text}</p>
        ${!replay && step.reward ? `<p class="big">Нагорода: ${costStr(step.reward)}</p>` : ''}
      </div>`, [['ok', replay ? 'Закрити' : '📖 Далі']]);
    if (!replay) { A.sfx('event'); this.refreshTop(); }
  },

  prestigeHtml() {
    const S = Game.S, gain = Game.crownsGain(), kl = Game.kl();
    let h = `<div class="colBlock" style="text-align:center">
      <div style="font-size:40px">👑</div>
      <b>Коронація</b>
      <p class="hint" style="margin-top:6px">Передай трон нащадку: королівство почнеться заново, але кожна здобута корона
      <b>назавжди</b> додає +${CROWN_BONUS * 100}% до всього виробництва.<br><br>
      Зберігаються: корони, колекції, досягнення, рідкісні ресурси (🔮🏺🎖️), покупки та скіни.</p>
      <div class="cost" style="margin:8px 0">Твої корони: 👑 ${S.crowns} (бонус +${(S.crowns * CROWN_BONUS * 100).toFixed(0)}%) · Коронацій: ${S.prestiges}</div>`;
    if (gain) {
      h += `<div class="cost" style="color:#2e7d32">Зараз отримаєш: +👑 ${gain}</div>
        <button class="btn" style="margin-top:10px" onclick="UI.confirmPrestige()">👑 Коронувати нащадка</button>`;
    } else {
      h += `<div class="bar" style="margin:10px 0"><i style="width:${Math.min(100, kl / PRESTIGE_MIN_KL * 100)}%"></i></div>
        <p class="hint">Потрібен рівень королівства ${PRESTIGE_MIN_KL} (зараз ${kl}). Корони рахуються з рівня королівства та краси — розбудовуйся і прикрашай!</p>`;
    }
    return h + '</div>';
  },
  confirmPrestige() {
    const gain = Game.crownsGain();
    this.modal(`<h3>👑 Коронація</h3><p>Почати нове королівство та отримати <b>+${gain} корон</b> (+${(gain * CROWN_BONUS * 100).toFixed(0)}% назавжди)?</p>
      <p>Будівлі, ресурси, жителі, дослідження та землі буде скинуто.</p>`,
      [['yes', `👑 Так, +${gain} корон!`], ['no', 'Ще ні']],
      act => {
        if (act === 'yes') {
          const e = Game.doPrestige();
          if (e) { this.toast(e); return false; }
          this.openPanel(null);
          setTimeout(() => this.modal(`<h3>👑 Нова епоха!</h3><p class="big">+${gain} корон. Хай живе новий монарх!</p>`), 100);
          this.refreshTop();
        }
      });
  },

  questsHtml() {
    let h = `<div class="hint">Нові квести — щодня. Виконано всього: ${Game.S.stats.quests || 0}</div>`;
    Game.S.quests.list.forEach((q, i) => {
      const t = QUEST_TEMPLATES.find(x => x.id === q.tid);
      const prog = Game.questProg(q);
      const done = prog >= q.goal;
      h += `<div class="card ${q.claimed ? 'dim' : ''}">
        <div class="cardIcon">${q.claimed ? '✅' : done ? '🎁' : '📜'}</div>
        <div class="cardMain"><b>${t.text(q.goal)}</b>
          <div class="bar"><i style="width:${Math.min(100, prog / q.goal * 100)}%"></i></div>
          <p>${fmt(Math.max(0, prog))}/${fmt(q.goal)} · Нагорода: ${costStr(t.reward)}</p></div>
        ${done && !q.claimed ? `<button class="btn small" onclick="Game.claimQuest(${i});UI.sub('quests')">Забрати</button>` : ''}</div>`;
    });
    return h;
  },

  achHtml() {
    const ctx = { g: Game, st: Game.S.stats };
    let h = `<div class="hint">🏅 ${Game.achDone()} з ${ACH_LIST.length}. Кожне досягнення дає кристали.</div>`;
    // спершу найближчі 40 невиконаних із прогрес-барами, здобуті — стислим списком знизу
    const undone = ACH_LIST.filter(a => !Game.S.ach[a.id]).slice(0, 40);
    const done = ACH_LIST.filter(a => Game.S.ach[a.id]);
    for (const a of undone) {
      let v = 0; try { v = a.getter(ctx); } catch (e) {}
      h += `<div class="card"><div class="cardIcon">🔸</div>
        <div class="cardMain"><b>${a.name}</b><p>${a.desc} · +💎${a.reward}</p>
        <div class="bar"><i style="width:${Math.min(100, v / a.v * 100)}%"></i></div></div></div>`;
    }
    if (done.length) h += `<div class="hint">Здобуті:</div>` +
      done.map(a => `<div class="card dim"><div class="cardIcon">🏅</div><div class="cardMain"><b>${a.name}</b></div></div>`).join('');
    return h;
  },

  collHtml() {
    let h = `<div class="hint">Предмети колекцій знаходять в експедиціях і подіях. Повний набір дає великий бонус!</div>`;
    for (const [cid, C] of Object.entries(COLLECTIONS)) {
      const owned = Game.S.col[cid] || [];
      const bonusName = C.stat === 'beauty' ? 'краси' : C.stat === 'all' ? 'до всього' : RES_META[C.stat].name;
      h += `<div class="colBlock"><b>${C.icon} ${C.name}</b> <small>${owned.length}/${C.items.length} · +${C.stat === 'beauty' ? C.per : (C.per * 100).toFixed(1) + '%'} ${bonusName} за предмет</small>
        <div class="colGrid">${C.items.map((nm, i) =>
          `<div class="colItem ${owned.includes(i) ? 'own' : ''}" title="${nm}">${owned.includes(i) ? C.icon : '❔'}</div>`).join('')}</div></div>`;
    }
    return h;
  },

  shopHtml() {
    const S = Game.S;
    let h = `<div class="hint">Підтримай королівство! Реклама — за бажанням, жодних нав'язливих показів.</div>`;
    h += `<div class="card"><div class="cardIcon">🎬</div>
      <div class="cardMain"><b>Скарбниця за перегляд</b><p>Переглянь рекламу та отримай 🪙 (30 хв виробництва) або 💎5</p>
      <div class="jobRow"><button class="btn small" onclick="UI.watchAd('gold')">🪙 Золото</button>
      <button class="btn small" onclick="UI.watchAd('crystal')">💎 Кристали</button></div></div></div>`;
    h += `<div class="card"><div class="cardIcon">👷</div>
      <div class="cardMain"><b>Другий будівельник</b><p>Будуй дві споруди одночасно. Назавжди.</p>
      <div class="cost">💎50</div></div>
      ${S.builders >= 2 ? '<span class="badge">✅</span>' : `<button class="btn small ${S.res.crystal >= 50 ? '' : 'no'}" onclick="UI.err(Game.buyBuilder());UI.sub('shop')">Купити</button>`}</div>`;
    h += `<div class="card"><div class="cardIcon">🌙</div>
      <div class="cardMain"><b>Подвійний офлайн-прибуток</b><p>Королівство працює вдвічі щедріше, поки тебе немає. Назавжди.</p>
      <div class="cost">🎖️20</div></div>
      ${S.offlineX2 ? '<span class="badge">✅</span>' : `<button class="btn small ${S.res.medal >= 20 ? '' : 'no'}" onclick="UI.err(Game.buyOfflineX2());UI.sub('shop')">Купити</button>`}</div>`;
    h += `<div class="hint">Косметика для замку:</div>`;
    for (const sk of SKINS) {
      const ownedSk = S.skinsOwned.includes(sk.id);
      h += `<div class="card"><div class="cardIcon">${sk.icon}</div>
        <div class="cardMain"><b>${sk.name}</b><div class="cost">${sk.cost ? costStr(sk.cost) : 'Безкоштовно'}</div></div>
        <button class="btn small ${S.skin === sk.id ? 'no' : ''}" onclick="UI.err(Game.buySkin(${sk.id}));UI.sub('shop')">
          ${S.skin === sk.id ? 'Обрано' : ownedSk ? 'Одягнути' : 'Купити'}</button></div>`;
    }
    h += `<div class="hint">Преміум-перепустка та набори з'являться в наступному оновленні (готові гачки для Google Play Billing).</div>`;
    return h;
  },
  watchAd(kind) {
    // Заглушка reward-реклами: у релізі під Android тут викликається AdMob
    // через міст window.AndroidBridge.showRewardedAd(kind).
    if (window.AndroidBridge && window.AndroidBridge.showRewardedAd) { window.AndroidBridge.showRewardedAd(kind); return; }
    this.modal(`<h3>🎬 Реклама</h3><p>Уяви тут відео на 30 секунд…<br>(демо-режим: нагорода за 3 сек)</p>`, [['skip', 'Зачекати']], act => {});
    const m = this.el('modal');
    m.dataset.ad = '1';
    setTimeout(() => {
      // видаємо нагороду, лише якщо рекламне вікно досі на екрані
      if (m.dataset.ad !== '1') return;
      delete m.dataset.ad;
      m.classList.remove('open'); m.innerHTML = '';
      window.grantAdReward(kind);
    }, 3000);
  },

  statsHtml() {
    const st = Game.S.stats;
    const days = Math.max(1, Math.round((Date.now() - Game.S.created) / 86400000));
    const rows = [
      ['👑 Рівень королівства', Game.kl()], ['✨ Краса', Game.beauty()],
      ['👥 Населення', `${Game.pop()}/${Game.popCap()}`], ['📅 Днів у грі', days],
      ['🏗️ Побудовано/покращено', st.built || 0], ['🧭 Експедицій', st.exps || 0],
      ['🔬 Досліджень', st.research || 0], ['🎪 Подій', st.events || 0],
      ['📜 Квестів', st.quests || 0], ['🏅 Досягнень', Game.achDone()],
      ['🪙 Золота зібрано', fmt(st.got_gold || 0)], ['🪵 Деревини зібрано', fmt(st.got_wood || 0)],
    ];
    return rows.map(([k, v]) => `<div class="card"><div class="cardMain"><b>${k}</b></div><span class="badge">${v}</span></div>`).join('');
  },

  settings() {
    const S = Game.S;
    this.modal(`<h3>⚙️ Налаштування</h3>
      <div class="volRow">🔊 Звуки <input type="range" min="0" max="100" value="${Math.round((S.settings.sfx || 0) * 100)}"
        oninput="Game.S.settings.sfx=this.value/100" onchange="A.sfx('click')"></div>
      <div class="volRow">🎵 Музика <input type="range" min="0" max="100" value="${Math.round((S.settings.music || 0) * 100)}"
        oninput="Game.S.settings.music=this.value/100;A.music(this.value>0)"></div>
      <p style="margin-top:8px">Tiny Kingdom v1.1</p>`, [
      ['save', '💾 Зберегти гру'],
      ['export', '📤 Експорт збереження'],
      ['import', '📥 Імпорт збереження'],
      ['reset', '🗑️ Нова гра', 'danger'],
      ['ok', 'Закрити'],
    ], act => {
      if (act === 'save') { Game.save(); this.toast('💾 Збережено'); }
      if (act === 'export') { this.exportModal(); return false; }
      if (act === 'import') { this.importModal(); return false; }
      if (act === 'reset') { this.confirmReset(); return false; }
    });
  },
  exportModal() {
    const code = Game.exportSave();
    this.modal(`<h3>📤 Код збереження</h3>
      <p>Скопіюй і збережи цей код — з нього можна відновити прогрес на будь-якому пристрої.</p>
      <textarea class="saveArea" readonly onclick="this.select()">${code}</textarea>`,
      [['copy', '📋 Скопіювати'], ['ok', 'Закрити']],
      act => {
        if (act === 'copy') {
          const ta = document.querySelector('.saveArea');
          ta.select();
          try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); }
          this.toast('📋 Скопійовано');
          return false;
        }
      });
  },
  importModal() {
    this.modal(`<h3>📥 Імпорт збереження</h3>
      <p>Встав код збереження. <b>Поточний прогрес буде замінено!</b></p>
      <textarea class="saveArea" placeholder="Встав код сюди…"></textarea>`,
      [['load', 'Відновити', 'danger'], ['ok', 'Скасувати']],
      act => {
        if (act === 'load') {
          const e = Game.importSave(document.querySelector('.saveArea').value);
          if (e) { this.toast(e); return false; }
        }
      });
  },
  confirmReset() {
    this.modal('<h3>🗑️ Почати заново?</h3><p>Весь прогрес буде втрачено назавжди!</p>',
      [['yes', 'Так, нова гра', 'danger'], ['no', 'Скасувати']],
      act => { if (act === 'yes') Game.reset(); });
  },

  /* ---------- події ---------- */
  updateEventBanner() {
    const b = this.el('eventBanner'), ev = Game.S.event;
    if (!ev) { b.classList.remove('show'); return; }
    const E = EVENTS[ev.id];
    const left = Math.max(0, (ev.end - Date.now()) / 1000);
    b.innerHTML = `<span class="evIcon">${E.icon}</span><span>${E.banner}</span><small>${fmtTime(left)}</small>`;
    b.classList.add('show');
  },
  eventBanner() { this.updateEventBanner(); },
  openEvent() {
    const ev = Game.S.event;
    if (!ev) return;
    A.sfx('click');
    const d = ev.data, id = ev.id, E = EVENTS[id];
    const head = `<h3>${E.icon} ${E.name}</h3>`;
    if (id === 'caravan') {
      this.modal(head + `<p>Купці пропонують угоди з ${RES_META[d.r].icon} ${RES_META[d.r].name} (${fmt(d.amount)}):</p>`, [
        ['buy', `Купити за 🪙${fmt(d.buyGold)}`],
        ['sell', `Продати за 🪙${fmt(d.sellGold)}`],
        ['no', 'Відмовитись'],
      ], act => this.finishEv(act === 'no' ? 'pass' : act));
    } else if (id === 'goblins') {
      const knights = Game.jobCounts().knight || 0;
      this.modal(head + `<p>${d.n} гоблінів наближаються! У тебе лицарів: ${knights} — кожен зупинить одного гобліна.</p>
        <p><b>Тапай по гоблінах на карті, щоб відбити напад!</b></p>`, [
        ['fight', '⚔️ До бою!'],
        ['mercs', '💎2 Найманці (без бою)'],
      ], act => this.finishEv(act === 'close' ? 'fight' : act));
    } else if (id === 'harvest') {
      this.modal(head + `<p>Їжа виробляється вдвічі швидше до кінця свята!</p>`, [['ok', '🎉 Чудово!']],
        act => this.finishEv('ok'));
    } else {
      const btn = { treasure: '🎁 Відкрити скриню', portal: '🌀 Увійти в портал', tournament: '⚔️ Виставити лицаря' }[id] || 'Далі';
      this.modal(head + `<p>${E.banner}</p>`, [[('go'), btn]], act => this.finishEv('go'));
    }
  },
  finishEv(act) {
    const r = Game.resolveEvent(act);
    if (!r) return;
    if (r.err) { this.toast(r.err); return false; }
    this.updateEventBanner();
    if (r.minigame) { this.openPanel(null); return; } // бій іде на карті
    setTimeout(() => this.modal(`<p class="big">${r.text}</p>`), 60);
  },

  /* ---------- ділянки ---------- */
  onPlotTap(i) {
    const S = Game.S, p = S.plots[i];
    if (this.placeType) {
      if (p.b || p.until) {
        // тап по зайнятій ділянці: виходимо з режиму розміщення і показуємо будівлю
        this.placeType = null; Renderer.placeList = null;
      } else {
        const err = Game.buildAt(i, this.placeType);
        if (err) this.toast(err);
        else { this.placeType = null; Renderer.placeList = null; this.refreshTop(); }
        return;
      }
    }
    if (!p.b) return;
    if (p.until > 0) { this.constructionPopup(i); return; }
    // бонус збирається тим самим дотиком, панель відкривається завжди
    const got = Game.collect(i);
    let collected = null;
    if (got && Object.keys(got).length) {
      collected = Object.entries(got).map(([r, v]) => `+${fmt(v)}${RES_META[r].icon}`).join(' ');
      Renderer.float(i, collected, '#ffe082');
      this.refreshTop();
    }
    this.plotPopup(i, collected);
  },
  constructionPopup(i) {
    const p = Game.S.plots[i], B = BUILDINGS[p.b];
    const cost = Game.speedUpCost(p);
    this.modal(`<h3>${B.icon} ${B.name} → рівень ${p.target}</h3>
      <p>Будується… залишилось ⏱ ${fmtTime((p.until - Date.now()) / 1000)}</p>`, [
      ['speed', `💎${cost} Прискорити`], ['ok', 'Гаразд'],
    ], act => { if (act === 'speed') { const e = Game.speedUp(i); if (e) { this.toast(e); return false; } } });
  },
  plotPopup(i, collected) {
    const p = Game.S.plots[i], B = BUILDINGS[p.b];
    const S = Game.S;
    let info = (collected ? `<span class="collectedLine">✨ Зібрано: ${collected}</span><br>` : '') + B.desc;
    if (B.prod) {
      const sm = Game.staffMult(p.b);
      const rates = Object.entries(B.prod).map(([r, v]) =>
        `${RES_META[r].icon}${(v * lvlProdMult(p.lvl) * sm * Game.mult(r)).toFixed(2)}/с`).join(' ');
      info += `<br>Виробництво: ${rates}`;
      if (B.job) info += `<br>Робітники (${JOBS[B.job].icon} ${JOBS[B.job].name}): ${Game.jobCounts()[B.job] || 0}/${Game.buildingCount(p.b)}`;
      if (p.lvl < 5) info += `<br>💡 Віха: рівень 5 подвоїть виробництво!`;
      else if (p.lvl < 10) info += `<br>💡 Віха: рівень 10 потроїть виробництво!`;
    }
    const up = p.lvl < MAX_LVL;
    const cost = up ? Game.costOf(p.b, p.lvl + 1) : null;
    const btns = [];
    if (up) btns.push(['up', `⬆️ Покращити<br><small>${costStr(cost)} · ⏱${fmtTime(Game.timeOf(p.b, p.lvl + 1))}</small>`]);
    if (p.b !== 'castle' && p.b !== 'palace') btns.push(['demolish', '🧹 Знести', 'danger']);
    btns.push(['ok', 'Закрити']);
    this.modal(`<h3>${B.icon} ${B.name} — рівень ${p.lvl}${p.lvl >= MAX_LVL ? ' ★MAX' : ''}</h3><p>${info}</p>`, btns, act => {
      if (act === 'up') { const e = Game.upgrade(i); if (e) { this.toast(e); return false; } this.refreshTop(); }
      if (act === 'demolish') { const e = Game.demolish(i); if (e) { this.toast(e); return false; } }
    });
  },

  /* ---------- офлайн і туторіал ---------- */
  offlineModal() {
    const r = Game.offlineReport;
    if (!r) return;
    const list = Object.entries(r.gains).map(([k, v]) => `${RES_META[k].icon} +${fmt(v)}`).join('  ');
    const auto = Game.S.offlineX2;
    if (auto) Game.doubleOffline();
    this.modal(`<h3>👋 З поверненням!</h3>
      <p>Поки тебе не було (${fmtTime(r.dt)}), королівство запасло:</p>
      <p class="big">${list}${auto ? ' ×2 🌙' : ''}</p>`,
      auto ? [['ok', 'Чудово!']] : [['x2', '🎬 Подвоїти (реклама)'], ['ok', 'Забрати']],
      act => {
        if (act === 'x2') this.watchAd('offline'); // grantAdReward сам спише offlineReport
        else Game.offlineReport = null;
      });
  },
  tutorial() {
    Game.S.tutorial = 1;
    this.modal(`<h3>👑 Вітаємо у Tiny Kingdom!</h3>
      <p>Ти успадкував занедбане королівство. Перетвори його на найбагатше та найкрасивіше у світі!</p>
      <p>🏗️ Будуй споруди — жителі працюватимуть самі<br>
      👆 Торкайся будівель зі ✨, щоб зібрати бонус<br>
      🧭 Відправляй експедиції та збирай колекції<br>
      🌙 Королівство працює навіть без тебе (до 12 год)</p>`, [['ok', 'Почати правити!']]);
  },
};

/* нагорода за (демо) рекламу — викликається і з Android-мосту */
window.grantAdReward = function (kind) {
  if (kind === 'gold') {
    const p = Game.prodPerSec();
    const amt = Math.max(200, Math.round((p.gold || 0) * 1800));
    Game.addRes('gold', amt);
    UI.toast(`🎬 +🪙${fmt(amt)}`);
  } else if (kind === 'crystal') {
    Game.addRes('crystal', 5);
    UI.toast('🎬 +💎5');
  } else if (kind === 'offline') {
    Game.doubleOffline();
    UI.toast('🎬 Офлайн-прибуток подвоєно!');
  }
  UI.refreshTop();
  A.sfx('ach');
};
