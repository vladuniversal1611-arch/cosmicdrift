/**
 * Icons.js
 * -----------------------------------------------------------------------------
 * Procedural, white(-ish) vector glyphs shared by every Home Screen component,
 * so no two components redraw the same shape. Each icon is `(r, cx, cy, s)` and
 * draws centred on (cx,cy) at radius ~s. Colours default to white for tinting
 * over coloured buttons. These are the seams that swap for premium sprites: a
 * component asks Icons.<name>; later that resolves to art via the AssetManager.
 * -----------------------------------------------------------------------------
 */
export const Icons = {
  gear(r, cx, cy, s, col = '#fff') {
    const ctx = r.ctx; ctx.fillStyle = col;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s, cy + Math.sin(a) * s, s * 0.3, 0, Math.PI * 2); ctx.fill(); }
    r.fillCircle(cx, cy, s * 0.82, col); r.fillCircle(cx, cy, s * 0.4, 'rgba(47,143,224,0.9)');
  },
  mail(r, cx, cy, s, col = '#fff') {
    const w = s * 1.7, h = s * 1.2;
    r.fillRoundRect(cx - w / 2, cy - h / 2, w, h, s * 0.2, col);
    const ctx = r.ctx; ctx.strokeStyle = 'rgba(47,143,224,0.9)'; ctx.lineWidth = s * 0.16; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx - w / 2 + s * 0.14, cy - h / 2 + s * 0.16);
    ctx.lineTo(cx, cy + s * 0.16); ctx.lineTo(cx + w / 2 - s * 0.14, cy - h / 2 + s * 0.16); ctx.stroke();
  },
  bell(r, cx, cy, s, col = '#fff') {
    const ctx = r.ctx; ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.8, cy + s * 0.5);
    ctx.quadraticCurveTo(cx - s * 0.7, cy - s * 0.7, cx, cy - s * 0.8);
    ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.7, cx + s * 0.8, cy + s * 0.5);
    ctx.closePath(); ctx.fill();
    r.fillCircle(cx, cy - s * 0.9, s * 0.18, col);
    r.fillCircle(cx, cy + s * 0.7, s * 0.22, col);
  },
  plus(r, cx, cy, s, col = '#7a4a00') {
    r.text('+', cx, cy + 1, { font: `900 ${Math.round(s * 2.2)}px system-ui, sans-serif`, color: col, align: 'center', baseline: 'middle' });
  },
  coin(r, cx, cy, s) {
    const ctx = r.ctx;
    ctx.fillStyle = '#e0a41e'; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.12, s, s * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#fff3c4'], [1, '#ffcf5e']]);
    ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.92, s * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    r.text('★', cx, cy + 1, { font: `900 ${s}px system-ui, sans-serif`, color: '#e0a41e', align: 'center', baseline: 'middle' });
    r.setAlpha(0.6); r.fillCircle(cx - s * 0.32, cy - s * 0.3, s * 0.18, '#fff'); r.setAlpha(1);
  },
  gem(r, cx, cy, s) {
    const ctx = r.ctx;
    ctx.fillStyle = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#e2f4ff'], [1, '#2f8bff']]);
    ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx - s * 0.9, cy - s * 0.1); ctx.lineTo(cx, cy + s); ctx.lineTo(cx + s * 0.9, cy - s * 0.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.9, cy - s * 0.1); ctx.lineTo(cx + s * 0.9, cy - s * 0.1); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
    r.sparkle(cx - s * 0.28, cy - s * 0.28, s * 0.2, '#fff');
  },
  energy(r, cx, cy, s) {
    const ctx = r.ctx;
    ctx.fillStyle = r.linearGradient(cx, cy - s, cx, cy + s, [[0, '#c2fff4'], [1, '#18d0c0']]);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(cx + s * 0.12, cy - s * 0.62); ctx.lineTo(cx - s * 0.34, cy + s * 0.06); ctx.lineTo(cx, cy + s * 0.06);
    ctx.lineTo(cx - s * 0.12, cy + s * 0.62); ctx.lineTo(cx + s * 0.4, cy - s * 0.12); ctx.lineTo(cx + s * 0.02, cy - s * 0.12); ctx.closePath(); ctx.fill();
  },
  dust(r, cx, cy, s) {
    // Dragon Dust: a small pouch puffing sparkles.
    r.fillCircle(cx, cy + s * 0.15, s * 0.72, '#c9a2ff');
    r.fillRoundRect(cx - s * 0.4, cy - s * 0.7, s * 0.8, s * 0.4, s * 0.14, '#8a5ad0');
    r.sparkle(cx + s * 0.5, cy - s * 0.5, s * 0.34, '#fff');
    r.sparkle(cx - s * 0.5, cy - s * 0.2, s * 0.22, '#ffe6ff');
  },
  island(r, cx, cy, s) {
    const ctx = r.ctx; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.32, s, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    r.fillCircle(cx, cy - s * 0.2, s * 0.52, '#fff');
  },
  map(r, cx, cy, s, col = '#fff') {
    const ctx = r.ctx; ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s * 0.7); ctx.lineTo(cx - s * 0.33, cy - s); ctx.lineTo(cx + s * 0.33, cy - s * 0.7);
    ctx.lineTo(cx + s, cy - s); ctx.lineTo(cx + s, cy + s * 0.7); ctx.lineTo(cx + s * 0.33, cy + s);
    ctx.lineTo(cx - s * 0.33, cy + s * 0.7); ctx.lineTo(cx - s, cy + s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(47,143,224,0.8)'; ctx.lineWidth = s * 0.12;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.33, cy - s); ctx.lineTo(cx - s * 0.33, cy + s * 0.7);
    ctx.moveTo(cx + s * 0.33, cy - s * 0.7); ctx.lineTo(cx + s * 0.33, cy + s); ctx.stroke();
  },
  dragon(r, cx, cy, s, col = '#fff') {
    r.fillCircle(cx, cy - s * 0.1, s * 0.6, col);
    const ctx = r.ctx; ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy - s * 0.1); ctx.lineTo(cx - s, cy - s * 0.7); ctx.lineTo(cx - s * 0.7, cy + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.5, cy - s * 0.1); ctx.lineTo(cx + s, cy - s * 0.7); ctx.lineTo(cx + s * 0.7, cy + s * 0.1); ctx.closePath(); ctx.fill();
    r.fillCircle(cx - s * 0.2, cy - s * 0.2, s * 0.1, '#2f8fe0'); r.fillCircle(cx + s * 0.2, cy - s * 0.2, s * 0.1, '#2f8fe0');
  },
  collection(r, cx, cy, s, col = '#fff') {
    const q = s * 0.66;
    for (let i = 0; i < 4; i++) {
      const dx = (i % 2 ? 1 : -1) * q * 0.6, dy = (i < 2 ? -1 : 1) * q * 0.6;
      r.fillRoundRect(cx + dx - q * 0.5, cy + dy - q * 0.5, q, q, q * 0.28, col);
    }
  },
  events(r, cx, cy, s, col = '#fff') {
    r.fillRoundRect(cx - s, cy - s * 0.8, s * 2, s * 1.7, s * 0.24, col);
    const ctx = r.ctx; ctx.strokeStyle = '#2f8fe0'; ctx.lineWidth = s * 0.14;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy - s * 0.2); ctx.lineTo(cx + s * 0.7, cy - s * 0.2); ctx.stroke();
    r.fillCircle(cx, cy + s * 0.4, s * 0.26, '#ff9422');
  },
  shop(r, cx, cy, s, col = '#fff') {
    r.fillRoundRect(cx - s * 0.85, cy - s * 0.25, s * 1.7, s * 1.25, s * 0.22, col);
    const ctx = r.ctx; ctx.strokeStyle = col; ctx.lineWidth = s * 0.2;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.2, s * 0.5, Math.PI, 0); ctx.stroke();
  },
  play(r, cx, cy, s, col = '#fff') {
    const ctx = r.ctx; ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy - s * 0.72); ctx.lineTo(cx - s * 0.5, cy + s * 0.72); ctx.lineTo(cx + s * 0.78, cy); ctx.closePath(); ctx.fill();
  },
  lock(r, cx, cy, s, col = '#fff') {
    const bw = s * 1.1, bh = s * 0.85, bx = cx - bw / 2, by = cy - bh * 0.15, ctx = r.ctx;
    ctx.beginPath(); ctx.lineWidth = Math.max(3, s * 0.22); ctx.strokeStyle = col;
    ctx.arc(cx, by, bw * 0.32, Math.PI, 0); ctx.stroke();
    r.fillRoundRect(bx, by, bw, bh, s * 0.18, col);
  },
};
