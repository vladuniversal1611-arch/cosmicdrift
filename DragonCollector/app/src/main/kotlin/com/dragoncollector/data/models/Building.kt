package com.dragoncollector.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "buildings")
data class Building(
    @PrimaryKey val id: String,
    val name: String,
    val emoji: String,
    val level: Int = 1,
    val maxLevel: Int = 10,
    val description: String,
    val effect: String
) {
    val upgradeCostGold: Int get() = level * 500 + level * level * 100
    val upgradeCostGems: Int get() = if (level >= 8) level * 5 else 0
    val isMaxLevel: Boolean get() = level >= maxLevel
}

@Entity(tableName = "game_state")
data class GameState(
    @PrimaryKey val id: Int = 1,
    val gold: Long = 500L,
    val gems: Int = 50,
    val dragonEssence: Int = 0,
    val islandLevel: Int = 1,
    val lastLoginTime: Long = System.currentTimeMillis(),
    val lastDailyRewardTime: Long = 0L,
    val lastWheelSpinTime: Long = 0L,
    val dailyStreakDays: Int = 0,
    val totalExpeditionsCompleted: Int = 0,
    val totalMerges: Int = 0,
    val totalArenaWins: Int = 0,
    val totalArenaFights: Int = 0,
    val totalPlayTimeMs: Long = 0L,
    val sessionStartTime: Long = System.currentTimeMillis()
)
