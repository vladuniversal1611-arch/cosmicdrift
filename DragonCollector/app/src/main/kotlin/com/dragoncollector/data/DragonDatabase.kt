package com.dragoncollector.data

import android.content.Context
import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.dragoncollector.data.models.*

class RarityConverter {
    @TypeConverter fun fromRarity(r: Rarity): String = r.name
    @TypeConverter fun toRarity(s: String): Rarity = Rarity.valueOf(s)
}

class ElementConverter {
    @TypeConverter fun fromElement(e: Element): String = e.name
    @TypeConverter fun toElement(s: String): Element = Element.valueOf(s)
}

class AchievementCategoryConverter {
    @TypeConverter fun fromCategory(c: AchievementCategory): String = c.name
    @TypeConverter fun toCategory(s: String): AchievementCategory = AchievementCategory.valueOf(s)
}

@Database(
    entities = [Dragon::class, Building::class, GameState::class, Achievement::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(RarityConverter::class, ElementConverter::class, AchievementCategoryConverter::class)
abstract class DragonDatabase : RoomDatabase() {
    abstract fun dragonDao(): DragonDao
    abstract fun buildingDao(): BuildingDao
    abstract fun gameStateDao(): GameStateDao
    abstract fun achievementDao(): AchievementDao

    companion object {
        @Volatile private var INSTANCE: DragonDatabase? = null

        fun getDatabase(context: Context): DragonDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DragonDatabase::class.java,
                    "dragon_collector_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
