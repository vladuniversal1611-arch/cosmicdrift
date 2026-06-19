package com.dragoncollector.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

data class WheelSegment(val label: String, val emoji: String, val color: Color)

val WHEEL_SEGMENTS = listOf(
    WheelSegment("100 🪙", "🪙", Color(0xFFFFD700)),
    WheelSegment("300 🪙", "🪙", Color(0xFFDAA520)),
    WheelSegment("5 💎", "💎", Color(0xFF00E5FF)),
    WheelSegment("500 🪙", "🪙", Color(0xFFFFD700)),
    WheelSegment("15 💎", "💎", Color(0xFF00E5FF)),
    WheelSegment("30 ✨", "✨", Color(0xFFE040FB)),
    WheelSegment("1000 🪙", "🪙", Color(0xFFFFD700)),
    WheelSegment("50 💎", "💎", Color(0xFF00BCD4))
)

val DAILY_REWARDS = listOf(
    Triple("День 1", "200 🪙", "🪙"),
    Triple("День 2", "400 🪙", "🪙"),
    Triple("День 3", "600 🪙 + 5 💎", "💫"),
    Triple("День 4", "800 🪙", "🪙"),
    Triple("День 5", "1000 🪙 + ✨", "✨"),
    Triple("День 6", "500 🪙 + 15 💎", "💎"),
    Triple("День 7", "2000 🪙 + 30 💎", "🎁")
)

@Composable
fun DailyScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var isSpinning by remember { mutableStateOf(false) }
    var wheelRotation by remember { mutableStateOf(0f) }
    var spinResult by remember { mutableStateOf<Pair<String, Int>?>(null) }

    val animatedRotation by animateFloatAsState(
        targetValue = wheelRotation,
        animationSpec = tween(2500, easing = FastOutSlowInEasing),
        label = "wheel",
        finishedListener = { isSpinning = false }
    )

    val streakDay = ((uiState.gameState.dailyStreakDays % 7))
    val canClaimDaily = System.currentTimeMillis() - uiState.gameState.lastDailyRewardTime >= 24 * 60 * 60 * 1000L
    val canSpin = System.currentTimeMillis() - uiState.gameState.lastWheelSpinTime >= 24 * 60 * 60 * 1000L

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
            .verticalScroll(rememberScrollState())
    ) {
        Text("🎁 Щоденні Активності", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold,
            modifier = Modifier.padding(16.dp))

        // Daily reward calendar
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
            colors = CardDefaults.cardColors(containerColor = DragonCard),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📅 Щоденна Нагорода", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                Text("Серія: ${uiState.gameState.dailyStreakDays} днів 🔥",
                    fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                Spacer(Modifier.height(12.dp))
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DAILY_REWARDS.forEachIndexed { index, (day, reward, emoji) ->
                        DailyRewardDay(
                            day = day, reward = reward, emoji = emoji,
                            isCurrent = index == streakDay,
                            isClaimed = index < streakDay
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { viewModel.claimDailyReward() },
                    enabled = canClaimDaily,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = DragonGold,
                        contentColor = DragonDark,
                        disabledContainerColor = DragonCard
                    )
                ) {
                    Text(if (canClaimDaily) "🎁 Забрати Нагороду!" else "✅ Вже Отримано",
                        fontWeight = FontWeight.Bold)
                }
            }
        }

        // Wheel of fortune
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
            colors = CardDefaults.cardColors(containerColor = DragonCard),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("🎡 Колесо Удачі", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                Spacer(Modifier.height(12.dp))

                // Simple wheel visual
                WheelVisual(rotation = animatedRotation)

                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        if (!isSpinning && canSpin) {
                            isSpinning = true
                            wheelRotation += 720f + (0..360).random()
                            viewModel.spinWheel()
                        }
                    },
                    enabled = !isSpinning && canSpin,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = DragonPurpleLight,
                        disabledContainerColor = DragonCard
                    )
                ) {
                    Text(
                        when {
                            isSpinning -> "🎡 Крутиться..."
                            canSpin -> "🎡 Крутити!"
                            else -> "✅ Вже Крутив Сьогодні"
                        },
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Stats
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
            colors = CardDefaults.cardColors(containerColor = DragonCard),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📊 Статистика", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                Spacer(Modifier.height(8.dp))
                StatRow("Драконів зібрано", "${uiState.ownedDragons.size}")
                StatRow("Експедицій завершено", "${uiState.gameState.totalExpeditionsCompleted}")
                StatRow("Злиттів", "${uiState.gameState.totalMerges}")
                StatRow("Перемог на арені", "${uiState.gameState.totalArenaWins}")
                StatRow("Рівень острова", "${uiState.gameState.islandLevel}")
            }
        }

        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun DailyRewardDay(day: String, reward: String, emoji: String, isCurrent: Boolean, isClaimed: Boolean) {
    Column(
        modifier = Modifier
            .width(70.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(
                when {
                    isClaimed -> Color(0xFF1B3A1B)
                    isCurrent -> DragonPurple.copy(alpha = 0.7f)
                    else -> DragonCardLight
                }
            )
            .border(
                1.5.dp,
                when {
                    isClaimed -> Color(0xFF4CAF50)
                    isCurrent -> DragonGold
                    else -> Color.Transparent
                },
                RoundedCornerShape(10.dp)
            )
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(if (isClaimed) "✅" else emoji, fontSize = 20.sp)
        Spacer(Modifier.height(4.dp))
        Text(day, fontSize = 10.sp, color = if (isCurrent) DragonGold else Color.White.copy(alpha = 0.7f),
            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal, textAlign = TextAlign.Center)
        Text(reward, fontSize = 9.sp, color = Color.White.copy(alpha = 0.6f), textAlign = TextAlign.Center)
    }
}

@Composable
fun WheelVisual(rotation: Float) {
    Box(
        modifier = Modifier.size(200.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(200.dp).rotate(rotation)) {
            val cx = size.width / 2
            val cy = size.height / 2
            val r = size.width / 2 - 8f
            val segmentAngle = 360f / WHEEL_SEGMENTS.size

            WHEEL_SEGMENTS.forEachIndexed { i, segment ->
                val startAngle = i * segmentAngle - 90f
                drawArc(
                    color = segment.color,
                    startAngle = startAngle,
                    sweepAngle = segmentAngle - 2f,
                    useCenter = true,
                    topLeft = androidx.compose.ui.geometry.Offset(8f, 8f),
                    size = androidx.compose.ui.geometry.Size(r * 2, r * 2)
                )
            }
            drawCircle(color = Color(0xFF1A0A2E), radius = 20f, center = androidx.compose.ui.geometry.Offset(cx, cy))
        }
        // Pointer
        Text("▼", fontSize = 24.sp, color = Color.White,
            modifier = Modifier.align(Alignment.TopCenter).offset(y = 2.dp))
    }
}

@Composable
fun StatRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 13.sp)
        Text(value, color = DragonGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

