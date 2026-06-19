package com.dragoncollector.game

import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.DragonTemplate
import com.dragoncollector.data.models.Element
import com.dragoncollector.data.models.Rarity

object DragonData {

    val ALL_TEMPLATES: List<DragonTemplate> = listOf(
        // ── COMMON (30) ──────────────────────────────────────────────────
        DragonTemplate("fire_drake", "Вогняний Дракон", Rarity.COMMON, Element.FIRE, "Дракон, що народився в кратері вулкана. Диш вогнем з перших хвилин.", 10),
        DragonTemplate("earth_drake", "Земляний Дракон", Rarity.COMMON, Element.EARTH, "Любить копати підземні нори. Луска міцна, як граніт.", 10),
        DragonTemplate("water_drake", "Водяний Дракон", Rarity.COMMON, Element.WATER, "Плаває швидше дельфіна. Народжений у морській піні.", 10),
        DragonTemplate("air_drake", "Повітряний Дракон", Rarity.COMMON, Element.AIR, "Мчить зі швидкістю вітру. Майже невидимий у хмарах.", 10),
        DragonTemplate("fire_whelp", "Вогняний Дракеня", Rarity.COMMON, Element.FIRE, "Маленький, але вже небезпечний. Ненароком підпалює все навколо.", 8),
        DragonTemplate("stone_whelp", "Кам'яне Дракеня", Rarity.COMMON, Element.EARTH, "Спить більшість часу. Але коли прокидається — тримайся!", 8),
        DragonTemplate("river_whelp", "Річкове Дракеня", Rarity.COMMON, Element.WATER, "Грається у водоспадах. Ковтає рибу цілою.", 8),
        DragonTemplate("wind_whelp", "Вітряне Дракеня", Rarity.COMMON, Element.AIR, "Залишає за собою маленькі торнадо.", 8),
        DragonTemplate("ember_sprite", "Жаринка", Rarity.COMMON, Element.FIRE, "Мерехтить, як свічка. Тепла та дружелюбна.", 7),
        DragonTemplate("rock_sprite", "Каменюк", Rarity.COMMON, Element.EARTH, "Любить сидіти нерухомо. Птахи помилково сідають на нього.", 7),
        DragonTemplate("wave_sprite", "Хвилька", Rarity.COMMON, Element.WATER, "Залишає мокрі сліди скрізь, де проходить.", 7),
        DragonTemplate("breeze_sprite", "Подих Вітру", Rarity.COMMON, Element.AIR, "Такий легкий, що ледь торкається землі.", 7),
        DragonTemplate("cinderling", "Жаринець", Rarity.COMMON, Element.FIRE, "Маленька жива жаринка, що ніколи не гасне.", 9),
        DragonTemplate("pebbleback", "Гравій", Rarity.COMMON, Element.EARTH, "Луска складається з крихітних каменів.", 9),
        DragonTemplate("droplet", "Крапелька", Rarity.COMMON, Element.WATER, "Може перетікати крізь найвужчі щілини.", 9),
        DragonTemplate("zephyr", "Зефір", Rarity.COMMON, Element.AIR, "Легкий, як весняний бриз. Любить гратися з листям.", 9),
        DragonTemplate("lava_pup", "Лавовий Цуценя", Rarity.COMMON, Element.FIRE, "Народився прямо в лаві. Шкіра гаряча на дотик.", 11),
        DragonTemplate("gravel_hound", "Гравієвий Пес", Rarity.COMMON, Element.EARTH, "Залишає кам'яні сліди. Стрибає, мов скельний гірський козел.", 11),
        DragonTemplate("tide_pup", "Припливне Цуценя", Rarity.COMMON, Element.WATER, "Прибуває з кожним припливом. Пахне морем.", 11),
        DragonTemplate("gust_hound", "Буревісник", Rarity.COMMON, Element.AIR, "Завжди поспішає, ніби переносить важливі новини.", 11),
        DragonTemplate("scorch", "Опал", Rarity.COMMON, Element.FIRE, "Залишає обпалені сліди лап. Необережний, але добрий.", 12),
        DragonTemplate("boulder", "Валун", Rarity.COMMON, Element.EARTH, "Важкий і повільний. Але жоден ворог не зупинить його.", 12),
        DragonTemplate("splash", "Сплеск", Rarity.COMMON, Element.WATER, "З'являється звідки не ждеш. Мокрий завжди.", 12),
        DragonTemplate("gale", "Шквал", Rarity.COMMON, Element.AIR, "Приходить непомітно і зникає так само.", 12),
        DragonTemplate("spark_whelp", "Іскорка", Rarity.COMMON, Element.FIRE, "Маленька іскра великого вогню.", 8),
        DragonTemplate("sandy_whelp", "Піщане Дракеня", Rarity.COMMON, Element.EARTH, "Обожнює піщані бурі. Ховається під землею.", 8),
        DragonTemplate("flame_sprite", "Полум'янець", Rarity.COMMON, Element.FIRE, "Танцює у вогні, наче метелик у саду.", 10),
        DragonTemplate("mud_whelp", "Болотяне Дракеня", Rarity.COMMON, Element.EARTH, "Живе у калюжах. Покривається мулом для захисту.", 9),
        DragonTemplate("bubble_whelp", "Бульбашкове Дракеня", Rarity.COMMON, Element.WATER, "Видихає мильні бульбашки замість вогню.", 9),
        DragonTemplate("cloud_whelp", "Хмаринкове Дракеня", Rarity.COMMON, Element.AIR, "Спить на хмарах. Тіло м'яке, як вата.", 9),

        // ── RARE (25) ────────────────────────────────────────────────────
        DragonTemplate("ice_dragon", "Крижаний Дракон", Rarity.RARE, Element.ICE, "Заморожує все поглядом. Живе в арктичних горах.", 30),
        DragonTemplate("electric_dragon", "Електричний Дракон", Rarity.RARE, Element.ELECTRIC, "Блискавка — його зброя. Гроза пасує йому краще ніж сонце.", 30),
        DragonTemplate("poison_dragon", "Отруйний Дракон", Rarity.RARE, Element.POISON, "Один укус — і ворог не встане. Дуже обережний друг.", 30),
        DragonTemplate("metal_dragon", "Металевий Дракон", Rarity.RARE, Element.METAL, "Луска непробивна. Народжений у плавильних печах.", 30),
        DragonTemplate("frost_drake", "Морозний Дракон", Rarity.RARE, Element.ICE, "Зима приходить туди, куди ступає він.", 28),
        DragonTemplate("thunder_drake", "Грозовий Дракон", Rarity.RARE, Element.ELECTRIC, "Гуркіт його крил — це сам грім.", 28),
        DragonTemplate("venom_drake", "Отруйний Дракон", Rarity.RARE, Element.POISON, "Отрута у крові. Слина розчиняє залізо.", 28),
        DragonTemplate("steel_drake", "Сталевий Дракон", Rarity.RARE, Element.METAL, "Народжений зі сталі та вогню. Незламний.", 28),
        DragonTemplate("blizzard_whelp", "Буревій", Rarity.RARE, Element.ICE, "Маленький, але може заморозити озеро.", 25),
        DragonTemplate("storm_whelp", "Грозова Іскра", Rarity.RARE, Element.ELECTRIC, "Завжди оточений електростатикою.", 25),
        DragonTemplate("toxin_whelp", "Токсик", Rarity.RARE, Element.POISON, "Нешкідливий на вигляд, але краще не підходити.", 25),
        DragonTemplate("iron_whelp", "Залізний Малюк", Rarity.RARE, Element.METAL, "Його іграшки — металеві болти та гайки.", 25),
        DragonTemplate("glacial_sprite", "Льодяна Фея", Rarity.RARE, Element.ICE, "Залишає льодяні кристали на слідах.", 27),
        DragonTemplate("bolt_sprite", "Блискавка", Rarity.RARE, Element.ELECTRIC, "З'являється і зникає швидше, ніж моргнеш.", 27),
        DragonTemplate("acid_sprite", "Кислотна Крапля", Rarity.RARE, Element.POISON, "Сльози — кислота. Звичайно, він не плаче.", 27),
        DragonTemplate("chrome_sprite", "Хромований Дух", Rarity.RARE, Element.METAL, "Відображає все навколо, як дзеркало.", 27),
        DragonTemplate("hailstorm", "Крупа", Rarity.RARE, Element.ICE, "Обстрілює ворогів градом крижаних куль.", 32),
        DragonTemplate("thunderclap", "Гуркіт", Rarity.RARE, Element.ELECTRIC, "Один помах крила — і навколо лунає грім.", 32),
        DragonTemplate("venomfang", "Отруєний Ікло", Rarity.RARE, Element.POISON, "Зуби просочені рідким ядом. Один укус — крапка.", 32),
        DragonTemplate("ironscale", "Залізочешуйник", Rarity.RARE, Element.METAL, "Його луска цінніша за всі скарби острова.", 32),
        DragonTemplate("frostbite", "Укус Морозу", Rarity.RARE, Element.ICE, "Там, де він дихає, виростають льодяні квіти.", 29),
        DragonTemplate("shockwave", "Ударна Хвиля", Rarity.RARE, Element.ELECTRIC, "Генерує електромагнітний імпульс при кожному стрибку.", 29),
        DragonTemplate("plague", "Зараза", Rarity.RARE, Element.POISON, "Не злий, просто дуже отруйний. Друзів мало.", 29),
        DragonTemplate("titanback", "Титанохребет", Rarity.RARE, Element.METAL, "Спина — броня. Тягне гору, не потіючи.", 29),
        DragonTemplate("arctic_wyrm", "Арктичний Черв'як", Rarity.RARE, Element.ICE, "Гігантський, але ніжний. Б'є хвостом — виникає торнадо.", 35),

        // ── EPIC (25) ────────────────────────────────────────────────────
        DragonTemplate("shadow_dragon", "Тіньовий Дракон", Rarity.EPIC, Element.SHADOW, "Живе між тінями. Ніхто не знає, де він зараз.", 70),
        DragonTemplate("light_dragon", "Світловий Дракон", Rarity.EPIC, Element.LIGHT, "Його поява — немов схід сонця. Зцілює союзників.", 70),
        DragonTemplate("crystal_dragon", "Кристалічний Дракон", Rarity.EPIC, Element.CRYSTAL, "Тіло — суцільний кристал. Заломлює магію.", 70),
        DragonTemplate("shadow_drake", "Тіньовий Дракон", Rarity.EPIC, Element.SHADOW, "Залишає темний слід. Мандрує лише вночі.", 65),
        DragonTemplate("radiant_drake", "Сяючий Дракон", Rarity.EPIC, Element.LIGHT, "Сяє навіть у найтемнішій печері.", 65),
        DragonTemplate("prism_drake", "Призматичний Дракон", Rarity.EPIC, Element.CRYSTAL, "Розкладає будь-яке світло в веселку.", 65),
        DragonTemplate("umbra_whelp", "Тінь-Малюк", Rarity.EPIC, Element.SHADOW, "Маленька тінь, що живе своїм життям.", 60),
        DragonTemplate("luminary_whelp", "Люмінарій", Rarity.EPIC, Element.LIGHT, "Горить у темряві, як маяк.", 60),
        DragonTemplate("facet_whelp", "Грань", Rarity.EPIC, Element.CRYSTAL, "Кожна луска — окремий кристал.", 60),
        DragonTemplate("nightshade", "Нічна Тінь", Rarity.EPIC, Element.SHADOW, "Улюблений час — опівніч. Харчується страхами.", 68),
        DragonTemplate("dawnbringer", "Провісник Світанку", Rarity.EPIC, Element.LIGHT, "Приносить ранок туди, де вічна ніч.", 68),
        DragonTemplate("gemscale", "Коштовна Луска", Rarity.EPIC, Element.CRYSTAL, "Кожна луска — справжній коштовний камінь.", 68),
        DragonTemplate("phantom", "Фантом", Rarity.EPIC, Element.SHADOW, "Проходить крізь стіни. Існує між двома світами.", 72),
        DragonTemplate("celestial", "Небесний", Rarity.EPIC, Element.LIGHT, "Спустився з небес. Відчуває чистоту намірів.", 72),
        DragonTemplate("opaline", "Опаловий", Rarity.EPIC, Element.CRYSTAL, "Переливається всіма кольорами одночасно.", 72),
        DragonTemplate("twilight", "Присмерковий", Rarity.EPIC, Element.SHADOW, "Народжений у мить між днем і ніччю.", 75),
        DragonTemplate("aurora", "Авроровий", Rarity.EPIC, Element.LIGHT, "Шлейф крил — як північне сяйво.", 75),
        DragonTemplate("kaleidoscope", "Калейдоскоп", Rarity.EPIC, Element.CRYSTAL, "Кожен рух — нові кольори.", 75),
        DragonTemplate("darkmantle", "Темний Плащ", Rarity.EPIC, Element.SHADOW, "Оповитий непроникною темрявою.", 78),
        DragonTemplate("sunfire", "Сонячне Полум'я", Rarity.EPIC, Element.LIGHT, "Гарячіший за саме сонце.", 78),
        DragonTemplate("crystallis", "Кристалліс", Rarity.EPIC, Element.CRYSTAL, "Живий кристал. Росте з кожним роком.", 78),
        DragonTemplate("obsidian", "Обсидіановий", Rarity.EPIC, Element.SHADOW, "Темніший за нічне небо. Непроникний погляд.", 80),
        DragonTemplate("solaris", "Солярис", Rarity.EPIC, Element.LIGHT, "Народжений у серці зірки.", 80),
        DragonTemplate("prismatic", "Призматичний", Rarity.EPIC, Element.CRYSTAL, "Розсіює магію, як призма розсіює світло.", 80),
        DragonTemplate("eclipse", "Затемнення", Rarity.EPIC, Element.SHADOW, "Народжений під час сонячного затемнення.", 85),

        // ── LEGENDARY (20) ───────────────────────────────────────────────
        DragonTemplate("cosmic_dragon", "Космічний Дракон", Rarity.LEGENDARY, Element.COSMIC, "Прийшов із зірок. Тіло всіяне сузір'ями.", 150),
        DragonTemplate("volcanic_dragon", "Вулканічний Дракон", Rarity.LEGENDARY, Element.VOLCANIC, "Народжений у серці вулкана. Лава — його кров.", 150),
        DragonTemplate("golden_dragon", "Золотий Дракон", Rarity.LEGENDARY, Element.GOLDEN, "Легендарний покровитель скарбів. Приносить достаток.", 150),
        DragonTemplate("time_dragon", "Дракон Часу", Rarity.LEGENDARY, Element.TIME, "Може сповільнити або прискорити час. Стародавній як світ.", 150),
        DragonTemplate("nebula_drake", "Туманністний Дракон", Rarity.LEGENDARY, Element.COSMIC, "Народжений у туманності. Хвіст — зоряний пил.", 140),
        DragonTemplate("inferno_drake", "Пекельний Дракон", Rarity.LEGENDARY, Element.VOLCANIC, "Вогонь, якого він дихає, не гаситься водою.", 140),
        DragonTemplate("aureate_drake", "Позолочений Дракон", Rarity.LEGENDARY, Element.GOLDEN, "Торкається — і все стає золотом.", 140),
        DragonTemplate("chronos_drake", "Хронос-Дракон", Rarity.LEGENDARY, Element.TIME, "Вічний мандрівник у потоці часу.", 140),
        DragonTemplate("stardust_whelp", "Зоряний Пил", Rarity.LEGENDARY, Element.COSMIC, "Маленька зірочка, що впала на землю.", 130),
        DragonTemplate("magma_whelp", "Магматичне Дракеня", Rarity.LEGENDARY, Element.VOLCANIC, "Магма тече крізь його жили замість крові.", 130),
        DragonTemplate("gilt_whelp", "Позолочений Малюк", Rarity.LEGENDARY, Element.GOLDEN, "Все навколо нього набуває золотого відтінку.", 130),
        DragonTemplate("epoch_whelp", "Епоха", Rarity.LEGENDARY, Element.TIME, "Живе поза часом. Бачить минуле і майбутнє.", 130),
        DragonTemplate("galaxion", "Галаксіон", Rarity.LEGENDARY, Element.COSMIC, "Цілий всесвіт у його очах.", 160),
        DragonTemplate("pyroclasm", "Піроклазм", Rarity.LEGENDARY, Element.VOLCANIC, "Виверження вулкана — лише його чхання.", 160),
        DragonTemplate("aurum", "Аурум", Rarity.LEGENDARY, Element.GOLDEN, "Найбагатший дракон усіх часів і народів.", 160),
        DragonTemplate("temporal", "Темпорал", Rarity.LEGENDARY, Element.TIME, "Подорожує між епохами. Знає всі таємниці.", 160),
        DragonTemplate("supernova", "Наднова", Rarity.LEGENDARY, Element.COSMIC, "Вибух зірки породив його. Несе її силу.", 175),
        DragonTemplate("cataclysm", "Катаклізм", Rarity.LEGENDARY, Element.VOLCANIC, "Одне слово — і вулкани прокидаються.", 175),
        DragonTemplate("midas", "Мідас", Rarity.LEGENDARY, Element.GOLDEN, "Дихає — золото. Дивиться — золото. Все золото.", 175),
        DragonTemplate("eternity", "Вічність", Rarity.LEGENDARY, Element.TIME, "Існує поза часом і простором. Початок і кінець.", 200)
    )

    fun createInitialDragons(): List<Dragon> = ALL_TEMPLATES.map { template ->
        Dragon(
            id = template.id,
            name = template.name,
            rarity = template.rarity,
            element = template.element,
            description = template.description,
            power = template.basePower,
            isOwned = false
        )
    }

    fun getStarterDragonId(): String = "fire_drake"

    fun getMergeResult(dragonId: String): String? {
        val mergeMap = mapOf(
            "fire_drake" to "fire_whelp",
            "earth_drake" to "earth_drake",
            "water_drake" to "water_drake",
            "air_drake" to "air_drake",
            "ice_dragon" to "frost_drake",
            "electric_dragon" to "thunder_drake",
            "poison_dragon" to "venom_drake",
            "metal_dragon" to "steel_drake",
            "shadow_dragon" to "phantom",
            "light_dragon" to "celestial",
            "crystal_dragon" to "crystallis"
        )
        return mergeMap[dragonId]
    }
}
