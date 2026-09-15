# Cosmic Drift — Промти для UI-спрайтів (кнопки, панелі)

Замінимо CSS-кнопки на намальовані спрайти. Генеруй у ChatGPT / DALL·E,
скидай мені готові PNG — я підключу в код (з CSS як fallback).

---

## ⚙️ ЗАГАЛЬНІ ПРАВИЛА (для ВСІХ UI-спрайтів)

- **Стиль:** premium sci-fi game HUD, glossy, полірований метал/скло, м'яке
  неонове світіння, чисті форми. Референс — UI топових мобільних шутерів.
- **Вид:** плаский, фронтальний (flat UI icon style), НЕ 3/4, без перспективи.
- **Фон:** **прозорий (transparent PNG)**. Якщо не виходить — чистий **magenta (#FF00FF)**.
- **Без тексту** (крім тих, де прямо вказано), без зайвих написів, без водяних знаків.
- Кожен елемент **по центру**, з невеликим відступом від країв, однакового масштабу.

### Кольори (щоб збігалось із грою)
| Елемент | Колір |
|---------|-------|
| LASER | синій `#4aa0ff` |
| SPREAD | помаранчевий `#ffaa44` |
| ROCKET | червоний `#ff5544` |
| NOVA (ultimate) | фіолетовий `#9a6aff` |
| Панелі / пауза | синьо-сталевий `#3b6ad0` |

---

## 🎮 ГОЛОВНИЙ ПРОМТ — UI KIT (усе одним аркушем)

Найкраще для єдиного стилю. Розкладка: сітка, кожен елемент окремо, прозорий фон.

```
Game UI kit sprite sheet, flat front view, transparent background,
premium glossy sci-fi HUD style, clean neon glow, polished glass and metal.
Lay out these elements separated on a grid, each centered:

1) a round glossy blue button (#4aa0ff) with a bold lightning-bolt icon;
2) a round glossy orange button (#ffaa44) with a flame / three diverging arrows icon;
3) a round glossy red button (#ff5544) with a rocket icon;
4) a wide rounded pill button in purple (#9a6aff) with a comet / starburst icon (no text);
5) a small square glossy blue button with a pause icon (two vertical bars);
6) an empty wide rounded rectangular HUD panel frame, blue steel (#3b6ad0),
   glossy glass, thin glowing border, hollow center (for text overlay).

All elements: sci-fi mobile game art, soft glow, subtle top light reflection,
transparent background, no text labels. High detail, crisp edges.
```

---

## 🔩 ОКРЕМІ ПРОМТИ (якщо треба по одному)

### ⚡ Кнопка LASER
```
A single round glossy game button, flat front view, transparent background.
Deep blue (#4aa0ff) sci-fi button with a bright glowing lightning-bolt icon in
the center, polished glass surface, soft top light reflection, thin glowing neon
rim. Premium mobile game UI, high detail, no text.
```

### 🔥 Кнопка SPREAD
```
A single round glossy game button, flat front view, transparent background.
Orange (#ffaa44) sci-fi button with a glowing flame / three diverging arrows icon
in the center, polished glass surface, soft top reflection, thin glowing rim.
Premium mobile game UI, high detail, no text.
```

### 🚀 Кнопка ROCKET
```
A single round glossy game button, flat front view, transparent background.
Red (#ff5544) sci-fi button with a glowing rocket icon in the center, polished
glass surface, soft top reflection, thin glowing neon rim. Premium mobile game UI,
high detail, no text.
```

### ☄️ Кнопка NOVA (ultimate)
```
A wide rounded pill-shaped game button, flat front view, transparent background.
Purple (#9a6aff) glossy sci-fi ultimate button with an energy / comet starburst
glow, bright neon rim, polished glass. Premium mobile game UI, high detail, no text.
```

### ⏸️ Кнопка PAUSE
```
A small square glossy game button with rounded corners, flat front view,
transparent background. Blue steel sci-fi button with a simple pause icon
(two vertical bars) glowing softly. Premium mobile game UI, high detail, no text.
```

### 🧊 Панель HUD (для SCORE / LIVES)
```
An empty horizontal HUD panel frame, flat front view, transparent background.
Wide rounded rectangle, blue steel (#3b6ad0) glossy glass with a thin glowing
neon border and subtle top light reflection. The center is empty/hollow so text
can be placed on top. Premium sci-fi mobile game UI, no text, high detail.
```

---

## 📐 ТЕХНІЧНІ ВИМОГИ
| Елемент | Форма | Розмір полотна |
|---------|-------|----------------|
| Кнопки LASER/SPREAD/ROCKET | круг | 512×512 (квадрат) |
| NOVA | широка пігулка | 1024×384 |
| PAUSE | квадрат зі скругленням | 512×512 |
| Панель SCORE/LIVES | широкий прямокутник | 1024×448 |

- **Прозорий фон обов'язково.**
- Кнопки без цифр/зарядів — заряди й текст я накладу зверху кодом.
- Панель — порожня рамка, число рахунку/сердечка я накладу зверху.

---

## 💡 ПОРАДА
Почни з **3 кнопок здібностей** (LASER/SPREAD/ROCKET) — це найбільший ефект і
найпростіше підключення. Скинь їх — підключу, глянемо в грі. Якщо стиль
подобається — доробимо NOVA, паузу й панелі за тим самим зразком.

Коли будуть готові — я:
- підключу спрайти як фон кнопок/панелей,
- залишу CSS-світіння для станів (готово / заряджається / порожньо),
- накладу зверху заряди й текст рахунку.
