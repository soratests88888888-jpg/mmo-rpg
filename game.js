/* ============================================================
   ASHES OF ELDORIA — game.js
   The engine: player, combat, magic, monster AI, bosses,
   quests, loot, day/night lighting, war front, rendering.
   ============================================================ */
(function () {
  'use strict';
  const GAME = (window.GAME = {});
  const TS = 16;            // tile size in art px
  let SCALE = 3;            // screen scale
  const D = () => window.DATA, W = () => window.WORLD;
  // ---------------- state ----------------
  let canvas, ctx, running = false;
  let map = null;
  const P = GAME.player = {};       // player state
  let mobs = [], projectiles = [], particles = [], floats = [], grounds = [], corpses = [];
  let escort = null;
  let cam = { x: 0, y: 0 };
  let keys = {}, lastDirKey = null;
  GAME.time = 8 * 60;               // world minutes (0..1440)
  GAME.day = 1;
  let attackAnim = 0, attackDir = null;
  let heroSheet = null, npcSheets = {}, mobSprites = {};
  let saveTimer = 0, frameT = 0;
  let bossActive = null, warTimer = 0;
  let uid = 1;
  // ============================================================
  // player creation / stats
  // ============================================================
  GAME.newPlayer = function (name, cls, hair, skin) {
    const cd = D().CLASSES[cls];
    Object.assign(P, {
      name, cls, look: { hair, skin, cls },
      level: 1, xp: 0, statPoints: 0,
      base: Object.assign({}, cd.base),
      gold: 50, hp: 1, mp: 1,
      inv: new Array(28).fill(null),
      equip: { weapon: null, shield: null, helmet: null, armor: null, boots: null, ring: null, amulet: null },
      spells: [], hotbar: new Array(8).fill(null),
      buffs: [], effects: {},
      map: 'overworld', x: 0, y: 0, dir: 'down',
      spawn: null,
      story: 0, jobs: [], guildPts: 0, rank: 0,
      faction: null, permit: false,
      kills: {}, opened: {}, deaths: 0, bossKills: {},
      created: Date.now(),
    });
    // starter gear
    GAME.addItem(cd.weapon, 1); GAME.equipFromInv(findInv(cd.weapon));
    GAME.addItem('cloth_tunic', 1); GAME.equipFromInv(findInv('cloth_tunic'));
    GAME.addItem('potion_s', 3); GAME.addItem('bread', 2);
    learnDefaults();
    recalc(); P.hp = P.maxHp; P.mp = P.maxMp;
    autoHotbar();
  };
  function learnDefaults() {
    for (const id in D().SPELLS) {
      const s = D().SPELLS[id];
      if ((s.cls === P.cls || s.cls === 'all') && !s.tome && s.lvl <= P.level && !P.spells.includes(id)) P.spells.push(id);
    }
  }
  GAME.learnSpell = function (id) { if (!P.spells.includes(id)) { P.spells.push(id); autoHotbar(); } };
  function autoHotbar() {
    const wanted = [];
    for (const id of P.spells) wanted.push({ t: 'spell', id });
    wanted.sort((a, b) => D().SPELLS[a.id].lvl - D().SPELLS[b.id].lvl);
    for (let i = 0; i < 6 && i < wanted.length; i++) if (!P.hotbar[i]) P.hotbar[i] = wanted[i];
    // potions on last slots
    if (!P.hotbar[6] && findInv('potion_s') >= 0) P.hotbar[6] = { t: 'item', id: 'potion_s' };
    if (!P.hotbar[7] && findInv('mana_s') >= 0) P.hotbar[7] = { t: 'item', id: 'mana_s' };
    // dedupe
    const seen = new Set();
    P.hotbar = P.hotbar.map(h => { if (!h) return null; const k = h.t + h.id; if (seen.has(k)) return null; seen.add(k); return h; });
  }
  GAME.autoHotbar = autoHotbar;
  function recalc() {
    const b = P.base; let atk = 0, matk = 0, def = 0, hp = 0, mp = 0, agi = 0;
    for (const slot in P.equip) {
      const it = P.equip[slot] && D().ITEMS[P.equip[slot]];
      if (!it) continue;
      atk += it.atk || 0; matk += it.matk || 0; def += it.def || 0;
      hp += it.hp || 0; mp += it.mp || 0; agi += it.agi || 0;
    }
    P.maxHp = 30 + b.vit * 14 + P.level * 6 + hp;
    P.maxMp = 12 + b.int * 8 + P.level * 3 + mp;
    P.atk = 3 + atk + Math.floor(b.str * 1.2);
    P.matk = matk + Math.floor(b.int * 1.5);
    P.def = def + Math.floor(b.vit * 0.8);
    P.speed = 88 + (b.agi + agi) * 1.6;
    P.crit = Math.min(40, (b.agi + agi) * 0.5);
    if (P.hp > P.maxHp) P.hp = P.maxHp;
    if (P.mp > P.maxMp) P.mp = P.maxMp;
  }
  GAME.recalc = recalc;
  GAME.addStat = function (stat) {
    if (P.statPoints <= 0) return;
    P.base[stat]++; P.statPoints--; recalc();
    AUDIO.sfx('click'); UI.refreshAll();
  };
  function gainXp(n) {
    if (P.faction === null || P.faction === 'none') n = Math.floor(n * 1.1);
    P.xp += n;
    while (P.xp >= D().xpForLevel(P.level)) {
      P.xp -= D().xpForLevel(P.level);
      P.level++;
      const up = D().CLASSES[P.cls].up;
      for (const s in up) P.base[s] += up[s];
      P.statPoints += 3;
      recalc(); P.hp = P.maxHp; P.mp = P.maxMp;
      AUDIO.sfx('levelup');
      UI.announce('LEVEL ' + P.level + '!', 'You feel stronger. +3 stat points');
      burst(P.x, P.y, '#f2c14b', 20);
      // learn new class spells
      for (const id in D().SPELLS) {
        const s = D().SPELLS[id];
        if ((s.cls === P.cls || s.cls === 'all') && !s.tome && s.lvl <= P.level && !P.spells.includes(id)) {
          P.spells.push(id);
          UI.toast('New skill learned: ' + s.name, '#8fd4ff');
        }
      }
      autoHotbar();
      if (window.NET) NET.sendState(true);
    }
    UI.refreshHud();
  }
  GAME.gainXp = gainXp;
  // ============================================================
  // inventory
  // ============================================================
  function findInv(id) { return P.inv.findIndex(s => s && s.id === id); }
  GAME.findInv = findInv;
  GAME.countItem = function (id) { let n = 0; for (const s of P.inv) if (s && s.id === id) n += s.n; return n; };
  GAME.addItem = function (id, n) {
    n = n || 1;
    const def = D().ITEMS[id]; if (!def) return false;
    if (def.stack) {
      const i = findInv(id);
      if (i >= 0) { P.inv[i].n += n; UI.refreshInv(); return true; }
    }
    for (let k = 0; k < n; k++) {
      const slot = P.inv.findIndex(s => !s);
      if (slot < 0) { UI.toast('Inventory full!', '#ff9a8a'); return false; }
      P.inv[slot] = { id, n: def.stack ? n : 1 };
      if (def.stack) break;
    }
    UI.refreshInv();
    return true;
  };
  GAME.removeItem = function (id, n) {
    n = n || 1;
    for (let i = 0; i < P.inv.length && n > 0; i++) {
      const s = P.inv[i];
      if (s && s.id === id) {
        const take = Math.min(n, s.n);
        s.n -= take; n -= take;
        if (s.n <= 0) P.inv[i] = null;
      }
    }
    UI.refreshInv();
    return n <= 0;
  };
  GAME.useItem = function (slot) {
    const s = P.inv[slot]; if (!s) return;
    const def = D().ITEMS[s.id];
    if (def.type === 'consumable' && def.use) {
      if (def.use.heal) P.hp = Math.min(P.maxHp, P.hp + def.use.heal);
      if (def.use.mana) P.mp = Math.min(P.maxMp, P.mp + def.use.mana);
      if (def.use.cure) delete P.effects[def.use.cure];
      s.n--; if (s.n <= 0) P.inv[slot] = null;
      AUDIO.sfx('potion'); float(P.x, P.y - 20, def.use.heal ? '+' + Math.min(def.use.heal, 999) : '+MP', def.use.heal ? '#57c14f' : '#4f8fe0');
      UI.refreshInv(); UI.refreshHud();
    } else if (def.type === 'tome') {
      const sp = D().SPELLS[def.teach];
      if (!sp) return;
      if (sp.cls !== P.cls && sp.cls !== 'all') { UI.toast('Your class cannot learn this.', '#ff9a8a'); return; }
      if (P.spells.includes(def.teach)) { UI.toast('Already known.', '#ff9a8a'); return; }
      GAME.learnSpell(def.teach);
      s.n--; if (s.n <= 0) P.inv[slot] = null;
      AUDIO.sfx('levelup'); UI.toast('Learned: ' + sp.name + '!', '#8fd4ff');
      UI.refreshInv();
    } else if (def.type === 'weapon' || def.type === 'shield' || def.type === 'helmet' || def.type === 'armor' || def.type === 'boots' || def.type === 'ring' || def.type === 'amulet') {
      GAME.equipFromInv(slot);
    } else if (s.id === 'merchant_permit') {
      P.permit = true; UI.toast('Merchant Permit active — better trade prices!', '#a8e89a');
    }
  };
  GAME.equipFromInv = function (slot) {
    const s = P.inv[slot]; if (!s) return;
    const def = D().ITEMS[s.id];
    let eslot = def.type;
    if (def.type === 'weapon') {
      const allowed = D().CLASSES[P.cls].weaponKinds;
      if (!allowed.includes(def.kind)) { UI.toast(D().CLASSES[P.cls].name + ' cannot use this weapon.', '#ff9a8a'); AUDIO.sfx('error'); return; }
      eslot = 'weapon';
    }
    if (!(eslot in P.equip)) return;
    const old = P.equip[eslot];
    P.equip[eslot] = s.id;
    P.inv[slot] = old ? { id: old, n: 1 } : null;
    AUDIO.sfx('equip'); recalc(); UI.refreshInv(); UI.refreshHud();
  };
  GAME.unequip = function (eslot) {
    const id = P.equip[eslot]; if (!id) return;
    const slot = P.inv.findIndex(s => !s);
    if (slot < 0) { UI.toast('Inventory full!', '#ff9a8a'); return; }
    P.inv[slot] = { id, n: 1 }; P.equip[eslot] = null;
    AUDIO.sfx('equip'); recalc(); UI.refreshInv();
  };
  GAME.sellPrice = function (id) {
    const def = D().ITEMS[id];
    return Math.max(1, Math.floor(def.price * (P.permit ? 0.6 : 0.35)));
  };
  GAME.buyPrice = function (id) {
    const def = D().ITEMS[id];
    let p = def.price;
    if (P.faction === 'royal') p = Math.floor(p * 0.9);
    if (P.permit) p = Math.floor(p * 0.92);
    return p;
  };
  GAME.buyItem = function (id) {
    const price = GAME.buyPrice(id);
    if (P.gold < price) { UI.toast('Not enough gold.', '#ff9a8a'); AUDIO.sfx('error'); return; }
    if (!GAME.addItem(id, 1)) return;
    P.gold -= price;
    if (id === 'merchant_permit') P.permit = true;
    AUDIO.sfx('coin'); UI.refreshInv(); UI.refreshHud();
  };
  GAME.sellItem = function (slot) {
    const s = P.inv[slot]; if (!s) return;
    P.gold += GAME.sellPrice(s.id);
    s.n--; if (s.n <= 0) P.inv[slot] = null;
    AUDIO.sfx('coin'); UI.refreshInv();
  };
  GAME.craft = function (recipe) {
    for (const mid in recipe.mats) if (GAME.countItem(mid) < recipe.mats[mid]) { UI.toast('Missing materials.', '#ff9a8a'); return; }
    if (P.level < recipe.req) { UI.toast('Requires level ' + recipe.req + '.', '#ff9a8a'); return; }
    for (const mid in recipe.mats) GAME.removeItem(mid, recipe.mats[mid]);
    GAME.addItem(recipe.out, recipe.n);
    AUDIO.sfx('craft');
    UI.toast('Crafted: ' + D().ITEMS[recipe.out].name + (recipe.n > 1 ? ' x' + recipe.n : ''), '#a8e89a');
    questProgress('gather', recipe.out, recipe.n);
  };
  // ============================================================
  // quests
  // ============================================================
  GAME.acceptJob = function (jobIdx) {
    const tpl = D().JOBS[jobIdx];
    if (P.jobs.some(j => j.idx === jobIdx && !j.done)) { UI.toast('Job already accepted.', '#ff9a8a'); return; }
    if (P.jobs.filter(j => !j.done).length >= 4) { UI.toast('Max 4 active jobs.', '#ff9a8a'); return; }
    const rankIdx = D().RANKS.indexOf(tpl.rank);
    if (rankIdx > P.rank) { UI.toast('Your guild rank is too low.', '#ff9a8a'); AUDIO.sfx('error'); return; }
    const j = { idx: jobIdx, progress: 0, done: false, turnedIn: false };
    P.jobs.push(j);
    if (tpl.type === 'gather') j.progress = Math.min(GAME.countItem(tpl.item), tpl.n);
    if (tpl.type === 'escort') startEscort(j);
    AUDIO.sfx('quest'); UI.toast('Job accepted: ' + tpl.name, '#8fd4ff');
    UI.refreshQuests();
  };
  GAME.turnInJob = function (j) {
    const tpl = D().JOBS[j.idx];
    if (!j.done || j.turnedIn) return;
    if (tpl.type === 'gather' && !GAME.removeItem(tpl.item, tpl.n)) { UI.toast('You no longer have the items!', '#ff9a8a'); j.done = false; j.progress = 0; return; }
    j.turnedIn = true;
    P.gold += tpl.gold; P.guildPts += tpl.pts;
    gainXp(tpl.xp);
    AUDIO.sfx('quest');
    UI.toast('Job complete: ' + tpl.name + '  (+' + tpl.gold + 'g, +' + tpl.pts + ' guild pts)', '#a8e89a');
    // rank up?
    while (P.rank < D().RANKS.length - 1 && P.guildPts >= D().RANK_POINTS[P.rank + 1]) {
      P.rank++;
      UI.announce('GUILD RANK ' + D().RANKS[P.rank] + '!', 'New jobs unlocked at the guild board');
      AUDIO.sfx('levelup');
      if (window.NET) NET.chatSystem(P.name + ' reached guild rank ' + D().RANKS[P.rank] + '!');
    }
    P.jobs = P.jobs.filter(x => !x.turnedIn);
    UI.refreshQuests(); UI.refreshHud();
  };
  function questProgress(type, key, n) {
    n = n || 1;
    let changed = false;
    for (const j of P.jobs) {
      if (j.done) continue;
      const tpl = D().JOBS[j.idx];
      if (tpl.type === 'kill' && type === 'kill' && tpl.mob === key) { j.progress += n; changed = true; }
      if (tpl.type === 'boss' && type === 'kill' && tpl.mob === key) { j.progress = 1; changed = true; }
      if (tpl.type === 'gather' && type === 'gather' && tpl.item === key) { j.progress = Math.min(GAME.countItem(tpl.item), tpl.n); changed = true; }
      const need = tpl.n || 1;
      if (j.progress >= need && !j.done) {
        j.done = true;
        UI.toast('Job objective complete: ' + tpl.name + ' — return to the guild!', '#a8e89a');
        AUDIO.sfx('quest');
      }
    }
    // story
    const st = D().STORY[P.story];
    if (st && st.type === type && (st.mob === key || st.npc === key)) {
      P.storyProg = (P.storyProg || 0) + n;
      if (P.storyProg >= (st.n || 1)) advanceStory();
      changed = true;
    }
    if (changed) UI.refreshQuests();
  }
  GAME.questProgress = questProgress;
  function advanceStory() {
    const st = D().STORY[P.story];
    if (!st) return;
    const r = st.reward || {};
    if (r.gold) P.gold += r.gold;
    if (r.xp) gainXp(r.xp);
    if (r.item) GAME.addItem(r.item, r.itemN || 1);
    UI.announce('CHAPTER COMPLETE', st.title);
    AUDIO.sfx('quest');
    P.story++; P.storyProg = 0;
    const next = D().STORY[P.story];
    if (next) UI.toast('New chapter: ' + next.title, '#8fd4ff');
    UI.refreshQuests();
  }
  GAME.advanceStory = advanceStory;
  GAME.talkStory = function (npcKey) { questProgress('talk', npcKey, 1); };
  GAME.setFaction = function (f) {
    P.faction = f;
    UI.toast('You joined: ' + D().FACTIONS[f].name, '#a8e89a');
    const st = D().STORY[P.story];
    if (st && st.type === 'faction') advanceStory();
  };
  // escort
  function startEscort(j) {
    const tpl = D().JOBS[j.idx];
    escort = {
      job: j, to: tpl.to, hp: 120 + P.level * 10, maxHp: 120 + P.level * 10,
      x: P.x + 20, y: P.y, ambushT: 12,
      look: { hair: 0, skin: 1, cls: 'ranger', armorColor: '#d8a83a', armorDark: '#a07820' },
      name: tpl.to === 'aldenhaven' ? 'Merchant Fenn' : 'Noble Envoy', dir: 'down', frame: 0,
    };
    escort.sheet = PXA.makeHero(escort.look);
    UI.toast('Escort ' + escort.name + ' — keep them alive!', '#8fd4ff');
  }
  // ============================================================
  // map / entities
  // ============================================================
  GAME.enterMap = function (id, x, y) {
    map = W().maps[id];
    P.map = id; P.x = x; P.y = y;
    mobs = []; projectiles = []; grounds = []; corpses = [];
    bossActive = null;
    // populate zones
    for (const z of map.mobZones) { z.pop = 0; z.timer = 0; }
    // boss
    if (map.bossSpawn && !map.bossDead) spawnBoss();
    AUDIO.playMusic(map.music);
    UI.setMapLabel(map.name);
    if (window.NET) NET.mapChanged(id);
    UI.refreshMinimapBase();
  };
  GAME.currentMap = () => map;
  GAME.mobs = () => mobs;
  function spawnMob(defId, x, y, zone, opts) {
    const def = D().MOBS[defId];
    if (!def) return null;
    if (!mobSprites[defId]) mobSprites[defId] = PXA.mob(def.sprite, def.pal);
    const hpMul = def.boss ? 1 : (0.9 + Math.random() * 0.25);
    const mb = Object.assign({
      uid: uid++, def, id: defId, x, y, hp: Math.floor(def.hp * hpMul), maxHp: Math.floor(def.hp * hpMul),
      state: 'idle', tx: x, ty: y, cd: 0, wanderT: Math.random() * 3, zone,
      stun: 0, slow: 0, dots: [], faction: opts && opts.faction, dir: 1,
      spawnX: x, spawnY: y, patT: 3 + Math.random() * 2, summonCount: 0, phase: 0,
    }, opts || {});
    mobs.push(mb);
    if (zone) zone.pop++;
    return mb;
  }
  function spawnBoss() {
    const bs = map.bossSpawn;
    const b = spawnMob(bs.mob, bs.x, bs.y, null);
    if (b) b.isMapBoss = true;
  }
  function updateZones(dt) {
    for (const z of map.mobZones) {
      z.timer -= dt;
      if (z.timer > 0 || z.pop >= z.max) continue;
      z.timer = 2 + Math.random() * 3;
      // spawn away from player but inside zone
      for (let tries = 0; tries < 8; tries++) {
        const tx = z.x + Math.random() * z.w | 0, ty = z.y + Math.random() * z.h | 0;
        const px = tx * TS + 8, py = ty * TS + 8;
        if (W().isSolid(map, tx, ty)) continue;
        if (W().safeZoneAt(map, px, py)) continue;
        if (Math.hypot(px - P.x, py - P.y) < 140) continue;
        const defId = z.mobs[Math.random() * z.mobs.length | 0];
        spawnMob(defId, px, py, z);
        break;
      }
    }
  }
  // war front armies
  function updateWar(dt) {
    if (!map.warzone) return;
    warTimer -= dt;
    if (warTimer > 0) return;
    warTimer = 3;
    const z = map.warzone;
    const inZone = m => m.x / TS >= z.x && m.x / TS < z.x + z.w && m.y / TS >= z.y && m.y / TS < z.y + z.h;
    const soldiers = mobs.filter(m => m.faction === 'human' && inZone(m)).length;
    const demons = mobs.filter(m => m.def.demon && inZone(m)).length;
    if (soldiers < 5) {
      const s = spawnMob(Math.random() < 0.7 ? 'soldier' in D().MOBS ? 'soldier' : 'bandit' : 'bandit', (z.x + 1) * TS + Math.random() * 40, (z.y + Math.random() * z.h) * TS, null, { faction: 'human' });
      if (s) { s.friendly = true; s.name = 'Royal Soldier'; s.hp = s.maxHp = 200 + P.level * 20; s.def = Object.assign({}, s.def, { name: 'Royal Soldier', atk: 20 + P.level * 2 }); }
    }
    if (demons < 7) {
      const pick = Math.random() < 0.6 ? 'demon_soldier' : (Math.random() < 0.5 ? 'imp' : 'demon_brute');
      spawnMob(pick, (z.x + z.w - 2) * TS - Math.random() * 40, (z.y + Math.random() * z.h) * TS, null, { warMob: true });
    }
  }
  // ============================================================
  // combat
  // ============================================================
  function playerMeleeDamage() {
    const w = P.equip.weapon && D().ITEMS[P.equip.weapon];
    let dmg = P.atk;
    if (w && w.matk && w.kind === 'staff') dmg = Math.floor(P.atk * 0.6);
    let mult = 1;
    for (const b of P.buffs) if (b.atkUp) mult += b.atkUp;
    dmg = dmg * mult * (0.85 + Math.random() * 0.3);
    let crit = false;
    if (Math.random() * 100 < P.crit) { dmg *= 1.8; crit = true; }
    return { dmg: Math.max(1, Math.floor(dmg)), crit };
  }
  function mobDefense(mb, dmg) { return Math.max(1, Math.floor(dmg * 100 / (100 + mb.def.def * 6))); }
  function hurtMob(mb, rawDmg, crit, fx) {
    if (mb.hp <= 0) return;
    const dmg = mobDefense(mb, rawDmg);
    mb.hp -= dmg;
    mb.flash = 0.12;
    if (mb.state === 'idle') { mb.state = 'chase'; }
    mb.aggroTarget = 'player';
    float(mb.x, mb.y - mobSprites[mb.id].h - 4, dmg + (crit ? '!' : ''), crit ? '#ffdf5e' : '#fff');
    if (fx === 'burn') addDot(mb, 'burn', 3, 3);
    if (fx === 'poison') addDot(mb, 'poison', 2, 5);
    if (fx === 'slow') mb.slow = Math.max(mb.slow, 2.5);
    if (fx === 'holy' && mb.def.undead) mb.hp -= dmg; // double vs undead
    AUDIO.sfx('hit');
    if (mb.hp <= 0) killMob(mb);
  }
  GAME.hurtMob = hurtMob;
  function addDot(mb, kind, dur, dps) {
    const e = mb.dots.find(d => d.kind === kind);
    if (e) { e.t = dur; } else mb.dots.push({ kind, t: dur, dps });
  }
  function killMob(mb) {
    mb.hp = 0;
    mobs = mobs.filter(m => m !== mb);
    if (mb.zone) mb.zone.pop--;
    corpses.push({ x: mb.x, y: mb.y, t: 0.5, sprite: mb.id });
    burst(mb.x, mb.y, mb.def.boss ? '#f2c14b' : '#c8402e', mb.def.boss ? 30 : 8);
    AUDIO.sfx('mobdie');
    if (mb.friendly) return; // soldiers give nothing
    // rewards
    const def = mb.def;
    let goldGain = def.gold[0] + Math.random() * (def.gold[1] - def.gold[0]) | 0;
    if (mb.warMob || (map.warzone && W().inWarzone(map, mb.x, mb.y))) {
      if (P.faction === 'mercenary' && def.demon) goldGain = Math.floor(goldGain * 1.5);
    }
    P.gold += goldGain;
    gainXp(def.xp);
    float(mb.x, mb.y - 8, '+' + goldGain + 'g', '#f2c14b');
    P.kills[mb.id] = (P.kills[mb.id] || 0) + 1;
    questProgress('kill', mb.id, 1);
    // drops
    for (const dr of def.drops || []) {
      if (Math.random() < dr.c) GAME.addItem(dr.i, dr.n || 1);
      if (Math.random() < dr.c && dr.n) { } // handled above
    }
    if (def.boss) {
      map.bossDead = true;
      bossActive = null;
      P.bossKills[mb.id] = (P.bossKills[mb.id] || 0) + 1;
      UI.announce(def.name + ' DEFEATED!', 'Legendary loot acquired');
      UI.hideBossBar();
      AUDIO.playMusic(map.music);
      // guaranteed bonus loot roll from the dungeon's chest tier
      const tier = map.dungeonDef ? map.dungeonDef.chestTier : 3;
      const loot = rollChestLoot(tier, true);
      for (const l of loot) GAME.addItem(l.id, l.n);
      if (window.NET) NET.chatSystem('⚔ ' + P.name + ' has slain ' + def.name + '!');
      if (mb.id === 'demon_lord') {
        const st = D().STORY[P.story];
        setTimeout(() => UI.announce('THE WAR IS OVER', 'Eldoria is free. You are its hero.'), 3500);
      }
    }
  }
  function rollChestLoot(tier, boss) {
    const table = D().CHEST_LOOT[Math.min(6, tier)] || D().CHEST_LOOT[1];
    const out = [];
    const rolls = boss ? 3 : (1 + (Math.random() < 0.5 ? 1 : 0));
    for (let i = 0; i < rolls; i++) {
      const id = table[Math.random() * table.length | 0];
      out.push({ id, n: 1 });
    }
    // gold-ish extra
    if (Math.random() < 0.4) out.push({ id: 'potion_' + (tier >= 4 ? 'l' : tier >= 2 ? 'm' : 's'), n: 1 });
    return out;
  }
  function hurtPlayer(rawDmg, srcX, srcY, fx) {
    // shield buffs absorb
    let dmg = Math.max(1, Math.floor(rawDmg * 100 / (100 + P.def * 5)));
    let mult = 1;
    for (const b of P.buffs) { if (b.defUp) mult -= b.defUp * 0.5; if (b.defDown) mult += b.defDown; }
    dmg = Math.max(1, Math.floor(dmg * mult));
    for (const b of P.buffs) {
      if (b.shield > 0) {
        const abs = Math.min(b.shield, dmg);
        b.shield -= abs; dmg -= abs;
        if (dmg <= 0) { float(P.x, P.y - 24, 'absorbed', '#8fd4ff'); return; }
      }
    }
    P.hp -= dmg;
    P.hurtT = 0.25;
    float(P.x, P.y - 24, '-' + dmg, '#ff6a5a');
    AUDIO.sfx('hurt');
    if (fx === 'burn') P.effects.burn = { t: 3, dps: 3 };
    if (fx === 'poison') P.effects.poison = { t: 4, dps: 2 };
    if (fx === 'slow') P.effects.slow = { t: 2.5 };
    UI.refreshHud();
    if (P.hp <= 0) playerDie();
  }
  GAME.hurtPlayer = hurtPlayer;
  function playerDie() {
    P.hp = 0; P.deaths++;
    const lost = Math.floor(P.gold * 0.1);
    P.gold -= lost;
    AUDIO.sfx('death');
    UI.showDeath(lost);
    running = false;
  }
  GAME.respawn = function () {
    // nearest safe zone on the player's map (or overworld home)
    let target = null;
    if (P.spawn && W().maps[P.spawn.map]) target = P.spawn;
    else {
      const ow = W().maps.overworld;
      target = { map: 'overworld', x: ow.spawnPoint.x, y: ow.spawnPoint.y };
    }
    // find nearest safe zone if dying on overworld
    if (map && map.id === 'overworld' && map.safeZones && map.safeZones.length) {
      let best = null, bd = 1e9;
      for (const z of map.safeZones) {
        const d = Math.hypot(z.spawn.x - P.x, z.spawn.y - P.y);
        if (d < bd) { bd = d; best = z; }
      }
      if (best) target = { map: 'overworld', x: best.spawn.x, y: best.spawn.y };
    }
    GAME.enterMap(target.map, target.x, target.y);
    P.hp = Math.floor(P.maxHp * 0.6); P.mp = Math.floor(P.maxMp * 0.6);
    P.effects = {}; P.buffs = [];
    running = true;
    AUDIO.sfx('respawn');
    UI.hideDeath(); UI.refreshHud();
  };
  GAME.rest = function () {
    if (P.gold < D().INN_PRICE) { UI.toast('Not enough gold.', '#ff9a8a'); return; }
    P.gold -= D().INN_PRICE;
    P.hp = P.maxHp; P.mp = P.maxMp; P.effects = {};
    P.spawn = { map: P.map, x: P.x, y: P.y };
    AUDIO.sfx('heal');
    UI.toast('You feel rested. Respawn point set here.', '#a8e89a');
    UI.refreshHud();
    GAME.save();
  };
  GAME.setAltar = function () {
    P.hp = P.maxHp;
    P.spawn = { map: P.map, x: P.x, y: P.y };
    AUDIO.sfx('heal');
    UI.toast('The Light embraces you. Respawn point set.', '#a8e89a');
  };
  // ---------------- attacks & spells ----------------
  let atkCd = 0;
  function tryAttack() {
    if (atkCd > 0 || attackAnim > 0) return;
    const w = P.equip.weapon && D().ITEMS[P.equip.weapon];
    const kind = w ? w.kind : 'sword';
    atkCd = kind === 'bow' ? 0.55 : 0.38;
    attackAnim = 0.22; attackDir = P.dir;
    AUDIO.sfx('swing');
    if (kind === 'bow' || kind === 'staff') {
      const v = dirVec(P.dir);
      const { dmg, crit } = playerMeleeDamage();
      shoot({
        x: P.x, y: P.y - 10, vx: v.x * 300, vy: v.y * 300, r: 4,
        color: kind === 'bow' ? '#e8e0c8' : '#c88ae8', dmg, crit, from: 'player', life: 0.8, fx: w && w.fx,
      });
    } else {
      // melee arc
      const v = dirVec(P.dir);
      const cx = P.x + v.x * 20, cy = P.y - 8 + v.y * 20;
      const { dmg, crit } = playerMeleeDamage();
      let hitAny = false;
      for (const mb of mobs) {
        if (mb.friendly) continue;
        const sp = mobSprites[mb.id];
        if (Math.hypot(mb.x - cx, mb.y - sp.h / 2 - cy) < 26 + sp.w / 3) {
          hurtMob(mb, dmg, crit, w && w.fx);
          hitAny = true;
        }
      }
      hitArenaOpponents(cx, cy, 26, dmg);
      // hit pickable objects (trees for wood, dummies)
      tryHitObjects(cx, cy);
      if (hitAny) slashFx(cx, cy);
    }
  }
  function tryHitObjects(cx, cy) {
    const tx = cx / TS | 0, ty = cy / TS | 0;
    for (const o of map.objects) {
      if (Math.abs(o.x - tx) <= 1 && Math.abs(o.y - ty) <= 1) {
        if (o.type === 'tree' || o.type === 'pine' || o.type === 'deadtree') {
          o.hpp = (o.hpp || 3) - 1;
          burst(o.x * TS + 8, o.y * TS + 8, '#3f8c3a', 4);
          if (o.hpp <= 0) {
            W().removeObj(map, o);
            GAME.addItem('wood', 1 + (Math.random() < 0.4 ? 1 : 0));
            questProgress('gather', 'wood');
            float(o.x * TS + 8, o.y * TS, '+Timber', '#a8e89a');
          }
          return;
        }
        if (o.type === 'dummy') { float(o.x * TS + 8, o.y * TS - 8, 'thud!', '#fff'); return; }
      }
    }
  }
  function hitArenaOpponents(cx, cy, r, dmg) {
    if (!window.NET || !map.arena) return;
    if (!W().inArena(map, P.x, P.y)) return;
    NET.remoteList().forEach(rp => {
      if (rp.map !== P.map) return;
      if (!W().inArena(map, rp.x, rp.y)) return;
      if (Math.hypot(rp.x - cx, rp.y - cy) < r + 12) {
        NET.sendPvpHit(rp.id, dmg);
        float(rp.x, rp.y - 26, dmg, '#ffdf5e');
        AUDIO.sfx('pvp');
      }
    });
  }
  GAME.receivePvpHit = function (dmg, fromName) {
    if (!map || !W().inArena(map, P.x, P.y)) return; // only valid in arena
    const real = Math.max(1, Math.floor(dmg * 100 / (100 + P.def * 5)));
    P.hp -= real;
    P.hurtT = 0.25;
    float(P.x, P.y - 24, '-' + real, '#ff6a5a');
    AUDIO.sfx('hurt');
    if (P.hp <= 1) {
      P.hp = 1;
      UI.announce('DEFEATED!', fromName + ' wins the duel');
      if (window.NET) NET.chatSystem('🏆 ' + fromName + ' defeated ' + P.name + ' in the arena!');
      // step out of arena
      P.x = (map.arena.x + map.arena.w / 2) * TS; P.y = (map.arena.y + map.arena.h + 1.5) * TS;
    }
    UI.refreshHud();
  };
  const spellCds = {};
  GAME.spellCd = id => spellCds[id] || 0;
  GAME.castSpell = function (id) {
    const s = D().SPELLS[id];
    if (!s || !P.spells.includes(id)) return;
    if ((spellCds[id] || 0) > 0) return;
    if (P.mp < s.mp) { UI.toast('Not enough mana.', '#8fb0ff'); AUDIO.sfx('error'); return; }
    P.mp -= s.mp;
    spellCds[id] = s.cd;
    attackAnim = 0.22; attackDir = P.dir;
    const v = dirVec(P.dir);
    const INT = P.matk, STR = P.atk;
    const power = s.cls === 'mage' || s.cls === 'all' ? INT : STR;
    const base = (s.dmg || 0) * (1 + power * 0.045) * (s.scale || 1);
    const nearest = nearestMob(s.range || 300);
    switch (s.type) {
      case 'proj':
        AUDIO.sfx(s.icon === 'fire' ? 'fireball' : s.icon === 'ice' ? 'ice' : 'fireball');
        shoot({ x: P.x, y: P.y - 10, vx: v.x * s.speed, vy: v.y * s.speed, r: 5, color: s.color, dmg: base, from: 'player', life: 1.4, fx: s.fx, aoe: s.aoe });
        break;
      case 'fan': {
        AUDIO.sfx('fireball');
        const baseAng = Math.atan2(v.y, v.x);
        const n = s.count || 3;
        for (let i = 0; i < n; i++) {
          const a = baseAng + (i - (n - 1) / 2) * 0.28;
          shoot({ x: P.x, y: P.y - 10, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 4, color: s.color, dmg: base, from: 'player', life: 1.2, fx: s.fx });
        }
        break;
      }
      case 'strike': {
        if (!nearest) { P.mp += s.mp; spellCds[id] = 0; UI.toast('No target in range.', '#8fb0ff'); return; }
        AUDIO.sfx('bolt');
        boltFx(nearest.x, nearest.y);
        hurtMob(nearest, base, false, s.fx);
        if (s.drain) { P.hp = Math.min(P.maxHp, P.hp + Math.floor(base * s.drain)); float(P.x, P.y - 26, '+' + Math.floor(base * s.drain), '#57c14f'); }
        break;
      }
      case 'multistrike': {
        AUDIO.sfx('bolt');
        const targets = mobs.filter(m => !m.friendly && Math.hypot(m.x - P.x, m.y - P.y) < (s.range || 160)).slice(0, s.count || 5);
        if (!targets.length) { P.mp += s.mp; spellCds[id] = 0; UI.toast('No targets in range.', '#8fb0ff'); return; }
        targets.forEach((t, i) => setTimeout(() => { if (t.hp > 0) { boltFx(t.x, t.y); hurtMob(t, base, false, s.fx); } }, i * 120));
        break;
      }
      case 'chain': {
        if (!nearest) { P.mp += s.mp; spellCds[id] = 0; UI.toast('No target in range.', '#8fb0ff'); return; }
        AUDIO.sfx('bolt');
        let cur = nearest, prev = { x: P.x, y: P.y - 10 }, hitSet = new Set();
        let jumps = s.jumps || 3, d = base;
        while (cur && jumps-- > 0) {
          chainFx(prev.x, prev.y, cur.x, cur.y - 8);
          hurtMob(cur, d, false);
          hitSet.add(cur.uid); prev = cur; d *= 0.8;
          cur = mobs.filter(m => !m.friendly && !hitSet.has(m.uid) && Math.hypot(m.x - prev.x, m.y - prev.y) < 90)[0];
        }
        break;
      }
      case 'nova': {
        AUDIO.sfx(s.fx === 'slow' ? 'ice' : 'swing');
        novaFx(P.x, P.y - 8, s.radius, s.color);
        for (const mb of mobs) {
          if (mb.friendly) continue;
          if (Math.hypot(mb.x - P.x, mb.y - P.y) < s.radius + 10) {
            hurtMob(mb, base, false, s.fx);
            if (s.stun) mb.stun = Math.max(mb.stun, s.stun);
          }
        }
        hitArenaOpponents(P.x, P.y, s.radius, base);
        break;
      }
      case 'novaheal': {
        AUDIO.sfx('heal');
        novaFx(P.x, P.y - 8, s.radius, s.color);
        const healAmt = Math.floor((s.heal || 0) * (1 + INT * 0.04));
        P.hp = Math.min(P.maxHp, P.hp + healAmt);
        float(P.x, P.y - 26, '+' + healAmt, '#57c14f');
        for (const mb of mobs) {
          if (mb.friendly) continue;
          if (Math.hypot(mb.x - P.x, mb.y - P.y) < s.radius + 10) hurtMob(mb, base * (mb.def.undead || mb.def.demon ? 1.6 : 1), false);
        }
        break;
      }
      case 'ground': {
        // cast at nearest mob location or ahead of player
        const gx = nearest ? nearest.x : P.x + v.x * 70;
        const gy = nearest ? nearest.y : P.y + v.y * 70;
        AUDIO.sfx(id === 'meteor' ? 'fireball' : id === 'blizzard' ? 'ice' : 'fireball');
        grounds.push({ x: gx, y: gy, r: s.radius, color: s.color, t: s.dur, dps: base / Math.max(1, s.dur * 2), fx: s.fx, tick: 0, meteor: id === 'meteor', dmgOnce: id === 'meteor' ? base : 0, delay: id === 'meteor' ? 0.8 : 0 });
        break;
      }
      case 'heal': {
        AUDIO.sfx('heal');
        const amt = Math.floor((s.heal || 30) * (1 + INT * 0.05) * (s.scale || 1));
        P.hp = Math.min(P.maxHp, P.hp + amt);
        float(P.x, P.y - 26, '+' + amt, '#57c14f');
        burst(P.x, P.y - 10, '#57c14f', 10);
        break;
      }
      case 'buff': {
        AUDIO.sfx('buff');
        const b = Object.assign({}, s.buff);
        b.t = b.dur; b.name = s.name; b.icon = s.icon;
        P.buffs = P.buffs.filter(x => x.name !== s.name);
        P.buffs.push(b);
        burst(P.x, P.y - 10, s.color, 12);
        recalc();
        break;
      }
      case 'melee': {
        AUDIO.sfx('swing');
        const cx = P.x + v.x * 24, cy = P.y - 8 + v.y * 24;
        slashFx(cx, cy);
        for (const mb of mobs) {
          if (mb.friendly) continue;
          if (Math.hypot(mb.x - cx, mb.y - mobSprites[mb.id].h / 2 - cy) < 30) {
            hurtMob(mb, base, false, s.fx);
            if (s.stun) mb.stun = Math.max(mb.stun, s.stun);
          }
        }
        hitArenaOpponents(cx, cy, 30, base);
        break;
      }
      case 'dash': {
        AUDIO.sfx('swing');
        const dist = s.dist || 80;
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
          const nx = P.x + v.x * dist * i / steps, ny = P.y + v.y * dist * i / steps;
          if (!canStand(nx, ny)) break;
          P.x = nx; P.y = ny;
          for (const mb of mobs) {
            if (mb.friendly) continue;
            if (Math.hypot(mb.x - P.x, mb.y - P.y) < 24) hurtMob(mb, base, false);
          }
          particles.push({ x: P.x, y: P.y, vx: -v.x * 40, vy: -v.y * 40, t: 0.3, color: '#e8b34b', size: 3 });
        }
        break;
      }
      case 'taunt': {
        AUDIO.sfx('buff');
        novaFx(P.x, P.y - 8, s.radius, s.color);
        for (const mb of mobs) {
          if (mb.friendly) continue;
          if (Math.hypot(mb.x - P.x, mb.y - P.y) < s.radius) { mb.state = 'chase'; mb.aggroTarget = 'player'; mb.tauntT = 5; }
        }
        break;
      }
    }
    UI.refreshHud(); UI.refreshHotbar();
  };
  function nearestMob(range) {
    let best = null, bd = range || 200;
    for (const mb of mobs) {
      if (mb.friendly) continue;
      const d = Math.hypot(mb.x - P.x, mb.y - P.y);
      if (d < bd) { bd = d; best = mb; }
    }
    return best;
  }
  function shoot(p) { p.uid = uid++; projectiles.push(p); }
  GAME.shoot = shoot;
  // ---------------- fx helpers ----------------
  function float(x, y, text, color) { floats.push({ x, y, text: String(text), color, t: 1.1, vy: -26 }); }
  GAME.float = float;
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 60;
      particles.push({ x, y: y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, t: 0.4 + Math.random() * 0.35, color, size: 2 + (Math.random() * 2 | 0) });
    }
  }
  GAME.burst = burst;
  function slashFx(x, y) { particles.push({ x, y, vx: 0, vy: 0, t: 0.15, color: '#ffffff', size: 14, slash: true, ang: Math.random() * Math.PI }); }
  function boltFx(x, y) {
    for (let i = 0; i < 6; i++) particles.push({ x: x + (Math.random() * 10 - 5), y: y - i * 14, vx: 0, vy: 0, t: 0.18, color: i % 2 ? '#fff8c0' : '#f2d34b', size: 5 });
    burst(x, y, '#f2d34b', 8);
  }
  function chainFx(x1, y1, x2, y2) {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      particles.push({ x: x1 + (x2 - x1) * i / steps + (Math.random() * 8 - 4), y: y1 + (y2 - y1) * i / steps + (Math.random() * 8 - 4), vx: 0, vy: 0, t: 0.16, color: '#f2d34b', size: 3 });
    }
  }
  function novaFx(x, y, r, color) {
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * Math.PI * 2;
      particles.push({ x, y, vx: Math.cos(a) * r * 2.2, vy: Math.sin(a) * r * 2.2, t: 0.4, color, size: 3 });
    }
  }
  // ============================================================
  // movement / collision
  // ============================================================
  function dirVec(dir) {
    return dir === 'up' ? { x: 0, y: -1 } : dir === 'down' ? { x: 0, y: 1 } : dir === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };
  }
  function canStand(px, py) {
    // feet box
    for (const [ox, oy] of [[-5, -2], [5, -2], [-5, 4], [5, 4]]) {
      if (W().isSolid(map, (px + ox) / TS | 0, (py + oy) / TS | 0)) return false;
    }
    return true;
  }
  function moveEntity(e, dx, dy) {
    if (dx && canStandMob(e, e.x + dx, e.y)) e.x += dx;
    if (dy && canStandMob(e, e.x, e.y + dy)) e.y += dy;
  }
  function canStandMob(e, px, py) {
    for (const [ox, oy] of [[-5, -2], [5, -2], [-5, 3], [5, 3]]) {
      if (W().isSolid(map, (px + ox) / TS | 0, (py + oy) / TS | 0)) return false;
    }
    return true;
  }
  // ============================================================
  // interaction (E key)
  // ============================================================
  function getInteractable() {
    // NPCs (incl. door actions)
    let best = null, bd = 34;
    for (const n of map.npcs) {
      const d = Math.hypot(n.x - P.x, n.y - P.y);
      const r = n.r || 26;
      if (d < r + 8 && d < bd + 8) { best = { kind: 'npc', n }; bd = d; }
    }
    if (best) return best;
    // objects: chest, herb, sign, ore, crystal, campfire/anvil craft, stall
    const tx = P.x / TS | 0, ty = P.y / TS | 0;
    for (const o of map.objects) {
      if (Math.abs(o.x - tx) <= 1 && Math.abs(o.y - ty) <= 1) {
        if (o.type === 'chest' && !o.openedLocal) return { kind: 'chest', o };
        if (o.pick) return { kind: 'pick', o };
        if (o.signText) return { kind: 'sign', o };
        if (o.craft) return { kind: 'craft', o };
        if (o.market) return { kind: 'market', o };
      }
    }
    // exits
    for (const ex of map.exits) {
      if (tx >= ex.x - 1 && tx <= ex.x + ex.w && ty >= ex.y - 1 && ty <= ex.y + ex.h) return { kind: 'exit', ex };
    }
    // door tiles (inn etc. handled via invisible npcs already)
    return null;
  }
  function interact() {
    const it = getInteractable();
    if (!it) return;
    AUDIO.sfx('click');
    if (it.kind === 'npc') {
      const n = it.n;
      if (n.doorAction) { UI.doAction(n.doorAction); return; }
      if (n.deliverTarget) checkDeliver(n.deliverTarget);
      if (n.story) GAME.talkStory(n.story === 'elder' ? 'elder' : n.story);
      if (n.king) GAME.talkStory('king');
      UI.openDialog(n);
      return;
    }
    if (it.kind === 'chest') {
      const o = it.o;
      o.openedLocal = true; o.type = 'chestopen';
      AUDIO.sfx('chest');
      const loot = rollChestLoot(o.chestTier);
      const names = [];
      for (const l of loot) { GAME.addItem(l.id, l.n); const def = D().ITEMS[l.id]; names.push(def.name); UI.toast('Found: ' + def.name, D().RARITY[def.rarity].color); }
      const g = 10 * o.chestTier + Math.random() * 30 * o.chestTier | 0;
      P.gold += g; UI.toast('Found: ' + g + ' gold', '#f2c14b');
      burst(o.x * TS + 8, o.y * TS + 8, '#f2c14b', 14);
      return;
    }
    if (it.kind === 'pick') {
      const o = it.o;
      GAME.addItem(o.pick, 1);
      questProgress('gather', o.pick, 1);
      float(o.x * TS + 8, o.y * TS, '+' + D().ITEMS[o.pick].name, '#a8e89a');
      AUDIO.sfx('coin');
      W().removeObj(map, o);
      // herbs regrow
      if (o.pick === 'herb') setTimeout(() => { if (map) W().addObj(map, 'herb', o.x, o.y, false, { pick: 'herb' }); }, 60000);
      return;
    }
    if (it.kind === 'sign') { UI.openSign(it.o.signText); return; }
    if (it.kind === 'craft') { UI.openCraft(); return; }
    if (it.kind === 'market') { UI.openMarket(); return; }
    if (it.kind === 'exit') {
      const ex = it.ex;
      GAME.enterMap(ex.to, ex.tx, ex.ty);
      return;
    }
  }
  function checkDeliver(target) {
    for (const j of P.jobs) {
      if (j.done) continue;
      const tpl = D().JOBS[j.idx];
      if (tpl.type === 'deliver' && tpl.to === target) { j.progress = 1; j.done = true; UI.toast('Delivered! Return to the guild.', '#a8e89a'); AUDIO.sfx('quest'); }
    }
  }
  // ============================================================
  // update loop
  // ============================================================
  function update(dt) {
    frameT += dt;
    // world clock: 1 game minute per real second (24h day = 24 min)
    GAME.time += dt * 60 * 1;
    if (GAME.time >= 1440) { GAME.time -= 1440; GAME.day++; }
    // cooldowns
    atkCd = Math.max(0, atkCd - dt);
    attackAnim = Math.max(0, attackAnim - dt);
    for (const id in spellCds) spellCds[id] = Math.max(0, spellCds[id] - dt);
    if (P.hurtT) P.hurtT = Math.max(0, P.hurtT - dt);
    saveTimer += dt;
    if (saveTimer > 12) { saveTimer = 0; GAME.save(); }
    // buffs
    let buffsChanged = false;
    for (const b of P.buffs) {
      b.t -= dt;
      if (b.regen) { P.hp = Math.min(P.maxHp, P.hp + b.regen * dt); }
    }
    const before = P.buffs.length;
    P.buffs = P.buffs.filter(b => b.t > 0);
    if (P.buffs.length !== before) { recalc(); buffsChanged = true; }
    // effects (dots on player)
    for (const k in P.effects) {
      const e = P.effects[k];
      e.t -= dt;
      if (e.dps) { P.hp -= e.dps * dt; if (P.hp <= 0) { playerDie(); return; } }
      if (e.t <= 0) delete P.effects[k];
    }
    // natural regen out of combat
    P.mp = Math.min(P.maxMp, P.mp + (1.2 + P.base.int * 0.06) * dt);
    if (!mobs.some(m => m.state === 'chase' && !m.friendly)) P.hp = Math.min(P.maxHp, P.hp + 1.0 * dt);
    // tile damage (lava)
    const td = W().tileDamage(map, P.x / TS | 0, P.y / TS | 0);
    if (td) { P.hp -= td * dt * 3; P.hurtT = 0.1; if (P.hp <= 0) { playerDie(); return; } }
    // input movement
    let dx = 0, dy = 0;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;
    const moving = dx || dy;
    if (moving) {
      if (Math.abs(dx) > Math.abs(dy)) P.dir = dx > 0 ? 'right' : 'left';
      else if (dy) P.dir = dy > 0 ? 'down' : 'up';
      let sp = P.speed;
      for (const b of P.buffs) if (b.haste) sp *= 1 + b.haste;
      if (P.effects.slow) sp *= 0.55;
      const len = Math.hypot(dx, dy) || 1;
      const nx = P.x + dx / len * sp * dt, ny = P.y + dy / len * sp * dt;
      if (canStand(nx, P.y)) P.x = nx;
      if (canStand(P.x, ny)) P.y = ny;
      P.animT = (P.animT || 0) + dt;
    } else P.animT = 0;
    P.moving = !!moving;
    // spawns & war
    updateZones(dt);
    updateWar(dt);
    // mobs
    updateMobs(dt);
    // escort follows
    updateEscort(dt);
    // projectiles
    updateProjectiles(dt);
    // ground effects
    for (const g of grounds) {
      if (g.delay > 0) { g.delay -= dt; continue; }
      g.t -= dt;
      if (g.dmgOnce) {
        // meteor impact
        burst(g.x, g.y, '#f08040', 24);
        AUDIO.sfx('bossroar');
        for (const mb of mobs) if (!mb.friendly && Math.hypot(mb.x - g.x, mb.y - g.y) < g.r) hurtMob(mb, g.dmgOnce, false, g.fx);
        g.dmgOnce = 0;
      }
      g.tick -= dt;
      if (g.tick <= 0) {
        g.tick = 0.5;
        for (const mb of mobs) {
          if (mb.friendly) continue;
          if (Math.hypot(mb.x - g.x, mb.y - g.y) < g.r) hurtMob(mb, g.dps, false, g.fx);
        }
        if (g.hostile && Math.hypot(P.x - g.x, P.y - g.y) < g.r) hurtPlayer(g.dps, g.x, g.y, g.fx);
      }
    }
    grounds = grounds.filter(g => g.t > 0);
    // particles / floats / corpses
    for (const p of particles) { p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; p.t -= dt; }
    particles = particles.filter(p => p.t > 0);
    for (const f of floats) { f.y += f.vy * dt; f.t -= dt; }
    floats = floats.filter(f => f.t > 0);
    for (const c of corpses) c.t -= dt;
    corpses = corpses.filter(c => c.t > 0);
    // camera
    const vw = canvas.width / SCALE, vh = canvas.height / SCALE;
    cam.x = Math.max(0, Math.min(map.w * TS - vw, P.x - vw / 2));
    cam.y = Math.max(0, Math.min(map.h * TS - vh, P.y - vh / 2));
    // interact tip
    const it = getInteractable();
    UI.showInteract(it);
    // network position
    if (window.NET) NET.tick(dt);
  }
  // ---------------- mob AI ----------------
  function updateMobs(dt) {
    for (const mb of mobs) {
      if (mb.flash) mb.flash = Math.max(0, mb.flash - dt);
      if (mb.stun > 0) { mb.stun -= dt; continue; }
      mb.cd = Math.max(0, mb.cd - dt);
      if (mb.slow > 0) mb.slow -= dt;
      // dots
      for (const d of mb.dots) {
        d.t -= dt; mb.hp -= d.dps * dt;
        if (Math.random() < dt * 4) particles.push({ x: mb.x + Math.random() * 10 - 5, y: mb.y - 10, vx: 0, vy: -20, t: 0.3, color: d.kind === 'burn' ? '#f08040' : '#7ab02a', size: 2 });
      }
      mb.dots = mb.dots.filter(d => d.t > 0);
      if (mb.hp <= 0) { killMob(mb); continue; }
      const def = mb.def;
      let speed = def.speed * (mb.slow > 0 ? 0.5 : 1);
      // pick target: war mobs fight each other
      let tgt = null, tgtIsPlayer = false;
      if (mb.faction === 'human') {
        tgt = nearestOf(mb, m => m.def.demon || m.warMob);
      } else if (mb.warMob) {
        const soldier = nearestOf(mb, m => m.faction === 'human');
        const dSoldier = soldier ? Math.hypot(soldier.x - mb.x, soldier.y - mb.y) : 1e9;
        const dPlayer = Math.hypot(P.x - mb.x, P.y - mb.y);
        if (dPlayer < dSoldier && dPlayer < def.aggro * 1.4) { tgt = P; tgtIsPlayer = true; }
        else tgt = soldier;
      } else {
        const dP = Math.hypot(P.x - mb.x, P.y - mb.y);
        const dE = escort ? Math.hypot(escort.x - mb.x, escort.y - mb.y) : 1e9;
        if (mb.escortAttacker && escort && dE < dP) { tgt = escort; }
        else if (dP < def.aggro || mb.state === 'chase') { tgt = P; tgtIsPlayer = true; }
      }
      // player in a safe zone: monsters give up
      if (tgtIsPlayer && W().safeZoneAt(map, P.x, P.y)) { tgt = null; mb.state = 'idle'; }
      if (tgt) {
        mb.state = 'chase';
        const dx = tgt.x - mb.x, dy = (tgt.y - (tgtIsPlayer ? 8 : 0)) - mb.y;
        const dist = Math.hypot(dx, dy) || 1;
        mb.dir = dx < 0 ? -1 : 1;
        const wantRange = def.ranged ? def.ranged * 0.85 : 14;
        if (dist > wantRange) {
          moveEntity(mb, dx / dist * speed * dt, dy / dist * speed * dt);
          mb.animT = (mb.animT || 0) + dt;
        }
        // attack
        if (mb.cd <= 0) {
          if (def.ranged && dist < def.ranged * 1.1) {
            mb.cd = def.atkCd;
            shoot({ x: mb.x, y: mb.y - 10, vx: dx / dist * 170, vy: dy / dist * 170, r: 4, color: def.proj || '#f08040', dmg: def.atk, from: 'mob', mob: mb, life: 1.6, fx: def.fx, targetPlayer: tgtIsPlayer, targetEnt: tgtIsPlayer ? null : tgt });
          } else if (!def.ranged && dist < 20) {
            mb.cd = def.atkCd;
            if (tgtIsPlayer) hurtPlayer(def.atk * (0.85 + Math.random() * 0.3), mb.x, mb.y, def.fx);
            else { tgt.hp -= def.atk; if (tgt !== escort) { tgt.flash = 0.1; if (tgt.hp <= 0) killMob(tgt); } else { float(escort.x, escort.y - 24, '-' + def.atk, '#ff6a5a'); if (escort.hp <= 0) failEscort(); } }
          }
        }
        // bosses
        if (def.boss) updateBoss(mb, dt, dist, dx, dy);
        // deaggro if too far
        if (tgtIsPlayer && dist > def.aggro * 3 && !mb.tauntT) mb.state = 'idle';
      } else {
        // wander
        mb.wanderT -= dt;
        if (mb.wanderT <= 0) {
          mb.wanderT = 2 + Math.random() * 3;
          const a = Math.random() * Math.PI * 2;
          mb.wx = Math.cos(a); mb.wy = Math.sin(a);
          if (Math.random() < 0.4) { mb.wx = 0; mb.wy = 0; }
        }
        if (mb.wx || mb.wy) {
          moveEntity(mb, mb.wx * speed * 0.4 * dt, mb.wy * speed * 0.4 * dt);
          mb.dir = mb.wx < 0 ? -1 : 1;
          mb.animT = (mb.animT || 0) + dt;
        }
      }
      if (mb.tauntT) mb.tauntT = Math.max(0, mb.tauntT - dt);
      // boss bar
      if (mb.isMapBoss && mb.state === 'chase' && !bossActive) {
        bossActive = mb;
        UI.showBossBar(def.name);
        AUDIO.playMusic('boss');
        AUDIO.sfx('bossroar');
      }
    }
    if (bossActive) UI.updateBossBar(bossActive.hp / bossActive.maxHp);
  }
  function nearestOf(mb, pred) {
    let best = null, bd = 240;
    for (const m of mobs) {
      if (m === mb || !pred(m)) continue;
      const d = Math.hypot(m.x - mb.x, m.y - mb.y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  function updateBoss(mb, dt, dist, dx, dy) {
    mb.patT -= dt;
    if (mb.patT > 0) return;
    const def = mb.def;
    let pattern = def.pattern;
    if (pattern === 'phases') {
      const frac = mb.hp / mb.maxHp;
      pattern = frac > 0.66 ? 'dash' : frac > 0.33 ? 'volley' : (Math.random() < 0.5 ? 'summon' : 'nova');
      if (frac < 0.33 && !mb.enraged) { mb.enraged = true; mb.def = Object.assign({}, def, { speed: def.speed * 1.4, atkCd: def.atkCd * 0.7 }); UI.announce('AZGARETH IS ENRAGED!', ''); AUDIO.sfx('bossroar'); }
    }
    mb.patT = 5 + Math.random() * 3;
    switch (pattern) {
      case 'slam': {
        grounds.push({ x: mb.x, y: mb.y, r: 60, color: '#f08040', t: 0.6, dps: def.atk * 0.8, fx: def.fx, tick: 0.35, hostile: true, telegraph: 0.5 });
        AUDIO.sfx('bossroar');
        break;
      }
      case 'summon': {
        if (mb.summonCount < 4 && def.summons) {
          for (let i = 0; i < 2; i++) {
            const s = spawnMob(def.summons, mb.x + (Math.random() * 60 - 30), mb.y + (Math.random() * 60 - 30), null);
            if (s) { s.state = 'chase'; mb.summonCount++; }
          }
          float(mb.x, mb.y - 40, 'summons aid!', '#c88ae8');
        }
        break;
      }
      case 'volley': {
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2;
          shoot({ x: mb.x, y: mb.y - 10, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, r: 4, color: def.proj || '#8a4fc8', dmg: def.atk * 0.7, from: 'mob', life: 1.8, targetPlayer: true });
        }
        AUDIO.sfx('fireball');
        break;
      }
      case 'nova': {
        grounds.push({ x: P.x, y: P.y, r: 55, color: '#8cd4f0', t: 1.6, dps: def.atk * 0.5, fx: 'slow', tick: 0.4, hostile: true });
        AUDIO.sfx('ice');
        break;
      }
      case 'dash': {
        const d2 = Math.hypot(dx, dy) || 1;
        mb.dashVx = dx / d2 * def.speed * 4; mb.dashVy = dy / d2 * def.speed * 4; mb.dashT = 0.4;
        AUDIO.sfx('swing');
        break;
      }
      case 'breath': {
        const baseAng = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const a = baseAng + i * 0.18;
          shoot({ x: mb.x, y: mb.y - 12, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 5, color: '#f08040', dmg: def.atk * 0.8, from: 'mob', life: 1.4, fx: 'burn', targetPlayer: true });
        }
        AUDIO.sfx('fireball');
        break;
      }
    }
  }
  function updateEscort(dt) {
    if (!escort) return;
    const d = Math.hypot(P.x - escort.x, P.y - escort.y);
    if (d > 30) {
      const dx = (P.x - escort.x) / d, dy = (P.y - escort.y) / d;
      const sp = Math.min(110, d * 1.5);
      escort.x += dx * sp * dt; escort.y += dy * sp * dt;
      escort.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      escort.animT = (escort.animT || 0) + dt;
    } else escort.animT = 0;
    // ambushes
    escort.ambushT -= dt;
    if (escort.ambushT <= 0 && map.id === 'overworld' && !W().safeZoneAt(map, P.x, P.y)) {
      escort.ambushT = 16 + Math.random() * 10;
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = spawnMob('bandit', P.x + Math.cos(a) * 130, P.y + Math.sin(a) * 130, null, { escortAttacker: true });
        if (s) s.state = 'chase';
      }
      UI.toast('Ambush! Protect ' + escort.name + '!', '#ff9a8a');
      AUDIO.sfx('bossroar');
    }
    // reached destination?
    const zone = W().safeZoneAt(map, escort.x, escort.y);
    if (zone) {
      const zoneKey = zone.name.toLowerCase().split(' ')[0];
      if (zoneKey === escort.to || (escort.to === 'aldenhaven' && zone.name.startsWith('Aldenhaven'))) {
        const j = escort.job;
        j.progress = 1; j.done = true;
        UI.toast('Escort complete! Return to the guild.', '#a8e89a');
        AUDIO.sfx('quest');
        escort = null;
        UI.refreshQuests();
      }
    }
  }
  function failEscort() {
    if (!escort) return;
    UI.toast('Escort failed... ' + escort.name + ' has fallen.', '#ff9a8a');
    P.jobs = P.jobs.filter(j => j !== escort.job);
    escort = null;
    UI.refreshQuests();
  }
  function updateProjectiles(dt) {
    for (const pr of projectiles) {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.life -= dt;
      // walls
      if (W().isSolid(map, pr.x / TS | 0, pr.y / TS | 0)) { pr.life = 0; burst(pr.x, pr.y, pr.color, 4); continue; }
      if (pr.from === 'player') {
        for (const mb of mobs) {
          if (mb.friendly) continue;
          const sp = mobSprites[mb.id];
          if (Math.hypot(mb.x - pr.x, mb.y - sp.h / 2 - pr.y) < 10 + sp.w / 3) {
            if (pr.aoe) {
              burst(pr.x, pr.y, pr.color, 12);
              for (const m2 of mobs) if (!m2.friendly && Math.hypot(m2.x - pr.x, m2.y - pr.y) < pr.aoe + 10) hurtMob(m2, pr.dmg, pr.crit, pr.fx);
            } else hurtMob(mb, pr.dmg, pr.crit, pr.fx);
            pr.life = 0;
            break;
          }
        }
        // arena pvp projectiles
        if (pr.life > 0 && window.NET && map.arena && W().inArena(map, P.x, P.y)) {
          NET.remoteList().forEach(rp => {
            if (rp.map !== P.map || !W().inArena(map, rp.x, rp.y)) return;
            if (Math.hypot(rp.x - pr.x, rp.y - 12 - pr.y) < 14) { NET.sendPvpHit(rp.id, pr.dmg); pr.life = 0; AUDIO.sfx('pvp'); }
          });
        }
      } else {
        // hostile projectile
        if (pr.targetPlayer !== false) {
          if (Math.hypot(P.x - pr.x, (P.y - 10) - pr.y) < 10) { hurtPlayer(pr.dmg, pr.x, pr.y, pr.fx); pr.life = 0; continue; }
        }
        if (pr.targetEnt && pr.targetEnt.hp > 0) {
          if (Math.hypot(pr.targetEnt.x - pr.x, pr.targetEnt.y - 8 - pr.y) < 12) {
            pr.targetEnt.hp -= pr.dmg;
            if (pr.targetEnt.hp <= 0 && pr.targetEnt !== escort) killMob(pr.targetEnt);
            pr.life = 0;
          }
        }
        if (escort && Math.hypot(escort.x - pr.x, escort.y - 8 - pr.y) < 10) {
          escort.hp -= pr.dmg; float(escort.x, escort.y - 24, '-' + pr.dmg, '#ff6a5a');
          if (escort.hp <= 0) failEscort();
          pr.life = 0;
        }
      }
      // trail
      if (Math.random() < dt * 30) particles.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, t: 0.2, color: pr.color, size: 2 });
    }
    projectiles = projectiles.filter(p => p.life > 0);
  }
  // ============================================================
  // rendering
  // ============================================================
  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0c0805';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.scale(SCALE, SCALE);
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    const vx0 = cam.x / TS | 0, vy0 = cam.y / TS | 0;
    const vx1 = Math.min(map.w - 1, (cam.x + w / SCALE) / TS + 1 | 0), vy1 = Math.min(map.h - 1, (cam.y + h / SCALE) / TS + 1 | 0);
    // tiles
    const animF = (frameT * 2 | 0) % 2;
    for (let ty = vy0; ty <= vy1; ty++) {
      for (let tx = vx0; tx <= vx1; tx++) {
        const t = W().TILES[W().getT(map, tx, ty)];
        let img = PXA.tiles[t.k];
        if (Array.isArray(img)) img = img[animF];
        if (img) ctx.drawImage(img, tx * TS, ty * TS);
      }
    }
    // ground effects (telegraph circles)
    for (const g of grounds) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = g.color;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = g.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // corpse poofs
    for (const c of corpses) {
      ctx.globalAlpha = c.t * 2;
      ctx.fillStyle = '#d8d0c0';
      ctx.fillRect(c.x - 4, c.y - 8, 8, 6);
      ctx.globalAlpha = 1;
    }
    // depth-sorted drawables
    const drawables = [];
    for (const o of map.objects) {
      if (o.x < vx0 - 2 || o.x > vx1 + 2 || o.y < vy0 - 3 || o.y > vy1 + 2) continue;
      drawables.push({ y: o.y * TS + TS, kind: 'obj', o });
    }
    for (const mb of mobs) {
      if (mb.x < cam.x - 40 || mb.x > cam.x + w / SCALE + 40 || mb.y < cam.y - 40 || mb.y > cam.y + h / SCALE + 40) continue;
      drawables.push({ y: mb.y, kind: 'mob', mb });
    }
    for (const n of map.npcs) {
      if (n.invisible) continue;
      if (n.x < cam.x - 40 || n.x > cam.x + w / SCALE + 40) continue;
      drawables.push({ y: n.y, kind: 'npc', n });
    }
    if (escort) drawables.push({ y: escort.y, kind: 'escort' });
    drawables.push({ y: P.y, kind: 'player' });
    if (window.NET) NET.remoteList().forEach(rp => { if (rp.map === P.map) drawables.push({ y: rp.y, kind: 'remote', rp }); });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === 'obj') drawObject(d.o);
      else if (d.kind === 'mob') drawMob(d.mb);
      else if (d.kind === 'npc') drawNpc(d.n);
      else if (d.kind === 'player') drawPlayer();
      else if (d.kind === 'escort') drawEscort();
      else if (d.kind === 'remote') drawRemote(d.rp);
    }
    // projectiles
    for (const pr of projectiles) {
      ctx.fillStyle = pr.color;
      ctx.fillRect(pr.x - pr.r / 2, pr.y - pr.r / 2, pr.r, pr.r);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(pr.x - 1, pr.y - 1, 2, 2);
    }
    // particles
    for (const p of particles) {
      if (p.slash) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang);
        ctx.fillStyle = 'rgba(255,255,255,' + (p.t * 5) + ')';
        ctx.fillRect(-p.size, -1, p.size * 2, 2);
        ctx.restore();
      } else {
        ctx.globalAlpha = Math.min(1, p.t * 3);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }
    // floats
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.globalAlpha = Math.min(1, f.t * 2);
      ctx.fillStyle = '#221507';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // lighting overlay
    drawLighting(w, h);
  }
  function drawObject(o) {
    const img = PXA.props[o.type] || PXA.props.rock;
    const ox = o.x * TS + TS / 2 - img.width / 2;
    const oy = o.y * TS + TS - img.height;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(o.x * TS + 2, o.y * TS + TS - 3, TS - 4, 3);
    ctx.drawImage(img, Math.round(ox), Math.round(oy));
  }
  function shadow(x, y, w2) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, w2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  }
  function heroFrame(sheet, dir, animT, moving) {
    const frames = sheet[dir] || sheet.down;
    if (!moving) return frames[0];
    const f = (animT * 7 | 0) % 2;
    return frames[1 + f];
  }
  function drawPlayer() {
    if (!heroSheet) return;
    shadow(P.x, P.y + 1, 6);
    const img = heroFrame(heroSheet, P.dir, P.animT || 0, P.moving);
    const bob = P.moving ? Math.abs(Math.sin((P.animT || 0) * 14)) * -1 : 0;
    if (P.hurtT > 0) ctx.globalAlpha = 0.55;
    // weapon behind when facing up
    const wpn = P.equip.weapon && D().ITEMS[P.equip.weapon];
    if (attackAnim > 0 && wpn && P.dir === 'up') drawWeapon(wpn);
    ctx.drawImage(img, Math.round(P.x - img.width / 2), Math.round(P.y - img.height + 2 + bob));
    if (attackAnim > 0 && wpn && P.dir !== 'up') drawWeapon(wpn);
    ctx.globalAlpha = 1;
    // buffs ring
    if (P.buffs.some(b => b.shield > 0)) {
      ctx.strokeStyle = 'rgba(100,170,255,.6)';
      ctx.beginPath(); ctx.arc(P.x, P.y - 10, 14, 0, Math.PI * 2); ctx.stroke();
    }
    drawNameTag(P.x, P.y - 26, P.name, '#ffe9c0', P.level);
  }
  function drawWeapon(wpn) {
    const img = PXA.weapon(wpn.kind);
    const v = dirVec(attackDir || P.dir);
    const prog = 1 - attackAnim / 0.22;
    const ang = Math.atan2(v.y, v.x) + (prog - 0.5) * 2.2;
    ctx.save();
    ctx.translate(P.x + v.x * 8, P.y - 10 + v.y * 6);
    ctx.rotate(ang + Math.PI / 2);
    ctx.drawImage(img, -8, -16);
    ctx.restore();
  }
  function drawEscort() {
    if (!escort) return;
    shadow(escort.x, escort.y + 1, 6);
    const img = heroFrame(escort.sheet, escort.dir, escort.animT || 0, escort.animT > 0);
    ctx.drawImage(img, Math.round(escort.x - img.width / 2), Math.round(escort.y - img.height + 2));
    drawNameTag(escort.x, escort.y - 26, escort.name, '#a8e89a');
    // hp bar
    ctx.fillStyle = '#221507'; ctx.fillRect(escort.x - 10, escort.y - 24, 20, 3);
    ctx.fillStyle = '#57c14f'; ctx.fillRect(escort.x - 10, escort.y - 24, 20 * Math.max(0, escort.hp / escort.maxHp), 3);
  }
  function drawNpc(n) {
    if (!npcSheets[n.id]) npcSheets[n.id] = PXA.makeHero(n.look);
    // idle wander
    if (n.wander) {
      n.wt = (n.wt || 0) - 1 / 60;
      if (n.wt <= 0) { n.wt = 2 + Math.random() * 4; n.wdx = Math.random() < 0.6 ? 0 : (Math.random() * 2 - 1); n.wdy = Math.random() < 0.6 ? 0 : (Math.random() * 2 - 1); n.home = n.home || { x: n.x, y: n.y }; }
      if (n.wdx || n.wdy) {
        const nx = n.x + n.wdx * 14 / 60, ny = n.y + n.wdy * 14 / 60;
        if (Math.hypot(nx - n.home.x, ny - n.home.y) < n.wander && canStand(nx, ny)) { n.x = nx; n.y = ny; n.animT = (n.animT || 0) + 1 / 60; }
        n.dir = Math.abs(n.wdx) > Math.abs(n.wdy) ? (n.wdx > 0 ? 'right' : 'left') : (n.wdy > 0 ? 'down' : 'up');
      } else n.animT = 0;
    }
    shadow(n.x, n.y + 1, 6);
    const img = heroFrame(npcSheets[n.id], n.dir || 'down', n.animT || 0, (n.animT || 0) > 0);
    ctx.drawImage(img, Math.round(n.x - img.width / 2), Math.round(n.y - img.height + 2));
    if (n.king) { // little crown
      ctx.fillStyle = '#f2c14b'; ctx.fillRect(n.x - 4, n.y - img.height, 8, 2);
      ctx.fillRect(n.x - 4, n.y - img.height - 2, 2, 2); ctx.fillRect(n.x - 1, n.y - img.height - 2, 2, 2); ctx.fillRect(n.x + 2, n.y - img.height - 2, 2, 2);
    }
    drawNameTag(n.x, n.y - 26, n.name, '#8fd4ff');
    // quest marker
    if (n.story || (n.dial && D().STORY[P.story] && D().STORY[P.story].npc === n.story)) { }
    const st = D().STORY[P.story];
    if (st && st.type === 'talk' && n.story === st.npc) {
      ctx.fillStyle = '#f2d34b';
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', n.x, n.y - 30 + Math.sin(frameT * 4) * 2);
    }
  }
  function drawRemote(rp) {
    if (!rp.sheet) rp.sheet = PXA.makeHero(rp.look || { hair: 0, skin: 0, cls: rp.cls || 'swordsman' });
    shadow(rp.x, rp.y + 1, 6);
    const img = heroFrame(rp.sheet, rp.dir || 'down', rp.animT || 0, rp.moving);
    if (rp.moving) rp.animT = (rp.animT || 0) + 1 / 60;
    ctx.drawImage(img, Math.round(rp.x - img.width / 2), Math.round(rp.y - img.height + 2));
    drawNameTag(rp.x, rp.y - 26, rp.name, '#8fd4ff', rp.level);
    if (rp.chatBubble && rp.chatT > 0) {
      rp.chatT -= 1 / 60;
      ctx.font = '7px monospace'; ctx.textAlign = 'center';
      const tw = Math.min(120, ctx.measureText(rp.chatBubble).width + 8);
      ctx.fillStyle = 'rgba(255,250,235,.92)';
      ctx.fillRect(rp.x - tw / 2, rp.y - 46, tw, 11);
      ctx.fillStyle = '#221507';
      ctx.fillText(rp.chatBubble, rp.x, rp.y - 38);
    }
  }
  function drawNameTag(x, y, name, color, level) {
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    const label = (level ? 'Lv' + level + ' ' : '') + name;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    const tw = ctx.measureText(label).width;
    ctx.fillRect(x - tw / 2 - 2, y - 7, tw + 4, 9);
    ctx.fillStyle = color;
    ctx.fillText(label, x, y);
  }
  function drawMob(mb) {
    const sp = mobSprites[mb.id];
    const def = mb.def;
    const scale = def.scale || 1;
    const f = mb.animT ? ((mb.animT * 6 | 0) % 2) : ((frameT * 2 + mb.uid) | 0) % 2;
    let img = sp.frames[f];
    const w2 = img.width * scale, h2 = img.height * scale;
    const bobF = def.floaty || def.flying ? Math.sin(frameT * 3 + mb.uid) * 3 - (def.flying ? 6 : 3) : 0;
    shadow(mb.x, mb.y + 1, w2 / 3);
    ctx.save();
    ctx.translate(Math.round(mb.x), Math.round(mb.y + bobF));
    if (mb.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w2 / 2, -h2 + 2, w2, h2);
    ctx.restore();
    if (mb.flash > 0) {
      ctx.globalAlpha = mb.flash * 5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.save();
      ctx.translate(Math.round(mb.x), Math.round(mb.y + bobF));
      if (mb.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -w2 / 2, -h2 + 2, w2, h2);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    // hp bar
    if (mb.hp < mb.maxHp) {
      ctx.fillStyle = '#221507'; ctx.fillRect(mb.x - 10, mb.y - h2 - 4, 20, 3);
      ctx.fillStyle = mb.friendly ? '#57c14f' : '#d8362e';
      ctx.fillRect(mb.x - 10, mb.y - h2 - 4, 20 * Math.max(0, mb.hp / mb.maxHp), 3);
    }
    // name for bosses / friendlies
    if (def.boss || mb.friendly) drawNameTag(mb.x, mb.y - h2 - 7, def.name, def.boss ? '#ff9a8a' : '#a8e89a');
    // stun stars
    if (mb.stun > 0) {
      ctx.fillStyle = '#f2d34b';
      ctx.fillRect(mb.x - 6 + Math.sin(frameT * 8) * 5, mb.y - h2 - 2, 2, 2);
      ctx.fillRect(mb.x + 4 - Math.sin(frameT * 8) * 5, mb.y - h2 - 4, 2, 2);
    }
  }
  // lighting: day/night + darkness in dungeons + light sources
  let lightCanvas = null;
  function drawLighting(w, h) {
    const hour = GAME.time / 60;
    let darkness = 0;
    if (map.dark) darkness = 0.86;
    else {
      // night curve: dark 20:00-05:00
      if (hour >= 20 || hour < 5) darkness = 0.62;
      else if (hour >= 18) darkness = (hour - 18) / 2 * 0.62;
      else if (hour < 7) darkness = (1 - (hour - 5) / 2) * 0.62;
    }
    if (darkness <= 0.02) return;
    if (!lightCanvas || lightCanvas.width !== w || lightCanvas.height !== h) {
      lightCanvas = document.createElement('canvas');
      lightCanvas.width = w; lightCanvas.height = h;
    }
    const lg = lightCanvas.getContext('2d');
    lg.clearRect(0, 0, w, h);
    lg.fillStyle = map.dark ? 'rgba(8,4,12,' + darkness + ')' : 'rgba(10,10,40,' + darkness + ')';
    lg.fillRect(0, 0, w, h);
    lg.globalCompositeOperation = 'destination-out';
    function light(px, py, r, intensity) {
      const sx = (px - cam.x) * SCALE, sy = (py - cam.y) * SCALE;
      const sr = r * SCALE;
      const grad = lg.createRadialGradient(sx, sy, 0, sx, sy, sr);
      grad.addColorStop(0, 'rgba(0,0,0,' + intensity + ')');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = grad;
      lg.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }
    // player light: magic light > torch > small ambient
    let pr = 42;
    if (GAME.countItem('magic_light') > 0) pr = 8 * TS;
    else if (GAME.countItem('torch_item') > 0) pr = 4.5 * TS;
    light(P.x, P.y - 8, pr, 0.95);
    // object lights
    for (const o of map.objects) {
      if (o.type === 'campfire' || o.type === 'torch') light(o.x * TS + 8, o.y * TS + 8, 3.5 * TS, 0.85);
      if (o.type === 'portal') light(o.x * TS + 8, o.y * TS + 8, 3 * TS, 0.7);
      if (o.type === 'crystal') light(o.x * TS + 8, o.y * TS + 8, 2 * TS, 0.5);
    }
    // projectiles glow
    for (const pr2 of projectiles) light(pr2.x, pr2.y, 24, 0.6);
    lg.globalCompositeOperation = 'source-over';
    ctx.drawImage(lightCanvas, 0, 0);
  }
  // ============================================================
  // save / load
  // ============================================================
  GAME.serialize = function () {
    return {
      v: 1, name: P.name, cls: P.cls, look: P.look, level: P.level, xp: P.xp,
      statPoints: P.statPoints, base: P.base, gold: P.gold, hp: P.hp, mp: P.mp,
      inv: P.inv, equip: P.equip, spells: P.spells, hotbar: P.hotbar,
      map: P.map, x: P.x, y: P.y, spawn: P.spawn,
      story: P.story, storyProg: P.storyProg || 0, jobs: P.jobs, guildPts: P.guildPts, rank: P.rank,
      faction: P.faction, permit: P.permit, kills: P.kills, deaths: P.deaths, bossKills: P.bossKills,
      day: GAME.day, time: GAME.time,
    };
  };
  GAME.deserialize = function (d) {
    Object.assign(P, {
      name: d.name, cls: d.cls, look: d.look, level: d.level, xp: d.xp,
      statPoints: d.statPoints, base: d.base, gold: d.gold,
      inv: d.inv, equip: d.equip, spells: d.spells, hotbar: d.hotbar,
      map: d.map, x: d.x, y: d.y, spawn: d.spawn,
      story: d.story, storyProg: d.storyProg, jobs: d.jobs || [], guildPts: d.guildPts || 0, rank: d.rank || 0,
      faction: d.faction, permit: d.permit, kills: d.kills || {}, deaths: d.deaths || 0, bossKills: d.bossKills || {},
      buffs: [], effects: {},
    });
    GAME.day = d.day || 1; GAME.time = d.time || 480;
    // escort jobs can't survive a reload
    P.jobs = P.jobs.filter(j => D().JOBS[j.idx] && (D().JOBS[j.idx].type !== 'escort' || j.done));
    recalc();
    P.hp = Math.min(d.hp || P.maxHp, P.maxHp);
    P.mp = Math.min(d.mp || P.maxMp, P.maxMp);
  };
  GAME.save = function () {
    try { localStorage.setItem('eldoria_save', JSON.stringify(GAME.serialize())); } catch (e) { }
    if (window.NET) NET.save();
  };
  GAME.loadLocal = function () {
    try {
      const s = localStorage.getItem('eldoria_save');
      if (s) return JSON.parse(s);
    } catch (e) { }
    return null;
  };
  // ============================================================
  // boot
  // ============================================================
  GAME.init = function (cv) {
    canvas = cv;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (UI.chatFocused()) return;
      keys[k] = true;
      if (k === ' ') { e.preventDefault(); if (running) tryAttack(); }
      if (k === 'e') { if (running) interact(); }
      if (running && k >= '1' && k <= '8') useHotbar(+k - 1);
      if (k === 'i') UI.toggle('win-inventory');
      if (k === 'c') UI.toggle('win-character');
      if (k === 'k') UI.toggle('win-skills');
      if (k === 'q' || k === 'j') UI.toggle('win-quests');
      if (k === 'm') UI.toggle('win-map');
      if (k === 'o') UI.toggle('win-social');
      if (k === 'escape') UI.closeAll();
      if (k === 'enter') UI.focusChat();
    });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { keys = {}; });
    requestAnimationFrame(loop);
  };
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    SCALE = Math.max(2, Math.min(4, Math.round(window.innerWidth / 420)));
  }
  function useHotbar(i) {
    const h = P.hotbar[i];
    if (!h) return;
    if (h.t === 'spell') GAME.castSpell(h.id);
    else if (h.t === 'item') {
      const slot = findInv(h.id);
      if (slot >= 0) GAME.useItem(slot);
      else UI.toast('None left!', '#ff9a8a');
    }
    UI.refreshHotbar();
  }
  GAME.useHotbar = useHotbar;
  GAME.start = function (isNew) {
    heroSheet = PXA.makeHero(P.look);
    UI.setPortrait(heroSheet.portrait);
    if (isNew || !W().maps[P.map]) {
      const ow = W().maps.overworld;
      P.map = 'overworld';
      P.x = ow.spawnPoint.x; P.y = ow.spawnPoint.y;
      P.spawn = { map: 'overworld', x: P.x, y: P.y };
    }
    GAME.enterMap(P.map, P.x, P.y);
    running = true;
    UI.showHud();
    UI.refreshAll();
    if (isNew) {
      UI.announce('ASHES OF ELDORIA', 'Chapter 1: Awakening — speak with Elder Rowan');
      UI.toast('Welcome, ' + P.name + '! WASD to move, SPACE to attack, E to interact.', '#8fd4ff');
    }
  };
  GAME.refreshHeroSheet = function () { heroSheet = PXA.makeHero(P.look); };
  GAME.isRunning = () => running;
  GAME.escort = () => escort;
  let lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (running && map) {
      update(dt);
      draw();
      UI.tick(dt);
    }
  }
})();