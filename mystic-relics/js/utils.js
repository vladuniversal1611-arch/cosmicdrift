/* ============================================================
 * Mystic Relics — utils.js
 * Допоміжні функції: сідований генератор випадкових чисел,
 * математика, форматування, easing-функції.
 * ============================================================ */
'use strict';

const Utils = {

  /** Сідований PRNG (mulberry32) — детермінована генерація рівнів. */
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  /** Випадкове ціле [min, max] включно на базі функції rnd. */
  ri(rnd, min, max) { return min + Math.floor(rnd() * (max - min + 1)); },

  /** Перемішування масиву (Fisher–Yates) на базі rnd. */
  shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  clamp(v, min, max) { return v < min ? min : v > max ? max : v; },
  lerp(a, b, t) { return a + (b - a) * t; },

  /* --- Easing --- */
  easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeInCubic(t) { return t * t * t; },
  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeOutBounce(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  /** Квадратична крива Безьє для польоту плиток. */
  bezier(p0, p1, p2, t) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  },

  /** Форматування великих чисел: 12 450 → "12 450", 1 500 000 → "1.5M". */
  fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /** Секунди → "MM:SS". */
  time(s) {
    s = Math.max(0, Math.ceil(s));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  },

  /** Поточна дата у форматі YYYY-MM-DD (для щоденних нагород). */
  today() { return new Date().toISOString().slice(0, 10); },

  /** Вібрація (якщо підтримується та увімкнена). */
  vibrate(ms) {
    if (Storage.data.settings.vibration && navigator.vibrate) navigator.vibrate(ms);
  }
};
