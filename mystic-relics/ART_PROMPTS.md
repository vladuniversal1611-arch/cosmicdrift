# 🎨 Mystic Relics — промпти для генерації спрайтів (GPT-4o / DALL·E / Midjourney)

Гра автоматично підхоплює PNG-файли з папки `assets/` (див. розділ «Куди класти файли»).
Поки файлу немає — рендериться emoji, тож можна замінювати поступово.

---

## 0. МАЙСТЕР-СТИЛЬ (додавай цей блок у кінець КОЖНОГО промпту)

> **Style block:**
> 2D casual mobile game asset, glossy cartoon style inspired by top match-3 games,
> vibrant saturated colors, soft rounded shapes, juicy thick highlights, subtle darker
> outline, gentle top-left lighting, slight 3D volume, centered composition, isolated
> on a fully transparent background, PNG, no text, no watermark, no frame, high detail.

**Поради для консистентності:**
- Генеруй усі іконки **в одному чаті/сесії** — модель тримає стиль.
- Перші 2–3 результати збережи і додавай як референс: «match the exact style of the attached icons».
- Розмір: проси **1024×1024**, потім стискай до 512×512 (tinypng.com).
- Якщо фон не прозорий — проси «isolated object on transparent alpha background» або вирізай через remove.bg.

---

## 1. ПЛИТКИ КОЛЕКЦІЇ — 72 іконки → `assets/tiles/tile_00.png … tile_71.png`

Шаблон промпту для однієї іконки:

> Game icon of **{опис}**, single object, reads clearly at small size. + Style block

