/**
 * StackTower – polished stacking mini-game
 *
 * Usage:
 *   const game = new StackTower(canvas, {
 *     onGameOver:    (result) => {},   // { score, coinsEarned, bestScore, exit? }
 *     onCoinsUpdate: (total)  => {},
 *   });
 *
 * Public API:
 *   game.coinsEarned   – coins earned this run
 *   game.score         – blocks placed this run
 *   game.bestScore     – all-time best (localStorage)
 *   game.pause()
 *   game.resume()
 *   game.gameOver()    – force game over
 *   game.destroy()     – cleanup (removes listeners, cancels rAF)
 */
class StackTower {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.onGameOver    = options.onGameOver    || null;
    this.onCoinsUpdate = options.onCoinsUpdate || null;

    this.coinsEarned = 0;
    this.score       = 0;
    this.bestScore   = parseInt(localStorage.getItem('st_best') || '0');

    this._destroyed = false;
    this._paused    = false;
    this._dpr       = window.devicePixelRatio || 1;
    this._shakeX    = 0;
    this._shakeY    = 0;

    this._setupCanvas();
    this._bindEvents();
    this._reset();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  // ─── Canvas ────────────────────────────────────────────────────────────────

  _setupCanvas() {
    const r = this.canvas.getBoundingClientRect();
    this.W = r.width  || 400;
    this.H = r.height || 600;
    this.canvas.width  = Math.round(this.W * this._dpr);
    this.canvas.height = Math.round(this.H * this._dpr);
    this.ctx.scale(this._dpr, this._dpr);
  }

  // ─── State ─────────────────────────────────────────────────────────────────

  _reset() {
    this.coinsEarned  = 0;
    this.score        = 0;
    this._state       = 'playing'; // 'playing' | 'gameover'
    this._paused      = false;
    this._stacks      = [];
    this._moving      = null;
    this._falling     = [];
    this._particles   = [];
    this._texts       = [];
    this._combo       = 0;
    this._flashAlpha  = 0;
    this._colorIdx    = 0;
    this._goButtons   = null;

    const bw = Math.min(this.W * 0.62, 230);
    const bx = (this.W - bw) / 2;
    this._stacks.push({ x: bx, y: this.H - 90, w: bw, h: 30, c: this._nextColor() });
    this._spawnMoving();
  }

  _nextColor() {
    const PALETTE = [
      { top: '#66BB6A', front: '#2E7D32' },
      { top: '#26C6DA', front: '#006064' },
      { top: '#42A5F5', front: '#1565C0' },
      { top: '#AB47BC', front: '#6A1B9A' },
      { top: '#F06292', front: '#880E4F' },
      { top: '#EF5350', front: '#B71C1C' },
      { top: '#FFA726', front: '#E65100' },
      { top: '#FFEE58', front: '#F57F17' },
    ];
    return PALETTE[this._colorIdx++ % PALETTE.length];
  }

  _spawnMoving() {
    const prev  = this._stacks[this._stacks.length - 1];
    const speed = Math.min(2.4 + this.score * 0.13, 7.5);
    const left  = Math.random() < 0.5;
    this._moving = {
      x:  left ? -(prev.w + 20) : this.W + 20,
      y:  prev.y - 34,
      w:  prev.w,
      h:  30,
      c:  this._nextColor(),
      vx: left ? speed : -speed,
    };
  }

  // ─── Placement ─────────────────────────────────────────────────────────────

  _place() {
    if (this._state !== 'playing' || this._paused || !this._moving) return;
    const m    = this._moving;
    const prev = this._stacks[this._stacks.length - 1];

    const left    = Math.max(m.x, prev.x);
    const right   = Math.min(m.x + m.w, prev.x + prev.w);
    const overlap = right - left;

    if (overlap <= 2) {
      this._moving = null;
      this._doGameOver();
      return;
    }

    const isPerfect = Math.abs(m.x - prev.x) < 8;

    if (isPerfect) {
      this._combo++;
      const placed = { x: prev.x, y: m.y, w: prev.w, h: m.h, c: m.c };
      this._stacks.push(placed);
      this._onPerfect(placed);
    } else {
      this._combo = 0;
      const trimW = m.w - overlap;
      const trimX = m.x < prev.x ? m.x : prev.x + prev.w;
      if (trimW > 1) {
        this._falling.push({
          x: trimX, y: m.y, w: trimW, h: m.h, c: m.c,
          vx: m.x < prev.x ? -1.8 : 1.8, vy: 0,
          angle: 0, va: (Math.random() - 0.5) * 0.09,
          alpha: 1,
        });
      }
      const placed = { x: left, y: m.y, w: overlap, h: m.h, c: m.c };
      this._stacks.push(placed);
      this._burst(left + overlap / 2, m.y + m.h / 2, m.c.top, 9);
    }

    this._moving = null;
    this.score++;
    const coins = isPerfect ? 3 : 1;
    this.coinsEarned += coins;
    if (this.onCoinsUpdate) this.onCoinsUpdate(this.coinsEarned);

    this._shiftCamera();

    setTimeout(() => {
      if (!this._destroyed && this._state === 'playing') this._spawnMoving();
    }, 80);
  }

