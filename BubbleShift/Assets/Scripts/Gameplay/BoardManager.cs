using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Core;
using BubbleShift.Grid;
using BubbleShift.Bubbles;

namespace BubbleShift.Gameplay
{
    /// <summary>
    /// Owns the playfield: the <see cref="GridSystem"/> data, the board root
    /// transform (the pivot everything is parented to, and that rotates from
    /// Phase 3), and the bridge between world space and board-local space.
    ///
    /// Single responsibility: keep bubbles correctly bound to grid cells. It
    /// does NOT run matching/chains (Phase 2) or rotation (Phase 3) — those
    /// systems query this one.
    /// </summary>
    public class BoardManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private GameConfig config;
        [SerializeField] private BubbleManager bubbleManager;
        [Tooltip("Empty transform that is the board pivot. Bubbles are parented here. Rotate THIS in Phase 3.")]
        [SerializeField] private Transform boardRoot;

        [Header("Grid Size (Phase 1 defaults; LevelData drives this from Phase 5)")]
        [SerializeField, Min(1)] private int rows = 11;
        [SerializeField, Min(1)] private int cols = 8;

        [Header("Phase 1 Test Fill")]
        [Tooltip("How many top rows to pre-fill with random bubbles on start.")]
        [SerializeField, Min(0)] private int initialFilledRows = 5;

        public GridSystem Grid { get; private set; }
        public Transform BoardRoot => boardRoot;
        public GameConfig Config => config;

        private readonly List<Bubble> _live = new List<Bubble>(128);

        private void Awake()
        {
            Grid = new GridSystem(rows, cols, config.cellSize);
        }

        /// <summary>Build the starting board. Called by GameManager after Awake.</summary>
        public void BuildInitial()
        {
            ClearBoard();
            for (int r = 0; r < initialFilledRows && r < rows; r++)
                for (int c = 0; c < cols; c++)
                    PlaceNewBubble(new GridCoord(r, c), bubbleManager.RandomColor());
        }

        public void ClearBoard()
        {
            for (int i = 0; i < _live.Count; i++)
                bubbleManager.Despawn(_live[i]);
            _live.Clear();
            Grid.Clear();
        }

        // ---------------------------------------------------------------
        // Placement
        // ---------------------------------------------------------------
        /// <summary>Spawn + register a bubble at a cell in one call.</summary>
        public Bubble PlaceNewBubble(GridCoord coord, BubbleColor color)
        {
            if (!Grid.IsFree(coord)) return null;
            var bubble = bubbleManager.Spawn(color, boardRoot);
            bubble.SetLocalPosition(Grid.GridToLocal(coord));
            Grid.Set(coord, bubble);
            _live.Add(bubble);
            return bubble;
        }

        /// <summary>
        /// Attach an already-existing (in-flight) bubble to a grid cell. The
        /// shooter owns the projectile; here we just reparent, snap and register.
        /// </summary>
        public bool AttachBubble(Bubble bubble, GridCoord coord)
        {
            if (bubble == null || !Grid.IsFree(coord)) return false;
            bubble.transform.SetParent(boardRoot, false);
            bubble.SetLocalPosition(Grid.GridToLocal(coord));
            Grid.Set(coord, bubble);
            _live.Add(bubble);
            GameEvents.RaiseBubbleAttached(coord);
            return true;
        }

        /// <summary>Remove + recycle the bubble at a cell (used by matching in Phase 2).</summary>
        public void RemoveBubble(GridCoord coord)
        {
            var occ = Grid.Remove(coord);
            if (occ is Bubble b)
            {
                _live.Remove(b);
                bubbleManager.Despawn(b);
            }
        }

        // ---------------------------------------------------------------
        // Space conversion (world <-> board-local)
        // ---------------------------------------------------------------
        public Vector2 WorldToLocal(Vector3 world) => boardRoot.InverseTransformPoint(world);
        public Vector3 LocalToWorld(Vector2 local) => boardRoot.TransformPoint(local);

        /// <summary>Colors currently present on the board (for smart reload).</summary>
        public IEnumerable<BubbleColor> PresentColors()
        {
            var set = new HashSet<BubbleColor>();
            for (int i = 0; i < _live.Count; i++) set.Add(_live[i].Color);
            return set;
        }

        public int LiveCount => _live.Count;
    }
}
