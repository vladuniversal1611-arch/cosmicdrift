/* ==========================================================================
   05_state.js — persistent progression + every meta system.

   Everything that changes the save goes through here. persist() writes to
   localStorage (debounced) and keeps a backup copy, so one corrupted write
   can never wipe a player's progress.
   ========================================================================== */
'use strict';

const State = (() => {
  const KEY = 'bubblebloom.save.v1';
  const BAK = 'bubblebloom.save.bak';
  const VERSION = 1;

  function fresh() {
    return {
      v: VERSION, created: Date.now(),
      level: 1,                     // highest unlocked level
      best: {},                     // id -> best stars
      scores: {},                   // id -> best score
      coins: 300, starBank: 0, starsLifetime: 0, starChestCount: 0,
      mats: { wood: 0, stone: 0, crystal: 0, flower: 0 },
      lives: DATA.LIVES.max, lifeTs: 0, infUntil: 0, pendingLife: false,
      boosters: { hammer: 0, bomb: 0, shuffle: 0, color: 0, rainbow: 0, fireball: 0, moves3: 0 },
      grants: {},                   // boosters already given for free
      chests: [],                   // unopened chest tiers
      restore: {},                  // objectId -> stage (0..3)
      areasDone: {},                // areaIdx -> celebrated
      chars: ['lumi'],
      creatures: {},                // creatureId -> timestamp found
      colClaimed: {},
      seen: {},                     // story keys shown
      cards: {},                    // tutorial cards shown
      features: {},                 // announced features
      daily: { last: '', claims: 0 },
      quests: { day: '', list: [], bonus: false },
      weekly: { week: '', pts: 0, claimed: [false, false, false, false] },
      stats: { levelsWon: 0, popped: 0, dropped: 0, boostersUsed: 0, starsEarned: 0, specials: 0, combos3: 0, rescued: 0 },
      skin: 'classic', skins: { classic: 1 },
      settings: { sound: 1, music: 1, vib: 1, symbols: 0, lang: I18N.detect() },
      introSeen: false,
    };
  }
  // Merge a loaded save onto defaults so fields added in updates exist.
  function migrate(raw) {
    const out = Object.assign(fresh(), raw);
    for (const k of ['mats', 'boosters', 'stats', 'settings', 'daily', 'quests', 'weekly']) out[k] = Object.assign(fresh()[k], raw[k] || {});
    out.v = VERSION;
    return out;
  }

  let s = null, timer = 0;
  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object') { try { raw = JSON.parse(localStorage.getItem(BAK)); } catch (e) { raw = null; } }
    s = raw && typeof raw === 'object' ? migrate(raw) : fresh();
    I18N.lang = s.settings.lang || 'en';
    s.pendingLife = false; // a level interrupted by closing the app counts as lost
    tickLives(); ensureQuests(); ensureWeek();
    return s;
  }
  function persist(now) {
    clearTimeout(timer);
    const write = () => { try { const j = JSON.stringify(s); localStorage.setItem(KEY, j); localStorage.setItem(BAK, j); } catch (e) { /* storage full/disabled */ } };
    if (now) write(); else timer = setTimeout(write, 250);
  }
  function reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(BAK); } catch (e) { /* ignore */ } s = fresh(); persist(true); return s; }

  // ------------------------------------------------------------ progression queries
  const areaOf = (id) => Levels.areaOf(id);
  const areaStart = (a) => a * DATA.LEVELS_PER_AREA + 1;
  const areaBoss = (a) => (a + 1) * DATA.LEVELS_PER_AREA;
  const stageOf = (id) => s.restore[id] || 0;
  function areaRestored(a) { return DATA.AREAS[a].objects.every((o) => stageOf(o.id) >= 3); }
  // An area opens after the previous boss is beaten AND the previous area is restored.
  function areaOpen(a) { return a <= 0 || ((s.best[areaBoss(a - 1)] || 0) > 0 && areaRestored(a - 1)); }
  function canPlay(id) { return id <= s.level && areaOpen(areaOf(id)); }
  function currentArea() { let a = 0; while (a + 1 < DATA.AREAS.length && areaOpen(a + 1)) a++; return a; }
  function currentLevel() { const id = Math.min(s.level, DATA.MAX_LEVEL); return canPlay(id) ? id : areaBoss(currentArea()); }
  function featureOn(f) { return (s.best[DATA.FEATURES[f]] || 0) > 0; }

  // ------------------------------------------------------------ lives
  function tickLives() {
    const now = Date.now();
    if (s.lives >= DATA.LIVES.max) { s.lifeTs = 0; return; }
    if (!s.lifeTs) s.lifeTs = now;
    const gained = Math.floor((now - s.lifeTs) / DATA.LIVES.regenMs);
    if (gained > 0) {
      s.lives = Math.min(DATA.LIVES.max, s.lives + gained);
      s.lifeTs = s.lives >= DATA.LIVES.max ? 0 : s.lifeTs + gained * DATA.LIVES.regenMs;
      persist();
    }
  }
  const infinite = () => s.infUntil > Date.now();
  function canStart() { tickLives(); return infinite() || s.lives > 0; }
  function nextLifeMs() { tickLives(); return s.lives >= DATA.LIVES.max ? 0 : Math.max(0, s.lifeTs + DATA.LIVES.regenMs - Date.now()); }
  function refillLives() { if (s.coins < DATA.LIVES.refillPrice) return false; s.coins -= DATA.LIVES.refillPrice; s.lives = DATA.LIVES.max; s.lifeTs = 0; persist(); return true; }
  // A life is taken when a level starts and refunded on a win, so closing the
  // app mid-level behaves exactly like losing (no free retries). Wins never cost a life.
  function startLevelLife() {
    if (infinite()) { s.pendingLife = false; persist(true); return; }
    tickLives();
    if (s.lives >= DATA.LIVES.max) s.lifeTs = Date.now();
    s.lives = Math.max(0, s.lives - 1); s.pendingLife = true; persist(true);
  }
  function refundLevelLife() {
    if (!s.pendingLife) return;
    s.pendingLife = false;
    s.lives = Math.min(DATA.LIVES.max, s.lives + 1);
    if (s.lives >= DATA.LIVES.max) s.lifeTs = 0;
    persist(true);
  }
  function settleLevelLife() { s.pendingLife = false; persist(true); }

  // ------------------------------------------------------------ live events
  function activeEvent(date) {
    let forced = null;
    try { forced = new URLSearchParams(location.search).get('event'); } catch (e) { forced = null; }
    if (forced) return DATA.EVENTS.find((e) => e.id === forced) || null;
    const d = date || new Date();
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    const num = (str) => { const p = str.split('-'); return +p[0] * 100 + +p[1]; };
    for (const e of DATA.EVENTS) { const a = num(e.from), b = num(e.to); if (a <= b ? (md >= a && md <= b) : (md >= a || md <= b)) return e; }
    return null;
  }
  function eventEnds(e) {
    const d = new Date(), p = e.to.split('-');
    let end = new Date(d.getFullYear(), +p[0] - 1, +p[1] + 1);
    if (end < d) end = new Date(d.getFullYear() + 1, +p[0] - 1, +p[1] + 1);
    return end - d;
  }

  // ------------------------------------------------------------ rewards
  // reward: {coins, mats:{}, boosters:{}, lifeMin, chest, matsPack, wp}
  // Returns display items [{type, id, n}].
  function grant(r, opt) {
    opt = opt || {};
    const items = [];
    const ev = opt.level ? activeEvent() : null;
    if (r.coins) { const n = ev && ev.bonus.coins ? Math.round(r.coins * ev.bonus.coins) : r.coins; s.coins += n; items.push({ type: 'coins', n }); }
    if (r.matsPack) for (const m of DATA.AREAS[currentArea()].mats) { s.mats[m] += r.matsPack; items.push({ type: 'mat', id: m, n: r.matsPack }); }
    if (r.mats) for (const m in r.mats) {
      let n = r.mats[m];
      if (ev) { if (ev.bonus.mat === m) n = Math.ceil(n * ev.bonus.mult); if (ev.bonus.allMats) n = Math.ceil(n * ev.bonus.allMats); }
      if (n > 0) { s.mats[m] += n; items.push({ type: 'mat', id: m, n }); }
    }
    if (r.boosters) for (const b in r.boosters) { s.boosters[b] = (s.boosters[b] || 0) + r.boosters[b]; items.push({ type: 'booster', id: b, n: r.boosters[b] }); }
    if (r.lifeMin) { s.infUntil = Math.max(Date.now(), s.infUntil) + r.lifeMin * 60000; items.push({ type: 'life', n: r.lifeMin }); }
    if (r.chest) { s.chests.push(r.chest); items.push({ type: 'chest', id: r.chest }); }
    if (r.wp) { addWeekly(r.wp); items.push({ type: 'wp', n: r.wp }); }
    persist();
    return items;
  }
  function openChest(tier) {
    const idx = s.chests.indexOf(tier);
    if (idx >= 0) s.chests.splice(idx, 1);
    const def = DATA.CHESTS[tier];
    const rng = U.rng((Date.now() ^ (s.starChestCount * 7919)) >>> 0);
    const r = { coins: def.coins[0] + rng.int(def.coins[1] - def.coins[0] + 1), boosters: {}, mats: {} };
    let pool = Object.keys(DATA.BOOSTERS).filter((b) => s.level >= DATA.BOOSTERS[b].unlock);
    if (!pool.length) pool = ['hammer'];
    for (let i = 0; i < def.boosters; i++) { const b = pool[rng.int(pool.length)]; r.boosters[b] = (r.boosters[b] || 0) + 1; }
    const am = DATA.AREAS[currentArea()].mats;
    r.mats[am[0]] = Math.ceil(def.mats * 0.6); r.mats[am[1]] = Math.floor(def.mats * 0.4);
    if (def.lifeMin) r.lifeMin = def.lifeMin;
    const items = grant(r);
    if (def.creature && rng() < def.creature) {
      const cand = DATA.CREATURES.filter((c) => c.area <= currentArea() && !s.creatures[c.id]);
      if (cand.length) { const c = cand[rng.int(cand.length)]; s.creatures[c.id] = Date.now(); items.push({ type: 'creature', id: c.id }); }
    }
    persist();
    return items;
  }

  // ------------------------------------------------------------ level results
  function recordWin(level, stars, score) {
    const id = level.id;
    const first = !(s.best[id] > 0);
    const prev = s.best[id] || 0;
    const gained = Math.max(0, stars - prev);
    s.best[id] = Math.max(prev, stars);
    s.scores[id] = Math.max(s.scores[id] || 0, score);
    s.starBank += gained; s.starsLifetime += gained;
    track('levelsWon', 1); track('starsEarned', stars);

    const area = DATA.AREAS[level.area];
    const reward = { mats: {} };
    if (first) {
      reward.coins = 30 + stars * 10 + (level.boss ? 150 : 0) + (level.hard ? 20 : 0);
      const units = 4 + level.area + (level.hard ? 1 : 0) + (level.boss ? 4 : 0);
      reward.mats[area.mats[0]] = Math.ceil(units * 0.55);
      reward.mats[area.mats[1]] = Math.floor(units * 0.45);
      if (level.boss) reward.chest = 'gold';
    } else {
      reward.coins = 10 + stars * 3;
      reward.mats[area.mats[0]] = 1 + Math.floor(level.area / 3);
    }
    reward.wp = 10 + stars * 5;
    const items = grant(reward, { level: true });
    if (gained) items.unshift({ type: 'stars', n: gained });

    // Star chest every 15 lifetime stars.
    const chests = [];
    while (s.starsLifetime >= (s.starChestCount + 1) * DATA.STAR_CHEST_STARS) {
      const tier = DATA.starChestTier(s.starChestCount);
      s.starChestCount++; s.chests.push(tier); chests.push(tier);
    }
    // Rescued creature joins the collection.
    let creature = null;
    if (first && level.objective.type === 'rescue') {
      for (const c of level.cells) if (c.t === 'm' && DATA.CREATURES.some((x) => x.id === c.cr) && !s.creatures[c.cr]) { creature = c.cr; break; }
      if (creature) { s.creatures[creature] = Date.now(); s.coins += 50; }
    }
    const newChars = [];
    for (const ch in DATA.CHARACTERS) if (DATA.CHARACTERS[ch].join === id && !s.chars.includes(ch)) { s.chars.push(ch); newChars.push(ch); }
    if (id >= s.level && id < DATA.MAX_LEVEL) s.level = id + 1;
    const features = [];
    for (const f in DATA.FEATURES) if (DATA.FEATURES[f] === id && !s.features[f]) { s.features[f] = 1; features.push(f); }
    const areaDone = checkAreaComplete(level.area);
    persist(true);
    return { first, stars, gained, items, chests, creature, newChars, features, areaDone };
  }
  function checkAreaComplete(a) {
    if (s.areasDone[a] || !((s.best[areaBoss(a)] || 0) > 0) || !areaRestored(a)) return false;
    s.areasDone[a] = true; s.chests.push('legendary'); persist();
    return true;
  }

  // ------------------------------------------------------------ restoration
  function objectInfo(a, i) {
    const o = DATA.AREAS[a].objects[i];
    const stage = stageOf(o.id);
    const unlocked = (s.best[o.unlock] || 0) > 0;
    const cost = stage < 3 ? DATA.stageCost(a, i, stage) : null;
    let affordable = false, missingCoins = 0;
    if (cost) {
      affordable = s.starBank >= cost.stars;
      for (const m in cost.mats) { const miss = Math.max(0, cost.mats[m] - s.mats[m]); if (miss) { affordable = false; missingCoins += miss * 60; } }
    }
    return { o, stage, unlocked, cost, affordable, missingCoins, starsOk: cost ? s.starBank >= cost.stars : true };
  }
  function build(a, i, payMissing) {
    const info = objectInfo(a, i);
    if (!info.unlocked || info.stage >= 3 || !info.starsOk) return null;
    if (!info.affordable) {
      if (!payMissing || s.coins < info.missingCoins) return null;
      s.coins -= info.missingCoins;
      for (const m in info.cost.mats) s.mats[m] = Math.max(s.mats[m], info.cost.mats[m]);
    }
    s.starBank -= info.cost.stars;
    for (const m in info.cost.mats) s.mats[m] -= info.cost.mats[m];
    s.restore[info.o.id] = info.stage + 1;
    const areaDone = checkAreaComplete(a);
    persist(true);
    return { stage: info.stage + 1, story: 'restore:' + info.o.id + ':' + (info.stage + 1), areaDone };
  }

  // ------------------------------------------------------------ daily reward
  function dailyAvailable() { return featureOn('daily') && s.daily.last !== U.dayKey(); }
  // Missing a day never resets the calendar — it just continues where you were.
  function claimDaily() {
    if (!dailyAvailable()) return null;
    const today = U.dayKey();
    const gap = s.daily.last ? U.dayDiff(s.daily.last, today) : 1;
    const idx = s.daily.claims % 7;
    s.daily.claims++; s.daily.last = today;
    return { idx, items: grant(DATA.DAILY[idx]), streakKept: gap > 1 };
  }

  // ------------------------------------------------------------ daily quests
  function ensureQuests() {
    const today = U.dayKey();
    if (s.quests.day === today && s.quests.list.length) return;
    const rng = U.rng(U.hashStr('q' + today));
    const tier = s.level < 15 ? 0 : s.level < 60 ? 1 : 2;
    const pool = rng.shuffle(DATA.QUESTS.filter((q) => (q.minLevel || 0) <= s.level));
    s.quests = { day: today, bonus: false, list: pool.slice(0, 3).map((q) => ({ id: q.id, n: q.n[tier], p: 0, done: false })) };
    persist();
  }
  function track(stat, n) {
    if (!n || n < 0) return;
    s.stats[stat] = (s.stats[stat] || 0) + n;
    ensureQuests();
    for (const q of s.quests.list) { const def = DATA.QUESTS.find((d) => d.id === q.id); if (def && def.stat === stat && !q.done) q.p = Math.min(q.n, q.p + n); }
    persist();
  }
  function claimQuest(i) {
    const q = s.quests.list[i];
    if (!q || q.done || q.p < q.n) return null;
    q.done = true;
    return grant(DATA.QUESTS.find((d) => d.id === q.id).reward);
  }
  const questBonusReady = () => !s.quests.bonus && s.quests.list.length === 3 && s.quests.list.every((q) => q.done);
  function claimQuestBonus() { if (!questBonusReady()) return null; s.quests.bonus = true; return grant({ chest: DATA.QUEST_BONUS_CHEST, wp: 50 }); }
  function questsClaimable() { ensureQuests(); return s.quests.list.filter((q) => !q.done && q.p >= q.n).length + (questBonusReady() ? 1 : 0); }

  // ------------------------------------------------------------ weekly adventure
  function ensureWeek() { const w = U.weekKey(); if (s.weekly.week !== w) { s.weekly = { week: w, pts: 0, claimed: [false, false, false, false] }; persist(); } }
  function addWeekly(n) { ensureWeek(); s.weekly.pts += n; }
  function claimWeekly(i) {
    ensureWeek();
    const m = DATA.WEEKLY[i];
    if (!m || s.weekly.claimed[i] || s.weekly.pts < m.at) return null;
    s.weekly.claimed[i] = true;
    return grant(m.reward);
  }
  function weeklyClaimable() { ensureWeek(); return DATA.WEEKLY.filter((m, i) => !s.weekly.claimed[i] && s.weekly.pts >= m.at).length; }

  // ------------------------------------------------------------ collection milestones
  const COL_MILESTONES = [{ at: 5, chest: 'silver' }, { at: 10, chest: 'gold' }, { at: 20, chest: 'magic' }, { at: 30, chest: 'legendary' }];
  const creaturesFound = () => Object.keys(s.creatures).length;
  function claimCollection(i) {
    const m = COL_MILESTONES[i];
    if (!m || s.colClaimed[i] || creaturesFound() < m.at) return null;
    s.colClaimed[i] = true;
    return grant({ chest: m.chest });
  }
  function collectionClaimable() { return COL_MILESTONES.filter((m, i) => !s.colClaimed[i] && creaturesFound() >= m.at).length; }

  // ------------------------------------------------------------ boosters & shop
  // The first time a booster becomes available the player gets free copies.
  function pendingGrants(levelId) {
    const out = [];
    for (const b in DATA.BOOSTERS) {
      if (levelId >= DATA.BOOSTERS[b].unlock && !s.grants[b]) {
        s.grants[b] = 1;
        const n = b === 'hammer' ? 3 : 2;
        s.boosters[b] = (s.boosters[b] || 0) + n;
        out.push({ id: b, n });
      }
    }
    if (out.length) persist();
    return out;
  }
  function buyBooster(b) { const p = DATA.BOOSTERS[b].price; if (s.coins < p) return false; s.coins -= p; s.boosters[b] = (s.boosters[b] || 0) + 1; persist(); return true; }
  function buySkin(id) {
    const sk = DATA.SKINS[id];
    if (!s.skins[id]) { if (s.coins < sk.price) return false; s.coins -= sk.price; s.skins[id] = 1; }
    s.skin = id; persist(); return true;
  }
  function spend(n) { if (s.coins < n) return false; s.coins -= n; persist(); return true; }
  function useBooster(b) { if ((s.boosters[b] || 0) <= 0) return false; s.boosters[b]--; track('boostersUsed', 1); persist(); return true; }

  return {
    load, persist, reset, get s() { return s; },
    areaOf, areaStart, areaBoss, areaOpen, areaRestored, canPlay, currentLevel, currentArea, featureOn, stageOf,
    tickLives, infinite, canStart, nextLifeMs, refillLives, startLevelLife, refundLevelLife, settleLevelLife,
    activeEvent, eventEnds, grant, openChest, recordWin, checkAreaComplete, objectInfo, build,
    dailyAvailable, claimDaily, ensureQuests, track, claimQuest, claimQuestBonus, questBonusReady, questsClaimable,
    ensureWeek, addWeekly, claimWeekly, weeklyClaimable, COL_MILESTONES, creaturesFound, claimCollection, collectionClaimable,
    pendingGrants, buyBooster, buySkin, spend, useBooster,
  };
})();

