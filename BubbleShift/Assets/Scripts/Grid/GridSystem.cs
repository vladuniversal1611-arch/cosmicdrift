using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Core;

namespace BubbleShift.Grid
{
    /// <summary>
    /// Pure (non-MonoBehaviour) square grid. Owns cell occupancy and all
    /// coordinate math in BOARD-LOCAL space. The grid is centered on the board
    /// pivot (0,0), so rotating the pivot rotates the whole board while these
    /// coordinates stay valid — that is what keeps the "shift" mechanic from
    /// breaking grid integrity.
    ///
    /// Local axes:  +X right, +Y up.  Row 0 is the TOP row, Col 0 the LEFT col.
    /// A square grid (4-neighbour connectivity) is deliberate: 90 degree board
    /// rotation maps cells cleanly, unlike a hex layout.
    /// </summary>
    public class GridSystem
    {
        public int Rows { get; }
        public int Cols { get; }
        public float CellSize { get; }

        public float Width => Cols * CellSize;
        public float Height => Rows * CellSize;
        public float HalfWidth => Width * 0.5f;
        public float HalfHeight => Height * 0.5f;
        public float Radius => CellSize * 0.5f;

        private readonly IGridOccupant[,] _cells;

        // 4-neighbour offsets (up, down, left, right).
        private static readonly (int dr, int dc)[] Neigh =
        {
            (-1, 0), (1, 0), (0, -1), (0, 1)
        };

        public GridSystem(int rows, int cols, float cellSize)
        {
            Rows = Mathf.Max(1, rows);
            Cols = Mathf.Max(1, cols);
            CellSize = Mathf.Max(0.01f, cellSize);
            _cells = new IGridOccupant[Rows, Cols];
        }

        // ---------------------------------------------------------------
        // Bounds & occupancy
        // ---------------------------------------------------------------
        public bool InBounds(GridCoord c) =>
            c.Row >= 0 && c.Row < Rows && c.Col >= 0 && c.Col < Cols;

        public bool IsOccupied(GridCoord c) => InBounds(c) && _cells[c.Row, c.Col] != null;
        public bool IsFree(GridCoord c) => InBounds(c) && _cells[c.Row, c.Col] == null;

        public IGridOccupant Get(GridCoord c) => InBounds(c) ? _cells[c.Row, c.Col] : null;

        public void Set(GridCoord c, IGridOccupant occ)
        {
            if (!InBounds(c)) return;
            _cells[c.Row, c.Col] = occ;
            if (occ != null) occ.Coord = c;
        }

        public IGridOccupant Remove(GridCoord c)
        {
            if (!InBounds(c)) return null;
            var occ = _cells[c.Row, c.Col];
            _cells[c.Row, c.Col] = null;
            return occ;
        }

        public void Clear()
        {
            for (int r = 0; r < Rows; r++)
                for (int col = 0; col < Cols; col++)
                    _cells[r, col] = null;
        }

        // ---------------------------------------------------------------
        // Coordinate conversion (board-local space)
        // ---------------------------------------------------------------
        /// <summary>Center of a cell in board-local coordinates.</summary>
        public Vector2 GridToLocal(GridCoord c)
        {
            float x = -HalfWidth + (c.Col + 0.5f) * CellSize;
            float y = HalfHeight - (c.Row + 0.5f) * CellSize; // row 0 at top
            return new Vector2(x, y);
        }

        /// <summary>Nearest cell coordinate for a board-local point (may be out of bounds).</summary>
        public GridCoord LocalToGrid(Vector2 local)
        {
            int col = Mathf.FloorToInt((local.x + HalfWidth) / CellSize);
            int row = Mathf.FloorToInt((HalfHeight - local.y) / CellSize);
            return new GridCoord(row, col);
        }

        // ---------------------------------------------------------------
        // Neighbours
        // ---------------------------------------------------------------
        public void GetNeighbours(GridCoord c, List<GridCoord> buffer)
        {
            buffer.Clear();
            for (int i = 0; i < Neigh.Length; i++)
            {
                var n = c.Offset(Neigh[i].dr, Neigh[i].dc);
                if (InBounds(n)) buffer.Add(n);
            }
        }

