/* ============================================================
   PARTICLES — система частинок, іскри, тряска, спалахи,
   летючі написи. Малюється поверх ігрового канвасу.
   Оптимізовано: пул об'єктів, без алокацій у кадрі
   ============================================================ */
const Particles = (() => {
  const MAX = 600;
  const pool = [];
  let active = 0;
  // Летючі тексти
  const texts = [];
  // Тряска екрану
  let shakeTime = 0, shakePower = 0;

  // Ініціалізація пулу
  for (let i = 0; i < MAX; i++) {
    pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 4, color: '#fff', grav: 0, type: 'square', rot: 0, vrot: 0 });
  }

  function spawn(opts) {
    if (active >= MAX) return;
    const p = pool[active++];
    p.x = opts.x; p.y = opts.y;
    p.vx = opts.vx || 0; p.vy = opts.vy || 0;
    p.life = p.maxLife = opts.life || 0.8;
    p.size = opts.size || 5;
    p.color = opts.color || '#fff';
    p.grav = opts.grav !== undefined ? opts.grav : 500;
    p.type = opts.type || 'square';
    p.rot = Math.random() * Math.PI * 2;
    p.vrot = (Math.random() - 0.5) * 10;
  }

  /** Вибух уламків блоку (при очищенні лінії) */
  function burst(x, y, color, n = 10, power = 260) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = power * (0.4 + Math.random() * 0.8);
      spawn({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90,
        life: 0.5 + Math.random() * 0.5,
        size: 3 + Math.random() * 6,
        color, grav: 700, type: Math.random() < 0.6 ? 'square' : 'spark',
      });
    }
  }

  /** Іскри-зірочки (комбо, кристали) */
  function sparkle(x, y, n = 8, color = '#ffe9a8') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      spawn({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.6 + Math.random() * 0.6,
        size: 2 + Math.random() * 4,
        color, grav: 0, type: 'spark',
      });
    }
  }

  /** Великий вибух бомби */
  function explosion(x, y) {
    burst(x, y, '#ffb545', 24, 420);
    burst(x, y, '#ff5c8a', 16, 320);
    sparkle(x, y, 20, '#fff');
    shake(14, 0.4);
    flash();
  }

  /** Летючий текст (+250, COMBO x3 ...) */
  function flyText(x, y, str, opts = {}) {
    texts.push({
      x, y, str,
      life: opts.life || 1.1,
      maxLife: opts.life || 1.1,
      size: opts.size || 22,
      color: opts.color || '#ffe9a8',
      vy: opts.vy || -70,
    });
  }

  function shake(power = 8, time = 0.3) {
    shakePower = Math.max(shakePower, power);
    shakeTime = Math.max(shakeTime, time);
  }

  /** Спалах екрану (DOM, дешево) */
  function flash() {
    const el = document.createElement('div');
    el.className = 'screen-flash';
    document.getElementById('app').appendChild(el);
    setTimeout(() => el.remove(), 420);
  }

  /** Оновлення фізики; повертає зсув тряски для рендера */
  function update(dt) {
    for (let i = active - 1; i >= 0; i--) {
      const p = pool[i];
      p.life -= dt;
      if (p.life <= 0) {
        // swap-remove: живі частинки завжди на початку пулу
        active--;
        const tmp = pool[i]; pool[i] = pool[active]; pool[active] = tmp;
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
    if (shakeTime > 0) {
      shakeTime -= dt;
      if (shakeTime <= 0) shakePower = 0;
    }
    return shakePower > 0
      ? { x: (Math.random() - 0.5) * shakePower, y: (Math.random() - 0.5) * shakePower }
      : { x: 0, y: 0 };
  }

  function draw(ctx) {
    for (let i = 0; i < active; i++) {
      const p = pool[i];
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.type === 'spark') {
        // Чотирипроменева зірочка
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (0.5 + a);
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s, 0); ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.3, s * 0.3); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }
    // Летючі тексти
    for (const t of texts) {
      const a = Math.min(1, t.life / t.maxLife * 2);
      ctx.globalAlpha = a;
      ctx.font = `900 ${t.size}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(t.str, t.x + 2, t.y + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  function clear() { active = 0; texts.length = 0; shakeTime = 0; shakePower = 0; }

  function isBusy() { return active > 0 || texts.length > 0; }

  return { spawn, burst, sparkle, explosion, flyText, shake, flash, update, draw, clear, isBusy };
})();
