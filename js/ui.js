/* ============================================================
   UI — екрани, меню, HUD, карта світу, модальні вікна,
   магазин, досягнення, квести, колесо фортуни, рейтинг
   ============================================================ */
const UI = (() => {
  let currentScreen = 'loading';
  let energyInterval = null;
  let toastTimer = null;

  /* ================= БАЗА ================= */

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    el.classList.add('active');
    currentScreen = id;
    if (id === 'menu') refreshMenu();
    if (id === 'game') refreshCompanion();
    if (id !== 'game') Game.stopLoop(); else Game.startLoop();
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = I18N.t(el.dataset.i18n);
    });
  }

  /** Створити модальне вікно; повертає елемент оверлею */
  function modal(html, opts = {}) {
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal">${opts.noClose ? '' : '<button class="modal-close">✕</button>'}${html}</div>`;
    document.getElementById('modal-root').appendChild(ov);
    if (!opts.noClose) {
      ov.querySelector('.modal-close').addEventListener('click', () => { AudioFX.sfx.click(); ov.remove(); opts.onClose && opts.onClose(); });
    }
    return ov;
  }

  function closeAllModals() {
    document.getElementById('modal-root').innerHTML = '';
  }

  function toast(msg) {
    let t = document.getElementById('ui-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ui-toast';
      document.getElementById('app').appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function fmtNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  /* ================= МЕНЮ ================= */

  function refreshMenu() {
    const s = Storage.s;
    Meta.syncEnergy();
    document.getElementById('menu-coins').textContent = fmtNum(s.coins);
    document.getElementById('menu-gems').textContent = fmtNum(s.gems);
    document.getElementById('menu-energy').textContent = `${s.energy}/${s.energyMax}`;
    document.getElementById('menu-level-label').textContent = `${I18N.t('level')} ${s.currentLevel} • ⭐ ${Levels.totalStars()}`;
    document.getElementById('play-sub').textContent = `${I18N.t('level')} ${s.currentLevel}`;
    document.getElementById('daily-badge').classList.toggle('hidden', !Meta.dailyAvailable());
    document.getElementById('quest-badge').classList.toggle('hidden', !(Meta.questsClaimable() || Meta.unclaimedCount() > 0));
    Ads.refreshBanner();

    // Таймер відновлення енергії
    clearInterval(energyInterval);
    energyInterval = setInterval(() => {
      Meta.syncEnergy();
      const s2 = Storage.s;
      document.getElementById('menu-energy').textContent = `${s2.energy}/${s2.energyMax}`;
      const left = Meta.energyTimeLeft();
      document.getElementById('energy-timer').textContent = left > 0
        ? `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` : '';
    }, 1000);
  }

  /* ================= ЗАПУСК ІГОР ================= */

  function tryStartAdventure(level) {
    Meta.syncEnergy();
    if (Storage.s.energy <= 0) { showEnergyModal(); return; }
    const cfg = Levels.generate(level);
    const go = () => {
      Meta.spendEnergy();
      show('game');
      Game.start(cfg, 'adventure');
    };
    // Банер нової механіки
    if (cfg.newMechanic && !Storage.s.seenMechanics.includes(cfg.newMechanic)) {
      Storage.s.seenMechanics.push(cfg.newMechanic);
      Storage.save();
      showMechanicModal(cfg.newMechanic, go);
    } else go();
  }

  function startMode(mode) {
    closeAllModals();
    const cfg = Levels.endlessConfig(mode);
    if (mode === 'daily') {
      // Щоденний виклик: ціль на очки за обмежені ходи
      cfg.goals = [{ type: 'score', target: 2500 }];
      cfg.moves = 25;
    }
    show('game');
    Game.start(cfg, mode);
  }

  /* ================= HUD ================= */

  const GOAL_ICONS = { score: '🎯', lines: '💥', crystals: '💎', ice: '❄️', chains: '⛓️', gold: '🪙' };

  function updateHUD() {
    const cfg = Game.config;
    if (!cfg) return;
    const lvlEl = document.getElementById('hud-level');
    if (Game.mode === 'adventure') lvlEl.textContent = `${I18N.t('level')} ${cfg.level}`;
    else lvlEl.textContent = I18N.t('mode_' + (Game.mode === 'timerush' ? 'timerush' : Game.mode)) || Game.mode;

    const goalsEl = document.getElementById('hud-goals');
    let html = '';
    for (const g of Game.goals) {
      const done = g.progress >= g.target;
      html += `<span class="hud-goal ${done ? 'goal-done' : ''}">${GOAL_ICONS[g.type] || '•'} ${fmtNum(Math.min(g.progress, g.target))}/${fmtNum(g.target)}</span>`;
    }
    if (Game.movesLeft !== Infinity) html += `<span class="hud-goal">🧩 ${Game.movesLeft}</span>`;
    if (cfg.timeLimit) {
      const t = Math.ceil(Game.timeLeft);
      const frozen = Game.freezeTime > 0;
      html += `<span class="hud-goal" style="${t <= 10 ? 'color:#ff7aa2' : ''}${frozen ? 'color:#8be9fd' : ''}">${frozen ? '🧊' : '⏱'} ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span>`;
    }
    goalsEl.innerHTML = html;
    document.getElementById('hud-coins').textContent = fmtNum(Storage.s.coins + Game.coinsEarned);
  }

  function setScore(n) {
    document.getElementById('hud-score').textContent = fmtNum(n);
  }

  function showCombo(text) {
    const el = document.getElementById('combo-pop');
    el.innerHTML = text.replace('\n', '<br>');
    el.classList.remove('show');
    void el.offsetWidth; // перезапуск анімації
    el.classList.add('show');
  }
  function hideCombo() {
    document.getElementById('combo-pop').classList.remove('show');
  }

  /* ---------- Компаньйон: дух-дракончик ----------
     Живе в кутку ігрового екрана, реагує на події,
     росте з прогресом гравця (4 стадії еволюції) */
  const COMP_STAGES = [
    { min: 1, icon: '🐣' },
    { min: 25, icon: '🐲' },
    { min: 75, icon: '🐉' },
    { min: 200, icon: '🐉', gold: true },
  ];
  let compEl = null, compBubbleTimer = null, compAnimTimer = null, compStageIcon = '';

  function initCompanion() {
    const wrap = document.getElementById('game-canvas-wrap');
    compEl = document.createElement('div');
    compEl.id = 'companion';
    compEl.innerHTML = '<span class="comp-emoji"></span>';
    wrap.appendChild(compEl);
    compEl.addEventListener('pointerdown', () => companionReact('tap'));
    refreshCompanion();
  }

  /** Стадія еволюції за поточним рівнем пригод */
  function refreshCompanion() {
    if (!compEl) return;
    let stage = COMP_STAGES[0];
    for (const s of COMP_STAGES) if (Storage.s.currentLevel >= s.min) stage = s;
    const emoji = compEl.querySelector('.comp-emoji');
    const evolved = compStageIcon && (compStageIcon !== stage.icon || stage.gold && !emoji.classList.contains('gold'));
    compStageIcon = stage.icon;
    emoji.textContent = stage.icon;
    emoji.classList.toggle('gold', !!stage.gold);
    if (evolved) companionSay(I18N.t('comp_evolved'));
  }

  /** Реакція на ігрову подію: анімація + інколи фраза */
  function companionReact(type) {
    if (!compEl || currentScreen !== 'game') return;
    const emoji = compEl.querySelector('.comp-emoji');
    const animCls = type === 'lose' ? 'comp-sad' : (type === 'mega' || type === 'win') ? 'comp-mega' : 'comp-happy';
    emoji.classList.remove('comp-happy', 'comp-sad', 'comp-mega');
    void emoji.offsetWidth; // перезапуск анімації
    emoji.classList.add(animCls);
    clearTimeout(compAnimTimer);
    compAnimTimer = setTimeout(() => emoji.classList.remove(animCls), 1200);

    // Фрази: рідше для звичайних клірів, завжди для великих подій
    const chance = { clear: 0.25, combo: 0.6, mega: 1, win: 1, lose: 1, tap: 1 }[type] || 0;
    if (Math.random() < chance) {
      const pool = I18N.t('comp_' + type).split('|');
      companionSay(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (type === 'tap') AudioFX.sfx.pickup();
  }

  function companionSay(text) {
    if (!compEl) return;
    let bubble = compEl.querySelector('.comp-bubble');
    if (bubble) bubble.remove();
    bubble = document.createElement('div');
    bubble.className = 'comp-bubble';
    bubble.textContent = text;
    compEl.appendChild(bubble);
    clearTimeout(compBubbleTimer);
    compBubbleTimer = setTimeout(() => bubble.remove(), 1600);
  }

  /* ---------- Туторіал перших кроків ---------- */
  let tutStep = 0;

  /** Прибрати всі підказки туторіалу (новий запуск гри) */
  function clearTutorial() {
    tutStep = 0;
    document.querySelectorAll('#game-canvas-wrap .tut-banner, #game-canvas-wrap .tut-hand')
      .forEach(el => el.remove());
  }

  /** Показати крок туторіалу: 1 — тягни фігуру, 2 — заповни лінію, 3 — готово */
  function showTutorial(step) {
    if (step === tutStep) return;
    tutStep = step;
    const wrap = document.getElementById('game-canvas-wrap');
    wrap.querySelectorAll('.tut-banner, .tut-hand').forEach(el => el.remove());

    const banner = document.createElement('div');
    banner.className = 'tut-banner';
    banner.textContent = I18N.t('tut_' + step);
    wrap.appendChild(banner);

    if (step < 3) {
      // Рука-підказка: над лотком (крок 1) або над проломом у рядку (крок 2)
      const hand = document.createElement('div');
      hand.className = 'tut-hand';
      hand.textContent = '👆';
      const rect = wrap.getBoundingClientRect();
      try {
        const L = Game.layout;
        if (step === 1) {
          hand.style.left = (L.slotW * 0.5 - 20) + 'px';
          hand.style.top = (L.trayY - 10) + 'px';
        } else {
          hand.style.left = (L.bx + 3.0 * L.cell) + 'px';
          hand.style.top = (L.by + 6.6 * L.cell) + 'px';
        }
      } catch (e) {
        hand.style.left = '45%';
        hand.style.bottom = '90px';
      }
      wrap.appendChild(hand);
    } else {
      // Фінальний крок зникає сам
      setTimeout(() => {
        banner.remove();
        tutStep = 0;
      }, 2400);
    }
  }

  /* ---------- Панель бустерів ---------- */
  const BOOSTER_ICONS = { hammer: '🔨', bomb: '💣', shuffle: '🔀', magnet: '🧲', undo: '↩️', freeze: '🧊' };

  function renderBoosters() {
    const bar = document.getElementById('boosters-bar');
    const list = ['hammer', 'bomb', 'shuffle', 'magnet', 'undo'];
    if (Game.config && Game.config.timeLimit) list.push('freeze');
    bar.innerHTML = list.map(b => {
      const count = Storage.s.boosters[b] || 0;
      return `<button class="booster-btn ${Game.armedBooster === b ? 'armed' : ''}" data-booster="${b}">
        ${BOOSTER_ICONS[b]}
        <span class="booster-count ${count === 0 ? 'zero' : ''}">${count === 0 ? '+' : count}</span>
      </button>`;
    }).join('');
    bar.querySelectorAll('[data-booster]').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioFX.sfx.click();
        Game.armBooster(btn.dataset.booster);
      });
    });
  }

  /* ================= КАРТА СВІТУ ================= */

  let mapWorld = 0;

  function openMap() {
    mapWorld = Levels.worldOf(Storage.s.currentLevel);
    show('map');
    renderWorldChips();
    renderMap();
  }

  function renderWorldChips() {
    const wrap = document.getElementById('map-worlds');
    wrap.innerHTML = Levels.WORLDS.map((w, i) => {
      const unlocked = Storage.s.currentLevel > i * Levels.LEVELS_PER_WORLD;
      return `<button class="world-chip ${i === mapWorld ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-world="${i}">
        ${w.icon} ${I18N.t(w.key)}</button>`;
    }).join('');
    wrap.querySelectorAll('[data-world]').forEach(chip => {
      chip.addEventListener('click', () => {
        const wi = +chip.dataset.world;
        if (Storage.s.currentLevel <= wi * Levels.LEVELS_PER_WORLD) { AudioFX.sfx.error(); toast(I18N.t('locked')); return; }
        AudioFX.sfx.click();
        mapWorld = wi;
        renderWorldChips();
        renderMap();
      });
    });
  }

  /** Рендер звивистого шляху рівнів обраного світу */
  function renderMap() {
    const world = Levels.WORLDS[mapWorld];
    const content = document.getElementById('map-content');
    const scroll = document.getElementById('map-scroll');
    document.getElementById('map-world-name').textContent = `${world.icon} ${I18N.t(world.key)}`;
    document.getElementById('map-stars').textContent = `${Levels.worldStars(mapWorld)}/${Levels.LEVELS_PER_WORLD * 3}`;

    const from = mapWorld * Levels.LEVELS_PER_WORLD + 1;
    const count = Levels.LEVELS_PER_WORLD;
    const stepY = 92;
    const H = count * stepY + 140;
    const W = scroll.clientWidth || 360;
    content.style.height = H + 'px';
    content.style.background = `linear-gradient(180deg, hsla(${world.hue}, 60%, 22%, 0.35), hsla(${world.hue}, 70%, 10%, 0.15))`;

    // Позиції вузлів: знизу вгору, синусоїда
    const pts = [];
    for (let i = 0; i < count; i++) {
      const y = H - 90 - i * stepY;
      const x = W / 2 + Math.sin(i * 0.55) * W * 0.30;
      pts.push({ x, y, lvl: from + i });
    }

    // SVG шлях
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], pr = pts[i - 1];
      path += ` Q ${pr.x} ${(pr.y + p.y) / 2}, ${(pr.x + p.x) / 2} ${(pr.y + p.y) / 2} T ${p.x} ${p.y}`;
    }
    let html = `<svg class="map-path-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <path d="${path}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 18"/>
    </svg>`;

    // Вузли рівнів
    const cur = Storage.s.currentLevel;
    const rngDeco = Levels.mulberry32(mapWorld * 999 + 7);
    for (const p of pts) {
      const stars = Storage.s.levels[p.lvl] || 0;
      const cls = p.lvl < cur ? 'done' : p.lvl === cur ? 'current' : 'locked';
      const deco = rngDeco() < 0.3 ? `<span class="node-deco">${world.deco[Math.floor(rngDeco() * world.deco.length)]}</span>` : '';
      html += `<button class="map-node ${cls}" style="left:${p.x}px;top:${p.y}px" data-level="${p.lvl}">
        ${deco}${p.lvl}
        <span class="node-stars">${stars > 0 ? '★'.repeat(stars) : (p.lvl <= cur ? '' : '🔒')}</span>
      </button>`;
    }
    content.innerHTML = html;

    content.querySelectorAll('[data-level]').forEach(node => {
      node.addEventListener('click', () => {
        const lvl = +node.dataset.level;
        if (lvl > Storage.s.currentLevel) { AudioFX.sfx.error(); return; }
        AudioFX.sfx.click();
        tryStartAdventure(lvl);
      });
    });

    // Прокрутити до поточного рівня
    const curPt = pts.find(p => p.lvl === cur) || pts[pts.length - 1];
    requestAnimationFrame(() => {
      scroll.scrollTop = Math.max(0, curPt.y - scroll.clientHeight * 0.6);
    });
  }

  /* ================= МОДАЛКИ ГРИ ================= */

  function showWinModal({ stars, score, reward }) {
    AudioFX.vibrate([30, 40, 60]);
    Notify.requestPermission(); // питаємо після позитивної емоції, не на старті
    const starsHtml = [1, 2, 3].map(i =>
      `<span class="${i <= stars ? 'star-on' : 'star-off'}">★</span>`).join('');
    const gemsRow = reward.gems ? `<div class="modal-sub">💎 +${reward.gems}</div>` : '';
    const ov = modal(`
      <h2>${I18N.t('victory')}</h2>
      <div class="modal-stars">${starsHtml}</div>
      <div class="modal-big-num">${fmtNum(score)}</div>
      <div class="modal-sub">🪙 +${reward.coins}</div>${gemsRow}
      <button class="btn btn-green btn-ad" data-a="double">📺 ${I18N.t('double_reward')}</button>
      <button class="btn btn-primary" data-a="next">${I18N.t('next')} ▶</button>
      <button class="btn btn-ghost" data-a="menu">${I18N.t('menu')}</button>
    `, { noClose: true });
    stars >= 1 && setTimeout(() => AudioFX.sfx.star(0), 100);
    stars >= 2 && setTimeout(() => AudioFX.sfx.star(1), 350);
    stars >= 3 && setTimeout(() => AudioFX.sfx.star(2), 600);

    ov.querySelector('[data-a="double"]').addEventListener('click', function () {
      this.disabled = true;
      Ads.showRewarded(() => {
        Meta.addCoins(reward.coins);
        AudioFX.sfx.reward();
        toast(`🪙 +${reward.coins}`);
        refreshMenu();
      });
    });
    ov.querySelector('[data-a="next"]').addEventListener('click', () => {
      AudioFX.sfx.click();
      ov.remove();
      Ads.maybeInterstitial(() => {
        if (Game.mode === 'adventure') tryStartAdventure(Storage.s.currentLevel);
        else show('menu');
      });
    });
    ov.querySelector('[data-a="menu"]').addEventListener('click', () => {
      AudioFX.sfx.click();
      ov.remove();
      Ads.maybeInterstitial(() => show('menu'));
    });
  }

  function showLoseModal({ reason, canRevive, score, result }) {
    AudioFX.vibrate(60);
    const isEndless = !Game.goals.length;
    const title = isEndless ? I18N.t('game_over') : I18N.t('defeat');
    const sub = reason === 'moves' ? I18N.t('out_of_moves') : reason === 'time' ? '⏱' : I18N.t('no_space');
    const record = result && result.isRecord ? `<div class="modal-sub" style="color:#ffd166">🏆 ${I18N.t('new_record')}</div>` : '';
    const ov = modal(`
      <h2>${title}</h2>
      <div class="modal-sub">${sub}</div>
      <div class="modal-big-num">${fmtNum(score)}</div>
      ${record}
      <div class="modal-sub">🪙 +${result ? result.coins : 0}</div>
      ${canRevive ? `<button class="btn btn-green btn-ad" data-a="revive">📺 ${I18N.t('revive')} (${I18N.t('extra_moves')})</button>` : ''}
      <button class="btn btn-primary" data-a="retry">${I18N.t('retry')} ↻</button>
      <button class="btn btn-ghost" data-a="menu">${I18N.t('menu')}</button>
    `, { noClose: true });

    if (canRevive) {
      ov.querySelector('[data-a="revive"]').addEventListener('click', () => {
        Ads.showRewarded(() => {
          ov.remove();
          Game.revive();
        });
      });
    }
    ov.querySelector('[data-a="retry"]').addEventListener('click', () => {
      AudioFX.sfx.click();
      ov.remove();
      Ads.maybeInterstitial(() => {
        if (Game.mode === 'adventure') tryStartAdventure(Game.config.level);
        else startMode(Game.mode);
      });
    });
    ov.querySelector('[data-a="menu"]').addEventListener('click', () => {
      AudioFX.sfx.click();
      ov.remove();
      Ads.maybeInterstitial(() => show('menu'));
    });
  }

  function showPauseModal() {
    if (Game.state !== 'playing') return;
    Game.setPaused(true);
    const ov = modal(`
      <h2>${I18N.t('paused')}</h2>
      <button class="btn btn-primary" data-a="resume">▶ ${I18N.t('resume')}</button>
      <button class="btn btn-ghost" data-a="restart">↻ ${I18N.t('restart')}</button>
      <button class="btn btn-ghost" data-a="settings">⚙️ ${I18N.t('settings')}</button>
      <button class="btn btn-ghost" data-a="menu">🏠 ${I18N.t('menu')}</button>
    `, { noClose: true });
    ov.querySelector('[data-a="resume"]').addEventListener('click', () => { AudioFX.sfx.click(); ov.remove(); Game.setPaused(false); });
    ov.querySelector('[data-a="restart"]').addEventListener('click', () => {
      AudioFX.sfx.click(); ov.remove();
      if (Game.mode === 'adventure') tryStartAdventure(Game.config.level);
      else startMode(Game.mode);
    });
    ov.querySelector('[data-a="settings"]').addEventListener('click', () => { AudioFX.sfx.click(); showSettings(); });
    ov.querySelector('[data-a="menu"]').addEventListener('click', () => { AudioFX.sfx.click(); ov.remove(); show('menu'); });
  }

  function showMechanicModal(mech, onStart) {
    const icons = { gold: '🪙', crystal: '💎', ice: '❄️', chain: '⛓️', bomb: '💣', rainbow: '🌈', shield: '🛡️', fog: '☁️', portal: '🌀' };
    AudioFX.sfx.unlock();
    const ov = modal(`
      <h2>${I18N.t('new_mechanic')}</h2>
      <div style="text-align:center;font-size:64px" class="float">${icons[mech]}</div>
      <div class="modal-sub" style="font-size:15px">${I18N.t('mech_' + mech)}</div>
      <button class="btn btn-primary" data-a="go">${I18N.t('play')}</button>
    `, { noClose: true });
    ov.querySelector('[data-a="go"]').addEventListener('click', () => { AudioFX.sfx.click(); ov.remove(); onStart(); });
  }

  function showEnergyModal() {
    const ov = modal(`
      <h2>⚡ ${I18N.t('no_energy')}</h2>
      <div class="modal-sub">${I18N.t('energy_refill')}</div>
      <button class="btn btn-green btn-ad" data-a="ad">📺 ${I18N.t('get_energy_ad')}</button>
      <button class="btn btn-primary" data-a="gems">💎 5 — ${I18N.t('energy_refill')}</button>
    `);
    ov.querySelector('[data-a="ad"]').addEventListener('click', () => {
      Ads.showRewarded(() => { Meta.addEnergy(1); AudioFX.sfx.reward(); ov.remove(); refreshMenu(); });
    });
    ov.querySelector('[data-a="gems"]').addEventListener('click', () => {
      if (Storage.s.gems >= 5) {
        Storage.s.gems -= 5;
        Meta.addEnergy(Storage.s.energyMax);
        Storage.save();
        AudioFX.sfx.reward();
        ov.remove();
        refreshMenu();
      } else { AudioFX.sfx.error(); openShop('premium'); }
    });
  }

  /* ================= МАГАЗИН ================= */

  function openShop(tab = 'themes') {
    closeAllModals();
    const ov = modal(`
      <h2>🛍️ ${I18N.t('shop_title')}</h2>
      <div style="text-align:center;margin-bottom:10px">
        <span class="res-pill" style="display:inline-flex">🪙 <b id="shop-coins">${fmtNum(Storage.s.coins)}</b></span>
        <span class="res-pill" style="display:inline-flex">💎 <b id="shop-gems">${fmtNum(Storage.s.gems)}</b></span>
      </div>
      <div class="shop-tabs">
        ${['themes', 'blocks', 'fx', 'boosters', 'premium'].map(t =>
          `<button class="shop-tab ${t === tab ? 'active' : ''}" data-tab="${t}">${I18N.t('tab_' + t)}</button>`).join('')}
      </div>
      <div id="shop-body"></div>
    `);
    const body = ov.querySelector('#shop-body');
    const renderTab = (t) => {
      ov.querySelectorAll('.shop-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
      if (t === 'premium') renderPremium(body, ov);
      else if (t === 'boosters') renderBoosterShop(body, ov);
      else renderCosmetics(body, ov, t);
    };
    ov.querySelectorAll('.shop-tab').forEach(el =>
      el.addEventListener('click', () => { AudioFX.sfx.click(); renderTab(el.dataset.tab); }));
    renderTab(tab);
  }

  function updateShopCurrency(ov) {
    const c = ov.querySelector('#shop-coins'), g = ov.querySelector('#shop-gems');
    if (c) c.textContent = fmtNum(Storage.s.coins);
    if (g) g.textContent = fmtNum(Storage.s.gems);
    refreshMenu();
  }

  function renderCosmetics(body, ov, cat) {
    const source = cat === 'themes' ? Game.THEMES : cat === 'blocks' ? Game.BLOCK_STYLES : Game.FX_STYLES;
    const equippedKey = cat === 'themes' ? 'theme' : cat;
    body.innerHTML = `<div class="shop-grid">` + Meta.SHOP[cat].map(item => {
      const meta = source[item.id];
      const owned = Storage.s.owned[cat].includes(item.id);
      const equipped = Storage.s.equipped[equippedKey] === item.id;
      const swatch = cat === 'themes'
        ? `<div class="si-swatch">${meta.colors.slice(0, 5).map(c => `<i style="background:${c}"></i>`).join('')}</div>` : '';
      return `<div class="shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}" data-id="${item.id}">
        <div class="si-ico">${meta.icon}</div>
        <div class="si-name">${meta.name}</div>${swatch}
        <div class="si-price">${equipped ? I18N.t('equipped') : owned ? I18N.t('owned') : item.price === 0 ? I18N.t('free') : '🪙 ' + item.price}</div>
      </div>`;
    }).join('') + `</div>`;
    body.querySelectorAll('.shop-item').forEach(el => {
      el.addEventListener('click', () => {
        const ok = Meta.buyCosmetic(cat, el.dataset.id);
        if (ok) { AudioFX.sfx.coin(); renderCosmetics(body, ov, cat); updateShopCurrency(ov); }
        else { AudioFX.sfx.error(); toast(I18N.t('not_enough_coins')); }
      });
    });
  }

  function renderBoosterShop(body, ov) {
    body.innerHTML = Meta.SHOP.boosters.map(b => `
      <div class="list-row">
        <div class="lr-ico">${b.icon}</div>
        <div class="lr-body">
          <div class="lr-title">${I18N.t('booster_' + b.id)}</div>
          <div class="lr-sub">x${Storage.s.boosters[b.id] || 0}</div>
        </div>
        <button class="claim-btn" data-buy="${b.id}" style="animation:none">🪙 ${b.price}</button>
      </div>`).join('');
    body.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Meta.buyBooster(btn.dataset.buy)) {
          AudioFX.sfx.coin();
          renderBoosterShop(body, ov);
          updateShopCurrency(ov);
          if (currentScreen === 'game') renderBoosters();
        } else { AudioFX.sfx.error(); toast(I18N.t('not_enough_coins')); }
      });
    });
  }

  function renderPremium(body, ov) {
    const s = Storage.s;
    body.innerHTML = `
      ${s.removeAds ? `<div class="modal-sub">${I18N.t('remove_ads_owned')}</div>` : `
      <div class="list-row">
        <div class="lr-ico">🚫</div>
        <div class="lr-body">
          <div class="lr-title">${I18N.t('premium_noads')}</div>
          <div class="lr-sub">${I18N.t('premium_noads_d')}</div>
        </div>
        <button class="claim-btn" data-iap="remove_ads" style="animation:none">$2.99</button>
      </div>`}
      <div class="list-row">
        <div class="lr-ico">📺</div>
        <div class="lr-body"><div class="lr-title">${I18N.t('watch_ad')}</div>
        <div class="lr-sub">${I18N.t('ad_reward_coins', { n: 100 })}</div></div>
        <button class="claim-btn" data-adcoins="1" style="animation:none">📺</button>
      </div>
      ${[['coins_small', '🪙', '1 000 ' + I18N.t('coins_pack'), '$0.99'],
         ['coins_medium', '💰', '6 000 ' + I18N.t('coins_pack'), '$4.99'],
         ['coins_large', '🏆', '15 000 ' + I18N.t('coins_pack'), '$9.99'],
         ['gems_small', '💎', '50 ' + I18N.t('gems_pack'), '$1.99']].map(([id, ico, label, price]) => `
      <div class="list-row">
        <div class="lr-ico">${ico}</div>
        <div class="lr-body"><div class="lr-title">${label}</div></div>
        <button class="claim-btn" data-iap="${id}" style="animation:none">${price}</button>
      </div>`).join('')}
    `;
    body.querySelectorAll('[data-iap]').forEach(btn => {
      btn.addEventListener('click', () => {
        Ads.purchase(btn.dataset.iap, () => {
          AudioFX.sfx.reward();
          toast('✅');
          renderPremium(body, ov);
          updateShopCurrency(ov);
        });
      });
    });
    const adBtn = body.querySelector('[data-adcoins]');
    adBtn && adBtn.addEventListener('click', () => {
      Ads.showRewarded(() => {
        Meta.addCoins(100);
        AudioFX.sfx.reward();
        updateShopCurrency(ov);
        toast('🪙 +100');
      });
    });
  }

  /* ================= ДОСЯГНЕННЯ ================= */

  function openAchievements() {
    const list = Meta.allAchievements();
    // Сортування: доступні до отримання -> у прогресі -> отримані
    list.sort((a, b) => rank(a) - rank(b));
    function rank(a) {
      const claimed = Storage.s.claimedAchievements.includes(a.id);
      if (claimed) return 2;
      return Meta.achievementDone(a) ? 0 : 1;
    }
    const ov = modal(`
      <h2>🎖️ ${I18N.t('achievements_title')}</h2>
      <div class="modal-sub">${Storage.s.claimedAchievements.length}/${list.length}</div>
      <div id="ach-list"></div>
    `);
    const render = () => {
      ov.querySelector('#ach-list').innerHTML = list.map((a, i) => {
        const done = Meta.achievementDone(a);
        const claimed = Storage.s.claimedAchievements.includes(a.id);
        const prog = Meta.achievementProgress(a);
        return `<div class="list-row ${done ? 'done' : ''}">
          <div class="lr-ico" style="${claimed ? '' : done ? '' : 'filter:grayscale(0.8);opacity:0.6'}">${a.icon}</div>
          <div class="lr-body">
            <div class="lr-title">${a.name}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${(prog / a.target) * 100}%"></div></div>
            <div class="lr-sub">${fmtNum(prog)}/${fmtNum(a.target)}</div>
          </div>
          ${claimed ? '<div class="lr-right">✅</div>' :
            done ? `<button class="claim-btn" data-claim="${i}">🪙 ${a.reward}</button>` :
            `<div class="lr-right">🪙 ${a.reward}</div>`}
        </div>`;
      }).join('');
      ov.querySelectorAll('[data-claim]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Meta.claimAchievement(list[+btn.dataset.claim])) {
            AudioFX.sfx.reward();
            render();
            refreshMenu();
          }
        });
      });
    };
    render();
  }

  /* ================= КВЕСТИ ================= */

  function openQuests() {
    const quests = Meta.getDailyQuests();
    const ov = modal(`
      <h2>📜 ${I18N.t('quests_title')}</h2>
      <div id="quest-list"></div>
    `);
    const render = () => {
      const allDone = quests.every(q => q.claimed);
      ov.querySelector('#quest-list').innerHTML = quests.map((q, i) => `
        <div class="list-row ${q.progress >= q.target ? 'done' : ''}">
          <div class="lr-ico">${q.icon}</div>
          <div class="lr-body">
            <div class="lr-title">${Meta.questNames(q.metric, q.target)}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${(q.progress / q.target) * 100}%"></div></div>
            <div class="lr-sub">${q.progress}/${q.target}</div>
          </div>
          ${q.claimed ? '<div class="lr-right">✅</div>' :
            q.progress >= q.target ? `<button class="claim-btn" data-claim="${i}">🪙 ${q.reward}</button>` :
            `<div class="lr-right">🪙 ${q.reward}</div>`}
        </div>`).join('') + (allDone ? `<div class="modal-sub">${I18N.t('all_done')}</div>` : '');
      ov.querySelectorAll('[data-claim]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (Meta.claimQuest(quests[+btn.dataset.claim])) {
            AudioFX.sfx.reward();
            Storage.save();
            render();
            refreshMenu();
          }
        });
      });
    };
    render();
  }

  /* ================= ЩОДЕННА НАГОРОДА: КОЛЕСО ================= */

  function openDaily() {
    const s = Storage.s;
    const canSpin = Meta.dailyAvailable();
    const canChallenge = s.dailyChallengeDone !== Meta.todayKey();
    const streakHtml = [1, 2, 3, 4, 5, 6, 7].map(d => `
      <div class="streak-day ${d <= s.dailyStreak ? 'claimed' : ''} ${d === s.dailyStreak + 1 && canSpin ? 'today' : ''}">
        <b>${d}</b>${I18N.t('day')}</div>`).join('');
    const ov = modal(`
      <h2>🎡 ${I18N.t('daily_reward')}</h2>
      <div class="modal-sub">${I18N.t('streak')}: ${s.dailyStreak}🔥</div>
      <div class="streak-row">${streakHtml}</div>
      <div class="wheel-wrap">
        <div class="wheel-pointer">🔻</div>
        <canvas id="wheel-canvas" width="520" height="520"></canvas>
      </div>
      <button class="btn btn-primary" id="spin-btn" ${canSpin ? '' : 'disabled'}>${canSpin ? I18N.t('spin') : I18N.t('come_tomorrow')}</button>
      <button class="btn btn-green" id="daily-ch-btn" ${canChallenge ? '' : 'disabled'}>🧩 ${I18N.t('daily_challenge')}</button>
    `);
    const cv = ov.querySelector('#wheel-canvas');
    drawWheel(cv, 0);
    ov.querySelector('#spin-btn').addEventListener('click', function () {
      if (!Meta.dailyAvailable()) return;
      this.disabled = true;
      const result = Meta.spinWheel();
      spinAnimation(cv, result.index, () => {
        AudioFX.sfx.reward();
        Particles.flash();
        const p = result.prize;
        const label = p.coins ? `🪙 +${p.coins}` : p.gems ? `💎 +${p.gems}` : `${p.icon} +1`;
        toast(label);
        this.textContent = I18N.t('come_tomorrow');
        refreshMenu();
      });
    });
    ov.querySelector('#daily-ch-btn').addEventListener('click', () => {
      AudioFX.sfx.click();
      startMode('daily');
    });
  }

  function drawWheel(cv, angle) {
    const ctx = cv.getContext('2d');
    const R = cv.width / 2;
    const n = Meta.WHEEL_PRIZES.length;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(angle);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R - 8, a0, a1);
      ctx.closePath();
      ctx.fillStyle = `hsla(${(i * 360) / n + 220}, 65%, ${i % 2 ? 38 : 30}%, 0.95)`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Приз
      ctx.save();
      ctx.rotate((a0 + a1) / 2);
      ctx.translate(R * 0.62, 0);
      ctx.rotate(Math.PI / 2);
      ctx.font = '52px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const p = Meta.WHEEL_PRIZES[i];
      ctx.fillText(p.icon, 0, -12);
      ctx.font = '900 30px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(p.coins ? p.coins : p.gems ? 'x' + p.gems : '', 0, 30);
      ctx.restore();
    }
    // Центр
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.restore();
  }

  function spinAnimation(cv, targetIndex, onDone) {
    const n = Meta.WHEEL_PRIZES.length;
    // Вказівник зверху = кут -90°; цільовий сектор має опинитись під ним
    const target = -Math.PI / 2 - ((targetIndex + 0.5) / n) * Math.PI * 2;
    const total = target - Math.PI * 2 * 5; // 5 повних обертів
    const dur = 3800;
    const t0 = performance.now();
    let lastTick = 0;
    (function frame(t) {
      const k = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - k, 3);
      const angle = total * ease;
      drawWheel(cv, angle);
      // Клацання секторів
      const seg = Math.floor(Math.abs(angle) / (Math.PI * 2 / n));
      if (seg !== lastTick) { lastTick = seg; AudioFX.sfx.wheel(); }
      if (k < 1) requestAnimationFrame(frame);
      else onDone();
    })(t0);
  }

  /* ================= ПОДІЇ / РЕЖИМИ ================= */

  function openEvents() {
    const s = Storage.s;
    const tl = Meta.tournamentTimeLeft();
    const tlStr = `${Math.floor(tl / 86400000)}${I18N.t('days_short')} ${Math.floor(tl / 3600000) % 24}${I18N.t('hours_short')}`;
    const modes = [
      ['classic', '♾️', s.bests.classic],
      ['timerush', '⏱', s.bests.timerush],
      ['infinity', '🧘', s.bests.infinity],
      ['hardcore', '💀', s.bests.hardcore],
      ['tournament', '🏆', s.bests.tournament],
    ];
    const ov = modal(`
      <h2>🏆 ${I18N.t('events_title')}</h2>
      ${modes.map(([m, ico, best]) => `
        <div class="mode-card" data-mode="${m}">
          <div class="mc-ico">${ico}</div>
          <div>
            <div class="mc-title">${I18N.t('mode_' + m)}</div>
            <div class="mc-sub">${I18N.t('mode_' + m + '_d')}${m === 'tournament' ? ` • ${I18N.t('tournament_ends')} ${tlStr}` : ''}</div>
          </div>
          <div class="mc-best">${best > 0 ? '🏅 ' + fmtNum(best) : ''}</div>
        </div>`).join('')}
    `);
    ov.querySelectorAll('[data-mode]').forEach(card => {
      card.addEventListener('click', () => {
        AudioFX.sfx.click();
        startMode(card.dataset.mode);
      });
    });
  }

  /* ================= РЕЙТИНГ ================= */

  function openLeaderboard() {
    const board = Meta.tournamentBoard();
    const s = Storage.s;
    modal(`
      <h2>🥇 ${I18N.t('leaderboard_title')}</h2>
      <div class="modal-sub">${I18N.t('weekly_board')} • ${Levels.getWeekId()}</div>
      ${board.map((row, i) => `
        <div class="list-row" style="${row.me ? 'border-color:var(--accent);box-shadow:0 0 12px rgba(94,234,212,0.3)' : ''}">
          <div class="lr-ico">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</div>
          <div class="lr-body"><div class="lr-title">${row.me ? '⭐ ' + row.name : row.name}</div></div>
          <div class="lr-right">${fmtNum(row.score)}</div>
        </div>`).join('')}
      <div class="modal-sub" style="margin-top:10px">${I18N.t('your_best')}:
        ♾️ ${fmtNum(s.bests.classic)} • ⏱ ${fmtNum(s.bests.timerush)} • 💀 ${fmtNum(s.bests.hardcore)}</div>
    `);
  }

  /* ================= КОЛЕКЦІЯ ================= */

  function openCollection() {
    const s = Storage.s;
    const sections = [
      ['themes', Game.THEMES, 'theme'],
      ['blocks', Game.BLOCK_STYLES, 'blocks'],
      ['fx', Game.FX_STYLES, 'fx'],
    ];
    const ov = modal(`
      <h2>📦 ${I18N.t('collection_title')}</h2>
      <div id="col-body"></div>
    `);
    const render = () => {
      ov.querySelector('#col-body').innerHTML = sections.map(([cat, source, eqKey]) => `
        <div class="modal-sub" style="text-align:left;font-weight:800">${I18N.t('tab_' + cat)}</div>
        <div class="shop-grid" style="margin-bottom:12px">
          ${s.owned[cat].map(id => {
            const meta = source[id];
            const equipped = s.equipped[eqKey] === id;
            return `<div class="shop-item owned ${equipped ? 'equipped' : ''}" data-cat="${cat}" data-id="${id}">
              <div class="si-ico">${meta.icon}</div>
              <div class="si-name">${meta.name}</div>
              <div class="si-price">${equipped ? I18N.t('equipped') : I18N.t('owned')}</div>
            </div>`;
          }).join('')}
        </div>`).join('');
      ov.querySelectorAll('.shop-item').forEach(el => {
        el.addEventListener('click', () => {
          AudioFX.sfx.click();
          Meta.buyCosmetic(el.dataset.cat, el.dataset.id);
          render();
        });
      });
    };
    render();
  }

  /* ================= НАЛАШТУВАННЯ ================= */

  function showSettings() {
    const s = Storage.s.settings;
    const ov = modal(`
      <h2>⚙️ ${I18N.t('settings')}</h2>
      <div class="setting-row"><span>🔊 ${I18N.t('sound')}</span><div class="toggle ${s.sound ? 'on' : ''}" data-t="sound"></div></div>
      <div class="setting-row"><span>🎵 ${I18N.t('music')}</span><div class="toggle ${s.music ? 'on' : ''}" data-t="music"></div></div>
      <div class="setting-row"><span>📳 ${I18N.t('vibration')}</span><div class="toggle ${s.vibration ? 'on' : ''}" data-t="vibration"></div></div>
      <div class="setting-row"><span>🌐 ${I18N.t('language')}</span>
        <button class="claim-btn" id="lang-btn" style="animation:none">${I18N.getLang().toUpperCase()}</button></div>
      <button class="btn btn-ghost" id="reset-btn" style="color:#ff7aa2">🗑 ${I18N.t('reset_progress')}</button>
    `);
    ov.querySelectorAll('.toggle').forEach(t => {
      t.addEventListener('click', () => {
        const key = t.dataset.t;
        s[key] = !s[key];
        t.classList.toggle('on', s[key]);
        Storage.save();
        AudioFX.sfx.click();
        if (key === 'music') { s.music ? AudioFX.startMusic() : AudioFX.stopMusic(); }
      });
    });
    ov.querySelector('#lang-btn').addEventListener('click', () => {
      s.lang = I18N.getLang() === 'ua' ? 'en' : 'ua';
      Storage.saveNow();
      location.reload();
    });
    ov.querySelector('#reset-btn').addEventListener('click', () => {
      if (confirm(I18N.t('reset_confirm'))) {
        Storage.reset();
        location.reload();
      }
    });
  }

  /* ================= ОБРОБНИКИ ДІЙ ================= */

  function bindActions() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const a = btn.dataset.action;
      AudioFX.sfx.click();
      switch (a) {
        case 'play': tryStartAdventure(Storage.s.currentLevel); break;
        case 'adventure': openMap(); break;
        case 'daily': openDaily(); break;
        case 'events': openEvents(); break;
        case 'shop': case 'shop-coins': openShop(a === 'shop-coins' ? 'premium' : 'themes'); break;
        case 'collection': openCollection(); break;
        case 'quests': openQuests(); break;
        case 'leaderboard': openLeaderboard(); break;
        case 'achievements': openAchievements(); break;
        case 'settings': showSettings(); break;
        case 'back': show('menu'); break;
        case 'pause': showPauseModal(); break;
      }
    });
  }

  /* ---------- Фонові частинки меню ---------- */
  function spawnBgParticles() {
    const app = document.getElementById('app');
    const colors = ['#5eead4', '#a78bfa', '#ff5c8a', '#ffd166', '#4dc9ff'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      p.className = 'bg-particle';
      const size = 3 + Math.random() * 6;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;` +
        `background:${colors[i % colors.length]};box-shadow:0 0 ${size * 2}px ${colors[i % colors.length]};` +
        `animation-duration:${9 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s`;
      app.appendChild(p);
    }
  }

  return {
    show, applyI18n, refreshMenu, bindActions, spawnBgParticles,
    updateHUD, setScore, showCombo, hideCombo, renderBoosters, toast, showTutorial, clearTutorial,
    initCompanion, companionReact, refreshCompanion,
    showWinModal, showLoseModal, showPauseModal, openShop, openMap,
    tryStartAdventure, startMode, closeAllModals,
  };
})();
