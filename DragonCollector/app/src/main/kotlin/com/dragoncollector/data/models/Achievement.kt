package com.dragoncollector.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class AchievementCategory(val displayName: String, val emoji: String) {
    COLLECTION("Колекція", "📚"),
    LEVELING("Прокачка", "⬆️"),
    EXPEDITION("Експедиції", "🗺️"),
    MERGING("Злиття", "🔀"),
    ARENA("Арена", "⚔️"),
    BUILDING("Будівництво", "🏗️"),
    RARITY("Рідкість", "⭐"),
    DAILY("Щоденно", "📅"),
    SPECIAL("Особливі", "🏆")
}

@Entity(tableName = "achievements")
data class Achievement(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val category: AchievementCategory,
    val isUnlocked: Boolean = false,
    val progress: Int = 0,
    val maxProgress: Int = 1,
    val rewardGold: Int = 0,
    val rewardGems: Int = 0,
    val rewardEssence: Int = 0,
    val rewardClaimed: Boolean = false
) {
    val progressFraction: Float get() = if (maxProgress > 0) progress.toFloat() / maxProgress else 0f
}