/* --------------------------------------------------------------------------
   Monetization — architecture only, OFF by default. No ad or purchase button
   is ever rendered unless a real provider is registered (e.g. from a
   Capacitor AdMob / Play Billing bridge) before the game boots:

     window.BubbleBloomMonetization = {
       ads: true, iap: true,
       showRewarded(placement) { return Promise<boolean> },   // true = reward earned
       showInterstitial() {},
       products: [{ sku:'coins_small', title:'1,200 coins', price:'$0.99', reward:{coins:1200} }],
       purchase(sku) { return Promise<boolean> },
     };
   Placements: 'continue' | 'double' | 'lives' | 'freeCoins'.
   -------------------------------------------------------------------------- */
const Monetization = {
  provider() { return (typeof window !== 'undefined' && window.BubbleBloomMonetization) || null; },
  adsAvailable() { const p = this.provider(); return !!(p && p.ads && typeof p.showRewarded === 'function'); },
  iapAvailable() { const p = this.provider(); return !!(p && p.iap && typeof p.purchase === 'function' && Array.isArray(p.products)); },
  async rewarded(placement) { if (!this.adsAvailable()) return false; try { return !!(await this.provider().showRewarded(placement)); } catch (e) { return false; } },
  async purchase(sku) {
    if (!this.iapAvailable()) return null;
    const p = this.provider(), prod = p.products.find((x) => x.sku === sku);
    try { if (prod && await p.purchase(sku)) return State.grant(prod.reward); } catch (e) { /* cancelled */ }
    return null;
  },
  // Interstitial policy: never before level 12, never after a loss, at most once every 4 wins.
  wins: 0,
  maybeInterstitial(levelId, won) {
    const p = this.provider();
    if (!p || !p.ads || typeof p.showInterstitial !== 'function' || levelId < 12 || !won) return;
    if (++this.wins % 4 === 0) { try { p.showInterstitial(); } catch (e) { /* ignore */ } }
  },
};
