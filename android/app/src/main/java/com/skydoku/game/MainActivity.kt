package com.skydoku.game

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.google.android.gms.ads.MobileAds

/**
 * Hosts the Skydoku game in a full-screen WebView and bridges ads to it.
 *
 * The game is a single self-contained HTML file in assets; we load it over the
 * special `file:///android_asset/` path. All ad calls arrive from JS on the
 * `AndroidAds` interface (see AndroidAds.kt).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var ads: AndroidAds
    private lateinit var notify: AndroidNotify

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Immersive full-screen: hide the top status shade + nav bar so the game
        // owns the whole screen. Sticky — a swipe reveals them briefly, then they
        // auto-hide again.
        hideSystemBars()

        // Initialise the Google Mobile Ads SDK once, at boot.
        MobileAds.initialize(this) {}

        webView = findViewById(R.id.webview)
        val bannerContainer: FrameLayout = findViewById(R.id.ad_container)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true            // the game persists progress in localStorage
            mediaPlaybackRequiresUserGesture = false   // let the audio unlock on first tap
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            // The game is fixed-portrait and manages its own scaling — no user zoom.
            setSupportZoom(false)
            builtInZoomControls = false
        }
        webView.setBackgroundColor(0xFF8FD0FF.toInt())   // sky blue behind letterbox
        webView.webViewClient = WebViewClient()          // keep navigation inside the WebView

        // Wire the JS ad bridge: the game calls window.AndroidAds.*
        ads = AndroidAds(this, webView, bannerContainer)
        webView.addJavascriptInterface(ads, "AndroidAds")

        // Wire the JS notification bridge: the game calls window.AndroidNotify.*
        // to schedule "come back and play" reminders.
        notify = AndroidNotify(this)
        webView.addJavascriptInterface(notify, "AndroidNotify")

        webView.loadUrl("file:///android_asset/Skydoku.html")

        // Back button navigates the WebView history, then exits.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onPause() { webView.onPause(); super.onPause() }
    override fun onResume() { super.onResume(); webView.onResume() }
    override fun onDestroy() { ads.destroy(); webView.destroy(); super.onDestroy() }

    /** Re-hide the system bars whenever we regain focus (e.g. after the shade
     *  was pulled down or a dialog was dismissed). */
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }
}
