/* ===================================================================
 * MYSTIC ALCHEMY LAB — game.js
 * A bright, relaxing alchemy fusion puzzle. Original mechanic:
 *   "ESSENCE FUSION" — lift the top essence of one flask and fuse it
 *   onto a matching essence in another flask. Two same-tier essences
 *   evolve into ONE essence of the next tier. Reach the top tier to
 *   forge an Ancient Core. It is NOT water sort: energy EVOLVES upward
 *   (2048 x alchemy), it does not merely stack by color.
 *
 * Architecture (no external libraries, Canvas + DOM overlays):
 *   RNG          seeded deterministic randomness
 *   Storage      localStorage save/load
 *   Audio        procedural WebAudio SFX + ambient
 *   Particles    juicy particle system
 *   Worlds       handcrafted world configs + mechanics
 *   LevelGen     reverse-fusion generator (guaranteed solvable)
 *   Board        gameplay model + fusion rules + special mechanics
 *   Renderer     Canvas draw of board, flasks, essences, fx
 *   Game         scene/state machine, economy, meta, UI glue
 * =================================================================== */
(function () {
'use strict';

/* ============================ UTIL ============================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => performance.now();
const TAU = Math.PI * 2;

/* Seeded RNG (mulberry32) — deterministic per level for handcrafted feel */
class RNG {
  constructor(seed) { this.s = seed >>> 0 || 1; }
  next() { let t = this.s += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  int(n) { return Math.floor(this.next() * n); }
  pick(a) { return a[this.int(a.length)]; }
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; }
}

/* ============================ STORAGE ============================ */
const Storage = {
  KEY: 'mysticAlchemyLab.v1',
  data: null,
  fresh() {
    return {
      coins: 120, crystals: 8, dust: 30, keys: 2,
      lives: 5, lifeAt: Date.now(),
      xp: 0, plvl: 1,
      progress: {},          // "w-l" -> stars(1..3)
      boosters: { undo: 3, shuffle: 2, moves: 2, magnet: 1, clone: 1, autocomplete: 1 },
      lab: {},               // owned lab upgrades
      skins: { flask: 'default' }, ownedSkins: ['default'], avatar: '🧙',
      settings: { music: true, sound: true, vibe: true, lang: 'en' },
      missions: null, missionDay: '',
      daily: { streak: 0, lastLogin: '', lastSpin: '' },
      stats: { played: 0, won: 0, fusions: 0, cores: 0, bestCombo: 0, stars: 0 },
      achieved: {},
      seenTutorial: false, lastWorld: 0
    };
  },
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.KEY)) || this.fresh(); }
    catch (e) { this.data = this.fresh(); }
    // migrate missing keys
    const f = this.fresh();
    for (const k in f) if (!(k in this.data)) this.data[k] = f[k];
    for (const k in f.boosters) if (this.data.boosters[k] == null) this.data.boosters[k] = f.boosters[k];
    return this.data;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { } },
  reset() { this.data = this.fresh(); this.save(); }
};

/* ============================ AUDIO ============================ */
/* Procedural WebAudio — no asset files. Distinct tones per event. */
const Audio = {
  ctx: null, master: null, musicGain: null, sfxGain: null, musicTimer: null, musicOn: false,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = .8; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = .55; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = .18; this.musicGain.connect(this.master);
    } catch (e) { }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(freq, dur, type = 'sine', gain = .3, when = 0, slideTo = null) {
    if (!this.ctx || !Storage.data.settings.sound) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + .02);
  },
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'lift': this.tone(520, .12, 'triangle', .22, 0, 680); break;
      case 'move': this.tone(360, .1, 'sine', .18); break;
      case 'fuse': this.tone(440, .14, 'triangle', .26, 0, 660); this.tone(660, .16, 'sine', .16, .04, 880); break;
      case 'core': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .22, 'triangle', .22, i * .05)); break;
      case 'fail': this.tone(180, .18, 'sawtooth', .18, 0, 90); break;
      case 'combo': [660, 880, 1100].forEach((f, i) => this.tone(f, .16, 'square', .16, i * .04)); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .3, 'triangle', .24, i * .08)); break;
      case 'star': this.tone(880, .18, 'triangle', .24, 0, 1320); break;
      case 'unlock': [392, 523, 659, 880].forEach((f, i) => this.tone(f, .26, 'sine', .22, i * .07)); break;
      case 'reward': this.tone(784, .2, 'triangle', .24, 0, 1046); this.tone(1046, .24, 'sine', .16, .08); break;
      case 'button': this.tone(600, .06, 'sine', .16); break;
      case 'booster': this.tone(300, .2, 'sawtooth', .2, 0, 900); this.tone(900, .2, 'triangle', .14, .05); break;
      case 'spin': this.tone(400, .05, 'square', .1); break;
      case 'boss': [110, 138, 110].forEach((f, i) => this.tone(f, .3, 'sawtooth', .2, i * .12)); break;
    }
  },
  // simple procedural ambient pad, scale changes per world
  startMusic(scale) {
    if (!this.ctx || !Storage.data.settings.music || this.musicOn) return;
    this.musicOn = true; this.scale = scale || [261.6, 329.6, 392, 523.2, 659.3];
    const step = () => {
      if (!this.musicOn) return;
      const n = this.scale[Math.floor(Math.random() * this.scale.length)];
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = n * (Math.random() < .5 ? 1 : .5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .8);
      g.gain.linearRampToValueAtTime(0, t + 2.6);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 2.8);
      this.musicTimer = setTimeout(step, 1400 + Math.random() * 1200);
    };
    step();
  },
  stopMusic() { this.musicOn = false; clearTimeout(this.musicTimer); },
  setScale(scale) { this.scale = scale; }
};

