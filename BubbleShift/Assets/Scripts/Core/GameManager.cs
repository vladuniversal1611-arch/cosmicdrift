using UnityEngine;
using BubbleShift.Gameplay;
using BubbleShift.Bubbles;

namespace BubbleShift.Core
{
    /// <summary>
    /// Thin orchestrator / composition root. It wires the independent systems
    /// together and drives the high-level <see cref="GameState"/> — it is
    /// deliberately small (no 3000-line god object). Individual behaviours own
    /// their own logic; GameManager only decides *when* things happen.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Systems (assign in Inspector)")]
        [SerializeField] private BubbleManager bubbleManager;
        [SerializeField] private BoardManager board;
        [SerializeField] private BubbleShooter shooter;
        [SerializeField] private AimController aim;

        public GameState State { get; private set; } = GameState.Boot;
        public BoardManager Board => board;
        public BubbleShooter Shooter => shooter;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            SetState(GameState.Loading);
            board.BuildInitial();     // Phase 5 will replace this with LevelData
            shooter.Initialize();
            SetState(GameState.Ready);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        public void SetState(GameState next)
        {
            if (State == next) return;
            State = next;
            GameEvents.RaiseGameStateChanged(next);
        }
    }
}
