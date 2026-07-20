/* ============================================================
   GAME — ігровий контролер:
   рендер поля на Canvas 2D, drag&drop фігур, очки, комбо,
   цілі, бустери, режими (classic/adventure/daily/infinity/
   timerush/hardcore/tournament), win/lose
   ============================================================ */
const Game = (() => {
  /* ---------- Теми оформлення (продаються в крамниці) ---------- */
  const THEMES = {
    neon: {
      name: 'Neon Night', icon: '🌃',
      colors: ['#ff5c8a', '#ffb545', '#ffe14d', '#7ef29d', '#4dc9ff', '#a78bfa', '#ff8ce0'],
      boardCell: 'rgba(255,255,255,0.055)', boardLine: 'rgba(255,255,255,0.10)',
    },
    sunset: {
      name: 'Sunset Magic', icon: '🌅',
      colors: ['#ff6b6b', '#ffa94d', '#ffd43b', '#fca5f1', '#b197fc', '#66d9e8', '#ff8787'],
      boardCell: 'rgba(255,200,150,0.07)', boardLine: 'rgba(255,200,150,0.12)',
    },
    ocean: {
      name: 'Deep Ocean', icon: '🌊',
      colors: ['#22d3ee', '#38bdf8', '#818cf8', '#34d399', '#2dd4bf', '#60a5fa', '#a5f3fc'],
      boardCell: 'rgba(120,220,255,0.06)', boardLine: 'rgba(120,220,255,0.11)',
    },
    candy: {
      name: 'Candy Land', icon: '🍭',
      colors: ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#c084fc', '#fda4af'],
      boardCell: 'rgba(255,180,220,0.07)', boardLine: 'rgba(255,180,220,0.12)',
    },
    royal: {
      name: 'Royal Gold', icon: '👑',
      colors: ['#fbbf24', '#f59e0b', '#fde68a', '#d4af37', '#facc15', '#fcd34d', '#fff7cc'],
      boardCell: 'rgba(255,215,100,0.06)', boardLine: 'rgba(255,215,100,0.12)',
    },
    dark: {
      name: 'Shadow Realm', icon: '🌑',
      colors: ['#94a3b8', '#c084fc', '#818cf8', '#64748b', '#a78bfa', '#7dd3fc', '#e2e8f0'],
      boardCell: 'rgba(148,163,184,0.05)', boardLine: 'rgba(148,163,184,0.10)',
    },
  };

  /* ---------- Стилі блоків ---------- */
  const BLOCK_STYLES = {
    glossy:  { name: 'Glossy',  icon: '🔮' },
    crystal: { name: 'Crystal', icon: '💠' },
    soft:    { name: 'Soft',    icon: '🧸' },
    pixel:   { name: 'Pixel',   icon: '👾' },
  };

  /* ---------- Стилі ефектів (кольори частинок) ---------- */
  const FX_STYLES = {
    classic:  { name: 'Stardust', icon: '✨', extra: ['#fff', '#ffe9a8'] },
    fire:     { name: 'Fire',     icon: '🔥', extra: ['#ff6b35', '#ffd166', '#ff2d00'] },
    electric: { name: 'Electric', icon: '⚡', extra: ['#4dc9ff', '#a0f0ff', '#ffffff'] },
    hearts:   { name: 'Love',     icon: '💖', extra: ['#ff5c8a', '#ff8ce0', '#ffb3d9'] },
  };

  // ---------- Стан ----------
  let canvas, ctx2d, cssW = 0, cssH = 0, dpr = 1;
  let rafId = 0, lastT = 0, running = false;
  let board = null, config = null, mode = 'adventure';
  let pieces = [null, null, null];
  let rng = Math.random;
  let state = 'idle'; // idle | playing | won | lost
  let score = 0, displayScore = 0, coinsEarned = 0, combo = 0, maxComboRun = 0;
  let movesLeft = 0, movesTotal = 0, timeLeft = 0, freezeTime = 0;
  let goalProgress = [];
  let drag = null;          // {index, px, py}
  let armedBooster = null;  // 'hammer' | 'bomb' | 'magnet' ...
  let magnetPick = null;
  let undoStack = [];
  let reviveUsed = false;
  let wobbleT = 0;
  let placeAnims = [];      // поява блоків
  let clearAnims = [];      // зникнення блоків (хвиля від точки розміщення)
  let hcCounter = 0;        // лічильник ходів хардкору
  let dryStreak = 0;        // ходи поспіль без очищення (для "розумної" видачі)
  let comboGrace = 0;       // "прощення" комбо: переживає один сухий хід
  let slowmoT = 0;          // залишок slow-motion після мега-комбо
  let lastDt = 1 / 60;
  let worldDeco = [];       // "оживання світу": декор навколо дошки
  let worldHue = 220;

  // Розкладка канвасу (у CSS-пікселях)
  const L = { bx: 0, by: 0, cell: 0, bsize: 0, trayY: 0, trayH: 0, slotW: 0 };

  function theme() { return THEMES[Storage.s.equipped.theme] || THEMES.neon; }
  function fxColors() { return (FX_STYLES[Storage.s.equipped.fx] || FX_STYLES.classic).extra; }
  function colorOf(idx) {
    if (idx === -1) return '#8be9fd';           // кристал
    if (idx === -2) return '#6b7396';           // щит
    const c = theme().colors;
    return c[((idx % c.length) + c.length) % c.length];
  }

  /* ================= ЗАПУСК ГРИ ================= */

  function start(cfg, modeName) {
    config = cfg;
    mode = modeName;
    board = new Board(cfg);
    rng = cfg.seedPieces ? Levels.mulberry32(cfg.seedPieces) : (cfg.seed && (mode === 'daily' || mode === 'tournament') ? Levels.mulberry32(cfg.seed) : Math.random);
    state = 'playing';
    score = 0; displayScore = 0; coinsEarned = 0; combo = 0; maxComboRun = 0;
    movesLeft = cfg.moves === Infinity ? Infinity : cfg.moves;
    movesTotal = cfg.moves;
    timeLeft = cfg.timeLimit || 0;
    freezeTime = 0;
    goalProgress = (cfg.goals || []).map(g => ({ ...g, progress: 0 }));
    drag = null; armedBooster = null; magnetPick = null;
    undoStack = []; reviveUsed = false; hcCounter = 0;
    placeAnims = []; clearAnims = [];
    dryStreak = 0; comboGrace = 0; slowmoT = 0;
    buildWorldDeco();
    Particles.clear();
    refillPieces();
    Storage.s.stats.gamesPlayed++;
    Storage.save();
    Analytics.log('game_start', { mode: modeName, level: cfg.level || 0 });
    resize();
    UI.updateHUD();
    UI.renderBoosters();
    // Інтерактивний туторіал на першому рівні
    UI.clearTutorial();
    if (cfg.tutorial && !Storage.s.tutorialSeen) UI.showTutorial(1);
    startLoop();
  }

  function refillPieces() {
    for (let i = 0; i < 3; i++) {
      pieces[i] = Shapes.createPiece(config.pieceLevel, rng, config.unlocked);
    }
    improveTray();
  }
  function piecesLeft() { return pieces.filter(p => p && !p.used).length; }

  /* ---------- Збереження/відновлення поточної партії ----------
     Android агресивно вбиває фонові вкладки — без цього гравець
     втрачає прогрес рівня (і витрачену енергію) при дзвінку/згортанні. */
  function serializeGame() {
    if (state !== 'playing') return null;
    return {
      mode, config,
      grid: board.grid,
      fog: [...board.fog],
      pieces,
      score, coinsEarned, combo, maxComboRun,
      movesLeft: movesLeft === Infinity ? -1 : movesLeft,
      movesTotal: movesTotal === Infinity ? -1 : movesTotal,
      timeLeft, freezeTime, goalProgress, reviveUsed, hcCounter,
    };
  }
  function saveGameState() {
    const snap = serializeGame();
    Storage.s.savedGame = snap;
    if (snap) Storage.saveNow(); else Storage.save();
  }
  function clearSavedGame() { Storage.s.savedGame = null; Storage.save(); }
  function hasSavedGame() { return !!Storage.s.savedGame; }
  function savedGameInfo() {
    const sg = Storage.s.savedGame;
    if (!sg) return null;
    return { mode: sg.mode, level: sg.config ? sg.config.level : 0 };
  }

  function resumeSaved() {
    const sg = Storage.s.savedGame;
    if (!sg) return false;
    config = sg.config; mode = sg.mode;
    board = new Board(config);         // ставить портали/туман зі спецом конфіга
    board.grid = sg.grid;
    board.fog = new Set(sg.fog);
    rng = (mode === 'daily' || mode === 'tournament') && config.seed ? Levels.mulberry32(config.seed) : Math.random;
    state = 'playing';
    score = sg.score; displayScore = sg.score; coinsEarned = sg.coinsEarned;
    combo = sg.combo; maxComboRun = sg.maxComboRun;
    movesLeft = sg.movesLeft < 0 ? Infinity : sg.movesLeft;
    movesTotal = sg.movesTotal < 0 ? Infinity : sg.movesTotal;
    timeLeft = sg.timeLeft; freezeTime = sg.freezeTime || 0;
    goalProgress = sg.goalProgress;
    pieces = sg.pieces;
    drag = null; armedBooster = null; magnetPick = null;
    undoStack = []; reviveUsed = sg.reviveUsed; hcCounter = sg.hcCounter || 0;
    placeAnims = []; clearAnims = []; dryStreak = 0; slowmoT = 0;
    buildWorldDeco();
    Particles.clear();
    resize();
    UI.updateHUD();
    UI.renderBoosters();
    UI.clearTutorial();
    startLoop();
    return true;
  }

  /* ---------- "Оживання світу" ----------
     Декорації поточного світу проростають навколо дошки
     в міру проходження рівнів: прогрес видно щогри. */
  function buildWorldDeco() {
    worldDeco = [];
    const world = mode === 'adventure'
      ? Levels.WORLDS[config.world]
      : Levels.WORLDS[Levels.worldOf(Storage.s.currentLevel)];
    worldHue = world.hue;
    // Прогрес у поточному світі: 0..1
    let progress;
    if (mode === 'adventure') {
      const from = config.world * Levels.LEVELS_PER_WORLD + 1;
      let done = 0;
      for (let i = from; i < from + Levels.LEVELS_PER_WORLD; i++) if (Storage.s.levels[i]) done++;
      progress = done / Levels.LEVELS_PER_WORLD;
    } else {
      progress = Math.min(1, (Storage.s.currentLevel % Levels.LEVELS_PER_WORLD) / Levels.LEVELS_PER_WORLD);
    }
    // Слоти навколо дошки: зверху та знизу (там вільний простір)
    const slots = [
      { fx: 0.05, zone: 'top' }, { fx: 0.22, zone: 'top' }, { fx: 0.40, zone: 'top' },
      { fx: 0.58, zone: 'top' }, { fx: 0.05, zone: 'bottom' }, { fx: 0.25, zone: 'bottom' },
      { fx: 0.45, zone: 'bottom' }, { fx: 0.65, zone: 'bottom' }, { fx: 0.85, zone: 'bottom' },
      { fx: 0.75, zone: 'top' }, { fx: 0.93, zone: 'bottom' }, { fx: 0.15, zone: 'bottom' },
    ];
    const drng = Levels.mulberry32((config.world + 1) * 4241);
    const count = Math.max(1, Math.round(progress * slots.length));
    for (let i = 0; i < count; i++) {
      worldDeco.push({
        fx: slots[i].fx, zone: slots[i].zone,
        icon: world.deco[Math.floor(drng() * world.deco.length)],
        phase: drng() * Math.PI * 2,
        size: 15 + drng() * 8,
      });
    }
  }

  /** Малює декор світу і тінт навколо дошки */
  function drawWorldDeco(ctx) {
    // М'який кольоровий подих світу за дошкою
    const g = ctx.createRadialGradient(cssW / 2, L.by + L.bsize / 2, L.bsize * 0.2, cssW / 2, L.by + L.bsize / 2, L.bsize * 0.85);
    g.addColorStop(0, `hsla(${worldHue}, 70%, 55%, 0.06)`);
    g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, L.trayY);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < worldDeco.length; i++) {
      const d = worldDeco[i];
      const px = L.bx + d.fx * L.bsize;
      const py = d.zone === 'top' ? L.by - 24 : L.by + L.bsize + 26;
      const sway = Math.sin(wobbleT * 1.4 + d.phase) * 3;
      ctx.font = `${d.size}px sans-serif`;
      ctx.globalAlpha = 0.85;
      ctx.fillText(d.icon, px, py + sway);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- "Розумна" видача фігур ----------
     1. Гарантія виживання: поки поле не переповнене, гравець ніколи
        не отримує трійку, з якої нічого не поміщається.
     2. Допомога: з високим шансом у лотку є фігура, яка МОЖЕ закрити
        лінію прямо зараз. Після серії ходів без очищень шанс росте
        (драма-менеджер, як у топових match-3). */
  function improveTray() {
    if (!board) return;

    // 1) Виживання: перегенерувати, якщо ніщо не влазить, а місце ще є
    const fillRatio = board.filledCount() / (board.size * board.size);
    if (fillRatio < 0.7) {
      let tries = 0;
      while (tries++ < 15 && !pieces.some(p => p && !p.used && board.canPlaceAnywhere(p))) {
        for (let i = 0; i < 3; i++) pieces[i] = Shapes.createPiece(config.pieceLevel, rng, config.unlocked);
      }
      // Крайній випадок: даємо одиночний блок — він влазить завжди, поки є клітинка
      if (!pieces.some(p => p && !p.used && board.canPlaceAnywhere(p))) {
        pieces[2] = Shapes.materialize(Shapes.DEFS[0], Math.floor(rng() * Shapes.COLOR_COUNT));
      }
    }

    // 2) Допомога з лінією: базовий шанс 65%, після 3 "сухих" ходів — 95%,
    //    на туторіальному рівні — завжди (перший "вибух" має статися швидко)
    const helpChance = config.tutorial ? 1 : dryStreak >= 3 ? 0.95 : 0.65;
    if (rng() < helpChance && !pieces.some(p => p && !p.used && pieceCanClear(p))) {
      const defs = Shapes.available(config.pieceLevel).slice();
      // Тасування Фішера-Єйтса тим самим rng (детермінізм у daily/tournament)
      for (let i = defs.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [defs[i], defs[j]] = [defs[j], defs[i]];
      }
      for (const def of defs) {
        const candidate = Shapes.materialize(def, Math.floor(rng() * Shapes.COLOR_COUNT));
        if (pieceCanClear(candidate)) {
          pieces[Math.floor(rng() * 3)] = candidate;
          break;
        }
      }
    }
  }

  /** Чи існує розміщення фігури, яке завершує рядок/стовпець */
  function pieceCanClear(p) {
    for (let y = 0; y <= board.size - p.h; y++) {
      for (let x = 0; x <= board.size - p.w; x++) {
        if (!board.canPlaceAt(p, x, y)) continue;
        const sim = simulateLines(p, x, y);
        if (sim.rows.length + sim.cols.length > 0) return true;
      }
    }
    return false;
  }

  /* ================= РОЗКЛАДКА / РЕСАЙЗ ================= */

  function resize() {
    if (!canvas) return;
    const wrap = document.getElementById('game-canvas-wrap');
    const rect = wrap.getBoundingClientRect();
    cssW = rect.width; cssH = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

    const size = board ? board.size : 8;
    L.trayH = Math.max(96, Math.min(130, cssH * 0.22));
    const pad = 8;
    L.bsize = Math.min(cssW - pad * 2, cssH - L.trayH - pad * 2);
    L.cell = L.bsize / size;
    L.bx = (cssW - L.bsize) / 2;
    L.by = Math.max(pad, (cssH - L.trayH - L.bsize) / 2 - 4);
    L.trayY = cssH - L.trayH;
    L.slotW = cssW / 3;
  }

  /* ================= ЦИКЛ ================= */

  function startLoop() {
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function tick(t) {
    if (!running) return;
    const rawDt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    // Slow-motion після мега-очищення (3+ ліній)
    slowmoT = Math.max(0, slowmoT - rawDt);
    const dt = rawDt * (slowmoT > 0 ? 0.35 : 1);
    lastDt = dt;
    update(dt);
    render();
    rafId = requestAnimationFrame(tick);
  }

  function update(dt) {
    wobbleT += dt;
    // Таймер Time Rush
    if (state === 'playing' && timeLeft > 0) {
      if (freezeTime > 0) freezeTime -= dt;
      else {
        timeLeft -= dt;
        if (timeLeft <= 10 && Math.floor(timeLeft) !== Math.floor(timeLeft + dt)) AudioFX.sfx.tick();
        if (timeLeft <= 0) { timeLeft = 0; endGame(false, 'time'); }
        UI.updateHUD();
      }
    }
    // Плавний лічильник очок
    if (displayScore < score) {
      displayScore = Math.min(score, displayScore + Math.max(1, (score - displayScore) * dt * 8));
      UI.setScore(Math.round(displayScore));
    }
    // Анімації появи/зникнення
    for (let i = placeAnims.length - 1; i >= 0; i--) {
      placeAnims[i].t += dt * 4;
      if (placeAnims[i].t >= 1) placeAnims.splice(i, 1);
    }
    // Хвиля очищення: блок "вибухає", коли до нього доходить хвиля (t перетинає 0)
    for (let i = clearAnims.length - 1; i >= 0; i--) {
      const a = clearAnims[i];
      a.t += dt * 3.5;
      if (!a.fired && a.t >= 0) {
        a.fired = true;
        fireClearFX(a);
      }
      if (a.t >= 1) clearAnims.splice(i, 1);
    }
  }

  /** Ефекти одного блоку в хвилі очищення */
  function fireClearFX(a) {
    const px = L.bx + (a.x + 0.5) * L.cell;
    const py = L.by + (a.y + 0.5) * L.cell;
    const extras = fxColors();
    const col = Math.random() < 0.35 ? extras[a.note % extras.length] : colorOf(a.color);
    Particles.burst(px, py, col, 7, 240);
    if (a.note % 2 === 0) AudioFX.sfx.clearTick(a.note);
    if (a.mod === 'crystal') { Particles.sparkle(px, py, 14, '#8be9fd'); AudioFX.sfx.crystal(); }
    if (a.mod === 'gold') {
      Particles.sparkle(px, py, 10, '#ffd166');
      AudioFX.sfx.coin();
      Particles.flyText(px, py - 10, '+8🪙', { color: '#ffd166', size: 16 });
    }
  }

  /* ================= РЕНДЕР ================= */

  function render() {
    const ctx = ctx2d;
    const shake = Particles.update(lastDt);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawBoard(ctx);
    drawTray(ctx);
    if (drag) drawDragPiece(ctx);
    Particles.draw(ctx);

    ctx.restore();
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBoard(ctx) {
    if (!board) return;
    const th = theme();
    const size = board.size;
    drawWorldDeco(ctx);
    // Підкладка поля — скло
    rr(ctx, L.bx - 6, L.by - 6, L.bsize + 12, L.bsize + 12, 18);
    ctx.fillStyle = 'rgba(10, 14, 40, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Прев'ю розміщення (примара)
    let ghost = null;
    if (drag && pieces[drag.index]) ghost = ghostPosition(pieces[drag.index]);

    // Лінії, які буде очищено — підсвітка
    let hlRows = [], hlCols = [];
    if (ghost && ghost.valid) {
      const sim = simulateLines(pieces[drag.index], ghost.gx, ghost.gy);
      hlRows = sim.rows; hlCols = sim.cols;
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = L.bx + x * L.cell, py = L.by + y * L.cell;
        const pad = Math.max(1, L.cell * 0.045);
        // Фонова клітинка
        rr(ctx, px + pad, py + pad, L.cell - pad * 2, L.cell - pad * 2, L.cell * 0.18);
        // Передчуття: лінія, що заповниться, пульсує золотом
        const hl = hlRows.includes(y) || hlCols.includes(x);
        ctx.fillStyle = hl
          ? `rgba(255, 209, 102, ${0.22 + Math.sin(wobbleT * 8) * 0.10})`
          : th.boardCell;
        ctx.fill();

        // Портали
        const dest = board.portalAt(x, y);
        if (dest && !board.grid[y][x]) {
          const g = ctx.createRadialGradient(px + L.cell / 2, py + L.cell / 2, 2, px + L.cell / 2, py + L.cell / 2, L.cell * 0.4);
          g.addColorStop(0, 'rgba(167,139,250,0.9)');
          g.addColorStop(1, 'rgba(167,139,250,0.05)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px + L.cell / 2, py + L.cell / 2, L.cell * 0.34 + Math.sin(wobbleT * 3 + x) * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        const cell = board.grid[y][x];
        if (cell && !board.isFogged(x, y)) {
          // Анімація появи
          let scale = 1;
          const pa = placeAnims.find(a => a.x === x && a.y === y);
          if (pa) {
            const k = pa.t;
            scale = k < 0.6 ? 0.3 + k * 1.4 : 1.14 - (k - 0.6) * 0.35;
          }
          drawBlock(ctx, px, py, L.cell, cell, scale, x, y);
        }

        // Туман
        if (board.isFogged(x, y)) {
          rr(ctx, px + pad, py + pad, L.cell - pad * 2, L.cell - pad * 2, L.cell * 0.18);
          const fa = 0.55 + Math.sin(wobbleT * 2 + x * 1.3 + y * 0.9) * 0.12;
          ctx.fillStyle = `rgba(150, 160, 200, ${fa})`;
          ctx.fill();
          ctx.font = `${L.cell * 0.4}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.7;
          ctx.fillText('☁', px + L.cell / 2, py + L.cell / 2);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Хвиля зникнення: до приходу хвилі блок стоїть цілий, потім стискається
    for (const a of clearAnims) {
      const px = L.bx + a.x * L.cell, py = L.by + a.y * L.cell;
      if (a.t < 0) {
        drawBlockShape(ctx, px, py, L.cell, colorOf(a.color), a.mod);
      } else {
        const s = Math.max(0, 1 - a.t);
        ctx.globalAlpha = s;
        drawBlockShape(ctx, px + L.cell * (1 - s) / 2, py + L.cell * (1 - s) / 2, L.cell * s, colorOf(a.color));
        ctx.globalAlpha = 1;
      }
    }

    // Примара фігури
    if (ghost && pieces[drag.index]) {
      const piece = pieces[drag.index];
      for (const [dx, dy] of piece.cells) {
        const x = ghost.gx + dx, y = ghost.gy + dy;
        if (!board.inBounds(x, y)) continue;
        const px = L.bx + x * L.cell, py = L.by + y * L.cell;
        rr(ctx, px + 3, py + 3, L.cell - 6, L.cell - 6, L.cell * 0.18);
        if (ghost.valid) {
          ctx.fillStyle = hexA(colorOf(piece.color), 0.35);
          ctx.fill();
          ctx.strokeStyle = colorOf(piece.color);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(255, 80, 80, 0.18)';
          ctx.fill();
        }
      }
    }
  }

  /** Головний рендер блоку з модифікаторами */
  function drawBlock(ctx, px, py, cell, data, scale = 1, gx = 0, gy = 0) {
    const c = colorOf(data.color);
    const s = cell * scale;
    const ox = px + (cell - s) / 2, oy = py + (cell - s) / 2;
    // Легке "дихання" блоків
    const wob = Math.sin(wobbleT * 1.8 + gx * 0.7 + gy * 1.1) * 0.5;

    if (data.mod === 'crystal') { drawCrystal(ctx, ox, oy + wob * 0.5, s); }
    else if (data.mod === 'shield') { drawShield(ctx, ox, oy, s, data.hp); }
    else drawBlockShape(ctx, ox, oy + wob * 0.4, s, c, data.mod);

    // Лід поверх
    if (data.ice > 0) {
      const pad = s * 0.06;
      rr(ctx, ox + pad, oy + pad, s - pad * 2, s - pad * 2, s * 0.18);
      ctx.fillStyle = data.ice === 2 ? 'rgba(190, 235, 255, 0.75)' : 'rgba(190, 235, 255, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      // Тріщини на другому шарі
      if (data.ice === 1) {
        ctx.beginPath();
        ctx.moveTo(ox + s * 0.25, oy + s * 0.2);
        ctx.lineTo(ox + s * 0.5, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.35, oy + s * 0.8);
        ctx.moveTo(ox + s * 0.5, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.78, oy + s * 0.6);
        ctx.stroke();
      }
    }
    // Ланцюг поверх
    if (data.chain) {
      ctx.font = `${s * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛓️', ox + s / 2, oy + s / 2);
    }
  }

  /** Форма блоку залежно від обраного стилю */
  function drawBlockShape(ctx, x, y, s, color, mod) {
    const style = Storage.s.equipped.blocks;
    const pad = s * 0.055;
    const w = s - pad * 2;
    const r = style === 'pixel' ? s * 0.06 : s * 0.22;

    // Тінь
    rr(ctx, x + pad, y + pad + s * 0.05, w, w, r);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Тіло з градієнтом
    rr(ctx, x + pad, y + pad, w, w, r);
    const g = ctx.createLinearGradient(x, y, x, y + s);
    if (style === 'crystal') {
      g.addColorStop(0, lighten(color, 60));
      g.addColorStop(0.5, color);
      g.addColorStop(1, darken(color, 50));
    } else if (style === 'soft') {
      g.addColorStop(0, lighten(color, 25));
      g.addColorStop(1, darken(color, 15));
    } else {
      g.addColorStop(0, lighten(color, 35));
      g.addColorStop(1, darken(color, 35));
    }
    ctx.fillStyle = g;
    ctx.fill();

    // Світіння краю
    ctx.strokeStyle = hexA(color, 0.65);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Відблиск
    if (style !== 'pixel') {
      rr(ctx, x + pad + w * 0.12, y + pad + w * 0.08, w * 0.76, w * 0.34, r * 0.8);
      const hg = ctx.createLinearGradient(x, y + pad, x, y + pad + w * 0.45);
      hg.addColorStop(0, 'rgba(255,255,255,0.55)');
      hg.addColorStop(1, 'rgba(255,255,255,0.02)');
      ctx.fillStyle = hg;
      ctx.fill();
    } else {
      // Піксельний стиль: внутрішній квадрат
      ctx.fillStyle = hexA(lighten(color, 45), 0.5);
      ctx.fillRect(x + pad + w * 0.15, y + pad + w * 0.15, w * 0.25, w * 0.25);
    }

    // Модифікатори
    if (mod) {
      ctx.font = `${s * 0.44}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons = { gold: '🪙', bomb: '💣', rainbow: '🌈' };
      if (icons[mod]) ctx.fillText(icons[mod], x + s / 2, y + s / 2);
    }
  }

  function drawCrystal(ctx, x, y, s) {
    const cx = x + s / 2, cy = y + s / 2;
    const R = s * 0.36;
    const pulse = 1 + Math.sin(wobbleT * 3) * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    // Світіння
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 1.6);
    g.addColorStop(0, 'rgba(139, 233, 253, 0.55)');
    g.addColorStop(1, 'rgba(139, 233, 253, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.6, 0, Math.PI * 2); ctx.fill();
    // Ромб-кристал
    ctx.beginPath();
    ctx.moveTo(0, -R); ctx.lineTo(R * 0.8, 0); ctx.lineTo(0, R); ctx.lineTo(-R * 0.8, 0);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, -R, 0, R);
    cg.addColorStop(0, '#dffcff');
    cg.addColorStop(0.5, '#8be9fd');
    cg.addColorStop(1, '#4dc9ff');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -R); ctx.lineTo(0, R);
    ctx.moveTo(-R * 0.8, 0); ctx.lineTo(R * 0.8, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
    ctx.restore();
  }

  function drawShield(ctx, x, y, s, hp) {
    const pad = s * 0.08;
    rr(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, s * 0.2);
    const g = ctx.createLinearGradient(x, y, x, y + s);
    g.addColorStop(0, hp > 1 ? '#8a93b8' : '#5d6584');
    g.addColorStop(1, hp > 1 ? '#4a5273' : '#343a54');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `${s * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', x + s / 2, y + s / 2);
    if (hp > 1) {
      ctx.font = `900 ${s * 0.26}px sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(String(hp), x + s * 0.8, y + s * 0.22);
    }
  }

  /* ---------- Лоток фігур ---------- */
  function drawTray(ctx) {
    for (let i = 0; i < 3; i++) {
      const p = pieces[i];
      const sx = i * L.slotW;
      // Підставка
      rr(ctx, sx + 8, L.trayY + 6, L.slotW - 16, L.trayH - 14, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (!p || p.used) continue;
      if (drag && drag.index === i) continue; // тягнемо — у лотку не малюємо

      const cellS = Math.min((L.slotW - 30) / Math.max(p.w, p.h), (L.trayH - 26) / Math.max(p.w, p.h), L.cell * 0.62);
      const pw = p.w * cellS, ph = p.h * cellS;
      const ox = sx + (L.slotW - pw) / 2;
      const oy = L.trayY + (L.trayH - ph) / 2 + Math.sin(wobbleT * 2 + i * 2) * 2;
      const fits = board && pieces[i] && board.canPlaceAnywhere(p);
      ctx.globalAlpha = fits ? 1 : 0.35;
      p.cells.forEach(([dx, dy], ci) => {
        drawBlockShape(ctx, ox + dx * cellS, oy + dy * cellS, cellS, colorOf(p.color), ci === p.modIndex ? p.mod : null);
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawDragPiece(ctx) {
    const p = pieces[drag.index];
    if (!p) return;
    const cellS = L.cell;
    const { ox, oy } = dragOrigin(p);
    ctx.save();
    // Легкий нахил у бік руху — фігура "жива" в руці
    const cx = ox + (p.w * cellS) / 2, cy = oy + (p.h * cellS) / 2;
    ctx.translate(cx, cy);
    ctx.rotate(drag.tilt || 0);
    ctx.translate(-cx, -cy);
    ctx.shadowColor = colorOf(p.color);
    ctx.shadowBlur = 22;
    p.cells.forEach(([dx, dy], ci) => {
      drawBlockShape(ctx, ox + dx * cellS, oy + dy * cellS, cellS, colorOf(p.color), ci === p.modIndex ? p.mod : null);
    });
    ctx.restore();
  }

  /** Верхній-лівий кут фігури, яку тягнемо (з підйомом над пальцем) */
  function dragOrigin(p) {
    const lift = 80;
    return {
      ox: drag.px - (p.w * L.cell) / 2,
      oy: drag.py - p.h * L.cell - lift + L.cell,
    };
  }

  /** Позиція примари на сітці */
  function ghostPosition(p) {
    const { ox, oy } = dragOrigin(p);
    const gx = Math.round((ox - L.bx) / L.cell);
    const gy = Math.round((oy - L.by) / L.cell);
    if (gx < -1 || gy < -1 || gx > board.size || gy > board.size) return null;
    const cx = Math.max(0, Math.min(board.size - p.w, gx));
    const cy = Math.max(0, Math.min(board.size - p.h, gy));
    if (Math.abs(cx - gx) > 1 || Math.abs(cy - gy) > 1) return null;
    return { gx: cx, gy: cy, valid: board.canPlaceAt(p, cx, cy) };
  }

  /** Симуляція: які лінії заповняться цим розміщенням */
  function simulateLines(p, gx, gy) {
    const added = new Set(p.cells.map(([dx, dy]) => (gx + dx) + ',' + (gy + dy)));
    const rows = [], cols = [];
    for (let y = 0; y < board.size; y++) {
      let full = true;
      for (let x = 0; x < board.size; x++) {
        if (!board.grid[y][x] && !added.has(x + ',' + y)) { full = false; break; }
        if (board.isFogged(x, y)) { full = false; break; }
      }
      if (full) rows.push(y);
    }
    for (let x = 0; x < board.size; x++) {
      let full = true;
      for (let y = 0; y < board.size; y++) {
        if (!board.grid[y][x] && !added.has(x + ',' + y)) { full = false; break; }
        if (board.isFogged(x, y)) { full = false; break; }
      }
      if (full) cols.push(x);
    }
    return { rows, cols };
  }

  /* ================= ВВІД ================= */

  function bindInput() {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
  }

  function evtPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function boardCellAt(px, py) {
    const x = Math.floor((px - L.bx) / L.cell);
    const y = Math.floor((py - L.by) / L.cell);
    return board.inBounds(x, y) ? { x, y } : null;
  }

  function onDown(e) {
    if (state !== 'playing') return;
    const pos = evtPos(e);
    // Активований бустер — тап по полю
    if (armedBooster) {
      const cell = boardCellAt(pos.x, pos.y);
      if (cell) { applyBoosterTap(cell.x, cell.y); return; }
    }
    // Взяти фігуру з лотка
    if (pos.y >= L.trayY - 24) {
      const idx = Math.floor(pos.x / L.slotW);
      if (idx >= 0 && idx < 3 && pieces[idx] && !pieces[idx].used) {
        drag = { index: idx, px: pos.x, py: pos.y };
        canvas.setPointerCapture(e.pointerId);
        AudioFX.sfx.pickup();
        AudioFX.vibrate(8);
      }
    }
  }

  function onMove(e) {
    if (!drag) return;
    const pos = evtPos(e);
    // Нахил від горизонтальної швидкості (згладжений, обмежений)
    const vx = pos.x - drag.px;
    const target = Math.max(-0.12, Math.min(0.12, vx * 0.012));
    drag.tilt = (drag.tilt || 0) * 0.8 + target * 0.2;
    drag.px = pos.x; drag.py = pos.y;
  }

  function onUp() {
    if (!drag) return;
    const p = pieces[drag.index];
    const ghost = p ? ghostPosition(p) : null;
    if (p && ghost && ghost.valid) {
      placePiece(drag.index, ghost.gx, ghost.gy);
    } else if (p) {
      AudioFX.sfx.badPlace();
    }
    drag = null;
  }

  /* ================= ХІД ГРИ ================= */

  function placePiece(index, gx, gy) {
    const p = pieces[index];
    // Знімок для "Відміни"
    undoStack.push({
      board: board.snapshot(),
      pieces: pieces.map(x => x ? { ...x, cells: x.cells } : null),
      score, combo, movesLeft,
      goals: goalProgress.map(g => ({ ...g })),
    });
    if (undoStack.length > 5) undoStack.shift();

    const { placed, portalUses } = board.place(p, gx, gy);
    p.used = true;
    if (movesLeft !== Infinity) movesLeft--;

    // Анімація і звук
    for (const pc of placed) {
      placeAnims.push({ x: pc.x, y: pc.y, t: 0 });
      if (pc.teleportedFrom) {
        AudioFX.sfx.portal();
        Particles.sparkle(L.bx + (pc.x + 0.5) * L.cell, L.by + (pc.y + 0.5) * L.cell, 10, '#a78bfa');
        Meta.track('portalsUsed', 1);
      }
    }
    AudioFX.sfx.place();
    AudioFX.vibrate(12);

    // Очки за блоки
    addScore(p.cells.length * 10);
    Meta.track('blocksPlaced', p.cells.length);

    // Перевірка ліній
    const { rows, cols } = board.findFullLines();
    const lineCount = rows.length + cols.length;
    if (lineCount > 0) {
      dryStreak = 0;
      resolveClears(rows, cols, lineCount, { x: gx + (p.w - 1) / 2, y: gy + (p.h - 1) / 2 });
    } else {
      dryStreak++;
      // Комбо-прощення: перший сухий хід не рве серію (шанс на Combo x10)
      if (comboGrace > 0 && combo > 0) {
        comboGrace--;
      } else {
        combo = 0;
        UI.hideCombo();
      }
    }

    // Туторіал: підказки за прогресом першого рівня
    if (config.tutorial && !Storage.s.tutorialSeen) {
      if (lineCount > 0) {
        Storage.s.tutorialSeen = true;
        Storage.save();
        UI.showTutorial(3);
      } else {
        UI.showTutorial(2);
      }
    }

    // Хардкор: перешкода кожні 2 ходи
    if (config.hardcore) {
      hcCounter++;
      if (hcCounter % 2 === 0) {
        const spot = board.addRandomObstacle(Math.random);
        if (spot) {
          placeAnims.push({ x: spot.x, y: spot.y, t: 0 });
          AudioFX.sfx.shield();
        }
      }
    }

    // Нові фігури
    if (piecesLeft() === 0) refillPieces();

    UI.updateHUD();
    checkEndConditions();
    if (state === 'playing') saveGameState(); // зберігаємо партію після кожного ходу
  }

  /** Обробка очищення ліній: очки, комбо, ефекти, цілі.
      origin — точка розміщення: від неї розходиться хвиля зникнення */
  function resolveClears(rows, cols, lineCount, origin) {
    const events = board.clearLines(rows, cols);
    combo++;
    // Веселковий блок ПІДСИЛЮЄ комбо (+1 за кожен) — як обіцяє механіка
    if (events.rainbow > 0) combo += events.rainbow;
    comboGrace = 1; // одне "прощення" сухого ходу після очищення
    maxComboRun = Math.max(maxComboRun, combo);

    // ---- Очки ----
    let pts = 100 * lineCount * lineCount;
    const comboMult = 1 + Math.max(0, combo - 1) * 0.5;
    pts = Math.round(pts * comboMult);
    // ...і дає БОНУС: подвоює очки цієї лінії за кожен веселковий блок
    if (events.rainbow > 0) pts *= (1 + events.rainbow);
    addScore(pts);
    if (events.rainbow > 0) {
      const rc = events.removed.find(r => r.mod === 'rainbow') || events.removed[0];
      if (rc) Particles.flyText(L.bx + (rc.x + 0.5) * L.cell, L.by + rc.y * L.cell - 14, '🌈 x2', { color: '#ff8ce0', size: 20 });
    }

    // ---- Монети ----
    let coins = lineCount * 2 + events.gold * 8;
    if (combo >= 3) coins += 5;
    coinsEarned += coins;

    // ---- Хвиля зникнення: затримка блоку = відстань від origin ----
    let note = 0;
    for (const rcell of events.removed) {
      const dist = origin ? Math.abs(rcell.x - origin.x) + Math.abs(rcell.y - origin.y) : 0;
      clearAnims.push({
        x: rcell.x, y: rcell.y, color: rcell.color, mod: rcell.mod,
        t: -dist * 0.035 * 3.5, // t доходить до 0 через dist*35мс
        fired: false, note: note++,
      });
    }
    for (const ih of events.iceHit) {
      Particles.sparkle(L.bx + (ih.x + 0.5) * L.cell, L.by + (ih.y + 0.5) * L.cell, 6, '#bfe9ff');
    }
    if (events.iceHit.length) AudioFX.sfx.ice();
    if (events.chainsBroken) AudioFX.sfx.chain();
    if (events.shieldsHit.length || events.shieldsBroken) AudioFX.sfx.shield();
    for (const ex of events.explosions || []) {
      Particles.explosion(L.bx + (ex.x + 0.5) * L.cell, L.by + (ex.y + 0.5) * L.cell);
      AudioFX.sfx.bomb();
      Meta.track('bombsExploded', 1);
    }
    if (events.fogCleared) AudioFX.sfx.fog();

    AudioFX.sfx.clear(lineCount);
    AudioFX.vibrate(lineCount >= 2 ? [20, 30, 40] : 25);
    Particles.shake(4 + lineCount * 3, 0.25);
    if (lineCount >= 3) {
      Particles.flash();
      slowmoT = 0.45; // мить slow-motion — смакуємо мега-очищення
    }

    // Летючий напис очок у центрі очищення
    if (events.removed.length) {
      const mid = events.removed[Math.floor(events.removed.length / 2)];
      Particles.flyText(L.bx + (mid.x + 0.5) * L.cell, L.by + mid.y * L.cell, '+' + pts, { color: '#fff', size: 24 });
    }

    // Комбо-банер
    if (combo >= 2) {
      const label = combo >= 10 ? I18N.t('legendary') : combo >= 6 ? I18N.t('amazing') : combo >= 4 ? I18N.t('great') : '';
      UI.showCombo(`${I18N.t('combo')} x${combo}` + (label ? `\n${label}` : ''));
      AudioFX.sfx.combo(combo);
      Meta.track('combosMade', 1);
      Meta.trackMax('maxCombo', combo);
    }

    // Компаньйон радіє
    UI.companionReact(lineCount >= 3 ? 'mega' : combo >= 2 ? 'combo' : 'clear');

    // ---- Цілі ----
    for (const g of goalProgress) {
      if (g.type === 'lines') g.progress += lineCount;
      if (g.type === 'crystals') g.progress += events.crystals;
      if (g.type === 'ice') g.progress += events.iceBroken;
      if (g.type === 'chains') g.progress += events.chainsBroken;
      if (g.type === 'gold') g.progress += events.gold;
    }

    // ---- Статистика для квестів/досягнень ----
    Meta.track('linesCleared', lineCount);
    Meta.track('crystalsCollected', events.crystals);
    Meta.track('iceBroken', events.iceBroken);
    Meta.track('chainsBroken', events.chainsBroken);
    Meta.track('goldCollected', events.gold);
    Meta.track('shieldsBroken', events.shieldsBroken);
    Meta.track('fogCleared', events.fogCleared);
  }

  function addScore(pts) {
    score += pts;
    for (const g of goalProgress) if (g.type === 'score') g.progress = score;
  }

  /* ---------- Перевірка кінця гри ---------- */
  function checkEndConditions() {
    if (state !== 'playing') return;
    // Перемога: всі цілі виконані
    if (goalProgress.length > 0 && goalProgress.every(g => g.progress >= g.target)) {
      endGame(true);
      return;
    }
    // Поразка: закінчились ходи
    if (movesLeft !== Infinity && movesLeft <= 0) {
      endGame(false, 'moves');
      return;
    }
    // Поразка: жодна фігура не поміщається
    const anyFits = pieces.some(p => p && !p.used && board.canPlaceAnywhere(p));
    if (!anyFits) {
      endGame(false, 'space');
    }
  }

  function endGame(won, reason) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'lost';
    clearSavedGame(); // партія завершена; revive re-збереже на наступному ході
    UI.companionReact(won ? 'win' : 'lose');
    Analytics.log('level_result', {
      won, reason: reason || '', mode, level: config.level || 0,
      score, movesUsed: movesTotal === Infinity ? -1 : movesTotal - movesLeft, maxCombo: maxComboRun,
    });
    setTimeout(() => {
      if (won) {
        AudioFX.sfx.win();
        Particles.flash();
        const stars = calcStars();
        const reward = Meta.finishLevel(config, mode, { score, stars, coinsEarned, maxComboRun });
        UI.showWinModal({ stars, score, reward });
      } else {
        AudioFX.sfx.lose();
        const canRevive = !reviveUsed && (reason === 'moves' || reason === 'space' || reason === 'time');
        const result = Meta.finishEndless(config, mode, { score, coinsEarned });
        UI.showLoseModal({ reason, canRevive, score, result });
      }
    }, 550);
  }

  function calcStars() {
    if (movesTotal === Infinity || !movesTotal) return 3;
    const ratio = movesLeft / movesTotal;
    if (ratio >= 0.30) return 3;
    if (ratio >= 0.12) return 2;
    return 1;
  }

  /** Відродження за рекламу: +5 ходів або +30 сек, прибрати 3 випадкові блоки */
  function revive() {
    reviveUsed = true;
    state = 'playing';
    if (config.timeLimit) timeLeft += 30;
    if (movesLeft !== Infinity) movesLeft += 5;
    // Розчистити трохи місця
    const filled = [];
    for (let y = 0; y < board.size; y++) for (let x = 0; x < board.size; x++) {
      if (board.grid[y][x]) filled.push({ x, y });
    }
    for (let i = 0; i < Math.min(10, filled.length); i++) {
      const j = Math.floor(Math.random() * filled.length);
      const c = filled.splice(j, 1)[0];
      const ev = board.boosterHammer(c.x, c.y);
      for (const r of ev.removed) {
        Particles.burst(L.bx + (r.x + 0.5) * L.cell, L.by + (r.y + 0.5) * L.cell, colorOf(r.color), 6, 200);
      }
    }
    AudioFX.sfx.reward();
    UI.updateHUD();
  }

  /* ================= БУСТЕРИ ================= */

  function armBooster(kind) {
    if (state !== 'playing') return;
    const inv = Storage.s.boosters;
    if (!inv[kind] || inv[kind] <= 0) { UI.openShop('boosters'); return; }

    // Миттєві бустери
    if (kind === 'shuffle') {
      inv.shuffle--;
      refillPieces();
      Meta.track('boostersUsed', 1);
      Analytics.log('booster_used', { kind: 'shuffle' });
      AudioFX.sfx.unlock();
      Storage.save();
      UI.renderBoosters();
      return;
    }
    if (kind === 'undo') {
      if (undoStack.length === 0) { AudioFX.sfx.error(); return; }
      inv.undo--;
      Analytics.log('booster_used', { kind: 'undo' });
      const snap = undoStack.pop();
      board.restore(snap.board);
      pieces = snap.pieces.map(x => x ? { ...x } : null);
      score = snap.score; displayScore = score;
      combo = snap.combo;
      movesLeft = snap.movesLeft;
      goalProgress = snap.goals;
      Meta.track('boostersUsed', 1);
      AudioFX.sfx.unlock();
      Storage.save();
      UI.updateHUD();
      UI.renderBoosters();
      return;
    }
    if (kind === 'freeze') {
      if (!config.timeLimit) { AudioFX.sfx.error(); return; }
      inv.freeze--;
      freezeTime = 15;
      Analytics.log('booster_used', { kind: 'freeze' });
      Meta.track('boostersUsed', 1);
      AudioFX.sfx.ice();
      Storage.save();
      UI.renderBoosters();
      return;
    }

    // Бустери з вибором цілі
    armedBooster = armedBooster === kind ? null : kind;
    magnetPick = null;
    UI.renderBoosters();
    if (armedBooster) {
      const hints = { hammer: 'tap_to_remove', bomb: 'tap_bomb_target', magnet: 'magnet_pick' };
      UI.toast(I18N.t(hints[kind]));
    }
  }

  function applyBoosterTap(x, y) {
    const inv = Storage.s.boosters;
    const kind = armedBooster;
    if (kind === 'hammer') {
      if (!board.grid[y][x]) { AudioFX.sfx.error(); return; }
      inv.hammer--;
      const ev = board.boosterHammer(x, y);
      boosterFX(ev);
      finishBoosterUse();
    } else if (kind === 'bomb') {
      inv.bomb--;
      const ev = board.boosterBlast(x, y);
      Particles.explosion(L.bx + (x + 0.5) * L.cell, L.by + (y + 0.5) * L.cell);
      AudioFX.sfx.bomb();
      boosterFX(ev);
      finishBoosterUse();
    } else if (kind === 'magnet') {
      if (!magnetPick) {
        if (!board.grid[y][x] || board.grid[y][x].mod === 'shield') { AudioFX.sfx.error(); return; }
        magnetPick = { x, y };
        UI.toast(I18N.t('magnet_drop'));
        AudioFX.sfx.pickup();
        return;
      }
      if (board.grid[y][x] || board.isFogged(x, y)) { AudioFX.sfx.error(); return; }
      inv.magnet--;
      board.grid[y][x] = board.grid[magnetPick.y][magnetPick.x];
      board.grid[magnetPick.y][magnetPick.x] = null;
      placeAnims.push({ x, y, t: 0 });
      Particles.sparkle(L.bx + (x + 0.5) * L.cell, L.by + (y + 0.5) * L.cell, 10, '#5eead4');
      AudioFX.sfx.place();
      // Магніт може завершити лінію
      const { rows, cols } = board.findFullLines();
      if (rows.length + cols.length > 0) resolveClears(rows, cols, rows.length + cols.length, { x, y });
      finishBoosterUse();
    }
  }

  function boosterFX(ev) {
    for (const r of ev.removed) {
      Particles.burst(L.bx + (r.x + 0.5) * L.cell, L.by + (r.y + 0.5) * L.cell, colorOf(r.color), 8, 240);
      clearAnims.push({ x: r.x, y: r.y, color: r.color, t: 0 });
    }
    // Цілі теж зараховуються
    for (const g of goalProgress) {
      if (g.type === 'crystals') g.progress += ev.crystals;
      if (g.type === 'ice') g.progress += ev.iceBroken;
      if (g.type === 'chains') g.progress += ev.chainsBroken;
      if (g.type === 'gold') g.progress += ev.gold;
    }
    Meta.track('crystalsCollected', ev.crystals);
    Meta.track('iceBroken', ev.iceBroken);
    Meta.track('chainsBroken', ev.chainsBroken);
    Meta.track('goldCollected', ev.gold);
    Meta.track('shieldsBroken', ev.shieldsBroken);
    AudioFX.vibrate(20);
  }

  function finishBoosterUse() {
    Analytics.log('booster_used', { kind: armedBooster });
    armedBooster = null;
    magnetPick = null;
    Meta.track('boostersUsed', 1);
    Storage.save();
    UI.renderBoosters();
    UI.updateHUD();
    checkEndConditions();
  }

  /* ================= ПУБЛІЧНИЙ ІНТЕРФЕЙС ================= */

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx2d = canvas.getContext('2d');
    bindInput();
    window.addEventListener('resize', () => { resize(); });
  }

  return {
    THEMES, BLOCK_STYLES, FX_STYLES,
    init, start, resize, stopLoop, startLoop, revive, armBooster,
    saveGameState, clearSavedGame, hasSavedGame, savedGameInfo, resumeSaved,
    get state() { return state; },
    get score() { return score; },
    get coinsEarned() { return coinsEarned; },
    get movesLeft() { return movesLeft; },
    get timeLeft() { return timeLeft; },
    get freezeTime() { return freezeTime; },
    get goals() { return goalProgress; },
    get config() { return config; },
    get mode() { return mode; },
    get armedBooster() { return armedBooster; },
    get board() { return board; }, // для налагодження/тестів
    get pieces() { return pieces; },
    get layout() { return L; },
    setPaused(p) { state = p ? 'paused' : 'playing'; },
  };

  /* ---------- Допоміжні кольори ---------- */
  function hexA(hex, a) {
    const { r, g, b } = hexRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function lighten(hex, amt) {
    const { r, g, b } = hexRgb(hex);
    return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
  }
  function darken(hex, amt) {
    const { r, g, b } = hexRgb(hex);
    return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
  }
})();
