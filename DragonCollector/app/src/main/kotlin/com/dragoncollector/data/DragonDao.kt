package com.dragoncollector.data

import androidx.room.*
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.Rarity
import kotlinx.coroutines.flow.Flow

@Dao
interface DragonDao {
    @Query("SELECT * FROM dragons ORDER BY rarity DESC, level DESC")
    fun getAllDragons(): Flow<List<Dragon>>

    @Query("SELECT * FROM dragons WHERE isOwned = 1 ORDER BY rarity DESC, level DESC")
    fun getOwnedDragons(): Flow<List<Dragon>>

    @Query("SELECT * FROM dragons WHERE id = :id")
    suspend fun getDragonById(id: String): Dragon?

    @Query("SELECT * FROM dragons WHERE isHatching = 1")
    fun getHatchingDragons(): Flow<List<Dragon>>

    @Query("SELECT * FROM dragons WHERE expeditionEndTime > 0")
    fun getExpeditionDragons(): Flow<List<Dragon>>

    @Query("SELECT COUNT(*) FROM dragons WHERE isOwned = 1")
    fun getOwnedCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM dragons WHERE isOwned = 1 AND rarity = :rarity")
    fun getOwnedCountByRarity(rarity: Rarity): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDragon(dragon: Dragon)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDragons(dragons: List<Dragon>)

    @Update
    suspend fun updateDragon(dragon: Dragon)

    @Query("UPDATE dragons SET level = :level, exp = :exp, power = :power WHERE id = :id")
    suspend fun updateDragonLevel(id: String, level: Int, exp: Int, power: Int)

    @Query("UPDATE dragons SET expeditionEndTime = :endTime, expeditionLocation = :location WHERE id = :id")
    suspend fun startExpedition(id: String, endTime: Long, location: String)

    @Query("UPDATE dragons SET expeditionEndTime = 0, expeditionLocation = '' WHERE id = :id")
    suspend fun clearExpedition(id: String)

    @Query("UPDATE dragons SET isHatching = 1, hatchEndTime = :endTime WHERE id = :id")
    suspend fun startHatching(id: String, endTime: Long)

    @Query("UPDATE dragons SET isOwned = 1, isHatching = 0, hatchEndTime = 0 WHERE id = :id")
    suspend fun completeHatching(id: String)
}
