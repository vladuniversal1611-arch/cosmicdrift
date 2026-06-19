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
import com.hamsterkingdom.data.models.DailyTask
import com.hamsterkingdom.data.models.TaskDifficulty
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

@Composable
fun DailyTasksScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()
    val tasks = state.dailyTasks
    val completed = tasks.count { it.isCompleted }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D1B3E), Color(0xFF1A0A2E))))
            .padding(16.dp)
    ) {
        Text("📋 Daily Tasks", style = MaterialTheme.typography.headlineMedium, color = HamsterGold, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(4.dp))

        // Streak
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("🔥 ${state.loginStreak} day streak", color = HamsterOrange, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Spacer(Modifier.weight(1f))
            Text("$completed / ${tasks.size} done", fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f))
        }
        Spacer(Modifier.height(8.dp))

        LinearProgressIndicator(
            progress = { if (tasks.isEmpty()) 0f else completed.toFloat() / tasks.size },
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
            color = HamsterGreen,
            trackColor = Color.White.copy(alpha = 0.1f)
        )
        Spacer(Modifier.height(4.dp))
        if (completed == tasks.size && tasks.isNotEmpty()) {
            Text("✅ All tasks complete! Great job!", color = HamsterGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
        }
        Spacer(Modifier.height(12.dp))

        // Task legend
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DifficultyChip("Easy", Color(0xFF4CAF50))
            DifficultyChip("Medium", Color(0xFFFF9800))
            DifficultyChip("Hard", Color(0xFFE53935))
        }
        Spacer(Modifier.height(10.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            val easy = tasks.filter { it.difficulty == TaskDifficulty.EASY }
            val medium = tasks.filter { it.difficulty == TaskDifficulty.MEDIUM }
            val hard = tasks.filter { it.difficulty == TaskDifficulty.HARD }

            if (easy.isNotEmpty()) {
                item { SectionHeader("Easy Tasks", Color(0xFF4CAF50)) }
                items(easy) { task -> TaskCard(task) }
            }
            if (medium.isNotEmpty()) {
                item { SectionHeader("Medium Tasks", Color(0xFFFF9800)) }
                items(medium) { task -> TaskCard(task) }
            }
            if (hard.isNotEmpty()) {
                item { SectionHeader("Hard Tasks", Color(0xFFE53935)) }
                items(hard) { task -> TaskCard(task) }
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun DifficultyChip(label: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.2f))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(label, fontSize = 11.sp, color = color, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SectionHeader(title: String, color: Color) {
    Text(title, color = color, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 2.dp))
}

@Composable
fun TaskCard(task: DailyTask) {
    val difficultyColor = when (task.difficulty) {
        TaskDifficulty.EASY -> Color(0xFF4CAF50)
        TaskDifficulty.MEDIUM -> Color(0xFFFF9800)
        TaskDifficulty.HARD -> Color(0xFFE53935)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (task.isCompleted) Color(0xFF1A2E1A) else Color(0xFF1E1E2E)
        ),
        border = BorderStroke(1.dp, if (task.isCompleted) HamsterGreen.copy(alpha = 0.5f) else difficultyColor.copy(alpha = 0.3f))
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (task.isCompleted) "✅" else task.emoji, fontSize = 22.sp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    task.description,
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.sp,
                    color = if (task.isCompleted) Color.White.copy(alpha = 0.6f) else Color.White
                )
                Spacer(Modifier.height(5.dp))
                LinearProgressIndicator(
                    progress = { task.progress },
                    modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                    color = if (task.isCompleted) HamsterGreen else difficultyColor,
                    trackColor = Color.White.copy(alpha = 0.1f)
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    "${task.currentValue} / ${task.targetValue}",
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.45f)
                )
            }
            Spacer(Modifier.width(10.dp))
            Column(horizontalAlignment = Alignment.End) {
                if (task.rewardCoins > 0) Text("💰${task.rewardCoins}", fontSize = 11.sp, color = HamsterGold, fontWeight = FontWeight.Bold)
                if (task.rewardCrystals > 0) Text("💎${task.rewardCrystals}", fontSize = 11.sp, color = CrystalBlue, fontWeight = FontWeight.Bold)
                if (task.rewardCheese > 0) Text("🧀${task.rewardCheese}", fontSize = 11.sp, color = CheeseYellow, fontWeight = FontWeight.Bold)
            }
        }
    }
}
