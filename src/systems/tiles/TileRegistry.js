/**
 * TileRegistry.js
 * -----------------------------------------------------------------------------
 * The single catalogue of Living Board tile types: a factory keyed by type id
 * plus display metadata used for the "new mechanic" discovery callouts. Adding
 * a new tile is a one-line registration here — nothing else needs to know the
 * full roster.
 * -----------------------------------------------------------------------------
 */
import { StoneTile } from './types/StoneTile.js';
import { MossTile } from './types/MossTile.js';
import { CrystalTile } from './types/CrystalTile.js';
import { FrozenTile } from './types/FrozenTile.js';
import { CorruptedTile } from './types/CorruptedTile.js';
import { PortalTile } from './types/PortalTile.js';
import { DragonRuneTile } from './types/DragonRuneTile.js';
import { TreasureTile } from './types/TreasureTile.js';
import { AncientTreeTile } from './types/AncientTreeTile.js';
import { MagicFogTile } from './types/MagicFogTile.js';

/** type id -> { create(), label, blurb }. */
export const TileRegistry = Object.freeze({
  stone: { create: () => new StoneTile(), label: 'Ancient Stone', blurb: 'The bones of the board.' },
  moss: { create: () => new MossTile(), label: 'Moss', blurb: 'Blooms when a line clears nearby.' },
  crystal: { create: () => new CrystalTile(), label: 'Crystal Tile', blurb: 'Clears its whole row and column when triggered.' },
  frozen: { create: () => new FrozenTile(), label: 'Frozen Tile', blurb: 'Needs two nearby clears to thaw.' },
  corrupted: { create: () => new CorruptedTile(), label: 'Corrupted Tile', blurb: 'Spreads unless purged by a clear.' },
  portal: { create: (v) => new PortalTile(v), label: 'Portal Tile', blurb: 'Teleports part of your relic to its pair.' },
  dragonrune: { create: () => new DragonRuneTile(), label: 'Dragon Rune', blurb: 'Charges Dragon Energy faster.' },
  treasure: { create: () => new TreasureTile(), label: 'Treasure', blurb: 'Clear it before it vanishes for rewards.' },
  ancienttree: { create: () => new AncientTreeTile(), label: 'Ancient Tree', blurb: 'Surround it with clears to fell it.' },
  fog: { create: () => new MagicFogTile(), label: 'Magic Fog', blurb: 'Hides cells until nearby lines clear.' },
});

export function createTile(type, arg) {
  const entry = TileRegistry[type];
  if (!entry) throw new Error(`Unknown tile type "${type}"`);
  return entry.create(arg);
}
