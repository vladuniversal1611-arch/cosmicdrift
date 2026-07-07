# 📱 Lava Survivor — збірка для Android / Google Play

Гра повністю самодостатня: один файл `index.html` без зовнішніх залежностей
(працює офлайн, збереження — у `localStorage`). Нижче — два способи упаковки.

---

## Варіант 1 (рекомендовано): Capacitor

Дає повний доступ до нативних плагінів (AdMob, Google Play Billing).

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
mkdir www && cp index.html www/
npx cap init "Lava Survivor" com.yourstudio.lavasurvivor --web-dir=www
npx cap add android
npx cap open android          # відкриє Android Studio
```

У `android/app/src/main/AndroidManifest.xml` зафіксуйте вертикальну орієнтацію:

```xml
<activity ... android:screenOrientation="portrait">
```

Збірка релізу: **Build → Generate Signed Bundle (AAB)** → завантажте в Google Play Console.

### Монетизація

У коді гри є два маркери:

| Маркер | Де | Що підключити |
|---|---|---|
| `[ADS]` | функція `rewardedAd()` | `@capacitor-community/admob` → RewardedAd; викликайте `onDone()` після `onRewarded` |
| `[IAP]` | кнопка `btnPrem` (преміум-перепустка) | Google Play Billing (`cordova-plugin-purchase` або RevenueCat) |

Зараз обидва працюють як симуляція, тож гру можна тестувати без SDK.

---

## Варіант 2: TWA (Trusted Web Activity) через Bubblewrap

Якщо розмістити гру на HTTPS-хостингу (GitHub Pages підійде):

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://ВАШ_ДОМЕН/manifest.json
bubblewrap build
```

Потрібні PNG-іконки `icon-192.png` та `icon-512.png` (згенеруйте з SVG-іконки
в `<head>` файлу) і файл `assetlinks.json` для верифікації домену.

---

## Чекліст перед публікацією

- [ ] Іконки 192/512 px + feature graphic 1024×500
- [ ] `versionCode` / `versionName` в `build.gradle`
- [ ] Політика конфіденційності (гра не збирає даних — збереження локальні)
- [ ] Анкета «Вміст додатка» → без реклами примусової, реклама лише за винагороду
- [ ] Тест на слабкому пристрої: у грі є режим «Графіка: економна» (⚙️ Налаштування)

## Технічні характеристики гри

- Роздільна здатність: логічні 400×700, масштабується під будь-який екран
- 60 FPS: фіксований крок фізики, ліміт частинок, `dt`-clamp проти фризів
- Збереження: `localStorage` (`lavaSurvivor.v1`), автозбереження кожні 30 с,
  при згортанні застосунку та перед закриттям
- Офлайн-нагороди: рахуються від `lastSeen`, максимум 8 годин
