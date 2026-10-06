# Hill Rush economy model

Generated with `node qa/economy_sim.js`, which drives the game's own physics,
terrain, pickups and stunt scoring with two bot "players", then simulates
progression from the measured runs. Bots react every frame, so they drive
further than real players; treat distances as an upper bound and the
coin/minute figures as the useful signal.

## Units

- 1 m = 20 px of track (the jeep is about 5 m long).
- Coins on the track are worth 5; 25-value coins appear more often further
  out; a 100 coin sits in the arc over some big jumps.
- Saves from before v5 are migrated: coins x5, distances / 2.

## Sources

| Source | Amount |
|---|---|
| Track pickups | ~1,500–3,000 coins per minute of driving |
| Stunts | Flip 300 (double x1.5 each), air time 50 per 0.5 s over 1 s, long air 300, perfect landing 120 (x2 with a flip) |
| Daily missions | 3 per day, 1,500–4,500 each |
| Login streak | 500, 750, 1,000, 1,500, 2,000, 3,000, 6,000 |

## Sinks

| Item | Cost |
|---|---|
| Pickup / Moto / Monster | 15,000 / 25,000 / 45,000 |
| Upgrades (6 per vehicle, 6 levels) | base 400–900, x1.78–1.84 per level, ~150k per vehicle |
| Maps (or reach the distance) | Mountains 700 m / 12k, Arctic 1,400 m / 30k, Desert 2,200 m / 55k, Moon 3,200 m / 90k |

Total sink is roughly 700k coins, about 5–6 hours for an average player.

## Simulated pacing

| Milestone | Novice | Average |
|---|---|---|
| First upgrade | after run 1 (~2 min) | after run 1 (~2 min) |
| Pickup | ~11 min | ~41 min |
| Moto | ~35 min | ~81 min |
| Monster | ~82 min | ~167 min |
| First vehicle fully upgraded | ~2.5 h | ~3.9 h |

## Checks

- **Dead upgrades:** none. With a careful bot, each upgrade alone at level 6
  improves distance (engine +17%, suspension +10%, tires +7%, 4WD +6%,
  turbo +5%); fuel tank extends runs that end by running dry. 4WD used to
  stop mattering after level 1 and turbo used to cause back-flips; both fixed.
- **Vehicle dominance:** none. Monster earns the most per minute at mid
  levels but is fuel-limited (1.3x consumption); Moto earns the most from
  stunts but crashes most; Pickup is the steady long-distance car.
- **Grind wall:** none in the first hour — a purchase lands every 10–40
  minutes. Late levels are deliberately expensive (level 6 of an upgrade
  costs ~15–25x level 1).
