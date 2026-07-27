# Cosmic Drift — Game Architecture

**Status:** MANDATORY. This is the contract every manager obeys. It is built to
carry the game through years of feature updates without rewrites.

The runtime is a **flat set of single-responsibility managers** that share one
lifecycle and communicate **only through the EventBus**. There is no god-object,
no inheritance web between managers, and no global mutable state.

---

## 1. Core principles (non-negotiable)

1. **One responsibility per manager.** A manager owns exactly one concern.
   Never mix concerns in a single file.
2. **Event-only communication.** Managers talk through `EventBus`
   (`src/core/EventBus.js`). Never call another manager directly when an event
   can express the intent. The single sanctioned escape hatch is a *read-only*
   query via `game.getSystem(name)` for a value you cannot get from an event —
   never stored long-term, never used to mutate another manager.
3. **Uniform lifecycle.** Every manager supports `Initialize()`, `Update(dt)`,
   `Reset()`, `Dispose()` (see §3).
4. **No circular dependencies.** Managers depend on `core/` + `config/` +
   pure `utils/` only, never on each other at module load. Cross-talk is events.
5. **No duplicated code.** Shared logic lives in a pure module under the owning
   feature folder (e.g. `PieceGenerator`, `PlacementValidator`) and is imported.
6. **No global mutable variables.** The only shared mutable object is
   `Quality` (a documented, single-purpose runtime flag store); everything else
   is owned by exactly one manager.
7. **≈500 line ceiling per manager.** Larger concerns split into sub-modules
   under the same folder (types/, helpers). See the tiles/ and pieces/ folders.

---

## 2. Layers

```
core/        EventBus · Time · Canvas · Renderer · InputManager · GameLoop
             System (base class) · SystemManager (registry) · Game (root)
config/      Frozen authoring data (Config, Palette, Biomes, Objectives, …)
             + Quality (the one live runtime-flag object)
utils/       Pure helpers (Easing, MathUtils, Random, Rect, Vec2, ObjectPool…)
i18n/        Localization + string tables
systems/     The managers — one folder per concern, each a `System` subclass
ui/          Scene/UI managers, screens, widgets, theme, asset registry
managers/    ManagerRegistry — the canonical name→module index (data only)
```

`Game` (the **GameManager**) owns the core services and the `SystemManager`.
`SystemManager` holds managers in a deterministic order and drives the frame:
`initAll → updateAll(dt) → renderAll → (resetAll) → destroyAll`.

---

## 3. The lifecycle contract

Defined once on `core/System.js`; inherited by every manager:

| Verb | Wrapper | Override hook | Meaning |
|------|---------|---------------|---------|
| Initialize() | `init()` | `onInit()` | Idempotent one-time setup; siblings exist. |
| Update(dt)   | `update(dt)` | `update(dt)` | Advance by `dt` seconds; skipped when `!enabled`. |
| Reset()      | — | `onReset()` | Return to clean pre-game state; **keeps** subscriptions. |
| Dispose()    | `destroy()` | `onDestroy()` | Detach listeners (auto-tracked via `listen()`) + free. |

`SystemManager.resetAll()` and `Game.reset()` fan `Reset()` out to every manager
and emit `game:reset`. Listeners registered through `this.listen(type, fn)` are
auto-unsubscribed on `Dispose()`, so managers never leak.

---

## 4. The manager set

The canonical vocabulary and where each responsibility lives is enumerated in
**`src/managers/ManagerRegistry.js`** (single source of truth). Summary:

