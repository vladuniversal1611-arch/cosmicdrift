package com.dragoncollector.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.ui.components.DragonCard
import com.dragoncollector.ui.components.rarityColor
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel

@Composable
fun MergeScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selected1 by remember { mutableStateOf<Dragon?>(null) }
    var selected2 by remember { mutableStateOf<Dragon?>(null) }
    var isMerging by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "merge")
    val mergeScale by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 1.1f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse), label = "s"
    )
    val mergeAlpha by infiniteTransition.animateFloat(
        initialValue = 0.7f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "a"
    )

    // Filtered: only available, not on expedition
    val availableDragons = uiState.ownedDragons.filter { !it.isOnExpedition && !it.isHatching }
    val canMerge = selected1 != null && selected2 != null &&
            selected1!!.id != selected2!!.id &&
            selected1!!.element == selected2!!.element &&
            selected1!!.rarity == selected2!!.rarity

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        Text("🔀 Злиття Драконів", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold,
            modifier = Modifier.padding(16.dp))

        // Merge slots
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            MergeSlot(dragon = selected1, label = "Дракон 1", onClear = { selected1 = null })
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "✨", fontSize = 32.sp,
                    modifier = if (canMerge) Modifier.scale(mergeScale).alpha(mergeAlpha) else Modifier
                )
                Text("+", fontSize = 18.sp, color = Color.White.copy(alpha = 0.5f))
            }
            MergeSlot(dragon = selected2, label = "Дракон 2", onClear = { selected2 = null })
        }

        if (selected1 != null && selected2 != null && !canMerge) {
            Text(
                "⚠️ Для злиття потрібні дракони одного елементу та рідкості!",
                color = Color(0xFFFF9800), fontSize = 12.sp, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            )
        }

        Button(
            onClick = {
                if (canMerge) {
                    isMerging = true
                    viewModel.mergeDragons(selected1!!.id, selected2!!.id)
                    selected1 = null
                    selected2 = null
                    isMerging = false
                }
            },
            enabled = canMerge && !isMerging,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = DragonPurpleLight,
                disabledContainerColor = DragonCard
            )
        ) {
            Text(if (isMerging) "✨ Злиття..." else "🔀 Злити!", fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }

        Text("💡 Виберіть двох однакових драконів для злиття",
            color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))

        // Dragon grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            contentPadding = PaddingValues(10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(availableDragons, key = { it.id }) { dragon ->
                val isSelected = dragon.id == selected1?.id || dragon.id == selected2?.id
                Box(
                    modifier = Modifier
                        .then(if (isSelected) Modifier.border(2.dp, DragonGold, RoundedCornerShape(12.dp)) else Modifier)
                ) {
                    DragonCard(
                        dragon = dragon,
                        onClick = {
                            when {
                                selected1?.id == dragon.id -> selected1 = null
                                selected2?.id == dragon.id -> selected2 = null
                                selected1 == null -> selected1 = dragon
                                selected2 == null -> selected2 = dragon
                                else -> { selected1 = dragon }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun MergeSlot(dragon: Dragon?, label: String, onClear: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 130.dp, height = 160.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(DragonCard)
            .border(
                2.dp,
                if (dragon != null) rarityColor(dragon.rarity) else DragonPurple.copy(alpha = 0.4f),
                RoundedCornerShape(14.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        if (dragon != null) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                DragonCard(dragon = dragon, modifier = Modifier.size(100.dp))
                TextButton(onClick = onClear, contentPadding = PaddingValues(2.dp)) {
                    Text("✕ Прибрати", fontSize = 10.sp, color = Color.Gray)
                }
            }
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("➕", fontSize = 28.sp)
                Text(label, fontSize = 11.sp, color = Color.White.copy(alpha = 0.5f), textAlign = TextAlign.Center)
            }
        }
    }
}
