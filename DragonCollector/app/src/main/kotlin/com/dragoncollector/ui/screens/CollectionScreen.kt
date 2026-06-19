package com.dragoncollector.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.Rarity
import com.dragoncollector.ui.components.DragonCard
import com.dragoncollector.ui.components.rarityColor
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel

@Composable
fun CollectionScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedFilter by remember { mutableStateOf<Rarity?>(null) }
    var selectedDragon by remember { mutableStateOf<Dragon?>(null) }
    var showHatchDialog by remember { mutableStateOf<Dragon?>(null) }

    val displayedDragons = remember(uiState.allDragons, selectedFilter) {
        if (selectedFilter == null) uiState.allDragons
        else uiState.allDragons.filter { it.rarity == selectedFilter }
    }

    val ownedCount = uiState.ownedDragons.size
    val totalCount = uiState.allDragons.size

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        // Header
        Column(modifier = Modifier.padding(16.dp)) {
            Text("📚 Колекція Драконів", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold)
            Text("$ownedCount / $totalCount зібрано", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f))
            LinearProgressIndicator(
                progress = ownedCount.toFloat() / totalCount,
                modifier = Modifier.fillMaxWidth().padding(top = 6.dp).height(6.dp),
                color = DragonGold,
                trackColor = DragonCard
            )
        }

        // Rarity filter
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(label = "Всі", selected = selectedFilter == null, onClick = { selectedFilter = null })
            Rarity.values().forEach { rarity ->
                FilterChip(
                    label = rarity.displayName,
                    selected = selectedFilter == rarity,
                    selectedColor = rarityColor(rarity),
                    onClick = { selectedFilter = if (selectedFilter == rarity) null else rarity }
                )
            }
        }

        // Dragon grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            contentPadding = PaddingValues(10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(displayedDragons, key = { it.id }) { dragon ->
                DragonCard(
                    dragon = dragon,
                    showExpeditionBadge = true,
                    onClick = {
                        if (!dragon.isOwned && !dragon.isHatching) showHatchDialog = dragon
                        else selectedDragon = dragon
                    }
                )
            }
        }
    }

    // Dragon detail
    selectedDragon?.let { dragon ->
        DragonDetailDialog(dragon = dragon, onDismiss = { selectedDragon = null })
    }

    // Hatch dialog
    showHatchDialog?.let { dragon ->
        HatchStartDialog(
            dragon = dragon,
            onHatch = { viewModel.startHatching(dragon.id); showHatchDialog = null },
            onDismiss = { showHatchDialog = null }
        )
    }
}

@Composable
fun FilterChip(
    label: String,
    selected: Boolean,
    selectedColor: Color = DragonPurpleLight,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (selected) selectedColor else DragonCard)
            .border(1.dp, if (selected) selectedColor else DragonPurple.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        Text(label, fontSize = 12.sp, color = if (selected) Color.White else Color.White.copy(alpha = 0.7f),
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
    }
}

@Composable
fun DragonDetailDialog(dragon: Dragon, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(dragon.element.emoji, fontSize = 32.sp)
                Text(dragon.name, color = rarityColor(dragon.rarity), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Row { repeat(dragon.rarity.stars) { Text("⭐", fontSize = 12.sp) } }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoRow("Рідкість:", dragon.rarity.displayName, rarityColor(dragon.rarity))
                InfoRow("Елемент:", "${dragon.element.emoji} ${dragon.element.displayName}", Color.White)
                InfoRow("Рівень:", "${dragon.level} / ${dragon.maxLevel}", DragonGold)
                InfoRow("Досвід:", "${dragon.exp} / ${dragon.expToNextLevel}", GemColor)
                InfoRow("Сила:", "${dragon.powerForLevel} ⚔️", Color(0xFFFF6B6B))
                Divider(color = DragonPurple.copy(alpha = 0.4f))
                Text(dragon.description, color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = DragonPurpleLight)) {
                Text("Закрити")
            }
        }
    )
}

@Composable
fun InfoRow(label: String, value: String, valueColor: Color) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color.White.copy(alpha = 0.6f), fontSize = 13.sp)
        Text(value, color = valueColor, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun HatchStartDialog(dragon: Dragon, onHatch: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Text("🥚 Нове Яйце!", color = DragonGold, fontWeight = FontWeight.Bold)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Ви знайшли яйце ${dragon.rarity.displayName} дракона!", color = Color.White)
                Text("Рідкість: ${dragon.rarity.displayName}", color = rarityColor(dragon.rarity))
                val timeText = when (dragon.rarity) {
                    com.dragoncollector.data.models.Rarity.COMMON -> "30 секунд"
                    com.dragoncollector.data.models.Rarity.RARE -> "5 хвилин"
                    com.dragoncollector.data.models.Rarity.EPIC -> "30 хвилин"
                    com.dragoncollector.data.models.Rarity.LEGENDARY -> "2 години"
                }
                Text("Час інкубації: ⏱️ $timeText", color = Color.White.copy(alpha = 0.8f))
            }
        },
        confirmButton = {
            Button(onClick = onHatch, colors = ButtonDefaults.buttonColors(containerColor = DragonGold, contentColor = DragonDark)) {
                Text("🥚 Виводити!", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Пізніше", color = Color.White.copy(alpha = 0.7f)) }
        }
    )
}
