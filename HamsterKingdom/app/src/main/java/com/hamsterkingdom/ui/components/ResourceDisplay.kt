package com.hamsterkingdom.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.data.models.Resources
import com.hamsterkingdom.ui.theme.*

@Composable
fun ResourceBar(resources: Resources, cheesePerSec: Float, coinsPerSec: Float, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Brush.horizontalGradient(listOf(Color(0xFF2A1A4E), Color(0xFF3A2060))), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        ResourceChip("🧀", formatNumber(resources.cheese), "+${formatNumber(cheesePerSec.toLong())}/s", CheeseYellow)
        ResourceChip("💰", formatNumber(resources.coins), if (coinsPerSec > 0) "+${formatNumber(coinsPerSec.toLong())}/s" else null, CoinGold)
        ResourceChip("💎", formatNumber(resources.crystals), null, CrystalBlue)
        ResourceChip("🥕", formatNumber(resources.carrots), null, Color(0xFFFF7043))
    }
}

@Composable
fun ResourceChip(emoji: String, amount: String, rate: String?, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 14.sp)
            Spacer(Modifier.width(3.dp))
            Text(amount, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
        }
        if (rate != null) {
            Text(rate, fontSize = 9.sp, color = color.copy(alpha = 0.7f))
        }
    }
}

fun formatNumber(n: Long): String = when {
    n >= 1_000_000_000L -> "%.1fB".format(n / 1_000_000_000.0)
    n >= 1_000_000L -> "%.1fM".format(n / 1_000_000.0)
    n >= 1_000L -> "%.1fK".format(n / 1_000.0)
    else -> n.toString()
}

@Composable
fun FloatingNotification(message: String?, onDismiss: () -> Unit) {
    AnimatedVisibility(
        visible = message != null,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut()
    ) {
        if (message != null) {
            LaunchedEffect(message) {
                kotlinx.coroutines.delay(2000)
                onDismiss()
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .background(
                        Brush.horizontalGradient(listOf(HamsterOrange, HamsterOrangeDark)),
                        RoundedCornerShape(24.dp)
                    )
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(message, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}
