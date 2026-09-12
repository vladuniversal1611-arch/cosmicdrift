package com.hamsterkingdom.data.models

import kotlin.math.pow

// ── Hamster ──────────────────────────────────────────────────────────────────

data class HamsterData(
    val name: String = "Hammy",
    val hunger: Float = 80f,
    val thirst: Float = 80f,
    val mood: Float = 80f,
    val energy: Float = 80f,
    val cleanliness: Float = 80f,
    val level: Int = 1,
    val xp: Long = 0L,
    val costume: String = "default",
    val hat: String = "none",
    val glasses: String = "none"
) {
    val xpToNextLevel: Long get() = (100 * level.toDouble().pow(1.5)).toLong()
    val digSpeed: Float get() {
        val moodMult = mood / 100f
        val energyMult = energy / 100f
        return (1f + moodMult * 0.5f + energyMult * 0.5f).coerceAtLeast(0.1f)
    }
    val happiness: Float get() = (hunger + thirst + mood + energy + cleanliness) / 5f
    val isSad: Boolean get() = happiness < 40f
    val isHappy: Boolean get() = happiness > 70f
}

// ── Resources ─────────────────────────────────────────────────────────────────

data class Resources(
    val cheese: Long = 50L,
    val coins: Long = 0L,
    val crystals: Long = 0L,
    val power: Long = 10L,
    val carrots: Long = 20L
)

// ── Room System ───────────────────────────────────────────────────────────────

enum class RoomType(
    val displayName: String,
    val emoji: String,
    val description: String,
    val baseCost: Long,
    val unlockLevel: Int
) {
    BEDROOM("Bedroom", "🛏️", "Restores energy faster while sleeping", 0L, 1),
    CHEESE_VAULT("Cheese Vault", "🧀", "Increases cheese storage and production", 100L, 2),
    WORKSHOP("Workshop", "🔨", "Enables crafting of special items", 250L, 3),
    CARROT_FARM("Carrot Farm", "🥕", "Automatically produces carrots for food", 500L, 4),
    LABORATORY("Laboratory", "🔬", "Research upgrades and new technologies", 1000L, 6),
    TREASURY("Treasury", "💰", "Increases coin production and storage", 2000L, 8),
    ARENA("Arena", "⚔️", "Host battles for extra rewards", 4000L, 10),
    ROYAL_HALL("Royal Hall", "👑", "The throne room of the Hamster Kingdom", 8000L, 12),
    UNDERGROUND_PARK("Underground Park", "🌳", "Boosts mood for all hamsters", 6000L, 11),
    GOLD_MINE("Gold Mine", "⛏️", "Produces coins automatically", 3000L, 9)
}

data class RoomData(
    val type: RoomType,
    val level: Int = 0,
    val isUnlocked: Boolean = false,
    val isBuilt: Boolean = false
) {
    val maxLevel: Int = 5
    val upgradeCost: Long get() = (type.baseCost * (level + 1) * 1.5).toLong()
    val isMaxLevel: Boolean get() = level >= maxLevel

    fun bonusDescription(): String = when (type) {
        RoomType.BEDROOM -> "Energy regen +${level * 20}%"
        RoomType.CHEESE_VAULT -> "Cheese storage +${level * 500}, production +${level * 10}%"
        RoomType.WORKSHOP -> "Craft speed +${level * 25}%"
        RoomType.CARROT_FARM -> "+${level * 5} carrots/hr"
        RoomType.LABORATORY -> "Research speed +${level * 30}%"
        RoomType.TREASURY -> "+${level * 20} coins/hr"
        RoomType.ARENA -> "Battle rewards +${level * 15}%"
        RoomType.ROYAL_HALL -> "All bonuses +${level * 10}%"
        RoomType.UNDERGROUND_PARK -> "Mood +${level * 10} per hour"
        RoomType.GOLD_MINE -> "+${level * 50} coins/hr"
    }
}

// ── Tunnel System ─────────────────────────────────────────────────────────────

data class TunnelData(
    val currentDepth: Float = 0f,
    val maxDepth: Float = 0f,
    val isDigging: Boolean = false,
    val tunnelSegments: List<TunnelSegment> = emptyList()
)

data class TunnelSegment(
    val depth: Float,
    val reward: TunnelReward?,
    val isExplored: Boolean = false
)

