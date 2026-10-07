package com.hillrush.game;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

/**
 * JavaScript bridges used by hill_rush.html.
 *
 * Contract (see RELEASE.md):
 *   window.HillRushAds.isReady(type) -> boolean
 *   window.HillRushAds.show(type, requestId)  -> later window.onRewardAdResult(requestId, granted)
 *   window.HillRushBilling.available() -> boolean
 *   window.HillRushBilling.purchase(productId) -> later window.onPurchaseResult(productId, ok, token)
 *
 * Both report "not available" until a real SDK (e.g. Google Mobile Ads rewarded ads,
 * Google Play Billing) is integrated here. Nothing is faked: with these stubs the game
 * simply hides every ad and shop button.
 */
final class GameBridge {
    private GameBridge() { }

    static void js(Activity a, WebView w, String code) {
        a.runOnUiThread(() -> w.evaluateJavascript(code, null));
    }

    static final class Ads {
        private final Activity activity;
        private final WebView web;

        Ads(Activity activity, WebView web) { this.activity = activity; this.web = web; }

        @JavascriptInterface
        public boolean isReady(String type) {
            // TODO(ads): return true when a rewarded ad is loaded for this placement.
            return false;
        }

        @JavascriptInterface
        public void show(String type, String requestId) {
            // TODO(ads): show the rewarded ad and grant only in the "user earned reward" callback.
            deliver(requestId, false);
        }

        private void deliver(String requestId, boolean granted) {
            js(activity, web, "window.onRewardAdResult(" + JSONObject.quote(requestId) + "," + granted + ")");
        }
    }

    static final class Billing {
        private final Activity activity;
        private final WebView web;

        Billing(Activity activity, WebView web) { this.activity = activity; this.web = web; }

        @JavascriptInterface
        public boolean available() {
            // TODO(billing): true once BillingClient is connected and products are queried.
            return false;
        }

        @JavascriptInterface
        public void purchase(String productId) {
            // TODO(billing): launch the purchase flow; after Play confirms (and the purchase
            // is acknowledged/consumed) call window.onPurchaseResult(id, true, purchaseToken).
            js(activity, web, "window.onPurchaseResult(" + JSONObject.quote(productId) + ",false,null)");
        }
    }
}
