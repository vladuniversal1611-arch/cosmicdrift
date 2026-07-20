/**
 * ObjectPool.js
 * -----------------------------------------------------------------------------
 * Generic object pool to keep the garbage collector quiet in hot paths such as
 * particles, tweens and transient UI effects. Reusing instances avoids
 * frame-time spikes from GC pauses — essential for a stable 60 FPS.
 *
 * Usage:
 *   const pool = new ObjectPool(() => new Particle(), p => p.reset());
 *   const p = pool.acquire();  // ...use it...
 *   pool.release(p);           // return it for reuse
 * -----------------------------------------------------------------------------
 */
export class ObjectPool {
  /**
   * @param {() => T} factory  Creates a fresh instance when the pool is empty.
   * @param {(obj: T) => void} [reset]  Optional hook to clear state on release.
   * @param {number} [prefill] Number of instances to allocate up front.
   * @template T
   */
  constructor(factory, reset = null, prefill = 0) {
    this._factory = factory;
    this._reset = reset;
    this._free = [];
    this._activeCount = 0;
    for (let i = 0; i < prefill; i++) this._free.push(factory());
  }

  /** Get an instance, creating one only if the pool is exhausted. */
  acquire() {
    this._activeCount++;
    return this._free.length ? this._free.pop() : this._factory();
  }

  /** Return an instance to the pool. */
  release(obj) {
    if (this._reset) this._reset(obj);
    this._free.push(obj);
    if (this._activeCount > 0) this._activeCount--;
  }

  /** Number of instances currently checked out. */
  get activeCount() { return this._activeCount; }

  /** Number of instances sitting idle in the pool. */
  get freeCount() { return this._free.length; }
}
