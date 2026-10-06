# Bulbik Run: додаток для Android / iOS з рекламою AdMob

Гра — це один файл `frog-endless-runner.html`. Ця папка загортає його в додаток
(Capacitor) і підключає рекламу Google AdMob.

## Що вже налаштовано
- **Реклама в грі** (`AD_CFG` на початку розділу `ADS` у `frog-endless-runner.html`):
  - **за винагороду (rewarded)**: воскресіння, ключі, скрині, преміум-скіни. Гравець сам натискає «реклама»;
  - **міжсторінкова (interstitial)**: коли гравець виходить з екрана результатів. Не показується в перших 3 забігах гравця, потім показується не частіше ніж раз на 3 забіги і не частіше ніж раз на 2.5 хв. Якщо гравець щойно сам дивився рекламу за винагороду, 90 с її не буде;
  - **банер**: унизу в меню та на всіх екранах-списках. Під час забігу та на екрані результатів банера немає. Меню автоматично піднімається над банером.
- **Згода GDPR** (форма Google для ЄС/UK) показується сама, якщо потрібна.
- **Android-проєкт** (`android/`):
  - лише портрет;
  - повний екран: шторка з годинником і кнопки навігації сховані;
  - іконка Bulbik;
  - тестовий AdMob App ID.
- Зараз скрізь стоять **тестові** id від Google. Реклама справжня, але з позначкою «Test Ad» і без оплати.

## 1. Встановити (один раз)
1. **Node.js LTS**: https://nodejs.org
2. **Android Studio**: https://developer.android.com/studio (у ньому вже є JDK і Android SDK).
3. У цій папці (`app/`) виконати:
   ```
   npm install
   npm run android
   ```
   Гра скопіюється в `www/`, проєкт синхронізується і відкриється Android Studio.
4. Підключи телефон по USB (у телефоні: «Для розробників» → «Налагодження USB») і натисни ▶ Run.
   Перевір у грі:
   - **банер:** внизу меню;
   - **реклама за винагороду:** кнопка «реклама» в магазині;
   - **міжсторінкова:** з'явиться після 4-го забігу.

Після кожної зміни гри достатньо виконати `npm run sync` і знову натиснути ▶ Run.

## 2. Своя реклама AdMob (щоб заробляти)
1. Зареєструйся на https://admob.google.com → **Apps → Add app** → Android → «ще не опубліковано».
2. Скопіюй **App ID** (`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`) у файл
   `android/app/src/main/res/values/strings.xml` → рядок `admob_app_id`.
3. Створи 3 рекламні блоки (**Ad units**): **Banner**, **Interstitial**, **Rewarded**.
   Їхні id (`ca-app-pub-…/…`) встав у `frog-endless-runner.html`, в `AD_CFG.android`:
   `banner`, `inter` і `reward`.
4. Там само постав `test:false`.
   ⚠️ Поки тестуєш на своєму телефоні, не натискай на свою справжню рекламу, бо AdMob може заблокувати акаунт.
   Для тестів краще додай свій телефон у AdMob → Settings → **Test devices**.
5. AdMob → **Privacy & messaging** → створи повідомлення **GDPR** (European regulations). Гра покаже його сама.
6. Коли буде сайт розробника (його вказуєш у Play Console), поклади на нього файл `app-ads.txt`.
   Текст для нього AdMob дає в розділі Apps → app-ads.txt.
7. Виконай `npm run sync`.

## 3. Збірка для Google Play
Android Studio → **Build → Generate Signed App Bundle / APK → Android App Bundle**.
Створи ключ (keystore) і **збережи його та паролі назавжди**, бо без них не вийде оновити гру.
Отриманий `.aab` завантажуй у Play Console.

У Play Console:
- **Ads:** «Так, містить рекламу».
- **Target audience:** простіше обрати 13+. Якщо обереш і дітей до 13 років, діятимуть правила Families policy.
  Тоді в `AD_CFG` треба поставити `childDirected:true` (і краще напиши мені, я перевірю решту).
- **Data safety:** AdMob збирає ідентифікатор реклами та приблизне місцезнаходження.
  Google має готову підказку, що вказати для AdMob.

## iOS (потрібен Mac з Xcode)
```
npm install
npx cap add ios
npm run ios
```
У `ios/App/App/Info.plist` додай:
- `GADApplicationIdentifier` (iOS App ID з AdMob);
- `SKAdNetworkItems`;
- `NSUserTrackingUsageDescription` (текст на кшталт «Дозвіл дає змогу показувати рекламу, цікавішу для вас»).

Детальніше: https://github.com/capacitor-community/admob#ios.
Id блоків для iOS заповнюються в `AD_CFG.ios`.