Список (номер = ім'я файлу):

| # | Файл | Промпт-опис (встав у шаблон) |
|---|---|---|
| 00 | tile_00 | a sparkling blue-violet faceted gem |
| 01 | tile_01 | a mystic fortune-teller crystal orb with swirling purple mist inside |
| 02 | tile_02 | a golden five-pointed star crystal |
| 03 | tile_03 | a glowing crescent moon with tiny stars |
| 04 | tile_04 | a warm smiling-free stylized sun with wavy rays |
| 05 | tile_05 | a fire rune stone: rounded pebble with a glowing orange flame symbol |
| 06 | tile_06 | a lightning rune stone: rounded pebble with a glowing yellow bolt symbol |
| 07 | tile_07 | an ice rune stone: rounded pebble with a glowing cyan snowflake symbol |
| 08 | tile_08 | a water rune stone: rounded pebble with a glowing blue wave symbol |
| 09 | tile_09 | a small arched rainbow with soft clouds at both ends |
| 10 | tile_10 | a round glass potion bottle with bubbling green liquid and cork |
| 11 | tile_11 | an alchemist elixir flask with glowing pink liquid and thin neck |
| 12 | tile_12 | a red-capped toadstool mushroom with white dots |
| 13 | tile_13 | a small bunch of fresh green leaves |
| 14 | tile_14 | a pink sakura blossom flower |
| 15 | tile_15 | a bright yellow sunflower |
| 16 | tile_16 | an autumn red-orange maple leaf |
| 17 | tile_17 | a cute green cactus in terracotta pot |
| 18 | tile_18 | a bunch of purple grapes with one leaf |
| 19 | tile_19 | a shiny red apple with leaf |
| 20 | tile_20 | a blue morpho butterfly with open wings |
| 21 | tile_21 | a cute small green dragon head with golden horns |
| 22 | tile_22 | a wise brown owl with big golden eyes |
| 23 | tile_23 | a cute orange fox head |
| 24 | tile_24 | a grey wolf head in profile |
| 25 | tile_25 | a coiled emerald snake |
| 26 | tile_26 | a spiral pink seashell |
| 27 | tile_27 | a soft elegant white-brown feather |
| 28 | tile_28 | a cute round purple spider hanging on a thread |
| 29 | tile_29 | a cheerful green frog face |
| 30 | tile_30 | two crossed medieval swords |
| 31 | tile_31 | a knight shield with golden crest |
| 32 | tile_32 | a wooden bow with nocked arrow |
| 33 | tile_33 | an ornate dagger with jeweled hilt |
| 34 | tile_34 | a battle axe with carved wooden handle |
| 35 | tile_35 | a golden trident |
| 36 | tile_36 | a single shiny gold coin with star emblem |
| 37 | tile_37 | a small treasure pouch overflowing with gold coins |
| 38 | tile_38 | a royal golden crown with red gems |
| 39 | tile_39 | a golden ring with big diamond |
| 40 | tile_40 | an ornate antique golden key |
| 41 | tile_41 | a golden bell with wooden handle |
| 42 | tile_42 | an ancient greek amphora with ornament |
| 43 | tile_43 | a ceramic urn with mystic engravings |
| 44 | tile_44 | a moai-like stone idol head |
| 45 | tile_45 | an old parchment scroll with wax seal |
| 46 | tile_46 | a lit candle with warm flame |
| 47 | tile_47 | a nazar amulet: blue glass evil-eye talisman |
| 48 | tile_48 | a theater carnival mask, gold and purple |
| 49 | tile_49 | a cute cartoon skull, friendly not scary |
| 50 | tile_50 | a mystic all-seeing eye with radiant lashes |
| 51 | tile_51 | a cluster of shiny soap bubbles |
| 52 | tile_52 | a honey jar with wooden dipper |
| 53 | tile_53 | a pink lotus flower on a leaf |
| 54 | tile_54 | a lucky four-leaf clover |
| 55 | tile_55 | a glossy brown chestnut |
| 56 | tile_56 | a handful of blueberries with leaf |
| 57 | tile_57 | two red cherries on one stem |
| 58 | tile_58 | an amber scorpion |
| 59 | tile_59 | a small green gecko lizard |
| 60 | tile_60 | a cute sea turtle |
| 61 | tile_61 | a bird nest with three speckled eggs |
| 62 | tile_62 | a stylized swirling tornado |
| 63 | tile_63 | a blazing comet with sparkling tail |
| 64 | tile_64 | a ringed purple planet |
| 65 | tile_65 | a brass navigation compass |
| 66 | tile_66 | a golden clockwork gear |
| 67 | tile_67 | an hourglass with golden sand |
| 68 | tile_68 | a mystic tarot card with star emblem |
| 69 | tile_69 | a magic wand with glowing star tip |
| 70 | tile_70 | a colorful jigsaw puzzle piece |
| 71 | tile_71 | a gift box with golden ribbon |

**Швидкий варіант (сітками):** «A sprite sheet, 3×2 grid of six game icons on transparent
background, equal cells, no borders: {6 описів через ";"}. + Style block» — потім розріж
на 6 файлів (кожна клітинка 512×512).

---

## 2. ФОНИ СЦЕН → `assets/bg/forest.png`, `cave.png`, `temple.png` (1080×1920, portrait)

> **forest.png** — Vertical mobile game background, magical night forest: giant mossy
> tree trunks on the left and right edges framing an open misty center, glowing
> fireflies, bioluminescent mushrooms, rays of moonlight through canopy, deep
> emerald-green palette, painterly cartoon style, soft depth of field, NO characters,
> NO text, center area intentionally dark and calm for gameplay readability.

> **cave.png** — Vertical mobile game background, enchanted crystal cave: giant glowing
> cyan and violet crystals along the edges, stalactites at the top, soft mist near the
> ground, sparkling dust in the air, deep blue palette, painterly cartoon style, center
> area darker and calm for gameplay readability, no characters, no text.

> **temple.png** — Vertical mobile game background, ancient mystical temple ruins at
> dusk: weathered stone columns on both sides, broken arches, hanging vines, floating
> golden ember particles, warm amber and deep purple palette, painterly cartoon style,
> calm dark center for gameplay readability, no characters, no text.

---

## 3. БУСТЕРИ → `assets/boosters/shuffle.png, hint.png, hammer.png, freeze.png, wand.png` (512×512)

> **shuffle** — Game booster icon: two glossy crossed swap arrows forming a cycle,
> purple-magenta gradient. + Style block
> **hint** — Game booster icon: a glowing golden light bulb with sparkles. + Style block
> **hammer** — Game booster icon: a chunky wooden mallet with golden head. + Style block
> **freeze** — Game booster icon: a crystal ice cube with snowflake inside. + Style block
> **wand** — Game booster icon: a magic wand with radiant star and sparkle trail. + Style block

---

## 4. СКРИНІ → `assets/chests/wood.png, silver.png, gold.png, legendary.png` (768×768)

> Шаблон: Game reward chest, closed, slightly 3/4 view, {опис}. + Style block
> - **wood** — simple rounded wooden chest with iron bands
> - **silver** — elegant silver chest with blue gem on the lock
> - **gold** — ornate golden chest with red gems and engravings
> - **legendary** — epic purple-gold chest with glowing runes, floating sparkles and god-rays

---

## 5. ВАЛЮТИ ТА UI → `assets/ui/` (512×512)

> **coin.png** — Game currency icon: glossy gold coin with embossed mystic star. + Style block
> **gem.png** — Game currency icon: glossy purple faceted crystal gem. + Style block
> **star.png** — Game rating star: chunky glossy golden star. + Style block
> **heart.png** — Game life icon: glossy red heart with highlight. + Style block

---

## 6. ІКОНКА, СПЛЕШ, ГРАФІКА ДЛЯ GOOGLE PLAY

> **icon_1024.png (1024×1024, БЕЗ прозорості)** — Mobile game app icon: a glowing purple
> fortune-teller crystal orb on an ornate golden stand, magical sparkles around, deep
> dark-violet radial background, juicy glossy cartoon style, bold silhouette readable at
> 48px, no text, square full-bleed composition.

> **splash_2732.png (2732×2732, центр-безпечна зона)** — Mobile game splash screen art:
> the glowing crystal orb from the app icon floating in a magical night forest clearing,
> fireflies and light rays, composition centered with generous empty margins on all
> sides, painterly cartoon style, no text.

> **feature_1024x500.png** — Google Play feature graphic 1024×500: magical forest scene
> with glowing crystal orb on the left third, scattered glossy game tiles with fantasy
> icons flying on the right, sparkles, juicy cartoon style, space reserved in the center
> for logo text, no actual text.

---

## 7. ПЕРЕПОНИ (оверлеї, прозорий фон, 512×512) → `assets/obstacles/`

> - **ice.png** — semi-transparent cracked ice layer covering a square tile shape
> - **chain.png** — two crossed heavy chains with a padlock, for overlaying on a tile
> - **stone.png** — rough stone shell encasing a square tile shape
> - **lock.png** — golden padlock with mystical engraving
> - **fog.png** — soft swirl of dark purple fog
> - **curse.png** — ominous glowing purple skull mark
> - **portal.png** — spiraling teal magic portal swirl

*(Оверлеї поки що малюються процедурно — ці файли на майбутнє.)*

---

## Іконки меню (кнопки нижньої та середньої панелі)

Кладуться у `assets/icons/<id>.png`. Кожна іконка сидить усередині кольорового
круглого диска (диск малює CSS), тому **сам об'єкт — на прозорому фоні, по центру**.
Стиль — той самий, що монета/кристал/скриня: соковитий 3D-мультяшний, глянець,
товста темна обводка, світло згори-зліва.

Файли (9): `shop`, `collection`, `home`, `achievements`, `profile`, `daily`,
`wheel`, `missions`, `chests`.

### Спрайт-лист 1 (6 об'єктів)
> Create a single 1024×1024 PNG sprite sheet with a fully transparent background,
> containing 6 mobile-game UI icons arranged in a clean 3×2 grid, evenly spaced,
> each centered in its own cell with generous padding and NOT touching.
> Style: premium casual mobile game (like Royal Match / Toon Blast) — glossy,
> chunky 3D, thick dark outline, soft top-left light, vibrant saturated colors,
> subtle inner glow. No text, no background, no drop shadow onto the canvas
> (transparent alpha only). The 6 icons, left-to-right, top-to-bottom:
> 1) a wrapped GIFT BOX with a golden ribbon and bow;
> 2) a colorful FORTUNE WHEEL (prize wheel) seen straight-on with a top pointer;
> 3) an old QUEST SCROLL (parchment) partly unrolled with a small check mark;
> 4) a wooden TREASURE CHEST with gold trim, slightly open with glow inside;
> 5) a cozy MARKET / SHOP stall or a shopping bag with a coin;
> 6) a FAN OF THREE PLAYING CARDS (collection), glossy with a star.
> All icons same visual weight and size, consistent lighting and outline.

