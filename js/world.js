/* ============================================================
   ASHES OF ELDORIA — world.js
   The open world: seeded procedural terrain + hand-placed
   towns, the capital, war front, demon lands and dungeons.
   Every client generates the identical world from one seed.
   ============================================================ */
(function () {
  'use strict';
  const WORLD = (window.WORLD = {});
  const SEED = 133742;

  // ---------------- tile registry ----------------
  // flags: s=solid, w=water(swim/block), d=damage
  const TILES = WORLD.TILES = [
    { k: 'grass' }, { k: 'grass2' }, { k: 'tallgrass' }, { k: 'flowers' },
    { k: 'dirt' }, { k: 'path' }, { k: 'stonepath' }, { k: 'sand' },
    { k: 'snow' }, { k: 'swamp' }, { k: 'corrupt' }, { k: 'ashes' },
    { k: 'water', w: 1, anim: 1 }, { k: 'deepwater', w: 1, anim: 1 }, { k: 'lava', w: 1, d: 8, anim: 1 },
    { k: 'mountain', s: 1 }, { k: 'snowmountain', s: 1 },
    { k: 'cavefloor' }, { k: 'cavewall', s: 1 },
    { k: 'cryptfloor' }, { k: 'cryptwall', s: 1 },
    { k: 'icefloor' }, { k: 'icewall', s: 1 },
    { k: 'firefloor' }, { k: 'firewall', s: 1 },
    { k: 'demonfloor' }, { k: 'demonwall', s: 1 },
    { k: 'floorwood' }, { k: 'floorstone' }, { k: 'carpet' }, { k: 'carpetC' },
    { k: 'wallwood', s: 1 }, { k: 'wallstone', s: 1 }, { k: 'castlewall', s: 1 },
    { k: 'roofR', s: 1 }, { k: 'roofB', s: 1 }, { k: 'roofP', s: 1 }, { k: 'roofG', s: 1 }, { k: 'roofY', s: 1 },
    { k: 'door' }, { k: 'window', s: 1 }, { k: 'bridge' }, { k: 'fence', s: 1 },
    { k: 'arenasand' }, { k: 'farm' }, { k: 'herbplant' },
  ];
  const TID = {}; TILES.forEach((t, i) => TID[t.k] = i);
  WORLD.TID = TID;
  // minimap colors per tile
  WORLD.TILE_COLORS = {
    grass: '#4f9c48', grass2: '#539f4c', tallgrass: '#458c40', flowers: '#5aa452',
    dirt: '#9c7442', path: '#c2a26a', stonepath: '#a8a49c', sand: '#e0c078',
    snow: '#e8ecf2', swamp: '#5a7040', corrupt: '#5c3a5e', ashes: '#6a5e5c',
    water: '#3f74c8', deepwater: '#2a4f96', lava: '#d84a1a',
    mountain: '#7c7268', snowmountain: '#a4a8b8',
    cavefloor: '#5c5248', cavewall: '#38302a', cryptfloor: '#6a6a78', cryptwall: '#3c3c4c',
    icefloor: '#b8d8ec', icewall: '#4a7cb0', firefloor: '#6e4034', firewall: '#42221c',
    demonfloor: '#4a2c48', demonwall: '#2c1a30',
    floorwood: '#b0803e', floorstone: '#98948c', carpet: '#a82a34', carpetC: '#a82a34',
    wallwood: '#8a5a2c', wallstone: '#8c8880', castlewall: '#a0a4b0',
    roofR: '#c04a38', roofB: '#4a68b0', roofP: '#8a4fc8', roofG: '#4fa04a', roofY: '#d8a83a',
    door: '#6e421f', window: '#8cc8e8', bridge: '#a06a35', fence: '#8a5a2c',
    arenasand: '#d8b478', farm: '#8a6236', herbplant: '#4f9c48',
  };

  // ---------------- noise ----------------
  function makeNoise(seed) {
    const r = PXA.mulberry(seed);
    const size = 256, grid = new Float32Array(size * size);
    for (let i = 0; i < grid.length; i++) grid[i] = r();
    function at(x, y) {
      const xi = ((Math.floor(x) % size) + size) % size, yi = ((Math.floor(y) % size) + size) % size;
      const xf = x - Math.floor(x), yf = y - Math.floor(y);
      const x2 = (xi + 1) % size, y2 = (yi + 1) % size;
      const a = grid[yi * size + xi], b = grid[yi * size + x2], c = grid[y2 * size + xi], d = grid[y2 * size + x2];
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    }
    return function (x, y, oct) {
      let sum = 0, amp = 1, freq = 1, norm = 0;
      for (let o = 0; o < (oct || 3); o++) { sum += at(x * freq, y * freq) * amp; norm += amp; amp *= 0.5; freq *= 2; }
      return sum / norm;
    };
  }

  // ---------------- map container ----------------
  WORLD.maps = {};
  function newMap(id, name, w, h, fillTile, music) {
    const m = {
      id, name, w, h, music: music || 'overworld',
      tiles: new Uint8Array(w * h),
      objects: [],          // {type:'tree'|'rock'|..., x,y(tile), solid}
      objSolid: new Set(),  // packed solid object coords
      npcs: [],             // {id, name, x, y(px), look, dial, action, wander}
      exits: [],            // {x,y,w,h(tiles), to, tx, ty}
      chests: [],           // {x,y,tier,opened:false,id}
      mobZones: [],         // {x,y,w,h, mobs:[ids], max, lvl}
      bossSpawn: null,
      safe: false, dark: false,
      spawnPoint: null,
    };
    m.tiles.fill(fillTile);
    WORLD.maps[id] = m;
    return m;
  }
  function setT(m, x, y, t) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.tiles[y * m.w + x] = t; }
  function getT(m, x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return TID.mountain; return m.tiles[y * m.w + x]; }
  WORLD.getT = getT;
  function rect(m, x, y, w, h, t) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setT(m, i, j, t); }
  function addObj(m, type, x, y, solid, extra) {
    const o = Object.assign({ type, x, y, solid: !!solid }, extra || {});
    m.objects.push(o);
    if (solid) m.objSolid.add(y * m.w + x);
    return o;
  }
  WORLD.addObj = addObj;
  function removeObj(m, o) {
    const i = m.objects.indexOf(o);
    if (i >= 0) m.objects.splice(i, 1);
    if (o.solid) m.objSolid.delete(o.y * m.w + o.x);
  }
  WORLD.removeObj = removeObj;

  WORLD.isSolid = function (m, tx, ty) {
    const t = TILES[getT(m, tx, ty)];
    if (!t) return true;
    if (t.s || t.w) return true;
    if (m.objSolid.has(ty * m.w + tx)) return true;
    return false;
  };
  WORLD.tileDamage = function (m, tx, ty) {
    const t = TILES[getT(m, tx, ty)];
    return t && t.d ? t.d : 0;
  };

  // ============================================================
  // OVERWORLD
  // ============================================================
  const OW = 320, OH = 320;
  WORLD.locations = []; // {name,x,y,kind} for map labels

  function genOverworld() {
    const m = newMap('overworld', 'Eldoria', OW, OH, TID.grass, 'overworld');
    const elev = makeNoise(SEED), moist = makeNoise(SEED + 999), det = makeNoise(SEED + 555);
    const rr = PXA.mulberry(SEED + 77);

    for (let y = 0; y < OH; y++) {
      for (let x = 0; x < OW; x++) {
        const e = elev(x / 46, y / 46, 4);
        const mo = moist(x / 38, y / 38, 3);
        const d = det(x / 7, y / 7, 2);
        let t = TID.grass;
        // edges of the continent = deep water
        const ex = Math.min(x, OW - 1 - x), ey = Math.min(y, OH - 1 - y);
        const edge = Math.min(ex, ey);
        const coast = edge < 26 ? (26 - edge) / 26 : 0;
        const ee = e - coast * 0.55;
        // corruption in NE
        const cor = Math.max(0, 1 - (Math.hypot(x - 290, y - 60) / 105));
        // snow in the north band
        const snow = y < 78 && cor < 0.25;
        // desert in the SW
        const des = (x < 150 && y > 245);
        if (ee < 0.30) t = TID.deepwater;
        else if (ee < 0.36) t = TID.water;
        else if (ee > 0.74) t = snow ? TID.snowmountain : TID.mountain;
        else if (cor > 0.42) t = cor > 0.72 ? TID.ashes : TID.corrupt;
        else if (snow) t = TID.snow;
        else if (des) t = TID.sand;
        else if (mo > 0.66 && y > 220 && x > 160) t = TID.swamp;
        else {
          t = d < 0.35 ? TID.grass2 : TID.grass;
          if (d > 0.8) t = TID.tallgrass;
          if (d > 0.62 && d < 0.66) t = TID.flowers;
        }
        setT(m, x, y, t);
      }
    }
    // scatter trees / rocks / herbs by biome
    for (let y = 2; y < OH - 2; y++) {
      for (let x = 2; x < OW - 2; x++) {
        const t = getT(m, x, y);
        const v = rr();
        if (t === TID.grass || t === TID.grass2) {
          const mo = moist(x / 38, y / 38, 3);
          if (mo > 0.55 && v < 0.11) addObj(m, 'tree', x, y, true);
          else if (v < 0.012) addObj(m, 'rock', x, y, true);
          else if (v > 0.995) addObj(m, 'herb', x, y, false, { pick: 'herb' });
        } else if (t === TID.snow && v < 0.08) addObj(m, 'pine', x, y, true);
        else if (t === TID.sand && v < 0.03) addObj(m, v < 0.015 ? 'cactus' : 'palm', x, y, true);
        else if (t === TID.swamp && v < 0.05) addObj(m, 'deadtree', x, y, true);
        else if ((t === TID.corrupt || t === TID.ashes) && v < 0.04) addObj(m, v < 0.02 ? 'deadtree' : 'crystal', x, y, true, v >= 0.02 ? { pick: 'magic_stone' } : null);
        else if (t === TID.mountain && v < 0.004) { /* keep */ }
        if ((t === TID.grass || t === TID.grass2) && v > 0.9985) addObj(m, 'orevein', x, y, true, { pick: 'iron_ore' });
        if (t === TID.corrupt && v > 0.996) addObj(m, 'orevein', x, y, true, { pick: 'iron_ore' });
        if (t === TID.snow && v > 0.9975) addObj(m, 'crystal', x, y, true, { pick: 'crystal_shard' });
      }
    }
    return m;
  }

  // ---------------- town building helpers ----------------
  function clearArea(m, x, y, w, h, ground) {
    rect(m, x, y, w, h, ground);
    m.objects = m.objects.filter(o => {
      const inside = o.x >= x - 1 && o.x < x + w + 1 && o.y >= y - 1 && o.y < y + h + 1;
      if (inside && o.solid) m.objSolid.delete(o.y * m.w + o.x);
      return !inside;
    });
  }
  // house: roof rows + wall row + door; returns door coords
  function house(m, x, y, w, h, roof, opts) {
    opts = opts || {};
    for (let j = 0; j < h - 1; j++) rect(m, x, y + j, w, 1, roof);
    rect(m, x, y + h - 1, w, 1, opts.wall || TID.wallwood);
    const dx = x + (opts.doorOff != null ? opts.doorOff : (w >> 1));
    setT(m, dx, y + h - 1, TID.door);
    if (w >= 5) { setT(m, x + 1, y + h - 1, TID.window); setT(m, x + w - 2, y + h - 1, TID.window); }
    if (opts.sign) addObj(m, 'sign', dx + 1, y + h - 1, false, { signText: opts.sign });
    return { x: dx, y: y + h - 1 };
  }
  function addDoorAction(m, door, action) {
    m.npcs.push({ id: 'door_' + door.x + '_' + door.y, doorAction: action, x: door.x * 16 + 8, y: door.y * 16 + 20, invisible: true, r: 20 });
  }
  function npc(m, id, name, tx, ty, look, opts) {
    const n = Object.assign({ id, name, x: tx * 16 + 8, y: ty * 16 + 8, look, wander: 0, r: 26 }, opts || {});
    m.npcs.push(n);
    return n;
  }
  function road(m, x1, y1, x2, y2, tile) {
    tile = tile == null ? TID.path : tile;
    let x = x1, y = y1;
    const rr = PXA.mulberry(x1 * 31 + y1 * 17 + 3);
    let guard = 0;
    while ((x !== x2 || y !== y2) && guard++ < 4000) {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const t = getT(m, x + dx, y + dy);
        if (t === TID.water || t === TID.deepwater) setT(m, x + dx, y + dy, TID.bridge);
        else if (!TILES[t].s) setT(m, x + dx, y + dy, tile);
        // clear blocking objects on the road
        m.objects = m.objects.filter(o => {
          if (o.x === x + dx && o.y === y + dy && o.solid) { m.objSolid.delete(o.y * m.w + o.x); return false; }
          return true;
        });
      }
      const horiz = Math.abs(x2 - x) > Math.abs(y2 - y) ? rr() < 0.75 : rr() < 0.25;
      if (horiz && x !== x2) x += Math.sign(x2 - x);
      else if (y !== y2) y += Math.sign(y2 - y);
      else if (x !== x2) x += Math.sign(x2 - x);
    }
  }
  function dungeonEntrance(m, x, y, to, label) {
    clearArea(m, x - 2, y - 2, 5, 5, getT(m, x - 3, y - 3) === TID.snow ? TID.snow : TID.dirt);
    rect(m, x - 1, y - 1, 3, 2, TID.cavewall);
    setT(m, x, y, TID.cavefloor);
    m.exits.push({ x, y, w: 1, h: 1, to, tx: 0, ty: 0, useSpawn: true });
    addObj(m, 'sign', x + 1, y, false, { signText: label });
    WORLD.locations.push({ name: label, x, y, kind: 'dungeon' });
  }

  // ---------------- Riverwood (starting village) ----------------
  function buildRiverwood(m) {
    const X = 52, Y = 178;
    clearArea(m, X - 3, Y - 3, 40, 30, TID.grass);
    rect(m, X, Y + 10, 34, 2, TID.path);
    rect(m, X + 15, Y, 2, 24, TID.path);
    // inn
    let d = house(m, X + 2, Y + 2, 7, 6, TID.roofR, { sign: 'The Sleepy Slime Inn' });
    addDoorAction(m, d, { kind: 'inn' });
    npc(m, 'rw_inn', 'Innkeeper Marla', X + 5, Y + 9, { hair: 3, skin: 0, cls: 'swordsman', armorColor: '#8a5a2c', armorDark: '#5c3a18' }, { dial: 'innkeeper', action: { kind: 'inn' } });
    // smithy
    d = house(m, X + 11, Y + 2, 6, 6, TID.roofB, { sign: 'Riverwood Smithy' });
    addDoorAction(m, d, { kind: 'shop', shop: 'riverwood_black' });
    addObj(m, 'anvil', X + 12, Y + 8, true);
    // general store
    d = house(m, X + 19, Y + 2, 6, 6, TID.roofG, { sign: 'General Store' });
    addDoorAction(m, d, { kind: 'shop', shop: 'riverwood_gen' });
    // adventurer guild (branch)
    d = house(m, X + 26, Y + 1, 8, 7, TID.roofY, { sign: 'Adventurer Guild' });
    addDoorAction(m, d, { kind: 'guild' });
    npc(m, 'rw_gm', 'Guildmaster Berta', X + 30, Y + 9, { hair: 2, skin: 1, cls: 'swordsman', armorColor: '#8a2417', armorDark: '#5c1408' }, { dial: 'guildmaster', action: { kind: 'guild' }, story: 'guildmaster' });
    // elder's house
    d = house(m, X + 4, Y + 14, 7, 6, TID.roofP, { sign: 'Elder\'s House' });
    npc(m, 'rw_elder', 'Elder Rowan', X + 7, Y + 21, { hair: 4, skin: 0, cls: 'tank', armorColor: '#6b5233', armorDark: '#4a3820' }, { dial: 'elder', story: 'elder' });
    // cottages
    house(m, X + 13, Y + 14, 5, 5, TID.roofR);
    house(m, X + 20, Y + 14, 5, 5, TID.roofG);
    addObj(m, 'well', X + 16, Y + 11, true);
    // crafting bench (campfire) + dummy
    addObj(m, 'campfire', X + 26, Y + 12, false, { craft: true });
    addObj(m, 'dummy', X + 31, Y + 12, true);
    // fences + herbs
    for (let i = 0; i < 6; i++) setT(m, X + 2 + i, Y + 24, TID.fence);
    for (let i = 0; i < 4; i++) addObj(m, 'herb', X + 2 + i, Y + 25, false, { pick: 'herb' });
    // villagers
    npc(m, 'rw_v1', 'Farmer Tobb', X + 22, Y + 12, { hair: 0, skin: 1, cls: 'swordsman', armorColor: '#8a6236', armorDark: '#5c3a18' }, { wander: 40, chat: ['The slimes ate my cabbages again...', 'Heard the capital pays good coin for adventurers.'] });
    npc(m, 'rw_v2', 'Lily', X + 8, Y + 12, { hair: 3, skin: 0, cls: 'mage', armorColor: '#c8607a', armorDark: '#8a3050' }, { wander: 40, chat: ['Papa says never go north-east. The sky is purple there.', 'Did you see the King Slime? They say it wears a crown!'] });
    m.spawnPoint = { x: (X + 16) * 16, y: (Y + 12) * 16 };
    m.safeZones = m.safeZones || [];
    m.safeZones.push({ x: X - 3, y: Y - 3, w: 40, h: 30, name: 'Riverwood', spawn: { x: (X + 16) * 16, y: (Y + 12) * 16 } });
    WORLD.locations.push({ name: 'Riverwood', x: X + 17, y: Y + 12, kind: 'village' });
  }

  // ---------------- Oakstead ----------------
  function buildOakstead(m) {
    const X = 118, Y = 232;
    clearArea(m, X - 2, Y - 2, 28, 22, TID.grass);
    rect(m, X, Y + 8, 24, 2, TID.path);
    let d = house(m, X + 2, Y + 1, 6, 6, TID.roofR, { sign: 'Oak Rest Inn' });
    addDoorAction(m, d, { kind: 'inn' });
    d = house(m, X + 10, Y + 1, 6, 6, TID.roofG, { sign: 'Trading Post' });
    addDoorAction(m, d, { kind: 'shop', shop: 'oakstead_gen' });
    house(m, X + 18, Y + 1, 5, 6, TID.roofB);
    // farms
    rect(m, X + 2, Y + 12, 8, 5, TID.farm);
    rect(m, X + 12, Y + 12, 8, 5, TID.farm);
    npc(m, 'oak_elder', 'Elder Maren', X + 20, Y + 9, { hair: 4, skin: 1, cls: 'tank', armorColor: '#6b5233', armorDark: '#4a3820' }, { dial: 'elder', deliverTarget: 'oakstead', chat: ['Oakstead feeds half the kingdom, you know.', 'The war takes our young folk. Bring them home safe.'] });
    npc(m, 'oak_v1', 'Farmhand Pip', X + 8, Y + 13, { hair: 0, skin: 2, cls: 'swordsman', armorColor: '#8a6236', armorDark: '#5c3a18' }, { wander: 40, chat: ['Wolves in the west woods. Big ones.'] });
    m.safeZones.push({ x: X - 2, y: Y - 2, w: 28, h: 22, name: 'Oakstead', spawn: { x: (X + 12) * 16, y: (Y + 9) * 16 } });
    WORLD.locations.push({ name: 'Oakstead', x: X + 12, y: Y + 9, kind: 'village' });
  }

  // ---------------- Aldenhaven (capital) ----------------
  function buildAldenhaven(m) {
    const X = 186, Y = 132; const W = 52, H = 44;
    clearArea(m, X - 2, Y - 2, W + 4, H + 4, TID.grass);
    rect(m, X, Y, W, H, TID.stonepath);
    // city walls
    for (let i = 0; i < W; i++) { setT(m, X + i, Y, TID.castlewall); setT(m, X + i, Y + H - 1, TID.castlewall); }
    for (let j = 0; j < H; j++) { setT(m, X, Y + j, TID.castlewall); setT(m, X + W - 1, Y + j, TID.castlewall); }
    // gates (south + west)
    rect(m, X + (W >> 1) - 1, Y + H - 1, 3, 1, TID.stonepath);
    rect(m, X, Y + (H >> 1) - 1, 1, 3, TID.stonepath);
    // castle (top center)
    const CX = X + (W >> 1) - 7, CY = Y + 2;
    rect(m, CX, CY, 14, 8, TID.castlewall);
    rect(m, CX + 1, CY + 1, 12, 7, TID.roofP);
    rect(m, CX + 2, CY + 8, 10, 1, TID.castlewall);
    setT(m, CX + 6, CY + 8, TID.door); setT(m, CX + 7, CY + 8, TID.door);
    rect(m, CX + 4, CY + 9, 6, 4, TID.carpet);
    addObj(m, 'banner', CX + 1, CY + 9, false); addObj(m, 'banner', CX + 12, CY + 9, false);
    addObj(m, 'throne', CX + 6, CY + 4, false); // decorative (inside view is faked above door)
    npc(m, 'king', 'King Aldric II', CX + 7, CY + 10, { hair: 4, skin: 0, cls: 'tank', armorColor: '#8a4fc8', armorDark: '#57297c' }, { dial: 'king', story: 'king', king: true });
    npc(m, 'guard1', 'Royal Guard', CX + 4, CY + 12, { hair: 1, skin: 0, cls: 'tank' }, { chat: ['The King sees all petitioners... eventually.', 'Stay out of trouble.'] });
    npc(m, 'guard2', 'Royal Guard', CX + 9, CY + 12, { hair: 1, skin: 2, cls: 'tank' }, { chat: ['Demonspire lies far to the north-east. Pray you never see it.'] });
    // guild HQ (left)
    let d = house(m, X + 3, Y + 12, 9, 7, TID.roofY, { sign: 'Adventurer Guild HQ' });
    addDoorAction(m, d, { kind: 'guild' });
    npc(m, 'ald_gm', 'Guildmaster Osric', X + 7, Y + 20, { hair: 1, skin: 1, cls: 'swordsman', armorColor: '#8a2417', armorDark: '#5c1408' }, { dial: 'guildmaster', action: { kind: 'guild' } });
    // merchant guild (right)
    d = house(m, X + W - 12, Y + 12, 9, 7, TID.roofG, { sign: 'Merchant Guild' });
    addDoorAction(m, d, { kind: 'shop', shop: 'merchant_guild' });
    npc(m, 'ald_mgm', 'Guildmaster Coin', X + W - 8, Y + 20, { hair: 0, skin: 2, cls: 'ranger', armorColor: '#d8a83a', armorDark: '#a07820' }, { dial: 'merchant_gm', action: { kind: 'shop', shop: 'merchant_guild' } });
    // market square (center) with stalls
    const MX = X + (W >> 1) - 6, MY = Y + 20;
    addObj(m, 'fountain', MX + 5, MY - 2, true);
    addObj(m, 'stall', MX - 1, MY + 2, true, { market: true }); addObj(m, 'stall', MX + 4, MY + 2, true, { market: true }); addObj(m, 'stall', MX + 9, MY + 2, true, { market: true });
    npc(m, 'ald_market', 'Market Clerk', MX + 5, MY + 5, { hair: 2, skin: 0, cls: 'ranger', armorColor: '#d8a83a', armorDark: '#a07820' }, { action: { kind: 'market' }, chat: ['Buy! Sell! Trade with adventurers across all of Eldoria!'] });
    // shops row (bottom-left)
    d = house(m, X + 4, Y + 26, 7, 6, TID.roofB, { sign: 'Royal Forge' });
    addDoorAction(m, d, { kind: 'shop', shop: 'alden_black' });
    addObj(m, 'anvil', X + 5, Y + 33, true, { craft: true });
    d = house(m, X + 13, Y + 26, 7, 6, TID.roofP, { sign: 'The Gilded Grimoire' });
    addDoorAction(m, d, { kind: 'shop', shop: 'alden_magic' });
    d = house(m, X + 22, Y + 26, 6, 6, TID.roofG, { sign: 'Bubbling Cauldron' });
    addDoorAction(m, d, { kind: 'shop', shop: 'alden_potion' });
    // inn + church (bottom-right)
    d = house(m, X + 30, Y + 26, 7, 6, TID.roofR, { sign: 'The Gilded Lion Inn' });
    addDoorAction(m, d, { kind: 'inn' });
    npc(m, 'ald_inn', 'Innkeeper Roso', X + 33, Y + 33, { hair: 2, skin: 1, cls: 'swordsman', armorColor: '#8a5a2c', armorDark: '#5c3a18' }, { dial: 'innkeeper', action: { kind: 'inn' } });
    d = house(m, X + 39, Y + 25, 8, 7, TID.roofY, { sign: 'Temple of Dawn' });
    npc(m, 'ald_priest', 'Priest of Dawn', X + 43, Y + 33, { hair: 4, skin: 1, cls: 'mage', armorColor: '#f0e8d8', armorDark: '#c8b894' }, { dial: 'priest', action: { kind: 'altar' } });
    // PVP arena (right side)
    const AX = X + W - 14, AY = Y + 3;
    rect(m, AX, AY, 11, 8, TID.arenasand);
    for (let i = 0; i < 11; i++) { setT(m, AX + i, AY, TID.fence); setT(m, AX + i, AY + 7, TID.fence); }
    for (let j = 0; j < 8; j++) { setT(m, AX, AY + j, TID.fence); setT(m, AX + 10, AY + j, TID.fence); }
    setT(m, AX + 5, AY + 7, TID.arenasand);
    m.arena = { x: AX + 1, y: AY + 1, w: 9, h: 6 };
    addObj(m, 'sign', AX + 6, AY + 8, false, { signText: 'PVP ARENA — enter at your own risk!' });
    npc(m, 'arena_m', 'Arena Master Dax', AX + 4, AY + 9, { hair: 1, skin: 2, cls: 'swordsman', armorColor: '#c8402e', armorDark: '#8a2417' }, { chat: ['Step into the sand and any adventurer may strike you — and you them.', 'No deaths in my arena. Losers walk out at 1 HP and buy the winner a drink.'] });
    // townsfolk
    npc(m, 'ald_v1', 'Noble Vane', MX + 2, MY - 4, { hair: 3, skin: 0, cls: 'mage', armorColor: '#4a68b0', armorDark: '#2e4680' }, { wander: 30, chat: ['The war? Dreadful business. More wine.'] });
    npc(m, 'ald_v2', 'Squire Ann', X + 10, Y + 22, { hair: 2, skin: 1, cls: 'swordsman' }, { wander: 40, chat: ['One day I\'ll make the royal knights!', 'The arena is where reputations are made.'] });
    m.safeZones.push({ x: X, y: Y, w: W, h: H, name: 'Aldenhaven', spawn: { x: (MX + 5) * 16, y: (MY + 6) * 16 }, arenaExempt: true });
    WORLD.locations.push({ name: 'Aldenhaven (Capital)', x: X + (W >> 1), y: Y + (H >> 1), kind: 'capital' });
  }

  // ---------------- Emberport / Frosthold ----------------
  function buildEmberport(m) {
    const X = 78, Y = 284;
    clearArea(m, X - 2, Y - 2, 26, 18, TID.sand);
    rect(m, X, Y + 7, 22, 2, TID.path);
    let d = house(m, X + 2, Y + 1, 6, 6, TID.roofY, { sign: 'Dune Rest Inn' });
    addDoorAction(m, d, { kind: 'inn' });
    d = house(m, X + 10, Y + 1, 6, 6, TID.roofB, { sign: 'Emberport Forge' });
    addDoorAction(m, d, { kind: 'shop', shop: 'ember_black' });
    house(m, X + 18, Y + 1, 5, 6, TID.roofR);
    addObj(m, 'well', X + 12, Y + 10, true);
    npc(m, 'em_v1', 'Trader Nadia', X + 16, Y + 10, { hair: 1, skin: 2, cls: 'ranger', armorColor: '#d8a83a', armorDark: '#a07820' }, { wander: 30, chat: ['The Molten Depths glow at night. Bad omen.', 'Sand gets everywhere. EVERYWHERE.'] });
    m.safeZones.push({ x: X - 2, y: Y - 2, w: 26, h: 18, name: 'Emberport', spawn: { x: (X + 12) * 16, y: (Y + 9) * 16 } });
    WORLD.locations.push({ name: 'Emberport', x: X + 12, y: Y + 8, kind: 'town' });
  }
  function buildFrosthold(m) {
    const X = 158, Y = 44;
    clearArea(m, X - 2, Y - 2, 26, 18, TID.snow);
    rect(m, X, Y + 7, 22, 2, TID.path);
    let d = house(m, X + 2, Y + 1, 6, 6, TID.roofB, { sign: 'The Warm Hearth Inn' });
    addDoorAction(m, d, { kind: 'inn' });
    d = house(m, X + 10, Y + 1, 6, 6, TID.roofP, { sign: 'Frosthold Armory' });
    addDoorAction(m, d, { kind: 'shop', shop: 'frost_black' });
    house(m, X + 18, Y + 1, 5, 6, TID.roofR);
    addObj(m, 'campfire', X + 12, Y + 10, false, { craft: true });
    npc(m, 'fr_v1', 'Hunter Skald', X + 16, Y + 10, { hair: 3, skin: 0, cls: 'ranger', armorColor: '#5c7a8c', armorDark: '#3a5060' }, { wander: 30, chat: ['Yetis took the pass. Again.', 'The Frozen Abyss? Even my dogs won\'t go near it.'] });
    m.safeZones.push({ x: X - 2, y: Y - 2, w: 26, h: 18, name: 'Frosthold', spawn: { x: (X + 12) * 16, y: (Y + 9) * 16 } });
    WORLD.locations.push({ name: 'Frosthold', x: X + 12, y: Y + 8, kind: 'town' });
  }

  // ---------------- war front & Demonspire ----------------
  function buildWarfront(m) {
    const X = 246, Y = 96;
    clearArea(m, X, Y, 34, 22, TID.ashes);
    // human camp (west side)
    rect(m, X + 1, Y + 8, 6, 6, TID.dirt);
    addObj(m, 'campfire', X + 3, Y + 10, false);
    addObj(m, 'banner', X + 2, Y + 8, false); addObj(m, 'banner', X + 6, Y + 8, false);
    npc(m, 'capt', 'Captain Elric', X + 4, Y + 12, { hair: 1, skin: 1, cls: 'tank', armorColor: '#3b6fd0', armorDark: '#22417c' }, { dial: 'armycaptain', action: { kind: 'faction', f: 'royal' } });
    npc(m, 'broker', 'Sable the Broker', X + 6, Y + 14, { hair: 1, skin: 2, cls: 'ranger', armorColor: '#44403a', armorDark: '#2c2824' }, { dial: 'merc_broker', action: { kind: 'faction', f: 'mercenary' } });
    // demon banners east
    addObj(m, 'bannerdemon', X + 30, Y + 6, false); addObj(m, 'bannerdemon', X + 30, Y + 14, false);
    m.warzone = { x: X + 8, y: Y + 2, w: 24, h: 18 };
    m.safeZones.push({ x: X + 1, y: Y + 8, w: 7, h: 8, name: 'Army Camp', spawn: { x: (X + 4) * 16, y: (Y + 11) * 16 } });
    WORLD.locations.push({ name: 'Ashen Marches (War Front)', x: X + 16, y: Y + 10, kind: 'war' });
  }
  function buildDemonspire(m) {
    const X = 296, Y = 30;
    clearArea(m, X - 2, Y - 2, 22, 18, TID.ashes);
    rect(m, X, Y, 18, 12, TID.demonwall);
    rect(m, X + 2, Y + 2, 14, 9, TID.demonfloor);
    rect(m, X + 8, Y + 11, 2, 1, TID.demonfloor);
    addObj(m, 'bannerdemon', X + 3, Y + 3, false); addObj(m, 'bannerdemon', X + 14, Y + 3, false);
    addObj(m, 'portal', X + 8, Y + 4, false);
    // portal into the final dungeon
    WORLD.maps.overworld_exits_pending = true;
    m.exits.push({ x: X + 8, y: Y + 4, w: 2, h: 2, to: 'demoncastle', useSpawn: true });
    WORLD.locations.push({ name: 'Demonspire Citadel', x: X + 9, y: Y + 6, kind: 'demon' });
  }

  // ---------------- mob zones on the overworld ----------------
  function overworldZones(m) {
    const Z = (x, y, w, h, mobs, max) => m.mobZones.push({ x, y, w, h, mobs, max: max || 8 });
    Z(30, 150, 70, 70, ['slime', 'rat', 'mushroom'], 10);          // around Riverwood
    Z(100, 150, 60, 60, ['slime', 'goblin', 'mushroom', 'goblin_archer'], 9);
    Z(90, 210, 70, 60, ['wolf', 'goblin', 'redslime', 'bandit'], 9); // west/south woods
    Z(150, 200, 60, 60, ['bandit', 'wolf', 'redslime'], 8);
    Z(160, 250, 70, 50, ['zombie', 'spider', 'blueslime'], 9);      // swamp
    Z(40, 250, 90, 60, ['redslime', 'bandit', 'hound'], 8);          // desert
    Z(230, 170, 70, 70, ['orc', 'harpy', 'direwolf'], 9);            // eastern hills
    Z(120, 30, 90, 60, ['blueslime', 'yeti', 'icebat', 'direwolf'], 8); // snow
    Z(210, 30, 60, 50, ['yeti', 'icebat', 'wraith'], 8);
    Z(250, 60, 60, 60, ['demon_soldier', 'imp', 'dark_knight'], 9);  // corruption
    Z(280, 100, 40, 60, ['demon_soldier', 'demon_brute', 'drake'], 8);
    // war zone: handled specially by game.js (armies)
  }

  // ============================================================
  // DUNGEONS (deterministic layouts)
  // ============================================================
  const DUNGEON_DEFS = WORLD.DUNGEON_DEFS = {
    slimecave: { name: 'Slime Caves', floor: 'cavefloor', wall: 'cavewall', size: 46, mobs: ['slime', 'rat', 'redslime'], boss: 'king_slime', chestTier: 1, music: 'dungeon', dark: true, lvl: 'F–D' },
    gobwarren: { name: 'Goblin Warrens', floor: 'cavefloor', wall: 'cavewall', size: 50, mobs: ['goblin', 'goblin_archer', 'wolf'], boss: 'goblin_chief', chestTier: 2, music: 'dungeon', dark: true, lvl: 'E–C' },
    crypt: { name: 'Sunken Crypt', floor: 'cryptfloor', wall: 'cryptwall', size: 52, mobs: ['skeleton', 'zombie', 'skeleton_mage'], boss: 'bone_lord', chestTier: 3, music: 'dungeon', dark: true, lvl: 'D–B' },
    spiderhollow: { name: 'Spider Hollow', floor: 'cavefloor', wall: 'cavewall', size: 52, mobs: ['spider', 'bat', 'mushroom'], boss: 'broodmother', chestTier: 3, music: 'dungeon', dark: true, lvl: 'C–A' },
    firedepths: { name: 'Molten Depths', floor: 'firefloor', wall: 'firewall', size: 56, mobs: ['imp', 'hound', 'golem'], boss: 'flame_golem', chestTier: 4, music: 'dungeon', dark: true, lava: true, lvl: 'B–S' },
    frozenabyss: { name: 'Frozen Abyss', floor: 'icefloor', wall: 'icewall', size: 56, mobs: ['yeti', 'icebat', 'wraith'], boss: 'frost_tyrant', chestTier: 5, music: 'snowzone', dark: true, lvl: 'A–SS' },
    demonrift: { name: 'Demon Rift', floor: 'demonfloor', wall: 'demonwall', size: 58, mobs: ['demon_soldier', 'dark_knight', 'demon_brute'], boss: 'demon_general', chestTier: 5, music: 'demon', dark: true, lvl: 'S–SSS' },
    dragonperch: { name: 'Dragon\'s Perch', floor: 'cavefloor', wall: 'cavewall', size: 48, mobs: ['drake', 'harpy', 'golem'], boss: 'ancient_dragon', chestTier: 6, music: 'boss', dark: true, lvl: 'SSS' },
    demoncastle: { name: 'Demonspire Throne', floor: 'demonfloor', wall: 'demonwall', size: 60, mobs: ['demon_soldier', 'demon_brute', 'lich'], boss: 'demon_lord', chestTier: 6, music: 'demon', dark: true, lvl: 'SSSS' },
  };

  function genDungeon(id) {
    const def = DUNGEON_DEFS[id];
    const S = def.size;
    const m = newMap(id, def.name, S, S, TID[def.wall], def.music);
    m.dark = def.dark; m.isDungeon = true; m.dungeonDef = def;
    const r = PXA.mulberry(SEED + id.length * 7919 + id.charCodeAt(0) * 131);
    // rooms
    const rooms = [];
    const nRooms = 9 + (r() * 4 | 0);
    for (let i = 0; i < nRooms; i++) {
      const w = 6 + (r() * 7 | 0), h = 5 + (r() * 6 | 0);
      const x = 2 + (r() * (S - w - 4) | 0), y = 2 + (r() * (S - h - 4) | 0);
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
      rect(m, x, y, w, h, TID[def.floor]);
    }
    rooms.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy));
    // corridors
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1], b = rooms[i];
      let x = a.cx, y = a.cy;
      while (x !== b.cx) { rect(m, x, y, 2, 2, TID[def.floor]); x += Math.sign(b.cx - x); }
      while (y !== b.cy) { rect(m, x, y, 2, 2, TID[def.floor]); y += Math.sign(b.cy - y); }
    }
    // entrance = first room; boss = last room
    const ent = rooms[0], boss = rooms[rooms.length - 1];
    m.spawnPoint = { x: ent.cx * 16 + 8, y: ent.cy * 16 + 8 };
    // exit portal back to overworld
    addObj(m, 'portal', ent.cx, ent.cy - 1, false);
    m.exits.push({ x: ent.cx - 1, y: ent.cy - 2, w: 3, h: 2, to: 'overworld', backRef: id });
    // boss room decor + spawn
    m.bossSpawn = { x: boss.cx * 16, y: boss.cy * 16, mob: def.boss };
    addObj(m, 'bones', boss.x + 1, boss.y + 1, false);
    addObj(m, 'bones', boss.x + boss.w - 2, boss.y + boss.h - 2, false);
    // torches, chests, mobs in middle rooms
    for (let i = 1; i < rooms.length - 1; i++) {
      const rm = rooms[i];
      if (r() < 0.85) m.mobZones.push({ x: rm.x, y: rm.y, w: rm.w, h: rm.h, mobs: def.mobs, max: 2 + (r() * 3 | 0) });
      if (r() < 0.6) {
        const cx = rm.x + 1 + (r() * (rm.w - 2) | 0), cy = rm.y + 1 + (r() * (rm.h - 2) | 0);
        const chest = addObj(m, 'chest', cx, cy, true, { chestTier: def.chestTier, chestId: id + '_' + i });
        m.chests.push(chest);
      }
      if (r() < 0.5) addObj(m, 'torch', rm.x + 1, rm.y, false, { lit: true });
      if (def.lava && r() < 0.5) rect(m, rm.x + 1 + (r() * (rm.w - 3) | 0), rm.y + 1 + (r() * (rm.h - 3) | 0), 2, 2, TID.lava);
      if (id === 'spiderhollow' && r() < 0.4) addObj(m, 'bones', rm.cx, rm.cy, false);
      if ((id === 'crypt' || id === 'demoncastle') && r() < 0.4) addObj(m, 'grave', rm.x + 1, rm.y + 1, true);
      if (r() < 0.35) addObj(m, 'crystal', rm.x + rm.w - 2, rm.y + rm.h - 2, true, { pick: 'magic_stone' });
    }
    m.safeZones = [];
    return m;
  }

  // ============================================================
  // build everything
  // ============================================================
  WORLD.build = function () {
    const m = genOverworld();
    m.safeZones = [];
    buildRiverwood(m);
    buildOakstead(m);
    buildAldenhaven(m);
    buildEmberport(m);
    buildFrosthold(m);
    buildWarfront(m);
    buildDemonspire(m);
    // roads
    road(m, 70, 190, 118, 241);          // riverwood -> oakstead
    road(m, 86, 189, 186, 156);          // riverwood -> aldenhaven west gate
    road(m, 130, 240, 100, 291);         // oakstead -> emberport
    road(m, 212, 175, 170, 60);          // aldenhaven -> frosthold
    road(m, 237, 155, 262, 112);         // aldenhaven -> warfront
    // dungeon entrances
    dungeonEntrance(m, 78, 165, 'slimecave', 'Slime Caves');
    dungeonEntrance(m, 138, 196, 'gobwarren', 'Goblin Warrens');
    dungeonEntrance(m, 226, 208, 'crypt', 'Sunken Crypt');
    dungeonEntrance(m, 172, 262, 'spiderhollow', 'Spider Hollow');
    dungeonEntrance(m, 60, 270, 'firedepths', 'Molten Depths');
    dungeonEntrance(m, 216, 38, 'frozenabyss', 'Frozen Abyss');
    dungeonEntrance(m, 286, 88, 'demonrift', 'Demon Rift');
    dungeonEntrance(m, 252, 26, 'dragonperch', 'Dragon\'s Perch');
    overworldZones(m);
    // dungeons
    for (const id in DUNGEON_DEFS) genDungeon(id);
    // link overworld exits into dungeons & back
    for (const ex of m.exits) {
      if (ex.useSpawn) {
        const dm = WORLD.maps[ex.to];
        if (dm && dm.spawnPoint) { ex.tx = dm.spawnPoint.x; ex.ty = dm.spawnPoint.y; }
      }
    }
    // dungeon exits back to their overworld entrance
    for (const id in DUNGEON_DEFS) {
      const dm = WORLD.maps[id];
      for (const ex of dm.exits) {
        if (ex.to === 'overworld') {
          const entry = m.exits.find(e => e.to === id);
          if (entry) { ex.tx = entry.x * 16 + 8; ex.ty = (entry.y + 2) * 16 + 8; }
          else { ex.tx = m.spawnPoint.x; ex.ty = m.spawnPoint.y; }
        }
      }
    }
    return m;
  };

  // which safe zone (if any) contains px coords
  WORLD.safeZoneAt = function (m, px, py) {
    if (!m.safeZones) return null;
    const tx = px / 16 | 0, ty = py / 16 | 0;
    for (const z of m.safeZones) {
      if (tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) return z;
    }
    return null;
  };
  WORLD.inArena = function (m, px, py) {
    if (!m.arena) return false;
    const tx = px / 16 | 0, ty = py / 16 | 0;
    const a = m.arena;
    return tx >= a.x && tx < a.x + a.w && ty >= a.y && ty < a.y + a.h;
  };
  WORLD.inWarzone = function (m, px, py) {
    if (!m.warzone) return false;
    const tx = px / 16 | 0, ty = py / 16 | 0;
    const z = m.warzone;
    return tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h;
  };
})();