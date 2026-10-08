/* FALLSHIFT — world themes, modifiers and the procedural floor generator.
   Every generated floor is validated so that at least one permanent safe passage down exists. */
(function () {
  'use strict';
  const FS = window.FS;
  const U = FS.U;

  // shared geometry constants (logical units, 390 = screen width)
  FS.C = {
    LW: 390,
    R_OUT: 160,
    R_IN: 62,
    COL_R: 50,
    K: 0.34, // ellipse squash of the rings (camera tilt)
    THICK: 20,
    MID: 111,
    SPACING: 130,
    CORE_R: 13,
    CORE_ANGLE: Math.PI / 2, // the core sits at the front of the tower
    CORE_SCREEN: 0.39, // core vertical position on screen (fraction of height)
    GRAVITY: 1900,
    BOUNCE: 520,
    MAX_FALL: 760,
    DASH_SPEED: 1450,
    BOSS_EVERY: 50,
    WORLD_LEN: 20,
  };

  // ---------------------------------------------------------------- worlds
  FS.WORLDS = [
    {
      name: 'NEON TOWER', sub: 'WORLD 1',
      bgTop: '#02041a', bgBot: '#0a1446', haze: '#1d3cff', skyline: '#0b1640', windows: '#3a8dff',
      column: '#0a1230', columnEdge: '#1b2c66', stripe: '#3fe6ff',
      top: '#1a2449', wall: '#0d1530', edge: '#3fe6ff', wallStripe: '#36c8ff',
      danger: '#b44dff', dangerDark: '#4a1b7a', accent: '#3fe6ff', accent2: '#8a5cff',
      ambient: 'motes', ambColors: ['#3fe6ff', '#8a5cff', '#5f8dff'],
    },
    {
      name: 'REACTOR', sub: 'WORLD 2',
      bgTop: '#0c0503', bgBot: '#2a1006', haze: '#ff6a1a', skyline: '#1f0d06', windows: '#ff8c2a',
      column: '#16100c', columnEdge: '#3a2416', stripe: '#ffb04a',
      top: '#2b2420', wall: '#17110e', edge: '#ffa53c', wallStripe: '#ff8a1f',
      danger: '#ff3d6a', dangerDark: '#6a0f26', accent: '#ffb347', accent2: '#fff1d0',
      ambient: 'embers', ambColors: ['#ff9a3c', '#ffcf6a', '#ff5a1a'],
    },
    {
      name: 'VOID', sub: 'WORLD 3',
      bgTop: '#000000', bgBot: '#0c0420', haze: '#7a2cff', skyline: '#08031a', windows: '#a35dff',
      column: '#07041a', columnEdge: '#24124a', stripe: '#b06bff',
      top: '#161029', wall: '#0a0618', edge: '#b06bff', wallStripe: '#9a4dff',
      danger: '#ff4fd8', dangerDark: '#5a0f4c', accent: '#c08bff', accent2: '#ff4fd8',
      ambient: 'stars', ambColors: ['#ffffff', '#c08bff', '#8a5cff'],
    },
    {
      name: 'CYBER CORE', sub: 'WORLD 4',
      bgTop: '#010612', bgBot: '#081a2c', haze: '#00d0ff', skyline: '#04121e', windows: '#ff2fd6',
      column: '#06121e', columnEdge: '#0f3346', stripe: '#00f0ff',
      top: '#0f1c2c', wall: '#08111c', edge: '#00f0ff', wallStripe: '#ff2fd6',
      danger: '#ff2fd6', dangerDark: '#5c0a4c', accent: '#00f0ff', accent2: '#ff2fd6',
      ambient: 'rain', ambColors: ['#00f0ff', '#ff2fd6'],
    },
    {
      name: 'COLLAPSE', sub: 'WORLD 5',
      bgTop: '#08060a', bgBot: '#26131a', haze: '#ff5a3a', skyline: '#160c10', windows: '#ff7a4a',
      column: '#141016', columnEdge: '#33222a', stripe: '#ff7a4a',
      top: '#28222a', wall: '#141016', edge: '#ff7a4a', wallStripe: '#ffb07a',
      danger: '#ff3b3b', dangerDark: '#5a1010', accent: '#ff8a5a', accent2: '#ffd0a0',
      ambient: 'debris', ambColors: ['#ff7a4a', '#ffb07a', '#8a6a7a'],
    },
  ];

  FS.MODIFIERS = {
    lowgrav: { name: 'LOW GRAVITY', desc: 'The core floats longer' },
    highspeed: { name: 'HIGH SPEED', desc: 'Falling much faster' },
    chaos: { name: 'CHAOS ROTATION', desc: 'Floors spin on their own' },
    dark: { name: 'DARK MODE', desc: 'Platforms hidden until close' },
    laser: { name: 'LASER MODE', desc: 'Lasers sweep the floors' },
    collapse: { name: 'COLLAPSE', desc: 'Platforms crumble after contact' },
  };
  const MOD_KEYS = Object.keys(FS.MODIFIERS);

  const PASSABLE = { gap: 1, portal: 1, combo: 1 };
  const SAFE_SOLID = { normal: 1, coin: 1, energy: 1, breakable: 1 };

  function worldOf(f) {
    return Math.floor(Math.max(0, f - 1) / FS.C.WORLD_LEN) % FS.WORLDS.length;
  }
  function isBoss(f) {
    return f > 0 && f % FS.C.BOSS_EVERY === 0;
  }
  function modifierOf(f, seed) {
    if (f < 30 || isBoss(f)) return null;
    const block = Math.floor(f / 10);
    if (block % 5 === 0) return null; // keep boss blocks clean
    const chance = f >= 100 ? 1 : 0.6;
    if (U.hash2(seed, block) >= chance) return null;
    return MOD_KEYS[Math.floor(U.hash2(seed + 7919, block) * MOD_KEYS.length) % MOD_KEYS.length];
  }

  function seg(type) {
    return { type, broken: false, used: false, crumble: -1, flash: 0, cr: (Math.random() * 1e6) | 0, ph: Math.random() * 6 };
  }

  function makeRing(f, n, offset) {
    return {
      floor: f, y: f * FS.C.SPACING, n, w: U.TAU / n, offset,
      spin: 0, spinSpeed: 0, segs: [], pickups: [], lasers: [], mover: null,
      world: worldOf(f), mod: null, boss: false, passed: false, hazardFree: 0,
    };
  }

  function bossRing(f, seed) {
    const r = makeRing(f, 10, 0);
    for (let i = 0; i < 10; i++) r.segs.push(seg('normal'));
    r.boss = true;
    return r;
  }

  // ---------------------------------------------------------------- generator
  function generateFloor(f, prev, seed, opts) {
    opts = opts || {};
    if (isBoss(f)) return bossRing(f, seed);
    const rng = U.mulberry32((seed ^ Math.imul(f + 1, 2654435761)) >>> 0);
    const mod = modifierOf(f, seed);
    const world = worldOf(f);
    const endless = f > 100;
    const n = f < 25 ? 10 : U.pick(rng, [8, 10, 10, 12]);
    const ring = makeRing(f, n, rng() * U.TAU);
    ring.mod = mod;
    for (let i = 0; i < n; i++) ring.segs.push(seg('normal'));
    const T = ring.segs;

    // ----- gaps (wide early, narrower later)
    const wide = f <= 12 || rng() < (f < 50 ? 0.3 : 0.18);
    const g0 = U.randInt(rng, 0, n - 1);
    T[g0].type = 'gap';
    if (wide) T[(g0 + 1) % n].type = 'gap';
    if (rng() < (f <= 25 ? 0.4 : 0.22)) {
      const g1 = (g0 + U.randInt(rng, 3, n - 3)) % n;
      if (T[g1].type === 'normal') T[g1].type = 'gap';
    }

    // ----- danger
    let danger;
    if (f <= 2) danger = 0;
    else if (f <= 10) danger = U.randInt(rng, 0, 1);
    else if (f <= 25) danger = U.randInt(rng, 1, 2);
    else if (f <= 50) danger = U.randInt(rng, 2, 3);
    else if (f <= 100) danger = U.randInt(rng, 2, 4);
    else danger = U.randInt(rng, 3, 5);
    const free = () => T.map((s, i) => (s.type === 'normal' ? i : -1)).filter((i) => i >= 0);
    let fr = U.shuffle(rng, free());
    const gaps = n - fr.length;
    danger = Math.min(danger, n - gaps - 2);
    for (let k = 0; k < danger; k++) T[fr[k]].type = 'danger';

    // ----- special platforms
    fr = U.shuffle(rng, free());
    let safeLeft = fr.length;
    const convert = (idx, type) => {
      T[idx].type = type;
    };
    for (const i of fr) {
      if (f >= 4 && rng() < 0.12 + Math.min(0.1, f * 0.002)) convert(i, 'breakable');
    }
    fr = U.shuffle(rng, free());
    if (f >= 12) {
      const pf = 0.06 + (world === 4 || endless ? 0.08 : 0);
      for (const i of fr) if (safeLeft > 3 && rng() < pf) { convert(i, 'fake'); safeLeft--; }
    }
    fr = U.shuffle(rng, free());
    if ((world >= 3 || endless) && f > 60) {
      let c = 0;
      for (const i of fr) if (safeLeft > 3 && c < 2 && rng() < 0.25) { convert(i, 'pulse'); safeLeft--; c++; }
    }
    fr = U.shuffle(rng, free());
    if (fr.length > 2 && rng() < 0.3) convert(fr.pop(), 'coin');
    if (fr.length > 2 && rng() < 0.22) convert(fr.pop(), 'energy');

    // ----- portal / combo gate (on gaps)
    const gapIdx = T.map((s, i) => (s.type === 'gap' ? i : -1)).filter((i) => i >= 0);
    const nextBoss = (Math.floor(f / FS.C.BOSS_EVERY) + 1) * FS.C.BOSS_EVERY;
    if (f >= 25 && f + 3 < nextBoss && rng() < 0.12 && gapIdx.length) {
      T[gapIdx[0]].type = 'portal';
    } else if (f >= 41 && rng() < 0.16 && gapIdx.length) {
      T[gapIdx[gapIdx.length - 1]].type = 'combo';
    }

    // ----- moving spike block (slides over a run of plain platforms)
    if (f >= 21 && rng() < 0.25 + Math.min(0.2, (f - 21) * 0.004)) {
      let best = null;
      for (let i = 0; i < n; i++) {
        if (T[i].type !== 'normal' || T[(i - 1 + n) % n].type === 'normal') continue;
        let len = 0;
        while (len < n && T[(i + len) % n].type === 'normal') len++;
        if (len >= 2 && (!best || len > best.len)) best = { i, len };
      }
      if (best) {
        const len = Math.min(best.len, 4);
        ring.mover = {
          start: best.i * ring.w, span: len * ring.w, width: ring.w * 0.75,
          speed: 1.1 + rng() * 1.1 + Math.min(1, f * 0.006), phase: rng() * U.TAU, alive: true,
        };
      }
    }

    // ----- self rotation
    const chaos = mod === 'chaos';
    if ((f >= 22 && rng() < 0.25) || (chaos && rng() < 0.8) || (endless && rng() < 0.35)) {
      ring.spinSpeed = (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.45 + Math.min(0.6, Math.max(0, f - 22) * 0.006));
    }

    // ----- lasers
    if ((f >= 45 && rng() < 0.22) || (mod === 'laser' && rng() < 0.8)) {
      const cnt = mod === 'laser' && f > 60 && rng() < 0.4 ? 2 : 1;
      for (let k = 0; k < cnt; k++) {
        const period = 2.4 + rng() * 0.9;
        ring.lasers.push({ rel: rng() * U.TAU, half: 0.11, period, on: 0.85 + rng() * 0.35, phase: rng() * period });
      }
    }

    // ----- pickups
    const lucky = opts.lucky || 0;
    for (let i = 0; i < n; i++) {
      const t = T[i].type;
      if (!PASSABLE[t]) continue;
      const c = (i + 0.5) * ring.w;
      if (rng() < 0.6 + lucky * 0.15) {
        const cnt = U.randInt(rng, 1, 3);
        for (let k = 0; k < cnt; k++) ring.pickups.push({ rel: c + (k - (cnt - 1) / 2) * 0.13, kind: 'coin', h: 26 + k * 6, taken: false });
      } else if (rng() < 0.3) {
        ring.pickups.push({ rel: c, kind: 'energy', h: 32, taken: false });
      }
      if (rng() < 0.012 + lucky * 0.02 + (f > 50 ? 0.01 : 0)) ring.pickups.push({ rel: c + 0.15, kind: 'crystal', h: 40, taken: false });
    }
    if (rng() < 0.25) {
      const plain = T.map((s, i) => (s.type === 'normal' ? i : -1)).filter((i) => i >= 0);
      if (plain.length) ring.pickups.push({ rel: (U.pick(rng, plain) + 0.5) * ring.w, kind: 'coin', h: 28, taken: false });
    }

    // ----- fairness: the floor right under the previous floor's openings is not a spike field
    if (prev && !prev.boss && (f < 60 || rng() < 0.7)) {
      for (let i = 0; i < prev.n; i++) {
        if (!PASSABLE[prev.segs[i].type]) continue;
        const abs = prev.offset + (i + 0.5) * prev.w;
        const idx = Math.floor(U.wrap(abs - ring.offset) / ring.w) % n;
        if (T[idx].type === 'danger') T[idx].type = 'normal';
      }
    }

    return validate(ring);
  }

  // Guarantee: >=1 permanent passage, >=2 safe platforms, the mover never covers a passage.
  function validate(ring) {
    if (ring.boss) return ring;
    const T = ring.segs;
    let pass = 0, safe = 0;
    for (const s of T) {
      if (PASSABLE[s.type]) pass++;
      if (SAFE_SOLID[s.type]) safe++;
    }
    if (pass === 0) {
      let idx = T.findIndex((s) => s.type !== 'danger');
      if (idx < 0) idx = 0;
      T[idx].type = 'gap';
      pass = 1;
    }
    for (let i = 0; i < T.length && safe < 2; i++) {
      if (T[i].type === 'danger' || T[i].type === 'pulse' || T[i].type === 'fake') {
        T[i].type = 'normal';
        safe++;
      }
    }
    if (ring.mover) {
      const m = ring.mover;
      const a = Math.floor(m.start / ring.w + 1e-6), b = Math.ceil((m.start + m.span) / ring.w - 1e-6);
      for (let i = a; i < b; i++) if (T[i % ring.n].type !== 'normal') { ring.mover = null; break; }
    }
    return ring;
  }

  // used by the self-test: true when a floor can always be passed
  function isPassable(ring) {
    if (ring.boss) return true;
    let pass = 0, safe = 0;
    for (const s of ring.segs) {
      if (PASSABLE[s.type]) pass++;
      if (SAFE_SOLID[s.type]) safe++;
    }
    if (!pass || safe < 2) return false;
    if (ring.mover) {
      const m = ring.mover;
      const a = Math.floor(m.start / ring.w + 1e-6), b = Math.ceil((m.start + m.span) / ring.w - 1e-6);
      for (let i = a; i < b; i++) if (ring.segs[i % ring.n].type !== 'normal') return false;
    }
    return true;
  }

  FS.LevelGen = { generateFloor, validate, isPassable, worldOf, isBoss, modifierOf, PASSABLE, SAFE_SOLID };
})();
