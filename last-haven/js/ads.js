/* AdManager — simulated ads.
   To ship real ads, keep this public API and replace the bodies of
   showRewardedAd / showInterstitial with calls into your mobile ad SDK
   (e.g. a Capacitor AdMob plugin). Game code only ever talks to this object. */
(function () {
  'use strict';
  const BI = (window.BI = window.BI || {});

  const AdManager = {
    provider: 'simulated',
    sessionStart: Date.now(),
    lastInterstitial: 0,
    interstitialCooldownMs: 4 * 60 * 1000, // never more often than this
    interstitialGraceMs: 3 * 60 * 1000,    // no interstitials in the first minutes
    busy: false,

    init() {
      this.el = document.getElementById('ad-overlay');
      this.fill = document.getElementById('ad-fill');
      this.count = document.getElementById('ad-count');
      this.closeBtn = document.getElementById('ad-close');
    },

    isRewardedReady() { return !this.busy; },

    /** callback(rewarded:boolean) */
    showRewardedAd(callback) {
      if (this.busy) return;
      this._simulate(3, true, callback);
    },

    /** Frequency-capped. onClose(shown:boolean) */
    showInterstitial(onClose) {
      const now = Date.now();
      if (this.busy || now - this.sessionStart < this.interstitialGraceMs || now - this.lastInterstitial < this.interstitialCooldownMs) {
        if (onClose) onClose(false);
        return false;
      }
      this.lastInterstitial = now;
      this._simulate(2, false, onClose);
      return true;
    },

    _simulate(seconds, rewarded, callback) {
      if (!this.el) this.init();
      this.busy = true;
      if (BI.Audio) BI.Audio.suspend();
      const el = this.el, fill = this.fill, count = this.count, closeBtn = this.closeBtn;
      el.classList.add('active');
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = 'width ' + seconds + 's linear';
      fill.style.width = '100%';
      let left = seconds;
      let finished = false;
      closeBtn.textContent = rewarded ? '✕ SKIP (no reward)' : '✕ CLOSE';
      closeBtn.classList.toggle('hidden', !rewarded);
      count.textContent = (rewarded ? 'Reward in ' : 'Ad closes in ') + left + 's';

      const done = (granted) => {
        if (finished) return;
        finished = true;
        clearInterval(timer);
        closeBtn.onclick = null;
        el.classList.remove('active');
        this.busy = false;
        if (BI.Audio) BI.Audio.resume();
        if (callback) callback(granted);
      };
      const timer = setInterval(() => {
        left--;
        if (left > 0) {
          count.textContent = (rewarded ? 'Reward in ' : 'Ad closes in ') + left + 's';
        } else {
          clearInterval(timer);
          count.textContent = rewarded ? '🎉 Reward earned!' : 'Thanks for watching';
          closeBtn.classList.add('hidden');
          setTimeout(() => done(rewarded), 650);
        }
      }, 1000);
      closeBtn.onclick = () => done(false);
    },
  };

  BI.AdManager = AdManager;
  window.AdManager = AdManager;
})();