enum class TunnelRewardType(val emoji: String, val displayName: String) {
    CHEESE("🧀", "Cheese"), COINS("💰", "Coins"), CRYSTALS("💎", "Crystal"),
    RARE_TREASURE("✨", "Rare Treasure"), COSTUME("👒", "Costume"),
    MAP_PIECE("🗺️", "Map Piece"), CARROT("🥕", "Carrot"), TRAP("⚠️", "Trap")
}

data class TunnelReward(
    val type: TunnelRewardType,
    val amount: Long = 1L,
    val itemId: String = ""
)

// ── Collection System ─────────────────────────────────────────────────────────

enum class CollectionCategory { HATS, GLASSES, COSTUMES, DECORATIONS, ARTIFACTS }

enum class Rarity(val displayName: String, val color: Long) {
    COMMON("Common", 0xFF9E9E9EL),
    UNCOMMON("Uncommon", 0xFF4CAF50L),
    RARE("Rare", 0xFF2196F3L),
    EPIC("Epic", 0xFF9C27B0L),
    LEGENDARY("Legendary", 0xFFFF9800L)
}

data class CollectionItem(
    val id: String,
    val name: String,
    val emoji: String,
    val category: CollectionCategory,
    val rarity: Rarity,
    val description: String,
    val bonus: String,
    val isOwned: Boolean = false,
    val isEquipped: Boolean = false
)

fun defaultCollection(): List<CollectionItem> = listOf(
    // Hats
    CollectionItem("hat_crown", "Royal Crown", "👑", CollectionCategory.HATS, Rarity.LEGENDARY, "The crown of Hamster Kingdom", "+25% all income", false),
    CollectionItem("hat_tophat", "Top Hat", "🎩", CollectionCategory.HATS, Rarity.RARE, "A dapper top hat", "+10% coins", false),
    CollectionItem("hat_cap", "Baseball Cap", "🧢", CollectionCategory.HATS, Rarity.COMMON, "A sporty cap", "+5% dig speed", false),
    CollectionItem("hat_bow", "Pink Bow", "🎀", CollectionCategory.HATS, Rarity.UNCOMMON, "A cute bow", "+8% mood gain", false),
    CollectionItem("hat_wizard", "Wizard Hat", "🧙", CollectionCategory.HATS, Rarity.EPIC, "A magical wizard hat", "+20% crystal chance", false),
    CollectionItem("hat_chef", "Chef Hat", "👨‍🍳", CollectionCategory.HATS, Rarity.RARE, "Cook the finest cheese", "+15% food bonus", false),
    // Glasses
    CollectionItem("glasses_sunglasses", "Sunglasses", "😎", CollectionCategory.GLASSES, Rarity.COMMON, "Cool shades", "+5% mood", false),
    CollectionItem("glasses_monocle", "Monocle", "🧐", CollectionCategory.GLASSES, Rarity.RARE, "Very distinguished", "+10% research", false),
    CollectionItem("glasses_3d", "3D Glasses", "🥽", CollectionCategory.GLASSES, Rarity.UNCOMMON, "See in three dimensions", "+8% crystal find", false),
    // Costumes
    CollectionItem("costume_knight", "Knight Armor", "⚔️", CollectionCategory.COSTUMES, Rarity.EPIC, "Brave knight armor", "+20% arena rewards", false),
    CollectionItem("costume_astronaut", "Space Suit", "👨‍🚀", CollectionCategory.COSTUMES, Rarity.LEGENDARY, "Explore beyond the tunnels", "+30% deep tunnel rewards", false),
    CollectionItem("costume_ninja", "Ninja Outfit", "🥷", CollectionCategory.COSTUMES, Rarity.RARE, "Silent and swift", "+15% dig speed", false),
    CollectionItem("costume_pirate", "Pirate Costume", "🏴‍☠️", CollectionCategory.COSTUMES, Rarity.RARE, "Arr, find the treasure!", "+20% rare item chance", false),
    CollectionItem("costume_king", "Royal Robes", "🤴", CollectionCategory.COSTUMES, Rarity.LEGENDARY, "Fit for the Hamster King", "+25% all production", false),
    CollectionItem("costume_default", "Fluffy Fur", "🐹", CollectionCategory.COSTUMES, Rarity.COMMON, "Natural hamster look", "Default outfit", true),
    // Artifacts
    CollectionItem("artifact_ancient_wheel", "Ancient Wheel", "⚙️", CollectionCategory.ARTIFACTS, Rarity.LEGENDARY, "A mysterious ancient hamster wheel", "+50% energy regen", false),
    CollectionItem("artifact_golden_cheese", "Golden Cheese", "🥇", CollectionCategory.ARTIFACTS, Rarity.LEGENDARY, "A legendary cheese sculpture", "+100% cheese income", false),
    CollectionItem("artifact_crystal_seed", "Crystal Seed", "🌱", CollectionCategory.ARTIFACTS, Rarity.EPIC, "Grows into a crystal tree", "+30% crystal income", false),
    CollectionItem("artifact_map_ancient", "Ancient Map", "🗺️", CollectionCategory.ARTIFACTS, Rarity.EPIC, "Shows secret tunnel paths", "+25% tunnel rewards", false)
)