        // ---------------------------------------------------------------
        // Matching (flood fill of same color from a start cell)
        // ---------------------------------------------------------------
        /// <summary>
        /// Returns every cell connected to <paramref name="start"/> through
        /// same-colored, matchable neighbours (including start). Obstacles and
        /// mismatched colors block the flood. Result includes start even if the
        /// group is size 1 — callers compare against GameConfig.minMatchSize.
        /// </summary>
        public List<GridCoord> FindMatches(GridCoord start)
        {
            var result = new List<GridCoord>();
            var startOcc = Get(start);
            if (startOcc == null || startOcc.BlocksMatches) return result;

            BubbleColor target = startOcc.Color;
            var visited = new HashSet<GridCoord>();
            var stack = new Stack<GridCoord>();
            var nbuf = new List<GridCoord>(4);

            stack.Push(start);
            visited.Add(start);

            while (stack.Count > 0)
            {
                var cur = stack.Pop();
                result.Add(cur);

                GetNeighbours(cur, nbuf);
                for (int i = 0; i < nbuf.Count; i++)
                {
                    var n = nbuf[i];
                    if (visited.Contains(n)) continue;
                    var occ = Get(n);
                    if (occ == null || occ.BlocksMatches || occ.Color != target) continue;
                    visited.Add(n);
                    stack.Push(n);
                }
            }
            return result;
        }

        // ---------------------------------------------------------------
        // Connectivity (floating-bubble detection)
        // ---------------------------------------------------------------
        /// <summary>
        /// Returns all occupied cells NOT connected (through occupied neighbours)
        /// to an anchor. Anchors are top-row bubbles plus any occupant flagged
        /// IsAnchor. These are the bubbles that must drop after a clear.
        /// </summary>
        public List<GridCoord> GetDisconnected()
        {
            var connected = new HashSet<GridCoord>();
            var queue = new Queue<GridCoord>();
            var nbuf = new List<GridCoord>(4);

            // Seed from anchors.
            for (int col = 0; col < Cols; col++)
            {
                var c = new GridCoord(0, col);
                if (IsOccupied(c) && connected.Add(c)) queue.Enqueue(c);
            }
            for (int r = 0; r < Rows; r++)
                for (int col = 0; col < Cols; col++)
                {
                    var c = new GridCoord(r, col);
                    var occ = Get(c);
                    if (occ != null && occ.IsAnchor && connected.Add(c)) queue.Enqueue(c);
                }

            while (queue.Count > 0)
            {
                var cur = queue.Dequeue();
                GetNeighbours(cur, nbuf);
                for (int i = 0; i < nbuf.Count; i++)
                {
                    var n = nbuf[i];
                    if (IsOccupied(n) && connected.Add(n)) queue.Enqueue(n);
                }
            }

            var disconnected = new List<GridCoord>();
            for (int r = 0; r < Rows; r++)
                for (int col = 0; col < Cols; col++)
                {
                    var c = new GridCoord(r, col);
                    if (IsOccupied(c) && !connected.Contains(c)) disconnected.Add(c);
                }
            return disconnected;
        }

        // ---------------------------------------------------------------
        // Placement helper (used by the shooter to snap a projectile)
        // ---------------------------------------------------------------
        /// <summary>
        /// Finds the free, in-bounds cell whose center is closest to a
        /// board-local point. Searches outward so a bubble always lands in a
        /// sensible neighbouring slot instead of overlapping. Returns
        /// GridCoord.Invalid if the grid is completely full.
        /// </summary>
        public GridCoord FindNearestFreeCell(Vector2 local, int searchRadius = 3)
        {
            var guess = LocalToGrid(local);
            GridCoord best = GridCoord.Invalid;
            float bestSqr = float.MaxValue;

            for (int dr = -searchRadius; dr <= searchRadius; dr++)
                for (int dc = -searchRadius; dc <= searchRadius; dc++)
                {
                    var c = guess.Offset(dr, dc);
                    if (!IsFree(c)) continue;
                    float sqr = ((Vector2)GridToLocal(c) - local).sqrMagnitude;
                    if (sqr < bestSqr)
                    {
                        bestSqr = sqr;
                        best = c;
                    }
                }
            return best;
        }
    }
}