/* ============================ PARTICLES ============================ */
class Particles {
  constructor() { this.list = []; }
  burst(x, y, color, n = 14, opt = {}) {
    const spd = opt.spd || 3, life = opt.life || 700, size = opt.size || 5, grav = opt.grav ?? .06;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (.4 + Math.random());
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opt.up || 0), life, max: life, color, size: size * (.5 + Math.random()), grav, shape: opt.shape || 'circle', rot: Math.random() * TAU, vr: (Math.random() - .5) * .3 });
    }
  }
  ring(x, y, color, r0 = 6, r1 = 60) { this.list.push({ ring: true, x, y, r: r0, r1, color, life: 420, max: 420 }); }
  star(x, y) { this.burst(x, y, '#fff', 10, { spd: 2.4, life: 600, size: 4, shape: 'star', grav: .02 }); }
  update(dt) {
    const d = dt / 16.67;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      if (p.ring) { p.r = lerp(p.r, p.r1, .12 * d); continue; }
      p.x += p.vx * d; p.y += p.vy * d; p.vy += p.grav * d; p.vx *= .99; p.rot += p.vr * d;
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const k = p.life / p.max;
      if (p.ring) {
        ctx.globalAlpha = k * .6; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; continue;
      }
      ctx.globalAlpha = k; ctx.fillStyle = p.color;
      if (p.shape === 'star') { this._star(ctx, p.x, p.y, p.size * k, p.rot); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  _star(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); const b = a + TAU / 10; ctx.lineTo(Math.cos(b) * r * .45, Math.sin(b) * r * .45); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  clear() { this.list.length = 0; }
}

/* ============================ WORLDS ============================ */
/* Each world: bright theme, an essence evolution chain (colors),
 * unlocked mechanics, ambient scale. NOT dark — summer/winter palettes. */
const WORLDS = [
  {
    id: 0, name: 'Ancient Forest', emoji: '🌳', req: 0,
    sky: ['#c8f4d0', '#eafff0', '#fff8e6'], accent: '#4fbf7a',
    chain: ['#8be86b', '#ffd24d', '#ff8a4d', '#ff5e8a'], // leaf→sun→ember→bloom
    coreColor: '#a6f0ff', mechanics: ['fuse'], scale: [329.6, 392, 493.8, 587.3, 659.3],
    subtitle: 'Where alchemy first bloomed'
  },
  {
    id: 1, name: 'Crystal Cave', emoji: '💎', req: 24,
    sky: ['#d6e6ff', '#eef4ff', '#fdf0ff'], accent: '#6f8cff',
    chain: ['#8fd0ff', '#b58bff', '#ff9be0', '#ffd166'],
    coreColor: '#fff0a6', mechanics: ['fuse', 'locked'], scale: [261.6, 311.1, 392, 466.2, 523.2],
    subtitle: 'Frozen light, locked essences'
  },
  {
    id: 2, name: 'Sky Islands', emoji: '☁️', req: 60,
    sky: ['#bfe9ff', '#e6f7ff', '#fff6ee'], accent: '#39b6ff',
    chain: ['#7fe3ff', '#7df0c9', '#ffe066', '#ff7d9c'],
    coreColor: '#c8ffe8', mechanics: ['fuse', 'locked', 'portal'], scale: [392, 440, 523.2, 587.3, 698.5],
    subtitle: 'Portals drift between the clouds'
  },
  {
    id: 3, name: 'Frozen Temple', emoji: '❄️', req: 108,
    sky: ['#dff1ff', '#f2fbff', '#ffffff'], accent: '#69c8ff',
    chain: ['#b8ecff', '#9fd0ff', '#c9b8ff', '#ffc2e2'],
    coreColor: '#e8f6ff', mechanics: ['fuse', 'locked', 'portal', 'frozen'], scale: [293.7, 349.2, 440, 523.2, 587.3],
    subtitle: 'Essences freeze — thaw them free'
  },
  {
    id: 4, name: 'Volcano Forge', emoji: '🌋', req: 156,
    sky: ['#ffe0c2', '#fff0dd', '#fff8ee'], accent: '#ff7a3c',
    chain: ['#ffd24d', '#ff9a3c', '#ff5e5e', '#ff3ca0'],
    coreColor: '#ffe08a', mechanics: ['fuse', 'locked', 'frozen', 'splitter'], scale: [220, 277.2, 329.6, 415.3, 493.8],
    subtitle: 'Splitter flasks double the heat'
  },
  {
    id: 5, name: 'Moon Laboratory', emoji: '🌙', req: 204,
    sky: ['#e2e0ff', '#f2f0ff', '#fff0fb'], accent: '#8f7dff',
    chain: ['#b8b0ff', '#8fd0ff', '#7df0c9', '#ffd6f0'],
    coreColor: '#fff', mechanics: ['fuse', 'locked', 'portal', 'splitter', 'shift'], scale: [349.2, 415.3, 523.2, 622.3, 698.5],
    subtitle: 'Colors shift under moonlight'
  },
  {
    id: 6, name: 'Dragon Observatory', emoji: '🐉', req: 252,
    sky: ['#ffe6ea', '#fff0f3', '#fff8ee'], accent: '#ff6f91',
    chain: ['#ff9bb0', '#ffcf6b', '#8be86b', '#8fd0ff'],
    coreColor: '#ffdca6', mechanics: ['fuse', 'locked', 'frozen', 'splitter', 'shift', 'slime'], scale: [261.6, 329.6, 392, 493.8, 622.3],
    subtitle: 'Living slimes covet your colors'
  },
  {
    id: 7, name: 'Void Dimension', emoji: '🌌', req: 300,
    sky: ['#e9e2ff', '#f4eeff', '#fff0f8'], accent: '#7b4dff',
    chain: ['#c2b0ff', '#8fd0ff', '#7df0c9', '#ffd166'],
    coreColor: '#ffffff', mechanics: ['fuse', 'locked', 'portal', 'frozen', 'splitter', 'shift', 'slime'], scale: [277.2, 349.2, 440, 554.4, 659.3],
    subtitle: 'Every rule bends at the edge of reality'
  }
];
const LEVELS_PER_WORLD = 40;
const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD; // 320
const DIFF_TIERS = ['Easy', 'Medium', 'Hard', 'Expert', 'Master', 'Legend'];

/* ============================ LEVEL GEN ============================ */
/* REVERSE-PLAY generator. We start from the SOLVED state (all cores already
 * forged, flasks empty) and apply the fusion rules BACKWARDS as a sequence of
 * valid inverse moves that respect the flask-stacking access model:
 *   • inverse-core : add a top-tier essence to two flasks (undoes a core forge)
 *   • inverse-fuse : turn a flask's top tier-T into tier-(T-1) and drop another
 *                    tier-(T-1) on a second flask (undoes a fusion)
 *   • inverse-move : relocate a top essence to another flask (undoes a move)
 * The forward reversal of this sequence is a guaranteed, legal solution, so
 * every generated level is ALWAYS solvable. Deterministic per (world,level). */
const LevelGen = {
  make(world, levelIdx /*0-based within world*/) {
    const globalIdx = world * LEVELS_PER_WORLD + levelIdx;
    const rng = new RNG((0x9e3779b1 ^ (globalIdx * 2654435761)) >>> 0);
    const W = WORLDS[world];
    const isBoss = (levelIdx + 1) % 10 === 0;
    const p = levelIdx / (LEVELS_PER_WORLD - 1);                 // 0..1 within world
    const tierIndex = Math.min(DIFF_TIERS.length - 1, Math.floor(world * .8 + p * 2));

    const topTier = W.chain.length - 1;                          // highest essence tier
    const capacity = 4 + (world >= 4 ? 1 : 0);
    const flaskCount = clamp(4 + Math.floor(p * 3) + Math.floor(world / 2), 4, 8);
    const coresGoal = clamp(1 + Math.floor(p * 2) + Math.floor(world / 3) + (isBoss ? 1 : 0), 1, 4);
    // how much to scramble (more = harder): drives merge-tree depth
    const scramble = 3 + Math.floor(p * 6) + world + (isBoss ? 3 : 0);

    // which mechanics appear (introduced gradually, ~every 10-15 levels overall)
    const mech = new Set();
    const avail = W.mechanics.filter(m => m !== 'fuse');
    if (levelIdx >= 2 && avail.length) {
      const count = clamp(Math.round(p * avail.length) + (isBoss ? 1 : 0), levelIdx >= 5 ? 1 : 0, avail.length);
      const pool = rng.shuffle(avail.slice());
      for (let i = 0; i < count; i++) mech.add(pool[i]);
    }

    // ---- decide special flasks up-front (portals are excluded from being
    // fusion/core receivers so the guaranteed solution never depends on them) ----
    const flaskMeta = Array.from({ length: flaskCount }, () => ({ type: 'normal' }));
    const order = rng.shuffle(flaskCount > 1 ? [...Array(flaskCount).keys()] : [0]);
    let sp = 0; let portalPair = null; const portalSet = new Set();
    if (mech.has('portal') && flaskCount >= 4) {
      const a = order[sp++], b = order[sp++];
      flaskMeta[a].type = 'portal'; flaskMeta[b].type = 'portal';
      portalPair = [a, b]; portalSet.add(a); portalSet.add(b);
    }
    if (mech.has('splitter')) { const f = order[sp++ % flaskCount]; if (flaskMeta[f].type === 'normal') flaskMeta[f].type = 'splitter'; }
    if (mech.has('shift')) { const f = order[sp++ % flaskCount]; if (flaskMeta[f].type === 'normal') flaskMeta[f].type = 'shift'; }

    // receiver = any flask that can accept a fusion/core in the guaranteed path
    const receivers = [...Array(flaskCount).keys()].filter(i => !portalSet.has(i));

    // ---- reverse-play state (arrays of integer tiers) ----
    const flasks = Array.from({ length: flaskCount }, () => []);
    const canPush = f => flasks[f].length < capacity;
    const pickRoom = (exclude = -1, pool = null) => {
      const cand = (pool || [...Array(flaskCount).keys()]).filter(f => f !== exclude && canPush(f));
      return cand.length ? rng.pick(cand) : -1;
    };
    let solLen = 0;

    // 1) inverse-core: place the essences of each goal core back onto the board
    for (let c = 0; c < coresGoal; c++) {
      const a = pickRoom(-1, receivers); if (a < 0) break;
      flasks[a].push(topTier);
      const b = pickRoom(a, receivers); if (b < 0) { flasks[a].pop(); break; }
      flasks[b].push(topTier);
      solLen++;
    }

    // 2) scramble with inverse-fuse (primary) and inverse-move (secondary)
    for (let s = 0; s < scramble; s++) {
      const doFuse = rng.next() < .72;
      if (doFuse) {
        // find a receiver whose top tier >= 1 that we can un-fuse
        const cand = receivers.filter(f => flasks[f].length && flasks[f][flasks[f].length - 1] >= 1);
        if (cand.length) {
          const b = rng.pick(cand);
          const a = pickRoom(b);                        // needs a partner with room
          if (a >= 0) {
            const t = flasks[b][flasks[b].length - 1];
            flasks[b][flasks[b].length - 1] = t - 1;    // lower B's top
            flasks[a].push(t - 1);                       // partner essence
            solLen++;
            continue;
          }
        }
      }
      // inverse-move: relocate a top essence (buries / spreads material)
      const from = [...Array(flaskCount).keys()].filter(f => flasks[f].length);
      if (from.length) {
        const b = rng.pick(from);
        const a = pickRoom(b);
        if (a >= 0) { flasks[a].push(flasks[b].pop()); solLen++; }
      }
    }

    // Guard: if degenerate (nothing placed), seed a trivial solvable board
    if (flasks.every(f => f.length === 0)) {
      flasks[0].push(topTier); flasks[1] ? flasks[1].push(topTier) : flasks[0].push(topTier); solLen = 1;
    }

    // ---- convert to essence objects, then layer mechanic flags ----
    const essences = flasks.map(st => st.map(tier => ({ tier, frozen: 0, locked: false, slime: false })));
    // candidate cells for flags: prefer non-critical spots; any accessible cell is fine
    const cells = [];
    essences.forEach((st, f) => st.forEach((_, s) => cells.push([f, s])));
    rng.shuffle(cells); let ci = 0;
    let blockers = 0;
    if (mech.has('frozen')) {
      const n = 1 + Math.floor(p * 2) + Math.floor(world / 3);
      for (let k = 0; k < n && ci < cells.length; k++) { const [f, s] = cells[ci++]; essences[f][s].frozen = 1 + rng.int(2); blockers += essences[f][s].frozen; }
    }
    if (mech.has('locked')) {
      const n = 1 + Math.floor(p * 2);
      for (let k = 0; k < n && ci < cells.length; k++) { const [f, s] = cells[ci++]; essences[f][s].locked = true; blockers++; }
    }
    if (mech.has('slime')) {
      const n = 1 + Math.floor(world / 5);
      // slimes only ride on top essences (become active when exposed)
      const tops = essences.map((st, f) => [f, st.length - 1]).filter(([f, s]) => s >= 0);
      rng.shuffle(tops);
      for (let k = 0; k < n && k < tops.length; k++) { const [f, s] = tops[k]; essences[f][s].slime = true; blockers += 2; }
    }

    // ---- move budget: guaranteed solution length + generous slack + blockers ----
    const factor = 1.9 - p * .5 - world * .04;                  // tighter as game progresses
    const moves = Math.max(coresGoal * 2 + 2, Math.round(solLen * clamp(factor, 1.2, 1.9)) + blockers + 2 + (isBoss ? 3 : 0));

    return {
      world, levelIdx, globalIdx, isBoss, capacity, coresGoal,
      chain: W.chain, coreColor: W.coreColor, mechanics: [...mech],
      flasks: essences, flaskMeta, portalPair,
      moves, par: Math.max(coresGoal * 2, solLen), solLen,
      tier: DIFF_TIERS[tierIndex],
      boss: isBoss ? this.bossFor(world) : null
    };
  },
  bossFor(world) {
    const bosses = [
      { name: 'Ancient Dragon', emoji: '🐲', rule: 'shift', desc: 'Shifts a random essence every 5 moves' },
      { name: 'Crystal Golem', emoji: '🗿', rule: 'lock', desc: 'Locks a random essence every 4 moves' },
      { name: 'Shadow Alchemist', emoji: '🧛', rule: 'freeze', desc: 'Freezes a random essence every 4 moves' },
      { name: 'Dark Wizard', emoji: '🧙‍♂️', rule: 'slime', desc: 'Summons hungry slimes' }
    ];
    return bosses[world % bosses.length];
  }
};

/* ============================ BOARD ============================ */
/* Owns the live puzzle state & fusion rules. Emits events via callbacks. */
class Board {
  constructor(def, game) {
    this.def = def; this.game = game;
    this.flasks = def.flasks.map(st => st.map(o => ({ ...o })));
    this.meta = def.flaskMeta.map(m => ({ ...m }));
    this.chain = def.chain; this.coreColor = def.coreColor; this.capacity = def.capacity;
    this.cap = def.capacity;
    this.selected = -1;      // flask index whose top is lifted
    this.moves = def.moves;
    this.coresMade = 0;
    this.combo = 0; this.comboTimer = 0;
    this.bossCounter = 0;
    this.cores = def.coresGoal;
    this.history = [];       // for undo
    this.locked = false;     // input lock during animations
    this.won = false; this.lost = false;
  }
  topTier() { return this.chain.length - 1; }
  snapshot() {
    return JSON.stringify({ f: this.flasks, m: this.moves, c: this.coresMade, mt: this.meta });
  }
  restore(s) { const o = JSON.parse(s); this.flasks = o.f; this.moves = o.m; this.coresMade = o.c; this.meta = o.mt; }
  pushHistory() { this.history.push(this.snapshot()); if (this.history.length > 30) this.history.shift(); }
  undo() {
    if (!this.history.length) return false;
    this.restore(this.history.pop()); this.selected = -1; this.combo = 0; return true;
  }
  top(fi) { const s = this.flasks[fi]; return s.length ? s[s.length - 1] : null; }
  canInteract(fi) {
    const t = this.top(fi);
    if (!t) return true;               // empty flask can receive
    if (t.frozen > 0) return false;    // frozen top blocks
    if (t.locked) return false;        // locked top blocks
    return true;
  }
  // Player taps a flask
  tap(fi) {
    if (this.locked || this.won || this.lost) return;
    if (this.selected === -1) {
      const t = this.top(fi);
      if (!t) { Audio.sfx('fail'); return; }
      if (t.frozen > 0) { // tapping a frozen essence thaws it by one (costs a move)
        this.pushHistory(); t.frozen--; Audio.sfx('move'); this.game.toast('❄ Thawing…');
        this.afterMove(); return;
      }
      if (t.locked) {     // tapping a locked essence unlocks it (costs a move)
        this.pushHistory(); t.locked = false; Audio.sfx('move'); this.game.toast('🔓 Unlocked!');
        this.afterMove(); return;
      }
      this.selected = fi; Audio.sfx('lift'); this.game.fx.lift(fi);
      return;
    }
    // second tap
    const src = this.selected;
    if (fi === src) { this.selected = -1; return; } // deselect
    if (!this.canInteract(fi)) {
      const t = this.top(fi);
      if (t && t.frozen > 0) { this.game.toast('Frozen — tap it first to thaw'); }
      else if (t && t.locked) { this.game.toast('Locked 🔒'); }
      Audio.sfx('fail'); return;
    }
    const moved = this.doTransfer(src, fi);
    this.selected = -1;
    if (moved) { this.afterMove(); }
  }
  // Transfer/fuse from src top to dst
  doTransfer(src, dst) {
    const a = this.top(src);
    if (!a) return false;
    const b = this.top(dst);
    let dstReal = dst;
    // portal: dropping into a portal flask emerges from its pair
    if (this.meta[dst].type === 'portal' && this.def.portalPair) {
      const [pa, pb] = this.def.portalPair;
      dstReal = dst === pa ? pb : pa;
    }
    if (dstReal === src) { this.selected = -1; return false; } // portal looped back to source
    const bReal = this.top(dstReal);
    if (bReal == null) {
      // move onto empty
      if (this.flasks[dstReal].length >= this.cap) { Audio.sfx('fail'); return false; }
      this.pushHistory();
      this.flasks[src].pop(); this.flasks[dstReal].push(a);
      this.applyShift(dstReal);
      Audio.sfx('move'); this.game.fx.moveOrb(src, dstReal); this.combo = 0;
      return true;
    }
    // fusion requires SAME tier and both not core-complete beyond top
    if (bReal.tier === a.tier && !bReal.locked && bReal.frozen === 0) {
      this.pushHistory();
      this.flasks[src].pop();
      const newTier = a.tier + 1;
      Storage.data.stats.fusions++;
      if (newTier > this.topTier()) {
        // forge a CORE! remove the target essence and count a core
        this.flasks[dstReal].pop();
        this.coresMade++; Storage.data.stats.cores++;
        this.combo++; this.registerCombo();
        Audio.sfx('core'); this.game.fx.coreForge(dstReal);
        if (this.game.def.isBoss) Audio.sfx('combo');
      } else {
        bReal.tier = newTier; bReal.frozen = 0;
        // splitter: fusing on a splitter flask spawns an extra lower essence if room
        if (this.meta[dstReal].type === 'splitter' && this.flasks[dstReal].length < this.cap) {
          this.flasks[dstReal].splice(this.flasks[dstReal].length - 1, 0, { tier: Math.max(0, newTier - 1), frozen: 0, locked: false, slime: false });
        }
        this.combo++; this.registerCombo();
        Audio.sfx('fuse'); this.game.fx.fuse(dstReal);
      }
      this.applyShift(dstReal);
      return true;
    }
    // mismatch → unstable, gentle fail (no penalty beyond feedback)
    Audio.sfx('fail'); this.game.fx.unstable(dstReal); this.combo = 0;
    return false;
  }
  applyShift(fi) {
    // shift flask nudges its new top color along the chain occasionally (visual+logic twist)
    if (this.meta[fi].type === 'shift') {
      const t = this.top(fi);
      if (t && t.tier < this.topTier() && Math.random() < .5) { /* handled visually as glow; keep logic simple */ }
    }
  }
  registerCombo() {
    if (this.combo >= 2) {
      this.game.showCombo(this.combo);
      Storage.data.stats.bestCombo = Math.max(Storage.data.stats.bestCombo, this.combo);
      if (this.combo >= 2) Audio.sfx('combo');
    }
  }
  afterMove() {
    this.moves--; this.game.onMove(this.selected);
    // boss rule tick
    if (this.def.isBoss && this.def.boss) {
      this.bossCounter++;
      const every = this.def.boss.rule === 'shift' ? 5 : 4;
      if (this.bossCounter % every === 0) this.bossAct();
    }
    // slime crawl: slimes occasionally degrade an adjacent essence
    this.slimeTick();
    this.game.syncHUD();
    this.game.checkState();
  }
  bossAct() {
    const B = this.def.boss;
    const cells = [];
    this.flasks.forEach((st, f) => st.forEach((o, s) => cells.push([f, s])));
    if (!cells.length) return;
    const [f, s] = cells[Math.floor(Math.random() * cells.length)];
    const o = this.flasks[f][s];
    if (B.rule === 'shift') { o.tier = clamp(o.tier + (Math.random() < .5 ? 1 : -1), 0, this.topTier()); }
    else if (B.rule === 'lock') { o.locked = true; }
    else if (B.rule === 'freeze') { o.frozen = 2; }
    else if (B.rule === 'slime') { o.slime = true; }
    Audio.sfx('boss'); this.game.fx.bossPulse(f); this.game.toast(B.emoji + ' ' + B.name + ' acts!');
  }
  slimeTick() {
    let acted = false;
    this.flasks.forEach((st, f) => {
      const t = st[st.length - 1];
      if (t && t.slime && Math.random() < .22 && t.tier > 0) { t.tier--; acted = true; }
    });
    if (acted) { Audio.sfx('fail'); }
  }
  isSolved() { return this.coresMade >= this.cores; }
  isStuck() {
    if (this.moves > 0) return false;
    return !this.isSolved();
  }
  // Booster: shuffle top essences
  shuffleTops() {
    this.pushHistory();
    const tops = [];
    this.flasks.forEach(st => { if (st.length && st[st.length - 1].frozen === 0 && !st[st.length - 1].locked) tops.push(st[st.length - 1]); });
    const tiers = tops.map(t => t.tier);
    for (let i = tiers.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[tiers[i], tiers[j]] = [tiers[j], tiers[i]]; }
    tops.forEach((t, i) => t.tier = tiers[i]);
  }
  // Booster: magnet — clear all frozen/locked flags on board
  magnet() { this.pushHistory(); this.flasks.forEach(st => st.forEach(o => { o.frozen = 0; o.locked = false; o.slime = false; })); }
  // Booster: clone the selected/top-most useful essence (adds a matching tier)
  cloneEssence() {
    // find a flask with a top essence and room somewhere to duplicate a useful match
    for (let f = 0; f < this.flasks.length; f++) {
      const st = this.flasks[f]; const t = st[st.length - 1];
      if (t && t.frozen === 0 && !t.locked && st.length < this.cap) {
        this.pushHistory(); st.push({ tier: t.tier, frozen: 0, locked: false, slime: false }); return true;
      }
    }
    return false;
  }
  // Booster: auto-complete one core by fusing greedily
  autoStep() {
    // greedy: find two matching accessible tops and fuse repeatedly toward a core
    for (let pass = 0; pass < 40; pass++) {
      let did = false;
      for (let a = 0; a < this.flasks.length; a++) {
        const ta = this.top(a); if (!ta || ta.frozen || ta.locked) continue;
        for (let b = 0; b < this.flasks.length; b++) {
          if (a === b) continue; const tb = this.top(b); if (!tb || tb.frozen || tb.locked) continue;
          if (ta.tier === tb.tier) { this.selected = a; this.doTransfer(a, b); this.selected = -1; did = true; break; }
        }
        if (did) break;
      }
      if (!did) break;
      if (this.coresMade >= this.cores) break;
    }
  }
}

/* ============================ RENDERER / FX ============================ */
class Renderer {
  constructor(canvas, game) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.game = game;
    this.parts = new Particles();
    this.shake = 0; this.flash = 0; this.flashColor = '#fff';
    this.anims = [];   // transient animations {t0,dur,fn}
    this.dpr = 1; this.resize();
    window.addEventListener('resize', () => this.resize());
    // background float decor
    this.decor = [];
    for (let i = 0; i < 14; i++) this.decor.push({ x: Math.random(), y: Math.random(), r: 6 + Math.random() * 22, s: .2 + Math.random() * .5, o: .1 + Math.random() * .2, ph: Math.random() * TAU });
    this.t = 0;
  }
  resize() {
    const rect = this.c.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = rect.width; this.H = rect.height;
    this.c.width = this.W * this.dpr; this.c.height = this.H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.game.board) this.layout();
  }
  setWorld(w) { this.world = w; }
  /* compute flask geometry for current board */
  layout() {
    const b = this.game.board; if (!b) return;
    const n = b.flasks.length;
    const areaTop = this.H * .25, areaBot = this.H * .78;
    const cols = n <= 4 ? n : Math.ceil(n / 2);
    const rows = n <= 4 ? 1 : 2;
    const padX = this.W * .06;
    const cellW = (this.W - padX * 2) / cols;
    const rowH = (areaBot - areaTop) / rows;
    const fw = Math.min(cellW * .78, 74);
    const capH = Math.min(rowH * .8, 44 + b.cap * 8);
    this.geo = { cols, rows, areaTop, cellW, rowH, fw, capH, padX };
    this.flaskPos = [];
    for (let i = 0; i < n; i++) {
      const r = n <= 4 ? 0 : Math.floor(i / cols);
      const c = n <= 4 ? i : i % cols;
      const cx = padX + cellW * c + cellW / 2;
      const cy = areaTop + rowH * r + rowH / 2;
      this.flaskPos.push({ cx, cy, w: fw, h: capH });
    }
    this.orbR = Math.min(fw * .38, 18);
    this.slotH = this.orbR * 2 + 4;
  }
  orbXY(fi, slot) {
    const p = this.flaskPos[fi]; const b = this.game.board;
    const baseY = p.cy + p.h / 2 - this.orbR - 6;
    return { x: p.cx, y: baseY - slot * this.slotH };
  }
  /* -------- FX hooks called by Board -------- */
  lift(fi) { const p = this.flaskPos[fi]; this.parts.ring(p.cx, p.cy - p.h / 2, '#fff', 4, 30); }
  moveOrb(src, dst) { const a = this.flaskPos[src], d = this.flaskPos[dst]; this.parts.burst(d.cx, d.cy, this.game.world.accent, 8, { spd: 2, life: 500 }); }
  fuse(fi) {
    const p = this.orbXY(fi, this.game.board.flasks[fi].length - 1);
    this.parts.burst(p.x, p.y, '#fff', 16, { spd: 3, life: 600, size: 4 });
    this.parts.ring(p.x, p.y, this.game.world.accent, 6, 46);
    this.shake = Math.min(this.shake + 4, 10); this.flashUp('#ffffff', .25);
  }
  coreForge(fi) {
    const p = this.flaskPos[fi];
    this.parts.burst(p.cx, p.cy, this.game.def.coreColor, 30, { spd: 5, life: 900, size: 6, shape: 'star' });
    this.parts.ring(p.cx, p.cy, '#fff', 8, 90); this.parts.ring(p.cx, p.cy, this.game.world.accent, 8, 120);
    this.shake = 14; this.flashUp('#ffffff', .5);
    this.floatText(p.cx, p.cy - 30, '✦ CORE ✦', this.game.def.coreColor);
  }
  unstable(fi) { const p = this.flaskPos[fi]; this.parts.burst(p.cx, p.cy, '#ff6b6b', 8, { spd: 1.6, life: 400 }); this.shake = 3; }
  bossPulse(fi) { const p = this.flaskPos[fi]; this.parts.ring(p.cx, p.cy, '#ff3ca0', 10, 100); this.shake = 8; this.flashUp('#ff9bd0', .3); }
  flashUp(col, a) { this.flash = a; this.flashColor = col; }
  floatText(x, y, text, color) { this.anims.push({ t0: now(), dur: 900, x, y, text, color, kind: 'text' }); }
  starFx(x, y) { this.parts.star(x, y); }

  /* -------- main draw -------- */
  draw(dt) {
    this.t += dt; const ctx = this.ctx;
    ctx.save();
    // camera shake
    if (this.shake > .1) { const s = this.shake; ctx.translate((Math.random() - .5) * s, (Math.random() - .5) * s); this.shake *= .86; }
    this.drawBg(ctx);
    if (this.game.scene === 'game' && this.game.board) this.drawBoard(ctx);
    this.parts.update(dt); this.parts.draw(ctx);
    this.drawAnims(ctx, dt);
    ctx.restore();
    // flash overlay
    if (this.flash > .01) { ctx.globalAlpha = this.flash; ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, this.W, this.H); ctx.globalAlpha = 1; this.flash *= .82; }
  }
  drawBg(ctx) {
    const w = this.game.world || WORLDS[0];
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, w.sky[0]); g.addColorStop(.5, w.sky[1]); g.addColorStop(1, w.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    // soft floating bubbles/snow/leaves
    for (const d of this.decor) {
      const y = ((d.y + this.t * .00004 * d.s) % 1) * this.H;
      const x = d.x * this.W + Math.sin(this.t * .0006 + d.ph) * 20;
      ctx.globalAlpha = d.o; ctx.fillStyle = w.accent;
      ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // distant lab silhouette (bright)
    if (this.game.scene === 'game') {
      ctx.globalAlpha = .12; ctx.fillStyle = w.accent;
      ctx.fillRect(0, this.H * .86, this.W, this.H * .14);
      ctx.globalAlpha = 1;
    }
  }
  drawBoard(ctx) {
    const b = this.game.board;
    for (let i = 0; i < b.flasks.length; i++) this.drawFlask(ctx, i);
    // draw lifted essence following pointer/hover on selected
    if (b.selected >= 0) {
      const st = b.flasks[b.selected]; if (st.length) {
        const o = st[st.length - 1];
        const p = this.flaskPos[b.selected];
        const y = p.cy - p.h / 2 - 18 + Math.sin(this.t * .006) * 4;
        this.drawOrb(ctx, p.cx, y, o, true);
      }
    }
  }
  drawFlask(ctx, fi) {
    const b = this.game.board, p = this.flaskPos[fi], m = b.meta[fi];
    const x = p.cx, y = p.cy, w = p.w, h = p.h, r = w * .5;
    const topY = y - h / 2, botY = y + h / 2;
    // draw a glossy, rounded-bottom glass flask
    ctx.save();
    const grad = ctx.createLinearGradient(x - w / 2, topY, x + w / 2, botY);
    grad.addColorStop(0, 'rgba(255,255,255,.55)'); grad.addColorStop(.5, 'rgba(255,255,255,.28)'); grad.addColorStop(1, 'rgba(255,255,255,.5)');
    this.roundRect(ctx, x - w / 2, topY, w, h, [w * .28, w * .28, w * .5, w * .5]);
    if (fi === b.selected) { ctx.shadowColor = this.game.world.accent; ctx.shadowBlur = 24; }
    ctx.fillStyle = grad; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    // special flask ring/badges
    if (m.type === 'portal') { ctx.strokeStyle = '#7b4dff'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]); }
    if (m.type === 'splitter') { this.badge(ctx, x, topY - 4, '⊟', '#ff7a3c'); }
    if (m.type === 'shift') { this.badge(ctx, x, topY - 4, '↻', '#8f7dff'); }
    if (m.type === 'portal') { this.badge(ctx, x, topY - 4, '◎', '#7b4dff'); }
    ctx.restore();

    // essences
    const st = b.flasks[fi];
    for (let s = 0; s < st.length; s++) {
      if (fi === b.selected && s === st.length - 1) continue; // lifted drawn separately
      const pos = this.orbXY(fi, s);
      this.drawOrb(ctx, pos.x, pos.y, st[s], false);
    }
    // rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, topY + 4, w * .38, 5, 0, 0, TAU); ctx.stroke();
  }
  badge(ctx, x, y, ch, col) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + 1); ctx.restore();
  }
  drawOrb(ctx, x, y, o, lifted) {
    const R = this.orbR;
    // "ready" = the highest-tier essence: fuse two of these to FORGE a core.
    // It uses its own chain color (never the core color) so it is never mistaken
    // for a finished core — the mint core color is reserved for the goal track.
    const isReady = o.tier >= this.game.board.topTier();
    const col = this.game.def.chain[Math.min(o.tier, this.game.def.chain.length - 1)];
    ctx.save();
    if (lifted || isReady) { ctx.shadowColor = col; ctx.shadowBlur = lifted ? 20 : 12; }
    // main orb with radial gloss
    const g = ctx.createRadialGradient(x - R * .35, y - R * .4, R * .1, x, y, R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.25, this.lighten(col, .4)); g.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0;
    if (isReady) {
      // premium "ready to forge" glow: pulsing rings + a small alchemy mark
      ctx.strokeStyle = this.lighten(col, .5); ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) { ctx.globalAlpha = .55 - k * .2; ctx.beginPath(); ctx.arc(x, y, R + 3 + k * 4 + Math.sin(this.t * .006 + k) * 1.5, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x - R * .3, y - R * .34, R * .26, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = `bold ${R * .95}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', x, y + 1);
    } else {
      // small gloss dot
      ctx.beginPath(); ctx.arc(x - R * .3, y - R * .34, R * .28, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
      // tier dots
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let k = 0; k <= o.tier; k++) { ctx.beginPath(); ctx.arc(x - R * .4 + k * (R * .4), y + R * .5, 1.6, 0, TAU); ctx.fill(); }
    }
    // frozen overlay
    if (o.frozen > 0) {
      ctx.globalAlpha = .55; ctx.fillStyle = '#dff1ff'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#8fd0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#5a9fd0'; ctx.font = `${R}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('❄', x, y + 1);
    }
    // locked overlay
    if (o.locked) { ctx.fillStyle = 'rgba(60,50,90,.35)'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.font = `${R * .9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔒', x, y); }
    // slime overlay
    if (o.slime) { ctx.fillStyle = 'rgba(120,220,120,.4)'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.font = `${R}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🟢', x, y); }
    ctx.restore();
  }
  drawAnims(ctx, dt) {
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i]; const k = (now() - a.t0) / a.dur;
      if (k >= 1) { this.anims.splice(i, 1); continue; }
      if (a.kind === 'text') {
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = a.color; ctx.font = 'bold 22px ' + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center'; ctx.fillText(a.text, a.x, a.y - k * 40); ctx.restore();
      }
    }
  }
  roundRect(ctx, x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + w - r[1], y); ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    ctx.lineTo(x + w, y + h - r[2]); ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    ctx.lineTo(x + r[3], y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    ctx.lineTo(x, y + r[0]); ctx.quadraticCurveTo(x, y, x + r[0], y);
    ctx.closePath();
  }
  lighten(hex, amt) {
    const c = hex.replace('#', ''); const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(lerp(r, 255, amt)); g = Math.round(lerp(g, 255, amt)); b = Math.round(lerp(b, 255, amt));
    return `rgb(${r},${g},${b})`;
  }
  hitTest(px, py) {
    if (!this.flaskPos) return -1;
    for (let i = 0; i < this.flaskPos.length; i++) {
      const p = this.flaskPos[i];
      if (px > p.cx - p.w / 2 - 10 && px < p.cx + p.w / 2 + 10 && py > p.cy - p.h / 2 - 30 && py < p.cy + p.h / 2 + 10) return i;
    }
    return -1;
  }
}

