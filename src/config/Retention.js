/**
 * Retention.js
 * -----------------------------------------------------------------------------
 * Data for the (healthy, non-manipulative) Retention Engine: the daily reward
 * calendar, the rotating daily/weekly quest pools, the rare "surprise" table,
 * and the long-term "every 10 levels unlock something NEW" schedule.
 *
 * Design rules baked in here:
 *   - Missing a day never DELETES anything you own — it only resets the streak
 *     escalation. No punishment, no FOMO timers.
 *   - Every daily claimable is FREE. The loop rewards showing up, not paying.
 *   - Unlocks are always something new to SEE/COLLECT, never just bigger numbers.
 * -----------------------------------------------------------------------------
 */

/** 7-day escalating login calendar (cycles; day = (streak-1) % 7). */
export const DailyCalendar = Object.freeze([
  { coins: 100 },
  { coins: 150 },
  { gems: 5 },
  { coins: 300 },
  { materials: 25 },
  { gems: 10 },
  { coins: 600, gems: 15, big: true },   // day 7 payoff
]);

/** Rotating daily quests — pick one per day, tracked across the session. */
export const DailyQuests = Object.freeze([
  { id: 'clearLines', text: 'Clear {n} lines today', event: 'game:linesCleared', use: 'count', goal: 15, reward: { coins: 200 } },
  { id: 'levels', text: 'Complete {n} levels today', event: 'level:complete', goal: 3, reward: { coins: 250 } },
  { id: 'structures', text: 'Build {n} structures today', event: 'structure:completed', goal: 2, reward: { gems: 6 } },
  { id: 'objectives', text: 'Finish {n} objective sets', event: 'objectives:allComplete', goal: 3, reward: { materials: 30 } },
]);

/**
 * Weekly events (one active per week, chosen deterministically from the date so
 * it's stable across reloads but rotates week to week). Each is cumulative
 * across the week and themed like a live-ops event. `milestones` are the
 * fractions of the goal at which a chest lights up on the progress track — pure
 * presentation of the single cumulative goal (the reward is granted on the
 * final claim; earlier chests are visual "you're on your way" markers).
 */
export const WeeklyChallenges = Object.freeze([
  { id: 'wLevels', name: 'Sky Marathon', icon: 'dragon', color: '#8a4fe0', blurb: 'A week-long climb through the isles.',
    text: 'Complete {n} levels this week', event: 'level:complete', goal: 25, reward: { gems: 40, coins: 1500 }, milestones: [0.4, 0.7, 1] },
  { id: 'wLines', name: 'Crystal Cascade', icon: 'gem', color: '#3aa8ff', blurb: 'Shatter crystals all week long.',
    text: 'Clear {n} lines this week', event: 'game:linesCleared', goal: 120, reward: { gems: 40, coins: 1500 }, milestones: [0.4, 0.7, 1] },
  { id: 'wStructures', name: 'Grand Architect', icon: 'statue', color: '#37a83f', blurb: 'Raise wonders across the week.',
    text: 'Build {n} structures this week', event: 'structure:completed', goal: 12, reward: { gems: 45, materials: 150 }, milestones: [0.4, 0.7, 1] },
]);

/** Rare post-level surprises. Kept genuinely rare so they stay exciting. */
export const Surprises = Object.freeze([
  { id: 'goblin', name: 'Treasure Goblin!', icon: 'chest', color: '#37a83f', reward: { coins: 500 } },
  { id: 'golden', name: 'Golden Dragon!', icon: 'dragon', color: '#ffcf5e', reward: { gems: 15 } },
  { id: 'hidden', name: 'Hidden Chest!', icon: 'chest', color: '#ff9422', reward: { coins: 750 } },
  { id: 'egg', name: 'Rare Egg!', icon: 'egg', color: '#28e0d0', reward: { gems: 8, materials: 40 } },
  { id: 'rainbow', name: 'Rainbow Reward!', icon: 'gem', color: '#8a4fe0', reward: { gems: 20 } },
]);

/** Chance a surprise appears after a completed level (rare on purpose). */
export const SurpriseChance = 0.06;

/**
 * Long-term unlock reveals fired every 10 levels. Each is something new to
 * experience — cycled so depth keeps arriving. Grants a celebratory bonus too.
 */
export const Unlocks = Object.freeze([
  { kind: 'Dragon', name: 'A New Dragon Appears', icon: 'dragon', color: '#ff5c94', reward: { gems: 10 } },
  { kind: 'Board Theme', name: 'New Board Theme', icon: 'crystal', color: '#3aa8ff', reward: { coins: 400 } },
  { kind: 'Soundtrack', name: 'New Soundtrack', icon: 'rune', color: '#28e0d0', reward: { coins: 400 } },
  { kind: 'Collectible', name: 'New Collectible', icon: 'gem', color: '#ffb020', reward: { gems: 8 } },
  { kind: 'Building', name: 'New Building Style', icon: 'statue', color: '#c8b48a', reward: { materials: 40 } },
  { kind: 'Visual Theme', name: 'New Visual Theme', icon: 'flower', color: '#3fa93f', reward: { coins: 500 } },
]);

/** Friendly, non-blaming tips shown on the retry screen. */
export const Tips = Object.freeze([
  'Tip: Save long pieces for clearing full rows.',
  'Tip: Chain clears build combos for big score multipliers.',
  'Tip: Corruption spreads — clear next to it to purge it.',
  'Tip: Line up a 2×2 to raise a Magic Crystal structure.',
  'Tip: Dragon Runes charge your Dragon Energy faster.',
  'Tip: Leave a column open to place awkward pieces.',
]);
