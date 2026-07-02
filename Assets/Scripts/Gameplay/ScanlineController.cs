using System;
using UnityEngine;
using Scanline.Data;

namespace Scanline.Gameplay
{
    public enum ScanlineState
    {
        Sweeping,
        Frozen,
        Cooldown
    }

    public class ScanlineController : MonoBehaviour
    {
        [SerializeField] private ScanlineConfig config;

        public ScanlineState State { get; private set; } = ScanlineState.Sweeping;
        public float CurrentY { get; private set; }
        public float HalfPulseWidth => config.pulseHalfWidth;

        public event Action<float, float> OnPulseFired;
        public event Action OnFreezeStart;
        public event Action OnResume;

        private float _direction = 1f;
        private float _stateTimer;

        private void OnEnable()
        {
            CurrentY = config.minY;
            _direction = 1f;
            State = ScanlineState.Sweeping;
        }

        public void Tick(float deltaTime)
        {
            switch (State)
            {
                case ScanlineState.Sweeping:
                    Sweep(deltaTime);
                    break;
                case ScanlineState.Frozen:
                    TickTimer(deltaTime, ScanlineState.Cooldown, null);
                    break;
                case ScanlineState.Cooldown:
                    TickTimer(deltaTime, ScanlineState.Sweeping, OnResume);
                    break;
            }
        }

        public bool TryFire()
        {
            if (State != ScanlineState.Sweeping) return false;

            State = ScanlineState.Frozen;
            _stateTimer = config.freezeDuration;
            OnFreezeStart?.Invoke();
            OnPulseFired?.Invoke(CurrentY, HalfPulseWidth);
            return true;
        }

        private void Sweep(float deltaTime)
        {
            CurrentY += _direction * config.sweepSpeed * deltaTime;

            if (CurrentY >= config.maxY)
            {
                CurrentY = config.maxY;
                _direction = -1f;
            }
            else if (CurrentY <= config.minY)
            {
                CurrentY = config.minY;
                _direction = 1f;
            }
        }

        private void TickTimer(float deltaTime, ScanlineState nextState, Action onTransition)
        {
            _stateTimer -= deltaTime;
            if (_stateTimer <= 0f)
            {
                State = nextState;
                _stateTimer = nextState == ScanlineState.Cooldown ? config.cooldownDuration : 0f;
                onTransition?.Invoke();
            }
        }
    }
}
