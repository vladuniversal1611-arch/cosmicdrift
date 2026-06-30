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
      dragonTiers: { flare: 1 },   // evolution tier per dragon (1..3)
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
      boosters: { hammer: 3, shuffle: 2, moves: 2 },
      lives: { count: 5, max: 5, lastRegen: Date.now() },
      streak: { wins: 0, best: 0 },
      piggy: { coins: 0, cap: 500 },
      chests: {},
      modeBest: { blitz: 0, endless: 0, trials: 0 },
      daily2: { date: '', done: false },
      settings: { sound: true, music: true, vibration: true, language: 'uk', autoDragons: false, perf: false, colorblind: false },
      tutorialDone: false,
      tips: {},
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
        ['stats', 'daily', 'pass', 'settings', 'quests', 'boosters', 'lives', 'streak', 'piggy', 'modeBest', 'daily2'].forEach(function (k) {
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

  // ---- Lives / hearts ------------------------------------------------------
  const REGEN_MS = 20 * 60 * 1000; // 20 minutes per heart

  function syncLives() {
    const p = get();
    const lv = p.lives || (p.lives = { count: 5, max: 5, lastRegen: Date.now() });
    if (lv.count >= lv.max) { lv.lastRegen = Date.now(); return lv; }
    const elapsed = Date.now() - (lv.lastRegen || Date.now());
    const gained = Math.floor(elapsed / REGEN_MS);
    if (gained > 0) {
      lv.count = Math.min(lv.max, lv.count + gained);
      lv.lastRegen = (lv.count >= lv.max) ? Date.now() : (lv.lastRegen + gained * REGEN_MS);
      save();
    }
    return lv;
  }
  function livesInfo() {
    const lv = syncLives();
    let msToNext = 0;
    if (lv.count < lv.max) msToNext = REGEN_MS - (Date.now() - lv.lastRegen);
    return { count: lv.count, max: lv.max, msToNext: Math.max(0, msToNext) };
  }
  function spendLife() {
    const lv = syncLives();
    if (lv.count <= 0) return false;
    if (lv.count >= lv.max) lv.lastRegen = Date.now(); // start regen clock
    lv.count -= 1; save();
    return true;
  }
  function addLives(n) {
    const lv = syncLives();
    lv.count = Math.min(lv.max, lv.count + n); save();
  }
  function refillLives() { const lv = syncLives(); lv.count = lv.max; lv.lastRegen = Date.now(); save(); }

  function addStat(stat, value, isMax) {
    const s = get().stats;
    if (isMax) s[stat] = Math.max(s[stat] || 0, value);
    else s[stat] = (s[stat] || 0) + value;
    save();
  }

  global.Save = { load, save, get, reset, addStat, KEY, livesInfo, spendLife, addLives, refillLives, syncLives };
})(window);
