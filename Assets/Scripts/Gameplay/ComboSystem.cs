using System.Collections.Generic;

namespace Scanline.Gameplay
{
    public readonly struct ComboResult
    {
        public static readonly ComboResult Miss = new ComboResult(0, 0, 0, 0, 0);

        public readonly int HitCount;
        public readonly int Multiplier;
        public readonly int Score;
        public readonly int DataFragments;
        public readonly int Streak;

        public ComboResult(int hitCount, int multiplier, int score, int dataFragments, int streak)
        {
            HitCount = hitCount;
            Multiplier = multiplier;
            Score = score;
            DataFragments = dataFragments;
            Streak = streak;
        }
    }

    // Pure C#, no UnityEngine dependency — keeps the scoring rules unit-testable
    // without a scene or play mode.
    public class ComboSystem
    {
        private static readonly int[] MultiplierByHitCount = { 0, 1, 2, 3, 5 };

        private readonly int _baseScorePerTarget;
        private readonly int _bonusScoreMultiplier;
        private int _streak;

        public ComboSystem(int baseScorePerTarget = 100, int bonusScoreMultiplier = 3)
        {
            _baseScorePerTarget = baseScorePerTarget;
            _bonusScoreMultiplier = bonusScoreMultiplier;
        }

        public int Streak => _streak;

        public ComboResult Resolve(IReadOnlyList<Target> hits)
        {
            if (hits.Count == 0)
            {
                _streak = 0;
                return ComboResult.Miss;
            }

            _streak++;

            int multiplierIndex = hits.Count < MultiplierByHitCount.Length
                ? hits.Count
                : MultiplierByHitCount.Length - 1;
            int multiplier = MultiplierByHitCount[multiplierIndex];

            int rawScore = 0;
            for (int i = 0; i < hits.Count; i++)
            {
                rawScore += hits[i].Kind == TargetKind.Bonus
                    ? _baseScorePerTarget * _bonusScoreMultiplier
                    : _baseScorePerTarget;
            }

            int score = rawScore * multiplier;
            int dataFragments = hits.Count * multiplier;

            return new ComboResult(hits.Count, multiplier, score, dataFragments, _streak);
        }

        public void BreakStreak() => _streak = 0;
    }
}
