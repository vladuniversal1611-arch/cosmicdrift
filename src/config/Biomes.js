/**
 * Biomes.js
 * -----------------------------------------------------------------------------
 * The world's biomes, unlocked progressively as the player climbs levels. Each
 * biome is pure data: a board/background theme, a music id (sound hook), a
 * signature dragon species, and the level at which it opens. Adding a biome is
 * a single entry — the WorldProgressionSystem, WorldSystem and AudioSystem all
 * read from here, so nothing else needs to change.
 *
 * Ordered by unlockLevel ascending. `biomeForLevel()` resolves the active one.
 * -----------------------------------------------------------------------------
 */
// Every biome is a BRIGHT, sunlit sky — a warm colour wash the WorldSystem lays
// over its living floating-island backdrop. `star` is the colour of the soft
// drifting light motes. No biome is ever dark.
export const Biomes = Object.freeze([
  {
    id: 'forest', name: 'Whispering Forest', unlockLevel: 1,
    background: ['#6fc2ff', '#bfe9c8', '#eafff0'], star: '#ffffff',
    accent: '#3fc86a', accentAlt: '#8be0a0', dragon: 'Leafwyrm',
    music: 'biome_forest', drift: 6,
  },
  {
    id: 'crystal', name: 'Crystal Valley', unlockLevel: 16,
    background: ['#7ec8ff', '#bfe0ff', '#eef6ff'], star: '#ffffff',
    accent: '#3aa8ff', accentAlt: '#18d0c0', dragon: 'Prismscale',
    music: 'biome_crystal', drift: 7,
  },
  {
    id: 'frozen', name: 'Frozen Peaks', unlockLevel: 31,
    background: ['#a2dbff', '#d6efff', '#f5fbff'], star: '#ffffff',
    accent: '#8fc4ff', accentAlt: '#cdebff', dragon: 'Frostfang',
    music: 'biome_frozen', drift: 4,
  },
  {
    id: 'volcano', name: 'Volcano Lands', unlockLevel: 46,
    background: ['#ffd39a', '#ffe6c0', '#fff6e8'], star: '#fff0d6',
    accent: '#ff7a4d', accentAlt: '#ffb020', dragon: 'Emberdrake',
    music: 'biome_volcano', drift: 9,
  },
  {
    id: 'sky', name: 'Sky Islands', unlockLevel: 61,
    background: ['#8fd3ff', '#bfe9ff', '#eaf7ff'], star: '#ffffff',
    accent: '#18d0c0', accentAlt: '#aecbff', dragon: 'Cloudserpent',
    music: 'biome_sky', drift: 8,
  },
  {
    id: 'ruins', name: 'Ancient Ruins', unlockLevel: 76,
    background: ['#ffe6b0', '#fff0d0', '#fffaf0'], star: '#fff3d6',
    accent: '#ffb020', accentAlt: '#3aa8ff', dragon: 'Runewyrm',
    music: 'biome_ruins', drift: 5,
  },
]);

export const BiomeById = Object.freeze(
  Object.fromEntries(Biomes.map((b) => [b.id, b])),
);

/** The active biome for a given level (highest unlockLevel <= level). */
export function biomeForLevel(level) {
  let biome = Biomes[0];
  for (const b of Biomes) if (level >= b.unlockLevel) biome = b;
  return biome;
}
