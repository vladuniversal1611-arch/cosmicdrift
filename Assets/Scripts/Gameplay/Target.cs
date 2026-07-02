using UnityEngine;
using Scanline.Pooling;

namespace Scanline.Gameplay
{
    public enum TargetKind
    {
        Standard,
        Bonus,
        ProtectedNode
    }

    public class Target : MonoBehaviour, IPoolable
    {
        public TargetKind Kind { get; private set; }
        public float CollisionRadius { get; private set; }
        public Vector2 Position => transform.position;

        private Vector2 _velocity;

        public void Initialize(TargetKind kind, Vector2 spawnPosition, Vector2 velocity, float collisionRadius)
        {
            Kind = kind;
            _velocity = velocity;
            CollisionRadius = collisionRadius;
            transform.position = spawnPosition;
        }

        public void Tick(float deltaTime)
        {
            transform.position += (Vector3)(_velocity * deltaTime);
        }

        public bool IsOutOfBounds(Rect bounds) => !bounds.Contains(Position);

        public void OnDespawn()
        {
            _velocity = Vector2.zero;
        }
    }
}
