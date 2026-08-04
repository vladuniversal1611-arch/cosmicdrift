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
  }

  onInit() {
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
    if (!this._active || !this._want || !this._free) return;

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

  // --- Telegraph -------------------------------------------------------------

  render(r) {
    if (!this._active) return;
    const gp = this.game.getSystem('gameplay');
    if (gp && !gp.isPlaying) return;
    const board = this.game.getSystem('board');
    const a = board?.area;
    if (!a) return;

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
