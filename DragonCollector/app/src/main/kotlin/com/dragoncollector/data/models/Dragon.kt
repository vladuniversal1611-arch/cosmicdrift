package com.dragoncollector.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class Rarity(val displayName: String, val stars: Int, val colorHex: String) {
    COMMON("Звичайний", 1, "#9E9E9E"),
    RARE("Рідкісний", 2, "#2196F3"),
    EPIC("Епічний", 3, "#9C27B0"),
    LEGENDARY("Легендарний", 4, "#FFD700")
}

enum class Element(
    val displayName: String,
    val emoji: String,
    val primaryColor: String,
    val secondaryColor: String
) {
    FIRE("Вогонь", "🔥", "#FF4500", "#FF8C00"),
    EARTH("Земля", "🪨", "#8B4513", "#A0522D"),
    WATER("Вода", "💧", "#1E90FF", "#00CED1"),
    AIR("Повітря", "💨", "#87CEEB", "#B0E0E6"),
    ICE("Лід", "❄️", "#00BFFF", "#87CEEB"),
    ELECTRIC("Електро", "⚡", "#FFD700", "#FFA500"),
    POISON("Отрута", "☠️", "#7FFF00", "#32CD32"),
    METAL("Метал", "⚙️", "#C0C0C0", "#808080"),
    SHADOW("Тінь", "🌑", "#4B0082", "#800080"),
    LIGHT("Світло", "✨", "#FFD700", "#FFE4B5"),
    CRYSTAL("Кристал", "💎", "#00FFFF", "#AFEEEE"),
    COSMIC("Космос", "🌌", "#191970", "#483D8B"),
    VOLCANIC("Вулкан", "🌋", "#FF4500", "#8B0000"),
    GOLDEN("Золото", "🥇", "#FFD700", "#DAA520"),
    TIME("Час", "⏳", "#DA70D6", "#EE82EE")
}

@Entity(tableName = "dragons")
data class Dragon(
    @PrimaryKey val id: String,
    val name: String,
    val rarity: Rarity,
    val element: Element,
    val level: Int = 1,
    val exp: Int = 0,
    val power: Int = 10,
    val description: String,
    val isOwned: Boolean = false,
    val isHatching: Boolean = false,
    val hatchEndTime: Long = 0L,
    val expeditionEndTime: Long = 0L,
    val expeditionLocation: String = "",
    val mergeCount: Int = 0
) {
    val maxLevel: Int get() = 50
    val expToNextLevel: Int get() = level * 100
    val hatchDurationMs: Long get() = when (rarity) {
        Rarity.COMMON -> 30_000L
        Rarity.RARE -> 300_000L
        Rarity.EPIC -> 1_800_000L
        Rarity.LEGENDARY -> 7_200_000L
    }
    val isOnExpedition: Boolean get() = expeditionEndTime > System.currentTimeMillis()
    val isReadyToCollect: Boolean get() = expeditionEndTime > 0L && !isOnExpedition
    val isReadyToHatch: Boolean get() = isHatching && System.currentTimeMillis() >= hatchEndTime
    val powerForLevel: Int get() = power + (level - 1) * 5 + rarity.ordinal * 20
}

data class DragonTemplate(
    val id: String,
    val name: String,
    val rarity: Rarity,
    val element: Element,
    val description: String,
    val basePower: Int
)