### Спрайт-лист 2 (3 об'єкти)
> Same style and rules as before — single 1024×1024 PNG, transparent background,
> 3 icons in one row, centered, generous padding, glossy chunky 3D casual-game UI,
> thick dark outline, top-left light, no text, no background:
> 1) a fairy-tale CASTLE with purple turrets and flags (home);
> 2) a golden TROPHY cup with a star (achievements);
> 3) a friendly WIZARD avatar bust (round face, blue pointed hat with stars) —
>    head-and-shoulders, centered (profile).

Коли згенеруєш — кинь мені готові листи, я поріжу, відцентрую, приберу фон і
розкладу у `assets/icons/` (гра підхопить автоматично, емодзі лишаються як fallback).

---

## Куди класти файли

```
mystic-relics/
└── assets/
    ├── tiles/tile_00.png … tile_71.png   ← підхоплюються АВТОМАТИЧНО
    ├── bg/forest.png cave.png temple.png ← підхоплюються АВТОМАТИЧНО
    ├── boosters/…  chests/…  ui/…        ← зарезервовано (наступний крок)
    └── icon/icon_1024.png splash_2732.png feature_1024x500.png
```

- **Плитки**: гра перевіряє `assets/tiles/tile_NN.png`; якщо файл є — малює його на
  плитці та в колекції замість emoji. Часткова заміна працює (поклав 10 файлів — 10
  плиток нові, решта emoji).
- **Фони**: якщо є `assets/bg/<сцена>.png` — він малюється замість процедурних
  силуетів (світлячки, туман і листя лишаються поверх).
- Після додавання файлів онови однофайловий білд або просто перезапусти сторінку.
