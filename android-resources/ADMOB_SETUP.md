# AdMob (реклама) — як увімкнути на релізі

Гра вже має повний рекламний шар (`www/js/ads.js`, глобал `window.Ads`).
У браузері/прев'ю показується **симуляція** реклами, а на зібраному Android
додатку — **справжня реклама Google AdMob** через плагін
`@capacitor-community/admob`. Нижче — кроки, щоб активувати справжню рекламу.

## Що вже зроблено в коді
- `www/js/ads.js` — `Ads.rewarded(onReward, onClose)`, `Ads.interstitial()`,
  ініціалізація, прелоад, частотне обмеження інтерстишлів.
- Розміщення реклами (rewarded):
  - Магазин → «Реклама за винагороду» (+100🪙 +20⚡)
  - Програш → «+5 ходів»
  - Немає життів → «+1 ❤»
  - Екран перемоги → «📺 Подвоїти нагороду»
- Інтерстишл: після завершення рівня (кнопки «Далі»/«Карта»), з обмеженням —
  не частіше ніж раз на 3 рівні / 90 сек і не для новачків (перші 3 перемоги).
- `package.json` містить залежність `@capacitor-community/admob`.

## Кроки для релізу

### 1. Створити AdMob акаунт і юніти
1. https://admob.google.com → створи застосунок «Dragon Merge Blast» (Android).
2. Створи 3 рекламні юніти й скопіюй їхні ID:
   - Rewarded (відео за винагороду)
   - Interstitial (повноекранна)
   - Banner (необов'язково)
3. Запиши **AdMob App ID** (виглядає як `ca-app-pub-XXXXXXXX~YYYYYYYY`).

### 2. Вставити свої ID у гру
У `www/js/ads.js` → об'єкт `CONFIG`:
```js
testing: false,                       // ВАЖЛИВО: false для продакшену
android: {
  rewarded:     'ca-app-pub-ТВОЄ/юніт',
  interstitial: 'ca-app-pub-ТВОЄ/юніт',
  banner:       'ca-app-pub-ТВОЄ/юніт'
}
```
Потім перезібрати single-file: `node android-resources/build.js`.

### 3. Встановити плагін і додати App ID
```bash
npm install @capacitor-community/admob
npx cap sync android
```
У `android/app/src/main/AndroidManifest.xml` всередині `<application>` додати:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXX~YYYYYYYY"/>
```
(це **App ID**, не юніт). Без нього застосунок впаде на старті.

### 4. Згода користувача (обов'язково для Google Play)
Для показу персоналізованої реклами в ЄС потрібна згода (UMP / Consent).
Плагін підтримує `AdMob.requestConsentInfo()` / `showConsentForm()`.
Додай виклик у `ads.js` `ensureInit()` перед першим показом, або
використай Google UMP SDK. Без згоди показуй лише неперсоналізовану рекламу.

### 5. Тест
- Тримай `testing: true` під час розробки (Google тестові юніти вже вписані —
  показують тестову рекламу, безпечно).
- Додай свій пристрій у `testingDevices`, якщо потрібно.
- **Ніколи не клікай на власну справжню рекламу** — це порушення політики AdMob.

## Політика / поради
- Rewarded — завжди опт-ін (гравець сам обирає). ✅ вже так.
- Interstitial — не показуй одразу після rewarded і не частіше за обмеження. ✅.
- Не показуй рекламу під час активного геймплею — лише на переходах. ✅.
- Заборонена винагорода за банер; лише за rewarded-відео.
