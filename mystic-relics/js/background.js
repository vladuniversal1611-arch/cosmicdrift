/* ============================================================
 * Mystic Relics — background.js
 * Живий анімований фон із паралаксом: три сцени (магічний ліс,
 * печера з кристалами, стародавній храм), світлячки, туман,
 * листя/іскри, пульсуюче світіння.
 *
 * Оптимізація: силуети шарів і м'які плями пре-рендеряться в
 * offscreen-канваси один раз на resize/зміну теми; у кадрі —
 * лише drawImage з паралакс-зсувом і ~40 спрайтів частинок.
 * Нові сцени додаються одним методом _scene<Name>().
 * ============================================================ */
'use strict';

const Background = {
  canvas: null, g: null, w: 0, h: 0,
  far: null, mid: null,          // пре-рендерені шари паралаксу
  fogSprite: null, gloSprite: null, flySprite: null,
  flies: [], leaves: [], fog: [],
  t: 0, _last: 0, _themeId: '',

  init(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    window.addEventListener('resize', () => this.build());
    this.build();
    this._last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this.t += dt;
      this.draw(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  theme() { return CFG.THEMES.find(t => t.id === Storage.data.theme) || CFG.THEMES[0]; },

  /** Повна перебудова шарів (resize або зміна теми). */
  build() {
    const th = this.theme();
    this._themeId = th.id;
    this.w = this.canvas.width = innerWidth;
    this.h = this.canvas.height = innerHeight;

    // --- Спрайт туману: велика м'яка пляма ---
    this.fogSprite = this._radial(260, 'rgba(255,255,255,0.16)');
    // --- Спрайт світіння світлячка ---
    this.flySprite = this._radial(22, th.accent);
    // --- Велике амбієнтне світіння ---
    this.gloSprite = this._radial(Math.max(this.w, 420), th.accent);

    // --- Шари силуетів ---
    this.far = this._layer(0.30, th);
    this.mid = this._layer(0.55, th);

    // --- Частинки ---
    const q = Storage.data.settings.quality === 'low';
    this.flies = Array.from({ length: q ? 8 : 22 }, () => ({
      x: Math.random() * this.w, y: this.h * 0.15 + Math.random() * this.h * 0.8,
      a: Math.random() * Math.PI * 2, sp: 8 + Math.random() * 18,
      ph: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 0.9
    }));
    this.leaves = Array.from({ length: q ? 5 : 12 }, () => this._leaf(true));
    this.fog = Array.from({ length: q ? 2 : 4 }, (_, i) => ({
      x: Math.random() * this.w, y: this.h * (0.35 + 0.16 * i),
      sp: 6 + Math.random() * 10, sc: 1.6 + Math.random() * 2.4, al: 0.35 + Math.random() * 0.3
    }));
  },

  _leaf(anywhere) {
    return {
      x: Math.random() * this.w,
      y: anywhere ? Math.random() * this.h : -20,
      vy: 22 + Math.random() * 26, ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 2,
      s: 0.6 + Math.random() * 0.8
    };
  },

  /** М'яка радіальна пляма кольору у offscreen-спрайт. */
  _radial(r, color) {
    const c = document.createElement('canvas');
    c.width = c.height = r * 2;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, r * 2, r * 2);
    return c;
  },

  /** Пре-рендер шару силуетів. depth 0..1 — наскільки «близько». */
  _layer(depth, th) {
    const c = document.createElement('canvas');
    c.width = this.w + 120;                 // запас для паралакс-зсуву
    c.height = this.h;
    const g = c.getContext('2d');
    const rnd = Utils.rng((th.id.length * 977 + Math.round(depth * 100)) | 0);
    const dark = `rgba(0,0,0,${0.28 + depth * 0.3})`;
    const scene = th.scene || 'forest';
    if (scene === 'forest') this._sceneForest(g, c.width, c.height, depth, dark, rnd, th);
    else if (scene === 'cave') this._sceneCave(g, c.width, c.height, depth, dark, rnd, th);
    else this._sceneTemple(g, c.width, c.height, depth, dark, rnd, th);
    return c;
  },

  /* ---- Сцена: магічний ліс — стовбури з кронами по краях кадру ---- */
  _sceneForest(g, w, h, depth, dark, rnd, th) {
    g.fillStyle = dark;
    const n = Math.round(4 + depth * 3);
    for (let i = 0; i < n; i++) {
      // Дерева тяжіють до країв, центр лишається «повітряним»
      const edge = i % 2 === 0;
      const x = edge
        ? rnd() * w * 0.3
        : w - rnd() * w * 0.3;
      const tw = (18 + rnd() * 22) * (0.5 + depth);
      const ty = -h * 0.05 + rnd() * h * 0.12;      // верхівка за кадром
      // Стовбур, що звужується догори, з легким вигином
      const bend = (rnd() - 0.5) * 40;
      g.beginPath();
      g.moveTo(x - tw / 2, h);
      g.quadraticCurveTo(x - tw * 0.25 + bend, h * 0.5, x - tw * 0.2 + bend, ty);
      g.lineTo(x + tw * 0.2 + bend, ty);
      g.quadraticCurveTo(x + tw * 0.25 + bend, h * 0.5, x + tw / 2, h);
      g.fill();
      // Кілька гілок убік
      for (let b = 0; b < 2; b++) {
        const by = h * (0.12 + rnd() * 0.3);
        const dir = rnd() < 0.5 ? -1 : 1;
        const len = (40 + rnd() * 50) * (0.5 + depth);
        g.save();
        g.translate(x + bend * 0.6, by);
        g.rotate(dir * (0.5 + rnd() * 0.5));
        g.fillRect(0, -tw * 0.1, len, tw * 0.2);
        // Листяна китиця на кінці гілки
        g.beginPath();
        g.ellipse(len, 0, len * 0.42, len * 0.2, 0.2, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    // Нависле листя згори (як рамка кадру)
    for (let i = 0; i < 6 + depth * 5; i++) {
      const x = rnd() * w;
      const br = (24 + rnd() * 34) * (0.4 + depth * 0.7);
      g.beginPath();
      g.ellipse(x, -br * 0.35 + rnd() * br * 0.4, br, br * 0.55, (rnd() - 0.5) * 0.5, 0, Math.PI * 2);
      g.fill();
    }
    // Трава-пагорб унизу
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, h - (14 + Math.sin(x * 0.02 + depth * 9) * 8) * (0.5 + depth));
    g.lineTo(w, h);
    g.fill();
    // Кущики трави
    for (let i = 0; i < 10; i++) {
      const x = rnd() * w, gh = (8 + rnd() * 14) * (0.5 + depth);
      for (let b = -2; b <= 2; b++) {
        g.beginPath();
        g.moveTo(x + b * 3, h);
        g.quadraticCurveTo(x + b * 5, h - gh * 0.7, x + b * 7, h - gh);
        g.quadraticCurveTo(x + b * 4, h - gh * 0.5, x + b * 3 + 2, h);
        g.fill();
      }
    }
  },

  /* ---- Сцена: печера — сталактити та світні кристали ---- */
  _sceneCave(g, w, h, depth, dark, rnd, th) {
    g.fillStyle = dark;
    // Сталактити зверху
    const n = Math.round(8 + depth * 8);
    for (let i = 0; i < n; i++) {
      const x = (i + rnd()) * (w / n);
      const len = (h * 0.08 + rnd() * h * 0.16) * (0.5 + depth);
      const wd = (14 + rnd() * 26) * (0.5 + depth);
      g.beginPath();
      g.moveTo(x - wd, 0); g.quadraticCurveTo(x, len * 0.6, x, len);
      g.quadraticCurveTo(x, len * 0.6, x + wd, 0);
      g.fill();
    }
    // Кам'яні брили знизу
    for (let i = 0; i < n / 2; i++) {
      const x = rnd() * w, r = (30 + rnd() * 60) * (0.5 + depth);
      g.beginPath(); g.ellipse(x, h + r * 0.3, r, r * 0.8, 0, Math.PI, 0); g.fill();
    }
    // Світні кристали (акцентний колір, ближній шар яскравіший)
    for (let i = 0; i < 4 + depth * 5; i++) {
      const x = rnd() * w, base = h - rnd() * h * 0.12;
      const ch = (26 + rnd() * 44) * (0.4 + depth), cw = ch * 0.3;
      const tilt = (rnd() - 0.5) * 0.7;
      g.save();
      g.translate(x, base); g.rotate(tilt);
      g.globalAlpha = 0.5 + depth * 0.4;
      // Сяйво за кристалом
      const glow = g.createRadialGradient(0, -ch / 2, 0, 0, -ch / 2, ch * 1.4);
      glow.addColorStop(0, th.accent + '66'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow;
      g.fillRect(-ch * 1.4, -ch * 2.4, ch * 2.8, ch * 2.8);
      // Сам кристал
      g.fillStyle = th.accent + 'cc';
      g.beginPath();
      g.moveTo(0, -ch); g.lineTo(cw, -ch * 0.55); g.lineTo(cw * 0.7, 0);
      g.lineTo(-cw * 0.7, 0); g.lineTo(-cw, -ch * 0.55);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)';          // грань-відблиск
      g.beginPath(); g.moveTo(0, -ch); g.lineTo(cw * 0.35, -ch * 0.5); g.lineTo(0, 0); g.closePath(); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  },

  /* ---- Сцена: стародавній храм — колони та арки ---- */
  _sceneTemple(g, w, h, depth, dark, rnd, th) {
    g.fillStyle = dark;
    const n = Math.round(4 + depth * 4);
    const cw = (26 + depth * 30);
    for (let i = 0; i < n; i++) {
      const x = (i + 0.3 + rnd() * 0.4) * (w / n);
      const top = h * (0.16 - depth * 0.08) + rnd() * h * 0.1;
      const broken = rnd() < 0.4;
      const colH = broken ? h * (0.3 + rnd() * 0.3) : h - top;
      // Колона з канелюрами
      g.fillRect(x - cw / 2, h - colH, cw, colH);
      // Капітель та база
      g.fillRect(x - cw * 0.75, h - colH - cw * 0.35, cw * 1.5, cw * 0.4);
      g.fillRect(x - cw * 0.7, h - cw * 0.35, cw * 1.4, cw * 0.4);
      // Уламок арки між сусідніми колонами
      if (!broken && rnd() < 0.5) {
        g.beginPath();
        g.moveTo(x, h - colH);
        g.quadraticCurveTo(x + w / n / 2, h - colH - 40 * (0.5 + depth), x + w / n, h - colH + 10);
        g.lineTo(x + w / n, h - colH + 26);
        g.quadraticCurveTo(x + w / n / 2, h - colH - 14 * (0.5 + depth), x, h - colH + 16);
        g.fill();
      }
    }
    // Підлога з плит
    g.fillRect(0, h - 12 * (0.5 + depth) - 2, w, 20 * (0.5 + depth));
  },

  /* ------------------------------------------------------------ */
  draw(dt) {
    const g = this.g, w = this.w, h = this.h;
    if (this._themeId !== Storage.data.theme) this.build();   // тема змінилась
    g.clearRect(0, 0, w, h);
    const th = this.theme();

    // Амбієнтне світіння, що «дихає»
    g.globalAlpha = 0.10 + 0.045 * Math.sin(this.t * 0.7);
    g.drawImage(this.gloSprite, w / 2 - this.gloSprite.width / 2, -this.gloSprite.height * 0.45);
    g.globalAlpha = 1;

    // Паралакс: далекий шар пливе повільно, середній швидше
    const px = Math.sin(this.t * 0.05) * 26;
    g.drawImage(this.far, -60 + px * 0.4, 0);
    g.drawImage(this.mid, -60 + px, 0);

    const lowQ = Storage.data.settings.quality === 'low';

    // Туман — напівпрозорі плями, що дрейфують
    for (const f of this.fog) {
      f.x += f.sp * dt;
      const fw = this.fogSprite.width * f.sc;
      if (f.x - fw / 2 > w) f.x = -fw / 2;
      g.globalAlpha = f.al * (0.5 + 0.2 * Math.sin(this.t * 0.4 + f.y));
      g.drawImage(this.fogSprite, f.x - fw / 2, f.y - fw / 4, fw, fw / 2);
    }
    g.globalAlpha = 1;

    // Листя (ліс/небо) або іскри, що піднімаються (печера/храм)
    const rising = (th.scene === 'cave' || th.scene === 'temple');
    for (const l of this.leaves) {
      l.ph += dt * 1.6; l.rot += l.vr * dt;
      if (rising) { l.y -= l.vy * 0.5 * dt; if (l.y < -20) Object.assign(l, this._leaf(false), { y: h + 10 }); }
      else { l.y += l.vy * dt; if (l.y > h + 20) Object.assign(l, this._leaf(false)); }
      l.x += Math.sin(l.ph) * 22 * dt;
      g.save();
      g.translate(l.x, l.y); g.rotate(l.rot); g.scale(l.s, l.s);
      if (rising) {                       // іскра
        g.globalAlpha = 0.5 + 0.4 * Math.sin(l.ph * 2);
        g.fillStyle = th.accent;
        g.beginPath(); g.arc(0, 0, 2.4, 0, Math.PI * 2); g.fill();
      } else {                            // листок
        g.globalAlpha = 0.7;
        g.fillStyle = th.accent + '99';
        g.beginPath();
        g.moveTo(0, -7); g.quadraticCurveTo(6, -2, 0, 7); g.quadraticCurveTo(-6, -2, 0, -7);
        g.fill();
      }
      g.restore();
    }
    g.globalAlpha = 1;

    // Світлячки — блукаючі точки зі світінням
    if (!lowQ) {
      for (const f of this.flies) {
        f.a += (Math.random() - 0.5) * 2.4 * dt;
        f.x += Math.cos(f.a) * f.sp * dt;
        f.y += Math.sin(f.a) * f.sp * dt * 0.6;
        if (f.x < -20) f.x = w + 20; if (f.x > w + 20) f.x = -20;
        if (f.y < h * 0.06) f.y = h * 0.06; if (f.y > h) f.y = h * 0.5;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.t * 2.2 + f.ph));
        const s = this.flySprite.width * f.s;
        g.globalAlpha = tw * 0.85;
        g.drawImage(this.flySprite, f.x - s / 2, f.y - s / 2, s, s);
        g.globalAlpha = tw;
        g.fillStyle = '#fffbe8';
        g.beginPath(); g.arc(f.x, f.y, 1.6 * f.s, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }
  }
};
