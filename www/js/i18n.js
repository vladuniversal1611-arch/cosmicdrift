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
      upgrade_btn: 'Покращити ({cost}🪙)', not_enough_gold: 'Недостатньо золота 🪙', now_level: '{name} тепер рівня {n}!',
      // shop
      shop_title: '🛒 Магазин', rewarded_ad: 'Реклама за винагороду', ad_desc: 'Перегляньте рекламу → +100🪙 та +20⚡',
      watch: 'Дивитись', gems_section: '💎 Кристали', best_price: 'Найкраща ціна',
      gold_section: '🪙 Золото', gold_pack: '{gold} золота', for_gems: 'за {gems}💎',
      boosters_section: '🧪 Бустери', skins_section: '🎨 Косметичні скіни драконів',
      hammer_pack: 'Молот ×3', mix_pack: 'Мікс ×3', moves_pack: 'Ходи ×3',
      hammer_pdesc: 'Розбити будь-який кристал', mix_pdesc: 'Перемішати поле', moves_pdesc: '+5 ходів у грі',
      you_have: 'маєте: {n}', bought: 'Куплено: {name}', not_enough_gems: 'Недостатньо кристалів 💎',
      skin_for: 'Скін для {name}', wear: 'Вдягти', active: '✓ Активний', get_dragon_first: 'Спочатку отримайте дракона {name}',
      skin_unlocked: 'Скін розблоковано!', purchase_ok: 'Покупка успішна: +{n}💎 (демо)', reward_got: 'Нагорода: +100🪙 +20⚡',
      gold_added: '+{n} золота!',
      // battle pass
      pass_title: '🎖️ Бойовий пропуск — Сезон 1', pass_level: 'Рівень {n} / 50', xp_to_next: '{n} / 100 XP до наступного рівня',
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
      pause: '⏸ Пауза', to_map: 'Вийти на карту', ad_waiting: 'Зачекайте...',
      level_intro_goal: 'Ціль: {text}', sugar_bonus: 'БОНУС! +{n}'
    },

    en: {
      lang_name: 'English',
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
      upgrade_btn: 'Upgrade ({cost}🪙)', not_enough_gold: 'Not enough gold 🪙', now_level: '{name} is now level {n}!',
      shop_title: '🛒 Shop', rewarded_ad: 'Rewarded ad', ad_desc: 'Watch an ad → +100🪙 and +20⚡',
      watch: 'Watch', gems_section: '💎 Gems', best_price: 'Best value',
      gold_section: '🪙 Gold', gold_pack: '{gold} gold', for_gems: 'for {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Dragon cosmetic skins',
      hammer_pack: 'Hammer ×3', mix_pack: 'Mix ×3', moves_pack: 'Moves ×3',
      hammer_pdesc: 'Smash any crystal', mix_pdesc: 'Shuffle the board', moves_pdesc: '+5 moves in-game',
      you_have: 'you have: {n}', bought: 'Bought: {name}', not_enough_gems: 'Not enough gems 💎',
      skin_for: 'Skin for {name}', wear: 'Equip', active: '✓ Active', get_dragon_first: 'Get the {name} dragon first',
      skin_unlocked: 'Skin unlocked!', purchase_ok: 'Purchase complete: +{n}💎 (demo)', reward_got: 'Reward: +100🪙 +20⚡',
      gold_added: '+{n} gold!',
      pass_title: '🎖️ Battle Pass — Season 1', pass_level: 'Tier {n} / 50', xp_to_next: '{n} / 100 XP to next tier',
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
      pause: '⏸ Paused', to_map: 'Exit to map', ad_waiting: 'Please wait...',
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
      upgrade_btn: 'Mejorar ({cost}🪙)', not_enough_gold: 'Falta oro 🪙', now_level: '¡{name} ahora es nivel {n}!',
      shop_title: '🛒 Tienda', rewarded_ad: 'Anuncio con recompensa', ad_desc: 'Mira un anuncio → +100🪙 y +20⚡',
      watch: 'Ver', gems_section: '💎 Gemas', best_price: 'Mejor precio',
      gold_section: '🪙 Oro', gold_pack: '{gold} oro', for_gems: 'por {gems}💎',
      boosters_section: '🧪 Potenciadores', skins_section: '🎨 Aspectos de dragones',
      hammer_pack: 'Martillo ×3', mix_pack: 'Mezcla ×3', moves_pack: 'Mov. ×3',
      hammer_pdesc: 'Rompe cualquier cristal', mix_pdesc: 'Mezcla el tablero', moves_pdesc: '+5 movimientos',
      you_have: 'tienes: {n}', bought: 'Comprado: {name}', not_enough_gems: 'Faltan gemas 💎',
      skin_for: 'Aspecto para {name}', wear: 'Equipar', active: '✓ Activo', get_dragon_first: 'Consigue primero el dragón {name}',
      skin_unlocked: '¡Aspecto desbloqueado!', purchase_ok: 'Compra completa: +{n}💎 (demo)', reward_got: 'Premio: +100🪙 +20⚡',
      gold_added: '¡+{n} oro!',
      pass_title: '🎖️ Pase de batalla — Temporada 1', pass_level: 'Nivel {n} / 50', xp_to_next: '{n} / 100 XP al siguiente',
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
      upgrade_btn: 'Verbessern ({cost}🪙)', not_enough_gold: 'Zu wenig Gold 🪙', now_level: '{name} ist jetzt Level {n}!',
      shop_title: '🛒 Shop', rewarded_ad: 'Belohnte Werbung', ad_desc: 'Werbung ansehen → +100🪙 und +20⚡',
      watch: 'Ansehen', gems_section: '💎 Edelsteine', best_price: 'Bester Wert',
      gold_section: '🪙 Gold', gold_pack: '{gold} Gold', for_gems: 'für {gems}💎',
      boosters_section: '🧪 Booster', skins_section: '🎨 Drachen-Skins',
      hammer_pack: 'Hammer ×3', mix_pack: 'Mix ×3', moves_pack: 'Züge ×3',
      hammer_pdesc: 'Zerschlage jeden Kristall', mix_pdesc: 'Mische das Feld', moves_pdesc: '+5 Züge im Spiel',
      you_have: 'du hast: {n}', bought: 'Gekauft: {name}', not_enough_gems: 'Zu wenig Edelsteine 💎',
      skin_for: 'Skin für {name}', wear: 'Anlegen', active: '✓ Aktiv', get_dragon_first: 'Hol dir zuerst den Drachen {name}',
      skin_unlocked: 'Skin freigeschaltet!', purchase_ok: 'Kauf abgeschlossen: +{n}💎 (Demo)', reward_got: 'Belohnung: +100🪙 +20⚡',
      gold_added: '+{n} Gold!',
      pass_title: '🎖️ Battle Pass — Saison 1', pass_level: 'Stufe {n} / 50', xp_to_next: '{n} / 100 XP zur nächsten Stufe',
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
      upgrade_btn: 'Améliorer ({cost}🪙)', not_enough_gold: 'Pas assez d’or 🪙', now_level: '{name} est maintenant niveau {n} !',
      shop_title: '🛒 Boutique', rewarded_ad: 'Pub récompensée', ad_desc: 'Regardez une pub → +100🪙 et +20⚡',
      watch: 'Voir', gems_section: '💎 Gemmes', best_price: 'Meilleur prix',
      gold_section: '🪙 Or', gold_pack: '{gold} or', for_gems: 'pour {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Skins de dragons',
      hammer_pack: 'Marteau ×3', mix_pack: 'Mix ×3', moves_pack: 'Coups ×3',
      hammer_pdesc: 'Brise n’importe quel cristal', mix_pdesc: 'Mélange le plateau', moves_pdesc: '+5 coups en jeu',
      you_have: 'vous avez : {n}', bought: 'Acheté : {name}', not_enough_gems: 'Pas assez de gemmes 💎',
      skin_for: 'Skin pour {name}', wear: 'Équiper', active: '✓ Actif', get_dragon_first: 'Obtenez d’abord le dragon {name}',
      skin_unlocked: 'Skin débloqué !', purchase_ok: 'Achat effectué : +{n}💎 (démo)', reward_got: 'Récompense : +100🪙 +20⚡',
      gold_added: '+{n} or !',
      pass_title: '🎖️ Passe de combat — Saison 1', pass_level: 'Palier {n} / 50', xp_to_next: '{n} / 100 XP au palier suivant',
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
      upgrade_btn: 'Melhorar ({cost}🪙)', not_enough_gold: 'Ouro insuficiente 🪙', now_level: '{name} agora é nível {n}!',
      shop_title: '🛒 Loja', rewarded_ad: 'Anúncio premiado', ad_desc: 'Assista a um anúncio → +100🪙 e +20⚡',
      watch: 'Assistir', gems_section: '💎 Gemas', best_price: 'Melhor preço',
      gold_section: '🪙 Ouro', gold_pack: '{gold} ouro', for_gems: 'por {gems}💎',
      boosters_section: '🧪 Boosters', skins_section: '🎨 Visuais de dragões',
      hammer_pack: 'Martelo ×3', mix_pack: 'Mistura ×3', moves_pack: 'Jogadas ×3',
      hammer_pdesc: 'Quebre qualquer cristal', mix_pdesc: 'Embaralhe o tabuleiro', moves_pdesc: '+5 jogadas no jogo',
      you_have: 'você tem: {n}', bought: 'Comprado: {name}', not_enough_gems: 'Gemas insuficientes 💎',
      skin_for: 'Visual para {name}', wear: 'Equipar', active: '✓ Ativo', get_dragon_first: 'Consiga primeiro o dragão {name}',
      skin_unlocked: 'Visual desbloqueado!', purchase_ok: 'Compra concluída: +{n}💎 (demo)', reward_got: 'Prêmio: +100🪙 +20⚡',
      gold_added: '+{n} ouro!',
      pass_title: '🎖️ Passe de batalha — Temporada 1', pass_level: 'Nível {n} / 50', xp_to_next: '{n} / 100 XP para o próximo',
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
      rarity_common: 'Звичайне', rarity_rare: 'Рідкісне', rarity_epic: 'ЕПІЧНЕ',
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
      story_title: 'Історія', chapter_n: 'Розділ {n}', story_locked: 'Відкриється на рівні {n}',
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
      rarity_common: 'Common', rarity_rare: 'Rare', rarity_epic: 'EPIC',
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
      story_title: 'Story', chapter_n: 'Chapter {n}', story_locked: 'Unlocks at level {n}',
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
      rarity_common: 'Común', rarity_rare: 'Raro', rarity_epic: 'ÉPICO',
      skills_title: 'Árbol de talentos', skills_sub: 'Bonos permanentes por gemas 💎', maxed: 'MÁX',
      sk_moves: 'Agilidad', sk_moves_d: '+1 movimiento al inicio', sk_charge: 'Furia', sk_charge_d: '+8% carga de dragones',
      sk_score: 'Sabiduría', sk_score_d: '+6% puntuación', sk_power: 'Poder', sk_power_d: '+1 poder de dragón',
      sk_gold: 'Fortuna', sk_gold_d: '+8% oro por nivel', sk_start: 'Visión', sk_start_d: '+1 cristal especial al inicio',
      pvp_title: 'Duelos', pvp_trophies: '{n} trofeos', pvp_record: '{w}V / {l}D',
      pvp_sub: '¡Elige rival y supera su puntuación en 45s!', pvp_easy: 'Fácil', pvp_even: 'Igual', pvp_hard: 'Difícil',
      pvp_target: 'meta {n}', pvp_fight: 'Luchar ⚔️', pvp_win: '¡Victoria!', pvp_lose: 'Derrota', pvp_again: 'Otra vez',
      story_title: 'Historia', chapter_n: 'Capítulo {n}', story_locked: 'Se abre en el nivel {n}'
    },
    de: {
      t_wheel: 'Rad', t_summon: 'Rufen', t_skills: 'Talente', t_pvp: 'Duell', t_story: 'Story',
      wheel_title: '🎡 Glücksrad', wheel_free: 'Gratis-Dreh bereit!', wheel_cost: 'Extra-Dreh: {n}💎',
      wheel_spin_free: '🎡 Gratis drehen', wheel_spin_gems: '🎡 Drehen ({n}💎)', need_gems: 'Zu wenig Edelsteine 💎',
      summon_title: 'Drachen rufen', summon_hint: 'Rufe einen Schatz aus dem alten Ei', summon_do: 'Rufen ({n}💎)',
      rarity_common: 'Gewöhnlich', rarity_rare: 'Selten', rarity_epic: 'EPISCH',
      skills_title: 'Talentbaum', skills_sub: 'Dauerhafte Boni für Edelsteine 💎', maxed: 'MAX',
      sk_moves: 'Agilität', sk_moves_d: '+1 Zug zu Beginn', sk_charge: 'Zorn', sk_charge_d: '+8% Drachenladung',
      sk_score: 'Weisheit', sk_score_d: '+6% Punkte', sk_power: 'Macht', sk_power_d: '+1 Drachenkraft',
      sk_gold: 'Reichtum', sk_gold_d: '+8% Gold pro Level', sk_start: 'Weitsicht', sk_start_d: '+1 Spezialkristall zu Beginn',
      pvp_title: 'Duelle', pvp_trophies: '{n} Trophäen', pvp_record: '{w}S / {l}N',
      pvp_sub: 'Wähle einen Rivalen und schlage seinen Score in 45s!', pvp_easy: 'Leicht', pvp_even: 'Gleich', pvp_hard: 'Schwer',
      pvp_target: 'Ziel {n}', pvp_fight: 'Kämpfen ⚔️', pvp_win: 'Sieg!', pvp_lose: 'Niederlage', pvp_again: 'Nochmal',
      story_title: 'Story', chapter_n: 'Kapitel {n}', story_locked: 'Ab Level {n}'
    },
    fr: {
      t_wheel: 'Roue', t_summon: 'Invoquer', t_skills: 'Talents', t_pvp: 'Duel', t_story: 'Histoire',
      wheel_title: '🎡 Roue de la Fortune', wheel_free: 'Tour gratuit prêt !', wheel_cost: 'Tour extra : {n}💎',
      wheel_spin_free: '🎡 Tourner gratis', wheel_spin_gems: '🎡 Tourner ({n}💎)', need_gems: 'Pas assez de gemmes 💎',
      summon_title: 'Invoquer un dragon', summon_hint: 'Invoque un trésor de l’œuf ancien', summon_do: 'Invoquer ({n}💎)',
      rarity_common: 'Commun', rarity_rare: 'Rare', rarity_epic: 'ÉPIQUE',
      skills_title: 'Arbre de talents', skills_sub: 'Bonus permanents contre gemmes 💎', maxed: 'MAX',
      sk_moves: 'Agilité', sk_moves_d: '+1 coup au départ', sk_charge: 'Furie', sk_charge_d: '+8% charge des dragons',
      sk_score: 'Sagesse', sk_score_d: '+6% score', sk_power: 'Puissance', sk_power_d: '+1 puissance de dragon',
      sk_gold: 'Fortune', sk_gold_d: '+8% or par niveau', sk_start: 'Clairvoyance', sk_start_d: '+1 cristal spécial au départ',
      pvp_title: 'Duels', pvp_trophies: '{n} trophées', pvp_record: '{w}V / {l}D',
      pvp_sub: 'Choisis un rival et bats son score en 45s !', pvp_easy: 'Facile', pvp_even: 'Égal', pvp_hard: 'Difficile',
      pvp_target: 'cible {n}', pvp_fight: 'Combattre ⚔️', pvp_win: 'Victoire !', pvp_lose: 'Défaite', pvp_again: 'Rejouer',
      story_title: 'Histoire', chapter_n: 'Chapitre {n}', story_locked: 'Débloqué au niveau {n}'
    },
    pt: {
      t_wheel: 'Roleta', t_summon: 'Invocar', t_skills: 'Talentos', t_pvp: 'Duelo', t_story: 'História',
      wheel_title: '🎡 Roda da Fortuna', wheel_free: 'Giro grátis pronto!', wheel_cost: 'Giro extra: {n}💎',
      wheel_spin_free: '🎡 Girar grátis', wheel_spin_gems: '🎡 Girar ({n}💎)', need_gems: 'Gemas insuficientes 💎',
      summon_title: 'Invocar dragão', summon_hint: 'Invoque um tesouro do ovo antigo', summon_do: 'Invocar ({n}💎)',
      rarity_common: 'Comum', rarity_rare: 'Raro', rarity_epic: 'ÉPICO',
      skills_title: 'Árvore de talentos', skills_sub: 'Bônus permanentes por gemas 💎', maxed: 'MÁX',
      sk_moves: 'Agilidade', sk_moves_d: '+1 jogada no início', sk_charge: 'Fúria', sk_charge_d: '+8% carga dos dragões',
      sk_score: 'Sabedoria', sk_score_d: '+6% pontos', sk_power: 'Poder', sk_power_d: '+1 poder de dragão',
      sk_gold: 'Fortuna', sk_gold_d: '+8% ouro por nível', sk_start: 'Visão', sk_start_d: '+1 cristal especial no início',
      pvp_title: 'Duelos', pvp_trophies: '{n} troféus', pvp_record: '{w}V / {l}D',
      pvp_sub: 'Escolha um rival e supere a pontuação em 45s!', pvp_easy: 'Fácil', pvp_even: 'Igual', pvp_hard: 'Difícil',
      pvp_target: 'meta {n}', pvp_fight: 'Lutar ⚔️', pvp_win: 'Vitória!', pvp_lose: 'Derrota', pvp_again: 'De novo',
      story_title: 'História', chapter_n: 'Capítulo {n}', story_locked: 'Abre no nível {n}'
    }
  };
  Object.keys(MX).forEach(function (l) { Object.assign(STR[l], MX[l]); });
  const HARD = { uk: 'Складний рівень', en: 'Hard level', es: 'Nivel difícil', de: 'Schweres Level', fr: 'Niveau difficile', pt: 'Nível difícil' };
  Object.keys(HARD).forEach(function (l) { STR[l].hard_level = HARD[l]; });

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

  const ORDER = ['uk', 'en', 'es', 'de', 'fr', 'pt'];

  function currentLang() {
    try {
      const s = global.Save && global.Save.get && global.Save.get().settings;
      if (s && s.language && STR[s.language]) return s.language;
    } catch (e) {}
    return 'uk';
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
