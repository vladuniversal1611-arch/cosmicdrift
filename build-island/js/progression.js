/* Progression: XP & levels, blueprint unlocks, island list, island completion and unlocks. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  // XP needed to go from `level` to `level + 1`.
  function xpToNext(level) { return Math.round(50 * Math.pow(level, 1.35)); }
  function levelReward(level) { return 100 + (level - 2) * 25; }

  const ISLANDS = [
    { id: 'green', name: 'Green Island', emoji: '🌿', theme: 'green', unlock: null,
      tasks: [
        { text: 'Build 3 houses', stat: 'houses', target: 3 },
        { text: 'Build a windmill', stat: 'type:windmill', target: 1 },
        { text: 'Expand the island', stat: 'expansions', target: 1 },
        { text: 'Collect 15 crystals', stat: 'crystal', target: 15 },
        { text: 'Build a tower', stat: 'type:tower', target: 1 },
      ] },
    { id: 'desert', name: 'Desert Island', emoji: '🏜️', theme: 'desert', unlock: { type: 'island', value: 'green', text: 'Complete Green Island' },
      tasks: [
        { text: 'Build 4 houses', stat: 'houses', target: 4 },
        { text: 'Build 2 farms', stat: 'type:farm', target: 2 },
        { text: 'Expand the island twice', stat: 'expansions', target: 2 },
        { text: 'Collect 20 crystals', stat: 'crystal', target: 20 },
        { text: 'Build 12 structures', stat: 'built', target: 12 },
      ] },
    { id: 'ice', name: 'Ice Island', emoji: '❄️', theme: 'ice', unlock: { type: 'built', value: 10, text: 'Build 10 structures' },
      tasks: [
        { text: 'Build 5 houses', stat: 'houses', target: 5 },
        { text: 'Build a workshop', stat: 'type:workshop', target: 1 },
        { text: 'Build 2 towers', stat: 'type:tower', target: 2 },
        { text: 'Expand the island twice', stat: 'expansions', target: 2 },
        { text: 'Collect 25 crystals', stat: 'crystal', target: 25 },
      ] },
    { id: 'volcano', name: 'Volcano Island', emoji: '🌋', theme: 'volcano', unlock: { type: 'level', value: 10, text: 'Reach level 10' },
      tasks: [
        { text: 'Build 6 houses', stat: 'houses', target: 6 },
        { text: 'Build 2 crystal generators', stat: 'type:crystal_gen', target: 2 },
        { text: 'Expand the island 3 times', stat: 'expansions', target: 3 },
        { text: 'Collect 30 crystals', stat: 'crystal', target: 30 },
        { text: 'Build 15 structures', stat: 'built', target: 15 },
      ] },
    { id: 'neon', name: 'Neon Island', emoji: '🌃', theme: 'neon', unlock: { type: 'crystal', value: 100, text: 'Collect 100 crystals' },
      tasks: [
        { text: 'Build 6 houses', stat: 'houses', target: 6 },
        { text: 'Build 5 lamp posts', stat: 'type:lamp', target: 5 },
        { text: 'Build 2 fountains', stat: 'type:fountain', target: 2 },
        { text: 'Expand the island 3 times', stat: 'expansions', target: 3 },
        { text: 'Collect 40 crystals', stat: 'crystal', target: 40 },
      ] },
    { id: 'sky', name: 'Sky Island', emoji: '☁️', theme: 'sky', unlock: { type: 'built', value: 25, text: 'Build 25 structures' },
      tasks: [
        { text: 'Build 8 houses', stat: 'houses', target: 8 },
        { text: 'Build 3 windmills', stat: 'type:windmill', target: 3 },
        { text: 'Expand the island 4 times', stat: 'expansions', target: 4 },
        { text: 'Build 20 structures', stat: 'built', target: 20 },
        { text: 'Collect 40 crystals', stat: 'crystal', target: 40 },
      ] },
    { id: 'space', name: 'Space Island', emoji: '🪐', theme: 'space', unlock: { type: 'level', value: 20, text: 'Reach level 20' },
      tasks: [
        { text: 'Build 8 houses', stat: 'houses', target: 8 },
        { text: 'Build 3 crystal generators', stat: 'type:crystal_gen', target: 3 },
        { text: 'Build 3 towers', stat: 'type:tower', target: 3 },
        { text: 'Expand the island 4 times', stat: 'expansions', target: 4 },
        { text: 'Collect 50 crystals', stat: 'crystal', target: 50 },
      ] },
  ];
  const BY_ID = {};
  ISLANDS.forEach((i) => { BY_ID[i.id] = i; });

  const ISLAND_REWARD = { coins: 200, wood: 50, stone: 30, crystal: 10 };

  function S() { return BI.state; }

  function statOf(stats, stat) {
    if (stat.indexOf('type:') === 0) return (stats.byType && stats.byType[stat.slice(5)]) || 0;
    return stats[stat] || 0;
  }
  function islandStat(isl, stat) {
    if (stat === 'expansions') return isl.expansions;
    return statOf(isl.stats, stat);
  }

  /** Completion info for an island: { pct (0..1), tasks: [{text, cur, target, done}] } */
  function islandProgress(id) {
    const def = BY_ID[id];
    const isl = S().islands[id];
    let sum = 0;
    const tasks = def.tasks.map((t) => {
      const cur = isl ? Math.min(t.target, islandStat(isl, t.stat)) : 0;
      sum += cur / t.target;
      return { text: t.text, cur, target: t.target, done: cur >= t.target };
    });
    return { pct: sum / tasks.length, tasks };
  }

  function unlockProgress(def) {
    const s = S();
    const u = def.unlock;
    if (!u) return { cur: 1, target: 1 };
    if (u.type === 'island') {
      const isl = s.islands[u.value];
      return { cur: isl && isl.completed ? 1 : islandProgress(u.value).pct, target: 1 };
    }
    if (u.type === 'level') return { cur: Math.min(s.level, u.value), target: u.value };
    if (u.type === 'built') return { cur: Math.min(s.stats.built, u.value), target: u.value };
    if (u.type === 'crystal') return { cur: Math.min(s.stats.crystal, u.value), target: u.value };
    return { cur: 0, target: 1 };
  }

  function isUnlocked(id) { return S().unlockedIslands.indexOf(id) >= 0; }

  /** Unlock any islands whose requirement is now met. */
  function checkUnlocks() {
    const s = S();
    ISLANDS.forEach((def) => {
      if (isUnlocked(def.id) || !def.unlock) return;
      const p = unlockProgress(def);
      if (p.cur >= p.target) {
        s.unlockedIslands.push(def.id);
        BI.UI.queuePopup({ kind: 'island_unlock', island: def });
        BI.Save.scheduleSave();
      }
    });
  }

  /** Check completion of the current island. */
  function checkIslandCompletion() {
    const g = BI.Game;
    const isl = g.island;
    if (!isl || isl.completed) return;
    const pr = islandProgress(isl.id);
    if (pr.pct >= 0.999) {
      isl.completed = true;
      const s = S();
      Object.keys(ISLAND_REWARD).forEach((k) => { s.res[k] += ISLAND_REWARD[k]; });
      BI.UI.queuePopup({ kind: 'island_complete', island: BY_ID[isl.id], rewards: ISLAND_REWARD });
      addXP(150);
      checkUnlocks();
      BI.UI.updateRes();
      BI.Save.saveGame();
    }
  }

  /** Sync unlocked blueprints with the current level. Returns newly unlocked ids. */
  function syncBlueprints() {
    const s = S();
    const added = [];
    BI.Buildings.ORDER.forEach((id) => {
      if (BI.Buildings.DEFS[id].level <= s.level && s.blueprints.indexOf(id) < 0) {
        s.blueprints.push(id);
        added.push(id);
      }
    });
    return added;
  }
  function isBlueprintUnlocked(id) { return S().blueprints.indexOf(id) >= 0; }

  function addXP(amount) {
    const s = S();
    s.xp += Math.round(amount);
    let need = xpToNext(s.level);
    while (s.xp >= need) {
      s.xp -= need;
      s.level += 1;
      const coins = levelReward(s.level);
      s.res.coins += coins;
      const unlocked = syncBlueprints();
      BI.UI.queuePopup({ kind: 'level', level: s.level, coins, unlocked });
      need = xpToNext(s.level);
      checkUnlocks();
      if (BI.Quests) BI.Quests.check();
    }
    BI.UI.updateXP();
    BI.UI.updateRes();
  }

  BI.Progression = {
    ISLANDS, BY_ID, ISLAND_REWARD, xpToNext, levelReward, addXP, islandProgress, unlockProgress,
    isUnlocked, checkUnlocks, checkIslandCompletion, syncBlueprints, isBlueprintUnlocked, statOf,
  };
})();
