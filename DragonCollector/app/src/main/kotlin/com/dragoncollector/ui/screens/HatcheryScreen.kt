package com.dragoncollector.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.Rarity
import com.dragoncollector.ui.components.rarityColor
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel
import kotlinx.coroutines.delay

fun formatDuration(ms: Long): String {
    if (ms <= 0) return "Готово!"
    val seconds = ms / 1000
    return when {
        seconds < 60 -> "${seconds}с"
        seconds < 3600 -> "${seconds / 60}хв ${seconds % 60}с"
        else -> "${seconds / 3600}г ${(seconds % 3600) / 60}хв"
    }
}

@Composable
fun HatcheryScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            currentTime = System.currentTimeMillis()
        }
    }

    val hatchingDragons = uiState.hatchingDragons
    val readyDragons = hatchingDragons.filter { it.isReadyToHatch }
    val incubatingDragons = hatchingDragons.filter { !it.isReadyToHatch }
    val notHatchingDragons = uiState.allDragons.filter { !it.isOwned && !it.isHatching }.take(20)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        Text(
            "🥚 Інкубатор",
            fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold,
            modifier = Modifier.padding(16.dp)
        )

        LazyColumn(
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (readyDragons.isNotEmpty()) {
                item {
                    Text("✅ Готові до вилуплення!", fontSize = 15.sp, fontWeight = FontWeight.Bold,
                        color = Color(0xFF4CAF50), modifier = Modifier.padding(vertical = 4.dp))
                }
                items(readyDragons, key = { it.id }) { dragon ->
                    ReadyToHatchCard(dragon = dragon, onHatch = { viewModel.collectHatchedDragon(dragon.id) })
                }
            }

            if (incubatingDragons.isNotEmpty()) {
                item {
                    Text("🥚 В Інкубаторі (${incubatingDragons.size})", fontSize = 15.sp,
                        fontWeight = FontWeight.Bold, color = DragonGold, modifier = Modifier.padding(vertical = 4.dp))
                }
                items(incubatingDragons, key = { it.id }) { dragon ->
                    IncubatingCard(
                        dragon = dragon,
                        currentTime = currentTime,
                        onInstantHatch = { viewModel.instantHatch(dragon.id) }
                    )
                }
            }

            item {
                Text("🔍 Доступні Яйця", fontSize = 15.sp, fontWeight = FontWeight.Bold,
                    color = Color.White.copy(alpha = 0.8f), modifier = Modifier.padding(vertical = 4.dp))
            }
            if (notHatchingDragons.isEmpty()) {
                item {
                    Text("Всі яйця вже в інкубаторі або вилупились! 🐉",
                        color = Color.White.copy(alpha = 0.6f), textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(16.dp))
                }
            } else {
                items(notHatchingDragons, key = { it.id }) { dragon ->
                    AvailableEggCard(dragon = dragon, onStartHatch = { viewModel.startHatching(dragon.id) })
                }
            }
        }
    }
}

@Composable
fun ReadyToHatchCard(dragon: Dragon, onHatch: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse), label = "scale"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF1B3A1B))
            .border(2.dp, Color(0xFF4CAF50), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("🥚", fontSize = 32.sp, modifier = Modifier.scale(scale))
            Column {
                Text(dragon.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(dragon.rarity.displayName, color = rarityColor(dragon.rarity), fontSize = 12.sp)
            }
        }
        Button(
            onClick = onHatch,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
        ) {
            Text("Забрати! 🐣", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun IncubatingCard(dragon: Dragon, currentTime: Long, onInstantHatch: () -> Unit) {
    val remaining = maxOf(0L, dragon.hatchEndTime - currentTime)
    val progress = 1f - (remaining.toFloat() / maxOf(1L, dragon.hatchDurationMs).toFloat())
    val timeText = formatDuration(remaining)

    val infiniteTransition = rememberInfiniteTransition(label = "wobble")
    val rotation by infiniteTransition.animateFloat(
        initialValue = -5f, targetValue = 5f,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse), label = "rot"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DragonCard)
            .border(1.dp, DragonPurple.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("🥚", fontSize = 28.sp, modifier = Modifier.rotate(rotation))
                Column {
                    Text(dragon.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text(dragon.rarity.displayName, color = rarityColor(dragon.rarity), fontSize = 11.sp)
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("⏱️ $timeText", color = Color.White, fontSize = 12.sp)
                TextButton(onClick = onInstantHatch, contentPadding = PaddingValues(4.dp)) {
                    Text("💎 10 — Миттєво", fontSize = 11.sp, color = GemColor)
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = progress.coerceIn(0f, 1f),
            modifier = Modifier.fillMaxWidth().height(8.dp),
            color = rarityColor(dragon.rarity),
            trackColor = DragonCardLight
        )
    }
}

@Composable
fun AvailableEggCard(dragon: Dragon, onStartHatch: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DragonCard.copy(alpha = 0.8f))
            .border(1.dp, DragonPurple.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .clickable(onClick = onStartHatch)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(dragon.element.emoji, fontSize = 28.sp)
            Column {
                Text(dragon.name, color = Color.White.copy(alpha = 0.9f), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(dragon.rarity.displayName, color = rarityColor(dragon.rarity), fontSize = 11.sp)
                    val timeText = when (dragon.rarity) {
                        Rarity.COMMON -> "30с"
                        Rarity.RARE -> "5хв"
                        Rarity.EPIC -> "30хв"
                        Rarity.LEGENDARY -> "2г"
                    }
                    Text("⏱️ $timeText", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                }
            }
        }
        Icon(
            imageVector = Icons.Default.Add,
            contentDescription = null,
            tint = DragonGold,
            modifier = Modifier.size(22.dp)
        )
    }
}
