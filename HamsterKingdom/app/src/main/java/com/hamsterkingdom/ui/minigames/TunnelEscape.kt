package com.hamsterkingdom.ui.minigames

import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel
import kotlinx.coroutines.delay
import kotlin.random.Random

data class TunnelEscapeState(
    val hamsterLane: Int = 1,
    val moleX: Float = -0.3f,
    val obstacles: List<TunnelObstacle> = emptyList(),
    val cheeses: List<Float> = emptyList(),
    val score: Int = 0,
    val distance: Int = 0,
    val speed: Float = 0.006f,
    val gameRunning: Boolean = false,
    val gameOver: Boolean = false,
    val win: Boolean = false
)

data class TunnelObstacle(val lane: Int, val x: Float)

private const val TOTAL_LANES = 3
private const val WIN_DISTANCE = 1000

@Composable
fun TunnelEscapeScreen(vm: GameViewModel, onBack: () -> Unit) {
    var gameState by remember { mutableStateOf(TunnelEscapeState()) }
    var wins by remember { mutableStateOf(0) }

    LaunchedEffect(gameState.gameRunning) {
        if (!gameState.gameRunning) return@LaunchedEffect
        while (gameState.gameRunning) {
            delay(16L)
            gameState = tickTunnelEscape(gameState)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF3E2000), Color(0xFF1A0A00)))),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Text("←", fontSize = 20.sp, color = Color.White) }
            Text("🕳️ Tunnel Escape", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.White)
            Spacer(Modifier.weight(1f))
            Text("Wins: $wins", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Text("🏃 ${gameState.distance}m", fontWeight = FontWeight.Bold, color = Color.White)
            Text("🧀 ${gameState.score}", fontWeight = FontWeight.Bold, color = CheeseYellow)
            Text("🎯 ${WIN_DISTANCE - gameState.distance}m left", fontSize = 12.sp, color = HamsterGreen)
        }
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { gameState.distance.toFloat() / WIN_DISTANCE },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(6.dp),
            color = HamsterGreen,
            trackColor = Color.White.copy(alpha = 0.1f)
        )
        Spacer(Modifier.height(8.dp))

        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        if (!gameState.gameRunning || gameState.gameOver || gameState.win) {
                            gameState = TunnelEscapeState(gameRunning = true)
                        } else {
                            val newLane = if (offset.x < size.width / 2)
                                (gameState.hamsterLane - 1).coerceAtLeast(0)
                            else
                                (gameState.hamsterLane + 1).coerceAtMost(TOTAL_LANES - 1)
                            gameState = gameState.copy(hamsterLane = newLane)
                        }
                    }
                }
        ) {
            drawTunnelEscape(gameState, size)
        }

        // Controls
        if (!gameState.gameRunning) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                when {
                    gameState.win -> {
                        Text("🎉 You Escaped!", fontWeight = FontWeight.ExtraBold, color = HamsterGold, fontSize = 18.sp)
                        LaunchedEffect(gameState.win) {
                            wins++
                            vm.addMinigameReward(cheese = gameState.score.toLong() * 5 + 200L, coins = 100L, xp = 200L)
                        }
                    }
                    gameState.gameOver -> {
                        Text("💥 The mole got you!", fontWeight = FontWeight.Bold, color = HamsterRed, fontSize = 16.sp)
                        LaunchedEffect(gameState.gameOver) {
                            vm.addMinigameReward(cheese = gameState.score.toLong())
                        }
                    }
                    else -> {
                        Text("Escape from the mole!", fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
                        Text("Tap left/right to switch lanes", fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f))
                    }
                }
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { gameState = TunnelEscapeState(gameRunning = true) },
                    colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange),
                    shape = RoundedCornerShape(16.dp)
                ) { Text(if (gameState.gameOver || gameState.win) "Play Again!" else "Start!", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { gameState = gameState.copy(hamsterLane = (gameState.hamsterLane - 1).coerceAtLeast(0)) },
                    modifier = Modifier.size(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3E2000))
                ) { Text("←", fontSize = 20.sp) }
                Button(
                    onClick = { gameState = gameState.copy(hamsterLane = (gameState.hamsterLane + 1).coerceAtMost(TOTAL_LANES - 1)) },
                    modifier = Modifier.size(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3E2000))
                ) { Text("→", fontSize = 20.sp) }
            }
        }
    }
}

