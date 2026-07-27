/**
 * Worlds.js
 * -----------------------------------------------------------------------------
 * Data-only configuration for the World Map: the ordered island themes and the
 * map tuning knobs. Nothing about the map is hard-coded in the renderers — they
 * read everything from here, so worlds, pacing, bridge styles and atmosphere are
 * all tweakable in one place and new islands are just more entries.
 * -----------------------------------------------------------------------------
 */

/** Bridge styles connecting one island to the next. */
export const BRIDGE = Object.freeze({ WOOD: 'wood', STONE: 'stone', CLOUD: 'cloud', CRYSTAL: 'crystal', LIGHT: 'light' });

/**
 * Island themes, in play order. `decor` is the weighted scenery palette; the
 * model scatters these across the island. Themes cycle if there are more
 * islands than entries, so the world can grow indefinitely.
 */
export const ISLANDS = Object.freeze([
  { key: 'tutorial', name: 'Tutorial Meadow', sky: ['#7ec8ff', '#bfe6ff', '#eaf7ff'], grass: ['#8fe06a', '#4faa46'], ground: ['#8a6a44', '#5a4026'], accent: '#7ed957', bridge: BRIDGE.WOOD, decor: ['tree', 'flower', 'rock', 'tree'] },
  { key: 'forest', name: 'Forest Island', sky: ['#79c2ff', '#b6e0ff', '#e8f6ff'], grass: ['#7fd86a', '#3f9a46'], ground: ['#7a5a34', '#4a3420'], accent: '#4cb857', bridge: BRIDGE.WOOD, decor: ['tree', 'tree', 'bush', 'flower', 'campfire'] },
  { key: 'crystal', name: 'Crystal Island', sky: ['#8fb6ff', '#c7dbff', '#eef4ff'], grass: ['#9adfd0', '#4fb59e'], ground: ['#6a6a8a', '#43436a'], accent: '#57e0ff', bridge: BRIDGE.CRYSTAL, decor: ['crystal', 'crystal', 'rock', 'fountain'] },
  { key: 'cloud', name: 'Cloud Island', sky: ['#a8d0ff', '#d4e8ff', '#f6fbff'], grass: ['#dfeeff', '#a9c8ee'], ground: ['#b8c8e0', '#8fa4c8'], accent: '#bfe0ff', bridge: BRIDGE.CLOUD, decor: ['cloudpuff', 'crystal', 'flower', 'windmill'] },
  { key: 'temple', name: 'Sky Temple', sky: ['#9fb0e0', '#c7d4f5', '#eef1ff'], grass: ['#c7d0e6', '#8f9ac0'], ground: ['#a99b7e', '#6a5f48'], accent: '#ffe27a', bridge: BRIDGE.LIGHT, decor: ['pillar', 'pillar', 'crystal', 'fountain'] },
  { key: 'frozen', name: 'Frozen Island', sky: ['#a8d0ff', '#d4e8ff', '#f4faff'], grass: ['#dff4ff', '#9fcfe6'], ground: ['#8fa6b4', '#5a6b78'], accent: '#bfeaff', bridge: BRIDGE.CRYSTAL, decor: ['pine', 'pine', 'snowrock', 'campfire'] },
  { key: 'volcano', name: 'Volcano Isle', sky: ['#ffb98f', '#ffd0a8', '#ffe8d4'], grass: ['#c98a6a', '#7a3b2a'], ground: ['#5a2a1a', '#3a1a10'], accent: '#ff6a3d', bridge: BRIDGE.STONE, decor: ['rock', 'rock', 'campfire', 'crystal'] },
  { key: 'dragon', name: 'Dragon Sanctuary', sky: ['#b7a0ff', '#d4c6ff', '#efeaff'], grass: ['#c9b4ff', '#8a6cc0'], ground: ['#6a4aa0', '#43306a'], accent: '#b79cff', bridge: BRIDGE.LIGHT, decor: ['pillar', 'crystal', 'sleepingdragon', 'fountain'] },
  { key: 'sunken', name: 'Sunken Ruins', sky: ['#7fd0d0', '#b6e6e6', '#e8fbfb'], grass: ['#7fd0b0', '#3f9a80'], ground: ['#5a6a5a', '#33403a'], accent: '#5fe0c0', bridge: BRIDGE.STONE, decor: ['pillar', 'rock', 'fountain', 'bush'] },
  { key: 'storm', name: 'Storm Peaks', sky: ['#8f9ad0', '#b6c0e6', '#e8ecfb'], grass: ['#9fb0c0', '#5f7080'], ground: ['#4a5a6a', '#2a3540'], accent: '#a8d0ff', bridge: BRIDGE.CLOUD, decor: ['snowrock', 'crystal', 'windmill', 'pine'] },
]);

/** Map layout + pacing (all logical px unless noted). */
export const MAP = Object.freeze({
  totalLevels: 100,
  levelsPerIsland: 4,
  islandGap: 560,        // clear sky between one island's base and the next
  nodeStep: 210,         // spacing between nodes inside an island
  nodeRadius: 42,
  currentRadius: 56,
  topPad: 300,
  bottomPad: 380,
  // Which node kinds appear (besides normal/boss). Boss = last level of island.
  treasureEvery: 4,      // every Nth non-boss level is a treasure
  specialEvery: 7,       // every Nth is a special event
  // Rewards that appear on islands (by island index → reward kind).
  rewards: { 0: 'dailychest', 2: 'coinchest', 4: 'gemchest', 6: 'dragonegg', 8: 'luckywheel' },
});

/** Get the theme for an island index (cycles past the defined set). */
export function islandTheme(i) { return ISLANDS[i % ISLANDS.length]; }
