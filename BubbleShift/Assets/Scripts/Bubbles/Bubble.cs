using UnityEngine;
using BubbleShift.Core;
using BubbleShift.Grid;

namespace BubbleShift.Bubbles
{
    /// <summary>
    /// A single bubble. Implements <see cref="IGridOccupant"/> so the pure grid
    /// can reason about it without a hard reference to this MonoBehaviour.
    /// Visuals are driven by a single SpriteRenderer tinted from GameConfig.
    ///
    /// Requires: SpriteRenderer on the same GameObject (round glossy sprite).
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public class Bubble : MonoBehaviour, IGridOccupant
    {
        [SerializeField] private SpriteRenderer spriteRenderer;

        public BubbleColor Color { get; private set; }
        public GridCoord Coord { get; set; }

        // Phase 1 bubbles are plain colored bubbles: always matchable, never anchors.
        public bool BlocksMatches => false;
        public bool IsAnchor => false;

        private void Reset() => spriteRenderer = GetComponent<SpriteRenderer>();
        private void Awake()
        {
            if (spriteRenderer == null) spriteRenderer = GetComponent<SpriteRenderer>();
        }

        /// <summary>Configure color + visuals. Called by the factory on spawn.</summary>
        public void Init(BubbleColor color, GameConfig config)
        {
            Color = color;
            Coord = GridCoord.Invalid;
            if (spriteRenderer != null && config != null)
                spriteRenderer.color = config.GetColor(color);
            transform.localScale = Vector3.one;
        }

        /// <summary>Place this bubble at a board-local position (parented to board root).</summary>
        public void SetLocalPosition(Vector2 local)
        {
            transform.localPosition = new Vector3(local.x, local.y, 0f);
        }

        /// <summary>Called by the pool before returning to the free list.</summary>
        public void OnDespawn()
        {
            Coord = GridCoord.Invalid;
            transform.localScale = Vector3.one;
        }
    }
}
