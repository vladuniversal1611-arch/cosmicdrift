package com.hamsterkingdom.ui.minigames

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.*
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

private const val GAME_WIDTH = 1f
private const val HAMSTER_X = 0.15f
private const val HAMSTER_SIZE = 0.08f
private const val OBSTACLE_WIDTH = 0.06f
private const val OBSTACLE_HEIGHT = 0.12f
private const val CHEESE_SIZE = 0.05f
private const val GRAVITY = 0.015f
private const val JUMP_FORCE = -0.22f
private const val GROUND_Y = 0.82f

data class CheeseDashState(
    val hamsterY: Float = GROUND_Y,
    val velocityY: Float = 0f,
    val isOnGround: Boolean = true,
    val obstacles: List<Obstacle> = emptyList(),
    val cheeses: List<CheeseItem> = emptyList(),
    val score: Int = 0,
    val distance: Int = 0,
    val speed: Float = 0.008f,
    val gameRunning: Boolean = false,
    val gameOver: Boolean = false,
    val lives: Int = 3,
    val isDoubleJump: Boolean = false
)

data class Obstacle(val x: Float, val height: Float = OBSTACLE_HEIGHT)
data class CheeseItem(val x: Float, val y: Float, val collected: Boolean = false)

@Composable
fun CheeseDashScreen(vm: GameViewModel, onBack: () -> Unit) {
    var gameState by remember { mutableStateOf(CheeseDashState()) }
    var bestScore by remember { mutableStateOf(0) }

    LaunchedEffect(gameState.gameRunning) {
        if (!gameState.gameRunning) return@LaunchedEffect
        while (gameState.gameRunning && !gameState.gameOver) {
            delay(16L)
            gameState = tickCheeseDash(gameState)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF87CEEB), Color(0xFF4FC3F7)))),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Text("←", fontSize = 20.sp, color = Color.White)
            }
            Text("🧀 Cheese Dash", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.White)
            Spacer(Modifier.weight(1f))
            Text("Best: $bestScore", fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
        }

        // Score bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Text("🏃 ${gameState.distance}m", fontWeight = FontWeight.Bold, color = Color.White)
            Text("🧀 ${gameState.score}", fontWeight = FontWeight.Bold, color = CheeseYellow)
            Row { repeat(3) { i -> Text(if (i < gameState.lives) "❤️" else "🖤", fontSize = 14.sp) } }
        }
        Spacer(Modifier.height(8.dp))

        // Game canvas
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .pointerInput(Unit) {
                    detectTapGestures {
                        if (!gameState.gameRunning || gameState.gameOver) {
                            gameState = CheeseDashState(gameRunning = true)
                        } else if (gameState.isOnGround) {
                            gameState = gameState.copy(velocityY = JUMP_FORCE, isOnGround = false)
                        } else if (!gameState.isDoubleJump) {
                            gameState = gameState.copy(velocityY = JUMP_FORCE * 0.8f, isDoubleJump = true)
                        }
                    }
                }
        ) {
            drawCheeseDash(gameState, size)
        }

        // Controls hint
        if (!gameState.gameRunning) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                if (gameState.gameOver) {
                    Text("Game Over! Score: ${gameState.score}", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                    LaunchedEffect(gameState.gameOver) {
                        if (gameState.score > bestScore) {
                            bestScore = gameState.score
                            vm.addMinigameReward(cheese = gameState.score.toLong(), coins = gameState.score / 10L, xp = gameState.score.toLong())
                        }
                    }
                }
                Button(
                    onClick = { gameState = CheeseDashState(gameRunning = true) },
                    colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    Text(if (gameState.gameOver) "Play Again!" else "Tap to Start!", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                if (!gameState.gameOver) {
                    Spacer(Modifier.height(8.dp))
                    Text("Tap to jump! Double-tap for double jump!", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                    Text("Collect 🧀 and avoid obstacles!", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                }
            }
        } else {
            Spacer(Modifier.height(16.dp))
            Text("Tap to jump!", fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
            Spacer(Modifier.height(16.dp))
        }
    }
}

private fun tickCheeseDash(state: CheeseDashState): CheeseDashState {
    if (!state.gameRunning || state.gameOver) return state

    // Physics
    var newVY = state.velocityY + GRAVITY
    var newY = state.hamsterY + newVY
    var onGround = false
    var isDoubleJump = state.isDoubleJump

    if (newY >= GROUND_Y) {
        newY = GROUND_Y
        newVY = 0f
        onGround = true
        isDoubleJump = false
    }

    val speed = state.speed + 0.000008f

    // Move obstacles
    var obstacles = state.obstacles.map { it.copy(x = it.x - speed) }.filter { it.x > -0.1f }
    if (obstacles.isEmpty() || obstacles.last().x < 0.7f) {
        if (Random.nextFloat() < 0.6f) obstacles = obstacles + Obstacle(1.05f, OBSTACLE_HEIGHT * (0.8f + Random.nextFloat() * 0.5f))
    }

    // Move cheeses
    var cheeses = state.cheeses.map { it.copy(x = it.x - speed) }.filter { it.x > -0.05f && !it.collected }
    if (Random.nextFloat() < 0.02f) {
        cheeses = cheeses + CheeseItem(1.05f, GROUND_Y - CHEESE_SIZE - Random.nextFloat() * 0.3f)
    }

    var score = state.score
    var lives = state.lives

    // Collect cheese
    val hamsterRect = Rect(HAMSTER_X - HAMSTER_SIZE / 2, newY - HAMSTER_SIZE, HAMSTER_X + HAMSTER_SIZE / 2, newY)
    val finalCheeses = cheeses.map { cheese ->
        val cheeseRect = Rect(cheese.x - CHEESE_SIZE / 2, cheese.y - CHEESE_SIZE, cheese.x + CHEESE_SIZE / 2, cheese.y)
        if (hamsterRect.overlaps(cheeseRect)) { score++; cheese.copy(collected = true) } else cheese
    }.filter { !it.collected }

    // Check obstacle collision
    var gameOver = false
    for (obs in obstacles) {
        val obsRect = Rect(obs.x - OBSTACLE_WIDTH / 2, GROUND_Y - obs.height, obs.x + OBSTACLE_WIDTH / 2, GROUND_Y)
        if (hamsterRect.overlaps(obsRect)) {
            lives--
            if (lives <= 0) { gameOver = true; break }
            obstacles = obstacles.filter { it !== obs }
            break
        }
    }

    val distance = state.distance + 1

    return state.copy(
        hamsterY = newY,
        velocityY = newVY,
        isOnGround = onGround,
        isDoubleJump = isDoubleJump,
        obstacles = obstacles,
        cheeses = finalCheeses,
        score = score,
        distance = distance / 6,
        speed = speed,
        gameOver = gameOver,
        gameRunning = !gameOver,
        lives = lives
    )
}

private fun DrawScope.drawCheeseDash(state: CheeseDashState, canvasSize: Size) {
    val w = canvasSize.width
    val h = canvasSize.height

    // Sky gradient
    drawRect(Brush.verticalGradient(listOf(Color(0xFF87CEEB), Color(0xFFB3E5FC))))

    // Ground
    drawRect(Color(0xFF8B6914), topLeft = Offset(0f, GROUND_Y * h), size = Size(w, h * (1f - GROUND_Y) + 20f))
    drawRect(Color(0xFF4CAF50), topLeft = Offset(0f, GROUND_Y * h - 6f), size = Size(w, 8f))

    // Clouds
    drawCloudAt(w * 0.2f, h * 0.1f, w * 0.08f)
    drawCloudAt(w * 0.6f, h * 0.06f, w * 0.1f)
    drawCloudAt(w * 0.85f, h * 0.14f, w * 0.07f)

    // Hamster
    drawHamsterSprite(HAMSTER_X * w, state.hamsterY * h, HAMSTER_SIZE * w, state.isOnGround)

    // Obstacles (cacti-style)
    state.obstacles.forEach { obs ->
        val ox = obs.x * w
        val oh = obs.height * h
        val gy = GROUND_Y * h
        drawRect(Color(0xFF795548), topLeft = Offset(ox - OBSTACLE_WIDTH * w / 2, gy - oh), size = Size(OBSTACLE_WIDTH * w, oh))
        drawRect(Color(0xFFA1887F), topLeft = Offset(ox - OBSTACLE_WIDTH * w / 2, gy - oh), size = Size(OBSTACLE_WIDTH * w * 0.3f, oh))
    }

    // Cheeses
    state.cheeses.forEach { cheese ->
        drawCircle(CheeseYellow, CHEESE_SIZE * w * 0.5f, Offset(cheese.x * w, cheese.y * h))
        drawCircle(Color(0xFFFFEB3B), CHEESE_SIZE * w * 0.35f, Offset(cheese.x * w - CHEESE_SIZE * w * 0.1f, cheese.y * h - CHEESE_SIZE * w * 0.1f))
    }

    // Game over overlay
    if (state.gameOver) {
        drawRect(Color.Black.copy(alpha = 0.4f))
    }
}

private fun DrawScope.drawHamsterSprite(cx: Float, cy: Float, r: Float, onGround: Boolean) {
    // Body
    drawOval(Color(0xFFF4C87E), topLeft = Offset(cx - r, cy - r * 0.9f), size = Size(r * 2f, r * 1.8f))
    // Eye
    drawCircle(Color(0xFF3D2B1F), r * 0.15f, Offset(cx + r * 0.3f, cy - r * 0.2f))
    drawCircle(Color.White, r * 0.06f, Offset(cx + r * 0.35f, cy - r * 0.25f))
    // Ear
    drawCircle(Color(0xFFF4C87E), r * 0.3f, Offset(cx + r * 0.1f, cy - r * 0.75f))
    drawCircle(Color(0xFFF9A8C9), r * 0.18f, Offset(cx + r * 0.1f, cy - r * 0.75f))
    // Legs (animated)
    val legOffset = if (onGround) r * 0.1f else 0f
    drawOval(Color(0xFFF4C87E), topLeft = Offset(cx - r * 0.8f, cy + r * 0.4f + legOffset), size = Size(r * 0.5f, r * 0.4f))
    drawOval(Color(0xFFF4C87E), topLeft = Offset(cx + r * 0.3f, cy + r * 0.4f - legOffset), size = Size(r * 0.5f, r * 0.4f))
}

private fun DrawScope.drawCloudAt(cx: Float, cy: Float, r: Float) {
    drawCircle(Color.White.copy(alpha = 0.8f), r, Offset(cx, cy))
    drawCircle(Color.White.copy(alpha = 0.8f), r * 0.7f, Offset(cx - r * 0.6f, cy + r * 0.2f))
    drawCircle(Color.White.copy(alpha = 0.8f), r * 0.7f, Offset(cx + r * 0.6f, cy + r * 0.2f))
}
