/* Progression (XP / levels) and quests. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  function xpToNext(level) { return Math.round(60 * Math.pow(level, 1.4)); }

  function statValue(stat) {
    const s = BI.state.stats;
    if (stat === 'level') return BI.state.level;
    const i = stat.indexOf(':');
    if (i > 0) {
      const group = s[stat.slice(0, i)] || {};
      return group[stat.slice(i + 1)] || 0;
    }
    return s[stat] || 0;
  }

  // [id, text, stat, target, xp, reward items]
  const q = (id, text, stat, target, xp, reward, hint) => ({ id, text, stat, target, xp, reward: reward || {}, hint });
  const LIST = [
    q('q1', 'Pick up branches (6 wood)', 'gather:wood', 6, 15, { berries: 2 }, 'Branches lie on the ground. Walk up and press the action button.'),
    q('q2', 'Pick up stones (6 stone)', 'gather:stone', 6, 15, {}, 'Small stones lie on the ground.'),
    q('q3', 'Gather 6 fiber from bushes', 'gather:fiber', 6, 15, {}, 'Bushes give fiber and berries.'),
    q('q4', 'Craft a Stone Axe', 'craft:stone_axe', 1, 30, { canned: 1 }, 'Open CRAFT → Hands.'),
    q('q5', 'Chop 20 wood', 'gather:wood', 20, 30, {}, 'Trees need an axe in your bag.'),
    q('q6', 'Craft a Stone Pickaxe', 'craft:stone_pick', 1, 30, {}, 'Then mine rocks for stone.'),
    q('q7', 'Build a Workbench', 'build:workbench', 1, 40, { bandage: 1 }, 'BUILD → Crafting.'),
    q('q8', 'Build a Campfire', 'build:campfire', 1, 40, {}, 'Boil dirty water from the well here.'),
    q('q9', 'Drink clean water', 'used:water_clean', 1, 30, {}, 'Well → dirty water → Campfire → clean water.'),
    q('q10', 'Craft a Wooden Club', 'craft:club', 1, 30, {}, 'Equip it in the BAG.'),
    q('q11', 'Travel to the Pine Forest', 'visit:forest', 1, 40, {}, 'Open the MAP at your shelter.'),
    q('q12', 'Kill 3 zombies', 'kills', 3, 60, { bandage: 2 }, 'Hold the attack button near a zombie.'),
    q('q13', 'Search 3 crates', 'looted', 3, 50, { canned: 1 }),
    q('q14', 'Build 6 walls', 'walls', 6, 60, {}, 'Protect your shelter from hordes.'),
    q('q15', 'Craft 10 planks', 'craft:plank', 10, 50, {}, 'Workbench (level 2).'),
    q('q16', 'Reach level 3', 'level', 3, 0, { canned: 2 }),
    q('q17', 'Build a Furnace', 'build:furnace', 1, 60, {}),
    q('q18', 'Visit the Old Quarry', 'visit:quarry', 1, 50, {}),
    q('q19', 'Smelt 5 iron bars', 'craft:iron_bar', 5, 80, {}),
    q('q20', 'Craft an Iron Axe', 'craft:iron_axe', 1, 80, {}),
    q('q21', 'Visit the Gas Station', 'visit:gas', 1, 80, { water_clean: 2 }),
    q('q22', 'Kill 15 zombies', 'kills', 15, 120, { medkit: 1 }),
    q('q23', 'Craft a Machete', 'craft:machete', 1, 100, {}),
    q('q24', 'Build a Garden Bed', 'build:garden', 1, 80, {}),
    q('q25', 'Craft a Pistol', 'craft:pistol', 1, 150, { ammo: 20 }),
    q('q26', 'Survive a horde at your shelter', 'raids', 1, 150, { medkit: 1 }),
    q('q27', 'Visit the Military Checkpoint', 'visit:military', 1, 200, {}),
  ];
  const GEN = [
    (n) => q(0, 'Kill ' + (8 + n * 4) + ' zombies', 'kills', 8 + n * 4, 80 + n * 20, { ammo: 10 }),
    (n) => q(0, 'Search ' + (4 + n * 2) + ' containers', 'looted', 4 + n * 2, 70 + n * 15, { canned: 1 }),
    (n) => q(0, 'Chop ' + (40 + n * 10) + ' wood', 'gather:wood', 40 + n * 10, 60 + n * 10, {}),
    (n) => q(0, 'Mine ' + (30 + n * 10) + ' stone', 'gather:stone', 30 + n * 10, 60 + n * 10, {}),
    (n) => q(0, 'Smelt ' + (5 + n * 3) + ' iron bars', 'craft:iron_bar', 5 + n * 3, 90 + n * 15, { medkit: 1 }),
  ];

  const Quests = {
    xpToNext, statValue, LIST,

    ensureActive() {
      const Q = BI.state.quests;
      while (Q.active.length < 3) {
        let d;
        if (Q.next < LIST.length) d = Object.assign({}, LIST[Q.next++]);
        else {
          const n = Q.gen++;
          d = GEN[n % GEN.length](Math.floor(n / GEN.length) + 1);
          d.id = 'gen_' + n;
        }
        d.start = d.stat === 'level' ? 0 : statValue(d.stat);
        Q.active.push(d);
      }
    },

    progress(x) { return Math.max(0, Math.min(x.target, statValue(x.stat) - x.start)); },

    _busy: false,
    check() {
      if (this._busy) return;
      this._busy = true;
      const Q = BI.state.quests;
      let changed = true;
      while (changed) {
        changed = false;
        const done = Q.active.filter((x) => this.progress(x) >= x.target);
        if (!done.length) break;
        changed = true;
        Q.active = Q.active.filter((x) => done.indexOf(x) < 0);
        done.forEach((x) => {
          Q.completed.push(x.id);
          Object.keys(x.reward).forEach((k) => BI.Game.giveItem(k, x.reward[k]));
          BI.UI.queuePopup({ kind: 'quest', quest: x });
        });
        this.ensureActive();
        done.forEach((x) => this.addXP(x.xp));
      }
      this._busy = false;
      BI.UI.renderQuests();
    },

    addXP(n) {
      const s = BI.state;
      s.xp += Math.round(n);
      let need = xpToNext(s.level);
      let up = false;
      while (s.xp >= need) {
        s.xp -= need;
        s.level++;
        up = true;
        const unlocked = BI.Data.RECIPES.filter((r) => r.level === s.level).map((r) => BI.Data.ITEMS[r.id] ? BI.Data.ITEMS[r.id].name : r.id)
          .concat(Object.keys(BI.Data.BUILD).filter((k) => BI.Data.BUILD[k].level === s.level).map((k) => BI.Data.BUILD[k].name))
          .concat(BI.Data.LOCATIONS.filter((l) => l.level === s.level && l.id !== 'base').map((l) => l.emoji + ' ' + l.name));
        BI.UI.queuePopup({ kind: 'level', level: s.level, unlocked });
        s.player.hp = Math.min(100, s.player.hp + 30);
        need = xpToNext(s.level);
      }
      BI.UI.updateXP();
      if (up) this.check();
    },
  };

  BI.Quests = Quests;
})();
