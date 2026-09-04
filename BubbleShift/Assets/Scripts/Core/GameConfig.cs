using UnityEngine;
using BubbleShift.Core;

namespace BubbleShift.Core
{
    /// <summary>
    /// Central tuning asset. All designer-facing gameplay numbers and the
    /// visual color palette live here so balancing never means touching code.
    /// Create one via: Assets > Create > BubbleShift > Game Config.
    /// </summary>
    [CreateAssetMenu(fileName = "GameConfig", menuName = "BubbleShift/Game Config", order = 0)]
    public class GameConfig : ScriptableObject
    {
        [Header("Grid")]
        [Tooltip("World size of a single grid cell (bubble diameter).")]
        [Min(0.1f)] public float cellSize = 0.64f;

        [Header("Shooter")]
        [Tooltip("Speed of the fired bubble in world units / second.")]
        [Min(1f)] public float shotSpeed = 18f;
        [Tooltip("Minimum aim angle from horizontal (deg). Stops shooting sideways/down.")]
        [Range(1f, 89f)] public float minAimAngle = 12f;

        [Header("Matching")]
        [Tooltip("Minimum group size (including the placed bubble) that clears.")]
        [Min(2)] public int minMatchSize = 3;

        [Header("Color Palette")]
        [Tooltip("One entry per BubbleColor (Red,Blue,Green,Yellow,Purple). Index == (int)BubbleColor.")]
        public Color[] colorPalette = new Color[]
        {
            new Color(0.95f, 0.26f, 0.28f), // Red
            new Color(0.24f, 0.53f, 0.96f), // Blue
            new Color(0.30f, 0.80f, 0.42f), // Green
            new Color(0.99f, 0.82f, 0.22f), // Yellow
            new Color(0.66f, 0.36f, 0.92f), // Purple
        };

        /// <summary>Resolve a playable color to its display Color (safe-clamped).</summary>
        public Color GetColor(BubbleColor c)
        {
            int i = (int)c;
            if (colorPalette == null || i < 0 || i >= colorPalette.Length)
                return Color.magenta; // obvious "unconfigured" marker
            return colorPalette[i];
        }
    }
}
