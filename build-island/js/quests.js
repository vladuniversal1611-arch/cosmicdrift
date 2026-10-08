/* Quests: a hand-made chain, then endless generated quests. Three are active at a time.
   Progress = lifetime stat now - stat when the quest became active. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  const LIST = [
    { id: 'q_wood20', text: 'Collect 20 Wood', stat: 'wood', target: 20, coins: 50, xp: 30, icon: 'wood' },
    { id: 'q_house1', text: 'Build 1 House', stat: 'houses', target: 1, coins: 100, xp: 40, icon: 'house' },
    { id: 'q_stone10', text: 'Collect 10 Stone', stat: 'stone', target: 10, coins: 50, xp: 30, icon: 'stone' },
    { id: 'q_build3', text: 'Build 3 Buildings', stat: 'built', target: 3, coins: 150, xp: 50, icon: 'build' },
    { id: 'q_expand1', text: 'Expand Island', stat: 'expansions', target: 1, coins: 200, xp: 60, icon: 'expand' },
    { id: 'q_crystal3', text: 'Collect 3 Crystals', stat: 'crystal', target: 3, coins: 75, xp: 40, icon: 'crystal' },
    { id: 'q_farm', text: 'Build a Farm', stat: 'type:farm', target: 1, coins: 100, xp: 40, icon: 'build' },
    { id: 'q_windmill', text: 'Build a Windmill', stat: 'type:windmill', target: 1, coins: 120, xp: 50, icon: 'build' },
    { id: 'q_wood50', text: 'Collect 50 Wood', stat: 'wood', target: 50, coins: 120, xp: 50, icon: 'wood' },
    { id: 'q_house2', text: 'Build 2 Houses', stat: 'houses', target: 2, coins: 150, xp: 60, icon: 'house' },
    { id: 'q_stone30', text: 'Collect 30 Stone', stat: 'stone', target: 30, coins: 120, xp: 50, icon: 'stone' },
    { id: 'q_workshop', text: 'Build a Workshop', stat: 'type:workshop', target: 1, coins: 150, xp: 70, icon: 'build' },
    { id: 'q_expand2', text: 'Expand Island again', stat: 'expansions', target: 1, coins: 300, xp: 80, icon: 'expand' },
    { id: 'q_tower', text: 'Build a Tower', stat: 'type:tower', target: 1, coins: 250, xp: 90, icon: 'build' },
    { id: 'q_gen', text: 'Build a Crystal Generator', stat: 'type:crystal_gen', target: 1, coins: 300, xp: 100, icon: 'crystal' },
    { id: 'q_crystal10', text: 'Collect 10 Crystals', stat: 'crystal', target: 10, coins: 200, xp: 80, icon: 'crystal' },
  ];

  const GEN = [
    (n) => ({ text: 'Collect ' + (40 + n * 10) + ' Wood', stat: 'wood', target: 40 + n * 10, coins: 80 + n * 15, xp: 40 + n * 8, icon: 'wood' }),
    (n) => ({ text: 'Build ' + (2 + (n >> 1)) + ' Buildings', stat: 'built', target: 2 + (n >> 1), coins: 120 + n * 20, xp: 60 + n * 10, icon: 'build' }),
    (n) => ({ text: 'Collect ' + (20 + n * 5) + ' Stone', stat: 'stone', target: 20 + n * 5, coins: 80 + n * 15, xp: 40 + n * 8, icon: 'stone' }),
    (n) => ({ text: 'Collect ' + (5 + n) + ' Crystals', stat: 'crystal', target: 5 + n, coins: 100 + n * 20, xp: 50 + n * 10, icon: 'crystal' }),
    (n) => ({ text: 'Build ' + (1 + (n >> 2)) + ' House' + (n >= 4 ? 's' : ''), stat: 'houses', target: 1 + (n >> 2), coins: 120 + n * 20, xp: 60 + n * 10, icon: 'house' }),
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