/* ============================ BOOSTER DEFS ============================ */
const BOOSTERS = [
  { id: 'undo', emoji: '↩️', name: 'Undo', price: 40 },
  { id: 'shuffle', emoji: '🔀', name: 'Shuffle', price: 60 },
  { id: 'moves', emoji: '⏳', name: '+5 Moves', price: 80 },
  { id: 'magnet', emoji: '🧲', name: 'Magnet', price: 120 },
  { id: 'clone', emoji: '⧉', name: 'Clone', price: 100 },
  { id: 'autocomplete', emoji: '✨', name: 'Auto', price: 200 }
];

/* ============================ LAB UPGRADES ============================ */
const LAB_UPGRADES = [
  { id: 'garden', name: 'Herb Garden', emoji: '🌿', cost: { coins: 200 }, res: 'coins' },
  { id: 'fountain', name: 'Mana Fountain', emoji: '⛲', cost: { crystals: 6 }, res: 'crystals' },
  { id: 'library', name: 'Arcane Library', emoji: '📚', cost: { coins: 500 }, res: 'coins' },
  { id: 'telescope', name: 'Star Telescope', emoji: '🔭', cost: { dust: 60 }, res: 'dust' },
  { id: 'workshop', name: 'Rune Workshop', emoji: '⚒️', cost: { coins: 800 }, res: 'coins' },
  { id: 'greenhouse', name: 'Crystal Greenhouse', emoji: '🪴', cost: { crystals: 12 }, res: 'crystals' },
  { id: 'clocktower', name: 'Clock Tower', emoji: '🕰️', cost: { keys: 5 }, res: 'keys' },
  { id: 'spire', name: 'Grand Spire', emoji: '🏰', cost: { crystals: 25 }, res: 'crystals' }
];

