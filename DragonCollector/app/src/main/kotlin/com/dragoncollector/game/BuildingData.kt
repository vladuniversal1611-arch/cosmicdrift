package com.dragoncollector.game

import com.dragoncollector.data.models.Building

object BuildingData {

    val ALL_BUILDINGS: List<Building> = listOf(
        Building(
            id = "incubator",
            name = "Інкубатор",
            emoji = "🥚",
            level = 1,
            maxLevel = 10,
            description = "Де виводяться нові дракони",
            effect = "Зменшує час інкубації на 5% за рівень"
        ),
        Building(
            id = "nests",
            name = "Гнізда",
            emoji = "🪺",
            level = 1,
            maxLevel = 10,
            description = "Будинки для ваших драконів",
            effect = "Збільшує ємність острова на 2 дракони за рівень"
        ),
        Building(
            id = "training_ground",
            name = "Тренувальний Майданчик",
            emoji = "⚔️",
            level = 1,
            maxLevel = 10,
            description = "Де дракони стають сильнішими",
            effect = "Збільшує досвід від тренувань на 10% за рівень"
        ),
        Building(
            id = "treasury",
            name = "Скарбниця",
            emoji = "💰",
            level = 1,
            maxLevel = 10,
            description = "Зберігає золото острова",
            effect = "Збільшує максимум золота на 1000 за рівень"
        ),
        Building(
            id = "laboratory",
            name = "Лабораторія",
            emoji = "🔬",
            level = 1,
            maxLevel = 10,
            description = "Де проводяться злиття драконів",
            effect = "Підвищує шанс на рідкісний результат злиття на 3% за рівень"
        ),
        Building(
            id = "portal",
            name = "Портал Експедицій",
            emoji = "🌀",
            level = 1,
            maxLevel = 10,
            description = "Звідси дракони вирушають у пригоди",
            effect = "Збільшує нагороду з експедицій на 5% за рівень"
        ),
        Building(
            id = "dragon_tower",
            name = "Вежа Драконів",
            emoji = "🗼",
            level = 1,
            maxLevel = 10,
            description = "Символ могутності острова",
            effect = "Збільшує силу всіх драконів на 2% за рівень"
        )
    )
}
