using UnityEngine;

namespace Scanline.Data
{
    [CreateAssetMenu(fileName = "TargetConfig", menuName = "Scanline/Target Config")]
    public class TargetConfig : ScriptableObject
    {
        [Header("Spawn Timing")]
        public float minSpawnInterval = 0.6f;
        public float maxSpawnInterval = 1.4f;

        [Header("Pool Sizes")]
        public int standardPrewarmCount = 24;
        public int nodePrewarmCount = 6;

        [Header("Population Mix")]
        [Range(0f, 1f)] public float protectedNodeChance = 0.18f;
        [Range(0f, 1f)] public float bonusTargetChance = 0.12f;

        [Header("Motion")]
        public float minSpeed = 0.6f;
        public float maxSpeed = 2.2f;
        public float maxSpawnAngleDegrees = 20f;
        public float collisionRadius = 0.18f;
        public float bonusCollisionRadius = 0.10f;

        public float NextSpawnInterval() => Random.Range(minSpawnInterval, maxSpawnInterval);

        public (Vector2 position, Vector2 velocity) RollSpawn(Rect bounds)
        {
            bool fromLeft = Random.value < 0.5f;
            float x = fromLeft ? bounds.xMin : bounds.xMax;
            float y = Random.Range(bounds.yMin, bounds.yMax);
            float speed = Random.Range(minSpeed, maxSpeed);
            float angle = Random.Range(-maxSpawnAngleDegrees, maxSpawnAngleDegrees) * Mathf.Deg2Rad;

            float dirX = fromLeft ? 1f : -1f;
            var velocity = new Vector2(dirX * Mathf.Cos(angle), Mathf.Sin(angle)) * speed;
            return (new Vector2(x, y), velocity);
        }
    }
}