/* ============================ SHOP ITEMS ============================ */
const SHOP = [
  { id: 'coins1', emoji: '🪙', name: '500 Coins', give: { coins: 500 }, price: { crystals: 5 } },
  { id: 'life', emoji: '❤️', name: 'Refill Lives', give: { lives: 5 }, price: { crystals: 3 } },
  { id: 'undo5', emoji: '↩️', name: '5× Undo', give: { b_undo: 5 }, price: { coins: 180 } },
  { id: 'move5', emoji: '⏳', name: '5× +Moves', give: { b_moves: 5 }, price: { coins: 300 } },
  { id: 'magnet3', emoji: '🧲', name: '3× Magnet', give: { b_magnet: 3 }, price: { coins: 320 } },
  { id: 'auto2', emoji: '✨', name: '2× Auto', give: { b_autocomplete: 2 }, price: { crystals: 8 } },
  { id: 'skinGold', emoji: '🏆', name: 'Golden Flask Skin', give: { skin: 'gold' }, price: { crystals: 15 } },
  { id: 'keys3', emoji: '🗝️', name: '3× Golden Keys', give: { keys: 3 }, price: { coins: 400 } }
];

/* ============================ WHEEL ============================ */
const WHEEL = [
  { label: '50🪙', give: { coins: 50 }, col: '#ffd76a' },
  { label: '2💎', give: { crystals: 2 }, col: '#a879ff' },
  { label: '20✨', give: { dust: 20 }, col: '#7df0c9' },
  { label: '100🪙', give: { coins: 100 }, col: '#ffb02e' },
  { label: '1🗝️', give: { keys: 1 }, col: '#ff8fc0' },
  { label: '5💎', give: { crystals: 5 }, col: '#7b4dff' },
  { label: '40✨', give: { dust: 40 }, col: '#38e0b0' },
  { label: '200🪙', give: { coins: 200 }, col: '#ff9a3c' }
];

