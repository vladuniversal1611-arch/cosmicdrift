package com.hamsterkingdom.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.hamsterkingdom.data.models.Achievement
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

@Composable
fun AchievementsScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()
    val achievements = state.achievements
    val unlocked = achievements.count { it.isUnlocked }
    var filter by remember { mutableStateOf("All") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D1B3E))))
            .padding(16.dp)
    ) {
        Text("🏆 Achievements", style = MaterialTheme.typography.headlineMedium, color = HamsterGold, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(6.dp))
        Text("$unlocked / ${achievements.size} unlocked", fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.height(8.dp))

        // Progress
        LinearProgressIndicator(
            progress = { unlocked.toFloat() / achievements.size },
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
            color = HamsterGold,
            trackColor = Color.White.copy(alpha = 0.1f)
        )
        Spacer(Modifier.height(12.dp))

        // Filter tabs
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("All", "Unlocked", "Locked").forEach { f ->
                FilterChip(
                    selected = filter == f,
                    onClick = { filter = f },
                    label = { Text(f, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = HamsterOrange,
                        selectedLabelColor = Color.White,
                        containerColor = Color(0xFF2A1A4E),
                        labelColor = Color.White.copy(alpha = 0.7f)
                    )
                )
            }
        }
        Spacer(Modifier.height(10.dp))

        val filtered = when (filter) {
            "Unlocked" -> achievements.filter { it.isUnlocked }
            "Locked" -> achievements.filter { !it.isUnlocked }
            else -> achievements
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(filtered) { ach ->
                AchievementCard(ach)
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun AchievementCard(achievement: Achievement) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (achievement.isUnlocked) Color(0xFF1E3A1E) else Color(0xFF1E1E2E)
        ),
        border = if (achievement.isUnlocked) BorderStroke(1.dp, HamsterGold.copy(alpha = 0.5f)) else null
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (achievement.isUnlocked) HamsterGold.copy(alpha = 0.2f) else Color(0xFF2A2A3E)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    achievement.emoji,
                    fontSize = 24.sp,
                    color = if (achievement.isUnlocked) Color.Unspecified else Color.Gray
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    achievement.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = if (achievement.isUnlocked) HamsterGold else Color.White.copy(alpha = 0.7f)
                )
                Text(
                    achievement.description,
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.5f)
                )
                Spacer(Modifier.height(5.dp))
                LinearProgressIndicator(
                    progress = { achievement.progress },
                    modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                    color = if (achievement.isUnlocked) HamsterGold else HamsterOrange,
                    trackColor = Color.White.copy(alpha = 0.1f)
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    "${achievement.currentValue} / ${achievement.targetValue}",
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.4f)
                )
            }
            Spacer(Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.End) {
                if (achievement.rewardCoins > 0) Text("💰${achievement.rewardCoins}", fontSize = 10.sp, color = HamsterGold)
                if (achievement.rewardCrystals > 0) Text("💎${achievement.rewardCrystals}", fontSize = 10.sp, color = CrystalBlue)
                if (achievement.isUnlocked) Text("✅", fontSize = 16.sp)
            }
        }
    }
}