| Manager | Owner key | Status | Responsibility |
|---|---|---|---|
| GameManager | `game` | core | Root: core services + registry + frame loop |
| SceneManager | `ui` | manager | Screen/scene stack |
| BoardManager | `board` | manager | Grid model + board render + placement resolve |
| PieceManager | `pieces` | manager | Tray + drag/drop + commit |
| PieceGenerator | `pieces` | module | Solvable, difficulty-tuned tray generation |
| PlacementValidator | `board` | module | Pure placement rules |
| LineClearSystem | `board` | embedded* | Full row/column detection + clear timeline |
| ComboSystem | `gameplay` | embedded* | Combo chain multiplier |
| ScoreManager | `gameplay` | embedded* | Score + best + payouts |
| MissionManager | `missions` | manager | Quest progress vs events |
| ProgressManager | `level` | manager | Level/world progression + layout |
| SaveManager | `save` | manager | Versioned sliced persistence |
| SettingsManager | `settings` | manager | Settings + accessibility → Quality |
| InputManager | `input` | core | Pointer/touch → tap/down/move/up |
| AudioManager | `audio` | manager | SFX + music |
| AnimationManager | `animation` | manager | Tween registry |
| ParticleManager | `particles` | manager | Pooled particle FX |
| AssetManager | `assets` | module | Key→file registry + loader (singleton) |
| ThemeManager | `theme` | manager | Active theme tokens + asset base path |
| LocalizationManager | `i18n` | module | Key → localized string |
| UIManager | `ui` | manager | Input routing + UI update/render |
| PopupManager | `ui` | embedded* | Modal/popup semantics on the stack |
| TutorialManager | `retention` | embedded* | First-run onboarding steps |
| RewardManager | `worldprogress` | embedded* | Grant + queue reward presentation |
| AnalyticsManager | `analytics` | manager | Vendor-agnostic telemetry taps |
| PerformanceManager | `performance` | manager | FPS sampling + adaptive quality |
| DebugManager | `debug` | manager | Live debug flags + overlays |

`*embedded` = the responsibility is implemented and working inside the listed
owner. It is **named and reserved** here; extraction into its own file is a
mechanical follow-up that must preserve the existing event contract (see §6).

---

## 5. Event contract (selected)

Managers emit descriptive, past-tense/imperative events and never assume a
listener exists. Key channels:

- **Input:** `input:tap|down|move|up`
- **Gameplay:** `game:started|piecePlaced|linesCleared|noClears|over|reset`,
  `gameplay:score|combo|energy|stateChanged`, `level:changed|complete|progress`
- **FX (fire-and-forget):** `fx:shake|flash|ripple|burst`
- **UI/scene:** `ui:playPressed|openWorldMap|openShop|openSettings|…`,
  `ui:modalOpen|modalClose|showReward`
- **Meta:** `reward:granted`, `economy:changed`, `save:loaded`
- **Infra (new):** `perf:sample|quality`, `debug:toggle|state`, `theme:set|changed`

A manager that needs data another manager derives should prefer subscribing to
that manager's broadcast over querying it.

---

## 6. Extraction roadmap (the `embedded` rows)

These are *architecturally named* now and can be lifted into their own files
without behaviour change, each preserving its current events:

1. **PlacementValidator** — already a pure module boundary; `board`/`pieces`
   delegate to it.
2. **ScoreManager + ComboSystem** — split out of `GameplaySystem` via a
   `game:linesCleared → combo:changed → gameplay:score` event chain so neither
   reads the other's state. `GameplaySystem` keeps game-state + screen juice.
3. **LineClearSystem** — lift row/column detection out of `BoardSystem` into a
   pure detector the board calls; the clear-animation timeline stays on `board`.
4. **PopupManager / TutorialManager / RewardManager** — promote the embedded
   coordination into dedicated managers listening to the same events.

Each extraction is verified by asserting the pre/post event stream is
unchanged. Do them one at a time, behind the existing tests/screenshots.

---

## 7. Adding a new manager (checklist)

1. Create `systems/<concern>/<Name>Manager.js` extending `System`; set a unique
   `this.name`; keep it under ~500 lines.
2. Implement only `onInit / update / onReset / onDestroy` as needed. Talk via
   events; never import a sibling manager.
3. Register it in `Game._registerSystems()` at the right order slot.
4. Add its row to `src/managers/ManagerRegistry.js` and this table.
5. Document its events in the file header.
