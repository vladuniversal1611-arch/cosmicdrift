# WeekNote → APK з AdMob (крок за кроком)

Мета: узяти `weeknote.html`, обгорнути його у справжній Android-додаток через **Capacitor**, підключити **AdMob-банер** (та за бажанням interstitial і rewarded), зібрати APK, залити в Play Store.

## 0. Що знадобиться

- **Node.js LTS** (v18 або v20+): https://nodejs.org
- **Android Studio** (з Android SDK): https://developer.android.com/studio
- **Java 17 JDK** (Android Studio зазвичай ставить сам)
- **AdMob-акаунт**: https://admob.google.com
- **Google Play Developer** для публікації (\$25 одноразово) — не потрібно для тестового APK

---

## 1. Створення проекту Capacitor

```bash
# У порожній папці
npm create @capacitor/app@latest weeknote-app
# → App name:  WeekNote
# → Package ID: com.tvoyename.weeknote   (буде видно в Play Store URL)
cd weeknote-app

# Встановити залежності
npm install
npm install @capacitor/android
npx cap add android
```

## 2. Замінити стартовий index.html на наш

```bash
# видалити стандартний index
rm -rf www/*
# скопіювати наш файл як index.html
cp /path/to/weeknote.html www/index.html
# якщо є папка assets — скопіювати теж
cp -r /path/to/assets www/assets 2>/dev/null || true
```

## 3. Встановити плагін AdMob

Спільнотний плагін для Capacitor:

```bash
npm install @capacitor-community/admob
npx cap sync android
```

## 4. Створити AdMob-акаунт і отримати ID

1. Йди на https://admob.google.com
2. **Apps → Add App → Android → "App not yet published"**
3. Назви додаток "WeekNote"
4. Отримай **App ID** — виглядає як `ca-app-pub-XXXX~YYYY`
5. У розділі **Ad units → Create ad unit**:
   - **Banner** → скопіюй ID `ca-app-pub-XXXX/BBBB`
   - **Interstitial** → скопіюй `ca-app-pub-XXXX/IIII` (опційно)
   - **Rewarded** → скопіюй `ca-app-pub-XXXX/RRRR` (опційно)

## 5. Вставити ID в weeknote.html

Знайди у файлі константу `ADMOB` і встав свої ID:

```js
const ADMOB = {
  enabled: false,
  androidAppId:  'ca-app-pub-XXXX~YYYY',       // ← свій
  iosAppId:      'ca-app-pub-XXXX~ZZZZ',       // якщо буде iOS
  androidBanner:       'ca-app-pub-XXXX/BBBB',
  iosBanner:           'ca-app-pub-XXXX/BBBB2',
  androidInterstitial: 'ca-app-pub-XXXX/IIII',
  iosInterstitial:     'ca-app-pub-XXXX/IIII2',
  androidRewarded:     'ca-app-pub-XXXX/RRRR',
  iosRewarded:         'ca-app-pub-XXXX/RRRR2',
  interstitialEveryNSwitches: 7,
};
```

## 6. Додати App ID в AndroidManifest.xml

Відкрий `android/app/src/main/AndroidManifest.xml` і в блок `<application>` додай **перед закриваючим тегом**:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXX~YYYY"/>
```

**Без цього рядка додаток краштиметься при старті!**

## 7. Створити файл-міст для AdMob → JS

Створи `www/admob-bridge.js`:

```js
// Викликається один раз після старту, під'єднує AdMob до window.WNAds
(function(){
  document.addEventListener('deviceready', async () => {
    if(!window.Capacitor || !window.Capacitor.Plugins.AdMob) return;
    const { AdMob, BannerAdPosition, BannerAdSize } = window.Capacitor.Plugins;

    // Ініціалізація
    await AdMob.initialize({ requestTrackingAuthorization: true });

    // Функції що викликає наш weeknote.html
    window.WNAds = {
      async showBanner(cfg){
        const isAndroid = window.Capacitor.getPlatform() === 'android';
        await AdMob.showBanner({
          adId: isAndroid ? cfg.androidBanner : cfg.iosBanner,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
        });
      },
      async showInterstitial(cfg){
        const isAndroid = window.Capacitor.getPlatform() === 'android';
        try {
          await AdMob.prepareInterstitial({
            adId: isAndroid ? cfg.androidInterstitial : cfg.iosInterstitial,
          });
          await AdMob.showInterstitial();
        } catch(e){}
      },
      async showRewarded(cfg, onReward){
        const isAndroid = window.Capacitor.getPlatform() === 'android';
        try {
          await AdMob.prepareRewardVideoAd({
            adId: isAndroid ? cfg.androidRewarded : cfg.iosRewarded,
          });
          const res = await AdMob.showRewardVideoAd();
          onReward && onReward(true, res);
        } catch(e){ onReward && onReward(false); }
      },
    };

    // Показати банер і активувати ads у нашому додатку
    enableAds();
    window.WNAds.showBanner(window.ADMOB);
  }, false);
})();
```

І в `www/index.html` (наш `weeknote.html`) перед закриваючим `</body>` (або перед `</script>` останнього блоку) додай:

```html
<script src="admob-bridge.js"></script>
```

## 8. Тестовий build

```bash
# Synced зміни у нативний проект
npx cap sync

# Відкрити в Android Studio
npx cap open android
```

В Android Studio: **Run → Run 'app'** (потрібен підключений телефон з USB debugging або емулятор).

Спочатку тестуй **із тестовими ID** — вони вже прописані в `weeknote.html`. Побачиш на банері напис "Test Ad".

## 9. Заміна на реальні ID

Коли тестові працюють — заміни ID у `ADMOB` на реальні і **обов'язково перебилди** через `npx cap sync`.

⚠️ **НЕ клікай сам на свої реальні реклами** — AdMob banit акаунти назавжди за це.

## 10. Release build (підписаний APK / AAB)

В Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** (для Google Play) або **APK** (для сайтів/тестів)
3. Створи keystore (збережи файл + паролі у безпечному місці!)
4. Готовий `.aab` файл лежить у `android/app/release/`

## 11. Публікація в Play Store

1. https://play.google.com/console — активуй акаунт (\$25)
2. Create app → English/Ukrainian
3. Заповни: назва, опис, іконка 512×512, скріншоти (мінімум 2)
4. Content rating (простий опитник — Everyone)
5. Target audience — 13+
6. Data safety — WeekNote не збирає дані (усе локально), заповни відповідно
7. Load .aab → send for review
8. **1-3 дні очікування**, потім live

---

## Розширення (пізніше)

- **Rewarded ads для розблокування Pro-теми на 24 год:** десь у Themes-екрані додай кнопку "🎁 Дивись рекламу — розблокуй Nature на день", виклич `showRewardedAd(ok => { if(ok) unlockTheme('nature', 86400000) })`
- **Firebase Analytics** — для розуміння що юзери роблять
- **In-app review prompt** через `@capacitor-community/in-app-review` — щоб просити 5⭐

---

## Прогноз доходу (реалістично)

| DAU | ~ Місяць |
|-----|----------|
| 100 | \$5–20 |
| 1000 | \$60–250 |
| 10 000 | \$600–2500 |

Ключ до успіху — не сама реклама, а **масштаб** через ASO, TikTok, Reddit.
