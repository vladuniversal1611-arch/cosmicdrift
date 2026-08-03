/**
 * CollectionScreen.js
 * -----------------------------------------------------------------------------
 * The premium album and the game's long-term completion goal: Dragons,
 * Buildings, Artifacts and Awards tabs, each a grid of gold-framed cards with an
 * animated diagonal "shine" sweep on unlocked entries and a frosted look on
 * locked ones. A per-tab "COLLECTED X / Y" header with a progress bar frames the
 * screen as something to complete over time.
 *
 * Content is data-driven from the real registries + save progress. The Dragons
 * tab mirrors the actual companion roster (name, perk, unlock level, the
 * equipped one badged ACTIVE); tapping a dragon opens the Heroes screen to
 * equip. Everything here is a read-through view — it never changes gameplay.
 * -----------------------------------------------------------------------------
 */
import { PanelScreen } from './PanelScreen.js';
import { Rect } from '../../utils/Rect.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Restorations } from '../../config/Restorations.js';
import { Dragons } from '../../config/Dragons.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { t } from '../../i18n/Localization.js';

const TABS = ['DRAGONS', 'BUILDINGS', 'ARTIFACTS', 'AWARDS'];

export class CollectionScreen extends PanelScreen {
  constructor(game) {
    super(game, t('titles.collection'), { showTopBar: true });
    this.name = 'collection';
    this._tab = 0;
    this._tabRects = [];
    this._cardHit = [];
  }

  _cards() {
    const world = this.game.getSystem('save')?.getSlice('world') ?? { complete: {}, maxLevel: 1 };
    const maxLevel = world.maxLevel ?? 1;
    if (this._tab === 0) {
      // Real companion roster (falls back to config if the system is absent).
      const roster = this.game.getSystem('dragon')?.roster()
        ?? Dragons.map((d) => ({ ...d, unlocked: maxLevel >= d.unlockLevel, active: false }));
      return roster.map((d) => ({
        name: d.name, icon: 'dragon', color: d.color, unlocked: d.unlocked, active: d.active,
        sub: d.unlocked ? this._perkShort(d.perk) : `Reach Lv ${d.unlockLevel}`,
        action: 'dragons',
      }));
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
    // Awards: real achievements tracked from play stats.
    const ach = this.game.getSystem('achievements');
    if (ach) {
      return ach.list().map((a) => ({
        name: a.name, icon: a.icon, color: a.color, unlocked: a.unlocked,
        sub: a.unlocked ? a.desc : `${a.progress} / ${a.goal}`,
      }));
    }
    return [];
  }

  /** Abbreviate a perk for the small card subtitle. */
  _perkShort(perk) {
    if (!perk) return '';
    const label = { energyPerLine: 'Energy/line', goldPerLine: 'Gold/line', materialsPerLine: 'Mats/line', essencePerLine: 'Essence/line', startEnergy: 'Start Energy' }[perk.kind] ?? '';
    return perk.kind === 'startEnergy' ? `+${perk.value} ${label}` : `+${perk.value} ${label}`;
  }

  drawContent(r, p) {
    // Tabs.
    const tw = (p.w - 40) / TABS.length, ty = p.y + 30, th = 38;
    this._tabRects = TABS.map((tab, i) => {
      const x = p.x + 20 + i * tw;
      const rect = new Rect(x + 3, ty, tw - 6, th);
      const sel = i === this._tab;
      UITheme.button(r, rect.x, rect.y, rect.w, rect.h, th / 2, sel ? UI.btn.orange : UI.btn.blue, { shadow: sel });
      r.text(tab, rect.centerX, rect.centerY, { font: '800 12px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      return rect;
    });

    const cards = this._cards();

    // Completion header: "COLLECTED X / Y" + progress bar (long-term goal).
    const owned = cards.filter((c) => c.unlocked).length;
    const hy = ty + th + 20;
    r.text('COLLECTED', p.x + 22, hy, { font: '900 15px system-ui, sans-serif', color: UI.gold.deep, baseline: 'middle' });
    r.text(`${owned} / ${cards.length}`, p.x + p.w - 22, hy, { font: '900 16px system-ui, sans-serif', color: UI.ink, align: 'right', baseline: 'middle' });
    const barY = hy + 16, barX = p.x + 22, barW = p.w - 44;
    r.fillRoundRect(barX, barY, barW, 12, 6, 'rgba(35,58,114,0.16)');
    r.fillRoundRect(barX, barY, barW * (cards.length ? owned / cards.length : 0), 12, 6, UI.gold.mid);

    // Card grid (2 cols).
    const cols = 2, cw = (p.w - 40 - 16) / cols, ch = 138;
    const gy = barY + 28;
    this._cardHit = [];
    cards.slice(0, 10).forEach((card, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = p.x + 20 + col * (cw + 16);
      const y = gy + row * (ch + 14);
      this._card(r, x, y, cw, ch, card);
      if (card.action) this._cardHit.push({ rect: new Rect(x, y, cw, ch), action: card.action });
    });
  }

  _card(r, x, y, w, h, card) {
    if (card.unlocked) {
      UITheme.button(r, x, y, w, h, 16, [this._lighten(card.color), card.color]);
      drawObjectiveIcon(r, card.icon, x + w / 2, y + h * 0.34, 28, '#fff');
      // Animated shine sweep.
      const ctx = r.ctx; ctx.save(); r.roundRectPath(x, y, w, h, 16); ctx.clip();
      const sx = x - w + ((this._t * 120) % (w * 2.2));
      r.setAlpha(0.35);
      const g = r.linearGradient(sx, y, sx + w * 0.5, y + h, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
      r.fillRect(sx, y, w * 0.5, h, g); r.setAlpha(1); ctx.restore();
      r.text(card.name, x + w / 2, y + h * 0.66, { font: '800 15px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      if (card.sub) r.text(card.sub, x + w / 2, y + h * 0.84, { font: '700 11px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle' });
      // ACTIVE badge (top-right) for the equipped companion.
      if (card.active) {
        const bw = 62, bh = 22, bx = x + w - bw - 8, by = y + 8;
        r.withGlow('#ffe08a', 8, () => UITheme.chip(r, bx, by, bw, bh, '#3fc86a'));
        r.text('ACTIVE', bx + bw / 2, by + bh / 2, { font: '900 11px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      }
    } else {
      // Frosted locked card.
      r.fillRoundRect(x, y, w, h, 16, 'rgba(180,195,225,0.55)');
      UITheme.goldFrame(r, x, y, w, h, 16, 3);
      r.text('?', x + w / 2, y + h * 0.36, { font: '900 42px system-ui, sans-serif', color: 'rgba(255,255,255,0.85)', align: 'center', baseline: 'middle' });
      r.text(card.sub || 'LOCKED', x + w / 2, y + h * 0.8, { font: '800 12px system-ui, sans-serif', color: 'rgba(60,74,120,0.85)', align: 'center', baseline: 'middle' });
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
    // Tapping a dragon card jumps to the Heroes screen to equip/inspect.
    for (const hit of this._cardHit) {
      if (hit.rect.contains(px, py)) { this.game.getSystem('audio')?.play('pickup'); this.events.emit(`ui:open${hit.action[0].toUpperCase()}${hit.action.slice(1)}`); return true; }
    }
    return false;
  }
}
