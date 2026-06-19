package com.dragoncollector.ui.screens

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.ExpeditionLocation
import com.dragoncollector.data.models.ExpeditionResult
import com.dragoncollector.game.ExpeditionData
import com.dragoncollector.ui.components.DragonIcon
import com.dragoncollector.ui.components.formatNumber
import com.dragoncollector.ui.components.rarityColor
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel
import kotlinx.coroutines.delay

@Composable
fun ExpeditionScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    var selectedDragonForExpedition by remember { mutableStateOf<Dragon?>(null) }

    LaunchedEffect(Unit) {
        while (true) { delay(5000); currentTime = System.currentTimeMillis() }
    }

    val expeditionDragons = uiState.expeditionDragons
    val availableDragons = uiState.ownedDragons.filter { !it.isOnExpedition && !it.isReadyToCollect }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        Text("🗺️ Експедиції", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold,
            modifier = Modifier.padding(16.dp))

        LazyColumn(contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {

            // Active expeditions
            if (expeditionDragons.isNotEmpty()) {
                item {
                    Text("✈️ В Дорозі (${expeditionDragons.size})", fontSize = 15.sp,
                        fontWeight = FontWeight.Bold, color = DragonGold)
                }
                items(expeditionDragons, key = { it.id }) { dragon ->
                    ActiveExpeditionCard(dragon, currentTime, onCollect = { viewModel.collectExpedition(dragon.id) })
                }
                item { Spacer(Modifier.height(4.dp)) }
            }

            // Available dragons to send
            if (availableDragons.isNotEmpty()) {
                item {
                    Text("🐉 Доступні Дракони", fontSize = 15.sp,
                        fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.8f))
                }
                items(availableDragons, key = { it.id }) { dragon ->
                    AvailableDragonCard(dragon, onClick = { selectedDragonForExpedition = dragon })
                }
            } else if (expeditionDragons.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        Text("Спочатку отримай драконів у Колекції!", color = Color.White.copy(alpha = 0.5f),
                            fontSize = 14.sp)
                    }
                }
            }
        }
    }

    // Send on expedition dialog
    selectedDragonForExpedition?.let { dragon ->
        SendExpeditionDialog(
            dragon = dragon,
            islandLevel = uiState.gameState.islandLevel,
            onSend = { locationId ->
                viewModel.startExpedition(dragon.id, locationId)
                selectedDragonForExpedition = null
            },
            onDismiss = { selectedDragonForExpedition = null }
        )
    }

    // Result dialog
    uiState.lastExpeditionResult?.let { result ->
        ExpeditionResultDialog(result = result, onDismiss = { viewModel.dismissExpeditionResult() })
    }
}

@Composable
fun ActiveExpeditionCard(dragon: Dragon, currentTime: Long, onCollect: () -> Unit) {
    val isReady = dragon.isReadyToCollect
    val remaining = maxOf(0L, dragon.expeditionEndTime - currentTime)
    val location = com.dragoncollector.game.ExpeditionData.ALL_LOCATIONS.find { it.id == dragon.expeditionLocation }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isReady) Color(0xFF1B3A1B) else DragonCard)
            .border(1.5.dp, if (isReady) Color(0xFF4CAF50) else DragonPurple.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DragonIcon(dragon = dragon, size = 46.dp)
            Column {
                Text(dragon.name, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Text("${location?.emoji ?: "🗺️"} ${location?.name ?: dragon.expeditionLocation}",
                    color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp)
                if (!isReady) Text("⏱️ ${formatDuration(remaining)}", color = GoldColor, fontSize = 11.sp)
            }
        }
        if (isReady) {
            Button(onClick = onCollect, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))) {
                Text("Забрати!", fontWeight = FontWeight.Bold)
            }
        } else {
            Text("✈️", fontSize = 22.sp)
        }
    }
}

@Composable
fun AvailableDragonCard(dragon: Dragon, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DragonCard.copy(alpha = 0.8f))
            .border(1.dp, DragonPurple.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            DragonIcon(dragon = dragon, size = 44.dp)
            Column {
                Text(dragon.name, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Text("${dragon.element.emoji} Рів. ${dragon.level} • ⚔️ ${dragon.powerForLevel}",
                    color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
            }
        }
        Text("📤 Відправити", fontSize = 12.sp, color = DragonGold)
    }
}

@Composable
fun SendExpeditionDialog(
    dragon: Dragon,
    islandLevel: Int,
    onSend: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                DragonIcon(dragon = dragon, size = 40.dp)
                Column {
                    Text("Відправити на Пригоду", color = DragonGold, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(dragon.name, color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                }
            }
        },
        text = {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(ExpeditionData.ALL_LOCATIONS) { location ->
                    val available = dragon.level >= location.requiredDragonLevel && islandLevel >= location.requiredIslandLevel
                    LocationCard(location = location, available = available, onClick = { if (available) onSend(location.id) })
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Скасувати", color = Color.White.copy(alpha = 0.7f)) }
        }
    )
}

@Composable
fun LocationCard(
    location: ExpeditionLocation,
    available: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (available) DragonCardLight else DragonCard.copy(alpha = 0.6f))
            .border(1.dp, if (available) DragonPurple.copy(alpha = 0.6f) else Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
            .then(if (available) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(10.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(location.emoji, fontSize = 20.sp)
                Text(location.name, color = if (available) Color.White else Color.Gray, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
            Text("⏱️ ${formatDuration(location.durationMs)}", color = if (available) GoldColor else Color.Gray, fontSize = 11.sp)
        }
        if (!available) {
            Text("🔒 Потрібен рівень дракона ${location.requiredDragonLevel} • острів ${location.requiredIslandLevel}",
                color = Color.Gray, fontSize = 10.sp)
        } else {
            Text("🪙 ${formatNumber(location.minGoldReward.toLong())}–${formatNumber(location.maxGoldReward.toLong())}",
                color = GoldColor, fontSize = 10.sp)
        }
    }
}

@Composable
fun ExpeditionResultDialog(result: ExpeditionResult, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Text("🎉 Повернення з ${result.locationName}!", color = DragonGold, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (result.gold > 0) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🪙", fontSize = 18.sp); Text("+${result.gold} золота", color = GoldColor, fontSize = 14.sp)
                }
                if (result.gems > 0) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("💎", fontSize = 18.sp); Text("+${result.gems} кристалів", color = GemColor, fontSize = 14.sp)
                }
                if (result.essence > 0) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("✨", fontSize = 18.sp); Text("+${result.essence} сутності", color = EssenceColor, fontSize = 14.sp)
                }
                if (result.eggId != null) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🥚", fontSize = 18.sp); Text("Знайдено нове яйце!", color = Color(0xFF4CAF50), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
                Text("+${result.exp} досвіду", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = DragonGold, contentColor = DragonDark)) {
                Text("Чудово!", fontWeight = FontWeight.Bold)
            }
        }
    )
}
