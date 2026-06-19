package com.dragoncollector.ui.components

import androidx.compose.ui.graphics.Color
import com.dragoncollector.data.models.Rarity
import com.dragoncollector.ui.theme.RarityCommon
import com.dragoncollector.ui.theme.RarityRare
import com.dragoncollector.ui.theme.RarityEpic
import com.dragoncollector.ui.theme.RarityLegendary

fun rarityColor(rarity: Rarity): Color = when (rarity) {
    Rarity.COMMON -> RarityCommon
    Rarity.RARE -> RarityRare
    Rarity.EPIC -> RarityEpic
    Rarity.LEGENDARY -> RarityLegendary
}
