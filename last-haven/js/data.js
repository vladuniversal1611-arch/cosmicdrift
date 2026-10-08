/* Game data: items, recipes, buildables, world objects, loot tables, zombies, locations. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  // ---------------- custom SVG icons (emoji for the rest) ----------------
  const SVG = {
    wood: '<svg viewBox="0 0 24 24"><rect x="1.5" y="7" width="18" height="10.5" rx="4" fill="#8a4f22"/><rect x="1.5" y="7" width="18" height="4" rx="2" fill="#a8622b"/><ellipse cx="19" cy="12.25" rx="3.6" ry="5.25" fill="#e8b27a"/><ellipse cx="19" cy="12.25" rx="2" ry="3" fill="#c98a4b"/></svg>',
    stone: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#6f7686"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#b9bfcc"/><path d="M13.4 11.1l5.6-3.4 2.5 8.2-5 4.6z" fill="#545a68"/><path d="M5.3 8.5l8.1 2.6-2.1 9.9H7.6l-5.1-4.5z" fill="#8c93a3"/></svg>',
    iron_ore: '<svg viewBox="0 0 24 24"><path d="M2.5 16.5l2.8-8 6.4-3.6 7.3 2.8 2.5 8.2-5 4.6H7.6z" fill="#5e524d"/><path d="M5.3 8.5l6.4-3.6 7.3 2.8-5.6 3.4z" fill="#9a8a82"/><circle cx="8.5" cy="14" r="1.9" fill="#e0703a"/><circle cx="15.5" cy="15.5" r="1.5" fill="#e0703a"/><circle cx="12" cy="8.2" r="1.3" fill="#ffa868"/></svg>',
    iron_bar: '<svg viewBox="0 0 24 24"><path d="M1.5 18l4.2-9h12.6l4.2 9z" fill="#7c8599"/><path d="M5.7 9h12.6l-2 4.3H7.7z" fill="#d9e0ec"/><path d="M1.5 18l4.2-9 2 4.3L5.5 18z" fill="#a1aabd"/><path d="M22.5 18l-4.2-9-2 4.3 2.2 4.7z" fill="#5c6477"/></svg>',
    plank: '<svg viewBox="0 0 24 24"><rect x="2" y="4.5" width="20" height="5" rx="1.2" fill="#d79a55"/><rect x="2" y="10.5" width="20" height="5" rx="1.2" fill="#c0803f"/><rect x="2" y="16.5" width="20" height="4.5" rx="1.2" fill="#a86b30"/><path d="M5 7h6M13 13h6M6 18.7h5" stroke="#7a4a1f" stroke-width="1.1" stroke-linecap="round"/></svg>',
    scrap: '<svg viewBox="0 0 24 24"><path d="M3 15l5-8 6 2-2 5 7-1-2 7-9 1z" fill="#8a92a3"/><path d="M8 7l6 2-2 5-6-1z" fill="#c3cad6"/><circle cx="16" cy="18" r="1.4" fill="#5a6070"/><path d="M14 4l5 3-2 3-4-2z" fill="#b0603a"/></svg>',
    cloth: '<svg viewBox="0 0 24 24"><path d="M3 8c3-3 6 0 9-2s6-2 9 1v10c-3-2-6 0-9 1s-6-1-9 1z" fill="#c9b79a"/><path d="M3 8c3-3 6 0 9-2s6-2 9 1" stroke="#fff6e0" stroke-width="1.2" fill="none"/><path d="M7 11l3 6M14 10l2 7" stroke="#9c8a6c" stroke-width="1" fill="none"/></svg>',
    rope: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="8.5" ry="6.5" fill="none" stroke="#b78a52" stroke-width="3.2"/><ellipse cx="12" cy="13" rx="4.5" ry="3.2" fill="none" stroke="#d6aa6c" stroke-width="2.6"/><path d="M19 9l3-4" stroke="#b78a52" stroke-width="2.6" stroke-linecap="round"/></svg>',
    gunpowder: '<svg viewBox="0 0 24 24"><path d="M4 20c1-6 4-9 8-9s7 3 8 9z" fill="#2b2b30"/><path d="M8 11l1-5h6l1 5z" fill="#8a3a2a"/><path d="M8.5 6h7" stroke="#e8c070" stroke-width="1.6"/><circle cx="10" cy="17" r=".9" fill="#5a5a66"/><circle cx="14" cy="16" r=".9" fill="#5a5a66"/></svg>',
    water_dirty: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="3" rx="1" fill="#6b6f80"/><path d="M6 6h12l-1 15H7z" fill="#cfd6e2" opacity=".55"/><path d="M6.6 11h10.8l-.7 10H7.3z" fill="#8a6f3e"/><path d="M8 13h2" stroke="#c9b07a" stroke-width="1.2"/></svg>',
    water_clean: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="3" rx="1" fill="#2f8cff"/><path d="M6 6h12l-1 15H7z" fill="#cfe9ff" opacity=".6"/><path d="M6.6 10h10.8l-.8 11H7.4z" fill="#4fc3ff"/><path d="M8.5 12v6" stroke="#e6f8ff" stroke-width="1.4" stroke-linecap="round"/></svg>',
    medkit: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="14" rx="2.5" fill="#e8434a"/><rect x="8.5" y="3" width="7" height="4" rx="1.2" fill="none" stroke="#b02a30" stroke-width="1.8"/><path d="M12 9.5v7M8.5 13h7" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>',
    ammo: '<svg viewBox="0 0 24 24"><g fill="#d9a63a"><rect x="4" y="9" width="4" height="11" rx=".8"/><rect x="10" y="9" width="4" height="11" rx=".8"/><rect x="16" y="9" width="4" height="11" rx=".8"/></g><g fill="#b8bfcc"><path d="M4 9c0-4 4-4 4 0z"/><path d="M10 9c0-4 4-4 4 0z"/><path d="M16 9c0-4 4-4 4 0z"/></g></svg>',
    rifle: '<svg viewBox="0 0 24 24"><path d="M1.5 11h15l2-2h4v3h-3l-1 2H9l-2 5H4l1-5H1.5z" fill="#3b3f4a"/><path d="M4 14h3l-2 5H3z" fill="#7a4a24"/><rect x="9" y="9.5" width="5" height="1.6" fill="#7c8599"/></svg>',
    scrap_armor: '<svg viewBox="0 0 24 24"><path d="M5 4l4-1 3 2 3-2 4 1 2 6-3 1v10H6V11L3 10z" fill="#7c8599"/><path d="M6 11h12v3H6z" fill="#5c6477"/><circle cx="9" cy="17" r="1" fill="#c3cad6"/><circle cx="15" cy="17" r="1" fill="#c3cad6"/></svg>',
  };
  const EMOJI = {
    fiber: '🌿', berries: '🍓', carrot: '🥕', canned: '🥫', stew: '🍲', soda: '🥤', bandage: '🩹',
    stone_axe: '🪓', iron_axe: '🪓', stone_pick: '⛏️', iron_pick: '⛏️', club: '🏏', machete: '🔪', pistol: '🔫',
    rag_vest: '🦺', fists: '✊',
  };

  // type: res | food | med | tool | weapon | armor | ammo
  const ITEMS = {
    wood: { name: 'Wood', type: 'res', stack: 30 },
    stone: { name: 'Stone', type: 'res', stack: 30 },
    fiber: { name: 'Plant Fiber', type: 'res', stack: 30 },
    iron_ore: { name: 'Iron Ore', type: 'res', stack: 20 },
    scrap: { name: 'Scrap Metal', type: 'res', stack: 20 },
    cloth: { name: 'Cloth Rags', type: 'res', stack: 20 },
    gunpowder: { name: 'Gunpowder', type: 'res', stack: 20 },
    plank: { name: 'Planks', type: 'res', stack: 30 },
    iron_bar: { name: 'Iron Bar', type: 'res', stack: 20 },
    rope: { name: 'Rope', type: 'res', stack: 20 },
    berries: { name: 'Berries', type: 'food', stack: 20, food: 8, water: 3 },
    carrot: { name: 'Carrot', type: 'food', stack: 20, food: 14 },
    canned: { name: 'Canned Food', type: 'food', stack: 10, food: 35, water: 5 },
    stew: { name: 'Hearty Stew', type: 'food', stack: 5, food: 55, water: 20, hp: 10 },
    soda: { name: 'Soda', type: 'food', stack: 10, water: 25, food: 4 },
    water_dirty: { name: 'Dirty Water', type: 'food', stack: 10, water: 15, hp: -6 },
    water_clean: { name: 'Clean Water', type: 'food', stack: 10, water: 35 },
    bandage: { name: 'Bandage', type: 'med', stack: 10, hp: 20 },
    medkit: { name: 'Medkit', type: 'med', stack: 5, hp: 60 },
    stone_axe: { name: 'Stone Axe', type: 'tool', tool: 'axe', power: 1, dur: 45, stack: 1 },
    iron_axe: { name: 'Iron Axe', type: 'tool', tool: 'axe', power: 2, dur: 140, stack: 1, tier: 'II' },
    stone_pick: { name: 'Stone Pickaxe', type: 'tool', tool: 'pick', power: 1, dur: 45, stack: 1 },
    iron_pick: { name: 'Iron Pickaxe', type: 'tool', tool: 'pick', power: 2, dur: 140, stack: 1, tier: 'II' },
    club: { name: 'Wooden Club', type: 'weapon', dmg: 15, rate: 0.6, range: 1.35, dur: 60, stack: 1 },
    machete: { name: 'Machete', type: 'weapon', dmg: 30, rate: 0.5, range: 1.45, dur: 140, stack: 1 },
    pistol: { name: 'Pistol', type: 'weapon', dmg: 34, rate: 0.45, range: 6, ammo: 'ammo', dur: 220, stack: 1 },
    rifle: { name: 'Rifle', type: 'weapon', dmg: 70, rate: 0.95, range: 8.5, ammo: 'ammo', dur: 220, stack: 1 },
    ammo: { name: '9mm Ammo', type: 'ammo', stack: 60 },
    rag_vest: { name: 'Rag Vest', type: 'armor', armor: 0.15, dur: 90, stack: 1 },
    scrap_armor: { name: 'Scrap Armor', type: 'armor', armor: 0.35, dur: 220, stack: 1 },
  };
  const FISTS = { name: 'Fists', type: 'weapon', dmg: 6, rate: 0.55, range: 1.25 };

  // station: hands | workbench | campfire | furnace
  const r = (id, station, level, out, inp) => ({ id, station, level, out, in: inp });
  const RECIPES = [
    r('rope', 'hands', 1, { rope: 1 }, { fiber: 3 }),
    r('stone_axe', 'hands', 1, { stone_axe: 1 }, { wood: 3, stone: 2, fiber: 3 }),
    r('stone_pick', 'hands', 1, { stone_pick: 1 }, { wood: 3, stone: 3, fiber: 3 }),
    r('club', 'hands', 1, { club: 1 }, { wood: 5, fiber: 2 }),
    r('bandage', 'hands', 1, { bandage: 1 }, { cloth: 2 }),
    r('plank', 'workbench', 2, { plank: 2 }, { wood: 3 }),
    r('rag_vest', 'workbench', 3, { rag_vest: 1 }, { cloth: 6, rope: 2 }),
    r('iron_axe', 'workbench', 4, { iron_axe: 1 }, { plank: 2, iron_bar: 2, rope: 1 }),
    r('iron_pick', 'workbench', 4, { iron_pick: 1 }, { plank: 2, iron_bar: 3, rope: 1 }),
    r('machete', 'workbench', 5, { machete: 1 }, { iron_bar: 3, plank: 1, cloth: 1 }),
    r('medkit', 'workbench', 5, { medkit: 1 }, { bandage: 2, rope: 1, berries: 2 }),
    r('ammo', 'workbench', 6, { ammo: 10 }, { iron_bar: 1, gunpowder: 1 }),
    r('pistol', 'workbench', 6, { pistol: 1 }, { iron_bar: 4, scrap: 6, plank: 1 }),
    r('scrap_armor', 'workbench', 8, { scrap_armor: 1 }, { scrap: 10, iron_bar: 4, cloth: 4 }),
    r('rifle', 'workbench', 10, { rifle: 1 }, { iron_bar: 8, scrap: 10, plank: 3 }),
    r('water_clean', 'campfire', 2, { water_clean: 1 }, { water_dirty: 1, wood: 1 }),
    r('stew', 'campfire', 4, { stew: 1 }, { carrot: 2, berries: 2, water_clean: 1 }),
    r('iron_bar', 'furnace', 3, { iron_bar: 1 }, { iron_ore: 2, wood: 1 }),
  ];
  const STATIONS = {
    hands: { name: 'Hands', emoji: '✋' },
    workbench: { name: 'Workbench', emoji: '🛠️' },
    campfire: { name: 'Campfire', emoji: '🔥' },
    furnace: { name: 'Furnace', emoji: '🏭' },
  };

  // Things you can place at your shelter.
  const BUILD = {
    wood_wall: { name: 'Wooden Wall', cat: 'walls', level: 1, cost: { wood: 6 }, hp: 160, wall: true, h: 34 },
    wood_door: { name: 'Wooden Door', cat: 'walls', level: 2, cost: { plank: 4, rope: 1 }, hp: 140, door: true, h: 34 },
    stone_wall: { name: 'Stone Wall', cat: 'walls', level: 3, cost: { stone: 8, wood: 2 }, hp: 420, wall: true, h: 36 },
    metal_wall: { name: 'Metal Wall', cat: 'walls', level: 6, cost: { iron_bar: 3, scrap: 3 }, hp: 900, wall: true, h: 38 },
    workbench: { name: 'Workbench', cat: 'craft', level: 1, cost: { wood: 15, stone: 6 }, station: 'workbench', h: 30 },
    campfire: { name: 'Campfire', cat: 'craft', level: 1, cost: { wood: 6, stone: 5 }, station: 'campfire', h: 26, walkable: false },
    furnace: { name: 'Furnace', cat: 'craft', level: 3, cost: { stone: 25, wood: 8 }, station: 'furnace', h: 50 },
    chest: { name: 'Storage Chest', cat: 'craft', level: 2, cost: { plank: 8 }, storage: 30, h: 22 },
    garden: { name: 'Garden Bed', cat: 'farm', level: 4, cost: { plank: 4, fiber: 6 }, produce: { item: 'carrot', n: 3, every: 120 }, h: 14 },
    collector: { name: 'Water Collector', cat: 'farm', level: 5, cost: { plank: 4, cloth: 3, scrap: 2 }, produce: { item: 'water_clean', n: 2, every: 90 }, h: 40 },
  };
  const BUILD_ORDER = ['wood_wall', 'wood_door', 'stone_wall', 'metal_wall', 'workbench', 'campfire', 'chest', 'furnace', 'garden', 'collector'];

  // World objects. tool: required tool kind. hits: hits before depletion. drops: per hit.
  const NODES = {
    tree: { tool: 'axe', hits: 5, drops: { wood: 2 }, respawn: 90, block: true, h: 70, xp: 2 },
    rock: { tool: 'pick', hits: 5, drops: { stone: 2 }, respawn: 100, block: true, h: 30, xp: 2 },
    iron_rock: { tool: 'pick', hits: 6, drops: { iron_ore: 1 }, respawn: 140, block: true, h: 32, xp: 3 },
    bush: { tool: null, hits: 1, drops: { fiber: 2, berries: 1 }, respawn: 60, block: false, h: 26, xp: 1 },
    branch: { tool: null, hits: 1, drops: { wood: 2 }, respawn: 80, block: false, h: 8, xp: 1, pickup: true },
    pebble: { tool: null, hits: 1, drops: { stone: 2 }, respawn: 80, block: false, h: 8, xp: 1, pickup: true },
  };
  const CONTAINERS = {
    crate: { name: 'Crate', loot: 'crate', h: 26, emoji: '📦' },
    car: { name: 'Wrecked Car', loot: 'car', h: 30, size: 1 },
    fridge: { name: 'Fridge', loot: 'fridge', h: 44 },
    cabinet: { name: 'Medical Cabinet', loot: 'med', h: 40 },
    mil_crate: { name: 'Military Crate', loot: 'military', h: 26 },
  };
  // [item, min, max, chance]
  const LOOT = {
    crate: [['cloth', 2, 4, 0.6], ['scrap', 1, 3, 0.5], ['canned', 1, 1, 0.3], ['soda', 1, 1, 0.3], ['rope', 1, 1, 0.2], ['gunpowder', 1, 2, 0.12], ['bandage', 1, 1, 0.2], ['water_clean', 1, 1, 0.15]],
    car: [['scrap', 2, 5, 0.85], ['gunpowder', 1, 2, 0.25], ['cloth', 1, 3, 0.4], ['soda', 1, 1, 0.2], ['ammo', 4, 10, 0.08], ['rope', 1, 1, 0.15]],
    fridge: [['canned', 1, 2, 0.6], ['soda', 1, 2, 0.55], ['water_clean', 1, 1, 0.4], ['carrot', 1, 3, 0.3]],
    med: [['bandage', 1, 3, 0.75], ['medkit', 1, 1, 0.35], ['cloth', 1, 2, 0.4]],
    military: [['ammo', 10, 20, 0.6], ['gunpowder', 2, 4, 0.55], ['iron_bar', 1, 3, 0.4], ['scrap', 3, 6, 0.5], ['medkit', 1, 1, 0.2], ['canned', 1, 2, 0.3], ['pistol', 1, 1, 0.04], ['scrap_armor', 1, 1, 0.03]],
    zombie: [['cloth', 1, 2, 0.45], ['scrap', 1, 1, 0.2], ['bandage', 1, 1, 0.06], ['ammo', 2, 5, 0.05]],
    brute: [['scrap', 2, 4, 0.8], ['gunpowder', 1, 2, 0.4], ['cloth', 2, 3, 0.6], ['medkit', 1, 1, 0.12], ['ammo', 4, 8, 0.25]],
    supply: [['canned', 1, 2, 0.8], ['water_clean', 1, 2, 0.8], ['bandage', 1, 2, 0.6], ['ammo', 6, 12, 0.35], ['medkit', 1, 1, 0.25], ['iron_bar', 1, 2, 0.3]],
  };

  const ZOMBIES = {
    walker: { name: 'Walker', hp: 40, speed: 0.95, dmg: 8, rate: 1.2, xp: 10, loot: 'zombie', skin: '#8fa77a', shirt: '#5a6a8a', scale: 1 },
    runner: { name: 'Runner', hp: 26, speed: 2.1, dmg: 6, rate: 0.85, xp: 12, loot: 'zombie', skin: '#a3b08a', shirt: '#8a4a4a', scale: 0.92 },
    brute: { name: 'Brute', hp: 150, speed: 0.75, dmg: 22, rate: 1.6, xp: 40, loot: 'brute', skin: '#7a9a6a', shirt: '#3a3a44', scale: 1.35 },
  };

  // Locations. ground: palette key in world.js. nodes/containers/zombies: counts.
  const LOCATIONS = [
    { id: 'base', name: 'Your Shelter', emoji: '🏕️', level: 1, size: 24, ground: 'grass', danger: 0,
      desc: 'Your safe place. Build walls, craft and store loot.', nodes: { tree: 16, rock: 8, bush: 10, branch: 10, pebble: 10 }, containers: {}, zombies: {}, well: true },
    { id: 'forest', name: 'Pine Forest', emoji: '🌲', level: 1, size: 30, ground: 'forest', danger: 1,
      desc: 'Lots of wood and berries. A few walkers.', nodes: { tree: 34, bush: 16, branch: 10, pebble: 6, rock: 6 }, containers: { crate: 4 }, zombies: { walker: 7 }, ruins: 4 },
    { id: 'quarry', name: 'Old Quarry', emoji: '⛰️', level: 3, size: 30, ground: 'dirt', danger: 2,
      desc: 'Stone and iron ore. Watch for runners.', nodes: { rock: 18, iron_rock: 12, pebble: 10, tree: 6, bush: 4 }, containers: { crate: 3, car: 2 }, zombies: { walker: 8, runner: 3 }, ruins: 3 },
    { id: 'gas', name: 'Gas Station', emoji: '⛽', level: 4, size: 30, ground: 'asphalt', danger: 3,
      desc: 'Cars full of scrap, food in the fridges.', nodes: { tree: 5, bush: 5, pebble: 4 }, containers: { car: 7, crate: 5, fridge: 3 }, zombies: { walker: 9, runner: 5 }, ruins: 8 },
    { id: 'suburbs', name: 'Suburbs', emoji: '🏘️', level: 6, size: 32, ground: 'suburb', danger: 4,
      desc: 'Abandoned homes: medicine and supplies. A brute roams here.', nodes: { tree: 8, bush: 6 }, containers: { fridge: 5, cabinet: 4, car: 4, crate: 4 }, zombies: { walker: 12, runner: 5, brute: 1 }, ruins: 12 },
    { id: 'military', name: 'Military Checkpoint', emoji: '🪖', level: 8, size: 32, ground: 'concrete', danger: 5,
      desc: 'Ammo, gunpowder and armor — guarded by a horde.', nodes: { pebble: 4 }, containers: { mil_crate: 8, cabinet: 2, car: 3 }, zombies: { walker: 12, runner: 7, brute: 4 }, ruins: 14 },
  ];
  const LOC_BY_ID = {};
  LOCATIONS.forEach((l) => { LOC_BY_ID[l.id] = l; });

  const imgCache = {};
  /** Image for drawing an item icon on the canvas. */
  function iconImg(id) {
    if (imgCache[id]) return imgCache[id];
    const im = new Image();
    if (SVG[id]) {
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG[id].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" '));
    } else {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 48;
      const g = cv.getContext('2d');
      g.font = '38px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(EMOJI[id] || '❔', 24, 27);
      im.src = cv.toDataURL();
    }
    imgCache[id] = im;
    return im;
  }

  /** HTML icon for the DOM. */
  function iconHtml(id) {
    const it = ITEMS[id];
    const tier = it && it.tier ? '<b class="tier">' + it.tier + '</b>' : '';
    if (SVG[id]) return '<i class="ico">' + SVG[id] + tier + '</i>';
    return '<i class="ico emo">' + (EMOJI[id] || '❔') + tier + '</i>';
  }

  BI.Data = { ITEMS, FISTS, RECIPES, STATIONS, BUILD, BUILD_ORDER, NODES, CONTAINERS, LOOT, ZOMBIES, LOCATIONS, LOC_BY_ID, SVG, EMOJI, iconImg, iconHtml };
})();
