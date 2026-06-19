package com.dragoncollector.data.repository

import com.dragoncollector.data.*
import com.dragoncollector.data.models.*
import com.dragoncollector.game.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

class GameRepository(
    private val dragonDao: DragonDao,
    private val buildingDao: BuildingDao,
    private val gameStateDao: GameStateDao,
    private val achievementDao: AchievementDao
) {
    val allDragons: Flow<List<Dragon>> = dragonDao.getAllDragons()
    val ownedDragons: Flow<List<Dragon>> = dragonDao.getOwnedDragons()
    val hatchingDragons: Flow<List<Dragon>> = dragonDao.getHatchingDragons()
    val expeditionDragons: Flow<List<Dragon>> = dragonDao.getExpeditionDragons()
    val allBuildings: Flow<List<Building>> = buildingDao.getAllBuildings()
    val gameState: Flow<GameState> = gameStateDao.getGameState()
    val allAchievements: Flow<List<Achievement>> = achievementDao.getAllAchievements()

    suspend fun initializeIfNeeded() {
        val state = gameStateDao.getGameStateOnce()
        if (state == null) {
            gameStateDao.saveGameState(GameState())
            dragonDao.insertDragons(DragonData.createInitialDragons())
            buildingDao.insertBuildings(BuildingData.ALL_BUILDINGS)
            achievementDao.insertAchievements(AchievementData.ALL_ACHIEVEMENTS)
            // Give starter dragon
            dragonDao.completeHatching(DragonData.getStarterDragonId())
        }
    }

    suspend fun getGameStateOnce(): GameState? = gameStateDao.getGameStateOnce()

    suspend fun addGold(amount: Long) = gameStateDao.addGold(amount)
    suspend fun addGems(amount: Int) = gameStateDao.addGems(amount)
    suspend fun addEssence(amount: Int) = gameStateDao.addEssence(amount)

    suspend fun spendGold(amount: Long): Boolean {
        val state = gameStateDao.getGameStateOnce() ?: return false
        if (state.gold < amount) return false
        gameStateDao.updateGold(state.gold - amount)
        return true
    }

    suspend fun spendGems(amount: Int): Boolean {
        val state = gameStateDao.getGameStateOnce() ?: return false
        if (state.gems < amount) return false
        gameStateDao.updateGems(state.gems - amount)
        return true
    }

    suspend fun startHatching(dragonId: String): Boolean {
        val dragon = dragonDao.getDragonById(dragonId) ?: return false
        if (dragon.isOwned || dragon.isHatching) return false
        val endTime = System.currentTimeMillis() + dragon.hatchDurationMs
        dragonDao.startHatching(dragonId, endTime)
        return true
    }

    suspend fun instantHatch(dragonId: String): Boolean {
        val dragon = dragonDao.getDragonById(dragonId) ?: return false
        if (!dragon.isHatching) return false
        val gemsNeeded = 10
        if (!spendGems(gemsNeeded)) return false
        dragonDao.completeHatching(dragonId)
        gameStateDao.incrementExpeditions()
        return true
    }

    suspend fun completeHatching(dragonId: String) {
        dragonDao.completeHatching(dragonId)
    }

    suspend fun startExpedition(dragonId: String, locationId: String): Boolean {
        val dragon = dragonDao.getDragonById(dragonId) ?: return false
        if (!dragon.isOwned || dragon.isOnExpedition) return false
        val location = ExpeditionData.ALL_LOCATIONS.find { it.id == locationId } ?: return false
        if (dragon.level < location.requiredDragonLevel) return false
        val state = gameStateDao.getGameStateOnce() ?: return false
        if (state.islandLevel < location.requiredIslandLevel) return false
        val endTime = System.currentTimeMillis() + location.durationMs
        dragonDao.startExpedition(dragonId, endTime, locationId)
        return true
    }

    suspend fun collectExpedition(dragonId: String): ExpeditionResult? {
        val dragon = dragonDao.getDragonById(dragonId) ?: return null
        if (!dragon.isReadyToCollect) return null
        val location = ExpeditionData.ALL_LOCATIONS.find { it.id == dragon.expeditionLocation } ?: return null
        val result = calculateExpeditionReward(dragon, location)
        dragonDao.clearExpedition(dragonId)
        gameStateDao.addGold(result.gold.toLong())
        if (result.gems > 0) gameStateDao.addGems(result.gems)
        if (result.essence > 0) gameStateDao.addEssence(result.essence)
        // Level up dragon
        val newExp = dragon.exp + result.exp
        val newLevel = minOf(dragon.maxLevel, dragon.level + newExp / dragon.expToNextLevel)
        val remainingExp = newExp % dragon.expToNextLevel
        dragonDao.updateDragonLevel(dragonId, newLevel, remainingExp, dragon.power + (newLevel - dragon.level) * 2)
        gameStateDao.incrementExpeditions()
        return result
    }

    private fun calculateExpeditionReward(dragon: Dragon, location: ExpeditionLocation): ExpeditionResult {
        val rand = java.util.Random()
        val goldBonus = 1.0 + (dragon.level - 1) * 0.02
        val gold = ((location.minGoldReward + rand.nextInt(location.maxGoldReward - location.minGoldReward)) * goldBonus).toInt()
        val gems = if (rand.nextFloat() < location.gemChance) 1 + rand.nextInt(3) else 0
        val essence = if (rand.nextFloat() < location.essenceChance) 1 + rand.nextInt(5) else 0
        val eggId: String? = if (rand.nextFloat() < location.eggChance) {
            val possibleEggs = DragonData.ALL_TEMPLATES.filter { it.rarity in location.possibleEggRarities }
            possibleEggs.randomOrNull()?.id
        } else null
        val exp = 10 + dragon.level * 2
        return ExpeditionResult(gold, gems, essence, eggId, exp, location.name)
    }

    suspend fun mergeDragons(dragon1Id: String, dragon2Id: String): Dragon? {
        val d1 = dragonDao.getDragonById(dragon1Id) ?: return null
        val d2 = dragonDao.getDragonById(dragon2Id) ?: return null
        if (!d1.isOwned || !d2.isOwned) return null
        if (d1.id == d2.id) return null
        if (d1.element != d2.element || d1.rarity != d2.rarity) return null
        val rand = java.util.Random()
        val upgradeChance = when (d1.rarity) {
            Rarity.COMMON -> 0.3f
            Rarity.RARE -> 0.2f
            Rarity.EPIC -> 0.1f
            Rarity.LEGENDARY -> 0.0f
        }
        val nextRarity = if (rand.nextFloat() < upgradeChance) {
            Rarity.values().getOrNull(d1.rarity.ordinal + 1) ?: d1.rarity
        } else d1.rarity
        val candidates = DragonData.ALL_TEMPLATES.filter { it.rarity == nextRarity && it.element == d1.element }
        val template = candidates.randomOrNull() ?: return null
        // Remove one dragon, upgrade the other
        val updatedDragon = dragonDao.getDragonById(template.id)
        if (updatedDragon != null && !updatedDragon.isOwned) {
            dragonDao.completeHatching(template.id)
        }
        // Remove source dragons if different IDs
        if (dragon2Id != template.id) {
            val d2updated = d2.copy(isOwned = false, level = 1, exp = 0)
            dragonDao.insertDragon(d2updated)
        }
        if (dragon1Id != template.id) {
            val d1updated = d1.copy(isOwned = false, level = 1, exp = 0)
            dragonDao.insertDragon(d1updated)
        }
        gameStateDao.incrementMerges()
        return dragonDao.getDragonById(template.id)
    }

    suspend fun upgradeBuilding(buildingId: String): Boolean {
        val building = buildingDao.getBuildingById(buildingId) ?: return false
        if (building.isMaxLevel) return false
        if (!spendGold(building.upgradeCostGold.toLong())) return false
        if (building.upgradeCostGems > 0 && !spendGems(building.upgradeCostGems)) return false
        buildingDao.upgradeBuilding(buildingId, building.level + 1)
        // Update island level based on average building level
        val allBuildings = buildingDao.getAllBuildings().first()
        val avgLevel = allBuildings.sumOf { it.level } / allBuildings.size
        val state = gameStateDao.getGameStateOnce() ?: return true
        if (avgLevel > state.islandLevel) {
            gameStateDao.saveGameState(state.copy(islandLevel = avgLevel))
        }
        return true
    }

    suspend fun updateLastLogin() {
        val state = gameStateDao.getGameStateOnce() ?: return
        gameStateDao.saveGameState(state.copy(lastLoginTime = System.currentTimeMillis()))
    }

    suspend fun recordArenaWin() = gameStateDao.recordArenaWin()
    suspend fun recordArenaLoss() = gameStateDao.recordArenaLoss()

    suspend fun claimDailyReward(): Map<String, Int>? {
        val state = gameStateDao.getGameStateOnce() ?: return null
        val now = System.currentTimeMillis()
        val oneDayMs = 24 * 60 * 60 * 1000L
        if (now - state.lastDailyRewardTime < oneDayMs) return null
        val day = ((state.dailyStreakDays % 7) + 1)
        val rewards = mutableMapOf<String, Int>()
        when (day) {
            1 -> { rewards["gold"] = 200; gameStateDao.addGold(200) }
            2 -> { rewards["gold"] = 400; gameStateDao.addGold(400) }
            3 -> { rewards["gold"] = 600; rewards["gems"] = 5; gameStateDao.addGold(600); gameStateDao.addGems(5) }
            4 -> { rewards["gold"] = 800; gameStateDao.addGold(800) }
            5 -> { rewards["gold"] = 1000; rewards["essence"] = 20; gameStateDao.addGold(1000); gameStateDao.addEssence(20) }
            6 -> { rewards["gold"] = 500; rewards["gems"] = 15; gameStateDao.addGold(500); gameStateDao.addGems(15) }
            7 -> { rewards["gold"] = 2000; rewards["gems"] = 30; gameStateDao.addGold(2000); gameStateDao.addGems(30) }
        }
        val newStreak = if (now - state.lastDailyRewardTime < 2 * oneDayMs) state.dailyStreakDays + 1 else 1
        gameStateDao.saveGameState(state.copy(lastDailyRewardTime = now, dailyStreakDays = newStreak))
        return rewards
    }

    suspend fun spinWheel(): Pair<String, Int>? {
        val state = gameStateDao.getGameStateOnce() ?: return null
        val now = System.currentTimeMillis()
        val oneDayMs = 24 * 60 * 60 * 1000L
        if (now - state.lastWheelSpinTime < oneDayMs) return null
        val rand = java.util.Random()
        val outcomes = listOf(
            Pair("gold", 100), Pair("gold", 300), Pair("gold", 500),
            Pair("gems", 5), Pair("gems", 15), Pair("essence", 30),
            Pair("gold", 1000), Pair("gems", 50)
        )
        val result = outcomes[rand.nextInt(outcomes.size)]
        when (result.first) {
            "gold" -> gameStateDao.addGold(result.second.toLong())
            "gems" -> gameStateDao.addGems(result.second)
            "essence" -> gameStateDao.addEssence(result.second)
        }
        gameStateDao.saveGameState(state.copy(lastWheelSpinTime = now))
        return result
    }

    suspend fun checkOfflineProgress(): Map<String, Long> {
        val state = gameStateDao.getGameStateOnce() ?: return emptyMap()
        val now = System.currentTimeMillis()
        val offlineMs = minOf(now - state.lastLoginTime, 12 * 60 * 60 * 1000L)
        if (offlineMs < 60_000L) return emptyMap()
        val offlineHours = offlineMs / (60 * 60 * 1000.0)
        val passiveGold = (offlineHours * 50 * state.islandLevel).toLong()
        gameStateDao.addGold(passiveGold)
        gameStateDao.saveGameState(state.copy(lastLoginTime = now))
        return mapOf("gold" to passiveGold, "timeMs" to offlineMs)
    }

    suspend fun updateAchievementProgress(id: String, progress: Int) {
        val achievement = achievementDao.getAchievementById(id) ?: return
        val newProgress = minOf(progress, achievement.maxProgress)
        val isUnlocked = newProgress >= achievement.maxProgress
        achievementDao.updateProgress(id, newProgress, isUnlocked)
    }

    suspend fun claimAchievementReward(id: String) {
        val achievement = achievementDao.getAchievementById(id) ?: return
        if (!achievement.isUnlocked || achievement.rewardClaimed) return
        if (achievement.rewardGold > 0) gameStateDao.addGold(achievement.rewardGold.toLong())
        if (achievement.rewardGems > 0) gameStateDao.addGems(achievement.rewardGems)
        if (achievement.rewardEssence > 0) gameStateDao.addEssence(achievement.rewardEssence)
        achievementDao.claimReward(id)
    }
}
