package com.holeevolution

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.os.Vibrator
import android.view.View
import android.view.Window
import android.view.WindowManager
import android.webkit.*

class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Immersive full-screen
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }

        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }
        }
        webView.webChromeClient = WebChromeClient()
        webView.loadUrl("file:///android_asset/game/index.html")
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun vibrate(ms: Long) {
            @Suppress("DEPRECATION")
            val v = getSystemService(VIBRATOR_SERVICE) as? Vibrator
            @Suppress("DEPRECATION")
            v?.vibrate(ms)
        }

        @JavascriptInterface
        fun getVersion(): String = "1.0.0"

        @JavascriptInterface
        fun closeApp() = finish()
    }

    override fun onBackPressed() {
        webView.evaluateJavascript(
            "(function(){ if(window.game) window.game.onBackPressed(); })();",
            null
        )
    }

    override fun onPause() {
        super.onPause()
        webView.evaluateJavascript(
            "(function(){ if(window.game) window.game.onPause(); })();",
            null
        )
    }

    override fun onResume() {
        super.onResume()
        webView.evaluateJavascript(
            "(function(){ if(window.game) window.game.onResume(); })();",
            null
        )
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
