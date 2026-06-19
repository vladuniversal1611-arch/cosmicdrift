package com.dragoncollector.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = DragonPurpleLight,
    onPrimary = Color.White,
    primaryContainer = DragonPurple,
    onPrimaryContainer = Color.White,
    secondary = DragonGold,
    onSecondary = DragonDark,
    secondaryContainer = DragonGoldDark,
    onSecondaryContainer = DragonDark,
    tertiary = GemColor,
    background = DragonDarker,
    onBackground = Color.White,
    surface = DragonDark,
    onSurface = Color.White,
    surfaceVariant = DragonCard,
    onSurfaceVariant = Color(0xFFE0D0FF),
    outline = DragonPurple,
    error = Color(0xFFCF6679)
)

@Composable
fun DragonCollectorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
