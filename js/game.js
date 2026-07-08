/* Tiny Kingdom — ядро гри: стан, економіка, збереження, офлайн-прогрес,
   експедиції, події, квести, досягнення. */
'use strict';

const SAVE_KEY = 'tinyKingdomSave_v1';
const COLS = 6, ROWS = 9;
const OFFLINE_CAP_H = 12;          // максимум офлайн-накопичення, годин
const TAP_CD = 60;                 // кулдаун збору бонусу з будівлі, сек
const CITIZEN_ARRIVE_S = 45;       // як часто перевіряти прибуття нового жителя
const FOOD_UPKEEP = 0.02;          // споживання їжі одним жителем за секунду

const ACH_LIST = buildAchievements();

const Game = {
  S: null,
  achTimer: 0, arriveTimer: 0, saveTimer: 0,

  /* ---------------- створення / збереження ---------------- */
  newState() {
    const now = Date.now();
    const plots = [];
    for (let i = 0; i < COLS * ROWS; i++) plots.push({ b: null, lvl: 0, until: 0, target: 0, tapAt: 0 });
    const S = {
      v: 1,
      res: { gold: 60, wood: 60, stone: 0, food: 40, crystal: 3, mcrystal: 0, relic: 0, medal: 0 },
      plots,
      citizens: [ this.mkCitizen('lumberjack'), this.mkCitizen('farmer') ],
      research: {},
      zones: ['forest'],
      exps: [],
      col: {},
      ach: {},
      quests: null,
      stats: {},
      event: null,
      nextEventAt: now + 90 * 1000,
      lastSeen: now, created: now,
      settings: { sfx: 1, music: 1 },
      skin: 0, skinsOwned: [0],
      builders: 1, offlineX2: false,
      tutorial: 0,
      crowns: 0, prestiges: 0,
      story: 0,
    };
    // стартові будівлі: будинок + лісопилка
    S.plots[this.pi(2, 4)] = { b: 'house', lvl: 1, until: 0, target: 0, tapAt: 0 };
    S.plots[this.pi(3, 4)] = { b: 'sawmill', lvl: 1, until: 0, target: 0, tapAt: 0 };
    return S;
  },
  mkCitizen(job) {
    return { n: NAMES[Math.floor(Math.random() * NAMES.length)], job: job || 'idle', lvl: 1 };
  },
  pi(c, r) { return r * COLS + c; },

  init() {
    let loaded = null;
    try { loaded = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { loaded = null; }
    this.S = loaded && loaded.v === 1 ? loaded : this.newState();
    this.migrate();
    this.ensureQuests();
    if (loaded) this.applyOffline();
    this.S.lastSeen = Date.now();
    this.save();
  },
  /* доповнюємо старі збереження новими полями */
  migrate() {
    const S = this.S;
    if (S.crowns === undefined) S.crowns = 0;
    if (S.prestiges === undefined) S.prestiges = 0;
    if (S.story === undefined) {
      S.story = 0;
      // старе збереження з прогресом: тихо зараховуємо вже прожиті розділи
      if (this.kl() > 3) {
        const ctx = { g: this, st: S.stats };
        let done = 0;
        while (S.story < STORY.length) {
          let ok = false;
          try { ok = STORY[S.story].cond(ctx); } catch (e) {}
          if (!ok) break;
          for (const [r, v] of Object.entries(STORY[S.story].reward || {})) this.addRes(r, v);
          S.story++; done++;
        }
        if (done && typeof UI !== 'undefined') UI.toast(`📖 Сюжет додано! Розділів зараховано: ${done}, нагороди нараховано.`);
      }
    }
  },
  save() {
    this.S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.S)); } catch (e) {}
  },
  reset() { localStorage.removeItem(SAVE_KEY); location.reload(); },

  /* ---------------- довідкові величини ---------------- */
  stat(k, d) { this.S.stats[k] = (this.S.stats[k] || 0) + (d === undefined ? 1 : d); },
  buildingCount(t) { return this.S.plots.filter(p => p.b === t && p.lvl > 0).length; },
  typeLevel(t) { return this.S.plots.reduce((s, p) => s + (p.b === t ? p.lvl : 0), 0); },
  typeMaxLevel(t) { return this.S.plots.reduce((m, p) => Math.max(m, p.b === t ? p.lvl : 0), 0); },
  kl() { return this.S.plots.reduce((s, p) => s + p.lvl, 0); },
  castleLvl() { return this.typeLevel('castle'); },
  pop() { return this.S.citizens.length; },
  popCap() {
    let cap = 2;
    for (const p of this.S.plots) if (p.lvl > 0 && BUILDINGS[p.b].pop) cap += BUILDINGS[p.b].pop * p.lvl;
    return cap;
  },
  beauty() {
    let b = this.S.plots.reduce((s, p) => s + (p.lvl > 0 ? (BUILDINGS[p.b].beauty || 0) * p.lvl : 0), 0);
    for (const [cid, c] of Object.entries(COLLECTIONS))
      if (c.stat === 'beauty') {
        const owned = (this.S.col[cid] || []).length;
        b += owned * c.per + (owned === c.items.length ? c.setBonus : 0);
      }
    return Math.round(b);
  },
  storageCap() {
    const lv = this.typeLevel('warehouse');
    const r = 1 + 0.2 * (this.S.research.logistics || 0);
    return Math.floor((300 + 400 * lv) * r);
  },
  zoneUnlocked(z) { return this.S.zones.includes(z); },
  colCount() { return Object.values(this.S.col).reduce((s, a) => s + a.length, 0); },
  colSetsDone() {
    return Object.entries(COLLECTIONS).filter(([id, c]) => (this.S.col[id] || []).length >= c.items.length).length;
  },
  jobCounts() {
    const j = {};
    this.S.citizens.forEach(c => { j[c.job] = (j[c.job] || 0) + 1; });
    return j;
  },
  jobLevels(job) { return this.S.citizens.filter(c => c.job === job).reduce((s, c) => s + c.lvl, 0); },
  jobUnlocked(job) {
    const J = JOBS[job];
    if (J.b && this.buildingCount(J.b) > 0) return true;
    if (J.unlockB && this.buildingCount(J.unlockB) > 0) return true;
    return false;
  },
  busyCitizens() { return this.S.exps.reduce((s, e) => s + (e.done ? 0 : e.party), 0); },

  /* множник виробництва для ресурсу */
  mult(res) {
    const S = this.S;
    const RES_TECH = { gold: 'economics', wood: 'carpentry', food: 'agriculture', stone: 'masonry', crystal: 'magicstudy' };
    let m = 1;
    if (RES_TECH[res]) m += 0.10 * (S.research[RES_TECH[res]] || 0);
    m += 0.05 * (S.research.automation || 0);
    m += CROWN_BONUS * (S.crowns || 0);
    m += 0.05 * this.castleLvl() + 0.02 * this.typeLevel('palace');
    if (res === 'gold') m += 0.04 * this.typeLevel('bank');
    for (const z of S.zones) {
      const bz = ZONES[z].bonus;
      m += (bz[res] || 0) + (bz.all || 0);
    }
    for (const [cid, c] of Object.entries(COLLECTIONS)) {
      if (c.stat !== res && c.stat !== 'all') continue;
      const owned = (S.col[cid] || []).length;
      m += owned * c.per + (owned === c.items.length ? c.setBonus : 0);
    }
    if (S.event && S.event.id === 'harvest' && res === 'food') m *= 2;
    return m;
  },
  /* ефективність робітників для типу будівлі */
  staffMult(t) {
    const job = BUILDINGS[t].job;
    if (!job) return 1;
    const need = this.buildingCount(t);
    if (!need) return 1;
    const have = Math.min((this.jobCounts()[job] || 0), need);
    const lvls = Math.min(this.jobLevels(job), need * 10);
    const eduB = 1 + 0.05 * (this.S.research.education || 0);
    return (0.4 + 0.6 * (have / need) + 0.05 * Math.max(0, lvls - have)) * eduB;
  },
  /* виробництво за секунду (без урахування споживання їжі) */
  prodPerSec() {
    const out = { gold: 0, wood: 0, stone: 0, food: 0, crystal: 0, mcrystal: 0, relic: 0, medal: 0 };
    for (const p of this.S.plots) {
      if (p.lvl <= 0 || !p.b) continue;
      const B = BUILDINGS[p.b];
      if (!B.prod) continue;
      const sm = this.staffMult(p.b);
      for (const [r, v] of Object.entries(B.prod)) out[r] += v * lvlProdMult(p.lvl) * sm * this.mult(r);
    }
    return out;
  },
  foodUpkeep() { return this.pop() * FOOD_UPKEEP; },

  buildTimeMult() {
    const arch = this.jobCounts().architect || 0;
    return Math.max(0.25, (1 - 0.08 * (this.S.research.fastbuild || 0)) * Math.pow(0.95, arch));
  },
  buildCostMult() { return 1 - 0.03 * (this.S.research.architecture || 0); },

  costOf(t, lvl) { // вартість будівництва рівня lvl (1 = нова будівля)
    const out = {};
    const cm = Math.pow(COST_MULT, lvl - 1) * this.buildCostMult();
    for (const [r, v] of Object.entries(BUILDINGS[t].cost)) out[r] = Math.ceil(v * cm);
    return out;
  },
  timeOf(t, lvl) { return BUILDINGS[t].time * Math.pow(TIME_MULT, lvl - 1) * this.buildTimeMult(); },

  canAfford(cost) { return Object.entries(cost).every(([r, v]) => this.S.res[r] >= v); },
  pay(cost) { for (const [r, v] of Object.entries(cost)) this.S.res[r] -= v; },
  addRes(r, v, silent) {
    if (v <= 0) return 0;
    const S = this.S;
    let cap = Infinity;
    if (RES_META[r].capped) cap = this.storageCap();
    const before = S.res[r];
    // якщо запас вже понад місткість (наприклад, знесли склад) — не зрізаємо його
    S.res[r] = Math.max(before, Math.min(cap, before + v));
    const got = S.res[r] - before;
    if (got > 0) this.stat('got_' + r, got);
    return got;
  },

  buildingUnlocked(t) {
    const u = BUILDINGS[t].unlock;
    if (u.kl !== undefined && this.kl() < u.kl) return false;
    if (u.castle !== undefined && this.castleLvl() < u.castle) return false;
    if (u.zone && !this.zoneUnlocked(u.zone)) return false;
    return true;
  },
  buildersBusy() { return this.S.plots.filter(p => p.until > 0).length; },

  buildAt(i, t) {
    const p = this.S.plots[i];
    if (p.b || p.until) return 'Ділянка зайнята';
    if (!this.buildingUnlocked(t)) return 'Ще не відкрито';
    if (this.buildingCount(t) + this.S.plots.filter(q => q.b === t && q.lvl === 0).length >= BUILDINGS[t].max) return 'Досягнуто ліміту';
    if (this.buildersBusy() >= this.S.builders) return 'Всі будівельники зайняті';
    const cost = this.costOf(t, 1);
    if (!this.canAfford(cost)) return 'Недостатньо ресурсів';
    this.pay(cost);
    p.b = t; p.lvl = 0; p.target = 1;
    p.until = Date.now() + this.timeOf(t, 1) * 1000;
    A.sfx('build');
    return null;
  },
  upgrade(i) {
    const p = this.S.plots[i];
    if (!p.b || p.until || p.lvl >= MAX_LVL) return 'Неможливо';
    if (this.buildersBusy() >= this.S.builders) return 'Всі будівельники зайняті';
    const cost = this.costOf(p.b, p.lvl + 1);
    if (!this.canAfford(cost)) return 'Недостатньо ресурсів';
    this.pay(cost);
    p.target = p.lvl + 1;
    p.until = Date.now() + this.timeOf(p.b, p.lvl + 1) * 1000;
    A.sfx('build');
    return null;
  },
  speedUpCost(p) { return Math.max(1, Math.ceil((p.until - Date.now()) / 1000 / 30)); },
  speedUp(i) {
    const p = this.S.plots[i];
    if (!p.until) return 'Нічого прискорювати';
    const c = this.speedUpCost(p);
    if (this.S.res.crystal < c) return 'Недостатньо кристалів';
    this.S.res.crystal -= c;
    p.until = Date.now() - 1;
    return null;
  },
  demolish(i) {
    const p = this.S.plots[i];
    if (!p.b || p.until) return 'Неможливо';
    if (p.b === 'castle' || p.b === 'palace') return 'Цю будівлю не можна знести';
    this.S.plots[i] = { b: null, lvl: 0, until: 0, target: 0, tapAt: 0 };
    return null;
  },
  /* чи дає будівля відчутний тап-бонус (медалі надто дрібні для збору) */
  tappable(t) {
    const B = BUILDINGS[t];
    return !!B.prod && Object.keys(B.prod).some(r => r !== 'medal');
  },
  /* збір бонусу з будівлі (тап): +30 секунд її виробництва */
  collect(i) {
    const p = this.S.plots[i];
    if (!p.b || p.lvl <= 0 || !this.tappable(p.b)) return null;
    const B = BUILDINGS[p.b];
    const now = Date.now();
    if (now - p.tapAt < TAP_CD * 1000) return null;
    const got = {};
    const sm = this.staffMult(p.b);
    for (const [r, v] of Object.entries(B.prod)) {
      if (r === 'medal') continue;
      const amt = v * lvlProdMult(p.lvl) * sm * this.mult(r) * 30;
      if (amt >= 0.5) got[r] = this.addRes(r, amt);
    }
    if (!Object.keys(got).length) return null; // не палимо кулдаун намарно (склад повний тощо)
    p.tapAt = now;
    this.stat('taps');
    A.sfx('collect');
    return got;
  },

  /* ---------------- жителі ---------------- */
  setJob(idx, job) {
    const c = this.S.citizens[idx];
    if (!c || (job !== 'idle' && !this.jobUnlocked(job))) return;
    c.job = job;
  },
  autoAssign(c) {
    // призначаємо професію з найгіршим заповненням серед відкритих
    let best = 'idle', bestRatio = 1;
    const jc = this.jobCounts();
    for (const [job, J] of Object.entries(JOBS)) {
      if (!this.jobUnlocked(job) || !J.b) continue;
      const need = this.buildingCount(J.b);
      if (!need) continue;
      const ratio = (jc[job] || 0) / need;
      if (ratio < bestRatio) { bestRatio = ratio; best = job; }
    }
    c.job = best;
  },
  trainCost(c) { return { food: 40 * c.lvl, gold: 25 * c.lvl }; },
  train(idx) {
    const c = this.S.citizens[idx];
    if (!c || c.lvl >= 10) return 'Максимальний рівень';
    if (!this.buildingCount('academy')) return 'Потрібна Академія';
    const cost = this.trainCost(c);
    if (!this.canAfford(cost)) return 'Недостатньо ресурсів';
    this.pay(cost);
    c.lvl++;
    this.stat('trained');
    A.sfx('collect');
    return null;
  },

  /* ---------------- зони ---------------- */
  unlockZone(z) {
    const Z = ZONES[z];
    if (this.zoneUnlocked(z)) return 'Вже відкрито';
    if (this.castleLvl() < Z.req) return `Потрібен Замок ${Z.req} рівня`;
    if (Z.cost && !this.canAfford(Z.cost)) return 'Недостатньо ресурсів';
    if (Z.cost) this.pay(Z.cost);
    this.S.zones.push(z);
    this.stat('zones');
    A.sfx('ach');
    return null;
  },

  /* ---------------- експедиції ---------------- */
  expTimeMult() { return Math.max(0.5, 1 - 0.04 * this.typeLevel('port')); },
  expLootMult() { return (1 + 0.04 * this.typeLevel('port')) * (1 + 0.10 * (this.S.research.gear || 0)); },
  freeCitizens() { return this.pop() - this.busyCitizens(); },
  startExpedition(z, durIdx, party) {
    if (!this.zoneUnlocked(z)) return 'Зона не відкрита';
    party = Math.max(1, Math.min(3, party | 0));
    if (this.freeCitizens() < party) return 'Недостатньо вільних жителів';
    if (this.S.exps.filter(e => !e.done).length >= 3) return 'Забагато експедицій одночасно';
    const d = EXP_DURATIONS[durIdx];
    this.S.exps.push({ zone: z, durIdx, party, end: Date.now() + d.sec * this.expTimeMult() * 1000, done: false });
    A.sfx('click');
    return null;
  },
  rollExpeditionLoot(e) {
    const Z = ZONES[e.zone], d = EXP_DURATIONS[e.durIdx];
    const power = Z.tier * d.mult * e.party * this.expLootMult();
    const loot = { gold: Math.round((20 + Math.random() * 20) * power) };
    const resPool = ['wood', 'stone', 'food'];
    const r = resPool[Math.floor(Math.random() * resPool.length)];
    loot[r] = Math.round((15 + Math.random() * 15) * power);
    if (Math.random() < 0.25 + 0.05 * Z.tier) loot.crystal = Math.max(1, Math.round(power * 0.4));
    if (Z.tier >= 4 && Math.random() < 0.06 * Z.tier * (d.mult > 1 ? 1.5 : 1)) loot.relic = 1;
    if (Z.tier >= 5 && Math.random() < 0.05 * Z.tier) loot.mcrystal = 1;
    const extras = [];
    if (Math.random() < 0.12 + 0.03 * Z.tier) { const it = this.grantItem(); if (it) extras.push(it); }
    if (Math.random() < 0.08 && this.pop() < this.popCap()) {
      const c = this.mkCitizen(); this.autoAssign(c); this.S.citizens.push(c);
      extras.push({ kind: 'citizen', text: `Новий житель: ${c.n}!` });
    }
    return { loot, extras };
  },
  claimExpedition(idx) {
    const e = this.S.exps[idx];
    if (!e || Date.now() < e.end) return null;
    const result = this.rollExpeditionLoot(e);
    for (const [r, v] of Object.entries(result.loot)) result.loot[r] = this.addRes(r, v);
    this.S.exps.splice(idx, 1);
    this.stat('exps');
    A.sfx('ach');
    return result;
  },

  /* ---------------- колекції ---------------- */
  grantItem() {
    // випадковий предмет, якого ще немає
    const missing = [];
    for (const [cid, c] of Object.entries(COLLECTIONS)) {
      const owned = this.S.col[cid] || [];
      c.items.forEach((name, i) => { if (!owned.includes(i)) missing.push({ cid, i, name, icon: c.icon }); });
    }
    if (!missing.length) return null;
    const m = missing[Math.floor(Math.random() * missing.length)];
    (this.S.col[m.cid] = this.S.col[m.cid] || []).push(m.i);
    return { kind: 'item', text: `${m.icon} ${m.name}`, cid: m.cid };
  },

  /* ---------------- події ---------------- */
  pickEvent() {
    const pool = Object.entries(EVENTS).filter(([id]) => id !== 'tournament' || (this.jobCounts().knight || 0) > 0);
    const total = pool.reduce((s, [, e]) => s + e.w, 0);
    let r = Math.random() * total;
    for (const [id, e] of pool) { r -= e.w; if (r <= 0) return id; }
    return pool[0][0];
  },
  maybeStartEvent() {
    const S = this.S, now = Date.now();
    if (S.event || now < S.nextEventAt) return;
    const id = this.pickEvent();
    S.event = { id, end: now + (EVENTS[id].dur || 75) * 1000, data: this.eventData(id) };
    UI.eventBanner();
    A.sfx('event');
  },
  eventData(id) {
    const kl = this.kl();
    if (id === 'caravan') {
      const amount = Math.round(80 + kl * 6);
      const r = ['wood', 'stone', 'food'][Math.floor(Math.random() * (this.zoneUnlocked('mountains') ? 3 : 2))];
      const tradeB = 1 + 0.15 * (this.S.research.trade || 0);
      return { r, amount, buyGold: Math.round(amount * 0.9 / tradeB), sellGold: Math.round(amount * 0.65 * tradeB) };
    }
    if (id === 'goblins') return { n: 2 + Math.floor(kl / 12) };
    if (id === 'treasure') return { gold: Math.round(60 + kl * 8) };
    if (id === 'portal') return { crystal: 3 + Math.floor(kl / 15) };
    if (id === 'tournament') return { medal: 1, gold: Math.round(100 + kl * 10) };
    return {};
  },
  finishEvent() {
    this.S.event = null;
    this.S.nextEventAt = Date.now() + (240 + Math.random() * 240) * 1000;
  },
  /* повертає html-результат для модалки */
  resolveEvent(action) {
    const S = this.S, ev = S.event;
    if (!ev) return null;
    const d = ev.data;
    let out = '';
    const id = ev.id;
    if (id === 'caravan') {
      if (action === 'buy') {
        if (S.res.gold < d.buyGold) return { err: 'Недостатньо золота' };
        if (S.res[d.r] + d.amount > this.storageCap()) return { err: 'Недостатньо місця на складі' };
        S.res.gold -= d.buyGold; this.addRes(d.r, d.amount);
        out = `Куплено ${RES_META[d.r].icon}${fmt(d.amount)} за 🪙${fmt(d.buyGold)}`;
      } else if (action === 'sell') {
        if (S.res[d.r] < d.amount) return { err: 'Недостатньо ' + RES_META[d.r].name };
        S.res[d.r] -= d.amount; this.addRes('gold', d.sellGold);
        out = `Продано ${RES_META[d.r].icon}${fmt(d.amount)} за 🪙${fmt(d.sellGold)}`;
      } else out = 'Караван рушив далі.';
    } else if (id === 'harvest') {
      out = 'Свято триває — їжа виробляється вдвічі швидше!';
      this.stat('events');
      return { text: out, keep: true }; // бафф триває до ev.end
    } else if (id === 'goblins') {
      if (action === 'mercs') {
        if (S.res.crystal < 2) return { err: 'Недостатньо кристалів' };
        S.res.crystal -= 2;
        const g = Math.round(30 + this.kl() * 4); this.addRes('gold', g);
        out = `Найманці розігнали гоблінів! Трофеї: 🪙${fmt(g)}`;
      } else {
        // міні-гра: тапай гоблінів на карті
        this.stat('events');
        this.finishEvent();
        this.startGoblinFight(d.n);
        return { minigame: true };
      }
    } else if (id === 'treasure') {
      this.addRes('gold', d.gold);
      out = `У скрині: 🪙${fmt(d.gold)}`;
      if (Math.random() < 0.35) { const it = this.grantItem(); if (it) out += `<br>Знахідка: ${it.text}`; }
    } else if (id === 'portal') {
      this.addRes('crystal', d.crystal);
      out = `З порталу випало 💎${d.crystal}!`;
      if (Math.random() < 0.2) { this.addRes('mcrystal', 1); out += ' І 🔮1!'; }
    } else if (id === 'tournament') {
      this.addRes('medal', d.medal); this.addRes('gold', d.gold);
      out = `Твій лицар переміг! 🎖️${d.medal} 🪙${fmt(d.gold)}`;
    }
    this.stat('events');
    this.finishEvent();
    return { text: out };
  },

  /* ---------------- дослідження ---------------- */
  researchCost(id) {
    const R = RESEARCH[id], lvl = this.S.research[id] || 0;
    const disc = 1 - 0.03 * this.typeLevel('library');
    const cost = { gold: Math.ceil(R.base * Math.pow(2.2, lvl) * disc) };
    if (R.crystal) cost.crystal = R.crystal * (lvl + 1);
    return cost;
  },
  doResearch(id) {
    const R = RESEARCH[id], lvl = this.S.research[id] || 0;
    if (lvl >= R.max) return 'Максимальний рівень';
    if (!this.buildingCount('library') && Object.values(this.S.research).reduce((a, b) => a + b, 0) >= 6)
      return 'Потрібна Бібліотека';
    const cost = this.researchCost(id);
    if (!this.canAfford(cost)) return 'Недостатньо ресурсів';
    this.pay(cost);
    this.S.research[id] = lvl + 1;
    this.stat('research');
    A.sfx('ach');
    return null;
  },

  /* ---------------- щоденні квести ---------------- */
  dayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; },
  ensureQuests() {
    const S = this.S;
    if (S.quests && S.quests.day === this.dayKey()) return;
    const picks = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 5);
    S.quests = {
      day: this.dayKey(),
      list: picks.map(t => {
        const goal = t.goals[Math.floor(Math.random() * t.goals.length)];
        return { tid: t.id, goal, base: S.stats[t.stat] || 0, claimed: false };
      }),
    };
  },
  questProg(q) {
    const t = QUEST_TEMPLATES.find(x => x.id === q.tid);
    return Math.min(q.goal, (this.S.stats[t.stat] || 0) - q.base);
  },
  claimQuest(i) {
    const q = this.S.quests.list[i];
    if (!q || q.claimed || this.questProg(q) < q.goal) return;
    q.claimed = true;
    const t = QUEST_TEMPLATES.find(x => x.id === q.tid);
    for (const [r, v] of Object.entries(t.reward)) this.addRes(r, v);
    this.stat('quests');
    A.sfx('ach');
    UI.toast(`📜 Квест виконано! +${costStr(t.reward)}`);
  },

  /* ---------------- сюжет ---------------- */
  checkStory() {
    const step = STORY[this.S.story];
    if (!step) return;
    if (UI.modalBusy && UI.modalBusy()) return; // не перебиваємо відкриті вікна
    if (this.fight) return;                     // і бій з гоблінами
    let ok = false;
    try { ok = step.cond({ g: this, st: this.S.stats }); } catch (e) {}
    if (!ok) return;
    this.S.story++;
    for (const [r, v] of Object.entries(step.reward || {})) this.addRes(r, v);
    if (UI.storyModal) UI.storyModal(step);
  },

  /* ---------------- досягнення ---------------- */
  checkAchievements() {
    const ctx = { g: this, st: this.S.stats };
    let newly = 0;
    for (const a of ACH_LIST) {
      if (this.S.ach[a.id]) continue;
      let v = 0;
      try { v = a.getter(ctx); } catch (e) { v = 0; }
      if (v >= a.v) {
        this.S.ach[a.id] = 1;
        this.addRes('crystal', a.reward);
        newly++;
        UI.toast(`🏅 Досягнення: ${a.name} (+💎${a.reward})`);
        A.sfx('ach');
      }
      if (newly >= 2) break; // не спамимо тостами
    }
  },
  achDone() { return Object.keys(this.S.ach).length; },

  /* ---------------- офлайн-прогрес ---------------- */
  applyOffline() {
    const S = this.S;
    const dt = Math.min((Date.now() - S.lastSeen) / 1000, OFFLINE_CAP_H * 3600);
    if (dt < 90) return;
    const prod = this.prodPerSec();
    prod.food = Math.max(0, prod.food - this.foodUpkeep());
    const gains = {};
    for (const [r, v] of Object.entries(prod)) {
      if (v <= 0) continue;
      const got = this.addRes(r, v * dt);
      if (got >= 1) gains[r] = got;
    }
    // завершені за час відсутності експедиції залишаються чекати гравця
    if (Object.keys(gains).length) this.offlineReport = { dt, gains };
  },
  offlineReport: null,
  doubleOffline() { // за рекламу або постійне подвоєння
    if (!this.offlineReport) return;
    for (const [r, v] of Object.entries(this.offlineReport.gains)) this.addRes(r, v);
    this.offlineReport = null;
  },

  /* ---------------- престиж «Коронація» ---------------- */
  crownsGain() {
    if (this.kl() < PRESTIGE_MIN_KL) return 0;
    return Math.max(1, Math.floor((this.kl() + this.beauty()) / 30));
  },
  doPrestige() {
    const gain = this.crownsGain();
    if (!gain) return `Потрібен рівень королівства ${PRESTIGE_MIN_KL}`;
    const S = this.S;
    S.crowns += gain;
    S.prestiges++;
    this.stat('prestiges');
    // нове королівство: лишаються корони, колекції, досягнення, статистика,
    // рідкісні ресурси, покупки та скіни
    const keep = {
      crowns: S.crowns, prestiges: S.prestiges, col: S.col, ach: S.ach, stats: S.stats,
      mcrystal: S.res.mcrystal, relic: S.res.relic, medal: S.res.medal,
      skin: S.skin, skinsOwned: S.skinsOwned, builders: S.builders, offlineX2: S.offlineX2,
      settings: S.settings, created: S.created, quests: S.quests, tutorial: 1,
    };
    this.S = this.newState();
    Object.assign(this.S, keep);
    this.S.res.mcrystal = keep.mcrystal; this.S.res.relic = keep.relic; this.S.res.medal = keep.medal;
    this.fight = null;
    if (typeof Renderer !== 'undefined') Renderer.sprites.length = 0;
    this.save();
    A.sfx('ach');
    return null;
  },

  /* ---------------- міні-гра: напад гоблінів ---------------- */
  fight: null,
  startGoblinFight(n) {
    const knights = this.jobCounts().knight || 0;
    const alive = Math.max(1, n - knights); // кожен лицар одразу зупиняє одного гобліна
    const goblins = [];
    for (let k = 0; k < alive; k++) {
      const side = Math.floor(Math.random() * 3); // зліва / справа / знизу
      goblins.push({
        x: side === 0 ? -14 : side === 1 ? WORLD_W + 14 : Math.random() * WORLD_W,
        y: side === 2 ? WORLD_H + 14 : 80 + Math.random() * (WORLD_H - 160),
        dead: 0, ph: Math.random() * 7,
      });
    }
    this.fight = { goblins, end: Date.now() + 20 * 1000, byKnights: n - alive };
    UI.toast(knights ? `🛡️ Лицарі зупинили ${n - alive} гобл. Добий решту — тапай по них!` : '👺 Тапай по гоблінах, щоб відбити напад!');
  },
  hitGoblin(idx) {
    const f = this.fight;
    if (!f || !f.goblins[idx] || f.goblins[idx].dead) return;
    f.goblins[idx].dead = Date.now();
    this.stat('goblins');
    A.sfx('collect');
    if (f.goblins.every(g => g.dead)) this.endGoblinFight(true);
  },
  updateFight(dt) {
    const f = this.fight;
    if (!f) return;
    // гобліни повзуть до центру села
    const cxm = WORLD_W / 2, cym = WORLD_H / 2;
    for (const g of f.goblins) {
      if (g.dead) continue;
      const d = Math.hypot(cxm - g.x, cym - g.y);
      if (d > 6) { g.x += (cxm - g.x) / d * 26 * dt; g.y += (cym - g.y) / d * 26 * dt; }
    }
    if (Date.now() >= f.end) this.endGoblinFight(f.goblins.every(g => g.dead));
  },
  endGoblinFight(win) {
    const f = this.fight;
    if (!f) return;
    this.fight = null;
    if (win) {
      const g = Math.round(50 + this.kl() * 5);
      this.addRes('gold', g);
      let extra = '';
      if (Math.random() < 0.25) { const it = this.grantItem(); if (it) extra = `<br>Трофей: ${it.text}`; }
      UI.modal(`<h3>🏆 Перемога!</h3><p class="big">Гоблінів розбито! +🪙${fmt(g)}${extra}</p>`);
      A.sfx('ach');
    } else {
      const S = this.S;
      const surv = 1; // хоч один утік зі здобиччю
      const lg = Math.floor(S.res.gold * 0.06), lw = Math.floor(S.res.wood * 0.06);
      S.res.gold -= lg; S.res.wood -= lw;
      UI.modal(`<h3>👺 Гобліни втекли!</h3><p>Вони поцупили 🪙${fmt(lg)} та 🪵${fmt(lw)}. Найми більше лицарів!</p>`);
    }
  },

  /* ---------------- експорт / імпорт збереження ---------------- */
  exportSave() {
    this.save();
    return btoa(unescape(encodeURIComponent(JSON.stringify(this.S))));
  },
  importSave(code) {
    try {
      const S = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!S || S.v !== 1 || !Array.isArray(S.plots)) return 'Це не схоже на код збереження';
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
      location.reload();
      return null;
    } catch (e) { return 'Не вдалося прочитати код'; }
  },

  /* ---------------- крамниця ---------------- */
  buySkin(id) {
    const sk = SKINS[id], S = this.S;
    if (S.skinsOwned.includes(id)) { S.skin = id; return null; }
    if (!this.canAfford(sk.cost)) return 'Недостатньо ресурсів';
    this.pay(sk.cost);
    S.skinsOwned.push(id); S.skin = id;
    A.sfx('ach');
    return null;
  },
  buyBuilder() {
    if (this.S.builders >= 2) return 'Вже придбано';
    if (this.S.res.crystal < 50) return 'Недостатньо кристалів';
    this.S.res.crystal -= 50; this.S.builders = 2;
    A.sfx('ach');
    return null;
  },
  buyOfflineX2() {
    if (this.S.offlineX2) return 'Вже придбано';
    if (this.S.res.medal < 20) return 'Недостатньо медалей';
    this.S.res.medal -= 20; this.S.offlineX2 = true;
    A.sfx('ach');
    return null;
  },

  /* ---------------- головний тік ---------------- */
  update(dt) {
    const S = this.S, now = Date.now();
    // виробництво
    const prod = this.prodPerSec();
    for (const [r, v] of Object.entries(prod)) if (v > 0) this.addRes(r, v * dt);
    // споживання їжі
    S.res.food = Math.max(0, S.res.food - this.foodUpkeep() * dt);
    // завершення будівництва
    for (let i = 0; i < S.plots.length; i++) {
      const p = S.plots[i];
      if (p.until && now >= p.until) {
        p.lvl = p.target; p.until = 0;
        this.stat('built');
        UI.toast(`${BUILDINGS[p.b].icon} ${BUILDINGS[p.b].name} — рівень ${p.lvl}!`);
        Renderer.burst(i);
        A.sfx('done');
        UI.refreshSoon();
      }
    }
    // прибуття жителів
    this.arriveTimer += dt;
    if (this.arriveTimer >= CITIZEN_ARRIVE_S + this.pop() * 8) { // велике королівство росте повільніше
      this.arriveTimer = 0;
      const need = 25 + this.pop() * 4;
      if (this.pop() < this.popCap() && S.res.food >= need) {
        S.res.food -= Math.min(S.res.food, 10 + this.pop() * 2);
        const c = this.mkCitizen(); this.autoAssign(c); S.citizens.push(c);
        UI.toast(`👋 ${c.n} приєднується до королівства!`);
      }
    }
    // події та бій із гоблінами
    if (S.event && now > S.event.end) this.finishEvent();
    this.maybeStartEvent();
    this.updateFight(dt);
    // квести нового дня
    this.ensureQuests();
    // досягнення та сюжет
    this.achTimer += dt;
    if (this.achTimer > 2) { this.achTimer = 0; this.checkAchievements(); this.checkStory(); }
    // автозбереження
    this.saveTimer += dt;
    if (this.saveTimer > 10) { this.saveTimer = 0; this.save(); }
  },
};
