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
import com.hamsterkingdom.data.models.*
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

@Composable
fun PetsScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D1B3E))))
            .padding(16.dp)
    ) {
        Text("🐾 Pets", style = MaterialTheme.typography.headlineMedium, color = HamsterGold, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(4.dp))
        val ownedPets = state.pets.count { it.isOwned }
        Text("$ownedPets / ${state.pets.size} pets owned", fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.height(12.dp))

        Text(
            "Pets help you gather resources automatically!",
            fontSize = 13.sp,
            color = HamsterCream.copy(alpha = 0.8f)
        )
        Spacer(Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(state.pets) { pet ->
                PetCard(
                    pet = pet,
                    hamsterLevel = state.hamster.level,
                    coins = state.resources.coins,
                    onAdopt = { vm.adoptPet(pet.type) }
                )
            }
            item { Spacer(Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun PetCard(pet: PetData, hamsterLevel: Int, coins: Long, onAdopt: () -> Unit) {
    val isLocked = hamsterLevel < pet.type.unlockLevel
    val cost = 1000L * (pet.type.ordinal + 1)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = when {
                pet.isOwned && pet.isActive -> Color(0xFF1E3A1E)
                pet.isOwned -> Color(0xFF1A2A3A)
                isLocked -> Color(0xFF1A1A1A)
                else -> Color(0xFF2A2A1E)
            }
        ),
        border = if (pet.isOwned) BorderStroke(1.dp, if (pet.isActive) HamsterGreen else Color(0xFF334455)) else null
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        if (pet.isOwned) Color(0xFF2E4A2E) else Color(0xFF2A2A3E)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    pet.type.emoji, fontSize = 32.sp,
                    color = if (!isLocked || pet.isOwned) Color.Unspecified else Color.Gray
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        pet.type.displayName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = if (pet.isOwned) Color.White else Color.White.copy(alpha = 0.6f)
                    )
                    if (pet.isOwned && pet.isActive) {
                        Spacer(Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(HamsterGreen.copy(alpha = 0.3f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("Active", fontSize = 9.sp, color = HamsterGreen, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Text(pet.type.ability, fontSize = 12.sp, color = Color.White.copy(alpha = 0.55f))
                if (pet.isOwned) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Lv.${pet.level} • +${(pet.productionBonus * 100).toInt()}% production",
                        fontSize = 11.sp,
                        color = HamsterGreen
                    )
                } else if (isLocked) {
                    Spacer(Modifier.height(4.dp))
                    Text("🔒 Requires level ${pet.type.unlockLevel}", fontSize = 11.sp, color = Color.White.copy(alpha = 0.4f))
                }
            }
            Spacer(Modifier.width(8.dp))
            if (!pet.isOwned && !isLocked) {
                val canAfford = coins >= cost
                Button(
                    onClick = onAdopt,
                    enabled = canAfford,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (canAfford) HamsterOrange else Color(0xFF333333),
                        disabledContainerColor = Color(0xFF333333)
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Adopt", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("💰$cost", fontSize = 10.sp)
                    }
                }
            } else if (pet.isOwned) {
                Text("✅", fontSize = 24.sp)
            }
        }
    }
}
