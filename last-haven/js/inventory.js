/* Inventory: slot-based containers (backpack, chests, loot). A slot is null or {id, n, dur?}. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});
  const I = () => BI.Data.ITEMS;

  const Inv = {
    BAG_SIZE: 24,

    make(n) { return new Array(n).fill(null); },

    count(slots, id) {
      let c = 0;
      for (let i = 0; i < slots.length; i++) if (slots[i] && slots[i].id === id) c += slots[i].n;
      return c;
    },

    /** How many of `id` still fit. */
    space(slots, id) {
      const st = I()[id].stack;
      let s = 0;
      for (let i = 0; i < slots.length; i++) {
        const x = slots[i];
        if (!x) s += st;
        else if (x.id === id && st > 1) s += st - x.n;
      }
      return s;
    },

    /** Add items; returns how many did NOT fit. */
    add(slots, id, n, dur) {
      const it = I()[id];
      const st = it.stack;
      if (st > 1) {
        for (let i = 0; i < slots.length && n > 0; i++) {
          const x = slots[i];
          if (x && x.id === id && x.n < st) {
            const k = Math.min(n, st - x.n);
            x.n += k;
            n -= k;
          }
        }
      }
      for (let i = 0; i < slots.length && n > 0; i++) {
        if (!slots[i]) {
          const k = Math.min(n, st);
          slots[i] = { id, n: k };
          if (it.dur) slots[i].dur = dur != null ? dur : it.dur;
          n -= k;
        }
      }
      return n;
    },

    /** Remove n of id (from the last stacks first). Returns false if not enough. */
    remove(slots, id, n) {
      if (this.count(slots, id) < n) return false;
      for (let i = slots.length - 1; i >= 0 && n > 0; i--) {
        const x = slots[i];
        if (x && x.id === id) {
          const k = Math.min(n, x.n);
          x.n -= k;
          n -= k;
          if (x.n <= 0) slots[i] = null;
        }
      }
      return true;
    },

    has(slots, cost) {
      return Object.keys(cost).every((k) => this.count(slots, k) >= cost[k]);
    },
    take(slots, cost) {
      if (!this.has(slots, cost)) return false;
      Object.keys(cost).forEach((k) => this.remove(slots, k, cost[k]));
      return true;
    },

    /** Best tool of a kind in the slots: the slot object, or null. */
    bestTool(slots, kind) {
      let best = null;
      for (let i = 0; i < slots.length; i++) {
        const x = slots[i];
        if (!x) continue;
        const it = I()[x.id];
        if (it.type === 'tool' && it.tool === kind && (!best || it.power > I()[best.id].power)) best = x;
      }
      return best;
    },

    /** Use durability on a slot item; removes it from `slots` when broken. Returns true if it broke. */
    wear(slots, slot, amount) {
      if (!slot || slot.dur == null) return false;
      slot.dur -= amount || 1;
      if (slot.dur <= 0) {
        const i = slots.indexOf(slot);
        if (i >= 0) slots[i] = null;
        return true;
      }
      return false;
    },

    /** Move everything possible from one container to another. Returns number of stacks moved fully. */
    moveAll(from, to) {
      let moved = 0;
      for (let i = 0; i < from.length; i++) {
        const x = from[i];
        if (!x) continue;
        if (x.dur != null) {
          const j = to.indexOf(null);
          if (j < 0) continue;
          to[j] = x;
          from[i] = null;
          moved++;
        } else {
          const left = this.add(to, x.id, x.n);
          if (left === 0) { from[i] = null; moved++; } else x.n = left;
        }
      }
      return moved;
    },

    /** Move one slot to another container. */
    moveSlot(from, i, to) {
      const x = from[i];
      if (!x) return false;
      if (x.dur != null) {
        const j = to.indexOf(null);
        if (j < 0) return false;
        to[j] = x;
        from[i] = null;
        return true;
      }
      const left = this.add(to, x.id, x.n);
      if (left === x.n) return false;
      if (left === 0) from[i] = null; else x.n = left;
      return true;
    },

    isEmpty(slots) { return slots.every((x) => !x); },
  };

  BI.Inv = Inv;
})();
