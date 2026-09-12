package com.hamsterkingdom

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat
import com.hamsterkingdom.ui.HamsterKingdomNavigation
import com.hamsterkingdom.ui.theme.HamsterKingdomTheme
import com.hamsterkingdom.viewmodel.GameViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Full-screen immersive mode
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            HamsterKingdomTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF1A0A2E)
                ) {
                    HamsterKingdomNavigation(viewModel)
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // ViewModel saves on cleared, but also explicitly save on pause
    }
}
