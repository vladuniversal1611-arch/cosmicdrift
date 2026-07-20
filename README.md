# Cosmic Drift

A premium, mobile-first **cosmic shape-placement puzzle**. Place drifting shapes
on a board, grow your companion dragon, and ascend through cosmic zones.

Built with **HTML5 + CSS + vanilla ES6 + Canvas 2D** — no external libraries,
targeting a stable **60 FPS** and clean **Android WebView** export.

> This repository currently contains the **project foundation only**: a clean,
> production-quality, object-oriented architecture with every system wired up
> and independent. Gameplay rules (placement, matching, scoring, progression)
> are intentionally not implemented yet — the foundation is built to make adding
> them straightforward.

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
