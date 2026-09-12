package com.hamsterkingdom.ui.minigames

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel
import kotlinx.coroutines.delay
import kotlin.math.*
import kotlin.random.Random

data class WheelPrize(val emoji: String, val label: String, val cheese: Long = 0, val coins: Long = 0, val crystals: Long = 0, val color: Color)

val WHEEL_PRIZES = listOf(
    WheelPrize("🧀", "50 Cheese", cheese = 50, color = Color(0xFFFFEB3B)),
    WheelPrize("💰", "30 Coins", coins = 30, color = Color(0xFFFF9800)),
    WheelPrize("🧀", "200 Cheese", cheese = 200, color = Color(0xFFFFC107)),
    WheelPrize("💎", "2 Crystals", crystals = 2, color = Color(0xFF29B6F6)),
    WheelPrize("💰", "100 Coins", coins = 100, color = Color(0xFFFFA726)),
    WheelPrize("🧀", "500 Cheese", cheese = 500, color = Color(0xFFFFEE58)),
    WheelPrize("💰", "500 Coins", coins = 500, color = Color(0xFFFFB300)),
    WheelPrize("💎", "5 Crystals", crystals = 5, color = Color(0xFF0288D1)),
    WheelPrize("🎁", "Mystery", cheese = 100, coins = 50, color = Color(0xFF9C27B0)),
    WheelPrize("🧀", "1000 Cheese", cheese = 1000, color = Color(0xFFFF6F00))
)

@Composable
fun WheelSpinScreen(vm: GameViewModel, onBack: () -> Unit) {
    val state by vm.state.collectAsState()
    var rotation by remember { mutableStateOf(0f) }
    var isSpinning by remember { mutableStateOf(false) }
    var wonPrize by remember { mutableStateOf<WheelPrize?>(null) }
    var spinsToday by remember { mutableStateOf(0) }
    val maxSpinsPerDay = 3
    val canSpin = spinsToday < maxSpinsPerDay && !isSpinning

    val animatedRotation by animateFloatAsState(
        targetValue = rotation,
        animationSpec = tween(3000, easing = FastOutSlowInEasing),
        finishedListener = {
            isSpinning = false
            val sliceAngle = 360f / WHEEL_PRIZES.size
            val normalizedAngle = ((360f - (rotation % 360f)) + sliceAngle / 2) % 360f
            val prizeIndex = (normalizedAngle / sliceAngle).toInt().coerceIn(0, WHEEL_PRIZES.size - 1)
            wonPrize = WHEEL_PRIZES[prizeIndex]
        },
        label = "wheelRotation"
    )

    val textMeasurer = rememberTextMeasurer()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF2A0050)))),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Text("←", fontSize = 20.sp, color = Color.White) }
            Text("🎡 Wheel of Fortune", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.White)
        }

        Text(
            "Spin: $spinsToday / $maxSpinsPerDay today",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.7f)
        )
        Spacer(Modifier.height(16.dp))

        // Wheel
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(300.dp)) {
            Canvas(modifier = Modifier.size(280.dp)) {
                rotate(animatedRotation) {
                    drawWheel(WHEEL_PRIZES, size)
                }
                // Pointer
                drawPointer(size)
            }
        }
        Spacer(Modifier.height(24.dp))

        // Win display
        wonPrize?.let { prize ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1A4E)),
                modifier = Modifier.padding(horizontal = 32.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(prize.emoji, fontSize = 40.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("You won: ${prize.label}!", fontWeight = FontWeight.Bold, color = HamsterGold, fontSize = 16.sp)
                    if (prize.cheese > 0) Text("🧀 +${prize.cheese}", color = CheeseYellow, fontWeight = FontWeight.Bold)
                    if (prize.coins > 0) Text("💰 +${prize.coins}", color = CoinGold, fontWeight = FontWeight.Bold)
                    if (prize.crystals > 0) Text("💎 +${prize.crystals}", color = CrystalBlue, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            vm.addMinigameReward(prize.cheese, prize.coins, prize.crystals)
                            vm.recordWheelSpin()
                            wonPrize = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange),
                        shape = RoundedCornerShape(12.dp)
                    ) { Text("Collect! 🎉", fontWeight = FontWeight.Bold) }
                }
            }
            Spacer(Modifier.height(16.dp))
        }

        if (wonPrize == null) {
            Button(
                onClick = {
                    if (canSpin) {
                        isSpinning = true
                        wonPrize = null
                        rotation += 360f * (5 + Random.nextInt(5)) + Random.nextFloat() * 360f
                        spinsToday++
                    }
                },
                enabled = canSpin,
                modifier = Modifier.fillMaxWidth(0.6f).height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (canSpin) HamsterOrange else Color(0xFF444444),
                    disabledContainerColor = Color(0xFF333333)
                )
            ) {
                Text(
                    if (!canSpin && !isSpinning) "Come back tomorrow!" else if (isSpinning) "Spinning..." else "SPIN! 🎡",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp
                )
            }
        }

        Spacer(Modifier.height(12.dp))
        Text(
            "Free spins reset daily",
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.4f)
        )
        Spacer(Modifier.height(80.dp))
    }
}

private fun DrawScope.drawWheel(prizes: List<WheelPrize>, canvasSize: Size) {
    val cx = canvasSize.width / 2f
    val cy = canvasSize.height / 2f
    val r = minOf(cx, cy) * 0.95f
    val sliceAngle = 360f / prizes.size

    prizes.forEachIndexed { i, prize ->
        val startAngle = i * sliceAngle - 90f
        drawArc(prize.color, startAngle, sliceAngle - 1f, true, topLeft = Offset(cx - r, cy - r), size = Size(r * 2, r * 2))
    }

    // Center circle
    drawCircle(Color(0xFF1A0A2E), r * 0.18f, Offset(cx, cy))
    drawCircle(Color(0xFFFFD700), r * 0.12f, Offset(cx, cy))
    drawCircle(HamsterOrange, r * 0.07f, Offset(cx, cy))

    // Dots on edge
    prizes.forEachIndexed { i, _ ->
        val angle = (i * sliceAngle - 90f) * PI.toFloat() / 180f
        val dotX = cx + cos(angle) * (r * 0.92f)
        val dotY = cy + sin(angle) * (r * 0.92f)
        drawCircle(Color.White.copy(alpha = 0.8f), r * 0.025f, Offset(dotX, dotY))
    }
}

private fun DrawScope.drawPointer(canvasSize: Size) {
    val cx = canvasSize.width / 2f
    val pointerPath = Path().apply {
        moveTo(cx - 12f, 0f)
        lineTo(cx + 12f, 0f)
        lineTo(cx, 30f)
        close()
    }
    drawPath(pointerPath, Color(0xFFE53935))
    drawPath(pointerPath, Color.White, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f))
}
