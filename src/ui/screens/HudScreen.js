/**
 * HudScreen.js
 * -----------------------------------------------------------------------------
 * The in-game overlay: score (with a pop on every gain), the Dragon Energy
 * meter, a punchy combo callout, and the game-over panel.
 *
 * It is a pure view: it holds no game state, only mirrors of it received via
 * 'gameplay:*' events, so it can never desync from or corrupt the simulation.
 * Tapping while game-over restarts the run.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Label } from '../widgets/Label.js';
import { Palette } from '../../config/Palette.js';
import { clamp } from '../../utils/MathUtils.js';
import { Easing } from '../../utils/Easing.js';
import { Rect } from '../../utils/Rect.js';
import { drawObjectiveIcon } from '../../systems/objectives/ObjectiveIcons.js';
import { UITheme, UI } from '../theme/UITheme.js';
import { Boosters } from '../../config/Boosters.js';
import { Haptics } from '../../utils/Haptics.js';
import { t } from '../../i18n/Localization.js';

export class HudScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'hud';

    this._state = 'playing';
    this._score = 0;
    this._displayScore = 0;   // eased "rolling" number toward _score
    this._best = 0;
    this._final = 0;
    this._scorePop = 0;       // decays 1 → 0 for the score bump
    this._comboText = '';
    this._comboSub = '';      // secondary line (e.g. the chain under a DOUBLE!)
    this._comboColor = null;  // escalates cool → gold → hot with intensity
    this._comboBig = false;   // larger type for high-tier callouts
    this._comboT = 0;         // seconds remaining on the combo callout
    this._overlayT = 0;       // game-over fade-in
    this._consolation = null; // { reward, tip } shown on the game-over panel
    this._subs = [];          // event unsubscribers, cleaned up on exit

    // Progression state (mirrored from LevelSystem / ObjectivesSystem).
    this._level = 1;
    this._worldName = '';
    this._objectives = [];    // live Objective instances for the current level
    this._objExpanded = false; // checklist starts collapsed (compact icon strip)
    this._objToggleRect = null;
    this._banner = null;      // { title, sub, t } discovery/world callout
    this._structToast = null; // { name, t } structure-built callout
    this._toast = null;       // { text, color, t } reward / biome toast
    this._coins = [];         // line-clear reward coins flying up
    this._beam = 0;           // line-clear light-beam intensity (decays)
    this._scorePops = [];     // floating "+N" score popups near cleared lines
    this._dragonReady = false; // Dragon Fire ultimate charged?
    this._dragonT = 0;
    this._dragonBtn = new Rect(this.bounds.w - 40 - 100, 150, 100, 100);
    this._goalCard = null;    // { objectives, t, dur } level-start goal intro
    // Clean top bar: just a compact pause button (left). World Map lives in the
    // Pause menu now, so mid-run the top stays uncluttered.
    this._pauseBtn = new Rect(36, 66, 72, 72);

    // Booster row — round power-up buttons in the band JUST ABOVE the board, so
    // the very bottom of the screen stays free for a persistent ad banner and
    // nothing important sits under it.
    this._boosterT = 0;
    const bd = 88, bgap = 36;
    const rowW = Boosters.length * bd + (Boosters.length - 1) * bgap;
    const bx0 = (this.bounds.w - rowW) / 2;
    const boardTop = this.game.getSystem('board')?.area?.top ?? this.bounds.h * 0.2;
    const by = boardTop - bd - 16;
    this._boosterBtns = Boosters.map((def, i) => ({
      def, rect: new Rect(bx0 + i * (bd + bgap), by, bd, bd),
    }));
    // Rewarded HINT button at the right of the booster row (watch an ad → the
    // board highlights a good move). Player-initiated, never automatic.
    this._hintBtn = new Rect(this.bounds.w - 20 - bd, by, bd, bd);
    this._hintPending = false;

    const w = this.bounds.w;

    // Dragon Energy meter (self-drawn). It stays hidden while the meter is low
    // and fades in + glows as the Dragon Fire ultimate nears, so it only draws
    // attention when it's about to matter. Geometry only; drawn in _drawEnergy.
    const bw = w * 0.5;
    this._energyBar = new Rect(w * 0.5 - bw / 2, this.bounds.h * 0.096, bw, 12);
    this._energyFrac = 0;     // 0..1 current meter fill
    this._energyShown = 0;    // eased reveal alpha 0..1

    this._bind();

    // The first level's objectives + level are built (LevelSystem runs before
    // the UI on game:started) before this HUD exists, so it misses the initial
    // 'level:changed' / 'objectives:set'. Pull current state now; later levels
    // arrive live.
    this._endless = this.game.getSystem('gameplay')?.isEndless ?? false;
    const levelSys = this.game.getSystem('level');
    if (levelSys) { this._level = levelSys.level ?? this._level; this._worldName = levelSys.worldName ?? this._worldName; }
    const objs0 = this.game.getSystem('objectives')?.objectives;
    if (objs0 && objs0.length) {
      this._objectives = objs0.slice();
      if (this._canShowGoalCard()) this._goalCard = { objectives: objs0.slice(), t: 0, dur: 3.0 };
    }
  }

  /** The level-start goals card is suppressed during the first-run tutorial so
   *  it never overlaps the onboarding coach panel. */
  _canShowGoalCard() { return this.game.getSystem('onboarding')?.isDone !== false; }

  _bind() {
    this._subs.push(this.events.on('gameplay:score', ({ score, add }) => {
      this._score = score;
      if (add > 0) this._scorePop = 1;
      // A big add (a line clear, not a plain placement) floats up as "+N".
      if (add >= 40) this._spawnScorePop(add);
    }));
    this._subs.push(this.events.on('gameplay:energy', ({ energy, max }) => {
      this._energyFrac = max ? energy / max : 0;
      const ready = max ? energy >= max : false;
      if (ready && !this._dragonReady) this.game.getSystem('audio')?.play('structure'); // "ability charged" chime
      this._dragonReady = ready;
    }));
    this._subs.push(this.events.on('gameplay:combo', ({ combo, lines }) => {
      // A multi-line clear shouts DOUBLE/TRIPLE/…; a chain shows COMBO ×N. When
      // both happen, the big word leads and the chain rides underneath. Size and
      // colour escalate with whichever is more intense.
      const WORDS = { 2: t('combo.double'), 3: t('combo.triple'), 4: t('combo.quad'), 5: t('combo.penta') };
      let text = '';
      if (lines >= 2) text = WORDS[lines] || t('combo.mega');
      else if (combo >= 2) text = t('combo.chain', { n: combo });
      if (!text) return;
      this._comboText = text;
      this._comboSub = (lines >= 2 && combo >= 2) ? t('combo.chain', { n: combo }) : '';
      const tier = Math.max(combo, lines);
      this._comboBig = tier >= 5;
      this._comboColor = tier >= 5 ? '#ff7a3d' : tier >= 4 ? '#ffcf4e' : tier >= 3 ? '#ffe08a' : '#7fe0ff';
      this._comboT = 1.3;
    }));
    this._subs.push(this.events.on('gameplay:stateChanged', ({ state, score, best, newBest, canRevive, daily }) => {
      this._state = state;
      this._best = best ?? this._best;
      if (state === 'over') {
        this._final = score ?? this._score;
        this._overlayT = 0;
        this._newBest = !!newBest;
        this._daily = !!daily;
        this._canRevive = canRevive !== false;
        // Celebrate a fresh record: gold flash, confetti and a triumphant beat.
        if (this._newBest) {
          this.events.emit('fx:flash', { color: '#ffe08a', strength: 0.4 });
          const b = this.bounds;
          this.events.emit('fx:burst', { x: b.centerX, y: b.centerY - b.h * 0.1, color: '#ffd34e', count: 70 });
          this.game.getSystem('audio')?.play('restore');
          Haptics.victory(this.game);
        } else {
          Haptics.heavy(this.game);
        }
      }
    }));
    this._subs.push(this.events.on('level:changed', (d) => {
      this._level = d.level;
      this._worldName = d.worldName;
      this._endless = !!d.endless;
      if (d.newMechanic) {
        this._banner = {
          title: `WORLD ${d.world} · ${d.worldName}`,
          sub: `NEW — ${d.newMechanic.label}: ${d.newMechanic.blurb}`,
          t: 3.6,
        };
      } else if (d.levelInWorld === 0) {
        this._banner = { title: `WORLD ${d.world} · ${d.worldName}`, sub: '', t: 2.2 };
      }
    }));
    this._subs.push(this.events.on('objectives:set', ({ objectives }) => {
      this._objectives = objectives;
      // Announce the level's authored goals with a brief intro card — but not
      // during the first-run tutorial, where it would fight the coach panel.
      if (objectives && objectives.length && this._canShowGoalCard()) {
        this._goalCard = { objectives: objectives.slice(), t: 0, dur: 3.0 };
      }
    }));
    this._subs.push(this.events.on('structure:completed', ({ name }) => {
      this._structToast = { name, t: 1.8 };
    }));
    // World Progression feedback.
    this._subs.push(this.events.on('reward:granted', ({ gold = 0 }) => {
      this._toast = { text: `+${gold} ⬤`, color: Palette.warning, t: 2.2 };
    }));
    this._subs.push(this.events.on('biome:changed', ({ biome }) => {
      this._toast = { text: `ENTERING ${biome.name.toUpperCase()}`, color: Palette.accentAlt, t: 2.6 };
    }));
    this._subs.push(this.events.on('achievement:unlocked', ({ def }) => {
      this._toast = { text: `🏆 ${def.name.toUpperCase()}`, color: Palette.gold, t: 2.8 };
    }));
    this._subs.push(this.events.on('endless:ramp', ({ tier }) => {
      this._toast = { text: `DEPTH ${tier + 1} — HARDER PIECES`, color: Palette.accent, t: 2.4 };
    }));
    this._subs.push(this.events.on('world:taskUnlocked', ({ task }) => {
      this._banner = { title: 'NEW RESTORATION', sub: `${task.name} — open the World Map ◈`, t: 3.6 };
    }));
    this._subs.push(this.events.on('world:restored', ({ task }) => {
      this._banner = { title: `${task.name.toUpperCase()} RESTORED`, sub: 'A new part of the world awakens', t: 3.4 };
    }));
    // Failure loop: a consolation reward + a friendly tip, never a scolding.
    this._subs.push(this.events.on('retention:consolation', (c) => { this._consolation = c; }));
    // Line-clear reward flourish: a light beam + coins flying up to the score.
    this._subs.push(this.events.on('game:linesCleared', ({ count = 1 }) => this._onLinesCleared(count)));
  }

  /** Spawn the celebratory light beam + rising coins over the board. */
  _onLinesCleared(count) {
    const board = this.game.getSystem('board')?.area;
    if (!board) return;
    this._beam = Math.min(1, 0.5 + count * 0.2);
    const n = Math.min(14, 5 + count * 3);
    for (let i = 0; i < n; i++) {
      this._coins.push({
        x: board.centerX + (Math.random() - 0.5) * board.w * 0.6,
        y: board.centerY + (Math.random() - 0.5) * board.h * 0.4,
        vx: (Math.random() - 0.5) * 120, vy: -260 - Math.random() * 220,
        t: 0, life: 1.1 + Math.random() * 0.5, s: 14 + Math.random() * 8,
      });
    }
  }

  /** Detach listeners when the HUD is torn down (e.g. on restart/replace). */
  onExit() {
    this._subs.forEach((off) => off());
    this._subs.length = 0;
  }

  update(dt) {
    this._dragonT += dt;
    this._boosterT += dt;
    // Reveal the energy meter only as it fills (hidden when low, gone once the
    // Dragon button has taken over at full charge).
    const target = this._dragonReady ? 0 : clamp((this._energyFrac - 0.3) / 0.35, 0, 1);
    this._energyShown += (target - this._energyShown) * Math.min(1, dt * 6);
    // Rolling score: ease the displayed number toward the real one.
    this._displayScore += (this._score - this._displayScore) * Math.min(1, dt * 8);
    if (Math.abs(this._score - this._displayScore) < 0.5) this._displayScore = this._score;
    if (this._scorePop > 0) this._scorePop = Math.max(0, this._scorePop - dt * 3.5);
    if (this._comboT > 0) this._comboT = Math.max(0, this._comboT - dt);
    if (this._banner && (this._banner.t -= dt) <= 0) this._banner = null;
    if (this._goalCard && (this._goalCard.t += dt) >= this._goalCard.dur) this._goalCard = null;
    if (this._structToast && (this._structToast.t -= dt) <= 0) this._structToast = null;
    if (this._toast && (this._toast.t -= dt) <= 0) this._toast = null;
    if (this._state === 'over') this._overlayT = Math.min(1, this._overlayT + dt * 3);
    // Line-clear reward: decay the beam, fly the coins up (gravity-lite).
    if (this._beam > 0) this._beam = Math.max(0, this._beam - dt * 1.6);
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i]; c.t += dt; c.vy += 240 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.t > c.life || c.y < this.bounds.h * 0.05) this._coins.splice(i, 1);
    }
    // Floating "+N" score popups drift up toward the score and fade.
    for (let i = this._scorePops.length - 1; i >= 0; i--) {
      const p = this._scorePops[i]; p.t += dt; p.y -= p.vy * dt; p.vy *= 0.96;
      if (p.t > p.life) this._scorePops.splice(i, 1);
    }
  }

  _spawnScorePop(add) {
    const board = this.game.getSystem('board')?.area;
    const x = (board ? board.centerX : this.bounds.centerX) + (Math.random() - 0.5) * 120;
    const y = (board ? board.centerY : this.bounds.h * 0.4);
    this._scorePops.push({ text: `+${add}`, x, y, t: 0, life: 1.1, vy: 150 });
  }

  /** The Dragon Fire ultimate button — appears, glowing + pulsing, when charged. */
  _drawDragonButton(r) {
    const b = this._dragonBtn, cx = b.centerX, cy = b.centerY;
    const pulse = 0.5 + 0.5 * Math.sin(this._dragonT * 4);
    const bob = Math.sin(this._dragonT * 2.2) * 4;
    const ctx = r.ctx;
    ctx.save(); ctx.translate(0, bob);
    // Halo.
    r.setAlpha(0.3 + pulse * 0.35);
    r.withGlow('#ff6a2a', 26, () => r.fillCircle(cx, cy, b.w * 0.56 + pulse * 6, '#ff8a3d'));
    r.setAlpha(1);
    // Body.
    UITheme.button(r, b.x, b.y, b.w, b.h, b.w / 2, UI.btn.red, { shadow: true });
    // Flame glyph.
    r.withGlow('#ffd24a', 8, () => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - b.h * 0.3);
      ctx.quadraticCurveTo(cx - b.w * 0.26, cy, cx - b.w * 0.14, cy + b.h * 0.22);
      ctx.lineTo(cx + b.w * 0.14, cy + b.h * 0.22);
      ctx.quadraticCurveTo(cx + b.w * 0.26, cy, cx, cy - b.h * 0.3);
      ctx.closePath();
      ctx.fillStyle = r.linearGradient(cx, cy - b.h * 0.3, cx, cy + b.h * 0.25, [[0, '#fff3c4'], [1, '#ff6a2a']]);
      ctx.fill();
    });
    r.text(t('common.nova'), cx, b.bottom + 16, { font: '900 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle', outline: 'rgba(150,40,10,0.8)', outlineWidth: 4 });
    ctx.restore();
  }

  /** Booster palette (icon accent per booster). */
  _boosterColors(id) {
    return ({ hammer: UI.btn.orange, bomb: UI.btn.red, shuffle: UI.btn.teal })[id] ?? UI.btn.blue;
  }

  /**
   * The booster row: three round power-up buttons with a live count badge. The
   * armed booster glows and lifts; an empty booster dims. A hint appears over
   * the board while one is armed ("TAP A BLOCK").
   */
  _drawBoosters(r) {
    const booster = this.game.getSystem('booster');
    if (!booster) return;
    const ctx = r.ctx;
    for (const b of this._boosterBtns) {
      const id = b.def.id;
      const count = booster.count(id);
      const armed = booster.isArmed(id);
      const empty = count <= 0;
      const rect = b.rect, cx = rect.centerX, cy = rect.centerY;
      const rad = rect.w / 2;
      const cols = this._boosterColors(id);

      const pulse = armed ? 0.5 + 0.5 * Math.sin(this._boosterT * 6) : 0;
      const lift = armed ? -6 - pulse * 3 : 0;

      ctx.save();
      ctx.translate(0, lift);
      if (armed) {
        r.setAlpha(0.35 + pulse * 0.35);
        r.withGlow(cols[1], 22, () => r.fillCircle(cx, cy, rad + 8 + pulse * 5, cols[1]));
        r.setAlpha(1);
      }
      // A depleted booster fades well back (no shadow) so it never competes for
      // attention; an available one is fully solid.
      r.setAlpha(empty ? 0.3 : 1);
      UITheme.button(r, rect.x, rect.y, rect.w, rect.h, rad, cols, { shadow: !empty });
      this._drawBoosterIcon(r, id, cx, cy - 4, rad * 0.82, '#fff');
      r.setAlpha(1);
      ctx.restore();

      // Count badge (top-right) — also faded when depleted.
      const bxp = rect.right - 12, byp = rect.y + 12 + lift;
      r.setAlpha(empty ? 0.45 : 1);
      r.withGlow('rgba(0,0,0,0.25)', 4, () => r.fillCircle(bxp, byp, 20, empty ? '#8a97ad' : '#fff'));
      r.text(String(count), bxp, byp + 1, {
        font: '900 22px system-ui, sans-serif', color: empty ? '#e9edf4' : UI.ink,
        align: 'center', baseline: 'middle',
      });
      r.setAlpha(1);
      // (No text label — the icon + count read clearly and keep the row clean.)
    }

    // "Tap a block" hint while a cell-target booster is armed.
    if (booster.armed) {
      const board = this.game.getSystem('board')?.area;
      const y = board ? board.bottom + 8 : this.bounds.h * 0.62;
      const gl = 0.6 + 0.4 * Math.sin(this._boosterT * 5);
      r.setAlpha(gl);
      r.withGlow('#ffe08a', 12, () => r.text(t('hud.tapToStrike'), this.bounds.centerX, y, {
        font: '900 26px system-ui, sans-serif', color: '#ffe89a',
        align: 'center', baseline: 'middle', outline: 'rgba(120,80,10,0.7)', outlineWidth: 4,
      }));
      r.setAlpha(1);
    }
  }

  /** The rewarded HINT button: a lightbulb over a round button with an "AD"
   *  tag. Pulses gently to invite the tap; dims while an ad is loading. */
  _drawHintButton(r) {
    const b = this._hintBtn, cx = b.centerX, cy = b.centerY, rad = b.w / 2;
    const ctx = r.ctx;
    const pulse = 0.6 + 0.4 * Math.sin(this._boosterT * 3);
    r.setAlpha(this._hintPending ? 0.5 : 1);
    r.withGlow('#ffd34e', 8 + pulse * 6, () => {
      const g = r.radialGradient(cx, cy - rad * 0.4, rad, [[0, '#ffe89a'], [1, '#f2a93a']]);
      r.fillCircle(cx, cy, rad, g);
    });
    UITheme.goldFrame(r, b.x, b.y, b.w, b.h, rad, 3);
    // Lightbulb glyph.
    ctx.save();
    r.withGlow('#fff', 6, () => {
      r.fillCircle(cx, cy - rad * 0.12, rad * 0.34, '#fffef2');
    });
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - rad * 0.16, cy + rad * 0.2, rad * 0.32, rad * 0.16);
    ctx.fillRect(cx - rad * 0.12, cy + rad * 0.36, rad * 0.24, rad * 0.1);
    ctx.restore();
    // "AD" tag.
    UITheme.chip(r, cx - 22, b.bottom - 6, 44, 24, '#3aa8ff');
    r.text('AD', cx, b.bottom + 6, { font: '900 14px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    r.setAlpha(1);
  }

  /** Compact vector glyph for each booster. */
  _drawBoosterIcon(r, id, cx, cy, s, color) {
    const ctx = r.ctx;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = Math.max(3, s * 0.14); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (id === 'hammer') {
      // Head + handle at a jaunty angle.
      ctx.translate(cx, cy); ctx.rotate(-0.5);
      r.fillRoundRect(-s * 0.7, -s * 0.62, s * 1.4, s * 0.5, s * 0.16, color);
      r.fillRoundRect(-s * 0.12, -s * 0.2, s * 0.24, s * 1.0, s * 0.1, color);
    } else if (id === 'bomb') {
      r.fillCircle(cx, cy + s * 0.16, s * 0.6, color);
      // Fuse.
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.3, cy - s * 0.36);
      ctx.quadraticCurveTo(cx + s * 0.66, cy - s * 0.7, cx + s * 0.36, cy - s * 0.86);
      ctx.stroke();
      r.fillCircle(cx + s * 0.34, cy - s * 0.9, s * 0.14, '#ffd24a');
      // Highlight.
      r.setAlpha(0.5); r.fillCircle(cx - s * 0.2, cy - s * 0.02, s * 0.16, '#fff'); r.setAlpha(1);
    } else if (id === 'shuffle') {
      // Two curved arrows chasing each other.
      for (const dir of [1, -1]) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(dir, dir); ctx.translate(0, -s * 0.32);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, Math.PI * 0.15, Math.PI * 0.95);
        ctx.stroke();
        // Arrow head.
        const ax = Math.cos(Math.PI * 0.95) * s * 0.5, ay = Math.sin(Math.PI * 0.95) * s * 0.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - s * 0.02, ay - s * 0.22);
        ctx.lineTo(ax + s * 0.22, ay - s * 0.06);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  _drawScorePops(renderer) {
    for (const p of this._scorePops) {
      const k = p.t / p.life;
      const pop = k < 0.2 ? k / 0.2 : 1;           // quick scale-in
      const a = k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1;
      const size = Math.round((34 + pop * 8) * (0.7 + pop * 0.3));
      renderer.setAlpha(a);
      renderer.withGlow('#ffe08a', 10, () => renderer.text(p.text, p.x, p.y, {
        font: `900 ${size}px system-ui, sans-serif`, color: '#ffe89a', align: 'center', baseline: 'middle',
        outline: 'rgba(120,80,10,0.7)', outlineWidth: 4,
      }));
      renderer.setAlpha(1);
    }
  }

  render(renderer) {
    if (this._beam > 0) this._drawClearBeam(renderer);
    this._drawScore(renderer);
    this._drawLevel(renderer);
    this._drawEnergy(renderer);
    this._drawPauseButton(renderer);
    for (const child of this.children) child.render(renderer);
    this._drawObjectives(renderer);
    if (this._state === 'playing') { this._drawBoosters(renderer); this._drawHintButton(renderer); }
    if (this._dragonReady && this._state === 'playing') this._drawDragonButton(renderer);
    this._drawCombo(renderer);
    this._drawClearCoins(renderer);
    this._drawScorePops(renderer);
    if (this._toast) this._drawToast(renderer);
    if (this._structToast) this._drawStructToast(renderer);
    if (this._banner) this._drawBanner(renderer);
    if (this._goalCard) this._drawGoalCard(renderer);
    if (this._state === 'over') this._drawGameOver(renderer);
  }

  /** Soft vertical light beam over the board during a line clear. */
  _drawClearBeam(renderer) {
    const board = this.game.getSystem('board')?.area; if (!board) return;
    renderer.setAlpha(this._beam * 0.5);
    const g = renderer.linearGradient(0, board.y, 0, board.bottom, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,246,214,0.9)'], [1, 'rgba(255,255,255,0)']]);
    renderer.fillRect(board.centerX - board.w * 0.3, board.y - 40, board.w * 0.6, board.h + 80, g);
    renderer.setAlpha(1);
  }

  /** Coins flying up toward the score on a line clear. */
  _drawClearCoins(renderer) {
    for (const c of this._coins) {
      renderer.setAlpha(Math.max(0, 1 - c.t / c.life));
      drawObjectiveIcon(renderer, 'coins', c.x, c.y, c.s, '#ffcf5e');
    }
    renderer.setAlpha(1);
  }

  /**
   * The Dragon Energy meter — fades in as it fills and glows brighter as the
   * ultimate nears, so it's invisible when it doesn't matter and impossible to
   * miss right before it's ready.
   */
  _drawEnergy(r) {
    const a = this._energyShown;
    if (a < 0.02) return;
    const b = this._energyBar;
    const frac = clamp(this._energyFrac, 0, 1);
    const near = clamp((frac - 0.7) / 0.3, 0, 1);            // ramps 0→1 near full
    const pulse = 0.5 + 0.5 * Math.sin(this._dragonT * 4);
    const col = Palette.energy[0];
    r.setAlpha(a);
    r.fillRoundRect(b.x, b.y, b.w, b.h, b.h / 2, 'rgba(20,44,92,0.16)');
    r.withGlow(col, 5 + near * 16 * pulse, () => r.fillRoundRect(b.x, b.y, b.w * frac, b.h, b.h / 2, col));
    r.setAlpha(1);
  }

  /** Premium round pause button (top-left). */
  _drawPauseButton(renderer) {
    const r = this._pauseBtn;
    UITheme.button(renderer, r.x, r.y, r.w, r.h, r.h / 2, UI.btn.blue, { shadow: true });
    const bw = r.w * 0.12, bh = r.h * 0.38, cx = r.centerX, cy = r.centerY;
    renderer.fillRoundRect(cx - bw * 1.5, cy - bh / 2, bw, bh, bw * 0.4, '#fff');
    renderer.fillRoundRect(cx + bw * 0.5, cy - bh / 2, bw, bh, bw * 0.4, '#fff');
  }

  /** Brief reward / biome toast just above the board. */
  _drawToast(renderer) {
    const t = clamp(Math.min(this._toast.t * 2, 1), 0, 1);
    renderer.setAlpha(t);
    renderer.withGlow(this._toast.color, 12, () => {
      renderer.text(this._toast.text, this.bounds.centerX, this.bounds.h * 0.185, {
        font: '800 18px system-ui, sans-serif', color: this._toast.color,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.setAlpha(1);
  }

  /** Permanent structure score multiplier, shown beneath the score. */
  /** "<NAME> BUILT" callout when a structure rises. */
  _drawStructToast(renderer) {
    const t = this._structToast.t / 1.8;                 // 1 → 0
    const alpha = clamp(Math.min(t * 3, (1 - t) * 3 + 0.2, 1), 0, 1);
    const board = this.game.getSystem('board').area;
    renderer.setAlpha(alpha);
    renderer.withGlow(Palette.accentAlt, 18, () => {
      renderer.text(`${this._structToast.name.toUpperCase()} BUILT`, board.centerX, board.top - 26, {
        font: '900 26px system-ui, sans-serif', color: Palette.accentAlt,
        align: 'center', baseline: 'middle',
      });
    });
    renderer.setAlpha(1);
  }

  /** Level title, centred above the score. */
  _drawLevel(renderer) {
    const cx = this.bounds.centerX;
    // Title reflects the actual mode: Daily and Endless share rails, but Daily
    // must read "DAILY", not "ENDLESS".
    const daily = this.game.getSystem('gameplay')?.isDaily;
    const title = daily ? t('menu.daily') : this._endless ? t('menu.endless') : t('hud.level', { n: this._level });
    renderer.text(title, cx, this.bounds.h * 0.04, {
      font: '800 30px system-ui, sans-serif', color: Palette.textPrimary,
      align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 4,
    });
    if (this._endless) {
      const tier = this.game.getSystem('level')?.endlessTier ?? 0;
      renderer.text(`DEPTH ${tier + 1}`, cx, this.bounds.h * 0.04 + 26, {
        font: '700 15px system-ui, sans-serif', color: '#eaf4ff',
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 2,
      });
    } else if (this._worldName) {
      renderer.text(this._worldName.toUpperCase(), cx, this.bounds.h * 0.04 + 26, {
        font: '700 15px system-ui, sans-serif', color: '#eaf4ff',
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 2,
      });
    }
  }

  /**
   * Level-start goal intro: a card that announces this level's authored
   * objectives (big icons + labels), pops in, holds, then eases out. Purely a
   * callout — it never blocks input.
   */
  _drawGoalCard(r) {
    const c = this._goalCard, objs = c.objectives, n = objs.length;
    const k = c.t / c.dur;
    const inK = Math.min(1, c.t / 0.45), pop = 1 - Math.pow(1 - inK, 3);
    const outStart = c.dur - 0.5;
    const out = c.t > outStart ? Math.max(0, (c.dur - c.t) / 0.5) : 1;
    const a = pop * out;
    const b = this.bounds;
    const w = Math.min(700, b.w - 80), rowH = 66, h = 118 + n * rowH;
    const cx = b.centerX, cy = b.h * 0.34 + (1 - pop) * -40 + (1 - out) * 26;
    const x = cx - w / 2, y = cy - h / 2;
    const ctx = r.ctx;
    r.setAlpha(a);
    UITheme.glassPanel(r, x, y, w, h, 34);
    UITheme.heading(r, `LEVEL ${this._level}`, cx, y + 44, 26, UI.inkSoft);
    UITheme.heading(r, 'YOUR GOALS', cx, y + 88, 34, UI.ink);
    objs.forEach((o, i) => {
      const ry = y + 128 + i * rowH + rowH / 2;
      r.fillCircle(x + 60, ry, 26, 'rgba(20,44,92,0.08)');
      drawObjectiveIcon(r, o.icon, x + 60, ry, 18, o.color || UI.gold.mid);
      r.text(o.label, x + 104, ry, { font: '800 26px system-ui, sans-serif', color: UI.ink, baseline: 'middle' });
    });
    r.setAlpha(1);
  }

  /**
   * The objectives checklist. Collapsed by default to a compact strip of
   * progress-ring icons (keeps the top clean); tapping it expands to the full
   * labelled rows, tapping again collapses. The level-start goal card already
   * spells the goals out, so compact-by-default never hides anything crucial.
   */
  _drawObjectives(renderer) {
    const rows = this._objectives;
    if (!rows.length) { this._objToggleRect = null; return; }
    if (this._objExpanded) this._drawObjectivesExpanded(renderer);
    else this._drawObjectivesCollapsed(renderer);
  }

  /** Compact strip: one progress-ring icon per goal + an expand chevron. */
  _drawObjectivesCollapsed(r) {
    const rows = this._objectives;
    const w = this.bounds.w;
    const n = rows.length;
    const gap = 54, icoR = 20;
    const stripW = n * gap + 44;
    const x0 = (w - stripW) / 2;
    const cy = this.bounds.h * 0.118;
    const ctx = r.ctx;

    // Glass backing pill.
    r.fillRoundRect(x0, cy - 30, stripW, 60, 30, 'rgba(255,255,255,0.82)');
    r.strokeRoundRect(x0, cy - 30, stripW, 60, 30, Palette.gold, 1.5);

    rows.forEach((o, i) => {
      const cx = x0 + 30 + i * gap;
      const done = o.complete;
      const col = done ? Palette.success : o.color;
      // Progress ring.
      ctx.beginPath(); ctx.arc(cx, cy, icoR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(20,44,92,0.14)'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, icoR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(o.displayProgress, 0, 1));
      ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke();
      // Icon (or check when done).
      if (done) r.text('✓', cx, cy + 1, { font: '900 20px system-ui, sans-serif', color: Palette.success, align: 'center', baseline: 'middle' });
      else drawObjectiveIcon(r, o.icon, cx, cy, 10, o.color);
    });

    // Expand chevron (▸).
    const chx = x0 + stripW - 22;
    ctx.strokeStyle = Palette.textMuted; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(chx - 3, cy - 6); ctx.lineTo(chx + 4, cy); ctx.lineTo(chx - 3, cy + 6); ctx.stroke();

    this._objToggleRect = new Rect(x0, cy - 30, stripW, 60);
  }

  /** Expanded: the full labelled rows (tap anywhere on them to collapse). */
  _drawObjectivesExpanded(renderer) {
    const rows = this._objectives;
    const w = this.bounds.w;
    const rowW = w * 0.9;
    const x0 = (w - rowW) / 2;
    const rowH = 40;
    const baseY = this.bounds.h * 0.108;

    rows.forEach((o, i) => {
      const y = baseY + i * rowH;
      const cyc = y + (rowH - 6) / 2;
      const done = o.complete;
      const accent = done ? Palette.success : o.color;
      const pop = o.completeT >= 0 ? Math.sin(Math.min(o.completeT / 0.3, 1) * Math.PI) * 0.05 : 0;

      renderer.save();
      renderer.translate(x0 + rowW / 2, cyc);
      renderer.scale(1 + pop, 1 + pop);
      renderer.translate(-(x0 + rowW / 2), -cyc);

      // Row background — bright glossy glass with a gold/accent trim.
      renderer.fillRoundRect(x0, y, rowW, rowH - 6, 10,
        done ? 'rgba(63,200,106,0.22)' : 'rgba(255,255,255,0.86)');
      renderer.strokeRoundRect(x0, y, rowW, rowH - 6, 10, done ? Palette.success : Palette.gold, done ? 2 : 1.5);

      // Icon.
      drawObjectiveIcon(renderer, o.icon, x0 + 22, cyc, 11, done ? Palette.success : o.color);

      // Label.
      renderer.text(o.label, x0 + 42, cyc - 7, {
        font: '800 14px system-ui, sans-serif', color: Palette.textInverse, baseline: 'middle',
      });

      // Progress bar.
      const barX = x0 + 42;
      const barW = rowW - 42 - 62;
      const barY = cyc + 9;
      renderer.fillRoundRect(barX, barY, barW, 5, 2.5, 'rgba(20,44,92,0.14)');
      renderer.fillRoundRect(barX, barY, barW * o.displayProgress, 5, 2.5, done ? Palette.success : o.color);

      // Count / check.
      const rx = x0 + rowW - 14;
      if (done) {
        renderer.text('✓', rx, cyc, {
          font: '800 18px system-ui, sans-serif', color: Palette.success, align: 'right', baseline: 'middle',
        });
      } else {
        renderer.text(`${o.progress}/${o.goal}`, rx, cyc, {
          font: '800 13px system-ui, sans-serif', color: Palette.textMuted, align: 'right', baseline: 'middle',
        });
      }
      renderer.restore();
    });
    this._objToggleRect = new Rect(x0, baseY, rowW, rows.length * rowH);
  }

  /** Transient world / new-mechanic discovery callout. */
  _drawBanner(renderer) {
    const b = this._banner;
    const life = b.sub ? 3.6 : 2.2;
    const t = b.t / life;                          // 1 → 0
    const alpha = clamp(Math.min(t * 4, (1 - t) * 4 + 0.2, 1), 0, 1);
    const cx = this.bounds.centerX;
    const y = this.bounds.h * 0.3;
    renderer.setAlpha(alpha);
    renderer.withGlow(Palette.accent, 20, () => {
      renderer.text(b.title, cx, y, {
        font: '900 30px system-ui, sans-serif', color: Palette.textPrimary,
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 5,
      });
    });
    if (b.sub) {
      renderer.text(b.sub, cx, y + 34, {
        font: '800 14px system-ui, sans-serif', color: '#eaf4ff',
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 3,
      });
    }
    renderer.setAlpha(1);
  }

  _drawScore(renderer) {
    const cx = this.bounds.centerX;
    const y = this.bounds.h * 0.075;
    const scale = 1 + this._scorePop * 0.28;
    renderer.save();
    renderer.translate(cx, y);
    renderer.scale(scale, scale);
    renderer.withGlow(Palette.accent, 16 * (0.4 + this._scorePop), () => {
      renderer.text(String(Math.round(this._displayScore)), 0, 0, {
        font: '900 60px system-ui, sans-serif', color: Palette.textPrimary,
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 7,
      });
    });
    renderer.restore();
  }

  _drawCombo(renderer) {
    if (this._comboT <= 0 || !this._comboText) return;
    const t = this._comboT / 1.3;                 // 1 → 0
    const alpha = clamp(t * 1.6, 0, 1);
    // Pop in with an overshoot, then hold; a gentle wobble keeps it alive.
    const pop = Easing.backOut(clamp((1.3 - this._comboT) / 0.22, 0, 1));
    const scale = (0.6 + pop * 0.45) * (this._comboBig ? 1.18 : 1);
    const col = this._comboColor || Palette.gold;
    const size = this._comboBig ? 52 : 38;
    const board = this.game.getSystem('board').area;
    renderer.save();
    renderer.setAlpha(alpha);
    renderer.translate(board.centerX, board.top - 30);
    renderer.rotate(Math.sin((1 - t) * 12) * 0.03 * t);   // tiny settle wobble
    renderer.scale(scale, scale);
    renderer.withGlow(col, this._comboBig ? 30 : 20, () => {
      renderer.text(this._comboText, 0, 0, {
        font: `900 ${size}px system-ui, sans-serif`, color: col,
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 6,
      });
    });
    if (this._comboSub) {
      renderer.text(this._comboSub, 0, size * 0.72, {
        font: '900 20px system-ui, sans-serif', color: '#ffffff',
        align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 4,
      });
    }
    renderer.setAlpha(1);
    renderer.restore();
  }

  _drawGameOver(renderer) {
    const b = this.bounds;
    // Warm translucent veil (a soft sky-blue wash) — never a black-out.
    renderer.setAlpha(0.62 * this._overlayT);
    const veil = renderer.linearGradient(0, 0, 0, b.h,
      [[0, 'rgba(34,110,180,0.9)'], [1, 'rgba(20,60,120,0.92)']]);
    renderer.fillRect(0, 0, b.w, b.h, veil);
    renderer.setAlpha(1);

    const cy = b.centerY;
    const rise = (1 - this._overlayT) * 30;
    renderer.setAlpha(this._overlayT);
    // Title — a golden "NEW BEST!" when the run set a record, else "Game Over".
    if (this._newBest) {
      const beat = 1 + 0.06 * Math.sin(performance.now() / 180);
      renderer.withGlow('#ffd34e', 28, () => {
        renderer.text(t('common.newBest'), b.centerX, cy - 90 - rise, {
          font: `900 ${Math.round(48 * beat)}px system-ui, sans-serif`, color: '#fff6c8',
          align: 'center', baseline: 'middle', outline: '#c8880f', outlineWidth: 7,
        });
      });
    } else {
      renderer.withGlow(Palette.gold, 22, () => {
        renderer.text(t('gameOver.title'), b.centerX, cy - 90 - rise, {
          font: '900 44px system-ui, sans-serif', color: Palette.textPrimary,
          align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 6,
        });
      });
    }
    renderer.text(t('gameOver.score'), b.centerX, cy - 26 - rise, {
      font: '800 15px system-ui, sans-serif', color: '#dbeafc',
      align: 'center', baseline: 'middle',
    });
    renderer.text(String(this._final), b.centerX, cy + 8 - rise, {
      font: '900 40px system-ui, sans-serif', color: '#ffffff',
      align: 'center', baseline: 'middle', outline: Palette.textOutline, outlineWidth: 5,
    });
    renderer.text(`${this._daily ? t('hud.todaysBest') : t('gameOver.best')}  ${this._best}`, b.centerX, cy + 48 - rise, {
      font: '800 16px system-ui, sans-serif', color: this._newBest ? '#ffe08a' : '#dbeafc',
      align: 'center', baseline: 'middle',
    });

    // Consolation: reward the attempt (never punish) + a helpful, non-blaming
    // tip. Progress is always kept, so a lost run still moves the player forward.
    if (this._consolation) {
      renderer.setAlpha(this._overlayT);
      const gold = this._consolation.reward?.coins ?? 0;
      renderer.withGlow(Palette.warning, 10, () => {
        renderer.text(`${t('gameOver.consolation')}  +${gold} ⬤`, b.centerX, cy + 84, {
          font: '800 15px system-ui, sans-serif', color: Palette.warning,
          align: 'center', baseline: 'middle',
        });
      });
      renderer.text(this._consolation.tip, b.centerX, cy + 110, {
        font: '600 13px system-ui, sans-serif', color: '#dbeafc',
        align: 'center', baseline: 'middle',
      });
      renderer.setAlpha(1);
    }

    // Action buttons. When a revive is still available, a bright "CONTINUE
    // (watch ad)" sits above a smaller "Retry"; otherwise just a Retry button.
    renderer.setAlpha(this._overlayT);
    const bw = Math.min(b.w * 0.62, 360), bx = b.centerX - bw / 2;
    let y = cy + 116;
    this._reviveRect = null;
    if (this._canRevive) {
      const rh = 66; this._reviveRect = new Rect(bx, y, bw, rh);
      const beat = 1 + 0.03 * Math.sin(performance.now() / 260);
      const cxp = b.centerX, cyp = y + rh / 2;
      renderer.save(); renderer.translate(cxp, cyp); renderer.scale(beat, beat); renderer.translate(-cxp, -cyp);
      UITheme.button(renderer, bx, y, bw, rh, rh / 2, UI.btn.play, { shadow: true });
      // little play triangle
      renderer.ctx.fillStyle = '#fff';
      renderer.ctx.beginPath(); renderer.ctx.moveTo(bx + 34, cyp - 12); renderer.ctx.lineTo(bx + 34 + 20, cyp); renderer.ctx.lineTo(bx + 34, cyp + 12); renderer.ctx.closePath(); renderer.ctx.fill();
      renderer.text(t('common.continue'), b.centerX + 12, cyp - 8, { font: '900 22px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
      renderer.text(t('common.watchAd'), b.centerX + 12, cyp + 13, { font: '700 12px system-ui, sans-serif', color: 'rgba(255,255,255,0.9)', align: 'center', baseline: 'middle' });
      renderer.restore();
      y += rh + 16;
    }
    const rh2 = 54; this._retryRect = new Rect(bx + bw * 0.15, y, bw * 0.7, rh2);
    UITheme.button(renderer, this._retryRect.x, this._retryRect.y, this._retryRect.w, rh2, rh2 / 2, UI.btn.blue, { shadow: true });
    renderer.text(t('gameOver.retry'), this._retryRect.centerX, this._retryRect.centerY, {
      font: '800 20px system-ui, sans-serif', color: '#fff', align: 'center', baseline: 'middle',
    });
    renderer.setAlpha(1);
  }

  onTap(px, py) {
    if (this._state === 'over' && this._overlayT > 0.6) {
      // Continue (watch a rewarded ad) or Retry from zero.
      if (this._reviveRect?.contains(px, py)) {
        this._reviveRect = null;   // debounce
        this.game.getSystem('monetization')?.offerRewarded('revive', () => this.events.emit('game:revive'));
        return true;
      }
      this.events.emit('ui:restart');
      return true;
    }
    // Dragon Fire ultimate (only while charged + playing).
    if (this._dragonReady && this._state === 'playing' && this._dragonBtn.contains(px, py)) {
      this._dragonReady = false;   // hide immediately; re-armed by gameplay:energy
      this.game.getSystem('audio')?.play('dragonRoar');
      this.events.emit('dragon:unleash');
      return true;
    }
    // Rewarded HINT: watch a short ad → highlight a good move.
    if (this._state === 'playing' && this._hintBtn.contains(px, py)) {
      if (this._hintPending) return true;
      this._hintPending = true;
      this.game.getSystem('monetization')?.offerRewarded('hint', () => this.events.emit('game:hint'))
        .finally(() => { this._hintPending = false; });
      return true;
    }
    // Booster row: arm a cell-target booster, or fire an instant one.
    if (this._state === 'playing') {
      const booster = this.game.getSystem('booster');
      if (booster) {
        for (const b of this._boosterBtns) {
          if (b.rect.contains(px, py)) { booster.arm(b.def.id); return true; }
        }
      }
    }
    if (this._pauseBtn.contains(px, py)) {
      this.events.emit('ui:openPause');
      return true;
    }
    // Toggle the objectives checklist between the compact strip and full rows.
    if (this._objToggleRect?.contains(px, py)) {
      this._objExpanded = !this._objExpanded;
      this.game.getSystem('audio')?.play('pickup', { rate: 1.1 });
      return true;
    }
    return false;
  }
}
