/**
 * DragonSystem.js
 * -----------------------------------------------------------------------------
 * The signature "companion dragon" meta-feature. The dragon is a persistent
 * pet that levels up as the player progresses and drifts around the cosmic
 * backdrop as a living mascot — the hook that differentiates Cosmic Drift from
 * a plain shape-placement game.
 *
 * Foundation scope: persistent dragon state (level, xp, chosen skin) as a save
 * slice, plus a lightweight animated placeholder sprite drawn on the backdrop.
 * Growth rules, feeding and abilities are gameplay for later updates; the
 * `gainXp`/`levelUp` API and events are stubbed here so those systems can plug
 * in without reshaping this one.
 *
 * Events:
 *   listens 'save:loaded'
 *   emits   'dragon:levelUp' ({ level })
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { Palette } from '../../config/Palette.js';
import { clamp } from '../../utils/MathUtils.js';
import { Dragons, DragonById } from '../../config/Dragons.js';

export class DragonSystem extends System {
  constructor(game) {
    super(game);
    this.name = 'dragon';
    this._state = null;
    // Idle animation state for the placeholder mascot.
    this._t = 0;
    this._pos = { x: 0, y: 0 };
  }

  onInit() {
    const save = this.game.getSystem('save');
    this._state = save.registerSlice('dragon', () => ({
      level: 1,
      xp: 0,
      skin: 'hatchling',
      unlocked: ['hatchling'],
      active: 'leafwyrm',
    }));
    // Back-fill for saves made before companions existed.
    if (!this._state.active) this._state.active = 'leafwyrm';

    // Apply the active companion's passive perk through existing events only.
    this.listen('game:started', () => this._applyStartPerk());
    this.listen('game:linesCleared', ({ count = 1 }) => this._applyClearPerk(count));
  }

  // --- Companion roster + perks ----------------------------------------------

  /** Highest level the player has reached (drives which dragons are unlocked). */
  get _highest() { return this.game.getSystem('level')?.highest ?? 1; }

  /** Is a dragon unlocked at the player's current progress? */
  isUnlocked(id) { const d = DragonById[id]; return !!d && this._highest >= d.unlockLevel; }

  /** The active companion definition (falls back to the starter). */
  get activeDragon() { return DragonById[this._state.active] ?? DragonById.leafwyrm; }

  /** Roster snapshot for the UI: every dragon with unlock + active flags. */
  roster() {
    return Dragons.map((d) => ({ ...d, unlocked: this.isUnlocked(d.id), active: this._state.active === d.id }));
  }

  /** Equip a companion (only if unlocked). Returns true on change. */
  setActive(id) {
    if (!this.isUnlocked(id) || this._state.active === id) return false;
    this._state.active = id;
    this.game.getSystem('save')?.markDirty();
    this.events.emit('dragon:companionChanged', { id });
    return true;
  }

  _applyStartPerk() {
    const p = this.activeDragon.perk;
    if (p.kind === 'startEnergy') this.events.emit('gameplay:addEnergy', { amount: p.value });
  }

  _applyClearPerk(count) {
    const p = this.activeDragon.perk;
    const eco = this.game.getSystem('economy');
    switch (p.kind) {
      case 'energyPerLine': this.events.emit('gameplay:addEnergy', { amount: p.value * count }); break;
      case 'goldPerLine': eco?.credit('gold', p.value * count); break;
      case 'materialsPerLine': eco?.credit('materials', p.value * count); break;
      case 'essencePerLine': eco?.credit('essence', p.value * count); break;
    }
  }

  /** XP required to advance from `level` to the next. Tunable curve. */
  xpForLevel(level) { return 100 + (level - 1) * 75; }

  /**
   * Award XP and handle level-ups. Returns the number of levels gained.
   * Gameplay systems call this via events; the rule stays centralised here.
   */
  gainXp(amount) {
    if (amount <= 0) return 0;
    let gained = 0;
    this._state.xp += amount;
    while (this._state.xp >= this.xpForLevel(this._state.level)) {
      this._state.xp -= this.xpForLevel(this._state.level);
      this._state.level++;
      gained++;
      this.events.emit('dragon:levelUp', { level: this._state.level });
    }
    this.game.getSystem('save').markDirty();
    return gained;
  }

  get level() { return this._state.level; }
  get skin() { return this._state.skin; }

  update(dt) {
    this._t += dt;
    // Gentle figure-drift near the top of the screen.
    const { width } = this.game.canvas;
    this._pos.x = width * 0.5 + Math.sin(this._t * 0.6) * width * 0.28;
    this._pos.y = 120 + Math.sin(this._t * 1.3) * 14;
  }

  render(renderer) {
    // Placeholder mascot: a glowing orb that later becomes the dragon sprite.
    const pulse = 1 + Math.sin(this._t * 3) * 0.06;
    const r = 16 * pulse;
    renderer.withGlow(Palette.accent, 24, () => {
      renderer.fillCircle(this._pos.x, this._pos.y, r, Palette.accent);
    });
    renderer.setAlpha(clamp(0.5 + Math.sin(this._t * 3) * 0.3, 0, 1));
    renderer.fillCircle(this._pos.x, this._pos.y, r * 0.5, '#ffffff');
    renderer.setAlpha(1);
  }
}
