/* Crafting: stations (sawmill, stone workbench, furnace, ...) turn raw resources into materials.
   Each station has a queue of jobs; jobs run one after another in real time (also while the game is closed).
   A job = recipe x n. Finished goods wait in the station (b.out) until collected. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  function def(b) { return BI.Buildings.DEFS[b.type]; }
  function jobs(b) { return b.jobs || (b.jobs = []); }

  function times(obj, n) {
    const o = {};
    Object.keys(obj).forEach((k) => { o[k] = obj[k] * n; });
    return o;
  }

  const Crafting = {
    isStation(b) { return !!def(b).station; },
    recipe(b, i) { return def(b).recipes[i]; },
    slots(b) { return def(b).slots || 2; },
    queueFull(b) { return jobs(b).length >= this.slots(b); },

    /** How many times the recipe can be afforded right now (capped). */
    maxCraftable(b, i, cap) {
      const r = this.recipe(b, i), res = BI.state.res;
      let n = cap || 99;
      Object.keys(r.in).forEach((k) => { n = Math.min(n, Math.floor(res[k] / r.in[k])); });
      return Math.max(0, n);
    },

    /** Queue a job. Returns an error string or null. */
    start(b, i, n, now) {
      if (this.queueFull(b)) return 'Queue is full';
      const r = this.recipe(b, i);
      if (this.maxCraftable(b, i, n) < n) return 'Not enough resources';
      BI.Game.pay(times(r.in, n));
      const q = jobs(b);
      const last = q[q.length - 1];
      const start = Math.max(now, last ? last.end : now);
      q.push({ r: i, n, start, end: start + r.time * n * 1000 });
      return null;
    },

    /** Move finished jobs into the station's output. Returns finished jobs (for stats/FX). */
    update(b, now) {
      const q = b.jobs;
      if (!q || !q.length || q[0].end > now) return null;
      const done = [];
      while (q.length && q[0].end <= now) {
        const j = q.shift();
        const r = this.recipe(b, j.r);
        b.out = b.out || {};
        Object.keys(r.out).forEach((k) => { b.out[k] = (b.out[k] || 0) + r.out[k] * j.n; });
        done.push({ recipe: r, n: j.n });
      }
      return done;
    },

    hasOutput(b) {
      return !!b.out && Object.keys(b.out).some((k) => b.out[k] > 0);
    },
    takeOutput(b) {
      const o = b.out || {};
      b.out = {};
      return o;
    },

    /** The running job (or null) and its progress 0..1. */
    active(b, now) {
      const q = b.jobs;
      if (!q || !q.length) return null;
      const j = q[0];
      if (j.start > now) return null;
      return { job: j, recipe: this.recipe(b, j.r), p: Math.min(1, (now - j.start) / (j.end - j.start)), left: Math.max(0, j.end - now) };
    },

    times,
  };

  BI.Crafting = Crafting;
})();
