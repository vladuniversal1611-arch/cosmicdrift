/**
 * DriftSystem.js
 * -----------------------------------------------------------------------------
 * The signature "Cosmic Drift" mechanic — the game's namesake and its core
 * differentiator from a static block-placement puzzle. Every few placements the
 * whole board DRIFTS one pull toward a telegraphed direction: all loose crystals
 * slide and compact that way (BoardSystem.applyDrift), and any lines the slide
 * completes clear automatically.
 *
 * Because the next drift direction is always shown in advance, the puzzle stops
 * being pure packing and becomes dynamic planning: you place crystals
 * anticipating the shift and set up clears that only complete after the board
 * drifts. It is deterministic (never random) and only ever compacts — it frees
 * space, so it adds rhythm and payoff without ever creating a dead end.
 *
 * Events:
 *   listens 'game:started', 'game:piecePlaced'
 *   emits   'drift:changed' ({ left, dir })   telegraph update
 *           'drift:triggered' ({ dir, moved })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Config } from '../../config/Config.js';
import { Haptics } from '../../utils/Haptics.js';
import { Rect } from '../../utils/Rect.js';

/** Telegraphed rotation of drift pulls. */
const DIRS = [
  { id: 'down', dx: 0, dy: 1 },
  { id: 'left', dx: -1, dy: 0 },
  { id: 'up', dx: 0, dy: -1 },
  { id: 'right', dx: 1, dy: 0 },
];

