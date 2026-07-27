/**
 * WorldMapScreen.js
 * -----------------------------------------------------------------------------
 * A living fantasy World Map — not a plain level selector. A continuous grassy
 * realm scrolls vertically past the player: a winding cobbled stone path climbs
 * through meadows dotted with trees, bushes, flowers, rocks and ponds, with 100
 * level nodes strung along it. Everything is drawn with Canvas 2D primitives
 * (no image assets), so it works instantly and can be reskinned with sprites
 * later without changing this layout.
 *
 * Layout (portrait, 1080x2400 reference):
 *   • Header   — top 12%: avatar + level/XP ring · world name + completion ·
 *                animated coins/gems/energy counters.
 *   • World    — middle 76%: momentum-scrolled realm, auto-centred on the
 *                current level.
 *   • Nav      — bottom 12%: menu / shop / PLAY / events / settings.
 *
 * Level state is read live from the LevelSystem. Node visuals: 72px golden
 * circles with soft shadow + gloss; states are Locked (gray), Unlocked (blue),
 * Current (green, largest, glowing/pulsing/floating with sparkles), Completed
 * (gold, checkmark, collected stars); Boss (red) and Special (purple) recolour
 * their milestone nodes. Number, difficulty pips and stars sit on every node.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { Config } from '../../config/Config.js';
import { UI, UITheme, Rolling } from '../theme/UITheme.js';
import { Currencies } from '../../systems/economy/EconomySystem.js';

const LEVEL_COUNT = 100;
const NODE_STEP = 300;   // vertical gap between levels (world px)
const TOP_PAD = 300;     // clearance before level 1
const BOTTOM_PAD = 340;  // clearance after the last level
const NODE_R = 42;       // ~72–84px node diameter
const CURRENT_R = 56;    // the current level is the largest node
const PATH_W = 62;       // stone path width

/** Named regions give the world a sense of a journey. */
const REGIONS = [
  { from: 1, name: 'Dragon Valley', sky: ['#63c0ff', '#a6e0ff', '#e8f7ff'], grass: ['#8fd867', '#5cb04b'] },
  { from: 21, name: 'Crystal Highlands', sky: ['#7fb6ff', '#bcd8ff', '#eef4ff'], grass: ['#9adf8e', '#57b57e'] },
  { from: 41, name: 'Ancient Kingdom', sky: ['#8fa8e0', '#c7d4f5', '#eef1ff'], grass: ['#a7cf7a', '#6faa49'] },
  { from: 61, name: 'Frostpeak Reach', sky: ['#a8d0ff', '#d4e8ff', '#f4faff'], grass: ['#bfe6cf', '#6fbfa0'] },
  { from: 81, name: 'Celestial Summit', sky: ['#9a86ff', '#c6b8ff', '#efeaff'], grass: ['#b7d98f', '#79b06a'] },
];

