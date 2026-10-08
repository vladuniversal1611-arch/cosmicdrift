/* FALLSHIFT — active abilities: DASH, GRAVITY SHIFT and BREAK. */
(function () {
  'use strict';
  const FS = window.FS;
  const C = FS.C;

  class Abilities {
    constructor(game) {
      this.game = game;
      this.cd = { dash: 0, gravity: 0, break: 0 };
      this.def = null;
      this.reset(FS.Upgrades.baseStats(FS.Storage.data));
    }

    reset(stats) {
      this.def = {
        dash: { cost: stats.dashCost, cd: 4.2 * stats.dashCdMul },
        gravity: { cost: 30, cd: 7.8 },
        break: { cost: 25, cd: 6.1 },
      };
      this.cd.dash = this.cd.gravity = this.cd.break = 0;
    }

    cost(id) {
      return this.def[id].cost;
    }

    // why an ability can't be used ('' = ready)
    blocker(id) {
      const p = this.game.player;
      if (!p.alive) return 'dead';
      if (this.cd[id] > 0) return 'cooldown';
      if (p.energy < this.def[id].cost) return 'energy';
      if (id === 'break' && p.breakCharge < 100) return 'charge';
      return '';
    }

    ready(id) {
      return this.blocker(id) === '';
    }

    use(id) {
      const g = this.game;
      if (g.state !== 'playing') return false;
      const why = this.blocker(id);
      if (why) {
        FS.Audio.play('deny');
        g.ui.denyAbility(id, why);
        return false;
      }
      const p = g.player;
      p.energy -= this.def[id].cost;
      this.cd[id] = this.def[id].cd;
      const st = FS.Storage.data.stats;
      const px = C.LW / 2, py = p.projY();
      if (id === 'dash') {
        p.gDir = 1;
        p.gTimer = 0;
        p.dashTimer = 0.42;
        p.vy = C.DASH_SPEED;
        g.fx.burst(px, py, 18, 260, '#ffffff', { size: 9, life: 0.4, up: -120 });
        g.fx.wave(px, py, g.skinGlow(), 70, 0.35, 0.34, 3);
        g.fx.shake(3);
        FS.Audio.play('dash');
        st.dashes++;
      } else if (id === 'gravity') {
        p.gDir = -1;
        p.gTimer = 1.4;
        p.dashTimer = 0;
        p.vy = -430;
        g.fx.wave(px, py, '#b06bff', 110, 0.55, 1, 3);
        g.fx.burst(px, py, 22, 220, '#b06bff', { size: 9, life: 0.6, kind: 2 });
        g.fx.flash('#7a3cff', 0.18);
        FS.Audio.play('gravity');
        st.gravities++;
      } else if (id === 'break') {
        p.breakCharge = 0;
        g.doBreak();
        st.breaks++;
      }
      g.ui.abilityUsed(id);
      return true;
    }

    update(dt) {
      for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - dt);
    }
  }

  FS.Abilities = Abilities;
})();
