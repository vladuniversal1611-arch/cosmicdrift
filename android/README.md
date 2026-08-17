# Skydoku — Android WebView wrapper

Turnkey reference for wrapping the built `Skydoku.html` in a plain Android
WebView (Android Studio, Kotlin) with **real AdMob ads** wired to the game's
`window.AndroidAds` JS bridge.

The game already speaks this bridge (see `src/systems/monetization/AdProvider.js`
→ `WebViewAdProvider`). You only need to (1) load the HTML in a WebView and
(2) implement `window.AndroidAds`. Both are done for you below — just drop the
files in and set your real ad unit IDs.

## What you get
- `MainActivity.kt` — configured WebView that loads the game from assets,
  handles Back, pauses/resumes correctly, and goes edge-to-edge.
- `AndroidAds.kt` — the `@JavascriptInterface` bridge: rewarded, interstitial
  and banner ads via the Google Mobile Ads SDK, resolving each rewarded/
  interstitial back to the game through `window.SkydokuAds.onResult(...)`.
- `activity_main.xml` — WebView + a bottom banner container.
- `AndroidManifest.xml` and `build.gradle.kts` — the required permission,
  dependency and AdMob App ID.

## Steps
1. **Create the project**: Android Studio → New Project → *Empty Views Activity*,
   language **Kotlin**, package `com.skydoku.game` (or edit the package in the
   files). Min SDK 23+.
2. **Copy the game in**: build the game (`node scripts/build.mjs`) and copy the
   produced `Skydoku.html` to `app/src/main/assets/Skydoku.html`
   (create the `assets` folder if it doesn't exist).
3. **Drop these files in** at the matching paths:
   - `app/src/main/java/com/skydoku/game/MainActivity.kt`
   - `app/src/main/java/com/skydoku/game/AndroidAds.kt`
   - `app/src/main/res/layout/activity_main.xml`
   - merge `AndroidManifest.xml` and the `build.gradle.kts` deps into yours.
4. **AdMob IDs**: the files ship with Google's official **TEST** IDs so you can
   run immediately without risking your account. Before release, replace:
   - the App ID in `AndroidManifest.xml` (`<meta-data ... APPLICATION_ID>`),
   - the three ad unit IDs at the top of `AndroidAds.kt`,
   - the same three unit IDs in the game's `src/config/Config.js` (`ads.admob`)
     are only used by the Capacitor path; the WebView path uses the IDs in
     `AndroidAds.kt`, so keep those authoritative.
5. **Run**. Rewarded (revive / hint / free coins), interstitials (between
   levels + on retry) and the bottom banner will work on-device.

## The bridge contract (already implemented in AndroidAds.kt)
The game calls these on `window.AndroidAds`:
- `isRewardedReady(): boolean`
- `showRewarded(placement, callbackId)` → later `SkydokuAds.onResult(callbackId, earnedBool)`
- `showInterstitial(placement, callbackId)` → later `SkydokuAds.onResult(callbackId, shownBool)`
- `showBanner()` / `hideBanner()`

`@JavascriptInterface` methods run on a binder thread, so everything hops to the
UI thread and the result is delivered with `webView.evaluateJavascript(...)`.

## Notes
- **Consent (GDPR/UMP)**: for EU users add the User Messaging Platform flow
  before requesting ads (com.google.android.ump). Left out here to keep the
  sample focused; AdMob still serves non-personalised ads without it.
- **Ad policy**: interstitials are already frequency-capped and only fire at
  natural breaks by the game; don't add your own mid-game interstitials.
- **Preloading**: this sample loads each rewarded/interstitial on demand for
  clarity. For snappier UX, preload the next ad in the load callbacks.
