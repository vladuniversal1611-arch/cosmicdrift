using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Core;
using BubbleShift.Grid;

namespace BubbleShift.Gameplay
{
    /// <summary>
    /// Reads pointer input (touch/mouse), computes the aim direction and renders
    /// the premium dotted trajectory preview with wall reflection plus a landing
    /// marker at the predicted cell. Purely presentation + intent: it hands the
    /// resolved direction to <see cref="BubbleShooter"/> on release.
    ///
    /// Preview dots are pooled small SpriteRenderers (no per-frame allocation).
    /// </summary>
    public class AimController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private BoardManager board;
        [SerializeField] private BubbleShooter shooter;
        [SerializeField] private GameConfig config;
        [SerializeField] private Camera gameCamera;
        [Tooltip("Muzzle transform (tip of the cannon), in world space.")]
        [SerializeField] private Transform muzzle;

        [Header("Preview Visuals")]
        [Tooltip("Small dot sprite prefab (a soft round sprite ~16px).")]
        [SerializeField] private SpriteRenderer dotPrefab;
        [SerializeField, Min(4)] private int dotCount = 40;
        [SerializeField, Min(0.05f)] private float dotSpacing = 0.35f;
        [Tooltip("Marker shown at the predicted landing cell (a ring sprite).")]
        [SerializeField] private SpriteRenderer landingMarker;

        private readonly List<Vector2> _pathLocal = new List<Vector2>(64);
        private SpriteRenderer[] _dots;
        private bool _aiming;
        private Vector2 _aimDirLocal = Vector2.up;

        public bool IsAiming => _aiming;

        private void Awake()
        {
            if (gameCamera == null) gameCamera = Camera.main;

            _dots = new SpriteRenderer[dotCount];
            for (int i = 0; i < dotCount; i++)
            {
                _dots[i] = Instantiate(dotPrefab, transform);
                _dots[i].enabled = false;
            }
            if (landingMarker != null) landingMarker.enabled = false;
        }

        private void Update()
        {
            // Only aim while the shooter is ready to fire.
            if (shooter == null || !shooter.CanShoot)
            {
                if (_aiming) EndAim(false);
                return;
            }

            if (GetPointerDown()) BeginAim();
            else if (_aiming && GetPointerHeld()) UpdateAim();
            else if (_aiming && GetPointerUp()) EndAim(true);
        }

        private void BeginAim()
        {
            _aiming = true;
            UpdateAim();
        }

        private void UpdateAim()
        {
            Vector3 worldPointer = ScreenToWorld(GetPointerPosition());

            // Direction in world, then converted to board-local so the preview
            // already accounts for the board's rotation.
            Vector3 worldDir = worldPointer - muzzle.position;
            Vector2 dirLocal = board.WorldToLocal(muzzle.position + worldDir) - board.WorldToLocal(muzzle.position);

            _aimDirLocal = ClampAim(dirLocal);

            Vector2 startLocal = board.WorldToLocal(muzzle.position);
            GridCoord landing = TrajectorySimulator.Simulate(board.Grid, startLocal, _aimDirLocal, _pathLocal);
            RenderPreview(landing);
        }

        private void EndAim(bool fire)
        {
            _aiming = false;
            HidePreview();
            if (fire) shooter.Fire(_aimDirLocal);
        }

        /// <summary>Enforce a minimum upward angle so the player cannot shoot down/sideways.</summary>
        private Vector2 ClampAim(Vector2 dirLocal)
        {
            if (dirLocal.sqrMagnitude < 1e-6f) return Vector2.up;
            dirLocal.Normalize();
            float minY = Mathf.Sin(config.minAimAngle * Mathf.Deg2Rad);
            if (dirLocal.y < minY)
            {
                dirLocal.y = minY;
                dirLocal.Normalize();
            }
            return dirLocal;
        }

        // ---------------------------------------------------------------
        // Preview rendering
        // ---------------------------------------------------------------
        private void RenderPreview(GridCoord landing)
        {
            // Walk the poly-line placing dots at fixed world spacing.
            int dotIndex = 0;
            float carried = 0f;

            for (int seg = 0; seg < _pathLocal.Count - 1 && dotIndex < _dots.Length; seg++)
            {
                Vector3 a = board.LocalToWorld(_pathLocal[seg]);
                Vector3 b = board.LocalToWorld(_pathLocal[seg + 1]);
                float segLen = Vector3.Distance(a, b);
                float t = carried;
                while (t <= segLen && dotIndex < _dots.Length)
                {
                    var dot = _dots[dotIndex++];
                    dot.transform.position = Vector3.Lerp(a, b, segLen < 1e-4f ? 0f : t / segLen);
                    dot.enabled = true;
                    t += dotSpacing;
                }
                carried = t - segLen;
            }
            for (int i = dotIndex; i < _dots.Length; i++) _dots[i].enabled = false;

            // Landing marker.
            if (landingMarker != null)
            {
                if (landing.IsValid && board.Grid.InBounds(landing))
                {
                    landingMarker.enabled = true;
                    landingMarker.transform.position = board.LocalToWorld(board.Grid.GridToLocal(landing));
                    landingMarker.color = config.GetColor(shooter.CurrentColor);
                }
                else landingMarker.enabled = false;
            }
        }

        private void HidePreview()
        {
            if (_dots != null)
                for (int i = 0; i < _dots.Length; i++) _dots[i].enabled = false;
            if (landingMarker != null) landingMarker.enabled = false;
        }

        // ---------------------------------------------------------------
        // Input (old Input Manager for LTS compatibility; touch-first)
        // ---------------------------------------------------------------
        private bool GetPointerDown()
        {
            if (Input.touchCount > 0) return Input.GetTouch(0).phase == TouchPhase.Began;
            return Input.GetMouseButtonDown(0);
        }
        private bool GetPointerHeld()
        {
            if (Input.touchCount > 0)
            {
                var p = Input.GetTouch(0).phase;
                return p == TouchPhase.Moved || p == TouchPhase.Stationary;
            }
            return Input.GetMouseButton(0);
        }
        private bool GetPointerUp()
        {
            if (Input.touchCount > 0)
            {
                var p = Input.GetTouch(0).phase;
                return p == TouchPhase.Ended || p == TouchPhase.Canceled;
            }
            return Input.GetMouseButtonUp(0);
        }
        private Vector3 GetPointerPosition()
        {
            if (Input.touchCount > 0) return Input.GetTouch(0).position;
            return Input.mousePosition;
        }

        private Vector3 ScreenToWorld(Vector3 screen)
        {
            float depth = Mathf.Abs(gameCamera.transform.position.z - muzzle.position.z);
            screen.z = depth;
            return gameCamera.ScreenToWorldPoint(screen);
        }
    }
}
