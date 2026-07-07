package com.tinykingdom.game;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Tiny Kingdom — тонка обгортка над HTML5-грою.
 * Уся гра живе в assets (index.html + js/ + css/), збереження — у localStorage WebView.
 */
public class MainActivity extends AppCompatActivity {

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage — тут живуть збереження гри
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);

        // Кнопка «назад» згортає гру, а не вбиває процес — прогрес зберігається сам
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { moveTaskToBack(true); }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.evaluateJavascript("if(window.Game)Game.save();", null);
    }

    /** Міст WebView ↔ Android. Гра викликає AndroidBridge.showRewardedAd(kind). */
    public class AndroidBridge {
        /**
         * TODO для релізу: інтегрувати Google AdMob Rewarded Ads.
         * 1) Додати play-services-ads у build.gradle і APPLICATION_ID у маніфест.
         * 2) Завантажити RewardedAd та показати тут.
         * 3) В onUserEarnedReward викликати grantAdReward(kind) (як нижче).
         * Поки що нагорода видається одразу — гра повністю грабельна без реклами.
         */
        @JavascriptInterface
        public void showRewardedAd(final String kind) {
            runOnUiThread(() ->
                web.evaluateJavascript("window.grantAdReward('" + kind.replaceAll("[^a-z]", "") + "');", null));
        }
    }
}
