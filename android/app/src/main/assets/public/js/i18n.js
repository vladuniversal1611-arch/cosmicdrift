/* ============================================================
   i18n — localization for Dragon Merge Blast.
   Languages: Ukrainian (uk), English (en), Spanish (es),
   German (de), French (fr), Portuguese (pt).
   Usage: T('key', { n: 5 })  → localized string with {n} filled.
   ============================================================ */
(function (global) {
  'use strict';

  const STR = {
    uk: {
      lang_name: 'Українська',
      // nav
      nav_map: 'Карта', nav_dragons: 'Дракони', nav_shop: 'Магазин', nav_pass: 'Пропуск', nav_island: 'Острів',
      // home
      play_level: '▶ Грати рівень {n}', incubator: '🥚 Інкубатор драконів',
      t_daily: 'Щоденна', t_quests: 'Квести', t_leaderboard: 'Рейтинг', t_ach: 'Досягнення', t_options: 'Опції',
      hatch: 'Вилупити!', charge10: 'Зарядити +10⚡', need_energy: 'Недостатньо енергії ⚡ (грайте рівні)',
      new_dragon: '🎉 Новий дракон!', great: 'Чудово!',
      // map
      islands_title: '🗺️ Острови драконів', locked_at: '🔒 рівень {n}', level_n: 'Рівень {n}',
      // preview
      goal: '🎯 {text}', goal_score: 'Набрати {n} очок', goal_collect: 'Зібрати {n} × {g}',
      goal_ice: 'Розбити всі блоки ({n})', goal_jelly: 'Очистити все желе ({n})', goal_boss: 'Перемогти боса',
      moves_reward: 'Ходів: {m} · Нагорода: {gold}🪙 {energy}⚡', battle_team: 'Бойова команда драконів',
      equip_empty: 'Порожньо', equip_hint: 'Торкніться слота, щоб змінити дракона', start: '▶ Старт',
      // objectives (HUD)
      obj_score: 'Очки', obj_ice: 'Блоки', obj_jelly: 'Желе',
      // toasts
      boss_attack: '💥 Бос атакує! +{n} криги', shuffled: '🔀 Поле перемішано!', dragon_active: '{e} {name} активовано!',
      isle_unlocked: '🏝 Відкрито новий острів: {name}!', daily_available: '🎁 Доступна щоденна нагорода!',
      // win / lose
      victory: '🎉 Перемога!', score: 'Очки: {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Карта', btn_retry: '🔁 Ще раз', btn_next: '▶ Далі', btn_island: '🏝 Острів',
      defeat: 'Поразка', goal_not_met: 'Цілі не досягнуто.', lives_left: 'Залишилось життів: {hearts}',
      empty_suffix: ' (порожньо)', ad_hint_moves: 'Перегляньте рекламу, щоб отримати +5 ходів!', ad_plus_moves: '📺 +5 ходів',
      // boosters
      b_hammer: 'Молот', b_mix: 'Мікс', b_moves: 'Ходи',
      hammer_hint: '🔨 Торкніться кристала, щоб розбити', hammer_cancel: 'Молот скасовано',
      no_booster: 'Немає бустера — купіть у магазині 🛒', wait: 'Зачекайте…', plus5: '➕5 ходів!',
      // collection / upgrade
      collection_title: '🐲 Колекція драконів', not_unlocked: 'Не відкрито', dc_level: 'Рівень {n}',
      rarity_common: 'звичайний', rarity_rare: 'рідкісний', rarity_epic: 'епічний',
      upgrade_title: '⬆ Прокачка: {name}', cur_level: 'Поточний рівень', ability_power: 'Сила здатності',
      charges_faster: 'Заряджається швидше з кожним рівнем', close: 'Закрити',
      upgrade_btn: 'Покращити ({cost}{ic})', not_enough_gold: 'Недостатньо золота 🪙', now_level: '{name} тепер рівня {n}!',
      // shop
      shop_title: '🛒 Магазин', rewarded_ad: 'Реклама за винагороду', ad_desc: 'Перегляньте рекламу → +6💎 та +30⚡',
      watch: 'Дивитись', gems_section: '💎 Кристали', best_price: 'Найкраща ціна', soon: 'Скоро',
      gold_section: '🪙 Золото', gold_pack: '{gold} золота', for_gems: 'за {gems}💎',
      boosters_section: '🧪 Бустери', skins_section: '🎨 Косметичні скіни драконів',
      hammer_pack: 'Молот ×3', mix_pack: 'Мікс ×3', moves_pack: 'Ходи ×3',
      hammer_pdesc: 'Розбити будь-який кристал', mix_pdesc: 'Перемішати поле', moves_pdesc: '+5 ходів у грі',
      you_have: 'маєте: {n}', bought: 'Куплено: {name}', not_enough_gems: 'Недостатньо кристалів 💎',
      skin_for: 'Скін для {name}', wear: 'Вдягти', active: '✓ Активний', get_dragon_first: 'Спочатку отримайте дракона {name}',
      skin_unlocked: 'Скін розблоковано!', purchase_ok: 'Покупка успішна: +{n}💎', purchase_opening: 'Відкриваємо магазин…', purchase_failed: 'Покупку скасовано', reward_got: 'Нагорода: +6💎 +30⚡',
      gold_added: '+{n} золота!',
      // battle pass
      pass_title: '🎖️ Бойовий пропуск — Сезон 1', pass_level: 'Рівень {n} / {total}', xp_to_next: '{n} / 100 XP до наступного рівня',
      premium_buy: '👑 Преміум 500💎', premium_on: 'Преміум-пропуск активовано! 👑', premium_badge: '👑 ПРЕМІУМ АКТИВНО', got: 'Отримано: {r}',
      // daily
      daily_title: '🎁 Щоденна нагорода', day_n: 'День {n}', claim: 'Забрати', already_claimed: 'Вже отримано', daily_got: 'Отримано щоденну нагороду!',
      // quests / ach
      quests_title: '📜 Щоденні квести', quest_reward: 'нагорода {n}🪙',
      ach_title: '🏆 Досягнення',
      // leaderboard
      lb_title: '📊 Таблиця рекордів', your_place: 'Ваше місце: <b>#{rank}</b> з {total} · ⭐ {stars}', you: 'Ви',
      // settings
      settings_title: '⚙️ Налаштування', s_sound: '🔊 Звуки', s_music: '🎵 Музика', s_vibration: '📳 Вібрація', s_language: '🌐 Мова',
      on: 'УВІМК', off: 'ВИМК', version: 'Версія 1.0.0', reset: '🗑️ Скинути прогрес',
      reset_q: 'Скинути прогрес?', reset_warn: 'Весь прогрес буде втрачено назавжди.', yes_reset: 'Так, скинути', no: 'Ні', reset_done: 'Прогрес скинуто',
      choose_lang: '🌐 Оберіть мову',
      // lives
      lives_title: '❤️ Життя', lives_count: '{n} / {max} життів', next_heart: 'Наступне ❤ через {m} хв {s} с',
      lives_refill_hint: 'Поповніть, переглянувши рекламу, або за 💎.', ad_plus_life: '📺 +1 ❤ (реклама)', refill_gems: '💎 Поповнити (50)',
      life_added: '+1 ❤', lives_refilled: 'Життя поповнено!',
      // tutorial / welcome
      tut1: '👆 Проведіть пальцем від кристала до сусіднього, щоб зібрати 3 однакові в ряд',
      tut2: '💎 Чудово! Збіги заряджають драконів — дивіться смужки внизу.',
      tut3: '🐉 Коли смужка дракона повна — він б’є по полю сам!',
      welcome_title: '🐉 Ласкаво просимо!',
      welcome_body: '<p>Поєднуйте 3+ кристали, щоб генерувати <b>енергію</b>.</p><p>Енергія заряджає <b>яйця драконів</b> на острові.</p><p>Дракони допомагають у бою: палять ряди, ламають кригу, б’ють блискавками та ростять бонуси!</p>',
      start_adventure: 'Почати пригоду!',
      // misc
      combo: 'КОМБО ×{n}!', quit_q: 'Вийти з рівня?', resume: 'Продовжити', quit: 'Вийти',
      pause: '⏸ Пауза', paused: 'Пауза', to_map: 'На карту', ad_waiting: 'Зачекайте...',
      level_intro_goal: 'Ціль: {text}', sugar_bonus: 'БОНУС! +{n}'
    },

    en: {
      lang_name: 'English (US)',
      nav_map: 'Map', nav_dragons: 'Dragons', nav_shop: 'Shop', nav_pass: 'Pass', nav_island: 'Island',
      play_level: '▶ Play level {n}', incubator: '🥚 Dragon Incubator',
      t_daily: 'Daily', t_quests: 'Quests', t_leaderboard: 'Ranks', t_ach: 'Awards', t_options: 'Options',
      hatch: 'Hatch!', charge10: 'Charge +10⚡', need_energy: 'Not enough energy ⚡ (play levels)',
      new_dragon: '🎉 New dragon!', great: 'Great!',
      islands_title: '🗺️ Dragon Islands', locked_at: '🔒 level {n}', level_n: 'Level {n}',
      goal: '🎯 {text}', goal_score: 'Reach {n} points', goal_collect: 'Collect {n} × {g}',
      goal_ice: 'Break all blocks ({n})', goal_jelly: 'Clear all jelly ({n})', goal_boss: 'Defeat the boss',
      moves_reward: 'Moves: {m} · Reward: {gold}🪙 {energy}⚡', battle_team: 'Dragon battle team',
      equip_empty: 'Empty', equip_hint: 'Tap a slot to change the dragon', start: '▶ Start',
      obj_score: 'Score', obj_ice: 'Blocks', obj_jelly: 'Jelly',
      boss_attack: '💥 Boss attacks! +{n} ice', shuffled: '🔀 Board shuffled!', dragon_active: '{e} {name} activated!',
      isle_unlocked: '🏝 New island unlocked: {name}!', daily_available: '🎁 Daily reward available!',
      victory: '🎉 Victory!', score: 'Score: {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Map', btn_retry: '🔁 Retry', btn_next: '▶ Next', btn_island: '🏝 Island',
      defeat: 'Defeat', goal_not_met: 'Goal not reached.', lives_left: 'Lives left: {hearts}',
      empty_suffix: ' (empty)', ad_hint_moves: 'Watch an ad to get +5 moves!', ad_plus_moves: '📺 +5 moves',
      b_hammer: 'Hammer', b_mix: 'Mix', b_moves: 'Moves',
      hammer_hint: '🔨 Tap a crystal to smash it', hammer_cancel: 'Hammer cancelled',
      no_booster: 'No booster — buy in the shop 🛒', wait: 'Please wait…', plus5: '➕5 moves!',
      collection_title: '🐲 Dragon Collection', not_unlocked: 'Locked', dc_level: 'Level {n}',
      rarity_common: 'common', rarity_rare: 'rare', rarity_epic: 'epic',
      upgrade_title: '⬆ Upgrade: {name}', cur_level: 'Current level', ability_power: 'Ability power',
      charges_faster: 'Charges faster each level', close: 'Close',
      upgrade_btn: 'Upgrade ({cost}{ic})', not_enough_gold: 'Not enough gold 🪙', now_level: '{name} is now level {n}!',
      shop_title: '🛒 Shop', rewarded_ad: 'Rewarded ad', ad_desc: 'Watch an ad → +6💎 and +30⚡',
      watch: 'Watch', gems_section: '💎 Gems', best_price: 'Best value', soon: 'Soon',
      gold_section: '🪙 Gold', gold_pack: '{gold} gold', for_gems: 'for {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Dragon cosmetic skins',
      hammer_pack: 'Hammer ×3', mix_pack: 'Mix ×3', moves_pack: 'Moves ×3',
      hammer_pdesc: 'Smash any crystal', mix_pdesc: 'Shuffle the board', moves_pdesc: '+5 moves in-game',
      you_have: 'you have: {n}', bought: 'Bought: {name}', not_enough_gems: 'Not enough gems 💎',
      skin_for: 'Skin for {name}', wear: 'Equip', active: '✓ Active', get_dragon_first: 'Get the {name} dragon first',
      skin_unlocked: 'Skin unlocked!', purchase_ok: 'Purchase complete: +{n}💎', purchase_opening: 'Opening store…', purchase_failed: 'Purchase cancelled', reward_got: 'Reward: +6💎 +30⚡',
      gold_added: '+{n} gold!',
      pass_title: '🎖️ Battle Pass — Season 1', pass_level: 'Tier {n} / {total}', xp_to_next: '{n} / 100 XP to next tier',
      premium_buy: '👑 Premium 500💎', premium_on: 'Premium pass activated! 👑', premium_badge: '👑 PREMIUM ACTIVE', got: 'Received: {r}',
      daily_title: '🎁 Daily Reward', day_n: 'Day {n}', claim: 'Claim', already_claimed: 'Already claimed', daily_got: 'Daily reward claimed!',
      quests_title: '📜 Daily Quests', quest_reward: 'reward {n}🪙',
      ach_title: '🏆 Achievements',
      lb_title: '📊 Leaderboard', your_place: 'Your rank: <b>#{rank}</b> of {total} · ⭐ {stars}', you: 'You',
      settings_title: '⚙️ Settings', s_sound: '🔊 Sound', s_music: '🎵 Music', s_vibration: '📳 Vibration', s_language: '🌐 Language',
      on: 'ON', off: 'OFF', version: 'Version 1.0.0', reset: '🗑️ Reset progress',
      reset_q: 'Reset progress?', reset_warn: 'All progress will be lost forever.', yes_reset: 'Yes, reset', no: 'No', reset_done: 'Progress reset',
      choose_lang: '🌐 Choose language',
      lives_title: '❤️ Lives', lives_count: '{n} / {max} lives', next_heart: 'Next ❤ in {m}m {s}s',
      lives_refill_hint: 'Refill by watching an ad, or with 💎.', ad_plus_life: '📺 +1 ❤ (ad)', refill_gems: '💎 Refill (50)',
      life_added: '+1 ❤', lives_refilled: 'Lives refilled!',
      tut1: '👆 Swipe one crystal onto a neighbor to match 3 of a kind',
      tut2: '💎 Great! Matches charge your dragons — watch the bars below.',
      tut3: '🐉 When a dragon bar is full, it strikes the board on its own!',
      welcome_title: '🐉 Welcome!',
      welcome_body: '<p>Match 3+ crystals to generate <b>energy</b>.</p><p>Energy charges the <b>dragon eggs</b> on your island.</p><p>Dragons help in battle: burn rows, smash ice, strike with lightning and grow bonuses!</p>',
      start_adventure: 'Start the adventure!',
      combo: 'COMBO ×{n}!', quit_q: 'Quit the level?', resume: 'Resume', quit: 'Quit',
      pause: '⏸ Paused', paused: 'Paused', to_map: 'Exit to map', ad_waiting: 'Please wait...',
      level_intro_goal: 'Goal: {text}', sugar_bonus: 'BONUS! +{n}'
    },

    es: {
      lang_name: 'Español',
      nav_map: 'Mapa', nav_dragons: 'Dragones', nav_shop: 'Tienda', nav_pass: 'Pase', nav_island: 'Isla',
      play_level: '▶ Jugar nivel {n}', incubator: '🥚 Incubadora de dragones',
      t_daily: 'Diario', t_quests: 'Misiones', t_leaderboard: 'Ranking', t_ach: 'Logros', t_options: 'Opciones',
      hatch: '¡Eclosionar!', charge10: 'Cargar +10⚡', need_energy: 'Falta energía ⚡ (juega niveles)',
      new_dragon: '🎉 ¡Nuevo dragón!', great: '¡Genial!',
      islands_title: '🗺️ Islas de dragones', locked_at: '🔒 nivel {n}', level_n: 'Nivel {n}',
      goal: '🎯 {text}', goal_score: 'Consigue {n} puntos', goal_collect: 'Recoge {n} × {g}',
      goal_ice: 'Rompe todos los bloques ({n})', goal_jelly: 'Limpia toda la gelatina ({n})', goal_boss: 'Derrota al jefe',
      moves_reward: 'Movimientos: {m} · Premio: {gold}🪙 {energy}⚡', battle_team: 'Equipo de dragones',
      equip_empty: 'Vacío', equip_hint: 'Toca una ranura para cambiar el dragón', start: '▶ Empezar',
      obj_score: 'Puntos', obj_ice: 'Bloques', obj_jelly: 'Gelatina',
      boss_attack: '💥 ¡El jefe ataca! +{n} hielo', shuffled: '🔀 ¡Tablero mezclado!', dragon_active: '¡{e} {name} activado!',
      isle_unlocked: '🏝 ¡Nueva isla desbloqueada: {name}!', daily_available: '🎁 ¡Recompensa diaria disponible!',
      victory: '🎉 ¡Victoria!', score: 'Puntos: {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Mapa', btn_retry: '🔁 Reintentar', btn_next: '▶ Siguiente', btn_island: '🏝 Isla',
      defeat: 'Derrota', goal_not_met: 'Objetivo no alcanzado.', lives_left: 'Vidas restantes: {hearts}',
      empty_suffix: ' (vacío)', ad_hint_moves: '¡Mira un anuncio para +5 movimientos!', ad_plus_moves: '📺 +5 mov.',
      b_hammer: 'Martillo', b_mix: 'Mezcla', b_moves: 'Mov.',
      hammer_hint: '🔨 Toca un cristal para romperlo', hammer_cancel: 'Martillo cancelado',
      no_booster: 'Sin potenciador — compra en la tienda 🛒', wait: 'Espera…', plus5: '➕5 movimientos!',
      collection_title: '🐲 Colección de dragones', not_unlocked: 'Bloqueado', dc_level: 'Nivel {n}',
      rarity_common: 'común', rarity_rare: 'raro', rarity_epic: 'épico',
      upgrade_title: '⬆ Mejora: {name}', cur_level: 'Nivel actual', ability_power: 'Poder de habilidad',
      charges_faster: 'Se carga más rápido cada nivel', close: 'Cerrar',
      upgrade_btn: 'Mejorar ({cost}{ic})', not_enough_gold: 'Falta oro 🪙', now_level: '¡{name} ahora es nivel {n}!',
      shop_title: '🛒 Tienda', rewarded_ad: 'Anuncio con recompensa', ad_desc: 'Mira un anuncio → +6💎 y +30⚡',
      watch: 'Ver', gems_section: '💎 Gemas', best_price: 'Mejor precio',
      gold_section: '🪙 Oro', gold_pack: '{gold} oro', for_gems: 'por {gems}💎',
      boosters_section: '🧪 Potenciadores', skins_section: '🎨 Aspectos de dragones',
      hammer_pack: 'Martillo ×3', mix_pack: 'Mezcla ×3', moves_pack: 'Mov. ×3',
      hammer_pdesc: 'Rompe cualquier cristal', mix_pdesc: 'Mezcla el tablero', moves_pdesc: '+5 movimientos',
      you_have: 'tienes: {n}', bought: 'Comprado: {name}', not_enough_gems: 'Faltan gemas 💎',
      skin_for: 'Aspecto para {name}', wear: 'Equipar', active: '✓ Activo', get_dragon_first: 'Consigue primero el dragón {name}',
      skin_unlocked: '¡Aspecto desbloqueado!', purchase_ok: 'Compra completa: +{n}💎', reward_got: 'Premio: +6💎 +30⚡',
      gold_added: '¡+{n} oro!',
      pass_title: '🎖️ Pase de batalla — Temporada 1', pass_level: 'Nivel {n} / {total}', xp_to_next: '{n} / 100 XP al siguiente',
      premium_buy: '👑 Premium 500💎', premium_on: '¡Pase premium activado! 👑', premium_badge: '👑 PREMIUM ACTIVO', got: 'Recibido: {r}',
      daily_title: '🎁 Recompensa diaria', day_n: 'Día {n}', claim: 'Reclamar', already_claimed: 'Ya reclamado', daily_got: '¡Recompensa diaria reclamada!',
      quests_title: '📜 Misiones diarias', quest_reward: 'premio {n}🪙',
      ach_title: '🏆 Logros',
      lb_title: '📊 Clasificación', your_place: 'Tu puesto: <b>#{rank}</b> de {total} · ⭐ {stars}', you: 'Tú',
      settings_title: '⚙️ Ajustes', s_sound: '🔊 Sonido', s_music: '🎵 Música', s_vibration: '📳 Vibración', s_language: '🌐 Idioma',
      on: 'SÍ', off: 'NO', version: 'Versión 1.0.0', reset: '🗑️ Reiniciar progreso',
      reset_q: '¿Reiniciar progreso?', reset_warn: 'Todo el progreso se perderá para siempre.', yes_reset: 'Sí, reiniciar', no: 'No', reset_done: 'Progreso reiniciado',
      choose_lang: '🌐 Elige idioma',
      lives_title: '❤️ Vidas', lives_count: '{n} / {max} vidas', next_heart: 'Próximo ❤ en {m}m {s}s',
      lives_refill_hint: 'Recarga viendo un anuncio o con 💎.', ad_plus_life: '📺 +1 ❤ (anuncio)', refill_gems: '💎 Recargar (50)',
      life_added: '+1 ❤', lives_refilled: '¡Vidas recargadas!',
      tut1: '👆 Desliza un cristal hacia uno vecino para juntar 3 iguales',
      tut2: '💎 ¡Genial! Las combinaciones cargan a tus dragones — mira las barras abajo.',
      tut3: '🐉 Cuando la barra de un dragón se llena, ¡ataca solo!',
      welcome_title: '🐉 ¡Bienvenido!',
      welcome_body: '<p>Combina 3+ cristales para generar <b>energía</b>.</p><p>La energía carga los <b>huevos de dragón</b> en tu isla.</p><p>Los dragones ayudan en batalla: queman filas, rompen hielo, lanzan rayos y crean bonos!</p>',
      start_adventure: '¡Empezar la aventura!',
      combo: '¡COMBO ×{n}!', quit_q: '¿Salir del nivel?', resume: 'Continuar', quit: 'Salir',
      pause: '⏸ Pausa', to_map: 'Salir al mapa', ad_waiting: 'Espera...',
      level_intro_goal: 'Objetivo: {text}', sugar_bonus: '¡BONO! +{n}'
    },

    de: {
      lang_name: 'Deutsch',
      nav_map: 'Karte', nav_dragons: 'Drachen', nav_shop: 'Shop', nav_pass: 'Pass', nav_island: 'Insel',
      play_level: '▶ Level {n} spielen', incubator: '🥚 Drachen-Brutkasten',
      t_daily: 'Täglich', t_quests: 'Aufträge', t_leaderboard: 'Rangliste', t_ach: 'Erfolge', t_options: 'Optionen',
      hatch: 'Schlüpfen!', charge10: 'Laden +10⚡', need_energy: 'Zu wenig Energie ⚡ (spiele Level)',
      new_dragon: '🎉 Neuer Drache!', great: 'Super!',
      islands_title: '🗺️ Dracheninseln', locked_at: '🔒 Level {n}', level_n: 'Level {n}',
      goal: '🎯 {text}', goal_score: 'Erreiche {n} Punkte', goal_collect: 'Sammle {n} × {g}',
      goal_ice: 'Zerbrich alle Blöcke ({n})', goal_jelly: 'Entferne das Gelee ({n})', goal_boss: 'Besiege den Boss',
      moves_reward: 'Züge: {m} · Belohnung: {gold}🪙 {energy}⚡', battle_team: 'Drachen-Kampfteam',
      equip_empty: 'Leer', equip_hint: 'Tippe einen Slot, um den Drachen zu wechseln', start: '▶ Start',
      obj_score: 'Punkte', obj_ice: 'Blöcke', obj_jelly: 'Gelee',
      boss_attack: '💥 Boss greift an! +{n} Eis', shuffled: '🔀 Feld gemischt!', dragon_active: '{e} {name} aktiviert!',
      isle_unlocked: '🏝 Neue Insel frei: {name}!', daily_available: '🎁 Tägliche Belohnung verfügbar!',
      victory: '🎉 Sieg!', score: 'Punkte: {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Karte', btn_retry: '🔁 Nochmal', btn_next: '▶ Weiter', btn_island: '🏝 Insel',
      defeat: 'Niederlage', goal_not_met: 'Ziel nicht erreicht.', lives_left: 'Leben übrig: {hearts}',
      empty_suffix: ' (leer)', ad_hint_moves: 'Sieh eine Werbung für +5 Züge!', ad_plus_moves: '📺 +5 Züge',
      b_hammer: 'Hammer', b_mix: 'Mix', b_moves: 'Züge',
      hammer_hint: '🔨 Tippe einen Kristall zum Zerschlagen', hammer_cancel: 'Hammer abgebrochen',
      no_booster: 'Kein Booster — im Shop kaufen 🛒', wait: 'Bitte warten…', plus5: '➕5 Züge!',
      collection_title: '🐲 Drachensammlung', not_unlocked: 'Gesperrt', dc_level: 'Level {n}',
      rarity_common: 'gewöhnlich', rarity_rare: 'selten', rarity_epic: 'episch',
      upgrade_title: '⬆ Verbessern: {name}', cur_level: 'Aktuelles Level', ability_power: 'Fähigkeitsstärke',
      charges_faster: 'Lädt mit jedem Level schneller', close: 'Schließen',
      upgrade_btn: 'Verbessern ({cost}{ic})', not_enough_gold: 'Zu wenig Gold 🪙', now_level: '{name} ist jetzt Level {n}!',
      shop_title: '🛒 Shop', rewarded_ad: 'Belohnte Werbung', ad_desc: 'Werbung ansehen → +6💎 und +30⚡',
      watch: 'Ansehen', gems_section: '💎 Edelsteine', best_price: 'Bester Wert',
      gold_section: '🪙 Gold', gold_pack: '{gold} Gold', for_gems: 'für {gems}💎',
      boosters_section: '🧪 Booster', skins_section: '🎨 Drachen-Skins',
      hammer_pack: 'Hammer ×3', mix_pack: 'Mix ×3', moves_pack: 'Züge ×3',
      hammer_pdesc: 'Zerschlage jeden Kristall', mix_pdesc: 'Mische das Feld', moves_pdesc: '+5 Züge im Spiel',
      you_have: 'du hast: {n}', bought: 'Gekauft: {name}', not_enough_gems: 'Zu wenig Edelsteine 💎',
      skin_for: 'Skin für {name}', wear: 'Anlegen', active: '✓ Aktiv', get_dragon_first: 'Hol dir zuerst den Drachen {name}',
      skin_unlocked: 'Skin freigeschaltet!', purchase_ok: 'Kauf abgeschlossen: +{n}💎', reward_got: 'Belohnung: +6💎 +30⚡',
      gold_added: '+{n} Gold!',
      pass_title: '🎖️ Battle Pass — Saison 1', pass_level: 'Stufe {n} / {total}', xp_to_next: '{n} / 100 XP zur nächsten Stufe',
      premium_buy: '👑 Premium 500💎', premium_on: 'Premium-Pass aktiviert! 👑', premium_badge: '👑 PREMIUM AKTIV', got: 'Erhalten: {r}',
      daily_title: '🎁 Tägliche Belohnung', day_n: 'Tag {n}', claim: 'Abholen', already_claimed: 'Schon abgeholt', daily_got: 'Tägliche Belohnung erhalten!',
      quests_title: '📜 Tägliche Aufträge', quest_reward: 'Belohnung {n}🪙',
      ach_title: '🏆 Erfolge',
      lb_title: '📊 Rangliste', your_place: 'Dein Platz: <b>#{rank}</b> von {total} · ⭐ {stars}', you: 'Du',
      settings_title: '⚙️ Einstellungen', s_sound: '🔊 Ton', s_music: '🎵 Musik', s_vibration: '📳 Vibration', s_language: '🌐 Sprache',
      on: 'AN', off: 'AUS', version: 'Version 1.0.0', reset: '🗑️ Fortschritt zurücksetzen',
      reset_q: 'Fortschritt zurücksetzen?', reset_warn: 'Aller Fortschritt geht für immer verloren.', yes_reset: 'Ja, zurücksetzen', no: 'Nein', reset_done: 'Fortschritt zurückgesetzt',
      choose_lang: '🌐 Sprache wählen',
      lives_title: '❤️ Leben', lives_count: '{n} / {max} Leben', next_heart: 'Nächstes ❤ in {m}m {s}s',
      lives_refill_hint: 'Fülle per Werbung oder mit 💎 auf.', ad_plus_life: '📺 +1 ❤ (Werbung)', refill_gems: '💎 Auffüllen (50)',
      life_added: '+1 ❤', lives_refilled: 'Leben aufgefüllt!',
      tut1: '👆 Ziehe einen Kristall auf einen Nachbarn für 3 gleiche',
      tut2: '💎 Super! Kombinationen laden deine Drachen — sieh die Balken unten.',
      tut3: '🐉 Ist ein Drachenbalken voll, schlägt er von selbst zu!',
      welcome_title: '🐉 Willkommen!',
      welcome_body: '<p>Kombiniere 3+ Kristalle, um <b>Energie</b> zu erzeugen.</p><p>Energie lädt die <b>Dracheneier</b> auf deiner Insel.</p><p>Drachen helfen im Kampf: brennen Reihen ab, zerschlagen Eis, schlagen mit Blitzen und züchten Boni!</p>',
      start_adventure: 'Abenteuer starten!',
      combo: 'COMBO ×{n}!', quit_q: 'Level verlassen?', resume: 'Weiter', quit: 'Verlassen',
      pause: '⏸ Pause', to_map: 'Zur Karte', ad_waiting: 'Bitte warten...',
      level_intro_goal: 'Ziel: {text}', sugar_bonus: 'BONUS! +{n}'
    },

    fr: {
      lang_name: 'Français',
      nav_map: 'Carte', nav_dragons: 'Dragons', nav_shop: 'Boutique', nav_pass: 'Passe', nav_island: 'Île',
      play_level: '▶ Jouer niveau {n}', incubator: '🥚 Incubateur de dragons',
      t_daily: 'Quotidien', t_quests: 'Quêtes', t_leaderboard: 'Classement', t_ach: 'Succès', t_options: 'Options',
      hatch: 'Éclore !', charge10: 'Charger +10⚡', need_energy: 'Pas assez d’énergie ⚡ (jouez des niveaux)',
      new_dragon: '🎉 Nouveau dragon !', great: 'Super !',
      islands_title: '🗺️ Îles des dragons', locked_at: '🔒 niveau {n}', level_n: 'Niveau {n}',
      goal: '🎯 {text}', goal_score: 'Atteins {n} points', goal_collect: 'Récolte {n} × {g}',
      goal_ice: 'Brise tous les blocs ({n})', goal_jelly: 'Nettoie toute la gelée ({n})', goal_boss: 'Bats le boss',
      moves_reward: 'Coups : {m} · Récompense : {gold}🪙 {energy}⚡', battle_team: 'Équipe de dragons',
      equip_empty: 'Vide', equip_hint: 'Touchez un emplacement pour changer de dragon', start: '▶ Démarrer',
      obj_score: 'Score', obj_ice: 'Blocs', obj_jelly: 'Gelée',
      boss_attack: '💥 Le boss attaque ! +{n} glace', shuffled: '🔀 Plateau mélangé !', dragon_active: '{e} {name} activé !',
      isle_unlocked: '🏝 Nouvelle île débloquée : {name} !', daily_available: '🎁 Récompense quotidienne disponible !',
      victory: '🎉 Victoire !', score: 'Score : {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Carte', btn_retry: '🔁 Réessayer', btn_next: '▶ Suivant', btn_island: '🏝 Île',
      defeat: 'Défaite', goal_not_met: 'Objectif non atteint.', lives_left: 'Vies restantes : {hearts}',
      empty_suffix: ' (vide)', ad_hint_moves: 'Regardez une pub pour +5 coups !', ad_plus_moves: '📺 +5 coups',
      b_hammer: 'Marteau', b_mix: 'Mix', b_moves: 'Coups',
      hammer_hint: '🔨 Touchez un cristal pour le briser', hammer_cancel: 'Marteau annulé',
      no_booster: 'Pas de booster — achetez en boutique 🛒', wait: 'Patientez…', plus5: '➕5 coups !',
      collection_title: '🐲 Collection de dragons', not_unlocked: 'Verrouillé', dc_level: 'Niveau {n}',
      rarity_common: 'commun', rarity_rare: 'rare', rarity_epic: 'épique',
      upgrade_title: '⬆ Améliorer : {name}', cur_level: 'Niveau actuel', ability_power: 'Puissance',
      charges_faster: 'Se charge plus vite à chaque niveau', close: 'Fermer',
      upgrade_btn: 'Améliorer ({cost}{ic})', not_enough_gold: 'Pas assez d’or 🪙', now_level: '{name} est maintenant niveau {n} !',
      shop_title: '🛒 Boutique', rewarded_ad: 'Pub récompensée', ad_desc: 'Regardez une pub → +6💎 et +30⚡',
      watch: 'Voir', gems_section: '💎 Gemmes', best_price: 'Meilleur prix',
      gold_section: '🪙 Or', gold_pack: '{gold} or', for_gems: 'pour {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Skins de dragons',
      hammer_pack: 'Marteau ×3', mix_pack: 'Mix ×3', moves_pack: 'Coups ×3',
      hammer_pdesc: 'Brise n’importe quel cristal', mix_pdesc: 'Mélange le plateau', moves_pdesc: '+5 coups en jeu',
      you_have: 'vous avez : {n}', bought: 'Acheté : {name}', not_enough_gems: 'Pas assez de gemmes 💎',
      skin_for: 'Skin pour {name}', wear: 'Équiper', active: '✓ Actif', get_dragon_first: 'Obtenez d’abord le dragon {name}',
      skin_unlocked: 'Skin débloqué !', purchase_ok: 'Achat effectué : +{n}💎', reward_got: 'Récompense : +6💎 +30⚡',
      gold_added: '+{n} or !',
      pass_title: '🎖️ Passe de combat — Saison 1', pass_level: 'Palier {n} / {total}', xp_to_next: '{n} / 100 XP au palier suivant',
      premium_buy: '👑 Premium 500💎', premium_on: 'Passe premium activé ! 👑', premium_badge: '👑 PREMIUM ACTIF', got: 'Reçu : {r}',
      daily_title: '🎁 Récompense quotidienne', day_n: 'Jour {n}', claim: 'Réclamer', already_claimed: 'Déjà réclamé', daily_got: 'Récompense quotidienne réclamée !',
      quests_title: '📜 Quêtes quotidiennes', quest_reward: 'récompense {n}🪙',
      ach_title: '🏆 Succès',
      lb_title: '📊 Classement', your_place: 'Votre rang : <b>#{rank}</b> sur {total} · ⭐ {stars}', you: 'Vous',
      settings_title: '⚙️ Réglages', s_sound: '🔊 Sons', s_music: '🎵 Musique', s_vibration: '📳 Vibration', s_language: '🌐 Langue',
      on: 'OUI', off: 'NON', version: 'Version 1.0.0', reset: '🗑️ Réinitialiser',
      reset_q: 'Réinitialiser la progression ?', reset_warn: 'Toute la progression sera perdue.', yes_reset: 'Oui, réinitialiser', no: 'Non', reset_done: 'Progression réinitialisée',
      choose_lang: '🌐 Choisir la langue',
      lives_title: '❤️ Vies', lives_count: '{n} / {max} vies', next_heart: 'Prochain ❤ dans {m}m {s}s',
      lives_refill_hint: 'Rechargez via une pub ou avec 💎.', ad_plus_life: '📺 +1 ❤ (pub)', refill_gems: '💎 Recharger (50)',
      life_added: '+1 ❤', lives_refilled: 'Vies rechargées !',
      tut1: '👆 Glissez un cristal vers un voisin pour aligner 3 identiques',
      tut2: '💎 Super ! Les combos chargent vos dragons — voyez les barres en bas.',
      tut3: '🐉 Quand la barre d’un dragon est pleine, il frappe tout seul !',
      welcome_title: '🐉 Bienvenue !',
      welcome_body: '<p>Alignez 3+ cristaux pour générer de l’<b>énergie</b>.</p><p>L’énergie charge les <b>œufs de dragon</b> sur votre île.</p><p>Les dragons aident au combat : brûlent des rangées, brisent la glace, foudroient et créent des bonus !</p>',
      start_adventure: 'Commencer l’aventure !',
      combo: 'COMBO ×{n} !', quit_q: 'Quitter le niveau ?', resume: 'Continuer', quit: 'Quitter',
      pause: '⏸ Pause', to_map: 'Aller à la carte', ad_waiting: 'Patientez...',
      level_intro_goal: 'Objectif : {text}', sugar_bonus: 'BONUS ! +{n}'
    },

    pt: {
      lang_name: 'Português',
      nav_map: 'Mapa', nav_dragons: 'Dragões', nav_shop: 'Loja', nav_pass: 'Passe', nav_island: 'Ilha',
      play_level: '▶ Jogar nível {n}', incubator: '🥚 Incubadora de dragões',
      t_daily: 'Diário', t_quests: 'Missões', t_leaderboard: 'Ranking', t_ach: 'Conquistas', t_options: 'Opções',
      hatch: 'Chocar!', charge10: 'Carregar +10⚡', need_energy: 'Energia insuficiente ⚡ (jogue níveis)',
      new_dragon: '🎉 Novo dragão!', great: 'Ótimo!',
      islands_title: '🗺️ Ilhas dos dragões', locked_at: '🔒 nível {n}', level_n: 'Nível {n}',
      goal: '🎯 {text}', goal_score: 'Alcance {n} pontos', goal_collect: 'Colete {n} × {g}',
      goal_ice: 'Quebre todos os blocos ({n})', goal_jelly: 'Limpe toda a geleia ({n})', goal_boss: 'Derrote o chefe',
      moves_reward: 'Jogadas: {m} · Prêmio: {gold}🪙 {energy}⚡', battle_team: 'Equipe de dragões',
      equip_empty: 'Vazio', equip_hint: 'Toque num espaço para trocar o dragão', start: '▶ Começar',
      obj_score: 'Pontos', obj_ice: 'Blocos', obj_jelly: 'Geleia',
      boss_attack: '💥 O chefe ataca! +{n} gelo', shuffled: '🔀 Tabuleiro embaralhado!', dragon_active: '{e} {name} ativado!',
      isle_unlocked: '🏝 Nova ilha desbloqueada: {name}!', daily_available: '🎁 Recompensa diária disponível!',
      victory: '🎉 Vitória!', score: 'Pontos: {n}', win_rewards: '+{gold}🪙  +{energy}⚡',
      btn_map: '🗺 Mapa', btn_retry: '🔁 De novo', btn_next: '▶ Próximo', btn_island: '🏝 Ilha',
      defeat: 'Derrota', goal_not_met: 'Objetivo não alcançado.', lives_left: 'Vidas restantes: {hearts}',
      empty_suffix: ' (vazio)', ad_hint_moves: 'Assista a um anúncio para +5 jogadas!', ad_plus_moves: '📺 +5 jogadas',
      b_hammer: 'Martelo', b_mix: 'Mistura', b_moves: 'Jogadas',
      hammer_hint: '🔨 Toque num cristal para quebrá-lo', hammer_cancel: 'Martelo cancelado',
      no_booster: 'Sem booster — compre na loja 🛒', wait: 'Aguarde…', plus5: '➕5 jogadas!',
      collection_title: '🐲 Coleção de dragões', not_unlocked: 'Bloqueado', dc_level: 'Nível {n}',
      rarity_common: 'comum', rarity_rare: 'raro', rarity_epic: 'épico',
      upgrade_title: '⬆ Melhorar: {name}', cur_level: 'Nível atual', ability_power: 'Poder da habilidade',
      charges_faster: 'Carrega mais rápido a cada nível', close: 'Fechar',
      upgrade_btn: 'Melhorar ({cost}{ic})', not_enough_gold: 'Ouro insuficiente 🪙', now_level: '{name} agora é nível {n}!',
      shop_title: '🛒 Loja', rewarded_ad: 'Anúncio premiado', ad_desc: 'Assista a um anúncio → +6💎 e +30⚡',
      watch: 'Assistir', gems_section: '💎 Gemas', best_price: 'Melhor preço',
      gold_section: '🪙 Ouro', gold_pack: '{gold} ouro', for_gems: 'por {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Visuais de dragões',
      hammer_pack: 'Martelo ×3', mix_pack: 'Mistura ×3', moves_pack: 'Jogadas ×3',
      hammer_pdesc: 'Quebre qualquer cristal', mix_pdesc: 'Embaralhe o tabuleiro', moves_pdesc: '+5 jogadas no jogo',
      you_have: 'você tem: {n}', bought: 'Comprado: {name}', not_enough_gems: 'Gemas insuficientes 💎',
      skin_for: 'Visual para {name}', wear: 'Equipar', active: '✓ Ativo', get_dragon_first: 'Consiga primeiro o dragão {name}',
      skin_unlocked: 'Visual desbloqueado!', purchase_ok: 'Compra concluída: +{n}💎', reward_got: 'Prêmio: +6💎 +30⚡',
      gold_added: '+{n} ouro!',
      pass_title: '🎖️ Passe de batalha — Temporada 1', pass_level: 'Nível {n} / {total}', xp_to_next: '{n} / 100 XP para o próximo',
      premium_buy: '👑 Premium 500💎', premium_on: 'Passe premium ativado! 👑', premium_badge: '👑 PREMIUM ATIVO', got: 'Recebido: {r}',
      daily_title: '🎁 Recompensa diária', day_n: 'Dia {n}', claim: 'Resgatar', already_claimed: 'Já resgatado', daily_got: 'Recompensa diária resgatada!',
      quests_title: '📜 Missões diárias', quest_reward: 'prêmio {n}🪙',
      ach_title: '🏆 Conquistas',
      lb_title: '📊 Classificação', your_place: 'Sua posição: <b>#{rank}</b> de {total} · ⭐ {stars}', you: 'Você',
      settings_title: '⚙️ Ajustes', s_sound: '🔊 Som', s_music: '🎵 Música', s_vibration: '📳 Vibração', s_language: '🌐 Idioma',
      on: 'SIM', off: 'NÃO', version: 'Versão 1.0.0', reset: '🗑️ Reiniciar progresso',
      reset_q: 'Reiniciar progresso?', reset_warn: 'Todo o progresso será perdido para sempre.', yes_reset: 'Sim, reiniciar', no: 'Não', reset_done: 'Progresso reiniciado',
      choose_lang: '🌐 Escolha o idioma',
      lives_title: '❤️ Vidas', lives_count: '{n} / {max} vidas', next_heart: 'Próximo ❤ em {m}m {s}s',
      lives_refill_hint: 'Recarregue vendo um anúncio ou com 💎.', ad_plus_life: '📺 +1 ❤ (anúncio)', refill_gems: '💎 Recarregar (50)',
      life_added: '+1 ❤', lives_refilled: 'Vidas recarregadas!',
      tut1: '👆 Deslize um cristal até um vizinho para juntar 3 iguais',
      tut2: '💎 Ótimo! As combinações carregam seus dragões — veja as barras abaixo.',
      tut3: '🐉 Quando a barra de um dragão enche, ele ataca sozinho!',
      welcome_title: '🐉 Bem-vindo!',
      welcome_body: '<p>Combine 3+ cristais para gerar <b>energia</b>.</p><p>A energia carrega os <b>ovos de dragão</b> na sua ilha.</p><p>Os dragões ajudam na batalha: queimam fileiras, quebram gelo, atacam com raios e criam bônus!</p>',
      start_adventure: 'Começar a aventura!',
      combo: 'COMBO ×{n}!', quit_q: 'Sair do nível?', resume: 'Continuar', quit: 'Sair',
      pause: '⏸ Pausa', to_map: 'Ir ao mapa', ad_waiting: 'Aguarde...',
      level_intro_goal: 'Objetivo: {text}', sugar_bonus: 'BÔNUS! +{n}'
    }
  };

  // Daily-quest texts (merged in by quest id).
  const QSTR = {
    uk: { q_win3: 'Виграйте 3 рівні', q_crush200: 'Знищіть 200 кристалів', q_combo4: 'Зробіть комбо x4', q_dragon: 'Активуйте драконів 8 разів', q_energy: 'Зберіть 200 енергії', q_special: 'Створіть 6 особливих кристалів' },
    en: { q_win3: 'Win 3 levels', q_crush200: 'Crush 200 crystals', q_combo4: 'Make a x4 combo', q_dragon: 'Trigger dragons 8 times', q_energy: 'Gather 200 energy', q_special: 'Create 6 special crystals' },
    es: { q_win3: 'Gana 3 niveles', q_crush200: 'Rompe 200 cristales', q_combo4: 'Haz un combo x4', q_dragon: 'Activa dragones 8 veces', q_energy: 'Reúne 200 de energía', q_special: 'Crea 6 cristales especiales' },
    de: { q_win3: 'Gewinne 3 Level', q_crush200: 'Zerstöre 200 Kristalle', q_combo4: 'Mache ein x4-Combo', q_dragon: 'Löse Drachen 8-mal aus', q_energy: 'Sammle 200 Energie', q_special: 'Erzeuge 6 Spezialkristalle' },
    fr: { q_win3: 'Gagne 3 niveaux', q_crush200: 'Détruis 200 cristaux', q_combo4: 'Fais un combo x4', q_dragon: 'Déclenche les dragons 8 fois', q_energy: 'Récolte 200 d’énergie', q_special: 'Crée 6 cristaux spéciaux' },
    pt: { q_win3: 'Vença 3 níveis', q_crush200: 'Destrua 200 cristais', q_combo4: 'Faça um combo x4', q_dragon: 'Ative dragões 8 vezes', q_energy: 'Junte 200 de energia', q_special: 'Crie 6 cristais especiais' }
  };
  Object.keys(QSTR).forEach(function (l) { Object.assign(STR[l], QSTR[l]); });

  // Retention features (win streak, piggy bank, map chests).
  const RSTR = {
    uk: { streak_bonus: '🔥 Серія ×{n}! +{r}', piggy_title: '🐷 Скарбничка', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Розбити (+{n}🪙)', piggy_not_full: 'Ще не повна — грайте далі!', piggy_cracked: 'Скарбничку розбито: +{n}🪙', chest_title: '🎁 Скриня', chest_open: 'Відкрити', chest_reward: 'Скриня: +{gold}🪙 +{gems}💎' },
    en: { streak_bonus: '🔥 Streak ×{n}! +{r}', piggy_title: '🐷 Piggy bank', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Crack (+{n}🪙)', piggy_not_full: 'Not full yet — keep playing!', piggy_cracked: 'Piggy cracked: +{n}🪙', chest_title: '🎁 Chest', chest_open: 'Open', chest_reward: 'Chest: +{gold}🪙 +{gems}💎' },
    es: { streak_bonus: '🔥 ¡Racha ×{n}! +{r}', piggy_title: '🐷 Hucha', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Romper (+{n}🪙)', piggy_not_full: 'Aún no está llena — ¡sigue jugando!', piggy_cracked: 'Hucha rota: +{n}🪙', chest_title: '🎁 Cofre', chest_open: 'Abrir', chest_reward: 'Cofre: +{gold}🪙 +{gems}💎' },
    de: { streak_bonus: '🔥 Serie ×{n}! +{r}', piggy_title: '🐷 Sparschwein', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Knacken (+{n}🪙)', piggy_not_full: 'Noch nicht voll — weiterspielen!', piggy_cracked: 'Sparschwein geknackt: +{n}🪙', chest_title: '🎁 Truhe', chest_open: 'Öffnen', chest_reward: 'Truhe: +{gold}🪙 +{gems}💎' },
    fr: { streak_bonus: '🔥 Série ×{n} ! +{r}', piggy_title: '🐷 Tirelire', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Casser (+{n}🪙)', piggy_not_full: 'Pas encore pleine — continuez !', piggy_cracked: 'Tirelire cassée : +{n}🪙', chest_title: '🎁 Coffre', chest_open: 'Ouvrir', chest_reward: 'Coffre : +{gold}🪙 +{gems}💎' },
    pt: { streak_bonus: '🔥 Sequência ×{n}! +{r}', piggy_title: '🐷 Cofrinho', piggy_info: '{n} / {cap} 🪙', piggy_crack: 'Quebrar (+{n}🪙)', piggy_not_full: 'Ainda não está cheio — continue!', piggy_cracked: 'Cofrinho quebrado: +{n}🪙', chest_title: '🎁 Baú', chest_open: 'Abrir', chest_reward: 'Baú: +{gold}🪙 +{gems}💎' }
  };
  Object.keys(RSTR).forEach(function (l) { Object.assign(STR[l], RSTR[l]); });

  // Game modes.
  const MSTR = {
    uk: { t_modes: 'Режими', modes_title: '🎮 Ігрові режими', mode_blitz: 'Бліц', mode_endless: 'Виживання', mode_daily: 'Щоденний виклик', mode_blitz_desc: '60 секунд на макс. рахунок. Дракони заряджаються ×2!', mode_endless_desc: 'Збивай шкалу загрози збігами. Скільки протримаєшся?', mode_daily_desc: 'Особливий рівень раз на день за велику нагороду.', mode_endless_danger: 'Загроза', best: 'Рекорд', new_best: 'Новий рекорд!', time_up: '⏱️ Час вийшов!', mode_over: '♾️ Гру завершено', play: 'Грати', daily_done_today: 'Сьогодні вже пройдено ✓' },
    en: { t_modes: 'Modes', modes_title: '🎮 Game Modes', mode_blitz: 'Blitz', mode_endless: 'Survival', mode_daily: 'Daily Challenge', mode_blitz_desc: '60 seconds for max score. Dragons charge ×2!', mode_endless_desc: 'Beat back the threat meter with matches. How long can you last?', mode_daily_desc: 'A special level once a day for a big reward.', mode_endless_danger: 'Threat', best: 'Best', new_best: 'New best!', time_up: '⏱️ Time up!', mode_over: '♾️ Game over', play: 'Play', daily_done_today: 'Already done today ✓' },
    es: { t_modes: 'Modos', modes_title: '🎮 Modos de juego', mode_blitz: 'Blitz', mode_endless: 'Supervivencia', mode_daily: 'Reto diario', mode_blitz_desc: '60 segundos para máxima puntuación. ¡Dragones cargan ×2!', mode_endless_desc: 'Reduce la amenaza con combinaciones. ¿Cuánto aguantas?', mode_daily_desc: 'Un nivel especial al día por una gran recompensa.', mode_endless_danger: 'Amenaza', best: 'Récord', new_best: '¡Nuevo récord!', time_up: '⏱️ ¡Tiempo!', mode_over: '♾️ Fin del juego', play: 'Jugar', daily_done_today: 'Ya hecho hoy ✓' },
    de: { t_modes: 'Modi', modes_title: '🎮 Spielmodi', mode_blitz: 'Blitz', mode_endless: 'Überleben', mode_daily: 'Tägliche Aufgabe', mode_blitz_desc: '60 Sekunden für Höchstpunktzahl. Drachen laden ×2!', mode_endless_desc: 'Drücke die Gefahr mit Matches zurück. Wie lange hältst du durch?', mode_daily_desc: 'Ein Speziallevel pro Tag für eine große Belohnung.', mode_endless_danger: 'Gefahr', best: 'Rekord', new_best: 'Neuer Rekord!', time_up: '⏱️ Zeit um!', mode_over: '♾️ Vorbei', play: 'Spielen', daily_done_today: 'Heute schon erledigt ✓' },
    fr: { t_modes: 'Modes', modes_title: '🎮 Modes de jeu', mode_blitz: 'Blitz', mode_endless: 'Survie', mode_daily: 'Défi quotidien', mode_blitz_desc: '60 secondes pour le max de points. Dragons chargent ×2 !', mode_endless_desc: 'Repoussez la menace avec des combos. Combien de temps tiendrez-vous ?', mode_daily_desc: 'Un niveau spécial par jour pour une grosse récompense.', mode_endless_danger: 'Menace', best: 'Record', new_best: 'Nouveau record !', time_up: '⏱️ Temps écoulé !', mode_over: '♾️ Partie terminée', play: 'Jouer', daily_done_today: 'Déjà fait aujourd’hui ✓' },
    pt: { t_modes: 'Modos', modes_title: '🎮 Modos de jogo', mode_blitz: 'Blitz', mode_endless: 'Sobrevivência', mode_daily: 'Desafio diário', mode_blitz_desc: '60 segundos para pontuação máxima. Dragões carregam ×2!', mode_endless_desc: 'Reduza o medidor de ameaça com combinações. Quanto aguenta?', mode_daily_desc: 'Um nível especial por dia para uma grande recompensa.', mode_endless_danger: 'Ameaça', best: 'Recorde', new_best: 'Novo recorde!', time_up: '⏱️ Tempo esgotado!', mode_over: '♾️ Fim de jogo', play: 'Jogar', daily_done_today: 'Já feito hoje ✓' }
  };
  Object.keys(MSTR).forEach(function (l) { Object.assign(STR[l], MSTR[l]); });

  // Active dragons.
  const DSTR = {
    uk: { dragon_ready: 'ГОТОВО', aim_row: '🐉 Торкніться ряду для удару', aim_cell: '🐉 Торкніться клітинки', s_autodragons: '🐉 Авто-дракони' },
    en: { dragon_ready: 'READY', aim_row: '🐉 Tap a row to strike', aim_cell: '🐉 Tap a cell', s_autodragons: '🐉 Auto dragons' },
    es: { dragon_ready: 'LISTO', aim_row: '🐉 Toca una fila para atacar', aim_cell: '🐉 Toca una casilla', s_autodragons: '🐉 Dragones auto' },
    de: { dragon_ready: 'BEREIT', aim_row: '🐉 Tippe eine Reihe an', aim_cell: '🐉 Tippe ein Feld an', s_autodragons: '🐉 Auto-Drachen' },
    fr: { dragon_ready: 'PRÊT', aim_row: '🐉 Touchez une rangée', aim_cell: '🐉 Touchez une case', s_autodragons: '🐉 Dragons auto' },
    pt: { dragon_ready: 'PRONTO', aim_row: '🐉 Toque numa linha', aim_cell: '🐉 Toque numa célula', s_autodragons: '🐉 Dragões auto' }
  };
  Object.keys(DSTR).forEach(function (l) { Object.assign(STR[l], DSTR[l]); });

  // Evolution + performance.
  const ESTR = {
    uk: { tier: 'Ранг {n}', evolve: 'Еволюція', evolve_need: 'Потрібен рівень {n}', evolved: 'Дракон еволюціонував!', s_perf: '⚡ Режим продуктивності' },
    en: { tier: 'Tier {n}', evolve: 'Evolve', evolve_need: 'Requires level {n}', evolved: 'Dragon evolved!', s_perf: '⚡ Performance mode' },
    es: { tier: 'Nivel {n}', evolve: 'Evolucionar', evolve_need: 'Requiere nivel {n}', evolved: '¡Dragón evolucionado!', s_perf: '⚡ Modo rendimiento' },
    de: { tier: 'Stufe {n}', evolve: 'Entwickeln', evolve_need: 'Benötigt Level {n}', evolved: 'Drache entwickelt!', s_perf: '⚡ Leistungsmodus' },
    fr: { tier: 'Rang {n}', evolve: 'Évoluer', evolve_need: 'Niveau {n} requis', evolved: 'Dragon évolué !', s_perf: '⚡ Mode performance' },
    pt: { tier: 'Nível {n}', evolve: 'Evoluir', evolve_need: 'Requer nível {n}', evolved: 'Dragão evoluído!', s_perf: '⚡ Modo desempenho' }
  };
  Object.keys(ESTR).forEach(function (l) { Object.assign(STR[l], ESTR[l]); });

  // Live-ops events.
  const EVSTR = {
    uk: { event_live: 'СЬОГОДНІ', ev_gold: 'Золота лихоманка', ev_gold_desc: '×2 золота за рівні', ev_energy: 'Сплеск енергії', ev_energy_desc: '×2 енергії за рівні', ev_dragon: 'Драконяча лють', ev_dragon_desc: 'Дракони заряджаються +50%' },
    en: { event_live: 'TODAY', ev_gold: 'Gold Rush', ev_gold_desc: '×2 gold from levels', ev_energy: 'Energy Surge', ev_energy_desc: '×2 energy from levels', ev_dragon: 'Dragon Fury', ev_dragon_desc: 'Dragons charge +50%' },
    es: { event_live: 'HOY', ev_gold: 'Fiebre del oro', ev_gold_desc: '×2 oro en niveles', ev_energy: 'Oleada de energía', ev_energy_desc: '×2 energía en niveles', ev_dragon: 'Furia dragón', ev_dragon_desc: 'Dragones cargan +50%' },
    de: { event_live: 'HEUTE', ev_gold: 'Goldrausch', ev_gold_desc: '×2 Gold in Levels', ev_energy: 'Energieschub', ev_energy_desc: '×2 Energie in Levels', ev_dragon: 'Drachenwut', ev_dragon_desc: 'Drachen laden +50%' },
    fr: { event_live: 'AUJOURD’HUI', ev_gold: 'Ruée vers l’or', ev_gold_desc: '×2 or dans les niveaux', ev_energy: 'Vague d’énergie', ev_energy_desc: '×2 énergie dans les niveaux', ev_dragon: 'Furie du dragon', ev_dragon_desc: 'Dragons chargent +50%' },
    pt: { event_live: 'HOJE', ev_gold: 'Corrida do ouro', ev_gold_desc: '×2 ouro nos níveis', ev_energy: 'Surto de energia', ev_energy_desc: '×2 energia nos níveis', ev_dragon: 'Fúria do dragão', ev_dragon_desc: 'Dragões carregam +50%' }
  };
  Object.keys(EVSTR).forEach(function (l) { Object.assign(STR[l], EVSTR[l]); });

  // Colorblind toggle + contextual tips.
  const TSTR = {
    uk: { s_colorblind: '♿ Для дальтоніків', tip_boss: '👑 Бос! Завдавай шкоди збігами. Кожні 5 ходів він контратакує кригою.', tip_jelly: '🟪 Очисти все желе — роби збіги на рожевих клітинках.', tip_chain: '🔒 Закуті кристали не рухаються. Зроби збіг поруч, щоб звільнити.', tip_crate: '📦 Ящики потребують 2 удари збігами поруч.', tip_dragon: '🐉 Дракон готовий! Торкнись його, щоб застосувати здатність.' },
    en: { s_colorblind: '♿ Colorblind', tip_boss: '👑 Boss! Deal damage with matches. Every 5 moves it strikes back with ice.', tip_jelly: '🟪 Clear all jelly — match on the pink cells.', tip_chain: '🔒 Chained crystals can’t move. Match next to them to free them.', tip_crate: '📦 Crates need 2 adjacent matches to break.', tip_dragon: '🐉 Dragon ready! Tap it to use its ability.' },
    es: { s_colorblind: '♿ Daltónicos', tip_boss: '👑 ¡Jefe! Daña con combinaciones. Cada 5 jugadas contraataca con hielo.', tip_jelly: '🟪 Limpia la gelatina: combina en las casillas rosas.', tip_chain: '🔒 Los cristales encadenados no se mueven. Combina al lado para liberarlos.', tip_crate: '📦 Las cajas necesitan 2 combinaciones adyacentes.', tip_dragon: '🐉 ¡Dragón listo! Tócalo para usar su habilidad.' },
    de: { s_colorblind: '♿ Farbenblind', tip_boss: '👑 Boss! Mache Schaden mit Matches. Alle 5 Züge kontert er mit Eis.', tip_jelly: '🟪 Entferne das Gelee – matche auf den rosa Feldern.', tip_chain: '🔒 Verkettete Kristalle bewegen sich nicht. Matche daneben, um sie zu befreien.', tip_crate: '📦 Kisten brauchen 2 Matches daneben.', tip_dragon: '🐉 Drache bereit! Tippe ihn an, um die Fähigkeit zu nutzen.' },
    fr: { s_colorblind: '♿ Daltoniens', tip_boss: '👑 Boss ! Infligez des dégâts avec des combos. Tous les 5 coups, il riposte avec de la glace.', tip_jelly: '🟪 Nettoyez la gelée : combinez sur les cases roses.', tip_chain: '🔒 Les cristaux enchaînés ne bougent pas. Combinez à côté pour les libérer.', tip_crate: '📦 Les caisses demandent 2 combos adjacents.', tip_dragon: '🐉 Dragon prêt ! Touchez-le pour utiliser sa capacité.' },
    pt: { s_colorblind: '♿ Daltônicos', tip_boss: '👑 Chefe! Cause dano com combinações. A cada 5 jogadas ele contra-ataca com gelo.', tip_jelly: '🟪 Limpe a geleia: combine nas células rosa.', tip_chain: '🔒 Cristais acorrentados não se movem. Combine ao lado para libertá-los.', tip_crate: '📦 Caixas precisam de 2 combinações ao lado.', tip_dragon: '🐉 Dragão pronto! Toque nele para usar a habilidade.' }
  };
  Object.keys(TSTR).forEach(function (l) { Object.assign(STR[l], TSTR[l]); });
  const ISTR = { uk: '📲 Встановити застосунок', en: '📲 Install app', es: '📲 Instalar app', de: '📲 App installieren', fr: '📲 Installer l’app', pt: '📲 Instalar app' };
  Object.keys(ISTR).forEach(function (l) { STR[l].s_install = ISTR[l]; });

  // Dragon synergy.
  const SYN = {
    uk: { synergy: 'СИНЕРГІЯ', tip_synergy: '⚡ Двоє драконів готові! Натисни СИНЕРГІЯ, щоб об’єднати їх у спільний удар.' },
    en: { synergy: 'SYNERGY', tip_synergy: '⚡ Two dragons ready! Tap SYNERGY to combine them into one ultimate.' },
    es: { synergy: 'SINERGIA', tip_synergy: '⚡ ¡Dos dragones listos! Pulsa SINERGIA para combinarlos.' },
    de: { synergy: 'SYNERGIE', tip_synergy: '⚡ Zwei Drachen bereit! Tippe SYNERGIE, um sie zu vereinen.' },
    fr: { synergy: 'SYNERGIE', tip_synergy: '⚡ Deux dragons prêts ! Touchez SYNERGIE pour les combiner.' },
    pt: { synergy: 'SINERGIA', tip_synergy: '⚡ Dois dragões prontos! Toque em SINERGIA para combiná-los.' }
  };
  Object.keys(SYN).forEach(function (l) { Object.assign(STR[l], SYN[l]); });
  const SYNC = { uk: 'Синергія заряджається…', en: 'Synergy charging…', es: 'Sinergia cargando…', de: 'Synergie lädt…', fr: 'Synergie en charge…', pt: 'Sinergia carregando…' };
  Object.keys(SYNC).forEach(function (l) { STR[l].synergy_charging = SYNC[l]; });

  // Fever / frenzy mode.
  const FV = {
    uk: { fever: 'ФЕВЕР', fever_on: 'ФЕВЕР! Потрійні очки — рубай швидше!' },
    en: { fever: 'FEVER', fever_on: 'FEVER! Triple score — match fast!' },
    es: { fever: 'FRENESÍ', fever_on: '¡FRENESÍ! Puntos triples — ¡rápido!' },
    de: { fever: 'FIEBER', fever_on: 'FIEBER! Dreifache Punkte — schnell!' },
    fr: { fever: 'FIÈVRE', fever_on: 'FIÈVRE ! Score triple — vite !' },
    pt: { fever: 'FEBRE', fever_on: 'FEBRE! Pontos triplos — rápido!' }
  };
  Object.keys(FV).forEach(function (l) { Object.assign(STR[l], FV[l]); });

  // Meta-feature batch: Wheel, Summon, Skills, PvP, Story.
  const MX = {
    uk: {
      t_wheel: 'Колесо', t_summon: 'Призов', t_skills: 'Навички', t_pvp: 'Дуель', t_story: 'Історія',
      wheel_title: '🎡 Колесо фортуни', wheel_free: 'Безкоштовне обертання готове!', wheel_cost: 'Ще обертання: {n}💎',
      wheel_spin_free: '🎡 Крутити безкоштовно', wheel_spin_gems: '🎡 Крутити ({n}💎)', need_gems: 'Недостатньо кристалів 💎',
      summon_title: 'Призов дракона', summon_hint: 'Виклич скарб зі стародавнього яйця', summon_do: 'Призвати ({n}💎)',
      sr_common: 'Звичайне', sr_rare: 'Рідкісне', sr_epic: 'ЕПІЧНЕ',
      skills_title: 'Дерево навичок', skills_sub: 'Постійні бонуси за кристали 💎', maxed: 'МАКС',
      sk_moves: 'Спритність', sk_moves_d: '+1 хід на старті рівня',
      sk_charge: 'Лють драконів', sk_charge_d: '+8% швидкість заряду драконів',
      sk_score: 'Мудрість', sk_score_d: '+6% до очок',
      sk_power: 'Міць', sk_power_d: '+1 до сили здібностей драконів',
      sk_gold: 'Багатство', sk_gold_d: '+8% золота за рівень',
      sk_start: 'Провидіння', sk_start_d: '+1 спец-кристал на старті',
      pvp_title: 'Дуелі драконів', pvp_trophies: '{n} трофеїв', pvp_record: '{w}П / {l}Пр',
      pvp_sub: 'Обери суперника і побий його результат за 45 сек!', pvp_easy: 'Легкий', pvp_even: 'Рівний', pvp_hard: 'Важкий',
      pvp_target: 'ціль {n}', pvp_fight: 'Бій ⚔️', pvp_win: 'Перемога!', pvp_lose: 'Поразка', pvp_again: 'Ще бій',
      chapter_n: 'Розділ {n}', story_locked: 'Відкриється на рівні {n}',
      ch1_t: 'Пробудження', ch1: 'Серед попелу згаслого вулкана ти знаходиш тепле яйце. Крізь шкаралупу пробивається вогник — народжується твій перший дракон.',
      ch2_t: 'Вогняні острови', ch2: 'Лава тече ріками, а в небі кружляють вогняні дракони. Тут ти вчишся приборкувати полум’я й запалювати кристали.',
      ch3_t: 'Крижаний трон', ch3: 'Морозний вітер сковує острови льодом. Крижаний дракон визнає тебе гідним і приєднується до зграї.',
      ch4_t: 'Буря пробуджується', ch4: 'Грім розколює небо. Штормовий дракон випробовує твою вправність блискавками, що б’ють по дошці.',
      ch5_t: 'Ліс шепоче', ch5: 'Стародавні дерева ховають смарагдового дракона. Природа дарує тобі силу росту й достатку.',
      ch6_t: 'Ефірні висоти', ch6: 'Між зірок ширяє ефірний дракон — найзагадковіший із усіх. Реальність згинається під його крилами.',
      ch7_t: 'Володар драконів', ch7: 'Усі стихії скорилися тобі. Ти більше не мандрівник — ти легенда, чиє ім’я драконі шепочуть крізь віки.'
    },
    en: {
      t_wheel: 'Wheel', t_summon: 'Summon', t_skills: 'Skills', t_pvp: 'Duel', t_story: 'Story',
      wheel_title: '🎡 Wheel of Fortune', wheel_free: 'Free spin ready!', wheel_cost: 'Extra spin: {n}💎',
      wheel_spin_free: '🎡 Spin for free', wheel_spin_gems: '🎡 Spin ({n}💎)', need_gems: 'Not enough gems 💎',
      summon_title: 'Dragon Summon', summon_hint: 'Summon a treasure from the ancient egg', summon_do: 'Summon ({n}💎)',
      sr_common: 'Common', sr_rare: 'Rare', sr_epic: 'EPIC',
      skills_title: 'Skill Tree', skills_sub: 'Permanent bonuses for gems 💎', maxed: 'MAX',
      sk_moves: 'Agility', sk_moves_d: '+1 move at level start',
      sk_charge: 'Dragon Fury', sk_charge_d: '+8% dragon charge speed',
      sk_score: 'Wisdom', sk_score_d: '+6% score',
      sk_power: 'Might', sk_power_d: '+1 dragon ability power',
      sk_gold: 'Fortune', sk_gold_d: '+8% level gold',
      sk_start: 'Foresight', sk_start_d: '+1 special crystal at start',
      pvp_title: 'Dragon Duels', pvp_trophies: '{n} trophies', pvp_record: '{w}W / {l}L',
      pvp_sub: 'Pick a rival and beat their score in 45s!', pvp_easy: 'Easy', pvp_even: 'Even', pvp_hard: 'Hard',
      pvp_target: 'target {n}', pvp_fight: 'Fight ⚔️', pvp_win: 'Victory!', pvp_lose: 'Defeat', pvp_again: 'Fight again',
      chapter_n: 'Chapter {n}', story_locked: 'Unlocks at level {n}',
      ch1_t: 'The Awakening', ch1: 'Among the ashes of a dead volcano you find a warm egg. A spark breaks through the shell — your first dragon is born.',
      ch2_t: 'The Ember Isles', ch2: 'Lava flows in rivers and fire dragons wheel overhead. Here you learn to tame flame and ignite crystals.',
      ch3_t: 'The Frozen Throne', ch3: 'A biting wind locks the isles in ice. The frost dragon deems you worthy and joins your flight.',
      ch4_t: 'The Storm Wakes', ch4: 'Thunder splits the sky. The storm dragon tests your skill with lightning that strikes across the board.',
      ch5_t: 'The Forest Whispers', ch5: 'Ancient trees hide an emerald dragon. Nature grants you the power of growth and plenty.',
      ch6_t: 'The Aether Heights', ch6: 'Among the stars soars the aether dragon, most mysterious of all. Reality bends beneath its wings.',
      ch7_t: 'Dragon Lord', ch7: 'Every element has bowed to you. No longer a traveler — you are a legend whose name dragons whisper through the ages.'
    },
    es: {
      t_wheel: 'Ruleta', t_summon: 'Invocar', t_skills: 'Talentos', t_pvp: 'Duelo', t_story: 'Historia',
      wheel_title: '🎡 Ruleta de la Fortuna', wheel_free: '¡Giro gratis listo!', wheel_cost: 'Giro extra: {n}💎',
      wheel_spin_free: '🎡 Girar gratis', wheel_spin_gems: '🎡 Girar ({n}💎)', need_gems: 'Gemas insuficientes 💎',
      summon_title: 'Invocar dragón', summon_hint: 'Invoca un tesoro del huevo antiguo', summon_do: 'Invocar ({n}💎)',
      sr_common: 'Común', sr_rare: 'Raro', sr_epic: 'ÉPICO',
      skills_title: 'Árbol de talentos', skills_sub: 'Bonos permanentes por gemas 💎', maxed: 'MÁX',
      sk_moves: 'Agilidad', sk_moves_d: '+1 movimiento al inicio', sk_charge: 'Furia', sk_charge_d: '+8% carga de dragones',
      sk_score: 'Sabiduría', sk_score_d: '+6% puntuación', sk_power: 'Poder', sk_power_d: '+1 poder de dragón',
      sk_gold: 'Fortuna', sk_gold_d: '+8% oro por nivel', sk_start: 'Visión', sk_start_d: '+1 cristal especial al inicio',
      pvp_title: 'Duelos', pvp_trophies: '{n} trofeos', pvp_record: '{w}V / {l}D',
      pvp_sub: '¡Elige rival y supera su puntuación en 45s!', pvp_easy: 'Fácil', pvp_even: 'Igual', pvp_hard: 'Difícil',
      pvp_target: 'meta {n}', pvp_fight: 'Luchar ⚔️', pvp_win: '¡Victoria!', pvp_lose: 'Derrota', pvp_again: 'Otra vez',
      chapter_n: 'Capítulo {n}', story_locked: 'Se abre en el nivel {n}'
    },
    de: {
      t_wheel: 'Rad', t_summon: 'Rufen', t_skills: 'Talente', t_pvp: 'Duell', t_story: 'Story',
      wheel_title: '🎡 Glücksrad', wheel_free: 'Gratis-Dreh bereit!', wheel_cost: 'Extra-Dreh: {n}💎',
      wheel_spin_free: '🎡 Gratis drehen', wheel_spin_gems: '🎡 Drehen ({n}💎)', need_gems: 'Zu wenig Edelsteine 💎',
      summon_title: 'Drachen rufen', summon_hint: 'Rufe einen Schatz aus dem alten Ei', summon_do: 'Rufen ({n}💎)',
      sr_common: 'Gewöhnlich', sr_rare: 'Selten', sr_epic: 'EPISCH',
      skills_title: 'Talentbaum', skills_sub: 'Dauerhafte Boni für Edelsteine 💎', maxed: 'MAX',
      sk_moves: 'Agilität', sk_moves_d: '+1 Zug zu Beginn', sk_charge: 'Zorn', sk_charge_d: '+8% Drachenladung',
      sk_score: 'Weisheit', sk_score_d: '+6% Punkte', sk_power: 'Macht', sk_power_d: '+1 Drachenkraft',
      sk_gold: 'Reichtum', sk_gold_d: '+8% Gold pro Level', sk_start: 'Weitsicht', sk_start_d: '+1 Spezialkristall zu Beginn',
      pvp_title: 'Duelle', pvp_trophies: '{n} Trophäen', pvp_record: '{w}S / {l}N',
      pvp_sub: 'Wähle einen Rivalen und schlage seinen Score in 45s!', pvp_easy: 'Leicht', pvp_even: 'Gleich', pvp_hard: 'Schwer',
      pvp_target: 'Ziel {n}', pvp_fight: 'Kämpfen ⚔️', pvp_win: 'Sieg!', pvp_lose: 'Niederlage', pvp_again: 'Nochmal',
      chapter_n: 'Kapitel {n}', story_locked: 'Ab Level {n}'
    },
    fr: {
      t_wheel: 'Roue', t_summon: 'Invoquer', t_skills: 'Talents', t_pvp: 'Duel', t_story: 'Histoire',
      wheel_title: '🎡 Roue de la Fortune', wheel_free: 'Tour gratuit prêt !', wheel_cost: 'Tour extra : {n}💎',
      wheel_spin_free: '🎡 Tourner gratis', wheel_spin_gems: '🎡 Tourner ({n}💎)', need_gems: 'Pas assez de gemmes 💎',
      summon_title: 'Invoquer un dragon', summon_hint: 'Invoque un trésor de l’œuf ancien', summon_do: 'Invoquer ({n}💎)',
      sr_common: 'Commun', sr_rare: 'Rare', sr_epic: 'ÉPIQUE',
      skills_title: 'Arbre de talents', skills_sub: 'Bonus permanents contre gemmes 💎', maxed: 'MAX',
      sk_moves: 'Agilité', sk_moves_d: '+1 coup au départ', sk_charge: 'Furie', sk_charge_d: '+8% charge des dragons',
      sk_score: 'Sagesse', sk_score_d: '+6% score', sk_power: 'Puissance', sk_power_d: '+1 puissance de dragon',
      sk_gold: 'Fortune', sk_gold_d: '+8% or par niveau', sk_start: 'Clairvoyance', sk_start_d: '+1 cristal spécial au départ',
      pvp_title: 'Duels', pvp_trophies: '{n} trophées', pvp_record: '{w}V / {l}D',
      pvp_sub: 'Choisis un rival et bats son score en 45s !', pvp_easy: 'Facile', pvp_even: 'Égal', pvp_hard: 'Difficile',
      pvp_target: 'cible {n}', pvp_fight: 'Combattre ⚔️', pvp_win: 'Victoire !', pvp_lose: 'Défaite', pvp_again: 'Rejouer',
      chapter_n: 'Chapitre {n}', story_locked: 'Débloqué au niveau {n}'
    },
    pt: {
      t_wheel: 'Roleta', t_summon: 'Invocar', t_skills: 'Talentos', t_pvp: 'Duelo', t_story: 'História',
      wheel_title: '🎡 Roda da Fortuna', wheel_free: 'Giro grátis pronto!', wheel_cost: 'Giro extra: {n}💎',
      wheel_spin_free: '🎡 Girar grátis', wheel_spin_gems: '🎡 Girar ({n}💎)', need_gems: 'Gemas insuficientes 💎',
      summon_title: 'Invocar dragão', summon_hint: 'Invoque um tesouro do ovo antigo', summon_do: 'Invocar ({n}💎)',
      sr_common: 'Comum', sr_rare: 'Raro', sr_epic: 'ÉPICO',
      skills_title: 'Árvore de talentos', skills_sub: 'Bônus permanentes por gemas 💎', maxed: 'MÁX',
      sk_moves: 'Agilidade', sk_moves_d: '+1 jogada no início', sk_charge: 'Fúria', sk_charge_d: '+8% carga dos dragões',
      sk_score: 'Sabedoria', sk_score_d: '+6% pontos', sk_power: 'Poder', sk_power_d: '+1 poder de dragão',
      sk_gold: 'Fortuna', sk_gold_d: '+8% ouro por nível', sk_start: 'Visão', sk_start_d: '+1 cristal especial no início',
      pvp_title: 'Duelos', pvp_trophies: '{n} troféus', pvp_record: '{w}V / {l}D',
      pvp_sub: 'Escolha um rival e supere a pontuação em 45s!', pvp_easy: 'Fácil', pvp_even: 'Igual', pvp_hard: 'Difícil',
      pvp_target: 'meta {n}', pvp_fight: 'Lutar ⚔️', pvp_win: 'Vitória!', pvp_lose: 'Derrota', pvp_again: 'De novo',
      chapter_n: 'Capítulo {n}', story_locked: 'Abre no nível {n}'
    }
  };
  Object.keys(MX).forEach(function (l) { Object.assign(STR[l], MX[l]); });
  const HARD = { uk: 'Складний рівень', en: 'Hard level', es: 'Nivel difícil', de: 'Schweres Level', fr: 'Niveau difficile', pt: 'Nível difícil' };
  Object.keys(HARD).forEach(function (l) { STR[l].hard_level = HARD[l]; });

  // Ads / rewarded.
  const ADS = {
    uk: { double_reward: 'Подвоїти нагороду', double_reward_t: 'Подвійна нагорода!', double_reward_s: 'Реклама → ×2 монет і енергії', good: 'Добре!', coins_w: 'Монети', energy_w: 'Енергія', hatch_w: 'Яйце', ad_label: 'Реклама', ad_skip: 'Пропустити' },
    en: { double_reward: 'Double reward', double_reward_t: 'Double Reward!', double_reward_s: 'Watch an ad for ×2 Coins & Energy', good: 'Good!', coins_w: 'Coins', energy_w: 'Energy', hatch_w: 'Egg', ad_label: 'Ad', ad_skip: 'Skip' },
    es: { double_reward: 'Duplicar recompensa', ad_label: 'Anuncio', ad_skip: 'Saltar' },
    de: { double_reward: 'Belohnung verdoppeln', ad_label: 'Werbung', ad_skip: 'Überspringen' },
    fr: { double_reward: 'Doubler la récompense', ad_label: 'Pub', ad_skip: 'Passer' },
    pt: { double_reward: 'Dobrar recompensa', ad_label: 'Anúncio', ad_skip: 'Pular' }
  };
  Object.keys(ADS).forEach(function (l) { Object.assign(STR[l], ADS[l]); });

  // Win/lose screen polish.
  const WL = {
    uk: { so_close: 'Так близько!', short_by: 'Не вистачило: {n}', perfect: 'ПЕРФЕКТ!', first_clear: 'Перше проходження!', boss: 'Бос' },
    en: { so_close: 'So close!', short_by: 'Short by {n}', perfect: 'PERFECT!', first_clear: 'First clear!', boss: 'Boss' },
    es: { so_close: '¡Tan cerca!', short_by: 'Faltaron {n}', perfect: '¡PERFECTO!', first_clear: '¡Primera vez!', boss: 'Jefe' },
    de: { so_close: 'So knapp!', short_by: 'Es fehlten {n}', perfect: 'PERFEKT!', first_clear: 'Erstmals geschafft!', boss: 'Boss' },
    fr: { so_close: 'Si près !', short_by: 'Il manquait {n}', perfect: 'PARFAIT !', first_clear: 'Première fois !', boss: 'Boss' },
    pt: { so_close: 'Tão perto!', short_by: 'Faltaram {n}', perfect: 'PERFEITO!', first_clear: 'Primeira vez!', boss: 'Chefe' }
  };
  Object.keys(WL).forEach(function (l) { Object.assign(STR[l], WL[l]); });

  // Player statistics screen.
  const STT = {
    uk: { stats_title: 'Статистика', credits: 'Зроблено з ❤', st_progress: 'Прогрес', st_stars: 'Зірок зібрано', st_levels_won: 'Рівнів пройдено', st_max_combo: 'Макс. комбо', st_crushed: 'Кристалів знищено', st_specials: 'Спец-кристалів', st_dragons: 'Драконів', st_procs: 'Здібностей драконів', st_energy: 'Енергії зібрано', st_streak: 'Найкраща серія', st_blitz: 'Бліц рекорд', st_endless: 'Безмежжя рекорд', st_trials: 'Випробування', st_pvp: 'Дуелі' },
    en: { stats_title: 'Statistics', credits: 'Made with ❤', st_progress: 'Progress', st_stars: 'Stars earned', st_levels_won: 'Levels won', st_max_combo: 'Max combo', st_crushed: 'Crystals crushed', st_specials: 'Specials made', st_dragons: 'Dragons', st_procs: 'Dragon abilities', st_energy: 'Energy collected', st_streak: 'Best streak', st_blitz: 'Blitz best', st_endless: 'Endless best', st_trials: 'Trials depth', st_pvp: 'Duels' },
    es: { stats_title: 'Estadísticas', credits: 'Hecho con ❤', st_progress: 'Progreso', st_stars: 'Estrellas', st_levels_won: 'Niveles ganados', st_max_combo: 'Combo máx.', st_crushed: 'Cristales rotos', st_specials: 'Especiales', st_dragons: 'Dragones', st_procs: 'Habilidades', st_energy: 'Energía', st_streak: 'Mejor racha', st_blitz: 'Récord Blitz', st_endless: 'Récord Infinito', st_trials: 'Pruebas', st_pvp: 'Duelos' },
    de: { stats_title: 'Statistik', credits: 'Mit ❤ gemacht', st_progress: 'Fortschritt', st_stars: 'Sterne', st_levels_won: 'Level gewonnen', st_max_combo: 'Max. Combo', st_crushed: 'Kristalle zerstört', st_specials: 'Spezialsteine', st_dragons: 'Drachen', st_procs: 'Drachenfähigkeiten', st_energy: 'Energie', st_streak: 'Beste Serie', st_blitz: 'Blitz-Rekord', st_endless: 'Endlos-Rekord', st_trials: 'Prüfungen', st_pvp: 'Duelle' },
    fr: { stats_title: 'Statistiques', credits: 'Fait avec ❤', st_progress: 'Progression', st_stars: 'Étoiles', st_levels_won: 'Niveaux gagnés', st_max_combo: 'Combo max', st_crushed: 'Cristaux brisés', st_specials: 'Spéciaux', st_dragons: 'Dragons', st_procs: 'Capacités', st_energy: 'Énergie', st_streak: 'Meilleure série', st_blitz: 'Record Blitz', st_endless: 'Record Infini', st_trials: 'Épreuves', st_pvp: 'Duels' },
    pt: { stats_title: 'Estatísticas', credits: 'Feito com ❤', st_progress: 'Progresso', st_stars: 'Estrelas', st_levels_won: 'Níveis vencidos', st_max_combo: 'Combo máx.', st_crushed: 'Cristais quebrados', st_specials: 'Especiais', st_dragons: 'Dragões', st_procs: 'Habilidades', st_energy: 'Energia', st_streak: 'Melhor sequência', st_blitz: 'Recorde Blitz', st_endless: 'Recorde Infinito', st_trials: 'Provas', st_pvp: 'Duelos' }
  };
  Object.keys(STT).forEach(function (l) { Object.assign(STR[l], STT[l]); });

  // Egg incubator clarity.
  const EGG = {
    uk: { egg_ready: 'Готове до вилуплення!', egg_remaining: '{n} ⚡ до вилуплення' },
    en: { egg_ready: 'Ready to hatch!', egg_remaining: '{n} ⚡ to hatch' },
    es: { egg_ready: '¡Listo para eclosionar!', egg_remaining: '{n} ⚡ para eclosionar' },
    de: { egg_ready: 'Bereit zum Schlüpfen!', egg_remaining: '{n} ⚡ bis zum Schlüpfen' },
    fr: { egg_ready: 'Prêt à éclore !', egg_remaining: '{n} ⚡ pour éclore' },
    pt: { egg_ready: 'Pronto para chocar!', egg_remaining: '{n} ⚡ para chocar' }
  };
  Object.keys(EGG).forEach(function (l) { Object.assign(STR[l], EGG[l]); });

  // Roguelite Dragon Trials.
  const TR = {
    uk: { mode_trials: 'Випробування', mode_trials_desc: 'Роуґлайт-забіг: між рівнями обирай реліквію. Як глибоко зайдеш?', depth: 'Глибина {n}', choose_relic: 'Обери реліквію', run_over: '🐉 Забіг завершено', revived: 'Щит врятував забіг!',
      relic_moves: 'Сувій ходів', relic_moves_d: '+3 ходи на кожному рівні', relic_charge: 'Кристал заряду', relic_charge_d: 'Дракони заряджаються швидше', relic_score: 'Амулет очок', relic_score_d: '+15% до очок', relic_specials: 'Зерно сили', relic_specials_d: 'Починай з особливим кристалом', relic_power: 'Ікло дракона', relic_power_d: '+1 до сили драконів', relic_shield: 'Щит фенікса', relic_shield_d: 'Переживи одну поразку' },
    en: { mode_trials: 'Trials', mode_trials_desc: 'Roguelite run: pick a relic between levels. How deep can you go?', depth: 'Depth {n}', choose_relic: 'Choose a relic', run_over: '🐉 Run over', revived: 'Shield saved your run!',
      relic_moves: 'Scroll of Moves', relic_moves_d: '+3 moves every level', relic_charge: 'Charge Crystal', relic_charge_d: 'Dragons charge faster', relic_score: 'Score Amulet', relic_score_d: '+15% score', relic_specials: 'Seed of Power', relic_specials_d: 'Start with a special crystal', relic_power: 'Dragon Fang', relic_power_d: '+1 dragon ability power', relic_shield: 'Phoenix Shield', relic_shield_d: 'Survive one defeat' },
    es: { mode_trials: 'Pruebas', mode_trials_desc: 'Roguelite: elige una reliquia entre niveles. ¿Hasta dónde llegas?', depth: 'Profundidad {n}', choose_relic: 'Elige una reliquia', run_over: '🐉 Fin de la partida', revived: '¡El escudo te salvó!',
      relic_moves: 'Pergamino de movimientos', relic_moves_d: '+3 movimientos por nivel', relic_charge: 'Cristal de carga', relic_charge_d: 'Dragones cargan más rápido', relic_score: 'Amuleto de puntos', relic_score_d: '+15% puntos', relic_specials: 'Semilla de poder', relic_specials_d: 'Empieza con un cristal especial', relic_power: 'Colmillo de dragón', relic_power_d: '+1 poder de dragón', relic_shield: 'Escudo de fénix', relic_shield_d: 'Sobrevive una derrota' },
    de: { mode_trials: 'Prüfungen', mode_trials_desc: 'Roguelite: wähle zwischen Levels ein Relikt. Wie tief kommst du?', depth: 'Tiefe {n}', choose_relic: 'Wähle ein Relikt', run_over: '🐉 Lauf vorbei', revived: 'Schild rettete den Lauf!',
      relic_moves: 'Zugrolle', relic_moves_d: '+3 Züge pro Level', relic_charge: 'Ladekristall', relic_charge_d: 'Drachen laden schneller', relic_score: 'Punkteamulett', relic_score_d: '+15% Punkte', relic_specials: 'Saat der Macht', relic_specials_d: 'Starte mit Spezialkristall', relic_power: 'Drachenzahn', relic_power_d: '+1 Drachenstärke', relic_shield: 'Phönixschild', relic_shield_d: 'Überlebe eine Niederlage' },
    fr: { mode_trials: 'Épreuves', mode_trials_desc: 'Roguelite : choisis une relique entre les niveaux. Jusqu’où iras-tu ?', depth: 'Profondeur {n}', choose_relic: 'Choisis une relique', run_over: '🐉 Partie terminée', revived: 'Le bouclier vous a sauvé !',
      relic_moves: 'Parchemin de coups', relic_moves_d: '+3 coups par niveau', relic_charge: 'Cristal de charge', relic_charge_d: 'Dragons chargent plus vite', relic_score: 'Amulette de score', relic_score_d: '+15% de score', relic_specials: 'Graine de pouvoir', relic_specials_d: 'Commence avec un cristal spécial', relic_power: 'Croc de dragon', relic_power_d: '+1 puissance des dragons', relic_shield: 'Bouclier du phénix', relic_shield_d: 'Survis à une défaite' },
    pt: { mode_trials: 'Provações', mode_trials_desc: 'Roguelite: escolha uma relíquia entre níveis. Até onde vai?', depth: 'Profundidade {n}', choose_relic: 'Escolha uma relíquia', run_over: '🐉 Fim da jornada', revived: 'O escudo salvou sua jornada!',
      relic_moves: 'Pergaminho de jogadas', relic_moves_d: '+3 jogadas por nível', relic_charge: 'Cristal de carga', relic_charge_d: 'Dragões carregam mais rápido', relic_score: 'Amuleto de pontos', relic_score_d: '+15% de pontos', relic_specials: 'Semente de poder', relic_specials_d: 'Começa com um cristal especial', relic_power: 'Presa de dragão', relic_power_d: '+1 poder dos dragões', relic_shield: 'Escudo da fênix', relic_shield_d: 'Sobreviva a uma derrota' }
  };
  Object.keys(TR).forEach(function (l) { Object.assign(STR[l], TR[l]); });

  // On-board merge.
  const MG = {
    uk: { merge_toast: 'Злиття! Сильніший кристал', tip_merge: '🔮 Поміняй місцями два однакові особливі кристали, щоб злити їх у потужніший!' },
    en: { merge_toast: 'Merge! Stronger crystal', tip_merge: '🔮 Swap two matching special crystals to merge them into a stronger one!' },
    es: { merge_toast: '¡Fusión! Cristal más fuerte', tip_merge: '🔮 ¡Intercambia dos cristales especiales iguales para fusionarlos!' },
    de: { merge_toast: 'Verschmelzung! Stärkerer Kristall', tip_merge: '🔮 Tausche zwei gleiche Spezialkristalle, um sie zu verschmelzen!' },
    fr: { merge_toast: 'Fusion ! Cristal plus fort', tip_merge: '🔮 Échange deux cristaux spéciaux identiques pour les fusionner !' },
    pt: { merge_toast: 'Fusão! Cristal mais forte', tip_merge: '🔮 Troque dois cristais especiais iguais para fundi-los num mais forte!' }
  };
  Object.keys(MG).forEach(function (l) { Object.assign(STR[l], MG[l]); });

  // Story & characters.
  const ST = {
    uk: {
      story_title: 'Легенда островів',
      story_intro: '<p>Колись Драконові острови сяяли магією кристалів. Та <b>П’ять Володарів Тіні</b> зруйнували гармонію, замкнувши драконів у яйцях.</p><p>Ти — останній <b>Хранитель</b>. Поєднуй кристали, пробуджуй драконів і поверни світло островам!</p>',
      dragon_q_flare: 'Нарешті вільний! Покажемо їм справжній вогонь!',
      dragon_q_frost: 'Спокій… і холод. Я заморожу будь-яку загрозу.',
      dragon_q_storm: 'Відчуваєш у повітрі? Це буря — і вона на нашому боці!',
      dragon_q_verdant: 'Життя повертається. Разом ми виростимо нову надію.',
      dragon_q_aether: 'Зорі шепочуть про перемогу. Ходімо, Хранителю.',
      boss_l_boss_ash: 'Ці острови — попіл під моєю п’ятою. Тікай, поки можеш!',
      boss_l_boss_titan: 'Холод вічності поглине тебе. Жоден дракон не врятує.',
      boss_l_boss_storm: 'Я — сама буря! Твої кристали стануть прахом.',
      boss_l_boss_beast: 'Хащі чують чужинця. Ти не вийдеш звідси живим.',
      boss_l_boss_phoenix: 'З попелу я повставав тисячі разів. Ти впадеш лише раз.'
    },
    en: {
      story_title: 'Legend of the Isles',
      story_intro: '<p>Once the Dragon Isles shone with crystal magic. But the <b>Five Shadow Lords</b> shattered the harmony and sealed the dragons inside eggs.</p><p>You are the last <b>Keeper</b>. Match crystals, awaken the dragons, and bring the light back to the isles!</p>',
      dragon_q_flare: 'Free at last! Let’s show them real fire!',
      dragon_q_frost: 'Calm… and cold. I’ll freeze any threat.',
      dragon_q_storm: 'Feel it in the air? The storm is on our side!',
      dragon_q_verdant: 'Life returns. Together we’ll grow new hope.',
      dragon_q_aether: 'The stars whisper of victory. Lead on, Keeper.',
      boss_l_boss_ash: 'These isles are ash beneath my heel. Flee while you can!',
      boss_l_boss_titan: 'The cold of eternity will swallow you. No dragon can save you.',
      boss_l_boss_storm: 'I am the storm itself! Your crystals will be dust.',
      boss_l_boss_beast: 'The thicket smells a stranger. You won’t leave alive.',
      boss_l_boss_phoenix: 'From ash I’ve risen a thousand times. You fall only once.'
    },
    es: {
      story_title: 'Leyenda de las Islas',
      story_intro: '<p>Las Islas Dragón brillaban con magia de cristal. Pero los <b>Cinco Señores de la Sombra</b> rompieron la armonía y sellaron a los dragones en huevos.</p><p>Eres el último <b>Guardián</b>. ¡Combina cristales, despierta a los dragones y devuelve la luz!</p>',
      dragon_q_flare: '¡Libre al fin! ¡Mostrémosles fuego de verdad!',
      dragon_q_frost: 'Calma… y frío. Congelaré cualquier amenaza.',
      dragon_q_storm: '¿Lo sientes? ¡La tormenta está de nuestro lado!',
      dragon_q_verdant: 'La vida vuelve. Juntos cultivaremos esperanza.',
      dragon_q_aether: 'Las estrellas susurran victoria. Guía, Guardián.',
      boss_l_boss_ash: 'Estas islas son ceniza bajo mi talón. ¡Huye!',
      boss_l_boss_titan: 'El frío eterno te tragará. Ningún dragón te salvará.',
      boss_l_boss_storm: '¡Soy la tormenta! Tus cristales serán polvo.',
      boss_l_boss_beast: 'La espesura huele a intruso. No saldrás vivo.',
      boss_l_boss_phoenix: 'De las cenizas resurgí mil veces. Tú caes una.'
    },
    de: {
      story_title: 'Legende der Inseln',
      story_intro: '<p>Einst leuchteten die Dracheninseln vor Kristallmagie. Doch die <b>Fünf Schattenlords</b> zerstörten die Harmonie und sperrten die Drachen in Eier.</p><p>Du bist der letzte <b>Hüter</b>. Kombiniere Kristalle, erwecke die Drachen und bring das Licht zurück!</p>',
      dragon_q_flare: 'Endlich frei! Zeigen wir echtes Feuer!',
      dragon_q_frost: 'Ruhe… und Kälte. Ich friere jede Gefahr ein.',
      dragon_q_storm: 'Spürst du es? Der Sturm ist auf unserer Seite!',
      dragon_q_verdant: 'Das Leben kehrt zurück. Gemeinsam säen wir Hoffnung.',
      dragon_q_aether: 'Die Sterne flüstern vom Sieg. Führe, Hüter.',
      boss_l_boss_ash: 'Diese Inseln sind Asche unter meiner Ferse. Flieh!',
      boss_l_boss_titan: 'Die Kälte der Ewigkeit verschlingt dich. Kein Drache hilft dir.',
      boss_l_boss_storm: 'Ich bin der Sturm! Deine Kristalle werden Staub.',
      boss_l_boss_beast: 'Das Dickicht wittert einen Fremden. Du entkommst nicht.',
      boss_l_boss_phoenix: 'Aus Asche erhob ich mich tausendfach. Du fällst nur einmal.'
    },
    fr: {
      story_title: 'Légende des Îles',
      story_intro: '<p>Jadis, les Îles Dragon brillaient de magie cristalline. Mais les <b>Cinq Seigneurs de l’Ombre</b> ont brisé l’harmonie et scellé les dragons dans des œufs.</p><p>Tu es le dernier <b>Gardien</b>. Associe les cristaux, réveille les dragons et ramène la lumière !</p>',
      dragon_q_flare: 'Enfin libre ! Montrons-leur le vrai feu !',
      dragon_q_frost: 'Le calme… et le froid. Je gèlerai toute menace.',
      dragon_q_storm: 'Tu le sens ? La tempête est de notre côté !',
      dragon_q_verdant: 'La vie revient. Ensemble, semons l’espoir.',
      dragon_q_aether: 'Les étoiles murmurent la victoire. Guide-nous, Gardien.',
      boss_l_boss_ash: 'Ces îles sont cendres sous mon talon. Fuis !',
      boss_l_boss_titan: 'Le froid éternel t’engloutira. Aucun dragon ne te sauvera.',
      boss_l_boss_storm: 'Je suis la tempête ! Tes cristaux seront poussière.',
      boss_l_boss_beast: 'Le fourré sent un intrus. Tu ne sortiras pas vivant.',
      boss_l_boss_phoenix: 'Des cendres je suis revenu mille fois. Tu ne tombes qu’une.'
    },
    pt: {
      story_title: 'Lenda das Ilhas',
      story_intro: '<p>As Ilhas Dragão brilhavam com magia de cristal. Mas os <b>Cinco Senhores das Sombras</b> quebraram a harmonia e selaram os dragões em ovos.</p><p>Você é o último <b>Guardião</b>. Combine cristais, desperte os dragões e traga a luz de volta!</p>',
      dragon_q_flare: 'Livre enfim! Vamos mostrar fogo de verdade!',
      dragon_q_frost: 'Calma… e frio. Vou congelar qualquer ameaça.',
      dragon_q_storm: 'Sente no ar? A tempestade está do nosso lado!',
      dragon_q_verdant: 'A vida retorna. Juntos cultivaremos esperança.',
      dragon_q_aether: 'As estrelas sussurram vitória. Guie, Guardião.',
      boss_l_boss_ash: 'Estas ilhas são cinzas sob meu calcanhar. Fuja!',
      boss_l_boss_titan: 'O frio eterno vai te engolir. Nenhum dragão te salva.',
      boss_l_boss_storm: 'Eu sou a tempestade! Seus cristais virarão pó.',
      boss_l_boss_beast: 'A mata sente um intruso. Você não sai vivo.',
      boss_l_boss_phoenix: 'Das cinzas ressurgi mil vezes. Você cai só uma.'
    }
  };
  Object.keys(ST).forEach(function (l) { Object.assign(STR[l], ST[l]); });

  // Island farm (idle income).
  const FM = {
    uk: { farm_title: '🏝️ Ферма острова', collect_all: 'Зібрати все', farm_empty: 'Поки нічого збирати', hour: 'год', not_built: 'Не збудовано', production: 'Виробництво', stored: 'Накопичено', build: 'Збудувати', built: '{name} збудовано!', collect: 'Зібрати', welcome_back_title: '🏝️ З поверненням!', welcome_back: 'Поки тебе не було, острів працював на тебе:',
      build_volcano: 'Вулкан', build_garden: 'Сад', build_forge: 'Кузня', build_mine: 'Шахта',
      build_desc_volcano: 'Виплавляє золото з лави щогодини.', build_desc_garden: 'Вирощує енергію для драконів.', build_desc_forge: 'Кує багато золота на годину.', build_desc_mine: 'Видобуває рідкісні кристали 💎.' },
    en: { farm_title: '🏝️ Island Farm', collect_all: 'Collect all', farm_empty: 'Nothing to collect yet', hour: 'hr', not_built: 'Not built', production: 'Production', stored: 'Stored', build: 'Build', built: '{name} built!', collect: 'Collect', welcome_back_title: '🏝️ Welcome back!', welcome_back: 'While you were away, your island worked for you:',
      build_volcano: 'Volcano', build_garden: 'Garden', build_forge: 'Forge', build_mine: 'Mine',
      build_desc_volcano: 'Smelts gold from lava every hour.', build_desc_garden: 'Grows energy for your dragons.', build_desc_forge: 'Forges lots of gold per hour.', build_desc_mine: 'Mines rare gems 💎.' },
    es: { farm_title: '🏝️ Granja de la isla', collect_all: 'Recoger todo', farm_empty: 'Nada que recoger aún', hour: 'h', not_built: 'No construido', production: 'Producción', stored: 'Almacenado', build: 'Construir', built: '¡{name} construido!', collect: 'Recoger', welcome_back_title: '🏝️ ¡Bienvenido!', welcome_back: 'Mientras no estabas, tu isla trabajó para ti:',
      build_volcano: 'Volcán', build_garden: 'Jardín', build_forge: 'Forja', build_mine: 'Mina',
      build_desc_volcano: 'Funde oro de la lava cada hora.', build_desc_garden: 'Cultiva energía para tus dragones.', build_desc_forge: 'Forja mucho oro por hora.', build_desc_mine: 'Extrae gemas raras 💎.' },
    de: { farm_title: '🏝️ Inselfarm', collect_all: 'Alles einsammeln', farm_empty: 'Noch nichts zu holen', hour: 'Std', not_built: 'Nicht gebaut', production: 'Produktion', stored: 'Gespeichert', build: 'Bauen', built: '{name} gebaut!', collect: 'Einsammeln', welcome_back_title: '🏝️ Willkommen zurück!', welcome_back: 'Während du weg warst, hat deine Insel gearbeitet:',
      build_volcano: 'Vulkan', build_garden: 'Garten', build_forge: 'Schmiede', build_mine: 'Mine',
      build_desc_volcano: 'Schmilzt stündlich Gold aus Lava.', build_desc_garden: 'Züchtet Energie für deine Drachen.', build_desc_forge: 'Schmiedet viel Gold pro Stunde.', build_desc_mine: 'Baut seltene Edelsteine 💎 ab.' },
    fr: { farm_title: '🏝️ Ferme de l’île', collect_all: 'Tout récolter', farm_empty: 'Rien à récolter encore', hour: 'h', not_built: 'Non construit', production: 'Production', stored: 'Stocké', build: 'Construire', built: '{name} construit !', collect: 'Récolter', welcome_back_title: '🏝️ Bon retour !', welcome_back: 'Pendant ton absence, ton île a travaillé :',
      build_volcano: 'Volcan', build_garden: 'Jardin', build_forge: 'Forge', build_mine: 'Mine',
      build_desc_volcano: 'Fond de l’or à partir de lave chaque heure.', build_desc_garden: 'Cultive de l’énergie pour tes dragons.', build_desc_forge: 'Forge beaucoup d’or par heure.', build_desc_mine: 'Extrait des gemmes rares 💎.' },
    pt: { farm_title: '🏝️ Fazenda da ilha', collect_all: 'Coletar tudo', farm_empty: 'Nada para coletar ainda', hour: 'h', not_built: 'Não construído', production: 'Produção', stored: 'Armazenado', build: 'Construir', built: '{name} construído!', collect: 'Coletar', welcome_back_title: '🏝️ Bem-vindo de volta!', welcome_back: 'Enquanto esteve fora, sua ilha trabalhou:',
      build_volcano: 'Vulcão', build_garden: 'Jardim', build_forge: 'Forja', build_mine: 'Mina',
      build_desc_volcano: 'Funde ouro da lava a cada hora.', build_desc_garden: 'Cultiva energia para seus dragões.', build_desc_forge: 'Forja muito ouro por hora.', build_desc_mine: 'Minera gemas raras 💎.' }
  };
  Object.keys(FM).forEach(function (l) { Object.assign(STR[l], FM[l]); });
  // <<< AUTO-LANGS START (generated) >>>
  STR.it = {"lang_name":"Italiano","nav_map":"Mappa","nav_dragons":"Draghi","nav_shop":"Negozio","nav_pass":"Pass","nav_island":"Isola","play_level":"▶ Gioca livello {n}","incubator":"🥚 Incubatrice Draghi","t_daily":"Giornaliero","t_quests":"Missioni","t_leaderboard":"Classifica","t_ach":"Premi","t_options":"Opzioni","hatch":"Schiudi!","charge10":"Carica +10⚡","need_energy":"Energia insufficiente ⚡ (gioca livelli)","new_dragon":"🎉 Nuovo drago!","great":"Ottimo!","islands_title":"🗺️ Isole dei Draghi","locked_at":"🔒 livello {n}","level_n":"Livello {n}","goal":"🎯 {text}","goal_score":"Raggiungi {n} punti","goal_collect":"Raccogli {n} × {g}","goal_ice":"Rompi tutti i blocchi ({n})","goal_jelly":"Elimina tutta la gelatina ({n})","goal_boss":"Sconfiggi il boss","moves_reward":"Mosse: {m} · Premio: {gold}🪙 {energy}⚡","battle_team":"Squadra da battaglia","equip_empty":"Vuoto","equip_hint":"Tocca uno slot per cambiare drago","start":"▶ Inizia","obj_score":"Punti","obj_ice":"Blocchi","obj_jelly":"Gelatina","boss_attack":"💥 Il boss attacca! +{n} ghiaccio","shuffled":"🔀 Tabellone rimescolato!","dragon_active":"{e} {name} attivato!","isle_unlocked":"🏝 Nuova isola sbloccata: {name}!","daily_available":"🎁 Premio giornaliero disponibile!","victory":"🎉 Vittoria!","score":"Punti: {n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 Mappa","btn_retry":"🔁 Riprova","btn_next":"▶ Avanti","btn_island":"🏝 Isola","defeat":"Sconfitta","goal_not_met":"Obiettivo non raggiunto.","lives_left":"Vite rimaste: {hearts}","empty_suffix":" (vuoto)","ad_hint_moves":"Guarda un annuncio per +5 mosse!","ad_plus_moves":"📺 +5 mosse","b_hammer":"Martello","b_mix":"Mescola","b_moves":"Mosse","hammer_hint":"🔨 Tocca un cristallo per romperlo","hammer_cancel":"Martello annullato","no_booster":"Nessun potenziamento — compra nel negozio 🛒","wait":"Attendi…","plus5":"➕5 mosse!","collection_title":"🐲 Collezione Draghi","not_unlocked":"Bloccato","dc_level":"Livello {n}","rarity_common":"comune","rarity_rare":"raro","rarity_epic":"epico","upgrade_title":"⬆ Potenzia: {name}","cur_level":"Livello attuale","ability_power":"Potenza abilità","charges_faster":"Si carica più in fretta a ogni livello","close":"Chiudi","upgrade_btn":"Potenzia ({cost}{ic})","not_enough_gold":"Oro insufficiente 🪙","now_level":"{name} è ora al livello {n}!","shop_title":"🛒 Negozio","rewarded_ad":"Annuncio premio","ad_desc":"Guarda un annuncio → +6💎 e +30⚡","watch":"Guarda","gems_section":"💎 Gemme","best_price":"Miglior valore","gold_section":"🪙 Oro","gold_pack":"{gold} oro","for_gems":"per {gems}💎","boosters_section":"🧪 Potenziamenti","skins_section":"🎨 Skin per draghi","hammer_pack":"Martello ×3","mix_pack":"Mescola ×3","moves_pack":"Mosse ×3","hammer_pdesc":"Rompi qualsiasi cristallo","mix_pdesc":"Rimescola il tabellone","moves_pdesc":"+5 mosse in partita","you_have":"ne hai: {n}","bought":"Acquistato: {name}","not_enough_gems":"Gemme insufficienti 💎","skin_for":"Skin per {name}","wear":"Equipaggia","active":"✓ Attiva","get_dragon_first":"Ottieni prima il drago {name}","skin_unlocked":"Skin sbloccata!","purchase_ok":"Acquisto completato: +{n}💎","reward_got":"Premio: +6💎 +30⚡","gold_added":"+{n} oro!","pass_title":"🎖️ Battle Pass — Stagione 1","pass_level":"Livello {n} / {total}","xp_to_next":"{n} / 100 XP al livello","premium_buy":"👑 Premium 500💎","premium_on":"Pass Premium attivato! 👑","premium_badge":"👑 PREMIUM ATTIVO","got":"Ricevuto: {r}","daily_title":"🎁 Premio Giornaliero","day_n":"Giorno {n}","claim":"Riscuoti","already_claimed":"Già riscosso","daily_got":"Premio giornaliero riscosso!","quests_title":"📜 Missioni Giornaliere","quest_reward":"premio {n}🪙","ach_title":"🏆 Obiettivi","lb_title":"📊 Classifica","your_place":"Il tuo posto: <b>#{rank}</b> di {total} · ⭐ {stars}","you":"Tu","settings_title":"⚙️ Impostazioni","s_sound":"🔊 Suoni","s_music":"🎵 Musica","s_vibration":"📳 Vibrazione","s_language":"🌐 Lingua","on":"ON","off":"OFF","version":"Versione 1.0.0","reset":"🗑️ Azzera progressi","reset_q":"Azzerare i progressi?","reset_warn":"Tutti i progressi andranno persi per sempre.","yes_reset":"Sì, azzera","no":"No","reset_done":"Progressi azzerati","choose_lang":"🌐 Scegli la lingua","lives_title":"❤️ Vite","lives_count":"{n} / {max} vite","next_heart":"Prossimo ❤ tra {m}m {s}s","lives_refill_hint":"Ricarica guardando un annuncio o con 💎.","ad_plus_life":"📺 +1 ❤ (annuncio)","refill_gems":"💎 Ricarica (50)","life_added":"+1 ❤","lives_refilled":"Vite ricaricate!","tut1":"👆 Trascina un cristallo su uno vicino per abbinarne 3 uguali","tut2":"💎 Ottimo! Gli abbinamenti caricano i draghi — guarda le barre in basso.","tut3":"🐉 Quando la barra di un drago è piena, colpisce il tabellone da solo!","welcome_title":"🐉 Benvenuto!","welcome_body":"<p>Abbina 3+ cristalli per generare <b>energia</b>.</p><p>L'energia carica le <b>uova di drago</b> sulla tua isola.</p><p>I draghi aiutano in battaglia: bruciano righe, rompono il ghiaccio, colpiscono con i fulmini e fanno crescere i bonus!</p>","start_adventure":"Inizia l'avventura!","combo":"COMBO ×{n}!","quit_q":"Abbandonare il livello?","resume":"Riprendi","quit":"Esci","pause":"⏸ In pausa","to_map":"Esci alla mappa","ad_waiting":"Attendi...","level_intro_goal":"Obiettivo: {text}","sugar_bonus":"BONUS! +{n}","q_win3":"Vinci 3 livelli","q_crush200":"Distruggi 200 cristalli","q_combo4":"Fai una combo x4","q_dragon":"Attiva i draghi 8 volte","q_energy":"Raccogli 200 energia","q_special":"Crea 6 cristalli speciali","streak_bonus":"🔥 Serie ×{n}! +{r}","piggy_title":"🐷 Salvadanaio","piggy_info":"{n} / {cap} 🪙","piggy_crack":"Rompi (+{n}🪙)","piggy_not_full":"Non ancora pieno — continua a giocare!","piggy_cracked":"Salvadanaio rotto: +{n}🪙","chest_title":"🎁 Scrigno","chest_open":"Apri","chest_reward":"Scrigno: +{gold}🪙 +{gems}💎","t_modes":"Modalità","modes_title":"🎮 Modalità di gioco","mode_blitz":"Blitz","mode_endless":"Sopravvivenza","mode_daily":"Sfida Giornaliera","mode_blitz_desc":"60 secondi per il punteggio massimo. I draghi si caricano ×2!","mode_endless_desc":"Respingi il misuratore di minaccia con gli abbinamenti. Quanto resisti?","mode_daily_desc":"Un livello speciale al giorno per un grande premio.","mode_endless_danger":"Minaccia","best":"Record","new_best":"Nuovo record!","time_up":"⏱️ Tempo scaduto!","mode_over":"♾️ Partita finita","play":"Gioca","daily_done_today":"Già fatto oggi ✓","dragon_ready":"PRONTO","aim_row":"🐉 Tocca una riga per colpire","aim_cell":"🐉 Tocca una cella","s_autodragons":"🐉 Draghi automatici","tier":"Livello {n}","evolve":"Evolvi","evolve_need":"Richiede il livello {n}","evolved":"Drago evoluto!","s_perf":"⚡ Modalità prestazioni","event_live":"OGGI","ev_gold":"Corsa all'Oro","ev_gold_desc":"×2 oro dai livelli","ev_energy":"Ondata di Energia","ev_energy_desc":"×2 energia dai livelli","ev_dragon":"Furia dei Draghi","ev_dragon_desc":"I draghi si caricano +50%","s_colorblind":"♿ Daltonici","tip_boss":"👑 Boss! Infliggi danni con gli abbinamenti. Ogni 5 mosse contrattacca col ghiaccio.","tip_jelly":"🟪 Elimina tutta la gelatina — abbina sulle celle rosa.","tip_chain":"🔒 I cristalli incatenati non si muovono. Abbina vicino per liberarli.","tip_crate":"📦 Le casse richiedono 2 abbinamenti adiacenti per rompersi.","tip_dragon":"🐉 Drago pronto! Toccalo per usare la sua abilità.","s_install":"📲 Installa app","synergy":"SINERGIA","tip_synergy":"⚡ Due draghi pronti! Tocca SINERGIA per fonderli in un colpo definitivo.","synergy_charging":"Sinergia in carica…","fever":"FEVER","fever_on":"FEVER! Punteggio triplo — abbina veloce!","t_wheel":"Ruota","t_summon":"Evoca","t_skills":"Abilità","t_pvp":"Duello","t_story":"Storia","wheel_title":"🎡 Ruota della Fortuna","wheel_free":"Giro gratuito pronto!","wheel_cost":"Giro extra: {n}💎","wheel_spin_free":"🎡 Gira gratis","wheel_spin_gems":"🎡 Gira ({n}💎)","need_gems":"Gemme insufficienti 💎","summon_title":"Evoca Drago","summon_hint":"Evoca un tesoro dall'uovo antico","summon_do":"Evoca ({n}💎)","sr_common":"Comune","sr_rare":"Raro","sr_epic":"EPICO","skills_title":"Albero delle Abilità","skills_sub":"Bonus permanenti per gemme 💎","maxed":"MAX","sk_moves":"Agilità","sk_moves_d":"+1 mossa a inizio livello","sk_charge":"Furia dei Draghi","sk_charge_d":"+8% velocità di carica draghi","sk_score":"Saggezza","sk_score_d":"+6% punteggio","sk_power":"Forza","sk_power_d":"+1 potenza abilità drago","sk_gold":"Fortuna","sk_gold_d":"+8% oro dai livelli","sk_start":"Preveggenza","sk_start_d":"+1 cristallo speciale all'inizio","pvp_title":"Duelli tra Draghi","pvp_trophies":"{n} trofei","pvp_record":"{w}V / {l}S","pvp_sub":"Scegli un rivale e supera il suo punteggio in 45s!","pvp_easy":"Facile","pvp_even":"Pari","pvp_hard":"Difficile","pvp_target":"obiettivo {n}","pvp_fight":"Combatti ⚔️","pvp_win":"Vittoria!","pvp_lose":"Sconfitta","pvp_again":"Combatti ancora","chapter_n":"Capitolo {n}","story_locked":"Si sblocca al livello {n}","ch1_t":"Il Risveglio","ch1":"Tra le ceneri di un vulcano spento trovi un uovo caldo. Una scintilla rompe il guscio: nasce il tuo primo drago.","ch2_t":"Le Isole di Brace","ch2":"La lava scorre in fiumi e i draghi di fuoco volteggiano in alto. Qui impari a domare la fiamma e ad accendere i cristalli.","ch3_t":"Il Trono Ghiacciato","ch3":"Un vento pungente imprigiona le isole nel ghiaccio. Il drago del gelo ti giudica degno e si unisce al tuo stormo.","ch4_t":"La Tempesta si Desta","ch4":"Il tuono squarcia il cielo. Il drago della tempesta mette alla prova la tua abilità con fulmini che colpiscono l'intero tabellone.","ch5_t":"Il Sussurro della Foresta","ch5":"Alberi antichi nascondono un drago di smeraldo. La natura ti dona il potere della crescita e dell'abbondanza.","ch6_t":"Le Alture dell'Etere","ch6":"Tra le stelle vola il drago dell'etere, il più misterioso di tutti. La realtà si piega sotto le sue ali.","ch7_t":"Signore dei Draghi","ch7":"Ogni elemento si è inchinato a te. Non più un viaggiatore: sei una leggenda il cui nome i draghi sussurrano nei secoli.","hard_level":"Livello difficile","double_reward":"Premio doppio","ad_label":"Annuncio","ad_skip":"Salta","so_close":"Per un pelo!","short_by":"Ti mancano {n}","perfect":"PERFETTO!","first_clear":"Primo completamento!","boss":"Boss","stats_title":"Statistiche","credits":"Fatto con ❤","st_progress":"Progressi","st_stars":"Stelle ottenute","st_levels_won":"Livelli vinti","st_max_combo":"Combo massima","st_crushed":"Cristalli distrutti","st_specials":"Speciali creati","st_dragons":"Draghi","st_procs":"Abilità dei draghi","st_energy":"Energia raccolta","st_streak":"Serie migliore","st_blitz":"Record Blitz","st_endless":"Record Infinito","st_trials":"Profondità Prove","st_pvp":"Duelli","egg_ready":"Pronto per la schiusa!","egg_remaining":"{n} ⚡ alla schiusa","mode_trials":"Prove","mode_trials_desc":"Corsa roguelite: scegli una reliquia tra i livelli. Quanto arrivi in fondo?","depth":"Profondità {n}","choose_relic":"Scegli una reliquia","run_over":"🐉 Corsa finita","revived":"Lo scudo ha salvato la tua corsa!","relic_moves":"Pergamena delle Mosse","relic_moves_d":"+3 mosse a ogni livello","relic_charge":"Cristallo di Carica","relic_charge_d":"I draghi si caricano più in fretta","relic_score":"Amuleto del Punteggio","relic_score_d":"+15% punteggio","relic_specials":"Seme del Potere","relic_specials_d":"Inizia con un cristallo speciale","relic_power":"Zanna di Drago","relic_power_d":"+1 potenza abilità drago","relic_shield":"Scudo della Fenice","relic_shield_d":"Sopravvivi a una sconfitta","merge_toast":"Fusione! Cristallo più forte","tip_merge":"🔮 Scambia due cristalli speciali uguali per fonderli in uno più forte!","story_title":"Leggenda delle Isole","story_intro":"<p>Un tempo le Isole dei Draghi brillavano di magia cristallina. Ma i <b>Cinque Signori dell'Ombra</b> spezzarono l'armonia e sigillarono i draghi nelle uova.</p><p>Sei l'ultimo <b>Custode</b>. Abbina i cristalli, risveglia i draghi e riporta la luce sulle isole!</p>","dragon_q_flare":"Finalmente libero! Mostriamo loro il vero fuoco!","dragon_q_frost":"Calma… e gelo. Congelerò ogni minaccia.","dragon_q_storm":"Lo senti nell'aria? La tempesta è dalla nostra parte!","dragon_q_verdant":"La vita ritorna. Insieme faremo crescere nuova speranza.","dragon_q_aether":"Le stelle sussurrano vittoria. Guidaci, Custode.","boss_l_boss_ash":"Queste isole sono cenere sotto il mio tallone. Fuggi finché puoi!","boss_l_boss_titan":"Il freddo dell'eternità ti inghiottirà. Nessun drago può salvarti.","boss_l_boss_storm":"Io sono la tempesta stessa! I tuoi cristalli saranno polvere.","boss_l_boss_beast":"Il boschetto fiuta un estraneo. Non ne uscirai vivo.","boss_l_boss_phoenix":"Dalla cenere sono risorto mille volte. Tu cadi una volta sola.","farm_title":"🏝️ Fattoria dell'Isola","collect_all":"Raccogli tutto","farm_empty":"Niente da raccogliere per ora","hour":"h","not_built":"Non costruito","production":"Produzione","stored":"In deposito","build":"Costruisci","built":"{name} costruito!","collect":"Raccogli","welcome_back_title":"🏝️ Bentornato!","welcome_back":"Mentre eri via, la tua isola ha lavorato per te:","build_volcano":"Vulcano","build_garden":"Giardino","build_forge":"Fucina","build_mine":"Miniera","build_desc_volcano":"Fonde oro dalla lava ogni ora.","build_desc_garden":"Coltiva energia per i tuoi draghi.","build_desc_forge":"Forgia molto oro ogni ora.","build_desc_mine":"Estrae gemme rare 💎."};
  STR.pl = {"lang_name":"Polski","nav_map":"Mapa","nav_dragons":"Smoki","nav_shop":"Sklep","nav_pass":"Karnet","nav_island":"Wyspa","play_level":"▶ Zagraj poziom {n}","incubator":"🥚 Inkubator smoków","t_daily":"Codzienne","t_quests":"Zadania","t_leaderboard":"Rankingi","t_ach":"Nagrody","t_options":"Opcje","hatch":"Wykluj!","charge10":"Naładuj +10⚡","need_energy":"Za mało energii ⚡ (graj poziomy)","new_dragon":"🎉 Nowy smok!","great":"Świetnie!","islands_title":"🗺️ Smocze wyspy","locked_at":"🔒 poziom {n}","level_n":"Poziom {n}","goal":"🎯 {text}","goal_score":"Zdobądź {n} pkt","goal_collect":"Zbierz {n} × {g}","goal_ice":"Rozbij wszystkie bloki ({n})","goal_jelly":"Usuń całą galaretkę ({n})","goal_boss":"Pokonaj bossa","moves_reward":"Ruchy: {m} · Nagroda: {gold}🪙 {energy}⚡","battle_team":"Smocza drużyna bojowa","equip_empty":"Puste","equip_hint":"Dotknij slotu, by zmienić smoka","start":"▶ Start","obj_score":"Wynik","obj_ice":"Bloki","obj_jelly":"Galaretka","boss_attack":"💥 Boss atakuje! +{n} lodu","shuffled":"🔀 Plansza przetasowana!","dragon_active":"{e} {name} aktywowany!","isle_unlocked":"🏝 Nowa wyspa: {name}!","daily_available":"🎁 Codzienna nagroda gotowa!","victory":"🎉 Zwycięstwo!","score":"Wynik: {n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 Mapa","btn_retry":"🔁 Ponów","btn_next":"▶ Dalej","btn_island":"🏝 Wyspa","defeat":"Porażka","goal_not_met":"Cel nieosiągnięty.","lives_left":"Pozostałe życia: {hearts}","empty_suffix":" (puste)","ad_hint_moves":"Obejrzyj reklamę i zdobądź +5 ruchów!","ad_plus_moves":"📺 +5 ruchów","b_hammer":"Młot","b_mix":"Miks","b_moves":"Ruchy","hammer_hint":"🔨 Dotknij kryształ, by go rozbić","hammer_cancel":"Młot anulowany","no_booster":"Brak dopalacza — kup w sklepie 🛒","wait":"Proszę czekać…","plus5":"➕5 ruchów!","collection_title":"🐲 Kolekcja smoków","not_unlocked":"Zablokowane","dc_level":"Poziom {n}","rarity_common":"zwykły","rarity_rare":"rzadki","rarity_epic":"epicki","upgrade_title":"⬆ Ulepszenie: {name}","cur_level":"Obecny poziom","ability_power":"Moc zdolności","charges_faster":"Ładuje się szybciej z każdym poziomem","close":"Zamknij","upgrade_btn":"Ulepsz ({cost}{ic})","not_enough_gold":"Za mało złota 🪙","now_level":"{name} ma teraz poziom {n}!","shop_title":"🛒 Sklep","rewarded_ad":"Reklama z nagrodą","ad_desc":"Obejrzyj reklamę → +6💎 i +30⚡","watch":"Oglądaj","gems_section":"💎 Klejnoty","best_price":"Najlepsza oferta","gold_section":"🪙 Złoto","gold_pack":"{gold} złota","for_gems":"za {gems}💎","boosters_section":"🧪 Dopalacze","skins_section":"🎨 Skórki smoków","hammer_pack":"Młot ×3","mix_pack":"Miks ×3","moves_pack":"Ruchy ×3","hammer_pdesc":"Rozbij dowolny kryształ","mix_pdesc":"Przetasuj planszę","moves_pdesc":"+5 ruchów w grze","you_have":"masz: {n}","bought":"Kupiono: {name}","not_enough_gems":"Za mało klejnotów 💎","skin_for":"Skórka dla {name}","wear":"Załóż","active":"✓ Aktywna","get_dragon_first":"Zdobądź najpierw smoka {name}","skin_unlocked":"Skórka odblokowana!","purchase_ok":"Zakup gotowy: +{n}💎","reward_got":"Nagroda: +6💎 +30⚡","gold_added":"+{n} złota!","pass_title":"🎖️ Karnet bojowy — Sezon 1","pass_level":"Poziom {n} / {total}","xp_to_next":"{n} / 100 XP do następnego","premium_buy":"👑 Premium 500💎","premium_on":"Karnet premium aktywny! 👑","premium_badge":"👑 PREMIUM AKTYWNY","got":"Otrzymano: {r}","daily_title":"🎁 Codzienna nagroda","day_n":"Dzień {n}","claim":"Odbierz","already_claimed":"Już odebrano","daily_got":"Codzienna nagroda odebrana!","quests_title":"📜 Codzienne zadania","quest_reward":"nagroda {n}🪙","ach_title":"🏆 Osiągnięcia","lb_title":"📊 Ranking","your_place":"Twoje miejsce: <b>#{rank}</b> z {total} · ⭐ {stars}","you":"Ty","settings_title":"⚙️ Ustawienia","s_sound":"🔊 Dźwięk","s_music":"🎵 Muzyka","s_vibration":"📳 Wibracje","s_language":"🌐 Język","on":"WŁ","off":"WYŁ","version":"Wersja 1.0.0","reset":"🗑️ Zresetuj postęp","reset_q":"Zresetować postęp?","reset_warn":"Cały postęp zostanie utracony na zawsze.","yes_reset":"Tak, resetuj","no":"Nie","reset_done":"Postęp zresetowany","choose_lang":"🌐 Wybierz język","lives_title":"❤️ Życia","lives_count":"{n} / {max} żyć","next_heart":"Następne ❤ za {m}m {s}s","lives_refill_hint":"Uzupełnij, oglądając reklamę lub za 💎.","ad_plus_life":"📺 +1 ❤ (reklama)","refill_gems":"💎 Uzupełnij (50)","life_added":"+1 ❤","lives_refilled":"Życia uzupełnione!","tut1":"👆 Przesuń kryształ na sąsiada, by dopasować 3 takie same","tut2":"💎 Świetnie! Dopasowania ładują smoki — patrz na paski poniżej.","tut3":"🐉 Gdy pasek smoka jest pełny, sam uderza w planszę!","welcome_title":"🐉 Witaj!","welcome_body":"<p>Dopasuj 3+ kryształy, by wytworzyć <b>energię</b>.</p><p>Energia ładuje <b>smocze jaja</b> na twojej wyspie.</p><p>Smoki pomagają w walce: wypalają rzędy, rozbijają lód, rażą piorunem i dają bonusy!</p>","start_adventure":"Zacznij przygodę!","combo":"COMBO ×{n}!","quit_q":"Opuścić poziom?","resume":"Wznów","quit":"Wyjdź","pause":"⏸ Pauza","to_map":"Wyjdź do mapy","ad_waiting":"Proszę czekać...","level_intro_goal":"Cel: {text}","sugar_bonus":"BONUS! +{n}","q_win3":"Wygraj 3 poziomy","q_crush200":"Rozbij 200 kryształów","q_combo4":"Zrób combo x4","q_dragon":"Wywołaj smoki 8 razy","q_energy":"Zbierz 200 energii","q_special":"Stwórz 6 specjalnych kryształów","streak_bonus":"🔥 Seria ×{n}! +{r}","piggy_title":"🐷 Skarbonka","piggy_info":"{n} / {cap} 🪙","piggy_crack":"Rozbij (+{n}🪙)","piggy_not_full":"Jeszcze niepełna — graj dalej!","piggy_cracked":"Skarbonka rozbita: +{n}🪙","chest_title":"🎁 Skrzynia","chest_open":"Otwórz","chest_reward":"Skrzynia: +{gold}🪙 +{gems}💎","t_modes":"Tryby","modes_title":"🎮 Tryby gry","mode_blitz":"Blitz","mode_endless":"Przetrwanie","mode_daily":"Codzienne wyzwanie","mode_blitz_desc":"60 sekund na max wynik. Smoki ładują się ×2!","mode_endless_desc":"Odpieraj miernik zagrożenia dopasowaniami. Jak długo wytrzymasz?","mode_daily_desc":"Specjalny poziom raz dziennie za dużą nagrodę.","mode_endless_danger":"Zagrożenie","best":"Rekord","new_best":"Nowy rekord!","time_up":"⏱️ Czas minął!","mode_over":"♾️ Koniec gry","play":"Graj","daily_done_today":"Już ukończone dziś ✓","dragon_ready":"GOTOWY","aim_row":"🐉 Dotknij rzędu, by uderzyć","aim_cell":"🐉 Dotknij pola","s_autodragons":"🐉 Auto smoki","tier":"Poziom {n}","evolve":"Ewoluuj","evolve_need":"Wymaga poziomu {n}","evolved":"Smok wyewoluował!","s_perf":"⚡ Tryb wydajności","event_live":"DZISIAJ","ev_gold":"Gorączka złota","ev_gold_desc":"×2 złota z poziomów","ev_energy":"Przypływ energii","ev_energy_desc":"×2 energii z poziomów","ev_dragon":"Smocza furia","ev_dragon_desc":"Smoki ładują się +50%","s_colorblind":"♿ Dla daltonistów","tip_boss":"👑 Boss! Zadawaj obrażenia dopasowaniami. Co 5 ruchów kontratakuje lodem.","tip_jelly":"🟪 Usuń całą galaretkę — dopasuj na różowych polach.","tip_chain":"🔒 Skute kryształy nie mogą się ruszać. Dopasuj obok, by je uwolnić.","tip_crate":"📦 Skrzynie wymagają 2 dopasowań obok, by pęknąć.","tip_dragon":"🐉 Smok gotowy! Dotknij go, by użyć zdolności.","s_install":"📲 Zainstaluj aplikację","synergy":"SYNERGIA","tip_synergy":"⚡ Dwa smoki gotowe! Dotknij SYNERGIA, by połączyć je w ultimate.","synergy_charging":"Ładowanie synergii…","fever":"FEVER","fever_on":"FEVER! Potrójny wynik — dopasowuj szybko!","t_wheel":"Koło","t_summon":"Przyzwanie","t_skills":"Umiejętności","t_pvp":"Pojedynek","t_story":"Fabuła","wheel_title":"🎡 Koło fortuny","wheel_free":"Darmowy los gotowy!","wheel_cost":"Dodatkowy los: {n}💎","wheel_spin_free":"🎡 Zakręć za darmo","wheel_spin_gems":"🎡 Zakręć ({n}💎)","need_gems":"Za mało klejnotów 💎","summon_title":"Przyzwanie smoka","summon_hint":"Przyzwij skarb ze starożytnego jaja","summon_do":"Przyzwij ({n}💎)","sr_common":"Zwykły","sr_rare":"Rzadki","sr_epic":"EPICKI","skills_title":"Drzewko umiejętności","skills_sub":"Stałe bonusy za klejnoty 💎","maxed":"MAX","sk_moves":"Zwinność","sk_moves_d":"+1 ruch na starcie poziomu","sk_charge":"Smocza furia","sk_charge_d":"+8% szybkości ładowania smoków","sk_score":"Mądrość","sk_score_d":"+6% wyniku","sk_power":"Potęga","sk_power_d":"+1 mocy zdolności smoka","sk_gold":"Fortuna","sk_gold_d":"+8% złota z poziomu","sk_start":"Przewidywanie","sk_start_d":"+1 specjalny kryształ na starcie","pvp_title":"Smocze pojedynki","pvp_trophies":"{n} trofeów","pvp_record":"{w}Z / {l}P","pvp_sub":"Wybierz rywala i pobij jego wynik w 45s!","pvp_easy":"Łatwy","pvp_even":"Równy","pvp_hard":"Trudny","pvp_target":"cel {n}","pvp_fight":"Walcz ⚔️","pvp_win":"Zwycięstwo!","pvp_lose":"Porażka","pvp_again":"Walcz ponownie","chapter_n":"Rozdział {n}","story_locked":"Odblokowanie na poziomie {n}","ch1_t":"Przebudzenie","ch1":"Wśród popiołów wygasłego wulkanu znajdujesz ciepłe jajo. Iskra przebija skorupę — rodzi się twój pierwszy smok.","ch2_t":"Wyspy Żaru","ch2":"Lawa płynie rzekami, a ogniste smoki krążą w górze. Tu uczysz się ujarzmiać płomień i zapalać kryształy.","ch3_t":"Zamarznięty Tron","ch3":"Tnący wiatr skuwa wyspy lodem. Lodowy smok uznaje cię za godnego i dołącza do twojej stada.","ch4_t":"Burza się budzi","ch4":"Grzmot rozdziera niebo. Burzowy smok sprawdza twe umiejętności piorunami rażącymi całą planszę.","ch5_t":"Szept Lasu","ch5":"Prastare drzewa skrywają szmaragdowego smoka. Natura obdarza cię mocą wzrostu i obfitości.","ch6_t":"Wyżyny Eteru","ch6":"Wśród gwiazd szybuje smok eteru, najbardziej tajemniczy ze wszystkich. Rzeczywistość ugina się pod jego skrzydłami.","ch7_t":"Władca Smoków","ch7":"Każdy żywioł ci się pokłonił. Nie jesteś już wędrowcem — jesteś legendą, której imię smoki szepczą przez wieki.","hard_level":"Trudny poziom","double_reward":"Podwójna nagroda","ad_label":"Reklama","ad_skip":"Pomiń","so_close":"Tak blisko!","short_by":"Brakło {n}","perfect":"PERFEKCYJNIE!","first_clear":"Pierwsze przejście!","boss":"Boss","stats_title":"Statystyki","credits":"Zrobione z ❤","st_progress":"Postęp","st_stars":"Zdobyte gwiazdki","st_levels_won":"Wygrane poziomy","st_max_combo":"Maks. combo","st_crushed":"Rozbite kryształy","st_specials":"Stworzone specjalne","st_dragons":"Smoki","st_procs":"Zdolności smoków","st_energy":"Zebrana energia","st_streak":"Najlepsza seria","st_blitz":"Rekord Blitz","st_endless":"Rekord przetrwania","st_trials":"Głębia prób","st_pvp":"Pojedynki","egg_ready":"Gotowe do wyklucia!","egg_remaining":"{n} ⚡ do wyklucia","mode_trials":"Próby","mode_trials_desc":"Bieg roguelite: wybierz relikt między poziomami. Jak głęboko dotrzesz?","depth":"Głębia {n}","choose_relic":"Wybierz relikt","run_over":"🐉 Koniec biegu","revived":"Tarcza ocaliła twój bieg!","relic_moves":"Zwój Ruchów","relic_moves_d":"+3 ruchy na każdym poziomie","relic_charge":"Kryształ Ładowania","relic_charge_d":"Smoki ładują się szybciej","relic_score":"Amulet Wyniku","relic_score_d":"+15% wyniku","relic_specials":"Nasiono Mocy","relic_specials_d":"Zacznij ze specjalnym kryształem","relic_power":"Smoczy Kieł","relic_power_d":"+1 mocy zdolności smoka","relic_shield":"Tarcza Feniksa","relic_shield_d":"Przetrwaj jedną porażkę","merge_toast":"Łącz! Silniejszy kryształ","tip_merge":"🔮 Zamień dwa pasujące specjalne kryształy, by połączyć je w silniejszy!","story_title":"Legenda Wysp","story_intro":"<p>Niegdyś Smocze Wyspy lśniły magią kryształów. Lecz <b>Pięciu Władców Cienia</b> zburzyło harmonię i uwięziło smoki w jajach.</p><p>Jesteś ostatnim <b>Strażnikiem</b>. Dopasowuj kryształy, budź smoki i przywróć światło wyspom!</p>","dragon_q_flare":"Nareszcie wolny! Pokażmy im prawdziwy ogień!","dragon_q_frost":"Spokój… i chłód. Zamrożę każde zagrożenie.","dragon_q_storm":"Czujesz to w powietrzu? Burza jest po naszej stronie!","dragon_q_verdant":"Życie powraca. Razem wzniecimy nową nadzieję.","dragon_q_aether":"Gwiazdy szepczą o zwycięstwie. Prowadź, Strażniku.","boss_l_boss_ash":"Te wyspy to popiół pod moją stopą. Uciekaj, póki możesz!","boss_l_boss_titan":"Chłód wieczności cię pochłonie. Żaden smok cię nie ocali.","boss_l_boss_storm":"Jestem samą burzą! Twoje kryształy obrócą się w pył.","boss_l_boss_beast":"Gąszcz zwietrzył obcego. Nie wyjdziesz stąd żywy.","boss_l_boss_phoenix":"Z popiołów powstawałem tysiąc razy. Ty upadniesz tylko raz.","farm_title":"🏝️ Farma na wyspie","collect_all":"Zbierz wszystko","farm_empty":"Nic jeszcze do zebrania","hour":"godz","not_built":"Nie zbudowano","production":"Produkcja","stored":"Zmagazynowano","build":"Zbuduj","built":"{name} zbudowano!","collect":"Zbierz","welcome_back_title":"🏝️ Witaj z powrotem!","welcome_back":"Gdy cię nie było, twoja wyspa pracowała dla ciebie:","build_volcano":"Wulkan","build_garden":"Ogród","build_forge":"Kuźnia","build_mine":"Kopalnia","build_desc_volcano":"Wytapia złoto z lawy co godzinę.","build_desc_garden":"Hoduje energię dla twoich smoków.","build_desc_forge":"Kuje mnóstwo złota na godzinę.","build_desc_mine":"Wydobywa rzadkie klejnoty 💎."};
  STR.tr = {"lang_name":"Türkçe","nav_map":"Harita","nav_dragons":"Ejderhalar","nav_shop":"Mağaza","nav_pass":"Pass","nav_island":"Ada","play_level":"▶ Seviye {n} oyna","incubator":"🥚 Ejderha Kuluçkası","t_daily":"Günlük","t_quests":"Görevler","t_leaderboard":"Sıralama","t_ach":"Ödüller","t_options":"Seçenekler","hatch":"Çıkart!","charge10":"Şarj +10⚡","need_energy":"Yeterli enerji yok ⚡ (seviye oyna)","new_dragon":"🎉 Yeni ejderha!","great":"Harika!","islands_title":"🗺️ Ejderha Adaları","locked_at":"🔒 seviye {n}","level_n":"Seviye {n}","goal":"🎯 {text}","goal_score":"{n} puana ulaş","goal_collect":"{n} × {g} topla","goal_ice":"Tüm blokları kır ({n})","goal_jelly":"Tüm jöleleri temizle ({n})","goal_boss":"Bossu yen","moves_reward":"Hamle: {m} · Ödül: {gold}🪙 {energy}⚡","battle_team":"Ejderha savaş takımı","equip_empty":"Boş","equip_hint":"Ejderhayı değiştirmek için yuvaya dokun","start":"▶ Başla","obj_score":"Skor","obj_ice":"Bloklar","obj_jelly":"Jöle","boss_attack":"💥 Boss saldırıyor! +{n} buz","shuffled":"🔀 Tahta karıştırıldı!","dragon_active":"{e} {name} etkin!","isle_unlocked":"🏝 Yeni ada açıldı: {name}!","daily_available":"🎁 Günlük ödül hazır!","victory":"🎉 Zafer!","score":"Skor: {n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 Harita","btn_retry":"🔁 Tekrar","btn_next":"▶ İleri","btn_island":"🏝 Ada","defeat":"Yenilgi","goal_not_met":"Hedefe ulaşılamadı.","lives_left":"Kalan can: {hearts}","empty_suffix":" (boş)","ad_hint_moves":"Reklam izle, +5 hamle kazan!","ad_plus_moves":"📺 +5 hamle","b_hammer":"Çekiç","b_mix":"Karıştır","b_moves":"Hamle","hammer_hint":"🔨 Kırmak için bir kristale dokun","hammer_cancel":"Çekiç iptal edildi","no_booster":"Güçlendirici yok — mağazadan al 🛒","wait":"Lütfen bekle…","plus5":"➕5 hamle!","collection_title":"🐲 Ejderha Koleksiyonu","not_unlocked":"Kilitli","dc_level":"Seviye {n}","rarity_common":"yaygın","rarity_rare":"nadir","rarity_epic":"efsanevi","upgrade_title":"⬆ Yükselt: {name}","cur_level":"Mevcut seviye","ability_power":"Yetenek gücü","charges_faster":"Her seviyede daha hızlı şarj olur","close":"Kapat","upgrade_btn":"Yükselt ({cost}{ic})","not_enough_gold":"Yeterli altın yok 🪙","now_level":"{name} artık seviye {n}!","shop_title":"🛒 Mağaza","rewarded_ad":"Ödüllü reklam","ad_desc":"Reklam izle → +6💎 ve +30⚡","watch":"İzle","gems_section":"💎 Mücevher","best_price":"En iyi değer","gold_section":"🪙 Altın","gold_pack":"{gold} altın","for_gems":"{gems}💎 karşılığı","boosters_section":"🧪 Güçlendiriciler","skins_section":"🎨 Ejderha kostümleri","hammer_pack":"Çekiç ×3","mix_pack":"Karıştır ×3","moves_pack":"Hamle ×3","hammer_pdesc":"Herhangi bir kristali kır","mix_pdesc":"Tahtayı karıştır","moves_pdesc":"Oyunda +5 hamle","you_have":"sende: {n}","bought":"Alındı: {name}","not_enough_gems":"Yeterli mücevher yok 💎","skin_for":"{name} için kostüm","wear":"Kuşan","active":"✓ Etkin","get_dragon_first":"Önce {name} ejderhasını al","skin_unlocked":"Kostüm açıldı!","purchase_ok":"Satın alma tamam: +{n}💎","reward_got":"Ödül: +6💎 +30⚡","gold_added":"+{n} altın!","pass_title":"🎖️ Battle Pass — Sezon 1","pass_level":"Kademe {n} / {total}","xp_to_next":"Sonraki kademeye {n} / 100 XP","premium_buy":"👑 Premium 500💎","premium_on":"Premium pass etkinleştirildi! 👑","premium_badge":"👑 PREMIUM ETKİN","got":"Alındı: {r}","daily_title":"🎁 Günlük Ödül","day_n":"Gün {n}","claim":"Al","already_claimed":"Zaten alındı","daily_got":"Günlük ödül alındı!","quests_title":"📜 Günlük Görevler","quest_reward":"ödül {n}🪙","ach_title":"🏆 Başarımlar","lb_title":"📊 Sıralama","your_place":"Sıralaman: <b>#{rank}</b> / {total} · ⭐ {stars}","you":"Sen","settings_title":"⚙️ Ayarlar","s_sound":"🔊 Ses","s_music":"🎵 Müzik","s_vibration":"📳 Titreşim","s_language":"🌐 Dil","on":"AÇIK","off":"KAPALI","version":"Sürüm 1.0.0","reset":"🗑️ İlerlemeyi sıfırla","reset_q":"İlerleme sıfırlansın mı?","reset_warn":"Tüm ilerleme kalıcı olarak kaybolacak.","yes_reset":"Evet, sıfırla","no":"Hayır","reset_done":"İlerleme sıfırlandı","choose_lang":"🌐 Dil seç","lives_title":"❤️ Canlar","lives_count":"{n} / {max} can","next_heart":"Sonraki ❤ {m}dk {s}sn içinde","lives_refill_hint":"Reklam izleyerek ya da 💎 ile doldur.","ad_plus_life":"📺 +1 ❤ (reklam)","refill_gems":"💎 Doldur (50)","life_added":"+1 ❤","lives_refilled":"Canlar dolduruldu!","tut1":"👆 3 aynısını eşleştirmek için bir kristali komşusuna kaydır","tut2":"💎 Harika! Eşleşmeler ejderhalarını şarj eder — aşağıdaki barlara bak.","tut3":"🐉 Ejderha barı dolunca tahtaya kendisi vurur!","welcome_title":"🐉 Hoş geldin!","welcome_body":"<p>3+ kristali eşleştirerek <b>enerji</b> üret.</p><p>Enerji, adandaki <b>ejderha yumurtalarını</b> şarj eder.</p><p>Ejderhalar savaşta yardım eder: satır yakar, buz kırar, şimşekle vurur ve bonusları büyütür!</p>","start_adventure":"Maceraya başla!","combo":"KOMBO ×{n}!","quit_q":"Seviyeden çıkılsın mı?","resume":"Devam et","quit":"Çık","pause":"⏸ Duraklatıldı","to_map":"Haritaya çık","ad_waiting":"Lütfen bekle...","level_intro_goal":"Hedef: {text}","sugar_bonus":"BONUS! +{n}","q_win3":"3 seviye kazan","q_crush200":"200 kristal kır","q_combo4":"x4 kombo yap","q_dragon":"Ejderhaları 8 kez tetikle","q_energy":"200 enerji topla","q_special":"6 özel kristal oluştur","streak_bonus":"🔥 Seri ×{n}! +{r}","piggy_title":"🐷 Kumbara","piggy_info":"{n} / {cap} 🪙","piggy_crack":"Kır (+{n}🪙)","piggy_not_full":"Henüz dolmadı — oynamaya devam et!","piggy_cracked":"Kumbara kırıldı: +{n}🪙","chest_title":"🎁 Sandık","chest_open":"Aç","chest_reward":"Sandık: +{gold}🪙 +{gems}💎","t_modes":"Modlar","modes_title":"🎮 Oyun Modları","mode_blitz":"Blitz","mode_endless":"Hayatta Kalma","mode_daily":"Günlük Meydan Okuma","mode_blitz_desc":"En yüksek skor için 60 saniye. Ejderhalar ×2 şarj olur!","mode_endless_desc":"Eşleşmelerle tehdit göstergesini geri püskürt. Ne kadar dayanabilirsin?","mode_daily_desc":"Günde bir kez, büyük ödüllü özel seviye.","mode_endless_danger":"Tehdit","best":"En iyi","new_best":"Yeni rekor!","time_up":"⏱️ Süre doldu!","mode_over":"♾️ Oyun bitti","play":"Oyna","daily_done_today":"Bugün tamamlandı ✓","dragon_ready":"HAZIR","aim_row":"🐉 Vurmak için bir satıra dokun","aim_cell":"🐉 Bir hücreye dokun","s_autodragons":"🐉 Otomatik ejderhalar","tier":"Kademe {n}","evolve":"Evrimleştir","evolve_need":"Seviye {n} gerekir","evolved":"Ejderha evrimleşti!","s_perf":"⚡ Performans modu","event_live":"BUGÜN","ev_gold":"Altın Hücumu","ev_gold_desc":"Seviyelerden ×2 altın","ev_energy":"Enerji Patlaması","ev_energy_desc":"Seviyelerden ×2 enerji","ev_dragon":"Ejderha Öfkesi","ev_dragon_desc":"Ejderhalar +%50 şarj olur","s_colorblind":"♿ Renk körü","tip_boss":"👑 Boss! Eşleşmelerle hasar ver. Her 5 hamlede buzla karşılık verir.","tip_jelly":"🟪 Tüm jöleleri temizle — pembe hücrelerde eşleştir.","tip_chain":"🔒 Zincirli kristaller hareket edemez. Serbest bırakmak için yanlarında eşleştir.","tip_crate":"📦 Sandıkların kırılması için 2 komşu eşleşme gerekir.","tip_dragon":"🐉 Ejderha hazır! Yeteneğini kullanmak için dokun.","s_install":"📲 Uygulamayı yükle","synergy":"SİNERJİ","tip_synergy":"⚡ İki ejderha hazır! Onları tek bir ultimatide birleştirmek için SİNERJİ'ye dokun.","synergy_charging":"Sinerji şarj oluyor…","fever":"ATEŞ","fever_on":"ATEŞ! Üçlü skor — hızlı eşleştir!","t_wheel":"Çark","t_summon":"Çağır","t_skills":"Yetenekler","t_pvp":"Düello","t_story":"Hikaye","wheel_title":"🎡 Şans Çarkı","wheel_free":"Ücretsiz çevirme hazır!","wheel_cost":"Ekstra çevirme: {n}💎","wheel_spin_free":"🎡 Ücretsiz çevir","wheel_spin_gems":"🎡 Çevir ({n}💎)","need_gems":"Yeterli mücevher yok 💎","summon_title":"Ejderha Çağırma","summon_hint":"Antik yumurtadan bir hazine çağır","summon_do":"Çağır ({n}💎)","sr_common":"Yaygın","sr_rare":"Nadir","sr_epic":"EFSANEVİ","skills_title":"Yetenek Ağacı","skills_sub":"Mücevherle kalıcı bonuslar 💎","maxed":"MAKS","sk_moves":"Çeviklik","sk_moves_d":"Seviye başında +1 hamle","sk_charge":"Ejderha Öfkesi","sk_charge_d":"+%8 ejderha şarj hızı","sk_score":"Bilgelik","sk_score_d":"+%6 skor","sk_power":"Kudret","sk_power_d":"+1 ejderha yetenek gücü","sk_gold":"Talih","sk_gold_d":"+%8 seviye altını","sk_start":"Öngörü","sk_start_d":"Başlangıçta +1 özel kristal","pvp_title":"Ejderha Düelloları","pvp_trophies":"{n} kupa","pvp_record":"{w}G / {l}M","pvp_sub":"Bir rakip seç ve 45sn içinde skorunu geç!","pvp_easy":"Kolay","pvp_even":"Eşit","pvp_hard":"Zor","pvp_target":"hedef {n}","pvp_fight":"Savaş ⚔️","pvp_win":"Zafer!","pvp_lose":"Yenilgi","pvp_again":"Tekrar savaş","chapter_n":"Bölüm {n}","story_locked":"Seviye {n}'de açılır","ch1_t":"Uyanış","ch1":"Sönmüş bir yanardağın külleri arasında sıcak bir yumurta bulursun. Kabuğu bir kıvılcım deler — ilk ejderhan doğar.","ch2_t":"Köz Adaları","ch2":"Lav nehirler halinde akar ve ateş ejderhaları tepende süzülür. Burada alevi ehlileştirmeyi ve kristalleri tutuşturmayı öğrenirsin.","ch3_t":"Donmuş Taht","ch3":"Keskin bir rüzgar adaları buza hapseder. Buz ejderhası seni layık görür ve sürüne katılır.","ch4_t":"Fırtına Uyanıyor","ch4":"Gök gürültüsü göğü yarar. Fırtına ejderhası, tahtayı baştan başa vuran şimşekle yeteneğini sınar.","ch5_t":"Ormanın Fısıltısı","ch5":"Kadim ağaçlar zümrüt bir ejderhayı gizler. Doğa sana büyüme ve bolluk gücü bahşeder.","ch6_t":"Esir Yükseklikleri","ch6":"Yıldızlar arasında en gizemli ejderha olan esir ejderhası süzülür. Gerçeklik kanatları altında bükülür.","ch7_t":"Ejderha Efendisi","ch7":"Her element sana boyun eğdi. Artık bir yolcu değilsin — çağlar boyu ejderhaların fısıldadığı bir efsanesin.","hard_level":"Zor seviye","double_reward":"Çifte ödül","ad_label":"Reklam","ad_skip":"Atla","so_close":"Az kaldı!","short_by":"{n} eksik","perfect":"MÜKEMMEL!","first_clear":"İlk geçiş!","boss":"Boss","stats_title":"İstatistikler","credits":"❤ ile yapıldı","st_progress":"İlerleme","st_stars":"Kazanılan yıldız","st_levels_won":"Kazanılan seviye","st_max_combo":"En yüksek kombo","st_crushed":"Kırılan kristal","st_specials":"Yapılan özel","st_dragons":"Ejderhalar","st_procs":"Ejderha yetenekleri","st_energy":"Toplanan enerji","st_streak":"En iyi seri","st_blitz":"Blitz rekoru","st_endless":"Sonsuz rekoru","st_trials":"Sınav derinliği","st_pvp":"Düellolar","egg_ready":"Çıkmaya hazır!","egg_remaining":"Çıkmak için {n} ⚡","mode_trials":"Sınavlar","mode_trials_desc":"Roguelite koşu: seviyeler arasında bir emanet seç. Ne kadar ilerleyebilirsin?","depth":"Derinlik {n}","choose_relic":"Bir emanet seç","run_over":"🐉 Koşu bitti","revived":"Kalkan koşunu kurtardı!","relic_moves":"Hamle Tomarı","relic_moves_d":"Her seviyede +3 hamle","relic_charge":"Şarj Kristali","relic_charge_d":"Ejderhalar daha hızlı şarj olur","relic_score":"Skor Muskası","relic_score_d":"+%15 skor","relic_specials":"Güç Tohumu","relic_specials_d":"Bir özel kristalle başla","relic_power":"Ejderha Dişi","relic_power_d":"+1 ejderha yetenek gücü","relic_shield":"Anka Kalkanı","relic_shield_d":"Bir yenilgiden sağ çık","merge_toast":"Birleştir! Daha güçlü kristal","tip_merge":"🔮 Daha güçlüsüne birleştirmek için iki eşleşen özel kristali değiştir!","story_title":"Adaların Efsanesi","story_intro":"<p>Bir zamanlar Ejderha Adaları kristal büyüsüyle parlardı. Ama <b>Beş Gölge Efendisi</b> uyumu paramparça edip ejderhaları yumurtalara hapsetti.</p><p>Sen son <b>Bekçi</b>sin. Kristalleri eşleştir, ejderhaları uyandır ve ışığı adalara geri getir!</p>","dragon_q_flare":"Nihayet özgürüm! Onlara gerçek ateşi gösterelim!","dragon_q_frost":"Sakin… ve soğuk. Her tehdidi dondururum.","dragon_q_storm":"Havada hissediyor musun? Fırtına bizden yana!","dragon_q_verdant":"Yaşam geri dönüyor. Birlikte yeni umut yeşerteceğiz.","dragon_q_aether":"Yıldızlar zaferi fısıldıyor. Yol göster, Bekçi.","boss_l_boss_ash":"Bu adalar topuğumun altında küldür. Kaçabilecekken kaç!","boss_l_boss_titan":"Sonsuzluğun soğuğu seni yutacak. Hiçbir ejderha seni kurtaramaz.","boss_l_boss_storm":"Ben fırtınanın ta kendisiyim! Kristallerin toz olacak.","boss_l_boss_beast":"Çalılık bir yabancının kokusunu aldı. Buradan sağ çıkamayacaksın.","boss_l_boss_phoenix":"Külden bin kez yükseldim. Sen yalnızca bir kez düşersin.","farm_title":"🏝️ Ada Çiftliği","collect_all":"Hepsini topla","farm_empty":"Henüz toplanacak bir şey yok","hour":"sa","not_built":"İnşa edilmedi","production":"Üretim","stored":"Depolanan","build":"İnşa et","built":"{name} inşa edildi!","collect":"Topla","welcome_back_title":"🏝️ Tekrar hoş geldin!","welcome_back":"Sen yokken adan senin için çalıştı:","build_volcano":"Yanardağ","build_garden":"Bahçe","build_forge":"Demirhane","build_mine":"Maden","build_desc_volcano":"Her saat lavdan altın eritir.","build_desc_garden":"Ejderhaların için enerji yetiştirir.","build_desc_forge":"Saatte bol miktarda altın döver.","build_desc_mine":"Nadir mücevher çıkarır 💎."};
  STR.ja = {"lang_name":"日本語","nav_map":"マップ","nav_dragons":"ドラゴン","nav_shop":"ショップ","nav_pass":"パス","nav_island":"アイランド","play_level":"▶ レベル{n}をプレイ","incubator":"🥚 ドラゴン孵化器","t_daily":"デイリー","t_quests":"クエスト","t_leaderboard":"ランキング","t_ach":"アワード","t_options":"設定","hatch":"ふ化！","charge10":"チャージ +10⚡","need_energy":"エナジー不足 ⚡（レベルをプレイ）","new_dragon":"🎉 新ドラゴン！","great":"やった！","islands_title":"🗺️ ドラゴンアイランド","locked_at":"🔒 レベル{n}","level_n":"レベル{n}","goal":"🎯 {text}","goal_score":"{n}点を獲得","goal_collect":"{g}を{n}個集める","goal_ice":"全ブロックを破壊（{n}）","goal_jelly":"全ゼリーを消す（{n}）","goal_boss":"ボスを倒す","moves_reward":"手数：{m}・報酬：{gold}🪙 {energy}⚡","battle_team":"ドラゴンバトルチーム","equip_empty":"空き","equip_hint":"スロットをタップしてドラゴンを変更","start":"▶ スタート","obj_score":"スコア","obj_ice":"ブロック","obj_jelly":"ゼリー","boss_attack":"💥 ボスの攻撃！ +{n} 氷","shuffled":"🔀 盤面シャッフル！","dragon_active":"{e} {name}発動！","isle_unlocked":"🏝 新アイランド解放：{name}！","daily_available":"🎁 デイリー報酬あり！","victory":"🎉 勝利！","score":"スコア：{n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 マップ","btn_retry":"🔁 リトライ","btn_next":"▶ 次へ","btn_island":"🏝 アイランド","defeat":"敗北","goal_not_met":"目標未達成。","lives_left":"残りライフ：{hearts}","empty_suffix":"（空き）","ad_hint_moves":"広告を見て+5手ゲット！","ad_plus_moves":"📺 +5手","b_hammer":"ハンマー","b_mix":"ミックス","b_moves":"手数","hammer_hint":"🔨 クリスタルをタップして破壊","hammer_cancel":"ハンマーをキャンセル","no_booster":"ブースターなし — ショップで購入 🛒","wait":"お待ちください…","plus5":"➕5手！","collection_title":"🐲 ドラゴンコレクション","not_unlocked":"未解放","dc_level":"レベル{n}","rarity_common":"コモン","rarity_rare":"レア","rarity_epic":"エピック","upgrade_title":"⬆ 強化：{name}","cur_level":"現在レベル","ability_power":"アビリティ威力","charges_faster":"レベルごとにチャージが速く","close":"閉じる","upgrade_btn":"強化（{cost}{ic}）","not_enough_gold":"ゴールド不足 🪙","now_level":"{name}がレベル{n}に！","shop_title":"🛒 ショップ","rewarded_ad":"リワード広告","ad_desc":"広告視聴 → +6💎 と +30⚡","watch":"視聴","gems_section":"💎 ジェム","best_price":"お得","gold_section":"🪙 ゴールド","gold_pack":"{gold} ゴールド","for_gems":"{gems}💎で","boosters_section":"🧪 ブースター","skins_section":"🎨 ドラゴンスキン","hammer_pack":"ハンマー ×3","mix_pack":"ミックス ×3","moves_pack":"手数 ×3","hammer_pdesc":"クリスタルを破壊","mix_pdesc":"盤面をシャッフル","moves_pdesc":"ゲーム中+5手","you_have":"所持：{n}","bought":"購入：{name}","not_enough_gems":"ジェム不足 💎","skin_for":"{name}のスキン","wear":"装備","active":"✓ 装備中","get_dragon_first":"先に{name}ドラゴンを入手","skin_unlocked":"スキン解放！","purchase_ok":"購入完了：+{n}💎","reward_got":"報酬：+6💎 +30⚡","gold_added":"+{n} ゴールド！","pass_title":"🎖️ バトルパス — シーズン1","pass_level":"ティア{n} / {total}","xp_to_next":"次のティアまで{n} / 100 XP","premium_buy":"👑 プレミアム 500💎","premium_on":"プレミアムパス有効化！ 👑","premium_badge":"👑 プレミアム有効","got":"獲得：{r}","daily_title":"🎁 デイリー報酬","day_n":"{n}日目","claim":"受取","already_claimed":"受取済み","daily_got":"デイリー報酬を受取！","quests_title":"📜 デイリークエスト","quest_reward":"報酬 {n}🪙","ach_title":"🏆 実績","lb_title":"📊 ランキング","your_place":"あなたの順位：<b>#{rank}</b> / {total}人 · ⭐ {stars}","you":"あなた","settings_title":"⚙️ 設定","s_sound":"🔊 サウンド","s_music":"🎵 ミュージック","s_vibration":"📳 バイブ","s_language":"🌐 言語","on":"オン","off":"オフ","version":"バージョン 1.0.0","reset":"🗑️ 進行状況をリセット","reset_q":"進行状況をリセット？","reset_warn":"全進行状況が永久に失われます。","yes_reset":"はい、リセット","no":"いいえ","reset_done":"進行状況をリセット","choose_lang":"🌐 言語を選択","lives_title":"❤️ ライフ","lives_count":"{n} / {max} ライフ","next_heart":"次の❤まで{m}分{s}秒","lives_refill_hint":"広告視聴または💎で回復。","ad_plus_life":"📺 +1 ❤（広告）","refill_gems":"💎 回復（50）","life_added":"+1 ❤","lives_refilled":"ライフ回復！","tut1":"👆 クリスタルを隣にスワイプして3つそろえよう","tut2":"💎 ナイス！マッチでドラゴンをチャージ — 下のバーを見て。","tut3":"🐉 ドラゴンバーが満タンで自動で盤面を攻撃！","welcome_title":"🐉 ようこそ！","welcome_body":"<p>3つ以上のクリスタルをそろえて<b>エナジー</b>を生成。</p><p>エナジーでアイランドの<b>ドラゴンの卵</b>をチャージ。</p><p>ドラゴンはバトルで活躍：列を焼き、氷を砕き、雷で攻撃し、ボーナスを増やす！</p>","start_adventure":"冒険を始めよう！","combo":"コンボ ×{n}！","quit_q":"レベルをやめる？","resume":"再開","quit":"やめる","pause":"⏸ 一時停止","to_map":"マップへ戻る","ad_waiting":"お待ちください...","level_intro_goal":"目標：{text}","sugar_bonus":"ボーナス！ +{n}","q_win3":"3レベルクリア","q_crush200":"クリスタルを200個破壊","q_combo4":"x4コンボを決める","q_dragon":"ドラゴンを8回発動","q_energy":"エナジーを200集める","q_special":"特殊クリスタルを6個作る","streak_bonus":"🔥 連勝 ×{n}！ +{r}","piggy_title":"🐷 貯金箱","piggy_info":"{n} / {cap} 🪙","piggy_crack":"割る（+{n}🪙）","piggy_not_full":"まだ満タンじゃない — 続けよう！","piggy_cracked":"貯金箱を割った：+{n}🪙","chest_title":"🎁 チェスト","chest_open":"開ける","chest_reward":"チェスト：+{gold}🪙 +{gems}💎","t_modes":"モード","modes_title":"🎮 ゲームモード","mode_blitz":"ブリッツ","mode_endless":"サバイバル","mode_daily":"デイリーチャレンジ","mode_blitz_desc":"60秒でハイスコアを。ドラゴンチャージ×2！","mode_endless_desc":"マッチで脅威メーターを押し返せ。どこまで耐えられる？","mode_daily_desc":"1日1回の特別レベルで大報酬。","mode_endless_danger":"脅威","best":"ベスト","new_best":"自己ベスト更新！","time_up":"⏱️ 時間切れ！","mode_over":"♾️ ゲームオーバー","play":"プレイ","daily_done_today":"本日達成済み ✓","dragon_ready":"準備完了","aim_row":"🐉 列をタップして攻撃","aim_cell":"🐉 マスをタップ","s_autodragons":"🐉 オートドラゴン","tier":"ティア{n}","evolve":"進化","evolve_need":"レベル{n}が必要","evolved":"ドラゴン進化！","s_perf":"⚡ パフォーマンスモード","event_live":"本日","ev_gold":"ゴールドラッシュ","ev_gold_desc":"レベルのゴールド×2","ev_energy":"エナジーサージ","ev_energy_desc":"レベルのエナジー×2","ev_dragon":"ドラゴンフューリー","ev_dragon_desc":"ドラゴンチャージ+50%","s_colorblind":"♿ 色覚サポート","tip_boss":"👑 ボス！マッチでダメージを。5手ごとに氷で反撃。","tip_jelly":"🟪 全ゼリーを消す — ピンクのマスでマッチ。","tip_chain":"🔒 鎖付きクリスタルは動かせない。隣でマッチして解放。","tip_crate":"📦 木箱は隣接2マッチで破壊。","tip_dragon":"🐉 ドラゴン準備完了！タップでアビリティ発動。","s_install":"📲 アプリをインストール","synergy":"シナジー","tip_synergy":"⚡ ドラゴン2体準備完了！シナジーをタップで究極技に合体。","synergy_charging":"シナジーチャージ中…","fever":"フィーバー","fever_on":"フィーバー！スコア3倍 — 速くマッチ！","t_wheel":"ホイール","t_summon":"召喚","t_skills":"スキル","t_pvp":"デュエル","t_story":"ストーリー","wheel_title":"🎡 ルーレット","wheel_free":"無料スピン可能！","wheel_cost":"追加スピン：{n}💎","wheel_spin_free":"🎡 無料で回す","wheel_spin_gems":"🎡 回す（{n}💎）","need_gems":"ジェム不足 💎","summon_title":"ドラゴン召喚","summon_hint":"古の卵から宝を召喚","summon_do":"召喚（{n}💎）","sr_common":"コモン","sr_rare":"レア","sr_epic":"エピック","skills_title":"スキルツリー","skills_sub":"ジェムで永続ボーナス 💎","maxed":"MAX","sk_moves":"俊敏","sk_moves_d":"レベル開始時+1手","sk_charge":"ドラゴンフューリー","sk_charge_d":"ドラゴンチャージ速度+8%","sk_score":"英知","sk_score_d":"スコア+6%","sk_power":"剛力","sk_power_d":"ドラゴンアビリティ威力+1","sk_gold":"幸運","sk_gold_d":"レベルゴールド+8%","sk_start":"先見","sk_start_d":"開始時+1特殊クリスタル","pvp_title":"ドラゴンデュエル","pvp_trophies":"{n} トロフィー","pvp_record":"{w}勝 / {l}敗","pvp_sub":"ライバルを選び45秒でスコア勝負！","pvp_easy":"イージー","pvp_even":"互角","pvp_hard":"ハード","pvp_target":"目標 {n}","pvp_fight":"対戦 ⚔️","pvp_win":"勝利！","pvp_lose":"敗北","pvp_again":"再戦","chapter_n":"第{n}章","story_locked":"レベル{n}で解放","ch1_t":"目覚め","ch1":"死火山の灰の中で温かい卵を見つける。殻を割って火花が—最初のドラゴンが誕生する。","ch2_t":"残り火の島々","ch2":"溶岩が川となり火のドラゴンが空を舞う。ここで炎を操りクリスタルを燃やす術を学ぶ。","ch3_t":"凍てつく玉座","ch3":"刺すような風が島々を氷で閉ざす。氷のドラゴンが君を認め、仲間に加わる。","ch4_t":"嵐の目覚め","ch4":"雷が空を裂く。嵐のドラゴンが盤面を貫く雷で君の腕を試す。","ch5_t":"森のささやき","ch5":"古の木々がエメラルドドラゴンを隠す。自然が成長と豊穣の力を授ける。","ch6_t":"エーテルの高み","ch6":"星々の間を最も神秘的なエーテルドラゴンが舞う。その翼の下で現実が歪む。","ch7_t":"ドラゴンロード","ch7":"全ての元素が君にひれ伏した。もはや旅人ではなく—ドラゴンが永遠に語り継ぐ伝説だ。","hard_level":"ハードレベル","double_reward":"報酬2倍","ad_label":"広告","ad_skip":"スキップ","so_close":"惜しい！","short_by":"あと{n}","perfect":"パーフェクト！","first_clear":"初クリア！","boss":"ボス","stats_title":"統計","credits":"❤ を込めて制作","st_progress":"進行度","st_stars":"獲得スター","st_levels_won":"クリアレベル","st_max_combo":"最大コンボ","st_crushed":"破壊クリスタル","st_specials":"作成特殊","st_dragons":"ドラゴン","st_procs":"ドラゴンアビリティ","st_energy":"獲得エナジー","st_streak":"最高連勝","st_blitz":"ブリッツ最高","st_endless":"エンドレス最高","st_trials":"トライアル到達","st_pvp":"デュエル","egg_ready":"ふ化準備完了！","egg_remaining":"ふ化まで{n} ⚡","mode_trials":"トライアル","mode_trials_desc":"ローグライト：レベル間でレリックを選択。どこまで進める？","depth":"深度{n}","choose_relic":"レリックを選択","run_over":"🐉 挑戦終了","revived":"シールドが挑戦を救った！","relic_moves":"手数の巻物","relic_moves_d":"毎レベル+3手","relic_charge":"チャージクリスタル","relic_charge_d":"ドラゴンチャージが速く","relic_score":"スコアの護符","relic_score_d":"スコア+15%","relic_specials":"力の種","relic_specials_d":"特殊クリスタルで開始","relic_power":"ドラゴンの牙","relic_power_d":"ドラゴンアビリティ威力+1","relic_shield":"フェニックスシールド","relic_shield_d":"敗北を1度耐える","merge_toast":"マージ！強化クリスタル","tip_merge":"🔮 同じ特殊クリスタル2つを入れ替えてより強力にマージ！","story_title":"島々の伝説","story_intro":"<p>かつてドラゴンアイランドはクリスタルの魔法で輝いていた。だが<b>5人の影の王</b>が調和を砕き、ドラゴンを卵に封印した。</p><p>君は最後の<b>守護者</b>。クリスタルをマッチし、ドラゴンを目覚めさせ、島々に光を取り戻せ！</p>","dragon_q_flare":"やっと自由だ！本物の炎を見せてやろう！","dragon_q_frost":"静かに…そして冷たく。どんな脅威も凍らせる。","dragon_q_storm":"空気を感じるか？嵐は我らの味方だ！","dragon_q_verdant":"命が戻る。共に新たな希望を育てよう。","dragon_q_aether":"星が勝利をささやく。導いてくれ、守護者よ。","boss_l_boss_ash":"この島々は我が足元の灰だ。逃げられるうちに逃げろ！","boss_l_boss_titan":"永遠の寒気がお前を飲み込む。どのドラゴンもお前を救えぬ。","boss_l_boss_storm":"我こそ嵐そのもの！お前のクリスタルは塵となる。","boss_l_boss_beast":"茂みがよそ者の匂いを嗅ぐ。生きては帰さぬ。","boss_l_boss_phoenix":"灰から幾千度も蘇った。お前が倒れるのは一度きり。","farm_title":"🏝️ アイランドファーム","collect_all":"全て回収","farm_empty":"まだ回収するものがない","hour":"時間","not_built":"未建設","production":"生産","stored":"貯蔵","build":"建設","built":"{name}を建設！","collect":"回収","welcome_back_title":"🏝️ おかえり！","welcome_back":"留守の間、アイランドが働いてくれました：","build_volcano":"火山","build_garden":"庭園","build_forge":"鍛冶場","build_mine":"鉱山","build_desc_volcano":"毎時、溶岩からゴールドを精錬。","build_desc_garden":"ドラゴンのためにエナジーを栽培。","build_desc_forge":"毎時、大量のゴールドを鍛造。","build_desc_mine":"レアなジェムを採掘 💎。"};
  STR.ko = {"lang_name":"한국어","nav_map":"지도","nav_dragons":"드래곤","nav_shop":"상점","nav_pass":"패스","nav_island":"섬","play_level":"▶ 레벨 {n} 플레이","incubator":"🥚 드래곤 인큐베이터","t_daily":"일일","t_quests":"퀘스트","t_leaderboard":"순위","t_ach":"보상","t_options":"설정","hatch":"부화!","charge10":"충전 +10⚡","need_energy":"에너지 부족 ⚡ (레벨 플레이)","new_dragon":"🎉 새 드래곤!","great":"좋아요!","islands_title":"🗺️ 드래곤 섬","locked_at":"🔒 레벨 {n}","level_n":"레벨 {n}","goal":"🎯 {text}","goal_score":"{n}점 달성","goal_collect":"{g} {n}개 수집","goal_ice":"모든 블록 파괴 ({n})","goal_jelly":"모든 젤리 제거 ({n})","goal_boss":"보스 처치","moves_reward":"이동: {m} · 보상: {gold}🪙 {energy}⚡","battle_team":"드래곤 전투 팀","equip_empty":"비어 있음","equip_hint":"슬롯을 눌러 드래곤 변경","start":"▶ 시작","obj_score":"점수","obj_ice":"블록","obj_jelly":"젤리","boss_attack":"💥 보스 공격! +{n} 얼음","shuffled":"🔀 보드 섞임!","dragon_active":"{e} {name} 발동!","isle_unlocked":"🏝 새 섬 해금: {name}!","daily_available":"🎁 일일 보상 준비 완료!","victory":"🎉 승리!","score":"점수: {n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 지도","btn_retry":"🔁 재시도","btn_next":"▶ 다음","btn_island":"🏝 섬","defeat":"패배","goal_not_met":"목표 미달성.","lives_left":"남은 생명: {hearts}","empty_suffix":" (비어 있음)","ad_hint_moves":"광고 보고 +5 이동 획득!","ad_plus_moves":"📺 +5 이동","b_hammer":"망치","b_mix":"섞기","b_moves":"이동","hammer_hint":"🔨 크리스탈을 눌러 부수기","hammer_cancel":"망치 취소됨","no_booster":"부스터 없음 — 상점에서 구매 🛒","wait":"잠시만 기다려 주세요…","plus5":"➕5 이동!","collection_title":"🐲 드래곤 컬렉션","not_unlocked":"잠김","dc_level":"레벨 {n}","rarity_common":"일반","rarity_rare":"레어","rarity_epic":"에픽","upgrade_title":"⬆ 업그레이드: {name}","cur_level":"현재 레벨","ability_power":"능력 위력","charges_faster":"레벨마다 충전 속도 상승","close":"닫기","upgrade_btn":"업그레이드 ({cost}{ic})","not_enough_gold":"골드 부족 🪙","now_level":"{name}이(가) 레벨 {n}이 되었어요!","shop_title":"🛒 상점","rewarded_ad":"보상형 광고","ad_desc":"광고 시청 → +6💎, +30⚡","watch":"시청","gems_section":"💎 젬","best_price":"최고 혜택","gold_section":"🪙 골드","gold_pack":"골드 {gold}","for_gems":"{gems}💎에","boosters_section":"🧪 부스터","skins_section":"🎨 드래곤 스킨","hammer_pack":"망치 ×3","mix_pack":"섞기 ×3","moves_pack":"이동 ×3","hammer_pdesc":"크리스탈 부수기","mix_pdesc":"보드 섞기","moves_pdesc":"게임 중 +5 이동","you_have":"보유: {n}","bought":"구매: {name}","not_enough_gems":"젬 부족 💎","skin_for":"{name}용 스킨","wear":"장착","active":"✓ 활성","get_dragon_first":"먼저 {name} 드래곤을 획득하세요","skin_unlocked":"스킨 해금!","purchase_ok":"구매 완료: +{n}💎","reward_got":"보상: +6💎 +30⚡","gold_added":"+{n} 골드!","pass_title":"🎖️ 배틀 패스 — 시즌 1","pass_level":"티어 {n} / {total}","xp_to_next":"다음 티어까지 {n} / 100 XP","premium_buy":"👑 프리미엄 500💎","premium_on":"프리미엄 패스 활성화! 👑","premium_badge":"👑 프리미엄 활성","got":"획득: {r}","daily_title":"🎁 일일 보상","day_n":"{n}일차","claim":"받기","already_claimed":"이미 받음","daily_got":"일일 보상을 받았어요!","quests_title":"📜 일일 퀘스트","quest_reward":"보상 {n}🪙","ach_title":"🏆 업적","lb_title":"📊 리더보드","your_place":"내 순위: <b>#{rank}</b> / {total} · ⭐ {stars}","you":"나","settings_title":"⚙️ 설정","s_sound":"🔊 소리","s_music":"🎵 음악","s_vibration":"📳 진동","s_language":"🌐 언어","on":"켜기","off":"끄기","version":"버전 1.0.0","reset":"🗑️ 진행 초기화","reset_q":"진행을 초기화할까요?","reset_warn":"모든 진행이 영구히 사라집니다.","yes_reset":"네, 초기화","no":"아니요","reset_done":"진행 초기화됨","choose_lang":"🌐 언어 선택","lives_title":"❤️ 생명","lives_count":"{n} / {max} 생명","next_heart":"다음 ❤까지 {m}분 {s}초","lives_refill_hint":"광고를 보거나 💎로 충전하세요.","ad_plus_life":"📺 +1 ❤ (광고)","refill_gems":"💎 충전 (50)","life_added":"+1 ❤","lives_refilled":"생명 충전 완료!","tut1":"👆 크리스탈을 옆으로 밀어 같은 종류 3개를 맞추세요","tut2":"💎 좋아요! 매치가 드래곤을 충전해요 — 아래 게이지를 확인하세요.","tut3":"🐉 드래곤 게이지가 가득 차면 스스로 보드를 공격해요!","welcome_title":"🐉 환영합니다!","welcome_body":"<p>크리스탈 3개 이상을 맞춰 <b>에너지</b>를 생성하세요.</p><p>에너지는 섬의 <b>드래곤 알</b>을 충전해요.</p><p>드래곤은 전투에서 줄을 태우고, 얼음을 부수고, 번개로 공격하며 보너스를 키워줍니다!</p>","start_adventure":"모험 시작!","combo":"콤보 ×{n}!","quit_q":"레벨을 나갈까요?","resume":"계속하기","quit":"나가기","pause":"⏸ 일시정지","to_map":"지도로 나가기","ad_waiting":"잠시만 기다려 주세요...","level_intro_goal":"목표: {text}","sugar_bonus":"보너스! +{n}","q_win3":"레벨 3회 승리","q_crush200":"크리스탈 200개 파괴","q_combo4":"x4 콤보 만들기","q_dragon":"드래곤 8회 발동","q_energy":"에너지 200 모으기","q_special":"특수 크리스탈 6개 생성","streak_bonus":"🔥 연승 ×{n}! +{r}","piggy_title":"🐷 돼지 저금통","piggy_info":"{n} / {cap} 🪙","piggy_crack":"깨기 (+{n}🪙)","piggy_not_full":"아직 안 찼어요 — 계속 플레이!","piggy_cracked":"저금통 깨짐: +{n}🪙","chest_title":"🎁 상자","chest_open":"열기","chest_reward":"상자: +{gold}🪙 +{gems}💎","t_modes":"모드","modes_title":"🎮 게임 모드","mode_blitz":"블리츠","mode_endless":"서바이벌","mode_daily":"일일 챌린지","mode_blitz_desc":"60초 안에 최고 점수. 드래곤 충전 ×2!","mode_endless_desc":"매치로 위협 게이지를 막아내세요. 얼마나 버틸 수 있나요?","mode_daily_desc":"하루 한 번 큰 보상을 주는 특별 레벨.","mode_endless_danger":"위협","best":"최고","new_best":"신기록!","time_up":"⏱️ 시간 종료!","mode_over":"♾️ 게임 오버","play":"플레이","daily_done_today":"오늘 완료 ✓","dragon_ready":"준비","aim_row":"🐉 줄을 눌러 공격","aim_cell":"🐉 칸을 누르세요","s_autodragons":"🐉 자동 드래곤","tier":"티어 {n}","evolve":"진화","evolve_need":"레벨 {n} 필요","evolved":"드래곤 진화!","s_perf":"⚡ 성능 모드","event_live":"오늘","ev_gold":"골드 러시","ev_gold_desc":"레벨 골드 ×2","ev_energy":"에너지 폭발","ev_energy_desc":"레벨 에너지 ×2","ev_dragon":"드래곤 분노","ev_dragon_desc":"드래곤 충전 +50%","s_colorblind":"♿ 색약 모드","tip_boss":"👑 보스! 매치로 피해를 주세요. 5번 이동마다 얼음으로 반격해요.","tip_jelly":"🟪 모든 젤리 제거 — 분홍 칸에서 매치하세요.","tip_chain":"🔒 사슬 크리스탈은 움직일 수 없어요. 옆에서 매치해 풀어주세요.","tip_crate":"📦 상자는 인접한 매치 2번으로 부서져요.","tip_dragon":"🐉 드래곤 준비 완료! 눌러서 능력을 사용하세요.","s_install":"📲 앱 설치","synergy":"시너지","tip_synergy":"⚡ 드래곤 2마리 준비! 시너지를 눌러 궁극기로 합치세요.","synergy_charging":"시너지 충전 중…","fever":"피버","fever_on":"피버! 점수 3배 — 빠르게 매치!","t_wheel":"룰렛","t_summon":"소환","t_skills":"스킬","t_pvp":"결투","t_story":"스토리","wheel_title":"🎡 행운의 룰렛","wheel_free":"무료 회전 준비 완료!","wheel_cost":"추가 회전: {n}💎","wheel_spin_free":"🎡 무료 회전","wheel_spin_gems":"🎡 회전 ({n}💎)","need_gems":"젬 부족 💎","summon_title":"드래곤 소환","summon_hint":"고대의 알에서 보물을 소환하세요","summon_do":"소환 ({n}💎)","sr_common":"일반","sr_rare":"레어","sr_epic":"에픽","skills_title":"스킬 트리","skills_sub":"젬으로 얻는 영구 보너스 💎","maxed":"최대","sk_moves":"민첩","sk_moves_d":"레벨 시작 시 +1 이동","sk_charge":"드래곤 분노","sk_charge_d":"드래곤 충전 속도 +8%","sk_score":"지혜","sk_score_d":"점수 +6%","sk_power":"위력","sk_power_d":"드래곤 능력 위력 +1","sk_gold":"행운","sk_gold_d":"레벨 골드 +8%","sk_start":"예지","sk_start_d":"시작 시 특수 크리스탈 +1","pvp_title":"드래곤 결투","pvp_trophies":"트로피 {n}","pvp_record":"{w}승 / {l}패","pvp_sub":"상대를 골라 45초 안에 점수를 이기세요!","pvp_easy":"쉬움","pvp_even":"대등","pvp_hard":"어려움","pvp_target":"목표 {n}","pvp_fight":"전투 ⚔️","pvp_win":"승리!","pvp_lose":"패배","pvp_again":"다시 전투","chapter_n":"{n}장","story_locked":"레벨 {n}에서 해금","ch1_t":"각성","ch1":"죽은 화산의 잿더미 속에서 따뜻한 알을 발견합니다. 껍질을 뚫고 불꽃이 터지며 첫 드래곤이 태어납니다.","ch2_t":"잉걸불 군도","ch2":"용암이 강처럼 흐르고 화염 드래곤이 하늘을 맴돕니다. 이곳에서 불꽃을 길들이고 크리스탈에 불을 붙이는 법을 배웁니다.","ch3_t":"얼어붙은 왕좌","ch3":"매서운 바람이 섬을 얼음 속에 가둡니다. 서리 드래곤이 당신을 인정하고 무리에 합류합니다.","ch4_t":"폭풍이 깨어나다","ch4":"천둥이 하늘을 가릅니다. 폭풍 드래곤이 보드를 가로지르는 번개로 당신의 실력을 시험합니다.","ch5_t":"숲의 속삭임","ch5":"오래된 나무들이 에메랄드 드래곤을 숨기고 있습니다. 자연이 성장과 풍요의 힘을 내려줍니다.","ch6_t":"에테르 고지","ch6":"별들 사이로 가장 신비로운 에테르 드래곤이 날아오릅니다. 그 날갯짓 아래 현실이 휘어집니다.","ch7_t":"드래곤 군주","ch7":"모든 원소가 당신에게 굴복했습니다. 더 이상 여행자가 아닌, 드래곤들이 오랜 세월 그 이름을 속삭이는 전설입니다.","hard_level":"어려운 레벨","double_reward":"보상 2배","ad_label":"광고","ad_skip":"건너뛰기","so_close":"아깝다!","short_by":"{n} 부족","perfect":"퍼펙트!","first_clear":"첫 클리어!","boss":"보스","stats_title":"통계","credits":"❤로 만듦","st_progress":"진행도","st_stars":"획득한 별","st_levels_won":"승리한 레벨","st_max_combo":"최대 콤보","st_crushed":"파괴한 크리스탈","st_specials":"생성한 특수","st_dragons":"드래곤","st_procs":"드래곤 능력","st_energy":"모은 에너지","st_streak":"최고 연승","st_blitz":"블리츠 최고","st_endless":"엔드리스 최고","st_trials":"시련 깊이","st_pvp":"결투","egg_ready":"부화 준비 완료!","egg_remaining":"부화까지 {n} ⚡","mode_trials":"시련","mode_trials_desc":"로그라이트 도전: 레벨 사이에 유물을 고르세요. 얼마나 깊이 갈 수 있나요?","depth":"깊이 {n}","choose_relic":"유물 선택","run_over":"🐉 도전 종료","revived":"방패가 당신을 구했어요!","relic_moves":"이동의 두루마리","relic_moves_d":"레벨마다 +3 이동","relic_charge":"충전 크리스탈","relic_charge_d":"드래곤 충전 속도 상승","relic_score":"점수 부적","relic_score_d":"점수 +15%","relic_specials":"힘의 씨앗","relic_specials_d":"특수 크리스탈로 시작","relic_power":"드래곤 송곳니","relic_power_d":"드래곤 능력 위력 +1","relic_shield":"불사조 방패","relic_shield_d":"패배 1회 생존","merge_toast":"병합! 더 강한 크리스탈","tip_merge":"🔮 같은 특수 크리스탈 2개를 바꿔 더 강한 것으로 병합하세요!","story_title":"섬의 전설","story_intro":"<p>한때 드래곤 군도는 크리스탈 마법으로 빛났습니다. 그러나 <b>다섯 그림자 군주</b>가 조화를 깨뜨리고 드래곤들을 알 속에 봉인했습니다.</p><p>당신은 마지막 <b>수호자</b>입니다. 크리스탈을 맞추고, 드래곤을 깨우고, 섬에 빛을 되돌리세요!</p>","dragon_q_flare":"드디어 자유다! 진짜 불맛을 보여주자!","dragon_q_frost":"고요하게… 그리고 차갑게. 어떤 위협도 얼려버리겠어.","dragon_q_storm":"공기에서 느껴지지? 폭풍은 우리 편이야!","dragon_q_verdant":"생명이 돌아온다. 함께 새로운 희망을 키우자.","dragon_q_aether":"별들이 승리를 속삭이네. 앞장서요, 수호자.","boss_l_boss_ash":"이 섬들은 내 발밑의 잿더미다. 할 수 있을 때 도망쳐라!","boss_l_boss_titan":"영원의 냉기가 너를 삼킬 것이다. 어떤 드래곤도 널 구하지 못해.","boss_l_boss_storm":"나는 폭풍 그 자체다! 네 크리스탈은 먼지가 되리라.","boss_l_boss_beast":"덤불이 이방인의 냄새를 맡았다. 살아서 나가지 못하리.","boss_l_boss_phoenix":"나는 잿더미에서 천 번을 되살아났다. 너는 단 한 번 쓰러진다.","farm_title":"🏝️ 섬 농장","collect_all":"모두 수집","farm_empty":"아직 수집할 것이 없어요","hour":"시간","not_built":"미건설","production":"생산","stored":"저장됨","build":"건설","built":"{name} 건설 완료!","collect":"수집","welcome_back_title":"🏝️ 다시 오신 걸 환영해요!","welcome_back":"자리를 비운 사이, 섬이 당신을 위해 일했어요:","build_volcano":"화산","build_garden":"정원","build_forge":"대장간","build_mine":"광산","build_desc_volcano":"매시간 용암에서 골드를 제련해요.","build_desc_garden":"드래곤을 위한 에너지를 길러요.","build_desc_forge":"시간당 많은 골드를 제작해요.","build_desc_mine":"희귀한 젬을 채굴해요 💎."};
  STR.zh = {"lang_name":"简体中文","nav_map":"地图","nav_dragons":"龙","nav_shop":"商店","nav_pass":"通行证","nav_island":"岛屿","play_level":"▶ 开始关卡 {n}","incubator":"🥚 龙之孵化器","t_daily":"每日","t_quests":"任务","t_leaderboard":"排行","t_ach":"成就","t_options":"选项","hatch":"孵化！","charge10":"充能 +10⚡","need_energy":"能量不足⚡（去玩关卡）","new_dragon":"🎉 新龙！","great":"太棒了！","islands_title":"🗺️ 龙之岛屿","locked_at":"🔒 关卡 {n}","level_n":"关卡 {n}","goal":"🎯 {text}","goal_score":"达到 {n} 分","goal_collect":"收集 {n} × {g}","goal_ice":"打破所有方块（{n}）","goal_jelly":"清除所有果冻（{n}）","goal_boss":"击败首领","moves_reward":"步数：{m} · 奖励：{gold}🪙 {energy}⚡","battle_team":"龙之战队","equip_empty":"空","equip_hint":"点击槽位更换龙","start":"▶ 开始","obj_score":"分数","obj_ice":"方块","obj_jelly":"果冻","boss_attack":"💥 首领攻击！+{n} 冰","shuffled":"🔀 棋盘已重排！","dragon_active":"{e} {name} 已激活！","isle_unlocked":"🏝 解锁新岛屿：{name}！","daily_available":"🎁 每日奖励可领取！","victory":"🎉 胜利！","score":"分数：{n}","win_rewards":"+{gold}🪙  +{energy}⚡","btn_map":"🗺 地图","btn_retry":"🔁 重试","btn_next":"▶ 下一关","btn_island":"🏝 岛屿","defeat":"失败","goal_not_met":"未达成目标。","lives_left":"剩余生命：{hearts}","empty_suffix":"（空）","ad_hint_moves":"观看广告获得 +5 步！","ad_plus_moves":"📺 +5 步","b_hammer":"锤子","b_mix":"混合","b_moves":"步数","hammer_hint":"🔨 点击水晶将其砸碎","hammer_cancel":"已取消锤子","no_booster":"无道具，去商店购买🛒","wait":"请稍候…","plus5":"➕5 步！","collection_title":"🐲 龙之图鉴","not_unlocked":"未解锁","dc_level":"等级 {n}","rarity_common":"普通","rarity_rare":"稀有","rarity_epic":"史诗","upgrade_title":"⬆ 升级：{name}","cur_level":"当前等级","ability_power":"技能强度","charges_faster":"每级充能更快","close":"关闭","upgrade_btn":"升级（{cost}{ic}）","not_enough_gold":"金币不足🪙","now_level":"{name} 已升至 {n} 级！","shop_title":"🛒 商店","rewarded_ad":"奖励广告","ad_desc":"观看广告 → +6💎 和 +30⚡","watch":"观看","gems_section":"💎 宝石","best_price":"超值","gold_section":"🪙 金币","gold_pack":"{gold} 金币","for_gems":"需 {gems}💎","boosters_section":"🧪 道具","skins_section":"🎨 龙之外观皮肤","hammer_pack":"锤子 ×3","mix_pack":"混合 ×3","moves_pack":"步数 ×3","hammer_pdesc":"砸碎任意水晶","mix_pdesc":"重排棋盘","moves_pdesc":"游戏中 +5 步","you_have":"拥有：{n}","bought":"已购买：{name}","not_enough_gems":"宝石不足💎","skin_for":"{name} 的皮肤","wear":"装备","active":"✓ 已启用","get_dragon_first":"先获得 {name} 龙","skin_unlocked":"皮肤已解锁！","purchase_ok":"购买完成：+{n}💎","reward_got":"奖励：+6💎 +30⚡","gold_added":"+{n} 金币！","pass_title":"🎖️ 战斗通行证 — 第1赛季","pass_level":"等级 {n} / {total}","xp_to_next":"距下一级 {n} / 100 经验","premium_buy":"👑 高级版 500💎","premium_on":"高级通行证已激活！👑","premium_badge":"👑 高级版已启用","got":"获得：{r}","daily_title":"🎁 每日奖励","day_n":"第 {n} 天","claim":"领取","already_claimed":"已领取","daily_got":"每日奖励已领取！","quests_title":"📜 每日任务","quest_reward":"奖励 {n}🪙","ach_title":"🏆 成就","lb_title":"📊 排行榜","your_place":"你的排名：<b>#{rank}</b> / {total} · ⭐ {stars}","you":"你","settings_title":"⚙️ 设置","s_sound":"🔊 音效","s_music":"🎵 音乐","s_vibration":"📳 振动","s_language":"🌐 语言","on":"开","off":"关","version":"版本 1.0.0","reset":"🗑️ 重置进度","reset_q":"重置进度？","reset_warn":"所有进度将永久丢失。","yes_reset":"确认重置","no":"否","reset_done":"进度已重置","choose_lang":"🌐 选择语言","lives_title":"❤️ 生命","lives_count":"{n} / {max} 生命","next_heart":"下一颗❤将在 {m}分{s}秒后恢复","lives_refill_hint":"观看广告或用💎补充生命。","ad_plus_life":"📺 +1 ❤（广告）","refill_gems":"💎 补充（50）","life_added":"+1 ❤","lives_refilled":"生命已补满！","tut1":"👆 将一颗水晶滑向相邻水晶，三消同色","tut2":"💎 太棒了！消除可为龙充能，看下方的能量条。","tut3":"🐉 当龙的能量条充满时，它会自动攻击棋盘！","welcome_title":"🐉 欢迎！","welcome_body":"<p>消除 3 颗以上水晶来产生<b>能量</b>。</p><p>能量为岛上的<b>龙蛋</b>充能。</p><p>龙在战斗中助你一臂之力：烧毁整行、砸碎冰块、闪电攻击并培育奖励！</p>","start_adventure":"开始冒险！","combo":"连击 ×{n}！","quit_q":"退出关卡？","resume":"继续","quit":"退出","pause":"⏸ 已暂停","to_map":"退出到地图","ad_waiting":"请稍候...","level_intro_goal":"目标：{text}","sugar_bonus":"奖励！+{n}","q_win3":"赢得 3 个关卡","q_crush200":"消除 200 颗水晶","q_combo4":"打出 x4 连击","q_dragon":"触发龙 8 次","q_energy":"收集 200 能量","q_special":"制造 6 个特殊水晶","streak_bonus":"🔥 连胜 ×{n}！+{r}","piggy_title":"🐷 存钱罐","piggy_info":"{n} / {cap} 🪙","piggy_crack":"砸开（+{n}🪙）","piggy_not_full":"还没满，继续加油！","piggy_cracked":"存钱罐已砸开：+{n}🪙","chest_title":"🎁 宝箱","chest_open":"打开","chest_reward":"宝箱：+{gold}🪙 +{gems}💎","t_modes":"模式","modes_title":"🎮 游戏模式","mode_blitz":"闪电战","mode_endless":"生存","mode_daily":"每日挑战","mode_blitz_desc":"60 秒内冲击最高分。龙充能 ×2！","mode_endless_desc":"用消除压制威胁槽。你能坚持多久？","mode_daily_desc":"每天一个特殊关卡，赢取丰厚奖励。","mode_endless_danger":"威胁","best":"最佳","new_best":"新纪录！","time_up":"⏱️ 时间到！","mode_over":"♾️ 游戏结束","play":"开始","daily_done_today":"今日已完成 ✓","dragon_ready":"就绪","aim_row":"🐉 点击一行进行攻击","aim_cell":"🐉 点击一个格子","s_autodragons":"🐉 自动龙","tier":"阶级 {n}","evolve":"进化","evolve_need":"需要等级 {n}","evolved":"龙已进化！","s_perf":"⚡ 性能模式","event_live":"今日","ev_gold":"黄金狂潮","ev_gold_desc":"关卡金币 ×2","ev_energy":"能量涌动","ev_energy_desc":"关卡能量 ×2","ev_dragon":"巨龙之怒","ev_dragon_desc":"龙充能 +50%","s_colorblind":"♿ 色盲模式","tip_boss":"👑 首领！用消除造成伤害。每 5 步它会用冰块反击。","tip_jelly":"🟪 清除所有果冻，在粉色格子上消除。","tip_chain":"🔒 锁链水晶无法移动。在旁边消除来解锁它们。","tip_crate":"📦 木箱需相邻消除 2 次才能打破。","tip_dragon":"🐉 龙已就绪！点击它释放技能。","s_install":"📲 安装应用","synergy":"协同","tip_synergy":"⚡ 两条龙就绪！点击协同将它们合成一个终极技能。","synergy_charging":"协同充能中…","fever":"狂热","fever_on":"狂热！三倍分数，快速消除！","t_wheel":"转盘","t_summon":"召唤","t_skills":"技能","t_pvp":"对决","t_story":"剧情","wheel_title":"🎡 幸运转盘","wheel_free":"免费转盘已就绪！","wheel_cost":"额外转动：{n}💎","wheel_spin_free":"🎡 免费转动","wheel_spin_gems":"🎡 转动（{n}💎）","need_gems":"宝石不足💎","summon_title":"龙之召唤","summon_hint":"从远古龙蛋中召唤宝物","summon_do":"召唤（{n}💎）","sr_common":"普通","sr_rare":"稀有","sr_epic":"史诗","skills_title":"技能树","skills_sub":"用宝石💎获取永久加成","maxed":"满级","sk_moves":"敏捷","sk_moves_d":"关卡开始 +1 步","sk_charge":"巨龙之怒","sk_charge_d":"龙充能速度 +8%","sk_score":"智慧","sk_score_d":"分数 +6%","sk_power":"威力","sk_power_d":"龙技能强度 +1","sk_gold":"财富","sk_gold_d":"关卡金币 +8%","sk_start":"远见","sk_start_d":"开局 +1 特殊水晶","pvp_title":"龙之对决","pvp_trophies":"{n} 奖杯","pvp_record":"{w}胜 / {l}负","pvp_sub":"选择对手，在 45 秒内击败他的分数！","pvp_easy":"简单","pvp_even":"均衡","pvp_hard":"困难","pvp_target":"目标 {n}","pvp_fight":"战斗 ⚔️","pvp_win":"胜利！","pvp_lose":"失败","pvp_again":"再战","chapter_n":"第 {n} 章","story_locked":"关卡 {n} 解锁","ch1_t":"觉醒","ch1":"在死火山的灰烬中，你发现了一颗温热的蛋。一缕火花破壳而出，你的第一条龙诞生了。","ch2_t":"余烬群岛","ch2":"熔岩成河，火龙在头顶盘旋。在这里你学会驯服火焰、点燃水晶。","ch3_t":"冰封王座","ch3":"刺骨的寒风将群岛冰封。霜龙认可你的资格，加入你的飞行队。","ch4_t":"风暴苏醒","ch4":"雷声撕裂长空。风暴龙用横扫棋盘的闪电考验你的技艺。","ch5_t":"森林低语","ch5":"古树深处藏着一条翡翠龙。自然赋予你生长与丰饶之力。","ch6_t":"以太高地","ch6":"群星之间翱翔着最神秘的以太龙。现实在它的双翼下扭曲。","ch7_t":"龙王","ch7":"每种元素都已臣服于你。你不再是旅人，而是龙群世代低语的传奇。","hard_level":"困难关卡","double_reward":"双倍奖励","ad_label":"广告","ad_skip":"跳过","so_close":"就差一点！","short_by":"还差 {n}","perfect":"完美！","first_clear":"首次通关！","boss":"首领","stats_title":"统计","credits":"用❤制作","st_progress":"进度","st_stars":"已获星星","st_levels_won":"已通关卡","st_max_combo":"最高连击","st_crushed":"已消除水晶","st_specials":"已制造特殊","st_dragons":"龙","st_procs":"龙技能触发","st_energy":"已收集能量","st_streak":"最佳连胜","st_blitz":"闪电战最佳","st_endless":"无尽最佳","st_trials":"试炼深度","st_pvp":"对决","egg_ready":"可孵化！","egg_remaining":"还需 {n} ⚡ 孵化","mode_trials":"试炼","mode_trials_desc":"roguelite 闯关：每关之间选一件遗物。你能走多深？","depth":"深度 {n}","choose_relic":"选择遗物","run_over":"🐉 闯关结束","revived":"护盾拯救了你的闯关！","relic_moves":"步数卷轴","relic_moves_d":"每关 +3 步","relic_charge":"充能水晶","relic_charge_d":"龙充能更快","relic_score":"分数护符","relic_score_d":"分数 +15%","relic_specials":"力量之种","relic_specials_d":"开局带一个特殊水晶","relic_power":"龙牙","relic_power_d":"龙技能强度 +1","relic_shield":"凤凰护盾","relic_shield_d":"抵挡一次失败","merge_toast":"合成！更强的水晶","tip_merge":"🔮 交换两个相同的特殊水晶，将它们合成为更强的水晶！","story_title":"群岛传说","story_intro":"<p>曾几何时，龙之群岛因水晶魔法而闪耀。但<b>五位暗影领主</b>打碎了和谐，将龙群封印于蛋中。</p><p>你是最后的<b>守护者</b>。消除水晶、唤醒巨龙，让光明重回群岛！</p>","dragon_q_flare":"终于自由了！让我们让他们见识真正的烈焰！","dragon_q_frost":"沉着…冷静。我会冻结一切威胁。","dragon_q_storm":"感觉到空气中的气息了吗？风暴站在我们这边！","dragon_q_verdant":"生命回归。我们将一同孕育新的希望。","dragon_q_aether":"群星低语着胜利。带路吧，守护者。","boss_l_boss_ash":"这些群岛不过是我脚下的灰烬。趁早逃命吧！","boss_l_boss_titan":"永恒的寒冷将吞噬你。没有龙能救你。","boss_l_boss_storm":"我就是风暴本身！你的水晶将化为尘埃。","boss_l_boss_beast":"密林嗅到了外来者。你别想活着离开。","boss_l_boss_phoenix":"我从灰烬中重生千次。而你只会倒下一次。","farm_title":"🏝️ 岛屿农场","collect_all":"全部收取","farm_empty":"暂无可收取","hour":"小时","not_built":"未建造","production":"产出","stored":"已储存","build":"建造","built":"{name} 已建成！","collect":"收取","welcome_back_title":"🏝️ 欢迎回来！","welcome_back":"你离开期间，岛屿为你辛勤劳作：","build_volcano":"火山","build_garden":"花园","build_forge":"熔炉","build_mine":"矿场","build_desc_volcano":"每小时从熔岩中熔炼金币。","build_desc_garden":"为你的龙培育能量。","build_desc_forge":"每小时锻造大量金币。","build_desc_mine":"开采稀有宝石💎。"};
  // <<< AUTO-LANGS END >>>
  // <<< CONTENT-LANGS START (generated) >>>
  const CT = {"uk":{"dt_flare":"Вогняний дракон","dt_frost":"Крижаний дракон","dt_storm":"Грозовий дракон","dt_verdant":"Лісовий дракон","dt_aether":"Ефірний дракон","dd_flare":"Спалює цілі ряди кристалів, перетворюючи їх на енергію.","dd_frost":"Заморожує перешкоди та розбиває кригу на полі.","dd_storm":"Б'є блискавками по випадкових кристалах поля.","dd_verdant":"Вирощує бонусні кристали-підсилювачі на полі.","dd_aether":"Перемішує поле та дарує додаткові ходи.","isle_dawn":"Острів Світанку","isle_frost":"Крижані Вершини","isle_storm":"Грозове Плато","isle_emerald":"Смарагдові Хащі","isle_sky":"Небесна Цитадель","bn_ash":"Лорд Попелу","bn_titan":"Крижаний Тітан","bn_storm":"Володар Бурі","bn_beast":"Хащний Звір","bn_phoenix":"Небесний Фенікс","boss_default":"Бос"},"en":{"dt_flare":"Fire Dragon","dt_frost":"Ice Dragon","dt_storm":"Storm Dragon","dt_verdant":"Forest Dragon","dt_aether":"Aether Dragon","dd_flare":"Burns entire rows of crystals, turning them into energy.","dd_frost":"Freezes obstacles and shatters ice on the board.","dd_storm":"Strikes random crystals with bolts of lightning.","dd_verdant":"Grows bonus booster crystals across the board.","dd_aether":"Reshuffles the board and grants extra moves.","isle_dawn":"Dawn Isle","isle_frost":"Frost Peaks","isle_storm":"Storm Plateau","isle_emerald":"Emerald Thicket","isle_sky":"Sky Citadel","bn_ash":"Ash Lord","bn_titan":"Frost Titan","bn_storm":"Storm Warden","bn_beast":"Thicket Beast","bn_phoenix":"Sky Phoenix","boss_default":"Boss"},"es":{"dt_flare":"Dragón de Fuego","dt_frost":"Dragón de Hielo","dt_storm":"Dragón de Tormenta","dt_verdant":"Dragón del Bosque","dt_aether":"Dragón Etéreo","dd_flare":"Quema filas enteras de cristales y las convierte en energía.","dd_frost":"Congela obstáculos y rompe el hielo del tablero.","dd_storm":"Golpea cristales al azar con rayos.","dd_verdant":"Genera cristales potenciadores adicionales en el tablero.","dd_aether":"Baraja el tablero y otorga movimientos extra.","isle_dawn":"Isla del Alba","isle_frost":"Picos Helados","isle_storm":"Meseta de la Tormenta","isle_emerald":"Espesura Esmeralda","isle_sky":"Ciudadela Celeste","bn_ash":"Señor de Cenizas","bn_titan":"Titán de Escarcha","bn_storm":"Guardián de la Tormenta","bn_beast":"Bestia del Matorral","bn_phoenix":"Fénix Celeste","boss_default":"Jefe"},"de":{"dt_flare":"Feuerdrache","dt_frost":"Eisdrache","dt_storm":"Sturmdrache","dt_verdant":"Walddrache","dt_aether":"Ätherdrache","dd_flare":"Verbrennt ganze Kristallreihen und wandelt sie in Energie um.","dd_frost":"Friert Hindernisse ein und zerschlägt Eis auf dem Feld.","dd_storm":"Trifft zufällige Kristalle mit Blitzen.","dd_verdant":"Lässt Bonus-Booster-Kristalle auf dem Feld wachsen.","dd_aether":"Mischt das Feld neu und gewährt zusätzliche Züge.","isle_dawn":"Morgeninsel","isle_frost":"Frostgipfel","isle_storm":"Sturmplateau","isle_emerald":"Smaragddickicht","isle_sky":"Himmelszitadelle","bn_ash":"Aschefürst","bn_titan":"Frosttitan","bn_storm":"Sturmwächter","bn_beast":"Dickichtbestie","bn_phoenix":"Himmelsphönix","boss_default":"Boss"},"fr":{"dt_flare":"Dragon de Feu","dt_frost":"Dragon de Glace","dt_storm":"Dragon d'Orage","dt_verdant":"Dragon des Forêts","dt_aether":"Dragon Éthéré","dd_flare":"Brûle des rangées entières de cristaux et les transforme en énergie.","dd_frost":"Gèle les obstacles et brise la glace du plateau.","dd_storm":"Frappe des cristaux aléatoires avec des éclairs.","dd_verdant":"Fait pousser des cristaux bonus sur le plateau.","dd_aether":"Mélange le plateau et accorde des coups supplémentaires.","isle_dawn":"Île de l'Aube","isle_frost":"Pics Gelés","isle_storm":"Plateau des Orages","isle_emerald":"Fourré d'Émeraude","isle_sky":"Citadelle Céleste","bn_ash":"Seigneur des Cendres","bn_titan":"Titan de Givre","bn_storm":"Gardien des Orages","bn_beast":"Bête des Fourrés","bn_phoenix":"Phénix Céleste","boss_default":"Boss"},"pt":{"dt_flare":"Dragão de Fogo","dt_frost":"Dragão de Gelo","dt_storm":"Dragão da Tempestade","dt_verdant":"Dragão da Floresta","dt_aether":"Dragão Etéreo","dd_flare":"Queima fileiras inteiras de cristais, convertendo-as em energia.","dd_frost":"Congela obstáculos e quebra o gelo do tabuleiro.","dd_storm":"Atinge cristais aleatórios com raios.","dd_verdant":"Cultiva cristais bônus no tabuleiro.","dd_aether":"Embaralha o tabuleiro e concede movimentos extras.","isle_dawn":"Ilha da Aurora","isle_frost":"Picos Gelados","isle_storm":"Planalto da Tempestade","isle_emerald":"Matagal Esmeralda","isle_sky":"Cidadela Celeste","bn_ash":"Senhor das Cinzas","bn_titan":"Titã do Gelo","bn_storm":"Guardião da Tempestade","bn_beast":"Fera do Matagal","bn_phoenix":"Fênix Celeste","boss_default":"Chefe"},"it":{"dt_flare":"Drago di Fuoco","dt_frost":"Drago di Ghiaccio","dt_storm":"Drago della Tempesta","dt_verdant":"Drago della Foresta","dt_aether":"Drago Etereo","dd_flare":"Brucia intere file di cristalli, trasformandole in energia.","dd_frost":"Congela gli ostacoli e frantuma il ghiaccio sul tabellone.","dd_storm":"Colpisce cristalli casuali con fulmini.","dd_verdant":"Fa crescere cristalli bonus sul tabellone.","dd_aether":"Rimescola il tabellone e concede mosse extra.","isle_dawn":"Isola dell'Alba","isle_frost":"Vette Gelate","isle_storm":"Altopiano della Tempesta","isle_emerald":"Boscaglia di Smeraldo","isle_sky":"Cittadella Celeste","bn_ash":"Signore delle Ceneri","bn_titan":"Titano del Gelo","bn_storm":"Custode della Tempesta","bn_beast":"Bestia della Boscaglia","bn_phoenix":"Fenice Celeste","boss_default":"Boss"},"pl":{"dt_flare":"Ognisty Smok","dt_frost":"Lodowy Smok","dt_storm":"Burzowy Smok","dt_verdant":"Leśny Smok","dt_aether":"Eteryczny Smok","dd_flare":"Wypala całe rzędy kryształów, zamieniając je w energię.","dd_frost":"Zamraża przeszkody i rozbija lód na planszy.","dd_storm":"Poraża losowe kryształy błyskawicami.","dd_verdant":"Wyhodowuje bonusowe kryształy na planszy.","dd_aether":"Tasuje planszę i daje dodatkowe ruchy.","isle_dawn":"Wyspa Świtu","isle_frost":"Mroźne Szczyty","isle_storm":"Burzowy Płaskowyż","isle_emerald":"Szmaragdowy Gąszcz","isle_sky":"Niebiańska Cytadela","bn_ash":"Władca Popiołów","bn_titan":"Lodowy Tytan","bn_storm":"Strażnik Burzy","bn_beast":"Bestia Gąszczu","bn_phoenix":"Niebiański Feniks","boss_default":"Boss"},"tr":{"dt_flare":"Ateş Ejderhası","dt_frost":"Buz Ejderhası","dt_storm":"Fırtına Ejderhası","dt_verdant":"Orman Ejderhası","dt_aether":"Esir Ejderhası","dd_flare":"Kristal sıralarını yakarak enerjiye dönüştürür.","dd_frost":"Engelleri dondurur ve tahtadaki buzu kırar.","dd_storm":"Rastgele kristalleri yıldırımla vurur.","dd_verdant":"Tahtada bonus güçlendirici kristaller büyütür.","dd_aether":"Tahtayı karıştırır ve ekstra hamle verir.","isle_dawn":"Şafak Adası","isle_frost":"Buz Zirveleri","isle_storm":"Fırtına Yaylası","isle_emerald":"Zümrüt Çalılığı","isle_sky":"Gökyüzü Kalesi","bn_ash":"Kül Lordu","bn_titan":"Buz Titanı","bn_storm":"Fırtına Muhafızı","bn_beast":"Çalılık Canavarı","bn_phoenix":"Gökyüzü Anka'sı","boss_default":"Boss"},"ja":{"dt_flare":"ファイアドラゴン","dt_frost":"アイスドラゴン","dt_storm":"ストームドラゴン","dt_verdant":"フォレストドラゴン","dt_aether":"エーテルドラゴン","dd_flare":"列全体のクリスタルを燃やし、エナジーに変える。","dd_frost":"障害物を凍らせ、盤面の氷を砕く。","dd_storm":"ランダムなクリスタルに雷を落とす。","dd_verdant":"盤面にボーナス強化クリスタルを生み出す。","dd_aether":"盤面をシャッフルし、追加の手数を与える。","isle_dawn":"夜明けの島","isle_frost":"氷雪の峰","isle_storm":"嵐の高原","isle_emerald":"エメラルドの茂み","isle_sky":"天空の城塞","bn_ash":"アッシュロード","bn_titan":"フロストタイタン","bn_storm":"ストームウォーデン","bn_beast":"茂みの獣","bn_phoenix":"スカイフェニックス","boss_default":"ボス"},"ko":{"dt_flare":"화염 드래곤","dt_frost":"얼음 드래곤","dt_storm":"폭풍 드래곤","dt_verdant":"숲 드래곤","dt_aether":"에테르 드래곤","dd_flare":"크리스탈 한 줄을 태워 에너지로 바꿉니다.","dd_frost":"장애물을 얼리고 보드의 얼음을 부숩니다.","dd_storm":"무작위 크리스탈에 번개를 내리칩니다.","dd_verdant":"보드에 보너스 강화 크리스탈을 자라게 합니다.","dd_aether":"보드를 섞고 추가 이동을 제공합니다.","isle_dawn":"새벽의 섬","isle_frost":"서리 봉우리","isle_storm":"폭풍 고원","isle_emerald":"에메랄드 덤불","isle_sky":"하늘 성채","bn_ash":"잿빛 군주","bn_titan":"서리 타이탄","bn_storm":"폭풍 수호자","bn_beast":"덤불 야수","bn_phoenix":"하늘 불사조","boss_default":"보스"},"zh":{"dt_flare":"火焰龙","dt_frost":"冰霜龙","dt_storm":"风暴龙","dt_verdant":"森林龙","dt_aether":"以太龙","dd_flare":"烧毁整行水晶，将其转化为能量。","dd_frost":"冰冻障碍并击碎棋盘上的冰块。","dd_storm":"用闪电击中随机水晶。","dd_verdant":"在棋盘上培育奖励强化水晶。","dd_aether":"重新洗牌并给予额外步数。","isle_dawn":"黎明之岛","isle_frost":"霜寒之巅","isle_storm":"风暴高原","isle_emerald":"翡翠丛林","isle_sky":"天空要塞","bn_ash":"灰烬领主","bn_titan":"冰霜泰坦","bn_storm":"风暴守卫","bn_beast":"丛林巨兽","bn_phoenix":"天空凤凰","boss_default":"首领"}};
  Object.keys(CT).forEach(function (l) { if (STR[l]) Object.assign(STR[l], CT[l]); });
  // <<< CONTENT-LANGS END >>>

  // New-dragon names/quotes + legendary rarity (uk + en; other langs fall back to en).
  const DRG = {
    uk: {
      dt_magma: 'Магмовий дракон', dd_magma: 'Кидає розпечену бомбу, що вибухає у зоні 3×3.', dragon_q_magma: 'Земля палає під моїм подихом.',
      dt_tide: 'Припливний дракон', dd_tide: 'Здіймає хвилю-хрест — очищає цілий ряд і стовпець.', dragon_q_tide: 'Хвиля змиває все.',
      dt_shadow: 'Тіньовий дракон', dd_shadow: 'Пожирає всі кристали одного кольору на полі.', dragon_q_shadow: 'Пітьма поглине колір.',
      dt_celestial: 'Небесний дракон', dd_celestial: 'Прикликає метеоритний шторм на все поле.', dragon_q_celestial: 'Небеса впадуть на ворогів.',
      dt_venom: 'Отруйний дракон', dd_venom: 'Розповсюджує отруту, що з’їдає цілу групу одного кольору.', dragon_q_venom: 'Отрута знайде кожного.',
      dt_terra: 'Земляний дракон', dd_terra: 'Викликає землетрус, що трощить нижні ряди поля.', dragon_q_terra: 'Земля здригнеться від мого реву.',
      dt_volt: 'Блискавичний дракон', dd_volt: 'Прикликає ланцюгову блискавку, що розгалужується по полю.', dragon_q_volt: 'Грім кориться моїй волі.',
      rarity_legendary: 'легендарний', sr_legendary: 'легендарний',
      promo_x5: '🔥 АКЦІЯ ×5', promo_bonus: 'Бонус! +20% кристалів',
      ad_loading: 'Реклама завантажується…',
      claim_x2: 'Забрати ×2', wheel_spin_ad: 'Крутити ({n}/5)'
    },
    en: {
      dt_magma: 'Magma Dragon', dd_magma: 'Hurls a molten bomb that blasts a 3×3 area of crystals.', dragon_q_magma: 'The earth burns at my breath.',
      dt_tide: 'Tide Dragon', dd_tide: 'Sends a tidal cross, clearing a full row and column.', dragon_q_tide: 'The wave washes all away.',
      dt_shadow: 'Shadow Dragon', dd_shadow: 'Devours every crystal of one colour on the board.', dragon_q_shadow: 'Darkness swallows all colour.',
      dt_celestial: 'Celestial Dragon', dd_celestial: 'Summons a meteor storm across the whole board.', dragon_q_celestial: 'The heavens fall upon my foes.',
      dt_venom: 'Venom Dragon', dd_venom: 'Spreads a toxic bloom that eats a whole cluster of one colour.', dragon_q_venom: 'The poison finds everyone.',
      dt_terra: 'Terra Dragon', dd_terra: 'Triggers an earthquake that shatters the bottom rows.', dragon_q_terra: 'The earth trembles at my roar.',
      dt_volt: 'Volt Dragon', dd_volt: 'Calls chain lightning that forks in jagged bolts across the board.', dragon_q_volt: 'The thunder obeys my will.',
      rarity_legendary: 'legendary', sr_legendary: 'legendary',
      promo_x5: '🔥 SALE ×5', promo_bonus: 'Bonus! +20% gems',
      ad_loading: 'Loading ad…',
      claim_x2: 'Claim ×2', wheel_spin_ad: 'Spin ({n}/5)'
    }
  };
  Object.keys(DRG).forEach(function (l) { if (STR[l]) Object.assign(STR[l], DRG[l]); });

  const ORDER = ['uk', 'en', 'es', 'de', 'fr', 'pt', 'it', 'pl', 'tr', 'ja', 'ko', 'zh'];

  function currentLang() {
    try {
      const s = global.Save && global.Save.get && global.Save.get().settings;
      if (s && s.language && STR[s.language]) return s.language;
    } catch (e) {}
    return 'en';
  }

  function T(key, params) {
    const lang = currentLang();
    let s = (STR[lang] && STR[lang][key]);
    if (s == null) s = (STR.en[key] != null ? STR.en[key] : STR.uk[key]);
    if (s == null) return key;
    if (params) s = s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] != null ? params[k] : m; });
    return s;
  }

  global.I18N = { STR: STR, ORDER: ORDER, currentLang: currentLang, langName: function (l) { return STR[l] && STR[l].lang_name; } };
  global.T = T;
})(window);
