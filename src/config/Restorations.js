/**
 * Restorations.js
 * -----------------------------------------------------------------------------
 * The restoration tasks that rebuild the floating world. Every 5 levels unlocks
 * the next task in this list. Each task has multiple visual stages (broken →
 * half → restored) and a per-stage resource cost. Everything is data, so the
 * list can grow to hundreds of landmarks without touching logic.
 *
 * Fields:
 *   id       unique key
 *   name     player-facing landmark name
 *   biome    which biome it belongs to (see Biomes.js)
 *   art      which staged drawing routine to use (see LandmarkArt.js)
 *   stages   ordered stage labels; stages.length is the number of steps
 *   cost     base resource cost to advance ONE stage (scaled up per stage)
 * -----------------------------------------------------------------------------
 */
export const Restorations = Object.freeze([
  { id: 'bridge', name: 'Ancient Bridge', biome: 'forest', art: 'bridge',
    stages: ['Broken ruins', 'Half repaired', 'Fully restored'], cost: { materials: 6, essence: 3, gold: 8 } },
  { id: 'worldtree', name: 'World Tree', biome: 'forest', art: 'tree',
    stages: ['Withered stump', 'Sprouting', 'In full bloom'], cost: { materials: 8, essence: 5, gold: 10 } },
  { id: 'crystaltower', name: 'Crystal Tower', biome: 'crystal', art: 'tower',
    stages: ['Shattered base', 'Rising spire', 'Radiant tower'], cost: { materials: 10, essence: 6, gold: 14 } },
  { id: 'dragonnest', name: 'Dragon Nest', biome: 'crystal', art: 'nest',
    stages: ['Cold embers', 'Warming nest', 'Guarded roost'], cost: { materials: 12, essence: 8, gold: 16 } },
  { id: 'hiddencave', name: 'Hidden Cave', biome: 'frozen', art: 'cave',
    stages: ['Sealed rock', 'Cracked open', 'Glittering grotto'], cost: { materials: 14, essence: 9, gold: 18 } },
  { id: 'waterfall', name: 'Waterfall', biome: 'frozen', art: 'waterfall',
    stages: ['Dry cliff', 'Trickling', 'Cascading falls'], cost: { materials: 16, essence: 10, gold: 20 } },
  { id: 'library', name: 'Magic Library', biome: 'volcano', art: 'library',
    stages: ['Burnt ruins', 'Rebuilt walls', 'Living archive'], cost: { materials: 18, essence: 12, gold: 24 } },
  { id: 'skyharbor', name: 'Sky Harbor', biome: 'sky', art: 'harbor',
    stages: ['Drifting wreck', 'Moored docks', 'Bustling harbor'], cost: { materials: 22, essence: 14, gold: 28 } },
  { id: 'portalgate', name: 'Portal Gate', biome: 'ruins', art: 'portal',
    stages: ['Dead arch', 'Flickering rift', 'Open gateway'], cost: { materials: 26, essence: 18, gold: 34 } },
]);

export const RestorationById = Object.freeze(
  Object.fromEntries(Restorations.map((r) => [r.id, r])),
);

/** How many restoration tasks are unlocked at the given (highest) level. */
export function unlockedCountForLevel(level) {
  return Math.min(Restorations.length, Math.floor(level / 5));
}
