/**
 * WorldMapScreen.js
 * -----------------------------------------------------------------------------
 * The level-select World Map — a winding journey across 100 procedurally laid
 * out levels on floating green islands. Everything here is drawn with the
 * Canvas 2D primitives in Renderer (circles, rounded rects, gradients, paths);
 * there are NO image assets, so the map works the moment it opens and can later
 * be reskinned by dropping in sprites without touching this layout logic.
 *
 * Level state is read live from the LevelSystem (current + highest reached):
 *   • completed  — a level below the player's current one (green + checkmark)
 *   • current    — the level the player is on (glowing, pulsing, "you are here")
 *   • unlocked   — reachable but not current (blue, playable)
 *   • locked     — beyond the frontier (dimmed, padlock)
 *
 * The camera auto-scrolls to the current level on open and can be dragged with
 * a finger. Decorations (islands, trees, rocks, crystals, milestone flags,
 * bridges, drifting clouds) are all procedural placeholders.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Palette } from '../../config/Palette.js';
import { Rect } from '../../utils/Rect.js';
import { clamp } from '../../utils/MathUtils.js';
import { UI, UITheme } from '../theme/UITheme.js';

const LEVEL_COUNT = 100;
const NODE_STEP = 240;   // vertical gap between levels (world px)
const TOP_PAD = 240;     // room for the header before level 1
const BOTTOM_PAD = 200;  // breathing room after the last level
const NODE_R = 46;       // level-button radius

export class WorldMapScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'worldmap';
    this._time = 0;
    this._scroll = 0;
    this._scrollTarget = 0;
    this._maxScroll = 0;
    this._dragging = false;
    this._dy = null;
    this._ds = 0;
    this._nodes = [];
    this._clouds = [];
    this._msg = null;        // { text, t }
    this._subs = [];
    this._backRect = new Rect(28, 56, 150, 64);

    this._buildNodes();
    this._buildClouds();
  }

  get _levels() { return this.game.getSystem('level'); }
  get _current() { return this._levels?.level ?? 1; }
  get _highest() { return this._levels?.highest ?? 1; }

  // --- Procedural map generation --------------------------------------------

  /** Cheap deterministic 0..1 hash so decorations are stable across frames. */
  _rand(i, salt = 0) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  _buildNodes() {
    const cx = this.bounds.centerX;
    const amp = Math.min(this.bounds.w * 0.28, 300);
    this._nodes = [];
    for (let i = 0; i < LEVEL_COUNT; i++) {
      // Serpentine path: a gentle sine sweep left↔right as we climb the levels.
      const x = cx + Math.sin(i * 0.62) * amp + Math.sin(i * 0.23) * amp * 0.25;
      const y = TOP_PAD + i * NODE_STEP;
      this._nodes.push({ n: i + 1, x, y });
    }
    const contentH = TOP_PAD + (LEVEL_COUNT - 1) * NODE_STEP + BOTTOM_PAD;
    this._maxScroll = Math.max(0, contentH - this.bounds.h);
  }

  _buildClouds() {
    this._clouds = [];
    for (let i = 0; i < 7; i++) {
      this._clouds.push({
        x: this._rand(i, 3) * this.bounds.w,
        y: 140 + this._rand(i, 7) * (this.bounds.h - 260),
        s: 0.6 + this._rand(i, 11) * 0.9,       // scale
        v: 8 + this._rand(i, 13) * 16,          // px/sec drift
      });
    }
  }

  // --- Lifecycle -------------------------------------------------------------
  onEnter() {
    this.events.emit('ui:modalOpen');
    // Snap the camera so the current level sits comfortably in view.
    this._focusCurrent(true);

    this._subs.push(this.events.on('input:down', ({ y }) => {
      this._dragging = true; this._dy = y; this._ds = this._scroll;
    }));
    this._subs.push(this.events.on('input:move', ({ y }) => {
      if (this._dy == null) return;
      this._scroll = clamp(this._ds - (y - this._dy), 0, this._maxScroll);
      this._scrollTarget = this._scroll;      // finger overrides auto-scroll
    }));
    this._subs.push(this.events.on('input:up', () => { this._dragging = false; this._dy = null; }));
  }

  onExit() {
    this.events.emit('ui:modalClose');
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  _focusCurrent(snap = false) {
    const node = this._nodes[clamp(this._current - 1, 0, LEVEL_COUNT - 1)];
    if (!node) return;
    const target = clamp(node.y - this.bounds.h * 0.58, 0, this._maxScroll);
    this._scrollTarget = target;
    if (snap) this._scroll = target;
  }

  // --- Update ----------------------------------------------------------------
  update(dt) {
    this._time += dt;
    if (this._msg && (this._msg.t -= dt) <= 0) this._msg = null;

    // Ease toward the auto-scroll target unless the player is dragging.
    if (!this._dragging) {
      this._scroll += (this._scrollTarget - this._scroll) * Math.min(1, dt * 6);
      if (Math.abs(this._scrollTarget - this._scroll) < 0.4) this._scroll = this._scrollTarget;
    }

    // Drift the clouds and wrap them around the screen.
    for (const c of this._clouds) {
      c.x += c.v * dt;
      if (c.x - 120 > this.bounds.w) c.x = -120;
    }
  }

  // --- Level state -----------------------------------------------------------
  _state(n) {
    const cur = this._current;
    const hi = this._highest;
    if (n < cur) return 'completed';
    if (n === cur) return 'current';
    if (n <= hi) return 'unlocked';
    return 'locked';
  }

  _flash(text) { this._msg = { text, t: 1.6 }; this.game.getSystem('audio')?.play('invalid'); }

  // --- Render ----------------------------------------------------------------
  render(renderer) {
    const b = this.bounds;

    // Opaque bright sky so the gameplay screen is fully hidden behind the map.
    renderer.fillBackgroundGradient(['#63c0ff', '#a6e0ff', '#e8f7ff']);
    // Soft sun glow top-centre.
    const sun = renderer.radialGradient(b.centerX, 120, 420, [
      [0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)'],
    ]);
    renderer.fillRect(0, 0, b.w, b.h, sun);

    // Far, faint clouds (parallax, drawn behind the path).
    this._drawClouds(renderer, 0.5);

    // Scrolled world: path + decorations + level nodes.
    this._drawPath(renderer);
    this._drawNodes(renderer);

    // Near clouds float over the world for depth.
    this._drawClouds(renderer, 1);

    // Fixed foreground UI.
    this._drawHeader(renderer);
    this._drawBack(renderer);
    if (this._msg) this._drawMsg(renderer);
  }

  // --- Winding path ----------------------------------------------------------
  _drawPath(renderer) {
    const ctx = renderer.ctx;
    const s = this._scroll;
    const pts = this._nodes.map((nd) => ({ x: nd.x, y: nd.y - s }));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // A smooth curve through the node centres (quadratic via midpoints).
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    };

    // Outer soft casing.
    trace();
    ctx.strokeStyle = 'rgba(60,110,60,0.30)';
    ctx.lineWidth = 34;
    ctx.stroke();
    // Sandy road body.
    trace();
    ctx.strokeStyle = '#f4e4b8';
    ctx.lineWidth = 24;
    ctx.stroke();
    // Bright top edge.
    trace();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 10;
    ctx.stroke();
    // Dashed centre line marking progress toward the next level.
    trace();
    ctx.setLineDash([10, 18]);
    ctx.strokeStyle = 'rgba(120,90,40,0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // --- Nodes + decorations ---------------------------------------------------
  _drawNodes(renderer) {
    const b = this.bounds;
    const s = this._scroll;
    for (const nd of this._nodes) {
      const y = nd.y - s;
      if (y < -160 || y > b.h + 160) continue;   // cull off-screen

      // Floating island platform beneath the node.
      this._drawIsland(renderer, nd.x, y + NODE_R * 0.9, NODE_R * 3.1, nd.n);
      // Scenery scattered around the island (deterministic per level).
      this._drawScenery(renderer, nd.x, y, nd.n);
      // Milestone flag every 10 levels.
      if (nd.n % 10 === 0) this._drawFlag(renderer, nd.x + NODE_R * 1.2, y - NODE_R * 0.3, nd.n / 10);
      // The level button itself.
      this._drawNode(renderer, nd.x, y, nd.n);
    }
  }

  _ellipse(renderer, x, y, rx, ry, color) {
    const ctx = renderer.ctx;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  _drawIsland(renderer, x, y, w, n) {
    const ctx = renderer.ctx;
    // Soft drop shadow.
    renderer.setAlpha(0.14);
    this._ellipse(renderer, x, y + w * 0.16, w * 0.52, w * 0.16, '#0a2a1a');
    renderer.setAlpha(1);
    // Rocky underside (tapers down like a floating chunk of land).
    ctx.beginPath();
    ctx.moveTo(x - w * 0.48, y);
    ctx.quadraticCurveTo(x - w * 0.2, y + w * 0.5, x, y + w * 0.58);
    ctx.quadraticCurveTo(x + w * 0.2, y + w * 0.5, x + w * 0.48, y);
    ctx.closePath();
    ctx.fillStyle = renderer.linearGradient(x, y, x, y + w * 0.58, [
      [0, '#8a6a44'], [1, '#5e4326'],
    ]);
    ctx.fill();
    // Grass cap.
    this._ellipse(renderer, x, y, w * 0.5, w * 0.2,
      renderer.linearGradient(x, y - w * 0.2, x, y + w * 0.2, [[0, '#8fe06a'], [1, '#4faa46']]));
    // Bright grass highlight.
    renderer.setAlpha(0.5);
    this._ellipse(renderer, x, y - w * 0.04, w * 0.4, w * 0.1, '#c4f59a');
    renderer.setAlpha(1);
  }

  _drawScenery(renderer, x, y, n) {
    const base = y + NODE_R * 0.7;
    const spread = NODE_R * 2.2;
    // A couple of decorations chosen deterministically from the level number.
    const kinds = ['tree', 'rock', 'crystal', 'tree'];
    for (let k = 0; k < 2; k++) {
      const r0 = this._rand(n, k * 5 + 1);
      const side = this._rand(n, k * 5 + 2) < 0.5 ? -1 : 1;
      const dx = side * (spread * (0.7 + r0 * 0.5));
      const dy = (this._rand(n, k * 5 + 3) - 0.5) * NODE_R * 0.6;
      const kind = kinds[Math.floor(this._rand(n, k * 5 + 4) * kinds.length)];
      if (kind === 'tree') this._drawTree(renderer, x + dx, base + dy, 0.8 + r0 * 0.5);
      else if (kind === 'rock') this._drawRock(renderer, x + dx, base + dy, 0.8 + r0 * 0.5);
      else this._drawCrystal(renderer, x + dx, base + dy, 0.8 + r0 * 0.5);
    }
  }

  _drawTree(renderer, x, y, sc) {
    const trunkW = 8 * sc;
    const trunkH = 22 * sc;
    // Trunk.
    renderer.fillRoundRect(x - trunkW / 2, y - trunkH, trunkW, trunkH, 3 * sc, '#7a4a24');
    // Foliage (three overlapping circles).
    const r = 20 * sc;
    renderer.fillCircle(x, y - trunkH - r * 0.6, r, '#3fa14a');
    renderer.fillCircle(x - r * 0.6, y - trunkH - r * 0.1, r * 0.8, '#4cb857');
    renderer.fillCircle(x + r * 0.6, y - trunkH - r * 0.1, r * 0.8, '#4cb857');
    renderer.setAlpha(0.5);
    renderer.fillCircle(x - r * 0.3, y - trunkH - r * 0.9, r * 0.4, '#bff0a0');
    renderer.setAlpha(1);
  }

  _drawRock(renderer, x, y, sc) {
    const w = 26 * sc;
    const h = 16 * sc;
    const ctx = renderer.ctx;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x - w * 0.3, y - h, x, y - h);
    ctx.quadraticCurveTo(x + w * 0.35, y - h, x + w / 2, y);
    ctx.closePath();
    ctx.fillStyle = renderer.linearGradient(x, y - h, x, y, [[0, '#b9c2cc'], [1, '#7d8894']]);
    ctx.fill();
    renderer.setAlpha(0.5);
    this._ellipse(renderer, x - w * 0.12, y - h * 0.55, w * 0.16, h * 0.18, '#eef2f6');
    renderer.setAlpha(1);
  }

  _drawCrystal(renderer, x, y, sc) {
    const w = 14 * sc;
    const h = 30 * sc;
    const ctx = renderer.ctx;
    renderer.withGlow('#57e0ff', 10, () => {
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + w / 2, y - h * 0.45);
      ctx.lineTo(x + w * 0.3, y);
      ctx.lineTo(x - w * 0.3, y);
      ctx.lineTo(x - w / 2, y - h * 0.45);
      ctx.closePath();
      ctx.fillStyle = renderer.linearGradient(x, y - h, x, y, [[0, '#c9f6ff'], [1, '#39b9e6']]);
      ctx.fill();
    });
    renderer.setAlpha(0.7);
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w * 0.16, y - h * 0.5);
    ctx.lineTo(x - w * 0.02, y - h * 0.2);
    ctx.closePath();
    ctx.fillStyle = '#eafcff';
    ctx.fill();
    renderer.setAlpha(1);
  }

  _drawFlag(renderer, x, y, world) {
    const poleH = 62;
    renderer.fillRoundRect(x - 2.5, y - poleH, 5, poleH, 2.5, '#8a5a2c');
    const ctx = renderer.ctx;
    const wave = Math.sin(this._time * 3 + world) * 4;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - poleH);
    ctx.lineTo(x + 40, y - poleH + 10 + wave);
    ctx.lineTo(x + 2, y - poleH + 24);
    ctx.closePath();
    ctx.fillStyle = UI.gold.deep;
    ctx.fill();
    renderer.fillCircle(x, y - poleH, 4, UI.gold.mid);
    renderer.text(`W${world}`, x + 16, y - poleH + 12 + wave * 0.5, {
      font: '800 11px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
  }

  _drawNode(renderer, x, y, n) {
    const state = this._state(n);
    const ctx = renderer.ctx;

    let r = NODE_R;
    let ring, fill0, fill1;
    if (state === 'completed') { ring = UI.gold.mid; fill0 = '#8ff08a'; fill1 = '#39a544'; }
    else if (state === 'current') { ring = UI.gold.light; fill0 = '#ffe89a'; fill1 = '#ff9d2e'; }
    else if (state === 'unlocked') { ring = UI.gold.mid; fill0 = '#a9dcff'; fill1 = '#2f8fe0'; }
    else { ring = 'rgba(255,255,255,0.35)'; fill0 = '#b9c6d6'; fill1 = '#8496ab'; }

    // Current level: a pulsing halo + a gentle bob to draw the eye.
    let bob = 0;
    if (state === 'current') {
      const pulse = 0.5 + 0.5 * Math.sin(this._time * 3);
      bob = Math.sin(this._time * 2.2) * 4;
      renderer.setAlpha(0.25 + 0.2 * pulse);
      renderer.withGlow('#ffcf5e', 26, () => renderer.fillCircle(x, y + bob, r * (1.35 + 0.12 * pulse), '#ffd873'));
      renderer.setAlpha(1);
      r += 4;
    }
    const cy = y + bob;

    // Drop shadow.
    renderer.setAlpha(state === 'locked' ? 0.18 : 0.28);
    renderer.fillCircle(x, cy + 7, r, '#0a1230');
    renderer.setAlpha(1);

    // Body.
    const body = renderer.radialGradient(x, cy - r * 0.4, r * 1.3, [[0, fill0], [1, fill1]]);
    renderer.fillCircle(x, cy, r, body);
    // Glossy top highlight.
    renderer.setAlpha(state === 'locked' ? 0.25 : 0.5);
    this._ellipse(renderer, x, cy - r * 0.4, r * 0.62, r * 0.34, 'rgba(255,255,255,0.9)');
    renderer.setAlpha(1);
    // Rim.
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = ring;
    ctx.stroke();

    // Contents by state.
    if (state === 'completed') {
      this._drawCheck(renderer, x, cy, r * 0.5);
    } else if (state === 'locked') {
      this._drawLock(renderer, x, cy, r * 0.62);
    } else {
      renderer.text(String(n), x, cy + 1, {
        font: `900 ${Math.round(r * 0.78)}px system-ui, sans-serif`,
        color: '#ffffff', align: 'center', baseline: 'middle',
        outline: 'rgba(20,40,80,0.4)', outlineWidth: 4,
      });
    }

    // "You are here" pointer above the current node.
    if (state === 'current') {
      const py = cy - r - 18 - Math.abs(Math.sin(this._time * 3)) * 4;
      ctx.beginPath();
      ctx.moveTo(x, py + 12);
      ctx.lineTo(x - 10, py);
      ctx.lineTo(x + 10, py);
      ctx.closePath();
      ctx.fillStyle = UI.gold.deep;
      ctx.fill();
      renderer.text('PLAY', x, py - 10, {
        font: '900 13px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
        outline: 'rgba(180,110,10,0.9)', outlineWidth: 4,
      });
    }
  }

  _drawCheck(renderer, x, y, s) {
    const ctx = renderer.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, s * 0.34);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y + s * 0.05);
    ctx.lineTo(x - s * 0.12, y + s * 0.5);
    ctx.lineTo(x + s * 0.62, y - s * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawLock(renderer, x, y, s) {
    const bw = s * 1.1;
    const bh = s * 0.85;
    const bx = x - bw / 2;
    const by = y - bh * 0.2;
    // Shackle.
    const ctx = renderer.ctx;
    ctx.beginPath();
    ctx.lineWidth = Math.max(3, s * 0.22);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.arc(x, by, bw * 0.32, Math.PI, 0);
    ctx.stroke();
    // Body.
    renderer.fillRoundRect(bx, by, bw, bh, s * 0.18, 'rgba(255,255,255,0.9)');
    renderer.fillCircle(x, by + bh * 0.45, s * 0.12, '#8496ab');
  }

  // --- Clouds ----------------------------------------------------------------
  _drawClouds(renderer, layerAlpha) {
    for (const c of this._clouds) {
      // Far layer = the smaller/slower half; near layer = the rest.
      const isFar = c.s < 1.05;
      if (layerAlpha < 1 ? !isFar : isFar) continue;
      renderer.setAlpha(layerAlpha < 1 ? 0.45 : 0.85);
      const r = 26 * c.s;
      renderer.fillCircle(c.x, c.y, r, '#ffffff');
      renderer.fillCircle(c.x + r * 0.9, c.y + r * 0.15, r * 0.8, '#ffffff');
      renderer.fillCircle(c.x - r * 0.9, c.y + r * 0.2, r * 0.7, '#ffffff');
      renderer.fillCircle(c.x + r * 0.2, c.y - r * 0.4, r * 0.7, '#ffffff');
      renderer.setAlpha(1);
    }
  }

  // --- Foreground UI ---------------------------------------------------------
  _drawHeader(renderer) {
    const b = this.bounds;
    // Soft banner behind the title so it reads over any island below.
    renderer.setAlpha(0.9);
    UITheme.glassPanel(renderer, b.centerX - 200, 40, 400, 96, 26);
    renderer.setAlpha(1);
    UITheme.heading(renderer, 'WORLD MAP', b.centerX, 78, 30, UI.ink);
    renderer.text(`LEVEL ${this._current}  ·  ${this._highest - 1}/${LEVEL_COUNT} CLEARED`,
      b.centerX, 112, {
        font: '800 15px system-ui, sans-serif', color: UI.inkSoft, align: 'center', baseline: 'middle',
      });

    // A subtle "recenter" hint chip bottom-right when scrolled away.
    if (Math.abs(this._scroll - this._scrollTarget) > 4 || this._focusOffscreen()) {
      const r = new Rect(b.w - 76, b.h - 96, 56, 56);
      UITheme.button(renderer, r.x, r.y, r.w, r.h, 28, UI.btn.blue);
      renderer.text('◎', r.centerX, r.centerY, {
        font: '900 26px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
      });
      this._recenterRect = r;
    } else {
      this._recenterRect = null;
    }
  }

  _focusOffscreen() {
    const node = this._nodes[clamp(this._current - 1, 0, LEVEL_COUNT - 1)];
    if (!node) return false;
    const y = node.y - this._scroll;
    return y < TOP_PAD || y > this.bounds.h - 120;
  }

  _drawBack(renderer) {
    const r = this._backRect;
    UITheme.button(renderer, r.x, r.y, r.w, r.h, 20, UI.btn.teal);
    renderer.text('◀ BACK', r.centerX, r.centerY, {
      font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
      outline: 'rgba(20,90,80,0.6)', outlineWidth: 4,
    });
  }

  _drawMsg(renderer) {
    renderer.setAlpha(clamp(this._msg.t, 0, 1));
    UITheme.glassPanel(renderer, this.bounds.centerX - 150, this.bounds.h - 150, 300, 56, 26);
    renderer.text(this._msg.text, this.bounds.centerX, this.bounds.h - 122, {
      font: '800 18px system-ui, sans-serif', color: UI.ink, align: 'center', baseline: 'middle',
    });
    renderer.setAlpha(1);
  }

  // --- Input -----------------------------------------------------------------
  onTap(px, py) {
    if (this._backRect.contains(px, py)) { this.events.emit('ui:closeWorldMap'); return true; }
    if (this._recenterRect && this._recenterRect.contains(px, py)) { this._focusCurrent(); return true; }

    // Hit-test the visible level nodes.
    const s = this._scroll;
    for (const nd of this._nodes) {
      const y = nd.y - s;
      if (y < -120 || y > this.bounds.h + 120) continue;
      const dx = px - nd.x;
      const dy = py - y;
      if (dx * dx + dy * dy <= (NODE_R + 8) * (NODE_R + 8)) {
        this._onNodeTap(nd.n);
        return true;
      }
    }
    return true; // modal: always consume
  }

  _onNodeTap(n) {
    const state = this._state(n);
    if (state === 'locked') { this._flash(`Level ${n} locked`); return; }
    if (state === 'completed') { this._flash(`Level ${n} · cleared ✓`); return; }
    // current / unlocked → close the map and return to play.
    this.game.getSystem('audio')?.play('tap');
    this.events.emit('ui:closeWorldMap');
  }
}
