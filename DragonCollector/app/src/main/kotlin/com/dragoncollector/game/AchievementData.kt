package com.dragoncollector.game

import com.dragoncollector.data.models.Achievement
import com.dragoncollector.data.models.AchievementCategory

object AchievementData {

    val ALL_ACHIEVEMENTS: List<Achievement> = listOf(
        // Collection
        Achievement("col_1", "Перший Дракон", "Отримай свого першого дракона", AchievementCategory.COLLECTION, maxProgress = 1, rewardGold = 100),
        Achievement("col_5", "П'ять Драконів", "Зберіть 5 різних драконів", AchievementCategory.COLLECTION, maxProgress = 5, rewardGold = 300),
        Achievement("col_10", "Десять Драконів", "Зберіть 10 різних драконів", AchievementCategory.COLLECTION, maxProgress = 10, rewardGold = 500, rewardGems = 5),
        Achievement("col_25", "Чверть Сотні", "Зберіть 25 різних драконів", AchievementCategory.COLLECTION, maxProgress = 25, rewardGold = 1000, rewardGems = 10),
        Achievement("col_50", "Половина Колекції", "Зберіть 50 різних драконів", AchievementCategory.COLLECTION, maxProgress = 50, rewardGold = 2000, rewardGems = 25),
        Achievement("col_75", "Майже Всі", "Зберіть 75 різних драконів", AchievementCategory.COLLECTION, maxProgress = 75, rewardGold = 5000, rewardGems = 50),
        Achievement("col_100", "Повна Колекція!", "Зберіть 100 різних драконів", AchievementCategory.COLLECTION, maxProgress = 100, rewardGold = 10000, rewardGems = 100),
        Achievement("col_all", "Повелитель Драконів", "Зберіть всіх 100 драконів", AchievementCategory.COLLECTION, maxProgress = 100, rewardGold = 50000, rewardGems = 500),

        // Rarity
        Achievement("rar_rare", "Рідкісна Знахідка", "Отримай першого рідкісного дракона", AchievementCategory.RARITY, maxProgress = 1, rewardGold = 500, rewardGems = 10),
        Achievement("rar_epic", "Епічна Подія", "Отримай першого епічного дракона", AchievementCategory.RARITY, maxProgress = 1, rewardGold = 2000, rewardGems = 25),
        Achievement("rar_legendary", "Легенда Острова", "Отримай першого легендарного дракона", AchievementCategory.RARITY, maxProgress = 1, rewardGold = 10000, rewardGems = 100),
        Achievement("rar_5_rare", "Рідкісна Колекція", "Зберіть 5 рідкісних драконів", AchievementCategory.RARITY, maxProgress = 5, rewardGold = 1000, rewardGems = 20),
        Achievement("rar_5_epic", "Епічна Колекція", "Зберіть 5 епічних драконів", AchievementCategory.RARITY, maxProgress = 5, rewardGold = 5000, rewardGems = 50),
        Achievement("rar_all_legendary", "Легендарна Армія", "Зберіть усіх легендарних драконів", AchievementCategory.RARITY, maxProgress = 20, rewardGold = 100000, rewardGems = 1000),

        // Leveling
        Achievement("lvl_5", "Тренований Дракон", "Підніми дракона до 5 рівня", AchievementCategory.LEVELING, maxProgress = 5, rewardGold = 200),
        Achievement("lvl_10", "Досвідчений Боєць", "Підніми дракона до 10 рівня", AchievementCategory.LEVELING, maxProgress = 10, rewardGold = 500, rewardGems = 5),
        Achievement("lvl_20", "Ветеран Битв", "Підніми дракона до 20 рівня", AchievementCategory.LEVELING, maxProgress = 20, rewardGold = 1000, rewardGems = 15),
        Achievement("lvl_50", "Максимальна Потужність!", "Підніми дракона до 50 рівня", AchievementCategory.LEVELING, maxProgress = 50, rewardGold = 5000, rewardGems = 50),
        Achievement("lvl_10_dragons_max", "Армія Ветеранів", "Підніми 10 драконів до максимального рівня", AchievementCategory.LEVELING, maxProgress = 10, rewardGold = 20000, rewardGems = 200),

        // Expeditions
        Achievement("exp_1", "Перша Пригода", "Заверши першу експедицію", AchievementCategory.EXPEDITION, maxProgress = 1, rewardGold = 100),
        Achievement("exp_10", "Дослідник", "Заверши 10 експедицій", AchievementCategory.EXPEDITION, maxProgress = 10, rewardGold = 500),
        Achievement("exp_50", "Мандрівник", "Заверши 50 експедицій", AchievementCategory.EXPEDITION, maxProgress = 50, rewardGold = 2000, rewardGems = 10),
        Achievement("exp_100", "Пригодник", "Заверши 100 експедицій", AchievementCategory.EXPEDITION, maxProgress = 100, rewardGold = 5000, rewardGems = 25),
        Achievement("exp_500", "Легендарний Мандрівник", "Заверши 500 експедицій", AchievementCategory.EXPEDITION, maxProgress = 500, rewardGold = 20000, rewardGems = 100),
        Achievement("exp_cosmos", "Космічна Подорож", "Відправ дракона в Космос", AchievementCategory.EXPEDITION, maxProgress = 1, rewardGold = 5000, rewardGems = 50),
        Achievement("exp_all_locs", "Всі Куточки Світу", "Відвідай усі 7 локацій", AchievementCategory.EXPEDITION, maxProgress = 7, rewardGold = 3000, rewardGems = 30),

        // Merging
        Achievement("mer_1", "Перше Злиття", "Злий двох драконів", AchievementCategory.MERGING, maxProgress = 1, rewardGold = 200, rewardEssence = 10),
        Achievement("mer_10", "Алхімік", "Заверши 10 злиттів", AchievementCategory.MERGING, maxProgress = 10, rewardGold = 1000, rewardEssence = 50),
        Achievement("mer_50", "Майстер Злиттів", "Заверши 50 злиттів", AchievementCategory.MERGING, maxProgress = 50, rewardGold = 5000, rewardGems = 25),
        Achievement("mer_epic", "Народження Епіка", "Отримай епічного дракона через злиття", AchievementCategory.MERGING, maxProgress = 1, rewardGold = 3000, rewardGems = 30),
        Achievement("mer_legendary", "Народження Легенди", "Отримай легендарного дракона через злиття", AchievementCategory.MERGING, maxProgress = 1, rewardGold = 10000, rewardGems = 100),

        // Arena
        Achievement("arena_1", "Перша Перемога", "Виграй перший бій на арені", AchievementCategory.ARENA, maxProgress = 1, rewardGold = 150),
        Achievement("arena_10", "Боєць", "Виграй 10 боїв на арені", AchievementCategory.ARENA, maxProgress = 10, rewardGold = 500, rewardGems = 5),
        Achievement("arena_50", "Чемпіон", "Виграй 50 боїв на арені", AchievementCategory.ARENA, maxProgress = 50, rewardGold = 2000, rewardGems = 20),
        Achievement("arena_100", "Непереможний", "Виграй 100 боїв на арені", AchievementCategory.ARENA, maxProgress = 100, rewardGold = 5000, rewardGems = 50),
        Achievement("arena_streak_5", "Серія Перемог", "Виграй 5 боїв поспіль", AchievementCategory.ARENA, maxProgress = 5, rewardGold = 1000, rewardGems = 10),

        // Building
        Achievement("build_first", "Перша Будівля", "Побудуй свою першу будівлю", AchievementCategory.BUILDING, maxProgress = 1, rewardGold = 200),
        Achievement("build_upgrade_5", "Вдосконалення", "Підніми будівлю до 5 рівня", AchievementCategory.BUILDING, maxProgress = 5, rewardGold = 500),
        Achievement("build_upgrade_max", "Майстер Архітектор", "Підніми будівлю до максимального рівня", AchievementCategory.BUILDING, maxProgress = 1, rewardGold = 5000, rewardGems = 25),
        Achievement("build_all_max", "Ідеальний Острів", "Підніми всі будівлі до максимального рівня", AchievementCategory.BUILDING, maxProgress = 7, rewardGold = 50000, rewardGems = 200),
        Achievement("island_level_5", "Процвітаючий Острів", "Підніми острів до 5 рівня", AchievementCategory.BUILDING, maxProgress = 5, rewardGold = 2000, rewardGems = 20),
        Achievement("island_level_10", "Велике Королівство", "Підніми острів до 10 рівня", AchievementCategory.BUILDING, maxProgress = 10, rewardGold = 10000, rewardGems = 100),

        // Daily
        Achievement("daily_7", "Тижнева Звичка", "Увійди в гру 7 днів поспіль", AchievementCategory.DAILY, maxProgress = 7, rewardGold = 1000, rewardGems = 10),
        Achievement("daily_30", "Місячна Відданість", "Увійди в гру 30 днів поспіль", AchievementCategory.DAILY, maxProgress = 30, rewardGold = 5000, rewardGems = 50),
        Achievement("daily_100", "Столітній Гравець", "Увійди в гру 100 днів поспіль", AchievementCategory.DAILY, maxProgress = 100, rewardGold = 20000, rewardGems = 200),
        Achievement("wheel_10", "Вдача Усміхнулась", "Покрути колесо удачі 10 разів", AchievementCategory.DAILY, maxProgress = 10, rewardGold = 500),
        Achievement("wheel_50", "Везунчик", "Покрути колесо удачі 50 разів", AchievementCategory.DAILY, maxProgress = 50, rewardGold = 2000, rewardGems = 20),

        // Special
        Achievement("spec_fire_legend", "Космічна Зустріч", "Отримай Космічного Дракона", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 5000, rewardGems = 50),
        Achievement("spec_time_dragon", "Повелитель Часу", "Отримай Дракона Часу", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 5000, rewardGems = 50),
        Achievement("spec_golden_dragon", "Золотий Скарб", "Отримай Золотого Дракона", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 10000, rewardGems = 100),
        Achievement("spec_1000_gold", "Перша Тисяча", "Накопич 1000 золота", AchievementCategory.SPECIAL, maxProgress = 1000, rewardGems = 5),
        Achievement("spec_10000_gold", "Маленький Скарб", "Накопич 10 000 золота", AchievementCategory.SPECIAL, maxProgress = 10000, rewardGems = 20),
        Achievement("spec_100000_gold", "Великий Скарб", "Накопич 100 000 золота", AchievementCategory.SPECIAL, maxProgress = 100000, rewardGems = 100),
        Achievement("spec_eclipse", "Затемнення Острова", "Отримай Затемнення (Eclipse)", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 3000, rewardGems = 30),
        Achievement("spec_50_gems", "Дорогоцінний Запас", "Накопич 50 кристалів", AchievementCategory.SPECIAL, maxProgress = 50, rewardGold = 500),
        Achievement("spec_hatch_10", "Майстер Інкубації", "Виведи 10 драконів з яєць", AchievementCategory.SPECIAL, maxProgress = 10, rewardGold = 1000, rewardGems = 10),
        Achievement("spec_hatch_50", "Інкубаторний Бог", "Виведи 50 драконів з яєць", AchievementCategory.SPECIAL, maxProgress = 50, rewardGold = 5000, rewardGems = 50),

        // Time / special gameplay
        Achievement("time_1h", "Година в Світі Драконів", "Проведи 1 годину у грі", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 300),
        Achievement("time_10h", "Відданий Повелитель", "Проведи 10 годин у грі", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 1000, rewardGems = 10),
        Achievement("time_100h", "Легендарний Повелитель", "Проведи 100 годин у грі", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 10000, rewardGems = 100),
        Achievement("offline_bonus", "Добро Пожалувати Назад", "Збери офлайн-нагороди", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 200),
        Achievement("spec_all_elements", "Майстер Стихій", "Отримай дракона кожного елементу", AchievementCategory.SPECIAL, maxProgress = 15, rewardGold = 5000, rewardGems = 50),
        Achievement("spec_power_1000", "Потужна Армія", "Набери 1000 загальної потужності", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 2000, rewardGems = 20),
        Achievement("spec_power_10000", "Непереможна Армія", "Набери 10 000 загальної потужності", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 10000, rewardGems = 100),

        // Extra collection milestones
        Achievement("col_all_common", "Всі Звичайні", "Зберіть усіх 30 звичайних драконів", AchievementCategory.COLLECTION, maxProgress = 30, rewardGold = 5000, rewardGems = 25),
        Achievement("col_all_rare", "Всі Рідкісні", "Зберіть усіх 25 рідкісних драконів", AchievementCategory.COLLECTION, maxProgress = 25, rewardGold = 10000, rewardGems = 50),
        Achievement("col_all_epic", "Всі Епічні", "Зберіть усіх 25 епічних драконів", AchievementCategory.COLLECTION, maxProgress = 25, rewardGold = 25000, rewardGems = 100),

        // Arena streaks
        Achievement("arena_200", "Великий Чемпіон", "Виграй 200 боїв на арені", AchievementCategory.ARENA, maxProgress = 200, rewardGold = 20000, rewardGems = 200),
        Achievement("arena_no_loss", "Бездоганна Перемога", "Виграй бій без втрат", AchievementCategory.ARENA, maxProgress = 1, rewardGold = 500, rewardGems = 5),

        // Extra expedition
        Achievement("exp_1000", "Невтомний Мандрівник", "Заверши 1000 експедицій", AchievementCategory.EXPEDITION, maxProgress = 1000, rewardGold = 50000, rewardGems = 200),
        Achievement("exp_volcano", "Вулканічне Пекло", "Відправ дракона на Вулкан 10 разів", AchievementCategory.EXPEDITION, maxProgress = 10, rewardGold = 2000, rewardGems = 20),

        // Extra merging
        Achievement("mer_100", "Великий Алхімік", "Заверши 100 злиттів", AchievementCategory.MERGING, maxProgress = 100, rewardGold = 10000, rewardGems = 50),

        // More specials
        Achievement("spec_essence_100", "Сутність Дракона", "Накопич 100 сутності дракона", AchievementCategory.SPECIAL, maxProgress = 100, rewardGold = 1000, rewardGems = 10),
        Achievement("spec_essence_1000", "Велика Сутність", "Накопич 1000 сутності дракона", AchievementCategory.SPECIAL, maxProgress = 1000, rewardGold = 5000, rewardGems = 50),
        Achievement("spec_legendary_5", "П'ять Легенд", "Зберіть 5 легендарних драконів", AchievementCategory.RARITY, maxProgress = 5, rewardGold = 30000, rewardGems = 300),

        // Beginner
        Achievement("begin_island", "Ласкаво Просимо!", "Почни будувати свій острів", AchievementCategory.BUILDING, maxProgress = 1, rewardGold = 50),
        Achievement("begin_hatch", "Перше Яйце", "Поклади яйце в інкубатор", AchievementCategory.SPECIAL, maxProgress = 1, rewardGold = 50),
        Achievement("begin_expedition", "Дорога Довжиною в Крок", "Відправ дракона на першу пригоду", AchievementCategory.EXPEDITION, maxProgress = 1, rewardGold = 50),

        // Endgame
        Achievement("end_max_island", "Максимальний Острів", "Підніми острів до максимального рівня", AchievementCategory.BUILDING, maxProgress = 10, rewardGold = 100000, rewardGems = 500),
        Achievement("end_all_achievements", "Це Неможливо!", "Розблокуй всі інші досягнення", AchievementCategory.SPECIAL, maxProgress = 99, rewardGold = 999999, rewardGems = 9999)
    )
}
