/* ============================================================
   ANALYTICS — шар аналітики подій (заглушка)
   У Google Play підключіть Firebase Analytics (або аналог)
   і додайте виклик SDK у log(). Локально події складаються
   в кільцевий буфер (останні 300) — зручно для налагодження
   балансу: де гравці програють, які бустери використовують.
   ============================================================ */
const Analytics = (() => {
  const KEY = 'bk_analytics_v1';
  const MAX_EVENTS = 300;
  let buffer = [];
  let loaded = false;
  let sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    try { buffer = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { buffer = []; }
  }

  /**
   * Записати подію. Приклади:
   *   Analytics.log('level_result', { won: true, level: 12, score: 3400 })
   *   Analytics.log('booster_used', { kind: 'hammer' })
   */
  function log(event, params = {}) {
    ensureLoaded();
    buffer.push({ t: Date.now(), s: sessionId, e: event, p: params });
    if (buffer.length > MAX_EVENTS) buffer.splice(0, buffer.length - MAX_EVENTS);
    try { localStorage.setItem(KEY, JSON.stringify(buffer)); } catch (e) { /* quota */ }
    // ЗАГЛУШКА для продакшену:
    // FirebaseAnalytics.logEvent({ name: event, params });
  }

  /** Останні події (для налагодження в консолі: Analytics.tail()) */
  function tail(n = 20) {
    ensureLoaded();
    return buffer.slice(-n);
  }

  function clear() {
    buffer = [];
    try { localStorage.removeItem(KEY); } catch (e) { /* ігноруємо */ }
  }

  return { log, tail, clear };
})();
