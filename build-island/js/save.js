/* Save system — localStorage. The whole game state lives in BI.state. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const KEY = 'buildIsland.save.v1';
  const VERSION = 1;

  function defaultState() {
    return {
      version: VERSION,
      res: { wood: 50, stone: 30, crystal: 5, coins: 100 },
      xp: 0,
      level: 1,
      // lifetime stats (quests + island unlocks read these)
      stats: { wood: 0, stone: 0, crystal: 0, built: 0, houses: 0, expansions: 0, quests: 0, ads: 0, byType: {} },
      currentIsland: 'green',
      unlockedIslands: ['green'],
      islands: {},            // per-island state, created on first visit
      quests: { next: 0, gen: 0, active: [], completed: [] },
      blueprints: [],         // unlocked building ids
      settings: { music: true, sfx: true },
      createdAt: Date.now(),
      savedAt: 0,
    };
  }

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, src) {
    Object.keys(src).forEach((k) => {
      if (isObj(base[k]) && isObj(src[k])) merge(base[k], src[k]);
      else base[k] = src[k];
    });
    return base;
  }

  let timer = null;

  function saveGame() {
    if (timer) { clearTimeout(timer); timer = null; }
    const s = BI.state;
    if (!s) return false;
    try {
      if (BI.Game && BI.Game.island && BI.Game.player) {
        BI.Game.island.player = { x: +BI.Game.player.x.toFixed(2), y: +BI.Game.player.y.toFixed(2) };
      }
      s.savedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch (e) {
      console.warn('[save] failed', e);
      return false;
    }
  }

  function scheduleSave(delay) {
    if (timer) return;
    timer = setTimeout(saveGame, delay == null ? 600 : delay);
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== VERSION) return null;
      return merge(defaultState(), data);
    } catch (e) {
      console.warn('[save] load failed', e);
      return null;
    }
  }

  function resetGame() {
    if (timer) { clearTimeout(timer); timer = null; }
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    BI.state = defaultState();
    return BI.state;
  }

  function hasSave() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }

  BI.Save = { KEY, defaultState, saveGame, scheduleSave, loadGame, resetGame, hasSave };
  window.saveGame = saveGame;
  window.loadGame = loadGame;
  window.resetGame = resetGame;
})();
