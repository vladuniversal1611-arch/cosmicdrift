# Skydoku → Android (Capacitor)

Гра тепер збирається в Android-додаток через **Capacitor** — командами, без
ручного перетягування файлів.

## Що треба один раз встановити
- **Node.js** (LTS) — https://nodejs.org
- **Android Studio** — https://developer.android.com/studio
- JDK 17 (ставиться разом з Android Studio)

## Команди (у папці проєкту)

Папка `android/` уже в репозиторії (з іконками, AdMob App ID і портретом), тому
`npx cap add` НЕ потрібен:

```bash
npm install                 # ставить Capacitor + плагіни + esbuild
npm run cap:sync            # збирає гру і копіює її в android/
npx cap open android        # відкриває Android Studio → тисни Run ▶
```

Далі, коли щось змінюєш у грі — досить `npm run cap:sync` і знову Run.
(Іконки вже згенеровані; перегенерувати після заміни `assets/icon.png` — `npm run icons`.)

## Що вже підключено (нічого робити не треба)
- 🎮 **Гра** — `webDir: www` (Capacitor вантажить `www/index.html`).
- 📺 **Реклама** — плагін `@capacitor-community/admob` (rewarded / interstitial /
  banner), гра сама його викликає.
- 🔔 **Нагадування** — плагін `@capacitor/local-notifications` (1/3/7 днів).
- 🎨 **Іконка** — з `assets/icon.png` через `npm run icons`.
- 📱 **Статус-бар** — ховається (immersive) через `@capacitor/status-bar`.

## Тестова реклама (щоб не забанили акаунт)
Не клікай **власну живу рекламу**. Для перевірки на пристрої або тимчасово
підстав **тестові unit-ID** Google у `src/config/Config.js` → `ads.admob`, або
додай свій пристрій як test device. На реліз повертай свої живі ID.

## Реліз (Play Store)
У Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle
(.aab)**, підпиши ключем — і завантажуй у Google Play Console.
