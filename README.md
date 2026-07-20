# Cosmic Drift

A premium, mobile-first **cosmic shape-placement puzzle**. Place drifting shapes
on a board, grow your companion dragon, and ascend through cosmic zones.

Built with **HTML5 + CSS + vanilla ES6 + Canvas 2D** — no external libraries,
targeting a stable **60 FPS** and clean **Android WebView** export.

> On top of the clean, independent-systems foundation, the **core gameplay** is
> now implemented and heavily polished: drag crystal relics from the tray onto
> an engraved stone board, complete rows/columns to send a travelling-energy
> clear rippling through them, and chain clears to build combos that charge the
> Dragon Energy meter. Dragons and the world map are deliberately still out of
> scope — the focus here is on making the moment-to-moment placement feel great.

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
