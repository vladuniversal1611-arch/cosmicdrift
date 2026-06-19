package com.dragoncollector.game

import com.dragoncollector.data.models.ExpeditionLocation
import com.dragoncollector.data.models.Rarity

object ExpeditionData {

    val ALL_LOCATIONS: List<ExpeditionLocation> = listOf(
        ExpeditionLocation(
            id = "forest",
            name = "Зачарований Ліс",
            emoji = "🌲",
            description = "Стародавній ліс, де мешкають чарівні істоти. Легка пригода для початківців.",
            durationMs = 60_000L,        // 1 хв
            minGoldReward = 50,
            maxGoldReward = 150,
            gemChance = 0.05f,
            essenceChance = 0.1f,
            eggChance = 0.05f,
            requiredDragonLevel = 1,
            requiredIslandLevel = 1,
            possibleEggRarities = listOf(Rarity.COMMON)
        ),
        ExpeditionLocation(
            id = "cave",
            name = "Кришталева Печера",
            emoji = "🗻",
            description = "Підземна печера, всіяна дорогоцінними каменями. Середня складність.",
            durationMs = 5 * 60_000L,    // 5 хв
            minGoldReward = 200,
            maxGoldReward = 500,
            gemChance = 0.15f,
            essenceChance = 0.2f,
            eggChance = 0.08f,
            requiredDragonLevel = 3,
            requiredIslandLevel = 1,
            possibleEggRarities = listOf(Rarity.COMMON, Rarity.RARE)
        ),
        ExpeditionLocation(
            id = "desert",
            name = "Вогняна Пустеля",
            emoji = "🏜️",
            description = "Спекотна пустеля, де сховані давні скарби. Небезпечно, але прибутково.",
            durationMs = 15 * 60_000L,   // 15 хв
            minGoldReward = 500,
            maxGoldReward = 1200,
            gemChance = 0.2f,
            essenceChance = 0.25f,
            eggChance = 0.1f,
            requiredDragonLevel = 5,
            requiredIslandLevel = 2,
            possibleEggRarities = listOf(Rarity.COMMON, Rarity.RARE)
        ),
        ExpeditionLocation(
            id = "volcano",
            name = "Вулкан Хаосу",
            emoji = "🌋",
            description = "Діючий вулкан, де живуть найсильніші вогняні дракони. Дуже небезпечно.",
            durationMs = 60 * 60_000L,   // 1 год
            minGoldReward = 1500,
            maxGoldReward = 3000,
            gemChance = 0.3f,
            essenceChance = 0.35f,
            eggChance = 0.12f,
            requiredDragonLevel = 10,
            requiredIslandLevel = 3,
            possibleEggRarities = listOf(Rarity.RARE, Rarity.EPIC)
        ),
        ExpeditionLocation(
            id = "ice_world",
            name = "Крижаний Край",
            emoji = "❄️",
            description = "Вічні льодовики та засніжені вершини. Рідкісні дракони мешкають тут.",
            durationMs = 2 * 60 * 60_000L, // 2 год
            minGoldReward = 3000,
            maxGoldReward = 6000,
            gemChance = 0.35f,
            essenceChance = 0.4f,
            eggChance = 0.15f,
            requiredDragonLevel = 15,
            requiredIslandLevel = 4,
            possibleEggRarities = listOf(Rarity.RARE, Rarity.EPIC)
        ),
        ExpeditionLocation(
            id = "sky_island",
            name = "Небесний Острів",
            emoji = "🏝️",
            description = "Острів у хмарах. Єдиний шлях туди — на крилах дракона. Великі скарби чекають.",
            durationMs = 4 * 60 * 60_000L, // 4 год
            minGoldReward = 6000,
            maxGoldReward = 12000,
            gemChance = 0.45f,
            essenceChance = 0.5f,
            eggChance = 0.18f,
            requiredDragonLevel = 20,
            requiredIslandLevel = 5,
            possibleEggRarities = listOf(Rarity.EPIC, Rarity.LEGENDARY)
        ),
        ExpeditionLocation(
            id = "cosmos",
            name = "Зоряний Космос",
            emoji = "🌌",
            description = "Найдальша та найнебезпечніша подорож. Лише найсильніші дракони повертаються.",
            durationMs = 8 * 60 * 60_000L, // 8 год
            minGoldReward = 15000,
            maxGoldReward = 30000,
            gemChance = 0.6f,
            essenceChance = 0.65f,
            eggChance = 0.25f,
            requiredDragonLevel = 30,
            requiredIslandLevel = 6,
            possibleEggRarities = listOf(Rarity.EPIC, Rarity.LEGENDARY)
        )
    )
}
