/**
 * LevelSelectScreen.js
 * -----------------------------------------------------------------------------
 * The campaign map: a paged grid of level nodes showing the player's progress
 * and best star rating per level. Beaten levels are replayable; the frontier
 * (next unbeaten) level is highlighted as the one to play. Tapping any node
 * starts that level via `ui:playLevel`.
 *
 * Purely a picker over the existing LevelSystem — it reads `frontierLevel` and
 * `starsFor(level)` and owns no progression state of its own.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { t } from '../../i18n/Localization.js';

const COLS = 4;

export class LevelSelectScreen extends PanelScreen {
  constructor(game) {
    super(game, t('menu.levels'), { showTopBar: true });
    this.name = 'levels';
    const level = game.getSystem('level');
    this._frontier = Math.max(1, level?.frontierLevel ?? 1);
    this._total = this._frontier;            // show levels 1..frontier (all playable)
    this._nodeRects = [];                    // { rect, level } for hit-testing
    this._arrows = {};                       // { left?, right? }
    this._perPage = COLS * 5;                // recomputed to fit in drawContent
    this._page = 0;                          // set to the frontier's page on first layout
    this._pagedTo = false;
  }

  onUpdate() { /* this._t drives the current-node pulse (from PanelScreen). */ }

  drawContent(r, p) {
    const level = this.game.getSystem('level');
    const pad = p.w * 0.06;
    const gridX = p.x + pad;
    const gridW = p.w - pad * 2;
    const gap = gridW * 0.045;
    const node = (gridW - gap * (COLS - 1)) / COLS;
    const starH = node * 0.3;
    const cellH = node + starH + gap * 0.5;

    const top = p.y + 64;                    // below the title ribbon
    const footer = 66;                       // room for page controls
    const availH = (p.y + p.h) - footer - top;
    const rows = Math.max(1, Math.floor(availH / cellH));
    this._perPage = COLS * rows;
    const pages = Math.max(1, Math.ceil(this._total / this._perPage));
    if (!this._pagedTo) { this._page = Math.min(pages - 1, Math.floor((this._frontier - 1) / this._perPage)); this._pagedTo = true; }
    this._page = Math.max(0, Math.min(pages - 1, this._page));

    // Centre the grid block vertically in the available region.
    const usedH = rows * cellH - gap * 0.5;
    const startY = top + Math.max(0, (availH - usedH) / 2);

    this._nodeRects = [];
    const first = this._page * this._perPage + 1;
    const last = Math.min(this._total, first + this._perPage - 1);
    for (let lvl = first; lvl <= last; lvl++) {
      const idx = lvl - first;
      const cx = idx % COLS, cy = Math.floor(idx / COLS);
      const x = gridX + cx * (node + gap);
      const y = startY + cy * cellH;
      this._drawNode(r, x, y, node, starH, lvl, level);
      this._nodeRects.push({ rect: new Rect(x, y, node, node + starH), level: lvl });
    }

    // Page controls (only when there is more than one page).
    this._arrows = {};
    if (pages > 1) {
      const ay = p.y + p.h - 44, aw = 54;
      const lx = p.centerX - 120, rx = p.centerX + 120 - aw;
      this._arrows.left = new Rect(lx, ay - aw / 2, aw, aw);
      this._arrows.right = new Rect(rx, ay - aw / 2, aw, aw);
      this._arrow(r, this._arrows.left, '‹', this._page > 0);
      this._arrow(r, this._arrows.right, '›', this._page < pages - 1);
      r.text(`${this._page + 1} / ${pages}`, p.centerX, ay, { font: '900 22px system-ui, sans-serif', color: UI.gold.deep, align: 'center', baseline: 'middle' });
    }
  }

  _drawNode(r, x, y, s, starH, lvl, level) {
    const current = lvl === this._frontier;
    const stars = level?.starsFor?.(lvl) ?? 0;
    const colors = current ? UI.btn.play : UI.btn.blue;
    UITheme.button(r, x, y, s, s, s * 0.24, colors, { shadow: true });

    // Level number.
    r.text(String(lvl), x + s / 2, y + s * (current ? 0.5 : 0.46), {
      font: `900 ${Math.round(s * 0.42)}px system-ui, sans-serif`, color: '#fff',
      align: 'center', baseline: 'middle', outline: 'rgba(20,44,92,0.45)', outlineWidth: Math.max(3, s * 0.05),
    });

    if (current) {
      // A gentle pulse ring marks the level to play next.
      const pulse = 0.5 + 0.5 * Math.sin(this._t * 3);
      r.setAlpha(0.35 + 0.35 * pulse);
      UITheme.goldFrame(r, x - 3, y - 3, s + 6, s + 6, s * 0.26, 4);
      r.setAlpha(1);
    } else {
      // Three best-run stars beneath the number.
      const sw = s * 0.24, gap = s * 0.06;
      const totW = sw * 3 + gap * 2;
      const sy = y + s + starH * 0.5;
      for (let i = 0; i < 3; i++) {
        const sx = x + (s - totW) / 2 + i * (sw + gap) + sw / 2;
        this._star(r, sx, sy, sw * 0.5, i < stars ? '#ffd23d' : 'rgba(255,255,255,0.30)');
      }
    }
  }

  _star(r, x, y, rad, col) {
    const ctx = r.ctx; ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? rad * 0.45 : rad;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }

  _arrow(r, rect, glyph, enabled) {
    r.setAlpha(enabled ? 1 : 0.35);
    UITheme.button(r, rect.x, rect.y, rect.w, rect.h, rect.w / 2, UI.btn.orange, { shadow: true });
    r.text(glyph, rect.centerX, rect.centerY - 2, { font: '900 34px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    r.setAlpha(1);
  }

  onContentTap(px, py) {
    if (this._arrows.left?.contains(px, py)) { this._page--; return true; }
    if (this._arrows.right?.contains(px, py)) { this._page++; return true; }
    for (const n of this._nodeRects) {
      if (n.rect.contains(px, py)) {
        this.game.getSystem('audio')?.play('place');
        this.events.emit('ui:playLevel', { level: n.level });
        return true;
      }
    }
    return false;
  }
}
