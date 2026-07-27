/**
 * WorldMapModel.js
 * -----------------------------------------------------------------------------
 * Builds the whole map geometry ONCE from the Worlds config: a vertical stack of
 * themed floating islands, each carrying a small winding cluster of level nodes,
 * with path segments inside islands and themed bridge segments spanning the gaps
 * between them. Also places reward objects per island. Pure data — no drawing,
 * no per-frame work — so the renderers just read it and cull to the viewport.
 * -----------------------------------------------------------------------------
 */
import { MAP, islandTheme } from '../../config/Worlds.js';

export class WorldMapModel {
  constructor(w) {
    this.w = w;
    this.cx = w / 2;
    this.islands = [];
    this.nodes = [];
    this.segments = [];
    this.rewards = [];
    this._build();
  }

  _rand(i, s = 0) { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  _kind(n, jInIsland, levelsInIsland) {
    if (jInIsland === levelsInIsland - 1) return 'boss';
    if (n % 13 === 0) return 'daily';
    if (n % MAP.specialEvery === 0) return 'special';
    if (n % MAP.treasureEvery === 0) return 'treasure';
    return 'normal';
  }

  _build() {
    const swing = Math.min(this.w * 0.16, 180);
    const amp = Math.min(this.w * 0.24, 260);
    let cursorY = MAP.topPad;
    let level = 1;
    let islandIdx = 0;

    while (level <= MAP.totalLevels) {
      const remaining = MAP.totalLevels - level + 1;
      const count = Math.min(MAP.levelsPerIsland, remaining);
      const span = (count - 1) * MAP.nodeStep;
      const theme = islandTheme(islandIdx);
      const icx = this.cx + Math.sin(islandIdx * 0.8) * swing;
      const icy = cursorY + span / 2;
      const rx = this.w * 0.40;
      const ry = span / 2 + MAP.nodeStep * 0.55;

      const island = { index: islandIdx, theme, cx: icx, cy: icy, rx, ry, top: cursorY, nodes: [] };
      // Unique irregular silhouette + floating satellite stones per island.
      island.shape = this._silhouette(islandIdx);
      island.stones = this._stones(island);
      this.islands.push(island);

      for (let j = 0; j < count; j++) {
        const y = cursorY + j * MAP.nodeStep;
        const x = icx + Math.sin((level + j) * 0.9) * amp * 0.55;
        const kind = this._kind(level, j, count);
        const stars = 1 + Math.floor(this._rand(level, 9) * 3);
        const node = { n: level, x, y, island: islandIdx, kind, stars };
        this.nodes.push(node);
        island.nodes.push(node);
        level++;
        if (level > MAP.totalLevels) break;
      }
      // Decor is scattered AFTER nodes exist so it can dodge the path.
      island.decor = this._decor(island);

      // Reward object beside this island (if configured).
      if (MAP.rewards[islandIdx]) {
        const side = islandIdx % 2 ? -1 : 1;
        this.rewards.push({
          id: `${MAP.rewards[islandIdx]}_${islandIdx}`,
          kind: MAP.rewards[islandIdx],
          x: icx + side * rx * 0.72,
          y: icy - ry * 0.2,
          island: islandIdx,
        });
      }

      cursorY += span + MAP.islandGap;
      islandIdx++;
    }

    // Segments between consecutive nodes: intra-island path or inter-island bridge.
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i], b = this.nodes[i + 1];
      const crossing = a.island !== b.island;
      this.segments.push({
        a, b,
        type: crossing ? 'bridge' : 'path',
        bridge: crossing ? islandTheme(b.island).bridge : null,
        fromN: a.n, toN: b.n,
      });
    }

    this.contentH = cursorY - MAP.islandGap + MAP.bottomPad;
  }

  /** Per-island irregular outline: radius multipliers around the ellipse. */
  _silhouette(i) {
    const n = 24, out = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2;
      out.push(1 + 0.14 * Math.sin(a * 3 + i * 1.7) + 0.08 * Math.sin(a * 5 + i * 2.9) + 0.05 * Math.sin(a * 2 + i));
    }
    return out;
  }

  /** Small floating rocks orbiting just off the island rim. */
  _stones(island) {
    const out = [];
    const n = 3 + Math.floor(this._rand(island.index, 5) * 3);
    for (let k = 0; k < n; k++) {
      const seed = island.index * 71 + k * 17;
      const a = this._rand(seed, 1) * Math.PI * 2;
      out.push({
        x: island.cx + Math.cos(a) * island.rx * (1.02 + this._rand(seed, 2) * 0.18),
        y: island.cy + Math.sin(a) * island.ry * (0.6 + this._rand(seed, 3) * 0.5),
        sc: 0.5 + this._rand(seed, 4) * 0.7,
        ph: this._rand(seed, 5) * 6.28,
      });
    }
    return out;
  }

  /**
   * Densely fill the island surface, dodging the node path so the world reads
   * as handcrafted (no empty green centres). Theme decor is mixed with common
   * ground fillers (grass, flowers, mushrooms, sparkles).
   */
  _decor(island) {
    const out = [];
    const pool = [...island.theme.decor, 'grasspatch', 'grasspatch', 'flower', 'flower', 'mushroom', 'sparkle', 'glowplant', 'pond', 'fence'];
    const want = 20, tries = 70;
    for (let k = 0; k < tries && out.length < want; k++) {
      const seed = island.index * 131 + k * 7;
      const a = this._rand(seed, 1) * Math.PI * 2;
      const rr = Math.sqrt(this._rand(seed, 2)) * 0.9;   // ~uniform across the disc
      const x = island.cx + Math.cos(a) * island.rx * rr;
      const y = island.cy + Math.sin(a) * island.ry * rr;
      let ok = true;
      for (const nd of island.nodes) { if ((x - nd.x) ** 2 + (y - nd.y) ** 2 < 76 * 76) { ok = false; break; } }
      if (!ok) continue;
      const kind = pool[Math.floor(this._rand(seed, 3) * pool.length)];
      // Bigger props (trees/pillars/ruins) prefer the rim; keep centres airy-ish.
      out.push({ kind, x, y, sc: 0.7 + this._rand(seed, 4) * 0.6, seed, depth: y });
    }
    // Painter's order: back (higher on screen) first.
    out.sort((p, q) => p.depth - q.depth);
    return out;
  }

  /** Node whose level equals the player's current level. */
  currentNode(level) { return this.nodes[Math.max(0, Math.min(this.nodes.length - 1, level - 1))]; }
}
