package com.hamsterkingdom.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.data.GameSaveData
import com.hamsterkingdom.data.OfflineProgress
import com.hamsterkingdom.ui.components.*
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel
import java.util.concurrent.TimeUnit

@Composable
fun HomeScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()
    val notification by vm.notification.collectAsState()
    val offlineProgress by vm.offlineProgress.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D1B3E))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Text(
                "🏰 Hamster Kingdom",
                style = MaterialTheme.typography.headlineLarge,
                color = HamsterGold,
                fontWeight = FontWeight.ExtraBold
            )
            Spacer(Modifier.height(8.dp))

            // Resources
            ResourceBar(state.resources, vm.cheesePerSecond(), vm.coinsPerSecond())
            Spacer(Modifier.height(12.dp))

            // XP bar
            XpBar(state.hamster.xp, state.hamster.xpToNextLevel, state.hamster.level,
                modifier = Modifier.padding(horizontal = 8.dp))
            Spacer(Modifier.height(16.dp))

            // Hamster display
            HamsterCard(state, vm)
            Spacer(Modifier.height(16.dp))

            // Stats
            StatsPanel(state, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(16.dp))

            // Action buttons
            ActionButtons(vm)
            Spacer(Modifier.height(16.dp))

            // Tunnel progress
            TunnelPanel(state)
            Spacer(Modifier.height(16.dp))

            // Daily tasks preview
            DailyTasksPreview(state)
            Spacer(Modifier.height(80.dp))
        }

        // Notification
        Box(modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp)) {
            FloatingNotification(notification, vm::dismissNotification)
        }

        // Offline progress dialog
        if (offlineProgress != null) {
            OfflineProgressDialog(offlineProgress!!, vm::collectOfflineRewards)
        }
    }
}

@Composable
fun HamsterCard(state: GameSaveData, vm: GameViewModel) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1A4E))
    ) {
        Box(contentAlignment = Alignment.Center) {
            // Stars / sparkle background
            Canvas(modifier = Modifier.fillMaxWidth().height(240.dp)) {
                val stars = listOf(
                    Offset(size.width * 0.1f, size.height * 0.2f),
                    Offset(size.width * 0.9f, size.height * 0.3f),
                    Offset(size.width * 0.15f, size.height * 0.7f),
                    Offset(size.width * 0.85f, size.height * 0.75f),
                    Offset(size.width * 0.5f, size.height * 0.1f)
                )
                stars.forEach { s ->
                    drawCircle(Color.White.copy(alpha = 0.3f), 2f, s)
                }
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                // Hamster name
                val nameTag = state.hamster.name
                Text(nameTag, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = HamsterCream)

                // Hamster view
                HamsterView(
                    hamster = state.hamster,
                    modifier = Modifier.size(180.dp),
                    onTap = { vm.playWithHamster() }
                )

                // Happiness
                val happinessText = when {
                    state.hamster.isHappy -> "😊 Happy"
                    state.hamster.isSad -> "😢 Sad"
                    else -> "😐 Content"
                }
                val happinessColor = when {
                    state.hamster.isHappy -> HamsterGreen
                    state.hamster.isSad -> HamsterRed
                    else -> Color(0xFFFFB300)
                }
                Text(happinessText, fontSize = 14.sp, color = happinessColor, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Tap to play! • ${state.hamster.happiness.toInt()}% happiness",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.5f)
                )
            }
        }
    }
}

@Composable
fun StatsPanel(state: GameSaveData, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1A4E))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("📊 Hamster Stats", fontWeight = FontWeight.Bold, color = HamsterGold, fontSize = 14.sp)
            Spacer(Modifier.height(10.dp))
            StatBar("Hunger", "🍽️", state.hamster.hunger)
            StatBar("Thirst", "💧", state.hamster.thirst)
            StatBar("Mood", "😊", state.hamster.mood)
            StatBar("Energy", "⚡", state.hamster.energy)
            StatBar("Clean", "🛁", state.hamster.cleanliness)
        }
    }
}