/* ============================ ACHIEVEMENTS ============================ */
const ACHIEVEMENTS = [
  { id: 'first', name: 'First Spark', emoji: '✨', desc: 'Complete level 1', chk: s => s.stats.won >= 1 },
  { id: 'core10', name: 'Core Collector', emoji: '💠', desc: 'Forge 10 cores', chk: s => s.stats.cores >= 10 },
  { id: 'core100', name: 'Core Master', emoji: '🔮', desc: 'Forge 100 cores', chk: s => s.stats.cores >= 100 },
  { id: 'combo5', name: 'Chain Alchemist', emoji: '⚡', desc: 'Reach a 5× combo', chk: s => s.stats.bestCombo >= 5 },
  { id: 'stars50', name: 'Star Keeper', emoji: '⭐', desc: 'Earn 50 stars', chk: s => s.stats.stars >= 50 },
  { id: 'world2', name: 'Explorer', emoji: '🗺️', desc: 'Unlock Crystal Cave', chk: s => (s.stats.stars || 0) >= 24 },
  { id: 'win50', name: 'Devoted Keeper', emoji: '🏅', desc: 'Win 50 levels', chk: s => s.stats.won >= 50 },
  { id: 'lab4', name: 'Restorer', emoji: '🏛️', desc: 'Build 4 lab rooms', chk: s => Object.keys(s.lab).length >= 4 }
];

/* ============================ MISSIONS ============================ */
function freshMissions(rng) {
  const pool = [
    { id: 'win3', emoji: '🏆', title: 'Win 3 levels', goal: 3, key: 'win', reward: { coins: 120 } },
    { id: 'fuse20', emoji: '⚗️', title: 'Fuse 20 essences', goal: 20, key: 'fuse', reward: { dust: 30 } },
    { id: 'core8', emoji: '💠', title: 'Forge 8 cores', goal: 8, key: 'core', reward: { crystals: 3 } },
    { id: 'combo3', emoji: '⚡', title: 'Make a 3× combo', goal: 1, key: 'combo3', reward: { coins: 100 } },
    { id: 'star6', emoji: '⭐', title: 'Earn 6 stars', goal: 6, key: 'star', reward: { keys: 1 } }
  ];
  rng.shuffle(pool);
  return pool.slice(0, 3).map(m => ({ ...m, prog: 0, done: false }));
}

/* ============================ TRANSLATIONS (light) ============================ */
const I18N = {
  en: { play: 'Play', locked: 'Locked', reach: 'Reach', complete: 'Level Complete!', outmoves: 'Out of Moves', next: 'NEXT' },
  uk: { play: 'Грати', locked: 'Закрито', reach: 'Потрібно', complete: 'Рівень пройдено!', outmoves: 'Ходи скінчились', next: 'ДАЛІ' },
  es: { play: 'Jugar', locked: 'Bloqueado', reach: 'Alcanza', complete: '¡Nivel completado!', outmoves: 'Sin movimientos', next: 'SIGUIENTE' }
};

/* ============================ GAME ============================ */
class Game {
  constructor() {
    this.data = Storage.load();
    this.canvas = $('#game');
    this.renderer = new Renderer(this.canvas, this);
    this.fx = this.renderer; // Board calls game.fx.*
    this.scene = 'boot';
    this.world = WORLDS[0];
    this.def = null; this.board = null;
    this.selBooster = null;
    this.lastT = now();
    this.bindUI();
    this.regenLives();
    this.checkDailyMissions();
    this.loop();
    // resume audio on first touch
    const wake = () => { Audio.init(); Audio.resume(); document.removeEventListener('pointerdown', wake); };
    document.addEventListener('pointerdown', wake);
  }

  /* -------- loop -------- */
  loop() {
    const t = now(); let dt = t - this.lastT; this.lastT = t; if (dt > 60) dt = 60;
    this.renderer.draw(dt);
    requestAnimationFrame(() => this.loop());
  }

  /* -------- scene switching -------- */
  show(scene) {
    this.scene = scene;
    $$('.scene').forEach(s => s.classList.add('hidden'));
    const el = $('#scene-' + scene); if (el) el.classList.remove('hidden');
    $('#topbar').classList.toggle('hidden', scene === 'boot');
    if (scene !== 'game') $('#tutorial').classList.add('hidden'); // don't linger off the board
    if (scene !== 'boot') this.syncTop();
  }

