package com.hamsterkingdom.data

import com.hamsterkingdom.data.models.*

data class GameSaveData(
    val version: Int = 1,
    val hamster: HamsterData = HamsterData(),
    val resources: Resources = Resources(),
    val rooms: Map<String, RoomData> = RoomType.values().associate { it.name to RoomData(it, isBuilt = it == RoomType.BEDROOM, isUnlocked = it == RoomType.BEDROOM, level = if (it == RoomType.BEDROOM) 1 else 0) },
    val tunnel: TunnelData = TunnelData(),
    val achievements: List<Achievement> = defaultAchievements(),
    val collection: List<CollectionItem> = defaultCollection(),
    val pets: List<PetData> = PetType.values().map { PetData(it) },
    val dailyTasks: List<DailyTask> = emptyList(),
    val lastDailyTaskDate: String = "",
    val lastSaveTime: Long = System.currentTimeMillis(),
    val totalCheeseEarned: Long = 0L,
    val totalCoinsEarned: Long = 0L,
    val totalCrystalsEarned: Long = 0L,
    val totalDepthDug: Float = 0f,
    val totalTunnelTrips: Int = 0,
    val totalFeedCount: Int = 0,
    val totalCleanCount: Int = 0,
    val loginStreak: Int = 0,
    val lastLoginDate: String = "",
    val totalPlayMinutes: Long = 0L,
    val totalWheelSpins: Int = 0,
    val totalRareFinds: Int = 0,
    val premiumPass: Boolean = false,
    val dailyRewardDay: Int = 0,
    val lastDailyRewardDate: String = "",
    val tutorialComplete: Boolean = false,
    val notificationsEnabled: Boolean = true
)