@Composable
fun ActionButtons(vm: GameViewModel) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            ActionButton("🍽️ Feed", HamsterOrange, Modifier.weight(1f)) { vm.feedHamster() }
            ActionButton("💧 Water", Color(0xFF29B6F6), Modifier.weight(1f)) { vm.giveWater() }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            ActionButton("🛁 Clean", Color(0xFF66BB6A), Modifier.weight(1f)) { vm.cleanHamster() }
            ActionButton("🎮 Play", HamsterPurple, Modifier.weight(1f)) { vm.playWithHamster() }
        }
    }
}

@Composable
fun ActionButton(label: String, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (pressed) 0.93f else 1f, label = "btnScale")

    Button(
        onClick = { pressed = true; onClick(); pressed = false },
        modifier = modifier.scale(scale).height(50.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(containerColor = color)
    ) {
        Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

@Composable
fun TunnelPanel(state: GameSaveData) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1040))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("⛏️ Tunnel Progress", fontWeight = FontWeight.Bold, color = HamsterGold, fontSize = 14.sp)
                Spacer(Modifier.weight(1f))
                Text("${state.tunnel.currentDepth.toInt()}m deep", color = HamsterCream, fontSize = 12.sp)
            }
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { (state.tunnel.currentDepth % 100f) / 100f },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = HamsterOrange,
                trackColor = Color.White.copy(alpha = 0.1f)
            )
            Spacer(Modifier.height(6.dp))
            val speedText = "⚡ ${state.hamster.digSpeed.let { "%.1f".format(it) }}x speed"
            Text(speedText, fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
            val rewardHint = when {
                state.tunnel.currentDepth > 500f -> "💎 Finding crystals!"
                state.tunnel.currentDepth > 200f -> "✨ Rare treasures ahead!"
                state.tunnel.currentDepth > 100f -> "💰 More coins now!"
                else -> "🧀 Digging for cheese..."
            }
            Text(rewardHint, fontSize = 11.sp, color = HamsterCream.copy(alpha = 0.8f))
        }
    }
}

@Composable
fun DailyTasksPreview(state: GameSaveData) {
    val incompleteTasks = state.dailyTasks.filter { !it.isCompleted }.take(2)
    if (incompleteTasks.isEmpty()) return

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A3A1A))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("📋 Daily Tasks", fontWeight = FontWeight.Bold, color = HamsterGreen, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            incompleteTasks.forEach { task ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(task.emoji, fontSize = 16.sp)
                    Spacer(Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(task.description, fontSize = 12.sp, color = Color.White)
                        LinearProgressIndicator(
                            progress = { task.progress },
                            modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)),
                            color = HamsterGreen,
                            trackColor = Color.White.copy(alpha = 0.1f)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "${task.currentValue}/${task.targetValue}",
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.6f)
                    )
                }
            }
            if (state.dailyTasks.size > 2) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "${state.dailyTasks.count { !it.isCompleted }} tasks remaining • Tap Tasks tab",
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.5f)
                )
            }
        }
    }
}

@Composable
fun OfflineProgressDialog(progress: OfflineProgress, onDismiss: () -> Unit) {
    val hours = progress.elapsedMs / 3600000L
    val minutes = (progress.elapsedMs % 3600000L) / 60000L

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF2A1A4E),
        title = {
            Text("💤 Welcome Back!", color = HamsterGold, fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                Text(
                    "Hammy worked hard for ${hours}h ${minutes}m!",
                    color = Color.White, fontSize = 14.sp
                )
                Spacer(Modifier.height(12.dp))
                if (progress.cheeseEarned > 0) OfflineRewardRow("🧀 Cheese", "+${progress.cheeseEarned}")
                if (progress.coinsEarned > 0) OfflineRewardRow("💰 Coins", "+${progress.coinsEarned}")
                if (progress.depthDug > 0) OfflineRewardRow("⛏️ Depth", "+${progress.depthDug.toInt()}m")
                Spacer(Modifier.height(8.dp))
                Text("Stat changes:", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                OfflineRewardRow("🍽️ Hunger", "-${progress.hungerDecay.toInt()}", Color(0xFFE53935))
                OfflineRewardRow("💧 Thirst", "-${progress.thirstDecay.toInt()}", Color(0xFFE53935))
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange)
            ) {
                Text("Collect! 🎉", fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
fun OfflineRewardRow(label: String, value: String, valueColor: Color = HamsterGreen) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(label, color = Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(value, color = valueColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}
