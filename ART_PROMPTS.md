# Cosmic Drift — Промти для генерації графіки (ChatGPT / DALL·E / image gen)

Це готові промти для створення **фонів** і **ворогів** для кожного з 5 секторів гри.
Гра — вертикальний космічний шутер (вид зверху, портретна орієнтація).

---

## ⚙️ ЗАГАЛЬНІ ПРАВИЛА (діють для ВСІХ зображень)

- **Стиль:** modern premium mobile arcade game art, полірований, соковиті кольори, м'яке неонове світіння (glow), об'ємне 3D-подібне освітлення. Референс — топові ігри типу Galaxy Attack / Sky Force Reloaded.
- **Вид:** строго **top-down (вид зверху)**, ортографічна проекція.
- **Без тексту, без UI, без водяних знаків, без рамок.**

### Технічні вимоги
| Параметр | Значення |
|----------|----------|
| Фони | портрет **1024×1792** (співвідношення ~9:16) |
| Вороги | квадрат **1024×1024**, або сет 2×3 на одному полотні |
| Фон спрайтів | **прозорий (transparent PNG)** |
| Формат | PNG |

> ⚠️ Якщо модель не вміє в прозорість — попроси **суцільний рівний фон чистого magenta (#FF00FF)** або чорного, щоб потім легко вирізати.

---

# 🌌 ЧАСТИНА 1 — ФОНИ (5 штук)

> ВАЖЛИВО для всіх фонів: центр екрана має бути **темним і малоконтрастним**, щоб було видно кораблі й кулі. Деталі й яскраві об'єкти — по краях (зверху/знизу/боки), не по центру. Фон вертикально прокручується, тому зроби його безшовним по вертикалі якщо можливо.

### 🔵 Сектор 1 — ALPHA SECTOR (руїни станції Aurora)
```
Top-down vertical scrolling space shooter background, portrait 9:16.
Deep cold blue cosmos, hue ~220. A vast debris field of a destroyed space
station: shattered metal panels, broken solar arrays, floating wreckage and
sparks drifting in the void. Distant blue nebula clouds and cold starlight.
Somber, lonely, aftermath-of-battle mood. Center of the image is dark and
uncluttered for gameplay readability, detail concentrated near top and bottom
edges. Premium mobile game art, soft glow, subtle depth. No text, no UI,
no characters, no spaceships.
```

### 🟠 Сектор 2 — BETA SECTOR (астероїдний пояс Kronos)
```
Top-down vertical scrolling space shooter background, portrait 9:16.
Warm orange-amber space, hue ~30. A dense asteroid belt: massive rocky
asteroids with glowing molten lava cracks, drifting dust and small debris,
distant burning nebula in orange and gold. Fiery, dangerous, industrial mood.
Center of the image stays dark and clear for gameplay, large asteroids only
near the edges. Premium mobile game art, soft glow, volumetric depth.
No text, no UI, no characters, no spaceships.
```

### 🟣 Сектор 3 — GAMMA SECTOR (флот вторгнення Nox)
```
Top-down vertical scrolling space shooter background, portrait 9:16.
Purple and magenta cosmos, hue ~280. An alien invasion warzone: swirling
violet nebula, distant silhouettes of a huge enemy mothership fleet on the
horizon, faint purple energy grids and glowing plasma clouds. Menacing,
high-tech, hostile mood. Center dark and low-contrast for gameplay, glowing
detail only near top and bottom edges. Premium mobile game art, neon glow,
cinematic depth. No text, no UI, no characters, no readable spaceships.
```

### 🔴 Сектор 4 — SHADOW STAR (фортеця Nox)
```
Top-down vertical scrolling space shooter background, portrait 9:16.
Dark crimson-red space, hue ~0, very moody and low-key. The surface of a
colossal moon-sized battle fortress: dark armored metal plating, red warning
lights, deep trench-like structures and mechanical panels stretching into
distance, faint red glow from reactor vents. Oppressive, industrial, ominous
mood. Center kept dark and clear for gameplay. Premium mobile game art,
red rim-light glow, deep shadows. No text, no UI, no characters.
```

### ⚫ Сектор 5 — NOX CORE (фінальна битва)
```
Top-down vertical scrolling space shooter background, portrait 9:16.
Apocalyptic red-black space around a reactor core, hue ~350. A swirling
black hole / energy singularity with a blazing red-white accretion ring,
cracks of raw energy tearing space apart, floating molten debris and intense
red glow. Epic, final-boss, end-of-the-world atmosphere. Center darker for
readability but with dramatic energy, brightest detail at top around the core.
Premium mobile game art, intense glow, high drama. No text, no UI, no characters.
```

---

# 👾 ЧАСТИНА 2 — ВОРОГИ (по секторах)

У грі 6 типів ворогів. У кожного своя **ігрова роль** — форма має її підказувати гравцю:

| Тип | Роль | Форма-підказка |
|-----|------|----------------|
| **Asteroid** | перешкода, що обертається | брила з тріщинами |
| **Kamikaze** | швидкий дрон-камікадзе | гострий, стрілоподібний, агресивний |
| **Sniper** | стрілок здалеку | видима гармата/ствол |
| **Shielded** | танк з енергощитом | масивний + бульбашка щита |
| **Turret** | нерухома вогнева точка | важка база з кількома стволами |
| **Splitter** | розпадається на дрібних | сегментований, «тріснутий» |

> Для КОЖНОГО спрайта: **вид строго зверху**, ніс/фронт спрямований **ВНИЗ** (до гравця), об'єкт по центру полотна, однаковий масштаб у межах сектора, прозорий фон.

Нижче — по одному промту на сектор (генерує весь набір ворогів у стилі сектора).
Кожен сектор має свою **фракцію/матеріал**, щоб вороги відрізнялись візуально.

### 🔵 Сектор 1 — ALPHA (уламкові дрони, холодний метал/синій неон)
```
Game asset sprite sheet, top-down view, transparent background.
A set of 6 enemy units for a vertical space shooter, cold steel and blue neon
faction, glowing blue accents, hue ~220. Arrange as a clean grid, each unit
centered, same scale, front pointing DOWN toward the viewer:
1) a rocky grey asteroid with subtle blue ice cracks;
2) a small sharp arrow-shaped kamikaze drone, aggressive, blue thruster glow;
3) a sniper ship with one long visible cannon barrel;
4) a bulky shielded tank ship surrounded by a translucent blue energy bubble;
5) a heavy stationary turret platform with multiple gun barrels;
6) a segmented cracked drone that looks like it will split apart.
Premium mobile game art, polished, soft glow, clean silhouettes. No text, no UI.
```

### 🟠 Сектор 2 — BETA (гірничі/лавові машини, помаранчевий)
```
Game asset sprite sheet, top-down view, transparent background.
A set of 6 enemy units for a vertical space shooter, rusty industrial mining
faction with molten lava glow, orange and amber, hue ~30. Grid layout, each
unit centered, same scale, front pointing DOWN:
1) a molten lava asteroid with bright glowing orange cracks;
2) a small sharp kamikaze drone with fiery orange exhaust;
3) a sniper rig with a long drill-cannon barrel;
4) a heavy armored shielded unit wrapped in a glowing orange energy shield;
5) a stationary turret of welded scrap metal with several barrels;
6) a cracked ore-drone that looks ready to break into pieces.
Premium mobile game art, rusty metal, lava glow, polished. No text, no UI.
```

### 🟣 Сектор 3 — GAMMA (біо-механічний прибульцевий флот, фіолетовий)
```
Game asset sprite sheet, top-down view, transparent background.
A set of 6 alien enemy units for a vertical space shooter, sleek bio-mechanical
Nox faction, glossy purple carapace with magenta neon veins, hue ~280. Grid
layout, each unit centered, same scale, front pointing DOWN:
1) a crystalline purple asteroid-pod with glowing magenta core;
2) a small dart-like kamikaze bio-drone, sharp and fast;
3) a sniper creature-ship with a long glowing plasma cannon;
4) a large shielded alien cruiser inside a shimmering purple energy dome;
5) a stationary spider-like turret with multiple plasma emitters;
6) a segmented alien pod that visibly splits into smaller ones.
Premium mobile game art, alien organic-tech, neon glow, polished. No text, no UI.
```

### 🔴 Сектор 4 — SHADOW STAR (важка бойова техніка фортеці, темно-червоний)
```
Game asset sprite sheet, top-down view, transparent background.
A set of 6 heavy warmachine enemies for a vertical space shooter, dark armored
fortress faction, black metal with crimson-red lights, hue ~0, menacing. Grid
layout, each unit centered, same scale, front pointing DOWN:
1) a dark armored debris chunk with red warning lights;
2) a sharp black kamikaze interceptor with red engine glow;
3) a sniper gunship with a long heavy railgun barrel;
4) a massive shielded battle-tank ship inside a red energy barrier;
5) a fortified stationary turret bunker with multiple red cannons;
6) a modular armored drone that separates into smaller units.
Premium mobile game art, dark military sci-fi, red rim light, polished. No text, no UI.
```

### ⚫ Сектор 5 — NOX CORE (енергетичні елітні юніти, червоно-чорний з енергією)
```
Game asset sprite sheet, top-down view, transparent background.
A set of 6 elite end-game enemy units for a vertical space shooter, corrupted
energy faction, obsidian-black bodies infused with blazing red-white plasma,
hue ~350, epic and dangerous. Grid layout, each unit centered, same scale,
front pointing DOWN:
1) a molten obsidian shard wreathed in red energy;
2) a razor-sharp kamikaze unit trailing white-hot plasma;
3) a sniper ship with a glowing energy lance cannon;
4) a colossal shielded elite guard inside an intense red-white energy sphere;
5) a stationary reactor-turret pulsing with plasma and multiple emitters;
6) an unstable energy core-drone that fractures into smaller shards.
Premium mobile game art, high-energy sci-fi, intense glow, polished. No text, no UI.
```

---

## 📋 ЯК КОРИСТУВАТИСЬ

1. Кидай промт у ChatGPT (з генерацією зображень) або DALL·E.
2. Якщо треба **один ворог окремо** — візьми з промта тільки його рядок (напр. пункт «2) kamikaze...») і додай загальні правила зверху.
3. Проси **прозорий фон**. Якщо не виходить — проси **чистий magenta фон** і я поможу вирізати.
4. Тримай **однаковий масштаб** ворогів у межах сектора (щоб у грі не було різнокаліберних).
5. Коли будуть готові зображення — скинь їх мені, і я підключу їх у код (заміню поточні мальовані спрайти на твої).

