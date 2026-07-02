using System.Collections.Generic;
using UnityEngine;

namespace Scanline.Pooling
{
    public interface IPoolable
    {
        void OnDespawn();
    }

    public class ObjectPool<T> where T : Component, IPoolable
    {
        private readonly T _prefab;
        private readonly Transform _parent;
        private readonly Stack<T> _inactive = new Stack<T>();

        public ObjectPool(T prefab, Transform parent, int prewarmCount)
        {
            _prefab = prefab;
            _parent = parent;

            for (int i = 0; i < prewarmCount; i++)
            {
                var instance = Object.Instantiate(prefab, parent);
                instance.gameObject.SetActive(false);
                _inactive.Push(instance);
            }
        }

        public T Get()
        {
            var instance = _inactive.Count > 0
                ? _inactive.Pop()
                : Object.Instantiate(_prefab, _parent);

            instance.gameObject.SetActive(true);
            return instance;
        }

        public void Release(T instance)
        {
            instance.OnDespawn();
            instance.gameObject.SetActive(false);
            _inactive.Push(instance);
        }
    }
}
