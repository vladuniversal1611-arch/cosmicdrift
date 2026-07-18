# Підключення покупок за реальні гроші (Google Play Billing)

У грі є 7 товарів (у `js/config.js` → `CFG.SHOP`):

| id                | Тип у Play              | Що дає                    |
|-------------------|-------------------------|---------------------------|
| `coins_s/m/l`     | **Consumable** (витратний) | пакети монет (можна купувати повторно) |
| `gems_s/m/l`      | **Consumable** (витратний) | пакети кристалів          |
| `premium_noads`   | **Non-consumable** (разовий) | вимикає рекламу назавжди + 1000 💎 |

> Витратні товари **обов'язково** треба «споживати» (consume) після видачі,
> інакше їх не можна купити вдруге. RevenueCat робить це автоматично.

---

## Найпростіший шлях — RevenueCat (рекомендовано)

RevenueCat безкоштовний до $2.5k/міс доходу, сам валідує чеки й споживає покупки.

### 1. Play Console — створити товари
Monetize → In-app products / Subscriptions → **Create product** для кожного id з таблиці.
Ціни бери з `CFG.SHOP` (там уже вказані). Тип: coins/gems = Consumable, premium = Non-consumable.

### 2. RevenueCat — налаштувати
1. Зареєструйся на [revenuecat.com](https://www.revenuecat.com), створи проєкт.
2. Додай застосунок Google Play (завантаж service-account JSON з Google Cloud — інструкція в RC).
3. У RC додай ті самі Products (ті ж id). Для `premium_noads` створи **Entitlement** з назвою `premium`.
4. Скопіюй **Google API Key** (`goog_...`).

### 3. Код
```bash
npm i @revenuecat/purchases-capacitor
npx cap sync
```
У `js/ads.js` заміни `IAP_KEY: 'goog_XXX...'` на свій ключ. **Усе.**
Логіка вже реалізована в `Ads.purchase()` (двошляхова: веб-демо / реальна покупка),
а `Ads.restore()` відновлює Premium.

### 4. Тест
- Додай тестові акаунти в Play Console → License testing.
- Залий білд у **Internal testing**, встанови на телефон з тестового акаунта — покупки будуть без списання грошей.

---

## Альтернатива без сторонніх сервісів — cordova-plugin-purchase

Якщо не хочеш RevenueCat, є безкоштовний `cordova-plugin-purchase` (працює з Capacitor),
який напряму спілкується з Play Billing. Він подієвий (`store.when().approved().verified().finished()`),
тож `Ads.purchase()` треба переписати під його модель. Це більше коду й ручного
керування consume/acknowledge — бери, лише якщо принципово без RevenueCat.

---

## Важливо
- Ціни й валюту показує сам магазин за id — рядки цін у `CFG.SHOP` («19,99 ₴») лишаються
  тільки для веб-демо; у застосунку краще підтягувати `product.priceString` з плагіна.
- `premium` уже перевіряється всюди (`Storage.data.premium`) — реклама вимикається автоматично.
- Після встановлення застосунку на новому пристрої зроби «Restore purchases», щоб повернути Premium.
