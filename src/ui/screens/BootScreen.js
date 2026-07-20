/**
 * BootScreen.js
 * -----------------------------------------------------------------------------
 * The title / entry screen shown at launch. In the foundation it presents the
 * game name, version and a "Play" button that (for now) simply announces intent
 * via an event. When gameplay lands, its handler will push the gameplay screen.
 *
 * This screen doubles as a living smoke-test that the whole stack — canvas,
 * renderer, widgets, input routing and systems — is wired up correctly.
 * -----------------------------------------------------------------------------
 */
import { Screen } from '../Screen.js';
import { Label } from '../widgets/Label.js';
import { Button } from '../widgets/Button.js';
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';

export class BootScreen extends Screen {
  constructor(game) {
    super(game);
    this.name = 'boot';

    const cx = this.bounds.centerX;

    // Title.
    this.add(new Label(Config.meta.name.toUpperCase(), 0, this.bounds.h * 0.30, {
      w: this.bounds.w, align: 'center', baseline: 'middle',
      font: '800 56px system-ui, sans-serif', color: Palette.textPrimary,
    }));

    // Tagline.
    this.add(new Label('Drift. Place. Ascend.', 0, this.bounds.h * 0.30 + 46, {
      w: this.bounds.w, align: 'center', baseline: 'middle',
      font: '500 20px system-ui, sans-serif', color: Palette.textMuted,
    }));

    // Play button.
    const bw = this.bounds.w * 0.6;
    const bh = 72;
    this.add(new Button('PLAY', cx - bw / 2, this.bounds.h * 0.62, bw, bh, () => {
      // GAMEPLAY HOOK: later this pushes the gameplay screen. For the
      // foundation it just signals readiness so the wiring is observable.
      this.events.emit('ui:playPressed');
    }));

    // Version footer.
    this.add(new Label(`v${Config.meta.version} · ${Config.meta.channel}`, 0, this.bounds.h - 40, {
      w: this.bounds.w, align: 'center',
      font: '500 14px system-ui, sans-serif', color: Palette.textMuted,
    }));
  }
}
