package com.hamsterkingdom.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
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
fun CollectionScreen(vm: GameViewModel) {
    val state by vm.state.collectAsState()
    var selectedCategory by remember { mutableStateOf<CollectionCategory?>(null) }
    var selectedItem by remember { mutableStateOf<CollectionItem?>(null) }

    val filteredItems = if (selectedCategory == null) state.collection
    else state.collection.filter { it.category == selectedCategory }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A0A2E), Color(0xFF0D1B3E))))
            .padding(16.dp)
    ) {
        Text("🎒 Collection", style = MaterialTheme.typography.headlineMedium, color = HamsterGold, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(4.dp))
        val ownedCount = state.collection.count { it.isOwned }
        Text("$ownedCount / ${state.collection.size} owned", fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.height(12.dp))

        // Category filter
        ScrollableTabRow(
            selectedTabIndex = CollectionCategory.values().indexOf(selectedCategory).takeIf { it >= 0 } ?: 0,
            containerColor = Color.Transparent,
            contentColor = HamsterOrange,
            edgePadding = 0.dp
        ) {
            Tab(selected = selectedCategory == null, onClick = { selectedCategory = null }) {
                Text("All", modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), fontSize = 12.sp)
            }
            CollectionCategory.values().forEach { cat ->
                Tab(selected = selectedCategory == cat, onClick = { selectedCategory = cat }) {
                    Text(cat.name.lowercase().replaceFirstChar { it.uppercase() }, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(10.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(filteredItems) { item ->
                CollectionItemCard(item, onClick = { selectedItem = item })
            }
            item(span = { GridItemSpan(3) }) { Spacer(Modifier.height(80.dp)) }
        }
    }

    selectedItem?.let { item ->
        CollectionItemDialog(
            item = item,
            coins = state.resources.coins,
            onBuy = { vm.buyCollectionItem(item.id); selectedItem = null },
            onEquip = { vm.equipCollectionItem(item.id); selectedItem = null },
            onDismiss = { selectedItem = null }
        )
    }
}

@Composable
fun CollectionItemCard(item: CollectionItem, onClick: () -> Unit) {
    val rarityColor = when (item.rarity) {
        Rarity.COMMON -> ColorCommon; Rarity.UNCOMMON -> ColorUncommon
        Rarity.RARE -> ColorRare; Rarity.EPIC -> ColorEpic; Rarity.LEGENDARY -> ColorLegendary
    }

    Card(
        modifier = Modifier
            .aspectRatio(1f)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.isOwned) Color(0xFF1E2A3E) else Color(0xFF111120)
        ),
        border = BorderStroke(1.5.dp, if (item.isEquipped) HamsterGold else rarityColor.copy(alpha = if (item.isOwned) 0.8f else 0.3f))
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(8.dp)) {
                Text(
                    item.emoji,
                    fontSize = 28.sp,
                    color = if (item.isOwned) Color.Unspecified else Color.Gray.copy(alpha = 0.5f)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    item.name,
                    fontSize = 9.sp,
                    color = if (item.isOwned) rarityColor else Color.Gray.copy(alpha = 0.5f),
                    fontWeight = FontWeight.Bold,
                    maxLines = 2
                )
                if (item.isEquipped) {
                    Text("✓", fontSize = 10.sp, color = HamsterGold)
                }
            }
            if (!item.isOwned) {
                Box(
                    modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("🔒", fontSize = 20.sp)
                }
            }
        }
    }
}

@Composable
fun CollectionItemDialog(
    item: CollectionItem,
    coins: Long,
    onBuy: () -> Unit,
    onEquip: () -> Unit,
    onDismiss: () -> Unit
) {
    val rarityColor = when (item.rarity) {
        Rarity.COMMON -> ColorCommon; Rarity.UNCOMMON -> ColorUncommon
        Rarity.RARE -> ColorRare; Rarity.EPIC -> ColorEpic; Rarity.LEGENDARY -> ColorLegendary
    }
    val cost = when (item.rarity) {
        Rarity.COMMON -> 100L; Rarity.UNCOMMON -> 300L; Rarity.RARE -> 800L
        Rarity.EPIC -> 2000L; Rarity.LEGENDARY -> 5000L
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF2A1A4E),
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(item.emoji, fontSize = 28.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(item.name, color = HamsterGold, fontWeight = FontWeight.Bold)
                    Text(item.rarity.displayName, color = rarityColor, fontSize = 12.sp)
                }
            }
        },
        text = {
            Column {
                Text(item.description, color = Color.White, fontSize = 13.sp)
                Spacer(Modifier.height(8.dp))
                Text("Bonus: ${item.bonus}", color = HamsterGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                if (!item.isOwned) {
                    Spacer(Modifier.height(8.dp))
                    Text("Cost: 💰$cost", color = HamsterGold, fontWeight = FontWeight.Bold)
                    Text("Your coins: 💰$coins", color = if (coins >= cost) HamsterGreen else HamsterRed, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            when {
                !item.isOwned -> Button(
                    onClick = onBuy,
                    enabled = coins >= cost,
                    colors = ButtonDefaults.buttonColors(containerColor = HamsterOrange)
                ) { Text("Buy 💰$cost") }
                else -> Button(
                    onClick = onEquip,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (item.isEquipped) Color(0xFF555555) else HamsterGreen
                    )
                ) { Text(if (item.isEquipped) "Unequip" else "Equip ✓") }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Close", color = Color.White.copy(alpha = 0.6f)) }
        }
    )
}
