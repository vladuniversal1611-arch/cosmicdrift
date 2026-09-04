# BUBBLE SHIFT

A premium mobile puzzle game: Bubble Shooter + chain reactions + a **rotating
board** (Up → Right → Down → Left) + fantasy kingdom progression.

Unity project (Unity 2022 LTS or newer, URP or Built-in 2D both fine).
Target: Android, portrait 1080×1920.

---

## Build Roadmap

| Phase | Scope | Status |
|-------|-------------------------------------------------|--------|
| 1 | Core architecture + Grid + Bubbles + Shooter + Aiming | ✅ done |
| 2 | Match detection + falling bubbles + chain reactions | ⏳ next |
| 3 | Board rotation (the "Shift" mechanic) | ⏳ |
| 4 | Special bubbles + obstacles | ⏳ |
| 5 | Level system (ScriptableObjects, 500+ levels) | ⏳ |
| 6 | UI / UX | ⏳ |
| 7 | Kingdom progression | ⏳ |
| 8 | Save system | ⏳ |
| 9 | Audio + particles + polish | ⏳ |
| 10 | Monetization hooks + Android optimization | ⏳ |

---

## Architecture (modular, event-driven)

Systems never call each other through `FindObjectOfType` in the gameplay loop.
They communicate through the static `GameEvents` hub and Inspector-assigned
references. Each class has ONE responsibility.

```
Core/
  GameEnums.cs        BubbleColor, BoardOrientation, GameState, RotationDirection
  GameEvents.cs       Static event hub (fired/attached/matched/rotated...)
  GameConfig.cs       ScriptableObject: cell size, speeds, palette, min match
  GameManager.cs      Composition root + high-level state machine
Grid/
  GridCoord.cs        Immutable (row,col) struct
  IGridOccupant.cs    Interface so the grid stays decoupled from MonoBehaviours
  GridSystem.cs       Pure square grid: coords, neighbours, matches, connectivity
Bubbles/
  Bubble.cs           MonoBehaviour + IGridOccupant
  BubblePool.cs       Zero-GC pool
  BubbleManager.cs    Spawn / recycle / color selection
Gameplay/
  TrajectorySimulator.cs  Shared predictor (preview == real shot path)
  BoardManager.cs     Owns grid + board pivot + attach logic
  AimController.cs     Pointer input + dotted preview + landing marker
  BubbleShooter.cs    Cannon: current/next bubble, fire, fly, attach, reload
```

### Why a square grid?
The signature mechanic rotates the board 90°. A square grid maps cell (r,c)
cleanly under rotation; a hex grid does not. Matching uses 4-neighbour
connectivity, which stays correct across every orientation.

### Board-local space
All bubbles are parented to a single **Board Root** pivot and positioned in
board-local coordinates centered on that pivot. Aiming and trajectory are
computed in that same local space, so when the board rotates (Phase 3) the
prediction and grid stay valid with no per-bubble fix-ups.

---

## Phase 1 — Unity Scene Setup

Create the scene once; later phases only add systems.

### 1. GameConfig asset
`Assets > Create > BubbleShift > Game Config` → name it `GameConfig`.
Set `cellSize` to match your bubble sprite's world diameter (default 0.64).
Fill the 5 palette colors (Red, Blue, Green, Yellow, Purple).

### 2. Camera
- `Main Camera`, Projection **Orthographic**.
- Add a Canvas later (Phase 6) with **Scale With Screen Size**, reference
  resolution **1080×1920**, Match = 0.5.
- Size the orthographic camera so the board (rows×cols × cellSize) fits with
  headroom for the cannon at the bottom.

### 3. Bubble prefab  → `Assets/Prefabs/Bubbles/Bubble.prefab`
- Empty GameObject `Bubble`.
- Add **SpriteRenderer** with a round glossy bubble sprite (white, tintable).
- Add **Bubble** component (auto-links the SpriteRenderer via Reset/Awake).
- Save as prefab, delete from scene.

### 4. Dot + landing marker prefabs (aim preview)
- `Dot`: SpriteRenderer with a small soft round sprite. Prefab it.
- `LandingMarker`: SpriteRenderer with a ring/hollow-circle sprite. Put one in
  the scene (the AimController toggles it).

### 5. System GameObjects
Create these empty GameObjects in the scene:

| GameObject | Components | Inspector wiring |
|------------|-----------|------------------|
| `GameManager` | `GameManager`, `BubbleManager` | assign BubbleManager + BoardManager + BubbleShooter + AimController |
| `BubbleManager` (can share GameManager object) | `BubbleManager` | Bubble Prefab = Bubble prefab; GameConfig = GameConfig; Prewarm ~96 |
| `Board` | `BoardManager` | GameConfig, BubbleManager; **Board Root** = child transform below |
| `Board/BoardRoot` | (empty Transform) | this is the pivot bubbles parent to |
| `Cannon` | `BubbleShooter` | Board, BubbleManager, GameConfig; **Muzzle** child; **NextSocket** child |
| `Cannon/Muzzle` | (empty) | tip of the cannon (spawn point) |
| `Cannon/NextSocket` | (empty) | where the next-bubble preview sits |
| `AimController` | `AimController` | Board, Shooter, GameConfig, Camera, Muzzle, Dot prefab, dotCount ~40, LandingMarker |

Positioning:
- Put `Board/BoardRoot` at world origin (0,0) or slightly above center.
- Put `Cannon/Muzzle` below the board, centered on X.

### 6. Play
Press Play. You should see:
- 5 pre-filled rows of random bubbles.
- A loaded bubble on the cannon + a next-bubble preview.
- Drag to aim → dotted line reflects off the side walls, landing marker snaps
  to a cell, respecting the minimum aim angle.
- Release → the bubble flies exactly along the previewed path and attaches to
  the grid. The cannon reloads (next → current) automatically.

Matching/clearing is intentionally **not** wired yet — that is Phase 2. At this
point the grid, placement, pooling, aiming, and shooting are fully functional
and testable.

---

## Notes for later phases
- `GameEvents.OnBubbleAttached(coord)` is the hook Phase 2 subscribes to for
  match resolution.
- `GridSystem.FindMatches` and `GetDisconnected` already exist and are unit-
  test friendly (pure C#), ready for Phase 2's clear + drop pass.
- `BoardManager.BoardRoot` is the single transform Phase 3 rotates.
