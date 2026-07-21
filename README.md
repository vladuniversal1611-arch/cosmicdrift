# Cosmic Drift

**Production-ready foundations** underpin everything: a versioned, crash-safe
save (backup slot + corruption recovery + a cloud-sync seam), a runtime
**Quality/accessibility** layer (Reduced Motion, Color-Blind symbols, Low
Performance Mode, Large UI) the renderer/particles read live, full
**localization** (`t('key')`, drop-in language packs, zero hard-coded UI
strings), vendor-agnostic **analytics** hooks, a player-first **monetization**
architecture (entitlements, opt-in rewarded ads, frequency-capped interstitials
— nothing shown until a provider is attached), and separate audio buses. All
architecture-only where a vendor is required; verified at 60 FPS on phone and
tablet portrait resolutions.


A **premium, handcrafted UI** wraps the whole game — a living floating-island
main menu (drifting clouds, flying dragons, waterfalls, falling leaves), glossy
gold-framed buttons, glass panels, a rolling-number top bar, a full celebratory
Level Complete (confetti, fireworks, coin-raining reward chest, dragon flyby),
plus Shop, Collection, Events, Settings and Pause screens — all canvas-drawn,
portrait-first and 60 FPS. No flat, dark or generic UI.


A premium, mobile-first **cosmic shape-placement puzzle**. Place drifting shapes
on a board, grow your companion dragon, and ascend through cosmic zones.

Built with **HTML5 + CSS + vanilla ES6 + Canvas 2D** — no external libraries,
targeting a stable **60 FPS** and clean **Android WebView** export.

> On top of the clean, independent-systems foundation, the **core gameplay** is
> implemented and heavily polished: drag crystal relics from the tray onto an
> engraved stone board, complete rows/columns to send a travelling-energy clear
> rippling through them, and chain clears to build combos that charge the Dragon
> Energy meter.
>
> The board is also **alive**: the *Living Board* adds ten modular interactive
> tile types — Ancient Stone, Moss, Crystal, Frozen, Corrupted, Portal, Dragon
> Rune, Treasure, Ancient Tree and Magic Fog — each with idle, activation and
> destroy animations, particles and sound hooks. Play is organised into themed
> **worlds** that each introduce one new mechanic, so hundreds of levels stay
> fresh and early levels are never overloaded.
>
> A second goal layer, *Structure Patterns*, turns placed crystals into
> architecture: form a 2×2, L, T, long line or cross and it **rises** into a
> Magic Crystal, Tower Foundation, Dragon Shrine, Bridge or Energy Core —
> granting a permanent per-level score multiplier, charging Dragon Energy and
> evolving the board's look. The board highlights the one cell that completes a
> nearby shape, so it teaches itself. The controls stay pure drag-and-place.
>
> Every interaction is wrapped in a premium **juice** layer (Royal Match / Dream
Games feel): dragged relics enlarge, glow, cast a shadow and tilt toward your
finger; valid targets pulse blue with sparkles, invalid ones flash red and
shake; placements land with a ripple, dust and a micro-shake; line clears throw
a screen flash; and combos escalate x2 → x3 → x5 (dragon roar) → x8 (slow-motion
+ camera zoom + golden lighting + a storm of particles). Buttons bounce and
spark, numbers roll, meters glow — all eased, all 60 FPS, and all muted when the
reduced-motion setting is on.

Every level sets **objectives** (1–3 combined goals like "Grow 5 Magic Flowers ·
Destroy 7 Corruption · Collect 38 Crystal Energy") that must be met to advance —
so the game is goal-driven, not endless. The tray is filled by an **intelligent
piece generator**: it reads the live board, tunes shape difficulty to the level
and the player, guarantees every hand is solvable (no unlucky losses), and
occasionally offers a satisfying line-clear "save" — with invisible dynamic
difficulty that eases up after losses and firms up after wins.

Long-term, a *World Progression* meta layer turns every cleared level into
> visible growth. Levels reward **Magic Essence, Gold, Building Materials** and
> Dragon Energy; every 5 levels unlocks a **restoration** (Ancient Bridge, World
> Tree, Crystal Tower, Dragon Nest, …) that the player rebuilds through staged
> visuals (broken → half → restored) with a cinematic — camera zoom, particles,
> celebrating NPCs and a biome dragon flyby. Progress opens six themed **biomes**
> (Forest, Crystal Valley, Frozen Peaks, Volcano Lands, Sky Islands, Ancient
> Ruins), each reskinning the world and its music. All content is data-driven,
> so it scales to thousands of levels. No monetization.

## Quick start

ES modules need an HTTP origin (not `file://`):

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

You should see the animated cosmic backdrop, the companion-dragon mascot, an
empty board with a tray of pieces, and a title screen with a working **PLAY**
button — proof the full engine, systems and UI stack are wired end-to-end.

## Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the design principles, folder
structure, frame pipeline and a guide to extending the game in future updates.

Systems included in the foundation: **Engine (core)**, **UI**, **Audio**,
**Animation**, **Particles**, **Board**, **Pieces**, **Save**, **World**,
**Dragon**, **Economy**, **Missions**, **Events (live-ops)**, **Shop**,
**Settings** — each self-contained and communicating only via the event bus.
