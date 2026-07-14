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
      case 'levels': this.renderLevels(); break;
      case 'shop': this.renderShop(); break;
      case 'daily': this.renderDaily(); break;
      case 'achievements': this.renderAchievements(); break;
      case 'collection': this.renderCollection(); break;
      case 'profile': this.renderProfile(); break;
      case 'chests': this.renderChests(); break;
      case 'game':
        Board.resize();
        this.updateBoosterBar();
        this._dispScore = 0; this._lastCoins = -1; this._lastGems = -1;
        break;
    }
  },

  renderMain() {
    this.$('playLevelNum').textContent = Storage.data.level;
    this.updateCurrency();
    this.setBadge('dailyBadge', Daily.canClaim() ? 1 : 0, '!');
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
    timer.textContent = (Game.freezeLeft > 0 ? '🧊 ' : '⏱️ ') + Utils.time(Game.timeLeft);
    timer.classList.toggle('low', Game.timeLeft < 30 && Game.freezeLeft <= 0);
    timer.classList.toggle('frozen', Game.freezeLeft > 0);
    // Активні ефекти
    const fx = [];
    if (Game.freezeLeft > 0) fx.push(`🧊 ${Math.ceil(Game.freezeLeft)}с`);
    if (Game.doubleLeft > 0) fx.push(`✨ x2 ${Math.ceil(Game.doubleLeft)}с`);
    if (Game.combo > 1) fx.push(`🔥 Комбо x${Game.combo}`);
    const bar = this.$('fxBar');
    const html = fx.map(f => `<span>${f}</span>`).join('');
    if (bar.innerHTML !== html) bar.innerHTML = html;
  },

  updateBoosterBar() {
    const bar = this.$('boosterBar');
    const ids = ['shuffle', 'hint', 'magnet', 'hammer', 'freeze', 'double', 'wand', 'bomb', 'rainbow', 'undo'];
    bar.innerHTML = ids.map(id => {
      const n = Storage.data.boosters[id] || 0;
      return `<button class="booster-btn ${n ? '' : 'empty'}" data-booster="${id}" title="${CFG.BOOSTERS[id].name}">
        ${CFG.BOOSTERS[id].g}<span class="cnt">${n}</span></button>`;
    }).join('');
  },

  setHammerCursor(on) { this.$('gameCanvas').classList.toggle('hammer', on); },

  /** Bounce-анімація панелі при зміні значення. */
  _bump(id) {
    const el = this.$(id);
    if (!el || el.classList.contains('bump')) return;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 420);
  },

  comboPopup(mult) {
    const el = this.$('comboPopup');
    el.textContent = `КОМБО x${mult}!`;
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

  /* ---------------- Карта рівнів ---------------- */
  renderLevels() {
    const d = Storage.data;
    this.$('starsTotal').textContent = d.stats.totalStars;
    const pages = Math.ceil(CFG.TOTAL_LEVELS / this.LVL_PER_PAGE);
    this.lvlPage = Utils.clamp(this.lvlPage, 0, pages - 1);
    this.$('lvlPageLabel').textContent = `${this.lvlPage * this.LVL_PER_PAGE + 1} – ${(this.lvlPage + 1) * this.LVL_PER_PAGE}`;
    const grid = this.$('levelGrid');
    let html = '';
    for (let i = 0; i < this.LVL_PER_PAGE; i++) {
      const n = this.lvlPage * this.LVL_PER_PAGE + i + 1;
      if (n > CFG.TOTAL_LEVELS) break;
      const stars = d.stars[n] || 0;
      const locked = n > d.level;
      const cls = locked ? 'locked' : n === d.level ? 'current' : stars ? 'done' : '';
      const starStr = stars ? '★'.repeat(stars) : (locked ? '🔒' : '');
      html += `<button class="level-node ${cls}" data-level="${locked ? '' : n}">${n}<small>${starStr}</small></button>`;
    }
    grid.innerHTML = html;
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
        <p style="text-align:center;opacity:0.6;font-size:12px;padding:10px">Покупки активуються після публікації у Google Play</p>`;
    } else if (tab === 'boosters') {
      box.innerHTML = Object.entries(CFG.BOOSTERS).map(([id, b]) => `
        <div class="shop-row glass">
          <div class="big">${b.g}</div>
          <div class="info"><b>${b.name}</b> <small>${b.desc}</small><small>У вас: ${d.boosters[id] || 0}</small></div>
          <button class="buy-btn" data-buy-booster="${id}">${b.cost} 🪙</button>
        </div>`).join('');
    } else if (tab === 'themes') {
      box.innerHTML = CFG.THEMES.map(t => {
        const owned = d.themes.includes(t.id);
        const active = d.theme === t.id;
        return `<div class="shop-row glass" style="border-left:5px solid ${t.accent}">
          <div class="big" style="background:linear-gradient(${t.bg[0]},${t.bg[1]});border-radius:10px;width:44px;height:44px;display:flex;align-items:center;justify-content:center">🎨</div>
          <div class="info"><b>${t.name}</b><small>Власна музика та кольори поля</small></div>
          <button class="buy-btn" data-theme="${t.id}" ${active ? 'disabled' : ''}>
            ${active ? '✓ Активна' : owned ? 'Обрати' : t.cost + ' 💜'}</button>
        </div>`;
      }).join('');
    } else if (tab === 'premium') {
      box.innerHTML = `
        <div class="shop-row glass" style="border:1px solid var(--gold)">
          <div class="big">👑</div>
          <div class="info"><b>${CFG.SHOP.premium.name}</b>
          <small>Назавжди вимикає всю рекламу + 1000 💜 кристалів</small></div>
          <button class="buy-btn" data-iap="${CFG.SHOP.premium.id}" data-kind="premium" ${d.premium ? 'disabled' : ''}>
            ${d.premium ? '✓ Придбано' : CFG.SHOP.premium.price}</button>
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
      return `<div class="cal-day ${cls}">День ${i + 1}<span class="ico">${ico}</span>${val}</div>`;
    }).join('');
    const btn = this.$('btnClaimDaily');
    btn.disabled = claimedToday;
    btn.textContent = claimedToday ? 'Отримано ✓ (завтра нова нагорода)' : 'Отримати';

    this.$('missionList').innerHTML = d.missions.map((m, i) => `
      <div class="mission glass">
        <div class="info">
          <b>${m.text.replace('{n}', m.goal)}</b>
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
      <h2>🎡 Колесо фортуни</h2>
      <canvas id="wheelCanvas" width="260" height="260"></canvas>
      <button class="btn-3d btn-green" id="btnSpin">${free ? 'Безкоштовне крутіння!' : 'Крутити за 3 💜'}</button>
    `);
    this._drawWheel(0);
    this.$('btnSpin').onclick = () => this._spinWheel(!free);
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
      g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.textAlign = 'right';
      g.fillText(CFG.WHEEL[i].label, r - 10, 5);
      g.restore();
    }
    // Обід і стрілка
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
    g.lineWidth = 6; g.strokeStyle = '#f5b800'; g.stroke(); g.lineWidth = 1;
    g.fillStyle = '#f5b800';
    g.beginPath(); g.moveTo(cx - 12, 4); g.lineTo(cx + 12, 4); g.lineTo(cx, 30); g.closePath(); g.fill();
  },

  _spinWheel(paid) {
    const idx = Daily.spin(paid);
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
        <div class="info"><b>${a.name}</b>
          <div class="bar"><i style="width:${(v / a.goal * 100).toFixed(0)}%"></i></div>
        </div>
        <button class="buy-btn" data-ach="${a.id}" ${!done || claimed ? 'disabled' : ''}>
          ${claimed ? '✓' : a.reward + ' 🪙'}</button>
      </div>`;
    }).join('');
  },

  /* ---------------- Колекція ---------------- */
  renderCollection() {
    const coll = Storage.data.collection;
    this.$('collCount').textContent = `${coll.length}/${CFG.TILES.length}`;
    this.$('collGrid').innerHTML = CFG.TILES.map((t, i) => {
      const has = coll.includes(i);
      return `<div class="coll-cell ${has ? '' : 'unknown'}" title="${has ? t.name : '???'}" style="animation-delay:${i * 12}ms">${has ? t.g : '?'}</div>`;
    }).join('');
  },

  /* ---------------- Профіль ---------------- */
  renderProfile() {
    const d = Storage.data;
    const need = CFG.xpForLevel(d.profileLevel);
    const s = d.stats;
    this.$('profileContent').innerHTML = `
      <div class="profile-head glass">
        <div class="avatar" id="avatarBtn">${d.avatar}</div>
        <h3 id="nameBtn">${d.profileName} ✏️</h3>
        <div>Рівень профілю <b style="color:var(--gold)">${d.profileLevel}</b></div>
        <div class="xp-bar"><i style="width:${(d.xp / need * 100).toFixed(0)}%"></i></div>
        <small>${d.xp} / ${need} XP</small>
      </div>
      <div class="stat-grid">
        <div class="stat-cell glass"><b>${s.levelsCompleted}</b>Пройдено рівнів</div>
        <div class="stat-cell glass"><b>${s.totalStars}</b>Зірок здобуто</div>
        <div class="stat-cell glass"><b>${Utils.fmt(s.matches)}</b>Зібрано трійок</div>
        <div class="stat-cell glass"><b>${s.combos}</b>Комбо x3+</div>
        <div class="stat-cell glass"><b>${Utils.fmt(s.coinsEarned)}</b>Монет зароблено</div>
        <div class="stat-cell glass"><b>${s.chestsOpened}</b>Скринь відкрито</div>
        <div class="stat-cell glass"><b>${s.perfectLevels}</b>Ідеальних рівнів</div>
        <div class="stat-cell glass"><b>${d.daily.loginDays}</b>Днів у грі</div>
      </div>`;
    this.$('nameBtn').onclick = () => {
      const name = prompt('Ваше ім’я:', d.profileName);
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
        <div class="big">${c.g}</div>
        <h4>${c.name}</h4>
        <span class="cnt">У вас: ${d.chests[id]}</span>
        <button class="btn-3d btn-purple" style="font-size:14px;padding:9px 18px" data-chest="${id}" ${d.chests[id] ? '' : 'disabled'}>Відкрити</button>
      </div>`).join('');
  },

  openChest(kind) {
    const rewards = Chests.open(kind);
    if (!rewards) return;
    this.modal(`
      <h2>${CFG.CHESTS[kind].g} ${CFG.CHESTS[kind].name} скриня</h2>
      <div class="reward-row">${rewards.map(r => `<div class="reward-item"><span class="ico">${r.g}</span>${r.text}</div>`).join('')}</div>
      <button class="btn-3d btn-green" data-close>Чудово!</button>
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
      <h2>⚙️ Налаштування</h2>
      ${row('setMusic', '🎵', 'Музика', s.music)}
      ${row('setSound', '🔊', 'Звуки', s.sound)}
      ${row('setVibra', '📳', 'Вібрація', s.vibration)}
      <div class="setting-row"><span>🖼️ Якість графіки</span>
        <button class="buy-btn" id="setQuality">${s.quality === 'high' ? 'Висока' : 'Низька'}</button>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
        <button class="btn-3d btn-blue" style="font-size:13px;padding:10px 16px" id="btnSupport">Підтримка</button>
        <button class="btn-3d btn-purple" style="font-size:13px;padding:10px 16px" id="btnAbout">Про гру</button>
      </div>
    `);
    this.$('setMusic').onchange = e => { s.music = e.target.checked; Audio2.toggleMusic(s.music); Storage.save(); };
    this.$('setSound').onchange = e => { s.sound = e.target.checked; Storage.save(); };
    this.$('setVibra').onchange = e => { s.vibration = e.target.checked; Storage.save(); };
    this.$('setQuality').onclick = e => {
      s.quality = s.quality === 'high' ? 'low' : 'high';
      e.target.textContent = s.quality === 'high' ? 'Висока' : 'Низька';
      Storage.save();
    };
    this.$('btnSupport').onclick = () => this.toast('📧 support@mysticrelics.example');
    this.$('btnAbout').onclick = () => this.toast('Mystic Relics v1.0 — магічна головоломка');
  },

  /* ---------------- Ігрові модальні вікна ---------------- */
  showWin(stars, score, coins, gems, xp) {
    const starHtml = [1, 2, 3].map(i => `<span class="${i <= stars ? '' : 'off'}">⭐</span>`).join('');
    this.modal(`
      <div class="win-stars">${starHtml}</div>
      <h2>Чудово!</h2>
      <div style="font-weight:700;opacity:0.85">Рівень ${Game.levelNum}</div>
      <div style="font-size:24px;font-weight:900;color:var(--gold);margin:8px 0;text-shadow:0 2px 6px rgba(0,0,10,0.7)">
        Очки: <span id="winScore">0</span></div>
      <div class="reward-row">
        <div class="reward-item"><span class="ico">🪙</span>+${coins}</div>
        ${gems ? `<div class="reward-item"><span class="ico">💜</span>+${gems}</div>` : ''}
        <div class="reward-item"><span class="ico">⚡</span>+${xp} XP</div>
      </div>
      <button class="btn-3d btn-green btn-big" style="font-size:20px;padding:15px 42px" id="btnNextLevel">Далі ▶</button>
      <button class="btn-3d btn-blue" style="font-size:14px;padding:10px 22px" id="btnWinMenu">У меню</button>
    `, true);
    this.$('btnNextLevel').onclick = () => { this.closeModal(); Game.startLevel(Math.min(Game.levelNum + 1, CFG.TOTAL_LEVELS)); };
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
  },

  showRevive() {
    this.modal(`
      <h2>😱 Панель переповнена!</h2>
      <p style="opacity:0.85;margin:8px 0">Поверніть 3 плитки на поле та продовжуйте гру</p>
      <button class="btn-3d btn-purple" id="btnReviveGems">Продовжити за 5 💜</button>
      <button class="btn-3d btn-blue" id="btnReviveAd">📺 Продовжити за рекламу</button>
      <button class="btn-3d btn-gray" style="font-size:14px;padding:10px 22px" id="btnGiveUp">Здатися</button>
    `, true);
    this.$('btnReviveGems').onclick = () => { if (Game.revive()) this.closeModal(); };
    this.$('btnReviveAd').onclick = () => Game.reviveByAd();
    this.$('btnGiveUp').onclick = () => { this.closeModal(); Game.onLose('tray'); };
  },

  showLose(reason) {
    this.modal(`
      <h2>${reason === 'time' ? '⏱️ Час вичерпано!' : '💥 Поразка'}</h2>
      <div style="margin:8px 0;font-weight:700">Очки: <b style="color:var(--gold)">${Utils.fmt(Game.score)}</b></div>
      <p style="opacity:0.75;font-size:13.5px;margin-bottom:6px">Порада: використовуйте бустери, коли панель майже повна</p>
      <button class="btn-3d btn-green" id="btnRetry">🔄 Повторити</button>
      <button class="btn-3d btn-purple" style="font-size:15px" id="btnLoseShuffle">🔀 Перемішати і грати далі</button>
      <button class="btn-3d btn-blue" style="font-size:15px" id="btnLoseAd">📺 Продовжити за рекламу</button>
      <button class="btn-3d btn-gray" style="font-size:13px;padding:9px 20px" id="btnLoseMenu">У меню</button>
    `, true);
    this.$('modalOverlay').classList.add('dark');   // плавне затемнення
    this.$('btnRetry').onclick = () => { this.closeModal(); Game.startLevel(Game.levelNum); };
    this.$('btnLoseMenu').onclick = () => { this.closeModal(); Game.quitToMenu(); };
    // Другий шанс: перемішування поля (+30 с) або перегляд реклами
    this.$('btnLoseShuffle').onclick = () => {
      if ((Storage.data.boosters.shuffle || 0) < 1) { this.toast('Немає бустера «Перемішати» 🔀'); return; }
      Storage.data.boosters.shuffle--;
      Storage.save();
      this.closeModal();
      Game.secondChance();
    };
    this.$('btnLoseAd').onclick = () => Ads.showRewarded(() => { this.closeModal(); Game.secondChance(); });
  },

  showPause() {
    this.modal(`
      <h2>⏸️ Пауза</h2>
      <div style="margin:8px 0">Рівень ${Game.levelNum} • Очки: ${Utils.fmt(Game.score)}</div>
      <button class="btn-3d btn-green" id="btnResume">▶ Продовжити</button>
      <button class="btn-3d btn-blue" style="font-size:14px" id="btnRestart">🔄 Почати заново</button>
      <button class="btn-3d btn-gray" style="font-size:14px;padding:10px 22px" id="btnQuit">У меню</button>
    `, true);
    this.$('btnResume').onclick = () => { this.closeModal(); Game.resume(); };
    this.$('btnRestart').onclick = () => { this.closeModal(); Game.startLevel(Game.levelNum); };
    this.$('btnQuit').onclick = () => { this.closeModal(); Game.quitToMenu(); };
  },

  confirm(title, text, onYes) {
    this.modal(`
      <h2>${title}</h2>
      <p style="margin:10px 0;opacity:0.85">${text}</p>
      <button class="btn-3d btn-green" id="btnYes">Так</button>
      <button class="btn-3d btn-gray" data-close>Ні</button>
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
  },

  /* ---------------- Прив'язка подій ---------------- */
  bind() {
    // Навігація
    document.querySelectorAll('[data-nav]').forEach(b =>
      b.addEventListener('click', () => { Audio2.init(); Audio2.play('tap'); this.showScreen(b.dataset.nav); }));
    document.querySelectorAll('[data-back]').forEach(b =>
      b.addEventListener('click', () => { Audio2.play('tap'); this.showScreen('main'); }));

    this.$('btnPlay').onclick = () => { Audio2.init(); this.showScreen('levels'); };
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

    // Делеговані кліки: рівні, магазин, місії, досягнення, скрині, бустери
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-level],[data-buy-booster],[data-mission],[data-ach],[data-chest],[data-booster],[data-theme],[data-iap],[data-close]');
      if (!t) return;
      if (t.dataset.close !== undefined) { this.closeModal(); return; }
      if (t.dataset.level) { Audio2.init(); Game.startLevel(+t.dataset.level); return; }
      if (t.dataset.booster) { Boosters.use(t.dataset.booster); this.updateBoosterBar(); return; }
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
          if (d.gems < th.cost) { this.toast('Не вистачає кристалів 💜'); return; }
          Storage.addGems(-th.cost);
          d.themes.push(th.id);
        }
        d.theme = th.id;
        Storage.save();
        this.applyTheme();
        if (Storage.data.settings.music) Audio2.startMusic();
        this.toast(`🎨 Тема «${th.name}» активована`);
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
