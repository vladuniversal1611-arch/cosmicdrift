# AdMob Setup (Cosmic Drift)

The game's HTML already contains a complete ad layer (`cdAds`) and 4 placements:

| Placement | Where it triggers |
|-----------|-------------------|
| **Rewarded — Revive** | "CONTINUE?" screen after you die (once per run) |
| **Rewarded — ×2 Coins** | Green "WATCH AD · ×2 COINS" button in the shop |
| **Interstitial** | When you advance to a new sector (every 5 waves) |
| **Banner** | Bottom of screen on the menu / game-over screens only |

In a browser/PWA there is no native bridge, so **every ad call is a safe no-op** and
the game runs normally. The ads only activate inside the Android (Capacitor) build.

---

## 1. Install the plugin (Capacitor)

From your project root (the folder with `capacitor.config.*` and the `android/` project
you open in Android Studio):

```bash
npm install @capacitor-community/admob
npx cap sync android
```

## 2. Add your AdMob App ID

Get an **App ID** in the AdMob console (looks like `ca-app-pub-XXXXXXXX~YYYYYYYY`).
In `android/app/src/main/AndroidManifest.xml`, inside `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```

## 3. Put in your real ad-unit IDs

Create 3 ad units in AdMob (Rewarded, Interstitial, Banner). Open the game HTML and
edit the `AD_CONFIG` block near the top of the `<script>`:

```js
const AD_CONFIG = {
  useTestAds: false,                       // ← false for production
  android: {
    rewarded:     'ca-app-pub-XXXX/REWARDED_ID',
    interstitial: 'ca-app-pub-XXXX/INTERSTITIAL_ID',
    banner:       'ca-app-pub-XXXX/BANNER_ID',
  },
};
```

While testing, leave `useTestAds: true` (the file ships with Google's official test
unit IDs) so you don't risk your account on self-clicks.

## 4. Rebuild

```bash
npx cap copy android      # if the HTML lives in your web assets
npx cap sync android
```
Then build/run from Android Studio.

---

## Consent (required for EEA users)

Google requires a consent/UMP flow for users in the EEA. The simplest path is the
AdMob **UMP** SDK; configure a consent form in the AdMob console and the plugin's
`requestConsentInfo` / `showConsentForm` APIs. This is a native concern and is not
handled in the HTML.

## Notes / tuning

- The rewarded reward is detected both from `showRewardVideoAd()`'s return value and
  from reward event listeners, to cover different plugin versions. If your plugin
  version uses a different event name and the reward isn't granted, add that event
  name to the listener array in `cdAds.init()`.
- To show the banner in more places (e.g. the shop), widen the `show` condition in
  `syncBanner()`.
- To change interstitial frequency, move/guard the `cdAds.interstitial()` call in
  `zoneComplete()`.

## If you did NOT use Capacitor (raw WebView app)

If your Android Studio project is a plain `WebView` (not Capacitor), expose a JS
bridge from native and the game will use it automatically — implement:

```js
window.cdShowRewardedAd = (onReward, onSkip) => { /* call native rewarded, then onReward()/onSkip() */ };
```

That single hook powers the revive and ×2-coins rewards. Interstitial/banner would
need equivalent native calls wired where `cdAds.interstitial()` / `showBanner()` are.
