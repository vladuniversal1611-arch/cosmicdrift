/* ============================================================
   Ads — monetization layer.

   On a packaged Android build this drives Google AdMob through the
   @capacitor-community/admob plugin (rewarded video + interstitial).
   In the browser / preview it shows a lightweight simulated ad so the
   whole flow is testable without the native plugin.

   >>> Before publishing: see android-resources/ADMOB_SETUP.md and replace
       the TEST ad unit IDs below with your real AdMob unit IDs, and set
       CONFIG.testing = false.
   ============================================================ */
(function (global) {
  'use strict';

  const CONFIG = {
    // Keep TRUE until the store release so only Google test ads are served
    // (showing real ads to yourself during dev violates AdMob policy).
    testing: true,
    android: {
      // Google's official TEST ad unit IDs (safe for development):
      rewarded:     'ca-app-pub-3940256099942544/5224354917',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      banner:       'ca-app-pub-3940256099942544/6300978111'
    },
    interstitialEveryLevels: 3,        // at most one interstitial per N level completions
    interstitialMinGapMs: 90 * 1000,   // and never more often than every 90s
    interstitialMinLevelsWon: 3        // never interstitial-bomb brand-new players
  };

  function cap() { return global.Capacitor; }
  function plugin() { const c = cap(); return c && c.Plugins && c.Plugins.AdMob; }
  function isNative() { const c = cap(); return !!(c && c.isNativePlatform && c.isNativePlatform() && plugin()); }

  let inited = false, initing = null;
  let rewardedReady = false, interReady = false;
  let lastInterstitial = 0, levelsSinceInterstitial = 0;

  function ensureInit() {
    if (inited) return Promise.resolve(true);
    if (!isNative()) return Promise.resolve(false);
    if (initing) return initing;
    const AdMob = plugin();
    initing = AdMob.initialize({ initializeForTesting: CONFIG.testing })
      .then(function () { inited = true; prepareRewarded(); prepareInterstitial(); return true; })
      .catch(function () { return false; });
    return initing;
  }

  function prepareRewarded() {
    const AdMob = plugin(); if (!AdMob) return Promise.resolve();
    return AdMob.prepareRewardVideoAd({ adId: CONFIG.android.rewarded, isTesting: CONFIG.testing })
      .then(function () { rewardedReady = true; }).catch(function () { rewardedReady = false; });
  }
  function prepareInterstitial() {
    const AdMob = plugin(); if (!AdMob) return Promise.resolve();
    return AdMob.prepareInterstitial({ adId: CONFIG.android.interstitial, isTesting: CONFIG.testing })
      .then(function () { interReady = true; }).catch(function () { interReady = false; });
  }

  // ---- Rewarded video ------------------------------------------------------
  // onReward runs ONLY when the user actually earns the reward; onClose always
  // runs at the end (reward or not / dismissed / failed).
  function rewarded(onReward, onClose) {
    if (isNative()) { showNativeRewarded(onReward, onClose); }
    else { simulate('rewarded', function (completed) { if (completed && onReward) onReward(); if (onClose) onClose(); }); }
  }

  function showNativeRewarded(onReward, onClose) {
    const AdMob = plugin();
    let earned = false, done = false, rl, dl, fl;
    const finish = function () {
      if (done) return; done = true;
      try { rl && rl.remove(); dl && dl.remove(); fl && fl.remove(); } catch (e) {}
      if (earned && onReward) onReward();
      if (onClose) onClose();
      prepareRewarded(); // preload the next one
    };
    // Event names per @capacitor-community/admob (RewardAdPluginEvents).
    try {
      rl = AdMob.addListener('onRewardedVideoAdReward', function () { earned = true; });
      dl = AdMob.addListener('onRewardedVideoAdDismissed', finish);
      fl = AdMob.addListener('onRewardedVideoAdFailedToShow', finish);
    } catch (e) {}
    ensureInit().then(function () {
      const go = rewardedReady ? Promise.resolve() : prepareRewarded();
      go.then(function () { return AdMob.showRewardVideoAd(); }).catch(finish);
    });
  }

  // ---- Interstitial --------------------------------------------------------
  // Returns true if an ad was (or will be) shown. Frequency-capped.
  function interstitial(force) {
    if (!force) {
      levelsSinceInterstitial++;
      const won = (global.Save && global.Save.get().stats.levelsWon) || 0;
      if (won < CONFIG.interstitialMinLevelsWon) return false;
      if (levelsSinceInterstitial < CONFIG.interstitialEveryLevels) return false;
      if (Date.now() - lastInterstitial < CONFIG.interstitialMinGapMs) return false;
    }
    lastInterstitial = Date.now(); levelsSinceInterstitial = 0;
    if (isNative()) { showNativeInterstitial(); return true; }
    // Web/preview: show a short simulated interstitial so the flow is visible.
    simulate('interstitial', function () {});
    return true;
  }
  function showNativeInterstitial() {
    const AdMob = plugin();
    ensureInit().then(function () {
      const go = interReady ? Promise.resolve() : prepareInterstitial();
      go.then(function () { return AdMob.showInterstitial(); }).catch(function () {})
        .then(function () { interReady = false; prepareInterstitial(); });
    });
  }

  // ---- Web/preview simulation ---------------------------------------------
  function simulate(kind, done) {
    const secs = kind === 'rewarded' ? 5 : 3;
    const layer = document.createElement('div');
    layer.className = 'ad-sim';
    const T = global.T || function (k) { return k; };
    layer.innerHTML =
      '<div class="ad-sim-card">' +
        '<div class="ad-sim-tag">' + (T('ad_label') || 'Ad') + '</div>' +
        '<div class="ad-sim-icon">📺</div>' +
        '<div class="ad-sim-title">' + (kind === 'rewarded' ? (T('rewarded_ad') || 'Rewarded ad') : (T('ad_label') || 'Ad')) + '</div>' +
        '<div class="ad-sim-count"><span id="ad-sim-n">' + secs + '</span></div>' +
        '<button class="btn btn-ghost btn-mini ad-sim-skip hidden">' + (T('ad_skip') || 'Skip') + '</button>' +
      '</div>';
    (global.UI && global.UI.root ? global.UI.root : document.body).appendChild(layer);
    let n = secs, completed = false;
    const nEl = layer.querySelector('#ad-sim-n');
    const skip = layer.querySelector('.ad-sim-skip');
    const close = function (ok) { completed = ok; if (layer.parentNode) layer.remove(); if (done) done(ok); };
    if (kind === 'interstitial') { skip.classList.remove('hidden'); skip.textContent = '✕'; skip.addEventListener('click', function () { close(true); }); }
    const iv = setInterval(function () {
      n--; if (nEl) nEl.textContent = n;
      if (n <= 0) { clearInterval(iv); if (kind === 'rewarded') { close(true); } else { close(true); } }
    }, 700);
  }

  global.Ads = {
    init: ensureInit,
    rewarded: rewarded,
    interstitial: interstitial,
    isNative: isNative,
    CONFIG: CONFIG
  };
  // Back-compat bridge used by UI.watchAdGeneric: only expose the native path so
  // the browser keeps using the existing in-UI simulated ad.
  if (isNative()) {
    global.AdMobBridge = { showRewarded: function (cb) { rewarded(cb, null); } };
  }
  // Initialise early on native so the first ad is preloaded.
  try { ensureInit(); } catch (e) {}
})(window);
