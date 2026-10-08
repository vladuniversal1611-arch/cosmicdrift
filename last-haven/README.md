# Last Haven

A zombie survival-craft game for mobile browsers, in the spirit of Prey Day / Last Day on Earth. Written in pure HTML5, CSS3, vanilla JavaScript and Canvas 2D: no engine, no libraries, no asset files.

Open `index.html` in a browser (double-click works, no server needed). To get a single self-contained file, run `python3 tools/build_single.py`.

## The loop

1. **Survive.** Health, hunger and thirst drain over time. If hunger or thirst reaches 0, you start losing health. Eat, drink and heal by tapping ❤️ 🍖 💧 (keys 1-2-3).
2. **Gather.** Pick up branches and stones and pull fiber and berries from bushes by hand. Trees need an axe and rocks need a pickaxe. Tools wear out.
3. **Craft.** You can craft by hand anywhere. Stations only work at your shelter: Workbench (planks, iron tools, machete, pistol, ammo, armor), Campfire (boil water, stew) and Furnace (iron bars).
4. **Build.** Your shelter is a free grid. Place wooden, stone or metal walls, doors, stations, a storage chest, a garden bed and a water collector. Demolish mode refunds half the cost.
5. **Defend.** From level 3, hordes attack the shelter. Zombies break walls that are in their way.
6. **Scavenge.** Travel from the MAP to generated locations: Pine Forest, Old Quarry, Gas Station, Suburbs and Military Checkpoint. Each one is harder than the last. Search crates, cars, fridges and cabinets, then walk back to the 🚐 to return home.
7. **Fight.** Use fists, a club or a machete, or a pistol or rifle (crafted ammo). Gunshots attract nearby zombies. Walkers are slow, runners are fast and brutes are tanks.

If you die, you lose your backpack but keep your equipped weapon and armor, and respawn at the shelter.

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move | joystick (bottom-left) | WASD / arrows |
| Act: chop, mine, loot, fight, use | hold the big button | hold Space / E |
| Backpack · Craft · Build · Map | round buttons | I · C · B · M |
| Heal · Eat · Drink | tap the bars | 1 · 2 · 3 |

## Files

```
index.html, style.css
js/data.js        items, recipes, buildables, resources, loot tables, zombies, locations
js/inventory.js   slot-based backpack/chests with stacks & durability
js/world.js       iso grid, location generation, collisions, ground cache
js/entities.js    survivor + zombie AI and drawing
js/art.js         procedural sprites for the world
js/renderer.js    camera, depth sorting, particles, tracers, night lighting
js/game.js        state machine and all gameplay
js/ui.js          HUD, backpack, crafting, building, map, loot, popups
js/quests.js      XP/levels and the 27-step tutorial quest chain
js/input.js, audio.js, ads.js (simulated AdManager), save.js (localStorage), main.js
```
