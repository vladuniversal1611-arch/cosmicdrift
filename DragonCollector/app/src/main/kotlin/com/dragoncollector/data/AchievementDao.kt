package com.dragoncollector.data

import androidx.room.*
import com.dragoncollector.data.models.Achievement
import kotlinx.coroutines.flow.Flow

@Dao
interface AchievementDao {
    @Query("SELECT * FROM achievements ORDER BY isUnlocked DESC, category ASC")
    fun getAllAchievements(): Flow<List<Achievement>>

    @Query("SELECT * FROM achievements WHERE isUnlocked = 1 AND rewardClaimed = 0")
    suspend fun getUnclaimedAchievements(): List<Achievement>

    @Query("SELECT * FROM achievements WHERE id = :id")
    suspend fun getAchievementById(id: String): Achievement?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAchievement(achievement: Achievement)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAchievements(achievements: List<Achievement>)

    @Query("UPDATE achievements SET progress = :progress, isUnlocked = :isUnlocked WHERE id = :id")
    suspend fun updateProgress(id: String, progress: Int, isUnlocked: Boolean)

    @Query("UPDATE achievements SET rewardClaimed = 1 WHERE id = :id")
    suspend fun claimReward(id: String)
}