## 💡 Порада
Спочатку зроби **1 сектор повністю** (фон + 6 ворогів), підключимо, подивимось як виглядає в грі — і якщо стиль ок, за цим зразком доробимо решту 4 сектори. Так менше ризику переробляти все.

---

# 🚀 HD-КОРАБЕЛЬ ГРАВЦЯ (для Hangar / скінів / гри)

> Мета: чіткий top-down корабель у тому ж стилі, що зараз (AURORA — темний метал + бірюзові двигуни). База **синьо-сталева**, щоб скіни могли перефарбовувати його фільтром (crimson/emerald/solar/void/wraith). Ніс — строго **ВГОРУ**, симетрія, по центру.

**Головний промт:**
```
Top-down view of a single sci-fi fighter spaceship, nose pointing straight UP,
centered, perfectly symmetric, portrait orientation. Sleek dark gunmetal hull
with polished steel-blue panels, glowing cyan-blue cockpit canopy, swept-back
angular wings, twin/triple rear engine nozzles with bright blue-white plasma
glow. Premium mobile game art, glossy metallic shading, crisp clean edges, soft
neon rim light, subtle panel lines, high detail, 4K, studio lighting.
Transparent background (PNG). No text, no UI, no background scenery, no pilot.
Cool blue color scheme (hue ~215) so it can be recolored.
Square canvas 1024x1024, ship fills ~80% of height.
```

**Технічно:**
| Параметр | Значення |
|----------|----------|
| Вид | top-down, ніс УГОРУ |
| Полотно | 1024×1024 (або більше), квадрат |
| Фон | прозорий PNG (або чистий **magenta #FF00FF**, якщо прозорість не виходить) |
| Кольори | синьо-сталеві, hue ~215 (щоб фільтри скінів давали гарні варіанти) |
| Без | тексту, UI, фону, пілота, підпису |

**Як користуватись:** згенеруй → скинь мені PNG → я приберу фон (rembg), впишу у високій роздільності замість старого спрайта `ship` (170px) → стане чітко в Hangar, скінах і в грі (у грі просто зменшиться, тому лишиться різким).
