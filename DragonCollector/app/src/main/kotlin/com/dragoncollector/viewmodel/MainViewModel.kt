package com.dragoncollector.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.dragoncollector.data.DragonDatabase
import com.dragoncollector.data.models.*
import com.dragoncollector.data.repository.GameRepository
import com.dragoncollector.game.ExpeditionData
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

data class MainUiState(
    val gameState: GameState = GameState(),
    val ownedDragons: List<Dragon> = emptyList(),
    val allDragons: List<Dragon> = emptyList(),
    val hatchingDragons: List<Dragon> = emptyList(),
    val expeditionDragons: List<Dragon> = emptyList(),
    val buildings: List<Building> = emptyList(),
    val achievements: List<Achievement> = emptyList(),
    val isLoading: Boolean = true,
    val offlineRewards: Map<String, Long>? = null,
    val lastExpeditionResult: ExpeditionResult? = null,
    val message: String? = null,
    val newlyUnlockedAchievements: List<Achievement> = emptyList()
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val db = DragonDatabase.getDatabase(application)
    val repository = GameRepository(
        db.dragonDao(), db.buildingDao(), db.gameStateDao(), db.achievementDao()
    )

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.initializeIfNeeded()
            val offlineRewards = repository.checkOfflineProgress()
            collectFlows()
            if (offlineRewards.isNotEmpty()) {
                _uiState.update { it.copy(offlineRewards = offlineRewards) }
            }
            startHatchingTimer()
        }
    }

    private fun collectFlows() {
        viewModelScope.launch {
            combine(
                repository.gameState,
                repository.ownedDragons,
                repository.allDragons,
                repository.hatchingDragons,
                repository.expeditionDragons
            ) { state, owned, all, hatching, expeditions ->
                MainUiState(
                    gameState = state,
                    ownedDragons = owned,
                    allDragons = all,
                    hatchingDragons = hatching,
                    expeditionDragons = expeditions,
                    isLoading = false
                )
            }.combine(repository.allBuildings) { partial, buildings ->
                partial.copy(buildings = buildings)
            }.combine(repository.allAchievements) { partial, achievements ->
                partial.copy(achievements = achievements)
            }.collect { state ->
                _uiState.update { current ->
                    state.copy(
                        offlineRewards = current.offlineRewards,
                        lastExpeditionResult = current.lastExpeditionResult,
                        message = current.message
                    )
                }
            }
        }
    }

    private fun startHatchingTimer() {
        viewModelScope.launch {
            while (true) {
                delay(5_000L)
                val hatching = _uiState.value.hatchingDragons
                hatching.filter { it.isReadyToHatch }.forEach { dragon ->
                    repository.completeHatching(dragon.id)
                    showMessage("${dragon.name} вилупився! 🐉")
                }
            }
        }
    }

    fun dismissOfflineRewards() = _uiState.update { it.copy(offlineRewards = null) }
    fun dismissExpeditionResult() = _uiState.update { it.copy(lastExpeditionResult = null) }
    fun dismissMessage() = _uiState.update { it.copy(message = null) }

    private fun showMessage(msg: String) = _uiState.update { it.copy(message = msg) }

    fun collectHatchedDragon(dragonId: String) {
        viewModelScope.launch {
            repository.completeHatching(dragonId)
            val dragon = uiState.value.allDragons.find { it.id == dragonId }
            showMessage("🐉 ${dragon?.name ?: "Дракон"} вилупився!")
            checkAchievements()
        }
    }

    fun startHatching(dragonId: String) {
        viewModelScope.launch {
            val success = repository.startHatching(dragonId)
            if (!success) showMessage("Не вдалося почати інкубацію")
        }
    }

    fun instantHatch(dragonId: String) {
        viewModelScope.launch {
            val success = repository.instantHatch(dragonId)
            if (success) showMessage("Дракон вилупився миттєво! ✨")
            else showMessage("Недостатньо кристалів (потрібно 10 💎)")
        }
    }

    fun startExpedition(dragonId: String, locationId: String) {
        viewModelScope.launch {
            val success = repository.startExpedition(dragonId, locationId)
            val location = ExpeditionData.ALL_LOCATIONS.find { it.id == locationId }
            if (success) showMessage("${location?.emoji ?: ""} Дракон вирушив у ${location?.name}!")
            else showMessage("Не вдалося відправити дракона на експедицію")
        }
    }

    fun collectExpedition(dragonId: String) {
        viewModelScope.launch {
            val result = repository.collectExpedition(dragonId)
            if (result != null) {
                _uiState.update { it.copy(lastExpeditionResult = result) }
                checkAchievements()
            }
        }
    }

    fun mergeDragons(dragon1Id: String, dragon2Id: String) {
        viewModelScope.launch {
            val result = repository.mergeDragons(dragon1Id, dragon2Id)
            if (result != null) {
                showMessage("✨ Злиття успішне! Отримано: ${result.name}")
                checkAchievements()
            } else {
                showMessage("Не вдалося злити драконів")
            }
        }
    }

    fun upgradeBuilding(buildingId: String) {
        viewModelScope.launch {
            val success = repository.upgradeBuilding(buildingId)
            if (!success) showMessage("Недостатньо золота для покращення!")
            else checkAchievements()
        }
    }

    fun claimDailyReward() {
        viewModelScope.launch {
            val rewards = repository.claimDailyReward()
            if (rewards != null) {
                val msg = buildString {
                    append("🎁 Щоденна нагорода: ")
                    rewards["gold"]?.let { append("+$it 🪙 ") }
                    rewards["gems"]?.let { append("+$it 💎 ") }
                    rewards["essence"]?.let { append("+$it ✨") }
                }
                showMessage(msg)
                checkAchievements()
            } else {
                showMessage("Нагорода вже отримана сьогодні!")
            }
        }
    }

    fun spinWheel() {
        viewModelScope.launch {
            val result = repository.spinWheel()
            if (result != null) {
                val emoji = when (result.first) { "gold" -> "🪙"; "gems" -> "💎"; else -> "✨" }
                showMessage("🎡 Колесо: +${result.second} $emoji")
                checkAchievements()
            } else {
                showMessage("Колесо можна крутити раз на день!")
            }
        }
    }

    fun fightArena(teamIds: List<String>, enemyPower: Int): Boolean {
        val dragons = _uiState.value.ownedDragons.filter { it.id in teamIds }
        val totalPower = dragons.sumOf { it.powerForLevel }
        val win = totalPower >= enemyPower
        viewModelScope.launch {
            if (win) {
                repository.recordArenaWin()
                val reward = 100 + enemyPower / 10
                repository.addGold(reward.toLong())
                showMessage("⚔️ Перемога! +$reward 🪙")
            } else {
                repository.recordArenaLoss()
                showMessage("💀 Поразка. Підсили своїх драконів!")
            }
            checkAchievements()
        }
        return win
    }

    fun claimAchievement(id: String) {
        viewModelScope.launch { repository.claimAchievementReward(id) }
    }

    private suspend fun checkAchievements() {
        val state = repository.getGameStateOnce() ?: return
        val owned = _uiState.value.ownedDragons

        repository.updateAchievementProgress("col_1", minOf(owned.size, 1))
        repository.updateAchievementProgress("col_5", owned.size)
        repository.updateAchievementProgress("col_10", owned.size)
        repository.updateAchievementProgress("col_25", owned.size)
        repository.updateAchievementProgress("col_50", owned.size)
        repository.updateAchievementProgress("col_75", owned.size)
        repository.updateAchievementProgress("col_100", owned.size)

        repository.updateAchievementProgress("exp_1", state.totalExpeditionsCompleted)
        repository.updateAchievementProgress("exp_10", state.totalExpeditionsCompleted)
        repository.updateAchievementProgress("exp_50", state.totalExpeditionsCompleted)
        repository.updateAchievementProgress("exp_100", state.totalExpeditionsCompleted)
        repository.updateAchievementProgress("exp_500", state.totalExpeditionsCompleted)

        repository.updateAchievementProgress("mer_1", state.totalMerges)
        repository.updateAchievementProgress("mer_10", state.totalMerges)
        repository.updateAchievementProgress("mer_50", state.totalMerges)

        repository.updateAchievementProgress("arena_1", state.totalArenaWins)
        repository.updateAchievementProgress("arena_10", state.totalArenaWins)
        repository.updateAchievementProgress("arena_50", state.totalArenaWins)
        repository.updateAchievementProgress("arena_100", state.totalArenaWins)

        val rareCount = owned.count { it.rarity == Rarity.RARE }
        val epicCount = owned.count { it.rarity == Rarity.EPIC }
        val legendaryCount = owned.count { it.rarity == Rarity.LEGENDARY }
        repository.updateAchievementProgress("rar_rare", minOf(rareCount, 1))
        repository.updateAchievementProgress("rar_epic", minOf(epicCount, 1))
        repository.updateAchievementProgress("rar_legendary", minOf(legendaryCount, 1))
        repository.updateAchievementProgress("rar_5_rare", rareCount)
        repository.updateAchievementProgress("rar_5_epic", epicCount)

        repository.updateAchievementProgress("daily_7", state.dailyStreakDays)
        repository.updateAchievementProgress("daily_30", state.dailyStreakDays)
        repository.updateAchievementProgress("daily_100", state.dailyStreakDays)

        repository.updateAchievementProgress("island_level_5", state.islandLevel)
        repository.updateAchievementProgress("island_level_10", state.islandLevel)

        val goldProgress = minOf(state.gold.toInt(), 100000)
        repository.updateAchievementProgress("spec_1000_gold", minOf(state.gold.toInt(), 1000))
        repository.updateAchievementProgress("spec_10000_gold", minOf(state.gold.toInt(), 10000))
    }
}
