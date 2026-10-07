# Hill Rush — release guide (Google Play)

The game is one offline file, `hill_rush.html`, plus `sw.js`, `manifest.json`
and `icons/` for the web/PWA build. The Android app in `android/` is a thin
native WebView wrapper that ships those files inside the APK/AAB.

## Why a WebView wrapper (not TWA / Capacitor)

| Option | Verdict |
|---|---|
| **Native WebView wrapper** (chosen) | Runs fully offline from APK assets, no server, no npm, no extra dependencies (framework classes only + the Android Gradle Plugin). |
| Trusted Web Activity | Needs the game hosted on an HTTPS domain with Digital Asset Links; the first launch depends on that server. |
| Capacitor | Brings an npm toolchain, which this project avoids. |

## What the wrapper does

- Loads `file:///android_asset/hill_rush.html`. **This URL must never change**:
  the player's progress (WebView localStorage) is tied to it.
- Hides the system bars, keeps the screen on, uses the display cutout, and
  shows a sky-coloured splash screen (system splash on Android 12+), so there
  is no white flash at launch.
- Back button: pauses in a run, returns to the menu from other screens, and
  closes the app from the menu (`window.androidBack()` in the game).
- `onPause`/`onResume` send `pagehide`/`pageshow`, so the game auto-pauses and
  suspends audio when backgrounded.
- The only permission is `VIBRATE`. There is **no INTERNET permission**.
- `allowBackup=true`, so Android Auto Backup can restore progress after a
  reinstall.

## Building (on a machine with the Android SDK)

These steps could not be run here: the sandbox's network policy blocks
`dl.google.com`, which hosts the Android SDK and Google Maven artifacts. The
wrapper's Java was compile-checked against Android framework classes, and all
resource XML was validated.

1. Install Android Studio (or the command-line tools) with **SDK Platform 36**
   and the matching Build-Tools. Use JDK 17+.
2. Change `applicationId` in `android/app/build.gradle`. **You cannot change
   it after the first upload.**
3. Create an upload key, then copy `android/keystore.properties.example` to
   `android/keystore.properties` and fill it in. Never commit either file.
   ```
   keytool -genkeypair -v -keystore android/hillrush-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias upload
   ```
4. Build the bundle. Open `android/` in Android Studio, or run
   `gradle wrapper && ./gradlew bundleRelease` there:
   ```
   cd android
   ./gradlew bundleRelease          # → app/build/outputs/bundle/release/app-release.aab
   ./gradlew assembleDebug          # quick device test
   ```
   A `copyWebAssets` task copies `hill_rush.html`, `manifest.json` and
   `icons/` from the repository root into the APK on every build, so the root
   files are the only copy to edit.
5. Enrol in **Play App Signing** when you create the app in Play Console.
   Upload the AAB to an internal testing track first.

### Versioning

| Field | Where | Rule |
|---|---|---|
| `versionCode` | `android/app/build.gradle` | +1 on every upload |
| `versionName` | `android/app/build.gradle` and `APP_VERSION` in `hill_rush.html` | Keep them in sync |
| `SAVE_VER` | `hill_rush.html` | Bump only when the save format changes, and add a migration |
| `CACHE` | `sw.js` | Bump for every web release |

### Target API level

