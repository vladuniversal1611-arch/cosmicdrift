package com.dragoncollector.data.models

data class ExpeditionLocation(
    val id: String,
    val name: String,
    val emoji: String,
    val description: String,
    val durationMs: Long,
    val minGoldReward: Int,
    val maxGoldReward: Int,
    val gemChance: Float,
    val essenceChance: Float,
    val eggChance: Float,
    val requiredDragonLevel: Int,
    val requiredIslandLevel: Int,
    val possibleEggRarities: List<Rarity> = listOf(Rarity.COMMON)
)

data class ExpeditionResult(
    val gold: Int,
    val gems: Int,
    val essence: Int,
    val eggId: String?,
    val exp: Int,
    val locationName: String
)
