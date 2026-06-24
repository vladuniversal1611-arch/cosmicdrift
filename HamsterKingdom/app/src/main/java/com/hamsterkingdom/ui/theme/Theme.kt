package com.hamsterkingdom.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ── Colors ───────────────────────────────────────────────────────────────────
val HamsterOrange = Color(0xFFFF6B35)
val HamsterOrangeDark = Color(0xFFE55A2B)
val HamsterGold = Color(0xFFFFD700)
val HamsterBrown = Color(0xFF8B6914)
val HamsterCream = Color(0xFFF4C87E)
val HamsterPink = Color(0xFFF9A8C9)
val HamsterPurple = Color(0xFF6A0DAD)
val HamsterPurpleDark = Color(0xFF4A0080)
val HamsterBlueDark = Color(0xFF1A0A2E)
val HamsterBlueDeep = Color(0xFF0D0520)
val HamsterGreen = Color(0xFF4CAF50)
val HamsterRed = Color(0xFFE53935)
val HamsterCrystal = Color(0xFF00BCD4)

val CheeseYellow = Color(0xFFFFEB3B)
val CoinGold = Color(0xFFFFC107)
val CrystalBlue = Color(0xFF29B6F6)

// Rarity colors
val ColorCommon = Color(0xFF9E9E9E)
val ColorUncommon = Color(0xFF4CAF50)
val ColorRare = Color(0xFF2196F3)
val ColorEpic = Color(0xFF9C27B0)
val ColorLegendary = Color(0xFFFF9800)

private val DarkColorScheme = darkColorScheme(
    primary = HamsterOrange,
    onPrimary = Color.White,
    primaryContainer = HamsterOrangeDark,
    secondary = HamsterGold,
    onSecondary = HamsterBrown,
    background = HamsterBlueDark,
    onBackground = Color.White,
    surface = Color(0xFF2A1A4E),
    onSurface = Color.White,
    surfaceVariant = Color(0xFF3A2A5E),
    error = HamsterRed
)

@Composable
fun HamsterKingdomTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(
            headlineLarge = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
                color = HamsterGold
            ),
            headlineMedium = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            ),
            titleLarge = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.SemiBold,
                fontSize = 18.sp
            ),
            titleMedium = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Medium,
                fontSize = 15.sp
            ),
            bodyLarge = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Normal,
                fontSize = 14.sp
            ),
            bodySmall = TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Normal,
                fontSize = 11.sp
            )
        ),
        content = content
    )
}
