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
import com.dragoncollector.data.models.Achievement
import com.dragoncollector.data.models.AchievementCategory
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel

@Composable
fun AchievementsScreen(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedCategory by remember { mutableStateOf<AchievementCategory?>(null) }

    val filtered = remember(uiState.achievements, selectedCategory) {
        if (selectedCategory == null) uiState.achievements
        else uiState.achievements.filter { it.category == selectedCategory }
    }

    val unlockedCount = uiState.achievements.count { it.isUnlocked }
    val total = uiState.achievements.size
    val claimableCount = uiState.achievements.count { it.isUnlocked && !it.rewardClaimed }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D0518), Color(0xFF1A0A2E))))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()) {
                Column {
                    Text("🏆 Досягнення", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                    Text("$unlockedCount / $total відкрито", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f))
                }
                if (claimableCount > 0) {
                    Box(
                        Modifier.background(Color(0xFF4CAF50), RoundedCornerShape(20.dp)).padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("$claimableCount нагород!", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = unlockedCount.toFloat() / total,
                modifier = Modifier.fillMaxWidth().height(6.dp),
                color = DragonGold,
                trackColor = DragonCard
            )
        }

        // Category filter
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(label = "Всі", selected = selectedCategory == null, onClick = { selectedCategory = null })
            AchievementCategory.values().forEach { cat ->
                FilterChip(
                    label = "${cat.emoji} ${cat.displayName}",
                    selected = selectedCategory == cat,
                    onClick = { selectedCategory = if (selectedCategory == cat) null else cat }
                )
            }
        }

        LazyColumn(
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filtered, key = { it.id }) { achievement ->
                AchievementCard(
                    achievement = achievement,
                    onClaim = { viewModel.claimAchievement(achievement.id) }
                )
            }
        }
    }
}

@Composable
fun AchievementCard(achievement: Achievement, onClaim: () -> Unit) {
    val borderColor = when {
        achievement.isUnlocked && !achievement.rewardClaimed -> Color(0xFF4CAF50)
        achievement.isUnlocked -> DragonGold.copy(alpha = 0.6f)
        else -> DragonPurple.copy(alpha = 0.3f)
    }
    val bgColor = when {
        achievement.isUnlocked && !achievement.rewardClaimed -> Color(0xFF1B3A1B)
        achievement.isUnlocked -> DragonCard
        else -> DragonCard.copy(alpha = 0.7f)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            // Icon
            Box(
                Modifier.size(44.dp)
                    .background(
                        if (achievement.isUnlocked) DragonGold.copy(alpha = 0.2f) else DragonCardLight,
                        RoundedCornerShape(10.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (achievement.isUnlocked) "🏆" else "🔒",
                    fontSize = 22.sp
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    achievement.name,
                    color = if (achievement.isUnlocked) Color.White else Color.White.copy(alpha = 0.6f),
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
                Text(
                    achievement.description,
                    color = Color.White.copy(alpha = 0.55f),
                    fontSize = 11.sp
                )
                if (achievement.maxProgress > 1) {
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = achievement.progressFraction,
                        modifier = Modifier.fillMaxWidth().height(4.dp),
                        color = if (achievement.isUnlocked) DragonGold else DragonPurpleLight,
                        trackColor = DragonCardLight
                    )
                    Text(
                        "${achievement.progress} / ${achievement.maxProgress}",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 10.sp
                    )
                }
                // Rewards preview
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (achievement.rewardGold > 0) Text("🪙 ${achievement.rewardGold}", fontSize = 10.sp, color = GoldColor)
                    if (achievement.rewardGems > 0) Text("💎 ${achievement.rewardGems}", fontSize = 10.sp, color = GemColor)
                    if (achievement.rewardEssence > 0) Text("✨ ${achievement.rewardEssence}", fontSize = 10.sp, color = EssenceColor)
                }
            }
        }

        if (achievement.isUnlocked && !achievement.rewardClaimed) {
            Button(
                onClick = onClaim,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text("Забрати", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        } else if (achievement.rewardClaimed) {
            Text("✅", fontSize = 20.sp)
        }
    }
}