private fun tickTunnelEscape(state: TunnelEscapeState): TunnelEscapeState {
    if (!state.gameRunning || state.gameOver || state.win) return state

    val speed = state.speed + 0.000005f
    val moleX = state.moleX + speed * 0.8f
    val distance = state.distance + 1
    var score = state.score

    // Move obstacles
    var obstacles = state.obstacles.map { it.copy(x = it.x - speed) }.filter { it.x > -0.1f }
    if (obstacles.isEmpty() || obstacles.last().x < 0.5f) {
        if (Random.nextFloat() < 0.4f) {
            obstacles = obstacles + TunnelObstacle(Random.nextInt(TOTAL_LANES), 1.1f)
        }
    }

    // Cheeses
    var cheeses = state.cheeses.map { it - speed }.filter { it > -0.05f }
    if (Random.nextFloat() < 0.015f) cheeses = cheeses + 1.1f

    val hamsterScreenX = 0.2f + state.hamsterLane * 0.28f

    // Collect cheese
    val collectedCheese = cheeses.filter { cx ->
        kotlin.math.abs(cx - hamsterScreenX) < 0.08f
    }
    if (collectedCheese.isNotEmpty()) score += collectedCheese.size
    val finalCheeses = cheeses.filter { cx -> collectedCheese.none { it == cx } }

    // Check obstacle collision
    val hitObstacle = obstacles.any { obs ->
        obs.lane == state.hamsterLane && kotlin.math.abs(obs.x - hamsterScreenX) < 0.07f
    }

    // Check mole catch
    val moleCaught = moleX >= hamsterScreenX - 0.1f

    val gameOver = hitObstacle || moleCaught
    val win = distance >= WIN_DISTANCE

    return state.copy(
        moleX = moleX,
        obstacles = obstacles,
        cheeses = finalCheeses,
        score = score,
        distance = distance / 6,
        speed = speed,
        gameOver = gameOver && !win,
        win = win,
        gameRunning = !gameOver && !win
    )
}

private fun DrawScope.drawTunnelEscape(state: TunnelEscapeState, canvasSize: Size) {
    val w = canvasSize.width
    val h = canvasSize.height

    // Tunnel background
    drawRect(Color(0xFF2E1500))
    val laneH = h / TOTAL_LANES

    // Lanes
    repeat(TOTAL_LANES) { lane ->
        val laneY = lane * laneH
        val laneColor = if (lane % 2 == 0) Color(0xFF3E2000) else Color(0xFF2E1500)
        drawRect(laneColor, topLeft = Offset(0f, laneY), size = Size(w, laneH))
        // Lane border
        drawRect(Color(0xFF5D3A1A).copy(alpha = 0.5f), topLeft = Offset(0f, laneY + laneH - 2f), size = Size(w, 2f))
    }

    // Tunnel walls
    drawRect(Color(0xFF1A0A00), topLeft = Offset(0f, 0f), size = Size(w, h * 0.06f))
    drawRect(Color(0xFF1A0A00), topLeft = Offset(0f, h * 0.94f), size = Size(w, h * 0.06f))

    // Obstacles (rocks)
    state.obstacles.forEach { obs ->
        val cx = obs.x * w
        val cy = (obs.lane + 0.5f) * laneH
        drawCircle(Color(0xFF5D3A1A), laneH * 0.28f, Offset(cx, cy))
        drawCircle(Color(0xFF795548), laneH * 0.2f, Offset(cx - laneH * 0.05f, cy - laneH * 0.05f))
    }

    // Cheese
    state.cheeses.forEach { cx ->
        repeat(TOTAL_LANES) { lane ->
            if (Random.nextFloat() < 0.3f) {
                val cy = (lane + 0.5f) * laneH
                drawCircle(CheeseYellow, laneH * 0.18f, Offset(cx * w, cy))
            }
        }
    }

    // Hamster
    val hLane = state.hamsterLane
    val hx = 0.2f * w
    val hy = (hLane + 0.5f) * laneH
    val hr = laneH * 0.3f
    drawCircle(Color(0xFFF4C87E), hr, Offset(hx, hy))
    drawCircle(Color(0xFF3D2B1F), hr * 0.2f, Offset(hx + hr * 0.4f, hy - hr * 0.1f))
    drawCircle(Color.White, hr * 0.08f, Offset(hx + hr * 0.45f, hy - hr * 0.15f))

    // Mole (chasing)
    val mx = state.moleX * w
    val moleY = (state.hamsterLane + 0.5f) * laneH
    drawCircle(Color(0xFF4A4A4A), hr * 1.1f, Offset(mx, moleY))
    drawCircle(Color(0xFF666666), hr * 0.7f, Offset(mx, moleY))
    drawCircle(Color(0xFFFF1744), hr * 0.2f, Offset(mx + hr * 0.3f, moleY - hr * 0.15f))
    drawCircle(Color(0xFFFF1744), hr * 0.2f, Offset(mx - hr * 0.3f, moleY - hr * 0.15f))
    // Mole claws
    drawLine(Color(0xFF222222), Offset(mx + hr * 0.8f, moleY - hr * 0.3f), Offset(mx + hr * 1.2f, moleY - hr * 0.1f), strokeWidth = 3f)
    drawLine(Color(0xFF222222), Offset(mx + hr * 0.8f, moleY), Offset(mx + hr * 1.3f, moleY + hr * 0.1f), strokeWidth = 3f)
}
