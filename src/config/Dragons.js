/**
 * Dragons.js
 * -----------------------------------------------------------------------------
 * The companion-dragon roster. Each dragon is tied to a biome (so it unlocks as
 * the player reaches that biome) and grants ONE passive board perk while it is
 * the active companion. Perks are intentionally deliverable through existing
 * events only — bonus Dragon Energy, a head-start on the meter, or bonus
 * resources per clear — so equipping a dragon never rewires the core rules and
 * ties the collection into a real strategic choice (and into the Island meta:
 * pick the resource you need to farm).
 *
 * perk.kind:
 *   energyPerLine    +value Dragon Energy per cleared line (ultimate charges faster)
 *   startEnergy      +value Dragon Energy at the start of every level
 *   goldPerLine      +value Gold per cleared line
 *   materialsPerLine +value Building Materials per cleared line
 *   essencePerLine   +value Magic Essence per cleared line
 * -----------------------------------------------------------------------------
 */
export const Dragons = Object.freeze([
  { id: 'leafwyrm', name: 'Leafwyrm', biome: 'forest', color: '#3fc86a', unlockLevel: 1,
    perk: { kind: 'energyPerLine', value: 3, desc: '+3 Dragon Energy per line cleared' } },
  { id: 'prismscale', name: 'Prismscale', biome: 'crystal', color: '#3aa8ff', unlockLevel: 16,
    perk: { kind: 'goldPerLine', value: 6, desc: '+6 Gold per line cleared' } },
  { id: 'frostfang', name: 'Frostfang', biome: 'frozen', color: '#8fc4ff', unlockLevel: 31,
    perk: { kind: 'energyPerLine', value: 5, desc: '+5 Dragon Energy per line cleared' } },
  { id: 'emberdrake', name: 'Emberdrake', biome: 'volcano', color: '#ff7a4d', unlockLevel: 46,
    perk: { kind: 'startEnergy', value: 30, desc: 'Start every level with +30 Dragon Energy' } },
  { id: 'cloudserpent', name: 'Cloudserpent', biome: 'sky', color: '#18d0c0', unlockLevel: 61,
    perk: { kind: 'goldPerLine', value: 12, desc: '+12 Gold per line cleared' } },
]);

export const DragonById = Object.freeze(Object.fromEntries(Dragons.map((d) => [d.id, d])));
