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
      // Scatter decor deterministically on the platform.
      island.decor = this._decor(island);
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

  _decor(island) {
    const out = [];
    const set = island.theme.decor;
    const count = 7;
    for (let k = 0; k < count; k++) {
      const seed = island.index * 97 + k * 13;
      const kind = set[Math.floor(this._rand(seed, 1) * set.length)];
      // Spread around the platform, biased to the rim so nodes stay clear.
      const ang = this._rand(seed, 2) * Math.PI * 2;
      const rr = 0.55 + this._rand(seed, 3) * 0.4;
      out.push({
        kind,
        x: island.cx + Math.cos(ang) * island.rx * rr,
        y: island.cy + Math.sin(ang) * island.ry * rr,
        sc: 0.8 + this._rand(seed, 4) * 0.6,
        seed,
      });
    }
    return out;
  }

  /** Node whose level equals the player's current level. */
  currentNode(level) { return this.nodes[Math.max(0, Math.min(this.nodes.length - 1, level - 1))]; }
}