// ── Pets ──────────────────────────────────────────────────────────────────────

enum class PetType(
    val displayName: String,
    val emoji: String,
    val ability: String,
    val unlockLevel: Int
) {
    MOUSE("Mouse", "🐭", "Collects small cheese bits automatically", 5),
    SQUIRREL("Squirrel", "🐿️", "Gathers nuts and extra carrots", 10),
    RABBIT("Rabbit", "🐇", "Digs tunnels 15% faster", 15),
    HEDGEHOG("Hedgehog", "🦔", "Defends against tunnel traps", 20)
}

data class PetData(
    val type: PetType,
    val level: Int = 1,
    val isOwned: Boolean = false,
    val isActive: Boolean = false
) {
    val productionBonus: Float get() = level * 0.05f
    val upgradeCost: Long get() = (500L * level * type.ordinal.plus(1))
}

// ── Achievements ──────────────────────────────────────────────────────────────

data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val emoji: String,
    val targetValue: Long,
    val currentValue: Long = 0L,
    val isUnlocked: Boolean = false,
    val rewardCoins: Long = 0L,
    val rewardCrystals: Long = 0L
) {
    val progress: Float get() = (currentValue.toFloat() / targetValue).coerceIn(0f, 1f)
}

fun defaultAchievements(): List<Achievement> = listOf(
    // Cheese achievements
    Achievement("cheese_100", "Cheese Lover", "Collect 100 cheese", "🧀", 100, rewardCoins = 50),
    Achievement("cheese_1000", "Cheese Hoarder", "Collect 1,000 cheese", "🧀", 1000, rewardCoins = 200),
    Achievement("cheese_10000", "Cheese Baron", "Collect 10,000 cheese", "🧀", 10000, rewardCoins = 1000),
    Achievement("cheese_100000", "Cheese King", "Collect 100,000 cheese", "👑", 100000, rewardCoins = 5000, rewardCrystals = 10),
    Achievement("cheese_1000000", "Cheese Emperor", "Collect 1,000,000 cheese", "🏆", 1000000, rewardCoins = 25000, rewardCrystals = 50),
    // Digging achievements
    Achievement("dig_10", "First Steps", "Dig 10m deep", "⛏️", 10, rewardCoins = 30),
    Achievement("dig_100", "Deep Digger", "Dig 100m deep", "⛏️", 100, rewardCoins = 100),
    Achievement("dig_500", "Tunnel Expert", "Dig 500m deep", "🕳️", 500, rewardCoins = 500),
    Achievement("dig_1000", "Master Miner", "Dig 1,000m deep", "⛏️", 1000, rewardCoins = 2000, rewardCrystals = 5),
    Achievement("dig_tunnels_100", "Tunnel Fanatic", "Complete 100 tunnel trips", "🚇", 100, rewardCoins = 300),
    // Room achievements
    Achievement("rooms_3", "Home Improver", "Build 3 rooms", "🏠", 3, rewardCoins = 150),
    Achievement("rooms_5", "Architect", "Build 5 rooms", "🏗️", 5, rewardCoins = 500),
    Achievement("rooms_all", "Kingdom Builder", "Build all 10 rooms", "🏰", 10, rewardCoins = 5000, rewardCrystals = 20),
    Achievement("room_max", "Perfectionist", "Max out any room to level 5", "⭐", 1, rewardCoins = 1000),
    Achievement("rooms_all_max", "Grand Architect", "Max out all rooms", "🌟", 10, rewardCoins = 20000, rewardCrystals = 100),
    // Level achievements
    Achievement("level_5", "Apprentice", "Reach level 5", "📈", 5, rewardCoins = 200),
    Achievement("level_10", "Journeyman", "Reach level 10", "📈", 10, rewardCoins = 500),
    Achievement("level_20", "Expert", "Reach level 20", "📈", 20, rewardCoins = 1500, rewardCrystals = 5),
    Achievement("level_50", "Master", "Reach level 50", "🏅", 50, rewardCoins = 5000, rewardCrystals = 25),
    Achievement("level_100", "Legend", "Reach level 100", "🏆", 100, rewardCoins = 20000, rewardCrystals = 100),
    // Collection achievements
    Achievement("collect_5", "Collector", "Own 5 collection items", "🎒", 5, rewardCoins = 100),
    Achievement("collect_10", "Enthusiast", "Own 10 collection items", "🎒", 10, rewardCoins = 300),
    Achievement("collect_all", "Complete Collector", "Own all collection items", "🏆", 19, rewardCoins = 10000, rewardCrystals = 50),
    // Pet achievements
    Achievement("pet_first", "Pet Owner", "Adopt your first pet", "🐾", 1, rewardCoins = 200),
    Achievement("pets_all", "Animal Kingdom", "Own all pets", "🦁", 4, rewardCoins = 2000, rewardCrystals = 10),
    // Hamster care achievements
    Achievement("feed_100", "Devoted Caretaker", "Feed your hamster 100 times", "🍽️", 100, rewardCoins = 200),
    Achievement("happy_24h", "Best Friends", "Keep happiness above 90% for 24 hours", "❤️", 24, rewardCoins = 500, rewardCrystals = 2),
    Achievement("clean_50", "Squeaky Clean", "Clean your hamster 50 times", "🛁", 50, rewardCoins = 150),
    // Daily tasks
    Achievement("tasks_7", "Consistent", "Complete daily tasks 7 days in a row", "📅", 7, rewardCoins = 500, rewardCrystals = 3),
    Achievement("tasks_30", "Dedicated", "Complete daily tasks 30 days in a row", "📅", 30, rewardCoins = 3000, rewardCrystals = 15),
    // Minigame achievements
    Achievement("cheese_dash_score", "Speed Runner", "Score 1000 in Cheese Dash", "🏃", 1000, rewardCoins = 300),
    Achievement("hamster_jump_high", "High Jumper", "Reach floor 50 in Hamster Jump", "⬆️", 50, rewardCoins = 300),
    Achievement("wheel_spin_10", "Lucky Spinner", "Spin the wheel 10 times", "🎡", 10, rewardCoins = 100),
    Achievement("tunnel_escape_win", "Escape Artist", "Win Tunnel Escape 5 times", "🏆", 5, rewardCoins = 250),
    // Coins achievements
    Achievement("coins_1000", "Saving Up", "Earn 1,000 coins", "💰", 1000, rewardCrystals = 2),
    Achievement("coins_10000", "Rich Hamster", "Earn 10,000 coins", "💰", 10000, rewardCrystals = 10),
    Achievement("coins_100000", "Coin Tycoon", "Earn 100,000 coins", "💰", 100000, rewardCrystals = 50),
    // Crystal achievements
    Achievement("crystals_10", "Crystal Finder", "Collect 10 crystals", "💎", 10, rewardCoins = 500),
    Achievement("crystals_100", "Crystal Master", "Collect 100 crystals", "💎", 100, rewardCoins = 5000),
    // Rare finds
    Achievement("rare_find_5", "Lucky Digger", "Find 5 rare treasures", "✨", 5, rewardCoins = 1000, rewardCrystals = 5),
    Achievement("rare_find_25", "Treasure Hunter", "Find 25 rare treasures", "✨", 25, rewardCoins = 5000, rewardCrystals = 25),
    // Time played
    Achievement("play_1h", "Getting Started", "Play for 1 hour total", "⏰", 60, rewardCoins = 100),
    Achievement("play_10h", "Dedicated Player", "Play for 10 hours total", "⏰", 600, rewardCoins = 500),
    Achievement("play_100h", "Kingdom Veteran", "Play for 100 hours total", "⏰", 6000, rewardCoins = 5000, rewardCrystals = 20),
    // Special
    Achievement("first_crystal", "Shiny!", "Find your first crystal", "💎", 1, rewardCoins = 50),
    Achievement("first_rare", "Lucky Find!", "Find your first rare item", "✨", 1, rewardCoins = 100),
    Achievement("hamster_max_level", "Royal Hamster", "Reach hamster level 100", "👑", 100, rewardCoins = 50000, rewardCrystals = 200),
    Achievement("login_7", "Regular Visitor", "Log in 7 days in a row", "📆", 7, rewardCoins = 300),
    Achievement("login_30", "Loyal Subject", "Log in 30 days in a row", "📆", 30, rewardCoins = 3000, rewardCrystals = 15),
    Achievement("speed_dig", "Speed Digger", "Reach 5x dig speed", "⚡", 5, rewardCoins = 500),
    Achievement("offline_max", "Idle Master", "Earn offline for 12 hours", "💤", 720, rewardCoins = 1000),
    Achievement("cheese_dash_200m", "Marathon Runner", "Run 200m in Cheese Dash", "🏃", 200, rewardCoins = 200),
    Achievement("daily_complete", "Daily Champion", "Complete all daily tasks in one day", "✅", 6, rewardCoins = 300, rewardCrystals = 1)
)

