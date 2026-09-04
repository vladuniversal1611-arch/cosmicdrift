namespace BubbleShift.Core
{
    /// <summary>
    /// Playable bubble colors. Keep the "count" sentinel last so systems can
    /// iterate the real colors with (int)BubbleColor.Count. Order here also
    /// drives the color palette index in <see cref="GameConfig"/>.
    /// </summary>
    public enum BubbleColor
    {
        Red = 0,
        Blue = 1,
        Green = 2,
        Yellow = 3,
        Purple = 4,

        Count = 5,

        // Non-playable / special markers (never spawned as a random color).
        None = 100
    }

    /// <summary>
    /// The four cardinal orientations the board can occupy. The unique
    /// "Bubble Shift" mechanic rotates the board through this cycle:
    /// Up -> Right -> Down -> Left (clockwise).
    /// </summary>
    public enum BoardOrientation
    {
        Up = 0,
        Right = 1,
        Down = 2,
        Left = 3
    }

    public enum RotationDirection
    {
        Clockwise = 1,
        CounterClockwise = -1
    }

    /// <summary>High level game/session state machine.</summary>
    public enum GameState
    {
        Boot,
        Loading,
        Ready,      // level loaded, waiting for first input
        Aiming,     // player is aiming
        Shooting,   // projectile in flight
        Resolving,  // matches / chains / rotation resolving
        Paused,
        LevelWon,
        LevelLost
    }
}
