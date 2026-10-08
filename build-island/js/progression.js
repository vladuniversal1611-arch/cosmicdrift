/* Progression: XP & levels, blueprint unlocks, island list, island completion and unlocks. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  // XP needed to go from `level` to `level + 1`.
  function xpToNext(level) { return Math.round(50 * Math.pow(level, 1.35)); }
  function levelReward(level) { return 100 + (level - 2) * 25; }

  // unlock: level + materials paid once (building the boat / airship to get there)
  const ISLANDS = [
    { id: 'green', name: 'Green Island', emoji: '🌿', theme: 'green', unlock: null, finds: ['wood', 'stone', 'crystal'],
      tasks: [
        { text: 'Build a Sawmill', stat: 'type:sawmill', target: 1 },
        { text: 'Build a Stone Workbench', stat: 'type:stonecutter', target: 1 },
        { text: 'Craft 30 planks', stat: 'craft:plank', target: 30 },
        { text: 'Build 3 houses', stat: 'houses', target: 3 },
        { text: 'Expand the island', stat: 'expansions', target: 1 },
      ] },
    { id: 'desert', name: 'Desert Island', emoji: '🏜️', theme: 'desert', finds: ['sand', 'wood', 'stone'],
      unlock: { level: 2, cost: { plank: 20, brick: 10, coins: 150 }, text: 'Build a boat' },
      tasks: [
        { text: 'Collect 40 sand', stat: 'sand', target: 40 },
        { text: 'Build a Furnace', stat: 'type:furnace', target: 1 },
        { text: 'Craft 20 glass', stat: 'craft:glass', target: 20 },
        { text: 'Build a Quarry', stat: 'type:quarry', target: 1 },
        { text: 'Build 2 stone houses', stat: 'type:stone_house', target: 2 },
      ] },
    { id: 'ice', name: 'Ice Island', emoji: '❄️', theme: 'ice', finds: ['iron', 'wood', 'stone'],
      unlock: { level: 4, cost: { plank: 30, brick: 20, glass: 10, coins: 300 }, text: 'Build an icebreaker' },
      tasks: [
        { text: 'Collect 40 iron ore', stat: 'iron', target: 40 },
        { text: 'Craft 20 iron bars', stat: 'craft:ingot', target: 20 },
        { text: 'Build a Workshop', stat: 'type:workshop', target: 1 },
        { text: 'Craft 10 tools', stat: 'craft:tools', target: 10 },
        { text: 'Build a Windmill', stat: 'type:windmill', target: 1 },
      ] },
    { id: 'volcano', name: 'Volcano Island', emoji: '🌋', theme: 'volcano', finds: ['coal', 'iron', 'stone'],
      unlock: { level: 5, cost: { brick: 30, glass: 15, ingot: 6, coins: 500 }, text: 'Build a heat-proof ship' },
      tasks: [
        { text: 'Collect 50 coal', stat: 'coal', target: 50 },
        { text: 'Build a Mine', stat: 'type:mine', target: 1 },
        { text: 'Craft 30 iron bars', stat: 'craft:ingot', target: 30 },
        { text: 'Build a Tower', stat: 'type:tower', target: 1 },
        { text: 'Expand the island twice', stat: 'expansions', target: 2 },
      ] },
    { id: 'neon', name: 'Neon Island', emoji: '🌃', theme: 'neon', finds: ['crystal', 'coal', 'wood'],
      unlock: { level: 7, cost: { glass: 30, ingot: 15, crystal: 20, coins: 800 }, text: 'Build a neon glider' },
      tasks: [
        { text: 'Collect 40 crystals', stat: 'crystal', target: 40 },
        { text: 'Build a Crystal Lab', stat: 'type:crystal_lab', target: 1 },
        { text: 'Craft 5 energy cores', stat: 'craft:core', target: 5 },
        { text: 'Build 3 lamp posts', stat: 'type:lamp', target: 3 },
        { text: 'Build a fountain', stat: 'type:fountain', target: 1 },
      ] },
    { id: 'sky', name: 'Sky Island', emoji: '☁️', theme: 'sky', finds: ['wood', 'sand', 'crystal'],
      unlock: { level: 9, cost: { ingot: 20, tools: 8, core: 2, coins: 1200 }, text: 'Build an airship' },
      tasks: [
        { text: 'Build 5 houses', stat: 'houses', target: 5 },
        { text: 'Craft 60 planks', stat: 'craft:plank', target: 60 },
        { text: 'Build 2 towers', stat: 'type:tower', target: 2 },
        { text: 'Build a Crystal Generator', stat: 'type:crystal_gen', target: 1 },
        { text: 'Expand the island 3 times', stat: 'expansions', target: 3 },
      ] },
    { id: 'space', name: 'Space Island', emoji: '🪐', theme: 'space', finds: ['iron', 'crystal', 'coal'],
      unlock: { level: 11, cost: { core: 6, tools: 12, ingot: 30, coins: 2000 }, text: 'Build a rocket' },
      tasks: [
        { text: 'Craft 10 energy cores', stat: 'craft:core', target: 10 },
        { text: 'Build 2 crystal generators', stat: 'type:crystal_gen', target: 2 },
        { text: 'Collect 60 iron ore', stat: 'iron', target: 60 },
        { text: 'Build 2 towers', stat: 'type:tower', target: 2 },
        { text: 'Expand the island 4 times', stat: 'expansions', target: 4 },
      ] },
  ];
  const BY_ID = {};
  ISLANDS.forEach((i) => { BY_ID[i.id] = i; });

  const ISLAND_REWARD = { coins: 300, plank: 20, brick: 20, crystal: 10 };

  function S() { return BI.state; }

  function statOf(stats, stat) {
    if (stat.indexOf('type:') === 0) return (stats.byType && stats.byType[stat.slice(5)]) || 0;
    if (stat.indexOf('craft:') === 0) return (stats.crafted && stats.crafted[stat.slice(6)]) || 0;
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

  function isUnlocked(id) { return S().unlockedIslands.indexOf(id) >= 0; }

  /** null when the island can be unlocked now, otherwise the reason. */
  function unlockBlocker(def) {
    const u = def.unlock;
    if (!u) return null;
    if (S().level < u.level) return 'Reach level ' + u.level;
    if (!BI.Game.canAfford(u.cost)) return 'Not enough materials';
    return null;
  }

  function unlockIsland(id) {
    const def = BY_ID[id];
    if (!def || isUnlocked(id) || unlockBlocker(def)) return false;
    BI.Game.pay(def.unlock.cost);
    const s = S();
    s.unlockedIslands.push(id);
    s.stats.islands = s.unlockedIslands.length;
    BI.UI.queuePopup({ kind: 'island_unlock', island: def });
    addXP(100);
    if (BI.Quests) BI.Quests.check();
    BI.Save.saveGame();
    return true;
  }

  function checkUnlocks() { /* islands are unlocked by paying materials — see unlockIsland() */ }

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
    ISLANDS, BY_ID, ISLAND_REWARD, xpToNext, levelReward, addXP, islandProgress, unlockBlocker, unlockIsland,
    isUnlocked, checkUnlocks, checkIslandCompletion, syncBlueprints, isBlueprintUnlocked, statOf,
  };
})();
