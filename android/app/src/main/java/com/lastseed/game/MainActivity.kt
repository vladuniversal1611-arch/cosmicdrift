package com.lastseed.game

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.WebView

/**
 * Обгортка WebView для гри «Останнє Насіння».
 * Сама гра — один файл assets/index.html; збереження живуть у
 * localStorage (domStorageEnabled), тож прогрес переживає перезапуски.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(0xFF0D1A12.toInt())
            loadUrl("file:///android_asset/index.html")
        }
        setContentView(web)
        hideSystemBars()
    }

    private fun hideSystemBars() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION

        window.decorView.setOnSystemUiVisibilityChangeListener {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility =
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        }
    }

    override fun onPause() {
        super.onPause()
        // подія visibilitychange у грі викликає автозбереження
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        hideSystemBars()
    }
}
