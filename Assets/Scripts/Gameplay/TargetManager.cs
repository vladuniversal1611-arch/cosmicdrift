using System.Collections.Generic;
using UnityEngine;
using Scanline.Data;
using Scanline.Pooling;

namespace Scanline.Gameplay
{
    public class TargetManager : MonoBehaviour
    {
        [SerializeField] private TargetConfig config;
        [SerializeField] private Target standardPrefab;
        [SerializeField] private Target bonusPrefab;
        [SerializeField] private Target protectedNodePrefab;
        [SerializeField] private Rect spawnBounds;

        public IReadOnlyList<Target> ActiveTargets => _active;

        private readonly List<Target> _active = new List<Target>(64);
        private ObjectPool<Target> _standardPool;
        private ObjectPool<Target> _bonusPool;
        private ObjectPool<Target> _nodePool;
        private float _spawnTimer;

        private void Awake()
        {
            _standardPool = new ObjectPool<Target>(standardPrefab, transform, config.standardPrewarmCount);
            _bonusPool = new ObjectPool<Target>(bonusPrefab, transform, config.standardPrewarmCount / 4);
            _nodePool = new ObjectPool<Target>(protectedNodePrefab, transform, config.nodePrewarmCount);
        }

        public void Tick(float deltaTime)
        {
            _spawnTimer -= deltaTime;
            if (_spawnTimer <= 0f)
            {
                SpawnNext();
                _spawnTimer = config.NextSpawnInterval();
            }

            for (int i = _active.Count - 1; i >= 0; i--)
            {
                var target = _active[i];
                target.Tick(deltaTime);
                if (target.IsOutOfBounds(spawnBounds))
                {
                    DespawnAt(i);
                }
            }
        }

        public void Despawn(Target target)
        {
            int index = _active.IndexOf(target);
            if (index >= 0) DespawnAt(index);
        }

        private void SpawnNext()
        {
            var kind = RollKind();
            var pool = PoolFor(kind);
            float radius = kind == TargetKind.Bonus ? config.bonusCollisionRadius : config.collisionRadius;

            var instance = pool.Get();
            var (position, velocity) = config.RollSpawn(spawnBounds);
            instance.Initialize(kind, position, velocity, radius);
            _active.Add(instance);
        }

        private TargetKind RollKind()
        {
            float roll = Random.value;
            if (roll < config.protectedNodeChance) return TargetKind.ProtectedNode;
            if (roll < config.protectedNodeChance + config.bonusTargetChance) return TargetKind.Bonus;
            return TargetKind.Standard;
        }

        private ObjectPool<Target> PoolFor(TargetKind kind) => kind switch
        {
            TargetKind.ProtectedNode => _nodePool,
            TargetKind.Bonus => _bonusPool,
            _ => _standardPool
        };

        private void DespawnAt(int index)
        {
            var target = _active[index];
            _active.RemoveAt(index);
            PoolFor(target.Kind).Release(target);
        }
    }
}
