/* FALLSHIFT — touch / mouse swipe rotation + keyboard controls. */
(function () {
  'use strict';
  const FS = window.FS;

  class Input {
    constructor(target) {
      this.target = target;
      this.dragId = null;
      this.lastX = 0;
      this.pendingDX = 0; // accumulated swipe distance (CSS px) since last frame
      this.keys = { left: false, right: false };
      this.handlers = {}; // action -> fn
      this.enabled = true;
      this.onFirstGesture = null;

      const opts = { passive: false };
      target.addEventListener('pointerdown', (e) => this.down(e), opts);
      window.addEventListener('pointermove', (e) => this.move(e), opts);
      window.addEventListener('pointerup', (e) => this.up(e), opts);
      window.addEventListener('pointercancel', (e) => this.up(e), opts);
      // block browser gestures (pull-to-refresh, double tap zoom)
      target.addEventListener('touchstart', (e) => e.preventDefault(), opts);
      target.addEventListener('touchmove', (e) => e.preventDefault(), opts);
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      window.addEventListener('keydown', (e) => this.key(e, true));
      window.addEventListener('keyup', (e) => this.key(e, false));
      window.addEventListener('blur', () => {
        this.keys.left = this.keys.right = false;
        this.dragId = null;
      });
    }

    on(action, fn) {
      this.handlers[action] = fn;
    }

    fire(action) {
      if (this.handlers[action]) this.handlers[action]();
    }

    gesture() {
      if (this.onFirstGesture) this.onFirstGesture();
    }

    down(e) {
      this.gesture();
      if (this.dragId !== null) return;
      this.dragId = e.pointerId;
      this.lastX = e.clientX;
      e.preventDefault();
    }

    move(e) {
      if (e.pointerId !== this.dragId) return;
      const dx = e.clientX - this.lastX;
      this.lastX = e.clientX;
      if (this.enabled) this.pendingDX += dx;
    }

    up(e) {
      if (e.pointerId === this.dragId) this.dragId = null;
    }

    consumeDX() {
      const d = this.pendingDX;
      this.pendingDX = 0;
      return d;
    }

    key(e, down) {
      if (down) this.gesture();
      const k = e.key;
      const code = e.code;
      if (k === 'ArrowLeft' || code === 'KeyA') {
        this.keys.left = down;
        e.preventDefault();
      } else if (k === 'ArrowRight' || code === 'KeyD') {
        this.keys.right = down;
        e.preventDefault();
      } else if (down && !e.repeat) {
        if (code === 'Space' || k === 'ArrowDown' || code === 'KeyS' || code === 'KeyJ') {
          this.fire('dash');
          e.preventDefault();
        } else if (k === 'ArrowUp' || code === 'KeyW' || code === 'KeyK') {
          this.fire('gravity');
          e.preventDefault();
        } else if (code === 'KeyE' || code === 'KeyL' || code === 'KeyQ') {
          this.fire('break');
        } else if (k === 'Escape' || code === 'KeyP') {
          this.fire('pause');
        } else if (k === 'Enter') {
          this.fire('confirm');
        }
      }
    }

    // keyboard rotation direction: -1 left, +1 right
    keyDir() {
      return (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    }
  }

  FS.Input = Input;
})();
