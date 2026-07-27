/**
 * PopupManager.js
 * -----------------------------------------------------------------------------
 * The single authority for popups. Any system requests one with `popup:open`;
 * the manager serialises them through a priority queue so two popups never fight
 * for the screen, and shows the next only after the current closes. It routes
 * rich existing flows (Daily, Events) to their dedicated screens and renders the
 * generic ones (News, Offers, Maintenance, Connection Lost) through a single
 * pooled PopupScreen.
 *
 * It NEVER manipulates gameplay — it only pushes/pops screens via UI events.
 *
 * Events:
 *   listens 'popup:open' ({ id, priority, ...cfg }), 'popup:closed'
 *   emits   'ui:openDaily' | 'ui:openEvents' | 'ui:pushScreen' | (config action)
 * -----------------------------------------------------------------------------
 */
import { System } from '../../core/System.js';
import { PopupScreen } from '../../ui/screens/PopupScreen.js';

/** Built-in generic popup templates (dedicated screens for daily/events). */
const TEMPLATES = {
  news: { title: 'What\'s New', message: 'A fresh update just landed. New islands, new dragons and more await!', cta: 'Nice!' },
  offer: { title: 'Special Offer', message: 'A limited-time bundle is available in the Shop.', cta: 'View', action: 'ui:openShop' },
  maintenance: { title: 'Scheduled Maintenance', message: 'The servers are resting briefly. Please try again shortly.', cta: 'OK', dismissable: false },
  connection: { title: 'Connection Lost', message: 'We couldn\'t reach the server. Check your connection and retry.', cta: 'Retry', action: 'net:retry', dismissable: false },
};

export class PopupManager extends System {
  constructor(game) {
    super(game);
    this.name = 'popups';
    this._queue = [];
    this._showing = null;
    this._popup = null;    // pooled PopupScreen instance
  }

  onInit() {
    this.listen('popup:open', (d) => this._enqueue(d));
    this.listen('popup:closed', () => this._onClosed());
  }

  onReset() { this._queue.length = 0; this._showing = null; }

  _enqueue(d = {}) {
    this._queue.push({ priority: 0, ...d });
    this._queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    if (!this._showing) this._showNext();
  }

  _showNext() {
    const d = this._queue.shift();
    if (!d) { this._showing = null; return; }
    this._showing = d;
    // Route rich flows to their dedicated screens.
    if (d.id === 'daily') { this.events.emit('ui:openDaily'); return; }
    if (d.id === 'events') { this.events.emit('ui:openEvents'); return; }
    // Everything else uses the pooled generic PopupScreen.
    const cfg = { ...(TEMPLATES[d.id] || {}), ...d };
    if (!this._popup) this._popup = new PopupScreen(this.game);
    this._popup.configure(cfg);
    this.events.emit('ui:pushScreen', { screen: this._popup });
  }

  _onClosed() {
    this._showing = null;
    // Defer to next tick so the stack settles before the next push.
    if (this._queue.length) Promise.resolve().then(() => { if (!this._showing) this._showNext(); });
  }
}
