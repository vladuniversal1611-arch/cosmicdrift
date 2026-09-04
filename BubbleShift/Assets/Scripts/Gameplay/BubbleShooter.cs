using System.Collections.Generic;
using UnityEngine;
using BubbleShift.Core;
using BubbleShift.Grid;
using BubbleShift.Bubbles;

namespace BubbleShift.Gameplay
{
    /// <summary>
    /// The cannon. Holds the current + next bubble, launches the current one in
    /// a direction (board-local) supplied by <see cref="AimController"/>, flies
    /// it along the predicted path, then attaches it to the board.
    ///
    /// Movement re-uses <see cref="TrajectorySimulator"/> so the ball visually
    /// follows exactly the previewed dotted line — no divergence between preview
    /// and result. Match resolution is a Phase 2 concern; this class just raises
    /// OnBubbleAttached so the resolver can react.
    /// </summary>
    public class BubbleShooter : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private BoardManager board;
        [SerializeField] private BubbleManager bubbleManager;
        [SerializeField] private GameConfig config;
        [Tooltip("Muzzle transform (tip of the cannon) where the loaded bubble sits.")]
        [SerializeField] private Transform muzzle;
        [Tooltip("Anchor where the NEXT bubble preview sits.")]
        [SerializeField] private Transform nextSocket;

        public BubbleColor CurrentColor { get; private set; }
        public BubbleColor NextColor { get; private set; }

        /// <summary>True when idle and allowed to fire.</summary>
        public bool CanShoot => _state == ShooterState.Ready;

        private enum ShooterState { Empty, Ready, Flying }
        private ShooterState _state = ShooterState.Empty;

        private Bubble _loaded;      // bubble sitting in the muzzle
        private Bubble _nextBubble;  // preview bubble in the next socket
        private Bubble _flying;      // in-flight projectile

        // Flight path (world-space points) walked at shotSpeed.
        private readonly List<Vector2> _pathLocal = new List<Vector2>(64);
        private readonly List<Vector3> _pathWorld = new List<Vector3>(64);
        private int _pathIndex;
        private GridCoord _targetCell;

        // -------------------------------------------------------------------
        public void Initialize()
        {
            CurrentColor = PickColor();
            NextColor = PickColor();
            _loaded = SpawnAt(CurrentColor, muzzle);
            _nextBubble = SpawnAt(NextColor, nextSocket);
            _state = ShooterState.Ready;
            GameEvents.RaiseShooterReloaded(CurrentColor, NextColor);
        }

        /// <summary>Fire the loaded bubble along a board-local direction.</summary>
        public void Fire(Vector2 dirLocal)
        {
            if (_state != ShooterState.Ready || _loaded == null) return;

            Vector2 startLocal = board.WorldToLocal(muzzle.position);
            _targetCell = TrajectorySimulator.Simulate(board.Grid, startLocal, dirLocal, _pathLocal);

            // No valid landing (board full or blocked shot) — abort the shot.
            if (!_targetCell.IsValid)
                return;

            // Bake the poly-line to world space for the flight.
            _pathWorld.Clear();
            for (int i = 0; i < _pathLocal.Count; i++)
                _pathWorld.Add(board.LocalToWorld(_pathLocal[i]));

            _flying = _loaded;
            _loaded = null;
            _flying.transform.SetParent(null, true); // fly in world space
            _pathIndex = 0;
            _state = ShooterState.Flying;
            GameEvents.RaiseBubbleFired();
        }

        private void Update()
        {
            if (_state == ShooterState.Flying) TickFlight();
        }

        /// <summary>Advance the projectile along the baked world path.</summary>
        private void TickFlight()
        {
            float budget = config.shotSpeed * Time.deltaTime;
            Vector3 pos = _flying.transform.position;

            while (budget > 0f && _pathIndex < _pathWorld.Count - 1)
            {
                Vector3 target = _pathWorld[_pathIndex + 1];
                float dist = Vector3.Distance(pos, target);
                if (dist <= budget)
                {
                    pos = target;
                    budget -= dist;
                    _pathIndex++;
                }
                else
                {
                    pos = Vector3.MoveTowards(pos, target, budget);
                    budget = 0f;
                }
            }
            _flying.transform.position = pos;

            if (_pathIndex >= _pathWorld.Count - 1)
                LandFlight();
        }

        private void LandFlight()
        {
            var landed = _flying;
            _flying = null;

            // Snap into the grid. If the exact cell got taken (shouldn't in a
            // single-projectile loop, but be safe), find the nearest free one.
            if (!board.Grid.IsFree(_targetCell))
            {
                Vector2 local = board.WorldToLocal(landed.transform.position);
                _targetCell = board.Grid.FindNearestFreeCell(local);
            }

            if (_targetCell.IsValid)
                board.AttachBubble(landed, _targetCell);
            else
                bubbleManager.Despawn(landed); // extremely rare: full board

            Reload();
        }

        /// <summary>Advance next -> current and roll a fresh next.</summary>
        private void Reload()
        {
            CurrentColor = NextColor;
            _loaded = _nextBubble;
            if (_loaded != null)
            {
                _loaded.transform.SetParent(muzzle, false);
                _loaded.transform.localPosition = Vector3.zero;
            }
            NextColor = PickColor();
            _nextBubble = SpawnAt(NextColor, nextSocket);

            _state = ShooterState.Ready;
            GameEvents.RaiseShooterReloaded(CurrentColor, NextColor);
        }

        // -------------------------------------------------------------------
        private Bubble SpawnAt(BubbleColor color, Transform socket)
        {
            var b = bubbleManager.Spawn(color, socket);
            b.transform.localPosition = Vector3.zero;
            return b;
        }

        /// <summary>Prefer colors that exist on the board so shots stay useful.</summary>
        private BubbleColor PickColor()
        {
            if (board != null && board.LiveCount > 0)
                return bubbleManager.RandomColorFrom(board.PresentColors());
            return bubbleManager.RandomColor();
        }
    }
}