// ── Daily Tasks ───────────────────────────────────────────────────────────────

enum class TaskDifficulty { EASY, MEDIUM, HARD }

data class DailyTask(
    val id: String,
    val description: String,
    val emoji: String,
    val difficulty: TaskDifficulty,
    val targetValue: Long,
    val currentValue: Long = 0L,
    val isCompleted: Boolean = false,
    val rewardCoins: Long = 0L,
    val rewardCrystals: Long = 0L,
    val rewardCheese: Long = 0L
) {
    val progress: Float get() = (currentValue.toFloat() / targetValue).coerceIn(0f, 1f)
}

fun generateDailyTasks(seed: Long): List<DailyTask> {
    val rng = java.util.Random(seed)
    val easy = listOf(
        DailyTask("feed_3", "Feed your hamster 3 times", "🍽️", TaskDifficulty.EASY, 3, rewardCoins = 50, rewardCheese = 30),
        DailyTask("collect_cheese", "Collect 50 cheese", "🧀", TaskDifficulty.EASY, 50, rewardCoins = 40),
        DailyTask("dig_20m", "Dig 20m of tunnels", "⛏️", TaskDifficulty.EASY, 20, rewardCoins = 45),
        DailyTask("clean_hamster", "Clean your hamster", "🛁", TaskDifficulty.EASY, 1, rewardCoins = 35),
        DailyTask("play_minigame", "Play any minigame", "🎮", TaskDifficulty.EASY, 1, rewardCoins = 60, rewardCheese = 20),
        DailyTask("water_hamster", "Give water 2 times", "💧", TaskDifficulty.EASY, 2, rewardCoins = 40)
    )
    val medium = listOf(
        DailyTask("collect_cheese_med", "Collect 200 cheese", "🧀", TaskDifficulty.MEDIUM, 200, rewardCoins = 150),
        DailyTask("dig_100m", "Dig 100m of tunnels", "⛏️", TaskDifficulty.MEDIUM, 100, rewardCoins = 180),
        DailyTask("upgrade_room", "Upgrade a room", "🏗️", TaskDifficulty.MEDIUM, 1, rewardCoins = 200, rewardCrystals = 1),
        DailyTask("coins_100", "Earn 100 coins", "💰", TaskDifficulty.MEDIUM, 100, rewardCoins = 100, rewardCrystals = 1),
        DailyTask("minigame_score", "Score 300 in Cheese Dash", "🏃", TaskDifficulty.MEDIUM, 300, rewardCoins = 175)
    )
    val hard = listOf(
        DailyTask("collect_cheese_hard", "Collect 1000 cheese", "🧀", TaskDifficulty.HARD, 1000, rewardCoins = 500, rewardCrystals = 2),
        DailyTask("dig_500m", "Dig 500m of tunnels", "⛏️", TaskDifficulty.HARD, 500, rewardCoins = 600, rewardCrystals = 2),
        DailyTask("level_up", "Level up your hamster", "📈", TaskDifficulty.HARD, 1, rewardCoins = 400, rewardCrystals = 3),
        DailyTask("rare_find", "Find a rare item", "✨", TaskDifficulty.HARD, 1, rewardCoins = 550, rewardCrystals = 3)
    )
    return listOf(
        easy[rng.nextInt(easy.size)],
        easy[rng.nextInt(easy.size)].copy(id = easy[rng.nextInt(easy.size)].id + "_2"),
        easy[rng.nextInt(easy.size)].copy(id = easy[rng.nextInt(easy.size)].id + "_3"),
        medium[rng.nextInt(medium.size)],
        medium[rng.nextInt(medium.size)].copy(id = medium[rng.nextInt(medium.size)].id + "_2"),
        hard[rng.nextInt(hard.size)]
    )
}
