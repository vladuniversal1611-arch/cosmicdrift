package com.hamsterkingdom.ui.minigames

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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

data class Platform(val x: Float, val y: Float, val width: Float, val hasCheeseBonus: Boolean = false)
data class JumpState(
    val hamsterX: Float = 0.5f,
    val hamsterY: Float = 0.85f,
    val velocityX: Float = 0f,
    val velocityY: Float = 0f,
    val cameraY: Float = 0f,
    val floor: Int = 0,
    val score: Int = 0,
    val platforms: List<Platform> = emptyList(),
    val gameRunning: Boolean = false,
    val gameOver: Boolean = false
)

@Composable
fun HamsterJumpScreen(vm: GameViewModel, onBack: () -> Unit) {
    var gameState by remember { mutableStateOf(createInitialJumpState()) }
    var bestFloor by remember { mutableStateOf(0) }
    var tiltDirection by remember { mutableStateOf(0f) }

    LaunchedEffect(gameState.gameRunning) {
        if (!gameState.gameRunning) return@LaunchedEffect
        while (gameState.gameRunning) {
            delay(16L)
            gameState = tickJump(gameState, tiltDirection)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF4A1080)))),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Text("←", fontSize = 20.sp, color = Color.White) }
            Text("⬆️ Hamster Jump", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.White)
            Spacer(Modifier.weight(1f))
            Text("Best: Floor ${bestFloor}", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Text("⬆️ Floor ${gameState.floor}", fontWeight = FontWeight.Bold, color = Color.White)
            Text("🧀 ${gameState.score}", fontWeight = FontWeight.Bold, color = CheeseYellow)
        }
        Spacer(Modifier.height(8.dp))

        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = { offset ->
                            if (!gameState.gameRunning || gameState.gameOver) {
                                gameState = createInitialJumpState().copy(gameRunning = true)
                            } else {
                                tiltDirection = if (offset.x < size.width / 2) -1f else 1f
                            }
                        }
                    )
                }
        ) {
            drawJumpGame(gameState, size)
        }

        if (!gameState.gameRunning) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                if (gameState.gameOver) {
                    Text("You reached Floor ${gameState.floor}!", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                    LaunchedEffect(gameState.gameOver) {
                        if (gameState.floor > bestFloor) bestFloor = gameState.floor
                        vm.addMinigameReward(cheese = gameState.score.toLong() * 2, coins = gameState.floor.toLong(), xp = gameState.floor.toLong() * 5)
                    }
                } else {
                    Text("Tap left/right to move!", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                    Text("Jump on platforms to go higher!", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                }
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { gameState = createInitialJumpState().copy(gameRunning = true) },
                    colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(if (gameState.gameOver) "Play Again!" else "Start!", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { tiltDirection = -1f },
                    modifier = Modifier.size(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A1A4E))
                ) { Text("←", fontSize = 20.sp) }
                Button(
                    onClick = { tiltDirection = 1f },
                    modifier = Modifier.size(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A1A4E))
                ) { Text("→", fontSize = 20.sp) }
            }
        }
    }
}

private fun createInitialJumpState(): JumpState {
    val platforms = mutableListOf<Platform>()
    platforms.add(Platform(0.5f, 0.9f, 0.4f))
    var y = 0.7f
    while (y > -5f) {
        platforms.add(Platform(
            x = Random.nextFloat() * 0.6f + 0.2f,
            y = y,
            width = Random.nextFloat() * 0.15f + 0.18f,
            hasCheeseBonus = Random.nextFloat() < 0.3f
        ))
        y -= Random.nextFloat() * 0.12f + 0.08f
    }
    return JumpState(platforms = platforms, velocityY = -0.015f)
}

private fun tickJump(state: JumpState, tiltX: Float): JumpState {
    if (!state.gameRunning || state.gameOver) return state

    val gravity = 0.001f
    val horizontalAccel = 0.006f
    val maxVx = 0.025f

    var vx = (state.velocityX + tiltX * horizontalAccel).coerceIn(-maxVx, maxVx)
    vx *= 0.92f // friction

    val vy = state.velocityY + gravity
    var newX = (state.hamsterX + vx).let { if (it < 0f) 1f else if (it > 1f) 0f else it }
    var newY = state.hamsterY + vy

    val hamsterSize = 0.06f
    var newVY = vy
    var score = state.score
    var floor = state.floor

    // Platform collision (only when falling down)
    val platforms = state.platforms.toMutableList()
    if (vy > 0) {
        for (platform in platforms) {
            val platTop = platform.y - state.cameraY
            val platLeft = platform.x - platform.width / 2
            val platRight = platform.x + platform.width / 2
            if (newX in (platLeft - hamsterSize)..(platRight + hamsterSize) &&
                newY >= platTop - 0.01f && newY <= platTop + 0.05f) {
                newY = platTop
                newVY = -0.022f
                if (platform.hasCheeseBonus) { score++ }
                val floorNum = (state.cameraY * 10 + 1).toInt()
                if (floorNum > floor) floor = floorNum
                break
            }
        }
    }

    // Camera scroll
    var cameraY = state.cameraY
    if (newY - state.cameraY < 0.4f) {
        cameraY = newY - 0.4f
    }

    // Game over if fallen below screen
    val gameOver = newY - cameraY > 1.1f

    return state.copy(
        hamsterX = newX,
        hamsterY = newY,
        velocityX = vx,
        velocityY = newVY,
        cameraY = cameraY,
        floor = floor,
        score = score,
        gameOver = gameOver,
        gameRunning = !gameOver,
        platforms = platforms
    )
}

private fun DrawScope.drawJumpGame(state: JumpState, canvasSize: Size) {
    val w = canvasSize.width
    val h = canvasSize.height

    // Background
    drawRect(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF4A1080))))

    // Stars
    listOf(0.1f to 0.1f, 0.3f to 0.3f, 0.7f to 0.15f, 0.9f to 0.4f, 0.5f to 0.05f,
        0.15f to 0.5f, 0.8f to 0.6f, 0.4f to 0.7f).forEach { (sx, sy) ->
        val screenY = sy - (state.cameraY % 1f)
        if (screenY in 0f..1f) drawCircle(Color.White.copy(alpha = 0.4f), 2f, Offset(sx * w, screenY * h))
    }

    // Platforms
    state.platforms.forEach { platform ->
        val screenY = platform.y - state.cameraY
        if (screenY in -0.1f..1.1f) {
            val px = (platform.x - platform.width / 2) * w
            val py = screenY * h
            val pw = platform.width * w
            drawRoundRect(
                Color(0xFF4A1480),
                topLeft = Offset(px, py),
                size = Size(pw, h * 0.025f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(8f)
            )
            drawRoundRect(
                Color(0xFF7B1FA2),
                topLeft = Offset(px, py),
                size = Size(pw, h * 0.012f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(6f)
            )
            if (platform.hasCheeseBonus) {
                drawCircle(CheeseYellow, h * 0.018f, Offset(platform.x * w, py - h * 0.03f))
            }
        }
    }

    // Hamster
    val hx = state.hamsterX * w
    val hy = (state.hamsterY - state.cameraY) * h
    val r = w * 0.04f
    drawCircle(Color(0xFFF4C87E), r, Offset(hx, hy))
    drawCircle(Color(0xFF3D2B1F), r * 0.2f, Offset(hx + r * 0.3f, hy - r * 0.2f))
    drawCircle(Color.White, r * 0.08f, Offset(hx + r * 0.35f, hy - r * 0.25f))
}
