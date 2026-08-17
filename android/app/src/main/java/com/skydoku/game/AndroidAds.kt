package com.skydoku.game

import android.app.Activity
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.FrameLayout
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * The `window.AndroidAds` bridge the game talks to. `@JavascriptInterface`
 * methods run on a binder thread, so every ad / WebView call hops to the UI
 * thread, and each rewarded/interstitial result is handed back to the game via
 * `window.SkydokuAds.onResult(callbackId, ok)`.
 *
 * Ships with Google's official TEST ad unit IDs — replace them (and the App ID
 * in AndroidManifest.xml) with your own before release.
 */
class AndroidAds(
    private val activity: Activity,
    private val webView: WebView,
    private val bannerContainer: FrameLayout,
) {
    private val rewardedUnitId = "ca-app-pub-5816871059908402/2050537086"      // Skydoku rewarded
    private val interstitialUnitId = "ca-app-pub-5816871059908402/9601724049"  // Skydoku interstitial
    private val bannerUnitId = "ca-app-pub-5816871059908402/4540969050"        // Skydoku banner

    private var bannerView: AdView? = null

    // --- JS bridge entry points ------------------------------------------------

    @JavascriptInterface
    fun isRewardedReady(): Boolean = true   // loaded on demand → always offer it

    @JavascriptInterface
    fun showRewarded(placement: String?, callbackId: String) {
        activity.runOnUiThread { loadAndShowRewarded(callbackId) }
    }

    @JavascriptInterface
    fun showInterstitial(placement: String?, callbackId: String) {
        activity.runOnUiThread { loadAndShowInterstitial(callbackId) }
    }

    @JavascriptInterface
    fun showBanner() { activity.runOnUiThread { showBannerUi() } }

    @JavascriptInterface
    fun hideBanner() { activity.runOnUiThread { bannerContainer.visibility = View.GONE } }

    // --- Result plumbing -------------------------------------------------------

    private fun resolve(callbackId: String, ok: Boolean) {
        webView.post {
            webView.evaluateJavascript(
                "window.SkydokuAds && window.SkydokuAds.onResult('$callbackId', $ok);", null,
            )
        }
    }

    // --- Rewarded --------------------------------------------------------------

    private fun loadAndShowRewarded(callbackId: String) {
        RewardedAd.load(
            activity, rewardedUnitId, AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdFailedToLoad(error: LoadAdError) = resolve(callbackId, false)
                override fun onAdLoaded(ad: RewardedAd) {
                    var earned = false
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() = resolve(callbackId, earned)
                        override fun onAdFailedToShowFullScreenContent(e: AdError) = resolve(callbackId, false)
                    }
                    ad.show(activity) { _ -> earned = true }
                }
            },
        )
    }

    // --- Interstitial ----------------------------------------------------------

    private fun loadAndShowInterstitial(callbackId: String) {
        InterstitialAd.load(
            activity, interstitialUnitId, AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdFailedToLoad(error: LoadAdError) = resolve(callbackId, false)
                override fun onAdLoaded(ad: InterstitialAd) {
                    ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() = resolve(callbackId, true)
                        override fun onAdFailedToShowFullScreenContent(e: AdError) = resolve(callbackId, false)
                    }
                    ad.show(activity)
                }
            },
        )
    }

    // --- Banner ----------------------------------------------------------------

    private fun showBannerUi() {
        bannerView?.let { bannerContainer.visibility = View.VISIBLE; return }
        val adView = AdView(activity).apply {
            adUnitId = bannerUnitId
            setAdSize(adaptiveBannerSize())
        }
        bannerContainer.addView(adView)
        bannerContainer.visibility = View.VISIBLE
        adView.loadAd(AdRequest.Builder().build())
        bannerView = adView
    }

    private fun adaptiveBannerSize(): AdSize {
        val metrics = activity.resources.displayMetrics
        val adWidthDp = (metrics.widthPixels / metrics.density).toInt()
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(activity, adWidthDp)
    }

    fun destroy() { bannerView?.destroy(); bannerView = null }
}
