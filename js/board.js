/* ============================================================
   BOARD — логіка ігрового поля
   Клітинка: null або {
     color: 0..6            — індекс кольору теми
     mod:   null | 'gold' | 'rainbow' | 'bomb' | 'crystal' | 'shield'
     hp:    міцність (щит = 2)
     ice:   0..2            — шар льоду (очищати двічі)
     chain: true            — ланцюг (перший клір ламає ланцюг)
   }
   Плюс шари поля: туман (Set "x,y") і портали (пари клітинок)
   ============================================================ */
class Board {
  constructor(config) {
    this.size = config.size || 8;
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      this.grid.push(new Array(this.size).fill(null));
    }
    this.fog = new Set();
    this.portals = config.portals || [];
    this.applyConfig(config);
  }

  /** Розставити стартові спец-клітинки рівня */
  applyConfig(config) {
    for (const c of config.cells || []) {
      if (c.x >= this.size || c.y >= this.size) continue;
      switch (c.kind) {
        case 'block':    this.grid[c.y][c.x] = { color: c.color, mod: null, hp: 1, ice: 0, chain: false }; break;
        case 'crystal':  this.grid[c.y][c.x] = { color: -1, mod: 'crystal', hp: 1, ice: 0, chain: false }; break;
        case 'ice':      this.grid[c.y][c.x] = { color: c.color, mod: null, hp: 1, ice: c.hp || 2, chain: false }; break;
        case 'chain':    this.grid[c.y][c.x] = { color: c.color, mod: null, hp: 1, ice: 0, chain: true }; break;
        case 'shield':   this.grid[c.y][c.x] = { color: -2, mod: 'shield', hp: c.hp || 2, ice: 0, chain: false }; break;
        case 'goldcell': this.grid[c.y][c.x] = { color: c.color, mod: 'gold', hp: 1, ice: 0, chain: false }; break;
        case 'bombcell': this.grid[c.y][c.x] = { color: c.color, mod: 'bomb', hp: 1, ice: 0, chain: false }; break;
      }
    }
    for (const f of config.fog || []) {
      if (f.x < this.size && f.y < this.size) this.fog.add(f.x + ',' + f.y);
    }
  }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  cellAt(x, y) { return this.inBounds(x, y) ? this.grid[y][x] : undefined; }
  isFogged(x, y) { return this.fog.has(x + ',' + y); }
  portalAt(x, y) {
    for (const p of this.portals) {
      if (p.a.x === x && p.a.y === y) return p.b;
      if (p.b.x === x && p.b.y === y) return p.a;
    }
    return null;
  }

  /** Чи можна поставити фігуру лівим-верхнім кутом у (gx, gy) */
  canPlaceAt(piece, gx, gy) {
    for (const [dx, dy] of piece.cells) {
      const x = gx + dx, y = gy + dy;
      if (!this.inBounds(x, y)) return false;
      if (this.grid[y][x]) return false;
      if (this.isFogged(x, y)) return false;
    }
    return true;
  }

  /** Чи існує хоч одна позиція для фігури */
  canPlaceAnywhere(piece) {
    for (let y = 0; y <= this.size - piece.h; y++) {
      for (let x = 0; x <= this.size - piece.w; x++) {
        if (this.canPlaceAt(piece, x, y)) return true;
      }
    }
    return false;
  }

  /**
   * Поставити фігуру. Повертає список фактично зайнятих клітинок
   * (з урахуванням телепортації через портали) та використані портали.
   */
  place(piece, gx, gy) {
    const placed = [];
    let portalUses = 0;
    piece.cells.forEach(([dx, dy], i) => {
      let x = gx + dx, y = gy + dy;
      const cell = {
        color: piece.color,
        mod: i === piece.modIndex ? piece.mod : null,
        hp: 1, ice: 0, chain: false,
      };
      // Портал: якщо ставимо на вхід і вихід вільний — блок телепортується
      const dest = this.portalAt(x, y);
      if (dest && !this.grid[dest.y][dest.x] && !this.isFogged(dest.x, dest.y)) {
        placed.push({ x: dest.x, y: dest.y, cell, teleportedFrom: { x, y } });
        this.grid[dest.y][dest.x] = cell;
        portalUses++;
      } else {
        placed.push({ x, y, cell });
        this.grid[y][x] = cell;
      }
    });
    return { placed, portalUses };
  }

  /** Знайти повністю заповнені рядки та стовпці (туман блокує лінію) */
  findFullLines() {
    const rows = [], cols = [];
    for (let y = 0; y < this.size; y++) {
      let full = true;
      for (let x = 0; x < this.size; x++) {
        if (!this.grid[y][x] || this.isFogged(x, y)) { full = false; break; }
      }
      if (full) rows.push(y);
    }
    for (let x = 0; x < this.size; x++) {
      let full = true;
      for (let y = 0; y < this.size; y++) {
        if (!this.grid[y][x] || this.isFogged(x, y)) { full = false; break; }
      }
      if (full) cols.push(x);
    }
    return { rows, cols };
  }

  /**
   * Очистити лінії. Логіка міцності:
   *  - лід: -1 шар, блок лишається, поки лід не зійде (останній шар зносить і блок)
   *  - ланцюг: перший клір ламає ланцюг, блок лишається
   *  - щит: -1 hp, при 0 зникає
   *  - бомба: вибухає 3×3 (додаткове очищення, ігнорує міцність)
   *  - кристал/золото: збираються
   * Повертає журнал подій для очок/ефектів/цілей.
   */
  clearLines(rows, cols) {
    const events = {
      removed: [],   // [{x, y, color, mod}]
      iceHit: [], iceBroken: 0,
      chainsBroken: 0, shieldsHit: [], shieldsBroken: 0,
      crystals: 0, gold: 0, rainbow: 0,
      bombs: [],     // центри вибухів
      fogCleared: 0,
    };
    const inLines = new Set();
    for (const y of rows) for (let x = 0; x < this.size; x++) inLines.add(x + ',' + y);
    for (const x of cols) for (let y = 0; y < this.size; y++) inLines.add(x + ',' + y);

    for (const key of inLines) {
      const [x, y] = key.split(',').map(Number);
      this._hitCell(x, y, events, false);
    }

    // Вибухи бомб (каскадом, після основного проходу)
    let guard = 0;
    while (events.bombs.length > 0 && guard++ < 20) {
      const wave = events.bombs.splice(0);
      for (const b of wave) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = b.x + dx, y = b.y + dy;
            if (this.inBounds(x, y)) this._hitCell(x, y, events, true);
          }
        }
        events.explosions = events.explosions || [];
        events.explosions.push(b);
      }
    }

    // Туман розсіюється поруч з очищеними клітинками
    if (this.fog.size > 0) {
      const toClear = [];
      for (const key of this.fog) {
        const [fx, fy] = key.split(',').map(Number);
        const near = events.removed.some(r => Math.abs(r.x - fx) + Math.abs(r.y - fy) === 1);
        if (near) toClear.push(key);
      }
      for (const key of toClear) {
        this.fog.delete(key);
        events.fogCleared++;
        // Клітинка під туманом стає видимою (могла містити блок з конфігу)
      }
    }

    return events;
  }

  /**
   * Один "удар" по клітинці (лінія або вибух).
   * force=true (бомба) ігнорує лід/ланцюги/щити і зносить одразу.
   */
  _hitCell(x, y, events, force) {
    const cell = this.grid[y][x];
    if (!cell) return;
    if (!force) {
      if (cell.ice > 0) {
        cell.ice--;
        events.iceHit.push({ x, y });
        if (cell.ice > 0) return; // лід ще тримається
        events.iceBroken++;
        // лід зійшов повністю — блок теж зникає (падає далі до removed)
      } else if (cell.chain) {
        cell.chain = false;
        events.chainsBroken++;
        return; // ланцюг зламано, блок лишився
      } else if (cell.mod === 'shield') {
        cell.hp--;
        events.shieldsHit.push({ x, y });
        if (cell.hp > 0) return;
        events.shieldsBroken++;
      }
    } else {
      if (cell.ice > 0) { events.iceBroken++; }
      if (cell.chain) { events.chainsBroken++; }
      if (cell.mod === 'shield') { events.shieldsBroken++; }
    }
    // Зносимо блок
    this.grid[y][x] = null;
    events.removed.push({ x, y, color: cell.color, mod: cell.mod });
    if (cell.mod === 'crystal') events.crystals++;
    if (cell.mod === 'gold') events.gold++;
    if (cell.mod === 'rainbow') events.rainbow++;
    if (cell.mod === 'bomb') events.bombs.push({ x, y });
  }

  /** Прямий вибух (бустер "Бомба"): очищає 3×3 навколо центру */
  boosterBlast(cx, cy) {
    const events = { removed: [], iceHit: [], iceBroken: 0, chainsBroken: 0, shieldsHit: [], shieldsBroken: 0, crystals: 0, gold: 0, rainbow: 0, bombs: [], fogCleared: 0 };
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx, y = cy + dy;
        if (this.inBounds(x, y)) {
          this.fog.delete(x + ',' + y) && events.fogCleared++;
          this._hitCell(x, y, events, true);
        }
      }
    }
    return events;
  }

  /** Бустер "Молоток": знести одну клітинку */
  boosterHammer(x, y) {
    const events = { removed: [], iceHit: [], iceBroken: 0, chainsBroken: 0, shieldsHit: [], shieldsBroken: 0, crystals: 0, gold: 0, rainbow: 0, bombs: [], fogCleared: 0 };
    if (this.inBounds(x, y)) this._hitCell(x, y, events, true);
    return events;
  }

  /** Знімок стану (для бустера "Відміна ходу") */
  snapshot() {
    return {
      grid: this.grid.map(row => row.map(c => c ? { ...c } : null)),
      fog: new Set(this.fog),
    };
  }
  restore(snap) {
    this.grid = snap.grid.map(row => row.map(c => c ? { ...c } : null));
    this.fog = new Set(snap.fog);
  }

  /** Кількість заповнених клітинок */
  filledCount() {
    let n = 0;
    for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) if (this.grid[y][x]) n++;
    return n;
  }

  /** Для хардкору: додати випадкову перешкоду в порожню клітинку */
  addRandomObstacle(rng) {
    const empty = [];
    for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
      if (!this.grid[y][x] && !this.isFogged(x, y)) empty.push({ x, y });
    }
    if (empty.length <= 6) return null; // не душимо гравця вкінець
    const spot = empty[Math.floor(rng() * empty.length)];
    this.grid[spot.y][spot.x] = { color: -2, mod: 'shield', hp: 1, ice: 0, chain: false };
    return spot;
  }
}