export class WorldMapScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'worldmap';
    this._time = 0;

    // Camera.
    this._scroll = 0;
    this._scrollTarget = 0;
    this._maxScroll = 0;
    this._vel = 0;          // momentum (world px / frame)
    this._dragging = false;
    this._lastY = null;
    this._autoCenter = false;

    // World geometry (built once — deterministic).
    this._nodes = [];
    this._path = [];        // dense smooth polyline {x,y}
    this._props = [];       // scattered scenery {x,y,kind,sc,seed}
    this._edge = [];        // flowers / rocks hugging the path
    this._clouds = [];

    // Animated header counters.
    this._coins = new Rolling(0);
    this._gems = new Rolling(0);
    this._energy = new Rolling(0);

    this._msg = null;
    this._subs = [];
    this._nav = [];         // bottom navigation buttons

    this._build();
  }

  get _levels() { return this.game.getSystem('level'); }
  get _current() { return this._levels?.level ?? 1; }
  get _highest() { return this._levels?.highest ?? 1; }
  get _cleared() { return Math.max(0, this._highest - 1); }

  // --- Deterministic helpers -------------------------------------------------
  _rand(i, salt = 0) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  _region(n) {
    let r = REGIONS[0];
    for (const reg of REGIONS) if (n >= reg.from) r = reg;
    return r;
  }

  _meta(n) {
    const boss = n % 10 === 0;
    const special = !boss && n % 5 === 0;
    const difficulty = clamp(1 + Math.floor(this._rand(n, 2) * 3), 1, 3);
    const stars = 1 + Math.floor(this._rand(n, 9) * 3); // 1..3 collected when done
    return { boss, special, difficulty, stars };
  }

  // --- Build the world once --------------------------------------------------
  _build() {
    const cx = this.bounds.centerX;
    const amp = Math.min(this.bounds.w * 0.30, 330);

    // Level nodes along a serpentine curve.
    this._nodes = [];
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const x = cx + Math.sin(i * 0.55) * amp + Math.sin(i * 0.21 + 1.3) * amp * 0.32;
      const y = TOP_PAD + i * NODE_STEP;
      this._nodes.push({ n: i + 1, x, y, ...this._meta(i + 1) });
    }
    const contentH = TOP_PAD + (LEVEL_COUNT - 1) * NODE_STEP + BOTTOM_PAD;
    this._maxScroll = Math.max(0, contentH - this.bounds.h);

    // Smooth Catmull-Rom path through the node centres.
    const nc = this._nodes.map((nd) => ({ x: nd.x, y: nd.y }));
    const sub = 12;
    this._path = [];
    for (let i = 0; i < nc.length - 1; i++) {
      const p0 = nc[i - 1] || nc[i];
      const p1 = nc[i];
      const p2 = nc[i + 1];
      const p3 = nc[i + 2] || nc[i + 1];
      for (let s = 0; s < sub; s++) {
        this._path.push(this._catmull(p0, p1, p2, p3, s / sub));
      }
    }
    this._path.push(nc[nc.length - 1]);

    // Edge decorations (flowers + tiny rocks hugging the path).
    this._edge = [];
    for (let i = 6; i < this._path.length - 1; i += 5) {
      const a = this._path[i];
      const b = this._path[i + 1] || a;
      const nx = -(b.y - a.y);
      const ny = (b.x - a.x);
      const len = Math.hypot(nx, ny) || 1;
      const side = this._rand(i, 1) < 0.5 ? 1 : -1;
      const off = (PATH_W * 0.5 + 10 + this._rand(i, 2) * 26) * side;
      const x = a.x + (nx / len) * off;
      const y = a.y + (ny / len) * off;
      const kind = this._rand(i, 3) < 0.62 ? 'flower' : 'pebble';
      this._edge.push({ x, y, kind, sc: 0.7 + this._rand(i, 4) * 0.7, seed: i });
    }

    // Scattered scenery filling the whole meadow (kept clear of the path).
    this._props = [];
    const kinds = ['tree', 'tree', 'bush', 'flowerpatch', 'rock', 'pond'];
    for (let y = TOP_PAD - 120; y < contentH - 80; y += 150) {
      const count = 2 + Math.floor(this._rand(y, 5) * 2);
      for (let k = 0; k < count; k++) {
        const seed = y + k * 131;
        let x = 60 + this._rand(seed, 6) * (this.bounds.w - 120);
        const py = y + (this._rand(seed, 7) - 0.5) * 120;
        const pathX = this._pathXAt(py);
        // Push props out of the path corridor so nothing sits on the road.
        if (Math.abs(x - pathX) < 150) x = pathX + (x < pathX ? -1 : 1) * (150 + this._rand(seed, 8) * 120);
        x = clamp(x, 40, this.bounds.w - 40);
        const kind = kinds[Math.floor(this._rand(seed, 9) * kinds.length)];
        this._props.push({ x, y: py, kind, sc: 0.75 + this._rand(seed, 10) * 0.7, seed });
      }
    }

    // Clouds (screen-space parallax).
    this._clouds = [];
    for (let i = 0; i < 7; i++) {
      this._clouds.push({
        x: this._rand(i, 21) * this.bounds.w,
        y: this.bounds.h * 0.16 + this._rand(i, 22) * this.bounds.h * 0.66,
        s: 0.7 + this._rand(i, 23) * 1.0,
        v: 8 + this._rand(i, 24) * 16,
      });
    }
  }

  _catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  }

  /** Path X at a world Y (path is monotonic in Y). */
  _pathXAt(y) {
    const p = this._path;
    if (!p.length) return this.bounds.centerX;
    if (y <= p[0].y) return p[0].x;
    if (y >= p[p.length - 1].y) return p[p.length - 1].x;
    // Binary search.
    let lo = 0, hi = p.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (p[mid].y < y) lo = mid; else hi = mid;
    }
    const a = p[lo], b = p[hi];
    const t = (y - a.y) / ((b.y - a.y) || 1);
    return a.x + (b.x - a.x) * t;
  }

  // --- Lifecycle -------------------------------------------------------------
  onEnter() {
    this.events.emit('ui:modalOpen');
    this._syncCounters(true);
    this._focusCurrent(true);

    this._subs.push(this.events.on('input:down', ({ y }) => {
      this._dragging = true; this._lastY = y; this._vel = 0; this._autoCenter = false;
    }));
    this._subs.push(this.events.on('input:move', ({ y }) => {
      if (this._lastY == null) return;
      const d = this._lastY - y;                       // finger up → world up
      this._scroll = clamp(this._scroll + d, 0, this._maxScroll);
      this._vel = d;                                   // remember for momentum
      this._lastY = y;
    }));
    this._subs.push(this.events.on('input:up', () => { this._dragging = false; this._lastY = null; }));
  }

  onExit() {
    this.events.emit('ui:modalClose');
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  _syncCounters(snap) {
    const eco = this.game.getSystem('economy');
    const gp = this.game.getSystem('gameplay');
    this._coins.set(eco?.balance('gold') ?? 0);
    this._gems.set(eco?.balance('crystal') ?? 0);
    this._energy.set(Math.round(gp?.energy ?? 0));
    if (snap) { this._coins.display = this._coins.value; this._gems.display = this._gems.value; this._energy.display = this._energy.value; }
  }

  _focusCurrent(snap = false) {
    const node = this._nodes[clamp(this._current - 1, 0, LEVEL_COUNT - 1)];
    if (!node) return;
    this._scrollTarget = clamp(node.y - this.bounds.h * 0.56, 0, this._maxScroll);
    this._autoCenter = true;
    if (snap) { this._scroll = this._scrollTarget; this._autoCenter = false; }
  }

  // --- Update (momentum + easing) -------------------------------------------
  update(dt) {
    this._time += dt;
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;
    this._coins.update(dt); this._gems.update(dt); this._energy.update(dt);

    const k = Math.min(1, dt * 60);
    if (!this._dragging) {
      if (this._autoCenter) {
        this._scroll += (this._scrollTarget - this._scroll) * Math.min(1, dt * 6);
        if (Math.abs(this._scrollTarget - this._scroll) < 0.5) { this._scroll = this._scrollTarget; this._autoCenter = false; }
      } else if (Math.abs(this._vel) > 0.4) {
        this._scroll = clamp(this._scroll + this._vel * k, 0, this._maxScroll);
        this._vel *= Math.pow(0.93, dt * 60);           // friction
        if (this._scroll <= 0 || this._scroll >= this._maxScroll) this._vel = 0;
      }
    }

    for (const c of this._clouds) {
      c.x += c.v * dt;
      if (c.x - 160 > this.bounds.w) c.x = -160;
    }
  }

  _state(n) {
    const cur = this._current, hi = this._highest;
    if (n < cur) return 'completed';
    if (n === cur) return 'current';
    if (n <= hi) return 'unlocked';
    return 'locked';
  }

  _flash(text) { this._msg = { text, t: 1.6 }; this.game.getSystem('audio')?.play('invalid'); }

  // --- Render ----------------------------------------------------------------
  render(renderer) {
    const b = this.bounds;
    const region = this._region(this._current);

    // Sky.
    renderer.fillBackgroundGradient(region.sky);
    const sun = renderer.radialGradient(b.centerX, 160, 520, [[0, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
    renderer.fillRect(0, 0, b.w, b.h, sun);

    // Scrolled world.
    this._drawGround(renderer);
    this._drawProps(renderer, 'back');   // trees/ponds behind the path
    this._drawPath(renderer);
    this._drawEdge(renderer);
    this._drawProps(renderer, 'front');  // flowers/bushes in front of the path
    this._drawNodes(renderer);

    // Clouds float over the realm.
    this._drawClouds(renderer);

    // Fixed foreground.
    this._drawHeader(renderer);
    this._drawNav(renderer);
    if (this._msg) this._drawMsg(renderer);
  }

  // --- Ground ----------------------------------------------------------------
  _drawGround(renderer) {
    const b = this.bounds;
    const region = this._region(this._current);
    const topY = TOP_PAD - this._scroll;
    const g = renderer.linearGradient(0, Math.max(0, topY), 0, b.h, [[0, region.grass[0]], [1, region.grass[1]]]);
    // The meadow starts a little above the first node and fills to the bottom.
    renderer.fillRect(0, Math.max(0, topY - 200), b.w, b.h, g);
    // Soft lighter horizon band where grass meets sky.
    renderer.setAlpha(0.5);
    renderer.fillRect(0, Math.max(0, topY - 200), b.w, 120, 'rgba(255,255,255,0.35)');
    renderer.setAlpha(1);
    // Subtle rolling shade patches for texture.
    renderer.setAlpha(0.06);
    for (let i = 0; i < 14; i++) {
      const y = ((i * 260 - this._scroll * 0.6) % (b.h + 400)) - 200;
      this._ellipse(renderer, (i * 173) % b.w, y, 260, 90, '#0a3a1a');
    }
    renderer.setAlpha(1);
  }

  _ellipse(renderer, x, y, rx, ry, color) {
    const ctx = renderer.ctx;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // --- Winding stone path ----------------------------------------------------
  _drawPath(renderer) {
    const ctx = renderer.ctx;
    const s = this._scroll;
    const b = this.bounds;
    // Visible slice of the path.
    const pts = [];
    for (const p of this._path) {
      const y = p.y - s;
      if (y > -80 && y < b.h + 80) pts.push({ x: p.x, y });
    }
    if (pts.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    };
    // Grass shoulder (soft green casing).
    trace(); ctx.strokeStyle = 'rgba(40,110,50,0.35)'; ctx.lineWidth = PATH_W + 30; ctx.stroke();
    trace(); ctx.strokeStyle = '#79c65a'; ctx.lineWidth = PATH_W + 18; ctx.stroke();
    // Stone base.
    trace(); ctx.strokeStyle = '#b7ad98'; ctx.lineWidth = PATH_W; ctx.stroke();
    trace(); ctx.strokeStyle = '#cabfa8'; ctx.lineWidth = PATH_W - 10; ctx.stroke();
    ctx.restore();

    // Cobblestones give texture + a naturally varying width.
    this._drawCobbles(renderer, s, b);
  }

  _drawCobbles(renderer, s, b) {
    const ctx = renderer.ctx;
    for (let i = 0; i < this._path.length - 1; i += 2) {
      const a = this._path[i];
      const y = a.y - s;
      if (y < -40 || y > b.h + 40) continue;
      const nb = this._path[i + 1];
      const ang = Math.atan2(nb.y - a.y, nb.x - a.x);
      const nx = Math.cos(ang + Math.PI / 2);
      const ny = Math.sin(ang + Math.PI / 2);
      // Two/three cobbles across the path width.
      const across = this._rand(i, 30) < 0.5 ? 2 : 3;
      for (let c = 0; c < across; c++) {
        const t = across === 2 ? (c === 0 ? -0.24 : 0.24) : (c - 1) * 0.3;
        const off = t * (PATH_W - 16);
        const cx = a.x + nx * off;
        const cy = y + ny * off;
        const r = (PATH_W * 0.16) * (0.85 + this._rand(i + c, 31) * 0.4);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.25, r, 0, 0, Math.PI * 2);
        ctx.fillStyle = c % 2 ? '#e7ddc6' : '#d8ccb0';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _drawEdge(renderer) {
    const s = this._scroll, b = this.bounds;
    for (const e of this._edge) {
      const y = e.y - s;
      if (y < -30 || y > b.h + 30) continue;
      if (e.kind === 'flower') this._drawFlower(renderer, e.x, y, e.sc, e.seed);
      else this._drawPebble(renderer, e.x, y, e.sc);
    }
  }

  // --- Scenery props ---------------------------------------------------------
  _drawProps(renderer, layer) {
    const s = this._scroll, b = this.bounds;
    for (const p of this._props) {
      const y = p.y - s;
      if (y < -140 || y > b.h + 60) continue;
      const back = p.kind === 'tree' || p.kind === 'pond';
      if (layer === 'back' ? !back : back) continue;
      switch (p.kind) {
        case 'tree': this._drawTree(renderer, p.x, y, p.sc); break;
        case 'bush': this._drawBush(renderer, p.x, y, p.sc); break;
        case 'flowerpatch': this._drawFlowerPatch(renderer, p.x, y, p.sc, p.seed); break;
        case 'rock': this._drawRock(renderer, p.x, y, p.sc); break;
        case 'pond': this._drawPond(renderer, p.x, y, p.sc); break;
      }
    }
  }

  _drawTree(renderer, x, y, sc) {
    const trunkW = 12 * sc, trunkH = 34 * sc;
    // shadow
    renderer.setAlpha(0.12); this._ellipse(renderer, x, y + 4, 34 * sc, 12 * sc, '#0a3a1a'); renderer.setAlpha(1);
    renderer.fillRoundRect(x - trunkW / 2, y - trunkH, trunkW, trunkH, 4 * sc, '#7a4a24');
    const r = 30 * sc;
    renderer.fillCircle(x, y - trunkH - r * 0.5, r, '#3aa04a');
    renderer.fillCircle(x - r * 0.7, y - trunkH, r * 0.82, '#48b657');
    renderer.fillCircle(x + r * 0.7, y - trunkH, r * 0.82, '#48b657');
    renderer.fillCircle(x, y - trunkH - r * 1.1, r * 0.7, '#54c063');
    renderer.setAlpha(0.5); renderer.fillCircle(x - r * 0.35, y - trunkH - r * 1.0, r * 0.4, '#c8f2a4'); renderer.setAlpha(1);
  }

  _drawBush(renderer, x, y, sc) {
    const r = 18 * sc;
    renderer.setAlpha(0.12); this._ellipse(renderer, x, y + 3, r * 1.6, r * 0.5, '#0a3a1a'); renderer.setAlpha(1);
    renderer.fillCircle(x - r * 0.8, y, r, '#3fa94f');
    renderer.fillCircle(x + r * 0.8, y, r, '#3fa94f');
    renderer.fillCircle(x, y - r * 0.4, r * 1.15, '#4cba5b');
    renderer.setAlpha(0.4); renderer.fillCircle(x - r * 0.2, y - r * 0.7, r * 0.4, '#c8f2a4'); renderer.setAlpha(1);
  }

  _drawFlowerPatch(renderer, x, y, sc, seed) {
    for (let i = 0; i < 4; i++) {
      const dx = (this._rand(seed, i * 3 + 40) - 0.5) * 60 * sc;
      const dy = (this._rand(seed, i * 3 + 41) - 0.5) * 24 * sc;
      this._drawFlower(renderer, x + dx, y + dy, sc * (0.6 + this._rand(seed, i * 3 + 42) * 0.5), seed + i);
    }
  }

  _drawFlower(renderer, x, y, sc, seed) {
    const petals = ['#ff8fb0', '#ffd34e', '#a48bff', '#ff9d5c', '#ffffff'];
    const col = petals[Math.floor(this._rand(seed, 50) * petals.length)];
    const r = 6 * sc;
    // stem
    renderer.ctx.strokeStyle = '#3f9a4a'; renderer.ctx.lineWidth = 2 * sc;
    renderer.ctx.beginPath(); renderer.ctx.moveTo(x, y); renderer.ctx.lineTo(x, y - 12 * sc); renderer.ctx.stroke();
    const cy = y - 12 * sc;
    for (let p = 0; p < 5; p++) {
      const a = (Math.PI * 2 / 5) * p;
      renderer.fillCircle(x + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.7, col);
    }
    renderer.fillCircle(x, cy, r * 0.6, '#ffe27a');
  }

  _drawPebble(renderer, x, y, sc) {
    const w = 14 * sc;
    this._ellipse(renderer, x, y, w, w * 0.62, '#9aa6b2');
    renderer.setAlpha(0.5); this._ellipse(renderer, x - w * 0.2, y - w * 0.2, w * 0.35, w * 0.2, '#e6ecf2'); renderer.setAlpha(1);
  }

  _drawRock(renderer, x, y, sc) {
    const w = 30 * sc, h = 20 * sc, ctx = renderer.ctx;
    renderer.setAlpha(0.12); this._ellipse(renderer, x, y + 3, w * 0.6, h * 0.35, '#0a3a1a'); renderer.setAlpha(1);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x - w * 0.3, y - h, x, y - h);
    ctx.quadraticCurveTo(x + w * 0.4, y - h, x + w / 2, y);
    ctx.closePath();
    ctx.fillStyle = renderer.linearGradient(x, y - h, x, y, [[0, '#c3ccd6'], [1, '#828e9b']]);
    ctx.fill();
    renderer.setAlpha(0.5); this._ellipse(renderer, x - w * 0.12, y - h * 0.55, w * 0.18, h * 0.18, '#eef2f6'); renderer.setAlpha(1);
  }

  _drawPond(renderer, x, y, sc) {
    const w = 70 * sc, h = 34 * sc;
    this._ellipse(renderer, x, y, w * 0.55, h * 0.55, '#3aa06a');       // muddy rim
    this._ellipse(renderer, x, y, w * 0.48, h * 0.46,
      renderer.linearGradient(x, y - h * 0.4, x, y + h * 0.4, [[0, '#8fe0ff'], [1, '#3f9fd6']]));
    renderer.setAlpha(0.6); this._ellipse(renderer, x - w * 0.1, y - h * 0.12, w * 0.18, h * 0.1, '#eafcff'); renderer.setAlpha(1);
  }

  // --- Level nodes -----------------------------------------------------------
  _drawNodes(renderer) {
    const b = this.bounds, s = this._scroll;
    for (const nd of this._nodes) {
      const y = nd.y - s;
      if (y < -160 || y > b.h + 160) continue;
      if (nd.n % 10 === 0) this._drawSignpost(renderer, nd, y);
      this._drawNode(renderer, nd, y);
    }
  }

  _drawSignpost(renderer, nd, y) {
    // A banner naming the region you're heading into — sits above boss nodes,
    // lifted clear of the "PLAY" pointer when this boss is the current level.
    const name = this._region(nd.n + 1).name.toUpperCase();
    const wpx = Math.max(150, name.length * 11 + 30);
    const isCur = this._state(nd.n) === 'current';
    const by = y - (isCur ? CURRENT_R + 118 : NODE_R + 80);
    const bx = nd.x - wpx / 2;
    renderer.setAlpha(0.96);
    UITheme.button(renderer, bx, by, wpx, 40, 14, UI.btn.orange, { shadow: true });
    renderer.setAlpha(1);
    renderer.text(name, nd.x, by + 20, {
      font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
      outline: 'rgba(150,80,10,0.7)', outlineWidth: 3,
    });
  }

  _nodeColors(state, nd) {
    if (state === 'locked') return { a: '#c2ccd6', b: '#8b98a6', ring: 'rgba(255,255,255,0.4)' };
    if (nd.boss) return { a: '#ff9a8a', b: '#e0433f', ring: UI.gold.mid };
    if (nd.special) return { a: '#d9b4ff', b: '#8a4fe0', ring: UI.gold.mid };
    if (state === 'completed') return { a: '#ffe89a', b: '#f0a92e', ring: UI.gold.light };
    if (state === 'current') return { a: '#a8f09a', b: '#37a83f', ring: UI.gold.light };
    return { a: '#a9dcff', b: '#2f8fe0', ring: UI.gold.mid }; // unlocked
  }

  _drawNode(renderer, nd, y) {
    const state = this._state(nd.n);
    const ctx = renderer.ctx;
    const col = this._nodeColors(state, nd);
    let r = state === 'current' ? CURRENT_R : NODE_R;
    let cy = y;

    // Current level: floating bob + pulsing halo + sparkles.
    if (state === 'current') {
      const pulse = 0.5 + 0.5 * Math.sin(this._time * 3);
      cy = y + Math.sin(this._time * 2.2) * 5;
      renderer.setAlpha(0.22 + 0.2 * pulse);
      renderer.withGlow(col.b, 30, () => renderer.fillCircle(nd.x, cy, r * (1.4 + 0.12 * pulse), col.a));
      renderer.setAlpha(1);
      // Orbiting sparkles.
      for (let i = 0; i < 4; i++) {
        const a = this._time * 1.6 + (Math.PI / 2) * i;
        const rr = r * 1.5;
        const sx = nd.x + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr * 0.7;
        renderer.setAlpha(0.5 + 0.5 * Math.sin(this._time * 4 + i));
        renderer.sparkle(sx, sy, 6, '#fff7cf');
        renderer.setAlpha(1);
      }
    }

    // Soft shadow.
    renderer.setAlpha(state === 'locked' ? 0.16 : 0.3);
    renderer.fillCircle(nd.x, cy + 8, r, '#0a1230');
    renderer.setAlpha(1);

    // Body + gloss.
    const body = renderer.radialGradient(nd.x, cy - r * 0.4, r * 1.3, [[0, col.a], [1, col.b]]);
    renderer.fillCircle(nd.x, cy, r, body);
    renderer.setAlpha(state === 'locked' ? 0.28 : 0.55);
    this._ellipse(renderer, nd.x, cy - r * 0.42, r * 0.6, r * 0.32, 'rgba(255,255,255,0.95)');
    renderer.setAlpha(1);

    // Golden frame (double-bevel).
    ctx.beginPath(); ctx.arc(nd.x, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 6; ctx.strokeStyle = col.ring; ctx.stroke();
    ctx.beginPath(); ctx.arc(nd.x, cy, r - 3, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();

    // Contents.
    if (state === 'locked') {
      this._drawLock(renderer, nd.x, cy, r * 0.6);
    } else {
      // Difficulty pips on the upper arc (skip on boss/special which have icons).
      if (!nd.boss && !nd.special) this._drawDifficulty(renderer, nd.x, cy - r * 0.62, nd.difficulty);
      if (nd.boss) this._drawSkull(renderer, nd.x, cy - r * 0.62, r * 0.24);
      if (nd.special) renderer.sparkle(nd.x, cy - r * 0.62, r * 0.26, '#ffe27a');

      if (state === 'completed') {
        this._drawCheck(renderer, nd.x, cy, r * 0.44);
      } else {
        renderer.text(String(nd.n), nd.x, cy + 2, {
          font: `900 ${Math.round(r * 0.72)}px system-ui, sans-serif`, color: '#fff',
          align: 'center', baseline: 'middle', outline: 'rgba(20,40,80,0.45)', outlineWidth: 4,
        });
      }
      // Stars beneath every reachable node.
      this._drawStars(renderer, nd.x, cy + r + 14, state === 'completed' ? nd.stars : 0);
    }

    // "PLAY" pointer over the current node.
    if (state === 'current') {
      const py = cy - r - 20 - Math.abs(Math.sin(this._time * 3)) * 4;
      ctx.beginPath(); ctx.moveTo(nd.x, py + 12); ctx.lineTo(nd.x - 11, py); ctx.lineTo(nd.x + 11, py); ctx.closePath();
      ctx.fillStyle = UI.gold.deep; ctx.fill();
      renderer.text('PLAY', nd.x, py - 11, {
        font: '900 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
        outline: 'rgba(180,110,10,0.9)', outlineWidth: 4,
      });
    }
  }

  _drawDifficulty(renderer, x, y, d) {
    for (let i = 0; i < d; i++) {
      const dx = (i - (d - 1) / 2) * 12;
      renderer.fillCircle(x + dx, y, 3.4, '#ffe89a');
    }
  }

  _drawSkull(renderer, x, y, s) {
    renderer.fillCircle(x, y, s, '#fff');
    renderer.fillCircle(x - s * 0.4, y - s * 0.1, s * 0.22, '#e0433f');
    renderer.fillCircle(x + s * 0.4, y - s * 0.1, s * 0.22, '#e0433f');
    renderer.fillRoundRect(x - s * 0.35, y + s * 0.4, s * 0.7, s * 0.4, 2, '#fff');
  }

  _drawCheck(renderer, x, y, s) {
    const ctx = renderer.ctx;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, s * 0.36); ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y + s * 0.05);
    ctx.lineTo(x - s * 0.12, y + s * 0.5);
    ctx.lineTo(x + s * 0.62, y - s * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawLock(renderer, x, y, s) {
    const bw = s * 1.1, bh = s * 0.82, bx = x - bw / 2, by = y - bh * 0.15, ctx = renderer.ctx;
    ctx.beginPath(); ctx.lineWidth = Math.max(3, s * 0.24); ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.arc(x, by, bw * 0.32, Math.PI, 0); ctx.stroke();
    renderer.fillRoundRect(bx, by, bw, bh, s * 0.18, 'rgba(255,255,255,0.9)');
    renderer.fillCircle(x, by + bh * 0.45, s * 0.12, '#8496ab');
  }

  _star(renderer, x, y, r, fill) {
    const ctx = renderer.ctx;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (Math.PI / 5) * i;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }

  _drawStars(renderer, x, y, collected) {
    for (let i = 0; i < 3; i++) {
      const sx = x + (i - 1) * 22;
      const on = i < collected;
      const sy = on ? y - 3 : y;
      this._star(renderer, sx, sy, on ? 10 : 8, on ? UI.gold.mid : 'rgba(255,255,255,0.28)');
      if (on) { renderer.ctx.lineWidth = 1.5; renderer.ctx.strokeStyle = UI.gold.line; renderer.ctx.stroke(); }
    }
  }

  // --- Clouds ----------------------------------------------------------------
  _drawClouds(renderer) {
    for (const c of this._clouds) {
      renderer.setAlpha(c.s < 1.1 ? 0.5 : 0.85);
      const r = 30 * c.s;
      renderer.fillCircle(c.x, c.y, r, '#fff');
      renderer.fillCircle(c.x + r * 0.95, c.y + r * 0.15, r * 0.82, '#fff');
      renderer.fillCircle(c.x - r * 0.95, c.y + r * 0.2, r * 0.72, '#fff');
      renderer.fillCircle(c.x + r * 0.2, c.y - r * 0.42, r * 0.72, '#fff');
      renderer.setAlpha(1);
    }
  }

  // --- Header (top 12%) ------------------------------------------------------
  _drawHeader(renderer) {
    const b = this.bounds;
    const H = b.h * 0.12;
    // Translucent header shelf so counters read over the world.
    renderer.setAlpha(0.92);
    const shelf = renderer.linearGradient(0, 0, 0, H, [[0, 'rgba(255,255,255,0.0)'], [0.2, 'rgba(35,58,114,0.35)'], [1, 'rgba(35,58,114,0.0)']]);
    renderer.fillRect(0, 0, b.w, H + 30, shelf);
    renderer.setAlpha(1);

    this._drawAvatar(renderer, 78, 96);
    this._drawTitle(renderer, b.centerX, 70);
    this._drawCounters(renderer, b.w - 30, 56);
  }

  _drawAvatar(renderer, x, y) {
    const R = 46;
    const cleared = this._cleared;
    const xp = clamp(cleared / LEVEL_COUNT, 0, 1);
    const plvl = 1 + Math.floor(cleared / 4);
    // Ring track + XP arc.
    const ctx = renderer.ctx;
    UITheme.shadow(renderer, x - R, y - R, R * 2, R * 2, R, 6, 0.35);
    renderer.fillCircle(x, y, R, '#2f4f86');
    // Face (simple friendly avatar).
    renderer.fillCircle(x, y, R - 8, renderer.radialGradient(x, y - 10, R, [[0, '#ffe0b8'], [1, '#f4b483']]));
    renderer.fillCircle(x - 11, y - 4, 5, '#3a2a20');
    renderer.fillCircle(x + 11, y - 4, 5, '#3a2a20');
    ctx.beginPath(); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#8a5a3a';
    ctx.arc(x, y + 4, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // XP ring.
    ctx.beginPath(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.arc(x, y, R + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = UI.gold.mid;
    ctx.arc(x, y, R + 2, -Math.PI / 2, -Math.PI / 2 + xp * Math.PI * 2); ctx.stroke();
    // Level badge.
    renderer.fillCircle(x + R * 0.7, y + R * 0.7, 16, UI.gold.deep);
    renderer.strokeRoundRect(x + R * 0.7 - 16, y + R * 0.7 - 16, 32, 32, 16, UI.gold.light, 2);
    renderer.text(String(plvl), x + R * 0.7, y + R * 0.7 + 1, {
      font: '900 16px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
  }

  _drawTitle(renderer, cx, y) {
    const region = this._region(this._current);
    const pct = Math.round(this._cleared / LEVEL_COUNT * 100);
    UITheme.heading(renderer, region.name, cx, y, 40, UI.white);
    // Completion bar.
    const bw = 300, bx = cx - bw / 2, by = y + 34;
    renderer.fillRoundRect(bx, by, bw, 16, 8, 'rgba(20,40,80,0.35)');
    renderer.fillRoundRect(bx, by, bw * (pct / 100), 16, 8,
      renderer.linearGradient(bx, by, bx + bw, by, [[0, '#ffe27a'], [1, UI.gold.deep]]));
    renderer.strokeRoundRect(bx, by, bw, 16, 8, 'rgba(255,255,255,0.7)', 1.5);
    renderer.text(`${pct}% COMPLETE`, cx, by + 8, {
      font: '800 11px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
  }

  _drawCounters(renderer, rightX, y) {
    const items = [
      { icon: Currencies.gold.icon, roll: this._coins, cap: '#ffd24a' },
      { icon: Currencies.crystal.icon, roll: this._gems, cap: '#5fd0ff' },
      { icon: '⚡', roll: this._energy, cap: '#ff9d2e' },
    ];
    const cw = 150, ch = 44, gap = 10;
    items.forEach((it, i) => {
      const x = rightX - cw;
      const cy = y + i * (ch + gap);
      UITheme.chip(renderer, x, cy, cw, ch, it.cap);
      renderer.text(it.icon, x + ch / 2, cy + ch / 2 + 1, {
        font: '800 18px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
      });
      renderer.text(it.roll.text, x + ch + 6, cy + ch / 2 + 1, {
        font: '900 20px system-ui, sans-serif', color: '#fff', align: 'left', baseline: 'middle',
      });
    });
  }

  // --- Bottom navigation (bottom 12%) ---------------------------------------
  _drawNav(renderer) {
    const b = this.bounds;
    const H = b.h * 0.12;
    const y0 = b.h - H;
    // Nav shelf.
    UITheme.glassPanel(renderer, -20, y0 + 6, b.w + 40, H + 40, 34);

    this._nav = [];
    const defs = [
      { id: 'menu', label: '🏠', text: 'HOME', event: 'ui:mainMenu', color: UI.btn.blue },
      { id: 'shop', label: '🛍', text: 'SHOP', event: 'ui:openShop', color: UI.btn.purple },
      { id: 'play', label: '▶', text: 'PLAY', event: 'ui:closeWorldMap', color: UI.btn.play, big: true },
      { id: 'events', label: '★', text: 'EVENTS', event: 'ui:openEvents', color: UI.btn.orange },
      { id: 'settings', label: '⚙', text: 'SETTINGS', event: 'ui:openSettings', color: UI.btn.teal },
    ];
    const n = defs.length;
    const slot = b.w / n;
    defs.forEach((d, i) => {
      const cx = slot * i + slot / 2;
      const size = d.big ? 96 : 68;
      const cy = y0 + H * 0.5 + (d.big ? -8 : 4);
      const r = new Rect(cx - size / 2, cy - size / 2, size, size);
      UITheme.button(renderer, r.x, r.y, r.w, r.h, size / 2, d.color);
      renderer.text(d.label, cx, cy - (d.big ? 4 : 2), {
        font: `800 ${d.big ? 34 : 26}px system-ui, sans-serif`, color: '#fff', align: 'center', baseline: 'middle',
      });
      if (!d.big) {
        renderer.text(d.text, cx, r.bottom + 12, {
          font: '800 11px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
        });
      } else {
        renderer.text(d.text, cx, cy + 22, {
          font: '900 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
          outline: 'rgba(30,110,40,0.7)', outlineWidth: 3,
        });
      }
      this._nav.push({ rect: r, event: d.event, id: d.id });
    });
  }

  _drawMsg(renderer) {
    renderer.setAlpha(clamp(this._msg.t, 0, 1));
    const w = 320, x = this.bounds.centerX - w / 2, y = this.bounds.h * 0.7;
    UITheme.glassPanel(renderer, x, y, w, 56, 26);
    renderer.text(this._msg.text, this.bounds.centerX, y + 28, {
      font: '800 18px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
    });
    renderer.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    // Navigation first.
    for (const nb of this._nav) {
      if (nb.rect.contains(px, py)) {
        this.game.getSystem('audio')?.play('tap');
        this.events.emit(nb.event);
        return true;
      }
    }
    // Then level nodes.
    const s = this._scroll;
    for (const nd of this._nodes) {
      const y = nd.y - s;
      if (y < -120 || y > this.bounds.h + 120) continue;
      const r = (this._state(nd.n) === 'current' ? CURRENT_R : NODE_R) + 10;
      const dx = px - nd.x, dy = py - y;
      if (dx * dx + dy * dy <= r * r) { this._onNodeTap(nd); return true; }
    }
    return true; // modal: always consume
  }

  _onNodeTap(nd) {
    const state = this._state(nd.n);
    if (state === 'locked') { this._flash(`Level ${nd.n} — locked`); return; }
    if (state === 'completed') { this._flash(`Level ${nd.n} · ${nd.stars}★ collected`); return; }
    this.game.getSystem('audio')?.play('tap');
    this.events.emit('ui:closeWorldMap');
  }
}
