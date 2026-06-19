package com.dragoncollector.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
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
import com.dragoncollector.data.models.Building
import com.dragoncollector.data.models.GameState
import com.dragoncollector.ui.components.formatNumber
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel

@Composable
fun IslandScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedBuilding by remember { mutableStateOf<Building?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E), Color(0xFF0D0518)))
            )
    ) {
        // Island header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "🏝️ Острів Драконів",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = DragonGold
                )
                Text(
                    "Рівень острова: ${uiState.gameState.islandLevel}",
                    fontSize = 13.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
                Text(
                    "Драконів: ${uiState.ownedDragons.size}",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f)
                )
            }
        }

        // Buildings grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(uiState.buildings) { building ->
                BuildingCard(
                    building = building,
                    gameState = uiState.gameState,
                    onClick = { selectedBuilding = building }
                )
            }
        }
    }

    // Upgrade dialog
    selectedBuilding?.let { building ->
        BuildingUpgradeDialog(
            building = building,
            gameState = uiState.gameState,
            onUpgrade = {
                viewModel.upgradeBuilding(building.id)
                selectedBuilding = null
            },
            onDismiss = { selectedBuilding = null }
        )
    }
}

@Composable
fun BuildingCard(building: Building, gameState: GameState, onClick: () -> Unit) {
    val canAfford = gameState.gold >= building.upgradeCostGold
    val borderColor = if (canAfford && !building.isMaxLevel) DragonGold else DragonPurple.copy(alpha = 0.5f)

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.verticalGradient(listOf(DragonCardLight, DragonCard))
            )
            .border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text(building.emoji, fontSize = 36.sp, textAlign = TextAlign.Center)
            Spacer(Modifier.height(6.dp))
            Text(
                building.name, fontSize = 13.sp, fontWeight = FontWeight.Bold,
                color = Color.White, textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(4.dp))
            // Level bar
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                repeat(building.maxLevel) { i ->
                    Box(
                        Modifier.size(width = 12.dp, height = 6.dp)
                            .background(
                                if (i < building.level) DragonGold else Color.White.copy(alpha = 0.2f),
                                RoundedCornerShape(3.dp)
                            )
                    )
                }
            }
            Spacer(Modifier.height(4.dp))
            Text("Рівень ${building.level}/${building.maxLevel}", fontSize = 11.sp, color = Color.White.copy(alpha = 0.7f))
            Spacer(Modifier.height(6.dp))
            if (building.isMaxLevel) {
                Text("✅ МАКСИМУМ", fontSize = 11.sp, color = Color(0xFF4CAF50), fontWeight = FontWeight.Bold)
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("🪙 ${formatNumber(building.upgradeCostGold.toLong())}", fontSize = 11.sp,
                        color = if (canAfford) GoldColor else Color.Red.copy(alpha = 0.8f))
                    if (building.upgradeCostGems > 0) {
                        Text("💎 ${building.upgradeCostGems}", fontSize = 11.sp, color = GemColor)
                    }
                }
            }
        }
    }
}

@Composable
fun BuildingUpgradeDialog(
    building: Building,
    gameState: GameState,
    onUpgrade: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(building.emoji, fontSize = 28.sp)
                Text(building.name, color = DragonGold, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(building.description, color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
                Divider(color = DragonPurple.copy(alpha = 0.5f))
                Text("Ефект:", color = GemColor, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Text(building.effect, color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                if (!building.isMaxLevel) {
                    Divider(color = DragonPurple.copy(alpha = 0.5f))
                    Text("Вартість покращення:", color = GoldColor, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("🪙 ${formatNumber(building.upgradeCostGold.toLong())}",
                            color = if (gameState.gold >= building.upgradeCostGold) GoldColor else Color.Red)
                        if (building.upgradeCostGems > 0)
                            Text("💎 ${building.upgradeCostGems}", color = GemColor)
                    }
                }
            }
        },
        confirmButton = {
            if (!building.isMaxLevel) {
                Button(
                    onClick = onUpgrade,
                    enabled = gameState.gold >= building.upgradeCostGold,
                    colors = ButtonDefaults.buttonColors(containerColor = DragonGold, contentColor = DragonDark)
                ) {
                    Text("⬆️ Покращити", fontWeight = FontWeight.Bold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Закрити", color = Color.White.copy(alpha = 0.7f))
            }
        }
    )
}
