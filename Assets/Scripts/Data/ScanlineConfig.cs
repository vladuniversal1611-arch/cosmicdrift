using UnityEngine;

namespace Scanline.Data
{
    [CreateAssetMenu(fileName = "ScanlineConfig", menuName = "Scanline/Scanline Config")]
    public class ScanlineConfig : ScriptableObject
    {
        [Header("Sweep Bounds (world units)")]
        public float minY = -4f;
        public float maxY = 4f;
        public float sweepSpeed = 3f;

        [Header("Freeze / Pulse")]
        public float freezeDuration = 0.18f;
        public float pulseHalfWidth = 0.12f;
        public float cooldownDuration = 0.08f;
    }
}
