/**
 * LandmarkArt.js
 * -----------------------------------------------------------------------------
 * Procedural, staged drawing for the floating world's landmarks. One entry per
 * `art` id; each draws a floating island and a structure whose completeness is
 * driven by `c` (0 = broken ruins → 1 = fully restored). Kept data-light and
 * modular: adding a landmark art is a single function here.
 *
 * All routines draw relative to a ground point atop the island, using the
 * biome accent `color`, so they read consistently across biomes.
 * -----------------------------------------------------------------------------
 */
import { Palette } from '../../config/Palette.js';

/** Draw the floating rock island. Returns the ground Y where a structure sits. */
function island(renderer, cx, cy, w, color, glow) {
  const ctx = renderer.ctx;
  const h = w * 0.42;
  // Rocky top.
  renderer.withGlow(glow ? color : 'rgba(0,0,0,0)', glow ? 16 : 0, () => {
    ctx.fillStyle = '#2a2436';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Tapered underside.
  ctx.fillStyle = '#171325';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.42, cy);
  ctx.lineTo(cx + w * 0.42, cy);
  ctx.lineTo(cx, cy + h * 0.9);
  ctx.closePath();
  ctx.fill();
  // Grass/biome rim.
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  return cy - h * 0.32;
}

/** Faint rubble for broken stages. */
function rubble(renderer, cx, gy, s) {
  const ctx = renderer.ctx;
  ctx.fillStyle = '#3a3448';
  for (let i = 0; i < 4; i++) {
    const rx = cx + (i - 1.5) * s * 0.22;
    renderer.fillRoundRect(rx, gy - s * 0.08, s * 0.16, s * 0.14, 2, '#3a3448');
  }
}

const ART = {
  bridge(r, cx, gy, s, color, c) {
    const ctx = r.ctx;
    // Two pillars always; the span fills in with completeness.
    r.fillRoundRect(cx - s * 0.42, gy - s * 0.5, s * 0.12, s * 0.5, 2, '#6b6480');
    r.fillRoundRect(cx + s * 0.30, gy - s * 0.5, s * 0.12, s * 0.5, 2, '#6b6480');
    if (c <= 0) { rubble(r, cx, gy, s); return; }
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';
    r.withGlow(color, c >= 1 ? 12 : 0, () => {
      ctx.beginPath();
      ctx.arc(cx, gy - s * 0.2, s * 0.42, Math.PI * 1.05, Math.PI * (1.05 + 0.9 * c));
      ctx.stroke();
    });
  },
  tree(r, cx, gy, s, color, c) {
    r.fillRoundRect(cx - s * 0.06, gy - s * 0.5 * Math.max(0.25, c), s * 0.12, s * 0.5 * Math.max(0.25, c), 3, '#6b4a2b');
    if (c <= 0) { rubble(r, cx, gy, s); return; }
    const cn = s * (0.14 + 0.22 * c);
    r.withGlow(color, c >= 1 ? 14 : 4, () => {
      r.fillCircle(cx, gy - s * 0.5 * c - cn * 0.4, cn, color);
      r.fillCircle(cx - cn * 0.7, gy - s * 0.5 * c + cn * 0.2, cn * 0.7, color);
      r.fillCircle(cx + cn * 0.7, gy - s * 0.5 * c + cn * 0.2, cn * 0.7, color);
    });
  },
  tower(r, cx, gy, s, color, c) {
    const segs = Math.max(1, Math.round(c * 3));
    for (let i = 0; i < segs; i++) {
      const w = s * (0.32 - i * 0.05);
      r.fillRoundRect(cx - w / 2, gy - s * 0.18 * (i + 1), w, s * 0.18, 2, i === segs - 1 && c >= 1 ? color : '#6b6480');
    }
    if (c >= 1) r.withGlow(color, 14, () => r.fillCircle(cx, gy - s * 0.18 * segs - s * 0.06, s * 0.07, '#fff'));
    if (c <= 0) rubble(r, cx, gy, s);
  },
  nest(r, cx, gy, s, color, c) {
    const ctx = r.ctx;
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.arc(cx, gy - s * 0.05, s * 0.3, 0, Math.PI * 2); ctx.stroke();
    const eggs = Math.round(c * 3);
    for (let i = 0; i < eggs; i++) {
      r.withGlow(color, c >= 1 ? 12 : 0, () =>
        r.fillCircle(cx + (i - 1) * s * 0.16, gy - s * 0.08, s * 0.08, color));
    }
    if (c <= 0) rubble(r, cx, gy, s);
  },
  cave(r, cx, gy, s, color, c) {
    const ctx = r.ctx;
    ctx.fillStyle = '#3a3448';
    ctx.beginPath(); ctx.arc(cx, gy, s * 0.4, Math.PI, 0); ctx.fill();
    // Opening widens with completeness.
    ctx.fillStyle = c >= 1 ? '#05010f' : '#241f30';
    ctx.beginPath(); ctx.arc(cx, gy, s * 0.24 * Math.max(0.2, c), Math.PI, 0); ctx.fill();
    if (c >= 1) {
      r.withGlow(color, 12, () => {
        r.fillCircle(cx - s * 0.1, gy - s * 0.06, s * 0.05, color);
        r.fillCircle(cx + s * 0.1, gy - s * 0.05, s * 0.05, color);
      });
    }
  },
  waterfall(r, cx, gy, s, color, c) {
    r.fillRoundRect(cx - s * 0.28, gy - s * 0.5, s * 0.56, s * 0.5, 3, '#4a4460');
    const streams = Math.round(c * 4);
    const ctx = r.ctx; ctx.strokeStyle = color; ctx.lineWidth = s * 0.05; ctx.globalAlpha = 0.85;
    for (let i = 0; i < streams; i++) {
      const x = cx - s * 0.2 + i * s * 0.13;
      ctx.beginPath(); ctx.moveTo(x, gy - s * 0.46); ctx.lineTo(x, gy - s * 0.02); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (c <= 0) rubble(r, cx, gy, s);
  },
  library(r, cx, gy, s, color, c) {
    r.fillRoundRect(cx - s * 0.34, gy - s * 0.34, s * 0.68, s * 0.34, 2, '#5a5470');
    for (let i = 0; i < 4; i++) r.fillRoundRect(cx - s * 0.28 + i * s * 0.18, gy - s * 0.3, s * 0.06, s * 0.3, 1, '#7a7490');
    if (c >= 0.5) { // roof
      const ctx = r.ctx; ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, gy - s * 0.34); ctx.lineTo(cx + s * 0.4, gy - s * 0.34); ctx.lineTo(cx, gy - s * 0.54); ctx.closePath(); ctx.fill();
    }
    if (c >= 1) r.withGlow(color, 12, () => r.fillCircle(cx, gy - s * 0.16, s * 0.06, '#fff'));
    if (c <= 0) rubble(r, cx, gy, s);
  },
  harbor(r, cx, gy, s, color, c) {
    r.fillRoundRect(cx - s * 0.4, gy - s * 0.08, s * 0.8, s * 0.1, 2, '#6b6480');
    if (c > 0) { // mast + sail rising with completeness
      r.fillRoundRect(cx - s * 0.02, gy - s * 0.5 * c, s * 0.04, s * 0.5 * c, 1, '#6b4a2b');
      r.withGlow(color, c >= 1 ? 12 : 0, () => {
        const ctx = r.ctx; ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(cx + s * 0.02, gy - s * 0.5 * c);
        ctx.lineTo(cx + s * 0.24, gy - s * 0.3 * c); ctx.lineTo(cx + s * 0.02, gy - s * 0.12 * c); ctx.closePath(); ctx.fill();
      });
    } else rubble(r, cx, gy, s);
  },
  portal(r, cx, gy, s, color, c) {
    const ctx = r.ctx;
    ctx.strokeStyle = '#6b6480'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.arc(cx, gy - s * 0.24, s * 0.3, 0, Math.PI * 2); ctx.stroke();
    if (c > 0) {
      r.withGlow(color, c >= 1 ? 16 : 4, () => {
        const g = r.radialGradient(cx, gy - s * 0.24, s * 0.28 * c,
          [[0, '#fff'], [0.5, color], [1, 'rgba(0,0,0,0)']]);
        r.fillCircle(cx, gy - s * 0.24, s * 0.28 * c, g);
      });
    } else rubble(r, cx, gy, s);
  },
};

/**
 * Draw a landmark. `st` = { stage, maxStage, complete }. `color` is the biome
 * accent. `time` drives the idle bob/glow.
 */
export function drawLandmark(renderer, cx, cy, w, def, st, color, time, phase = 0) {
  const bob = Math.sin(time * 1.2 + phase) * 4;
  const gy = island(renderer, cx, cy + bob, w, color, st.complete);
  const s = w * 0.6;
  const c = st.maxStage ? st.stage / st.maxStage : 0;
  (ART[def.art] ?? ART.tower)(renderer, cx, gy + bob, s, color, c);

  // Restored landmarks get a gentle celebratory sparkle.
  if (st.complete) {
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + phase);
    renderer.setAlpha(0.5 + tw * 0.5);
    renderer.sparkle(cx + w * 0.28, cy - w * 0.2 + bob, w * 0.05 * (0.6 + tw), Palette.textPrimary);
    renderer.setAlpha(1);
  }
}
