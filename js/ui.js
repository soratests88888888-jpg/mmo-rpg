/* ============================================================
   ASHES OF ELDORIA — ui.js
   HUD, windows, tooltips, dialogs, minimap, chat.
   ============================================================ */
(function () {
  'use strict';
  const UI = (window.UI = {});
  const $ = id => document.getElementById(id);
  const D = () => window.DATA, P = () => GAME.player;

  let openWindows = new Set();
  let currentShop = null, dialogNpc = null, dialogLine = 0;

  // ---------------- generic window mgmt ----------------
  UI.toggle = function (id) {
    const el = $(id);
    if (!el) return;
    if (el.style.display === 'flex') { el.style.display = 'none'; openWindows.delete(id); }
    else {
      el.style.display = 'flex'; openWindows.add(id);
      if (id === 'win-inventory') UI.refreshInv();
      if (id === 'win-character') UI.refreshChar();
      if (id === 'win-skills') UI.refreshSkills();
      if (id === 'win-quests') UI.refreshQuests();
      if (id === 'win-map') UI.drawWorldMap();
      if (id === 'win-social') UI.refreshSocial();
    }
    AUDIO.sfx('click');
  };
  UI.open = function (id) { const el = $(id); if (el) { el.style.display = 'flex'; openWindows.add(id); } };
  UI.close = function (id) { const el = $(id); if (el) { el.style.display = 'none'; openWindows.delete(id); } if (id === 'win-shop') currentShop = null; };
  UI.closeAll = function () { for (const id of [...openWindows]) UI.close(id); hideTooltip(); };
  document.querySelectorAll('.x-btn[data-close]').forEach(x => {
    x.onclick = () => UI.close(x.getAttribute('data-close'));
  });

  // ---------------- HUD ----------------
  UI.showHud = function () { $('hud').style.display = 'block'; $('start-screen').style.display = 'none'; };
  UI.setPortrait = function (portrait) {
    const c = $('portrait-canvas'); c.width = portrait.width; c.height = portrait.height;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(portrait, 0, 0);
  };
  UI.refreshHud = function () {
    const p = P();
    if (!p.maxHp) return;
    $('hp-fill').style.transform = 'scaleX(' + Math.max(0, p.hp / p.maxHp) + ')';
    $('mp-fill').style.transform = 'scaleX(' + Math.max(0, p.mp / p.maxMp) + ')';
    $('hp-txt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
    $('mp-txt').textContent = Math.floor(p.mp) + ' / ' + p.maxMp;
    const need = D().xpForLevel(p.level);
    $('xp-fill').style.transform = 'scaleX(' + Math.min(1, p.xp / need) + ')';
    $('xp-txt').textContent = '';
    $('hud-level').textContent = p.level;
    // buffs
    const bb = $('hud-buffs'); bb.innerHTML = '';
    for (const b of p.buffs) {
      const d = document.createElement('div'); d.className = 'buff-ico'; d.title = b.name;
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      c.getContext('2d').drawImage(PXA.spellIcon(b.icon || 'regen'), 0, 0);
      c.style.width = '22px'; c.style.height = '22px';
      d.appendChild(c); bb.appendChild(d);
    }
    for (const k in p.effects) {
      const d = document.createElement('div'); d.className = 'buff-ico'; d.title = k;
      d.textContent = k === 'burn' ? '🔥' : k === 'poison' ? '☠' : '❄'; d.style.fontSize = '14px';
      bb.appendChild(d);
    }
  };
  UI.setMapLabel = function (name) { $('minimap-label').textContent = name.toUpperCase(); };

  let hudTick = 0;
  UI.tick = function (dt) {
    hudTick += dt;
    if (hudTick > 0.25) {
      hudTick = 0;
      UI.refreshHud();
      drawMinimap();
      updateHotbarCds();
      const t = GAME.time, hh = String(t / 60 | 0).padStart(2, '0'), mm = String(t % 60 | 0).padStart(2, '0');
      $('clock-label').textContent = 'Day ' + GAME.day + ' — ' + hh + ':' + mm;
    }
  };

  // ---------------- hotbar ----------------
  function buildHotbar() {
    const hb = $('hotbar'); hb.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('div');
      s.className = 'slot'; s.dataset.i = i;
      s.innerHTML = '<span class="key">' + (i + 1) + '</span><div class="cd" style="display:none"></div>';
      s.onclick = () => GAME.useHotbar(i);
      s.oncontextmenu = e => { e.preventDefault(); P().hotbar[i] = null; UI.refreshHotbar(); };
      s.onmouseenter = e => { const h = P().hotbar[i]; if (h) showHotbarTip(e, h); };
      s.onmouseleave = hideTooltip;
      hb.appendChild(s);
    }
  }
  UI.refreshHotbar = function () {
    const hb = $('hotbar');
    if (!hb.children.length) buildHotbar();
    for (let i = 0; i < 8; i++) {
      const el = hb.children[i];
      const h = P().hotbar[i];
      // clear old canvas/count
      [...el.querySelectorAll('canvas,.cnt')].forEach(x => x.remove());
      el.className = 'slot';
      if (!h) continue;
      const c = document.createElement('canvas'); c.width = 18; c.height = 18;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      if (h.t === 'spell') g.drawImage(PXA.spellIcon(D().SPELLS[h.id].icon), 1, 1);
      else {
        const def = D().ITEMS[h.id];
        g.drawImage(PXA.icon(def.icon, def.iconPal), 0, 0);
        const cnt = document.createElement('span');
        cnt.className = 'cnt'; cnt.textContent = GAME.countItem(h.id);
        el.appendChild(cnt);
      }
      el.insertBefore(c, el.querySelector('.cd'));
    }
  };
  function updateHotbarCds() {
    const hb = $('hotbar');
    for (let i = 0; i < 8 && i < hb.children.length; i++) {
      const h = P().hotbar[i];
      const cd = hb.children[i].querySelector('.cd');
      if (!cd) continue;
      if (h && h.t === 'spell') {
        const rem = GAME.spellCd(h.id), total = D().SPELLS[h.id].cd;
        if (rem > 0.05) { cd.style.display = 'block'; cd.style.transform = 'scaleY(' + rem / total + ')'; }
        else cd.style.display = 'none';
      } else cd.style.display = 'none';
    }
  }
  function showHotbarTip(e, h) {
    if (h.t === 'spell') showSpellTip(e, D().SPELLS[h.id]);
    else showItemTip(e, h.id);
  }

  // ---------------- tooltips ----------------
  const tt = () => $('tooltip');
  function showTooltipAt(e, html) {
    const t = tt();
    t.innerHTML = html;
    t.style.display = 'block';
    const x = Math.min(window.innerWidth - 300, e.clientX + 16);
    const y = Math.min(window.innerHeight - 160, e.clientY + 12);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  function hideTooltip() { tt().style.display = 'none'; }
  UI.hideTooltip = hideTooltip;
  function showItemTip(e, id) {
    const def = D().ITEMS[id];
    if (!def) return;
    const r = D().RARITY[def.rarity];
    let html = '<div class="tt-name" style="color:' + r.color + '">' + def.name + '</div>';
    html += '<div class="tt-type">' + r.name + ' ' + def.type + (def.kind ? ' (' + def.kind + ')' : '') + '</div>';
    const stats = [];
    if (def.atk) stats.push('+' + def.atk + ' ATK');
    if (def.matk) stats.push('+' + def.matk + ' MATK');
    if (def.def) stats.push('+' + def.def + ' DEF');
    if (def.hp) stats.push('+' + def.hp + ' HP');
    if (def.mp) stats.push('+' + def.mp + ' MP');
    if (def.agi) stats.push('+' + def.agi + ' AGI');
    if (stats.length) html += '<div class="tt-stat">' + stats.join('  ') + '</div>';
    if (def.use) {
      const u = [];
      if (def.use.heal) u.push('Restores ' + def.use.heal + ' HP');
      if (def.use.mana) u.push('Restores ' + def.use.mana + ' MP');
      if (def.use.cure) u.push('Cures ' + def.use.cure);
      html += '<div class="tt-use">' + u.join(', ') + '</div>';
    }
    if (def.fx) html += '<div class="tt-use">On hit: ' + def.fx + '</div>';
    if (def.light) html += '<div class="tt-use">Light radius: ' + def.light + '</div>';
    html += '<div class="tt-desc">' + def.desc + '</div>';
    html += '<div class="tt-type">Value: ' + def.price + 'g</div>';
    showTooltipAt(e, html);
  }
  function showSpellTip(e, s) {
    let html = '<div class="tt-name" style="color:' + (s.color || '#fff') + '">' + s.name + '</div>';
    html += '<div class="tt-type">' + (s.cls === 'all' ? 'Universal' : D().CLASSES[s.cls].name) + ' — Lv' + s.lvl + '</div>';
    if (s.dmg) html += '<div class="tt-stat">Power: ' + s.dmg + '</div>';
    if (s.heal) html += '<div class="tt-stat">Heals: ' + s.heal + '</div>';
    html += '<div class="tt-stat">' + s.mp + ' MP — ' + s.cd + 's cooldown</div>';
    html += '<div class="tt-desc">' + s.desc + '</div>';
    showTooltipAt(e, html);
  }

  // ---------------- inventory ----------------
  const EQUIP_LAYOUT = [['helmet', 'amulet', 'ring'], ['weapon', 'armor', 'shield'], [null, 'boots', null]];
  function itemCanvas(id) {
    const def = D().ITEMS[id];
    const c = document.createElement('canvas'); c.width = 18; c.height = 18;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(PXA.icon(def.icon, def.iconPal), 0, 0);
    return c;
  }
  UI.refreshInv = function () {
    const p = P();
    if (!p.inv) return;
    const eg = $('equip-grid'); eg.innerHTML = '';
    for (const row of EQUIP_LAYOUT) {
      for (const slotName of row) {
        const s = document.createElement('div'); s.className = 'slot';
        if (!slotName) { s.style.visibility = 'hidden'; eg.appendChild(s); continue; }
        const id = p.equip[slotName];
        if (id) {
          const def = D().ITEMS[id];
          s.classList.add('r-' + def.rarity);
          s.appendChild(itemCanvas(id));
          s.onmouseenter = e => showItemTip(e, id);
          s.onmouseleave = hideTooltip;
          s.onclick = () => { GAME.unequip(slotName); hideTooltip(); };
        } else {
          s.innerHTML = '<div class="ph">' + slotName.slice(0, 4).toUpperCase() + '</div>';
        }
        eg.appendChild(s);
      }
    }
    const ig = $('inv-grid'); ig.innerHTML = '';
    p.inv.forEach((slot, i) => {
      const s = document.createElement('div'); s.className = 'slot';
      if (slot) {
        const def = D().ITEMS[slot.id];
        s.classList.add('r-' + def.rarity);
        s.appendChild(itemCanvas(slot.id));
        if (slot.n > 1) {
          const cnt = document.createElement('span'); cnt.className = 'cnt'; cnt.textContent = slot.n;
          s.appendChild(cnt);
        }
        s.onmouseenter = e => showItemTip(e, slot.id);
        s.onmouseleave = hideTooltip;
        s.onclick = () => { GAME.useItem(i); hideTooltip(); UI.refreshHotbar(); };
        s.oncontextmenu = e => {
          e.preventDefault();
          if (currentShop) { GAME.sellItem(i); hideTooltip(); }
          else {
            // assign consumable to hotbar
            if (def.type === 'consumable') {
              const free = p.hotbar.findIndex(h => !h);
              if (free >= 0) { p.hotbar[free] = { t: 'item', id: slot.id }; UI.refreshHotbar(); UI.toast(def.name + ' → hotbar slot ' + (free + 1), '#8fd4ff'); }
            }
          }
        };
      }
      ig.appendChild(s);
    });
    $('inv-gold').textContent = 'GOLD: ' + p.gold + (currentShop ? '  (right-click to sell)' : '');
    UI.refreshHotbar();
  };

  // ---------------- character ----------------
  UI.refreshChar = function () {
    const p = P();
    const b = p.base;
    const st = D().STORY[p.story];
    const html = `
      <div style="text-align:center;font-family:'Press Start 2P';font-size:12px;color:#5c3208;margin-bottom:4px;">${p.name}</div>
      <div style="text-align:center;" class="muted">Level ${p.level} ${D().CLASSES[p.cls].name} — Guild Rank ${D().RANKS[p.rank]}</div>
      <div style="text-align:center;" class="muted">Faction: ${p.faction ? D().FACTIONS[p.faction].name : 'Independent'} ${p.permit ? '— Licensed Merchant' : ''}</div>
      <div class="hr"></div>
      ${statLine('STR', 'str', b.str, 'Melee damage')}
      ${statLine('INT', 'int', b.int, 'Magic damage & MP')}
      ${statLine('VIT', 'vit', b.vit, 'HP & defense')}
      ${statLine('AGI', 'agi', b.agi, 'Speed & crit')}
      <div style="text-align:center;margin:4px 0;color:#9c6b1a;font-size:17px;">${p.statPoints > 0 ? '★ ' + p.statPoints + ' points to spend' : ''}</div>
      <div class="hr"></div>
      <div class="stat-line"><span>Attack</span><b>${p.atk}</b></div>
      <div class="stat-line"><span>Magic Attack</span><b>${p.matk}</b></div>
      <div class="stat-line"><span>Defense</span><b>${p.def}</b></div>
      <div class="stat-line"><span>Crit Chance</span><b>${p.crit.toFixed(1)}%</b></div>
      <div class="stat-line"><span>Move Speed</span><b>${Math.round(p.speed)}</b></div>
      <div class="hr"></div>
      <div class="stat-line"><span>Guild Points</span><b>${p.guildPts}</b></div>
      <div class="stat-line"><span>Monsters Slain</span><b>${Object.values(p.kills).reduce((a, x) => a + x, 0)}</b></div>
      <div class="stat-line"><span>Bosses Slain</span><b>${Object.values(p.bossKills).reduce((a, x) => a + x, 0)}</b></div>
      <div class="stat-line"><span>Deaths</span><b>${p.deaths}</b></div>
      <div class="hr"></div>
      <div class="muted" style="text-align:center;">Story: ${st ? 'Ch.' + p.story + ' — ' + st.title : 'Complete!'}</div>`;
    $('char-body').innerHTML = html;
    $('char-body').querySelectorAll('.plus-btn').forEach(btn => {
      btn.onclick = () => GAME.addStat(btn.dataset.stat);
    });
  };
  function statLine(label, key, val, hint) {
    const p = P();
    return `<div class="stat-line"><span title="${hint}">${label} <span class="muted" style="font-size:14px;">(${hint})</span></span>
      <span><b>${val}</b>${p.statPoints > 0 ? '<span class="plus-btn" data-stat="' + key + '">+</span>' : ''}</span></div>`;
  }
  UI.refreshAll = function () {
    UI.refreshHud(); UI.refreshInv(); UI.refreshHotbar(); UI.refreshQuests();
    if (openWindows.has('win-character')) UI.refreshChar();
    if (openWindows.has('win-skills')) UI.refreshSkills();
  };

  // ---------------- skills ----------------
  UI.refreshSkills = function () {
    const p = P();
    const body = $('skills-body'); body.innerHTML = '';
    const list = Object.values(D().SPELLS).filter(s => s.cls === p.cls || s.cls === 'all');
    list.sort((a, b) => a.lvl - b.lvl);
    for (const s of list) {
      const known = p.spells.includes(s.id);
      const row = document.createElement('div');
      row.className = 'spell-row' + (known ? '' : ' locked');
      const ico = document.createElement('div'); ico.className = 's-ico';
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      c.getContext('2d').drawImage(PXA.spellIcon(s.icon), 0, 0);
      ico.appendChild(c); row.appendChild(ico);
      const mid = document.createElement('div');
      mid.innerHTML = '<div class="s-name">' + s.name + (known ? '' : (s.tome ? ' — requires tome/manual' : ' — unlocks Lv' + s.lvl)) + '</div><div class="s-desc">' + s.desc + '</div>';
      row.appendChild(mid);
      const cost = document.createElement('div'); cost.className = 's-cost';
      cost.innerHTML = s.mp + ' MP<br>' + s.cd + 's';
      row.appendChild(cost);
      if (known) {
        row.style.cursor = 'pointer';
        row.title = 'Click to add to hotbar';
        row.onclick = () => {
          const free = p.hotbar.findIndex(h => !h);
          const already = p.hotbar.findIndex(h => h && h.t === 'spell' && h.id === s.id);
          if (already >= 0) { UI.toast('Already on hotbar (' + (already + 1) + ')', '#8fd4ff'); return; }
          if (free < 0) { UI.toast('Hotbar full — right-click a slot to clear it.', '#ff9a8a'); return; }
          p.hotbar[free] = { t: 'spell', id: s.id };
          UI.refreshHotbar();
          UI.toast(s.name + ' → hotbar slot ' + (free + 1), '#8fd4ff');
        };
      }
      row.onmouseenter = e => showSpellTip(e, s);
      row.onmouseleave = hideTooltip;
      body.appendChild(row);
    }
  };

  // ---------------- quests ----------------
  UI.refreshQuests = function () {
    const p = P();
    if (!p.name) return;
    // tracker
    const qt = $('qt-list');
    let thtml = '';
    const st = D().STORY[p.story];
    if (st) {
      thtml += '<div class="qt-item"><div class="qt-name">★ ' + st.title + '</div><div class="qt-obj">' + storyObjText(st, p) + '</div></div>';
    }
    for (const j of p.jobs) {
      const tpl = D().JOBS[j.idx];
      thtml += '<div class="qt-item"><div class="qt-name">[' + tpl.rank + '] ' + tpl.name + '</div><div class="qt-obj ' + (j.done ? 'done' : '') + '">' + jobObjText(tpl, j) + '</div></div>';
    }
    qt.innerHTML = thtml || '<span class="muted">No active quests</span>';
    // full log
    const body = $('quests-body');
    if (!body) return;
    let html = '<h4 style="font-family:\'Press Start 2P\';font-size:10px;color:#7c3a08;margin:4px 0;">STORY</h4>';
    if (st) html += '<div class="q-row"><div class="q-name">Chapter ' + p.story + ': ' + st.title + '</div><div class="q-desc">' + st.text + '</div><div class="q-reward">' + storyObjText(st, p) + '</div></div>';
    else html += '<div class="muted">The story is complete. Eldoria is free!</div>';
    html += '<h4 style="font-family:\'Press Start 2P\';font-size:10px;color:#7c3a08;margin:10px 0 4px;">GUILD JOBS (' + p.jobs.length + '/4)</h4>';
    if (!p.jobs.length) html += '<div class="muted">Accept jobs at any Adventurer Guild board.</div>';
    for (const j of p.jobs) {
      const tpl = D().JOBS[j.idx];
      html += '<div class="q-row"><div class="q-name"><span class="q-rank rank-' + tpl.rank + '">' + tpl.rank + '</span>' + tpl.name + (j.done ? ' ✔ (return to guild)' : '') + '</div>' +
        '<div class="q-desc">' + tpl.desc + '</div><div class="q-reward">' + jobObjText(tpl, j) + ' — ' + tpl.gold + 'g, ' + tpl.xp + 'xp, ' + tpl.pts + ' pts</div></div>';
    }
    body.innerHTML = html;
  };
  function storyObjText(st, p) {
    const prog = p.storyProg || 0;
    if (st.type === 'kill') return 'Defeat ' + D().MOBS[st.mob].name + ': ' + Math.min(prog, st.n) + '/' + st.n;
    if (st.type === 'boss') return 'Slay ' + D().MOBS[st.mob].name;
    if (st.type === 'talk') return 'Speak with ' + (D().DIALOGUE[st.npc] ? D().DIALOGUE[st.npc].name : st.npc) + (st.where ? ' (' + st.where + ')' : '');
    if (st.type === 'faction') return 'Choose a faction at the War Front camp (or stay independent by telling Captain Elric)';
    return st.text;
  }
  function jobObjText(tpl, j) {
    if (tpl.type === 'kill') return 'Kill ' + D().MOBS[tpl.mob].name + ': ' + Math.min(j.progress, tpl.n) + '/' + tpl.n;
    if (tpl.type === 'boss') return 'Slay ' + D().MOBS[tpl.mob].name + (j.progress ? ' ✔' : '');
    if (tpl.type === 'gather') return 'Collect ' + D().ITEMS[tpl.item].name + ': ' + Math.min(j.progress, tpl.n) + '/' + tpl.n;
    if (tpl.type === 'escort') return 'Escort to ' + tpl.to + (j.done ? ' ✔' : '');
    if (tpl.type === 'deliver') return 'Deliver to ' + tpl.to + (j.done ? ' ✔' : '');
    return '';
  }

  // ---------------- guild ----------------
  UI.openGuild = function () {
    UI.open('win-guild');
    buildTabs('guild-tabs', ['Job Board', 'My Jobs', 'Ranks'], tab => renderGuildTab(tab));
    renderGuildTab('Job Board');
  };
  function renderGuildTab(tab) {
    const p = P();
    const body = $('guild-body');
    if (tab === 'Job Board') {
      let html = '<div class="muted" style="margin-bottom:6px;">Your rank: <b>' + D().RANKS[p.rank] + '</b> (' + p.guildPts + ' pts). You may accept jobs up to your rank.</div>';
      D().JOBS.forEach((tpl, idx) => {
        const rankIdx = D().RANKS.indexOf(tpl.rank);
        const locked = rankIdx > p.rank;
        const active = p.jobs.some(j => j.idx === idx);
        html += '<div class="q-row" style="' + (locked ? 'opacity:.45;' : '') + '">' +
          '<div class="q-name"><span class="q-rank rank-' + tpl.rank + '">' + tpl.rank + '</span>' + tpl.name + '</div>' +
          '<div class="q-desc">' + tpl.desc + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">' +
          '<span class="q-reward">' + tpl.gold + 'g — ' + tpl.xp + 'xp — ' + tpl.pts + ' guild pts</span>' +
          (locked ? '<span class="muted">rank ' + tpl.rank + ' required</span>' :
            active ? '<span class="muted">accepted</span>' :
              '<button class="pbtn green" style="font-size:9px;padding:6px 8px;" data-accept="' + idx + '">ACCEPT</button>') +
          '</div></div>';
      });
      body.innerHTML = html;
      body.querySelectorAll('[data-accept]').forEach(b => b.onclick = () => { GAME.acceptJob(+b.dataset.accept); renderGuildTab('Job Board'); });
    } else if (tab === 'My Jobs') {
      let html = '';
      if (!p.jobs.length) html = '<div class="muted">No active jobs. Check the board!</div>';
      for (const j of p.jobs) {
        const tpl = D().JOBS[j.idx];
        html += '<div class="q-row"><div class="q-name"><span class="q-rank rank-' + tpl.rank + '">' + tpl.rank + '</span>' + tpl.name + '</div>' +
          '<div class="q-reward">' + jobObjText(tpl, j) + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:4px;">' +
          (j.done ? '<button class="pbtn" style="font-size:9px;padding:6px 8px;" data-turnin="' + p.jobs.indexOf(j) + '">TURN IN</button>' : '<span class="muted">in progress...</span>') +
          '<button class="pbtn red" style="font-size:9px;padding:6px 8px;" data-abandon="' + p.jobs.indexOf(j) + '">ABANDON</button>' +
          '</div></div>';
      }
      body.innerHTML = html;
      body.querySelectorAll('[data-turnin]').forEach(b => b.onclick = () => { GAME.turnInJob(p.jobs[+b.dataset.turnin]); renderGuildTab('My Jobs'); });
      body.querySelectorAll('[data-abandon]').forEach(b => b.onclick = () => { p.jobs.splice(+b.dataset.abandon, 1); UI.refreshQuests(); renderGuildTab('My Jobs'); });
    } else {
      let html = '<div class="muted" style="margin-bottom:6px;">Complete jobs to earn guild points and climb the ranks:</div>';
      D().RANKS.forEach((r, i) => {
        const pts = D().RANK_POINTS[i];
        const here = p.rank === i;
        html += '<div class="stat-line" style="' + (here ? 'background:rgba(232,179,75,.3);' : '') + '">' +
          '<span><span class="q-rank rank-' + r + '">' + r + '</span> ' + (i === 9 ? 'Living Legend' : i >= 7 ? 'Hero' : i >= 5 ? 'Elite' : i >= 3 ? 'Veteran' : 'Novice') + '</span>' +
          '<b>' + pts + ' pts ' + (p.guildPts >= pts ? '✔' : '') + '</b></div>';
      });
      body.innerHTML = html;
    }
  }

  // ---------------- tabs helper ----------------
  function buildTabs(containerId, names, onPick) {
    const bar = $(containerId); bar.innerHTML = '';
    names.forEach((n, i) => {
      const t = document.createElement('div');
      t.className = 'tab' + (i === 0 ? ' sel' : '');
      t.textContent = n.toUpperCase();
      t.onclick = () => {
        bar.querySelectorAll('.tab').forEach(x => x.classList.remove('sel'));
        t.classList.add('sel');
        onPick(n);
        AUDIO.sfx('click');
      };
      bar.appendChild(t);
    });
  }

  // ---------------- shop ----------------
  UI.openShop = function (shopId) {
    const shop = D().SHOPS[shopId];
    if (!shop) return;
    currentShop = shopId;
    UI.open('win-shop');
    UI.open('win-inventory');
    UI.refreshInv();
    $('shop-title').innerHTML = shop.name.toUpperCase() + ' <span class="x-btn" data-close="win-shop">X</span>';
    $('shop-title').querySelector('.x-btn').onclick = () => { UI.close('win-shop'); UI.refreshInv(); };
    const tabNames = Object.keys(shop.tabs);
    buildTabs('shop-tabs', tabNames, t => renderShopTab(shop, t));
    renderShopTab(shop, tabNames[0]);
  };
  function renderShopTab(shop, tab) {
    const body = $('shop-body');
    body.innerHTML = '<div class="muted" style="margin-bottom:4px;">Your gold: <b>' + P().gold + '</b> — right-click items in your inventory to sell.</div>';
    for (const id of shop.tabs[tab]) {
      const def = D().ITEMS[id];
      if (!def) continue;
      const row = document.createElement('div'); row.className = 'shop-row';
      const slot = document.createElement('div'); slot.className = 'slot r-' + def.rarity;
      slot.appendChild(itemCanvas(id));
      row.appendChild(slot);
      const mid = document.createElement('div');
      mid.innerHTML = '<div class="i-name txt-' + def.rarity + '">' + def.name + '</div><div class="i-desc">' + def.desc + '</div>';
      row.appendChild(mid);
      const right = document.createElement('div'); right.className = 'buy';
      right.innerHTML = '<div class="price">' + GAME.buyPrice(id) + 'g</div>';
      const btn = document.createElement('button');
      btn.className = 'pbtn'; btn.style.cssText = 'font-size:9px;padding:6px 8px;';
      btn.textContent = 'BUY';
      btn.onclick = () => { GAME.buyItem(id); renderShopTab(shop, tab); };
      right.appendChild(btn);
      row.appendChild(right);
      row.onmouseenter = e => showItemTip(e, id);
      row.onmouseleave = hideTooltip;
      body.appendChild(row);
    }
  }

  // ---------------- crafting ----------------
  UI.openCraft = function () {
    UI.open('win-craft');
    const body = $('craft-body'); body.innerHTML = '';
    for (const r of D().RECIPES) {
      const def = D().ITEMS[r.out];
      const div = document.createElement('div'); div.className = 'recipe';
      const slot = document.createElement('div'); slot.className = 'slot r-' + def.rarity;
      slot.appendChild(itemCanvas(r.out));
      div.appendChild(slot);
      const mid = document.createElement('div'); mid.style.flex = '1';
      let mats = '';
      let can = P().level >= r.req;
      for (const mid2 in r.mats) {
        const have = GAME.countItem(mid2);
        const ok = have >= r.mats[mid2];
        if (!ok) can = false;
        mats += '<span class="' + (ok ? 'have' : 'miss') + '">' + D().ITEMS[mid2].name + ' ' + have + '/' + r.mats[mid2] + '</span><br>';
      }
      mid.innerHTML = '<div class="i-name txt-' + def.rarity + '">' + def.name + (r.n > 1 ? ' x' + r.n : '') + '</div><div class="mats">' + mats + (P().level < r.req ? '<span class="miss">Level ' + r.req + ' required</span>' : '') + '</div>';
      div.appendChild(mid);
      const btn = document.createElement('button');
      btn.className = 'pbtn green'; btn.style.cssText = 'font-size:9px;padding:6px 8px;';
      btn.textContent = 'CRAFT';
      if (!can) btn.classList.add('disabled');
      btn.onclick = () => { if (can) { GAME.craft(r); UI.openCraft(); } };
      div.appendChild(btn);
      div.onmouseenter = e => showItemTip(e, r.out);
      div.onmouseleave = hideTooltip;
      body.appendChild(div);
    }
  };

  // ---------------- marketplace ----------------
  UI.openMarket = function () {
    UI.open('win-market');
    buildTabs('market-tabs', ['Buy', 'Sell', 'My Listings'], t => renderMarketTab(t));
    renderMarketTab('Buy');
  };
  function renderMarketTab(tab) {
    const body = $('market-body');
    const p = P();
    if (!window.NET || !NET.online()) {
      body.innerHTML = '<div class="muted">The marketplace requires an online connection. (Offline mode)</div>';
      return;
    }
    if (tab === 'Buy') {
      body.innerHTML = '<div class="muted">Loading listings...</div>';
      NET.fetchMarket().then(rows => {
        if (!rows.length) { body.innerHTML = '<div class="muted">No listings yet. Be the first merchant!</div>'; return; }
        body.innerHTML = '<div class="muted" style="margin-bottom:4px;">Your gold: <b>' + p.gold + '</b></div>';
        for (const row of rows) {
          const def = D().ITEMS[row.item_id];
          if (!def) continue;
          const div = document.createElement('div'); div.className = 'shop-row';
          const slot = document.createElement('div'); slot.className = 'slot r-' + def.rarity;
          slot.appendChild(itemCanvas(row.item_id)); div.appendChild(slot);
          const mid = document.createElement('div');
          mid.innerHTML = '<div class="i-name txt-' + def.rarity + '">' + def.name + (row.qty > 1 ? ' x' + row.qty : '') + '</div><div class="i-desc">Sold by ' + esc(row.seller_name) + '</div>';
          div.appendChild(mid);
          const right = document.createElement('div'); right.className = 'buy';
          right.innerHTML = '<div class="price">' + row.price + 'g</div>';
          if (row.seller_id !== NET.playerId()) {
            const btn = document.createElement('button');
            btn.className = 'pbtn'; btn.style.cssText = 'font-size:9px;padding:6px 8px;'; btn.textContent = 'BUY';
            btn.onclick = () => NET.buyListing(row).then(ok => { if (ok) renderMarketTab('Buy'); });
            right.appendChild(btn);
          } else right.innerHTML += '<div class="muted">yours</div>';
          div.appendChild(right);
          div.onmouseenter = e => showItemTip(e, row.item_id);
          div.onmouseleave = hideTooltip;
          body.appendChild(div);
        }
      });
    } else if (tab === 'Sell') {
      if (!p.permit) {
        body.innerHTML = '<div class="muted">Listing items requires a <b>Merchant Permit</b> — join the Merchant Guild in Aldenhaven (500g).</div>';
        return;
      }
      body.innerHTML = '<div class="muted" style="margin-bottom:6px;">Pick an item from your inventory to list:</div>';
      p.inv.forEach((slot, i) => {
        if (!slot) return;
        const def = D().ITEMS[slot.id];
        const div = document.createElement('div'); div.className = 'shop-row';
        const sl = document.createElement('div'); sl.className = 'slot r-' + def.rarity;
        sl.appendChild(itemCanvas(slot.id)); div.appendChild(sl);
        const mid = document.createElement('div');
        mid.innerHTML = '<div class="i-name txt-' + def.rarity + '">' + def.name + (slot.n > 1 ? ' x' + slot.n : '') + '</div>';
        div.appendChild(mid);
        const right = document.createElement('div'); right.className = 'buy';
        const input = document.createElement('input');
        input.type = 'number'; input.min = 1; input.value = def.price;
        input.style.cssText = 'width:80px;font-family:VT323;font-size:18px;padding:2px;background:#fff7e0;border:2px solid #7a4a22;';
        right.appendChild(input);
        const btn = document.createElement('button');
        btn.className = 'pbtn green'; btn.style.cssText = 'font-size:9px;padding:6px 8px;margin-left:4px;'; btn.textContent = 'LIST';
        btn.onclick = () => {
          const price = Math.max(1, +input.value | 0);
          NET.listItem(slot.id, 1, price).then(ok => {
            if (ok) { GAME.removeItem(slot.id, 1); UI.toast('Listed ' + def.name + ' for ' + price + 'g', '#a8e89a'); renderMarketTab('Sell'); }
          });
        };
        right.appendChild(btn);
        div.appendChild(right);
        body.appendChild(div);
      });
    } else {
      body.innerHTML = '<div class="muted">Loading...</div>';
      NET.fetchMyListings().then(rows => {
        if (!rows.length) { body.innerHTML = '<div class="muted">You have no active listings.</div>'; return; }
        body.innerHTML = '';
        for (const row of rows) {
          const def = D().ITEMS[row.item_id];
          const div = document.createElement('div'); div.className = 'shop-row';
          const sl = document.createElement('div'); sl.className = 'slot';
          sl.appendChild(itemCanvas(row.item_id)); div.appendChild(sl);
          const mid = document.createElement('div');
          mid.innerHTML = '<div class="i-name">' + def.name + '</div><div class="i-desc">' + row.price + 'g</div>';
          div.appendChild(mid);
          const btn = document.createElement('button');
          btn.className = 'pbtn red'; btn.style.cssText = 'font-size:9px;padding:6px 8px;margin-left:auto;'; btn.textContent = 'CANCEL';
          btn.onclick = () => NET.cancelListing(row).then(() => { GAME.addItem(row.item_id, row.qty); renderMarketTab('My Listings'); });
          div.appendChild(btn);
          body.appendChild(div);
        }
      });
    }
  }

  // ---------------- social ----------------
  UI.refreshSocial = function () {
    const body = $('social-body');
    if (!window.NET || !NET.online()) { body.innerHTML = '<div class="muted">Offline mode — no other adventurers visible.</div>'; return; }
    const list = NET.remoteList();
    let html = '<div class="muted" style="margin-bottom:6px;">' + (list.length + 1) + ' adventurer(s) online</div>';
    html += '<div class="stat-line"><span>★ ' + esc(P().name) + ' (you)</span><b>Lv' + P().level + ' ' + D().CLASSES[P().cls].name + '</b></div>';
    for (const rp of list) {
      html += '<div class="stat-line"><span>' + esc(rp.name) + '</span><b>Lv' + (rp.level || '?') + ' ' + (rp.cls ? D().CLASSES[rp.cls].name : '') + (rp.map !== P().map ? ' (' + (WORLD.maps[rp.map] ? WORLD.maps[rp.map].name : rp.map) + ')' : '') + '</b></div>';
    }
    body.innerHTML = html;
  };

  // ---------------- settings ----------------
  UI.openSettings = function () {
    UI.open('win-settings');
    const body = $('settings-body');
    body.innerHTML = '';
    const mkToggle = (label, get, set) => {
      const row = document.createElement('div'); row.className = 'stat-line';
      row.innerHTML = '<span>' + label + '</span>';
      const btn = document.createElement('button');
      btn.className = 'pbtn' + (get() ? ' green' : ' red');
      btn.style.cssText = 'font-size:9px;padding:6px 10px;';
      btn.textContent = get() ? 'ON' : 'OFF';
      btn.onclick = () => { set(!get()); btn.textContent = get() ? 'ON' : 'OFF'; btn.className = 'pbtn' + (get() ? ' green' : ' red'); btn.style.cssText = 'font-size:9px;padding:6px 10px;'; };
      row.appendChild(btn);
      body.appendChild(row);
    };
    mkToggle('Music', AUDIO.getMusic, AUDIO.setMusic);
    mkToggle('Sound Effects', AUDIO.getSfx, AUDIO.setSfx);
    const info = document.createElement('div');
    info.className = 'muted';
    info.style.marginTop = '10px';
    info.innerHTML = 'Connection: ' + (window.NET && NET.online() ? '<b style="color:#2e8c2a">ONLINE</b>' : '<b style="color:#c0392e">OFFLINE (local save only)</b>') +
      '<br>Progress auto-saves every few seconds.';
    body.appendChild(info);
  };

  // ---------------- dialog ----------------
  UI.openDialog = function (npc) {
    dialogNpc = npc; dialogLine = 0;
    renderDialog();
    UI.open('win-dialog');
  };
  function renderDialog() {
    const n = dialogNpc;
    const dial = n.dial ? D().DIALOGUE[n.dial] : null;
    $('dlg-name').textContent = n.name;
    const pc = $('dlg-portrait').querySelector('canvas');
    const g = pc.getContext('2d');
    g.clearRect(0, 0, pc.width, pc.height);
    const sheet = PXA.makeHero(n.look || (dial && dial.portrait) || { hair: 0, skin: 0, cls: 'swordsman' });
    pc.width = 24; pc.height = 24;
    const g2 = pc.getContext('2d'); g2.imageSmoothingEnabled = false;
    g2.drawImage(sheet.portrait, 2, 2);
    const lines = n.chat || (dial ? dial.lines : ['...']);
    $('dlg-text').textContent = lines[Math.min(dialogLine, lines.length - 1)];
    const opts = $('dlg-opts'); opts.innerHTML = '';
    const addOpt = (label, fn) => {
      const o = document.createElement('div'); o.className = 'dlg-opt'; o.textContent = label;
      o.onclick = () => { AUDIO.sfx('click'); fn(); };
      opts.appendChild(o);
    };
    if (dialogLine < lines.length - 1) addOpt('▶ Continue', () => { dialogLine++; renderDialog(); });
    else {
      if (n.action) {
        const a = n.action;
        if (a.kind === 'shop') addOpt('🛒 Browse wares', () => { UI.close('win-dialog'); UI.openShop(a.shop); });
        if (a.kind === 'inn') addOpt('🛏 Rest (' + D().INN_PRICE + 'g — heal & set respawn)', () => { GAME.rest(); UI.close('win-dialog'); });
        if (a.kind === 'guild') addOpt('📜 Job Board', () => { UI.close('win-dialog'); UI.openGuild(); });
        if (a.kind === 'market') addOpt('⚖ Open Marketplace', () => { UI.close('win-dialog'); UI.openMarket(); });
        if (a.kind === 'altar') addOpt('✨ Pray (heal & set respawn)', () => { GAME.setAltar(); UI.close('win-dialog'); });
        if (a.kind === 'faction') {
          const p = P();
          if (!p.faction) {
            addOpt('⚔ Join the ' + D().FACTIONS[a.f].name + ' — ' + D().FACTIONS[a.f].desc, () => { GAME.setFaction(a.f); UI.close('win-dialog'); });
            addOpt('🕊 Remain independent (+10% XP)', () => { GAME.setFaction('none'); UI.close('win-dialog'); });
          }
        }
      }
      addOpt('✖ Farewell', () => UI.close('win-dialog'));
    }
  }
  UI.doAction = function (action) {
    if (action.kind === 'shop') UI.openShop(action.shop);
    else if (action.kind === 'inn') { GAME.rest(); }
    else if (action.kind === 'guild') UI.openGuild();
    else if (action.kind === 'market') UI.openMarket();
    else if (action.kind === 'altar') GAME.setAltar();
  };
  UI.openSign = function (text) {
    $('dlg-name').textContent = 'Sign';
    $('dlg-text').textContent = text;
    const pc = $('dlg-portrait').querySelector('canvas');
    pc.width = 24; pc.height = 24;
    const g = pc.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(PXA.props.sign, 4, 4);
    const opts = $('dlg-opts'); opts.innerHTML = '';
    const o = document.createElement('div'); o.className = 'dlg-opt'; o.textContent = '✖ Close';
    o.onclick = () => UI.close('win-dialog');
    opts.appendChild(o);
    UI.open('win-dialog');
  };

  // ---------------- interact tip ----------------
  UI.showInteract = function (it) {
    const tip = $('interact-tip');
    if (!it) { tip.style.display = 'none'; return; }
    let label = null;
    if (it.kind === 'npc' && !it.n.invisible) label = 'Talk to ' + it.n.name;
    else if (it.kind === 'npc' && it.n.doorAction) {
      const a = it.n.doorAction;
      label = a.kind === 'shop' ? 'Enter shop' : a.kind === 'inn' ? 'Enter inn' : a.kind === 'guild' ? 'Enter guild' : 'Enter';
    }
    else if (it.kind === 'chest') label = 'Open chest';
    else if (it.kind === 'pick') label = 'Gather ' + D().ITEMS[it.o.pick].name;
    else if (it.kind === 'sign') label = 'Read sign';
    else if (it.kind === 'craft') label = 'Craft';
    else if (it.kind === 'market') label = 'Marketplace stall';
    else if (it.kind === 'exit') label = it.ex.to === 'overworld' ? 'Leave dungeon' : 'Enter ' + (WORLD.maps[it.ex.to] ? WORLD.maps[it.ex.to].name : it.ex.to);
    if (!label) { tip.style.display = 'none'; return; }
    tip.innerHTML = '<b>[E]</b> ' + label;
    tip.style.display = 'block';
  };

  // ---------------- toasts / announce / death ----------------
  UI.toast = function (text, color) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeftColor = color || '#e8b34b';
    t.textContent = text;
    $('toasts').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 3400);
    setTimeout(() => t.remove(), 3900);
    while ($('toasts').children.length > 6) $('toasts').firstChild.remove();
  };
  UI.announce = function (title, sub) {
    const a = $('announce');
    a.innerHTML = title + (sub ? '<div class="sub">' + sub + '</div>' : '');
    a.style.display = 'block';
    a.style.opacity = '1';
    clearTimeout(a._t1); clearTimeout(a._t2);
    a._t1 = setTimeout(() => { a.style.transition = 'opacity 1s'; a.style.opacity = '0'; }, 2600);
    a._t2 = setTimeout(() => { a.style.display = 'none'; a.style.transition = ''; }, 3700);
  };
  UI.showDeath = function (lostGold) {
    $('death-msg').textContent = 'You dropped ' + lostGold + ' gold. The nearest safe zone awaits.';
    $('death-screen').style.display = 'flex';
  };
  UI.hideDeath = function () { $('death-screen').style.display = 'none'; };
  $('btn-respawn').onclick = () => GAME.respawn();

  // ---------------- boss bar ----------------
  UI.showBossBar = function (name) {
    $('target-frame').style.display = 'block';
    $('target-name').textContent = name;
  };
  UI.updateBossBar = function (frac) { $('target-hp').style.transform = 'scaleX(' + Math.max(0, frac) + ')'; };
  UI.hideBossBar = function () { $('target-frame').style.display = 'none'; };

  // ---------------- chat ----------------
  const chatLog = () => $('chat-log');
  UI.addChat = function (name, text, cls) {
    const div = document.createElement('div');
    if (cls === 'sys') div.innerHTML = '<span class="c-sys">' + esc(text) + '</span>';
    else if (cls === 'combat') div.innerHTML = '<span class="c-combat">' + esc(text) + '</span>';
    else if (cls === 'loot') div.innerHTML = '<span class="c-loot">' + esc(text) + '</span>';
    else div.innerHTML = '<span class="c-name">' + esc(name) + ':</span> ' + esc(text);
    chatLog().insertBefore(div, chatLog().firstChild);
    while (chatLog().children.length > 60) chatLog().lastChild.remove();
  };
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  UI.chatFocused = function () { return document.activeElement === $('chat-input'); };
  UI.focusChat = function () {
    const inp = $('chat-input');
    inp.style.display = 'block';
    inp.focus();
  };
  $('chat-input').addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const v = $('chat-input').value.trim();
      $('chat-input').value = '';
      $('chat-input').style.display = 'none';
      $('chat-input').blur();
      if (v) {
        if (window.NET && NET.online()) NET.sendChat(v);
        else UI.addChat(P().name || 'You', v);
      }
    }
    if (e.key === 'Escape') {
      $('chat-input').value = '';
      $('chat-input').style.display = 'none';
      $('chat-input').blur();
    }
  });

  // ---------------- minimap ----------------
  let mmBase = null; // offscreen full-map image (1px per tile)
  UI.refreshMinimapBase = function () {
    const map = GAME.currentMap();
    if (!map) return;
    mmBase = document.createElement('canvas');
    mmBase.width = map.w; mmBase.height = map.h;
    const g = mmBase.getContext('2d');
    const img = g.createImageData(map.w, map.h);
    for (let i = 0; i < map.tiles.length; i++) {
      const t = WORLD.TILES[map.tiles[i]];
      const col = WORLD.TILE_COLORS[t.k] || '#000';
      const r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
      img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };
  function drawMinimap() {
    const map = GAME.currentMap();
    if (!map || !mmBase) return;
    const c = $('minimap'), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    const p = P();
    const view = 80; // tiles visible
    let sx = p.x / 16 - view / 2, sy = p.y / 16 - view / 2;
    sx = Math.max(0, Math.min(map.w - view, sx));
    sy = Math.max(0, Math.min(map.h - view, sy));
    g.drawImage(mmBase, sx, sy, view, view, 0, 0, c.width, c.height);
    const dot = (wx, wy, color, size) => {
      const x = (wx / 16 - sx) / view * c.width, y = (wy / 16 - sy) / view * c.height;
      if (x < 0 || y < 0 || x > c.width || y > c.height) return;
      g.fillStyle = color;
      g.fillRect(x - size / 2, y - size / 2, size, size);
    };
    // mobs
    for (const mb of GAME.mobs()) dot(mb.x, mb.y, mb.friendly ? '#57c14f' : (mb.def.boss ? '#ff4f6d' : '#e05050'), mb.def.boss ? 5 : 3);
    // npcs
    const map2 = GAME.currentMap();
    for (const n of map2.npcs) if (!n.invisible) dot(n.x, n.y, '#8fd4ff', 3);
    // remote players
    if (window.NET) NET.remoteList().forEach(rp => { if (rp.map === p.map) dot(rp.x, rp.y, '#ffdf8e', 4); });
    // player
    dot(p.x, p.y, '#ffffff', 4);
  }

  // ---------------- world map window ----------------
  UI.drawWorldMap = function () {
    const map = WORLD.maps.overworld;
    const c = $('worldmap-canvas');
    const size = Math.min(window.innerHeight * 0.68, 640);
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    // full overworld
    let base = mmBase;
    if (GAME.currentMap().id !== 'overworld' || !base) {
      base = document.createElement('canvas');
      base.width = map.w; base.height = map.h;
      const bg = base.getContext('2d');
      const img = bg.createImageData(map.w, map.h);
      for (let i = 0; i < map.tiles.length; i++) {
        const t = WORLD.TILES[map.tiles[i]];
        const col = WORLD.TILE_COLORS[t.k] || '#000';
        img.data[i * 4] = parseInt(col.slice(1, 3), 16);
        img.data[i * 4 + 1] = parseInt(col.slice(3, 5), 16);
        img.data[i * 4 + 2] = parseInt(col.slice(5, 7), 16);
        img.data[i * 4 + 3] = 255;
      }
      bg.putImageData(img, 0, 0);
    }
    g.drawImage(base, 0, 0, map.w, map.h, 0, 0, size, size);
    // labels
    g.font = 'bold 11px VT323, monospace';
    g.textAlign = 'center';
    for (const loc of WORLD.locations) {
      const x = loc.x / map.w * size, y = loc.y / map.h * size;
      g.fillStyle = loc.kind === 'capital' ? '#ffdf8e' : loc.kind === 'dungeon' ? '#ff9a8a' : loc.kind === 'demon' ? '#c88ae8' : loc.kind === 'war' ? '#f0a132' : '#fff';
      g.fillRect(x - 2, y - 2, 4, 4);
      g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 3;
      g.strokeText(loc.name, x, y - 5);
      g.fillText(loc.name, x, y - 5);
    }
    // player position
    if (GAME.currentMap().id === 'overworld') {
      const p = P();
      const x = p.x / 16 / map.w * size, y = p.y / 16 / map.h * size;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3b6fd0';
      g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = 'rgba(0,0,0,.5)';
      g.fillRect(0, size - 22, size, 22);
      g.fillStyle = '#ffe9c0';
      g.fillText('You are in: ' + GAME.currentMap().name, size / 2, size - 7);
    }
  };

  // settings button = gear via keybind hint; also add gear click on minimap label
  $('minimap-label').style.cursor = 'pointer';
  $('minimap-label').onclick = () => UI.openSettings();
  $('minimap-label').title = 'Click for settings';
})();