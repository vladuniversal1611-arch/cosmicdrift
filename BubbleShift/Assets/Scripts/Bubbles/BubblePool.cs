using System.Collections.Generic;
using UnityEngine;

namespace BubbleShift.Bubbles
{
    /// <summary>
    /// Simple, allocation-friendly object pool for Bubble instances. Prewarms a
    /// buffer at load so no Instantiate/Destroy happens during the gameplay loop
    /// (important for mobile GC pressure). Not a MonoBehaviour — owned by
    /// BubbleManager which supplies the prefab and a parent transform.
    /// </summary>
    public class BubblePool
    {
        private readonly Bubble _prefab;
        private readonly Transform _inactiveParent;
        private readonly Stack<Bubble> _free = new Stack<Bubble>(64);

        public BubblePool(Bubble prefab, Transform inactiveParent, int prewarm)
        {
            _prefab = prefab;
            _inactiveParent = inactiveParent;
            for (int i = 0; i < prewarm; i++)
                _free.Push(CreateNew());
        }

        private Bubble CreateNew()
        {
            var b = Object.Instantiate(_prefab, _inactiveParent);
            b.gameObject.SetActive(false);
            return b;
        }

        /// <summary>Get a bubble, parented to <paramref name="parent"/> and activated.</summary>
        public Bubble Get(Transform parent)
        {
            Bubble b = _free.Count > 0 ? _free.Pop() : CreateNew();
            b.transform.SetParent(parent, false);
            b.gameObject.SetActive(true);
            return b;
        }

        /// <summary>Return a bubble to the pool (deactivated + reparented).</summary>
        public void Release(Bubble b)
        {
            if (b == null) return;
            b.OnDespawn();
            b.gameObject.SetActive(false);
            b.transform.SetParent(_inactiveParent, false);
            _free.Push(b);
        }
    }
}
