# Mystic Relics — чек-лист готовності до Google Play

Статус гри: **функціонально готова**. Нижче — що вже зроблено і що лишилось
(останнє переважно вимагає ТВОЇХ акаунтів/ключів, а не коду).

---

## ✅ Уже готово (у коді)

- Гра повністю офлайн: HTML/CSS/Vanilla JS/Canvas/WebAudio, без бібліотек.
- Локальне збереження прогресу (LocalStorage, автозбереження + при згортанні).
- 5000 гарантовано прохідних рівнів, 72 плитки, 10 тем, щоденні нагороди,
  місії, 100 досягнень, колесо, скрині (купівля/за рекламу з денним лімітом).
- Оригінальний арт: спрайти валют, іконок меню, плиток, фонів, скринь, бустерів.
- Адаптивність: перевірено 320–1280 px, портрет/ландшафт — без переповнення, 0 помилок.
- Продуктивність: полотно з «пікселевим бюджетом» (телефони ×2, планшети не роздуваються).
- Музика замовкає у фоні, відновлюється при поверненні.
- Точки монетизації зашиті (`js/ads.js`): банер, інтерстішл (кожні 3 рівні),
  rewarded (колесо / друга спроба / магазин / скрині), IAP (покупки).
- `ads.js` двошляховий: у вебі — демо, нативно — реальний AdMob (за наявності плагіна).
- Capacitor готовий: `capacitor.config.json`, `package.json`, `assets/icon.png`,
  `assets/splash.png` (портрет-лок і темний status bar — у README).

---

## ⛳ Лишилось зробити перед публікацією

### 1. AdMob (реклама)
- [ ] Створити застосунок і рекламні одиниці в [AdMob](https://admob.google.com).
- [ ] `npm i @capacitor-community/admob && npx cap sync`
- [ ] У `js/ads.js` → `AD_IDS` замінити ТЕСТОВІ id Google на свої (banner/interstitial/rewarded).
- [ ] Додати App ID у `android/app/src/main/AndroidManifest.xml`:
  ```xml
  <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
             android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
  ```
- [ ] Додати дозвіл (Android 13+): у `<manifest>`
  ```xml
  <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
  ```

### 2. Внутрішні покупки (IAP)
- [ ] `npm i @capacitor/purchases` (або RevenueCat) і реалізувати `Ads.purchase()`.
- [ ] У Play Console створити товари з id з `CFG.SHOP` (`coins_s/m/l`, `gems_s/m/l`, `premium_noads`).

### 3. Ідентифікація застосунку
- [ ] Замінити `appId` `com.yourstudio.mysticrelics` на свій (у `capacitor.config.json`).
- [ ] Задати `versionCode`/`versionName` у `android/app/build.gradle`.

### 4. Підпис і збірка
- [ ] Згенерувати keystore, налаштувати `signingConfigs.release` (див. README, розділ 4–5).
- [ ] `npm install && npm run cap:add && npm run cap:sync && npm run assets && npm run build:aab`
- [ ] Портретний лок: `android:screenOrientation="portrait"` в activity (див. README 3.1).

### 5. Сторінка в Play Console
- [ ] Назва, короткий і повний опис, категорія (Гра → Головоломки).
- [ ] Скриншоти (телефон + планшет), feature graphic — є `assets/icon/feature_1024x500.png`.
- [ ] **Політика конфіденційності** (обов'язково через рекламу) — шаблон у `PRIVACY.md`, розмістити за URL.
- [ ] Форма **Data safety** (збір ID реклами через AdMob), віковий рейтинг (IARC).
- [ ] Спочатку **закрите тестування**, потім Production.

---

## Примітки
- Тестові AdMob id уже вшиті — можна збирати й перевіряти покази реклами ДО отримання власних id.
- Прем'ум (`premium_noads`) уже вимикає банер і рекламу (`Ads.hideBanner()` + перевірки `Storage.data.premium`).
