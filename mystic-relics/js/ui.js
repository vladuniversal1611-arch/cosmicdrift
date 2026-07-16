/* ============================================================
 * Mystic Relics — ui.js
 * Усі екрани, модальні вікна, HUD, теми, тости та навігація.
 * ============================================================ */
'use strict';

const UI = {
  lvlPage: 0,
  LVL_PER_PAGE: 40,
  _dispScore: 0,         // плавний лічильник очок у HUD
  _lastCoins: -1, _lastGems: -1,

  $(id) { return document.getElementById(id); },

  theme() { return CFG.THEMES.find(t => t.id === Storage.data.theme) || CFG.THEMES[0]; },

  applyTheme() {
    const t = this.theme();
    const r = document.documentElement.style;
    r.setProperty('--bg1', t.bg[0]);
    r.setProperty('--bg2', t.bg[1]);
    r.setProperty('--accent', t.accent);
    Board.spriteCache.clear();
    if (Background.canvas) Background.build();   // перебудова живого фону
  },

  /* ---------------- Навігація ---------------- */
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = this.$(name + 'Screen');
    if (el) el.classList.add('active');
    // Рендер вмісту екрана при відкритті
    switch (name) {
      case 'main': this.renderMain(); break;
      case 'levels':
        this.lvlPage = Math.floor((Storage.data.level - 1) / this.LVL_PER_PAGE);
        this.renderLevels();
        break;
      case 'shop': this.renderShop(); break;
      case 'daily': this.renderDaily(); break;
      case 'achievements': this.renderAchievements(); break;
      case 'collection': this.renderCollection(); break;
      case 'profile': this.renderProfile(); break;
      case 'chests': this.renderChests(); break;
      case 'game':
        // Спершу панель бустерів (вона впливає на висоту поля), тоді розмір
        this.updateBoosterBar();
        Board.resize();
        requestAnimationFrame(() => Board.resize());
        this._dispScore = 0; this._lastCoins = -1; this._lastGems = -1;
        break;
    }
  },

  renderMain() {
    this.$('playLevelNum').textContent = Storage.data.level;
    this.updateCurrency();
    this.setBadge('dailyBadge', Daily.canClaim() ? 1 : 0, '!');
    this.setBadge('dailyChBadge', Storage.data.daily.challengeDone !== Utils.today() ? 1 : 0, '!');
    this.setBadge('wheelBadge', Daily.canSpin() ? 1 : 0, '!');
    const chestsTotal = Object.values(Storage.data.chests).reduce((a, b) => a + b, 0);
    this.setBadge('chestBadge', chestsTotal);
    Achievements.check();
  },

  updateCurrency() {
    const d = Storage.data;
    this.$('curCoins').querySelector('b').textContent = Utils.fmt(d.coins);
    this.$('curGems').querySelector('b').textContent = Utils.fmt(d.gems);
    document.querySelectorAll('.coinsVal').forEach(el => el.textContent = Utils.fmt(d.coins));
  },

  setBadge(id, n, symbol) {
    const el = this.$(id);
    if (!el) return;
    el.textContent = symbol || (n > 99 ? '99+' : n);
    el.classList.toggle('show', n > 0);
  },

  /* ---------------- HUD гри ---------------- */
  updateHUD() {
    if (Game.state !== 'playing' && Game.state !== 'paused') return;
    this.$('hudLevel').textContent = Game.levelNum;

    // Очки «набігають» плавно, з bump-анімацією панелі
    if (this._dispScore !== Game.score) {
      const diff = Game.score - this._dispScore;
      this._dispScore += Math.abs(diff) < 2 ? diff : Math.round(diff * 0.16 + Math.sign(diff));
      this.$('hudScore').textContent = Utils.fmt(this._dispScore);
      if (Math.abs(diff) > 50) this._bump('hudScorePill');
    }
    // Валюти у HUD
    const d = Storage.data;
    if (d.coins !== this._lastCoins) {
      this._lastCoins = d.coins;
      this.$('hudCoins').querySelector('b').textContent = Utils.fmt(d.coins);
      this._bump('hudCoins');
    }
    if (d.gems !== this._lastGems) {
      this._lastGems = d.gems;
      this.$('hudGems').querySelector('b').textContent = Utils.fmt(d.gems);
      this._bump('hudGems');
    }

    const timer = this.$('hudTimer');
    if (Game.mode === 'zen') {
      timer.textContent = '🧘 ∞';
      timer.classList.remove('low', 'frozen');
    } else {
      timer.textContent = (Game.freezeLeft > 0 ? '🧊 ' : '⏱️ ') + Utils.time(Game.timeLeft);
      timer.classList.toggle('low', Game.timeLeft < 30 && Game.freezeLeft <= 0);
      timer.classList.toggle('frozen', Game.freezeLeft > 0);
    }

    // Прогрес рівня: частка зібраних плиток
    if (Board.totalTiles) {
      const left = Board.boardTiles().length + Board.tray.filter(t => t.state !== 'gone' && !t.rainbow).length;
      const p = Math.round((1 - left / Board.totalTiles) * 100);
      const fill = this.$('progressFill');
      if (fill.style.width !== p + '%') fill.style.width = p + '%';
    }
    // Прогноз зірок за поточним часом (у дзен — символ спокою)
    const ratio = Game.levelCfg ? Game.timeLeft / Game.levelCfg.timeLimit : 1;
    const starStr = Game.mode === 'zen' ? '☮' : ratio > 0.5 ? '★★★' : ratio > 0.25 ? '★★' : '★';
    const hs = this.$('hudStars');
    if (hs.textContent !== starStr) hs.textContent = starStr;
    // Активні ефекти
    const fx = [];
    if (Game.freezeLeft > 0) fx.push(`🧊 ${Math.ceil(Game.freezeLeft)}s`);
    if (Game.doubleLeft > 0) fx.push(`✨ x2 ${Math.ceil(Game.doubleLeft)}s`);
    if (Game.combo > 1) fx.push(`🔥 x${Game.combo}`);
    const bar = this.$('fxBar');
    const html = fx.map(f => `<span>${f}</span>`).join('');
    if (bar.innerHTML !== html) bar.innerHTML = html;
  },

  updateBoosterBar() {
    this.$('boosterBar').innerHTML = CFG.GAME_BOOSTERS.map(id => {
      const n = Storage.data.boosters[id] || 0;
      return `<button class="booster-btn ${n ? '' : 'empty'}" data-booster="${id}" title="${I18N.booster(id).name}">
        ${Assets.boosterHtml(id, 'bicon')}<span class="cnt">${n}</span><span class="info" data-binfo="${id}">і</span></button>`;
    }).join('');
  },

  /** Інфо-вікно бустера (ⓘ). На час перегляду гра стає на паузу. */
  boosterInfo(id) {
    const b = CFG.BOOSTERS[id];
    if (Game.state === 'playing') { Game.state = 'paused'; this._resumeOnClose = true; }
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <div style="font-size:54px;filter:drop-shadow(0 4px 8px rgba(0,0,10,0.6))">${Assets.boosterHtml(id, 'modal-icon')}</div>
      <h2>${I18N.booster(id).name}</h2>
      <p style="opacity:0.88;font-size:14.5px;line-height:1.45;margin:8px 0">${I18N.booster(id).desc}</p>
      <div class="reward-item" style="display:inline-block;margin-bottom:6px">${I18N.t('you_have', { n: Storage.data.boosters[id] || 0 })} · ${b.cost} 🪙 ${I18N.t('in_shop')}</div>
      <button class="btn-3d btn-green" data-close>${I18N.t('got_it')}</button>
    `);
  },

  setHammerCursor(on) { this.$('gameCanvas').classList.toggle('hammer', on); },

  /** Червона пульсація країв на останніх секундах. */
  setDanger(on) {
    const v = this.$('vignette');
    if (v.classList.contains('danger') !== on) v.classList.toggle('danger', on);
  },

  /** Заставка на старті рівня (кампанія / дзен / виклик дня). */
  showLevelIntro(title) {
    const el = this.$('levelIntro');
    this.$('introLevel').textContent = title;
    this.$('introGo').textContent = I18N.t('go');
    el.classList.remove('show');
    void el.offsetWidth;                  // перезапуск CSS-анімації
    el.classList.add('show');
    Audio2.play('intro');
  },

  /* ---------------- Міні-туторіал (перший запуск) ---------------- */
  tutorial: { active: false, step: 0, _timer: null },

  startTutorial() {
    this.tutorial.active = true;
    this.tutorial.step = 1;
    const box = this.$('tutorialBox');
    box.textContent = I18N.t('tut_1');
    box.classList.add('show');
    // Постійно підсвічуємо збирану трійку і ведемо палець 👆 до неї
    this.tutorial._timer = setInterval(() => {
      if (!this.tutorial.active || Game.state !== 'playing') return;
      if (!Board.boardTiles().some(t => t.hintT > 0)) Board.showHint();
      const target = Board.boardTiles().find(t => t.hintT > 0);
      const hand = this.$('tutorialHand');
      if (target) {
        hand.style.left = target.px + 'px';
        hand.style.top = (target.py + Board.tileH * 0.35) + 'px';
        hand.classList.add('show');
      } else hand.classList.remove('show');
    }, 500);
  },

  /** Викликається після кожної зібраної трійки під час туторіалу. */
  tutorialProgress() {
    const t = this.tutorial;
    if (!t.active) return;
    if (t.step === 1) {
      t.step = 2;
      this.$('tutorialBox').textContent = I18N.t('tut_2');
      this.$('tutorialHand').classList.remove('show');
      clearInterval(t._timer);                     // палець більше не потрібен
    } else {
      this.endTutorial();
    }
  },

  endTutorial() {
    const t = this.tutorial;
    if (!t.active) return;
    t.active = false;
    clearInterval(t._timer);
    this.$('tutorialBox').classList.remove('show');
    this.$('tutorialHand').classList.remove('show');
    Storage.data.tutorialDone = true;
    Storage.save();
  },

  /** Bounce-анімація панелі при зміні значення. */
  _bump(id) {
    const el = this.$(id);
    if (!el || el.classList.contains('bump')) return;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 420);
  },

  comboPopup(mult) {
    const el = this.$('comboPopup');
    el.textContent = I18N.t('combo', { n: mult });
    el.classList.remove('show');
    void el.offsetWidth;          // перезапуск анімації
    el.classList.add('show');
  },

  toast(text) {
    const box = this.$('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.remove(), 2800);
    while (box.children.length > 4) box.firstChild.remove();
  },

  /* ---------------- Карта рівнів: звивиста стежка ---------------- */
  renderLevels() {
    const d = Storage.data;
    this.$('starsTotal').textContent = d.stats.totalStars;
    const pages = Math.ceil(CFG.TOTAL_LEVELS / this.LVL_PER_PAGE);
    this.lvlPage = Utils.clamp(this.lvlPage, 0, pages - 1);
    this.$('lvlPageLabel').textContent = `${this.lvlPage * this.LVL_PER_PAGE + 1} – ${Math.min((this.lvlPage + 1) * this.LVL_PER_PAGE, CFG.TOTAL_LEVELS)}`;

    const N = Math.min(this.LVL_PER_PAGE, CFG.TOTAL_LEVELS - this.lvlPage * this.LVL_PER_PAGE);
    const stepY = 84, H = N * stepY + 70;
    const rnd = Utils.rng(this.lvlPage * 7919 + 3);

    // Точки стежки: плавна синусоїда згори донизу (x у %, y у px)
    const pts = [];
    for (let i = 0; i < N; i++) {
      pts.push({ x: 50 + Math.sin(i * 0.75 + this.lvlPage * 2) * 30, y: 52 + i * stepY });
    }

    // Пунктирна золота стежка через вузли (координати: 1000 × H)
    let path = `M ${pts[0].x * 10} ${pts[0].y}`;
    for (let i = 1; i < N; i++) {
      const midX = (pts[i - 1].x + pts[i].x) / 2 * 10;
      const midY = (pts[i - 1].y + pts[i].y) / 2;
      path += ` Q ${pts[i - 1].x * 10} ${midY - stepY * 0.22}, ${midX} ${midY}`;
      path += ` Q ${pts[i].x * 10} ${midY + stepY * 0.22}, ${pts[i].x * 10} ${pts[i].y}`;
    }
    const svg = `<svg class="lvl-path" viewBox="0 0 1000 ${H}" preserveAspectRatio="none" style="height:${H}px">
      <path d="${path}" class="lvl-path-shadow"/>
      <path d="${path}" class="lvl-path-line"/>
    </svg>`;

    // Декорації узбіч стежки (за сценою активної теми)
    const decoSets = { forest: ['🌿', '🍄', '🌸', '🦋', '✨'], cave: ['💎', '✨', '🪨', '🔮'], temple: ['🏺', '✨', '🗿', '🕯️'] };
    const decos = decoSets[this.theme().scene] || decoSets.forest;
    let decoHtml = '';
    for (let i = 0; i < N; i += 2) {
      const p = pts[i];
      const side = p.x > 50 ? p.x - 38 - rnd() * 8 : p.x + 30 + rnd() * 8;
      decoHtml += `<span class="lvl-deco" style="left:${side}%;top:${p.y + 26 + rnd() * 20}px;font-size:${18 + rnd() * 12}px;animation-delay:${rnd() * 3}s">${decos[Utils.ri(rnd, 0, decos.length - 1)]}</span>`;
    }

    // Вузли рівнів на стежці
    let nodes = '';
    for (let i = 0; i < N; i++) {
      const n = this.lvlPage * this.LVL_PER_PAGE + i + 1;
      const stars = d.stars[n] || 0;
      const locked = n > d.level;
      const cls = locked ? 'locked' : n === d.level ? 'current' : stars ? 'done' : '';
      const starStr = stars ? '★'.repeat(stars) : (locked ? '🔒' : '');
      nodes += `<button class="level-node path-node ${cls}" data-level="${locked ? '' : n}"
        style="left:calc(${pts[i].x}% - 31px);top:${pts[i].y - 31}px">${n}<small>${starStr}</small></button>`;
    }

    this.$('levelGrid').innerHTML =
      `<div class="level-path-wrap" style="height:${H}px">${svg}${decoHtml}${nodes}</div>`;

    // Прокрутка до поточного рівня
    const cur = this.$('levelGrid').querySelector('.current, .path-node:not(.locked):last-of-type');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 50);
  },

  /* ---------------- Магазин ---------------- */
  openShop(tab) {
    this.showScreen('shop');
    this.shopTab(tab || 'coins');
  },

  renderShop() { this.shopTab(document.querySelector('#shopTabs .active')?.dataset.tab || 'coins'); },

  shopTab(tab) {
    document.querySelectorAll('#shopTabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const box = this.$('shopContent');
    const d = Storage.data;
    if (tab === 'coins' || tab === 'gems') {
      const items = CFG.SHOP[tab];
      const ico = tab === 'coins' ? '🪙' : '💎';
      box.innerHTML = `<div class="shop-grid">` + items.map(it => `
        <div class="shop-card glass" data-iap="${it.id}" data-kind="${tab}" data-amount="${it.amount}">
          <div class="big">${ico}</div>
          <div class="amount">${Utils.fmt(it.amount)}</div>
          <div class="price">${it.price}</div>
        </div>`).join('') + `</div>
        <p style="text-align:center;opacity:0.6;font-size:12px;padding:10px">${I18N.t('iap_note')}</p>`;
    } else if (tab === 'boosters') {
      box.innerHTML = CFG.GAME_BOOSTERS.map(id => [id, CFG.BOOSTERS[id]]).map(([id, b]) => `
        <div class="shop-row glass">
          <div class="big">${Assets.boosterHtml(id, 'row-icon')}</div>
          <div class="info"><b>${I18N.booster(id).name}</b> <small>${I18N.booster(id).desc}</small><small>${I18N.t('you_have', { n: d.boosters[id] || 0 })}</small></div>
          <button class="buy-btn" data-buy-booster="${id}">${b.cost} 🪙</button>
        </div>`).join('');
    } else if (tab === 'themes') {
      box.innerHTML = CFG.THEMES.map(t => {
        const owned = d.themes.includes(t.id);
        const active = d.theme === t.id;
        return `<div class="shop-row glass" style="border-left:5px solid ${t.accent}">
          <div class="big" style="background:linear-gradient(${t.bg[0]},${t.bg[1]});border-radius:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center">🎨</div>
          <div class="info"><b>${I18N.theme(t.id)}</b><small>${I18N.t('theme_desc')}</small></div>
          <button class="buy-btn" data-theme="${t.id}" ${active ? 'disabled' : ''}>
            ${active ? I18N.t('active') : owned ? I18N.t('choose') : t.cost + ' 💜'}</button>
        </div>`;
      }).join('');
    } else if (tab === 'premium') {
      box.innerHTML = `
        <div class="shop-row glass" style="border:1px solid var(--gold)">
          <div class="big">👑</div>
          <div class="info"><b>${I18N.t('premium_name')}</b>
          <small>${I18N.t('premium_desc')}</small></div>
          <button class="buy-btn" data-iap="${CFG.SHOP.premium.id}" data-kind="premium" ${d.premium ? 'disabled' : ''}>
            ${d.premium ? I18N.t('purchased') : CFG.SHOP.premium.price}</button>
        </div>`;
    }
  },

  /* ---------------- Щоденні нагороди ---------------- */
  renderDaily() {
    Missions.ensureToday();
    const d = Storage.data.daily;
    const idx = Daily.streakIndex();
    const claimedToday = !Daily.canClaim();
    this.$('calendar').innerHTML = CFG.DAILY_CALENDAR.map((r, i) => {
      const ico = r.coins ? '🪙' : r.gems ? '💜' : r.booster ? CFG.BOOSTERS[r.booster].g : '🧰';
      const val = r.coins || r.gems || '';
      const cls = i < idx || (i === idx && claimedToday) ? 'claimed' : i === idx ? 'today' : '';
      return `<div class="cal-day ${cls}">${I18N.t('day', { n: i + 1 })}<span class="ico">${ico}</span>${val}</div>`;
    }).join('');
    const btn = this.$('btnClaimDaily');
    btn.disabled = claimedToday;
    btn.textContent = claimedToday ? I18N.t('claimed_today') : I18N.t('claim');

    this.$('missionList').innerHTML = d.missions.map((m, i) => `
      <div class="mission glass">
        <div class="info">
          <b>${I18N.t('m_' + m.id, { n: m.goal })}</b>
          <div class="bar"><i style="width:${(m.progress / m.goal * 100).toFixed(0)}%"></i></div>
          <small>${m.progress}/${m.goal}</small>
        </div>
        <button class="buy-btn" data-mission="${i}" ${m.claimed || m.progress < m.goal ? 'disabled' : ''}>
          ${m.claimed ? '✓' : m.reward + ' 🪙'}</button>
      </div>`).join('');
  },

  /* ---------------- Колесо фортуни ---------------- */
  showWheel() {
    const free = Daily.canSpin();
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <h2>${I18N.t('wheel_title')}</h2>
      <canvas id="wheelCanvas" width="260" height="260"></canvas>
      <button class="btn-3d ${free ? 'btn-green' : 'btn-blue'}" id="btnSpin">
        ${free ? I18N.t('free_spin') : I18N.t('spin_ad')}</button>
      ${free ? '' : `<p style="opacity:0.6;font-size:12px">${I18N.t('free_daily')}</p>`}
    `);
    this._drawWheel(0);
    this.$('btnSpin').onclick = () => {
      if (free) this._spinWheel(false);
      else Ads.showRewarded(() => this._spinWheel(true));   // нагорода лише після перегляду
    };
  },

  _drawWheel(angle) {
    const c = this.$('wheelCanvas');
    if (!c) return;
    const g = c.getContext('2d');
    const cx = 130, cy = 130, r = 118;
    g.clearRect(0, 0, 260, 260);
    const n = CFG.WHEEL.length;
    for (let i = 0; i < n; i++) {
      const a0 = angle + (i / n) * Math.PI * 2, a1 = angle + ((i + 1) / n) * Math.PI * 2;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a0, a1); g.closePath();
      g.fillStyle = i % 2 ? '#5b21b6' : '#7c3aed';
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.stroke();
      g.save();
      g.translate(cx, cy); g.rotate((a0 + a1) / 2);
      g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'right';
      g.fillText(CFG.WHEEL[i].label, r - 8, 4);
      g.restore();
    }
    // Обід і стрілка
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
    g.lineWidth = 6; g.strokeStyle = '#f5b800'; g.stroke(); g.lineWidth = 1;
    g.fillStyle = '#f5b800';
    g.beginPath(); g.moveTo(cx - 12, 4); g.lineTo(cx + 12, 4); g.lineTo(cx, 30); g.closePath(); g.fill();
  },

  _spinWheel(viaAd) {
    const idx = Daily.spin(viaAd);
    if (idx < 0) { this.renderMain(); return; }
    const btn = this.$('btnSpin');
    btn.disabled = true;
    const n = CFG.WHEEL.length;
    // Кут: сектор idx має опинитися під стрілкою (зверху, -90°)
    const target = -Math.PI / 2 - (idx + 0.5) / n * Math.PI * 2 - Math.PI * 2 * 5;
    const dur = 3200;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      this._drawWheel(target * Utils.easeOutCubic(p));
      if (p < 0.9 && Math.random() < 0.3) Audio2.play('wheel');
      if (p < 1) requestAnimationFrame(tick);
      else {
        Daily.giveReward(CFG.WHEEL[idx]);
        Audio2.play('chest');
        Achievements.check();
        setTimeout(() => { this.closeModal(); this.renderMain(); }, 800);
      }
    };
    requestAnimationFrame(tick);
  },

  /* ---------------- Досягнення ---------------- */
  renderAchievements() {
    const done = Achievements.list.filter(a => Achievements.isClaimed(a)).length;
    this.$('achCount').textContent = `${done}/100`;
    // Сортування: готові до отримання → у прогресі → отримані
    const sorted = [...Achievements.list].sort((a, b) => {
      const ka = Achievements.isClaimed(a) ? 2 : Achievements.isDone(a) ? 0 : 1;
      const kb = Achievements.isClaimed(b) ? 2 : Achievements.isDone(b) ? 0 : 1;
      return ka - kb;
    });
    this.$('achList').innerHTML = sorted.map(a => {
      const v = Math.min(Achievements.value(a), a.goal);
      const done = Achievements.isDone(a), claimed = Achievements.isClaimed(a);
      return `<div class="ach glass ${done ? 'done' : 'locked'}">
        <div class="ico">${a.g}</div>
        <div class="info"><b>${Achievements.name(a)}</b>
          <div class="bar"><i style="width:${(v / a.goal * 100).toFixed(0)}%"></i></div>
        </div>
        <button class="buy-btn" data-ach="${a.id}" ${!done || claimed ? 'disabled' : ''}>
          ${claimed ? '✓' : a.reward + ' 🪙'}</button>
      </div>`;
    }).join('');
  },

  /* ---------------- Колекція ---------------- */
  renderCollection() {
    const d = Storage.data;
    const coll = d.collection;
    this.$('collCount').textContent = `${coll.length}/${CFG.TILES.length}`;

    // Пояснення умови + віхи з нагородами + сітка з прогресом
    const milestones = CFG.COLLECTION_MILESTONES.map(m => {
      const done = coll.length >= m.n;
      const claimed = d.collectionClaimed.includes(m.n);
      const ico = m.coins ? '🪙' : m.gems ? '💜' : CFG.CHESTS[m.chest].g;
      const val = m.coins || m.gems || I18N.chest(m.chest);
      return `<div class="mission glass">
        <div class="info">
          <b>${I18N.t('a_coll', { n: m.n })}</b>
          <div class="bar"><i style="width:${Math.min(100, coll.length / m.n * 100).toFixed(0)}%"></i></div>
          <small>${Math.min(coll.length, m.n)}/${m.n}</small>
        </div>
        <button class="buy-btn" data-collmile="${m.n}" ${!done || claimed ? 'disabled' : ''}>
          ${claimed ? '✓' : ico + ' ' + val}</button>
      </div>`;
    }).join('');

    const grid = CFG.TILES.map((t, i) => {
      const has = coll.includes(i);
      const prog = d.collectionCount[i] || 0;
      const progBadge = !has && prog > 0
        ? `<em class="coll-prog">${prog}/${CFG.COLLECTION_TRIPLES}</em>` : '';
      return `<div class="coll-cell ${has ? '' : 'unknown'}" title="${has ? I18N.tile(i) : '???'}"
        style="animation-delay:${i * 12}ms">${has ? Assets.tileHtml(i) : '?'}${progBadge}</div>`;
    }).join('');

    this.$('collGrid').outerHTML = `<div id="collGrid" class="scroll">
      <p class="coll-note">${I18N.t('coll_hint', { k: CFG.COLLECTION_TRIPLES, r: CFG.COLLECTION_REWARD })}</p>
      <h3 class="section-title">${I18N.t('coll_rewards')}</h3>
      ${milestones}
      <div class="coll-grid" style="padding-top:10px">${grid}</div>
    </div>`;
  },

  /** Отримання нагороди за віху колекції. */
  claimCollectionMilestone(n) {
    const d = Storage.data;
    const m = CFG.COLLECTION_MILESTONES.find(x => x.n === +n);
    if (!m || d.collection.length < m.n || d.collectionClaimed.includes(m.n)) return;
    d.collectionClaimed.push(m.n);
    Daily.giveReward(m);          // видає монети/кристали/скриню з тостами
    Audio2.play('chest');
    Storage.save();
    this.renderCollection();
  },

  /* ---------------- Профіль ---------------- */
  renderProfile() {
    const d = Storage.data;
    const need = CFG.xpForLevel(d.profileLevel);
    const s = d.stats;
    this.$('profileContent').innerHTML = `
      <div class="profile-head glass">
        <div class="avatar" id="avatarBtn">${d.avatar}</div>
        <h3 id="nameBtn">${d.profileName || I18N.t('default_name')} ✏️</h3>
        <div>${I18N.t('profile_level')} <b style="color:var(--gold)">${d.profileLevel}</b></div>
        <div class="xp-bar"><i style="width:${(d.xp / need * 100).toFixed(0)}%"></i></div>
        <small>${d.xp} / ${need} XP</small>
      </div>
      <div class="stat-grid">
        <div class="stat-cell glass"><b>${s.levelsCompleted}</b>${I18N.t('s_levels')}</div>
        <div class="stat-cell glass"><b>${s.totalStars}</b>${I18N.t('s_stars')}</div>
        <div class="stat-cell glass"><b>${Utils.fmt(s.matches)}</b>${I18N.t('s_matches')}</div>
        <div class="stat-cell glass"><b>${s.combos}</b>${I18N.t('s_combos')}</div>
        <div class="stat-cell glass"><b>${Utils.fmt(s.coinsEarned)}</b>${I18N.t('s_coins')}</div>
        <div class="stat-cell glass"><b>${s.chestsOpened}</b>${I18N.t('s_chests')}</div>
        <div class="stat-cell glass"><b>${s.perfectLevels}</b>${I18N.t('s_perfect')}</div>
        <div class="stat-cell glass"><b>${d.daily.loginDays}</b>${I18N.t('s_days')}</div>
      </div>`;
    this.$('nameBtn').onclick = () => {
      const name = prompt(I18N.t('name_prompt'), d.profileName || I18N.t('default_name'));
      if (name && name.trim()) { d.profileName = name.trim().slice(0, 20); Storage.save(); this.renderProfile(); }
    };
    this.$('avatarBtn').onclick = () => {
      const avatars = ['🧙', '🧝', '🧚', '🦸', '🧛', '🥷', '👸', '🤴', '🧜', '🦹'];
      d.avatar = avatars[(avatars.indexOf(d.avatar) + 1) % avatars.length];
      Storage.save(); this.renderProfile();
    };
  },

  /* ---------------- Скрині ---------------- */
  renderChests() {
    const d = Storage.data;
    this.$('chestGrid').innerHTML = Object.entries(CFG.CHESTS).map(([id, c]) => `
      <div class="chest-card glass">
        <button class="info-badge" data-chinfo="${id}">і</button>
        <div class="big">${Assets.chestHtml(id, 'chest-img')}</div>
        <h4>${I18N.chest(id)}</h4>
        <span class="cnt">${I18N.t('you_have', { n: d.chests[id] })}</span>
        <button class="btn-3d btn-purple" style="font-size:14px;padding:9px 18px" data-chest="${id}" ${d.chests[id] ? '' : 'disabled'}>${I18N.t('open')}</button>
      </div>`).join('');
  },

  /** Спливаюча інформація про вміст скрині (кнопка ⓘ). */
  chestInfo(id) {
    const c = CFG.CHESTS[id];
    const row = (ico, text) => `<div class="chest-info-row"><span>${ico}</span>${text}</div>`;
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <div style="filter:drop-shadow(0 4px 10px rgba(0,0,10,0.6))">${Assets.chestHtml(id, 'modal-icon') || c.g}</div>
      <h2>${I18N.t('chest_of', { name: I18N.chest(id) })}</h2>
      <h3 class="section-title" style="margin:8px 0 6px">${I18N.t('contents')}</h3>
      ${row('🪙', I18N.t('ch_coins', { a: c.coins[0], b: c.coins[1] }))}
      ${c.gems[1] > 0 ? row('💜', I18N.t('ch_gems', { a: c.gems[0], b: c.gems[1] })) : ''}
      ${row('⚡', I18N.t('ch_boost_n', { n: c.boosters }))}
      ${c.themeChance > 0 ? row('🎨', I18N.t('ch_theme_chance', { p: Math.round(c.themeChance * 100) })) : ''}
      <p style="opacity:0.7;font-size:12.5px;margin:10px 0 4px">${I18N.t('ch_source', { n: c.every })}</p>
      <button class="btn-3d btn-green" data-close>${I18N.t('got_it')}</button>
    `);
  },

  openChest(kind) {
    const rewards = Chests.open(kind);
    if (!rewards) return;
    this.modal(`
      <div style="filter:drop-shadow(0 4px 10px rgba(0,0,10,0.6))">${Assets.chestHtml(kind, 'modal-icon')}</div>
      <h2>${I18N.t('chest_of', { name: I18N.chest(kind) })}</h2>
      <div class="reward-row">${rewards.map(r => `<div class="reward-item"><span class="ico">${r.g}</span>${r.text}</div>`).join('')}</div>
      <button class="btn-3d btn-green" data-close>${I18N.t('great')}</button>
    `);
    this.renderChests();
  },

  /* ---------------- Налаштування ---------------- */
  showSettings() {
    const s = Storage.data.settings;
    const row = (id, ico, label, checked) => `
      <div class="setting-row"><span>${ico} ${label}</span>
        <label class="switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><i></i></label>
      </div>`;
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <h2>⚙️</h2>
      ${row('setMusic', '🎵', I18N.t('music'), s.music)}
      ${row('setSound', '🔊', I18N.t('sounds'), s.sound)}
      ${row('setVibra', '📳', I18N.t('vibration'), s.vibration)}
      <div class="setting-row"><span>🖼️ ${I18N.t('quality')}</span>
        <button class="buy-btn" id="setQuality">${s.quality === 'high' ? I18N.t('high') : I18N.t('low')}</button>
      </div>
      <div class="setting-row"><span>🌐 ${I18N.t('language')}</span>
        <select id="setLang" class="lang-select">
          ${I18N.LANGS.map(l => `<option value="${l.id}" ${s.lang === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
        </select>
      </div>
      <div class="setting-row"><span>💾 ${I18N.t('backup')}</span>
        <span style="display:flex;gap:6px">
          <button class="buy-btn" id="btnExport">${I18N.t('export_btn')}</button>
          <button class="buy-btn" id="btnImport">${I18N.t('import_btn')}</button>
        </span>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        <button class="btn-3d btn-blue" style="font-size:13px;padding:10px 16px" id="btnSupport">${I18N.t('support')}</button>
        <button class="btn-3d btn-purple" style="font-size:13px;padding:10px 16px" id="btnAbout">${I18N.t('about')}</button>
      </div>
    `);
    this.$('setMusic').onchange = e => { s.music = e.target.checked; Audio2.toggleMusic(s.music); Storage.save(); };
    this.$('setSound').onchange = e => { s.sound = e.target.checked; Storage.save(); };
    this.$('setVibra').onchange = e => { s.vibration = e.target.checked; Storage.save(); };
    this.$('setQuality').onclick = e => {
      s.quality = s.quality === 'high' ? 'low' : 'high';
      e.target.textContent = s.quality === 'high' ? I18N.t('high') : I18N.t('low');
      Storage.save();
    };
    // Зміна мови: миттєво оновлюємо всі написи
    this.$('setLang').onchange = e => {
      s.lang = e.target.value;
      Storage.save();
      I18N.apply();
      this.renderMain();
      this.showSettings();
    };
    this.$('btnExport').onclick = () => this.showExport();
    this.$('btnImport').onclick = () => this.showImport();
    this.$('btnSupport').onclick = () => this.toast('📧 support@mysticrelics.example');
    this.$('btnAbout').onclick = () => this.toast(I18N.t('about_text'));
  },

  /* ---------------- Ігрові модальні вікна ---------------- */
  showWin(stars, score, coins, gems, xp) {
    const starHtml = [1, 2, 3].map(i => `<span class="${i <= stars ? '' : 'off'}">⭐</span>`).join('');
    this.modal(`
      <div class="win-stars">${starHtml}</div>
      <h2>${I18N.t('win_title')}</h2>
      <div style="font-weight:700;opacity:0.85">${I18N.t('level_n', { n: Game.levelNum })}</div>
      <div style="font-size:24px;font-weight:900;color:var(--gold);margin:8px 0;text-shadow:0 2px 6px rgba(0,0,10,0.7)">
        ${I18N.t('score')}: <span id="winScore">0</span></div>
      <div class="reward-row">
        <div class="reward-item"><span class="ico">🪙</span>+${coins}</div>
        ${gems ? `<div class="reward-item"><span class="ico">💜</span>+${gems}</div>` : ''}
        <div class="reward-item"><span class="ico">⚡</span>+${xp} XP</div>
      </div>
      <button class="btn-3d btn-green btn-big" style="font-size:20px;padding:15px 42px" id="btnNextLevel">${I18N.t('next')}</button>
      <button class="btn-3d btn-blue" style="font-size:14px;padding:10px 22px" id="btnWinMenu">${I18N.t('to_menu')}</button>
    `, true);
    if (Game.mode === 'daily') {
      this.$('btnNextLevel').textContent = I18N.t('to_menu');
      this.$('btnNextLevel').onclick = () => { this.closeModal(); Game.quitToMenu(); };
      this.toast(I18N.t('daily_done'));
    } else {
      this.$('btnNextLevel').onclick = () => { this.closeModal(); Game.startLevel(Math.min(Game.levelNum + 1, CFG.TOTAL_LEVELS)); };
    }
    this.$('btnWinMenu').onclick = () => { this.closeModal(); Game.quitToMenu(); };

    // Лічильник очок красиво набігає
    const el = this.$('winScore');
    const t0 = performance.now();
    const count = (now) => {
      const p = Math.min(1, (now - t0) / 1200);
      el.textContent = Utils.fmt(Math.round(score * Utils.easeOutCubic(p)));
      if (p < 1 && el.isConnected) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);

    // Свято: конфеті + феєрверки + дощ з монет (і кристали за 3 зірки)
    Fx.confetti(130);
    Fx.fireworksShow(stars + 2);
    setTimeout(() => Fx.coinRain(18, '🪙'), 500);
    if (gems) setTimeout(() => Fx.coinRain(6, '💜'), 900);

    // Нагороди летять дугою у лічильники валют HUD
    setTimeout(() => {
      Fx.flyTo(innerWidth / 2, innerHeight / 2 - 30, this.$('hudCoins'), '🪙', 8,
        () => { Audio2.play('coin'); this._bump('hudCoins'); });
      if (gems) setTimeout(() => Fx.flyTo(innerWidth / 2, innerHeight / 2, this.$('hudGems'), '💜', 4,
        () => { Audio2.play('gem'); this._bump('hudGems'); }), 400);
    }, 900);
  },

  /** Перемога у дзен-режимі: спокійне вікно без зірок. */
  showZenWin(score, coins) {
    this.modal(`
      <div style="font-size:56px;filter:drop-shadow(0 0 18px var(--accent))">🧘</div>
      <h2>${I18N.t('win_title')}</h2>
      <div style="font-size:22px;font-weight:900;color:var(--gold);margin:8px 0">${I18N.t('score')}: ${Utils.fmt(score)}</div>
      <div class="reward-row"><div class="reward-item"><span class="ico">🪙</span>+${coins}</div></div>
      <button class="btn-3d btn-green" id="btnZenAgain">${I18N.t('play_again')}</button>
      <button class="btn-3d btn-blue" style="font-size:14px;padding:10px 22px" id="btnZenMenu">${I18N.t('to_menu')}</button>
    `, true);
    Fx.confetti(60);
    this.$('btnZenAgain').onclick = () => { this.closeModal(); Game.startZen(); };
    this.$('btnZenMenu').onclick = () => { this.closeModal(); Game.quitToMenu(); };
  },

  /* ---------------- Бекап прогресу ---------------- */
  showExport() {
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <h2>💾 ${I18N.t('backup')}</h2>
      <p style="opacity:0.8;font-size:13px;margin:8px 0">${I18N.t('export_note')}</p>
      <textarea class="save-code" id="exportCode" readonly>${Storage.exportCode()}</textarea>
      <button class="btn-3d btn-green" id="btnCopyCode">${I18N.t('copy')}</button>
    `);
    this.$('btnCopyCode').onclick = async (e) => {
      const code = this.$('exportCode').value;
      try { await navigator.clipboard.writeText(code); }
      catch (err) { this.$('exportCode').select(); document.execCommand('copy'); }
      e.target.textContent = I18N.t('copied');
    };
  },

  showImport() {
    this.modal(`
      <button class="modal-close" data-close>✕</button>
      <h2>📥 ${I18N.t('backup')}</h2>
      <p style="opacity:0.8;font-size:13px;margin:8px 0">${I18N.t('import_note')}</p>
      <textarea class="save-code" id="importCode"></textarea>
      <button class="btn-3d btn-green" id="btnApplyCode">${I18N.t('apply')}</button>
    `);
    this.$('btnApplyCode').onclick = () => {
      if (Storage.importCode(this.$('importCode').value)) {
        this.toast(I18N.t('import_ok'));
        setTimeout(() => location.reload(), 900);
      } else this.toast(I18N.t('import_bad'));
    };
  },

  showRevive() {
    this.modal(`
      <h2>${I18N.t('tray_full')}</h2>
      <p style="opacity:0.85;margin:8px 0">${I18N.t('tray_full_text')}</p>
      <button class="btn-3d btn-purple" id="btnReviveGems">${I18N.t('revive_gems')}</button>
      <button class="btn-3d btn-blue" id="btnReviveAd">${I18N.t('continue_ad')}</button>
      <button class="btn-3d btn-gray" style="font-size:14px;padding:10px 22px" id="btnGiveUp">${I18N.t('give_up')}</button>
    `, true);
    this.$('btnReviveGems').onclick = () => { if (Game.revive()) this.closeModal(); };
    this.$('btnReviveAd').onclick = () => Game.reviveByAd();
    this.$('btnGiveUp').onclick = () => { this.closeModal(); Game.onLose('tray'); };
  },

  showLose(reason) {
    this.modal(`
      <h2>${reason === 'time' ? I18N.t('lose_time') : I18N.t('lose_title')}</h2>
      <div style="margin:8px 0;font-weight:700">${I18N.t('score')}: <b style="color:var(--gold)">${Utils.fmt(Game.score)}</b></div>
      <p style="opacity:0.75;font-size:13.5px;margin-bottom:6px">${I18N.t('lose_tip')}</p>
      <button class="btn-3d btn-green" id="btnRetry">${I18N.t('retry')}</button>
      <button class="btn-3d btn-purple" style="font-size:15px" id="btnLoseShuffle">${I18N.t('lose_shuffle')}</button>
      <button class="btn-3d btn-blue" style="font-size:15px" id="btnLoseAd">${I18N.t('continue_ad')}</button>
      <button class="btn-3d btn-gray" style="font-size:13px;padding:9px 20px" id="btnLoseMenu">${I18N.t('to_menu')}</button>
    `, true);
    this.$('modalOverlay').classList.add('dark');   // плавне затемнення
    this.$('btnRetry').onclick = () => { this.closeModal(); Game.startLevel(Game.levelNum); };
    this.$('btnLoseMenu').onclick = () => { this.closeModal(); Game.quitToMenu(); };
    // Другий шанс: перемішування поля (+30 с) або перегляд реклами
    this.$('btnLoseShuffle').onclick = () => {
      if ((Storage.data.boosters.shuffle || 0) < 1) { this.toast(I18N.t('b_out')); return; }
      Storage.data.boosters.shuffle--;
      Storage.save();
      this.closeModal();
      Game.secondChance();
    };
    this.$('btnLoseAd').onclick = () => Ads.showRewarded(() => { this.closeModal(); Game.secondChance(); });
  },

  showPause() {
    this.modal(`
      <h2>${I18N.t('pause')}</h2>
      <div style="margin:8px 0">${I18N.t('level_n', { n: Game.levelNum })} • ${I18N.t('score')}: ${Utils.fmt(Game.score)}</div>
      <button class="btn-3d btn-green" id="btnResume">${I18N.t('resume')}</button>
      <button class="btn-3d btn-blue" style="font-size:14px" id="btnRestart">${I18N.t('restart')}</button>
      <button class="btn-3d btn-gray" style="font-size:14px;padding:10px 22px" id="btnQuit">${I18N.t('to_menu')}</button>
    `, true);
    this.$('btnResume').onclick = () => { this.closeModal(); Game.resume(); };
    this.$('btnRestart').onclick = () => { this.closeModal(); Game.startLevel(Game.levelNum); };
    this.$('btnQuit').onclick = () => { this.closeModal(); Game.quitToMenu(); };
  },

  confirm(title, text, onYes) {
    this.modal(`
      <h2>${title}</h2>
      <p style="margin:10px 0;opacity:0.85">${text}</p>
      <button class="btn-3d btn-green" id="btnYes">${I18N.t('yes')}</button>
      <button class="btn-3d btn-gray" data-close>${I18N.t('no')}</button>
    `, true);
    this.$('btnYes').onclick = () => { this.closeModal(); onYes && onYes(); };
  },

  modal(html, noClose) {
    this.$('modalBox').innerHTML = html;
    this.$('modalOverlay').classList.add('show');
    this._modalNoClose = !!noClose;
  },

  closeModal() {
    this.$('modalOverlay').classList.remove('show');
    this.$('modalOverlay').classList.remove('dark');
    if (this._resumeOnClose) { this._resumeOnClose = false; Game.resume(); }
  },

  /* ---------------- Прив'язка подій ---------------- */
  bind() {
    // Навігація
    document.querySelectorAll('[data-nav]').forEach(b =>
      b.addEventListener('click', () => { Audio2.init(); Audio2.play('tap'); this.showScreen(b.dataset.nav); }));
    document.querySelectorAll('[data-back]').forEach(b =>
      b.addEventListener('click', () => { Audio2.play('tap'); this.showScreen('main'); }));

    this.$('btnPlay').onclick = () => { Audio2.init(); this.showScreen('levels'); };
    this.$('btnZen').onclick = () => { Audio2.init(); Game.startZen(); };
    this.$('btnDailyCh').onclick = () => { Audio2.init(); Game.startDaily(); };
    this.$('btnSettings').onclick = () => { Audio2.init(); this.showSettings(); };
    this.$('btnDaily').onclick = () => { Audio2.init(); this.showScreen('daily'); };
    this.$('btnMissions').onclick = () => { Audio2.init(); this.showScreen('daily'); };
    this.$('btnWheel').onclick = () => { Audio2.init(); this.showWheel(); };
    this.$('btnChests').onclick = () => { Audio2.init(); this.showScreen('chests'); };
    this.$('btnPause').onclick = () => Game.pause();
    this.$('lvlPrev').onclick = () => { this.lvlPage--; this.renderLevels(); };
    this.$('lvlNext').onclick = () => { this.lvlPage++; this.renderLevels(); };

    document.querySelectorAll('.plus').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); this.openShop(b.dataset.shop); }));

    this.$('btnClaimDaily').onclick = () => { if (Daily.claim()) this.renderDaily(); };

    // Вкладки магазину (перемикачі)
    document.querySelectorAll('#shopTabs button').forEach(b =>
      b.addEventListener('click', () => { Audio2.play('tap'); this.shopTab(b.dataset.tab); }));

    // Делеговані кліки: рівні, магазин, місії, досягнення, скрині, бустери
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-binfo],[data-chinfo],[data-collmile],[data-level],[data-buy-booster],[data-mission],[data-ach],[data-chest],[data-booster],[data-theme],[data-iap],[data-close]');
      if (!t) return;
      if (t.dataset.binfo) { this.boosterInfo(t.dataset.binfo); return; }   // ⓘ перехоплює клік до кнопки
      if (t.dataset.chinfo) { this.chestInfo(t.dataset.chinfo); return; }   // ⓘ скрині
      if (t.dataset.collmile) { this.claimCollectionMilestone(t.dataset.collmile); return; }
      if (t.dataset.close !== undefined) { this.closeModal(); return; }
      if (t.dataset.level) { Audio2.init(); Game.startLevel(+t.dataset.level); return; }
      if (t.dataset.booster) {
        const used = Boosters.use(t.dataset.booster);
        this.updateBoosterBar();
        if (used) {          // пульс кнопки після успішного використання
          const btn = document.querySelector(`.booster-btn[data-booster="${t.dataset.booster}"]`);
          if (btn) btn.classList.add('pop');
        }
        return;
      }
      if (t.dataset.buyBooster) { Boosters.buy(t.dataset.buyBooster); this.shopTab('boosters'); return; }
      if (t.dataset.mission !== undefined) { if (Missions.claim(+t.dataset.mission)) this.renderDaily(); return; }
      if (t.dataset.ach) {
        const a = Achievements.list.find(x => x.id === t.dataset.ach);
        if (a && Achievements.claim(a)) this.renderAchievements();
        return;
      }
      if (t.dataset.chest) { this.openChest(t.dataset.chest); return; }
      if (t.dataset.theme) {
        const th = CFG.THEMES.find(x => x.id === t.dataset.theme);
        const d = Storage.data;
        if (!d.themes.includes(th.id)) {
          if (d.gems < th.cost) { this.toast(I18N.t('not_enough_gems')); return; }
          Storage.addGems(-th.cost);
          d.themes.push(th.id);
        }
        d.theme = th.id;
        Storage.save();
        this.applyTheme();
        if (Storage.data.settings.music) Audio2.startMusic();
        this.toast(I18N.t('theme_applied', { name: I18N.theme(th.id) }));
        this.shopTab('themes');
        return;
      }
      if (t.dataset.iap) {
        Ads.purchase(t.dataset.iap, () => {
          const kind = t.dataset.kind;
          if (kind === 'coins') Storage.addCoins(+t.dataset.amount);
          else if (kind === 'gems') Storage.addGems(+t.dataset.amount);
          else if (kind === 'premium') { Storage.data.premium = true; Storage.addGems(1000); Ads.hideBanner(); }
          Storage.save();
          Audio2.play('coin');
          this.renderShop();
        });
      }
    });

    // Шпаринка для клавіатури на ПК
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && Game.state === 'playing') Game.pause();
    });
  }
};
