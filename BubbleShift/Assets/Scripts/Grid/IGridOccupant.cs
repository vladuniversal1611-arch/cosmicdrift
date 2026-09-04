using BubbleShift.Core;

namespace BubbleShift.Grid
{
    /// <summary>
    /// Anything that can sit in a grid cell (bubbles now; obstacles later).
    /// Keeps <see cref="GridSystem"/> decoupled from concrete MonoBehaviours so
    /// the grid stays a pure, testable data structure.
    /// </summary>
    public interface IGridOccupant
    {
        BubbleColor Color { get; }
        GridCoord Coord { get; set; }

        /// <summary>True for stones/metal etc. that never participate in color matches.</summary>
        bool BlocksMatches { get; }

        /// <summary>True if this occupant counts as a top-row anchor for connectivity.</summary>
        bool IsAnchor { get; }
    }
}
