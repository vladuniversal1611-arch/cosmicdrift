/* ============================================================
 * Mystic Relics — board.js
 * Ігрове поле: розкладка, рендеринг на Canvas, введення,
 * панель збору (7 слотів), перепони, анімації польоту та вибуху.
 *
 * Оптимізації: спрайт-кеш облич плиток (малюємо кожен тип один
 * раз у offscreen-canvas), перерахунок «відкритості» лише при
 * зміні поля, Object Pooling частинок у particles.js.
 * ============================================================ */
'use strict';

const Board = {
  tiles: [],            // усі плитки рівня
  tray: [],             // плитки у панелі (макс. CFG.TRAY_SIZE)
  undoStack: [],
  spriteCache: new Map(),
  canvas: null, ctx: null,
  dpr: 1, w: 0, h: 0,
  tileW: 60, tileH: 74, cellX: 30, cellY: 37,
  offX: 0, offY: 0, depth: 5,
  traySlots: [],        // піксельні позиції слотів панелі
  hammerMode: false,
  rainbowArmed: false,
  keysCollected: false,
  matchesMade: 0,       // для ланцюгів/каменю
  portalTimer: 0,
  shakeT: 0,
  _openDirty: true,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', e => this.onTap(e));
    window.addEventListener('resize', () => this.resize());
  },

  /* ---------------- Налаштування рівня ---------------- */
  setup(cfg) {
    this.tiles = cfg.tiles.map((t, i) => ({
      id: i, x: t.x, y: t.y, z: t.z, type: t.type,
      obst: t.obst ? { ...t.obst } : null,
      isKey: !!t.isKey, portal: !!t.portal,
      state: 'board', px: 0, py: 0, scale: 0, spawnDelay: i * 0.012,
      flyT: -1, hintT: 0, mergeT: -1, trayAt: 0, cursed: false, rainbow: false
    }));
    this.tray = [];
    this.undoStack = [];
    this.texts = [];
    this.hammerMode = false;
    this.rainbowArmed = false;
    this.keysCollected = !cfg.tiles.some(t => t.isKey);
    this.matchesMade = 0;
    this.portalTimer = 20;
    this.shakeT = 0;
    this._openDirty = true;
    this.spriteCache.clear();
    Particles.clear();
    this.resize();
    Audio2.play('place');
  },

  /* ---------------- Геометрія ---------------- */
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = rect.width; this.h = rect.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.spriteCache.clear();
    if (!this.tiles.length) return;

    // Межі поля у клітинках
    let minX = 99, maxX = -99, minY = 99, maxY = -99, maxZ = 0;
    for (const t of this.tiles) {
      minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x + 2);
      minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y + 2);
      maxZ = Math.max(maxZ, t.z);
    }
    const spanX = maxX - minX, spanY = maxY - minY;
    const trayZone = Math.min(120, this.h * 0.18);         // місце під панель
    const gutter = Math.min(70, this.w * 0.16);            // жолоби під бічні бустери
    const availW = this.w - gutter * 2, availH = this.h - trayZone - 24;
    const cell = Math.min(availW / spanX, availH / (spanY * 1.22), 42);
    this.cellX = cell; this.cellY = cell * 1.22;
    this.tileW = cell * 2; this.tileH = this.cellY * 2;
    this.depth = Math.max(3, cell * 0.22);
    this.offX = (this.w - spanX * this.cellX) / 2 - minX * this.cellX + maxZ * this.depth * 0.5;
    this.offY = (availH - spanY * this.cellY) / 2 + 12 - minY * this.cellY + maxZ * this.depth;

    // Межі поля у пікселях — для об'ємної підкладки
    const pad = this.cellX * 0.9;
    this.boardRect = {
      x: this.offX + minX * this.cellX - pad,
      y: this.offY + minY * this.cellY - pad - maxZ * this.depth,
      w: spanX * this.cellX + pad * 2,
      h: spanY * this.cellY + pad * 2 + maxZ * this.depth
    };

    // Слоти панелі
    const slotW = Math.min(this.tileW * 0.98, (this.w - 40) / CFG.TRAY_SIZE - 5, 56);
    const totalW = CFG.TRAY_SIZE * (slotW + 5);
    const y0 = this.h - trayZone / 2 - slotW * 0.6;
    this.traySlots = [];
    for (let i = 0; i < CFG.TRAY_SIZE; i++) {
      this.traySlots.push({ x: (this.w - totalW) / 2 + i * (slotW + 5) + slotW / 2, y: y0 + slotW * 0.6, w: slotW });
    }
    this._renderTrayPanel(slotW, totalW);
    // Оновлюємо домашні позиції
    for (const t of this.tiles) if (t.state === 'board') { const p = this.homePos(t); t.px = p.x; t.py = p.y; }
  },

  /** Пре-рендер дерев'яної панелі із золотими вставками (offscreen). */
  _renderTrayPanel(slotW, totalW) {
    const padX = 16, padY = 13;
    const w = totalW + padX * 2, h = slotW * 1.2 + padY * 2;
    const c = document.createElement('canvas');
    const s = Math.min(window.devicePixelRatio || 1, 2);
    c.width = (w + 24) * s; c.height = (h + 24) * s;
    const g = c.getContext('2d');
    g.scale(s, s);
    g.translate(12, 12);

    // Тінь під панеллю
    g.shadowColor = 'rgba(0,0,10,0.55)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
    // Дерев'яна основа
    const wood = g.createLinearGradient(0, 0, 0, h);
    wood.addColorStop(0, '#9a6428');
    wood.addColorStop(0.12, '#7c4c1c');
    wood.addColorStop(0.55, '#5f3812');
    wood.addColorStop(1, '#3f240a');
    g.fillStyle = wood;
    this._rr(g, 0, 0, w, h, 18); g.fill();
    g.shadowBlur = 0; g.shadowOffsetY = 0;

    // Волокна дерева — тонкі хвилясті лінії
    g.strokeStyle = 'rgba(40,22,6,0.35)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const y = 6 + (i / 7) * (h - 10);
      g.beginPath();
      g.moveTo(6, y);
      for (let x = 6; x < w - 6; x += 26) {
        g.quadraticCurveTo(x + 13, y + Math.sin(x * 0.11 + i * 2.4) * 2.6, x + 26, y);
      }
      g.stroke();
    }
    // Верхній світлий кант
    g.strokeStyle = 'rgba(255,220,160,0.35)';
    g.lineWidth = 2;
    this._rr(g, 2, 2, w - 4, h - 4, 16); g.stroke();
    // Золота рамка
    const gold = g.createLinearGradient(0, 0, w, h);
    gold.addColorStop(0, '#f3d27a'); gold.addColorStop(0.4, '#8a5f14');
    gold.addColorStop(0.6, '#f7e3a1'); gold.addColorStop(1, '#7a5410');
    g.strokeStyle = gold;
    g.lineWidth = 3;
    this._rr(g, 0, 0, w, h, 18); g.stroke();
    // Золоті заклепки по кутах
    for (const [rx, ry] of [[13, 13], [w - 13, 13], [13, h - 13], [w - 13, h - 13]]) {
      const riv = g.createRadialGradient(rx - 1.5, ry - 1.5, 0.5, rx, ry, 5.5);
      riv.addColorStop(0, '#fff3c4'); riv.addColorStop(0.5, '#e8b93a'); riv.addColorStop(1, '#8a5f14');
      g.fillStyle = riv;
      g.beginPath(); g.arc(rx, ry, 5, 0, Math.PI * 2); g.fill();
    }
    this._trayPanel = c;
    this._trayPanelW = w + 24; this._trayPanelH = h + 24;
    this._trayPadY = padY;
  },

  homePos(t) {
    return {
      x: this.offX + t.x * this.cellX + this.cellX - t.z * this.depth * 0.6,
      y: this.offY + t.y * this.cellY + this.cellY - t.z * this.depth
    };
  },

  boardTiles() { return this.tiles.filter(t => t.state === 'board'); },

  /** Кеш відкритості: перераховується лише після зміни поля. */
  refreshOpen() {
    const rem = this.boardTiles();
    for (const t of rem) t.open = Generator.isOpen(t, rem);
    this._openDirty = false;
  },

  isSelectable(t) {
    if (t.state !== 'board' || !t.open) return false;
    if (t.obst) {
      if (t.obst.kind === 'chain' && t.obst.counter > 0) return false;
      if (t.obst.kind === 'stone' && t.obst.counter > 0) return false;
      if (t.obst.kind === 'lock' && !this.keysCollected) return false;
    }
    return true;
  },

  /* ---------------- Введення ---------------- */
  onTap(e) {
    if (Game.state !== 'playing') return;
    Audio2.init(); Audio2.resume();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (this._openDirty) this.refreshOpen();

    // Пошук плитки під пальцем: верхні шари мають пріоритет
    const cand = this.boardTiles()
      .filter(t => Math.abs(mx - t.px) < this.tileW / 2 && Math.abs(my - t.py) < this.tileH / 2)
      .sort((a, b) => b.z - a.z || b.y - a.y);
    const t = cand[0];
    if (!t) return;

    if (this.hammerMode) { this.hammerMode = false; UI.setHammerCursor(false); this.destroyTriple(t); return; }

    if (!this.isSelectable(t)) {
      // Лід можна «тріснути» навіть якщо плитка відкрита, але з hp=2
      Audio2.play('error');
      this.shakeTile(t);
      return;
    }
    // Лід: перший дотик лише розколює
    if (t.obst && t.obst.kind === 'ice' && t.obst.hp > 1) {
      t.obst.hp--;
      Audio2.play('crack');
      Particles.dust(t.px, t.py, 'rgba(160,220,255,0.8)');
      Utils.vibrate(15);
      return;
    }
    this.pickTile(t, true);
  },

  shakeTile(t) { t.shake = 0.3; },

  /* ---------------- Взяття плитки у панель ---------------- */
  pickTile(t, byUser) {
    if (this.tray.length >= CFG.TRAY_SIZE) return;
    if (t.rainbow !== true && byUser) Audio2.play('tap');
    Utils.vibrate(10);

    // Ефект вибору: спалах + маленькі іскри
    Particles.dust(t.px, t.py + this.tileH * 0.3, 'rgba(255,240,190,0.7)');
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      Particles.spawn({
        x: t.px, y: t.py, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130,
        life: 0.35, size: 2.5, color: UI.theme().accent
      });
    }

    t.state = 'fly';
    t.flyT = 0;
    t.from = { x: t.px, y: t.py };
    // Позиція вставки: після останньої плитки того ж типу
    let idx = this.tray.length;
    for (let i = this.tray.length - 1; i >= 0; i--) {
      if (this.tray[i].type === t.type) { idx = i + 1; break; }
    }
    this.tray.splice(idx, 0, t);
    t.trayAt = performance.now();
    if (byUser) this.undoStack.push(t);
    this._openDirty = true;

    // Крива польоту: контрольна точка збоку для дуги
    const slot = this.traySlots[Math.min(idx, this.traySlots.length - 1)];
    t.ctrl = { x: (t.px + slot.x) / 2 + (Math.random() - 0.5) * 80, y: Math.min(t.py, slot.y) - 60 };
  },

  /** Після завершення польоту — пил, звук, перевірка матчів і поразки. */
  onTrayLanded(t) {
    Audio2.play('place');
    if (t) {
      Particles.dust(t.px, t.py + this.traySlots[0].w * 0.5, 'rgba(220,190,140,0.65)');
      Particles.sparkle(t.px, t.py, UI.theme().accent);
    }
    this.checkMatches();
  },

  checkMatches() {
    // Райдужна плитка доповнює будь-яку пару
    const rainbow = this.tray.find(t => t.rainbow && t.state === 'tray');
    if (rainbow) {
      const counts = {};
      for (const t of this.tray) if (!t.rainbow && t.state === 'tray') counts[t.type] = (counts[t.type] || 0) + 1;
      const pair = Object.keys(counts).find(k => counts[k] >= 2);
      if (pair !== undefined) {
        const group = this.tray.filter(t => t.type === +pair && t.state === 'tray').slice(0, 2);
        group.push(rainbow);
        this.explodeGroup(group, +pair);
        return;
      }
    }
    // Звичайна трійка
    const counts = {};
    for (const t of this.tray) if (t.state === 'tray' && !t.rainbow) counts[t.type] = (counts[t.type] || 0) + 1;
    for (const k in counts) {
      if (counts[k] >= CFG.MATCH_COUNT) {
        const group = this.tray.filter(t => t.type === +k && t.state === 'tray').slice(0, CFG.MATCH_COUNT);
        this.explodeGroup(group, +k);
        return;
      }
    }
    // Поразка: панель повна і жодного матчу
    const settled = this.tray.filter(t => t.state === 'tray' || t.state === 'fly').length;
    if (settled >= CFG.TRAY_SIZE) Game.onTrayFull();
  },

  /** WOW-ефект збору трійки: плитки злітаються у точку над панеллю,
   *  обертаються, стискаються і вибухають кільцем із частинками. */
  explodeGroup(group, type) {
    const cx = group.reduce((a, t) => a + t.px, 0) / group.length;
    const cy = this.traySlots[0].y - this.traySlots[0].w * 1.7;
    for (const t of group) {
      t.state = 'merge';
      t.mergeT = 0;
      t.mergeFrom = { x: t.px, y: t.py };
      t.mergeTo = { x: cx, y: cy };
      t.mergeSpin = (Math.random() - 0.5) * 9;
    }
    this.matchesMade++;
    this.undoStack = this.undoStack.filter(t => !group.includes(t));

    // Ключ 🗝️ відкриває замки
    if (group.some(t => t.isKey)) {
      this.keysCollected = true;
      Audio2.play('unlock');
      for (const t of this.boardTiles()) if (t.obst && t.obst.kind === 'lock') Particles.sparkle(t.px, t.py, '#ffd700');
    }
    // Ланцюги та каміння слабшають з кожним матчем
    for (const t of this.boardTiles()) {
      if (t.obst && (t.obst.kind === 'chain' || t.obst.kind === 'stone') && t.obst.counter > 0) {
        t.obst.counter--;
        if (t.obst.counter === 0) { Particles.dust(t.px, t.py, 'rgba(200,200,200,0.8)'); Audio2.play('crack'); }
      }
    }
    setTimeout(() => {
      const theme = UI.theme();
      // Вибух: кільце + сплеск частинок + гліфи плитки, що розлітаються
      Particles.burst(cx, cy, theme.accent, 30);
      Particles.ring(cx, cy, theme.accent);
      Particles.ring(cx, cy, '#ffffff');
      if (type >= 0) {
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * Math.PI * 2;
          Particles.spawn({
            x: cx, y: cy, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190 - 120,
            life: 0.8, size: 15, glyph: CFG.TILES[type].g, grav: 420, spin: 6
          });
        }
      }
      this.shakeT = 0.32;                       // screen shake
      for (const t of group) t.state = 'gone';
      this.tray = this.tray.filter(t => t.state !== 'gone');
      const pts = Game.onMatch(type);
      if (pts) this.addText(cx, cy - 24, `+${pts}`, '#ffe066');
      Utils.vibrate([20, 30, 20]);
      // Каскад: можливо, уже є наступний матч (магніт/бомба)
      this.checkMatches();
      this.checkWin();
    }, 420);
  },

  /* ---- Літаючі тексти очок ---- */
  addText(x, y, text, color) {
    this.texts.push({ x, y, text, color: color || '#fff', t: 0, life: 1.1 });
  },

  checkWin() {
    if (this.boardTiles().length === 0 && this.tray.filter(t => t.state !== 'gone').length === 0
        && !this.tiles.some(t => t.state === 'fly' || t.state === 'merge')) {
      Game.onWin();
    }
  },

  /* ---------------- Бустери (викликаються з boosters.js) ---------------- */

  /** Перемішування з гарантією прохідності: типи перерозподіляються
   *  зворотним розв'язанням по позиціях, що лишилися. */
  reshuffle() {
    const rem = this.boardTiles();
    if (rem.length < 3) return;
    const rnd = Utils.rng(Date.now() % 2147483647);

    // Мультимножина типів на полі
    const counts = {};
    for (const t of rem) counts[t.type] = (counts[t.type] || 0) + 1;
    // «Хвости» — типи, частково зібрані у панелі (кількість не кратна 3):
    // їх кладемо на відкриті позиції, щоб гравець міг одразу доповнити
    const leftovers = [];
    for (const k in counts) { const r = counts[k] % 3; for (let i = 0; i < r; i++) leftovers.push(+k); }

    for (let attempt = 0; attempt < 25; attempt++) {
      const remaining = new Set(rem);
      const assign = new Map();
      const c2 = { ...counts };
      let ok = true;

      // 1. Хвости — на відкриті зараз позиції
      const openNow = rem.filter(p => Generator.isOpen(p, rem));
      if (openNow.length < leftovers.length) break;
      Utils.shuffle(openNow, rnd);
      leftovers.forEach((type, i) => { assign.set(openNow[i], type); remaining.delete(openNow[i]); c2[type]--; });

      // 2. Повні трійки — зворотним розв'язанням
      while (remaining.size > 0) {
        const arr = [...remaining];
        const open = arr.filter(p => Generator.isOpen(p, arr));
        if (open.length < 3) { ok = false; break; }
        Utils.shuffle(open, rnd);
        const types = Object.keys(c2).filter(k => c2[k] >= 3);
        if (!types.length) { ok = false; break; }
        const type = +types[Utils.ri(rnd, 0, types.length - 1)];
        c2[type] -= 3;
        for (const p of open.slice(0, 3)) { assign.set(p, type); remaining.delete(p); }
      }
      if (ok) {
        for (const [tile, type] of assign) { tile.type = type; tile.scale = 0; tile.spawnDelay = Math.random() * 0.25; }
        Audio2.play('booster');
        this._openDirty = true;
        return;
      }
    }
    // Запасний варіант: простий обмін типами
    const typesArr = Utils.shuffle(rem.map(t => t.type), rnd);
    rem.forEach((t, i) => { t.type = typesArr[i]; t.scale = 0; t.spawnDelay = Math.random() * 0.25; });
    Audio2.play('booster');
  },

  /** Підказка: підсвічує трійку, яку реально можна зібрати. */
  showHint() {
    if (this._openDirty) this.refreshOpen();
    const open = this.boardTiles().filter(t => this.isSelectable(t));
    const trayCounts = {};
    for (const t of this.tray) if (t.state === 'tray') trayCounts[t.type] = (trayCounts[t.type] || 0) + 1;
    // Спершу — доповнення того, що вже у панелі
    for (const k in trayCounts) {
      const need = 3 - trayCounts[k];
      const found = open.filter(t => t.type === +k).slice(0, need);
      if (found.length === need && need > 0) { found.forEach(t => t.hintT = 2.5); return true; }
    }
    // Інакше — повна відкрита трійка
    const byType = {};
    for (const t of open) (byType[t.type] = byType[t.type] || []).push(t);
    for (const k in byType) if (byType[k].length >= 3) { byType[k].slice(0, 3).forEach(t => t.hintT = 2.5); return true; }
    return false;
  },

  /** Магніт: притягує плитки, що доповнюють трійку в панелі. */
  magnet() {
    if (this.tray.length >= CFG.TRAY_SIZE) return false;
    const trayCounts = {};
    for (const t of this.tray) if (t.state === 'tray') trayCounts[t.type] = (trayCounts[t.type] || 0) + 1;
    let best = null;
    for (const k in trayCounts) if (!best || trayCounts[k] > trayCounts[best]) best = k;
    const rem = this.boardTiles();
    if (best === null) {
      const counts = {};
      for (const t of rem) counts[t.type] = (counts[t.type] || 0) + 1;
      best = Object.keys(counts).find(k => counts[k] >= 3);
      if (best === undefined) return false;
    }
    const need = 3 - (trayCounts[best] || 0);
    const found = rem.filter(t => t.type === +best).slice(0, need);
    if (found.length < need) return false;
    found.forEach((t, i) => setTimeout(() => this.pickTile(t, false), i * 130));
    return true;
  },

  /** Молоток: цільовий режим — наступний дотик знищує трійку. */
  destroyTriple(target) {
    const rem = this.boardTiles();
    const same = rem.filter(t => t.type === target.type && t !== target).slice(0, 2);
    const group = [target, ...same];
    for (const t of group) {
      t.state = 'gone';
      Particles.burst(t.px, t.py, '#ff9f43', 14);
    }
    Audio2.play('match', 2);
    this._openDirty = true;
    Game.onMatch(target.type, true);
    this.checkWin();
  },

  /** Чарівна паличка: збирає одну відкриту трійку автоматично. */
  wand() {
    if (this._openDirty) this.refreshOpen();
    const open = this.boardTiles().filter(t => this.isSelectable(t));
    const byType = {};
    for (const t of open) (byType[t.type] = byType[t.type] || []).push(t);
    for (const k in byType) {
      if (byType[k].length >= 3) {
        byType[k].slice(0, 3).forEach((t, i) => setTimeout(() => this.pickTile(t, false), i * 120));
        return true;
      }
    }
    return this.magnet();   // якщо відкритої трійки немає — діємо як магніт
  },

  /** Бомба: знищує до трьох трійок будь-де на полі. */
  bomb() {
    let destroyed = 0;
    for (let round = 0; round < 3; round++) {
      const rem = this.boardTiles();
      const byType = {};
      for (const t of rem) (byType[t.type] = byType[t.type] || []).push(t);
      const k = Object.keys(byType).find(k => byType[k].length >= 3);
      if (k === undefined) break;
      for (const t of byType[k].slice(0, 3)) {
        t.state = 'gone';
        Particles.burst(t.px, t.py, '#f87171', 16);
      }
      destroyed++;
      Game.onMatch(+k, true);
    }
    if (destroyed) {
      this.shakeT = 0.5;
      Audio2.play('match', 4);
      this._openDirty = true;
      this.checkWin();
    }
    return destroyed > 0;
  },

  /** Райдужна плитка: додає джокер у панель. */
  addRainbow() {
    if (this.tray.length >= CFG.TRAY_SIZE) return false;
    const t = {
      id: -1, type: -1, rainbow: true, state: 'fly', flyT: 0,
      px: this.w / 2, py: -40, from: { x: this.w / 2, y: -40 },
      ctrl: { x: this.w / 2, y: this.h / 3 }, isKey: false, obst: null,
      hintT: 0, mergeT: -1, trayAt: performance.now(), x: 0, y: 0, z: 0, scale: 1, spawnDelay: 0
    };
    this.tiles.push(t);
    this.tray.push(t);
    return true;
  },

  /** Порятунок: повертає до n останніх звичайних плиток панелі на поле. */
  reviveClear(n) {
    const back = this.tray.filter(t => t.state === 'tray' && !t.rainbow).slice(-n);
    for (const t of back) {
      this.tray.splice(this.tray.indexOf(t), 1);
      const p = this.homePos(t);
      t.state = 'board';
      t.from = { x: t.px, y: t.py };
      t.ctrl = { x: (t.px + p.x) / 2, y: Math.min(t.py, p.y) - 50 };
      t.returnT = 0;
    }
    this.undoStack = this.undoStack.filter(t => !back.includes(t));
    this._openDirty = true;
    Audio2.play('booster');
    return back.length > 0;
  },

  /** Відміна ходу: остання плитка повертається на поле. */
  undo() {
    const t = this.undoStack.pop();
    if (!t || t.state !== 'tray') return false;
    this.tray.splice(this.tray.indexOf(t), 1);
    t.state = 'board';
    const p = this.homePos(t);
    t.from = { x: t.px, y: t.py };
    t.ctrl = { x: (t.px + p.x) / 2, y: Math.min(t.py, p.y) - 50 };
    t.returnT = 0;
    this._openDirty = true;
    return true;
  },

  /* ---------------- Оновлення та рендеринг ---------------- */
  update(dt) {
    if (this._openDirty) this.refreshOpen();

    // Портали: обмін типами кожні 20 с
    const portals = this.boardTiles().filter(t => t.portal);
    if (portals.length >= 2) {
      this.portalTimer -= dt;
      if (this.portalTimer <= 0) {
        this.portalTimer = 20;
        const [a, b] = portals;
        if (a.type !== b.type) {
          [a.type, b.type] = [b.type, a.type];
          a.scale = 0; b.scale = 0; a.spawnDelay = 0; b.spawnDelay = 0;
          Particles.sparkle(a.px, a.py, '#a78bfa');
          Particles.sparkle(b.px, b.py, '#a78bfa');
          Audio2.play('portal');
        }
      }
    }

    // Прокляті плитки у панелі
    const now = performance.now();
    for (const t of this.tray) {
      if (t.state === 'tray' && t.obst && t.obst.kind === 'curse' && !t.cursed && now - t.trayAt > 12000) {
        t.cursed = true;
        Game.addScore(-200);
        UI.toast(I18N.t('curse_toast'));
        Audio2.play('curse');
      }
    }

    if (this.shakeT > 0) this.shakeT -= dt;

    for (const t of this.tiles) {
      if (t.state === 'gone') continue;
      if (t.hintT > 0) t.hintT -= dt;
      if (t.shake > 0) t.shake -= dt;

      // Поява плитки (масштаб з пружиною)
      if (t.spawnDelay > 0) { t.spawnDelay -= dt; continue; }
      if (t.scale < 1) t.scale = Math.min(1, t.scale + dt * 4);

      if (t.state === 'board') {
        if (t.returnT !== undefined && t.returnT >= 0) {
          // Повернення з панелі (undo)
          t.returnT += dt * 3;
          const p = this.homePos(t);
          if (t.returnT >= 1) { t.px = p.x; t.py = p.y; t.returnT = undefined; }
          else {
            const b = Utils.bezier(t.from, t.ctrl, p, Utils.easeOutCubic(t.returnT));
            t.px = b.x; t.py = b.y;
          }
        } else {
          const p = this.homePos(t);
          t.px = p.x; t.py = p.y;
        }
      } else if (t.state === 'fly') {
        t.flyT += dt * 2.8;
        const slotIdx = this.tray.indexOf(t);
        const slot = this.traySlots[Math.max(0, Math.min(slotIdx, this.traySlots.length - 1))];
        if (t.flyT >= 1) {
          t.state = 'tray'; t.px = slot.x; t.py = slot.y;
          this.onTrayLanded(t);
        } else {
          const b = Utils.bezier(t.from, t.ctrl, slot, Utils.easeInCubic(Math.min(1, t.flyT)));
          t.px = b.x; t.py = b.y;
        }
      } else if (t.state === 'tray') {
        // Плавне «підсування» до свого слота при перестановках
        const slotIdx = this.tray.indexOf(t);
        if (slotIdx >= 0) {
          const slot = this.traySlots[Math.min(slotIdx, this.traySlots.length - 1)];
          t.px = Utils.lerp(t.px, slot.x, Math.min(1, dt * 14));
          t.py = Utils.lerp(t.py, slot.y, Math.min(1, dt * 14));
        }
      } else if (t.state === 'merge') {
        t.mergeT += dt;
      }
    }

    // Літаючі тексти очок
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const tx = this.texts[i];
      tx.t += dt;
      tx.y -= 46 * dt;
      if (tx.t >= tx.life) this.texts.splice(i, 1);
    }

    Particles.update(dt);
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.save();
    if (this.shakeT > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeT * 30, (Math.random() - 0.5) * this.shakeT * 30);
    }

    this.drawBoardPanel(ctx);
    this.drawTray(ctx);

    // Плитки на полі: знизу вгору
    const board = this.boardTiles().sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
    for (const t of board) this.drawTile(ctx, t);

    // Плитки у польоті/панелі/вибуху — поверх усього
    for (const t of this.tiles) {
      if (t.state === 'fly' || t.state === 'tray') this.drawTile(ctx, t, true);
      else if (t.state === 'merge') this.drawMerge(ctx, t);
    }

    Particles.draw(ctx);

    // Літаючі тексти очок — з пружною появою
    for (const tx of this.texts) {
      const inP = Math.min(1, tx.t / 0.22);
      const sc = Utils.easeOutBack(inP);
      const alpha = tx.t > tx.life - 0.35 ? (tx.life - tx.t) / 0.35 : 1;
      ctx.save();
      ctx.translate(tx.x, tx.y);
      ctx.scale(sc, sc);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = '900 26px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(70,30,0,0.85)';
      ctx.strokeText(tx.text, 0, 0);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  /** Об'ємна підкладка поля: скляна плита з сяйвом і золотим кантом. */
  drawBoardPanel(ctx) {
    const r = this.boardRect;
    if (!r) return;
    const theme = UI.theme();
    // М'яка тінь
    ctx.fillStyle = 'rgba(0,0,10,0.35)';
    this._rr(ctx, r.x + 4, r.y + 8, r.w, r.h, 26); ctx.fill();
    // Скляна плита
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.5, 'rgba(20,10,50,0.24)');
    grad.addColorStop(1, 'rgba(0,0,15,0.34)');
    ctx.fillStyle = grad;
    this._rr(ctx, r.x, r.y, r.w, r.h, 26); ctx.fill();
    // Пульсуюче внутрішнє світіння акцентом теми
    const pulse = 0.10 + 0.05 * Math.sin(performance.now() / 900);
    const glow = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 10, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.6);
    glow.addColorStop(0, theme.accent + Math.round(pulse * 255).toString(16).padStart(2, '0'));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    this._rr(ctx, r.x, r.y, r.w, r.h, 26); ctx.fill();
    // Верхній відблиск і золотий кант
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    this._rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 24); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,178,90,0.45)';
    ctx.lineWidth = 2;
    this._rr(ctx, r.x, r.y, r.w, r.h, 26); ctx.stroke();
  },

  drawTray(ctx) {
    const theme = UI.theme();
    const s0 = this.traySlots[0], sn = this.traySlots[this.traySlots.length - 1];
    if (!s0) return;
    // Дерев'яна панель (пре-рендер)
    const px = (this.w - this._trayPanelW) / 2;
    const py = s0.y - s0.w * 0.6 - this._trayPadY - 12;
    ctx.drawImage(this._trayPanel, px, py, this._trayPanelW, this._trayPanelH);

    // Небезпека: панель майже повна — червоне пульсуюче світіння
    const filled = this.tray.filter(t => t.state === 'tray' || t.state === 'fly').length;
    if (filled >= CFG.TRAY_SIZE - 1) {
      ctx.strokeStyle = `rgba(255,70,70,${0.4 + 0.4 * Math.sin(performance.now() / 160)})`;
      ctx.lineWidth = 4;
      this._rr(ctx, px + 10, py + 10, this._trayPanelW - 20, this._trayPanelH - 20, 18);
      ctx.stroke();
    }

    // Слоти — тиснені гнізда у дереві
    for (const s of this.traySlots) {
      ctx.fillStyle = 'rgba(20,10,2,0.55)';
      this._rr(ctx, s.x - s.w / 2, s.y - s.w * 0.6, s.w, s.w * 1.2, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      this._rr(ctx, s.x - s.w / 2 + 1, s.y - s.w * 0.6 + 1, s.w - 2, s.w * 1.2 - 2, 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,215,150,0.16)';
      this._rr(ctx, s.x - s.w / 2, s.y - s.w * 0.6, s.w, s.w * 1.2 + 1.5, 9);
      ctx.stroke();
    }
  },

  /** Спрайт обличчя плитки: товста глянцева «цукерка» з фаскою,
   *  подвійним боком, відблиском зверху та м'яким світінням гліфа.
   *  Кешується на тип+розмір — у кадрі лише drawImage. */
  sprite(type, size) {
    const key = type + '_' + Math.round(size);
    let c = this.spriteCache.get(key);
    if (c) return c;
    const theme = UI.theme();
    const w = Math.round(size), h = Math.round(size * 1.22);
    const r = Math.max(7, w * 0.2);                 // соковите заокруглення
    const d = Math.max(3, w * 0.09);                // товщина плитки
    c = document.createElement('canvas');
    const s = Math.min(window.devicePixelRatio || 1, 2);
    c.width = (w + 12) * s; c.height = (h + 12) * s;
    const g = c.getContext('2d');
    g.scale(s, s);
    g.translate(6, 6);

    // Нижній темний бік (двошаровий — ефект товщини)
    g.fillStyle = 'rgba(52,36,20,0.95)';
    this._rr(g, d * 0.5, d + 1, w, h, r); g.fill();
    const side = g.createLinearGradient(0, h * 0.5, 0, h + d);
    side.addColorStop(0, this._shade(theme.tile, -70));
    side.addColorStop(1, this._shade(theme.tile, -110));
    g.fillStyle = side;
    this._rr(g, d * 0.3, d * 0.7, w, h, r); g.fill();

    // Обличчя: слонова кістка з теплим градієнтом і тінню до низу
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.1, this._shade(theme.tile, 14));
    grad.addColorStop(0.62, theme.tile);
    grad.addColorStop(1, this._shade(theme.tile, -26));
    g.fillStyle = grad;
    this._rr(g, 0, 0, w, h, r); g.fill();

    // Внутрішня фаска: світло зверху-зліва, тінь знизу-справа
    g.save();
    this._rr(g, 1.2, 1.2, w - 2.4, h - 2.4, r - 1); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.4;
    this._rr(g, 1.6, 1.6, w - 3.2, h - 3.2, r - 1); g.stroke();
    g.strokeStyle = 'rgba(120,90,50,0.35)'; g.lineWidth = 3;
    this._rr(g, 1, -1, w + 1, h + 1.6, r); g.stroke();
    g.restore();

    // Глянцевий відблиск-дуга у верхній частині
    const gloss = g.createLinearGradient(0, 0, 0, h * 0.42);
    gloss.addColorStop(0, 'rgba(255,255,255,0.55)');
    gloss.addColorStop(1, 'rgba(255,255,255,0.02)');
    g.fillStyle = gloss;
    g.beginPath();
    g.moveTo(r * 0.6, 2);
    g.lineTo(w - r * 0.6, 2);
    g.quadraticCurveTo(w - 3, 2, w - 3, r);
    g.quadraticCurveTo(w * 0.72, h * 0.4, w * 0.5, h * 0.42);
    g.quadraticCurveTo(w * 0.26, h * 0.44, 3, r * 1.2);
    g.quadraticCurveTo(3, 2, r * 0.6, 2);
    g.fill();
    // Маленький круглий блік у куті
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.ellipse(w * 0.2, h * 0.12, w * 0.07, w * 0.045, -0.5, 0, Math.PI * 2); g.fill();

    // Контур
    g.strokeStyle = 'rgba(105,80,45,0.5)';
    g.lineWidth = 1.4;
    this._rr(g, 0, 0, w, h, r); g.stroke();

    // Гліф із м'якою тінню
    if (type >= 0) {
      g.shadowColor = 'rgba(60,30,0,0.35)';
      g.shadowBlur = 3; g.shadowOffsetY = 2;
      g.font = `${Math.round(w * 0.6)}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(CFG.TILES[type].g, w / 2, h / 2 + h * 0.04);
      g.shadowBlur = 0; g.shadowOffsetY = 0;
    } else {
      // Райдужний джокер
      const rg = g.createLinearGradient(0, 0, w, h);
      ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc'].forEach((col, i, a) => rg.addColorStop(i / (a.length - 1), col));
      g.fillStyle = rg;
      this._rr(g, 4, 4, w - 8, h - 8, r - 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      this._rr(g, 6, 6, w - 12, h * 0.3, r - 4); g.fill();
      g.font = `${Math.round(w * 0.5)}px sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('🌈', w / 2, h / 2);
    }
    this.spriteCache.set(key, c);
    return c;
  },

  drawTile(ctx, t, inTray = false) {
    const size = inTray && t.state === 'tray' ? this.traySlots[0].w : this.tileW;
    const h = size * 1.22;
    let sc = t.scale < 1 ? Utils.easeOutBack(t.scale) : 1;
    // Політ у панель: плитка «підстрибує» масштабом на старті
    if (t.state === 'fly') sc *= 1.22 - 0.22 * Math.min(1, t.flyT);
    const shakeX = t.shake > 0 ? Math.sin(t.shake * 60) * 4 : 0;

    ctx.save();
    ctx.translate(t.px + shakeX, t.py);
    ctx.scale(sc, sc);

    // Тінь на полі
    if (t.state === 'board') {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(2, h / 2 + 2, size / 2, size / 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const spr = this.sprite(t.rainbow ? -1 : t.type, size);
    ctx.drawImage(spr, -size / 2 - 4, -h / 2 - 4, size + 8, h + 8);

    // Затемнення закритих плиток
    if (t.state === 'board' && !t.open) {
      ctx.fillStyle = 'rgba(10,10,30,0.4)';
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.fill();
    }

    // Перепони
    if (t.obst && t.state === 'board') this.drawObstacle(ctx, t, size, h);
    if (t.isKey && t.state !== 'gone') {
      ctx.font = `${size * 0.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🗝️', size * 0.28, -h * 0.3);
    }
    if (t.portal && t.state === 'board') {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 300);
      ctx.font = `${size * 0.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🌀', -size * 0.28, -h * 0.3);
      ctx.globalAlpha = 1;
    }
    // Проклята у панелі — пульсує
    if (t.obst && t.obst.kind === 'curse' && t.state === 'tray' && !t.cursed) {
      ctx.strokeStyle = `rgba(180,60,220,${0.5 + 0.5 * Math.sin(performance.now() / 200)})`;
      ctx.lineWidth = 3;
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.stroke();
    }

    // Підсвітка підказки
    if (t.hintT > 0) {
      ctx.strokeStyle = `rgba(255,224,102,${0.4 + 0.6 * Math.sin(performance.now() / 120)})`;
      ctx.lineWidth = 4;
      this._rr(ctx, -size / 2 - 3, -h / 2 - 3, size + 6, h + 6, 11); ctx.stroke();
      if (Math.random() < 0.15) Particles.sparkle(t.px, t.py);
    }
    ctx.restore();
  },

  drawObstacle(ctx, t, size, h) {
    const o = t.obst;
    if (o.kind === 'ice' && o.hp > 0) {
      ctx.fillStyle = o.hp > 1 ? 'rgba(140,210,255,0.55)' : 'rgba(140,210,255,0.28)';
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.fill();
      if (o.hp === 1) { // тріщини
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, -h * 0.2); ctx.lineTo(0, 0); ctx.lineTo(size * 0.25, -h * 0.35);
        ctx.moveTo(0, 0); ctx.lineTo(size * 0.1, h * 0.3);
        ctx.stroke();
      }
      ctx.font = `${size * 0.26}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('🧊', -size * 0.28, -h * 0.3);
    } else if (o.kind === 'chain' && o.counter > 0) {
      ctx.strokeStyle = 'rgba(70,70,90,0.9)'; ctx.lineWidth = size * 0.09;
      ctx.beginPath();
      ctx.moveTo(-size / 2, -h * 0.18); ctx.lineTo(size / 2, h * 0.1);
      ctx.moveTo(-size / 2, h * 0.22); ctx.lineTo(size / 2, -h * 0.12);
      ctx.stroke();
      ctx.font = `${size * 0.28}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('⛓️', 0, h * 0.02);
    } else if (o.kind === 'stone' && o.counter > 0) {
      ctx.fillStyle = 'rgba(105,100,95,0.88)';
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.fill();
      ctx.font = `${size * 0.4}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪨', 0, 0);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.24}px sans-serif`;
      ctx.fillText(o.counter, size * 0.3, -h * 0.32);
    } else if (o.kind === 'lock' && !this.keysCollected) {
      ctx.fillStyle = 'rgba(40,30,20,0.55)';
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.fill();
      ctx.font = `${size * 0.42}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔒', 0, 0);
    } else if (o.kind === 'fog' && !t.open) {
      ctx.fillStyle = 'rgba(30,25,50,0.92)';
      this._rr(ctx, -size / 2, -h / 2, size, h, 9); ctx.fill();
      ctx.fillStyle = 'rgba(200,190,255,0.8)';
      ctx.font = `bold ${size * 0.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
    } else if (o.kind === 'curse' && t.state === 'board') {
      ctx.font = `${size * 0.28}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('☠️', size * 0.26, -h * 0.3);
    }
  },

  drawMerge(ctx, t) {
    // Фаза 1 (0–0.55): плитки злітаються у центр, обертаючись і збільшуючись.
    // Фаза 2 (0.55–1): стискаються та спалахують перед вибухом.
    const p = Math.min(1, t.mergeT / 0.42);
    const size = this.traySlots[0].w;
    const fly = Math.min(1, p / 0.55);
    const e = Utils.easeInCubic(fly);
    const x = Utils.lerp(t.mergeFrom.x, t.mergeTo.x, e);
    const y = Utils.lerp(t.mergeFrom.y, t.mergeTo.y, e) - Math.sin(fly * Math.PI) * 26;
    const squeeze = p > 0.55 ? (p - 0.55) / 0.45 : 0;
    const sc = (1 + fly * 0.35) * (1 - squeeze * 0.5);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t.mergeSpin * p);
    ctx.scale(sc, sc);
    // Спалах перед вибухом
    if (squeeze > 0) {
      ctx.globalAlpha = squeeze * 0.8;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, size * (0.7 + squeeze * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1 - squeeze * 0.55;
    }
    const spr = this.sprite(t.rainbow ? -1 : t.type, size);
    ctx.drawImage(spr, -size / 2 - 6, -size * 0.61 - 6, size + 12, size * 1.22 + 12);
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  /* ---------------- Допоміжні ---------------- */
  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  _shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Utils.clamp((n >> 16) + amt, 0, 255);
    const g = Utils.clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = Utils.clamp((n & 255) + amt, 0, 255);
    return `rgb(${r},${g},${b})`;
  }
};
