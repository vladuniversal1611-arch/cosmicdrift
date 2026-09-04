using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Core;

namespace BubbleShift.Bubbles
{
    /// <summary>
    /// Owns bubble spawning and recycling through a <see cref="BubblePool"/>.
    /// Single responsibility: hand out configured Bubble instances and take them
    /// back. Knows nothing about the grid or matching.
    /// </summary>
    public class BubbleManager : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Bubble bubblePrefab;
        [SerializeField] private GameConfig config;

        [Header("Pool")]
        [Tooltip("How many bubbles to allocate up front (>= max on-screen count).")]
        [SerializeField] private int prewarmCount = 96;

        private BubblePool _pool;
        private Transform _inactiveRoot;

        public GameConfig Config => config;

        private void Awake()
        {
            // Hidden container that keeps the inspector tidy and pooled bubbles inactive.
            _inactiveRoot = new GameObject("[BubblePool]").transform;
            _inactiveRoot.SetParent(transform, false);
            _pool = new BubblePool(bubblePrefab, _inactiveRoot, prewarmCount);
        }

        /// <summary>Spawn a bubble of a specific color, parented under <paramref name="parent"/>.</summary>
        public Bubble Spawn(BubbleColor color, Transform parent)
        {
            var b = _pool.Get(parent);
            b.Init(color, config);
            return b;
        }

        /// <summary>Spawn a random playable color.</summary>
        public Bubble SpawnRandom(Transform parent)
        {
            var color = (BubbleColor)Random.Range(0, (int)BubbleColor.Count);
            return Spawn(color, parent);
        }

        public void Despawn(Bubble b) => _pool.Release(b);

        /// <summary>Pick a random playable color (used by the shooter for reloads).</summary>
        public BubbleColor RandomColor() => (BubbleColor)Random.Range(0, (int)BubbleColor.Count);

        /// <summary>
        /// Pick a random color that actually exists on the board, so the player
        /// is never handed an unusable color. Falls back to any color.
        /// </summary>
        public BubbleColor RandomColorFrom(IEnumerable<BubbleColor> present)
        {
            var list = new List<BubbleColor>();
            foreach (var c in present)
                if (!list.Contains(c)) list.Add(c);
            if (list.Count == 0) return RandomColor();
            return list[Random.Range(0, list.Count)];
        }
    }
}
