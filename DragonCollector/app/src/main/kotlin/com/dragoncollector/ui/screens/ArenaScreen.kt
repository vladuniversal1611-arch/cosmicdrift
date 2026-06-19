package com.dragoncollector.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.ui.components.DragonIcon
import com.dragoncollector.ui.components.rarityColor
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel
import kotlinx.coroutines.delay

data class ArenaEnemy(val name: String, val emoji: String, val power: Int, val reward: Int)

val ARENA_ENEMIES = listOf(
    ArenaEnemy("Лісовий Охоронець", "🌲", 30, 50),
    ArenaEnemy("Печерний Велетень", "🗻", 80, 120),
    ArenaEnemy("Пісчаний Буря", "🏜️", 150, 220),
    ArenaEnemy("Вулканічний Страж", "🌋", 300, 400),
    ArenaEnemy("Крижана Королева", "❄️", 600, 750),
    ArenaEnemy("Небесний Захисник", "☁️", 1200, 1500),
    ArenaEnemy("Космічний Бог", "🌌", 2500, 3000),
    ArenaEnemy("Повелитель Часу", "⏳", 5000, 6000)
)

@Composable
fun ArenaScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTeam by remember { mutableStateOf<Set<String>>(emptySet()) }
    var battleResult by remember { mutableStateOf<Pair<Boolean, ArenaEnemy>?>(null) }
    var isBattling by remember { mutableStateOf(false) }
    var battleProgress by remember { mutableStateOf(0f) }

    val ownedDragons = uiState.ownedDragons
    val currentEnemy = remember(uiState.gameState.totalArenaFights) {
        ARENA_ENEMIES[minOf(uiState.gameState.totalArenaFights / 5, ARENA_ENEMIES.size - 1)]
    }
    val teamPower = ownedDragons.filter { it.id in selectedTeam }.sumOf { it.powerForLevel }

    LaunchedEffect(isBattling) {
        if (isBattling) {
            battleProgress = 0f
            repeat(20) {
                delay(80)
                battleProgress = (it + 1) / 20f
            }
            val win = viewModel.fightArena(selectedTeam.toList(), currentEnemy.power)
            battleResult = Pair(win, currentEnemy)
            isBattling = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        Text("⚔️ Арена", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold,
            modifier = Modifier.padding(16.dp))

        // Enemy card
        EnemyCard(enemy = currentEnemy, wins = uiState.gameState.totalArenaWins,
            total = uiState.gameState.totalArenaFights)

        Spacer(Modifier.height(8.dp))

        // Team selection
        Text("🐉 Вибери команду (до 3 драконів)",
            fontSize = 14.sp, color = Color.White.copy(alpha = 0.8f),
            modifier = Modifier.padding(horizontal = 16.dp))
        Text("Сила команди: ⚔️ $teamPower vs 🛡️ ${currentEnemy.power}",
            fontSize = 13.sp, color = if (teamPower >= currentEnemy.power) Color(0xFF4CAF50) else Color(0xFFFF6B6B),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp),
            fontWeight = FontWeight.Bold)

        if (isBattling) {
            LinearProgressIndicator(
                progress = battleProgress,
                modifier = Modifier.fillMaxWidth().padding(16.dp).height(8.dp),
                color = Color(0xFFFF6B6B),
                trackColor = DragonCard
            )
        } else {
            // Battle button
            Button(
                onClick = { if (selectedTeam.isNotEmpty()) isBattling = true },
                enabled = selectedTeam.isNotEmpty(),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFB71C1C),
                    disabledContainerColor = DragonCard
                )
            ) {
                Text("⚔️ В БІЙ!", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Dragon list
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (ownedDragons.isEmpty()) {
                item {
                    Text("Спочатку отримай драконів!", color = Color.White.copy(alpha = 0.5f),
                        textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(24.dp))
                }
            } else {
                items(ownedDragons, key = { it.id }) { dragon ->
                    ArenadragonCard(
                        dragon = dragon,
                        isSelected = dragon.id in selectedTeam,
                        canSelect = selectedTeam.size < 3 || dragon.id in selectedTeam,
                        onClick = {
                            selectedTeam = if (dragon.id in selectedTeam)
                                selectedTeam - dragon.id
                            else if (selectedTeam.size < 3)
                                selectedTeam + dragon.id
                            else selectedTeam
                        }
                    )
                }
            }
        }
    }

    battleResult?.let { (win, enemy) ->
        BattleResultDialog(win = win, enemy = enemy, teamPower = teamPower,
            onDismiss = { battleResult = null; selectedTeam = emptySet() })
    }
}

@Composable
fun EnemyCard(enemy: ArenaEnemy, wins: Int, total: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Brush.horizontalGradient(listOf(Color(0xFF3A0000), Color(0xFF1A0A2E))))
            .border(1.5.dp, Color(0xFFB71C1C), RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text("Противник", color = Color.Gray, fontSize = 11.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(enemy.emoji, fontSize = 32.sp)
                Column {
                    Text(enemy.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("🛡️ Сила: ${enemy.power}", color = Color(0xFFFF6B6B), fontSize = 12.sp)
                    Text("🪙 Нагорода: ${enemy.reward}", color = GoldColor, fontSize = 11.sp)
                }
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text("⚔️ $wins перемог", color = Color(0xFF4CAF50), fontSize = 12.sp)
            Text("📊 $total боїв", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
        }
    }
}

@Composable
fun ArenadragonCard(dragon: Dragon, isSelected: Boolean, canSelect: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) DragonPurple.copy(alpha = 0.4f) else DragonCard)
            .border(1.5.dp, if (isSelected) DragonPurpleLight else DragonPurple.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .then(if (canSelect || isSelected) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DragonIcon(dragon = dragon, size = 44.dp)
            Column {
                Text(dragon.name, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(dragon.rarity.displayName, color = rarityColor(dragon.rarity), fontSize = 11.sp)
                    Text("Рів. ${dragon.level}", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                }
                Text("⚔️ ${dragon.powerForLevel}", color = Color(0xFFFF6B6B), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
        if (isSelected) {
            Box(Modifier.size(28.dp).background(DragonPurpleLight, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center) {
                Text("✓", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun BattleResultDialog(win: Boolean, enemy: ArenaEnemy, teamPower: Int, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = if (win) Color(0xFF1B3A1B) else Color(0xFF3A1B1B),
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(if (win) "🏆" else "💀", fontSize = 48.sp)
                Text(if (win) "ПЕРЕМОГА!" else "ПОРАЗКА",
                    color = if (win) Color(0xFF4CAF50) else Color(0xFFFF6B6B),
                    fontWeight = FontWeight.Bold, fontSize = 22.sp)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp), horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()) {
                Text("Ваша сила: ⚔️ $teamPower", color = Color.White, fontSize = 14.sp)
                Text("Сила ворога: 🛡️ ${enemy.power}", color = Color.White, fontSize = 14.sp)
                if (win) {
                    Spacer(Modifier.height(4.dp))
                    Text("+${enemy.reward} 🪙", color = GoldColor, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                } else {
                    Text("Підсили своїх драконів!", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = if (win) Color(0xFF4CAF50) else Color(0xFFB71C1C))) {
                Text(if (win) "Дякую!" else "Спробую ще раз", fontWeight = FontWeight.Bold)
            }
        }
    )
}
