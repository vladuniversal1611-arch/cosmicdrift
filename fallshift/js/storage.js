/* FALLSHIFT — namespace, math utilities and the localStorage save system. */
(function () {
  'use strict';
  const FS = (window.FS = window.FS || {});

  // ---------------------------------------------------------------- utils
  const TAU = Math.PI * 2;
  const rgbaCache = new Map();

  FS.U = {
    TAU,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    // wrap angle to [0, TAU)
    wrap(a) {
      a %= TAU;
      return a < 0 ? a + TAU : a;
    },
    // shortest signed difference a-b in (-PI, PI]
    angDiff(a, b) {
      let d = (a - b) % TAU;
      if (d > Math.PI) d -= TAU;
      else if (d <= -Math.PI) d += TAU;
      return d;
    },
    // deterministic PRNG
    mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    hash2(a, b) {
      let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    },
    randInt: (rng, a, b) => a + Math.floor(rng() * (b - a + 1)),
    pick: (rng, arr) => arr[Math.floor(rng() * arr.length)],
    shuffle(rng, arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    },
    // '#rrggbb' -> 'rgba(r,g,b,a)' (cached)
    rgba(hex, a) {
      const key = hex + a;
      let v = rgbaCache.get(key);
      if (v) return v;
      const n = parseInt(hex.slice(1), 16);
      v = 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
      if (rgbaCache.size < 4000) rgbaCache.set(key, v);
      return v;
    },
    // mix two hex colors -> hex
    mix(h1, h2, t) {
      const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
      const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
      const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
      const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
      return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
    },
    fmt(n) {
      return Math.floor(n).toLocaleString('en-US');
    },
    hslHex(h, s, l) {
      s /= 100; l /= 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
      return '#' + ((1 << 24) | (f(0) << 16) | (f(8) << 8) | f(4)).toString(16).slice(1);
    },
  };

  // ---------------------------------------------------------------- storage
  const KEY = 'fallshift_save_v1';

  function defaults() {
    return {
      version: 1,
      coins: 0,
      crystals: 0,
      bestScore: 0,
      bestDepth: 0,
      bestFloor: 0,
      permanentUpgrades: { energy: 0, dash: 0, shield: 0, magnet: 0, break: 0, combo: 0 },
      unlockedWorlds: 1,
      unlockedSkins: ['cyan'],
      skin: 'cyan',
      settings: { shake: true, hq: true, sensitivity: 1 },
      sound: true,
      music: true,
      tutorialDone: false,
      stats: { runs: 0, dashes: 0, gravities: 0, breaks: 0, blocks: 0, fevers: 0, bossKills: 0, totalCoins: 0, bestCombo: 0, bestRunCoins: 0 },
      missionsClaimed: [],
    };
  }

  function merge(base, src) {
    if (!src || typeof src !== 'object') return base;
    for (const k of Object.keys(base)) {
      if (!(k in src)) continue;
      const bv = base[k], sv = src[k];
      if (bv && typeof bv === 'object' && !Array.isArray(bv)) base[k] = merge(bv, sv);
      else if (Array.isArray(bv)) base[k] = Array.isArray(sv) ? sv.slice() : bv;
      else if (typeof sv === typeof bv) base[k] = sv;
    }
    return base;
  }

  let memoryFallback = null;

  FS.Storage = {
    data: defaults(),
    available: true,
    load() {
      let raw = null;
      try {
        raw = window.localStorage.getItem(KEY);
      } catch (e) {
        this.available = false;
        raw = memoryFallback;
      }
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (e) {
        parsed = null;
      }
      this.data = merge(defaults(), parsed);
      return this.data;
    },
    save() {
      const raw = JSON.stringify(this.data);
      try {
        window.localStorage.setItem(KEY, raw);
      } catch (e) {
        this.available = false;
        memoryFallback = raw;
      }
    },
    reset() {
      this.data = defaults();
      try {
        window.localStorage.removeItem(KEY);
      } catch (e) { /* ignore */ }
      this.save();
    },
    defaults,
  };
})();
