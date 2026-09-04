using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Grid;

namespace BubbleShift.Gameplay
{
    /// <summary>
    /// Deterministic trajectory predictor shared by the aim preview and the
    /// actual shot resolution. Everything runs in BOARD-LOCAL space, so the
    /// prediction already respects the board's current orientation.
    ///
    /// The ball travels in straight segments, reflecting off the left/right
    /// walls, until it either reaches the top or collides with an occupied
    /// cell. The output is the poly-line (for the dotted preview) plus the grid
    /// cell the bubble would snap to.
    /// </summary>
    public static class TrajectorySimulator
    {
        private const int MaxSteps = 4000;

        /// <summary>
        /// Simulate a shot.
        /// </summary>
        /// <param name="grid">Board grid (owns geometry + occupancy).</param>
        /// <param name="startLocal">Muzzle position in board-local space.</param>
        /// <param name="dirLocal">Aim direction in board-local space (need not be normalized).</param>
        /// <param name="pointsOut">Filled with poly-line points (board-local). Cleared first.</param>
        /// <returns>The cell the bubble snaps to, or GridCoord.Invalid if none.</returns>
        public static GridCoord Simulate(GridSystem grid, Vector2 startLocal, Vector2 dirLocal,
                                         List<Vector2> pointsOut)
        {
            pointsOut.Clear();

            float radius = grid.Radius;
            float limitX = grid.HalfWidth - radius; // wall contact for ball center
            float topY = grid.HalfHeight - radius;  // top contact for ball center
            float bottomY = -grid.HalfHeight - grid.CellSize; // hard safety floor

            Vector2 dir = dirLocal.sqrMagnitude < 1e-6f ? Vector2.up : dirLocal.normalized;
            Vector2 pos = startLocal;
            pointsOut.Add(pos);

            float step = radius * 0.5f;
            Vector2 hitPoint = pos;
            bool landed = false;

            for (int i = 0; i < MaxSteps; i++)
            {
                Vector2 next = pos + dir * step;

                // --- Side wall reflection ---
                if (next.x < -limitX)
                {
                    float t = Mathf.Approximately(dir.x, 0f) ? 0f : (-limitX - pos.x) / dir.x;
                    Vector2 wall = pos + dir * t;
                    pointsOut.Add(wall);
                    dir.x = -dir.x;
                    pos = wall;
                    continue;
                }
                if (next.x > limitX)
                {
                    float t = Mathf.Approximately(dir.x, 0f) ? 0f : (limitX - pos.x) / dir.x;
                    Vector2 wall = pos + dir * t;
                    pointsOut.Add(wall);
                    dir.x = -dir.x;
                    pos = wall;
                    continue;
                }

                // --- Top wall: snap to top region ---
                if (next.y >= topY)
                {
                    hitPoint = new Vector2(next.x, topY);
                    landed = true;
                    break;
                }

                // --- Bubble collision: scan the cell of 'next' and its neighbours ---
                if (OverlapsOccupied(grid, next, radius, out Vector2 contact))
                {
                    // Use the last free position as the contact point for snapping,
                    // biased slightly toward the bubble we touched for a natural slot.
                    hitPoint = Vector2.Lerp(pos, contact, 0.5f);
                    landed = true;
                    break;
                }

                pos = next;

                if (pos.y < bottomY) { hitPoint = pos; break; } // failsafe, should not happen
            }

            pointsOut.Add(hitPoint);

            if (!landed) return GridCoord.Invalid;
            return grid.FindNearestFreeCell(hitPoint);
        }

        /// <summary>
        /// True if a ball of <paramref name="radius"/> at <paramref name="p"/>
        /// overlaps any occupied cell. Returns the occupied cell center as the
        /// contact reference for snapping.
        /// </summary>
        private static bool OverlapsOccupied(GridSystem grid, Vector2 p, float radius, out Vector2 contact)
        {
            contact = p;
            var guess = grid.LocalToGrid(p);
            float touchDist = radius * 1.9f;       // two touching bubbles ~= 2r
            float touchSqr = touchDist * touchDist;

            for (int dr = -1; dr <= 1; dr++)
                for (int dc = -1; dc <= 1; dc++)
                {
                    var c = guess.Offset(dr, dc);
                    if (!grid.IsOccupied(c)) continue;
                    Vector2 center = grid.GridToLocal(c);
                    if (((Vector2)center - p).sqrMagnitude <= touchSqr)
                    {
                        contact = center;
                        return true;
                    }
                }
            return false;
        }
    }
}
