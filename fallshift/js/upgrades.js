/* FALLSHIFT — permanent upgrades, roguelite run power-ups, skins and missions. */
(function () {
  'use strict';
  const FS = window.FS;

  // ---------------------------------------------------------------- permanent upgrades
  const PERM = [
    { id: 'energy', name: 'CORE ENERGY', icon: 'cell', max: 5, base: 120, crystals: [0, 0, 0, 2, 4], desc: (l) => '+15 max Energy per level. Now: ' + (100 + l * 15) },
    { id: 'dash', name: 'DASH', icon: 'dash', max: 5, base: 150, crystals: [0, 0, 1, 2, 4], desc: (l) => '-8% cooldown, -2 Energy cost per level. Now: ' + Math.round(100 - l * 8) + '% cd' },
    { id: 'shield', name: 'SHIELD', icon: 'shield', max: 3, base: 400, crystals: [0, 3, 8], desc: (l) => '+1 starting Shield per level. Now: ' + (1 + l) },
    { id: 'magnet', name: 'MAGNET', icon: 'magnet', max: 5, base: 100, crystals: [0, 0, 0, 1, 3], desc: (l) => 'Wider pickup reach. Now: +' + l * 25 + '%' },
    { id: 'break', name: 'BREAK', icon: 'burst', max: 5, base: 150, crystals: [0, 0, 1, 2, 4], desc: (l) => '+15% Break charge rate per level. Now: +' + l * 15 + '%' },
    { id: 'combo', name: 'COMBO', icon: 'combo', max: 5, base: 130, crystals: [0, 0, 1, 2, 4], desc: (l) => 'Slower combo decay, +0.5s FEVER per level. Now: ' + (6 + l * 0.5).toFixed(1) + 's' },
  ];

  function permCost(def, lvl) {
    return { coins: Math.round((def.base * Math.pow(1.65, lvl)) / 10) * 10, crystals: def.crystals[lvl] || 0 };
  }

  // derived base stats from permanent upgrades
  function baseStats(save) {
    const u = save.permanentUpgrades;
    return {
      maxEnergy: 100 + u.energy * 15,
      dashCdMul: 1 - u.dash * 0.08,
      dashCost: 20 - u.dash * 2,
      shields: 1 + u.shield,
      magnet: 1 + u.magnet * 0.25,
      breakRate: 1 + u.break * 0.15,
      comboDecay: 1 - u.combo * 0.12,
      feverDur: 6 + u.combo * 0.5,
    };
  }

  // ---------------------------------------------------------------- run power-ups
  const POWERUPS = [
    { id: 'overdrive', name: 'OVERDRIVE', icon: 'bolt', rarity: 'common', max: 3, desc: '+25% fall & rotation speed. Every floor gives +2 extra Energy.' },
    { id: 'phase', name: 'PHASE', icon: 'phase', rarity: 'rare', max: 3, desc: 'The first hit deals no damage. Recharges every 10 floors. +1 charge per stack.' },
    { id: 'magnet', name: 'MAGNET', icon: 'magnet', rarity: 'common', max: 2, desc: 'Automatically pulls in coins & orbs from far around the ring.' },
    { id: 'breaker', name: 'BREAKER+', icon: 'burst', rarity: 'rare', max: 2, desc: 'BREAK shatters 3 more floors and charges 40% faster.' },
    { id: 'energycore', name: 'ENERGY CORE', icon: 'cell', rarity: 'common', max: 3, desc: '+30% maximum Energy and an instant full refill.' },
    { id: 'combomaster', name: 'COMBO MASTER', icon: 'combo', rarity: 'rare', max: 2, desc: 'Landing keeps 75% of combo. FEVER charges faster and lasts +2s.' },
    { id: 'voiddash', name: 'VOID DASH', icon: 'dash', rarity: 'epic', max: 1, desc: 'DASH tears straight through spike platforms, shattering them.' },
    { id: 'shockwave', name: 'SHOCKWAVE', icon: 'wave', rarity: 'rare', max: 1, desc: 'When hit, the core detonates — clearing hazards on the next 3 floors.' },
    { id: 'lucky', name: 'LUCKY CORE', icon: 'clover', rarity: 'rare', max: 2, desc: 'More coins and crystals spawn. Rarer power-ups appear more often.' },
    { id: 'multiplier', name: 'MULTIPLIER', icon: 'x', rarity: 'epic', max: 3, desc: '+1 to the score multiplier on every floor.' },
    { id: 'aegis', name: 'AEGIS', icon: 'shield', rarity: 'epic', max: 2, desc: '+1 Shield right now (also raises max Shield).' },
  ];
  const RARITY_W = { common: 1, rare: 0.62, epic: 0.3 };

  function rollPowerups(powers, rng, n) {
    const lucky = powers.lucky || 0;
    const pool = POWERUPS.filter((p) => (powers[p.id] || 0) < p.max);
    const out = [];
    while (out.length < n && pool.length) {
      let total = 0;
      const w = pool.map((p) => {
        let v = RARITY_W[p.rarity];
        if (p.rarity !== 'common') v *= 1 + lucky * 0.6;
        total += v;
        return v;
      });
      let r = rng() * total;
      let i = 0;
      for (; i < pool.length - 1; i++) {
        r -= w[i];
        if (r <= 0) break;
      }
      out.push(pool[i]);
      pool.splice(i, 1);
    }
    return out;
  }

  // ---------------------------------------------------------------- skins
  const SKINS = [
    { id: 'cyan', name: 'PULSAR', core: '#e9ffff', glow: '#3fe6ff', trail: '#3fe6ff', coins: 0 },
    { id: 'solar', name: 'SOLAR', core: '#fff3d4', glow: '#ffae34', trail: '#ff8a1f', coins: 600 },
    { id: 'void', name: 'VOIDSTAR', core: '#f3e6ff', glow: '#a35dff', trail: '#8a4bff', coins: 1200 },
    { id: 'emerald', name: 'EMERALD', core: '#e6fff3', glow: '#2bffa0', trail: '#1fe08a', coins: 2000 },
    { id: 'rose', name: 'NOVA ROSE', core: '#ffe8f6', glow: '#ff3fb8', trail: '#ff2fa0', crystals: 15 },
    { id: 'prism', name: 'PRISM', core: '#ffffff', glow: 'rainbow', trail: 'rainbow', crystals: 40 },
  ];

  // ---------------------------------------------------------------- missions
  // check(save, run) returns [current, target]
  const MISSIONS = [
    { id: 'm_depth150', text: 'Reach 150m in a single run', reward: { coins: 100 }, check: (s) => [Math.min(s.bestDepth, 150), 150] },
    { id: 'm_dash15', text: 'Use DASH 15 times', reward: { coins: 80 }, check: (s) => [Math.min(s.stats.dashes, 15), 15] },
    { id: 'm_grav10', text: 'Use GRAVITY SHIFT 10 times', reward: { coins: 80 }, check: (s) => [Math.min(s.stats.gravities, 10), 10] },
    { id: 'm_combo12', text: 'Reach COMBO x12', reward: { crystals: 2 }, check: (s) => [Math.min(s.stats.bestCombo, 12), 12] },
    { id: 'm_coins60', text: 'Collect 60 coins in one run', reward: { coins: 150 }, check: (s) => [Math.min(s.stats.bestRunCoins, 60), 60] },
    { id: 'm_blocks30', text: 'Shatter 30 blocks', reward: { coins: 120 }, check: (s) => [Math.min(s.stats.blocks, 30), 30] },
    { id: 'm_fever5', text: 'Trigger FEVER 5 times', reward: { crystals: 3 }, check: (s) => [Math.min(s.stats.fevers, 5), 5] },
    { id: 'm_floor50', text: 'Reach FLOOR 50', reward: { crystals: 5 }, check: (s) => [Math.min(s.bestFloor, 50), 50] },
    { id: 'm_boss1', text: 'Defeat the REACTOR CORE', reward: { crystals: 10 }, check: (s) => [Math.min(s.stats.bossKills, 1), 1] },
    { id: 'm_depth1000', text: 'Reach 1000m (ENDLESS)', reward: { crystals: 15 }, check: (s) => [Math.min(s.bestDepth, 1000), 1000] },
    { id: 'm_runs25', text: 'Play 25 runs', reward: { coins: 300 }, check: (s) => [Math.min(s.stats.runs, 25), 25] },
  ];

  FS.Upgrades = {
    PERM,
    POWERUPS,
    SKINS,
    MISSIONS,
    permCost,
    baseStats,
    rollPowerups,
    getPower: (id) => POWERUPS.find((p) => p.id === id),
    getSkin: (id) => SKINS.find((s) => s.id === id) || SKINS[0],
    buyPerm(save, id) {
      const def = PERM.find((d) => d.id === id);
      const lvl = save.permanentUpgrades[id];
      if (!def || lvl >= def.max) return false;
      const c = permCost(def, lvl);
      if (save.coins < c.coins || save.crystals < c.crystals) return false;
      save.coins -= c.coins;
      save.crystals -= c.crystals;
      save.permanentUpgrades[id] = lvl + 1;
      return true;
    },
    missionsReady(save) {
      return MISSIONS.filter((m) => {
        if (save.missionsClaimed.indexOf(m.id) >= 0) return false;
        const [c, t] = m.check(save);
        return c >= t;
      }).length;
    },
  };
})();
