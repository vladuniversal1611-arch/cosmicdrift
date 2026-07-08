/* Tiny Kingdom — рендер: мультяшне королівство згори, анімовані жителі,
   день/ніч, погода, хмари, птахи, сезонні декорації. */
'use strict';

const TILE = 64;
const MARGIN_X = 32, MARGIN_TOP = 56, MARGIN_BOT = 40;
const WORLD_W = COLS * TILE + MARGIN_X * 2;
const WORLD_H = ROWS * TILE + MARGIN_TOP + MARGIN_BOT;

/* сталий псевдовипадковий шум для декору */
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

const Renderer = {
  cv: null, cx: null, scale: 1, offX: 0, offY: 0,
  zoom: 1, camX: WORLD_W / 2, camY: WORLD_H / 2, // камера: щипок — зум, тягни — панорама
  sprites: [],     // жителі
  critters: [],    // коти, качки та інша дрібнота
  floats: [],      // текст, що спливає
  bursts: [],      // ефект завершення будівництва
  clouds: [], birds: [], drops: [],
  weather: 'sun', weatherT: 0, wind: 8,
  placeList: null, // масив індексів ділянок у режимі розміщення

  init(canvas) {
    this.cv = canvas; this.cx = canvas.getContext('2d');
    for (let i = 0; i < 4; i++) this.clouds.push({ x: Math.random() * WORLD_W, y: 30 + Math.random() * 300, s: 0.5 + Math.random(), v: 3 + Math.random() * 5 });
    const kinds = ['🐈', '🦆', '🐇', '🐕'];
    for (let i = 0; i < 4; i++) this.critters.push({ kind: kinds[i], x: Math.random() * WORLD_W, y: 100 + Math.random() * (WORLD_H - 200),
      tx: Math.random() * WORLD_W, ty: 100 + Math.random() * (WORLD_H - 200), v: 8 + Math.random() * 8, rest: 0 });
    this.resize();
    addEventListener('resize', () => this.resize());
    this.pickWeather(true);
  },
  resize() {
    const wrap = this.cv.parentElement;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    this.cv.width = w * dpr; this.cv.height = h * dpr;
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.scale = Math.min(w / WORLD_W, h / WORLD_H) * dpr;
    this.applyCamera();
  },
  applyCamera() {
    this.zoom = Math.min(3, Math.max(1, this.zoom));
    const eff = this.scale * this.zoom;
    // якщо світ менший за екран по осі — центруємо, інакше не випускаємо за край
    const halfW = this.cv.width / 2 / eff, halfH = this.cv.height / 2 / eff;
    this.camX = halfW >= WORLD_W / 2 ? WORLD_W / 2 : Math.min(WORLD_W - halfW, Math.max(halfW, this.camX));
    this.camY = halfH >= WORLD_H / 2 ? WORLD_H / 2 : Math.min(WORLD_H - halfH, Math.max(halfH, this.camY));
    this.effScale = eff;
    this.offX = this.cv.width / 2 - this.camX * eff;
    this.offY = this.cv.height / 2 - this.camY * eff;
  },
  pan(dxPx, dyPx) { // dx у CSS-пікселях
    const rect = this.cv.getBoundingClientRect();
    const dpr = this.cv.width / rect.width;
    this.camX -= dxPx * dpr / this.effScale;
    this.camY -= dyPx * dpr / this.effScale;
    this.applyCamera();
  },
  zoomBy(f) { this.zoom *= f; this.applyCamera(); },
  toWorld(clientX, clientY) {
    const rect = this.cv.getBoundingClientRect();
    const dpr = this.cv.width / rect.width;
    return {
      x: ((clientX - rect.left) * dpr - this.offX) / this.effScale,
      y: ((clientY - rect.top) * dpr - this.offY) / this.effScale,
    };
  },
  plotXY(i) {
    const c = i % COLS, r = Math.floor(i / COLS);
    return { x: MARGIN_X + c * TILE, y: MARGIN_TOP + r * TILE };
  },
  plotAt(clientX, clientY) {
    const w = this.toWorld(clientX, clientY);
    const c = Math.floor((w.x - MARGIN_X) / TILE), r = Math.floor((w.y - MARGIN_TOP) / TILE);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1;
    return r * COLS + c;
  },
  goblinAt(clientX, clientY) {
    if (!Game.fight) return -1;
    const w = this.toWorld(clientX, clientY);
    let best = -1, bd = 20; // радіус попадання
    Game.fight.goblins.forEach((g, i) => {
      if (g.dead) return;
      const d = Math.hypot(g.x - w.x, g.y - w.y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  },
  float(i, text, color) {
    const p = this.plotXY(i);
    this.floats.push({ x: p.x + TILE / 2, y: p.y + 8, text, color: color || '#fff', t: 0 });
  },
  burst(i) {
    const p = this.plotXY(i);
    for (let k = 0; k < 12; k++)
      this.bursts.push({ x: p.x + TILE / 2, y: p.y + TILE / 2, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 60, t: 0, c: ['#ffd54f', '#fff176', '#aed581'][k % 3] });
  },

  pickWeather(first) {
    const m = new Date().getMonth();
    const winter = (m === 11 || m === 0 || m === 1);
    const roll = Math.random();
    this.weather = roll < (winter ? 0.35 : 0.62) ? 'sun' : roll < (winter ? 0.5 : 0.85) ? 'rain' : winter ? 'snow' : 'rain';
    if (winter && this.weather === 'rain' && Math.random() < 0.6) this.weather = 'snow';
    this.weatherT = 60 + Math.random() * 120;
    this.drops.length = 0;
  },

  /* 0..1 фаза доби (10 хв реального часу = доба) */
  dayPhase() { return (Date.now() % 600000) / 600000; },

  draw(dt, t) {
    const cx = this.cx, S = Game.S;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = '#3e7c3a';
    cx.fillRect(0, 0, this.cv.width, this.cv.height);
    this.applyCamera();
    cx.setTransform(this.effScale, 0, 0, this.effScale, this.offX, this.offY);

    this.drawGround(t);
    this.drawDecor(t);
    // будівлі знизу вгору для правильного перекриття тіней
    for (let i = 0; i < S.plots.length; i++) this.drawPlot(i, t);
    if (this.placeList) this.drawPlacement(t);
    this.updateCritters(dt, t);
    this.updateCitizens(dt, t);
    this.drawGoblins(dt, t);
    this.drawEffects(dt);
    this.drawAmbient(dt, t);
    this.drawLight(t);
  },

  updateCritters(dt, t) {
    const cx = this.cx;
    for (const c of this.critters) {
      if (c.rest > 0) { c.rest -= dt; }
      else {
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d < 3) {
          c.rest = 2 + Math.random() * 5;
          c.tx = 20 + Math.random() * (WORLD_W - 40); c.ty = 90 + Math.random() * (WORLD_H - 170);
        } else { c.x += dx / d * c.v * dt; c.y += dy / d * c.v * dt; }
      }
      cx.font = '10px sans-serif'; cx.textAlign = 'center';
      cx.fillText(c.kind, c.x, c.y + (c.rest > 0 ? 0 : Math.abs(Math.sin(t * 6)) * -1.5));
    }
  },

  drawGoblins(dt, t) {
    const f = Game.fight;
    if (!f) return;
    const cx = this.cx, now = Date.now();
    for (const g of f.goblins) {
      if (g.dead) { // хмарка «пух» після удару
        const a = 1 - (now - g.dead) / 500;
        if (a <= 0) continue;
        cx.globalAlpha = a;
        cx.fillStyle = '#ddd';
        cx.beginPath(); cx.arc(g.x, g.y - 6, 8 * (1.5 - a * 0.5), 0, 7); cx.fill();
        cx.globalAlpha = 1;
        continue;
      }
      const bob = Math.sin(t * 9 + g.ph) * 1.5;
      cx.fillStyle = 'rgba(0,0,0,.2)';
      cx.beginPath(); cx.ellipse(g.x, g.y + 6, 6, 2.5, 0, 0, 7); cx.fill();
      cx.fillStyle = '#57a639'; // тіло
      this.rr(g.x - 4.5, g.y - 5 + bob, 9, 11, 4); cx.fill();
      cx.beginPath(); cx.arc(g.x, g.y - 8 + bob, 4.5, 0, 7); cx.fill(); // голова
      // вуха
      cx.beginPath(); cx.moveTo(g.x - 4, g.y - 9 + bob); cx.lineTo(g.x - 9, g.y - 12 + bob); cx.lineTo(g.x - 3, g.y - 12 + bob); cx.fill();
      cx.beginPath(); cx.moveTo(g.x + 4, g.y - 9 + bob); cx.lineTo(g.x + 9, g.y - 12 + bob); cx.lineTo(g.x + 3, g.y - 12 + bob); cx.fill();
      cx.fillStyle = '#e74c3c'; // очі
      cx.fillRect(g.x - 2.5, g.y - 9 + bob, 1.8, 1.8); cx.fillRect(g.x + 0.7, g.y - 9 + bob, 1.8, 1.8);
      // кільце-мішень, що пульсує
      cx.strokeStyle = `rgba(231,76,60,${0.5 + Math.sin(t * 6 + g.ph) * 0.3})`;
      cx.lineWidth = 1.5;
      cx.beginPath(); cx.arc(g.x, g.y - 2, 13 + Math.sin(t * 6 + g.ph) * 2, 0, 7); cx.stroke();
    }
    // таймер бою
    const left = Math.max(0, (f.end - now) / 1000);
    cx.fillStyle = 'rgba(0,0,0,.55)';
    this.rr(WORLD_W / 2 - 52, 30, 104, 18, 9); cx.fill();
    cx.fillStyle = '#ffd54f'; cx.font = 'bold 11px sans-serif'; cx.textAlign = 'center';
    cx.fillText(`👺 ${f.goblins.filter(g => !g.dead).length} · ⏱ ${Math.ceil(left)}с`, WORLD_W / 2, 43);
  },

  drawGround(t) {
    const cx = this.cx;
    // трав'яне поле з варіаціями
    cx.fillStyle = '#58a14e';
    cx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let gx = 0; gx < WORLD_W; gx += 32)
      for (let gy = 0; gy < WORLD_H; gy += 32) {
        const h = hash2(gx, gy);
        if (h > 0.5) { cx.fillStyle = h > 0.8 ? '#61ab55' : '#529a49'; cx.fillRect(gx, gy, 32, 32); }
      }
    // стежки між ділянками
    cx.strokeStyle = '#c9a86a'; cx.lineWidth = 7; cx.lineCap = 'round';
    cx.globalAlpha = 0.85;
    for (let r = 1; r < ROWS; r++) {
      cx.beginPath();
      cx.moveTo(MARGIN_X + 6, MARGIN_TOP + r * TILE);
      cx.lineTo(WORLD_W - MARGIN_X - 6, MARGIN_TOP + r * TILE);
      cx.stroke();
    }
    cx.beginPath();
    cx.moveTo(WORLD_W / 2, MARGIN_TOP + 4); cx.lineTo(WORLD_W / 2, WORLD_H - MARGIN_BOT - 4);
    cx.stroke();
    cx.globalAlpha = 1;
    // річка внизу
    cx.fillStyle = '#4aa3df';
    cx.fillRect(0, WORLD_H - 26, WORLD_W, 26);
    cx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 6; i++) {
      const wx = (i * 97 + t * 20) % WORLD_W;
      cx.fillRect(wx, WORLD_H - 20 + (i % 3) * 6, 26, 2.5);
    }
  },

  drawDecor(t) {
    const cx = this.cx;
    const m = new Date().getMonth();
    // дерева по периметру
    for (let i = 0; i < 26; i++) {
      const h = hash2(i, 7);
      let x, y;
      if (i < 8) { x = 8 + h * 16; y = 40 + i * 68; }
      else if (i < 16) { x = WORLD_W - 24 + h * 14; y = 40 + (i - 8) * 68; }
      else { x = 30 + (i - 16) * ((WORLD_W - 60) / 9); y = 12 + h * 22; }
      this.tree(x, y, 0.8 + h * 0.5, m === 11 || m === 0);
    }
    // сезонний декор
    if (m === 9) { // Гелловін: гарбузи
      for (let i = 0; i < 5; i++) { const h = hash2(i, 3); this.pumpkin(MARGIN_X - 14, MARGIN_TOP + 30 + i * 110 + h * 40); }
    }
    if (m === 11 || m === 0) this.xmasTree(WORLD_W / 2 + 8, MARGIN_TOP - 24, t); // Новий рік: ялинка
    if (m === 3) { // Великдень: крашанки
      for (let i = 0; i < 6; i++) {
        const h = hash2(i, 5);
        cx.fillStyle = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#2ecc71', '#e67e22'][i];
        cx.beginPath(); cx.ellipse(20 + h * 12, 70 + i * 90, 4, 5.5, 0, 0, 7); cx.fill();
      }
    }
  },
  tree(x, y, s, snowy) {
    const cx = this.cx;
    cx.fillStyle = 'rgba(0,0,0,.15)';
    cx.beginPath(); cx.ellipse(x, y + 10 * s, 9 * s, 4 * s, 0, 0, 7); cx.fill();
    cx.fillStyle = '#7a5230'; cx.fillRect(x - 1.5 * s, y + 2 * s, 3 * s, 8 * s);
    cx.fillStyle = '#2e8b46';
    cx.beginPath(); cx.arc(x, y - 4 * s, 9 * s, 0, 7); cx.fill();
    cx.fillStyle = '#37a556';
    cx.beginPath(); cx.arc(x - 3 * s, y - 8 * s, 6 * s, 0, 7); cx.fill();
    if (snowy) { cx.fillStyle = 'rgba(255,255,255,.75)'; cx.beginPath(); cx.arc(x, y - 9 * s, 5 * s, 3.4, 6.1); cx.fill(); }
  },
  pumpkin(x, y) {
    const cx = this.cx;
    cx.fillStyle = '#e67e22';
    cx.beginPath(); cx.ellipse(x, y, 7, 5.5, 0, 0, 7); cx.fill();
    cx.fillStyle = '#27ae60'; cx.fillRect(x - 1, y - 8, 2, 4);
  },
  xmasTree(x, y, t) {
    const cx = this.cx;
    cx.fillStyle = '#1e8449';
    for (let k = 0; k < 3; k++) {
      cx.beginPath();
      cx.moveTo(x, y + k * 9 - 18); cx.lineTo(x - 10 + k * 2, y + k * 9); cx.lineTo(x + 10 - k * 2, y + k * 9);
      cx.fill();
    }
    for (let k = 0; k < 6; k++) {
      cx.fillStyle = ['#e74c3c', '#f1c40f', '#3498db'][k % 3];
      const tw = Math.sin(t * 3 + k) > 0 ? 1 : 0.4;
      cx.globalAlpha = tw;
      cx.beginPath(); cx.arc(x - 6 + (k % 3) * 6, y - 12 + Math.floor(k / 3) * 10, 1.6, 0, 7); cx.fill();
      cx.globalAlpha = 1;
    }
    cx.fillStyle = '#f1c40f';
    cx.beginPath(); cx.arc(x, y - 20, 2.2, 0, 7); cx.fill();
  },

  drawPlot(i, t) {
    const cx = this.cx, p = Game.S.plots[i], { x, y } = this.plotXY(i);
    if (!p.b) return;
    const B = BUILDINGS[p.b];
    const cxm = x + TILE / 2, cym = y + TILE / 2;
    // тінь
    cx.fillStyle = 'rgba(0,0,0,.18)';
    cx.beginPath(); cx.ellipse(cxm, y + TILE - 10, 24, 8, 0, 0, 7); cx.fill();
    if (p.until > 0) { this.drawConstruction(x, y, p, t); return; }

    this.drawBuilding(p.b, x, y, p.lvl, t);
    // рівень
    cx.fillStyle = 'rgba(0,0,0,.45)';
    this.rr(x + TILE - 22, y + 4, 18, 12, 4); cx.fill();
    cx.fillStyle = '#ffd54f'; cx.font = 'bold 9px sans-serif'; cx.textAlign = 'center';
    cx.fillText(p.lvl >= MAX_LVL ? '★' : 'р.' + p.lvl, x + TILE - 13, y + 13);
    // готовий бонус — блискітка
    if (Game.tappable(p.b) && Date.now() - p.tapAt > TAP_CD * 1000) {
      const pu = 1 + Math.sin(t * 5 + i) * 0.15;
      cx.font = `${11 * pu}px sans-serif`;
      cx.fillText('✨', cxm, y + 6);
    }
  },
  rr(x, y, w, h, r) {
    const cx = this.cx;
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r);
    cx.closePath();
  },
  drawConstruction(x, y, p, t) {
    const cx = this.cx;
    cx.fillStyle = '#b98b4e';
    this.rr(x + 12, y + 20, 40, 34, 5); cx.fill();
    cx.strokeStyle = '#8a6236'; cx.lineWidth = 2.5;
    for (let k = 0; k < 3; k++) { cx.beginPath(); cx.moveTo(x + 14, y + 26 + k * 10); cx.lineTo(x + 50, y + 26 + k * 10); cx.stroke(); }
    cx.font = '15px sans-serif'; cx.textAlign = 'center';
    cx.fillText('🔨', x + TILE / 2 + Math.sin(t * 6) * 4, y + 18);
    // прогрес-бар
    const total = Game.timeOf(p.b, p.target) * 1000;
    const frac = Math.min(1, Math.max(0, 1 - (p.until - Date.now()) / total));
    cx.fillStyle = 'rgba(0,0,0,.4)'; this.rr(x + 8, y + TILE - 12, TILE - 16, 7, 3); cx.fill();
    cx.fillStyle = '#7ee081'; this.rr(x + 9, y + TILE - 11, (TILE - 18) * frac, 5, 2); cx.fill();
  },

  /* процедурні мультяшні будівлі */
  drawBuilding(type, x, y, lvl, t) {
    const cx = this.cx;
    const grow = 1 + Math.min(0.25, (lvl - 1) * 0.028); // трохи більші на високих рівнях
    cx.save();
    cx.translate(x + TILE / 2, y + TILE / 2);
    cx.scale(grow, grow);
    cx.translate(-TILE / 2, -TILE / 2);
    const roofC = { house: '#e07b53', sawmill: '#8d6e42', farm: '#e8b93c', warehouse: '#95a5a6', quarry: '#7f8c8d',
      market: '#9b59b6', forge: '#c0392b', castle: SKINS[Game.S.skin].roof, library: '#2980b9', magictower: '#5d6ee8',
      bank: '#f1c40f', academy: '#16a085', port: '#3498db', arena: '#d35400', palace: '#f39c12' }[type] || '#e07b53';
    const wallC = { forge: '#6b6b6b', quarry: '#95a08f', castle: '#d8d3c8', palace: '#f7ecd0', bank: '#e8e2d0' }[type] || '#f0e0c0';

    if (type === 'castle' || type === 'palace') {
      // вежі + мур
      cx.fillStyle = wallC; this.rr(10, 24, 44, 32, 4); cx.fill();
      for (const tx of [8, 48]) {
        cx.fillStyle = wallC; this.rr(tx - 4, 14, 12, 42, 3); cx.fill();
        cx.fillStyle = roofC;
        cx.beginPath(); cx.moveTo(tx - 6, 16); cx.lineTo(tx + 2, 2); cx.lineTo(tx + 10, 16); cx.fill();
        // прапорець
        cx.strokeStyle = '#555'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(tx + 2, 2); cx.lineTo(tx + 2, -6); cx.stroke();
        cx.fillStyle = '#e74c3c';
        const fl = Math.sin(t * 4 + tx) * 2;
        cx.beginPath(); cx.moveTo(tx + 2, -6); cx.lineTo(tx + 10, -4 + fl); cx.lineTo(tx + 2, -1); cx.fill();
      }
      cx.fillStyle = roofC; this.rr(14, 18, 36, 10, 3); cx.fill();
      cx.fillStyle = '#7a5230'; this.rr(27, 40, 10, 16, 4); cx.fill(); // брама
      if (type === 'palace') { cx.font = '12px sans-serif'; cx.textAlign = 'center'; cx.fillText('👑', 32, 16); }
    } else if (type === 'farm') {
      // поле + хлів
      cx.fillStyle = '#9a7b3f'; this.rr(6, 34, 30, 24, 3); cx.fill();
      cx.strokeStyle = '#c8a24e'; cx.lineWidth = 2;
      for (let k = 0; k < 4; k++) { cx.beginPath(); cx.moveTo(9, 38 + k * 5); cx.lineTo(33, 38 + k * 5); cx.stroke(); }
      cx.fillStyle = wallC; this.rr(38, 30, 20, 26, 3); cx.fill();
      cx.fillStyle = roofC;
      cx.beginPath(); cx.moveTo(35, 32); cx.lineTo(48, 18); cx.lineTo(61, 32); cx.fill();
      // вітрячок
      cx.save(); cx.translate(48, 14); cx.rotate(t * 1.5);
      cx.strokeStyle = '#fff'; cx.lineWidth = 2.5;
      for (let k = 0; k < 4; k++) { cx.rotate(Math.PI / 2); cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, -9); cx.stroke(); }
      cx.restore();
    } else if (type === 'magictower') {
      cx.fillStyle = '#cfd6f5'; this.rr(22, 14, 20, 42, 6); cx.fill();
      cx.fillStyle = roofC;
      cx.beginPath(); cx.moveTo(18, 16); cx.lineTo(32, -2); cx.lineTo(46, 16); cx.fill();
      const g = 0.5 + Math.sin(t * 3) * 0.4;
      cx.fillStyle = `rgba(140,120,255,${g})`;
      cx.beginPath(); cx.arc(32, 26, 5 + g * 2, 0, 7); cx.fill();
      cx.fillStyle = '#5d6ee8'; cx.beginPath(); cx.arc(32, 26, 3.5, 0, 7); cx.fill();
    } else if (type === 'port') {
      cx.fillStyle = '#4aa3df'; this.rr(6, 36, 52, 22, 4); cx.fill();
      cx.fillStyle = '#8a6236'; this.rr(10, 40, 34, 6, 2); cx.fill();
      // кораблик гойдається
      const bob = Math.sin(t * 2) * 1.5;
      cx.fillStyle = '#a0522d';
      cx.beginPath(); cx.moveTo(38, 46 + bob); cx.lineTo(56, 46 + bob); cx.lineTo(51, 52 + bob); cx.lineTo(42, 52 + bob); cx.fill();
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.moveTo(47, 45 + bob); cx.lineTo(47, 33 + bob); cx.lineTo(40, 44 + bob); cx.fill();
      cx.fillStyle = wallC; this.rr(12, 20, 24, 18, 3); cx.fill();
      cx.fillStyle = roofC; this.rr(10, 14, 28, 9, 3); cx.fill();
    } else if (type === 'arena') {
      cx.fillStyle = '#e8d8b0';
      cx.beginPath(); cx.ellipse(32, 38, 26, 18, 0, 0, 7); cx.fill();
      cx.fillStyle = '#c9a86a';
      cx.beginPath(); cx.ellipse(32, 38, 17, 11, 0, 0, 7); cx.fill();
      cx.fillStyle = roofC;
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        cx.fillRect(32 + Math.cos(a) * 24 - 2, 38 + Math.sin(a) * 16 - 5, 4, 6);
      }
      cx.font = '11px sans-serif'; cx.textAlign = 'center'; cx.fillText('⚔️', 32, 42);
    } else {
      // базовий будиночок з дахом, характерним кольором і деталлю
      cx.fillStyle = wallC; this.rr(12, 26, 40, 30, 4); cx.fill();
      cx.fillStyle = roofC;
      cx.beginPath(); cx.moveTo(8, 28); cx.lineTo(32, 8); cx.lineTo(56, 28); cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.25)';
      cx.beginPath(); cx.moveTo(8, 28); cx.lineTo(32, 8); cx.lineTo(36, 11); cx.lineTo(14, 28); cx.fill();
      cx.fillStyle = '#7a5230'; this.rr(27, 42, 10, 14, 3); cx.fill(); // двері
      cx.fillStyle = '#ffe9a8'; // вікна світяться вночі
      this.rr(16, 32, 8, 8, 2); cx.fill(); this.rr(40, 32, 8, 8, 2); cx.fill();
      // деталі за типом
      cx.font = '12px sans-serif'; cx.textAlign = 'center';
      const detail = { sawmill: '🪚', warehouse: '📦', quarry: '⛏️', market: '⚖️', forge: '🔨', library: '📚', bank: '🏦', academy: '🎓' }[type];
      if (detail) cx.fillText(detail, 32, 24);
      if (type === 'forge' || type === 'house') {
        // дим із комина
        cx.fillStyle = type === 'forge' ? '#888' : '#bbb';
        for (let k = 0; k < 3; k++) {
          const ph = (t * 0.6 + k * 0.33) % 1;
          cx.globalAlpha = (1 - ph) * 0.5;
          cx.beginPath(); cx.arc(46, 12 - ph * 16, 2 + ph * 3.5, 0, 7); cx.fill();
        }
        cx.globalAlpha = 1;
      }
    }
    cx.restore();
  },

  drawPlacement(t) {
    const cx = this.cx;
    const pulse = 0.25 + Math.sin(t * 4) * 0.12;
    for (const i of this.placeList) {
      const { x, y } = this.plotXY(i);
      cx.fillStyle = `rgba(126,224,129,${pulse})`;
      this.rr(x + 4, y + 4, TILE - 8, TILE - 8, 8); cx.fill();
      cx.strokeStyle = '#7ee081'; cx.lineWidth = 2; cx.stroke();
    }
  },

  /* ---------------- жителі ---------------- */
  updateCitizens(dt, t) {
    const S = Game.S;
    // не більш як 40 спрайтів на екрані — заради продуктивності на слабких телефонах
    const want = Math.min(40, Math.max(0, S.citizens.length - Game.busyCitizens()));
    while (this.sprites.length < want) this.sprites.push(this.mkSprite(this.sprites.length));
    if (this.sprites.length > want) this.sprites.length = want;
    const cx = this.cx;
    for (let k = 0; k < this.sprites.length; k++) {
      const sp = this.sprites[k];
      const cit = S.citizens[k];
      const col = (cit && JOBS[cit.job] && JOBS[cit.job].color) || '#7f8c8d';
      // рух до цілі
      const dx = sp.tx - sp.x, dy = sp.ty - sp.y;
      const d = Math.hypot(dx, dy);
      if (d < 3) { this.retarget(sp, cit); }
      else { sp.x += dx / d * sp.v * dt; sp.y += dy / d * sp.v * dt; }
      const bob = Math.sin(t * 8 + sp.ph) * 1.2;
      // тінь, тіло, голова
      cx.fillStyle = 'rgba(0,0,0,.18)';
      cx.beginPath(); cx.ellipse(sp.x, sp.y + 6, 4.5, 2, 0, 0, 7); cx.fill();
      cx.fillStyle = col;
      this.rr(sp.x - 3.5, sp.y - 4 + bob, 7, 9, 3); cx.fill();
      cx.fillStyle = '#ffd9b3';
      cx.beginPath(); cx.arc(sp.x, sp.y - 7 + bob, 3.6, 0, 7); cx.fill();
      cx.fillStyle = col;
      cx.beginPath(); cx.arc(sp.x, sp.y - 9 + bob, 2.6, Math.PI, 0); cx.fill(); // шапочка
    }
  },
  mkSprite(k) {
    return { x: WORLD_W / 2, y: WORLD_H / 2, tx: Math.random() * WORLD_W, ty: Math.random() * (WORLD_H - 80) + 40,
      v: 16 + Math.random() * 14, ph: Math.random() * 7, idleT: 0 };
  },
  retarget(sp, cit) {
    // йдемо до своєї будівлі або блукаємо
    const S = Game.S;
    let opts = [];
    if (cit && JOBS[cit.job] && JOBS[cit.job].b) {
      S.plots.forEach((p, i) => { if (p.b === JOBS[cit.job].b && p.lvl > 0) opts.push(i); });
    }
    if (opts.length && Math.random() < 0.65) {
      const { x, y } = this.plotXY(opts[Math.floor(Math.random() * opts.length)]);
      sp.tx = x + 10 + Math.random() * (TILE - 20); sp.ty = y + TILE - 6;
    } else {
      sp.tx = MARGIN_X + Math.random() * COLS * TILE;
      sp.ty = MARGIN_TOP + Math.random() * ROWS * TILE;
    }
  },

  /* ---------------- ефекти ---------------- */
  drawEffects(dt) {
    const cx = this.cx;
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.t += dt; f.y -= 22 * dt;
      if (f.t > 1.4) { this.floats.splice(i, 1); continue; }
      cx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      cx.font = 'bold 12px sans-serif'; cx.textAlign = 'center';
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.5)';
      cx.strokeText(f.text, f.x, f.y);
      cx.fillStyle = f.color; cx.fillText(f.text, f.x, f.y);
      cx.globalAlpha = 1;
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 120 * dt;
      if (b.t > 0.9) { this.bursts.splice(i, 1); continue; }
      cx.globalAlpha = 1 - b.t / 0.9;
      cx.fillStyle = b.c;
      cx.fillRect(b.x - 2, b.y - 2, 4, 4);
      cx.globalAlpha = 1;
    }
  },

  /* ---------------- хмари, птахи, погода ---------------- */
  drawAmbient(dt, t) {
    const cx = this.cx;
    // хмари
    for (const c of this.clouds) {
      c.x += c.v * dt;
      if (c.x > WORLD_W + 60) { c.x = -60; c.y = 30 + Math.random() * 400; }
      cx.fillStyle = 'rgba(255,255,255,.55)';
      cx.beginPath();
      cx.arc(c.x, c.y, 12 * c.s, 0, 7);
      cx.arc(c.x + 12 * c.s, c.y + 3 * c.s, 9 * c.s, 0, 7);
      cx.arc(c.x - 12 * c.s, c.y + 3 * c.s, 9 * c.s, 0, 7);
      cx.fill();
    }
    // птахи час від часу
    if (Math.random() < dt * 0.06 && this.birds.length < 4)
      this.birds.push({ x: -10, y: 40 + Math.random() * 200, v: 35 + Math.random() * 20, ph: Math.random() * 7 });
    cx.strokeStyle = '#333'; cx.lineWidth = 1.4;
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.x += b.v * dt;
      if (b.x > WORLD_W + 10) { this.birds.splice(i, 1); continue; }
      const w = Math.sin(t * 10 + b.ph) * 3;
      cx.beginPath(); cx.moveTo(b.x - 4, b.y - w); cx.lineTo(b.x, b.y); cx.lineTo(b.x + 4, b.y - w); cx.stroke();
    }
    // погода
    this.weatherT -= dt;
    if (this.weatherT <= 0) this.pickWeather();
    if (this.weather !== 'sun') {
      const isSnow = this.weather === 'snow';
      if (this.drops.length < 90)
        for (let k = 0; k < 4; k++) this.drops.push({ x: Math.random() * WORLD_W, y: -10, v: isSnow ? 25 + Math.random() * 20 : 220 + Math.random() * 80, ph: Math.random() * 7 });
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const dr = this.drops[i];
        dr.y += dr.v * dt;
        dr.x += isSnow ? Math.sin(t * 2 + dr.ph) * 12 * dt : this.wind * dt;
        if (dr.y > WORLD_H) { this.drops.splice(i, 1); continue; }
        if (isSnow) {
          cx.fillStyle = 'rgba(255,255,255,.85)';
          cx.beginPath(); cx.arc(dr.x, dr.y, 1.7, 0, 7); cx.fill();
        } else {
          cx.strokeStyle = 'rgba(160,200,255,.6)'; cx.lineWidth = 1.2;
          cx.beginPath(); cx.moveTo(dr.x, dr.y); cx.lineTo(dr.x - 1, dr.y + 7); cx.stroke();
        }
      }
      if (!isSnow) { // легке затемнення в дощ
        cx.fillStyle = 'rgba(60,70,110,.12)';
        cx.fillRect(0, 0, WORLD_W, WORLD_H);
      }
    }
  },

  /* день/ніч: плавний нічний фільтр + світло вікон */
  drawLight(t) {
    const cx = this.cx;
    const p = this.dayPhase();
    // ніч із піком о фазі 0.85; крива плавно переходить через опівніч (обгортання фази)
    const distRaw = Math.abs(p - 0.85);
    const dist = Math.min(distRaw, 1 - distRaw);
    const night = Math.min(1, Math.max(0, (0.18 - dist) / 0.08));
    const sunset = p > 0.55 && p < 0.68 ? Math.sin((p - 0.55) / 0.13 * Math.PI) : 0;
    if (sunset > 0) {
      cx.fillStyle = `rgba(255,140,60,${sunset * 0.15})`;
      cx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (night > 0) {
      cx.fillStyle = `rgba(20,26,68,${night * 0.45})`;
      cx.fillRect(0, 0, WORLD_W, WORLD_H);
      // світло у вікнах будинків
      cx.fillStyle = `rgba(255,220,120,${night * 0.5})`;
      for (let i = 0; i < Game.S.plots.length; i++) {
        const pl = Game.S.plots[i];
        if (!pl.b || pl.lvl <= 0) continue;
        const { x, y } = this.plotXY(i);
        cx.beginPath(); cx.arc(x + TILE / 2, y + TILE / 2 + 4, 13, 0, 7); cx.fill();
      }
      // зорі
      cx.fillStyle = `rgba(255,255,255,${night * 0.8})`;
      for (let k = 0; k < 24; k++) {
        const hx = hash2(k, 1) * WORLD_W, hy = hash2(k, 2) * WORLD_H;
        const tw = Math.sin(t * 2 + k) * 0.5 + 0.5;
        cx.globalAlpha = night * tw;
        cx.fillRect(hx, hy, 1.6, 1.6);
      }
      cx.globalAlpha = 1;
    }
  },
};
