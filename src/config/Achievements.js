/**
 * Achievements.js
 * -----------------------------------------------------------------------------
 * Data for the Awards collection: milestone achievements tracked from real play
 * stats. Each is pure data — a counter to watch, a goal, and its album art.
 *
 *   stat   which tracked counter this measures:
 *            levels     — levels completed
 *            lines      — total lines cleared
 *            bestCombo  — highest combo reached in a run
 *            structures — structures built
 *            restored   — world landmarks fully restored
 *            dragons    — companion dragons unlocked (derived from progress)
 *   goal   the counter value that unlocks the award
 * -----------------------------------------------------------------------------
 */
export const Achievements = Object.freeze([
  { id: 'firstSteps', name: 'First Steps', icon: 'flower', color: '#3fc86a', stat: 'levels', goal: 1, desc: 'Complete your first level' },
  { id: 'gettingStarted', name: 'Rising Star', icon: 'gem', color: '#3aa8ff', stat: 'levels', goal: 5, desc: 'Complete 5 levels' },
  { id: 'marathoner', name: 'Marathoner', icon: 'chest', color: '#ffb020', stat: 'levels', goal: 25, desc: 'Complete 25 levels' },
  { id: 'comboMaster', name: 'Combo Master', icon: 'boss', color: '#ff5c94', stat: 'bestCombo', goal: 5, desc: 'Reach a ×5 combo' },
  { id: 'lineCrusher', name: 'Line Crusher', icon: 'crystal', color: '#8a4fe0', stat: 'lines', goal: 100, desc: 'Clear 100 lines' },
  { id: 'worldBuilder', name: 'World Builder', icon: 'tree', color: '#28c0a8', stat: 'restored', goal: 1, desc: 'Restore a world landmark' },
  { id: 'masterBuilder', name: 'Master Builder', icon: 'statue', color: '#c8b48a', stat: 'restored', goal: 3, desc: 'Restore 3 landmarks' },
  { id: 'architect', name: 'Architect', icon: 'towericon', color: '#37a8ff', stat: 'structures', goal: 10, desc: 'Build 10 structures' },
  { id: 'dragonWhisperer', name: 'Dragon Whisperer', icon: 'dragon', color: '#8a4fe0', stat: 'dragons', goal: 3, desc: 'Collect 3 dragons' },
  { id: 'dragonLord', name: 'Dragon Lord', icon: 'egg', color: '#ff7a4d', stat: 'dragons', goal: 5, desc: 'Collect every dragon' },
]);

export const AchievementById = Object.freeze(Object.fromEntries(Achievements.map((a) => [a.id, a])));
