/*  Copies weeknote.html + assets/ + admob-bridge.js into www/
    and injects the bridge <script> if it's not already referenced.
    Runs on `npm install` (via postinstall) and on `npm run sync`. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WWW  = path.join(ROOT, 'www');

fs.mkdirSync(WWW, { recursive: true });

// --- 1. copy weeknote.html → www/index.html (wrapped in minimal HTML shell)
const raw = fs.readFileSync(path.join(ROOT, 'weeknote.html'), 'utf8');
// The file is a fragment (starts with <meta charset>, no <html>/<body>).
// Wrap it so Capacitor / any browser can load it as a full document.
const html = `<!DOCTYPE html>
<html lang="en">
${raw}
<script src="admob-bridge.js"></script>
</html>
`;
fs.writeFileSync(path.join(WWW, 'index.html'), html);

// --- 2. copy assets folder (leather, paper, disc, corner, desk, shadow …)
const ASSETS_SRC = path.join(ROOT, 'assets');
const ASSETS_DST = path.join(WWW, 'assets');
if (fs.existsSync(ASSETS_SRC)) {
  fs.mkdirSync(ASSETS_DST, { recursive: true });
  for (const f of fs.readdirSync(ASSETS_SRC)) {
    fs.copyFileSync(path.join(ASSETS_SRC, f), path.join(ASSETS_DST, f));
  }
}

// --- 3. write the AdMob bridge (idempotent — always overwrites to keep it fresh)
const bridge = `/*  AdMob bridge — connects the @capacitor-community/admob plugin
    to window.WNAds so weeknote.html can request banner / interstitial /
    rewarded ads without knowing anything about the native SDK. */
(function () {
  async function boot () {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.AdMob) return;
    const { AdMob, BannerAdPosition, BannerAdSize } = window.Capacitor.Plugins;
    const cfg = window.ADMOB;
    if (!cfg) return;

    try { await AdMob.initialize({ requestTrackingAuthorization: true }); } catch (e) {}

    window.WNAds = {
      async showBanner () {
        try {
          await AdMob.showBanner({
            adId: cfg.banner,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
          });
        } catch (e) {}
      },
      async showInterstitial () {
        try {
          await AdMob.prepareInterstitial({ adId: cfg.interstitial });
          await AdMob.showInterstitial();
        } catch (e) {}
      },
      async showRewarded (_cfg, onReward) {
        try {
          await AdMob.prepareRewardVideoAd({ adId: cfg.rewarded });
          const res = await AdMob.showRewardVideoAd();
          onReward && onReward(true, res);
        } catch (e) { onReward && onReward(false); }
      },
    };

    if (typeof enableAds === 'function') enableAds();
    window.WNAds.showBanner();
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
`;
fs.writeFileSync(path.join(WWW, 'admob-bridge.js'), bridge);

console.log('✓ www/ built (index.html + assets + admob-bridge.js)');
