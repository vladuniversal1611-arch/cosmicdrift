# 🐉 Dragon Collector

Повноцінна мобільна гра для Android — колекціонер драконів у стилі idle/casual.

## Технічний стек
- **Kotlin** + **Jetpack Compose** (Material 3)
- **Room** — база даних для збережень
- **Coroutines + StateFlow** — реактивний стан
- **Navigation Compose** — навігація між екранами

## Функціонал
- 100+ драконів (Звичайні / Рідкісні / Епічні / Легендарні)
- 7 будівель острова з 10 рівнями кожна
- 7 локацій для експедицій (від 1 хв до 8 год)
- Система злиття драконів
- Автоматичні битви на арені
- 100+ досягнень
- Щоденні нагороди та колесо удачі
- Офлайн-прогрес (до 12 годин)

## Запуск
1. Відкрити в **Android Studio Hedgehog** або новішому
2. `File → Open → DragonCollector`
3. Синхронізувати Gradle
4. Запустити на пристрої/емуляторі (API 26+)

## Структура
```
app/src/main/kotlin/com/dragoncollector/
├── data/           — Room DB, DAO, Repository
│   └── models/     — Сутності (Dragon, Building, ...)
├── game/           — Дані гри (DragonData, ExpeditionData, ...)
├── viewmodel/      — MainViewModel
└── ui/
    ├── theme/      — Темна фентезі тема
    ├── components/ — Composable-компоненти
    └── screens/    — 8 екранів гри
```