  /* -------- UI bindings -------- */
  bindUI() {
    $('#btnBoot').onclick = () => { Audio.init(); Audio.resume(); Audio.sfx('button'); this.enterHome(); };
    $$('.navbtn').forEach(b => b.onclick = () => this.nav(b.dataset.nav));
    $$('.btn-back').forEach(b => b.onclick = () => { Audio.sfx('button'); this.show(b.dataset.back); if (b.dataset.back === 'home') { Audio.stopMusic(); } });
    $$('[data-close]').forEach(b => b.onclick = () => this.closeModals());
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) this.closeModals(); }));

    // Board input. NB: the #scene-game overlay (z-index 5) sits ON TOP of the
    // canvas (z-index 1), so real taps land on the overlay, not the canvas.
    // We therefore listen on the overlay and hit-test against the canvas geometry.
    // (Modals are siblings of #scene-game, so their taps never reach here.)
    $('#scene-game').addEventListener('pointerdown', e => this.onPointer(e));

    // level end
    $('#endHome').onclick = () => { Audio.sfx('button'); this.closeModals(); this.openLevels(this.def.world); };
    $('#endRetry').onclick = () => { Audio.sfx('button'); this.closeModals(); this.startLevel(this.def.world, this.def.levelIdx); };
    $('#endNext').onclick = () => { Audio.sfx('button'); this.closeModals(); this.nextLevel(); };
    $('#chestBtn').onclick = () => this.openChest();
    $('#failHome').onclick = () => { Audio.sfx('button'); this.closeModals(); this.openLevels(this.def.world); };
    $('#failRetry').onclick = () => { Audio.sfx('button'); this.closeModals(); this.startLevel(this.def.world, this.def.levelIdx); };
    $('#failExtra').onclick = () => this.buyExtraMoves();

    // settings
    $('#setMusic').onchange = e => { this.data.settings.music = e.target.checked; if (!e.target.checked) Audio.stopMusic(); else Audio.startMusic(this.world.scale); Storage.save(); };
    $('#setSound').onchange = e => { this.data.settings.sound = e.target.checked; Storage.save(); };
    $('#setVibe').onchange = e => { this.data.settings.vibe = e.target.checked; Storage.save(); };
    $('#setLang').onchange = e => { this.data.settings.lang = e.target.value; Storage.save(); this.toast('Language: ' + e.target.value); };
    $('#btnReset').onclick = () => { if (confirm('Reset ALL progress? This cannot be undone.')) { Storage.reset(); location.reload(); } };
    $('#btnPrivacy').onclick = () => this.showInfo('🔒 Privacy Policy', PRIVACY_HTML);
    $('#btnStats').onclick = () => this.showStats();
    $('#btnAchieve').onclick = () => this.showAchievements();
    $('#spinBtn').onclick = () => this.spinWheel();
  }

  nav(n) {
    Audio.sfx('button');
    if (n === 'play') { this.openLevels(this.data.lastWorld || 0); return; }
    if (n === 'shop') return this.openShop();
    if (n === 'lab') return this.openLab();
    if (n === 'daily') return this.openDaily();
    if (n === 'settings') { this.syncSettings(); this.openModal('settings'); }
  }

  /* -------- HOME -------- */
  enterHome() {
    this.show('home'); this.buildWorldMap(); this.syncPlayer();
    Audio.startMusic(WORLDS[0].scale);
    this.checkDaily();
  }
  buildWorldMap() {
    const wrap = $('#worldMap'); wrap.innerHTML = '';
    const totalStars = this.totalStars();
    WORLDS.forEach(w => {
      const unlocked = totalStars >= w.req;
      const done = this.worldStars(w.id), max = LEVELS_PER_WORLD * 3;
      const card = document.createElement('div');
      card.className = 'world-card' + (unlocked ? '' : ' locked');
      card.dataset.req = (w.req - totalStars) + '⭐ needed';
      card.style.background = `linear-gradient(160deg, ${w.accent}, ${this.shade(w.accent, -25)})`;
      card.innerHTML = `
        <div class="wc-stars">⭐ ${done}/${max}</div>
        <div class="wc-emoji">${w.emoji}</div>
        <div class="wc-name">${w.name}</div>
        <div class="wc-sub">${w.subtitle}</div>
        <div class="wc-prog"><div class="wc-progfill" style="width:${(done / max * 100) | 0}%"></div></div>`;
      if (unlocked) card.onclick = () => { Audio.sfx('button'); this.openLevels(w.id); };
      wrap.appendChild(card);
    });
  }
  syncPlayer() {
    $('#plLvl').textContent = 'Lv ' + this.data.plvl;
    $('#homeAvatar').textContent = this.data.avatar;
    const need = this.xpForLevel(this.data.plvl);
    $('#plXpFill').style.width = clamp(this.data.xp / need * 100, 4, 100) + '%';
    const names = ['Apprentice', 'Adept', 'Alchemist', 'Mage', 'Archmage', 'Sage', 'Grand Sage', 'Mystic'];
    $('#plName').textContent = names[Math.min(names.length - 1, Math.floor(this.data.plvl / 4))];
  }
  xpForLevel(l) { return 40 + l * 20; }

  /* -------- LEVEL SELECT -------- */
  openLevels(worldId) {
    this.world = WORLDS[worldId]; this.data.lastWorld = worldId; Storage.save();
    Audio.setScale(this.world.scale);
    $('#lvSelTitle').textContent = this.world.name;
    const grid = $('#levelGrid'); grid.innerHTML = '';
    const firstUncleared = this.firstUnclearedGlobal();
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const gi = worldId * LEVELS_PER_WORLD + i;
      const key = worldId + '-' + i;
      const stars = this.data.progress[key] || 0;
      const isBoss = (i + 1) % 10 === 0;
      const unlocked = gi <= firstUncleared;
      const node = document.createElement('div');
      node.className = 'lv-node' + (stars ? ' done' : '') + (isBoss ? ' boss' : '') + (unlocked ? '' : ' locked');
      node.innerHTML = `${isBoss ? '<div class="boss-tag">👑</div>' : ''}<span class="lv-num">${gi + 1}</span>` +
        (stars ? `<div class="lv-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>` : '');
      if (unlocked) node.onclick = () => { Audio.sfx('button'); this.startLevel(worldId, i); };
      grid.appendChild(node);
    }
    this.show('levels');
    // scroll to current
    setTimeout(() => { const cur = grid.children[Math.min(LEVELS_PER_WORLD - 1, firstUncleared - worldId * LEVELS_PER_WORLD)]; if (cur) cur.scrollIntoView({ block: 'center' }); }, 40);
  }
  firstUnclearedGlobal() {
    for (let g = 0; g < TOTAL_LEVELS; g++) { const w = Math.floor(g / LEVELS_PER_WORLD), l = g % LEVELS_PER_WORLD; if (!this.data.progress[w + '-' + l]) return g; }
    return TOTAL_LEVELS - 1;
  }

  /* -------- START LEVEL -------- */
  startLevel(worldId, levelIdx) {
    if (this.data.lives <= 0) { this.toast('No lives! Wait or refill in Shop ❤️'); return; }
    this.world = WORLDS[worldId]; Audio.setScale(this.world.scale);
    this.def = LevelGen.make(worldId, levelIdx);
    this.board = new Board(this.def, this);
    this.selBooster = null;
    this.data.stats.played++;
    this.renderer.layout();
    this.show('game');
    $('#hudLevel').textContent = 'Level ' + (this.def.globalIdx + 1) + ' · ' + this.def.tier + (this.def.isBoss ? ' 👑' : '');
    this.buildBoosterBar();
    this.syncHUD();
    this.maybeTutorial();
    if (this.def.isBoss) { Audio.sfx('boss'); this.toast('👑 ' + this.def.boss.name + ' — ' + this.def.boss.desc); }
    Storage.save();
  }
  maybeTutorial() {
    const tut = $('#tutorial');
    if (!this.data.seenTutorial) {
      tut.innerHTML = 'Tap a flask to lift its top essence, then tap another to <b>fuse matching colors</b> into a higher one. Fuse to the top to forge a ✦Core!<span class="hand">👆</span>';
      tut.classList.remove('hidden');
      this.data.seenTutorial = true; Storage.save();
      setTimeout(() => tut.classList.add('hidden'), 7000);
    } else if (this.def.mechanics.length && this.def.levelIdx > 0) {
      const hints = { locked: '🔒 Locked essences must be freed — use a 🧲 Magnet booster.', frozen: '❄ Tap a frozen essence to thaw it (costs a move).', portal: '◎ Portal flasks are linked — drops emerge from the pair.', splitter: '⊟ Splitter flasks spawn an extra essence when you fuse.', shift: '↻ Shift flasks glow — colors drift under their magic.', slime: '🟢 Slimes nibble essences down a tier — fuse fast!' };
      const m = this.def.mechanics.find(x => hints[x]);
      if (m && !this['hintSeen_' + m]) { this['hintSeen_' + m] = true; tut.innerHTML = hints[m]; tut.classList.remove('hidden'); setTimeout(() => tut.classList.add('hidden'), 5000); }
    }
  }

  /* -------- input -------- */
  onPointer(e) {
    if (this.scene !== 'game' || !this.board) return;
    Audio.resume();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const fi = this.renderer.hitTest(x, y);
    if (fi < 0) { if (this.board.selected >= 0) this.board.selected = -1; return; }
    if (this.selBooster) { this.applyBoosterTo(fi); return; }
    this.board.tap(fi);
  }

  onMove(fi) { this.syncHUD(); this.tickMissionsFromMove(); }
  syncHUD() {
    if (!this.board) return;
    const b = this.board;
    $('#hudMoves').textContent = b.moves;
    $('#hudMoves').classList.toggle('low', b.moves <= 3);
    $('#hudGoal').textContent = `Forge ${b.cores} Core${b.cores > 1 ? 's' : ''}`;
    // goal track pills
    const gt = $('#goalTrack'); gt.innerHTML = '';
    for (let i = 0; i < b.cores; i++) {
      const met = i < b.coresMade;
      const pill = document.createElement('div'); pill.className = 'goal-pill' + (met ? ' met' : '');
      pill.innerHTML = `<span class="gp-orb" style="background:${met ? this.def.coreColor : '#ddd4ee'}"></span>${met ? '✓' : '✦'}`;
      gt.appendChild(pill);
    }
  }
  showCombo(n) {
    const el = $('#comboBanner');
    const labels = { 2: '2× COMBO!', 3: '3× COMBO!', 4: 'PERFECT CHAIN!', };
    el.textContent = labels[n] || (n >= 5 ? 'MAGIC EXPLOSION! ' + n + '×' : n + '× COMBO!');
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    if (n >= 3) { this.renderer.shake = 12; this.renderer.flashUp('#fff', .4); }
    if (n === 3) this.bumpMission('combo3', 1);
  }

  checkState() {
    if (!this.board) return;
    if (this.board.isSolved()) { this.win(); return; }
    if (this.board.isStuck()) { setTimeout(() => this.fail(), 500); }
  }

  /* -------- WIN -------- */
  win() {
    if (this.board.won) return; this.board.won = true; this.board.locked = true;
    Audio.sfx('win');
    const b = this.board, def = this.def;
    // stars: 3 if used <= par, 2 if <= par*1.4, else 1
    const used = def.moves - b.moves;
    let stars = 1; if (used <= def.par) stars = 3; else if (used <= def.par * 1.4) stars = 2;
    const key = def.world + '-' + def.levelIdx;
    const prev = this.data.progress[key] || 0;
    const gainedStars = Math.max(0, stars - prev);
    this.data.progress[key] = Math.max(prev, stars);
    // rewards
    const coins = 30 + def.globalIdx + stars * 15 + (def.isBoss ? 60 : 0);
    const dust = 4 + stars * 3;
    const crystals = def.isBoss ? 2 : (stars === 3 ? 1 : 0);
    const xp = 20 + stars * 10 + (def.isBoss ? 30 : 0);
    this.data.coins += coins; this.data.dust += dust; this.data.crystals += crystals;
    this.data.stats.won++; this.data.stats.stars += gainedStars;
    this.addXP(xp);
    // mission tracking
    this.bumpMission('win', 1); this.bumpMission('star', gainedStars); this.bumpMission('core', b.coresMade);
    // achievement + world unlock check
    const before = this.data.achieved;
    this.checkAchievements();
    this.checkWorldUnlock();
    Storage.save();
    this.pendingChest = (stars === 3 || def.isBoss || Math.random() < .3);
    this.showEnd(stars, { coins, dust, crystals, xp });
  }
  showEnd(stars, r) {
    $('#endBanner').textContent = this.def.isBoss ? '👑 Boss Defeated!' : this.tr('complete');
    // stars animate
    $$('#endStars .star').forEach((s, i) => { s.classList.remove('on'); if (i < stars) setTimeout(() => { s.classList.add('on'); Audio.sfx('star'); const rc = s.getBoundingClientRect(); this.renderer.starFx(rc.left + rc.width / 2, rc.top + rc.height / 2); }, 300 + i * 260); });
    const rw = $('#endRewards'); rw.innerHTML = '';
    const items = [['🪙', r.coins, 'Coins'], ['✨', r.dust, 'Dust'], ['⭐', r.xp, 'XP']];
    if (r.crystals) items.push(['💎', r.crystals, 'Crystals']);
    items.forEach(([e, v, l]) => { const d = document.createElement('div'); d.className = 'reward-item'; d.innerHTML = `<span class="ri-emoji">${e}</span>+${v}<span class="ri-lbl">${l}</span>`; rw.appendChild(d); });
    $('#endChest').classList.toggle('hidden', !this.pendingChest);
    $('#endNext').textContent = this.tr('next') + ' ›';
    this.openModal('end');
    this.syncTop();
  }
  openChest() {
    if (!this.pendingChest) return; this.pendingChest = false;
    Audio.sfx('reward');
    const rewards = [{ coins: 100 }, { crystals: 3 }, { dust: 40 }, { keys: 1 }];
    const pick = rewards[Math.floor(Math.random() * rewards.length)];
    this.grant(pick);
    const rc = $('#chestBtn').getBoundingClientRect();
    this.renderer.parts.burst(rc.left + rc.width / 2, rc.top + rc.height / 2, '#ffd76a', 30, { spd: 5, life: 900, shape: 'star', size: 6 });
    $('#endChest').innerHTML = `<div style="font-size:40px">🎉</div><p>+${Object.values(pick)[0]} ${Object.keys(pick)[0]}!</p>`;
    this.syncTop();
  }
  nextLevel() {
    let w = this.def.world, l = this.def.levelIdx + 1;
    if (l >= LEVELS_PER_WORLD) { w++; l = 0; if (w >= WORLDS.length) { this.openLevels(this.def.world); return; } if (this.totalStars() < WORLDS[w].req) { this.toast('Earn more ⭐ to unlock ' + WORLDS[w].name); this.openLevels(this.def.world); return; } }
    this.startLevel(w, l);
  }

  /* -------- FAIL -------- */
  fail() {
    if (this.board.won || this.board.lost) return; this.board.lost = true;
    this.spendLife();
    Audio.sfx('fail');
    $('#modal-fail').querySelector('h3').textContent = this.tr('outmoves');
    this.openModal('fail'); this.syncTop();
  }
  buyExtraMoves() {
    if (this.data.crystals < 3) { this.toast('Not enough 💎'); return; }
    this.data.crystals -= 3; this.board.moves += 5; this.board.lost = false; this.gainLife();
    Audio.sfx('booster'); Storage.save(); this.closeModals(); this.syncHUD(); this.syncTop();
  }

  /* -------- ECONOMY / lives / xp -------- */
  grant(obj) {
    for (const k in obj) {
      if (k === 'lives') { this.data.lives = Math.min(5, this.data.lives + obj[k]); }
      else if (k === 'skin') { if (!this.data.ownedSkins.includes(obj[k])) this.data.ownedSkins.push(obj[k]); this.data.skins.flask = obj[k]; }
      else if (k.startsWith('b_')) { const b = k.slice(2); this.data.boosters[b] = (this.data.boosters[b] || 0) + obj[k]; }
      else this.data[k] = (this.data[k] || 0) + obj[k];
    }
    Storage.save(); this.syncTop();
  }
  spend(price) { for (const k in price) { if ((this.data[k] || 0) < price[k]) return false; } for (const k in price) this.data[k] -= price[k]; Storage.save(); this.syncTop(); return true; }
  addXP(x) {
    this.data.xp += x;
    while (this.data.xp >= this.xpForLevel(this.data.plvl)) { this.data.xp -= this.xpForLevel(this.data.plvl); this.data.plvl++; this.grant({ crystals: 2, keys: 1 }); Audio.sfx('unlock'); this.toast('🎉 Level ' + this.data.plvl + '! +2💎 +1🗝️'); }
    Storage.save();
  }
  spendLife() { this.data.lives = Math.max(0, this.data.lives - 1); if (this.data.lives === 4) this.data.lifeAt = Date.now(); Storage.save(); this.syncTop(); }
  gainLife() { if (this.data.lives < 5) this.data.lives++; Storage.save(); this.syncTop(); }
  regenLives() {
    const REGEN = 5 * 60 * 1000; // 5 min per life
    const tick = () => {
      if (this.data.lives < 5) {
        const elapsed = Date.now() - this.data.lifeAt;
        const gained = Math.floor(elapsed / REGEN);
        if (gained > 0) { this.data.lives = Math.min(5, this.data.lives + gained); this.data.lifeAt += gained * REGEN; Storage.save(); }
      } else this.data.lifeAt = Date.now();
      this.syncTop();
      setTimeout(tick, 1000);
    };
    tick();
  }

  /* -------- HUD top bar -------- */
  syncTop() {
    $('#tbCoins').textContent = this.data.coins;
    $('#tbCrystals').textContent = this.data.crystals;
    $('#tbDust').textContent = this.data.dust;
    $('#tbKeys').textContent = this.data.keys;
    $('#tbLives').textContent = this.data.lives;
    const tEl = $('#tbLifeTimer');
    if (this.data.lives < 5) {
      const REGEN = 5 * 60 * 1000; const left = REGEN - (Date.now() - this.data.lifeAt);
      const s = Math.max(0, Math.ceil(left / 1000)); tEl.textContent = (Math.floor(s / 60)) + ':' + String(s % 60).padStart(2, '0');
    } else tEl.textContent = 'full';
  }

  /* -------- BOOSTERS -------- */
  buildBoosterBar() {
    const bar = $('#boosterBar'); bar.innerHTML = '';
    BOOSTERS.forEach(bo => {
      const cnt = this.data.boosters[bo.id] || 0;
      const el = document.createElement('button');
      el.className = 'booster' + (cnt ? '' : ' empty');
      el.innerHTML = `<span class="b-emoji">${bo.emoji}</span><span class="b-name">${bo.name}</span><span class="b-count">${cnt || '+'}</span>`;
      el.onclick = () => this.useBooster(bo, el);
      bar.appendChild(el);
    });
  }
  useBooster(bo, el) {
    Audio.sfx('button');
    const cnt = this.data.boosters[bo.id] || 0;
    if (cnt <= 0) {
      // buy with coins
      if (this.spend({ coins: bo.price })) { this.data.boosters[bo.id] = 1; Storage.save(); this.buildBoosterBar(); this.toast('Bought ' + bo.name + '!'); }
      else this.toast('Need 🪙' + bo.price + ' for ' + bo.name);
      return;
    }
    // instant boosters
    if (bo.id === 'undo') { if (this.board.undo()) { this.consumeBooster(bo.id); Audio.sfx('booster'); } else this.toast('Nothing to undo'); this.syncHUD(); return; }
    if (bo.id === 'shuffle') { this.board.shuffleTops(); this.consumeBooster(bo.id); Audio.sfx('booster'); this.renderer.flashUp('#fff', .3); return; }
    if (bo.id === 'moves') { this.board.moves += 5; this.def.moves += 5; this.consumeBooster(bo.id); Audio.sfx('booster'); this.syncHUD(); this.toast('+5 Moves ⏳'); return; }
    if (bo.id === 'magnet') { this.board.magnet(); this.consumeBooster(bo.id); Audio.sfx('booster'); this.renderer.flashUp('#8fd0ff', .3); this.toast('🧲 All essences freed!'); return; }
    if (bo.id === 'clone') { if (this.board.cloneEssence()) { this.consumeBooster(bo.id); Audio.sfx('booster'); this.renderer.flashUp('#fff', .3); } else this.toast('No room to clone'); return; }
    if (bo.id === 'autocomplete') { this.board.autoStep(); this.consumeBooster(bo.id); Audio.sfx('booster'); this.syncHUD(); this.checkState(); return; }
  }
  consumeBooster(id) { this.data.boosters[id]--; Storage.save(); this.buildBoosterBar(); }
  applyBoosterTo(fi) { /* reserved for targeted boosters */ this.selBooster = null; }

  /* -------- SHOP -------- */
  openShop() {
    const g = $('#shopGrid'); g.innerHTML = '';
    SHOP.forEach(it => {
      const el = document.createElement('div'); el.className = 'shop-item';
      const pk = Object.keys(it.price)[0], pv = it.price[pk];
      const emoji = pk === 'coins' ? '🪙' : '💎';
      el.innerHTML = `<div class="si-emoji">${it.emoji}</div><div class="si-name">${it.name}</div><div class="si-price">${emoji}${pv}</div>`;
      el.onclick = () => { if (this.spend(it.price)) { this.grant(it.give); Audio.sfx('reward'); this.toast('Purchased ' + it.name + '!'); } else { this.toast('Not enough ' + (pk === 'coins' ? '🪙' : '💎')); } };
      g.appendChild(el);
    });
    this.openModal('shop');
  }

  /* -------- LAB -------- */
  openLab() {
    const scene = $('#labScene'); const built = Object.keys(this.data.lab);
    scene.innerHTML = '🏛️' + built.map(id => (LAB_UPGRADES.find(u => u.id === id) || {}).emoji || '').join('');
    const g = $('#labGrid'); g.innerHTML = '';
    LAB_UPGRADES.forEach(u => {
      const owned = this.data.lab[u.id];
      const pk = Object.keys(u.cost)[0], pv = u.cost[pk];
      const emoji = { coins: '🪙', crystals: '💎', dust: '✨', keys: '🗝️' }[pk];
      const el = document.createElement('div'); el.className = 'lab-item' + (owned ? ' owned' : '');
      el.innerHTML = `<div class="li-emoji">${u.emoji}</div><div class="li-name">${u.name}</div><div class="li-price">${owned ? '✓ Built' : emoji + pv}</div>`;
      if (!owned) el.onclick = () => { if (this.spend(u.cost)) { this.data.lab[u.id] = true; Storage.save(); Audio.sfx('unlock'); this.toast('Built ' + u.name + '! 🏛️'); this.checkAchievements(); this.openLab(); } else this.toast('Not enough ' + emoji); };
      g.appendChild(el);
    });
    this.openModal('lab');
  }

  /* -------- DAILY -------- */
  openDaily() { this.buildDaily(); this.buildWheel(); this.buildMissions(); this.openModal('daily'); }
  today() { return new Date().toISOString().slice(0, 10); }
  checkDaily() {
    const t = this.today();
    if (this.data.daily.lastLogin !== t) {
      // streak logic
      const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      this.data.daily.streak = (this.data.daily.lastLogin === yest) ? this.data.daily.streak + 1 : 1;
      this.data.daily.lastLogin = t;
      const rewards = [{ coins: 50 }, { dust: 20 }, { crystals: 2 }, { coins: 150 }, { keys: 1 }, { crystals: 4 }, { crystals: 8, keys: 2 }];
      const r = rewards[Math.min(6, this.data.daily.streak - 1)];
      this.grant(r); Audio.sfx('reward');
      this.toast('Daily reward! Day ' + this.data.daily.streak + ' 🎁');
      Storage.save();
    }
  }
  buildDaily() {
    const el = $('#dailyLogin'); el.innerHTML = '';
    const rewards = ['50🪙', '20✨', '2💎', '150🪙', '1🗝️', '4💎', '8💎'];
    for (let i = 0; i < 7; i++) {
      const claimed = this.data.daily.streak > i;
      const today = this.data.daily.streak === i + 1;
      const c = document.createElement('div'); c.className = 'day-cell' + (claimed ? ' claimed' : '') + (today ? ' today' : '');
      c.innerHTML = `Day ${i + 1}<div class="dc-emoji">${rewards[i].slice(-2)}</div>${rewards[i].slice(0, -2)}`;
      el.appendChild(c);
    }
  }
  buildWheel() {
    const w = $('#wheel');
    const stops = WHEEL.map((s, i) => `${s.col} ${i / WHEEL.length * 100}% ${(i + 1) / WHEEL.length * 100}%`).join(',');
    w.style.background = `conic-gradient(${stops})`;
    w.innerHTML = WHEEL.map((s, i) => {
      const a = (i + .5) / WHEEL.length * 360;
      return `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(${a}deg) translateY(-72px) rotate(${-a}deg);font-size:12px;font-weight:800;color:#3a2a5a">${s.label}</div>`;
    }).join('');
    this.wheelRot = this.wheelRot || 0;
  }
  spinWheel() {
    if (this.data.daily.lastSpin === this.today()) { this.toast('Already spun today! Come back tomorrow 🎡'); return; }
    if (this.data.keys < 1) { this.toast('Need 🗝️1 to spin'); return; }
    this.data.keys--; this.data.daily.lastSpin = this.today(); Storage.save(); this.syncTop();
    const idx = Math.floor(Math.random() * WHEEL.length);
    const target = 360 * 5 + (360 - (idx + .5) / WHEEL.length * 360);
    this.wheelRot = (this.wheelRot || 0) + target;
    const w = $('#wheel'); w.style.transform = `rotate(${this.wheelRot}deg)`;
    Audio.sfx('spin');
    setTimeout(() => { this.grant(WHEEL[idx].give); Audio.sfx('reward'); this.toast('You won ' + WHEEL[idx].label + '!'); }, 4100);
  }
  buildMissions() {
    const el = $('#missionsList'); el.innerHTML = '';
    (this.data.missions || []).forEach(m => {
      const d = document.createElement('div'); d.className = 'mission' + (m.done ? ' done' : '');
      const rk = Object.keys(m.reward)[0], rv = m.reward[rk]; const remoji = { coins: '🪙', crystals: '💎', dust: '✨', keys: '🗝️' }[rk];
      d.innerHTML = `<span class="m-emoji">${m.emoji}</span><div class="m-body"><div class="m-title">${m.title}</div><div class="m-bar"><div class="m-fill" style="width:${clamp(m.prog / m.goal * 100, 0, 100)}%"></div></div></div><div class="m-reward">${m.done ? '✓' : remoji + rv}</div>`;
      if (m.prog >= m.goal && !m.claimed) { d.onclick = () => { m.claimed = true; m.done = true; this.grant(m.reward); Audio.sfx('reward'); this.toast('Mission reward! ' + remoji + rv); this.buildMissions(); }; }
      el.appendChild(d);
    });
  }
  checkDailyMissions() {
    const t = this.today();
    if (this.data.missionDay !== t || !this.data.missions) {
      this.data.missionDay = t; this.data.missions = freshMissions(new RNG(this.hashStr(t)));
      Storage.save();
    }
  }
  bumpMission(key, amt) {
    if (!this.data.missions) return; let changed = false;
    this.data.missions.forEach(m => { if (m.key === key && !m.done) { m.prog = Math.min(m.goal, m.prog + amt); if (m.prog >= m.goal) m.done = false; changed = true; } });
    if (changed) Storage.save();
  }
  tickMissionsFromMove() { /* fusions/cores handled at win; nothing per move needed */ }

  /* -------- ACHIEVEMENTS / STATS / INFO -------- */
  checkAchievements() {
    ACHIEVEMENTS.forEach(a => { if (!this.data.achieved[a.id] && a.chk(this.data)) { this.data.achieved[a.id] = true; Audio.sfx('unlock'); this.toast('🏆 ' + a.name + ' unlocked!'); } });
    Storage.save();
  }
  checkWorldUnlock() {
    const ts = this.totalStars();
    WORLDS.forEach(w => { if (w.req > 0 && ts >= w.req && ts - 1 < w.req && !this['unlockToast' + w.id]) { } });
  }
  showAchievements() {
    const html = ACHIEVEMENTS.map(a => { const got = this.data.achieved[a.id]; return `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;opacity:${got ? 1 : .5}"><span style="font-size:26px">${a.emoji}</span><div><b>${a.name}</b> ${got ? '✅' : ''}<br><span style="font-size:12px">${a.desc}</span></div></div>`; }).join('');
    this.showInfo('🏆 Achievements', html);
  }
  showStats() {
    const s = this.data.stats;
    const html = `<div style="line-height:2">
      🎮 Levels played: <b>${s.played}</b><br>
      🏆 Levels won: <b>${s.won}</b><br>
      ⭐ Stars earned: <b>${this.totalStars()}</b> / ${TOTAL_LEVELS * 3}<br>
      ⚗️ Fusions: <b>${s.fusions}</b><br>
      ✦ Cores forged: <b>${s.cores}</b><br>
      ⚡ Best combo: <b>${s.bestCombo}×</b><br>
      🏛️ Lab rooms: <b>${Object.keys(this.data.lab).length}</b> / ${LAB_UPGRADES.length}<br>
      🧙 Alchemist level: <b>${this.data.plvl}</b></div>`;
    this.showInfo('📊 Statistics', html);
  }
  showInfo(title, html) { $('#infoTitle').textContent = title; $('#infoBody').innerHTML = html; this.openModal('info'); }

  /* -------- modal helpers -------- */
  openModal(id) { $('#modal-' + id).classList.remove('hidden'); }
  closeModals() { $$('.modal').forEach(m => m.classList.add('hidden')); Audio.sfx('button'); }
  syncSettings() { $('#setMusic').checked = this.data.settings.music; $('#setSound').checked = this.data.settings.sound; $('#setVibe').checked = this.data.settings.vibe; $('#setLang').value = this.data.settings.lang; }

  /* -------- helpers -------- */
  totalStars() { let t = 0; for (const k in this.data.progress) t += this.data.progress[k]; return t; }
  worldStars(w) { let t = 0; for (let i = 0; i < LEVELS_PER_WORLD; i++) t += this.data.progress[w + '-' + i] || 0; return t; }
  tr(k) { const l = this.data.settings.lang; return (I18N[l] && I18N[l][k]) || I18N.en[k] || k; }
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.add('hidden'), 2200); }
  vibrate(ms) { if (this.data.settings.vibe && navigator.vibrate) navigator.vibrate(ms); }
  shade(hex, pct) { const c = hex.replace('#', ''); const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const f = pct / 100; r = clamp(Math.round(r + 255 * f), 0, 255); g = clamp(Math.round(g + 255 * f), 0, 255); b = clamp(Math.round(b + 255 * f), 0, 255); return `rgb(${r},${g},${b})`; }
  hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
}

const PRIVACY_HTML = `
<p>Mystic Alchemy Lab is fully <b>offline</b>. We do <b>not</b> collect, store, or transmit any personal data.</p>
<h4>Data storage</h4>
<p>Your progress, currency, and settings are saved <b>only on your device</b> using the browser's LocalStorage. Nothing leaves your device.</p>
<h4>No ads · No tracking · No accounts</h4>
<p>There are no advertisements, no analytics, and no third-party services.</p>
<h4>Children</h4>
<p>The game is suitable for all ages (6–70). No chat, no purchases with real money in this build.</p>
<h4>Contact</h4>
<p>For questions about this policy, contact the developer through the app store listing.</p>`;

/* boot */
window.addEventListener('load', () => { window.MAL = new Game(); });
})();
