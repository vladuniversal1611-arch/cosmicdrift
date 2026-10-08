/* Save system — localStorage. Everything lives in BI.state. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const KEY = 'lastHaven.save.v1';
  const VERSION = 1;

  function defaultState() {
    return {
      version: VERSION,
      level: 1,
      xp: 0,
      player: { hp: 100, food: 100, water: 100 },
      bag: new Array(24).fill(null),
      equip: { weapon: null, armor: null },
      base: null,            // saved shelter map objects (structures, resource timers)
      dayTime: 0.3,          // 0..1, 0.25 = morning, 0.75 = evening
      raidT: 300,            // seconds until the next horde at the shelter
      stats: { gather: {}, craft: {}, build: {}, used: {}, visits: {}, kills: 0, looted: 0, walls: 0, deaths: 0, raids: 0 },
      quests: { next: 0, gen: 0, active: [], completed: [] },
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
      if (BI.Game && BI.Game.ready) BI.Game.snapshotBase();
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
    timer = setTimeout(saveGame, delay == null ? 800 : delay);
  }
  function loadGame() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== VERSION) return null;
      return merge(defaultState(), data);
    } catch (e) {
      return null;
    }
  }
  function resetGame() {
    if (timer) { clearTimeout(timer); timer = null; }
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    BI.state = defaultState();
    return BI.state;
  }

  BI.Save = { KEY, defaultState, saveGame, scheduleSave, loadGame, resetGame };
})();
