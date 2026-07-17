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
  },

  /* ============================================================
   * Власні векторні іконки валют (монета + кристал).
   * Єдине джерело правди: у DOM — inline-SVG, на canvas — Image.
   * Кристал замінює старе «фіолетове серце» — валюта = кристали.
   * ============================================================ */
  ICON: {
    coin: '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="mrCoin" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff7cc"/><stop offset="42%" stop-color="#ffd23f"/><stop offset="100%" stop-color="#e0890c"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="#8f4e00"/><circle cx="16" cy="16" r="14" fill="#c9800f"/><circle cx="16" cy="16" r="12.3" fill="url(#mrCoin)" stroke="#ffefa4" stroke-width="0.9"/><circle cx="16" cy="16" r="9.3" fill="none" stroke="#d98a12" stroke-width="0.9" opacity="0.5"/><path d="M16 9.6 17.6 13.9 22.1 14.1 18.5 16.9 19.7 21.2 16 18.7 12.3 21.2 13.5 16.9 9.9 14.1 14.4 13.9Z" fill="#fff3b4" stroke="#c9820c" stroke-width="0.5" stroke-linejoin="round"/><ellipse cx="11.3" cy="10.3" rx="3.3" ry="1.7" fill="#fff" opacity="0.55" transform="rotate(-34 11.3 10.3)"/></svg>',
    gem: '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="mrGem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2ccff"/><stop offset="45%" stop-color="#b45cff"/><stop offset="100%" stop-color="#7a1fd6"/></linearGradient></defs><polygon points="10,6 22,6 27.5,13 16,29 4.5,13" fill="url(#mrGem)" stroke="#f4ddff" stroke-width="0.9" stroke-linejoin="round"/><polygon points="10,6 22,6 19.4,13 12.6,13" fill="#e6b8ff" opacity="0.85"/><polygon points="4.5,13 12.6,13 16,29" fill="#8a2fe0" opacity="0.8"/><polygon points="27.5,13 19.4,13 16,29" fill="#6412bb" opacity="0.85"/><polygon points="12.6,13 19.4,13 16,29" fill="#a651f0"/><path d="M12.6 13 16 29 19.4 13" fill="none" stroke="#d29bff" stroke-width="0.5" opacity="0.6"/><line x1="10" y1="6" x2="12.6" y2="13" stroke="#f4ddff" stroke-width="0.6" opacity="0.6"/><circle cx="14" cy="9.5" r="1.1" fill="#fff" opacity="0.8"/></svg>'
  },
  img: {},   // Image-обʼєкти тих самих іконок для рендеру на canvas

  /** Готує Image-версії іконок (викликати один раз після завантаження). */
  buildIcons() {
    for (const k in this.ICON) {
      const im = new Image();
      im.src = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(this.ICON[k]);
      this.img[k] = im;
    }
  },

  /** Inline-іконка як «гліф» тексту. Якщо є PNG-спрайт (Assets.ui) —
   *  використовує його, інакше — вбудований SVG (гарантований fallback). */
  ic(name, cls = '') {
    const im = (typeof Assets !== 'undefined' && Assets.ui && Assets.ui[name]);
    if (im && im.complete) return `<img class="ico-svg ${cls}" src="${im.src}" alt="">`;
    return `<span class="ico-svg ${cls}">${this.ICON[name] || ''}</span>`;
  },

  /** Найкраще джерело для canvas: PNG-спрайт, якщо готовий, інакше SVG-Image. */
  iconImg(name) {
    const im = (typeof Assets !== 'undefined' && Assets.ui && Assets.ui[name]);
    return (im && im.complete) ? im : this.img[name];
  },

  /** Перетворює емодзі-валюту у власну векторну іконку (для нагород). */
  moneyIco(g) {
    if (g === '🪙') return this.ic('coin');
    if (g === '💜' || g === '💎') return this.ic('gem');
    return `<span class="ico-emoji">${g}</span>`;
  }
};
