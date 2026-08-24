package com.skydoku.game;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Skydoku host activity.
 *
 * Beyond the default Capacitor bridge we force a true full-screen "immersive"
 * experience: the status bar (top notification shade) and navigation bar are
 * hidden and the game draws edge to edge. Android likes to re-show the bars on
 * focus changes and after a swipe, so we re-apply the immersive flags in
 * onResume() and onWindowFocusChanged() to keep the shade hidden.
 */
public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Let the WebView draw under the system bars (edge-to-edge).
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    hideSystemBars();
  }

  @Override
  public void onResume() {
    super.onResume();
    hideSystemBars();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) hideSystemBars();
  }

  /** Hide status + navigation bars; a swipe reveals them transiently, then they auto-hide. */
  private void hideSystemBars() {
    // Keep the screen awake while playing.
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    final View decor = getWindow().getDecorView();
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), decor);
    if (controller != null) {
      controller.hide(WindowInsetsCompat.Type.systemBars());
      controller.setSystemBarsBehavior(
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
  }
}
