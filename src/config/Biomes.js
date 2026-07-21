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
export const Biomes = Object.freeze([
  {
    id: 'forest', name: 'Whispering Forest', unlockLevel: 1,
    background: ['#04120a', '#0a2416', '#03100a'], star: '#bfe8c8',
    accent: '#3fae5a', accentAlt: '#8be0a0', dragon: 'Leafwyrm',
    music: 'biome_forest', drift: 6,
  },
  {
    id: 'crystal', name: 'Crystal Valley', unlockLevel: 16,
    background: ['#0a0620', '#160a3a', '#080418'], star: '#c9b8ff',
    accent: '#7c5cff', accentAlt: '#28e0d0', dragon: 'Prismscale',
    music: 'biome_crystal', drift: 7,
  },
  {
    id: 'frozen', name: 'Frozen Peaks', unlockLevel: 31,
    background: ['#04101a', '#0a2038', '#04121f'], star: '#dbeeff',
    accent: '#8fc4ff', accentAlt: '#cdebff', dragon: 'Frostfang',
    music: 'biome_frozen', drift: 4,
  },
  {
    id: 'volcano', name: 'Volcano Lands', unlockLevel: 46,
    background: ['#1a0604', '#2e0a06', '#160402'], star: '#ffd0a0',
    accent: '#ff6a3d', accentAlt: '#ffb020', dragon: 'Emberdrake',
    music: 'biome_volcano', drift: 9,
  },
  {
    id: 'sky', name: 'Sky Islands', unlockLevel: 61,
    background: ['#08122a', '#123056', '#0a1e3a'], star: '#d6ecff',
    accent: '#28e0d0', accentAlt: '#aecbff', dragon: 'Cloudserpent',
    music: 'biome_sky', drift: 8,
  },
  {
    id: 'ruins', name: 'Ancient Ruins', unlockLevel: 76,
    background: ['#120a04', '#241608', '#0c0804'], star: '#e8d8b0',
    accent: '#ffb020', accentAlt: '#b76dff', dragon: 'Runewyrm',
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
