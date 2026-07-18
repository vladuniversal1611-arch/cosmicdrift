# Збірка .aab через Android Studio — покроково

Android-проєкт **уже згенерований і налаштований** (`android/`): підключені
AdMob + RevenueCat + splash/status bar, портретний лок, іконка гри, minSdk 24,
App ID (тестовий), дозвіл AD_ID. Тобі лишається зібрати підписаний `.aab`.

## Передумови
- Node.js 18+, Android Studio (Giraffe+), JDK 17.

## Крок 1 — відновити залежності і синхронізувати
У папці `mystic-relics/`:
```bash
npm install        # ставить Capacitor + плагіни у node_modules
npm run cap:sync   # копіює веб-застосунок у android і оновлює плагіни
```
> Ці два кроки обов'язкові після клонування: плагіни Capacitor підключаються
> з `node_modules`, а веб-код кладеться в `android/` саме цією командою.

## Крок 2 — відкрити в Android Studio
```bash
npm run cap:open   # або відкрий папку android/ вручну
```
Дай Gradle синхронізуватися (перший раз завантажить SDK/Gradle).

## Крок 3 — зібрати підписаний .aab
**Build → Generate Signed Bundle / APK → Android App Bundle → Next.**
- Якщо keystore ще немає — **Create new…** (Android Studio створить його тут же;
  збережи файл і паролі — вони потрібні для КОЖНОГО майбутнього оновлення!).
- Обери `release` → Finish.
- Готовий файл: `android/app/release/app-release.aab`.

> Альтернатива з консолі: створи `android/app/keystore.properties` з
> `android/app/keystore.properties.example`, потім `npm run build:aab`.

## Крок 4 — завантажити в Google Play
Play Console → Створити застосунок → Production (спершу краще Internal testing) →
завантажити `.aab`.

---

## Що замінити на СВОЄ перед публічним релізом (не блокує тестову збірку)
1. **AdMob**: у `js/ads.js` → `AD_IDS` свої рекламні id; у
   `android/app/src/main/AndroidManifest.xml` — свій `APPLICATION_ID`.
   (Зараз вшиті ТЕСТОВІ id Google — показують тестові оголошення.)
2. **RevenueCat** (покупки): у `js/ads.js` → `IAP_KEY` свій ключ `goog_…`
   (див. `IAP_SETUP.md`).
3. **appId**: `com.yourstudio.mysticrelics` → свій, у `capacitor.config.json`,
   `android/app/build.gradle`, `AndroidManifest`/`strings.xml`
   (або перегенеруй: зміни в `capacitor.config.json` і `npx cap sync`).
4. **versionCode / versionName** — у `android/app/build.gradle` (для кожного оновлення).
5. **Політика конфіденційності** (`PRIVACY.md`) — розмісти за URL і вкажи в Play Console.

Детальний список — у `EXPORT_CHECKLIST.md`.
