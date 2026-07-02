using System;
using System.Collections.Generic;
using UnityEngine;
using Scanline.Input;

namespace Scanline.Gameplay
{
    public enum GameState
    {
        Playing,
        Paused,
        GameOver
    }

    public class GameManager : MonoBehaviour
    {
        [SerializeField] private ScanlineController scanline;
        [SerializeField] private TargetManager targetManager;
        [SerializeField] private TapInputController input;
        [SerializeField] private int startingLives = 3;
        [SerializeField] private int baseScorePerTarget = 100;

        public GameState State { get; private set; } = GameState.Playing;
        public int Score { get; private set; }
        public int DataFragments { get; private set; }
        public int Lives { get; private set; }
        public int Shields { get; set; }

        public event Action<ComboResult> OnComboResolved;
        public event Action OnSystemReboot;
        public event Action OnGameOver;

        private ComboSystem _combo;
        private readonly List<Target> _hitTargets = new List<Target>(16);
        private readonly List<Target> _hitNodes = new List<Target>(8);

        private void Awake()
        {
            _combo = new ComboSystem(baseScorePerTarget);
            Lives = startingLives;
        }

        private void OnEnable()
        {
            input.OnTap += HandleTap;
            scanline.OnPulseFired += HandlePulseFired;
        }

        private void OnDisable()
        {
            input.OnTap -= HandleTap;
            scanline.OnPulseFired -= HandlePulseFired;
        }

        private void Update()
        {
            if (State != GameState.Playing) return;

            float deltaTime = Time.deltaTime;
            scanline.Tick(deltaTime);
            targetManager.Tick(deltaTime);
        }

        private void HandleTap()
        {
            if (State != GameState.Playing) return;
            scanline.TryFire();
        }

        private void HandlePulseFired(float y, float halfWidth)
        {
            IntersectionDetector.Evaluate(targetManager.ActiveTargets, y, halfWidth, _hitTargets, _hitNodes);

            if (_hitNodes.Count > 0)
            {
                HandleReboot();
            }

            var result = _combo.Resolve(_hitTargets);
            if (result.HitCount > 0)
            {
                Score += result.Score;
                DataFragments += result.DataFragments;
            }

            for (int i = 0; i < _hitTargets.Count; i++) targetManager.Despawn(_hitTargets[i]);
            for (int i = 0; i < _hitNodes.Count; i++) targetManager.Despawn(_hitNodes[i]);

            OnComboResolved?.Invoke(result);
        }

        private void HandleReboot()
        {
            _combo.BreakStreak();

            if (Shields > 0)
            {
                Shields--;
                return;
            }

            Lives--;
            OnSystemReboot?.Invoke();

            if (Lives <= 0)
            {
                State = GameState.GameOver;
                OnGameOver?.Invoke();
            }
        }
    }
}
