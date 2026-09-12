package com.hamsterkingdom.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.ui.minigames.*
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

enum class ActiveMinigame { NONE, CHEESE_DASH, HAMSTER_JUMP, WHEEL_SPIN, TUNNEL_ESCAPE, CHEESE_PUZZLE }

data class MinigameInfo(
    val id: ActiveMinigame,
    val title: String,
    val emoji: String,
    val description: String,
    val reward: String,
    val color: Color
)

val MINIGAMES = listOf(
    MinigameInfo(ActiveMinigame.CHEESE_DASH, "Cheese Dash", "🏃", "Run, collect cheese, avoid obstacles!", "🧀 Cheese + 💰 Coins", Color(0xFFFF6B35)),
    MinigameInfo(ActiveMinigame.HAMSTER_JUMP, "Hamster Jump", "⬆️", "Jump as high as you can on platforms!", "🧀 Cheese + 💰 Coins", Color(0xFF7B1FA2)),
    MinigameInfo(ActiveMinigame.TUNNEL_ESCAPE, "Tunnel Escape", "🕳️", "Escape the mole through the tunnels!", "🧀 Cheese + 💰 Coins", Color(0xFF5D3A1A)),
    MinigameInfo(ActiveMinigame.WHEEL_SPIN, "Wheel of Fortune", "🎡", "Spin daily for amazing prizes!", "🧀💰💎 Random Prizes", Color(0xFF1565C0)),
    MinigameInfo(ActiveMinigame.CHEESE_PUZZLE, "Cheese Puzzle", "🧩", "Match cheese pairs before time runs out!", "🧀 Cheese + 💰 Coins", Color(0xFF2E7D32))
)

@Composable
fun MinigamesScreen(vm: GameViewModel) {
    var activeGame by remember { mutableStateOf(ActiveMinigame.NONE) }

    when (activeGame) {
        ActiveMinigame.CHEESE_DASH -> CheeseDashScreen(vm, onBack = { activeGame = ActiveMinigame.NONE })
        ActiveMinigame.HAMSTER_JUMP -> HamsterJumpScreen(vm, onBack = { activeGame = ActiveMinigame.NONE })
        ActiveMinigame.WHEEL_SPIN -> WheelSpinScreen(vm, onBack = { activeGame = ActiveMinigame.NONE })
        ActiveMinigame.TUNNEL_ESCAPE -> TunnelEscapeScreen(vm, onBack = { activeGame = ActiveMinigame.NONE })
        ActiveMinigame.CHEESE_PUZZLE -> CheesePuzzleScreen(vm, onBack = { activeGame = ActiveMinigame.NONE })
        ActiveMinigame.NONE -> MinigamesList { activeGame = it }
    }
}

@Composable
fun MinigamesList(onSelect: (ActiveMinigame) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D1B3E))))
            .padding(16.dp)
    ) {
        Text("🎮 Mini Games", style = MaterialTheme.typography.headlineMedium, color = HamsterGold, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(6.dp))
        Text("Play games to earn extra rewards!", fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.height(16.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(MINIGAMES) { game ->
                MinigameCard(game) { onSelect(game.id) }
            }
            item(span = { GridItemSpan(2) }) { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun MinigameCard(game: MinigameInfo, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .aspectRatio(0.9f)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E3E)),
        border = BorderStroke(1.dp, game.color.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceEvenly
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(game.color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text(game.emoji, fontSize = 32.sp)
            }

            Text(game.title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White)
            Text(
                game.description,
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.55f),
                maxLines = 2
            )

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(game.color.copy(alpha = 0.2f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(game.reward, fontSize = 10.sp, color = game.color, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(containerColor = game.color),
                shape = RoundedCornerShape(10.dp),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Text("Play!", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}
