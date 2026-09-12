package com.hamsterkingdom.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.hamsterkingdom.data.GameSaveData
import com.hamsterkingdom.data.OfflineProgress
import com.hamsterkingdom.data.SaveManager
import com.hamsterkingdom.data.models.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.pow
import kotlin.random.Random

class GameViewModel(application: Application) : AndroidViewModel(application) {

    private val saveManager = SaveManager(application)
    private val _state = MutableStateFlow(GameSaveData())
    val state: StateFlow<GameSaveData> = _state.asStateFlow()

    private val _offlineProgress = MutableStateFlow<OfflineProgress?>(null)
    val offlineProgress: StateFlow<OfflineProgress?> = _offlineProgress.asStateFlow()

    private val _notification = MutableStateFlow<String?>(null)
    val notification: StateFlow<String?> = _notification.asStateFlow()

    private val _particles = MutableStateFlow<List<Particle>>(emptyList())
    val particles: StateFlow<List<Particle>> = _particles.asStateFlow()

    private var gameLoopJob: Job? = null
    private var saveJob: Job? = null
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    init {
        loadGame()
        startGameLoop()
        startAutoSave()
    }

    private fun loadGame() {
        val saved = saveManager.load()
        val offline = saveManager.calculateOfflineProgress(saved)
        val today = dateFormat.format(Date())

        // Handle offline progress
        val updatedSave = applyOfflineProgress(saved, offline)

        // Handle daily tasks refresh
        val finalSave = if (updatedSave.lastDailyTaskDate != today) {
            updatedSave.copy(
                dailyTasks = generateDailyTasks(System.currentTimeMillis() / 86400000L),
                lastDailyTaskDate = today
            )
        } else updatedSave

        // Handle login streak
        val yesterday = dateFormat.format(Date(System.currentTimeMillis() - 86400000L))
        val streak = when (finalSave.lastLoginDate) {
            today -> finalSave.loginStreak
            yesterday -> finalSave.loginStreak + 1
            else -> 1
        }

        _state.value = finalSave.copy(lastLoginDate = today, loginStreak = streak)

        if (offline.elapsedMinutes > 5) {
            _offlineProgress.value = offline
        }
    }

    private fun applyOfflineProgress(save: GameSaveData, offline: OfflineProgress): GameSaveData {
        if (offline.elapsedMs < 60_000L) return save

        val multiplier = if (save.premiumPass) 2f else 1f
        val newCheese = (save.resources.cheese + offline.cheeseEarned * multiplier).toLong()
        val newCoins = (save.resources.coins + offline.coinsEarned * multiplier).toLong()
        val newDepth = save.tunnel.currentDepth + offline.depthDug

        val newHamster = save.hamster.copy(
            hunger = (save.hamster.hunger - offline.hungerDecay).coerceAtLeast(0f),
            thirst = (save.hamster.thirst - offline.thirstDecay).coerceAtLeast(0f),
            energy = (save.hamster.energy - offline.energyDecay).coerceAtLeast(0f),
            cleanliness = (save.hamster.cleanliness - offline.cleanlinessDecay).coerceAtLeast(0f)
        )

        return save.copy(
            hamster = newHamster,
            resources = save.resources.copy(cheese = newCheese, coins = newCoins),
            tunnel = save.tunnel.copy(currentDepth = newDepth),
            totalCheeseEarned = save.totalCheeseEarned + offline.cheeseEarned,
            totalDepthDug = save.totalDepthDug + offline.depthDug
        )
    }

    private fun startGameLoop() {
        gameLoopJob = viewModelScope.launch {
            while (isActive) {
                delay(1000L)
                tick()
            }
        }
    }

    private fun startAutoSave() {
        saveJob = viewModelScope.launch {
            while (isActive) {
                delay(30_000L)
                saveManager.save(_state.value)
            }
        }
    }

