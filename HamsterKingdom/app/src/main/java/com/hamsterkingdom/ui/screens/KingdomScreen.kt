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
import com.hamsterkingdom.data.models.RoomData
import com.hamsterkingdom.data.models.RoomType
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

@Composable
fun KingdomScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0D1B3E), Color(0xFF1A0A2E))))
            .padding(16.dp)
    ) {
        Text(
            "🏰 Hamster Kingdom",
            style = MaterialTheme.typography.headlineMedium,
            color = HamsterGold,
            fontWeight = FontWeight.ExtraBold
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Level ${state.hamster.level} Kingdom • ${state.rooms.values.count { it.isBuilt }} rooms built",
            fontSize = 12.sp,
            color = Color.White.copy(alpha = 0.6f)
        )
        Spacer(Modifier.height(12.dp))

        // Coins display
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF2A1A4E))
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("💰 Coins:", color = Color.White, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(8.dp))
            Text(
                state.resources.coins.toString(),
                color = HamsterGold,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 18.sp
            )
            Spacer(Modifier.weight(1f))
            Text(
                "+${vm.coinsPerSecond().let { "%.1f".format(it) }}/s",
                color = HamsterGold.copy(alpha = 0.7f),
                fontSize = 11.sp
            )
        }
        Spacer(Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(RoomType.values().toList()) { roomType ->
                val room = state.rooms[roomType.name] ?: RoomData(roomType)
                RoomCard(
                    room = room,
                    hamsterLevel = state.hamster.level,
                    coins = state.resources.coins,
                    onBuild = { vm.buildRoom(roomType) },
                    onUpgrade = { vm.upgradeRoom(roomType) }
                )
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun RoomCard(
    room: RoomData,
    hamsterLevel: Int,
    coins: Long,
    onBuild: () -> Unit,
    onUpgrade: () -> Unit
) {
    val isLocked = hamsterLevel < room.type.unlockLevel
    val alpha = if (isLocked) 0.5f else 1f

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = when {
                isLocked -> Color(0xFF1A1A2E)
                room.isBuilt -> Color(0xFF1E3A1E)
                else -> Color(0xFF2A2A1E)
            }
        ),
        border = if (room.isBuilt) BorderStroke(1.dp, HamsterGreen.copy(alpha = 0.4f)) else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Room icon
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(
                        if (room.isBuilt) Color(0xFF2E5A2E) else Color(0xFF2A2A3E)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(room.type.emoji, fontSize = 28.sp)
            }
            Spacer(Modifier.width(12.dp))

            // Room info
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        room.type.displayName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color.White.copy(alpha = alpha)
                    )
                    if (room.isBuilt) {
                        Spacer(Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(HamsterGreen.copy(alpha = 0.3f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("Lv.${room.level}", fontSize = 10.sp, color = HamsterGreen, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.height(3.dp))
                Text(
                    room.type.description,
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.6f * alpha)
                )
                if (room.isBuilt) {
                    Spacer(Modifier.height(3.dp))
                    Text(
                        room.bonusDescription(),
                        fontSize = 11.sp,
                        color = HamsterGreen.copy(alpha = 0.9f)
                    )
                    // Level stars
                    Spacer(Modifier.height(4.dp))
                    Row {
                        repeat(5) { i ->
                            Text(
                                if (i < room.level) "⭐" else "☆",
                                fontSize = 12.sp,
                                color = if (i < room.level) HamsterGold else Color.White.copy(alpha = 0.3f)
                            )
                        }
                    }
                } else if (isLocked) {
                    Spacer(Modifier.height(3.dp))
                    Text("🔒 Unlock at level ${room.type.unlockLevel}", fontSize = 11.sp, color = Color.White.copy(alpha = 0.4f))
                }
            }

            Spacer(Modifier.width(8.dp))

            // Action button
            Column(horizontalAlignment = Alignment.End) {
                when {
                    isLocked -> {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF333333))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text("🔒 Lv.${room.type.unlockLevel}", fontSize = 11.sp, color = Color.White.copy(alpha = 0.5f))
                        }
                    }
                    !room.isBuilt -> {
                        val canAfford = coins >= room.type.baseCost
                        Button(
                            onClick = onBuild,
                            enabled = canAfford,
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (canAfford) HamsterOrange else Color(0xFF444444),
                                disabledContainerColor = Color(0xFF333333)
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Build", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("💰${room.type.baseCost}", fontSize = 10.sp)
                            }
                        }
                    }
                    room.isMaxLevel -> {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(HamsterGold.copy(alpha = 0.2f))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text("✨ MAX", fontSize = 12.sp, color = HamsterGold, fontWeight = FontWeight.Bold)
                        }
                    }
                    else -> {
                        val canAfford = coins >= room.upgradeCost
                        Button(
                            onClick = onUpgrade,
                            enabled = canAfford,
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (canAfford) Color(0xFF1565C0) else Color(0xFF333333),
                                disabledContainerColor = Color(0xFF333333)
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Upgrade", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("💰${room.upgradeCost}", fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
