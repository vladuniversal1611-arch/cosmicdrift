# WeekNote → APK з AdMob

## Що треба на комп'ютері (одноразово)

1. **Node.js LTS** (v18 або v20+) — https://nodejs.org
2. **Android Studio** з Android SDK — https://developer.android.com/studio
3. **Java 17 JDK** (Android Studio зазвичай ставить сам)

## Збірка з нуля — **3 команди**

```bash
git clone https://github.com/vladuniversal1611-arch/cosmicdrift.git
cd cosmicdrift
npm install
```

Що відбувається під час `npm install`:
- Ставляться Capacitor + плагіни (AdMob community plugin)
- Постпроцесор **автоматично**:
  - Створює `www/` — копіює `weeknote.html` як `index.html`, копіює `assets/`, генерує `admob-bridge.js`
  - Додає Android-платформу (`cap add android`)
  - Синхронізує вебасети + плагіни (`cap sync`)
  - **Патчить AndroidManifest.xml** — додає рядок з AdMob `APPLICATION_ID` (без нього додаток крашитиме при старті)

Далі, щоб відкрити в Android Studio:

```bash
npm run android
```

І готово — тиснеш ▶ Run в Android Studio, додаток збирається на підключений телефон / емулятор.

## Після редагування `weeknote.html`

```bash
npm run sync
```

— перебудує `www/` і синхронізує з нативним проектом. Далі знову ▶ Run.

## Release build (підписаний AAB для Play Store)

Android Studio → **Build → Generate Signed Bundle / APK → Android App Bundle**
- Створи keystore (пароль запам'ятай!)
- Готовий `.aab` буде в `android/app/release/`
- Заливай у Google Play Console

## AdMob ID (уже вшиті)

| Тип | ID |
|-----|-----|
| App ID | `ca-app-pub-5816871059908402~5417483753` |
| Banner | `ca-app-pub-5816871059908402/4104402087` |
| Interstitial | `ca-app-pub-5816871059908402/1328346300` |
| Rewarded | `ca-app-pub-5816871059908402/2188685188` |

Твій пристрій зареєстрований як test device в AdMob console — можеш безпечно клікати рекламу.

## Приховані команди

- `npm run clean` — видалити `www/` і `android/` для чистої пересборки
- `npm run prepare-www` — тільки перебудувати `www/`, без Android-синку

## Якщо щось не працює

- **`cap add android` fails** — постав Android SDK через Android Studio (SDK Manager)
- **`gradlew: command not found`** — просто натискай Run у Android Studio, воно все зробить
- **Банер не показується** — перевір logcat: якщо App ID неправильний, буде крашsh при `AdMob.initialize`. Патч уже вставив правильний ID автоматично
- **"Requires review" в AdMob** — нормально для нових додатків, тестові реклами і так покажуться