    private fun tick() {
        _state.update { s ->
            val rooms = s.rooms
            val bedroomLevel = rooms[RoomType.BEDROOM.name]?.level ?: 0
            val royalBonus = 1f + (rooms[RoomType.ROYAL_HALL.name]?.level ?: 0) * 0.10f
            val parkLevel = rooms[RoomType.UNDERGROUND_PARK.name]?.level ?: 0

            // Stat decay per second
            val hungerDecay = 8f / 3600f
            val thirstDecay = 10f / 3600f
            val energyDecay = 5f / 3600f
            val cleanDecay = 6f / 3600f
            val moodDecay = 4f / 3600f
            val energyRegen = bedroomLevel * 2f / 3600f
            val moodRegen = parkLevel * 1.5f / 3600f

            val newHamster = s.hamster.copy(
                hunger = (s.hamster.hunger - hungerDecay).coerceIn(0f, 100f),
                thirst = (s.hamster.thirst - thirstDecay).coerceIn(0f, 100f),
                energy = (s.hamster.energy - energyDecay + energyRegen).coerceIn(0f, 100f),
                cleanliness = (s.hamster.cleanliness - cleanDecay).coerceIn(0f, 100f),
                mood = (s.hamster.mood - moodDecay + moodRegen).coerceIn(0f, 100f)
            )

            // Cheese production per second
            val vaultLevel = rooms[RoomType.CHEESE_VAULT.name]?.level ?: 0
            val cheesePerSec = ((60L + vaultLevel * 50) * newHamster.digSpeed * royalBonus / 3600f).toLong().coerceAtLeast(0L)

            // Coin production per second
            val treasuryLevel = rooms[RoomType.TREASURY.name]?.level ?: 0
            val mineLevel = rooms[RoomType.GOLD_MINE.name]?.level ?: 0
            val coinsPerSec = ((treasuryLevel * 20 + mineLevel * 50).toLong() / 3600L)

            // Carrot production
            val farmLevel = rooms[RoomType.CARROT_FARM.name]?.level ?: 0
            val carrotsPerSec = farmLevel * 5L / 3600L

            // Tunnel digging
            val depthGain = if (newHamster.energy > 10f) newHamster.digSpeed * 10f / 3600f else 0f
            val newDepth = s.tunnel.currentDepth + depthGain

            // XP gain
            val xpGain = (newHamster.digSpeed * 2f / 3600f * 60).toLong().coerceAtLeast(0L)
            val newXp = s.hamster.xp + xpGain
            val (finalHamster, leveledUp) = checkLevelUp(newHamster.copy(xp = newXp))

            val newCheese = s.resources.cheese + cheesePerSec
            val newCoins = s.resources.coins + coinsPerSec
            val newCarrots = s.resources.carrots + carrotsPerSec

            // Random tunnel reward
            val tunnelReward = if (depthGain > 0f && Random.nextFloat() < 0.01f) generateTunnelReward(newDepth) else null
            var updatedResources = s.resources.copy(cheese = newCheese, coins = newCoins, carrots = newCarrots)
            var notification: String? = null

            if (tunnelReward != null) {
                updatedResources = applyReward(updatedResources, tunnelReward)
                notification = "Found ${tunnelReward.type.emoji} ${tunnelReward.type.displayName}!"
                if (tunnelReward.amount > 1) notification += " x${tunnelReward.amount}"
            }

            if (leveledUp) {
                notification = "🎉 Level up! Now level ${finalHamster.level}!"
            }

            if (notification != null) _notification.value = notification

            s.copy(
                hamster = finalHamster,
                resources = updatedResources,
                tunnel = s.tunnel.copy(currentDepth = newDepth),
                totalCheeseEarned = s.totalCheeseEarned + cheesePerSec,
                totalCoinsEarned = s.totalCoinsEarned + coinsPerSec,
                totalDepthDug = s.totalDepthDug + depthGain,
                totalPlayMinutes = s.totalPlayMinutes + 1L / 60L
            )
        }
    }

    private fun checkLevelUp(hamster: HamsterData): Pair<HamsterData, Boolean> {
        if (hamster.xp >= hamster.xpToNextLevel) {
            return hamster.copy(level = hamster.level + 1, xp = hamster.xp - hamster.xpToNextLevel) to true
        }
        return hamster to false
    }

