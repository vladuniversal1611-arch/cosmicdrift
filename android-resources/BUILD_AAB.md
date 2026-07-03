# Як зібрати AAB для Google Play

Native-проєкт Android уже згенеровано і лежить у теці **`android/`** прямо в репозиторії.
Тобі **не треба** мати HTML-файл, ставити Node чи запускати Capacitor — усе вже зроблено.
Потрібен лише **Android Studio**.

---

## Крок 1. Завантаж проєкт

1. Відкрий репозиторій на GitHub:
   `https://github.com/vladuniversal1611-arch/cosmicdrift`
2. Гілка (branch) угорі зліва → обери **`claude/dragon-merge-blast-game-b5idfz`**.
3. Зелена кнопка **Code → Download ZIP**.
4. Розпакуй ZIP у зручну теку.

*(або, якщо вмієш git):*
```
git clone -b claude/dragon-merge-blast-game-b5idfz https://github.com/vladuniversal1611-arch/cosmicdrift.git
```

## Крок 2. Відкрий у Android Studio

1. Постав **Android Studio** (безкоштовно): https://developer.android.com/studio
2. **File → Open** → вибери теку **`android`** усередині розпакованого проєкту
   (саме `android/`, не корінь!).
3. Почекай, поки Android Studio завантажить Gradle і SDK
   (перший раз — 5–15 хв, качає залежності з інтернету).
   Якщо запропонує оновити Android Gradle Plugin — можна погодитись (Update),
   це безпечно.

## Крок 3. Створи ключ підпису (один раз назавжди)

Google Play вимагає, щоб застосунок був підписаний. Роби це через майстер:

1. **Build → Generate Signed App Bundle / APK…**
2. Обери **Android App Bundle** → **Next**.
3. Під полем «Key store path» натисни **Create new…** і заповни:
   - **Key store path** — куди зберегти файл ключа (напр. `dragonblast.jks`)
   - **Password** — пароль для сховища (запиши й НЕ загуби)
   - **Alias** — напр. `dragonblast`
   - **Password** (для ключа) — можна той самий
   - **Validity (years)** — постав **25** або більше
   - Ім'я/організація — будь-що
4. **OK → Next.**

> ⚠️ **ДУЖЕ ВАЖЛИВО:** збережи файл `.jks` і обидва паролі у надійному місці.
> Якщо загубиш — не зможеш більше випускати оновлення гри під тим самим застосунком.

## Крок 4. Збери AAB

1. У майстрі обери **release** (не debug).
2. Постав галочки **V1** та **V2** (signature versions), якщо є.
3. **Create / Finish.**
4. Внизу з'явиться повідомлення «locate» — натисни, або знайди файл тут:
   `android/app/release/app-release.aab`

Це і є твій **`.aab`** файл для Google Play. 🎉

## Крок 5. Завантаж у Google Play Console

1. https://play.google.com/console → **Create app**.
2. У розділі **Production → Create new release** завантаж `app-release.aab`.
3. Заповни сторінку застосунку. Готові матеріали в теці `android-resources/`:
   - **Іконка 512×512** — `playstore-icon-512.png`
   - **Feature graphic 1024×500** — `feature-graphic-1024x500.png`
   - **Скріншоти** — тека `android-resources/screenshots/` (6 шт., 1080×1920)
4. Заповни політику приватності, вікові рейтинги, дані про рекламу
   (гра показує рекламу AdMob → познач «Yes, contains ads»).

---

## Що вже налаштовано за тебе

- ✅ Назва застосунку: **Dragon Blast** (`com.dragonblast.game`)
- ✅ Іконки застосунку (усі щільності) + splash-екран — з твого арту
- ✅ **AdMob App ID** прописано в `AndroidManifest.xml`
  (`ca-app-pub-5816871059908402~7483444743`)
- ✅ Рекламні юніти (rewarded + interstitial) — у `www/js/ads.js`
- ✅ Дозвіл `AD_ID` для реклами (Android 13+)
- ✅ **targetSdk 35** (Android 15) — вимога Google Play для нових застосунків
- ✅ UMP-згода (GDPR) — показується автоматично в ЄС
- ✅ Уся гра (5000 рівнів, 12 драконів, 12 мов) вбудована у `assets/public/`

## Якщо щось зміниш у грі пізніше

Якщо колись зміниш файли у `www/` і захочеш перезібрати:
```
npm install
npx cap copy android
```
і знову збери AAB (Крок 4). Але зараз цього робити не треба — усе вже скопійовано.

## Часті питання

- **«Треба лише 1 HTML файл?»** — Ні. Для Google Play потрібен `.aab`, а не HTML.
  Цей проєкт `android/` перетворює гру на справжній Android-застосунок.
- **«SDK location not found»** — Android Studio сам поставить SDK; погодься, коли
  запропонує, або **Tools → SDK Manager** → постав Android 15 (API 35).
- **«Build failed через версію Gradle»** — прийми пропозицію Android Studio
  оновити Gradle/AGP (**Upgrade**), потім збери знову.
