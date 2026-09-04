using System;

namespace BubbleShift.Grid
{
    /// <summary>
    /// Immutable integer grid position (row, col). Row 0 is the top anchor row,
    /// col 0 is the leftmost column in board-local space. Using a struct keeps
    /// coordinates allocation-free in the gameplay loop.
    /// </summary>
    [Serializable]
    public readonly struct GridCoord : IEquatable<GridCoord>
    {
        public readonly int Row;
        public readonly int Col;

        public GridCoord(int row, int col)
        {
            Row = row;
            Col = col;
        }

        public static readonly GridCoord Invalid = new GridCoord(int.MinValue, int.MinValue);
        public bool IsValid => Row != int.MinValue && Col != int.MinValue;

        public GridCoord Offset(int dRow, int dCol) => new GridCoord(Row + dRow, Col + dCol);

        public bool Equals(GridCoord other) => Row == other.Row && Col == other.Col;
        public override bool Equals(object obj) => obj is GridCoord o && Equals(o);
        public override int GetHashCode() => (Row * 397) ^ Col;
        public override string ToString() => $"({Row},{Col})";

        public static bool operator ==(GridCoord a, GridCoord b) => a.Equals(b);
        public static bool operator !=(GridCoord a, GridCoord b) => !a.Equals(b);
    }
}