    private fun generateTunnelReward(depth: Float): TunnelReward {
        val rarityRoll = Random.nextFloat()
        val deepBonus = (depth / 1000f).coerceAtMost(1f)

        return when {
            rarityRoll < 0.01f + deepBonus * 0.05f -> TunnelReward(TunnelRewardType.CRYSTALS, Random.nextLong(1, 4))
            rarityRoll < 0.05f + deepBonus * 0.1f -> TunnelReward(TunnelRewardType.RARE_TREASURE, 1)
            rarityRoll < 0.15f + deepBonus * 0.1f -> TunnelReward(TunnelRewardType.COINS, Random.nextLong(10, 50))
            rarityRoll > 0.95f -> TunnelReward(TunnelRewardType.TRAP, 1)
            else -> TunnelReward(TunnelRewardType.CHEESE, Random.nextLong(5, 30))
        }
    }

    private fun applyReward(resources: Resources, reward: TunnelReward): Resources = when (reward.type) {
        TunnelRewardType.CHEESE -> resources.copy(cheese = resources.cheese + reward.amount)
        TunnelRewardType.COINS -> resources.copy(coins = resources.coins + reward.amount)
        TunnelRewardType.CRYSTALS -> resources.copy(crystals = resources.crystals + reward.amount)
        TunnelRewardType.CARROT -> resources.copy(carrots = resources.carrots + reward.amount)
        TunnelRewardType.TRAP -> resources.copy(cheese = (resources.cheese - reward.amount * 5).coerceAtLeast(0))
        else -> resources
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    fun feedHamster() {
        _state.update { s ->
            if (s.resources.carrots < 1 && s.resources.cheese < 5) {
                _notification.value = "Not enough food!"
                return@update s
            }
            val costCarrots = if (s.resources.carrots >= 1) 1L else 0L
            val costCheese = if (costCarrots == 0L) 5L else 0L
            val newHunger = (s.hamster.hunger + 25f).coerceAtMost(100f)
            val newMood = (s.hamster.mood + 5f).coerceAtMost(100f)
            val newXp = s.hamster.xp + 5L
            _notification.value = "Yummy! Hammy is happy! 😋"
            spawnParticles("🧀")
            s.copy(
                hamster = s.hamster.copy(hunger = newHunger, mood = newMood, xp = newXp),
                resources = s.resources.copy(
                    carrots = s.resources.carrots - costCarrots,
                    cheese = s.resources.cheese - costCheese
                ),
                totalFeedCount = s.totalFeedCount + 1
            )
        }
        updateDailyTask("feed_3", 1)
        checkAchievement("feed_100")
    }

    fun giveWater() {
        _state.update { s ->
            val newThirst = (s.hamster.thirst + 30f).coerceAtMost(100f)
            val newMood = (s.hamster.mood + 3f).coerceAtMost(100f)
            _notification.value = "Refreshing! 💧"
            spawnParticles("💧")
            s.copy(hamster = s.hamster.copy(thirst = newThirst, mood = newMood))
        }
        updateDailyTask("water_hamster", 1)
    }

    fun cleanHamster() {
        _state.update { s ->
            val newClean = (s.hamster.cleanliness + 40f).coerceAtMost(100f)
            val newMood = (s.hamster.mood + 8f).coerceAtMost(100f)
            _notification.value = "Squeaky clean! 🛁"
            spawnParticles("✨")
            s.copy(
                hamster = s.hamster.copy(cleanliness = newClean, mood = newMood),
                totalCleanCount = s.totalCleanCount + 1
            )
        }
        updateDailyTask("clean_hamster", 1)
        checkAchievement("clean_50")
    }

    fun playWithHamster() {
        _state.update { s ->
            if (s.hamster.energy < 10f) {
                _notification.value = "Hammy is too tired to play! 😴"
                return@update s
            }
            val newMood = (s.hamster.mood + 20f).coerceAtMost(100f)
            val newEnergy = (s.hamster.energy - 10f).coerceAtLeast(0f)
            val newXp = s.hamster.xp + 10L
            _notification.value = "So much fun! 🎉"
            spawnParticles("🎉")
            s.copy(hamster = s.hamster.copy(mood = newMood, energy = newEnergy, xp = newXp))
        }
    }

    fun buildRoom(roomType: RoomType) {
        _state.update { s ->
            val room = s.rooms[roomType.name] ?: return@update s
            if (room.isBuilt) { _notification.value = "Already built!"; return@update s }
            if (s.hamster.level < roomType.unlockLevel) {
                _notification.value = "Need level ${roomType.unlockLevel}!"; return@update s
            }
            if (s.resources.coins < roomType.baseCost) {
                _notification.value = "Need ${roomType.baseCost} coins!"; return@update s
            }
            val newRooms = s.rooms.toMutableMap()
            newRooms[roomType.name] = room.copy(isBuilt = true, isUnlocked = true, level = 1)
            _notification.value = "${roomType.emoji} ${roomType.displayName} built!"
            spawnParticles("🏗️")
            s.copy(
                rooms = newRooms,
                resources = s.resources.copy(coins = s.resources.coins - roomType.baseCost)
            )
        }
        updateDailyTask("upgrade_room", 1)
        checkAchievement("rooms_3")
        checkAchievement("rooms_5")
        checkAchievement("rooms_all")
    }

    fun upgradeRoom(roomType: RoomType) {
        _state.update { s ->
            val room = s.rooms[roomType.name] ?: return@update s
            if (!room.isBuilt) { _notification.value = "Build it first!"; return@update s }
            if (room.isMaxLevel) { _notification.value = "Already max level!"; return@update s }
            if (s.resources.coins < room.upgradeCost) {
                _notification.value = "Need ${room.upgradeCost} coins!"; return@update s
            }
            val newRooms = s.rooms.toMutableMap()
            val newLevel = room.level + 1
            newRooms[roomType.name] = room.copy(level = newLevel)
            _notification.value = "${roomType.emoji} ${roomType.displayName} upgraded to Lv.$newLevel!"
            spawnParticles("⬆️")
            s.copy(
                rooms = newRooms,
                resources = s.resources.copy(coins = s.resources.coins - room.upgradeCost)
            )
        }
        updateDailyTask("upgrade_room", 1)
        checkAchievement("room_max")
        checkAchievement("rooms_all_max")
    }

    fun collectOfflineRewards() {
        _offlineProgress.value = null
    }

    fun dismissNotification() {
        _notification.value = null
    }

    fun addMinigameReward(cheese: Long = 0, coins: Long = 0, crystals: Long = 0, xp: Long = 0) {
        _state.update { s ->
            val newXp = s.hamster.xp + xp
            val (newHamster, _) = checkLevelUp(s.hamster.copy(xp = newXp))
            s.copy(
                hamster = newHamster,
                resources = s.resources.copy(
                    cheese = s.resources.cheese + cheese,
                    coins = s.resources.coins + coins,
                    crystals = s.resources.crystals + crystals
                ),
                totalCheeseEarned = s.totalCheeseEarned + cheese,
                totalCoinsEarned = s.totalCoinsEarned + coins,
                totalCrystalsEarned = s.totalCrystalsEarned + crystals
            )
        }
        if (cheese > 0) updateDailyTask("collect_cheese", cheese)
        updateDailyTask("play_minigame", 1)
    }

    fun recordWheelSpin() {
        _state.update { s -> s.copy(totalWheelSpins = s.totalWheelSpins + 1) }
        checkAchievement("wheel_spin_10")
    }

    fun buyCollectionItem(itemId: String) {
        _state.update { s ->
            val item = s.collection.find { it.id == itemId } ?: return@update s
            if (item.isOwned) return@update s
            val cost = when (item.rarity) {
                Rarity.COMMON -> 100L; Rarity.UNCOMMON -> 300L; Rarity.RARE -> 800L
                Rarity.EPIC -> 2000L; Rarity.LEGENDARY -> 5000L
            }
            if (s.resources.coins < cost) { _notification.value = "Need $cost coins!"; return@update s }
            val newCollection = s.collection.map { if (it.id == itemId) it.copy(isOwned = true) else it }
            _notification.value = "Got ${item.emoji} ${item.name}!"
            spawnParticles(item.emoji)
            s.copy(
                collection = newCollection,
                resources = s.resources.copy(coins = s.resources.coins - cost)
            )
        }
    }

    fun equipCollectionItem(itemId: String) {
        _state.update { s ->
            val item = s.collection.find { it.id == itemId } ?: return@update s
            if (!item.isOwned) return@update s
            val newCollection = s.collection.map { c ->
                when {
                    c.id == itemId -> c.copy(isEquipped = !c.isEquipped)
                    c.category == item.category && c.isEquipped -> c.copy(isEquipped = false)
                    else -> c
                }
            }
            val equippedItem = newCollection.find { it.id == itemId }
            if (equippedItem?.isEquipped == true) _notification.value = "Equipped ${item.emoji}!"
            val newHamster = updateHamsterCosmetics(s.hamster, newCollection)
            s.copy(collection = newCollection, hamster = newHamster)
        }
    }

    private fun updateHamsterCosmetics(hamster: HamsterData, collection: List<CollectionItem>): HamsterData {
        val hat = collection.find { it.category == CollectionCategory.HATS && it.isEquipped }?.id ?: "none"
        val glasses = collection.find { it.category == CollectionCategory.GLASSES && it.isEquipped }?.id ?: "none"
        val costume = collection.find { it.category == CollectionCategory.COSTUMES && it.isEquipped }?.id ?: "default"
        return hamster.copy(hat = hat, glasses = glasses, costume = costume)
    }

    fun adoptPet(petType: PetType) {
        _state.update { s ->
            val pet = s.pets.find { it.type == petType } ?: return@update s
            if (pet.isOwned) return@update s
            val cost = 1000L * (petType.ordinal + 1)
            if (s.resources.coins < cost) { _notification.value = "Need $cost coins!"; return@update s }
            if (s.hamster.level < petType.unlockLevel) {
                _notification.value = "Need level ${petType.unlockLevel}!"; return@update s
            }
            val newPets = s.pets.map { if (it.type == petType) it.copy(isOwned = true, isActive = true) else it }
            _notification.value = "Adopted ${petType.emoji} ${petType.displayName}!"
            spawnParticles(petType.emoji)
            s.copy(pets = newPets, resources = s.resources.copy(coins = s.resources.coins - cost))
        }
        checkAchievement("pet_first")
        checkAchievement("pets_all")
    }

    private fun updateDailyTask(taskId: String, increment: Long) {
        _state.update { s ->
            val newTasks = s.dailyTasks.map { task ->
                if (task.id.startsWith(taskId) && !task.isCompleted) {
                    val newValue = task.currentValue + increment
                    val completed = newValue >= task.targetValue
                    if (completed && !task.isCompleted) {
                        viewModelScope.launch {
                            _notification.value = "Task complete: ${task.description}! 🎉"
                            _state.update { ss ->
                                ss.copy(resources = ss.resources.copy(
                                    coins = ss.resources.coins + task.rewardCoins,
                                    cheese = ss.resources.cheese + task.rewardCheese,
                                    crystals = ss.resources.crystals + task.rewardCrystals
                                ))
                            }
                        }
                    }
                    task.copy(currentValue = newValue.coerceAtMost(task.targetValue), isCompleted = completed)
                } else task
            }
            s.copy(dailyTasks = newTasks)
        }
    }

    private fun checkAchievement(achievementId: String) {
        val s = _state.value
        val ach = s.achievements.find { it.id == achievementId } ?: return
        if (ach.isUnlocked) return
        val currentValue = when (achievementId) {
            "cheese_100", "cheese_1000", "cheese_10000", "cheese_100000", "cheese_1000000" -> s.totalCheeseEarned
            "dig_10", "dig_100", "dig_500", "dig_1000" -> s.totalDepthDug.toLong()
            "dig_tunnels_100" -> s.totalTunnelTrips.toLong()
            "rooms_3", "rooms_5", "rooms_all" -> s.rooms.values.count { it.isBuilt }.toLong()
            "room_max" -> if (s.rooms.values.any { it.level >= 5 }) 1L else 0L
            "rooms_all_max" -> s.rooms.values.count { it.level >= 5 }.toLong()
            "level_5", "level_10", "level_20", "level_50", "level_100", "hamster_max_level" -> s.hamster.level.toLong()
            "collect_5", "collect_10", "collect_all" -> s.collection.count { it.isOwned }.toLong()
            "pet_first" -> if (s.pets.any { it.isOwned }) 1L else 0L
            "pets_all" -> s.pets.count { it.isOwned }.toLong()
            "feed_100" -> s.totalFeedCount.toLong()
            "clean_50" -> s.totalCleanCount.toLong()
            "wheel_spin_10" -> s.totalWheelSpins.toLong()
            "coins_1000", "coins_10000", "coins_100000" -> s.totalCoinsEarned
            "crystals_10", "crystals_100" -> s.totalCrystalsEarned
            "rare_find_5", "rare_find_25" -> s.totalRareFinds.toLong()
            else -> 0L
        }
        if (currentValue >= ach.targetValue) {
            _state.update { ss ->
                val newAchs = ss.achievements.map { a ->
                    if (a.id == achievementId) a.copy(isUnlocked = true, currentValue = currentValue) else a
                }
                _notification.value = "🏆 Achievement: ${ach.title}!"
                ss.copy(
                    achievements = newAchs,
                    resources = ss.resources.copy(
                        coins = ss.resources.coins + ach.rewardCoins,
                        crystals = ss.resources.crystals + ach.rewardCrystals
                    )
                )
            }
        } else {
            _state.update { ss ->
                val newAchs = ss.achievements.map { a ->
                    if (a.id == achievementId) a.copy(currentValue = currentValue) else a
                }
                ss.copy(achievements = newAchs)
            }
        }
    }

    private fun spawnParticles(emoji: String) {
        val newParticles = (0 until 6).map { i ->
            Particle(
                id = System.currentTimeMillis() + i,
                emoji = emoji,
                x = Random.nextFloat(),
                y = 0.5f,
                velocityX = (Random.nextFloat() - 0.5f) * 0.3f,
                velocityY = -(Random.nextFloat() * 0.4f + 0.1f),
                alpha = 1f,
                scale = Random.nextFloat() * 0.5f + 0.8f
            )
        }
        _particles.update { it + newParticles }
        viewModelScope.launch {
            delay(1500)
            _particles.update { list -> list.filter { p -> newParticles.none { it.id == p.id } } }
        }
    }

    fun cheesePerSecond(): Float {
        val s = _state.value
        val vaultLevel = s.rooms[RoomType.CHEESE_VAULT.name]?.level ?: 0
        val royalBonus = 1f + (s.rooms[RoomType.ROYAL_HALL.name]?.level ?: 0) * 0.10f
        return (60f + vaultLevel * 50f) * s.hamster.digSpeed * royalBonus / 3600f
    }

    fun coinsPerSecond(): Float {
        val s = _state.value
        val treasuryLevel = s.rooms[RoomType.TREASURY.name]?.level ?: 0
        val mineLevel = s.rooms[RoomType.GOLD_MINE.name]?.level ?: 0
        return (treasuryLevel * 20f + mineLevel * 50f) / 3600f
    }

    override fun onCleared() {
        super.onCleared()
        saveManager.save(_state.value)
    }
}

data class Particle(
    val id: Long,
    val emoji: String,
    val x: Float,
    val y: Float,
    val velocityX: Float,
    val velocityY: Float,
    val alpha: Float,
    val scale: Float
)