  _shiftCamera() {
    const top    = this._stacks[this._stacks.length - 1];
    const target = this.H * 0.36;
    if (top.y < target) {
      const dy = target - top.y;
      for (const s of this._stacks)  s.y += dy;
      for (const f of this._falling) f.y += dy;
    }
  }

  _onPerfect(block) {
    this._flashAlpha = 0.32;
    this._shake(5);
    this._burst(block.x + block.w / 2, block.y, '#FFD700', 22);
    this._addText('PERFECT!', block.x + block.w / 2, block.y - 8, '#FFD700', 30);
    if (this._combo > 1)
      this._addText(`COMBO ×${this._combo}`, block.x + block.w / 2, block.y - 46, '#FF6B35', 22);
  }

  _doGameOver() {
    this._state = 'gameover';
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('st_best', this.bestScore);
    }
    this._shake(10);
    if (this.onGameOver)
      setTimeout(() => this.onGameOver({ score: this.score, coinsEarned: this.coinsEarned, bestScore: this.bestScore }), 700);
  }

  // ─── Effects ───────────────────────────────────────────────────────────────

  _shake(strength) {
    let t = 0;
    const id = setInterval(() => {
      t++;
      const s = strength * (1 - t / 12);
      this._shakeX = (Math.random() - 0.5) * s * 2;
      this._shakeY = (Math.random() - 0.5) * s * 2;
      if (t >= 12) { clearInterval(id); this._shakeX = this._shakeY = 0; }
    }, 16);
  }

  _burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a   = (Math.PI * 2 * i / count) + Math.random() * 0.6;
      const spd = 1.5 + Math.random() * 3.5;
      this._particles.push({
        x, y,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1.8,
        life: 1, decay: 0.022 + Math.random() * 0.02,
        r: 3 + Math.random() * 5, color,
      });
    }
  }

  _addText(text, x, y, color, size) {
    this._texts.push({ text, x, y, color, size, life: 1.3, vy: -1.3 });
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  _loop() {
    if (this._destroyed) return;
    this._raf = requestAnimationFrame(() => this._loop());
    if (!this._paused) this._update();
    this._render();
  }

  _update() {
    if (this._moving) {
      this._moving.x += this._moving.vx;
      if (this._moving.x + this._moving.w >= this.W + 8 || this._moving.x <= -8)
        this._moving.vx = -this._moving.vx;
    }

    for (const f of this._falling) {
      f.vy    += 0.45;
      f.y     += f.vy;
      f.x     += f.vx;
      f.angle += f.va;
      f.alpha -= 0.007;
    }
    this._falling = this._falling.filter(f => f.y < this.H + 100 && f.alpha > 0);

    for (const p of this._particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.13;
      p.life -= p.decay;
    }
    this._particles = this._particles.filter(p => p.life > 0);

    for (const t of this._texts) {
      t.y    += t.vy;
      t.life -= 0.018;
    }
    this._texts = this._texts.filter(t => t.life > 0);

    if (this._flashAlpha > 0) this._flashAlpha = Math.max(0, this._flashAlpha - 0.025);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(this._shakeX), Math.round(this._shakeY));

    this._drawBg();

    for (const s of this._stacks)  this._drawBlock(s.x, s.y, s.w, s.h, s.c);

    if (this._moving) {
      const m    = this._moving;
      const prev = this._stacks[this._stacks.length - 1];
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(prev.x, m.y, prev.w, m.h);
      ctx.restore();
      this._drawBlock(m.x, m.y, m.w, m.h, m.c);
    }

    for (const f of this._falling) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
      ctx.rotate(f.angle);
      this._drawBlock(-f.w / 2, -f.h / 2, f.w, f.h, f.c);
      ctx.restore();
    }

    for (const p of this._particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * Math.max(0.1, p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const t of this._texts) {
      ctx.save();
      ctx.globalAlpha    = Math.min(1, t.life);
      ctx.font           = `bold ${t.size}px Arial`;
      ctx.textAlign      = 'center';
      ctx.textBaseline   = 'alphabetic';
      ctx.strokeStyle    = 'rgba(0,0,0,0.65)';
      ctx.lineWidth      = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    if (this._flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this._flashAlpha;
      ctx.fillStyle   = '#FFD700';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();
    }

    this._drawHUD();
    if (this._state === 'gameover') this._drawGameOver();

    ctx.restore();
  }

  _drawBg() {
    const { ctx, W, H } = this;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#0d1b3e');
    sky.addColorStop(0.4, '#1a2a6c');
    sky.addColorStop(0.75,'#1565C0');
    sky.addColorStop(1,   '#1E88E5');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    [[0.08,0.06],[0.18,0.11],[0.31,0.04],[0.45,0.09],[0.57,0.03],[0.68,0.08],[0.79,0.12],[0.9,0.05],[0.95,0.15],[0.12,0.19],[0.62,0.18],[0.85,0.22]].forEach(([rx,ry]) => {
      ctx.beginPath();
      ctx.arc(rx * W, ry * H, 1.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Moon
    ctx.fillStyle = '#FFFDE7';
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.1, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a2a6c';
    ctx.beginPath();
    ctx.arc(W * 0.82 + 6, H * 0.1 - 3, 14, 0, Math.PI * 2);
    ctx.fill();

    // City silhouette
    ctx.fillStyle = 'rgba(8,12,30,0.8)';
    ctx.beginPath();
    const buildings = [
      [0,0.16,0.07],[0.07,0.24,0.04],[0.11,0.13,0.06],[0.17,0.21,0.05],
      [0.22,0.09,0.06],[0.28,0.19,0.04],[0.32,0.29,0.06],[0.38,0.11,0.05],
      [0.43,0.23,0.07],[0.5,0.16,0.05],[0.55,0.31,0.06],[0.61,0.13,0.04],
      [0.65,0.21,0.07],[0.72,0.09,0.05],[0.77,0.26,0.06],[0.83,0.16,0.07],
      [0.9,0.19,0.08],[0.98,0.11,0.02],
    ];
    for (const [bx, bh, bw] of buildings) {
      const bX = bx * W, bY = H - bh * H * 0.55, bW = bw * W;
      ctx.rect(bX, bY, bW, H - bY);
    }
    ctx.fill();

    // Lit windows
    ctx.fillStyle = 'rgba(255,220,100,0.55)';
    for (const [bx, bh, bw] of buildings) {
      const bX = bx * W, bY = H - bh * H * 0.55, bW = bw * W, bH = H - bY;
      for (let wy = bY + 4; wy < H - 8; wy += 10) {
        for (let wx = bX + 3; wx < bX + bW - 4; wx += 8) {
          if (Math.random() < 0.38) ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  _drawBlock(x, y, w, h, c) {
    const ctx  = this.ctx;
    const topH = Math.ceil(h * 0.44);
    const botH = h - topH;
    const r    = 5;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    this._rr(x + 3, y + topH + 3, w, botH, [0, 0, r, r]);
    ctx.fill();
    ctx.restore();

    // Front face
    ctx.fillStyle = c.front;
    ctx.beginPath();
    this._rr(x, y + topH - 1, w, botH + 1, [0, 0, r, r]);
    ctx.fill();

    // Top face with gradient
    const tg = ctx.createLinearGradient(x, y, x, y + topH);
    tg.addColorStop(0, this._lighten(c.top, 0.18));
    tg.addColorStop(1, c.top);
    ctx.fillStyle = tg;
    ctx.beginPath();
    this._rr(x, y, w, topH + 1, [r, r, 0, 0]);
    ctx.fill();

    // Shine strip
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    this._rr(x + 4, y + 2, w - 8, Math.max(3, topH * 0.35), 2);
    ctx.fill();

    // Top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(x + r, y + 0.5);
    ctx.lineTo(x + w - r, y + 0.5);
    ctx.stroke();
  }

  _drawHUD() {
    const { ctx, W } = this;

    // Coins pill
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.beginPath();
    this._rr(10, 10, 112, 38, 19);
    ctx.fill();
    ctx.font          = '20px Arial';
    ctx.textAlign     = 'left';
    ctx.textBaseline  = 'middle';
    ctx.fillText('🪙', 16, 29);
    ctx.font      = 'bold 16px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(this.coinsEarned, 44, 29);
    ctx.restore();

    // Score (center)
    ctx.save();
    ctx.font        = 'bold 26px Arial';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth   = 3;
    ctx.strokeText(this.score, W / 2, 11);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(this.score, W / 2, 11);
    ctx.restore();

    // Best pill
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.beginPath();
    this._rr(W - 122, 10, 112, 38, 19);
    ctx.fill();
    ctx.font          = 'bold 11px Arial';
    ctx.textAlign     = 'right';
    ctx.textBaseline  = 'top';
    ctx.fillStyle     = '#FFD700';
    ctx.fillText('BEST', W - 14, 14);
    ctx.font          = 'bold 16px Arial';
    ctx.fillStyle     = '#FFFFFF';
    ctx.textBaseline  = 'alphabetic';
    ctx.fillText(this.bestScore, W - 14, 41);
    ctx.restore();
  }

  _drawGameOver() {
    const { ctx, W, H } = this;

    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(0, 0, W, H);

    const pw = Math.min(300, W - 40);
    const ph = 320;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    // Panel shadow + body
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = 24;
    ctx.shadowOffsetY = 8;
    const pg = ctx.createLinearGradient(px, py, px, py + ph);
    pg.addColorStop(0, '#1c1c40');
    pg.addColorStop(1, '#11112c');
    ctx.fillStyle = pg;
    ctx.beginPath();
    this._rr(px, py, pw, ph, 20);
    ctx.fill();
    ctx.restore();

    // Gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    this._rr(px, py, pw, ph, 20);
    ctx.stroke();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';

    // Title
    ctx.font      = 'bold 32px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('GAME OVER', W / 2, py + 52);

    // Divider
    ctx.strokeStyle = 'rgba(255,215,0,0.25)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 22, py + 62);
    ctx.lineTo(px + pw - 22, py + 62);
    ctx.stroke();

    // Final score
    ctx.font      = '13px Arial';
    ctx.fillStyle = '#7788AA';
    ctx.fillText('Final Score', W / 2, py + 88);
    ctx.font      = 'bold 44px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(this.score, W / 2, py + 132);

    // Coins earned
    ctx.font      = '13px Arial';
    ctx.fillStyle = '#7788AA';
    ctx.fillText('Coins Earned', W / 2, py + 160);
    ctx.font      = 'bold 22px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🪙 ' + this.coinsEarned, W / 2, py + 186);

    // Best score
    ctx.font      = '13px Arial';
    ctx.fillStyle = '#7788AA';
    ctx.fillText('Best Score', W / 2, py + 213);
    ctx.font      = 'bold 20px Arial';
    ctx.fillStyle = '#64B5F6';
    ctx.fillText(this.bestScore, W / 2, py + 236);

    // Play Again button
    const b1y = py + ph - 74;
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    this._rr(px + 26, b1y, pw - 52, 40, 12);
    ctx.fill();
    ctx.font      = 'bold 17px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('PLAY AGAIN', W / 2, b1y + 26);

    // Exit button
    const bw2 = (pw - 62) / 2;
    const b2y = py + ph - 26;
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    this._rr(px + 26, b2y - 18, bw2, 26, 8);
    ctx.fill();
    ctx.font      = 'bold 12px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('EXIT', px + 26 + bw2 / 2, b2y - 1);

    this._goButtons = {
      playAgain: { x: px + 26,       y: b1y,      w: pw - 52, h: 40 },
      exit:      { x: px + 26,       y: b2y - 18, w: bw2,     h: 26 },
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  _rr(x, y, w, h, radii) {
    const ctx = this.ctx;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, radii);
      return;
    }
    const r  = Array.isArray(radii) ? 0 : (radii || 0);
    const tl = Array.isArray(radii) ? (radii[0] || 0) : r;
    const tr = Array.isArray(radii) ? (radii[1] || tl) : r;
    const br = Array.isArray(radii) ? (radii[2] || tl) : r;
    const bl = Array.isArray(radii) ? (radii[3] || tl) : r;
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y,         x + tl, y);
    ctx.closePath();
  }

  _lighten(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (n >> 16)        + Math.round(255 * amt));
    const g = Math.min(255, ((n >> 8) & 0xFF) + Math.round(255 * amt));
    const b = Math.min(255, (n & 0xFF)        + Math.round(255 * amt));
    return `rgb(${r},${g},${b})`;
  }

  _inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    this._onClick = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      let cx, cy;
      if (e.changedTouches) {
        cx = e.changedTouches[0].clientX - rect.left;
        cy = e.changedTouches[0].clientY - rect.top;
      } else {
        cx = e.clientX - rect.left;
        cy = e.clientY - rect.top;
      }

      if (this._state === 'gameover' && this._goButtons) {
        if (this._inRect(cx, cy, this._goButtons.playAgain)) { this._reset(); return; }
        if (this._inRect(cx, cy, this._goButtons.exit)) {
          if (this.onGameOver)
            this.onGameOver({ score: this.score, coinsEarned: this.coinsEarned, bestScore: this.bestScore, exit: true });
          return;
        }
        return;
      }

      this._place();
    };
    this.canvas.addEventListener('click',    this._onClick);
    this.canvas.addEventListener('touchend', this._onClick, { passive: false });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  pause()  { this._paused = true;  }
  resume() { this._paused = false; }

  gameOver() { if (this._state === 'playing') this._doGameOver(); }

  destroy() {
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    this.canvas.removeEventListener('click',    this._onClick);
    this.canvas.removeEventListener('touchend', this._onClick);
  }
}

if (typeof module !== 'undefined') module.exports = StackTower;
