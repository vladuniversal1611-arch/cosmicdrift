/**
 * Objectives.js
 * -----------------------------------------------------------------------------
 * The catalogue of level objectives. This is the whole reason the game is no
 * longer endless score-chasing: every level draws 1–3 of these, and completing
 * them all clears the level. Each objective is pure data — an event to count, an
 * optional matcher, display metadata, difficulty scaling and gating — so adding
 * a brand-new objective is a single entry here and nothing else changes.
 *
 * Fields:
 *   id        unique key
 *   name      label template; "{n}" is replaced by the goal count
 *   icon      which glyph ObjectiveIcons draws
 *   color     accent colour for the icon + progress bar
 *   event     the game event this objective counts
 *   amount    optional (payload) => number contributed per event (default 1)
 *   match     optional (payload) => bool filter
 *   require   tile mechanic that must be unlocked (also seeds/gates the level)
 *   minLevel  earliest level this objective can appear
 *   base/per  goal = round(base + per*level), clamped to >= 1
 *   weight    selection weight
 *   reward    optional bonus resources granted on completion
 * -----------------------------------------------------------------------------
 */
import { Palette } from './Palette.js';

const P = Palette;

export const Objectives = Object.freeze([
  { id: 'collectEnergy', name: 'Collect {n} Crystal Energy', icon: 'crystal', color: P.accent,
    event: 'game:piecePlaced', amount: (p) => p.blocks ?? 1, base: 14, per: 0.8, weight: 5, minLevel: 1,
    reward: { gold: 60 } },
  { id: 'clearLines', name: 'Clear {n} Lines', icon: 'crystaltile', color: P.accentAlt,
    event: 'game:linesCleared', amount: (p) => p.count ?? p.amount ?? 1, base: 3, per: 0.12, weight: 5, minLevel: 1,
    reward: { gold: 70 } },
  { id: 'chargeEggs', name: 'Charge {n} Dragon Eggs', icon: 'egg', color: P.warning,
    event: 'structure:completed', base: 2, per: 0.03, weight: 3, minLevel: 1, reward: { gold: 20 } },
  { id: 'rescueDragons', name: 'Rescue {n} Baby Dragons', icon: 'dragon', color: P.danger,
    event: 'structure:completed', match: (p) => p.id === 'dragonShrine', base: 1, per: 0.02, weight: 2, minLevel: 10,
    reward: { gold: 40 } },
  { id: 'repairBridge', name: 'Repair {n} Bridge(s)', icon: 'bridge', color: P.accentAlt,
    event: 'structure:completed', match: (p) => p.id === 'bridge', base: 1, per: 0.02, weight: 2, minLevel: 8,
    reward: { materials: 12 } },
  { id: 'repairStatue', name: 'Repair {n} Ancient Statue(s)', icon: 'statue', color: '#c8b48a',
    event: 'structure:completed', match: (p) => p.id === 'towerFoundation', base: 1, per: 0.02, weight: 2, minLevel: 8,
    reward: { materials: 12 } },
  { id: 'growFlowers', name: 'Grow {n} Magic Flowers', icon: 'flower', color: '#6bef86',
    event: 'moss:bloomed', require: 'moss', base: 3, per: 0.06, weight: 4, minLevel: 1, reward: { essence: 8 } },
  { id: 'restoreTrees', name: 'Restore {n} Ancient Trees', icon: 'tree', color: '#2f9e4f',
    event: 'tree:freed', require: 'ancienttree', base: 1, per: 0.03, weight: 3, minLevel: 1, reward: { materials: 16 } },
  { id: 'clearCrystalTiles', name: 'Clear {n} Crystal Tiles', icon: 'crystaltile', color: '#c3b3ff',
    event: 'tile:crystal', require: 'crystal', base: 3, per: 0.05, weight: 4, minLevel: 1, reward: { essence: 8 } },
  { id: 'destroyCorruption', name: 'Destroy {n} Corruption', icon: 'corruption', color: '#c04dff',
    event: 'tile:corruptionDestroyed', require: 'corrupted', base: 4, per: 0.1, weight: 4, minLevel: 1, reward: { gold: 24 } },
  { id: 'activateRunes', name: 'Activate {n} Magic Runes', icon: 'rune', color: '#ffb020',
    event: 'tile:runeActivated', require: 'dragonrune', base: 3, per: 0.06, weight: 4, minLevel: 1, reward: { essence: 10 } },
  { id: 'openTreasure', name: 'Open {n} Treasure Chests', icon: 'chest', color: '#ffd23d',
    event: 'treasure:collected', require: 'treasure', base: 2, per: 0.04, weight: 3, minLevel: 1, reward: { gold: 30 } },
  { id: 'freeFrozen', name: 'Free {n} Frozen Dragons', icon: 'frozen', color: '#aee0ff',
    event: 'tile:frozenFreed', require: 'frozen', base: 2, per: 0.05, weight: 3, minLevel: 1, reward: { materials: 14 } },
  { id: 'activatePortals', name: 'Activate {n} Portals', icon: 'portal', color: '#28e0d0',
    event: 'tile:portalUsed', require: 'portal', base: 3, per: 0.06, weight: 3, minLevel: 1, reward: { essence: 10 } },
  { id: 'chargeTowers', name: 'Charge {n} Energy Towers', icon: 'towericon', color: '#3aa8ff',
    event: 'gameplay:combo', match: (p) => p.combo >= 2, amount: () => 1, base: 2, per: 0.03, weight: 2, minLevel: 6,
    reward: { gold: 20 } },
  { id: 'driftClears', name: 'Clear {n} lines by Drift', icon: 'drift', color: '#8fd6ff',
    event: 'drift:linesCleared', amount: (p) => p.count ?? 1, base: 2, per: 0.03, weight: 3, minLevel: 3,
    reward: { essence: 12 } },
  { id: 'defeatBoss', name: 'Purge the Corruption Boss', icon: 'boss', color: P.danger,
    event: 'tile:corruptionDestroyed', require: 'corrupted', base: 15, per: 0.2, weight: 1, minLevel: 20,
    reward: { crystal: 1, gold: 80 }, boss: true },
]);

export const ObjectiveById = Object.freeze(
  Object.fromEntries(Objectives.map((o) => [o.id, o])),
);

/** Goal count for an objective at a given level (>= 1). */
export function objectiveGoal(def, level) {
  return Math.max(1, Math.round(def.base + def.per * level));
}

/** Is an objective available at `level` given the unlocked tile mechanics? */
export function objectiveAvailable(def, level, unlocked) {
  if (level < def.minLevel) return false;
  if (def.require && !unlocked.has(def.require)) return false;
  return true;
}