export class DriftSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'drift';
    this._every = Config.drift?.everyPlacements ?? 5;
    this._left = this._every;   // placements until the next drift
    this._dir = 0;              // index into DIRS
    this._want = false;         // drift requested, waiting for a free board
    this._active = false;       // a run is in progress
    this._t = 0;
    this._flash = 0;            // brief post-drift telegraph flash
    this._steerCost = Config.drift?.steerCost ?? 35;
    this._steerBtn = null;      // fixed tap target, sized on init
    this._steerFlash = 0;       // green pulse after a successful steer
    this._denyFlash = 0;        // red pulse when steering is unaffordable
    this._wind = [];            // cosmic-wind streaks drifting across the board
  }

  onInit() {
    const c = this.game.canvas;
    this._steerBtn = new Rect(c.width * 0.055, c.height * 0.80, 132, 96);

    this.listen('input:tap', ({ x, y }) => this._onTap(x, y));
    // The authored opening can keep a level static (e.g. level 1 teaches placing
    // before the board ever drifts). `drift:false` in the level payload disables
    // the mechanic for that level; anything else re-enables it.
    this._allowed = true;
    this.listen('level:changed', ({ drift }) => { this._allowed = drift !== false; });
    this.listen('game:started', () => {
      this._active = true;
      this._left = this._every;
      this._dir = 0;
      this._want = false;
      this.events.emit('drift:changed', { left: this._left, dir: DIRS[this._dir].id });
    });
    this.listen('game:over', () => { this._active = false; this._want = false; });
    this.listen('game:piecePlaced', () => this._onPlaced());
  }

  get dir() { return DIRS[this._dir]; }

  /** Steering is allowed during the countdown of a run, not mid-slide. */
  get _canSteer() {
    if (!this._active) return false;
    const gp = this.game.getSystem('gameplay');
    if (gp && !gp.isPlaying) return false;
    if (this.game.getSystem('board')?._driftPending) return false;
    return true;
  }

  _onTap(x, y) {
    if (!this._canSteer || !this._steerBtn?.contains(x, y)) return;
    const gp = this.game.getSystem('gameplay');
    if (!gp) return;
    if (gp.energy < this._steerCost) {
      this._denyFlash = 0.7;
      this.game.getSystem('audio')?.play('invalid');
      return;
    }
    // Pay energy (trading against the Dragon ultimate) and rotate the next pull.
    gp.addEnergy(-this._steerCost);
    this._dir = (this._dir + 1) % DIRS.length;
    this._steerFlash = 1;
    this.game.getSystem('audio')?.play('pickup', { rate: 1.2 });
    Haptics.light(this.game);
    this.events.emit('drift:changed', { left: this._left, dir: DIRS[this._dir].id, steered: true });
  }

  _onPlaced() {
    if (!this._active) return;
    this._left = Math.max(0, this._left - 1);
    if (this._left === 0) this._want = true;
    this.events.emit('drift:changed', { left: this._left, dir: DIRS[this._dir].id });
  }

  /** The board must be idle (no clear/drift animating, no active drag). */
  get _free() {
    const gp = this.game.getSystem('gameplay');
    if (gp && !gp.isPlaying) return false;
    const board = this.game.getSystem('board');
    if (!board || board.isClearing || board._driftPending) return false;
    if (this.game.getSystem('pieces')?.isDragging) return false;
    return true;
  }

  update(dt) {
    this._t += dt;
    if (this._flash > 0) this._flash = Math.max(0, this._flash - dt * 2);
    if (this._steerFlash > 0) this._steerFlash = Math.max(0, this._steerFlash - dt * 2);
    if (this._denyFlash > 0) this._denyFlash = Math.max(0, this._denyFlash - dt * 2);

    if (this._active && this._allowed) this._updateWind(dt);
    if (!this._active || !this._allowed || !this._want || !this._free) return;

    const dir = DIRS[this._dir];
    const moved = this.game.getSystem('board')?.applyDrift(dir) ?? 0;
    this.events.emit('drift:triggered', { dir: dir.id, moved });
    Haptics.medium(this.game);
    this._flash = 1;
    // Advance the telegraph to the next pull.
    this._want = false;
    this._left = this._every;
    this._dir = (this._dir + 1) % DIRS.length;
    this.events.emit('drift:changed', { left: this._left, dir: DIRS[this._dir].id });
  }

  // --- Cosmic wind (readability) ---------------------------------------------

  /** How strongly the wind blows: a gentle ambient breeze that ramps as the
   *  next drift nears and gusts hard the moment it fires. */
  _windIntensity() {
    let i = 0.18;
    if (this._left <= 2) i += (3 - this._left) * 0.14;
    if (this._want) i = Math.max(i, 0.85);
    i += this._flash * 0.9;
    return Math.min(1.4, i);
  }

  _seedWind(a) {
    this._wind = [];
    for (let k = 0; k < 16; k++) {
      this._wind.push({
        x: a.x + Math.random() * a.w,
        y: a.y + Math.random() * a.h,
        len: 20 + Math.random() * 46,
        spd: 0.5 + Math.random() * 0.9,
      });
    }
    this._windArea = { x: a.x, y: a.y, w: a.w, h: a.h };
  }

  _updateWind(dt) {
    const a = this.game.getSystem('board')?.area;
    if (!a) return;
    const wa = this._windArea;
    if (!wa || wa.w !== a.w || wa.x !== a.x || wa.y !== a.y) this._seedWind(a);
    const dir = DIRS[this._dir];
    const intensity = this._windIntensity();
    const base = (a.w + a.h) * 0.5;
    for (const p of this._wind) {
      const v = base * (0.12 + intensity * 0.9) * p.spd * dt;
      p.x += dir.dx * v;
      p.y += dir.dy * v;
      // Wrap within the board so the flow is continuous.
      if (p.x < a.x - 40) p.x = a.right + 40; else if (p.x > a.right + 40) p.x = a.x - 40;
      if (p.y < a.y - 40) p.y = a.bottom + 40; else if (p.y > a.bottom + 40) p.y = a.y - 40;
    }
  }

  _drawWind(r, a) {
    if (this._wind.length === 0) return;
    const dir = DIRS[this._dir];
    const intensity = this._windIntensity();
    if (intensity < 0.2) return;
    const ctx = r.ctx;
    ctx.save();
    ctx.strokeStyle = this._want || this._flash > 0.2 ? '#ffe0a0' : '#bfe4ff';
    ctx.lineCap = 'round';
    for (const p of this._wind) {
      const len = p.len * (0.6 + intensity);
      ctx.globalAlpha = Math.min(0.6, 0.14 + intensity * 0.34) * (0.6 + p.spd * 0.4);
      ctx.lineWidth = 1.6 + intensity * 1.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - dir.dx * len, p.y - dir.dy * len);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Telegraph -------------------------------------------------------------

  render(r) {
    if (!this._active || !this._allowed) return;
    const gp = this.game.getSystem('gameplay');
    if (gp && !gp.isPlaying) return;
    const board = this.game.getSystem('board');
    const a = board?.area;
    if (!a) return;

    this._drawWind(r, a);

    const dir = DIRS[this._dir];
    const imminent = this._left <= 1 || this._want;
    const pulse = 0.5 + 0.5 * Math.sin(this._t * (imminent ? 8 : 3));
    const glow = this._flash > 0 ? this._flash : 0;

    // Arrow sits just inside the edge the board will drift toward.
    const inset = 34;
    let cx = a.centerX, cy = a.centerY;
    if (dir.id === 'down') cy = a.bottom - inset;
    else if (dir.id === 'up') cy = a.top + inset;
    else if (dir.id === 'left') cx = a.x + inset;
    else cx = a.right - inset;

    const col = imminent ? '#ffd36a' : '#8fd6ff';
    r.setAlpha(0.35 + pulse * 0.4 + glow * 0.4);
    r.withGlow(col, 12 + pulse * 10, () => this._arrow(r, cx, cy, dir, 26 + pulse * 4, col));
    r.setAlpha(1);

    // Countdown chip behind the arrow (opposite the drift direction).
    const bx = cx - dir.dx * 52, by = cy - dir.dy * 52;
    const label = this._want ? 'DRIFT' : String(this._left);
    r.setAlpha(0.9);
    r.withGlow('rgba(0,0,0,0.25)', 4, () => r.fillCircle(bx, by, this._want ? 30 : 20, imminent ? '#ffcf5e' : '#2a4a86'));
    r.text(label, bx, by + 1, {
      font: `900 ${this._want ? 15 : 22}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle',
    });
    r.setAlpha(1);

    this._drawSteer(r, dir);
  }

  /** Fixed "STEER" control: rotate the incoming drift for Dragon Energy. */
  _drawSteer(r, dir) {
    const bt = this._steerBtn; if (!bt) return;
    const gp = this.game.getSystem('gameplay');
    const energy = gp?.energy ?? 0;
    const afford = energy >= this._steerCost;
    const ctx = r.ctx;
    const cx = bt.x + 46, cy = bt.centerY;
    const rad = 42;
    const deny = this._denyFlash, ok = this._steerFlash;

    // Body.
    r.setAlpha(afford ? 1 : 0.55);
    const col = deny > 0 ? '#ff5a6a' : (ok > 0 ? '#3fc86a' : (afford ? '#2a6fd6' : '#3a4a66'));
    r.withGlow(afford ? '#5fa8ff' : 'rgba(0,0,0,0.2)', afford ? 10 : 2, () => r.fillCircle(cx, cy, rad, col));
    r.strokeRoundRect(cx - rad, cy - rad, rad * 2, rad * 2, rad, 'rgba(255,255,255,0.7)', 2);

    // Rotate glyph (arc + arrowhead) around the next-direction arrow.
    ctx.save();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, rad * 0.62, Math.PI * 0.15, Math.PI * 1.5); ctx.stroke();
    const ax = cx + Math.cos(Math.PI * 1.5) * rad * 0.62, ay = cy + Math.sin(Math.PI * 1.5) * rad * 0.62;
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(ax - 8, ay - 4); ctx.lineTo(ax - 2, ay + 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    // The direction the next drift will pull, in the middle.
    this._arrow(r, cx, cy, dir, 13, '#fff');
    r.setAlpha(1);

    // Just the energy cost beneath the glyph — no wordy label.
    r.text(`⚡${this._steerCost}`, cx, cy + rad + 13, {
      font: '800 15px system-ui, sans-serif', color: afford ? '#ffd36a' : '#9fb0c8',
      align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.5)', outlineWidth: 3,
    });
  }

  /** A chunky chevron/arrow pointing along `dir`. */
  _arrow(r, cx, cy, dir, s, col) {
    const ctx = r.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(dir.dy, dir.dx) + Math.PI / 2); // 0 = pointing up
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, s * 0.4);
    ctx.lineTo(s * 0.28, s * 0.4);
    ctx.lineTo(s * 0.28, s);
    ctx.lineTo(-s * 0.28, s);
    ctx.lineTo(-s * 0.28, s * 0.4);
    ctx.lineTo(-s * 0.8, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
