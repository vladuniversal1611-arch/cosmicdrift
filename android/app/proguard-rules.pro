# JavaScript bridge methods are called by name from the WebView.
-keepclassmembers class com.hillrush.game.GameBridge$* {
    @android.webkit.JavascriptInterface <methods>;
}
