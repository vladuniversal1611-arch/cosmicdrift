package com.hamsterkingdom.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.hamsterkingdom.data.models.*

class SaveManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("hamster_kingdom_save", Context.MODE_PRIVATE)
    private val gson: Gson = GsonBuilder().setPrettyPrinting().create()

    companion object {
        private const val KEY_SAVE_DATA = "save_data"
        private const val KEY_SETTINGS = "settings"
    }

    fun save(data: GameSaveData) {
        try {
            val json = gson.toJson(data.copy(lastSaveTime = System.currentTimeMillis()))
            prefs.edit().putString(KEY_SAVE_DATA, json).apply()
        } catch (e: Exception) {
            // Silently fail; next save will succeed
        }
    }

    fun load(): GameSaveData {
        val json = prefs.getString(KEY_SAVE_DATA, null) ?: return GameSaveData()
        return try {
            gson.fromJson(json, GameSaveData::class.java) ?: GameSaveData()
        } catch (e: Exception) {
            GameSaveData()
        }
    }

    fun calculateOfflineProgress(save: GameSaveData): OfflineProgress {
        val now = System.currentTimeMillis()
        val elapsedMs = (now - save.lastSaveTime).coerceAtMost(12 * 60 * 60 * 1000L)
        val elapsedHours = elapsedMs / 3600000.0

        val cheesePerHour = calculateCheesePerHour(save)
        val coinsPerHour = calculateCoinsPerHour(save)
        val depthPerHour = calculateDepthPerHour(save)

        val offlineCheese = (cheesePerHour * elapsedHours).toLong()
        val offlineCoins = (coinsPerHour * elapsedHours).toLong()
        val offlineDepth = (depthPerHour * elapsedHours).toFloat()

        // Stat decay
        val hungerDecay = (elapsedHours * 8f).toFloat().coerceAtMost(save.hamster.hunger)
        val thirstDecay = (elapsedHours * 10f).toFloat().coerceAtMost(save.hamster.thirst)
        val energyDecay = (elapsedHours * 5f).toFloat().coerceAtMost(save.hamster.energy)
        val cleanlinessDecay = (elapsedHours * 6f).toFloat().coerceAtMost(save.hamster.cleanliness)

        return OfflineProgress(
            elapsedMs = elapsedMs,
            cheeseEarned = offlineCheese,
            coinsEarned = offlineCoins,
            depthDug = offlineDepth,
            hungerDecay = hungerDecay,
            thirstDecay = thirstDecay,
            energyDecay = energyDecay,
            cleanlinessDecay = cleanlinessDecay
        )
    }

    private fun calculateCheesePerHour(save: GameSaveData): Long {
        var base = 60L
        val vaultLevel = save.rooms[RoomType.CHEESE_VAULT.name]?.level ?: 0
        base += vaultLevel * 50
        val happinessMultiplier = save.hamster.happiness / 100f
        val royalBonus = if ((save.rooms[RoomType.ROYAL_HALL.name]?.isBuilt) == true) {
            1f + (save.rooms[RoomType.ROYAL_HALL.name]?.level ?: 0) * 0.10f
        } else 1f
        return (base * happinessMultiplier * royalBonus).toLong()
    }

    private fun calculateCoinsPerHour(save: GameSaveData): Long {
        var base = 0L
        val treasuryLevel = save.rooms[RoomType.TREASURY.name]?.level ?: 0
        base += treasuryLevel * 20
        val mineLevel = save.rooms[RoomType.GOLD_MINE.name]?.level ?: 0
        base += mineLevel * 50
        return base
    }

    private fun calculateDepthPerHour(save: GameSaveData): Float {
        val digSpeed = save.hamster.digSpeed
        return digSpeed * 30f
    }

    fun clearSave() {
        prefs.edit().remove(KEY_SAVE_DATA).apply()
    }
}

data class OfflineProgress(
    val elapsedMs: Long,
    val cheeseEarned: Long,
    val coinsEarned: Long,
    val depthDug: Float,
    val hungerDecay: Float,
    val thirstDecay: Float,
    val energyDecay: Float,
    val cleanlinessDecay: Float
) {
    val elapsedHours: Double get() = elapsedMs / 3600000.0
    val elapsedMinutes: Long get() = elapsedMs / 60000L
}