New apps and updates submitted from **31 Aug 2026** must target **Android 16
(API 36)**; extensions can be requested until 1 Nov 2026. The project uses
`compileSdk 36` / `targetSdk 36`. Re-check the
[target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
and [Play Console help](https://support.google.com/googleplay/android-developer/answer/11926878)
before each release.

On Android 16, apps targeting API 36 cannot force portrait on large screens
(tablets, foldables). The game handles this by letterboxing its 9:16 view in
any window shape, with the bars filled in the scene colours.

## Device test checklist (needs real hardware)

- [ ] Cold start shows the sky splash, then the menu; no white flash
- [ ] Gas/brake multi-touch; holding both pedals works
- [ ] Home button and back again: the run is paused and audio resumes after tapping
- [ ] Back button behaviour on each screen
- [ ] Progress survives force-stop and app update (install the new build over the old one)
- [ ] Vibration on crash and stunts, and the vibration setting turns it off
- [ ] Notch/cutout phones and a 20:9 phone; a tablet in landscape (letterboxed)
- [ ] 60 fps on a low-end device (Android 7–8, 2 GB RAM)

## Monetisation integration (optional)

The game calls these bridges, and the wrapper's stubs report "not available":

| Bridge | Game API |
|---|---|
| Ads | `window.HillRushAds.isReady(type)` and `.show(type, requestId)`; the result comes back through `window.onRewardAdResult(requestId, granted)` |
| Billing | `window.HillRushBilling.available()` and `.purchase(productId)`; the result comes back through `window.onPurchaseResult(productId, ok, purchaseToken)` |

While the stubs are in place, every ad and shop button stays hidden and the
game is complete without them. To ship real ads or purchases:

- Implement `GameBridge.Ads` with the Google Mobile Ads rewarded API. Call
  `onRewardAdResult(id, true)` only from the "user earned reward" callback.
  Placements are `double` (x2 run coins, on the results screen) and `daily`
  (x2 login reward). The game allows at most 10 per day.
- Implement `GameBridge.Billing` with Play Billing. Call
  `onPurchaseResult(id, true, token)` only after the purchase is
  acknowledged or consumed. The game grants coins once per token. Product IDs
  are `coins_s`, `coins_m` and `coins_l` (`IAP_PRODUCTS` in the game).
- Adding an ads SDK adds the INTERNET and AD_ID permissions and changes the
  answers in the next section.

## Play Console declarations

These describe the code **as it is in this repository**. Re-answer them if you
add any SDK.

| Declaration | Current build |
|---|---|
| Data safety | The app collects and shares **no user data**. Progress is stored only on the device (WebView localStorage) and may be included in Android's own backup. There is no network access, analytics, ads SDK or account. |
| Ads | "No, my app does not contain ads" while the stubs are in place. Change this if you integrate an ads SDK. |
| Permissions | `VIBRATE` only. |
| App access | No login; everything is available without restrictions. |
| Content rating | Complete the IARC questionnaire. The content is a cartoon vehicle game: crashes without blood or injury detail, and no gambling, purchases or user-generated content in the current build. Expect the lowest age ratings, but the questionnaire decides. |
| Target audience | **Decide this yourself.** If you include children under 13, the app falls under the Families policy: ads must come from Families-certified SDKs, there are extra privacy requirements, and the rules on rewarded ads and purchases apply. Targeting 13+ avoids that but is a product decision. |
| Privacy policy | Play Console asks for a privacy policy URL. `PRIVACY.md` is a starting template that matches the current build; host it publicly and update it if you add SDKs. |

## Payload size

| Part | Size |
|---|---|
| `hill_rush.html` | ~125 KB (≈39 KB gzipped) |
| Web icons | ~235 KB |
| Launcher icons (5 densities) | ~242 KB |
| Wrapper code | ~10 KB of classes before dexing |

The expected AAB is well under 1 MB, plus a few hundred KB of standard
resources. Nothing large is bundled. The other files in the repository
(`cosmic_drift_v5 (2).html`, `qa/`, `tools/`, `store/`) are **not** copied
into the app.

## Performance (measured in headless Chromium, no GPU)

| Condition | Result |
|---|---|
| Normal CPU, 2× render resolution | 60 fps |
| 4× CPU throttle (≈ low-end phone), after the resolution governor | 2× → 1× in ~3 s, 60 fps, p95 frame 16.8 ms |
| JS heap during a run | ≈ 9.5 MB; track memory stays flat on long runs (old geometry pruned) |

The canvas renders at up to 2× for sharpness. If frames average more than
22 ms, it steps down to 1×, then switches to a low-quality tier without the
vignette or dirt pebbles. Real devices rasterise on the GPU, so they should
do better than these software-rendered numbers; confirm on a low-end phone.

## External asset tasks (need a designer)

These cannot be made well in code, so they are placeholders for now:

- [ ] Final launcher icon (512×512 for Play, plus the adaptive foreground and
  background layers). The current icons are rendered from the in-game jeep by
  `tools/make_icons.js`.
- [ ] Play feature graphic 1024×500. `store/placeholder/` holds a labelled
  placeholder.
- [ ] Phone screenshots: at least 2, recommended 4–8, in portrait 9:16. Take
  them from the game, e.g. with `qa/qa.js`, which saves screenshots.
- [ ] Optional: promo video, tablet screenshots.
- [ ] Name/branding check: "Hill Rush" must not be confusable with existing
  trademarks. Do not use other games' names, logos or art in the listing.

## Regression before every release

```
npm i --no-save playwright      # dev only
node qa/qa.js                   # UI, lifecycle, saves, stunts, monetisation guards
node qa/flow.js                 # full player journey, edge cases, throttled performance
node qa/physics_bench.js        # physics feel metrics
node qa/economy_sim.js          # economy pacing (slow; run after balance changes)
```
