/* Input: keyboard, floating joystick, hold-to-act button, taps & drags on the canvas. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const keys = {};
  const joy = { active: false, id: null, cx: 0, cy: 0, x: 0, y: 0, radius: 50 };
  const ptrs = new Map();
  let joyEl, knobEl;

  const Input = {
    keys, joy, actionHeld: false, lastTap: 0,

    init(canvas) {
      joyEl = document.getElementById('joystick');
      knobEl = document.getElementById('joy-knob');
      canvas.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('wheel', (e) => { e.preventDefault(); BI.Game.onWheel(e.deltaY); }, { passive: false });

      // the big action button: hold to keep chopping / mining / attacking
      const act = document.getElementById('btn-action');
      const press = (e) => { e.preventDefault(); Input.actionHeld = true; act.classList.add('pressed'); BI.Game.onActionPress(); };
      const release = () => { Input.actionHeld = false; act.classList.remove('pressed'); };
      act.addEventListener('pointerdown', press);
      act.addEventListener('pointerup', release);
      act.addEventListener('pointerleave', release);
      act.addEventListener('pointercancel', release);

      window.addEventListener('keydown', (e) => {
        if (e.repeat && keys[e.code]) return;
        keys[e.code] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
        if (e.code === 'Space' || e.code === 'KeyE') { Input.actionHeld = true; BI.Game.onActionPress(); }
        BI.Game.onKey(e.code);
      });
      window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Space' || e.code === 'KeyE') Input.actionHeld = false;
      });
      window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); Input.actionHeld = false; releaseJoy(); });
      document.addEventListener('touchmove', (e) => { if (!e.target.closest || !e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
      ['gesturestart', 'gesturechange', 'dblclick'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
    },

    getMove() {
      let x = 0, y = 0;
      if (keys.KeyA || keys.ArrowLeft) x -= 1;
      if (keys.KeyD || keys.ArrowRight) x += 1;
      if (keys.KeyW || keys.ArrowUp) y -= 1;
      if (keys.KeyS || keys.ArrowDown) y += 1;
      if (joy.active) { x += joy.x; y += joy.y; }
      const L = Math.hypot(x, y);
      if (L > 1) { x /= L; y /= L; }
      return { x, y };
    },
    releaseJoy,
  };

  function defaultJoyCenter() {
    const r = joyEl.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  }

  function onDown(e) {
    const G = BI.Game, st = G.state;
    if (st === 'GAMEPLAY' && !joy.active) {
      const dc = defaultJoyCenter();
      if (dc && e.clientX < window.innerWidth * 0.5 && e.clientY > window.innerHeight * 0.5) {
        joy.active = true;
        joy.id = e.pointerId;
        joy.radius = dc.r * 0.75;
        const near = Math.hypot(e.clientX - dc.x, e.clientY - dc.y) < dc.r * 1.1;
        joy.cx = near ? dc.x : e.clientX;
        joy.cy = near ? dc.y : e.clientY;
        joyEl.classList.add('active');
        joyEl.style.transform = 'translate(' + (joy.cx - dc.x) + 'px,' + (joy.cy - dc.y) + 'px)';
        updateJoy(e.clientX, e.clientY);
        G.player.target = null;
        try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        return;
      }
    }
    const p = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), moved: false, mode: null, off: null };
    if (st === 'BUILD_MODE' && G.build) {
      const g = G.screenToGrid(e.clientX, e.clientY), b = G.build;
      if (g.x >= b.gx - 0.6 && g.x <= b.gx + 1.6 && g.y >= b.gy - 0.6 && g.y <= b.gy + 1.6) { p.mode = 'ghost'; p.off = { x: b.gx - g.x, y: b.gy - g.y }; } else p.mode = 'pan';
    }
    ptrs.set(e.pointerId, p);
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  function onMove(e) {
    const G = BI.Game;
    if (joy.active && e.pointerId === joy.id) { updateJoy(e.clientX, e.clientY); return; }
    const p = ptrs.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse' && G.state === 'BUILD_MODE' && e.target === G.canvas) {
        const g = G.screenToGrid(e.clientX, e.clientY);
        G.moveGhostTo(Math.floor(g.x), Math.floor(g.y));
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 9) p.moved = true;
    if (!p.moved) return;
    if (p.mode === 'ghost') {
      const g = G.screenToGrid(e.clientX, e.clientY);
      G.moveGhostTo(Math.round(g.x + p.off.x), Math.round(g.y + p.off.y));
    } else if (p.mode === 'pan') G.panCamera(dx, dy);
  }

  function onUp(e) {
    if (joy.active && e.pointerId === joy.id) { releaseJoy(); return; }
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    ptrs.delete(e.pointerId);
    if (!p.moved && performance.now() - p.t < 500) {
      Input.lastTap = performance.now();
      BI.Game.onTap(e.clientX, e.clientY);
    }
  }

  function updateJoy(x, y) {
    let dx = x - joy.cx, dy = y - joy.cy;
    const L = Math.hypot(dx, dy), R = joy.radius;
    if (L > R) { dx = (dx / L) * R; dy = (dy / L) * R; }
    joy.x = dx / R; joy.y = dy / R;
    if (Math.hypot(joy.x, joy.y) < 0.12) { joy.x = 0; joy.y = 0; }
    knobEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }
  function releaseJoy() {
    joy.active = false; joy.id = null; joy.x = joy.y = 0;
    if (knobEl) { knobEl.style.transform = ''; joyEl.style.transform = ''; joyEl.classList.remove('active'); }
  }

  BI.Input = Input;
})();
