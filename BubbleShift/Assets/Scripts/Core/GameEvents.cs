using System;
using BubbleShift.Grid;

namespace BubbleShift.Core
{
    /// <summary>
    /// Lightweight static event hub. Systems raise and subscribe here instead
    /// of holding hard references to each other, which keeps the architecture
    /// modular (no giant GameManager, no FindObjectOfType in the gameplay loop).
    ///
    /// IMPORTANT: every subscriber MUST unsubscribe in OnDisable/OnDestroy to
    /// avoid leaks and calls into destroyed objects when reloading a scene.
    /// </summary>
    public static class GameEvents
    {
        // ---- Session / state ----
        public static event Action<GameState> OnGameStateChanged;

        // ---- Shooter ----
        /// <summary>Raised the instant a bubble leaves the cannon.</summary>
        public static event Action OnBubbleFired;
        /// <summary>Raised when the flying bubble attaches to the grid (coord).</summary>
        public static event Action<GridCoord> OnBubbleAttached;
        /// <summary>Raised when the shooter reloads (current, next color).</summary>
        public static event Action<BubbleColor, BubbleColor> OnShooterReloaded;

        // ---- Board / matches (used from Phase 2 onward) ----
        public static event Action<int, int> OnMatchCleared;      // (groupSize, chainIndex)
        public static event Action<int> OnChainStep;              // chain multiplier reached
        public static event Action<BoardOrientation> OnBoardRotated;

        // -------------------------------------------------------------------
        // Raise helpers (null-safe). Systems call these; nobody invokes the
        // events directly so we keep a single choke point for debugging.
        // -------------------------------------------------------------------
        public static void RaiseGameStateChanged(GameState s) => OnGameStateChanged?.Invoke(s);
        public static void RaiseBubbleFired() => OnBubbleFired?.Invoke();
        public static void RaiseBubbleAttached(GridCoord c) => OnBubbleAttached?.Invoke(c);
        public static void RaiseShooterReloaded(BubbleColor cur, BubbleColor next) => OnShooterReloaded?.Invoke(cur, next);
        public static void RaiseMatchCleared(int size, int chain) => OnMatchCleared?.Invoke(size, chain);
        public static void RaiseChainStep(int mult) => OnChainStep?.Invoke(mult);
        public static void RaiseBoardRotated(BoardOrientation o) => OnBoardRotated?.Invoke(o);

        /// <summary>
        /// Clear all subscriptions. Call on hard scene teardown so stale
        /// delegates from a previous session never linger.
        /// </summary>
        public static void ClearAll()
        {
            OnGameStateChanged = null;
            OnBubbleFired = null;
            OnBubbleAttached = null;
            OnShooterReloaded = null;
            OnMatchCleared = null;
            OnChainStep = null;
            OnBoardRotated = null;
        }
    }
}
