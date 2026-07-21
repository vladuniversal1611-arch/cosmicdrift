/**
 * CollectionScreen.js
 * -----------------------------------------------------------------------------
 * The premium album: Dragons, Buildings, Artifacts and Achievements tabs, each
 * a grid of gold-framed cards with an animated diagonal "shine" sweep on
 * unlocked entries and a frosted look on locked ones. Content is data-driven
 * from the game's registries + save progress.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Biomes } from '../../config/Biomes.js';
import { Restorations } from '../../config/Restorations.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { t } from '../../i18n/Localization.js';

const TABS = ['DRAGONS', 'BUILDINGS', 'ARTIFACTS', 'AWARDS'];

export class CollectionScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.collection'), { showTopBar: true });
    this.name = 'collection';
    this._tab = 0;
    this._tabRects = [];
  }

  _cards() {
    const world = this.game.getSystem('save')?.getSlice('world') ?? { complete: {}, maxLevel: 1 };
    const maxLevel = world.maxLevel ?? 1;
    if (this._tab === 0) {
      return Biomes.map((b) => ({ name: b.dragon, icon: 'dragon', color: b.accent, unlocked: maxLevel >= b.unlockLevel }));
    }
    if (this._tab === 1) {
      return Restorations.slice(0, 6).map((rr) => ({ name: rr.name, icon: 'statue', color: '#c8b48a', unlocked: !!world.complete?.[rr.id] }));
    }
    if (this._tab === 2) {
      return [
        { name: 'Magic Crystal', icon: 'crystal', color: UI.btn.purple[1], unlocked: true },
        { name: 'Energy Core', icon: 'towericon', color: UI.btn.teal[1], unlocked: true },
        { name: 'Dragon Shrine', icon: 'egg', color: UI.btn.orange[1], unlocked: maxLevel >= 10 },
        { name: 'Bridge Relic', icon: 'bridge', color: UI.btn.blue[1], unlocked: maxLevel >= 8 },
        { name: 'Rune Stone', icon: 'rune', color: '#ffb020', unlocked: maxLevel >= 40 },
        { name: 'Portal Shard', icon: 'portal', color: '#28e0d0', unlocked: maxLevel >= 30 },
      ];
    }
    return [
      { name: 'First Steps', icon: 'flower', color: UI.btn.play[1], unlocked: true },
      { name: 'Combo Master', icon: 'boss', color: UI.btn.pink[1], unlocked: maxLevel >= 5 },
      { name: 'World Builder', icon: 'tree', color: UI.btn.teal[1], unlocked: (world.maxLevel ?? 1) >= 10 },
      { name: 'Dragon Whisperer', icon: 'dragon', color: UI.btn.purple[1], unlocked: maxLevel >= 20 },
    ];
  }

  drawContent(r, p) {
    // Tabs.
    const tw = (p.w - 40) / TABS.length, ty = p.y + 30, th = 38;
    this._tabRects = TABS.map((t, i) => {
      const x = p.x + 20 + i * tw;
      const rect = new Rect(x + 3, ty, tw - 6, th);
      const sel = i === this._tab;
      UITheme.button(r, rect.x, rect.y, rect.w, rect.h, th / 2, sel ? UI.btn.orange : UI.btn.blue, { shadow: sel });
      r.text(t, rect.centerX, rect.centerY, { font: '800 12px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      return rect;
    });

    // Card grid (2 cols).
    const cards = this._cards();
    const cols = 2, cw = (p.w - 40 - 16) / cols, ch = 132;
    const gy = ty + th + 22;
    this._cardHit = [];
    cards.slice(0, 6).forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + 20 + col * (cw + 16);
      const y = gy + row * (ch + 14);
      this._card(r, x, y, cw, ch, card);
    });
  }

  _card(r, x, y, w, h, card) {
    if (card.unlocked) {
      UITheme.button(r, x, y, w, h, 16, [this._lighten(card.color), card.color]);
      drawObjectiveIcon(r, card.icon, x + w / 2, y + h * 0.4, 30, '#fff');
      // Animated shine sweep.
      const ctx = r.ctx; ctx.save(); r.roundRectPath(x, y, w, h, 16); ctx.clip();
      const sx = x - w + ((this._t * 120) % (w * 2.2));
      r.setAlpha(0.35);
      const g = r.linearGradient(sx, y, sx + w * 0.5, y + h, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
      r.fillRect(sx, y, w * 0.5, h, g); r.setAlpha(1); ctx.restore();
      r.text(card.name, x + w / 2, y + h * 0.82, { font: '800 14px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    } else {
      // Frosted locked card.
      r.fillRoundRect(x, y, w, h, 16, 'rgba(180,195,225,0.55)');
      UITheme.goldFrame(r, x, y, w, h, 16, 3);
      r.text('?', x + w / 2, y + h * 0.4, { font: '900 44px system-ui, sans-serif', color: 'rgba(255,255,255,0.85)', align: 'center', baseline: 'middle' });
      r.text('LOCKED', x + w / 2, y + h * 0.82, { font: '800 12px system-ui, sans-serif', color: 'rgba(60,74,120,0.8)', align: 'center', baseline: 'middle' });
    }
  }

  _lighten(hex) {
    // Rough lighten by blending toward white for the top gloss stop.
    const n = parseInt(hex.slice(1), 16);
    const rr = Math.min(255, ((n >> 16) & 255) + 70), gg = Math.min(255, ((n >> 8) & 255) + 70), bb = Math.min(255, (n & 255) + 70);
    return `rgb(${rr},${gg},${bb})`;
  }

  onContentTap(px, py) {
    for (let i = 0; i < this._tabRects.length; i++) {
      if (this._tabRects[i].contains(px, py)) { this._tab = i; this.game.getSystem('audio')?.play('pickup'); return true; }
    }
    return false;
  }
}
