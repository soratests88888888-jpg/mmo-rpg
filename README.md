# ⚔ Ashes of Eldoria — Pixel MMO RPG

A complete browser-based pixel-art MMO RPG in plain HTML/JS/Canvas.
**Every sprite, tile, texture, icon and music track is generated in code** — no image or audio files.

**Play:** open `index.html`, or serve the folder with any static server (GitHub Pages works out of the box).

## Features

- **Hand-authored pixel art** — animated hero (4 classes × hair/skin options), 25+ monster types with animations, tiles, props, item & spell icons, textured pixel UI (parchment / wood / gold — no flat dark boxes)
- **Open world** — seeded 320×320 overworld (identical for every player): forests, desert, snow, swamp, demon-corrupted north-east, roads, day/night cycle with dynamic lighting
- **Towns & kingdoms** — Riverwood & Oakstead villages, Emberport & Frosthold towns, the walled capital **Aldenhaven** (castle + King Aldric II, shops, temple, market square), and **Demonspire Citadel**, seat of Demon Lord Azgareth
- **The War** — a live battle at the Ashen Marches war front: royal soldiers vs demon legions. Join the **Royal Army**, sign as a **Mercenary**, or stay **Independent**
- **Combat** — real-time melee / bows / magic, 30+ spells & skills (fireballs, chain lightning, blizzards, meteors, taunts, shield walls, war cries…), stats & levels, crits, burns/poison/slows/stuns
- **Classes** — Swordsman, Mage, Guardian (tank), Ranger
- **9 dungeons** — Slime Caves → Demonspire Throne, each with mobs, loot chests and a **boss fight** with attack patterns (slams, summons, volleys, dashes, breath, enrage phases)
- **Loot rarity** — Common → Uncommon → Rare → Epic → Legendary → **Mythical**
- **Adventurer Guild** — job board with ranks **F → SSSS** (herb picking & escorts at the bottom, the Demon Lord himself at the top), guild points and promotions
- **Story mode** — 13 chapters from waking up in Riverwood to ending the war
- **Crafting** — potions, torches, **Magic Light** (magic stones + crystal), weapons, armor
- **Economy** — shops, inns (heal + set respawn), merchant permit, and a **live player-to-player marketplace**
- **Multiplayer (Supabase)** — see other players move in real time, global chat, PvP arena duels in the capital, cloud character saves, shared marketplace. Falls back to offline single-player automatically
- **Chiptune soundtrack** — 8 looping tracks (title, town, overworld, dungeon, boss, demon lands, snow, arena) + ~25 sound effects, all WebAudio-synthesized

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Move |
| SPACE | Attack |
| E | Interact / talk / gather / open |
| 1–8 | Hotbar (spells & potions) |
| I / C / K / Q / M / O | Inventory / Character / Skills / Quests / Map / Online players |
| Enter | Chat |
| Esc | Close windows |

## Architecture

```
index.html      UI shell + pixel CSS theme
js/config.js    Supabase URL + publishable key
js/sprites.js   ALL pixel art, generated at runtime
js/audio.js     chiptune sequencer + SFX synth
js/data.js      items, spells, monsters, quests, story, recipes, shops
js/world.js     seeded overworld + towns + dungeon generator
js/game.js      engine: combat, AI, bosses, quests, lighting, rendering
js/ui.js        HUD, windows, tooltips, minimap, chat
js/net.js       Supabase realtime multiplayer + persistence + market
js/main.js      boot, title screen, character creation
```

### Multiplayer backend (Supabase)

- `players` — character saves (`id`, `name`, `data jsonb`); the per-player `secret` column is hidden via column-level grants and all writes go through the `save_player` RPC which verifies it
- `chat_messages` — persisted global chat history
- `market_listings` — marketplace; `buy_listing` RPC moves gold between saves atomically
- Realtime channel `eldoria-world` — presence, position broadcasts, chat, PvP hits

The publishable key in `config.js` is safe to ship; Row Level Security and
secret-checked `SECURITY DEFINER` RPCs guard all writes (the Supabase linter
flags these RPCs as publicly executable — that is intentional for an
auth-less game client).

Monsters are simulated client-side (each player fights their own spawns);
players, chat, PvP and the economy are shared.
