/* ============================================================
   Save system — persistent player profile via localStorage.
   Robust to corrupted/old data; auto-creates defaults.
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'dragonMergeBlast.save.v1';

  function freshProfile() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      version: 1,
      gold: 200,
      gems: 30,
      energy: 0,
      levelProgress: 1,            // highest unlocked level
      stars: {},                   // { levelNumber: starCount }
      ownedDragons: ['flare'],     // start with the fire dragon
      dragonLevels: { flare: 1 },  // upgrade level per dragon
      equipped: ['flare', null, null],
      eggs: [                      // incubating eggs on the island
        { dragon: 'frost',   charge: 0, need: 120 },
        { dragon: 'storm',   charge: 0, need: 220 },
        { dragon: 'verdant', charge: 0, need: 340 },
        { dragon: 'aether',  charge: 0, need: 520 }
      ],
      ownedSkins: [],
      activeSkins: {},             // { dragonId: skinId }
      stats: {
        levelsWon: 0, maxCombo: 0, dragonsHatched: 0, crystalsCrushed: 0,
        totalStars: 0, dragonProcs: 0, energyEarned: 0, specialsMade: 0
      },
      achievements: {},            // { id: claimed bool }
      quests: { date: today, list: [], progressBase: {} },
      daily: { lastClaim: '', streak: 0 },
      pass: { xp: 0, premium: false, claimedFree: [], claimedPremium: [] },
      settings: { sound: true, music: true },
      firstRun: true
    };
  }

  let profile = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        profile = Object.assign(freshProfile(), data);
        // Deep-merge nested objects that may be missing in old saves.
        const def = freshProfile();
        ['stats', 'daily', 'pass', 'settings', 'quests'].forEach(function (k) {
          profile[k] = Object.assign(def[k], profile[k] || {});
        });
        profile.stats = Object.assign(def.stats, profile.stats || {});
      } else {
        profile = freshProfile();
      }
    } catch (e) {
      profile = freshProfile();
    }
    return profile;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) {}
  }

  function get() { return profile || load(); }

  function reset() { profile = freshProfile(); save(); return profile; }

  function addStat(stat, value, isMax) {
    const s = get().stats;
    if (isMax) s[stat] = Math.max(s[stat] || 0, value);
    else s[stat] = (s[stat] || 0) + value;
    save();
  }

  global.Save = { load, save, get, reset, addStat, KEY };
})(window);
