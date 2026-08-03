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
// Costs are tuned against the per-level reward faucet (see Config.progression
// .rewards): Building Materials are the primary, meaningful gate (~1.3x the
// materials a player earns by the time a task unlocks), Magic Essence a
// secondary cost, and Gold the most abundant (it is also the Shop currency).
// Daily/weekly rewards and dragon perks sit on top as a comfort buffer, so the
// world-rebuild loop has real weight without ever soft-locking progress.
export const Restorations = Object.freeze([
  { id: 'bridge', name: 'Ancient Bridge', biome: 'forest', art: 'bridge',
    stages: ['Broken ruins', 'Half repaired', 'Fully restored'], cost: { materials: 8, essence: 9, gold: 20 } },
  { id: 'worldtree', name: 'World Tree', biome: 'forest', art: 'tree',
    stages: ['Withered stump', 'Sprouting', 'In full bloom'], cost: { materials: 11, essence: 15, gold: 24 } },
  { id: 'crystaltower', name: 'Crystal Tower', biome: 'crystal', art: 'tower',
    stages: ['Shattered base', 'Rising spire', 'Radiant tower'], cost: { materials: 14, essence: 18, gold: 34 } },
  { id: 'dragonnest', name: 'Dragon Nest', biome: 'crystal', art: 'nest',
    stages: ['Cold embers', 'Warming nest', 'Guarded roost'], cost: { materials: 17, essence: 24, gold: 38 } },
  { id: 'hiddencave', name: 'Hidden Cave', biome: 'frozen', art: 'cave',
    stages: ['Sealed rock', 'Cracked open', 'Glittering grotto'], cost: { materials: 20, essence: 27, gold: 44 } },
  { id: 'waterfall', name: 'Waterfall', biome: 'frozen', art: 'waterfall',
    stages: ['Dry cliff', 'Trickling', 'Cascading falls'], cost: { materials: 22, essence: 30, gold: 48 } },
  { id: 'library', name: 'Magic Library', biome: 'volcano', art: 'library',
    stages: ['Burnt ruins', 'Rebuilt walls', 'Living archive'], cost: { materials: 25, essence: 36, gold: 58 } },
  { id: 'skyharbor', name: 'Sky Harbor', biome: 'sky', art: 'harbor',
    stages: ['Drifting wreck', 'Moored docks', 'Bustling harbor'], cost: { materials: 31, essence: 42, gold: 68 } },
  { id: 'portalgate', name: 'Portal Gate', biome: 'ruins', art: 'portal',
    stages: ['Dead arch', 'Flickering rift', 'Open gateway'], cost: { materials: 36, essence: 54, gold: 82 } },
]);

export const RestorationById = Object.freeze(
  Object.fromEntries(Restorations.map((r) => [r.id, r])),
);

/** How many restoration tasks are unlocked at the given (highest) level. */
export function unlockedCountForLevel(level) {
  return Math.min(Restorations.length, Math.floor(level / 5));
}
