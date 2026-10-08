/* Quests: a hand-made chain, then endless generated quests. Three are active at a time.
   Progress = lifetime stat now - stat when the quest became active. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  // icon: any item key, or house / build / expand / island / sell
  const q = (id, text, stat, target, coins, xp, icon) => ({ id, text, stat, target, coins, xp, icon });
  const LIST = [
    q('q_wood', 'Collect 15 Wood', 'wood', 15, 40, 25, 'wood'),
    q('q_sawmill', 'Build a Sawmill', 'type:sawmill', 1, 60, 30, 'build'),
    q('q_plank', 'Craft 10 Planks', 'craft:plank', 10, 60, 30, 'plank'),
    q('q_stone', 'Collect 15 Stone', 'stone', 15, 40, 25, 'stone'),
    q('q_bench', 'Build a Stone Workbench', 'type:stonecutter', 1, 60, 30, 'build'),
    q('q_brick', 'Craft 8 Bricks', 'craft:brick', 8, 60, 30, 'brick'),
    q('q_house', 'Build a Wooden House', 'type:wooden_house', 1, 100, 40, 'house'),
    q('q_farm', 'Build a Farm', 'type:farm', 1, 80, 40, 'build'),
    q('q_sell', 'Sell 10 goods in the Bag', 'sold', 10, 50, 30, 'sell'),
    q('q_camp', 'Build a Lumber Camp', 'type:lumber_camp', 1, 100, 50, 'build'),
    q('q_expand', 'Expand the Island', 'expansions', 1, 150, 60, 'expand'),
    q('q_desert', 'Unlock Desert Island', 'islands', 1, 150, 80, 'island'),
    q('q_sand', 'Collect 20 Sand', 'sand', 20, 80, 40, 'sand'),
    q('q_furnace', 'Build a Furnace', 'type:furnace', 1, 120, 60, 'build'),
    q('q_glass', 'Craft 10 Glass', 'craft:glass', 10, 120, 60, 'glass'),
    q('q_quarry', 'Build a Quarry', 'type:quarry', 1, 120, 60, 'build'),
    q('q_shouse', 'Build a Stone House', 'type:stone_house', 1, 150, 70, 'house'),
    q('q_ice', 'Unlock Ice Island', 'islands', 1, 250, 100, 'island'),
    q('q_iron', 'Collect 20 Iron Ore', 'iron', 20, 120, 60, 'iron'),
    q('q_ingot', 'Craft 6 Iron Bars', 'craft:ingot', 6, 150, 70, 'ingot'),
    q('q_workshop', 'Build a Workshop', 'type:workshop', 1, 200, 80, 'build'),
    q('q_tools', 'Craft 4 Tools', 'craft:tools', 4, 200, 80, 'tools'),
    q('q_mine', 'Build a Mine', 'type:mine', 1, 250, 100, 'build'),
    q('q_volcano', 'Unlock Volcano Island', 'islands', 1, 400, 150, 'island'),
    q('q_coal', 'Collect 20 Coal', 'coal', 20, 150, 70, 'coal'),
    q('q_tower', 'Build a Tower', 'type:tower', 1, 300, 120, 'build'),
    q('q_lab', 'Build a Crystal Lab', 'type:crystal_lab', 1, 300, 120, 'build'),
    q('q_core', 'Craft 3 Energy Cores', 'craft:core', 3, 400, 150, 'core'),
  ];

  const GEN = [
    (n) => q(0, 'Craft ' + (15 + n * 5) + ' Planks', 'craft:plank', 15 + n * 5, 80 + n * 15, 40 + n * 8, 'plank'),
    (n) => q(0, 'Craft ' + (12 + n * 4) + ' Bricks', 'craft:brick', 12 + n * 4, 90 + n * 15, 45 + n * 8, 'brick'),
    (n) => q(0, 'Build ' + (2 + (n >> 1)) + ' Buildings', 'built', 2 + (n >> 1), 120 + n * 20, 60 + n * 10, 'build'),
    (n) => q(0, 'Sell ' + (20 + n * 10) + ' Goods', 'sold', 20 + n * 10, 80 + n * 15, 40 + n * 8, 'sell'),
    (n) => q(0, 'Craft ' + (6 + n * 2) + ' Glass', 'craft:glass', 6 + n * 2, 120 + n * 20, 60 + n * 10, 'glass'),
    (n) => q(0, 'Collect ' + (5 + n) + ' Crystals', 'crystal', 5 + n, 100 + n * 20, 50 + n * 10, 'crystal'),
  ];

  function Q() { return BI.state.quests; }

  function statValue(stat) {
    const s = BI.state;
    if (stat === 'level') return s.level;
    return BI.Progression.statOf(s.stats, stat);
  }

  function nextDef() {
    const q = Q();
    if (q.next < LIST.length) return Object.assign({}, LIST[q.next++]);
    const n = q.gen++;
    const d = GEN[n % GEN.length](Math.floor(n / GEN.length) + 1);
    d.id = 'gen_' + n;
    return d;
  }

  function ensureActive() {
    const q = Q();
    while (q.active.length < 3) {
      const d = nextDef();
      d.start = statValue(d.stat);
      q.active.push(d);
    }
  }

  function progress(quest) {
    return Math.max(0, Math.min(quest.target, statValue(quest.stat) - quest.start));
  }

  let checking = false, again = false;
  /** Complete any finished quests, grant rewards, refill slots. */
  function check() {
    if (checking) { again = true; return; }
    checking = true;
    do {
      again = false;
      const q = Q();
      const done = q.active.filter((x) => progress(x) >= x.target);
      if (!done.length) break;
      q.active = q.active.filter((x) => done.indexOf(x) < 0);
      done.forEach((x) => {
        q.completed.push(x.id);
        BI.state.stats.quests += 1;
        BI.state.res.coins += x.coins;
        BI.UI.queuePopup({ kind: 'quest', quest: x });
      });
      ensureActive();
      done.forEach((x) => BI.Progression.addXP(x.xp));
      BI.Save.scheduleSave();
    } while (again);
    checking = false;
    BI.UI.renderQuests();
    BI.UI.updateRes();
  }

  BI.Quests = { LIST, ensureActive, progress, check, statValue };
})();
