package com.hamsterkingdom.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun StatBar(
    label: String,
    emoji: String,
    value: Float,
    maxValue: Float = 100f,
    modifier: Modifier = Modifier,
    colorLow: Color = Color(0xFFE53935),
    colorMid: Color = Color(0xFFFF9800),
    colorHigh: Color = Color(0xFF4CAF50)
) {
    val fraction = (value / maxValue).coerceIn(0f, 1f)
    val animatedFraction by animateFloatAsState(
        targetValue = fraction,
        animationSpec = tween(500),
        label = "statAnim"
    )
    val barColor = when {
        fraction < 0.3f -> colorLow
        fraction < 0.6f -> colorMid
        else -> colorHigh
    }

    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(emoji, fontSize = 14.sp, modifier = Modifier.width(24.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            label,
            fontSize = 10.sp,
            color = Color.White.copy(alpha = 0.7f),
            modifier = Modifier.width(60.dp),
            fontWeight = FontWeight.Medium
        )
        Spacer(Modifier.width(4.dp))
        Box(
            modifier = Modifier
                .weight(1f)
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color.White.copy(alpha = 0.1f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(animatedFraction)
                    .clip(RoundedCornerShape(4.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(barColor.copy(alpha = 0.8f), barColor)
                        )
                    )
            )
        }
        Spacer(Modifier.width(6.dp))
        Text(
            "${value.toInt()}",
            fontSize = 10.sp,
            color = barColor,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(26.dp)
        )
    }
}

@Composable
fun XpBar(current: Long, max: Long, level: Int, modifier: Modifier = Modifier) {
    val fraction = (current.toFloat() / max.toFloat()).coerceIn(0f, 1f)
    val animated by animateFloatAsState(fraction, animationSpec = tween(600), label = "xp")

    Column(modifier = modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("⭐ Lv.$level", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFD700))
            Spacer(Modifier.weight(1f))
            Text("$current / $max XP", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f))
        }
        Spacer(Modifier.height(3.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(Color.White.copy(alpha = 0.1f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(animated)
                    .clip(RoundedCornerShape(3.dp))
                    .background(Brush.horizontalGradient(listOf(Color(0xFFFFD700), Color(0xFFFF9800))))
            )
        }
    }
}
