/* ============================================================
   ASHES OF ELDORIA — data.js
   All game content: items, spells, monsters, dungeons, quests,
   story chapters, recipes, shops, guild ranks, dialogue.
   ============================================================ */
(function () {
  'use strict';
  const DATA = (window.DATA = {});

  // ---------------- rarity ----------------
  DATA.RARITY = {
    common:    { name: 'Common',    color: '#b8b8b0', mult: 1.0, w: 100 },
    uncommon:  { name: 'Uncommon',  color: '#57c14f', mult: 1.15, w: 45 },
    rare:      { name: 'Rare',      color: '#4f8fe0', mult: 1.35, w: 18 },
    epic:      { name: 'Epic',      color: '#b45fe0', mult: 1.6, w: 6 },
    legendary: { name: 'Legendary', color: '#f0a132', mult: 2.0, w: 2 },
    mythical:  { name: 'Mythical',  color: '#ff4f6d', mult: 2.6, w: 0.5 },
  };
  DATA.RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'SSSS'];
  DATA.RANK_POINTS = [0, 30, 80, 160, 280, 450, 700, 1050, 1500, 2100]; // guild pts to reach rank i

  // ---------------- items ----------------
  // type: weapon|shield|helmet|armor|boots|ring|amulet|consumable|material|special
  const I = DATA.ITEMS = {};
  function item(id, def) { def.id = id; I[id] = def; return def; }

  // --- swords ---
  item('wooden_sword', { name: 'Wooden Sword', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#a8804a', d: '#7a5a2c' }, atk: 4, rarity: 'common', price: 25, desc: 'A practice sword carved from oak.' });
  item('iron_sword', { name: 'Iron Sword', type: 'weapon', kind: 'sword', icon: 'sword', atk: 9, rarity: 'common', price: 120, desc: 'Standard issue for town guards.' });
  item('steel_sword', { name: 'Steel Sword', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#e8f0f8' }, atk: 16, rarity: 'uncommon', price: 420, desc: 'Well-balanced Aldenhaven steel.' });
  item('knight_sword', { name: 'Knight\'s Blade', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { g: '#c8dcff', b: '#dce4ec' }, atk: 25, rarity: 'rare', price: 1400, desc: 'Carried by the royal knights.' });
  item('flame_sword', { name: 'Flamebrand', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#f08040', d: '#c04a1a' }, atk: 34, fx: 'burn', rarity: 'epic', price: 4200, desc: 'The blade smolders with living fire.' });
  item('frost_sword', { name: 'Winter\'s Edge', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#8cd4f0', d: '#4a9cc8' }, atk: 34, fx: 'slow', rarity: 'epic', price: 4200, desc: 'Cold bites deeper than steel.' });
  item('demon_blade', { name: 'Demonfang', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#b45fe0', d: '#7c3aa0', g: '#e05050' }, atk: 46, rarity: 'legendary', price: 12000, desc: 'Forged in the Demon Rift. It whispers.' });
  item('hero_sword', { name: 'Blade of Dawn', type: 'weapon', kind: 'sword', icon: 'sword', iconPal: { b: '#ffdf8e', d: '#f0a132' }, atk: 62, fx: 'holy', rarity: 'mythical', price: 40000, desc: 'The legendary sword that ended the last Demon War.' });
  // --- staves ---
  item('apprentice_staff', { name: 'Apprentice Staff', type: 'weapon', kind: 'staff', icon: 'staff', atk: 3, matk: 6, rarity: 'common', price: 30, desc: 'Every archmage started somewhere.' });
  item('oak_staff', { name: 'Oak Staff', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#57c14f', l: '#a8e89a' }, atk: 4, matk: 12, rarity: 'common', price: 140, desc: 'Hums faintly with forest mana.' });
  item('crystal_staff', { name: 'Crystal Staff', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#b45fe0', l: '#e0b8f8' }, atk: 5, matk: 21, rarity: 'uncommon', price: 520, desc: 'Focuses mana through a flawless shard.' });
  item('arch_staff', { name: 'Archmage Staff', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#f2d34b', l: '#fff8c0' }, atk: 6, matk: 32, rarity: 'rare', price: 1800, desc: 'Once held by Archmage Serelin.' });
  item('storm_staff', { name: 'Stormcaller', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#8cd4f0', l: '#e0f8ff' }, atk: 8, matk: 42, fx: 'shock', rarity: 'epic', price: 5200, desc: 'Thunder answers when it strikes.' });
  item('demon_staff', { name: 'Voidcaller', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#e05050', l: '#ffb0a0', w: '#2c1a30' }, atk: 10, matk: 56, rarity: 'legendary', price: 14000, desc: 'It drinks the light around it.' });
  item('dawn_staff', { name: 'Staff of Eternity', type: 'weapon', kind: 'staff', icon: 'staff', iconPal: { c: '#ffdf8e', l: '#ffffff' }, atk: 12, matk: 74, fx: 'holy', rarity: 'mythical', price: 42000, desc: 'Its light has never dimmed in a thousand years.' });
  // --- maces / tank weapons ---
  item('club', { name: 'Old Club', type: 'weapon', kind: 'mace', icon: 'mace', iconPal: { m: '#8a5a2c', l: '#a8804a' }, atk: 5, rarity: 'common', price: 20, desc: 'Simple, heavy, effective.' });
  item('iron_mace', { name: 'Iron Mace', type: 'weapon', kind: 'mace', icon: 'mace', atk: 11, def: 2, rarity: 'common', price: 150, desc: 'Dents helmets and pride alike.' });
  item('war_hammer', { name: 'War Hammer', type: 'weapon', kind: 'mace', icon: 'mace', iconPal: { m: '#98a4b0' }, atk: 20, def: 4, rarity: 'uncommon', price: 560, desc: 'Favored by the shield-wall breakers.' });
  item('holy_mace', { name: 'Holy Mace', type: 'weapon', kind: 'mace', icon: 'mace', iconPal: { m: '#f2c14b', l: '#ffdf8e' }, atk: 30, def: 6, fx: 'holy', rarity: 'rare', price: 2000, desc: 'Blessed by the High Temple.' });
  item('titan_maul', { name: 'Titan\'s Maul', type: 'weapon', kind: 'mace', icon: 'mace', iconPal: { m: '#b45fe0', l: '#e0b8f8' }, atk: 44, def: 10, rarity: 'legendary', price: 13000, desc: 'Shakes the earth with every swing.' });
  // --- bows ---
  item('short_bow', { name: 'Short Bow', type: 'weapon', kind: 'bow', icon: 'bow', atk: 7, rarity: 'common', price: 90, desc: 'Light and quick to draw.' });
  item('hunter_bow', { name: 'Hunter\'s Bow', type: 'weapon', kind: 'bow', icon: 'bow', iconPal: { w: '#5c7a3a' }, atk: 14, rarity: 'uncommon', price: 480, desc: 'Strung with dire wolf sinew.' });
  item('elven_bow', { name: 'Elven Longbow', type: 'weapon', kind: 'bow', icon: 'bow', iconPal: { w: '#f2c14b', l: '#ffdf8e' }, atk: 27, rarity: 'rare', price: 1900, desc: 'Sings as the arrow flies.' });
  // --- shields ---
  item('wooden_shield', { name: 'Wooden Shield', type: 'shield', icon: 'shield', iconPal: { m: '#a8804a', b: '#8a5a2c' }, def: 3, rarity: 'common', price: 40, desc: 'Better than your forearm.' });
  item('iron_shield', { name: 'Iron Shield', type: 'shield', icon: 'shield', def: 7, rarity: 'common', price: 180, desc: 'A dependable iron round-shield.' });
  item('tower_shield', { name: 'Tower Shield', type: 'shield', icon: 'shield', iconPal: { b: '#7c8088' }, def: 14, hp: 20, rarity: 'uncommon', price: 700, desc: 'A wall you can carry.' });
  item('knight_shield', { name: 'Knight\'s Aegis', type: 'shield', icon: 'shield', iconPal: { b: '#c8402e' }, def: 22, hp: 40, rarity: 'rare', price: 2400, desc: 'Bears the lion of Valoria.' });
  item('dragon_shield', { name: 'Dragonscale Wall', type: 'shield', icon: 'shield', iconPal: { b: '#c03030', g: '#e05050' }, def: 34, hp: 90, rarity: 'legendary', price: 15000, desc: 'Cut from the hide of an ancient wyrm.' });
  // --- helmets ---
  item('leather_cap', { name: 'Leather Cap', type: 'helmet', icon: 'helmet', iconPal: { m: '#8a5a2c', l: '#a8804a', d: '#5c3a18' }, def: 2, rarity: 'common', price: 35, desc: 'Smells faintly of cow.' });
  item('iron_helm', { name: 'Iron Helm', type: 'helmet', icon: 'helmet', def: 5, rarity: 'common', price: 160, desc: 'Keeps your thoughts inside your head.' });
  item('knight_helm', { name: 'Knight Helm', type: 'helmet', icon: 'helmet', iconPal: { r: '#3b6fd0' }, def: 10, hp: 15, rarity: 'uncommon', price: 620, desc: 'Polished to a mirror sheen.' });
  item('mage_hood', { name: 'Mage Hood', type: 'helmet', icon: 'helmet', iconPal: { m: '#8a4fc8', l: '#a26ad8', r: '#f2c14b', d: '#57297c' }, def: 4, mp: 30, matk: 5, rarity: 'uncommon', price: 620, desc: 'Woven with mana-thread.' });
  item('dragon_helm', { name: 'Dragonbone Helm', type: 'helmet', icon: 'helmet', iconPal: { m: '#e8e0c8', l: '#fff', r: '#c03030', d: '#b0a684' }, def: 18, hp: 50, rarity: 'legendary', price: 9500, desc: 'Horned like the beast it came from.' });
  // --- armor ---
  item('cloth_tunic', { name: 'Cloth Tunic', type: 'armor', icon: 'armor', iconPal: { m: '#d8b078', l: '#e8cc98', d: '#a8804a' }, def: 2, rarity: 'common', price: 30, desc: 'Homespun and cozy.' });
  item('leather_armor', { name: 'Leather Armor', type: 'armor', icon: 'armor', iconPal: { m: '#8a5a2c', l: '#a8804a', d: '#5c3a18' }, def: 6, rarity: 'common', price: 170, desc: 'Hardened traveler\'s leathers.' });
  item('chain_mail', { name: 'Chain Mail', type: 'armor', icon: 'armor', def: 12, hp: 20, rarity: 'uncommon', price: 640, desc: 'A thousand tiny rings of iron.' });
  item('mage_robe', { name: 'Mage Robe', type: 'armor', icon: 'armor', iconPal: { m: '#8a4fc8', l: '#a26ad8', d: '#57297c' }, def: 6, mp: 60, matk: 8, rarity: 'uncommon', price: 640, desc: 'Enchanted silk of the Mage Tower.' });
  item('knight_armor', { name: 'Knight Plate', type: 'armor', icon: 'armor', iconPal: { g: '#3b6fd0' }, def: 20, hp: 50, rarity: 'rare', price: 2600, desc: 'Full plate of the royal order.' });
  item('demon_plate', { name: 'Demonbone Plate', type: 'armor', icon: 'armor', iconPal: { m: '#4a2c48', l: '#7a4a8c', d: '#2c1a30', g: '#e05050' }, def: 30, hp: 90, rarity: 'legendary', price: 14000, desc: 'Still warm. Always warm.' });
  item('dawn_armor', { name: 'Aegis of Dawn', type: 'armor', icon: 'armor', iconPal: { m: '#ffdf8e', l: '#fff8d8', d: '#f0a132' }, def: 40, hp: 150, mp: 60, rarity: 'mythical', price: 45000, desc: 'Armor of the first Hero. Light made solid.' });
  // --- boots ---
  item('sandals', { name: 'Sandals', type: 'boots', icon: 'boots', iconPal: { b: '#d8b078', d: '#a8804a', l: '#e8cc98' }, def: 1, rarity: 'common', price: 15, desc: 'Barely footwear.' });
  item('leather_boots', { name: 'Leather Boots', type: 'boots', icon: 'boots', def: 3, rarity: 'common', price: 90, desc: 'Made for long roads.' });
  item('iron_greaves', { name: 'Iron Greaves', type: 'boots', icon: 'boots', iconPal: { b: '#b8bcc4', d: '#7c8088', l: '#dce4ec' }, def: 8, rarity: 'uncommon', price: 480, desc: 'Heavy but reassuring.' });
  item('swift_boots', { name: 'Swiftwind Boots', type: 'boots', icon: 'boots', iconPal: { b: '#57c14f', d: '#2e8c2a', l: '#a8e89a' }, def: 5, agi: 8, rarity: 'rare', price: 2100, desc: 'The wind owes their maker a favor.' });
  item('dragon_greaves', { name: 'Dragonscale Greaves', type: 'boots', icon: 'boots', iconPal: { b: '#c03030', d: '#801c1c', l: '#e05050' }, def: 14, agi: 6, hp: 40, rarity: 'legendary', price: 9800, desc: 'Walk through fire.' });
  // --- rings / amulets ---
  item('copper_ring', { name: 'Copper Ring', type: 'ring', icon: 'ring', iconPal: { g: '#c88050', d: '#96562e', j: '#57c14f' }, hp: 10, rarity: 'common', price: 80, desc: 'Turns your finger slightly green.' });
  item('silver_ring', { name: 'Silver Ring', type: 'ring', icon: 'ring', iconPal: { g: '#dce4ec', d: '#98a4b0', j: '#4f8fe0' }, mp: 20, matk: 3, rarity: 'uncommon', price: 350, desc: 'Cool to the touch.' });
  item('ruby_ring', { name: 'Ruby Ring', type: 'ring', icon: 'ring', atk: 5, hp: 20, rarity: 'rare', price: 1500, desc: 'The stone glows when blood is near.' });
  item('arch_ring', { name: 'Archmage\'s Seal', type: 'ring', icon: 'ring', iconPal: { j: '#b45fe0' }, matk: 12, mp: 60, rarity: 'epic', price: 5600, desc: 'Grants command over deeper mana.' });
  item('kings_ring', { name: 'King\'s Signet', type: 'ring', icon: 'ring', iconPal: { j: '#f2d34b' }, atk: 8, matk: 8, hp: 40, mp: 40, rarity: 'legendary', price: 16000, desc: 'The royal seal of Valoria.' });
  item('bone_charm', { name: 'Bone Charm', type: 'amulet', icon: 'amulet', iconPal: { c: '#e8e0c8', l: '#fff' }, hp: 15, rarity: 'common', price: 100, desc: 'A goblin shaman\'s trinket.' });
  item('holy_symbol', { name: 'Holy Symbol', type: 'amulet', icon: 'amulet', iconPal: { c: '#f2c14b', l: '#ffdf8e' }, hp: 30, mp: 30, rarity: 'rare', price: 1600, desc: 'Wards off the restless dead.' });
  item('dragon_amulet', { name: 'Dragonheart Amulet', type: 'amulet', icon: 'amulet', iconPal: { c: '#e05050', l: '#ffb0a0' }, atk: 10, hp: 80, rarity: 'legendary', price: 15000, desc: 'It beats. Slowly.' });
  item('void_amulet', { name: 'Eye of the Void', type: 'amulet', icon: 'amulet', iconPal: { c: '#b45fe0', l: '#e0b8f8' }, matk: 16, mp: 100, rarity: 'mythical', price: 38000, desc: 'Do not stare back.' });
  // --- consumables ---
  item('potion_s', { name: 'Small HP Potion', type: 'consumable', icon: 'potion', use: { heal: 40 }, rarity: 'common', price: 25, stack: 99, desc: 'Restores 40 HP.' });
  item('potion_m', { name: 'HP Potion', type: 'consumable', icon: 'potion', iconPal: { f: '#f06060', d: '#a02020' }, use: { heal: 120 }, rarity: 'uncommon', price: 80, stack: 99, desc: 'Restores 120 HP.' });
  item('potion_l', { name: 'Great HP Potion', type: 'consumable', icon: 'potion', iconPal: { f: '#ff8080', d: '#c03030' }, use: { heal: 320 }, rarity: 'rare', price: 240, stack: 99, desc: 'Restores 320 HP.' });
  item('mana_s', { name: 'Small MP Potion', type: 'consumable', icon: 'potion', iconPal: { f: '#4878e0', d: '#1c3a8a' }, use: { mana: 30 }, rarity: 'common', price: 30, stack: 99, desc: 'Restores 30 MP.' });
  item('mana_m', { name: 'MP Potion', type: 'consumable', icon: 'potion', iconPal: { f: '#6a98f0', d: '#2c50a8' }, use: { mana: 90 }, rarity: 'uncommon', price: 95, stack: 99, desc: 'Restores 90 MP.' });
  item('elixir', { name: 'Golden Elixir', type: 'consumable', icon: 'potion', iconPal: { f: '#f2c14b', d: '#b0812a' }, use: { heal: 9999, mana: 9999 }, rarity: 'epic', price: 900, stack: 20, desc: 'Fully restores HP and MP.' });
  item('bread', { name: 'Fresh Bread', type: 'consumable', icon: 'meat', iconPal: { m: '#d8a860', d: '#a87838', l: '#f0cc90', b: '#f0cc90' }, use: { heal: 20 }, rarity: 'common', price: 8, stack: 99, desc: 'Restores 20 HP. Still warm.' });
  item('cooked_meat', { name: 'Cooked Meat', type: 'consumable', icon: 'meat', use: { heal: 70 }, rarity: 'common', price: 40, stack: 99, desc: 'Restores 70 HP. Juicy.' });
  item('antidote', { name: 'Antidote', type: 'consumable', icon: 'potion', iconPal: { f: '#7ab02a', d: '#4c7c14' }, use: { cure: 'poison', heal: 10 }, rarity: 'common', price: 45, stack: 99, desc: 'Cures poison.' });
  // --- materials ---
  item('herb', { name: 'Wild Herb', type: 'material', icon: 'herb', rarity: 'common', price: 6, stack: 99, desc: 'A fragrant healing herb.' });
  item('redherb', { name: 'Ember Herb', type: 'material', icon: 'herb', iconPal: { g: '#c85a3a', l: '#f08040', d: '#8a3a24' }, rarity: 'uncommon', price: 22, stack: 99, desc: 'Grows only near heat.' });
  item('magic_stone', { name: 'Magic Stone', type: 'material', icon: 'magicstone', rarity: 'uncommon', price: 45, stack: 99, desc: 'A pebble of crystallized mana.' });
  item('iron_ore', { name: 'Iron Ore', type: 'material', icon: 'ore', rarity: 'common', price: 15, stack: 99, desc: 'Raw ore, ready for the forge.' });
  item('wood', { name: 'Timber', type: 'material', icon: 'wood', rarity: 'common', price: 5, stack: 99, desc: 'Sturdy cut lumber.' });
  item('slime_gel', { name: 'Slime Gel', type: 'material', icon: 'gel', rarity: 'common', price: 8, stack: 99, desc: 'Wobbly and surprisingly useful.' });
  item('bone_frag', { name: 'Bone Fragment', type: 'material', icon: 'bone', rarity: 'common', price: 10, stack: 99, desc: 'Clatters in your pack.' });
  item('wolf_pelt', { name: 'Wolf Pelt', type: 'material', icon: 'pelt', rarity: 'common', price: 18, stack: 99, desc: 'Thick grey fur.' });
  item('spider_silk', { name: 'Spider Silk', type: 'material', icon: 'silk', rarity: 'uncommon', price: 26, stack: 99, desc: 'Stronger than steel wire.' });
  item('raw_meat', { name: 'Raw Meat', type: 'material', icon: 'meat', iconPal: { m: '#e05050', l: '#f08080' }, rarity: 'common', price: 12, stack: 99, desc: 'Needs cooking.' });
  item('feather', { name: 'Harpy Feather', type: 'material', icon: 'feather', rarity: 'uncommon', price: 30, stack: 99, desc: 'Lighter than air, almost.' });
  item('crystal_shard', { name: 'Crystal Shard', type: 'material', icon: 'crystal', rarity: 'rare', price: 120, stack: 99, desc: 'A splinter of pure focus.' });
  item('demon_horn', { name: 'Demon Horn', type: 'material', icon: 'horn', rarity: 'rare', price: 150, stack: 99, desc: 'Proof of a slain demon.' });
  item('dragon_scale', { name: 'Dragon Scale', type: 'material', icon: 'scale', rarity: 'epic', price: 600, stack: 99, desc: 'Harder than any forged plate.' });
  item('demon_heart', { name: 'Demon Lord\'s Heart', type: 'material', icon: 'demonheart', rarity: 'mythical', price: 10000, stack: 9, desc: 'The core of a demon lord. It still pulses.' });
  // --- special ---
  item('torch_item', { name: 'Torch', type: 'special', icon: 'torch', light: 4, rarity: 'common', price: 20, stack: 20, desc: 'Sheds light in dark places. (auto-equips)' });
  item('magic_light', { name: 'Magic Light', type: 'special', icon: 'magiclight', light: 8, rarity: 'rare', price: 800, stack: 5, desc: 'A lantern of bound moonlight. Wide, unwavering glow.' });
  item('merchant_permit', { name: 'Merchant Permit', type: 'special', icon: 'permit', rarity: 'rare', price: 500, stack: 1, desc: 'Official license of the Merchant Guild. Unlocks the marketplace stalls and trade prices.' });
  item('escort_writ', { name: 'Escort Writ', type: 'special', icon: 'scroll', rarity: 'common', price: 0, stack: 1, desc: 'Contract for an escort job.' });
  // spell tomes (teach spells)
  item('tome_blizzard', { name: 'Tome: Blizzard', type: 'tome', icon: 'tome', iconPal: { c: '#2c50a8', d: '#1c3070' }, teach: 'blizzard', rarity: 'epic', price: 3500, stack: 1, desc: 'Teaches the Blizzard spell (Mage).' });
  item('tome_meteor', { name: 'Tome: Meteor', type: 'tome', icon: 'tome', teach: 'meteor', rarity: 'legendary', price: 9000, stack: 1, desc: 'Teaches the Meteor spell (Mage).' });
  item('tome_bladebeam', { name: 'Manual: Blade Beam', type: 'tome', icon: 'tome', iconPal: { c: '#4c5058', d: '#30343a' }, teach: 'blade_beam', rarity: 'epic', price: 3500, stack: 1, desc: 'Teaches Blade Beam (Swordsman).' });
  item('tome_earthslam', { name: 'Manual: Earth Slam', type: 'tome', icon: 'tome', iconPal: { c: '#8a5a2c', d: '#5c3a18' }, teach: 'earth_slam', rarity: 'epic', price: 3500, stack: 1, desc: 'Teaches Earth Slam (Tank).' });
  // --- runes (only drop from the Demon King and his generals) ---
  item('rune_master', { name: 'Master Rune', type: 'rune', icon: 'magiclight', iconPal: { c: '#ff4f6d', l: '#ffc8d8', w: '#ffffff', g: '#f2c14b' }, rarity: 'mythical', price: 100000, stack: 1, desc: 'The Demon King\'s rune. Holding it lets you forge your own spells from element and form runes. (Use it to open the Runeforge)' });
  item('rune_fire', { name: 'Rune of Fire', type: 'rune', icon: 'magicstone', iconPal: { p: '#d84a1a', d: '#8a2e12', l: '#f8a060', w: '#ffe0c0' }, rarity: 'mythical', price: 25000, stack: 9, runeElement: 'fire', desc: 'A primal rune of flame, torn from a Demon General.' });
  item('rune_frost', { name: 'Rune of Frost', type: 'rune', icon: 'magicstone', iconPal: { p: '#4a8ad0', d: '#2a4f96', l: '#90c0f0', w: '#e0f4ff' }, rarity: 'mythical', price: 25000, stack: 9, runeElement: 'frost', desc: 'A primal rune of endless winter.' });
  item('rune_storm', { name: 'Rune of Storms', type: 'rune', icon: 'magicstone', iconPal: { p: '#d8a83a', d: '#a07820', l: '#f8dc80', w: '#fff8d0' }, rarity: 'mythical', price: 25000, stack: 9, runeElement: 'storm', desc: 'A primal rune crackling with thunder.' });
  item('rune_void', { name: 'Rune of the Void', type: 'rune', icon: 'magicstone', iconPal: { p: '#57297c', d: '#341252', l: '#8a4fc8', w: '#e0c8ff' }, rarity: 'mythical', price: 25000, stack: 9, runeElement: 'void', desc: 'A primal rune of hungry darkness.' });
  item('rune_dawn', { name: 'Rune of Dawn', type: 'rune', icon: 'magicstone', iconPal: { p: '#f2c14b', d: '#b0812a', l: '#ffdf8e', w: '#fff8e0' }, rarity: 'mythical', price: 25000, stack: 9, runeElement: 'dawn', desc: 'A primal rune of sacred light.' });
  item('rune_arrow', { name: 'Rune of the Arrow', type: 'rune', icon: 'crystal', iconPal: { c: '#e05050', d: '#8a2020', l: '#ffb0a0' }, rarity: 'mythical', price: 25000, stack: 9, runeForm: 'arrow', desc: 'A form rune: shapes magic into a piercing bolt.' });
  item('rune_ring', { name: 'Rune of the Ring', type: 'rune', icon: 'crystal', iconPal: { c: '#57c14f', d: '#2e8c2a', l: '#c0f0b0' }, rarity: 'mythical', price: 25000, stack: 9, runeForm: 'ring', desc: 'A form rune: shapes magic into a burst around you.' });
  item('rune_tempest', { name: 'Rune of the Tempest', type: 'rune', icon: 'crystal', iconPal: { c: '#b45fe0', d: '#7c3aa0', l: '#e0b8f8' }, rarity: 'mythical', price: 25000, stack: 9, runeForm: 'tempest', desc: 'A form rune: shapes magic into a raging storm on the ground.' });

  // ---------------- spells & skills ----------------
  // cls: mage | swordsman | tank | ranger | all
  const S = DATA.SPELLS = {};
  function spell(id, def) { def.id = id; S[id] = def; return def; }
  // mage
  spell('magic_missile', { name: 'Magic Missile', cls: 'mage', lvl: 1, mp: 4, cd: 0.6, type: 'proj', dmg: 8, scale: 1.0, speed: 260, icon: 'dark', color: '#c88ae8', desc: 'A dart of raw mana.' });
  spell('fireball', { name: 'Fireball', cls: 'mage', lvl: 2, mp: 8, cd: 1.2, type: 'proj', dmg: 16, scale: 1.3, speed: 220, icon: 'fire', color: '#f08040', fx: 'burn', aoe: 24, desc: 'Explodes on impact, burning enemies.' });
  spell('ice_shard', { name: 'Ice Shard', cls: 'mage', lvl: 4, mp: 9, cd: 1.4, type: 'proj', dmg: 14, scale: 1.2, speed: 280, icon: 'ice', color: '#8cd4f0', fx: 'slow', desc: 'Pierces and chills the target.' });
  spell('lightning', { name: 'Lightning Bolt', cls: 'mage', lvl: 7, mp: 14, cd: 2.0, type: 'strike', dmg: 30, scale: 1.5, range: 140, icon: 'bolt', color: '#f2d34b', desc: 'Strikes the nearest foe from above.' });
  spell('flame_wave', { name: 'Flame Wave', cls: 'mage', lvl: 10, mp: 18, cd: 3.0, type: 'fan', dmg: 20, scale: 1.2, speed: 190, count: 3, icon: 'firewave', color: '#f08040', fx: 'burn', desc: 'A fan of three fire bolts.' });
  spell('frost_nova', { name: 'Frost Nova', cls: 'mage', lvl: 13, mp: 22, cd: 5.0, type: 'nova', dmg: 24, scale: 1.1, radius: 70, icon: 'ice', color: '#8cd4f0', fx: 'slow', desc: 'Freezes everything around you.' });
  spell('chain_lightning', { name: 'Chain Lightning', cls: 'mage', lvl: 16, mp: 26, cd: 4.0, type: 'chain', dmg: 26, scale: 1.4, range: 150, jumps: 4, icon: 'chain', color: '#f2d34b', desc: 'Arcs between up to 4 enemies.' });
  spell('shadow_bolt', { name: 'Shadow Bolt', cls: 'mage', lvl: 19, mp: 20, cd: 1.6, type: 'proj', dmg: 34, scale: 1.6, speed: 240, icon: 'dark', color: '#8a4fc8', desc: 'A bolt of hungry darkness.' });
  spell('life_drain', { name: 'Life Drain', cls: 'mage', lvl: 22, mp: 24, cd: 4.5, type: 'strike', dmg: 30, scale: 1.3, range: 120, drain: 0.6, icon: 'drain', color: '#a02040', desc: 'Steals life from the target.' });
  spell('poison_cloud', { name: 'Poison Cloud', cls: 'mage', lvl: 25, mp: 28, cd: 6.0, type: 'ground', dmg: 10, scale: 0.8, radius: 55, dur: 4, icon: 'poison', color: '#7ab02a', fx: 'poison', desc: 'A lingering toxic cloud at the target.' });
  spell('blizzard', { name: 'Blizzard', cls: 'mage', lvl: 28, mp: 38, cd: 8.0, type: 'ground', dmg: 18, scale: 1.2, radius: 70, dur: 3.5, tome: true, icon: 'blizzard', color: '#8cd4f0', fx: 'slow', desc: 'A storm of ice at the target. (Tome)' });
  spell('thunderstorm', { name: 'Thunderstorm', cls: 'mage', lvl: 31, mp: 42, cd: 9.0, type: 'multistrike', dmg: 36, scale: 1.5, range: 160, count: 5, icon: 'bolt', color: '#f2d34b', desc: 'Five bolts rain on nearby foes.' });
  spell('meteor', { name: 'Meteor', cls: 'mage', lvl: 34, mp: 60, cd: 14.0, type: 'ground', dmg: 90, scale: 1.8, radius: 80, dur: 0.5, tome: true, icon: 'meteor', color: '#f08040', fx: 'burn', desc: 'Calls a burning star down. (Tome)' });
  // healing / support (mage + all)
  spell('heal', { name: 'Heal', cls: 'all', lvl: 3, mp: 10, cd: 2.5, type: 'heal', heal: 30, scale: 1.2, icon: 'heal', color: '#57c14f', desc: 'Mends your wounds.' });
  spell('greater_heal', { name: 'Greater Heal', cls: 'all', lvl: 15, mp: 26, cd: 5.0, type: 'heal', heal: 90, scale: 1.6, icon: 'heal', color: '#57c14f', desc: 'A powerful surge of healing light.' });
  spell('regen', { name: 'Regeneration', cls: 'all', lvl: 9, mp: 18, cd: 12.0, type: 'buff', buff: { regen: 4, dur: 12 }, icon: 'regen', color: '#a8e89a', desc: 'Recover HP over 12 seconds.' });
  spell('mana_shield', { name: 'Arcane Shield', cls: 'mage', lvl: 6, mp: 15, cd: 10.0, type: 'buff', buff: { shield: 40, dur: 10 }, icon: 'shieldspell', color: '#4f8fe0', desc: 'Absorbs damage for 10 seconds.' });
  spell('haste', { name: 'Haste', cls: 'all', lvl: 12, mp: 16, cd: 14.0, type: 'buff', buff: { haste: 0.4, dur: 8 }, icon: 'haste', color: '#6ad4e8', desc: 'Move 40% faster for 8 seconds.' });
  spell('holy_light', { name: 'Holy Light', cls: 'all', lvl: 20, mp: 30, cd: 8.0, type: 'novaheal', dmg: 40, heal: 50, radius: 70, scale: 1.2, icon: 'holy', color: '#ffdf8e', desc: 'Heals you, burns the unholy around you.' });
  // swordsman
  spell('power_strike', { name: 'Power Strike', cls: 'swordsman', lvl: 2, mp: 6, cd: 3.0, type: 'melee', dmg: 18, scale: 1.6, arc: 1.2, icon: 'slash', color: '#dce4ec', desc: 'A devastating overhead blow.' });
  spell('whirlwind', { name: 'Whirlwind', cls: 'swordsman', lvl: 8, mp: 14, cd: 5.0, type: 'nova', dmg: 22, scale: 1.4, radius: 55, icon: 'whirl', color: '#dce4ec', desc: 'Spin and strike all around you.' });
  spell('charge', { name: 'Charge', cls: 'swordsman', lvl: 14, mp: 12, cd: 6.0, type: 'dash', dmg: 26, scale: 1.4, dist: 90, icon: 'charge', color: '#e8b34b', desc: 'Dash forward, damaging foes in your path.' });
  spell('war_cry', { name: 'War Cry', cls: 'swordsman', lvl: 18, mp: 16, cd: 15.0, type: 'buff', buff: { atkUp: 0.3, dur: 10 }, icon: 'taunt', color: '#e05050', desc: '+30% attack for 10 seconds.' });
  spell('blade_beam', { name: 'Blade Beam', cls: 'swordsman', lvl: 24, mp: 22, cd: 4.0, type: 'proj', dmg: 40, scale: 1.7, speed: 300, tome: true, icon: 'slash', color: '#8cd4f0', desc: 'Launch a crescent of sword energy. (Manual)' });
  spell('berserk', { name: 'Berserk', cls: 'swordsman', lvl: 30, mp: 30, cd: 20.0, type: 'buff', buff: { atkUp: 0.6, defDown: 0.3, haste: 0.25, dur: 12 }, icon: 'taunt', color: '#c8402e', desc: 'Massive attack and speed, lowered defense.' });
  // tank
  spell('shield_bash', { name: 'Shield Bash', cls: 'tank', lvl: 2, mp: 6, cd: 4.0, type: 'melee', dmg: 12, scale: 1.2, stun: 1.2, arc: 0.9, icon: 'shieldspell', color: '#b8bcc4', desc: 'Bash and stun your target.' });
  spell('taunt', { name: 'Taunt', cls: 'tank', lvl: 5, mp: 8, cd: 8.0, type: 'taunt', radius: 110, icon: 'taunt', color: '#e05050', desc: 'Force nearby monsters to attack you.' });
  spell('iron_wall', { name: 'Iron Wall', cls: 'tank', lvl: 10, mp: 14, cd: 14.0, type: 'buff', buff: { defUp: 0.5, dur: 10 }, icon: 'ironwall', color: '#b8bcc4', desc: '+50% defense for 10 seconds.' });
  spell('earth_slam', { name: 'Earth Slam', cls: 'tank', lvl: 20, mp: 24, cd: 7.0, type: 'nova', dmg: 34, scale: 1.5, radius: 65, stun: 0.8, tome: true, icon: 'whirl', color: '#a8804a', desc: 'Slam the ground, stunning foes. (Manual)' });
  spell('guardian', { name: 'Guardian Spirit', cls: 'tank', lvl: 26, mp: 30, cd: 20.0, type: 'buff', buff: { shield: 120, regen: 6, dur: 12 }, icon: 'holy', color: '#ffdf8e', desc: 'A protective spirit shields you.' });
  // ranger
  spell('double_shot', { name: 'Double Shot', cls: 'ranger', lvl: 2, mp: 6, cd: 2.5, type: 'fan', dmg: 12, scale: 1.3, count: 2, speed: 300, icon: 'slash', color: '#a8e89a', desc: 'Loose two arrows at once.' });
  spell('arrow_rain', { name: 'Arrow Rain', cls: 'ranger', lvl: 12, mp: 20, cd: 6.0, type: 'ground', dmg: 16, scale: 1.2, radius: 60, dur: 2, icon: 'blizzard', color: '#a8e89a', desc: 'Arrows fall on the target area.' });
  // expanded spellbook
  spell('arcane_orb', { name: 'Arcane Orb', cls: 'mage', lvl: 5, mp: 12, cd: 2.2, type: 'proj', dmg: 22, scale: 1.3, speed: 150, aoe: 30, icon: 'dark', color: '#c88ae8', desc: 'A slow orb that detonates on impact.' });
  spell('icicle_lance', { name: 'Icicle Lance', cls: 'mage', lvl: 17, mp: 18, cd: 2.4, type: 'proj', dmg: 30, scale: 1.5, speed: 340, icon: 'ice', color: '#8cd4f0', fx: 'slow', desc: 'A piercing lance of ice.' });
  spell('inferno', { name: 'Inferno', cls: 'mage', lvl: 23, mp: 30, cd: 7.0, type: 'nova', dmg: 34, scale: 1.4, radius: 75, icon: 'fire', color: '#f08040', fx: 'burn', desc: 'Erupt in flames, scorching all around you.' });
  spell('void_rift', { name: 'Void Rift', cls: 'mage', lvl: 37, mp: 48, cd: 10.0, type: 'ground', dmg: 26, scale: 1.5, radius: 65, dur: 4, icon: 'dark', color: '#8a4fc8', desc: 'Tear open a rift that devours foes.' });
  spell('cross_slash', { name: 'Cross Slash', cls: 'swordsman', lvl: 5, mp: 9, cd: 3.5, type: 'melee', dmg: 24, scale: 1.5, arc: 1.2, icon: 'slash', color: '#dce4ec', desc: 'Two crossing cuts in one motion.' });
  spell('sword_dance', { name: 'Sword Dance', cls: 'swordsman', lvl: 21, mp: 20, cd: 6.0, type: 'nova', dmg: 30, scale: 1.5, radius: 60, icon: 'whirl', color: '#dce4ec', desc: 'A deadly dance of steel around you.' });
  spell('guard_break', { name: 'Guard Break', cls: 'tank', lvl: 8, mp: 10, cd: 5.0, type: 'melee', dmg: 18, scale: 1.3, stun: 0.8, arc: 0.9, icon: 'ironwall', color: '#b8bcc4', desc: 'Crush defenses and stagger the foe.' });
  spell('fortress', { name: 'Fortress', cls: 'tank', lvl: 16, mp: 20, cd: 16.0, type: 'buff', buff: { shield: 80, defUp: 0.3, dur: 10 }, icon: 'ironwall', color: '#b8bcc4', desc: 'Become an unbreakable fortress.' });
  spell('piercing_shot', { name: 'Piercing Shot', cls: 'ranger', lvl: 6, mp: 8, cd: 2.5, type: 'proj', dmg: 18, scale: 1.5, speed: 360, icon: 'slash', color: '#a8e89a', desc: 'An arrow that punches through armor.' });
  spell('multishot', { name: 'Multishot', cls: 'ranger', lvl: 18, mp: 18, cd: 4.5, type: 'fan', dmg: 16, scale: 1.3, count: 5, speed: 300, icon: 'blizzard', color: '#a8e89a', desc: 'Five arrows in a wide fan.' });
  spell('blink', { name: 'Blink', cls: 'all', lvl: 14, mp: 14, cd: 5.0, type: 'dash', dmg: 0, dist: 110, icon: 'haste', color: '#6ad4e8', desc: 'Step through space in a flash.' });
  spell('smite', { name: 'Smite', cls: 'all', lvl: 25, mp: 24, cd: 4.0, type: 'strike', dmg: 36, scale: 1.4, range: 130, fx: 'holy', icon: 'holy', color: '#ffdf8e', desc: 'Call down holy judgement on a foe.' });

  // ---------------- classes ----------------
  DATA.CLASSES = {
    swordsman: { name: 'Swordsman', weapon: 'wooden_sword', desc: 'Balanced melee fighter. Strong, fast, reliable.', base: { str: 7, int: 3, vit: 6, agi: 5 }, up: { str: 2, vit: 1 }, weaponKinds: ['sword', 'mace', 'bow'] },
    mage: { name: 'Mage', weapon: 'apprentice_staff', desc: 'Master of the arcane. Fragile but devastating.', base: { str: 3, int: 9, vit: 4, agi: 4 }, up: { int: 2, vit: 1 }, weaponKinds: ['staff'] },
    tank: { name: 'Guardian', weapon: 'club', desc: 'Unbreakable wall. Protects allies, outlasts foes.', base: { str: 5, int: 2, vit: 10, agi: 3 }, up: { vit: 2, str: 1 }, weaponKinds: ['mace', 'sword'] },
    ranger: { name: 'Ranger', weapon: 'short_bow', desc: 'Swift hunter striking from afar.', base: { str: 5, int: 4, vit: 4, agi: 8 }, up: { agi: 2, str: 1 }, weaponKinds: ['bow', 'sword'] },
  };

  // ---------------- monsters ----------------
  // sprite: PXA mob art name; pal: palette override; scale
  const M = DATA.MOBS = {};
  function mobd(id, def) { def.id = id; M[id] = def; return def; }
  mobd('slime', { name: 'Slime', sprite: 'slime', lvl: 1, hp: 22, atk: 4, def: 0, xp: 6, gold: [1, 4], speed: 26, aggro: 70, atkCd: 1.4, drops: [{ i: 'slime_gel', c: .6 }, { i: 'herb', c: .15 }, { i: 'potion_s', c: .08 }] });
  mobd('redslime', { name: 'Red Slime', sprite: 'slime', pal: { g: '#d05a4a', d: '#8a2e20', l: '#f09080' }, lvl: 4, hp: 45, atk: 8, def: 1, xp: 14, gold: [3, 8], speed: 30, aggro: 80, atkCd: 1.3, fx: 'burn', drops: [{ i: 'slime_gel', c: .6 }, { i: 'redherb', c: .2 }] });
  mobd('blueslime', { name: 'Frost Slime', sprite: 'slime', pal: { g: '#4a8ad0', d: '#2a4f96', l: '#90c0f0' }, lvl: 7, hp: 70, atk: 12, def: 2, xp: 24, gold: [5, 12], speed: 28, aggro: 80, atkCd: 1.3, fx: 'slow', drops: [{ i: 'slime_gel', c: .6 }, { i: 'mana_s', c: .12 }] });
  mobd('rat', { name: 'Giant Rat', sprite: 'rat', lvl: 1, hp: 16, atk: 5, def: 0, xp: 5, gold: [1, 3], speed: 55, aggro: 90, atkCd: 1.1, drops: [{ i: 'raw_meat', c: .35 }] });
  mobd('bat', { name: 'Cave Bat', sprite: 'bat', lvl: 3, hp: 26, atk: 7, def: 0, xp: 10, gold: [2, 5], speed: 70, aggro: 110, atkCd: 1.2, flying: true, drops: [{ i: 'feather', c: .2 }] });
  mobd('icebat', { name: 'Frost Bat', sprite: 'bat', pal: { b: '#6a9cc8', d: '#3a6490', l: '#a8d0ec', f: '#d8ecfc' }, lvl: 19, hp: 200, atk: 34, def: 8, xp: 120, gold: [15, 30], speed: 80, aggro: 130, atkCd: 1.1, flying: true, fx: 'slow', drops: [{ i: 'crystal_shard', c: .18 }] });
  mobd('mushroom', { name: 'Myconid', sprite: 'mushroom', lvl: 2, hp: 30, atk: 6, def: 1, xp: 9, gold: [2, 5], speed: 18, aggro: 60, atkCd: 1.6, fx: 'poison', drops: [{ i: 'herb', c: .5 }, { i: 'antidote', c: .1 }] });
  mobd('goblin', { name: 'Goblin', sprite: 'goblin', lvl: 4, hp: 42, atk: 9, def: 1, xp: 15, gold: [4, 10], speed: 48, aggro: 100, atkCd: 1.2, drops: [{ i: 'wooden_sword', c: .05 }, { i: 'potion_s', c: .12 }, { i: 'iron_ore', c: .18 }] });
  mobd('goblin_archer', { name: 'Goblin Archer', sprite: 'goblin', pal: { c: '#5c7a3a', p: '#3c5424' }, lvl: 6, hp: 38, atk: 11, def: 1, xp: 20, gold: [5, 12], speed: 40, aggro: 150, atkCd: 1.8, ranged: 120, proj: '#a8e89a', drops: [{ i: 'short_bow', c: .06 }, { i: 'wood', c: .3 }] });
  mobd('wolf', { name: 'Wolf', sprite: 'wolf', lvl: 6, hp: 58, atk: 13, def: 2, xp: 22, gold: [4, 10], speed: 78, aggro: 130, atkCd: 1.0, drops: [{ i: 'wolf_pelt', c: .55 }, { i: 'raw_meat', c: .4 }] });
  mobd('direwolf', { name: 'Dire Wolf', sprite: 'wolf', pal: { f: '#4c4450', d: '#2c2630', l: '#6c6478', e: '#e05050' }, lvl: 14, hp: 150, atk: 26, def: 5, xp: 70, gold: [10, 22], speed: 88, aggro: 150, atkCd: 0.9, drops: [{ i: 'wolf_pelt', c: .7 }, { i: 'hunter_bow', c: .04 }] });
  mobd('bandit', { name: 'Bandit', sprite: 'bandit', lvl: 8, hp: 75, atk: 16, def: 3, xp: 32, gold: [10, 24], speed: 52, aggro: 120, atkCd: 1.1, drops: [{ i: 'dagger', c: 0 }, { i: 'potion_s', c: .2 }, { i: 'copper_ring', c: .06 }] });
  mobd('skeleton', { name: 'Skeleton', sprite: 'skeleton', lvl: 10, hp: 90, atk: 19, def: 4, xp: 42, gold: [8, 18], speed: 42, aggro: 110, atkCd: 1.3, undead: true, drops: [{ i: 'bone_frag', c: .65 }, { i: 'iron_sword', c: .05 }] });
  mobd('skeleton_mage', { name: 'Skeleton Mage', sprite: 'skeleton', pal: { b: '#c8d0e8', d: '#8a94b8', e: '#6ad4e8' }, lvl: 12, hp: 80, atk: 24, def: 3, xp: 55, gold: [10, 22], speed: 34, aggro: 160, atkCd: 2.0, ranged: 130, proj: '#6ad4e8', undead: true, drops: [{ i: 'magic_stone', c: .35 }, { i: 'mana_m', c: .12 }] });
  mobd('zombie', { name: 'Zombie', sprite: 'zombie', lvl: 9, hp: 120, atk: 15, def: 2, xp: 38, gold: [6, 14], speed: 22, aggro: 90, atkCd: 1.5, undead: true, fx: 'poison', drops: [{ i: 'bone_frag', c: .3 }, { i: 'antidote', c: .15 }] });
  mobd('spider', { name: 'Widow Spider', sprite: 'spider', lvl: 11, hp: 95, atk: 21, def: 3, xp: 48, gold: [8, 18], speed: 66, aggro: 130, atkCd: 1.1, fx: 'poison', drops: [{ i: 'spider_silk', c: .55 }, { i: 'antidote', c: .1 }] });
  mobd('orc', { name: 'Orc Warrior', sprite: 'orc', lvl: 14, hp: 170, atk: 28, def: 6, xp: 78, gold: [14, 30], speed: 44, aggro: 110, atkCd: 1.3, drops: [{ i: 'war_hammer', c: .04 }, { i: 'iron_ore', c: .35 }, { i: 'potion_m', c: .12 }] });
  mobd('harpy', { name: 'Harpy', sprite: 'harpy', lvl: 16, hp: 140, atk: 30, def: 4, xp: 88, gold: [14, 30], speed: 82, aggro: 150, atkCd: 1.0, flying: true, drops: [{ i: 'feather', c: .6 }, { i: 'swift_boots', c: .02 }] });
  mobd('golem', { name: 'Stone Golem', sprite: 'golem', lvl: 18, hp: 320, atk: 34, def: 14, xp: 130, gold: [20, 40], speed: 26, aggro: 90, atkCd: 1.7, drops: [{ i: 'iron_ore', c: .6 }, { i: 'crystal_shard', c: .2 }] });
  mobd('imp', { name: 'Fire Imp', sprite: 'imp', lvl: 17, hp: 150, atk: 32, def: 5, xp: 100, gold: [16, 34], speed: 62, aggro: 130, atkCd: 1.4, ranged: 110, proj: '#f08040', fx: 'burn', drops: [{ i: 'redherb', c: .3 }, { i: 'magic_stone', c: .25 }] });
  mobd('hound', { name: 'Lava Hound', sprite: 'hound', lvl: 20, hp: 220, atk: 40, def: 8, xp: 150, gold: [18, 38], speed: 80, aggro: 140, atkCd: 1.0, fx: 'burn', drops: [{ i: 'redherb', c: .3 }, { i: 'raw_meat', c: .3 }] });
  mobd('wraith', { name: 'Wraith', sprite: 'wraith', lvl: 21, hp: 200, atk: 42, def: 6, xp: 160, gold: [18, 40], speed: 58, aggro: 140, atkCd: 1.3, undead: true, floaty: true, drops: [{ i: 'magic_stone', c: .4 }, { i: 'silver_ring', c: .05 }] });
  mobd('yeti', { name: 'Yeti', sprite: 'yeti', lvl: 23, hp: 380, atk: 48, def: 12, xp: 210, gold: [24, 50], speed: 40, aggro: 110, atkCd: 1.5, fx: 'slow', drops: [{ i: 'wolf_pelt', c: .5 }, { i: 'crystal_shard', c: .25 }] });
  mobd('dark_knight', { name: 'Dark Knight', sprite: 'knight', lvl: 26, hp: 420, atk: 56, def: 16, xp: 280, gold: [30, 60], speed: 50, aggro: 130, atkCd: 1.2, drops: [{ i: 'knight_sword', c: .05 }, { i: 'knight_armor', c: .03 }, { i: 'potion_l', c: .15 }] });
  mobd('demon_soldier', { name: 'Demon Soldier', sprite: 'demonsoldier', lvl: 28, hp: 460, atk: 62, def: 15, xp: 320, gold: [32, 66], speed: 56, aggro: 140, atkCd: 1.1, demon: true, drops: [{ i: 'demon_horn', c: .45 }, { i: 'potion_l', c: .12 }] });
  mobd('demon_brute', { name: 'Demon Brute', sprite: 'brute', lvl: 32, hp: 750, atk: 76, def: 20, xp: 480, gold: [40, 90], speed: 38, aggro: 120, atkCd: 1.5, demon: true, drops: [{ i: 'demon_horn', c: .6 }, { i: 'demon_blade', c: .015 }] });
  mobd('drake', { name: 'Ember Drake', sprite: 'drake', lvl: 30, hp: 560, atk: 70, def: 16, xp: 420, gold: [36, 80], speed: 72, aggro: 150, atkCd: 1.2, ranged: 130, proj: '#f08040', fx: 'burn', drops: [{ i: 'dragon_scale', c: .25 }, { i: 'raw_meat', c: .4 }] });
  mobd('lich', { name: 'Lich', sprite: 'lich', lvl: 33, hp: 620, atk: 82, def: 14, xp: 560, gold: [50, 110], speed: 40, aggro: 170, atkCd: 1.8, ranged: 150, proj: '#8a4fc8', undead: true, floaty: true, drops: [{ i: 'magic_stone', c: .8 }, { i: 'tome_blizzard', c: .04 }, { i: 'arch_ring', c: .02 }] });
  // --- bosses ---
  mobd('king_slime', { name: 'King Slime', sprite: 'kingslime', boss: true, lvl: 5, hp: 380, atk: 14, def: 3, xp: 220, gold: [60, 120], speed: 30, aggro: 200, atkCd: 1.6, scale: 1.4, pattern: 'slam', drops: [{ i: 'slime_gel', c: 1, n: 4 }, { i: 'copper_ring', c: .5 }, { i: 'iron_sword', c: .35 }] });
  mobd('goblin_chief', { name: 'Goblin Chief Grukk', sprite: 'goblin', pal: { g: '#8a6a2a', c: '#8a2e20', p: '#5c1408', e: '#f2d34b' }, boss: true, lvl: 9, hp: 640, atk: 22, def: 5, xp: 480, gold: [120, 220], speed: 55, aggro: 220, atkCd: 1.1, scale: 1.7, pattern: 'summon', summons: 'goblin', drops: [{ i: 'steel_sword', c: .4 }, { i: 'chain_mail', c: .3 }, { i: 'bone_charm', c: .6 }] });
  mobd('bone_lord', { name: 'The Bone Lord', sprite: 'skeleton', pal: { b: '#d8c8e8', d: '#9a86b8', e: '#8a4fc8' }, boss: true, lvl: 15, hp: 1400, atk: 36, def: 10, xp: 1100, gold: [240, 420], speed: 44, aggro: 240, atkCd: 1.3, scale: 1.8, pattern: 'volley', proj: '#8a4fc8', undead: true, drops: [{ i: 'holy_symbol', c: .5 }, { i: 'knight_helm', c: .35 }, { i: 'tome_bladebeam', c: .2 }] });
  mobd('broodmother', { name: 'Broodmother Vylsith', sprite: 'spider', pal: { s: '#5c2c4c', d: '#3a1a30', l: '#8a4870', e: '#f2d34b' }, boss: true, lvl: 18, hp: 1900, atk: 44, def: 12, xp: 1600, gold: [300, 520], speed: 62, aggro: 240, atkCd: 1.0, scale: 2.0, pattern: 'summon', summons: 'spider', fx: 'poison', drops: [{ i: 'spider_silk', c: 1, n: 6 }, { i: 'swift_boots', c: .4 }, { i: 'elven_bow', c: .3 }] });
  mobd('flame_golem', { name: 'Molten Colossus', sprite: 'golem', pal: { r: '#a84a24', d: '#6e2c14', l: '#e8763a', e: '#f8c83a', m: '#8a3a1c' }, boss: true, lvl: 24, hp: 3200, atk: 58, def: 20, xp: 2600, gold: [420, 700], speed: 28, aggro: 240, atkCd: 1.6, scale: 2.0, pattern: 'slam', fx: 'burn', drops: [{ i: 'flame_sword', c: .35 }, { i: 'tome_earthslam', c: .25 }, { i: 'redherb', c: 1, n: 5 }] });
  mobd('frost_tyrant', { name: 'Frost Tyrant Ymrik', sprite: 'yeti', pal: { w: '#b8d8ec', d: '#7aa4c8', l: '#e8f4fc', e: '#e05050', m: '#3a6490' }, boss: true, lvl: 29, hp: 4800, atk: 72, def: 26, xp: 4200, gold: [600, 980], speed: 42, aggro: 260, atkCd: 1.4, scale: 2.1, pattern: 'nova', fx: 'slow', drops: [{ i: 'frost_sword', c: .35 }, { i: 'tome_blizzard', c: .3 }, { i: 'crystal_shard', c: 1, n: 4 }] });
  mobd('demon_general', { name: 'General Vorgath', sprite: 'knight', pal: { m: '#3a2440', d: '#241428', l: '#57297c', e: '#e05050', p: '#8a2e20', t: '#e05050' }, boss: true, lvl: 34, hp: 7200, atk: 92, def: 30, xp: 7000, gold: [900, 1500], speed: 54, aggro: 280, atkCd: 1.1, scale: 2.0, pattern: 'dash', demon: true, drops: [{ i: 'demon_blade', c: .3 }, { i: 'demon_plate', c: .3 }, { i: 'demon_horn', c: 1, n: 8 }] });
  mobd('ancient_dragon', { name: 'Vharaxes the Ancient', sprite: 'dragon', boss: true, lvl: 38, hp: 11000, atk: 110, def: 36, xp: 12000, gold: [1600, 2600], speed: 60, aggro: 300, atkCd: 1.2, scale: 2.2, pattern: 'breath', ranged: 160, proj: '#f08040', fx: 'burn', drops: [{ i: 'dragon_scale', c: 1, n: 6 }, { i: 'dragon_shield', c: .4 }, { i: 'dragon_helm', c: .35 }, { i: 'dragon_amulet', c: .3 }] });
  mobd('demon_lord', { name: 'Demon Lord Azgareth', sprite: 'demonlord', boss: true, lvl: 42, hp: 18000, atk: 130, def: 40, xp: 25000, gold: [3000, 5000], speed: 52, aggro: 320, atkCd: 1.0, scale: 2.0, pattern: 'phases', demon: true, drops: [{ i: 'demon_heart', c: 1 }, { i: 'hero_sword', c: .25 }, { i: 'dawn_staff', c: .25 }, { i: 'dawn_armor', c: .2 }, { i: 'void_amulet', c: .25 }] });
  // --- Demon King's Citadel forces ---
  mobd('demon_guard', { name: 'Demon Guard', sprite: 'knight', pal: { m: '#4a1a2c', d: '#2c0e1a', l: '#7c2c48', e: '#f2d34b', p: '#c8402e', t: '#e05050' }, lvl: 38, hp: 900, atk: 95, def: 28, xp: 700, gold: [60, 120], speed: 52, aggro: 150, atkCd: 1.1, demon: true, drops: [{ i: 'demon_horn', c: .5 }, { i: 'potion_l', c: .2 }] });
  mobd('greater_demon', { name: 'Greater Demon', sprite: 'brute', pal: { p: '#8a2038', d: '#5a1020', l: '#c04058', e: '#f8c83a', h: '#1a0a10', t: '#e8e0c8' }, lvl: 42, hp: 1400, atk: 115, def: 32, xp: 1100, gold: [90, 170], speed: 42, aggro: 140, atkCd: 1.4, demon: true, drops: [{ i: 'demon_horn', c: .7 }, { i: 'elixir', c: .1 }] });
  mobd('void_reaper', { name: 'Void Reaper', sprite: 'wraith', pal: { w: '#6a4a8c', d: '#42285c', l: '#9c74c8', e: '#ff5070', k: '#180c24' }, lvl: 45, hp: 1200, atk: 130, def: 26, xp: 1400, gold: [100, 200], speed: 66, aggro: 170, atkCd: 1.2, demon: true, undead: true, floaty: true, ranged: 140, proj: '#b45fe0', drops: [{ i: 'magic_stone', c: .9 }, { i: 'void_amulet', c: .01 }] });
  // the four Demon King Generals — the only source of element/form runes
  mobd('gen_ignaroth', { name: 'General Ignaroth the Cinder', sprite: 'golem', pal: { r: '#8a2012', d: '#4c0e06', l: '#e05030', e: '#f8c83a', m: '#601408' }, boss: true, lvl: 46, hp: 14000, atk: 140, def: 42, xp: 16000, gold: [1600, 2600], speed: 34, aggro: 280, atkCd: 1.3, scale: 2.1, pattern: 'slam', fx: 'burn', demon: true, drops: [{ i: 'rune_fire', c: .4 }, { i: 'rune_arrow', c: .3 }, { i: 'demon_horn', c: 1, n: 6 }] });
  mobd('gen_morgrim', { name: 'General Morgrim the Frozen', sprite: 'yeti', pal: { w: '#7a9ac8', d: '#4a648c', l: '#b8d4f4', e: '#ff5070', s: '#5c7ca8', m: '#2c4468' }, boss: true, lvl: 46, hp: 14000, atk: 135, def: 46, xp: 16000, gold: [1600, 2600], speed: 40, aggro: 280, atkCd: 1.4, scale: 2.1, pattern: 'nova', fx: 'slow', demon: true, drops: [{ i: 'rune_frost', c: .4 }, { i: 'rune_ring', c: .3 }, { i: 'demon_horn', c: 1, n: 6 }] });
  mobd('gen_voltrag', { name: 'General Voltrag the Storm', sprite: 'knight', pal: { m: '#7c6a1a', d: '#4c400c', l: '#d8b83a', e: '#fff8c0', p: '#d8a83a', t: '#fff8c0' }, boss: true, lvl: 47, hp: 13000, atk: 150, def: 38, xp: 17000, gold: [1700, 2800], speed: 60, aggro: 300, atkCd: 1.0, scale: 2.0, pattern: 'dash', demon: true, drops: [{ i: 'rune_storm', c: .4 }, { i: 'rune_arrow', c: .3 }, { i: 'demon_horn', c: 1, n: 6 }] });
  mobd('gen_nyxara', { name: 'General Nyxara the Hollow', sprite: 'lich', pal: { b: '#d8c8e8', d: '#9a86b8', r: '#2c1a40', rd: '#180c28', e: '#ff5070', g: '#b45fe0' }, boss: true, lvl: 47, hp: 12000, atk: 155, def: 34, xp: 17000, gold: [1700, 2800], speed: 44, aggro: 320, atkCd: 1.6, scale: 2.0, pattern: 'volley', proj: '#b45fe0', demon: true, undead: true, floaty: true, drops: [{ i: 'rune_void', c: .4 }, { i: 'rune_tempest', c: .3 }, { i: 'demon_horn', c: 1, n: 6 }] });
  // THE hardest boss in the game — guaranteed Master Rune
  mobd('demon_king', { name: 'Demon King Malzevoth', sprite: 'demonlord', pal: { k: '#1a0a14', d: '#0c040a', p: '#8a1030', l: '#e03050', e: '#ffdf5e', h: '#2c0818', f: '#ffc8d8', t: '#f2c14b' }, boss: true, lvl: 50, hp: 40000, atk: 175, def: 52, xp: 80000, gold: [8000, 14000], speed: 58, aggro: 340, atkCd: 0.9, scale: 2.4, pattern: 'phases', demon: true, drops: [{ i: 'rune_master', c: 1 }, { i: 'rune_dawn', c: .5 }, { i: 'demon_heart', c: 1 }, { i: 'hero_sword', c: .2 }, { i: 'dawn_armor', c: .2 }, { i: 'void_amulet', c: .2 }] });
  // --- roaming dragon world bosses ---
  mobd('emerald_wyrm', { name: 'Emerald Wyrm', sprite: 'dragon', pal: { s: '#3f8c3a', d: '#276022', l: '#66b053', w: '#2e7c46', e: '#f2d34b', b: '#d8e8a8', f: '#a8e88a' }, boss: true, lvl: 22, hp: 2600, atk: 52, def: 18, xp: 2400, gold: [350, 620], speed: 58, aggro: 280, atkCd: 1.2, scale: 1.8, pattern: 'breath', ranged: 150, proj: '#a8e89a', fx: 'poison', drops: [{ i: 'dragon_scale', c: .8, n: 2 }, { i: 'elven_bow', c: .25 }, { i: 'swift_boots', c: .2 }] });
  mobd('frost_wyrm', { name: 'Frost Wyrm Sylvarra', sprite: 'dragon', pal: { s: '#5a8ac8', d: '#38618c', l: '#8cb8e8', w: '#4a78b0', e: '#f0f8ff', b: '#d8ecfc', f: '#c8e4f4' }, boss: true, lvl: 32, hp: 7000, atk: 82, def: 28, xp: 6500, gold: [800, 1400], speed: 62, aggro: 300, atkCd: 1.1, scale: 2.0, pattern: 'breath', ranged: 160, proj: '#8cd4f0', fx: 'slow', drops: [{ i: 'dragon_scale', c: 1, n: 3 }, { i: 'frost_sword', c: .3 }, { i: 'tome_blizzard', c: .25 }] });
  mobd('void_dragon', { name: 'Void Dragon Karvenoth', sprite: 'dragon', pal: { s: '#3c2450', d: '#221230', l: '#6a4a8c', w: '#2c1a40', e: '#ff5070', b: '#c8a8e8', f: '#b45fe0' }, boss: true, lvl: 44, hp: 16000, atk: 125, def: 38, xp: 18000, gold: [2000, 3600], speed: 66, aggro: 320, atkCd: 1.0, scale: 2.2, pattern: 'breath', ranged: 170, proj: '#b45fe0', demon: true, drops: [{ i: 'dragon_scale', c: 1, n: 5 }, { i: 'demon_blade', c: .25 }, { i: 'kings_ring', c: .3 }, { i: 'void_amulet', c: .12 }] });

  // ---------------- dungeon loot tables (chests) ----------------
  DATA.CHEST_LOOT = {
    1: ['potion_s', 'mana_s', 'herb', 'iron_ore', 'wooden_shield', 'leather_cap', 'bread', 'torch_item'],
    2: ['potion_m', 'mana_m', 'iron_sword', 'leather_armor', 'magic_stone', 'copper_ring', 'wolf_pelt'],
    3: ['steel_sword', 'chain_mail', 'crystal_staff', 'war_hammer', 'silver_ring', 'iron_greaves', 'potion_l'],
    4: ['knight_sword', 'knight_armor', 'arch_staff', 'holy_mace', 'ruby_ring', 'holy_symbol', 'elixir', 'tome_bladebeam'],
    5: ['flame_sword', 'frost_sword', 'storm_staff', 'knight_shield', 'arch_ring', 'swift_boots', 'tome_blizzard', 'tome_earthslam'],
    6: ['demon_blade', 'demon_staff', 'demon_plate', 'titan_maul', 'dragon_greaves', 'kings_ring', 'tome_meteor', 'dragon_amulet'],
  };

  // ---------------- guild jobs ----------------
  // Generated job templates per rank. type: kill | gather | boss | escort | deliver | war
  DATA.JOBS = [
    // F
    { rank: 'F', type: 'gather', item: 'herb', n: 5, name: 'Herb Picking', desc: 'The apothecary needs 5 Wild Herbs from the fields.', gold: 30, xp: 20, pts: 4 },
    { rank: 'F', type: 'kill', mob: 'slime', n: 6, name: 'Slime Cull', desc: 'Slimes are eating the crops. Cull 6 of them.', gold: 40, xp: 30, pts: 5 },
    { rank: 'F', type: 'kill', mob: 'rat', n: 5, name: 'Rat Problem', desc: 'Giant rats infest the grain stores. Kill 5.', gold: 35, xp: 25, pts: 4 },
    { rank: 'F', type: 'gather', item: 'wood', n: 6, name: 'Lumber Run', desc: 'Chop 6 Timber for the carpenter (chop trees).', gold: 30, xp: 20, pts: 4 },
    { rank: 'F', type: 'deliver', to: 'oakstead', name: 'Package Delivery', desc: 'Deliver a parcel to the Oakstead village elder.', gold: 50, xp: 35, pts: 5 },
    // E
    { rank: 'E', type: 'kill', mob: 'goblin', n: 8, name: 'Goblin Patrol', desc: 'Goblins raid the roads. Drive off 8 of them.', gold: 90, xp: 80, pts: 8 },
    { rank: 'E', type: 'gather', item: 'slime_gel', n: 6, name: 'Gel Order', desc: 'The alchemist wants 6 Slime Gels.', gold: 80, xp: 60, pts: 7 },
    { rank: 'E', type: 'kill', mob: 'mushroom', n: 6, name: 'Fungal Bloom', desc: 'Myconids spread spores near the wells. Clear 6.', gold: 85, xp: 70, pts: 7 },
    { rank: 'E', type: 'escort', to: 'aldenhaven', name: 'Merchant Escort', desc: 'Escort a merchant safely to Aldenhaven. Bandits prowl the road.', gold: 150, xp: 120, pts: 10 },
    // D
    { rank: 'D', type: 'kill', mob: 'wolf', n: 8, name: 'Wolf Hunt', desc: 'A pack stalks the western farms. Thin it by 8.', gold: 160, xp: 160, pts: 12 },
    { rank: 'D', type: 'boss', mob: 'king_slime', name: 'The Slime King', desc: 'Something huge glistens in the Slime Caves. End it.', gold: 300, xp: 300, pts: 18 },
    { rank: 'D', type: 'gather', item: 'wolf_pelt', n: 6, name: 'Winter Furs', desc: 'The tailor needs 6 Wolf Pelts before the frost.', gold: 170, xp: 140, pts: 12 },
    { rank: 'D', type: 'kill', mob: 'bandit', n: 8, name: 'Road Cleanup', desc: 'Bandits took the crossroads. Take it back — 8 of them.', gold: 200, xp: 180, pts: 14 },
    // C
    { rank: 'C', type: 'boss', mob: 'goblin_chief', name: 'Chief Grukk', desc: 'The goblin warband answers to Grukk in the Warrens. Remove him.', gold: 500, xp: 550, pts: 24 },
    { rank: 'C', type: 'kill', mob: 'skeleton', n: 10, name: 'Restless Dead', desc: 'The crypt spills skeletons each night. Destroy 10.', gold: 380, xp: 420, pts: 20 },
    { rank: 'C', type: 'gather', item: 'spider_silk', n: 8, name: 'Silk Contract', desc: 'The weavers pay well for 8 Spider Silks.', gold: 360, xp: 340, pts: 20 },
    { rank: 'C', type: 'kill', mob: 'zombie', n: 12, name: 'Plague Walkers', desc: 'Zombies shamble from the marsh. Put 12 down.', gold: 420, xp: 460, pts: 22 },
    // B
    { rank: 'B', type: 'boss', mob: 'bone_lord', name: 'The Bone Lord', desc: 'A lord of bones holds the Sunken Crypt. Shatter him.', gold: 900, xp: 1200, pts: 34 },
    { rank: 'B', type: 'kill', mob: 'orc', n: 10, name: 'Orc Warband', desc: 'Orcs mass in the hills. Break their warband — 10 kills.', gold: 750, xp: 900, pts: 30 },
    { rank: 'B', type: 'kill', mob: 'harpy', n: 8, name: 'Sky Terrors', desc: 'Harpies snatch livestock. Shoot 8 from the sky.', gold: 780, xp: 950, pts: 30 },
    { rank: 'B', type: 'escort', to: 'frosthold', name: 'Noble\'s Escort', desc: 'Escort a noble envoy north to Frosthold.', gold: 1000, xp: 1100, pts: 36 },
    // A
    { rank: 'A', type: 'boss', mob: 'broodmother', name: 'Broodmother', desc: 'Vylsith nests in Spider Hollow. Burn the brood out.', gold: 1600, xp: 2400, pts: 46 },
    { rank: 'A', type: 'kill', mob: 'golem', n: 8, name: 'Stone Sentinels', desc: 'Ancient golems woke in the deep roads. Break 8.', gold: 1400, xp: 2000, pts: 42 },
    { rank: 'A', type: 'gather', item: 'demon_horn', n: 6, name: 'Horn Bounty', desc: 'The crown pays a bounty for 6 Demon Horns.', gold: 1500, xp: 1900, pts: 44 },
    // S
    { rank: 'S', type: 'boss', mob: 'flame_golem', name: 'Molten Colossus', desc: 'The Molten Depths glow brighter every night. Quench the source.', gold: 2800, xp: 4500, pts: 60 },
    { rank: 'S', type: 'kill', mob: 'wraith', n: 10, name: 'Wraith Purge', desc: 'Wraiths drift from the Frozen Abyss. Banish 10.', gold: 2400, xp: 4000, pts: 55 },
    { rank: 'S', type: 'kill', mob: 'yeti', n: 8, name: 'Mountain Terrors', desc: 'Yetis block the northern pass. Clear 8.', gold: 2600, xp: 4200, pts: 58 },
    // SS
    { rank: 'SS', type: 'boss', mob: 'frost_tyrant', name: 'Frost Tyrant', desc: 'Ymrik freezes the north from the Frozen Abyss. End his winter.', gold: 5000, xp: 9000, pts: 80 },
    { rank: 'SS', type: 'kill', mob: 'demon_soldier', n: 12, name: 'War Contribution', desc: 'The front needs heroes. Slay 12 Demon Soldiers.', gold: 4500, xp: 8000, pts: 75 },
    { rank: 'SS', type: 'kill', mob: 'dark_knight', n: 10, name: 'Fallen Order', desc: 'Knights who knelt to the Demon Lord. Grant them rest — 10.', gold: 4800, xp: 8500, pts: 78 },
    // SSS
    { rank: 'SSS', type: 'boss', mob: 'demon_general', name: 'General Vorgath', desc: 'The Demon Rift is held by General Vorgath. Break the Rift.', gold: 9000, xp: 18000, pts: 110 },
    { rank: 'SSS', type: 'boss', mob: 'ancient_dragon', name: 'The Ancient', desc: 'Vharaxes has woken on the Dragon Perch. May the gods keep you.', gold: 12000, xp: 24000, pts: 130 },
    { rank: 'SSS', type: 'kill', mob: 'demon_brute', n: 10, name: 'Brute Force', desc: 'Demon Brutes shatter our siege lines. Fell 10.', gold: 8000, xp: 16000, pts: 100 },
    // SSSS
    { rank: 'SSSS', type: 'boss', mob: 'demon_lord', name: 'THE DEMON LORD', desc: 'Azgareth waits on his throne in Demonspire. The war ends with one of you.', gold: 30000, xp: 60000, pts: 250 },
    // ---- expanded job board ----
    { rank: 'F', type: 'kill', mob: 'mushroom', n: 4, name: 'Spore Patrol', desc: 'Myconid spores drift into town. Stomp 4 of them.', gold: 35, xp: 25, pts: 4 },
    { rank: 'F', type: 'gather', item: 'slime_gel', n: 4, name: 'Sticky Business', desc: 'The cobbler glues soles with slime gel. Bring 4.', gold: 32, xp: 22, pts: 4 },
    { rank: 'F', type: 'kill', mob: 'slime', n: 10, name: 'Slime Overrun', desc: 'They just keep coming. Cull 10 slimes.', gold: 60, xp: 45, pts: 6 },
    { rank: 'E', type: 'kill', mob: 'bat', n: 8, name: 'Belfry Cleanup', desc: 'Cave bats roost in the mill. Clear 8.', gold: 85, xp: 70, pts: 7 },
    { rank: 'E', type: 'gather', item: 'iron_ore', n: 5, name: 'Ore Order', desc: 'The smithy needs 5 iron ore. Veins dot the fields.', gold: 90, xp: 65, pts: 7 },
    { rank: 'E', type: 'kill', mob: 'redslime', n: 6, name: 'Burning Jellies', desc: 'Red slimes scorch the crops. Quench 6.', gold: 95, xp: 80, pts: 8 },
    { rank: 'E', type: 'deliver', to: 'emberport', name: 'Desert Dispatch', desc: 'Carry sealed orders to Trader Nadia in Emberport.', gold: 160, xp: 120, pts: 10 },
    { rank: 'D', type: 'kill', mob: 'goblin_archer', n: 8, name: 'Arrow Thieves', desc: 'Goblin archers steal fletching supplies. Down 8.', gold: 180, xp: 170, pts: 13 },
    { rank: 'D', type: 'kill', mob: 'blueslime', n: 8, name: 'Cold Snap', desc: 'Frost slimes freeze the wells. Melt 8.', gold: 175, xp: 165, pts: 12 },
    { rank: 'D', type: 'gather', item: 'raw_meat', n: 8, name: 'Feast Preparations', desc: 'The harvest feast needs 8 cuts of meat.', gold: 165, xp: 140, pts: 12 },
    { rank: 'D', type: 'deliver', to: 'frosthold', name: 'Northbound Post', desc: 'Deliver winter supplies manifest to Hunter Skald in Frosthold.', gold: 220, xp: 200, pts: 15 },
    { rank: 'C', type: 'kill', mob: 'skeleton_mage', n: 8, name: 'Silence the Bones', desc: 'Skeleton mages chant in the crypt. Silence 8.', gold: 420, xp: 470, pts: 22 },
    { rank: 'C', type: 'gather', item: 'bone_frag', n: 10, name: 'Reliquary Order', desc: 'The temple wants 10 bone fragments for cleansing rites.', gold: 380, xp: 360, pts: 20 },
    { rank: 'C', type: 'escort', to: 'emberport', name: 'Caravan South', desc: 'Escort a spice merchant across the dunes to Emberport.', gold: 550, xp: 520, pts: 26 },
    { rank: 'B', type: 'kill', mob: 'direwolf', n: 8, name: 'Alpha Hunt', desc: 'Dire wolves lead the packs now. Cull 8.', gold: 800, xp: 950, pts: 31 },
    { rank: 'B', type: 'gather', item: 'feather', n: 8, name: 'Fletcher\'s Contract', desc: 'Harpy feathers make the finest arrows. Bring 8.', gold: 760, xp: 900, pts: 30 },
    { rank: 'B', type: 'boss', mob: 'emerald_wyrm', name: 'The Green Terror', desc: 'A wyrm nests in the western woods, poisoning the streams. Slay the Emerald Wyrm.', gold: 1200, xp: 1600, pts: 40 },
    { rank: 'A', type: 'kill', mob: 'imp', n: 10, name: 'Fire Starters', desc: 'Imps torch the eastern farms. Extinguish 10.', gold: 1450, xp: 2100, pts: 43 },
    { rank: 'A', type: 'kill', mob: 'hound', n: 10, name: 'Hounds of Ash', desc: 'Lava hounds prowl the deep roads. Put down 10.', gold: 1500, xp: 2200, pts: 44 },
    { rank: 'S', type: 'kill', mob: 'icebat', n: 12, name: 'Frozen Skies', desc: 'Frost bats blind the northern watch. Clear 12.', gold: 2500, xp: 4100, pts: 56 },
    { rank: 'S', type: 'kill', mob: 'drake', n: 8, name: 'Drake Season', desc: 'Ember drakes circle the passes. Ground 8 for good.', gold: 2700, xp: 4400, pts: 58 },
    { rank: 'SS', type: 'boss', mob: 'frost_wyrm', name: 'Sylvarra', desc: 'The Frost Wyrm Sylvarra has woken in the northern peaks. End her long winter.', gold: 5500, xp: 10000, pts: 85 },
    { rank: 'SS', type: 'kill', mob: 'lich', n: 6, name: 'Council of Bones', desc: 'Six liches serve the Rift. Unmake them.', gold: 5200, xp: 9500, pts: 82 },
    { rank: 'SS', type: 'gather', item: 'dragon_scale', n: 5, name: 'Scales of Legend', desc: 'The Royal Forge will pay a fortune for 5 dragon scales.', gold: 6000, xp: 8800, pts: 80 },
    { rank: 'SSS', type: 'boss', mob: 'void_dragon', name: 'Karvenoth', desc: 'The Void Dragon Karvenoth circles the corruption. Even the demons fear it.', gold: 14000, xp: 26000, pts: 140 },
    { rank: 'SSS', type: 'kill', mob: 'demon_guard', n: 10, name: 'Citadel Vanguard', desc: 'The Demon King\'s guards mass at his gates. Break 10 of them.', gold: 10000, xp: 20000, pts: 115 },
    { rank: 'SSSS', type: 'kill', mob: 'greater_demon', n: 8, name: 'Greater Purge', desc: 'Greater Demons stalk the Citadel halls. Fell 8.', gold: 18000, xp: 35000, pts: 160 },
    { rank: 'SSSS', type: 'kill', mob: 'void_reaper', n: 8, name: 'Reap the Reapers', desc: 'Void Reapers harvest souls for the King. Banish 8.', gold: 20000, xp: 38000, pts: 170 },
    { rank: 'SSSS', type: 'boss', mob: 'gen_ignaroth', name: 'The Cinder General', desc: 'Ignaroth guards the Citadel forges. His rune of fire can be yours.', gold: 25000, xp: 45000, pts: 200 },
    { rank: 'SSSS', type: 'boss', mob: 'gen_morgrim', name: 'The Frozen General', desc: 'Morgrim froze a thousand knights. Take his rune of frost.', gold: 25000, xp: 45000, pts: 200 },
    { rank: 'SSSS', type: 'boss', mob: 'gen_voltrag', name: 'The Storm General', desc: 'Voltrag strikes faster than lightning. Take his rune of storms.', gold: 25000, xp: 45000, pts: 200 },
    { rank: 'SSSS', type: 'boss', mob: 'gen_nyxara', name: 'The Hollow General', desc: 'Nyxara speaks with the voice of the void. Take her rune.', gold: 25000, xp: 45000, pts: 200 },
    { rank: 'SSSS', type: 'boss', mob: 'demon_king', name: 'THE DEMON KING', desc: 'Malzevoth, King of all Demons, holds the Master Rune. The hardest fight in Eldoria. Bring an army — or become one.', gold: 60000, xp: 120000, pts: 400 },
  ];

  // ---------------- story chapters ----------------
  DATA.STORY = [
    { id: 0, title: 'Awakening', type: 'talk', npc: 'elder', where: 'Riverwood', text: 'You wake in Riverwood village with ash on the wind. Speak with Elder Rowan.', reward: { gold: 20, xp: 15 } },
    { id: 1, title: 'Pest Control', type: 'kill', mob: 'slime', n: 5, text: 'Prove yourself. Clear 5 slimes from the fields around Riverwood.', reward: { gold: 50, xp: 40, item: 'potion_s', itemN: 3 } },
    { id: 2, title: 'The Guild', type: 'talk', npc: 'guildmaster', where: 'Riverwood', text: 'Register with the Adventurer Guild. Every legend starts at rank F.', reward: { gold: 30, xp: 30 } },
    { id: 3, title: 'Into the Caves', type: 'boss', mob: 'king_slime', text: 'The Slime Caves birthed something enormous. Slay the King Slime.', reward: { gold: 200, xp: 250, item: 'iron_sword' } },
    { id: 4, title: 'Road to the Capital', type: 'talk', npc: 'king', where: 'Aldenhaven', text: 'Travel east to the capital Aldenhaven and seek an audience with King Aldric II.', reward: { gold: 150, xp: 200 } },
    { id: 5, title: 'The War Council', type: 'faction', text: 'The Demon Lord Azgareth wages war from the north-east. Choose your path: join the Royal Army, sign as a Mercenary, or walk alone.', reward: { gold: 100, xp: 150 } },
    { id: 6, title: 'Goblin Menace', type: 'boss', mob: 'goblin_chief', text: 'Goblins raid under demon banners now. Cut off their head: Chief Grukk in the Goblin Warrens.', reward: { gold: 400, xp: 600, item: 'chain_mail' } },
    { id: 7, title: 'The Dead Rise', type: 'boss', mob: 'bone_lord', text: 'Azgareth\'s necromancers woke the Sunken Crypt. Destroy the Bone Lord.', reward: { gold: 800, xp: 1400, item: 'potion_l', itemN: 5 } },
    { id: 8, title: 'Embers Below', type: 'boss', mob: 'flame_golem', text: 'The Molten Depths feed the demon forges. Topple the Molten Colossus.', reward: { gold: 2000, xp: 4000, item: 'elixir', itemN: 2 } },
    { id: 9, title: 'The Frozen General', type: 'boss', mob: 'frost_tyrant', text: 'Ymrik the Frost Tyrant guards the northern flank. Melt his grip on the mountains.', reward: { gold: 4000, xp: 8000, item: 'kings_ring' } },
    { id: 10, title: 'Breaking the Line', type: 'kill', mob: 'demon_soldier', n: 10, text: 'Join the battle at the war front in the Ashen Marches. Break the demon line — 10 soldiers.', reward: { gold: 5000, xp: 10000 } },
    { id: 11, title: 'The General', type: 'boss', mob: 'demon_general', text: 'General Vorgath commands the Rift. With him gone, Demonspire stands open.', reward: { gold: 8000, xp: 16000, item: 'elixir', itemN: 3 } },
    { id: 12, title: 'The Demon Lord', type: 'boss', mob: 'demon_lord', text: 'March on Demonspire Citadel. Face Azgareth. End the war.', reward: { gold: 30000, xp: 50000, item: 'hero_sword' } },
    { id: 13, title: 'Whispers of a King', type: 'talk', npc: 'king', where: 'Aldenhaven', text: 'Azgareth is dust, yet the corruption does not fade. King Aldric has grim news: the Demon Lord served a greater master. Return to the capital.', reward: { gold: 5000, xp: 10000 } },
    { id: 14, title: 'The King of Demons', type: 'boss', mob: 'demon_king', text: 'Beyond the Rift stands the Demon King\'s Citadel, crawling with demons and guarded by his four Generals. Face Malzevoth, the true King of Demons, and claim the Master Rune.', reward: { gold: 50000, xp: 100000, item: 'elixir', itemN: 5 } },
    { id: 15, title: 'Dawn over Eldoria', type: 'done', text: 'The Demon King has fallen and his rune is yours. Bards will sing of you forever, hero. (Story complete — the world is yours.)', reward: {} },
  ];

  // ---------------- crafting ----------------
  DATA.RECIPES = [
    { id: 'r_potion_s', out: 'potion_s', n: 1, mats: { herb: 2 }, req: 1 },
    { id: 'r_potion_m', out: 'potion_m', n: 1, mats: { herb: 3, slime_gel: 1 }, req: 5 },
    { id: 'r_potion_l', out: 'potion_l', n: 1, mats: { herb: 4, redherb: 2, slime_gel: 2 }, req: 15 },
    { id: 'r_mana_s', out: 'mana_s', n: 1, mats: { herb: 1, magic_stone: 1 }, req: 3 },
    { id: 'r_mana_m', out: 'mana_m', n: 1, mats: { redherb: 1, magic_stone: 2 }, req: 12 },
    { id: 'r_antidote', out: 'antidote', n: 2, mats: { herb: 2, spider_silk: 1 }, req: 6 },
    { id: 'r_cooked', out: 'cooked_meat', n: 1, mats: { raw_meat: 1, wood: 1 }, req: 1 },
    { id: 'r_torch', out: 'torch_item', n: 2, mats: { wood: 1, slime_gel: 1 }, req: 1 },
    { id: 'r_magiclight', out: 'magic_light', n: 1, mats: { magic_stone: 2, crystal_shard: 1 }, req: 10 },
    { id: 'r_ironsword', out: 'iron_sword', n: 1, mats: { iron_ore: 3, wood: 1 }, req: 4 },
    { id: 'r_ironshield', out: 'iron_shield', n: 1, mats: { iron_ore: 4, wood: 2 }, req: 6 },
    { id: 'r_steelsword', out: 'steel_sword', n: 1, mats: { iron_ore: 8, wood: 2, slime_gel: 2 }, req: 10 },
    { id: 'r_chainmail', out: 'chain_mail', n: 1, mats: { iron_ore: 10, wolf_pelt: 2 }, req: 12 },
    { id: 'r_hunterbow', out: 'hunter_bow', n: 1, mats: { wood: 6, spider_silk: 3 }, req: 10 },
    { id: 'r_elixir', out: 'elixir', n: 1, mats: { redherb: 3, magic_stone: 3, crystal_shard: 1 }, req: 20 },
    { id: 'r_dragonshield', out: 'dragon_shield', n: 1, mats: { dragon_scale: 5, iron_ore: 10, crystal_shard: 2 }, req: 30 },
  ];

  // ---------------- shops ----------------
  DATA.SHOPS = {
    riverwood_black: { name: 'Riverwood Smithy', tabs: { Weapons: ['wooden_sword', 'club', 'short_bow', 'apprentice_staff', 'iron_sword', 'iron_mace'], Armor: ['cloth_tunic', 'leather_cap', 'leather_armor', 'sandals', 'leather_boots', 'wooden_shield'] } },
    riverwood_gen: { name: 'Riverwood General Store', tabs: { Goods: ['potion_s', 'mana_s', 'bread', 'antidote', 'torch_item'] } },
    oakstead_gen: { name: 'Oakstead Trading Post', tabs: { Goods: ['potion_s', 'mana_s', 'bread', 'cooked_meat', 'torch_item', 'wooden_shield', 'leather_boots'] } },
    alden_black: { name: 'Royal Forge', tabs: { Weapons: ['iron_sword', 'steel_sword', 'knight_sword', 'iron_mace', 'war_hammer', 'hunter_bow'], Armor: ['chain_mail', 'knight_armor', 'iron_helm', 'knight_helm', 'iron_greaves', 'iron_shield', 'tower_shield', 'knight_shield'] } },
    alden_magic: { name: 'The Gilded Grimoire', tabs: { Staves: ['oak_staff', 'crystal_staff', 'arch_staff'], Gear: ['mage_hood', 'mage_robe', 'silver_ring', 'holy_symbol'], Tomes: ['tome_bladebeam', 'tome_earthslam', 'tome_blizzard'] } },
    alden_potion: { name: 'Bubbling Cauldron', tabs: { Potions: ['potion_s', 'potion_m', 'potion_l', 'mana_s', 'mana_m', 'antidote', 'elixir'] } },
    ember_black: { name: 'Emberport Forge', tabs: { Weapons: ['steel_sword', 'war_hammer', 'elven_bow', 'flame_sword'], Armor: ['knight_armor', 'iron_greaves', 'knight_shield', 'ruby_ring'] } },
    frost_black: { name: 'Frosthold Armory', tabs: { Weapons: ['knight_sword', 'storm_staff', 'frost_sword', 'holy_mace'], Armor: ['knight_helm', 'swift_boots', 'tower_shield', 'dragon_greaves'] } },
    merchant_guild: { name: 'Merchant Guild', tabs: { License: ['merchant_permit'], Supplies: ['torch_item', 'magic_light', 'bread', 'cooked_meat'] } },
  };

  // ---------------- dialogue ----------------
  DATA.DIALOGUE = {
    elder: { name: 'Elder Rowan', portrait: { hair: 4, skin: 0, cls: 'tank' }, lines: ['Ah, you\'re awake at last. The ash you smell drifts from the north-east — the Demon Lord\'s war.', 'Eldoria needs blades, spells and stubborn hearts. Start small: the slimes in our fields grow bold.', 'When you\'re ready, register at the Adventurer Guild. And take the road east to the capital someday — the King calls for heroes.'] },
    guildmaster: { name: 'Guildmaster Berta', portrait: { hair: 2, skin: 1, cls: 'swordsman' }, lines: ['Welcome to the Adventurer Guild! Jobs run from rank F — herb picking and rat stomping — to SSSS. Only a legend takes that last one.', 'Finish jobs, earn guild points, climb the ranks. The board is right here. Don\'t die; the paperwork is dreadful.'] },
    king: { name: 'King Aldric II', portrait: { hair: 4, skin: 0, cls: 'tank' }, lines: ['So you are the adventurer the villages speak of. Welcome to Aldenhaven.', 'Azgareth\'s legions burn the Ashen Marches. My soldiers hold the line, but we need heroes, not just spears.', 'Join the Royal Army, fight as a free blade, or carve your own path — but fight. Eldoria remembers its heroes.'] },
    merchant_gm: { name: 'Guildmaster Coin', portrait: { hair: 0, skin: 2, cls: 'ranger' }, lines: ['The Merchant Guild welcomes anyone whose gold jingles. Buy a permit and the marketplace stalls are yours — buy low, sell high.', 'With a permit you trade at proper merchant prices. Without one? Tourist prices, friend.'] },
    innkeeper: { name: 'Innkeeper', portrait: { hair: 3, skin: 0, cls: 'swordsman' }, lines: ['A warm bed and a hot meal — 10 gold. Your wounds will thank you, and you\'ll wake up right here if the worst happens out there.'] },
    priest: { name: 'Priest of Dawn', portrait: { hair: 4, skin: 1, cls: 'mage' }, lines: ['The Light keeps this sanctuary. Fall in battle, and you will wake at the last altar where you prayed.'] },
    armycaptain: { name: 'Captain Elric', portrait: { hair: 1, skin: 1, cls: 'tank' }, lines: ['The Royal Army pays steady coin for demon horns and holds the line at the Ashen Marches.', 'Enlist and fight beside us — or stay a free blade. Either way, demons don\'t care whose banner kills them.'] },
    merc_broker: { name: 'Sable the Broker', portrait: { hair: 1, skin: 2, cls: 'ranger' }, lines: ['Mercenary work: no banners, no salutes, just contracts and coin. War pay runs half again the army\'s rate.', 'Sign with me and every demon you drop at the front pays a premium.'] },
  };

  // ---------------- generic drop pools (level-scaled monster loot) ----------------
  DATA.DROP_POOLS = {};
  for (const id in I) {
    const it = I[id];
    if (it.type === 'special' || it.type === 'tome' || it.type === 'rune') continue;
    if (id === 'demon_heart' || id === 'merchant_permit' || id === 'escort_writ') continue;
    (DATA.DROP_POOLS[it.rarity] = DATA.DROP_POOLS[it.rarity] || []).push(id);
  }
  // not guaranteed: weak monsters drop little and poor, strong monsters drop better
  DATA.rollWorldDrop = function (lvl) {
    if (Math.random() > 0.22 + Math.min(0.18, lvl * 0.004)) return null; // most kills drop nothing extra
    const r = Math.random() * 100;
    let rar = 'common';
    if (lvl >= 35 && r < 0.6) rar = 'mythical';
    else if (lvl >= 26 && r < 2.2) rar = 'legendary';
    else if (lvl >= 18 && r < 6 + lvl * 0.12) rar = 'epic';
    else if (lvl >= 10 && r < 15 + lvl * 0.35) rar = 'rare';
    else if (lvl >= 4 && r < 42 + lvl * 0.6) rar = 'uncommon';
    const pool = DATA.DROP_POOLS[rar];
    if (!pool || !pool.length) return null;
    return pool[(Math.random() * pool.length) | 0];
  };

  // cross-class spell training: anyone can learn other schools with enough levels + gold
  DATA.trainReq = s => s.lvl + 8;
  DATA.trainCost = s => 200 + s.lvl * 120;

  // ---------------- misc ----------------
  DATA.xpForLevel = lvl => Math.floor(24 * Math.pow(lvl, 1.65));
  DATA.INN_PRICE = 10;
  DATA.FACTIONS = {
    royal: { name: 'Royal Army', desc: 'Steady pay, army discount at shops (10%), war quests.', color: '#4f8fe0' },
    mercenary: { name: 'Mercenary', desc: '+50% gold from demons at the war front.', color: '#f0a132' },
    none: { name: 'Independent', desc: 'No masters. +10% XP from all sources.', color: '#b8b8b0' },
  };
})();
