package com.dragoncollector.data

import androidx.room.*
import com.dragoncollector.data.models.Building
import com.dragoncollector.data.models.GameState
import kotlinx.coroutines.flow.Flow

@Dao
interface BuildingDao {
    @Query("SELECT * FROM buildings")
    fun getAllBuildings(): Flow<List<Building>>

    @Query("SELECT * FROM buildings WHERE id = :id")
    suspend fun getBuildingById(id: String): Building?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBuilding(building: Building)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBuildings(buildings: List<Building>)

    @Query("UPDATE buildings SET level = :level WHERE id = :id")
    suspend fun upgradeBuilding(id: String, level: Int)
}

@Dao
interface GameStateDao {
    @Query("SELECT * FROM game_state WHERE id = 1")
    fun getGameState(): Flow<GameState>

    @Query("SELECT * FROM game_state WHERE id = 1")
    suspend fun getGameStateOnce(): GameState?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveGameState(state: GameState)

    @Query("UPDATE game_state SET gold = :gold WHERE id = 1")
    suspend fun updateGold(gold: Long)

    @Query("UPDATE game_state SET gems = :gems WHERE id = 1")
    suspend fun updateGems(gems: Int)

    @Query("UPDATE game_state SET gold = gold + :amount WHERE id = 1")
    suspend fun addGold(amount: Long)

    @Query("UPDATE game_state SET gems = gems + :amount WHERE id = 1")
    suspend fun addGems(amount: Int)

    @Query("UPDATE game_state SET dragonEssence = dragonEssence + :amount WHERE id = 1")
    suspend fun addEssence(amount: Int)

    @Query("UPDATE game_state SET totalExpeditionsCompleted = totalExpeditionsCompleted + 1 WHERE id = 1")
    suspend fun incrementExpeditions()

    @Query("UPDATE game_state SET totalMerges = totalMerges + 1 WHERE id = 1")
    suspend fun incrementMerges()

    @Query("UPDATE game_state SET totalArenaWins = totalArenaWins + 1, totalArenaFights = totalArenaFights + 1 WHERE id = 1")
    suspend fun recordArenaWin()

    @Query("UPDATE game_state SET totalArenaFights = totalArenaFights + 1 WHERE id = 1")
    suspend fun recordArenaLoss()
}
